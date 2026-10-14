import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Check, RotateCcw, Milk, Clock, Baby } from 'lucide-react';
import { FeedingType, BreastSide, BottleContent, BabyEvent } from '../types';

interface FeedingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (eventData: Partial<BabyEvent>) => void;
}

export const FeedingModal: React.FC<FeedingModalProps> = ({
  isOpen,
  onClose,
  onSaveEvent
}) => {
  const [activeTab, setActiveTab] = useState<'liveBreast' | 'bottle' | 'manual'>('liveBreast');

  // Live Timer State
  const [timerRunning, setTimerRunning] = useState(false);
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('right');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [secondsRight, setSecondsRight] = useState(0);
  const [liveStartTime, setLiveStartTime] = useState<Date | null>(null);

  // Bottle State
  const [bottleAmount, setBottleAmount] = useState<number>(60);
  const [bottleContent, setBottleContent] = useState<BottleContent>('breast_milk');
  const [bottleTime, setBottleTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  // Manual State
  const [manualType, setManualType] = useState<FeedingType>('breast');
  const [manualSide, setManualSide] = useState<BreastSide>('both');
  const [manualStartTime, setManualStartTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [manualDuration, setManualDuration] = useState<number>(20);
  const [notes, setNotes] = useState('');

  // Timer interval effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      if (!liveStartTime) setLiveStartTime(new Date());
      interval = setInterval(() => {
        if (activeSide === 'left') {
          setSecondsLeft(s => s + 1);
        } else {
          setSecondsRight(s => s + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, activeSide, liveStartTime]);

  if (!isOpen) return null;

  const formatTimerDigits = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSaveLiveTimer = () => {
    const totalMinutes = Math.max(1, Math.round((secondsLeft + secondsRight) / 60));
    const start = liveStartTime || new Date(Date.now() - (secondsLeft + secondsRight) * 1000);
    const end = new Date();

    let side: BreastSide = 'both';
    if (secondsLeft > 0 && secondsRight === 0) side = 'left';
    else if (secondsRight > 0 && secondsLeft === 0) side = 'right';

    onSaveEvent({
      type: 'feeding',
      started_at: start.toISOString(),
      ended_at: end.toISOString(),
      details: {
        feedType: 'breast',
        breastSide: side,
        durationMinutes: totalMinutes,
        durationLeftMinutes: Math.round(secondsLeft / 60),
        durationRightMinutes: Math.round(secondsRight / 60)
      },
      notes: notes || undefined
    });

    // Reset and close
    setTimerRunning(false);
    setSecondsLeft(0);
    setSecondsRight(0);
    setLiveStartTime(null);
    setNotes('');
    onClose();
  };

  const handleSaveBottle = () => {
    const now = new Date();
    const [h, m] = bottleTime.split(':').map(Number);
    const eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);

    onSaveEvent({
      type: 'feeding',
      started_at: eventDate.toISOString(),
      ended_at: new Date(eventDate.getTime() + 15 * 60000).toISOString(),
      details: {
        feedType: 'bottle',
        bottleAmountMl: bottleAmount,
        bottleContent: bottleContent,
        durationMinutes: 15
      },
      notes: notes || undefined
    });

    setNotes('');
    onClose();
  };

  const handleSaveManual = () => {
    const now = new Date();
    const [h, m] = manualStartTime.split(':').map(Number);
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    const endDate = new Date(startDate.getTime() + manualDuration * 60000);

    onSaveEvent({
      type: 'feeding',
      started_at: startDate.toISOString(),
      ended_at: endDate.toISOString(),
      details: {
        feedType: manualType,
        breastSide: manualType === 'breast' ? manualSide : undefined,
        durationMinutes: manualDuration,
        bottleAmountMl: manualType === 'bottle' ? bottleAmount : undefined,
        bottleContent: manualType === 'bottle' ? bottleContent : undefined
      },
      notes: notes || undefined
    });

    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-rose-100 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-rose-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center">
              <Milk className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">מעקב האכלה</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 p-2 bg-slate-100/80 gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('liveBreast')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'liveBreast'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⏱️ הנקה חיה
          </button>
          <button
            onClick={() => setActiveTab('bottle')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'bottle'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🍼 בקבוק
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✍️ הוספה ידנית
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: Live Breastfeeding Timer */}
          {activeTab === 'liveBreast' && (
            <div className="space-y-5 text-center">
              <div className="text-3xl font-extrabold text-slate-800 font-mono tracking-wider">
                {formatTimerDigits(secondsLeft + secondsRight)}
              </div>
              <p className="text-xs text-slate-500">
                זמן האכלה כולל
              </p>

              {/* Side Toggles */}
              <div className="grid grid-cols-2 gap-3">
                {/* Left Side */}
                <button
                  onClick={() => {
                    setActiveSide('left');
                    setTimerRunning(true);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                    activeSide === 'left' && timerRunning
                      ? 'border-rose-500 bg-rose-50/80 text-rose-700 shadow-md ring-2 ring-rose-200'
                      : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-semibold">שד שמאל</span>
                  <span className="text-2xl font-bold font-mono">
                    {formatTimerDigits(secondsLeft)}
                  </span>
                  {activeSide === 'left' && timerRunning && (
                    <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-medium animate-pulse mt-1">
                      מניקה כעת...
                    </span>
                  )}
                </button>

                {/* Right Side */}
                <button
                  onClick={() => {
                    setActiveSide('right');
                    setTimerRunning(true);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                    activeSide === 'right' && timerRunning
                      ? 'border-rose-500 bg-rose-50/80 text-rose-700 shadow-md ring-2 ring-rose-200'
                      : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-semibold">שד ימין</span>
                  <span className="text-2xl font-bold font-mono">
                    {formatTimerDigits(secondsRight)}
                  </span>
                  {activeSide === 'right' && timerRunning && (
                    <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-medium animate-pulse mt-1">
                      מניקה כעת...
                    </span>
                  )}
                </button>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white shadow-md active:scale-95 transition-all ${
                    timerRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-rose-500 hover:bg-rose-600'
                  }`}
                >
                  {timerRunning ? (
                    <>
                      <Pause className="w-5 h-5" />
                      <span>השהה טיימר</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>{secondsLeft + secondsRight > 0 ? 'המשך' : 'התחל עכשיו'}</span>
                    </>
                  )}
                </button>

                {(secondsLeft + secondsRight > 0) && (
                  <button
                    onClick={() => {
                      if (confirm('לאפס את הטיימר?')) {
                        setTimerRunning(false);
                        setSecondsLeft(0);
                        setSecondsRight(0);
                        setLiveStartTime(null);
                      }
                    }}
                    className="p-3 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                    title="איפוס"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Notes */}
              <div className="text-right">
                <label className="text-xs font-medium text-slate-600 mb-1 block">הערות נוספות:</label>
                <input
                  type="text"
                  placeholder="למשל: תפסה יפה, פלטה קצת, נרדמה על השד..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* Save Button */}
              <button
                disabled={secondsLeft + secondsRight === 0}
                onClick={handleSaveLiveTimer}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>סיום ושמירת האכלה</span>
              </button>
            </div>
          )}

          {/* TAB 2: Bottle Feeding */}
          {activeTab === 'bottle' && (
            <div className="space-y-4 text-right">
              {/* Milk type */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">סוג החלב:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBottleContent('breast_milk')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      bottleContent === 'breast_milk'
                        ? 'bg-rose-50 border-rose-400 text-rose-700 ring-1 ring-rose-300'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    🍼 חלב אם שאוב
                  </button>
                  <button
                    type="button"
                    onClick={() => setBottleContent('formula')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      bottleContent === 'formula'
                        ? 'bg-rose-50 border-rose-400 text-rose-700 ring-1 ring-rose-300'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    🥣 תמ"ל (מטרנה/סימילאק)
                  </button>
                </div>
              </div>

              {/* Quick Amount selection */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  כמות שנאכלה: <span className="text-rose-600 font-bold text-sm">{bottleAmount} מ"ל</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {[30, 60, 90, 120, 150].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setBottleAmount(amount)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        bottleAmount === amount
                          ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="10"
                  max="250"
                  step="5"
                  value={bottleAmount}
                  onChange={e => setBottleAmount(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              {/* Time */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">שעת האכלה:</label>
                <input
                  type="time"
                  value={bottleTime}
                  onChange={e => setBottleTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">הערות:</label>
                <input
                  type="text"
                  placeholder="הערות לגבי האכלה..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <button
                onClick={handleSaveBottle}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Check className="w-5 h-5" />
                <span>שמור האכלת בקבוק</span>
              </button>
            </div>
          )}

          {/* TAB 3: Manual Entry */}
          {activeTab === 'manual' && (
            <div className="space-y-4 text-right">
              {/* Type */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">אופן האכלה:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualType('breast')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      manualType === 'breast'
                        ? 'bg-rose-50 border-rose-400 text-rose-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    הנקה
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualType('bottle')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      manualType === 'bottle'
                        ? 'bg-rose-50 border-rose-400 text-rose-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    בקבוק
                  </button>
                </div>
              </div>

              {manualType === 'breast' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">צד:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['right', 'left', 'both'] as BreastSide[]).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setManualSide(s)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          manualSide === s
                            ? 'bg-rose-500 text-white border-rose-600'
                            : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        {s === 'right' ? 'ימין' : s === 'left' ? 'שמאל' : 'שניהם'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Start Time & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">שעת התחלה:</label>
                  <input
                    type="time"
                    value={manualStartTime}
                    onChange={e => setManualStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">משך (בדקות):</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={manualDuration}
                    onChange={e => setManualDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">הערות:</label>
                <input
                  type="text"
                  placeholder="הערות לגבי האכלה..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <button
                onClick={handleSaveManual}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Check className="w-5 h-5" />
                <span>שמור האכלה ידנית</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
