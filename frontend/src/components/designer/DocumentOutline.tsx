import React from 'react';
import { Layers, Zap } from 'lucide-react';
import { useDesignerStore } from '../../store/designerStore';
import type { WidgetNode } from '../../types/ide';

const OutlineRow: React.FC<{ node: WidgetNode; depth: number }> = ({ node, depth }) => {
  const { selectedNodeId, selectNode } = useDesignerStore();
  const isSelected = selectedNodeId === node.id;
  const hasEvents = Object.keys(node.events || {}).length > 0;

  return (
    <div>
      <button
        onClick={() => selectNode(node.id)}
        className={`w-full flex items-center justify-between py-1 px-2 text-xs text-left transition ${
          isSelected ? 'bg-[#094771] text-white' : 'hover:bg-[#2a2d2e] text-[#cccccc]'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Layers className="w-3 h-3 text-[#4fc1ff] shrink-0" />
          <span className="truncate font-mono">{node.name}</span>
          <span className="text-[10px] text-[#858585]">({node.type})</span>
        </div>
        {hasEvents && <Zap className="w-3 h-3 text-yellow-400 shrink-0" />}
      </button>
      {node.children.map((child) => (
        <OutlineRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
};

export const DocumentOutline: React.FC = () => {
  const document = useDesignerStore((s) => s.document);

  if (!document) {
    return <div className="p-3 text-xs text-[#858585]">Sin formulario activo.</div>;
  }

  return (
    <div className="h-full overflow-y-auto py-1">
      <OutlineRow node={document.root} depth={0} />
    </div>
  );
};
