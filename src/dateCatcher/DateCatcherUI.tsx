import React, { useState } from 'react';
import {
  HudSnapshot,
  MAX_LIVES,
  POWERUP_META,
  PowerUpKind,
} from './types';

interface DateCatcherUIProps {
  hud: HudSnapshot;
  soundEnabled: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onToggleSound: () => void;
  onExit: () => void;
}

const HeartIcon: React.FC<{ filled: boolean; className?: string }> = ({
  filled,
  className = 'w-6 h-6',
}) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill={filled ? '#fb7185' : 'rgba(255,255,255,0.12)'}
    stroke={filled ? '#ffe4e6' : 'rgba(255,228,230,0.35)'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const PowerUpIcon: React.FC<{ kind: PowerUpKind; className?: string }> = ({
  kind,
  className = 'w-5 h-5',
}) => {
  if (kind === 'magnet') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 4v7a6 6 0 0 0 12 0V4" />
        <line x1="4" y1="4" x2="8" y2="4" />
        <line x1="16" y1="4" x2="20" y2="4" />
        <line x1="6" y1="8" x2="8" y2="8" />
        <line x1="16" y1="8" x2="18" y2="8" />
      </svg>
    );
  }
  if (kind === 'big_basket') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 11h18l-2.2 7.5a2 2 0 0 1-1.9 1.5H7.1a2 2 0 0 1-1.9-1.5L3 11z" />
        <path d="M6 7l-3 3m15-3l3 3" />
        <line x1="8" y1="15" x2="16" y2="15" />
      </svg>
    );
  }
  if (kind === 'slow_mo') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="13" r="8" />
        <polyline points="12 9 12 13 15 15" />
        <line x1="9" y1="2" x2="15" y2="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
};

