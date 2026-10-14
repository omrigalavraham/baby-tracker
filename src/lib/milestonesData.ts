import { MilestoneItem, ActivityTask } from '../types';

export const MILESTONES: MilestoneItem[] = [
  // ניובורן: 0-4 שבועות
  {
    id: 'm-eye-focus-0',
    minAgeWeeks: 0,
    maxAgeWeeks: 4,
    title: 'מיקוד מבט מטווח קרוב',
    description: 'ממקדת מבט בפנים ממרחק של 20-30 ס"מ (מרחק הנקה/החזקה).',
    category: 'ראייה ושמיעה',
    icon: '👀'
  },
  {
    id: 'm-hear-voice-0',
    minAgeWeeks: 0,
    maxAgeWeeks: 4,
    title: 'הירגעות לשמע קול ההורים',
    description: 'מזהה את קול האם והאב, נרגעת בעת דיבור רגוע ומוכר.',
    category: 'ראייה ושמיעה',
    icon: '👂'
  },
  {
    id: 'm-grasp-reflex-0',
    minAgeWeeks: 0,
    maxAgeWeeks: 4,
    title: 'רפלקס אחיזה חזק',
    description: 'לוכדת היטב אצבע שמונחת בכף ידה.',
    category: 'תנועה ומוטוריקה',
    icon: '✊'
  },
  {
    id: 'm-head-lift-0',
    minAgeWeeks: 0,
    maxAgeWeeks: 4,
    title: 'הרמת סנטר קלה על הבטן',
    description: 'מנסה להרים את הראש לשנייה-שתיים ולהפנות מצד לצד בעת שכיבה על הבטן.',
    category: 'תנועה ומוטוריקה',
    icon: '👶'
  },

  // 1-2 חודשים (5-8 שבועות)
  {
    id: 'm-social-smile-1',
    minAgeWeeks: 4,
    maxAgeWeeks: 8,
    title: 'החיוך החברתי הראשון! 😊',
    description: 'מחייכת באופן רצוני ובתגובה לחיוך, מבט או קול שלכם.',
    category: 'חיוך ומשחק',
    icon: '🥰'
  },
  {
    id: 'm-track-object-1',
    minAgeWeeks: 4,
    maxAgeWeeks: 8,
    title: 'מעקב במבט אחרי חפץ',
    description: 'עוקבת בעיניה אחר חפץ או פנים שנעים באיטיות מצד לצד בטווח של כ-90 מעלות.',
    category: 'ראייה ושמיעה',
    icon: '🎯'
  },
  {
    id: 'm-cooing-1',
    minAgeWeeks: 4,
    maxAgeWeeks: 9,
    title: 'השמעת קולות המיה ("אגוו")',
    description: 'מתחילה להשמיע הברות תנועות עדינות ("אהה", "אוו") בתגובה לדיבור.',
    category: 'תקשורת ורגש',
    icon: '🗣️'
  },
  {
    id: 'm-head-45-1',
    minAgeWeeks: 5,
    maxAgeWeeks: 10,
    title: 'הרמת ראש ל-45 מעלות',
    description: 'מחזיקה את הראש מורם לזמן ממושך יותר בעת שכיבה על הבטן.',
    category: 'תנועה ומוטוריקה',
    icon: '💪'
  },

  // 2-3 חודשים (9-12 שבועות)
  {
    id: 'm-discover-hands-2',
    minAgeWeeks: 8,
    maxAgeWeeks: 14,
    title: 'גילוי הידיים!',
    description: 'מתבוננת בעניין רב בכפות ידיה, מקרבת אותן יחד או אל הפה.',
    category: 'תנועה ומוטוריקה',
    icon: '👐'
  },
  {
    id: 'm-laugh-aloud-2',
    minAgeWeeks: 9,
    maxAgeWeeks: 16,
    title: 'צחוק ראשון בקול',
    description: 'צוחקת בקול מגרגור, פרצוף מצחיק או דיגדוג עדין.',
    category: 'חיוך ומשחק',
    icon: '😂'
  },
  {
    id: 'm-reach-toys-2',
    minAgeWeeks: 10,
    maxAgeWeeks: 16,
    title: 'ניסיון להושיט יד לצעצוע',
    description: 'מנסה לחבוט או לגעת בחפצים תלויים מולה.',
    category: 'תנועה ומוטוריקה',
    icon: '🧸'
  },

  // 3-4 חודשים (13-18 שבועות)
  {
    id: 'm-push-forearms-3',
    minAgeWeeks: 12,
    maxAgeWeeks: 20,
    title: 'הישענות יציבה על אמות הידיים',
    description: 'מרימה ראש וחזה ל-90 מעלות בשכיבה על הבטן כשהמשקל על האמות.',
    category: 'תנועה ומוטוריקה',
    icon: '🏋️'
  },
  {
    id: 'm-turn-to-sound-3',
    minAgeWeeks: 12,
    maxAgeWeeks: 20,
    title: 'סיבוב ראש מכוון לצליל',
    description: 'מפנה את ראשה בחדות לכיוון רעשן, קול או מוזיקה.',
    category: 'ראייה ושמיעה',
    icon: '🔔'
  },

  // 4-6 חודשים (18-26 שבועות)
  {
    id: 'm-rolling-4',
    minAgeWeeks: 16,
    maxAgeWeeks: 26,
    title: 'התהפכות מצד לצד או מהבטן לגב',
    description: 'מתחילה להתגלגל מהבטן לגב (או להפך) בעזרת תנופת הרגליים.',
    category: 'תנועה ומוטוריקה',
    icon: '🔄'
  },
  {
    id: 'm-transfer-hand-4',
    minAgeWeeks: 18,
    maxAgeWeeks: 28,
    title: 'העברת חפץ מיד ליד',
    description: 'תופסת צעצוע ביד אחת ומעבירה אותו ליד השנייה.',
    category: 'תנועה ומוטוריקה',
    icon: '🤝'
  },
  {
    id: 'm-peekaboo-4',
    minAgeWeeks: 20,
    maxAgeWeeks: 30,
    title: 'הנאה ממשחק "קוקו"',
    description: 'מחייכת ומצפה להופעת הפנים מאחורי חיתול הבד.',
    category: 'חיוך ומשחק',
    icon: '🙈'
  }
];

