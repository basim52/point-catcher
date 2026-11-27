// Player sign-in for the whole game. Uses the SAME Firebase app + auth instance that
// Mario Party already uses ("mario-party-applet"), so one Google login covers the game and
// Mario Party. Intentionally imports ONLY firebase/auth to keep the first screen light.
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Must match the app name in src/marioParty/firebaseClient.ts.
const PLAYER_APP_NAME = 'mario-party-applet';

const app = getApps().some((a) => a.name === PLAYER_APP_NAME)
  ? getApp(PLAYER_APP_NAME)
  : initializeApp(firebaseConfig, PLAYER_APP_NAME);

export const playerAuth: Auth = getAuth(app);

// Test-only: build with VITE_AUTH_EMULATOR_URL to use the local Firebase Auth emulator.
const emulatorUrl = import.meta.env.VITE_AUTH_EMULATOR_URL as string | undefined;
if (emulatorUrl) connectAuthEmulator(playerAuth, emulatorUrl, { disableWarnings: true });

// Keep players signed in across visits.
void setPersistence(playerAuth, browserLocalPersistence).catch(() => undefined);

export type GateError =
  | 'cancelled'
  | 'network'
  | 'domain'
  | 'in-app-browser'
  | 'disabled'
  | 'unknown';

export function errorKind(code: string | undefined): GateError {
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'auth/user-cancelled':
      return 'cancelled';
    case 'auth/network-request-failed':
      return 'network';
    case 'auth/unauthorized-domain':
      return 'domain';
    case 'auth/operation-not-allowed':
      return 'disabled';
    case 'auth/web-storage-unsupported':
      return 'in-app-browser';
    default:
      return 'unknown';
  }
}

/** Google refuses OAuth inside embedded WebViews / in-app browsers. */
export function isEmbeddedBrowser(): boolean {
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|FB_IAB|Instagram|Snapchat|Line\/|MicroMessenger|TikTok|; wv\)|WhatsApp/i.test(ua);
}

const REDIRECT_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
]);

function googleProvider(): GoogleAuthProvider {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  return p;
}

/** Popup first; if the browser blocks popups, fall back to a full-page redirect. */
export async function signInPlayer(): Promise<'done' | 'redirecting'> {
  try {
    await signInWithPopup(playerAuth, googleProvider());
    return 'done';
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code && REDIRECT_FALLBACK_CODES.has(code)) {
      await signInWithRedirect(playerAuth, googleProvider());
      return 'redirecting';
    }
    throw e;
  }
}

/** Finish a redirect sign-in (no-op when there was none). Resolves to an error code or null. */
export async function finishRedirect(): Promise<string | null> {
  try {
    await getRedirectResult(playerAuth);
    return null;
  } catch (e) {
    return (e as { code?: string }).code ?? 'unknown';
  }
}

export function watchPlayer(cb: (u: User | null) => void): () => void {
  return onAuthStateChanged(playerAuth, cb);
}

export function signOutPlayer(): Promise<void> {
  return signOut(playerAuth);
}
