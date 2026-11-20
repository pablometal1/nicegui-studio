@echo off
cd /d "%~dp0.."
echo Iniciando NiceGUI Studio...
"%CD%\backend\.venv\Scripts\python.exe" "%CD%\launcher.py" %*
