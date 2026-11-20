# NiceGUI Studio (v1)

IDE visual para Python con diseñador de formularios drag-and-drop para **NiceGUI**, inspirado en el flujo de trabajo de **Visual Studio** (Code-Behind).

## Arquitectura

- **`backend/`** — FastAPI + Python 3.11:
  - Gestión de proyectos y archivos (`projects/`).
  - Generador determinista de código NiceGUI (`*.ngui.json` → `*_designer.py`).
  - Parcheador AST de Python para inyectar manejadores de eventos en `*.py` sin sobrescribir tu lógica.
  - Ejecutor de procesos NiceGUI con streaming de consola por WebSocket.
- **`frontend/`** — React + TypeScript + Vite + Tailwind CSS + Monaco Editor + `@dnd-kit`:
  - **Toolbox** declarativo (`src/registry/widgets.ts`) con 17 widgets NiceGUI.
  - **Diseñador Visual** con contenedores anidados (`column`, `row`, `card`, `grid`, `expansion`), Undo/Redo y doble clic para saltar al código del evento.
  - **Editor de Código** con Monaco Editor (motor de VS Code).
  - **Inspector de Propiedades**, **Esquema del Documento**, **Consola en vivo** y **Vista Previa embebida**.

## Cómo ejecutar en desarrollo

1. **Backend**:
   ```powershell
   cd backend
   .\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8010
   ```
2. **Frontend**:
   ```powershell
   cd frontend
   npm.cmd run dev
   ```
3. Abre `http://localhost:5173` en tu navegador.
