import React, { useEffect, useMemo, useState } from 'react';
import { BabyEvent, BabyProfile, DailyReminderItem, SmartTimersConfig } from '../types';
import { Bath, Bell, BellOff, Droplet, Heart, Pill, Plus, Stethoscope, Sun, Trash2 } from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showAppNotification,
} from '../lib/notificationService';
import { Button, Card, CheckCircle, Choice, Field, IconBadge, SectionTitle, Sheet, Toggle, Tone, cx, fieldClass } from './ui';
import { localDateKey } from '../lib/babyUtils';

interface RemindersTabProps {
  profile: BabyProfile;
  events: BabyEvent[];
  activeSleep: BabyEvent | null;
  reminders: DailyReminderItem[];
  smartTimers: SmartTimersConfig;
  onUpdateReminders: (reminders: DailyReminderItem[]) => void;
  onUpdateSmartTimers: (timers: SmartTimersConfig) => void;
}

const ICON_PROPS = { strokeWidth: 1.75 };

const CATEGORY_LOOK: Record<DailyReminderItem['category'], { tone: Tone; Icon: React.FC<{ strokeWidth?: number }> }> = {
  vitamin: { tone: 'weight', Icon: Sun },
  iron: { tone: 'feed', Icon: Droplet },
  medication: { tone: 'primary', Icon: Pill },
  bath: { tone: 'sleep', Icon: Bath },
  appointment: { tone: 'diaper', Icon: Stethoscope },
  custom: { tone: 'primary', Icon: Heart },
};

type TimerKey = 'feedingIntervalMinutes' | 'wakeWindowMinutes' | 'stopwatchAlertMinutes';

const TIMER_OPTIONS: Record<TimerKey, { defaultValue: number; options: number[] }> = {
  feedingIntervalMinutes: { defaultValue: 180, options: [150, 180, 210] },
  wakeWindowMinutes: { defaultValue: 75, options: [60, 75, 90] },
  stopwatchAlertMinutes: { defaultValue: 60, options: [45, 60, 90] },
};

/** Warm, human duration: 180 -> "3 שעות", 150 -> "שעתיים וחצי", 75 -> "75 דקות" */
function formatDuration(minutes: number): string {
  if (minutes < 60 || minutes % 30 !== 0) return `${minutes} דקות`;
  const hours = Math.floor(minutes / 60);
  const half = minutes % 60 === 30;
  const base = hours === 1 ? 'שעה' : hours === 2 ? 'שעתיים' : `${hours} שעות`;
  return half ? `${base} וחצי` : base;
}

