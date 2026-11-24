"use client";

import { useTransition } from "react";
import { updateLeadAssignment } from "@/lib/actions";
import type { Profile } from "@/lib/supabase/types";

export default function AssigneeSelect({
  leadId,
  assignedTo,
  profiles,
  assignedToName,
}: {
  leadId: string;
  assignedTo: string | null;
  profiles: Profile[];
  assignedToName?: string;
}) {
  const [isPending, startTransition] = useTransition();

  // If the lead was previously assigned to an admin account ID that is no longer in the dropdown,
  // resolve by full name to the active user profile so the dropdown selects it correctly.
  const matched =
    profiles.find((p) => p.id === assignedTo) ??
    (assignedToName ? profiles.find((p) => p.full_name.toLowerCase() === assignedToName.toLowerCase()) : undefined);

  return (
    <select
      defaultValue={matched ? matched.id : ""}
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
