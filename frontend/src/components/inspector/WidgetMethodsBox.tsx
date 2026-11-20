import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, Search, Code2 } from 'lucide-react';
import { api } from '../../services/api';
import type { WidgetMethodInfo, WidgetNode } from '../../types/ide';

interface WidgetMethodsBoxProps {
  node: WidgetNode;
}

export const WidgetMethodsBox: React.FC<WidgetMethodsBoxProps> = ({ node }) => {
  const [open, setOpen] = useState(false);
  const [methods, setMethods] = useState<WidgetMethodInfo[]>([]);
  const [filter, setFilter] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void api
      .getWidgetMethods(node.type)
      .then(setMethods)
      .catch(() => setMethods([]));
  }, [node.type, open]);

  const q = filter.trim().toLowerCase();
  const filtered = q
    ? methods.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.doc.toLowerCase().includes(q)
      )
    : methods;

  const handleCopy = (m: WidgetMethodInfo) => {
    const prefix = m.isAsync ? 'await ' : '';
    const snippet = m.isProperty
      ? `self.${node.name}.${m.name}`
      : `${prefix}self.${node.name}.${m.name}()`;
    void navigator.clipboard.writeText(snippet);
    setCopiedKey(m.name);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="border border-[#3e3e42] rounded-lg overflow-hidden bg-[#1e1e1e]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-2.5 py-2 bg-[#2d2d30] hover:bg-[#333337] text-[11px] font-medium text-[#e0e0e0]"
      >
        <span className="flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5 text-[#4fc1ff]" />
          <span>Métodos Python de ui.{node.type}</span>
        </span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-[#999]" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-[#999]" />
        )}
      </button>

      {open && (
        <div className="p-2 space-y-2">
          <div className="relative">
            <Search className="w-3 h-3 text-[#888] absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar métodos..."
              className="w-full bg-[#3c3c3c] text-[11px] text-white pl-6 pr-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
            {filtered.map((m) => (
              <div
                key={m.name}
                className="p-1.5 rounded bg-[#252526] border border-[#333337] hover:border-[#007acc]/60 space-y-0.5"
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="min-w-0 font-mono text-[10px] truncate">
                    {m.isAsync && (
                      <span className="text-purple-400 mr-1">async</span>
                    )}
                    <span className={m.isOwn ? 'text-[#dcdcaa] font-semibold' : 'text-[#9cdcfe]'}>
                      .{m.name}
                    </span>
                    <span className="text-[#858585]">{m.signature}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(m)}
                    className="p-1 rounded hover:bg-[#3e3e42] text-[#999] hover:text-white shrink-0"
                    title="Copiar llamada Python"
                  >
                    {copiedKey === m.name ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                {m.doc && (
                  <div className="text-[10px] text-[#8c8c8c] line-clamp-2">{m.doc}</div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-[10px] text-[#858585] text-center py-2">
                Sin métodos coincidentes.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
