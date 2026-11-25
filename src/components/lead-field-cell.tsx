"use client";

import { useState, useTransition } from "react";
import { updateLeadField } from "@/lib/actions";

export default function LeadFieldCell({
  leadId,
  field,
  initialValue,
  multiline,
  type = "text",
}: {
  leadId: string;
  field: string;
  initialValue: string;
  multiline?: boolean;
  type?: "text" | "date";
}) {
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  function commit(nextValue: string) {
    if (nextValue !== initialValue) {
      startTransition(() => updateLeadField(leadId, field, nextValue));
    }
  }

  const className =
    "w-full min-w-[160px] rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm leading-snug text-gray-700 hover:border-gray-200 focus:border-[var(--brand)] focus:bg-white focus:shadow-sm focus:outline-none";

  if (type === "date") {
    return (
      <input
        type="date"
        value={value}
        disabled={isPending}
        onChange={(e) => {
          setValue(e.target.value);
          commit(e.target.value);
        }}
        className={className}
      />
    );
  }

  if (multiline) {
    return (
      <textarea
        value={value}
        disabled={isPending}
        rows={3}
        placeholder="--"
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => commit(value)}
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
      onBlur={() => commit(value)}
      className={`${className} focus:min-w-[220px]`}
    />
  );
}
