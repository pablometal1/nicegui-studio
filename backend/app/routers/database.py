from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    AddColumnRequest,
    ConnectDatabaseRequest,
    CreateSqliteDbRequest,
    CreateTableRequest,
    DatabaseStateResponse,
    GenerateCrudRequest,
    GenerateCrudResponse,
    TableRowsResponse,
)
from app.services.crud_generator_service import generate_crud_for_table
from app.services.database_service import (
    add_column_to_table,
    create_sample_sqlite,
    create_sqlite_database,
    create_table_in_db,
    drop_table_from_db,
    get_database_state,
    get_table_rows,
    introspect_database,
    save_connection_url,
)
from app.services.project_service import ProjectService

router = APIRouter(prefix="/api/projects/{project_name}/database", tags=["database"])
project_service = ProjectService()


@router.get("", response_model=DatabaseStateResponse)
def get_db_state(project_name: str) -> DatabaseStateResponse:
    try:
        pdir = project_service.get_project_dir(project_name)
        return get_database_state(pdir)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/connect", response_model=DatabaseStateResponse)
def connect_db(project_name: str, req: ConnectDatabaseRequest) -> DatabaseStateResponse:
    try:
        pdir = project_service.get_project_dir(project_name)
        state = introspect_database(req.connectionUrl, pdir)
        if state.connected:
            save_connection_url(pdir, req.connectionUrl)
        return state
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/sample", response_model=DatabaseStateResponse)
def create_sample_db(project_name: str) -> DatabaseStateResponse:
    try:
        pdir = project_service.get_project_dir(project_name)
        return create_sample_sqlite(pdir)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/create-sqlite", response_model=DatabaseStateResponse)
def create_sqlite_db(project_name: str, req: CreateSqliteDbRequest) -> DatabaseStateResponse:
    try:
        pdir = project_service.get_project_dir(project_name)
        return create_sqlite_database(
            pdir, file_name=req.fileName, with_sample_tables=req.withSampleTables
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/tables", response_model=DatabaseStateResponse)
def create_table(project_name: str, req: CreateTableRequest) -> DatabaseStateResponse:
    try:
        pdir = project_service.get_project_dir(project_name)
        return create_table_in_db(pdir, req.tableName, req.columns)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/tables/{table_name}/columns", response_model=DatabaseStateResponse)
def add_column(
    project_name: str, table_name: str, req: AddColumnRequest
) -> DatabaseStateResponse:
    try:
        pdir = project_service.get_project_dir(project_name)
        return add_column_to_table(pdir, table_name, req.column)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/tables/{table_name}", response_model=DatabaseStateResponse)
def drop_table(project_name: str, table_name: str) -> DatabaseStateResponse:
    try:
        pdir = project_service.get_project_dir(project_name)
        return drop_table_from_db(pdir, table_name)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/tables/{table_name}/rows", response_model=TableRowsResponse)
def read_table_rows(project_name: str, table_name: str, limit: int = 100) -> TableRowsResponse:
    try:
        pdir = project_service.get_project_dir(project_name)
        return get_table_rows(pdir, table_name, limit=limit)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/generate-crud", response_model=GenerateCrudResponse)
def generate_crud(project_name: str, req: GenerateCrudRequest) -> GenerateCrudResponse:
    try:
        pdir = project_service.get_project_dir(project_name)
        return generate_crud_for_table(
            project_dir=pdir,
            table_name=req.tableName,
            grid_type=req.gridType,
            form_name=req.formName,
            route=req.route,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
