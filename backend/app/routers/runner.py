from __future__ import annotations

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from app.models.schemas import RunRequest, RunnerStatus
from app.services.project_service import ProjectService
from app.services.runner_service import runner_service

router = APIRouter(tags=["runner"])
project_service = ProjectService()


@router.get("/api/runner/status", response_model=RunnerStatus)
def get_status() -> RunnerStatus:
    return runner_service.status()


@router.post("/api/runner/start", response_model=RunnerStatus)
async def start_project(req: RunRequest) -> RunnerStatus:
    try:
        pdir = project_service.get_project_dir(req.projectName)
        port = req.port or 8085
        return await runner_service.start(
            req.projectName,
            pdir,
            port=port,
            entry_file=req.entryFile,
            route=req.route,
            hot_reload=req.hotReload,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/api/runner/stop", response_model=RunnerStatus)
async def stop_project() -> RunnerStatus:
    return await runner_service.stop()


@router.post("/api/runner/restart", response_model=RunnerStatus)
async def restart_project() -> RunnerStatus:
    return await runner_service.restart()


@router.websocket("/ws/runner")
async def runner_ws(ws: WebSocket) -> None:
    await runner_service.register_client(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        runner_service.unregister_client(ws)
    except Exception:
        runner_service.unregister_client(ws)
