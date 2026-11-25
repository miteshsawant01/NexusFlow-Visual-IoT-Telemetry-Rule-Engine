import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { InspectorPanel } from './components/InspectorPanel';
import { TelemetrySimulationBar } from './components/TelemetrySimulationBar';
import { IoTFlowNode, IoTFlowEdge, TelemetryPacket, SimulationLog } from './types/flow';
import { NodePaletteItem } from './constants/nodeTypes';

// Initial default pipeline: IoT Temperature Monitor -> Threshold Rule -> Alert Notification
const INITIAL_NODES: IoTFlowNode[] = [
  {
    id: 'node-ingest-1',
    type: 'iotNode',
    position: { x: 100, y: 180 },
    data: {
      label: 'HVAC Sensor Stream',
      category: 'ingest',
      subType: 'device_simulator',
      description: 'Live telemetry stream from Industrial HVAC Unit #7',
      iconName: 'Cpu',
      config: {
        sensorType: 'temperature_sensor',
        frequencyMs: 2500,
        baseValue: 71.5,
        noiseFactor: 2.0,
      },
      status: 'active',
      lastTelemetryValue: '72.3°C',
    },
  },
  {
    id: 'node-filter-1',
    type: 'iotNode',
    position: { x: 440, y: 180 },
    data: {
      label: 'Overheat Threshold',
      category: 'filter',
      subType: 'threshold_filter',
      description: 'Breach trigger if temperature exceeds 75°C',
      iconName: 'Sliders',
      config: {
        metricField: 'temperature',
        operator: '>',
        thresholdValue: 75.0,
        unit: '°C',
      },
      status: 'idle',
      lastTelemetryValue: '72.3°C',
    },
  },
  {
    id: 'node-transform-1',
    type: 'iotNode',
    position: { x: 780, y: 100 },
    data: {
      label: 'Celsius to Fahrenheit',
      category: 'transform',
      subType: 'unit_converter',
      description: 'Convert thermal units for US operations dashboard',
      iconName: 'RefreshCw',
      config: {
        sourceField: 'temperature',
        targetField: 'temperature_f',
        conversionType: 'c_to_f',
      },
      status: 'idle',
    },
  },
  {
    id: 'node-action-1',
    type: 'iotNode',
    position: { x: 1120, y: 100 },
    data: {
      label: 'Slack Ops Alert',
      category: 'action',
      subType: 'notification_alert',
      description: 'Post high-priority alert to #iot-incident-ops',
      iconName: 'Bell',
      config: {
        channel: 'slack',
        severity: 'CRITICAL',
        recipient: '#iot-incident-ops',
      },
      status: 'idle',
    },
  },
  {
    id: 'node-action-2',
    type: 'iotNode',
    position: { x: 1120, y: 280 },
    data: {
      label: 'Emergency Cutoff Relay',
      category: 'action',
      subType: 'actuator_switch',
      description: 'Command down-link to isolate power relay',
      iconName: 'Power',
      config: {
        command: 'TRIP_SAFETY_BREAKER',
        targetDeviceId: 'RELAY-ZONE-07',
      },
      status: 'idle',
    },
  },
];

const INITIAL_EDGES: IoTFlowEdge[] = [
  {
    id: 'e1-2',
    source: 'node-ingest-1',
    target: 'node-filter-1',
    animated: true,
    style: { stroke: '#38bdf8', strokeWidth: 2 },
  },
  {
    id: 'e2-3',
    source: 'node-filter-1',
    target: 'node-transform-1',
    animated: true,
    style: { stroke: '#38bdf8', strokeWidth: 2 },
  },
  {
    id: 'e3-4',
    source: 'node-transform-1',
    target: 'node-action-1',
    animated: true,
    style: { stroke: '#38bdf8', strokeWidth: 2 },
  },
  {
    id: 'e2-5',
    source: 'node-filter-1',
    target: 'node-action-2',
    animated: true,
    style: { stroke: '#38bdf8', strokeWidth: 2 },
  },
];

