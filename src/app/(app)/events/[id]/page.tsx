import { notFound } from "next/navigation";
import { requireUser } from "@/lib/data";
import LeadsSection, { type LeadsSectionSearchParams } from "@/components/leads-section";
import { BackLink } from "@/components/back-button";
import type { LeadEvent } from "@/lib/supabase/types";

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<LeadsSectionSearchParams>;
}) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();
  if (!event) notFound();
  const typedEvent = event as LeadEvent;

  return (
    <div className="space-y-4">
      <BackLink href="/events" label="Back to Events" />
      <LeadsSection
        searchParams={searchParams}
        basePath={`/events/${id}`}
        heading={typedEvent.name}
        description={`${typedEvent.start_date}${typedEvent.end_date ? ` – ${typedEvent.end_date}` : ""}`}
        showSourceColumn={false}
        tabs={["all", "active"]}
        eventId={id}
      />
    </div>
  );
}
