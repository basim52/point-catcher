import React, { useState } from 'react';
import { AdminLongPressTitle, StatsAdminButton } from './stats/InGameStats';
import { formatVisitLabel, useGameVisitCounts } from './analytics/visits';
import { GameMode } from './fruitWorld';
import heroArcadeImg from './assets/images/landing_hero_arcade_1795342078886.jpg';

export interface LandingBoardProps {
  lang: 'ar' | 'en';
  bestScore: number;
  coins: number;
  pinkCoins: number;
  spaceCoins: number;
  lives: number;
  maxLives: number;
  completedNormalCount: number;
  totalNormalStages: number;
  completedFruitCount: number;
  totalFruitStages: number;
  completedGoldCount: number;
  totalGoldStages: number;
  completedSpaceCount: number;
  totalSpaceStages: number;
  completedMonsterCount: number;
  totalMonsterStages: number;
  totalBagCount: number;
  onStartMainGame: (mode?: GameMode) => void;
  onOpenGamesHub: () => void;
  onOpenDateCatcher: () => void;
  onOpenDesertRally: () => void;
  onOpenShawarma: () => void;
  onOpenPlantMerge: () => void;
  onOpenMonsterArena: () => void;
  onOpenDevilTrap: () => void;
  onOpenShop: () => void;
  onOpenSpaceShop: () => void;
  onOpenIndex: () => void;
  onOpenBag: () => void;
  onOpenSettings?: () => void;
  onReplayIntro: () => void;
  onToggleLang: () => void;
}

