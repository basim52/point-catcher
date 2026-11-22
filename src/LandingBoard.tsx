import React, { useState } from 'react';
import { GameMode } from './fruitWorld';
import heroArcadeImg from './assets/images/landing_hero_arcade_1795342078886.jpg';

export interface LandingBoardProps {
  lang: 'ar' | 'en';
  bestScore: number;
  coins: number;
  pinkCoins: number;
  lives: number;
  maxLives: number;
  completedNormalCount: number;
  totalNormalStages: number;
  completedFruitCount: number;
  totalFruitStages: number;
  completedGoldCount: number;
  totalGoldStages: number;
  totalBagCount: number;
  onStartMainGame: (mode?: GameMode) => void;
  onOpenGamesHub: () => void;
  onOpenDateCatcher: () => void;
  onOpenDesertRally: () => void;
  onOpenShawarma: () => void;
  onOpenShop: () => void;
  onOpenIndex: () => void;
  onOpenBag: () => void;
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
    heroKicker: '3 عوالم · 135 مرحلة · 10 ألعاب مصغرة (3 ألعاب 3D)',
    heroTitle: 'التقط النقاط النادرة، طوّر أدواتك، وتحدَّ صالة الألعاب',
    heroSubtitle:
      'انطلق في مغامرة صياد النقاط، أو جرّب ألعابنا ثلاثية الأبعاد الجديدة «ملك الشاورما 3D» و«سباق الصحراء 3D» و«صيد التمر 3D».',
    primaryCta: 'ابدأ صياد النقاط',
    shawarmaCta: 'ملك الشاورما 3D',
    desertRallyCta: 'سباق الصحراء 3D',
    dateCatcherCta: 'صيد التمر 3D',
    secondaryHubCta: 'صالة الألعاب (10)',
    statBestScore: 'أعلى نتيجة',
    statCurrency: 'رصيد العملات',
    statCurrencySub: (pink: number) => `${pink} عملة وردية`,
    statStages: 'المراحل المكتملة',
    statStagesSub: (total: number) => `من أصل ${total} مرحلة`,
    statHearts: 'القلوب المتاحة',
    statHeartsSub: 'تتجدد تلقائياً كل 5 دقائق',
    sectionWorldsNum: '01.',
    sectionWorldsTitle: 'العوالم الثلاثة',
    sectionWorldsSub: 'اختر عالمك وابدأ التحدي مباشرة مع حفظ كامل لتقدمك.',
    worldNormalTitle: 'العالم العادي',
    worldNormalDesc: '75 مرحلة متصاعدة مع الجوهرة الملكية +10 نقاط والعملات الوردية.',
    worldFruitTitle: 'عالم الفواكه',
    worldFruitDesc: '30 مرحلة من الفواكه المنعشة والذرة الذهبية وتأثيرات السرعة.',
    worldGoldTitle: 'العالم الذهبي',
    worldGoldDesc: '30 مرحلة من الكنوز والألماس والمكافآت المضاعفة.',
    enterWorldBtn: 'دخول العالم',
    sectionArcadeNum: '02.',
    sectionArcadeTitle: 'صالة الألعاب المصغرة',
    sectionArcadeMeta: '10 ألعاب جاهزة — أحدثها: ملك الشاورما 3D',
    sectionArcadeDesc:
      'لغز الأسهم، 2048، الثعبان، أمسك التفاح، فسيفساء الأسهم، دمج الفواكه، تكسير النيون، صيد التمر 3D، سباق الصحراء 3D، وملك الشاورما 3D.',
    openArcadeBtn: 'فتح صالة الألعاب',
    sectionGearNum: '03.',
    sectionGearTitle: 'المتجر والحقيبة والاندكس',
    sectionGearSub: 'انتقل بضغطة واحدة إلى أي قسم في المنصة.',
    cardShopTitle: 'المتجر والتطويرات',
    cardShopMeta: 'مظاهر · دروع · حتى 15 قلب',
    cardShopDesc:
      'افتح مظاهر جديدة للمركبة والنقاط، واشترِ تطويرات زيادة القلوب بالعملات الوردية.',
    cardShopBtn: 'دخول المتجر',
    cardBagTitle: 'الحقيبة والاندكس',
    cardBagMeta: (bag: number) => `${bag} عناصر في الحقيبة`,
    cardBagDesc:
      'تفقّد القلوب والذرة والألماس المخزّنة في حقيبتك واستعرض موسوعة كل العناصر المكتشفة.',
    openBagBtn: 'الحقيبة',
    openIndexBtn: 'الاندكس',
    footerNote: 'جميع التقدمات والمراحل والأرقام القياسية محفوظة تلقائياً على جهازك.',
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
    heroKicker: '3 Worlds · 135 Stages · 10 Mini-Games (Three 3D Games)',
    heroTitle: 'Catch Rare Gems, Upgrade Your Gear, and Master the Arcade',
    heroSubtitle:
      'Jump into Point Catcher across 3 worlds, or launch our 3D games Shawarma King 3D, Desert Rally 3D, and Date Catcher 3D right away.',
    primaryCta: 'Play Point Catcher',
    shawarmaCta: 'Shawarma King 3D',
    desertRallyCta: 'Desert Rally 3D',
    dateCatcherCta: 'Date Catcher 3D',
    secondaryHubCta: 'Games Hub (10)',
    statBestScore: 'Best Score',
    statCurrency: 'Coin Balance',
    statCurrencySub: (pink: number) => `${pink} Pink Coins`,
    statStages: 'Stages Cleared',
    statStagesSub: (total: number) => `out of ${total} stages`,
    statHearts: 'Hearts Ready',
    statHeartsSub: 'Regenerates every 5 minutes',
    sectionWorldsNum: '01.',
    sectionWorldsTitle: 'Three Worlds',
    sectionWorldsSub: 'Pick any world and dive straight into your saved stage.',
    worldNormalTitle: 'Normal World',
    worldNormalDesc: '75 escalating stages featuring +10 Royal Prisms and Pink Coins.',
    worldFruitTitle: 'Fruit World',
    worldFruitDesc: '30 vibrant fruit stages with Golden Corn lives and speed boosts.',
    worldGoldTitle: 'Gold World',
    worldGoldDesc: '30 treasure stages packed with Diamonds and high coin payouts.',
    enterWorldBtn: 'Enter World',
    sectionArcadeNum: '02.',
    sectionArcadeTitle: 'Mini-Games Hub',
    sectionArcadeMeta: '10 playable games — Newest: Shawarma King 3D',
    sectionArcadeDesc:
      'Arrow Escape, 2048, Snake, Apple Catch, Arrow Mosaic, Fruit Merge, Brick Breaker, Date Catcher 3D, Desert Rally 3D, and Shawarma King 3D.',
    openArcadeBtn: 'Open Games Hub',
    sectionGearNum: '03.',
    sectionGearTitle: 'Shop, Bag & Index',
    sectionGearSub: 'Jump directly to your upgrades and item encyclopedia.',
    cardShopTitle: 'Shop & Upgrades',
    cardShopMeta: 'Skins · Shields · Up to 15 Hearts',
    cardShopDesc:
      'Unlock catcher skins, custom point designs, and max-heart upgrades with your Pink Coins.',
    cardShopBtn: 'Open Shop',
    cardBagTitle: 'Bag & Index',
    cardBagMeta: (bag: number) => `${bag} items stored`,
    cardBagDesc:
      'Manage your stored Hearts, Corn, and Diamonds or browse every discovered item in the Index.',
    openBagBtn: 'Bag',
    openIndexBtn: 'Index',
    footerNote: 'All stage progress and high scores are saved locally on your device.',
    replayIntro: 'Replay Intro Logo',
    langSwitch: 'العربية',
  },
} as const;

