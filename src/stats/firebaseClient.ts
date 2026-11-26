import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  Timestamp,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import {
  analyticsFirestoreDatabaseId,
  firebaseWebConfig,
  GAME_STATS_COLLECTION,
  SESSIONS_COLLECTION,
} from '../analytics/config';
import { TRACKED_GAMES } from '../analytics/games';
import { markStatsRedirectPending } from './adminAccess';
import type { SessionRecord } from './aggregate';

const STATS_APP_NAME = 'point-catcher-stats';

let app: FirebaseApp | null = null;
function getApp(): FirebaseApp {
  if (!app) {
    app =
      getApps().find((a) => a.name === STATS_APP_NAME) ??
      initializeApp(firebaseWebConfig as Record<string, string>, STATS_APP_NAME);
  }
  return app;
}

function getStatsDb() {
  return analyticsFirestoreDatabaseId === '(default)'
    ? getFirestore(getApp())
    : getFirestore(getApp(), analyticsFirestoreDatabaseId);
}

export function watchUser(cb: (u: User | null) => void): () => void {
  return onAuthStateChanged(getAuth(getApp()), cb);
}

// Popup works in normal mobile/desktop browsers; fall back to a full-page
// redirect where popups are blocked or unsupported (in-app browsers, some PWAs).
const REDIRECT_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
  'auth/cancelled-popup-request',
]);

export async function signInWithGoogle(): Promise<void> {
  const auth = getAuth(getApp());
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    if (REDIRECT_FALLBACK_CODES.has(code)) {
      markStatsRedirectPending();
      await signInWithRedirect(auth, provider);
      return;
    }
    throw e;
  }
}

/** Finish a redirect sign-in (no-op if there was none). Returns an error code or null. */
export async function completeRedirectSignIn(): Promise<string | null> {
  try {
    await getRedirectResult(getAuth(getApp()));
    return null;
  } catch (e) {
    return (e as { code?: string }).code ?? 'unknown';
  }
}

export function signOutUser(): Promise<void> {
  return signOut(getAuth(getApp()));
}

export async function fetchSessions(since: Date | null): Promise<SessionRecord[]> {
  const db = getStatsDb();
  const constraints: QueryConstraint[] = since
    ? [where('startedAt', '>=', Timestamp.fromDate(since))]
    : [];
  let snap;
  try {
    snap = await getDocs(query(collection(db, SESSIONS_COLLECTION), ...constraints));
  } catch (err) {
    if (!since) throw err;
    snap = await getDocs(collection(db, SESSIONS_COLLECTION));
  }
  return snap.docs.map((d) => {
    const v = d.data();
    return {
      gameId: String(v.gameId ?? ''),
      gameName: String(v.gameName ?? v.gameId ?? ''),
      startedAt: v.startedAt instanceof Timestamp ? v.startedAt.toDate() : new Date(0),
      durationSeconds: Number(v.durationSeconds ?? 0),
      // Older docs without the flag count as a visit.
      visit: v.visit !== false,
    };
  });
}


export async function fetchGameStats(): Promise<Record<string, number>> {
  const db = getStatsDb();
  const out: Record<string, number> = {};
  try {
    const snap = await getDocs(collection(db, GAME_STATS_COLLECTION));
    for (const d of snap.docs) {
      if (!(d.id in TRACKED_GAMES)) continue;
      const val = Number(d.data().visits ?? 0);
      if (Number.isFinite(val) && val > 0) out[d.id] = Math.floor(val);
    }
    return out;
  } catch {
    const ids = Object.keys(TRACKED_GAMES);
    const snaps = await Promise.all(
      ids.map((id) => getDoc(doc(db, GAME_STATS_COLLECTION, id)).catch(() => null))
    );
    snaps.forEach((s, idx) => {
      if (!s || !s.exists()) return;
      const val = Number(s.data()?.visits ?? 0);
      if (Number.isFinite(val) && val > 0) out[ids[idx]] = Math.floor(val);
    });
    return out;
  }
}

/**
 * Admin-only: sync historical all-time visit totals from analytics_sessions
 * into public game_stats/{gameId} whenever analytics_sessions has a higher count.
 */
export async function syncPublicVisitCounts(records: SessionRecord[]): Promise<void> {
  const db = getStatsDb();
  const totals = new Map<string, number>();
  for (const r of records) {
    if (!r.visit || !(r.gameId in TRACKED_GAMES)) continue;
    totals.set(r.gameId, (totals.get(r.gameId) ?? 0) + 1);
  }
  if (totals.size === 0) return;

  const existing = new Map<string, number>();
  try {
    const snap = await getDocs(collection(db, GAME_STATS_COLLECTION));
    for (const d of snap.docs) {
      const val = Number(d.data().visits ?? 0);
      if (Number.isFinite(val) && val >= 0) existing.set(d.id, Math.floor(val));
    }
  } catch {
    return;
  }

  const writes: Promise<void>[] = [];
  for (const [gameId, count] of totals.entries()) {
    const current = existing.get(gameId) ?? 0;
    // Never lower a stored total; only fill in if sessions show a higher all-time count.
    if (count > current) {
      writes.push(
        setDoc(doc(db, GAME_STATS_COLLECTION, gameId), { visits: count }).catch(() => undefined)
      );
    }
  }
  if (writes.length > 0) {
    await Promise.all(writes);
  }
}
