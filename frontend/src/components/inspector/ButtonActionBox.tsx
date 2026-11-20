import React from 'react';
import { Navigation, AppWindow, ExternalLink, ArrowLeft } from 'lucide-react';
import { useDesignerStore } from '../../store/designerStore';
import { useIdeStore } from '../../store/ideStore';
import type { WidgetNode } from '../../types/ide';

interface ButtonActionBoxProps {
  node: WidgetNode;
}

function collectDialogs(root: WidgetNode | null, out: WidgetNode[] = []): WidgetNode[] {
  if (!root) return out;
  if (root.type === 'dialog') out.push(root);
  for (const c of root.children) {
    collectDialogs(c, out);
  }
  return out;
}

export const ButtonActionBox: React.FC<ButtonActionBoxProps> = ({ node }) => {
  const { runTargets } = useIdeStore();
  const { document, updateNodeProp, updateNodeEvent } = useDesignerStore();

  const formTargets = runTargets.filter((t) => t.kind === 'form');
  const dialogs = collectDialogs(document?.root ?? null);

  const actionType = String(node.props?.actionType ?? '');
  const actionTarget = String(node.props?.actionTarget ?? '');

  const handleTypeChange = (nextType: string) => {
    updateNodeProp(node.id, 'actionType', nextType);
    if (nextType) {
      // Clear manual on_click so the quick action takes effect cleanly
      updateNodeEvent(node.id, 'on_click', '');
    }
    if (nextType === 'navigate' || nextType === 'navigate_new_tab') {
      const defaultRoute = formTargets[0]?.route ?? '/';
      if (!actionTarget || !actionTarget.startsWith('/')) {
        updateNodeProp(node.id, 'actionTarget', defaultRoute);
      }
    } else if (nextType === 'open_dialog') {
      const defaultDlg = dialogs[0]?.name ?? '';
      updateNodeProp(node.id, 'actionTarget', defaultDlg);
    } else {
      updateNodeProp(node.id, 'actionTarget', '');
    }
  };

  return (
    <div className="p-2.5 rounded-lg bg-[#1e1e1e] border border-[#007acc]/60 space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4fc1ff]">
        <Navigation className="w-3.5 h-3.5" />
        <span>Acción al hacer clic</span>
      </div>

      <div>
        <label className="block text-[10px] text-[#9c9c9c] mb-1">Tipo de acción</label>
        <select
          value={actionType}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-full bg-[#3c3c3c] text-[11px] text-white px-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
        >
          <option value="">Código Python (evento on_click)</option>
          <option value="navigate">Abrir formulario (misma pestaña)</option>
          <option value="navigate_new_tab">Abrir formulario (nueva pestaña)</option>
          <option value="open_dialog">Abrir Ventana Emergente (Dialog)</option>
          <option value="navigate_back">Volver atrás</option>
        </select>
      </div>

      {(actionType === 'navigate' || actionType === 'navigate_new_tab') && (
        <div>
          <label className="block text-[10px] text-[#9c9c9c] mb-1 flex items-center gap-1">
            {actionType === 'navigate_new_tab' ? (
              <ExternalLink className="w-3 h-3 text-[#4fc1ff]" />
            ) : (
              <Navigation className="w-3 h-3 text-[#4fc1ff]" />
            )}
            <span>Formulario destino</span>
          </label>
          <select
            value={actionTarget}
            onChange={(e) => updateNodeProp(node.id, 'actionTarget', e.target.value)}
            className="w-full bg-[#3c3c3c] text-[11px] font-mono text-white px-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
          >
            {formTargets.map((f) => (
              <option key={f.id} value={f.route}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {actionType === 'open_dialog' && (
        <div>
          <label className="block text-[10px] text-[#9c9c9c] mb-1 flex items-center gap-1">
            <AppWindow className="w-3 h-3 text-purple-400" />
            <span>Dialog de este formulario</span>
          </label>
          {dialogs.length === 0 ? (
            <div className="text-[10px] text-[#f48771]">
              No hay ningún <code>ui.dialog</code> en este formulario. Arrastra uno desde el Toolbox.
            </div>
          ) : (
            <select
              value={actionTarget}
              onChange={(e) => updateNodeProp(node.id, 'actionTarget', e.target.value)}
              className="w-full bg-[#3c3c3c] text-[11px] font-mono text-white px-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
            >
              {dialogs.map((d) => (
                <option key={d.id} value={d.name}>
                  self.{d.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {actionType === 'navigate_back' && (
        <div className="text-[10px] text-emerald-400 flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          <span>Ejecutará <code>ui.navigate.back</code> al hacer clic.</span>
        </div>
      )}
    </div>
  );
};
