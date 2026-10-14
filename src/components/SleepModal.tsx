import React, { useState } from 'react';
import { X, Check, Moon, Play, Square, Clock } from 'lucide-react';
import { BabyEvent } from '../types';

interface SleepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (eventData: Partial<BabyEvent>) => void;
  activeSleepEvent?: BabyEvent;
  onEndSleepEvent: (eventId: string, endedAt: string, durationMinutes: number) => void;
}

export const SleepModal: React.FC<SleepModalProps> = ({
  isOpen,
  onClose,
  onSaveEvent,
  activeSleepEvent,
  onEndSleepEvent
}) => {
  const [mode, setMode] = useState<'live' | 'manual'>('live');

  // Manual times
  const [startTime, setStartTime] = useState<string>(() => {
    const d = new Date(Date.now() - 60 * 60000);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [endTime, setEndTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const isSleepingNow = !!activeSleepEvent?.details?.isOngoing;

  const handleStartLiveSleep = () => {
    onSaveEvent({
      type: 'sleep',
      started_at: new Date().toISOString(),
      details: {
        isOngoing: true
      },
      notes: notes || undefined
    });
    setNotes('');
    onClose();
  };

  const handleWakeUp = () => {
    if (!activeSleepEvent) return;
    const start = new Date(activeSleepEvent.started_at).getTime();
    const now = Date.now();
    const durationMinutes = Math.max(1, Math.round((now - start) / 60000));
    
    onEndSleepEvent(activeSleepEvent.id, new Date().toISOString(), durationMinutes);
    onClose();
  };

  const handleSaveManualSleep = () => {
    const now = new Date();
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm);
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em);

    // If end time is before start time, it likely crossed midnight
    if (endDate.getTime() < startDate.getTime()) {
      endDate = new Date(endDate.getTime() + 24 * 60 * 60000);
    }

    const durationMinutes = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 60000));

    onSaveEvent({
      type: 'sleep',
      started_at: startDate.toISOString(),
      ended_at: endDate.toISOString(),
      details: {
        durationMinutes,
        isOngoing: false
      },
      notes: notes || undefined
    });

    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-indigo-100 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-indigo-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">מעקב שינה</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-2 bg-slate-100/80 gap-1 text-xs font-semibold">
          <button
            onClick={() => setMode('live')}
            className={`py-2 rounded-xl transition-all ${
              mode === 'live'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌙 שינה חיה / תנומה עכשיו
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`py-2 rounded-xl transition-all ${
              mode === 'manual'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✍️ הוספת שעות ידנית
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-right overflow-y-auto flex-1">
          {mode === 'live' ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-3xl shadow-inner">
                {isSleepingNow ? '😴' : '🌙'}
              </div>

              {isSleepingNow ? (
                <>
                  <div className="space-y-1">
                    <span className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full font-bold animate-pulse">
                      התינוקת ישנה כרגע...
                    </span>
                    <p className="text-xs text-slate-500 pt-2">
                      נרדמה ב-
                      {new Date(activeSleepEvent.started_at).toLocaleTimeString('he-IL', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <button
                    onClick={handleWakeUp}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2 text-base active:scale-95"
                  >
                    <Square className="w-5 h-5 fill-current" />
                    <span>התעוררה! סיים ושמור שינה</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 text-base">התינוקת נרדמת עכשיו?</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      לחץ כאן כדי להתחיל מעקב שינה. כשתתעורר, לחץ שוב לסיום ותקבל חישוב מדויק של משך השינה.
                    </p>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="הערה (למשל: נרדמה בעגלה, במיטה שלה...)"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-right mb-3"
                    />
                  </div>

                  <button
                    onClick={handleStartLiveSleep}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>התחל מעקב שינה עכשיו</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">נרדמה ב:</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">התעוררה ב:</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">הערות:</label>
                <input
                  type="text"
                  placeholder="הערות לשינה (איפה ישנה, האם ישנה רצוף...)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <button
                onClick={handleSaveManualSleep}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Check className="w-5 h-5" />
                <span>שמור שינה ידנית</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
