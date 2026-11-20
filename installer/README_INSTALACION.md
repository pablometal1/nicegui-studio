# Sistema de Empaquetado e Instalación — NiceGUI Studio

NiceGUI Studio ahora soporta **modo servidor único de producción** (FastAPI sirve el frontend compilado en `frontend/dist/`, sin necesidad de Node.js en ejecución) y **3 formas de instalación y distribución**:

---

## Opción 1: Instalación local en 1 clic (Windows)
Ideal para instalarlo en tu PC o en equipos con Python 3.10+:
1. Ejecuta doble clic en **`installer\install.bat`**.
2. Crea automáticamente el entorno virtual (`backend\.venv`), instala las dependencias Python, verifica el build del frontend y crea un acceso directo **`NiceGUI Studio`** en tu Escritorio.
3. Para abrirlo en cualquier momento, usa el acceso directo del Escritorio o **`installer\run_studio.bat`**.

---

## Opción 2: Paquete Python estándar (`pip install`)
Desde la carpeta raíz del proyecto:
```powershell
pip install .
nicegui-studio
```
Opciones disponibles en CLI:
- `nicegui-studio --port 8020` (cambiar puerto)
- `nicegui-studio --no-browser` (no abrir navegador automáticamente)
- `nicegui-studio --projects-dir "D:\MisProyectosNiceGUI"` (carpeta personalizada de proyectos)

---

## Opción 3: Paquete Standalone `.exe` + Instalador Windows (`Setup.exe`)
Para distribuir NiceGUI Studio en equipos **sin Python ni Node.js instalados**:

1. **Compilar el ejecutable standalone (PyInstaller)**:
   - Ejecuta **`installer\build_exe.bat`**.
   - Compila automáticamente `frontend/dist`, instala PyInstaller y genera **`dist\NiceGUIStudio\NiceGUIStudio.exe`**.
   - Al ejecutarse como `.exe`, los proyectos del usuario se guardan automáticamente en `%USERPROFILE%\NiceGUIStudioProjects`.
2. **Generar el instalador profesional `Setup_NiceGUI_Studio_1.0.0.exe` (Inno Setup)**:
   - Abre **`installer\nicegui_studio.iss`** con [Inno Setup](https://jrsoftware.org/isinfo.php) y pulsa **Compile**.
   - El instalador final se genera en **`dist\installer_output\Setup_NiceGUI_Studio_1.0.0.exe`** (incluye asistente en español, icono de Escritorio, Menú Inicio y desinstalador).
