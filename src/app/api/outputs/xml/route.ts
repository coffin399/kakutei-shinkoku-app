import { NextResponse } from "next/server";
import { generateTaxReturnXml } from "@/lib/tax/xml";
import type { TaxReturnSnapshot } from "@/lib/tax/types";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TaxReturnSnapshot;
    const xml = generateTaxReturnXml(payload);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": "attachment; filename=tax-return.xml",
      },
    });
  } catch (error) {
    console.error("Failed to generate XML", error);
    return NextResponse.json({ message: "Failed to generate XML" }, { status: 500 });
  }
}
