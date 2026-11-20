import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Table2,
  AppWindow,
  BarChart3,
  Lock,
  PanelLeft,
  FilePlus2,
  X,
  Database,
} from 'lucide-react';
import { api } from '../../services/api';
import { useIdeStore } from '../../store/ideStore';
import type { TableSchema } from '../../types/ide';

interface FormTemplateMeta {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultRoute: string;
}

const DEFAULT_TEMPLATES: FormTemplateMeta[] = [
  {
    id: 'standard',
    name: 'Formulario Común',
    description: 'Tarjeta de captura con campos de texto, select, switch y botones Guardar/Limpiar.',
    icon: 'ClipboardList',
    defaultRoute: '/formulario',
  },
  {
    id: 'crud_table',
    name: 'Tabla de Datos + CRUD',
    description: 'AG Grid o Table con Nuevo, Editar, Eliminar y modal. Conectable a una tabla de tu BD.',
    icon: 'Table2',
    defaultRoute: '/datos',
  },
  {
    id: 'modal',
    name: 'Ventana Emergente (Modal)',
    description: 'Dialog modal reutilizable con botón disparador, campos y acciones Aceptar/Cancelar.',
    icon: 'AppWindow',
    defaultRoute: '/modal',
  },
  {
    id: 'dashboard',
    name: 'Dashboard KPIs + Gráfico',
    description: 'Panel gerencial con tarjetas de métricas y gráfico EChart.',
    icon: 'BarChart3',
    defaultRoute: '/dashboard',
  },
  {
    id: 'login',
    name: 'Login / Acceso',
    description: 'Pantalla de inicio de sesión centrada con usuario, contraseña y validación.',
    icon: 'Lock',
    defaultRoute: '/login',
  },
  {
    id: 'app_shell',
    name: 'Layout Header + Drawer',
    description: 'Estructura completa con barra superior, menú lateral desplegable y footer.',
    icon: 'PanelLeft',
    defaultRoute: '/panel',
  },
  {
    id: 'blank',
    name: 'Formulario en Blanco',
    description: 'Lienzo vacío listo para arrastrar controles desde cero.',
    icon: 'FilePlus2',
    defaultRoute: '/nuevo',
  },
];

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  ClipboardList,
  Table2,
  AppWindow,
  BarChart3,
  Lock,
  PanelLeft,
  FilePlus2,
};

interface NewFormModalProps {
  onClose: () => void;
}

export const NewFormModal: React.FC<NewFormModalProps> = ({ onClose }) => {
  const { currentProject, createForm } = useIdeStore();
  const [templates, setTemplates] = useState<FormTemplateMeta[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
  const [formName, setFormName] = useState('MiFormulario');
  const [route, setRoute] = useState('/formulario');
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [gridType, setGridType] = useState<'aggrid' | 'table'>('aggrid');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void api
      .listFormTemplates()
      .then((list) => {
        if (list.length > 0) setTemplates(list);
      })
      .catch(() => {});

    if (currentProject) {
      void api
        .getDatabaseState(currentProject.name)
        .then((st) => {
          if (st.connected) setTables(st.tables);
        })
        .catch(() => {});
    }
  }, [currentProject]);

  const handleSelectTemplate = (tpl: FormTemplateMeta) => {
    setSelectedTemplate(tpl.id);
    setRoute(tpl.defaultRoute);
    const suggestedNames: Record<string, string> = {
      standard: 'RegistroForm',
      crud_table: 'DatosCrud',
      modal: 'VentanaModal',
      dashboard: 'DashboardForm',
      login: 'LoginForm',
      app_shell: 'PanelPrincipal',
      blank: 'NuevoForm',
    };
    setFormName(suggestedNames[tpl.id] || 'NuevoForm');
  };

  const handleSelectTable = (tableName: string) => {
    setSelectedTable(tableName);
    if (tableName) {
      const pascal =
        tableName
          .split('_')
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join('') + 'Crud';
      setFormName(pascal);
      setRoute(`/${tableName}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Ingresa un nombre para el formulario.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createForm({
        formName: formName.trim(),
        route: route.trim() || '/',
        template: selectedTemplate,
        tableName: selectedTemplate === 'crud_table' && selectedTable ? selectedTable : null,
        gridType,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-3xl max-h-[88vh] bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="px-4 py-3 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Nuevo Formulario NiceGUI</h2>
            <p className="text-[11px] text-[#9c9c9c]">
              Elige una plantilla predefinida o parte desde un lienzo en blanco
            </p>
          </div>
          <button type="button" onClick={onClose}>
            <X className="w-4 h-4 text-[#999] hover:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Template Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {templates.map((tpl) => {
              const Icon = ICON_MAP[tpl.icon] ?? FilePlus2;
              const active = selectedTemplate === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`text-left p-3 rounded-lg border transition flex flex-col gap-1.5 ${
                    active
                      ? 'bg-[#094771]/70 border-[#007acc] ring-1 ring-[#007acc]'
                      : 'bg-[#1e1e1e] border-[#3e3e42] hover:border-[#666]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center ${
                        active ? 'bg-[#007acc] text-white' : 'bg-[#2d2d30] text-[#4fc1ff]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-white">{tpl.name}</span>
                  </div>
                  <p className="text-[11px] text-[#a0a0a0] leading-snug">{tpl.description}</p>
                </button>
              );
            })}
          </div>

          {/* Extra DB Table binding option when CRUD Table template is selected */}
          {selectedTemplate === 'crud_table' && (
            <div className="p-3 rounded-lg bg-[#1e1e1e] border border-[#007acc]/50 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4fc1ff]">
                <Database className="w-3.5 h-3.5" />
                <span>Origen de datos para el CRUD</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#9c9c9c] mb-1">
                    Tabla de Base de Datos (opcional)
                  </label>
                  <select
                    value={selectedTable}
                    onChange={(e) => handleSelectTable(e.target.value)}
                    className="w-full bg-[#3c3c3c] text-xs text-white px-2 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
                  >
                    <option value="">Sin BD (datos de ejemplo en memoria)</option>
                    {tables.map((t) => (
                      <option key={t.name} value={t.name}>
                        Tabla BD: {t.name} ({t.columns.length} columnas)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[#9c9c9c] mb-1">Componente de Grilla</label>
                  <select
                    value={gridType}
                    onChange={(e) => setGridType(e.target.value as 'aggrid' | 'table')}
                    className="w-full bg-[#3c3c3c] text-xs text-white px-2 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
                  >
                    <option value="aggrid">AG Grid (ui.aggrid)</option>
                    <option value="table">Tabla Quasar (ui.table)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Form Name & Route */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs text-[#9c9c9c] mb-1">
                Nombre del Formulario (Clase Python)
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej: ClientesForm"
                className="w-full bg-[#3c3c3c] text-xs font-mono text-white px-2.5 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#9c9c9c] mb-1">Ruta NiceGUI (@ui.page)</label>
              <input
                type="text"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                placeholder="/clientes"
                className="w-full bg-[#3c3c3c] text-xs font-mono text-white px-2.5 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
              />
            </div>
          </div>

          {error && <div className="text-xs text-[#f48771]">{error}</div>}
        </div>

        <div className="px-4 py-3 bg-[#2d2d30] border-t border-[#3e3e42] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded bg-[#3c3c3c] hover:bg-[#4e4e52] text-[#cccccc]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-1.5 text-xs rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white font-medium disabled:opacity-50"
          >
            {submitting ? 'Creando...' : 'Crear Formulario'}
          </button>
        </div>
      </form>
    </div>
  );
};
