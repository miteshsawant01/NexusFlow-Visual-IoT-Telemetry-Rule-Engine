import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  Connection,
  addEdge,
  NodeTypes,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomIoTNode } from '../nodes/CustomIoTNode';
import { IoTFlowNode, IoTFlowEdge } from '../types/flow';
import { NodePaletteItem } from '../constants/nodeTypes';

const nodeTypes: NodeTypes = {
  iotNode: CustomIoTNode,
};

interface Props {
  nodes: IoTFlowNode[];
  edges: IoTFlowEdge[];
  onNodesChange: any;
  onEdgesChange: any;
  setNodes: React.Dispatch<React.SetStateAction<IoTFlowNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<IoTFlowEdge[]>>;
  onSelectNode: (node: IoTFlowNode | null) => void;
  isSimulating: boolean;
}

export const Canvas: React.FC<Props> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  onSelectNode,
  isSimulating,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<IoTFlowNode, IoTFlowEdge> | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: {
              stroke: '#38bdf8',
              strokeWidth: 2,
            },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const rawData = event.dataTransfer.getData('application/nexusflow-node');
      if (!rawData || !reactFlowInstance || !reactFlowWrapper.current) {
        return;
      }

      const item: NodePaletteItem = JSON.parse(rawData);

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: IoTFlowNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'iotNode',
        position,
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
      onSelectNode(newNode);
    },
    [reactFlowInstance, setNodes, onSelectNode]
  );

  return (
    <div className="flex-1 h-full w-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges.map((e) => ({
          ...e,
          animated: isSimulating,
          style: {
            stroke: isSimulating ? '#38bdf8' : '#475569',
            strokeWidth: 2,
          },
        }))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={(_, node) => onSelectNode(node as IoTFlowNode)}
        onPaneClick={() => onSelectNode(null)}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#38bdf8', strokeWidth: 2 },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.2}
          color="#1e293b"
        />
        <Controls position="bottom-right" className="!mb-56 !mr-4" />
        <MiniMap
          position="bottom-left"
          className="!mb-56 !ml-4"
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
};
