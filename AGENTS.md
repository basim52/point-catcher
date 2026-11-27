# Agent notes

Before changing anything in `src/analytics/`, `src/stats/`, `stats-kit/`, `vercel.json`,
`firestore.rules`, `src/main.tsx`, `src/App.tsx`, `src/miniGames.tsx` or `src/LandingBoard.tsx`,
read **STATS_KIT.md**. The private stats system must not be removed, rewritten, or pointed at
another Firebase project. Never touch gameplay or points when asked only to change stats.
Also keep the mandatory Google sign-in gate (src/authGate, wired in src/main.tsx) — the game must not render before login.
