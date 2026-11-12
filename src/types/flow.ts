import { Node, Edge } from '@xyflow/react';

export type NodeCategory = 'ingest' | 'filter' | 'transform' | 'action';

export interface IoTNodeData extends Record<string, unknown> {
  label: string;
  category: NodeCategory;
  subType: string;
  description: string;
  iconName: string;
  config: Record<string, any>;
  status?: 'idle' | 'active' | 'warning' | 'error';
  lastTelemetryValue?: string | number;
  lastTriggeredAt?: string;
}

export type IoTFlowNode = Node<IoTNodeData, 'iotNode'>;
export type IoTFlowEdge = Edge;

export interface TelemetryPacket {
  id: string;
  timestamp: string;
  deviceId: string;
  deviceType: 'temperature_sensor' | 'vibration_monitor' | 'power_meter' | 'gateway';
  payload: {
    temperature?: number;
    humidity?: number;
    vibration?: number;
    powerWatts?: number;
    batteryLevel?: number;
    status: 'ONLINE' | 'STANDBY' | 'CRITICAL' | 'WARN';
  };
}

export interface SimulationLog {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeLabel: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
  details?: Record<string, any>;
}
