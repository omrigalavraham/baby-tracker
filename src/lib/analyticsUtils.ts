import { BabyEvent, BabyProfile } from '../types';
import { calculateAge } from './babyUtils';

export interface DayStats {
  dateKey: string;
  totalFeedings: number;
  breastFeedingsCount: number;
  bottleFeedingsCount: number;
  totalNursingMinutes: number;
  totalBottleMl: number;
  leftBreastMinutes: number;
  rightBreastMinutes: number;
  lastBreastSide?: 'left' | 'right' | 'both';
  nextRecommendedSide?: 'left' | 'right';
  
  totalDiapers: number;
  peeCount: number;
  poopCount: number;
  bothCount: number;
  poopColors: { [color: string]: number };

  totalSleepMinutes: number;
  sleepSessionsCount: number;
  daySleepMinutes: number;
  nightSleepMinutes: number;

  averageFeedingIntervalHours?: number;
}

export interface SmartInsight {
  id: string;
  category: 'sleep' | 'feeding' | 'diaper' | 'growth' | 'general';
  title: string;
  description: string;
  badge: string;
  icon: string;
  type: 'success' | 'info' | 'tip' | 'warning';
}

/**
 * Filter events for a given period: 'today' | 'yesterday' | 'week'
 */
export function filterEventsByPeriod(events: BabyEvent[], period: 'today' | 'yesterday' | 'week'): BabyEvent[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - 7 * 86400000;

  return events.filter(e => {
    const time = new Date(e.started_at).getTime();
    if (period === 'today') {
      return time >= todayStart;
    } else if (period === 'yesterday') {
      return time >= yesterdayStart && time < todayStart;
    } else {
      return time >= weekStart;
    }
  });
}

/**
 * Compute detailed statistics for a set of events
 */
export function computeStats(events: BabyEvent[]): DayStats {
  const stats: DayStats = {
    dateKey: new Date().toISOString().slice(0, 10),
    totalFeedings: 0,
    breastFeedingsCount: 0,
    bottleFeedingsCount: 0,
    totalNursingMinutes: 0,
    totalBottleMl: 0,
    leftBreastMinutes: 0,
    rightBreastMinutes: 0,
    totalDiapers: 0,
    peeCount: 0,
    poopCount: 0,
    bothCount: 0,
    poopColors: {},
    totalSleepMinutes: 0,
    sleepSessionsCount: 0,
    daySleepMinutes: 0,
    nightSleepMinutes: 0
  };

  const feedingTimes: number[] = [];

  // Sort chronologically for interval analysis
  const sorted = [...events].sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

  sorted.forEach(ev => {
    // 1. Feeding
    if (ev.type === 'feeding') {
      stats.totalFeedings++;
      const time = new Date(ev.started_at).getTime();
      feedingTimes.push(time);

      if (ev.details?.feedType === 'breast') {
        stats.breastFeedingsCount++;
        const dur = ev.details.durationMinutes || 0;
        stats.totalNursingMinutes += dur;
        stats.leftBreastMinutes += ev.details.durationLeftMinutes || (ev.details.breastSide === 'left' ? dur : 0);
        stats.rightBreastMinutes += ev.details.durationRightMinutes || (ev.details.breastSide === 'right' ? dur : 0);
        stats.lastBreastSide = ev.details.breastSide;
        // If last was left, recommend right, and vice versa
        if (ev.details.breastSide === 'left') stats.nextRecommendedSide = 'right';
        else if (ev.details.breastSide === 'right') stats.nextRecommendedSide = 'left';
      } else if (ev.details?.feedType === 'bottle') {
        stats.bottleFeedingsCount++;
        stats.totalBottleMl += ev.details.bottleAmountMl || 0;
      }
    }

    // 2. Diapers
    if (ev.type === 'diaper') {
      stats.totalDiapers++;
      const dType = ev.details?.diaperType;
      if (dType === 'pee') stats.peeCount++;
      else if (dType === 'poop') stats.poopCount++;
      else if (dType === 'both') {
        stats.bothCount++;
        stats.peeCount++;
        stats.poopCount++;
      }

      if (ev.details?.poopColor) {
        stats.poopColors[ev.details.poopColor] = (stats.poopColors[ev.details.poopColor] || 0) + 1;
      }
    }

    // 3. Sleep
    if (ev.type === 'sleep') {
      const duration = ev.details?.durationMinutes || 0;
      if (duration > 0) {
        stats.sleepSessionsCount++;
        stats.totalSleepMinutes += duration;

        // Day vs Night (Night: 20:00 to 07:00)
        const hour = new Date(ev.started_at).getHours();
        if (hour >= 20 || hour < 7) {
          stats.nightSleepMinutes += duration;
        } else {
          stats.daySleepMinutes += duration;
        }
      }
    }
  });

  // Calculate average interval between feedings
  if (feedingTimes.length >= 2) {
    let totalGaps = 0;
    for (let i = 1; i < feedingTimes.length; i++) {
      totalGaps += (feedingTimes[i] - feedingTimes[i - 1]);
    }
    const avgMs = totalGaps / (feedingTimes.length - 1);
    stats.averageFeedingIntervalHours = Number((avgMs / (1000 * 60 * 60)).toFixed(1));
  }

  return stats;
}

