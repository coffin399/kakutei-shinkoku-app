<div align="center">

**現在開発中です。**  
フィードバックを募集しています

</div>

# kakutei-shinkoku-app

モダンな UI で確定申告のワークフローをフルサポートする Web アプリケーションです。納税者情報の管理から、収入・控除の入力、帳簿作成、添付書類の整理までを一元化し、青色申告・白色申告のどちらにも対応します。

## 特徴

- **ワンストップ管理**: 基本情報、所得区分、控除、税額計算、書類管理、青色帳簿を一つのダッシュボードで整理。
- **スタイリッシュな UI**: Tailwind CSS を活用したダークテーマ基調のモダンデザイン。
- **ガイダンス付きフロー**: ステップごとの進捗確認と注意点により、申告漏れを防止。
- **ローカルファースト設計**: データはローカルに保存。オフライン環境でも利用可能。
- **クロスプラットフォーム配布を想定**: Tauri を用いた Windows / macOS / Linux のデスクトップパッケージングを計画。

## 技術スタック

- Next.js (App Router) + React 18
- TypeScript / ESLint
- Tailwind CSS
- next/font (Geist)
- 将来的に導入予定: Prisma + SQLite/PostgreSQL、NextAuth.js、Tauri

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで <http://localhost:3000> を開くとアプリを確認できます。

### ワンクリック起動スクリプト

- `start-windows.bat` : ダブルクリックで依存関係のインストール確認 → 開発サーバー起動までを自動化します。
- `start-macos.sh` : `chmod +x start-macos.sh` で実行権限を付与した後、ターミナルで `./start-macos.sh` を実行してください。

## 主な npm スクリプト

| コマンド | 説明 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動 (http://localhost:3000) |
| `npm run build` | 本番ビルドの作成 |
| `npm run start` | 本番ビルドを起動 |
| `npm run lint` | ESLint によるコードチェック |

## ディレクトリ構成

```
├─ public/              静的アセット
├─ src/app/             App Router エントリーポイント
│  ├─ layout.tsx        全体レイアウト
│  └─ page.tsx          トップページ (ダッシュボード)
├─ src/styles/          グローバルスタイル (globals.css)
└─ ...
```

## 今後のロードマップ

1. 入力フォームとバリデーション (React Hook Form + Zod)
2. データ永続化レイヤー (Prisma + SQLite)
3. 認証 (NextAuth.js)
4. 帳簿機能 (仕訳入力、総勘定元帳、決算書自動生成)
5. 添付書類アップロードとステータス管理
6. Tauri によるデスクトップバンドルとインストーラ作成

## ライセンス

プロジェクトに適したライセンスを `LICENSE` ファイルとして追加してください。

## コントリビュート

Issues / Pull Request は歓迎します。バグ報告や改善提案がある場合はお気軽にお知らせください。
