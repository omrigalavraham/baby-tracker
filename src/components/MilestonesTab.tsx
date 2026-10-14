import React, { useState } from 'react';
import { BabyProfile } from '../types';
import { MILESTONES, ACTIVITIES } from '../lib/milestonesData';
import { calculateAge } from '../lib/babyUtils';
import confetti from 'canvas-confetti';
import { Sparkles, CheckCircle2, Circle, Target, Lightbulb, Clock, ChevronRight, ChevronLeft } from 'lucide-react';

interface MilestonesTabProps {
  profile: BabyProfile;
  completedMilestones: string[];
  onToggleMilestone: (id: string) => void;
}

export const MilestonesTab: React.FC<MilestonesTabProps> = ({
  profile,
  completedMilestones,
  onToggleMilestone
}) => {
  const age = calculateAge(profile.birth_date);
  const currentWeeks = age.totalWeeks;

  // Selected stage view (default to baby's current age)
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(() => {
    if (currentWeeks < 4) return 0;
    if (currentWeeks < 8) return 1;
    if (currentWeeks < 12) return 2;
    if (currentWeeks < 18) return 3;
    return 4;
  });

  const [activeSubTab, setActiveSubTab] = useState<'milestones' | 'activities'>('milestones');

  const STAGES = [
    { label: '0-4 שבועות', minW: 0, maxW: 4, title: 'ניובורן (חודש ראשון)' },
    { label: '1-2 חודשים', minW: 4, maxW: 8, title: 'חודש שני (5-8 שבועות)' },
    { label: '2-3 חודשים', minW: 8, maxW: 12, title: 'חודש שלישי (9-12 שבועות)' },
    { label: '3-4 חודשים', minW: 12, maxW: 18, title: 'חודש רביעי (13-18 שבועות)' },
    { label: '4-6 חודשים', minW: 18, maxW: 26, title: 'חודשים 4-6' },
  ];

  const currentStage = STAGES[selectedStageIndex];

  // Filter milestones and activities for selected stage
  const stageMilestones = MILESTONES.filter(
    m => m.minAgeWeeks <= currentStage.maxW && m.maxAgeWeeks >= currentStage.minW
  );

  const stageActivities = ACTIVITIES.filter(
    a => a.minAgeWeeks <= currentStage.maxW && a.maxAgeWeeks >= currentStage.minW
  );

  const handleMilestoneClick = (id: string, isAlreadyCompleted: boolean) => {
    if (!isAlreadyCompleted) {
      // Fire celebration confetti!
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
    onToggleMilestone(id);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-3 space-y-4">
      
      {/* Age Header Banner */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-3xl p-5 text-white shadow-lg shadow-rose-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            מדריך התפתחות טיפת חלב
          </span>
          <span className="text-xs font-semibold text-rose-100">
            {profile.name} {age.displayText}
          </span>
        </div>
        <h2 className="text-xl font-black mt-2">
          {currentStage.title}
        </h2>
        <p className="text-xs text-rose-100 mt-1 leading-relaxed">
          גילויים חדשים, אבני דרך מרגשות ומשימות משחק לפיתוח המוח והמוטוריקה.
        </p>
      </div>

      {/* Stage Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {STAGES.map((stg, idx) => (
          <button
            key={stg.label}
            onClick={() => setSelectedStageIndex(idx)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedStageIndex === idx
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {stg.label}
          </button>
        ))}
      </div>

      {/* Sub Tabs: Milestones vs Activities */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl gap-1 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('milestones')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'milestones'
              ? 'bg-white text-rose-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>מה מצופה בגיל הזה ({stageMilestones.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('activities')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'activities'
              ? 'bg-white text-rose-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>משימות ותרגילים ({stageActivities.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: Milestones Checklist */}
      {activeSubTab === 'milestones' && (
        <div className="space-y-3">
          <div className="text-right px-1">
            <span className="text-xs font-bold text-slate-700">
              אבני דרך התפתחותיות (לחצו כדי לסמן מה שהיא כבר עושה):
            </span>
          </div>

          {stageMilestones.map(m => {
            const isCompleted = completedMilestones.includes(m.id);
            return (
              <div
                key={m.id}
                onClick={() => handleMilestoneClick(m.id, isCompleted)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 text-right active:scale-[0.99] ${
                  isCompleted
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                    : 'bg-white border-slate-200/90 hover:border-rose-200'
                }`}
              >
                <div className="text-2xl mt-0.5">{m.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600">
                      {m.category}
                    </span>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <h4 className={`text-sm font-bold ${isCompleted ? 'text-emerald-900 line-through opacity-80' : 'text-slate-800'}`}>
                    {m.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {m.description}
                  </p>
                </div>
              </div>
            );
          })}

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 leading-relaxed text-right flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>תזכורת להורים:</strong> כל תינוק מתפתח בקצב ייחודי משלו! טווחי הגילאים הם ממוצעים ואין סיבה להילחץ אם משהו לוקח מעט יותר זמן.
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Activities & Games */}
      {activeSubTab === 'activities' && (
        <div className="space-y-3">
          <div className="text-right px-1">
            <span className="text-xs font-bold text-slate-700">
              משימות ומשחקים מומלצים לפיתוח בגיל הזה:
            </span>
          </div>

          {stageActivities.map(act => (
            <div
              key={act.id}
              className="bg-white p-4 rounded-2xl border border-rose-100/90 shadow-xs text-right space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-pink-100 text-pink-700">
                  {act.category}
                </span>
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {act.durationMinutes} דקות
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-800">
                {act.title}
              </h4>

              <p className="text-xs text-slate-600 leading-relaxed">
                {act.description}
              </p>

              {/* Tip Box */}
              <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-100 text-[11px] text-rose-800 flex items-start gap-1.5 leading-normal">
                <Lightbulb className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span><strong>למה זה טוב? </strong>{act.tip}</span>
              </div>
            </div>
          ))}

          {stageActivities.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              אין משימות ספציפיות לשלב זה, ראו שלבים קרובים.
            </div>
          )}
        </div>
      )}

    </div>
  );
};
