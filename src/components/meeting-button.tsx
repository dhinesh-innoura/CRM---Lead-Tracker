"use client";

import { useState } from "react";
import MeetingDetailsModal from "@/components/meeting-details-modal";

export default function MeetingButton({ leadId, hasMeeting }: { leadId: string; hasMeeting: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {hasMeeting ? "Reschedule Meeting" : "Schedule Meeting"}
      </button>
      {open && (
        <MeetingDetailsModal
          leadId={leadId}
          status={hasMeeting ? "meeting_rescheduled" : "meeting_scheduled"}
          onDone={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}
