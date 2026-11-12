import { z } from "zod";

export interface TelemetryMetadata {
  deviceId: string;
  deviceType?: string;
  facilityId?: string;
  firmwareVersion?: string;
  location?: {
    lat?: number;
    lon?: number;
    zone?: string;
    rack?: string;
  };
  tags?: Record<string, string>;
}

export interface HardwareTelemetryRecord {
  timestamp: Date;
  metadata: TelemetryMetadata;
  metrics: {
    temperature?: number;
    vibration?: number;
    powerDraw?: number;
    voltage?: number;
    current?: number;
    pressure?: number;
    humidity?: number;
    rpm?: number;
    cpuLoad?: number;
    status?: string | number;
    [key: string]: unknown;
  };
}

// Zod schema for high-speed packet validation
export const TelemetryPacketSchema = z.object({
  timestamp: z.union([z.string().datetime(), z.number(), z.date()]).optional(),
  metadata: z.object({
    deviceId: z.string().min(1, "deviceId is required"),
    deviceType: z.string().optional().default("generic_sensor"),
    facilityId: z.string().optional(),
    firmwareVersion: z.string().optional(),
    location: z
      .object({
        lat: z.number().optional(),
        lon: z.number().optional(),
        zone: z.string().optional(),
        rack: z.string().optional(),
      })
      .optional(),
    tags: z.record(z.string()).optional(),
  }),
  metrics: z.record(z.any()).refine((m) => Object.keys(m).length > 0, {
    message: "metrics object must contain at least one telemetry metric",
  }),
});

export const TelemetryBatchSchema = z.array(TelemetryPacketSchema).min(1).max(5000);

export type TelemetryPacketInput = z.infer<typeof TelemetryPacketSchema>;
