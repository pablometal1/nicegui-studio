import React from 'react';
import { inlineCssToReactStyle } from '../../registry/stylesCatalog';
import { useDesignerStore } from '../../store/designerStore';
import { CanvasNode } from './CanvasNode';

const VIEWPORT_WIDTHS = {
  desktop: 'max-w-5xl w-full',
  tablet: 'max-w-[768px] w-full',
  mobile: 'max-w-[390px] w-full',
};

export const VisualCanvas: React.FC = () => {
  const { document, viewport, selectNode } = useDesignerStore();

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-[#858585]">
        Abre un archivo <code className="mx-1 text-[#c586c0]">.ngui.json</code> desde el Explorador de Soluciones.
      </div>
    );
  }

  return (
    <div
      onClick={() => selectNode(document.root.id)}
      className="h-full w-full overflow-auto bg-[#1a1a1c] p-6 flex flex-col items-center"
      style={{
        backgroundImage: 'radial-gradient(#333338 1px, transparent 1px)',
        backgroundSize: '18px 18px',
      }}
    >
      {/* Simulated Browser Window Frame */}
      <div
        className={`${VIEWPORT_WIDTHS[viewport]} transition-all duration-200 rounded-lg overflow-hidden shadow-2xl border border-[#3e3e42] bg-white`}
      >
        <div className="h-8 bg-[#f1f5f9] border-b border-slate-200 flex items-center justify-between px-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="px-3 py-0.5 rounded bg-white border border-slate-200 text-[11px] font-mono text-slate-500">
            {document.settings.title} ({document.settings.route})
          </div>
          <div className="text-[10px] text-slate-400">Doble clic en un control para ir al evento</div>
        </div>

        <div
          className={document.settings.dark ? 'bg-slate-900 text-white' : 'bg-[#f8fafc] text-slate-900'}
          style={{
            ...(document.settings.pageBackground
              ? { background: document.settings.pageBackground }
              : {}),
            ...(document.settings.pageBackgroundImage
              ? {
                  backgroundImage: `url('${document.settings.pageBackgroundImage}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {}),
            ...inlineCssToReactStyle(document.root.style || ''),
          }}
        >
          <CanvasNode node={document.root} isRoot />
        </div>
      </div>
    </div>
  );
};
