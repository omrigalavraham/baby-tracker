import React, { useState } from 'react';
import { Droplet, Milk, Moon } from 'lucide-react';
import { BabyEvent } from '../../types';
import { formatTime } from '../../lib/babyUtils';
import { TONE, Tone, cx } from '../ui';
import { Category, shows } from './TypeFilter';

/*
 * One day on a 24h axis, in three lanes: sleep as bars, feedings and diapers as dots.
 * RTL: midnight on the right, the day runs to the left. Tap a dot or bar for its details.
 */

const DAY_MS = 86400000;
const HOURS = [0, 6, 12, 18, 24];

/** Short Hebrew line for one record, e.g. "בקבוק 120 מ"ל · חלב שאוב" */
export function shortText(e: BabyEvent): string {
  const d = e.details || {};
  if (e.type === 'feeding') {
    if (d.feedType === 'breast') {
      const side = d.breastSide === 'left' ? 'שמאל' : d.breastSide === 'right' ? 'ימין' : 'שני הצדדים';
      return `הנקה, ${side}${d.durationMinutes ? ` · ${d.durationMinutes} דק׳` : ''}`;
    }
    if (d.feedType === 'solids') return 'מוצקים';
    const content = d.bottleContent === 'breast_milk' ? 'חלב שאוב' : d.bottleContent === 'water' ? 'מים' : 'תמ"ל';
    return `בקבוק ${d.bottleAmountMl || 0} מ"ל · ${content}`;
  }
  if (e.type === 'diaper') {
    const kind = d.diaperType === 'pee' ? 'פיפי' : d.diaperType === 'poop' ? 'קקי' : 'פיפי וקקי';
    return d.poopColor && d.diaperType !== 'pee' ? `${kind} · ${d.poopColor}` : kind;
  }
  if (e.type === 'sleep') {
    if (d.isOngoing) return `ישנה מ-${formatTime(e.started_at)}`;
    const m = Math.round(d.durationMinutes || 0);
    const len = m < 60 ? `${m} דק׳` : `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} שעות`;
    return `שינה של ${len}`;
  }
  if (e.type === 'weight') return `שקילה · ${d.weightKg} ק"ג`;
  if (e.type === 'height') return `גובה · ${d.heightCm} ס"מ`;
  if (e.type === 'milestone') return `אבן דרך · ${d.title || ''}`;
  return 'רישום';
}

function sleepEnd(e: BabyEvent): number {
  const s = new Date(e.started_at).getTime();
  if (e.details?.isOngoing) return Date.now();
  if (e.ended_at) return new Date(e.ended_at).getTime();
  return s + (e.details?.durationMinutes || 0) * 60000;
}

const LANES: { id: Exclude<Category, 'growth'>; label: string; tone: Tone; icon: React.ReactNode }[] = [
  { id: 'sleep', label: 'שינה', tone: 'sleep', icon: <Moon /> },
  { id: 'feeding', label: 'האכלה', tone: 'feed', icon: <Milk /> },
  { id: 'diaper', label: 'חיתול', tone: 'diaper', icon: <Droplet /> },
];

const pct = (t: number, from: number) => `${Math.max(0, Math.min(100, ((t - from) / DAY_MS) * 100))}%`;

export const DayLanes: React.FC<{ events: BabyEvent[]; from: number; filters: Category[]; compact?: boolean }> = ({
  events,
  from,
  filters,
  compact,
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const to = from + DAY_MS;
  const now = Date.now();
  const lanes = LANES.filter(l => shows(filters, l.id));
  if (lanes.length === 0) return null;

  const inDay = (e: BabyEvent) => {
    const s = new Date(e.started_at).getTime();
    return e.type === 'sleep' ? s < to && sleepEnd(e) > from : s >= from && s < to;
  };
  const dayEvents = events.filter(inDay);
  const picked = dayEvents.find(e => e.id === selected);

  const track = (lane: (typeof LANES)[number]) => {
    const items = dayEvents.filter(e => e.type === lane.id);
    return (
      <div className={cx('relative flex-1 rounded-full bg-sunken', compact ? 'h-2' : 'h-7')}>
        {/* 6-hour guides */}
        {!compact &&
          [6, 12, 18].map(h => (
            <span key={h} aria-hidden="true" className="absolute top-1 bottom-1 w-px bg-line" style={{ right: `${(h / 24) * 100}%` }} />
          ))}
        {items.map(e => {
          const s = new Date(e.started_at).getTime();
          const sel = e.id === selected;
          if (lane.id === 'sleep') {
            const a = Math.max(s, from);
            const b = Math.min(sleepEnd(e), to);
            return (
              <button
                key={e.id}
                type="button"
                aria-label={`${formatTime(e.started_at)} ${shortText(e)}`}
                disabled={compact}
                onClick={() => setSelected(sel ? null : e.id)}
                className={cx(
                  'absolute top-0 bottom-0 rounded-full bg-sleep transition-opacity',
                  e.details?.isOngoing && 'animate-soft-pulse',
                  sel && 'ring-2 ring-offset-2 ring-sleep ring-offset-surface'
                )}
                style={{ right: pct(a, from), width: `max(${compact ? 3 : 6}px, ${((b - a) / DAY_MS) * 100}%)` }}
              />
            );
          }
          // Diapers: filled dot when there was poop, hollow ring for pee only
          const hollow = lane.id === 'diaper' && e.details?.diaperType === 'pee';
          const size = compact ? 'w-2 h-2' : 'w-3.5 h-3.5';
          return (
            <button
              key={e.id}
              type="button"
              aria-label={`${formatTime(e.started_at)} ${shortText(e)}`}
              disabled={compact}
              onClick={() => setSelected(sel ? null : e.id)}
              className={cx(
                'absolute top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full',
                !compact && 'before:absolute before:-inset-2 before:content-[""]',
                size,
                hollow ? cx('bg-surface border-2', lane.id === 'diaper' ? 'border-diaper' : 'border-feed') : TONE[lane.tone].solid,
                sel && cx('ring-2 ring-offset-2 ring-offset-surface', lane.tone === 'feed' ? 'ring-feed' : 'ring-diaper')
              )}
              style={{ right: pct(s, from) }}
            />
          );
        })}
        {now > from && now < to && (
          <span aria-hidden="true" className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-ink/25" style={{ right: pct(now, from) }} />
        )}
      </div>
    );
  };

  if (compact) {
    return <div className="flex flex-col gap-1">{lanes.map(l => <React.Fragment key={l.id}>{track(l)}</React.Fragment>)}</div>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {lanes.map(l => (
        <div key={l.id} className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={cx('w-8 h-8 rounded-full flex items-center justify-center shrink-0 [&_svg]:w-4 [&_svg]:h-4', TONE[l.tone].soft, TONE[l.tone].icon)}
          >
            {l.icon}
          </span>
          {track(l)}
        </div>
      ))}

      <div className="flex justify-between ps-[42px] text-[12px] text-muted tabular-nums" aria-hidden="true">
        {HOURS.map(h => (
          <span key={h}>{String(h).padStart(2, '0')}:00</span>
        ))}
      </div>

      <div className="min-h-[40px] rounded-2xl bg-sunken px-3.5 py-2.5 text-[14px] flex items-center gap-2">
        {picked ? (
          <>
            <span className="tabular-nums text-muted">{formatTime(picked.started_at)}</span>
            <span className="text-ink">{shortText(picked)}</span>
          </>
        ) : (
          <span className="text-muted">הקישו על נקודה או פס כדי לראות מה היה</span>
        )}
      </div>
    </div>
  );
};
