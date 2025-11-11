import type {
  CSVImportResult,
  CryptoTrade,
  HousingLoanRecord,
  MedicalExpenseEntry,
} from "./types";

function parseCsvLines(content: string): string[][] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

function parseNumber(value: string, line: number, field: string, errors: CSVImportResult<unknown>["errors"]) {
  if (value.length === 0) return 0;
  const parsed = Number(value.replace(/,/g, ""));
  if (Number.isNaN(parsed)) {
    errors.push({ line, message: `${field} に数値を入力してください。` });
    return 0;
  }
  return parsed;
}

export function parseMedicalExpenseCsv(content: string): CSVImportResult<MedicalExpenseEntry> {
  const rows = parseCsvLines(content);
  const result: CSVImportResult<MedicalExpenseEntry> = { rows: [], errors: [] };
  if (rows.length === 0) {
    return result;
  }
  const [header, ...data] = rows;
  const expected = ["provider", "patient", "amount", "reimbursed"];
  const normalizedHeader = header.map((h) => h.toLowerCase());
  expected.forEach((column) => {
    if (!normalizedHeader.includes(column)) {
      result.errors.push({ line: 1, message: `${column} 列が見つかりません。` });
    }
  });
  data.forEach((row, index) => {
    const lineNumber = index + 2;
    const record: MedicalExpenseEntry = {
      provider: row[normalizedHeader.indexOf("provider")] ?? "",
      patient: row[normalizedHeader.indexOf("patient")] ?? "",
      amount: 0,
    };
    if (!record.provider || !record.patient) {
      result.errors.push({ line: lineNumber, message: "provider と patient は必須です。" });
    }
    record.amount = parseNumber(
      row[normalizedHeader.indexOf("amount")] ?? "0",
      lineNumber,
      "amount",
      result.errors
    );
    const reimbursedRaw = row[normalizedHeader.indexOf("reimbursed")] ?? "";
    if (reimbursedRaw.length > 0) {
      record.reimbursed = parseNumber(reimbursedRaw, lineNumber, "reimbursed", result.errors);
    }
    result.rows.push(record);
  });
  return result;
}

function safeUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

export function parseCryptoTradesCsv(content: string): CSVImportResult<CryptoTrade> {
  const rows = parseCsvLines(content);
  const result: CSVImportResult<CryptoTrade> = { rows: [], errors: [] };
  if (rows.length === 0) {
    return result;
  }
  const [header, ...data] = rows;
  const expected = ["date", "pair", "side", "quantity", "price", "fee"];
  const normalizedHeader = header.map((h) => h.toLowerCase());
  expected.forEach((column) => {
    if (!normalizedHeader.includes(column)) {
      result.errors.push({ line: 1, message: `${column} 列が見つかりません。` });
    }
  });
  data.forEach((row, index) => {
    const lineNumber = index + 2;
    const trade: CryptoTrade = {
      id: safeUUID(),
      date: row[normalizedHeader.indexOf("date")] ?? "",
      pair: row[normalizedHeader.indexOf("pair")] ?? "",
      side: (row[normalizedHeader.indexOf("side")] ?? "buy").toLowerCase() === "sell"
        ? "sell"
        : "buy",
      quantity: 0,
      price: 0,
    };
    if (!trade.date || !trade.pair) {
      result.errors.push({ line: lineNumber, message: "date と pair は必須です。" });
    }
    trade.quantity = parseNumber(
      row[normalizedHeader.indexOf("quantity")] ?? "0",
      lineNumber,
      "quantity",
      result.errors
    );
    trade.price = parseNumber(
      row[normalizedHeader.indexOf("price")] ?? "0",
      lineNumber,
      "price",
      result.errors
    );
    const feeRaw = row[normalizedHeader.indexOf("fee")] ?? "";
    if (feeRaw.length > 0) {
      trade.fee = parseNumber(feeRaw, lineNumber, "fee", result.errors);
    }
    result.rows.push(trade);
  });
  return result;
}

export function parseHousingLoanCsv(content: string): CSVImportResult<HousingLoanRecord> {
  const rows = parseCsvLines(content);
  const result: CSVImportResult<HousingLoanRecord> = { rows: [], errors: [] };
  if (rows.length === 0) {
    return result;
  }
  const [header, ...data] = rows;
  const expected = ["year", "outstandingprincipal", "deductionrate", "maxdeduction"];
  const normalizedHeader = header.map((h) => h.toLowerCase());
  expected.forEach((column) => {
    if (!normalizedHeader.includes(column)) {
      result.errors.push({ line: 1, message: `${column} 列が見つかりません。` });
    }
  });
  data.forEach((row, index) => {
    const lineNumber = index + 2;
    const record: HousingLoanRecord = {
      year: parseNumber(row[normalizedHeader.indexOf("year")] ?? "0", lineNumber, "year", result.errors),
      outstandingPrincipal: parseNumber(
        row[normalizedHeader.indexOf("outstandingprincipal")] ?? "0",
        lineNumber,
        "outstandingPrincipal",
        result.errors
      ),
      deductionRate:
        parseNumber(
          row[normalizedHeader.indexOf("deductionrate")] ?? "0",
          lineNumber,
          "deductionRate",
          result.errors
        ) / 100,
      maxDeduction: parseNumber(
        row[normalizedHeader.indexOf("maxdeduction")] ?? "0",
        lineNumber,
        "maxDeduction",
        result.errors
      ),
    };
    if (!record.year) {
      result.errors.push({ line: lineNumber, message: "year は必須です。" });
    }
    result.rows.push(record);
  });
  return result;
}
