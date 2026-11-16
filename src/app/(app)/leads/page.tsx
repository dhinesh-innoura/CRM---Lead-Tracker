import Link from "next/link";
import { Suspense } from "react";
import { requireUser, getProfiles } from "@/lib/data";
import LeadsTable from "@/components/leads-table";
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
  type SavedFilter,
} from "@/lib/supabase/types";

type SearchParams = {
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

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { supabase, user } = await requireUser();
  const profiles = await getProfiles();
  const sp = await searchParams;
  const { q, status, source, priority, assigned_to, from, to, sort } = sp;
  const tab = sp.tab === "all" ? "all" : "new";

  const today = new Date().toISOString().slice(0, 10);
  const todayStart = `${today}T00:00:00.000Z`;

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
  const columns = mergeColumnPrefs((prefRow?.columns as ColumnPref[]) ?? [], fieldDefs);

  const { data: newLeadsData } = await supabase
    .from("leads")
    .select("*")
    .gte("created_at", todayStart)
    .order("created_at", { ascending: false });

  let query = supabase.from("leads").select("*").lt("created_at", todayStart);

  if (status) query = query.eq("status", status);
  if (source) query = query.eq("source", source);
  if (priority) query = query.eq("priority", priority);
  if (assigned_to) query = query.eq("assigned_to", assigned_to);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);
  if (q) query = query.or(`company_name.ilike.%${q}%,contact_name.ilike.%${q}%,contact_email.ilike.%${q}%`);

  if (sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (sort === "follow_up") query = query.order("next_follow_up_date", { ascending: true, nullsFirst: false });
  else query = query.order("created_at", { ascending: false });

  const { data: allLeadsData } = await query;

  const { data: savedFilters } = await supabase
    .from("saved_filters")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (status) exportParams.set("status", status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1c2024]">Leads</h1>
          <p className="text-sm text-gray-500">Central database of every lead in the pipeline.</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/export/template"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Download Mock Excel
          </a>
          <a
            href={`/api/export/leads?${exportParams.toString()}`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Export List
          </a>
          <ImportModal fieldDefs={fieldDefs} />
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex gap-1">
          <Link
            href="/leads?tab=new"
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab === "new" ? "border-[var(--brand)] text-[#1c2024]" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            New Leads ({newLeadsData?.length ?? 0})
          </Link>
          <Link
            href="/leads?tab=all"
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab === "all" ? "border-[var(--brand)] text-[#1c2024]" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            All Leads ({allLeadsData?.length ?? 0})
          </Link>
        </div>
        <div className="flex gap-2">
          <AddColumnForm />
          <ColumnCustomizer columns={columns} fieldDefs={fieldDefs} />
        </div>
      </div>

      {tab === "new" ? (
        <LeadsTable leads={(newLeadsData ?? []) as Lead[]} columns={columns} />
      ) : (
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
                <select name="source" defaultValue={source ?? ""} className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
                  <option value="">All sources</option>
                  {LEAD_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
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

          <LeadsTableBulk leads={(allLeadsData ?? []) as Lead[]} profiles={profiles} columns={columns} />
        </div>
      )}
    </div>
  );
}
