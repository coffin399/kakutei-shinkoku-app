@echo off
setlocal

REM kakutei-shinkoku-app local development launcher (Windows)
REM Double-click to verify dependencies and start the dev server.

pushd %~dp0

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Please install the LTS version from https://nodejs.org/.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found. Make sure npm from the Node.js installer is available in PATH.
  pause
  exit /b 1
)

echo.
echo === Starting kakutei-shinkoku-app development setup ===
echo Project directory: %CD%

echo.
echo 1) Checking dependencies...
if not exist node_modules (
  echo    node_modules directory not found. Running npm install...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed. Please review the log above.
    pause
    exit /b 1
  )
) else (
  echo    Existing node_modules detected. Skipping npm install.
)

echo.
echo 2) Starting the development server...
call npm run dev

if errorlevel 1 (
  echo.
  echo [ERROR] Failed to start the development server.
  pause
  exit /b 1
)

echo.
echo Development server has stopped.
pause
popd
endlocal
