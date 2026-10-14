import React, { useState } from 'react';
import { X, Check, Droplets } from 'lucide-react';
import { DiaperType, BabyEvent } from '../types';

interface DiaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (eventData: Partial<BabyEvent>) => void;
}

export const DiaperModal: React.FC<DiaperModalProps> = ({
  isOpen,
  onClose,
  onSaveEvent
}) => {
  const [diaperType, setDiaperType] = useState<DiaperType>('both');
  const [poopColor, setPoopColor] = useState<string>('צהוב חרדלי');
  const [poopTexture, setPoopTexture] = useState<string>('גרגירי');
  const [time, setTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const now = new Date();
    const [h, m] = time.split(':').map(Number);
    const eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);

    onSaveEvent({
      type: 'diaper',
      started_at: eventDate.toISOString(),
      details: {
        diaperType,
        poopColor: diaperType !== 'pee' ? poopColor : undefined,
        poopTexture: diaperType !== 'pee' ? poopTexture : undefined
      },
      notes: notes || undefined
    });

    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-sky-100 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-sky-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">החלפת טיטול</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-right overflow-y-auto">
          
          {/* Diaper Type Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">סוג ההרטבה:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDiaperType('pee')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${
                  diaperType === 'pee'
                    ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <span className="text-2xl">💧</span>
                <span className="text-xs font-bold">פיפי</span>
              </button>

              <button
                type="button"
                onClick={() => setDiaperType('poop')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${
                  diaperType === 'poop'
                    ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <span className="text-2xl">💩</span>
                <span className="text-xs font-bold">קקי</span>
              </button>

              <button
                type="button"
                onClick={() => setDiaperType('both')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${
                  diaperType === 'both'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <span className="text-2xl">💧💩</span>
                <span className="text-xs font-bold">שניהם</span>
              </button>
            </div>
          </div>

          {/* Stool details if poop */}
          {diaperType !== 'pee' && (
            <div className="space-y-3 p-3 bg-amber-50/50 rounded-2xl border border-amber-100">
              <div>
                <label className="text-xs font-semibold text-amber-900 block mb-1.5">צבע היציאה:</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-medium">
                  {['צהוב חרדלי', 'צהוב בהיר', 'ירוק', 'חום'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPoopColor(c)}
                      className={`py-1.5 px-1 rounded-xl border text-center transition-all ${
                        poopColor === c
                          ? 'bg-amber-500 text-white border-amber-600 font-bold'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-amber-900 block mb-1.5">מרקם:</label>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-medium">
                  {['גרגירי', 'נוזלי', 'משחתי'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPoopTexture(t)}
                      className={`py-1.5 px-1 rounded-xl border text-center transition-all ${
                        poopTexture === t
                          ? 'bg-amber-500 text-white border-amber-600 font-bold'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Time */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">שעת החלפה:</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">הערות נוספות:</label>
            <input
              type="text"
              placeholder="למשל: נמרחה משחה, מעט אדמומיות בטוסיק..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSave}
            className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-md shadow-sky-200 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Check className="w-5 h-5" />
            <span>שמור החלפת טיטול</span>
          </button>

        </div>

      </div>
    </div>
  );
};
