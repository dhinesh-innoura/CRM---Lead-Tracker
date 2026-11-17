"use client";

import { useState } from "react";
import Modal from "@/components/modal";
import ImportClient from "@/app/(app)/import/import-client";
import type { LeadFieldDef, LeadSource } from "@/lib/supabase/types";

export default function ImportModal({
  fieldDefs,
  defaultSource,
  eventId,
}: {
  fieldDefs: LeadFieldDef[];
  defaultSource?: LeadSource;
  eventId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[var(--sidebar)] px-4 py-2 text-sm font-medium text-white hover:bg-black"
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
          <ImportClient fieldDefs={fieldDefs} defaultSource={defaultSource} eventId={eventId} />
        </Modal>
      )}
    </>
  );
}
