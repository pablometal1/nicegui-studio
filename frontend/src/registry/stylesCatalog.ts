export interface TailwindOption {
  label: string;
  value: string;
  swatch?: string;
}

export interface TailwindControlGroup {
  id: string;
  label: string;
  section: 'Layout' | 'Dimensiones' | 'Espaciado' | 'Tipografía' | 'Fondo y Bordes' | 'Efectos';
  kind: 'select' | 'swatches' | 'toggles';
  options: TailwindOption[];
}

export const TAILWIND_SECTIONS: Array<TailwindControlGroup['section']> = [
  'Layout',
  'Dimensiones',
  'Espaciado',
  'Tipografía',
  'Fondo y Bordes',
  'Efectos',
];

export const TAILWIND_GROUPS: TailwindControlGroup[] = [
  // --- LAYOUT ---
  {
    id: 'display',
    label: 'Display',
    section: 'Layout',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'flex', value: 'flex' },
      { label: 'inline-flex', value: 'inline-flex' },
      { label: 'grid', value: 'grid' },
      { label: 'block', value: 'block' },
      { label: 'inline-block', value: 'inline-block' },
      { label: 'hidden', value: 'hidden' },
    ],
  },
  {
    id: 'flexDir',
    label: 'Dirección Flex',
    section: 'Layout',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'Row (horizontal)', value: 'flex-row' },
      { label: 'Column (vertical)', value: 'flex-col' },
      { label: 'Row Reverse', value: 'flex-row-reverse' },
      { label: 'Column Reverse', value: 'flex-col-reverse' },
    ],
  },
  {
    id: 'justify',
    label: 'Justify Content',
    section: 'Layout',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'Start', value: 'justify-start' },
      { label: 'Center', value: 'justify-center' },
      { label: 'End', value: 'justify-end' },
      { label: 'Between', value: 'justify-between' },
      { label: 'Around', value: 'justify-around' },
      { label: 'Evenly', value: 'justify-evenly' },
    ],
  },
  {
    id: 'items',
    label: 'Align Items',
    section: 'Layout',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'Start', value: 'items-start' },
      { label: 'Center', value: 'items-center' },
      { label: 'End', value: 'items-end' },
      { label: 'Stretch', value: 'items-stretch' },
      { label: 'Baseline', value: 'items-baseline' },
    ],
  },
  {
    id: 'gap',
    label: 'Gap (Separación)',
    section: 'Layout',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: '0', value: 'gap-0' },
      { label: '1 (4px)', value: 'gap-1' },
      { label: '2 (8px)', value: 'gap-2' },
      { label: '3 (12px)', value: 'gap-3' },
      { label: '4 (16px)', value: 'gap-4' },
      { label: '6 (24px)', value: 'gap-6' },
      { label: '8 (32px)', value: 'gap-8' },
      { label: '12 (48px)', value: 'gap-12' },
    ],
  },
  {
    id: 'flexMisc',
    label: 'Ajuste Flex',
    section: 'Layout',
    kind: 'toggles',
    options: [
      { label: 'flex-wrap', value: 'flex-wrap' },
      { label: 'flex-1', value: 'flex-1' },
      { label: 'grow', value: 'grow' },
      { label: 'shrink-0', value: 'shrink-0' },
    ],
  },

  // --- DIMENSIONES ---
  {
    id: 'width',
    label: 'Ancho (Width)',
    section: 'Dimensiones',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'w-auto', value: 'w-auto' },
      { label: 'w-full (100%)', value: 'w-full' },
      { label: 'w-fit', value: 'w-fit' },
      { label: 'w-1/2 (50%)', value: 'w-1/2' },
      { label: 'w-1/3 (33%)', value: 'w-1/3' },
      { label: 'w-2/3 (66%)', value: 'w-2/3' },
      { label: 'w-1/4 (25%)', value: 'w-1/4' },
      { label: 'w-3/4 (75%)', value: 'w-3/4' },
      { label: 'w-64 (16rem)', value: 'w-64' },
      { label: 'w-96 (24rem)', value: 'w-96' },
    ],
  },
  {
    id: 'maxWidth',
    label: 'Ancho Máximo',
    section: 'Dimensiones',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'max-w-xs', value: 'max-w-xs' },
      { label: 'max-w-sm', value: 'max-w-sm' },
      { label: 'max-w-md', value: 'max-w-md' },
      { label: 'max-w-lg', value: 'max-w-lg' },
      { label: 'max-w-xl', value: 'max-w-xl' },
      { label: 'max-w-2xl', value: 'max-w-2xl' },
      { label: 'max-w-4xl', value: 'max-w-4xl' },
      { label: 'max-w-full', value: 'max-w-full' },
    ],
  },
  {
    id: 'height',
    label: 'Alto (Height)',
    section: 'Dimensiones',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'h-auto', value: 'h-auto' },
      { label: 'h-full', value: 'h-full' },
      { label: 'h-screen', value: 'h-screen' },
      { label: 'h-fit', value: 'h-fit' },
      { label: 'h-10', value: 'h-10' },
      { label: 'h-12', value: 'h-12' },
      { label: 'h-24', value: 'h-24' },
      { label: 'h-48', value: 'h-48' },
      { label: 'h-64', value: 'h-64' },
    ],
  },

  // --- ESPACIADO ---
  {
    id: 'padding',
    label: 'Padding (p-*)',
    section: 'Espaciado',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'p-0', value: 'p-0' },
      { label: 'p-1 (4px)', value: 'p-1' },
      { label: 'p-2 (8px)', value: 'p-2' },
      { label: 'p-3 (12px)', value: 'p-3' },
      { label: 'p-4 (16px)', value: 'p-4' },
      { label: 'p-5 (20px)', value: 'p-5' },
      { label: 'p-6 (24px)', value: 'p-6' },
      { label: 'p-8 (32px)', value: 'p-8' },
      { label: 'p-10 (40px)', value: 'p-10' },
    ],
  },
  {
    id: 'paddingX',
    label: 'Padding Horizontal (px-*)',
    section: 'Espaciado',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'px-0', value: 'px-0' },
      { label: 'px-2', value: 'px-2' },
      { label: 'px-4', value: 'px-4' },
      { label: 'px-6', value: 'px-6' },
      { label: 'px-8', value: 'px-8' },
    ],
  },
  {
    id: 'paddingY',
    label: 'Padding Vertical (py-*)',
    section: 'Espaciado',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'py-0', value: 'py-0' },
      { label: 'py-2', value: 'py-2' },
      { label: 'py-4', value: 'py-4' },
      { label: 'py-6', value: 'py-6' },
      { label: 'py-8', value: 'py-8' },
    ],
  },
  {
    id: 'margin',
    label: 'Margin (m-*)',
    section: 'Espaciado',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'm-0', value: 'm-0' },
      { label: 'm-2', value: 'm-2' },
      { label: 'm-4', value: 'm-4' },
      { label: 'm-6', value: 'm-6' },
      { label: 'mx-auto (Centrar)', value: 'mx-auto' },
    ],
  },
  {
    id: 'marginTop',
    label: 'Margin Top (mt-*)',
    section: 'Espaciado',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'mt-0', value: 'mt-0' },
      { label: 'mt-2', value: 'mt-2' },
      { label: 'mt-4', value: 'mt-4' },
      { label: 'mt-6', value: 'mt-6' },
      { label: 'mt-8', value: 'mt-8' },
    ],
  },
  {
    id: 'marginBottom',
    label: 'Margin Bottom (mb-*)',
    section: 'Espaciado',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'mb-0', value: 'mb-0' },
      { label: 'mb-2', value: 'mb-2' },
      { label: 'mb-4', value: 'mb-4' },
      { label: 'mb-6', value: 'mb-6' },
      { label: 'mb-8', value: 'mb-8' },
    ],
  },

  // --- TIPOGRAFÍA ---
  {
    id: 'fontSize',
    label: 'Tamaño de texto',
    section: 'Tipografía',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'text-xs (12px)', value: 'text-xs' },
      { label: 'text-sm (14px)', value: 'text-sm' },
      { label: 'text-base (16px)', value: 'text-base' },
      { label: 'text-lg (18px)', value: 'text-lg' },
      { label: 'text-xl (20px)', value: 'text-xl' },
      { label: 'text-2xl (24px)', value: 'text-2xl' },
      { label: 'text-3xl (30px)', value: 'text-3xl' },
      { label: 'text-4xl (36px)', value: 'text-4xl' },
    ],
  },
  {
    id: 'fontWeight',
    label: 'Peso (Weight)',
    section: 'Tipografía',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'font-light', value: 'font-light' },
      { label: 'font-normal', value: 'font-normal' },
      { label: 'font-medium', value: 'font-medium' },
      { label: 'font-semibold', value: 'font-semibold' },
      { label: 'font-bold', value: 'font-bold' },
      { label: 'font-extrabold', value: 'font-extrabold' },
    ],
  },
  {
    id: 'textAlign',
    label: 'Alineación',
    section: 'Tipografía',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'Izquierda', value: 'text-left' },
      { label: 'Centro', value: 'text-center' },
      { label: 'Derecha', value: 'text-right' },
      { label: 'Justificado', value: 'text-justify' },
    ],
  },
  {
    id: 'textColor',
    label: 'Color de texto',
    section: 'Tipografía',
    kind: 'swatches',
    options: [
      { label: 'Sin color', value: '', swatch: 'transparent' },
      { label: 'Slate 900', value: 'text-slate-900', swatch: '#0f172a' },
      { label: 'Slate 600', value: 'text-slate-600', swatch: '#475569' },
      { label: 'Slate 400', value: 'text-slate-400', swatch: '#94a3b8' },
      { label: 'Blanco', value: 'text-white', swatch: '#ffffff' },
      { label: 'Azul', value: 'text-blue-600', swatch: '#2563eb' },
      { label: 'Esmeralda', value: 'text-emerald-600', swatch: '#059669' },
      { label: 'Rojo', value: 'text-red-600', swatch: '#dc2626' },
      { label: 'Ámbar', value: 'text-amber-600', swatch: '#d97706' },
      { label: 'Púrpura', value: 'text-purple-600', swatch: '#9333ea' },
      { label: 'Cyan', value: 'text-cyan-600', swatch: '#0891b2' },
    ],
  },
  {
    id: 'textStyle',
    label: 'Decoración',
    section: 'Tipografía',
    kind: 'toggles',
    options: [
      { label: 'italic', value: 'italic' },
      { label: 'underline', value: 'underline' },
      { label: 'uppercase', value: 'uppercase' },
      { label: 'truncate', value: 'truncate' },
      { label: 'font-mono', value: 'font-mono' },
    ],
  },

  // --- FONDO Y BORDES ---
  {
    id: 'bgColor',
    label: 'Color de fondo',
    section: 'Fondo y Bordes',
    kind: 'swatches',
    options: [
      { label: 'Ninguno', value: '', swatch: 'transparent' },
      { label: 'Blanco', value: 'bg-white', swatch: '#ffffff' },
      { label: 'Slate 50', value: 'bg-slate-50', swatch: '#f8fafc' },
      { label: 'Slate 100', value: 'bg-slate-100', swatch: '#f1f5f9' },
      { label: 'Slate 800', value: 'bg-slate-800', swatch: '#1e293b' },
      { label: 'Slate 900', value: 'bg-slate-900', swatch: '#0f172a' },
      { label: 'Azul suave', value: 'bg-blue-50', swatch: '#eff6ff' },
      { label: 'Azul', value: 'bg-blue-600', swatch: '#2563eb' },
      { label: 'Verde suave', value: 'bg-emerald-50', swatch: '#ecfdf5' },
      { label: 'Verde', value: 'bg-emerald-600', swatch: '#059669' },
      { label: 'Rojo suave', value: 'bg-red-50', swatch: '#fef2f2' },
      { label: 'Ámbar suave', value: 'bg-amber-50', swatch: '#fffbeb' },
    ],
  },
  {
    id: 'borderWidth',
    label: 'Grosor de borde',
    section: 'Fondo y Bordes',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'Sin borde (border-0)', value: 'border-0' },
      { label: '1px (border)', value: 'border' },
      { label: '2px (border-2)', value: 'border-2' },
      { label: '4px (border-4)', value: 'border-4' },
    ],
  },
  {
    id: 'borderColor',
    label: 'Color de borde',
    section: 'Fondo y Bordes',
    kind: 'swatches',
    options: [
      { label: 'Ninguno', value: '', swatch: 'transparent' },
      { label: 'Slate 200', value: 'border-slate-200', swatch: '#e2e8f0' },
      { label: 'Slate 300', value: 'border-slate-300', swatch: '#cbd5e1' },
      { label: 'Slate 700', value: 'border-slate-700', swatch: '#334155' },
      { label: 'Azul', value: 'border-blue-500', swatch: '#3b82f6' },
      { label: 'Esmeralda', value: 'border-emerald-500', swatch: '#10b981' },
      { label: 'Rojo', value: 'border-red-500', swatch: '#ef4444' },
      { label: 'Ámbar', value: 'border-amber-500', swatch: '#f59e0b' },
    ],
  },
  {
    id: 'radius',
    label: 'Redondeado (Radius)',
    section: 'Fondo y Bordes',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'rounded-none', value: 'rounded-none' },
      { label: 'rounded-sm', value: 'rounded-sm' },
      { label: 'rounded', value: 'rounded' },
      { label: 'rounded-md', value: 'rounded-md' },
      { label: 'rounded-lg', value: 'rounded-lg' },
      { label: 'rounded-xl', value: 'rounded-xl' },
      { label: 'rounded-2xl', value: 'rounded-2xl' },
      { label: 'rounded-full', value: 'rounded-full' },
    ],
  },

  // --- EFECTOS ---
  {
    id: 'shadow',
    label: 'Sombra (Shadow)',
    section: 'Efectos',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'shadow-none', value: 'shadow-none' },
      { label: 'shadow-sm', value: 'shadow-sm' },
      { label: 'shadow', value: 'shadow' },
      { label: 'shadow-md', value: 'shadow-md' },
      { label: 'shadow-lg', value: 'shadow-lg' },
      { label: 'shadow-xl', value: 'shadow-xl' },
      { label: 'shadow-2xl', value: 'shadow-2xl' },
    ],
  },
  {
    id: 'opacity',
    label: 'Opacidad',
    section: 'Efectos',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: '100%', value: 'opacity-100' },
      { label: '90%', value: 'opacity-90' },
      { label: '75%', value: 'opacity-75' },
      { label: '50%', value: 'opacity-50' },
      { label: '25%', value: 'opacity-25' },
    ],
  },
  {
    id: 'overflow',
    label: 'Overflow',
    section: 'Efectos',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'overflow-auto', value: 'overflow-auto' },
      { label: 'overflow-hidden', value: 'overflow-hidden' },
      { label: 'overflow-x-auto', value: 'overflow-x-auto' },
      { label: 'overflow-y-auto', value: 'overflow-y-auto' },
    ],
  },
  {
    id: 'cursor',
    label: 'Cursor',
    section: 'Efectos',
    kind: 'select',
    options: [
      { label: '(Por defecto)', value: '' },
      { label: 'cursor-pointer', value: 'cursor-pointer' },
      { label: 'cursor-default', value: 'cursor-default' },
      { label: 'cursor-not-allowed', value: 'cursor-not-allowed' },
    ],
  },
];

