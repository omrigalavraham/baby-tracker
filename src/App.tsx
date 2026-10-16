import React, { useState, useEffect, useCallback } from 'react';
import { BabyEvent, BabyProfile, DailyReminderItem, SmartTimersConfig } from './types';
import { 
  loadLocalProfile, 
  saveLocalProfile, 
  loadLocalEvents, 
  saveLocalEvents, 
  loadCompletedMilestones, 
  saveCompletedMilestones,
  getFamilyCodeFromUrl,
  loadLocalReminders,
  saveLocalReminders,
  loadSmartTimersConfig,
  saveSmartTimersConfig
} from './lib/storage';
import { 
  isSupabaseConfigured, 
  fetchBabyFromSupabase, 
  saveBabyToSupabase, 
  fetchEventsFromSupabase, 
  addEventToSupabase, 
  deleteEventFromSupabase,
  subscribeToRealtimeEvents,
  subscribeToRealtimeBaby
} from './lib/supabase';

// Components
import { AppHeader } from './components/home/AppHeader';
import { NowCard } from './components/home/NowCard';
import { ReminderStrip } from './components/home/ReminderStrip';
import { ActivityTiles } from './components/home/ActivityTiles';
import { BottomNav, MainTab } from './components/home/BottomNav';
import { SettingsSheet } from './components/home/SettingsSheet';
import { HistoryTab } from './components/HistoryTab';
import { MilestonesTab } from './components/MilestonesTab';
import { RemindersTab } from './components/RemindersTab';
import { FeedingModal } from './components/FeedingModal';
import { DiaperModal } from './components/DiaperModal';
import { SleepModal } from './components/SleepModal';
import { WeightModal } from './components/WeightModal';
import { BabyProfileModal } from './components/BabyProfileModal';
import { SyncSettingsModal } from './components/SyncSettingsModal';
import { ExportDataModal } from './components/ExportDataModal';
import { SootheSheet } from './components/SootheSheet';
import { SplashScreen } from './components/SplashScreen';
import { LoggedToast, ToastData } from './components/home/LoggedToast';
import { haptic } from './components/ui';

