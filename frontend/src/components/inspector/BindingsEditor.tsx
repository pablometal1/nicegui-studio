import React, { useState } from 'react';
import { Link2, Plus, Trash2, Sparkles } from 'lucide-react';
import { useDesignerStore } from '../../store/designerStore';
import type { WidgetBinding, WidgetNode } from '../../types/ide';

interface BindingsEditorProps {
  node: WidgetNode;
}

const VALUE_WIDGETS = new Set([
  'input', 'textarea', 'number', 'select', 'radio', 'toggle', 'checkbox', 'switch',
  'slider', 'range', 'knob', 'date', 'time', 'date_input', 'time_input',
  'color_input', 'rating', 'input_chips', 'editor', 'codemirror', 'linear_progress',
  'circular_progress', 'pagination', 'dialog', 'expansion', 'left_drawer', 'right_drawer',
]);

const TEXT_WIDGETS = new Set([
  'label', 'button', 'badge', 'chip', 'checkbox', 'switch', 'dropdown_button', 'expansion',
]);

const ENABLED_WIDGETS = new Set([
  'button', 'input', 'textarea', 'number', 'select', 'radio', 'toggle', 'checkbox',
  'switch', 'slider', 'range', 'knob', 'date', 'time', 'date_input', 'time_input',
  'color_input', 'rating', 'input_chips', 'dropdown_button',
]);

const CONTENT_WIDGETS = new Set(['markdown', 'html', 'code']);

function getBindablePropsFor(widgetType: string): Array<{ value: string; label: string }> {
  const out: Array<{ value: string; label: string }> = [
    { value: 'visibility', label: 'Visibilidad (visible)' },
  ];
  if (ENABLED_WIDGETS.has(widgetType)) {
    out.push({ value: 'enabled', label: 'Habilitado (enabled)' });
  }
  if (VALUE_WIDGETS.has(widgetType)) {
    out.push({ value: 'value', label: 'Valor (value)' });
  }
  if (TEXT_WIDGETS.has(widgetType)) {
    out.push({ value: 'text', label: 'Texto (text)' });
  }
  if (widgetType === 'image') {
    out.push({ value: 'source', label: 'Fuente imagen (source)' });
  }
  if (CONTENT_WIDGETS.has(widgetType)) {
    out.push({ value: 'content', label: 'Contenido (content)' });
  }
  if (widgetType === 'button' || widgetType === 'icon') {
    out.push({ value: 'icon', label: 'Icono (icon)' });
  }
  return out;
}

function collectOtherNodes(root: WidgetNode | null, excludeId: string, out: WidgetNode[] = []): WidgetNode[] {
  if (!root) return out;
  if (root.id !== excludeId && root.id !== 'root') {
    out.push(root);
  }
  for (const c of root.children) {
    collectOtherNodes(c, excludeId, out);
  }
  return out;
}

const TRANSFORM_PRESETS = [
  { label: 'Directo', value: '' },
  { label: 'Negar (not v)', value: 'not v' },
  { label: 'No vacío (bool)', value: 'bool(v)' },
  { label: 'Texto (str)', value: 'str(v)' },
  { label: 'Formato', value: "f'Valor: {v}'" },
];

function previewBindingCode(attrName: string, b: WidgetBinding): string {
  if (b.mode === 'storage_user') {
    return `self.${attrName}.bind_${b.property}(app.storage.user, '${b.storageKey || `${attrName}_${b.property}`}')`;
  }
  if (b.mode === 'two_way') {
    return `self.${attrName}.bind_${b.property}(self.${b.sourceControl}, '${b.sourceProperty}')`;
  }
  if (b.transform.trim()) {
    return `self.${attrName}.bind_${b.property}_from(self.${b.sourceControl}, '${b.sourceProperty}', backward=lambda v: ${b.transform.trim()})`;
  }
  return `self.${attrName}.bind_${b.property}_from(self.${b.sourceControl}, '${b.sourceProperty}')`;
}

