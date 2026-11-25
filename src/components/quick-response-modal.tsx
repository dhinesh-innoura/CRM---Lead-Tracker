"use client";

import { useState } from "react";
import Modal from "@/components/modal";
import { recordQuickResponse } from "@/lib/actions";

export default function QuickResponseModal({
  leadId,
  onDone,
  onCancel,
}: {
  leadId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      await recordQuickResponse(leadId, text.trim());
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Record Response" description="What did the prospect say?" onClose={onCancel}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          autoFocus
          required
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's the response?"
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
            disabled={saving || !text.trim()}
            className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
