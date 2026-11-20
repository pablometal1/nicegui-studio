import React, { useEffect, useRef, useState } from 'react';
import {
  Terminal,
  Globe,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Package,
  SquareTerminal,
  Play,
  Download,
} from 'lucide-react';
import { api } from '../../services/api';
import { useIdeStore } from '../../store/ideStore';

interface BottomPanelProps {
  height: number;
  onStartResize: (e: React.MouseEvent) => void;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({ height, onStartResize }) => {
  const {
    currentProject,
    bottomTab,
    bottomOpen,
    setBottomTab,
    setBottomOpen,
    logs,
    clearLogs,
    runner,
    previewKey,
    previewRoute,
    setPreviewRoute,
    refreshPreview,
  } = useIdeStore();

  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const termEndRef = useRef<HTMLDivElement | null>(null);

  // Integrated Terminal state
  const [termCmd, setTermCmd] = useState('');
  const [termRunning, setTermRunning] = useState(false);
  const [termHistory, setTermHistory] = useState<
    Array<{ id: string; cmd: string; stdout: string; stderr: string; exitCode: number }>
  >([]);

  // Pip Packages state
  const [packages, setPackages] = useState<Array<{ name: string; version: string }>>([]);
  const [pkgFilter, setPkgFilter] = useState('');
  const [pkgToInstall, setPkgToInstall] = useState('');
  const [pkgBusy, setPkgBusy] = useState(false);
  const [pkgOutput, setPkgOutput] = useState<string | null>(null);

  const baseOrigin = runner.port ? `http://127.0.0.1:${runner.port}` : null;
  const previewFullUrl = baseOrigin
    ? `${baseOrigin}${previewRoute === '/' ? '' : previewRoute}`
    : null;

  useEffect(() => {
    if (bottomTab === 'console' && bottomOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, bottomTab, bottomOpen]);

  useEffect(() => {
    if (bottomTab === 'terminal' && bottomOpen) {
      termEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [termHistory, bottomTab, bottomOpen]);

  const loadPackages = async () => {
    setPkgBusy(true);
    try {
      const list = await api.listPackages();
      setPackages(list);
    } catch (err) {
      setPkgOutput(`Error cargando paquetes: ${(err as Error).message}`);
    } finally {
      setPkgBusy(false);
    }
  };

  useEffect(() => {
    if (bottomTab === 'packages' && bottomOpen && packages.length === 0) {
      void loadPackages();
    }
  }, [bottomTab, bottomOpen]);

  const handleExecTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !termCmd.trim() || termRunning) return;
    const cmd = termCmd.trim();
    setTermCmd('');
    setTermRunning(true);
    try {
      const res = await api.execTerminal(currentProject.name, cmd);
      setTermHistory((prev) => [
        ...prev.slice(-40),
        {
          id: `${Date.now()}`,
          cmd,
          stdout: res.stdout,
          stderr: res.stderr,
          exitCode: res.exitCode,
        },
      ]);
    } catch (err) {
      setTermHistory((prev) => [
        ...prev.slice(-40),
        {
          id: `${Date.now()}`,
          cmd,
          stdout: '',
          stderr: (err as Error).message,
          exitCode: 1,
        },
      ]);
    } finally {
      setTermRunning(false);
    }
  };

  const handleInstallPkg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgToInstall.trim() || pkgBusy) return;
    setPkgBusy(true);
    setPkgOutput(`Instalando ${pkgToInstall.trim()}...`);
    try {
      const res = await api.installPackage(pkgToInstall.trim());
      setPkgOutput(res.ok ? `Instalado correctamente:\n${res.stdout}` : `Error:\n${res.stderr || res.stdout}`);
      if (res.ok) {
        setPkgToInstall('');
        const list = await api.listPackages();
        setPackages(list);
      }
    } catch (err) {
      setPkgOutput(`Error: ${(err as Error).message}`);
    } finally {
      setPkgBusy(false);
    }
  };

  const filteredPkgs = packages.filter((p) =>
    p.name.toLowerCase().includes(pkgFilter.trim().toLowerCase())
  );

