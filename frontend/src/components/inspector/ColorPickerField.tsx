import React, { useState } from 'react';
import { Palette, X } from 'lucide-react';

const NAMED_COLOR_TO_HEX: Record<string, string> = {
  primary: '#1976d2',
  secondary: '#26a69a',
  accent: '#9c27b0',
  positive: '#21ba45',
  negative: '#c10015',
  warning: '#f2c037',
  info: '#31ccec',
  dark: '#1d1d1d',
  white: '#ffffff',
  black: '#000000',
  'grey-3': '#eeeeee',
  'grey-8': '#616161',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  indigo: '#6366f1',
  amber: '#f59e0b',
  emerald: '#10b981',
  slate: '#64748b',
  gray: '#6b7280',
  grey: '#6b7280',
};

const TW_SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;

const TAILWIND_PALETTE: Array<{ name: string; hexes: string[] }> = [
  { name: 'slate',   hexes: ['#f8fafc','#f1f5f9','#e2e8f0','#cbd5e1','#94a3b8','#64748b','#475569','#334155','#1e293b','#0f172a','#020617'] },
  { name: 'gray',    hexes: ['#f9fafb','#f3f4f6','#e5e7eb','#d1d5db','#9ca3af','#6b7280','#4b5563','#374151','#1f2937','#111827','#030712'] },
  { name: 'zinc',    hexes: ['#fafafa','#f4f4f5','#e4e4e7','#d4d4d8','#a1a1aa','#71717a','#52525b','#3f3f46','#27272a','#18181b','#09090b'] },
  { name: 'neutral', hexes: ['#fafafa','#f5f5f5','#e5e5e5','#d4d4d4','#a3a3a3','#737373','#525252','#404040','#262626','#171717','#0a0a0a'] },
  { name: 'stone',   hexes: ['#fafaf9','#f5f5f4','#e7e5e4','#d6d3d1','#a8a29e','#78716c','#57534e','#44403c','#292524','#1c1917','#0c0a09'] },
  { name: 'red',     hexes: ['#fef2f2','#fee2e2','#fecaca','#fca5a5','#f87171','#ef4444','#dc2626','#b91c1c','#991b1b','#7f1d1d','#450a0a'] },
  { name: 'orange',  hexes: ['#fff7ed','#ffedd5','#fed7aa','#fdba74','#fb923c','#f97316','#ea580c','#c2410c','#9a3412','#7c2d12','#431407'] },
  { name: 'amber',   hexes: ['#fffbeb','#fef3c7','#fde68a','#fcd34d','#fbbf24','#f59e0b','#d97706','#b45309','#92400e','#78350f','#451a03'] },
  { name: 'yellow',  hexes: ['#fefce8','#fef9c3','#fef08a','#fde047','#facc15','#eab308','#ca8a04','#a16207','#854d0e','#713f12','#422006'] },
  { name: 'lime',    hexes: ['#f7fee7','#ecfccb','#d9f99d','#bef264','#a3e635','#84cc16','#65a30d','#4d7c0f','#3f6212','#365314','#1a2e05'] },
  { name: 'green',   hexes: ['#f0fdf4','#dcfce7','#bbf7d0','#86efac','#4ade80','#22c55e','#16a34a','#15803d','#166534','#14532d','#052e16'] },
  { name: 'emerald', hexes: ['#ecfdf5','#d1fae5','#a7f3d0','#6ee7b7','#34d399','#10b981','#059669','#047857','#065f46','#064e3b','#022c22'] },
  { name: 'teal',    hexes: ['#f0fdfa','#ccfbf1','#99f6e4','#5eead4','#2dd4bf','#14b8a6','#0d9488','#0f766e','#115e59','#134e4a','#042f2e'] },
  { name: 'cyan',    hexes: ['#ecfeff','#cffafe','#a5f3fc','#67e8f9','#22d3ee','#06b6d4','#0891b2','#0e7490','#155e75','#164e63','#083344'] },
  { name: 'sky',     hexes: ['#f0f9ff','#e0f2fe','#bae6fd','#7dd3fc','#38bdf8','#0ea5e9','#0284c7','#0369a1','#075985','#0c4a6e','#082f49'] },
  { name: 'blue',    hexes: ['#eff6ff','#dbeafe','#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8','#1e40af','#1e3a8a','#172554'] },
  { name: 'indigo',  hexes: ['#eef2ff','#e0e7ff','#c7d2fe','#a5b4fc','#818cf8','#6366f1','#4f46e5','#4338ca','#3730a3','#312e81','#1e1b4b'] },
  { name: 'violet',  hexes: ['#f5f3ff','#ede9fe','#ddd6fe','#c4b5fd','#a78bfa','#8b5cf6','#7c3aed','#6d28d9','#5b21b6','#4c1d95','#2e1065'] },
  { name: 'purple',  hexes: ['#faf5ff','#f3e8ff','#e9d5ff','#d8b4fe','#c084fc','#a855f7','#9333ea','#7e22ce','#6b21a8','#581c87','#3b0764'] },
  { name: 'fuchsia', hexes: ['#fdf4ff','#fae8ff','#f5d0fe','#f0abfc','#e879f9','#d946ef','#c026d3','#a21caf','#86198f','#701a75','#4a044e'] },
  { name: 'pink',    hexes: ['#fdf2f8','#fce7f3','#fbcfe8','#f9a8d4','#f472b6','#ec4899','#db2777','#be185d','#9d174d','#831843','#500724'] },
  { name: 'rose',    hexes: ['#fff1f2','#ffe4e6','#fecdd3','#fda4af','#fb7185','#f43f5e','#e11d48','#be123c','#9f1239','#881337','#4c0519'] },
];

