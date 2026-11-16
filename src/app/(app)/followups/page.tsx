import Link from "next/link";
import { requireUser } from "@/lib/data";
import type { Lead } from "@/lib/supabase/types";

function LeadSection({ title, items, tone }: { title: string; items: Lead[]; tone: string }) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <h2 className={`mb-3 text-sm font-semibold ${tone}`}>
        {title} ({items.length})
      </h2>
      <ul className="divide-y divide-gray-100 text-sm">
        {items.map((l) => (
          <li key={l.id} className="flex items-center justify-between py-2">
            <Link href={`/leads/${l.id}`} className="font-medium text-[#1c2024] hover:text-[var(--brand)]">
              {l.company_name}
            </Link>
            <span className="text-xs text-gray-400">{l.next_follow_up_date ?? "—"}</span>
          </li>
        ))}
        {items.length === 0 && <p className="py-4 text-center text-gray-400">None.</p>}
      </ul>
    </section>
  );
}

export default async function FollowUpsPage() {
  const { supabase } = await requireUser();
  const today = new Date().toISOString().slice(0, 10);

  const { data: followUpLeads } = await supabase
    .from("leads")
    .select("*")
    .eq("status", "follow_up")
    .order("next_follow_up_date", { ascending: true });

  const { data: pendingOutreach } = await supabase
    .from("leads")
    .select("*")
    .eq("status", "outreach_initiated")
    .order("next_follow_up_date", { ascending: true });

  const all = (followUpLeads ?? []) as Lead[];
  const overdue = all.filter((l) => l.next_follow_up_date && l.next_follow_up_date < today);
  const dueToday = all.filter((l) => l.next_follow_up_date === today);
  const upcoming = all.filter((l) => !l.next_follow_up_date || l.next_follow_up_date > today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1c2024]">Follow-ups</h1>
        <p className="text-sm text-gray-500">
          Leads currently in Follow Up status. Outreach Initiated leads move here automatically 2 days after
          outreach, or you can switch a lead to Follow Up manually.
        </p>
      </div>
      <LeadSection title="Overdue" items={overdue} tone="text-red-600" />
      <LeadSection title="Due Today" items={dueToday} tone="text-amber-600" />
      <LeadSection title="Upcoming" items={upcoming} tone="text-[#1c2024]" />

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-3 text-sm font-semibold text-gray-500">
          Outreach Initiated — waiting on the 2-day window ({(pendingOutreach ?? []).length})
        </h2>
        <ul className="divide-y divide-gray-100 text-sm">
          {(pendingOutreach as Lead[] | null)?.map((l) => (
            <li key={l.id} className="flex items-center justify-between py-2">
              <Link href={`/leads/${l.id}`} className="font-medium text-[#1c2024] hover:text-[var(--brand)]">
                {l.company_name}
              </Link>
              <span className="text-xs text-gray-400">moves to Follow Up on {l.next_follow_up_date}</span>
            </li>
          ))}
          {(!pendingOutreach || pendingOutreach.length === 0) && (
            <p className="py-4 text-center text-gray-400">None.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
