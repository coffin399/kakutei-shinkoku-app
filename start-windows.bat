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
  if not exist node_modules\.bin\next (
    echo    node_modules exists but Next CLI is missing. Running npm install to repair...
    call npm install
    if errorlevel 1 (
      echo [ERROR] npm install failed. Please review the log above.
      pause
      exit /b 1
    )
  ) else (
    echo    Existing node_modules detected. Skipping npm install.
  )
)

echo.
echo 2) Starting the development server in a new window...
start "kakutei-shinkoku-app" cmd /c "cd /d %CD% && npm run dev"
if errorlevel 1 (
  echo.
  echo [ERROR] Failed to launch npm run dev window.
  pause
  exit /b 1
)

echo.
echo Waiting for the server to come online...
timeout /t 4 >nul

echo Opening http://localhost:3000 in your default browser.
start "" http://localhost:3000

echo.
echo The development server is running in a separate window.
echo Press any key to close this launcher (the dev server will keep running).
pause
popd
endlocal
