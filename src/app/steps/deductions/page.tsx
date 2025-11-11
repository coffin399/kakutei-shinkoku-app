"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePersistentState } from "@/hooks/usePersistentState";
import { calculateMedicalDeduction } from "@/lib/tax/calculators";

const STORAGE_KEY = "step-deductions";

const deductionTemplates = [
  { id: "basic", label: "基礎控除", amount: "480000" },
  { id: "spouse", label: "配偶者控除", amount: "" },
  { id: "dependents", label: "扶養控除", amount: "" },
  { id: "social_insurance", label: "社会保険料控除", amount: "" },
  { id: "life_insurance", label: "生命保険料控除", amount: "" },
  { id: "earthquake_insurance", label: "地震保険料控除", amount: "" },
  { id: "medical", label: "医療費控除", amount: "" },
  { id: "donation", label: "寄附金控除", amount: "" },
  { id: "small_business_mutual", label: "小規模企業共済等掛金控除", amount: "" },
  { id: "housing", label: "住宅ローン控除 (所得税分)", amount: "" },
];

type DeductionRow = {
  id: string;
  label: string;
  amount: string;
  notes: string;
};

type MedicalRow = {
  provider: string;
  patient: string;
  amount: string;
  reimbursed: string;
};

type IncomeRow = {
  amount?: string;
};

const defaultRows: DeductionRow[] = deductionTemplates.map((template) => ({
  ...template,
  notes: "",
}));

const defaultMedicalRows: MedicalRow[] = [{ provider: "", patient: "", amount: "", reimbursed: "" }];

export default function DeductionsPage() {
  const [deductions, setDeductions, hydrated] = usePersistentState<DeductionRow[]>(
    STORAGE_KEY,
    defaultRows
  );
  const [medicalRows, setMedicalRows] = usePersistentState<MedicalRow[]>(
    `${STORAGE_KEY}-medical`,
    defaultMedicalRows
  );
  const [incomeRows] = usePersistentState<IncomeRow[]>("step-incomes", []);

  const totalIncome = useMemo(() => {
    return incomeRows.reduce((sum, row) => {
      const cleaned = (row.amount ?? "").replace(/,/g, "").trim();
      if (!cleaned) return sum;
      const parsed = Number(cleaned);
      return Number.isNaN(parsed) ? sum : sum + parsed;
    }, 0);
  }, [incomeRows]);

  const medicalSummary = useMemo(() => {
    const entries = medicalRows
      .filter((row) => row.amount)
      .map((row) => ({
        provider: row.provider,
        patient: row.patient,
        amount: Number(row.amount.replace(/,/g, "")) || 0,
        reimbursed: Number(row.reimbursed.replace(/,/g, "")) || 0,
      }));
    if (entries.length === 0) return null;
    return calculateMedicalDeduction(entries, totalIncome);
  }, [medicalRows, totalIncome]);

  const updateDeduction = (id: string, field: keyof DeductionRow, value: string) => {
    setDeductions((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const updateMedical = (index: number, field: keyof MedicalRow, value: string) => {
    setMedicalRows((prev) => prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)));
  };

  const addMedicalRow = () => {
    setMedicalRows((prev) => [...prev, { provider: "", patient: "", amount: "", reimbursed: "" }]);
  };

  const removeMedicalRow = (index: number) => {
    setMedicalRows((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-16 sm:px-10">
          <p className="text-sm text-white/60">データを読み込み中です...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16 sm:px-10">
        <header className="flex flex-col gap-4">
          <Link href="/" className="text-xs uppercase tracking-[0.35em] text-amber-300/70">
            Step 3 / Deductions
          </Link>
          <h1 className="text-4xl font-semibold text-white">控除を入力</h1>
          <p className="text-sm text-slate-200/80">
            基礎控除や医療費控除などを記録します。医療費は明細を行単位で追記し、控除額を自動計算できます。
          </p>
        </header>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">控除一覧</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {deductions.map((deduction) => (
              <div key={deduction.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <label className="flex flex-col gap-2 text-sm text-white/70">
                  <span>{deduction.label}</span>
                  <input
                    value={deduction.amount}
                    onChange={(event) => updateDeduction(deduction.id, "amount", event.target.value)}
                    placeholder="例: 600000"
                    className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </label>
                <textarea
                  value={deduction.notes}
                  onChange={(event) => updateDeduction(deduction.id, "notes", event.target.value)}
                  rows={2}
                  placeholder="証明書の有無や補足メモ"
                  className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-emerald-200">医療費明細と控除額</h2>
            <p className="text-xs text-emerald-100/80">
              医療費控除の計算には年間の総所得が必要です。現在は STEP 2 で入力した所得の合計
              {" "}
              <span className="font-semibold">
                {totalIncome.toLocaleString()} 円
              </span>
              {totalIncome === 0 && "（未入力のため 0 円としています）"}
              を使用しています。
            </p>
          </div>
          <table className="w-full table-fixed border-separate border-spacing-y-3 text-sm text-white/80">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-white/50">
                <th className="w-[22%] px-3">医療機関名</th>
                <th className="w-[18%] px-3">対象者</th>
                <th className="w-[20%] px-3">支払額 (円)</th>
                <th className="w-[20%] px-3">補填額 (円)</th>
                <th className="px-3" aria-label="memo" />
              </tr>
            </thead>
            <tbody>
              {medicalRows.map((row, index) => (
                <tr key={`medical-${index}`} className="rounded-2xl border border-emerald-400/30 bg-slate-950/60">
                  <td className="px-3 py-3 align-top">
                    <input
                      value={row.provider}
                      onChange={(event) => updateMedical(index, "provider", event.target.value)}
                      placeholder="○○病院"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input
                      value={row.patient}
                      onChange={(event) => updateMedical(index, "patient", event.target.value)}
                      placeholder="家族名"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input
                      value={row.amount}
                      onChange={(event) => updateMedical(index, "amount", event.target.value)}
                      placeholder="例: 120000"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input
                      value={row.reimbursed}
                      onChange={(event) => updateMedical(index, "reimbursed", event.target.value)}
                      placeholder="例: 20000"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-3 align-top text-right">
                    <button
                      type="button"
                      onClick={() => removeMedicalRow(index)}
                      className="text-xs text-white/50 transition hover:text-rose-200"
                    >
                      行を削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between text-sm text-emerald-100/80">
            <button
              type="button"
              onClick={addMedicalRow}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-300/80 hover:text-white"
            >
              + 行を追加
            </button>
            {medicalSummary ? (
              <div className="space-y-1 text-right">
                <p>支払医療費: {medicalSummary.total.toNumber().toLocaleString()} 円</p>
                <p>補填額: {medicalSummary.reimbursements.toNumber().toLocaleString()} 円</p>
                <p>控除対象額: {medicalSummary.net.toNumber().toLocaleString()} 円</p>
                <p className="text-emerald-200">
                  控除額: {medicalSummary.deduction.toNumber().toLocaleString()} 円
                </p>
              </div>
            ) : (
              <p className="text-xs">控除額は医療費を入力すると自動計算されます。</p>
            )}
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 text-sm text-white/70">
          <Link
            href="/steps/incomes"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white"
          >
            ← 前のステップ
          </Link>
          <div className="space-y-1 text-right">
            <p>全ての控除はローカルストレージに保存されています。</p>
            <p className="text-xs text-white/50">医療費控除計算は `/outputs` でも再確認できます。</p>
          </div>
          <Link
            href="/steps/tax"
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            次のステップ →
          </Link>
        </footer>
      </div>
    </main>
  );
}
