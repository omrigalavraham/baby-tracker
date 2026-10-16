import React from 'react';
import { ExercisePlayer, Fingertips, Pt, clamp01, ease } from './engine';

/*
 * Leg exercises seen from the side: the baby on her back on a mat, head on the right,
 * legs toward the parent on the left. Each leg is a two-bone rig: the exercise moves
 * the foot and the knee follows (always bending up, toward the tummy).
 */

const HIP: Pt = { x: 140, y: 200 };
const THIGH = 46;
const SHIN = 44;

function kneeFor(foot: Pt): { knee: Pt; foot: Pt } {
  const dx = foot.x - HIP.x;
  const dy = foot.y - HIP.y;
  const reach = THIGH + SHIN - 0.5;
  let d = Math.hypot(dx, dy);
  let f = foot;
  if (d > reach) {
    f = { x: HIP.x + (dx / d) * reach, y: HIP.y + (dy / d) * reach };
    d = reach;
  }
  const base = Math.atan2(f.y - HIP.y, f.x - HIP.x);
  const bend = Math.acos(Math.max(-1, Math.min(1, (THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d))));
  const k1 = { x: HIP.x + THIGH * Math.cos(base + bend), y: HIP.y + THIGH * Math.sin(base + bend) };
  const k2 = { x: HIP.x + THIGH * Math.cos(base - bend), y: HIP.y + THIGH * Math.sin(base - bend) };
  return { knee: k1.y < k2.y ? k1 : k2, foot: f };
}

const Leg: React.FC<{ foot: Pt; far?: boolean; grip?: boolean; lift?: number }> = ({ foot, far, grip, lift = 0 }) => {
  const { knee, foot: f } = kneeFor(foot);
  const shinAngle = (Math.atan2(f.y - knee.y, f.x - knee.x) * 180) / Math.PI;
  const mid = { x: (knee.x + f.x) / 2, y: (knee.y + f.y) / 2 };
  // The foot sticks out sideways from the ankle, toes toward the sky
  const sl = Math.hypot(f.x - knee.x, f.y - knee.y) || 1;
  let n = { x: -(f.y - knee.y) / sl, y: (f.x - knee.x) / sl };
  if (n.y > 0) n = { x: -n.x, y: -n.y };
  const footC = { x: f.x + n.x * 6, y: f.y + n.y * 6 };
  const footAngle = (Math.atan2(n.y, n.x) * 180) / Math.PI - 90;

  const fill = far ? 'var(--c-skin-deep)' : 'var(--c-skin)';
  const line = 'var(--c-skin-deep)';
  const seg = (a: Pt, b: Pt, w: number) => (
    <>
      <path d={`M${a.x} ${a.y} L${b.x} ${b.y}`} stroke={line} strokeWidth={w + 3} strokeLinecap="round" />
      <path d={`M${a.x} ${a.y} L${b.x} ${b.y}`} stroke={fill} strokeWidth={w} strokeLinecap="round" />
    </>
  );
  return (
    <g>
      {seg(knee, f, 17)}
      <ellipse cx={footC.x} cy={footC.y} rx="7" ry="10.5" transform={`rotate(${footAngle} ${footC.x} ${footC.y})`} fill={fill} stroke={line} strokeWidth="1.5" />
      {/* chubby thigh over the shin */}
      {seg(HIP, knee, 23)}
      <circle cx={knee.x} cy={knee.y} r="10.5" fill={fill} />
      {grip && (
        <Fingertips
          x={mid.x}
          y={mid.y}
          rotate={shinAngle - 90}
          dim={far}
          lift={lift}
          pads={[
            [-9, 0],
            [9, 0],
          ]}
        />
      )}
    </g>
  );
};

const BabySide: React.FC<{ near: Pt; far: Pt; lift?: number }> = ({ near, far, lift }) => (
  <svg viewBox="0 0 360 260" className="block w-full h-auto" role="img" aria-label="התינוקת מהצד, שוכבת על הגב, והרגליים זזות לפי התרגיל">
    <rect x="12" y="226" width="336" height="14" rx="7" fill="var(--c-primary-soft)" />
    <Leg foot={far} far grip lift={lift} />
    {/* body in a short-sleeved bodysuit */}
    <path d="M150 226 Q130 226 128 205 Q130 170 175 165 L262 165 Q285 168 285 196 Q285 226 262 226 Z" fill="var(--c-primary-soft)" />
    <path d="M150 226 Q130 226 128 205 Q130 170 175 165 L262 165 Q285 168 285 196 Q285 226 262 226 Z" fill="none" stroke="var(--c-faint)" strokeWidth="1.5" />
    {/* diaper */}
    <path d="M118 212 Q118 176 150 172 Q170 172 172 200 Q172 226 150 226 Q120 226 118 212 Z" fill="var(--c-surface)" stroke="var(--c-faint)" strokeWidth="1.5" />
    {/* arm resting on the chest */}
    <path d="M262 178 Q246 160 226 160" stroke="var(--c-primary-soft)" strokeWidth="15" fill="none" strokeLinecap="round" />
    <path d="M244 166 Q236 160 226 160" stroke="var(--c-skin)" strokeWidth="12" fill="none" strokeLinecap="round" />
    <circle cx="222" cy="159" r="8" fill="var(--c-skin)" stroke="var(--c-skin-deep)" strokeWidth="1.2" />
    {/* head, face up */}
    <circle cx="308" cy="190" r="37" fill="var(--c-skin)" />
    <path d="M282 168 Q300 148 326 158" stroke="var(--c-skin-deep)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <ellipse cx="300" cy="196" rx="6" ry="8" fill="var(--c-skin-deep)" opacity=".55" />
    <path d="M318 176 Q324 180 330 176" stroke="var(--c-ink)" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" />
    <circle cx="326" cy="190" r="6" fill="var(--c-feed-soft)" />
    <path d="M343 186 Q347 192 343 196" stroke="var(--c-skin-deep)" strokeWidth="2" fill="none" strokeLinecap="round" />
    <Leg foot={near} grip lift={lift} />
  </svg>
);

