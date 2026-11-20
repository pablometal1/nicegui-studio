from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import (
    EnsureEventRequest,
    EnsureEventResponse,
    FormDocument,
    SaveFormRequest,
    SaveFormResponse,
)
from app.services.codegen_service import generate_designer_code
from app.services.patcher_service import ensure_event_handler
from app.services.project_service import ProjectService

router = APIRouter(prefix="/api/projects/{project_name}/designer", tags=["designer"])
project_service = ProjectService()


@router.get("/form", response_model=FormDocument)
def load_form(project_name: str, path: str = Query(...)) -> FormDocument:
    try:
        return project_service.load_form(project_name, path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/form", response_model=SaveFormResponse)
def save_form(project_name: str, req: SaveFormRequest) -> SaveFormResponse:
    try:
        form_path, designer_path, code_behind_path, generated = project_service.save_form(
            project_name, req.relativePath, req.document
        )
        return SaveFormResponse(
            formPath=form_path,
            designerPath=designer_path,
            codeBehindPath=code_behind_path,
            generatedCode=generated,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/preview-code")
def preview_code(project_name: str, doc: FormDocument) -> dict[str, str]:
    _ = project_name
    return {"code": generate_designer_code(doc)}


@router.post("/ensure-event", response_model=EnsureEventResponse)
def ensure_event(project_name: str, req: EnsureEventRequest) -> EnsureEventResponse:
    try:
        source = project_service.read_file(project_name, req.codeBehindPath)
        result = ensure_event_handler(
            source=source,
            form_name=req.formName,
            handler_name=req.handlerName,
            event_name=req.eventName,
        )
        if result.created:
            project_service.write_file(project_name, req.codeBehindPath, result.content)
        return EnsureEventResponse(
            codeBehindPath=req.codeBehindPath,
            handlerName=result.handler_name,
            lineNumber=result.line_number,
            created=result.created,
            content=result.content,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
