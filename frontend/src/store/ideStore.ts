import { create } from 'zustand';
import { api } from '../services/api';
import type {
  ConsoleLogEntry,
  FileTreeItem,
  OpenTab,
  ProjectSummary,
  RunnerStatus,
  RunTargetItem,
} from '../types/ide';
import { useDesignerStore } from './designerStore';

function getFileName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

export function getFormRelatedPaths(path: string): {
  formPath: string;
  designerPath: string;
  codeBehindPath: string;
} | null {
  if (path.endsWith('.ngui.json')) {
    const base = path.slice(0, -'.ngui.json'.length);
    return {
      formPath: path,
      designerPath: `${base}_designer.py`,
      codeBehindPath: `${base}.py`,
    };
  }
  if (path.endsWith('_designer.py')) {
    const base = path.slice(0, -'_designer.py'.length);
    return {
      formPath: `${base}.ngui.json`,
      designerPath: path,
      codeBehindPath: `${base}.py`,
    };
  }
  if (path.startsWith('forms/') && path.endsWith('.py') && !path.endsWith('__init__.py')) {
    const base = path.slice(0, -'.py'.length);
    return {
      formPath: `${base}.ngui.json`,
      designerPath: `${base}_designer.py`,
      codeBehindPath: path,
    };
  }
  return null;
}

interface IdeState {
  projects: ProjectSummary[];
  currentProject: ProjectSummary | null;
  fileTree: FileTreeItem[];
  openTabs: OpenTab[];
  activeTabId: string | null;
  statusMessage: string;
  bottomTab: 'console' | 'preview' | 'terminal' | 'packages';
  bottomOpen: boolean;
  logs: ConsoleLogEntry[];
  runner: RunnerStatus;
  previewKey: number;
  previewRoute: string;
  dbRefreshToken: number;
  runTargets: RunTargetItem[];
  selectedRunTargetId: string; // 'auto' or RunTargetItem.id
  hotReload: boolean;

  initWorkspace: () => Promise<void>;
  selectProject: (projectName: string) => Promise<void>;
  createProject: (name: string) => Promise<void>;
  createForm: (payload: {
    formName: string;
    route: string;
    template?: string;
    tableName?: string | null;
    gridType?: 'aggrid' | 'table';
  }) => Promise<void>;
  refreshTree: () => Promise<void>;

  openFile: (path: string, jumpToLine?: number) => Promise<void>;
  openDatabaseDesigner: () => void;
  openDocs: () => void;
  bumpDbRefresh: () => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => Promise<void>;
  updateCodeTabContent: (tabId: string, content: string) => void;
  saveActiveTab: () => Promise<void>;
  saveAll: () => Promise<void>;

  jumpToEventHandler: (nodeId: string, eventKey: string, handlerName: string) => Promise<void>;

  setBottomTab: (tab: 'console' | 'preview' | 'terminal' | 'packages') => void;
  setBottomOpen: (open: boolean) => void;
  appendLog: (stream: 'stdout' | 'stderr' | 'system', text: string) => void;
  clearLogs: () => void;
  setRunnerStatus: (status: RunnerStatus) => void;
  runCurrentProject: () => Promise<void>;
  stopCurrentProject: () => Promise<void>;
  refreshPreview: () => void;
  setPreviewRoute: (route: string) => void;
  setStatusMessage: (msg: string) => void;
  setSelectedRunTargetId: (id: string) => void;
  toggleHotReload: () => void;
  resolveActiveRunTarget: () => {
    entryFile: string;
    route: string;
    label: string;
    kind: 'project' | 'form' | 'script';
  };
}

