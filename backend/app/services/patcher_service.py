from __future__ import annotations

import ast
from dataclasses import dataclass

from app.services.codegen_service import sanitize_identifier, to_pascal_case


@dataclass
class PatchResult:
    content: str
    line_number: int
    created: bool
    handler_name: str


def ensure_event_handler(
    source: str,
    form_name: str,
    handler_name: str,
    event_name: str = "on_click",
) -> PatchResult:
    """
    Inspect a code-behind Python file using AST.
    - If `def <handler_name>` already exists on the form class, return its 1-based line number.
    - Otherwise, safely append a new method stub inside the form class without touching user code.
    """
    safe_handler = sanitize_identifier(handler_name, fallback="on_event")
    expected_class = to_pascal_case(form_name)

    try:
        tree = ast.parse(source)
    except SyntaxError:
        # Fallback if user currently has a syntax error in their file: append at bottom
        lines = source.splitlines()
        insert_line = len(lines) + 2
        stub = (
            f"\n\n    def {safe_handler}(self, e=None) -> None:\n"
            f"        ui.notify({safe_handler!r})\n"
        )
        return PatchResult(
            content=source.rstrip() + stub,
            line_number=insert_line,
            created=True,
            handler_name=safe_handler,
        )

    target_class: ast.ClassDef | None = None
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            if node.name == expected_class:
                target_class = node
                break
            if target_class is None:
                target_class = node

    if target_class is not None:
        for item in target_class.body:
            if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)) and item.name == safe_handler:
                return PatchResult(
                    content=source,
                    line_number=item.lineno,
                    created=False,
                    handler_name=safe_handler,
                )

        # Insert right after the last statement of the target class
        lines = source.splitlines(keepends=True)
        end_lineno = target_class.end_lineno or len(lines)
        stub_lines = [
            "\n",
            f"    def {safe_handler}(self, e=None) -> None:\n",
            f'        """Handler for {event_name}."""\n',
            f"        ui.notify(f'Triggered {safe_handler}')\n",
        ]
        # Ensure previous line ends with newline
        if end_lineno > 0 and end_lineno <= len(lines) and not lines[end_lineno - 1].endswith("\n"):
            lines[end_lineno - 1] += "\n"

        new_lines = lines[:end_lineno] + stub_lines + lines[end_lineno:]
        new_method_lineno = end_lineno + 2  # 1-based line of `def ...`
        return PatchResult(
            content="".join(new_lines),
            line_number=new_method_lineno,
            created=True,
            handler_name=safe_handler,
        )

    # No class found in file: append standalone class method or function at bottom
    lines = source.splitlines()
    new_lineno = len(lines) + 2
    stub = (
        f"\n\ndef {safe_handler}(e=None) -> None:\n"
        f'    """Handler for {event_name}."""\n'
        f"    ui.notify(f'Triggered {safe_handler}')\n"
    )
    return PatchResult(
        content=source.rstrip() + stub,
        line_number=new_lineno,
        created=True,
        handler_name=safe_handler,
    )
