import { lazy, Suspense } from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthGate } from './authGate/AuthGate';

// Private dashboard lives at /stats and is not linked from the game.
// It is lazy-loaded so the game bundle never includes Firebase.
const StatsPage = lazy(() => import('./stats/StatsPage'));
const isStatsRoute = /^\/stats\/?$/.test(window.location.pathname);

createRoot(document.getElementById('root')!).render(
  isStatsRoute ? (
    <Suspense fallback={null}>
      <StatsPage />
    </Suspense>
  ) : (
    // Mandatory Google sign-in comes first; the game only renders after login.
    <AuthGate>
      <App />
    </AuthGate>
  )
);
