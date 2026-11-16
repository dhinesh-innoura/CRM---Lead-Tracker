import { requireAdminPage } from "@/lib/require-admin";
import { getProfiles } from "@/lib/data";
import type { Lead } from "@/lib/supabase/types";

export default async function ReportsPage() {
  const { supabase } = await requireAdminPage();
  const profiles = await getProfiles();

  const { data: leads } = await supabase.from("leads").select("*");
  const { data: meetings } = await supabase.from("meetings").select("id, created_by");

  const allLeads = (leads ?? []) as Lead[];

  const rows = profiles.map((p) => {
    const assigned = allLeads.filter((l) => l.assigned_to === p.id);
    const outreachSent = assigned.length;
    const responded = assigned.filter((l) => l.status === "response_received").length;
    const meetingsBooked = (meetings ?? []).filter((m) => m.created_by === p.id).length;
    const converted = assigned.filter((l) => l.status === "successfully_converted").length;
    const overdue = assigned.filter(
      (l) => l.next_follow_up_date && l.next_follow_up_date < new Date().toISOString().slice(0, 10)
    ).length;

    return {
      name: p.full_name,
      totalLeads: assigned.length,
      outreachSent,
      responded,
      meetingsBooked,
      converted,
      overdue,
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#1c2024]">Reports & Analytics</h1>
        <p className="text-sm text-gray-500">BDO performance comparison across the team.</p>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">BDO</th>
              <th className="px-4 py-3">Total Leads</th>
              <th className="px-4 py-3">Assigned Leads</th>
              <th className="px-4 py-3">Responses</th>
              <th className="px-4 py-3">Meetings</th>
              <th className="px-4 py-3">Converted</th>
              <th className="px-4 py-3">Overdue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-[#1c2024]">{r.name}</td>
                <td className="px-4 py-3">{r.totalLeads}</td>
                <td className="px-4 py-3">{r.outreachSent}</td>
                <td className="px-4 py-3">{r.responded}</td>
                <td className="px-4 py-3">{r.meetingsBooked}</td>
                <td className="px-4 py-3 text-green-600">{r.converted}</td>
                <td className="px-4 py-3 text-red-600">{r.overdue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
