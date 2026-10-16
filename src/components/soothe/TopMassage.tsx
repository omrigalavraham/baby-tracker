import React from 'react';
import { cx } from '../ui';
import { ExercisePlayer, Fingertips, WalkPath, ease, walkPath } from './engine';

/*
 * Tummy massages seen from above: the baby on her back, head at the top, legs toward
 * the parent. Directions are written as the parent sees them (her left is on the
 * parent's right). Fingertips glide along each stroke, lift off and float back to
 * where the next stroke starts.
 */

const PAUSE_MS = 1000;

/** The baby from above, close on the tummy */
const BabyTop: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 320 350" className="block w-full h-auto" role="img" aria-label="בטן התינוקת מלמעלה, נקודות מראות את תנועת העיסוי">
    <rect x="18" y="58" width="44" height="150" rx="22" fill="var(--c-primary-soft)" />
    <rect x="258" y="58" width="44" height="150" rx="22" fill="var(--c-primary-soft)" />
    <circle cx="40" cy="214" r="17" fill="var(--c-skin)" />
    <circle cx="280" cy="214" r="17" fill="var(--c-skin)" />
    <ellipse cx="160" cy="-6" rx="70" ry="44" fill="var(--c-skin)" />
    <path d="M138 26 Q160 36 182 26" stroke="var(--c-skin-deep)" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M58 44 Q160 18 262 44 L268 120 Q160 104 52 120 Z" fill="var(--c-primary-soft)" />
    <path d="M60 112 Q160 96 260 112 L262 268 Q160 288 58 268 Z" fill="var(--c-skin)" />
    <path d="M54 262 Q160 286 266 262 L272 350 L48 350 Z" fill="var(--c-surface)" />
    <path d="M54 262 Q160 286 266 262" stroke="var(--c-faint)" strokeWidth="2" fill="none" />
    <rect x="70" y="272" width="22" height="14" rx="4" fill="var(--c-primary-soft)" />
    <rect x="228" y="272" width="22" height="14" rx="4" fill="var(--c-primary-soft)" />
    <path d="M156 196 Q160 202 164 196" stroke="var(--c-skin-deep)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    {/* Sides as the parent sees them, with hers underneath */}
    <text x="80" y="316" textAnchor="middle" fontSize="12" fontWeight="500" fill="var(--c-ink)">שמאל שלכם</text>
    <text x="80" y="332" textAnchor="middle" fontSize="10" fill="var(--c-muted)">(ימין שלה)</text>
    <text x="240" y="316" textAnchor="middle" fontSize="12" fontWeight="500" fill="var(--c-ink)">ימין שלכם</text>
    <text x="240" y="332" textAnchor="middle" fontSize="10" fill="var(--c-muted)">(שמאל שלה)</text>
    {children}
  </svg>
);

interface Stroke {
  path: WalkPath;
  caption: [string, string];
}

interface StepPlan {
  key: string;
  status: string;
}

/** Draws one moment of a stroke sequence: the guide, the trail, the arrow and the fingertips */
function strokeFrame(strokes: Record<string, Stroke>, plan: StepPlan[], strokeMs: number, ms: number) {
  const stepMs = strokeMs + PAUSE_MS;
  const idx = Math.min(plan.length - 1, Math.floor(ms / stepMs));
  const within = ms - idx * stepMs;
  const step = plan[idx];
  const { path } = strokes[step.key];
  const t = Math.min(1, within / strokeMs);
  const p = ease(t);

  let pt = path.at(p);
  let lift = 0;
  let trailOpacity = 0.55;
  const next = plan[idx + 1];
  if (within > strokeMs && next) {
    const u = (within - strokeMs) / PAUSE_MS;
    const start = strokes[next.key].path.start;
    const k = ease(u);
    pt = { x: pt.x + (start.x - pt.x) * k, y: pt.y + (start.y - pt.y) * k };
    lift = Math.sin(Math.PI * u);
    trailOpacity = 0.55 * (1 - u);
  }

  const art = (
    <BabyTop>
      <path d={path.d} fill="none" stroke="var(--c-sleep)" strokeOpacity=".35" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />
      <path
        d={path.d}
        pathLength={1}
        fill="none"
        stroke="var(--c-sleep)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1"
        strokeDashoffset={1 - p}
        opacity={trailOpacity}
      />
      <path
        d="M-7 -9 L0 0 L7 -9"
        transform={`translate(${path.end.x} ${path.end.y}) rotate(${path.endAngle}) translate(0 10)`}
        fill="none"
        stroke="var(--c-sleep)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".7"
      />
      <Fingertips x={pt.x} y={pt.y} lift={lift} />
    </BabyTop>
  );
  return { idx, step, art };
}

// ---------- I-L-U ----------

