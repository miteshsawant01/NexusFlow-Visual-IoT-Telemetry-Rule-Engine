import React from 'react';
import { IoTFlowNode } from '../types/flow';
import { CATEGORY_STYLES } from '../constants/nodeTypes';
import { DynamicIcon } from './DynamicIcon';
import { X, Trash2, Sliders, Check } from 'lucide-react';

interface Props {
  selectedNode: IoTFlowNode | null;
  onClose: () => void;
  onUpdateNodeData: (id: string, updatedData: Partial<IoTFlowNode['data']>) => void;
  onDeleteNode: (id: string) => void;
}

export const InspectorPanel: React.FC<Props> = ({
  selectedNode,
  onClose,
  onUpdateNodeData,
  onDeleteNode,
}) => {
  if (!selectedNode) return null;

  const { data, id } = selectedNode;
  const style = CATEGORY_STYLES[data.category] || CATEGORY_STYLES.ingest;

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNodeData(id, { label: e.target.value });
  };

  const handleConfigChange = (key: string, value: any) => {
    const updatedConfig = {
      ...data.config,
      [key]: value,
    };
    onUpdateNodeData(id, { config: updatedConfig });
  };

  return (
    <div className="w-80 bg-slate-950/95 border-l border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] select-none z-10 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${style.bg} ${style.text}`}>
            <DynamicIcon name={data.iconName} className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-100">Node Configuration</div>
            <div className="text-[10px] font-mono text-slate-400">ID: {id}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Name */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Node Label
          </label>
          <input
            type="text"
            value={data.label}
            onChange={handleLabelChange}
            className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Category Badge & Description */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400">Subtype: {data.subType}</span>
            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${style.badge}`}>
              {style.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {data.description}
          </p>
        </div>

        {/* Dynamic Config Properties */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>Parameters & Rule Logic</span>
          </div>

          {Object.entries(data.config || {}).map(([key, val]) => {
            const isNumeric = typeof val === 'number';
            const isBoolean = typeof val === 'boolean';

            return (
              <div key={key} className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>{key}</span>
                  <span className="text-[9px] text-slate-600 lowercase">{typeof val}</span>
                </label>

                {isBoolean ? (
                  <button
                    type="button"
                    onClick={() => handleConfigChange(key, !val)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-between ${
                      val
                        ? 'bg-blue-950/60 border-blue-700/80 text-blue-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{val ? 'Enabled' : 'Disabled'}</span>
                    {val && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                ) : (
                  <input
                    type={isNumeric ? 'number' : 'text'}
                    value={val}
                    onChange={(e) => {
                      const newV = isNumeric ? parseFloat(e.target.value) || 0 : e.target.value;
                      handleConfigChange(key, newV);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-1.5 font-mono focus:outline-none focus:border-blue-500 transition"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Live Diagnostics */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="text-[11px] font-semibold text-slate-300">Live Status & Diagnostics</div>
          <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 font-mono text-[11px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Execution State:</span>
              <span className="text-emerald-400 font-semibold uppercase">{data.status || 'idle'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Last Telemetry:</span>
              <span className="text-slate-300">{data.lastTelemetryValue ?? 'None yet'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Trigger Timestamp:</span>
              <span className="text-slate-400 text-[10px]">{data.lastTriggeredAt || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete node footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
        <button
          onClick={() => onDeleteNode(id)}
          className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 hover:border-rose-700 transition flex items-center justify-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove Node</span>
        </button>
      </div>
    </div>
  );
};
