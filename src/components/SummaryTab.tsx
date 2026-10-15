import React, { useState } from 'react';
import { BabyEvent, BabyProfile } from '../types';
import { computeStats, DayStats } from '../lib/analyticsUtils';
import { Card, Segmented, TONE, Tone, cx } from './ui';

/*
 * Summary card of the History tab: gentle headline, three pastel stat tiles,
 * and a 24h sleep strip (day views) or a calm per-day list (week view).
 */

export type HistoryPeriod = 'today' | 'yesterday' | 'week';

export const PERIOD_OPTIONS: { value: HistoryPeriod; label: string }[] = [
  { value: 'today', label: 'היום' },
  { value: 'yesterday', label: 'אתמול' },
  { value: 'week', label: 'שבוע' },
];

const DAY_MS = 86400000;

export function startOfDay(ts: number = Date.now()): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** [from, to) range of a period. Week = the last 7 calendar days including today. */
export function periodRange(period: HistoryPeriod): { from: number; to: number } {
  const today = startOfDay();
  if (period === 'today') return { from: today, to: today + DAY_MS };
  if (period === 'yesterday') return { from: today - DAY_MS, to: today };
  return { from: today - 6 * DAY_MS, to: today + DAY_MS };
}

export function eventsInRange(events: BabyEvent[], from: number, to: number): BabyEvent[] {
  return events.filter(e => {
    const t = new Date(e.started_at).getTime();
    return t >= from && t < to;
  });
}

export function filterEventsForPeriod(events: BabyEvent[], period: HistoryPeriod): BabyEvent[] {
  const { from, to } = periodRange(period);
  return eventsInRange(events, from, to);
}

/** Sleep intervals clipped to [from, to). Ongoing sleep runs until now. */
function sleepIntervals(events: BabyEvent[], from: number, to: number): { start: number; end: number; id: string }[] {
  return events
    .filter(e => e.type === 'sleep')
    .map(e => {
      const s = new Date(e.started_at).getTime();
      const end = e.details?.isOngoing
        ? Date.now()
        : e.ended_at
        ? new Date(e.ended_at).getTime()
        : s + (e.details?.durationMinutes || 0) * 60000;
      return { id: e.id, start: Math.max(s, from), end: Math.min(end, to) };
    })
    .filter(i => i.end > i.start);
}

export function formatHours(minutes: number): string {
  const h = minutes / 60;
  if (h === 0) return '0';
  return h >= 10 ? String(Math.round(h)) : String(Number(h.toFixed(1)));
}

const SleepStrip: React.FC<{ events: BabyEvent[]; from: number; size?: 'md' | 'sm'; showLabels?: boolean }> = ({
  events,
  from,
  size = 'md',
  showLabels = true,
}) => {
  const to = from + DAY_MS;
  const segments = sleepIntervals(events, from, to);
  const now = Date.now();
  const showNow = now > from && now < to;
  return (
    <div>
      <div
        className={cx('relative rounded-full bg-sunken overflow-hidden', size === 'md' ? 'h-3' : 'h-2')}
        role="img"
        aria-label="שינה לאורך היממה"
      >
        {segments.map(s => (
          <span
            key={s.id}
            className="absolute top-0 bottom-0 rounded-full bg-sleep"
            style={{
              right: `${((s.start - from) / DAY_MS) * 100}%`,
              width: `max(4px, ${((s.end - s.start) / DAY_MS) * 100}%)`,
            }}
          />
        ))}
        {showNow && (
          <span
            className="absolute top-0 bottom-0 w-[2px] bg-faint"
            style={{ right: `${((now - from) / DAY_MS) * 100}%` }}
            aria-hidden="true"
          />
        )}
      </div>
      {showLabels && (
        <div className="flex justify-between mt-2 text-[13px] text-muted tabular-nums" aria-hidden="true">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      )}
    </div>
  );
};

const StatTile: React.FC<{ tone: Tone; value: React.ReactNode; label: string; hint?: string }> = ({ tone, value, label, hint }) => (
  <div className={cx('rounded-[24px] px-4 py-4 flex flex-col gap-0.5', TONE[tone].soft)}>
    <span className="text-[22px] font-medium tabular-nums text-ink leading-tight">{value}</span>
    <span className={cx('text-[13px]', TONE[tone].ink)}>{label}</span>
    {hint && <span className={cx('text-[13px] tabular-nums opacity-80', TONE[tone].ink)}>{hint}</span>}
  </div>
);

