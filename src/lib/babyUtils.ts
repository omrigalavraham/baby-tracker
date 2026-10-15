import { BabyEvent, BabyProfile } from '../types';

/**
 * Calculates detailed age description in Hebrew
 */
export function calculateAge(birthDateStr: string): {
  totalDays: number;
  totalWeeks: number;
  displayText: string;
  shortText: string;
  stageName: string;
} {
  if (!birthDateStr) {
    return { totalDays: 0, totalWeeks: 0, displayText: 'עדיין לא הוגדר', shortText: '', stageName: 'ניובורן' };
  }

  const birth = new Date(birthDateStr);
  const now = new Date();
  
  // Difference in milliseconds
  const diffTime = Math.max(0, now.getTime() - birth.getTime());
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;

  let displayText = '';
  let shortText = '';

  if (totalDays === 0) {
    displayText = 'נולדה היום! מזל טוב 🎈';
    shortText = 'היום';
  } else if (totalDays === 1) {
    displayText = 'בת יום אחד';
    shortText = 'יום 1';
  } else if (totalDays < 7) {
    displayText = `בת ${totalDays} ימים`;
    shortText = `${totalDays} ימים`;
  } else if (totalWeeks < 8) {
    const weeksStr = totalWeeks === 1 ? 'שבוע אחד' : totalWeeks === 2 ? 'שבועיים' : `${totalWeeks} שבועות`;
    const daysStr = remainingDays === 0 ? '' : remainingDays === 1 ? ' ויום' : ` ו-${remainingDays} ימים`;
    displayText = `בת ${weeksStr}${daysStr}`;
    shortText = `${totalWeeks} שב'${daysStr ? ` + ${remainingDays} ימ'` : ''}`;
  } else {
    // Months calculation
    const months = Math.floor(totalDays / 30.4375);
    const daysInMonth = Math.floor(totalDays % 30.4375);
    const monthsStr = months === 1 ? 'חודש' : months === 2 ? 'חודשיים' : `${months} חודשים`;
    const daysStr = daysInMonth === 0 ? '' : ` ו-${daysInMonth} ימים`;
    displayText = `בת ${monthsStr}${daysStr}`;
    shortText = `${months} חודשים`;
  }

  // Development Stage Name
  let stageName = 'ניובורן (0-4 שבועות)';
  if (totalWeeks >= 4 && totalWeeks < 8) stageName = 'חודש שני (5-8 שבועות)';
  else if (totalWeeks >= 8 && totalWeeks < 12) stageName = 'חודש שלישי (9-12 שבועות)';
  else if (totalWeeks >= 12 && totalWeeks < 16) stageName = 'חודש רביעי (3-4 חודשים)';
  else if (totalWeeks >= 16 && totalWeeks < 24) stageName = 'חודשים 4-6';
  else if (totalWeeks >= 24) stageName = 'חודשים 6 ומעלה';

  return { totalDays, totalWeeks, displayText, shortText, stageName };
}

/**
 * Format relative time in Hebrew (e.g. "לפני 15 דקות", "לפני שעתיים")
 */
export function formatTimeAgo(isoString?: string): string {
  if (!isoString) return 'טרם נרשם';
  
  const eventTime = new Date(isoString).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - eventTime) / 1000);

  if (diffSec < 60) return 'ממש עכשיו';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `לפני ${diffMin} דק'`;
  
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return 'לפני שעה';
  if (diffHours === 2) return 'לפני שעתיים';
  if (diffHours < 24) return `לפני ${diffHours} שעות`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'אתמול';
  return `לפני ${diffDays} ימים`;
}

/**
 * Format live elapsed duration from a start ISO string (for live sleep counter)
 */
export function formatLiveDuration(isoStartedAt: string): {
  totalSeconds: number;
  hours: number;
  minutes: number;
  seconds: number;
  formattedClock: string;
  formattedText: string;
} {
  const start = new Date(isoStartedAt).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - start) / 1000));

  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const formattedClock = hours > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;

  let formattedText = '';
  if (diffSec < 60) {
    formattedText = `${seconds} שניות`;
  } else if (hours === 0) {
    formattedText = `${minutes} דקות`;
  } else if (hours === 1) {
    formattedText = `שעה ${minutes > 0 ? `ו-${minutes} דק'` : ''}`;
  } else {
    formattedText = `${hours} שעות ${minutes > 0 ? `ו-${minutes} דק'` : ''}`;
  }

  return { totalSeconds: diffSec, hours, minutes, seconds, formattedClock, formattedText };
}

/**
 * Format time of day (e.g. "14:35")
 */
export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Format date (e.g. "14 באוקטובר 2026")
 */
export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

/**
 * Export events to a CSV file downloadable in Excel / Google Sheets
 */
export function exportEventsToCSV(events: BabyEvent[], profile: BabyProfile): void {
  const headers = ['סוג פעולה', 'תאריך', 'שעת התחלה', 'שעת סיום', 'משך זמן / כמות', 'פרטים', 'הערות', 'הוזן על ידי'];
  
  const rows = events.map(e => {
    let typeHebrew = 'אחר';
    let durationOrAmount = '';
    let detailsStr = '';

    if (e.type === 'feeding') {
      typeHebrew = 'האכלה';
      if (e.details?.feedType === 'breast') {
        const sideHebrew = e.details.breastSide === 'left' ? 'צד שמאל' : e.details.breastSide === 'right' ? 'צד ימין' : 'שני הצדדים';
        durationOrAmount = `${e.details.durationMinutes || 0} דקות`;
        detailsStr = `הנקה (${sideHebrew})`;
      } else if (e.details?.feedType === 'bottle') {
        durationOrAmount = `${e.details.bottleAmountMl || 0} מ"ל`;
        detailsStr = `בקבוק (${e.details.bottleContent === 'breast_milk' ? 'חלב שאוב' : 'תמ"ל'})`;
      }
    } else if (e.type === 'diaper') {
      typeHebrew = 'חיתול';
      const diaperHebrew = e.details?.diaperType === 'pee' ? 'פיפי 💧' : e.details?.diaperType === 'poop' ? 'קקי 💩' : 'פיפי + קקי 💧💩';
      detailsStr = diaperHebrew + (e.details?.poopColor ? ` (צבע: ${e.details.poopColor})` : '');
    } else if (e.type === 'sleep') {
      typeHebrew = 'שינה';
      durationOrAmount = e.details?.durationMinutes ? `${e.details.durationMinutes} דקות` : (e.details?.isOngoing ? 'ישנה כעת' : '');
      detailsStr = e.details?.isOngoing ? 'עדיין ישנה' : 'שנת תינוקת';
    } else if (e.type === 'weight') {
      typeHebrew = 'משקל';
      durationOrAmount = `${e.details?.weightKg} ק"ג`;
      detailsStr = 'שקילה ומעקב גדילה';
    } else if (e.type === 'height') {
      typeHebrew = 'גובה';
      durationOrAmount = `${e.details?.heightCm} ס"מ`;
      detailsStr = 'מדידת אורך';
    }

    return [
      typeHebrew,
      formatDate(e.started_at),
      formatTime(e.started_at),
      e.ended_at ? formatTime(e.ended_at) : '',
      durationOrAmount,
      detailsStr,
      e.notes || '',
      e.created_by || 'הורה'
    ];
  });

  // UTF-8 BOM for Excel Hebrew compatibility
  const BOM = '\uFEFF';
  const csvContent = BOM + [headers, ...rows]
    .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `יומן_מעקב_${profile.name || 'תינוקת'}_${localDateKey()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Local calendar date as 'YYYY-MM-DD' (toISOString() is UTC and flips the day late in Israel). */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
