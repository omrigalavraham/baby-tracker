import React, { useState } from 'react';
import { Milk, Droplet, Moon, Scale, X, Sparkles } from 'lucide-react';

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
    { label: 'צהוב חרדלי', dot: '🟡' },
    { label: 'צהוב בהיר', dot: '🟡' },
    { label: 'ירקרק', dot: '🟢' },
    { label: 'חום', dot: '🟤' },
    { label: 'כתום', dot: '🟠' },
    { label: 'כהה / מקוניום', dot: '🖤' }
  ];

  const handleSelectPoopColor = (color?: string) => {
    onQuickDiaperPoopWithColor(color);
    setShowPoopColorPicker(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-2 space-y-2.5 select-none">
      
      {/* Title */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-extrabold text-slate-600 tracking-wide flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span>פעולות מהירות</span>
        </h3>
      </div>

      {/* Row 1: Two Hero Cards (Feeding & Sleep - Spacious & Tactile) */}
      <div className="grid grid-cols-2 gap-2.5">
        
        {/* 🍼 האכלה Hero Card */}
        <button
          onClick={onOpenFeeding}
          className="flex items-center gap-3 p-3.5 rounded-3xl bg-white hover:bg-rose-50/40 border border-rose-100/90 shadow-xs hover:border-rose-300 text-right active:scale-[0.97] transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-200 group-hover:scale-105 transition-transform">
            <Milk className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-extrabold text-slate-800 block truncate">
              האכלה
            </span>
            <span className="text-xs text-rose-500 font-semibold block truncate">
              טיימר / בקבוק
            </span>
          </div>
        </button>

        {/* 🌙 שינה Hero Card */}
        <button
          onClick={onToggleSleepQuick}
          className={`flex items-center gap-3 p-3.5 rounded-3xl border shadow-xs text-right active:scale-[0.97] transition-all group ${
            isSleeping
              ? 'bg-gradient-to-tr from-indigo-50/90 via-purple-50/80 to-indigo-100/60 border-indigo-300 ring-2 ring-indigo-200/60 animate-pulse'
              : 'bg-white hover:bg-indigo-50/40 border-indigo-100/90 hover:border-indigo-300'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
            isSleeping 
              ? 'bg-indigo-600 text-white shadow-indigo-300' 
              : 'bg-gradient-to-tr from-indigo-500 to-purple-400 text-white shadow-indigo-200'
          }`}>
            <Moon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-sm font-extrabold block truncate ${isSleeping ? 'text-indigo-950' : 'text-slate-800'}`}>
              {isSleeping ? 'התעוררה!' : 'שינה'}
            </span>
            <span className={`text-xs font-semibold block truncate ${isSleeping ? 'text-indigo-600' : 'text-indigo-500'}`}>
              {isSleeping ? 'סיום תנומה 💤' : 'התחל שינה'}
            </span>
          </div>
        </button>

      </div>

      {/* Row 2: Three Clean, Spacious Cards (פיפי, קקי, שקילה) */}
      <div className="grid grid-cols-3 gap-2.5">
        
        {/* 💧 פיפי Card */}
        <button
          onClick={onQuickDiaperPee}
          className="flex flex-col items-center justify-center p-3.5 rounded-3xl bg-white hover:bg-sky-50/50 border border-sky-100/90 hover:border-sky-300 shadow-xs active:scale-[0.97] transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-cyan-400 text-white flex items-center justify-center mb-1.5 shadow-xs shadow-sky-200 group-hover:scale-105 transition-transform">
            <Droplet className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xs font-extrabold text-slate-800">
            פיפי 💧
          </span>
        </button>

        {/* 💩 קקי Card */}
        <button
          onClick={() => setShowPoopColorPicker(true)}
          className="flex flex-col items-center justify-center p-3.5 rounded-3xl bg-white hover:bg-amber-50/50 border border-amber-100/90 hover:border-amber-300 shadow-xs active:scale-[0.97] transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-white flex items-center justify-center mb-1.5 shadow-xs shadow-amber-200 text-lg group-hover:scale-105 transition-transform">
            💩
          </div>
          <span className="text-xs font-extrabold text-slate-800">
            קקי 💩
          </span>
        </button>

        {/* ⚖️ שקילה Card */}
        <button
          onClick={onOpenWeight}
          className="flex flex-col items-center justify-center p-3.5 rounded-3xl bg-white hover:bg-emerald-50/50 border border-emerald-100/90 hover:border-emerald-300 shadow-xs active:scale-[0.97] transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mb-1.5 shadow-xs shadow-emerald-200 group-hover:scale-105 transition-transform">
            <Scale className="w-5 h-5" />
          </div>
          <span className="text-xs font-extrabold text-slate-800">
            שקילה ⚖️
          </span>
        </button>

      </div>

      {/* QUICK POPUP: Poop Color Picker */}
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
                  className="flex items-center gap-2 p-2.5 rounded-2xl border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/70 text-right active:scale-95 transition-all text-xs font-bold text-slate-800 shadow-2xs"
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
                פרטים נוספים ➔
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
