import Decimal from "decimal.js";
import { DateTime } from "luxon";
import {
  CryptoTrade,
  DeductionDetail,
  HousingLoanRecord,
  IncomeDetail,
  MedicalExpenseEntry,
} from "./types";

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

export type TaxComputationOptions = {
  reconstructionTaxRate?: number;
  progressiveRates?: {
    threshold: number;
    rate: number;
    deduction: number;
  }[];
};

const DEFAULT_PROGRESSIVE_RATES = [
  { threshold: 0, rate: 0.05, deduction: 0 },
  { threshold: 1_950_000, rate: 0.1, deduction: 97_500 },
  { threshold: 3_300_000, rate: 0.2, deduction: 427_500 },
  { threshold: 6_950_000, rate: 0.23, deduction: 636_000 },
  { threshold: 9_000_000, rate: 0.33, deduction: 1_536_000 },
  { threshold: 18_000_000, rate: 0.4, deduction: 2_796_000 },
  { threshold: 40_000_000, rate: 0.45, deduction: 4_796_000 },
];

export function sumIncome(incomes: IncomeDetail[]): Decimal {
  return incomes.reduce((acc, income) => acc.plus(income.amount), new Decimal(0));
}

export function sumDeductions(deductions: DeductionDetail[]): Decimal {
  return deductions.reduce((acc, deduction) => acc.plus(deduction.amount), new Decimal(0));
}

export function calculateTaxableIncome(
  incomes: IncomeDetail[],
  deductions: DeductionDetail[],
  options: TaxComputationOptions = {}
): Decimal {
  const totalIncome = sumIncome(incomes);
  const totalDeduction = sumDeductions(deductions);
  const taxable = totalIncome.minus(totalDeduction);
  return Decimal.max(taxable, 0);
}

export function calculateIncomeTax(
  taxableIncome: Decimal,
  options: TaxComputationOptions = {}
): Decimal {
  const progressive = options.progressiveRates ?? DEFAULT_PROGRESSIVE_RATES;
  let tax = new Decimal(0);

  for (let i = progressive.length - 1; i >= 0; i -= 1) {
    const bracket = progressive[i];
    if (taxableIncome.greaterThanOrEqualTo(bracket.threshold)) {
      tax = taxableIncome.times(bracket.rate).minus(bracket.deduction);
      break;
    }
  }

  return Decimal.max(tax, 0).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
}

export function calculateSpecialReconstructionTax(
  incomeTax: Decimal,
  options: TaxComputationOptions = {}
): Decimal {
  const rate = options.reconstructionTaxRate ?? 0.021;
  return incomeTax.times(rate).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
}

export function aggregateMedicalExpenses(entries: MedicalExpenseEntry[]) {
  const total = entries.reduce((acc, item) => acc.plus(item.amount), new Decimal(0));
  const reimbursements = entries.reduce(
    (acc, item) => acc.plus(item.reimbursed ?? 0),
    new Decimal(0)
  );
  const net = total.minus(reimbursements);
  return { total, reimbursements, net };
}

export function calculateMedicalDeduction(
  entries: MedicalExpenseEntry[],
  totalIncome: number
) {
  const aggregate = aggregateMedicalExpenses(entries);
  const incomeDecimal = new Decimal(totalIncome);
  const threshold = Decimal.min(new Decimal(100_000), incomeDecimal.times(0.05));
  const deduction = Decimal.max(aggregate.net.minus(threshold), 0);
  return { ...aggregate, threshold, deduction };
}

type CryptoCostBasis = {
  quantity: Decimal;
  cost: Decimal;
};

export function calculateCryptoPnL(trades: CryptoTrade[]) {
  const sorted = [...trades].sort((a, b) => DateTime.fromISO(a.date).toMillis() - DateTime.fromISO(b.date).toMillis());
  const inventory: CryptoCostBasis = { quantity: new Decimal(0), cost: new Decimal(0) };
  let realized = new Decimal(0);

  for (const trade of sorted) {
    const qty = new Decimal(trade.quantity);
    const value = qty.times(trade.price).plus(trade.fee ?? 0);

    if (trade.side === "buy") {
      inventory.cost = inventory.cost.plus(value);
      inventory.quantity = inventory.quantity.plus(qty);
    } else {
      if (inventory.quantity.lessThan(qty)) {
        throw new Error("Not enough inventory to sell");
      }
      const averageCost = inventory.cost.dividedBy(inventory.quantity);
      const costBasis = averageCost.times(qty);
      const proceeds = value;
      realized = realized.plus(proceeds.minus(costBasis));
      inventory.quantity = inventory.quantity.minus(qty);
      inventory.cost = averageCost.times(inventory.quantity);
    }
  }

  return { realized, remainingQuantity: inventory.quantity, remainingCost: inventory.cost };
}

export function calculateHousingLoanDeduction(records: HousingLoanRecord[], incomeTax: Decimal) {
  const latest = [...records].sort((a, b) => b.year - a.year)[0];
  if (!latest) return new Decimal(0);
  const deduction = new Decimal(latest.outstandingPrincipal)
    .times(latest.deductionRate)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  const capped = Decimal.min(deduction, latest.maxDeduction);
  return Decimal.min(capped, incomeTax);
}