// ============================================================================
// QUASAR PROPS CATALOG (.props("outlined dense color=primary ..."))
// ============================================================================

export interface QuasarPropDef {
  key: string;
  label: string;
  section: string;
  kind: 'boolean' | 'select' | 'string' | 'color';
  options?: string[];
  placeholder?: string;
  widgets?: string[]; // undefined = available for all widgets
}

const QUASAR_SIZES = ['', 'xs', 'sm', 'md', 'lg', 'xl'];

const INPUT_WIDGETS = [
  'input',
  'textarea',
  'number',
  'select',
  'input_chips',
  'color_input',
  'date_input',
  'time_input',
];

const BUTTON_WIDGETS = ['button', 'dropdown_button', 'fab', 'button_group', 'toggle'];

export const QUASAR_PROPS_CATALOG: QuasarPropDef[] = [
  // --- APARIENCIA Y VARIANTES ---
  { key: 'dense', label: 'Dense (compacto)', section: 'Apariencia', kind: 'boolean' },
  { key: 'dark', label: 'Dark mode', section: 'Apariencia', kind: 'boolean' },
  { key: 'disable', label: 'Deshabilitado', section: 'Apariencia', kind: 'boolean' },
  { key: 'flat', label: 'Flat (sin elevación)', section: 'Apariencia', kind: 'boolean', widgets: [...BUTTON_WIDGETS, 'card', 'expansion', 'table', 'upload', 'editor', 'date', 'time', 'pagination'] },
  { key: 'bordered', label: 'Bordered (con borde)', section: 'Apariencia', kind: 'boolean', widgets: ['card', 'expansion', 'table', 'upload', 'editor', 'header', 'footer', 'left_drawer', 'right_drawer', 'carousel'] },
  { key: 'outline', label: 'Outline (solo borde)', section: 'Apariencia', kind: 'boolean', widgets: [...BUTTON_WIDGETS, 'badge', 'chip', 'pagination'] },
  { key: 'unelevated', label: 'Unelevated (sin sombra)', section: 'Apariencia', kind: 'boolean', widgets: [...BUTTON_WIDGETS, 'pagination'] },
  { key: 'push', label: 'Push (efecto 3D)', section: 'Apariencia', kind: 'boolean', widgets: [...BUTTON_WIDGETS, 'pagination'] },
  { key: 'glossy', label: 'Glossy (brillo)', section: 'Apariencia', kind: 'boolean', widgets: [...BUTTON_WIDGETS, 'pagination'] },
  { key: 'rounded', label: 'Rounded (píldora)', section: 'Apariencia', kind: 'boolean', widgets: [...BUTTON_WIDGETS, ...INPUT_WIDGETS, 'badge', 'linear_progress', 'pagination'] },
  { key: 'round', label: 'Round (circular)', section: 'Apariencia', kind: 'boolean', widgets: ['button', 'pagination'] },
  { key: 'square', label: 'Square (esquinas rectas)', section: 'Apariencia', kind: 'boolean', widgets: [...BUTTON_WIDGETS, ...INPUT_WIDGETS, 'card', 'chip', 'avatar', 'table', 'upload', 'editor'] },
  { key: 'elevated', label: 'Elevated (sombra)', section: 'Apariencia', kind: 'boolean', widgets: ['header', 'footer', 'left_drawer', 'right_drawer'] },
  { key: 'ripple', label: 'Efecto Ripple', section: 'Apariencia', kind: 'boolean', widgets: [...BUTTON_WIDGETS, 'chip', 'card'] },
  { key: 'no-caps', label: 'No Caps (sin mayúsculas)', section: 'Apariencia', kind: 'boolean', widgets: [...BUTTON_WIDGETS] },
  { key: 'no-wrap', label: 'No Wrap (una línea)', section: 'Apariencia', kind: 'boolean', widgets: [...BUTTON_WIDGETS] },
  { key: 'fab', label: 'FAB (botón flotante)', section: 'Apariencia', kind: 'boolean', widgets: ['button'] },
  { key: 'fab-mini', label: 'FAB Mini', section: 'Apariencia', kind: 'boolean', widgets: ['button'] },
  { key: 'stack', label: 'Stack (icono arriba)', section: 'Apariencia', kind: 'boolean', widgets: ['button', 'dropdown_button'] },
  { key: 'stretch', label: 'Stretch (alto completo)', section: 'Apariencia', kind: 'boolean', widgets: ['button', 'dropdown_button', 'button_group'] },
  { key: 'spread', label: 'Spread (ancho completo)', section: 'Apariencia', kind: 'boolean', widgets: ['button_group', 'toggle'] },
  { key: 'loading', label: 'Loading spinner', section: 'Apariencia', kind: 'boolean', widgets: ['button', 'dropdown_button', 'input', 'select', 'table'] },
  { key: 'floating', label: 'Floating (esquina)', section: 'Apariencia', kind: 'boolean', widgets: ['badge'] },
  { key: 'transparent', label: 'Transparente', section: 'Apariencia', kind: 'boolean', widgets: ['badge'] },
  { key: 'multi-line', label: 'Multi-línea', section: 'Apariencia', kind: 'boolean', widgets: ['badge'] },
  { key: 'clickable', label: 'Clickable', section: 'Apariencia', kind: 'boolean', widgets: ['chip'] },
  { key: 'removable', label: 'Removable (botón X)', section: 'Apariencia', kind: 'boolean', widgets: ['chip'] },
  { key: 'selected', label: 'Seleccionado', section: 'Apariencia', kind: 'boolean', widgets: ['chip'] },

  // --- COLORES Y TAMAÑO ---
  { key: 'color', label: 'Color principal', section: 'Colores y Tamaño', kind: 'color' },
  { key: 'text-color', label: 'Color de texto', section: 'Colores y Tamaño', kind: 'color' },
  { key: 'bg-color', label: 'Color de fondo', section: 'Colores y Tamaño', kind: 'color', widgets: [...INPUT_WIDGETS, 'chat_message'] },
  { key: 'label-color', label: 'Color de etiqueta', section: 'Colores y Tamaño', kind: 'color', widgets: [...INPUT_WIDGETS, 'slider', 'range'] },
  { key: 'label-text-color', label: 'Color texto etiqueta', section: 'Colores y Tamaño', kind: 'color', widgets: ['slider', 'range'] },
  { key: 'track-color', label: 'Color de pista (track)', section: 'Colores y Tamaño', kind: 'color', widgets: ['slider', 'range', 'knob', 'linear_progress', 'circular_progress'] },
  { key: 'inner-track-color', label: 'Color pista interna', section: 'Colores y Tamaño', kind: 'color', widgets: ['slider', 'range'] },
  { key: 'selection-color', label: 'Color de selección', section: 'Colores y Tamaño', kind: 'color', widgets: ['slider', 'range'] },
  { key: 'thumb-color', label: 'Color del tirador (thumb)', section: 'Colores y Tamaño', kind: 'color', widgets: ['slider', 'range'] },
  { key: 'center-color', label: 'Color central', section: 'Colores y Tamaño', kind: 'color', widgets: ['knob', 'circular_progress'] },
  { key: 'toggle-color', label: 'Color activo (toggle)', section: 'Colores y Tamaño', kind: 'color', widgets: ['toggle'] },
  { key: 'toggle-text-color', label: 'Color texto activo', section: 'Colores y Tamaño', kind: 'color', widgets: ['toggle'] },
  { key: 'active-color', label: 'Color activo', section: 'Colores y Tamaño', kind: 'color', widgets: ['pagination'] },
  { key: 'active-text-color', label: 'Color texto activo', section: 'Colores y Tamaño', kind: 'color', widgets: ['pagination'] },
  { key: 'control-color', label: 'Color de controles', section: 'Colores y Tamaño', kind: 'color', widgets: ['carousel', 'tree'] },
  { key: 'selected-color', label: 'Color seleccionado', section: 'Colores y Tamaño', kind: 'color', widgets: ['tree'] },
  { key: 'toolbar-color', label: 'Color barra herramientas', section: 'Colores y Tamaño', kind: 'color', widgets: ['editor'] },
  { key: 'toolbar-bg', label: 'Fondo barra herramientas', section: 'Colores y Tamaño', kind: 'color', widgets: ['editor'] },
  { key: 'toolbar-toggle-color', label: 'Color botón activo editor', section: 'Colores y Tamaño', kind: 'color', widgets: ['editor'] },
  { key: 'size', label: 'Tamaño (size)', section: 'Colores y Tamaño', kind: 'select', options: QUASAR_SIZES, widgets: [...BUTTON_WIDGETS, 'checkbox', 'switch', 'radio', 'icon', 'avatar', 'chip', 'rating', 'knob', 'linear_progress', 'circular_progress', 'spinner', 'pagination', 'separator'] },
  { key: 'font-size', label: 'Tamaño de fuente (CSS)', section: 'Colores y Tamaño', kind: 'string', placeholder: 'ej: 18px, 0.8em', widgets: ['avatar', 'knob', 'circular_progress'] },
  { key: 'padding', label: 'Padding Quasar', section: 'Colores y Tamaño', kind: 'string', placeholder: 'ej: xs lg, 8px 16px', widgets: [...BUTTON_WIDGETS, 'fab'] },
  { key: 'align', label: 'Alineación', section: 'Colores y Tamaño', kind: 'select', options: ['', 'left', 'center', 'right', 'between', 'around', 'evenly', 'top', 'middle', 'bottom'], widgets: ['button', 'dropdown_button', 'badge'] },

  // --- CAMPOS DE ENTRADA (INPUT / SELECT / FIELD) ---
  { key: 'outlined', label: 'Outlined (borde completo)', section: 'Campos y Entradas', kind: 'boolean', widgets: INPUT_WIDGETS },
  { key: 'filled', label: 'Filled (relleno)', section: 'Campos y Entradas', kind: 'boolean', widgets: INPUT_WIDGETS },
  { key: 'standout', label: 'Standout (resaltado)', section: 'Campos y Entradas', kind: 'boolean', widgets: INPUT_WIDGETS },
  { key: 'borderless', label: 'Borderless (sin borde)', section: 'Campos y Entradas', kind: 'boolean', widgets: INPUT_WIDGETS },
  { key: 'clearable', label: 'Clearable (botón X)', section: 'Campos y Entradas', kind: 'boolean', widgets: [...INPUT_WIDGETS, 'toggle'] },
  { key: 'readonly', label: 'Solo lectura (readonly)', section: 'Campos y Entradas', kind: 'boolean', widgets: [...INPUT_WIDGETS, 'slider', 'range', 'knob', 'rating', 'date', 'time', 'editor'] },
  { key: 'counter', label: 'Contador de caracteres', section: 'Campos y Entradas', kind: 'boolean', widgets: ['input', 'textarea', 'select', 'input_chips'] },
  { key: 'autogrow', label: 'Autogrow (crece solo)', section: 'Campos y Entradas', kind: 'boolean', widgets: ['input', 'textarea'] },
  { key: 'stack-label', label: 'Stack Label (etiqueta fija arriba)', section: 'Campos y Entradas', kind: 'boolean', widgets: INPUT_WIDGETS },
  { key: 'bottom-slots', label: 'Bottom Slots', section: 'Campos y Entradas', kind: 'boolean', widgets: INPUT_WIDGETS },
  { key: 'hide-bottom-space', label: 'Ocultar espacio inferior', section: 'Campos y Entradas', kind: 'boolean', widgets: INPUT_WIDGETS },
  { key: 'hide-hint', label: 'Ocultar hint al enfocar', section: 'Campos y Entradas', kind: 'boolean', widgets: INPUT_WIDGETS },
  { key: 'no-error-icon', label: 'Sin icono de error', section: 'Campos y Entradas', kind: 'boolean', widgets: INPUT_WIDGETS },
  { key: 'item-aligned', label: 'Item Aligned', section: 'Campos y Entradas', kind: 'boolean', widgets: INPUT_WIDGETS },
  { key: 'use-chips', label: 'Usar Chips en selección', section: 'Campos y Entradas', kind: 'boolean', widgets: ['select', 'input_chips'] },
  { key: 'use-input', label: 'Permitir búsqueda escrita', section: 'Campos y Entradas', kind: 'boolean', widgets: ['select'] },
  { key: 'hide-dropdown-icon', label: 'Ocultar flecha desplegable', section: 'Campos y Entradas', kind: 'boolean', widgets: ['select', 'dropdown_button'] },
  { key: 'options-dense', label: 'Opciones compactas', section: 'Campos y Entradas', kind: 'boolean', widgets: ['select'] },
  { key: 'options-dark', label: 'Opciones en modo oscuro', section: 'Campos y Entradas', kind: 'boolean', widgets: ['select'] },
  { key: 'behavior', label: 'Comportamiento menú', section: 'Campos y Entradas', kind: 'select', options: ['', 'default', 'menu', 'dialog'], widgets: ['select'] },
  { key: 'hint', label: 'Texto de ayuda (hint)', section: 'Campos y Entradas', kind: 'string', placeholder: 'ej: Máximo 50 caracteres', widgets: INPUT_WIDGETS },
  { key: 'prefix', label: 'Prefijo', section: 'Campos y Entradas', kind: 'string', placeholder: 'ej: $', widgets: ['input', 'number', 'select'] },
  { key: 'suffix', label: 'Sufijo', section: 'Campos y Entradas', kind: 'string', placeholder: 'ej: USD, kg, %', widgets: ['input', 'number', 'select'] },
  { key: 'mask', label: 'Máscara de entrada', section: 'Campos y Entradas', kind: 'string', placeholder: 'ej: ####-#### o ##/##/####', widgets: ['input', 'date_input', 'time_input'] },
  { key: 'fill-mask', label: 'Rellenar máscara', section: 'Campos y Entradas', kind: 'boolean', widgets: ['input'] },
  { key: 'unmasked-value', label: 'Valor sin máscara', section: 'Campos y Entradas', kind: 'boolean', widgets: ['input'] },
  { key: 'maxlength', label: 'Longitud máxima', section: 'Campos y Entradas', kind: 'string', placeholder: 'ej: 100', widgets: ['input', 'textarea'] },
  { key: 'debounce', label: 'Debounce (ms)', section: 'Campos y Entradas', kind: 'string', placeholder: 'ej: 300', widgets: ['input', 'textarea', 'number'] },
  { key: 'clear-icon', label: 'Icono limpiar', section: 'Campos y Entradas', kind: 'string', placeholder: 'ej: close', widgets: INPUT_WIDGETS },
  { key: 'input-class', label: 'Clases del input interno', section: 'Campos y Entradas', kind: 'string', placeholder: 'ej: text-right font-bold', widgets: INPUT_WIDGETS },
  { key: 'input-style', label: 'CSS del input interno', section: 'Campos y Entradas', kind: 'string', placeholder: 'ej: letter-spacing: 1px', widgets: INPUT_WIDGETS },
  { key: 'popup-content-class', label: 'Clases del menú popup', section: 'Campos y Entradas', kind: 'string', placeholder: 'ej: bg-slate-900 text-white', widgets: ['select'] },

  // --- CHECKBOX / SWITCH / RADIO / RATING ---
  { key: 'left-label', label: 'Etiqueta a la izquierda', section: 'Selección y Sliders', kind: 'boolean', widgets: ['checkbox', 'switch', 'radio'] },
  { key: 'keep-color', label: 'Mantener color desmarcado', section: 'Selección y Sliders', kind: 'boolean', widgets: ['checkbox', 'switch', 'radio'] },
  { key: 'inline', label: 'Opciones en línea (horizontal)', section: 'Selección y Sliders', kind: 'boolean', widgets: ['radio'] },
  { key: 'checked-icon', label: 'Icono marcado', section: 'Selección y Sliders', kind: 'string', placeholder: 'ej: check, visibility', widgets: ['checkbox', 'switch'] },
  { key: 'unchecked-icon', label: 'Icono desmarcado', section: 'Selección y Sliders', kind: 'string', placeholder: 'ej: clear, visibility_off', widgets: ['checkbox', 'switch'] },
  { key: 'icon-selected', label: 'Icono estrella activa', section: 'Selección y Sliders', kind: 'string', placeholder: 'ej: star', widgets: ['rating'] },
  { key: 'icon-half', label: 'Icono media estrella', section: 'Selección y Sliders', kind: 'string', placeholder: 'ej: star_half', widgets: ['rating'] },
  { key: 'no-dimming', label: 'Sin atenuación', section: 'Selección y Sliders', kind: 'boolean', widgets: ['rating'] },

  // --- SLIDER / RANGE / KNOB ---
  { key: 'label', label: 'Mostrar etiqueta de valor', section: 'Selección y Sliders', kind: 'boolean', widgets: ['slider', 'range'] },
  { key: 'label-always', label: 'Etiqueta siempre visible', section: 'Selección y Sliders', kind: 'boolean', widgets: ['slider', 'range'] },
  { key: 'switch-label-side', label: 'Etiqueta al lado opuesto', section: 'Selección y Sliders', kind: 'boolean', widgets: ['slider', 'range'] },
  { key: 'markers', label: 'Marcadores de paso', section: 'Selección y Sliders', kind: 'boolean', widgets: ['slider', 'range'] },
  { key: 'marker-labels', label: 'Etiquetas en marcadores', section: 'Selección y Sliders', kind: 'boolean', widgets: ['slider', 'range'] },
  { key: 'snap', label: 'Ajustar al paso (snap)', section: 'Selección y Sliders', kind: 'boolean', widgets: ['slider', 'range'] },
  { key: 'vertical', label: 'Orientación vertical', section: 'Selección y Sliders', kind: 'boolean', widgets: ['slider', 'range', 'separator'] },
  { key: 'reverse', label: 'Dirección invertida', section: 'Selección y Sliders', kind: 'boolean', widgets: ['slider', 'range', 'linear_progress', 'circular_progress'] },
  { key: 'drag-range', label: 'Arrastrar rango completo', section: 'Selección y Sliders', kind: 'boolean', widgets: ['range'] },
  { key: 'track-size', label: 'Grosor de pista (CSS)', section: 'Selección y Sliders', kind: 'string', placeholder: 'ej: 6px', widgets: ['slider', 'range'] },
  { key: 'thumb-size', label: 'Tamaño del tirador (CSS)', section: 'Selección y Sliders', kind: 'string', placeholder: 'ej: 20px', widgets: ['slider', 'range'] },
  { key: 'show-value', label: 'Mostrar valor en centro', section: 'Selección y Sliders', kind: 'boolean', widgets: ['knob', 'circular_progress'] },
  { key: 'thickness', label: 'Grosor del anillo (0-1)', section: 'Selección y Sliders', kind: 'string', placeholder: 'ej: 0.22', widgets: ['knob', 'circular_progress'] },
  { key: 'angle', label: 'Ángulo inicial (grados)', section: 'Selección y Sliders', kind: 'string', placeholder: 'ej: 0, 90, 180', widgets: ['knob', 'circular_progress'] },

  // --- LAYOUT, CONTENEDORES, EXPANSIÓN, DIÁLOGOS Y SEPARADORES ---
  { key: 'spaced', label: 'Spaced (con margen)', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['separator'] },
  { key: 'inset', label: 'Inset (con sangría)', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['separator'] },
  { key: 'expand-separator', label: 'Separador al expandir', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['expansion'] },
  { key: 'switch-toggle-side', label: 'Flecha a la izquierda', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['expansion'] },
  { key: 'popup', label: 'Estilo Popup', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['expansion'] },
  { key: 'dense-toggle', label: 'Toggle compacto', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['expansion'] },
  { key: 'default-opened', label: 'Abierto por defecto', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['expansion'] },
  { key: 'group', label: 'Grupo acordeón', section: 'Layout y Contenedores', kind: 'string', placeholder: 'ej: acordeon1', widgets: ['expansion'] },
  { key: 'expand-icon', label: 'Icono expandir', section: 'Layout y Contenedores', kind: 'string', placeholder: 'ej: keyboard_arrow_down', widgets: ['expansion'] },
  { key: 'header-class', label: 'Clases del encabezado', section: 'Layout y Contenedores', kind: 'string', placeholder: 'ej: bg-primary text-white', widgets: ['expansion'] },
  { key: 'reveal', label: 'Reveal al hacer scroll', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['header', 'footer'] },
  { key: 'overlay', label: 'Overlay (superpuesto)', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['left_drawer', 'right_drawer'] },
  { key: 'mini', label: 'Modo Mini (solo iconos)', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['left_drawer', 'right_drawer'] },
  { key: 'mini-to-overlay', label: 'Mini a Overlay en hover', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['left_drawer', 'right_drawer'] },
  { key: 'persistent', label: 'Persistente (no cierra fuera)', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['dialog', 'fab'] },
  { key: 'maximized', label: 'Maximizado (pantalla completa)', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['dialog'] },
  { key: 'full-width', label: 'Ancho completo', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['dialog'] },
  { key: 'full-height', label: 'Alto completo', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['dialog'] },
  { key: 'seamless', label: 'Sin fondo oscuro (seamless)', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['dialog'] },
  { key: 'position', label: 'Posición del diálogo', section: 'Layout y Contenedores', kind: 'select', options: ['', 'standard', 'top', 'right', 'bottom', 'left'], widgets: ['dialog'] },
  { key: 'visible', label: 'Scrollbars siempre visibles', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['scroll_area'] },
  { key: 'split', label: 'Botón dividido (split)', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['dropdown_button'] },
  { key: 'auto-close', label: 'Auto-cerrar al elegir', section: 'Layout y Contenedores', kind: 'boolean', widgets: ['dropdown_button'] },
  { key: 'icon-right', label: 'Icono a la derecha', section: 'Layout y Contenedores', kind: 'string', placeholder: 'ej: arrow_forward', widgets: ['button', 'chip'] },
  { key: 'dropdown-icon', label: 'Icono desplegable', section: 'Layout y Contenedores', kind: 'string', placeholder: 'ej: expand_more', widgets: ['dropdown_button', 'select'] },
  { key: 'direction', label: 'Dirección de despliegue', section: 'Layout y Contenedores', kind: 'select', options: ['', 'up', 'down', 'left', 'right'], widgets: ['fab'] },

  // --- TABLAS Y ÁRBOLES ---
  { key: 'grid', label: 'Vista Tarjetas (Grid)', section: 'Tablas y Datos', kind: 'boolean', widgets: ['table'] },
  { key: 'grid-header', label: 'Encabezado en modo Grid', section: 'Tablas y Datos', kind: 'boolean', widgets: ['table'] },
  { key: 'hide-header', label: 'Ocultar encabezado', section: 'Tablas y Datos', kind: 'boolean', widgets: ['table'] },
  { key: 'hide-bottom', label: 'Ocultar barra inferior', section: 'Tablas y Datos', kind: 'boolean', widgets: ['table'] },
  { key: 'hide-pagination', label: 'Ocultar paginación', section: 'Tablas y Datos', kind: 'boolean', widgets: ['table'] },
  { key: 'hide-selected-banner', label: 'Ocultar banner selección', section: 'Tablas y Datos', kind: 'boolean', widgets: ['table'] },
  { key: 'wrap-cells', label: 'Ajustar texto en celdas', section: 'Tablas y Datos', kind: 'boolean', widgets: ['table'] },
  { key: 'virtual-scroll', label: 'Scroll virtual (muchas filas)', section: 'Tablas y Datos', kind: 'boolean', widgets: ['table'] },
  { key: 'separator', label: 'Separador de celdas', section: 'Tablas y Datos', kind: 'select', options: ['', 'horizontal', 'vertical', 'cell', 'none'], widgets: ['table'] },
  { key: 'table-header-class', label: 'Clases del header de tabla', section: 'Tablas y Datos', kind: 'string', placeholder: 'ej: bg-slate-800 text-white', widgets: ['table'] },
  { key: 'card-class', label: 'Clases de la card de tabla', section: 'Tablas y Datos', kind: 'string', placeholder: 'ej: bg-slate-900 text-white', widgets: ['table'] },
  { key: 'accordion', label: 'Modo Acordeón', section: 'Tablas y Datos', kind: 'boolean', widgets: ['tree'] },
  { key: 'default-expand-all', label: 'Expandir todo por defecto', section: 'Tablas y Datos', kind: 'boolean', widgets: ['tree'] },
  { key: 'no-connectors', label: 'Sin líneas conectoras', section: 'Tablas y Datos', kind: 'boolean', widgets: ['tree'] },
  { key: 'tick-strategy', label: 'Estrategia checkboxes', section: 'Tablas y Datos', kind: 'select', options: ['', 'none', 'strict', 'leaf', 'leaf-filtered'], widgets: ['tree'] },

  // --- PROGRESO, MULTIMEDIA Y EXTRAS ---
  { key: 'stripe', label: 'Rayas animadas (stripe)', section: 'Progreso y Extras', kind: 'boolean', widgets: ['linear_progress'] },
  { key: 'indeterminate', label: 'Indeterminado (infinito)', section: 'Progreso y Extras', kind: 'boolean', widgets: ['linear_progress', 'circular_progress'] },
  { key: 'query', label: 'Animación Query', section: 'Progreso y Extras', kind: 'boolean', widgets: ['linear_progress'] },
  { key: 'instant-feedback', label: 'Sin transición suave', section: 'Progreso y Extras', kind: 'boolean', widgets: ['linear_progress', 'circular_progress'] },
  { key: 'fit', label: 'Ajuste de imagen (object-fit)', section: 'Progreso y Extras', kind: 'select', options: ['', 'cover', 'contain', 'fill', 'none', 'scale-down'], widgets: ['image'] },
  { key: 'ratio', label: 'Relación de aspecto', section: 'Progreso y Extras', kind: 'string', placeholder: 'ej: 16/9, 4/3, 1', widgets: ['image'] },
  { key: 'no-spinner', label: 'Sin spinner de carga', section: 'Progreso y Extras', kind: 'boolean', widgets: ['image'] },
  { key: 'no-transition', label: 'Sin transición al cargar', section: 'Progreso y Extras', kind: 'boolean', widgets: ['image'] },
  { key: 'animated', label: 'Animado', section: 'Progreso y Extras', kind: 'boolean', widgets: ['carousel'] },
  { key: 'arrows', label: 'Mostrar flechas', section: 'Progreso y Extras', kind: 'boolean', widgets: ['carousel'] },
  { key: 'navigation', label: 'Puntos de navegación', section: 'Progreso y Extras', kind: 'boolean', widgets: ['carousel'] },
  { key: 'infinite', label: 'Bucle infinito', section: 'Progreso y Extras', kind: 'boolean', widgets: ['carousel'] },
  { key: 'autoplay', label: 'Reproducción automática', section: 'Progreso y Extras', kind: 'boolean', widgets: ['carousel'] },
  { key: 'swipeable', label: 'Deslizable (swipe)', section: 'Progreso y Extras', kind: 'boolean', widgets: ['carousel'] },
  { key: 'thumbnails', label: 'Miniaturas (thumbnails)', section: 'Progreso y Extras', kind: 'boolean', widgets: ['carousel'] },
  { key: 'direction-links', label: 'Flechas anterior/siguiente', section: 'Progreso y Extras', kind: 'boolean', widgets: ['pagination'] },
  { key: 'boundary-links', label: 'Botones primera/última', section: 'Progreso y Extras', kind: 'boolean', widgets: ['pagination'] },
  { key: 'boundary-numbers', label: 'Números extremos', section: 'Progreso y Extras', kind: 'boolean', widgets: ['pagination'] },
  { key: 'ellipses', label: 'Puntos suspensivos (...)', section: 'Progreso y Extras', kind: 'boolean', widgets: ['pagination'] },
  { key: 'layout', label: 'Layout Timeline', section: 'Progreso y Extras', kind: 'select', options: ['', 'dense', 'comfortable', 'loose'], widgets: ['timeline'] },
  { key: 'side', label: 'Lado Timeline', section: 'Progreso y Extras', kind: 'select', options: ['', 'left', 'right'], widgets: ['timeline'] },
  { key: 'landscape', label: 'Modo Horizontal (landscape)', section: 'Progreso y Extras', kind: 'boolean', widgets: ['date', 'time'] },
  { key: 'minimal', label: 'Minimalista (sin header)', section: 'Progreso y Extras', kind: 'boolean', widgets: ['date', 'time'] },
  { key: 'today-btn', label: 'Botón Hoy', section: 'Progreso y Extras', kind: 'boolean', widgets: ['date'] },
  { key: 'format24h', label: 'Formato 24 horas', section: 'Progreso y Extras', kind: 'boolean', widgets: ['time'] },
  { key: 'with-seconds', label: 'Incluir segundos', section: 'Progreso y Extras', kind: 'boolean', widgets: ['time'] },
  { key: 'now-btn', label: 'Botón Ahora', section: 'Progreso y Extras', kind: 'boolean', widgets: ['time'] },
  { key: 'auto-upload', label: 'Subida automática', section: 'Progreso y Extras', kind: 'boolean', widgets: ['upload'] },
  { key: 'hide-upload-btn', label: 'Ocultar botón subir', section: 'Progreso y Extras', kind: 'boolean', widgets: ['upload'] },
  { key: 'batch', label: 'Subir en lote (batch)', section: 'Progreso y Extras', kind: 'boolean', widgets: ['upload'] },
  { key: 'toolbar-rounded', label: 'Toolbar redondeada', section: 'Progreso y Extras', kind: 'boolean', widgets: ['editor'] },
  { key: 'content-class', label: 'Clases del contenido', section: 'Progreso y Extras', kind: 'string', placeholder: 'ej: bg-slate-50', widgets: ['editor'] },
];

