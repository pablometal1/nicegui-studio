from __future__ import annotations

import json
import keyword
import re
from typing import Any

from app.models.schemas import FormDocument, WidgetNode

CONTAINER_TYPES = {
    "column",
    "row",
    "card",
    "grid",
    "expansion",
    "scroll_area",
    "dialog",
    "header",
    "footer",
    "left_drawer",
    "right_drawer",
    "carousel",
    "timeline",
    "dropdown_button",
    "button_group",
    "fab",
}

TOP_LEVEL_LAYOUT_TYPES = {
    "header",
    "footer",
    "left_drawer",
    "right_drawer",
}


def sanitize_identifier(name: str, fallback: str = "widget") -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_]", "_", name.strip())
    if not cleaned:
        cleaned = fallback
    if cleaned[0].isdigit():
        cleaned = f"w_{cleaned}"
    if keyword.iskeyword(cleaned):
        cleaned = f"{cleaned}_"
    return cleaned


def to_pascal_case(name: str) -> str:
    parts = re.split(r"[^a-zA-Z0-9]+", name.strip())
    pascal = "".join(p[:1].upper() + p[1:] for p in parts if p)
    if not pascal or pascal[0].isdigit():
        pascal = f"Form{pascal}"
    return pascal


def to_snake_case(name: str) -> str:
    s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name.strip())
    s2 = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1)
    snake = re.sub(r"[^a-zA-Z0-9]+", "_", s2).strip("_").lower()
    return sanitize_identifier(snake, fallback="main_form")


def _py_repr(val: Any) -> str:
    return repr(val)


def _parse_list(raw: Any, default: list[str]) -> list[str]:
    if raw is None:
        return default
    if isinstance(raw, list):
        return raw
    if isinstance(raw, str):
        return [o.strip() for o in raw.split(",") if o.strip()] or default
    return default


def _parse_json_val(raw: Any, default: Any) -> Any:
    if raw is None or raw == "":
        return default
    if isinstance(raw, (dict, list)):
        return raw
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except Exception:
            return default
    return default


