"use client";

import { useTransition } from "react";
import { updateLeadAssignment } from "@/lib/actions";
import type { Profile } from "@/lib/supabase/types";

export default function AssigneeSelect({
  leadId,
  assignedTo,
  profiles,
}: {
  leadId: string;
  assignedTo: string | null;
  profiles: Profile[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={assignedTo ?? ""}
      disabled={isPending}
      onChange={(e) =>
        startTransition(() => {
          updateLeadAssignment(leadId, e.target.value);
        })
      }
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-[#1c2024] disabled:opacity-60"
    >
      <option value="">Unassigned</option>
      {profiles.map((p) => (
        <option key={p.id} value={p.id}>
          {p.full_name}
        </option>
      ))}
    </select>
  );
}
