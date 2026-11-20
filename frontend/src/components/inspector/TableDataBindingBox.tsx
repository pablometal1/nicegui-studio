import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, Unlink } from 'lucide-react';
import { api } from '../../services/api';
import { useDesignerStore } from '../../store/designerStore';
import { useIdeStore } from '../../store/ideStore';
import type { DatabaseState, TableSchema, WidgetNode } from '../../types/ide';

interface TableDataBindingBoxProps {
  node: WidgetNode;
}

function formatLabel(name: string): string {
  const clean = name.replace(/_/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export const TableDataBindingBox: React.FC<TableDataBindingBoxProps> = ({ node }) => {
  const { currentProject, dbRefreshToken, openDatabaseDesigner, setStatusMessage } = useIdeStore();
  const updateNodeProp = useDesignerStore((s) => s.updateNodeProp);

  const [dbState, setDbState] = useState<DatabaseState | null>(null);
  const [loading, setLoading] = useState(false);

  const boundTable = String(node.props?.dataSourceTable ?? '');

  useEffect(() => {
    if (!currentProject) return;
    void api
      .getDatabaseState(currentProject.name)
      .then(setDbState)
      .catch(() => setDbState(null));
  }, [currentProject?.name, dbRefreshToken]);

  const bindToTable = async (tableName: string) => {
    if (!currentProject) return;
    if (!tableName) {
      updateNodeProp(node.id, 'dataSourceTable', '');
      setStatusMessage(`Desvinculado '${node.name}' de la base de datos`);
      return;
    }

    const tbl: TableSchema | undefined = dbState?.tables.find((t) => t.name === tableName);
    if (!tbl) return;

    setLoading(true);
    try {
      const data = await api.getTableRows(currentProject.name, tableName, 50);
      const previewRows = data.rows ?? [];

      updateNodeProp(node.id, 'dataSourceTable', tableName);

      if (node.type === 'aggrid') {
        const existingOpts =
          typeof node.props?.options === 'object' && node.props.options !== null
            ? (node.props.options as Record<string, unknown>)
            : {};
        const columnDefs = tbl.columns.map((c) => ({
          headerName: formatLabel(c.name),
          field: c.name,
          sortable: true,
          filter: true,
          resizable: true,
        }));
        updateNodeProp(node.id, 'options', {
          ...existingOpts,
          columnDefs,
          rowData: previewRows,
          rowSelection: existingOpts.rowSelection ?? 'single',
        });
      } else {
        const columns = tbl.columns.map((c) => ({
          name: c.name,
          label: formatLabel(c.name),
          field: c.name,
          align: 'left',
          sortable: true,
        }));
        updateNodeProp(node.id, 'title', formatLabel(tbl.name));
        updateNodeProp(node.id, 'row_key', tbl.primaryKey || tbl.columns[0]?.name || 'id');
        updateNodeProp(node.id, 'columns', columns);
        updateNodeProp(node.id, 'rows', previewRows);
      }

      setStatusMessage(
        `Tabla '${node.name}' conectada a '${tableName}' (${tbl.columns.length} columnas, ${previewRows.length} registros)`
      );
    } catch (err) {
      setStatusMessage(`Error sincronizando tabla '${tableName}': ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2.5 rounded-lg bg-[#1e1e1e] border border-[#007acc]/60 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#4fc1ff] flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" />
          <span>Data Binding (BD)</span>
        </span>
        {boundTable && (
          <button
            type="button"
            onClick={() => void bindToTable('')}
            className="p-1 rounded hover:bg-[#3e3e42] text-[#999] hover:text-red-400"
            title="Desvincular tabla"
          >
            <Unlink className="w-3 h-3" />
          </button>
        )}
      </div>

      {!dbState?.connected ? (
        <div className="space-y-1.5">
          <p className="text-[10px] text-[#9c9c9c]">
            Conecta o crea una base de datos SQLite para vincular esta tabla automáticamente.
          </p>
          <button
            type="button"
            onClick={openDatabaseDesigner}
            className="w-full py-1 text-[11px] rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white font-medium"
          >
            Abrir Editor de Base de Datos
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <label className="block text-[10px] text-[#9c9c9c] mb-1">
              Tabla de Base de Datos
            </label>
            <div className="flex gap-1">
              <select
                value={boundTable}
                disabled={loading}
                onChange={(e) => void bindToTable(e.target.value)}
                className="flex-1 bg-[#3c3c3c] text-[11px] font-mono text-white px-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
              >
                <option value="">(Sin conectar — datos manuales)</option>
                {dbState.tables.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.columns.length} cols)
                  </option>
                ))}
              </select>
              {boundTable && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void bindToTable(boundTable)}
                  className="p-1.5 rounded bg-[#2d2d30] hover:bg-[#3e3e42] border border-[#555555] text-[#4fc1ff]"
                  title="Resincronizar columnas y datos desde la BD"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {boundTable && (
            <div className="text-[10px] text-emerald-400">
              Al guardar y ejecutar (F5), los registros de <code className="font-mono">{boundTable}</code> se cargarán automáticamente desde la BD.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
