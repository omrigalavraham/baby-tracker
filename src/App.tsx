import React, { useState, useEffect, useCallback } from 'react';
import { BabyEvent, BabyProfile } from './types';
import { 
  loadLocalProfile, 
  saveLocalProfile, 
  loadLocalEvents, 
  saveLocalEvents, 
  loadCompletedMilestones, 
  saveCompletedMilestones,
  getFamilyCodeFromUrl
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
import { FeedingModal } from './components/FeedingModal';
import { DiaperModal } from './components/DiaperModal';
import { SleepModal } from './components/SleepModal';
import { WeightModal } from './components/WeightModal';
import { BabyProfileModal } from './components/BabyProfileModal';
import { SyncSettingsModal } from './components/SyncSettingsModal';
import { ExportDataModal } from './components/ExportDataModal';

import { Activity, Sparkles, BookOpen } from 'lucide-react';

export function App() {
  const [profile, setProfile] = useState<BabyProfile>(loadLocalProfile);
  const [events, setEvents] = useState<BabyEvent[]>(loadLocalEvents);
  const [completedMilestones, setCompletedMilestones] = useState<string[]>(loadCompletedMilestones);
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [mainTab, setMainTab] = useState<'tracker' | 'milestones'>('tracker');

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

  const handleQuickDiaperPoop = () => {
    handleSaveEvent({
      type: 'diaper',
      started_at: new Date().toISOString(),
      details: { diaperType: 'poop', poopColor: 'צהוב חרדלי' }
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

  return (
    <div className="min-h-screen bg-rose-50/40 pb-24 text-slate-800">
      
      {/* Top Navbar */}
      <Navbar
        profile={profile}
        isSynced={isSynced}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenSync={() => setSyncModalOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
        installPrompt={deferredPrompt}
        onInstallApp={handleInstallApp}
      />

      {/* Main View: Tracker or Milestones */}
      {mainTab === 'tracker' ? (
        <main className="space-y-3 pt-2">
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
            onQuickDiaperPoop={handleQuickDiaperPoop}
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
      ) : (
        <main className="pt-2">
          {/* Milestones and Developmental Activities */}
          <MilestonesTab
            profile={profile}
            completedMilestones={completedMilestones}
            onToggleMilestone={handleToggleMilestone}
          />
        </main>
      )}

      {/* Bottom Sticky Tab Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-rose-100 safe-bottom z-30 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-2 px-6 py-2 gap-3">
          <button
            onClick={() => setMainTab('tracker')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              mainTab === 'tracker'
                ? 'text-rose-600 font-bold bg-rose-50/80'
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <Activity className="w-5 h-5 mb-0.5" />
            <span className="text-xs">מעקב יומי</span>
          </button>

          <button
            onClick={() => setMainTab('milestones')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all relative ${
              mainTab === 'milestones'
                ? 'text-rose-600 font-bold bg-rose-50/80'
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-0.5 text-pink-500" />
            <span className="text-xs">התפתחות ומשימות</span>
            <span className="absolute top-1 right-8 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
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
