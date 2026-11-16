import Link from "next/link";
import { requireUser } from "@/lib/data";
import MeetingRowActions from "@/components/meeting-row-actions";

export default async function MeetingsPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("meetings")
    .select("*, leads(id, company_name)")
    .order("meeting_date", { ascending: true });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#1c2024]">Meetings</h1>
        <p className="text-sm text-gray-500">Scheduled and completed meetings with prospects.</p>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Meeting URL</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data ?? []).map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/leads/${m.leads?.id}`} className="font-medium text-[#1c2024] hover:text-[var(--brand)]">
                    {m.leads?.company_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{m.meeting_date}</td>
                <td className="px-4 py-3 text-gray-600">{m.meeting_time ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{m.platform_or_location ?? "—"}</td>
                <td className="px-4 py-3">
                  {m.meeting_url ? (
                    <a href={m.meeting_url} target="_blank" className="text-xs text-cyan-600 hover:underline">
                      Join Link
                    </a>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{m.status}</td>
                <td className="px-4 py-3">
                  {m.leads?.id && <MeetingRowActions leadId={m.leads.id} meetingId={m.id} status={m.status} />}
                </td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No meetings scheduled yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