function formatShortDuration(minutes: number): string {
  if (minutes < 60 || minutes % 30 !== 0) return `${minutes} דק׳`;
  return `${minutes / 60} שע׳`;
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function todayKey(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export const RemindersTab: React.FC<RemindersTabProps> = ({
  profile,
  events,
  activeSleep,
  reminders,
  smartTimers,
  onUpdateReminders,
  onUpdateSmartTimers,
}) => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(getNotificationPermission());
  const supported = isNotificationSupported();

  // Add sheet
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('12:00');
  const [newDesc, setNewDesc] = useState('');

  // Edit sheet
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const editingItem = reminders.find(r => r.id === editingId) || null;

  // Gentle tick so the timer descriptions stay roughly current
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), 60000);
    return () => window.clearInterval(id);
  }, []);

  // Kept consistent with the existing data format (stored lastCompletedDate values)
  const todayStr = localDateKey();
  void todayKey;

  const activeReminders = reminders.filter(r => r.enabled);
  const completedCount = activeReminders.filter(r => r.lastCompletedDate === todayStr).length;

  const sortedReminders = useMemo(
    () =>
      [...reminders].sort((a, b) => {
        if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
        return a.time.localeCompare(b.time);
      }),
    [reminders]
  );

  const babyName = profile.name || 'הקטנה';

  // ---- Notifications ----
  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : getNotificationPermission());
    if (granted) {
      showAppNotification('ההתראות פועלות', {
        body: `מעכשיו נזכיר לך בשקט על הדברים החשובים של ${babyName}.`,
        tag: 'welcome-test',
        playSound: true,
        cooldownMinutes: 0,
      });
    }
  };

  const handleTestNotification = () => {
    showAppNotification('בדיקת התראה', {
      body: 'הכל עובד. ככה ייראו התזכורות שלך.',
      tag: 'test-' + Date.now(),
      playSound: true,
      cooldownMinutes: 0,
    });
  };

  // ---- Reminder actions ----
  const handleToggleComplete = (item: DailyReminderItem) => {
    const isDone = item.lastCompletedDate === todayStr;
    onUpdateReminders(reminders.map(r => (r.id === item.id ? { ...r, lastCompletedDate: isDone ? undefined : todayStr } : r)));
  };

  const openEdit = (item: DailyReminderItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditTime(item.time);
    setEditDesc(item.description || '');
    setConfirmingDelete(false);
  };

  const closeEdit = () => {
    setEditingId(null);
    setConfirmingDelete(false);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editTitle.trim()) return;
    onUpdateReminders(
      reminders.map(r =>
        r.id === editingItem.id
          ? { ...r, title: editTitle.trim(), time: editTime || r.time, description: editDesc.trim() || undefined }
          : r
      )
    );
    closeEdit();
  };

  const setEnabled = (id: string, enabled: boolean) => {
    onUpdateReminders(reminders.map(r => (r.id === id ? { ...r, enabled } : r)));
  };

  const deleteEditing = () => {
    if (!editingItem) return;
    onUpdateReminders(reminders.filter(r => r.id !== editingItem.id));
    closeEdit();
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newItem: DailyReminderItem = {
      id: 'rem_' + Date.now(),
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      category: 'custom',
      icon: '⭐️', // kept for data compatibility; the list renders a lucide icon by category
      time: newTime || '12:00',
      enabled: true,
    };
    onUpdateReminders([...reminders, newItem]);
    setNewTitle('');
    setNewDesc('');
    setNewTime('12:00');
    setIsAdding(false);
  };

  // ---- Smart timers ----
  const setTimer = (key: TimerKey, value: number) => onUpdateSmartTimers({ ...smartTimers, [key]: value });

  const lastFeeding = events.find(e => e.type === 'feeding');
  let feedingDescription = `${formatDuration(smartTimers.feedingIntervalMinutes)} אחרי ההאכלה האחרונה`;
  if (smartTimers.feedingIntervalMinutes > 0 && lastFeeding) {
    const next = new Date(new Date(lastFeeding.started_at).getTime() + smartTimers.feedingIntervalMinutes * 60000);
    if (next.getTime() > Date.now()) feedingDescription += ` · בערך ב-${formatClock(next)}`;
  }
  if (smartTimers.feedingIntervalMinutes === 0) feedingDescription = 'כבויה כרגע';

  let wakeDescription = 'כבויה כרגע';
  if (smartTimers.wakeWindowMinutes > 0) {
    wakeDescription = `אחרי ${formatDuration(smartTimers.wakeWindowMinutes)} של ערות`;
    if (activeSleep) {
      wakeDescription += ` · ${babyName} ישנה עכשיו`;
    } else {
      const lastEndedSleep = events.find(e => e.type === 'sleep' && e.ended_at);
      if (lastEndedSleep?.ended_at) {
        const awake = Math.floor((Date.now() - new Date(lastEndedSleep.ended_at).getTime()) / 60000);
        if (awake >= 0 && awake < 24 * 60) wakeDescription += ` · ערה כבר ${awake} דק׳`;
      }
    }
  }

  const stopwatchDescription =
    smartTimers.stopwatchAlertMinutes > 0
      ? `אם טיימר שינה או הנקה פועל מעל ${formatDuration(smartTimers.stopwatchAlertMinutes)}`
      : 'כבויה כרגע';

  const timerRows: { key: TimerKey; label: string; description: string; tone: Tone }[] = [
    { key: 'feedingIntervalMinutes', label: 'זמן האכלה', description: feedingDescription, tone: 'feed' },
    { key: 'wakeWindowMinutes', label: 'חלון ערות', description: wakeDescription, tone: 'sleep' },
    { key: 'stopwatchAlertMinutes', label: 'טיימר שנשכח פתוח', description: stopwatchDescription, tone: 'weight' },
  ];

  const subtitle =
    activeReminders.length > 0 ? `${completedCount} מתוך ${activeReminders.length} הושלמו היום` : 'יום רגוע, בלי משימות';

  return (
    <div className="animate-fade-in">
      <header className="flex items-end justify-between mb-5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] text-muted tabular-nums">{subtitle}</span>
          <h1 className="text-[26px] font-medium tracking-tight">תזכורות</h1>
        </div>
        <button
          type="button"
          aria-label="הוספת תזכורת"
          title="הוספת תזכורת"
          onClick={() => setIsAdding(true)}
          className="w-12 h-12 rounded-full bg-primary-soft text-primary-ink flex items-center justify-center shrink-0 transition-transform active:scale-95"
        >
          <Plus className="w-[22px] h-[22px]" {...ICON_PROPS} />
        </button>
      </header>

      <div className="flex flex-col gap-7">
        {/* Daily routine */}
        <section className="flex flex-col gap-3">
          <SectionTitle aside="הקישו על תזכורת לעריכה או מחיקה">סדר היום</SectionTitle>
          <Card className="py-2">
            {sortedReminders.length === 0 ? (
              <p className="px-[18px] py-5 text-[15px] text-muted text-center">עוד אין תזכורות. אפשר להוסיף בכפתור הפלוס.</p>
            ) : (
              <ul className="flex flex-col">
                {sortedReminders.map((item, idx) => {
                  const done = item.enabled && item.lastCompletedDate === todayStr;
                  const look = CATEGORY_LOOK[item.category] || CATEGORY_LOOK.custom;
                  const Icon = look.Icon;
                  return (
                    <li
                      key={item.id}
                      className={cx('flex items-center gap-2 pe-2', idx > 0 && 'border-t border-line')}
                    >
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        aria-label={`עריכת ${item.title}`}
                        className={cx(
                          'flex-1 min-w-0 flex items-center gap-3 ps-[18px] py-3 text-start',
                          !item.enabled && 'opacity-50'
                        )}
                      >
                        <span className={cx('transition-opacity', done && 'opacity-60')}>
                          <IconBadge tone={look.tone}>
                            <Icon {...ICON_PROPS} />
                          </IconBadge>
                        </span>
                        <span className="flex-1 min-w-0 flex flex-col">
                          <span
                            className={cx(
                              'text-[15px] font-medium truncate',
                              done ? 'text-muted line-through decoration-faint' : 'text-ink'
                            )}
                          >
                            {item.title}
                          </span>
                          <span className="text-[13px] text-muted tabular-nums flex items-center gap-1.5">
                            {item.enabled ? (
                              item.time
                            ) : (
                              <>
                                <BellOff className="w-3.5 h-3.5" {...ICON_PROPS} />
                                מושהית
                              </>
                            )}
                            {item.enabled && item.description && (
                              <span className="truncate">· {item.description}</span>
                            )}
                          </span>
                        </span>
                      </button>
                      {item.enabled && (
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(item)}
                          aria-pressed={done}
                          aria-label={done ? `${item.title} סומנה, לביטול` : `סימון ${item.title} כבוצע`}
                          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                        >
                          <CheckCircle done={done} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </section>

        {/* Smart gentle alerts */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <SectionTitle>התראות עדינות</SectionTitle>
            <p className="px-1 text-[13px] text-muted">נזכיר לך בשקט, כדי שלא תצטרכו לזכור הכל לבד</p>
          </div>
          <Card className="py-2">
            <ul className="flex flex-col">
              {timerRows.map((row, idx) => {
                const value = smartTimers[row.key];
                const enabled = value > 0;
                const cfg = TIMER_OPTIONS[row.key];
                return (
                  <li key={row.key} className={cx(idx > 0 && 'border-t border-line')}>
                    <Toggle
                      checked={enabled}
                      onChange={on => setTimer(row.key, on ? cfg.defaultValue : 0)}
                      label={row.label}
                      description={<span className="tabular-nums">{row.description}</span>}
                    />
                    {enabled && (
                      <div className="flex gap-2 px-[18px] pb-3" role="group" aria-label={`תדירות עבור ${row.label}`}>
                        {cfg.options.map(opt => (
                          <Choice
                            key={opt}
                            selected={value === opt}
                            tone={row.tone}
                            onClick={() => setTimer(row.key, opt)}
                            className="flex-1 min-h-11 rounded-full tabular-nums"
                          >
                            {formatShortDuration(opt)}
                          </Choice>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

          {supported && notificationPermission !== 'granted' && (
            <Card className="p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <IconBadge tone="primary">
                  <Bell {...ICON_PROPS} />
                </IconBadge>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-medium text-ink">שנזכיר לך גם כשהאפליקציה סגורה?</span>
                  <span className="text-[13px] text-muted">
                    {notificationPermission === 'denied'
                      ? 'ההתראות חסומות כרגע בהגדרות הדפדפן. אפשר לאפשר אותן שם, ולחזור לכאן.'
                      : 'התראה קטנה ושקטה במסך, רק כשבאמת צריך.'}
                  </span>
                </div>
              </div>
              {notificationPermission !== 'denied' && (
                <Button onClick={handleEnableNotifications} block>
                  הפעלת התראות
                </Button>
              )}
            </Card>
          )}

          {supported && notificationPermission === 'granted' && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[13px] text-muted">ההתראות פועלות במכשיר הזה</span>
              <Button variant="ghost" size="md" onClick={handleTestNotification} className="px-3">
                <Bell {...ICON_PROPS} />
                בדיקת התראה
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* Add reminder */}
      <Sheet
        open={isAdding}
        onClose={() => setIsAdding(false)}
        title="תזכורת חדשה"
        icon={<Heart {...ICON_PROPS} />}
        footer={
          <Button type="submit" form="add-reminder-form" block disabled={!newTitle.trim()}>
            שמירה
          </Button>
        }
      >
        <form id="add-reminder-form" onSubmit={handleAdd} className="flex flex-col gap-4">
          <Field label="מה להזכיר">
            <input
              type="text"
              required
              autoFocus
              placeholder="למשל: תרופה, שאיבה, תור לטיפת חלב"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="באיזו שעה">
            <input
              type="time"
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
              className={cx(fieldClass, 'tabular-nums')}
            />
          </Field>
          <Field label="הערה קצרה (לא חובה)">
            <input
              type="text"
              placeholder="למשל: 5 טיפות לפני האוכל"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className={fieldClass}
            />
          </Field>
        </form>
      </Sheet>

      {/* Edit reminder */}
      <Sheet
        open={!!editingItem}
        onClose={closeEdit}
        title={editingItem?.title || ''}
        tone={editingItem ? (CATEGORY_LOOK[editingItem.category] || CATEGORY_LOOK.custom).tone : 'primary'}
        icon={
          editingItem
            ? React.createElement((CATEGORY_LOOK[editingItem.category] || CATEGORY_LOOK.custom).Icon, ICON_PROPS)
            : undefined
        }
        footer={
          <Button type="submit" form="edit-reminder-form" block disabled={!editTitle.trim()}>
            שמירה
          </Button>
        }
      >
        {editingItem && (
          <form id="edit-reminder-form" onSubmit={saveEdit} className="flex flex-col gap-4">
            <Field label="מה להזכיר">
              <input type="text" required value={editTitle} onChange={e => setEditTitle(e.target.value)} className={fieldClass} />
            </Field>
            <Field label="באיזו שעה">
              <input
                type="time"
                value={editTime}
                onChange={e => setEditTime(e.target.value)}
                className={cx(fieldClass, 'tabular-nums')}
              />
            </Field>
            <Field label="הערה קצרה (לא חובה)">
              <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} className={fieldClass} />
            </Field>

            <Card className="py-1 -mx-1">
              <Toggle
                checked={editingItem.enabled}
                onChange={v => setEnabled(editingItem.id, v)}
                label="תזכורת פעילה"
                description={editingItem.enabled ? 'מופיעה בסדר היום' : 'מושהית, אפשר להחזיר בכל רגע'}
              />
            </Card>

            {(confirmingDelete ? (
                <div className="flex flex-col gap-3 rounded-[24px] bg-danger-soft p-4">
                  <span className="text-[15px] text-ink">למחוק את התזכורת "{editingItem.title}"?</span>
                  <div className="flex gap-2">
                    <Button type="button" variant="danger" size="md" className="flex-1" onClick={deleteEditing}>
                      מחיקה
                    </Button>
                    <Button type="button" variant="soft" size="md" className="flex-1" onClick={() => setConfirmingDelete(false)}>
                      השארה
                    </Button>
                  </div>
                </div>
              ) : (
                <Button type="button" variant="danger" size="md" block onClick={() => setConfirmingDelete(true)}>
                  <Trash2 {...ICON_PROPS} />
                  מחיקת התזכורת
                </Button>
              ))}
          </form>
        )}
      </Sheet>
    </div>
  );
};
