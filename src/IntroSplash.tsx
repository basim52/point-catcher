import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearCustomIntroAudio,
  loadCustomIntroAudio,
  playSignatureIntroFanfare,
  saveCustomIntroAudio,
} from './introAudio';

export interface IntroSplashProps {
  lang: 'ar' | 'en';
  musicEnabled: boolean;
  onComplete: () => void;
}

const INTRO_DURATION_MS = 3800;

const SPLASH_COPY = {
  ar: {
    brand: 'صياد النقاط',
    tagline: 'عوالم النقاط · صالة الألعاب',
    enterBtn: 'دخول',
    skipBtn: 'تخطي',
    tapForSound: 'اضغط لتشغيل الموسيقى',
    playingSignature: 'موسيقى الافتتاح الخاصة',
    playingCustom: (name: string) => `موسيقاك: ${name}`,
    uploadCustomBtn: 'اختر موسيقاي الخاصة (MP3 / WAV)',
    resetDefaultBtn: 'استعادة الافتراضية',
    uploadError: 'تعذّر حفظ الملف الصوتي — جرّب ملف MP3 أو WAV.',
  },
  en: {
    brand: 'Point Catcher',
    tagline: 'Arcade Worlds · Mini-Games Hub',
    enterBtn: 'Enter',
    skipBtn: 'Skip',
    tapForSound: 'Tap to play intro music',
    playingSignature: 'Signature Opening Theme',
    playingCustom: (name: string) => `Your Music: ${name}`,
    uploadCustomBtn: 'Use My Own Music (MP3 / WAV)',
    resetDefaultBtn: 'Reset Default',
    uploadError: 'Could not save audio file — try an MP3 or WAV file.',
  },
} as const;

