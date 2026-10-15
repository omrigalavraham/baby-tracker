import React, { useState } from 'react';
import { Check, Scale, Trash2 } from 'lucide-react';
import { BabyEvent, BabyProfile } from '../types';
import { formatDate, localDateKey } from '../lib/babyUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { Sheet, Button, Card, Field, IconButton, fieldClass, cx } from './ui';

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
  const [date, setDate] = useState<string>(() => localDateKey());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [weightToDeleteId, setWeightToDeleteId] = useState<string | null>(null);

  const weightEvents = events
    .filter(e => e.type === 'weight')
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

  const lastWeight = weightEvents[0]?.details?.weightKg || profile.birth_weight;

  const handleSave = () => {
    const val = parseFloat(weightKg);
    if (isNaN(val) || val <= 0) {
      setError('נא להזין משקל בקילוגרמים, למשל 3.450');
      return;
    }
    setError(null);

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
    <>
      <Sheet
        open={isOpen}
        onClose={onClose}
        title="משקל"
        icon={<Scale />}
        tone="weight"
        footer={
          <Button block tone="weight" onClick={handleSave}>
            <Check />
            <span>שמירת שקילה</span>
          </Button>
        }
      >
        {/* Summary */}
        <div className="bg-weight-soft rounded-[28px] px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[13px] text-weight-ink">משקל אחרון</span>
            <span className="text-[28px] leading-tight font-medium text-weight-ink tabular-nums">
              {lastWeight ? `${lastWeight} ק"ג` : 'עוד אין'}
            </span>
          </div>
          {profile.birth_weight && (
            <div className="flex flex-col text-left">
              <span className="text-[13px] text-weight-ink">משקל לידה</span>
              <span className="text-[15px] text-weight-ink tabular-nums">{profile.birth_weight} ק"ג</span>
            </div>
          )}
        </div>

        {/* New weight */}
        <Field
          label="משקל חדש"
          hint={error ? <span className="text-danger">{error}</span> : 'לדוגמה: 3.450 (3 קילו ו-450 גרם)'}
        >
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="1"
              max="20"
              value={weightKg}
              onChange={e => {
                setWeightKg(e.target.value);
                if (error) setError(null);
              }}
              className={cx(fieldClass, 'h-14! text-[20px]! font-medium pl-14! tabular-nums')}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-muted pointer-events-none">
              ק"ג
            </span>
          </div>
        </Field>

        <Field label="תאריך">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={fieldClass} />
        </Field>

        <Field label="הערה (לא חובה)">
          <input
            type="text"
            placeholder="נשקלה בטיפת חלב..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className={fieldClass}
          />
        </Field>

        {/* History */}
        {weightEvents.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[15px] font-medium text-ink px-1">שקילות קודמות</h3>
            <Card className="divide-y divide-line overflow-hidden">
              {weightEvents.map(we => (
                <div key={we.id} className="flex items-center gap-3 pr-5 pl-2 py-2 min-h-14">
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="text-[15px] font-medium text-ink tabular-nums">{we.details?.weightKg} ק"ג</span>
                    {we.notes && <span className="text-[13px] text-muted truncate">{we.notes}</span>}
                  </div>
                  <span className="text-[13px] text-muted shrink-0">{formatDate(we.started_at)}</span>
                  <IconButton label="מחיקת שקילה" tone="ghost" onClick={() => setWeightToDeleteId(we.id)}>
                    <Trash2 />
                  </IconButton>
                </div>
              ))}
            </Card>
          </div>
        )}
      </Sheet>

      <ConfirmDeleteModal
        isOpen={!!weightToDeleteId}
        title="למחוק את השקילה?"
        description="היא תימחק ממעקב הגדילה."
        confirmText="כן, למחוק"
        cancelText="ביטול"
        onConfirm={() => {
          if (weightToDeleteId) {
            onDeleteEvent(weightToDeleteId);
            setWeightToDeleteId(null);
          }
        }}
        onClose={() => setWeightToDeleteId(null)}
      />
    </>
  );
};
