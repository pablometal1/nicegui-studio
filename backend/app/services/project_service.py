from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from app.models.schemas import (
    FileTreeItem,
    FormDocument,
    FormSettings,
    ProjectConfig,
    ProjectSummary,
    RunTargetItem,
    WidgetNode,
)
from app.services.codegen_service import (
    generate_designer_code,
    generate_initial_code_behind,
    to_pascal_case,
    to_snake_case,
)

def _default_projects_dir() -> Path:
    env_dir = os.environ.get("NICEGUI_STUDIO_PROJECTS_DIR")
    if env_dir:
        return Path(env_dir).expanduser().resolve()
    if getattr(sys, "frozen", False):
        return (Path.home() / "NiceGUIStudioProjects").resolve()
    return (Path(__file__).resolve().parents[3] / "projects").resolve()


WORKSPACE_ROOT = Path(__file__).resolve().parents[3]
PROJECTS_DIR = _default_projects_dir()

IGNORED_NAMES = {"__pycache__", ".venv", ".git", "node_modules", ".pytest_cache"}


def _safe_project_name(name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_-]", "_", name.strip())
    if not cleaned:
        raise ValueError("Project name cannot be empty.")
    return cleaned


def _resolve_within(base: Path, relative_path: str) -> Path:
    rel = relative_path.replace("\\", "/").lstrip("/")
    target = (base / rel).resolve()
    base_resolved = base.resolve()
    if target != base_resolved and base_resolved not in target.parents:
        raise ValueError("Path escapes project directory.")
    return target


def _file_kind(name: str) -> str:
    if name.endswith(".ngui.json"):
        return "form"
    if name.endswith("_designer.py"):
        return "designer"
    if name.endswith(".py"):
        return "python"
    if name.endswith(".json"):
        return "json"
    return "other"


def _create_default_main_form_doc() -> FormDocument:
    return FormDocument(
        schemaVersion="1.0",
        formName="MainForm",
        settings=FormSettings(
            title="Quantum-RAD Studio — Demo App",
            route="/",
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
                    id="node_card_1",
                    type="card",
                    name="card_welcome",
                    classes="w-full p-6 gap-4 shadow-md",
                    children=[
                        WidgetNode(
                            id="node_lbl_title",
                            type="label",
                            name="lbl_title",
                            props={"text": "Bienvenido a Quantum-RAD Studio"},
                            classes="text-2xl font-bold text-slate-800",
                        ),
                        WidgetNode(
                            id="node_lbl_sub",
                            type="label",
                            name="lbl_subtitle",
                            props={
                                "text": "Arrastra widgets desde la Caja de Herramientas, edita sus propiedades y pulsa Run (F5)."
                            },
                            classes="text-sm text-slate-500",
                        ),
                        WidgetNode(
                            id="node_inp_name",
                            type="input",
                            name="inp_name",
                            props={
                                "label": "Tu nombre",
                                "placeholder": "Escribe tu nombre aquí...",
                                "value": "",
                            },
                            classes="w-full",
                        ),
                        WidgetNode(
                            id="node_row_actions",
                            type="row",
                            name="row_actions",
                            classes="w-full items-center gap-3",
                            children=[
                                WidgetNode(
                                    id="node_btn_greet",
                                    type="button",
                                    name="btn_greet",
                                    props={
                                        "text": "Saludar",
                                        "color": "primary",
                                        "icon": "waving_hand",
                                    },
                                    events={"on_click": "on_btn_greet_click"},
                                ),
                                WidgetNode(
                                    id="node_btn_clear",
                                    type="button",
                                    name="btn_clear",
                                    props={
                                        "text": "Limpiar",
                                        "color": "secondary",
                                    },
                                    events={"on_click": "on_btn_clear_click"},
                                ),
                            ],
                        ),
                        WidgetNode(
                            id="node_lbl_result",
                            type="label",
                            name="lbl_result",
                            props={"text": "Resultado: esperando interacción..."},
                            classes="text-base font-medium text-blue-600 mt-2",
                        ),
                    ],
                )
            ],
        ),
    )


