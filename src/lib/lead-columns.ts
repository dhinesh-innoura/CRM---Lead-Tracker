import type { LeadFieldDef } from "@/lib/supabase/types";

// Outreach Date and Last Outreach Date must always stay visible and in 3rd/4th
// position — they're pinned (position enforced in buildDefaultColumns/
// mergeColumnPrefs) and excluded from drag/hide in the column customizer.
export const LOCKED_COLUMN_KEYS = ["outreach_date", "last_outreach_date"];

// The Action column holds the "Mark Active" button — it's not a data field,
// it's the only way to move a lead into Active Leads. It stays visible and
// un-hideable like the locked columns above, but (unlike them) keeps its
// normal position at the end of the table instead of being pinned to 3rd/4th.
const ALWAYS_VISIBLE_KEYS = ["action"];

// Columns that exist and can be turned on via Customize Columns / included in
// exports, but shouldn't clutter the table by default.
const DEFAULT_HIDDEN_KEYS = ["company_website", "country", "industry", "contact_email", "priority", "notes"];

export const FIXED_COLUMNS: { key: string; label: string; locked?: boolean }[] = [
  { key: "company", label: "Company" },
  { key: "company_website", label: "Website URL" },
  { key: "country", label: "Country" },
  { key: "industry", label: "Industry" },
  { key: "about_company", label: "About Company" },
  { key: "outreach_date", label: "Outreach Date", locked: true },
  { key: "last_outreach_date", label: "Last Outreach Date", locked: true },
  { key: "contact", label: "Contact Person" },
  { key: "contact_linkedin_url", label: "LinkedIn URL" },
  { key: "contact_email", label: "Business Email" },
  { key: "about_person", label: "About Person" },
  { key: "source", label: "Source" },
  { key: "solutions", label: "Solutions" },
  { key: "products", label: "Products" },
  { key: "ai_synergy", label: "AiVision360 Synergy" },
  { key: "status", label: "Status" },
  { key: "applications", label: "Applications" },
  { key: "partners", label: "Partners" },
  { key: "annual_revenue", label: "Annual Revenue" },
  { key: "priority", label: "Priority" },
  { key: "notes", label: "Notes" },
  { key: "action", label: "Action", locked: true },
];

const LOCKED_POSITION = 2; // 0-indexed: locked columns always land at 3rd/4th place

export interface ColumnPref {
  key: string;
  label: string;
  visible: boolean;
  custom?: boolean;
  locked?: boolean;
}

// Guarantees locked columns are always visible and sit at LOCKED_POSITION,
// regardless of what order/visibility a saved preference set claims.
function pinLockedColumns(columns: ColumnPref[]): ColumnPref[] {
  const locked = LOCKED_COLUMN_KEYS.map(
    (key) => columns.find((c) => c.key === key) ?? FIXED_COLUMNS.find((c) => c.key === key)!
  ).map((c) => ({ ...c, visible: true, locked: true }));

  const rest = columns.filter((c) => !LOCKED_COLUMN_KEYS.includes(c.key));
  rest.splice(LOCKED_POSITION, 0, ...locked);

  // Force always-visible columns back on regardless of what a saved
  // preference says — e.g. a lead hidden here previously had no other way
  // to be marked active, since this column is the only place that button
  // lives.
  return rest.map((c) =>
    ALWAYS_VISIBLE_KEYS.includes(c.key) ? { ...c, visible: true, locked: true } : c
  );
}

export function buildDefaultColumns(fieldDefs: LeadFieldDef[]): ColumnPref[] {
  return pinLockedColumns([
    ...FIXED_COLUMNS.map((c) => ({ ...c, visible: !DEFAULT_HIDDEN_KEYS.includes(c.key) })),
    ...fieldDefs.map((f) => ({ key: `custom:${f.key}`, label: f.label, visible: true, custom: true })),
  ]);
}

export function mergeColumnPrefs(saved: ColumnPref[], fieldDefs: LeadFieldDef[]): ColumnPref[] {
  const defaults = buildDefaultColumns(fieldDefs);
  const savedKeys = new Set(saved.map((c) => c.key));
  const knownKeys = new Set(defaults.map((c) => c.key));

  const merged = saved
    .filter((c) => knownKeys.has(c.key))
    .map((c) => defaults.find((d) => d.key === c.key)!
      ? { ...defaults.find((d) => d.key === c.key)!, visible: c.visible }
      : c
    );

  for (const def of defaults) {
    if (!savedKeys.has(def.key)) merged.push(def);
  }

  return pinLockedColumns(merged);
}