export const ACTIVITIES: ActivityTask[] = [
  // 0-4 שבועות
  {
    id: 'act-tummy-0',
    minAgeWeeks: 0,
    maxAgeWeeks: 6,
    title: 'זמן בטן על חזה ההורה',
    description: 'שכבו בחצי ישיבה והניחו את התינוקת על בית החזה שלכם, בטן לבטן. עודדו אותה להרים את הראש כדי להביט בפניכם.',
    durationMinutes: 3,
    tip: 'זהו זמן בטן נהדר ומרגיע שלא מייצר תסכול, ומשלב חום גוף וקשר עין.',
    category: 'זמן בטן'
  },
  {
    id: 'act-high-contrast-0',
    minAgeWeeks: 0,
    maxAgeWeeks: 8,
    title: 'כרטיסיות שחור-לבן מנוגדות',
    description: 'הציגו כרטיסייה עם דוגמה גיאומטרית שחור-לבן במרחק 25 ס"מ מעיניה, והזיזו אותה באיטיות ימינה ושמאלה.',
    durationMinutes: 4,
    tip: 'תינוקות בני יומם רואים בעיקר ניגודיות חזקה. זה מפתח את שרירי העיניים ואת מרכז הראייה במוח.',
    category: 'משחקי ראייה'
  },
  {
    id: 'act-skin-to-skin-0',
    minAgeWeeks: 0,
    maxAgeWeeks: 8,
    title: 'מגע עור לעור (קנגורו)',
    description: 'הפשיטו את התינוקת לחיתול בלבד והצמידו אותה לחזה חשוף של אמא או אבא, עם שמיכה חמה מעל.',
    durationMinutes: 20,
    tip: 'מווסת חום גוף, דופק ונשימה, ומפריש הורמון אוקסיטוצין המרגיע גם את ההורה וגם את התינוקת.',
    category: 'חיבור ורוגע'
  },
  {
    id: 'act-motherese-0',
    minAgeWeeks: 0,
    maxAgeWeeks: 12,
    title: 'דיבור מלודי ומחבק (Motherese)',
    description: 'דברו אליה מקרוב בקול מעט גבוה ומנוגן, הבעות פנים רחבות והדגשת הברות.',
    durationMinutes: 5,
    tip: 'תינוקות מתוכנתים אבולוציונית להקשיב לקול מוזיקלי ומתנגן. זה הבסיס להתפתחות השפה.',
    category: 'מוזיקה ושפה'
  },

  // 1-2 חודשים
  {
    id: 'act-tracking-1',
    minAgeWeeks: 4,
    maxAgeWeeks: 10,
    title: 'מעקב אחר רעשן אדום/צבעוני',
    description: 'השמיעו רעשן עדין בצד אחד, חכו שתפנה אליו את המבט, ואז הזיזו אותו לאט לצד השני בצורת קשת.',
    durationMinutes: 5,
    tip: 'עוזר לפתח תיאום קשר עין-אוזן ותנועת עיניים חלקה.',
    category: 'משחקי ראייה'
  },
  {
    id: 'act-tummy-mat-1',
    minAgeWeeks: 4,
    maxAgeWeeks: 12,
    title: 'זמן בטן על מזרן פעילות עם מראה',
    description: 'הניחו אותה על הבטן על מזרן נעים, והציבו מול פניה מראה בטיחותית לא שבירה.',
    durationMinutes: 5,
    tip: 'תינוקות נמשכים לפנים האנושיות שבמראה, מה שגורם להן להחזיק את הראש מורם פי כמה זמן.',
    category: 'זמן בטן'
  },
  {
    id: 'act-massage-1',
    minAgeWeeks: 3,
    maxAgeWeeks: 20,
    title: 'עיסוי תינוקות להקלה על גזים',
    description: 'עסו בעדינות את כפות הרגליים והבטן בתנועות סיבוביות (בכיוון השעון - כיוון מערכת העיכול).',
    durationMinutes: 10,
    tip: 'רצוי לבצע כחצי שעה לאחר האכלה או אחרי אמבטיה חמימה.',
    category: 'חיבור ורוגע'
  },

  // 2-4 חודשים
  {
    id: 'act-bicycle-2',
    minAgeWeeks: 6,
    maxAgeWeeks: 16,
    title: 'תרגילי "אופניים" עם הרגליים',
    description: 'אחזו בעדינות בשוקיים ובצעו תנועת דיווש אופניים איטית לכיוון הבטן.',
    durationMinutes: 3,
    tip: 'מצוין לשחרור גזים כלואים ופיתוח תנועתיות מפרקי הירך.',
    category: 'זמן בטן'
  },
  {
    id: 'act-coo-dialogue-2',
    minAgeWeeks: 6,
    maxAgeWeeks: 18,
    title: 'דיאלוג הברות ראשון',
    description: 'כשהתינוקת משמיעה קול ("גו", "אה"), חזרו בדיוק על אותו קול, חייכו, וחכו בסבלנות שתגיב שוב.',
    durationMinutes: 5,
    tip: 'מלמד אותה את חוקי השיחה: "אני מדבר, את מקשיבה, ואז את מדברת ואני מקשיב".',
    category: 'מוזיקה ושפה'
  },
  {
    id: 'act-grasp-reach-3',
    minAgeWeeks: 10,
    maxAgeWeeks: 20,
    title: 'הגשת צעצועים עם מרקמים שונים',
    description: 'הציעו לה בדים שונים (משי, כותנה, צמר רך) ורעשנים קלים לאחיזה.',
    durationMinutes: 7,
    tip: 'מפתח את חוש המישוש והמודעות לכפות הידיים.',
    category: 'משחקי ראייה'
  }
];
