import React, { useState } from 'react';
import { BabyEvent, BabyProfile } from '../types';
import { filterEventsByPeriod, computeStats } from '../lib/analyticsUtils';
import { calculateAge } from '../lib/babyUtils';
import { Milk, Droplets, Moon, BarChart3, Clock, CheckCircle2, Sparkles, ChevronLeft } from 'lucide-react';

interface SummaryTabProps {
  events: BabyEvent[];
  profile: BabyProfile;
}

type SummaryCategory = 'overview' | 'feeding' | 'sleep' | 'diaper';

export const SummaryTab: React.FC<SummaryTabProps> = ({ events, profile }) => {
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week'>('today');
  const [activeCategory, setActiveCategory] = useState<SummaryCategory>('overview');

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

  const periodLabels = {
    today: 'היום',
    yesterday: 'אתמול',
    week: 'ב-7 הימים האחרונים'
  };

  return (
    <div className="max-w-md mx-auto px-4 py-2 space-y-3.5 select-none text-right">
      
      {/* 1. Sleek Period Filter Pills */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-slate-800">
          מעקב כולל
        </h2>

        <div className="flex bg-slate-200/70 p-1 rounded-2xl gap-1 text-xs font-bold">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              period === 'today'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            היום
          </button>
          <button
            onClick={() => setPeriod('yesterday')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              period === 'yesterday'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            אתמול
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              period === 'week'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7 ימים
          </button>
        </div>
      </div>

      {/* 2. Category Selector Pills - Clean & Focused */}
      <div className="grid grid-cols-4 p-1 bg-white rounded-2xl border border-slate-200/80 gap-1 text-xs font-bold shadow-2xs">
        <button
          onClick={() => setActiveCategory('overview')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeCategory === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>מבט-על</span>
        </button>

        <button
          onClick={() => setActiveCategory('feeding')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeCategory === 'feeding'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-rose-50'
          }`}
        >
          <Milk className="w-3.5 h-3.5" />
          <span>האכלות</span>
        </button>

        <button
          onClick={() => setActiveCategory('sleep')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeCategory === 'sleep'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-indigo-50'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>שינה</span>
        </button>

        <button
          onClick={() => setActiveCategory('diaper')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeCategory === 'diaper'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-sky-50'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>חיתולים</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: OVERVIEW (מבט כללי) - 3 Spacious Cards, Zero Clutter */}
      {/* ======================================================== */}
      {activeCategory === 'overview' && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          
          {/* Card 1: Feeding Overview */}
          <div 
            onClick={() => setActiveCategory('feeding')}
            className="p-4 rounded-3xl bg-white border border-rose-100 hover:border-rose-300 shadow-xs cursor-pointer active:scale-[0.98] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <Milk className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-500 block">האכלות {periodLabels[period]}</span>
                <span className="text-xl font-black text-slate-800">
                  {stats.totalFeedings} האכלות
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {stats.averageFeedingIntervalHours 
                    ? `בממוצע כל ${stats.averageFeedingIntervalHours} שעות` 
                    : `${stats.totalNursingMinutes} דקות הנקה כולל`}
                </p>
              </div>
            </div>
            <div className="text-slate-300">
              <ChevronLeft className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Sleep Overview */}
          <div 
            onClick={() => setActiveCategory('sleep')}
            className="p-4 rounded-3xl bg-white border border-indigo-100 hover:border-indigo-300 shadow-xs cursor-pointer active:scale-[0.98] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Moon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-500 block">שינה {periodLabels[period]}</span>
                <span className="text-xl font-black text-slate-800">
                  {sleepHours > 0 ? `${sleepHours} שעות ${sleepMins > 0 ? `ו-${sleepMins} דק'` : ''}` : `${sleepMins} דקות`}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {stats.sleepSessionsCount} תנומות • {nightSleepHours} שעות שנת לילה
                </p>
              </div>
            </div>
            <div className="text-slate-300">
              <ChevronLeft className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Diaper Overview */}
          <div 
            onClick={() => setActiveCategory('diaper')}
            className="p-4 rounded-3xl bg-white border border-sky-100 hover:border-sky-300 shadow-xs cursor-pointer active:scale-[0.98] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
                <Droplets className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-sky-500 block">חיתולים {periodLabels[period]}</span>
                <span className="text-xl font-black text-slate-800">
                  {stats.totalDiapers} החלפות
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {stats.peeCount} פיפי 💧 • {stats.poopCount} קקי 💩
                </p>
              </div>
            </div>
            <div className="text-slate-300">
              <ChevronLeft className="w-5 h-5" />
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 pt-1">
            לחצו על כל נושא כדי לראות ניתוח מפורט וברור
          </p>

        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: FEEDING (האכלה) - Detailed, Focused & Spacious */}
      {/* ======================================================== */}
      {activeCategory === 'feeding' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          
          {/* Big Hero Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md shadow-rose-200">
            <span className="text-xs font-bold text-rose-100 block">סה"כ האכלות {periodLabels[period]}</span>
            <div className="text-3xl font-black mt-1">
              {stats.totalFeedings} פעמים
            </div>
            <p className="text-xs text-rose-100 mt-1">
              {stats.totalBottleMl > 0 ? `חלב שאוב / תמ"ל: ${stats.totalBottleMl} מ"ל` : `סה"כ ${stats.totalNursingMinutes} דקות הנקה`}
            </p>
          </div>

          {/* Average Gap */}
          {stats.averageFeedingIntervalHours && (
            <div className="p-4 rounded-3xl bg-white border border-rose-100 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">מרווח ממוצע בין ארוחות:</span>
                <span className="text-base font-extrabold text-slate-800">כל {stats.averageFeedingIntervalHours} שעות</span>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700">
                קצב מעולה ✓
              </span>
            </div>
          )}

          {/* Breast Balance Gauge */}
          {totalSideMins > 0 && (
            <div className="p-5 rounded-3xl bg-white border border-rose-100 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-700">איזון שדיים (זמני הנקה):</h4>
              
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100">
                  <span className="text-[11px] font-bold text-rose-700 block">שד ימין</span>
                  <span className="text-lg font-black text-slate-800">{stats.rightBreastMinutes} דק'</span>
                  <span className="text-[10px] text-slate-400 block">{rightPercent}%</span>
                </div>
                <div className="p-3 bg-pink-50/70 rounded-2xl border border-pink-100">
                  <span className="text-[11px] font-bold text-pink-700 block">שד שמאל</span>
                  <span className="text-lg font-black text-slate-800">{stats.leftBreastMinutes} דק'</span>
                  <span className="text-[10px] text-slate-400 block">{leftPercent}%</span>
                </div>
              </div>

              {/* Visual Balance Bar */}
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-rose-500" style={{ width: `${rightPercent}%` }} />
                <div className="h-full bg-pink-300" style={{ width: `${leftPercent}%` }} />
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: SLEEP (שינה) - Detailed, Focused & Spacious */}
      {/* ======================================================== */}
      {activeCategory === 'sleep' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          
          {/* Big Hero Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200">
            <span className="text-xs font-bold text-indigo-200 block">סה"כ זמן שינה {periodLabels[period]}</span>
            <div className="text-3xl font-black mt-1">
              {sleepHours > 0 ? `${sleepHours} שעות ${sleepMins > 0 ? `ו-${sleepMins} דק'` : ''}` : `${sleepMins} דקות`}
            </div>
            <p className="text-xs text-indigo-100 mt-1">
              ב-{stats.sleepSessionsCount} תנומות שונות לאורך היממה
            </p>
          </div>

          {/* Day vs Night Sleep Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-4 bg-white rounded-3xl border border-indigo-100 shadow-2xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 block">☀️ שנת יום:</span>
              <span className="text-xl font-black text-slate-800">{daySleepHours} שעות</span>
              <p className="text-[10px] text-slate-400">תנומות בין 07:00 ל-20:00</p>
            </div>

            <div className="p-4 bg-white rounded-3xl border border-indigo-100 shadow-2xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 block">🌙 שנת לילה:</span>
              <span className="text-xl font-black text-indigo-900">{nightSleepHours} שעות</span>
              <p className="text-[10px] text-slate-400">שינה בין 20:00 ל-07:00</p>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 4: DIAPER (חיתולים) - Detailed, Focused & Spacious */}
      {/* ======================================================== */}
      {activeCategory === 'diaper' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          
          {/* Big Hero Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-200">
            <span className="text-xs font-bold text-sky-100 block">סה"כ החלפות {periodLabels[period]}</span>
            <div className="text-3xl font-black mt-1">
              {stats.totalDiapers} חיתולים
            </div>
            <p className="text-xs text-sky-100 mt-1">
              {stats.peeCount >= 5 ? '✓ מעל יעד משרד הבריאות לצריכת נוזלים' : 'יעד טיפת חלב: לפחות 5 חיתולים רטובים'}
            </p>
          </div>

          {/* Pee vs Poop Split Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-4 bg-white rounded-3xl border border-sky-100 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-700">פיפי 💧</span>
                <span className="text-xs bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-lg">נוזלים</span>
              </div>
              <span className="text-2xl font-black text-slate-800">{stats.peeCount}</span>
              <p className="text-[10px] text-slate-400">חיתולים רטובים</p>
            </div>

            <div className="p-4 bg-white rounded-3xl border border-amber-100 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700">קקי 💩</span>
                <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-lg">יציאות</span>
              </div>
              <span className="text-2xl font-black text-slate-800">{stats.poopCount}</span>
              <p className="text-[10px] text-slate-400">
                {Object.keys(stats.poopColors).length > 0 ? Object.keys(stats.poopColors).join(', ') : 'תקין'}
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
