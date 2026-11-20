import React, { useEffect, useState } from 'react';
import {
  Database,
  Plus,
  Trash2,
  KeyRound,
  Link2,
  Table2,
  RefreshCw,
  Wand2,
  Eye,
  X,
  HardDrive,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { useIdeStore } from '../../store/ideStore';
import type {
  ColumnDefinitionInput,
  DatabaseState,
  TableRowsResponse,
  TableSchema,
} from '../../types/ide';

const SQL_TYPES = [
  'INTEGER',
  'VARCHAR(120)',
  'VARCHAR(255)',
  'TEXT',
  'REAL',
  'NUMERIC(10,2)',
  'BOOLEAN',
  'DATE',
  'TIME',
  'DATETIME',
];

function emptyColumn(): ColumnDefinitionInput {
  return {
    name: '',
    sqlType: 'VARCHAR(120)',
    nullable: true,
    primaryKey: false,
    autoincrement: false,
    defaultValue: '',
    foreignKey: null,
  };
}

function buildPreviewSql(tableName: string, columns: ColumnDefinitionInput[]): string {
  const safeTable = tableName.trim() || 'nueva_tabla';
  const defs: string[] = [];
  const fks: string[] = [];

  for (const col of columns) {
    if (!col.name.trim()) continue;
    if (col.primaryKey && col.autoincrement) {
      defs.push(`  "${col.name.trim()}" INTEGER PRIMARY KEY AUTOINCREMENT`);
    } else {
      let line = `  "${col.name.trim()}" ${col.sqlType}`;
      if (col.primaryKey) line += ' PRIMARY KEY';
      if (!col.nullable && !col.primaryKey) line += ' NOT NULL';
      if (col.defaultValue?.trim()) line += ` DEFAULT ${col.defaultValue.trim()}`;
      defs.push(line);
    }
    if (col.foreignKey?.referredTable) {
      fks.push(
        `  FOREIGN KEY ("${col.name.trim()}") REFERENCES "${col.foreignKey.referredTable}"("${col.foreignKey.referredColumn}")`
      );
    }
  }
  return `CREATE TABLE "${safeTable}" (\n${[...defs, ...fks].join(',\n')}\n);`;
}

export const DatabaseDesignerPane: React.FC = () => {
  const {
    currentProject,
    dbRefreshToken,
    bumpDbRefresh,
    refreshTree,
    openFile,
    setPreviewRoute,
    setStatusMessage,
  } = useIdeStore();

  const [dbState, setDbState] = useState<DatabaseState | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create SQLite modal
  const [showSqliteModal, setShowSqliteModal] = useState(false);
  const [sqliteFileName, setSqliteFileName] = useState('mi_base.db');
  const [sqliteWithSample, setSqliteWithSample] = useState(false);

  // Create Table modal
  const [showNewTableModal, setShowNewTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newColumns, setNewColumns] = useState<ColumnDefinitionInput[]>([
    {
      name: 'id',
      sqlType: 'INTEGER',
      nullable: false,
      primaryKey: true,
      autoincrement: true,
      defaultValue: '',
      foreignKey: null,
    },
    {
      name: 'nombre',
      sqlType: 'VARCHAR(120)',
      nullable: false,
      primaryKey: false,
      autoincrement: false,
      defaultValue: '',
      foreignKey: null,
    },
  ]);

  // Add column inline per table
  const [addingColTable, setAddingColTable] = useState<string | null>(null);
  const [inlineCol, setInlineCol] = useState<ColumnDefinitionInput>(emptyColumn());

  // Table rows viewer
  const [rowsView, setRowsView] = useState<TableRowsResponse | null>(null);

  const loadState = async () => {
    if (!currentProject) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const state = await api.getDatabaseState(currentProject.name);
      setDbState(state);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadState();
  }, [currentProject?.name, dbRefreshToken]);

  const handleCreateSqlite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !sqliteFileName.trim()) return;
    setErrorMsg(null);
    try {
      const state = await api.createSqliteDatabase(
        currentProject.name,
        sqliteFileName.trim(),
        sqliteWithSample
      );
      setDbState(state);
      setShowSqliteModal(false);
      bumpDbRefresh();
      await refreshTree();
      setStatusMessage(`Base de datos SQLite '${sqliteFileName.trim()}' creada y conectada`);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newTableName.trim()) return;
    const validCols = newColumns.filter((c) => c.name.trim());
    if (validCols.length === 0) {
      setErrorMsg('Agrega al menos una columna válida.');
      return;
    }
    setErrorMsg(null);
    try {
      const state = await api.createTable(currentProject.name, newTableName.trim(), validCols);
      setDbState(state);
      setShowNewTableModal(false);
      setNewTableName('');
      bumpDbRefresh();
      setStatusMessage(`Tabla '${newTableName.trim()}' creada correctamente`);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleAddInlineColumn = async (tableName: string) => {
    if (!currentProject || !inlineCol.name.trim()) return;
    setErrorMsg(null);
    try {
      const state = await api.addColumn(currentProject.name, tableName, inlineCol);
      setDbState(state);
      setAddingColTable(null);
      setInlineCol(emptyColumn());
      bumpDbRefresh();
      setStatusMessage(`Campo '${inlineCol.name}' agregado a '${tableName}'`);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleDropTable = async (tableName: string) => {
    if (!currentProject) return;
    if (!window.confirm(`¿Eliminar la tabla '${tableName}' y todos sus datos?`)) return;
    setErrorMsg(null);
    try {
      const state = await api.dropTable(currentProject.name, tableName);
      setDbState(state);
      bumpDbRefresh();
      setStatusMessage(`Tabla '${tableName}' eliminada`);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleGenerateCrud = async (tableName: string, gridType: 'aggrid' | 'table') => {
    if (!currentProject) return;
    try {
      const res = await api.generateCrud(currentProject.name, { tableName, gridType });
      await refreshTree();
      await openFile(res.formPath);
      setPreviewRoute(res.route);
      setStatusMessage(`CRUD generado para '${tableName}' en ${res.route}`);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleViewRows = async (tableName: string) => {
    if (!currentProject) return;
    try {
      const data = await api.getTableRows(currentProject.name, tableName);
      setRowsView(data);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  // Collect all Foreign Key relationships for visual summary
  const relationships: Array<{
    fromTable: string;
    fromCol: string;
    toTable: string;
    toCol: string;
  }> = [];
  for (const t of dbState?.tables ?? []) {
    for (const c of t.columns) {
      if (c.foreignKey) {
        relationships.push({
          fromTable: t.name,
          fromCol: c.name,
          toTable: c.foreignKey.referredTable,
          toCol: c.foreignKey.referredColumn,
        });
      }
    }
  }

  const updateNewCol = (idx: number, patch: Partial<ColumnDefinitionInput>) => {
    setNewColumns((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const renderFkSelector = (
    fk: ColumnDefinitionInput['foreignKey'],
    onChange: (next: ColumnDefinitionInput['foreignKey']) => void,
    excludeTable?: string
  ) => {
    const tables = (dbState?.tables ?? []).filter((t) => t.name !== excludeTable);
    const selectedTable: TableSchema | undefined = tables.find(
      (t) => t.name === fk?.referredTable
    );

    return (
      <div className="flex items-center gap-1">
        <select
          value={fk?.referredTable ?? ''}
          onChange={(e) => {
            const tname = e.target.value;
            if (!tname) {
              onChange(null);
            } else {
              const tbl = tables.find((t) => t.name === tname);
              const refCol = tbl?.primaryKey || tbl?.columns[0]?.name || 'id';
              onChange({ referredTable: tname, referredColumn: refCol });
            }
          }}
          className="bg-[#3c3c3c] text-[11px] text-[#e0e0e0] px-1.5 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
        >
          <option value="">Sin relación (FK)</option>
          {tables.map((t) => (
            <option key={t.name} value={t.name}>
              → {t.name}
            </option>
          ))}
        </select>

        {selectedTable && (
          <select
            value={fk?.referredColumn ?? ''}
            onChange={(e) =>
              onChange({
                referredTable: selectedTable.name,
                referredColumn: e.target.value,
              })
            }
            className="bg-[#3c3c3c] text-[11px] font-mono text-[#c586c0] px-1.5 py-1 rounded border border-[#555555]"
          >
            {selectedTable.columns.map((c) => (
              <option key={c.name} value={c.name}>
                .{c.name}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#1a1a1c] overflow-hidden">
      {/* Designer Header Bar */}
      <div className="px-4 py-2.5 bg-[#252526] border-b border-[#3e3e42] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-[#4fc1ff]" />
          <div>
            <div className="text-xs font-semibold text-white">
              Diseñador Visual de Base de Datos
            </div>
            <div className="text-[11px] font-mono text-[#8c8c8c]">
              {dbState?.connected
                ? dbState.connectionUrl
                : 'Sin base de datos conectada — crea una SQLite o conéctate desde Datos'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSqliteFileName('mi_base.db');
              setSqliteWithSample(false);
              setShowSqliteModal(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-[#2d2d30] hover:bg-[#3e3e42] border border-[#555555] text-[#dcdcaa]"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Nueva SQLite</span>
          </button>

          <button
            type="button"
            disabled={!dbState?.connected}
            onClick={() => {
              setNewTableName('');
              setNewColumns([
                {
                  name: 'id',
                  sqlType: 'INTEGER',
                  nullable: false,
                  primaryKey: true,
                  autoincrement: true,
                  defaultValue: '',
                  foreignKey: null,
                },
                {
                  name: 'nombre',
                  sqlType: 'VARCHAR(120)',
                  nullable: false,
                  primaryKey: false,
                  autoincrement: false,
                  defaultValue: '',
                  foreignKey: null,
                },
              ]);
              setShowNewTableModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Tabla</span>
          </button>

          <button
            type="button"
            onClick={() => void loadState()}
            className="p-1.5 rounded hover:bg-[#3e3e42] text-[#cccccc]"
            title="Refrescar esquema"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="px-4 py-2 bg-[#5a1d1d] border-b border-[#be1100] text-xs text-white flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Relationships Bar */}
      {relationships.length > 0 && (
        <div className="px-4 py-2 bg-[#222226] border-b border-[#3e3e42] flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-[#9c9c9c] font-semibold uppercase text-[10px] flex items-center gap-1">
            <Link2 className="w-3 h-3 text-purple-400" />
            Relaciones ({relationships.length}):
          </span>
          {relationships.map((rel, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#2d2d30] border border-purple-500/40 font-mono text-[10px] text-[#e0e0e0]"
            >
              <span className="text-[#4fc1ff]">
                {rel.fromTable}.{rel.fromCol}
              </span>
              <ArrowRight className="w-3 h-3 text-purple-400" />
              <span className="text-[#c586c0]">
                {rel.toTable}.{rel.toCol}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Main ER Canvas */}
      <div
        className="flex-1 overflow-auto p-6"
        style={{
          backgroundImage: 'radial-gradient(#2e2e34 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {!dbState?.connected ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 max-w-md mx-auto">
            <Database className="w-12 h-12 text-[#3e3e42]" />
            <h3 className="text-sm font-semibold text-white">
              Crea o conecta una base de datos para empezar
            </h3>
            <p className="text-xs text-[#9c9c9c]">
              Puedes crear un archivo SQLite nuevo dentro de tu proyecto y diseñar tablas, columnas, tipos de datos y relaciones visualmente.
            </p>
            <button
              type="button"
              onClick={() => setShowSqliteModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white"
            >
              <HardDrive className="w-4 h-4" />
              <span>Crear Base de Datos SQLite</span>
            </button>
          </div>
        ) : dbState.tables.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 max-w-md mx-auto">
            <Table2 className="w-12 h-12 text-[#3e3e42]" />
            <h3 className="text-sm font-semibold text-white">Tu base de datos está vacía</h3>
            <p className="text-xs text-[#9c9c9c]">
              Pulsa <strong>Nueva Tabla</strong> para agregar tu primera tabla con sus campos, tipos y llaves foráneas.
            </p>
            <button
              type="button"
              onClick={() => setShowNewTableModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Primera Tabla</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
            {dbState.tables.map((table) => (
              <div
                key={table.name}
                className="rounded-lg bg-[#252526] border border-[#3e3e42] shadow-xl overflow-hidden flex flex-col"
              >
                {/* Table Card Header */}
                <div className="px-3 py-2 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Table2 className="w-4 h-4 text-[#4fc1ff] shrink-0" />
                    <span className="font-mono font-semibold text-sm text-white truncate">
                      {table.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void handleGenerateCrud(table.name, 'aggrid')}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-[#16825d] hover:bg-[#1e9e72] text-white"
                      title="Generar formulario CRUD con AG Grid"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>CRUD</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleViewRows(table.name)}
                      className="p-1 rounded hover:bg-[#3e3e42] text-[#cccccc]"
                      title="Ver datos de la tabla"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDropTable(table.name)}
                      className="p-1 rounded hover:bg-red-600/30 text-[#999] hover:text-red-400"
                      title="Eliminar tabla"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Columns List */}
                <div className="divide-y divide-[#2f2f33]">
                  {table.columns.map((col) => (
                    <div
                      key={col.name}
                      className="px-3 py-1.5 flex items-center justify-between gap-2 text-xs hover:bg-[#2a2d2e]"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {col.primaryKey ? (
                          <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : col.foreignKey ? (
                          <Link2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 inline-block shrink-0" />
                        )}
                        <span className="font-mono text-[#e0e0e0] truncate">{col.name}</span>
                        {!col.nullable && !col.primaryKey && (
                          <span className="text-[9px] text-[#f48771] font-mono">NN</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {col.foreignKey && (
                          <span className="text-[9px] font-mono px-1 rounded bg-purple-900/50 text-purple-300 border border-purple-500/30">
                            → {col.foreignKey.referredTable}.{col.foreignKey.referredColumn}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-[#9cdcfe]">{col.sqlType}</span>
                        <span className="text-[9px] font-mono px-1 rounded bg-[#094771] text-[#4fc1ff]">
                          {col.widgetType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inline Add Column Footer */}
                <div className="p-2 bg-[#1f1f22] border-t border-[#3e3e42]">
                  {addingColTable === table.name ? (
                    <div className="space-y-2">
                      <div className="flex gap-1.5">
                        <input
                          autoFocus
                          type="text"
                          value={inlineCol.name}
                          onChange={(e) => setInlineCol({ ...inlineCol, name: e.target.value })}
                          placeholder="nombre_campo"
                          className="flex-1 bg-[#3c3c3c] text-[11px] font-mono text-white px-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
                        />
                        <select
                          value={inlineCol.sqlType}
                          onChange={(e) => setInlineCol({ ...inlineCol, sqlType: e.target.value })}
                          className="bg-[#3c3c3c] text-[11px] font-mono text-[#9cdcfe] px-1.5 py-1 rounded border border-[#555555]"
                        >
                          {SQL_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <label className="flex items-center gap-1 text-[11px] text-[#cccccc]">
                          <input
                            type="checkbox"
                            checked={!inlineCol.nullable}
                            onChange={(e) =>
                              setInlineCol({ ...inlineCol, nullable: !e.target.checked })
                            }
                            className="accent-[#007acc]"
                          />
                          <span>NOT NULL</span>
                        </label>
                        {renderFkSelector(
                          inlineCol.foreignKey,
                          (fk) =>
                            setInlineCol({
                              ...inlineCol,
                              foreignKey: fk,
                              sqlType: fk ? 'INTEGER' : inlineCol.sqlType,
                            }),
                          table.name
                        )}
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAddingColTable(null);
                            setInlineCol(emptyColumn());
                          }}
                          className="px-2 py-1 text-[11px] rounded bg-[#3c3c3c] text-[#cccccc]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleAddInlineColumn(table.name)}
                          className="px-2.5 py-1 text-[11px] rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white font-medium"
                        >
                          Agregar Campo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingColTable(table.name);
                        setInlineCol(emptyColumn());
                      }}
                      className="w-full flex items-center justify-center gap-1 py-1 text-[11px] rounded hover:bg-[#2d2d30] text-[#4fc1ff] transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Campo / Relación</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Create SQLite Database */}
      {showSqliteModal && (
        <div
          onClick={() => setShowSqliteModal(false)}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateSqlite}
            className="w-full max-w-sm bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#dcdcaa]" />
              Crear Base de Datos SQLite en el Proyecto
            </h3>
            <div>
              <label className="block text-xs text-[#9c9c9c] mb-1">
                Nombre del archivo (se guardará en <code className="text-[#4fc1ff]">data/</code>)
              </label>
              <input
                autoFocus
                type="text"
                value={sqliteFileName}
                onChange={(e) => setSqliteFileName(e.target.value)}
                placeholder="inventario.db"
                className="w-full bg-[#3c3c3c] text-xs font-mono text-white px-2.5 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-[#cccccc] cursor-pointer">
              <input
                type="checkbox"
                checked={sqliteWithSample}
                onChange={(e) => setSqliteWithSample(e.target.checked)}
                className="accent-[#007acc]"
              />
              <span>Incluir tablas de ejemplo (categorias y productos)</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSqliteModal(false)}
                className="px-3 py-1 text-xs rounded bg-[#3c3c3c] text-[#cccccc]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white font-medium"
              >
                Crear y Conectar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Visual Create Table Builder */}
      {showNewTableModal && (
        <div
          onClick={() => setShowNewTableModal(false)}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateTable}
            className="w-full max-w-4xl max-h-[88vh] bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-4 py-3 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Table2 className="w-4 h-4 text-[#4fc1ff]" />
                Nueva Tabla — Editor Visual de Campos y Relaciones
              </h3>
              <button type="button" onClick={() => setShowNewTableModal(false)}>
                <X className="w-4 h-4 text-[#999] hover:text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-xs text-[#9c9c9c] mb-1">Nombre de la Tabla</label>
                <input
                  autoFocus
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="ej: pedidos, facturas, empleados"
                  className="w-full max-w-sm bg-[#3c3c3c] text-xs font-mono text-white px-2.5 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#cccccc]">
                    Columnas ({newColumns.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewColumns([...newColumns, emptyColumn()])}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-[#2d2d30] hover:bg-[#3e3e42] border border-[#555555] text-[#4fc1ff]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Columna</span>
                  </button>
                </div>

                <div className="border border-[#3e3e42] rounded overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#2d2d30] text-[10px] uppercase text-[#9c9c9c]">
                      <tr>
                        <th className="px-2 py-2">Campo</th>
                        <th className="px-2 py-2">Tipo SQL</th>
                        <th className="px-2 py-2 text-center">PK</th>
                        <th className="px-2 py-2 text-center">Auto</th>
                        <th className="px-2 py-2 text-center">Not Null</th>
                        <th className="px-2 py-2">Default</th>
                        <th className="px-2 py-2">Relación (Foreign Key)</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#333337]">
                      {newColumns.map((col, idx) => (
                        <tr key={idx} className="bg-[#1e1e1e]">
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={col.name}
                              onChange={(e) => updateNewCol(idx, { name: e.target.value })}
                              placeholder="nombre"
                              className="w-32 bg-[#3c3c3c] text-[11px] font-mono text-white px-2 py-1 rounded border border-[#555555]"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <select
                              value={col.sqlType}
                              onChange={(e) => updateNewCol(idx, { sqlType: e.target.value })}
                              className="bg-[#3c3c3c] text-[11px] font-mono text-[#9cdcfe] px-1.5 py-1 rounded border border-[#555555]"
                            >
                              {SQL_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <input
                              type="checkbox"
                              checked={col.primaryKey}
                              onChange={(e) =>
                                updateNewCol(idx, {
                                  primaryKey: e.target.checked,
                                  nullable: e.target.checked ? false : col.nullable,
                                })
                              }
                              className="accent-amber-400"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <input
                              type="checkbox"
                              checked={col.autoincrement}
                              disabled={!col.primaryKey}
                              onChange={(e) =>
                                updateNewCol(idx, {
                                  autoincrement: e.target.checked,
                                  sqlType: e.target.checked ? 'INTEGER' : col.sqlType,
                                })
                              }
                              className="accent-[#007acc]"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <input
                              type="checkbox"
                              checked={!col.nullable}
                              onChange={(e) => updateNewCol(idx, { nullable: !e.target.checked })}
                              className="accent-[#007acc]"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={col.defaultValue ?? ''}
                              onChange={(e) => updateNewCol(idx, { defaultValue: e.target.value })}
                              placeholder="opcional"
                              className="w-20 bg-[#3c3c3c] text-[11px] font-mono text-[#ce9178] px-1.5 py-1 rounded border border-[#555555]"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            {renderFkSelector(col.foreignKey, (fk) =>
                              updateNewCol(idx, {
                                foreignKey: fk,
                                sqlType: fk ? 'INTEGER' : col.sqlType,
                              })
                            )}
                          </td>
                          <td className="px-2 py-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setNewColumns(newColumns.filter((_, i) => i !== idx))
                              }
                              className="p-1 rounded hover:bg-red-600/30 text-[#999] hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live SQL DDL Preview */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#9c9c9c] mb-1">
                  Vista previa SQL (DDL)
                </div>
                <pre className="p-3 rounded bg-[#141416] border border-[#3e3e42] text-[11px] font-mono text-[#9cdcfe] overflow-x-auto">
                  {buildPreviewSql(newTableName, newColumns)}
                </pre>
              </div>
            </div>

            <div className="px-4 py-3 bg-[#2d2d30] border-t border-[#3e3e42] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewTableModal(false)}
                className="px-3 py-1.5 text-xs rounded bg-[#3c3c3c] text-[#cccccc]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white font-medium"
              >
                Crear Tabla en Base de Datos
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Live Table Data Browser */}
      {rowsView && (
        <div
          onClick={() => setRowsView(null)}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[80vh] bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-4 py-2.5 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center justify-between">
              <span className="text-xs font-semibold text-white font-mono">
                Datos de tabla: {rowsView.tableName} ({rowsView.rows.length} registros)
              </span>
              <button type="button" onClick={() => setRowsView(null)}>
                <X className="w-4 h-4 text-[#999] hover:text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3">
              {rowsView.rows.length === 0 ? (
                <div className="text-xs text-[#858585] text-center py-8">
                  Esta tabla aún no tiene registros.
                </div>
              ) : (
                <table className="w-full text-xs text-left border border-[#3e3e42]">
                  <thead className="bg-[#2d2d30] text-[#9cdcfe] font-mono">
                    <tr>
                      {rowsView.columns.map((c) => (
                        <th key={c} className="px-3 py-1.5 border-b border-[#3e3e42]">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333337] font-mono text-[#d4d4d4]">
                    {rowsView.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#2a2d2e]">
                        {rowsView.columns.map((c) => (
                          <td key={c} className="px-3 py-1.5">
                            {String(row[c] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
