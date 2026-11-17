"use client";

import { useState, useTransition } from "react";
import { updateLeadField } from "@/lib/actions";

export default function LeadFieldCell({
  leadId,
  field,
  initialValue,
  multiline,
}: {
  leadId: string;
  field: string;
  initialValue: string;
  multiline?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  function commit() {
    if (value !== initialValue) {
      startTransition(() => updateLeadField(leadId, field, value));
    }
  }

  const className =
    "w-full min-w-[160px] rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm leading-snug text-gray-700 hover:border-gray-200 focus:border-[var(--brand)] focus:bg-white focus:shadow-sm focus:outline-none";

  if (multiline) {
    return (
      <textarea
        value={value}
        disabled={isPending}
        rows={3}
        placeholder="--"
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        className={`${className} resize-y focus:min-h-[96px] focus:min-w-[260px]`}
      />
    );
  }

  return (
    <input
      value={value}
      disabled={isPending}
      placeholder="--"
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      className={`${className} focus:min-w-[220px]`}
    />
  );
}
