import React from 'react';
import { BarChart3, Bell, Home, Sprout } from 'lucide-react';
import { cx, haptic } from '../ui';

export type MainTab = 'today' | 'history' | 'reminders' | 'growth';

const TABS: { id: MainTab; label: string; icon: React.ReactNode }[] = [
  { id: 'today', label: 'היום', icon: <Home strokeWidth={1.6} /> },
  { id: 'history', label: 'היסטוריה', icon: <BarChart3 strokeWidth={1.6} /> },
  { id: 'reminders', label: 'תזכורות', icon: <Bell strokeWidth={1.6} /> },
  { id: 'growth', label: 'התפתחות', icon: <Sprout strokeWidth={1.6} /> },
];

const GAP = 4; // px between cells, matches gap-1

export const BottomNav: React.FC<{ value: MainTab; onChange: (t: MainTab) => void; pendingReminders: number }> = ({
  value,
  onChange,
  pendingReminders,
}) => {
  const index = Math.max(0, TABS.findIndex(t => t.id === value));

  return (
    <nav
      aria-label="ניווט ראשי"
      className="fixed inset-x-0 bottom-0 z-30 px-[22px] pb-[max(22px,env(safe-area-inset-bottom))] pointer-events-none rise-in"
      style={{ '--d': '420ms' } as React.CSSProperties}
    >
      <div className="relative max-w-md mx-auto h-[68px] p-2 bg-surface rounded-full shadow-float grid grid-cols-4 gap-1 pointer-events-auto">
        {/* Sliding pill behind the active tab (RTL: first tab is on the right) */}
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 right-2 rounded-full bg-feed-soft transition-transform duration-500"
          style={{
            width: `calc((100% - 16px - ${GAP * 3}px) / 4)`,
            transform: `translateX(calc(-${index} * (100% + ${GAP}px)))`,
            transitionTimingFunction: 'var(--ease-soft)',
          }}
        />
        {TABS.map(t => {
          const active = t.id === value;
          return (
            <button
              key={t.id}
              onClick={() => {
                if (!active) haptic(6);
                onChange(t.id);
              }}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'relative flex flex-col items-center justify-center gap-0.5 rounded-full text-[13px] transition-colors duration-300 active:scale-95 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:transition-transform [&_svg]:duration-500',
                active ? 'text-ink font-medium [&_svg]:-translate-y-px [&_svg]:scale-110' : 'text-muted'
              )}
            >
              {t.icon}
              {t.label}
              {t.id === 'reminders' && pendingReminders > 0 && !active && (
                <span aria-label={`${pendingReminders} תזכורות פתוחות`} className="absolute top-2 left-[calc(50%-14px)] w-2 h-2 rounded-full bg-feed" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
