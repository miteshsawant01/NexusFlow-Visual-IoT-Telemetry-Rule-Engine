import { getTelemetryCollection } from "../config/db.js";
import type { HardwareTelemetryRecord, TelemetryPacketInput } from "../types/telemetry.js";

export interface IngestStats {
  totalReceived: number;
  totalIngested: number;
  totalFailed: number;
  currentQueueSize: number;
  lastFlushTime: string | null;
  batchesProcessed: number;
}

class TelemetryIngestService {
  private queue: HardwareTelemetryRecord[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly maxBatchSize: number = 500;
  private readonly flushIntervalMs: number = 50; // 50ms micro-batch window
  private isFlushing: boolean = false;

  private stats: IngestStats = {
    totalReceived: 0,
    totalIngested: 0,
    totalFailed: 0,
    currentQueueSize: 0,
    lastFlushTime: null,
    batchesProcessed: 0,
  };

  constructor() {
    this.startAutoFlush();
  }

  private startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0 && !this.isFlushing) {
        this.flushQueue().catch((err) => {
          console.error("[IngestService] Error during auto-flush:", err);
        });
      }
    }, this.flushIntervalMs);
  }

  /**
   * Normalizes an incoming raw payload into a validated HardwareTelemetryRecord.
   */
  public normalizeRecord(input: TelemetryPacketInput): HardwareTelemetryRecord {
    let timestamp: Date;
    if (!input.timestamp) {
      timestamp = new Date();
    } else if (input.timestamp instanceof Date) {
      timestamp = input.timestamp;
    } else {
      timestamp = new Date(input.timestamp);
    }

    return {
      timestamp,
      metadata: {
        deviceId: input.metadata.deviceId,
        deviceType: input.metadata.deviceType || "generic_sensor",
        facilityId: input.metadata.facilityId,
        firmwareVersion: input.metadata.firmwareVersion,
        location: input.metadata.location,
        tags: input.metadata.tags,
      },
      metrics: input.metrics,
    };
  }

  /**
   * Enqueues a single reading into the high-speed micro-batch buffer.
   */
  public async queueRecord(input: TelemetryPacketInput): Promise<{ queued: boolean; queueLength: number }> {
    const record = this.normalizeRecord(input);
    this.stats.totalReceived += 1;
    this.queue.push(record);
    this.stats.currentQueueSize = this.queue.length;

    // Immediately trigger flush if threshold reached
    if (this.queue.length >= this.maxBatchSize && !this.isFlushing) {
      setImmediate(() => {
        this.flushQueue().catch((err) => {
          console.error("[IngestService] Error during immediate batch flush:", err);
        });
      });
    }

    return { queued: true, queueLength: this.queue.length };
  }

  /**
   * Directly ingests an array of telemetry records using unordered MongoDB batch insert.
   * Ideal for bulk payload ingestion from edge gateways.
   */
  public async ingestBatchDirect(
    inputs: TelemetryPacketInput[]
  ): Promise<{ insertedCount: number; failedCount: number }> {
    if (!inputs.length) return { insertedCount: 0, failedCount: 0 };

    const records = inputs.map((item) => this.normalizeRecord(item));
    this.stats.totalReceived += records.length;

    try {
      const collection = getTelemetryCollection();
      // ordered: false ensures that individual failures do not block the batch
      const result = await collection.insertMany(records, { ordered: false });
      const insertedCount = result.insertedCount;
      const failedCount = records.length - insertedCount;

      this.stats.totalIngested += insertedCount;
      this.stats.totalFailed += failedCount;
      this.stats.batchesProcessed += 1;

      return { insertedCount, failedCount };
    } catch (error: any) {
      // With ordered: false, result might still contain partial insertedCount in error object
      const insertedCount = error?.result?.insertedCount || 0;
      const failedCount = records.length - insertedCount;

      this.stats.totalIngested += insertedCount;
      this.stats.totalFailed += failedCount;
      this.stats.batchesProcessed += 1;

      console.warn(`[IngestService] Partial batch insert warning: ${insertedCount} inserted, ${failedCount} errors`);
      return { insertedCount, failedCount };
    }
  }

  /**
   * Flushes the current micro-batch queue into MongoDB.
   */
  public async flushQueue(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;

    this.isFlushing = true;
    const batchToFlush = this.queue.splice(0, this.maxBatchSize);
    this.stats.currentQueueSize = this.queue.length;

    try {
      const collection = getTelemetryCollection();
      const result = await collection.insertMany(batchToFlush, { ordered: false });
      
      this.stats.totalIngested += result.insertedCount;
      this.stats.totalFailed += batchToFlush.length - result.insertedCount;
    } catch (error: any) {
      const insertedCount = error?.result?.insertedCount || 0;
      this.stats.totalIngested += insertedCount;
      this.stats.totalFailed += batchToFlush.length - insertedCount;
    } finally {
      this.stats.lastFlushTime = new Date().toISOString();
      this.stats.batchesProcessed += 1;
      this.isFlushing = false;
    }
  }

  /**
   * Retrieves live metrics & operational telemetry from the ingestion pipeline.
   */
  public getStats(): IngestStats & { uptimeSeconds: number } {
    return {
      ...this.stats,
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  /**
   * Clean shutdown flusher.
   */
  public async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    while (this.queue.length > 0) {
      await this.flushQueue();
    }
  }
}

export const telemetryIngestService = new TelemetryIngestService();
