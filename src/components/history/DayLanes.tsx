import React, { useState } from 'react';
import { Droplet, Milk, Moon } from 'lucide-react';
import { BabyEvent } from '../../types';
import { formatTime } from '../../lib/babyUtils';
import { TONE, Tone, cx } from '../ui';
import { Category, shows } from './TypeFilter';

/*
 * One day as a 24h clock with a ring per type (sleep arcs, feeding and diaper dots),
 * midnight at the top. The week view uses thin 24h strips instead. Tap a mark for details.
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

  // ---- Full size: a 24h clock, one ring per type (outermost first), midnight at the top ----
  const C = 160;
  const RADII = [118, 92, 66];
  const angle = (t: number) => ((t - from) / DAY_MS) * Math.PI * 2;
  const at = (r: number, a: number) => ({ x: C + r * Math.sin(a), y: C - r * Math.cos(a) });
  const arc = (r: number, a1: number, a2: number) => {
    const p1 = at(r, a1);
    const p2 = at(r, a2);
    return `M${p1.x} ${p1.y} A${r} ${r} 0 ${a2 - a1 > Math.PI ? 1 : 0} 1 ${p2.x} ${p2.y}`;
  };
  const nowA = now > from && now < to ? angle(now) : null;
  const pick = (id: string) => setSelected(s => (s === id ? null : id));

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full max-w-[320px] aspect-square">
        <svg viewBox="0 0 320 320" className="block w-full h-full" role="img" aria-label="שעון של 24 שעות: שינה, האכלות וחיתולים">
          <defs>
            <radialGradient id="dialG" cx="50%" cy="38%" r="70%">
              <stop offset="0" style={{ stopColor: 'var(--c-dial-hi)' }} />
              <stop offset="1" style={{ stopColor: 'var(--c-dial)' }} />
            </radialGradient>
            {/* rose gold: the same metal in day and night */}
            <linearGradient id="roseGoldG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#F6D5C6" />
              <stop offset=".35" stopColor="#D9967F" />
              <stop offset=".55" stopColor="#FBE3D6" />
              <stop offset=".8" stopColor="#C27E6A" />
              <stop offset="1" stopColor="#EFC2B0" />
            </linearGradient>
            <linearGradient id="gemG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFE6F0" />
              <stop offset=".45" stopColor="#F5A3C4" />
              <stop offset="1" stopColor="#D85C92" />
            </linearGradient>
          </defs>

          {/* bezel and dial */}
          <circle cx={C} cy={C} r="157" fill="url(#roseGoldG)" />
          <circle cx={C} cy={C} r="148" fill="url(#dialG)" />
          <circle cx={C} cy={C} r="148" fill="none" stroke="#B8735F" strokeOpacity=".45" strokeWidth="1" />
          <circle cx={C} cy={C} r="152.5" fill="none" stroke="#FFF4EE" strokeOpacity=".6" strokeWidth=".8" />
          {/* sunburst brushing */}
          {Array.from({ length: 120 }, (_, i) => {
            const a = (i / 120) * Math.PI * 2;
            const p1 = at(14, a);
            const p2 = at(147, a);
            return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--c-dial-line)" strokeWidth=".7" />;
          })}

          {/* hour markers: rose-gold numerals at 00 / 06 / 12 / 18, pink diamonds elsewhere */}
          {Array.from({ length: 24 }, (_, h) => {
            const a = (h / 24) * Math.PI * 2;
            const p = at(137, a);
            if (h % 6 === 0) {
              return (
                <text
                  key={h}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="13"
                  fontWeight="600"
                  fill="url(#roseGoldG)"
                  stroke="#A9644F"
                  strokeOpacity=".35"
                  strokeWidth=".4"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {String(h).padStart(2, '0')}
                </text>
              );
            }
            const s = h % 2 === 0 ? 1 : 0.72;
            return (
              <g key={h} transform={`translate(${p.x} ${p.y}) rotate(${(h / 24) * 360}) scale(${s})`}>
                <polygon points="0,-6.5 4.2,0 0,6.5 -4.2,0" fill="url(#gemG)" stroke="#FFFFFF" strokeOpacity=".7" strokeWidth=".6" />
                <polyline points="-4.2,0 0,-2 4.2,0" fill="none" stroke="#FFFFFF" strokeOpacity=".75" strokeWidth=".5" />
                <line x1="0" y1="-6.5" x2="0" y2="6.5" stroke="#FFFFFF" strokeOpacity=".35" strokeWidth=".4" />
              </g>
            );
          })}
          {/* a few glints on the diamonds */}
          {[2, 8, 14, 20].map((h, i) => {
            const p = at(137, (h / 24) * Math.PI * 2);
            return (
              <path
                key={h}
                d={`M${p.x + 5} ${p.y - 9} l1 3 3 1 -3 1 -1 3 -1 -3 -3 -1 3 -1 z`}
                fill="#FFFFFF"
                className="gem-glint"
                style={{ animationDelay: `${i * 1.1}s` }}
              />
            );
          })}

          {lanes.map((lane, i) => {
            const r = RADII[i];
            const items = dayEvents.filter(e => e.type === lane.id);
            return (
              <g key={lane.id}>
                <circle cx={C} cy={C} r={r} fill="none" stroke="var(--c-dial-track)" strokeWidth="20" />
                {items.map(e => {
                  const s = new Date(e.started_at).getTime();
                  const sel = e.id === selected;
                  const label = `${formatTime(e.started_at)} ${shortText(e)}`;
                  if (lane.id === 'sleep') {
                    const a1 = angle(Math.max(s, from));
                    const a2 = Math.max(a1 + 0.02, angle(Math.min(sleepEnd(e), to)));
                    return (
                      <path
                        key={e.id}
                        d={arc(r, a1, a2)}
                        fill="none"
                        stroke="var(--c-sleep)"
                        strokeWidth={sel ? 20 : 16}
                        strokeLinecap="round"
                        opacity={selected && !sel ? 0.45 : 1}
                        className={cx('cursor-pointer transition-[stroke-width,opacity]', e.details?.isOngoing && 'animate-soft-pulse')}
                        role="button"
                        aria-label={label}
                        onClick={() => pick(e.id)}
                      />
                    );
                  }
                  const p = at(r, angle(s));
                  const hollow = lane.id === 'diaper' && e.details?.diaperType === 'pee';
                  const color = lane.id === 'feeding' ? 'var(--c-feed)' : 'var(--c-diaper)';
                  return (
                    <g key={e.id} role="button" aria-label={label} className="cursor-pointer" onClick={() => pick(e.id)} opacity={selected && !sel ? 0.45 : 1}>
                      <circle cx={p.x} cy={p.y} r="15" fill="transparent" />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={sel ? 9 : 7}
                        fill={hollow ? 'var(--c-surface)' : color}
                        stroke={hollow ? color : 'var(--c-surface)'}
                        strokeWidth={hollow ? 3 : 2}
                        className="transition-[r]"
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* the clock hand at the current time */}
          {nowA !== null && (
            <g pointerEvents="none">
              {(() => {
                // A tapered rose-gold hand with a small diamond at the tip
                const base = at(54, nowA);
                const tip = at(128, nowA);
                const side = { x: Math.cos(nowA) * 3, y: Math.sin(nowA) * 3 };
                return (
                  <>
                    <polygon
                      points={`${base.x + side.x},${base.y + side.y} ${tip.x},${tip.y} ${base.x - side.x},${base.y - side.y}`}
                      fill="url(#roseGoldG)"
                      stroke="#A9644F"
                      strokeOpacity=".5"
                      strokeWidth=".6"
                      strokeLinejoin="round"
                    />
                    <g transform={`translate(${tip.x} ${tip.y}) rotate(${(nowA * 180) / Math.PI})`}>
                      <polygon points="0,-5 3.2,0 0,5 -3.2,0" fill="url(#gemG)" stroke="#FFFFFF" strokeOpacity=".8" strokeWidth=".6" />
                    </g>
                  </>
                );
              })()}
            </g>
          )}
        </svg>

        {/* centre: what was tapped, or the time now */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[34%] flex flex-col items-center text-center gap-0.5">
            {picked ? (
              <>
                <span className="text-[20px] font-medium text-ink tabular-nums leading-tight">{formatTime(picked.started_at)}</span>
                <span className="text-[12px] text-muted leading-snug">{shortText(picked)}</span>
              </>
            ) : nowA !== null ? (
              <>
                <span className="text-[22px] font-medium text-ink tabular-nums leading-tight">{formatTime(new Date(now).toISOString())}</span>
                <span className="text-[12px] text-muted leading-snug">הקישו על נקודה לפרטים</span>
              </>
            ) : (
              <span className="text-[12px] text-muted leading-snug">הקישו על נקודה לפרטים</span>
            )}
          </div>
        </div>
      </div>

      {/* which ring is which, outermost first */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px] text-muted">
        {lanes.map(l => (
          <span key={l.id} className="flex items-center gap-1.5">
            <span className={cx('w-2.5 h-2.5 rounded-full', TONE[l.tone].solid)} />
            {l.label}
          </span>
        ))}
        {lanes.some(l => l.id === 'diaper') && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-diaper" />
            רק פיפי
          </span>
        )}
      </div>
    </div>
  );
};
