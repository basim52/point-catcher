import appletFirebaseConfig from '../../firebase-applet-config.json';

// Public Firebase web config comes from Vite env vars (set them in Vercel).
// When Vite env vars are not set (e.g. AI Studio preview), fall back to
// firebase-applet-config.json and its named Firestore database ID.
const hasViteEnvConfig = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
);

export const firebaseWebConfig = hasViteEnvConfig
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
      appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
    }
  : {
      apiKey: appletFirebaseConfig.apiKey as string | undefined,
      authDomain: appletFirebaseConfig.authDomain as string | undefined,
      projectId: appletFirebaseConfig.projectId as string | undefined,
      appId: appletFirebaseConfig.appId as string | undefined,
    };

export const analyticsFirestoreDatabaseId: string = hasViteEnvConfig
  ? '(default)'
  : appletFirebaseConfig.firestoreDatabaseId || '(default)';

export const isAnalyticsConfigured = Boolean(
  firebaseWebConfig.apiKey &&
    firebaseWebConfig.authDomain &&
    firebaseWebConfig.projectId &&
    firebaseWebConfig.appId
);

// Only these Google accounts may open /stats. Keep in sync with firestore.rules.
export const STATS_ADMIN_EMAILS: readonly string[] = [
  'aboodalkhalil73@gmail.com',
  'ab3256792@gmail.com',
  'basim5252@gmail.com',
];

export const SESSIONS_COLLECTION = 'analytics_sessions';
export const GAME_STATS_COLLECTION = 'game_stats';
