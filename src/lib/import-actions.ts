"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { LeadPriority, LeadSource, LeadStatus } from "@/lib/supabase/types";
import { LEAD_STATUSES } from "@/lib/supabase/types";

export type ImportRow = Record<string, string>;

export interface ImportResult {
  importedRows: number;
  skippedRows: number;
  errorRows: number;
  errors: { row: number; message: string }[];
}

const VALID_SOURCES: LeadSource[] = ["linkedin", "prem_sir", "own"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function importLeads(
  fileName: string,
  mapping: Record<string, string>,
  rows: ImportRow[],
  onDuplicate: "skip" | "update"
): Promise<ImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result: ImportResult = { importedRows: 0, skippedRows: 0, errorRows: 0, errors: [] };

  const { data: existing } = await supabase
    .from("leads")
    .select("id, company_name, contact_email");

  const byCompany = new Map((existing ?? []).map((l) => [l.company_name?.toLowerCase(), l.id]));
  const byEmail = new Map(
    (existing ?? []).filter((l) => l.contact_email).map((l) => [l.contact_email!.toLowerCase(), l.id])
  );

  const customFieldKeys = Object.keys(mapping).filter((k) => k.startsWith("custom:"));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const get = (field: string) => {
      const sourceCol = mapping[field];
      return sourceCol ? (row[sourceCol] ?? "").trim() : "";
    };

    const companyName = get("company_name");
    if (!companyName) {
      result.errorRows++;
      result.errors.push({ row: i + 1, message: "Missing company name" });
      continue;
    }

    const contactEmail = get("contact_email");
    if (contactEmail && !EMAIL_RE.test(contactEmail)) {
      result.errorRows++;
      result.errors.push({ row: i + 1, message: `Invalid email: ${contactEmail}` });
      continue;
    }

    const existingId =
      byCompany.get(companyName.toLowerCase()) ||
      (contactEmail ? byEmail.get(contactEmail.toLowerCase()) : undefined);

    const sourceRaw = get("source").toLowerCase().replace(/\s+/g, "_");
    const source = (VALID_SOURCES.includes(sourceRaw as LeadSource) ? sourceRaw : "linkedin") as LeadSource;

    const statusRaw = get("status").toLowerCase().replace(/\s+/g, "_");
    const status = (LEAD_STATUSES.includes(statusRaw as LeadStatus) ? statusRaw : "outreach_initiated") as LeadStatus;

    const customFields: Record<string, string> = {};
    for (const key of customFieldKeys) {
      const fieldKey = key.slice("custom:".length);
      const value = get(key);
      if (value) customFields[fieldKey] = value;
    }

    const payload = {
      company_name: companyName,
      company_website: get("company_website") || null,
      about_company: get("about_company") || null,
      contact_name: get("contact_name") || null,
      contact_linkedin_url: get("contact_linkedin_url") || null,
      about_person: get("about_person") || null,
      solutions: get("solutions") || null,
      products: get("products") || null,
      ai_synergy: get("ai_synergy") || null,
      applications: get("applications") || null,
      partners: get("partners") || null,
      annual_revenue: get("annual_revenue") || null,
      contact_email: contactEmail || null,
      source,
      status,
      priority: (["high", "medium", "low"].includes(get("priority").toLowerCase())
        ? get("priority").toLowerCase()
        : "medium") as LeadPriority,
      notes: get("notes") || null,
      custom_fields: customFields,
    };

    if (existingId) {
      if (onDuplicate === "skip") {
        result.skippedRows++;
        continue;
      }
      const { error } = await supabase.from("leads").update(payload).eq("id", existingId);
      if (error) {
        result.errorRows++;
        result.errors.push({ row: i + 1, message: error.message });
        continue;
      }
      result.importedRows++;
      continue;
    }

    const { error } = await supabase.from("leads").insert({ ...payload, created_by: user?.id });
    if (error) {
      result.errorRows++;
      result.errors.push({ row: i + 1, message: error.message });
      continue;
    }
    result.importedRows++;
  }

  await supabase.from("import_batches").insert({
    file_name: fileName,
    imported_by: user?.id,
    total_rows: rows.length,
    imported_rows: result.importedRows,
    skipped_rows: result.skippedRows,
    error_rows: result.errorRows,
    column_mapping: mapping,
    errors: result.errors,
  });

  revalidatePath("/leads");
  revalidatePath("/");

  return result;
}
