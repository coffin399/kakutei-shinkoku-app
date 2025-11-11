#!/bin/bash
set -euo pipefail

# kakutei-shinkoku-app ローカル開発起動スクリプト (macOS / Linux)
# 実行権限を付与してから使用してください: chmod +x start-macos.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "[エラー] Node.js が見つかりません。https://nodejs.org/ から LTS 版をインストールしてください。" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[エラー] npm が見つかりません。Node.js のインストールに含まれる npm を利用できるようにしてください。" >&2
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "node_modules が存在しません。依存関係をインストールします..."
  npm install
fi

echo "開発サーバーを起動します..."
npm run dev
