"use client";

import { useState, useTransition } from "react";
import { updateLeadCustomField } from "@/lib/actions";

export default function EditableCell({
  leadId,
  fieldKey,
  initialValue,
}: {
  leadId: string;
  fieldKey: string;
  initialValue: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  return (
    <input
      value={value}
      disabled={isPending}
      placeholder="--"
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== initialValue) {
          startTransition(() => updateLeadCustomField(leadId, fieldKey, value));
        }
      }}
      className="w-full min-w-[160px] rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm leading-snug text-gray-700 hover:border-gray-200 focus:min-w-[220px] focus:border-[var(--brand)] focus:bg-white focus:shadow-sm focus:outline-none"
    />
  );
}
