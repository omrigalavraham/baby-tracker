import { BabyEvent } from '../types';
import { localDateKey } from './babyUtils';

/**
 * Sample data for preview builds only (VITE_DEMO=1).
 * Seeds localStorage once so every screen has something to show.
 */
export function seedDemoData() {
  try {
    if (localStorage.getItem('avigi_baby_events')) return;

    const now = Date.now();
    const min = 60000;
    const at = (minsAgo: number) => new Date(now - minsAgo * min).toISOString();
    const events: BabyEvent[] = [];
    let n = 0;
    const add = (type: BabyEvent['type'], minsAgo: number, details: Record<string, unknown>, endedMinsAgo?: number) => {
      events.push({
        id: `demo-${n++}`,
        baby_id: 'DEMO',
        type,
        details,
        started_at: at(minsAgo),
        ended_at: endedMinsAgo !== undefined ? at(endedMinsAgo) : undefined,
        created_by: 'הורה',
        created_at: at(minsAgo),
      });
    };

    // A gentle repeating rhythm over the last week, anchored to "now"
    for (let day = 0; day < 7; day++) {
      const base = day * 24 * 60;
      for (let i = 0; i < 8; i++) {
        const feedAgo = base + 125 + i * 180 + (day % 3) * 7;
        const breast = i % 2 === 0;
        add(
          'feeding',
          feedAgo,
          breast
            ? { feedType: 'breast', breastSide: i % 4 === 0 ? 'left' : 'right', durationMinutes: 14 + (i % 3) * 3 }
            : { feedType: 'bottle', bottleAmountMl: 110 + (i % 3) * 10, bottleContent: 'breast_milk' }
        );
      }
      for (let i = 0; i < 7; i++) {
        const t = i % 3;
        add('diaper', base + 40 + i * 205, { diaperType: t === 0 ? 'pee' : t === 1 ? 'both' : 'pee', poopColor: t === 1 ? 'צהוב חרדלי' : undefined });
      }
      // naps + night sleep
      add('sleep', base + 175, { durationMinutes: 105, isOngoing: false }, base + 70);
      add('sleep', base + 420, { durationMinutes: 60, isOngoing: false }, base + 360);
      add('sleep', base + 780, { durationMinutes: 390, isOngoing: false }, base + 390 + 0);
    }
    add('weight', 3 * 24 * 60, { weightKg: 4.6 });
    add('weight', 17 * 24 * 60, { weightKg: 4.1 });
    add('height', 3 * 24 * 60, { heightCm: 58.5 });
    add('height', 31 * 24 * 60, { heightCm: 55 });

    events.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    localStorage.setItem('avigi_baby_events', JSON.stringify(events));

    const birth = new Date(now - 104 * 24 * 60 * min);
    localStorage.setItem(
      'avigi_baby_profile',
      JSON.stringify({
        id: 'DEMO',
        name: 'אביגיל',
        birth_date: localDateKey(birth),
        birth_time: '08:40',
        birth_weight: 3.2,
        gender: 'girl',
        created_at: birth.toISOString(),
      })
    );
  } catch {
    // storage unavailable: the app just starts empty
  }
}
