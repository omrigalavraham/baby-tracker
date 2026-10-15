import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { BabyProfile } from '../../types';
import { calculateAge } from '../../lib/babyUtils';
import { greetingFor } from '../../lib/theme';
import { IconButton } from '../ui';

interface AppHeaderProps {
  profile: BabyProfile;
  isSleeping: boolean;
  isNight: boolean;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ profile, isSleeping, isNight, onOpenSettings, onOpenProfile }) => {
  const age = calculateAge(profile.birth_date);
  const name = profile.name || 'הקטנה';
  const quietNight = isNight && isSleeping;

  return (
    <header className="relative flex items-start justify-between mb-5">
      {isNight && (
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <span className="absolute top-3 left-[38%] w-[3px] h-[3px] rounded-full bg-faint" />
          <span className="absolute top-14 left-[28%] w-[2px] h-[2px] rounded-full bg-faint" />
          <span className="absolute -top-1 left-[50%] w-[2px] h-[2px] rounded-full bg-faint opacity-70" />
          <span className="absolute top-20 left-[45%] w-[3px] h-[3px] rounded-full bg-faint opacity-70" />
        </div>
      )}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[15px] text-muted">{greetingFor()}</span>
        <h1 className="text-[26px] font-medium tracking-tight truncate">{quietNight ? `${name} ישנה` : name}</h1>
        <span className="text-[13px] text-muted">{quietNight ? 'הכל שקט. אפשר לנוח גם' : age.displayText}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <IconButton label="הגדרות" onClick={onOpenSettings}>
          <SlidersHorizontal strokeWidth={1.6} />
        </IconButton>
        <button
          onClick={onOpenProfile}
          aria-label="פרופיל"
          className="w-[52px] h-[52px] rounded-full bg-feed-soft text-feed text-xl font-medium flex items-center justify-center border-[3px] border-surface shadow-soft"
        >
          {name.trim().charAt(0)}
        </button>
      </div>
    </header>
  );
};
