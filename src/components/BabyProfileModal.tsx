import React, { useState } from 'react';
import { X, Check, Baby, Heart } from 'lucide-react';
import { BabyProfile } from '../types';

interface BabyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BabyProfile;
  onSaveProfile: (updatedProfile: BabyProfile) => void;
}

export const BabyProfileModal: React.FC<BabyProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile
}) => {
  const [name, setName] = useState(profile.name || '');
  const [birthDate, setBirthDate] = useState(profile.birth_date || new Date().toISOString().slice(0, 10));
  const [birthTime, setBirthTime] = useState(profile.birth_time || '12:00');
  const [birthWeight, setBirthWeight] = useState(profile.birth_weight?.toString() || '3.200');
  const [gender, setGender] = useState<'girl' | 'boy'>(profile.gender || 'girl');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...profile,
      name: name.trim() || 'הנסיכה הקטנה',
      birth_date: birthDate,
      birth_time: birthTime,
      birth_weight: parseFloat(birthWeight) || 3.2,
      gender
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-rose-100 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-rose-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center text-lg">
              👶
            </div>
            <h2 className="font-bold text-slate-800 text-lg">פרופיל התינוקת</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-right overflow-y-auto flex-1">
          
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">שם התינוקת:</label>
            <input
              type="text"
              required
              placeholder="למשל: תמר, נועה, רומי..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">תאריך לידה:</label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">שעת לידה (אופציונלי):</label>
              <input
                type="time"
                value={birthTime}
                onChange={e => setBirthTime(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">משקל לידה (בק"ג):</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.5"
                max="8"
                value={birthWeight}
                onChange={e => setBirthWeight(e.target.value)}
                className="w-full pl-12 pr-4 py-2 text-sm font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">ק"ג</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">מין:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender('girl')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  gender === 'girl'
                    ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                בת 👧
              </button>
              <button
                type="button"
                onClick={() => setGender('boy')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  gender === 'boy'
                    ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                בן 👦
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Check className="w-5 h-5" />
            <span>שמור פרופיל</span>
          </button>
        </form>

      </div>
    </div>
  );
};
