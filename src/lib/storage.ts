import { BabyEvent, BabyProfile, DailyReminderItem, SmartTimersConfig } from '../types';
import { localDateKey } from './babyUtils';

const BABY_PROFILE_KEY = 'avigi_baby_profile';
const BABY_EVENTS_KEY = 'avigi_baby_events';
const COMPLETED_MILESTONES_KEY = 'avigi_completed_milestones';
const FAMILY_CODE_PARAM = 'family';

export function generateFamilyCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'BABY-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check if a family code was provided in URL query parameters (e.g. ?family=BABY-9X42)
 */
export function getFamilyCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(FAMILY_CODE_PARAM);
}

export function getDefaultBabyProfile(customCode?: string): BabyProfile {
  const today = localDateKey();
  return {
    id: customCode || generateFamilyCode(),
    name: 'הנסיכה הקטנה',
    birth_date: today,
    birth_time: '12:00',
    birth_weight: 3.2,
    gender: 'girl',
    created_at: new Date().toISOString()
  };
}

export function loadLocalProfile(): BabyProfile {
  const urlCode = getFamilyCodeFromUrl();
  const saved = localStorage.getItem(BABY_PROFILE_KEY);
  
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (urlCode && parsed.id !== urlCode) {
        parsed.id = urlCode;
      }
      return parsed;
    } catch {
      // fallback
    }
  }

  const defaultProfile = getDefaultBabyProfile(urlCode || undefined);
  saveLocalProfile(defaultProfile);
  return defaultProfile;
}

export function saveLocalProfile(profile: BabyProfile): void {
  localStorage.setItem(BABY_PROFILE_KEY, JSON.stringify(profile));
}

export function loadLocalEvents(): BabyEvent[] {
  const saved = localStorage.getItem(BABY_EVENTS_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function saveLocalEvents(events: BabyEvent[]): void {
  localStorage.setItem(BABY_EVENTS_KEY, JSON.stringify(events));
}

export function loadCompletedMilestones(): string[] {
  const saved = localStorage.getItem(COMPLETED_MILESTONES_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function saveCompletedMilestones(milestoneIds: string[]): void {
  localStorage.setItem(COMPLETED_MILESTONES_KEY, JSON.stringify(milestoneIds));
}

const REMINDERS_KEY = 'avigi_daily_reminders';
const SMART_TIMERS_KEY = 'avigi_smart_timers';

export function getDefaultDailyReminders(): DailyReminderItem[] {
  return [
    {
      id: 'rem_vitamin_d',
      title: 'טיפות ויטמין D',
      description: 'מתן 2 טיפות ויטמין D (הנחיית טיפת חלב עד גיל שנה)',
      category: 'vitamin',
      icon: '☀️',
      time: '10:00',
      enabled: true
    },
    {
      id: 'rem_bath',
      title: 'אמבטיית ערב חמימה',
      description: 'הרגעה, מים נעימים והכנה לקראת שנת הלילה',
      category: 'bath',
      icon: '🛁',
      time: '19:30',
      enabled: true
    },
    {
      id: 'rem_tummy_time',
      title: 'זמן בטן מודרך',
      description: 'חיזוק שרירי הצוואר והגב (כשהיא ערה ובמצב רוח טוב)',
      category: 'custom',
      icon: '🐢',
      time: '11:30',
      enabled: true
    },
    {
      id: 'rem_iron',
      title: 'טיפות ברזל יומיות',
      description: 'תוסף ברזל (המלצת משרד הבריאות מגיל 4 חודשים)',
      category: 'iron',
      icon: '💧',
      time: '17:00',
      enabled: false
    }
  ];
}

export function getDefaultSmartTimers(): SmartTimersConfig {
  return {
    feedingIntervalMinutes: 180, // 3 hours
    wakeWindowMinutes: 75,       // 75 min
    stopwatchAlertMinutes: 60,   // 60 min
    notificationsEnabled: true
  };
}

export function loadLocalReminders(): DailyReminderItem[] {
  const saved = localStorage.getItem(REMINDERS_KEY);
  if (!saved) return getDefaultDailyReminders();
  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return getDefaultDailyReminders();
  } catch {
    return getDefaultDailyReminders();
  }
}

export function saveLocalReminders(reminders: DailyReminderItem[]): void {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

export function loadSmartTimersConfig(): SmartTimersConfig {
  const saved = localStorage.getItem(SMART_TIMERS_KEY);
  if (!saved) return getDefaultSmartTimers();
  try {
    return { ...getDefaultSmartTimers(), ...JSON.parse(saved) };
  } catch {
    return getDefaultSmartTimers();
  }
}

export function saveSmartTimersConfig(config: SmartTimersConfig): void {
  localStorage.setItem(SMART_TIMERS_KEY, JSON.stringify(config));
}
