"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePersistentState } from "@/hooks/usePersistentState";

const STORAGE_KEY = "step-tax";

const defaultSummary = {
  taxableIncome: "",
  incomeTax: "",
  specialReconstructionTax: "",
  municipalTax: "",
  nationalHealthInsurance: "",
  expectedRefund: "",
  amountDue: "",
  memo: "",
};

type SummaryForm = typeof defaultSummary;

type IncomeRow = {
  amount?: string;
};

type DeductionRow = {
  amount?: string;
};

function parseAmount(value: string) {
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function TaxSummaryPage() {
  const [summary, setSummary, hydrated] = usePersistentState<SummaryForm>(STORAGE_KEY, defaultSummary);
  const [incomeRows] = usePersistentState<IncomeRow[]>("step-incomes", []);
  const [deductionRows] = usePersistentState<DeductionRow[]>("step-deductions", []);

  const progressiveRates = useMemo(
    () => [
      { threshold: 0, rate: 0.05, deduction: 0 },
      { threshold: 1_950_000, rate: 0.1, deduction: 97_500 },
      { threshold: 3_300_000, rate: 0.2, deduction: 427_500 },
      { threshold: 6_950_000, rate: 0.23, deduction: 636_000 },
      { threshold: 9_000_000, rate: 0.33, deduction: 1_536_000 },
      { threshold: 18_000_000, rate: 0.4, deduction: 2_796_000 },
      { threshold: 40_000_000, rate: 0.45, deduction: 4_796_000 },
    ],
    []
  );

  const totals = useMemo(() => {
    const incomeTotal = incomeRows.reduce((sum, row) => sum + parseAmount(row.amount ?? ""), 0);
    const deductionTotal = deductionRows.reduce((sum, row) => sum + parseAmount(row.amount ?? ""), 0);
    const taxable = Math.max(incomeTotal - deductionTotal, 0);
    return {
      incomeTotal,
      deductionTotal,
      taxable,
    };
  }, [incomeRows, deductionRows]);

  const autoValues = useMemo(() => {
    const taxable = totals.taxable;
    if (taxable <= 0) {
      return {
        taxableIncome: "",
        incomeTax: "",
        specialReconstructionTax: "",
      };
    }
    const rate = [...progressiveRates].reverse().find((item) => taxable >= item.threshold);
    const incomeTaxRaw = rate ? taxable * rate.rate - rate.deduction : 0;
    const incomeTax = Math.max(Math.round(incomeTaxRaw), 0);
    const specialTax = Math.max(Math.round(incomeTax * 0.021), 0);
    return {
      taxableIncome: String(Math.round(totals.taxable)),
      incomeTax: String(incomeTax),
      specialReconstructionTax: String(specialTax),
    };
  }, [progressiveRates, totals.taxable]);

  const autoValueRef = useRef(autoValues);

  useEffect(() => {
    autoValueRef.current = autoValues;
  }, [autoValues]);

  useEffect(() => {
    if (!hydrated) return;
    setSummary((prev) => {
      const keys: (keyof typeof autoValues)[] = [
        "taxableIncome",
        "incomeTax",
        "specialReconstructionTax",
      ];
      let changed = false;
      const next = { ...prev };
      keys.forEach((key) => {
        const auto = autoValues[key];
        if (!auto) return;
        const prevAuto = autoValueRef.current[key];
        const current = prev[key].trim();
        if (current === "" || current === prevAuto) {
          if (current !== auto) {
            next[key] = auto;
            changed = true;
          }
        }
      });
      if (!changed) return prev;
      return next;
    });
  }, [autoValues, hydrated, setSummary]);

  const handleChange = (
    field: keyof SummaryForm
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSummary((prev) => ({ ...prev, [field]: event.target.value }));
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
          <Link href="/" className="text-xs uppercase tracking-[0.35em] text-fuchsia-300/70">
            Step 4 / Tax Summary
          </Link>
          <h1 className="text-4xl font-semibold text-white">税額を試算する</h1>
          <p className="text-sm text-slate-200/80">
            収入合計と控除合計から課税所得を算出し、所得税や住民税の見込みを入力できます。入力内容は自動で保存されます。
          </p>
        </header>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard label="収入合計" value={totals.incomeTotal} accent="text-emerald-200" />
            <SummaryCard label="控除合計" value={totals.deductionTotal} accent="text-sky-200" />
            <SummaryCard label="課税所得 (概算)" value={totals.taxable} accent="text-fuchsia-200" />
          </div>
          <p className="text-xs text-slate-200/70">
            ※ この課税所得は STEP 1〜3 で入力した金額から計算した概算値です。金額を確定する場合は所得控除の内訳を再確認してください。
          </p>
          {autoValues.taxableIncome && (
            <p className="text-xs text-emerald-200/80">
              自動計算値を反映中: 課税所得 {Number(autoValues.taxableIncome).toLocaleString()} 円 / 所得税
              {" "}
              {autoValues.incomeTax ? `${Number(autoValues.incomeTax).toLocaleString()} 円` : "-"} / 復興特別所得税
              {" "}
              {autoValues.specialReconstructionTax
                ? `${Number(autoValues.specialReconstructionTax).toLocaleString()} 円`
                : "-"}
            </p>
          )}
        </section>

        <form className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="課税所得 (円)"
              value={summary.taxableIncome}
              onChange={handleChange("taxableIncome")}
              placeholder={totals.taxable.toLocaleString()}
            />
            <FormField
              label="所得税 (円)"
              value={summary.incomeTax}
              onChange={handleChange("incomeTax")}
              placeholder="例: 366000"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="復興特別所得税 (円)"
              value={summary.specialReconstructionTax}
              onChange={handleChange("specialReconstructionTax")}
              placeholder="例: 7686"
            />
            <FormField
              label="住民税 (円)"
              value={summary.municipalTax}
              onChange={handleChange("municipalTax")}
              placeholder="例: 320000"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="国民健康保険 (円)"
              value={summary.nationalHealthInsurance}
              onChange={handleChange("nationalHealthInsurance")}
              placeholder="任意で入力"
            />
            <FormField
              label="納付額 (円)"
              value={summary.amountDue}
              onChange={handleChange("amountDue")}
              placeholder="例: 50000"
            />
          </div>
          <FormField
            label="還付見込み額 (円)"
            value={summary.expectedRefund}
            onChange={handleChange("expectedRefund")}
            placeholder="例: 40000"
          />
          <label className="flex flex-col gap-2">
            <span className="text-sm text-white/70">メモ</span>
            <textarea
              value={summary.memo}
              onChange={handleChange("memo")}
              rows={4}
              placeholder="計算根拠や備考を残せます"
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-fuchsia-400 focus:outline-none"
            />
          </label>
        </form>

        <footer className="flex flex-wrap items-center justify-between gap-4 text-sm text-white/70">
          <Link
            href="/steps/deductions"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white"
          >
            ← 前のステップ
          </Link>
          <div className="space-y-1 text-right">
            <p>税額の試算はローカルに保存されます。</p>
            <p className="text-xs text-white/50">確定申告書の出力は最終ステップまたは出力センターから行えます。</p>
          </div>
          <Link
            href="/steps/documents"
            className="inline-flex items-center gap-2 rounded-full bg-fuchsia-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-fuchsia-400"
          >
            次のステップ →
          </Link>
        </footer>
      </div>
    </main>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  accent: string;
};

function SummaryCard({ label, value, accent }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-white/50">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value.toLocaleString()} 円</p>
    </div>
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
};

function FormField({ label, value, onChange, placeholder }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/70">
      <span>{label}</span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-fuchsia-400 focus:outline-none"
      />
    </label>
  );
}
