import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  Rows3,
  Columns3,
  Square,
  LayoutGrid,
  ChevronsUpDown,
  ScrollText,
  AppWindow,
  PanelTop,
  PanelBottom,
  PanelLeft,
  PanelRight,
  ChevronDown,
  ChevronRight,
  Type,
  MousePointerClick,
  Star,
  Tag,
  Bookmark,
  Link,
  UserCircle2,
  FileText,
  Code,
  Braces,
  Minus,
  MoveHorizontal,
  TextCursorInput,
  AlignLeft,
  Hash,
  ChevronDownSquare,
  CircleDot,
  ToggleRight,
  CheckSquare,
  ToggleLeft,
  SlidersHorizontal,
  ArrowLeftRight,
  Gauge,
  Calendar,
  Clock,
  Pipette,
  Upload,
  FileEdit,
  Table,
  Sheet,
  GitFork,
  FileJson,
  Terminal,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Activity,
  Box,
  MapPin,
  Cpu,
  Loader,
  CircleDashed,
  Loader2,
  Image,
  Volume2,
  Video,
  GalleryHorizontal,
  MoreHorizontal,
  GitCommitHorizontal,
  MessageSquare,
  Plus,
  PlusCircle,
  Tags,
  Gamepad2,
  Palette,
  Search,
} from 'lucide-react';
import {
  WIDGET_REGISTRY,
  type WidgetCategory,
  type WidgetDefinition,
} from '../../registry/widgets';
import { useDesignerStore } from '../../store/designerStore';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Rows3,
  Columns3,
  Square,
  LayoutGrid,
  ChevronsUpDown,
  ScrollText,
  AppWindow,
  PanelTop,
  PanelBottom,
  PanelLeft,
  PanelRight,
  ChevronDown,
  Type,
  MousePointerClick,
  Star,
  Tag,
  Bookmark,
  Link,
  UserCircle2,
  FileText,
  Code,
  Braces,
  Minus,
  MoveHorizontal,
  TextCursorInput,
  AlignLeft,
  Hash,
  ChevronDownSquare,
  CircleDot,
  ToggleRight,
  CheckSquare,
  ToggleLeft,
  SlidersHorizontal,
  ArrowLeftRight,
  Gauge,
  Calendar,
  Clock,
  Pipette,
  Upload,
  FileEdit,
  Table,
  Sheet,
  GitFork,
  FileJson,
  Terminal,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Activity,
  Box,
  MapPin,
  Cpu,
  Loader,
  CircleDashed,
  Loader2,
  Image,
  Volume2,
  Video,
  GalleryHorizontal,
  MoreHorizontal,
  GitCommitHorizontal,
  MessageSquare,
  PlusCircle,
  Tags,
  Gamepad2,
  Palette,
};

const CATEGORIES: WidgetCategory[] = [
  'Contenedores',
  'Básicos',
  'Entradas',
  'Datos',
  'Multimedia',
];

const ToolboxItem: React.FC<{ widget: WidgetDefinition }> = ({ widget }) => {
  const addWidget = useDesignerStore((s) => s.addWidget);
  const hasDoc = useDesignerStore((s) => s.document !== null);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `toolbox:${widget.type}`,
    data: {
      source: 'toolbox',
      widgetType: widget.type,
    },
    disabled: !hasDoc,
  });

  const Icon = ICON_MAP[widget.icon] ?? Square;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group flex items-center justify-between px-2 py-1 rounded border border-transparent hover:border-[#3e3e42] hover:bg-[#2a2d2e] cursor-grab active:cursor-grabbing text-xs transition ${
        isDragging ? 'opacity-40' : ''
      } ${!hasDoc ? 'opacity-40 pointer-events-none' : ''}`}
      title={`ui.${widget.type} — Arrastra o pulsa + para agregar`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="w-3.5 h-3.5 text-[#4fc1ff] shrink-0" />
        <span className="truncate text-[#d4d4d4]">{widget.label}</span>
      </div>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          addWidget(widget.type);
        }}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#007acc] text-[#cccccc] hover:text-white transition"
        title={`Agregar ui.${widget.type}`}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
};

export const ToolboxPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({
    Contenedores: true,
    Básicos: true,
    Entradas: true,
    Datos: false,
    Multimedia: false,
  });

  const q = query.trim().toLowerCase();
  const filtered = WIDGET_REGISTRY.filter(
    (w) =>
      w.label.toLowerCase().includes(q) ||
      w.type.toLowerCase().includes(q) ||
      w.category.toLowerCase().includes(q)
  );

  const toggleCat = (cat: string) =>
    setOpenCats((prev) => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-2 border-b border-[#3e3e42] space-y-1">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#888] absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar (${WIDGET_REGISTRY.length} controles)...`}
            className="w-full bg-[#3c3c3c] text-xs text-[#e0e0e0] pl-7 pr-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
        {CATEGORIES.map((cat) => {
          const items = filtered.filter((w) => w.category === cat);
          if (items.length === 0) return null;
          const isOpen = q ? true : Boolean(openCats[cat]);

          return (
            <div key={cat} className="rounded overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCat(cat)}
                className="w-full flex items-center justify-between px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#aaaaaa] hover:text-white hover:bg-[#2d2d30] rounded"
              >
                <div className="flex items-center gap-1">
                  {isOpen ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                  <span>{cat}</span>
                </div>
                <span className="text-[9px] font-mono bg-[#333337] px-1.5 rounded text-[#888]">
                  {items.length}
                </span>
              </button>
              {isOpen && (
                <div className="mt-0.5 space-y-0.5 pl-1">
                  {items.map((w) => (
                    <ToolboxItem key={w.type} widget={w} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
