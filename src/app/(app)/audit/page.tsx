import Link from "next/link";
import { requireUser } from "@/lib/data";
import { getProfiles, getAllProfilesMap } from "@/lib/data";
import type { Activity } from "@/lib/supabase/types";

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

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ actor?: string }>;
}) {
  const { supabase } = await requireUser();
  const profiles = await getProfiles();
  const profileMap = await getAllProfilesMap();
  const { actor } = await searchParams;

  let query = supabase
    .from("activities")
    .select("*, leads(id, company_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (actor) query = query.eq("actor_id", actor);

  const { data } = await query;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#1c2024]">Audit Log</h1>
        <p className="text-sm text-gray-500">Complete history of who created, edited, assigned, or changed every lead.</p>
      </div>

      <form className="flex gap-2">
        <select name="actor" defaultValue={actor ?? ""} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Everyone</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
        <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Filter
        </button>
      </form>

      <div className="max-h-[70vh] overflow-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Who</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Lead</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {((data ?? []) as (Activity & { leads: { id: string; company_name: string } | null })[]).map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{new Date(a.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600">{a.actor_id ? profileMap.get(a.actor_id) ?? "Unknown" : "System"}</td>
                <td className="px-4 py-3 font-medium text-[#1c2024]">{ACTIVITY_LABELS[a.type] ?? a.type}</td>
                <td className="px-4 py-3">
                  {a.leads && (
                    <Link href={`/leads/${a.leads.id}`} className="text-[var(--brand)] hover:underline">
                      {a.leads.company_name}
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No activity recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
