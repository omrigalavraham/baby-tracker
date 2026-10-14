import React, { useEffect, useState } from 'react';
import { BabyEvent, BabyProfile } from '../types';
import { formatTimeAgo } from '../lib/babyUtils';
import { Milk, Droplets, Moon, Scale } from 'lucide-react';

interface StatusCardsProps {
  events: BabyEvent[];
  profile: BabyProfile;
  onOpenFeeding: () => void;
  onOpenDiaper: () => void;
  onOpenSleep: () => void;
  onOpenWeight: () => void;
}

export const StatusCards: React.FC<StatusCardsProps> = ({
  events,
  profile,
  onOpenFeeding,
  onOpenDiaper,
  onOpenSleep,
  onOpenWeight
}) => {
  // Re-calculate relative times every minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // Find last events
  const lastFeeding = events.find(e => e.type === 'feeding');
  const lastDiaper = events.find(e => e.type === 'diaper');
  const lastSleep = events.find(e => e.type === 'sleep');
  const lastWeight = events.find(e => e.type === 'weight');

  const isCurrentlySleeping = lastSleep?.details?.isOngoing;

  // Feeding summary text
  let feedingSummary = 'טרם נרשמה האכלה';
  if (lastFeeding) {
    if (lastFeeding.details?.feedType === 'breast') {
      const side = lastFeeding.details.breastSide === 'left' ? 'שמאל' : lastFeeding.details.breastSide === 'right' ? 'ימין' : 'שניהם';
      feedingSummary = `הנקה (${side}) - ${lastFeeding.details.durationMinutes || 0} דק'`;
    } else if (lastFeeding.details?.feedType === 'bottle') {
      feedingSummary = `בקבוק ${lastFeeding.details.bottleAmountMl || 0} מ"ל`;
    }
  }

  // Diaper summary text
  let diaperSummary = 'טרם נרשם חיתול';
  if (lastDiaper) {
    const dType = lastDiaper.details?.diaperType;
    diaperSummary = dType === 'pee' ? 'פיפי 💧' : dType === 'poop' ? 'קקי 💩' : 'פיפי וקקי 💧💩';
  }

  // Sleep summary text
  let sleepSummary = 'טרם נרשמה שינה';
  if (lastSleep) {
    if (isCurrentlySleeping) {
      sleepSummary = 'ישנה כרגע... 💤';
    } else {
      sleepSummary = `ישנה ${lastSleep.details?.durationMinutes || 0} דק'`;
    }
  }

  // Weight summary
  const currentWeightKg = lastWeight?.details?.weightKg || profile.birth_weight;

  return (
    <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto px-4 py-2">
      
      {/* Feeding Card */}
      <div 
        onClick={onOpenFeeding}
        className="bg-white p-3.5 rounded-2xl border border-rose-100 shadow-xs hover:border-rose-300 transition-all cursor-pointer active:scale-[0.98]"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg">
            האכלה אחרונה
          </span>
          <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <Milk className="w-4 h-4" />
          </div>
        </div>
        <div className="text-base font-bold text-slate-800">
          {formatTimeAgo(lastFeeding?.started_at)}
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
          {feedingSummary}
        </p>
      </div>

      {/* Diaper Card */}
      <div 
        onClick={onOpenDiaper}
        className="bg-white p-3.5 rounded-2xl border border-sky-100 shadow-xs hover:border-sky-300 transition-all cursor-pointer active:scale-[0.98]"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-sky-500 bg-sky-50 px-2 py-0.5 rounded-lg">
            חיתול אחרון
          </span>
          <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
            <Droplets className="w-4 h-4" />
          </div>
        </div>
        <div className="text-base font-bold text-slate-800">
          {formatTimeAgo(lastDiaper?.started_at)}
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
          {diaperSummary}
        </p>
      </div>

      {/* Sleep Card */}
      <div 
        onClick={onOpenSleep}
        className={`p-3.5 rounded-2xl border shadow-xs transition-all cursor-pointer active:scale-[0.98] ${
          isCurrentlySleeping 
            ? 'bg-indigo-50/70 border-indigo-200 hover:border-indigo-300' 
            : 'bg-white border-indigo-100 hover:border-indigo-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
            isCurrentlySleeping ? 'bg-indigo-600 text-white animate-pulse' : 'text-indigo-500 bg-indigo-50'
          }`}>
            {isCurrentlySleeping ? 'ישנה עכשיו' : 'שינה אחרונה'}
          </span>
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Moon className="w-4 h-4" />
          </div>
        </div>
        <div className="text-base font-bold text-slate-800">
          {isCurrentlySleeping ? 'בתנומה 😴' : formatTimeAgo(lastSleep?.ended_at || lastSleep?.started_at)}
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
          {sleepSummary}
        </p>
      </div>

      {/* Weight Card */}
      <div 
        onClick={onOpenWeight}
        className="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-xs hover:border-amber-300 transition-all cursor-pointer active:scale-[0.98]"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
            משקל נוכחי
          </span>
          <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="text-base font-bold text-slate-800">
          {currentWeightKg ? `${currentWeightKg} ק"ג` : 'טרם נשקלה'}
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
          {lastWeight ? `עודכן ${formatTimeAgo(lastWeight.started_at)}` : 'משקל לידה'}
        </p>
      </div>

    </div>
  );
};
