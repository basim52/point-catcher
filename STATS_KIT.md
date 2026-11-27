# Private stats system ("Stats Kit") — READ BEFORE EDITING

The owner's private analytics (visit counts, play minutes, the admin dashboard at `/stats`
and the in-game 📊 overlay) lives in **one dedicated Firebase project: `point-catcher-stats`**
(default Firestore database). It is separate from the AI Studio Firebase project in
`firebase-applet-config.json`, which is used **only** by Mario Party's own features.

## Rules for AI Studio / any agent (please obey)

1. **Never** make `src/analytics/*` or `src/stats/*` use `firebase-applet-config.json`
   or a named database. Analytics project = `point-catcher-stats`, database = `(default)`.
   (Doing this split the stats into a second database and the numbers "disappeared".)
2. **Do not delete or rewrite** these files: `src/analytics/*`, `src/stats/*`, `stats-kit/*`,
   `STATS_KIT.md`, `.github/workflows/stats-guard.yml`.
3. **Keep these hooks** when you edit the big files:
   - `src/main.tsx` — lazy `./stats/StatsPage` on the `/stats` route
   - `src/App.tsx` — `useGamePlayTracking(...)` and `<StatsOverlayHost />`
   - `src/miniGames.tsx` — `useGamePlayTracking(miniGameId(activeGame), …)`
   - `src/LandingBoard.tsx` — `AdminLongPressTitle` / `StatsAdminButton`
4. **New game?** Add its id to `src/analytics/games.ts` **and** to `isValidTrackedGameId` in
   `firestore.rules` (and ask the owner to deploy the rules to `point-catcher-stats`).
5. Keep `vercel.json` entries: `buildCommand`, the `/stats` rewrite, the CSP
   `frame-src`/`connect-src` Google+Firebase hosts, and the `/stats-config.json` header.
6. Never put Firebase keys in the repo (it is public). Config comes from Vercel env vars
   `VITE_FIREBASE_API_KEY / AUTH_DOMAIN / PROJECT_ID / APP_ID`.

## How it protects itself

- `node stats-kit/prebuild.mjs` runs before every build (`npm run build` → `prebuild`, and Vercel's
  `buildCommand`). It checks all the hooks above. On a **Vercel production** build any damage
  **fails the build**, so the last good deployment (with working stats) stays online.
  Set Vercel env `STATS_GUARD=warn` to temporarily allow a deploy anyway.
- The same check runs on GitHub for every push/PR (`stats-guard` workflow).
- The script also writes `public/stats-config.json` (public web config, gitignored) so hosts with no
  env vars (AI Studio preview) read the **same** project instead of a different one.
- Writes (visits / play time) are only sent from real hosts; `localhost` and AI Studio preview
  (`*.run.app`) can read the dashboard but never pollute the numbers.

## Restoring damaged hooks

Run `node stats-kit/prebuild.mjs` — it lists exactly what is missing. Restore the files from git
history (`git log -- src/stats`) or the last merged stats PR, then re-add the hook lines listed above.
