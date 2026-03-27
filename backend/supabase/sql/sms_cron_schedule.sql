-- 将下面两处占位符替换为实际值后，用 psql 执行本文件：
--   PLACEHOLDER_FUNCTIONS_URL  例：https://你的项目.supabase.co/functions/v1/sms-reminder-cron
--   PLACEHOLDER_SERVICE_ROLE   例：Service Role JWT（与 Bearer 空格后内容一致）
--
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/sql/sms_cron_schedule.sql

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'sms-reminders',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'PLACEHOLDER_FUNCTIONS_URL',
    headers := jsonb_build_object(
      'Authorization', 'Bearer PLACEHOLDER_SERVICE_ROLE',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $cron$
);
