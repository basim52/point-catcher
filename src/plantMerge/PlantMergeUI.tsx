import React, { useState } from 'react';
import {
  ALL_MONSTER_KINDS,
  ALL_PLANT_TIERS,
  MONSTER_SPECS,
  PLANT_SPECS,
  PlantMergeHudSnapshot,
  PlantTier,
} from './types';

interface PlantMergeUIProps {
  lang: 'ar' | 'en';
  hud: PlantMergeHudSnapshot;
  soundEnabled: boolean;
  shopOpen: boolean;
  indexOpen: boolean;
  onOpenShop: () => void;
  onCloseShop: () => void;
  onOpenIndex: () => void;
  onCloseIndex: () => void;
  onContinueSaved: () => void;
  onStartNew: () => void;
  onPause: () => void;
  onResume: () => void;
  onToggleSound: () => void;
  onQuickBuyPlant: () => void;
  onBuySpecificPlant: (tier: PlantTier) => void;
  onSelectShopTier: (tier: PlantTier) => void;
  onSellSelectedPlant: () => void;
  onWaterBoost: () => void;
  onUpgradePower: () => void;
  onToggleSpeed: () => void;
  onExit: () => void;
}

function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const COPY = {
  ar: {
    title: 'مزرعة النباتات 3D',
    subtitle:
      'اقتل الوحوش لجمع الفلوس، اشترِ 11 نوعاً من النباتات من المتجر مع فوائدها، احمِ المنزل من الأكل، وتصدَّ للعملاق المدمّر كل 5 دقائق!',
    continueSavedBtn: (wave: number, plants: number) =>
      `متابعة المزرعة المحفوظة (موجة ${wave} · ${plants} نبتة)`,
    startBtn: 'ابدأ الزراعة والقتال',
    startNewBtn: 'بدء مزرعة جديدة (الموجة 1)',
    restartFromScratchBtn: 'إعادة من البداية (الموجة 1)',
    openIndexStartBtn: `الإندكس (${ALL_PLANT_TIERS.length} نبتة · ${ALL_MONSTER_KINDS.length} وحش)`,
    closeBtn: 'إغلاق',
    exitBtn: 'خروج',
    wave: 'الموجة',
    coins: 'الفلوس',
    score: 'النقاط',
    bossTitle: 'زعيم الموجة: ملك الظلام',
    megaBossTitle: (lv: number) => `العملاق المدمّر (مستوى ${lv}) — ينزل وحوشاً قوية!`,
    megaTimerLabel: 'العملاق خلال',
    shopBtn: 'متجر النباتات',
    shopSub: '11 نبتة بالأسعار',
    indexBtn: 'الإندكس',
    indexSub: (p: number, m: number) =>
      `${p}/${ALL_PLANT_TIERS.length} · ${m}/${ALL_MONSTER_KINDS.length}`,
    waterBtn: 'سقاية + شفاء',
    waterActive: (sec: number) => `نشط ${sec}ث`,
    powerUpBtn: (lv: number) => `سماد قوة (م${lv})`,
    sellBtn: (name: string) => `بيع ${name}`,
    maxed: 'الحد الأقصى',
    hideDock: 'إخفاء الأدوات',
    showDock: 'إظهار الأدوات',
    tapHintSelected: 'اختر مربعاً فارغاً للنقل، أو نبتة أخرى للتبديل، أو اضغط «بيع»',
    tapHintIdle: (name: string, cost: number) =>
      `اضغط أي مربع فارغ لشراء وزراعة «${name}» (${cost} 💰) أو افتح المتجر`,
    pausedTitle: 'إيقاف مؤقت',
    savedNotice: 'تم حفظ نباتاتك وفلوسك تلقائياً ✓',
    resumeBtn: 'متابعة',
    restartBtn: 'مزرعة جديدة (الموجة 1)',
    gameOverTitle: 'تم أكل المنزل!',
    gameOverLostSession:
      'التهمت الوحوش منزلك بالكامل وضاعت الجلسة المحفوظة — عليك الإعادة من البداية!',
    statWave: 'الموجة',
    statScore: 'النقاط النهائية',
    statBestScore: 'أفضل نتيجة',
    statMonsters: 'الوحوش المهزومة',
    shopModalTitle: 'متجر النباتات الجديد',
    shopModalSub: 'اشترِ النباتات بفلوس قتل الوحوش وضعها في مزرعتك — كل نبتة مع سعرها وفائدتها:',
    buyAndPlantBtn: 'اشترِ وازرع',
    selectBrushBtn: 'تحديد للزراعة',
    selectedBrushLabel: 'مختار للزراعة ✓',
    newBadge: 'جديد',
    benefitLabel: 'الفائدة:',
    indexModalTitle: 'الإندكس — فهرس النباتات والوحوش',
    tabPlants: (owned: number) => `النباتات (${owned}/${ALL_PLANT_TIERS.length})`,
    tabMonsters: (seen: number) => `الوحوش (${seen}/${ALL_MONSTER_KINDS.length})`,
    discoveredBadge: 'مكتشف ✓',
    lockedBadge: 'لم تُشترَ بعد',
    defeatedCount: (n: number) => `مهزوم: ${n}`,
    notDefeatedYet: 'لم يُهزم بعد',
    plantsCountLabel: 'نباتات محفوظة',
    filterAll: 'الكل (11)',
    filterNew: 'الجديدة (5)',
  },
  en: {
    title: 'Plant Defense 3D',
    subtitle:
      'Kill monsters to earn Coins, buy all 11 plants from the Plant Shop, defend your house from being eaten, and survive the 5-min Colossal Boss!',
    continueSavedBtn: (wave: number, plants: number) =>
      `Continue Saved Garden (Wave ${wave} · ${plants} Plants)`,
    startBtn: 'Start Farming & Battle',
    startNewBtn: 'Start New Garden (Wave 1)',
    restartFromScratchBtn: 'Restart from Beginning (Wave 1)',
    openIndexStartBtn: `Index (${ALL_PLANT_TIERS.length} Plants · ${ALL_MONSTER_KINDS.length} Monsters)`,
    closeBtn: 'Close',
    exitBtn: 'Exit',
    wave: 'Wave',
    coins: 'Coins',
    score: 'Score',
    bossTitle: 'Wave Boss: Dread Titan',
    megaBossTitle: (lv: number) => `Abyssal Colossal (Lv.${lv}) — Summoning Elites!`,
    megaTimerLabel: 'Colossal in',
    shopBtn: 'Plant Shop',
    shopSub: 'All 11 Plants',
    indexBtn: 'Index',
    indexSub: (p: number, m: number) =>
      `${p}/${ALL_PLANT_TIERS.length} · ${m}/${ALL_MONSTER_KINDS.length}`,
    waterBtn: 'Water & Heal',
    waterActive: (sec: number) => `Active ${sec}s`,
    powerUpBtn: (lv: number) => `Fertilizer Lv.${lv}`,
    sellBtn: (name: string) => `Sell ${name}`,
    maxed: 'MAX',
    hideDock: 'Hide Controls',
    showDock: 'Show Controls',
    tapHintSelected: 'Tap an empty plot to Move, another plant to Swap, or Sell',
    tapHintIdle: (name: string, cost: number) =>
      `Tap an empty plot to buy & plant ${name} (${cost} 💰) or open the Plant Shop`,
    pausedTitle: 'Paused',
    savedNotice: 'Your plants & Coins are auto-saved ✓',
    resumeBtn: 'Resume',
    restartBtn: 'New Garden (Wave 1)',
    gameOverTitle: 'Your House Was Eaten!',
    gameOverLostSession:
      'Monsters devoured your farm house and wiped the saved session — restart from Wave 1!',
    statWave: 'Wave Reached',
    statScore: 'Final Score',
    statBestScore: 'Best Score',
    statMonsters: 'Monsters Defeated',
    shopModalTitle: 'New Plant Shop',
    shopModalSub: 'Buy plants with Coins earned from monster kills — prices & abilities listed below:',
    buyAndPlantBtn: 'Buy & Plant',
    selectBrushBtn: 'Select',
    selectedBrushLabel: 'Selected ✓',
    newBadge: 'NEW',
    benefitLabel: 'Benefit:',
    indexModalTitle: 'Game Index — Plants & Monsters',
    tabPlants: (owned: number) => `Plants (${owned}/${ALL_PLANT_TIERS.length})`,
    tabMonsters: (seen: number) => `Monsters (${seen}/${ALL_MONSTER_KINDS.length})`,
    discoveredBadge: 'Unlocked ✓',
    lockedBadge: 'Not Bought Yet',
    defeatedCount: (n: number) => `Defeated: ${n}`,
    notDefeatedYet: 'Not Defeated Yet',
    plantsCountLabel: 'Saved Plants',
    filterAll: 'All (11)',
    filterNew: 'New (5)',
  },
} as const;

