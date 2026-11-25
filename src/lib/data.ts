import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/supabase/types";

// Deduped per request: the layout and the page both call requireUser(), and
// without this they'd each hit Supabase auth + the profiles table separately.
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { supabase, user, profile: profile as Profile | null };
});

export function sanitizeProfiles(profiles: Profile[]): Profile[] {
  // If a user has both an admin and a user (bdo) account (like Dhinesh and Sujitha in dual-role setup),
  // remove the admin account and keep the user account.
  const byName = new Map<string, Profile[]>();
  for (const p of profiles) {
    const key = p.full_name.toLowerCase().trim();
    const list = byName.get(key) ?? [];
    list.push(p);
    byName.set(key, list);
  }

  const result: Profile[] = [];
  for (const [, list] of byName) {
    if (list.length === 1) {
      const p = list[0];
      result.push(p.role === "admin" ? { ...p, role: "bdo" } : p);
    } else {
      // Find the user/bdo account, dropping the admin part
      const userProfile = list.find((p) => p.role !== "admin") ?? list[0];
      result.push(userProfile.role === "admin" ? { ...userProfile, role: "bdo" } : userProfile);
    }
  }

  return result.sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export const getProfiles = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .order("full_name");
  return sanitizeProfiles((data ?? []) as Profile[]);
});

export const getAllProfilesMap = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*");
  const map = new Map<string, string>();
  for (const p of (data ?? []) as Profile[]) {
    map.set(p.id, p.full_name);
  }
  return map;
});