export const useIdeStore = create<IdeState>((set, get) => ({
  projects: [],
  currentProject: null,
  fileTree: [],
  openTabs: [],
  activeTabId: null,
  statusMessage: 'Listo',
  bottomTab: 'console',
  bottomOpen: true,
  logs: [],
  runner: { running: false, projectName: null, pid: null, port: null, url: null },
  previewKey: 1,
  previewRoute: '/',
  dbRefreshToken: 1,
  runTargets: [],
  selectedRunTargetId: 'auto',
  hotReload: true,

  initWorkspace: async () => {
    try {
      const projects = await api.listProjects();
      const runner = await api.runnerStatus();
      set({ projects, runner });
      if (projects.length > 0) {
        await get().selectProject(projects[0].name);
      }
    } catch (err) {
      set({ statusMessage: `Error inicializando: ${(err as Error).message}` });
    }
  },

  selectProject: async (projectName) => {
    const { projects } = get();
    const proj = projects.find((p) => p.name === projectName) ?? null;
    if (!proj) return;
    useDesignerStore.getState().clearDocument();
    const [fileTree, runTargets] = await Promise.all([
      api.getProjectTree(projectName),
      api.listRunTargets(projectName),
    ]);
    set({
      currentProject: proj,
      fileTree,
      runTargets,
      selectedRunTargetId: 'auto',
      openTabs: [],
      activeTabId: null,
      statusMessage: `Proyecto '${projectName}' cargado`,
    });

    // Auto-open the first .ngui.json form found
    const findFirstForm = (items: FileTreeItem[]): string | null => {
      for (const item of items) {
        if (item.type === 'file' && item.kind === 'form') return item.path;
        if (item.children) {
          const found = findFirstForm(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    const firstForm = findFirstForm(fileTree);
    if (firstForm) {
      await get().openFile(firstForm);
    }
  },

  createProject: async (name) => {
    const created = await api.createProject(name);
    const projects = await api.listProjects();
    set({ projects });
    await get().selectProject(created.name);
  },

  createForm: async (payload) => {
    const { currentProject } = get();
    if (!currentProject) return;
    const created = await api.createForm(currentProject.name, payload);
    await get().refreshTree();
    await get().openFile(created.formPath);
    if (created.route) {
      get().setPreviewRoute(created.route);
    }
    set({ statusMessage: `Formulario '${payload.formName}' creado (${payload.template || 'blank'})` });
  },

  refreshTree: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    const [fileTree, runTargets] = await Promise.all([
      api.getProjectTree(currentProject.name),
      api.listRunTargets(currentProject.name),
    ]);
    set({ fileTree, runTargets });
  },

  openFile: async (path, jumpToLine) => {
    const { currentProject, openTabs } = get();
    if (!currentProject) return;

    const existing = openTabs.find((t) => t.id === path);
    const isForm = path.endsWith('.ngui.json');

    if (isForm) {
      const designer = useDesignerStore.getState();
      if (designer.formPath !== path) {
        const doc = await api.loadForm(currentProject.name, path);
        designer.loadDocument(path, doc);
      }
      if (!existing) {
        const tab: OpenTab = {
          id: path,
          path,
          title: getFileName(path),
          mode: 'designer',
          isDirty: false,
        };
        set({ openTabs: [...openTabs, tab], activeTabId: path });
      } else {
        set({ activeTabId: path });
      }
      return;
    }

    // Code file
    if (existing) {
      // Refresh read-only designer file or when jumping to freshly patched event
      if (existing.isReadOnly || jumpToLine !== undefined) {
        const { content } = await api.readFile(currentProject.name, path);
        set({
          openTabs: openTabs.map((t) =>
            t.id === path ? { ...t, codeContent: content, isDirty: false, jumpToLine } : t
          ),
          activeTabId: path,
        });
      } else {
        set({ activeTabId: path });
      }
      return;
    }

    const { content } = await api.readFile(currentProject.name, path);
    const tab: OpenTab = {
      id: path,
      path,
      title: getFileName(path),
      mode: 'code',
      isReadOnly: path.endsWith('_designer.py'),
      isDirty: false,
      codeContent: content,
      jumpToLine,
    };
    set({ openTabs: [...openTabs, tab], activeTabId: path });
  },

  openDatabaseDesigner: () => {
    const id = '__database_designer__';
    const { openTabs } = get();
    if (!openTabs.some((t) => t.id === id)) {
      set({
        openTabs: [
          ...openTabs,
          { id, path: id, title: 'Editor de Base de Datos', mode: 'database' },
        ],
        activeTabId: id,
      });
    } else {
      set({ activeTabId: id });
    }
  },

  openDocs: () => {
    const id = '__studio_docs__';
    const { openTabs } = get();
    if (!openTabs.some((t) => t.id === id)) {
      set({
        openTabs: [
          ...openTabs,
          { id, path: id, title: 'Documentación y Widgets', mode: 'docs' },
        ],
        activeTabId: id,
      });
    } else {
      set({ activeTabId: id });
    }
  },

  bumpDbRefresh: () => set((s) => ({ dbRefreshToken: s.dbRefreshToken + 1 })),

  closeTab: (tabId) => {
    const { openTabs, activeTabId } = get();
    const idx = openTabs.findIndex((t) => t.id === tabId);
    const nextTabs = openTabs.filter((t) => t.id !== tabId);
    let nextActive = activeTabId;
    if (activeTabId === tabId) {
      nextActive = nextTabs[Math.max(0, idx - 1)]?.id ?? null;
    }
    set({ openTabs: nextTabs, activeTabId: nextActive });
    if (nextActive && nextActive.endsWith('.ngui.json')) {
      void get().setActiveTab(nextActive);
    }
  },

  setActiveTab: async (tabId) => {
    const { currentProject, openTabs } = get();
    const tab = openTabs.find((t) => t.id === tabId);
    if (!tab || !currentProject) return;
    if (tab.mode === 'designer') {
      const designer = useDesignerStore.getState();
      if (designer.formPath !== tab.path) {
        const doc = await api.loadForm(currentProject.name, tab.path);
        designer.loadDocument(tab.path, doc);
      }
    } else if (tab.isReadOnly) {
      const { content } = await api.readFile(currentProject.name, tab.path);
      set({
        openTabs: openTabs.map((t) => (t.id === tabId ? { ...t, codeContent: content } : t)),
      });
    }
    set({ activeTabId: tabId });
  },

  updateCodeTabContent: (tabId, content) => {
    set((s) => ({
      openTabs: s.openTabs.map((t) =>
        t.id === tabId ? { ...t, codeContent: content, isDirty: true, jumpToLine: undefined } : t
      ),
    }));
  },

  saveActiveTab: async () => {
    const { currentProject, activeTabId, openTabs } = get();
    if (!currentProject || !activeTabId) return;
    const tab = openTabs.find((t) => t.id === activeTabId);
    if (!tab) return;

    if (tab.mode === 'designer') {
      const designer = useDesignerStore.getState();
      if (!designer.document || !designer.formPath) return;
      const res = await api.saveForm(currentProject.name, designer.formPath, designer.document);
      designer.markSaved();
      // Update any open _designer.py tab with freshly generated code
      set((s) => ({
        openTabs: s.openTabs.map((t) =>
          t.path === res.designerPath
            ? { ...t, codeContent: res.generatedCode, isDirty: false }
            : t.id === tab.id
              ? { ...t, isDirty: false }
              : t
        ),
        statusMessage: `Guardado ${res.formPath} y regenerado ${res.designerPath}`,
      }));
    } else if (!tab.isReadOnly && tab.codeContent !== undefined) {
      await api.saveFile(currentProject.name, tab.path, tab.codeContent);
      set((s) => ({
        openTabs: s.openTabs.map((t) => (t.id === tab.id ? { ...t, isDirty: false } : t)),
        statusMessage: `Guardado ${tab.path}`,
      }));
    }

    const { runner, hotReload } = get();
    if (runner.running && hotReload) {
      set({ statusMessage: 'Guardado — Hot Reload reiniciando app ⚡...' });
      const nextStatus = await api.runnerRestart();
      set({ runner: nextStatus });
      setTimeout(() => {
        if (get().runner.running) {
          set((s) => ({ previewKey: s.previewKey + 1, statusMessage: 'Hot Reload completado ⚡' }));
        }
      }, 1500);
    }
  },

  saveAll: async () => {
    const { currentProject, openTabs } = get();
    if (!currentProject) return;
    const designer = useDesignerStore.getState();
    let changed = false;
    if (designer.document && designer.formPath && designer.isDirty) {
      changed = true;
      const res = await api.saveForm(currentProject.name, designer.formPath, designer.document);
      designer.markSaved();
      set((s) => ({
        openTabs: s.openTabs.map((t) =>
          t.path === res.designerPath
            ? { ...t, codeContent: res.generatedCode, isDirty: false }
            : t.path === res.formPath
              ? { ...t, isDirty: false }
              : t
        ),
      }));
    }
    for (const tab of openTabs) {
      if (tab.mode === 'code' && !tab.isReadOnly && tab.isDirty && tab.codeContent !== undefined) {
        changed = true;
        await api.saveFile(currentProject.name, tab.path, tab.codeContent);
      }
    }
    const { runner, hotReload } = get();
    set((s) => ({
      openTabs: s.openTabs.map((t) => ({ ...t, isDirty: false })),
      statusMessage:
        changed && runner.running && hotReload
          ? 'Guardado — Hot Reload reiniciando app ⚡...'
          : 'Todos los archivos guardados',
    }));

    if (changed && runner.running && hotReload) {
      const nextStatus = await api.runnerRestart();
      set({ runner: nextStatus });
      setTimeout(() => {
        if (get().runner.running) {
          set((s) => ({ previewKey: s.previewKey + 1, statusMessage: 'Hot Reload completado ⚡' }));
        }
      }, 1500);
    }
  },

  jumpToEventHandler: async (nodeId, eventKey, handlerName) => {
    const { currentProject } = get();
    const designer = useDesignerStore.getState();
    if (!currentProject || !designer.document || !designer.formPath) return;

    const cleanHandler = handlerName.trim();
    if (!cleanHandler) return;

    // 1. Bind event in document and save form (regenerates _designer.py)
    designer.updateNodeEvent(nodeId, eventKey, cleanHandler);
    const updatedDoc = useDesignerStore.getState().document!;
    const saved = await api.saveForm(currentProject.name, designer.formPath, updatedDoc);
    designer.markSaved();

    // 2. Ensure event handler method exists in Form.py using Python AST patcher
    const patched = await api.ensureEvent(currentProject.name, {
      codeBehindPath: saved.codeBehindPath,
      formName: updatedDoc.formName,
      handlerName: cleanHandler,
      eventName: eventKey,
    });

    // 3. Open Form.py in Monaco Editor at the exact line
    await get().openFile(saved.codeBehindPath, patched.lineNumber);
    set({
      statusMessage: patched.created
        ? `Creado handler '${patched.handlerName}' en ${saved.codeBehindPath}:${patched.lineNumber}`
        : `Abierto handler '${patched.handlerName}' en ${saved.codeBehindPath}:${patched.lineNumber}`,
    });
  },

  setBottomTab: (bottomTab) => set({ bottomTab, bottomOpen: true }),
  setBottomOpen: (bottomOpen) => set({ bottomOpen }),

  appendLog: (stream, text) =>
    set((s) => ({
      logs: [
        ...s.logs.slice(-400),
        {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          stream,
          text,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
    })),

  clearLogs: () => set({ logs: [] }),
  setRunnerStatus: (runner) => set({ runner }),

  runCurrentProject: async () => {
    const { currentProject, resolveActiveRunTarget, hotReload } = get();
    if (!currentProject) return;
    await get().saveAll();
    const target = resolveActiveRunTarget();
    set({
      bottomOpen: true,
      bottomTab: 'console',
      previewRoute: target.route,
      statusMessage: `Ejecutando ${target.label}${hotReload ? ' (Hot Reload ⚡)' : ''}...`,
    });
    const status = await api.runnerStart(
      currentProject.name,
      currentProject.port,
      target.entryFile,
      target.route,
      hotReload
    );
    set({ runner: status, previewKey: Date.now() });
    if (target.kind !== 'script') {
      setTimeout(() => {
        if (get().runner.running) {
          set((s) => ({ bottomTab: 'preview', previewKey: s.previewKey + 1 }));
        }
      }, 1800);
    }
  },

  stopCurrentProject: async () => {
    const status = await api.runnerStop();
    set({ runner: status, statusMessage: 'Ejecución detenida' });
  },

  refreshPreview: () => set((s) => ({ previewKey: s.previewKey + 1 })),
  setPreviewRoute: (route) =>
    set((s) => ({
      previewRoute: route.startsWith('/') ? route : `/${route}`,
      previewKey: s.previewKey + 1,
    })),
  setStatusMessage: (statusMessage) => set({ statusMessage }),
  setSelectedRunTargetId: (selectedRunTargetId) => set({ selectedRunTargetId }),
  toggleHotReload: () => set((s) => ({ hotReload: !s.hotReload })),

  resolveActiveRunTarget: () => {
    const { selectedRunTargetId, runTargets, activeTabId, openTabs } = get();
    if (selectedRunTargetId !== 'auto') {
      const explicit = runTargets.find((t) => t.id === selectedRunTargetId);
      if (explicit) {
        return {
          entryFile: explicit.entryFile,
          route: explicit.route,
          label: explicit.label,
          kind: explicit.kind,
        };
      }
    }

    const activeTab = openTabs.find((t) => t.id === activeTabId);
    if (activeTab) {
      const related = getFormRelatedPaths(activeTab.path);
      if (related) {
        const designer = useDesignerStore.getState();
        if (designer.formPath === related.formPath && designer.document) {
          const r = designer.document.settings.route || '/';
          return {
            entryFile: 'main.py',
            route: r.startsWith('/') ? r : `/${r}`,
            label: `${designer.document.formName} (${r})`,
            kind: 'form',
          };
        }
        const match = runTargets.find((t) => t.formPath === related.formPath);
        if (match) {
          return {
            entryFile: match.entryFile,
            route: match.route,
            label: match.label,
            kind: 'form',
          };
        }
      }

      if (
        activeTab.path.endsWith('.py') &&
        activeTab.path !== 'main.py' &&
        !activeTab.path.startsWith('forms/') &&
        !activeTab.path.startsWith('data/')
      ) {
        return {
          entryFile: activeTab.path,
          route: '/',
          label: `Script: ${activeTab.title}`,
          kind: 'script',
        };
      }
    }

    return {
      entryFile: 'main.py',
      route: '/',
      label: 'Proyecto (main.py)',
      kind: 'project',
    };
  },
}));
