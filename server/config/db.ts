import { MongoClient, Db, Collection } from "mongodb";
import dotenv from "dotenv";
import type { HardwareTelemetryRecord } from "../types/telemetry.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = process.env.DB_NAME || "nexusflow_iot";
export const TELEMETRY_COLLECTION_NAME = "hardware_telemetry";

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Initializes MongoDB client with high-concurrency connection pooling.
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (client && db) {
    return { client, db };
  }

  client = new MongoClient(MONGODB_URI, {
    // High-throughput connection pool configuration
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 100),
    minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 10),
    maxIdleTimeMS: 30000,
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
    // Unacknowledged or w:1 write concerns can be chosen based on tolerance
    retryWrites: true,
  });

  await client.connect();
  db = client.db(DB_NAME);
  console.log(`[Database] Connected to MongoDB database: ${DB_NAME}`);

  await ensureTimeSeriesCollection(db);

  return { client, db };
}

/**
 * Ensures MongoDB Time Series Collection exists with appropriate bucket granularity
 * and secondary compound indexes for rapid hardware device telemetry filtering.
 */
export async function ensureTimeSeriesCollection(database: Db): Promise<void> {
  const collections = await database.listCollections({ name: TELEMETRY_COLLECTION_NAME }).toArray();

  if (collections.length === 0) {
    console.log(`[Database] Initializing MongoDB Time-Series collection: '${TELEMETRY_COLLECTION_NAME}'...`);
    
    // Create native Time-Series collection (MongoDB 5.0+)
    await database.createCollection(TELEMETRY_COLLECTION_NAME, {
      timeseries: {
        timeField: "timestamp",
        metaField: "metadata",
        // Granularity options: "seconds" | "minutes" | "hours"
        // "seconds" is recommended for high-frequency hardware IoT sensor telemetry
        granularity: "seconds",
      },
      // Optional automatic TTL expiration (default: 90 days retention)
      expireAfterSeconds: Number(process.env.TELEMETRY_RETENTION_SECONDS || 60 * 60 * 24 * 90),
    });

    console.log(`[Database] Time-Series collection '${TELEMETRY_COLLECTION_NAME}' created successfully.`);
  } else {
    console.log(`[Database] Time-Series collection '${TELEMETRY_COLLECTION_NAME}' verified.`);
  }

  const collection = database.collection<HardwareTelemetryRecord>(TELEMETRY_COLLECTION_NAME);

  // Secondary compound indexes for ultra-fast time-series queries
  await collection.createIndex({ "metadata.deviceId": 1, timestamp: -1 });
  await collection.createIndex({ "metadata.deviceType": 1, timestamp: -1 });
  await collection.createIndex({ "metadata.facilityId": 1, timestamp: -1 });
}

export function getTelemetryCollection(): Collection<HardwareTelemetryRecord> {
  if (!db) {
    throw new Error("Database not connected. Call connectToDatabase() first.");
  }
  return db.collection<HardwareTelemetryRecord>(TELEMETRY_COLLECTION_NAME);
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("[Database] MongoDB connection closed.");
  }
}
