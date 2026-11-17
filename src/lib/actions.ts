"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { LeadPriority, LeadSource, LeadStatus } from "@/lib/supabase/types";

export async function createLead(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const payload = {
    company_name: String(formData.get("company_name") ?? ""),
    company_website: formData.get("company_website") || null,
    industry: formData.get("industry") || null,
    country: formData.get("country") || null,
    location: formData.get("location") || null,
    company_description: formData.get("company_description") || null,
    products_and_solutions: formData.get("products_and_solutions") || null,
    potential_opportunity: formData.get("potential_opportunity") || null,
    contact_name: formData.get("contact_name") || null,
    contact_title: formData.get("contact_title") || null,
    contact_email: formData.get("contact_email") || null,
    contact_phone: formData.get("contact_phone") || null,
    contact_linkedin_url: formData.get("contact_linkedin_url") || null,
    source: (formData.get("source") as LeadSource) || "other",
    source_details: formData.get("source_details") || null,
    assigned_to: formData.get("assigned_to") || null,
    priority: (formData.get("priority") as LeadPriority) || "medium",
    notes: formData.get("notes") || null,
    created_by: user.id,
  };

  const { data, error } = await supabase.from("leads").insert(payload).select("id").single();
  if (error) throw new Error(error.message);

  revalidatePath("/leads");
  revalidatePath("/");
  redirect(`/leads/${data.id}`);
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ status }).eq("id", leadId);
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/");
}

export async function toggleLeadActive(leadId: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ is_active_lead: isActive }).eq("id", leadId);
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}

export async function updateLeadAssignment(leadId: string, assignedTo: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ assigned_to: assignedTo || null })
    .eq("id", leadId);
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}

export async function addNote(leadId: string, note: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: lead } = await supabase.from("leads").select("notes").eq("id", leadId).single();
  const merged = lead?.notes ? `${lead.notes}\n---\n${note}` : note;

  const { error } = await supabase.from("leads").update({ notes: merged }).eq("id", leadId);
  if (error) throw new Error(error.message);

  await supabase.from("activities").insert({
    lead_id: leadId,
    type: "note_added",
    actor_id: user?.id,
    details: { note },
  });

  revalidatePath(`/leads/${leadId}`);
}

export async function upsertMeeting(
  leadId: string,
  status: "meeting_scheduled" | "meeting_rescheduled",
  meetingDate: string,
  meetingTime: string,
  platform: string,
  meetingUrl: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.rpc("upsert_meeting", {
    p_lead_id: leadId,
    p_status: status,
    p_meeting_date: meetingDate,
    p_meeting_time: meetingTime || null,
    p_platform_or_location: platform || null,
    p_meeting_url: meetingUrl || null,
    p_actor: user?.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/meetings");
}

export async function recordQuickResponse(leadId: string, responseText: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.rpc("record_quick_response", {
    p_lead_id: leadId,
    p_response_text: responseText,
    p_actor: user?.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/responses");
}

export async function updateResponseText(leadId: string, responseText: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_response_text", {
    p_lead_id: leadId,
    p_response_text: responseText,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/responses");
  revalidatePath(`/leads/${leadId}`);
}

export async function setLeadOnHold(leadId: string, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.rpc("set_lead_on_hold", {
    p_lead_id: leadId,
    p_reason: reason,
    p_actor: user?.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}

export async function updateHoldReason(leadId: string, reason: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_hold_reason", {
    p_lead_id: leadId,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}

export async function markMeetingCompleted(meetingId: string, leadId: string) {
  const supabase = await createClient();
  const { error: e1 } = await supabase.from("meetings").update({ status: "completed" }).eq("id", meetingId);
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await supabase.from("leads").update({ status: "meeting_completed" }).eq("id", leadId);
  if (e2) throw new Error(e2.message);
  revalidatePath("/meetings");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  revalidatePath("/notifications");
}

export async function bulkUpdateStatus(leadIds: string[], status: LeadStatus) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("bulk_update_status", {
    p_lead_ids: leadIds,
    p_status: status,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/leads");
  revalidatePath("/");
}

export async function bulkUpdateAssignment(leadIds: string[], assignedTo: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("bulk_update_assignment", {
    p_lead_ids: leadIds,
    p_assigned_to: assignedTo || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/leads");
  revalidatePath("/");
}

export async function saveFilter(name: string, query: Record<string, string>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("saved_filters").insert({
    name,
    owner_id: user.id,
    query,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/leads");
}

export async function deleteSavedFilter(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("saved_filters").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/leads");
}

export async function saveColumnPrefs(columns: { key: string; label: string; visible: boolean; custom?: boolean }[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("lead_table_prefs")
    .upsert({ owner_id: user.id, columns, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);

  revalidatePath("/leads");
}

function slugifyFieldKey(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

export async function addLeadFieldDef(label: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const key = slugifyFieldKey(label);
  if (!key) throw new Error("Column name is required");

  const { count } = await supabase.from("lead_field_defs").select("id", { count: "exact", head: true });

  const { error } = await supabase.from("lead_field_defs").insert({
    key,
    label: label.trim(),
    position: count ?? 0,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/leads");
}

export async function deleteLeadFieldDef(key: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("lead_field_defs").delete().eq("key", key);
  if (error) throw new Error(error.message);
  revalidatePath("/leads");
}

export async function updateLeadCustomField(leadId: string, key: string, value: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_lead_custom_field", {
    p_lead_id: leadId,
    p_key: key,
    p_value: value,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/leads");
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notifications").update({ is_read: true }).eq("recipient_id", user.id);
  revalidatePath("/notifications");
}
