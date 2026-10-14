// Notification and Sound Service for Baby Tracker PWA

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return false;
  }
}

/**
 * Play a gentle, soothing chime using Web Audio API
 */
export function playGentleChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (gentle harp chord)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.9);
    });
  } catch {
    // Audio might be blocked before first user gesture
  }
}

/**
 * Cooldown tracker to prevent repeating the same notification within 30 minutes
 */
const sentCooldowns: Record<string, number> = {};

export async function showAppNotification(
  title: string,
  options: {
    body?: string;
    tag?: string;
    icon?: string;
    badge?: string;
    playSound?: boolean;
    cooldownMinutes?: number;
  } = {}
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const {
    body = '',
    tag = 'baby-notification',
    icon = '/icon.svg',
    badge = '/icon.svg',
    playSound = true,
    cooldownMinutes = 30
  } = options;

  // Check cooldown
  const now = Date.now();
  const lastSent = sentCooldowns[tag] || 0;
  if (now - lastSent < cooldownMinutes * 60 * 1000) {
    return false; // Still in cooldown
  }
  sentCooldowns[tag] = now;

  if (playSound) {
    playGentleChime();
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body,
          icon,
          badge,
          tag,
          renotify: true,
          dir: 'rtl',
          lang: 'he',
          vibrate: [150, 100, 150]
        } as any);
        return true;
      }
    }

    // Fallback to standard Window Notification
    new Notification(title, {
      body,
      icon,
      badge,
      tag,
      dir: 'rtl',
      lang: 'he'
    });
    return true;
  } catch (err) {
    console.warn('Could not show notification:', err);
    return false;
  }
}
