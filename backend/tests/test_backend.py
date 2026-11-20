from __future__ import annotations

import ast
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import FormDocument, FormSettings, WidgetNode
from app.services.codegen_service import generate_designer_code, generate_initial_code_behind
from app.services.patcher_service import ensure_event_handler
from app.services.project_service import ProjectService


def test_codegen_produces_valid_python_with_nested_containers() -> None:
    doc = FormDocument(
        formName="UserProfile",
        settings=FormSettings(title="Profile", route="/profile", dark=True),
        root=WidgetNode(
            id="root",
            type="column",
            name="root",
            classes="p-4 gap-4",
            children=[
                WidgetNode(
                    id="c1",
                    type="card",
                    name="card_main",
                    classes="w-full",
                    children=[
                        WidgetNode(
                            id="r1",
                            type="row",
                            name="row_top",
                            children=[
                                WidgetNode(
                                    id="i1",
                                    type="input",
                                    name="inp_email",
                                    props={"label": "Email", "placeholder": "a@b.com"},
                                ),
                                WidgetNode(
                                    id="b1",
                                    type="button",
                                    name="btn_save",
                                    props={"text": "Save", "color": "primary"},
                                    events={"on_click": "on_btn_save_click"},
                                ),
                            ],
                        )
                    ],
                )
            ],
        ),
    )

    code = generate_designer_code(doc)
    parsed = ast.parse(code)
    assert any(
        isinstance(n, ast.ClassDef) and n.name == "UserProfileDesigner" for n in parsed.body
    )
    assert "with self.card_main:" in code
    assert "with self.row_top:" in code
    assert "on_click=self.on_btn_save_click" in code
    assert "def on_btn_save_click(self, e=None) -> None:" in code


def test_patcher_injects_and_reuses_event_handler() -> None:
    src = generate_initial_code_behind("LoginForm", route="/login")
    r1 = ensure_event_handler(src, "LoginForm", "on_btn_login_click", "on_click")
    assert r1.created is True
    assert "def on_btn_login_click(self, e=None) -> None:" in r1.content
    ast.parse(r1.content)

    # Second call should NOT duplicate the method and should return the same line number
    r2 = ensure_event_handler(r1.content, "LoginForm", "on_btn_login_click", "on_click")
    assert r2.created is False
    assert r2.line_number == r1.line_number
    assert r2.content == r1.content


def test_project_service_lifecycle(tmp_path: Path) -> None:
    svc = ProjectService(projects_dir=tmp_path)
    proj = svc.create_project("test_proj", with_demo_content=True)
    assert proj.name == "test_proj"
    tree = svc.get_file_tree("test_proj")
    assert any(item.name == "main.py" for item in tree)

    created = svc.create_form("test_proj", "SettingsForm", route="/settings")
    assert created["formPath"] == "forms/settings_form.ngui.json"
    doc = svc.load_form("test_proj", created["formPath"])
    assert doc.formName == "SettingsForm"


def test_health_endpoint() -> None:
    client = TestClient(app)
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_codegen_supports_all_52_nicegui_widgets() -> None:
    all_types = [
        "column", "row", "card", "grid", "expansion", "scroll_area", "dialog",
        "header", "footer", "left_drawer", "right_drawer", "dropdown_button",
        "label", "button", "icon", "badge", "chip", "link", "avatar", "markdown",
        "html", "code", "separator", "space", "input", "textarea", "number",
        "select", "radio", "toggle", "checkbox", "switch", "slider", "range",
        "knob", "date", "time", "color_input", "upload", "editor", "table",
        "aggrid", "tree", "json_editor", "log", "echart", "linear_progress",
        "circular_progress", "spinner", "image", "audio", "video", "carousel",
        "pagination", "timeline", "chat_message",
    ]
    children = [
        WidgetNode(id=f"n_{i}", type=t, name=f"w_{t}")
        for i, t in enumerate(all_types)
    ]
    doc = FormDocument(
        formName="AllWidgetsForm",
        root=WidgetNode(id="root", type="column", name="root", children=children),
    )
    code = generate_designer_code(doc)
    ast.parse(code)
    for t in all_types:
        assert f"ui.{t}(" in code


