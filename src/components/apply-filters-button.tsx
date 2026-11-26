"use client";

import { useState } from "react";

export default function ApplyFiltersButton() {
  const [applying, setApplying] = useState(false);

  return (
    <button
      type="submit"
      onClick={() => setApplying(true)}
      disabled={applying}
      className="col-span-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60 lg:col-span-1"
    >
      {applying ? "Applying..." : "Apply"}
    </button>
  );
}