export const LandingBoard: React.FC<LandingBoardProps> = ({
  lang,
  bestScore,
  coins,
  pinkCoins,
  lives,
  maxLives,
  completedNormalCount,
  totalNormalStages,
  completedFruitCount,
  totalFruitStages,
  completedGoldCount,
  totalGoldStages,
  totalBagCount,
  onStartMainGame,
  onOpenGamesHub,
  onOpenDateCatcher,
  onOpenDesertRally,
  onOpenShawarma,
  onOpenShop,
  onOpenIndex,
  onOpenBag,
  onReplayIntro,
  onToggleLang,
}) => {
  const t = LANDING_COPY[lang];
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const totalCleared =
    completedNormalCount + completedFruitCount + completedGoldCount;
  const totalAllStages =
    totalNormalStages + totalFruitStages + totalGoldStages;

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-40 bg-[#070e1a] text-slate-100 flex flex-col overflow-y-auto"
    >
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-20 w-full border-b border-white/10 bg-[#070e1a]/92 backdrop-blur-md">
        <div className="mx-auto max-w-[1160px] h-15 px-4 sm:px-6 flex items-center justify-between gap-4 lg:gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            {t.brand}
          </span>

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
          <div className="flex items-center shrink-0">
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
                  onClick={onOpenShawarma}
                  className="h-11 sm:h-12 px-5 rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 hover:from-amber-200 hover:to-orange-400 active:scale-[0.99] text-[#261105] font-extrabold text-sm sm:text-base transition-all whitespace-nowrap cursor-pointer shadow-lg"
                >
                  {t.shawarmaCta}
                </button>
                <button
                  type="button"
                  onClick={() => onStartMainGame()}
                  className="h-11 sm:h-12 px-5 rounded-xl bg-sky-400 hover:bg-sky-300 active:scale-[0.99] text-slate-950 font-bold text-sm sm:text-base transition-all whitespace-nowrap cursor-pointer"
                >
                  {t.primaryCta}
                </button>
                <button
                  type="button"
                  onClick={onOpenGamesHub}
                  className="h-11 sm:h-12 px-4 rounded-xl border border-emerald-400/35 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100 font-bold text-sm sm:text-base transition-colors whitespace-nowrap cursor-pointer"
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
                {t.statCurrencySub(pinkCoins)}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => onStartMainGame('normal')}
                  className="text-start rounded-xl border border-sky-400/25 bg-[#0a1324] hover:border-sky-300/60 hover:bg-[#101e36] p-4 flex flex-col justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-bold text-white">
                      {t.worldNormalTitle}
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
                    <div className="text-sm font-bold text-white">
                      {t.worldFruitTitle}
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
                    <div className="text-sm font-bold text-white">
                      {t.worldGoldTitle}
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
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={onOpenDateCatcher}
                    className="w-full h-10 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-[#2a1104] font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer truncate px-1.5"
                  >
                    {t.dateCatcherCta}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenDesertRally}
                    className="w-full h-10 rounded-xl bg-orange-400 hover:bg-orange-300 active:scale-[0.99] text-slate-950 font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer truncate px-1.5"
                  >
                    {t.desertRallyCta}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenShawarma}
                    className="w-full h-10 rounded-xl bg-rose-400 hover:bg-rose-300 active:scale-[0.99] text-slate-950 font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer truncate px-1.5"
                  >
                    {t.shawarmaCta}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onOpenGamesHub}
                  className="w-full h-11 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:scale-[0.99] text-slate-950 font-bold text-sm transition-all cursor-pointer"
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
                <button
                  type="button"
                  onClick={onOpenShop}
                  className="h-10 px-4 rounded-lg border border-amber-400/35 bg-amber-500/15 hover:bg-amber-500/25 text-amber-100 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t.cardShopBtn}
                </button>
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
          <div className="flex items-center gap-4">
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
