import React, { useState } from 'react';
import { BabyProfile } from '../types';
import { calculateAge } from '../lib/babyUtils';
import { Sparkles, Settings, Share2, Download, Cloud, CloudOff, X, Edit3, FileSpreadsheet, ChevronDown } from 'lucide-react';

interface NavbarProps {
  profile: BabyProfile;
  isSynced: boolean;
  isSleeping: boolean;
  onOpenProfile: () => void;
  onOpenSync: () => void;
  onOpenExport: () => void;
  onReplaySplash?: () => void;
  installPrompt: any;
  onInstallApp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  isSynced,
  isSleeping,
  onOpenProfile,
  onOpenSync,
  onOpenExport,
  onReplaySplash,
  installPrompt,
  onInstallApp
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const age = calculateAge(profile.birth_date);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-rose-100/80 shadow-xs safe-top">
        <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
          
          {/* Baby Info - Clean, Dynamic, No Duplication */}
          <div 
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 active:scale-[0.98] transition-transform"
          >
            {/* Cute Avatar with Live Sleep Status Glow */}
            <div className="relative shrink-0">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all shadow-xs ${
                isSleeping 
                  ? 'bg-gradient-to-tr from-indigo-500 to-purple-400 text-white ring-2 ring-indigo-300 ring-offset-1' 
                  : 'bg-gradient-to-tr from-rose-400 to-pink-300 text-white shadow-rose-200'
              }`}>
                {isSleeping ? '😴' : '👶'}
              </div>
              {/* Sync dot badge */}
              <span 
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  isSynced ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
                title={isSynced ? 'מסונכרן בזמן אמת' : 'מצב מקומי'}
              />
            </div>

            {/* Title & Age */}
            <div className="text-right truncate flex-1 min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <h1 className="font-extrabold text-base text-slate-800 truncate leading-tight">
                  {profile.name || 'הנסיכה'}
                </h1>
                {isSleeping && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md font-bold shrink-0 animate-pulse">
                    ישנה 💤
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-600/90 font-medium truncate mt-0.5">
                {age.displayText}
              </p>
            </div>
          </div>

          {/* Action Area - Clean, Airy, Max 2 Icons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Direct WhatsApp Share button */}
            <button
              onClick={onOpenSync}
              title="שתף עם בן/בת הזוג"
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 transition-all active:scale-95 flex items-center justify-center"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Smart Unified Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              title="תפריט והגדרות"
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all active:scale-95 flex items-center justify-center"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Unified Smart Menu Sheet (Clean Dropdown) */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-start justify-center p-4 pt-16 animate-in fade-in duration-150"
          onClick={() => setMenuOpen(false)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-white w-full max-w-xs rounded-3xl p-3 shadow-2xl border border-rose-100 space-y-1 text-right animate-in zoom-in-95 duration-150"
          >
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">פעולות ואפשרויות</span>
              <button 
                onClick={() => setMenuOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Edit Profile */}
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenProfile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition-all text-xs font-bold text-right"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <Edit3 className="w-3.5 h-3.5" />
              </div>
              <span>עריכת פרופיל ושם התינוקת</span>
            </button>

            {/* Sync Settings */}
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenSync();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-all text-xs font-bold text-right"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isSynced ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {isSynced ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1">
                <span>סנכרון בין מכשירים</span>
                <span className={`block text-[10px] font-normal ${isSynced ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isSynced ? 'מחובר בזמן אמת' : 'הגדר סנכרון Supabase'}
                </span>
              </div>
            </button>

            {/* Export to Excel / Sheets */}
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenExport();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-all text-xs font-bold text-right"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </div>
              <span>ייצוא ל-Excel / Google Sheets</span>
            </button>

            {/* Replay Splash Screen */}
            {onReplaySplash && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onReplaySplash();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-pink-50 text-slate-700 hover:text-pink-700 transition-all text-xs font-bold text-right"
              >
                <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span>צפייה במסך הפתיחה המונפש ✨</span>
              </button>
            )}

            {/* Install PWA Option if supported */}
            {installPrompt && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onInstallApp();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-rose-500 text-white transition-all text-xs font-bold text-right shadow-xs mt-1"
              >
                <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <span>התקן אפליקציה למסך הבית</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
