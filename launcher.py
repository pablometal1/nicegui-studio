from __future__ import annotations

import argparse
import os
import socket
import sys
import threading
import time
import webbrowser
from pathlib import Path


def _add_backend_to_path() -> None:
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        base = Path(getattr(sys, "_MEIPASS"))
        if str(base) not in sys.path:
            sys.path.insert(0, str(base))
        return
    root = Path(__file__).resolve().parent
    backend_dir = root / "backend"
    if backend_dir.exists() and str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))


def _find_free_port(host: str, preferred: int) -> int:
    for port in range(preferred, preferred + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind((host, port))
                return port
            except OSError:
                continue
    return preferred


def main() -> None:
    parser = argparse.ArgumentParser(description="NiceGUI Studio — Python Visual IDE")
    parser.add_argument("--host", default="127.0.0.1", help="Host de escucha (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8010, help="Puerto inicial (default: 8010)")
    parser.add_argument("--no-browser", action="store_true", help="No abrir el navegador automáticamente")
    parser.add_argument("--native", action="store_true", help="Abrir en ventana nativa de escritorio (pywebview)")
    parser.add_argument(
        "--projects-dir",
        default=None,
        help="Directorio personalizado donde guardar los proyectos del usuario",
    )
    args = parser.parse_args()

    if args.projects_dir:
        os.environ["NICEGUI_STUDIO_PROJECTS_DIR"] = str(Path(args.projects_dir).resolve())

    _add_backend_to_path()

    import uvicorn
    from app.main import app as fastapi_app

    port = _find_free_port(args.host, args.port)
    url = f"http://{args.host}:{port}"
    print(f"=======================================================")
    print(f"  NiceGUI Studio iniciando en: {url}")
    print(f"  Presiona Ctrl+C para cerrar el IDE")
    print(f"=======================================================")

    if args.native:
        try:
            import webview

            server_thread = threading.Thread(
                target=uvicorn.run,
                kwargs={"app": fastapi_app, "host": args.host, "port": port, "log_level": "warning"},
                daemon=True,
            )
            server_thread.start()
            time.sleep(1.2)
            webview.create_window("NiceGUI Studio — Python Visual IDE", url, width=1440, height=900)
            webview.start()
            return
        except ImportError:
            print("pywebview no está instalado; abriendo en el navegador...")

    if not args.no_browser:
        def _open() -> None:
            time.sleep(1.2)
            webbrowser.open(url)

        threading.Thread(target=_open, daemon=True).start()

    uvicorn.run(fastapi_app, host=args.host, port=port, log_level="info")


if __name__ == "__main__":
    main()
