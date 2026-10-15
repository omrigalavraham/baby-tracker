import React, { useState, useEffect } from 'react';
import { Play, Pause, Check, RotateCcw, Milk } from 'lucide-react';
import { BreastSide, BottleContent, BabyEvent } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { BottleFill } from './BottleFill';
import { Sheet, Button, Choice, Field, Segmented, IconButton, fieldClass } from './ui';

interface FeedingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (eventData: Partial<BabyEvent>) => void;
}

type FeedTab = 'breast' | 'bottle' | 'solids';

const nowHHMM = (offsetMinutes = 0) => {
  const d = new Date(Date.now() + offsetMinutes * 60000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const todayAt = (hhmm: string) => {
  const now = new Date();
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
};

const SIDE_LABEL: Record<BreastSide, string> = { right: 'ימין', left: 'שמאל', both: 'שניהם' };

export const FeedingModal: React.FC<FeedingModalProps> = ({
  isOpen,
  onClose,
  onSaveEvent
}) => {
  const [activeTab, setActiveTab] = useState<FeedTab>('breast');
  const [breastMode, setBreastMode] = useState<'live' | 'manual'>('live');

  // Live Timer State
  const [timerRunning, setTimerRunning] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('right');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [secondsRight, setSecondsRight] = useState(0);
  const [liveStartTime, setLiveStartTime] = useState<Date | null>(null);

  // Bottle State
  const [bottleAmount, setBottleAmount] = useState<number>(60);
  const [bottleContent, setBottleContent] = useState<BottleContent>('breast_milk');
  const [bottleTime, setBottleTime] = useState<string>(() => nowHHMM());
  const [bottleDuration, setBottleDuration] = useState<number>(15);

  // Manual breast State
  const [manualSide, setManualSide] = useState<BreastSide>('both');
  const [manualStartTime, setManualStartTime] = useState<string>(() => nowHHMM());
  const [manualDuration, setManualDuration] = useState<number>(20);

  // Solids State
  const [solidsTime, setSolidsTime] = useState<string>(() => nowHHMM());

  const [notes, setNotes] = useState('');

  // Refresh the default times every time the sheet opens
  useEffect(() => {
    if (!isOpen) return;
    setBottleTime(nowHHMM());
    setManualStartTime(nowHHMM());
    setSolidsTime(nowHHMM());
  }, [isOpen]);

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

  const totalSeconds = secondsLeft + secondsRight;

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setSecondsLeft(0);
    setSecondsRight(0);
    setLiveStartTime(null);
  };

  const handleSaveLiveTimer = () => {
    const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
    const start = liveStartTime || new Date(Date.now() - totalSeconds * 1000);
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

    resetTimer();
    setNotes('');
    onClose();
  };

  const handleSaveBottle = () => {
    const eventDate = todayAt(bottleTime);
    const duration = Math.max(1, bottleDuration || 15);

    onSaveEvent({
      type: 'feeding',
      started_at: eventDate.toISOString(),
      ended_at: new Date(eventDate.getTime() + duration * 60000).toISOString(),
      details: {
        feedType: 'bottle',
        bottleAmountMl: bottleAmount,
        bottleContent: bottleContent,
        durationMinutes: duration
      },
      notes: notes || undefined
    });

    setNotes('');
    onClose();
  };

  const handleSaveManual = () => {
    const startDate = todayAt(manualStartTime);
    const endDate = new Date(startDate.getTime() + manualDuration * 60000);

    onSaveEvent({
      type: 'feeding',
      started_at: startDate.toISOString(),
      ended_at: endDate.toISOString(),
      details: {
        feedType: 'breast',
        breastSide: manualSide,
        durationMinutes: manualDuration
      },
      notes: notes || undefined
    });

    setNotes('');
    onClose();
  };

  const handleSaveSolids = () => {
    const eventDate = todayAt(solidsTime);

    onSaveEvent({
      type: 'feeding',
      started_at: eventDate.toISOString(),
      details: {
        feedType: 'solids'
      },
      notes: notes || undefined
    });

    setNotes('');
    onClose();
  };

  const startSide = (side: 'left' | 'right') => {
    setActiveSide(side);
    setTimerRunning(true);
  };

  // ----- Footer: one clear primary action per state -----
  let footer: React.ReactNode;
  if (activeTab === 'breast' && breastMode === 'live') {
    footer =
      totalSeconds === 0 && !timerRunning ? (
        <Button block tone="feed" onClick={() => startSide(activeSide)}>
          <Play />
          <span>להתחיל הנקה</span>
        </Button>
      ) : (
        <Button block tone="feed" disabled={totalSeconds === 0} onClick={handleSaveLiveTimer}>
          <Check />
          <span>סיום ושמירה</span>
        </Button>
      );
  } else if (activeTab === 'breast') {
    footer = (
      <Button block tone="feed" onClick={handleSaveManual}>
        <Check />
        <span>שמירה</span>
      </Button>
    );
  } else if (activeTab === 'bottle') {
    footer = (
      <Button block tone="feed" onClick={handleSaveBottle}>
        <Check />
        <span>שמירת בקבוק</span>
      </Button>
    );
  } else {
    footer = (
      <Button block tone="feed" onClick={handleSaveSolids}>
        <Check />
        <span>שמירה</span>
      </Button>
    );
  }

  const totalH = Math.floor(totalSeconds / 3600);
  const totalM = Math.floor((totalSeconds % 3600) / 60);
  const totalS = totalSeconds % 60;

  const notesField = (placeholder: string) => (
    <Field label="הערה (לא חובה)">
      <input
        type="text"
        placeholder={placeholder}
        value={notes}
        onChange={e => setNotes(e.target.value)}
        className={fieldClass}
      />
    </Field>
  );

  return (
    <>
      <Sheet open={isOpen} onClose={onClose} title="האכלה" icon={<Milk />} tone="feed" footer={footer}>
        <Segmented<FeedTab>
          label="סוג האכלה"
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: 'breast', label: 'הנקה' },
            { value: 'bottle', label: 'בקבוק' },
            { value: 'solids', label: 'מוצקים' }
          ]}
        />

        {/* Breast: live timer */}
        {activeTab === 'breast' && breastMode === 'live' && (
          <div className="space-y-5">
            <div className="text-center pt-2">
              <div className="text-[40px] leading-none font-medium text-ink tabular-nums" dir="ltr">
                {totalH}:{String(totalM).padStart(2, '0')}
                <span className="text-[20px] text-faint">:{String(totalS).padStart(2, '0')}</span>
              </div>
              <p className="text-[13px] text-muted mt-2">
                {timerRunning
                  ? `מניקה מצד ${SIDE_LABEL[activeSide]}`
                  : totalSeconds > 0
                  ? 'מושהה'
                  : 'בוחרים צד והטיימר מתחיל'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(['right', 'left'] as const).map(side => {
                const isActive = activeSide === side && timerRunning;
                const secs = side === 'right' ? secondsRight : secondsLeft;
                return (
                  <Choice
                    key={side}
                    tone="feed"
                    selected={isActive}
                    onClick={() => startSide(side)}
                    className="min-h-[92px]"
                  >
                    <span className="flex flex-col items-center gap-1">
                      <span className="text-[15px]">{SIDE_LABEL[side]}</span>
                      <span className="text-[20px] font-medium tabular-nums" dir="ltr">
                        {formatMinSec(secs)}
                      </span>
                    </span>
                  </Choice>
                );
              })}
            </div>

            {totalSeconds > 0 && (
              <div className="flex items-center justify-center gap-3">
                <Button variant="soft" size="md" onClick={() => setTimerRunning(!timerRunning)}>
                  {timerRunning ? <Pause /> : <Play />}
                  <span>{timerRunning ? 'השהיה' : 'המשך'}</span>
                </Button>
                <IconButton label="איפוס טיימר" tone="sunken" onClick={() => setShowResetConfirm(true)}>
                  <RotateCcw />
                </IconButton>
              </div>
            )}

            {notesField('תפסה יפה, נרדמה על השד...')}

            <button
              type="button"
              onClick={() => setBreastMode('manual')}
              className="w-full min-h-12 text-[13px] text-muted"
            >
              שכחתם להפעיל טיימר? הוספה ידנית
            </button>
          </div>
        )}

        {/* Breast: manual entry */}
        {activeTab === 'breast' && breastMode === 'manual' && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-[13px] text-muted px-1">צד</span>
              <div className="grid grid-cols-3 gap-2">
                {(['right', 'left', 'both'] as BreastSide[]).map(s => (
                  <Choice key={s} tone="feed" selected={manualSide === s} onClick={() => setManualSide(s)}>
                    {SIDE_LABEL[s]}
                  </Choice>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="שעת התחלה">
                <input
                  type="time"
                  value={manualStartTime}
                  onChange={e => setManualStartTime(e.target.value)}
                  className={fieldClass}
                />
              </Field>
              <Field label="משך בדקות">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="120"
                  value={manualDuration}
                  onChange={e => setManualDuration(Number(e.target.value))}
                  className={fieldClass}
                />
              </Field>
            </div>

            {notesField('הערה קצרה...')}

            <button
              type="button"
              onClick={() => setBreastMode('live')}
              className="w-full min-h-12 text-[13px] text-muted"
            >
              חזרה לטיימר
            </button>
          </div>
        )}

        {/* Bottle */}
        {activeTab === 'bottle' && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-[13px] text-muted px-1">מה בבקבוק</span>
              <div className="grid grid-cols-2 gap-2">
                <Choice tone="feed" selected={bottleContent === 'breast_milk'} onClick={() => setBottleContent('breast_milk')}>
                  חלב אם
                </Choice>
                <Choice tone="feed" selected={bottleContent === 'formula'} onClick={() => setBottleContent('formula')}>
                  תמ"ל
                </Choice>
              </div>
            </div>

            <div className="space-y-4">
              <BottleFill value={bottleAmount} onChange={setBottleAmount} />
              <div className="grid grid-cols-5 gap-2">
                {[30, 60, 90, 120, 150].map(amount => (
                  <Choice
                    key={amount}
                    tone="feed"
                    selected={bottleAmount === amount}
                    onClick={() => setBottleAmount(amount)}
                    className="px-0 tabular-nums"
                  >
                    {amount}
                  </Choice>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="שעה">
                <input
                  type="time"
                  value={bottleTime}
                  onChange={e => setBottleTime(e.target.value)}
                  className={fieldClass}
                />
              </Field>
              <Field label="משך בדקות">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="120"
                  value={bottleDuration}
                  onChange={e => setBottleDuration(Number(e.target.value))}
                  className={fieldClass}
                />
              </Field>
            </div>

            {notesField('הערה קצרה...')}
          </div>
        )}

        {/* Solids */}
        {activeTab === 'solids' && (
          <div className="space-y-5">
            <Field label="שעה">
              <input
                type="time"
                value={solidsTime}
                onChange={e => setSolidsTime(e.target.value)}
                className={fieldClass}
              />
            </Field>
            <Field label="מה אכלה">
              <input
                type="text"
                placeholder="מחית בטטה, אבוקדו..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className={fieldClass}
              />
            </Field>
          </div>
        )}
      </Sheet>

      <ConfirmDeleteModal
        isOpen={showResetConfirm}
        title="לאפס את הטיימר?"
        description="זמן ההנקה הנוכחי יימחק ולא יישמר."
        confirmText="כן, לאפס"
        cancelText="להמשיך"
        onConfirm={() => {
          resetTimer();
          setShowResetConfirm(false);
        }}
        onClose={() => setShowResetConfirm(false)}
      />
    </>
  );
};
