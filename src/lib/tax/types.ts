export type FilingCategory = "blue" | "white";

export type TaxpayerInfo = {
  fullName: string;
  fullNameKana?: string;
  myNumber?: string;
  address: string;
  phone?: string;
  email?: string;
  filingCategory: FilingCategory;
  filingYear: number;
};

export type IncomeDetail = {
  category:
    | "salary"
    | "business"
    | "real_estate"
    | "dividend"
    | "misc"
    | "crypto"
    | "temporary"
    | "other";
  label: string;
  amount: number;
  withholdingTax?: number;
};

export type DeductionDetail = {
  key:
    | "basic"
    | "spouse"
    | "spouse_special"
    | "dependents"
    | "social_insurance"
    | "life_insurance"
    | "earthquake_insurance"
    | "medical"
    | "donation"
    | "small_business_mutual"
    | "housing"
    | "other";
  label: string;
  amount: number;
};

export type PaymentRecord = {
  type: "withholding" | "estimated_tax" | "other";
  label: string;
  amount: number;
};

export type JournalEntrySummary = {
  totalSales: number;
  totalExpenses: number;
  netIncome: number;
  assetTotal: number;
  liabilityTotal: number;
  equityTotal: number;
};

export type AttachmentRecord = {
  label: string;
  required: boolean;
  status: "pending" | "uploaded" | "verified";
};

export type MedicalExpenseEntry = {
  provider: string;
  patient: string;
  amount: number;
  reimbursed?: number;
};

export type CryptoTrade = {
  id: string;
  date: string;
  pair: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  fee?: number;
};

export type HousingLoanRecord = {
  year: number;
  outstandingPrincipal: number;
  deductionRate: number;
  maxDeduction: number;
};

export type CSVImportResult<T> = {
  rows: T[];
  errors: { line: number; message: string }[];
};

export type TaxReturnSnapshot = {
  taxpayer: TaxpayerInfo;
  incomes: IncomeDetail[];
  deductions: DeductionDetail[];
  payments: PaymentRecord[];
  journal: JournalEntrySummary;
  attachments: AttachmentRecord[];
  computation: {
    taxableIncome: number;
    incomeTax: number;
    specialReconstructionTax: number;
    municipalTax: number;
    nationalHealthInsurance?: number;
    expectedRefund: number;
    amountDue: number;
  };
};
