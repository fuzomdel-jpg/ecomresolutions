import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import { toCsv, toXlsx } from "@/lib/leads/pipeline";
import { leadExportRows, listLeadCompanies } from "@/lib/leads/persist";
import type { LeadMarketId } from "@/lib/leads/types";

export async function GET(request: Request) {
  await requireStaff();
  const url = new URL(request.url);
  const marketParam = url.searchParams.get("market") ?? "ALL";
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const market: LeadMarketId | "ALL" = marketParam === "US" || marketParam === "DUBAI" ? marketParam : "ALL";
  const rows = leadExportRows(await listLeadCompanies(), market);
  const filename = `ecom-resolutions-leads-${market.toLowerCase()}.${format}`;
  if (format === "xlsx") {
    const body = toXlsx(rows.length > 0 ? rows : [{ Market: market, Company: "" }]);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
