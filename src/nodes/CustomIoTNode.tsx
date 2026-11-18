import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { IoTFlowNode } from '../types/flow';
import { CATEGORY_STYLES } from '../constants/nodeTypes';
import { DynamicIcon } from '../components/DynamicIcon';

const CustomIoTNodeComponent: React.FC<NodeProps<IoTFlowNode>> = ({
  data,
  selected,
}) => {
  const {
    label,
    category,
    subType,
    iconName,
    config,
    status = 'idle',
    lastTelemetryValue,
  } = data;

  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.ingest;

  const hasTarget = category !== 'ingest';
  const hasSource = category !== 'action';

  // Status color pill
  const getStatusIndicator = () => {
    switch (status) {
      case 'active':
        return <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>;
      case 'warning':
        return <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />;
      case 'error':
        return <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />;
      default:
        return <span className="h-2 w-2 rounded-full bg-slate-600" />;
    }
  };

  // Preview configuration summary
  const renderConfigPreview = () => {
    if (subType === 'threshold_filter') {
      return (
        <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
          Condition: <span className="text-amber-300 font-semibold">{config.metricField} {config.operator} {config.thresholdValue}{config.unit || ''}</span>
        </div>
      );
    }
    if (subType === 'mqtt_subscriber') {
      return (
        <div className="text-[11px] font-mono text-slate-400 truncate max-w-[200px] bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
          Topic: <span className="text-emerald-300 font-semibold">{config.topic}</span>
        </div>
      );
    }
    if (subType === 'range_check') {
      return (
        <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
          Safe Band: <span className="text-amber-300 font-semibold">{config.minValue} - {config.maxValue}</span>
        </div>
      );
    }
    if (subType === 'webhook_action') {
      return (
        <div className="text-[11px] font-mono text-slate-400 truncate max-w-[200px] bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
          POST: <span className="text-rose-300 font-semibold">{config.url?.split('/').pop() || 'endpoint'}</span>
        </div>
      );
    }
    if (subType === 'device_simulator') {
      return (
        <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
          Stream: <span className="text-emerald-300 font-semibold">{config.sensorType}</span>
        </div>
      );
    }
    return (
      <div className="text-[11px] text-slate-400 italic">
        {data.description}
      </div>
    );
  };

  return (
    <div
      className={`relative min-w-[230px] rounded-xl bg-slate-950/95 backdrop-blur-md border transition-all duration-200 p-3.5 shadow-2xl ${
        selected
          ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] ring-2 ring-blue-500/20'
          : `${style.border} ${style.glow}`
      }`}
    >
      {/* Target handle (Input port) */}
      {hasTarget && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !-left-2 !bg-slate-300 !border-2 !border-slate-900 hover:!bg-blue-400 hover:!scale-125 transition-all !cursor-crosshair"
        />
      )}

      {/* Node Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${style.bg} ${style.text}`}>
            <DynamicIcon name={iconName} className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold text-slate-100 tracking-wide">
            {label}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {getStatusIndicator()}
          <span
            className={`text-[9px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded border ${style.badge}`}
          >
            {style.label}
          </span>
        </div>
      </div>

      {/* Node Configuration Preview */}
      <div className="mt-2.5">
        {renderConfigPreview()}
      </div>

      {/* Live Value Footer (if present) */}
      {lastTelemetryValue !== undefined && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
          <span className="text-slate-400">Live Reading:</span>
          <span className="font-mono font-medium text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
            {lastTelemetryValue}
          </span>
        </div>
      )}

      {/* Source handle (Output port) */}
      {hasSource && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !-right-2 !bg-blue-400 !border-2 !border-slate-900 hover:!bg-cyan-300 hover:!scale-125 transition-all !cursor-crosshair"
        />
      )}
    </div>
  );
};

export const CustomIoTNode = memo(CustomIoTNodeComponent);
