"use client";

import { useTransition } from "react";
import { deleteAllEvents } from "@/lib/event-actions";

export default function RemoveAllEventsButton({ count }: { count: number }) {
  const [isPending, startTransition] = useTransition();

  function removeAll() {
    if (count === 0) return;
    if (
      !window.confirm(
        `Remove all ${count} event${count === 1 ? "" : "s"}? Their leads will be kept but unlinked from any event. This cannot be undone.`
      )
    )
      return;
    startTransition(() => deleteAllEvents());
  }

  return (
    <button
      onClick={removeAll}
      disabled={isPending || count === 0}
      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
    >
      {isPending ? "Removing..." : "Remove All"}
    </button>
  );
}
