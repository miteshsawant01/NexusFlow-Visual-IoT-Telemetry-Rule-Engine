import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import telemetryRoutes from "./routes/telemetryRoutes.js";

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  // 10MB limit for high-frequency bulk IoT telemetry batches
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Root health check
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "healthy",
      service: "NexusFlow IoT Telemetry Ingestion Engine",
      timestamp: new Date().toISOString(),
    });
  });

  // API v1 routes
  app.use("/api/v1", telemetryRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: "Endpoint not found" });
  });

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[ServerError]", err);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: err.message,
    });
  });

  return app;
}
