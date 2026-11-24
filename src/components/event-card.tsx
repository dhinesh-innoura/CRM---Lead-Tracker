"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Trash2, MapPin, Calendar, Users } from "lucide-react";
import { deleteEvent } from "@/lib/event-actions";
import type { LeadEvent } from "@/lib/supabase/types";

export default function EventCard({ event }: { event: LeadEvent }) {
  const [isPending, startTransition] = useTransition();

  function remove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Remove event "${event.name}"? Its leads will be kept but unlinked from this event.`))
      return;
    startTransition(() => deleteEvent(event.id));
  }

  return (
    <div className="group relative rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md hover:ring-[var(--brand)]">
      <Link href={`/events/${event.id}`} className="block pr-6 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-[#1c2024] group-hover:text-[var(--brand)] text-base">
            {event.name}
          </p>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-[#0a2a2c] ring-1 ring-cyan-200">
            <Users size={12} />
            {event.lead_count ?? 0} {event.lead_count === 1 ? "lead" : "leads"}
          </span>
        </div>

        {event.location && (
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={13} className="text-gray-400 shrink-0" />
            <span className="truncate">{event.location}</span>
          </p>
        )}

        <p className="flex items-center gap-1 text-xs text-gray-400">
          <Calendar size={13} className="text-gray-400 shrink-0" />
          <span>
            {event.start_date}
            {event.end_date ? ` – ${event.end_date}` : ""}
          </span>
        </p>

        {event.description && (
          <p className="text-xs text-gray-600 line-clamp-2 pt-1 border-t border-gray-100">
            {event.description}
          </p>
        )}
      </Link>

      <button
        onClick={remove}
        disabled={isPending}
        title="Remove event"
        className="absolute right-3 top-3 text-gray-300 opacity-0 hover:text-red-600 group-hover:opacity-100 disabled:opacity-40 transition-opacity"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
