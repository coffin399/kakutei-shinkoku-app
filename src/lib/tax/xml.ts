import { create } from "xmlbuilder2";
import type { TaxReturnSnapshot } from "./types";

export function generateTaxReturnXml(snapshot: TaxReturnSnapshot): string {
  const root = create({ version: "1.0", encoding: "UTF-8" }).ele("TaxReturn");
  const taxpayer = root.ele("Taxpayer");
  taxpayer.ele("FullName").txt(snapshot.taxpayer.fullName);
  if (snapshot.taxpayer.fullNameKana) {
    taxpayer.ele("FullNameKana").txt(snapshot.taxpayer.fullNameKana);
  }
  taxpayer.ele("FilingYear").txt(String(snapshot.taxpayer.filingYear));
  taxpayer.ele("FilingCategory").txt(snapshot.taxpayer.filingCategory);
  taxpayer.ele("Address").txt(snapshot.taxpayer.address);
  if (snapshot.taxpayer.phone) {
    taxpayer.ele("Phone").txt(snapshot.taxpayer.phone);
  }
  if (snapshot.taxpayer.email) {
    taxpayer.ele("Email").txt(snapshot.taxpayer.email);
  }

  const incomes = root.ele("Incomes");
  snapshot.incomes.forEach((income) => {
    const incomeNode = incomes.ele("Income");
    incomeNode.ele("Category").txt(income.category);
    incomeNode.ele("Label").txt(income.label);
    incomeNode.ele("Amount").txt(String(income.amount));
    if (typeof income.withholdingTax === "number") {
      incomeNode.ele("WithholdingTax").txt(String(income.withholdingTax));
    }
  });

  const deductions = root.ele("Deductions");
  snapshot.deductions.forEach((deduction) => {
    const node = deductions.ele("Deduction");
    node.ele("Key").txt(deduction.key);
    node.ele("Label").txt(deduction.label);
    node.ele("Amount").txt(String(deduction.amount));
  });

  const payments = root.ele("Payments");
  snapshot.payments.forEach((payment) => {
    const node = payments.ele("Payment");
    node.ele("Type").txt(payment.type);
    node.ele("Label").txt(payment.label);
    node.ele("Amount").txt(String(payment.amount));
  });

  const computation = root.ele("Computation");
  computation.ele("TaxableIncome").txt(String(snapshot.computation.taxableIncome));
  computation.ele("IncomeTax").txt(String(snapshot.computation.incomeTax));
  computation
    .ele("SpecialReconstructionTax")
    .txt(String(snapshot.computation.specialReconstructionTax));
  computation.ele("MunicipalTax").txt(String(snapshot.computation.municipalTax));
  if (typeof snapshot.computation.nationalHealthInsurance === "number") {
    computation
      .ele("NationalHealthInsurance")
      .txt(String(snapshot.computation.nationalHealthInsurance));
  }
  computation.ele("ExpectedRefund").txt(String(snapshot.computation.expectedRefund));
  computation.ele("AmountDue").txt(String(snapshot.computation.amountDue));

  const journal = root.ele("Journal");
  journal.ele("TotalSales").txt(String(snapshot.journal.totalSales));
  journal.ele("TotalExpenses").txt(String(snapshot.journal.totalExpenses));
  journal.ele("NetIncome").txt(String(snapshot.journal.netIncome));
  journal.ele("AssetTotal").txt(String(snapshot.journal.assetTotal));
  journal.ele("LiabilityTotal").txt(String(snapshot.journal.liabilityTotal));
  journal.ele("EquityTotal").txt(String(snapshot.journal.equityTotal));

  const attachments = root.ele("Attachments");
  snapshot.attachments.forEach((attachment) => {
    const node = attachments.ele("Attachment");
    node.ele("Label").txt(attachment.label);
    node.ele("Required").txt(String(attachment.required));
    node.ele("Status").txt(attachment.status);
  });

  return root.end({ prettyPrint: true });
}
