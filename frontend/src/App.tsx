import React, { useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { CollisionDetection, DragEndEvent, DragStartEvent } from '@dnd-kit/core';

/**
 * For nested containers (root > card > grid > row), pick the smallest droppable
 * container that contains the pointer so dropping into nested grids/cards always works.
 */
const nestedContainerCollision: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return [...pointerCollisions].sort((a, b) => {
      const rectA = args.droppableRects.get(a.id);
      const rectB = args.droppableRects.get(b.id);
      const areaA = rectA ? rectA.width * rectA.height : Number.MAX_SAFE_INTEGER;
      const areaB = rectB ? rectB.width * rectB.height : Number.MAX_SAFE_INTEGER;
      return areaA - areaB;
    });
  }
  return closestCorners(args);
};
import {
  Blocks,
  FolderTree,
  Database,
  X,
  LayoutTemplate,
  FileCode2,
  Lock,
  Layers,
  BookOpen,
} from 'lucide-react';
import { TopToolbar } from './components/layout/TopToolbar';
import { ToolboxPanel } from './components/toolbox/ToolboxPanel';
import { SolutionExplorer } from './components/explorer/SolutionExplorer';
import { DatabaseExplorer } from './components/database/DatabaseExplorer';
import { DatabaseDesignerPane } from './components/database/DatabaseDesignerPane';
import { DocsPane } from './components/docs/DocsPane';
import { NewFormModal } from './components/modals/NewFormModal';
import { PackagingModal } from './components/modals/PackagingModal';
import { VisualCanvas } from './components/designer/VisualCanvas';
import { DocumentOutline } from './components/designer/DocumentOutline';
import { PropertiesInspector } from './components/inspector/PropertiesInspector';
import { CodeEditorPane } from './components/editor/CodeEditorPane';
import { BottomPanel } from './components/console/BottomPanel';
import { useDesignerStore } from './store/designerStore';
import { getFormRelatedPaths, useIdeStore } from './store/ideStore';

