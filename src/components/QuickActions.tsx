import React, { useState } from 'react';
import { Milk, Droplet, Sparkles, Moon, Scale, X, Clock, Edit3 } from 'lucide-react';

interface QuickActionsProps {
  onOpenFeeding: () => void;
  onQuickDiaperPee: () => void;
  onQuickDiaperPoopWithColor: (color?: string) => void;
  onOpenDiaperFull: () => void;
  onOpenSleep: () => void;
  onOpenWeight: () => void;
  isSleeping: boolean;
  onToggleSleepQuick: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onOpenFeeding,
  onQuickDiaperPee,
  onQuickDiaperPoopWithColor,
  onOpenDiaperFull,
  onOpenSleep,
  onOpenWeight,
  isSleeping,
  onToggleSleepQuick
}) => {
  const [showPoopColorPicker, setShowPoopColorPicker] = useState(false);

  const POOP_COLORS = [
    { label: 'צהוב חרדלי', bg: 'bg-amber-400', border: 'border-amber-500', text: 'text-amber-950', dot: '🟡' },
    { label: 'צהוב בהיר', bg: 'bg-yellow-200', border: 'border-yellow-400', text: 'text-yellow-900', dot: '🟡' },
    { label: 'ירקרק', bg: 'bg-emerald-400', border: 'border-emerald-600', text: 'text-emerald-950', dot: '🟢' },
    { label: 'חום', bg: 'bg-amber-800', border: 'border-amber-900', text: 'text-amber-50', dot: '🟤' },
    { label: 'כתום', bg: 'bg-orange-400', border: 'border-orange-500', text: 'text-orange-950', dot: '🟠' },
    { label: 'כהה / מקוניום', bg: 'bg-slate-700', border: 'border-slate-900', text: 'text-white', dot: '🖤' }
  ];

  const handleSelectPoopColor = (color?: string) => {
    onQuickDiaperPoopWithColor(color);
    setShowPoopColorPicker(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-2 relative">
      <div className="bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-rose-100 shadow-xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            פעולות מהירות בלחיצה אחת:
          </span>
        </div>

        {/* 5 Quick Action Buttons in 1 Row */}
        <div className="grid grid-cols-5 gap-1.5">
          
          {/* 1. האכלה */}
          <button
            onClick={onOpenFeeding}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-b from-rose-50 to-rose-100/60 border border-rose-200/80 text-rose-700 active:scale-95 transition-all shadow-xs"
          >
            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center mb-1 shadow-xs shadow-rose-300">
              <Milk className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold">האכלה</span>
            <span className="text-[9px] text-rose-500 font-medium">הנקה/בקבוק</span>
          </button>

          {/* 2. פיפי מהיר (1-Tap מיידי) */}
          <button
            onClick={onQuickDiaperPee}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-b from-sky-50 to-sky-100/60 border border-sky-200/80 text-sky-700 active:scale-95 transition-all shadow-xs"
          >
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center mb-1 shadow-xs shadow-sky-300">
              <Droplet className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold">פיפי 💧</span>
            <span className="text-[9px] text-sky-500 font-medium">שמור מיד</span>
          </button>

          {/* 3. קקי מהיר (בורר צבע מהיר בלחיצה) */}
          <button
            onClick={() => setShowPoopColorPicker(true)}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-b from-amber-50 to-amber-100/60 border border-amber-200/80 text-amber-700 active:scale-95 transition-all shadow-xs"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center mb-1 shadow-xs shadow-amber-300">
              <span className="text-base">💩</span>
            </div>
            <span className="text-[11px] font-bold">קקי 💩</span>
            <span className="text-[9px] text-amber-600 font-medium">בחר צבע</span>
          </button>

          {/* 4. שינה טוגל מהיר */}
          <button
            onClick={onToggleSleepQuick}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border active:scale-95 transition-all shadow-xs ${
              isSleeping
                ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 border-indigo-700 text-white shadow-indigo-300 animate-pulse'
                : 'bg-gradient-to-b from-indigo-50 to-indigo-100/60 border-indigo-200/80 text-indigo-700'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 shadow-xs ${
              isSleeping ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white shadow-indigo-300'
            }`}>
              <Moon className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold">
              {isSleeping ? 'התעוררה!' : 'נרדמה'}
            </span>
            <span className={`text-[9px] font-medium ${isSleeping ? 'text-indigo-100 font-bold' : 'text-indigo-500'}`}>
              {isSleeping ? 'סיום שינה' : 'התחל שינה'}
            </span>
          </button>

          {/* 5. שקילה מהירה (הוסף כאן כפתור מהיר!) */}
          <button
            onClick={onOpenWeight}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-b from-emerald-50 to-emerald-100/60 border border-emerald-200/80 text-emerald-800 active:scale-95 transition-all shadow-xs"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1 shadow-xs shadow-emerald-300">
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold">שקילה ⚖️</span>
            <span className="text-[9px] text-emerald-600 font-medium">מעקב ק"ג</span>
          </button>

        </div>

        {/* Secondary options row */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 px-1 text-xs text-slate-500 font-medium">
          <button
            onClick={onOpenDiaperFull}
            className="hover:text-rose-600 transition-colors flex items-center gap-1"
          >
            <span>📝 חיתול מפורט (מרקם/משחה)</span>
          </button>
          <button
            onClick={onOpenSleep}
            className="hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <span>⏱️ שינה ידנית</span>
          </button>
          <button
            onClick={onOpenFeeding}
            className="hover:text-amber-600 transition-colors flex items-center gap-1"
          >
            <span>🍼 האכלה ידנית</span>
          </button>
        </div>

      </div>

      {/* QUICK POPUP: Poop Color Picker (2-tap instant save) */}
      {showPoopColorPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-amber-200 text-right space-y-3 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💩</span>
                <h3 className="font-bold text-slate-800 text-base">באיזה צבע הקקי?</h3>
              </div>
              <button
                onClick={() => setShowPoopColorPicker(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              לחצו על הצבע המתאים לשמירה מיידית ביומן:
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {POOP_COLORS.map(c => (
                <button
                  key={c.label}
                  onClick={() => handleSelectPoopColor(c.label)}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/70 text-right active:scale-95 transition-all text-xs font-bold text-slate-800 shadow-2xs"
                >
                  <span className="text-base">{c.dot}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => handleSelectPoopColor(undefined)}
                className="text-slate-500 hover:text-slate-800 font-medium py-1 px-2"
              >
                ⚡ שמור בלי לציין צבע
              </button>

              <button
                onClick={() => {
                  setShowPoopColorPicker(false);
                  onOpenDiaperFull();
                }}
                className="text-amber-700 font-bold hover:underline py-1 px-2"
              >
                פרטים נוספים (מרקם/הערות) ➔
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
