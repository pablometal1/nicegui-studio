from __future__ import annotations

from app.models.schemas import FormDocument, FormSettings, WidgetNode
from app.services.codegen_service import (
    generate_initial_code_behind,
    to_pascal_case,
    to_snake_case,
)

FORM_TEMPLATE_CATALOG = [
    {
        "id": "standard",
        "name": "Formulario Común",
        "description": "Tarjeta de captura con campos de texto, select, switch y botones Guardar/Limpiar.",
        "icon": "ClipboardList",
        "defaultRoute": "/formulario",
    },
    {
        "id": "crud_table",
        "name": "Tabla de Datos + CRUD",
        "description": "AG Grid o Table con botones Nuevo, Editar, Eliminar y modal. Conectable a una tabla de tu BD.",
        "icon": "Table2",
        "defaultRoute": "/datos",
    },
    {
        "id": "modal",
        "name": "Ventana Emergente (Modal)",
        "description": "Dialog modal reutilizable con botón disparador, campos y acciones Aceptar/Cancelar.",
        "icon": "AppWindow",
        "defaultRoute": "/modal",
    },
    {
        "id": "dashboard",
        "name": "Dashboard KPIs + Gráfico",
        "description": "Panel gerencial con tarjetas de métricas, gráfico EChart y tabla de resumen.",
        "icon": "BarChart3",
        "defaultRoute": "/dashboard",
    },
    {
        "id": "login",
        "name": "Login / Acceso",
        "description": "Pantalla de inicio de sesión centrada con usuario, contraseña y validación.",
        "icon": "Lock",
        "defaultRoute": "/login",
    },
    {
        "id": "app_shell",
        "name": "Layout Header + Drawer",
        "description": "Estructura completa de aplicación con barra superior, menú lateral desplegable y footer.",
        "icon": "PanelLeft",
        "defaultRoute": "/panel",
    },
    {
        "id": "blank",
        "name": "Formulario en Blanco",
        "description": "Lienzo vacío listo para arrastrar controles desde cero.",
        "icon": "FilePlus2",
        "defaultRoute": "/nuevo",
    },
]


def _code_header(form_name: str) -> tuple[str, str, str]:
    pascal = to_pascal_case(form_name)
    snake = to_snake_case(form_name)
    designer_cls = f"{pascal}Designer"
    header = (
        "from __future__ import annotations\n\n"
        "from nicegui import ui\n"
        f"from forms.{snake}_designer import {designer_cls}\n\n\n"
        f"class {pascal}({designer_cls}):\n"
    )
    return pascal, designer_cls, header


def _page_footer(pascal: str, route: str) -> str:
    return (
        "\n\ndef register_page() -> None:\n"
        f"    @ui.page({route!r})\n"
        "    def page() -> None:\n"
        f"        {pascal}()\n"
    )


