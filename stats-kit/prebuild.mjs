// Stats Kit — build-time guard + public config writer. Zero dependencies.
//
//   node stats-kit/prebuild.mjs            (runs automatically before every build)
//
// 1. GUARD: checks that every piece of the private stats system is still wired in
//    (AI Studio rewrites whole files; this catches it before it reaches production).
// 2. CONFIG: writes public/stats-config.json from the VITE_FIREBASE_* env vars so that
//    hosts without env vars (AI Studio preview) read the SAME project, never another one.
//
// Strictness: on a Vercel PRODUCTION build any error fails the build, so the last good
// deployment (with working stats) stays live. Everywhere else it only warns.
// Override on Vercel with env STATS_GUARD=warn (or =strict).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => (existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8') : null);
const errors = [];
const warns = [];

const mustExist = [
  'src/analytics/config.ts', 'src/analytics/games.ts', 'src/analytics/tracker.ts', 'src/analytics/visits.ts',
  'src/stats/StatsPage.tsx', 'src/stats/InGameStats.tsx', 'src/stats/firebaseClient.ts',
  'src/stats/aggregate.ts', 'src/stats/adminAccess.ts', 'src/authGate/AuthGate.tsx', 'src/authGate/gateAuth.ts', 'firestore.rules', 'vercel.json',
];
for (const f of mustExist) if (read(f) === null) errors.push(`missing file: ${f}`);

const mustContain = (file, needle, why) => {
  const s = read(file);
  if (s === null) return; // already reported above or optional
  if (!s.includes(needle)) errors.push(`${file}: missing "${needle}" — ${why}`);
};

// Entry hooks AI Studio tends to rewrite.
mustContain('src/main.tsx', 'stats/StatsPage', 'the /stats route is gone');
mustContain('src/main.tsx', 'AuthGate', 'the mandatory Google sign-in gate is gone');
mustContain('src/authGate/AuthGate.tsx', 'signInPlayer', 'the sign-in gate was rewritten');
mustContain('src/App.tsx', 'StatsOverlayHost', 'in-game admin dashboard overlay is gone');
mustContain('src/App.tsx', 'useGamePlayTracking', 'world play tracking is gone');
mustContain('src/miniGames.tsx', 'useGamePlayTracking', 'mini-game play tracking is gone');
mustContain('src/LandingBoard.tsx', 'AdminLongPressTitle', 'hidden admin entry is gone');

// Config must stay pinned to the stats project and never use the AI Studio applet project.
const cfg = read('src/analytics/config.ts');
if (cfg !== null) {
  if (/from\s+['"][^'"]*firebase-applet-config/.test(cfg)) errors.push('src/analytics/config.ts imports firebase-applet-config.json — that splits stats into a second database');
  if (!cfg.includes("ANALYTICS_PROJECT_ID = 'point-catcher-stats'")) errors.push('src/analytics/config.ts: analytics is no longer pinned to project point-catcher-stats');
  if (!cfg.includes("analyticsFirestoreDatabaseId = '(default)'")) errors.push("src/analytics/config.ts: analytics database must be '(default)'");
}

// Deployment config.
const vj = read('vercel.json');
if (vj !== null) {
  for (const n of ['point-catcher-stats.firebaseapp.com', 'apis.google.com', 'accounts.google.com', '/stats', '/stats-config.json']) {
    if (!vj.includes(n)) errors.push(`vercel.json: missing "${n}" (CSP/rewrite/CORS needed by stats)`);
  }
}

// Firestore rules must still contain the analytics collections.
const rules = read('firestore.rules');
if (rules !== null) {
  for (const n of ['analytics_sessions', 'game_stats']) {
    if (!rules.includes(n)) errors.push(`firestore.rules: missing collection rules for ${n}`);
  }
  // Every tracked game id should be accepted by the rules (else its visits are silently rejected).
  const games = read('src/analytics/games.ts') ?? '';
  const ids = [...games.matchAll(/'((?:mini|world)-[a-z0-9-]+)'\s*:/g)].map((m) => m[1]);
  const missing = ids.filter((id) => !rules.includes(`'${id}'`));
  if (missing.length) warns.push(`firestore.rules does not list tracked game id(s): ${missing.join(', ')} — their visits would be rejected. Rules must be updated + deployed to point-catcher-stats.`);
}

// Env for the production build.
const env = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};
const envOk = Boolean(env.apiKey && env.authDomain && env.appId && env.projectId === 'point-catcher-stats');
const onVercel = Boolean(process.env.VERCEL);
if (!envOk) {
  const msg = 'VITE_FIREBASE_API_KEY / AUTH_DOMAIN / PROJECT_ID(=point-catcher-stats) / APP_ID are not all set for this build — stats would be off';
  if (onVercel) errors.push(msg);
  else warns.push(msg);
}

// Write the PUBLIC web config (not secret; it already ships in the bundle) for env-less hosts.
if (envOk) {
  mkdirSync(join(root, 'public'), { recursive: true });
  writeFileSync(join(root, 'public/stats-config.json'), JSON.stringify(env) + '\n');
}

for (const w of warns) console.warn(`[stats-kit] WARN  ${w}`);
for (const e of errors) console.error(`[stats-kit] ERROR ${e}`);

const mode = process.env.STATS_GUARD || (process.env.VERCEL_ENV === 'production' ? 'strict' : 'warn');
if (errors.length) {
  console.error('[stats-kit] The private stats system was damaged (see STATS_KIT.md to restore it).');
  if (mode === 'strict') {
    console.error('[stats-kit] Failing this build so the last good deployment stays live.');
    process.exit(1);
  }
  console.warn('[stats-kit] Continuing because this is not a strict (production) build.');
} else {
  console.log('[stats-kit] OK — stats wiring intact.');
}
