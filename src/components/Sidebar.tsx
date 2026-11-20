import React, { useState } from 'react';
import { NODE_PALETTE, CATEGORY_STYLES, NodePaletteItem } from '../constants/nodeTypes';
import { DynamicIcon } from './DynamicIcon';
import { NodeCategory } from '../types/flow';
import { Plus, Search, HelpCircle } from 'lucide-react';

interface Props {
  onAddNode: (item: NodePaletteItem) => void;
}

export const Sidebar: React.FC<Props> = ({ onAddNode }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const onDragStart = (event: React.DragEvent, item: NodePaletteItem) => {
    event.dataTransfer.setData('application/nexusflow-node', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  const categories: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'ingest', label: 'Ingest' },
    { key: 'filter', label: 'Logic' },
    { key: 'transform', label: 'Transform' },
    { key: 'action', label: 'Action' },
  ];

  const filteredItems = NODE_PALETTE.filter((item) => {
    const matchesCategory =
      activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <aside className="w-72 bg-slate-950/90 border-r border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] select-none">
      {/* Search & Tabs */}
      <div className="p-3 border-b border-slate-800 space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search IoT rule nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition whitespace-nowrap ${
                activeCategory === c.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Node Palette List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>DRAG OR CLICK TO ADD</span>
          <span className="font-mono text-[10px]">{filteredItems.length} nodes</span>
        </div>

        {filteredItems.map((item) => {
          const style = CATEGORY_STYLES[item.category as NodeCategory] || CATEGORY_STYLES.ingest;
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => onDragStart(e, item)}
              onClick={() => onAddNode(item)}
              className="group relative p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition cursor-grab active:cursor-grabbing hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${style.bg} ${style.text}`}>
                    <DynamicIcon name={item.iconName} className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition">
                      {item.label}
                    </div>
                    <span
                      className={`inline-block text-[9px] font-mono uppercase px-1 py-0.2 rounded border ${style.badge}`}
                    >
                      {style.label}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddNode(item);
                  }}
                  className="p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-blue-600 opacity-60 group-hover:opacity-100 transition"
                  title="Add to canvas"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="mt-1.5 text-[11px] text-slate-400 leading-tight">
                {item.description}
              </p>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs">
            No matching nodes found.
          </div>
        )}
      </div>

      {/* Footer tips */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950 text-[11px] text-slate-400 flex items-start gap-2">
        <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-snug">
          Connect output handles <span className="text-blue-400">●</span> to input handles to form real-time rule pipelines.
        </p>
      </div>
    </aside>
  );
};
