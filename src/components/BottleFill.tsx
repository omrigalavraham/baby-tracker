import React, { useEffect, useId, useRef } from 'react';
import { cx, haptic } from './ui';

/*
 * Bottle amount picker: a bottle whose milk is a real liquid (two moving wave
 * layers that slosh when the amount changes, with a few rising bubbles while
 * filling), plus a vertical slider. Drag the slider or the bottle itself.
 */

interface BottleFillProps {
  value: number;
  onChange: (ml: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

// Bottle geometry (SVG units)
const W = 120;
const H = 250;
const BODY = { x: 22, y: 62, w: 76, h: 176, r: 26 };
const LIQ_BOTTOM = BODY.y + BODY.h - 4; // 234
const LIQ_TOP = BODY.y + 12; // 74
const BUBBLES = 6;

function wavePath(level: number, amp: number, phase: number, k: number) {
  const x0 = BODY.x - 4;
  const x1 = BODY.x + BODY.w + 4;
  let d = `M ${x0} ${H}`;
  for (let x = x0; x <= x1; x += 3) {
    const y = level + amp * Math.sin(k * x + phase) + amp * 0.35 * Math.sin(2.3 * k * x - phase * 1.4);
    d += ` L ${x} ${y.toFixed(2)}`;
  }
  return d + ` L ${x1} ${H} Z`;
}

export const BottleFill: React.FC<BottleFillProps> = ({ value, onChange, min = 10, max = 240, step = 5 }) => {
  const clipId = useId().replace(/:/g, '');
  const backRef = useRef<SVGPathElement>(null);
  const frontRef = useRef<SVGPathElement>(null);
  const bubbleRefs = useRef<(SVGCircleElement | null)[]>([]);
  const target = useRef(value);
  target.current = value;

  // Liquid physics loop: spring towards the target level, waves get taller with speed
  useEffect(() => {
    const levelFor = (ml: number) => LIQ_BOTTOM - (Math.max(0, Math.min(max, ml)) / max) * (LIQ_BOTTOM - LIQ_TOP);
    let level = levelFor(target.current);
    let vel = 0;
    let amp = 1.4;
    let phase = 0;
    let raf = 0;
    const bubbles = Array.from({ length: BUBBLES }, () => ({ x: 0, y: 0, r: 0, v: 0, alive: false }));

    const tick = () => {
      const goal = levelFor(target.current);
      vel += (goal - level) * 0.09;
      vel *= 0.78;
      level += vel;
      const speed = Math.abs(vel);
      amp += (1.4 + Math.min(7, speed * 1.6) - amp) * 0.06;
      phase += 0.045 + Math.min(0.12, speed * 0.02);

      backRef.current?.setAttribute('d', wavePath(level - 2, amp * 0.9, phase + 1.7, 0.085));
      frontRef.current?.setAttribute('d', wavePath(level, amp, phase, 0.07));

      // Bubbles rise while the milk goes up
      if (vel < -0.4 && Math.random() < 0.35) {
        const b = bubbles.find(x => !x.alive);
        if (b) Object.assign(b, { x: BODY.x + 14 + Math.random() * (BODY.w - 28), y: LIQ_BOTTOM - 4, r: 1.5 + Math.random() * 2.5, v: 0.8 + Math.random() * 1.2, alive: true });
      }
      bubbles.forEach((b, i) => {
        const el = bubbleRefs.current[i];
        if (!el) return;
        if (b.alive) {
          b.y -= b.v;
          b.x += Math.sin((b.y + i * 20) / 9) * 0.3;
          if (b.y < level + 4) b.alive = false;
        }
        el.setAttribute('cx', b.x.toFixed(1));
        el.setAttribute('cy', b.y.toFixed(1));
        el.setAttribute('r', b.alive ? b.r.toFixed(1) : '0');
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [max]);

  // Shared drag logic for the bottle and the slider: y position -> amount
  const lastHapticStep = useRef(value);
  const setFromRatio = (ratio: number) => {
    const raw = Math.max(0, Math.min(1, ratio)) * max;
    const ml = Math.max(min, Math.min(max, Math.round(raw / step) * step));
    // A tiny tick for every step up or down
    if (ml !== lastHapticStep.current) {
      lastHapticStep.current = ml;
      haptic(8);
    }
    if (ml !== value) onChange(ml);
  };

  const dragHandlers = (getRatio: (e: React.PointerEvent) => number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      setFromRatio(getRatio(e));
    },
    onPointerMove: (e: React.PointerEvent) => {
      if ((e.currentTarget as Element).hasPointerCapture(e.pointerId)) setFromRatio(getRatio(e));
    },
  });

  const bottleRatio = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as Element).getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * H;
    return (LIQ_BOTTOM - y) / (LIQ_BOTTOM - LIQ_TOP);
  };
  const sliderRatio = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as Element).getBoundingClientRect();
    return (rect.bottom - e.clientY) / rect.height;
  };

