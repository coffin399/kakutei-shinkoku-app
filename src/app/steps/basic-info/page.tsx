"use client";

import Link from "next/link";
import { usePersistentState } from "@/hooks/usePersistentState";

const STORAGE_KEY = "step-basic-info";

const defaultForm = {
  fullName: "",
  fullNameKana: "",
  myNumber: "",
  address: "",
  phone: "",
  email: "",
  filingCategory: "blue",
  filingYear: String(new Date().getFullYear()),
  memo: "",
};

type BasicInfoForm = typeof defaultForm;

export default function BasicInfoPage() {
  const [form, setForm, hydrated] = usePersistentState<BasicInfoForm>(STORAGE_KEY, defaultForm);

  const handleChange = (field: keyof BasicInfoForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16 sm:px-10">
          <p className="text-sm text-white/60">データを読み込み中です...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16 sm:px-10">
        <header className="flex flex-col gap-4">
          <Link href="/" className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">
            Step 1 / Basic Information
          </Link>
          <h1 className="text-4xl font-semibold text-white">基本情報を入力</h1>
          <p className="text-sm text-slate-200/80">
            納税者と申告の基礎情報を登録します。入力内容は自動で保存されるため、ページを離れても保持されます。
          </p>
        </header>

        <form className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-white/70">氏名</span>
              <input
                value={form.fullName}
                onChange={handleChange("fullName")}
                placeholder="山田 太郎"
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-white/70">氏名（カナ）</span>
              <input
                value={form.fullNameKana}
                onChange={handleChange("fullNameKana")}
                placeholder="ヤマダ タロウ"
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-white/70">マイナンバー</span>
              <input
                value={form.myNumber}
                onChange={handleChange("myNumber")}
                placeholder="1234-5678-9012"
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-white/70">電話番号</span>
              <input
                value={form.phone}
                onChange={handleChange("phone")}
                placeholder="03-1234-5678"
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-white/70">住所</span>
            <input
              value={form.address}
              onChange={handleChange("address")}
              placeholder="東京都千代田区1-1-1"
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-white/70">メールアドレス</span>
            <input
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              placeholder="sample@example.com"
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-white/70">申告区分</span>
              <select
                value={form.filingCategory}
                onChange={handleChange("filingCategory")}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
              >
                <option value="blue">青色申告</option>
                <option value="white">白色申告</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-white/70">申告年度</span>
              <input
                type="number"
                value={form.filingYear}
                onChange={handleChange("filingYear")}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-white/70">メモ</span>
            <textarea
              value={form.memo}
              onChange={handleChange("memo")}
              rows={4}
              placeholder="家族構成や補足事項などをメモできます"
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
        </form>

        <footer className="flex flex-wrap items-center justify-between gap-4 text-sm text-white/70">
          <div className="space-y-1">
            <p>入力内容はローカルに保存されます。</p>
            <p className="text-xs text-white/50">最後に入力した情報はブラウザに残るため、安心して続きのステップへ進めます。</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/steps/incomes"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              次のステップへ
              <span>→</span>
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