export const IntroSplash: React.FC<IntroSplashProps> = ({
  lang,
  musicEnabled,
  onComplete,
}) => {
  const t = SPLASH_COPY[lang];
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [customTrackName, setCustomTrackName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const customBlobUrlRef = useRef<string | null>(null);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const stopFanfareRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const completedRef = useRef(false);
  const timerStartRef = useRef<number>(performance.now());
  const pausedForPickerRef = useRef<boolean>(false);

  const stopAllIntroAudio = useCallback(() => {
    if (stopFanfareRef.current) {
      stopFanfareRef.current();
      stopFanfareRef.current = null;
    }
    if (htmlAudioRef.current) {
      try {
        htmlAudioRef.current.pause();
        htmlAudioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
      htmlAudioRef.current = null;
    }
  }, []);

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setExiting(true);
    stopAllIntroAudio();
    window.setTimeout(() => {
      onComplete();
    }, 320);
  }, [onComplete, stopAllIntroAudio]);

  const startIntroAudio = useCallback(
    async (explicitBlobUrl?: string | null) => {
      if (!musicEnabled) {
        setAudioStarted(false);
        setNeedsGesture(false);
        return;
      }
      stopAllIntroAudio();

      const blobUrl =
        explicitBlobUrl !== undefined ? explicitBlobUrl : customBlobUrlRef.current;

      if (blobUrl) {
        const audio = new Audio(blobUrl);
        audio.volume = 0.82;
        htmlAudioRef.current = audio;
        try {
          await audio.play();
          setAudioStarted(true);
          setNeedsGesture(false);
          return;
        } catch {
          setAudioStarted(false);
          setNeedsGesture(true);
          return;
        }
      }

      const res = playSignatureIntroFanfare();
      if (res.started) {
        stopFanfareRef.current = res.stop;
        setAudioStarted(true);
        setNeedsGesture(false);
      } else {
        setAudioStarted(false);
        setNeedsGesture(true);
      }
    },
    [musicEnabled, stopAllIntroAudio]
  );

  // Trigger entrance animation and load custom track (if any) on mount
  useEffect(() => {
    let cancelled = false;
    const enterTimer = window.setTimeout(() => setEntered(true), 40);

    (async () => {
      const stored = await loadCustomIntroAudio();
      if (cancelled) return;
      if (stored) {
        const url = URL.createObjectURL(stored.blob);
        customBlobUrlRef.current = url;
        setCustomTrackName(stored.name);
        await startIntroAudio(url);
      } else {
        await startIntroAudio(null);
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(enterTimer);
      stopAllIntroAudio();
      if (customBlobUrlRef.current) {
        URL.revokeObjectURL(customBlobUrlRef.current);
        customBlobUrlRef.current = null;
      }
    };
  }, [startIntroAudio, stopAllIntroAudio]);

  // Smooth auto-advance progress bar (pauses while user is picking a custom audio file)
  useEffect(() => {
    timerStartRef.current = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      if (completedRef.current) return;
      if (pausedForPickerRef.current) {
        timerStartRef.current = now - (progress / 100) * INTRO_DURATION_MS;
        rafId = window.requestAnimationFrame(tick);
        return;
      }
      const elapsed = now - timerStartRef.current;
      const pct = Math.min(100, (elapsed / INTRO_DURATION_MS) * 100);
      setProgress(pct);
      if (elapsed >= INTRO_DURATION_MS) {
        finishIntro();
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishIntro]);

  const handleUnlockAudio = useCallback(async () => {
    timerStartRef.current = performance.now();
    setProgress(0);
    await startIntroAudio();
  }, [startIntroAudio]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      pausedForPickerRef.current = false;
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;

      setErrorMsg('');
      try {
        const meta = await saveCustomIntroAudio(file);
        if (customBlobUrlRef.current) {
          URL.revokeObjectURL(customBlobUrlRef.current);
        }
        const url = URL.createObjectURL(file);
        customBlobUrlRef.current = url;
        setCustomTrackName(meta.name);
        timerStartRef.current = performance.now();
        setProgress(0);
        await startIntroAudio(url);
      } catch {
        setErrorMsg(t.uploadError);
      }
    },
    [startIntroAudio, t.uploadError]
  );

  const handleOpenFilePicker = useCallback(() => {
    pausedForPickerRef.current = true;
    const onFocusBack = () => {
      window.setTimeout(() => {
        pausedForPickerRef.current = false;
      }, 300);
      window.removeEventListener('focus', onFocusBack);
    };
    window.addEventListener('focus', onFocusBack);
    fileInputRef.current?.click();
  }, []);

  const handleResetDefaultAudio = useCallback(async () => {
    await clearCustomIntroAudio();
    if (customBlobUrlRef.current) {
      URL.revokeObjectURL(customBlobUrlRef.current);
      customBlobUrlRef.current = null;
    }
    setCustomTrackName(null);
    setErrorMsg('');
    timerStartRef.current = performance.now();
    setProgress(0);
    await startIntroAudio(null);
  }, [startIntroAudio]);

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      onClick={() => {
        if (needsGesture) {
          void handleUnlockAudio();
        }
      }}
      className={`fixed inset-0 z-[60] bg-[#050a14] text-slate-100 flex flex-col items-center justify-between px-4 py-5 sm:px-8 sm:py-7 overflow-hidden select-none transition-opacity duration-300 ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle Radial Cosmic Spotlight Behind Crest */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(56,189,248,0.16) 0%, rgba(251,191,36,0.06) 32%, rgba(5,10,20,0) 68%)',
        }}
        aria-hidden="true"
      />

      {/* Top Bar: Audio Status + Skip Button */}
      <div className="relative z-10 w-full max-w-[960px] flex items-center justify-between gap-3">
        <div className="text-xs text-slate-400 truncate">
          {customTrackName
            ? t.playingCustom(customTrackName)
            : audioStarted
            ? t.playingSignature
            : ''}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            finishIntro();
          }}
          className="h-9 px-3.5 rounded-lg border border-white/12 bg-slate-900/75 hover:bg-slate-800 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {t.skipBtn}
        </button>
      </div>

      {/* Center Emblem Logo Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto max-w-md">
        {/* Sculpted Geometric Point Catcher Crest */}
        <div
          className={`relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center transition-all duration-700 ease-out ${
            entered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
        >
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full drop-shadow-[0_12px_40px_rgba(56,189,248,0.32)]"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="crestRing" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="52%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
              <linearGradient id="prismFill" x1="100" y1="34" x2="100" y2="122" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fef9c3" />
                <stop offset="48%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="catcherArc" x1="48" y1="138" x2="152" y2="138" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>

            {/* Outer Hex-Shield Crest */}
            <polygon
              points="100,10 178,55 178,145 100,190 22,145 22,55"
              fill="#0a1426"
              stroke="url(#crestRing)"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            <polygon
              points="100,22 167,61 167,139 100,178 33,139 33,61"
              fill="none"
              stroke="rgba(255,255,255,0.09)"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />

            {/* Orbiting Gem Accents */}
            <circle cx="52" cy="74" r="7.5" fill="#f472b6" stroke="#fbcfe8" strokeWidth="1.8" />
            <polygon points="148,66 156,80 140,80" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1.6" strokeLinejoin="round" />

            {/* Central Royal Golden Star Gem */}
            <path
              d="M100 38L113 70L145 83L113 96L100 128L87 96L55 83L87 70L100 38Z"
              fill="url(#prismFill)"
              stroke="#fefce8"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M100 54L107 75L128 83L107 91L100 112L93 91L72 83L93 75L100 54Z"
              fill="#fffbeb"
              opacity="0.55"
            />

            {/* Stylized Catcher Craft Arc */}
            <path
              d="M52 132C66 146 82 152 100 152C118 152 134 146 148 132"
              stroke="url(#catcherArc)"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M66 138C77 144 88 147 100 147C112 147 123 144 134 138"
              stroke="#e0f2fe"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Brand Wordmark */}
        <h1
          className={`mt-5 font-bold tracking-tight text-white text-balance transition-all duration-700 delay-150 ${
            entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
          style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}
        >
          {t.brand}
        </h1>

        <p
          className={`mt-2 text-xs sm:text-sm font-medium text-sky-300/90 transition-all duration-700 delay-300 ${
            entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          {t.tagline}
        </p>

        {/* Primary Action / Sound Unlock */}
        <div
          className={`mt-7 flex flex-wrap items-center justify-center gap-2.5 transition-all duration-700 delay-300 ${
            entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          {needsGesture && musicEnabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void handleUnlockAudio();
              }}
              className="h-10 px-4 rounded-xl border border-amber-300/45 bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
              <span>{t.tapForSound}</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              finishIntro();
            }}
            className="h-10 px-6 rounded-xl bg-sky-400 hover:bg-sky-300 active:scale-[0.98] text-slate-950 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer"
          >
            {t.enterBtn}
          </button>
        </div>
      </div>

      {/* Bottom Controls: Upload Your Own Opening Music + Subtle Progress Line */}
      <div
        className="relative z-10 w-full max-w-[540px] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <button
            type="button"
            onClick={handleOpenFilePicker}
            className="text-slate-300 hover:text-sky-300 font-semibold transition-colors underline underline-offset-4 cursor-pointer"
          >
            {t.uploadCustomBtn}
          </button>

          {customTrackName && (
            <>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <button
                type="button"
                onClick={() => void handleResetDefaultAudio()}
                className="text-rose-300 hover:text-rose-200 font-semibold transition-colors cursor-pointer"
              >
                {t.resetDefaultBtn}
              </button>
            </>
          )}
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-300 text-center">{errorMsg}</p>
        )}

        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-amber-300 to-pink-400 transition-transform duration-100 origin-left"
            style={{
              transform: `scaleX(${Math.max(0, Math.min(1, progress / 100))})`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
