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
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Already a clean yyyy-mm-dd (what the Excel reader now produces for date
  // cells) — use it directly rather than round-tripping through Date, which
  // can't be trusted not to shift the day across a timezone boundary.
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    return year >= 1900 && year <= 2200 ? `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}` : null;
  }

  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  // A garbage/misread value (e.g. a raw Excel date serial parsed as a bare
  // number) produces a wildly out-of-range year that Postgres' date type
  // rejects outright — treat it as unparseable instead of erroring the row.
  const year = d.getFullYear();
  if (year < 1900 || year > 2200) return null;
  return d.toISOString().slice(0, 10);
}

export async function importLeads(
  fileName: string,
  mapping: Record<string, string>,
  rows: ImportRow[],
  onDuplicate: "skip" | "update",
  overrides?: {
    defaultSource?: LeadSource;
    defaultStatus?: string;
    eventId?: string;
    assignToSelf?: boolean;
    forceNewLead?: boolean;
  }
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

    // Email is only used for duplicate detection, not required data — a bad
    // value (scraped placeholder text, "Not publicly verified", etc.)
    // shouldn't block the whole row from importing. Just drop it.
    const contactEmailRaw = get("contact_email");
    const contactEmail = contactEmailRaw && EMAIL_RE.test(contactEmailRaw) ? contactEmailRaw : "";

    const existingId =
      byCompany.get(companyName.toLowerCase()) ||
      (contactEmail ? byEmail.get(contactEmail.toLowerCase()) : undefined);

    const sourceRaw = get("source").toLowerCase().replace(/\s+/g, "_");
    const source =
      overrides?.defaultSource ??
      ((VALID_SOURCES.includes(sourceRaw as LeadSource) ? sourceRaw : "linkedin") as LeadSource);

    // Uploading from the New Leads tab always lands in New Leads: ignore
    // whatever the file's Status column says, never just fall back to it.
    let status: LeadStatus | null;
    if (overrides?.forceNewLead) {
      status = null;
    } else {
      const statusRaw = get("status").toLowerCase().replace(/\s+/g, "_");
      const defaultStatus =
        overrides?.defaultStatus && LEAD_STATUSES.includes(overrides.defaultStatus as LeadStatus)
          ? (overrides.defaultStatus as LeadStatus)
          : null;
      status = (LEAD_STATUSES.includes(statusRaw as LeadStatus) ? statusRaw : defaultStatus) as LeadStatus | null;
    }

    const customFields: Record<string, string> = {};
    for (const key of customFieldKeys) {
      const fieldKey = key.slice("custom:".length);
      const value = get(key);
      if (value) customFields[fieldKey] = value;
    }

    const payload = {
      company_name: companyName,
      company_website: get("company_website") || null,
      country: get("country") || null,
      industry: get("industry") || null,
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
      ...(overrides?.assignToSelf
        ? { assigned_to: user?.id ?? null, assigned_by: user?.id ?? null, assigned_at: new Date().toISOString() }
        : {}),
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
