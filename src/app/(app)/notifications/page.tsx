import { requireUser } from "@/lib/data";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions";
import Link from "next/link";
import type { NotificationRow } from "@/lib/supabase/types";

export default async function NotificationsPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const notifications = (data ?? []) as NotificationRow[];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1c2024]">Notifications</h1>
          <p className="text-sm text-gray-500">{unreadCount} unread</p>
        </div>
        <form action={markAllNotificationsRead}>
          <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Mark all as read
          </button>
        </form>
      </div>

      <ul className="divide-y divide-gray-100 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        {notifications.map((n) => (
          <li key={n.id} className={`flex items-start justify-between gap-4 p-4 ${!n.is_read ? "bg-cyan-50/40" : ""}`}>
            <div>
              <p className="text-sm font-medium text-[#1c2024]">{n.title}</p>
              {n.body && <p className="text-sm text-gray-500">{n.body}</p>}
              <p className="mt-1 text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {n.lead_id && (
                <Link href={`/leads/${n.lead_id}`} className="text-xs font-medium text-[var(--brand)] hover:underline">
                  Open lead
                </Link>
              )}
              {!n.is_read && (
                <form action={markNotificationRead.bind(null, n.id)}>
                  <button className="text-xs font-medium text-gray-500 hover:underline">Mark read</button>
                </form>
              )}
            </div>
          </li>
        ))}
        {notifications.length === 0 && (
          <li className="p-8 text-center text-gray-400">No notifications yet.</li>
        )}
      </ul>
    </div>
  );
}
