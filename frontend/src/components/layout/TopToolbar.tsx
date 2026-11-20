import React from 'react';
import {
  FolderPlus,
  FilePlus2,
  Save,
  Undo2,
  Redo2,
  Play,
  Square,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Code2,
  LayoutDashboard,
  Package,
  BookOpen,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api';
import { useDesignerStore } from '../../store/designerStore';
import { useIdeStore } from '../../store/ideStore';

interface TopToolbarProps {
  onNewProject: () => void;
  onNewForm: () => void;
  onOpenPackaging: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  onNewProject,
  onNewForm,
  onOpenPackaging,
}) => {
  const {
    projects,
    currentProject,
    selectProject,
    saveAll,
    runner,
    runTargets,
    selectedRunTargetId,
    setSelectedRunTargetId,
    hotReload,
    toggleHotReload,
    resolveActiveRunTarget,
    runCurrentProject,
    stopCurrentProject,
    setBottomTab,
    activeTabId,
    refreshTree,
    openFile,
    openDocs,
    setPreviewRoute,
    setStatusMessage,
  } = useIdeStore();

  const handleGenerateMenu = async () => {
    if (!currentProject) return;
    try {
      const res = await api.generateMasterMenu(currentProject.name, '/menu');
      await refreshTree();
      await openFile(res.formPath);
      setPreviewRoute(res.route);
      setStatusMessage(`Menú principal multi-pantalla generado en ${res.route}`);
    } catch (err) {
      setStatusMessage(`Error generando menú: ${(err as Error).message}`);
    }
  };

  const { past, future, undo, redo, viewport, setViewport, isDirty: designerDirty } =
    useDesignerStore();

  // Recompute resolved active target whenever activeTabId, runTargets, or selectedRunTargetId changes
  void activeTabId;
  const resolvedTarget = resolveActiveRunTarget();

  return (
    <header className="h-11 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center justify-between px-3 gap-3 shrink-0">
      {/* Left: Brand & Project Selector */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-white font-semibold text-sm tracking-tight pr-2 border-r border-[#3e3e42]">
          <div className="w-6 h-6 rounded bg-[#007acc] flex items-center justify-center">
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <span>NiceGUI Studio</span>
          <span className="text-[10px] font-mono bg-[#007acc]/25 text-[#4fc1ff] px-1.5 py-0.5 rounded">
            v1
          </span>
        </div>

        <select
          value={currentProject?.name ?? ''}
          onChange={(e) => void selectProject(e.target.value)}
          className="bg-[#3c3c3c] text-[#e0e0e0] text-xs px-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
          title="Seleccionar Proyecto"
        >
          {projects.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          onClick={onNewProject}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-[#3e3e42] text-[#cccccc]"
          title="Nuevo Proyecto"
        >
          <FolderPlus className="w-3.5 h-3.5 text-[#4fc1ff]" />
          <span className="hidden xl:inline">Proyecto</span>
        </button>

        <button
          onClick={onNewForm}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-[#3e3e42] text-[#cccccc]"
          title="Nuevo Formulario NiceGUI"
        >
          <FilePlus2 className="w-3.5 h-3.5 text-[#c586c0]" />
          <span className="hidden xl:inline">Formulario</span>
        </button>

        <button
          onClick={() => void handleGenerateMenu()}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-[#3e3e42] text-[#cccccc]"
          title="Generar Menú Principal Multi-pantalla con todos tus formularios"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-[#dcdcaa]" />
          <span className="hidden 2xl:inline">Menú App</span>
        </button>

        {currentProject && (
          <button
            type="button"
            onClick={onOpenPackaging}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-[#3e3e42] text-[#cccccc]"
            title="Empaquetar e Instalar (.exe Desktop, Script Instalador Inno Setup y .zip)"
          >
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden 2xl:inline">Empaquetar</span>
          </button>
        )}

        <button
          onClick={openDocs}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-[#3e3e42] text-[#cccccc]"
          title="Abrir Documentación de NiceGUI Studio y enlaces a todos los widgets"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#4fc1ff]" />
          <span className="hidden 2xl:inline">Docs</span>
        </button>
      </div>

      {/* Center: Edit Actions & Viewport */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => void saveAll()}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition ${
            designerDirty
              ? 'bg-[#007acc] text-white hover:bg-[#1a8ad4]'
              : 'hover:bg-[#3e3e42] text-[#cccccc]'
          }`}
          title="Guardar todo (Ctrl+S)"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Guardar</span>
        </button>

        <div className="h-4 w-px bg-[#3e3e42] mx-1" />

        <button
          onClick={undo}
          disabled={past.length === 0}
          className="p-1.5 rounded hover:bg-[#3e3e42] disabled:opacity-35 text-[#cccccc]"
          title="Deshacer (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          className="p-1.5 rounded hover:bg-[#3e3e42] disabled:opacity-35 text-[#cccccc]"
          title="Rehacer (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-[#3e3e42] mx-1" />

        <div className="flex items-center bg-[#1e1e1e] rounded p-0.5 border border-[#3e3e42]">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1 rounded ${viewport === 'desktop' ? 'bg-[#007acc] text-white' : 'text-[#999] hover:text-white'}`}
            title="Vista Escritorio"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1 rounded ${viewport === 'tablet' ? 'bg-[#007acc] text-white' : 'text-[#999] hover:text-white'}`}
            title="Vista Tablet"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1 rounded ${viewport === 'mobile' ? 'bg-[#007acc] text-white' : 'text-[#999] hover:text-white'}`}
            title="Vista Móvil"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Hot Reload Toggle + Run Target Selector + Run / Stop / Preview */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleHotReload}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded border transition ${
            hotReload
              ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
              : 'bg-[#2d2d30] border-[#3e3e42] text-[#888] hover:text-white'
          }`}
          title={
            hotReload
              ? 'Hot Reload ACTIVO: al guardar (Ctrl+S) tu app NiceGUI se recarga sola'
              : 'Hot Reload desactivado'
          }
        >
          <Zap className="w-3 h-3 fill-current" />
          <span className="hidden xl:inline">Hot Reload</span>
        </button>

        <select
          value={selectedRunTargetId}
          onChange={(e) => setSelectedRunTargetId(e.target.value)}
          className="max-w-[210px] bg-[#3c3c3c] text-[#e0e0e0] text-[11px] px-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
          title="Qué ejecutar al pulsar F5 (Auto detecta el formulario o script activo)"
        >
          <option value="auto">Auto: {resolvedTarget.label}</option>
          {runTargets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        {!runner.running ? (
          <button
            onClick={() => void runCurrentProject()}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded bg-[#16825d] hover:bg-[#1e9e72] text-white transition"
            title={`Ejecutar ${resolvedTarget.label} (F5)`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar (F5)</span>
          </button>
        ) : (
          <>
            <button
              onClick={() => void stopCurrentProject()}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded bg-[#c72e2e] hover:bg-[#e03e3e] text-white transition"
              title="Detener ejecución"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Detener</span>
            </button>
            <button
              onClick={() => setBottomTab('preview')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white"
              title="Ver Preview embebido"
            >
              <span>Preview</span>
            </button>
            {runner.url && (
              <a
                href={runner.url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded hover:bg-[#3e3e42] text-[#4fc1ff]"
                title={`Abrir ${runner.url} en nueva pestaña`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </>
        )}
      </div>
    </header>
  );
};
