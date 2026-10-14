import React, { useState } from 'react';
import { BabyEvent, BabyProfile } from '../types';
import { filterEventsByPeriod, computeStats } from '../lib/analyticsUtils';
import { calculateAge } from '../lib/babyUtils';
import { Milk, Droplets, Moon, Scale, Calendar, Clock, BarChart3, TrendingUp, Sparkles } from 'lucide-react';

interface SummaryTabProps {
  events: BabyEvent[];
  profile: BabyProfile;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ events, profile }) => {
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week'>('today');

  const filteredEvents = filterEventsByPeriod(events, period);
  const stats = computeStats(filteredEvents);
  const age = calculateAge(profile.birth_date);

  // Breast balance percentage
  const totalSideMins = stats.leftBreastMinutes + stats.rightBreastMinutes;
  const leftPercent = totalSideMins > 0 ? Math.round((stats.leftBreastMinutes / totalSideMins) * 100) : 50;
  const rightPercent = totalSideMins > 0 ? Math.round((stats.rightBreastMinutes / totalSideMins) * 100) : 50;

  // Sleep hours & minutes
  const sleepHours = Math.floor(stats.totalSleepMinutes / 60);
  const sleepMins = stats.totalSleepMinutes % 60;
  const daySleepHours = (stats.daySleepMinutes / 60).toFixed(1);
  const nightSleepHours = (stats.nightSleepMinutes / 60).toFixed(1);

  return (
    <div className="max-w-md mx-auto px-4 py-3 space-y-4">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 rounded-3xl p-5 text-white shadow-lg shadow-indigo-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-bold flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5 text-sky-200" />
            מעקב כולל וסטטיסטיקות
          </span>
          <span className="text-xs font-semibold text-sky-100">
            {profile.name} • {age.shortText}
          </span>
        </div>
        <h2 className="text-xl font-black mt-2">
          סיכום פעילות ומדדים
        </h2>
        <p className="text-xs text-sky-100 mt-1 leading-relaxed">
          מבט כולל על האכלות, זמני שינה, חיתולים ומרווחי זמנים.
        </p>
      </div>

      {/* Period Filter Selector */}
      <div className="grid grid-cols-3 p-1.5 bg-slate-100 rounded-2xl gap-1 text-xs font-bold">
        <button
          onClick={() => setPeriod('today')}
          className={`py-2 rounded-xl transition-all ${
            period === 'today'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📅 היום
        </button>
        <button
          onClick={() => setPeriod('yesterday')}
          className={`py-2 rounded-xl transition-all ${
            period === 'yesterday'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🕰️ אתמול
        </button>
        <button
          onClick={() => setPeriod('week')}
          className={`py-2 rounded-xl transition-all ${
            period === 'week'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📊 7 ימים אחרונים
        </button>
      </div>

      {/* Top 3 Metric Badges */}
      <div className="grid grid-cols-3 gap-2 text-center">
        
        {/* Total Feedings */}
        <div className="bg-white p-3.5 rounded-2xl border border-rose-100 shadow-2xs">
          <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <Milk className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">האכלות</span>
          <span className="text-lg font-black text-rose-700">{stats.totalFeedings}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {stats.totalBottleMl > 0 ? `${stats.totalBottleMl} מ"ל` : `${stats.totalNursingMinutes} דק'`}
          </span>
        </div>

        {/* Total Diapers */}
        <div className="bg-white p-3.5 rounded-2xl border border-sky-100 shadow-2xs">
          <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
            <Droplets className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">חיתולים</span>
          <span className="text-lg font-black text-sky-700">{stats.totalDiapers}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {stats.peeCount} פיפי • {stats.poopCount} קקי
          </span>
        </div>

        {/* Total Sleep */}
        <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-2xs">
          <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Moon className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">סה"כ שינה</span>
          <span className="text-lg font-black text-indigo-700">
            {sleepHours > 0 ? `${sleepHours}ש ${sleepMins}ד` : `${sleepMins} דק'`}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {stats.sleepSessionsCount} תנומות
          </span>
        </div>

      </div>

      {/* SECTION 1: FEEDING BREAKDOWN */}
      <div className="bg-white p-4 rounded-3xl border border-rose-100/80 shadow-xs space-y-3 text-right">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-rose-500 text-white flex items-center justify-center">
              <Milk className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">ניתוח האכלות מפורט</h3>
          </div>
          {stats.averageFeedingIntervalHours && (
            <span className="text-[11px] bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-lg">
              מרווח ממוצע: כל {stats.averageFeedingIntervalHours} שעות
            </span>
          )}
        </div>

        {/* Breastfeeding Balance Bar (Left vs Right) */}
        {totalSideMins > 0 ? (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>צד ימין: {stats.rightBreastMinutes} דק' ({rightPercent}%)</span>
              <span>צד שמאל: {stats.leftBreastMinutes} דק' ({leftPercent}%)</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div 
                className="h-full bg-rose-400 transition-all duration-300"
                style={{ width: `${rightPercent}%` }}
                title={`צד ימין: ${rightPercent}%`}
              />
              <div 
                className="h-full bg-pink-300 transition-all duration-300"
                style={{ width: `${leftPercent}%` }}
                title={`צד שמאל: ${leftPercent}%`}
              />
            </div>
            <p className="text-[10px] text-slate-400 text-left pt-0.5">
              איזון בין השדיים תומך בייצור חלב שווה ומונע גודש.
            </p>
          </div>
        ) : stats.totalBottleMl > 0 ? (
          <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">סה"כ כמות בקבוקים:</span>
            <span className="font-bold text-rose-800 text-sm">{stats.totalBottleMl} מ"ל ({stats.bottleFeedingsCount} האכלות)</span>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-2 text-center">אין רישומי האכלה לתקופה זו</p>
        )}
      </div>

      {/* SECTION 2: DIAPER BREAKDOWN */}
      <div className="bg-white p-4 rounded-3xl border border-sky-100/80 shadow-xs space-y-3 text-right">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-sky-500 text-white flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">ניתוח חיתולים ויציאות</h3>
          </div>
          <span className="text-[11px] bg-sky-50 text-sky-700 font-bold px-2.5 py-1 rounded-lg">
            {stats.totalDiapers} החלפות סה"כ
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-sky-50/60 rounded-2xl border border-sky-100">
            <span className="text-slate-500 block">💧 חיתולי פיפי:</span>
            <span className="text-lg font-bold text-sky-800">{stats.peeCount}</span>
            <span className="text-[10px] text-sky-600 block mt-0.5">
              {stats.peeCount >= 5 ? '✓ מעל יעד טיפת חלב' : 'יעד: 5-6 ביום'}
            </span>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
            <span className="text-slate-500 block">💩 חיתולי קקי:</span>
            <span className="text-lg font-bold text-amber-800">{stats.poopCount}</span>
            <span className="text-[10px] text-amber-600 block mt-0.5">
              {Object.keys(stats.poopColors).length > 0 
                ? Object.keys(stats.poopColors).join(', ')
                : 'תקין'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: SLEEP BREAKDOWN */}
      <div className="bg-white p-4 rounded-3xl border border-indigo-100/80 shadow-xs space-y-3 text-right">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">שנת יום מול שנת לילה</h3>
          </div>
          <span className="text-[11px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg">
            {stats.sleepSessionsCount} תנומות
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100">
            <span className="text-slate-500 block">☀️ שנת יום (07:00-20:00):</span>
            <span className="text-base font-bold text-amber-900">{daySleepHours} שעות</span>
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <span className="text-slate-500 block">🌙 שנת לילה (20:00-07:00):</span>
            <span className="text-base font-bold text-indigo-900">{nightSleepHours} שעות</span>
          </div>
        </div>
      </div>

    </div>
  );
};
