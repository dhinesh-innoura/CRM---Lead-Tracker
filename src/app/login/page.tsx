"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SHARED_PASSWORD = "Tracker360!";

const TEAM = [
  { name: "Dhinesh", email: "dhinesh@aivision360.com" },
  { name: "Sujitha", email: "sujitha@aivision360.com" },
  { name: "Monica", email: "monica@aivision360.com" },
  { name: "Kezi", email: "kezi@aivision360.com" },
  { name: "George", email: "george@aivision360.com" },
  { name: "Arun", email: "arun@aivision360.com" },
];

export default function LoginPage() {
  const router = useRouter();
  const [signingInAs, setSigningInAs] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(name: string, email: string) {
    setSigningInAs(name);
    setError(null);

    const supabase = createClient();
    let res = await supabase.auth.signInWithPassword({
      email,
      password: SHARED_PASSWORD,
    });

    // If initial attempt fails and member had a .user account, try alternate email
    if (res.error && (name === "Dhinesh" || name === "Sujitha")) {
      const altEmail = email.includes(".user@")
        ? email.replace(".user@", "@")
        : email.replace("@", ".user@");
      const fallback = await supabase.auth.signInWithPassword({
        email: altEmail,
        password: SHARED_PASSWORD,
      });
      if (!fallback.error) {
        res = fallback;
      }
    }

    if (res.error) {
      setError(res.error.message);
      setSigningInAs(null);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--sidebar)] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[#1c2024]">
            Tracker<span className="text-[var(--brand)]">360</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Every Lead. Every Follow-up. Every Opportunity. One Tracker.
          </p>
        </div>

        <div className="space-y-2">
          <p className="mb-3 text-sm font-medium text-gray-700">Who are you?</p>
          {TEAM.map((m) => (
            <button
              key={m.name}
              disabled={signingInAs !== null}
              onClick={() => handleSelect(m.name, m.email)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-left text-sm font-medium text-[#1c2024] transition hover:border-[var(--brand)] hover:bg-cyan-50/40 disabled:opacity-60"
            >
              {signingInAs === m.name ? "Signing in..." : m.name}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
