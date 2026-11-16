import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data";

export async function requireAdminPage() {
  const result = await requireUser();
  if (result.profile?.role !== "admin") redirect("/");
  return result;
}
