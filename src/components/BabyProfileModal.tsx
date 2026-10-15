import React, { useEffect, useState } from 'react';
import { Check, Baby } from 'lucide-react';
import { BabyProfile } from '../types';
import { Sheet, Button, Field, fieldClass, Choice } from './ui';
import { localDateKey } from '../lib/babyUtils';

interface BabyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BabyProfile;
  onSaveProfile: (updatedProfile: BabyProfile) => void;
}

const FORM_ID = 'baby-profile-form';

export const BabyProfileModal: React.FC<BabyProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile
}) => {
  const [name, setName] = useState(profile.name || '');
  const [birthDate, setBirthDate] = useState(profile.birth_date || localDateKey());
  const [birthTime, setBirthTime] = useState(profile.birth_time || '12:00');
  const [birthWeight, setBirthWeight] = useState(profile.birth_weight?.toString() || '3.200');
  const [gender, setGender] = useState<'girl' | 'boy'>(profile.gender || 'girl');

  // Refill from the latest profile each time the sheet opens (it may have changed on the other phone)
  useEffect(() => {
    if (!isOpen) return;
    setName(profile.name || '');
    setBirthDate(profile.birth_date || localDateKey());
    setBirthTime(profile.birth_time || '12:00');
    setBirthWeight(profile.birth_weight?.toString() || '3.200');
    setGender(profile.gender || 'girl');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
    <Sheet
      open={isOpen}
      onClose={onClose}
      title="הפרופיל שלה"
      icon={<Baby />}
      tone="feed"
      footer={
        <Button type="submit" form={FORM_ID} block>
          <Check />
          <span>שמירה</span>
        </Button>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-5 text-right">
        <Field label="השם שלה">
          <input
            type="text"
            required
            placeholder="למשל: תמר, נועה, רומי"
            value={name}
            onChange={e => setName(e.target.value)}
            className={fieldClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="תאריך לידה">
            <input
              type="date"
              required
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="שעת לידה (לא חובה)">
            <input
              type="time"
              value={birthTime}
              onChange={e => setBirthTime(e.target.value)}
              className={fieldClass}
            />
          </Field>
        </div>

        <Field label="משקל לידה">
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.5"
              max="8"
              value={birthWeight}
              onChange={e => setBirthWeight(e.target.value)}
              className={`${fieldClass} pl-14 tabular-nums`}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-muted pointer-events-none">ק"ג</span>
          </div>
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted px-1">מין</span>
          <div className="grid grid-cols-2 gap-2">
            <Choice selected={gender === 'girl'} tone="feed" onClick={() => setGender('girl')}>
              בת
            </Choice>
            <Choice selected={gender === 'boy'} tone="sleep" onClick={() => setGender('boy')}>
              בן
            </Choice>
          </div>
        </div>
      </form>
    </Sheet>
  );
};
