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
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== initialValue) {
          startTransition(() => updateLeadCustomField(leadId, fieldKey, value));
        }
      }}
      className="w-full min-w-[120px] rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-gray-700 hover:border-gray-200 focus:border-[var(--brand)] focus:bg-white focus:outline-none"
    />
  );
}
