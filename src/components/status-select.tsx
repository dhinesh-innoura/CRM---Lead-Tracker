"use client";

import { useState, useTransition } from "react";
import { updateLeadStatus } from "@/lib/actions";
import { LEAD_STATUSES, STATUS_LABELS, STATUSES_REQUIRING_DETAILS, type LeadStatus } from "@/lib/supabase/types";
import MeetingDetailsModal from "@/components/meeting-details-modal";
import QuickResponseModal from "@/components/quick-response-modal";
import HoldReasonModal from "@/components/hold-reason-modal";

export default function StatusSelect({ leadId, status }: { leadId: string; status: LeadStatus | null }) {
  const [isPending, startTransition] = useTransition();
  const [pendingModal, setPendingModal] = useState<LeadStatus | null>(null);

  function handleChange(next: LeadStatus) {
    if (STATUSES_REQUIRING_DETAILS.includes(next)) {
      setPendingModal(next);
      return;
    }
    startTransition(() => updateLeadStatus(leadId, next));
  }

  return (
    <>
      <select
        value={status ?? ""}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as LeadStatus)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-[#1c2024] disabled:opacity-60"
      >
        {!status && (
          <option value="" disabled hidden>
            Status
          </option>
        )}
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      {(pendingModal === "meeting_scheduled" || pendingModal === "meeting_rescheduled") && (
        <MeetingDetailsModal
          leadId={leadId}
          status={pendingModal}
          onDone={() => setPendingModal(null)}
          onCancel={() => setPendingModal(null)}
        />
      )}
      {pendingModal === "response_received" && (
        <QuickResponseModal leadId={leadId} onDone={() => setPendingModal(null)} onCancel={() => setPendingModal(null)} />
      )}
      {pendingModal === "on_hold" && (
        <HoldReasonModal leadId={leadId} onDone={() => setPendingModal(null)} onCancel={() => setPendingModal(null)} />
      )}
    </>
  );
}
