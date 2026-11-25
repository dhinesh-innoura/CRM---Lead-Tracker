"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

// Define the tab keys
type TabKey = "count" | "tracking";
const TAB_LABELS: Record<TabKey, string> = {
  count: "Count",
  tracking: "Tracking",
};

export default function LinkedinPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab') as TabKey | null;
  const tab: TabKey = tabParam ?? 'count';

  // ----- Count tab state -----
  const [totalCount, setTotalCount] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [dailyStats, setDailyStats] = useState<Record<string, { total: number; accepted: number }>>({});

  // ----- Tracking tab state -----
  type TrackingRow = {
    id: string;
    company_name: string | null;
    person_name: string | null;
    person_profile_url: string | null;
    status: string | null; // e.g., "response" or "no_response"
  };
  const [trackingRows, setTrackingRows] = useState<TrackingRow[]>([]);

  // ----- Add button handling (Tracking tab, multi-row) -----
  type DraftTrackingRow = {
    company_name: string;
    person_name: string;
    person_profile_url: string;
    status: 'response' | 'no_response';
  };
  const emptyDraftRow = (): DraftTrackingRow => ({
    company_name: '',
    person_name: '',
    person_profile_url: '',
    status: 'no_response',
  });
  const [showAddTrackingModal, setShowAddTrackingModal] = useState(false);
  const [draftRows, setDraftRows] = useState<DraftTrackingRow[]>([emptyDraftRow()]);

  const updateDraftRow = (index: number, field: keyof DraftTrackingRow, value: string) => {
    setDraftRows(prev => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };
  const addDraftRow = () => setDraftRows(prev => [...prev, emptyDraftRow()]);
  const removeDraftRow = (index: number) =>
    setDraftRows(prev => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const handleAddTrackingSave = () => {
    const newRows: TrackingRow[] = draftRows
      .filter(row => row.company_name.trim() || row.person_name.trim())
      .map(row => ({
        id: crypto.randomUUID(),
        company_name: row.company_name.trim() || null,
        person_name: row.person_name.trim() || null,
        person_profile_url: row.person_profile_url.trim() || null,
        status: row.status,
      }));
    if (newRows.length === 0) return;
    setTrackingRows(prev => [...prev, ...newRows]);
    setShowAddTrackingModal(false);
    setDraftRows([emptyDraftRow()]);
  };
  const removeTrackingRow = (id: string) => {
    setTrackingRows(prev => prev.filter(row => row.id !== id));
  };

  // ----- Add button handling (Count tab) -----
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTotal, setNewTotal] = useState('');
  const [newAccepted, setNewAccepted] = useState('');
  const handleAddSave = () => {
    const total = parseInt(newTotal, 10) || 0;
    const accepted = parseInt(newAccepted, 10) || 0;
    const date = new Date().toISOString().slice(0, 10);
    setTotalCount(prev => prev + total);
    setAcceptedCount(prev => prev + accepted);
    setDailyStats(prev => ({
      ...prev,
      [date]: {
        total: (prev[date]?.total ?? 0) + total,
        accepted: (prev[date]?.accepted ?? 0) + accepted,
      },
    }));
    setShowAddModal(false);
    setNewTotal('');
    setNewAccepted('');
  };

  // ----- Edit daily stats handling -----
  const [editDate, setEditDate] = useState<string | null>(null);
  const [editTotal, setEditTotal] = useState('');
  const [editAccepted, setEditAccepted] = useState('');
  const openEditModal = (date: string) => {
    setEditDate(date);
    const stats = dailyStats[date] || { total: 0, accepted: 0 };
    setEditTotal(String(stats.total));
    setEditAccepted(String(stats.accepted));
  };
  const handleEditSave = () => {
    if (!editDate) return;
    const total = parseInt(editTotal, 10) || 0;
    const accepted = parseInt(editAccepted, 10) || 0;
    const old = dailyStats[editDate] || { total: 0, accepted: 0 };
    // adjust overall counts
    setTotalCount(prev => prev - old.total + total);
    setAcceptedCount(prev => prev - old.accepted + accepted);
    setDailyStats(prev => ({
      ...prev,
      [editDate]: { total, accepted },
    }));
    setEditDate(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1c2024]">LinkedIn</h1>
        <p className="text-sm text-gray-500">Overview of LinkedIn connections and their tracking status.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(["count", "tracking"] as TabKey[]).map(t => (
          <Link
            key={t}
            href={`/linkedin?tab=${t}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t ? "border-[var(--brand)] text-[#1c2024]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            {TAB_LABELS[t]}
          </Link>
        ))}
      </div>

      {/* Count tab */}
      {tab === "count" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-medium text-gray-500">Total Connections</p>
              <p className="mt-1 text-2xl font-semibold text-[#1c2024]">{totalCount}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-medium text-gray-500">Accepted Connections</p>
              <p className="mt-1 text-2xl font-semibold text-[#1c2024]">{acceptedCount}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-medium text-gray-500">Pending / Other</p>
              <p className="mt-1 text-2xl font-semibold text-[#1c2024]">{Math.max(totalCount - acceptedCount, 0)}</p>
            </div>
          </div>

          {/* Add button */}
          <div className="mt-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded bg-[var(--brand)] px-4 py-2 text-white hover:bg-[var(--brand)]/90"
            >
              Add Today&#39;s Count
            </button>
          </div>

          {/* Add modal */}
          {showAddModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/30">
              <div className="bg-white rounded-xl p-6 shadow-lg w-80">
                <h3 className="mb-4 text-lg font-semibold">Add Today&#39;s Connections</h3>
                <label className="block mb-2">
                  Total Connections:
                  <input
                    type="number"
                    value={newTotal}
                    onChange={e => setNewTotal(e.target.value)}
                    className="mt-1 w-full border rounded px-2 py-1"
                  />
                </label>
                <label className="block mb-4">
                  Accepted Connections:
                  <input
                    type="number"
                    value={newAccepted}
                    onChange={e => setNewAccepted(e.target.value)}
                    className="mt-1 w-full border rounded px-2 py-1"
                  />
                </label>
                <div className="flex justify-end space-x-2">
                  <button onClick={() => setShowAddModal(false)} className="px-3 py-1 text-sm text-gray-600">Cancel</button>
                  <button onClick={handleAddSave} className="rounded bg-[var(--brand)] px-3 py-1 text-sm text-white">Save</button>
                </div>
              </div>
            </div>
          )}

          {/* Day‑wise breakdown */}
          <div className="mt-6">
            <h2 className="mb-3 text-sm font-semibold text-[#1c2024]">Daily Connections</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(dailyStats)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, stats]) => (
                  <div key={date} className="relative rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                    <p className="text-xs font-medium text-gray-500">{date}</p>
                    <p className="mt-1 text-sm text-[#1c2024]">
                      Total: {stats.total} | Accepted: {stats.accepted}
                    </p>
                    <button
                      onClick={() => openEditModal(date)}
                      className="absolute top-2 right-2 text-xs text-[var(--brand)]"
                    >
                      Edit
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Edit modal */}
          {editDate && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/30">
              <div className="bg-white rounded-xl p-6 shadow-lg w-80">
                <h3 className="mb-4 text-lg font-semibold">Edit {editDate}</h3>
                <label className="block mb-2">
                  Total Connections:
                  <input
                    type="number"
                    value={editTotal}
                    onChange={e => setEditTotal(e.target.value)}
                    className="mt-1 w-full border rounded px-2 py-1"
                  />
                </label>
                <label className="block mb-4">
                  Accepted Connections:
                  <input
                    type="number"
                    value={editAccepted}
                    onChange={e => setEditAccepted(e.target.value)}
                    className="mt-1 w-full border rounded px-2 py-1"
                  />
                </label>
                <div className="flex justify-end space-x-2">
                  <button onClick={() => setEditDate(null)} className="px-3 py-1 text-sm text-gray-600">Cancel</button>
                  <button onClick={handleEditSave} className="rounded bg-[var(--brand)] px-3 py-1 text-sm text-white">Save</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tracking tab */}
      {tab === "tracking" && (
        <>
          {/* Add button */}
          <div>
            <button
              onClick={() => setShowAddTrackingModal(true)}
              className="rounded bg-[var(--brand)] px-4 py-2 text-white hover:bg-[var(--brand)]/90"
            >
              + Add Tracking Entry
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Company</th>
                  <th className="px-4 py-2">Person(s)</th>
                  <th className="px-4 py-2">Profile URL</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trackingRows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{row.company_name ?? "-"}</td>
                    <td className="px-4 py-2">{row.person_name ?? "-"}</td>
                    <td className="px-4 py-2">
                      {row.person_profile_url ? (
                        <a href={row.person_profile_url} target="_blank" rel="noopener noreferrer" className="text-[var(--brand)] hover:underline">
                          View Profile
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {row.status === "response" ? "Response" : "No Response"}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeTrackingRow(row.id)}
                        className="text-xs text-gray-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {trackingRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No tracking data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add tracking modal */}
          {showAddTrackingModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
              <div className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-xl bg-white shadow-lg">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h3 className="text-lg font-semibold text-[#1c2024]">Add Tracking Entries</h3>
                  <p className="mt-1 text-sm text-gray-500">Add one or more rows, then save them all together.</p>
                </div>

                <div className="space-y-4 overflow-y-auto px-6 py-4">
                  {draftRows.map((row, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-[#1c2024]">Entry {i + 1}</h4>
                        {draftRows.length > 1 && (
                          <button
                            onClick={() => removeDraftRow(i)}
                            className="text-xs font-medium text-gray-400 hover:text-red-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="block text-xs font-medium text-gray-600">
                          Company
                          <input
                            type="text"
                            value={row.company_name}
                            onChange={e => updateDraftRow(i, 'company_name', e.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </label>
                        <label className="block text-xs font-medium text-gray-600">
                          Person
                          <input
                            type="text"
                            value={row.person_name}
                            onChange={e => updateDraftRow(i, 'person_name', e.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </label>
                        <label className="block text-xs font-medium text-gray-600 sm:col-span-2">
                          Profile URL
                          <input
                            type="text"
                            value={row.person_profile_url}
                            onChange={e => updateDraftRow(i, 'person_profile_url', e.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </label>
                        <label className="block text-xs font-medium text-gray-600">
                          Status
                          <select
                            value={row.status}
                            onChange={e => updateDraftRow(i, 'status', e.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          >
                            <option value="no_response">No Response</option>
                            <option value="response">Response</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addDraftRow}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  >
                    + Add Another Row
                  </button>
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
                  <button
                    onClick={() => {
                      setShowAddTrackingModal(false);
                      setDraftRows([emptyDraftRow()]);
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTrackingSave}
                    className="rounded-lg bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Save {draftRows.length > 1 ? `${draftRows.length} Entries` : 'Entry'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
