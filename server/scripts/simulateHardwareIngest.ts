/**
 * NexusFlow Hardware Telemetry Load & Ingestion Simulator
 * Simulates high-frequency telemetry readings from multiple IoT sensors/machinery.
 */

const API_BASE = process.env.API_BASE || "http://localhost:5000/api/v1";

interface SensorConfig {
  deviceId: string;
  deviceType: string;
  facilityId: string;
  baseTemp: number;
  baseVibration: number;
  basePower: number;
}

const MACHINES: SensorConfig[] = [
  { deviceId: "turbopump-alpha-01", deviceType: "hydraulic_pump", facilityId: "plant-north", baseTemp: 68.0, baseVibration: 2.1, basePower: 45.0 },
  { deviceId: "turbopump-alpha-02", deviceType: "hydraulic_pump", facilityId: "plant-north", baseTemp: 71.5, baseVibration: 2.8, basePower: 48.2 },
  { deviceId: "conveyor-drive-03", deviceType: "belt_motor", facilityId: "assembly-bay-4", baseTemp: 52.0, baseVibration: 1.2, basePower: 18.5 },
  { deviceId: "chiller-compressor-01", deviceType: "industrial_chiller", facilityId: "hvac-substation", baseTemp: 38.0, baseVibration: 0.8, basePower: 92.0 },
  { deviceId: "generator-backup-01", deviceType: "diesel_generator", facilityId: "power-yard", baseTemp: 84.0, baseVibration: 4.5, basePower: 150.0 },
];

function generateReading(machine: SensorConfig) {
  const jitter = (range: number) => (Math.random() - 0.5) * range;
  return {
    timestamp: new Date().toISOString(),
    metadata: {
      deviceId: machine.deviceId,
      deviceType: machine.deviceType,
      facilityId: machine.facilityId,
      firmwareVersion: "v3.1.2-edge",
      location: {
        zone: "Zone-B",
        rack: "Rack-07",
      },
    },
    metrics: {
      temperature: parseFloat((machine.baseTemp + jitter(4)).toFixed(2)),
      vibration: parseFloat((machine.baseVibration + jitter(0.6)).toFixed(3)),
      powerDraw: parseFloat((machine.basePower + jitter(5)).toFixed(2)),
      voltage: parseFloat((230 + jitter(3)).toFixed(1)),
      rpm: Math.round(1750 + jitter(50)),
      status: Math.random() > 0.05 ? "nominal" : "warning",
    },
  };
}

async function runSimulator() {
  console.log("🚀 Starting Hardware Telemetry Ingest Simulator...");
  console.log(`Target endpoint: ${API_BASE}/telemetry/batch\n`);

  let totalSent = 0;
  const iterations = 10;
  const batchSizePerMachine = 20; // 20 readings * 5 machines = 100 readings per burst

  for (let i = 1; i <= iterations; i++) {
    const batch: any[] = [];
    for (const machine of MACHINES) {
      for (let j = 0; j < batchSizePerMachine; j++) {
        batch.push(generateReading(machine));
      }
    }

    try {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE}/telemetry/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });

      const data = await response.json();
      const duration = Date.now() - startTime;
      totalSent += batch.length;

      console.log(`[Burst ${i}/${iterations}] Ingested ${batch.length} telemetry packets in ${duration}ms (Status: ${response.status})`);
    } catch (err: any) {
      console.error(`[Burst ${i}] Failed to send batch:`, err.message);
    }

    // Wait 250ms between bursts
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\n✅ Simulator completed. Total packets sent: ${totalSent}`);

  // Fetch final stats
  try {
    const statsRes = await fetch(`${API_BASE}/telemetry/stats`);
    const stats = await statsRes.json();
    console.log("\n📊 Ingestion Engine Stats:", JSON.stringify(stats, null, 2));
  } catch (err) {
    // Ignore if not reachable
  }
}

runSimulator();
