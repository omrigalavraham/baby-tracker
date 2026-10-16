import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { Segmented, cx, haptic } from '../ui';

/*
 * Guided I-L-U tummy massage. Top view of the baby on her back, head at the top,
 * so her left side is on the right of the screen. Three fingertip pads glide along
 * each letter (clockwise as the parent sees it, which follows the colon), lift off
 * and float back to where the next stroke starts.
 */

type Letter = 'I' | 'L' | 'U';

const PATHS: Record<Letter, string> = {
  I: 'M220 140 L220 252',
  L: 'M100 140 L200 140 Q220 140 220 160 L220 252',
  U: 'M100 252 L100 160 Q100 140 120 140 L200 140 Q220 140 220 160 L220 252',
};

const CAPTIONS: Record<Letter, [string, string]> = {
  I: ['I: ליטוף מלמעלה למטה בצד שמאל שלה', '3 קצות אצבעות, לחץ עדין כמו על אפרסק'],
  L: ['L: לרוחב מתחת לצלעות, ואז למטה בצד שמאל', 'מימין שלה לשמאל שלה, באותו לחץ עדין'],
  U: ['U: למעלה בצד ימין, לרוחב, ולמטה בצד שמאל', 'קשת אחת רציפה סביב הטבור, בכיוון השעון'],
};

const ORDER: Letter[] = ['I', 'L', 'U'];
const REPS = 3;
const ROUNDS = 3;
const PAUSE_MS = 1000;
const SPEEDS = { slow: 4200, normal: 3000 };

const PLAN = Array.from({ length: ROUNDS }, (_, round) =>
  ORDER.flatMap(letter => Array.from({ length: REPS }, (_, rep) => ({ round, letter, rep })))
).flat();

const TIPS: [number, number, number][] = [
  [-16, 5, 0],
  [0, 0, 0.25],
  [16, 5, 0.5],
];

