"use client";

import { useTransition } from "react";
import { deleteLeadFieldDef } from "@/lib/actions";

export default function CustomColumnHeader({ id, label }: { id: string; label: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <span className="group inline-flex items-center gap-1">
      {label}
      <button
        disabled={isPending}
        onClick={() => startTransition(() => deleteLeadFieldDef(id))}
        className="text-gray-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
        title={`Remove column "${label}"`}
      >
        ×
      </button>
    </span>
  );
}
