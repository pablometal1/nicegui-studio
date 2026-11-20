import { create } from 'zustand';
import { createWidgetNode, getWidgetDefinition } from '../registry/widgets';
import type {
  FormDocument,
  FormSettings,
  ViewportMode,
  WidgetBinding,
  WidgetNode,
} from '../types/ide';

function collectNames(node: WidgetNode, out = new Set<string>()): Set<string> {
  out.add(node.name);
  for (const child of node.children) {
    collectNames(child, out);
  }
  return out;
}

export function findNodeById(root: WidgetNode, id: string): WidgetNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

export function findParentById(root: WidgetNode, targetId: string): WidgetNode | null {
  for (const child of root.children) {
    if (child.id === targetId) return root;
    const found = findParentById(child, targetId);
    if (found) return found;
  }
  return null;
}

function isDescendant(node: WidgetNode, possibleChildId: string): boolean {
  for (const child of node.children) {
    if (child.id === possibleChildId || isDescendant(child, possibleChildId)) {
      return true;
    }
  }
  return false;
}

function cloneNodeWithNewIds(node: WidgetNode, existingNames: Set<string>): WidgetNode {
  const base = node.name.replace(/_\d+$/, '');
  let counter = 2;
  let newName = `${base}_${counter}`;
  while (existingNames.has(newName)) {
    counter += 1;
    newName = `${base}_${counter}`;
  }
  existingNames.add(newName);
  return {
    ...structuredClone(node),
    id: `node_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: newName,
    events: {},
    children: node.children.map((c) => cloneNodeWithNewIds(c, existingNames)),
  };
}

interface DesignerState {
  formPath: string | null;
  document: FormDocument | null;
  selectedNodeId: string | null;
  viewport: ViewportMode;
  isDirty: boolean;
  past: FormDocument[];
  future: FormDocument[];
  clipboard: WidgetNode | null;

  loadDocument: (formPath: string, doc: FormDocument) => void;
  clearDocument: () => void;
  markSaved: () => void;
  selectNode: (nodeId: string | null) => void;
  setViewport: (vp: ViewportMode) => void;

  undo: () => void;
  redo: () => void;

  addWidget: (widgetType: string, parentId?: string, index?: number) => WidgetNode | null;
  moveNode: (nodeId: string, newParentId: string, index?: number) => void;
  moveNodeRelative: (nodeId: string, direction: 'up' | 'down') => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  copyNode: (nodeId: string) => void;
  pasteNode: (targetParentId?: string) => void;
  updateNodeMeta: (
    nodeId: string,
    patch: Partial<Pick<WidgetNode, 'name' | 'classes' | 'style' | 'quasarProps'>>
  ) => void;
  updateNodeProp: (nodeId: string, key: string, value: unknown) => void;
  updateNodeEvent: (nodeId: string, eventKey: string, handlerName: string) => void;
  addNodeBinding: (nodeId: string, binding: Omit<WidgetBinding, 'id'>) => void;
  deleteNodeBinding: (nodeId: string, bindingId: string) => void;
  updateFormSettings: (patch: Partial<FormSettings> & { formName?: string }) => void;
}

const MAX_HISTORY = 50;

export const useDesignerStore = create<DesignerState>((set, get) => {
  const commit = (mutator: (draft: FormDocument) => void, nextSelectedId?: string | null) => {
    const { document, past } = get();
    if (!document) return;
    const prevSnapshot = structuredClone(document);
    const nextDoc = structuredClone(document);
    mutator(nextDoc);
    set({
      document: nextDoc,
      isDirty: true,
      past: [...past.slice(-(MAX_HISTORY - 1)), prevSnapshot],
      future: [],
      ...(nextSelectedId !== undefined ? { selectedNodeId: nextSelectedId } : {}),
    });
  };

  return {
    formPath: null,
    document: null,
    selectedNodeId: null,
    viewport: 'desktop',
    isDirty: false,
    past: [],
    future: [],
    clipboard: null,

    loadDocument: (formPath, doc) =>
      set({
        formPath,
        document: structuredClone(doc),
        selectedNodeId: doc.root.id,
        isDirty: false,
        past: [],
        future: [],
      }),

    clearDocument: () =>
      set({
        formPath: null,
        document: null,
        selectedNodeId: null,
        isDirty: false,
        past: [],
        future: [],
      }),

    markSaved: () => set({ isDirty: false }),

    selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

    setViewport: (viewport) => set({ viewport }),

    undo: () => {
      const { past, document, future } = get();
      if (!document || past.length === 0) return;
      const previous = past[past.length - 1];
      set({
        document: previous,
        past: past.slice(0, -1),
        future: [structuredClone(document), ...future],
        isDirty: true,
      });
    },

    redo: () => {
      const { past, document, future } = get();
      if (!document || future.length === 0) return;
      const next = future[0];
      set({
        document: next,
        past: [...past, structuredClone(document)],
        future: future.slice(1),
        isDirty: true,
      });
    },

    addWidget: (widgetType, parentId, index) => {
      const { document, selectedNodeId } = get();
      if (!document) return null;

      let targetParentId = parentId;
      if (!targetParentId) {
        // If current selection is a container, drop inside it; else drop inside its parent or root
        const selected = selectedNodeId ? findNodeById(document.root, selectedNodeId) : null;
        if (selected && (selected.id === document.root.id || getWidgetDefinition(selected.type)?.isContainer)) {
          targetParentId = selected.id;
        } else if (selected) {
          targetParentId = findParentById(document.root, selected.id)?.id ?? document.root.id;
        } else {
          targetParentId = document.root.id;
        }
      }

      const existingNames = collectNames(document.root);
      const created = createWidgetNode(widgetType, existingNames);

      commit((draft) => {
        const parent = findNodeById(draft.root, targetParentId!) ?? draft.root;
        if (index !== undefined && index >= 0 && index <= parent.children.length) {
          parent.children.splice(index, 0, created);
        } else {
          parent.children.push(created);
        }
      }, created.id);

      return created;
    },

    moveNode: (nodeId, newParentId, index) => {
      const { document } = get();
      if (!document || nodeId === document.root.id || nodeId === newParentId) return;
      const movingNode = findNodeById(document.root, nodeId);
      if (!movingNode) return;
      if (isDescendant(movingNode, newParentId)) return;

      commit((draft) => {
        const oldParent = findParentById(draft.root, nodeId);
        const newParent = findNodeById(draft.root, newParentId);
        if (!oldParent || !newParent) return;
        const oldIdx = oldParent.children.findIndex((c) => c.id === nodeId);
        if (oldIdx === -1) return;
        const [extracted] = oldParent.children.splice(oldIdx, 1);
        if (index !== undefined && index >= 0 && index <= newParent.children.length) {
          newParent.children.splice(index, 0, extracted);
        } else {
          newParent.children.push(extracted);
        }
      }, nodeId);
    },

    moveNodeRelative: (nodeId, direction) => {
      const { document } = get();
      if (!document || nodeId === document.root.id) return;
      commit((draft) => {
        const parent = findParentById(draft.root, nodeId);
        if (!parent) return;
        const idx = parent.children.findIndex((c) => c.id === nodeId);
        if (idx === -1) return;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= parent.children.length) return;
        const [item] = parent.children.splice(idx, 1);
        parent.children.splice(targetIdx, 0, item);
      });
    },

    deleteNode: (nodeId) => {
      const { document } = get();
      if (!document || nodeId === document.root.id) return;
      const parent = findParentById(document.root, nodeId);
      commit((draft) => {
        const p = findParentById(draft.root, nodeId);
        if (!p) return;
        p.children = p.children.filter((c) => c.id !== nodeId);
      }, parent?.id ?? document.root.id);
    },

    duplicateNode: (nodeId) => {
      const { document } = get();
      if (!document || nodeId === document.root.id) return;
      const node = findNodeById(document.root, nodeId);
      if (!node) return;
      const existingNames = collectNames(document.root);
      const clone = cloneNodeWithNewIds(node, existingNames);
      commit((draft) => {
        const parent = findParentById(draft.root, nodeId);
        if (!parent) return;
        const idx = parent.children.findIndex((c) => c.id === nodeId);
        parent.children.splice(idx + 1, 0, clone);
      }, clone.id);
    },

    copyNode: (nodeId) => {
      const { document } = get();
      if (!document || nodeId === document.root.id) return;
      const node = findNodeById(document.root, nodeId);
      if (!node) return;
      set({ clipboard: structuredClone(node) });
    },

    pasteNode: (targetParentId) => {
      const { document, clipboard, selectedNodeId } = get();
      if (!document || !clipboard) return;
      let parentId = targetParentId;
      if (!parentId) {
        const selected = selectedNodeId ? findNodeById(document.root, selectedNodeId) : null;
        if (selected && (selected.id === document.root.id || getWidgetDefinition(selected.type)?.isContainer)) {
          parentId = selected.id;
        } else if (selected) {
          parentId = findParentById(document.root, selected.id)?.id ?? document.root.id;
        } else {
          parentId = document.root.id;
        }
      }
      const existingNames = collectNames(document.root);
      const clone = cloneNodeWithNewIds(clipboard, existingNames);
      commit((draft) => {
        const parent = findNodeById(draft.root, parentId!) ?? draft.root;
        parent.children.push(clone);
      }, clone.id);
    },

    updateNodeMeta: (nodeId, patch) => {
      commit((draft) => {
        const node = findNodeById(draft.root, nodeId);
        if (!node) return;
        if (patch.name !== undefined) node.name = patch.name;
        if (patch.classes !== undefined) node.classes = patch.classes;
        if (patch.style !== undefined) node.style = patch.style;
        if (patch.quasarProps !== undefined) node.quasarProps = patch.quasarProps;
      });
    },

    updateNodeProp: (nodeId, key, value) => {
      commit((draft) => {
        const node = findNodeById(draft.root, nodeId);
        if (!node) return;
        node.props = { ...node.props, [key]: value };
      });
    },

    updateNodeEvent: (nodeId, eventKey, handlerName) => {
      commit((draft) => {
        const node = findNodeById(draft.root, nodeId);
        if (!node) return;
        const nextEvents = { ...node.events };
        if (handlerName.trim()) {
          nextEvents[eventKey] = handlerName.trim();
        } else {
          delete nextEvents[eventKey];
        }
        node.events = nextEvents;
      });
    },

    addNodeBinding: (nodeId, binding) => {
      commit((draft) => {
        const node = findNodeById(draft.root, nodeId);
        if (!node) return;
        const list = node.bindings ?? [];
        const id = `bind_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        node.bindings = [...list, { ...binding, id }];
      });
    },

    deleteNodeBinding: (nodeId, bindingId) => {
      commit((draft) => {
        const node = findNodeById(draft.root, nodeId);
        if (!node || !node.bindings) return;
        node.bindings = node.bindings.filter((b) => b.id !== bindingId);
      });
    },

    updateFormSettings: (patch) => {
      commit((draft) => {
        if (patch.formName !== undefined) draft.formName = patch.formName;
        if (patch.title !== undefined) draft.settings.title = patch.title;
        if (patch.route !== undefined) draft.settings.route = patch.route;
        if (patch.dark !== undefined) draft.settings.dark = patch.dark;
        if (patch.pageBackground !== undefined) draft.settings.pageBackground = patch.pageBackground;
        if (patch.pageBackgroundImage !== undefined) {
          draft.settings.pageBackgroundImage = patch.pageBackgroundImage;
        }
        if (patch.rootClasses !== undefined) {
          draft.settings.rootClasses = patch.rootClasses;
          draft.root.classes = patch.rootClasses;
        }
      });
    },
  };
});
