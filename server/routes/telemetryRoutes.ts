import { Router } from "express";
import {
  ingestSingleTelemetry,
  ingestBatchTelemetry,
  getLatestTelemetry,
  queryTimeSeriesTelemetry,
  getIngestStats,
} from "../controllers/telemetryController.js";

const router = Router();

// High-speed ingestion endpoints
router.post("/telemetry", ingestSingleTelemetry);
router.post("/telemetry/batch", ingestBatchTelemetry);

// Query and retrieval endpoints
router.get("/telemetry/stats", getIngestStats);
router.get("/telemetry/latest/:deviceId", getLatestTelemetry);
router.get("/telemetry/query", queryTimeSeriesTelemetry);

export default router;
