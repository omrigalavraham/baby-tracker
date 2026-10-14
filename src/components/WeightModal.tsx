import React, { useState } from 'react';
import { X, Check, Scale, TrendingUp, Calendar, Trash2 } from 'lucide-react';
import { BabyEvent, BabyProfile } from '../types';
import { formatDate } from '../lib/babyUtils';

interface WeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (eventData: Partial<BabyEvent>) => void;
  events: BabyEvent[];
  profile: BabyProfile;
  onDeleteEvent: (id: string) => void;
}

export const WeightModal: React.FC<WeightModalProps> = ({
  isOpen,
  onClose,
  onSaveEvent,
  events,
  profile,
  onDeleteEvent
}) => {
  const [weightKg, setWeightKg] = useState<string>('3.500');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const weightEvents = events
    .filter(e => e.type === 'weight')
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

  const lastWeight = weightEvents[0]?.details?.weightKg || profile.birth_weight;

  const handleSave = () => {
    const val = parseFloat(weightKg);
    if (isNaN(val) || val <= 0) {
      alert('נא להזין משקל תקין בקילוגרמים');
      return;
    }

    onSaveEvent({
      type: 'weight',
      started_at: new Date(date).toISOString(),
      details: {
        weightKg: Number(val.toFixed(3))
      },
      notes: notes || undefined
    });

    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-amber-100 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-amber-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">מעקב משקל וגדילה</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-right overflow-y-auto flex-1">
          
          {/* Summary Box */}
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-800 font-medium block">משקל אחרון שתועד:</span>
              <span className="text-2xl font-bold text-amber-900">
                {lastWeight ? `${lastWeight} ק"ג` : 'אין נתון'}
              </span>
            </div>
            {profile.birth_weight && (
              <div className="text-left">
                <span className="text-xs text-slate-500 block">משקל לידה:</span>
                <span className="text-sm font-semibold text-slate-700">{profile.birth_weight} ק"ג</span>
              </div>
            )}
          </div>

          {/* New Weight Input */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                משקל חדש (בקילוגרמים):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="20"
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 text-lg font-bold text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="absolute left-3 top-3 text-sm font-semibold text-slate-400">
                  ק"ג
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">לדוגמה: 3.450 (3 קילו ו-450 גרם)</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">תאריך השקילה:</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">הערות (למשל: נשקלה בטיפת חלב):</label>
              <input
                type="text"
                placeholder="הערה לשקילה..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-md shadow-amber-200 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Check className="w-5 h-5" />
              <span>שמור שקילה חדשה</span>
            </button>
          </div>

          {/* Weight History List */}
          {weightEvents.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                היסטוריית שקילות:
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {weightEvents.map(we => (
                  <div 
                    key={we.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 text-sm">{we.details?.weightKg} ק"ג</span>
                      {we.notes && <span className="text-slate-500 mr-2">({we.notes})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">{formatDate(we.started_at)}</span>
                      <button
                        onClick={() => onDeleteEvent(we.id)}
                        className="text-slate-300 hover:text-rose-500 p-1"
                        title="מחק שקילה"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
