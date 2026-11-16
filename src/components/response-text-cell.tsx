"use client";

import { useState, useTransition } from "react";
import { updateResponseText } from "@/lib/actions";

export default function ResponseTextCell({ leadId, initialValue }: { leadId: string; initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  return (
    <textarea
      rows={2}
      value={value}
      disabled={isPending}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== initialValue) startTransition(() => updateResponseText(leadId, value));
      }}
      className="w-full min-w-[220px] rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-gray-700 hover:border-gray-200 focus:border-[var(--brand)] focus:bg-white focus:outline-none"
    />
  );
}
