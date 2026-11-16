"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TEAM = [
  {
    name: "Dhinesh",
    isAdmin: true,
    adminEmail: "dhinesh@aivision360.com",
    userEmail: "dhinesh.user@aivision360.com",
  },
  {
    name: "Sujitha",
    isAdmin: true,
    adminEmail: "sujitha@aivision360.com",
    userEmail: "sujitha.user@aivision360.com",
  },
  { name: "Monica", isAdmin: false, adminEmail: "monica@aivision360.com", userEmail: "monica@aivision360.com" },
  { name: "Kezi", isAdmin: false, adminEmail: "kezi@aivision360.com", userEmail: "kezi@aivision360.com" },
  { name: "George", isAdmin: false, adminEmail: "george@aivision360.com", userEmail: "george@aivision360.com" },
  { name: "Arun", isAdmin: false, adminEmail: "arun@aivision360.com", userEmail: "arun@aivision360.com" },
];

export default function LoginPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "user">("admin");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const member = TEAM.find((m) => m.name === selected);
  const email = member ? (member.isAdmin && role === "user" ? member.userEmail : member.adminEmail) : "";

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return;
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setStatus("error");
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
                onClick={() => setSelected(m.name)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-left text-sm font-medium text-[#1c2024] transition hover:border-[var(--brand)] hover:bg-cyan-50/40"
              >
                {m.name}
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Hi, <span className="text-[#1c2024]">{member?.name}</span>
              </p>
            </div>

            {member?.isAdmin && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      role === "admin"
                        ? "border-[var(--brand)] bg-cyan-50 text-[#1c2024]"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("user")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      role === "user"
                        ? "border-[var(--brand)] bg-cyan-50 text-[#1c2024]"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    User
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-lg bg-[var(--sidebar)] py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:opacity-60"
            >
              {status === "sending" ? "Signing in..." : "Sign in"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setRole("admin");
                setPassword("");
                setStatus("idle");
                setError(null);
              }}
              className="w-full text-xs font-medium text-gray-400 hover:text-gray-600"
            >
              Not {member?.name}? Go back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
