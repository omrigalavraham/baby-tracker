import React, { useEffect, useState } from 'react';
import { Droplet, Milk, Moon, Ruler, Scale, Sun } from 'lucide-react';
import { EventType } from '../../types';
import { IconBadge, Tone, cx } from '../ui';

export interface ToastData {
  key: number;
  type: EventType | 'wake';
  text: string;
  /** Event id to remove when the parent taps "ביטול" */
  undoId?: string;
}

const TONE_BY_TYPE: Record<string, Tone> = { feeding: 'feed', sleep: 'sleep', wake: 'weight', diaper: 'diaper', weight: 'weight', height: 'weight' };
const ICON_BY_TYPE: Record<string, React.ReactNode> = {
  feeding: <Milk strokeWidth={1.6} />,
  sleep: <Moon strokeWidth={1.6} />,
  wake: <Sun strokeWidth={1.6} />,
  diaper: <Droplet strokeWidth={1.6} />,
  weight: <Scale strokeWidth={1.6} />,
  height: <Ruler strokeWidth={1.6} />,
};

const VISIBLE_MS = 4200;

export const LoggedToast: React.FC<{ toast: ToastData | null; onUndo: (id: string) => void; onDone: () => void }> = ({
  toast,
  onUndo,
  onDone,
}) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setLeaving(false);
    const t1 = setTimeout(() => setLeaving(true), VISIBLE_MS);
    const t2 = setTimeout(onDone, VISIBLE_MS + 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [toast, onDone]);

  if (!toast) return null;
  const tone = TONE_BY_TYPE[toast.type] || 'primary';

  return (
    <div className="fixed inset-x-0 bottom-[108px] z-40 px-[22px] pointer-events-none" aria-live="polite">
      <div
        key={toast.key}
        className={cx(
          'max-w-md mx-auto flex items-center gap-3 ps-2 pe-2 py-2 rounded-full bg-surface shadow-float pointer-events-auto',
          leaving ? 'animate-toast-out' : 'animate-toast-in'
        )}
      >
        <IconBadge tone={tone} size="sm">
          {ICON_BY_TYPE[toast.type]}
        </IconBadge>
        <span className="flex-1 text-[15px] text-ink truncate">{toast.text}</span>
        {toast.undoId && (
          <button
            onClick={() => {
              onUndo(toast.undoId!);
              setLeaving(true);
              setTimeout(onDone, 300);
            }}
            className="h-10 px-4 rounded-full bg-sunken text-[14px] font-medium text-ink shrink-0"
          >
            ביטול
          </button>
        )}
      </div>
    </div>
  );
};
