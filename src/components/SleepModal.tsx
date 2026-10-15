import React, { useState, useEffect } from 'react';
import { Check, Moon, Play, Sun } from 'lucide-react';
import { BabyEvent } from '../types';
import { formatLiveDuration, formatTime } from '../lib/babyUtils';
import { Sheet, Button, Field, Segmented, fieldClass } from './ui';

interface SleepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (eventData: Partial<BabyEvent>) => void;
  activeSleepEvent?: BabyEvent;
  onEndSleepEvent: (eventId: string, endedAt: string, durationMinutes: number) => void;
}

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export const SleepModal: React.FC<SleepModalProps> = ({
  isOpen,
  onClose,
  onSaveEvent,
  activeSleepEvent,
  onEndSleepEvent
}) => {
  const [mode, setMode] = useState<'live' | 'manual'>('live');

  // Manual times
  const [startTime, setStartTime] = useState<string>(() => hhmm(new Date(Date.now() - 60 * 60000)));
  const [endTime, setEndTime] = useState<string>(() => hhmm(new Date()));
  const [notes, setNotes] = useState('');

  const isSleepingNow = !!activeSleepEvent?.details?.isOngoing;

  // Refresh manual defaults each time the sheet opens
  useEffect(() => {
    if (!isOpen) return;
    setStartTime(hhmm(new Date(Date.now() - 60 * 60000)));
    setEndTime(hhmm(new Date()));
  }, [isOpen]);

  // Calm live counter (minutes precision, no need to re-render every second)
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isSleepingNow || !isOpen) return;
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, [isSleepingNow, isOpen]);

  const handleStartLiveSleep = () => {
    onSaveEvent({
      type: 'sleep',
      started_at: new Date().toISOString(),
      details: {
        isOngoing: true
      },
      notes: notes || undefined
    });
    setNotes('');
    onClose();
  };

  const handleWakeUp = () => {
    if (!activeSleepEvent) return;
    const start = new Date(activeSleepEvent.started_at).getTime();
    const now = Date.now();
    const durationMinutes = Math.max(1, Math.round((now - start) / 60000));

    onEndSleepEvent(activeSleepEvent.id, new Date().toISOString(), durationMinutes);
    onClose();
  };

  const handleSaveManualSleep = () => {
    const now = new Date();
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm);
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em);

    // If end time is before start time, it likely crossed midnight
    if (endDate.getTime() < startDate.getTime()) {
      endDate = new Date(endDate.getTime() + 24 * 60 * 60000);
    }

    const durationMinutes = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 60000));

    onSaveEvent({
      type: 'sleep',
      started_at: startDate.toISOString(),
      ended_at: endDate.toISOString(),
      details: {
        durationMinutes,
        isOngoing: false
      },
      notes: notes || undefined
    });

    setNotes('');
    onClose();
  };

  const live = isSleepingNow && activeSleepEvent ? formatLiveDuration(activeSleepEvent.started_at) : null;

  const footer =
    mode === 'manual' ? (
      <Button block tone="sleep" onClick={handleSaveManualSleep}>
        <Check />
        <span>שמירה</span>
      </Button>
    ) : isSleepingNow ? (
      <Button block tone="sleep" onClick={handleWakeUp}>
        <Sun />
        <span>התעוררה</span>
      </Button>
    ) : (
      <Button block tone="sleep" onClick={handleStartLiveSleep}>
        <Play />
        <span>להתחיל טיימר שינה</span>
      </Button>
    );

  return (
    <Sheet open={isOpen} onClose={onClose} title="שינה" icon={<Moon />} tone="sleep" footer={footer}>
      <Segmented
        label="אופן הרישום"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'live', label: 'עכשיו' },
          { value: 'manual', label: 'הוספה ידנית' }
        ]}
      />

      {mode === 'live' ? (
        isSleepingNow && activeSleepEvent && live ? (
          <div className="space-y-3">
            <div className="bg-sleep-soft rounded-[28px] px-6 py-8 flex flex-col items-center text-center gap-3">
              <Moon className="w-7 h-7 text-sleep" aria-hidden="true" />
              <span className="text-[15px] text-sleep-ink">ישנה</span>
              <span className="text-[40px] leading-none font-medium text-sleep-ink tabular-nums" dir="ltr">
                {live.hours}:{String(live.minutes).padStart(2, '0')}
              </span>
              <span className="text-[13px] text-sleep-ink">נרדמה ב-{formatTime(activeSleepEvent.started_at)}</span>
            </div>
            <p className="text-[13px] text-muted text-center px-2">
              אפשר לסגור את החלון, הזמן ממשיך להימדד.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center gap-2 pt-2">
              <p className="text-[15px] text-ink">נרדמה עכשיו?</p>
              <p className="text-[13px] text-muted">מפעילים טיימר ורואים בכל רגע כמה זמן היא ישנה.</p>
            </div>
            <Field label="הערה (לא חובה)">
              <input
                type="text"
                placeholder="בעגלה, במיטה שלה..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className={fieldClass}
              />
            </Field>
          </div>
        )
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="נרדמה ב">
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={fieldClass} />
            </Field>
            <Field label="התעוררה ב">
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={fieldClass} />
            </Field>
          </div>

          <Field label="הערה (לא חובה)">
            <input
              type="text"
              placeholder="איפה ישנה, האם ברצף..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className={fieldClass}
            />
          </Field>
        </div>
      )}
    </Sheet>
  );
};
