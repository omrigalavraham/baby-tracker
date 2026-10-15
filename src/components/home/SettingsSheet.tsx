import React from 'react';
import { ChevronLeft, Cloud, CloudOff, Download, FileSpreadsheet, PenLine, Sparkles, SlidersHorizontal } from 'lucide-react';
import { ThemeMode } from '../../lib/theme';
import { Card, IconBadge, Segmented, Sheet, Tone } from '../ui';

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  isSynced: boolean;
  themeMode: ThemeMode;
  onChangeTheme: (m: ThemeMode) => void;
  onOpenProfile: () => void;
  onOpenSync: () => void;
  onOpenExport: () => void;
  onReplaySplash: () => void;
  canInstall: boolean;
  onInstallApp: () => void;
}

const Row: React.FC<{ tone: Tone; icon: React.ReactNode; title: string; detail?: string; onClick: () => void }> = ({
  tone,
  icon,
  title,
  detail,
  onClick,
}) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 text-right">
    <IconBadge tone={tone}>{icon}</IconBadge>
    <span className="flex-1 flex flex-col">
      <span className="text-[15px] font-medium text-ink">{title}</span>
      {detail && <span className="text-[13px] text-muted">{detail}</span>}
    </span>
    <ChevronLeft className="w-5 h-5 text-faint" strokeWidth={1.6} />
  </button>
);

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  open,
  onClose,
  isSynced,
  themeMode,
  onChangeTheme,
  onOpenProfile,
  onOpenSync,
  onOpenExport,
  onReplaySplash,
  canInstall,
  onInstallApp,
}) => {
  const go = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <Sheet open={open} onClose={onClose} title="הגדרות" icon={<SlidersHorizontal strokeWidth={1.6} />}>
      <Card className="divide-y divide-line py-1">
        <Row tone="feed" icon={<PenLine strokeWidth={1.6} />} title="פרופיל" detail="שם, תאריך לידה ומשקל לידה" onClick={go(onOpenProfile)} />
        <Row
          tone={isSynced ? 'diaper' : 'weight'}
          icon={isSynced ? <Cloud strokeWidth={1.6} /> : <CloudOff strokeWidth={1.6} />}
          title="שיתוף וסנכרון"
          detail={isSynced ? 'מסונכרן עם המכשיר השני' : 'שמור רק במכשיר הזה'}
          onClick={go(onOpenSync)}
        />
        <Row tone="sleep" icon={<FileSpreadsheet strokeWidth={1.6} />} title="ייצוא נתונים" detail="Excel או Google Sheets" onClick={go(onOpenExport)} />
      </Card>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-muted px-1">מצב תצוגה</span>
        <Segmented
          label="מצב תצוגה"
          value={themeMode}
          onChange={onChangeTheme}
          options={[
            { value: 'auto', label: 'אוטומטי' },
            { value: 'day', label: 'יום' },
            { value: 'night', label: 'לילה' },
          ]}
        />
        <span className="text-[13px] text-muted px-1">באוטומטי, מצב הלילה נדלק בין 20:00 ל-07:00</span>
      </div>

      <Card className="divide-y divide-line py-1">
        <Row tone="primary" icon={<Sparkles strokeWidth={1.6} />} title="מסך הפתיחה" onClick={go(onReplaySplash)} />
        {canInstall && <Row tone="feed" icon={<Download strokeWidth={1.6} />} title="התקנה למסך הבית" onClick={go(onInstallApp)} />}
      </Card>
    </Sheet>
  );
};
