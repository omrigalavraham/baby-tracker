export type EventType = 'feeding' | 'diaper' | 'sleep' | 'weight' | 'milestone';

export type FeedingType = 'breast' | 'bottle' | 'solids';
export type BreastSide = 'left' | 'right' | 'both';
export type BottleContent = 'formula' | 'breast_milk' | 'water';

export interface FeedingDetails {
  feedType: FeedingType;
  breastSide?: BreastSide;
  durationMinutes?: number;
  durationLeftMinutes?: number;
  durationRightMinutes?: number;
  bottleAmountMl?: number;
  bottleContent?: BottleContent;
}

export type DiaperType = 'pee' | 'poop' | 'both';

export interface DiaperDetails {
  diaperType: DiaperType;
  poopColor?: string;
  poopTexture?: string;
}

export interface SleepDetails {
  durationMinutes?: number;
  isOngoing?: boolean;
}

export interface WeightDetails {
  weightKg: number;
}

export interface MilestoneDetails {
  milestoneId: string;
  title: string;
  category: 'vision' | 'motor' | 'social' | 'communication';
}

export type EventDetails = 
  | ({ type: 'feeding' } & FeedingDetails)
  | ({ type: 'diaper' } & DiaperDetails)
  | ({ type: 'sleep' } & SleepDetails)
  | ({ type: 'weight' } & WeightDetails)
  | ({ type: 'milestone' } & MilestoneDetails);

export interface BabyEvent {
  id: string;
  baby_id: string;
  type: EventType;
  details: any;
  started_at: string; // ISO string
  ended_at?: string;   // ISO string
  notes?: string;
  created_at: string;  // ISO string
  created_by?: string; // 'אמא', 'אבא', etc.
}

export interface BabyProfile {
  id: string;          // Family code / ID (e.g. "BABY-789")
  name: string;        // Baby's name
  birth_date: string;  // 'YYYY-MM-DD'
  birth_time?: string; // 'HH:MM'
  birth_weight?: number; // In kg (e.g. 3.25)
  gender: 'girl' | 'boy';
  created_at: string;
}

export interface MilestoneItem {
  id: string;
  minAgeWeeks: number;
  maxAgeWeeks: number;
  title: string;
  description: string;
  category: 'ראייה ושמיעה' | 'תנועה ומוטוריקה' | 'תקשורת ורגש' | 'חיוך ומשחק';
  icon: string;
}

export interface ActivityTask {
  id: string;
  minAgeWeeks: number;
  maxAgeWeeks: number;
  title: string;
  description: string;
  durationMinutes: number;
  tip: string;
  category: 'זמן בטן' | 'משחקי ראייה' | 'חיבור ורוגע' | 'מוזיקה ושפה';
}
