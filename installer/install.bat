@echo off
setlocal enabledelayedexpansion
title Instalador — NiceGUI Studio

echo ============================================================
echo   INSTALADOR DE NICEGUI STUDIO (Python Visual IDE)
echo ============================================================
echo.

cd /d "%~dp0.."
set "ROOT_DIR=%CD%"

echo [1/4] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: No se encontro Python en el PATH. Instala Python 3.10+ primero.
    pause
    exit /b 1
)

echo [2/4] Configurando entorno virtual e instalando dependencias Python...
if not exist "%ROOT_DIR%\backend\.venv\Scripts\python.exe" (
    python -m venv "%ROOT_DIR%\backend\.venv"
)
"%ROOT_DIR%\backend\.venv\Scripts\pip.exe" install -r "%ROOT_DIR%\backend\requirements.txt"
if errorlevel 1 (
    echo ERROR instalando dependencias de Python.
    pause
    exit /b 1
)

echo [3/4] Verificando build de produccion del Frontend...
if not exist "%ROOT_DIR%\frontend\dist\index.html" (
    where npm.cmd >nul 2>&1
    if errorlevel 1 (
        echo ADVERTENCIA: No existe frontend\dist y no se encontro npm.cmd.
    ) else (
        pushd "%ROOT_DIR%\frontend"
        call npm.cmd install
        call npm.cmd run build
        popd
    )
)

echo [4/4] Creando acceso directo en el Escritorio...
set "SHORTCUT=%USERPROFILE%\Desktop\NiceGUI Studio.lnk"
set "TARGET=%ROOT_DIR%\installer\run_studio.bat"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%SHORTCUT%'); $sc.TargetPath = '%TARGET%'; $sc.WorkingDirectory = '%ROOT_DIR%'; $sc.Description = 'NiceGUI Studio — Python Visual IDE'; $sc.Save()"

echo.
echo ============================================================
echo   INSTALACION COMPLETADA!
echo   Acceso directo creado en el Escritorio: NiceGUI Studio
echo ============================================================
echo.
set /p LAUNCH="Deseas abrir NiceGUI Studio ahora? (S/N): "
if /i "%LAUNCH%"=="S" (
    start "" "%TARGET%"
)
endlocal
