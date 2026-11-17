import LeadsSection, { type LeadsSectionSearchParams } from "@/components/leads-section";

export default async function SirGivenLeadsPage({
  searchParams,
}: {
  searchParams: Promise<LeadsSectionSearchParams>;
}) {
  return (
    <LeadsSection
      searchParams={searchParams}
      basePath="/leads/sir-given"
      heading="Assigned Leads"
      description="Leads assigned by Prem Sir."
      showSourceColumn={false}
      tabs={["new", "all", "active"]}
      sourceFilter={["prem_sir"]}
    />
  );
}
