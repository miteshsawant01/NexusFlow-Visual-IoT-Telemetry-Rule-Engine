import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectToDatabase, closeDatabase } from "./config/db.js";
import { telemetryIngestService } from "./services/telemetryIngestService.js";

dotenv.config();

const PORT = Number(process.env.PORT || 5000);

async function startServer(): Promise<void> {
  try {
    console.log("[Server] Connecting to MongoDB Time Series database...");
    await connectToDatabase();

    const app = createApp();

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 NexusFlow Telemetry Ingestion Server is running!`);
      console.log(`📡 Ingestion Endpoint: POST http://localhost:${PORT}/api/v1/telemetry`);
      console.log(`📦 Batch Endpoint:     POST http://localhost:${PORT}/api/v1/telemetry/batch`);
      console.log(`📊 Ingest Stats:       GET  http://localhost:${PORT}/api/v1/telemetry/stats`);
      console.log(`🩺 Health Check:       GET  http://localhost:${PORT}/health`);
      console.log(`====================================================`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log("[Server] HTTP server closed.");
        await telemetryIngestService.shutdown();
        await closeDatabase();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => handleShutdown("SIGINT"));
    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  } catch (error: any) {
    console.error("[Server] Failed to initialize backend server:", error.message);
    process.exit(1);
  }
}

startServer();
