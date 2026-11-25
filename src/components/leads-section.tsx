import Link from "next/link";
import { Suspense } from "react";
import { requireUser, getProfiles, getAllProfilesMap } from "@/lib/data";
import LeadsTableBulk from "@/components/leads-table-bulk";
import SaveFilterForm from "@/components/save-filter-form";
import SavedFilterChip from "@/components/saved-filter-chip";
import AddColumnForm from "@/components/add-column-form";
import ColumnCustomizer from "@/components/column-customizer";
import ImportModal from "@/components/import-modal";
import AddLeadModal from "@/components/add-lead-modal";
import FiltersPanel from "@/components/filters-panel";
import { mergeColumnPrefs, type ColumnPref } from "@/lib/lead-columns";
import {
  ACTIVE_PIPELINE_STATUSES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  STATUS_LABELS,
  type Lead,
  type LeadFieldDef,
  type LeadSource,
  type SavedFilter,
} from "@/lib/supabase/types";

export type LeadsSectionSearchParams = {
  tab?: string;
  q?: string;
  status?: string;
  country?: string;
  industry?: string;
  source?: string;
  priority?: string;
  assigned_to?: string;
  from?: string;
  to?: string;
  sort?: string;
};

type TabKey = "new" | "all" | "active";

const TAB_LABELS: Record<TabKey, string> = {
  new: "New Leads",
  all: "All Leads",
  active: "Active Leads",
};

