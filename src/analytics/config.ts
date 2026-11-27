// ─────────────────────────────────────────────────────────────────────────────
// Stats config — SINGLE source of truth: the Firebase project "point-catcher-stats".
//
// DO NOT point analytics at firebase-applet-config.json (the AI Studio project).
// That silently split the stats into a second database whenever the Vite env vars
// were missing (AI Studio preview), which made the numbers "disappear".
// See STATS_KIT.md. `stats-kit/guard.mjs` fails the build if this is changed back.
// ─────────────────────────────────────────────────────────────────────────────

/** The only Firebase project analytics may ever talk to. */
export const ANALYTICS_PROJECT_ID = 'point-catcher-stats';
/** Analytics always lives in the default Firestore database of that project. */
export const analyticsFirestoreDatabaseId = '(default)';
/** Where env-less hosts (AI Studio preview, localhost) fetch the public web config. */
const RUNTIME_CONFIG_URL = 'https://point-catcher.vercel.app/stats-config.json';

export type AnalyticsWebConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  appId?: string;
};

const isComplete = (c: AnalyticsWebConfig): boolean =>
  Boolean(c.apiKey && c.authDomain && c.projectId === ANALYTICS_PROJECT_ID && c.appId);

// 1) Public web config baked in at build time from Vite env vars (Vercel).
const envConfig: AnalyticsWebConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

// Live bindings: updated once the runtime config (below) has loaded.
export let firebaseWebConfig: AnalyticsWebConfig = isComplete(envConfig) ? envConfig : {};
export let isAnalyticsConfigured: boolean = isComplete(envConfig);

/**
 * 2) Hosts without env vars (AI Studio preview, any other host) load the same public
 * config from the production site's /stats-config.json, written at build time.
 * Never falls back to any other Firebase project.
 */
async function loadRuntimeConfig(): Promise<void> {
  const sources = [`${window.location.origin}/stats-config.json`, RUNTIME_CONFIG_URL];
  for (const url of sources) {
    try {
      const res = await fetch(url, { credentials: 'omit', cache: 'no-store' });
      if (!res.ok) continue;
      const json = (await res.json()) as AnalyticsWebConfig;
      if (!isComplete(json)) continue;
      firebaseWebConfig = {
        apiKey: json.apiKey,
        authDomain: json.authDomain,
        projectId: json.projectId,
        appId: json.appId,
      };
      isAnalyticsConfigured = true;
      return;
    } catch {
      // try the next source
    }
  }
}

/** Resolves once the config is known (immediately when baked in at build time). */
export const analyticsReady: Promise<void> =
  isAnalyticsConfigured || typeof window === 'undefined' ? Promise.resolve() : loadRuntimeConfig();

/**
 * Writes (visits / play sessions) are only sent from real player hosts. Development
 * hosts (AI Studio preview *.run.app, localhost) can still READ the dashboard but never
 * pollute the real numbers.
 */
export function canSendAnalytics(): boolean {
  if (!isAnalyticsConfigured || typeof window === 'undefined') return false;
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.endsWith('.run.app')) return false;
  return true;
}

// Only these Google accounts may open /stats. Keep in sync with firestore.rules.
export const STATS_ADMIN_EMAILS: readonly string[] = [
  'aboodalkhalil73@gmail.com',
  'ab3256792@gmail.com',
  'basim5252@gmail.com',
];

export const SESSIONS_COLLECTION = 'analytics_sessions';
export const GAME_STATS_COLLECTION = 'game_stats';