const LANDING_COPY = {
  ar: {
    brand: 'صياد النقاط',
    navWorlds: 'العوالم',
    navGames: 'صالة الألعاب',
    navShop: 'المتجر',
    navIndex: 'الاندكس',
    topCta: 'ابدأ اللعب',
    heroKicker: '5 عوالم · 235 مرحلة · 15 لعبة مصغرة',
    heroTitle: 'التقط النقاط النادرة، طوّر أدواتك، وتحدَّ صالة الألعاب',
    heroSubtitle:
      'انطلق عبر 5 عوالم مليئة بالمراحل والتحديات، طوّر أدواتك من المتجر، أو افتح صالة الألعاب المصغرة لاكتشاف 15 لعبة متنوعة!',
    primaryCta: 'ابدأ اللعب',
    secondaryHubCta: 'صالة الألعاب (15)',
    statBestScore: 'أعلى نتيجة',
    statCurrency: 'رصيد العملات',
    statCurrencySub: (pink: number, space: number) =>
      `${pink} وردي · ${space} فضاء`,
    statStages: 'المراحل المكتملة',
    statStagesSub: (total: number) => `من أصل ${total} مرحلة`,
    statHearts: 'القلوب المتاحة',
    statHeartsSub: 'تتجدد تلقائياً كل 5 دقائق',
    sectionWorldsNum: '01.',
    sectionWorldsTitle: 'العوالم الخمسة',
    sectionWorldsSub: 'اختر عالمك وابدأ التحدي مباشرة مع حفظ كامل لتقدمك.',
    worldNormalTitle: 'العالم العادي',
    worldNormalDesc: '75 مرحلة متصاعدة مع الجوهرة الملكية +10 نقاط والعملات الوردية.',
    worldFruitTitle: 'عالم الفواكه',
    worldFruitDesc: '30 مرحلة من الفواكه المنعشة والذرة الذهبية وتأثيرات السرعة.',
    worldGoldTitle: 'العالم الذهبي',
    worldGoldDesc: '30 مرحلة من الكنوز والألماس والمكافآت المضاعفة.',
    worldSpaceTitle: 'عالم الفضاء',
    worldSpaceDesc:
      '50 مرحلة كونية بعملات الفضاء ومتجر الفضاء — يُفتح بـ 40 فلوس أو 400 عملة وردية!',
    worldMonsterTitle: '👹 مراحل الوحش',
    worldMonsterDesc:
      '50 مرحلة قتال ضد وحوش متنوعة + 🔥 «الوحش الأكبر» كل 10 مراحل (أضعف بـ 150% من الوحش الأكبر بالفضاء) ومفتوحة مجاناً!',
    enterWorldBtn: 'دخول العالم',
    sectionArcadeNum: '02.',
    sectionArcadeTitle: 'صالة الألعاب المصغرة',
    sectionArcadeMeta: '15 لعبة متنوعة جاهزة للعب',
    sectionArcadeDesc:
      'تشكيلة واسعة من ألعاب 2D و 3D للذكاء والسرعة والمنصات والقتال — افتح صالة الألعاب واختر اللعبة التي تناسبك.',
    openArcadeBtn: 'فتح صالة الألعاب',
    sectionGearNum: '03.',
    sectionGearTitle: 'المتجر والحقيبة والاندكس',
    sectionGearSub: 'انتقل بضغطة واحدة إلى أي قسم في المنصة.',
    cardShopTitle: 'المتجر ومتجر الفضاء',
    cardShopMeta: 'مظاهر · مركبات فضاء · مغناطيس ودروع',
    cardShopDesc:
      'افتح مظاهر جديدة للمركبة والنقاط، وتسوّق بعملات الفضاء في «متجر الفضاء» لشراء مركبات ومغناطيس ونجوم!',
    cardShopBtn: 'دخول المتجر',
    cardSpaceShopBtn: 'متجر الفضاء',
    cardBagTitle: 'الحقيبة والاندكس',
    cardBagMeta: (bag: number) => `${bag} عناصر في الحقيبة`,
    cardBagDesc:
      'تفقّد القلوب والذرة والألماس المخزّنة في حقيبتك واستعرض موسوعة كل العناصر المكتشفة.',
    openBagBtn: 'الحقيبة',
    openIndexBtn: 'الاندكس',
    footerNote: 'جميع التقدمات والمراحل والأرقام القياسية محفوظة تلقائياً على جهازك.',
    openStatsLabel: 'الإعدادات والإحصائيات',
    replayIntro: 'عرض الشعار والموسيقى',
    langSwitch: 'English',
  },
  en: {
    brand: 'Point Catcher',
    navWorlds: 'Worlds',
    navGames: 'Games Hub',
    navShop: 'Shop',
    navIndex: 'Index',
    topCta: 'Start Playing',
    heroKicker: '5 Worlds · 235 Stages · 15 Mini-Games',
    heroTitle: 'Catch Rare Gems, Upgrade Your Gear, and Master the Arcade',
    heroSubtitle:
      'Explore 5 worlds packed with stages and upgrades, or open the Mini-Games Hub to play 15 diverse 2D and 3D games!',
    primaryCta: 'Start Playing',
    secondaryHubCta: 'Games Hub (15)',
    statBestScore: 'Best Score',
    statCurrency: 'Coin Balance',
    statCurrencySub: (pink: number, space: number) =>
      `${pink} Pink · ${space} Space`,
    statStages: 'Stages Cleared',
    statStagesSub: (total: number) => `out of ${total} stages`,
    statHearts: 'Hearts Ready',
    statHeartsSub: 'Regenerates every 5 minutes',
    sectionWorldsNum: '01.',
    sectionWorldsTitle: 'Five Worlds',
    sectionWorldsSub: 'Pick any world and dive straight into your saved stage.',
    worldNormalTitle: 'Normal World',
    worldNormalDesc: '75 escalating stages featuring +10 Royal Prisms and Pink Coins.',
    worldFruitTitle: 'Fruit World',
    worldFruitDesc: '30 vibrant fruit stages with Golden Corn lives and speed boosts.',
    worldGoldTitle: 'Gold World',
    worldGoldDesc: '30 treasure stages packed with Diamonds and high coin payouts.',
    worldSpaceTitle: 'Space World',
    worldSpaceDesc:
      '50 cosmic stages with Space Coins & Space Shop — unlock for 40 Coins or 400 Pink Coins!',
    worldMonsterTitle: '👹 Monster Stages',
    worldMonsterDesc:
      '50 living Monster boss battles + a 🔥 Grand Monster every 10 stages (150% weaker than Space Supreme Beast) — free to play!',
    enterWorldBtn: 'Enter World',
    sectionArcadeNum: '02.',
    sectionArcadeTitle: 'Mini-Games Hub',
    sectionArcadeMeta: '15 diverse games ready to play',
    sectionArcadeDesc:
      'A full collection of 2D & 3D arcade, puzzle, platformer, racing, and action games — open the Games Hub to pick any game.',
    openArcadeBtn: 'Open Games Hub',
    sectionGearNum: '03.',
    sectionGearTitle: 'Shop, Bag & Index',
    sectionGearSub: 'Jump directly to your upgrades and item encyclopedia.',
    cardShopTitle: 'Shop & Space Shop',
    cardShopMeta: 'Skins · Starships · Magnet & Shields',
    cardShopDesc:
      'Unlock catcher skins, max hearts, and spend Space Coins in the Space Shop for starships, magnets & cosmic upgrades.',
    cardShopBtn: 'Open Shop',
    cardSpaceShopBtn: 'Space Shop',
    cardBagTitle: 'Bag & Index',
    cardBagMeta: (bag: number) => `${bag} items stored`,
    cardBagDesc:
      'Manage your stored Hearts, Corn, and Diamonds or browse every discovered item in the Index.',
    openBagBtn: 'Bag',
    openIndexBtn: 'Index',
    footerNote: 'All stage progress and high scores are saved locally on your device.',
    openStatsLabel: 'Settings & Stats',
    replayIntro: 'Replay Intro Logo',
    langSwitch: 'العربية',
  },
} as const;

