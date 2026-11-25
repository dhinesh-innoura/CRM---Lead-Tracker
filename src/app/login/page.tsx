"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const [selected, setSelected] = useState<{ name: string; email: string } | null>(null);
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelect(name: string, email: string) {
    setSelected({ name, email });
    setPassword("");
    setError(null);
  }

  function handleBack() {
    setSelected(null);
    setPassword("");
    setError(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSigningIn(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: selected.email,
      password,
    });

    if (signInError) {
      setError("Incorrect password. Please try again.");
      setSigningIn(false);
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

        {!selected ? (
          <div className="space-y-2">
            <p className="mb-3 text-sm font-medium text-gray-700">Who are you?</p>
            {TEAM.map((m) => (
              <button
                key={m.name}
                onClick={() => handleSelect(m.name, m.email)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-left text-sm font-medium text-[#1c2024] transition hover:border-[var(--brand)] hover:bg-cyan-50/40"
              >
                {m.name}
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <button
                type="button"
                onClick={handleBack}
                className="mb-3 text-xs font-medium text-gray-400 hover:text-gray-600"
              >
                ← Back
              </button>
              <p className="text-sm font-medium text-gray-700">
                Hi, <span className="text-[#1c2024]">{selected.name}</span> — enter your password
              </p>
            </div>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
            />
            <button
              type="submit"
              disabled={signingIn || password.length === 0}
              className="w-full rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {signingIn ? "Signing in..." : "Log In"}
            </button>
          </form>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