def test_rad_database_introspection_and_crud_generation(tmp_path: Path) -> None:
    from app.services.crud_generator_service import generate_crud_for_table
    from app.services.database_service import create_sample_sqlite

    svc = ProjectService(projects_dir=tmp_path)
    svc.create_project("rad_proj")
    pdir = svc.get_project_dir("rad_proj")

    state = create_sample_sqlite(pdir)
    assert state.connected is True
    table_names = {t.name for t in state.tables}
    assert {"categorias", "productos", "clientes"}.issubset(table_names)

    prod_table = next(t for t in state.tables if t.name == "productos")
    cat_fk = next(c for c in prod_table.columns if c.name == "categoria_id")
    assert cat_fk.foreignKey is not None
    assert cat_fk.foreignKey.referredTable == "categorias"
    assert cat_fk.widgetType == "select"

    res = generate_crud_for_table(pdir, "productos", grid_type="aggrid")
    assert res.route == "/productos"
    # Verify all generated Python files parse cleanly
    for rel in (res.dbModulePath, res.designerPath, res.codeBehindPath):
        ast.parse((pdir / rel).read_text(encoding="utf-8"))


def test_visual_sqlite_creation_tables_columns_and_relations(tmp_path: Path) -> None:
    from app.models.schemas import ColumnDefinitionInput, ForeignKeyRef
    from app.services.database_service import (
        add_column_to_table,
        create_sqlite_database,
        create_table_in_db,
        drop_table_from_db,
    )

    svc = ProjectService(projects_dir=tmp_path)
    svc.create_project("schema_proj")
    pdir = svc.get_project_dir("schema_proj")

    st1 = create_sqlite_database(pdir, file_name="inventario.db", with_sample_tables=False)
    assert st1.connected is True
    assert (pdir / "data" / "inventario.db").exists()

    st2 = create_table_in_db(
        pdir,
        "marcas",
        [
            ColumnDefinitionInput(name="id", sqlType="INTEGER", primaryKey=True, autoincrement=True, nullable=False),
            ColumnDefinitionInput(name="nombre", sqlType="VARCHAR(100)", nullable=False),
        ],
    )
    assert any(t.name == "marcas" for t in st2.tables)

    st3 = create_table_in_db(
        pdir,
        "equipos",
        [
            ColumnDefinitionInput(name="id", sqlType="INTEGER", primaryKey=True, autoincrement=True, nullable=False),
            ColumnDefinitionInput(name="modelo", sqlType="VARCHAR(120)", nullable=False),
            ColumnDefinitionInput(
                name="marca_id",
                sqlType="INTEGER",
                foreignKey=ForeignKeyRef(referredTable="marcas", referredColumn="id"),
            ),
        ],
    )
    eq_tbl = next(t for t in st3.tables if t.name == "equipos")
    fk_col = next(c for c in eq_tbl.columns if c.name == "marca_id")
    assert fk_col.foreignKey is not None
    assert fk_col.foreignKey.referredTable == "marcas"

    st4 = add_column_to_table(
        pdir,
        "equipos",
        ColumnDefinitionInput(name="precio", sqlType="REAL", nullable=False),
    )
    eq_tbl2 = next(t for t in st4.tables if t.name == "equipos")
    assert any(c.name == "precio" for c in eq_tbl2.columns)

    st5 = drop_table_from_db(pdir, "equipos")
    assert not any(t.name == "equipos" for t in st5.tables)


def test_all_form_templates_generate_valid_python(tmp_path: Path) -> None:
    from app.services.form_templates import FORM_TEMPLATE_CATALOG

    svc = ProjectService(projects_dir=tmp_path)
    svc.create_project("tpl_proj")
    pdir = svc.get_project_dir("tpl_proj")

    for item in FORM_TEMPLATE_CATALOG:
        tid = item["id"]
        res = svc.create_form(
            project_name="tpl_proj",
            form_name=f"Form_{tid}",
            route=f"/{tid}",
            template=tid,
        )
        ast.parse((pdir / res["designerPath"]).read_text(encoding="utf-8"))
        ast.parse((pdir / res["codeBehindPath"]).read_text(encoding="utf-8"))


def test_table_and_aggrid_auto_db_binding_codegen() -> None:
    doc = FormDocument(
        formName="BoundForm",
        root=WidgetNode(
            id="root",
            type="column",
            name="root",
            children=[
                WidgetNode(
                    id="t1",
                    type="table",
                    name="tbl_items",
                    props={"dataSourceTable": "productos"},
                ),
                WidgetNode(
                    id="g1",
                    type="aggrid",
                    name="grid_items",
                    props={"dataSourceTable": "categorias"},
                ),
            ],
        ),
    )
    code = generate_designer_code(doc)
    ast.parse(code)
    assert "from data.db import db" in code
    assert "self.tbl_items.rows = db.fetch_all('productos')" in code
    assert "self.grid_items.options['rowData'] = db.fetch_all('categorias')" in code


