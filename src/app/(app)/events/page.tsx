import { requireUser } from "@/lib/data";
import AddEventModal from "@/components/add-event-modal";
import EventCard from "@/components/event-card";
import RemoveAllEventsButton from "@/components/remove-all-events-button";
import type { LeadEvent } from "@/lib/supabase/types";

export default async function EventsPage() {
  const { supabase, user } = await requireUser();

  const [{ data: eventsData }, { data: eventLeadsData }, { data: legacyEventLeads }] =
    await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("created_by", user.id)
        .order("start_date", { ascending: false }),
      supabase.from("event_leads").select("event_id, lead_id"),
      supabase.from("leads").select("id, event_id").not("event_id", "is", null),
    ]);

  // Aggregate lead counts per event across both event_leads and legacy leads.event_id
  const eventLeadSets = new Map<string, Set<string>>();
  for (const row of eventLeadsData ?? []) {
    const set = eventLeadSets.get(row.event_id) ?? new Set<string>();
    set.add(row.lead_id);
    eventLeadSets.set(row.event_id, set);
  }
  for (const row of legacyEventLeads ?? []) {
    if (row.event_id) {
      const set = eventLeadSets.get(row.event_id) ?? new Set<string>();
      set.add(row.id);
      eventLeadSets.set(row.event_id, set);
    }
  }

  const events: LeadEvent[] = ((eventsData ?? []) as LeadEvent[]).map((e) => ({
    ...e,
    lead_count: eventLeadSets.get(e.id)?.size ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[#1c2024]">Event Leads</h1>
            <span className="rounded-full bg-cyan-100 px-3 py-0.5 text-xs font-semibold text-[#0a2a2c]">
              Total {events.length} {events.length === 1 ? "Event" : "Events"}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Events and exhibitions management. Click an event to view its New Leads, All Leads, and Active Leads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddEventModal />
          <RemoveAllEventsButton count={events.length} />
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
          <p className="text-gray-500">No events yet. Click &quot;+ Add Event&quot; to create one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
