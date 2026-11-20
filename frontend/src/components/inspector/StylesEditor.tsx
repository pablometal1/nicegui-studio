import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Search } from 'lucide-react';
import type { WidgetNode } from '../../types/ide';
import { ColorPickerField, toPickerHex } from './ColorPickerField';
import { IconPickerField } from './IconPickerField';
import {
  COMMON_CSS_PROPS,
  QUASAR_SECTIONS,
  TAILWIND_GROUPS,
  TAILWIND_SECTIONS,
  getQuasarPropsForWidget,
  getTailwindGroupValue,
  parseInlineCss,
  parseQuasarProps,
  parseTailwindClasses,
  serializeInlineCss,
  serializeQuasarProps,
  setTailwindGroupValue,
  toggleTailwindToken,
  type TailwindControlGroup,
} from '../../registry/stylesCatalog';

interface StylesEditorProps {
  node: WidgetNode;
  onChangeMeta: (patch: Partial<Pick<WidgetNode, 'classes' | 'quasarProps' | 'style'>>) => void;
}

export const StylesEditor: React.FC<StylesEditorProps> = ({ node, onChangeMeta }) => {
  const [subTab, setSubTab] = useState<'tailwind' | 'quasar' | 'css'>('tailwind');
  const [filter, setFilter] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Layout: true,
    Dimensiones: true,
    Espaciado: true,
    Tipografía: false,
    'Fondo y Bordes': false,
    Efectos: false,
  });
  const [showAllQuasar, setShowAllQuasar] = useState(false);
  const [openQuasarSections, setOpenQuasarSections] = useState<Record<string, boolean>>({
    Apariencia: true,
    'Colores y Tamaño': true,
    'Campos y Entradas': true,
    'Selección y Sliders': true,
    'Layout y Contenedores': true,
    'Tablas y Datos': true,
    'Progreso y Extras': true,
  });
  const [newCssProp, setNewCssProp] = useState('');
  const [newCssVal, setNewCssVal] = useState('');

  const toggleSection = (sec: string) =>
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));

  const toggleQuasarSection = (sec: string) =>
    setOpenQuasarSections((prev) => ({ ...prev, [sec]: !prev[sec] }));

  // --- Tailwind handlers ---
  const activeTokens = new Set(parseTailwindClasses(node.classes));
  const query = filter.trim().toLowerCase();

  // --- Inline CSS handlers ---
  const cssEntries = parseInlineCss(node.style || '');

  const isCssColorProp = (prop: string) => {
    const p = prop.trim().toLowerCase();
    return (
      p === 'color' ||
      p === 'background' ||
      p === 'background-color' ||
      p === 'border-color' ||
      p === 'outline-color' ||
      p === 'fill' ||
      p === 'stroke' ||
      p === 'accent-color' ||
      p === 'caret-color' ||
      p.endsWith('-color')
    );
  };

  const getCssValue = (propName: string): string => {
    const found = cssEntries.find((e) => e.prop.toLowerCase() === propName.toLowerCase());
    return found ? found.value : '';
  };

  const setCssColorAndClearGroup = (
    propName: string,
    colorVal: string,
    group: TailwindControlGroup
  ) => {
    const cleanedClasses = setTailwindGroupValue(node.classes, group, '');
    const filtered = cssEntries.filter((e) => e.prop.toLowerCase() !== propName.toLowerCase());
    const nextCss = colorVal.trim()
      ? [...filtered, { prop: propName, value: colorVal.trim() }]
      : filtered;
    onChangeMeta({
      classes: cleanedClasses,
      style: serializeInlineCss(nextCss),
    });
  };

  const renderTailwindGroup = (group: TailwindControlGroup) => {
    if (group.kind === 'select') {
      const val = getTailwindGroupValue(node.classes, group);
      return (
        <div key={group.id} className="space-y-1">
          <label className="block text-[10px] text-[#a0a0a0]">{group.label}</label>
          <select
            value={val}
            onChange={(e) =>
              onChangeMeta({ classes: setTailwindGroupValue(node.classes, group, e.target.value) })
            }
            className="w-full bg-[#3c3c3c] text-[11px] text-[#e0e0e0] px-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
          >
            {group.options.map((opt) => (
              <option key={opt.value || '_none'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (group.kind === 'swatches') {
      const cssProp =
        group.id === 'textColor'
          ? 'color'
          : group.id === 'borderColor'
          ? 'border-color'
          : 'background-color';
      const cssVal = getCssValue(cssProp);
      const twVal = getTailwindGroupValue(node.classes, group);
      const matchedOpt = group.options.find((o) => o.value && o.value === twVal);
      const currentColor =
        cssVal || (matchedOpt?.swatch && matchedOpt.swatch !== 'transparent' ? matchedOpt.swatch : '');

      return (
        <div key={group.id} className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-[#a0a0a0]">{group.label}</label>
            {currentColor && (
              <span className="text-[10px] font-mono text-[#4fc1ff]">{currentColor}</span>
            )}
          </div>
          <ColorPickerField
            value={currentColor}
            onChange={(next) => setCssColorAndClearGroup(cssProp, next, group)}
            placeholder={cssProp === 'background-color' ? '#ffffff o gradient' : '#0f172a'}
            fallbackHex={cssProp === 'background-color' ? '#ffffff' : '#0f172a'}
          />
        </div>
      );
    }

    // toggles
    return (
      <div key={group.id} className="space-y-1">
        <label className="block text-[10px] text-[#a0a0a0]">{group.label}</label>
        <div className="flex flex-wrap gap-1">
          {group.options.map((opt) => {
            const active = activeTokens.has(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChangeMeta({ classes: toggleTailwindToken(node.classes, opt.value) })
                }
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition ${
                  active
                    ? 'bg-[#007acc] border-[#007acc] text-white'
                    : 'bg-[#2d2d30] border-[#3e3e42] text-[#bbbbbb] hover:border-[#007acc]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // --- Quasar handlers ---
  const quasarMap = parseQuasarProps(node.quasarProps || '');
  const quasarDefs = getQuasarPropsForWidget(node.type, showAllQuasar).filter(
    (p) =>
      !query ||
      p.key.toLowerCase().includes(query) ||
      p.label.toLowerCase().includes(query) ||
      p.section.toLowerCase().includes(query)
  );

  const updateQuasarKey = (key: string, val: string | boolean) => {
    const next = { ...quasarMap };
    if (val === false || val === '') {
      delete next[key];
    } else {
      next[key] = val;
    }
    onChangeMeta({ quasarProps: serializeQuasarProps(next) });
  };

  const updateCssEntries = (next: Array<{ prop: string; value: string }>) => {
    onChangeMeta({ style: serializeInlineCss(next) });
  };

  const handleAddCss = () => {
    if (!newCssProp.trim() || !newCssVal.trim()) return;
    const filtered = cssEntries.filter((e) => e.prop.toLowerCase() !== newCssProp.trim().toLowerCase());
    updateCssEntries([...filtered, { prop: newCssProp.trim(), value: newCssVal.trim() }]);
    setNewCssProp('');
    setNewCssVal('');
  };

  return (
    <div className="space-y-3">
      {/* Sub-tabs: Tailwind | Quasar | CSS */}
      <div className="flex bg-[#1e1e1e] p-0.5 rounded border border-[#3e3e42] text-[11px]">
        <button
          type="button"
          onClick={() => setSubTab('tailwind')}
          className={`flex-1 py-1 rounded transition ${
            subTab === 'tailwind' ? 'bg-[#007acc] text-white font-medium' : 'text-[#9c9c9c] hover:text-white'
          }`}
        >
          Tailwind
        </button>
        <button
          type="button"
          onClick={() => setSubTab('quasar')}
          className={`flex-1 py-1 rounded transition ${
            subTab === 'quasar' ? 'bg-[#007acc] text-white font-medium' : 'text-[#9c9c9c] hover:text-white'
          }`}
        >
          Quasar
        </button>
        <button
          type="button"
          onClick={() => setSubTab('css')}
          className={`flex-1 py-1 rounded transition ${
            subTab === 'css' ? 'bg-[#007acc] text-white font-medium' : 'text-[#9c9c9c] hover:text-white'
          }`}
        >
          CSS
        </button>
      </div>

      {/* Filter input for Tailwind & Quasar */}
      {subTab !== 'css' && (
        <div className="relative">
          <Search className="w-3 h-3 text-[#888] absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={subTab === 'tailwind' ? 'Buscar clase Tailwind...' : 'Buscar prop Quasar...'}
            className="w-full bg-[#3c3c3c] text-[11px] text-[#e0e0e0] pl-6 pr-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
          />
        </div>
      )}

      {/* TAILWIND TAB */}
      {subTab === 'tailwind' && (
        <div className="space-y-2">
          <div>
            <label className="block text-[10px] text-[#9c9c9c] mb-1">
              Clases crudas (<code className="text-[#4fc1ff]">.classes()</code>)
            </label>
            <textarea
              rows={2}
              value={node.classes}
              onChange={(e) => onChangeMeta({ classes: e.target.value })}
              placeholder="w-full p-4 gap-3..."
              className="w-full bg-[#3c3c3c] text-[11px] text-[#e0e0e0] px-2 py-1 rounded border border-[#555555] font-mono focus:outline-none focus:border-[#007acc]"
            />
          </div>

          {TAILWIND_SECTIONS.map((section) => {
            const groups = TAILWIND_GROUPS.filter(
              (g) =>
                g.section === section &&
                (!query ||
                  g.label.toLowerCase().includes(query) ||
                  g.options.some(
                    (o) =>
                      o.label.toLowerCase().includes(query) ||
                      o.value.toLowerCase().includes(query)
                  ))
            );
            if (groups.length === 0) return null;
            const isOpen = query ? true : Boolean(openSections[section]);

            return (
              <div key={section} className="border border-[#3e3e42] rounded overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection(section)}
                  className="w-full flex items-center justify-between px-2 py-1.5 bg-[#2d2d30] hover:bg-[#333337] text-[11px] font-medium text-[#e0e0e0]"
                >
                  <span>{section}</span>
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#999]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#999]" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-2 space-y-2.5 bg-[#252526]">
                    {groups.map((g) => renderTailwindGroup(g))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* QUASAR TAB */}
      {subTab === 'quasar' && (
        <div className="space-y-2.5">
          <div>
            <label className="block text-[10px] text-[#9c9c9c] mb-1">
              Props Quasar crudas (<code className="text-[#4fc1ff]">.props()</code>)
            </label>
            <input
              type="text"
              value={node.quasarProps}
              onChange={(e) => onChangeMeta({ quasarProps: e.target.value })}
              placeholder="outlined dense clearable color=primary"
              className="w-full bg-[#3c3c3c] text-[11px] text-[#e0e0e0] px-2 py-1.5 rounded border border-[#555555] font-mono focus:outline-none focus:border-[#007acc]"
            />
          </div>

          <div className="flex items-center justify-between gap-2 text-[10px] text-[#858585]">
            <span>
              {showAllQuasar ? (
                <>Todos los props Quasar ({quasarDefs.length})</>
              ) : (
                <>
                  Props para <code className="text-[#4fc1ff]">ui.{node.type}</code> ({quasarDefs.length})
                </>
              )}
            </span>
            <label className="flex items-center gap-1 cursor-pointer text-[#cccccc] hover:text-white shrink-0">
              <input
                type="checkbox"
                checked={showAllQuasar}
                onChange={(e) => setShowAllQuasar(e.target.checked)}
                className="accent-[#007acc]"
              />
              <span>Ver todos</span>
            </label>
          </div>

          {QUASAR_SECTIONS.map((section) => {
            const items = quasarDefs.filter((p) => p.section === section);
            if (items.length === 0) return null;
            const boolItems = items.filter((p) => p.kind === 'boolean');
            const otherItems = items.filter((p) => p.kind !== 'boolean');
            const activeCount = items.filter((p) => quasarMap[p.key] !== undefined).length;
            const isOpen = query ? true : Boolean(openQuasarSections[section]);

            return (
              <div key={section} className="border border-[#3e3e42] rounded overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleQuasarSection(section)}
                  className="w-full flex items-center justify-between px-2 py-1.5 bg-[#2d2d30] hover:bg-[#333337] text-[11px] font-medium text-[#e0e0e0]"
                >
                  <span className="flex items-center gap-1.5">
                    <span>{section}</span>
                    {activeCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#007acc] text-[9px] text-white font-mono">
                        {activeCount}
                      </span>
                    )}
                  </span>
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#999]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#999]" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-2 space-y-2.5 bg-[#252526]">
                    {boolItems.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5">
                        {boolItems.map((p) => {
                          const checked = Boolean(quasarMap[p.key]);
                          return (
                            <label
                              key={p.key}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] cursor-pointer transition ${
                                checked
                                  ? 'bg-[#094771] border-[#007acc] text-white'
                                  : 'bg-[#2d2d30] border-[#3e3e42] text-[#cccccc] hover:border-[#555]'
                              }`}
                              title={p.key}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => updateQuasarKey(p.key, e.target.checked)}
                                className="accent-[#007acc]"
                              />
                              <span className="truncate">{p.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {otherItems.length > 0 && (
                      <div className="space-y-2">
                        {otherItems.map((p) => {
                          const val =
                            typeof quasarMap[p.key] === 'string' ? String(quasarMap[p.key]) : '';
                          return (
                            <div key={p.key} className="space-y-1">
                              <label className="block text-[10px] text-[#a0a0a0]">
                                {p.label} <span className="font-mono text-[#6a6a6a]">({p.key})</span>
                              </label>
                              {p.kind === 'color' || p.key.toLowerCase().includes('color') ? (
                                <ColorPickerField
                                  value={val}
                                  onChange={(next) => updateQuasarKey(p.key, next)}
                                  placeholder="#1976d2"
                                />
                              ) : p.key.toLowerCase().includes('icon') ? (
                                <IconPickerField
                                  value={val}
                                  onChange={(next) => updateQuasarKey(p.key, next)}
                                />
                              ) : p.kind === 'select' ? (
                                <select
                                  value={val}
                                  onChange={(e) => updateQuasarKey(p.key, e.target.value)}
                                  className="w-full bg-[#3c3c3c] text-[11px] text-[#e0e0e0] px-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
                                >
                                  {(p.options ?? []).map((opt) => (
                                    <option key={opt || '_none'} value={opt}>
                                      {opt || '(Por defecto)'}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => updateQuasarKey(p.key, e.target.value)}
                                  placeholder={p.placeholder}
                                  className="w-full bg-[#3c3c3c] text-[11px] text-[#e0e0e0] px-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* INLINE CSS TAB */}
      {subTab === 'css' && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] text-[#9c9c9c] mb-1">
              CSS Inline crudo (<code className="text-[#4fc1ff]">.style()</code>)
            </label>
            <textarea
              rows={2}
              value={node.style}
              onChange={(e) => onChangeMeta({ style: e.target.value })}
              placeholder="border-radius: 12px; min-height: 80px;"
              className="w-full bg-[#3c3c3c] text-[11px] text-[#e0e0e0] px-2 py-1 rounded border border-[#555555] font-mono focus:outline-none focus:border-[#007acc]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] text-[#9c9c9c] uppercase tracking-wider">Reglas activas</div>
            {cssEntries.length === 0 ? (
              <div className="text-[11px] text-[#6a6a6a] italic">Sin reglas CSS inline.</div>
            ) : (
              cssEntries.map((entry, idx) => (
                <div key={`${entry.prop}_${idx}`} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={entry.prop}
                    onChange={(e) => {
                      const next = [...cssEntries];
                      next[idx] = { ...entry, prop: e.target.value };
                      updateCssEntries(next);
                    }}
                    className="w-5/12 bg-[#3c3c3c] text-[11px] font-mono text-[#9cdcfe] px-1.5 py-1 rounded border border-[#555555]"
                  />
                  {isCssColorProp(entry.prop) && (
                    <input
                      type="color"
                      value={toPickerHex(entry.value)}
                      onChange={(e) => {
                        const next = [...cssEntries];
                        next[idx] = { ...entry, value: e.target.value };
                        updateCssEntries(next);
                      }}
                      className="w-6 h-6 rounded bg-[#3c3c3c] border border-[#555555] cursor-pointer p-0.5 shrink-0"
                      title="Elegir color"
                    />
                  )}
                  <input
                    type="text"
                    value={entry.value}
                    onChange={(e) => {
                      const next = [...cssEntries];
                      next[idx] = { ...entry, value: e.target.value };
                      updateCssEntries(next);
                    }}
                    className="flex-1 min-w-0 bg-[#3c3c3c] text-[11px] font-mono text-[#ce9178] px-1.5 py-1 rounded border border-[#555555]"
                  />
                  <button
                    type="button"
                    onClick={() => updateCssEntries(cssEntries.filter((_, i) => i !== idx))}
                    className="p-1 rounded hover:bg-red-600/30 text-[#999] hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add new CSS rule */}
          <div className="p-2 rounded bg-[#2d2d30] border border-[#3e3e42] space-y-1.5">
            <div className="text-[10px] text-[#bbbbbb]">Agregar propiedad CSS</div>
            <div className="flex gap-1">
              <input
                list="common-css-props"
                type="text"
                value={newCssProp}
                onChange={(e) => setNewCssProp(e.target.value)}
                placeholder="propiedad (ej: min-height)"
                className="w-1/2 bg-[#3c3c3c] text-[11px] font-mono text-[#e0e0e0] px-1.5 py-1 rounded border border-[#555555]"
              />
              <datalist id="common-css-props">
                {COMMON_CSS_PROPS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              {isCssColorProp(newCssProp) && (
                <input
                  type="color"
                  value={toPickerHex(newCssVal)}
                  onChange={(e) => setNewCssVal(e.target.value)}
                  className="w-7 h-7 rounded bg-[#3c3c3c] border border-[#555555] cursor-pointer p-0.5 shrink-0"
                  title="Elegir color"
                />
              )}
              <input
                type="text"
                value={newCssVal}
                onChange={(e) => setNewCssVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCss();
                  }
                }}
                placeholder="valor (ej: 120px)"
                className="w-1/2 bg-[#3c3c3c] text-[11px] font-mono text-[#e0e0e0] px-1.5 py-1 rounded border border-[#555555]"
              />
            </div>
            <button
              type="button"
              onClick={handleAddCss}
              className="w-full flex items-center justify-center gap-1 py-1 text-[11px] rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white"
            >
              <Plus className="w-3 h-3" />
              <span>Agregar regla CSS</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
