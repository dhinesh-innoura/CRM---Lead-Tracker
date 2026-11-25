"use client";

import { useState } from "react";
import Modal from "@/components/modal";
import { setLeadOnHold } from "@/lib/actions";

export default function HoldReasonModal({
  leadId,
  onDone,
  onCancel,
}: {
  leadId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    setSaving(true);
    try {
      await setLeadOnHold(leadId, reason.trim());
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Put Lead On Hold" description="Why is this lead being put on hold?" onClose={onCancel}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          autoFocus
          required
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for hold..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !reason.trim()}
            className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
