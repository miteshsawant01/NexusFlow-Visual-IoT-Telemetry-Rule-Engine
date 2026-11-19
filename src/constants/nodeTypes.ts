import { NodeCategory } from '../types/flow';

export interface NodePaletteItem {
  type: string;
  category: NodeCategory;
  label: string;
  description: string;
  iconName: string;
  defaultConfig: Record<string, any>;
  hasInput: boolean;
  hasOutput: boolean;
}

export const NODE_PALETTE: NodePaletteItem[] = [
  // --- INGEST NODES ---
  {
    type: 'mqtt_subscriber',
    category: 'ingest',
    label: 'MQTT Broker',
    description: 'Subscribe to MQTT topics for IoT sensor stream',
    iconName: 'Radio',
    hasInput: false,
    hasOutput: true,
    defaultConfig: {
      brokerUrl: 'mqtt://broker.hivemq.com:1883',
      topic: 'telemetry/devices/+/data',
      qos: 1,
    },
  },
  {
    type: 'http_webhook',
    category: 'ingest',
    label: 'HTTP Ingest',
    description: 'Listen on REST API endpoint for telemetry ingest',
    iconName: 'Globe',
    hasInput: false,
    hasOutput: true,
    defaultConfig: {
      endpoint: '/api/v1/telemetry/ingest',
      method: 'POST',
      authRequired: true,
    },
  },
  {
    type: 'device_simulator',
    category: 'ingest',
    label: 'Sensor Simulator',
    description: 'Generate synthetic telemetry streams for testing',
    iconName: 'Cpu',
    hasInput: false,
    hasOutput: true,
    defaultConfig: {
      frequencyMs: 2000,
      sensorType: 'temperature_sensor',
      baseValue: 24.5,
      noiseFactor: 1.2,
    },
  },

  // --- FILTER & LOGIC NODES ---
  {
    type: 'threshold_filter',
    category: 'filter',
    label: 'Threshold Filter',
    description: 'Pass telemetry if value meets numerical condition',
    iconName: 'Sliders',
    hasInput: true,
    hasOutput: true,
    defaultConfig: {
      metricField: 'temperature',
      operator: '>',
      thresholdValue: 75.0,
      unit: '°C',
    },
  },
  {
    type: 'range_check',
    category: 'filter',
    label: 'Range Check',
    description: 'Ensure metrics stay within safe operating band',
    iconName: 'Activity',
    hasInput: true,
    hasOutput: true,
    defaultConfig: {
      metricField: 'vibration',
      minValue: 0.1,
      maxValue: 1.8,
      mode: 'inside_band',
    },
  },
  {
    type: 'anomaly_detector',
    category: 'filter',
    label: 'Anomaly Detector',
    description: 'Statistical z-score outlier detection',
    iconName: 'AlertTriangle',
    hasInput: true,
    hasOutput: true,
    defaultConfig: {
      windowSize: 10,
      sensitivityZScore: 2.5,
    },
  },

  // --- TRANSFORM NODES ---
  {
    type: 'unit_converter',
    category: 'transform',
    label: 'Unit Converter',
    description: 'Convert telemetry units (e.g. °C to °F or W to kW)',
    iconName: 'RefreshCw',
    hasInput: true,
    hasOutput: true,
    defaultConfig: {
      sourceField: 'temperature',
      targetField: 'temperature_f',
      conversionType: 'c_to_f',
    },
  },
  {
    type: 'json_mapper',
    category: 'transform',
    label: 'JSON Field Mapper',
    description: 'Restructure JSON fields or compute inline formulas',
    iconName: 'Layers',
    hasInput: true,
    hasOutput: true,
    defaultConfig: {
      expression: 'payload.temperature * 1.05',
      outputField: 'calibratedTemp',
    },
  },

  // --- ACTION NODES ---
  {
    type: 'webhook_action',
    category: 'action',
    label: 'Dispatch Webhook',
    description: 'Trigger external REST HTTP webhook on breach',
    iconName: 'Send',
    hasInput: true,
    hasOutput: false,
    defaultConfig: {
      url: 'https://api.incident-management.io/v1/alerts',
      method: 'POST',
      retryCount: 3,
    },
  },
  {
    type: 'notification_alert',
    category: 'action',
    label: 'Alert Notification',
    description: 'Push emergency Slack / Email notification',
    iconName: 'Bell',
    hasInput: true,
    hasOutput: false,
    defaultConfig: {
      channel: 'slack',
      severity: 'CRITICAL',
      recipient: '#iot-ops-alerts',
    },
  },
  {
    type: 'actuator_switch',
    category: 'action',
    label: 'Actuate Switch',
    description: 'Send down-link command to turn relay ON/OFF',
    iconName: 'Power',
    hasInput: true,
    hasOutput: false,
    defaultConfig: {
      command: 'CUTOFF_RELAY',
      targetDeviceId: 'ACTUATOR-ZONE-4',
    },
  },
];

export const CATEGORY_STYLES: Record<
  NodeCategory,
  { label: string; badge: string; border: string; glow: string; text: string; bg: string }
> = {
  ingest: {
    label: 'Ingest',
    badge: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/50',
    border: 'border-emerald-500/40 hover:border-emerald-400',
    glow: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)]',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  filter: {
    label: 'Logic & Filter',
    badge: 'bg-amber-950/80 text-amber-400 border-amber-700/50',
    border: 'border-amber-500/40 hover:border-amber-400',
    glow: 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.25)]',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  transform: {
    label: 'Transform',
    badge: 'bg-sky-950/80 text-sky-400 border-sky-700/50',
    border: 'border-sky-500/40 hover:border-sky-400',
    glow: 'shadow-[0_0_15px_-3px_rgba(56,189,248,0.25)]',
    text: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
  action: {
    label: 'Action Sink',
    badge: 'bg-rose-950/80 text-rose-400 border-rose-700/50',
    border: 'border-rose-500/40 hover:border-rose-400',
    glow: 'shadow-[0_0_15px_-3px_rgba(244,63,94,0.25)]',
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
};
