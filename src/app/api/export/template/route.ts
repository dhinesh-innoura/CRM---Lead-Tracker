import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";

const TEMPLATE_HEADERS = [
  "Company",
  "Website URL",
  "Country",
  "Industry",
  "Location",
  "About Company",
  "Outreach Date",
  "Last Outreach Date",
  "Contact Person",
  "LinkedIn URL",
  "About Person",
  "Source",
  "Solutions",
  "Products",
  "AiVision360 Synergy",
  "Status",
  "Applications",
  "Partners",
  "Annual Revenue",
  "Business Email",
  "Priority",
  "Notes",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const columnsParam = searchParams.get("columns");

  let headers: string[] | null = null;
  if (columnsParam) {
    // Caller passed the exact column headings shown in a specific lead
    // table/tab, so the template matches that view column-for-column.
    try {
      const parsed = JSON.parse(columnsParam);
      if (Array.isArray(parsed) && parsed.every((h) => typeof h === "string")) headers = parsed;
    } catch {
      headers = null;
    }
  }
  if (!headers) {
    const supabase = await createClient();
    const { data: fieldDefs } = await supabase
      .from("lead_field_defs")
      .select("label")
      .order("position", { ascending: true });
    headers = [...TEMPLATE_HEADERS, ...(fieldDefs ?? []).map((f) => f.label)];
  }

  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads Template");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="tracker360-lead-template.xlsx"',
    },
  });
}
