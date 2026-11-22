import React, { useState } from 'react';
import { MAX_RALLY_LIVES, RallyHudSnapshot } from './types';

interface DesertRallyUIProps {
  lang: 'ar' | 'en';
  hud: RallyHudSnapshot;
  soundEnabled: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onToggleSound: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onNitro: () => void;
  onExit: () => void;
}

const COPY = {
  ar: {
    title: 'سباق الصحراء 3D',
    kicker: 'تحدي الطرق الصحراوية ثلاثي الأبعاد',
    subtitle:
      'انطلق بسيارة الرالي عبر طريق الوادي السريع، اقفز فوق الحواجز والصخور، اجمع العملات الذهبية، وفعّل تيربو النيترو!',
    start: 'ابدأ السباق',
    howToPlay: 'كيف ألعب',
    exit: 'خروج',
    exitToHub: 'خروج إلى الصالة',
    soundOn: 'الصوت: تشغيل',
    soundOff: 'الصوت: مكتوم',
    score: 'النقاط',
    distance: 'المسافة',
    speed: 'كم/س',
    bestScore: 'أفضل نتيجة',
    bestDist: 'أطول مسافة',
    nitroReady: 'تيربو جاهز!',
    nitroActive: 'تيربو نيترو ×2',
    nitroLabel: 'نيترو',
    shieldActive: 'درع نشط',
    pause: 'إيقاف',
    pausedTitle: 'السباق متوقف',
    resume: 'استئناف السباق',
    restart: 'إعادة السباق',
    gameOverTitle: 'انتهى السباق!',
    newRecord: 'رقم قياسي جديد! كفو عليك!',
    playAgain: 'العب مرة ثانية',
    howTitle: 'كيف تلعب سباق الصحراء 3D؟',
    howClose: 'إغلاق',
    howStart: 'فهمت — ابدأ السباق!',
    jumpBtn: 'قفز',
    rules: [
      'تنقّل بين المسارات الثلاثة لتفادي السيارات والصخور والحواجز.',
      'اقفز فوق الحواجز البرتقالية والصخور أو انطلق من منصّات القفز المضيئة لجمع العملات في الهواء.',
      'جمع العملات الذهبية (+10) وعبوات النيترو يشحن شريط النيترو؛ عند اكتماله اضغط نيترو لتحطيم العوائق ومضاعفة النقاط ×2!',
      'الدرع الأخضر يحمي سيارتك من اصطدام واحد دون خسارة قلب.',
      'التحكم بالجوال: اسحب يميناً أو يساراً لتغيير المسار، لأعلى للقفز، أو استخدم الأزرار السفلية.',
      'التحكم بالكمبيوتر: الأسهم أو A و D للمسار، مسافة أو سهم لأعلى للقفز، Shift للنيترو.',
    ],
  },
  en: {
    title: 'Desert Rally 3D',
    kicker: '3D Canyon Highway Arcade Racer',
    subtitle:
      'Blast across the sunset canyon highway in your 3D rally buggy, jump over barriers and boulders, collect gold coins, and ignite Turbo Nitro!',
    start: 'Start Race',
    howToPlay: 'How to Play',
    exit: 'Exit',
    exitToHub: 'Exit to Hub',
    soundOn: 'Sound: On',
    soundOff: 'Sound: Muted',
    score: 'Score',
    distance: 'Distance',
    speed: 'km/h',
    bestScore: 'Best Score',
    bestDist: 'Best Distance',
    nitroReady: 'NITRO READY!',
    nitroActive: 'TURBO NITRO ×2',
    nitroLabel: 'Nitro',
    shieldActive: 'Shield Active',
    pause: 'Pause',
    pausedTitle: 'Race Paused',
    resume: 'Resume Race',
    restart: 'Restart',
    gameOverTitle: 'Race Over!',
    newRecord: 'New High Score!',
    playAgain: 'Race Again',
    howTitle: 'How to Play Desert Rally 3D',
    howClose: 'Close',
    howStart: 'Got It — Start Racing!',
    jumpBtn: 'Jump',
    rules: [
      'Switch between 3 highway lanes to weave past rival SUVs, boulders, and barriers.',
      'Jump cleanly over road barriers and rocks, or hit glowing ramps for huge air and coin arcs.',
      'Gold coins (+10) and cyan Nitro cells charge your Turbo bar — trigger Nitro to smash through obstacles at ×2 points!',
      'Green Shield orbs absorb one crash without losing a heart.',
      'Mobile controls: swipe left/right to steer, swipe up to jump, or tap the thumb buttons.',
      'Desktop controls: Arrow keys or A/D to steer, Space/Up/W to jump, Shift/Down for Nitro.',
    ],
  },
} as const;

