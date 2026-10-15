import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { BabyEvent } from '../types';
import { formatTime } from '../lib/babyUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { Card, IconButton, SectionTitle, cx } from './ui';

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

const DOT: Record<string, string> = {
  feeding: 'bg-feed',
  sleep: 'bg-sleep',
  diaper: 'bg-diaper',
  weight: 'bg-weight',
  height: 'bg-weight',
  milestone: 'bg-primary',
};

function describe(event: BabyEvent): { main: string; extra?: string } {
  const d = event.details || {};
  if (event.type === 'feeding') {
    if (d.feedType === 'breast') {
      const side = d.breastSide === 'left' ? 'שמאל' : d.breastSide === 'right' ? 'ימין' : 'שני הצדדים';
      const dur = d.durationMinutes ? ` · ${formatDuration(d.durationMinutes)}` : '';
      return { main: `האכלה · הנקה, ${side}${dur}` };
    }
    if (d.feedType === 'solids') return { main: 'האכלה · מוצקים' };
    const content = d.bottleContent === 'breast_milk' ? 'חלב שאוב' : d.bottleContent === 'water' ? 'מים' : 'תמ"ל';
    return { main: `האכלה · בקבוק ${d.bottleAmountMl || 0} מ"ל`, extra: content };
  }
  if (event.type === 'diaper') {
    const kind = d.diaperType === 'pee' ? 'פיפי' : d.diaperType === 'poop' ? 'קקי' : 'פיפי וקקי';
    return { main: `חיתול · ${kind}`, extra: d.poopColor ? `צבע: ${d.poopColor}` : undefined };
  }
  if (event.type === 'sleep') {
    if (d.isOngoing) return { main: 'שינה · ישנה עכשיו' };
    const until = event.ended_at ? `עד ${formatTime(event.ended_at)}` : undefined;
    return { main: `שינה · ${formatDuration(d.durationMinutes || 0)}`, extra: until };
  }
  if (event.type === 'weight') return { main: `שקילה · ${d.weightKg} ק"ג` };
  if (event.type === 'height') return { main: `גובה · ${d.heightCm} ס"מ` };
  if (event.type === 'milestone') return { main: `אבן דרך · ${d.title || ''}` };
  return { main: 'רישום' };
}

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

export const TimelineList: React.FC<TimelineListProps> = ({
  events,
  onDeleteEvent,
  title = 'מה קרה היום',
  emptyText = 'עוד לא נרשם כלום. כל רישום יופיע כאן.',
}) => {
  const [eventToDelete, setEventToDelete] = useState<BabyEvent | null>(null);

  const sorted = [...events].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

  // Group by local calendar day, newest first
  const groups: { key: string; title: string; items: BabyEvent[] }[] = [];
  sorted.forEach(ev => {
    const key = localDayKey(ev.started_at);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(ev);
    else groups.push({ key, title: dayTitle(ev.started_at), items: [ev] });
  });
  const multiDay = groups.length > 1;

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle aside={events.length > 0 ? `${events.length} רישומים` : undefined}>{title}</SectionTitle>

      {events.length === 0 ? (
        <Card className="px-[22px] py-8 text-center">
          <p className="text-[15px] text-muted">{emptyText}</p>
        </Card>
      ) : (
        <Card className="px-[18px] py-3">
          {groups.map((g, gi) => (
            <div key={g.key} className={cx(gi > 0 && 'border-t border-line mt-2 pt-2')}>
              {multiDay && <h3 className="px-1 pt-2 pb-1 text-[13px] text-muted">{g.title}</h3>}
              <ol>
                {g.items.map(event => {
                  const { main, extra } = describe(event);
                  return (
                    <li key={event.id} className="flex items-center gap-3 min-h-[52px] py-1.5">
                      <span className="w-12 shrink-0 text-[13px] text-muted tabular-nums">{formatTime(event.started_at)}</span>
                      <span
                        aria-hidden="true"
                        className={cx('w-2.5 h-2.5 rounded-full shrink-0', DOT[event.type] || 'bg-faint')}
                      />
                      <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-[15px] text-ink truncate">{main}</span>
                        {(extra || event.notes) && (
                          <span className="text-[13px] text-muted truncate">
                            {[extra, event.notes].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </div>
                      <IconButton label="מחיקה" tone="ghost" onClick={() => setEventToDelete(event)}>
                        <Trash2 strokeWidth={1.75} />
                      </IconButton>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </Card>
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
