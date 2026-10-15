import { useEffect, useState } from 'react';

export type ThemeMode = 'auto' | 'day' | 'night';

const THEME_KEY = 'avigi_theme_mode';
const NIGHT_START_HOUR = 20;
const NIGHT_END_HOUR = 7;

export function loadThemeMode(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'day' || v === 'night' || v === 'auto') return v;
  } catch {
    // storage unavailable
  }
  return 'auto';
}

export function saveThemeMode(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    // storage unavailable
  }
}

export function isNightHour(date = new Date()): boolean {
  const h = date.getHours();
  return h >= NIGHT_START_HOUR || h < NIGHT_END_HOUR;
}

/** Applies the `night` class on <html> and keeps it in sync with the clock in auto mode. */
export function useNightMode(mode: ThemeMode): boolean {
  const [isNight, setIsNight] = useState(() => mode === 'night' || (mode === 'auto' && isNightHour()));

  useEffect(() => {
    const update = () => setIsNight(mode === 'night' || (mode === 'auto' && isNightHour()));
    update();
    if (mode !== 'auto') return;
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [mode]);

  useEffect(() => {
    const root = document.documentElement;
    // Crossfade only on a real switch, not on first paint
    if (root.dataset.themeReady && root.classList.contains('night') !== isNight) {
      root.classList.add('theme-transition');
      setTimeout(() => root.classList.remove('theme-transition'), 900);
    }
    root.classList.toggle('night', isNight);
    root.dataset.themeReady = '1';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isNight ? '#1B1820' : '#FBF7F3');
  }, [isNight]);

  return isNight;
}

export function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'בוקר טוב';
  if (h >= 12 && h < 17) return 'צהריים טובים';
  if (h >= 17 && h < 21) return 'ערב טוב';
  return 'לילה טוב';
}
