import LeadsSection, { type LeadsSectionSearchParams } from "@/components/leads-section";

export default async function OwnLeadsPage({
  searchParams,
}: {
  searchParams: Promise<LeadsSectionSearchParams>;
}) {
  return (
    <LeadsSection
      searchParams={searchParams}
      basePath="/leads"
      heading="Own Leads"
      description="Leads sourced directly by the team (LinkedIn, AI)."
      showSourceColumn={false}
      tabs={["new", "all", "active"]}
      sourceFilter={["linkedin", "ai"]}
    />
  );
}
