"use client";

import { useRef, useTransition } from "react";
import { addNote } from "@/lib/actions";

export default function NoteForm({ leadId }: { leadId: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const note = ref.current?.value.trim();
        if (!note) return;
        startTransition(async () => {
          await addNote(leadId, note);
          if (ref.current) ref.current.value = "";
        });
      }}
      className="flex gap-2"
    >
      <textarea
        ref={ref}
        rows={2}
        placeholder="Add a note or update..."
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
      />
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        Add
      </button>
    </form>
  );
}
