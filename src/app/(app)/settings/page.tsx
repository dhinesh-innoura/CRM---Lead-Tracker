import { requireUser } from "@/lib/data";

export default async function SettingsPage() {
  const { profile, user } = await requireUser();

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#1c2024]">Settings</h1>
        <p className="text-sm text-gray-500">Your account details.</p>
      </div>
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-xs font-medium text-gray-400">Name</dt>
            <dd className="text-[#1c2024]">{profile?.full_name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400">Email</dt>
            <dd className="text-[#1c2024]">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400">Role</dt>
            <dd className="text-[#1c2024]">{profile?.role === "admin" ? "Admin" : "BDO"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
