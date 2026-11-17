import { requireUser } from "@/lib/data";
import AddEventModal from "@/components/add-event-modal";
import EventCard from "@/components/event-card";
import type { LeadEvent } from "@/lib/supabase/types";

export default async function EventsPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("events").select("*").order("start_date", { ascending: false });
  const events = (data ?? []) as LeadEvent[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1c2024]">Event Leads</h1>
          <p className="text-sm text-gray-500">Leads collected from events and exhibitions.</p>
        </div>
        <AddEventModal />
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
          <p className="text-gray-500">No events yet. Click &quot;+ Add Event&quot; to create one.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
