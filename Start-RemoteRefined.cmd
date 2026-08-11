@echo off
setlocal
set "NODE_BIN=C:\Users\alien\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if not exist "%NODE_BIN%" (
  echo.
  echo Node.js was not found in the Codex runtime.
  echo Install Node.js 18 or newer from https://nodejs.org, then run this file again.
  pause
  exit /b 1
)

echo.
echo RemoteRefined is starting...
echo Open http://localhost:3000 in your browser.
echo To stop the site, close this window or press Ctrl+C.
echo.
"%NODE_BIN%" "%~dp0server.js"
pause