function headline(period: HistoryPeriod, count: number, stats: DayStats, days: number): string {
  if (count === 0) {
    if (period === 'today') return 'עוד לא נרשם כלום היום';
    if (period === 'yesterday') return 'לא נרשמו פעולות אתמול';
    return 'עוד אין רישומים השבוע';
  }
  const wetPerDay = stats.peeCount / days;
  const interval = stats.averageFeedingIntervalHours;
  const balanced = wetPerDay >= 5 && interval !== undefined && interval >= 1.5 && interval <= 4;
  if (balanced) return period === 'week' ? 'שבוע רגוע ומאוזן' : 'יום רגוע ומאוזן';
  if (period === 'today') return 'סיכום היום';
  if (period === 'yesterday') return 'סיכום אתמול';
  return 'סיכום השבוע';
}

const WeekDays: React.FC<{ events: BabyEvent[] }> = ({ events }) => {
  const today = startOfDay();
  const days = Array.from({ length: 7 }, (_, i) => today - i * DAY_MS);
  return (
    <ol className="flex flex-col gap-4">
      {days.map(dayStart => {
        const dayEvents = eventsInRange(events, dayStart, dayStart + DAY_MS);
        const s = computeStats(dayEvents);
        const label =
          dayStart === today
            ? 'היום'
            : dayStart === today - DAY_MS
            ? 'אתמול'
            : new Date(dayStart).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric' });
        return (
          <li key={dayStart} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-ink">{label}</span>
              <span className="flex items-center gap-3 text-[13px] text-muted tabular-nums">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-feed" aria-hidden="true" />
                  {s.totalFeedings}
                  <span className="sr-only">האכלות</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sleep" aria-hidden="true" />
                  {formatHours(s.totalSleepMinutes)} ש׳
                  <span className="sr-only">שינה</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-diaper" aria-hidden="true" />
                  {s.totalDiapers}
                  <span className="sr-only">חיתולים</span>
                </span>
              </span>
            </div>
            <SleepStrip events={events} from={dayStart} size="sm" showLabels={false} />
          </li>
        );
      })}
    </ol>
  );
};

/** The main summary card used by HistoryTab. */
export const SummaryCard: React.FC<{ events: BabyEvent[]; period: HistoryPeriod }> = ({ events, period }) => {
  const filtered = filterEventsForPeriod(events, period);
  const stats = computeStats(filtered);
  const days = period === 'week' ? 7 : 1;
  const isWeek = period === 'week';
  const { from } = periodRange(period);

  const sub = filtered.length === 0
    ? period === 'today'
      ? 'כל רישום יופיע כאן, בנחת'
      : 'אין נתונים לתקופה הזו'
    : `${filtered.length} רישומים`;

  const avg = (n: number) => `כ-${Number((n / 7).toFixed(1))} ביום`;

  return (
    <Card className="p-[22px] flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-lg font-medium text-ink">{headline(period, filtered.length, stats, days)}</h2>
        <span className="text-[13px] text-muted tabular-nums">{sub}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile tone="feed" value={stats.totalFeedings} label="האכלות" hint={isWeek ? avg(stats.totalFeedings) : undefined} />
        <StatTile
          tone="sleep"
          value={formatHours(stats.totalSleepMinutes)}
          label="שעות שינה"
          hint={isWeek ? `כ-${formatHours(stats.totalSleepMinutes / 7)} ביום` : undefined}
        />
        <StatTile tone="diaper" value={stats.totalDiapers} label="חיתולים" hint={isWeek ? avg(stats.totalDiapers) : undefined} />
      </div>

      {isWeek ? <WeekDays events={events} /> : <SleepStrip events={events} from={from} />}
    </Card>
  );
};

/* Legacy standalone summary (kept for compatibility; HistoryTab composes SummaryCard directly). */
interface SummaryTabProps {
  events: BabyEvent[];
  profile: BabyProfile;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ events }) => {
  const [period, setPeriod] = useState<HistoryPeriod>('today');
  return (
    <div className="flex flex-col gap-4">
      <Segmented label="טווח זמן" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
      <SummaryCard events={events} period={period} />
    </div>
  );
};
