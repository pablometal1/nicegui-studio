from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.models.schemas import CreateFileRequest, SaveFileRequest
from app.services.project_service import ProjectService

router = APIRouter(prefix="/api/projects/{project_name}/files", tags=["files"])
project_service = ProjectService()


class RenameFileRequest(BaseModel):
    oldPath: str
    newPath: str


class CreateFolderRequest(BaseModel):
    relativePath: str


@router.get("")
def read_file(project_name: str, path: str = Query(...)) -> dict[str, str]:
    try:
        content = project_service.read_file(project_name, path)
        return {"path": path, "content": content}
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("")
def save_file(project_name: str, req: SaveFileRequest) -> dict[str, str]:
    try:
        project_service.write_file(project_name, req.relativePath, req.content)
        return {"status": "saved", "path": req.relativePath}
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("")
def create_file(project_name: str, req: CreateFileRequest) -> dict[str, str]:
    try:
        project_service.write_file(project_name, req.relativePath, req.content)
        return {"status": "created", "path": req.relativePath}
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("")
def delete_file(project_name: str, path: str = Query(...)) -> dict[str, str]:
    try:
        project_service.delete_file(project_name, path)
        return {"status": "deleted", "path": path}
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/rename")
def rename_file(project_name: str, req: RenameFileRequest) -> dict[str, str]:
    try:
        project_service.rename_file(project_name, req.oldPath, req.newPath)
        return {"status": "renamed", "oldPath": req.oldPath, "newPath": req.newPath}
    except (FileNotFoundError, FileExistsError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/folder")
def create_folder(project_name: str, req: CreateFolderRequest) -> dict[str, str]:
    try:
        project_service.create_folder(project_name, req.relativePath)
        return {"status": "created", "path": req.relativePath}
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
