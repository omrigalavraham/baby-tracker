import React, { useEffect, useState } from 'react';
import { ChevronLeft, HeartHandshake } from 'lucide-react';
import { Card, Sheet, cx } from './ui';
import { IluMassage } from './soothe/IluMassage';

/*
 * "הרגעה": guided exercises for tummy aches and gas. Each exercise opens an animated
 * player inside the same sheet. Content is general guidance, not medical advice.
 */

interface SootheSheetProps {
  open: boolean;
  onClose: () => void;
}

const EXERCISES = [
  { id: 'ilu', title: 'עיסוי I‑L‑U', meta: 'גזים · 5 דקות', ready: true },
  { id: 'bike', title: 'אופניים', meta: 'גזים · 2 דקות', ready: false },
  { id: 'knees', title: 'ברכיים לבטן', meta: 'גזים · 1 דקה', ready: false },
  { id: 'circles', title: 'עיגולים סביב הטבור', meta: 'כאבי בטן · 3 דקות', ready: false },
  { id: 'football', title: 'החזקת פוטבול', meta: 'הרגעה · כמה שצריך', ready: false },
];

const BEFORE = [
  'חכו לפחות חצי שעה אחרי האכלה.',
  'השכיבו אותה על הגב, על משטח רך וחם, עם הרגליים אליכם.',
  'חממו את הידיים ושימו טיפת שמן תינוקות.',
  'עקבו אחרי הנקודות על המסך. התנועה תמיד בכיוון השעון, כפי שאתם רואים אותה.',
  'בסוף, קפלו בעדינות את הברכיים אל הבטן ל־10 שניות.',
];

export const SootheSheet: React.FC<SootheSheetProps> = ({ open, onClose }) => {
  const [exercise, setExercise] = useState<string | null>(null);
  useEffect(() => {
    if (!open) setExercise(null);
  }, [open]);

  return (
    <Sheet open={open} onClose={onClose} title={exercise ? 'עיסוי בטן I‑L‑U' : 'הרגעה'} icon={<HeartHandshake />} tone="sleep">
      {exercise === 'ilu' ? (
        <div key="ilu" className="animate-view-in flex flex-col gap-5">
          <IluMassage />

          <Card className="p-5 flex flex-col gap-3">
            <h3 className="text-[15px] font-medium text-ink">לפני שמתחילים</h3>
            <ol className="flex flex-col gap-2.5 text-[14px] text-ink">
              {BEFORE.map((s, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <span className="w-6 h-6 rounded-full bg-sleep-soft text-sleep-ink text-xs font-medium flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </Card>

          <div className="rounded-[28px] bg-danger-soft p-5 flex flex-col gap-2">
            <h3 className="text-[15px] font-medium text-danger">מתי לעצור ולפנות לרופאה</h3>
            <ul className="list-disc ps-5 flex flex-col gap-1 text-[14px] text-ink">
              <li>אם היא בוכה או נלחצת, עוצרים ומנסים בפעם אחרת.</li>
              <li>חום, הקאות, בטן קשה ונפוחה או דם בצואה: פונים לרופאה.</li>
              <li>לא לוחצים חזק ולא מעסים מעל הצלעות.</li>
            </ul>
          </div>

          <button onClick={() => setExercise(null)} className="self-center text-[14px] text-muted py-2">
            חזרה לכל התרגילים
          </button>
        </div>
      ) : (
        <div key="list" className="animate-view-in flex flex-col gap-3">
          <p className="text-[14px] text-muted -mt-2">תרגילים עדינים לכאבי בטן וגזים, עם הדגמה מונפשת וטיימר.</p>
          {EXERCISES.map(ex => (
            <button
              key={ex.id}
              disabled={!ex.ready}
              onClick={() => setExercise(ex.id)}
              className={cx(
                'flex items-center gap-3 p-3 ps-4 rounded-[22px] text-right transition-transform active:scale-[0.98]',
                ex.ready ? 'bg-sleep-soft' : 'bg-sunken'
              )}
            >
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-medium text-ink">{ex.title}</span>
                <span className="block text-[13px] text-muted">{ex.meta}</span>
              </span>
              {ex.ready ? (
                <ChevronLeft className="w-5 h-5 text-sleep" />
              ) : (
                <span className="text-[11px] text-muted bg-surface px-2 py-0.5 rounded-full">בקרוב</span>
              )}
            </button>
          ))}
          <p className="text-[12px] text-muted text-center pt-1">מידע כללי, לא מחליף ייעוץ של רופאה או אחות טיפת חלב.</p>
        </div>
      )}
    </Sheet>
  );
};
