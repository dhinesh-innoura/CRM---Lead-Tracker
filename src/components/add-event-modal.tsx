"use client";

import { useState } from "react";
import Modal from "@/components/modal";
import { createEvent } from "@/lib/event-actions";

export default function AddEventModal() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        + Add Event
      </button>

      {open && (
        <Modal
          title="Create Event"
          description="Enter the event details, location, dates, and description."
          onClose={() => setOpen(false)}
        >
          <form
            action={(formData) => {
              setSaving(true);
              createEvent(formData);
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Event Name</label>
              <input
                name="name"
                required
                autoFocus
                placeholder="e.g. Safety & Security Asia Expo 2026"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Location</label>
              <input
                name="location"
                placeholder="e.g. Marina Bay Sands, Singapore"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">End Date</label>
                <input
                  type="date"
                  name="end_date"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Event focus, target industries, objectives..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create Event"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
