import React, { useState } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';

const MATERIAL_ICONS = [
  // Acciones
  'add', 'add_circle', 'edit', 'delete', 'save', 'check', 'check_circle', 'close',
  'cancel', 'refresh', 'sync', 'search', 'filter_list', 'sort', 'download', 'upload',
  'print', 'share', 'content_copy', 'undo', 'redo', 'send', 'launch', 'open_in_new',
  'visibility', 'visibility_off', 'lock', 'lock_open', 'login', 'logout', 'settings',
  'tune', 'build', 'code', 'terminal', 'bug_report', 'bolt', 'auto_fix_high',
  // Navegación
  'home', 'menu', 'arrow_back', 'arrow_forward', 'arrow_upward', 'arrow_downward',
  'chevron_left', 'chevron_right', 'expand_more', 'expand_less', 'more_vert',
  'more_horiz', 'apps', 'dashboard', 'widgets', 'view_list', 'view_module', 'grid_view',
  // Usuarios y Comunicación
  'person', 'person_add', 'group', 'groups', 'account_circle', 'badge', 'admin_panel_settings',
  'email', 'mail', 'chat', 'forum', 'comment', 'notifications', 'notifications_active',
  'phone', 'call', 'support_agent', 'waving_hand', 'thumb_up', 'favorite', 'star',
  // Datos, Negocio y Archivos
  'folder', 'folder_open', 'description', 'article', 'insert_drive_file', 'attach_file',
  'cloud', 'cloud_upload', 'cloud_download', 'storage', 'dns', 'table_chart', 'bar_chart',
  'pie_chart', 'show_chart', 'trending_up', 'analytics', 'assessment', 'inventory_2',
  'shopping_cart', 'store', 'point_of_sale', 'payments', 'credit_card', 'receipt_long',
  'attach_money', 'work', 'business', 'category', 'label', 'sell', 'local_shipping',
  // Tiempo, Lugar y Estado
  'calendar_today', 'event', 'schedule', 'access_time', 'alarm', 'location_on', 'map',
  'public', 'language', 'info', 'help', 'warning', 'error', 'report', 'verified',
  'new_releases', 'lightbulb', 'dark_mode', 'light_mode', 'palette', 'image', 'photo_camera',
  'videocam', 'mic', 'volume_up', 'play_arrow', 'pause', 'stop', 'skip_next', 'skip_previous',
];

interface IconPickerFieldProps {
  value: string;
  onChange: (next: string) => void;
}

export const IconPickerField: React.FC<IconPickerFieldProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = q
    ? MATERIAL_ICONS.filter((name) => name.includes(q))
    : MATERIAL_ICONS;

  return (
    <div className="space-y-1.5">
      {/* Trigger / Current value */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex-1 flex items-center justify-between bg-[#3c3c3c] hover:bg-[#454545] text-xs text-[#e0e0e0] px-2 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
        >
          <div className="flex items-center gap-2 min-w-0">
            {value ? (
              <>
                <span className="material-icons text-[#4fc1ff]" style={{ fontSize: 18 }}>
                  {value}
                </span>
                <span className="font-mono text-[11px] truncate">{value}</span>
              </>
            ) : (
              <span className="text-[#888] text-[11px]">Seleccionar icono...</span>
            )}
          </div>
          {open ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#999] shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#999] shrink-0" />
          )}
        </button>

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1.5 rounded bg-[#3c3c3c] hover:bg-[#555] border border-[#555555] text-[#cccccc]"
            title="Quitar icono"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Expandable Visual Icon Picker */}
      {open && (
        <div className="p-2 rounded bg-[#1e1e1e] border border-[#007acc]/70 space-y-2 shadow-lg">
          <div className="relative">
            <Search className="w-3 h-3 text-[#888] absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar icono (ej: save, user, chart)..."
              className="w-full bg-[#3c3c3c] text-[11px] text-white pl-6 pr-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
            />
          </div>

          <div className="grid grid-cols-6 gap-1 max-h-44 overflow-y-auto pr-0.5">
            {filtered.map((iconName) => {
              const active = value === iconName;
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => {
                    onChange(iconName);
                    setOpen(false);
                  }}
                  title={iconName}
                  className={`flex items-center justify-center p-1.5 rounded border transition ${
                    active
                      ? 'bg-[#007acc] border-[#4fc1ff] text-white'
                      : 'bg-[#252526] border-[#333337] text-[#d4d4d4] hover:bg-[#333337] hover:border-[#007acc]'
                  }`}
                >
                  <span className="material-icons" style={{ fontSize: 18 }}>
                    {iconName}
                  </span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-[10px] text-[#888] text-center py-2 space-y-1">
              <div>No está en la lista rápida.</div>
              <button
                type="button"
                onClick={() => {
                  onChange(query.trim());
                  setOpen(false);
                }}
                className="px-2 py-0.5 rounded bg-[#007acc] text-white text-[10px]"
              >
                Usar &quot;{query.trim()}&quot; igualmente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
