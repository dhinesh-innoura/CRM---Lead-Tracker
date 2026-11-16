// Supabase Edge Function: invoke daily (via Supabase scheduled cron) to
// generate overdue / due-today / upcoming-meeting notifications.
// Deploy: supabase functions deploy daily-sweep
// Schedule: supabase functions schedule create daily-sweep --cron "0 2 * * *"
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase.rpc("run_daily_follow_up_sweep");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
