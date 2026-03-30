@echo off
cd /d "%~dp0"
echo.
echo  NaqiStore — local preview
echo  Open in your browser: http://localhost:8765
echo  (FormSubmit orders need this or a real hosted site — not file://)
echo  Press Ctrl+C to stop the server.
echo.
python -m http.server 8765
if errorlevel 1 (
  echo Python was not found. Install Python from https://www.python.org or use "Live Server" in VS Code / Cursor on this folder.
  pause
)
