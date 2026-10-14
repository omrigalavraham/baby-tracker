import React from 'react';
import { X, FileSpreadsheet, Download, CheckCircle, Info } from 'lucide-react';
import { BabyEvent, BabyProfile } from '../types';
import { exportEventsToCSV } from '../lib/babyUtils';

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
  if (!isOpen) return null;

  const handleExport = () => {
    exportEventsToCSV(events, profile);
  };

  const totalFeedings = events.filter(e => e.type === 'feeding').length;
  const totalDiapers = events.filter(e => e.type === 'diaper').length;
  const totalSleep = events.filter(e => e.type === 'sleep').length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-emerald-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">ייצוא ל-Excel / Google Sheets</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-right overflow-y-auto flex-1">
          <p className="text-xs text-slate-600 leading-relaxed">
            תוכלו להוריד את כל נתוני המעקב של {profile.name} לקובץ טבלה מסודר (CSV בעברית) שניתן לפתוח באקסל או להעלות לגוגל שיטס בלחיצה.
          </p>

          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-xs text-rose-600 font-bold block">האכלות</span>
              <span className="text-lg font-black text-rose-800">{totalFeedings}</span>
            </div>
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
              <span className="text-xs text-sky-600 font-bold block">חיתולים</span>
              <span className="text-lg font-black text-sky-800">{totalDiapers}</span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <span className="text-xs text-indigo-600 font-bold block">שעות שינה</span>
              <span className="text-lg font-black text-indigo-800">{totalSleep}</span>
            </div>
          </div>

          <button
            onClick={handleExport}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"
          >
            <Download className="w-5 h-5" />
            <span>הורד קובץ ל-Google Sheets / Excel</span>
          </button>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="font-bold text-slate-700 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              איך פותחים בגוגל שיטס?
            </div>
            <p>1. נכנסים ל-Google Sheets במחשב או בטלפון.</p>
            <p>2. לוחצים על: קובץ (File) ➔ ייבוא (Import) ➔ העלאה (Upload).</p>
            <p>3. בוחרים את הקובץ שהורדתם – וכל הנתונים מופיעים מיד בגיליון!</p>
          </div>
        </div>

      </div>
    </div>
  );
};
