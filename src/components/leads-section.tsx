import Link from "next/link";
import { Suspense } from "react";
import { requireUser, getProfiles } from "@/lib/data";
import LeadsTableBulk from "@/components/leads-table-bulk";
import SaveFilterForm from "@/components/save-filter-form";
import SavedFilterChip from "@/components/saved-filter-chip";
import AddColumnForm from "@/components/add-column-form";
import ColumnCustomizer from "@/components/column-customizer";
import ImportModal from "@/components/import-modal";
import FiltersPanel from "@/components/filters-panel";
import { mergeColumnPrefs, type ColumnPref } from "@/lib/lead-columns";
import {
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
}: {
  searchParams: Promise<LeadsSectionSearchParams>;
  basePath: string;
  heading: string;
  description: string;
  showSourceColumn: boolean;
  tabs: TabKey[];
  sourceFilter?: LeadSource[];
  eventId?: string;
}) {
  const { supabase, user } = await requireUser();
  const profiles = await getProfiles();
  const sp = await searchParams;
  const { q, status, source, priority, assigned_to, from, to, sort } = sp;
  const tab = tabs.includes(sp.tab as TabKey) ? (sp.tab as TabKey) : tabs[0];
  const hasNewTab = tabs.includes("new");
  const allTabLabel = hasNewTab ? "All Leads" : "Leads";

  const today = new Date().toISOString().slice(0, 10);
  const todayStart = `${today}T00:00:00.000Z`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function scoped(query: any): any {
    let q2 = query;
    if (sourceFilter && sourceFilter.length > 0) q2 = q2.in("source", sourceFilter);
    if (eventId) q2 = q2.eq("event_id", eventId);
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

  let newLeadsData: Lead[] = [];
  if (hasNewTab) {
    const { data } = await scoped(supabase.from("leads").select("*"))
      .gte("created_at", todayStart)
      .order("created_at", { ascending: false });
    newLeadsData = (data ?? []) as Lead[];
  }

  let allQuery = scoped(supabase.from("leads").select("*"));
  if (hasNewTab) allQuery = allQuery.lt("created_at", todayStart);

  if (status) allQuery = allQuery.eq("status", status);
  if (source) allQuery = allQuery.eq("source", source);
  if (priority) allQuery = allQuery.eq("priority", priority);
  if (assigned_to) allQuery = allQuery.eq("assigned_to", assigned_to);
  if (from) allQuery = allQuery.gte("created_at", from);
  if (to) allQuery = allQuery.lte("created_at", to);
  if (q) allQuery = allQuery.or(`company_name.ilike.%${q}%,contact_name.ilike.%${q}%,contact_email.ilike.%${q}%`);

  if (sort === "oldest") allQuery = allQuery.order("created_at", { ascending: true });
  else if (sort === "follow_up") allQuery = allQuery.order("next_follow_up_date", { ascending: true, nullsFirst: false });
  else allQuery = allQuery.order("created_at", { ascending: false });

  const { data: allLeadsData } = await allQuery;

  const { data: activeLeadsData } = await scoped(supabase.from("leads").select("*"))
    .eq("is_active_lead", true)
    .order("updated_at", { ascending: false });

  const { data: savedFilters } = await supabase
    .from("saved_filters")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const newIds = newLeadsData.map((l) => l.id).join(",");
  const allIds = ((allLeadsData ?? []) as Lead[]).map((l) => l.id).join(",");
  const activeIds = ((activeLeadsData ?? []) as Lead[]).map((l) => l.id).join(",");

  const exportIds = tab === "new" ? newIds : tab === "active" ? activeIds : allIds;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#1c2024]">{heading}</h1>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <Link
              key={t}
              href={`${basePath}?tab=${t}`}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${
                tab === t ? "border-[var(--brand)] text-[#1c2024]" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t === "all" ? allTabLabel : TAB_LABELS[t]} (
              {t === "new" ? newLeadsData.length : t === "active" ? activeLeadsData?.length ?? 0 : allLeadsData?.length ?? 0}
              )
            </Link>
          ))}
        </div>
        <div className="flex gap-2">
          <AddColumnForm />
          <ColumnCustomizer columns={columns} fieldDefs={fieldDefs} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {tab === tabs[0] && <ImportModal fieldDefs={fieldDefs} eventId={eventId} defaultSource={sourceFilter?.[0]} />}
        <a
          href={`/api/export/leads?ids=${exportIds}`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Export {tab === "all" ? allTabLabel : TAB_LABELS[tab]}
        </a>
      </div>

      {tab === "all" && (
        <div className="space-y-3">
          <FiltersPanel hasActiveFilters={Boolean(q || status || source || priority || assigned_to || from || to || sort)}>
            <div className="space-y-3">
              {savedFilters && savedFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(savedFilters as SavedFilter[]).map((f) => (
                    <SavedFilterChip key={f.id} filter={f} />
                  ))}
                </div>
              )}

              <form className="grid grid-cols-2 gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:grid-cols-4 lg:grid-cols-7">
                <input type="hidden" name="tab" value="all" />
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Search company, contact, email..."
                  className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] lg:col-span-2"
                />
                <select name="status" defaultValue={status ?? ""} className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
                  <option value="">All statuses</option>
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                {showSourceColumn && (
                  <select name="source" defaultValue={source ?? ""} className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
                    <option value="">All sources</option>
                    {LEAD_SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}
                <select name="priority" defaultValue={priority ?? ""} className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
                  <option value="">All priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select name="assigned_to" defaultValue={assigned_to ?? ""} className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
                  <option value="">Anyone</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                    </option>
                  ))}
                </select>
                <select name="sort" defaultValue={sort ?? ""} className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
                  <option value="">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="follow_up">Upcoming follow-up</option>
                </select>
                <input type="date" name="from" defaultValue={from} className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
                <input type="date" name="to" defaultValue={to} className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
                <button className="rounded-lg bg-[var(--sidebar)] px-4 py-2 text-sm font-medium text-white hover:bg-black">
                  Apply Filters
                </button>
              </form>

              <Suspense fallback={null}>
                <SaveFilterForm />
              </Suspense>
            </div>
          </FiltersPanel>

          <LeadsTableBulk leads={(allLeadsData ?? []) as Lead[]} columns={columns} />
        </div>
      )}
      {tab === "new" && <LeadsTableBulk leads={newLeadsData} columns={columns} />}
      {tab === "active" && (
        <LeadsTableBulk leads={(activeLeadsData ?? []) as Lead[]} columns={columns} />
      )}
    </div>
  );
}
