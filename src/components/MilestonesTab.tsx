import React, { useMemo, useState } from 'react';
import { BabyProfile } from '../types';
import { MILESTONES, ACTIVITIES } from '../lib/milestonesData';
import { calculateAge } from '../lib/babyUtils';
import { Check, Clock, Heart, Lightbulb, Shuffle, Sprout } from 'lucide-react';
import { Card, CheckCircle, IconBadge, SectionTitle, cx } from './ui';

interface MilestonesTabProps {
  profile: BabyProfile;
  completedMilestones: string[];
  onToggleMilestone: (id: string) => void;
}

const ICON_PROPS = { strokeWidth: 1.75 };

const STAGES = [
  { label: '0-4 שבועות', minW: 0, maxW: 4 },
  { label: '1-2 חודשים', minW: 4, maxW: 8 },
  { label: '2-3 חודשים', minW: 8, maxW: 12 },
  { label: '3-4 חודשים', minW: 12, maxW: 18 },
  { label: '4-6 חודשים', minW: 18, maxW: 26 },
];

function stageIndexForWeeks(weeks: number): number {
  if (weeks < 4) return 0;
  if (weeks < 8) return 1;
  if (weeks < 12) return 2;
  if (weeks < 18) return 3;
  return 4;
}

const DONE_KEY_PREFIX = 'avigi-activities-done-';

function localDayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function readDoneActivities(): string[] {
  try {
    const raw = localStorage.getItem(DONE_KEY_PREFIX + localDayKey());
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeDoneActivities(ids: string[]) {
  try {
    localStorage.setItem(DONE_KEY_PREFIX + localDayKey(), JSON.stringify(ids));
  } catch {
    /* storage unavailable, keep in memory only */
  }
}

export const MilestonesTab: React.FC<MilestonesTabProps> = ({ profile, completedMilestones, onToggleMilestone }) => {
  const age = calculateAge(profile.birth_date);
  const currentStageIndex = stageIndexForWeeks(age.totalWeeks);

  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(currentStageIndex);
  const [activityOffset, setActivityOffset] = useState(0);
  const [doneActivities, setDoneActivities] = useState<string[]>(readDoneActivities);

  const stage = STAGES[selectedStageIndex];

  const stageMilestones = useMemo(
    () => MILESTONES.filter(m => m.minAgeWeeks <= stage.maxW && m.maxAgeWeeks >= stage.minW),
    [stage]
  );

  // Today's play idea always follows the baby's real age, not the browsed stage
  const ageActivities = useMemo(() => {
    const w = age.totalWeeks;
    const exact = ACTIVITIES.filter(a => a.minAgeWeeks <= w && a.maxAgeWeeks >= w);
    if (exact.length) return exact;
    const cur = STAGES[currentStageIndex];
    return ACTIVITIES.filter(a => a.minAgeWeeks <= cur.maxW && a.maxAgeWeeks >= cur.minW);
  }, [age.totalWeeks, currentStageIndex]);

  // Start on the first idea not done yet today, then let "רעיון אחר" cycle
  const firstOpenIndex = Math.max(
    0,
    ageActivities.findIndex(a => !doneActivities.includes(a.id))
  );
  const activity = ageActivities.length
    ? ageActivities[(firstOpenIndex + activityOffset) % ageActivities.length]
    : null;
  const activityDone = !!activity && doneActivities.includes(activity.id);

  const toggleActivityDone = () => {
    if (!activity) return;
    const next = activityDone ? doneActivities.filter(id => id !== activity.id) : [...doneActivities, activity.id];
    setDoneActivities(next);
    writeDoneActivities(next);
  };

  const nextActivity = () => setActivityOffset(o => o + 1);

  const completedInStage = stageMilestones.filter(m => completedMilestones.includes(m.id)).length;

  return (
    <div className="animate-fade-in">
      <header className="flex items-end justify-between mb-5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] text-muted">{age.stageName}</span>
          <h1 className="text-[26px] font-medium tracking-tight">התפתחות</h1>
        </div>
      </header>

      <div className="flex flex-col gap-7">
        {/* Today's play */}
        {activity && (
          <section className="bg-feed-soft rounded-[32px] p-[22px] flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <IconBadge tone="feed" onSurface size="sm">
                <Heart {...ICON_PROPS} />
              </IconBadge>
              <span className="text-[13px] text-feed-ink">משחק להיום</span>
              {activity.durationMinutes > 0 && (
                <span className="ms-auto text-[13px] text-feed-ink flex items-center gap-1 tabular-nums">
                  <Clock className="w-3.5 h-3.5" {...ICON_PROPS} />
                  {activity.durationMinutes} דקות
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-[19px] font-medium text-ink leading-snug">{activity.title}</h2>
              <p className="text-[14px] text-feed-ink leading-relaxed">{activity.description}</p>
            </div>

            {activity.tip && (
              <p className="text-[13px] text-feed-ink leading-relaxed flex items-start gap-2">
                <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" {...ICON_PROPS} />
                <span>{activity.tip}</span>
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleActivityDone}
                aria-pressed={activityDone}
                className="h-[46px] px-5 rounded-full bg-surface text-ink text-[15px] font-medium flex items-center gap-2 shadow-soft transition-transform active:scale-[0.98]"
              >
                {activityDone && <Check className="w-[18px] h-[18px] text-diaper" {...ICON_PROPS} />}
                {activityDone ? 'עשינו היום' : 'עשינו את זה'}
              </button>
              {ageActivities.length > 1 && (
                <button
                  type="button"
                  onClick={nextActivity}
                  className="h-[46px] px-4 rounded-full text-feed-ink text-[15px] flex items-center gap-2 transition-transform active:scale-[0.98]"
                >
                  <Shuffle className="w-[18px] h-[18px]" {...ICON_PROPS} />
                  רעיון אחר
                </button>
              )}
            </div>
          </section>
        )}

        {/* Milestones */}
        <section className="flex flex-col gap-3">
          <SectionTitle aside={<span className="tabular-nums">{`${completedInStage} מתוך ${stageMilestones.length}`}</span>}>
            {selectedStageIndex === currentStageIndex ? 'מה אולי תראו בקרוב' : `מה קורה בגיל ${stage.label}`}
          </SectionTitle>

          <div
            role="tablist"
            aria-label="טווח גילאים"
            className="flex gap-2 overflow-x-auto no-scrollbar -mx-[22px] px-[22px] py-0.5"
          >
            {STAGES.map((s, idx) => {
              const selected = idx === selectedStageIndex;
              return (
                <button
                  key={s.label}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setSelectedStageIndex(idx)}
                  className={cx(
                    'h-11 px-4 rounded-full text-[14px] whitespace-nowrap shrink-0 transition-colors',
                    selected ? 'bg-surface text-ink font-medium shadow-soft' : 'bg-sunken text-muted'
                  )}
                >
                  {s.label}
                  {idx === currentStageIndex && !selected && <span className="sr-only"> (הגיל הנוכחי)</span>}
                </button>
              );
            })}
          </div>

          <Card className="py-2">
            {stageMilestones.length === 0 ? (
              <p className="px-[18px] py-5 text-[15px] text-muted text-center">אין כאן עדיין פריטים לגיל הזה.</p>
            ) : (
              <ul className="flex flex-col">
                {stageMilestones.map((m, idx) => {
                  const done = completedMilestones.includes(m.id);
                  return (
                    <li key={m.id} className={cx(idx > 0 && 'border-t border-line')}>
                      <button
                        type="button"
                        onClick={() => onToggleMilestone(m.id)}
                        aria-pressed={done}
                        className="w-full flex items-start gap-3 px-[18px] py-3.5 text-start"
                      >
                        {done ? (
                          <IconBadge tone="diaper">
                            <Check {...ICON_PROPS} />
                          </IconBadge>
                        ) : (
                          <span className="w-10 h-10 flex items-center justify-center shrink-0">
                            <CheckCircle done={false} />
                          </span>
                        )}
                        <span className="flex-1 min-w-0 flex flex-col gap-0.5 pt-0.5">
                          <span className="text-[15px] font-medium text-ink leading-snug">{m.title}</span>
                          {done ? (
                            <span className="text-[13px] text-diaper">ראינו</span>
                          ) : (
                            <>
                              <span className="text-[13px] text-muted leading-relaxed">{m.description}</span>
                              <span className="text-[13px] text-muted opacity-80">{m.category}</span>
                            </>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </section>

        {/* Reassurance */}
        <section className="bg-sleep-soft rounded-[28px] p-5 flex items-start gap-3">
          <IconBadge tone="sleep" onSurface size="sm">
            <Sprout {...ICON_PROPS} />
          </IconBadge>
          <p className="text-[14px] text-sleep-ink leading-relaxed pt-1.5">
            כל תינוקת מתפתחת בקצב שלה. אלה רק דברים שכדאי לשים לב אליהם, לא מבחן.
          </p>
        </section>
      </div>
    </div>
  );
};
