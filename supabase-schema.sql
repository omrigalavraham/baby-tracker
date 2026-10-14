-- =========================================================
-- טבלאות עבור אפליקציית בייבי יומן (סנכרון בין טלפונים)
-- הדבק והרץ סקריפט זה ב-Supabase -> SQL Editor -> Run
-- =========================================================

-- 1. יצירת טבלת תינוקות
create table if not exists public.babies (
  id text primary key,               -- קוד משפחה (לדוגמה: BABY-7X4A)
  name text not null,                -- שם התינוקת
  birth_date date not null,          -- תאריך לידה
  birth_time text,                   -- שעת לידה
  birth_weight numeric,              -- משקל לידה בק"ג
  gender text default 'girl',        -- בן / בת
  created_at timestamptz default now()
);

-- 2. יצירת טבלת אירועים ומעקב
create table if not exists public.events (
  id text primary key,               -- מזהה ייחודי
  baby_id text references public.babies(id) on delete cascade,
  type text not null,                -- 'feeding', 'diaper', 'sleep', 'weight', 'milestone'
  details jsonb default '{}'::jsonb, -- פרטי האירוע (הנקה/בקבוק/פיפי/קקי)
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,                        -- הערות חופשיות
  created_by text,                   -- מי הזין (אמא/אבא)
  created_at timestamptz default now()
);

-- אינדקס לטעינה מהירה של האירועים
create index if not exists idx_events_baby_started on public.events(baby_id, started_at desc);

-- 3. הרשאות (Row Level Security) - מאפשר שיתוף חופשי עם קוד המשפחה
alter table public.babies enable row level security;
alter table public.events enable row level security;

drop policy if exists "Allow all operations on babies" on public.babies;
drop policy if exists "Allow all operations on events" on public.events;

create policy "Allow all operations on babies" on public.babies for all using (true) with check (true);
create policy "Allow all operations on events" on public.events for all using (true) with check (true);

-- 4. הפעלת Realtime (סנכרון מיידי בין שני המכשירים)
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.babies;
