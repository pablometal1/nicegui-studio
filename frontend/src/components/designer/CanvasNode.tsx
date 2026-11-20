import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { ArrowUp, ArrowDown, Copy, Trash2, Zap, GripVertical, ChevronDown } from 'lucide-react';
import { getWidgetDefinition } from '../../registry/widgets';
import { inlineCssToReactStyle, parseQuasarProps } from '../../registry/stylesCatalog';
import { useDesignerStore } from '../../store/designerStore';
import { useIdeStore } from '../../store/ideStore';
import type { WidgetNode } from '../../types/ide';

const QUASAR_COLOR_BG: Record<string, string> = {
  primary: 'bg-[#1976d2] text-white',
  secondary: 'bg-[#26a69a] text-white',
  accent: 'bg-[#9c27b0] text-white',
  positive: 'bg-[#21ba45] text-white',
  negative: 'bg-[#c10015] text-white',
  warning: 'bg-[#f2c037] text-slate-900',
  info: 'bg-[#31ccec] text-slate-900',
  dark: 'bg-[#1d1d1d] text-white',
};

const QUASAR_COLOR_TEXT: Record<string, string> = {
  primary: 'text-[#1976d2]',
  secondary: 'text-[#26a69a]',
  accent: 'text-[#9c27b0]',
  positive: 'text-[#21ba45]',
  negative: 'text-[#c10015]',
  warning: 'text-[#f2c037]',
  info: 'text-[#31ccec]',
  dark: 'text-[#1d1d1d]',
};

function resolveColorBg(raw: unknown): { cls: string; style: React.CSSProperties } {
  const c = String(raw || 'primary').trim();
  if (QUASAR_COLOR_BG[c]) return { cls: QUASAR_COLOR_BG[c], style: {} };
  if (c && (c.startsWith('#') || c.startsWith('rgb') || c.startsWith('hsl'))) {
    return { cls: 'text-white', style: { backgroundColor: c } };
  }
  return { cls: QUASAR_COLOR_BG.primary, style: {} };
}

function resolveColorText(raw: unknown): { cls: string; style: React.CSSProperties } {
  const c = String(raw || 'primary').trim();
  if (QUASAR_COLOR_TEXT[c]) return { cls: QUASAR_COLOR_TEXT[c], style: {} };
  if (c && (c.startsWith('#') || c.startsWith('rgb') || c.startsWith('hsl'))) {
    return { cls: '', style: { color: c } };
  }
  return { cls: QUASAR_COLOR_TEXT.primary, style: {} };
}

interface CanvasNodeProps {
  node: WidgetNode;
  isRoot?: boolean;
}

