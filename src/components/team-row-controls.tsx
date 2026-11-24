"use client";

import { useTransition } from "react";
import { setTeamMemberRole, setTeamMemberActive } from "@/lib/team-actions";
import type { Profile, UserRole } from "@/lib/supabase/types";

export default function TeamRowControls({ profile }: { profile: Profile }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={profile.role}
        disabled={isPending}
        onChange={(e) =>
          startTransition(() => setTeamMemberRole(profile.id, e.target.value as UserRole))
        }
        className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
      >
        <option value="bdo">BDO</option>
      </select>
      <button
        disabled={isPending}
        onClick={() => startTransition(() => setTeamMemberActive(profile.id, !profile.is_active))}
        className={`rounded-full px-2 py-1 text-xs font-medium ${
          profile.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}
      >
        {profile.is_active ? "Active" : "Inactive"}
      </button>
    </div>
  );
}
