import React, { useEffect, useState } from 'react';
import {
  Database,
  Table2,
  KeyRound,
  Link2,
  Wand2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useIdeStore } from '../../store/ideStore';
import type { DatabaseState } from '../../types/ide';

export const DatabaseExplorer: React.FC = () => {
  const {
    currentProject,
    dbRefreshToken,
    bumpDbRefresh,
    openDatabaseDesigner,
    refreshTree,
    openFile,
    setPreviewRoute,
    setStatusMessage,
  } = useIdeStore();

  const [dbState, setDbState] = useState<DatabaseState | null>(null);
  const [urlInput, setUrlInput] = useState('sqlite:///data/app.db');
  const [loading, setLoading] = useState(false);
  const [generatingTable, setGeneratingTable] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  const loadState = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const state = await api.getDatabaseState(currentProject.name);
      setDbState(state);
      if (state.connectionUrl) setUrlInput(state.connectionUrl);
    } catch (err) {
      setDbState({
        connectionUrl: null,
        connected: false,
        error: (err as Error).message,
        tables: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadState();
  }, [currentProject?.name, dbRefreshToken]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !urlInput.trim()) return;
    setLoading(true);
    try {
      const state = await api.connectDatabase(currentProject.name, urlInput.trim());
      setDbState(state);
      if (state.connected) {
        setStatusMessage(`Conectado a base de datos (${state.tables.length} tablas detectadas)`);
      }
    } catch (err) {
      setDbState({
        connectionUrl: urlInput,
        connected: false,
        error: (err as Error).message,
        tables: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSample = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const state = await api.createSampleDatabase(currentProject.name);
      setDbState(state);
      if (state.connectionUrl) setUrlInput(state.connectionUrl);
      bumpDbRefresh();
      await refreshTree();
      setStatusMessage('Base de datos SQLite demo creada (categorias, productos, clientes)');
    } catch (err) {
      setStatusMessage(`Error creando DB demo: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCrud = async (tableName: string, gridType: 'aggrid' | 'table') => {
    if (!currentProject) return;
    setGeneratingTable(`${tableName}:${gridType}`);
    try {
      const res = await api.generateCrud(currentProject.name, { tableName, gridType });
      await refreshTree();
      await openFile(res.formPath);
      setPreviewRoute(res.route);
      setStatusMessage(
        `CRUD RAD generado para '${tableName}' (${gridType.toUpperCase()}) en ruta ${res.route}`
      );
    } catch (err) {
      setStatusMessage(`Error generando CRUD: ${(err as Error).message}`);
    } finally {
      setGeneratingTable(null);
    }
  };

  const toggleTable = (name: string) =>
    setExpandedTables((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Connection panel */}
      <form onSubmit={handleConnect} className="p-2.5 border-b border-[#3e3e42] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#bbbbbb] flex items-center gap-1">
            <Database className="w-3 h-3 text-[#4fc1ff]" />
            Conexión SQLAlchemy
          </span>
          <button
            type="button"
            onClick={() => void loadState()}
            className="p-1 rounded hover:bg-[#3e3e42] text-[#999] hover:text-white"
            title="Refrescar esquema"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="sqlite:///data/app.db o postgresql://..."
          className="w-full bg-[#3c3c3c] text-[11px] font-mono text-[#e0e0e0] px-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
        />

        <div className="flex gap-1.5">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-1 text-[11px] rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white font-medium disabled:opacity-50"
          >
            Conectar
          </button>
          <button
            type="button"
            onClick={() => void handleCreateSample()}
            disabled={loading}
            className="flex items-center justify-center gap-1 px-2 py-1 text-[11px] rounded bg-[#2d2d30] hover:bg-[#3e3e42] border border-[#555555] text-[#dcdcaa]"
            title="Crear base de datos SQLite de ejemplo con 3 tablas"
          >
            <Sparkles className="w-3 h-3" />
            <span>DB Demo</span>
          </button>
        </div>

        <button
          type="button"
          onClick={openDatabaseDesigner}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium rounded bg-[#2d2d30] hover:bg-[#3e3e42] border border-[#007acc]/60 text-[#4fc1ff] transition"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Abrir Editor Visual de BD</span>
        </button>

        {dbState?.connected && (
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span className="truncate">Conectado • {dbState.tables.length} tablas</span>
          </div>
        )}
        {dbState?.error && (
          <div className="flex items-start gap-1.5 text-[10px] text-[#f48771]">
            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
            <span className="break-words">{dbState.error}</span>
          </div>
        )}
      </form>

      {/* Discovered tables & RAD CRUD generator */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {!dbState?.connected ? (
          <div className="text-xs text-[#858585] p-2 space-y-2">
            <p>
              Conecta una base de datos SQLite, PostgreSQL o MySQL, o pulsa{' '}
              <strong className="text-[#dcdcaa]">DB Demo</strong> para crear una base de ejemplo al instante.
            </p>
            <p className="text-[11px] text-[#6a6a6a]">
              El motor RAD lee las tablas, tipos de datos y llaves foráneas para generar formularios CRUD completos con AG Grid o Table.
            </p>
          </div>
        ) : dbState.tables.length === 0 ? (
          <div className="text-xs text-[#858585] p-2">No se encontraron tablas en esta base de datos.</div>
        ) : (
          dbState.tables.map((table) => {
            const isOpen = expandedTables[table.name] ?? true;
            return (
              <div
                key={table.name}
                className="border border-[#3e3e42] rounded bg-[#1e1e1e] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleTable(table.name)}
                  className="w-full flex items-center justify-between px-2 py-1.5 bg-[#2d2d30] hover:bg-[#333337] text-xs font-medium text-white"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#999] shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[#999] shrink-0" />
                    )}
                    <Table2 className="w-3.5 h-3.5 text-[#4fc1ff] shrink-0" />
                    <span className="truncate font-mono">{table.name}</span>
                  </div>
                  <span className="text-[10px] text-[#888] font-mono">{table.columns.length} cols</span>
                </button>

                {isOpen && (
                  <div className="p-2 space-y-2">
                    <div className="space-y-1">
                      {table.columns.map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center justify-between text-[11px] px-1.5 py-0.5 rounded hover:bg-[#252526]"
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            {col.primaryKey && (
                              <span title="Primary Key">
                                <KeyRound className="w-3 h-3 text-amber-400 shrink-0" />
                              </span>
                            )}
                            {col.foreignKey && (
                              <span title={`FK → ${col.foreignKey.referredTable}.${col.foreignKey.referredColumn}`}>
                                <Link2 className="w-3 h-3 text-purple-400 shrink-0" />
                              </span>
                            )}
                            <span className="truncate font-mono text-[#d4d4d4]">{col.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9px] font-mono text-[#858585]">{col.sqlType}</span>
                            <span className="text-[9px] font-mono px-1 rounded bg-[#094771] text-[#9cdcfe]">
                              {col.widgetType}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 1-Click RAD CRUD Generator Buttons */}
                    <div className="flex gap-1.5 pt-1 border-t border-[#2d2d30]">
                      <button
                        type="button"
                        disabled={generatingTable !== null}
                        onClick={() => void handleGenerateCrud(table.name, 'aggrid')}
                        className="flex-1 flex items-center justify-center gap-1 py-1 px-1.5 text-[10px] font-medium rounded bg-[#16825d] hover:bg-[#1e9e72] text-white disabled:opacity-50 transition"
                        title={`Generar formulario CRUD visual con AG Grid para '${table.name}'`}
                      >
                        <Wand2 className="w-3 h-3" />
                        <span>
                          {generatingTable === `${table.name}:aggrid` ? 'Generando...' : 'CRUD AG Grid'}
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled={generatingTable !== null}
                        onClick={() => void handleGenerateCrud(table.name, 'table')}
                        className="flex items-center justify-center gap-1 py-1 px-2 text-[10px] font-medium rounded bg-[#3c3c3c] hover:bg-[#4e4e52] text-[#e0e0e0] disabled:opacity-50 transition"
                        title={`Generar formulario CRUD visual con ui.table para '${table.name}'`}
                      >
                        <span>Table</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
