# Supabase Keep-Alive — BetterStack Heartbeat

**Problem:** Supabase free-tier projects auto-pause after 1 week of inactivity.
**Solution:** A `pg_cron` job pings an Edge Function every 5 minutes, which health-checks the DB and reports to BetterStack.

---

## Architecture

```
pg_cron (every 5 min)
    │
    ▼
Edge Function: better-stack
    │
    ├─ Query: SELECT count(*) FROM volunteers WHERE is_active = true
    │
    ├─ Success → GET betterstack.com/heartbeat/<ID>
    └─ Failure → GET betterstack.com/heartbeat/<ID>/fail
```

This achieves two things:
1. **Keeps Supabase alive** — the DB query prevents auto-pause
2. **Monitors health** — BetterStack alerts you if the heartbeat stops or reports failure

---

## Files

| File | Purpose |
|------|---------|
| `supabase/functions/better-stack/index.ts` | Edge Function — health-checks DB, pings BetterStack |
| `supabase/cron-setup.sql` | SQL commands to set up Vault secret + cron schedule |

---

## Setup (Step by Step)

### 1. Create a BetterStack Heartbeat

1. Go to [BetterStack Uptime](https://uptime.betterstack.com)
2. Create a new **Heartbeat** monitor
3. Set the expected period to **10 minutes** (cron runs every 5, so 10 gives buffer)
4. Copy the heartbeat URL (e.g., `https://uptime.betterstack.com/api/v1/heartbeat/xxxx`)

### 2. Deploy the Edge Function

```bash
# From the nss-app-new directory
supabase functions deploy better-stack
```

### 3. Set the Edge Function Secret

```bash
supabase secrets set BETTERSTACK_HEARTBEAT_URL=https://uptime.betterstack.com/api/v1/heartbeat/YOUR_ID
```

> `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-set by Supabase — no need to configure them.

### 4. Store the Anon Key in Vault

Run in **Supabase SQL Editor**:

```sql
-- Enable required extensions (if not already enabled)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Store anon key in Vault (replace with your actual key)
select vault.create_secret(
  'YOUR_ANON_KEY_HERE',
  'anon_key',
  'Supabase anon key for cron auth'
);
```

> Get your anon key from: **Supabase Dashboard > Project Settings > API > anon public**

### 5. Schedule the Cron Job

Run in **Supabase SQL Editor**:

```sql
select cron.schedule(
  'betterstack-heartbeat',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/better-stack',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key' limit 1)
    ),
    timeout_milliseconds := 5000
  );
  $$
);
```

Replace `YOUR_PROJECT_REF` with your actual project reference.

### 6. Verify

```sql
-- Check the cron job is scheduled
select * from cron.job;

-- After 5 minutes, check run history
select * from cron.job_run_details order by start_time desc limit 5;
```

---

## Useful Commands

```sql
-- View all scheduled jobs
select * from cron.job;

-- View recent job runs + status
select * from cron.job_run_details order by start_time desc limit 10;

-- Unschedule the heartbeat
select cron.unschedule('betterstack-heartbeat');

-- Update the vault secret (e.g., after key rotation)
update vault.secrets set secret = 'NEW_KEY_HERE' where name = 'anon_key';

-- Re-schedule with different interval (e.g., every 3 minutes)
select cron.unschedule('betterstack-heartbeat');
select cron.schedule('betterstack-heartbeat', '*/3 * * * *', $$ ... $$);
```

---

## Edge Function Code

`supabase/functions/better-stack/index.ts`:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Environment variables (auto-set by Supabase unless noted):
// SUPABASE_URL              — auto-set
// SUPABASE_SERVICE_ROLE_KEY — auto-set
// BETTERSTACK_HEARTBEAT_URL — set via: supabase secrets set BETTERSTACK_HEARTBEAT_URL=...

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
```

**How it works:**
1. Receives a POST from `pg_cron` (or GET from manual invocation)
2. Creates a Supabase client with the service role key (bypasses RLS)
3. Runs a health-check query: counts active volunteers
4. On success → pings the BetterStack heartbeat URL
5. On failure → pings `heartbeat_url/fail` so BetterStack marks it as down

---

## Troubleshooting

### `{"code":401,"message":"Missing authorization header"}`
The cron job is not sending the auth header. Check:
- Vault secret exists: `select name from vault.decrypted_secrets where name = 'anon_key';`
- Cron SQL includes the `Authorization` header with Vault lookup

### Heartbeat shows "Down" on BetterStack
Check Edge Function logs:
```bash
supabase functions logs better-stack
```
Common causes:
- `BETTERSTACK_HEARTBEAT_URL` secret not set
- DB query failing (table doesn't exist, connection issue)

### Supabase still pausing
- Verify cron is running: `select * from cron.job_run_details order by start_time desc limit 5;`
- Check the `status` column — should be `succeeded`
- Make sure `pg_cron` and `pg_net` extensions are enabled

### Edge Function cold start timeout
The default `timeout_milliseconds := 5000` should be enough. If cold starts are slow, increase to `10000`.
