import React from 'react';
import { BabyEvent, BabyProfile } from '../types';
import { generateSmartInsights } from '../lib/analyticsUtils';
import { calculateAge } from '../lib/babyUtils';
import { Sparkles, Lightbulb, CheckCircle2, AlertTriangle, Info, Heart, ArrowLeft } from 'lucide-react';

interface InsightsTabProps {
  events: BabyEvent[];
  profile: BabyProfile;
  onOpenFeeding: () => void;
  onOpenSleep: () => void;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({
  events,
  profile,
  onOpenFeeding,
  onOpenSleep
}) => {
  const insights = generateSmartInsights(events, profile);
  const age = calculateAge(profile.birth_date);

  return (
    <div className="max-w-md mx-auto px-4 py-3 space-y-4">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-5 text-white shadow-lg shadow-orange-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-bold flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-yellow-200" />
            ניתוח נתונים חכם
          </span>
          <span className="text-xs font-semibold text-amber-100">
            {profile.name} • {age.shortText}
          </span>
        </div>
        <h2 className="text-xl font-black mt-2">
          תובנות בריאות והמלצות אישיות
        </h2>
        <p className="text-xs text-amber-100 mt-1 leading-relaxed">
          מבוסס על הנחיות משרד הבריאות, טיפת חלב ונתוני המעקב האישיים שלכם.
        </p>
      </div>

      {/* Insights Cards List */}
      <div className="space-y-3">
        {insights.map(item => {
          let cardBg = 'bg-white border-slate-200/80';
          let badgeBg = 'bg-slate-100 text-slate-700';

          if (item.type === 'success') {
            cardBg = 'bg-emerald-50/50 border-emerald-200';
            badgeBg = 'bg-emerald-100 text-emerald-800';
          } else if (item.type === 'warning') {
            cardBg = 'bg-amber-50/60 border-amber-300';
            badgeBg = 'bg-amber-100 text-amber-900';
          } else if (item.type === 'tip') {
            cardBg = 'bg-rose-50/50 border-rose-200';
            badgeBg = 'bg-rose-100 text-rose-800';
          } else if (item.type === 'info') {
            cardBg = 'bg-indigo-50/50 border-indigo-200';
            badgeBg = 'bg-indigo-100 text-indigo-800';
          }

          return (
            <div
              key={item.id}
              className={`p-4 rounded-3xl border shadow-xs text-right space-y-2 transition-all hover:shadow-sm ${cardBg}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${badgeBg}`}>
                  {item.badge}
                </span>
                <span className="text-2xl">{item.icon}</span>
              </div>

              <h4 className="text-sm font-bold text-slate-800 leading-snug">
                {item.title}
              </h4>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Helpful Quick Shortcuts footer */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-2xs text-right space-y-2">
        <span className="text-xs font-bold text-slate-700 block">
          פעולות מומלצות בעקבות התובנות:
        </span>
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-bold">
          <button
            onClick={onOpenFeeding}
            className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center justify-center gap-1 active:scale-95"
          >
            <span>האכלה הבאה 🍼</span>
          </button>
          <button
            onClick={onOpenSleep}
            className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all flex items-center justify-center gap-1 active:scale-95"
          >
            <span>מעקב שינה 🌙</span>
          </button>
        </div>
      </div>

    </div>
  );
};
