import type { Request, Response } from "express";
import { getTelemetryCollection } from "../config/db.js";
import { telemetryIngestService } from "../services/telemetryIngestService.js";
import { TelemetryPacketSchema, TelemetryBatchSchema } from "../types/telemetry.js";

/**
 * High-speed single telemetry ingest endpoint.
 * POST /api/v1/telemetry
 */
export async function ingestSingleTelemetry(req: Request, res: Response): Promise<void> {
  const parseResult = TelemetryPacketSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: "Invalid telemetry payload",
      details: parseResult.error.flatten(),
    });
    return;
  }

  const result = await telemetryIngestService.queueRecord(parseResult.data);

  res.status(202).json({
    success: true,
    message: "Telemetry packet queued for high-speed ingestion",
    deviceId: parseResult.data.metadata.deviceId,
    queueLength: result.queueLength,
    receivedAt: new Date().toISOString(),
  });
}

/**
 * High-throughput batch ingest endpoint (for gateways & aggregators).
 * POST /api/v1/telemetry/batch
 */
export async function ingestBatchTelemetry(req: Request, res: Response): Promise<void> {
  const parseResult = TelemetryBatchSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: "Invalid telemetry batch payload (max 5000 items)",
      details: parseResult.error.flatten(),
    });
    return;
  }

  const startTime = Date.now();
  const { insertedCount, failedCount } = await telemetryIngestService.ingestBatchDirect(parseResult.data);
  const latencyMs = Date.now() - startTime;

  res.status(201).json({
    success: true,
    message: `Batch ingestion completed: ${insertedCount} inserted`,
    insertedCount,
    failedCount,
    latencyMs,
  });
}

/**
 * Retrieve the latest telemetry packet for a specific device.
 * GET /api/v1/telemetry/latest/:deviceId
 */
export async function getLatestTelemetry(req: Request, res: Response): Promise<void> {
  const { deviceId } = req.params;
  if (!deviceId) {
    res.status(400).json({ success: false, error: "deviceId parameter is required" });
    return;
  }

  try {
    const collection = getTelemetryCollection();
    const latest = await collection.findOne(
      { "metadata.deviceId": deviceId },
      { sort: { timestamp: -1 } }
    );

    if (!latest) {
      res.status(404).json({ success: false, error: `No telemetry found for device: ${deviceId}` });
      return;
    }

    res.json({ success: true, data: latest });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Query historical time-series telemetry with optional downsampling.
 * GET /api/v1/telemetry/query?deviceId=xyz&from=...&to=...&downsample=1m&limit=100
 */
export async function queryTimeSeriesTelemetry(req: Request, res: Response): Promise<void> {
  try {
    const { deviceId, deviceType, from, to, limit = "200", downsample } = req.query;

    const matchQuery: Record<string, any> = {};

    if (deviceId) {
      matchQuery["metadata.deviceId"] = String(deviceId);
    }
    if (deviceType) {
      matchQuery["metadata.deviceType"] = String(deviceType);
    }

    if (from || to) {
      matchQuery.timestamp = {};
      if (from) matchQuery.timestamp.$gte = new Date(String(from));
      if (to) matchQuery.timestamp.$lte = new Date(String(to));
    }

    const collection = getTelemetryCollection();
    const queryLimit = Math.min(Math.max(parseInt(String(limit), 10) || 200, 1), 1000);

    // If downsample aggregation requested (e.g. downsample=1m, downsample=5m, downsample=1h)
    if (downsample && typeof downsample === "string") {
      let unit: "minute" | "hour" | "second" = "minute";
      let binSize = 1;

      if (downsample.endsWith("m")) {
        unit = "minute";
        binSize = parseInt(downsample.slice(0, -1), 10) || 1;
      } else if (downsample.endsWith("h")) {
        unit = "hour";
        binSize = parseInt(downsample.slice(0, -1), 10) || 1;
      } else if (downsample.endsWith("s")) {
        unit = "second";
        binSize = parseInt(downsample.slice(0, -1), 10) || 10;
      }

      const pipeline = [
        { $match: matchQuery },
        {
          $group: {
            _id: {
              bucket: {
                $dateTrunc: {
                  date: "$timestamp",
                  unit,
                  binSize,
                },
              },
              deviceId: "$metadata.deviceId",
            },
            avgTemperature: { $avg: "$metrics.temperature" },
            maxTemperature: { $max: "$metrics.temperature" },
            avgVibration: { $avg: "$metrics.vibration" },
            avgPowerDraw: { $avg: "$metrics.powerDraw" },
            readingCount: { $sum: 1 },
          },
        },
        { $sort: { "_id.bucket": -1 } },
        { $limit: queryLimit },
      ];

      const results = await collection.aggregate(pipeline).toArray();
      res.json({ success: true, count: results.length, downsampled: true, data: results });
      return;
    }

    // Default: Raw time-series points
    const results = await collection
      .find(matchQuery)
      .sort({ timestamp: -1 })
      .limit(queryLimit)
      .toArray();

    res.json({ success: true, count: results.length, downsampled: false, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Ingestion health & operational metrics.
 * GET /api/v1/telemetry/stats
 */
export async function getIngestStats(_req: Request, res: Response): Promise<void> {
  const stats = telemetryIngestService.getStats();
  res.json({ success: true, stats });
}
