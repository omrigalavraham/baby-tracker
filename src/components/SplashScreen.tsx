import React, { useEffect, useRef, useState } from 'react';
import { Moon } from 'lucide-react';
import { cx } from './ui';

interface SplashScreenProps {
  babyName?: string;
  /** Called when the splash starts dissolving, so the app can rise in underneath it */
  onReveal?: () => void;
  onFinish: () => void;
}

const HOLD_MS = 1900;
const EXIT_MS = 550;
const RING_R = 70;
const RING_LEN = 2 * Math.PI * RING_R;

const STARS = [
  { top: '18%', left: '22%', size: 3, delay: '0s' },
  { top: '26%', left: '74%', size: 2, delay: '0.8s' },
  { top: '70%', left: '16%', size: 2, delay: '1.4s' },
  { top: '76%', left: '80%', size: 3, delay: '0.4s' },
  { top: '12%', left: '55%', size: 2, delay: '1.1s' },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ babyName, onReveal, onFinish }) => {
  const [exiting, setExiting] = useState(false);
  const done = useRef(false);

  const leave = (delay: number) => {
    if (done.current) return;
    done.current = true;
    setExiting(true);
    onReveal?.();
    setTimeout(onFinish, delay);
  };

  useEffect(() => {
    const t = setTimeout(() => leave(EXIT_MS), HOLD_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const name = babyName?.trim() || '';
  const letters = Array.from(name || 'בייבי יומן');
  const initial = name ? letters[0] : '';
  const letterBase = 520;
  const letterStep = 45;

  return (
    <div
      onClick={() => leave(320)}
      role="presentation"
      className={cx('fixed inset-0 z-50 bg-ground select-none cursor-pointer overflow-hidden', exiting && 'animate-fade-out')}
      style={exiting ? { animationDuration: `${EXIT_MS}ms`, animationDelay: '120ms' } : undefined}
    >
      {/* Night sky: only visible in night mode */}
      <div aria-hidden="true" className="hidden night:block absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-sleep"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              animation: `twinkle 3.2s ease-in-out ${s.delay} infinite`,
            }}
          />
        ))}
      </div>

      <div
        className="relative h-full flex flex-col items-center justify-center gap-8 p-8"
        style={exiting ? { animation: `splash-out ${EXIT_MS}ms var(--ease-soft) both` } : undefined}
      >
        <div className="relative w-[164px] h-[164px] flex items-center justify-center">
          {/* Soft breathing glow */}
          <span
            aria-hidden="true"
            className="absolute inset-2 rounded-full bg-feed-soft night:bg-sleep-soft blur-2xl"
            style={{ animation: 'fade-in 1s ease-out both, glow-breathe 4s ease-in-out 1s infinite' }}
          />
          {/* Ring that draws itself */}
          <svg aria-hidden="true" className="absolute inset-0 -rotate-90" width="164" height="164" viewBox="0 0 164 164">
            <circle cx="82" cy="82" r={RING_R} fill="none" className="stroke-line" strokeWidth="1.5" style={{ animation: 'fade-in .6s ease-out both' }} />
            <circle
              cx="82"
              cy="82"
              r={RING_R}
              fill="none"
              className="stroke-primary"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={RING_LEN}
              style={
                {
                  '--ring-len': RING_LEN,
                  animation: `ring-draw 1.5s var(--ease-soft) 0.2s both`,
                } as React.CSSProperties
              }
            />
          </svg>
          {/* Orb */}
          <div
            className="relative w-28 h-28 rounded-full bg-feed-soft night:bg-sleep-soft text-feed night:text-sleep flex items-center justify-center"
            style={{ animation: 'orb-in 0.9s var(--ease-soft) both' }}
          >
            <div className="animate-float-slow flex items-center justify-center">
              {initial ? (
                <span className="text-[46px] font-medium leading-none rise-in" style={{ '--d': '350ms' } as React.CSSProperties}>
                  {initial}
                </span>
              ) : (
                <Moon className="w-11 h-11 rise-in" strokeWidth={1.5} style={{ '--d': '350ms' } as React.CSSProperties} />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-[30px] font-medium text-ink tracking-tight" aria-label={name || 'בייבי יומן'}>
            {letters.map((ch, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="inline-block rise-in whitespace-pre"
                style={{ '--d': `${letterBase + i * letterStep}ms` } as React.CSSProperties}
              >
                {ch}
              </span>
            ))}
          </h1>
          <p
            className="text-[15px] text-muted rise-in"
            style={{ '--d': `${letterBase + letters.length * letterStep + 120}ms` } as React.CSSProperties}
          >
            יומן קטן ורגוע
          </p>
        </div>
      </div>
    </div>
  );
};
