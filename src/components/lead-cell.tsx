import Link from "next/link";
import { SOURCE_LABELS, type Lead } from "@/lib/supabase/types";
import EditableCell from "@/components/editable-cell";
import LeadFieldCell from "@/components/lead-field-cell";
import StatusSelect from "@/components/status-select";
import HoldReasonIcon from "@/components/hold-reason-icon";
import ActiveToggleButton from "@/components/active-toggle-button";

export default function LeadCell({
  lead,
  columnKey,
  eventId,
}: {
  lead: Lead;
  columnKey: string;
  eventId?: string;
}) {
  if (columnKey.startsWith("custom:")) {
    const fieldKey = columnKey.slice("custom:".length);
    return <EditableCell leadId={lead.id} fieldKey={fieldKey} initialValue={lead.custom_fields?.[fieldKey] ?? ""} />;
  }

  switch (columnKey) {
    case "company":
      return (
        <div className="space-y-1">
          <Link href={`/leads/${lead.id}`} className="block text-xs text-[var(--brand)] hover:underline">
            View details →
          </Link>
          <LeadFieldCell leadId={lead.id} field="company_name" initialValue={lead.company_name ?? ""} />
        </div>
      );
    case "company_website":
      return <LeadFieldCell leadId={lead.id} field="company_website" initialValue={lead.company_website ?? ""} />;
    case "country":
      return <LeadFieldCell leadId={lead.id} field="country" initialValue={lead.country ?? ""} />;
    case "industry":
      return <LeadFieldCell leadId={lead.id} field="industry" initialValue={lead.industry ?? ""} />;
    case "about_company":
      return (
        <LeadFieldCell
          leadId={lead.id}
          field="about_company"
          initialValue={lead.about_company ?? lead.company_description ?? ""}
          multiline
        />
      );
    case "outreach_date":
      return <LeadFieldCell leadId={lead.id} field="outreach_date" initialValue={lead.outreach_date ?? ""} type="date" />;
    case "last_outreach_date":
      return (
        <LeadFieldCell leadId={lead.id} field="last_outreach_date" initialValue={lead.last_outreach_date ?? ""} type="date" />
      );
    case "contact":
      return <LeadFieldCell leadId={lead.id} field="contact_name" initialValue={lead.contact_name ?? ""} />;
    case "contact_linkedin_url":
      return (
        <LeadFieldCell leadId={lead.id} field="contact_linkedin_url" initialValue={lead.contact_linkedin_url ?? ""} />
      );
    case "contact_email":
      return <LeadFieldCell leadId={lead.id} field="contact_email" initialValue={lead.contact_email ?? ""} />;
    case "about_person":
      return <LeadFieldCell leadId={lead.id} field="about_person" initialValue={lead.about_person ?? ""} multiline />;
    case "source":
      return (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
          {SOURCE_LABELS[lead.source] ?? lead.source}
        </span>
      );
    case "solutions":
      return <LeadFieldCell leadId={lead.id} field="solutions" initialValue={lead.solutions ?? ""} />;
    case "products":
      return <LeadFieldCell leadId={lead.id} field="products" initialValue={lead.products ?? ""} />;
    case "ai_synergy":
      return (
        <LeadFieldCell
          leadId={lead.id}
          field="ai_synergy"
          initialValue={lead.ai_synergy ?? lead.potential_opportunity ?? ""}
          multiline
        />
      );
    case "status":
      return (
        <div className="flex items-center">
          <StatusSelect leadId={lead.id} status={lead.status} />
          {lead.status === "on_hold" && <HoldReasonIcon leadId={lead.id} reason={lead.hold_reason} />}
        </div>
      );
    case "applications":
      return <LeadFieldCell leadId={lead.id} field="applications" initialValue={lead.applications ?? ""} />;
    case "partners":
      return <LeadFieldCell leadId={lead.id} field="partners" initialValue={lead.partners ?? ""} />;
    case "annual_revenue":
      return <LeadFieldCell leadId={lead.id} field="annual_revenue" initialValue={lead.annual_revenue ?? ""} />;
    case "priority":
      return <LeadFieldCell leadId={lead.id} field="priority" initialValue={lead.priority ?? ""} />;
    case "notes":
      return <LeadFieldCell leadId={lead.id} field="notes" initialValue={lead.notes ?? ""} multiline />;
    case "action":
      return <ActiveToggleButton leadId={lead.id} isActive={lead.is_active_lead} eventId={eventId} />;
    default:
      return <span className="text-gray-400">—</span>;
  }
}
