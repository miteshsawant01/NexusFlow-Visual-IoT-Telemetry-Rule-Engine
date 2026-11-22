import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Cpu,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface Props {
  isSimulating: boolean;
  onToggleSimulator: () => void;
  onLoadSampleFlow: () => void;
  onClearFlow: () => void;
  onExportFlow: () => void;
  onImportFlow: () => void;
  onDeploy: () => void;
  nodeCount: number;
}

export const Header: React.FC<Props> = ({
  isSimulating,
  onToggleSimulator,
  onLoadSampleFlow,
  onClearFlow,
  onExportFlow,
  onImportFlow,
  onDeploy,
  nodeCount,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 flex items-center justify-between z-20">
      {/* Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                NexusFlow
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60">
                v0.1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Visual IoT Telemetry Rule Engine
            </p>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-800 mx-2 hidden md:block" />

        {/* Status indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSimulating ? 'bg-emerald-400 opacity-75' : 'bg-slate-400 opacity-20'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulating ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
          </span>
          <span className="font-mono text-[11px]">
            {isSimulating ? 'Telemetry Live Stream Active' : 'Engine Idle'}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono text-[11px]">{nodeCount} Nodes</span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-2">
        {/* Sample workflow */}
        <button
          onClick={onLoadSampleFlow}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition"
          title="Load default IoT temperature alert flow"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Sample Rule</span>
        </button>

        {/* Clear */}
        <button
          onClick={onClearFlow}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
          title="Reset canvas"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Clear</span>
        </button>

        {/* Import / Export */}
        <button
          onClick={onExportFlow}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          title="Export Flow as JSON"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Export</span>
        </button>
        <button
          onClick={onImportFlow}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          title="Import Flow JSON"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Import</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-800 mx-1" />

        {/* Simulator Toggle */}
        <button
          onClick={onToggleSimulator}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-md ${
            isSimulating
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30 ring-1 ring-amber-400/50'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
          }`}
        >
          {isSimulating ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Stop Stream</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Telemetry</span>
            </>
          )}
        </button>

        {/* Deploy button */}
        <button
          onClick={onDeploy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-md shadow-blue-900/30"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Deploy Rule</span>
        </button>

        {/* GitHub link */}
        <a
          href="https://github.com/miteshsawant01/NexusFlow-Visual-IoT-Telemetry-Rule-Engine"
          target="_blank"
          rel="noreferrer"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
          title="GitHub Repository"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>
      </div>
    </header>
  );
};
