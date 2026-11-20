from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, Field


class WidgetBinding(BaseModel):
    id: str
    property: str  # visibility | enabled | value | text | source | content | icon
    mode: Literal["from_control", "two_way", "storage_user"] = "from_control"
    sourceControl: str = ""
    sourceProperty: str = "value"
    storageKey: str = ""
    transform: str = ""


class WidgetNode(BaseModel):
    """Recursive node representing a NiceGUI widget in the visual designer IR."""

    id: str
    type: str
    name: str
    props: dict[str, Any] = Field(default_factory=dict)
    classes: str = ""
    style: str = ""
    quasarProps: str = ""
    events: dict[str, str] = Field(default_factory=dict)
    bindings: list[WidgetBinding] = Field(default_factory=list)
    children: list[WidgetNode] = Field(default_factory=list)


WidgetNode.model_rebuild()


class FormSettings(BaseModel):
    title: str = "My NiceGUI Form"
    route: str = "/"
    dark: bool | None = None
    rootClasses: str = "w-full max-w-4xl mx-auto p-6 gap-4"
    pageBackground: str = ""
    pageBackgroundImage: str = ""


class FormDocument(BaseModel):
    """Root IR document saved as *.ngui.json."""

    schemaVersion: str = "1.0"
    formName: str = "MainForm"
    settings: FormSettings = Field(default_factory=FormSettings)
    root: WidgetNode


class ProjectConfig(BaseModel):
    name: str
    entryPoint: str = "main.py"
    port: int = 8085
    createdAt: str = ""


class ProjectSummary(BaseModel):
    name: str
    path: str
    entryPoint: str
    port: int


class CreateProjectRequest(BaseModel):
    name: str


class CreateFormRequest(BaseModel):
    formName: str
    route: str = "/"
    title: str | None = None
    template: str = "blank"
    tableName: str | None = None
    gridType: Literal["aggrid", "table"] = "aggrid"


class CreateFileRequest(BaseModel):
    relativePath: str
    content: str = ""


class SaveFileRequest(BaseModel):
    relativePath: str
    content: str


class FileTreeItem(BaseModel):
    name: str
    path: str  # relative posix path inside project
    type: Literal["file", "directory"]
    kind: Literal["form", "designer", "python", "json", "other"] = "other"
    children: list[FileTreeItem] | None = None


FileTreeItem.model_rebuild()


class SaveFormRequest(BaseModel):
    relativePath: str
    document: FormDocument


class SaveFormResponse(BaseModel):
    formPath: str
    designerPath: str
    codeBehindPath: str
    generatedCode: str


class EnsureEventRequest(BaseModel):
    codeBehindPath: str
    formName: str
    handlerName: str
    eventName: str = "on_click"


class EnsureEventResponse(BaseModel):
    codeBehindPath: str
    handlerName: str
    lineNumber: int
    created: bool
    content: str


class RunRequest(BaseModel):
    projectName: str
    port: int | None = None
    entryFile: str | None = None
    route: str | None = None
    hotReload: bool = True


class RunTargetItem(BaseModel):
    id: str
    label: str
    kind: Literal["project", "form", "script"]
    entryFile: str
    route: str = "/"
    formPath: str | None = None


class RunnerStatus(BaseModel):
    running: bool
    projectName: str | None = None
    pid: int | None = None
    port: int | None = None
    entryFile: str | None = None
    route: str | None = None
    url: str | None = None


class ForeignKeyRef(BaseModel):
    referredTable: str
    referredColumn: str


class ColumnSchema(BaseModel):
    name: str
    sqlType: str
    widgetType: str
    nullable: bool = True
    primaryKey: bool = False
    autoincrement: bool = False
    foreignKey: ForeignKeyRef | None = None


class TableSchema(BaseModel):
    name: str
    primaryKey: str | None = None
    columns: list[ColumnSchema] = Field(default_factory=list)


class DatabaseStateResponse(BaseModel):
    connectionUrl: str | None = None
    connected: bool = False
    error: str | None = None
    tables: list[TableSchema] = Field(default_factory=list)


class ConnectDatabaseRequest(BaseModel):
    connectionUrl: str


class GenerateCrudRequest(BaseModel):
    tableName: str
    gridType: Literal["aggrid", "table"] = "aggrid"
    formName: str | None = None
    route: str | None = None


class GenerateCrudResponse(BaseModel):
    formPath: str
    designerPath: str
    codeBehindPath: str
    dbModulePath: str
    route: str


class CreateSqliteDbRequest(BaseModel):
    fileName: str = "app.db"
    withSampleTables: bool = False


class ColumnDefinitionInput(BaseModel):
    name: str
    sqlType: str = "VARCHAR(120)"
    nullable: bool = True
    primaryKey: bool = False
    autoincrement: bool = False
    defaultValue: str | None = None
    foreignKey: ForeignKeyRef | None = None


class CreateTableRequest(BaseModel):
    tableName: str
    columns: list[ColumnDefinitionInput]


class AddColumnRequest(BaseModel):
    column: ColumnDefinitionInput


class TableRowsResponse(BaseModel):
    tableName: str
    columns: list[str]
    rows: list[dict[str, Any]]
