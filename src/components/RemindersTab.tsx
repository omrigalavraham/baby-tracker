import React, { useState } from 'react';
import { BabyEvent, BabyProfile, DailyReminderItem, SmartTimersConfig } from '../types';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  Check, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2, 
  Sparkles, 
  Volume2, 
  AlertCircle,
  X,
  Timer,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission, 
  showAppNotification, 
  playGentleChime 
} from '../lib/notificationService';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface RemindersTabProps {
  profile: BabyProfile;
  events: BabyEvent[];
  activeSleep: BabyEvent | null;
  reminders: DailyReminderItem[];
  smartTimers: SmartTimersConfig;
  onUpdateReminders: (reminders: DailyReminderItem[]) => void;
  onUpdateSmartTimers: (timers: SmartTimersConfig) => void;
}

export const RemindersTab: React.FC<RemindersTabProps> = ({
  profile,
  events,
  activeSleep,
  reminders,
  smartTimers,
  onUpdateReminders,
  onUpdateSmartTimers
}) => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('12:00');
  const [newIcon, setNewIcon] = useState('⭐️');
  const [newDesc, setNewDesc] = useState('');
  const [itemToDelete, setItemToDelete] = useState<DailyReminderItem | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Calculate today's completion progress
  const activeReminders = reminders.filter(r => r.enabled);
  const completedCount = activeReminders.filter(r => r.lastCompletedDate === todayStr).length;
  const progressPercent = activeReminders.length > 0 
    ? Math.round((completedCount / activeReminders.length) * 100) 
    : 0;

  // Handle request permission
  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    if (granted) {
      showAppNotification('בייבי יומן 👶 | ההתראות הופעלו בהצלחה!', {
        body: 'מעכשיו תקבלי תזכורות בזמן אמת לוויטמינים, האכלות ושינה.',
        tag: 'welcome-test',
        playSound: true,
        cooldownMinutes: 0
      });
    }
  };

  const handleTestNotification = () => {
    showAppNotification('בדיקת התראה 🔔 | בייבי יומן', {
      body: 'התראות פועלות מעולה במכשיר זה! שתהיה צמיחה מהנה 👶✨',
      tag: 'test-' + Date.now(),
      playSound: true,
      cooldownMinutes: 0
    });
  };

  // Toggle completion
  const handleToggleComplete = (item: DailyReminderItem) => {
    const isDone = item.lastCompletedDate === todayStr;
    const newDate = isDone ? undefined : todayStr;

    if (!isDone) {
      // Trigger celebration
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
      playGentleChime();
    }

    const updated = reminders.map(r => 
      r.id === item.id ? { ...r, lastCompletedDate: newDate } : r
    );
    onUpdateReminders(updated);
  };

  // Toggle active/inactive
  const handleToggleEnabled = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = reminders.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    onUpdateReminders(updated);
  };

  // Add new reminder
  const handleAddNewReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: DailyReminderItem = {
      id: 'rem_' + Date.now(),
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      category: 'custom',
      icon: newIcon,
      time: newTime || '12:00',
      enabled: true
    };

    onUpdateReminders([...reminders, newItem]);
    setNewTitle('');
    setNewDesc('');
    setIsAddingNew(false);
  };

  // Delete reminder
  const confirmDelete = () => {
    if (!itemToDelete) return;
    onUpdateReminders(reminders.filter(r => r.id !== itemToDelete.id));
    setItemToDelete(null);
  };

  // Smart Feeding countdown
  const lastFeeding = events.find(e => e.type === 'feeding');
  let feedingStatusText = '';
  let feedingDueInMinutes: number | null = null;
  if (lastFeeding && smartTimers.feedingIntervalMinutes > 0) {
    const elapsedMinutes = Math.floor((Date.now() - new Date(lastFeeding.started_at).getTime()) / 60000);
    const diff = smartTimers.feedingIntervalMinutes - elapsedMinutes;
    feedingDueInMinutes = diff;

    if (diff > 0) {
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      feedingStatusText = hours > 0 ? `בעוד ${hours} שע' ו-${mins} דק'` : `בעוד ${mins} דקות`;
    } else {
      const lateMins = Math.abs(diff);
      feedingStatusText = `חלפו ${lateMins} דקות מהמועד המומלץ! 🍼`;
    }
  }

  // Smart Wake window countdown
  let wakeStatusText = '';
  if (activeSleep) {
    wakeStatusText = 'הקטנה ישנה כרגע 💤 (טיימר שינה פועל)';
  } else {
    // Find last ended sleep
    const lastEndedSleep = events.find(e => e.type === 'sleep' && e.ended_at);
    if (lastEndedSleep && smartTimers.wakeWindowMinutes > 0) {
      const awakeMinutes = Math.floor((Date.now() - new Date(lastEndedSleep.ended_at!).getTime()) / 60000);
      const remainingAwake = smartTimers.wakeWindowMinutes - awakeMinutes;
      if (remainingAwake > 0) {
        wakeStatusText = `ערה מזה ${awakeMinutes} דק' • נותרו כ-${remainingAwake} דק' עד השכבה`;
      } else {
        wakeStatusText = `ערה כבר ${awakeMinutes} דק' • מומלץ להשכיב למניעת עייפות יתר 😴`;
      }
    }
  }

  const iconOptions = ['☀️', '💧', '🛁', '🍼', '💊', '🩺', '🐢', '⭐️', '🧺', '🧸'];

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-3xl p-4 text-white shadow-md relative overflow-hidden">
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏰</span>
              <h2 className="text-lg font-black tracking-tight">תזכורות וסדר יום</h2>
            </div>
            <p className="text-xs text-rose-100 font-medium mt-1">
              מעקב משימות יומיות, ויטמינים והאכלות עבור {profile.name || 'הנסיכה'}
            </p>
          </div>

          {/* Progress Circle / Badge */}
          <div className="bg-white/20 backdrop-blur-md rounded-2xl px-3 py-2 text-center border border-white/25">
            <span className="text-xs font-bold block text-rose-100">היום בוצע</span>
            <span className="text-lg font-black">{completedCount}/{activeReminders.length}</span>
          </div>
        </div>

        {/* Mini Progress Bar */}
        <div className="mt-3 bg-black/15 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Notification Permission Card */}
      {notificationPermission !== 'granted' ? (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">הפעלת התראות לטלפון</h4>
              <p className="text-[11px] text-amber-700">קבלי תזכורת ישירות למסך הנעילה בגלקסי</p>
            </div>
          </div>
          <button
            onClick={handleEnableNotifications}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
          >
            הפעל התראות 🔔
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl px-3.5 py-2 flex items-center justify-between text-xs font-bold text-emerald-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>התראות פעילות במכשיר זה</span>
          </div>
          <button
            onClick={handleTestNotification}
            className="text-[11px] text-emerald-700 hover:text-emerald-900 bg-white/80 px-2 py-0.5 rounded-lg border border-emerald-300 active:scale-95 transition-transform flex items-center gap-1"
          >
            <Volume2 className="w-3 h-3" />
            <span>בדיקת צליל והתראה</span>
          </button>
        </div>
      )}

      {/* Section 1: Today's Daily Checklist */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-rose-500" />
            <h3 className="font-extrabold text-sm text-slate-800">צ׳קליסט יומי להיום</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">מתאפס כל לילה בחצות</span>
        </div>

        <div className="space-y-2">
          {reminders.map(item => {
            const isCompleted = item.lastCompletedDate === todayStr;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  !item.enabled
                    ? 'bg-slate-50/60 border-slate-200 opacity-60'
                    : isCompleted
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-2xs'
                    : 'bg-white border-rose-100 hover:border-rose-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  
                  {/* Left/Right Icon & Content */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl shrink-0 p-1 bg-white rounded-xl shadow-2xs border border-slate-100">
                      {item.icon}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-extrabold truncate ${
                          isCompleted ? 'text-emerald-900 line-through decoration-emerald-500/60' : 'text-slate-800'
                        }`}>
                          {item.title}
                        </h4>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {item.time}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions / Toggle Complete Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.enabled && (
                      <button
                        onClick={() => handleToggleComplete(item)}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 shadow-xs ${
                          isCompleted
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-rose-200'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>בוצע! ✅</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 opacity-80" />
                            <span>סמן כבוצע</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Quick options menu / toggle enabled */}
                    <button
                      onClick={(e) => handleToggleEnabled(item.id, e)}
                      title={item.enabled ? 'השבת תזכורת' : 'הפעל תזכורת'}
                      className={`p-2 rounded-xl border transition-colors ${
                        item.enabled 
                          ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-slate-200' 
                          : 'text-rose-500 bg-rose-50 border-rose-200 font-bold text-[10px]'
                      }`}
                    >
                      {item.enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                    </button>

                    {item.category === 'custom' && (
                      <button
                        onClick={() => setItemToDelete(item)}
                        title="מחק תזכורת זו"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add custom reminder trigger button */}
        {!isAddingNew ? (
          <button
            onClick={() => setIsAddingNew(true)}
            className="w-full py-2.5 rounded-2xl border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/40 hover:bg-rose-50 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>הוספת משימה או תזכורת יומית חדשה (+)</span>
          </button>
        ) : (
          <form 
            onSubmit={handleAddNewReminder}
            className="bg-white p-4 rounded-3xl border border-rose-200 shadow-md space-y-3 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-rose-100 pb-2">
              <h4 className="font-extrabold text-xs text-rose-700">תזכורת מותאמת אישית חדשה</h4>
              <button 
                type="button" 
                onClick={() => setIsAddingNew(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">שם התזכורת</label>
              <input
                type="text"
                required
                placeholder="למשל: תרופה, שאיבת חלב, תור לטיפת חלב..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-rose-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">שעת התראה</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-rose-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">אייקון</label>
                <div className="flex items-center gap-1 overflow-x-auto py-1">
                  {iconOptions.slice(0, 5).map(ico => (
                    <button
                      type="button"
                      key={ico}
                      onClick={() => setNewIcon(ico)}
                      className={`text-base p-1.5 rounded-lg border ${
                        newIcon === ico ? 'bg-rose-100 border-rose-400' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {ico}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">הערה / הנחיה קצרה (אופציונלי)</label>
              <input
                type="text"
                placeholder="למשל: 5 טיפות לפני האוכל"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-rose-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                שמור תזכורת
              </button>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
              >
                ביטול
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Section 2: Smart Dynamic Timers */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-indigo-500" />
            <h3 className="font-extrabold text-sm text-slate-800">טיימרים חכמים דינמיים</h3>
          </div>
          <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">חי אוטומטי</span>
        </div>

        {/* Feeding Smart Timer Card */}
        <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍼</span>
              <div>
                <h4 className="text-xs font-bold text-slate-800">תזכורת האכלה אוטומטית</h4>
                <p className="text-[10px] text-slate-500">
                  {lastFeeding 
                    ? `האכלה אחרונה: ${new Date(lastFeeding.started_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}` 
                    : 'טרם נרשמה האכלה היום'}
                </p>
              </div>
            </div>

            {feedingStatusText && (
              <span className={`text-[10px] font-extrabold px-2 py-1 rounded-lg ${
                feedingDueInMinutes !== null && feedingDueInMinutes <= 0
                  ? 'bg-rose-100 text-rose-700 animate-pulse'
                  : 'bg-indigo-50 text-indigo-700'
              }`}>
                {feedingStatusText}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-50">
            <span className="text-slate-600 font-medium">הזכר לי כל:</span>
            <div className="flex items-center gap-1">
              {[
                { label: '2.5 שע׳', value: 150 },
                { label: '3 שע׳', value: 180 },
                { label: '3.5 שע׳', value: 210 },
                { label: 'כבוי', value: 0 }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdateSmartTimers({ ...smartTimers, feedingIntervalMinutes: opt.value })}
                  className={`px-2 py-1 rounded-lg font-bold transition-all text-[10px] ${
                    smartTimers.feedingIntervalMinutes === opt.value
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Wake Window Smart Timer Card */}
        <div className="bg-white p-3.5 rounded-2xl border border-purple-100 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">😴</span>
              <div>
                <h4 className="text-xs font-bold text-slate-800">חלון ערות ומניעת עייפות יתר</h4>
                <p className="text-[10px] text-slate-500">
                  {wakeStatusText || 'מעקב חלון שינה פועל ברקע'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-50">
            <span className="text-slate-600 font-medium">הגבלת חלון ערות:</span>
            <div className="flex items-center gap-1">
              {[
                { label: '60 דק׳', value: 60 },
                { label: '75 דק׳', value: 75 },
                { label: '90 דק׳', value: 90 },
                { label: 'כבוי', value: 0 }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdateSmartTimers({ ...smartTimers, wakeWindowMinutes: opt.value })}
                  className={`px-2 py-1 rounded-lg font-bold transition-all text-[10px] ${
                    smartTimers.wakeWindowMinutes === opt.value
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stopwatch Reminder Card */}
        <div className="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">⏱️</span>
              <div>
                <h4 className="text-xs font-bold text-slate-800">התראת סטופר שנשכח</h4>
                <p className="text-[10px] text-slate-500">
                  תזכורת אם טיימר שינה או הנקה רץ מעבר לזמן הרגיל
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-50">
            <span className="text-slate-600 font-medium">התראה לאחר:</span>
            <div className="flex items-center gap-1">
              {[
                { label: '45 דק׳', value: 45 },
                { label: '60 דק׳', value: 60 },
                { label: '90 דק׳', value: 90 },
                { label: 'כבוי', value: 0 }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdateSmartTimers({ ...smartTimers, stopwatchAlertMinutes: opt.value })}
                  className={`px-2 py-1 rounded-lg font-bold transition-all text-[10px] ${
                    smartTimers.stopwatchAlertMinutes === opt.value
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Delete Item Modal */}
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="מחיקת תזכורת"
        description={`האם את בטוחה שברצונך למחוק את התזכורת "${itemToDelete?.title}"?`}
      />

    </div>
  );
};
