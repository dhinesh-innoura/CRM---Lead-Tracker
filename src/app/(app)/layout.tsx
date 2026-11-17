import { requireUser } from "@/lib/data";
import Sidebar from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, user } = await requireUser();
  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar fullName={profile?.full_name ?? user.email ?? ""} isAdmin={isAdmin} />
      <main className="flex-1 overflow-x-hidden bg-[var(--background)] p-6">{children}</main>
    </div>
  );
}
