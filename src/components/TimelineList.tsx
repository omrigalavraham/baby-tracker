import React, { useMemo, useState } from 'react';
import { Droplet, Milk, Moon, Ruler, Scale, Star, Trash2 } from 'lucide-react';
import { BabyEvent } from '../types';
import { formatTime } from '../lib/babyUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { Card, IconButton, SectionTitle, TONE, Tone, cx, haptic } from './ui';

interface TimelineListProps {
  events: BabyEvent[];
  onDeleteEvent: (id: string) => void;
  /** Section heading (defaults to "מה קרה היום") */
  title?: string;
  /** Text shown when there are no events */
  emptyText?: string;
}

/** Human duration in Hebrew: "45 דק׳", "שעה ו-20 דק׳", "שעתיים" */
export function formatDuration(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest} דק׳`;
  const hStr = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : `${h} שעות`;
  return rest > 0 ? `${hStr} ו-${rest} דק׳` : hStr;
}

/** Short duration for tight spots: "45 ד׳", "2:10 ש׳" */
function shortDuration(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  if (m < 60) return `${m} ד׳`;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} ש׳`;
}

// Real stool colors, same swatches as the diaper sheet
const POOP_SWATCH: Record<string, string> = {
  'צהוב חרדלי': '#C9A227',
  'צהוב בהיר': '#E9D57E',
  ירוק: '#6E8B3D',
  חום: '#7A5230',
};

type Category = 'feeding' | 'sleep' | 'diaper' | 'growth';

const CATEGORIES: { id: Category; label: string; tone: Tone; icon: React.ReactNode }[] = [
  { id: 'feeding', label: 'האכלה', tone: 'feed', icon: <Milk /> },
  { id: 'sleep', label: 'שינה', tone: 'sleep', icon: <Moon /> },
  { id: 'diaper', label: 'חיתול', tone: 'diaper', icon: <Droplet /> },
  { id: 'growth', label: 'גדילה', tone: 'weight', icon: <Scale /> },
];

function categoryOf(e: BabyEvent): Category | 'other' {
  if (e.type === 'feeding' || e.type === 'sleep' || e.type === 'diaper') return e.type;
  if (e.type === 'weight' || e.type === 'height') return 'growth';
  return 'other';
}

function look(e: BabyEvent): { tone: Tone; icon: React.ReactNode } {
  switch (e.type) {
    case 'feeding':
      return { tone: 'feed', icon: <Milk /> };
    case 'sleep':
      return { tone: 'sleep', icon: <Moon /> };
    case 'diaper':
      return { tone: 'diaper', icon: <Droplet /> };
    case 'weight':
      return { tone: 'weight', icon: <Scale /> };
    case 'height':
      return { tone: 'weight', icon: <Ruler /> };
    default:
      return { tone: 'primary', icon: <Star /> };
  }
}

const Chip: React.FC<{ tone?: Tone; children: React.ReactNode }> = ({ tone, children }) => (
  <span
    className={cx(
      'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[12.5px] whitespace-nowrap',
      tone ? cx(TONE[tone].soft, TONE[tone].ink) : 'bg-sunken text-muted'
    )}
  >
    {children}
  </span>
);

