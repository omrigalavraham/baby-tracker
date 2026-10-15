// Supabase Edge Function: send-reminders
// Runs every minute (pg_cron, see supabase/push-notifications.sql) and sends Web Push
// notifications for daily reminders and smart timers, even when the app is closed.
//
//   GET  ?publicKey=1  -> { publicKey } for the app to subscribe with
//   POST               -> checks every family and sends what is due
//
// Deploy with "Verify JWT" OFF. Every notification is sent at most once
// (sent_notifications), so extra calls are harmless.

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:noreply@avigi.app';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

interface Reminder {
  id: string;
  title: string;
  description?: string;
  time: string;
  enabled: boolean;
  lastCompletedDate?: string;
}

interface SmartTimers {
  feedingIntervalMinutes?: number;
  wakeWindowMinutes?: number;
  stopwatchAlertMinutes?: number;
  notificationsEnabled?: boolean;
}

interface Due {
  tag: string;
  title: string;
  body: string;
}

async function getVapid(): Promise<{ publicKey: string; privateKey: string }> {
  const { data } = await supabase.from('push_config').select('vapid_public, vapid_private').eq('id', 1).maybeSingle();
  if (data) return { publicKey: data.vapid_public, privateKey: data.vapid_private };

  const keys = webpush.generateVAPIDKeys();
  await supabase.from('push_config').upsert({ id: 1, vapid_public: keys.publicKey, vapid_private: keys.privateKey }, { onConflict: 'id', ignoreDuplicates: true });
  // Re-read in case two calls raced
  const { data: saved } = await supabase.from('push_config').select('vapid_public, vapid_private').eq('id', 1).single();
  return { publicKey: saved!.vapid_public, privateKey: saved!.vapid_private };
}

function localNow(timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map(p => [p.type, p.value])
  );
  return { dateKey: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

function duration(min: number) {
  if (min < 60) return `${min} דקות`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hours = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : `${h} שעות`;
  return m >= 10 ? `${hours} ו-${m} דקות` : hours;
}

const minutesSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

// deno-lint-ignore no-explicit-any
async function dueFor(family: any): Promise<Due[]> {
  const timers: SmartTimers = family.smart_timers || {};
  if (!timers.notificationsEnabled) return [];
  const due: Due[] = [];
  const { dateKey, minutes } = localNow(family.timezone || 'Asia/Jerusalem');

  // Daily reminders: fire within 10 minutes after their time (tolerates cron delays)
  for (const r of (family.reminders || []) as Reminder[]) {
    if (!r.enabled || r.lastCompletedDate === dateKey || !r.time) continue;
    const [h, m] = r.time.split(':').map(Number);
    const diff = minutes - (h * 60 + m);
    if (diff >= 0 && diff <= 10) {
      due.push({ tag: `daily-${r.id}-${dateKey}`, title: r.title, body: r.description || 'הגיע הזמן. אפשר לסמן באפליקציה כשסיימתם.' });
    }
  }

  const { data: events } = await supabase
    .from('events')
    .select('id, type, details, started_at, ended_at')
    .eq('baby_id', family.baby_id)
    .in('type', ['feeding', 'sleep'])
    .order('started_at', { ascending: false })
    .limit(30);

  const lastFeed = events?.find(e => e.type === 'feeding');
  const activeSleep = events?.find(e => e.type === 'sleep' && e.details?.isOngoing);
  const lastEndedSleep = events?.find(e => e.type === 'sleep' && e.ended_at && !e.details?.isOngoing);

  // Feeding interval: once per feeding, and not for very old data
  const feedEvery = timers.feedingIntervalMinutes || 0;
  if (feedEvery > 0 && lastFeed) {
    const since = minutesSince(lastFeed.started_at);
    if (since >= feedEvery && since < feedEvery + 120) {
      due.push({ tag: `feed-${lastFeed.id}`, title: 'אולי היא רעבה', body: `עברו ${duration(since)} מההאכלה האחרונה.` });
    }
  }

  // Sleep timer that may have been forgotten
  const sleepAlert = timers.stopwatchAlertMinutes || 0;
  if (sleepAlert > 0 && activeSleep) {
    const since = minutesSince(activeSleep.started_at);
    if (since >= sleepAlert) {
      due.push({
        tag: `sleep-long-${activeSleep.id}`,
        title: 'טיימר השינה עדיין פועל',
        body: `היא ישנה כבר ${duration(since)}. אם כבר התעוררה, אפשר לעצור את הטיימר.`,
      });
    }
  }

  // Wake window: only while awake
  const wakeWindow = timers.wakeWindowMinutes || 0;
  if (wakeWindow > 0 && !activeSleep && lastEndedSleep) {
    const awake = minutesSince(lastEndedSleep.ended_at);
    if (awake >= wakeWindow && awake < wakeWindow + 60) {
      due.push({ tag: `wake-${lastEndedSleep.id}`, title: 'מתקרב זמן שינה', body: `היא ערה כבר ${duration(awake)}. זה זמן טוב להתחיל להרגיע.` });
    }
  }

  return due;
}

async function run() {
  const [{ data: families }, { data: subs }] = await Promise.all([
    supabase.from('family_settings').select('*'),
    supabase.from('push_subscriptions').select('*'),
  ]);
  if (!families?.length || !subs?.length) return 0;

  const subsByBaby = new Map<string, typeof subs>();
  for (const s of subs) subsByBaby.set(s.baby_id, [...(subsByBaby.get(s.baby_id) || []), s]);

  let sent = 0;
  for (const family of families) {
    const familySubs = subsByBaby.get(family.baby_id);
    if (!familySubs?.length) continue;

    const due = await dueFor(family);
    if (!due.length) continue;

    // Claim each tag; only the ones newly inserted are sent
    const { data: claimed } = await supabase
      .from('sent_notifications')
      .upsert(
        due.map(d => ({ baby_id: family.baby_id, tag: d.tag })),
        { onConflict: 'baby_id,tag', ignoreDuplicates: true }
      )
      .select('tag');
    const claimedTags = new Set((claimed || []).map(c => c.tag));

    for (const d of due.filter(x => claimedTags.has(x.tag))) {
      const payload = JSON.stringify({ title: d.title, body: d.body, tag: d.tag });
      await Promise.all(
        familySubs.map(async s => {
          try {
            await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
              TTL: 900,
              urgency: 'high',
            });
            sent++;
          } catch (err) {
            const status = (err as { statusCode?: number }).statusCode;
            // Device unsubscribed or app removed: forget it
            if (status === 404 || status === 410) {
              await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
            } else {
              console.error('push failed', status, err);
            }
          }
        })
      );
    }
  }

  // Housekeeping
  await supabase.from('sent_notifications').delete().lt('sent_at', new Date(Date.now() - 3 * 86400000).toISOString());
  return sent;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const vapid = await getVapid();
    if (req.method === 'GET') return json({ publicKey: vapid.publicKey });

    webpush.setVapidDetails(SUBJECT, vapid.publicKey, vapid.privateKey);
    const sent = await run();
    return json({ ok: true, sent });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: String(err) }, 500);
  }
});
