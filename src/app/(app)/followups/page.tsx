import Link from "next/link";
import { requireUser } from "@/lib/data";
import { STATUS_LABELS, type Lead, type LeadStatus } from "@/lib/supabase/types";
import { AlertCircle, Calendar, CheckCircle2, Clock, User, CalendarDays } from "lucide-react";

interface FollowUpLeadItem extends Lead {
  events?: { name: string } | null;
  profiles?: { full_name: string } | null;
}

function FollowUpSection({
  title,
  subtitle,
  items,
  tone,
  badgeBg,
  icon: Icon,
  today,
}: {
  title: string;
  subtitle?: string;
  items: FollowUpLeadItem[];
  tone: string;
  badgeBg: string;
  icon: typeof Clock;
  today: string;
}) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={tone} size={18} />
          <h2 className={`text-base font-semibold ${tone}`}>{title}</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeBg} ${tone}`}>
            {items.length}
          </span>
        </div>
        {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
      </div>

      <ul className="divide-y divide-gray-100 text-sm">
        {items.map((l) => {
          let daysDiff = 0;
          if (l.next_follow_up_date) {
            const due = new Date(l.next_follow_up_date).getTime();
            const now = new Date(today).getTime();
            daysDiff = Math.round((now - due) / (1000 * 60 * 60 * 24));
          }

          return (
            <li key={l.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/leads/${l.id}`}
                    className="font-semibold text-[#1c2024] hover:text-[var(--brand)] transition-colors"
                  >
                    {l.company_name}
                  </Link>
                  {l.status && (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      {STATUS_LABELS[l.status as LeadStatus] ?? l.status}
                    </span>
                  )}
                  {l.events?.name && (
                    <span className="rounded bg-cyan-50 px-2 py-0.5 text-[11px] font-medium text-[#0a2a2c] ring-1 ring-cyan-200">
                      {l.events.name}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  {l.contact_name && <span>Contact: {l.contact_name}</span>}
                  {l.contact_email && <span className="text-gray-400">{l.contact_email}</span>}
                  {l.profiles?.full_name && (
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <User size={12} />
                      {l.profiles.full_name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                  <Calendar size={13} className="text-gray-400" />
                  {l.next_follow_up_date}
                </span>

                {daysDiff > 0 && (
                  <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                    {daysDiff} {daysDiff === 1 ? "day" : "days"} overdue
                  </span>
                )}
                {daysDiff === 0 && (
                  <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                    Due today
                  </span>
                )}
              </div>
            </li>
          );
        })}

        {items.length === 0 && (
          <li className="py-6 text-center text-sm text-gray-400">No follow-ups in this category.</li>
        )}
      </ul>
    </section>
  );
}

export default async function FollowUpsPage() {
  const { supabase } = await requireUser();
  const today = new Date().toISOString().slice(0, 10);

  // Fetch all leads across the CRM that have a scheduled follow-up
  const { data } = await supabase
    .from("leads")
    .select("*, events(name), profiles:assigned_to(full_name)")
    .not("next_follow_up_date", "is", null)
    .order("next_follow_up_date", { ascending: true });

  const all = ((data ?? []) as FollowUpLeadItem[]).filter(
    (l) => l.status !== "successfully_converted"
  );

  const overdue = all.filter((l) => l.next_follow_up_date && l.next_follow_up_date < today);
  const dueToday = all.filter((l) => l.next_follow_up_date === today);
  const upcoming = all.filter((l) => l.next_follow_up_date && l.next_follow_up_date > today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1c2024]">Global Follow-ups</h1>
        <p className="text-sm text-gray-500">
          Centralized follow-up hub for all leads across Own Leads, Assigned Leads, and Event Leads. Overdue
          follow-ups are permanently preserved until completed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-red-50/70 p-4 ring-1 ring-red-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-600">Overdue</span>
            <AlertCircle size={18} className="text-red-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-red-700">{overdue.length}</p>
          <p className="mt-1 text-xs text-red-600/80">Requires immediate attention</p>
        </div>

        <div className="rounded-xl bg-amber-50/70 p-4 ring-1 ring-amber-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Due Today</span>
            <Clock size={18} className="text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-800">{dueToday.length}</p>
          <p className="mt-1 text-xs text-amber-700/80">Scheduled for today ({today})</p>
        </div>

        <div className="rounded-xl bg-cyan-50/70 p-4 ring-1 ring-cyan-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0a2a2c]">Upcoming</span>
            <CalendarDays size={18} className="text-[#0a2a2c]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#0a2a2c]">{upcoming.length}</p>
          <p className="mt-1 text-xs text-gray-500">Scheduled for future dates</p>
        </div>
      </div>

      <FollowUpSection
        title="Overdue Follow-ups"
        subtitle="Never lost when dates change"
        items={overdue}
        tone="text-red-600"
        badgeBg="bg-red-100"
        icon={AlertCircle}
        today={today}
      />

      <FollowUpSection
        title="Today's Follow-ups"
        subtitle={`Scheduled for ${today}`}
        items={dueToday}
        tone="text-amber-700"
        badgeBg="bg-amber-100"
        icon={Clock}
        today={today}
      />

      <FollowUpSection
        title="Upcoming Follow-ups"
        subtitle="Future scheduled follow-ups"
        items={upcoming}
        tone="text-[#1c2024]"
        badgeBg="bg-gray-100"
        icon={CheckCircle2}
        today={today}
      />
    </div>
  );
}
