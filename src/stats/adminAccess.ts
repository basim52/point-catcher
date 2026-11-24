import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

// Tiny, Firebase-free helpers used by the game shell.
// The flag only controls whether the 📊 button is shown on this device;
// the data itself is protected by Firebase Auth + Firestore rules.

const FLAG_KEY = 'pc_stats_admin_v1';
const FLAG_EVENT = 'pc-stats-admin-flag';
const OPEN_EVENT = 'pc-stats-open';

function readFlag(): boolean {
  try {
    return window.localStorage.getItem(FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

export function setStatsAdminFlag(on: boolean): void {
  try {
    if (on) window.localStorage.setItem(FLAG_KEY, '1');
    else window.localStorage.removeItem(FLAG_KEY);
  } catch {
    // storage unavailable: button simply won't persist
  }
  window.dispatchEvent(new Event(FLAG_EVENT));
}

function subscribeFlag(cb: () => void): () => void {
  window.addEventListener(FLAG_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(FLAG_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

export function useStatsAdminFlag(): boolean {
  return useSyncExternalStore(subscribeFlag, readFlag, () => false);
}

export function openStatsOverlay(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function useStatsOpenRequests(onOpen: () => void): void {
  useEffect(() => {
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [onOpen]);
}

/** Pointer handlers that fire `onLongPress` after holding for `ms`. */
export function useLongPress(onLongPress: () => void, ms = 2000) {
  const timer = useRef<number | null>(null);
  const [holding, setHolding] = useState(false);
  const clear = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }, []);
  useEffect(() => clear, [clear]);
  return {
    holding,
    handlers: {
      onPointerDown: () => {
        clear();
        setHolding(true);
        timer.current = window.setTimeout(() => {
          timer.current = null;
          setHolding(false);
          onLongPress();
        }, ms);
      },
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
      onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    },
  };
}