  return (
    <div
      style={{ height: bottomOpen ? height : 32 }}
      className="border-t border-[#3e3e42] bg-[#1e1e1e] flex flex-col shrink-0 relative"
    >
      {/* Top Vertical Resize Handle */}
      {bottomOpen && (
        <div
          onMouseDown={onStartResize}
          className="h-1 w-full cursor-row-resize hover:bg-[#007acc] transition-colors absolute top-0 left-0 z-20"
          title="Arrastra para redimensionar el panel inferior"
        />
      )}

      {/* Header */}
      <div className="h-8 bg-[#252526] border-b border-[#3e3e42] flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setBottomTab('console')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-t transition shrink-0 ${
              bottomOpen && bottomTab === 'console'
                ? 'bg-[#1e1e1e] text-white border-t-2 border-[#007acc]'
                : 'text-[#999] hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Salida</span>
          </button>
          <button
            onClick={() => setBottomTab('preview')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-t transition shrink-0 ${
              bottomOpen && bottomTab === 'preview'
                ? 'bg-[#1e1e1e] text-white border-t-2 border-[#007acc]'
                : 'text-[#999] hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Vista Previa</span>
            {runner.running && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setBottomTab('terminal')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-t transition shrink-0 ${
              bottomOpen && bottomTab === 'terminal'
                ? 'bg-[#1e1e1e] text-white border-t-2 border-[#007acc]'
                : 'text-[#999] hover:text-white'
            }`}
          >
            <SquareTerminal className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>
          <button
            onClick={() => setBottomTab('packages')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-t transition shrink-0 ${
              bottomOpen && bottomTab === 'packages'
                ? 'bg-[#1e1e1e] text-white border-t-2 border-[#007acc]'
                : 'text-[#999] hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Paquetes (pip)</span>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {bottomTab === 'console' && bottomOpen && (
            <button
              onClick={clearLogs}
              className="p-1 rounded hover:bg-[#3e3e42] text-[#999] hover:text-white"
              title="Limpiar consola"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {bottomTab === 'preview' && bottomOpen && runner.running && previewFullUrl && (
            <>
              <input
                type="text"
                value={previewRoute}
                onChange={(e) => setPreviewRoute(e.target.value)}
                className="w-36 bg-[#3c3c3c] text-[11px] font-mono text-[#e0e0e0] px-2 py-0.5 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
                title="Ruta de la app NiceGUI (ej: /, /productos, /menu)"
              />
              <button
                onClick={refreshPreview}
                className="p-1 rounded hover:bg-[#3e3e42] text-[#999] hover:text-white"
                title="Recargar Vista Previa"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <a
                href={previewFullUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded hover:bg-[#3e3e42] text-[#4fc1ff]"
                title={`Abrir ${previewFullUrl} en navegador`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          )}
          <button
            onClick={() => setBottomOpen(!bottomOpen)}
            className="p-1 rounded hover:bg-[#3e3e42] text-[#999] hover:text-white"
            title={bottomOpen ? 'Minimizar panel' : 'Expandir panel'}
          >
            {bottomOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {bottomOpen && (
        <div className="flex-1 min-h-0 overflow-hidden">
          {bottomTab === 'console' && (
            <div className="h-full overflow-y-auto p-2.5 font-mono text-xs space-y-0.5 select-text">
              {logs.length === 0 ? (
                <div className="text-[#6a6a6a]">
                  Pulsa <span className="text-[#4fc1ff]">Ejecutar (F5)</span> para iniciar tu aplicación NiceGUI y ver los logs aquí.
                </div>
              ) : (
                logs.map((entry) => (
                  <div
                    key={entry.id}
                    className={
                      entry.stream === 'stderr'
                        ? 'text-[#f48771]'
                        : entry.stream === 'system'
                          ? 'text-[#4fc1ff]'
                          : 'text-[#d4d4d4]'
                    }
                  >
                    <span className="text-[#6a6a6a] mr-2">[{entry.timestamp}]</span>
                    <span className="whitespace-pre-wrap">{entry.text}</span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          )}

          {bottomTab === 'preview' &&
            (runner.running && previewFullUrl ? (
              <iframe
                key={`${previewKey}_${previewFullUrl}`}
                src={previewFullUrl}
                title="NiceGUI Live Preview"
                className="w-full h-full bg-white border-0"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#858585]">
                La aplicación no está en ejecución. Pulsa <strong className="mx-1 text-white">Ejecutar (F5)</strong> para ver la vista previa en vivo.
              </div>
            ))}

          {bottomTab === 'terminal' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-2.5 font-mono text-xs space-y-2 select-text">
                {termHistory.length === 0 && (
                  <div className="text-[#6a6a6a]">
                    Terminal del proyecto ({currentProject?.name ?? '...'}). Puedes ejecutar comandos como{' '}
                    <code className="text-[#4fc1ff]">python --version</code>,{' '}
                    <code className="text-[#4fc1ff]">dir</code> o{' '}
                    <code className="text-[#4fc1ff]">pip list</code>.
                  </div>
                )}
                {termHistory.map((item) => (
                  <div key={item.id} className="space-y-0.5">
                    <div className="text-[#4fc1ff]">
                      $ {item.cmd}{' '}
                      <span className="text-[10px] text-[#6a6a6a]">(exit {item.exitCode})</span>
                    </div>
                    {item.stdout && <pre className="text-[#d4d4d4] whitespace-pre-wrap">{item.stdout}</pre>}
                    {item.stderr && <pre className="text-[#f48771] whitespace-pre-wrap">{item.stderr}</pre>}
                  </div>
                ))}
                <div ref={termEndRef} />
              </div>
              <form
                onSubmit={handleExecTerminal}
                className="border-t border-[#3e3e42] bg-[#252526] px-2 py-1.5 flex items-center gap-2"
              >
                <span className="text-xs font-mono text-[#4fc1ff]">$</span>
                <input
                  type="text"
                  value={termCmd}
                  onChange={(e) => setTermCmd(e.target.value)}
                  disabled={termRunning}
                  placeholder="Escribe un comando (ej: python -c 'print(1+1)')..."
                  className="flex-1 bg-transparent text-xs font-mono text-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={termRunning}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  <span>{termRunning ? '...' : 'Ejecutar'}</span>
                </button>
              </form>
            </div>
          )}

          {bottomTab === 'packages' && (
            <div className="h-full flex flex-col p-2.5 gap-2 overflow-hidden">
              <div className="flex flex-wrap items-center gap-2">
                <form onSubmit={handleInstallPkg} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={pkgToInstall}
                    onChange={(e) => setPkgToInstall(e.target.value)}
                    placeholder="Instalar paquete (ej: pandas, requests)..."
                    className="w-60 bg-[#3c3c3c] text-xs font-mono text-white px-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
                  />
                  <button
                    type="submit"
                    disabled={pkgBusy}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-[#16825d] hover:bg-[#1e9e72] text-white disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" />
                    <span>{pkgBusy ? 'Instalando...' : 'pip install'}</span>
                  </button>
                </form>

                <input
                  type="text"
                  value={pkgFilter}
                  onChange={(e) => setPkgFilter(e.target.value)}
                  placeholder="Filtrar instalados..."
                  className="w-44 bg-[#3c3c3c] text-xs text-white px-2 py-1 rounded border border-[#555555] focus:outline-none focus:border-[#007acc]"
                />

                <button
                  type="button"
                  onClick={() => void loadPackages()}
                  className="p-1 rounded hover:bg-[#3e3e42] text-[#cccccc]"
                  title="Recargar lista de paquetes"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${pkgBusy ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {pkgOutput && (
                <pre className="p-2 rounded bg-[#141416] border border-[#3e3e42] text-[10px] font-mono text-[#9cdcfe] max-h-20 overflow-auto whitespace-pre-wrap">
                  {pkgOutput}
                </pre>
              )}

              <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 content-start">
                {filteredPkgs.map((p) => (
                  <div
                    key={p.name}
                    className="px-2 py-1 rounded bg-[#252526] border border-[#333337] flex items-center justify-between text-[11px] font-mono"
                  >
                    <span className="text-[#e0e0e0] truncate">{p.name}</span>
                    <span className="text-[#858585] text-[10px] ml-1 shrink-0">{p.version}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