/** Title and the visual details of one record */
function EventBody({ event, sinceLastFeed }: { event: BabyEvent; sinceLastFeed?: number }) {
  const d = event.details || {};

  if (event.type === 'feeding') {
    if (d.feedType === 'breast') {
      const sides = d.breastSide === 'both' ? ['ימין', 'שמאל'] : [d.breastSide === 'left' ? 'שמאל' : 'ימין'];
      return (
        <>
          <Title>הנקה</Title>
          <div className="flex flex-wrap gap-1.5">
            {sides.map(s => (
              <Chip key={s} tone="feed">
                <span className="w-1.5 h-1.5 rounded-full bg-feed" />
                צד {s}
              </Chip>
            ))}
            {d.durationMinutes ? <Chip>{formatDuration(d.durationMinutes)}</Chip> : null}
            {sinceLastFeed != null && <Chip>{shortDuration(sinceLastFeed)} מהקודמת</Chip>}
          </div>
        </>
      );
    }
    if (d.feedType === 'solids') {
      return (
        <>
          <Title>מוצקים</Title>
          {sinceLastFeed != null && (
            <div className="flex flex-wrap gap-1.5">
              <Chip>{shortDuration(sinceLastFeed)} מהקודמת</Chip>
            </div>
          )}
        </>
      );
    }
    const ml = d.bottleAmountMl || 0;
    const content = d.bottleContent === 'breast_milk' ? 'חלב שאוב' : d.bottleContent === 'water' ? 'מים' : 'תמ"ל';
    return (
      <>
        <Title>
          בקבוק <span className="tabular-nums">{ml}</span> מ"ל
        </Title>
        {/* amount bar out of 240 ml */}
        <span className="block h-1.5 w-full max-w-[180px] rounded-full bg-feed-soft overflow-hidden">
          <span className="block h-full rounded-full bg-feed" style={{ width: `${Math.min(100, (ml / 240) * 100)}%` }} />
        </span>
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="feed">{content}</Chip>
          {sinceLastFeed != null && <Chip>{shortDuration(sinceLastFeed)} מהקודמת</Chip>}
        </div>
      </>
    );
  }

  if (event.type === 'diaper') {
    const pee = d.diaperType === 'pee' || d.diaperType === 'both';
    const poop = d.diaperType === 'poop' || d.diaperType === 'both';
    return (
      <>
        <Title>{pee && poop ? 'פיפי וקקי' : poop ? 'קקי' : 'פיפי'}</Title>
        {poop && (
        <div className="flex flex-wrap gap-1.5">
          {(
            <Chip tone="diaper">
              <span
                className="w-3 h-3 rounded-full ring-1 ring-black/10"
                style={{ background: POOP_SWATCH[d.poopColor] || '#B08A4A' }}
              />
              {d.poopColor || 'קקי'}
            </Chip>
          )}
          {d.poopTexture && <Chip>{d.poopTexture}</Chip>}
        </div>
        )}
      </>
    );
  }

  if (event.type === 'sleep') {
    if (d.isOngoing) {
      return (
        <>
          <Title>ישנה עכשיו</Title>
          <div className="flex flex-wrap gap-1.5">
            <Chip tone="sleep">
              <span className="w-1.5 h-1.5 rounded-full bg-sleep animate-soft-pulse" />
              נרדמה ב-{formatTime(event.started_at)}
            </Chip>
          </div>
        </>
      );
    }
    const mins = d.durationMinutes || 0;
    return (
      <>
        <Title>שינה של {formatDuration(mins)}</Title>
        {/* length bar out of 4 hours */}
        <span className="flex items-center gap-2 w-full">
          <span className="block h-2 flex-1 max-w-[200px] rounded-full bg-sleep-soft overflow-hidden">
            <span className="block h-full rounded-full bg-sleep" style={{ width: `${Math.max(6, Math.min(100, (mins / 240) * 100))}%` }} />
          </span>
        </span>
        {event.ended_at && (
          <div className="flex flex-wrap gap-1.5">
            <Chip tone="sleep">
              <span className="tabular-nums" dir="ltr">
                {formatTime(event.started_at)} – {formatTime(event.ended_at)}
              </span>
            </Chip>
          </div>
        )}
      </>
    );
  }

  if (event.type === 'weight') return <Title>שקילה · {d.weightKg} ק"ג</Title>;
  if (event.type === 'height') return <Title>גובה · {d.heightCm} ס"מ</Title>;
  if (event.type === 'milestone') return <Title>אבן דרך · {d.title || ''}</Title>;
  return <Title>רישום</Title>;
}

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[15px] font-medium text-ink leading-snug">{children}</span>
);

function localDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayTitle(iso: string): string {
  const key = localDayKey(iso);
  const now = new Date();
  if (key === localDayKey(now.toISOString())) return 'היום';
  if (key === localDayKey(new Date(now.getTime() - 86400000).toISOString())) return 'אתמול';
  return new Date(iso).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** "3 האכלות · 5 חיתולים · 4 שעות שינה" for a day header */
function daySummary(items: BabyEvent[]) {
  const feeds = items.filter(e => e.type === 'feeding').length;
  const diapers = items.filter(e => e.type === 'diaper').length;
  const sleepMin = items.filter(e => e.type === 'sleep').reduce((s, e) => s + (e.details?.durationMinutes || 0), 0);
  return [
    feeds ? { tone: 'feed' as Tone, text: `${feeds} האכלות` } : null,
    sleepMin ? { tone: 'sleep' as Tone, text: `${shortDuration(sleepMin)} שינה` } : null,
    diapers ? { tone: 'diaper' as Tone, text: `${diapers} חיתולים` } : null,
  ].filter(Boolean) as { tone: Tone; text: string }[];
}

export const TimelineList: React.FC<TimelineListProps> = ({
  events,
  onDeleteEvent,
  title = 'מה קרה היום',
  emptyText = 'עוד לא נרשם כלום. כל רישום יופיע כאן.',
}) => {
  const [eventToDelete, setEventToDelete] = useState<BabyEvent | null>(null);
  // Empty = show everything
  const [filters, setFilters] = useState<Category[]>([]);

  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()),
    [events]
  );

  // Time since the previous feeding, for each feeding (computed on the full list, before filtering)
  const sinceLastFeed = useMemo(() => {
    const map = new Map<string, number>();
    const feeds = sorted.filter(e => e.type === 'feeding');
    feeds.forEach((e, i) => {
      const prev = feeds[i + 1];
      if (prev) map.set(e.id, (new Date(e.started_at).getTime() - new Date(prev.started_at).getTime()) / 60000);
    });
    return map;
  }, [sorted]);

  const counts = useMemo(() => {
    const c: Record<Category, number> = { feeding: 0, sleep: 0, diaper: 0, growth: 0 };
    sorted.forEach(e => {
      const cat = categoryOf(e);
      if (cat !== 'other') c[cat]++;
    });
    return c;
  }, [sorted]);

  const visible = filters.length ? sorted.filter(e => filters.includes(categoryOf(e) as Category)) : sorted;

  // Group by local calendar day, newest first
  const groups: { key: string; title: string; items: BabyEvent[]; all: BabyEvent[] }[] = [];
  visible.forEach(ev => {
    const key = localDayKey(ev.started_at);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(ev);
    else groups.push({ key, title: dayTitle(ev.started_at), items: [ev], all: sorted.filter(e => localDayKey(e.started_at) === key) });
  });

  const toggle = (c: Category) => {
    haptic(6);
    setFilters(f => (f.includes(c) ? f.filter(x => x !== c) : [...f, c]));
  };

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle aside={events.length > 0 ? `${visible.length} רישומים` : undefined}>{title}</SectionTitle>

      {events.length > 0 && (
        <div role="group" aria-label="סינון לפי סוג" className="flex gap-2 overflow-x-auto no-scrollbar -mx-[22px] px-[22px] py-0.5">
          <button
            onClick={() => setFilters([])}
            aria-pressed={filters.length === 0}
            className={cx(
              'h-10 px-4 rounded-full text-[14px] shrink-0 transition-colors',
              filters.length === 0 ? 'bg-ink text-surface font-medium' : 'bg-surface text-muted shadow-soft'
            )}
          >
            הכול
          </button>
          {CATEGORIES.map(c => {
            const on = filters.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                aria-pressed={on}
                disabled={counts[c.id] === 0 && !on}
                className={cx(
                  'h-10 ps-2 pe-3.5 rounded-full text-[14px] shrink-0 flex items-center gap-2 transition-colors disabled:opacity-40',
                  on ? cx(TONE[c.tone].soft, 'text-ink font-medium ring-2 ring-inset ring-current', TONE[c.tone].icon) : 'bg-surface text-ink shadow-soft'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    'w-7 h-7 rounded-full flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4',
                    on ? 'bg-surface' : TONE[c.tone].soft,
                    TONE[c.tone].icon
                  )}
                >
                  {c.icon}
                </span>
                <span className={on ? 'text-ink' : undefined}>{c.label}</span>
                <span className={cx('text-[12px] tabular-nums', on ? 'text-ink' : 'text-muted')}>{counts[c.id]}</span>
              </button>
            );
          })}
        </div>
      )}

      {events.length === 0 ? (
        <Card className="px-[22px] py-8 text-center">
          <p className="text-[15px] text-muted">{emptyText}</p>
        </Card>
      ) : visible.length === 0 ? (
        <Card className="px-[22px] py-8 text-center flex flex-col items-center gap-3">
          <p className="text-[15px] text-muted">אין רישומים מהסוג שבחרתם בתקופה הזו.</p>
          <button onClick={() => setFilters([])} className="text-[14px] font-medium text-primary-ink">
            הצגת הכול
          </button>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(g => {
            const summary = daySummary(g.all);
            return (
              <Card key={g.key} className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between gap-2 px-1 pb-3">
                  <h3 className="text-[15px] font-medium text-ink">{g.title}</h3>
                  <span className="flex gap-1.5 flex-wrap justify-end">
                    {summary.map(s => (
                      <span key={s.text} className={cx('text-[12px] px-2 py-0.5 rounded-full', TONE[s.tone].soft, TONE[s.tone].ink)}>
                        {s.text}
                      </span>
                    ))}
                  </span>
                </div>

                <ol className="relative">
                  {g.items.map((event, i) => {
                    const { tone, icon } = look(event);
                    const last = i === g.items.length - 1;
                    const ongoing = event.type === 'sleep' && event.details?.isOngoing;
                    return (
                      <li key={event.id} className="relative flex gap-3 pb-2.5">
                        {/* the rail: a line from this node down to the next one */}
                        {!last && <span aria-hidden="true" className="absolute top-11 bottom-0 start-[19px] w-0.5 rounded-full bg-line" />}
                        <span
                          aria-hidden="true"
                          className={cx(
                            'relative z-[1] w-10 h-10 rounded-full flex items-center justify-center shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px] ring-4 ring-surface',
                            TONE[tone].soft,
                            TONE[tone].icon,
                            ongoing && 'animate-soft-pulse'
                          )}
                        >
                          {React.cloneElement(icon as React.ReactElement<{ strokeWidth?: number }>, { strokeWidth: 1.8 })}
                        </span>

                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0 flex flex-col gap-1.5 pt-1.5">
                              <EventBody event={event} sinceLastFeed={sinceLastFeed.get(event.id)} />
                            </div>
                            <span className="pt-2 text-[13px] text-muted tabular-nums">{formatTime(event.started_at)}</span>
                            <IconButton label="מחיקה" tone="ghost" className="-me-2 opacity-60" onClick={() => setEventToDelete(event)}>
                              <Trash2 strokeWidth={1.6} />
                            </IconButton>
                          </div>
                          {event.notes && <p className="text-[13px] text-muted bg-sunken rounded-xl px-3 py-2">{event.notes}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!eventToDelete}
        title="למחוק את הרישום?"
        description="הרישום יימחק מהיומן ומכל המכשירים המחוברים."
        confirmText="מחיקה"
        cancelText="ביטול"
        onConfirm={() => {
          if (eventToDelete) {
            onDeleteEvent(eventToDelete.id);
            setEventToDelete(null);
          }
        }}
        onClose={() => setEventToDelete(null)}
      />
    </section>
  );
};
