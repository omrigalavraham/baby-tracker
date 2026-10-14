import React from 'react';
import { Milk, Droplet, Sparkles, Moon, Scale } from 'lucide-react';

interface QuickActionsProps {
  onOpenFeeding: () => void;
  onQuickDiaperPee: () => void;
  onQuickDiaperPoop: () => void;
  onOpenDiaperFull: () => void;
  onOpenSleep: () => void;
  onOpenWeight: () => void;
  isSleeping: boolean;
  onToggleSleepQuick: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onOpenFeeding,
  onQuickDiaperPee,
  onQuickDiaperPoop,
  onOpenDiaperFull,
  onOpenSleep,
  onOpenWeight,
  isSleeping,
  onToggleSleepQuick
}) => {
  return (
    <div className="max-w-md mx-auto px-4 py-2">
      <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-rose-100 shadow-xs">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            רישום מהיר בלחיצה אחת:
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          
          {/* האכלה */}
          <button
            onClick={onOpenFeeding}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gradient-to-b from-rose-50 to-rose-100/60 border border-rose-200/80 text-rose-700 active:scale-95 transition-all shadow-xs"
          >
            <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center mb-1 shadow-xs shadow-rose-300">
              <Milk className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">האכלה</span>
            <span className="text-[10px] text-rose-500 font-medium">הנקה/בקבוק</span>
          </button>

          {/* פיפי מהיר */}
          <button
            onClick={onQuickDiaperPee}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gradient-to-b from-sky-50 to-sky-100/60 border border-sky-200/80 text-sky-700 active:scale-95 transition-all shadow-xs"
          >
            <div className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center mb-1 shadow-xs shadow-sky-300">
              <Droplet className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">פיפי 💧</span>
            <span className="text-[10px] text-sky-500 font-medium">לחיצה ושמור</span>
          </button>

          {/* קקי מהיר */}
          <button
            onClick={onQuickDiaperPoop}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gradient-to-b from-amber-50 to-amber-100/60 border border-amber-200/80 text-amber-700 active:scale-95 transition-all shadow-xs"
          >
            <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center mb-1 shadow-xs shadow-amber-300">
              <span className="text-lg">💩</span>
            </div>
            <span className="text-xs font-bold">קקי 💩</span>
            <span className="text-[10px] text-amber-600 font-medium">לחיצה ושמור</span>
          </button>

          {/* שינה טוגל מהיר */}
          <button
            onClick={onToggleSleepQuick}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border active:scale-95 transition-all shadow-xs ${
              isSleeping
                ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 border-indigo-700 text-white shadow-indigo-300'
                : 'bg-gradient-to-b from-indigo-50 to-indigo-100/60 border-indigo-200/80 text-indigo-700'
            }`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1 shadow-xs ${
              isSleeping ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white shadow-indigo-300'
            }`}>
              <Moon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">
              {isSleeping ? 'התעוררה!' : 'נרדמה'}
            </span>
            <span className={`text-[10px] font-medium ${isSleeping ? 'text-indigo-100' : 'text-indigo-500'}`}>
              {isSleeping ? 'עצור טיימר' : 'התחל שינה'}
            </span>
          </button>

        </div>

        {/* Secondary options row */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 px-1 text-xs text-slate-500 font-medium">
          <button
            onClick={onOpenDiaperFull}
            className="hover:text-rose-600 transition-colors flex items-center gap-1"
          >
            <span>📝 חיתול מפורט (צבע/מרקם)</span>
          </button>
          <button
            onClick={onOpenSleep}
            className="hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <span>⏱️ הוספת שינה ידנית</span>
          </button>
          <button
            onClick={onOpenWeight}
            className="hover:text-amber-600 transition-colors flex items-center gap-1"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>שקילה</span>
          </button>
        </div>

      </div>
    </div>
  );
};
