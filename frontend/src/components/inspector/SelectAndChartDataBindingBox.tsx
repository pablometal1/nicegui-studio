import React, { useEffect, useState } from 'react';
import { Database, Unlink } from 'lucide-react';
import { api } from '../../services/api';
import { useDesignerStore } from '../../store/designerStore';
import { useIdeStore } from '../../store/ideStore';
import type { DatabaseState, WidgetNode } from '../../types/ide';

interface Props {
  node: WidgetNode;
}

const OPTION_WIDGETS = new Set(['select', 'radio', 'toggle', 'tree']);
const CHART_WIDGETS = new Set(['echart', 'highchart', 'plotly', 'uplot']);

export const SelectAndChartDataBindingBox: React.FC<Props> = ({ node }) => {
  const { currentProject, dbRefreshToken, openDatabaseDesigner, setStatusMessage } = useIdeStore();
  const updateNodeProp = useDesignerStore((s) => s.updateNodeProp);

  const [dbState, setDbState] = useState<DatabaseState | null>(null);
  const boundTable = String(node.props?.dataSourceTable ?? '');

  useEffect(() => {
    if (!currentProject) return;
    void api
      .getDatabaseState(currentProject.name)
      .then(setDbState)
      .catch(() => setDbState(null));
  }, [currentProject?.name, dbRefreshToken]);

  const selectedTableObj = dbState?.tables.find((t) => t.name === boundTable);
  const isOptions = OPTION_WIDGETS.has(node.type);
  const isChart = CHART_WIDGETS.has(node.type);
  const isMap = node.type === 'leaflet';

  const handleSelectTable = async (tableName: string) => {
    if (!currentProject) return;
    if (!tableName) {
      updateNodeProp(node.id, 'dataSourceTable', '');
      return;
    }
    const tbl = dbState?.tables.find((t) => t.name === tableName);
    if (!tbl) return;

    updateNodeProp(node.id, 'dataSourceTable', tableName);

    if (isOptions) {
      const valCol = tbl.primaryKey || tbl.columns[0]?.name || 'id';
      const lblCol = tbl.columns.find((c) => c.name !== valCol)?.name || valCol;
      updateNodeProp(node.id, 'dataSourceValueCol', valCol);
      updateNodeProp(node.id, 'dataSourceLabelCol', lblCol);
      if (node.type !== 'tree') {
        try {
          const res = await api.getTableRows(currentProject.name, tableName, 30);
          const previewOpts = res.rows.map((r) => String(r[lblCol] ?? r[valCol] ?? ''));
          if (previewOpts.length > 0) {
            updateNodeProp(node.id, 'options', previewOpts);
            updateNodeProp(node.id, 'value', previewOpts[0]);
          }
        } catch {
          // ignore preview error
        }
      }
      setStatusMessage(`'${node.name}' vinculado a tabla '${tableName}'`);
    } else if (isChart) {
      const xCol = tbl.columns.find((c) => !c.primaryKey)?.name || tbl.columns[0]?.name || '';
      const yCol =
        tbl.columns.find((c) => c.widgetType === 'number' && !c.primaryKey)?.name ||
        tbl.columns.find((c) => c.widgetType === 'number')?.name ||
        tbl.columns[tbl.columns.length - 1]?.name ||
        '';
      updateNodeProp(node.id, 'dataSourceXCol', xCol);
      updateNodeProp(node.id, 'dataSourceYCol', yCol);
      updateNodeProp(node.id, 'dataSourceChartType', String(node.props?.dataSourceChartType || 'bar'));
      setStatusMessage(`Gráfico '${node.name}' vinculado a '${tableName}' (${xCol} vs ${yCol})`);
    } else if (isMap) {
      const latCol =
        tbl.columns.find((c) => c.name.toLowerCase().includes('lat'))?.name ||
        tbl.columns[0]?.name ||
        'lat';
      const lngCol =
        tbl.columns.find((c) => c.name.toLowerCase().includes('lon') || c.name.toLowerCase().includes('lng'))?.name ||
        tbl.columns[1]?.name ||
        'lng';
      updateNodeProp(node.id, 'dataSourceLatCol', latCol);
      updateNodeProp(node.id, 'dataSourceLngCol', lngCol);
      setStatusMessage(`Mapa '${node.name}' vinculado a '${tableName}' (${latCol}, ${lngCol})`);
    }
  };

  const titleLabel = isMap
    ? 'Marcadores BD'
    : isChart
      ? 'Gráfico BD'
      : node.type === 'tree'
        ? 'Nodos BD'
        : 'Opciones BD';

  return (
    <div className="p-2.5 rounded-lg bg-[#1e1e1e] border border-[#007acc]/60 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#4fc1ff] flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" />
          <span>Data Binding ({titleLabel})</span>
        </span>
        {boundTable && (
          <button
            type="button"
            onClick={() => void handleSelectTable('')}
            className="p-1 rounded hover:bg-[#3e3e42] text-[#999] hover:text-red-400"
            title="Desvincular"
          >
            <Unlink className="w-3 h-3" />
          </button>
        )}
      </div>

      {!dbState?.connected ? (
        <button
          type="button"
          onClick={openDatabaseDesigner}
          className="w-full py-1 text-[11px] rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white"
        >
          Conectar Base de Datos
        </button>
      ) : (
        <div className="space-y-2">
          <div>
            <label className="block text-[10px] text-[#9c9c9c] mb-1">Tabla de BD</label>
            <select
              value={boundTable}
              onChange={(e) => void handleSelectTable(e.target.value)}
              className="w-full bg-[#3c3c3c] text-[11px] font-mono text-white px-2 py-1 rounded border border-[#555555]"
            >
              <option value="">(Sin conectar — manual)</option>
              {dbState.tables.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTableObj && isOptions && (
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[10px] text-[#9c9c9c] mb-1">Columna ID/Valor</label>
                <select
                  value={String(node.props?.dataSourceValueCol ?? '')}
                  onChange={(e) => updateNodeProp(node.id, 'dataSourceValueCol', e.target.value)}
                  className="w-full bg-[#3c3c3c] text-[11px] font-mono text-white px-1.5 py-1 rounded border border-[#555555]"
                >
                  {selectedTableObj.columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#9c9c9c] mb-1">Columna Texto</label>
                <select
                  value={String(node.props?.dataSourceLabelCol ?? '')}
                  onChange={(e) => updateNodeProp(node.id, 'dataSourceLabelCol', e.target.value)}
                  className="w-full bg-[#3c3c3c] text-[11px] font-mono text-white px-1.5 py-1 rounded border border-[#555555]"
                >
                  {selectedTableObj.columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {selectedTableObj && isChart && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                {node.type !== 'uplot' && (
                  <div>
                    <label className="block text-[10px] text-[#9c9c9c] mb-1">Eje X / Etiqueta</label>
                    <select
                      value={String(node.props?.dataSourceXCol ?? '')}
                      onChange={(e) => updateNodeProp(node.id, 'dataSourceXCol', e.target.value)}
                      className="w-full bg-[#3c3c3c] text-[11px] font-mono text-white px-1.5 py-1 rounded border border-[#555555]"
                    >
                      {selectedTableObj.columns.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className={node.type === 'uplot' ? 'col-span-2' : ''}>
                  <label className="block text-[10px] text-[#9c9c9c] mb-1">Eje Y / Valor (numérico)</label>
                  <select
                    value={String(node.props?.dataSourceYCol ?? '')}
                    onChange={(e) => updateNodeProp(node.id, 'dataSourceYCol', e.target.value)}
                    className="w-full bg-[#3c3c3c] text-[11px] font-mono text-white px-1.5 py-1 rounded border border-[#555555]"
                  >
                    {selectedTableObj.columns.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {node.type !== 'uplot' && (
                <div>
                  <label className="block text-[10px] text-[#9c9c9c] mb-1">Tipo de Gráfico</label>
                  <select
                    value={String(node.props?.dataSourceChartType ?? 'bar')}
                    onChange={(e) => updateNodeProp(node.id, 'dataSourceChartType', e.target.value)}
                    className="w-full bg-[#3c3c3c] text-[11px] text-white px-2 py-1 rounded border border-[#555555]"
                  >
                    <option value="bar">Barras (bar)</option>
                    <option value="line">Líneas (line)</option>
                    <option value="pie">Torta (pie)</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {selectedTableObj && isMap && (
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[10px] text-[#9c9c9c] mb-1">Columna Latitud</label>
                <select
                  value={String(node.props?.dataSourceLatCol ?? '')}
                  onChange={(e) => updateNodeProp(node.id, 'dataSourceLatCol', e.target.value)}
                  className="w-full bg-[#3c3c3c] text-[11px] font-mono text-white px-1.5 py-1 rounded border border-[#555555]"
                >
                  {selectedTableObj.columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#9c9c9c] mb-1">Columna Longitud</label>
                <select
                  value={String(node.props?.dataSourceLngCol ?? '')}
                  onChange={(e) => updateNodeProp(node.id, 'dataSourceLngCol', e.target.value)}
                  className="w-full bg-[#3c3c3c] text-[11px] font-mono text-white px-1.5 py-1 rounded border border-[#555555]"
                >
                  {selectedTableObj.columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
