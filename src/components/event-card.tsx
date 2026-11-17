"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteEvent } from "@/lib/event-actions";
import type { LeadEvent } from "@/lib/supabase/types";

export default function EventCard({ event }: { event: LeadEvent }) {
  const [isPending, startTransition] = useTransition();

  function remove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Remove event "${event.name}"? Its leads will be kept but unlinked from the event.`)) return;
    startTransition(() => deleteEvent(event.id));
  }

  return (
    <div className="group relative rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:ring-[var(--brand)]">
      <Link href={`/events/${event.id}`} className="block pr-6">
        <p className="font-medium text-[#1c2024]">{event.name}</p>
        <p className="mt-1 text-xs text-gray-400">
          {event.start_date}
          {event.end_date ? ` – ${event.end_date}` : ""}
        </p>
      </Link>
      <button
        onClick={remove}
        disabled={isPending}
        title="Remove event"
        className="absolute right-3 top-3 text-gray-300 opacity-0 hover:text-red-600 group-hover:opacity-100 disabled:opacity-40"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