def build_form_from_template(
    template_id: str,
    form_name: str,
    route: str,
    title: str | None = None,
) -> tuple[FormDocument, str]:
    pascal = to_pascal_case(form_name)
    clean_route = route if route.startswith("/") else f"/{route}"
    page_title = title or pascal

    if template_id == "standard":
        doc = FormDocument(
            formName=pascal,
            settings=FormSettings(
                title=page_title,
                route=clean_route,
                dark=False,
                rootClasses="w-full max-w-2xl mx-auto p-6 gap-4",
            ),
            root=WidgetNode(
                id="root",
                type="column",
                name="root",
                classes="w-full max-w-2xl mx-auto p-6 gap-4",
                children=[
                    WidgetNode(
                        id="std_card",
                        type="card",
                        name="card_form",
                        classes="w-full p-6 gap-4 shadow-md",
                        children=[
                            WidgetNode(
                                id="std_title",
                                type="label",
                                name="lbl_title",
                                props={"text": page_title},
                                classes="text-2xl font-bold text-slate-800",
                            ),
                            WidgetNode(
                                id="std_sub",
                                type="label",
                                name="lbl_subtitle",
                                props={"text": "Completa los campos del formulario y pulsa Guardar."},
                                classes="text-xs text-slate-500",
                            ),
                            WidgetNode(
                                id="std_grid",
                                type="grid",
                                name="grid_fields",
                                props={"columns": 2},
                                classes="w-full gap-4",
                                children=[
                                    WidgetNode(
                                        id="std_name",
                                        type="input",
                                        name="inp_nombre",
                                        props={"label": "Nombre completo", "placeholder": "Ej: Ana García", "value": ""},
                                        classes="w-full",
                                        quasarProps="outlined dense",
                                    ),
                                    WidgetNode(
                                        id="std_email",
                                        type="input",
                                        name="inp_email",
                                        props={"label": "Correo electrónico", "placeholder": "ana@empresa.com", "value": ""},
                                        classes="w-full",
                                        quasarProps="outlined dense",
                                    ),
                                ],
                            ),
                            WidgetNode(
                                id="std_cat",
                                type="select",
                                name="sel_categoria",
                                props={"label": "Categoría", "options": ["General", "Soporte", "Ventas"], "value": "General"},
                                classes="w-full",
                                quasarProps="outlined dense",
                            ),
                            WidgetNode(
                                id="std_notes",
                                type="textarea",
                                name="txt_notas",
                                props={"label": "Observaciones", "placeholder": "Escribe comentarios adicionales...", "value": ""},
                                classes="w-full",
                                quasarProps="outlined dense",
                            ),
                            WidgetNode(
                                id="std_active",
                                type="switch",
                                name="sw_activo",
                                props={"text": "Registro activo", "value": True},
                            ),
                            WidgetNode(
                                id="std_sep",
                                type="separator",
                                name="sep_1",
                                classes="w-full my-1",
                            ),
                            WidgetNode(
                                id="std_actions",
                                type="row",
                                name="row_actions",
                                classes="w-full justify-end gap-2",
                                children=[
                                    WidgetNode(
                                        id="std_btn_clear",
                                        type="button",
                                        name="btn_limpiar",
                                        props={"text": "Limpiar", "color": "dark"},
                                        quasarProps="flat no-caps",
                                        events={"on_click": "on_btn_limpiar_click"},
                                    ),
                                    WidgetNode(
                                        id="std_btn_save",
                                        type="button",
                                        name="btn_guardar",
                                        props={"text": "Guardar", "color": "primary", "icon": "save"},
                                        quasarProps="no-caps",
                                        events={"on_click": "on_btn_guardar_click"},
                                    ),
                                ],
                            ),
                        ],
                    )
                ],
            ),
        )
        _, _, header = _code_header(pascal)
        code = (
            header
            + '    def __init__(self) -> None:\n'
            + '        self.setup_ui()\n\n'
            + '    def on_btn_guardar_click(self, e=None) -> None:\n'
            + '        if not (self.inp_nombre.value or "").strip():\n'
            + '            ui.notify("El nombre es obligatorio", type="warning")\n'
            + '            return\n'
            + '        ui.notify(f"Guardado: {self.inp_nombre.value} ({self.sel_categoria.value})", type="positive")\n\n'
            + '    def on_btn_limpiar_click(self, e=None) -> None:\n'
            + '        self.inp_nombre.set_value("")\n'
            + '        self.inp_email.set_value("")\n'
            + '        self.txt_notas.set_value("")\n'
            + '        self.sw_activo.set_value(True)\n'
            + _page_footer(pascal, clean_route)
        )
        return doc, code

    if template_id == "modal":
        doc = FormDocument(
            formName=pascal,
            settings=FormSettings(
                title=page_title,
                route=clean_route,
                dark=False,
                rootClasses="w-full max-w-2xl mx-auto p-6 gap-4",
            ),
            root=WidgetNode(
                id="root",
                type="column",
                name="root",
                classes="w-full max-w-2xl mx-auto p-6 gap-4",
                children=[
                    WidgetNode(
                        id="mod_trigger_card",
                        type="card",
                        name="card_host",
                        classes="w-full p-6 gap-3 shadow-sm",
                        children=[
                            WidgetNode(
                                id="mod_lbl",
                                type="label",
                                name="lbl_intro",
                                props={"text": f"Ventana Emergente: {page_title}"},
                                classes="text-xl font-bold text-slate-800",
                            ),
                            WidgetNode(
                                id="mod_btn_open",
                                type="button",
                                name="btn_abrir_modal",
                                props={"text": "Abrir Ventana Emergente", "color": "primary", "icon": "open_in_new"},
                                quasarProps="no-caps",
                                events={"on_click": "on_btn_abrir_modal_click"},
                            ),
                            WidgetNode(
                                id="mod_lbl_res",
                                type="label",
                                name="lbl_resultado",
                                props={"text": "Esperando confirmación del modal..."},
                                classes="text-sm text-slate-500",
                            ),
                        ],
                    ),
                    WidgetNode(
                        id="mod_dialog",
                        type="dialog",
                        name="dlg_main",
                        props={"value": True},
                        children=[
                            WidgetNode(
                                id="mod_card",
                                type="card",
                                name="card_modal",
                                classes="w-full min-w-[380px] p-5 gap-3",
                                children=[
                                    WidgetNode(
                                        id="mod_title",
                                        type="label",
                                        name="lbl_modal_title",
                                        props={"text": page_title},
                                        classes="text-lg font-bold text-slate-800",
                                    ),
                                    WidgetNode(
                                        id="mod_inp_1",
                                        type="input",
                                        name="inp_titulo",
                                        props={"label": "Título", "placeholder": "Escribe aquí...", "value": ""},
                                        classes="w-full",
                                        quasarProps="outlined dense",
                                    ),
                                    WidgetNode(
                                        id="mod_txt_1",
                                        type="textarea",
                                        name="txt_detalle",
                                        props={"label": "Detalle", "placeholder": "Descripción...", "value": ""},
                                        classes="w-full",
                                        quasarProps="outlined dense",
                                    ),
                                    WidgetNode(
                                        id="mod_row",
                                        type="row",
                                        name="row_modal_actions",
                                        classes="w-full justify-end gap-2 mt-2",
                                        children=[
                                            WidgetNode(
                                                id="mod_cancel",
                                                type="button",
                                                name="btn_cancelar",
                                                props={"text": "Cancelar", "color": "dark"},
                                                quasarProps="flat no-caps",
                                                events={"on_click": "on_btn_cancelar_click"},
                                            ),
                                            WidgetNode(
                                                id="mod_ok",
                                                type="button",
                                                name="btn_confirmar",
                                                props={"text": "Aceptar", "color": "primary", "icon": "check"},
                                                quasarProps="no-caps",
                                                events={"on_click": "on_btn_confirmar_click"},
                                            ),
                                        ],
                                    ),
                                ],
                            )
                        ],
                    ),
                ],
            ),
        )
        _, _, header = _code_header(pascal)
        code = (
            header
            + '    def __init__(self) -> None:\n'
            + '        self.setup_ui()\n\n'
            + '    def on_btn_abrir_modal_click(self, e=None) -> None:\n'
            + '        self.dlg_main.open()\n\n'
            + '    def on_btn_cancelar_click(self, e=None) -> None:\n'
            + '        self.dlg_main.close()\n\n'
            + '    def on_btn_confirmar_click(self, e=None) -> None:\n'
            + '        self.lbl_resultado.set_text(f"Confirmado: {self.inp_titulo.value}")\n'
            + '        ui.notify("Acción confirmada", type="positive")\n'
            + '        self.dlg_main.close()\n'
            + _page_footer(pascal, clean_route)
        )
        return doc, code

    if template_id == "crud_table":
        doc = FormDocument(
            formName=pascal,
            settings=FormSettings(
                title=page_title,
                route=clean_route,
                dark=False,
                rootClasses="w-full max-w-6xl mx-auto p-6 gap-4",
            ),
            root=WidgetNode(
                id="root",
                type="column",
                name="root",
                classes="w-full max-w-6xl mx-auto p-6 gap-4",
                children=[
                    WidgetNode(
                        id="ct_card",
                        type="card",
                        name="card_crud",
                        classes="w-full p-5 gap-4 shadow-sm",
                        children=[
                            WidgetNode(
                                id="ct_hdr",
                                type="row",
                                name="row_header",
                                classes="w-full items-center justify-between gap-2",
                                children=[
                                    WidgetNode(
                                        id="ct_title",
                                        type="label",
                                        name="lbl_title",
                                        props={"text": page_title},
                                        classes="text-2xl font-bold text-slate-800",
                                    ),
                                    WidgetNode(
                                        id="ct_btns",
                                        type="row",
                                        name="row_actions",
                                        classes="items-center gap-2",
                                        children=[
                                            WidgetNode(
                                                id="ct_new",
                                                type="button",
                                                name="btn_new",
                                                props={"text": "Nuevo", "color": "positive", "icon": "add"},
                                                quasarProps="no-caps",
                                                events={"on_click": "on_btn_new_click"},
                                            ),
                                            WidgetNode(
                                                id="ct_edit",
                                                type="button",
                                                name="btn_edit",
                                                props={"text": "Editar", "color": "primary", "icon": "edit"},
                                                quasarProps="no-caps",
                                                events={"on_click": "on_btn_edit_click"},
                                            ),
                                            WidgetNode(
                                                id="ct_del",
                                                type="button",
                                                name="btn_delete",
                                                props={"text": "Eliminar", "color": "negative", "icon": "delete"},
                                                quasarProps="no-caps outline",
                                                events={"on_click": "on_btn_delete_click"},
                                            ),
                                        ],
                                    ),
                                ],
                            ),
                            WidgetNode(
                                id="ct_grid",
                                type="aggrid",
                                name="grid_data",
                                props={
                                    "options": {
                                        "columnDefs": [
                                            {"headerName": "ID", "field": "id", "sortable": True},
                                            {"headerName": "Nombre", "field": "nombre", "sortable": True, "filter": True},
                                            {"headerName": "Estado", "field": "estado", "sortable": True},
                                        ],
                                        "rowData": [
                                            {"id": 1, "nombre": "Elemento A", "estado": "Activo"},
                                            {"id": 2, "nombre": "Elemento B", "estado": "Pendiente"},
                                        ],
                                        "rowSelection": "single",
                                    }
                                },
                                classes="w-full h-80",
                            ),
                        ],
                    ),
                    WidgetNode(
                        id="ct_dlg",
                        type="dialog",
                        name="dlg_editor",
                        props={"value": False},
                        children=[
                            WidgetNode(
                                id="ct_dlg_card",
                                type="card",
                                name="card_editor",
                                classes="w-full min-w-[360px] p-5 gap-3",
                                children=[
                                    WidgetNode(
                                        id="ct_dlg_lbl",
                                        type="label",
                                        name="lbl_modal_title",
                                        props={"text": "Registro"},
                                        classes="text-lg font-bold text-slate-800",
                                    ),
                                    WidgetNode(
                                        id="ct_fld_nombre",
                                        type="input",
                                        name="fld_nombre",
                                        props={"label": "Nombre", "value": ""},
                                        classes="w-full",
                                        quasarProps="outlined dense",
                                    ),
                                    WidgetNode(
                                        id="ct_fld_estado",
                                        type="select",
                                        name="fld_estado",
                                        props={"label": "Estado", "options": ["Activo", "Pendiente", "Inactivo"], "value": "Activo"},
                                        classes="w-full",
                                        quasarProps="outlined dense",
                                    ),
                                    WidgetNode(
                                        id="ct_dlg_row",
                                        type="row",
                                        name="row_modal_actions",
                                        classes="w-full justify-end gap-2 mt-2",
                                        children=[
                                            WidgetNode(
                                                id="ct_cancel",
                                                type="button",
                                                name="btn_cancel",
                                                props={"text": "Cancelar", "color": "dark"},
                                                quasarProps="flat no-caps",
                                                events={"on_click": "on_btn_cancel_click"},
                                            ),
                                            WidgetNode(
                                                id="ct_save",
                                                type="button",
                                                name="btn_save",
                                                props={"text": "Guardar", "color": "primary", "icon": "save"},
                                                quasarProps="no-caps",
                                                events={"on_click": "on_btn_save_click"},
                                            ),
                                        ],
                                    ),
                                ],
                            )
                        ],
                    ),
                ],
            ),
        )
        _, _, header = _code_header(pascal)
        code = (
            header
            + '    def __init__(self) -> None:\n'
            + '        self.rows = [\n'
            + '            {"id": 1, "nombre": "Elemento A", "estado": "Activo"},\n'
            + '            {"id": 2, "nombre": "Elemento B", "estado": "Pendiente"},\n'
            + '        ]\n'
            + '        self.editing_id = None\n'
            + '        self.setup_ui()\n\n'
            + '    def _sync_grid(self) -> None:\n'
            + '        self.grid_data.options["rowData"] = list(self.rows)\n'
            + '        self.grid_data.update()\n\n'
            + '    def on_btn_new_click(self, e=None) -> None:\n'
            + '        self.editing_id = None\n'
            + '        self.lbl_modal_title.set_text("Nuevo registro")\n'
            + '        self.fld_nombre.set_value("")\n'
            + '        self.fld_estado.set_value("Activo")\n'
            + '        self.dlg_editor.open()\n\n'
            + '    async def on_btn_edit_click(self, e=None) -> None:\n'
            + '        row = await self.grid_data.get_selected_row()\n'
            + '        if not row:\n'
            + '            ui.notify("Selecciona una fila primero", type="warning")\n'
            + '            return\n'
            + '        self.editing_id = row["id"]\n'
            + '        self.lbl_modal_title.set_text(f"Editar registro #{self.editing_id}")\n'
            + '        self.fld_nombre.set_value(row.get("nombre", ""))\n'
            + '        self.fld_estado.set_value(row.get("estado", "Activo"))\n'
            + '        self.dlg_editor.open()\n\n'
            + '    def on_btn_save_click(self, e=None) -> None:\n'
            + '        if self.editing_id is None:\n'
            + '            next_id = max((r["id"] for r in self.rows), default=0) + 1\n'
            + '            self.rows.append({"id": next_id, "nombre": self.fld_nombre.value, "estado": self.fld_estado.value})\n'
            + '        else:\n'
            + '            for r in self.rows:\n'
            + '                if r["id"] == self.editing_id:\n'
            + '                    r["nombre"] = self.fld_nombre.value\n'
            + '                    r["estado"] = self.fld_estado.value\n'
            + '        self._sync_grid()\n'
            + '        self.dlg_editor.close()\n'
            + '        ui.notify("Guardado correctamente", type="positive")\n\n'
            + '    async def on_btn_delete_click(self, e=None) -> None:\n'
            + '        row = await self.grid_data.get_selected_row()\n'
            + '        if not row:\n'
            + '            ui.notify("Selecciona una fila para eliminar", type="warning")\n'
            + '            return\n'
            + '        self.rows = [r for r in self.rows if r["id"] != row["id"]]\n'
            + '        self._sync_grid()\n'
            + '        ui.notify("Registro eliminado", type="positive")\n\n'
            + '    def on_btn_cancel_click(self, e=None) -> None:\n'
            + '        self.dlg_editor.close()\n'
            + _page_footer(pascal, clean_route)
        )
        return doc, code

    if template_id == "dashboard":
        doc = FormDocument(
            formName=pascal,
            settings=FormSettings(
                title=page_title,
                route=clean_route,
                dark=False,
                rootClasses="w-full max-w-6xl mx-auto p-6 gap-4",
            ),
            root=WidgetNode(
                id="root",
                type="column",
                name="root",
                classes="w-full max-w-6xl mx-auto p-6 gap-4",
                children=[
                    WidgetNode(
                        id="db_title",
                        type="label",
                        name="lbl_title",
                        props={"text": page_title},
                        classes="text-2xl font-bold text-slate-800",
                    ),
                    WidgetNode(
                        id="db_kpis",
                        type="grid",
                        name="grid_kpis",
                        props={"columns": 3},
                        classes="w-full gap-4",
                        children=[
                            WidgetNode(
                                id="kpi_1",
                                type="card",
                                name="card_kpi_1",
                                classes="p-4 gap-1 shadow-sm",
                                children=[
                                    WidgetNode(id="kpi_1_l", type="label", name="lbl_kpi_1", props={"text": "Ventas del Mes"}, classes="text-xs text-slate-500 uppercase"),
                                    WidgetNode(id="kpi_1_v", type="label", name="lbl_val_1", props={"text": "$24,850"}, classes="text-2xl font-bold text-blue-600"),
                                    WidgetNode(id="kpi_1_b", type="badge", name="bdg_kpi_1", props={"text": "+12.4%", "color": "positive"}),
                                ],
                            ),
                            WidgetNode(
                                id="kpi_2",
                                type="card",
                                name="card_kpi_2",
                                classes="p-4 gap-1 shadow-sm",
                                children=[
                                    WidgetNode(id="kpi_2_l", type="label", name="lbl_kpi_2", props={"text": "Usuarios Activos"}, classes="text-xs text-slate-500 uppercase"),
                                    WidgetNode(id="kpi_2_v", type="label", name="lbl_val_2", props={"text": "1,420"}, classes="text-2xl font-bold text-emerald-600"),
                                    WidgetNode(id="kpi_2_b", type="badge", name="bdg_kpi_2", props={"text": "+8.1%", "color": "info"}),
                                ],
                            ),
                            WidgetNode(
                                id="kpi_3",
                                type="card",
                                name="card_kpi_3",
                                classes="p-4 gap-1 shadow-sm",
                                children=[
                                    WidgetNode(id="kpi_3_l", type="label", name="lbl_kpi_3", props={"text": "Cumplimiento SLA"}, classes="text-xs text-slate-500 uppercase"),
                                    WidgetNode(id="kpi_3_v", type="label", name="lbl_val_3", props={"text": "98.6%"}, classes="text-2xl font-bold text-slate-800"),
                                    WidgetNode(id="kpi_3_p", type="linear_progress", name="prog_sla", props={"value": 0.98, "color": "positive", "show_value": False}, classes="w-full mt-1"),
                                ],
                            ),
                        ],
                    ),
                    WidgetNode(
                        id="db_chart_card",
                        type="card",
                        name="card_chart",
                        classes="w-full p-4 gap-2 shadow-sm",
                        children=[
                            WidgetNode(id="db_chart_lbl", type="label", name="lbl_chart", props={"text": "Rendimiento Semanal"}, classes="text-base font-semibold text-slate-700"),
                            WidgetNode(
                                id="db_echart",
                                type="echart",
                                name="chart_main",
                                props={
                                    "options": {
                                        "tooltip": {"trigger": "axis"},
                                        "xAxis": {"type": "category", "data": ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]},
                                        "yAxis": {"type": "value"},
                                        "series": [{"name": "Ingresos", "type": "bar", "data": [320, 480, 390, 560, 610, 440]}],
                                    }
                                },
                                classes="w-full h-72",
                            ),
                        ],
                    ),
                ],
            ),
        )
        return doc, generate_initial_code_behind(pascal, route=clean_route)

    if template_id == "login":
        doc = FormDocument(
            formName=pascal,
            settings=FormSettings(
                title=page_title,
                route=clean_route,
                dark=False,
                rootClasses="w-full max-w-md mx-auto p-6 gap-4 mt-12",
            ),
            root=WidgetNode(
                id="root",
                type="column",
                name="root",
                classes="w-full max-w-md mx-auto p-6 gap-4 mt-12",
                children=[
                    WidgetNode(
                        id="lg_card",
                        type="card",
                        name="card_login",
                        classes="w-full p-6 gap-4 shadow-lg items-center",
                        children=[
                            WidgetNode(id="lg_avt", type="avatar", name="avt_logo", props={"icon": "lock", "color": "primary", "size": "lg"}),
                            WidgetNode(id="lg_title", type="label", name="lbl_title", props={"text": "Iniciar Sesión"}, classes="text-2xl font-bold text-slate-800"),
                            WidgetNode(id="lg_user", type="input", name="inp_usuario", props={"label": "Usuario o Email", "placeholder": "admin@empresa.com", "value": ""}, classes="w-full", quasarProps="outlined dense"),
                            WidgetNode(id="lg_pass", type="input", name="inp_password", props={"label": "Contraseña", "placeholder": "••••••••", "value": "", "password": True}, classes="w-full", quasarProps="outlined dense"),
                            WidgetNode(id="lg_rem", type="checkbox", name="chk_recordar", props={"text": "Recordar mi sesión", "value": True}, classes="w-full"),
                            WidgetNode(
                                id="lg_btn",
                                type="button",
                                name="btn_ingresar",
                                props={"text": "Ingresar", "color": "primary", "icon": "login"},
                                classes="w-full",
                                quasarProps="no-caps",
                                events={"on_click": "on_btn_ingresar_click"},
                            ),
                        ],
                    )
                ],
            ),
        )
        _, _, header = _code_header(pascal)
        code = (
            header
            + '    def __init__(self) -> None:\n'
            + '        self.setup_ui()\n\n'
            + '    def on_btn_ingresar_click(self, e=None) -> None:\n'
            + '        user = (self.inp_usuario.value or "").strip()\n'
            + '        pwd = (self.inp_password.value or "").strip()\n'
            + '        if not user or not pwd:\n'
            + '            ui.notify("Ingresa usuario y contraseña", type="warning")\n'
            + '            return\n'
            + '        ui.notify(f"¡Bienvenido, {user}!", type="positive")\n'
            + _page_footer(pascal, clean_route)
        )
        return doc, code

    if template_id == "app_shell":
        doc = FormDocument(
            formName=pascal,
            settings=FormSettings(
                title=page_title,
                route=clean_route,
                dark=False,
                rootClasses="w-full p-4 gap-4",
            ),
            root=WidgetNode(
                id="root",
                type="column",
                name="root",
                classes="w-full p-4 gap-4",
                children=[
                    WidgetNode(
                        id="sh_hdr",
                        type="header",
                        name="hdr_top",
                        props={"elevated": True, "bordered": False},
                        classes="items-center justify-between px-4",
                        children=[
                            WidgetNode(id="sh_menu", type="button", name="btn_menu", props={"text": "", "color": "primary", "icon": "menu"}, quasarProps="flat round", events={"on_click": "on_btn_menu_click"}),
                            WidgetNode(id="sh_brand", type="label", name="lbl_brand", props={"text": page_title}, classes="text-lg font-bold text-white"),
                            WidgetNode(id="sh_spc", type="space", name="spc_1"),
                            WidgetNode(id="sh_avt", type="avatar", name="avt_user", props={"icon": "person", "color": "secondary", "size": "sm"}),
                        ],
                    ),
                    WidgetNode(
                        id="sh_drawer",
                        type="left_drawer",
                        name="drawer_nav",
                        props={"value": True, "elevated": True, "bordered": True},
                        classes="p-4 gap-2",
                        children=[
                            WidgetNode(id="sh_nav_lbl", type="label", name="lbl_nav", props={"text": "NAVEGACIÓN"}, classes="text-xs font-bold text-slate-500"),
                            WidgetNode(id="sh_nav_1", type="button", name="btn_nav_home", props={"text": "Inicio", "color": "primary", "icon": "home"}, classes="w-full", quasarProps="flat no-caps align=left"),
                            WidgetNode(id="sh_nav_2", type="button", name="btn_nav_reports", props={"text": "Reportes", "color": "primary", "icon": "assessment"}, classes="w-full", quasarProps="flat no-caps align=left"),
                        ],
                    ),
                    WidgetNode(
                        id="sh_body",
                        type="card",
                        name="card_content",
                        classes="w-full p-6 gap-3 shadow-sm",
                        children=[
                            WidgetNode(id="sh_h1", type="label", name="lbl_welcome", props={"text": f"Panel Principal — {page_title}"}, classes="text-2xl font-bold text-slate-800"),
                            WidgetNode(id="sh_p", type="label", name="lbl_desc", props={"text": "Arrastra tus controles dentro de este contenedor principal."}, classes="text-sm text-slate-500"),
                        ],
                    ),
                    WidgetNode(
                        id="sh_ftr",
                        type="footer",
                        name="ftr_bottom",
                        props={"elevated": False, "bordered": True},
                        classes="items-center justify-between px-4 py-1 text-xs",
                        children=[
                            WidgetNode(id="sh_ftr_l", type="label", name="lbl_copy", props={"text": "Creado con Quantum-RAD Studio"}, classes="text-xs text-white"),
                        ],
                    ),
                ],
            ),
        )
        _, _, header = _code_header(pascal)
        code = (
            header
            + '    def __init__(self) -> None:\n'
            + '        self.setup_ui()\n\n'
            + '    def on_btn_menu_click(self, e=None) -> None:\n'
            + '        self.drawer_nav.toggle()\n'
            + _page_footer(pascal, clean_route)
        )
        return doc, code

    # Default: blank
    doc = FormDocument(
        formName=pascal,
        settings=FormSettings(title=page_title, route=clean_route),
        root=WidgetNode(
            id="root",
            type="column",
            name="root",
            classes="w-full max-w-4xl mx-auto p-6 gap-4",
            children=[],
        ),
    )
    return doc, generate_initial_code_behind(pascal, route=clean_route)
