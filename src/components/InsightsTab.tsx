import React from 'react';
import { Check, Droplets, Milk, Moon, Clock, Baby } from 'lucide-react';
import { BabyEvent, BabyProfile } from '../types';
import { computeStats } from '../lib/analyticsUtils';
import { calculateAge, formatTime } from '../lib/babyUtils';
import { Button, Card, IconBadge, SectionTitle, Tone } from './ui';
import { HistoryPeriod, filterEventsForPeriod, formatHours } from './SummaryTab';
import { formatDuration } from './TimelineList';

/*
 * Quiet insights for the History tab: a reassuring diaper-soft note when things
 * are in the normal range, then small rows inside one card.
 */

interface InsightRow {
  id: string;
  tone: Tone;
  icon: React.ReactNode;
  title: string;
  description?: string;
  extra?: React.ReactNode;
}

const ICON = { strokeWidth: 1.75 };

const WET_GOAL = 5; // טיפת חלב: at least 5 wet diapers a day

function expectedWakeMinutes(weeks: number): number {
  if (weeks >= 18) return 120;
  if (weeks >= 12) return 90;
  if (weeks >= 4) return 75;
  return 60;
}

export const InsightsCard: React.FC<{
  events: BabyEvent[];
  profile: BabyProfile;
  period: HistoryPeriod;
  onOpenFeeding: () => void;
  onOpenSleep: () => void;
}> = ({ events, profile, period, onOpenFeeding, onOpenSleep }) => {
  const filtered = filterEventsForPeriod(events, period);
  const stats = computeStats(filtered);
  const days = period === 'week' ? 7 : 1;
  const isToday = period === 'today';

  const sortedDesc = [...events].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  const last24h = events.filter(e => Date.now() - new Date(e.started_at).getTime() <= 24 * 3600000);
  const stats24h = computeStats(last24h);

  const rows: InsightRow[] = [];

  // --- Fluids (wet diapers vs. טיפת חלב goal)
  const wetPerDay = stats.peeCount / days;
  const wetGoalMet = wetPerDay >= WET_GOAL;
  if (stats.totalDiapers > 0 || isToday) {
    const wetText = period === 'week'
      ? `כ-${Number(wetPerDay.toFixed(1))} חיתולים רטובים ביום`
      : `${stats.peeCount} חיתולים רטובים${isToday ? ' עד עכשיו' : ''}`;
    const parts = [`יעד טיפת חלב: ${WET_GOAL} ומעלה ביממה`];
    if (stats.poopCount > 0) parts.push(`${stats.poopCount} יציאות`);
    const colors = Object.keys(stats.poopColors);
    if (colors.includes('צהוב חרדלי')) parts.push('צבע חרדלי, סימן לעיכול טוב');
    else if (colors.length > 0) parts.push(`צבע: ${colors.join(', ')}`);
    rows.push({ id: 'fluids', tone: 'diaper', icon: <Droplets {...ICON} />, title: wetText, description: parts.join(' · ') });
  }

  // --- Feeding rhythm
  if (stats.averageFeedingIntervalHours) {
    const amount = stats.totalBottleMl > 0
      ? `${stats.totalBottleMl} מ"ל בבקבוק`
      : stats.totalNursingMinutes > 0
      ? `${formatDuration(stats.totalNursingMinutes)} הנקה`
      : undefined;
    rows.push({
      id: 'interval',
      tone: 'feed',
      icon: <Milk {...ICON} />,
      title: `האכלה בממוצע כל ${stats.averageFeedingIntervalHours} שעות`,
      description: amount ? `סך הכל ${amount}` : undefined,
    });
  } else if (stats.totalFeedings > 0) {
    rows.push({
      id: 'interval',
      tone: 'feed',
      icon: <Milk {...ICON} />,
      title: `${stats.totalFeedings} האכלות`,
      description: stats.totalBottleMl > 0 ? `סך הכל ${stats.totalBottleMl} מ"ל בבקבוק` : undefined,
    });
  }

  // --- Next feeding prediction (today only, based on the last 24h rhythm)
  if (isToday) {
    const lastFeed = sortedDesc.find(e => e.type === 'feeding');
    const interval = stats24h.averageFeedingIntervalHours;
    const sideHint = stats24h.nextRecommendedSide
      ? `כדאי להתחיל מצד ${stats24h.nextRecommendedSide === 'left' ? 'שמאל' : 'ימין'}`
      : undefined;
    if (lastFeed && interval) {
      const next = new Date(lastFeed.started_at).getTime() + interval * 3600000;
      const due = next <= Date.now();
      rows.push({
        id: 'next-feed',
        tone: 'feed',
        icon: <Clock {...ICON} />,
        title: due ? 'ייתכן שהיא כבר מוכנה לארוחה' : `האכלה הבאה בסביבות ${formatTime(new Date(next).toISOString())}`,
        description: [`לפי הקצב של היממה האחרונה`, sideHint].filter(Boolean).join(' · '),
      });
    } else if (sideHint) {
      rows.push({ id: 'next-feed', tone: 'feed', icon: <Clock {...ICON} />, title: sideHint, description: 'החלפת צד שומרת על ייצור חלב מאוזן' });
    }
  }

  // --- Breast balance
  const totalSide = stats.leftBreastMinutes + stats.rightBreastMinutes;
  if (totalSide > 0) {
    const rightPct = Math.round((stats.rightBreastMinutes / totalSide) * 100);
    rows.push({
      id: 'balance',
      tone: 'feed',
      icon: <Baby {...ICON} />,
      title: `ימין ${formatDuration(stats.rightBreastMinutes)} · שמאל ${formatDuration(stats.leftBreastMinutes)}`,
      extra: (
        <div className="mt-2 h-1.5 rounded-full bg-sunken overflow-hidden flex" aria-hidden="true">
          <span className="h-full bg-feed" style={{ width: `${rightPct}%` }} />
          <span className="h-full bg-feed-soft" style={{ width: `${100 - rightPct}%` }} />
        </div>
      ),
    });
  }

  // --- Sleep: day vs. night
  if (stats.totalSleepMinutes > 0) {
    rows.push({
      id: 'sleep-split',
      tone: 'sleep',
      icon: <Moon {...ICON} />,
      title: `שנת לילה ${formatHours(stats.nightSleepMinutes)} ש׳ · שנת יום ${formatHours(stats.daySleepMinutes)} ש׳`,
      description: `${stats.sleepSessionsCount} תנומות · לילה נספר בין 20:00 ל-07:00`,
    });
  }

  // --- Sleep now / next nap (today only, wake-window by age)
  if (isToday) {
    const lastSleep = sortedDesc.find(e => e.type === 'sleep');
    const wake = expectedWakeMinutes(calculateAge(profile.birth_date).totalWeeks);
    if (lastSleep?.details?.isOngoing) {
      rows.push({ id: 'sleep-now', tone: 'sleep', icon: <Moon {...ICON} />, title: 'ישנה עכשיו', description: 'זמן טוב לנוח גם אתם' });
    } else if (lastSleep?.ended_at) {
      const awake = Math.floor((Date.now() - new Date(lastSleep.ended_at).getTime()) / 60000);
      const left = wake - awake;
      if (left <= 0) {
        rows.push({
          id: 'nap',
          tone: 'sleep',
          icon: <Moon {...ICON} />,
          title: `ערה כבר ${formatDuration(awake)}`,
          description: `חלון הערות המקובל לגילה הוא כ-${formatDuration(wake)}. זה זמן טוב להתחיל להרגיע`,
        });
      } else {
        rows.push({
          id: 'nap',
          tone: 'sleep',
          icon: <Moon {...ICON} />,
          title: `תנומה הבאה בסביבות ${formatTime(new Date(Date.now() + left * 60000).toISOString())}`,
          description: `ערה ${formatDuration(awake)} · חלון ערות לגילה כ-${formatDuration(wake)}`,
        });
      }
    }
  }

  const interval = stats.averageFeedingIntervalHours;
  const reassuring = wetGoalMet && filtered.length > 0;

  return (
    <section className="flex flex-col gap-3">
      {reassuring && (
        <div className="bg-diaper-soft rounded-[28px] p-5 flex items-start gap-3">
          <IconBadge tone="diaper" onSurface>
            <Check {...ICON} />
          </IconBadge>
          <div className="flex flex-col gap-0.5 pt-1.5">
            <span className="text-[15px] font-medium text-diaper-ink">הכל בטווח התקין</span>
            <span className="text-[13px] text-diaper-ink">
              {period === 'week'
                ? `כ-${Number(wetPerDay.toFixed(1))} חיתולים רטובים ביום, מעל יעד טיפת חלב`
                : `${stats.peeCount} חיתולים רטובים, מעל יעד טיפת חלב`}
              {interval ? ` · האכלה כל ${interval} שעות בממוצע` : ''}
            </span>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <SectionTitle className="mt-2">תובנות</SectionTitle>
          <Card className="px-[18px] py-2">
            <ul className="divide-y divide-line">
              {rows.map(r => (
                <li key={r.id} className="flex items-start gap-3 py-3.5">
                  <IconBadge tone={r.tone} size="sm">
                    {r.icon}
                  </IconBadge>
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5 pt-1">
                    <span className="text-[15px] text-ink tabular-nums">{r.title}</span>
                    {r.description && <span className="text-[13px] text-muted tabular-nums">{r.description}</span>}
                    {r.extra}
                  </div>
                </li>
              ))}
            </ul>
            {isToday && (
              <div className="grid grid-cols-2 gap-3 pt-2 pb-3">
                <Button variant="primary" tone="feed" size="md" onClick={onOpenFeeding}>
                  <Milk {...ICON} />
                  רישום האכלה
                </Button>
                <Button variant="primary" tone="sleep" size="md" onClick={onOpenSleep}>
                  <Moon {...ICON} />
                  מעקב שינה
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </section>
  );
};

/* Legacy standalone insights screen (kept for compatibility; HistoryTab composes InsightsCard directly). */
interface InsightsTabProps {
  events: BabyEvent[];
  profile: BabyProfile;
  onOpenFeeding: () => void;
  onOpenSleep: () => void;
}

export const InsightsTab: React.FC<InsightsTabProps> = props => <InsightsCard {...props} period="today" />;