export const QUASAR_SECTIONS = [
  'Apariencia',
  'Colores y Tamaño',
  'Campos y Entradas',
  'Selección y Sliders',
  'Layout y Contenedores',
  'Tablas y Datos',
  'Progreso y Extras',
] as const;

export function getQuasarPropsForWidget(widgetType: string, includeAll = false): QuasarPropDef[] {
  if (includeAll) return QUASAR_PROPS_CATALOG;
  return QUASAR_PROPS_CATALOG.filter(
    (p) => !p.widgets || p.widgets.includes(widgetType)
  );
}

// ============================================================================
// PARSERS & SERIALIZERS
// ============================================================================

export function parseTailwindClasses(classesStr: string): string[] {
  return classesStr.trim().split(/\s+/).filter(Boolean);
}

export function setTailwindGroupValue(
  classesStr: string,
  group: TailwindControlGroup,
  newValue: string
): string {
  const tokens = parseTailwindClasses(classesStr);
  const groupValues = new Set(group.options.map((o) => o.value).filter(Boolean));
  const filtered = tokens.filter((t) => !groupValues.has(t));
  if (newValue) {
    filtered.push(newValue);
  }
  return filtered.join(' ');
}

export function getTailwindGroupValue(
  classesStr: string,
  group: TailwindControlGroup
): string {
  const tokens = new Set(parseTailwindClasses(classesStr));
  for (const opt of group.options) {
    if (opt.value && tokens.has(opt.value)) {
      return opt.value;
    }
  }
  return '';
}

