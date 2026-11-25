"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
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
  CalendarRange,
  Link as LinkedinIcon,
} from "lucide-react";
import SignOutButton from "@/components/sign-out-button";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Own Leads", icon: Users },
  { href: "/leads/sir-given", label: "Assigned Leads", icon: Users },
  { href: "/events", label: "Event Leads", icon: CalendarRange },
  { href: "/followups", label: "Follow-ups", icon: Clock },
  { href: "/responses", label: "Responses", icon: MessageSquare },
  { href: "/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/linkedin", label: "LinkedIn", icon: LinkedinIcon },
  { href: "/team", label: "Team Management", icon: UsersRound },
  { href: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/audit", label: "Audit Log", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({
  fullName,
}: {
  fullName: string;
}) {
  const nav = NAV;
  const pathname = usePathname();
  const activeHref = nav
    .filter((item) => (item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("tracker360:sidebar-collapsed") === "1";
    } catch {
      return false;
    }
  });

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tracker360:sidebar-collapsed", next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <aside
      className={`flex shrink-0 flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)] transition-all duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="px-4 py-6">
        <h1 className="truncate text-xl font-semibold text-white">
          {collapsed ? <span className="text-[var(--brand)]">360</span> : (
            <>
              Tracker<span className="text-[var(--brand)]">360</span>
            </>
          )}
        </h1>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const isActive = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-[var(--brand)] text-white"
                  : "text-[var(--sidebar-foreground)] hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={18} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-4 py-4">
        {!collapsed && (
          <>
            <p className="truncate text-sm font-medium text-white">{fullName}</p>
            <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--sidebar-foreground)]">
              BDO
            </span>
          </>
        )}
        <div className={collapsed ? "mt-0 flex justify-center" : "mt-2"}>
          <SignOutButton />
        </div>
        <button
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`mt-3 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--sidebar-foreground)] hover:bg-white/10 hover:text-white ${
            collapsed ? "justify-center" : "w-full"
          }`}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
