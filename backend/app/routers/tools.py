from __future__ import annotations

import functools
import inspect
import io
import json
import os
import re
import subprocess
import sys
import zipfile
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from nicegui import ui
from pydantic import BaseModel

from app.services.project_service import IGNORED_NAMES, ProjectService

router = APIRouter(prefix="/api/tools", tags=["tools"])
project_service = ProjectService()


class InstallPackageRequest(BaseModel):
    package: str


class TerminalExecRequest(BaseModel):
    projectName: str
    command: str


@router.get("/packages")
def list_packages() -> list[dict[str, str]]:
    proc = subprocess.run(
        [sys.executable, "-m", "pip", "list", "--format=json"],
        capture_output=True,
        text=True,
        timeout=30,
    )
    if proc.returncode != 0:
        raise HTTPException(status_code=500, detail=proc.stderr or "Error listando paquetes pip")
    try:
        return json.loads(proc.stdout)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/packages/install")
def install_package(req: InstallPackageRequest) -> dict[str, object]:
    pkg = req.package.strip()
    if not pkg or not re.match(r"^[A-Za-z0-9_.\-\[\]>=<!,~]+$", pkg):
        raise HTTPException(status_code=400, detail="Nombre de paquete inválido.")
    proc = subprocess.run(
        [sys.executable, "-m", "pip", "install", pkg],
        capture_output=True,
        text=True,
        timeout=180,
    )
    return {
        "ok": proc.returncode == 0,
        "exitCode": proc.returncode,
        "stdout": proc.stdout,
        "stderr": proc.stderr,
    }


@router.post("/terminal/exec")
def exec_terminal(req: TerminalExecRequest) -> dict[str, object]:
    cmd = req.command.strip()
    if not cmd:
        return {"exitCode": 0, "stdout": "", "stderr": ""}
    try:
        pdir = project_service.get_project_dir(req.projectName)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    # Replace leading `python` or `pip` with the IDE's venv python so user packages match
    if re.match(r"^python(\s|$)", cmd):
        cmd = f'"{sys.executable}"' + cmd[len("python") :]
    elif re.match(r"^pip(\s|$)", cmd):
        cmd = f'"{sys.executable}" -m pip' + cmd[len("pip") :]

    try:
        proc = subprocess.run(
            cmd,
            cwd=str(pdir),
            shell=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=60,
        )
        return {
            "exitCode": proc.returncode,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
        }
    except subprocess.TimeoutExpired:
        return {
            "exitCode": 124,
            "stdout": "",
            "stderr": "Comando cancelado por tiempo límite (60s).",
        }


@router.get("/export/{project_name}/zip")
def export_project_zip(project_name: str) -> StreamingResponse:
    try:
        pdir = project_service.get_project_dir(project_name)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path in sorted(pdir.rglob("*")):
            if any(part in IGNORED_NAMES for part in file_path.parts):
                continue
            if file_path.is_file():
                arcname = f"{project_name}/{file_path.relative_to(pdir).as_posix()}"
                zf.write(file_path, arcname)

        # Add ready-to-deploy requirements.txt
        zf.writestr(
            f"{project_name}/requirements.txt",
            "nicegui>=2.0.0\nsqlalchemy>=2.0.0\npywebview>=5.0.0\n",
        )
        # Add Dockerfile
        zf.writestr(
            f"{project_name}/Dockerfile",
            (
                "FROM python:3.11-slim\n"
                "WORKDIR /app\n"
                "COPY requirements.txt .\n"
                "RUN pip install --no-cache-dir -r requirements.txt\n"
                "COPY . .\n"
                "EXPOSE 8080\n"
                'ENV NICEGUI_PORT=8080\n'
                'CMD ["python", "main.py"]\n'
            ),
        )
        # Add Desktop Native launcher (NiceGUI native=True)
        zf.writestr(
            f"{project_name}/run_desktop.py",
            (
                "from __future__ import annotations\n"
                "from nicegui import ui\n"
                "from main import register_all_forms\n\n"
                "register_all_forms()\n\n"
                'if __name__ in {"__main__", "__mp_main__"}:\n'
                f"    ui.run(title={project_name!r}, native=True, window_size=(1280, 800), reload=False)\n"
            ),
        )
        # Add PyInstaller .exe build helper
        zf.writestr(
            f"{project_name}/build_exe.bat",
            (
                "@echo off\n"
                "echo Instalando PyInstaller y compilando ejecutable de escritorio...\n"
                "pip install pyinstaller nicegui sqlalchemy pywebview\n"
                f'nicegui-pack --onefile --windowed --name "{project_name}" run_desktop.py\n'
                "echo Listo! Revisa la carpeta dist\\\n"
                "pause\n"
            ),
        )

    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{project_name}.zip"'},
    )


