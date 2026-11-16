"use client";

import { useState, useTransition } from "react";
import { addLeadFieldDef } from "@/lib/actions";

export default function AddColumnForm() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-500 hover:border-[var(--brand)] hover:text-[#1c2024]"
      >
        + Add Column
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!label.trim()) return;
        startTransition(async () => {
          await addLeadFieldDef(label.trim());
          setLabel("");
          setOpen(false);
        });
      }}
      className="flex items-center gap-2"
    >
      <input
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="New column name"
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
      />
      <button
        type="submit"
        disabled={isPending || !label.trim()}
        className="rounded-lg bg-[var(--sidebar)] px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-sm text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
    </form>
  );
}
