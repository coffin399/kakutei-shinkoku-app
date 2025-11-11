@echo off
setlocal

REM kakutei-shinkoku-app ローカル開発起動スクリプト (Windows)
REM ダブルクリックで依存関係をインストールし、開発サーバーを起動します。

pushd %~dp0

where node >nul 2>&1
if errorlevel 1 (
  echo [エラー] Node.js が見つかりません。 https://nodejs.org/ から LTS 版をインストールしてください。
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [エラー] npm が見つかりません。Node.js のインストールに含まれる npm を利用できるようにしてください。
  pause
  exit /b 1
)

echo.
echo === kakutei-shinkoku-app 開発環境のセットアップを開始します ===
echo プロジェクトディレクトリ: %CD%

echo.
echo 1) 依存関係のインストールを確認しています...
if not exist node_modules (
  echo    node_modules ディレクトリが見つかりません。npm install を実行します。
  call npm install
  if errorlevel 1 (
    echo [エラー] npm install に失敗しました。エラーログを確認してください。
    pause
    exit /b 1
  )
) else (
  echo    既存の node_modules を検出しました。npm install はスキップします。
)

echo.
echo 2) 開発サーバーを起動します...
call npm run dev

if errorlevel 1 (
  echo.
  echo [エラー] 開発サーバーの起動に失敗しました。
  pause
  exit /b 1
)

echo.
echo 開発サーバーを終了しました。
pause
popd
endlocal
