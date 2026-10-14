import React, { useState } from 'react';
import { X, Check, Copy, Share2, Database, Cloud, RefreshCw, Key, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { BabyProfile } from '../types';
import { 
  getStoredSupabaseConfig, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  testSupabaseConnection 
} from '../lib/supabase';

interface SyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BabyProfile;
  onUpdateFamilyCode: (newCode: string) => void;
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateFamilyCode
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Supabase form
  const initialConfig = getStoredSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(initialConfig?.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialConfig?.anonKey || '');
  const [testingStatus, setTestingStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({
    loading: false
  });

  const [inputCode, setInputCode] = useState(profile.id);

  if (!isOpen) return null;

  const shareableUrl = `${window.location.origin}${window.location.pathname}?family=${profile.id}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(profile.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `היי! הנה הקישור לאפליקציית המעקב של ${profile.name || 'התינוקת'} שלנו:\n${shareableUrl}\n(כל הנתונים מסונכרנים בינינו בזמן אמת! 👶)`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSaveSupabase = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      alert('נא להזין גם URL וגם Anon Key');
      return;
    }

    saveSupabaseConfig({
      url: supabaseUrl.trim(),
      anonKey: supabaseAnonKey.trim()
    });

    setTestingStatus({ loading: true });
    const res = await testSupabaseConnection();
    setTestingStatus({ loading: false, success: res.success, message: res.message });
  };

  const handleDisconnectSupabase = () => {
    clearSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setTestingStatus({ loading: false, success: false, message: 'החיבור ל-Supabase נותק (הנתונים נשמרים במכשיר)' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-rose-100 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-rose-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">סנכרון בין מכשירים</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-right overflow-y-auto flex-1 text-slate-800">
          
          {/* Section 1: Family Share Code */}
          <div className="space-y-3 p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800">קוד משפחה לשיתוף:</span>
              <span className="text-xs bg-rose-200/80 text-rose-800 px-2 py-0.5 rounded-md font-mono font-bold">
                {profile.id}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              שלחו את הקישור לבן/בת הזוג. כשהם יפתחו אותו בגלקסי שלהם, הם יהיו מחוברים ישירות לאותה התינוקת!
            </p>

            {/* Share buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleShareWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>שתף בוואטסאפ 📲</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="py-2.5 px-3 rounded-xl bg-white border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-rose-50 active:scale-95 transition-all"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'הקישור הועתק!' : 'העתק קישור'}</span>
              </button>
            </div>

            {/* Change / join another code */}
            <div className="pt-2 border-t border-rose-200/60 flex items-center gap-2">
              <input
                type="text"
                placeholder="הזן קוד משפחה קיים..."
                value={inputCode}
                onChange={e => setInputCode(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-rose-200 bg-white font-mono text-center uppercase focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
              <button
                onClick={() => {
                  if (inputCode.trim() && inputCode !== profile.id) {
                    onUpdateFamilyCode(inputCode.trim());
                    alert(`הקוד עודכן ל-${inputCode.trim()}! הנתונים נטענים...`);
                  }
                }}
                className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
              >
                החלף
              </button>
            </div>
          </div>

          {/* Section 2: Supabase Credentials */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-800">הגדרות בסיס נתונים (Supabase)</h3>
            </div>
            
            <p className="text-[11px] text-slate-500 leading-relaxed">
              לסנכרון מיידי בזמן אמת (Realtime) ללא הגבלה, הדביקו את פרטי הפרויקט שלכם מ-Supabase:
            </p>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Project URL:
                </label>
                <input
                  type="text"
                  placeholder="https://xyz.supabase.co"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-mono text-left focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Anon / Public Key:
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX..."
                  value={supabaseAnonKey}
                  onChange={e => setSupabaseAnonKey(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-mono text-left focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Test Status feedback */}
            {testingStatus.message && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                testingStatus.success 
                  ? 'bg-emerald-100 text-emerald-800 font-medium'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {testingStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testingStatus.message}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                disabled={testingStatus.loading}
                onClick={handleSaveSupabase}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {testingStatus.loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>שמור ובדוק חיבור</span>
              </button>

              {initialConfig && (
                <button
                  onClick={handleDisconnectSupabase}
                  className="px-3 py-2.5 border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-all"
                >
                  נתק
                </button>
              )}
            </div>

            <p className="text-[10px] text-slate-400">
              💡 טיפ: קובץ ה-SQL ליצירת הטבלאות ב-Supabase נמצא בתיקיית הפרויקט: <code className="bg-slate-200 px-1 py-0.5 rounded">supabase-schema.sql</code>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
