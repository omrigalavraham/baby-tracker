import React, { useState, useEffect } from 'react';
import { Check, Baby } from 'lucide-react';
import { DiaperType, BabyEvent } from '../types';
import { Sheet, Button, Choice, Field, fieldClass } from './ui';

interface DiaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (eventData: Partial<BabyEvent>) => void;
}

const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const DIAPER_TYPES: { value: DiaperType; label: string }[] = [
  { value: 'pee', label: 'פיפי' },
  { value: 'poop', label: 'קקי' },
  { value: 'both', label: 'גם וגם' }
];

// Real stool colors (data swatches, not theme colors)
const POOP_COLORS: { value: string; swatch: string }[] = [
  { value: 'צהוב חרדלי', swatch: '#C9A227' },
  { value: 'צהוב בהיר', swatch: '#E9D57E' },
  { value: 'ירוק', swatch: '#6E8B3D' },
  { value: 'חום', swatch: '#7A5230' }
];

const POOP_TEXTURES = ['גרגירי', 'נוזלי', 'משחתי'];

export const DiaperModal: React.FC<DiaperModalProps> = ({
  isOpen,
  onClose,
  onSaveEvent
}) => {
  const [diaperType, setDiaperType] = useState<DiaperType>('both');
  const [poopColor, setPoopColor] = useState<string>('צהוב חרדלי');
  const [poopTexture, setPoopTexture] = useState<string>('גרגירי');
  const [time, setTime] = useState<string>(() => nowHHMM());
  const [notes, setNotes] = useState('');

  // Default to "now" each time the sheet opens
  useEffect(() => {
    if (isOpen) setTime(nowHHMM());
  }, [isOpen]);

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
    <Sheet
      open={isOpen}
      onClose={onClose}
      title="החלפת טיטול"
      icon={<Baby />}
      tone="diaper"
      footer={
        <Button block tone="diaper" onClick={handleSave}>
          <Check />
          <span>שמירה</span>
        </Button>
      }
    >
      {/* Quick type tiles */}
      <div className="grid grid-cols-3 gap-3">
        {DIAPER_TYPES.map(t => (
          <Choice
            key={t.value}
            tone="diaper"
            selected={diaperType === t.value}
            onClick={() => setDiaperType(t.value)}
            className="min-h-[72px] text-base"
          >
            {t.label}
          </Choice>
        ))}
      </div>

      {/* Stool details */}
      {diaperType !== 'pee' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <span className="text-[13px] text-muted px-1">צבע</span>
            <div className="grid grid-cols-2 gap-2">
              {POOP_COLORS.map(c => (
                <Choice
                  key={c.value}
                  tone="diaper"
                  selected={poopColor === c.value}
                  onClick={() => setPoopColor(c.value)}
                  className="justify-start"
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: c.swatch }}
                    />
                    <span>{c.value}</span>
                  </span>
                </Choice>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[13px] text-muted px-1">מרקם</span>
            <div className="grid grid-cols-3 gap-2">
              {POOP_TEXTURES.map(t => (
                <Choice key={t} tone="diaper" selected={poopTexture === t} onClick={() => setPoopTexture(t)}>
                  {t}
                </Choice>
              ))}
            </div>
          </div>
        </div>
      )}

      <Field label="שעה">
        <input type="time" value={time} onChange={e => setTime(e.target.value)} className={fieldClass} />
      </Field>

      <Field label="הערה (לא חובה)">
        <input
          type="text"
          placeholder="נמרחה משחה, קצת אדמומיות..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className={fieldClass}
        />
      </Field>
    </Sheet>
  );
};
