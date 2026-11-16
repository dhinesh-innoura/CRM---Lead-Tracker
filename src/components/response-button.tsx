"use client";

import { useState } from "react";
import QuickResponseModal from "@/components/quick-response-modal";

export default function ResponseButton({ leadId, hasResponse }: { leadId: string; hasResponse: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {hasResponse ? "Update Response" : "Record Response"}
      </button>
      {open && <QuickResponseModal leadId={leadId} onDone={() => setOpen(false)} onCancel={() => setOpen(false)} />}
    </>
  );
}
