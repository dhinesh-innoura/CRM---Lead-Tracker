import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Clock,
  MessageSquare,
  CalendarDays,
  UsersRound,
  BarChart3,
  Bell,
  Settings,
  ScrollText,
} from "lucide-react";
import { requireUser } from "@/lib/data";
import SignOutButton from "@/components/sign-out-button";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/leads", label: "Leads", icon: Users, adminOnly: false },
  { href: "/followups", label: "Follow-ups", icon: Clock, adminOnly: false },
  { href: "/responses", label: "Responses", icon: MessageSquare, adminOnly: false },
  { href: "/meetings", label: "Meetings", icon: CalendarDays, adminOnly: false },
  { href: "/team", label: "Team Management", icon: UsersRound, adminOnly: true },
  { href: "/reports", label: "Reports & Analytics", icon: BarChart3, adminOnly: true },
  { href: "/notifications", label: "Notifications", icon: Bell, adminOnly: false },
  { href: "/audit", label: "Audit Log", icon: ScrollText, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings, adminOnly: false },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, user } = await requireUser();
  const isAdmin = profile?.role === "admin";
  const nav = NAV.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="flex min-h-screen w-full">
      <aside className="flex w-64 shrink-0 flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)]">
        <div className="px-6 py-6">
          <h1 className="text-xl font-semibold text-white">
            Tracker<span className="text-[var(--brand)]">360</span>
          </h1>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--sidebar-foreground)] transition hover:bg-white/5 hover:text-white"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 px-4 py-4">
          <p className="truncate text-sm font-medium text-white">
            {profile?.full_name ?? user.email}
          </p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              isAdmin ? "bg-[var(--brand)] text-[#0a2a2c]" : "bg-white/10 text-[var(--sidebar-foreground)]"
            }`}
          >
            {isAdmin ? "Admin" : "BDO"}
          </span>
          <div className="mt-2">
            <SignOutButton />
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden bg-[var(--background)] p-6">{children}</main>
    </div>
  );
}
