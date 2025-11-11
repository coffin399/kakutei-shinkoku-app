"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import type {
  DeductionDetail,
  IncomeDetail,
  TaxReturnSnapshot,
  AttachmentRecord,
} from "@/lib/tax/types";
import { createSampleSnapshot } from "@/lib/tax/sample";
import {
  calculateCryptoPnL,
  calculateHousingLoanDeduction,
  calculateMedicalDeduction,
} from "@/lib/tax/calculators";
import {
  parseCryptoTradesCsv,
  parseHousingLoanCsv,
  parseMedicalExpenseCsv,
} from "@/lib/tax/csv";

function stringifySnapshot(snapshot: TaxReturnSnapshot) {
  return JSON.stringify(snapshot, null, 2);
}

const SAMPLE_JSON = stringifySnapshot(createSampleSnapshot());

const defaultBasicInfo = {
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

type BasicInfoForm = typeof defaultBasicInfo;

type StoredIncomeRow = {
  id?: string;
  label?: string;
  category?: string;
  amount?: string;
  notes?: string;
};

type StoredDeductionRow = {
  id?: string;
  label?: string;
  amount?: string;
  notes?: string;
};

type TaxSummaryForm = {
  taxableIncome: string;
  incomeTax: string;
  specialReconstructionTax: string;
  municipalTax: string;
  nationalHealthInsurance: string;
  expectedRefund: string;
  amountDue: string;
  memo: string;
};

const defaultTaxSummary: TaxSummaryForm = {
  taxableIncome: "",
  incomeTax: "",
  specialReconstructionTax: "",
  municipalTax: "",
  nationalHealthInsurance: "",
  expectedRefund: "",
  amountDue: "",
  memo: "",
};

const INCOME_CATEGORIES: IncomeDetail["category"][] = [
  "salary",
  "business",
  "real_estate",
  "dividend",
  "misc",
  "crypto",
  "temporary",
  "other",
];

const DEDUCTION_KEYS: DeductionDetail["key"][] = [
  "basic",
  "spouse",
  "spouse_special",
  "dependents",
  "social_insurance",
  "life_insurance",
  "earthquake_insurance",
  "medical",
  "donation",
  "small_business_mutual",
  "housing",
  "other",
];

const DEDUCTION_LABELS: Record<DeductionDetail["key"], string> = {
  basic: "基礎控除",
  spouse: "配偶者控除",
  spouse_special: "配偶者特別控除",
  dependents: "扶養控除",
  social_insurance: "社会保険料控除",
  life_insurance: "生命保険料控除",
  earthquake_insurance: "地震保険料控除",
  medical: "医療費控除",
  donation: "寄附金控除",
  small_business_mutual: "小規模企業共済等掛金控除",
  housing: "住宅ローン控除",
  other: "その他控除",
};

const defaultIncomeRows: StoredIncomeRow[] = [];
const defaultDeductionRows: StoredDeductionRow[] = [];
type DocumentItem = {
  id: string;
  label: string;
  status: AttachmentRecord["status"];
  notes: string;
};

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

const defaultDocuments: DocumentItem[] = [];
const defaultChecklist: ChecklistItem[] = [];

function parseCurrency(value?: string | number | null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const cleaned = value.toString().replace(/,/g, "").trim();
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeIncomeCategory(value?: string): IncomeDetail["category"] {
  if (value && (INCOME_CATEGORIES as string[]).includes(value)) {
    return value as IncomeDetail["category"];
  }
  return "other";
}

function normalizeDeductionKey(value?: string): DeductionDetail["key"] {
  if (value && (DEDUCTION_KEYS as string[]).includes(value)) {
    return value as DeductionDetail["key"];
  }
  return "other";
}

function computeIncomeTaxBreakdown(taxable: number) {
  if (taxable <= 0) {
    return { incomeTax: 0, specialTax: 0 };
  }
  const brackets = [
    { threshold: 0, rate: 0.05, deduction: 0 },
    { threshold: 1_950_000, rate: 0.1, deduction: 97_500 },
    { threshold: 3_300_000, rate: 0.2, deduction: 427_500 },
    { threshold: 6_950_000, rate: 0.23, deduction: 636_000 },
    { threshold: 9_000_000, rate: 0.33, deduction: 1_536_000 },
    { threshold: 18_000_000, rate: 0.4, deduction: 2_796_000 },
    { threshold: 40_000_000, rate: 0.45, deduction: 4_796_000 },
  ];
  const bracket = [...brackets].reverse().find((item) => taxable >= item.threshold);
  const incomeTax = bracket ? Math.max(Math.round(taxable * bracket.rate - bracket.deduction), 0) : 0;
  const specialTax = Math.max(Math.round(incomeTax * 0.021), 0);
  return { incomeTax, specialTax };
}

export default function OutputsPage() {
  const [rawSnapshot, setRawSnapshot] = useState(() => SAMPLE_JSON);
  const [status, setStatus] = useState<string | null>(null);
  const [medicalCsv, setMedicalCsv] = useState("");
  const [cryptoCsv, setCryptoCsv] = useState("");
  const [housingCsv, setHousingCsv] = useState("");

  const [basicInfo, , basicHydrated] = usePersistentState<BasicInfoForm>(
    "step-basic-info",
    defaultBasicInfo
  );
  const [incomeRows, , incomesHydrated] = usePersistentState<StoredIncomeRow[]>(
    "step-incomes",
    defaultIncomeRows
  );
  const [deductionRows, , deductionsHydrated] = usePersistentState<StoredDeductionRow[]>(
    "step-deductions",
    defaultDeductionRows
  );
  const [taxSummary, , taxHydrated] = usePersistentState<TaxSummaryForm>(
    "step-tax",
    defaultTaxSummary
  );
  const [documents, , documentsHydrated] = usePersistentState<DocumentItem[]>(
    "step-documents",
    defaultDocuments
  );
  const [checklist, , checklistHydrated] = usePersistentState<ChecklistItem[]>(
    "step-documents-checklist",
    defaultChecklist
  );

  const hydratedAll =
    basicHydrated && incomesHydrated && deductionsHydrated && taxHydrated && documentsHydrated && checklistHydrated;

  const snapshot = useMemo(() => {
    try {
      return JSON.parse(rawSnapshot) as TaxReturnSnapshot;
    } catch (error) {
      return null;
    }
  }, [rawSnapshot]);

  const totals = useMemo(() => {
    const incomeTotal = incomeRows.reduce((sum, row) => sum + parseCurrency(row.amount), 0);
    const deductionTotal = deductionRows.reduce((sum, row) => sum + parseCurrency(row.amount), 0);
    const taxable = Math.max(incomeTotal - deductionTotal, 0);
    return { incomeTotal, deductionTotal, taxable };
  }, [incomeRows, deductionRows]);

  const totalIncome = useMemo(
    () => snapshot?.incomes.reduce((sum, income) => sum + income.amount, 0) ?? 0,
    [snapshot]
  );

  const assembledSnapshot = useMemo(() => {
    if (!hydratedAll) {
      return null;
    }

    const filingYearParsed = parseInt(basicInfo.filingYear, 10);
    const filingYear = Number.isFinite(filingYearParsed) ? filingYearParsed : new Date().getFullYear();
    const filingCategory = basicInfo.filingCategory === "white" ? "white" : "blue";

    const incomes: IncomeDetail[] = incomeRows
      .map((row) => {
        const amount = parseCurrency(row.amount);
        if (amount <= 0) return null;
        return {
          category: normalizeIncomeCategory(row.category),
          label: row.label?.trim() || "未分類所得",
          amount,
        } satisfies IncomeDetail;
      })
      .filter((item): item is IncomeDetail => item !== null);

    const deductionEntries: DeductionDetail[] = deductionRows
      .map((row) => {
        const amount = parseCurrency(row.amount);
        if (amount <= 0) return null;
        const key = normalizeDeductionKey(row.id);
        const label = row.label?.trim() || DEDUCTION_LABELS[key];
        return {
          key,
          label,
          amount,
        } satisfies DeductionDetail;
      })
      .filter((item): item is DeductionDetail => item !== null);

    const taxableFromSummary = parseCurrency(taxSummary.taxableIncome);
    const baseTaxable = taxableFromSummary > 0 ? taxableFromSummary : totals.taxable;
    const { incomeTax: autoIncomeTax, specialTax: autoSpecialTax } = computeIncomeTaxBreakdown(baseTaxable);
    const computedIncomeTax = parseCurrency(taxSummary.incomeTax) || autoIncomeTax;
    const computedSpecialTax = parseCurrency(taxSummary.specialReconstructionTax) || autoSpecialTax;

    const municipalTax = parseCurrency(taxSummary.municipalTax);
    const nationalHealthInsurance = parseCurrency(taxSummary.nationalHealthInsurance);
    const amountDue = parseCurrency(taxSummary.amountDue);
    const expectedRefund = parseCurrency(taxSummary.expectedRefund);

    const snapshotPayload: TaxReturnSnapshot = {
      taxpayer: {
        fullName: basicInfo.fullName || "未入力",
        fullNameKana: basicInfo.fullNameKana || undefined,
        myNumber: basicInfo.myNumber || undefined,
        address: basicInfo.address || "",
        phone: basicInfo.phone || undefined,
        email: basicInfo.email || undefined,
        filingCategory,
        filingYear,
      },
      incomes,
      deductions: deductionEntries,
      payments: [],
      journal: {
        totalSales: totals.incomeTotal,
        totalExpenses: totals.deductionTotal,
        netIncome: totals.incomeTotal - totals.deductionTotal,
        assetTotal: 0,
        liabilityTotal: 0,
        equityTotal: 0,
      },
      attachments: documents.map<AttachmentRecord>((doc) => ({
        label: doc.label,
        required: true,
        status: doc.status,
      })),
      computation: {
        taxableIncome: baseTaxable,
        incomeTax: computedIncomeTax,
        specialReconstructionTax: computedSpecialTax,
        municipalTax,
        nationalHealthInsurance: nationalHealthInsurance > 0 ? nationalHealthInsurance : undefined,
        expectedRefund,
        amountDue,
      },
    };

    return snapshotPayload;
  }, [
    basicInfo,
    deductionRows,
    hydratedAll,
    incomeRows,
    taxSummary,
    totals.deductionTotal,
    totals.incomeTotal,
    totals.taxable,
  ]);

  const assembledJson = useMemo(() => (assembledSnapshot ? stringifySnapshot(assembledSnapshot) : null), [assembledSnapshot]);

  const documentsProgress = useMemo(() => {
    if (!documentsHydrated || documents.length === 0) {
      return null;
    }
    const total = documents.length;
    const done = documents.filter((doc) => doc.status === "verified").length;
    const uploaded = documents.filter((doc) => doc.status !== "pending").length;
    return { total, done, uploaded };
  }, [documents, documentsHydrated]);

  const checklistProgress = useMemo(() => {
    if (!checklistHydrated || checklist.length === 0) {
      return null;
    }
    const total = checklist.length;
    const completed = checklist.filter((item) => item.done).length;
    return { total, completed };
  }, [checklist, checklistHydrated]);

  const lastAutoSnapshotRef = useRef<string | null>(SAMPLE_JSON);

  useEffect(() => {
    if (!assembledJson) return;
    if ((rawSnapshot === SAMPLE_JSON || rawSnapshot === lastAutoSnapshotRef.current) && rawSnapshot !== assembledJson) {
      setRawSnapshot(assembledJson);
    }
    lastAutoSnapshotRef.current = assembledJson;
  }, [assembledJson, rawSnapshot]);

  const medicalResult = useMemo(() => {
    if (!medicalCsv.trim()) return null;
    const parsed = parseMedicalExpenseCsv(medicalCsv);
    const summary =
      parsed.errors.length === 0 ? calculateMedicalDeduction(parsed.rows, totalIncome) : null;
    return { parsed, summary };
  }, [medicalCsv, totalIncome]);

  const cryptoResult = useMemo(() => {
    if (!cryptoCsv.trim()) return null;
    const parsed = parseCryptoTradesCsv(cryptoCsv);
    const summary =
      parsed.errors.length === 0 ? calculateCryptoPnL(parsed.rows) : null;
    return { parsed, summary };
  }, [cryptoCsv]);

  const housingResult = useMemo(() => {
    if (!housingCsv.trim()) return null;
    const parsed = parseHousingLoanCsv(housingCsv);
    const incomeTaxValue = snapshot?.computation.incomeTax ?? 0;
    const summary =
      parsed.errors.length === 0
        ? calculateHousingLoanDeduction(parsed.rows, incomeTaxValue)
        : null;
    return { parsed, summary };
  }, [housingCsv, snapshot?.computation.incomeTax]);

  const refreshFromSteps = () => {
    if (!assembledJson) {
      setStatus("STEP データを読み込めませんでした。");
      return;
    }
    setRawSnapshot(assembledJson);
    lastAutoSnapshotRef.current = assembledJson;
    setStatus("STEP データを反映しました。");
  };

  const download = async (type: "pdf" | "xml") => {
    if (!snapshot) {
      setStatus("スナップショットの JSON が正しくありません。");
      return;
    }
    setStatus(`${type.toUpperCase()} を生成中...`);
    try {
      const response = await fetch(`/api/outputs/${type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(snapshot),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = type === "pdf" ? "tax-return.pdf" : "tax-return.xml";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus(`${type.toUpperCase()} をダウンロードしました。`);
    } catch (error) {
      console.error(error);
      setStatus(`${type.toUpperCase()} の生成に失敗しました。`);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 sm:px-10 lg:px-16">
        <header className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">
            Outputs Center
          </span>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">
            確定申告書B 出力センター
          </h1>
          <p className="max-w-3xl text-sm text-slate-200/80 sm:text-base">
            申告スナップショットを入力して、PDF と e-Tax 用 XML をダウンロードできます。
            サンプルデータを基に調整し、必要に応じて JSON を編集してください。
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <label className="flex flex-col gap-2 text-sm text-slate-200">
              <span>申告スナップショット (JSON)</span>
              <textarea
                value={rawSnapshot}
                onChange={(event) => setRawSnapshot(event.target.value)}
                rows={20}
                className="h-full min-h-[360px] rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 font-mono text-xs text-emerald-100 focus:border-emerald-400 focus:outline-none"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={refreshFromSteps}
                type="button"
                disabled={!assembledSnapshot}
                className="rounded-full border border-emerald-300/60 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                STEPデータを反映
              </button>
              <button
                onClick={() => setRawSnapshot(stringifySnapshot(createSampleSnapshot()))}
                type="button"
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-emerald-400/60 hover:text-emerald-200"
              >
                サンプルを読み込む
              </button>
              <button
                onClick={() => download("pdf")}
                type="button"
                className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                PDF を生成
              </button>
              <button
                onClick={() => download("xml")}
                type="button"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-white/40 hover:text-white"
              >
                XML を生成
              </button>
            </div>
            {status && (
              <p className="text-xs text-emerald-200/80">{status}</p>
            )}
          </div>

          <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold text-white">ダイジェスト</h2>
            {(documentsProgress || checklistProgress) && (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-xs text-emerald-100">
                <p className="font-semibold text-emerald-200">提出準備状況</p>
                {documentsProgress && (
                  <p>
                    書類: 確認済み {documentsProgress.done}/{documentsProgress.total} 件
                    （アップロード {documentsProgress.uploaded}/{documentsProgress.total}）
                  </p>
                )}
                {checklistProgress && (
                  <p>
                    チェックリスト: 完了 {checklistProgress.completed}/{checklistProgress.total} 項目
                  </p>
                )}
              </div>
            )}
            {snapshot ? (
              <div className="space-y-4 text-sm text-slate-200/90">
                <div>
                  <h3 className="text-xs uppercase tracking-[0.25em] text-white/50">納税者情報</h3>
                  <p>{snapshot.taxpayer.fullName}</p>
                  <p>{snapshot.taxpayer.address}</p>
                  <p>申告区分: {snapshot.taxpayer.filingCategory === "blue" ? "青色" : "白色"}</p>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-[0.25em] text-white/50">所得</h3>
                  <ul className="space-y-1">
                    {snapshot.incomes.map((income) => (
                      <li key={`${income.category}-${income.label}`}>
                        {income.label}: {income.amount.toLocaleString()} 円
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-[0.25em] text-white/50">控除</h3>
                  <ul className="space-y-1">
                    {snapshot.deductions.map((deduction) => (
                      <li key={`${deduction.key}-${deduction.label}`}>
                        {deduction.label}: {deduction.amount.toLocaleString()} 円
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-[0.25em] text-white/50">計算結果</h3>
                  <p>課税所得: {snapshot.computation.taxableIncome.toLocaleString()} 円</p>
                  <p>所得税: {snapshot.computation.incomeTax.toLocaleString()} 円</p>
                  <p>復興特別所得税: {snapshot.computation.specialReconstructionTax.toLocaleString()} 円</p>
                  <p>納付額: {snapshot.computation.amountDue.toLocaleString()} 円</p>
                  <p>還付額: {snapshot.computation.expectedRefund.toLocaleString()} 円</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-rose-300/80">JSON のパースに失敗しました。</p>
            )}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-3">
          <CalculatorCard
            title="医療費控除の計算"
            description="医療費 CSV を貼り付けると控除額を自動計算します。列: provider, patient, amount, reimbursed"
            textareaValue={medicalCsv}
            onChange={setMedicalCsv}
            errors={medicalResult?.parsed.errors ?? []}
            resultContent={(() => {
              if (!medicalResult?.summary) return null;
              const { total, reimbursements, net, threshold, deduction } = medicalResult.summary;
              return (
                <ul className="space-y-1 text-sm text-slate-200/90">
                  <li>支払医療費: {total.toNumber().toLocaleString()} 円</li>
                  <li>補填額: {reimbursements.toNumber().toLocaleString()} 円</li>
                  <li>控除対象額: {net.toNumber().toLocaleString()} 円</li>
                  <li>足切り額 (10万円 or 所得5%): {threshold.toNumber().toLocaleString()} 円</li>
                  <li className="text-emerald-300">医療費控除額: {deduction.toNumber().toLocaleString()} 円</li>
                </ul>
              );
            })()}
          />

          <CalculatorCard
            title="仮想通貨損益計算"
            description="仮想通貨の取引 CSV を貼り付けると損益を計算します。列: date, pair, side, quantity, price, fee"
            textareaValue={cryptoCsv}
            onChange={setCryptoCsv}
            errors={cryptoResult?.parsed.errors ?? []}
            resultContent={(() => {
              if (!cryptoResult?.summary) return null;
              const { realized, remainingQuantity, remainingCost } = cryptoResult.summary;
              return (
                <ul className="space-y-1 text-sm text-slate-200/90">
                  <li className="text-emerald-300">確定損益: {realized.toNumber().toLocaleString()} 円</li>
                  <li>保有量: {remainingQuantity.toNumber().toLocaleString()}</li>
                  <li>残コスト: {remainingCost.toNumber().toLocaleString()} 円</li>
                </ul>
              );
            })()}
          />

          <CalculatorCard
            title="住宅ローン控除"
            description="年末残高 CSV を貼り付けると控除額を試算します。列: year, outstandingPrincipal, deductionRate, maxDeduction"
            textareaValue={housingCsv}
            onChange={setHousingCsv}
            errors={housingResult?.parsed.errors ?? []}
            resultContent={(() => {
              if (!housingResult?.summary) return null;
              const deduction = housingResult.summary;
              const incomeTaxValue = snapshot?.computation.incomeTax ?? 0;
              const remainingTax = Math.max(incomeTaxValue - deduction.toNumber(), 0);
              return (
                <ul className="space-y-1 text-sm text-slate-200/90">
                  <li>控除額 (限度額反映済み): {deduction.toNumber().toLocaleString()} 円</li>
                  <li>所得税額への適用後残高: {remainingTax.toLocaleString()} 円</li>
                </ul>
              );
            })()}
          />
        </section>
      </div>
    </main>
  );
}

type CalculatorCardProps = {
  title: string;
  description: string;
  textareaValue: string;
  onChange: (value: string) => void;
  errors: { line: number; message: string }[];
  resultContent: React.ReactNode;
};

function CalculatorCard({
  title,
  description,
  textareaValue,
  onChange,
  errors,
  resultContent,
}: CalculatorCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-xs text-slate-300/80">{description}</p>
      </div>
      <textarea
        value={textareaValue}
        onChange={(event) => onChange(event.target.value)}
        rows={10}
        placeholder="CSV データを貼り付け"
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 font-mono text-xs text-emerald-100 focus:border-emerald-400 focus:outline-none"
      />
      {errors.length > 0 && (
        <div className="space-y-1 rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-xs text-rose-200">
          {errors.map((error) => (
            <p key={`${error.line}-${error.message}`}>
              行 {error.line}: {error.message}
            </p>
          ))}
        </div>
      )}
      {resultContent && (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3">
          {resultContent}
        </div>
      )}
    </div>
  );
}