export const App: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<IoTFlowNode>(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState<IoTFlowEdge>(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [latestPacket, setLatestPacket] = useState<TelemetryPacket | null>(null);

  const simulationIntervalRef = useRef<number | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const addLog = useCallback(
    (
      nodeId: string,
      nodeLabel: string,
      type: SimulationLog['type'],
      message: string,
      details?: Record<string, any>
    ) => {
      const newLog: SimulationLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        nodeId,
        nodeLabel,
        type,
        message,
        details,
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    },
    []
  );

  // Evaluate telemetry packet against canvas rule topology
  const evaluatePacket = useCallback(
    (packet: TelemetryPacket) => {
      setLatestPacket(packet);
      const temp = packet.payload.temperature ?? 70;

      // Update node states based on simulation
      setNodes((currentNodes) =>
        currentNodes.map((n) => {
          if (n.data.category === 'ingest') {
            return {
              ...n,
              data: {
                ...n.data,
                status: 'active',
                lastTelemetryValue: `${temp.toFixed(1)}°C`,
                lastTriggeredAt: new Date().toLocaleTimeString(),
              },
            };
          }

          if (n.data.subType === 'threshold_filter') {
            const thresh = Number(n.data.config.thresholdValue ?? 75);
            const isBreach = temp > thresh;

            return {
              ...n,
              data: {
                ...n.data,
                status: isBreach ? 'warning' : 'idle',
                lastTelemetryValue: `${temp.toFixed(1)}°C`,
                lastTriggeredAt: new Date().toLocaleTimeString(),
              },
            };
          }

          if (n.data.category === 'transform') {
            const isBreach = temp > 75;
            const fahrenheit = (temp * 9) / 5 + 32;
            return {
              ...n,
              data: {
                ...n.data,
                status: isBreach ? 'active' : 'idle',
                lastTelemetryValue: `${fahrenheit.toFixed(1)}°F`,
                lastTriggeredAt: new Date().toLocaleTimeString(),
              },
            };
          }

          if (n.data.category === 'action') {
            const isBreach = temp > 75;
            return {
              ...n,
              data: {
                ...n.data,
                status: isBreach ? 'error' : 'idle',
                lastTelemetryValue: isBreach ? 'TRIGGERED' : 'IDLE',
                lastTriggeredAt: isBreach ? new Date().toLocaleTimeString() : n.data.lastTriggeredAt,
              },
            };
          }

          return n;
        })
      );

      // Add appropriate logs
      addLog(
        'node-ingest-1',
        'HVAC Sensor Stream',
        'info',
        `Telemetry received: temperature=${temp.toFixed(1)}°C, vibration=${packet.payload.vibration?.toFixed(2)}g [Status: ${packet.payload.status}]`
      );

      if (temp > 75) {
        addLog(
          'node-filter-1',
          'Overheat Threshold',
          'warn',
          `RULE BREACH DETECTED: ${temp.toFixed(1)}°C > 75.0°C threshold limit!`
        );
        addLog(
          'node-transform-1',
          'Celsius to Fahrenheit',
          'info',
          `Transformed ${(temp).toFixed(1)}°C to ${((temp * 9) / 5 + 32).toFixed(1)}°F`
        );
        addLog(
          'node-action-1',
          'Slack Ops Alert',
          'error',
          `Dispatched Emergency Alert to #iot-incident-ops: High temperature breach on HVAC #7`
        );
        addLog(
          'node-action-2',
          'Emergency Cutoff Relay',
          'error',
          `DOWN-LINK COMMAND SENT: TRIP_SAFETY_BREAKER on RELAY-ZONE-07`
        );
      }
    },
    [addLog, setNodes]
  );

  // Generate synthetic telemetry tick
  const runSimulationTick = useCallback(
    (forcedTemp?: number) => {
      const base = 72;
      const noise = (Math.random() - 0.45) * 5.0;
      const temp = forcedTemp !== undefined ? forcedTemp : Math.max(65, Math.min(85, base + noise));

      const packet: TelemetryPacket = {
        id: `pkt_${Date.now()}`,
        timestamp: new Date().toISOString(),
        deviceId: 'HVAC-UNIT-7',
        deviceType: 'temperature_sensor',
        payload: {
          temperature: parseFloat(temp.toFixed(2)),
          humidity: Math.floor(45 + Math.random() * 15),
          vibration: parseFloat((0.8 + Math.random() * 0.7).toFixed(2)),
          powerWatts: Math.floor(3200 + Math.random() * 300),
          status: temp > 75 ? 'CRITICAL' : 'ONLINE',
        },
      };

      evaluatePacket(packet);
    },
    [evaluatePacket]
  );

  // Simulation interval lifecycle
  useEffect(() => {
    if (isSimulating) {
      // Immediate tick on start
      runSimulationTick();
      simulationIntervalRef.current = window.setInterval(() => {
        runSimulationTick();
      }, 3000);
    } else {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    }

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [isSimulating, runSimulationTick]);

  // Handle adding node from palette
  const handleAddNode = useCallback(
    (item: NodePaletteItem) => {
      const newNode: IoTFlowNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'iotNode',
        position: {
          x: 400 + Math.random() * 150,
          y: 200 + Math.random() * 120,
        },
        data: {
          label: item.label,
          category: item.category,
          subType: item.type,
          description: item.description,
          iconName: item.iconName,
          config: { ...item.defaultConfig },
          status: 'idle',
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNode.id);
      addLog(newNode.id, newNode.data.label, 'info', `Node added to canvas`);
    },
    [setNodes, addLog]
  );

  // Update node data from inspector
  const handleUpdateNodeData = useCallback(
    (id: string, updatedData: Partial<IoTFlowNode['data']>) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              data: {
                ...n.data,
                ...updatedData,
              },
            };
          }
          return n;
        })
      );
    },
    [setNodes]
  );

  // Delete node
  const handleDeleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      if (selectedNodeId === id) {
        setSelectedNodeId(null);
      }
      addLog(id, 'System', 'warn', `Node deleted from rule pipeline`);
    },
    [selectedNodeId, setNodes, setEdges, addLog]
  );

  // Load sample default rule flow
  const handleLoadSampleFlow = useCallback(() => {
    setNodes(INITIAL_NODES);
    setEdges(INITIAL_EDGES);
    setSelectedNodeId(null);
    addLog('system', 'NexusFlow Engine', 'success', 'Default HVAC Monitoring Rule topology reloaded');
  }, [setNodes, setEdges, addLog]);

  // Clear canvas
  const handleClearFlow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    addLog('system', 'NexusFlow Engine', 'warn', 'Canvas cleared. Add nodes from palette to build new pipeline.');
  }, [setNodes, setEdges, addLog]);

  // Export JSON
  const handleExportFlow = useCallback(() => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexusflow-rule-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('system', 'NexusFlow Engine', 'success', 'Exported pipeline definition JSON');
  }, [nodes, edges, addLog]);

  // Import JSON
  const handleImportFlow = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
            setNodes(parsed.nodes);
            setEdges(parsed.edges);
            addLog('system', 'NexusFlow Engine', 'success', `Imported pipeline with ${parsed.nodes.length} nodes`);
          } else {
            alert('Invalid NexusFlow pipeline format');
          }
        } catch {
          alert('Failed to parse JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setNodes, setEdges, addLog]);

  // Deploy Rule
  const handleDeploy = useCallback(() => {
    addLog(
      'system',
      'Deploy Orchestrator',
      'success',
      `Rules successfully compiled and deployed to active edge broker! Active nodes: ${nodes.length}, routes: ${edges.length}`
    );
    alert(`Rule Engine Deployed Successfully!\n\n${nodes.length} Nodes & ${edges.length} Connections active on edge runtime.`);
  }, [nodes.length, edges.length, addLog]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#080c18] text-slate-100 font-sans">
      {/* Top App Header */}
      <Header
        isSimulating={isSimulating}
        onToggleSimulator={() => setIsSimulating(!isSimulating)}
        onLoadSampleFlow={handleLoadSampleFlow}
        onClearFlow={handleClearFlow}
        onExportFlow={handleExportFlow}
        onImportFlow={handleImportFlow}
        onDeploy={handleDeploy}
        nodeCount={nodes.length}
      />

      {/* Main Workspace Body */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Node Palette Sidebar */}
        <Sidebar onAddNode={handleAddNode} />

        {/* Central Visual Canvas */}
        <Canvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          setNodes={setNodes}
          setEdges={setEdges}
          onSelectNode={(node) => setSelectedNodeId(node ? node.id : null)}
          isSimulating={isSimulating}
        />

        {/* Right Configuration Inspector */}
        {selectedNode && (
          <InspectorPanel
            selectedNode={selectedNode}
            onClose={() => setSelectedNodeId(null)}
            onUpdateNodeData={handleUpdateNodeData}
            onDeleteNode={handleDeleteNode}
          />
        )}
      </div>

      {/* Bottom Telemetry Simulation Console */}
      <TelemetrySimulationBar
        isSimulating={isSimulating}
        logs={logs}
        onClearLogs={() => setLogs([])}
        onSendTestSpike={() => runSimulationTick(89.4)}
        latestPacket={latestPacket}
      />
    </div>
  );
};
