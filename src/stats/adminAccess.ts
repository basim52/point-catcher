import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

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

const REDIRECT_KEY = 'pc_stats_redirect_pending';
let swallowUntil = 0;

function swallowGhostClick(e: Event): void {
  if (performance.now() < swallowUntil) {
    e.preventDefault();
    e.stopPropagation();
  }
}
if (typeof window !== 'undefined') {
  // When the panel opens under a finger that is still down, the release would
  // "click" whatever is now under it (e.g. «رجوع للعبة»). Swallow that ghost click.
  window.addEventListener('click', swallowGhostClick, true);
}

export function openStatsOverlay(): void {
  swallowUntil = performance.now() + 900;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Called right before a Google redirect sign-in so the panel reopens on return. */
export function markStatsRedirectPending(): void {
  try {
    window.sessionStorage.setItem(REDIRECT_KEY, '1');
  } catch {
    // ignore
  }
}

export function consumeStatsRedirectPending(): boolean {
  try {
    const pending = window.sessionStorage.getItem(REDIRECT_KEY) === '1';
    if (pending) window.sessionStorage.removeItem(REDIRECT_KEY);
    return pending;
  } catch {
    return false;
  }
}

export function useStatsOpenRequests(onOpen: () => void): void {
  useEffect(() => {
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [onOpen]);
}

const MOVE_TOLERANCE_PX = 16;
const TAP_MAX_MS = 400;
const TAP_GAP_MS = 700;

type Point = { x: number; y: number };

/**
 * Hidden admin entry on an element: hold ~`holdMs`, or tap `taps` times quickly.
 * Works with touch (touch events drive touch gestures, so a browser pointercancel
 * does not abort the hold), mouse and pen.
 */
export function useSecretEntry(onTrigger: () => void, { holdMs = 2000, taps = 5 } = {}) {
  const timer = useRef<number | null>(null);
  const start = useRef<{ at: number; pt: Point; fired: boolean } | null>(null);
  const tapCount = useRef(0);
  const lastTapAt = useRef(0);
  const touchActive = useRef(false);
  const [holding, setHolding] = useState(false);
  const triggerRef = useRef(onTrigger);
  triggerRef.current = onTrigger;

  const stopTimer = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }, []);
  useEffect(() => stopTimer, [stopTimer]);

  const fire = useCallback(() => {
    tapCount.current = 0;
    triggerRef.current();
  }, []);

  const begin = useCallback(
    (pt: Point) => {
      stopTimer();
      start.current = { at: performance.now(), pt, fired: false };
      setHolding(true);
      timer.current = window.setTimeout(() => {
        timer.current = null;
        setHolding(false);
        if (start.current) start.current.fired = true;
        fire();
      }, holdMs);
    },
    [fire, holdMs, stopTimer]
  );

  const move = useCallback(
    (pt: Point) => {
      const s = start.current;
      if (!s || s.fired) return;
      if (Math.hypot(pt.x - s.pt.x, pt.y - s.pt.y) > MOVE_TOLERANCE_PX) {
        start.current = null;
        stopTimer();
      }
    },
    [stopTimer]
  );

  const end = useCallback(() => {
    const s = start.current;
    start.current = null;
    stopTimer();
    if (!s || s.fired) return;
    const now = performance.now();
    if (now - s.at > TAP_MAX_MS) {
      tapCount.current = 0;
      return;
    }
    tapCount.current = now - lastTapAt.current <= TAP_GAP_MS ? tapCount.current + 1 : 1;
    lastTapAt.current = now;
    if (tapCount.current >= taps) fire();
  }, [fire, stopTimer, taps]);

  const cancel = useCallback(() => {
    start.current = null;
    stopTimer();
  }, [stopTimer]);

  return {
    holding,
    handlers: {
      onTouchStart: (e: React.TouchEvent) => {
        touchActive.current = true;
        const t = e.touches[0];
        if (t) begin({ x: t.clientX, y: t.clientY });
      },
      onTouchMove: (e: React.TouchEvent) => {
        const t = e.touches[0];
        if (t) move({ x: t.clientX, y: t.clientY });
      },
      onTouchEnd: (e: React.TouchEvent) => {
        // Stop the synthetic mouse/click that follows a touch.
        if (e.cancelable) e.preventDefault();
        touchActive.current = false;
        end();
      },
      onTouchCancel: () => {
        touchActive.current = false;
        cancel();
      },
      onPointerDown: (e: React.PointerEvent) => {
        if (e.pointerType === 'touch' || touchActive.current) return;
        begin({ x: e.clientX, y: e.clientY });
      },
      onPointerMove: (e: React.PointerEvent) => {
        if (e.pointerType === 'touch' || touchActive.current) return;
        move({ x: e.clientX, y: e.clientY });
      },
      onPointerUp: (e: React.PointerEvent) => {
        if (e.pointerType === 'touch' || touchActive.current) return;
        end();
      },
      onPointerCancel: (e: React.PointerEvent) => {
        // Touch gestures are driven by touch events; ignore browser pointercancel.
        if (e.pointerType === 'touch' || touchActive.current) return;
        cancel();
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      onDragStart: (e: React.DragEvent) => e.preventDefault(),
    },
  };
}
