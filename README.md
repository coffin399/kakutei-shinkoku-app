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
- **青色申告帳簿センター**: 仕訳入力・損益計算書・貸借対照表をブラウザ内で自動集計。
- **Gemini API 連携設定**: 複数 API キーによるフェイルオーバーに対応したレシート読取設定 UI。
- **確定申告書B 出力センター**: JSON スナップショットから PDF（第一表・第二表）と e-Tax 用 XML を同時に生成。
- **控除・損益計算ツール**: 医療費控除、仮想通貨損益、住宅ローン控除を CSV から取り込み自動計算。
- **ステップナビゲーション**: 基本情報→所得→所得控除→税額計算→添付書類→青色帳簿と順番に入力し、各ページで自動保存。

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

- `start-windows.bat` : ダブルクリックで依存関係確認 → 新しいターミナルで `npm run dev` を起動し、既定ブラウザで <http://localhost:3000> を開きます。
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
│  ├─ layout.tsx        全体レイアウト（グローバルナビゲーション付き）
│  ├─ page.tsx          トップページ (ダッシュボード)
│  ├─ blue/page.tsx     青色申告帳簿センター (仕訳・損益計算書・貸借対照表)
│  ├─ outputs/page.tsx  確定申告書B PDF / e-Tax XML 出力＋計算ツール
│  └─ settings/gemini/  Gemini API 設定フォーム
├─ src/styles/          グローバルスタイル (globals.css)
└─ ...
```

## 主要画面

- `/blue` : 仕訳入力フォーム、ローカルストレージ保存、損益計算書／貸借対照表の自動集計。
- `/settings/gemini` : Gemini API ベース URL/複数 API キーの登録とフェイルオーバー設定。
- `/outputs` : 申告スナップショット編集、PDF / XML 出力、医療費控除・仮想通貨損益・住宅ローン控除の自動計算。
- `/steps/*` : STEP1〜6 の入力ウィザード。ブラウザのローカルストレージへ自動保存され、途中離脱しても情報が保持されます。

## CSV 取り込みの列フォーマット

| ツール | 必須列 | 備考 |
| --- | --- | --- |
| 医療費控除 | `provider`, `patient`, `amount`, `reimbursed` | `reimbursed` は空欄可。金額は半角数値/カンマ区切り対応。 |
| 仮想通貨損益 | `date`, `pair`, `side`, `quantity`, `price`, `fee` | `side` は `buy` / `sell`。`fee` は空欄可。 |
| 住宅ローン控除 | `year`, `outstandingPrincipal`, `deductionRate`, `maxDeduction` | `deductionRate` は %（例: `1.0`）。 |

## 今後のロードマップ

1. 入力フォームとバリデーション (React Hook Form + Zod)
2. データ永続化レイヤー (Prisma + SQLite)
3. 認証 (NextAuth.js)
4. 帳簿機能 (仕訳入力、総勘定元帳、決算書自動生成)
5. 添付書類アップロードとステータス管理
6. Gemini API を用いたレシート OCR・データ化ワークフロー
7. Tauri によるデスクトップバンドルとインストーラ作成

## ライセンス

プロジェクトに適したライセンスを `LICENSE` ファイルとして追加してください。

## コントリビュート

Issues / Pull Request は歓迎します。バグ報告や改善提案がある場合はお気軽にお知らせください。
