import React, { useState } from 'react';
import { Droplet, Milk, Moon, Ruler, Scale, Star, Trash2 } from 'lucide-react';
import { BabyEvent } from '../types';
import { formatTime } from '../lib/babyUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { Card, IconButton, SectionTitle, TONE, Tone, cx } from './ui';
import { shortText } from './history/DayLanes';
import { Category, categoryOf, shows } from './history/TypeFilter';

interface TimelineListProps {
  events: BabyEvent[];
  onDeleteEvent: (id: string) => void;
  /** Types to show; empty shows everything */
  filters?: Category[];
  onClearFilters?: () => void;
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
  filters = [],
  onClearFilters,
  title = 'מה קרה היום',
  emptyText = 'עוד לא נרשם כלום. כל רישום יופיע כאן.',
}) => {
  const [eventToDelete, setEventToDelete] = useState<BabyEvent | null>(null);

  const visible = [...events]
    .filter(e => shows(filters, categoryOf(e)))
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

  // Group by local calendar day, newest first
  const groups: { key: string; title: string; items: BabyEvent[] }[] = [];
  visible.forEach(ev => {
    const key = localDayKey(ev.started_at);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(ev);
    else groups.push({ key, title: dayTitle(ev.started_at), items: [ev] });
  });
  const multiDay = groups.length > 1;

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle aside={visible.length > 0 ? `${visible.length} רישומים` : undefined}>{title}</SectionTitle>

      {events.length === 0 ? (
        <Card className="px-[22px] py-8 text-center">
          <p className="text-[15px] text-muted">{emptyText}</p>
        </Card>
      ) : visible.length === 0 ? (
        <Card className="px-[22px] py-8 text-center flex flex-col items-center gap-3">
          <p className="text-[15px] text-muted">אין רישומים מהסוג שבחרתם בתקופה הזו.</p>
          {onClearFilters && (
            <button onClick={onClearFilters} className="text-[14px] font-medium text-primary-ink">
              הצגת הכול
            </button>
          )}
        </Card>
      ) : (
        <Card className="px-4 py-2">
          {groups.map((g, gi) => (
            <div key={g.key} className={cx(gi > 0 && 'border-t border-line mt-1 pt-1')}>
              {multiDay && <h3 className="px-1 pt-3 pb-1 text-[13px] text-muted">{g.title}</h3>}
              <ol>
                {g.items.map(event => {
                  const { tone, icon } = look(event);
                  const ongoing = event.type === 'sleep' && event.details?.isOngoing;
                  return (
                    <li key={event.id} className="flex items-center gap-3 min-h-[56px] py-1">
                      <span
                        aria-hidden="true"
                        className={cx(
                          'w-9 h-9 rounded-full flex items-center justify-center shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px]',
                          TONE[tone].soft,
                          TONE[tone].icon,
                          ongoing && 'animate-soft-pulse'
                        )}
                      >
                        {React.cloneElement(icon as React.ReactElement<{ strokeWidth?: number }>, { strokeWidth: 1.8 })}
                      </span>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-[15px] text-ink truncate">{shortText(event)}</span>
                        {event.notes && <span className="text-[13px] text-muted truncate">{event.notes}</span>}
                      </div>
                      <span className="text-[13px] text-muted tabular-nums shrink-0">{formatTime(event.started_at)}</span>
                      <IconButton label="מחיקה" tone="ghost" className="-me-2" onClick={() => setEventToDelete(event)}>
                        <Trash2 strokeWidth={1.6} />
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
