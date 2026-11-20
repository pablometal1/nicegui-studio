from __future__ import annotations

import json
import re
import sqlite3
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, inspect, text

from app.models.schemas import (
    ColumnDefinitionInput,
    ColumnSchema,
    DatabaseStateResponse,
    ForeignKeyRef,
    TableRowsResponse,
    TableSchema,
)

DB_CONFIG_FILE = "database.ngdb.json"


def _resolve_connection_url(connection_url: str, project_dir: Path) -> str:
    """Resolve relative sqlite:///... URLs against the project directory."""
    url = connection_url.strip()
    if url.startswith("sqlite:///") and not url.startswith("sqlite:////"):
        rel = url[len("sqlite:///") :]
        if not Path(rel).is_absolute():
            abs_path = (project_dir / rel).resolve()
            return f"sqlite:///{abs_path.as_posix()}"
    return url


def map_sql_type_to_widget(sql_type: str, has_fk: bool = False) -> str:
    if has_fk:
        return "select"
    t = sql_type.upper()
    if "BOOL" in t:
        return "switch"
    if any(k in t for k in ("INT", "FLOAT", "DOUBLE", "REAL", "NUM", "DEC")):
        return "number"
    if "DATETIME" in t or "TIMESTAMP" in t:
        return "input"
    if "DATE" in t:
        return "date"
    if "TIME" in t:
        return "time"
    if "TEXT" in t or "CLOB" in t:
        return "textarea"
    return "input"


def load_saved_connection_url(project_dir: Path) -> str | None:
    cfg = project_dir / DB_CONFIG_FILE
    if not cfg.exists():
        return None
    try:
        data = json.loads(cfg.read_text(encoding="utf-8"))
        return data.get("connectionUrl")
    except Exception:
        return None


def save_connection_url(project_dir: Path, connection_url: str) -> None:
    cfg = project_dir / DB_CONFIG_FILE
    cfg.write_text(
        json.dumps({"connectionUrl": connection_url.strip()}, indent=2),
        encoding="utf-8",
    )


def introspect_database(connection_url: str, project_dir: Path) -> DatabaseStateResponse:
    resolved_url = _resolve_connection_url(connection_url, project_dir)
    try:
        engine = create_engine(resolved_url, future=True)
        insp = inspect(engine)
        table_names = insp.get_table_names()
        tables: list[TableSchema] = []

        for tname in sorted(table_names):
            if tname.startswith("sqlite_"):
                continue
            pk_info = insp.get_pk_constraint(tname) or {}
            pk_cols = set(pk_info.get("constrained_columns") or [])
            fk_map: dict[str, ForeignKeyRef] = {}
            for fk in insp.get_foreign_keys(tname) or []:
                constrained = fk.get("constrained_columns") or []
                referred_cols = fk.get("referred_columns") or []
                referred_table = fk.get("referred_table")
                if constrained and referred_cols and referred_table:
                    fk_map[constrained[0]] = ForeignKeyRef(
                        referredTable=referred_table,
                        referredColumn=referred_cols[0],
                    )

            cols: list[ColumnSchema] = []
            for col in insp.get_columns(tname):
                cname = col["name"]
                stype = str(col["type"])
                is_pk = cname in pk_cols
                auto_raw: Any = col.get("autoincrement", False)
                is_auto = bool(
                    auto_raw is True
                    or (is_pk and "INT" in stype.upper())
                )
                fk_ref = fk_map.get(cname)
                cols.append(
                    ColumnSchema(
                        name=cname,
                        sqlType=stype,
                        widgetType=map_sql_type_to_widget(stype, has_fk=fk_ref is not None),
                        nullable=bool(col.get("nullable", True)),
                        primaryKey=is_pk,
                        autoincrement=is_auto,
                        foreignKey=fk_ref,
                    )
                )

            primary_key = next((c.name for c in cols if c.primaryKey), None)
            tables.append(TableSchema(name=tname, primaryKey=primary_key, columns=cols))

        engine.dispose()
        return DatabaseStateResponse(
            connectionUrl=connection_url,
            connected=True,
            tables=tables,
        )
    except Exception as exc:
        return DatabaseStateResponse(
            connectionUrl=connection_url,
            connected=False,
            error=str(exc),
            tables=[],
        )


def get_database_state(project_dir: Path) -> DatabaseStateResponse:
    url = load_saved_connection_url(project_dir)
    if not url:
        return DatabaseStateResponse(connectionUrl=None, connected=False, tables=[])
    return introspect_database(url, project_dir)


