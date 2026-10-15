import React, { useState } from 'react';
import { Check, Copy, Share2, Cloud, RefreshCw, Database, ChevronDown, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';
import { BabyProfile } from '../types';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection
} from '../lib/supabase';
import { Sheet, Button, Card, Field, fieldClass, cx } from './ui';

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

  const shareableUrl = `${window.location.origin}${window.location.pathname}?family=${profile.id}`;
  const isConnected = !!initialConfig && testingStatus.success !== false;

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
    const text = `היי! הנה הקישור לאפליקציית המעקב של ${profile.name || 'התינוקת'} שלנו:\n${shareableUrl}\n(כל הנתונים מסונכרנים בינינו בזמן אמת)`;
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

  const handleSwitchCode = () => {
    if (inputCode.trim() && inputCode !== profile.id) {
      onUpdateFamilyCode(inputCode.trim());
      alert(`הקוד עודכן ל-${inputCode.trim()}. הנתונים נטענים...`);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      title="סנכרון בין מכשירים"
      icon={<Cloud />}
      tone="sleep"
      footer={
        <Button block onClick={onClose}>
          <Check />
          <span>סיום</span>
        </Button>
      }
    >
      {/* Connection status */}
      <div className="flex items-center gap-2 px-1 text-[13px] text-muted">
        <span className={cx('w-2 h-2 rounded-full shrink-0', isConnected ? 'bg-diaper' : 'bg-weight')} />
        <span>{isConnected ? 'מחובר וסונכרן בזמן אמת' : 'שמור במכשיר הזה בלבד'}</span>
      </div>

      {/* Family code */}
      <Card className="bg-sunken shadow-none p-5 text-center space-y-3">
        <span className="block text-[13px] text-muted">קוד המשפחה שלכם</span>
        <div dir="ltr" className="text-[28px] font-medium text-ink tabular-nums tracking-[0.18em] break-all select-all">
          {profile.id}
        </div>
        <p className="text-[13px] text-muted leading-relaxed">
          שלחו את הקישור לבן או בת הזוג, וכשיפתחו אותו תהיו מחוברים לאותו יומן.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="soft" size="md" onClick={handleShareWhatsApp}>
          <Share2 />
          <span>וואטסאפ</span>
        </Button>
        <Button variant="soft" size="md" onClick={handleCopyLink}>
          {copiedLink ? <Check className="text-diaper" /> : <Copy />}
          <span>{copiedLink ? 'הועתק' : 'העתקת קישור'}</span>
        </Button>
      </div>
      <Button variant="ghost" size="md" block onClick={handleCopyCode}>
        {copiedCode ? <Check className="text-diaper" /> : <Copy />}
        <span>{copiedCode ? 'הקוד הועתק' : 'העתקת הקוד בלבד'}</span>
      </Button>

      {/* Join another family code */}
      <Field label="יש לכם כבר קוד משפחה? הזינו אותו כאן">
        <div className="flex items-center gap-2">
          <input
            type="text"
            dir="ltr"
            placeholder="קוד משפחה"
            value={inputCode}
            onChange={e => setInputCode(e.target.value.toUpperCase())}
            className={cx(fieldClass, 'flex-1 text-center uppercase tabular-nums tracking-[0.12em]')}
          />
          <Button variant="soft" size="md" type="button" onClick={handleSwitchCode}>
            החלפה
          </Button>
        </div>
      </Field>

      {/* Advanced: Supabase credentials */}
      <details className="group bg-surface rounded-[28px] shadow-soft">
        <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <Database className="w-5 h-5 text-muted shrink-0" />
          <span className="flex-1 text-[15px] font-medium text-ink">הגדרות מתקדמות (Supabase)</span>
          <ChevronDown className="w-5 h-5 text-muted transition-transform group-open:rotate-180" />
        </summary>

        <div className="px-5 pb-5 space-y-4">
          <p className="text-[13px] text-muted leading-relaxed">
            לסנכרון בזמן אמת, הדביקו את פרטי הפרויקט שלכם מ-Supabase.
          </p>

          <Field label="Project URL">
            <input
              type="text"
              placeholder="https://xyz.supabase.co"
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
              className={cx(fieldClass, 'text-left')}
              dir="ltr"
            />
          </Field>

          <Field label="Anon / Public Key">
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX..."
              value={supabaseAnonKey}
              onChange={e => setSupabaseAnonKey(e.target.value)}
              className={cx(fieldClass, 'text-left')}
              dir="ltr"
            />
          </Field>

          {testingStatus.message && (
            <div
              className={cx(
                'px-4 py-3 rounded-2xl text-[13px] flex items-center gap-2',
                testingStatus.success ? 'bg-diaper-soft text-diaper-ink' : 'bg-danger-soft text-danger'
              )}
            >
              {testingStatus.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testingStatus.message}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="soft"
              size="md"
              className="flex-1"
              disabled={testingStatus.loading}
              onClick={handleSaveSupabase}
            >
              {testingStatus.loading ? <RefreshCw className="animate-spin" /> : <Check />}
              <span>שמירה ובדיקת חיבור</span>
            </Button>

            {initialConfig && (
              <Button variant="ghost" size="md" onClick={handleDisconnectSupabase}>
                ניתוק
              </Button>
            )}
          </div>

          <p className="flex items-start gap-2 text-[13px] text-muted leading-relaxed">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              קובץ ה-SQL ליצירת הטבלאות נמצא בתיקיית הפרויקט:{' '}
              <code dir="ltr" className="bg-sunken px-1.5 py-0.5 rounded-md">supabase-schema.sql</code>
            </span>
          </p>
        </div>
      </details>
    </Sheet>
  );
};
