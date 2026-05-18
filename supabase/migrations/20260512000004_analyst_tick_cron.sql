-- Enable pg_cron extension (requires Supabase Pro or manual enablement)
-- Run analyst-tick every day at 10:00 UTC (07:00 BRT)
-- This schedules a net request to the analyst-tick edge function via pg_net.
-- If pg_cron is not available in your plan, this migration is a no-op and
-- analyst-tick can be triggered manually from the dashboard.

DO $$
BEGIN
  -- Only schedule if pg_cron extension is available
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    CREATE EXTENSION IF NOT EXISTS pg_net;

    -- Remove existing job if any
    PERFORM cron.unschedule('analyst-tick-daily')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'analyst-tick-daily');

    -- Schedule daily run at 10:00 UTC
    PERFORM cron.schedule(
      'analyst-tick-daily',
      '0 10 * * *',
      $cron$
        SELECT net.http_post(
          url := current_setting('app.supabase_url') || '/functions/v1/analyst-tick',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', current_setting('app.cron_secret', true)
          ),
          body := '{}'::jsonb
        );
      $cron$
    );
  END IF;
END;
$$;
