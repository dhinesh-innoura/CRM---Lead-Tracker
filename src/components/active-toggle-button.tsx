"use client";

import { useTransition } from "react";
import { toggleLeadActive } from "@/lib/actions";

export default function ActiveToggleButton({ leadId, isActive }: { leadId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => toggleLeadActive(leadId, !isActive))}
      className={`rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-60 ${
        isActive
          ? "bg-green-500 text-white hover:bg-green-600"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {isActive ? "Active" : "Mark Active"}
    </button>
  );
}