const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export const IluMassage: React.FC = () => {
  const [speed, setSpeed] = useState<keyof typeof SPEEDS>('slow');
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  // Mirrors of the animation state for the text around the drawing (updated per stroke, not per frame)
  const [stepIdx, setStepIdx] = useState(0);

  const trailRef = useRef<SVGPathElement>(null);
  const probeRef = useRef<SVGPathElement>(null);
  const tipsRef = useRef<SVGGElement>(null);
  const arrowRef = useRef<SVGPathElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const leftRef = useRef<HTMLSpanElement>(null);

  // Animation state lives in a ref so the frame loop does not re-render React
  const anim = useRef({ idx: 0, t: 0.55, pauseLeft: 0, last: 0 });
  const strokeMs = SPEEDS[speed];

  const draw = () => {
    const trail = trailRef.current;
    const tips = tipsRef.current;
    if (!trail || !tips) return;
    const { idx, t, pauseLeft } = anim.current;
    const step = PLAN[idx];
    trail.setAttribute('d', PATHS[step.letter]);
    const len = trail.getTotalLength();
    const p = ease(Math.min(1, t));
    trail.style.strokeDasharray = String(len);
    trail.style.strokeDashoffset = String(len * (1 - p));

    let pt = trail.getPointAtLength(len * p);
    let lift = 0;
    const next = PLAN[idx + 1];
    if (pauseLeft > 0 && next && probeRef.current) {
      const u = 1 - pauseLeft / PAUSE_MS;
      probeRef.current.setAttribute('d', PATHS[next.letter]);
      const start = probeRef.current.getPointAtLength(0);
      const k = ease(u);
      pt = { x: pt.x + (start.x - pt.x) * k, y: pt.y + (start.y - pt.y) * k } as DOMPoint;
      lift = Math.sin(Math.PI * u);
      trail.style.opacity = String(0.55 * (1 - u));
    } else {
      trail.style.opacity = '0.55';
    }
    tips.setAttribute('transform', `translate(${pt.x} ${pt.y - lift * 6}) scale(${1 + lift * 0.08})`);
    tips.style.opacity = String(1 - lift * 0.45);

    const a = trail.getPointAtLength(len);
    const b = trail.getPointAtLength(len - 2);
    const ang = (Math.atan2(a.y - b.y, a.x - b.x) * 180) / Math.PI - 90;
    arrowRef.current?.setAttribute('transform', `translate(${a.x} ${a.y + 10}) rotate(${ang})`);

    const done = idx + Math.min(1, t);
    if (barRef.current) barRef.current.style.width = `${(done / PLAN.length) * 100}%`;
    if (leftRef.current) leftRef.current.textContent = fmt(((PLAN.length - done) * (strokeMs + PAUSE_MS)) / 1000);
  };

  // Frame loop while playing
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    anim.current.last = performance.now();
    const frame = (now: number) => {
      const s = anim.current;
      const dt = now - s.last;
      s.last = now;
      if (s.pauseLeft > 0) {
        s.pauseLeft -= dt;
        if (s.pauseLeft <= 0) {
          s.pauseLeft = 0;
          if (s.idx + 1 >= PLAN.length) {
            s.t = 1;
            draw();
            setPlaying(false);
            setFinished(true);
            haptic(40);
            return;
          }
          s.idx += 1;
          s.t = 0;
          setStepIdx(s.idx);
          haptic(15);
        }
      } else {
        s.t += dt / strokeMs;
        if (s.t >= 1) {
          s.t = 1;
          s.pauseLeft = PAUSE_MS;
        }
      }
      draw();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, strokeMs]);

  // At rest: the first stroke half drawn, so the idea is visible before pressing play
  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokeMs]);

  const restart = () => {
    anim.current = { idx: 0, t: 0, pauseLeft: 0, last: performance.now() };
    setStepIdx(0);
    setFinished(false);
    draw();
    setPlaying(true);
    haptic(15);
  };

  const toggle = () => {
    if (finished) return restart();
    // First press starts the stroke from its beginning, not from the half-drawn preview
    if (!playing && anim.current.idx === 0 && anim.current.t === 0.55) anim.current.t = 0;
    if (!playing) haptic(15);
    setPlaying(p => !p);
  };

  const step = PLAN[stepIdx];
  const letterIdx = ORDER.indexOf(step.letter);
  const [line1, line2] = finished
    ? ['כל הכבוד, סיימתם', 'עכשיו קפלו בעדינות את הברכיים אל הבטן ל־10 שניות']
    : CAPTIONS[step.letter];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center gap-2" dir="ltr">
        {ORDER.map((l, i) => (
          <span
            key={l}
            className={cx(
              'min-w-[52px] px-3 py-1.5 rounded-full text-center text-lg font-bold transition-all duration-300',
              !finished && i === letterIdx
                ? 'bg-primary-soft text-primary-ink scale-105'
                : finished || i < letterIdx
                ? 'bg-sunken text-diaper'
                : 'bg-sunken text-muted'
            )}
          >
            {l}
            <small className="block text-[10px] font-medium">3×</small>
          </span>
        ))}
      </div>

      <div className="rounded-[24px] overflow-hidden bg-sunken">
        <svg viewBox="0 0 320 340" className="block w-full h-auto" role="img" aria-label="בטן התינוקת מלמעלה, נקודות מראות את תנועת העיסוי">
          <rect x="18" y="58" width="44" height="150" rx="22" fill="var(--c-primary-soft)" />
          <rect x="258" y="58" width="44" height="150" rx="22" fill="var(--c-primary-soft)" />
          <circle cx="40" cy="214" r="17" fill="var(--c-skin)" />
          <circle cx="280" cy="214" r="17" fill="var(--c-skin)" />
          <ellipse cx="160" cy="-6" rx="70" ry="44" fill="var(--c-skin)" />
          <path d="M138 26 Q160 36 182 26" stroke="var(--c-skin-deep)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M58 44 Q160 18 262 44 L268 120 Q160 104 52 120 Z" fill="var(--c-primary-soft)" />
          <path d="M60 112 Q160 96 260 112 L262 268 Q160 288 58 268 Z" fill="var(--c-skin)" />
          <path d="M54 262 Q160 286 266 262 L272 340 L48 340 Z" fill="var(--c-surface)" />
          <path d="M54 262 Q160 286 266 262" stroke="var(--c-faint)" strokeWidth="2" fill="none" />
          <rect x="70" y="272" width="22" height="14" rx="4" fill="var(--c-primary-soft)" />
          <rect x="228" y="272" width="22" height="14" rx="4" fill="var(--c-primary-soft)" />
          <path d="M156 196 Q160 202 164 196" stroke="var(--c-skin-deep)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <text x="80" y="320" textAnchor="middle" fontSize="11" fill="var(--c-muted)">צד ימין שלה</text>
          <text x="240" y="320" textAnchor="middle" fontSize="11" fill="var(--c-muted)">צד שמאל שלה</text>

          <path d={PATHS[step.letter]} fill="none" stroke="var(--c-sleep)" strokeOpacity=".35" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />
          <path ref={trailRef} fill="none" stroke="var(--c-sleep)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
          <path ref={arrowRef} d="M-7 -9 L0 0 L7 -9" fill="none" stroke="var(--c-sleep)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".7" />
          <path ref={probeRef} fill="none" stroke="none" />

          <g ref={tipsRef}>
            {TIPS.map(([x, y, d]) => (
              <g key={x}>
                <circle className="soothe-ripple" cx={x} cy={y} r="9" fill="none" stroke="var(--c-sleep)" strokeWidth="2" style={{ animationDelay: `${d}s` }} />
                <circle cx={x} cy={y} r="13" fill="var(--c-sleep)" opacity=".18" />
                <circle cx={x} cy={y} r="7.5" fill="var(--c-sleep)" stroke="var(--c-surface)" strokeWidth="2.5" />
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className="min-h-[46px] text-center text-[15px] font-medium text-ink text-balance">
        {line1}
        <span className="block text-[13px] font-normal text-muted">{line2}</span>
      </div>

      <div className="flex items-center gap-3 text-[13px] text-muted tabular-nums">
        <span>
          סבב {step.round + 1}/{ROUNDS} · חזרה {step.rep + 1}/{REPS}
        </span>
        <span className="flex-1 h-1.5 rounded-full bg-sunken overflow-hidden">
          <span ref={barRef} className="block h-full rounded-full bg-sleep" style={{ width: 0 }} />
        </span>
        <span ref={leftRef} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Segmented
          value={speed}
          onChange={setSpeed}
          label="קצב"
          options={[
            { value: 'slow', label: 'איטי' },
            { value: 'normal', label: 'רגיל' },
          ]}
        />
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
