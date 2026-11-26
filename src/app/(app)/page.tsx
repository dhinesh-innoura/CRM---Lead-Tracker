import { requireUser } from "@/lib/data";
import type { Lead } from "@/lib/supabase/types";
import Link from "next/link";

function Kpi({ label, value, href }: { label: string; value: number; href?: string }) {
  const card = (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:ring-[var(--brand)]">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#1c2024]">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  const [{ data: leads }, { data: eventLeadsData }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, company_name, status, source, owner_id, created_by, assigned_to, event_id, is_active_lead, next_follow_up_date"),
    supabase.from("event_leads").select("lead_id"),
  ]);

  const all = (leads ?? []) as (Lead & { owner_id?: string | null })[];
  const today = new Date().toISOString().slice(0, 10);

  const eventLeadIdSet = new Set((eventLeadsData ?? []).map((r) => r.lead_id));

  // Centralized ownership & assignment logic matching CRM rules. A lead
  // that has been formally assigned (to you or anyone) belongs to the
  // Assigned Leads bucket, not Own Leads, even if you're also the owner —
  // otherwise self-assigning a lead you added would double-count it.
  const ownLeads = all.filter(
    (l) =>
      (l.owner_id === user.id || (!l.owner_id && l.created_by === user.id)) &&
      !l.assigned_to &&
      !l.event_id &&
      !eventLeadIdSet.has(l.id)
  );
  const assignedLeads = all.filter((l) => l.assigned_to === user.id);
  const eventLeads = all.filter((l) => l.event_id || eventLeadIdSet.has(l.id));
  const activeLeads = all.filter((l) => l.is_active_lead);
  const dueToday = all.filter((l) => l.next_follow_up_date === today);
  const overdue = all.filter((l) => l.next_follow_up_date && l.next_follow_up_date < today);
  const meetingsScheduled = all.filter(
    (l) => l.status === "meeting_scheduled" || l.status === "meeting_rescheduled"
  );
  const converted = all.filter((l) => l.status === "successfully_converted");

  const kpis = [
    { label: "Total Leads", value: all.length, href: "/leads" },
    { label: "Own Leads", value: ownLeads.length, href: "/leads" },
    { label: "Assigned Leads", value: assignedLeads.length, href: "/leads/sir-given" },
    { label: "Event Leads", value: eventLeads.length, href: "/events" },
    { label: "Active Leads", value: activeLeads.length, href: "/leads?tab=active" },
    { label: "Follow-ups Due Today", value: dueToday.length, href: "/followups" },
    { label: "Meetings Scheduled", value: meetingsScheduled.length, href: "/meetings" },
    { label: "Successfully Converted", value: converted.length, href: "/reports" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1c2024]">Dashboard</h1>
        <p className="text-sm text-gray-500">Quick overview of your leads and follow-ups.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-3 text-sm font-semibold text-amber-600">Due Today ({dueToday.length})</h2>
          <ul className="space-y-2 text-sm">
            {dueToday.length === 0 && <p className="text-gray-400">Nothing due today.</p>}
            {dueToday.map((l) => (
              <li key={l.id}>
                <Link href={`/leads/${l.id}`} className="text-[#1c2024] hover:text-[var(--brand)]">
                  {l.company_name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-3 text-sm font-semibold text-red-600">Overdue ({overdue.length})</h2>
          <ul className="space-y-2 text-sm">
            {overdue.length === 0 && <p className="text-gray-400">No overdue follow-ups.</p>}
            {overdue.map((l) => (
              <li key={l.id} className="flex items-center justify-between">
                <Link href={`/leads/${l.id}`} className="text-[#1c2024] hover:text-[var(--brand)]">
                  {l.company_name}
                </Link>
                <span className="text-xs text-red-500">due {l.next_follow_up_date}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