def create_sample_sqlite(project_dir: Path) -> DatabaseStateResponse:
    data_dir = project_dir / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    db_file = data_dir / "app.db"

    conn = sqlite3.connect(db_file)
    try:
        cur = conn.cursor()
        cur.executescript(
            """
            CREATE TABLE IF NOT EXISTS categorias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre VARCHAR(100) NOT NULL,
                descripcion TEXT
            );

            CREATE TABLE IF NOT EXISTS productos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre VARCHAR(120) NOT NULL,
                precio REAL NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0,
                activo BOOLEAN NOT NULL DEFAULT 1,
                categoria_id INTEGER,
                fecha_alta DATE,
                FOREIGN KEY (categoria_id) REFERENCES categorias(id)
            );

            CREATE TABLE IF NOT EXISTS clientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre VARCHAR(120) NOT NULL,
                email VARCHAR(150) NOT NULL,
                telefono VARCHAR(40),
                activo BOOLEAN NOT NULL DEFAULT 1
            );
            """
        )

        # Seed only if empty
        if cur.execute("SELECT COUNT(*) FROM categorias").fetchone()[0] == 0:
            cur.executemany(
                "INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)",
                [
                    ("Electrónica", "Computadoras, monitores y accesorios"),
                    ("Oficina", "Sillas, escritorios e insumos"),
                    ("Software", "Licencias y suscripciones"),
                ],
            )

        if cur.execute("SELECT COUNT(*) FROM productos").fetchone()[0] == 0:
            cur.executemany(
                "INSERT INTO productos (nombre, precio, stock, activo, categoria_id, fecha_alta) VALUES (?, ?, ?, ?, ?, ?)",
                [
                    ("Laptop Pro 14", 1499.99, 12, 1, 1, "2026-01-15"),
                    ("Monitor 4K 27\"", 429.50, 25, 1, 1, "2026-02-01"),
                    ("Silla Ergonómica", 310.00, 8, 1, 2, "2026-02-10"),
                    ("NiceGUI Enterprise", 199.00, 99, 1, 3, "2026-03-01"),
                ],
            )

        if cur.execute("SELECT COUNT(*) FROM clientes").fetchone()[0] == 0:
            cur.executemany(
                "INSERT INTO clientes (nombre, email, telefono, activo) VALUES (?, ?, ?, ?)",
                [
                    ("Ana García", "ana@empresa.com", "+54 11 5555-0101", 1),
                    ("Luis Martínez", "luis@estudio.io", "+54 11 5555-0202", 1),
                    ("Sofía López", "sofia@tech.dev", "+54 11 5555-0303", 0),
                ],
            )

        conn.commit()
    finally:
        conn.close()

    rel_url = "sqlite:///data/app.db"
    save_connection_url(project_dir, rel_url)
    return introspect_database(rel_url, project_dir)


ALLOWED_SQL_TYPE_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9_ ()]*$")


def _safe_sql_ident(name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_]", "_", name.strip())
    if not cleaned or cleaned[0].isdigit():
        raise ValueError(f"Identificador SQL inválido: '{name}'")
    return cleaned


def _safe_sql_type(sql_type: str) -> str:
    cleaned = sql_type.strip().upper()
    if not cleaned or not ALLOWED_SQL_TYPE_PATTERN.match(cleaned):
        raise ValueError(f"Tipo SQL inválido: '{sql_type}'")
    return cleaned


