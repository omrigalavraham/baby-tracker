import { BabyEvent, BabyProfile } from '../types';

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
  const today = new Date().toISOString().slice(0, 10);
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