const SoundIcon: React.FC<{ enabled: boolean; className?: string }> = ({
  enabled,
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
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

const RuleItemIcon: React.FC<{
  kind: 'date' | 'golden' | 'rutab' | 'stone' | 'wasp';
}> = ({ kind }) => {
  if (kind === 'date') {
    return (
      <svg viewBox="0 0 36 36" className="w-9 h-9 shrink-0" aria-hidden="true">
        <ellipse cx="18" cy="19" rx="9" ry="12" fill="#7c3818" stroke="#c27a46" strokeWidth="1.5" />
        <ellipse cx="14.5" cy="15" rx="2.6" ry="5" fill="#d9945a" opacity="0.45" />
        <circle cx="18" cy="7.5" r="2.6" fill="#d4a04a" />
      </svg>
    );
  }
  if (kind === 'golden') {
    return (
      <svg viewBox="0 0 36 36" className="w-9 h-9 shrink-0" aria-hidden="true">
        <ellipse cx="18" cy="19" rx="9.5" ry="12" fill="#f5b82e" stroke="#fef08a" strokeWidth="1.6" />
        <ellipse cx="14.5" cy="15" rx="2.8" ry="5.5" fill="#fffbeb" opacity="0.7" />
        <path d="M27 8l1.2 2.8L31 12l-2.8 1.2L27 16l-1.2-2.8L23 12l2.8-1.2z" fill="#fef08a" />
      </svg>
    );
  }
  if (kind === 'rutab') {
    return (
      <svg viewBox="0 0 36 36" className="w-9 h-9 shrink-0" aria-hidden="true">
        <path d="M18 4v7" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="13" cy="16" r="4.8" fill="#d97706" stroke="#fde68a" strokeWidth="1.2" />
        <circle cx="23" cy="16" r="4.8" fill="#f59e0b" stroke="#fde68a" strokeWidth="1.2" />
        <circle cx="18" cy="23" r="5" fill="#b45309" stroke="#fde68a" strokeWidth="1.2" />
        <circle cx="18" cy="14" r="4.6" fill="#fbbf24" stroke="#fef3c7" strokeWidth="1.2" />
      </svg>
    );
  }
  if (kind === 'stone') {
    return (
      <svg viewBox="0 0 36 36" className="w-9 h-9 shrink-0" aria-hidden="true">
        <polygon
          points="10,10 23,7 30,16 26,27 13,29 6,21"
          fill="#6b7280"
          stroke="#cbd5e1"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <polygon points="10,10 23,7 20,17 9,18" fill="#9ca3af" opacity="0.55" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 36 36" className="w-9 h-9 shrink-0" aria-hidden="true">
      <ellipse cx="14" cy="12" rx="6" ry="3.2" transform="rotate(-24 14 12)" fill="#e0f2fe" opacity="0.88" />
      <ellipse cx="22" cy="12" rx="6" ry="3.2" transform="rotate(24 22 12)" fill="#e0f2fe" opacity="0.88" />
      <ellipse cx="18" cy="21" rx="8.5" ry="6.2" fill="#facc15" stroke="#1f2937" strokeWidth="1.5" />
      <line x1="13" y1="15.5" x2="13" y2="26.5" stroke="#18181b" strokeWidth="2.8" />
      <line x1="18.5" y1="15" x2="18.5" y2="27" stroke="#18181b" strokeWidth="2.8" />
      <line x1="23.5" y1="16.5" x2="23.5" y2="25.5" stroke="#18181b" strokeWidth="2.4" />
    </svg>
  );
};

export const DateCatcherUI: React.FC<DateCatcherUIProps> = ({
  hud,
  soundEnabled,
  onStart,
  onPause,
  onResume,
  onRestart,
  onToggleSound,
  onExit,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const fontStyle: React.CSSProperties = {
    fontFamily: "'Cairo', 'Tajawal', sans-serif",
  };

  const activePowerMeta = hud.activePowerUp
    ? POWERUP_META[hud.activePowerUp.kind]
    : null;
  const powerPct = hud.activePowerUp
    ? Math.max(
        0,
        Math.min(100, (hud.activePowerUp.remaining / hud.activePowerUp.duration) * 100)
      )
    : 0;

  // Progress toward next combo multiplier (every 5 dates -> x2 at 5, x3 at 10)
  const streakInTier = hud.comboStreak >= 10 ? 5 : hud.comboStreak % 5;

  return (
    <div
      dir="rtl"
      style={fontStyle}
      className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between select-none"
    >
      {/* IN-GAME TOP HUD (visible during PLAYING & PAUSED) */}
      {(hud.status === 'PLAYING' || hud.status === 'PAUSED') && (
        <div className="w-full px-3 sm:px-5 pt-3 sm:pt-4 flex flex-col gap-2">
          <div className="mx-auto w-full max-w-[920px] flex items-center justify-between gap-2">
            {/* Start Side: Score + Level + Combo */}
            <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
              <div className="rounded-xl bg-[#261209]/88 border border-amber-300/30 px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg flex items-center gap-2.5">
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] sm:text-xs font-semibold text-amber-200/80">
                    النقاط
                  </span>
                  <span className="text-lg sm:text-2xl font-extrabold text-amber-300 tabular-nums leading-none">
                    {hud.score.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="h-7 w-px bg-amber-200/20" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] sm:text-xs font-semibold text-amber-200/80">
                    المستوى
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-amber-50 whitespace-nowrap">
                    {hud.isEndless ? 'لا نهائي' : `${hud.level}`}
                  </span>
                </div>
              </div>

              {/* Combo Meter */}
              {(hud.comboStreak > 0 || hud.comboMultiplier > 1) && (
                <div className="rounded-xl bg-[#361708]/90 border border-amber-400/45 px-2.5 sm:px-3 py-1.5 shadow-lg flex flex-col items-center justify-center min-w-[66px]">
                  <div className="flex items-center gap-1 leading-none">
                    <span className="text-[10px] font-bold text-amber-200">
                      كومبو
                    </span>
                    <span
                      className={`text-sm sm:text-base font-black tabular-nums ${
                        hud.comboMultiplier === 3
                          ? 'text-yellow-300'
                          : hud.comboMultiplier === 2
                          ? 'text-amber-300'
                          : 'text-orange-200'
                      }`}
                    >
                      ×{hud.comboMultiplier}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          idx < streakInTier
                            ? 'bg-amber-300'
                            : 'bg-amber-100/25'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Center: 3 Hearts */}
            <div
              className="rounded-xl bg-[#261209]/85 border border-rose-300/25 px-2.5 sm:px-3.5 py-1.5 shadow-lg flex items-center gap-1 sm:gap-1.5"
              aria-label={`القلوب المتبقية ${hud.lives} من ${MAX_LIVES}`}
            >
              {Array.from({ length: MAX_LIVES }).map((_, idx) => (
                <HeartIcon
                  key={idx}
                  filled={idx < hud.lives}
                  className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200"
                />
              ))}
            </div>

            {/* End Corner: Sound Toggle + Clear Pause Button */}
            <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={onToggleSound}
                aria-label={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
                title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#261209]/88 hover:bg-[#3a1d0f] border border-amber-300/30 text-amber-100 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
              >
                <SoundIcon enabled={soundEnabled} className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={hud.status === 'PAUSED' ? onResume : onPause}
                aria-label="إيقاف مؤقت"
                title="إيقاف مؤقت"
                className="h-10 sm:h-11 px-3 sm:px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.97] text-[#2a1205] font-extrabold text-xs sm:text-sm shadow-lg inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 shrink-0"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
                <span className="hidden sm:inline">إيقاف</span>
              </button>
            </div>
          </div>

          {/* Active Power-Up Indicator with 7s Countdown Bar */}
          {hud.activePowerUp && activePowerMeta && (
            <div className="mx-auto w-full max-w-[270px] rounded-xl bg-[#241108]/90 border border-amber-300/35 px-3 py-2 shadow-lg">
              <div className="flex items-center justify-between gap-2 text-xs font-bold text-amber-50 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[#1d0e06]"
                    style={{ backgroundColor: activePowerMeta.color }}
                  >
                    <PowerUpIcon
                      kind={hud.activePowerUp.kind}
                      className="w-4 h-4"
                    />
                  </span>
                  <span>{activePowerMeta.nameAr}</span>
                </div>
                <span className="tabular-nums text-amber-200">
                  {hud.activePowerUp.remaining.toFixed(1)} ث
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-75"
                  style={{
                    width: `${powerPct}%`,
                    backgroundColor: activePowerMeta.color,
                  }}
                />
              </div>
            </div>
          )}

          {/* Saudi Dialect Level-Up Encouragement Toast */}
          {hud.levelToast && (
            <div className="mx-auto mt-1 rounded-2xl bg-gradient-to-l from-amber-500 via-yellow-400 to-amber-500 text-[#2c1104] px-5 py-2 shadow-2xl border-2 border-amber-100/80 text-center">
              <div className="text-xs font-extrabold opacity-80">
                {hud.isEndless
                  ? 'الوضع اللانهائي'
                  : `المستوى ${hud.level}`}
              </div>
              <div className="text-lg sm:text-xl font-black leading-tight">
                {hud.levelToast}
              </div>
            </div>
          )}
        </div>
      )}

      {/* START SCREEN OVERLAY (over the live 3D sunset oasis) */}
      {hud.status === 'START' && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
          {/* Top corner utility bar: Exit & Sound */}
          <div className="w-full max-w-[960px] mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={onExit}
              className="h-10 px-3.5 rounded-xl bg-[#261209]/88 hover:bg-[#3a1c0e] border border-amber-200/30 text-amber-100 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>خروج</span>
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
              className="h-10 px-3.5 rounded-xl bg-[#261209]/88 hover:bg-[#3a1c0e] border border-amber-200/30 text-amber-100 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
            >
              <SoundIcon enabled={soundEnabled} className="w-4 h-4" />
              <span>{soundEnabled ? 'الصوت: تشغيل' : 'الصوت: مكتوم'}</span>
            </button>
          </div>

          {/* Center-Bottom Title & Start Actions so the 3D oasis & hero palm shine */}
          <div className="mx-auto w-full max-w-[440px] mb-4 sm:mb-8 rounded-3xl bg-[#231108]/88 border border-amber-300/35 px-6 py-6 sm:px-8 sm:py-7 text-center shadow-2xl">
            <p className="text-xs sm:text-sm font-bold text-amber-300 tracking-wide mb-1">
              مغامرة مزرعة النخيل ثلاثية الأبعاد
            </p>
            <h1
              className="font-black text-amber-50 leading-tight drop-shadow-md"
              style={{ fontSize: 'clamp(2.35rem, 6vw, 3.4rem)' }}
            >
              صيد التمر
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/85 mt-2 leading-relaxed">
              حرّك سلة الخوص لالتقاط التمر والرطب الذهبي قبل سقوطها، وتجنّب
              الحصى والدبابير!
            </p>

            {hud.bestScore > 0 && (
              <div className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-300/30 px-4 py-1.5 text-xs sm:text-sm font-bold text-amber-200">
                <span>أفضل نتيجة:</span>
                <span className="text-base font-black text-amber-300 tabular-nums">
                  {hud.bestScore.toLocaleString('en-US')}
                </span>
              </div>
            )}

            <div className="mt-5 flex flex-col sm:flex-row items-stretch justify-center gap-2.5">
              <button
                type="button"
                onClick={onStart}
                className="flex-1 h-12 sm:h-13 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 active:scale-[0.98] text-[#2a1104] font-black text-lg shadow-xl transition-all cursor-pointer"
              >
                ابدأ
              </button>
              <button
                type="button"
                onClick={() => setShowHowToPlay(true)}
                className="sm:w-36 h-12 sm:h-13 rounded-2xl bg-[#3c1e10] hover:bg-[#4e2816] border border-amber-300/35 text-amber-100 font-bold text-base transition-colors cursor-pointer"
              >
                كيف ألعب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOW TO PLAY MODAL */}
      {showHowToPlay && (
        <div className="pointer-events-auto fixed inset-0 z-30 bg-[#140904]/85 flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-[540px] max-h-[88vh] rounded-3xl bg-[#241209] border border-amber-300/35 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-200/15 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-amber-100">
                كيف تلعب صيد التمر؟
              </h2>
              <button
                type="button"
                onClick={() => setShowHowToPlay(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-amber-100 font-bold text-lg flex items-center justify-center cursor-pointer"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-amber-50/90">
              {/* Falling Items */}
              <div>
                <h3 className="text-sm font-extrabold text-amber-300 mb-2">
                  الأشياء المتساقطة من النخلة
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/6 border border-amber-200/15 p-2.5 flex items-center gap-2.5">
                    <RuleItemIcon kind="date" />
                    <div>
                      <div className="font-bold text-amber-100">تمرة عادية</div>
                      <div className="text-amber-300 font-extrabold">+1 نقطة</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/6 border border-amber-200/15 p-2.5 flex items-center gap-2.5">
                    <RuleItemIcon kind="golden" />
                    <div>
                      <div className="font-bold text-yellow-200">تمرة ذهبية نادرة</div>
                      <div className="text-yellow-300 font-extrabold">+5 نقاط</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/6 border border-amber-200/15 p-2.5 flex items-center gap-2.5">
                    <RuleItemIcon kind="rutab" />
                    <div>
                      <div className="font-bold text-amber-100">حزمة رطب (عنقود)</div>
                      <div className="text-amber-300 font-extrabold">+10 نقاط</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-rose-950/50 border border-rose-400/25 p-2.5 flex items-center gap-2.5">
                    <RuleItemIcon kind="stone" />
                    <div>
                      <div className="font-bold text-rose-100">حصاة رمادية</div>
                      <div className="text-rose-300 font-extrabold">-1 قلب (تجنّبها)</div>
                    </div>
                  </div>
                  <div className="sm:col-span-2 rounded-xl bg-rose-950/50 border border-rose-400/25 p-2.5 flex items-center gap-2.5">
                    <RuleItemIcon kind="wasp" />
                    <div>
                      <div className="font-bold text-rose-100">دبّور طائر متعرّج</div>
                      <div className="text-rose-300 font-extrabold">
                        -1 قلب إذا لمس السلة — راقب حركته المتعرجة!
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Combo & Hearts */}
              <div className="rounded-xl bg-amber-500/12 border border-amber-300/25 p-3 space-y-1.5 leading-relaxed">
                <div className="font-extrabold text-amber-300">
                  القلوب والكومبو والمستويات
                </div>
                <p>• لديك 3 قلوب، وتنتهي اللعبة عند خسارتها جميعاً.</p>
                <p>
                  • سقوط التمرة على الأرض لا يُنقص قلباً، لكنه يكسر سلسلة الكومبو.
                </p>
                <p>
                  • كل 5 تمرات متتالية بدون خطأ تضاعف النقاط (×2 ثم ×3 كحد أقصى).
                </p>
                <p>
                  • كل 30 نقطة تنتقل لمستوى جديد (10 مستويات ثم الوضع اللانهائي).
                </p>
              </div>

              {/* 4 Power-Ups */}
              <div>
                <h3 className="text-sm font-extrabold text-amber-300 mb-2">
                  القدرات المؤقتة (لمدة 7 ثوانٍ)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {(['magnet', 'big_basket', 'slow_mo', 'shield'] as PowerUpKind[]).map(
                    (kind) => {
                      const meta = POWERUP_META[kind];
                      return (
                        <div
                          key={kind}
                          className="rounded-xl bg-white/6 border border-white/10 p-2.5 flex items-start gap-2"
                        >
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#1d0e06] shrink-0 mt-0.5"
                            style={{ backgroundColor: meta.color }}
                          >
                            <PowerUpIcon kind={kind} className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="font-bold text-amber-100 leading-tight">
                              {meta.nameAr}
                            </div>
                            <div className="text-[11px] text-amber-100/75 mt-0.5 leading-snug">
                              {meta.descAr}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="rounded-xl bg-white/6 border border-white/10 p-3 leading-relaxed">
                <div className="font-extrabold text-amber-300 mb-1">
                  طريقة التحكم
                </div>
                <p>• الجوال والتابلت: اسحب إصبعك يميناً ويساراً على الشاشة.</p>
                <p>• الكمبيوتر: مفاتيح الأسهم (يمين / يسار) أو الحرفين A و D.</p>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-amber-200/15 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowHowToPlay(false);
                  onStart();
                }}
                className="flex-1 h-11 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-[#2a1104] font-black text-base cursor-pointer"
              >
                فهمت — ابدأ اللعب!
              </button>
              <button
                type="button"
                onClick={() => setShowHowToPlay(false)}
                className="px-4 h-11 rounded-xl bg-white/10 hover:bg-white/18 text-amber-100 font-bold text-sm cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {hud.status === 'PAUSED' && (
        <div className="pointer-events-auto fixed inset-0 z-20 bg-[#140904]/78 flex items-center justify-center p-4">
          <div className="w-full max-w-[360px] rounded-3xl bg-[#241209] border border-amber-300/35 p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-amber-100">
              اللعبة متوقفة
            </h2>
            <p className="text-xs sm:text-sm text-amber-200/80 mt-1">
              النقاط الحالية:{' '}
              <span className="font-extrabold text-amber-300 tabular-nums">
                {hud.score.toLocaleString('en-US')}
              </span>{' '}
              ·{' '}
              {hud.isEndless ? 'الوضع اللانهائي' : `المستوى ${hud.level}`}
            </p>

            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onResume}
                className="w-full h-12 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-[#2a1104] font-black text-base cursor-pointer"
              >
                استئناف اللعب
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="w-full h-11 rounded-2xl bg-[#3c1e10] hover:bg-[#4e2816] border border-amber-300/30 text-amber-100 font-bold text-sm cursor-pointer"
              >
                إعادة من البداية
              </button>
              <button
                type="button"
                onClick={onExit}
                className="w-full h-11 rounded-2xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-400/30 text-rose-100 font-bold text-sm cursor-pointer"
              >
                خروج إلى الصالة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {hud.status === 'GAME_OVER' && (
        <div className="pointer-events-auto fixed inset-0 z-20 bg-[#140904]/80 flex items-center justify-center p-4">
          <div className="w-full max-w-[390px] rounded-3xl bg-[#241209] border border-amber-300/40 p-6 sm:p-7 text-center shadow-2xl">
            {hud.isNewBest && (
              <div className="inline-block mb-2 rounded-xl bg-amber-400 text-[#2a1104] px-3 py-1 text-xs font-black">
                رقم قياسي جديد! كفو عليك!
              </div>
            )}

            <h2 className="text-2xl sm:text-3xl font-black text-amber-100">
              انتهت اللعبة
            </h2>
            <p className="text-xs sm:text-sm text-amber-200/80 mt-1">
              وصلت إلى{' '}
              <span className="font-bold text-amber-300">
                {hud.isEndless ? 'الوضع اللانهائي' : `المستوى ${hud.level}`}
              </span>
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/6 border border-amber-300/20 p-3.5">
                <div className="text-xs text-amber-200/80 font-semibold">
                  النقاط النهائية
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-300 tabular-nums mt-0.5">
                  {hud.score.toLocaleString('en-US')}
                </div>
              </div>
              <div className="rounded-2xl bg-white/6 border border-amber-300/20 p-3.5">
                <div className="text-xs text-amber-200/80 font-semibold">
                  أفضل نتيجة
                </div>
                <div className="text-2xl sm:text-3xl font-black text-yellow-200 tabular-nums mt-0.5">
                  {hud.bestScore.toLocaleString('en-US')}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onRestart}
                className="w-full h-12 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 active:scale-[0.98] text-[#2a1104] font-black text-lg shadow-xl transition-all cursor-pointer"
              >
                العب مرة ثانية
              </button>
              <button
                type="button"
                onClick={onExit}
                className="w-full h-11 rounded-2xl bg-white/10 hover:bg-white/16 text-amber-100 font-bold text-sm transition-colors cursor-pointer"
              >
                خروج إلى الصالة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
