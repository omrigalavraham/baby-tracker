import React, { useEffect, useState } from 'react';
import { Droplet, Milk, Moon, Scale } from 'lucide-react';
import { BabyEvent, BabyProfile } from '../../types';
import { formatTimeAgo } from '../../lib/babyUtils';
import { SectionTitle, TONE, Tone, cx } from '../ui';

interface ActivityTilesProps {
  events: BabyEvent[];
  profile: BabyProfile;
  isSleeping: boolean;
  /** Last logged event type; its tile glows once */
  justLogged?: { type: string; key: number } | null;
  onOpenFeeding: () => void;
  onOpenDiaper: () => void;
  onOpenSleep: () => void;
  onOpenWeight: () => void;
}

// Glow color for the 'just logged' pulse, from the tone token
const GLOW: Partial<Record<Tone, string>> = {
  feed: 'color-mix(in srgb, var(--c-feed) 35%, transparent)',
  sleep: 'color-mix(in srgb, var(--c-sleep) 35%, transparent)',
  diaper: 'color-mix(in srgb, var(--c-diaper) 35%, transparent)',
  weight: 'color-mix(in srgb, var(--c-weight) 35%, transparent)',
};

function feedingDetail(e?: BabyEvent) {
  if (!e) return 'עוד לא נרשם';
  const d = e.details || {};
  if (d.feedType === 'breast') {
    const side = d.breastSide === 'left' ? 'שמאל' : d.breastSide === 'right' ? 'ימין' : 'שני הצדדים';
    return `${formatTimeAgo(e.started_at)} · הנקה, ${side}`;
  }
  if (d.feedType === 'bottle') {
    return `${formatTimeAgo(e.started_at)} · בקבוק${d.bottleAmountMl ? ` ${d.bottleAmountMl} מ"ל` : ''}`;
  }
  if (d.feedType === 'solids') return `${formatTimeAgo(e.started_at)} · מוצקים`;
  return formatTimeAgo(e.started_at);
}

function diaperDetail(e?: BabyEvent) {
  if (!e) return 'עוד לא נרשם';
  const t = e.details?.diaperType;
  const kind = t === 'pee' ? 'פיפי' : t === 'poop' ? 'קקי' : 'פיפי וקקי';
  return `${formatTimeAgo(e.started_at)} · ${kind}`;
}

function sleepDetail(e: BabyEvent | undefined, isSleeping: boolean) {
  if (isSleeping) return 'ישנה עכשיו';
  if (!e) return 'עוד לא נרשם';
  return `התעוררה ${formatTimeAgo(e.ended_at || e.started_at)}`;
}

export const ActivityTiles: React.FC<ActivityTilesProps> = ({
  events,
  profile,
  isSleeping,
  justLogged,
  onOpenFeeding,
  onOpenDiaper,
  onOpenSleep,
  onOpenWeight,
}) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const lastFeeding = events.find(e => e.type === 'feeding');
  const lastDiaper = events.find(e => e.type === 'diaper');
  const lastSleep = events.find(e => e.type === 'sleep');
  const lastWeight = events.find(e => e.type === 'weight');
  const weightKg = lastWeight?.details?.weightKg || profile.birth_weight;
  const lastHeight = events.find(e => e.type === 'height');
  const growthParts = [weightKg ? `${weightKg} ק"ג` : null, lastHeight ? `${lastHeight.details?.heightCm} ס"מ` : null].filter(Boolean);

  const tiles: { type: string; tone: Tone; title: string; detail: string; icon: React.ReactNode; onClick: () => void }[] = [
    { type: 'feeding', tone: 'feed', title: 'האכלה', detail: feedingDetail(lastFeeding), icon: <Milk />, onClick: onOpenFeeding },
    { type: 'sleep', tone: 'sleep', title: 'שינה', detail: sleepDetail(lastSleep, isSleeping), icon: <Moon />, onClick: onOpenSleep },
    { type: 'diaper', tone: 'diaper', title: 'חיתול', detail: diaperDetail(lastDiaper), icon: <Droplet />, onClick: onOpenDiaper },
    {
      type: 'weight',
      tone: 'weight',
      title: 'גדילה',
      detail: growthParts.length ? growthParts.join(' · ') : 'עוד לא נרשם',
      icon: <Scale />,
      onClick: onOpenWeight,
    },
  ];

  return (
    <section aria-label="פעילויות" className="flex flex-col gap-3">
      <SectionTitle>{isSleeping ? 'רישום מהיר' : 'מה היה לאחרונה'}</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map(t => {
          const glowing = justLogged?.type === t.type || (t.type === 'weight' && justLogged?.type === 'height');
          return (
          <button
            key={glowing ? `${t.type}-${justLogged!.key}` : t.type}
            onClick={t.onClick}
            className={cx(
              'h-28 rounded-[28px] p-4 flex flex-col justify-between items-start text-right text-ink transition-transform duration-200 ease-out active:scale-[0.97]',
              TONE[t.tone].soft,
              glowing && 'animate-tile-logged'
            )}
            style={{ '--glow': GLOW[t.tone] } as React.CSSProperties}
          >
            <span
              aria-hidden="true"
              className={cx(
                'w-[38px] h-[38px] rounded-full bg-surface night:bg-white/5 flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5',
                TONE[t.tone].icon
              )}
            >
              {React.cloneElement(t.icon as React.ReactElement<{ strokeWidth?: number }>, { strokeWidth: 1.6 })}
            </span>
            <span className="flex flex-col min-w-0 w-full">
              <span className="text-base font-medium">{t.title}</span>
              <span className={cx('text-[13px] truncate', TONE[t.tone].ink)}>{t.detail}</span>
            </span>
          </button>
          );
        })}
      </div>
    </section>
  );
};