// ---------- Bicycle ----------

const PEDAL_C: Pt = { x: 96, y: 170 };
const PEDAL_R = 28;
const TURN_MS = 3000;
const TURNS = 40;

const pedal = (a: number): Pt => ({ x: PEDAL_C.x + PEDAL_R * Math.cos(a), y: PEDAL_C.y + PEDAL_R * Math.sin(a) });

export const Bicycle: React.FC = () => (
  <ExercisePlayer
    totalMs={TURNS * TURN_MS}
    previewMs={TURN_MS * 0.3}
    finish={['כל הכבוד, סיימתם', 'יישרו את הרגליים בעדינות ותנו לה לנוח רגע']}
    frame={ms => {
      const turn = Math.floor(ms / TURN_MS);
      // Feet go round like pedals: toward the tummy over the top, out along the bottom
      const a = Math.PI - (ms / TURN_MS) * Math.PI * 2;
      return {
        art: <BabySide near={pedal(a)} far={pedal(a + Math.PI)} />,
        caption: ['דוחפים ברך אחת אל הבטן ומיישרים את השנייה', 'לאט ובעדינות, כמו דיווש באופניים'],
        status: `סיבוב ${Math.min(TURNS, turn + 1)} מתוך ${TURNS}`,
        step: turn,
      };
    }}
  />
);

// ---------- Knees to tummy ----------

const OUT: Pt = { x: 54, y: 206 };
const IN: Pt = { x: 120, y: 170 };
const PHASES = [
  { key: 'push', ms: 2000 },
  { key: 'hold', ms: 8000 },
  { key: 'release', ms: 2000 },
  { key: 'rest', ms: 1500 },
];
const REP_MS = PHASES.reduce((s, p) => s + p.ms, 0);
const KNEE_REPS = 5;

const lerp = (a: Pt, b: Pt, k: number): Pt => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });

export const KneesToTummy: React.FC = () => (
  <ExercisePlayer
    totalMs={KNEE_REPS * REP_MS}
    previewMs={1300}
    speeds={false}
    finish={['כל הכבוד, סיימתם', 'אם יצאו גזים, זה סימן שזה עבד']}
    frame={ms => {
      const rep = Math.min(KNEE_REPS - 1, Math.floor(ms / REP_MS));
      let t = ms - rep * REP_MS;
      let phase = 0;
      while (phase < PHASES.length - 1 && t >= PHASES[phase].ms) t -= PHASES[phase++].ms;
      const p = clamp01(t / PHASES[phase].ms);
      const key = PHASES[phase].key;
      const k = key === 'push' ? ease(p) : key === 'hold' ? 1 : key === 'release' ? 1 - ease(p) : 0;
      // A tiny breathing squeeze while holding, so the hold looks alive
      const squeeze = key === 'hold' ? Math.sin(p * Math.PI * 8) * 1.2 : 0;
      const near = lerp(OUT, IN, k);
      near.x += squeeze;
      const far = { x: near.x + 6, y: near.y - 3 };
      const left = Math.ceil(((1 - p) * PHASES[1].ms) / 1000);
      const caption: Record<string, [string, string]> = {
        push: ['מקרבים בעדינות את שתי הברכיים אל הבטן', 'אוחזים בשוקיים, בלי למשוך'],
        hold: [`מחזיקים... ${left}`, 'לחץ קל ורגוע על הבטן'],
        release: ['משחררים ומיישרים לאט', 'הרגליים חוזרות למקום בעדינות'],
        rest: ['נחים רגע', 'עוד מעט חוזרים שוב'],
      };
      return {
        art: <BabySide near={near} far={far} lift={key === 'rest' ? 0.6 : 0} />,
        caption: caption[key],
        status: `חזרה ${rep + 1} מתוך ${KNEE_REPS}`,
        step: rep * 10 + phase,
      };
    }}
  />
);