const HeartSvg: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5 sm:w-6 sm:h-6"
    fill={filled ? '#fb7185' : 'rgba(255,255,255,0.14)'}
    stroke={filled ? '#ffe4e6' : 'rgba(255,228,230,0.35)'}
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const SoundSvg: React.FC<{ enabled: boolean }> = ({ enabled }) => (
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    {enabled ? (
      <>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </>
    ) : (
      <>
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </>
    )}
  </svg>
);

export const DesertRallyUI: React.FC<DesertRallyUIProps> = ({
  lang,
  hud,
  soundEnabled,
  onStart,
  onPause,
  onResume,
  onRestart,
  onToggleSound,
  onMoveLeft,
  onMoveRight,
  onJump,
  onNitro,
  onExit,
}) => {
  const [showHow, setShowHow] = useState(false);
  const t = COPY[lang];
  const isAr = lang === 'ar';

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
      className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between select-none"
    >
      {/* TOP IN-GAME HUD */}
      {(hud.status === 'PLAYING' || hud.status === 'PAUSED') && (
        <div className="w-full px-3 sm:px-5 pt-3 sm:pt-4 flex flex-col gap-2">
          <div className="mx-auto w-full max-w-[960px] flex items-center justify-between gap-2">
            {/* Score, Distance & Speed */}
            <div className="rounded-xl bg-[#1a131c]/88 border border-orange-300/30 px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg flex items-center gap-2.5 sm:gap-3.5">
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] sm:text-xs font-semibold text-orange-200/80">
                  {t.score}
                </span>
                <span className="text-base sm:text-2xl font-black text-amber-300 tabular-nums leading-none">
                  {hud.score.toLocaleString('en-US')}
                </span>
              </div>
              <div className="h-7 w-px bg-white/15" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] sm:text-xs font-semibold text-orange-200/80">
                  {t.distance}
                </span>
                <span className="text-xs sm:text-base font-extrabold text-white tabular-nums leading-none">
                  {hud.distanceM}m
                </span>
              </div>
              <div className="hidden sm:block h-7 w-px bg-white/15" />
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-[10px] font-semibold text-sky-200/80">
                  {t.speed}
                </span>
                <span className="text-sm font-extrabold text-sky-300 tabular-nums leading-none">
                  {hud.speedKmh}
                </span>
              </div>
            </div>

            {/* Hearts + Shield indicator */}
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-[#1a131c]/88 border border-rose-300/25 px-2.5 sm:px-3 py-1.5 shadow-lg flex items-center gap-1">
                {Array.from({ length: MAX_RALLY_LIVES }).map((_, idx) => (
                  <HeartSvg key={idx} filled={idx < hud.lives} />
                ))}
              </div>
              {hud.shieldActive && (
                <div className="hidden sm:flex rounded-xl bg-emerald-950/90 border border-emerald-400/50 px-2.5 py-1.5 text-xs font-extrabold text-emerald-200 shadow-lg">
                  {t.shieldActive}
                </div>
              )}
            </div>

            {/* Sound & Pause buttons */}
            <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={onToggleSound}
                aria-label={soundEnabled ? t.soundOff : t.soundOn}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#1a131c]/88 hover:bg-[#2c2030] border border-orange-300/30 text-orange-100 flex items-center justify-center shadow-lg cursor-pointer"
              >
                <SoundSvg enabled={soundEnabled} />
              </button>
              <button
                type="button"
                onClick={hud.status === 'PAUSED' ? onResume : onPause}
                aria-label={t.pause}
                className="h-10 sm:h-11 px-3 sm:px-3.5 rounded-xl bg-orange-400 hover:bg-orange-300 active:scale-[0.97] text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
                <span className="hidden sm:inline">{t.pause}</span>
              </button>
            </div>
          </div>

          {/* Nitro Charge Gauge */}
          <div className="mx-auto w-full max-w-[260px] rounded-xl bg-[#1a131c]/88 border border-sky-400/35 px-3 py-1.5 shadow-lg">
            <div className="flex items-center justify-between text-[11px] font-extrabold mb-1">
              <span className={hud.nitroActive ? 'text-sky-300' : 'text-sky-100'}>
                {hud.nitroActive
                  ? t.nitroActive
                  : hud.nitroCharge >= 100
                  ? t.nitroReady
                  : t.nitroLabel}
              </span>
              <span className="tabular-nums text-sky-300">
                {hud.nitroActive ? 'MAX' : `${hud.nitroCharge}%`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-75"
                style={{
                  width: `${hud.nitroActive ? 100 : hud.nitroCharge}%`,
                  backgroundColor: hud.nitroActive ? '#38bdf8' : hud.nitroCharge >= 100 ? '#22d3ee' : '#0284c7',
                }}
              />
            </div>
          </div>

          {/* Sector Milestone Toast */}
          {hud.toast && (
            <div className="mx-auto mt-1 rounded-2xl bg-gradient-to-l from-orange-500 via-amber-400 to-orange-500 text-slate-950 px-5 py-1.5 shadow-2xl border-2 border-amber-100/80 text-center">
              <div className="text-base sm:text-lg font-black">{hud.toast}</div>
            </div>
          )}
        </div>
      )}

      {/* ERGONOMIC BOTTOM TOUCH CONTROLS DURING PLAY (never blocks center road) */}
      {hud.status === 'PLAYING' && (
        <div className="w-full px-3 sm:px-6 pb-4 sm:pb-5">
          <div
            dir="ltr"
            className="mx-auto w-full max-w-[900px] flex items-end justify-between gap-3"
          >
            {/* Left / Right Steering Buttons */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onMoveLeft();
                }}
                aria-label="Move Left"
                className="w-14 h-14 sm:w-15 sm:h-15 rounded-2xl bg-[#1a131c]/82 hover:bg-[#2c2030] active:scale-95 border border-orange-300/35 text-orange-100 flex items-center justify-center shadow-xl cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onMoveRight();
                }}
                aria-label="Move Right"
                className="w-14 h-14 sm:w-15 sm:h-15 rounded-2xl bg-[#1a131c]/82 hover:bg-[#2c2030] active:scale-95 border border-orange-300/35 text-orange-100 flex items-center justify-center shadow-xl cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Right-hand Jump + Nitro Buttons */}
            <div className="pointer-events-auto flex items-center gap-2">
              {hud.nitroCharge >= 100 && !hud.nitroActive && (
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onNitro();
                  }}
                  className="h-14 px-4 rounded-2xl bg-sky-400 hover:bg-sky-300 active:scale-95 text-slate-950 font-black text-sm shadow-xl border-2 border-sky-100 cursor-pointer"
                >
                  {t.nitroLabel}
                </button>
              )}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onJump();
                }}
                aria-label={t.jumpBtn}
                className="h-14 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-sm sm:text-base shadow-xl border border-amber-100/80 cursor-pointer"
              >
                {t.jumpBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* START SCREEN */}
      {hud.status === 'START' && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
          <div className="w-full max-w-[960px] mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={onExit}
              className="h-10 px-3.5 rounded-xl bg-[#1a131c]/88 hover:bg-[#2c2030] border border-orange-300/30 text-orange-100 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
            >
              <span>{t.exit}</span>
            </button>
            <button
              type="button"
              onClick={onToggleSound}
              className="h-10 px-3.5 rounded-xl bg-[#1a131c]/88 hover:bg-[#2c2030] border border-orange-300/30 text-orange-100 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
            >
              <SoundSvg enabled={soundEnabled} />
              <span>{soundEnabled ? t.soundOn : t.soundOff}</span>
            </button>
          </div>

          <div className="mx-auto w-full max-w-[450px] mb-4 sm:mb-8 rounded-3xl bg-[#19111b]/90 border border-orange-300/35 px-6 py-6 sm:px-8 sm:py-7 text-center shadow-2xl">
            <p className="text-xs sm:text-sm font-bold text-orange-300 mb-1">
              {t.kicker}
            </p>
            <h1
              className="font-black text-amber-50 leading-tight"
              style={{ fontSize: 'clamp(2.1rem, 5.5vw, 3.1rem)' }}
            >
              {t.title}
            </h1>
            <p className="text-xs sm:text-sm text-orange-100/85 mt-2 leading-relaxed">
              {t.subtitle}
            </p>

            {hud.bestScore > 0 && (
              <div className="mt-3.5 inline-flex items-center gap-3 rounded-xl bg-orange-500/15 border border-orange-300/30 px-4 py-1.5 text-xs sm:text-sm font-bold text-amber-200">
                <span>
                  {t.bestScore}:{' '}
                  <strong className="text-amber-300 tabular-nums">
                    {hud.bestScore.toLocaleString('en-US')}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{hud.bestDistanceM}m</span>
              </div>
            )}

            <div className="mt-5 flex flex-col sm:flex-row items-stretch justify-center gap-2.5">
              <button
                type="button"
                onClick={onStart}
                className="flex-1 h-12 rounded-2xl bg-gradient-to-b from-orange-400 to-amber-500 hover:from-orange-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 font-black text-lg shadow-xl cursor-pointer"
              >
                {t.start}
              </button>
              <button
                type="button"
                onClick={() => setShowHow(true)}
                className="sm:w-36 h-12 rounded-2xl bg-[#2d1e2f] hover:bg-[#3e2a41] border border-orange-300/35 text-orange-100 font-bold text-base cursor-pointer"
              >
                {t.howToPlay}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOW TO PLAY MODAL */}
      {showHow && (
        <div className="pointer-events-auto fixed inset-0 z-30 bg-[#100a12]/85 flex items-center justify-center p-4">
          <div className="w-full max-w-[500px] max-h-[85vh] rounded-3xl bg-[#1b121e] border border-orange-300/35 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-black text-amber-100">{t.howTitle}</h2>
              <button
                type="button"
                onClick={() => setShowHow(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-2.5 text-xs sm:text-sm text-orange-50/90 leading-relaxed">
              {t.rules.map((line, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-white/6 border border-white/10 px-3.5 py-2.5"
                >
                  {line}
                </div>
              ))}
            </div>
            <div className="px-5 py-3.5 border-t border-white/10 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowHow(false);
                  onStart();
                }}
                className="flex-1 h-11 rounded-xl bg-gradient-to-b from-orange-400 to-amber-500 text-slate-950 font-black text-sm sm:text-base cursor-pointer"
              >
                {t.howStart}
              </button>
              <button
                type="button"
                onClick={() => setShowHow(false)}
                className="px-4 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm cursor-pointer"
              >
                {t.howClose}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {hud.status === 'PAUSED' && (
        <div className="pointer-events-auto fixed inset-0 z-20 bg-[#100a12]/80 flex items-center justify-center p-4">
          <div className="w-full max-w-[360px] rounded-3xl bg-[#1b121e] border border-orange-300/35 p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-amber-100">{t.pausedTitle}</h2>
            <p className="text-xs sm:text-sm text-orange-200/80 mt-1 tabular-nums">
              {t.score}: {hud.score.toLocaleString('en-US')} · {hud.distanceM}m
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onResume}
                className="w-full h-12 rounded-2xl bg-gradient-to-b from-orange-400 to-amber-500 text-slate-950 font-black text-base cursor-pointer"
              >
                {t.resume}
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="w-full h-11 rounded-2xl bg-[#2d1e2f] hover:bg-[#3d2940] border border-orange-300/30 text-orange-100 font-bold text-sm cursor-pointer"
              >
                {t.restart}
              </button>
              <button
                type="button"
                onClick={onExit}
                className="w-full h-11 rounded-2xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-400/30 text-rose-100 font-bold text-sm cursor-pointer"
              >
                {t.exitToHub}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {hud.status === 'GAME_OVER' && (
        <div className="pointer-events-auto fixed inset-0 z-20 bg-[#100a12]/82 flex items-center justify-center p-4">
          <div className="w-full max-w-[390px] rounded-3xl bg-[#1b121e] border border-orange-300/40 p-6 sm:p-7 text-center shadow-2xl">
            {hud.isNewBest && (
              <div className="inline-block mb-2 rounded-xl bg-amber-400 text-slate-950 px-3 py-1 text-xs font-black">
                {t.newRecord}
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl font-black text-amber-100">
              {t.gameOverTitle}
            </h2>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/6 border border-orange-300/20 p-3.5">
                <div className="text-xs text-orange-200/80 font-semibold">
                  {t.score}
                </div>
                <div className="text-2xl font-black text-amber-300 tabular-nums mt-0.5">
                  {hud.score.toLocaleString('en-US')}
                </div>
              </div>
              <div className="rounded-2xl bg-white/6 border border-orange-300/20 p-3.5">
                <div className="text-xs text-orange-200/80 font-semibold">
                  {t.bestScore}
                </div>
                <div className="text-2xl font-black text-yellow-200 tabular-nums mt-0.5">
                  {hud.bestScore.toLocaleString('en-US')}
                </div>
              </div>
              <div className="rounded-2xl bg-white/6 border border-white/10 p-3">
                <div className="text-xs text-orange-200/75 font-semibold">
                  {t.distance}
                </div>
                <div className="text-lg font-extrabold text-white tabular-nums">
                  {hud.distanceM}m
                </div>
              </div>
              <div className="rounded-2xl bg-white/6 border border-white/10 p-3">
                <div className="text-xs text-orange-200/75 font-semibold">
                  {t.bestDist}
                </div>
                <div className="text-lg font-extrabold text-sky-300 tabular-nums">
                  {hud.bestDistanceM}m
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onRestart}
                className="w-full h-12 rounded-2xl bg-gradient-to-b from-orange-400 to-amber-500 hover:from-orange-300 hover:to-amber-400 text-slate-950 font-black text-lg shadow-xl cursor-pointer"
              >
                {t.playAgain}
              </button>
              <button
                type="button"
                onClick={onExit}
                className="w-full h-11 rounded-2xl bg-white/10 hover:bg-white/16 text-orange-100 font-bold text-sm cursor-pointer"
              >
                {t.exitToHub}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
