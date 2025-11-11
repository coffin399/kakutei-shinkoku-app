"use client";

import { useEffect, useId } from "react";
import Link from "next/link";
import { usePersistentState } from "@/hooks/usePersistentState";

const STORAGE_KEY = "step-incomes";

const incomeTemplates = [
  { id: "salary", label: "給与所得", category: "salary" },
  { id: "business", label: "事業所得", category: "business" },
  { id: "real_estate", label: "不動産所得", category: "real_estate" },
  { id: "dividend", label: "配当所得", category: "dividend" },
  { id: "misc", label: "雑所得", category: "misc" },
  { id: "crypto", label: "仮想通貨", category: "crypto" },
];

type IncomeRow = {
  id: string;
  label: string;
  category: string;
  amount: string;
  notes: string;
};

const defaultRows: IncomeRow[] = incomeTemplates.map((template) => ({
  ...template,
  id: template.id,
  amount: "",
  notes: "",
}));

const BLUE_SUMMARY_KEY = "kakutei.blue.summary";

export default function IncomesPage() {
  const uniqueId = useId();
  const [rows, setRows, hydrated] = usePersistentState<IncomeRow[]>(STORAGE_KEY, defaultRows);

  const updateRow = (id: string, field: keyof IncomeRow, value: string) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `${uniqueId}-${Date.now()}`,
        label: "その他所得",
        category: "other",
        amount: "",
        notes: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  useEffect(() => {
    if (!hydrated) return;
    try {
      const stored = localStorage.getItem(BLUE_SUMMARY_KEY);
      if (!stored) return;
      const summary = JSON.parse(stored) as {
        totalRevenue?: number;
        totalExpenses?: number;
        netIncome?: number;
      };
      if (typeof summary.netIncome !== "number" || Number.isNaN(summary.netIncome)) return;

      const formatted = summary.netIncome === 0 ? "" : Math.round(summary.netIncome).toString();
      setRows((prev) => {
        const existingIndex = prev.findIndex((row) => row.id === "business");
        if (existingIndex === -1) return prev;
        const current = prev[existingIndex];
        if (current.amount === formatted) return prev;
        const updated = [...prev];
        updated[existingIndex] = {
          ...current,
          amount: formatted,
          notes:
            summary.netIncome === 0
              ? current.notes
              : "青色帳簿センターの純利益を反映",
        };
        return updated;
      });
    } catch (error) {
      console.error("Failed to apply blue ledger summary", error);
    }
  }, [hydrated, setRows]);

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
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16 sm:px-10">
        <header className="flex flex-col gap-4">
          <Link href="/" className="text-xs uppercase tracking-[0.35em] text-sky-300/70">
            Step 2 / Incomes
          </Link>
          <h1 className="text-4xl font-semibold text-white">所得を整理する</h1>
          <p className="text-sm text-slate-200/80">
            給与・事業・仮想通貨など各種所得を入力します。金額は円単位で入力し、備考欄に補足を残せます。入力内容は自動保存されます。
          </p>
        </header>

        <section className="grid gap-5 rounded-3xl border border-white/10 bg-white/5 p-6">
          <table className="w-full table-fixed border-separate border-spacing-y-3 text-sm text-white/80">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-white/50">
                <th className="w-[18%] px-3">カテゴリ</th>
                <th className="w-[22%] px-3">項目名</th>
                <th className="w-[20%] px-3">金額 (円)</th>
                <th className="px-3">備考</th>
                <th className="w-[8%] px-3" aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="rounded-2xl border border-white/10 bg-slate-950/50">
                  <td className="px-3 py-3 align-top">
                    <select
                      value={row.category}
                      onChange={(event) => updateRow(row.id, "category", event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                    >
                      {incomeTemplates.map((template) => (
                        <option key={template.id} value={template.category}>
                          {template.label}
                        </option>
                      ))}
                      <option value="other">その他</option>
                    </select>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input
                      value={row.label}
                      onChange={(event) => updateRow(row.id, "label", event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input
                      value={row.amount}
                      onChange={(event) => updateRow(row.id, "amount", event.target.value)}
                      placeholder="例: 2400000"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <textarea
                      value={row.notes}
                      onChange={(event) => updateRow(row.id, "notes", event.target.value)}
                      rows={2}
                      placeholder="源泉徴収税額や補足事項"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="text-xs text-white/50 transition hover:text-rose-300"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-sky-400/60 hover:text-sky-200"
            >
              + 項目を追加
            </button>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 text-sm text-white/70">
          <Link
            href="/steps/basic-info"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white"
          >
            ← 前のステップ
          </Link>
          <div className="space-y-1 text-right">
            <p>入力内容はローカルストレージに保存されます。</p>
            <p className="text-xs text-white/50">金額は後続の税額計算や PDF に連携予定です。</p>
          </div>
          <Link
            href="/steps/deductions"
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            次のステップ →
          </Link>
        </footer>
      </div>
    </main>
  );
}
