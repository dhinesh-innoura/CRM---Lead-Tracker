"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { importLeads, type ImportResult } from "@/lib/import-actions";
import type { LeadFieldDef, LeadSource } from "@/lib/supabase/types";

const FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: "company_name", label: "Company", required: true },
  { key: "company_website", label: "Website URL" },
  { key: "country", label: "Country" },
  { key: "industry", label: "Industry" },
  { key: "about_company", label: "About Company" },
  { key: "outreach_date", label: "Outreach Date" },
  { key: "last_outreach_date", label: "Last Outreach Date" },
  { key: "contact_name", label: "Contact Person" },
  { key: "contact_linkedin_url", label: "LinkedIn URL" },
  { key: "about_person", label: "About Person" },
  { key: "source", label: "Source" },
  { key: "solutions", label: "Solutions" },
  { key: "products", label: "Products" },
  { key: "ai_synergy", label: "AiVision360 Synergy" },
  { key: "status", label: "Status" },
  { key: "applications", label: "Applications" },
  { key: "partners", label: "Partners" },
  { key: "annual_revenue", label: "Annual Revenue" },
  { key: "contact_email", label: "Business Email (for duplicate detection)" },
  { key: "priority", label: "Priority" },
  { key: "notes", label: "Notes" },
];

function guessMapping(headers: string[]) {
  const mapping: Record<string, string> = {};
  const usedHeaders = new Set<string>();
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

  for (const field of FIELDS) {
    // Match against the human-readable label first (that's what our own
    // template/table headers actually are — e.g. "Contact Person", not
    // "contact_name"), falling back to the field key for other files.
    const labelNorm = normalize(field.label);
    const keyNorm = normalize(field.key);
    const available = headers.filter((h) => !usedHeaders.has(h));

    // Prefer an exact normalized match; only fall back to a substring match
    // (and only against a reasonably long header) so a short/ambiguous
    // header like "Company" can't also get claimed by "Company Website".
    const exact = available.find((h) => {
      const hNorm = normalize(h);
      return hNorm === labelNorm || hNorm === keyNorm;
    });
    const match =
      exact ??
      available.find((h) => {
        const hNorm = normalize(h);
        return (
          hNorm.length >= 4 &&
          (hNorm.includes(labelNorm) || labelNorm.includes(hNorm) || hNorm.includes(keyNorm) || keyNorm.includes(hNorm))
        );
      });

    if (match) {
      mapping[field.key] = match;
      usedHeaders.add(match);
    }
  }
  return mapping;
}

export default function ImportClient({
  fieldDefs = [],
  defaultSource,
  defaultStatus,
  eventId,
  assignToSelf,
  onImported,
}: {
  fieldDefs?: LeadFieldDef[];
  defaultSource?: LeadSource;
  defaultStatus?: string;
  eventId?: string;
  assignToSelf?: boolean;
  onImported?: () => void;
}) {
  const router = useRouter();
  const allFields: { key: string; label: string; required?: boolean }[] = [
    ...FIELDS.filter((f) => !(defaultSource && f.key === "source")),
    ...fieldDefs.map((f) => ({ key: `custom:${f.key}`, label: f.label, required: false })),
  ];

  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [onDuplicate, setOnDuplicate] = useState<"skip" | "update">("skip");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

    const hdrs = json.length > 0 ? Object.keys(json[0]) : [];
    setHeaders(hdrs);
    setRows(json.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v)]))));
    setMapping(guessMapping(hdrs));
  }

  async function handleImport() {
    setImporting(true);
    try {
      const res = await importLeads(fileName, mapping, rows, onDuplicate, {
        defaultSource,
        defaultStatus,
        eventId,
        assignToSelf,
      });
      setResult(res);
      router.refresh();
      if (res.errorRows === 0) {
        onImported?.();
      }
    } finally {
      setImporting(false);
    }
  }

  function removeAllRows() {
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-3 text-sm font-semibold text-[#1c2024]">1. Upload Excel / CSV</h2>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFile}
          className="text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--brand)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        />
        {rows.length > 0 && (
          <p className="mt-2 text-sm text-gray-500">
            {fileName} — {rows.length} rows detected.
          </p>
        )}
      </section>

      {headers.length > 0 && (
        <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-3 text-sm font-semibold text-[#1c2024]">2. Map Columns</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {allFields.map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </label>
                <select
                  value={mapping[f.key] ?? ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                >
                  <option value="">— Not mapped —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      )}

      {rows.length > 0 && (
        <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1c2024]">3. Preview ({rows.length} rows)</h2>
            <button
              onClick={removeAllRows}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Remove All
            </button>
          </div>
          <div className="max-h-[50vh] overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-white text-gray-500">
                <tr>
                  {allFields.filter((f) => mapping[f.key]).map((f) => (
                    <th key={f.key} className="px-2 py-1">
                      {f.label}
                    </th>
                  ))}
                  <th className="px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    {allFields.filter((f) => mapping[f.key]).map((f) => (
                      <td key={f.key} className="px-2 py-1 text-gray-700">
                        {r[mapping[f.key]]}
                      </td>
                    ))}
                    <td className="px-2 py-1">
                      <button
                        onClick={() => removeRow(i)}
                        className="text-xs font-medium text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <label className="text-sm text-gray-600">On duplicate (matched by company name or email):</label>
            <select
              value={onDuplicate}
              onChange={(e) => setOnDuplicate(e.target.value as "skip" | "update")}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="skip">Skip duplicates</option>
              <option value="update">Update existing record</option>
            </select>
            <button
              onClick={handleImport}
              disabled={importing || !mapping.company_name}
              className="ml-auto rounded-lg bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {importing ? "Importing..." : `Import ${rows.length} Rows`}
            </button>
          </div>
        </section>
      )}

      {result && (
        <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-3 text-sm font-semibold text-[#1c2024]">Import Result</h2>
          <div className="flex gap-6 text-sm">
            <p>
              <span className="font-semibold text-green-600">{result.importedRows}</span> imported
            </p>
            <p>
              <span className="font-semibold text-amber-600">{result.skippedRows}</span> skipped
            </p>
            <p>
              <span className="font-semibold text-red-600">{result.errorRows}</span> errors
            </p>
          </div>
          {result.errors.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-red-600">
              {result.errors.map((e, i) => (
                <li key={i}>
                  Row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
