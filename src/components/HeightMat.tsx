import React, { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { IconButton, haptic } from './ui';

/*
 * Length picker styled as a baby measuring mat: a swaddled baby lies on the mat
 * and grows as you drag; a magnifier above her head shows the exact half-centimetre.
 * RTL: feet at 0 cm on the right, the head grows to the left.
 */

interface HeightMatProps {
  value: number;
  onChange: (cm: number) => void;
  previous?: number;
  min?: number;
  max?: number;
}

const VB_W = 340;
const VB_H = 196;
const ZERO_X = 326;
const PX_PER_CM = 312 / 90;
const RULER_Y = 166;
const HEAD_R = 17;
const LOUPE_R = 34;
const LOUPE_Y = 46;
const LOUPE_PX_PER_CM = 17;

const xFor = (cm: number) => ZERO_X - cm * PX_PER_CM;

/** Follows `target` with a soft ease so taps on +/- glide instead of jumping. */
function useSmooth(target: number) {
  const [shown, setShown] = useState(target);
  const ref = useRef(target);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const diff = target - ref.current;
      if (Math.abs(diff) < 0.01) {
        ref.current = target;
        setShown(target);
        return;
      }
      ref.current += diff * 0.22;
      setShown(ref.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return shown;
}

export const HeightMat: React.FC<HeightMatProps> = ({ value, onChange, previous, min = 40, max = 90 }) => {
  const shown = useSmooth(value);
  const lastStep = useRef(value);

  const set = (cm: number) => {
    const v = Math.max(min, Math.min(max, Math.round(cm * 2) / 2));
    if (v !== lastStep.current) {
      lastStep.current = v;
      haptic(3);
    }
    if (v !== value) onChange(v);
  };

  const fromPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * VB_W;
    set((ZERO_X - x) / PX_PER_CM);
  };

  const hx = xFor(shown);
  const headCx = hx + HEAD_R;
  const headCy = 122;
  const loupeX = Math.max(LOUPE_R + 4, Math.min(VB_W - LOUPE_R - 4, hx));
  const delta = previous ? Math.round((value - previous) * 10) / 10 : null;

  // Fine ruler inside the magnifier: half-cm ticks around the current value
  const fineTicks: number[] = [];
  for (let c = Math.floor((shown - 2.5) * 2) / 2; c <= shown + 2.5; c += 0.5) fineTicks.push(c);

  return (
    <div className="flex flex-col gap-3 select-none">
      <div className="flex items-center justify-center gap-4">
        <IconButton label="פחות חצי סנטימטר" tone="sunken" onClick={() => set(value - 0.5)}>
          <Minus />
        </IconButton>
        <div className="flex flex-col items-center min-w-[120px]">
          <span className="text-[52px] leading-none font-medium tabular-nums text-ink">{value.toFixed(1)}</span>
          <span className="text-[15px] text-muted mt-1">ס"מ</span>
        </div>
        <IconButton label="עוד חצי סנטימטר" tone="sunken" onClick={() => set(value + 0.5)}>
          <Plus />
        </IconButton>
      </div>

      {delta !== null && delta !== 0 && (
        <span className="self-center px-3 py-1 rounded-full bg-diaper-soft text-diaper-ink text-[13px] tabular-nums animate-view-in" key={delta}>
          {delta > 0 ? `גדלה ב-${delta} ס"מ מהמדידה הקודמת` : `${Math.abs(delta)} ס"מ פחות מהמדידה הקודמת`}
        </span>
      )}

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full touch-none cursor-ew-resize"
        direction="ltr"
        role="slider"
        tabIndex={0}
        aria-label='אורך בס"מ'
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') set(value + 0.5);
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') set(value - 0.5);
        }}
        onPointerDown={e => {
          e.currentTarget.setPointerCapture(e.pointerId);
          fromPointer(e);
        }}
        onPointerMove={e => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e);
        }}
      >
        <defs>
          <clipPath id="loupe-clip">
            <circle cx={loupeX} cy={LOUPE_Y} r={LOUPE_R - 2} />
          </clipPath>
        </defs>

        {/* Mat */}
        <rect x="8" y="104" width="324" height="50" rx="20" className="fill-weight-soft" />

        {/* Ruler */}
        {Array.from({ length: 91 }, (_, cm) => {
          const x = xFor(cm);
          const major = cm % 10 === 0;
          const mid = cm % 5 === 0;
          return (
            <g key={cm}>
              <line
                x1={x}
                x2={x}
                y1={RULER_Y}
                y2={RULER_Y + (major ? 10 : mid ? 7 : 4)}
                className={cm <= shown ? 'stroke-weight' : 'stroke-faint'}
                strokeWidth={major ? 1.4 : 1}
              />
              {major && (
                <text x={x} y={RULER_Y + 22} fontSize="9" textAnchor="middle" className="fill-muted tabular-nums">
                  {cm}
                </text>
              )}
            </g>
          );
        })}
        <line x1={xFor(90)} x2={ZERO_X} y1={RULER_Y} y2={RULER_Y} className="stroke-faint" strokeWidth="1" />
        <line x1={hx} x2={ZERO_X} y1={RULER_Y} y2={RULER_Y} className="stroke-weight" strokeWidth="2" strokeLinecap="round" />

        {/* Swaddled baby: body stretches with the length */}
        <rect
          x={headCx + HEAD_R * 0.4}
          y={headCy - 15}
          width={Math.max(10, ZERO_X - 4 - (headCx + HEAD_R * 0.4))}
          height="32"
          rx="16"
          className="fill-sleep-soft stroke-sleep"
          strokeWidth="1.2"
        />
        {[0.38, 0.66].map(f => {
          const bx = headCx + HEAD_R * 0.4 + (ZERO_X - 4 - (headCx + HEAD_R * 0.4)) * f;
          return <line key={f} x1={bx} x2={bx} y1={headCy - 13} y2={headCy + 15} className="stroke-sleep" strokeWidth="1" opacity="0.45" />;
        })}
        {/* Head */}
        <circle cx={headCx} cy={headCy} r={HEAD_R} fill="var(--c-skin)" />
        <path d={`M ${headCx - 9} ${headCy - 3} q 3 3 6 0`} fill="none" className="stroke-ink" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
        <path d={`M ${headCx + 3} ${headCy - 3} q 3 3 6 0`} fill="none" className="stroke-ink" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
        <circle cx={headCx - 9} cy={headCy + 5} r="2.6" className="fill-feed" opacity="0.35" />
        <circle cx={headCx + 9} cy={headCy + 5} r="2.6" className="fill-feed" opacity="0.35" />
        <path d={`M ${hx + 2} ${headCy - 8} q -6 -4 -2 -10`} fill="none" className="stroke-ink" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />

        {/* Crown marker */}
        <line x1={hx} x2={hx} y1={LOUPE_Y + LOUPE_R} y2={RULER_Y} className="stroke-feed" strokeWidth="1.5" strokeDasharray="3 4" />
        <circle cx={hx} cy={RULER_Y} r="9" className="fill-surface stroke-feed" strokeWidth="2" />

        {/* Magnifier */}
        <circle cx={loupeX} cy={LOUPE_Y} r={LOUPE_R} className="fill-surface stroke-weight" strokeWidth="2" />
        <g clipPath="url(#loupe-clip)">
          {fineTicks.map(c => {
            const x = loupeX - (c - shown) * LOUPE_PX_PER_CM;
            const whole = Math.abs(c - Math.round(c)) < 0.01;
            return (
              <g key={c}>
                <line x1={x} x2={x} y1={LOUPE_Y + 12} y2={LOUPE_Y + 12 - (whole ? 12 : 6)} className="stroke-muted" strokeWidth={whole ? 1.4 : 1} />
                {whole && (
                  <text x={x} y={LOUPE_Y - 6} fontSize="10" textAnchor="middle" className="fill-ink tabular-nums">
                    {Math.round(c)}
                  </text>
                )}
              </g>
            );
          })}
          <line x1={loupeX} x2={loupeX} y1={LOUPE_Y - LOUPE_R} y2={LOUPE_Y + LOUPE_R} className="stroke-feed" strokeWidth="2" />
        </g>
      </svg>
      <span className="text-[13px] text-muted text-center">גררו לאורך המזרן, או השתמשו ב-+ ו-− לדיוק</span>
    </div>
  );
};
