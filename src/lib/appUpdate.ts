import { useEffect, useState } from 'react';

declare const __BUILD_ID__: string;

/*
 * An app added to the home screen can stay alive in the background for days and
 * keep running the old version. This checks for a new deploy whenever the app comes
 * back to the foreground (and every 30 minutes while open):
 *  - coming back from the background with an update -> reload right away (she just opened it)
 *  - update found while in use -> `updateReady` so the UI can offer a gentle "update" button
 */

async function isNewVersionLive(): Promise<boolean> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return false;
    const { build } = await res.json();
    return Boolean(build) && build !== __BUILD_ID__;
  } catch {
    return false;
  }
}

export function applyUpdate() {
  window.location.reload();
}

export function useAppUpdate(): boolean {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    let hiddenAt = 0;
    const check = async (fromBackground: boolean) => {
      navigator.serviceWorker?.getRegistration().then(r => r?.update()).catch(() => {});
      if (!(await isNewVersionLive())) return;
      if (fromBackground) applyUpdate();
      else setUpdateReady(true);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else {
        // Back after at least a few seconds away: safe to refresh before she starts tapping
        check(hiddenAt > 0 && Date.now() - hiddenAt > 5000);
      }
    };

    check(false);
    document.addEventListener('visibilitychange', onVisibility);
    const timer = setInterval(() => check(false), 30 * 60000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(timer);
    };
  }, []);

  return updateReady;
}