  const pct = Math.max(0, Math.min(1, value / max));
  const ticks = [30, 60, 90, 120, 150, 180, 210];

  return (
    <div className="flex items-center justify-center gap-6 select-none">
      {/* Vertical slider */}
      <div
        role="slider"
        tabIndex={0}
        aria-label='כמות במ"ל'
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-orientation="vertical"
        onKeyDown={e => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') onChange(Math.min(max, value + step));
          if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') onChange(Math.max(min, value - step));
        }}
        className="relative w-14 h-[220px] rounded-full bg-sunken touch-none cursor-ns-resize focus-visible:outline-2 focus-visible:outline-primary shrink-0"
        {...dragHandlers(sliderRatio)}
      >
        <div
          className="absolute inset-x-0 bottom-0 rounded-full bg-feed-soft transition-[height] duration-150 ease-out"
          style={{ height: `calc(28px + ${pct} * (100% - 28px))` }}
        />
        <div
          className={cx(
            'absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-surface shadow-float flex flex-col items-center justify-center gap-[3px] transition-[bottom] duration-150 ease-out'
          )}
          style={{ bottom: `calc(4px + ${pct} * (100% - 56px))` }}
        >
          <span className="w-4 h-[2px] rounded-full bg-faint" />
          <span className="w-4 h-[2px] rounded-full bg-faint" />
        </div>
      </div>
      {/* Bottle */}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="touch-none cursor-ns-resize shrink-0"
        direction="ltr"
        role="img"
        aria-label={`בקבוק עם ${value} מ"ל`}
        {...dragHandlers(bottleRatio)}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={BODY.x + 2} y={BODY.y + 2} width={BODY.w - 4} height={BODY.h - 4} rx={BODY.r - 2} />
          </clipPath>
        </defs>

        {/* Nipple + collar */}
        <path d="M49 46 C49 28 53 10 60 10 C67 10 71 28 71 46 Z" className="fill-feed-soft stroke-feed" strokeWidth="1.5" />
        <rect x="34" y="44" width="52" height="20" rx="7" className="fill-feed" />
        <rect x="34" y="52" width="52" height="2" className="fill-surface" opacity="0.35" />

        {/* Glass */}
        <rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h} rx={BODY.r} fill="var(--c-glass)" className="stroke-faint" strokeWidth="2" />

        {/* Milk */}
        <g clipPath={`url(#${clipId})`}>
          <path ref={backRef} fill="var(--c-milk-deep)" />
          <path ref={frontRef} fill="var(--c-milk)" />
          {Array.from({ length: BUBBLES }, (_, i) => (
            <circle key={i} ref={el => { bubbleRefs.current[i] = el; }} r="0" fill="var(--c-glass)" className="stroke-faint" strokeWidth="0.6" />
          ))}
        </g>

        {/* Measurement marks */}
        {ticks.map(t => {
          const y = LIQ_BOTTOM - (t / max) * (LIQ_BOTTOM - LIQ_TOP);
          return (
            <g key={t} className="fill-muted stroke-muted" opacity="0.7">
              <line x1={BODY.x + BODY.w - 16} x2={BODY.x + BODY.w - 6} y1={y} y2={y} strokeWidth="1.2" strokeLinecap="round" />
              {t % 60 === 0 && (
                <text x={BODY.x + BODY.w - 19} y={y + 3} fontSize="8.5" textAnchor="end" stroke="none" className="tabular-nums">
                  {t}
                </text>
              )}
            </g>
          );
        })}

        {/* Glass shine */}
        <rect x={BODY.x + 9} y={BODY.y + 18} width="6" height={BODY.h - 44} rx="3" fill="#fff" opacity="0.35" />
      </svg>

      {/* Big number */}
      <div className="flex flex-col items-center min-w-[92px]">
        <span className="text-[52px] leading-none font-medium tabular-nums text-ink">{value}</span>
        <span className="text-[15px] text-muted mt-1">מ"ל</span>
      </div>

    </div>
  );
};
