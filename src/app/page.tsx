import Link from "next/link";

type Section = {
  step: string;
  title: string;
  description: string;
  items: string[];
  accent: string;
  href: string;
};

const sections: Section[] = [
  {
    step: "STEP 1",
    title: "基本情報",
    description: "納税者と申告の基本情報をまとめて管理",
    accent: "from-emerald-500/80 to-emerald-600/80",
    href: "/steps/basic-info",
    items: [
      "氏名・住所・マイナンバーの登録",
      "申告区分（青色 / 白色）の選択",
      "申告年度や申告状況のトラッキング",
    ],
  },
  {
    step: "STEP 2",
    title: "収入カテゴリ",
    description: "全ての所得区分を網羅した入力フォーム",
    accent: "from-sky-500/80 to-cyan-600/80",
    href: "/steps/incomes",
    items: [
      "給与所得（源泉徴収票インポート対応）",
      "事業・不動産・配当・雑所得の仕訳",
      "一時所得や仮想通貨を含むカスタム項目",
    ],
  },
  {
    step: "STEP 3",
    title: "所得控除",
    description: "控除漏れを防ぐチェックリストと自動計算",
    accent: "from-amber-500/80 to-orange-600/80",
    href: "/steps/deductions",
    items: [
      "基礎控除や扶養控除の自動反映",
      "社会保険料・生命保険・地震保険の控除",
      "医療費・寄附金・小規模企業共済等掛金控除",
    ],
  },
  {
    step: "STEP 4",
    title: "税額計算",
    description: "リアルタイムで税額・還付の結果を可視化",
    accent: "from-fuchsia-500/80 to-violet-600/80",
    href: "/steps/tax",
    items: [
      "所得税額と復興特別所得税の自動計算",
      "源泉徴収額との照合",
      "納付 / 還付見込額のシミュレーション",
    ],
  },
  {
    step: "STEP 5",
    title: "添付書類管理",
    description: "必要書類をクラウドライクに整理",
    accent: "from-rose-500/80 to-pink-600/80",
    href: "/steps/documents",
    items: [
      "源泉徴収票・医療費領収書のアップロード",
      "寄附金受領証明書や控除証明書のステータス管理",
      "不足書類のリマインダー通知",
    ],
  },
  {
    step: "STEP 6",
    title: "青色申告帳簿",
    description: "仕訳から決算書までを一気通貫でサポート",
    accent: "from-lime-500/80 to-green-600/80",
    href: "/blue",
    items: [
      "仕訳入力と総勘定元帳ビュー",
      "損益計算書と貸借対照表の自動生成",
      "CSV エクスポートで税務署提出もスムーズ",
    ],
  },
];

const launchHighlights = [
  {
    title: "クロスプラットフォーム対応",
    detail: "Windows / macOS / Linux 向けにビルドされた Tauri パッケージ",
  },
  {
    title: "ワンクリック起動",
    detail: "ダブルクリックするだけでローカルホストのアプリが自動で立ち上がる",
  },
  {
    title: "オフラインで安心",
    detail: "データはローカルに保存。ネットワークに接続できない環境でも利用可能",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),transparent_55%)]" />
        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-16 px-6 py-16 sm:px-10 lg:px-16">
          <header className="flex flex-col gap-10 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1 text-sm font-medium text-emerald-200">
                確定申告を、もっとスマートに
              </span>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                kakutei-shinkoku-app で、確定申告のすべてをワンストップ管理。
              </h1>
              <p className="text-lg leading-relaxed text-slate-200/80">
                納税者情報の登録から収支の集計、帳簿の作成、添付書類の整理まで。
                モダンでスタイリッシュな UI が提出までのステップをガイドします。
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-400"
                  href="/outputs"
                >
                  出力センターを開く
                  <span className="translate-y-px text-lg transition group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-base font-medium text-white/90 transition hover:border-white/40 hover:text-white"
                  href="/blue"
                >
                  青色帳簿を見る
                </Link>
              </div>
            </div>
            <div className="grid w-full max-w-md gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-emerald-500/10">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                  Progress Overview
                </p>
                <p className="text-2xl font-semibold text-white">
                  6 つのモジュールで漏れのない申告体験
                </p>
              </div>
              <div className="space-y-3">
                {sections.map((section) => (
                  <div
                    key={section.title}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-white/80">{section.title}</span>
                    <span className="text-xs text-white/60">{section.step}</span>
                  </div>
                ))}
              </div>
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-2">
            {sections.map((section) => (
              <Link
                key={section.title}
                href={section.href}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg transition hover:border-emerald-300/40 hover:shadow-emerald-400/20"
              >
                <article className="flex h-full flex-col gap-5 p-8">
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${section.accent}`}
                  />
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-widest text-white/60">
                      {section.step}
                    </span>
                    <h2 className="text-2xl font-semibold text-white">
                      {section.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-white/70">
                      {section.description}
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm text-white/80">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-emerald-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Link>
            ))}
          </section>

          <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-10 lg:grid-cols-[2fr_3fr]">
            <div className="space-y-6">
              <h3 className="text-3xl font-semibold text-white">
                どの端末でも、ダブルクリックで起動。
              </h3>
              <p className="text-sm leading-relaxed text-white/80">
                Tauri を用いた軽量なデスクトップパッケージにより、インストール後は
                アプリをダブルクリックするだけでローカルホストが立ち上がります。
                環境構築の煩わしさから解放され、確定申告に集中できます。
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {launchHighlights.map((highlight) => (
                <div
                  key={highlight.title}
                  className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-950/60 p-5"
                >
                  <h4 className="text-base font-semibold text-white">
                    {highlight.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-white/70">
                    {highlight.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <footer className="flex flex-col items-center gap-4 pb-10 text-center text-sm text-white/60">
            <p>© {new Date().getFullYear()} kakutei-shinkoku-app. All rights reserved.</p>
            <p>青色申告・白色申告どちらにも対応した次世代の確定申告コンパニオン。</p>
          </footer>
        </div>
      </div>
    </main>
  );
}
