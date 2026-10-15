import React, { useState } from 'react';
import { DailyReminderItem } from '../../types';
import { CheckCircle, cx } from '../ui';

interface ReminderStripProps {
  pending: DailyReminderItem[];
  onComplete: (item: DailyReminderItem) => void;
  onOpenAll: () => void;
}

export const ReminderStrip: React.FC<ReminderStripProps> = ({ pending, onComplete, onOpenAll }) => {
  // Let the check draw itself before the item leaves the strip
  const [completingId, setCompletingId] = useState<string | null>(null);

  if (pending.length === 0) return null;
  const first = pending[0];
  const completing = completingId === first.id;

  const complete = () => {
    if (completingId) return;
    setCompletingId(first.id);
    setTimeout(() => {
      onComplete(first);
      setCompletingId(null);
    }, 650);
  };

  return (
    <section aria-label="תזכורת" className="flex items-center gap-2.5 py-1 ps-1.5 pe-4 rounded-3xl bg-weight-soft overflow-hidden">
      <button aria-label={`סימון ${first.title} כבוצע`} onClick={complete} className="w-11 h-11 flex items-center justify-center shrink-0">
        <CheckCircle done={completing} />
      </button>
      <span
        key={first.id}
        className={cx(
          'flex-1 min-w-0 truncate text-sm text-weight-ink transition-all duration-500',
          completing ? 'opacity-40 translate-x-2' : 'animate-view-in'
        )}
      >
        נשאר להיום: <span className={cx('font-medium text-ink', completing && 'line-through decoration-faint')}>{first.title}</span>
      </span>
      {pending.length > 1 && (
        <button onClick={onOpenAll} className="text-[13px] text-weight-ink py-3 px-1.5 shrink-0">
          ועוד {pending.length - 1}
        </button>
      )}
    </section>
  );
};
