import { requireUser } from "@/lib/data";

export async function requireAdminPage() {
  return await requireUser();
}
