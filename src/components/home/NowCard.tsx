import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { BabyEvent, SmartTimersConfig } from '../../types';
import { formatTime } from '../../lib/babyUtils';
import { Button, Card } from '../ui';

interface NowCardProps {
  events: BabyEvent[];
  activeSleep?: BabyEvent;
  smartTimers: SmartTimersConfig;
  onToggleSleep: () => void;
}

const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;

function minutesSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

function clock(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

function humanDuration(totalMinutes: number) {
  if (totalMinutes < 1) return 'פחות מדקה';
  if (totalMinutes < 60) return `${totalMinutes} דקות`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const hours = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : `${h} שעות`;
  if (m < 10) return `כ${hours}`;
  if (m >= 50) return h + 1 === 2 ? 'כשעתיים' : `כ-${h + 1} שעות`;
  return `${hours} ו-${m} דק'`;
}

export const NowCard: React.FC<NowCardProps> = ({ events, activeSleep, smartTimers, onToggleSleep }) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const lastFeed = events.find(e => e.type === 'feeding');
  const lastEndedSleep = events.find(e => e.type === 'sleep' && e.ended_at && !e.details?.isOngoing);

  if (activeSleep) {
    const asleep = minutesSince(activeSleep.started_at);
    return (
      <Card key="asleep" className="p-[22px] flex flex-col gap-[18px] night:bg-sleep-soft animate-view-in">
        <div className="flex items-center gap-[18px]">
          <div className="relative w-[124px] h-[124px] shrink-0">
            <svg width="124" height="124" viewBox="0 0 124 124" aria-hidden="true">
              <circle cx="62" cy="62" r={RING_R} fill="none" className="stroke-sunken" strokeWidth="9" />
              <circle cx="62" cy="62" r="40" className="fill-sleep-soft night:fill-sunken" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Moon className="w-[18px] h-[18px] text-sleep animate-float-slow" strokeWidth={1.75} />
              <span className="text-[28px] font-medium leading-tight tabular-nums mt-1">{clock(asleep)}</span>
              <span className="text-[13px] text-muted">שעות שינה</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="text-lg font-medium">ישנה בשקט</span>
            <span className="text-sm text-muted">נרדמה ב-{formatTime(activeSleep.started_at)}</span>
            {lastFeed && (
              <span className="text-sm text-muted">אכלה לאחרונה לפני {humanDuration(minutesSince(lastFeed.started_at))}</span>
            )}
          </div>
        </div>
        <Button tone="sleep" block onClick={onToggleSleep}>
          <Sun strokeWidth={1.75} />
          התעוררה
        </Button>
      </Card>
    );
  }

  const awake = lastEndedSleep?.ended_at ? minutesSince(lastEndedSleep.ended_at) : null;
  const windowMin = smartTimers.wakeWindowMinutes;
  const progress = awake !== null && windowMin > 0 ? Math.min(1, awake / windowMin) : 0;
  const remaining = awake !== null && windowMin > 0 ? windowMin - awake : null;

  let nextFeedText: string | null = null;
  if (lastFeed && smartTimers.feedingIntervalMinutes > 0) {
    const next = new Date(new Date(lastFeed.started_at).getTime() + smartTimers.feedingIntervalMinutes * 60000);
    nextFeedText =
      next.getTime() > Date.now()
        ? `ההאכלה הבאה כנראה סביב ${formatTime(next.toISOString())}`
        : 'אולי כבר רעבה, עברו כמה שעות מההאכלה האחרונה';
  }

  return (
    <Card key="awake" className="p-[22px] flex flex-col gap-[18px] animate-view-in">
      <div className="flex items-center gap-[18px]">
        <div className="relative w-[124px] h-[124px] shrink-0">
          <svg
            width="124"
            height="124"
            viewBox="0 0 124 124"
            role="img"
            aria-label={awake !== null && windowMin > 0 ? `ערה ${clock(awake)} מתוך חלון ערות של ${clock(windowMin)}` : 'ערה'}
          >
            <circle cx="62" cy="62" r={RING_R} fill="none" className="stroke-sunken" strokeWidth="9" />
            {progress > 0 && (
              <circle
                cx="62"
                cy="62"
                r={RING_R}
                fill="none"
                className="stroke-primary transition-[stroke-dashoffset] duration-1000"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - progress)}
                transform="rotate(-90 62 62)"
                style={{ '--ring-from': RING_C, animation: 'ring-in 1.4s var(--ease-soft) 0.35s both' } as React.CSSProperties}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {awake !== null ? (
              <>
                <span className="text-[30px] font-medium leading-none tabular-nums">{clock(awake)}</span>
                <span className="text-[13px] text-muted mt-1">ערה</span>
              </>
            ) : (
              <Sun className="w-7 h-7 text-weight" strokeWidth={1.5} />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-lg font-medium">{remaining !== null && remaining <= 0 ? 'אולי מתחילה להתעייף' : 'ערה ורגועה'}</span>
          {lastEndedSleep?.ended_at ? (
            <span className="text-sm text-muted">
              התעוררה ב-{formatTime(lastEndedSleep.ended_at)}
              {lastEndedSleep.details?.durationMinutes ? ` אחרי שינה של ${humanDuration(lastEndedSleep.details.durationMinutes)}` : ''}
            </span>
          ) : (
            <span className="text-sm text-muted">כשהיא נרדמת, הקישו למטה ונספור בשבילכם</span>
          )}
          {remaining !== null && remaining > 0 && remaining <= 30 && (
            <span className="text-sm text-muted">כנראה תתעייף בעוד כ-{remaining} דקות</span>
          )}
          {remaining !== null && remaining <= 0 && <span className="text-sm text-muted">זה זמן טוב להתחיל להרגיע לשינה</span>}
          {nextFeedText && <span className="text-sm text-muted">{nextFeedText}</span>}
        </div>
      </div>

      <Button tone="sleep" block onClick={onToggleSleep}>
        <Moon strokeWidth={1.75} />
        להשכיב לישון
      </Button>
    </Card>
  );
};
