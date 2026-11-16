import type { LeadFieldDef } from "@/lib/supabase/types";

export const FIXED_COLUMNS: { key: string; label: string }[] = [
  { key: "company", label: "Company" },
  { key: "about_company", label: "About Company" },
  { key: "contact", label: "Contact Person" },
  { key: "about_person", label: "About Person" },
  { key: "source", label: "Source" },
  { key: "solutions", label: "Solutions" },
  { key: "products", label: "Products" },
  { key: "ai_synergy", label: "AiVision360 Synergy" },
  { key: "status", label: "Status" },
  { key: "applications", label: "Applications" },
  { key: "partners", label: "Partners" },
  { key: "annual_revenue", label: "Annual Revenue" },
];

export interface ColumnPref {
  key: string;
  label: string;
  visible: boolean;
  custom?: boolean;
}

export function buildDefaultColumns(fieldDefs: LeadFieldDef[]): ColumnPref[] {
  return [
    ...FIXED_COLUMNS.map((c) => ({ ...c, visible: true })),
    ...fieldDefs.map((f) => ({ key: `custom:${f.key}`, label: f.label, visible: true, custom: true })),
  ];
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

  return merged;
}
