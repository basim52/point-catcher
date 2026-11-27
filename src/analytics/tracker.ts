import { useEffect, useRef } from 'react';
import {
  analyticsFirestoreDatabaseId,
  canSendAnalytics,
  firebaseWebConfig,
  SESSIONS_COLLECTION,
} from './config';
import { gameNameFor, type TrackedGameId } from './games';
import { recordGameVisit } from './visits';

// Anonymous play-time tracking. No player data is stored: only which game,
// when, and how many seconds were actively played (visible tab only).

const MAX_SESSION_SECONDS = 6 * 60 * 60;
const HEARTBEAT_FLUSH_MS = 60_000;

type SessionPayload = {
  gameId: TrackedGameId;
  gameName: string;
  startedAt: Date;
  endedAt: Date;
  durationSeconds: number;
  visit: boolean;
};

function makeSessionDocId(): string {
  const ts = Date.now().toString(36);
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
      ? Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(36).padStart(2, '0'))
          .join('')
          .slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `s_${ts}_${rand}`;
}

function sendSession(p: SessionPayload): void {
  if (!canSendAnalytics()) return;
  if (!p.visit && p.durationSeconds < 1) return;
  const { projectId, apiKey } = firebaseWebConfig;
  const docId = makeSessionDocId();
  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId!)}` +
    `/databases/${encodeURIComponent(analyticsFirestoreDatabaseId)}/documents/${SESSIONS_COLLECTION}` +
    `?documentId=${encodeURIComponent(docId)}&key=${encodeURIComponent(apiKey!)}`;
  const body = JSON.stringify({
    fields: {
      gameId: { stringValue: p.gameId },
      gameName: { stringValue: p.gameName },
      startedAt: { timestampValue: p.startedAt.toISOString() },
      endedAt: { timestampValue: p.endedAt.toISOString() },
      durationSeconds: { integerValue: String(p.durationSeconds) },
      visit: { booleanValue: p.visit },
    },
  });
  try {
    // keepalive lets the request finish even while the page is being hidden/closed.
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'omit',
    }).catch(() => undefined);
  } catch {
    // never let analytics break the game
  }
}

function recordVisitAtStart(gameId: TrackedGameId): void {
  const now = new Date();
  sendSession({
    gameId,
    gameName: gameNameFor(gameId),
    startedAt: now,
    endedAt: now,
    durationSeconds: 0,
    visit: true,
  });
}

class PlaySession {
  private startedAt = new Date();
  private activeMs = 0;
  private activeSince: number | null = null;
  private wantActive = false;
  private suspended = false;

  private heartbeatTimer: number | null = null;

  constructor(private readonly gameId: TrackedGameId) {
    if (typeof window !== 'undefined') {
      this.heartbeatTimer = window.setInterval(() => {
        if (this.suspended) return;
        this.applyClock();
        if (this.activeSince !== null) {
          const now = performance.now();
          this.activeMs += now - this.activeSince;
          this.activeSince = now;
        }
        if (this.activeMs >= 5000) {
          this.flush();
        }
      }, HEARTBEAT_FLUSH_MS);
    }
  }

  setActive(active: boolean): void {
    this.wantActive = active;
    this.applyClock();
  }

  private pageVisible(): boolean {
    return typeof document === 'undefined' || document.visibilityState === 'visible';
  }

  private applyClock(): void {
    const shouldRun = this.wantActive && !this.suspended && this.pageVisible();
    const now = performance.now();
    if (shouldRun && this.activeSince === null) this.activeSince = now;
    if (!shouldRun && this.activeSince !== null) {
      this.activeMs += now - this.activeSince;
      this.activeSince = null;
    }
  }

  /** Page hidden: close the current segment and send it. */
  suspend(): void {
    if (this.suspended) return;
    this.applyClock();
    this.suspended = true;
    this.applyClock();
    this.flush();
  }

  /** Page visible again: start a new segment (not counted as a new visit). */
  resume(): void {
    if (!this.suspended) return;
    this.suspended = false;
    this.startedAt = new Date();
    this.activeMs = 0;
    this.applyClock();
  }

  finish(): void {
    if (this.heartbeatTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.suspended) return; // already flushed when hidden
    this.suspended = true;
    this.applyClock();
    this.flush();
  }

  private flush(): void {
    const durationSeconds = Math.min(
      MAX_SESSION_SECONDS,
      Math.max(0, Math.round(this.activeMs / 1000))
    );
    const now = new Date();
    sendSession({
      gameId: this.gameId,
      gameName: gameNameFor(this.gameId),
      startedAt: this.startedAt,
      endedAt: now,
      durationSeconds,
      visit: false,
    });
    this.activeMs = 0;
    this.startedAt = now;
  }
}

const liveSessions = new Set<PlaySession>();
let listenersInstalled = false;

function installPageListeners(): void {
  if (listenersInstalled || typeof window === 'undefined') return;
  listenersInstalled = true;
  const onHidden = () => liveSessions.forEach((s) => s.suspend());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onHidden();
    else liveSessions.forEach((s) => s.resume());
  });
  window.addEventListener('pagehide', onHidden);
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && document.visibilityState === 'visible') {
      liveSessions.forEach((s) => s.resume());
    }
  });
}

/**
 * Track one game's visit + active minutes.
 * gameId: the open game (null = no game open). active: is the player actually playing.
 */
export function useGamePlayTracking(gameId: TrackedGameId | null, active: boolean): void {
  const sessionRef = useRef<PlaySession | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (!gameId) return;
    // Count the visit immediately (counter + session doc) so a killed tab
    // still leaves a durable visit even if play-time is never flushed.
    recordGameVisit(gameId);
    recordVisitAtStart(gameId);
    if (!canSendAnalytics()) return;
    installPageListeners();
    const session = new PlaySession(gameId);
    session.setActive(activeRef.current);
    sessionRef.current = session;
    liveSessions.add(session);
    return () => {
      liveSessions.delete(session);
      session.finish();
      if (sessionRef.current === session) sessionRef.current = null;
    };
  }, [gameId]);

  useEffect(() => {
    sessionRef.current?.setActive(active);
  }, [active, gameId]);
}