/**
 * Generate Smart Pediatric Insights based on baby's logs and age
 */
export function generateSmartInsights(events: BabyEvent[], profile: BabyProfile): SmartInsight[] {
  const insights: SmartInsight[] = [];
  const age = calculateAge(profile.birth_date);
  const weeks = age.totalWeeks;

  // Filter last 24 hours
  const last24h = events.filter(e => {
    return Date.now() - new Date(e.started_at).getTime() <= 24 * 60 * 60 * 1000;
  });

  const stats24h = computeStats(last24h);

  // 1. WAKE WINDOW & NEXT NAP PREDICTION (חלונות ערות ותנומה הבאה)
  const lastSleep = events.find(e => e.type === 'sleep');
  const isSleeping = lastSleep?.details?.isOngoing;

  // Expected wake window based on age
  let expectedWakeMinutes = 60; // 0-4 weeks
  if (weeks >= 4 && weeks < 12) expectedWakeMinutes = 75; // 1-3 months
  else if (weeks >= 12 && weeks < 18) expectedWakeMinutes = 90; // 3-4 months
  else if (weeks >= 18) expectedWakeMinutes = 120; // 4+ months

  if (isSleeping) {
    insights.push({
      id: 'ins-sleep-now',
      category: 'sleep',
      title: 'התינוקת ישנה כעת - מנוחה מתוקה',
      description: 'השינה חיונית כעת להפרשת הורמון הגדילה ולהתפתחות המוחית. נצלו את הזמן למנוחה שלכם!',
      badge: 'שינה פעילה',
      icon: '😴',
      type: 'info'
    });
  } else if (lastSleep && lastSleep.ended_at) {
    const awakeMs = Date.now() - new Date(lastSleep.ended_at).getTime();
    const awakeMinutes = Math.floor(awakeMs / 60000);
    const minutesLeft = expectedWakeMinutes - awakeMinutes;

    if (minutesLeft <= 0) {
      insights.push({
        id: 'ins-wake-tired',
        category: 'sleep',
        title: 'סימני עייפות צפויים כעת! 🥱',
        description: `היא ערה כבר כ-${awakeMinutes} דקות (מעבר לחלון הערות המומלץ לגילה של ${expectedWakeMinutes} דק'). כדאי להתחיל טקס הרדמה רגוע כדי למנוע עייפות יתר.`,
        badge: 'חלון ערות הסתיים',
        icon: '⏰',
        type: 'warning'
      });
    } else {
      const nextNapTime = new Date(Date.now() + minutesLeft * 60000);
      const timeStr = nextNapTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      insights.push({
        id: 'ins-wake-window',
        category: 'sleep',
        title: `תנומה הבאה צפויה בסביבות ${timeStr}`,
        description: `היא ערה ${awakeMinutes} דקות. חלון הערות האידיאלי לגילה הוא כ-${expectedWakeMinutes} דק'. בעוד כ-${minutesLeft} דק' כדאי להתחיל להרגיע.`,
        badge: `ערה ${awakeMinutes} דק'`,
        icon: '⏳',
        type: 'tip'
      });
    }
  }

  // 2. DIAPER HYDRATION INSIGHT (מדד צריכת נוזלים)
  const wetDiapers = stats24h.peeCount;
  if (wetDiapers >= 6) {
    insights.push({
      id: 'ins-hydration-good',
      category: 'diaper',
      title: 'הידרציה מעולה ושפע נוזלים! 💧',
      description: `נרשמו ${wetDiapers} חיתולים רטובים ב-24 השעות האחרונות. לפי הנחיות טיפת חלב, 6 חיתולים רטובים ביום הם סימן מובהק להזנה מצוינת!`,
      badge: `${wetDiapers} חיתולי פיפי`,
      icon: '💧',
      type: 'success'
    });
  } else if (last24h.length > 3 && wetDiapers < 4) {
    insights.push({
      id: 'ins-hydration-low',
      category: 'diaper',
      title: 'מעקב שתן: פחות מ-4 חיתולים ב-24 שעות',
      description: 'בגיל זה מצופים כ-5-6 חיתולים רטובים ביממה. ודאו שהיא יונקת ביעילות או הציעו האכלה נוספת.',
      badge: 'תשומת לב',
      icon: '⚠️',
      type: 'warning'
    });
  }

  // 3. FEEDING BALANCE & NEXT SIDE (איזון הנקה ושד הבא)
  if (stats24h.lastBreastSide) {
    const nextSideHebrew = stats24h.nextRecommendedSide === 'left' ? 'שמאל' : 'ימין';
    const lastSideHebrew = stats24h.lastBreastSide === 'left' ? 'שמאל' : stats24h.lastBreastSide === 'right' ? 'ימין' : 'שניהם';
    insights.push({
      id: 'ins-feed-side',
      category: 'feeding',
      title: `ההאכלה הבאה: מומלץ להתחיל מצד ${nextSideHebrew}`,
      description: `בהאכלה האחרונה ינקה מצד ${lastSideHebrew}. החלפת שד התחלתי בכל האכלה מבטיחה ריקון מלא ושומרת על ייצור חלב מאוזן.`,
      badge: `צד ${nextSideHebrew}`,
      icon: '🤱',
      type: 'tip'
    });
  }

  // 4. FEEDING INTERVAL (מרווח בין האכלות)
  if (stats24h.averageFeedingIntervalHours) {
    const interval = stats24h.averageFeedingIntervalHours;
    if (interval >= 2 && interval <= 3.5) {
      insights.push({
        id: 'ins-feed-interval',
        category: 'feeding',
        title: `דפוס האכלה קבוע: כל ${interval} שעות`,
        description: 'מרווח האכלות אידיאלי ותקין לחלוטין לתינוקות בגיל הזה, המעיד על מערכת עיכול מאוזנת ותיאבון בריא.',
        badge: `ממוצע ${interval} שעות`,
        icon: '🍼',
        type: 'success'
      });
    }
  }

  // 5. DIGESTION & POOP COLOR (מערכת העיכול)
  const poopColors = Object.keys(stats24h.poopColors);
  if (poopColors.includes('צהוב חרדלי')) {
    insights.push({
      id: 'ins-poop-mustard',
      category: 'diaper',
      title: 'עיכול בריא: יציאות צהובות-חרדליות 💩',
      description: 'צבע חרדלי וגרגירי הוא הסימן הקלאסי והבריא ביותר לעיכול מלא ותקין של חלב אם.',
      badge: 'יציאות תקינות',
      icon: '✨',
      type: 'success'
    });
  }

  // 6. TOTAL SLEEP CHECK (סה"כ שעות שינה)
  const totalSleepHours = Number((stats24h.totalSleepMinutes / 60).toFixed(1));
  if (totalSleepHours >= 12) {
    insights.push({
      id: 'ins-sleep-total',
      category: 'sleep',
      title: `${totalSleepHours} שעות שינה ב-24 שעות האחרונות`,
      description: 'התינוקת ישנה כמות מעולה של שעות. מוחה מעבד את כל הגירויים של היום בזמן השינה.',
      badge: `${totalSleepHours} שעות שינה`,
      icon: '🌙',
      type: 'success'
    });
  }

  // 7. ENCOURAGEMENT FOR PARENTS (חיזוק להורים)
  insights.push({
    id: 'ins-parents-cheer',
    category: 'general',
    title: 'אתם עושים עבודה מדהימה! 💖',
    description: `תיעוד קפדני של ${stats24h.totalFeedings} האכלות ו-${stats24h.totalDiapers} חיתולים ב-24 שעות מעיד על טיפול מסור, אכפתי ומדויק. כל הכבוד!`,
    badge: 'הורות למופת',
    icon: '🏆',
    type: 'success'
  });

  return insights;
}
