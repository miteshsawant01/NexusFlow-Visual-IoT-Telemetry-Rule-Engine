import React, { useState } from 'react';
import { SimulationLog, TelemetryPacket } from '../types/flow';
import {
  Terminal,
  Zap,
  ChevronUp,
  ChevronDown,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface Props {
  isSimulating: boolean;
  logs: SimulationLog[];
  onClearLogs: () => void;
  onSendTestSpike: () => void;
  latestPacket: TelemetryPacket | null;
}

export const TelemetrySimulationBar: React.FC<Props> = ({
  isSimulating,
  logs,
  onClearLogs,
  onSendTestSpike,
  latestPacket,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const getLogIcon = (type: SimulationLog['type']) => {
    switch (type) {
      case 'warn':
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md transition-all duration-300 z-30 shadow-2xl ${
        isOpen ? 'h-52' : 'h-10'
      }`}
    >
      {/* Top Header / Bar */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white transition"
          >
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>Telemetry Simulation & Rule Evaluation Console</span>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Live Status Pill */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSimulating ? 'bg-emerald-400 opacity-75' : 'bg-slate-400 opacity-20'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulating ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
            </span>
            <span className="text-slate-400">
              {isSimulating ? 'STREAMING ACTIVE' : 'STREAM STOPPED'}
            </span>
          </div>

          {latestPacket && (
            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              <span className="text-slate-500">{latestPacket.deviceId}:</span>
              <span className="text-emerald-400">
                {latestPacket.payload.temperature?.toFixed(1)}°C
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-sky-400">
                vib: {latestPacket.payload.vibration?.toFixed(2)}g
              </span>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSendTestSpike}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-[11px] font-medium transition"
            title="Inject simulated threshold breach (89.4°C spike)"
          >
            <Zap className="w-3 h-3 text-rose-400" />
            <span>Inject Spike (89.4°C)</span>
          </button>

          <button
            onClick={onClearLogs}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Console Log Area */}
      {isOpen && (
        <div className="h-[calc(13rem-2.5rem)] overflow-y-auto p-3 font-mono text-[11px] space-y-1 bg-[#060a14]">
          {logs.length === 0 ? (
            <div className="text-slate-600 text-center py-8">
              No rule evaluation events yet. Click <span className="text-blue-400 font-semibold">"Simulate Telemetry"</span> or <span className="text-rose-400 font-semibold">"Inject Spike"</span> to test the canvas rule pipeline.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`flex items-start gap-2.5 py-0.5 px-2 rounded hover:bg-slate-900/60 transition ${
                  log.type === 'error'
                    ? 'text-rose-300 bg-rose-950/20'
                    : log.type === 'warn'
                    ? 'text-amber-300 bg-amber-950/20'
                    : log.type === 'success'
                    ? 'text-emerald-300'
                    : 'text-slate-300'
                }`}
              >
                <span className="text-slate-500 text-[10px] shrink-0 pt-0.5">
                  {log.timestamp}
                </span>
                {getLogIcon(log.type)}
                <span className="text-blue-400 font-semibold shrink-0">
                  [{log.nodeLabel}]
                </span>
                <span className="flex-1 break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
