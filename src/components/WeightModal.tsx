import React, { useEffect, useState } from 'react';
import { Check, Ruler, Scale, Trash2 } from 'lucide-react';
import { BabyEvent, BabyProfile } from '../types';
import { formatDate, localDateKey } from '../lib/babyUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { HeightMat } from './HeightMat';
import { Sheet, Button, Card, Field, IconButton, Segmented, fieldClass, cx } from './ui';

interface WeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (eventData: Partial<BabyEvent>) => void;
  events: BabyEvent[];
  profile: BabyProfile;
  onDeleteEvent: (id: string) => void;
}

type GrowthTab = 'weight' | 'height';

const byNewest = (a: BabyEvent, b: BabyEvent) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime();

/** "Growth" sheet: weight and length (height) measurements. */
export const WeightModal: React.FC<WeightModalProps> = ({ isOpen, onClose, onSaveEvent, events, profile, onDeleteEvent }) => {
  const [tab, setTab] = useState<GrowthTab>('weight');
  const [weightKg, setWeightKg] = useState<string>('3.500');
  const [heightCm, setHeightCm] = useState<number>(52);
  const [date, setDate] = useState<string>(() => localDateKey());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  const weightEvents = events.filter(e => e.type === 'weight').sort(byNewest);
  const heightEvents = events.filter(e => e.type === 'height').sort(byNewest);
  const lastWeight = weightEvents[0]?.details?.weightKg || profile.birth_weight;
  const lastHeight: number | undefined = heightEvents[0]?.details?.heightCm;

  // Start each measurement from the last one
  useEffect(() => {
    if (!isOpen) return;
    setDate(localDateKey());
    setNotes('');
    setError(null);
    if (lastHeight) setHeightCm(lastHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSave = () => {
    if (tab === 'weight') {
      const val = parseFloat(weightKg);
      if (isNaN(val) || val <= 0) {
        setError('נא להזין משקל בקילוגרמים, למשל 3.450');
        return;
      }
      onSaveEvent({ type: 'weight', started_at: new Date(date).toISOString(), details: { weightKg: Number(val.toFixed(3)) }, notes: notes || undefined });
    } else {
      onSaveEvent({ type: 'height', started_at: new Date(date).toISOString(), details: { heightCm }, notes: notes || undefined });
    }
    onClose();
  };

  const history = tab === 'weight' ? weightEvents : heightEvents;

  return (
    <>
      <Sheet
        open={isOpen}
        onClose={onClose}
        title="גדילה"
        icon={tab === 'weight' ? <Scale /> : <Ruler />}
        tone="weight"
        footer={
          <Button block tone="weight" onClick={handleSave}>
            <Check />
            <span>{tab === 'weight' ? 'שמירת שקילה' : 'שמירת מדידה'}</span>
          </Button>
        }
      >
        <Segmented
          label="סוג מדידה"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'weight', label: 'משקל' },
            { value: 'height', label: 'גובה' },
          ]}
        />

        {tab === 'weight' ? (
          <div key="weight" className="space-y-5 animate-view-in">
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

            <Field label="משקל חדש" hint={error ? <span className="text-danger">{error}</span> : 'לדוגמה: 3.450 (3 קילו ו-450 גרם)'}>
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
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-muted pointer-events-none">ק"ג</span>
              </div>
            </Field>
          </div>
        ) : (
          <div key="height" className="animate-view-in">
            <HeightMat value={heightCm} onChange={setHeightCm} previous={lastHeight} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="תאריך">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={fieldClass} />
          </Field>
          <Field label="הערה (לא חובה)">
            <input type="text" placeholder="בטיפת חלב..." value={notes} onChange={e => setNotes(e.target.value)} className={fieldClass} />
          </Field>
        </div>

        {history.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[15px] font-medium text-ink px-1">{tab === 'weight' ? 'שקילות קודמות' : 'מדידות קודמות'}</h3>
            <Card className="divide-y divide-line overflow-hidden">
              {history.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 pr-5 pl-2 py-2 min-h-14">
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="text-[15px] font-medium text-ink tabular-nums">
                      {tab === 'weight' ? `${ev.details?.weightKg} ק"ג` : `${ev.details?.heightCm} ס"מ`}
                    </span>
                    {ev.notes && <span className="text-[13px] text-muted truncate">{ev.notes}</span>}
                  </div>
                  <span className="text-[13px] text-muted shrink-0">{formatDate(ev.started_at)}</span>
                  <IconButton label="מחיקה" tone="ghost" onClick={() => setToDeleteId(ev.id)}>
                    <Trash2 />
                  </IconButton>
                </div>
              ))}
            </Card>
          </div>
        )}
      </Sheet>

      <ConfirmDeleteModal
        isOpen={!!toDeleteId}
        title={tab === 'weight' ? 'למחוק את השקילה?' : 'למחוק את המדידה?'}
        description="היא תימחק ממעקב הגדילה."
        confirmText="כן, למחוק"
        cancelText="ביטול"
        onConfirm={() => {
          if (toDeleteId) {
            onDeleteEvent(toDeleteId);
            setToDeleteId(null);
          }
        }}
        onClose={() => setToDeleteId(null)}
      />
    </>
  );
};
