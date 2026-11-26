"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const location = formData.get("location") ? String(formData.get("location")).trim() : null;
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = formData.get("end_date") ? String(formData.get("end_date")) : null;
  const description = formData.get("description") ? String(formData.get("description")).trim() : null;

  if (!name || !startDate) throw new Error("Event name and start date are required");

  const { data, error } = await supabase
    .from("events")
    .insert({
      name,
      location,
      start_date: startDate,
      end_date: endDate,
      description,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/events");
  redirect(`/events/${data.id}`);
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw new Error(error.message);
  revalidatePath("/events");
  revalidatePath("/leads");
  revalidatePath("/leads/sir-given");
}

export async function deleteAllEvents() {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().not("id", "is", null);
  if (error) throw new Error(error.message);
  revalidatePath("/events");
  revalidatePath("/leads");
  revalidatePath("/leads/sir-given");
}
