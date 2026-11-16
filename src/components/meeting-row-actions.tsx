"use client";

import { useState, useTransition } from "react";
import MeetingDetailsModal from "@/components/meeting-details-modal";
import { markMeetingCompleted } from "@/lib/actions";

export default function MeetingRowActions({
  leadId,
  meetingId,
  status,
}: {
  leadId: string;
  meetingId: string;
  status: string;
}) {
  const [rescheduling, setRescheduling] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (status === "completed") {
    return <span className="text-xs text-gray-400">—</span>;
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setRescheduling(true)}
        className="text-xs font-medium text-[var(--brand)] hover:underline"
      >
        Reschedule
      </button>
      <button
        disabled={isPending}
        onClick={() => startTransition(() => markMeetingCompleted(meetingId, leadId))}
        className="text-xs font-medium text-gray-500 hover:underline disabled:opacity-60"
      >
        Mark Completed
      </button>

      {rescheduling && (
        <MeetingDetailsModal
          leadId={leadId}
          status="meeting_rescheduled"
          onDone={() => setRescheduling(false)}
          onCancel={() => setRescheduling(false)}
        />
      )}
    </div>
  );
}
