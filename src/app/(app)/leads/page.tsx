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
      description="Leads owned by you (created or sourced directly)."
      showSourceColumn={true}
      tabs={["new", "all", "active"]}
      viewMode="own"
    />
  );
}