COMMON_BASE_METHODS = {
    "update",
    "clear",
    "delete",
    "classes",
    "props",
    "style",
    "on",
    "set_visibility",
    "set_enabled",
    "set_value",
    "set_text",
    "set_content",
    "set_source",
    "set_options",
    "tooltip",
    "move",
    "run_method",
}


@functools.lru_cache(maxsize=128)
def _introspect_widget_methods(widget_type: str) -> list[dict[str, object]]:
    cls = getattr(ui, widget_type, None)
    if cls is None or not inspect.isclass(cls):
        return []

    own_names = set(cls.__dict__.keys())
    methods: list[dict[str, object]] = []
    seen: set[str] = set()

    for name, member in inspect.getmembers(cls):
        if name.startswith("_") or name in seen:
            continue
        is_own = name in own_names
        is_func = inspect.isfunction(member) or inspect.ismethod(member)
        is_prop = isinstance(member, property)
        is_callable_factory = is_own and callable(member)
        if not (is_func or is_prop or is_callable_factory):
            continue

        if not is_own and name not in COMMON_BASE_METHODS and name != "value":
            continue

        seen.add(name)
        sig_str = ""
        is_async = False
        if is_func or is_callable_factory:
            is_async = inspect.iscoroutinefunction(member)
            try:
                sig = inspect.signature(member)
                params = [
                    str(p)
                    for k, p in sig.parameters.items()
                    if k != "self"
                ]
                sig_str = f"({', '.join(params)})"
            except Exception:
                sig_str = "()"

        doc_raw = inspect.getdoc(member) or ""
        first_line = doc_raw.splitlines()[0].strip() if doc_raw else ""

        methods.append(
            {
                "name": name,
                "signature": sig_str,
                "doc": first_line,
                "isOwn": is_own,
                "isAsync": is_async,
                "isProperty": is_prop,
            }
        )

    methods.sort(key=lambda m: (0 if m["isOwn"] else 1, str(m["name"])))
    return methods


@router.get("/widget-methods/{widget_type}")
def get_widget_methods(widget_type: str) -> list[dict[str, object]]:
    clean = re.sub(r"[^a-zA-Z0-9_]", "", widget_type.strip())
    if not clean:
        return []
    return _introspect_widget_methods(clean)


class BuildPackageRequest(BaseModel):
    projectName: str
    appName: str | None = None
    version: str = "1.0.0"
    nativeWindow: bool = True
    windowWidth: int = 1280
    windowHeight: int = 800
    oneFile: bool = True
    windowed: bool = True
    includeData: bool = True


class OpenFolderRequest(BaseModel):
    folderPath: str


