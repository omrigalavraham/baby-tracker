import React, { useState } from 'react';
import { BabyEvent } from '../types';
import { formatTime, formatDate } from '../lib/babyUtils';
import { Milk, Droplets, Moon, Scale, Trash2 } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface TimelineListProps {
  events: BabyEvent[];
  onDeleteEvent: (id: string) => void;
}

export const TimelineList: React.FC<TimelineListProps> = ({
  events,
  onDeleteEvent
}) => {
  const [eventToDelete, setEventToDelete] = useState<BabyEvent | null>(null);

  if (events.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center text-slate-400">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-rose-50 text-rose-300 flex items-center justify-center text-2xl">
          🍼
        </div>
        <p className="text-sm font-semibold text-slate-600">עדיין אין פעולות רשומות</p>
        <p className="text-xs text-slate-400 mt-1">השתמשו בכפתורי הרישום המהיר למעלה כדי להתחיל</p>
      </div>
    );
  }

  // Group events by day
  const groupedEvents: { [dayKey: string]: BabyEvent[] } = {};
  events.forEach(ev => {
    const dayKey = ev.started_at.slice(0, 10);
    if (!groupedEvents[dayKey]) groupedEvents[dayKey] = [];
    groupedEvents[dayKey].push(ev);
  });

  const todayKey = new Date().toISOString().slice(0, 10);
  const yesterdayKey = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  return (
    <div className="max-w-md mx-auto px-4 py-3 space-y-4">
      <div className="flex items-center justify-between text-right px-1">
        <h3 className="font-bold text-slate-700 text-sm">יומן פעילות יומי</h3>
        <span className="text-xs text-slate-400 font-medium">{events.length} רישומים</span>
      </div>

      {Object.entries(groupedEvents).map(([dayKey, dayEvents]) => {
        let dayTitle = formatDate(dayEvents[0].started_at);
        if (dayKey === todayKey) dayTitle = 'היום';
        else if (dayKey === yesterdayKey) dayTitle = 'אתמול';

        return (
          <div key={dayKey} className="space-y-2">
            <div className="sticky top-14 z-10 bg-slate-50/90 backdrop-blur-xs py-1 px-2 rounded-lg text-xs font-bold text-slate-500 text-right">
              📅 {dayTitle}
            </div>

            <div className="space-y-2">
              {dayEvents.map(event => {
                let icon = <Milk className="w-4 h-4" />;
                let iconBg = 'bg-rose-500 text-white';
                let title = 'פעולה';
                let subtitle = '';

                if (event.type === 'feeding') {
                  icon = <Milk className="w-4 h-4" />;
                  if (event.details?.feedType === 'breast') {
                    title = 'הנקה';
                    const side = event.details.breastSide === 'left' ? 'שמאל' : event.details.breastSide === 'right' ? 'ימין' : 'שני הצדדים';
                    subtitle = `צד: ${side} • ${event.details.durationMinutes || 0} דקות`;
                  } else {
                    title = 'בקבוק';
                    const content = event.details?.bottleContent === 'breast_milk' ? 'חלב שאוב' : 'תמ"ל';
                    subtitle = `${event.details?.bottleAmountMl || 0} מ"ל (${content})`;
                  }
                } else if (event.type === 'diaper') {
                  icon = <Droplets className="w-4 h-4" />;
                  iconBg = 'bg-sky-500 text-white';
                  const dType = event.details?.diaperType;
                  title = 'החלפת טיטול';
                  subtitle = dType === 'pee' ? 'פיפי 💧' : dType === 'poop' ? 'קקי 💩' : 'פיפי וקקי 💧💩';
                  if (event.details?.poopColor) subtitle += ` • צבע: ${event.details.poopColor}`;
                } else if (event.type === 'sleep') {
                  icon = <Moon className="w-4 h-4" />;
                  iconBg = 'bg-indigo-600 text-white';
                  title = 'שינה';
                  subtitle = event.details?.isOngoing 
                    ? 'ישנה כעת... 💤' 
                    : `משך שינה: ${event.details?.durationMinutes || 0} דקות`;
                } else if (event.type === 'weight') {
                  icon = <Scale className="w-4 h-4" />;
                  iconBg = 'bg-amber-500 text-white';
                  title = 'שקילה';
                  subtitle = `${event.details?.weightKg} ק"ג`;
                }

                return (
                  <div
                    key={event.id}
                    className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 text-right group hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                        {icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{title}</span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {formatTime(event.started_at)}
                            {event.ended_at && ` - ${formatTime(event.ended_at)}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          {subtitle}
                        </p>
                        {event.notes && (
                          <p className="text-[11px] text-slate-400 mt-0.5 italic">
                            "{event.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Delete action opens sleek custom modal */}
                    <button
                      onClick={() => setEventToDelete(event)}
                      className="text-slate-300 hover:text-rose-500 p-2 rounded-xl hover:bg-rose-50 transition-colors"
                      title="מחק רישום"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Sleek in-app custom delete confirmation modal */}
      <ConfirmDeleteModal
        isOpen={!!eventToDelete}
        title="למחוק פעולה זו מהיומן?"
        description="הפעולה תימחק לצמיתות מהיומן ומכל המכשירים המחוברים."
        confirmText="כן, מחק עכשיו"
        cancelText="ביטול"
        onConfirm={() => {
          if (eventToDelete) {
            onDeleteEvent(eventToDelete.id);
            setEventToDelete(null);
          }
        }}
        onClose={() => setEventToDelete(null)}
      />
    </div>
  );
};