export const PlantMergeUI: React.FC<PlantMergeUIProps> = ({
  lang,
  hud,
  soundEnabled,
  shopOpen,
  indexOpen,
  onOpenShop,
  onCloseShop,
  onOpenIndex,
  onCloseIndex,
  onContinueSaved,
  onStartNew,
  onPause,
  onResume,
  onToggleSound,
  onQuickBuyPlant,
  onBuySpecificPlant,
  onSelectShopTier,
  onSellSelectedPlant,
  onWaterBoost,
  onUpgradePower,
  onToggleSpeed,
  onExit,
}) => {
  const t = COPY[lang];
  const [indexTab, setIndexTab] = useState<'plants' | 'monsters'>('plants');
  const [shopFilter, setShopFilter] = useState<'all' | 'new'>('all');
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const activeSpec = PLANT_SPECS[hud.selectedShopTier];
  const canQuickBuy =
    hud.coins >= activeSpec.cost && hud.plantCount < hud.maxPlots;
  const canWater = hud.coins >= hud.waterCost && hud.plantCount > 0;
  const canPowerUp =
    hud.powerUpgradeCost > 0 && hud.coins >= hud.powerUpgradeCost;
  const megaTimerUrgent = hud.megaBossTimer <= 30;

  const discoveredPlantCount = hud.discoveredPlants.length;
  const defeatedSpeciesCount = ALL_MONSTER_KINDS.filter(
    (k) => (hud.defeatedMonsters[k] ?? 0) > 0
  ).length;

  const shopTiers =
    shopFilter === 'new'
      ? ALL_PLANT_TIERS.filter((tier) => PLANT_SPECS[tier].isNew)
      : ALL_PLANT_TIERS;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between">
      {/* Top Minimal HUD Bar */}
      <div className="pointer-events-auto w-full px-2.5 sm:px-4 pt-2.5 sm:pt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            type="button"
            onClick={onExit}
            className="h-9 px-2.5 sm:px-3 rounded-lg border border-rose-400/45 bg-[#1b0f16]/90 hover:bg-[#2c1622] text-rose-200 text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer shrink-0"
          >
            {t.exitBtn}
          </button>

          {hud.status !== 'START' && (
            <div className="h-9 px-2.5 sm:px-3 rounded-lg border border-emerald-400/35 bg-[#0c1c15]/92 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-emerald-50">
              <span className="font-bold whitespace-nowrap">
                {t.wave} <span className="font-num text-emerald-300">{hud.wave}</span>
              </span>
              <span className="text-emerald-500/50" aria-hidden="true">
                |
              </span>
              <span className="font-num font-extrabold text-amber-300 whitespace-nowrap flex items-center gap-1">
                <span>💰 {hud.coins.toLocaleString()}</span>
                {hud.lastCoinRewardTimer > 0 && hud.lastCoinReward > 0 && (
                  <span className="text-[11px] font-extrabold text-emerald-300">
                    +{hud.lastCoinReward}
                  </span>
                )}
              </span>
              <span className="text-emerald-500/50" aria-hidden="true">
                |
              </span>
              <span
                className={`font-num font-bold whitespace-nowrap ${
                  hud.houseBeingEaten ? 'text-rose-400' : 'text-rose-300'
                }`}
              >
                ♥ {hud.farmHp}/{hud.maxFarmHp}
              </span>
              <span className="text-emerald-500/50 hidden lg:inline" aria-hidden="true">
                |
              </span>
              <span className="hidden lg:inline font-num font-bold text-sky-200 whitespace-nowrap">
                {t.score}: {hud.score}
              </span>
            </div>
          )}
        </div>

        {/* Top Center 5-Minute Colossal Mega-Boss Countdown Timer */}
        {hud.status !== 'START' && (
          <div
            className={`h-9 px-2.5 sm:px-3.5 rounded-lg border flex items-center gap-1.5 text-xs sm:text-sm font-extrabold whitespace-nowrap shadow-md ${
              megaTimerUrgent
                ? 'border-rose-400 bg-[#320a18]/95 text-rose-200'
                : 'border-fuchsia-400/55 bg-[#1c0c2b]/92 text-fuchsia-100'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-fuchsia-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2.5 2" />
              <path d="M9 2h6" />
            </svg>
            <span className="hidden sm:inline text-[11px] font-bold text-fuchsia-200/90">
              {t.megaTimerLabel}
            </span>
            <span className="font-num text-xs sm:text-sm text-amber-200">
              {formatCountdown(hud.megaBossTimer)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {hud.status === 'PLAYING' && (
            <button
              type="button"
              onClick={onToggleSpeed}
              className={`h-9 px-2.5 rounded-lg border text-xs font-extrabold font-num whitespace-nowrap cursor-pointer transition-colors ${
                hud.speedMul === 2
                  ? 'border-amber-300 bg-amber-400 text-slate-950'
                  : 'border-white/20 bg-[#0d1c16]/90 text-emerald-100 hover:bg-[#152c22]'
              }`}
            >
              {hud.speedMul}×
            </button>
          )}

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute' : 'Unmute'}
            className="h-9 w-9 rounded-lg border border-white/20 bg-[#0d1c16]/90 hover:bg-[#162d23] text-emerald-100 flex items-center justify-center cursor-pointer"
          >
            {soundEnabled ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>

          {hud.status === 'PLAYING' && (
            <button
              type="button"
              onClick={onPause}
              aria-label={t.pausedTitle}
              className="h-9 w-9 rounded-lg border border-white/20 bg-[#0d1c16]/90 hover:bg-[#162d23] text-emerald-100 flex items-center justify-center cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Top Boss Health Bars & Action Banner */}
      <div className="pointer-events-none flex flex-col items-center gap-1.5 px-3 mt-1.5">
        {(hud.status === 'PLAYING' || hud.status === 'EATING_HOUSE') &&
          hud.megaBossActive && (
            <div className="w-full max-w-[460px] rounded-xl border-2 border-fuchsia-400/80 bg-[#1f0624]/95 px-3.5 py-2 shadow-xl">
              <div className="flex items-center justify-between gap-2 text-xs font-extrabold text-fuchsia-100 mb-1">
                <span className="truncate">{t.megaBossTitle(hud.megaBossLevel)}</span>
                <span className="font-num text-amber-200 whitespace-nowrap">
                  {hud.megaBossHp.toLocaleString()} / {hud.megaBossMaxHp.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-3 rounded-md bg-slate-950 border border-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-400 transition-all duration-150"
                  style={{
                    width: `${Math.max(
                      2,
                      hud.megaBossMaxHp > 0
                        ? (hud.megaBossHp / hud.megaBossMaxHp) * 100
                        : 0
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

        {(hud.status === 'PLAYING' || hud.status === 'EATING_HOUSE') &&
          hud.bossActive && (
            <div className="w-full max-w-[340px] rounded-lg border border-rose-400/60 bg-[#210b14]/92 px-3 py-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-200 mb-1">
                <span>{t.bossTitle}</span>
                <span className="font-num">{Math.ceil(hud.bossHpRatio * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-150"
                  style={{ width: `${Math.max(2, hud.bossHpRatio * 100)}%` }}
                />
              </div>
            </div>
          )}

        {(hud.status === 'PLAYING' || hud.status === 'EATING_HOUSE') &&
          hud.bannerText && (
            <div
              className={`px-3.5 py-1.5 rounded-lg border text-xs sm:text-sm font-bold shadow-md ${
                hud.bannerTone === 'boss'
                  ? 'border-rose-400/75 bg-[#2b0c18]/95 text-rose-100'
                  : hud.bannerTone === 'merge'
                  ? 'border-amber-300/70 bg-[#1a240e]/95 text-amber-200'
                  : hud.bannerTone === 'warn'
                  ? 'border-orange-400/70 bg-[#29150c]/95 text-orange-200'
                  : 'border-emerald-400/50 bg-[#0d2219]/92 text-emerald-100'
              }`}
            >
              {hud.bannerText}
            </div>
          )}
      </div>

      {/* Spacer keeps central 3D garden 100% open */}
      <div className="flex-1" />

      {/* Unified Collapsible Bottom Control Dock + Plant Shop + Bottom Index */}
      {hud.status === 'PLAYING' && (
        <div className="pointer-events-auto w-full flex flex-col items-center px-2 pb-2.5 sm:pb-3.5">
          <div className="flex items-center gap-2 mb-1.5">
            <button
              type="button"
              onClick={() => setDockCollapsed((v) => !v)}
              className="px-3 py-1 rounded-t-lg border border-white/15 bg-[#0b1913]/92 hover:bg-[#132920] text-[11px] font-bold text-emerald-200 cursor-pointer whitespace-nowrap"
            >
              {dockCollapsed ? `▴ ${t.showDock}` : `▾ ${t.hideDock}`}
            </button>
            {!dockCollapsed && (
              <span className="hidden md:inline text-xs font-semibold text-white bg-[#0b1913]/85 border border-white/10 rounded-md px-2.5 py-1">
                {hud.selectedPlot
                  ? t.tapHintSelected
                  : t.tapHintIdle(
                      lang === 'ar' ? activeSpec.nameAr : activeSpec.nameEn,
                      activeSpec.cost
                    )}
              </span>
            )}
          </div>

          {!dockCollapsed && (
            <div className="w-full max-w-[880px] rounded-2xl border border-emerald-400/35 bg-[#0a1812]/94 p-2 sm:p-2.5 shadow-2xl">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                {/* 1. Open New Plant Shop (All 11 Plants with Prices & Benefits) */}
                <button
                  type="button"
                  onClick={onOpenShop}
                  className="h-12 sm:h-13 px-2 rounded-xl border border-amber-300/80 bg-gradient-to-b from-amber-300 to-orange-500 hover:from-amber-200 hover:to-orange-400 text-slate-950 flex flex-col items-center justify-center transition-transform active:scale-[0.98] cursor-pointer"
                >
                  <span className="text-[11px] sm:text-xs font-extrabold whitespace-nowrap">
                    🛒 {t.shopBtn}
                  </span>
                  <span className="text-[10px] font-bold whitespace-nowrap">
                    {t.shopSub}
                  </span>
                </button>

                {/* 2. Quick Buy & Plant Selected Shop Plant OR Sell Selected Placed Plant */}
                {hud.selectedPlantTier !== null ? (
                  <button
                    type="button"
                    onClick={onSellSelectedPlant}
                    className="h-12 sm:h-13 px-2 rounded-xl border border-rose-300/75 bg-gradient-to-b from-rose-500 to-red-600 text-white flex flex-col items-center justify-center transition-transform active:scale-[0.98] cursor-pointer"
                  >
                    <span className="text-[11px] sm:text-xs font-extrabold whitespace-nowrap truncate max-w-full">
                      {t.sellBtn(
                        lang === 'ar'
                          ? PLANT_SPECS[hud.selectedPlantTier].nameAr
                          : PLANT_SPECS[hud.selectedPlantTier].nameEn
                      )}
                    </span>
                    <span className="font-num text-[10px] sm:text-[11px] font-bold text-amber-200">
                      +💰 {hud.selectedPlantSellValue}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canQuickBuy}
                    onClick={onQuickBuyPlant}
                    className={`h-12 sm:h-13 px-2 rounded-xl border flex flex-col items-center justify-center transition-transform active:scale-[0.98] ${
                      canQuickBuy
                        ? 'border-emerald-300/70 bg-gradient-to-b from-emerald-400 to-emerald-600 text-slate-950 font-extrabold cursor-pointer'
                        : 'border-white/10 bg-slate-900/80 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-[11px] sm:text-xs font-extrabold whitespace-nowrap truncate max-w-full">
                      {lang === 'ar' ? activeSpec.nameAr : activeSpec.nameEn}
                    </span>
                    <span className="font-num text-[10px] sm:text-[11px] font-bold">
                      💰 {activeSpec.cost} · {hud.plantCount}/{hud.maxPlots}
                    </span>
                  </button>
                )}

                {/* 3. Bottom Index Button (الإندكس) */}
                <button
                  type="button"
                  onClick={onOpenIndex}
                  className="h-12 sm:h-13 px-2 rounded-xl border border-violet-300/65 bg-violet-500/25 hover:bg-violet-500/35 text-violet-100 flex flex-col items-center justify-center transition-transform active:scale-[0.98] cursor-pointer"
                >
                  <span className="text-[11px] sm:text-xs font-extrabold whitespace-nowrap">
                    📖 {t.indexBtn}
                  </span>
                  <span className="font-num text-[10px] font-bold text-violet-200">
                    {t.indexSub(discoveredPlantCount, defeatedSpeciesCount)}
                  </span>
                </button>

                {/* 4. Water & Heal Boost */}
                <button
                  type="button"
                  disabled={!canWater}
                  onClick={onWaterBoost}
                  className={`h-12 sm:h-13 px-2 rounded-xl border flex flex-col items-center justify-center transition-transform active:scale-[0.98] ${
                    hud.waterBoostTimer > 0
                      ? 'border-cyan-300 bg-cyan-500/30 text-cyan-100 cursor-pointer'
                      : canWater
                      ? 'border-sky-300/60 bg-sky-500/25 hover:bg-sky-500/35 text-sky-100 cursor-pointer'
                      : 'border-white/10 bg-slate-900/80 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span className="text-[11px] sm:text-xs font-bold whitespace-nowrap">
                    {t.waterBtn}
                  </span>
                  <span className="font-num text-[10px] sm:text-[11px] font-bold">
                    {hud.waterBoostTimer > 0
                      ? t.waterActive(Math.ceil(hud.waterBoostTimer))
                      : `💰 ${hud.waterCost}`}
                  </span>
                </button>

                {/* 5. Upgrade Fertilizer / Global Power */}
                <button
                  type="button"
                  disabled={!canPowerUp}
                  onClick={onUpgradePower}
                  className={`col-span-2 sm:col-span-1 h-12 sm:h-13 px-2 rounded-xl border flex flex-col items-center justify-center transition-transform active:scale-[0.98] ${
                    canPowerUp
                      ? 'border-lime-300/65 bg-lime-500/25 hover:bg-lime-500/35 text-lime-100 cursor-pointer'
                      : 'border-white/10 bg-slate-900/80 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span className="text-[11px] sm:text-xs font-bold whitespace-nowrap">
                    {t.powerUpBtn(hud.powerLevel)}
                  </span>
                  <span className="font-num text-[10px] sm:text-[11px] font-bold">
                    {hud.powerUpgradeCost > 0
                      ? `💰 ${hud.powerUpgradeCost}`
                      : t.maxed}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NEW PLANT SHOP MODAL (All 11 Plants with Price, Stats & Benefit) */}
      {shopOpen && hud.status === 'PLAYING' && (
        <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-[#050e0a]/84">
          <div className="w-full max-w-[660px] max-h-[88vh] flex flex-col rounded-2xl border border-amber-400/50 bg-[#0c1d15] p-4 sm:p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-2 mb-1.5 shrink-0">
              <h2 className="text-lg sm:text-xl font-extrabold text-amber-200">
                🛒 {t.shopModalTitle}
              </h2>
              <div className="flex items-center gap-2">
                <span className="font-num px-2.5 py-1 rounded-lg bg-[#07120d] border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-extrabold">
                  💰 {hud.coins.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={onCloseShop}
                  className="h-8 px-3 rounded-lg border border-white/20 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer"
                >
                  {t.closeBtn}
                </button>
              </div>
            </div>

            <p className="text-xs text-emerald-100/80 mb-3 shrink-0">
              {t.shopModalSub}
            </p>

            {/* Filter: All 11 Plants vs 5 New Plants */}
            <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
              <button
                type="button"
                onClick={() => setShopFilter('all')}
                className={`h-8 rounded-lg border text-xs font-extrabold cursor-pointer ${
                  shopFilter === 'all'
                    ? 'border-emerald-300 bg-emerald-400 text-slate-950'
                    : 'border-white/15 bg-[#07120d] text-emerald-200 hover:bg-[#10241b]'
                }`}
              >
                {t.filterAll}
              </button>
              <button
                type="button"
                onClick={() => setShopFilter('new')}
                className={`h-8 rounded-lg border text-xs font-extrabold cursor-pointer ${
                  shopFilter === 'new'
                    ? 'border-amber-300 bg-amber-400 text-slate-950'
                    : 'border-white/15 bg-[#07120d] text-amber-200 hover:bg-[#1a180d]'
                }`}
              >
                {t.filterNew}
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pe-1 space-y-2">
              {shopTiers.map((tier) => {
                const spec = PLANT_SPECS[tier];
                const affordable = hud.coins >= spec.cost;
                const hasSpace = hud.plantCount < hud.maxPlots;
                const isSelectedBrush = hud.selectedShopTier === tier;

                return (
                  <div
                    key={tier}
                    className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      isSelectedBrush
                        ? 'border-emerald-300/80 bg-[#10291c]'
                        : spec.isNew
                        ? 'border-amber-400/45 bg-[#121f17]'
                        : 'border-white/12 bg-[#07130d]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-1.5 mb-1">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-white/30"
                          style={{ backgroundColor: spec.accentColor }}
                        />
                        <span
                          className="text-sm font-extrabold"
                          style={{ color: spec.projectileColor }}
                        >
                          {lang === 'ar' ? spec.nameAr : spec.nameEn}
                        </span>
                        {spec.isNew && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-400/20 border border-amber-300/60 text-amber-200 text-[10px] font-extrabold">
                            {t.newBadge}
                          </span>
                        )}
                        <span className="font-num text-xs font-extrabold text-amber-300 ms-auto">
                          💰 {spec.cost.toLocaleString()}
                        </span>
                      </div>

                      <p className="text-[11.5px] text-emerald-100/90 leading-snug mb-1.5">
                        <span className="font-bold text-emerald-300">
                          {t.benefitLabel}{' '}
                        </span>
                        {lang === 'ar' ? spec.roleAr : spec.roleEn}
                      </p>

                      <div className="font-num text-[10.5px] text-slate-300 flex items-center flex-wrap gap-3">
                        <span>♥ {spec.maxHp}</span>
                        <span>⚔ {spec.damage}</span>
                        {spec.coinsPerSec && spec.coinsPerSec > 0 ? (
                          <span className="text-amber-300">
                            +💰 {spec.coinsPerSec}/s
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={!affordable || !hasSpace}
                        onClick={() => onBuySpecificPlant(tier)}
                        className={`flex-1 sm:flex-none h-9 px-3 rounded-lg border text-xs font-extrabold whitespace-nowrap cursor-pointer ${
                          affordable && hasSpace
                            ? 'border-emerald-300 bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                            : 'border-white/10 bg-slate-900 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {t.buyAndPlantBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectShopTier(tier)}
                        className={`flex-1 sm:flex-none h-8 px-3 rounded-lg border text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                          isSelectedBrush
                            ? 'border-amber-300 bg-amber-400/20 text-amber-200'
                            : 'border-white/15 bg-slate-900 hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        {isSelectedBrush ? t.selectedBrushLabel : t.selectBrushBtn}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM INDEX MODAL (فهرس النباتات والوحوش) */}
      {indexOpen && (
        <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-[#050e0a]/85">
          <div className="w-full max-w-[600px] max-h-[88vh] flex flex-col rounded-2xl border border-violet-400/50 bg-[#0d1920] p-4 sm:p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                📖 {t.indexModalTitle}
              </h2>
              <button
                type="button"
                onClick={onCloseIndex}
                className="h-8 px-3 rounded-lg border border-white/20 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer"
              >
                {t.closeBtn}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
              <button
                type="button"
                onClick={() => setIndexTab('plants')}
                className={`h-9 rounded-lg border text-xs sm:text-sm font-extrabold cursor-pointer ${
                  indexTab === 'plants'
                    ? 'border-emerald-300 bg-emerald-400 text-slate-950'
                    : 'border-white/15 bg-[#081218] text-emerald-200 hover:bg-[#10242c]'
                }`}
              >
                {t.tabPlants(discoveredPlantCount)}
              </button>
              <button
                type="button"
                onClick={() => setIndexTab('monsters')}
                className={`h-9 rounded-lg border text-xs sm:text-sm font-extrabold cursor-pointer ${
                  indexTab === 'monsters'
                    ? 'border-rose-300 bg-rose-400 text-slate-950'
                    : 'border-white/15 bg-[#081218] text-rose-200 hover:bg-[#1e1218]'
                }`}
              >
                {t.tabMonsters(defeatedSpeciesCount)}
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pe-1 mb-3">
              {indexTab === 'plants' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_PLANT_TIERS.map((tier) => {
                    const spec = PLANT_SPECS[tier];
                    const owned = hud.discoveredPlants.includes(tier);
                    return (
                      <div
                        key={tier}
                        className={`rounded-xl border p-2.5 ${
                          owned
                            ? 'border-emerald-400/40 bg-[#0b2019]'
                            : 'border-white/10 bg-[#081217] opacity-85'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className="text-xs font-extrabold"
                            style={{ color: spec.projectileColor }}
                          >
                            {lang === 'ar' ? spec.nameAr : spec.nameEn}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              owned
                                ? 'bg-emerald-400/20 text-emerald-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {owned ? t.discoveredBadge : t.lockedBadge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug mb-1.5">
                          {lang === 'ar' ? spec.roleAr : spec.roleEn}
                        </p>
                        <div className="font-num text-[10.5px] flex items-center justify-between text-emerald-200/85">
                          <span>♥ {spec.maxHp} · ⚔ {spec.damage}</span>
                          <span className="text-amber-300 font-bold">
                            💰 {spec.cost.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_MONSTER_KINDS.map((kind) => {
                    const spec = MONSTER_SPECS[kind];
                    const kills = hud.defeatedMonsters[kind] ?? 0;
                    return (
                      <div
                        key={kind}
                        className={`rounded-xl border p-2.5 ${
                          kind === 'megaBoss'
                            ? 'border-fuchsia-400/60 bg-[#1a0721]'
                            : kills > 0
                            ? 'border-rose-400/35 bg-[#181018]'
                            : 'border-white/10 bg-[#081217] opacity-85'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className="text-xs font-extrabold"
                            style={{ color: spec.accentColor }}
                          >
                            {lang === 'ar' ? spec.nameAr : spec.nameEn}
                          </span>
                          <span
                            className={`font-num text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              kills > 0
                                ? 'bg-rose-400/20 text-rose-200'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {kills > 0 ? t.defeatedCount(kills) : t.notDefeatedYet}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug mb-1.5">
                          {lang === 'ar' ? spec.roleAr : spec.roleEn}
                        </p>
                        <div className="font-num text-[10.5px] flex items-center justify-between text-rose-200/85">
                          <span>♥ {spec.baseHp} · ⚔ {spec.attackDamage}</span>
                          <span className="text-amber-300 font-bold">
                            💰 +{spec.rewardCoins}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onCloseIndex}
              className="w-full h-10 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-sm cursor-pointer shrink-0"
            >
              {t.closeBtn}
            </button>
          </div>
        </div>
      )}

      {/* START OVERLAY */}
      {hud.status === 'START' && !indexOpen && (
        <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center p-4 bg-[#07130e]/70">
          <div className="w-full max-w-[470px] rounded-2xl border border-emerald-400/45 bg-[#0c1d15] p-6 text-center shadow-2xl">
            <p className="text-xs font-bold text-emerald-300 mb-1.5">
              {lang === 'ar'
                ? 'متجر 11 نبتة · فلوس من الوحوش · إندكس · عملاق كل 5 دقائق'
                : '11-Plant Shop · Kill Coins · Index · 5-Min Colossal Boss'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              {t.title}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed mb-4">
              {t.subtitle}
            </p>

            {(hud.hasSavedGarden || hud.bestWave > 0) && (
              <div className="grid grid-cols-3 gap-2 mb-5 p-3 rounded-xl bg-[#07120d] border border-white/10">
                <div>
                  <div className="text-[10.5px] text-emerald-300/80">
                    {t.plantsCountLabel}
                  </div>
                  <div className="font-num text-lg font-extrabold text-emerald-300">
                    {hud.hasSavedGarden ? hud.savedPlantCount : 0}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] text-emerald-300/80">{t.statWave}</div>
                  <div className="font-num text-lg font-extrabold text-amber-300">
                    {Math.max(hud.bestWave, hud.hasSavedGarden ? hud.savedWave : 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] text-emerald-300/80">
                    {t.statBestScore}
                  </div>
                  <div className="font-num text-lg font-extrabold text-sky-300">
                    {hud.bestScore}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {hud.hasSavedGarden ? (
                <>
                  <button
                    type="button"
                    onClick={onContinueSaved}
                    className="w-full h-12 px-3 rounded-xl bg-gradient-to-b from-emerald-400 to-green-600 hover:from-emerald-300 hover:to-green-500 text-slate-950 font-extrabold text-sm sm:text-base cursor-pointer shadow-lg"
                  >
                    {t.continueSavedBtn(hud.savedWave, hud.savedPlantCount)}
                  </button>
                  <button
                    type="button"
                    onClick={onStartNew}
                    className="w-full h-10 rounded-xl border border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 font-bold text-sm cursor-pointer"
                  >
                    {t.startNewBtn}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onStartNew}
                  className="w-full h-12 rounded-xl bg-gradient-to-b from-emerald-400 to-green-600 hover:from-emerald-300 hover:to-green-500 text-slate-950 font-extrabold text-base cursor-pointer shadow-lg"
                >
                  {t.startBtn}
                </button>
              )}

              <button
                type="button"
                onClick={onOpenIndex}
                className="w-full h-10 rounded-xl border border-violet-400/40 bg-violet-500/15 hover:bg-violet-500/25 text-violet-100 font-bold text-sm cursor-pointer"
              >
                📖 {t.openIndexStartBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {hud.status === 'PAUSED' && !indexOpen && (
        <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center p-4 bg-[#06110c]/75">
          <div className="w-full max-w-[360px] rounded-2xl border border-emerald-400/40 bg-[#0c1d15] p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-extrabold text-white mb-1.5">
              {t.pausedTitle}
            </h2>
            <p className="text-xs font-bold text-emerald-300 mb-4">
              {t.savedNotice}
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onResume}
                className="w-full h-11 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-sm cursor-pointer"
              >
                {t.resumeBtn}
              </button>
              <button
                type="button"
                onClick={onOpenIndex}
                className="w-full h-10 rounded-xl border border-violet-400/35 bg-violet-500/15 hover:bg-violet-500/25 text-violet-100 font-bold text-sm cursor-pointer"
              >
                📖 {t.openIndexStartBtn}
              </button>
              <button
                type="button"
                onClick={onStartNew}
                className="w-full h-10 rounded-xl border border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 font-bold text-sm cursor-pointer"
              >
                {t.restartBtn}
              </button>
              <button
                type="button"
                onClick={onExit}
                className="w-full h-10 rounded-xl border border-rose-400/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 font-bold text-sm cursor-pointer"
              >
                {t.exitBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER OVERLAY — House Eaten, Session Wiped */}
      {hud.status === 'GAME_OVER' && (
        <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center p-4 bg-[#12070c]/84">
          <div className="w-full max-w-[430px] rounded-2xl border border-rose-400/55 bg-[#190c13] p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-extrabold text-rose-200 mb-1.5">
              {t.gameOverTitle}
            </h2>
            <p className="text-xs sm:text-sm text-rose-200/85 leading-relaxed mb-4">
              {t.gameOverLostSession}
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <div className="rounded-xl bg-[#0e070b] border border-white/10 p-3">
                <div className="text-[11px] text-slate-400">{t.statWave}</div>
                <div className="font-num text-xl font-extrabold text-amber-300">
                  {hud.wave}
                </div>
              </div>
              <div className="rounded-xl bg-[#0e070b] border border-white/10 p-3">
                <div className="text-[11px] text-slate-400">{t.statMonsters}</div>
                <div className="font-num text-xl font-extrabold text-rose-300">
                  {hud.monstersDefeated}
                </div>
              </div>
              <div className="rounded-xl bg-[#0e070b] border border-white/10 p-3">
                <div className="text-[11px] text-slate-400">{t.statScore}</div>
                <div className="font-num text-xl font-extrabold text-emerald-300">
                  {hud.score}
                </div>
              </div>
              <div className="rounded-xl bg-[#0e070b] border border-white/10 p-3">
                <div className="text-[11px] text-slate-400">{t.statBestScore}</div>
                <div className="font-num text-xl font-extrabold text-sky-300">
                  {hud.bestScore}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onStartNew}
                className="w-full h-12 px-3 rounded-xl bg-gradient-to-b from-emerald-400 to-green-600 hover:from-emerald-300 hover:to-green-500 text-slate-950 font-extrabold text-sm sm:text-base cursor-pointer"
              >
                {t.restartFromScratchBtn}
              </button>
              <button
                type="button"
                onClick={onExit}
                className="w-full h-10 rounded-xl border border-white/15 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm cursor-pointer"
              >
                {t.exitBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
