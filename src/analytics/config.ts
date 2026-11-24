// Public Firebase web config comes from Vite env vars (set them in Vercel).
// If any is missing, tracking silently does nothing and the game is unaffected.
export const firebaseWebConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

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
];

export const SESSIONS_COLLECTION = 'analytics_sessions';
