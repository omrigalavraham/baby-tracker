-- =========================================================
-- התראות גם כשהטלפון נעול (Web Push)
-- הדבק והרץ ב-Supabase -> SQL Editor -> Run
-- לפני ההרצה: החליפו את YOUR_PROJECT_REF בשורה האחרונה
-- (מופיע בכתובת הפרויקט: https://YOUR_PROJECT_REF.supabase.co)
-- =========================================================

-- 1. מכשירים שנרשמו לקבלת התראות
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  baby_id text not null references public.babies(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now(),
  last_seen_at timestamptz default now()
);
create index if not exists idx_push_subscriptions_baby on public.push_subscriptions(baby_id);

-- 2. תזכורות והגדרות ההתראות של כל משפחה (עד עכשיו נשמרו רק בטלפון)
create table if not exists public.family_settings (
  baby_id text primary key references public.babies(id) on delete cascade,
  reminders jsonb not null default '[]'::jsonb,
  smart_timers jsonb not null default '{}'::jsonb,
  timezone text not null default 'Asia/Jerusalem',
  updated_at timestamptz default now()
);

-- 3. מה כבר נשלח (כדי שאף התראה לא תישלח פעמיים)
create table if not exists public.sent_notifications (
  baby_id text not null,
  tag text not null,
  sent_at timestamptz default now(),
  primary key (baby_id, tag)
);

-- 4. מפתחות ההצפנה של ההתראות. הפונקציה יוצרת אותם לבד בהרצה הראשונה
create table if not exists public.push_config (
  id int primary key default 1 check (id = 1),
  vapid_public text not null,
  vapid_private text not null,
  created_at timestamptz default now()
);

-- 5. הרשאות: כמו שאר הטבלאות, פתוח עם קוד המשפחה.
--    sent_notifications ו-push_config סגורות לגמרי לאפליקציה (רק השרת ניגש אליהן)
alter table public.push_subscriptions enable row level security;
alter table public.family_settings enable row level security;
alter table public.sent_notifications enable row level security;
alter table public.push_config enable row level security;

drop policy if exists "Allow all on push_subscriptions" on public.push_subscriptions;
drop policy if exists "Allow all on family_settings" on public.family_settings;
create policy "Allow all on push_subscriptions" on public.push_subscriptions for all using (true) with check (true);
create policy "Allow all on family_settings" on public.family_settings for all using (true) with check (true);

-- 6. תזמון: כל דקה השרת בודק אם צריך לשלוח משהו
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('avigi-send-reminders')
where exists (select 1 from cron.job where jobname = 'avigi-send-reminders');

select cron.schedule(
  'avigi-send-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
