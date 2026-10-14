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
  subscribeToRealtimeEvents
} from './lib/supabase';

// Components
import { Navbar } from './components/Navbar';
import { StatusCards } from './components/StatusCards';
import { QuickActions } from './components/QuickActions';
import { TimelineList } from './components/TimelineList';
import { MilestonesTab } from './components/MilestonesTab';
import { RemindersTab } from './components/RemindersTab';
import { FeedingModal } from './components/FeedingModal';
import { DiaperModal } from './components/DiaperModal';
import { SleepModal } from './components/SleepModal';
import { WeightModal } from './components/WeightModal';
import { BabyProfileModal } from './components/BabyProfileModal';
import { SyncSettingsModal } from './components/SyncSettingsModal';
import { ExportDataModal } from './components/ExportDataModal';
import { SplashScreen } from './components/SplashScreen';
import { SummaryTab } from './components/SummaryTab';
import { InsightsTab } from './components/InsightsTab';

import { showAppNotification, playGentleChime } from './lib/notificationService';
import confetti from 'canvas-confetti';
import { Activity, Sparkles, BarChart3, Lightbulb, Bell } from 'lucide-react';

export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [profile, setProfile] = useState<BabyProfile>(loadLocalProfile);
  const [events, setEvents] = useState<BabyEvent[]>(loadLocalEvents);
  const [completedMilestones, setCompletedMilestones] = useState<string[]>(loadCompletedMilestones);
  const [reminders, setReminders] = useState<DailyReminderItem[]>(loadLocalReminders);
  const [smartTimers, setSmartTimers] = useState<SmartTimersConfig>(loadSmartTimersConfig);
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [mainTab, setMainTab] = useState<'tracker' | 'reminders' | 'summary' | 'insights' | 'milestones'>('tracker');

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Modals
  const [feedingModalOpen, setFeedingModalOpen] = useState(false);
  const [diaperModalOpen, setDiaperModalOpen] = useState(false);
  const [sleepModalOpen, setSleepModalOpen] = useState(false);
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

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
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [profile.id]);

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

  // Quick 1-tap Diaper Logging
  const handleQuickDiaperPee = () => {
    handleSaveEvent({
      type: 'diaper',
      started_at: new Date().toISOString(),
      details: { diaperType: 'pee' }
    });
  };

  const handleQuickDiaperPoop = (color?: string) => {
    handleSaveEvent({
      type: 'diaper',
      started_at: new Date().toISOString(),
      details: { diaperType: 'poop', poopColor: color }
    });
  };

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

  const todayStr = new Date().toISOString().slice(0, 10);
  const pendingDailyReminders = reminders.filter(r => r.enabled && r.lastCompletedDate !== todayStr);

  const handleToggleReminderComplete = (item: DailyReminderItem) => {
    const isDone = item.lastCompletedDate === todayStr;
    const newDate = isDone ? undefined : todayStr;
    if (!isDone) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 }
      });
      playGentleChime();
    }
    const updated = reminders.map(r => r.id === item.id ? { ...r, lastCompletedDate: newDate } : r);
    handleUpdateReminders(updated);
  };

  // Background timer for alerts & reminders (every 30s)
  useEffect(() => {
    if (!smartTimers.notificationsEnabled) return;

    const checkAlerts = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;
      const currentDay = now.toISOString().slice(0, 10);

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
    <div className="min-h-screen bg-rose-50/40 pb-24 text-slate-800">
      
      {/* Top Navbar */}
      <Navbar
        profile={profile}
        isSynced={isSynced}
        isSleeping={!!activeSleep}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenSync={() => setSyncModalOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
        onReplaySplash={() => setShowSplash(true)}
        installPrompt={deferredPrompt}
        onInstallApp={handleInstallApp}
      />

      {/* Animated Opening Splash Screen */}
      {showSplash && (
        <SplashScreen
          babyName={profile.name}
          onFinish={() => setShowSplash(false)}
        />
      )}

      {/* Main View: Tracker, Reminders, Summary, Insights, or Milestones */}
      {mainTab === 'tracker' && (
        <main className="space-y-3 pt-2">

          {/* Gentle Daily Reminder Banner in Tracker View */}
          {pendingDailyReminders.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-rose-200/70 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xl shrink-0">{pendingDailyReminders[0].icon}</span>
                <div className="truncate flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    תזכורת: {pendingDailyReminders[0].title}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {pendingDailyReminders.length > 1 ? `ועוד ${pendingDailyReminders.length - 1} משימות להיום` : 'טרם סומן כבוצע להיום'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleToggleReminderComplete(pendingDailyReminders[0])}
                  className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-xs"
                >
                  סמן כבוצע ✅
                </button>
                <button
                  onClick={() => setMainTab('reminders')}
                  className="text-[10px] text-rose-600 font-bold px-2 py-1.5 rounded-xl hover:bg-rose-100/60"
                >
                  הכל ➔
                </button>
              </div>
            </div>
          )}

          {/* Quick status cards (Last feeding, last diaper, sleep) */}
          <StatusCards
            events={events}
            profile={profile}
            onOpenFeeding={() => setFeedingModalOpen(true)}
            onOpenDiaper={() => setDiaperModalOpen(true)}
            onOpenSleep={() => setSleepModalOpen(true)}
            onOpenWeight={() => setWeightModalOpen(true)}
          />

          {/* Quick 1-tap Actions Bar */}
          <QuickActions
            onOpenFeeding={() => setFeedingModalOpen(true)}
            onQuickDiaperPee={handleQuickDiaperPee}
            onQuickDiaperPoopWithColor={handleQuickDiaperPoop}
            onOpenDiaperFull={() => setDiaperModalOpen(true)}
            onOpenSleep={() => setSleepModalOpen(true)}
            onOpenWeight={() => setWeightModalOpen(true)}
            isSleeping={!!activeSleep}
            onToggleSleepQuick={handleToggleSleepQuick}
          />

          {/* Timeline Feed */}
          <TimelineList
            events={events}
            onDeleteEvent={handleDeleteEvent}
          />
        </main>
      )}

      {mainTab === 'reminders' && (
        <main className="pt-2">
          <RemindersTab
            profile={profile}
            events={events}
            activeSleep={activeSleep || null}
            reminders={reminders}
            smartTimers={smartTimers}
            onUpdateReminders={handleUpdateReminders}
            onUpdateSmartTimers={handleUpdateSmartTimers}
          />
        </main>
      )}

      {mainTab === 'summary' && (
        <main className="pt-2">
          <SummaryTab
            events={events}
            profile={profile}
          />
        </main>
      )}

      {mainTab === 'insights' && (
        <main className="pt-2">
          <InsightsTab
            events={events}
            profile={profile}
            onOpenFeeding={() => setFeedingModalOpen(true)}
            onOpenSleep={() => setSleepModalOpen(true)}
          />
        </main>
      )}

      {mainTab === 'milestones' && (
        <main className="pt-2">
          <MilestonesTab
            profile={profile}
            completedMilestones={completedMilestones}
            onToggleMilestone={handleToggleMilestone}
          />
        </main>
      )}

      {/* Bottom Sticky Tab Navigation - 5 Smart Tabs */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-rose-100 safe-bottom z-30 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-5 px-1 py-1.5 gap-0.5">
          {/* Tab 1: Tracker */}
          <button
            onClick={() => setMainTab('tracker')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              mainTab === 'tracker'
                ? 'text-rose-600 font-bold bg-rose-50/80 shadow-2xs'
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <Activity className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] sm:text-[11px]">יומן</span>
          </button>

          {/* Tab 2: Reminders & Routine */}
          <button
            onClick={() => setMainTab('reminders')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all relative ${
              mainTab === 'reminders'
                ? 'text-rose-600 font-bold bg-rose-50/80 shadow-2xs'
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <Bell className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] sm:text-[11px]">תזכורות</span>
            {pendingDailyReminders.length > 0 && (
              <span className="absolute top-1 right-2.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-2xs">
                {pendingDailyReminders.length}
              </span>
            )}
          </button>

          {/* Tab 3: Comprehensive Summary */}
          <button
            onClick={() => setMainTab('summary')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              mainTab === 'summary'
                ? 'text-indigo-600 font-bold bg-indigo-50/80 shadow-2xs'
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <BarChart3 className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] sm:text-[11px]">מעקב</span>
          </button>

          {/* Tab 4: Smart Insights */}
          <button
            onClick={() => setMainTab('insights')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all relative ${
              mainTab === 'insights'
                ? 'text-amber-600 font-bold bg-amber-50/80 shadow-2xs'
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <Lightbulb className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] sm:text-[11px]">תובנות</span>
            <span className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          </button>

          {/* Tab 5: Milestones & Activities */}
          <button
            onClick={() => setMainTab('milestones')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all relative ${
              mainTab === 'milestones'
                ? 'text-pink-600 font-bold bg-pink-50/80 shadow-2xs'
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] sm:text-[11px]">התפתחות</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
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
