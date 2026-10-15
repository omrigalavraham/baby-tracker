import React from 'react';
import { FileSpreadsheet, Download, Info } from 'lucide-react';
import { BabyEvent, BabyProfile } from '../types';
import { exportEventsToCSV } from '../lib/babyUtils';
import { Sheet, Button, Card, TONE, cx, Tone } from './ui';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: BabyEvent[];
  profile: BabyProfile;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  events,
  profile
}) => {
  const handleExport = () => {
    exportEventsToCSV(events, profile);
  };

  const totalFeedings = events.filter(e => e.type === 'feeding').length;
  const totalDiapers = events.filter(e => e.type === 'diaper').length;
  const totalSleep = events.filter(e => e.type === 'sleep').length;

  const stats: { label: string; value: number; tone: Tone }[] = [
    { label: 'האכלות', value: totalFeedings, tone: 'feed' },
    { label: 'חיתולים', value: totalDiapers, tone: 'diaper' },
    { label: 'שינות', value: totalSleep, tone: 'sleep' },
  ];

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      title="ייצוא לטבלה"
      icon={<FileSpreadsheet />}
      tone="diaper"
      footer={
        <Button block onClick={handleExport}>
          <Download />
          <span>הורדת הקובץ</span>
        </Button>
      }
    >
      <p className="text-[15px] text-muted leading-relaxed">
        כל היומן של {profile.name} בקובץ CSV מסודר בעברית, שאפשר לפתוח באקסל או בגוגל שיטס.
      </p>

      <div className="grid grid-cols-3 gap-2 text-center">
        {stats.map(s => (
          <div key={s.label} className={cx('py-3 rounded-2xl', TONE[s.tone].soft)}>
            <span className={cx('block text-[13px]', TONE[s.tone].ink)}>{s.label}</span>
            <span className={cx('block text-xl font-medium tabular-nums', TONE[s.tone].ink)}>{s.value}</span>
          </div>
        ))}
      </div>

      <Card className="bg-sunken shadow-none p-4 space-y-1.5 text-[13px] text-muted leading-relaxed">
        <div className="flex items-center gap-2 text-[15px] font-medium text-ink">
          <Info className="w-4 h-4 text-muted" />
          איך פותחים בגוגל שיטס?
        </div>
        <p>1. נכנסים ל-Google Sheets במחשב או בטלפון.</p>
        <p>2. קובץ (File) ← ייבוא (Import) ← העלאה (Upload).</p>
        <p>3. בוחרים את הקובץ שהורדתם, וכל הנתונים מופיעים בגיליון.</p>
      </Card>
    </Sheet>
  );
};