const ILU: Record<string, Stroke> = {
  I: {
    path: walkPath([
      ['M', 220, 140],
      ['L', 220, 252],
    ]),
    caption: ['I: ליטוף מלמעלה למטה, בצד ימין שלכם', '3 קצות אצבעות, לחץ עדין כמו על אפרסק'],
  },
  L: {
    path: walkPath([
      ['M', 100, 140],
      ['L', 200, 140],
      ['Q', 220, 140, 220, 160],
      ['L', 220, 252],
    ]),
    caption: ['L: לרוחב משמאל לימין מתחת לצלעות, ואז למטה', 'באותו לחץ עדין, בלי ללחוץ על הצלעות'],
  },
  U: {
    path: walkPath([
      ['M', 100, 252],
      ['L', 100, 160],
      ['Q', 100, 140, 120, 140],
      ['L', 200, 140],
      ['Q', 220, 140, 220, 160],
      ['L', 220, 252],
    ]),
    caption: ['U: למעלה בצד שמאל, לרוחב, ולמטה בצד ימין', 'קשת אחת רציפה סביב הטבור, בכיוון השעון'],
  },
};
const ILU_ORDER = ['I', 'L', 'U'];
const ILU_REPS = 3;
const ILU_ROUNDS = 3;
const ILU_STROKE = 4200;
const ILU_PLAN: StepPlan[] = Array.from({ length: ILU_ROUNDS }, (_, r) =>
  ILU_ORDER.flatMap(key =>
    Array.from({ length: ILU_REPS }, (_, i) => ({ key, status: `סבב ${r + 1}/${ILU_ROUNDS} · חזרה ${i + 1}/${ILU_REPS}` }))
  )
).flat();

export const IluMassage: React.FC = () => (
  <ExercisePlayer
    totalMs={ILU_PLAN.length * (ILU_STROKE + PAUSE_MS)}
    previewMs={ILU_STROKE * 0.55}
    finish={['כל הכבוד, סיימתם', 'עכשיו קפלו בעדינות את הברכיים אל הבטן ל־10 שניות']}
    frame={(ms, finished) => {
      const { idx, step, art } = strokeFrame(ILU, ILU_PLAN, ILU_STROKE, ms);
      const li = ILU_ORDER.indexOf(step.key);
      return {
        art,
        caption: ILU[step.key].caption,
        status: step.status,
        step: idx,
        top: (
          <div className="flex justify-center gap-2" dir="ltr">
            {ILU_ORDER.map((l, i) => (
              <span
                key={l}
                className={cx(
                  'min-w-[52px] px-3 py-1.5 rounded-full text-center text-lg font-bold transition-all duration-300',
                  !finished && i === li
                    ? 'bg-primary-soft text-primary-ink scale-105'
                    : finished || i < li
                    ? 'bg-sunken text-diaper'
                    : 'bg-sunken text-muted'
                )}
              >
                {l}
                <small className="block text-[10px] font-medium">{ILU_REPS}×</small>
              </span>
            ))}
          </div>
        ),
      };
    }}
  />
);

// ---------- Circles around the navel ----------

const NAVEL = { x: 160, y: 199 };
const CIRCLE_R = 46;
// Clockwise as the parent sees it, starting above the navel
const CIRCLE: Record<string, Stroke> = {
  O: {
    path: walkPath(
      Array.from({ length: 61 }, (_, i) => {
        const a = -Math.PI / 2 + (i / 60) * Math.PI * 2;
        return [i ? 'L' : 'M', NAVEL.x + CIRCLE_R * Math.cos(a), NAVEL.y + CIRCLE_R * Math.sin(a)] as ['L', number, number];
      })
    ),
    caption: ['עיגול סביב הטבור, בכיוון השעון', 'כמה ס"מ מהטבור, לחץ עדין ואחיד'],
  },
};
const CIRCLES = 24;
const CIRCLE_STROKE = 4000;
const CIRCLE_PLAN: StepPlan[] = Array.from({ length: CIRCLES }, (_, i) => ({ key: 'O', status: `עיגול ${i + 1} מתוך ${CIRCLES}` }));

export const TummyCircles: React.FC = () => (
  <ExercisePlayer
    totalMs={CIRCLE_PLAN.length * (CIRCLE_STROKE + PAUSE_MS)}
    previewMs={CIRCLE_STROKE * 0.4}
    finish={['כל הכבוד, סיימתם', 'אפשר להמשיך ל"ברכיים לבטן" כדי לעזור לגזים לצאת']}
    frame={ms => {
      const { idx, step, art } = strokeFrame(CIRCLE, CIRCLE_PLAN, CIRCLE_STROKE, ms);
      return { art, caption: CIRCLE.O.caption, status: step.status, step: idx };
    }}
  />
);
