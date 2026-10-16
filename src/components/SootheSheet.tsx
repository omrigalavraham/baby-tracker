import React, { useEffect, useState } from 'react';
import { ChevronLeft, HeartHandshake } from 'lucide-react';
import { Card, Sheet } from './ui';
import { IluMassage, TummyCircles } from './soothe/TopMassage';
import { Bicycle, KneesToTummy } from './soothe/LegsSide';
import { FootballHold } from './soothe/FootballHold';

/*
 * "הרגעה": guided exercises for tummy aches and gas. Each exercise opens an animated
 * player inside the same sheet. Content is general guidance, not medical advice.
 */

interface SootheSheetProps {
  open: boolean;
  onClose: () => void;
}

interface Exercise {
  id: string;
  title: string;
  meta: string;
  Player: React.FC;
  before: string[];
  stop: string[];
}

const COMMON_STOP = [
  'אם היא בוכה או נלחצת, עוצרים ומנסים בפעם אחרת.',
  'חום, הקאות, בטן קשה ונפוחה או דם בצואה: פונים לרופאה.',
];

const ON_BACK = 'השכיבו אותה על הגב, על משטח רך וחם, עם הרגליים אליכם.';

const EXERCISES: Exercise[] = [
  {
    id: 'ilu',
    title: 'עיסוי I‑L‑U',
    meta: 'גזים · 5 דקות',
    Player: IluMassage,
    before: [
      'חכו לפחות חצי שעה אחרי האכלה.',
      ON_BACK,
      'חממו את הידיים ושימו טיפת שמן תינוקות.',
      'עקבו אחרי הנקודות. הכיוונים כתובים כפי שאתם רואים אותה מולכם.',
      'בסוף, קפלו בעדינות את הברכיים אל הבטן ל־10 שניות.',
    ],
    stop: [...COMMON_STOP, 'לא לוחצים חזק ולא מעסים מעל הצלעות.'],
  },
  {
    id: 'bike',
    title: 'אופניים',
    meta: 'גזים · 2 דקות',
    Player: Bicycle,
    before: [
      'חכו לפחות חצי שעה אחרי האכלה.',
      ON_BACK,
      'אחזו בעדינות בשתי השוקיים, מתחת לברכיים.',
      'סובבו את הרגליים לסירוגין, כמו דיווש. ברך אחת מתקרבת לבטן כשהשנייה מתיישרת.',
    ],
    stop: [...COMMON_STOP, 'לא מותחים את הרגליים עד הסוף ולא מכריחים תנועה.'],
  },
  {
    id: 'knees',
    title: 'ברכיים לבטן',
    meta: 'גזים · 1 דקה',
    Player: KneesToTummy,
    before: [
      ON_BACK,
      'אחזו בשתי השוקיים יחד.',
      'קרבו בעדינות את הברכיים אל הבטן והחזיקו כמה שניות.',
      'שחררו לאט וחזרו 5 פעמים. אפשר מיד אחרי עיסוי.',
    ],
    stop: [...COMMON_STOP, 'הלחץ קל בלבד. אם היא מתנגדת, מרפים.'],
  },
  {
    id: 'circles',
    title: 'עיגולים סביב הטבור',
    meta: 'כאבי בטן · 2 דקות',
    Player: TummyCircles,
    before: [
      'חכו לפחות חצי שעה אחרי האכלה.',
      ON_BACK,
      'חממו את הידיים ושימו טיפת שמן תינוקות.',
      'ציירו עיגולים סביב הטבור עם קצות האצבעות, תמיד בכיוון השעון כפי שאתם רואים אותה.',
    ],
    stop: [...COMMON_STOP, 'לא לוחצים על הטבור עצמו, בעיקר אם הוא עוד לא החלים.'],
  },
  {
    id: 'football',
    title: 'החזקת פוטבול',
    meta: 'הרגעה · כמה שצריך',
    Player: FootballHold,
    before: [
      'הניחו אותה על הבטן לאורך האמה, הראש בכף היד והפנים לצד.',
      'הרגליים שלה משני צדי המרפק.',
      'החזיקו אותה צמוד לגוף ונדנדו בעדינות.',
      'עם היד השנייה טפחו או לטפו את הגב בקצב רגוע.',
    ],
    stop: ['תמיד לוודא שהאף והפה פנויים.', 'לא נרדמים כך: כשהיא נרדמת, מעבירים אותה למיטה על הגב.', COMMON_STOP[1]],
  },
];

export const SootheSheet: React.FC<SootheSheetProps> = ({ open, onClose }) => {
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  useEffect(() => {
    if (!open) setExerciseId(null);
  }, [open]);

  const ex = EXERCISES.find(e => e.id === exerciseId);

  return (
    <Sheet open={open} onClose={onClose} title={ex ? ex.title : 'הרגעה'} icon={<HeartHandshake />} tone="sleep">
      {ex ? (
        <div key={ex.id} className="animate-view-in flex flex-col gap-5">
          <ex.Player />

          <Card className="p-5 flex flex-col gap-3">
            <h3 className="text-[15px] font-medium text-ink">איך עושים</h3>
            <ol className="flex flex-col gap-2.5 text-[14px] text-ink">
              {ex.before.map((s, i) => (
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
              {ex.stop.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <button onClick={() => setExerciseId(null)} className="self-center text-[14px] text-muted py-2">
            חזרה לכל התרגילים
          </button>
        </div>
      ) : (
        <div key="list" className="animate-view-in flex flex-col gap-3">
          <p className="text-[14px] text-muted -mt-2">תרגילים עדינים לכאבי בטן וגזים, עם הדגמה מונפשת וטיימר.</p>
          {EXERCISES.map(e => (
            <button
              key={e.id}
              onClick={() => setExerciseId(e.id)}
              className="flex items-center gap-3 p-3 ps-4 rounded-[22px] text-right bg-sleep-soft transition-transform active:scale-[0.98]"
            >
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-medium text-ink">{e.title}</span>
                <span className="block text-[13px] text-muted">{e.meta}</span>
              </span>
              <ChevronLeft className="w-5 h-5 text-sleep" />
            </button>
          ))}
          <p className="text-[12px] text-muted text-center pt-1">מידע כללי, לא מחליף ייעוץ של רופאה או אחות טיפת חלב.</p>
        </div>
      )}
    </Sheet>
  );
};
