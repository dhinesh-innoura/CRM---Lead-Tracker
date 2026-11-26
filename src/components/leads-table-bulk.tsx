"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteLead, deleteLeads } from "@/lib/actions";
import type { Lead } from "@/lib/supabase/types";
import type { ColumnPref } from "@/lib/lead-columns";
import LeadCell from "@/components/lead-cell";
import CustomColumnHeader from "@/components/custom-column-header";

const PAGE_SIZE = 10;

export default function LeadsTableBulk({
  leads,
  columns,
  eventId,
}: {
  leads: Lead[];
  columns: ColumnPref[];
  eventId?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rawPage, setPage] = useState(0);
  const [isDeleting, startDelete] = useTransition();
  const visible = columns.filter((c) => c.visible);

  const pageCount = Math.max(1, Math.ceil(leads.length / PAGE_SIZE));
  const page = Math.min(rawPage, pageCount - 1);

  const pagedLeads = leads.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

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
  const colCount = 3 + visible.length;

  const removeWarning = eventId
    ? "This only removes the lead from this event — it stays in Own/Assigned Leads."
    : "This cannot be undone.";

  function removeOne(id: string) {
    if (!window.confirm(`Remove this lead? ${removeWarning}`)) return;
    startDelete(() => deleteLead(id, eventId));
  }

  function removeAll() {
    if (leads.length === 0) return;
    if (!window.confirm(`Remove all ${leads.length} leads in this list? ${removeWarning}`)) return;
    startDelete(() => deleteLeads(leads.map((l) => l.id), eventId));
    setSelected(new Set());
  }

  function removeSelected() {
    if (!window.confirm(`Remove ${selectedIds.length} selected lead(s)? ${removeWarning}`)) return;
    startDelete(() => deleteLeads(selectedIds, eventId));
    setSelected(new Set());
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={removeAll}
          disabled={isDeleting || leads.length === 0}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          Remove All
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-[var(--sidebar)] px-4 py-3 text-sm text-white">
          <span>{selectedIds.length} selected</span>

          <a
            href={`/api/export/leads?ids=${selectedIds.join(",")}`}
            className="ml-auto rounded-lg bg-[var(--brand)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Export Selected
          </a>

          <button
            onClick={removeSelected}
            disabled={isDeleting}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20 disabled:opacity-40"
          >
            Remove Selected
          </button>

          <button onClick={() => setSelected(new Set())} className="text-sm text-white/70 hover:text-white">
            Clear
          </button>
        </div>
      )}

      <div className="max-h-[65vh] overflow-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
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
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagedLeads.map((l, i) => (
              <tr key={l.id} className={`align-top hover:bg-gray-50 ${selected.has(l.id) ? "bg-cyan-50/40" : ""}`}>
                <td className="px-3 py-3">
                  <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleOne(l.id)} />
                </td>
                <td className="px-3 py-3 text-gray-400">{page * PAGE_SIZE + i + 1}</td>
                {visible.map((c) => (
                  <td key={c.key} className="max-w-sm px-2 py-2">
                    <LeadCell lead={l} columnKey={c.key} eventId={eventId} />
                  </td>
                ))}
                <td className="px-3 py-3">
                  <button
                    onClick={() => removeOne(l.id)}
                    disabled={isDeleting}
                    title="Remove this lead"
                    className="text-gray-400 hover:text-red-600 disabled:opacity-40"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
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

      {leads.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {page * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE + PAGE_SIZE, leads.length)} of {leads.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-1">
              Page {page + 1} of {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
