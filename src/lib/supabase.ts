import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { BabyEvent, BabyProfile } from '../types';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

const STORAGE_KEY = 'avigi_supabase_config';

export function getStoredSupabaseConfig(): SupabaseConfig | null {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

let clientInstance: SupabaseClient | null = null;
let currentConfigKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config?.url || !config?.anonKey) {
    return null;
  }

  const configKey = `${config.url}_${config.anonKey}`;
  if (clientInstance && currentConfigKey === configKey) {
    return clientInstance;
  }

  try {
    clientInstance = createClient(config.url, config.anonKey);
    currentConfigKey = configKey;
    return clientInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseClient() !== null;
}

/**
 * Test if the Supabase connection is working
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'לא הוזנו כתובת URL ומפתח תקינים' };
  }

  try {
    const { error } = await client.from('babies').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return { success: false, message: 'החיבור הצליח, אך הטבלאות (babies) עדיין לא נוצרו ב-Supabase' };
      }
      return { success: false, message: `שגיאה מ-Supabase: ${error.message}` };
    }
    return { success: true, message: 'מחובר ומסונכרן בהצלחה ל-Supabase!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'שגיאת רשת בחיבור ל-Supabase' };
  }
}

/**
 * Fetch baby profile by family code / ID
 */
export async function fetchBabyFromSupabase(babyId: string): Promise<BabyProfile | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('babies')
      .select('*')
      .eq('id', babyId)
      .single();

    if (error || !data) return null;
    return data as BabyProfile;
  } catch (err) {
    console.error('Error fetching baby:', err);
    return null;
  }
}

/**
 * Upsert baby profile
 */
export async function saveBabyToSupabase(baby: BabyProfile): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('babies')
      .upsert({
        id: baby.id,
        name: baby.name,
        birth_date: baby.birth_date,
        birth_time: baby.birth_time,
        birth_weight: baby.birth_weight,
        gender: baby.gender,
        created_at: baby.created_at || new Date().toISOString()
      });

    return !error;
  } catch (err) {
    console.error('Error saving baby:', err);
    return false;
  }
}

/**
 * Fetch all events for a baby
 */
export async function fetchEventsFromSupabase(babyId: string): Promise<BabyEvent[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('events')
      .select('*')
      .eq('baby_id', babyId)
      .order('started_at', { ascending: false });

    if (error || !data) return [];
    return data as BabyEvent[];
  } catch (err) {
    console.error('Error fetching events:', err);
    return [];
  }
}

/**
 * Add an event to Supabase
 */
export async function addEventToSupabase(event: BabyEvent): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('events')
      .insert({
        id: event.id,
        baby_id: event.baby_id,
        type: event.type,
        details: event.details,
        started_at: event.started_at,
        ended_at: event.ended_at,
        notes: event.notes,
        created_by: event.created_by,
        created_at: event.created_at
      });

    return !error;
  } catch (err) {
    console.error('Error adding event:', err);
    return false;
  }
}

/**
 * Delete an event from Supabase
 */
export async function deleteEventFromSupabase(eventId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('events')
      .delete()
      .eq('id', eventId);

    return !error;
  } catch (err) {
    console.error('Error deleting event:', err);
    return false;
  }
}

/**
 * Subscribe to realtime changes on events for this baby
 */
export function subscribeToRealtimeEvents(
  babyId: string,
  onEventChange: (payload: any) => void
): RealtimeChannel | null {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channel = client
      .channel(`realtime:events:${babyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `baby_id=eq.${babyId}`
        },
        (payload) => {
          onEventChange(payload);
        }
      )
      .subscribe();

    return channel;
  } catch (err) {
    console.error('Failed to setup Realtime subscription:', err);
    return null;
  }
}