export function toggleTailwindToken(classesStr: string, token: string): string {
  const tokens = parseTailwindClasses(classesStr);
  if (tokens.includes(token)) {
    return tokens.filter((t) => t !== token).join(' ');
  }
  return [...tokens, token].join(' ');
}

/** Parse a Quasar props string like `outlined dense color=primary hint="Hello world"` into a map. */
export function parseQuasarProps(propsStr: string): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  const regex = /([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(propsStr)) !== null) {
    const key = match[1];
    const val = match[2] ?? match[3] ?? match[4];
    result[key] = val !== undefined ? val : true;
  }
  return result;
}

/** Serialize a Quasar props map back into a NiceGUI `.props(...)` string. */
export function serializeQuasarProps(map: Record<string, string | boolean>): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(map)) {
    if (val === false || val === '' || val === undefined) continue;
    if (val === true) {
      parts.push(key);
    } else if (/\s/.test(val)) {
      parts.push(`${key}="${val.replace(/"/g, '\\"')}"`);
    } else {
      parts.push(`${key}=${val}`);
    }
  }
  return parts.join(' ');
}

/** Parse an inline CSS string like `min-height: 120px; background: #fff;` into entries. */
export function parseInlineCss(styleStr: string): Array<{ prop: string; value: string }> {
  return styleStr
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((decl) => {
      const idx = decl.indexOf(':');
      if (idx === -1) return { prop: decl.trim(), value: '' };
      return {
        prop: decl.slice(0, idx).trim(),
        value: decl.slice(idx + 1).trim(),
      };
    });
}

export function serializeInlineCss(entries: Array<{ prop: string; value: string }>): string {
  return entries
    .filter((e) => e.prop.trim() && e.value.trim())
    .map((e) => `${e.prop.trim()}: ${e.value.trim()}`)
    .join('; ');
}

/** Convert inline CSS string to React CSSProperties for live canvas preview. */
export function inlineCssToReactStyle(styleStr: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { prop, value } of parseInlineCss(styleStr)) {
    if (!prop || !value) continue;
    const camel = prop.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
    out[camel] = value;
  }
  return out;
}

export const COMMON_CSS_PROPS = [
  'background',
  'background-color',
  'color',
  'border',
  'border-radius',
  'box-shadow',
  'width',
  'min-width',
  'max-width',
  'height',
  'min-height',
  'padding',
  'margin',
  'font-size',
  'font-family',
  'letter-spacing',
  'line-height',
  'opacity',
  'z-index',
  'transition',
  'transform',
];