def _demo_code_behind() -> str:
    return (
        "from __future__ import annotations\n\n"
        "from nicegui import ui\n"
        "from forms.main_form_designer import MainFormDesigner\n\n\n"
        "class MainForm(MainFormDesigner):\n"
        '    """Code-behind for MainForm. Write your event handlers and logic here."""\n\n'
        "    def __init__(self) -> None:\n"
        "        self.setup_ui()\n\n"
        "    def on_btn_greet_click(self, e=None) -> None:\n"
        '        """Handler for on_click."""\n'
        '        name = (self.inp_name.value or "Mundo").strip()\n'
        '        self.lbl_result.set_text(f"¡Hola, {name}! Generado con Quantum-RAD Studio.")\n'
        '        ui.notify(f"¡Hola, {name}!", type="positive")\n\n'
        "    def on_btn_clear_click(self, e=None) -> None:\n"
        '        """Handler for on_click."""\n'
        '        self.inp_name.set_value("")\n'
        '        self.lbl_result.set_text("Resultado: esperando interacción...")\n'
        "\n\n"
        "def register_page() -> None:\n"
        '    @ui.page("/")\n'
        "    def page() -> None:\n"
        "        MainForm()\n"
    )


def _generate_main_py(project_name: str, port: int = 8085) -> str:
    return (
        "from __future__ import annotations\n\n"
        "import importlib\n"
        "import os\n"
        "from pathlib import Path\n"
        "from nicegui import ui\n\n\n"
        "def register_all_forms() -> None:\n"
        '    forms_dir = Path(__file__).parent / "forms"\n'
        "    if not forms_dir.exists():\n"
        "        return\n"
        '    for py_file in sorted(forms_dir.glob("*.py")):\n'
        '        if py_file.name.startswith("_") or py_file.name.endswith("_designer.py"):\n'
        "            continue\n"
        '        module = importlib.import_module(f"forms.{py_file.stem}")\n'
        '        if hasattr(module, "register_page"):\n'
        "            module.register_page()\n\n\n"
        "register_all_forms()\n\n"
        'if __name__ in {"__main__", "__mp_main__"}:\n'
        f'    port = int(os.environ.get("NICEGUI_PORT", "{port}"))\n'
        '    reload = os.environ.get("NICEGUI_RELOAD", "0") == "1"\n'
        f'    ui.run(title={project_name!r}, port=port, reload=reload, show=False, storage_secret="nicegui-studio-secret")\n'
    )


