import type { Lead } from "@/lib/supabase/types";
import type { ColumnPref } from "@/lib/lead-columns";
import LeadCell from "@/components/lead-cell";
import CustomColumnHeader from "@/components/custom-column-header";

export default function LeadsTable({ leads, columns }: { leads: Lead[]; columns: ColumnPref[] }) {
  const visible = columns.filter((c) => c.visible);

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-3">S.No</th>
            {visible.map((c) =>
              c.custom ? (
                <th key={c.key} className="px-3 py-3">
                  <CustomColumnHeader id={c.key.slice("custom:".length)} label={c.label} />
                </th>
              ) : (
                <th key={c.key} className="px-3 py-3">
                  {c.label}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {leads.map((l, i) => (
            <tr key={l.id} className="align-top hover:bg-gray-50">
              <td className="px-3 py-3 text-gray-400">{i + 1}</td>
              {visible.map((c) => (
                <td key={c.key} className="max-w-xs px-3 py-3">
                  <LeadCell lead={l} columnKey={c.key} />
                </td>
              ))}
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={1 + visible.length} className="px-4 py-8 text-center text-gray-400">
                No leads found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
