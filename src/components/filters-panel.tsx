"use client";

import { useState } from "react";
import { Filter } from "lucide-react";

export default function FiltersPanel({
  hasActiveFilters,
  children,
}: {
  hasActiveFilters: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(hasActiveFilters);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <Filter size={16} />
        Filters
        {hasActiveFilters && <span className="ml-1 rounded-full bg-[var(--brand)] px-1.5 text-xs text-[#0a2a2c]">on</span>}
      </button>
      {open && children}
    </div>
  );
}