def create_sqlite_database(
    project_dir: Path, file_name: str = "app.db", with_sample_tables: bool = False
) -> DatabaseStateResponse:
    raw = re.sub(r"[^a-zA-Z0-9_.-]", "_", file_name.strip())
    if not raw:
        raw = "app.db"
    if not raw.endswith(".db") and not raw.endswith(".sqlite"):
        raw = f"{raw}.db"

    data_dir = project_dir / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    db_file = data_dir / raw

    conn = sqlite3.connect(db_file)
    conn.close()

    rel_url = f"sqlite:///data/{raw}"
    save_connection_url(project_dir, rel_url)

    if with_sample_tables:
        conn = sqlite3.connect(db_file)
        try:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS categorias (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre VARCHAR(100) NOT NULL,
                    descripcion TEXT
                );
                CREATE TABLE IF NOT EXISTS productos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre VARCHAR(120) NOT NULL,
                    precio REAL NOT NULL,
                    stock INTEGER NOT NULL DEFAULT 0,
                    activo BOOLEAN NOT NULL DEFAULT 1,
                    categoria_id INTEGER,
                    fecha_alta DATE,
                    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
                );
                """
            )
            conn.commit()
        finally:
            conn.close()

    return introspect_database(rel_url, project_dir)


def _get_connected_engine(project_dir: Path):
    url = load_saved_connection_url(project_dir)
    if not url:
        raise ValueError("No hay una base de datos conectada en este proyecto.")
    resolved = _resolve_connection_url(url, project_dir)
    return url, create_engine(resolved, future=True)


def create_table_in_db(
    project_dir: Path, table_name: str, columns: list[ColumnDefinitionInput]
) -> DatabaseStateResponse:
    if not columns:
        raise ValueError("La tabla debe tener al menos una columna.")

    safe_table = _safe_sql_ident(table_name)
    url, engine = _get_connected_engine(project_dir)
    is_sqlite = url.startswith("sqlite:")

    col_defs: list[str] = []
    fk_defs: list[str] = []

    for col in columns:
        cname = _safe_sql_ident(col.name)
        ctype = _safe_sql_type(col.sqlType)

        if col.primaryKey and col.autoincrement and is_sqlite:
            part = f'"{cname}" INTEGER PRIMARY KEY AUTOINCREMENT'
        else:
            part = f'"{cname}" {ctype}'
            if col.primaryKey:
                part += " PRIMARY KEY"
            if not col.nullable and not col.primaryKey:
                part += " NOT NULL"
            if col.defaultValue is not None and str(col.defaultValue).strip() != "":
                raw_def = str(col.defaultValue).strip()
                if raw_def.upper() in ("CURRENT_TIMESTAMP", "CURRENT_DATE", "TRUE", "FALSE") or re.match(
                    r"^-?\d+(\.\d+)?$", raw_def
                ):
                    part += f" DEFAULT {raw_def}"
                else:
                    escaped = raw_def.replace("'", "''")
                    part += f" DEFAULT '{escaped}'"

        col_defs.append(part)

        if col.foreignKey:
            ref_tbl = _safe_sql_ident(col.foreignKey.referredTable)
            ref_col = _safe_sql_ident(col.foreignKey.referredColumn)
            fk_defs.append(
                f'FOREIGN KEY ("{cname}") REFERENCES "{ref_tbl}"("{ref_col}")'
            )

    ddl = f'CREATE TABLE "{safe_table}" (\n  ' + ",\n  ".join(col_defs + fk_defs) + "\n)"

    try:
        with engine.begin() as conn:
            if is_sqlite:
                conn.execute(text("PRAGMA foreign_keys = ON"))
            conn.execute(text(ddl))
    finally:
        engine.dispose()

    return introspect_database(url, project_dir)


def add_column_to_table(
    project_dir: Path, table_name: str, col: ColumnDefinitionInput
) -> DatabaseStateResponse:
    safe_table = _safe_sql_ident(table_name)
    cname = _safe_sql_ident(col.name)
    ctype = _safe_sql_type(col.sqlType)
    url, engine = _get_connected_engine(project_dir)
    is_sqlite = url.startswith("sqlite:")

    col_sql = f'"{cname}" {ctype}'
    if col.defaultValue is not None and str(col.defaultValue).strip() != "":
        raw_def = str(col.defaultValue).strip()
        if raw_def.upper() in ("CURRENT_TIMESTAMP", "CURRENT_DATE", "TRUE", "FALSE") or re.match(
            r"^-?\d+(\.\d+)?$", raw_def
        ):
            col_sql += f" DEFAULT {raw_def}"
        else:
            escaped = raw_def.replace("'", "''")
            col_sql += f" DEFAULT '{escaped}'"
    elif not col.nullable:
        if is_sqlite:
            if any(k in ctype for k in ("INT", "REAL", "FLOAT", "NUM", "DEC", "BOOL")):
                col_sql += " NOT NULL DEFAULT 0"
            else:
                col_sql += " NOT NULL DEFAULT ''"
        else:
            col_sql += " NOT NULL"

    if col.foreignKey:
        ref_tbl = _safe_sql_ident(col.foreignKey.referredTable)
        ref_col = _safe_sql_ident(col.foreignKey.referredColumn)
        col_sql += f' REFERENCES "{ref_tbl}"("{ref_col}")'

    ddl = f'ALTER TABLE "{safe_table}" ADD COLUMN {col_sql}'

    try:
        with engine.begin() as conn:
            if is_sqlite:
                conn.execute(text("PRAGMA foreign_keys = ON"))
            conn.execute(text(ddl))
    finally:
        engine.dispose()

    return introspect_database(url, project_dir)


def drop_table_from_db(project_dir: Path, table_name: str) -> DatabaseStateResponse:
    safe_table = _safe_sql_ident(table_name)
    url, engine = _get_connected_engine(project_dir)
    try:
        with engine.begin() as conn:
            conn.execute(text(f'DROP TABLE IF EXISTS "{safe_table}"'))
    finally:
        engine.dispose()
    return introspect_database(url, project_dir)


def get_table_rows(project_dir: Path, table_name: str, limit: int = 100) -> TableRowsResponse:
    safe_table = _safe_sql_ident(table_name)
    _url, engine = _get_connected_engine(project_dir)
    try:
        with engine.connect() as conn:
            result = conn.execute(text(f'SELECT * FROM "{safe_table}" LIMIT :lim'), {"lim": limit})
            cols = list(result.keys())
            rows = [dict(r._mapping) for r in result.fetchall()]
        return TableRowsResponse(tableName=safe_table, columns=cols, rows=rows)
    finally:
        engine.dispose()
