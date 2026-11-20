@echo off
setlocal
title Compilador .EXE — NiceGUI Studio

cd /d "%~dp0.."
set "ROOT_DIR=%CD%"

echo ============================================================
echo   COMPILANDO PAQUETE STANDALONE (.EXE) DE NICEGUI STUDIO
echo ============================================================
echo.

echo [1/3] Compilando Frontend de produccion (Vite)...
pushd "%ROOT_DIR%\frontend"
call npm.cmd run build
if errorlevel 1 (
    popd
    echo ERROR compilando el Frontend.
    pause
    exit /b 1
)
popd

echo [2/3] Instalando/verificando PyInstaller...
"%ROOT_DIR%\backend\.venv\Scripts\pip.exe" install pyinstaller
if errorlevel 1 (
    echo ERROR instalando PyInstaller.
    pause
    exit /b 1
)

echo [3/3] Generando ejecutable con PyInstaller...
"%ROOT_DIR%\backend\.venv\Scripts\pyinstaller.exe" --clean --noconfirm "%ROOT_DIR%\installer\nicegui_studio.spec"
if errorlevel 1 (
    echo ERROR generando el ejecutable.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   COMPILACION EXITOSA!
echo   Ejecutable listo en: %ROOT_DIR%\dist\NiceGUIStudio\NiceGUIStudio.exe
echo   (Opcional) Compila installer\nicegui_studio.iss con Inno Setup
echo   para generar Setup_NiceGUI_Studio_1.0.0.exe
echo ============================================================
pause
endlocal
