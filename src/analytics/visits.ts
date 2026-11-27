import { useEffect, useSyncExternalStore } from 'react';
import {
  analyticsFirestoreDatabaseId,
  analyticsReady,
  canSendAnalytics,
  firebaseWebConfig,
  GAME_STATS_COLLECTION,
  isAnalyticsConfigured,
} from './config';
import { TRACKED_GAMES, type TrackedGameId } from './games';

// Lightweight, Firebase-SDK-free per-game visit counter.
// - Reads aggregate visit totals from Firestore `game_stats/{gameId}` via REST.
// - Atomically increments by +1 on each game entry using Firestore `:commit`.
// - Keeps a localStorage mirror so counts update instantly and still work
//   offline or when Firebase env vars aren't configured.

const LOCAL_VISITS_KEY = 'pc_game_visits_v1';
const REFRESH_TTL_MS = 30_000;

export type VisitCountsMap = Readonly<Record<string, number>>;

type Listener = () => void;

const listeners = new Set<Listener>();
let countsCache: Record<string, number> = readLocalVisits();
// True once we have a local cache or a finished server fetch, so the UI
// never flashes "0 زيارة" while the first request is still in flight.
let countsReady = Object.keys(countsCache).length > 0;
let lastFetchAt = 0;
let inFlightFetch: Promise<void> | null = null;

function readLocalVisits(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_VISITS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (k in TRACKED_GAMES && typeof v === 'number' && Number.isFinite(v) && v >= 0) {
        out[k] = Math.floor(v);
      }
    }
    return out;
  } catch {
    return {};
  }
}

