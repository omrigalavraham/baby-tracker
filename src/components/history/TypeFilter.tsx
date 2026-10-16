import React from 'react';
import { Droplet, Milk, Moon, Scale } from 'lucide-react';
import { BabyEvent } from '../../types';
import { TONE, Tone, cx, haptic } from '../ui';

/** Multi-select filter by record type, shared by the day chart and the list in History */

export type Category = 'feeding' | 'sleep' | 'diaper' | 'growth';

export const CATEGORIES: { id: Category; label: string; tone: Tone; icon: React.ReactNode }[] = [
  { id: 'feeding', label: 'האכלה', tone: 'feed', icon: <Milk /> },
  { id: 'sleep', label: 'שינה', tone: 'sleep', icon: <Moon /> },
  { id: 'diaper', label: 'חיתול', tone: 'diaper', icon: <Droplet /> },
  { id: 'growth', label: 'גדילה', tone: 'weight', icon: <Scale /> },
];

export function categoryOf(e: BabyEvent): Category | 'other' {
  if (e.type === 'feeding' || e.type === 'sleep' || e.type === 'diaper') return e.type;
  if (e.type === 'weight' || e.type === 'height') return 'growth';
  return 'other';
}

/** Empty selection means "everything" */
export function shows(filters: Category[], c: Category | 'other') {
  return filters.length === 0 || (c !== 'other' && filters.includes(c));
}

export const TypeFilter: React.FC<{ value: Category[]; onChange: (v: Category[]) => void }> = ({ value, onChange }) => {
  const toggle = (c: Category) => {
    haptic(6);
    onChange(value.includes(c) ? value.filter(x => x !== c) : [...value, c]);
  };
  return (
    <div role="group" aria-label="סינון לפי סוג" className="flex gap-2 overflow-x-auto no-scrollbar -mx-[22px] px-[22px] py-0.5">
      <button
        onClick={() => onChange([])}
        aria-pressed={value.length === 0}
        className={cx(
          'h-10 px-4 rounded-full text-[14px] shrink-0 transition-colors',
          value.length === 0 ? 'bg-ink text-surface font-medium' : 'bg-surface text-muted shadow-soft'
        )}
      >
        הכול
      </button>
      {CATEGORIES.map(c => {
        const on = value.includes(c.id);
        return (
          <button
            key={c.id}
            onClick={() => toggle(c.id)}
            aria-pressed={on}
            className={cx(
              'h-10 ps-1.5 pe-4 rounded-full text-[14px] shrink-0 flex items-center gap-2 transition-colors',
              on ? cx(TONE[c.tone].soft, 'font-medium ring-2 ring-inset ring-current', TONE[c.tone].icon) : 'bg-surface shadow-soft'
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
            <span className="text-ink">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
};
