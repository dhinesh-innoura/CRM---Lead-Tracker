"use client";

import { useState } from "react";
import { GripVertical, Eye, EyeOff, Settings2 } from "lucide-react";
import Modal from "@/components/modal";
import { saveColumnPrefs } from "@/lib/actions";
import { buildDefaultColumns, type ColumnPref } from "@/lib/lead-columns";
import type { LeadFieldDef } from "@/lib/supabase/types";

export default function ColumnCustomizer({
  columns,
  fieldDefs,
}: {
  columns: ColumnPref[];
  fieldDefs: LeadFieldDef[];
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ColumnPref[]>(columns);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  function openModal() {
    setDraft(columns);
    setOpen(true);
  }

  function toggleVisible(key: string) {
    setDraft((prev) => prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));
  }

  function moveTo(from: number, to: number) {
    setDraft((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function handleApply() {
    setSaving(true);
    try {
      await saveColumnPrefs(draft);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    const defaults = buildDefaultColumns(fieldDefs);
    setDraft(defaults);
  }

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <Settings2 size={16} />
        Customize Columns
      </button>

      {open && (
        <Modal
          title="Table Customization"
          description="Drag to reorder, click the eye icon to show/hide columns."
          onClose={() => setOpen(false)}
        >
          <div className="space-y-2">
            {draft.map((col, i) => (
              <div
                key={col.key}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null && dragIndex !== i) moveTo(dragIndex, i);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                  dragIndex === i ? "border-[var(--brand)] bg-cyan-50/40" : "border-gray-200"
                }`}
              >
                <GripVertical size={16} className="shrink-0 cursor-grab text-gray-400" />
                <span className="flex-1 text-sm font-medium text-[#1c2024]">
                  {col.label}
                  {col.custom && <span className="ml-1 text-xs text-gray-400">(custom)</span>}
                </span>
                <button onClick={() => toggleVisible(col.key)} className="text-[var(--brand)]">
                  {col.visible ? <Eye size={18} /> : <EyeOff size={18} className="text-gray-300" />}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <button
              onClick={handleReset}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Reset to Default
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={saving}
                className="rounded-lg bg-[var(--sidebar)] px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
              >
                {saving ? "Saving..." : "Apply"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
