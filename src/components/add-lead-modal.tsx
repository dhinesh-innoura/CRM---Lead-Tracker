"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "@/components/modal";
import { createLeadsManually, type ManualLeadRow } from "@/lib/actions";
import { LEAD_SOURCES, LEAD_STATUSES, STATUS_LABELS, type LeadFieldDef, type LeadSource } from "@/lib/supabase/types";

type Row = ManualLeadRow & { customValues: Record<string, string> };

function emptyRow(): Row {
  return { company_name: "", priority: "medium", customValues: {} };
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]";
const labelClass = "mb-1 block text-xs font-medium text-gray-600";

export default function AddLeadModal({
  fieldDefs,
  defaultSource,
  eventId,
}: {
  fieldDefs: LeadFieldDef[];
  defaultSource?: LeadSource;
  eventId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [isSaving, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function updateRow(i: number, field: keyof ManualLeadRow, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function updateCustom(i: number, key: string, value: string) {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, customValues: { ...r.customValues, [key]: value } } : r))
    );
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(i: number) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  function handleSave() {
    setError(null);
    const payload = rows.map((r) => ({ ...r, custom_fields: r.customValues }));
    startTransition(async () => {
      try {
        await createLeadsManually(payload, { defaultSource, eventId });
        setRows([emptyRow()]);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save leads");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        + Add Manually
      </button>

      {open && (
        <Modal
          title="Add Leads Manually"
          description="Fill in the details below. Add more leads and save them all together."
          onClose={() => setOpen(false)}
          wide
        >
          <div className="space-y-5">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            {rows.map((row, i) => (
              <div key={i} className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#1c2024]">Lead {i + 1}</h3>
                  {rows.length > 1 && (
                    <button
                      onClick={() => removeRow(i)}
                      title="Remove this lead"
                      className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={row.company_name}
                      onChange={(e) => updateRow(i, "company_name", e.target.value)}
                      className={inputClass}
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Website URL</label>
                    <input
                      value={row.company_website ?? ""}
                      onChange={(e) => updateRow(i, "company_website", e.target.value)}
                      className={inputClass}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Country</label>
                    <input
                      value={row.country ?? ""}
                      onChange={(e) => updateRow(i, "country", e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Singapore, UAE"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Industry</label>
                    <input
                      value={row.industry ?? ""}
                      onChange={(e) => updateRow(i, "industry", e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Security, Retail"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>About Company</label>
                    <textarea
                      value={row.about_company ?? ""}
                      onChange={(e) => updateRow(i, "about_company", e.target.value)}
                      rows={2}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Outreach Date</label>
                    <input
                      type="date"
                      value={row.outreach_date ?? ""}
                      onChange={(e) => updateRow(i, "outreach_date", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Last Outreach Date</label>
                    <input
                      type="date"
                      value={row.last_outreach_date ?? ""}
                      onChange={(e) => updateRow(i, "last_outreach_date", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Contact Person</label>
                    <input
                      value={row.contact_name ?? ""}
                      onChange={(e) => updateRow(i, "contact_name", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Contact LinkedIn URL</label>
                    <input
                      value={row.contact_linkedin_url ?? ""}
                      onChange={(e) => updateRow(i, "contact_linkedin_url", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>About Person</label>
                    <textarea
                      value={row.about_person ?? ""}
                      onChange={(e) => updateRow(i, "about_person", e.target.value)}
                      rows={2}
                      className={inputClass}
                    />
                  </div>

                  {!defaultSource && (
                    <div>
                      <label className={labelClass}>Source</label>
                      <select
                        value={row.source ?? ""}
                        onChange={(e) => updateRow(i, "source", e.target.value)}
                        className={inputClass}
                      >
                        <option value="">— Select —</option>
                        {LEAD_SOURCES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Status</label>
                    <select
                      value={row.status ?? ""}
                      onChange={(e) => updateRow(i, "status", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Status</option>
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Solutions</label>
                    <input
                      value={row.solutions ?? ""}
                      onChange={(e) => updateRow(i, "solutions", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Products</label>
                    <input
                      value={row.products ?? ""}
                      onChange={(e) => updateRow(i, "products", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>AiVision360 Synergy</label>
                    <textarea
                      value={row.ai_synergy ?? ""}
                      onChange={(e) => updateRow(i, "ai_synergy", e.target.value)}
                      rows={2}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Applications</label>
                    <input
                      value={row.applications ?? ""}
                      onChange={(e) => updateRow(i, "applications", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Partners</label>
                    <input
                      value={row.partners ?? ""}
                      onChange={(e) => updateRow(i, "partners", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Annual Revenue</label>
                    <input
                      value={row.annual_revenue ?? ""}
                      onChange={(e) => updateRow(i, "annual_revenue", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Priority</label>
                    <select
                      value={row.priority ?? "medium"}
                      onChange={(e) => updateRow(i, "priority", e.target.value)}
                      className={inputClass}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Business Email</label>
                    <input
                      type="email"
                      value={row.contact_email ?? ""}
                      onChange={(e) => updateRow(i, "contact_email", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Notes</label>
                    <textarea
                      value={row.notes ?? ""}
                      onChange={(e) => updateRow(i, "notes", e.target.value)}
                      rows={2}
                      className={inputClass}
                    />
                  </div>

                  {fieldDefs.map((f) => (
                    <div key={f.key}>
                      <label className={labelClass}>{f.label}</label>
                      <input
                        value={row.customValues[f.key] ?? ""}
                        onChange={(e) => updateCustom(i, f.key, e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={addRow}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              <Plus size={16} /> Add Another Lead
            </button>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-lg bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : `Save ${rows.length > 1 ? `${rows.length} Leads` : "Lead"}`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
