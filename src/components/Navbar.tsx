import React from 'react';
import { BabyProfile } from '../types';
import { calculateAge } from '../lib/babyUtils';
import { Sparkles, Settings, Share2, Download, Cloud, CloudOff } from 'lucide-react';

interface NavbarProps {
  profile: BabyProfile;
  isSynced: boolean;
  onOpenProfile: () => void;
  onOpenSync: () => void;
  onOpenExport: () => void;
  installPrompt: any;
  onInstallApp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  isSynced,
  onOpenProfile,
  onOpenSync,
  onOpenExport,
  installPrompt,
  onInstallApp
}) => {
  const age = calculateAge(profile.birth_date);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-rose-100 shadow-xs safe-top">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Baby Info & Quick Avatar */}
        <div 
          onClick={onOpenProfile}
          className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-400 to-pink-300 p-0.5 shadow-sm shadow-rose-200">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-2xl">
              👶
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-lg text-slate-800 leading-tight">
                {profile.name || 'הנסיכה'}
              </h1>
              <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-rose-500" />
                {age.shortText || 'ניובורן'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {age.displayText}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Install PWA Button if available */}
          {installPrompt && (
            <button
              onClick={onInstallApp}
              title="התקן אפליקציה למסך הבית"
              className="flex items-center gap-1 text-xs bg-rose-500 hover:bg-rose-600 text-white font-medium px-2.5 py-1.5 rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>התקן</span>
            </button>
          )}

          {/* Sync Status Badge / Button */}
          <button
            onClick={onOpenSync}
            title={isSynced ? 'מסונכרן עם בן/בת הזוג (Supabase)' : 'לחץ לסנכרון בין מכשירים'}
            className={`p-2 rounded-xl border transition-all flex items-center justify-center active:scale-95 ${
              isSynced
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}
          >
            {isSynced ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
          </button>

          {/* Share Family Link */}
          <button
            onClick={onOpenSync}
            title="שתף עם בן/בת הזוג"
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Export / Settings */}
          <button
            onClick={onOpenExport}
            title="ייצוא נתונים"
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
