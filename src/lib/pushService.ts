import { DailyReminderItem, SmartTimersConfig } from '../types';
import { getStoredSupabaseConfig, getSupabaseClient } from './supabase';

/*
 * Web Push: lets the server (Supabase function "send-reminders") notify this
 * phone even when the app is closed. See supabase/push-notifications.sql.
 */

const PUSH_ACTIVE_KEY = 'avigi_push_active';

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** True once this device is registered with the server, so in-app timers can stay quiet. */
export function isPushActive(): boolean {
  try {
    return localStorage.getItem(PUSH_ACTIVE_KEY) === '1';
  } catch {
    return false;
  }
}

function setPushActive(active: boolean) {
  try {
    if (active) localStorage.setItem(PUSH_ACTIVE_KEY, '1');
    else localStorage.removeItem(PUSH_ACTIVE_KEY);
  } catch {
    // storage unavailable
  }
}

function functionUrl(): string | null {
  const config = getStoredSupabaseConfig();
  return config?.url ? `${config.url.replace(/\/$/, '')}/functions/v1/send-reminders` : null;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

/**
 * Subscribes this device (if permission is granted) and saves the subscription
 * for the family. Safe to call repeatedly.
 */
export async function ensurePushSubscription(babyId: string): Promise<boolean> {
  const client = getSupabaseClient();
  const url = functionUrl();
  if (!client || !url || !isPushSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`publicKey ${res.status}`);
      const { publicKey } = await res.json();
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
    }

    const json = subscription.toJSON();
    const { error } = await client.from('push_subscriptions').upsert({
      endpoint: subscription.endpoint,
      baby_id: babyId,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      user_agent: navigator.userAgent.slice(0, 200),
      last_seen_at: new Date().toISOString(),
    });
    if (error) throw error;

    setPushActive(true);
    return true;
  } catch (err) {
    // Server side not set up yet (or offline): in-app timers keep working
    console.warn('Push subscription unavailable:', err);
    setPushActive(false);
    return false;
  }
}

/** Mirrors reminders and smart-timer settings to the server, which checks them every minute. */
export async function syncFamilySettings(babyId: string, reminders: DailyReminderItem[], smartTimers: SmartTimersConfig) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('family_settings').upsert({
      baby_id: babyId,
      reminders,
      smart_timers: smartTimers,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jerusalem',
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Could not sync reminder settings:', err);
  }
}