export const CanvasNode: React.FC<CanvasNodeProps> = ({ node, isRoot = false }) => {
  const { selectedNodeId, selectNode, deleteNode, duplicateNode, moveNodeRelative } =
    useDesignerStore();
  const jumpToEventHandler = useIdeStore((s) => s.jumpToEventHandler);

  const def = getWidgetDefinition(node.type);
  const isContainer = isRoot || Boolean(def?.isContainer);
  const isSelected = selectedNodeId === node.id;

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop:${node.id}`,
    data: { targetNodeId: node.id },
    disabled: !isContainer,
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: `node:${node.id}`,
    data: { source: 'canvas', nodeId: node.id },
    disabled: isRoot,
  });

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(node.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!def?.defaultEvent) return;
    const eventKey = def.defaultEvent;
    const existing = node.events[eventKey];
    const defaultSuffix = def.events.find((ev) => ev.key === eventKey)?.defaultSuffix ?? 'event';
    const handlerName = existing || `on_${node.name}_${defaultSuffix}`;
    void jumpToEventHandler(node.id, eventKey, handlerName);
  };

  const hasEvents = Object.keys(node.events || {}).length > 0;

  const renderContainerChildren = (extraClass = '') => (
    <div
      ref={setDropRef}
      className={`min-h-[44px] transition-colors ${extraClass} ${
        isOver ? 'bg-blue-500/15 ring-2 ring-blue-500 ring-inset rounded' : ''
      }`}
    >
      {node.children.length === 0 ? (
        <div className="border border-dashed border-slate-400/50 rounded px-3 py-3 text-center text-[11px] text-slate-400 pointer-events-none">
          Suelta widgets aquí ({node.name})
        </div>
      ) : (
        node.children.map((child) => <CanvasNode key={child.id} node={child} />)
      )}
    </div>
  );

  const renderWidgetPreview = () => {
    const p = node.props || {};
    const qp = parseQuasarProps(node.quasarProps || '');
    const customStyle = inlineCssToReactStyle(node.style || '');
    const isDense = Boolean(qp.dense);
    const isDisable = Boolean(qp.disable);
    const disableCls = isDisable ? 'opacity-50 grayscale' : '';

    switch (node.type) {
      case 'column':
        return (
          <div style={customStyle} className={disableCls}>
            {renderContainerChildren(`flex flex-col ${node.classes || 'gap-3 p-3'}`)}
          </div>
        );
      case 'row':
        return (
          <div style={customStyle} className={disableCls}>
            {renderContainerChildren(`flex flex-row flex-wrap ${node.classes || 'items-center gap-3 p-2'}`)}
          </div>
        );
      case 'card':
        return (
          <div
            style={customStyle}
            className={`bg-white dark:bg-slate-800 ${qp.square ? 'rounded-none' : 'rounded-lg'} ${
              qp.bordered ? 'border-2 border-slate-300' : 'border border-slate-200/80'
            } ${qp.flat ? 'shadow-none' : 'shadow-sm'} ${disableCls} ${node.classes || 'p-4'}`}
          >
            {renderContainerChildren('flex flex-col gap-3')}
          </div>
        );
      case 'grid': {
        const cols = Math.max(1, Math.min(6, Number(p.columns) || 2));
        return (
          <div
            ref={setDropRef}
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, ...customStyle }}
            className={`grid min-h-[48px] ${disableCls} ${node.classes || 'gap-4 p-2'} ${
              isOver ? 'bg-blue-500/15 ring-2 ring-blue-500 ring-inset rounded' : ''
            }`}
          >
            {node.children.length === 0 ? (
              <div className="col-span-full border border-dashed border-slate-400/50 rounded p-3 text-center text-[11px] text-slate-400">
                Grid ({cols} cols) — suelta widgets aquí
              </div>
            ) : (
              node.children.map((child) => <CanvasNode key={child.id} node={child} />)
            )}
          </div>
        );
      }
      case 'expansion':
        return (
          <div style={customStyle} className={`border border-slate-300 rounded-md overflow-hidden bg-white ${disableCls} ${node.classes}`}>
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-700">
              <span>{String(p.text || 'Sección desplegable')}</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </div>
            <div className="p-3">{renderContainerChildren('flex flex-col gap-2')}</div>
          </div>
        );
      case 'scroll_area':
        return (
          <div style={customStyle} className={`border border-dashed border-sky-400/70 rounded bg-sky-50/30 overflow-auto ${disableCls} ${node.classes || 'w-full h-40 p-2'}`}>
            <div className="text-[10px] font-mono text-sky-600 mb-1">Scroll Area</div>
            {renderContainerChildren('flex flex-col gap-2')}
          </div>
        );
      case 'dialog':
        return (
          <div style={customStyle} className={`border-2 border-dashed border-purple-400 rounded-lg bg-purple-50/40 p-3 ${disableCls} ${node.classes}`}>
            <div className="text-[10px] font-mono text-purple-700 font-semibold mb-2">
              Dialog Modal ({p.value ? 'abierto' : 'cerrado por defecto'})
            </div>
            {renderContainerChildren('flex flex-col gap-2')}
          </div>
        );
      case 'header':
      case 'footer':
        return (
          <div style={customStyle} className={`w-full bg-[#1976d2] text-white px-4 py-2 rounded ${disableCls} ${node.classes}`}>
            <div className="text-[9px] font-mono uppercase opacity-75 mb-1">ui.{node.type}</div>
            {renderContainerChildren('flex flex-row flex-wrap items-center gap-3')}
          </div>
        );
      case 'left_drawer':
      case 'right_drawer':
        return (
          <div style={customStyle} className={`border border-slate-300 bg-slate-100 rounded p-3 ${disableCls} ${node.classes}`}>
            <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">ui.{node.type}</div>
            {renderContainerChildren('flex flex-col gap-2')}
          </div>
        );
      case 'dropdown_button': {
        const bg = resolveColorBg(p.color);
        return (
          <div style={customStyle} className={`inline-flex flex-col gap-1 ${disableCls}`}>
            <div style={bg.style} className={`px-3 py-1.5 rounded text-sm font-medium inline-flex items-center gap-2 ${bg.cls} ${node.classes}`}>
              <span>{String(p.text || 'Opciones')}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            <div className="pl-3 border-l-2 border-slate-300">
              {renderContainerChildren('flex flex-col gap-1')}
            </div>
          </div>
        );
      }
      case 'button_group':
        return (
          <div style={customStyle} className={`inline-flex rounded overflow-hidden border border-slate-300 bg-slate-50 p-1 ${disableCls} ${node.classes}`}>
            {renderContainerChildren('flex flex-row items-center gap-1')}
          </div>
        );
      case 'fab': {
        const bg = resolveColorBg(p.color);
        return (
          <div style={customStyle} className={`inline-flex items-center gap-2 ${disableCls}`}>
            <div style={bg.style} className={`px-3 py-2 rounded-full shadow-md inline-flex items-center gap-1.5 text-sm font-medium ${bg.cls} ${node.classes}`}>
              <span className="material-icons" style={{ fontSize: 20 }}>{String(p.icon || 'add')}</span>
              {Boolean(p.label) && <span>{String(p.label)}</span>}
            </div>
            <div className="pl-2 border-l-2 border-dashed border-slate-300">
              {renderContainerChildren('flex flex-row items-center gap-1')}
            </div>
          </div>
        );
      }
      case 'carousel':
        return (
          <div style={customStyle} className={`border border-slate-300 rounded-lg bg-slate-900/5 p-3 ${disableCls} ${node.classes}`}>
            <div className="text-[10px] font-mono text-slate-500 mb-1">Carousel (slides)</div>
            {renderContainerChildren('flex flex-row gap-2 overflow-x-auto')}
          </div>
        );
      case 'timeline':
        return (
          <div style={customStyle} className={`border-l-2 border-blue-500 pl-4 py-1 ${disableCls} ${node.classes}`}>
            <div className="text-[10px] font-mono text-blue-600 mb-1">Timeline</div>
            {renderContainerChildren('flex flex-col gap-2')}
          </div>
        );
      case 'label':
        return (
          <div style={customStyle} className={`${disableCls} ${node.classes || 'text-base text-slate-800'}`}>
            {String(p.text ?? 'Label')}
          </div>
        );
      case 'badge': {
        const bg = resolveColorBg(p.color);
        return (
          <span style={{ ...bg.style, ...customStyle }} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${bg.cls} ${disableCls} ${node.classes}`}>
            {String(p.text ?? 'NUEVO')}
          </span>
        );
      }
      case 'chip': {
        const bg = resolveColorBg(p.color);
        return (
          <span style={{ ...bg.style, ...customStyle }} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${bg.cls} ${disableCls} ${node.classes}`}>
            <span>{String(p.text ?? 'Chip')}</span>
            {Boolean(p.removable) && <span className="opacity-75">×</span>}
          </span>
        );
      }
      case 'link':
        return (
          <span style={customStyle} className={`text-sm text-blue-600 underline pointer-events-none ${disableCls} ${node.classes}`}>
            {String(p.text ?? 'Enlace')}
          </span>
        );
      case 'avatar': {
        const bg = resolveColorBg(p.color);
        return (
          <div style={{ ...bg.style, ...customStyle }} className={`w-10 h-10 ${p.square ? 'rounded' : 'rounded-full'} flex items-center justify-center ${bg.cls} ${disableCls} ${node.classes}`}>
            <span className="material-icons" style={{ fontSize: 22 }}>
              {String(p.icon || 'person')}
            </span>
          </div>
        );
      }
      case 'html':
        return (
          <div style={customStyle} className={`p-2 rounded border border-dashed border-amber-400 bg-amber-50/40 text-xs font-mono text-slate-700 ${disableCls} ${node.classes}`}>
            {String(p.content ?? '<div>HTML</div>')}
          </div>
        );
      case 'code':
        return (
          <pre style={customStyle} className={`p-3 rounded bg-slate-900 text-emerald-300 text-xs font-mono overflow-x-auto ${disableCls} ${node.classes}`}>
            {String(p.content ?? "print('Hola')")}
          </pre>
        );
      case 'space':
        return (
          <div style={customStyle} className="min-w-[32px] h-5 border border-dashed border-slate-300 rounded text-[9px] text-slate-400 flex items-center justify-center px-2">
            space
          </div>
        );
      case 'radio': {
        const opts = Array.isArray(p.options) ? p.options : String(p.options || '').split(',').map((s) => s.trim());
        return (
          <div style={customStyle} className={`flex flex-wrap gap-3 text-sm text-slate-700 pointer-events-none ${disableCls} ${node.classes}`}>
            {opts.map((o) => (
              <label key={String(o)} className="inline-flex items-center gap-1.5">
                <input type="radio" readOnly checked={String(p.value) === String(o)} className="accent-[#1976d2]" />
                <span>{String(o)}</span>
              </label>
            ))}
          </div>
        );
      }
      case 'toggle': {
        const opts = Array.isArray(p.options) ? p.options : String(p.options || '').split(',').map((s) => s.trim());
        return (
          <div style={customStyle} className={`inline-flex rounded overflow-hidden border border-[#1976d2] pointer-events-none ${disableCls} ${node.classes}`}>
            {opts.map((o) => {
              const active = String(p.value) === String(o);
              return (
                <span key={String(o)} className={`px-3 py-1 text-xs font-medium ${active ? 'bg-[#1976d2] text-white' : 'bg-white text-[#1976d2]'}`}>
                  {String(o)}
                </span>
              );
            })}
          </div>
        );
      }
      case 'range':
        return (
          <div style={customStyle} className={`flex items-center gap-2 text-xs text-slate-600 ${disableCls} ${node.classes || 'w-full'}`}>
            <span className="font-mono">{Number(p.valueMin ?? 20)}</span>
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full relative">
              <div className="absolute left-[20%] right-[20%] top-0 bottom-0 bg-[#1976d2] rounded-full" />
            </div>
            <span className="font-mono">{Number(p.valueMax ?? 80)}</span>
          </div>
        );
      case 'knob':
        return (
          <div style={customStyle} className={`w-14 h-14 rounded-full border-4 border-[#1976d2] border-r-slate-200 flex items-center justify-center text-xs font-mono text-slate-700 ${disableCls} ${node.classes}`}>
            {String(p.value ?? 0.5)}
          </div>
        );
      case 'date':
        return (
          <div style={customStyle} className={`inline-flex items-center gap-2 px-3 py-2 rounded border border-slate-300 bg-white text-xs text-slate-700 ${disableCls} ${node.classes}`}>
            <span>📅</span>
            <span className="font-mono">{String(p.value || '2026-01-01')}</span>
          </div>
        );
      case 'time':
        return (
          <div style={customStyle} className={`inline-flex items-center gap-2 px-3 py-2 rounded border border-slate-300 bg-white text-xs text-slate-700 ${disableCls} ${node.classes}`}>
            <span>🕒</span>
            <span className="font-mono">{String(p.value || '12:00')}</span>
          </div>
        );
      case 'color_input':
        return (
          <div style={customStyle} className={`flex flex-col gap-1 ${disableCls} ${node.classes || 'w-full'}`}>
            {Boolean(p.label) && <label className="text-xs font-medium text-slate-600">{String(p.label)}</label>}
            <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono text-slate-700">
              <span className="w-4 h-4 rounded border border-slate-300" style={{ backgroundColor: String(p.value || '#1976d2') }} />
              <span>{String(p.value || '#1976d2')}</span>
            </div>
          </div>
        );
      case 'upload':
        return (
          <div style={customStyle} className={`border-2 border-dashed border-slate-300 rounded-lg p-4 text-center bg-slate-50 text-xs text-slate-500 ${disableCls} ${node.classes || 'w-full'}`}>
            ⬆ {String(p.label || 'Subir archivos')}
          </div>
        );
      case 'editor':
        return (
          <div style={customStyle} className={`border border-slate-300 rounded bg-white overflow-hidden ${disableCls} ${node.classes || 'w-full'}`}>
            <div className="px-2 py-1 bg-slate-100 border-b border-slate-200 text-[10px] font-mono text-slate-500 flex gap-2">
              <b>B</b> <i>I</i> <u>U</u> • Rich Text Editor
            </div>
            <div className="p-2 text-xs text-slate-700 min-h-[56px]">{String(p.placeholder || 'Editor WYSIWYG...')}</div>
          </div>
        );
      case 'input_chips': {
        const chips = Array.isArray(p.value) ? p.value : String(p.value || '').split(',').map((s) => s.trim()).filter(Boolean);
        return (
          <div style={customStyle} className={`flex flex-col gap-1 ${disableCls} ${node.classes || 'w-full'}`}>
            {Boolean(p.label) && <label className="text-xs font-medium text-slate-600">{String(p.label)}</label>}
            <div className="flex flex-wrap gap-1.5 px-2.5 py-1.5 border border-slate-300 rounded bg-white">
              {chips.map((c, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  {String(c)} ×
                </span>
              ))}
            </div>
          </div>
        );
      }
      case 'rating': {
        const max = Math.max(1, Math.min(10, Number(p.max || 5)));
        const val = Number(p.value || 0);
        return (
          <div style={customStyle} className={`inline-flex items-center gap-0.5 pointer-events-none ${disableCls} ${node.classes}`}>
            {Array.from({ length: max }).map((_, i) => (
              <span
                key={i}
                className={`material-icons ${i < val ? 'text-amber-400' : 'text-slate-300'}`}
                style={{ fontSize: 22 }}
              >
                {String(p.icon || 'star')}
              </span>
            ))}
          </div>
        );
      }
      case 'joystick':
        return (
          <div style={customStyle} className={`w-20 h-20 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center ${disableCls} ${node.classes}`}>
            <div className="w-9 h-9 rounded-full bg-[#1976d2] shadow-md" />
          </div>
        );
      case 'codemirror':
        return (
          <div style={customStyle} className={`rounded border border-slate-700 bg-[#1e1e1e] text-[#d4d4d4] overflow-hidden ${disableCls} ${node.classes || 'w-full'}`}>
            <div className="px-2 py-1 bg-[#2d2d30] text-[10px] font-mono text-[#9cdcfe]">
              CodeMirror ({String(p.language || 'Python')})
            </div>
            <pre className="p-2.5 text-xs font-mono overflow-x-auto">{String(p.value || "print('Hola')")}</pre>
          </div>
        );
      case 'xterm':
        return (
          <div style={customStyle} className={`rounded bg-black text-emerald-400 p-2.5 font-mono text-xs h-28 border border-slate-700 ${disableCls} ${node.classes || 'w-full'}`}>
            <div>user@nicegui:~$ _</div>
          </div>
        );
      case 'color_picker':
        return (
          <div style={customStyle} className={`inline-flex items-center gap-2 px-3 py-2 rounded border border-slate-300 bg-white text-xs text-slate-700 ${disableCls} ${node.classes}`}>
            <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-red-500 via-emerald-500 to-blue-500 border border-slate-200" />
            <span>Color Picker ({node.name})</span>
          </div>
        );
      case 'date_input':
      case 'time_input':
        return (
          <div style={customStyle} className={`flex flex-col gap-1 ${disableCls} ${node.classes || 'w-full'}`}>
            {Boolean(p.label) && <label className="text-xs font-medium text-slate-600">{String(p.label)}</label>}
            <div className="flex items-center justify-between px-3 py-2 border-b-2 border-slate-300 bg-slate-50/70 rounded-t text-sm text-slate-800">
              <span className="font-mono">{String(p.value || p.placeholder || '')}</span>
              <span className="material-icons text-slate-500" style={{ fontSize: 18 }}>
                {node.type === 'date_input' ? 'calendar_today' : 'schedule'}
              </span>
            </div>
          </div>
        );
      case 'table':
      case 'aggrid': {
        const agOpts =
          node.type === 'aggrid' && typeof p.options === 'object' && p.options !== null
            ? (p.options as {
                columnDefs?: Array<{ headerName?: string; field?: string }>;
                rowData?: Array<Record<string, unknown>>;
              })
            : null;
        const cols =
          node.type === 'aggrid'
            ? (agOpts?.columnDefs ?? [{ headerName: 'Columna 1', field: 'col1' }]).map((c) => ({
                label: c.headerName || c.field || 'Col',
                field: c.field || '',
              }))
            : (Array.isArray(p.columns)
                ? (p.columns as Array<{ label?: string; name?: string; field?: string }>)
                : [{ label: 'Columna 1', field: 'col1' }]
              ).map((c) => ({
                label: c.label || c.name || 'Col',
                field: c.field || c.name || '',
              }));
        const previewRows =
          node.type === 'aggrid'
            ? (agOpts?.rowData ?? [])
            : Array.isArray(p.rows)
              ? (p.rows as Array<Record<string, unknown>>)
              : [];
        const dsTable = String(p.dataSourceTable || '');

        return (
          <div style={customStyle} className={`border border-slate-300 rounded-lg overflow-hidden bg-white ${disableCls} ${node.classes || 'w-full'}`}>
            <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>{String(p.title || (node.type === 'aggrid' ? 'AG Grid' : 'Table'))}</span>
              {dsTable && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                  DB: {dsTable} ({previewRows.length})
                </span>
              )}
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  {cols.slice(0, 5).map((c, i) => (
                    <th key={i} className="px-3 py-1.5 font-medium">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-100">
                {previewRows.length > 0 ? (
                  previewRows.slice(0, 4).map((row, rIdx) => (
                    <tr key={rIdx}>
                      {cols.slice(0, 5).map((c, cIdx) => (
                        <td key={cIdx} className="px-3 py-1.5 truncate max-w-[140px]">
                          {String(row[c.field] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    {cols.slice(0, 5).map((_, i) => (
                      <td key={i} className="px-3 py-1.5 text-slate-400 italic">Sin filas</td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      }
      case 'tree':
        return (
          <div style={customStyle} className={`p-2 border border-slate-200 rounded bg-white text-xs text-slate-700 font-mono ${disableCls} ${node.classes}`}>
            <div>▾ Raíz</div>
            <div className="pl-4 text-slate-500">├─ Elemento A</div>
            <div className="pl-4 text-slate-500">└─ Elemento B</div>
          </div>
        );
      case 'json_editor':
        return (
          <pre style={customStyle} className={`p-2 rounded border border-slate-300 bg-slate-50 text-[11px] font-mono text-slate-700 overflow-x-auto ${disableCls} ${node.classes}`}>
            {JSON.stringify(p.content ?? { key: 'value' }, null, 2)}
          </pre>
        );
      case 'log':
        return (
          <div style={customStyle} className={`p-2 rounded bg-slate-900 text-emerald-400 font-mono text-[11px] h-24 ${disableCls} ${node.classes}`}>
            [INFO] ui.log ({node.name}) listo...
          </div>
        );
      case 'echart':
      case 'highchart':
      case 'uplot':
      case 'plotly':
      case 'line_plot':
      case 'pyplot':
      case 'matplotlib':
      case 'altair':
        return (
          <div style={customStyle} className={`border border-slate-200 rounded-lg bg-white p-3 flex flex-col justify-between h-44 ${disableCls} ${node.classes}`}>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span>ui.{node.type} ({node.name})</span>
              {Boolean(p.dataSourceTable) && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                  DB: {String(p.dataSourceTable)}
                </span>
              )}
            </div>
            <div className="flex items-end justify-around h-28 gap-2 px-4">
              {[42, 78, 56, 90, 65, 82].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-[#1976d2] to-[#42a5f5] rounded-t"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        );
      case 'anywidget':
        return (
          <div style={customStyle} className={`p-3 rounded-lg border border-dashed border-indigo-400 bg-indigo-50/50 text-xs text-indigo-700 font-mono ${disableCls} ${node.classes}`}>
            ⚙ ui.anywidget ({node.name}) — {String(p.placeholder || 'Widget personalizado')}
          </div>
        );
      case 'scene':
        return (
          <div
            style={{ backgroundColor: String(p.background_color || '#eeeeee'), ...customStyle }}
            className={`h-44 rounded-lg border border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-600 ${disableCls} ${node.classes}`}
          >
            <span className="material-icons text-slate-500" style={{ fontSize: 32 }}>view_in_ar</span>
            <span className="text-xs font-semibold">3D Scene ({Number(p.width || 480)}×{Number(p.height || 300)})</span>
            <span className="text-[10px] font-mono text-slate-500">cámara: {String(p.control_type || 'orbit')}</span>
          </div>
        );
      case 'leaflet':
        return (
          <div
            style={customStyle}
            className={`h-48 rounded-lg border border-emerald-300 bg-gradient-to-br from-emerald-50 via-sky-50 to-emerald-100 flex flex-col items-center justify-center gap-1 text-slate-700 relative overflow-hidden ${disableCls} ${node.classes}`}
          >
            <span className="material-icons text-red-500 drop-shadow" style={{ fontSize: 32 }}>location_on</span>
            <span className="text-xs font-semibold">Leaflet Map ({node.name})</span>
            <span className="text-[10px] font-mono bg-white/80 px-2 py-0.5 rounded border border-slate-200">
              lat: {Number(p.lat ?? -34.6037)}, lng: {Number(p.lng ?? -58.3816)} • zoom {Number(p.zoom ?? 12)}
            </span>
          </div>
        );
      case 'linear_progress': {
        const pct = Math.max(0, Math.min(100, Math.round(Number(p.value ?? 0.65) * 100)));
        return (
          <div style={customStyle} className={`w-full bg-slate-200 rounded-full h-4 overflow-hidden relative ${disableCls} ${node.classes}`}>
            <div className="bg-[#1976d2] h-full transition-all" style={{ width: `${pct}%` }} />
            {Boolean(p.show_value) && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                {pct}%
              </span>
            )}
          </div>
        );
      }
      case 'circular_progress': {
        const pct = Math.max(0, Math.min(100, Math.round(Number(p.value ?? 0.7) * 100)));
        return (
          <div style={customStyle} className={`w-12 h-12 rounded-full border-4 border-[#1976d2] border-t-slate-200 flex items-center justify-center text-[11px] font-bold text-[#1976d2] ${disableCls} ${node.classes}`}>
            {pct}%
          </div>
        );
      }
      case 'spinner':
        return (
          <div style={customStyle} className={`w-7 h-7 rounded-full border-4 border-[#1976d2] border-t-transparent animate-spin ${disableCls} ${node.classes}`} />
        );
      case 'image':
        return (
          <img
            style={customStyle}
            src={String(p.source || '')}
            alt={node.name}
            className={`max-h-48 object-cover rounded border border-slate-200 pointer-events-none ${disableCls} ${node.classes}`}
          />
        );
      case 'audio':
        return (
          <div style={customStyle} className={`px-3 py-2 rounded-full bg-slate-100 border border-slate-300 text-xs text-slate-600 flex items-center gap-2 ${disableCls} ${node.classes}`}>
            <span>▶</span>
            <span>Audio Player ({node.name})</span>
          </div>
        );
      case 'video':
        return (
          <div style={customStyle} className={`h-36 rounded bg-slate-900 text-slate-300 flex items-center justify-center text-xs ${disableCls} ${node.classes}`}>
            ▶ Video Player ({node.name})
          </div>
        );
      case 'pagination':
        return (
          <div style={customStyle} className={`inline-flex items-center gap-1 text-xs ${disableCls} ${node.classes}`}>
            {['‹', '1', '2', '3', '4', '5', '›'].map((n, i) => (
              <span key={i} className={`px-2 py-1 rounded ${n === '1' ? 'bg-[#1976d2] text-white' : 'bg-slate-100 text-slate-700'}`}>
                {n}
              </span>
            ))}
          </div>
        );
      case 'chat_message':
        return (
          <div style={customStyle} className={`flex flex-col ${p.sent ? 'items-end' : 'items-start'} ${disableCls} ${node.classes}`}>
            <span className="text-[10px] text-slate-500 mb-0.5">{String(p.name || 'Asistente')}</span>
            <div className={`px-3 py-2 rounded-lg text-xs max-w-[80%] ${p.sent ? 'bg-[#1976d2] text-white' : 'bg-slate-200 text-slate-800'}`}>
              {String(p.text || '¡Hola desde NiceGUI!')}
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5">{String(p.stamp || 'ahora')}</span>
          </div>
        );
      case 'markdown':
        return (
          <div style={customStyle} className={`prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap ${disableCls} ${node.classes}`}>
            {String(p.content ?? '**Markdown**')}
          </div>
        );
      case 'button': {
        const bg = resolveColorBg(p.color);
        const txt = resolveColorText(p.color);
        const variantCls = qp.outline
          ? `bg-transparent border-2 border-current ${txt.cls}`
          : qp.flat
            ? `bg-transparent shadow-none ${txt.cls}`
            : `${bg.cls} ${qp.unelevated ? 'shadow-none' : 'shadow-sm'}`;
        const variantStyle = qp.outline || qp.flat ? txt.style : bg.style;
        const shapeCls = qp.round
          ? 'rounded-full w-10 h-10 p-0 justify-center'
          : qp.rounded
            ? 'rounded-full'
            : qp.square
              ? 'rounded-none'
              : 'rounded';
        const actionType = String(p.actionType || '');
        const actionTarget = String(p.actionTarget || '');
        const actionBadge =
          actionType === 'navigate' && actionTarget
            ? `→ ${actionTarget}`
            : actionType === 'navigate_new_tab' && actionTarget
              ? `↗ ${actionTarget}`
              : actionType === 'open_dialog' && actionTarget
                ? `⧉ ${actionTarget}`
                : actionType === 'navigate_back'
                  ? '← atrás'
                  : '';
        return (
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              style={{ ...variantStyle, ...customStyle }}
              className={`${isDense ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm'} ${shapeCls} ${variantCls} ${
                qp['no-caps'] ? 'normal-case' : 'uppercase'
              } font-medium tracking-wide inline-flex items-center gap-2 pointer-events-none ${disableCls} ${node.classes}`}
            >
              {Boolean(p.icon) && (
                <span className="material-icons" style={{ fontSize: isDense ? 15 : 18 }}>
                  {String(p.icon)}
                </span>
              )}
              <span>{String(p.text ?? 'Button')}</span>
            </button>
            {actionBadge && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 pointer-events-none">
                {actionBadge}
              </span>
            )}
          </div>
        );
      }
      case 'icon': {
        const txt = resolveColorText(p.color);
        const sizeMap: Record<string, number> = { xs: 16, sm: 20, md: 28, lg: 36, xl: 48 };
        const px = sizeMap[String(p.size || 'md')] ?? 28;
        return (
          <span
            style={{ ...txt.style, ...customStyle, fontSize: px }}
            className={`material-icons inline-flex items-center justify-center ${txt.cls} ${disableCls} ${node.classes}`}
          >
            {String(p.name || 'star')}
          </span>
        );
      }
      case 'separator':
        return <hr style={customStyle} className={`border-slate-300 my-1 ${node.classes}`} />;
      case 'input': {
        const inputStyleCls = qp.outlined
          ? 'border border-slate-400 bg-white rounded'
          : qp.filled
            ? 'border-b-2 border-slate-400 bg-slate-100 rounded-t'
            : qp.borderless
              ? 'border-0 bg-transparent'
              : 'border-b-2 border-slate-300 bg-slate-50/70 rounded-t';
        return (
          <div style={customStyle} className={`flex flex-col gap-1 ${disableCls} ${node.classes || 'w-full'}`}>
            {Boolean(p.label) && <label className="text-xs font-medium text-slate-600">{String(p.label)}</label>}
            <input
              readOnly
              type={p.password ? 'password' : 'text'}
              value={String(p.value ?? '')}
              placeholder={String(p.placeholder ?? '')}
              className={`w-full ${isDense ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} ${inputStyleCls} ${
                qp.rounded ? 'rounded-full' : ''
              } text-slate-800 pointer-events-none`}
            />
            {typeof qp.hint === 'string' && <span className="text-[10px] text-slate-400">{qp.hint}</span>}
          </div>
        );
      }
      case 'textarea': {
        const areaCls = qp.outlined
          ? 'border border-slate-400 bg-white rounded'
          : qp.filled
            ? 'border-b-2 border-slate-400 bg-slate-100 rounded-t'
            : 'border border-slate-300 bg-slate-50/70 rounded';
        return (
          <div style={customStyle} className={`flex flex-col gap-1 ${disableCls} ${node.classes || 'w-full'}`}>
            {Boolean(p.label) && <label className="text-xs font-medium text-slate-600">{String(p.label)}</label>}
            <textarea
              readOnly
              rows={3}
              value={String(p.value ?? '')}
              placeholder={String(p.placeholder ?? '')}
              className={`w-full px-3 py-2 text-sm ${areaCls} text-slate-800 pointer-events-none resize-none`}
            />
          </div>
        );
      }
      case 'number':
        return (
          <div style={customStyle} className={`flex flex-col gap-1 ${disableCls} ${node.classes || 'w-full'}`}>
            {Boolean(p.label) && <label className="text-xs font-medium text-slate-600">{String(p.label)}</label>}
            <input
              readOnly
              type="number"
              value={Number(p.value ?? 0)}
              className={`w-full ${isDense ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} ${
                qp.outlined ? 'border border-slate-400 bg-white rounded' : 'border-b-2 border-slate-300 bg-slate-50/70 rounded-t'
              } text-slate-800 pointer-events-none`}
            />
          </div>
        );
      case 'select': {
        const opts = Array.isArray(p.options)
          ? p.options
          : String(p.options || '').split(',').map((s) => s.trim());
        return (
          <div style={customStyle} className={`flex flex-col gap-1 ${disableCls} ${node.classes || 'w-full'}`}>
            {Boolean(p.label) && <label className="text-xs font-medium text-slate-600">{String(p.label)}</label>}
            <div
              className={`w-full ${isDense ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} ${
                qp.outlined ? 'border border-slate-400 bg-white rounded' : 'border-b-2 border-slate-300 bg-slate-50/70 rounded-t'
              } text-slate-800 flex items-center justify-between`}
            >
              <span>{String(p.value || opts[0] || 'Seleccionar...')}</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        );
      }
      case 'checkbox':
        return (
          <label style={customStyle} className={`inline-flex items-center gap-2 text-sm text-slate-700 pointer-events-none ${disableCls} ${node.classes}`}>
            <input type="checkbox" readOnly checked={Boolean(p.value)} className="w-4 h-4 accent-[#1976d2]" />
            <span>{String(p.text ?? 'Checkbox')}</span>
          </label>
        );
      case 'switch':
        return (
          <div style={customStyle} className={`inline-flex items-center gap-2 text-sm text-slate-700 pointer-events-none ${disableCls} ${node.classes}`}>
            <div className={`w-9 h-5 rounded-full p-0.5 transition ${p.value ? 'bg-[#1976d2]' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${p.value ? 'translate-x-4' : ''}`} />
            </div>
            <span>{String(p.text ?? 'Switch')}</span>
          </div>
        );
      case 'slider':
        return (
          <div style={customStyle} className={`flex items-center gap-3 ${disableCls} ${node.classes || 'w-full'}`}>
            <input
              type="range"
              readOnly
              min={Number(p.min ?? 0)}
              max={Number(p.max ?? 100)}
              value={Number(p.value ?? 50)}
              className="w-full accent-[#1976d2] pointer-events-none"
            />
            <span className="text-xs font-mono text-slate-500 w-8 text-right">{Number(p.value ?? 50)}</span>
          </div>
        );
      default:
        return (
          <div style={customStyle} className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-xs font-mono">
            ui.{node.type} ({node.name})
          </div>
        );
    }
  };

  if (isRoot) {
    return (
      <div
        onClick={handleSelect}
        className={`relative min-h-[480px] transition ${
          isSelected ? 'ring-2 ring-[#007acc]/70' : ''
        }`}
      >
        {renderContainerChildren(`flex flex-col ${node.classes || 'gap-4 p-6'}`)}
      </div>
    );
  }

  return (
    <div
      ref={setDragRef}
      onClick={handleSelect}
      onDoubleClick={handleDoubleClick}
      className={`group/node relative rounded transition-all ${
        isDragging ? 'opacity-30' : ''
      } ${
        isSelected
          ? 'ring-2 ring-[#007acc] ring-offset-1 ring-offset-white'
          : 'hover:ring-1 hover:ring-[#007acc]/60'
      }`}
    >
      {/* Floating Visual Studio–style widget badge & quick actions */}
      {isSelected && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-6 left-0 z-30 flex items-center gap-0.5 bg-[#007acc] text-white text-[10px] font-mono px-1.5 py-0.5 rounded-t shadow"
        >
          <span
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing pr-1 flex items-center"
            title="Arrastrar a otro contenedor"
          >
            <GripVertical className="w-3 h-3" />
          </span>
          <span className="pr-1.5 font-semibold">{node.name}</span>
          {hasEvents && <Zap className="w-3 h-3 text-yellow-300 mr-1" />}
          <button
            type="button"
            onClick={() => moveNodeRelative(node.id, 'up')}
            className="p-0.5 hover:bg-white/20 rounded"
            title="Subir"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => moveNodeRelative(node.id, 'down')}
            className="p-0.5 hover:bg-white/20 rounded"
            title="Bajar"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => duplicateNode(node.id)}
            className="p-0.5 hover:bg-white/20 rounded"
            title="Duplicar"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => deleteNode(node.id)}
            className="p-0.5 hover:bg-red-500 rounded"
            title="Eliminar (Supr)"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {renderWidgetPreview()}
    </div>
  );
};
