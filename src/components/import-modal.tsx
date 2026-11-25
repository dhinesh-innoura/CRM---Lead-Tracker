"use client";

import { useState } from "react";
import Modal from "@/components/modal";
import ImportClient from "@/app/(app)/import/import-client";
import type { LeadFieldDef, LeadSource } from "@/lib/supabase/types";

export default function ImportModal({
  fieldDefs,
  defaultSource,
  defaultStatus,
  eventId,
  assignToSelf,
}: {
  fieldDefs: LeadFieldDef[];
  defaultSource?: LeadSource;
  defaultStatus?: string;
  eventId?: string;
  assignToSelf?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Import from Excel
      </button>

      {open && (
        <Modal
          title="Import Leads from Excel"
          description="Upload a file, map its columns, then import. Everyone on the team will see the new leads immediately."
          onClose={() => setOpen(false)}
          wide
        >
          <ImportClient
            fieldDefs={fieldDefs}
            defaultSource={defaultSource}
            defaultStatus={defaultStatus}
            eventId={eventId}
            assignToSelf={assignToSelf}
            onImported={() => setOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
