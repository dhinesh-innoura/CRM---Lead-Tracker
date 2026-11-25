import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";

const TEMPLATE_HEADERS = [
  "Company",
  "Website URL",
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

export async function GET() {
  const supabase = await createClient();
  const { data: fieldDefs } = await supabase
    .from("lead_field_defs")
    .select("label")
    .order("position", { ascending: true });

  const headers = [...TEMPLATE_HEADERS, ...(fieldDefs ?? []).map((f) => f.label)];

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