import { showAppNotification } from './lib/notificationService';
import { ensurePushSubscription, isPushActive, syncFamilySettings } from './lib/pushService';
import { localDateKey } from './lib/babyUtils';
import { ThemeMode, loadThemeMode, saveThemeMode, useNightMode } from './lib/theme';
import { applyUpdate, useAppUpdate } from './lib/appUpdate';
import { Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const stagger = (i: number) => ({ '--d': `${60 + i * 90}ms` }) as React.CSSProperties;

function sleepLength(minutes: number) {
  if (minutes < 60) return `${minutes} דק'`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hours = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : `${h} שעות`;
  return m ? `${hours} ו-${m} דק'` : hours;
}

function loggedText(e: BabyEvent): string {
  const d = e.details || {};
  switch (e.type) {
    case 'feeding':
      if (d.feedType === 'bottle') return d.bottleAmountMl ? `בקבוק ${d.bottleAmountMl} מ"ל נרשם` : 'בקבוק נרשם';
      if (d.feedType === 'solids') return 'ארוחת מוצקים נרשמה';
      return 'הנקה נרשמה';
    case 'sleep':
      return d.isOngoing ? 'התחלנו לספור. שינה נעימה' : 'שינה נרשמה';
    case 'diaper':
      return d.diaperType === 'pee' ? 'חיתול נרשם · פיפי' : d.diaperType === 'poop' ? 'חיתול נרשם · קקי' : 'חיתול נרשם';
    case 'height':
      return d.heightCm ? `גובה ${d.heightCm} ס"מ נרשם` : 'גובה נרשם';
    case 'weight':
      return d.weightKg ? `משקל ${d.weightKg} ק"ג נרשם` : 'משקל נרשם';
    default:
      return 'נרשם';
  }
}

export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [profile, setProfile] = useState<BabyProfile>(loadLocalProfile);
  const [events, setEvents] = useState<BabyEvent[]>(loadLocalEvents);
  const [completedMilestones, setCompletedMilestones] = useState<string[]>(loadCompletedMilestones);
  const [reminders, setReminders] = useState<DailyReminderItem[]>(loadLocalReminders);
  const [smartTimers, setSmartTimers] = useState<SmartTimersConfig>(loadSmartTimersConfig);
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [mainTab, setMainTab] = useState<MainTab>('today');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(loadThemeMode);
  const isNight = useNightMode(themeMode);
  const updateReady = useAppUpdate();

  const handleChangeTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveThemeMode(mode);
  };

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Modals
  const [feedingModalOpen, setFeedingModalOpen] = useState(false);
  const [diaperModalOpen, setDiaperModalOpen] = useState(false);
  const [sootheOpen, setSootheOpen] = useState(false);
  const [sleepModalOpen, setSleepModalOpen] = useState(false);
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Splash dissolves into the app; the app content rises in underneath
  const [appReady, setAppReady] = useState(false);

  // Gentle confirmation after logging, with undo
  const [toast, setToast] = useState<ToastData | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const showToast = (t: Omit<ToastData, 'key'>) => {
    haptic();
    setToast({ ...t, key: Date.now() });
  };

  // Catch PWA beforeinstallprompt for Galaxy / Chrome install
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('להתקנת האפליקציה בגלקסי: לחצו על 3 הנקודות בדפדפן ובחרו "הוספה למסך הבית" או "התקן אפליקציה".');
    }
  };

  // Check URL family code override
  useEffect(() => {
    const urlCode = getFamilyCodeFromUrl();
    if (urlCode && urlCode !== profile.id) {
      const updated = { ...profile, id: urlCode };
      setProfile(updated);
      saveLocalProfile(updated);
    }
  }, []);

  // Supabase Initial Sync & Realtime Subscription
  useEffect(() => {
    let channel: any = null;
    let babyChannel: any = null;
    let cancelled = false;

    async function initSupabase() {
      if (!isSupabaseConfigured()) {
        setIsSynced(false);
        return;
      }

      setIsSynced(true);

      // 1. Fetch or sync baby profile
      const remoteBaby = await fetchBabyFromSupabase(profile.id);
      if (remoteBaby) {
        setProfile(remoteBaby);
        saveLocalProfile(remoteBaby);
      } else {
        await saveBabyToSupabase(profile);
      }

      // 2. Fetch remote events
      const remoteEvents = await fetchEventsFromSupabase(profile.id);
      if (remoteEvents && remoteEvents.length > 0) {
        setEvents(remoteEvents);
        saveLocalEvents(remoteEvents);
      } else if (events.length > 0) {
        // Upload initial local events
        for (const ev of events) {
          await addEventToSupabase(ev);
        }
      }

      if (cancelled) return;

      // Profile edits (name, birth date, birth weight) from the other phone
      babyChannel = subscribeToRealtimeBaby(profile.id, remote => {
        setProfile(prev => {
          const merged = { ...prev, ...remote };
          saveLocalProfile(merged);
          return merged;
        });
      });

      // 3. Realtime subscription: When Dad updates something, Mom sees it instantly!
      channel = subscribeToRealtimeEvents(profile.id, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newEvent = payload.new as BabyEvent;
          setEvents(prev => {
            if (prev.some(e => e.id === newEvent.id)) return prev;
            const updated = [newEvent, ...prev];
            saveLocalEvents(updated);
            return updated;
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedEvent = payload.new as BabyEvent;
          setEvents(prev => {
            const updated = prev.map(e => e.id === updatedEvent.id ? updatedEvent : e);
            saveLocalEvents(updated);
            return updated;
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setEvents(prev => {
              const updated = prev.filter(e => e.id !== deletedId);
              saveLocalEvents(updated);
              return updated;
            });
          }
        }
      });
    }

    initSupabase();

    return () => {
      cancelled = true;
      channel?.unsubscribe();
      babyChannel?.unsubscribe();
    };
  }, [profile.id]);

  // Android drops the live connection while the app is in the background,
  // so catch up with the other phone whenever the app comes back.
  useEffect(() => {
    if (!isSynced) return;
    let last = 0;
    const refresh = async () => {
      if (document.visibilityState !== 'visible' || Date.now() - last < 5000) return;
      last = Date.now();

      const remoteBaby = await fetchBabyFromSupabase(profile.id);
      if (remoteBaby) {
        setProfile(prev => {
          const merged = { ...prev, ...remoteBaby };
          saveLocalProfile(merged);
          return merged;
        });
      }

      const remoteEvents = await fetchEventsFromSupabase(profile.id);
      if (remoteEvents.length > 0) {
        setEvents(prev => {
          // Server is the truth; keep only very recent local entries that may still be uploading
          const remoteIds = new Set(remoteEvents.map(e => e.id));
          const pending = prev.filter(e => !remoteIds.has(e.id) && Date.now() - new Date(e.created_at).getTime() < 2 * 60000);
          const merged = [...pending, ...remoteEvents].sort(
            (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
          );
          saveLocalEvents(merged);
          return merged;
        });
      }
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('online', refresh);
    window.addEventListener('focus', refresh);
    // The live connection can also die silently while the app stays open on screen,
    // so check the server every half minute as a safety net (only while visible)
    const poll = setInterval(refresh, 30000);
    return () => {
      clearInterval(poll);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('online', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [isSynced, profile.id]);

  // Save new event helper
  const handleSaveEvent = useCallback((eventData: Partial<BabyEvent>) => {
    const newEvent: BabyEvent = {
      id: crypto.randomUUID ? crypto.randomUUID() : `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      baby_id: profile.id,
      type: eventData.type || 'feeding',
      details: eventData.details || {},
      started_at: eventData.started_at || new Date().toISOString(),
      ended_at: eventData.ended_at,
      notes: eventData.notes,
      created_by: 'הורה',
      created_at: new Date().toISOString()
    };

    setEvents(prev => {
      const updated = [newEvent, ...prev];
      saveLocalEvents(updated);
      return updated;
    });

    if (isSupabaseConfigured()) {
      addEventToSupabase(newEvent);
    }

    haptic();
    setToast({ key: Date.now(), type: newEvent.type, text: loggedText(newEvent), undoId: newEvent.id });
  }, [profile.id]);

  // Delete event helper
  const handleDeleteEvent = useCallback((id: string) => {
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveLocalEvents(updated);
      return updated;
    });

    if (isSupabaseConfigured()) {
      deleteEventFromSupabase(id);
    }
  }, []);

  // Active ongoing sleep check
  const activeSleep = events.find(e => e.type === 'sleep' && e.details?.isOngoing);

  const handleToggleSleepQuick = () => {
    if (activeSleep) {
      // Wake up!
      const start = new Date(activeSleep.started_at).getTime();
      const now = Date.now();
      const durationMinutes = Math.max(1, Math.round((now - start) / 60000));
      
      const updatedSleep: BabyEvent = {
        ...activeSleep,
        ended_at: new Date().toISOString(),
        details: {
          ...activeSleep.details,
          isOngoing: false,
          durationMinutes
        }
      };

      setEvents(prev => {
        const updated = prev.map(e => e.id === activeSleep.id ? updatedSleep : e);
        saveLocalEvents(updated);
        return updated;
      });

      if (isSupabaseConfigured()) {
        addEventToSupabase(updatedSleep);
      }
      showToast({ type: 'wake', text: `התעוררה אחרי ${sleepLength(durationMinutes)}` });
    } else {
      // Start sleep!
      handleSaveEvent({
        type: 'sleep',
        started_at: new Date().toISOString(),
        details: { isOngoing: true }
      });
    }
  };

  const handleEndSleepEvent = (eventId: string, endedAt: string, durationMinutes: number) => {
    setEvents(prev => {
      const updated = prev.map(e => {
        if (e.id === eventId) {
          const updatedEvent: BabyEvent = {
            ...e,
            ended_at: endedAt,
            details: { ...e.details, isOngoing: false, durationMinutes }
          };
          if (isSupabaseConfigured()) addEventToSupabase(updatedEvent);
          return updatedEvent;
        }
        return e;
      });
      saveLocalEvents(updated);
      return updated;
    });
    showToast({ type: 'wake', text: `התעוררה אחרי ${sleepLength(durationMinutes)}` });
  };

  // Milestones toggle
  const handleToggleMilestone = (id: string) => {
    setCompletedMilestones(prev => {
      const next = prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id];
      saveCompletedMilestones(next);
      return next;
    });
  };

  // Profile update
  const handleSaveProfile = (updatedProfile: BabyProfile) => {
    setProfile(updatedProfile);
    saveLocalProfile(updatedProfile);
    if (isSupabaseConfigured()) {
      saveBabyToSupabase(updatedProfile);
    }
  };

  const handleUpdateFamilyCode = (newCode: string) => {
    const updated = { ...profile, id: newCode };
    setProfile(updated);
    saveLocalProfile(updated);
    // Reload events for new code
    if (isSupabaseConfigured()) {
      fetchEventsFromSupabase(newCode).then(evs => {
        setEvents(evs);
        saveLocalEvents(evs);
      });
    }
  };

  // Reminders handlers
  const handleUpdateReminders = (updated: DailyReminderItem[]) => {
    setReminders(updated);
    saveLocalReminders(updated);
  };

  const handleUpdateSmartTimers = (updated: SmartTimersConfig) => {
    setSmartTimers(updated);
    saveSmartTimersConfig(updated);
  };

  const todayStr = localDateKey();
  const pendingDailyReminders = reminders.filter(r => r.enabled && r.lastCompletedDate !== todayStr);

  const handleToggleReminderComplete = (item: DailyReminderItem) => {
    const isDone = item.lastCompletedDate === todayStr;
    const newDate = isDone ? undefined : todayStr;
    if (!isDone) {
      confetti({
        particleCount: 24,
        spread: 50,
        startVelocity: 22,
        gravity: 0.6,
        scalar: 0.8,
        colors: ['#F8E4E1', '#ECE6F5', '#E3EEE6', '#F4EBDD', '#B9A9DA'],
        origin: { y: 0.5 }
      });
      haptic(14);
    }
    const updated = reminders.map(r => r.id === item.id ? { ...r, lastCompletedDate: newDate } : r);
    handleUpdateReminders(updated);
  };

  // Mirror reminder settings to the server so it can notify while the app is closed
  useEffect(() => {
    if (!isSynced) return;
    const t = setTimeout(() => syncFamilySettings(profile.id, reminders, smartTimers), 1200);
    return () => clearTimeout(t);
  }, [isSynced, profile.id, reminders, smartTimers]);

  // Register this phone for push once notifications are allowed (also right after the user allows them)
  useEffect(() => {
    if (!isSynced) return;
    ensurePushSubscription(profile.id);
    let status: PermissionStatus | null = null;
    const onChange = () => ensurePushSubscription(profile.id);
    navigator.permissions
      ?.query({ name: 'notifications' as PermissionName })
      .then(s => {
        status = s;
        s.addEventListener('change', onChange);
      })
      .catch(() => {});
    return () => status?.removeEventListener('change', onChange);
  }, [isSynced, profile.id]);

  // In-app timer for alerts & reminders (every 30s). Used only when server push isn't set up,
  // otherwise the server sends them and we'd notify twice.
  useEffect(() => {
    if (!smartTimers.notificationsEnabled) return;

    const checkAlerts = () => {
      if (isPushActive()) return;

      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;
      const currentDay = localDateKey(now);

      // 1. Check daily reminders scheduled for now
      reminders.forEach(rem => {
        if (rem.enabled && rem.time === currentTimeStr && rem.lastCompletedDate !== currentDay) {
          showAppNotification(`תזכורת יומית: ${rem.title} ⏰`, {
            body: rem.description || `הגיע הזמן לביצוע ${rem.title}!`,
            tag: `daily-${rem.id}-${currentDay}`,
            cooldownMinutes: 30
          });
        }
      });

      // 2. Check feeding interval
      if (smartTimers.feedingIntervalMinutes > 0) {
        const lastFeed = events.find(e => e.type === 'feeding');
        if (lastFeed) {
          const elapsedMinutes = Math.floor((Date.now() - new Date(lastFeed.started_at).getTime()) / 60000);
          if (elapsedMinutes >= smartTimers.feedingIntervalMinutes) {
            const hours = Math.floor(smartTimers.feedingIntervalMinutes / 60);
            const timeDesc = hours > 0 ? `${hours} שעות` : `${smartTimers.feedingIntervalMinutes} דקות`;
            showAppNotification('הגיע זמן האכלה 🍼', {
              body: `עברו ${timeDesc} מאז ההאכלה האחרונה. האם היא רעבה?`,
              tag: 'feeding-interval',
              cooldownMinutes: 30
            });
          }
        }
      }

      // 3. Check wake window (if baby is awake)
      if (!activeSleep && smartTimers.wakeWindowMinutes > 0) {
        const lastEndedSleep = events.find(e => e.type === 'sleep' && e.ended_at);
        if (lastEndedSleep) {
          const awakeMinutes = Math.floor((Date.now() - new Date(lastEndedSleep.ended_at!).getTime()) / 60000);
          if (awakeMinutes >= smartTimers.wakeWindowMinutes) {
            showAppNotification('מתקרב חלון שינה 😴', {
              body: `הקטנה ערה כבר ${awakeMinutes} דקות. כדאי להתחיל להרדים כדי למנוע עייפות יתר.`,
              tag: 'wake-window',
              cooldownMinutes: 30
            });
          }
        }
      }

      // 4. Check active stopwatch alert
      if (activeSleep && smartTimers.stopwatchAlertMinutes > 0) {
        const sleepMinutes = Math.floor((Date.now() - new Date(activeSleep.started_at).getTime()) / 60000);
        if (sleepMinutes >= smartTimers.stopwatchAlertMinutes) {
          showAppNotification('טיימר שינה פועל 💤', {
            body: `השינה נמשכת כבר מעל ${Math.floor(sleepMinutes / 60)} שעות. האם הקטנה כבר התעוררה?`,
            tag: 'sleep-stopwatch',
            cooldownMinutes: 45
          });
        }
      }
    };

    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [reminders, smartTimers, events, activeSleep]);

  return (
    <div className="min-h-dvh bg-ground text-ink">
      {showSplash && (
        <SplashScreen babyName={profile.name} onReveal={() => setAppReady(true)} onFinish={() => setShowSplash(false)} />
      )}

      {appReady && (
      <main key={mainTab} className="max-w-md mx-auto px-[22px] pt-8 pb-32 safe-top">
        {mainTab === 'today' && (
          <div className="flex flex-col gap-5">
            <div className="rise-in" style={stagger(0)}>
              <AppHeader
                profile={profile}
                isSleeping={!!activeSleep}
                isNight={isNight}
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenProfile={() => setProfileModalOpen(true)}
              />
            </div>
            <div className="rise-in" style={stagger(1)}>
              <NowCard events={events} activeSleep={activeSleep} smartTimers={smartTimers} onToggleSleep={handleToggleSleepQuick} />
            </div>
            {!isNight && pendingDailyReminders.length > 0 && (
              <div className="rise-in" style={stagger(2)}>
                <ReminderStrip
                  pending={pendingDailyReminders}
                  onComplete={handleToggleReminderComplete}
                  onOpenAll={() => setMainTab('reminders')}
                />
              </div>
            )}
            <div className="rise-in" style={stagger(3)}>
              <ActivityTiles
                events={events}
                profile={profile}
                isSleeping={!!activeSleep}
                justLogged={toast && toast.type !== 'wake' ? { type: toast.type, key: toast.key } : null}
                onOpenFeeding={() => setFeedingModalOpen(true)}
                onOpenDiaper={() => setDiaperModalOpen(true)}
                onOpenSleep={() => setSleepModalOpen(true)}
                onOpenWeight={() => setWeightModalOpen(true)}
                onOpenSoothe={() => setSootheOpen(true)}
              />
            </div>
          </div>
        )}

        {mainTab === 'history' && (
          <div className="animate-view-in">
          <HistoryTab
            events={events}
            profile={profile}
            onDeleteEvent={handleDeleteEvent}
            onOpenFeeding={() => setFeedingModalOpen(true)}
            onOpenSleep={() => setSleepModalOpen(true)}
          />
          </div>
        )}

        {mainTab === 'reminders' && (
          <div className="animate-view-in">
          <RemindersTab
            profile={profile}
            events={events}
            activeSleep={activeSleep || null}
            reminders={reminders}
            smartTimers={smartTimers}
            onUpdateReminders={handleUpdateReminders}
            onUpdateSmartTimers={handleUpdateSmartTimers}
          />
          </div>
        )}

        {mainTab === 'growth' && (
          <div className="animate-view-in">
          <MilestonesTab
            profile={profile}
            completedMilestones={completedMilestones}
            onToggleMilestone={handleToggleMilestone}
          />
          </div>
        )}
      </main>
      )}

      <LoggedToast toast={toast} onUndo={handleDeleteEvent} onDone={clearToast} />

      {/* A new version went live while the app was open */}
      {updateReady && (
        <div className="fixed inset-x-0 top-0 z-40 px-[22px] pt-[max(12px,env(safe-area-inset-top))] pointer-events-none">
          <div className="max-w-md mx-auto flex items-center gap-3 ps-4 pe-1.5 py-1.5 rounded-full bg-surface shadow-float pointer-events-auto animate-toast-in">
            <Sparkles className="w-5 h-5 text-primary-ink shrink-0" strokeWidth={1.6} />
            <span className="flex-1 text-[15px] text-ink">יש גרסה חדשה של האפליקציה</span>
            <button onClick={applyUpdate} className="h-10 px-4 rounded-full bg-primary-soft text-primary-ink text-[14px] font-medium shrink-0">
              עדכון
            </button>
          </div>
        </div>
      )}

      {appReady && <BottomNav value={mainTab} onChange={setMainTab} pendingReminders={pendingDailyReminders.length} />}

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        isSynced={isSynced}
        themeMode={themeMode}
        onChangeTheme={handleChangeTheme}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenSync={() => setSyncModalOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
        onReplaySplash={() => setShowSplash(true)}
        canInstall={!!deferredPrompt}
        onInstallApp={handleInstallApp}
      />

      <SootheSheet open={sootheOpen} onClose={() => setSootheOpen(false)} />

      <FeedingModal
        isOpen={feedingModalOpen}
        onClose={() => setFeedingModalOpen(false)}
        onSaveEvent={handleSaveEvent}
      />

      <DiaperModal
        isOpen={diaperModalOpen}
        onClose={() => setDiaperModalOpen(false)}
        onSaveEvent={handleSaveEvent}
      />

      <SleepModal
        isOpen={sleepModalOpen}
        onClose={() => setSleepModalOpen(false)}
        onSaveEvent={handleSaveEvent}
        activeSleepEvent={activeSleep}
        onEndSleepEvent={handleEndSleepEvent}
      />

      <WeightModal
        isOpen={weightModalOpen}
        onClose={() => setWeightModalOpen(false)}
        onSaveEvent={handleSaveEvent}
        events={events}
        profile={profile}
        onDeleteEvent={handleDeleteEvent}
      />

      <BabyProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
      />

      <SyncSettingsModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        profile={profile}
        onUpdateFamilyCode={handleUpdateFamilyCode}
      />

      <ExportDataModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        events={events}
        profile={profile}
      />
    </div>
  );
}

export default App;
