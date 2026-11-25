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

const VALID_SOURCES: LeadSource[] = ["linkedin", "prem_sir", "ai"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseDateOrNull(value: string): string | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export async function importLeads(
  fileName: string,
  mapping: Record<string, string>,
  rows: ImportRow[],
  onDuplicate: "skip" | "update",
  overrides?: { defaultSource?: LeadSource; eventId?: string }
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
    const source =
      overrides?.defaultSource ??
      ((VALID_SOURCES.includes(sourceRaw as LeadSource) ? sourceRaw : "linkedin") as LeadSource);

    const statusRaw = get("status").toLowerCase().replace(/\s+/g, "_");
    const status = (LEAD_STATUSES.includes(statusRaw as LeadStatus) ? statusRaw : null) as LeadStatus | null;

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
      outreach_date: parseDateOrNull(get("outreach_date")),
      last_outreach_date: parseDateOrNull(get("last_outreach_date")),
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
      event_id: overrides?.eventId ?? null,
    };

    if (existingId) {
      if (overrides?.eventId) {
        // Link existing master lead to this event without creating a duplicate master lead record
        await supabase
          .from("event_leads")
          .insert({ event_id: overrides.eventId, lead_id: existingId })
          .select()
          .maybeSingle();
      }

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

    const { data: newLead, error } = await supabase
      .from("leads")
      .insert({ ...payload, owner_id: user?.id, created_by: user?.id })
      .select("id")
      .single();

    if (error) {
      result.errorRows++;
      result.errors.push({ row: i + 1, message: error.message });
      continue;
    }

    if (overrides?.eventId && newLead?.id) {
      await supabase
        .from("event_leads")
        .insert({ event_id: overrides.eventId, lead_id: newLead.id });
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
  revalidatePath("/leads/sir-given");
  revalidatePath("/events", "layout");
  revalidatePath("/");

  return result;
}
