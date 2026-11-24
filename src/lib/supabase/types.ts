export type UserRole = "bdo";

export type LeadStatus =
  | "new"
  | "outreach_initiated"
  | "contacted"
  | "follow_up"
  | "interested"
  | "meeting_scheduled"
  | "response_received"
  | "no_response"
  | "meeting_completed"
  | "demo_scheduled"
  | "demo_completed"
  | "proposal_sent"
  | "negotiation"
  | "successfully_converted"
  | "meeting_rescheduled"
  | "on_hold";

export type LeadPriority = "high" | "medium" | "low";

export type LeadSource =
  | "linkedin"
  | "prem_sir"
  | "ai"
  | "own"
  | "event_exhibition"
  | "self_sourced_linkedin"
  | "self_sourced_website"
  | "management_assigned"
  | "partner_referral"
  | "existing_contact"
  | "inbound_enquiry"
  | "other";

export type ResponseChannel = "email" | "linkedin" | "phone" | "meeting" | "other";

export type ResponseOutcome =
  | "interested"
  | "requested_more_info"
  | "requested_demo"
  | "meeting_proposed"
  | "meeting_confirmed"
  | "follow_up_later"
  | "not_interested"
  | "referred_to_another_contact"
  | "other";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  lead_code: string;
  company_name: string;
  company_website: string | null;
  industry: string | null;
  country: string | null;
  location: string | null;
  company_description: string | null;
  products_and_solutions: string | null;
  potential_opportunity: string | null;
  about_company: string | null;
  about_person: string | null;
  solutions: string | null;
  products: string | null;
  ai_synergy: string | null;
  applications: string | null;
  partners: string | null;
  annual_revenue: string | null;
  custom_fields: Record<string, string>;
  contact_name: string | null;
  contact_title: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_linkedin_url: string | null;
  source: LeadSource;
  source_details: string | null;
  owner_id: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  priority: LeadPriority;
  status: LeadStatus | null;
  last_contacted_at: string | null;
  next_follow_up_date: string | null;
  notes: string | null;
  response_text: string | null;
  response_date: string | null;
  hold_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  import_batch_id: string | null;
  is_active_lead: boolean;
  event_id: string | null;
}

export interface LeadFieldDef {
  id: string;
  key: string;
  label: string;
  position: number;
  created_by: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  type: string;
  actor_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  due_date: string;
  status: "pending" | "completed" | "cancelled";
  created_reason: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Meeting {
  id: string;
  lead_id: string;
  meeting_date: string;
  meeting_time: string | null;
  platform_or_location: string | null;
  meeting_url: string | null;
  participants: string | null;
  objective: string | null;
  notes: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  recipient_id: string;
  type: string;
  lead_id: string | null;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ImportBatch {
  id: string;
  file_name: string;
  imported_by: string | null;
  total_rows: number;
  imported_rows: number;
  skipped_rows: number;
  error_rows: number;
  column_mapping: Record<string, string>;
  errors: unknown[];
  created_at: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  owner_id: string;
  query: Record<string, string>;
  created_at: string;
}

export interface LeadEvent {
  id: string;
  name: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  lead_count?: number;
}

export interface EventLead {
  id: string;
  event_id: string;
  lead_id: string;
  created_at: string;
}

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "outreach_initiated",
  "follow_up",
  "interested",
  "meeting_scheduled",
  "meeting_completed",
  "demo_scheduled",
  "demo_completed",
  "proposal_sent",
  "negotiation",
  "response_received",
  "no_response",
  "meeting_rescheduled",
  "on_hold",
  "successfully_converted",
];

// Active pipeline statuses (for Active Leads tabs in Own Leads, Assigned Leads, and Event Leads)
export const ACTIVE_PIPELINE_STATUSES: LeadStatus[] = [
  "contacted",
  "interested",
  "meeting_scheduled",
  "meeting_completed",
  "demo_scheduled",
  "demo_completed",
  "proposal_sent",
  "negotiation",
  "outreach_initiated",
  "follow_up",
  "response_received",
];

// Statuses that need a structured modal before committing, rather than a
// plain inline status change.
export const STATUSES_REQUIRING_DETAILS: LeadStatus[] = [
  "meeting_scheduled",
  "meeting_rescheduled",
  "response_received",
  "on_hold",
];

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "prem_sir", label: "Prem Sir" },
  { value: "ai", label: "AI" },
  { value: "event_exhibition", label: "Event / Exhibition" },
  { value: "own", label: "Own" },
  { value: "other", label: "Other" },
];

export const SOURCE_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  prem_sir: "Prem Sir",
  ai: "AI",
  own: "Own",
  event_exhibition: "Event / Exhibition",
  self_sourced_linkedin: "Self-Sourced – LinkedIn",
  self_sourced_website: "Self-Sourced – Company Website",
  management_assigned: "Management Assigned",
  partner_referral: "Partner Referral",
  existing_contact: "Existing Contact",
  inbound_enquiry: "Inbound Enquiry",
  other: "Other",
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  outreach_initiated: "Outreach Initiated",
  follow_up: "Follow Up",
  interested: "Interested",
  meeting_scheduled: "Meeting Scheduled",
  meeting_completed: "Meeting Completed",
  demo_scheduled: "Demo Scheduled",
  demo_completed: "Demo Completed",
  proposal_sent: "Proposal Sent",
  negotiation: "Negotiation",
  response_received: "Response Received",
  no_response: "No Response",
  successfully_converted: "Successfully Converted",
  meeting_rescheduled: "Meeting Rescheduled",
  on_hold: "On Hold",
};
