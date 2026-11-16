"use client";

import { useState, useTransition } from "react";
import { bulkUpdateAssignment, bulkUpdateStatus } from "@/lib/actions";
import { LEAD_STATUSES, STATUS_LABELS, type Lead, type LeadStatus, type Profile } from "@/lib/supabase/types";
import type { ColumnPref } from "@/lib/lead-columns";
import LeadCell from "@/components/lead-cell";
import CustomColumnHeader from "@/components/custom-column-header";

export default function LeadsTableBulk({
  leads,
  profiles,
  columns,
}: {
  leads: Lead[];
  profiles: Profile[];
  columns: ColumnPref[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const visible = columns.filter((c) => c.visible);

  const allSelected = leads.length > 0 && selected.size === leads.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(leads.map((l) => l.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedIds = Array.from(selected);
  const colCount = 2 + visible.length;

  return (
    <div className="space-y-3">
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-[var(--sidebar)] px-4 py-3 text-sm text-white">
          <span>{selectedIds.length} selected</span>

          <select
            disabled={isPending}
            defaultValue=""
            onChange={(e) => {
              const status = e.target.value as LeadStatus;
              if (!status) return;
              startTransition(() => bulkUpdateStatus(selectedIds, status));
              e.target.value = "";
            }}
            className="rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-sm"
          >
            <option value="">Set status...</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s} className="text-black">
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          <select
            disabled={isPending}
            defaultValue=""
            onChange={(e) => {
              const assignee = e.target.value;
              startTransition(() => bulkUpdateAssignment(selectedIds, assignee));
              e.target.value = "";
            }}
            className="rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-sm"
          >
            <option value="">Assign to...</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id} className="text-black">
                {p.full_name}
              </option>
            ))}
          </select>

          <a
            href={`/api/export/leads?ids=${selectedIds.join(",")}`}
            className="ml-auto rounded-lg bg-[var(--brand)] px-3 py-1.5 text-sm font-medium text-[#0a2a2c] hover:opacity-90"
          >
            Export Selected
          </a>

          <button onClick={() => setSelected(new Set())} className="text-sm text-white/70 hover:text-white">
            Clear
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-10 px-3 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
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
              <tr key={l.id} className={`align-top hover:bg-gray-50 ${selected.has(l.id) ? "bg-cyan-50/40" : ""}`}>
                <td className="px-3 py-3">
                  <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleOne(l.id)} />
                </td>
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
                <td colSpan={colCount} className="px-4 py-8 text-center text-gray-400">
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
