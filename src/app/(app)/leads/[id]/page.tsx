import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, getProfiles, getAllProfilesMap } from "@/lib/data";
import StatusSelect from "@/components/status-select";
import AssigneeSelect from "@/components/assignee-select";
import NoteForm from "@/components/note-form";
import MeetingButton from "@/components/meeting-button";
import ResponseButton from "@/components/response-button";
import HoldReasonIcon from "@/components/hold-reason-icon";
import BackButton from "@/components/back-button";
import type { Activity, Lead, LeadFieldDef, Meeting } from "@/lib/supabase/types";
import { SOURCE_LABELS } from "@/lib/supabase/types";

const FOLLOW_UP_ACTIVITY_TYPES = new Set(["status_changed"]);
const FOLLOW_UP_STATUSES = new Set(["outreach_initiated", "follow_up"]);

const ACTIVITY_LABELS: Record<string, string> = {
  lead_created: "Lead created",
  lead_assigned: "Lead assigned",
  research_completed: "Research completed",
  outreach_sent: "Outreach sent",
  follow_up_scheduled: "Follow-up scheduled",
  follow_up_completed: "Follow-up completed",
  response_recorded: "Prospect responded",
  meeting_scheduled: "Meeting scheduled",
  meeting_completed: "Meeting completed",
  status_changed: "Status changed",
  note_added: "Note added",
  lead_updated: "Lead updated",
  import: "Imported",
};

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ supabase }, profiles, allProfilesMap] = await Promise.all([
    requireUser(),
    getProfiles(),
    getAllProfilesMap(),
  ]);

  const [
    { data: lead },
    { data: activities },
    { data: meetings },
    { data: fieldDefsData },
    { data: eventLeadsData },
  ] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).single(),
    supabase.from("activities").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("meetings").select("*").eq("lead_id", id).order("meeting_date", { ascending: false }),
    supabase.from("lead_field_defs").select("*").order("position", { ascending: true }),
    supabase.from("event_leads").select("events(id, name)").eq("lead_id", id),
  ]);
  if (!lead) notFound();
  const fieldDefs = (fieldDefsData ?? []) as LeadFieldDef[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkedEvents = (eventLeadsData ?? []).map((el: any) => el.events).filter(Boolean);

  const profileMap = allProfilesMap;
  const typedLead = lead as Lead;
  const hasMeeting = Boolean(meetings && meetings.length > 0);

  const followUpHistory = ((activities ?? []) as Activity[]).filter(
    (a) => FOLLOW_UP_ACTIVITY_TYPES.has(a.type) && FOLLOW_UP_STATUSES.has((a.details as { to?: string } | null)?.to ?? "")
  );
  const isInFollowUpFlow = FOLLOW_UP_STATUSES.has(typedLead.status ?? "");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <BackButton fallbackHref="/leads" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400">{typedLead.lead_code}</p>
          <h1 className="text-2xl font-semibold text-[#1c2024]">{typedLead.company_name}</h1>
          {typedLead.company_website && (
            <a href={typedLead.company_website} target="_blank" className="text-sm text-[var(--brand)] hover:underline">
              {typedLead.company_website}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AssigneeSelect
            leadId={typedLead.id}
            assignedTo={typedLead.assigned_to}
            assignedToName={typedLead.assigned_to ? profileMap.get(typedLead.assigned_to) : undefined}
            profiles={profiles}
          />
          <StatusSelect leadId={typedLead.id} status={typedLead.status} />
          {typedLead.status === "on_hold" && <HoldReasonIcon leadId={typedLead.id} reason={typedLead.hold_reason} />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-3 text-sm font-semibold text-[#1c2024]">Company Overview</h2>
            <dl className="space-y-2 text-sm">
              <Field label="About the Company" value={typedLead.about_company || typedLead.company_description} />
              <Field label="Solutions" value={typedLead.solutions} />
              <Field label="Products" value={typedLead.products} />
              <Field label="AiVision360 Synergy" value={typedLead.ai_synergy || typedLead.potential_opportunity} />
              <Field label="Applications" value={typedLead.applications} />
              <Field label="Partners" value={typedLead.partners} />
              <Field label="Annual Revenue" value={typedLead.annual_revenue} />
            </dl>
          </section>

          <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-3 text-sm font-semibold text-[#1c2024]">Contact</h2>
            <dl className="space-y-2 text-sm">
              <Field label="Name" value={typedLead.contact_name} />
              <Field label="About the Person" value={typedLead.about_person} />
              <Field label="Email" value={typedLead.contact_email} />
              <Field label="LinkedIn" value={typedLead.contact_linkedin_url} />
            </dl>
          </section>

          <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-3 text-sm font-semibold text-[#1c2024]">Lead Tracking</h2>
            <dl className="space-y-2 text-sm">
              <Field
                label="Original Owner"
                value={profileMap.get(typedLead.owner_id ?? typedLead.created_by ?? "") ?? "—"}
              />
              <Field
                label="Current Assigned BDO"
                value={
                  typedLead.assigned_to
                    ? profileMap.get(typedLead.assigned_to) ?? "Assigned"
                    : "Unassigned"
                }
              />
              {typedLead.assigned_by && (
                <Field
                  label="Assigned By"
                  value={profileMap.get(typedLead.assigned_by) ?? "—"}
                />
              )}
              {typedLead.assigned_at && (
                <Field label="Assigned At" value={new Date(typedLead.assigned_at).toLocaleDateString()} />
              )}
              {linkedEvents.length > 0 && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Events</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {linkedEvents.map((ev: { id: string; name: string }) => (
                      <Link
                        key={ev.id}
                        href={`/events/${ev.id}`}
                        className="rounded bg-cyan-50 px-2 py-0.5 text-xs font-medium text-[#0a2a2c] ring-1 ring-cyan-200 hover:bg-cyan-100"
                      >
                        {ev.name}
                      </Link>
                    ))}
                  </dd>
                </div>
              )}
              <Field label="Source" value={SOURCE_LABELS[typedLead.source] ?? typedLead.source} />
              <Field label="Priority" value={typedLead.priority} />
              <Field label="Last Contacted" value={typedLead.last_contacted_at?.slice(0, 10)} />
              <Field label="Next Follow-up" value={typedLead.next_follow_up_date} />
            </dl>
          </section>

          {fieldDefs.length > 0 && (
            <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <h2 className="mb-3 text-sm font-semibold text-[#1c2024]">Custom Fields</h2>
              <dl className="space-y-2 text-sm">
                {fieldDefs.map((f) => (
                  <Field key={f.id} label={f.label} value={typedLead.custom_fields?.[f.key]} />
                ))}
              </dl>
            </section>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <section className="flex flex-wrap gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <ResponseButton leadId={typedLead.id} hasResponse={Boolean(typedLead.response_text)} />
            <MeetingButton leadId={typedLead.id} hasMeeting={hasMeeting} />
          </section>

          {typedLead.response_text && (
            <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <h2 className="mb-2 text-sm font-semibold text-[#1c2024]">Response</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-600">{typedLead.response_text}</p>
              {typedLead.response_date && (
                <p className="mt-1 text-xs text-gray-400">{new Date(typedLead.response_date).toLocaleString()}</p>
              )}
            </section>
          )}

          {(isInFollowUpFlow || followUpHistory.length > 0) && (
            <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <h2 className="mb-3 text-sm font-semibold text-[#1c2024]">Follow-up</h2>
              {isInFollowUpFlow && (
                <p className="mb-3 text-sm text-gray-600">
                  Currently <span className="font-medium text-[#1c2024]">{typedLead.status === "follow_up" ? "in Follow Up" : "waiting on the Outreach Initiated window"}</span>
                  {typedLead.next_follow_up_date && (
                    <>
                      {" "}— next follow-up on <span className="font-medium text-[#1c2024]">{typedLead.next_follow_up_date}</span>
                    </>
                  )}
                  .
                </p>
              )}
              <ul className="space-y-2 text-sm">
                {followUpHistory.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2">
                    <span>
                      Moved to{" "}
                      <span className="font-medium text-[#1c2024]">
                        {(a.details as { to?: string } | null)?.to === "follow_up" ? "Follow Up" : "Outreach Initiated"}
                      </span>
                    </span>
                    <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</span>
                  </li>
                ))}
                {followUpHistory.length === 0 && <p className="text-gray-400">No follow-up history yet.</p>}
              </ul>
            </section>
          )}

          <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-3 text-sm font-semibold text-[#1c2024]">Notes</h2>
            <NoteForm leadId={typedLead.id} />
            {typedLead.notes && (
              <pre className="mt-3 whitespace-pre-wrap text-sm text-gray-600">{typedLead.notes}</pre>
            )}
          </section>

          {meetings && meetings.length > 0 && (
            <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <h2 className="mb-3 text-sm font-semibold text-[#1c2024]">Meetings</h2>
              <ul className="space-y-2 text-sm">
                {(meetings as Meeting[]).map((m) => (
                  <li key={m.id} className="rounded-lg border border-gray-100 p-2">
                    <span className="font-medium">{m.meeting_date}</span> {m.meeting_time ?? ""} —{" "}
                    {m.platform_or_location}
                    {m.meeting_url && (
                      <>
                        {" "}
                        <a href={m.meeting_url} target="_blank" className="text-cyan-600 hover:underline">
                          link
                        </a>
                      </>
                    )}{" "}
                    <span className="text-xs text-gray-400">({m.status})</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-3 text-sm font-semibold text-[#1c2024]">Activity Timeline</h2>
            <ol className="space-y-3 border-l border-gray-200 pl-4 text-sm">
              {(activities as Activity[] | null)?.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-[var(--brand)]" />
                  <p className="font-medium text-[#1c2024]">{ACTIVITY_LABELS[a.type] ?? a.type}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(a.created_at).toLocaleString()}
                    {a.actor_id && ` · ${profileMap.get(a.actor_id) ?? "Unknown"}`}
                  </p>
                </li>
              ))}
              {(!activities || activities.length === 0) && (
                <p className="text-gray-400">No activity yet.</p>
              )}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-400">{label}</dt>
      <dd className="text-[#1c2024]">{value || "—"}</dd>
    </div>
  );
}
