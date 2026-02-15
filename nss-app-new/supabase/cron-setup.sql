-- ============================================================
-- BetterStack Heartbeat Cron Setup
-- Run these commands in Supabase SQL Editor (in order)
-- ============================================================

-- 1. Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Store anon key in Vault (replace with your actual key)
select vault.create_secret(
  'YOUR_ANON_KEY_HERE',
  'anon_key',
  'Supabase anon key for cron auth'
);

-- 3. Schedule heartbeat cron (every 5 minutes)
select cron.schedule(
  'betterstack-heartbeat',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://uydgxhemdgsyowhxdyfk.supabase.co/functions/v1/better-stack',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key' limit 1)
    ),
    timeout_milliseconds := 5000
  );
  $$
);

-- ============================================================
-- Useful commands
-- ============================================================

-- View scheduled jobs:
-- select * from cron.job;

-- View recent job runs:
-- select * from cron.job_run_details order by start_time desc limit 10;

-- Unschedule the heartbeat:
-- select cron.unschedule('betterstack-heartbeat');

-- Update the vault secret:
-- update vault.secrets set secret = 'NEW_KEY_HERE' where name = 'anon_key';
