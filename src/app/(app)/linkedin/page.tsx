"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

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

  // Load initial data – placeholder implementation
  useEffect(() => {
    // TODO: replace with real Supabase fetch
    // For demonstration we start with empty data
    setTotalCount(0);
    setAcceptedCount(0);
    setDailyStats({});
    setTrackingRows([]);
  }, []);

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
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Company</th>
                <th className="px-4 py-2">Person(s)</th>
                <th className="px-4 py-2">Profile URL</th>
                <th className="px-4 py-2">Status</th>
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
                </tr>
              ))}
              {trackingRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No tracking data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
