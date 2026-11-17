import Link from "next/link";
import { SOURCE_LABELS, type Lead } from "@/lib/supabase/types";
import EditableCell from "@/components/editable-cell";
import StatusSelect from "@/components/status-select";
import HoldReasonIcon from "@/components/hold-reason-icon";
import ActiveToggleButton from "@/components/active-toggle-button";

export default function LeadCell({ lead, columnKey }: { lead: Lead; columnKey: string }) {
  if (columnKey.startsWith("custom:")) {
    const fieldKey = columnKey.slice("custom:".length);
    return <EditableCell leadId={lead.id} fieldKey={fieldKey} initialValue={lead.custom_fields?.[fieldKey] ?? ""} />;
  }

  switch (columnKey) {
    case "company":
      return (
        <>
          <Link href={`/leads/${lead.id}`} className="font-medium text-[#1c2024] hover:text-[var(--brand)]">
            {lead.company_name}
          </Link>
          {lead.company_website && (
            <a
              href={lead.company_website}
              target="_blank"
              className="block truncate text-xs text-cyan-600 hover:underline"
            >
              {lead.company_website}
            </a>
          )}
        </>
      );
    case "about_company":
      return <span className="line-clamp-2 text-xs text-gray-600">{lead.about_company || lead.company_description || "—"}</span>;
    case "contact":
      return (
        <>
          <p className="text-gray-700">{lead.contact_name || "—"}</p>
          {lead.contact_linkedin_url && (
            <a
              href={lead.contact_linkedin_url}
              target="_blank"
              className="block truncate text-xs text-cyan-600 hover:underline"
            >
              LinkedIn
            </a>
          )}
        </>
      );
    case "about_person":
      return <span className="line-clamp-2 text-xs text-gray-600">{lead.about_person || "—"}</span>;
    case "source":
      return (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
          {SOURCE_LABELS[lead.source] ?? lead.source}
        </span>
      );
    case "solutions":
      return <span className="text-gray-600">{lead.solutions || "—"}</span>;
    case "products":
      return <span className="text-gray-600">{lead.products || "—"}</span>;
    case "ai_synergy":
      return <span className="line-clamp-2 text-xs text-gray-600">{lead.ai_synergy || lead.potential_opportunity || "—"}</span>;
    case "status":
      return (
        <div className="flex items-center">
          <StatusSelect leadId={lead.id} status={lead.status} />
          {lead.status === "on_hold" && <HoldReasonIcon leadId={lead.id} reason={lead.hold_reason} />}
        </div>
      );
    case "applications":
      return <span className="text-gray-600">{lead.applications || "—"}</span>;
    case "partners":
      return <span className="text-gray-600">{lead.partners || "—"}</span>;
    case "annual_revenue":
      return <span className="text-gray-600">{lead.annual_revenue || "—"}</span>;
    case "action":
      return <ActiveToggleButton leadId={lead.id} isActive={lead.is_active_lead} />;
    default:
      return <span className="text-gray-400">—</span>;
  }
}
