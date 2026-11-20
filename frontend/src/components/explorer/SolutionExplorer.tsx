import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileCode2,
  LayoutTemplate,
  Lock,
  FileJson,
  File,
  RefreshCw,
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { api } from '../../services/api';
import type { FileTreeItem } from '../../types/ide';
import { useIdeStore } from '../../store/ideStore';

const TreeNode: React.FC<{ item: FileTreeItem; depth: number }> = ({ item, depth }) => {
  const [expanded, setExpanded] = useState(true);
  const { currentProject, activeTabId, openFile, closeTab, refreshTree, setStatusMessage } =
    useIdeStore();
  const isActive = activeTabId === item.path;

  const handleRename = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProject) return;
    const nextPath = window.prompt('Nueva ruta / nombre de archivo:', item.path);
    if (!nextPath || nextPath.trim() === item.path) return;
    try {
      await api.renameFile(currentProject.name, item.path, nextPath.trim());
      closeTab(item.path);
      await refreshTree();
      setStatusMessage(`Renombrado a ${nextPath.trim()}`);
    } catch (err) {
      setStatusMessage(`Error renombrando: ${(err as Error).message}`);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProject) return;
    if (!window.confirm(`¿Eliminar '${item.path}'?`)) return;
    try {
      await api.deleteFile(currentProject.name, item.path);
      closeTab(item.path);
      await refreshTree();
      setStatusMessage(`Eliminado ${item.path}`);
    } catch (err) {
      setStatusMessage(`Error eliminando: ${(err as Error).message}`);
    }
  };

  if (item.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1.5 py-1 px-2 text-xs hover:bg-[#2a2d2e] text-[#cccccc] text-left"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#888] shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#888] shrink-0" />
          )}
          {expanded ? (
            <FolderOpen className="w-3.5 h-3.5 text-[#dcb67a] shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-[#dcb67a] shrink-0" />
          )}
          <span className="truncate">{item.name}</span>
        </button>
        {expanded &&
          item.children?.map((child) => (
            <TreeNode key={child.path} item={child} depth={depth + 1} />
          ))}
      </div>
    );
  }

  const renderIcon = () => {
    if (item.kind === 'form') return <LayoutTemplate className="w-3.5 h-3.5 text-[#c586c0] shrink-0" />;
    if (item.kind === 'designer') return <Lock className="w-3.5 h-3.5 text-[#858585] shrink-0" />;
    if (item.kind === 'python') return <FileCode2 className="w-3.5 h-3.5 text-[#4fc1ff] shrink-0" />;
    if (item.kind === 'json') return <FileJson className="w-3.5 h-3.5 text-[#ce9178] shrink-0" />;
    return <File className="w-3.5 h-3.5 text-[#999] shrink-0" />;
  };

  return (
    <div
      onClick={() => void openFile(item.path)}
      className={`group w-full flex items-center justify-between py-1 px-2 text-xs cursor-pointer transition ${
        isActive ? 'bg-[#094771] text-white' : 'hover:bg-[#2a2d2e] text-[#cccccc]'
      }`}
      style={{ paddingLeft: `${depth * 12 + 22}px` }}
      title={item.path}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {renderIcon()}
        <span className={`truncate ${item.kind === 'designer' ? 'italic text-[#9c9c9c]' : ''}`}>
          {item.name}
        </span>
      </div>
      {item.name !== 'main.py' && item.name !== 'project.ngproj.json' && (
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={handleRename}
            className="p-0.5 rounded hover:bg-[#3e3e42] text-[#cccccc]"
            title="Renombrar"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-0.5 rounded hover:bg-red-600/40 text-[#cccccc] hover:text-red-300"
            title="Eliminar"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export const SolutionExplorer: React.FC = () => {
  const { currentProject, fileTree, refreshTree, openFile, setStatusMessage } = useIdeStore();

  const handleNewFile = async () => {
    if (!currentProject) return;
    const rel = window.prompt('Ruta del nuevo archivo (ej: utils.py o scripts/test.py):');
    if (!rel?.trim()) return;
    try {
      await api.createFile(currentProject.name, rel.trim(), '');
      await refreshTree();
      await openFile(rel.trim());
      setStatusMessage(`Archivo '${rel.trim()}' creado`);
    } catch (err) {
      setStatusMessage(`Error creando archivo: ${(err as Error).message}`);
    }
  };

  const handleNewFolder = async () => {
    if (!currentProject) return;
    const rel = window.prompt('Nombre de la nueva carpeta (ej: services):');
    if (!rel?.trim()) return;
    try {
      await api.createFolder(currentProject.name, rel.trim());
      await refreshTree();
      setStatusMessage(`Carpeta '${rel.trim()}' creada`);
    } catch (err) {
      setStatusMessage(`Error creando carpeta: ${(err as Error).message}`);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#3e3e42] text-[11px] font-semibold uppercase tracking-wider text-[#bbbbbb]">
        <span className="truncate">{currentProject?.name ?? 'Sin proyecto'}</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => void handleNewFile()}
            className="p-1 rounded hover:bg-[#3e3e42] text-[#999] hover:text-white"
            title="Nuevo archivo"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => void handleNewFolder()}
            className="p-1 rounded hover:bg-[#3e3e42] text-[#999] hover:text-white"
            title="Nueva carpeta"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => void refreshTree()}
            className="p-1 rounded hover:bg-[#3e3e42] text-[#999] hover:text-white"
            title="Recargar archivos"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {fileTree.map((item) => (
          <TreeNode key={item.path} item={item} depth={0} />
        ))}
      </div>
    </div>
  );
};