export function toPickerHex(value: string, fallback = '#1976d2'): string {
  const v = (value || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  const lower = v.toLowerCase();
  if (NAMED_COLOR_TO_HEX[lower]) return NAMED_COLOR_TO_HEX[lower];
  return fallback;
}

interface ColorPickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fallbackHex?: string;
  allowClear?: boolean;
}

export const ColorPickerField: React.FC<ColorPickerFieldProps> = ({
  value,
  onChange,
  placeholder = '#1976d2',
  fallbackHex = '#1976d2',
  allowClear = true,
}) => {
  const [showTailwind, setShowTailwind] = useState(false);
  const [hoveredLabel, setHoveredLabel] = useState<string>('');
  const pickerHex = toPickerHex(value, fallbackHex);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <input
          type="color"
          value={pickerHex}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded bg-[#3c3c3c] border border-[#555555] cursor-pointer p-0.5 shrink-0"
          title="Selector de color libre"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-[#3c3c3c] text-[11px] font-mono text-[#e0e0e0] px-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
        />
        <button
          type="button"
          onClick={() => setShowTailwind((prev) => !prev)}
          title="Paleta de colores Tailwind CSS"
          className={`p-1.5 rounded border shrink-0 transition ${
            showTailwind
              ? 'bg-[#007acc] border-[#007acc] text-white'
              : 'bg-[#2d2d30] hover:bg-[#3e3e42] border-[#3e3e42] text-[#cccccc]'
          }`}
        >
          <Palette className="w-3 h-3" />
        </button>
        {allowClear && value && (
          <button
            type="button"
            onClick={() => onChange('')}
            title="Quitar color"
            className="p-1.5 rounded bg-[#2d2d30] hover:bg-red-600/30 border border-[#3e3e42] text-[#999] hover:text-red-400 shrink-0 transition"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {showTailwind && (
        <div className="p-2 rounded bg-[#1b1b1c] border border-[#3e3e42] space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#4fc1ff] font-medium">Paleta Tailwind CSS</span>
            <span className="font-mono text-[#a0a0a0] truncate max-w-[130px]">
              {hoveredLabel || '50 → 950'}
            </span>
          </div>

          {/* White / Black / Transparent quick row */}
          <div className="flex items-center gap-1 pb-1 border-b border-[#2d2d30]">
            {[
              { label: 'white (#ffffff)', hex: '#ffffff' },
              { label: 'black (#000000)', hex: '#000000' },
            ].map((item) => (
              <button
                key={item.hex}
                type="button"
                onClick={() => {
                  onChange(item.hex);
                  setShowTailwind(false);
                }}
                onMouseEnter={() => setHoveredLabel(item.label)}
                onMouseLeave={() => setHoveredLabel('')}
                title={item.label}
                className={`h-4 flex-1 rounded-sm border transition hover:scale-y-110 ${
                  value.toLowerCase() === item.hex
                    ? 'ring-1 ring-[#4fc1ff] border-white'
                    : 'border-[#555]'
                }`}
                style={{ backgroundColor: item.hex }}
              />
            ))}
          </div>

          {/* Full 22 Tailwind families × 11 shades */}
          <div className="max-h-52 overflow-y-auto space-y-0.5 pr-0.5">
            {TAILWIND_PALETTE.map((family) => (
              <div key={family.name} className="flex items-center gap-1">
                <span className="w-11 text-[9px] text-[#888] font-mono truncate shrink-0">
                  {family.name}
                </span>
                <div className="grid grid-cols-11 gap-[2px] flex-1">
                  {family.hexes.map((hex, idx) => {
                    const shade = TW_SHADES[idx];
                    const lbl = `${family.name}-${shade} (${hex})`;
                    const active = value.toLowerCase() === hex;
                    return (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => {
                          onChange(hex);
                          setShowTailwind(false);
                        }}
                        onMouseEnter={() => setHoveredLabel(lbl)}
                        onMouseLeave={() => setHoveredLabel('')}
                        title={lbl}
                        className={`h-3.5 rounded-[2px] transition hover:scale-125 hover:z-10 ${
                          active ? 'ring-1 ring-white scale-110 z-10' : ''
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
