"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

type AccountDefinition = {
  id: string;
  name: string;
  type: AccountType;
};

type JournalEntry = {
  id: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  memo?: string;
};

type NewEntryState = {
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: string;
  memo: string;
};

type BalanceMap = Record<string, number>;

type FinancialStatements = {
  profitAndLoss: {
    revenue: { account: AccountDefinition; balance: number }[];
    expenses: { account: AccountDefinition; balance: number }[];
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
  balanceSheet: {
    assets: { account: AccountDefinition; balance: number }[];
    liabilities: { account: AccountDefinition; balance: number }[];
    equity: { account: AccountDefinition; balance: number }[];
    totalAssets: number;
    totalLiabilitiesAndEquity: number;
  };
};

const STORAGE_KEY = "kakutei.blue.entries.v1";
const SUMMARY_STORAGE_KEY = "kakutei.blue.summary";

const ACCOUNT_GROUPS: {
  label: string;
  type: AccountType;
  accounts: AccountDefinition[];
}[] = [
  {
    label: "資産 (Assets)",
    type: "asset",
    accounts: [
      { id: "cash", name: "現金", type: "asset" },
      { id: "bank", name: "普通預金", type: "asset" },
      { id: "accounts_receivable", name: "売掛金", type: "asset" },
      { id: "inventory", name: "棚卸資産", type: "asset" },
      { id: "equipment", name: "備品", type: "asset" },
    ],
  },
  {
    label: "負債 (Liabilities)",
    type: "liability",
    accounts: [
      { id: "accounts_payable", name: "買掛金", type: "liability" },
      { id: "accrued_expenses", name: "未払費用", type: "liability" },
      { id: "short_term_loans", name: "短期借入金", type: "liability" },
      { id: "long_term_loans", name: "長期借入金", type: "liability" },
    ],
  },
  {
    label: "純資産 (Equity)",
    type: "equity",
    accounts: [
      { id: "capital", name: "元入金", type: "equity" },
      { id: "retained_earnings", name: "前期繰越利益", type: "equity" },
    ],
  },
  {
    label: "収益 (Revenue)",
    type: "revenue",
    accounts: [
      { id: "sales", name: "売上高", type: "revenue" },
      { id: "service_revenue", name: "役務提供収益", type: "revenue" },
      { id: "interest_income", name: "受取利息", type: "revenue" },
    ],
  },
  {
    label: "費用 (Expenses)",
    type: "expense",
    accounts: [
      { id: "cogs", name: "売上原価", type: "expense" },
      { id: "rent", name: "地代家賃", type: "expense" },
      { id: "utilities", name: "水道光熱費", type: "expense" },
      { id: "salary", name: "給料賃金", type: "expense" },
      { id: "misc_expense", name: "雑費", type: "expense" },
    ],
  },
];

const ACCOUNT_LOOKUP = ACCOUNT_GROUPS.flatMap((group) => group.accounts).reduce(
  (acc, account) => {
    acc[account.id] = account;
    return acc;
  },
  {} as Record<string, AccountDefinition>
);

function createInitialEntry(): NewEntryState {
  return {
    date: new Date().toISOString().slice(0, 10),
    description: "",
    debitAccount: "cash",
    creditAccount: "sales",
    amount: "",
    memo: "",
  };
}

function computeBalances(entries: JournalEntry[]): BalanceMap {
  return entries.reduce((acc, entry) => {
    acc[entry.debitAccount] = (acc[entry.debitAccount] ?? 0) + entry.amount;
    acc[entry.creditAccount] = (acc[entry.creditAccount] ?? 0) - entry.amount;
    return acc;
  }, {} as BalanceMap);
}

function computeStatements(entries: JournalEntry[]): FinancialStatements {
  const balances = computeBalances(entries);

  const pickByType = (type: AccountType) =>
    Object.entries(balances)
      .filter(([accountId]) => ACCOUNT_LOOKUP[accountId]?.type === type)
      .map(([accountId, balance]) => ({
        account: ACCOUNT_LOOKUP[accountId],
        balance,
      }))
      .filter(({ balance }) => balance !== 0)
      .sort((a, b) => a.account.name.localeCompare(b.account.name, "ja"));

  const revenue = pickByType("revenue");
  const expenses = pickByType("expense");
  const assets = pickByType("asset");
  const liabilities = pickByType("liability");
  const equity = pickByType("equity");

  const totalRevenue = revenue.reduce((sum, { balance }) => sum + -balance, 0);
  const totalExpenses = expenses.reduce((sum, { balance }) => sum + balance, 0);
  const netIncome = totalRevenue - totalExpenses;

  const totalAssets = assets.reduce((sum, { balance }) => sum + balance, 0);
  const totalLiabilitiesAndEquity =
    liabilities.reduce((sum, { balance }) => sum + -balance, 0) +
    equity.reduce((sum, { balance }) => sum + -balance, 0) +
    netIncome;

  return {
    profitAndLoss: {
      revenue,
      expenses,
      totalRevenue,
      totalExpenses,
      netIncome,
    },
    balanceSheet: {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilitiesAndEquity,
    },
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function BlueReturnPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [draft, setDraft] = useState<NewEntryState>(createInitialEntry);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as JournalEntry[];
      setEntries(parsed);
    } catch (error) {
      console.error("Failed to parse stored journal entries", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const statements = useMemo(() => computeStatements(entries), [entries]);

  useEffect(() => {
    const summary = {
      totalRevenue: statements.profitAndLoss.totalRevenue,
      totalExpenses: statements.profitAndLoss.totalExpenses,
      netIncome: statements.profitAndLoss.netIncome,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(SUMMARY_STORAGE_KEY, JSON.stringify(summary));
  }, [statements.profitAndLoss.netIncome, statements.profitAndLoss.totalExpenses, statements.profitAndLoss.totalRevenue]);

  const handleDraftChange = (field: keyof NewEntryState, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const amount = Number(draft.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("金額は 0 より大きい数値で入力してください。");
      return;
    }
    const nextEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date: draft.date,
      description: draft.description || "取引",
      debitAccount: draft.debitAccount,
      creditAccount: draft.creditAccount,
      amount,
      memo: draft.memo.trim() ? draft.memo : undefined,
    };
    setEntries((prev) => [nextEntry, ...prev]);
    setDraft(createInitialEntry());
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleReset = () => {
    if (!window.confirm("全ての仕訳データを削除しますか？")) return;
    setEntries([]);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-14 sm:px-10 lg:px-16">
        <header className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">
            Blue Return Ledger
          </span>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">
            青色申告帳簿センター
          </h1>
          <p className="max-w-3xl text-sm text-slate-200/80 sm:text-base">
            仕訳入力から損益計算書・貸借対照表の自動集計までをローカルで完結。ブラウザの
            ローカルストレージに保存されるため、通信環境に依存せず帳簿整理が行えます。
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold text-white">仕訳入力</h2>
              <p className="text-xs text-slate-300/80 sm:text-sm">
                発生日、摘要、借方・貸方勘定科目、金額を入力し「仕訳を追加」。証憑番号などの補足はメモ欄に記録できます。
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="発生日">
                <input
                  type="date"
                  value={draft.date}
                  onChange={(event) => handleDraftChange("date", event.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-base text-white focus:border-emerald-400 focus:outline-none"
                />
              </Field>
              <Field label="金額 (円)">
                <input
                  type="number"
                  min={0}
                  step={"100"}
                  value={draft.amount}
                  onChange={(event) => handleDraftChange("amount", event.target.value)}
                  placeholder="10000"
                  className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-base text-white focus:border-emerald-400 focus:outline-none"
                  required
                />
              </Field>
            </div>

            <Field label="摘要">
              <input
                type="text"
                value={draft.description}
                placeholder="例) 売上入金"
                onChange={(event) => handleDraftChange("description", event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-base text-white focus:border-emerald-400 focus:outline-none"
              />
            </Field>

            <Field label="メモ">
              <textarea
                rows={2}
                value={draft.memo}
                placeholder="証憑番号や備考を入力"
                onChange={(event) => handleDraftChange("memo", event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-base text-white focus:border-emerald-400 focus:outline-none"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="借方勘定科目">
                <AccountSelect
                  value={draft.debitAccount}
                  onChange={(value) => handleDraftChange("debitAccount", value)}
                />
              </Field>
              <Field label="貸方勘定科目">
                <AccountSelect
                  value={draft.creditAccount}
                  onChange={(value) => handleDraftChange("creditAccount", value)}
                />
              </Field>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                仕訳を追加
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/80 transition hover:border-rose-400/60 hover:text-rose-200"
              >
                全ての仕訳をリセット
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold text-white">ハイライト</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryCard
                title="売上総額"
                value={statements.profitAndLoss.totalRevenue}
                accent="from-emerald-400/40 to-emerald-500/50"
              />
              <SummaryCard
                title="費用総額"
                value={statements.profitAndLoss.totalExpenses}
                accent="from-rose-400/40 to-rose-500/50"
              />
              <SummaryCard
                title="当期純利益"
                value={statements.profitAndLoss.netIncome}
                accent="from-sky-400/40 to-blue-500/50"
              />
              <SummaryCard
                title="資産合計"
                value={statements.balanceSheet.totalAssets}
                accent="from-amber-400/40 to-orange-500/50"
              />
            </div>
            <p className="text-xs leading-relaxed text-slate-300/70">
              データはブラウザのローカルストレージに保存されています。キャッシュ削除やブラウザ変更を行う前に、必要であればエクスポート機能（今後追加予定）をご利用ください。
            </p>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <StatementSection
            title="損益計算書"
            revenue={statements.profitAndLoss.revenue}
            expenses={statements.profitAndLoss.expenses}
            totalRevenue={statements.profitAndLoss.totalRevenue}
            totalExpenses={statements.profitAndLoss.totalExpenses}
            netIncome={statements.profitAndLoss.netIncome}
          />
          <BalanceSheetSection
            assets={statements.balanceSheet.assets}
            liabilities={statements.balanceSheet.liabilities}
            equity={statements.balanceSheet.equity}
            totalAssets={statements.balanceSheet.totalAssets}
            totalLiabilitiesAndEquity={
              statements.balanceSheet.totalLiabilitiesAndEquity
            }
            netIncome={statements.profitAndLoss.netIncome}
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-white">仕訳一覧</h2>
            <p className="text-xs text-slate-300/80 sm:text-sm">
              最新の仕訳が上に表示されます。誤入力を見つけた場合は削除して再登録してください。
            </p>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="text-left text-slate-300/80">
                <tr>
                  <th className="px-4 py-3 font-semibold">日付</th>
                  <th className="px-4 py-3 font-semibold">摘要</th>
                  <th className="px-4 py-3 font-semibold">借方</th>
                  <th className="px-4 py-3 font-semibold">貸方</th>
                  <th className="px-4 py-3 font-semibold text-right">金額</th>
                  <th className="px-4 py-3 font-semibold">メモ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200/90">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                      まだ仕訳が登録されていません。
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 align-top text-xs font-medium text-slate-300">
                        {entry.date}
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-white">
                        {entry.description}
                      </td>
                      <td className="px-4 py-3 align-top text-sm">
                        {ACCOUNT_LOOKUP[entry.debitAccount]?.name ?? entry.debitAccount}
                      </td>
                      <td className="px-4 py-3 align-top text-sm">
                        {ACCOUNT_LOOKUP[entry.creditAccount]?.name ?? entry.creditAccount}
                      </td>
                      <td className="px-4 py-3 align-top text-right text-sm font-semibold text-emerald-200">
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-slate-300">
                        {entry.memo ?? "-"}
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200 transition hover:border-rose-400/60 hover:text-rose-200"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

type FieldProps = {
  label: string;
  children: ReactNode;
};

function Field({ label, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-200">
      <span>{label}</span>
      {children}
    </label>
  );
}

type AccountSelectProps = {
  value: string;
  onChange: (value: string) => void;
};

function AccountSelect({ value, onChange }: AccountSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-base text-white focus:border-emerald-400 focus:outline-none"
    >
      {ACCOUNT_GROUPS.map((group) => (
        <optgroup key={group.type} label={group.label}>
          {group.accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

type SummaryCardProps = {
  title: string;
  value: number;
  accent: string;
};

function SummaryCard({ title, value, accent }: SummaryCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 p-5">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-40`} />
      <div className="relative flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-white/60">{title}</span>
        <span className="text-2xl font-semibold text-white">{formatCurrency(value)}</span>
      </div>
    </div>
  );
}

type StatementSectionProps = {
  title: string;
  revenue: { account: AccountDefinition; balance: number }[];
  expenses: { account: AccountDefinition; balance: number }[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
};

function StatementSection({
  title,
  revenue,
  expenses,
  totalRevenue,
  totalExpenses,
  netIncome,
}: StatementSectionProps) {
  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <p className="text-xs text-slate-300/80 sm:text-sm">
          収益と費用を集計し、青色申告決算書の損益計算書部分に相当する値を確認できます。
        </p>
      </div>
      <div className="space-y-6">
        <StatementList
          heading="収益"
          data={revenue.map(({ account, balance }) => ({
            id: account.id,
            name: account.name,
            value: -balance,
          }))}
          totalLabel="収益合計"
          totalValue={totalRevenue}
        />
        <StatementList
          heading="費用"
          data={expenses.map(({ account, balance }) => ({
            id: account.id,
            name: account.name,
            value: balance,
          }))}
          totalLabel="費用合計"
          totalValue={totalExpenses}
        />
        <div className="flex justify-between rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-base font-semibold text-white">
          <span>当期純利益</span>
          <span>{formatCurrency(netIncome)}</span>
        </div>
      </div>
    </div>
  );
}

type StatementListProps = {
  heading: string;
  data: { id: string; name: string; value: number }[];
  totalLabel: string;
  totalValue: number;
};

function StatementList({ heading, data, totalLabel, totalValue }: StatementListProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white/80">{heading}</h3>
      <ul className="mt-2 space-y-1 text-sm text-slate-200/90">
        {data.length === 0 ? (
          <li className="text-slate-400">該当なし</li>
        ) : (
          data.map((row) => (
            <li key={row.id} className="flex justify-between">
              <span>{row.name}</span>
              <span>{formatCurrency(row.value)}</span>
            </li>
          ))
        )}
      </ul>
      <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-sm font-semibold text-white">
        <span>{totalLabel}</span>
        <span>{formatCurrency(totalValue)}</span>
      </div>
    </div>
  );
}

type BalanceSheetSectionProps = {
  assets: { account: AccountDefinition; balance: number }[];
  liabilities: { account: AccountDefinition; balance: number }[];
  equity: { account: AccountDefinition; balance: number }[];
  totalAssets: number;
  totalLiabilitiesAndEquity: number;
  netIncome: number;
};

function BalanceSheetSection({
  assets,
  liabilities,
  equity,
  totalAssets,
  totalLiabilitiesAndEquity,
  netIncome,
}: BalanceSheetSectionProps) {
  const difference = totalAssets - totalLiabilitiesAndEquity;
  const liabilityRows = liabilities.map(({ account, balance }) => ({
    id: account.id,
    name: account.name,
    value: -balance,
  }));
  const equityRows = [
    ...equity.map(({ account, balance }) => ({
      id: account.id,
      name: account.name,
      value: -balance,
    })),
    { id: "net_income", name: "当期純利益", value: netIncome },
  ];
  const totalLiabilityValue = liabilityRows.reduce((sum, row) => sum + row.value, 0);
  const totalEquityValue = equityRows.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">貸借対照表</h2>
        <p className="text-xs text-slate-300/80 sm:text-sm">
          資産と負債・純資産のバランスを確認します。当期純利益は純資産に自動的に加算されています。
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <BalanceList
          heading="資産"
          data={assets.map(({ account, balance }) => ({
            id: account.id,
            name: account.name,
            value: balance,
          }))}
          totalLabel="資産合計"
          totalValue={totalAssets}
        />
        <div className="space-y-6">
          <BalanceList
            heading="負債"
            data={liabilityRows}
            totalLabel="負債合計"
            totalValue={totalLiabilityValue}
          />
          <BalanceList
            heading="純資産"
            data={equityRows}
            totalLabel="純資産合計"
            totalValue={totalEquityValue}
          />
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-white">
        <div className="flex justify-between">
          <span>負債・純資産合計</span>
          <span>{formatCurrency(totalLiabilitiesAndEquity)}</span>
        </div>
        <div
          className={`mt-2 rounded-xl border px-3 py-2 text-xs font-medium ${
            Math.abs(difference) < 1
              ? "border-emerald-400/60 text-emerald-200"
              : "border-rose-400/60 text-rose-200"
          }`}
        >
          バランス差額: {formatCurrency(difference)}
        </div>
      </div>
    </div>
  );
}

type BalanceListProps = {
  heading: string;
  data: { id: string; name: string; value: number }[];
  totalLabel: string;
  totalValue: number;
};

function BalanceList({ heading, data, totalLabel, totalValue }: BalanceListProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white/80">{heading}</h3>
      <ul className="mt-2 space-y-1 text-sm text-slate-200/90">
        {data.length === 0 ? (
          <li className="text-slate-400">該当なし</li>
        ) : (
          data.map((row) => (
            <li key={row.id} className="flex justify-between">
              <span>{row.name}</span>
              <span>{formatCurrency(row.value)}</span>
            </li>
          ))
        )}
      </ul>
      <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-sm font-semibold text-white">
        <span>{totalLabel}</span>
        <span>{formatCurrency(totalValue)}</span>
      </div>
    </div>
  );
}
