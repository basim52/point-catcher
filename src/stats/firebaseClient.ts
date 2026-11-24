import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
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
import type { SessionRecord } from './aggregate';

let app: FirebaseApp | null = null;
function getApp(): FirebaseApp {
  if (!app) app = getApps()[0] ?? initializeApp(firebaseWebConfig as Record<string, string>);
  return app;
}

export function watchUser(cb: (u: User | null) => void): () => void {
  return onAuthStateChanged(getAuth(getApp()), cb);
}

export async function signInWithGoogle(): Promise<void> {
  const auth = getAuth(getApp());
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw e;
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
