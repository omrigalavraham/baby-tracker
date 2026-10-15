import React, { useState } from 'react';
import { BabyEvent, BabyProfile } from '../types';
import { Segmented } from './ui';
import { SummaryCard, HistoryPeriod, PERIOD_OPTIONS, filterEventsForPeriod } from './SummaryTab';
import { InsightsCard } from './InsightsTab';
import { TimelineList } from './TimelineList';

interface HistoryTabProps {
  events: BabyEvent[];
  profile: BabyProfile;
  onDeleteEvent: (id: string) => void;
  onOpenFeeding: () => void;
  onOpenSleep: () => void;
}

const TIMELINE_TITLE: Record<HistoryPeriod, string> = {
  today: 'מה קרה היום',
  yesterday: 'מה קרה אתמול',
  week: 'מה קרה השבוע',
};

const EMPTY_TEXT: Record<HistoryPeriod, string> = {
  today: 'עוד לא נרשם כלום היום. כל רישום יופיע כאן.',
  yesterday: 'לא נרשמו פעולות אתמול.',
  week: 'עוד אין רישומים בשבוע האחרון.',
};

export const HistoryTab: React.FC<HistoryTabProps> = ({ events, profile, onDeleteEvent, onOpenFeeding, onOpenSleep }) => {
  const [period, setPeriod] = useState<HistoryPeriod>('today');
  const todayLabel = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
  const periodEvents = filterEventsForPeriod(events, period);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-0.5">
          <span className="text-[15px] text-muted">{todayLabel}</span>
          <h1 className="text-[26px] font-medium tracking-tight text-ink">היסטוריה</h1>
        </header>
        <Segmented label="טווח זמן" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
      </div>

      <SummaryCard events={events} period={period} />

      <InsightsCard
        events={events}
        profile={profile}
        period={period}
        onOpenFeeding={onOpenFeeding}
        onOpenSleep={onOpenSleep}
      />

      <TimelineList
        events={periodEvents}
        onDeleteEvent={onDeleteEvent}
        title={TIMELINE_TITLE[period]}
        emptyText={EMPTY_TEXT[period]}
      />
    </div>
  );
};
