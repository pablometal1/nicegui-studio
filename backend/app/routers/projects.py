from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    CreateFormRequest,
    CreateProjectRequest,
    FileTreeItem,
    ProjectSummary,
    RunTargetItem,
)
from app.services.form_templates import FORM_TEMPLATE_CATALOG
from app.services.project_service import ProjectService

router = APIRouter(prefix="/api/projects", tags=["projects"])
project_service = ProjectService()


@router.get("/form-templates")
def list_form_templates() -> list[dict[str, str]]:
    return FORM_TEMPLATE_CATALOG


@router.get("", response_model=list[ProjectSummary])
def list_projects() -> list[ProjectSummary]:
    return project_service.list_projects()


@router.post("", response_model=ProjectSummary)
def create_project(req: CreateProjectRequest) -> ProjectSummary:
    try:
        return project_service.create_project(req.name)
    except FileExistsError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{project_name}/tree", response_model=list[FileTreeItem])
def get_project_tree(project_name: str) -> list[FileTreeItem]:
    try:
        return project_service.get_file_tree(project_name)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{project_name}/run-targets", response_model=list[RunTargetItem])
def get_run_targets(project_name: str) -> list[RunTargetItem]:
    try:
        return project_service.list_run_targets(project_name)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{project_name}/forms")
def create_form(project_name: str, req: CreateFormRequest) -> dict[str, str]:
    try:
        return project_service.create_form(
            project_name=project_name,
            form_name=req.formName,
            route=req.route,
            title=req.title,
            template=req.template,
            table_name=req.tableName,
            grid_type=req.gridType,
        )
    except FileExistsError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{project_name}/generate-menu")
def generate_menu(project_name: str, route: str = "/menu") -> dict[str, str]:
    try:
        return project_service.generate_master_menu(project_name, route=route)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
