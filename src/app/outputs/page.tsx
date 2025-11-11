"use client";

import { useMemo, useState } from "react";
import type { TaxReturnSnapshot } from "@/lib/tax/types";
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

export default function OutputsPage() {
  const [rawSnapshot, setRawSnapshot] = useState(() => stringifySnapshot(createSampleSnapshot()));
  const [status, setStatus] = useState<string | null>(null);
  const [medicalCsv, setMedicalCsv] = useState("");
  const [cryptoCsv, setCryptoCsv] = useState("");
  const [housingCsv, setHousingCsv] = useState("");

  const snapshot = useMemo(() => {
    try {
      return JSON.parse(rawSnapshot) as TaxReturnSnapshot;
    } catch (error) {
      return null;
    }
  }, [rawSnapshot]);

  const totalIncome = useMemo(
    () => snapshot?.incomes.reduce((sum, income) => sum + income.amount, 0) ?? 0,
    [snapshot]
  );

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
