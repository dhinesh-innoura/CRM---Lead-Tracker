import { requireUser } from "@/lib/data";
import { LEAD_STATUSES, STATUS_LABELS, type Lead, type LeadStatus } from "@/lib/supabase/types";
import Link from "next/link";

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#1c2024]">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const { supabase } = await requireUser();

  const { data: leads } = await supabase
    .from("leads")
    .select("id, status, next_follow_up_date, created_at, updated_at, company_name, contact_name, assigned_to, last_contacted_at");

  const all = (leads ?? []) as Lead[];
  const today = new Date().toISOString().slice(0, 10);

  const countByStatus = (statuses: LeadStatus[]) =>
    all.filter((l) => statuses.includes(l.status)).length;

  const kpis = [
    { label: "Total Leads", value: all.length },
    { label: "Outreach Initiated", value: countByStatus(["outreach_initiated"]) },
    { label: "Follow Up", value: countByStatus(["follow_up"]) },
    { label: "Follow-ups Due", value: all.filter((l) => l.next_follow_up_date === today).length },
    {
      label: "Overdue Follow-ups",
      value: all.filter((l) => l.next_follow_up_date && l.next_follow_up_date < today).length,
    },
    { label: "Responses Received", value: countByStatus(["response_received"]) },
    { label: "No Response", value: countByStatus(["no_response"]) },
    { label: "Meetings Scheduled", value: countByStatus(["meeting_scheduled", "meeting_rescheduled"]) },
    { label: "Meetings Completed", value: countByStatus(["meeting_completed"]) },
    { label: "Successfully Converted", value: countByStatus(["successfully_converted"]) },
    { label: "On Hold", value: countByStatus(["on_hold"]) },
  ];

  const pipelineOrder: LeadStatus[] = LEAD_STATUSES;

  const { data: recentLeads } = await supabase
    .from("leads")
    .select("id, company_name, contact_name, status, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const todaysFollowUps = all.filter((l) => l.next_follow_up_date === today);
  const overdue = all.filter((l) => l.next_follow_up_date && l.next_follow_up_date < today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1c2024]">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of all BDO outreach activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-3 text-sm font-semibold text-[#1c2024]">Lead Pipeline</h2>
        <div className="flex flex-wrap gap-2">
          {pipelineOrder.map((s) => (
            <span
              key={s}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
            >
              {STATUS_LABELS[s]} · {countByStatus([s])}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-3 text-sm font-semibold text-[#1c2024]">
            Today&apos;s Follow-ups ({todaysFollowUps.length})
          </h2>
          <ul className="space-y-2 text-sm">
            {todaysFollowUps.length === 0 && <p className="text-gray-400">Nothing due today.</p>}
            {todaysFollowUps.map((l) => (
              <li key={l.id}>
                <Link href={`/leads/${l.id}`} className="text-[#1c2024] hover:text-[var(--brand)]">
                  {l.company_name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-3 text-sm font-semibold text-red-600">
            Overdue Activities ({overdue.length})
          </h2>
          <ul className="space-y-2 text-sm">
            {overdue.length === 0 && <p className="text-gray-400">No overdue follow-ups.</p>}
            {overdue.map((l) => (
              <li key={l.id}>
                <Link href={`/leads/${l.id}`} className="text-[#1c2024] hover:text-[var(--brand)]">
                  {l.company_name}
                </Link>{" "}
                <span className="text-xs text-red-500">due {l.next_follow_up_date}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-3 text-sm font-semibold text-[#1c2024]">Recently Added Leads</h2>
          <ul className="space-y-2 text-sm">
            {(recentLeads ?? []).map((l) => (
              <li key={l.id}>
                <Link href={`/leads/${l.id}`} className="text-[#1c2024] hover:text-[var(--brand)]">
                  {l.company_name}
                </Link>{" "}
                <span className="text-xs text-gray-400">{STATUS_LABELS[l.status as LeadStatus]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
