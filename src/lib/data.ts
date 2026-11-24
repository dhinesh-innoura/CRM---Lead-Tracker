import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/supabase/types";

export async function requireUser() {
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
}

export function sanitizeProfiles(profiles: Profile[]): Profile[] {
  // No longer drop admin accounts; keep all profiles and sort by name.
  return profiles.sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export async function getProfiles() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .order("full_name");
  return sanitizeProfiles((data ?? []) as Profile[]);
}

export async function getAllProfilesMap() {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*");
  const map = new Map<string, string>();
  for (const p of (data ?? []) as Profile[]) {
    map.set(p.id, p.full_name);
  }
  return map;
}
