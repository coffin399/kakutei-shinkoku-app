import { PDFDocument } from "pdf-lib";
import type { TaxReturnSnapshot } from "./types";

const TEMPLATE_URL =
  "https://www.nta.go.jp/taxes/shiraberu/shinkoku/yoshiki/01/shinkokusho/pdf/r02/02.pdf";

const FONT_URL =
  "https://fonts.gstatic.com/ea/notosansjp/v6/NotoSansJP-Regular.otf";

let templateCache: Uint8Array | null = null;
let fontCache: Uint8Array | null = null;

async function loadTemplate(): Promise<Uint8Array> {
  if (templateCache) {
    return templateCache;
  }
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch tax return template PDF");
  }
  const buffer = await response.arrayBuffer();
  templateCache = new Uint8Array(buffer);
  return templateCache;
}

async function loadFont(): Promise<Uint8Array> {
  if (fontCache) {
    return fontCache;
  }
  const response = await fetch(FONT_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch Japanese font for PDF rendering");
  }
  const buffer = await response.arrayBuffer();
  fontCache = new Uint8Array(buffer);
  return fontCache;
}

type DrawFieldArgs = {
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  size?: number;
};

export async function generateTaxReturnPdf(
  snapshot: TaxReturnSnapshot
): Promise<Uint8Array> {
  const templateBytes = await loadTemplate();
  const fontBytes = await loadFont();
  const pdfDoc = await PDFDocument.load(templateBytes);
  const font = await pdfDoc.embedFont(fontBytes);

  const drawField = ({ pageIndex, x, y, text, size = 10 }: DrawFieldArgs) => {
    const page = pdfDoc.getPage(pageIndex);
    page.drawText(text, {
      x,
      y,
      size,
      font,
    });
  };

  const { taxpayer, computation, incomes, deductions } = snapshot;

  drawField({ pageIndex: 0, x: 120, y: 735, text: taxpayer.fullName });
  drawField({ pageIndex: 0, x: 120, y: 715, text: taxpayer.address });
  drawField({ pageIndex: 0, x: 120, y: 695, text: `電話: ${taxpayer.phone ?? "-"}` });
  drawField({ pageIndex: 0, x: 370, y: 735, text: `令和 ${taxpayer.filingYear - 2018} 年度` });

  drawField({
    pageIndex: 0,
    x: 120,
    y: 640,
    text: `合計所得金額: ${Math.round(computation.taxableIncome).toLocaleString()} 円`,
  });
  drawField({
    pageIndex: 0,
    x: 120,
    y: 620,
    text: `所得税額: ${Math.round(computation.incomeTax).toLocaleString()} 円`,
  });
  drawField({
    pageIndex: 0,
    x: 120,
    y: 600,
    text: `復興特別所得税: ${Math.round(computation.specialReconstructionTax).toLocaleString()} 円`,
  });
  drawField({
    pageIndex: 0,
    x: 120,
    y: 580,
    text: `納付額: ${Math.round(computation.amountDue).toLocaleString()} 円`,
  });
  drawField({
    pageIndex: 0,
    x: 120,
    y: 560,
    text: `還付見込額: ${Math.round(computation.expectedRefund).toLocaleString()} 円`,
  });

  const incomeStartY = 700;
  incomes.slice(0, 6).forEach((income, index) => {
    drawField({
      pageIndex: 1,
      x: 80,
      y: incomeStartY - index * 24,
      size: 9,
      text: `${income.label}: ${income.amount.toLocaleString()} 円`,
    });
  });

  const deductionStartY = 530;
  deductions.slice(0, 8).forEach((deduction, index) => {
    drawField({
      pageIndex: 1,
      x: 80,
      y: deductionStartY - index * 24,
      size: 9,
      text: `${deduction.label}: ${deduction.amount.toLocaleString()} 円`,
    });
  });

  drawField({
    pageIndex: 1,
    x: 80,
    y: 340,
    size: 9,
    text: `医療費控除対象額: ${snapshot.deductions
      .filter((d) => d.key === "medical")
      .reduce((acc, cur) => acc + cur.amount, 0)
      .toLocaleString()} 円`,
  });

  return pdfDoc.save();
}