export function App() {
  const [leftTab, setLeftTab] = useState<'toolbox' | 'explorer' | 'database'>('toolbox');
  const [leftWidth, setLeftWidth] = useState(256);
  const [rightWidth, setRightWidth] = useState(296);
  const [bottomHeight, setBottomHeight] = useState(240);
  const [dragLabel, setDragLabel] = useState<string | null>(null);
  const [modal, setModal] = useState<'project' | 'form' | 'package' | null>(null);
  const [inputName, setInputName] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const {
    initWorkspace,
    openTabs,
    activeTabId,
    setActiveTab,
    closeTab,
    openFile,
    saveAll,
    createProject,
    statusMessage,
    runner,
    appendLog,
    setRunnerStatus,
    runCurrentProject,
  } = useIdeStore();

  const {
    addWidget,
    moveNode,
    undo,
    redo,
    deleteNode,
    copyNode,
    pasteNode,
    selectedNodeId,
    isDirty: designerDirty,
    formPath: designerFormPath,
  } = useDesignerStore();

  const startHorizontalResize = (
    e: React.MouseEvent,
    side: 'left' | 'right'
  ) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = side === 'left' ? leftWidth : rightWidth;
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const next = side === 'left' ? startW + delta : startW - delta;
      const clamped = Math.max(190, Math.min(520, next));
      if (side === 'left') setLeftWidth(clamped);
      else setRightWidth(clamped);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startBottomResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = bottomHeight;
    const onMove = (ev: MouseEvent) => {
      const delta = startY - ev.clientY;
      setBottomHeight(Math.max(120, Math.min(540, startH + delta)));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Initialize workspace & connect WebSocket for runner logs
  useEffect(() => {
    void initWorkspace();

    let ws: WebSocket | null = null;
    let closed = false;
    const connect = () => {
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      ws = new WebSocket(`${proto}://${window.location.host}/ws/runner`);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'log') {
            appendLog(msg.stream ?? 'stdout', msg.text ?? '');
          } else if (msg.type === 'status' && msg.status) {
            setRunnerStatus(msg.status);
          }
        } catch {
          // ignore malformed messages
        }
      };
      ws.onclose = () => {
        if (!closed) {
          setTimeout(connect, 2000);
        }
      };
    };
    connect();

    return () => {
      closed = true;
      ws?.close();
    };
  }, [initWorkspace, appendLog, setRunnerStatus]);

  // Global IDE keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        Boolean(target?.closest('.monaco-editor'));

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveAll();
        return;
      }

      if (e.key === 'F5') {
        e.preventDefault();
        void runCurrentProject();
        return;
      }

      if (inInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedNodeId) {
        e.preventDefault();
        copyNode(selectedNodeId);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteNode();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        deleteNode(selectedNodeId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saveAll, runCurrentProject, undo, redo, deleteNode, copyNode, pasteNode, selectedNodeId]);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as
      | { source?: string; widgetType?: string; nodeId?: string }
      | undefined;
    if (data?.source === 'toolbox' && data.widgetType) {
      setDragLabel(`+ ui.${data.widgetType}`);
    } else if (data?.source === 'canvas') {
      setDragLabel('Mover widget');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDragLabel(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as
      | { source?: string; widgetType?: string; nodeId?: string }
      | undefined;
    const overData = over.data.current as { targetNodeId?: string } | undefined;
    const targetParentId = overData?.targetNodeId;
    if (!targetParentId) return;

    if (activeData?.source === 'toolbox' && activeData.widgetType) {
      addWidget(activeData.widgetType, targetParentId);
    } else if (activeData?.source === 'canvas' && activeData.nodeId) {
      moveNode(activeData.nodeId, targetParentId);
    }
  };

  const activeTab = openTabs.find((t) => t.id === activeTabId) ?? null;
  const relatedForm = activeTab ? getFormRelatedPaths(activeTab.path) : null;

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    try {
      if (modal === 'project') {
        if (!inputName.trim()) return;
        await createProject(inputName.trim());
      }
      setModal(null);
      setInputName('');
    } catch (err) {
      setModalError((err as Error).message);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={nestedContainerCollision}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen w-screen flex flex-col bg-[#1e1e1e] text-[#cccccc] overflow-hidden">
        <TopToolbar
          onNewProject={() => {
            setInputName('');
            setModalError(null);
            setModal('project');
          }}
          onNewForm={() => {
            setModal('form');
          }}
          onOpenPackaging={() => {
            setModal('package');
          }}
        />

        {/* Main IDE Body */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Sidebar: Toolbox, Solution Explorer & Database RAD */}
          <aside
            style={{ width: leftWidth }}
            className="bg-[#252526] border-r border-[#3e3e42] flex flex-col shrink-0 relative"
          >
            <div className="flex border-b border-[#3e3e42] bg-[#2d2d30] text-[11px]">
              <button
                onClick={() => setLeftTab('toolbox')}
                className={`flex-1 flex items-center justify-center gap-1 py-2 border-b-2 transition ${
                  leftTab === 'toolbox'
                    ? 'border-[#007acc] text-white bg-[#252526]'
                    : 'border-transparent text-[#999] hover:text-white'
                }`}
              >
                <Blocks className="w-3.5 h-3.5" />
                <span>Toolbox</span>
              </button>
              <button
                onClick={() => setLeftTab('explorer')}
                className={`flex-1 flex items-center justify-center gap-1 py-2 border-b-2 transition ${
                  leftTab === 'explorer'
                    ? 'border-[#007acc] text-white bg-[#252526]'
                    : 'border-transparent text-[#999] hover:text-white'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Solución</span>
              </button>
              <button
                onClick={() => setLeftTab('database')}
                className={`flex-1 flex items-center justify-center gap-1 py-2 border-b-2 transition ${
                  leftTab === 'database'
                    ? 'border-[#007acc] text-white bg-[#252526]'
                    : 'border-transparent text-[#999] hover:text-white'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Datos</span>
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {leftTab === 'toolbox' ? (
                <ToolboxPanel />
              ) : leftTab === 'explorer' ? (
                <SolutionExplorer />
              ) : (
                <DatabaseExplorer />
              )}
            </div>
            <div
              onMouseDown={(e) => startHorizontalResize(e, 'left')}
              className="w-1 h-full cursor-col-resize hover:bg-[#007acc] transition-colors absolute top-0 right-0 z-20"
              title="Arrastra para redimensionar"
            />
          </aside>

          {/* Center Area: Tabs + Designer/Monaco + Bottom Console/Preview */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Tab Bar */}
            <div className="h-9 bg-[#252526] border-b border-[#3e3e42] flex items-center justify-between px-1 shrink-0">
              <div className="flex items-center overflow-x-auto h-full">
                {openTabs.map((tab) => {
                  const isActive = tab.id === activeTabId;
                  const dirty =
                    tab.mode === 'designer'
                      ? designerDirty && designerFormPath === tab.path
                      : Boolean(tab.isDirty);
                  return (
                    <div
                      key={tab.id}
                      onClick={() => void setActiveTab(tab.id)}
                      className={`group h-full flex items-center gap-1.5 px-3 text-xs border-r border-[#3e3e42] cursor-pointer shrink-0 transition ${
                        isActive
                          ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]'
                          : 'bg-[#2d2d30] text-[#969696] hover:bg-[#2a2d2e]'
                      }`}
                    >
                      {tab.mode === 'designer' ? (
                        <LayoutTemplate className="w-3.5 h-3.5 text-[#c586c0]" />
                      ) : tab.mode === 'database' ? (
                        <Database className="w-3.5 h-3.5 text-[#4fc1ff]" />
                      ) : tab.mode === 'docs' ? (
                        <BookOpen className="w-3.5 h-3.5 text-[#4fc1ff]" />
                      ) : tab.isReadOnly ? (
                        <Lock className="w-3 h-3 text-[#858585]" />
                      ) : (
                        <FileCode2 className="w-3.5 h-3.5 text-[#4fc1ff]" />
                      )}
                      <span>{tab.title}</span>
                      {dirty && <span className="w-2 h-2 rounded-full bg-[#4fc1ff]" />}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTab(tab.id);
                        }}
                        className="p-0.5 rounded opacity-60 hover:opacity-100 hover:bg-[#3e3e42]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Visual Studio style quick switcher: Design | Code | Generated */}
              {relatedForm && (
                <div className="flex items-center gap-1 px-2 shrink-0">
                  <button
                    onClick={() => void openFile(relatedForm.formPath)}
                    className={`px-2 py-0.5 text-[11px] rounded transition ${
                      activeTab?.path === relatedForm.formPath
                        ? 'bg-[#007acc] text-white'
                        : 'bg-[#3c3c3c] text-[#cccccc] hover:bg-[#4e4e52]'
                    }`}
                  >
                    Diseño
                  </button>
                  <button
                    onClick={() => void openFile(relatedForm.codeBehindPath)}
                    className={`px-2 py-0.5 text-[11px] rounded transition ${
                      activeTab?.path === relatedForm.codeBehindPath
                        ? 'bg-[#007acc] text-white'
                        : 'bg-[#3c3c3c] text-[#cccccc] hover:bg-[#4e4e52]'
                    }`}
                  >
                    Código (.py)
                  </button>
                  <button
                    onClick={() => void openFile(relatedForm.designerPath)}
                    className={`px-2 py-0.5 text-[11px] rounded transition ${
                      activeTab?.path === relatedForm.designerPath
                        ? 'bg-[#007acc] text-white'
                        : 'bg-[#3c3c3c] text-[#cccccc] hover:bg-[#4e4e52]'
                    }`}
                  >
                    Generado
                  </button>
                </div>
              )}
            </div>

            {/* Editor / Designer Viewport */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {!activeTab ? (
                <div className="h-full flex flex-col items-center justify-center text-sm text-[#858585] gap-2">
                  <LayoutTemplate className="w-10 h-10 text-[#3e3e42]" />
                  <span>Selecciona un formulario o archivo Python en el Explorador de Soluciones.</span>
                </div>
              ) : activeTab.mode === 'designer' ? (
                <VisualCanvas />
              ) : activeTab.mode === 'database' ? (
                <DatabaseDesignerPane />
              ) : activeTab.mode === 'docs' ? (
                <DocsPane />
              ) : (
                <CodeEditorPane tab={activeTab} />
              )}
            </div>

            {/* Bottom Console, Live Preview, Terminal & Pip Packages */}
            <BottomPanel height={bottomHeight} onStartResize={startBottomResize} />
          </main>

          {/* Right Sidebar: Properties Inspector + Document Outline */}
          <aside
            style={{ width: rightWidth }}
            className="bg-[#252526] border-l border-[#3e3e42] flex flex-col shrink-0 relative"
          >
            <div
              onMouseDown={(e) => startHorizontalResize(e, 'right')}
              className="w-1 h-full cursor-col-resize hover:bg-[#007acc] transition-colors absolute top-0 left-0 z-20"
              title="Arrastra para redimensionar"
            />
            <div className="flex-1 min-h-0 overflow-hidden border-b border-[#3e3e42]">
              <PropertiesInspector />
            </div>
            <div className="h-52 flex flex-col shrink-0">
              <div className="px-3 py-1.5 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#bbbbbb]">
                <Layers className="w-3.5 h-3.5 text-[#4fc1ff]" />
                <span>Esquema del Documento</span>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <DocumentOutline />
              </div>
            </div>
          </aside>
        </div>

        {/* Visual Studio–style Status Bar */}
        <footer
          className={`h-6 px-3 flex items-center justify-between text-[11px] text-white shrink-0 transition-colors ${
            runner.running ? 'bg-[#cc6633]' : 'bg-[#007acc]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span>{statusMessage}</span>
          </div>
          <div className="flex items-center gap-4">
            {runner.running && runner.url && <span>NiceGUI activo en {runner.url}</span>}
            <span>Python 3.11 • NiceGUI</span>
          </div>
        </footer>
      </div>

      <DragOverlay>
        {dragLabel ? (
          <div className="px-3 py-1.5 rounded bg-[#007acc] text-white text-xs font-mono shadow-xl border border-[#4fc1ff]">
            {dragLabel}
          </div>
        ) : null}
      </DragOverlay>

      {/* Modal for New Form with Template Gallery */}
      {modal === 'form' && <NewFormModal onClose={() => setModal(null)} />}

      {/* Modal for Visual Packaging & Installer Builder */}
      {modal === 'package' && <PackagingModal onClose={() => setModal(null)} />}

      {/* Modal for New Project */}
      {modal === 'project' && (
        <div
          onClick={() => setModal(null)}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleModalSubmit}
            className="w-full max-w-sm bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl p-4 space-y-3"
          >
            <h2 className="text-sm font-semibold text-white">Nuevo Proyecto NiceGUI</h2>

            <div>
              <label className="block text-xs text-[#9c9c9c] mb-1">Nombre del Proyecto</label>
              <input
                autoFocus
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="mi_app_nicegui"
                className="w-full bg-[#3c3c3c] text-xs text-white px-2.5 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
              />
            </div>

            {modalError && <div className="text-xs text-[#f48771]">{modalError}</div>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-3 py-1 text-xs rounded bg-[#3c3c3c] hover:bg-[#4e4e52] text-[#cccccc]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white font-medium"
              >
                Crear
              </button>
            </div>
          </form>
        </div>
      )}
    </DndContext>
  );
}

export default App;