def test_button_quick_navigation_and_dialog_actions() -> None:
    doc = FormDocument(
        formName="NavForm",
        root=WidgetNode(
            id="root",
            type="column",
            name="root",
            children=[
                WidgetNode(
                    id="b1",
                    type="button",
                    name="btn_go",
                    props={"text": "Ir", "actionType": "navigate", "actionTarget": "/productos"},
                ),
                WidgetNode(
                    id="b2",
                    type="button",
                    name="btn_tab",
                    props={"text": "Pestaña", "actionType": "navigate_new_tab", "actionTarget": "/clientes"},
                ),
                WidgetNode(
                    id="b3",
                    type="button",
                    name="btn_dlg",
                    props={"text": "Modal", "actionType": "open_dialog", "actionTarget": "dlg_info"},
                ),
                WidgetNode(
                    id="b4",
                    type="button",
                    name="btn_back",
                    props={"text": "Atrás", "actionType": "navigate_back"},
                ),
            ],
        ),
    )
    code = generate_designer_code(doc)
    ast.parse(code)
    assert "on_click=lambda: ui.navigate.to('/productos')" in code
    assert "on_click=lambda: ui.navigate.to('/clientes', new_tab=True)" in code
    assert "on_click=lambda: self.dlg_info.open()" in code
    assert "on_click=ui.navigate.back" in code


def test_select_echart_binding_and_master_menu(tmp_path: Path) -> None:
    doc = FormDocument(
        formName="AnalyticsForm",
        root=WidgetNode(
            id="root",
            type="column",
            name="root",
            children=[
                WidgetNode(
                    id="s1",
                    type="select",
                    name="sel_cat",
                    props={
                        "dataSourceTable": "categorias",
                        "dataSourceValueCol": "id",
                        "dataSourceLabelCol": "nombre",
                    },
                ),
                WidgetNode(
                    id="c1",
                    type="echart",
                    name="chart_sales",
                    props={
                        "dataSourceTable": "productos",
                        "dataSourceXCol": "nombre",
                        "dataSourceYCol": "precio",
                        "dataSourceChartType": "bar",
                    },
                ),
            ],
        ),
    )
    code = generate_designer_code(doc)
    ast.parse(code)
    assert "from data.db import db" in code
    assert "db.fetch_all('categorias')" in code
    assert "db.fetch_all('productos')" in code

    svc = ProjectService(projects_dir=tmp_path)
    svc.create_project("menu_proj")
    pdir = svc.get_project_dir("menu_proj")
    res = svc.generate_master_menu("menu_proj", route="/menu")
    assert res["route"] == "/menu"
    ast.parse((pdir / res["designerPath"]).read_text(encoding="utf-8"))
    ast.parse((pdir / res["codeBehindPath"]).read_text(encoding="utf-8"))


def test_reactive_binding_properties_codegen() -> None:
    from app.models.schemas import WidgetBinding

    doc = FormDocument(
        formName="ReactiveForm",
        root=WidgetNode(
            id="root",
            type="column",
            name="root",
            children=[
                WidgetNode(
                    id="lbl1",
                    type="label",
                    name="lbl_total",
                    props={"text": "0"},
                    bindings=[
                        WidgetBinding(
                            id="b1",
                            property="text",
                            mode="from_control",
                            sourceControl="sld_1",
                            sourceProperty="value",
                            transform="f'Total: {v}'",
                        )
                    ],
                ),
                WidgetNode(
                    id="sld1",
                    type="slider",
                    name="sld_1",
                    bindings=[
                        WidgetBinding(
                            id="b2",
                            property="value",
                            mode="storage_user",
                            storageKey="saved_slider",
                        )
                    ],
                ),
                WidgetNode(
                    id="num1",
                    type="number",
                    name="num_1",
                    bindings=[
                        WidgetBinding(
                            id="b3",
                            property="value",
                            mode="two_way",
                            sourceControl="sld_1",
                            sourceProperty="value",
                        )
                    ],
                ),
            ],
        ),
    )
    code = generate_designer_code(doc)
    ast.parse(code)
    assert "from nicegui import app, ui" in code
    assert "self.lbl_total.bind_text_from(self.sld_1, 'value', backward=lambda v: f'Total: {v}')" in code
    assert "self.sld_1.bind_value(app.storage.user, 'saved_slider')" in code
    assert "self.num_1.bind_value(self.sld_1, 'value')" in code


def test_widget_methods_introspection_endpoint() -> None:
    client = TestClient(app)
    r1 = client.get("/api/tools/widget-methods/leaflet")
    assert r1.status_code == 200
    names = {m["name"] for m in r1.json()}
    assert "marker" in names
    assert "set_center" in names

    r2 = client.get("/api/tools/widget-methods/aggrid")
    assert r2.status_code == 200
    ag_methods = {m["name"]: m for m in r2.json()}
    assert "get_selected_row" in ag_methods
    assert ag_methods["get_selected_row"]["isAsync"] is True









