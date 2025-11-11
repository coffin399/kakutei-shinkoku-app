import type { TaxReturnSnapshot } from "./types";

export function createSampleSnapshot(): TaxReturnSnapshot {
  return {
    taxpayer: {
      fullName: "山田 太郎",
      fullNameKana: "ヤマダ タロウ",
      myNumber: "1234-5678-9012",
      address: "東京都千代田区1-1-1",
      phone: "03-1234-5678",
      email: "sample@example.com",
      filingCategory: "blue",
      filingYear: 2024,
    },
    incomes: [
      { category: "salary", label: "給与所得", amount: 4_800_000, withholdingTax: 450_000 },
      { category: "business", label: "事業所得", amount: 2_400_000 },
      { category: "misc", label: "雑所得（副業）", amount: 300_000 },
    ],
    deductions: [
      { key: "basic", label: "基礎控除", amount: 480_000 },
      { key: "social_insurance", label: "社会保険料控除", amount: 600_000 },
      { key: "life_insurance", label: "生命保険料控除", amount: 120_000 },
    ],
    payments: [
      { type: "withholding", label: "給与の源泉徴収", amount: 450_000 },
      { type: "estimated_tax", label: "予定納税", amount: 120_000 },
    ],
    journal: {
      totalSales: 2_800_000,
      totalExpenses: 400_000,
      netIncome: 2_400_000,
      assetTotal: 5_600_000,
      liabilityTotal: 1_200_000,
      equityTotal: 4_400_000,
    },
    attachments: [
      { label: "源泉徴収票", required: true, status: "uploaded" },
      { label: "医療費の領収書", required: false, status: "pending" },
      { label: "寄附金受領証明書", required: false, status: "verified" },
    ],
    computation: {
      taxableIncome: 4_520_000,
      incomeTax: 366_000,
      specialReconstructionTax: 7_686,
      municipalTax: 320_000,
      expectedRefund: 40_000,
      amountDue: 53_686,
    },
  };
}
