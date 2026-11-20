from __future__ import annotations

import asyncio
import os
import subprocess
import sys
import threading
from collections import deque
from pathlib import Path
from typing import Any

from fastapi import WebSocket

from app.models.schemas import RunnerStatus


class RunnerService:
    """Manages running a user's NiceGUI app subprocess and streaming logs to WebSockets."""

    def __init__(self) -> None:
        self._process: subprocess.Popen[str] | None = None
        self._project_name: str | None = None
        self._project_dir: Path | None = None
        self._port: int | None = None
        self._entry_file: str | None = None
        self._route: str | None = None
        self._logs: deque[dict[str, Any]] = deque(maxlen=500)
        self._clients: set[WebSocket] = set()
        self._loop: asyncio.AbstractEventLoop | None = None

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    def status(self) -> RunnerStatus:
        running = self._process is not None and self._process.poll() is None
        if not running and self._process is not None:
            self._process = None
        route_clean = (self._route or "/").strip()
        if not route_clean.startswith("/"):
            route_clean = f"/{route_clean}"
        base_url = f"http://127.0.0.1:{self._port}" if running and self._port else None
        full_url = (
            f"{base_url}{'' if route_clean == '/' else route_clean}" if base_url else None
        )
        return RunnerStatus(
            running=running,
            projectName=self._project_name if running else None,
            pid=self._process.pid if running and self._process else None,
            port=self._port if running else None,
            entryFile=self._entry_file if running else None,
            route=route_clean if running else None,
            url=full_url,
        )

    def _emit_sync(self, payload: dict[str, Any]) -> None:
        self._logs.append(payload)
        if self._loop and self._loop.is_running():
            asyncio.run_coroutine_threadsafe(self._broadcast(payload), self._loop)

    async def _broadcast(self, payload: dict[str, Any]) -> None:
        dead: list[WebSocket] = []
        for ws in list(self._clients):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._clients.discard(ws)

    async def register_client(self, ws: WebSocket) -> None:
        await ws.accept()
        self._clients.add(ws)
        for item in list(self._logs):
            await ws.send_json(item)
        await ws.send_json({"type": "status", "status": self.status().model_dump()})

    def unregister_client(self, ws: WebSocket) -> None:
        self._clients.discard(ws)

    async def start(
        self,
        project_name: str,
        project_dir: Path,
        port: int = 8085,
        entry_file: str | None = None,
        route: str | None = None,
        hot_reload: bool = True,
    ) -> RunnerStatus:
        await self.stop()
        self._free_port(port)
        self._logs.clear()

        rel_entry = (entry_file or "main.py").replace("\\", "/").lstrip("/")
        entry = (project_dir / rel_entry).resolve()
        pdir_resolved = project_dir.resolve()
        if entry != pdir_resolved and pdir_resolved not in entry.parents:
            raise ValueError("Entry file escapes project directory.")
        if not entry.exists():
            raise FileNotFoundError(f"Entry point '{rel_entry}' not found.")

        clean_route = (route or "/").strip()
        if not clean_route.startswith("/"):
            clean_route = f"/{clean_route}"

        env = os.environ.copy()
        env["NICEGUI_PORT"] = str(port)
        # IDE manages hot-reload cleanly on save instead of uvicorn's Windows console reloader
        env["NICEGUI_RELOAD"] = "0"
        env["PYTHONUNBUFFERED"] = "1"
        env["PYTHONIOENCODING"] = "utf-8"
        env["PYTHONPATH"] = str(pdir_resolved)

        self._project_name = project_name
        self._project_dir = pdir_resolved
        self._port = port
        self._entry_file = rel_entry
        self._route = clean_route
        route_display = "" if clean_route == "/" else clean_route
        mode_tag = " [Hot Reload ON]" if hot_reload else ""
        self._emit_sync(
            {
                "type": "log",
                "stream": "system",
                "text": f"[Quantum-RAD Studio] Starting {project_name}/{rel_entry}{mode_tag} -> http://127.0.0.1:{port}{route_display} ...",
            }
        )

        popen_kwargs: dict[str, Any] = {}
        if os.name == "nt":
            popen_kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP

        self._process = subprocess.Popen(
            [sys.executable, "-u", str(entry)],
            cwd=str(project_dir),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
            **popen_kwargs,
        )

        proc = self._process

        def pump(stream: Any, stream_name: str) -> None:
            if stream is None:
                return
            for line in iter(stream.readline, ""):
                cleaned = line.rstrip("\r\n")
                if cleaned:
                    self._emit_sync({"type": "log", "stream": stream_name, "text": cleaned})
            stream.close()

        def watch_exit() -> None:
            code = proc.wait()
            self._emit_sync(
                {
                    "type": "log",
                    "stream": "system",
                    "text": f"[Quantum-RAD Studio] Process exited with code {code}.",
                }
            )
            self._emit_sync({"type": "status", "status": self.status().model_dump()})

        threading.Thread(target=pump, args=(proc.stdout, "stdout"), daemon=True).start()
        threading.Thread(target=pump, args=(proc.stderr, "stderr"), daemon=True).start()
        threading.Thread(target=watch_exit, daemon=True).start()

        st = self.status()
        await self._broadcast({"type": "status", "status": st.model_dump()})
        return st

    async def restart(self) -> RunnerStatus:
        if not self._project_name or not self._project_dir:
            return self.status()
        self._emit_sync(
            {
                "type": "log",
                "stream": "system",
                "text": "[Quantum-RAD Studio] Hot Reload ⚡ reiniciando aplicación con los últimos cambios...",
            }
        )
        return await self.start(
            project_name=self._project_name,
            project_dir=self._project_dir,
            port=self._port or 8085,
            entry_file=self._entry_file,
            route=self._route,
            hot_reload=True,
        )

    async def stop(self) -> RunnerStatus:
        proc = self._process
        self._process = None
        if proc is not None and proc.poll() is None:
            self._emit_sync(
                {"type": "log", "stream": "system", "text": "[Quantum-RAD Studio] Stopping process..."}
            )
            pid = proc.pid
            if os.name == "nt":
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", str(pid)],
                    capture_output=True,
                )
            else:
                proc.terminate()
            try:
                proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                proc.kill()
        st = self.status()
        await self._broadcast({"type": "status", "status": st.model_dump()})
        return st

    def _free_port(self, port: int) -> None:
        """Best-effort cleanup of any orphaned listener holding the target app port."""
        if os.name != "nt":
            return
        try:
            res = subprocess.run(
                ["netstat", "-ano", "-p", "TCP"],
                capture_output=True,
                text=True,
                timeout=3,
            )
            my_pid = os.getpid()
            pids: set[int] = set()
            needle = f":{port}"
            for line in res.stdout.splitlines():
                parts = line.split()
                if len(parts) >= 5 and parts[3].upper() == "LISTENING":
                    local_addr = parts[1]
                    if local_addr.endswith(needle):
                        try:
                            pid = int(parts[4])
                            if pid > 0 and pid != my_pid:
                                pids.add(pid)
                        except ValueError:
                            pass
            for pid in pids:
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", str(pid)],
                    capture_output=True,
                    timeout=3,
                )
        except Exception:
            pass


runner_service = RunnerService()