function saveLocalVisits(map: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_VISITS_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

function notify(): void {
  listeners.forEach((cb) => cb());
}

function subscribe(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): VisitCountsMap {
  return countsCache;
}

function getReadySnapshot(): boolean {
  return countsReady;
}

function markReady(): void {
  if (!countsReady) {
    countsReady = true;
    notify();
  }
}

function sendRemoteIncrement(gameId: TrackedGameId): void {
  if (!canSendAnalytics()) return;
  const projectId = firebaseWebConfig.projectId!;
  const apiKey = firebaseWebConfig.apiKey!;
  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/${encodeURIComponent(analyticsFirestoreDatabaseId)}/documents:commit?key=${encodeURIComponent(apiKey)}`;
  const documentPath = `projects/${projectId}/databases/${analyticsFirestoreDatabaseId}/documents/${GAME_STATS_COLLECTION}/${gameId}`;
  const body = JSON.stringify({
    writes: [
      {
        transform: {
          document: documentPath,
          fieldTransforms: [
            {
              fieldPath: 'visits',
              increment: { integerValue: '1' },
            },
          ],
        },
      },
    ],
  });
  try {
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'omit',
    })
      .then(async (res) => {
        if (!res.ok) return;
        const json = (await res.json()) as {
          writeResults?: Array<{
            transformResults?: Array<{ integerValue?: string }>;
          }>;
        };
        const raw = json.writeResults?.[0]?.transformResults?.[0]?.integerValue;
        const parsed = raw !== undefined ? Number(raw) : NaN;
        if (Number.isFinite(parsed) && parsed > (countsCache[gameId] ?? 0)) {
          countsCache = { ...countsCache, [gameId]: Math.floor(parsed) };
          saveLocalVisits(countsCache);
          notify();
        }
      })
      .catch(() => undefined);
  } catch {
    // never let analytics break the game
  }
}

/** Record one visit immediately when a player enters a game. */
export function recordGameVisit(gameId: TrackedGameId): void {
  const next = (countsCache[gameId] ?? 0) + 1;
  countsCache = { ...countsCache, [gameId]: next };
  saveLocalVisits(countsCache);
  notify();
  if (isAnalyticsConfigured) {
    sendRemoteIncrement(gameId);
  } else {
    void analyticsReady.then(() => sendRemoteIncrement(gameId));
  }
}

/** Fetch all public per-game visit counts from Firestore (throttled). */
export function refreshGameVisits(force = false): Promise<void> {
  // Env-less hosts (AI Studio preview) load the public config first.
  return analyticsReady.then(() => fetchGameVisits(force));
}

function fetchGameVisits(force: boolean): Promise<void> {
  if (!isAnalyticsConfigured) return Promise.resolve();
  const now = Date.now();
  if (!force && now - lastFetchAt < REFRESH_TTL_MS) return Promise.resolve();
  if (inFlightFetch) return inFlightFetch;

  const projectId = firebaseWebConfig.projectId!;
  const apiKey = firebaseWebConfig.apiKey!;
  const trackedIds = Object.keys(TRACKED_GAMES);
  const batchUrl =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/${encodeURIComponent(analyticsFirestoreDatabaseId)}/documents:batchGet?key=${encodeURIComponent(apiKey)}`;
  const batchBody = JSON.stringify({
    documents: trackedIds.map(
      (id) =>
        `projects/${projectId}/databases/${analyticsFirestoreDatabaseId}/documents/${GAME_STATS_COLLECTION}/${id}`
    ),
  });

  type VisitDoc = {
    name?: string;
    fields?: { visits?: { integerValue?: string; doubleValue?: number } };
  };

  const applyDocs = (docs: VisitDoc[]) => {
    lastFetchAt = Date.now();
    if (docs.length === 0) {
      markReady();
      return;
    }

    let changed = false;
    const merged: Record<string, number> = { ...countsCache };
    for (const doc of docs) {
      const id = doc.name?.split('/').pop();
      if (!id || !(id in TRACKED_GAMES)) continue;
      const field = doc.fields?.visits;
      const val =
        field?.integerValue !== undefined
          ? Number(field.integerValue)
          : typeof field?.doubleValue === 'number'
          ? field.doubleValue
          : NaN;
      if (Number.isFinite(val) && val >= 0) {
        const remoteCount = Math.floor(val);
        const best = Math.max(remoteCount, merged[id] ?? 0);
        if (best !== merged[id]) {
          merged[id] = best;
          changed = true;
        }
      }
    }
    if (changed) {
      countsCache = merged;
      saveLocalVisits(countsCache);
    }
    countsReady = true;
    notify();
  };

  inFlightFetch = fetch(batchUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: batchBody,
    credentials: 'omit',
  })
    .then(async (res) => {
      if (res.ok) {
        const json = (await res.json()) as Array<{ found?: VisitDoc }>;
        const docs = Array.isArray(json)
          ? json.map((entry) => entry.found).filter((d): d is VisitDoc => Boolean(d))
          : [];
        applyDocs(docs);
        return;
      }
      // Fallback to listDocuments for Standard Firestore setups if batchGet ever fails
      const listUrl =
        `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
        `/databases/${encodeURIComponent(analyticsFirestoreDatabaseId)}/documents/${GAME_STATS_COLLECTION}?pageSize=100&key=${encodeURIComponent(apiKey)}`;
      const fallbackRes = await fetch(listUrl, { credentials: 'omit' });
      if (!fallbackRes.ok) {
        markReady();
        return;
      }
      const fallbackJson = (await fallbackRes.json()) as { documents?: VisitDoc[] };
      applyDocs(fallbackJson.documents ?? []);
    })
    .catch(() => {
      markReady();
    })
    .finally(() => {
      inFlightFetch = null;
    });

  return inFlightFetch;
}

/** Subscribe to per-game visit counts and refresh from Firestore on mount. */
export function useGameVisitCounts(): { counts: VisitCountsMap; ready: boolean } {
  const counts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const ready = useSyncExternalStore(subscribe, getReadySnapshot, getReadySnapshot);
  useEffect(() => {
    void refreshGameVisits();
  }, []);
  return { counts, ready };
}

/** Format a game's visit count cleanly for Arabic or English UI badges. */
export function formatVisitLabel(count: number, lang: 'ar' | 'en'): string {
  const safe = Math.max(0, Math.floor(count));
  const num = safe.toLocaleString('en-US');
  if (lang === 'ar') {
    if (safe >= 3 && safe <= 10) return `${num} زيارات`;
    return `${num} زيارة`;
  }
  return safe === 1 ? `${num} visit` : `${num} visits`;
}