export default async function LeadsSection({
  searchParams,
  basePath,
  heading,
  description,
  showSourceColumn,
  tabs,
  sourceFilter,
  eventId,
  viewMode = "all",
}: {
  searchParams: Promise<LeadsSectionSearchParams>;
  basePath: string;
  heading: string;
  description: string;
  showSourceColumn: boolean;
  tabs: TabKey[];
  sourceFilter?: LeadSource[];
  eventId?: string;
  viewMode?: "own" | "assigned" | "event" | "all";
}) {
  const { supabase, user } = await requireUser();
  const profiles = await getProfiles();
  const sp = await searchParams;
  const { q, status, country, industry, source, priority, assigned_to, from, to, sort } = sp;
  const tab = tabs.includes(sp.tab as TabKey) ? (sp.tab as TabKey) : tabs[0];
  const allTabLabel = tabs.includes("new") ? "All Leads" : "Leads";

  // If viewing an event, fetch all linked lead IDs from event_leads
  let eventLeadIds: string[] = [];
  if (eventId || viewMode === "event") {
    const targetEventId = eventId;
    if (targetEventId) {
      const { data: elRows } = await supabase
        .from("event_leads")
        .select("lead_id")
        .eq("event_id", targetEventId);
      eventLeadIds = (elRows ?? []).map((r) => r.lead_id);
    }
  }

  // Scoping helper to filter master leads based on section logic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function scoped(query: any): any {
    let q2 = query;

    if (viewMode === "own") {
      // Own Leads: owner_id equals logged in user (with fallback to created_by for legacy records)
      q2 = q2.or(`owner_id.eq.${user.id},and(owner_id.is.null,created_by.eq.${user.id})`);
    } else if (viewMode === "assigned") {
      // Assigned Leads: assigned_to equals logged in user
      q2 = q2.eq("assigned_to", user.id);
    } else if (viewMode === "event" || eventId) {
      // Event Leads: connected through event_leads relationship table or legacy event_id
      if (eventLeadIds.length > 0) {
        q2 = q2.or(`event_id.eq.${eventId},id.in.(${eventLeadIds.join(",")})`);
      } else if (eventId) {
        q2 = q2.eq("event_id", eventId);
      }
    }

    if (sourceFilter && sourceFilter.length > 0) {
      q2 = q2.in("source", sourceFilter);
    }

    return q2;
  }

  const { data: fieldDefsData } = await supabase
    .from("lead_field_defs")
    .select("*")
    .order("position", { ascending: true });
  const fieldDefs = (fieldDefsData ?? []) as LeadFieldDef[];

  const { data: prefRow } = await supabase
    .from("lead_table_prefs")
    .select("columns")
    .eq("owner_id", user.id)
    .maybeSingle();
  const columns = mergeColumnPrefs((prefRow?.columns as ColumnPref[]) ?? [], fieldDefs).filter(
    (c) => showSourceColumn || c.key !== "source"
  );

  // Accurate tab counts for New Leads, All Leads, and Active Leads
  const [newCountRes, allCountRes, activeCountRes] = await Promise.all([
    tabs.includes("new")
      ? scoped(supabase.from("leads").select("id", { count: "exact", head: true })).is("status", null)
      : Promise.resolve({ count: 0 }),
    scoped(supabase.from("leads").select("id", { count: "exact", head: true })),
    scoped(supabase.from("leads").select("id", { count: "exact", head: true })).or(
      `is_active_lead.eq.true,status.in.(${ACTIVE_PIPELINE_STATUSES.join(",")})`
    ),
  ]);

  const newCount = newCountRes.count ?? 0;
  const allCount = allCountRes.count ?? 0;
  const activeCount = activeCountRes.count ?? 0;

  // Build query for the currently active tab
  let currentTabQuery = scoped(supabase.from("leads").select("*"));
  if (tab === "new") {
    currentTabQuery = currentTabQuery.is("status", null);
  } else if (tab === "active") {
    currentTabQuery = currentTabQuery.or(
      `is_active_lead.eq.true,status.in.(${ACTIVE_PIPELINE_STATUSES.join(",")})`
    );
  }

  // Apply search and global filters
  if (q) {
    currentTabQuery = currentTabQuery.or(
      `company_name.ilike.%${q}%,contact_name.ilike.%${q}%,contact_email.ilike.%${q}%,country.ilike.%${q}%,industry.ilike.%${q}%`
    );
  }
  if (status) currentTabQuery = currentTabQuery.eq("status", status);
  if (country) currentTabQuery = currentTabQuery.ilike("country", `%${country}%`);
  if (industry) currentTabQuery = currentTabQuery.ilike("industry", `%${industry}%`);
  if (source) currentTabQuery = currentTabQuery.eq("source", source);
  if (priority) currentTabQuery = currentTabQuery.eq("priority", priority);

  if (assigned_to) {
    if (assigned_to === "unassigned") {
      currentTabQuery = currentTabQuery.is("assigned_to", null);
    } else {
      const selectedProfile = profiles.find((p) => p.id === assigned_to);
      const allProfilesMap = await getAllProfilesMap();
      const matchingIds: string[] = [];
      if (selectedProfile) {
        for (const [id, name] of allProfilesMap.entries()) {
          if (name.toLowerCase().trim() === selectedProfile.full_name.toLowerCase().trim()) {
            matchingIds.push(id);
          }
        }
      }
      if (matchingIds.length > 1) {
        currentTabQuery = currentTabQuery.in("assigned_to", matchingIds);
      } else {
        currentTabQuery = currentTabQuery.eq("assigned_to", assigned_to);
      }
    }
  }

  if (from) currentTabQuery = currentTabQuery.gte("created_at", from);
  if (to) currentTabQuery = currentTabQuery.lte("created_at", to);

  if (sort === "oldest") currentTabQuery = currentTabQuery.order("created_at", { ascending: true });
  else if (sort === "follow_up")
    currentTabQuery = currentTabQuery.order("next_follow_up_date", { ascending: true, nullsFirst: false });
  else currentTabQuery = currentTabQuery.order("created_at", { ascending: false });

  const { data: leadsData } = await currentTabQuery;
  const leads = (leadsData ?? []) as Lead[];

  const { data: savedFilters } = await supabase
    .from("saved_filters")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const exportIds = leads.map((l) => l.id).join(",");

  const hasActiveFilters = Boolean(
    q || status || country || industry || source || priority || assigned_to || from || to || sort
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#1c2024]">{heading}</h1>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map((t) => {
            const count = t === "new" ? newCount : t === "active" ? activeCount : allCount;
            const label = t === "all" ? allTabLabel : TAB_LABELS[t];
            return (
              <Link
                key={t}
                href={`${basePath}?tab=${t}`}
                className={`border-b-2 px-4 py-2 text-sm font-medium ${
                  tab === t
                    ? "border-[var(--brand)] text-[#1c2024]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {label} ({count})
              </Link>
            );
          })}
        </div>
        <div className="flex gap-2">
          <AddColumnForm />
          <ColumnCustomizer columns={columns} fieldDefs={fieldDefs} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <AddLeadModal fieldDefs={fieldDefs} eventId={eventId} defaultSource={sourceFilter?.[0]} />
        <ImportModal fieldDefs={fieldDefs} eventId={eventId} defaultSource={sourceFilter?.[0]} />
        <a
          href={`/api/export/leads?ids=${exportIds}`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Export {tab === "all" ? allTabLabel : TAB_LABELS[tab]}
        </a>
      </div>

      <div className="space-y-3">
        <FiltersPanel hasActiveFilters={hasActiveFilters}>
          <div className="space-y-3">
            {savedFilters && savedFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(savedFilters as SavedFilter[]).map((f) => (
                  <SavedFilterChip key={f.id} filter={f} />
                ))}
              </div>
            )}

            <form className="grid grid-cols-2 gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:grid-cols-4 lg:grid-cols-8">
              <input type="hidden" name="tab" value={tab} />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search company, contact, email..."
                className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] lg:col-span-2"
              />
              <select
                name="status"
                defaultValue={status ?? ""}
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
              >
                <option value="">All statuses</option>
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="country"
                defaultValue={country}
                placeholder="Country..."
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
              />
              <input
                type="text"
                name="industry"
                defaultValue={industry}
                placeholder="Industry..."
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
              />
              {showSourceColumn && (
                <select
                  name="source"
                  defaultValue={source ?? ""}
                  className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
                >
                  <option value="">All sources</option>
                  {LEAD_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              )}
              <select
                name="priority"
                defaultValue={priority ?? ""}
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
              >
                <option value="">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                name="assigned_to"
                defaultValue={assigned_to ?? ""}
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
              >
                <option value="">Anyone</option>
                <option value="unassigned">Unassigned</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
              <select
                name="sort"
                defaultValue={sort ?? ""}
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
              >
                <option value="">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="follow_up">Upcoming follow-up</option>
              </select>
              <input
                type="date"
                name="from"
                defaultValue={from}
                title="Created from"
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
              />
              <input
                type="date"
                name="to"
                defaultValue={to}
                title="Created to"
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
              />
              <button className="col-span-2 rounded-lg bg-[var(--sidebar)] px-4 py-2 text-sm font-medium text-white hover:bg-black lg:col-span-1">
                Apply
              </button>
            </form>

            <Suspense fallback={null}>
              <SaveFilterForm />
            </Suspense>
          </div>
        </FiltersPanel>

        <LeadsTableBulk leads={leads} columns={columns} />
      </div>
    </div>
  );
}
