import LeadsSection, { type LeadsSectionSearchParams } from "@/components/leads-section";

export default async function AssignedLeadsPage({
  searchParams,
}: {
  searchParams: Promise<LeadsSectionSearchParams>;
}) {
  return (
    <LeadsSection
      searchParams={searchParams}
      basePath="/leads/sir-given"
      heading="Assigned Leads"
      description="Leads assigned to you for outreach, follow-up, and conversion."
      showSourceColumn={true}
      tabs={["all", "active"]}
      viewMode="assigned"
    />
  );
}
