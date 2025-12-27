-- Enable the required extensions if they aren't already
-- You mentioned pg_cron is installed, but we also commonly use pg_net for the http call
create extension if not exists "pg_net";
create extension if not exists "pg_cron";

-- Schedule the job to run every day at 2:00 AM
-- NOTE: You must replace <PROJECT_REF> and <SERVICE_ROLE_KEY> below.
-- <PROJECT_REF>: Your Supabase Project ID (e.g., "abcdefghijklm")
-- <SERVICE_ROLE_KEY>: Your Supabase "service_role" secret key (Settings > API)

select cron.schedule (
    'song-for-the-day-job', -- The unique name of your cron job
    '0 2 * * *',            -- Cron syntax: At 02:00 every day
    $$
    select
        net.http_post(
            url:='https://<PROJECT_REF>.supabase.co/functions/v1/song-for-the-day',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
        ) as request_id;
    $$
);

-- To verify it's scheduled, you can run:
-- select * from cron.job;

-- To unschedule/delete it later if needed:
-- select cron.unschedule('song-for-the-day-job');
