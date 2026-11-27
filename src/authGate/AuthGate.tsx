import React, { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  errorKind,
  finishRedirect,
  isEmbeddedBrowser,
  signInPlayer,
  watchPlayer,
  type GateError,
} from './gateAuth';

// Mandatory Google sign-in: nothing from the game renders until a player is signed in.
// Stays signed in across visits (local persistence). Keep this wrapper in src/main.tsx —
// stats-kit/prebuild.mjs fails production builds if it is removed.

const MESSAGES: Record<GateError, string> = {
  cancelled: 'تم إلغاء الدخول. اضغط الزر وحاول مرة ثانية.',
  network: 'ما فيه اتصال بالإنترنت. تأكد من الشبكة وحاول مرة ثانية.',
  domain: 'هذا الرابط غير مفعّل للدخول بعد. تواصل مع صاحب اللعبة.',
  'in-app-browser': 'المتصفح هذا ما يدعم الدخول. افتح الرابط في كروم أو سفاري.',
  disabled: 'الدخول بغوغل غير مفعّل حالياً. تواصل مع صاحب اللعبة.',
  unknown: 'ما قدرنا ندخلك. حاول مرة ثانية.',
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    dir="rtl"
    lang="ar"
    className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950 text-white"
    style={{ background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #020617 70%)' }}
  >
    <div className="flex min-h-full items-center justify-center p-4">{children}</div>
  </div>
);

const GoogleMark: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
  </svg>
);

type Phase = 'loading' | 'out' | 'in';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<Phase>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<GateError | null>(null);
  const embedded = isEmbeddedBrowser();

  useEffect(() => {
    let alive = true;
    void finishRedirect().then((code) => {
      if (alive && code) setError(errorKind(code));
    });
    const stop = watchPlayer((u: User | null) => {
      if (!alive) return;
      setPhase(u ? 'in' : 'out');
      if (u) setError(null);
    });
    return () => {
      alive = false;
      stop();
    };
  }, []);

  const handleSignIn = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await signInPlayer();
      if (r === 'redirecting') return; // page is leaving
    } catch (e) {
      const code = (e as { code?: string }).code;
      console.warn('[gate] sign-in failed:', code);
      setError(errorKind(code));
    } finally {
      setBusy(false);
    }
  }, []);

  if (phase === 'in') return <>{children}</>;

  if (phase === 'loading') {
    return (
      <Shell>
        <p className="text-sm text-slate-400" role="status">جارٍ التحميل…</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <main
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-5 text-center shadow-2xl backdrop-blur sm:p-7"
        aria-labelledby="gate-title"
      >
        <div className="text-5xl leading-none sm:text-6xl" aria-hidden="true">🎯</div>
        <h1 id="gate-title" className="mt-2 text-2xl font-extrabold sm:text-3xl">صياد النقاط</h1>
        <p className="mt-1 text-sm text-slate-300 sm:text-base">
          سجّل دخولك بحساب غوغل عشان تبدأ اللعب وتحفظ تقدّمك
        </p>

        {embedded && (
          <p className="mt-3 rounded-xl bg-amber-500/15 p-2 text-xs text-amber-200" role="note">
            إذا فتحت الرابط من داخل تطبيق (واتساب/سناب/إنستغرام)، افتحه في كروم أو سفاري عشان يشتغل الدخول.
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleSignIn()}
          disabled={busy}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-base font-bold text-slate-900 shadow-lg active:scale-[0.98] disabled:opacity-60"
        >
          <GoogleMark />
          <span>{busy ? 'جارٍ الدخول…' : 'ادخل بحساب غوغل'}</span>
        </button>

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-rose-500/15 p-2 text-sm text-rose-200">
            {MESSAGES[error]}
          </p>
        )}

        <p className="mt-4 text-[11px] text-slate-500">Sign in with Google to play · Point Catcher</p>
      </main>
    </Shell>
  );
};

export default AuthGate;
