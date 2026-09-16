@echo off
setlocal EnableExtensions
chcp 65001 >nul
title OMORI Web Port

cd /d "%~dp0"

where python >nul 2>&1
if errorlevel 1 (
  where py >nul 2>&1
  if errorlevel 1 (
    echo [FEHLER] Python nicht gefunden.
    echo Installiere Python: winget install --id Python.Python.3.13 -e --source winget
    pause
    exit /b 1
  ) else (
    echo Starte mit py -m http.server 8000 ...
    start "" "http://localhost:8000"
    py -m http.server 8000
    pause
    exit /b
  )
)

echo Starte http://localhost:8000 ...
echo Ordner: %CD%
echo Beenden mit STRG+C
start "" "http://localhost:8000"
python -m http.server 8000
pause
