"use client";

import { useState } from "react";
import { PauseCircle } from "lucide-react";
import Modal from "@/components/modal";
import { updateHoldReason } from "@/lib/actions";

export default function HoldReasonIcon({ leadId, reason }: { leadId: string; reason: string | null }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(reason ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateHoldReason(leadId, text.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setText(reason ?? "");
          setOpen(true);
        }}
        title="On hold — view reason"
        className="ml-1.5 inline-flex align-middle text-amber-500 hover:text-amber-600"
      >
        <PauseCircle size={16} />
      </button>

      {open && (
        <Modal title="Hold Reason" onClose={() => setOpen(false)}>
          {editing ? (
            <div className="space-y-3">
              <textarea
                autoFocus
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="whitespace-pre-wrap text-sm text-gray-700">{reason || "No reason recorded."}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Update
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
