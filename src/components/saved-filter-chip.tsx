"use client";

import { useTransition } from "react";
import Link from "next/link";
import { deleteSavedFilter } from "@/lib/actions";
import type { SavedFilter } from "@/lib/supabase/types";

export default function SavedFilterChip({ filter }: { filter: SavedFilter }) {
  const [isPending, startTransition] = useTransition();
  const params = new URLSearchParams(filter.query).toString();

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
      <Link href={`/leads?${params}`} className="hover:text-[var(--brand)]">
        {filter.name}
      </Link>
      <button
        disabled={isPending}
        onClick={() => startTransition(() => deleteSavedFilter(filter.id))}
        className="text-gray-400 hover:text-red-500"
        aria-label={`Delete filter ${filter.name}`}
      >
        ×
      </button>
    </span>
  );
}