export const BindingsEditor: React.FC<BindingsEditorProps> = ({ node }) => {
  const { document, addNodeBinding, deleteNodeBinding } = useDesignerStore();
  const bindableProps = getBindablePropsFor(node.type);
  const otherNodes = collectOtherNodes(document?.root ?? null, node.id);

  const [property, setProperty] = useState<string>(bindableProps[0]?.value ?? 'visibility');
  const [mode, setMode] = useState<'from_control' | 'two_way' | 'storage_user'>('from_control');
  const [sourceControl, setSourceControl] = useState<string>(otherNodes[0]?.name ?? '');
  const [sourceProperty, setSourceProperty] = useState<string>('value');
  const [storageKey, setStorageKey] = useState<string>(`${node.name}_value`);
  const [transform, setTransform] = useState<string>('');

  const activeBindings = node.bindings ?? [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== 'storage_user' && !sourceControl.trim()) return;
    addNodeBinding(node.id, {
      property,
      mode,
      sourceControl: mode === 'storage_user' ? '' : sourceControl,
      sourceProperty: mode === 'storage_user' ? '' : sourceProperty,
      storageKey: mode === 'storage_user' ? storageKey.trim() || `${node.name}_${property}` : '',
      transform: mode === 'from_control' ? transform.trim() : '',
    });
    setTransform('');
  };

  return (
    <div className="space-y-3">
      <div className="text-[11px] text-[#9c9c9c] leading-snug">
        Enlaza propiedades reactivas de <code className="text-[#4fc1ff]">self.{node.name}</code> con otros controles o con <code className="text-[#dcdcaa]">app.storage.user</code> sin escribir eventos.
      </div>

      {/* Active bindings list */}
      {activeBindings.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-[#9c9c9c] font-semibold">
            Bindings activos ({activeBindings.length})
          </div>
          {activeBindings.map((b) => (
            <div
              key={b.id}
              className="p-2 rounded bg-[#1e1e1e] border border-[#007acc]/50 space-y-1"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-white flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-[#4fc1ff]" />
                  <span>{b.property}</span>
                  <span className="text-[10px] font-normal text-[#9c9c9c]">
                    ({b.mode === 'two_way' ? '↔ 2-way' : b.mode === 'storage_user' ? '💾 storage' : '← 1-way'})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => deleteNodeBinding(node.id, b.id)}
                  className="p-0.5 rounded hover:bg-red-600/30 text-[#999] hover:text-red-400"
                  title="Eliminar binding"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <pre className="text-[10px] font-mono text-[#9cdcfe] whitespace-pre-wrap break-all bg-[#141416] p-1.5 rounded">
                {previewBindingCode(node.name, b)}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* New binding builder */}
      <form
        onSubmit={handleAdd}
        className="p-2.5 rounded-lg bg-[#2d2d30] border border-[#3e3e42] space-y-2.5"
      >
        <div className="text-[11px] font-semibold text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#dcdcaa]" />
          <span>Nuevo Binding Reactivo</span>
        </div>

        <div>
          <label className="block text-[10px] text-[#a0a0a0] mb-1">Propiedad de este control</label>
          <select
            value={property}
            onChange={(e) => setProperty(e.target.value)}
            className="w-full bg-[#3c3c3c] text-[11px] text-white px-2 py-1 rounded border border-[#555555]"
          >
            {bindableProps.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-[#a0a0a0] mb-1">Modo de enlace</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'from_control' | 'two_way' | 'storage_user')}
            className="w-full bg-[#3c3c3c] text-[11px] text-white px-2 py-1 rounded border border-[#555555]"
          >
            <option value="from_control">← Desde otro control (1-way)</option>
            <option value="two_way">↔ Bidireccional con otro control (2-way)</option>
            <option value="storage_user">💾 Persistir en app.storage.user</option>
          </select>
        </div>

        {mode === 'storage_user' ? (
          <div>
            <label className="block text-[10px] text-[#a0a0a0] mb-1">Clave en app.storage.user</label>
            <input
              type="text"
              value={storageKey}
              onChange={(e) => setStorageKey(e.target.value)}
              placeholder={`${node.name}_value`}
              className="w-full bg-[#3c3c3c] text-[11px] font-mono text-white px-2 py-1 rounded border border-[#555555]"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-[10px] text-[#a0a0a0] mb-1">Control origen</label>
              {otherNodes.length === 0 ? (
                <div className="text-[10px] text-[#f48771]">
                  Agrega al menos otro control al formulario para enlazar.
                </div>
              ) : (
                <select
                  value={sourceControl}
                  onChange={(e) => setSourceControl(e.target.value)}
                  className="w-full bg-[#3c3c3c] text-[11px] font-mono text-white px-2 py-1 rounded border border-[#555555]"
                >
                  {otherNodes.map((n) => (
                    <option key={n.id} value={n.name}>
                      self.{n.name} ({n.type})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[10px] text-[#a0a0a0] mb-1">Propiedad origen</label>
              <select
                value={sourceProperty}
                onChange={(e) => setSourceProperty(e.target.value)}
                className="w-full bg-[#3c3c3c] text-[11px] font-mono text-white px-2 py-1 rounded border border-[#555555]"
              >
                <option value="value">value</option>
                <option value="text">text</option>
                <option value="visible">visible</option>
                <option value="enabled">enabled</option>
              </select>
            </div>

            {mode === 'from_control' && (
              <div className="space-y-1">
                <label className="block text-[10px] text-[#a0a0a0]">
                  Transformación Python opcional (variable <code className="text-[#4fc1ff]">v</code>)
                </label>
                <input
                  type="text"
                  value={transform}
                  onChange={(e) => setTransform(e.target.value)}
                  placeholder="ej: not v, bool(v), f'Total: ${v}'"
                  className="w-full bg-[#3c3c3c] text-[11px] font-mono text-[#ce9178] px-2 py-1 rounded border border-[#555555]"
                />
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {TRANSFORM_PRESETS.map((pr) => (
                    <button
                      key={pr.label}
                      type="button"
                      onClick={() => setTransform(pr.value)}
                      className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-[#1e1e1e] hover:bg-[#007acc] text-[#cccccc] hover:text-white border border-[#3e3e42]"
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={mode !== 'storage_user' && otherNodes.length === 0}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agregar Binding</span>
        </button>
      </form>
    </div>
  );
};
