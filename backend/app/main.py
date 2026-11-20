from __future__ import annotations

import asyncio
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.routers import database, designer, files, projects, runner, tools
from app.services.runner_service import runner_service


@asynccontextmanager
async def lifespan(_app: FastAPI):
    runner_service.set_loop(asyncio.get_running_loop())
    yield
    await runner_service.stop()


app = FastAPI(
    title="NiceGUI Studio Backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(files.router)
app.include_router(designer.router)
app.include_router(database.router)
app.include_router(runner.router)
app.include_router(tools.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "nicegui-studio"}


def _find_frontend_dist() -> Path | None:
    candidates: list[Path] = []
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        candidates.append(Path(getattr(sys, "_MEIPASS")) / "frontend_dist")
    root = Path(__file__).resolve().parents[2]
    candidates.append(root / "frontend" / "dist")
    candidates.append(Path(__file__).resolve().parent / "static")
    for c in candidates:
        if (c / "index.html").exists():
            return c
    return None


_FRONTEND_DIST = _find_frontend_dist()
if _FRONTEND_DIST is not None:
    _assets_dir = _FRONTEND_DIST / "assets"
    if _assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(_assets_dir)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("ws/"):
            return {"detail": "Not Found"}
        candidate = _FRONTEND_DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(_FRONTEND_DIST / "index.html"))
