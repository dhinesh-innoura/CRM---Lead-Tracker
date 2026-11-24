import { requireUser } from "@/lib/data";

import { inviteTeamMember } from "@/lib/team-actions";
import TeamRowControls from "@/components/team-row-controls";
import { getProfiles } from "@/lib/data";

export default async function TeamPage() {
  await requireUser();
  const profiles = await getProfiles();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1c2024]">Team Management</h1>
        <p className="text-sm text-gray-500">Manage BDO team access to Tracker360.</p>
      </div>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-3 text-sm font-semibold text-[#1c2024]">Invite Team Member</h2>
        <form action={inviteTeamMember} className="flex flex-wrap gap-2">
          <input
            name="full_name"
            placeholder="Full name"
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="email"
            type="email"
            placeholder="Work email"
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-[var(--sidebar)] px-4 py-2 text-sm font-medium text-white hover:bg-black">
            Send Invite
          </button>
        </form>
      </section>

      <section className="max-h-[70vh] overflow-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {profiles.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-[#1c2024]">{p.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{p.email}</td>
                <td className="px-4 py-3 text-gray-600 uppercase text-xs font-medium">{p.role}</td>
                <td className="px-4 py-3">
                  <TeamRowControls profile={p} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