def _format_widget_call(node: WidgetNode, used_events: set[str]) -> str:
    """Build the NiceGUI constructor call and chained modifiers for a single node."""
    wtype = node.type
    props = node.props or {}
    events = node.events or {}

    args: list[str] = []
    kwargs: list[str] = []

    def add_kw(key: str, val: Any, skip_empty: bool = True) -> None:
        if val is None:
            return
        if skip_empty and val == "":
            return
        kwargs.append(f"{key}={_py_repr(val)}")

    def bind_event(event_key: str, param_name: str | None = None) -> None:
        handler = events.get(event_key, "").strip()
        if handler:
            safe_handler = sanitize_identifier(handler, fallback=f"on_{node.name}_{event_key}")
            used_events.add(safe_handler)
            pname = param_name or event_key
            kwargs.append(f"{pname}=self.{safe_handler}")

    # --- CONTENEDORES ---
    if wtype == "column":
        call = "ui.column"
    elif wtype == "row":
        call = "ui.row"
    elif wtype == "card":
        call = "ui.card"
    elif wtype == "grid":
        call = "ui.grid"
        cols = props.get("columns", 2)
        add_kw("columns", int(cols) if cols else 2, skip_empty=False)
    elif wtype == "expansion":
        call = "ui.expansion"
        args.append(_py_repr(props.get("text", "Section")))
        add_kw("icon", props.get("icon"))
        if props.get("value") is True:
            add_kw("value", True, skip_empty=False)
    elif wtype == "scroll_area":
        call = "ui.scroll_area"
        bind_event("on_scroll", "on_scroll")
    elif wtype == "dialog":
        call = "ui.dialog"
        if props.get("value") is True:
            add_kw("value", True, skip_empty=False)
    elif wtype in ("header", "footer"):
        call = f"ui.{wtype}"
        if props.get("elevated") is True:
            add_kw("elevated", True, skip_empty=False)
        if props.get("bordered") is True:
            add_kw("bordered", True, skip_empty=False)
    elif wtype in ("left_drawer", "right_drawer"):
        call = f"ui.{wtype}"
        if props.get("elevated") is True:
            add_kw("elevated", True, skip_empty=False)
        if props.get("bordered") is True:
            add_kw("bordered", True, skip_empty=False)
        if props.get("value") is False:
            add_kw("value", False, skip_empty=False)
    elif wtype == "carousel":
        call = "ui.carousel"
        if props.get("animated", True):
            add_kw("animated", True, skip_empty=False)
        if props.get("arrows", True):
            add_kw("arrows", True, skip_empty=False)
        if props.get("navigation", True):
            add_kw("navigation", True, skip_empty=False)
    elif wtype == "timeline":
        call = "ui.timeline"
        add_kw("side", props.get("side"))
        add_kw("layout", props.get("layout"))
        add_kw("color", props.get("color"))
    elif wtype == "dropdown_button":
        call = "ui.dropdown_button"
        args.append(_py_repr(props.get("text", "Opciones")))
        add_kw("color", props.get("color"))
        add_kw("icon", props.get("icon"))
        if props.get("auto_close") is True:
            add_kw("auto_close", True, skip_empty=False)
        if props.get("split") is True:
            add_kw("split", True, skip_empty=False)
        bind_event("on_click", "on_click")
    elif wtype == "button_group":
        call = "ui.button_group"
    elif wtype == "fab":
        call = "ui.fab"
        args.append(_py_repr(props.get("icon", "add")))
        add_kw("label", props.get("label"))
        add_kw("color", props.get("color"))
        add_kw("direction", props.get("direction", "right"))

    # --- BÁSICOS ---
    elif wtype == "label":
        call = "ui.label"
        args.append(_py_repr(props.get("text", "Label")))
    elif wtype == "markdown":
        call = "ui.markdown"
        args.append(_py_repr(props.get("content", "**Markdown**")))
    elif wtype == "html":
        call = "ui.html"
        args.append(_py_repr(props.get("content", "<b>HTML</b>")))
        add_kw("sanitize", False, skip_empty=False)
    elif wtype == "code":
        call = "ui.code"
        args.append(_py_repr(props.get("content", "print('Hola NiceGUI')")))
        add_kw("language", props.get("language", "python"))
    elif wtype == "button":
        call = "ui.button"
        args.append(_py_repr(props.get("text", "Button")))
        add_kw("color", props.get("color"))
        add_kw("icon", props.get("icon"))
        if events.get("on_click", "").strip():
            bind_event("on_click", "on_click")
        else:
            action_type = str(props.get("actionType") or "").strip()
            action_target = str(props.get("actionTarget") or "").strip()
            if action_type == "navigate" and action_target:
                kwargs.append(f"on_click=lambda: ui.navigate.to({_py_repr(action_target)})")
            elif action_type == "navigate_new_tab" and action_target:
                kwargs.append(
                    f"on_click=lambda: ui.navigate.to({_py_repr(action_target)}, new_tab=True)"
                )
            elif action_type == "open_dialog" and action_target:
                dlg_attr = sanitize_identifier(action_target, fallback="dlg_main")
                kwargs.append(f"on_click=lambda: self.{dlg_attr}.open()")
            elif action_type == "navigate_back":
                kwargs.append("on_click=ui.navigate.back")
    elif wtype == "icon":
        call = "ui.icon"
        args.append(_py_repr(props.get("name", "star")))
        add_kw("size", props.get("size"))
        add_kw("color", props.get("color"))
    elif wtype == "badge":
        call = "ui.badge"
        args.append(_py_repr(props.get("text", "NEW")))
        add_kw("color", props.get("color"))
        if props.get("outline") is True:
            add_kw("outline", True, skip_empty=False)
    elif wtype == "chip":
        call = "ui.chip"
        args.append(_py_repr(props.get("text", "Chip")))
        add_kw("icon", props.get("icon"))
        add_kw("color", props.get("color"))
        if props.get("selectable") is True:
            add_kw("selectable", True, skip_empty=False)
        if props.get("removable") is True:
            add_kw("removable", True, skip_empty=False)
        bind_event("on_click", "on_click")
    elif wtype == "link":
        call = "ui.link"
        args.append(_py_repr(props.get("text", "Enlace")))
        args.append(_py_repr(props.get("target", "https://nicegui.io")))
        if props.get("new_tab") is True:
            add_kw("new_tab", True, skip_empty=False)
    elif wtype == "avatar":
        call = "ui.avatar"
        add_kw("icon", props.get("icon", "person"))
        add_kw("color", props.get("color"))
        add_kw("size", props.get("size"))
        if props.get("square") is True:
            add_kw("square", True, skip_empty=False)
    elif wtype == "separator":
        call = "ui.separator"
    elif wtype == "space":
        call = "ui.space"

    # --- ENTRADAS ---
    elif wtype == "input":
        call = "ui.input"
        add_kw("label", props.get("label"))
        add_kw("placeholder", props.get("placeholder"))
        add_kw("value", props.get("value"))
        if props.get("password") is True:
            add_kw("password", True, skip_empty=False)
            add_kw("password_toggle_button", True, skip_empty=False)
        bind_event("on_change", "on_change")
    elif wtype == "textarea":
        call = "ui.textarea"
        add_kw("label", props.get("label"))
        add_kw("placeholder", props.get("placeholder"))
        add_kw("value", props.get("value"))
        bind_event("on_change", "on_change")
    elif wtype == "number":
        call = "ui.number"
        add_kw("label", props.get("label"))
        for k in ("value", "min", "max", "step"):
            if props.get(k) is not None and props.get(k) != "":
                add_kw(k, float(props[k]), skip_empty=False)
        bind_event("on_change", "on_change")
    elif wtype == "select":
        call = "ui.select"
        options = _parse_list(props.get("options"), ["Opción 1", "Opción 2"])
        args.append(_py_repr(options))
        add_kw("label", props.get("label"))
        if props.get("value") is not None and props.get("value") != "":
            add_kw("value", props.get("value"))
        if props.get("multiple") is True:
            add_kw("multiple", True, skip_empty=False)
        bind_event("on_change", "on_change")
    elif wtype == "radio":
        call = "ui.radio"
        options = _parse_list(props.get("options"), ["Opción A", "Opción B"])
        args.append(_py_repr(options))
        add_kw("value", props.get("value"))
        bind_event("on_change", "on_change")
    elif wtype == "toggle":
        call = "ui.toggle"
        options = _parse_list(props.get("options"), ["Uno", "Dos", "Tres"])
        args.append(_py_repr(options))
        add_kw("value", props.get("value"))
        if props.get("clearable") is True:
            add_kw("clearable", True, skip_empty=False)
        bind_event("on_change", "on_change")
    elif wtype == "checkbox":
        call = "ui.checkbox"
        args.append(_py_repr(props.get("text", "Checkbox")))
        if props.get("value") is True:
            add_kw("value", True, skip_empty=False)
        bind_event("on_change", "on_change")
    elif wtype == "switch":
        call = "ui.switch"
        args.append(_py_repr(props.get("text", "Switch")))
        if props.get("value") is True:
            add_kw("value", True, skip_empty=False)
        bind_event("on_change", "on_change")
    elif wtype == "slider":
        call = "ui.slider"
        add_kw("min", float(props.get("min", 0)), skip_empty=False)
        add_kw("max", float(props.get("max", 100)), skip_empty=False)
        add_kw("step", float(props.get("step", 1)), skip_empty=False)
        add_kw("value", float(props.get("value", 50)), skip_empty=False)
        bind_event("on_change", "on_change")
    elif wtype == "range":
        call = "ui.range"
        add_kw("min", float(props.get("min", 0)), skip_empty=False)
        add_kw("max", float(props.get("max", 100)), skip_empty=False)
        add_kw("step", float(props.get("step", 1)), skip_empty=False)
        add_kw(
            "value",
            {
                "min": float(props.get("valueMin", 20)),
                "max": float(props.get("valueMax", 80)),
            },
            skip_empty=False,
        )
        bind_event("on_change", "on_change")
    elif wtype == "knob":
        call = "ui.knob"
        add_kw("value", float(props.get("value", 0.5)), skip_empty=False)
        add_kw("min", float(props.get("min", 0.0)), skip_empty=False)
        add_kw("max", float(props.get("max", 1.0)), skip_empty=False)
        add_kw("step", float(props.get("step", 0.05)), skip_empty=False)
        add_kw("color", props.get("color"))
        if props.get("show_value", True):
            add_kw("show_value", True, skip_empty=False)
        bind_event("on_change", "on_change")
    elif wtype == "date":
        call = "ui.date"
        add_kw("value", props.get("value"))
        add_kw("mask", props.get("mask"))
        bind_event("on_change", "on_change")
    elif wtype == "time":
        call = "ui.time"
        add_kw("value", props.get("value"))
        bind_event("on_change", "on_change")
    elif wtype == "color_input":
        call = "ui.color_input"
        add_kw("label", props.get("label"))
        add_kw("value", props.get("value"))
        bind_event("on_change", "on_change")
    elif wtype == "upload":
        call = "ui.upload"
        add_kw("label", props.get("label"))
        if props.get("multiple") is True:
            add_kw("multiple", True, skip_empty=False)
        if props.get("auto_upload") is True:
            add_kw("auto_upload", True, skip_empty=False)
        bind_event("on_upload", "on_upload")
    elif wtype == "editor":
        call = "ui.editor"
        add_kw("placeholder", props.get("placeholder"))
        add_kw("value", props.get("value"))
        bind_event("on_change", "on_change")
    elif wtype == "input_chips":
        call = "ui.input_chips"
        add_kw("label", props.get("label"))
        add_kw("value", _parse_list(props.get("value"), ["Tag 1", "Tag 2"]), skip_empty=False)
        if props.get("clearable") is True:
            add_kw("clearable", True, skip_empty=False)
        bind_event("on_change", "on_change")
    elif wtype == "rating":
        call = "ui.rating"
        add_kw("value", float(props.get("value", 3)), skip_empty=False)
        add_kw("max", int(props.get("max", 5)), skip_empty=False)
        add_kw("icon", props.get("icon"))
        add_kw("color", props.get("color"))
        add_kw("size", props.get("size"))
        bind_event("on_change", "on_change")
    elif wtype == "joystick":
        call = "ui.joystick"
        add_kw("color", props.get("color", "blue"))
        add_kw("size", int(props.get("size", 80)), skip_empty=False)
        bind_event("on_move", "on_move")
    elif wtype == "codemirror":
        call = "ui.codemirror"
        args.append(_py_repr(props.get("value", "print('Hola CodeMirror')")))
        add_kw("language", props.get("language", "Python"))
        add_kw("theme", props.get("theme", "vscodeDark"))
        if props.get("line_wrapping") is True:
            add_kw("line_wrapping", True, skip_empty=False)
        bind_event("on_change", "on_change")
    elif wtype == "xterm":
        call = "ui.xterm"
        bind_event("on_data", "on_data")
    elif wtype == "color_picker":
        call = "ui.color_picker"
        bind_event("on_pick", "on_pick")
    elif wtype == "date_input":
        call = "ui.date_input"
        add_kw("label", props.get("label"))
        add_kw("value", props.get("value"))
        add_kw("placeholder", props.get("placeholder"))
        if props.get("range_input") is True:
            add_kw("range_input", True, skip_empty=False)
        bind_event("on_change", "on_change")
    elif wtype == "time_input":
        call = "ui.time_input"
        add_kw("label", props.get("label"))
        add_kw("value", props.get("value"))
        add_kw("placeholder", props.get("placeholder"))
        bind_event("on_change", "on_change")

    # --- DATOS Y VISUALIZACIÓN ---
    elif wtype == "table":
        call = "ui.table"
        cols = _parse_json_val(
            props.get("columns"),
            [
                {"name": "name", "label": "Nombre", "field": "name", "align": "left"},
                {"name": "age", "label": "Edad", "field": "age"},
            ],
        )
        rows = _parse_json_val(
            props.get("rows"),
            [
                {"name": "Ana", "age": 28},
                {"name": "Luis", "age": 34},
            ],
        )
        add_kw("columns", cols, skip_empty=False)
        add_kw("rows", rows, skip_empty=False)
        add_kw("row_key", props.get("row_key", "name"))
        add_kw("title", props.get("title"))
        if props.get("selection") in ("single", "multiple"):
            add_kw("selection", props.get("selection"))
        bind_event("on_select", "on_select")
    elif wtype == "aggrid":
        call = "ui.aggrid"
        options = _parse_json_val(
            props.get("options"),
            {
                "columnDefs": [
                    {"headerName": "Nombre", "field": "name"},
                    {"headerName": "Rol", "field": "role"},
                ],
                "rowData": [
                    {"name": "Ana", "role": "Admin"},
                    {"name": "Carlos", "role": "Dev"},
                ],
            },
        )
        args.append(_py_repr(options))
    elif wtype == "tree":
        call = "ui.tree"
        nodes = _parse_json_val(
            props.get("nodes"),
            [
                {"id": "1", "label": "Raíz", "children": [{"id": "2", "label": "Elemento A"}, {"id": "3", "label": "Elemento B"}]}
            ],
        )
        args.append(_py_repr(nodes))
        add_kw("label_key", props.get("label_key", "label"))
        bind_event("on_select", "on_select")
    elif wtype == "json_editor":
        call = "ui.json_editor"
        content = _parse_json_val(props.get("content"), {"nombre": "NiceGUI", "activo": True})
        args.append(_py_repr({"content": {"json": content}}))
        bind_event("on_change", "on_change")
    elif wtype == "log":
        call = "ui.log"
        if props.get("max_lines"):
            add_kw("max_lines", int(props["max_lines"]), skip_empty=False)
    elif wtype == "echart":
        call = "ui.echart"
        options = _parse_json_val(
            props.get("options"),
            {
                "xAxis": {"type": "category", "data": ["Lun", "Mar", "Mié", "Jue", "Vie"]},
                "yAxis": {"type": "value"},
                "series": [{"type": "bar", "data": [120, 200, 150, 80, 170]}],
            },
        )
        args.append(_py_repr(options))
        bind_event("on_point_click", "on_point_click")
    elif wtype == "highchart":
        call = "ui.highchart"
        options = _parse_json_val(
            props.get("options"),
            {
                "title": {"text": "Ventas"},
                "chart": {"type": "bar"},
                "xAxis": {"categories": ["A", "B", "C"]},
                "series": [{"name": "2026", "data": [10, 25, 18]}],
            },
        )
        args.append(_py_repr(options))
    elif wtype == "uplot":
        call = "ui.uplot"
        options = _parse_json_val(
            props.get("options"),
            {
                "title": "Serie Temporal (uPlot)",
                "width": 500,
                "height": 260,
                "series": [{}, {"label": "Serie 1", "stroke": "#1976d2"}],
            },
        )
        data = _parse_json_val(props.get("data"), [[1, 2, 3, 4, 5], [10, 22, 18, 35, 29]])
        args.append(_py_repr(options))
        args.append(_py_repr(data))
    elif wtype == "plotly":
        call = "ui.plotly"
        figure = _parse_json_val(
            props.get("figure"),
            {
                "data": [{"type": "scatter", "x": [1, 2, 3, 4], "y": [10, 15, 13, 17], "name": "Serie"}],
                "layout": {"title": {"text": "Gráfico Plotly"}, "margin": {"l": 35, "r": 15, "t": 35, "b": 30}},
            },
        )
        args.append(_py_repr(figure))
    elif wtype == "line_plot":
        call = "ui.line_plot"
        add_kw("n", int(props.get("n", 1)), skip_empty=False)
        add_kw("limit", int(props.get("limit", 100)), skip_empty=False)
        add_kw("update_every", int(props.get("update_every", 1)), skip_empty=False)
    elif wtype == "pyplot":
        call = "ui.pyplot"
        w = float(props.get("width", 5))
        h = float(props.get("height", 3))
        add_kw("figsize", (w, h), skip_empty=False)
        add_kw("close", bool(props.get("close", True)), skip_empty=False)
    elif wtype == "matplotlib":
        call = "ui.matplotlib"
        w = float(props.get("width", 5))
        h = float(props.get("height", 3))
        add_kw("figsize", (w, h), skip_empty=False)
    elif wtype == "altair":
        call = "ui.altair"
        spec = _parse_json_val(
            props.get("spec"),
            {
                "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
                "data": {"values": [{"x": "A", "y": 28}, {"x": "B", "y": 55}, {"x": "C", "y": 43}]},
                "mark": "bar",
                "encoding": {"x": {"field": "x", "type": "nominal"}, "y": {"field": "y", "type": "quantitative"}},
            },
        )
        args.append(_py_repr(spec))
    elif wtype == "anywidget":
        call = "ui.label"
        args.append(_py_repr(props.get("placeholder", "AnyWidget (asigna tu widget en Code-Behind)")))
    elif wtype == "scene":
        call = "ui.scene"
        add_kw("width", int(props.get("width", 480)), skip_empty=False)
        add_kw("height", int(props.get("height", 300)), skip_empty=False)
        add_kw("background_color", props.get("background_color", "#eeeeee"))
        add_kw("control_type", props.get("control_type", "orbit"))
        if props.get("grid", True) is False:
            add_kw("grid", False, skip_empty=False)
        bind_event("on_click", "on_click")
    elif wtype == "leaflet":
        call = "ui.leaflet"
        lat = float(props.get("lat", -34.6037))
        lng = float(props.get("lng", -58.3816))
        add_kw("center", (lat, lng), skip_empty=False)
        add_kw("zoom", int(props.get("zoom", 12)), skip_empty=False)
        if props.get("draw_control") is True:
            add_kw("draw_control", True, skip_empty=False)
    elif wtype == "linear_progress":
        call = "ui.linear_progress"
        add_kw("value", float(props.get("value", 0.65)), skip_empty=False)
        add_kw("size", props.get("size"))
        add_kw("color", props.get("color"))
        add_kw("show_value", bool(props.get("show_value", True)), skip_empty=False)
    elif wtype == "circular_progress":
        call = "ui.circular_progress"
        add_kw("value", float(props.get("value", 0.7)), skip_empty=False)
        add_kw("min", float(props.get("min", 0.0)), skip_empty=False)
        add_kw("max", float(props.get("max", 1.0)), skip_empty=False)
        add_kw("size", props.get("size", "xl"))
        add_kw("color", props.get("color"))
        add_kw("show_value", bool(props.get("show_value", True)), skip_empty=False)
    elif wtype == "spinner":
        call = "ui.spinner"
        add_kw("type", props.get("spinnerType", "default"))
        add_kw("size", props.get("size", "lg"))
        add_kw("color", props.get("color"))

    # --- MULTIMEDIA Y NAVEGACIÓN ---
    elif wtype == "image":
        call = "ui.image"
        args.append(_py_repr(props.get("source", "https://picsum.photos/id/377/640/360")))
    elif wtype == "audio":
        call = "ui.audio"
        args.append(_py_repr(props.get("src", "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3")))
        add_kw("controls", bool(props.get("controls", True)), skip_empty=False)
        if props.get("autoplay") is True:
            add_kw("autoplay", True, skip_empty=False)
        if props.get("loop") is True:
            add_kw("loop", True, skip_empty=False)
    elif wtype == "video":
        call = "ui.video"
        args.append(_py_repr(props.get("src", "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4")))
        add_kw("controls", bool(props.get("controls", True)), skip_empty=False)
        if props.get("autoplay") is True:
            add_kw("autoplay", True, skip_empty=False)
        if props.get("loop") is True:
            add_kw("loop", True, skip_empty=False)
    elif wtype == "pagination":
        call = "ui.pagination"
        args.append(_py_repr(int(props.get("min", 1))))
        args.append(_py_repr(int(props.get("max", 5))))
        if props.get("direction_links", True):
            add_kw("direction_links", True, skip_empty=False)
        bind_event("on_change", "on_change")
    elif wtype == "chat_message":
        call = "ui.chat_message"
        add_kw("text", props.get("text", "¡Hola desde NiceGUI!"))
        add_kw("name", props.get("name", "Asistente"))
        add_kw("stamp", props.get("stamp", "ahora"))
        add_kw("avatar", props.get("avatar"))
        if props.get("sent") is True:
            add_kw("sent", True, skip_empty=False)
    else:
        call = f"ui.{sanitize_identifier(wtype, 'element')}"

    all_args = ", ".join(args + kwargs)
    expr = f"{call}({all_args})"

    if node.classes and node.classes.strip():
        expr += f".classes({_py_repr(node.classes.strip())})"
    if node.quasarProps and node.quasarProps.strip():
        expr += f".props({_py_repr(node.quasarProps.strip())})"
    if node.style and node.style.strip():
        expr += f".style({_py_repr(node.style.strip())})"

    return expr