class ProjectService:
    def __init__(self, projects_dir: Path | None = None) -> None:
        self.projects_dir = projects_dir or PROJECTS_DIR
        self.projects_dir.mkdir(parents=True, exist_ok=True)

    def ensure_default_project(self) -> None:
        if not any(self.projects_dir.iterdir()):
            self.create_project("demo_app", with_demo_content=True)

    def list_projects(self) -> list[ProjectSummary]:
        self.ensure_default_project()
        result: list[ProjectSummary] = []
        for entry in sorted(self.projects_dir.iterdir()):
            if not entry.is_dir() or entry.name in IGNORED_NAMES:
                continue
            cfg_path = entry / "project.ngproj.json"
            if cfg_path.exists():
                cfg = ProjectConfig.model_validate_json(cfg_path.read_text(encoding="utf-8"))
                result.append(
                    ProjectSummary(
                        name=cfg.name,
                        path=str(entry),
                        entryPoint=cfg.entryPoint,
                        port=cfg.port,
                    )
                )
        return result

    def get_project_dir(self, project_name: str) -> Path:
        safe = _safe_project_name(project_name)
        pdir = self.projects_dir / safe
        if not pdir.exists():
            raise FileNotFoundError(f"Project '{safe}' not found.")
        return pdir

    def create_project(self, name: str, with_demo_content: bool = False) -> ProjectSummary:
        safe = _safe_project_name(name)
        pdir = self.projects_dir / safe
        if pdir.exists():
            raise FileExistsError(f"Project '{safe}' already exists.")

        forms_dir = pdir / "forms"
        forms_dir.mkdir(parents=True, exist_ok=True)
        (forms_dir / "__init__.py").write_text("", encoding="utf-8")

        cfg = ProjectConfig(
            name=safe,
            entryPoint="main.py",
            port=8085,
            createdAt=datetime.now(timezone.utc).isoformat(),
        )
        (pdir / "project.ngproj.json").write_text(cfg.model_dump_json(indent=2), encoding="utf-8")
        (pdir / "main.py").write_text(_generate_main_py(safe, cfg.port), encoding="utf-8")

        if with_demo_content:
            doc = _create_default_main_form_doc()
            code_behind = _demo_code_behind()
        else:
            doc = FormDocument(
                formName="MainForm",
                settings=FormSettings(title=safe, route="/"),
                root=WidgetNode(
                    id="root",
                    type="column",
                    name="root",
                    classes="w-full max-w-4xl mx-auto p-6 gap-4",
                    children=[],
                ),
            )
            code_behind = generate_initial_code_behind("MainForm", route="/")

        (forms_dir / "main_form.ngui.json").write_text(
            doc.model_dump_json(indent=2), encoding="utf-8"
        )
        (forms_dir / "main_form_designer.py").write_text(
            generate_designer_code(doc), encoding="utf-8"
        )
        (forms_dir / "main_form.py").write_text(code_behind, encoding="utf-8")

        return ProjectSummary(
            name=cfg.name,
            path=str(pdir),
            entryPoint=cfg.entryPoint,
            port=cfg.port,
        )

    def create_form(
        self,
        project_name: str,
        form_name: str,
        route: str = "/",
        title: str | None = None,
        template: str = "blank",
        table_name: str | None = None,
        grid_type: str = "aggrid",
    ) -> dict[str, str]:
        pdir = self.get_project_dir(project_name)
        forms_dir = pdir / "forms"
        forms_dir.mkdir(parents=True, exist_ok=True)
        if not (forms_dir / "__init__.py").exists():
            (forms_dir / "__init__.py").write_text("", encoding="utf-8")

        pascal = to_pascal_case(form_name)
        snake = to_snake_case(form_name)
        form_path = forms_dir / f"{snake}.ngui.json"
        if form_path.exists():
            raise FileExistsError(f"Form '{snake}' already exists.")

        if template == "crud_table" and table_name:
            from app.services.crud_generator_service import generate_crud_for_table

            res = generate_crud_for_table(
                project_dir=pdir,
                table_name=table_name,
                grid_type=grid_type,
                form_name=pascal,
                route=route,
            )
            return {
                "formPath": res.formPath,
                "designerPath": res.designerPath,
                "codeBehindPath": res.codeBehindPath,
                "route": res.route,
            }

        from app.services.form_templates import build_form_from_template

        doc, code_behind = build_form_from_template(
            template_id=template,
            form_name=pascal,
            route=route,
            title=title or pascal,
        )
        form_path.write_text(doc.model_dump_json(indent=2), encoding="utf-8")
        (forms_dir / f"{snake}_designer.py").write_text(
            generate_designer_code(doc), encoding="utf-8"
        )
        (forms_dir / f"{snake}.py").write_text(code_behind, encoding="utf-8")
        return {
            "formPath": f"forms/{snake}.ngui.json",
            "designerPath": f"forms/{snake}_designer.py",
            "codeBehindPath": f"forms/{snake}.py",
            "route": doc.settings.route,
        }

    def get_file_tree(self, project_name: str) -> list[FileTreeItem]:
        pdir = self.get_project_dir(project_name)

        def walk(directory: Path) -> list[FileTreeItem]:
            items: list[FileTreeItem] = []
            entries = sorted(
                directory.iterdir(),
                key=lambda p: (0 if p.is_dir() else 1, p.name.lower()),
            )
            for entry in entries:
                if entry.name in IGNORED_NAMES:
                    continue
                rel = entry.relative_to(pdir).as_posix()
                if entry.is_dir():
                    items.append(
                        FileTreeItem(
                            name=entry.name,
                            path=rel,
                            type="directory",
                            children=walk(entry),
                        )
                    )
                else:
                    items.append(
                        FileTreeItem(
                            name=entry.name,
                            path=rel,
                            type="file",
                            kind=_file_kind(entry.name),  # type: ignore[arg-type]
                        )
                    )
            return items

        return walk(pdir)

    def read_file(self, project_name: str, relative_path: str) -> str:
        pdir = self.get_project_dir(project_name)
        target = _resolve_within(pdir, relative_path)
        if not target.exists() or not target.is_file():
            raise FileNotFoundError(f"File '{relative_path}' not found.")
        return target.read_text(encoding="utf-8")

    def write_file(self, project_name: str, relative_path: str, content: str) -> None:
        pdir = self.get_project_dir(project_name)
        target = _resolve_within(pdir, relative_path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")

    def delete_file(self, project_name: str, relative_path: str) -> None:
        pdir = self.get_project_dir(project_name)
        target = _resolve_within(pdir, relative_path)
        if target.exists() and target.is_file():
            target.unlink()

    def rename_file(self, project_name: str, old_path: str, new_path: str) -> None:
        pdir = self.get_project_dir(project_name)
        src = _resolve_within(pdir, old_path)
        dst = _resolve_within(pdir, new_path)
        if not src.exists():
            raise FileNotFoundError(f"File '{old_path}' not found.")
        if dst.exists():
            raise FileExistsError(f"Destination '{new_path}' already exists.")
        dst.parent.mkdir(parents=True, exist_ok=True)
        src.rename(dst)

    def create_folder(self, project_name: str, relative_path: str) -> None:
        pdir = self.get_project_dir(project_name)
        target = _resolve_within(pdir, relative_path)
        target.mkdir(parents=True, exist_ok=True)

    def generate_master_menu(self, project_name: str, route: str = "/menu") -> dict[str, str]:
        pdir = self.get_project_dir(project_name)
        targets = [t for t in self.list_run_targets(project_name) if t.kind == "form" and t.route != route]
        clean_route = route if route.startswith("/") else f"/{route}"

        nav_buttons: list[WidgetNode] = [
            WidgetNode(
                id="menu_nav_title",
                type="label",
                name="lbl_menu_title",
                props={"text": "PANTALLAS"},
                classes="text-xs font-bold text-slate-500 mb-1",
            )
        ]
        quick_cards: list[WidgetNode] = []

        for idx, t in enumerate(targets, start=1):
            base_name = t.label.split(" (")[0]
            nav_buttons.append(
                WidgetNode(
                    id=f"menu_nav_btn_{idx}",
                    type="button",
                    name=f"btn_nav_{idx}",
                    props={
                        "text": base_name,
                        "color": "primary",
                        "icon": "open_in_new",
                        "actionType": "navigate",
                        "actionTarget": t.route,
                    },
                    classes="w-full",
                    quasarProps="flat no-caps align=left",
                )
            )
            quick_cards.append(
                WidgetNode(
                    id=f"menu_card_{idx}",
                    type="card",
                    name=f"card_form_{idx}",
                    classes="p-4 gap-2 shadow-sm",
                    children=[
                        WidgetNode(
                            id=f"menu_card_lbl_{idx}",
                            type="label",
                            name=f"lbl_card_{idx}",
                            props={"text": base_name},
                            classes="text-base font-bold text-slate-800",
                        ),
                        WidgetNode(
                            id=f"menu_card_route_{idx}",
                            type="badge",
                            name=f"bdg_route_{idx}",
                            props={"text": t.route, "color": "secondary"},
                        ),
                        WidgetNode(
                            id=f"menu_card_btn_{idx}",
                            type="button",
                            name=f"btn_open_{idx}",
                            props={
                                "text": "Abrir pantalla",
                                "color": "primary",
                                "icon": "arrow_forward",
                                "actionType": "navigate",
                                "actionTarget": t.route,
                            },
                            quasarProps="no-caps dense",
                        ),
                    ],
                )
            )

        doc = FormDocument(
            formName="AppMenu",
            settings=FormSettings(
                title=f"{project_name} — Menú Principal",
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
                        id="menu_hdr",
                        type="header",
                        name="hdr_main",
                        props={"elevated": True, "bordered": False},
                        classes="items-center justify-between px-4",
                        children=[
                            WidgetNode(
                                id="menu_btn_toggle",
                                type="button",
                                name="btn_toggle_drawer",
                                props={"text": "", "color": "primary", "icon": "menu"},
                                quasarProps="flat round",
                                events={"on_click": "on_btn_toggle_drawer_click"},
                            ),
                            WidgetNode(
                                id="menu_hdr_lbl",
                                type="label",
                                name="lbl_app_name",
                                props={"text": project_name},
                                classes="text-lg font-bold text-white",
                            ),
                            WidgetNode(id="menu_spc", type="space", name="spc_hdr"),
                            WidgetNode(
                                id="menu_avt",
                                type="avatar",
                                name="avt_app",
                                props={"icon": "apps", "color": "secondary", "size": "sm"},
                            ),
                        ],
                    ),
                    WidgetNode(
                        id="menu_drawer",
                        type="left_drawer",
                        name="drawer_main",
                        props={"value": True, "elevated": True, "bordered": True},
                        classes="p-4 gap-2",
                        children=nav_buttons,
                    ),
                    WidgetNode(
                        id="menu_welcome",
                        type="label",
                        name="lbl_welcome",
                        props={"text": f"Panel Principal — {project_name}"},
                        classes="text-2xl font-bold text-slate-800",
                    ),
                    WidgetNode(
                        id="menu_grid",
                        type="grid",
                        name="grid_screens",
                        props={"columns": 3},
                        classes="w-full gap-4",
                        children=quick_cards,
                    ),
                ],
            ),
        )

        forms_dir = pdir / "forms"
        forms_dir.mkdir(parents=True, exist_ok=True)
        (forms_dir / "app_menu.ngui.json").write_text(doc.model_dump_json(indent=2), encoding="utf-8")
        (forms_dir / "app_menu_designer.py").write_text(generate_designer_code(doc), encoding="utf-8")
        code_behind = (
            "from __future__ import annotations\n\n"
            "from nicegui import ui\n"
            "from forms.app_menu_designer import AppMenuDesigner\n\n\n"
            "class AppMenu(AppMenuDesigner):\n"
            "    def __init__(self) -> None:\n"
            "        self.setup_ui()\n\n"
            "    def on_btn_toggle_drawer_click(self, e=None) -> None:\n"
            "        self.drawer_main.toggle()\n\n\n"
            "def register_page() -> None:\n"
            f"    @ui.page({clean_route!r})\n"
            "    def page() -> None:\n"
            "        AppMenu()\n"
        )
        (forms_dir / "app_menu.py").write_text(code_behind, encoding="utf-8")
        return {
            "formPath": "forms/app_menu.ngui.json",
            "designerPath": "forms/app_menu_designer.py",
            "codeBehindPath": "forms/app_menu.py",
            "route": clean_route,
        }

    def load_form(self, project_name: str, relative_path: str) -> FormDocument:
        raw = self.read_file(project_name, relative_path)
        return FormDocument.model_validate(json.loads(raw))

    def save_form(
        self, project_name: str, relative_path: str, doc: FormDocument
    ) -> tuple[str, str, str, str]:
        pdir = self.get_project_dir(project_name)
        form_file = _resolve_within(pdir, relative_path)
        form_file.parent.mkdir(parents=True, exist_ok=True)
        form_file.write_text(doc.model_dump_json(indent=2), encoding="utf-8")

        base_name = form_file.name
        if base_name.endswith(".ngui.json"):
            stem = base_name[: -len(".ngui.json")]
        else:
            stem = form_file.stem

        designer_file = form_file.parent / f"{stem}_designer.py"
        code_behind_file = form_file.parent / f"{stem}.py"

        def _has_db_binding(node: WidgetNode) -> bool:
            if (node.props or {}).get("dataSourceTable"):
                return True
            return any(_has_db_binding(c) for c in node.children)

        if _has_db_binding(doc.root):
            from app.services.crud_generator_service import _generate_db_helper_py
            from app.services.database_service import load_saved_connection_url

            conn_url = load_saved_connection_url(pdir)
            if conn_url:
                data_dir = pdir / "data"
                data_dir.mkdir(parents=True, exist_ok=True)
                if not (data_dir / "__init__.py").exists():
                    (data_dir / "__init__.py").write_text("", encoding="utf-8")
                (data_dir / "db.py").write_text(_generate_db_helper_py(conn_url), encoding="utf-8")

        generated_code = generate_designer_code(doc)
        designer_file.write_text(generated_code, encoding="utf-8")

        if not code_behind_file.exists():
            code_behind_file.write_text(
                generate_initial_code_behind(doc.formName, route=doc.settings.route),
                encoding="utf-8",
            )

        return (
            form_file.relative_to(pdir).as_posix(),
            designer_file.relative_to(pdir).as_posix(),
            code_behind_file.relative_to(pdir).as_posix(),
            generated_code,
        )

    def list_run_targets(self, project_name: str) -> list[RunTargetItem]:
        pdir = self.get_project_dir(project_name)
        targets: list[RunTargetItem] = [
            RunTargetItem(
                id="project:main.py",
                label="Proyecto (main.py)",
                kind="project",
                entryFile="main.py",
                route="/",
            )
        ]

        forms_dir = pdir / "forms"
        if forms_dir.exists():
            for form_file in sorted(forms_dir.glob("*.ngui.json")):
                try:
                    doc = FormDocument.model_validate(
                        json.loads(form_file.read_text(encoding="utf-8"))
                    )
                    rel = form_file.relative_to(pdir).as_posix()
                    route = doc.settings.route or "/"
                    if not route.startswith("/"):
                        route = f"/{route}"
                    targets.append(
                        RunTargetItem(
                            id=f"form:{rel}",
                            label=f"{doc.formName} ({route})",
                            kind="form",
                            entryFile="main.py",
                            route=route,
                            formPath=rel,
                        )
                    )
                except Exception:
                    continue

        for py_file in sorted(pdir.rglob("*.py")):
            if any(part in IGNORED_NAMES for part in py_file.parts):
                continue
            rel = py_file.relative_to(pdir).as_posix()
            if (
                rel == "main.py"
                or rel.startswith("forms/")
                or rel.startswith("data/")
                or py_file.name == "__init__.py"
            ):
                continue
            targets.append(
                RunTargetItem(
                    id=f"script:{rel}",
                    label=f"Script: {rel}",
                    kind="script",
                    entryFile=rel,
                    route="/",
                )
            )

        return targets