@router.post("/package/build-exe")
def build_project_exe(req: BuildPackageRequest) -> dict[str, object]:
    try:
        pdir = project_service.get_project_dir(req.projectName)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    safe_app = re.sub(r"[^a-zA-Z0-9_-]", "_", (req.appName or req.projectName).strip()) or req.projectName

    # 1. Generate clean packaged entrypoint inside the project
    if req.nativeWindow:
        run_call = (
            f"    ui.run(title={safe_app!r}, native=True, "
            f"window_size=({int(req.windowWidth)}, {int(req.windowHeight)}), "
            "reload=False, storage_secret='nicegui-studio-secret')\n"
        )
    else:
        run_call = (
            f"    ui.run(title={safe_app!r}, reload=False, show=True, "
            "storage_secret='nicegui-studio-secret')\n"
        )

    entry_file = pdir / "run_packaged.py"
    entry_file.write_text(
        (
            "from __future__ import annotations\n"
            "from nicegui import ui\n"
            "from main import register_all_forms\n\n"
            "register_all_forms()\n\n"
            'if __name__ in {"__main__", "__mp_main__"}:\n'
            f"{run_call}"
        ),
        encoding="utf-8",
    )

    # 2. Generate Inno Setup script (.iss) for this user project
    iss_path = pdir / f"setup_{safe_app}.iss"
    dist_source = (
        f"dist\\{safe_app}.exe" if req.oneFile else f"dist\\{safe_app}\\*"
    )
    iss_path.write_text(
        (
            f'#define MyAppName "{safe_app}"\n'
            f'#define MyAppVersion "{req.version}"\n'
            f'#define MyAppExeName "{safe_app}.exe"\n\n'
            "[Setup]\n"
            "AppName={#MyAppName}\n"
            "AppVersion={#MyAppVersion}\n"
            "DefaultDirName={autopf}\\{#MyAppName}\n"
            "DefaultGroupName={#MyAppName}\n"
            "OutputDir=dist\\installer\n"
            "OutputBaseFilename=Setup_{#MyAppName}_{#MyAppVersion}\n"
            "Compression=lzma2\n"
            "SolidCompression=yes\n"
            "WizardStyle=modern\n\n"
            "[Languages]\n"
            'Name: "spanish"; MessagesFile: "compiler:Languages\\Spanish.isl"\n\n'
            "[Tasks]\n"
            'Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"\n\n'
            "[Files]\n"
            f'Source: "{dist_source}"; DestDir: "{{app}}"; Flags: ignoreversion recursesubdirs createallsubdirs\n\n'
            "[Icons]\n"
            'Name: "{group}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"\n'
            'Name: "{autodesktop}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"; Tasks: desktopicon\n\n'
            "[Run]\n"
            'Filename: "{app}\\{#MyAppExeName}"; Description: "Iniciar {#MyAppName}"; Flags: nowait postinstall skipifsilent\n'
        ),
        encoding="utf-8",
    )

    logs: list[str] = []

    # 3. Ensure PyInstaller (and pywebview if native) are installed
    needed: list[str] = []
    check_pyi = subprocess.run([sys.executable, "-c", "import PyInstaller"], capture_output=True)
    if check_pyi.returncode != 0:
        needed.append("pyinstaller")
    if req.nativeWindow:
        check_wv = subprocess.run([sys.executable, "-c", "import webview"], capture_output=True)
        if check_wv.returncode != 0:
            needed.append("pywebview")

    if needed:
        logs.append(f"[Quantum-RAD Studio] Instalando dependencias de empaquetado: {', '.join(needed)}...")
        inst = subprocess.run(
            [sys.executable, "-m", "pip", "install", *needed],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=240,
        )
        logs.append(inst.stdout)
        if inst.returncode != 0:
            return {
                "ok": False,
                "stdout": "\n".join(logs),
                "stderr": inst.stderr,
                "distDir": str(pdir / "dist"),
                "issPath": str(iss_path),
                "exePath": None,
            }

    # 4. Run PyInstaller with NiceGUI assets bundled
    sep = ";" if os.name == "nt" else ":"
    nicegui_dir = Path(ui.__file__).resolve().parent
    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",
        "--name",
        safe_app,
        "--add-data",
        f"{nicegui_dir}{sep}nicegui",
        "--add-data",
        f"{pdir / 'forms'}{sep}forms",
        "--hidden-import",
        "sqlalchemy.dialects.sqlite",
    ]
    if req.oneFile:
        cmd.append("--onefile")
    if req.windowed:
        cmd.append("--windowed")
    if req.includeData and (pdir / "data").exists():
        cmd.extend(["--add-data", f"{pdir / 'data'}{sep}data"])

    cmd.append(str(entry_file))

    logs.append(f"[Quantum-RAD Studio] Ejecutando: {' '.join(cmd)}")
    proc = subprocess.run(
        cmd,
        cwd=str(pdir),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=300,
    )
    logs.append(proc.stdout)

    dist_dir = pdir / "dist"
    exe_path = dist_dir / f"{safe_app}.exe" if req.oneFile else dist_dir / safe_app / f"{safe_app}.exe"

    return {
        "ok": proc.returncode == 0,
        "stdout": "\n".join(logs),
        "stderr": proc.stderr,
        "distDir": str(dist_dir),
        "issPath": str(iss_path),
        "exePath": str(exe_path) if exe_path.exists() else None,
    }


@router.post("/package/open-folder")
def open_output_folder(req: OpenFolderRequest) -> dict[str, str]:
    target = Path(req.folderPath)
    if not target.exists():
        raise HTTPException(status_code=404, detail="La carpeta no existe todavía.")
    if os.name == "nt":
        os.startfile(str(target))  # type: ignore[attr-defined]
    return {"status": "opened", "path": str(target)}