def generate_designer_code(doc: FormDocument) -> str:
    """Generate clean, deterministic NiceGUI Python code for *_designer.py."""
    class_base = to_pascal_case(doc.formName)
    designer_class = f"{class_base}Designer"

    used_names: set[str] = set()
    used_events: set[str] = set()
    uses_db = False
    uses_storage = False
    deferred_bindings: list[tuple[str, WidgetNode]] = []
    body_lines: list[str] = []

    def unique_attr_name(node: WidgetNode) -> str:
        base = sanitize_identifier(node.name or node.type, fallback=node.type)
        candidate = base
        idx = 2
        while candidate in used_names:
            candidate = f"{base}_{idx}"
            idx += 1
        used_names.add(candidate)
        return candidate

    def emit_node(node: WidgetNode, indent: int) -> None:
        nonlocal uses_db, uses_storage
        pad = " " * indent
        attr = unique_attr_name(node)
        expr = _format_widget_call(node, used_events)
        is_container = node.type in CONTAINER_TYPES or bool(node.children)

        if node.bindings:
            deferred_bindings.append((attr, node))
            if any(b.mode == "storage_user" for b in node.bindings):
                uses_storage = True

        if is_container:
            body_lines.append(f"{pad}self.{attr} = {expr}")
            if node.children:
                body_lines.append(f"{pad}with self.{attr}:")
                for child in node.children:
                    emit_node(child, indent + 4)
        else:
            body_lines.append(f"{pad}self.{attr} = {expr}")

        # Auto Data-Binding for table / aggrid / select / echart connected to a database table
        ds_table = str((node.props or {}).get("dataSourceTable") or "").strip()
        if ds_table and node.type in ("table", "aggrid"):
            uses_db = True
            body_lines.append(f"{pad}try:")
            if node.type == "aggrid":
                body_lines.append(f"{pad}    self.{attr}.options['rowData'] = db.fetch_all({ds_table!r})")
                body_lines.append(f"{pad}    self.{attr}.update()")
            else:
                body_lines.append(f"{pad}    self.{attr}.rows = db.fetch_all({ds_table!r})")
                body_lines.append(f"{pad}    self.{attr}.update()")
            body_lines.append(f"{pad}except Exception as _db_exc:")
            body_lines.append(f"{pad}    ui.notify(f'Error cargando tabla {ds_table}: {{_db_exc}}', type='negative')")
        elif ds_table and node.type in ("select", "radio", "toggle"):
            uses_db = True
            val_col = str((node.props or {}).get("dataSourceValueCol") or "id").strip()
            lbl_col = str((node.props or {}).get("dataSourceLabelCol") or "").strip()
            body_lines.append(f"{pad}try:")
            if lbl_col:
                body_lines.append(f"{pad}    _rows = db.fetch_all({ds_table!r})")
                body_lines.append(
                    f"{pad}    self.{attr}.set_options({{r.get({val_col!r}): str(r.get({lbl_col!r}, r.get({val_col!r}))) for r in _rows}})"
                )
            else:
                body_lines.append(
                    f"{pad}    self.{attr}.set_options(db.fetch_options({ds_table!r}, {val_col!r}))"
                )
            body_lines.append(f"{pad}except Exception as _db_exc:")
            body_lines.append(f"{pad}    ui.notify(f'Error cargando opciones {ds_table}: {{_db_exc}}', type='negative')")
        elif ds_table and node.type == "echart":
            uses_db = True
            x_col = str((node.props or {}).get("dataSourceXCol") or "").strip()
            y_col = str((node.props or {}).get("dataSourceYCol") or "").strip()
            chart_type = str((node.props or {}).get("dataSourceChartType") or "bar").strip()
            if x_col and y_col:
                body_lines.append(f"{pad}try:")
                body_lines.append(f"{pad}    _crows = db.fetch_all({ds_table!r})")
                if chart_type == "pie":
                    body_lines.append(
                        f"{pad}    self.{attr}.options['series'] = [{{'type': 'pie', 'radius': '60%', 'data': [{{'name': str(r.get({x_col!r}, '')), 'value': float(r.get({y_col!r}) or 0)}} for r in _crows]}}]"
                    )
                    body_lines.append(f"{pad}    self.{attr}.options.pop('xAxis', None)")
                    body_lines.append(f"{pad}    self.{attr}.options.pop('yAxis', None)")
                else:
                    body_lines.append(
                        f"{pad}    self.{attr}.options['xAxis'] = {{'type': 'category', 'data': [str(r.get({x_col!r}, '')) for r in _crows]}}"
                    )
                    body_lines.append(f"{pad}    self.{attr}.options['yAxis'] = {{'type': 'value'}}")
                    body_lines.append(
                        f"{pad}    self.{attr}.options['series'] = [{{'name': {y_col!r}, 'type': {chart_type!r}, 'data': [float(r.get({y_col!r}) or 0) for r in _crows]}}]"
                    )
                body_lines.append(f"{pad}    self.{attr}.update()")
                body_lines.append(f"{pad}except Exception as _db_exc:")
                body_lines.append(f"{pad}    ui.notify(f'Error cargando gráfico {ds_table}: {{_db_exc}}', type='negative')")
        elif ds_table and node.type == "highchart":
            uses_db = True
            x_col = str((node.props or {}).get("dataSourceXCol") or "").strip()
            y_col = str((node.props or {}).get("dataSourceYCol") or "").strip()
            chart_type = str((node.props or {}).get("dataSourceChartType") or "bar").strip()
            if x_col and y_col:
                body_lines.append(f"{pad}try:")
                body_lines.append(f"{pad}    _crows = db.fetch_all({ds_table!r})")
                body_lines.append(f"{pad}    self.{attr}.options['chart'] = {{'type': {chart_type!r}}}")
                if chart_type == "pie":
                    body_lines.append(
                        f"{pad}    self.{attr}.options['series'] = [{{'name': {y_col!r}, 'data': [{{'name': str(r.get({x_col!r}, '')), 'y': float(r.get({y_col!r}) or 0)}} for r in _crows]}}]"
                    )
                else:
                    body_lines.append(
                        f"{pad}    self.{attr}.options['xAxis'] = {{'categories': [str(r.get({x_col!r}, '')) for r in _crows]}}"
                    )
                    body_lines.append(
                        f"{pad}    self.{attr}.options['series'] = [{{'name': {y_col!r}, 'data': [float(r.get({y_col!r}) or 0) for r in _crows]}}]"
                    )
                body_lines.append(f"{pad}    self.{attr}.update()")
                body_lines.append(f"{pad}except Exception as _db_exc:")
                body_lines.append(f"{pad}    ui.notify(f'Error cargando Highchart {ds_table}: {{_db_exc}}', type='negative')")
        elif ds_table and node.type == "plotly":
            uses_db = True
            x_col = str((node.props or {}).get("dataSourceXCol") or "").strip()
            y_col = str((node.props or {}).get("dataSourceYCol") or "").strip()
            chart_type = str((node.props or {}).get("dataSourceChartType") or "bar").strip()
            if x_col and y_col:
                body_lines.append(f"{pad}try:")
                body_lines.append(f"{pad}    _crows = db.fetch_all({ds_table!r})")
                if chart_type == "pie":
                    body_lines.append(
                        f"{pad}    self.{attr}.figure['data'] = [{{'type': 'pie', 'labels': [str(r.get({x_col!r}, '')) for r in _crows], 'values': [float(r.get({y_col!r}) or 0) for r in _crows]}}]"
                    )
                else:
                    ptype = "scatter" if chart_type == "line" else chart_type
                    body_lines.append(
                        f"{pad}    self.{attr}.figure['data'] = [{{'type': {ptype!r}, 'name': {y_col!r}, 'x': [str(r.get({x_col!r}, '')) for r in _crows], 'y': [float(r.get({y_col!r}) or 0) for r in _crows]}}]"
                    )
                body_lines.append(f"{pad}    self.{attr}.update()")
                body_lines.append(f"{pad}except Exception as _db_exc:")
                body_lines.append(f"{pad}    ui.notify(f'Error cargando Plotly {ds_table}: {{_db_exc}}', type='negative')")
        elif ds_table and node.type == "uplot":
            uses_db = True
            y_col = str((node.props or {}).get("dataSourceYCol") or "").strip()
            if y_col:
                body_lines.append(f"{pad}try:")
                body_lines.append(f"{pad}    _crows = db.fetch_all({ds_table!r})")
                body_lines.append(
                    f"{pad}    self.{attr}.data = [list(range(1, len(_crows) + 1)), [float(r.get({y_col!r}) or 0) for r in _crows]]"
                )
                body_lines.append(f"{pad}    self.{attr}.update()")
                body_lines.append(f"{pad}except Exception as _db_exc:")
                body_lines.append(f"{pad}    ui.notify(f'Error cargando uPlot {ds_table}: {{_db_exc}}', type='negative')")
        elif ds_table and node.type == "tree":
            uses_db = True
            val_col = str((node.props or {}).get("dataSourceValueCol") or "id").strip()
            lbl_col = str((node.props or {}).get("dataSourceLabelCol") or "nombre").strip()
            body_lines.append(f"{pad}try:")
            body_lines.append(f"{pad}    _trows = db.fetch_all({ds_table!r})")
            body_lines.append(
                f"{pad}    self.{attr}._props['nodes'] = [{{'id': str(r.get({val_col!r}, i)), 'label': str(r.get({lbl_col!r}, r.get({val_col!r}, '')))}} for i, r in enumerate(_trows)]"
            )
            body_lines.append(f"{pad}    self.{attr}.update()")
            body_lines.append(f"{pad}except Exception as _db_exc:")
            body_lines.append(f"{pad}    ui.notify(f'Error cargando Tree {ds_table}: {{_db_exc}}', type='negative')")
        elif ds_table and node.type == "leaflet":
            uses_db = True
            lat_col = str((node.props or {}).get("dataSourceLatCol") or "lat").strip()
            lng_col = str((node.props or {}).get("dataSourceLngCol") or "lng").strip()
            body_lines.append(f"{pad}try:")
            body_lines.append(f"{pad}    for _mr in db.fetch_all({ds_table!r}):")
            body_lines.append(
                f"{pad}        if _mr.get({lat_col!r}) is not None and _mr.get({lng_col!r}) is not None:"
            )
            body_lines.append(
                f"{pad}            self.{attr}.marker(latlng=(float(_mr[{lat_col!r}]), float(_mr[{lng_col!r}])))"
            )
            body_lines.append(f"{pad}except Exception as _db_exc:")
            body_lines.append(f"{pad}    ui.notify(f'Error cargando marcadores {ds_table}: {{_db_exc}}', type='negative')")

    # NiceGUI requires top-level layout elements (header, footer, left_drawer, right_drawer)
    # to be direct children of the page, outside any `with ui.column():` container.
    root = doc.root
    top_level_children = [c for c in root.children if c.type in TOP_LEVEL_LAYOUT_TYPES]
    content_children = [c for c in root.children if c.type not in TOP_LEVEL_LAYOUT_TYPES]

    for child in top_level_children:
        emit_node(child, 8)

    # Emit root content container
    root_classes = root.classes.strip() or doc.settings.rootClasses.strip()
    root_expr = "ui.column()"
    if root_classes:
        root_expr += f".classes({_py_repr(root_classes)})"
    if root.style and root.style.strip():
        root_expr += f".style({_py_repr(root.style.strip())})"

    body_lines.append(f"        self.root = {root_expr}")
    if content_children:
        body_lines.append("        with self.root:")
        for child in content_children:
            emit_node(child, 12)

    # Emit reactive NiceGUI Binding Properties after all widgets exist
    if deferred_bindings:
        body_lines.append("")
        body_lines.append("        # Reactive Property Bindings")
        for attr, bnode in deferred_bindings:
            for b in bnode.bindings:
                prop = sanitize_identifier(b.property, fallback="value")
                transform = (b.transform or "").strip()
                if b.mode == "storage_user":
                    key = (b.storageKey or f"{attr}_{prop}").strip()
                    body_lines.append(
                        f"        self.{attr}.bind_{prop}(app.storage.user, {_py_repr(key)})"
                    )
                elif b.sourceControl.strip():
                    src_attr = sanitize_identifier(b.sourceControl, fallback="widget")
                    src_prop = sanitize_identifier(b.sourceProperty or "value", fallback="value")
                    if b.mode == "two_way":
                        body_lines.append(
                            f"        self.{attr}.bind_{prop}(self.{src_attr}, {_py_repr(src_prop)})"
                        )
                    else:
                        if transform:
                            body_lines.append(
                                f"        self.{attr}.bind_{prop}_from(self.{src_attr}, {_py_repr(src_prop)}, backward=lambda v: {transform})"
                            )
                        else:
                            body_lines.append(
                                f"        self.{attr}.bind_{prop}_from(self.{src_attr}, {_py_repr(src_prop)})"
                            )

    nicegui_import = "from nicegui import app, ui" if uses_storage else "from nicegui import ui"
    lines: list[str] = [
        "# =============================================================================",
        "# AUTO-GENERATED BY Quantum-RAD Studio — DO NOT EDIT THIS FILE DIRECTLY",
        "# Changes will be overwritten whenever the visual form is saved.",
        f"# Edit your application logic in {to_snake_case(doc.formName)}.py instead.",
        "# =============================================================================",
        "from __future__ import annotations",
        "",
        nicegui_import,
        *(["from data.db import db"] if uses_db else []),
        "",
        "",
        f"class {designer_class}:",
        f'    """Auto-generated NiceGUI layout for {class_base}."""',
        "",
        "    def setup_ui(self) -> None:",
    ]

    if doc.settings.title:
        lines.append(f"        ui.page_title({_py_repr(doc.settings.title)})")
    if doc.settings.dark is True:
        lines.append("        ui.dark_mode().enable()")
    elif doc.settings.dark is False:
        lines.append("        ui.dark_mode().disable()")

    bg_parts: list[str] = []
    if doc.settings.pageBackground and doc.settings.pageBackground.strip():
        bg_parts.append(f"background: {doc.settings.pageBackground.strip()};")
    if doc.settings.pageBackgroundImage and doc.settings.pageBackgroundImage.strip():
        img_url = doc.settings.pageBackgroundImage.strip().replace("'", "\\'")
        bg_parts.append(
            f"background-image: url('{img_url}'); background-size: cover; background-position: center; background-attachment: fixed;"
        )
    if bg_parts:
        lines.append(f"        ui.query('body').style({_py_repr(' '.join(bg_parts))})")

    lines.extend(body_lines)

    # Emit default no-op event hooks so the designer base class is always runnable standalone
    if used_events:
        lines.append("")
        for handler in sorted(used_events):
            lines.append(f"    def {handler}(self, e=None) -> None:")
            lines.append("        pass")
            lines.append("")
    else:
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def generate_initial_code_behind(form_name: str, route: str = "/") -> str:
    """Generate the initial user-editable code-behind file (<form_name>.py)."""
    class_name = to_pascal_case(form_name)
    snake = to_snake_case(form_name)
    designer_class = f"{class_name}Designer"
    return (
        "from __future__ import annotations\n\n"
        "from nicegui import ui\n"
        f"from forms.{snake}_designer import {designer_class}\n\n\n"
        f"class {class_name}({designer_class}):\n"
        f'    """Code-behind for {class_name}. Write your event handlers and logic here."""\n\n'
        "    def __init__(self) -> None:\n"
        "        self.setup_ui()\n\n"
        "    # Event handlers generated from the Visual Designer will appear below.\n"
        "\n\n"
        f"def register_page() -> None:\n"
        f"    @ui.page({route!r})\n"
        f"    def page() -> None:\n"
        f"        {class_name}()\n"
    )
