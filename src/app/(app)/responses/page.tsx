import Link from "next/link";
import { requireUser } from "@/lib/data";
import ResponseTextCell from "@/components/response-text-cell";
import type { Lead } from "@/lib/supabase/types";

export default async function ResponsesPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("status", "response_received")
    .order("response_date", { ascending: false });

  const leads = (data ?? []) as Lead[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#1c2024]">Responses</h1>
        <p className="text-sm text-gray-500">Every lead currently marked Response Received.</p>
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Company Name</th>
              <th className="px-4 py-3">Contacted Person</th>
              <th className="px-4 py-3">What&apos;s the Response</th>
              <th className="px-4 py-3">Response Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/leads/${l.id}`} className="font-medium text-[#1c2024] hover:text-[var(--brand)]">
                    {l.company_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{l.contact_name || "—"}</td>
                <td className="px-4 py-3">
                  <ResponseTextCell leadId={l.id} initialValue={l.response_text ?? ""} />
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {l.response_date ? new Date(l.response_date).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No responses recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
