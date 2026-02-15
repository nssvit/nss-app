// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Environment variables (auto-set by Supabase unless noted):
// SUPABASE_URL              — auto-set
// SUPABASE_SERVICE_ROLE_KEY — auto-set
// BETTERSTACK_HEARTBEAT_URL — set in Supabase dashboard > Edge Functions > Secrets

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const HEARTBEAT_URL = Deno.env.get("BETTERSTACK_HEARTBEAT_URL");

  if (!supabaseUrl || !serviceRoleKey || !HEARTBEAT_URL) {
    console.error("Missing required environment variables");
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Health-check: count active volunteers in the NSS database
    const { count, error } = await supabase
      .from("volunteers")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    if (error) {
      console.error("Supabase query error:", error.message);
      throw error;
    }

    // Success: ping BetterStack heartbeat
    const res = await fetch(HEARTBEAT_URL, { method: "GET" });
    if (!res.ok) {
      console.error("Heartbeat ping failed with status", res.status);
      throw new Error(`Heartbeat ping failed: ${res.status}`);
    }

    return new Response(
      JSON.stringify({ status: "ok", activeVolunteers: count }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Health check error:", err.message || err);

    // Report failure to BetterStack
    try {
      await fetch(`${HEARTBEAT_URL}/fail`, { method: "GET" });
    } catch (e) {
      console.error("Failed to report heartbeat failure:", e);
    }

    return new Response(
      JSON.stringify({ status: "fail", error: err.message ?? String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
