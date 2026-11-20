import React, { useState } from 'react';
import {
  Package,
  Download,
  Hammer,
  FolderOpen,
  X,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Globe,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import { useIdeStore } from '../../store/ideStore';

interface PackagingModalProps {
  onClose: () => void;
}

export const PackagingModal: React.FC<PackagingModalProps> = ({ onClose }) => {
  const { currentProject, refreshTree, setStatusMessage } = useIdeStore();

  const [appName, setAppName] = useState(currentProject?.name ?? 'MiAppNiceGUI');
  const [version, setVersion] = useState('1.0.0');
  const [nativeWindow, setNativeWindow] = useState(true);
  const [windowWidth, setWindowWidth] = useState(1280);
  const [windowHeight, setWindowHeight] = useState(800);
  const [oneFile, setOneFile] = useState(true);
  const [windowed, setWindowed] = useState(true);
  const [includeData, setIncludeData] = useState(true);

  const [building, setBuilding] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    stdout: string;
    stderr: string;
    distDir: string;
    issPath: string;
    exePath: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!currentProject) return null;

  const handleBuildExe = async () => {
    setBuilding(true);
    setError(null);
    setResult(null);
    setStatusMessage(`Compilando ejecutable '${appName}' con PyInstaller...`);
    try {
      const res = await api.buildProjectExe({
        projectName: currentProject.name,
        appName: appName.trim() || currentProject.name,
        version: version.trim() || '1.0.0',
        nativeWindow,
        windowWidth,
        windowHeight,
        oneFile,
        windowed,
        includeData,
      });
      setResult(res);
      await refreshTree();
      setStatusMessage(
        res.ok
          ? `Compilación finalizada: ${res.exePath ?? res.distDir}`
          : 'Error al compilar el paquete'
      );
    } catch (err) {
      setError((err as Error).message);
      setStatusMessage(`Error empaquetando: ${(err as Error).message}`);
    } finally {
      setBuilding(false);
    }
  };

  const handleOpenDist = async () => {
    if (!result?.distDir) return;
    try {
      await api.openFolder(result.distDir);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div
      onClick={() => !building && onClose()}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Empaquetado e Instalador — {currentProject.name}
              </h2>
              <p className="text-[11px] text-[#9c9c9c]">
                Compila tu proyecto en un ejecutable Windows (.exe), genera el instalador Inno Setup (.iss) o descarga el paquete .zip
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={building}
            onClick={onClose}
            className="text-[#999] hover:text-white disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* App Name & Version */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-[#9c9c9c] mb-1">Nombre de la Aplicación</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                disabled={building}
                className="w-full bg-[#3c3c3c] text-xs font-mono text-white px-2.5 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#9c9c9c] mb-1">Versión</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                disabled={building}
                className="w-full bg-[#3c3c3c] text-xs font-mono text-white px-2.5 py-1.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
              />
            </div>
          </div>

          {/* Execution Mode */}
          <div className="space-y-1.5">
            <label className="block text-xs text-[#9c9c9c]">Modo de Ejecución</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={building}
                onClick={() => setNativeWindow(true)}
                className={`p-3 rounded-lg border text-left transition flex items-start gap-2.5 ${
                  nativeWindow
                    ? 'bg-[#094771]/70 border-[#007acc] text-white'
                    : 'bg-[#1e1e1e] border-[#3e3e42] text-[#cccccc] hover:border-[#666]'
                }`}
              >
                <Monitor className="w-4 h-4 text-[#4fc1ff] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold">Ventana de Escritorio Nativa</div>
                  <div className="text-[10px] text-[#a0a0a0]">
                    Abre tu app en su propia ventana (<code>native=True</code>) sin navegador.
                  </div>
                </div>
              </button>
              <button
                type="button"
                disabled={building}
                onClick={() => setNativeWindow(false)}
                className={`p-3 rounded-lg border text-left transition flex items-start gap-2.5 ${
                  !nativeWindow
                    ? 'bg-[#094771]/70 border-[#007acc] text-white'
                    : 'bg-[#1e1e1e] border-[#3e3e42] text-[#cccccc] hover:border-[#666]'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold">Aplicación Web Local</div>
                  <div className="text-[10px] text-[#a0a0a0]">
                    Inicia el servidor local y abre automáticamente el navegador web.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Window Size (when Native) */}
          {nativeWindow && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded bg-[#1e1e1e] border border-[#333337]">
              <div>
                <label className="block text-[11px] text-[#9c9c9c] mb-1">Ancho ventana (px)</label>
                <input
                  type="number"
                  value={windowWidth}
                  onChange={(e) => setWindowWidth(Number(e.target.value) || 1280)}
                  disabled={building}
                  className="w-full bg-[#3c3c3c] text-xs font-mono text-white px-2 py-1 rounded border border-[#555555]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#9c9c9c] mb-1">Alto ventana (px)</label>
                <input
                  type="number"
                  value={windowHeight}
                  onChange={(e) => setWindowHeight(Number(e.target.value) || 800)}
                  disabled={building}
                  className="w-full bg-[#3c3c3c] text-xs font-mono text-white px-2 py-1 rounded border border-[#555555]"
                />
              </div>
            </div>
          )}

          {/* Packaging Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2 rounded bg-[#1e1e1e] border border-[#333337] cursor-pointer">
              <input
                type="checkbox"
                checked={oneFile}
                onChange={(e) => setOneFile(e.target.checked)}
                disabled={building}
                className="accent-[#007acc]"
              />
              <span>Un solo archivo (.exe)</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded bg-[#1e1e1e] border border-[#333337] cursor-pointer">
              <input
                type="checkbox"
                checked={windowed}
                onChange={(e) => setWindowed(e.target.checked)}
                disabled={building}
                className="accent-[#007acc]"
              />
              <span>Ocultar consola</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded bg-[#1e1e1e] border border-[#333337] cursor-pointer">
              <input
                type="checkbox"
                checked={includeData}
                onChange={(e) => setIncludeData(e.target.checked)}
                disabled={building}
                className="accent-[#007acc]"
              />
              <span>Incluir BD (data/)</span>
            </label>
          </div>

          {/* Build Status / Result */}
          {building && (
            <div className="p-3 rounded-lg bg-[#094771]/40 border border-[#007acc] flex items-center gap-2.5 text-xs text-white">
              <Loader2 className="w-4 h-4 animate-spin text-[#4fc1ff] shrink-0" />
              <span>
                Compilando ejecutable con PyInstaller (la primera vez puede demorar 1–2 minutos mientras instala dependencias y empaqueta NiceGUI)...
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-[#5a1d1d] border border-[#be1100] text-xs text-white flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div
              className={`p-3 rounded-lg border space-y-2 ${
                result.ok
                  ? 'bg-emerald-950/40 border-emerald-600/60'
                  : 'bg-[#5a1d1d]/60 border-[#be1100]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  {result.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#f48771]" />
                  )}
                  <span>
                    {result.ok
                      ? '¡Ejecutable compilado correctamente!'
                      : 'Error durante la compilación'}
                  </span>
                </div>
                {result.ok && (
                  <button
                    type="button"
                    onClick={() => void handleOpenDist()}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Abrir carpeta dist/</span>
                  </button>
                )}
              </div>

              {result.exePath && (
                <div className="text-[11px] font-mono text-emerald-300 break-all">
                  EXE: {result.exePath}
                </div>
              )}
              {result.issPath && (
                <div className="text-[11px] font-mono text-[#9cdcfe] break-all">
                  Script Instalador Inno Setup: {result.issPath}
                </div>
              )}

              {(result.stderr || result.stdout) && (
                <pre className="p-2 rounded bg-[#141416] border border-[#333337] text-[10px] font-mono text-[#cccccc] max-h-40 overflow-auto whitespace-pre-wrap select-text">
                  {result.stderr ? `${result.stderr}\n${result.stdout}` : result.stdout}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-[#2d2d30] border-t border-[#3e3e42] flex flex-wrap items-center justify-between gap-2">
          <a
            href={api.getExportZipUrl(currentProject.name)}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-[#3c3c3c] hover:bg-[#4e4e52] text-white"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Descargar Paquete .ZIP</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={building}
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded bg-[#3c3c3c] hover:bg-[#4e4e52] text-[#cccccc] disabled:opacity-40"
            >
              Cerrar
            </button>
            <button
              type="button"
              disabled={building}
              onClick={() => void handleBuildExe()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded bg-[#16825d] hover:bg-[#1e9e72] text-white disabled:opacity-50"
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>{building ? 'Compilando...' : 'Compilar .EXE + Script Instalador'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
