import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";

const EXPORT_COLUMNS: { key: string; label: string }[] = [
  { key: "lead_code", label: "Lead Code" },
  { key: "company_name", label: "Company" },
  { key: "company_website", label: "Website URL" },
  { key: "about_company", label: "About Company" },
  { key: "contact_name", label: "Contact Person" },
  { key: "contact_linkedin_url", label: "LinkedIn URL" },
  { key: "about_person", label: "About Person" },
  { key: "source", label: "Source" },
  { key: "solutions", label: "Solutions" },
  { key: "products", label: "Products" },
  { key: "ai_synergy", label: "AiVision360 Synergy" },
  { key: "status", label: "Status" },
  { key: "applications", label: "Applications" },
  { key: "partners", label: "Partners" },
  { key: "annual_revenue", label: "Annual Revenue" },
  { key: "contact_email", label: "Business Email" },
  { key: "priority", label: "Priority" },
  { key: "notes", label: "Notes" },
  { key: "created_at", label: "Created At" },
];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const status = searchParams.get("status");
  const ids = searchParams.get("ids");

  let query = supabase.from("leads").select("*").order("created_at", { ascending: false });

  if (ids) {
    query = query.in("id", ids.split(","));
  } else {
    if (status) query = query.eq("status", status);
    if (q) query = query.or(`company_name.ilike.%${q}%,contact_name.ilike.%${q}%,contact_email.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: fieldDefs } = await supabase
    .from("lead_field_defs")
    .select("key, label")
    .order("position", { ascending: true });

  const rows = (data ?? []).map((lead) => {
    const row: Record<string, unknown> = {};
    const record = lead as Record<string, unknown>;
    for (const col of EXPORT_COLUMNS) row[col.label] = record[col.key];
    const customFields = (record.custom_fields as Record<string, string>) ?? {};
    for (const def of fieldDefs ?? []) row[def.label] = customFields[def.key] ?? "";
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="tracker360-leads-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
