import React, { useState } from 'react';
import { Sliders, Palette, Zap, Code2, Link2, ExternalLink } from 'lucide-react';
import { getNiceGuiDocUrl, getWidgetDefinition, type PropSchema } from '../../registry/widgets';
import { findNodeById, useDesignerStore } from '../../store/designerStore';
import { useIdeStore } from '../../store/ideStore';
import { StylesEditor } from './StylesEditor';
import { TableDataBindingBox } from './TableDataBindingBox';
import { SelectAndChartDataBindingBox } from './SelectAndChartDataBindingBox';
import { ButtonActionBox } from './ButtonActionBox';
import { IconPickerField } from './IconPickerField';
import { ColorPickerField } from './ColorPickerField';
import { BindingsEditor } from './BindingsEditor';
import { WidgetMethodsBox } from './WidgetMethodsBox';

export const PropertiesInspector: React.FC = () => {
  const [tab, setTab] = useState<'props' | 'styles' | 'events' | 'bindings'>('props');
  const {
    document,
    selectedNodeId,
    updateNodeMeta,
    updateNodeProp,
    updateNodeEvent,
    updateFormSettings,
  } = useDesignerStore();
  const jumpToEventHandler = useIdeStore((s) => s.jumpToEventHandler);

  if (!document) {
    return (
      <div className="p-4 text-xs text-[#858585]">
        Abre un formulario para inspeccionar sus propiedades.
      </div>
    );
  }

  const node = selectedNodeId ? findNodeById(document.root, selectedNodeId) : document.root;
  if (!node) {
    return <div className="p-4 text-xs text-[#858585]">Selecciona un control en el lienzo.</div>;
  }

  const isRoot = node.id === document.root.id;
  const def = getWidgetDefinition(node.type);

  const renderPropField = (schema: PropSchema) => {
    const val = node.props[schema.key] ?? schema.defaultValue ?? '';

    if (schema.type === 'boolean') {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(val)}
            onChange={(e) => updateNodeProp(node.id, schema.key, e.target.checked)}
            className="accent-[#007acc]"
          />
          <span className="text-xs text-[#d4d4d4]">{schema.label}</span>
        </label>
      );
    }

    if (
      schema.key.toLowerCase().includes('color') ||
      (node.type === 'color_input' && schema.key === 'value')
    ) {
      return (
        <ColorPickerField
          value={String(val ?? '')}
          onChange={(next) => updateNodeProp(node.id, schema.key, next)}
          placeholder={schema.placeholder || '#1976d2'}
        />
      );
    }

    if (schema.type === 'select') {
      return (
        <select
          value={String(val)}
          onChange={(e) => updateNodeProp(node.id, schema.key, e.target.value)}
          className="w-full bg-[#3c3c3c] text-xs text-[#e0e0e0] px-2 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
        >
          {(schema.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (schema.type === 'textarea') {
      return (
        <textarea
          rows={3}
          value={String(val)}
          onChange={(e) => updateNodeProp(node.id, schema.key, e.target.value)}
          placeholder={schema.placeholder}
          className="w-full bg-[#3c3c3c] text-xs text-[#e0e0e0] px-2 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc] font-mono"
        />
      );
    }

    if (schema.type === 'number') {
      return (
        <input
          type="number"
          value={val === '' ? '' : Number(val)}
          onChange={(e) =>
            updateNodeProp(
              node.id,
              schema.key,
              e.target.value === '' ? '' : Number(e.target.value)
            )
          }
          className="w-full bg-[#3c3c3c] text-xs text-[#e0e0e0] px-2 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
        />
      );
    }

    if (schema.type === 'icon' || schema.key.toLowerCase().includes('icon')) {
      return (
        <IconPickerField
          value={String(val ?? '')}
          onChange={(next) => updateNodeProp(node.id, schema.key, next)}
        />
      );
    }

    if (schema.type === 'json') {
      const jsonText =
        typeof val === 'string' ? val : JSON.stringify(val ?? {}, null, 2);
      return (
        <textarea
          rows={5}
          defaultValue={jsonText}
          key={`${node.id}:${schema.key}`}
          onBlur={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              updateNodeProp(node.id, schema.key, parsed);
            } catch {
              // keep raw string if user is mid-edit
              updateNodeProp(node.id, schema.key, e.target.value);
            }
          }}
          className="w-full bg-[#3c3c3c] text-[11px] text-[#ce9178] px-2 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc] font-mono"
        />
      );
    }

    if (schema.type === 'list') {
      const strVal = Array.isArray(val) ? val.join(', ') : String(val);
      return (
        <input
          type="text"
          value={strVal}
          onChange={(e) =>
            updateNodeProp(
              node.id,
              schema.key,
              e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          className="w-full bg-[#3c3c3c] text-xs text-[#e0e0e0] px-2 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
        />
      );
    }

    return (
      <input
        type="text"
        value={String(val)}
        onChange={(e) => updateNodeProp(node.id, schema.key, e.target.value)}
        placeholder={schema.placeholder}
        className="w-full bg-[#3c3c3c] text-xs text-[#e0e0e0] px-2 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
      />
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Selected widget header */}
      <div className="px-3 py-2 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-white truncate font-mono">
            {isRoot ? document.formName : `self.${node.name}`}
          </div>
          <div className="text-[10px] text-[#4fc1ff]">
            {isRoot ? 'Form Root (ui.column)' : `ui.${node.type}`}
          </div>
        </div>
        <a
          href={getNiceGuiDocUrl(isRoot ? 'column' : node.type)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#1e1e1e] hover:bg-[#007acc] border border-[#3e3e42] text-[10px] text-[#4fc1ff] hover:text-white transition shrink-0"
          title={`Abrir documentación oficial de ui.${isRoot ? 'column' : node.type}`}
        >
          <span>Docs</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#3e3e42] bg-[#252526] text-[11px]">
        <button
          onClick={() => setTab('props')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 border-b-2 transition ${
            tab === 'props'
              ? 'border-[#007acc] text-white bg-[#1e1e1e]'
              : 'border-transparent text-[#999] hover:text-white'
          }`}
        >
          <Sliders className="w-3 h-3" />
          <span>Props</span>
        </button>
        <button
          onClick={() => setTab('styles')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 border-b-2 transition ${
            tab === 'styles'
              ? 'border-[#007acc] text-white bg-[#1e1e1e]'
              : 'border-transparent text-[#999] hover:text-white'
          }`}
        >
          <Palette className="w-3 h-3" />
          <span>Estilos</span>
        </button>
        <button
          onClick={() => setTab('events')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 border-b-2 transition ${
            tab === 'events'
              ? 'border-[#007acc] text-white bg-[#1e1e1e]'
              : 'border-transparent text-[#999] hover:text-white'
          }`}
        >
          <Zap className="w-3 h-3" />
          <span>Eventos</span>
        </button>
        <button
          onClick={() => setTab('bindings')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 border-b-2 transition ${
            tab === 'bindings'
              ? 'border-[#007acc] text-white bg-[#1e1e1e]'
              : 'border-transparent text-[#999] hover:text-white'
          }`}
          title="Binding Properties reactivos de NiceGUI"
        >
          <Link2 className="w-3 h-3" />
          <span>Bind</span>
          {(node.bindings?.length ?? 0) > 0 && (
            <span className="text-[9px] px-1 rounded-full bg-[#007acc] text-white">
              {node.bindings!.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tab === 'props' && (
          <>
            {isRoot ? (
              <>
                <div>
                  <label className="block text-[11px] text-[#9c9c9c] mb-1">Nombre de Clase (Form)</label>
                  <input
                    type="text"
                    value={document.formName}
                    onChange={(e) => updateFormSettings({ formName: e.target.value })}
                    className="w-full bg-[#3c3c3c] text-xs text-[#e0e0e0] px-2 py-1.5 rounded border border-[#555555] font-mono focus:outline-none focus:border-[#007acc]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#9c9c9c] mb-1">Título de Página</label>
                  <input
                    type="text"
                    value={document.settings.title}
                    onChange={(e) => updateFormSettings({ title: e.target.value })}
                    className="w-full bg-[#3c3c3c] text-xs text-[#e0e0e0] px-2 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#9c9c9c] mb-1">Ruta (@ui.page)</label>
                  <input
                    type="text"
                    value={document.settings.route}
                    onChange={(e) => updateFormSettings({ route: e.target.value })}
                    className="w-full bg-[#3c3c3c] text-xs text-[#e0e0e0] px-2 py-1.5 rounded border border-[#555555] font-mono focus:outline-none focus:border-[#007acc]"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={Boolean(document.settings.dark)}
                    onChange={(e) => updateFormSettings({ dark: e.target.checked })}
                    className="accent-[#007acc]"
                  />
                  <span className="text-xs text-[#d4d4d4]">Modo Oscuro (ui.dark_mode)</span>
                </label>

                {/* Page Background Customizer */}
                <div className="p-2.5 rounded-lg bg-[#1e1e1e] border border-[#3e3e42] space-y-2.5 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#4fc1ff]">
                      Fondo de la Página (body)
                    </span>
                    {(document.settings.pageBackground || document.settings.pageBackgroundImage) && (
                      <button
                        type="button"
                        onClick={() =>
                          updateFormSettings({ pageBackground: '', pageBackgroundImage: '' })
                        }
                        className="text-[10px] text-[#999] hover:text-red-400"
                      >
                        Restablecer
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#9c9c9c] mb-1">
                      Color o Degradado CSS
                    </label>
                    <ColorPickerField
                      value={document.settings.pageBackground ?? ''}
                      onChange={(next) => updateFormSettings({ pageBackground: next })}
                      placeholder="#f8fafc o linear-gradient(...)"
                      fallbackHex="#f8fafc"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#9c9c9c] mb-1">
                      Imagen de fondo (URL opcional)
                    </label>
                    <input
                      type="text"
                      value={document.settings.pageBackgroundImage ?? ''}
                      onChange={(e) => updateFormSettings({ pageBackgroundImage: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-[#3c3c3c] text-[11px] font-mono text-white px-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] text-[#9c9c9c] mb-1">
                    Nombre Python (atributo <code className="text-[#4fc1ff]">self.</code>)
                  </label>
                  <input
                    type="text"
                    value={node.name}
                    onChange={(e) => updateNodeMeta(node.id, { name: e.target.value })}
                    className="w-full bg-[#3c3c3c] text-xs text-[#e0e0e0] px-2 py-1.5 rounded border border-[#555555] font-mono focus:outline-none focus:border-[#007acc]"
                  />
                </div>

                {(node.type === 'table' || node.type === 'aggrid') && (
                  <TableDataBindingBox node={node} />
                )}

                {['select', 'radio', 'toggle', 'tree', 'echart', 'highchart', 'plotly', 'uplot', 'leaflet'].includes(
                  node.type
                ) && <SelectAndChartDataBindingBox node={node} />}

                {node.type === 'button' && <ButtonActionBox node={node} />}

                {def && def.propSchemas.length > 0 ? (
                  def.propSchemas.map((schema) => (
                    <div key={schema.key}>
                      {schema.type !== 'boolean' && (
                        <label className="block text-[11px] text-[#9c9c9c] mb-1">
                          {schema.label}
                        </label>
                      )}
                      {renderPropField(schema)}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[#858585] italic">
                    Este contenedor no tiene propiedades adicionales. Usa la pestaña Estilos para ajustar Tailwind.
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'styles' && (
          <StylesEditor
            node={node}
            onChangeMeta={(patch) => updateNodeMeta(node.id, patch)}
          />
        )}

        {tab === 'bindings' && <BindingsEditor node={node} />}

        {tab === 'events' && (
          <div className="space-y-3">
            {!def || def.events.length === 0 ? (
              <div className="text-xs text-[#858585] italic">
                Este control no expone eventos configurables directos.
              </div>
            ) : (
              def.events.map((ev) => {
                const currentVal = node.events[ev.key] ?? '';
                const suggested = `on_${node.name}_${ev.defaultSuffix}`;
                return (
                  <div key={ev.key} className="space-y-1.5 p-2 rounded bg-[#2d2d30] border border-[#3e3e42]">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-[#e0e0e0]">{ev.label}</label>
                      <button
                        type="button"
                        onClick={() => void jumpToEventHandler(node.id, ev.key, currentVal || suggested)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white text-[10px]"
                        title="Generar/Ir al método en el archivo .py"
                      >
                        <Code2 className="w-3 h-3" />
                        <span>Ir al código</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={currentVal}
                      onChange={(e) => updateNodeEvent(node.id, ev.key, e.target.value)}
                      placeholder={suggested}
                      className="w-full bg-[#3c3c3c] text-xs text-[#e0e0e0] px-2 py-1 rounded border border-[#555555] font-mono focus:outline-none focus:border-[#007acc]"
                    />
                  </div>
                );
              })
            )}
            {!isRoot && <WidgetMethodsBox node={node} />}
          </div>
        )}
      </div>
    </div>
  );
};
