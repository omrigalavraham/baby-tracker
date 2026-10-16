import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { Segmented, haptic } from '../ui';

/*
 * Shared engine for the soothing exercises. Every exercise is a pure function of
 * "exercise time" (ms): the player owns the clock, pause, speed and finish, and the
 * exercise only says what to draw and say at a given moment.
 */

export const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export interface Pt {
  x: number;
  y: number;
}

type Cmd = ['M', number, number] | ['L', number, number] | ['Q', number, number, number, number];

/** A drawable path that can also be walked: `at(0..1)` returns the point that far along it. */
export interface WalkPath {
  d: string;
  at: (f: number) => Pt;
  start: Pt;
  end: Pt;
  /** Direction at the end, in degrees (0 = pointing down), for the arrow head */
  endAngle: number;
}

export function walkPath(cmds: Cmd[]): WalkPath {
  const pts: Pt[] = [];
  let cur: Pt = { x: 0, y: 0 };
  for (const c of cmds) {
    if (c[0] === 'M' || c[0] === 'L') {
      cur = { x: c[1], y: c[2] };
      pts.push(cur);
    } else {
      const [, qx, qy, x, y] = c;
      const from = cur;
      for (let i = 1; i <= 12; i++) {
        const t = i / 12;
        pts.push({
          x: (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * qx + t * t * x,
          y: (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * qy + t * t * y,
        });
      }
      cur = { x, y };
    }
  }
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = acc[acc.length - 1];
  const at = (f: number): Pt => {
    const target = clamp01(f) * total;
    let i = 1;
    while (i < acc.length - 1 && acc[i] < target) i++;
    const seg = acc[i] - acc[i - 1] || 1;
    const k = (target - acc[i - 1]) / seg;
    return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k };
  };
  const a = pts[pts.length - 1];
  const b = pts[pts.length - 2] || a;
  return {
    d: cmds.map(c => c.join(' ')).join(' '),
    at,
    start: pts[0],
    end: a,
    endAngle: (Math.atan2(a.y - b.y, a.x - b.x) * 180) / Math.PI - 90,
  };
}

/** Exercise clock: advances while playing, `rate` speeds it up */
function useClock(playing: boolean, rate: number) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      setMs(m => m + (now - last) * rate);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, rate]);
  return [ms, setMs] as const;
}

/** Three soft fingertip pads with ripples, centred on 0,0 */
export const Fingertips: React.FC<{ x: number; y: number; lift?: number; rotate?: number; dim?: boolean; pads?: [number, number][] }> = ({
  x,
  y,
  lift = 0,
  rotate = 0,
  dim,
  pads = [
    [-16, 5],
    [0, 0],
    [16, 5],
  ],
}) => (
  <g
    transform={`translate(${x} ${y - lift * 6}) rotate(${rotate}) scale(${1 + lift * 0.08})`}
    opacity={(dim ? 0.5 : 1) * (1 - lift * 0.45)}
  >
    {pads.map(([px, py], i) => (
      <g key={i}>
        <circle className="soothe-ripple" cx={px} cy={py} r="9" fill="none" stroke="var(--c-sleep)" strokeWidth="2" style={{ animationDelay: `${i * 0.25}s` }} />
        <circle cx={px} cy={py} r="13" fill="var(--c-sleep)" opacity=".18" />
        <circle cx={px} cy={py} r="7.5" fill="var(--c-sleep)" stroke="var(--c-surface)" strokeWidth="2.5" />
      </g>
    ))}
  </g>
);

export interface Frame {
  art: React.ReactNode;
  caption: [string, string];
  status: string;
  /** Changes on every new repetition, for the haptic tick */
  step: number;
  /** Optional row above the drawing (I · L · U chips) */
  top?: React.ReactNode;
}

interface PlayerProps {
  /** Length of the exercise in exercise-ms; Infinity for open-ended holds */
  totalMs: number;
  frame: (ms: number, finished: boolean) => Frame;
  /** What to show before the first press */
  previewMs?: number;
  finish?: [string, string];
  speeds?: boolean;
}

export const ExercisePlayer: React.FC<PlayerProps> = ({ totalMs, frame, previewMs = 0, finish, speeds = true }) => {
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [speed, setSpeed] = useState<'slow' | 'normal'>('slow');
  const rate = speed === 'slow' ? 1 : 1.4;
  const [ms, setMs] = useClock(playing, rate);

  useEffect(() => {
    if (ms >= totalMs && playing) {
      setPlaying(false);
      setFinished(true);
      haptic(40);
    }
  }, [ms, totalMs, playing]);

  const shown = finished ? totalMs - 1 : started ? Math.min(ms, totalMs - 1) : previewMs;
  const f = frame(shown, finished);

  const lastStep = useRef(f.step);
  useEffect(() => {
    if (playing && f.step !== lastStep.current) haptic(15);
    lastStep.current = f.step;
  }, [f.step, playing]);

  const restart = () => {
    setMs(0);
    setFinished(false);
    setStarted(true);
    setPlaying(true);
    haptic(15);
  };

  const toggle = () => {
    if (finished) return restart();
    if (!started) setStarted(true);
    if (!playing) haptic(15);
    setPlaying(p => !p);
  };

  const finite = Number.isFinite(totalMs);
  const progress = finite ? Math.min(1, (started ? ms : 0) / totalMs) : 0;
  const [line1, line2] = finished && finish ? finish : f.caption;

  return (
    <div className="flex flex-col gap-4">
      {f.top}

      <div className="rounded-[24px] overflow-hidden bg-sunken">{f.art}</div>

      <div className="min-h-[46px] text-center text-[15px] font-medium text-ink text-balance">
        {line1}
        <span className="block text-[13px] font-normal text-muted">{line2}</span>
      </div>

      <div className="flex items-center gap-3 text-[13px] text-muted tabular-nums">
        <span>{f.status}</span>
        {finite ? (
          <>
            <span className="flex-1 h-1.5 rounded-full bg-sunken overflow-hidden">
              <span className="block h-full rounded-full bg-sleep" style={{ width: `${(finished ? 1 : progress) * 100}%` }} />
            </span>
            <span>{fmt(finished ? 0 : (totalMs - (started ? ms : 0)) / rate / 1000)}</span>
          </>
        ) : (
          <span className="flex-1 text-left">{fmt((started ? ms : 0) / rate / 1000)}</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        {speeds ? (
          <Segmented
            value={speed}
            onChange={setSpeed}
            label="קצב"
            options={[
              { value: 'slow', label: 'איטי' },
              { value: 'normal', label: 'רגיל' },
            ]}
          />
        ) : (
          <span className="w-[120px]" />
        )}
        <button
          onClick={toggle}
          aria-label={playing ? 'השהיה' : 'התחלה'}
          className="w-16 h-16 rounded-full bg-sleep text-surface flex items-center justify-center shadow-float active:scale-95 transition-transform [&_svg]:w-7 [&_svg]:h-7"
        >
          {playing ? <Pause fill="currentColor" strokeWidth={0} /> : <Play fill="currentColor" strokeWidth={0} />}
        </button>
        <button onClick={restart} className="h-11 px-4 rounded-2xl bg-sunken text-ink text-[13px] font-medium flex items-center gap-1.5 [&_svg]:w-4 [&_svg]:h-4">
          <RotateCcw />
          מההתחלה
        </button>
      </div>
    </div>
  );
};