export const LandingBoard: React.FC<LandingBoardProps> = ({
  lang,
  bestScore,
  coins,
  pinkCoins,
  spaceCoins,
  lives,
  maxLives,
  completedNormalCount,
  totalNormalStages,
  completedFruitCount,
  totalFruitStages,
  completedGoldCount,
  totalGoldStages,
  completedSpaceCount,
  totalSpaceStages,
  completedMonsterCount,
  totalMonsterStages,
  totalBagCount,
  onStartMainGame,
  onOpenGamesHub,
  onOpenShop,
  onOpenSpaceShop,
  onOpenIndex,
  onOpenBag,
  onOpenSettings,
  onReplayIntro,
  onToggleLang,
}) => {
  const t = LANDING_COPY[lang];
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const { counts: visitCounts, ready: visitCountsReady } = useGameVisitCounts();

  const renderWorldVisits = (gameId: string) => (
    <span className="inline-flex items-center gap-1 font-num text-[11px] font-semibold text-slate-300 whitespace-nowrap">
      <svg
        viewBox="0 0 24 24"
        className="w-3.5 h-3.5 text-slate-400 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <span>
        {visitCountsReady || (visitCounts[gameId] ?? 0) > 0
          ? formatVisitLabel(visitCounts[gameId] ?? 0, lang)
          : '…'}
      </span>
    </span>
  );

  const totalCleared =
    completedNormalCount +
    completedFruitCount +
    completedGoldCount +
    completedSpaceCount +
    completedMonsterCount;
  const totalAllStages =
    totalNormalStages +
    totalFruitStages +
    totalGoldStages +
    totalSpaceStages +
    totalMonsterStages;

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-40 bg-[#070e1a] text-slate-100 flex flex-col overflow-y-auto"
    >
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-20 w-full border-b border-white/10 bg-[#070e1a]/92 backdrop-blur-md">
        <div className="mx-auto max-w-[1160px] h-15 px-4 sm:px-6 flex items-center justify-between gap-4 lg:gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <AdminLongPressTitle className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            {t.brand}
          </AdminLongPressTitle>

          {/* Zone 2: Clean Single-line Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a
              href="#landing-worlds"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {t.navWorlds}
            </a>
            <button
              type="button"
              onClick={onOpenGamesHub}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.navGames}
            </button>
            <button
              type="button"
              onClick={onOpenShop}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.navShop}
            </button>
            <button
              type="button"
              onClick={onOpenIndex}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.navIndex}
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <StatsAdminButton />
            <button
              type="button"
              onClick={() => onStartMainGame()}
              className="h-9 px-4 rounded-lg bg-sky-400 hover:bg-sky-300 active:scale-[0.98] text-slate-950 text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.topCta}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-7 sm:py-12 flex flex-col gap-10 sm:gap-14">
          {/* Hero Split Section — Dominant Visual Anchor + Clear CTA */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center gap-4 sm:gap-5">
              <p className="text-xs sm:text-sm font-medium text-sky-300/90">
                {t.heroKicker}
              </p>

              <h1
                className="font-bold tracking-tight text-white leading-[1.15] text-balance"
                style={{ fontSize: 'clamp(1.85rem, 3.8vw, 3.15rem)' }}
              >
                {t.heroTitle}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-[58ch]">
                {t.heroSubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onStartMainGame()}
                  className="h-11 sm:h-12 px-6 rounded-xl bg-sky-400 hover:bg-sky-300 active:scale-[0.99] text-slate-950 font-extrabold text-sm sm:text-base transition-all whitespace-nowrap cursor-pointer shadow-lg"
                >
                  {t.primaryCta}
                </button>
                <button
                  type="button"
                  onClick={onOpenGamesHub}
                  className="h-11 sm:h-12 px-5 rounded-xl border border-emerald-400/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100 font-bold text-sm sm:text-base transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t.secondaryHubCta}
                </button>
              </div>
            </div>

            {/* Hero 16:9 Artwork Frame */}
            <div className="lg:col-span-6">
              <div className="relative w-full h-full min-h-[220px] sm:min-h-[280px] rounded-2xl overflow-hidden border border-white/12 bg-[#0d192e]">
                {heroImgFailed ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0e1f3d] via-[#0a1326] to-[#1a1530] p-8 text-center">
                    <span className="text-2xl font-bold text-sky-200">{t.brand}</span>
                  </div>
                ) : (
                  <img
                    src={heroArcadeImg}
                    alt={t.brand}
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full lg:h-full object-cover"
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070e1a]/70 via-transparent to-transparent" />
              </div>
            </div>
          </section>

          {/* Full-Width 4-Column Live Progress Strip (Below Hero Split) */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 border-y border-white/10 py-5 sm:py-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">{t.statBestScore}</span>
              <span className="font-num text-2xl sm:text-3xl font-bold text-white">
                {bestScore.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">{t.statCurrency}</span>
              <span className="font-num text-2xl sm:text-3xl font-bold text-amber-300">
                {coins.toLocaleString()}
              </span>
              <span className="font-num text-xs text-pink-300/90">
                {t.statCurrencySub(pinkCoins, spaceCoins)}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">{t.statStages}</span>
              <span className="font-num text-2xl sm:text-3xl font-bold text-sky-300">
                {totalCleared}
              </span>
              <span className="font-num text-xs text-slate-400">
                {t.statStagesSub(totalAllStages)}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">{t.statHearts}</span>
              <span className="font-num text-2xl sm:text-3xl font-bold text-rose-400">
                {lives}/{maxLives}
              </span>
              <span className="text-xs text-slate-400">{t.statHeartsSub}</span>
            </div>
          </section>

          {/* Asymmetric Bento Showcase: 01 Three Worlds (7 cols) + 02 Arcade Hub (5 cols) */}
          <section
            id="landing-worlds"
            className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch"
          >
            {/* 01. Three Worlds */}
            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0c1628] p-5 sm:p-6 flex flex-col justify-between gap-5">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">
                  <span className="font-num text-sky-400 me-2">
                    {t.sectionWorldsNum}
                  </span>
                  {t.sectionWorldsTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {t.sectionWorldsSub}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onStartMainGame('normal')}
                  className="text-start rounded-xl border border-sky-400/25 bg-[#0a1324] hover:border-sky-300/60 hover:bg-[#101e36] p-4 flex flex-col justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold text-white">
                        {t.worldNormalTitle}
                      </div>
                      {renderWorldVisits('world-normal')}
                    </div>
                    <div className="font-num text-xs text-sky-300 mt-0.5">
                      {completedNormalCount}/{totalNormalStages}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mt-2">
                      {t.worldNormalDesc}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-sky-300">
                    {t.enterWorldBtn}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onStartMainGame('fruit')}
                  className="text-start rounded-xl border border-emerald-400/25 bg-[#0a1324] hover:border-emerald-300/60 hover:bg-[#102424] p-4 flex flex-col justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold text-white">
                        {t.worldFruitTitle}
                      </div>
                      {renderWorldVisits('world-fruit')}
                    </div>
                    <div className="font-num text-xs text-emerald-300 mt-0.5">
                      {completedFruitCount}/{totalFruitStages}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mt-2">
                      {t.worldFruitDesc}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-300">
                    {t.enterWorldBtn}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onStartMainGame('gold')}
                  className="text-start rounded-xl border border-amber-400/25 bg-[#0a1324] hover:border-amber-300/60 hover:bg-[#221c12] p-4 flex flex-col justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold text-white">
                        {t.worldGoldTitle}
                      </div>
                      {renderWorldVisits('world-gold')}
                    </div>
                    <div className="font-num text-xs text-amber-300 mt-0.5">
                      {completedGoldCount}/{totalGoldStages}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mt-2">
                      {t.worldGoldDesc}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-300">
                    {t.enterWorldBtn}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onStartMainGame('space')}
                  className="text-start rounded-xl border border-violet-400/35 bg-[#120b29] hover:border-violet-300/75 hover:bg-[#1d1242] p-4 flex flex-col justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold text-white">
                        {t.worldSpaceTitle}
                      </div>
                      {renderWorldVisits('world-space')}
                    </div>
                    <div className="font-num text-xs text-violet-300 mt-0.5">
                      {completedSpaceCount}/{totalSpaceStages}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mt-2">
                      {t.worldSpaceDesc}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-violet-300">
                    {t.enterWorldBtn}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onStartMainGame('monster')}
                  className="sm:col-span-2 text-start rounded-xl border border-rose-500/45 bg-gradient-to-br from-[#230914] via-[#1c0816] to-[#2c120d] hover:border-amber-400/75 hover:from-[#2f0c1b] hover:to-[#3b170e] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm sm:text-base font-extrabold text-amber-100">
                        {t.worldMonsterTitle}
                      </div>
                      {renderWorldVisits('world-monster')}
                    </div>
                    <div className="font-num text-xs text-rose-300 mt-0.5">
                      {completedMonsterCount}/{totalMonsterStages}
                    </div>
                    <p className="text-xs text-rose-100/80 leading-relaxed mt-1.5">
                      {t.worldMonsterDesc}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-amber-300 shrink-0">
                    {t.enterWorldBtn}
                  </span>
                </button>
              </div>
            </div>

            {/* 02. Mini-Games Hub Spotlight */}
            <div className="lg:col-span-5 rounded-2xl border border-emerald-400/25 bg-[#0c1628] p-5 sm:p-6 flex flex-col justify-between gap-5">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">
                  <span className="font-num text-emerald-400 me-2">
                    {t.sectionArcadeNum}
                  </span>
                  {t.sectionArcadeTitle}
                </h2>
                <p className="text-xs font-semibold text-emerald-300 mt-1">
                  {t.sectionArcadeMeta}
                </p>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-3">
                  {t.sectionArcadeDesc}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onOpenGamesHub}
                  className="w-full h-12 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:scale-[0.99] text-slate-950 font-extrabold text-sm sm:text-base transition-all cursor-pointer shadow-lg"
                >
                  {t.openArcadeBtn}
                </button>
              </div>
            </div>
          </section>

          {/* 03. Shop, Bag & Index */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-white">
                <span className="font-num text-sky-400 me-2">
                  {t.sectionGearNum}
                </span>
                {t.sectionGearTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {t.sectionGearSub}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-[#0c1628] p-5 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {t.cardShopTitle}
                  </h3>
                  <p className="text-xs text-amber-300 mt-0.5">
                    {t.cardShopMeta}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2.5">
                    {t.cardShopDesc}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onOpenShop}
                    className="h-10 px-3 rounded-lg border border-amber-400/35 bg-amber-500/15 hover:bg-amber-500/25 text-amber-100 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {t.cardShopBtn}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenSpaceShop}
                    className="h-10 px-3 rounded-lg border border-violet-400/45 bg-gradient-to-r from-violet-500/25 to-cyan-500/20 hover:from-violet-500/35 hover:to-cyan-500/30 text-cyan-100 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {t.cardSpaceShopBtn}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0c1628] p-5 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {t.cardBagTitle}
                  </h3>
                  <p className="font-num text-xs text-rose-300 mt-0.5">
                    {t.cardBagMeta(totalBagCount)}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2.5">
                    {t.cardBagDesc}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onOpenBag}
                    className="h-10 px-3 rounded-lg border border-rose-400/35 bg-rose-500/15 hover:bg-rose-500/25 text-rose-100 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {t.openBagBtn}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenIndex}
                    className="h-10 px-3 rounded-lg border border-white/15 bg-slate-900/80 hover:bg-slate-800 text-slate-100 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {t.openIndexBtn}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="w-full border-t border-white/10 bg-[#060c17] mt-auto">
        <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>{t.footerNote}</span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {onOpenSettings && (
              <>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-amber-300 hover:text-amber-200 font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t.openStatsLabel}
                </button>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
              </>
            )}
            <button
              type="button"
              onClick={onReplayIntro}
              className="text-slate-300 hover:text-amber-300 font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              {t.replayIntro}
            </button>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <button
              type="button"
              onClick={onToggleLang}
              className="text-slate-300 hover:text-white font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              {t.langSwitch}
            </button>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <button
              type="button"
              onClick={() => onStartMainGame()}
              className="text-sky-300 hover:text-sky-200 font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              {t.topCta}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
