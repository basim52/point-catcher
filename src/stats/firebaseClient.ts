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
  getDocs,
  getFirestore,
  query,
  Timestamp,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { firebaseWebConfig, SESSIONS_COLLECTION } from '../analytics/config';
import { markStatsRedirectPending } from './adminAccess';
import type { SessionRecord } from './aggregate';

let app: FirebaseApp | null = null;
function getApp(): FirebaseApp {
  if (!app) app = getApps()[0] ?? initializeApp(firebaseWebConfig as Record<string, string>);
  return app;
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
  const db = getFirestore(getApp());
  const constraints: QueryConstraint[] = since
    ? [where('startedAt', '>=', Timestamp.fromDate(since))]
    : [];
  const snap = await getDocs(query(collection(db, SESSIONS_COLLECTION), ...constraints));
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
