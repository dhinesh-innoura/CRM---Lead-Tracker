"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { saveFilter } from "@/lib/actions";

export default function SaveFilterForm() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        const query = Object.fromEntries(searchParams.entries());
        startTransition(async () => {
          await saveFilter(name.trim(), query);
          setSaved(true);
          setName("");
        });
      }}
      className="flex items-center gap-2"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Save current filter as..."
        className="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
      />
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        {saved ? "Saved" : "Save Filter"}
      </button>
    </form>
  );
}
