import { NextResponse } from "next/server";
import { generateTaxReturnPdf } from "@/lib/tax/pdf";
import type { TaxReturnSnapshot } from "@/lib/tax/types";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TaxReturnSnapshot;
    const pdfBytes = await generateTaxReturnPdf(payload);
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=tax-return.pdf",
      },
    });
  } catch (error) {
    console.error("Failed to generate PDF", error);
    return NextResponse.json({ message: "Failed to generate PDF" }, { status: 500 });
  }
}
