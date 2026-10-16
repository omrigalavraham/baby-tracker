import React from 'react';
import { ExercisePlayer, Fingertips } from './engine';

/*
 * Football hold: the baby lies belly-down along the parent's forearm, head resting in
 * the palm and legs on either side of the elbow. The arm sways gently and the other
 * hand pats her back. Open-ended: the timer counts up.
 */

const SWAY_MS = 3200;
const PAT_MS = 1200;

export const FootballHold: React.FC = () => (
  <ExercisePlayer
    totalMs={Infinity}
    previewMs={PAT_MS * 0.15}
    speeds={false}
    frame={ms => {
      const sway = Math.sin((ms / SWAY_MS) * Math.PI * 2) * 2.2;
      const patT = (ms % PAT_MS) / PAT_MS;
      // Quick soft tap, then the hand rests
      const pat = patT < 0.25 ? Math.sin((patT / 0.25) * Math.PI) : 0;
      return {
        art: (
          <svg viewBox="0 0 360 260" className="block w-full h-auto" role="img" aria-label="התינוקת שוכבת על הבטן לאורך האמה, היד השנייה מלטפת את הגב">
            <g transform={`rotate(${sway} 300 196)`}>
              {/* parent's sleeve and forearm */}
              <rect x="292" y="168" width="80" height="58" rx="26" fill="var(--c-surface)" stroke="var(--c-faint)" strokeWidth="1.5" />
              <path d="M300 197 L104 200" stroke="var(--c-hand-line)" strokeWidth="44" strokeLinecap="round" />
              <path d="M300 197 L104 200" stroke="var(--c-hand)" strokeWidth="41" strokeLinecap="round" />
              {/* baby's far leg, behind the arm */}
              <path d="M262 182 Q284 200 286 230" stroke="var(--c-skin-deep)" strokeWidth="14" fill="none" strokeLinecap="round" />
              {/* baby, belly down */}
              <path d="M128 168 Q140 136 196 134 L250 136 Q282 142 280 166 Q276 186 248 186 L150 188 Q126 188 128 168 Z" fill="var(--c-primary-soft)" />
              <path d="M240 140 Q270 140 278 158 Q284 180 258 186 Q236 186 232 166 Q232 146 240 140 Z" fill="var(--c-surface)" stroke="var(--c-faint)" strokeWidth="1.5" />
              {/* her near arm and leg hanging down beside the parent's arm */}
              <path d="M150 180 Q142 204 148 226" stroke="var(--c-skin)" strokeWidth="12" fill="none" strokeLinecap="round" />
              <circle cx="148" cy="228" r="7" fill="var(--c-skin)" stroke="var(--c-skin-deep)" strokeWidth="1.2" />
              <path d="M256 182 Q270 206 268 234" stroke="var(--c-skin)" strokeWidth="15" fill="none" strokeLinecap="round" />
              <ellipse cx="268" cy="238" rx="9" ry="6" fill="var(--c-skin)" stroke="var(--c-skin-deep)" strokeWidth="1.2" />
              {/* head resting in the palm, cheek to the side */}
              <ellipse cx="86" cy="206" rx="32" ry="17" fill="var(--c-hand)" stroke="var(--c-hand-line)" strokeWidth="1.5" />
              <circle cx="98" cy="168" r="32" fill="var(--c-skin)" />
              <path d="M110 140 Q128 148 130 166" stroke="var(--c-skin-deep)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M82 166 Q88 170 94 166" stroke="var(--c-ink)" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" />
              <circle cx="84" cy="180" r="6" fill="var(--c-feed-soft)" />
              <path d="M70 182 Q74 186 78 184" stroke="var(--c-skin-deep)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              {/* parent's thumb over the cheek side, fingers under the chest */}
              <path d="M62 204 Q60 188 70 182" stroke="var(--c-hand-line)" strokeWidth="12.5" fill="none" strokeLinecap="round" />
              <path d="M62 204 Q60 188 70 182" stroke="var(--c-hand)" strokeWidth="10" fill="none" strokeLinecap="round" />
              {/* other hand patting her back */}
              <Fingertips x={196} y={128 + pat * 6} lift={0.5 * (1 - pat)} />
            </g>
          </svg>
        ),
        caption: ['נדנוד עדין מצד לצד, וטפיחות רכות על הגב', 'הלחץ של האמה על הבטן עוזר לגזים לצאת'],
        status: 'כמה זמן',
        step: Math.floor(ms / SWAY_MS),
      };
    }}
  />
);
