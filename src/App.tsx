/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CornIcon,
  drawFruitBackground,
  drawFruitCanvasItem,
  drawFruitPearCatcher,
  FRUIT_INDEX_CATALOG,
  FRUIT_ITEM_STATS,
  FRUIT_STAGES,
  FRUIT_UNLOCK_COST,
  FruitBgMotif,
  FruitIndexIcon,
  FruitItemKind,
  FruitRenderItem,
  GameMode,
  getFruitStageClearCoins,
  initFruitBgMotifs,
  MAX_CORN,
  TOTAL_FRUIT_STAGES,
  VALID_FRUIT_KINDS,
} from './fruitWorld';
import {
  DIAMOND_COST_COINS,
  DiamondIcon,
  drawGoldBackground,
  drawGoldCanvasItem,
  drawGoldTreasureCatcher,
  getGoldStageClearCoins,
  GOLD_INDEX_CATALOG,
  GOLD_ITEM_STATS,
  GOLD_STAGES,
  GOLD_UNLOCK_COST,
  GoldBgMotif,
  GoldIndexIcon,
  GoldItemKind,
  GoldRenderItem,
  initGoldBgMotifs,
  MAX_DIAMONDS,
  TOTAL_GOLD_STAGES,
  VALID_GOLD_KINDS,
} from './goldWorld';
import {
  CatcherSkinId,
  drawCatcherShieldBubble,
  drawCustomMinusPoint,
  drawCustomPlusPoint,
  drawUfoCatcher,
  getSkinPalette,
  MAX_SHIELDS,
  MINUS_POINT_CATALOG,
  MinusPointSkinId,
  persistShopState,
  PinkCoinIcon,
  PLUS_POINT_CATALOG,
  PlusPointSkinId,
  PointsSubTab,
  readStoredShopState,
  SHIELD_DURATION,
  ShopModal,
  ShopState,
  ShopTab,
  SKIN_CATALOG,
  SUPPLY_CATALOG,
  SupplyId,
} from './shop';
import { GamesModal } from './miniGames';

type Lang = 'ar' | 'en';
type GameStatus =
  | 'START'
  | 'PLAYING'
  | 'PAUSED'
  | 'STAGE_CLEAR'
  | 'GAME_OVER'
  | 'VICTORY';
type ItemKind =
  | 'pink_circle'
  | 'blue_triangle'
  | 'green_circle'
  | 'purple_diamond'
  | 'gold_star'
  | 'hazard_spike'
  | 'hazard_square'
  | 'hazard_star'
  | 'hazard_arrow'
  | 'hazard_arrow_amber'
  | 'hazard_arrow_violet';
type AnyItemKind = ItemKind | FruitItemKind | GoldItemKind;
type IndexTab = 'positive' | 'negative';

interface IndexEntry {
  kind: ItemKind;
  category: IndexTab;
  nameAr: string;
  nameEn: string;
  valueAr: string;
  valueEn: string;
  benefitAr: string;
  benefitEn: string;
}

interface StageConfig {
  stage: number;
  startScore: number;
  targetScore: number;
  pointsNeeded: number;
  baseSpeed: number;
  spawnInterval: number;
  hazardChance: number;
  squareHazardRatio: number;
  starHazardRatio: number;
  arrowHazardRatio: number;
  lateralDrift: number;
}

interface FallingItem {
  id: number;
  kind: AnyItemKind;
  x: number;
  y: number;
  radius: number;
  speed: number;
  vx: number;
  rotation: number;
  rotSpeed: number;
  pulsePhase: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface AmbientStar {
  x: number;
  y: number;
  r: number;
  speed: number;
  alpha: number;
}

const MAX_LIVES = 10;
const HEART_REGEN_MS = 5 * 60 * 1000;
const HEART_COST_COINS = 5;
const TOTAL_STAGES = 50;
const PINK_CIRCLE_POINTS = 3;
const BLUE_TRIANGLE_POINTS = 4;
const GREEN_CIRCLE_POINTS = 2;
const PURPLE_DIAMOND_POINTS = 5;
const GOLD_STAR_POINTS = 7;
const SPEED_BOOST_DURATION = 5.0;
const SPEED_BOOST_MULTIPLIER = 2.0;
const SPEED_BOOST_PLAYER_SLOW = 0.5;
const ARROW_SPEED_MULTIPLIER = 2.5;
const AMBER_ARROW_SPEED_MULTIPLIER = 1.22;
const AMBER_ARROW_POINT_PENALTY = 2;
const VIOLET_ARROW_SPEED_MULTIPLIER = 1.3;
const VIOLET_ARROW_POINT_PENALTY = 1;
const VIOLET_ARROW_SLOW_DURATION = 2.5;
const VIOLET_ARROW_SLOW_FACTOR = 0.7;
const FREEZE_STAR_POINTS = 3;
const FREEZE_DURATION = 4.0;
const BEST_SCORE_STORAGE_KEY = 'point_catcher_best_score_v1';
const COINS_STORAGE_KEY = 'point_catcher_coins_v1';
const PINK_COINS_STORAGE_KEY = 'point_catcher_pink_coins_v1';
const PINK_COIN_DROP_CHANCE = 0.5;
const PINK_COIN_MIN_DROP = 1;
const PINK_COIN_MAX_DROP = 3;
const LIVES_STATE_STORAGE_KEY = 'point_catcher_lives_state_v1';
const COMPLETED_STAGES_STORAGE_KEY = 'point_catcher_completed_stages_v1';
const DISCOVERED_ITEMS_STORAGE_KEY = 'point_catcher_discovered_items_v2';
const FRUIT_UNLOCKED_STORAGE_KEY = 'point_catcher_fruit_unlocked_v1';
const COMPLETED_FRUIT_STAGES_STORAGE_KEY = 'point_catcher_completed_fruit_stages_v1';
const DISCOVERED_FRUIT_ITEMS_STORAGE_KEY = 'point_catcher_discovered_fruit_items_v1';
const CORN_STATE_STORAGE_KEY = 'point_catcher_corn_state_v1';
const GOLD_UNLOCKED_STORAGE_KEY = 'point_catcher_gold_unlocked_v1';
const COMPLETED_GOLD_STAGES_STORAGE_KEY = 'point_catcher_completed_gold_stages_v1';
const DISCOVERED_GOLD_ITEMS_STORAGE_KEY = 'point_catcher_discovered_gold_items_v1';
const DIAMONDS_STATE_STORAGE_KEY = 'point_catcher_diamonds_state_v1';
const BAG_STORAGE_KEY = 'point_catcher_bag_v1';
const SFX_STORAGE_KEY = 'point_catcher_sfx_v1';
const MUSIC_STORAGE_KEY = 'point_catcher_music_v1';
const LANG_STORAGE_KEY = 'point_catcher_lang_v1';

interface BagState {
  hearts: number;
  corn: number;
  diamonds: number;
}

const INDEX_CATALOG: IndexEntry[] = [
  {
    kind: 'pink_circle',
    category: 'positive',
    nameAr: 'الدائرة الوردية',
    nameEn: 'Pink Circle',
    valueAr: '+3 نقاط',
    valueEn: '+3 pts',
    benefitAr: 'تزيد نقاطك بمقدار 3 نقاط عند التقاطها لتقترب من إنهاء المرحلة.',
    benefitEn: 'Adds 3 points to your stage score when caught.',
  },
  {
    kind: 'blue_triangle',
    category: 'positive',
    nameAr: 'المثلث الأزرق',
    nameEn: 'Blue Triangle',
    valueAr: '+4 نقاط',
    valueEn: '+4 pts',
    benefitAr: 'يعطيك 4 نقاط دفعة واحدة لإكمال هدف المرحلة بسرعة أكبر.',
    benefitEn: 'Grants 4 points at once to reach the stage goal faster.',
  },
  {
    kind: 'green_circle',
    category: 'positive',
    nameAr: 'النقطة الخضراء المسرّعة',
    nameEn: 'Green Turbo Orb',
    valueAr: '+2 نقاط · سرعة ×2 · مشية -50%',
    valueEn: '+2 pts · 2x World · -50% Move',
    benefitAr: 'تزيد نقاطك بمقدار نقطتين وتسرّع كل شيء في اللعبة بنسبة 100% لمدة 5 ثوانٍ، لكنها تبطّئ مشيتك بنسبة 50%.',
    benefitEn: 'Adds 2 points and speeds up everything by 100% for 5 seconds, while slowing your movement by 50%.',
  },
  {
    kind: 'purple_diamond',
    category: 'positive',
    nameAr: 'المعيّن البنفسجي',
    nameEn: 'Purple Diamond',
    valueAr: '+5 نقاط · مرحلة 20+ · 5%',
    valueEn: '+5 pts · Stage 20+ · 5%',
    benefitAr: 'نقطة كريستالية نادرة تبدأ بالظهور من المرحلة 20 بنسبة ظهور 5% وتمنحك 5 نقاط دفعة واحدة.',
    benefitEn: 'Rare crystal point starting at Stage 20 with a 5% spawn rate that grants 5 points at once.',
  },
  {
    kind: 'gold_star',
    category: 'positive',
    nameAr: 'النجمة الذهبية',
    nameEn: 'Golden Star',
    valueAr: '+7 نقاط · مرحلة 20+ · 5%',
    valueEn: '+7 pts · Stage 20+ · 5%',
    benefitAr: 'أقوى نقطة في المراحل العادية — تبدأ بالظهور من المرحلة 20 بنسبة ظهور 5% وتزيد نقاطك بمقدار 7 نقاط!',
    benefitEn: 'Highest-value Normal point — starts at Stage 20 with a 5% spawn rate and awards 7 points on catch!',
  },
  {
    kind: 'hazard_spike',
    category: 'negative',
    nameAr: 'العائق الأحمر الشائك',
    nameEn: 'Red Spike',
    valueAr: '-1 روح',
    valueEn: '-1 Life',
    benefitAr: 'ينقص قلباً واحداً عند الاصطدام به، تجنّبه للحفاظ على القلوب الكاملة.',
    benefitEn: 'Removes 1 heart on impact; dodge it to preserve your lives.',
  },
  {
    kind: 'hazard_square',
    category: 'negative',
    nameAr: 'المربع الأحمر',
    nameEn: 'Red Square',
    valueAr: '-2 أرواح',
    valueEn: '-2 Lives',
    benefitAr: 'عائق ثقيل ينقص قلبَين دفعة واحدة عند لمسه (يبدأ من المرحلة 5).',
    benefitEn: 'Heavy hazard that removes 2 hearts on impact (starts at Stage 5).',
  },
  {
    kind: 'hazard_star',
    category: 'negative',
    nameAr: 'النجمة الحمراء المجمّدة',
    nameEn: 'Red Freeze Star',
    valueAr: 'تجميد 4ث · +3 نقاط',
    valueEn: 'Freeze 4s · +3 pts',
    benefitAr: 'تجمّد حركتك لمدة 4 ثوانٍ عند التقاطها وتعطيك 3 نقاط (تبدأ من المرحلة 10).',
    benefitEn: 'Freezes your movement for 4 seconds on catch while awarding 3 points (Stage 10+).',
  },
  {
    kind: 'hazard_arrow',
    category: 'negative',
    nameAr: 'السهم الأحمر السريع',
    nameEn: 'Red Fast Arrow',
    valueAr: '-1 روح · سرعة +150%',
    valueEn: '-1 Life · +150% Speed',
    benefitAr: 'سهم أحمر ينزل بسرعة أكبر من الباقي بنسبة 150% (×2.5) وينقص قلباً واحداً عند لمسه.',
    benefitEn: 'Blazing red arrow falling 150% faster (2.5x) than normal items; removes 1 heart on impact.',
  },
  {
    kind: 'hazard_arrow_amber',
    category: 'negative',
    nameAr: 'السهم الذهبي المائل',
    nameEn: 'Golden Slant Arrow',
    valueAr: '-2 نقاط · مرحلة 3+',
    valueEn: '-2 pts · Stage 3+',
    benefitAr: 'سهم ذهبي خفيف ينزل بزاوية مائلة وبسرعة معتدلة؛ لا ينقص القلوب بل يخصم نقطتين فقط من رصيد المرحلة (من المرحلة 3).',
    benefitEn: 'Mild golden slanted dart at moderate speed; spares your hearts and only deducts 2 stage points (Stage 3+).',
  },
  {
    kind: 'hazard_arrow_violet',
    category: 'negative',
    nameAr: 'السهم البنفسجي المبطّئ',
    nameEn: 'Violet Slow Arrow',
    valueAr: 'تبطيء 2.5ث · -1 نقطة · مرحلة 6+',
    valueEn: 'Slow 2.5s · -1 pt · Stage 6+',
    benefitAr: 'سهم بنفسجي معتدل السرعة لا ينقص القلوب؛ يخصم نقطة واحدة ويبطّئ حركتك قليلاً (-30%) لمدة 2.5 ثانية (من المرحلة 6).',
    benefitEn: 'Moderate-speed violet bolt that spares your hearts; deducts 1 point and gently slows movement (-30%) for 2.5s (Stage 6+).',
  },
];

const VALID_ITEM_KINDS: ItemKind[] = INDEX_CATALOG.map((item) => item.kind);

function getStageClearCoins(remainingLives: number): number {
  if (remainingLives >= 8) return 8;
  if (remainingLives >= 4) return 4;
  return 2;
}

// Build 50 stages with smooth difficulty progression:
// Stage 1+: Red Spike (-1) & Red Fast Arrow (-1, +150% speed); Stage 5+: Red Square (-2); Stage 10+: Red Freeze Star (4s freeze + 3 pts).
const STAGES: StageConfig[] = (() => {
  const list: StageConfig[] = [];
  let cumulative = 0;
  for (let s = 1; s <= TOTAL_STAGES; s++) {
    const t = (s - 1) / (TOTAL_STAGES - 1);
    const tCurve = Math.pow(t, 0.85);
    const pointsNeeded = Math.round((45 + s * 14) * 0.95);
    const startScore = cumulative;
    cumulative += pointsNeeded;
    const rawSquareRatio =
      s < 5 ? 0 : 0.28 + ((s - 5) / (TOTAL_STAGES - 5)) * 0.34;
    const starHazardRatio =
      s < 10 ? 0 : 0.16 + ((s - 10) / (TOTAL_STAGES - 10)) * 0.1;
    const arrowHazardRatio = 0.16 + tCurve * 0.12;
    list.push({
      stage: s,
      startScore,
      targetScore: cumulative,
      pointsNeeded,
      baseSpeed: (220 + tCurve * 365) * 0.95,
      spawnInterval: Math.max(0.16, (0.68 - tCurve * 0.5) * 1.05),
      hazardChance: Math.min(0.62, (0.34 + tCurve * 0.28) * 0.95),
      squareHazardRatio: rawSquareRatio * 0.95,
      starHazardRatio,
      arrowHazardRatio,
      lateralDrift: (26 + tCurve * 115) * 0.95,
    });
  }
  return list;
})();

function isStageUnlocked(stage: number, completed: number[]): boolean {
  if (stage <= 1) return true;
  return completed.includes(stage - 1) || completed.includes(stage);
}



const COPY = {
  ar: {
    title: 'صياد النقاط',
    rule: 'اجتز 50 مرحلة بالتقاط النقاط وتجنّب العوائق والسهام الحمراء السريعة (10 قلوب تتجدد كل 5 دقائق).',
    startBtn: 'ابدأ اللعب',
    playAgainBtn: 'العب مرة أخرى',
    resumeBtn: 'استئناف اللعب',
    restartBtn: 'إعادة البدء',
    score: 'النقاط',
    best: 'الأفضل',
    bestFull: 'أفضل نتيجة',
    lives: 'الأرواح',
    stage: 'المرحلة',
    stageReached: 'المرحلة التي وصلت إليها',
    gameOver: 'انتهت اللعبة',
    victoryTitle: 'مبروك! أنهيت جميع المراحل',
    victorySubtitle: 'أكملت المراحل الـ 50 بنجاح!',
    finalScore: 'النتيجة النهائية',
    newBest: 'رقم قياسي جديد!',
    paused: 'إيقاف مؤقت',
    pinkLegend: 'دائرة وردية (+3)',
    blueLegend: 'مثلث أزرق (+4)',
    spikeLegend: 'عائق أحمر (-1 روح)',
    squareLegend: 'مربع أحمر (-2 روح)',
    controlsHint: 'الأسهم أو A / D أو السحب للتحريك',
    moveLeft: 'تحريك لليسار',
    moveRight: 'تحريك لليمين',
    mute: 'كتم الصوت',
    unmute: 'تفعيل الصوت',
    pause: 'إيقاف مؤقت',
    resume: 'استئناف',
    langToggle: 'EN',
    langToggleAria: 'Switch to English',
    stageBanner: (n: number) => `المرحلة ${n}`,
    stageGoalLabel: (n: number) => `الهدف: ${n} نقطة`,
    stageCompleteTitle: (n: number) => `أكملت المرحلة ${n}!`,
    nextStageBtn: (n: number) => `الانتقال إلى المرحلة ${n}`,
    nextGoalText: (pts: number) => `هدف المرحلة التالية: ${pts} نقطة`,
    stagesBtn: 'المراحل',
    gamesBtn: 'اللعاب',
    stagesModalTitle: 'المراحل',
    stagesModalHint: `سعر القلب ثابت (${HEART_COST_COINS} فلوس) · مكافأة الفوز بالمرحلة (حسب القلوب المتبقية): 1–3 = 2، 4–7 = 4، 8–10 = 8 فلوس.`,
    noHeartsNotice: (timer: string) => `نفدت القلوب — يتجدد القلب القادم خلال ${timer}`,
    waitHeartBtn: (timer: string) => `انتظر تجدد القلب (${timer})`,
    nextHeartShort: (timer: string) => `+1♥ خلال ${timer}`,
    buyHeartBtn: `+1 قلب (${HEART_COST_COINS} فلوس)`,
    buyHeartAria: `شراء قلب واحد مقابل ${HEART_COST_COINS} فلوس`,
    heartsFullTip: 'القلوب ممتلئة (10/10)',
    needCoinsTip: `تحتاج ${HEART_COST_COINS} فلوس لشراء قلب`,
    lockedStageAria: (n: number) => `المرحلة ${n} مقفلة`,
    indexBtn: 'الاندكس',
    indexModalTitle: 'الاندكس',
    indexModalHint: 'جميع النقاط والعوائق — كل عنصر يبقى مقفلاً ولا تظهر فائدته إلا عندما تلتقطه أو تلمسه.',
    indexPlusTab: 'الزائد (+)',
    indexMinusTab: 'السالب (-)',
    indexDiscoveredCount: (found: number, total: number) => `${found}/${total} مكتشف`,
    indexUnknownTitle: '؟؟؟',
    indexLockedBadge: 'مقفول',
    indexLockedDesc: 'لم يُكتشف بعد — ينفتح وتظهر فائدته عندما تلتقطه أو تلمسه.',
    shopBtn: 'المتجر',
    bagBtn: 'الحقيبة',
    bagTitle: 'الحقيبة',
    bagDesc: 'خزّن القلوب والذرة والألماس في حقيبتك، واضغط «استخدام» في أي وقت لزيادة رصيدك بـ +1.',
    bagInBagLabel: 'في الحقيبة',
    bagActiveLabel: 'الحالي',
    bagUseBtn: 'استخدام (+1)',
    bagStoreBtn: 'تخزين +1',
    bagBuyBtn: `شراء للحقيبة (${HEART_COST_COINS} فلوس)`,
    bagBuyDiamondBtn: `شراء للحقيبة (${DIAMOND_COST_COINS} عملة وردية)`,
    bagFullBadge: 'ممتلئ 10/10',
    bagEmptyHint: 'فارغ',
    bagHeartsTitle: 'القلوب المخزّنة',
    bagHeartsSub: 'للمراحل العادية',
    bagCornTitle: 'الذرة المخزّنة',
    bagCornSub: 'لمراحل الفواكه',
    bagDiamondsTitle: 'الألماس المخزّن',
    bagDiamondsSub: 'لمراحل الذهب',
    settingsBtn: 'الإعدادات',
    settingsTitle: 'الإعدادات',
    musicLabel: 'الموسيقى الحماسية',
    musicDesc: 'موسيقى إلكترونية سريعة أثناء اللعب',
    sfxLabel: 'المؤثرات الصوتية',
    sfxDesc: 'أصوات التقاط النقاط والعوائق والمراحل',
    languageLabel: 'اللغة',
    onLabel: 'تشغيل',
    offLabel: 'إيقاف',
    coins: 'الفلوس',
    pinkCoins: 'عملات وردية',
    pinkCoinShortBenefit: 'لشراء الألماس',
    pinkCoinBenefitTitle: 'فائدة العملة الوردية',
    pinkCoinBenefitDesc: `تُستخدم لشراء الألماس لمراحل الذهب (${DIAMOND_COST_COINS} عملة وردية = +1 ألماسة). مع كل نقطة تمسكها احتمال 50% أن تعطيك من 1 إلى 3 عملات وردية (فقط في المراحل التي لم تفز بها بعد).`,
    coinsEarned: (earned: number, remainingLives: number) =>
      earned <= 0
        ? 'تم استلام مكافأة هذه المرحلة مسبقاً (بدون فلوس إضافية)'
        : `+${earned} فلوس مكافأة إنهاء المرحلة (${remainingLives} ${
            remainingLives === 1 ? 'قلب' : remainingLives === 2 ? 'قلبان' : 'قلوب'
          })!`,
    ptsShort: 'نقطة',
    close: 'إغلاق',
    normalWorldLabel: 'المراحل العادية',
    fruitWorldLabel: 'مراحل الفواكه',
    cornLabel: 'الذرة',
    fruitVictoryTitle: 'مبروك! أنهيت مراحل الفواكه',
    fruitVictorySubtitle: 'أكملت مراحل الفواكه الـ 15 بنجاح!',
    fruitStageBanner: (n: number) => `الفواكه · المرحلة ${n}`,
    fruitStageCompleteTitle: (n: number) => `أكملت مرحلة الفواكه ${n}!`,
    fruitNextStageBtn: (n: number) => `الانتقال إلى مرحلة الفواكه ${n}`,
    fruitUnlockTitle: 'عالم الفواكه (15 مرحلة)',
    fruitUnlockDesc:
      'افتح 15 مرحلة بخلفية بستان الفواكه مع فواكه تزيد النقاط (+2 إلى +5) وخضار تنقص النقاط والذرة (10 ذرة خاصة)، بالإضافة إلى اندكس خاص بالفواكه.',
    fruitUnlockBtn: `فتح مراحل الفواكه (${FRUIT_UNLOCK_COST} فلوس)`,
    fruitNeedCoins: (need: number) => `تحتاج ${need} فلوس إضافية لفتح مراحل الفواكه`,
    fruitStagesModalHint:
      `15 مرحلة للفواكه — سعر الذرة ثابت (${HEART_COST_COINS} فلوس) · مكافأة الفوز بالمرحلة (حسب الذرة المتبقية): 1 = 6 · 2 = 12 · 3+ = 18 فلوس.`,
    noCornNotice: (timer: string) => `نفدت الذرة — تتجدد الذرة القادمة خلال ${timer}`,
    waitCornBtn: (timer: string) => `انتظر تجدد الذرة (${timer})`,
    buyCornBtn: `+1 ذرة (${HEART_COST_COINS} فلوس)`,
    buyCornAria: `شراء ذرة واحدة مقابل ${HEART_COST_COINS} فلوس`,
    cornFullTip: 'الذرة ممتلئة (10/10)',
    needCoinsCornTip: `تحتاج ${HEART_COST_COINS} فلوس لشراء ذرة`,
    fruitIndexWorldBtn: 'اندكس الفواكه',
    normalIndexWorldBtn: 'الاندكس العادي',
    fruitIndexModalHint:
      'جميع الفواكه والخضار — كل عنصر يبقى مقفلاً ولا تظهر فائدته إلا عندما تلتقطه أو تلمسه في مراحل الفواكه.',
    fruitIndexPlusTab: 'الفواكه (+)',
    fruitIndexMinusTab: 'الخضار (-)',
    fruitCoinsEarned: (earned: number, remainingCorn: number) =>
      earned <= 0
        ? 'تم استلام مكافأة هذه المرحلة مسبقاً (بدون فلوس إضافية)'
        : `+${earned} فلوس مكافأة إنهاء المرحلة (${remainingCorn} ذرة)!`,
    goldWorldLabel: 'مراحل الذهب',
    diamondsLabel: 'الألماس',
    goldVictoryTitle: 'مبروك! أنهيت مراحل الذهب',
    goldVictorySubtitle: 'أكملت مراحل الذهب الـ 15 وجمعت كنوز الخزنة بنجاح!',
    goldStageBanner: (n: number) => `الذهب · المرحلة ${n}`,
    goldStageCompleteTitle: (n: number) => `أكملت مرحلة الذهب ${n}!`,
    goldNextStageBtn: (n: number) => `الانتقال إلى مرحلة الذهب ${n}`,
    goldUnlockTitle: 'عالم الذهب والألماس (15 مرحلة)',
    goldUnlockDesc:
      `افتح 15 مرحلة بخلفية ذهب وألماس لامعة، كنوز ذهبية وألماس نادر (+2 إلى +6 نقاط)، نظام الألماس الخاص (${DIAMOND_COST_COINS} عملة وردية لكل ألماسة)، واندكس ذهب مستقل!`,
    goldUnlockBtn: `فتح مراحل الذهب (${GOLD_UNLOCK_COST} فلوس)`,
    goldNeedCoins: (need: number) => `تحتاج ${need} فلوس إضافية لفتح مراحل الذهب`,
    goldStagesModalHint:
      `15 مرحلة ذهب وألماس — سعر الألماسة ${DIAMOND_COST_COINS} عملة وردية · مكافأة الفوز بالمرحلة (حسب الألماس المتبقي): 1–4 = 5 · 5–7 = 10 · 8–10 = 15 فلوس.`,
    noDiamondsNotice: (timer: string) => `نفد الألماس — تتجدد الألماسة القادمة خلال ${timer}`,
    waitDiamondBtn: (timer: string) => `انتظر تجدد الألماسة (${timer})`,
    buyDiamondBtn: `+1 ألماسة (${DIAMOND_COST_COINS} عملة وردية)`,
    buyDiamondAria: `شراء ألماسة واحدة مقابل ${DIAMOND_COST_COINS} عملة وردية`,
    diamondsFullTip: 'الألماس ممتلئ (10/10)',
    needCoinsDiamondTip: `تحتاج ${DIAMOND_COST_COINS} عملة وردية لشراء ألماسة`,
    goldIndexWorldBtn: 'اندكس الذهب',
    goldIndexModalHint:
      'جميع كنوز الذهب والألماس وعوائق الخزنة — كل عنصر يبقى مقفلاً حتى تلتقطه أو تلمسه في مراحل الذهب.',
    goldIndexPlusTab: 'الكنوز (+)',
    goldIndexMinusTab: 'العوائق (-)',
    goldCoinsEarned: (earned: number, remainingDiamonds: number) =>
      earned <= 0
        ? 'تم استلام مكافأة هذه المرحلة مسبقاً (بدون فلوس إضافية)'
        : `+${earned} فلوس مكافأة إنهاء المرحلة (${remainingDiamonds} ألماسة)!`,
  },
  en: {
    title: 'Point Catcher',
    rule: 'Clear 50 stages by catching points while dodging red hazards and fast arrows (10 hearts, +1 every 5 min).',
    startBtn: 'Start Game',
    playAgainBtn: 'Play Again',
    resumeBtn: 'Resume',
    restartBtn: 'Restart',
    score: 'Score',
    best: 'Best',
    bestFull: 'Best Score',
    lives: 'Lives',
    stage: 'Stage',
    stageReached: 'Stage Reached',
    gameOver: 'Game Over',
    victoryTitle: 'Victory! All 50 Stages Cleared',
    victorySubtitle: 'You mastered all 50 stages!',
    finalScore: 'Final Score',
    newBest: 'New Best Score!',
    paused: 'Paused',
    pinkLegend: 'Pink Circle (+3)',
    blueLegend: 'Blue Triangle (+4)',
    spikeLegend: 'Red Spike (-1 Life)',
    squareLegend: 'Red Square (-2 Lives)',
    controlsHint: 'Arrow keys, A / D, or drag to move',
    moveLeft: 'Move Left',
    moveRight: 'Move Right',
    mute: 'Mute Sound',
    unmute: 'Unmute Sound',
    pause: 'Pause Game',
    resume: 'Resume Game',
    langToggle: 'عربي',
    langToggleAria: 'التبديل إلى العربية',
    stageBanner: (n: number) => `Stage ${n}`,
    stageGoalLabel: (n: number) => `Goal: ${n} pts`,
    stageCompleteTitle: (n: number) => `Stage ${n} Complete!`,
    nextStageBtn: (n: number) => `Continue to Stage ${n}`,
    nextGoalText: (pts: number) => `Next Stage Goal: ${pts} pts`,
    stagesBtn: 'Stages',
    gamesBtn: 'Games',
    stagesModalTitle: 'Stages',
    stagesModalHint: `Heart price is fixed (${HEART_COST_COINS} coins) · Stage-win reward (by remaining ♥): 1–3 = 2, 4–7 = 4, 8–10 = 8 coins.`,
    noHeartsNotice: (timer: string) => `Out of hearts — next heart regenerates in ${timer}`,
    waitHeartBtn: (timer: string) => `Next Heart in ${timer}`,
    nextHeartShort: (timer: string) => `+1♥ in ${timer}`,
    buyHeartBtn: `Buy +1 Heart (${HEART_COST_COINS} Coins)`,
    buyHeartAria: `Buy 1 heart for ${HEART_COST_COINS} coins`,
    heartsFullTip: 'Hearts full (10/10)',
    needCoinsTip: `Need ${HEART_COST_COINS} coins to buy a heart`,
    lockedStageAria: (n: number) => `Stage ${n} locked`,
    indexBtn: 'Index',
    indexModalTitle: 'Index',
    indexModalHint: 'All points & hazards — each entry stays locked with hidden details until you catch or touch it.',
    indexPlusTab: 'Plus (+)',
    indexMinusTab: 'Minus (-)',
    indexDiscoveredCount: (found: number, total: number) => `${found}/${total} Discovered`,
    indexUnknownTitle: '???',
    indexLockedBadge: 'Locked',
    indexLockedDesc: 'Not discovered yet — unlocks and reveals its effect once you catch or touch it.',
    shopBtn: 'Shop',
    bagBtn: 'Bag',
    bagTitle: 'Item Bag',
    bagDesc: 'Store hearts, corn, and diamonds in your bag and press Use anytime to increase your lives by +1.',
    bagInBagLabel: 'In Bag',
    bagActiveLabel: 'Active',
    bagUseBtn: 'Use (+1)',
    bagStoreBtn: 'Store +1',
    bagBuyBtn: `Buy to Bag (${HEART_COST_COINS} Coins)`,
    bagBuyDiamondBtn: `Buy to Bag (${DIAMOND_COST_COINS} Pink Coins)`,
    bagFullBadge: 'Full 10/10',
    bagEmptyHint: 'Empty',
    bagHeartsTitle: 'Stored Hearts',
    bagHeartsSub: 'For Normal Stages',
    bagCornTitle: 'Stored Corn',
    bagCornSub: 'For Fruit Stages',
    bagDiamondsTitle: 'Stored Diamonds',
    bagDiamondsSub: 'For Gold Stages',
    settingsBtn: 'Settings',
    settingsTitle: 'Settings',
    musicLabel: 'Energetic Music',
    musicDesc: 'Upbeat arcade synth soundtrack while playing',
    sfxLabel: 'Sound Effects',
    sfxDesc: 'Point catches, hazard hits, and stage chimes',
    languageLabel: 'Language',
    onLabel: 'On',
    offLabel: 'Off',
    coins: 'Coins',
    pinkCoins: 'Pink Coins',
    pinkCoinShortBenefit: 'For Diamonds',
    pinkCoinBenefitTitle: 'Pink Coin Benefit',
    pinkCoinBenefitDesc: `Used to buy Diamonds for Gold Stages (${DIAMOND_COST_COINS} Pink Coins = +1 Diamond). Every point you catch has a 50% chance to drop 1–3 Pink Coins (only in stages you haven't cleared yet).`,
    coinsEarned: (earned: number, remainingLives: number) =>
      earned <= 0
        ? 'Stage coin reward already claimed (no extra coins)'
        : `+${earned} ${earned === 1 ? 'Coin' : 'Coins'} Reward (${remainingLives} ${
            remainingLives === 1 ? 'Heart' : 'Hearts'
          })!`,
    ptsShort: 'pts',
    close: 'Close',
    normalWorldLabel: 'Normal Stages',
    fruitWorldLabel: 'Fruit Stages',
    cornLabel: 'Corn',
    fruitVictoryTitle: 'Victory! All 15 Fruit Stages Cleared',
    fruitVictorySubtitle: 'You mastered all 15 fruit orchard stages!',
    fruitStageBanner: (n: number) => `Fruit · Stage ${n}`,
    fruitStageCompleteTitle: (n: number) => `Fruit Stage ${n} Complete!`,
    fruitNextStageBtn: (n: number) => `Continue to Fruit Stage ${n}`,
    fruitUnlockTitle: 'Fruit World (15 Stages)',
    fruitUnlockDesc:
      'Unlock 15 stages with an orchard fruit background, juicy fruits (+2 to +5 pts), vegetables that subtract points & corn lives (10 corn pool), plus a dedicated Fruit Index.',
    fruitUnlockBtn: `Unlock Fruit Stages (${FRUIT_UNLOCK_COST} Coins)`,
    fruitNeedCoins: (need: number) => `Need ${need} more coins to unlock Fruit Stages`,
    fruitStagesModalHint:
      `15 Fruit stages — Corn price is fixed (${HEART_COST_COINS} coins) · Stage-win reward (by remaining corn): 1 = 6, 2 = 12, 3+ = 18 coins.`,
    noCornNotice: (timer: string) => `Out of corn — next corn regenerates in ${timer}`,
    waitCornBtn: (timer: string) => `Next Corn in ${timer}`,
    buyCornBtn: `Buy +1 Corn (${HEART_COST_COINS} Coins)`,
    buyCornAria: `Buy 1 corn for ${HEART_COST_COINS} coins`,
    cornFullTip: 'Corn full (10/10)',
    needCoinsCornTip: `Need ${HEART_COST_COINS} coins to buy corn`,
    fruitIndexWorldBtn: 'Fruit Index',
    normalIndexWorldBtn: 'Normal Index',
    fruitIndexModalHint:
      'All fruits & vegetables — each entry stays locked until you catch or touch it in Fruit Stages.',
    fruitIndexPlusTab: 'Fruits (+)',
    fruitIndexMinusTab: 'Vegetables (-)',
    fruitCoinsEarned: (earned: number, remainingCorn: number) =>
      earned <= 0
        ? 'Stage coin reward already claimed (no extra coins)'
        : `+${earned} ${earned === 1 ? 'Coin' : 'Coins'} Reward (${remainingCorn} Corn)!`,
    goldWorldLabel: 'Gold Stages',
    diamondsLabel: 'Diamonds',
    goldVictoryTitle: 'Victory! All 15 Gold Stages Cleared',
    goldVictorySubtitle: 'You mastered all 15 gold & diamond vault stages!',
    goldStageBanner: (n: number) => `Gold · Stage ${n}`,
    goldStageCompleteTitle: (n: number) => `Gold Stage ${n} Complete!`,
    goldNextStageBtn: (n: number) => `Continue to Gold Stage ${n}`,
    goldUnlockTitle: 'Gold & Diamond Vault (15 Stages)',
    goldUnlockDesc:
      `Unlock 15 gleaming gold & diamond stages with royal treasures (+2 to +6 pts), dedicated diamond lives (${DIAMOND_COST_COINS} Pink Coins per diamond, 5/10/15 clear rewards), and a dedicated Gold Index!`,
    goldUnlockBtn: `Unlock Gold Stages (${GOLD_UNLOCK_COST} Coins)`,
    goldNeedCoins: (need: number) => `Need ${need} more coins to unlock Gold Stages`,
    goldStagesModalHint:
      `15 Gold & Diamond stages — Diamond price is ${DIAMOND_COST_COINS} Pink Coins · Stage-win reward (by remaining diamonds): 1–4 = 5, 5–7 = 10, 8–10 = 15 coins.`,
    noDiamondsNotice: (timer: string) => `Out of diamonds — next diamond regenerates in ${timer}`,
    waitDiamondBtn: (timer: string) => `Next Diamond in ${timer}`,
    buyDiamondBtn: `Buy +1 Diamond (${DIAMOND_COST_COINS} Pink Coins)`,
    buyDiamondAria: `Buy 1 diamond for ${DIAMOND_COST_COINS} Pink Coins`,
    diamondsFullTip: 'Diamonds full (10/10)',
    needCoinsDiamondTip: `Need ${DIAMOND_COST_COINS} Pink Coins to buy a diamond`,
    goldIndexWorldBtn: 'Gold Index',
    goldIndexModalHint:
      'All gold treasures, diamonds & vault hazards — each entry stays locked until you catch or touch it in Gold Stages.',
    goldIndexPlusTab: 'Treasures (+)',
    goldIndexMinusTab: 'Hazards (-)',
    goldCoinsEarned: (earned: number, remainingDiamonds: number) =>
      earned <= 0
        ? 'Stage coin reward already claimed (no extra coins)'
        : `+${earned} ${earned === 1 ? 'Coin' : 'Coins'} Reward (${remainingDiamonds} ${
            remainingDiamonds === 1 ? 'Diamond' : 'Diamonds'
          })!`,
  },
} as const;

class ArcadeAudio {
  private ctx: AudioContext | null = null;
  private sfxEnabled = true;
  private musicEnabled = true;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private nextNoteTime = 0;
  private musicBpm = 136;
  private noiseBuffer: AudioBuffer | null = null;

  public setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
  }

  public setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  public setStageTempo(stage: number): void {
    const t = Math.max(0, Math.min(1, (stage - 1) / (TOTAL_STAGES - 1)));
    this.musicBpm = Math.round(136 + t * 18); // 136 -> 154 BPM
  }

  private getOrCreateContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private ensureContext(): AudioContext | null {
    if (!this.sfxEnabled) return null;
    return this.getOrCreateContext();
  }

  private ensureNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const bufferSize = Math.floor(ctx.sampleRate * 0.12);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private scheduleMusicStep(ctx: AudioContext, step: number, time: number): void {
    const stepDur = 60 / this.musicBpm / 4; // 16th note duration
    const bar = Math.floor(step / 16) % 4;
    const beatStep = step % 16;

    // Energetic minor arcade progression: Am -> F -> C -> G
    const bassRoots = [110.0, 87.31, 130.81, 98.0];
    const leadArps = [
      [440.0, 523.25, 659.25, 880.0, 659.25, 523.25, 587.33, 659.25],
      [349.23, 440.0, 523.25, 698.46, 523.25, 440.0, 523.25, 659.25],
      [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 783.99, 880.0],
      [392.0, 493.88, 587.33, 783.99, 659.25, 587.33, 493.88, 587.33],
    ];

    // 1. Driving 4-on-the-floor kick (+ syncopated pickup on step 14)
    if (beatStep === 0 || beatStep === 4 || beatStep === 8 || beatStep === 12 || beatStep === 14) {
      const kick = ctx.createOscillator();
      const gain = ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(145, time);
      kick.frequency.exponentialRampToValueAtTime(42, time + 0.095);
      gain.gain.setValueAtTime(beatStep === 14 ? 0.09 : 0.14, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
      kick.connect(gain);
      gain.connect(ctx.destination);
      kick.start(time);
      kick.stop(time + 0.12);
    }

    // 2. Crisp hi-hat & snare pulse
    if (beatStep % 2 === 0) {
      const isSnare = beatStep === 4 || beatStep === 12;
      const noise = ctx.createBufferSource();
      noise.buffer = this.ensureNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = isSnare ? 'bandpass' : 'highpass';
      filter.frequency.setValueAtTime(isSnare ? 1900 : 6200, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(isSnare ? 0.045 : 0.018, time);
      gain.gain.exponentialRampToValueAtTime(0.0008, time + (isSnare ? 0.085 : 0.03));

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(time);
      noise.stop(time + (isSnare ? 0.09 : 0.035));
    }

    // 3. Driving octave synth bassline on 8th notes
    if (beatStep % 2 === 0) {
      const root = bassRoots[bar];
      const freq = beatStep % 4 === 2 ? root * 2 : root;
      const bass = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      bass.type = 'sawtooth';
      bass.frequency.setValueAtTime(freq, time);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(620, time);
      filter.frequency.exponentialRampToValueAtTime(240, time + stepDur * 1.6);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.055, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + stepDur * 1.75);

      bass.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      bass.start(time);
      bass.stop(time + stepDur * 1.85);
    }

    // 4. Energetic synth arpeggio melody
    if (beatStep % 2 === 0) {
      const noteFreq = leadArps[bar][(beatStep / 2) % 8];
      const lead = ctx.createOscillator();
      const gain = ctx.createGain();
      lead.type = 'triangle';
      lead.frequency.setValueAtTime(noteFreq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.036, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, time + stepDur * 1.5);

      lead.connect(gain);
      gain.connect(ctx.destination);
      lead.start(time);
      lead.stop(time + stepDur * 1.6);
    }
  }

  public startMusic(stage: number): void {
    this.setStageTempo(stage);
    if (!this.musicEnabled) {
      this.stopMusic();
      return;
    }
    const ctx = this.getOrCreateContext();
    if (!ctx) return;
    if (this.musicTimer !== null) return;

    this.nextNoteTime = ctx.currentTime + 0.04;
    this.musicTimer = window.setInterval(() => {
      if (!this.musicEnabled || !this.ctx) {
        this.stopMusic();
        return;
      }
      if (this.ctx.state === 'suspended') return;
      const scheduleAhead = 0.14;
      while (this.nextNoteTime < this.ctx.currentTime + scheduleAhead) {
        this.scheduleMusicStep(this.ctx, this.musicStep, this.nextNoteTime);
        const stepDur = 60 / this.musicBpm / 4;
        this.nextNoteTime += stepDur;
        this.musicStep = (this.musicStep + 1) % 64;
      }
    }, 40);
  }

  public stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public playStart(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [440, 587.33];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.065);
      gain.gain.setValueAtTime(0.001, now + idx * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.065 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + idx * 0.065 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.065);
      osc.stop(now + idx * 0.065 + 0.17);
    });
  }

  public playCatch(streak: number, isTriangle: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const baseFreq =
      scale[Math.min(streak, scale.length - 1)] * (isTriangle ? 1.12 : 1.0);

    const osc = ctx.createOscillator();
    const harm = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.16, now + 0.09);

    harm.type = 'triangle';
    harm.frequency.setValueAtTime(baseFreq * 1.5, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.085, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.15);

    const harmGain = ctx.createGain();
    harmGain.gain.setValueAtTime(0.028, now);
    harmGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.12);

    osc.connect(gain);
    harm.connect(harmGain);
    harmGain.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    harm.start(now);
    osc.stop(now + 0.16);
    harm.stop(now + 0.13);
  }

  public playStageUp(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.08, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.19);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  public playFreeze(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [1174.66, 987.77, 783.99, 587.33];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.92, start + 0.16);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.075, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0006, start + 0.19);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  public playBuyHeart(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [659.25, 987.77];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.09, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.17);
    });
  }

  public playSpeedBoost(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1174.66];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.038;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.15, start + 0.11);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.085, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.15);
    });
  }

  public playHazardHit(heavy: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(heavy ? 150 : 195, now);
    osc.frequency.exponentialRampToValueAtTime(heavy ? 48 : 74, now + (heavy ? 0.3 : 0.22));

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(heavy ? 420 : 520, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + (heavy ? 0.3 : 0.22));

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(heavy ? 0.18 : 0.13, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + (heavy ? 0.32 : 0.24));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + (heavy ? 0.33 : 0.25));
  }

  public playGameOver(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [349.23, 293.66, 220.0];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.94, start + 0.22);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.095, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
  }

  public playVictory(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.09, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.34);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  }
}

function readStoredNumber(key: string, fallback: number): number {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function readStoredBoolean(key: string, fallback: boolean): boolean {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === 'true';
  } catch {
    return fallback;
  }
}

function readStoredLang(): Lang {
  try {
    const raw = window.localStorage.getItem(LANG_STORAGE_KEY);
    return raw === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function readStoredCompletedStages(): number[] {
  try {
    const raw = window.localStorage.getItem(COMPLETED_STAGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n): n is number =>
        typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= TOTAL_STAGES
    );
  } catch {
    return [];
  }
}

function readStoredDiscoveredItems(): ItemKind[] {
  try {
    const raw = window.localStorage.getItem(DISCOVERED_ITEMS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (k): k is ItemKind =>
        typeof k === 'string' && VALID_ITEM_KINDS.includes(k as ItemKind)
    );
  } catch {
    return [];
  }
}

interface StoredLivesState {
  lives: number;
  lastRegenAt: number;
}

function computeSyncedLivesState(
  rawLives: number,
  rawLastRegenAt: number,
  now: number
): StoredLivesState {
  const clampedLives = Math.max(0, Math.min(MAX_LIVES, Math.floor(rawLives)));
  if (clampedLives >= MAX_LIVES) {
    return { lives: MAX_LIVES, lastRegenAt: 0 };
  }
  const baseTime =
    rawLastRegenAt > 0 && rawLastRegenAt <= now ? rawLastRegenAt : now;
  const elapsed = now - baseTime;
  const gained = Math.floor(elapsed / HEART_REGEN_MS);
  const nextLives = Math.min(MAX_LIVES, clampedLives + gained);
  if (nextLives >= MAX_LIVES) {
    return { lives: MAX_LIVES, lastRegenAt: 0 };
  }
  return {
    lives: nextLives,
    lastRegenAt: baseTime + gained * HEART_REGEN_MS,
  };
}

function readStoredLivesState(): StoredLivesState {
  const now = Date.now();
  try {
    const raw = window.localStorage.getItem(LIVES_STATE_STORAGE_KEY);
    if (!raw) return { lives: MAX_LIVES, lastRegenAt: 0 };
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.lives === 'number' &&
      typeof parsed.lastRegenAt === 'number'
    ) {
      return computeSyncedLivesState(parsed.lives, parsed.lastRegenAt, now);
    }
    return { lives: MAX_LIVES, lastRegenAt: 0 };
  } catch {
    return { lives: MAX_LIVES, lastRegenAt: 0 };
  }
}

function readStoredCompletedFruitStages(): number[] {
  try {
    const raw = window.localStorage.getItem(COMPLETED_FRUIT_STAGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n): n is number =>
        typeof n === 'number' &&
        Number.isInteger(n) &&
        n >= 1 &&
        n <= TOTAL_FRUIT_STAGES
    );
  } catch {
    return [];
  }
}

function readStoredDiscoveredFruitItems(): FruitItemKind[] {
  try {
    const raw = window.localStorage.getItem(DISCOVERED_FRUIT_ITEMS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (k): k is FruitItemKind =>
        typeof k === 'string' && VALID_FRUIT_KINDS.includes(k as FruitItemKind)
    );
  } catch {
    return [];
  }
}

function readStoredCornState(): StoredLivesState {
  const now = Date.now();
  try {
    const raw = window.localStorage.getItem(CORN_STATE_STORAGE_KEY);
    if (!raw) return { lives: MAX_CORN, lastRegenAt: 0 };
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.lives === 'number' &&
      typeof parsed.lastRegenAt === 'number'
    ) {
      return computeSyncedLivesState(parsed.lives, parsed.lastRegenAt, now);
    }
    return { lives: MAX_CORN, lastRegenAt: 0 };
  } catch {
    return { lives: MAX_CORN, lastRegenAt: 0 };
  }
}

function persistLivesState(lives: number, lastRegenAt: number): void {
  try {
    window.localStorage.setItem(
      LIVES_STATE_STORAGE_KEY,
      JSON.stringify({ lives, lastRegenAt })
    );
  } catch {
    // Ignore storage errors
  }
}

function persistCornState(corn: number, lastRegenAt: number): void {
  try {
    window.localStorage.setItem(
      CORN_STATE_STORAGE_KEY,
      JSON.stringify({ lives: corn, lastRegenAt })
    );
  } catch {
    // Ignore storage errors
  }
}

function readStoredCompletedGoldStages(): number[] {
  try {
    const raw = window.localStorage.getItem(COMPLETED_GOLD_STAGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n): n is number =>
        typeof n === 'number' &&
        Number.isInteger(n) &&
        n >= 1 &&
        n <= TOTAL_GOLD_STAGES
    );
  } catch {
    return [];
  }
}

function readStoredDiscoveredGoldItems(): GoldItemKind[] {
  try {
    const raw = window.localStorage.getItem(DISCOVERED_GOLD_ITEMS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (k): k is GoldItemKind =>
        typeof k === 'string' && VALID_GOLD_KINDS.includes(k as GoldItemKind)
    );
  } catch {
    return [];
  }
}

function readStoredDiamondsState(): StoredLivesState {
  const now = Date.now();
  try {
    const raw = window.localStorage.getItem(DIAMONDS_STATE_STORAGE_KEY);
    if (!raw) return { lives: MAX_DIAMONDS, lastRegenAt: 0 };
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.lives === 'number' &&
      typeof parsed.lastRegenAt === 'number'
    ) {
      return computeSyncedLivesState(parsed.lives, parsed.lastRegenAt, now);
    }
    return { lives: MAX_DIAMONDS, lastRegenAt: 0 };
  } catch {
    return { lives: MAX_DIAMONDS, lastRegenAt: 0 };
  }
}

function persistDiamondsState(diamonds: number, lastRegenAt: number): void {
  try {
    window.localStorage.setItem(
      DIAMONDS_STATE_STORAGE_KEY,
      JSON.stringify({ lives: diamonds, lastRegenAt })
    );
  } catch {
    // Ignore storage errors
  }
}

function readStoredBagState(): BagState {
  try {
    const raw = window.localStorage.getItem(BAG_STORAGE_KEY);
    if (!raw) return { hearts: 0, corn: 0, diamonds: 0 };
    const parsed = JSON.parse(raw);
    return {
      hearts:
        typeof parsed?.hearts === 'number' && Number.isFinite(parsed.hearts)
          ? Math.max(0, Math.floor(parsed.hearts))
          : 0,
      corn:
        typeof parsed?.corn === 'number' && Number.isFinite(parsed.corn)
          ? Math.max(0, Math.floor(parsed.corn))
          : 0,
      diamonds:
        typeof parsed?.diamonds === 'number' && Number.isFinite(parsed.diamonds)
          ? Math.max(0, Math.floor(parsed.diamonds))
          : 0,
    };
  } catch {
    return { hearts: 0, corn: 0, diamonds: 0 };
  }
}

function persistBagState(bag: BagState): void {
  try {
    window.localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(bag));
  } catch {
    // Ignore storage errors
  }
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function App() {
  const initialLivesRef = useRef<StoredLivesState | null>(null);
  if (initialLivesRef.current === null) {
    initialLivesRef.current = readStoredLivesState();
  }
  const initialLivesState = initialLivesRef.current;

  const initialCornRef = useRef<StoredLivesState | null>(null);
  if (initialCornRef.current === null) {
    initialCornRef.current = readStoredCornState();
  }
  const initialCornState = initialCornRef.current;

  const initialDiamondsRef = useRef<StoredLivesState | null>(null);
  if (initialDiamondsRef.current === null) {
    initialDiamondsRef.current = readStoredDiamondsState();
  }
  const initialDiamondsState = initialDiamondsRef.current;

  const [lang, setLang] = useState<Lang>(() => readStoredLang());
  const [gameMode, setGameMode] = useState<GameMode>('normal');
  const [status, setStatus] = useState<GameStatus>('START');
  const [score, setScore] = useState<number>(0);
  const [stagePoints, setStagePoints] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() =>
    readStoredNumber(BEST_SCORE_STORAGE_KEY, 0)
  );
  const [coins, setCoins] = useState<number>(() =>
    readStoredNumber(COINS_STORAGE_KEY, 0)
  );
  const [pinkCoins, setPinkCoins] = useState<number>(() =>
    readStoredNumber(PINK_COINS_STORAGE_KEY, 0)
  );
  const [pinkCoinInfoOpen, setPinkCoinInfoOpen] = useState<boolean>(false);
  const [lastEarnedCoins, setLastEarnedCoins] = useState<number>(4);
  const [completedStages, setCompletedStages] = useState<number[]>(() =>
    readStoredCompletedStages()
  );
  const [discoveredItems, setDiscoveredItems] = useState<ItemKind[]>(() =>
    readStoredDiscoveredItems()
  );
  const [fruitUnlocked, setFruitUnlocked] = useState<boolean>(() =>
    FRUIT_UNLOCK_COST <= 0 ? true : readStoredBoolean(FRUIT_UNLOCKED_STORAGE_KEY, false)
  );
  const [completedFruitStages, setCompletedFruitStages] = useState<number[]>(() =>
    readStoredCompletedFruitStages()
  );
  const [discoveredFruitItems, setDiscoveredFruitItems] = useState<FruitItemKind[]>(
    () => readStoredDiscoveredFruitItems()
  );
  const [goldUnlocked, setGoldUnlocked] = useState<boolean>(() =>
    GOLD_UNLOCK_COST <= 0
      ? true
      : readStoredBoolean(GOLD_UNLOCKED_STORAGE_KEY, false)
  );
  const [completedGoldStages, setCompletedGoldStages] = useState<number[]>(() =>
    readStoredCompletedGoldStages()
  );
  const [discoveredGoldItems, setDiscoveredGoldItems] = useState<GoldItemKind[]>(
    () => readStoredDiscoveredGoldItems()
  );
  const [lives, setLives] = useState<number>(initialLivesState.lives);
  const [nextHeartInMs, setNextHeartInMs] = useState<number>(() =>
    initialLivesState.lives < MAX_LIVES
      ? Math.max(0, HEART_REGEN_MS - (Date.now() - initialLivesState.lastRegenAt))
      : 0
  );
  const [corn, setCorn] = useState<number>(initialCornState.lives);
  const [nextCornInMs, setNextCornInMs] = useState<number>(() =>
    initialCornState.lives < MAX_CORN
      ? Math.max(0, HEART_REGEN_MS - (Date.now() - initialCornState.lastRegenAt))
      : 0
  );
  const [diamonds, setDiamonds] = useState<number>(initialDiamondsState.lives);
  const [nextDiamondInMs, setNextDiamondInMs] = useState<number>(() =>
    initialDiamondsState.lives < MAX_DIAMONDS
      ? Math.max(
          0,
          HEART_REGEN_MS - (Date.now() - initialDiamondsState.lastRegenAt)
        )
      : 0
  );
  const [stageNum, setStageNum] = useState<number>(1);
  const [stagesModalOpen, setStagesModalOpen] = useState<boolean>(false);
  const [stagesModalTab, setStagesModalTab] = useState<GameMode>('normal');
  const [indexModalOpen, setIndexModalOpen] = useState<boolean>(false);
  const [indexModalWorld, setIndexModalWorld] = useState<GameMode>('normal');
  const [indexTab, setIndexTab] = useState<IndexTab>('positive');
  const [shopModalOpen, setShopModalOpen] = useState<boolean>(false);
  const [bagModalOpen, setBagModalOpen] = useState<boolean>(false);
  const [bag, setBag] = useState<BagState>(() => readStoredBagState());
  const [shopTab, setShopTab] = useState<ShopTab>('skins');
  const [shopPointsSubTab, setShopPointsSubTab] = useState<PointsSubTab>('plus');
  const [shop, setShop] = useState<ShopState>(() => readStoredShopState());
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [gamesModalOpen, setGamesModalOpen] = useState<boolean>(false);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(() =>
    readStoredBoolean(MUSIC_STORAGE_KEY, true)
  );
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(() =>
    readStoredBoolean(SFX_STORAGE_KEY, true)
  );
  const [isNewBest, setIsNewBest] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<ArcadeAudio>(new ArcadeAudio());

  const langRef = useRef<Lang>(lang);
  const gameModeRef = useRef<GameMode>('normal');
  const statusRef = useRef<GameStatus>('START');
  const statusBeforeModalRef = useRef<GameStatus>('START');
  const stagesModalOpenRef = useRef<boolean>(false);
  const indexModalOpenRef = useRef<boolean>(false);
  const shopModalOpenRef = useRef<boolean>(false);
  const bagModalOpenRef = useRef<boolean>(false);
  const bagRef = useRef<BagState>(bag);
  const settingsModalOpenRef = useRef<boolean>(false);
  const gamesModalOpenRef = useRef<boolean>(false);
  const shopRef = useRef<ShopState>(shop);
  const scoreRef = useRef<number>(0);
  const stagePointsRef = useRef<number>(0);
  const bestScoreRef = useRef<number>(bestScore);
  const coinsRef = useRef<number>(coins);
  const pinkCoinsRef = useRef<number>(pinkCoins);
  const completedStagesRef = useRef<number[]>(completedStages);
  const discoveredItemsRef = useRef<ItemKind[]>(discoveredItems);
  const fruitUnlockedRef = useRef<boolean>(fruitUnlocked);
  const completedFruitStagesRef = useRef<number[]>(completedFruitStages);
  const discoveredFruitItemsRef = useRef<FruitItemKind[]>(discoveredFruitItems);
  const goldUnlockedRef = useRef<boolean>(goldUnlocked);
  const completedGoldStagesRef = useRef<number[]>(completedGoldStages);
  const discoveredGoldItemsRef = useRef<GoldItemKind[]>(discoveredGoldItems);
  const livesRef = useRef<number>(initialLivesState.lives);
  const lastHeartRegenAtRef = useRef<number>(initialLivesState.lastRegenAt);
  const cornRef = useRef<number>(initialCornState.lives);
  const lastCornRegenAtRef = useRef<number>(initialCornState.lastRegenAt);
  const diamondsRef = useRef<number>(initialDiamondsState.lives);
  const lastDiamondRegenAtRef = useRef<number>(initialDiamondsState.lastRegenAt);
  const stageNumRef = useRef<number>(1);
  const streakRef = useRef<number>(0);

  const simRef = useRef({
    width: 800,
    height: 520,
    playerX: 400,
    playerVx: 0,
    playerWidth: 94,
    playerHeight: 26,
    playerY: 468,
    playerBounce: 0,
    playerGlowColor: '#38bdf8',
    playerGlowAlpha: 0,
    invulnTimer: 0,
    shieldTimer: 0,
    freezeTimer: 0,
    slowTimer: 0,
    speedBoostTimer: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
    hitFlashAlpha: 0,
    stageBannerTimer: 0,
    stageBannerText: '',
    stageBannerSub: '',
    spawnTimer: 0.45,
    nextId: 1,
    lastHazardX: -999,
    items: [] as FallingItem[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    stars: [] as AmbientStar[],
    fruitMotifs: [] as FruitBgMotif[],
    goldMotifs: [] as GoldBgMotif[],
    input: {
      leftKey: false,
      rightKey: false,
      leftBtn: false,
      rightBtn: false,
      pointerActive: false,
      pointerTargetX: 400,
      pointerId: null as number | null,
    },
  });

  const t = COPY[lang];
  const isFruitMode = gameMode === 'fruit';
  const isGoldMode = gameMode === 'gold';
  const activeTotalStages = isFruitMode
    ? TOTAL_FRUIT_STAGES
    : isGoldMode
    ? TOTAL_GOLD_STAGES
    : TOTAL_STAGES;
  const activeLives = isFruitMode ? corn : isGoldMode ? diamonds : lives;
  const activeMaxLives = isFruitMode
    ? MAX_CORN
    : isGoldMode
    ? MAX_DIAMONDS
    : MAX_LIVES;
  const activeNextRegenMs = isFruitMode
    ? nextCornInMs
    : isGoldMode
    ? nextDiamondInMs
    : nextHeartInMs;
  const activeLifeBuyCost = isGoldMode ? DIAMOND_COST_COINS : HEART_COST_COINS;
  const activeLifeCurrencyBalance = isGoldMode ? pinkCoins : coins;
  const currentStageConfig = isFruitMode
    ? FRUIT_STAGES[Math.min(stageNum - 1, TOTAL_FRUIT_STAGES - 1)]
    : isGoldMode
    ? GOLD_STAGES[Math.min(stageNum - 1, TOTAL_GOLD_STAGES - 1)]
    : STAGES[Math.min(stageNum - 1, TOTAL_STAGES - 1)];
  const nextStageConfig = isFruitMode
    ? stageNum < TOTAL_FRUIT_STAGES
      ? FRUIT_STAGES[stageNum]
      : currentStageConfig
    : isGoldMode
    ? stageNum < TOTAL_GOLD_STAGES
      ? GOLD_STAGES[stageNum]
      : currentStageConfig
    : stageNum < TOTAL_STAGES
    ? STAGES[stageNum]
    : currentStageConfig;
  const stageProgressRatio =
    status === 'VICTORY' || status === 'STAGE_CLEAR'
      ? 1
      : Math.max(
          0,
          Math.min(1, stagePoints / currentStageConfig.pointsNeeded)
        );

  useEffect(() => {
    langRef.current = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore storage failures
    }
  }, [lang]);

  useEffect(() => {
    audioRef.current.setSfxEnabled(sfxEnabled);
    try {
      window.localStorage.setItem(SFX_STORAGE_KEY, String(sfxEnabled));
    } catch {
      // Ignore storage failures
    }
  }, [sfxEnabled]);

  useEffect(() => {
    audioRef.current.setMusicEnabled(musicEnabled);
    try {
      window.localStorage.setItem(MUSIC_STORAGE_KEY, String(musicEnabled));
    } catch {
      // Ignore storage failures
    }
  }, [musicEnabled]);

  // Keep energetic background music cleanly synced with active gameplay & Settings toggle
  useEffect(() => {
    const shouldPlayMusic =
      status === 'PLAYING' &&
      musicEnabled &&
      !stagesModalOpen &&
      !indexModalOpen &&
      !shopModalOpen &&
      !bagModalOpen &&
      !settingsModalOpen &&
      !gamesModalOpen;

    if (shouldPlayMusic) {
      audioRef.current.startMusic(stageNum);
    } else {
      audioRef.current.stopMusic();
    }
  }, [
    status,
    musicEnabled,
    stagesModalOpen,
    indexModalOpen,
    shopModalOpen,
    bagModalOpen,
    settingsModalOpen,
    gamesModalOpen,
    stageNum,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio.stopMusic();
    };
  }, []);

  const initStars = useCallback((width: number, height: number) => {
    const count = Math.max(24, Math.min(48, Math.floor((width * height) / 14000)));
    const stars: AmbientStar[] = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.8 + Math.random() * 1.4,
        speed: 12 + Math.random() * 26,
        alpha: 0.14 + Math.random() * 0.34,
      });
    }
    simRef.current.stars = stars;
    simRef.current.fruitMotifs = initFruitBgMotifs(width, height);
    simRef.current.goldMotifs = initGoldBgMotifs(width, height);
  }, []);

  // Automatic +1 heart, +1 corn, & +1 diamond regeneration every 5 minutes when below 10
  useEffect(() => {
    const syncPools = () => {
      const now = Date.now();

      // Normal hearts pool
      if (livesRef.current >= MAX_LIVES) {
        if (lastHeartRegenAtRef.current !== 0) {
          lastHeartRegenAtRef.current = 0;
          persistLivesState(MAX_LIVES, 0);
        }
        setNextHeartInMs(0);
      } else {
        const synced = computeSyncedLivesState(
          livesRef.current,
          lastHeartRegenAtRef.current,
          now
        );
        if (
          synced.lives !== livesRef.current ||
          synced.lastRegenAt !== lastHeartRegenAtRef.current
        ) {
          livesRef.current = synced.lives;
          lastHeartRegenAtRef.current = synced.lastRegenAt;
          setLives(synced.lives);
          persistLivesState(synced.lives, synced.lastRegenAt);
        }
        setNextHeartInMs(
          synced.lives < MAX_LIVES
            ? Math.max(0, HEART_REGEN_MS - (now - synced.lastRegenAt))
            : 0
        );
      }

      // Fruit mode corn lives pool
      if (cornRef.current >= MAX_CORN) {
        if (lastCornRegenAtRef.current !== 0) {
          lastCornRegenAtRef.current = 0;
          persistCornState(MAX_CORN, 0);
        }
        setNextCornInMs(0);
      } else {
        const syncedCorn = computeSyncedLivesState(
          cornRef.current,
          lastCornRegenAtRef.current,
          now
        );
        if (
          syncedCorn.lives !== cornRef.current ||
          syncedCorn.lastRegenAt !== lastCornRegenAtRef.current
        ) {
          cornRef.current = syncedCorn.lives;
          lastCornRegenAtRef.current = syncedCorn.lastRegenAt;
          setCorn(syncedCorn.lives);
          persistCornState(syncedCorn.lives, syncedCorn.lastRegenAt);
        }
        setNextCornInMs(
          syncedCorn.lives < MAX_CORN
            ? Math.max(0, HEART_REGEN_MS - (now - syncedCorn.lastRegenAt))
            : 0
        );
      }

      // Gold mode diamonds lives pool
      if (diamondsRef.current >= MAX_DIAMONDS) {
        if (lastDiamondRegenAtRef.current !== 0) {
          lastDiamondRegenAtRef.current = 0;
          persistDiamondsState(MAX_DIAMONDS, 0);
        }
        setNextDiamondInMs(0);
      } else {
        const syncedDiamonds = computeSyncedLivesState(
          diamondsRef.current,
          lastDiamondRegenAtRef.current,
          now
        );
        if (
          syncedDiamonds.lives !== diamondsRef.current ||
          syncedDiamonds.lastRegenAt !== lastDiamondRegenAtRef.current
        ) {
          diamondsRef.current = syncedDiamonds.lives;
          lastDiamondRegenAtRef.current = syncedDiamonds.lastRegenAt;
          setDiamonds(syncedDiamonds.lives);
          persistDiamondsState(syncedDiamonds.lives, syncedDiamonds.lastRegenAt);
        }
        setNextDiamondInMs(
          syncedDiamonds.lives < MAX_DIAMONDS
            ? Math.max(0, HEART_REGEN_MS - (now - syncedDiamonds.lastRegenAt))
            : 0
        );
      }
    };

    syncPools();
    const timerId = window.setInterval(syncPools, 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const buyLifeForMode = useCallback((targetMode?: GameMode) => {
    const mode = targetMode ?? gameModeRef.current;

    if (mode === 'gold') {
      if (pinkCoinsRef.current < DIAMOND_COST_COINS) return;
      if (diamondsRef.current >= MAX_DIAMONDS) return;
      const nextPinkCoins = pinkCoinsRef.current - DIAMOND_COST_COINS;
      pinkCoinsRef.current = nextPinkCoins;
      setPinkCoins(nextPinkCoins);
      try {
        window.localStorage.setItem(
          PINK_COINS_STORAGE_KEY,
          String(nextPinkCoins)
        );
      } catch {
        // Ignore storage errors
      }
      const nextDiamonds = Math.min(MAX_DIAMONDS, diamondsRef.current + 1);
      diamondsRef.current = nextDiamonds;
      setDiamonds(nextDiamonds);
      if (nextDiamonds >= MAX_DIAMONDS) {
        lastDiamondRegenAtRef.current = 0;
        setNextDiamondInMs(0);
      }
      persistDiamondsState(nextDiamonds, lastDiamondRegenAtRef.current);
      audioRef.current.playBuyHeart();
      return;
    }

    if (coinsRef.current < HEART_COST_COINS) return;

    if (mode === 'fruit') {
      if (cornRef.current >= MAX_CORN) return;
      const nextCoins = coinsRef.current - HEART_COST_COINS;
      coinsRef.current = nextCoins;
      setCoins(nextCoins);
      try {
        window.localStorage.setItem(COINS_STORAGE_KEY, String(nextCoins));
      } catch {
        // Ignore storage errors
      }
      const nextCorn = Math.min(MAX_CORN, cornRef.current + 1);
      cornRef.current = nextCorn;
      setCorn(nextCorn);
      if (nextCorn >= MAX_CORN) {
        lastCornRegenAtRef.current = 0;
        setNextCornInMs(0);
      }
      persistCornState(nextCorn, lastCornRegenAtRef.current);
      audioRef.current.playBuyHeart();
      return;
    }

    if (livesRef.current >= MAX_LIVES) return;
    const nextCoins = coinsRef.current - HEART_COST_COINS;
    coinsRef.current = nextCoins;
    setCoins(nextCoins);
    try {
      window.localStorage.setItem(COINS_STORAGE_KEY, String(nextCoins));
    } catch {
      // Ignore storage errors
    }

    const nextLives = Math.min(MAX_LIVES, livesRef.current + 1);
    livesRef.current = nextLives;
    setLives(nextLives);
    if (nextLives >= MAX_LIVES) {
      lastHeartRegenAtRef.current = 0;
      setNextHeartInMs(0);
    }
    persistLivesState(nextLives, lastHeartRegenAtRef.current);
    audioRef.current.playBuyHeart();
  }, []);

  const buyHeart = useCallback(() => {
    buyLifeForMode();
  }, [buyLifeForMode]);

  const storeLifeInBag = useCallback((mode: GameMode) => {
    const now = Date.now();
    if (mode === 'gold') {
      if (diamondsRef.current <= 1) return;
      const wasFull = diamondsRef.current >= MAX_DIAMONDS;
      const nextDiamonds = diamondsRef.current - 1;
      diamondsRef.current = nextDiamonds;
      setDiamonds(nextDiamonds);
      if (wasFull) {
        lastDiamondRegenAtRef.current = now;
        setNextDiamondInMs(HEART_REGEN_MS);
      }
      persistDiamondsState(nextDiamonds, lastDiamondRegenAtRef.current);
      const nextBag: BagState = {
        ...bagRef.current,
        diamonds: bagRef.current.diamonds + 1,
      };
      bagRef.current = nextBag;
      setBag(nextBag);
      persistBagState(nextBag);
      audioRef.current.playBuyHeart();
      return;
    }

    if (mode === 'fruit') {
      if (cornRef.current <= 1) return;
      const wasFull = cornRef.current >= MAX_CORN;
      const nextCorn = cornRef.current - 1;
      cornRef.current = nextCorn;
      setCorn(nextCorn);
      if (wasFull) {
        lastCornRegenAtRef.current = now;
        setNextCornInMs(HEART_REGEN_MS);
      }
      persistCornState(nextCorn, lastCornRegenAtRef.current);
      const nextBag: BagState = {
        ...bagRef.current,
        corn: bagRef.current.corn + 1,
      };
      bagRef.current = nextBag;
      setBag(nextBag);
      persistBagState(nextBag);
      audioRef.current.playBuyHeart();
      return;
    }

    if (livesRef.current <= 1) return;
    const wasFull = livesRef.current >= MAX_LIVES;
    const nextLives = livesRef.current - 1;
    livesRef.current = nextLives;
    setLives(nextLives);
    if (wasFull) {
      lastHeartRegenAtRef.current = now;
      setNextHeartInMs(HEART_REGEN_MS);
    }
    persistLivesState(nextLives, lastHeartRegenAtRef.current);
    const nextBag: BagState = {
      ...bagRef.current,
      hearts: bagRef.current.hearts + 1,
    };
    bagRef.current = nextBag;
    setBag(nextBag);
    persistBagState(nextBag);
    audioRef.current.playBuyHeart();
  }, []);

  const buyLifeToBag = useCallback((mode: GameMode) => {
    if (mode === 'gold') {
      if (pinkCoinsRef.current < DIAMOND_COST_COINS) return;
      const nextPinkCoins = pinkCoinsRef.current - DIAMOND_COST_COINS;
      pinkCoinsRef.current = nextPinkCoins;
      setPinkCoins(nextPinkCoins);
      try {
        window.localStorage.setItem(
          PINK_COINS_STORAGE_KEY,
          String(nextPinkCoins)
        );
      } catch {
        // Ignore storage errors
      }
      const nextBag: BagState = {
        ...bagRef.current,
        diamonds: bagRef.current.diamonds + 1,
      };
      bagRef.current = nextBag;
      setBag(nextBag);
      persistBagState(nextBag);
      audioRef.current.playBuyHeart();
      return;
    }

    if (coinsRef.current < HEART_COST_COINS) return;
    const nextCoins = coinsRef.current - HEART_COST_COINS;
    coinsRef.current = nextCoins;
    setCoins(nextCoins);
    try {
      window.localStorage.setItem(COINS_STORAGE_KEY, String(nextCoins));
    } catch {
      // Ignore storage errors
    }
    const nextBag: BagState =
      mode === 'fruit'
        ? { ...bagRef.current, corn: bagRef.current.corn + 1 }
        : { ...bagRef.current, hearts: bagRef.current.hearts + 1 };
    bagRef.current = nextBag;
    setBag(nextBag);
    persistBagState(nextBag);
    audioRef.current.playBuyHeart();
  }, []);

  const useLifeFromBag = useCallback((mode: GameMode) => {
    if (mode === 'gold') {
      if (bagRef.current.diamonds <= 0 || diamondsRef.current >= MAX_DIAMONDS) {
        return;
      }
      const nextBag: BagState = {
        ...bagRef.current,
        diamonds: bagRef.current.diamonds - 1,
      };
      bagRef.current = nextBag;
      setBag(nextBag);
      persistBagState(nextBag);

      const nextDiamonds = Math.min(MAX_DIAMONDS, diamondsRef.current + 1);
      diamondsRef.current = nextDiamonds;
      setDiamonds(nextDiamonds);
      if (nextDiamonds >= MAX_DIAMONDS) {
        lastDiamondRegenAtRef.current = 0;
        setNextDiamondInMs(0);
      }
      persistDiamondsState(nextDiamonds, lastDiamondRegenAtRef.current);
      audioRef.current.playStageUp();
      return;
    }

    if (mode === 'fruit') {
      if (bagRef.current.corn <= 0 || cornRef.current >= MAX_CORN) return;
      const nextBag: BagState = {
        ...bagRef.current,
        corn: bagRef.current.corn - 1,
      };
      bagRef.current = nextBag;
      setBag(nextBag);
      persistBagState(nextBag);

      const nextCorn = Math.min(MAX_CORN, cornRef.current + 1);
      cornRef.current = nextCorn;
      setCorn(nextCorn);
      if (nextCorn >= MAX_CORN) {
        lastCornRegenAtRef.current = 0;
        setNextCornInMs(0);
      }
      persistCornState(nextCorn, lastCornRegenAtRef.current);
      audioRef.current.playStageUp();
      return;
    }

    if (bagRef.current.hearts <= 0 || livesRef.current >= MAX_LIVES) return;
    const nextBag: BagState = {
      ...bagRef.current,
      hearts: bagRef.current.hearts - 1,
    };
    bagRef.current = nextBag;
    setBag(nextBag);
    persistBagState(nextBag);

    const nextLives = Math.min(MAX_LIVES, livesRef.current + 1);
    livesRef.current = nextLives;
    setLives(nextLives);
    if (nextLives >= MAX_LIVES) {
      lastHeartRegenAtRef.current = 0;
      setNextHeartInMs(0);
    }
    persistLivesState(nextLives, lastHeartRegenAtRef.current);
    audioRef.current.playStageUp();
  }, []);

  const unlockFruitWorld = useCallback(() => {
    if (fruitUnlockedRef.current || coinsRef.current < FRUIT_UNLOCK_COST) {
      return;
    }
    const nextCoins = coinsRef.current - FRUIT_UNLOCK_COST;
    coinsRef.current = nextCoins;
    setCoins(nextCoins);
    fruitUnlockedRef.current = true;
    setFruitUnlocked(true);
    try {
      window.localStorage.setItem(COINS_STORAGE_KEY, String(nextCoins));
      window.localStorage.setItem(FRUIT_UNLOCKED_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage errors
    }
    audioRef.current.playStageUp();
  }, []);

  const unlockGoldWorld = useCallback(() => {
    if (goldUnlockedRef.current || coinsRef.current < GOLD_UNLOCK_COST) {
      return;
    }
    const nextCoins = coinsRef.current - GOLD_UNLOCK_COST;
    coinsRef.current = nextCoins;
    setCoins(nextCoins);
    goldUnlockedRef.current = true;
    setGoldUnlocked(true);
    try {
      window.localStorage.setItem(COINS_STORAGE_KEY, String(nextCoins));
      window.localStorage.setItem(GOLD_UNLOCKED_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage errors
    }
    audioRef.current.playStageUp();
  }, []);

  const startAtStage = useCallback((targetStage: number, targetMode?: GameMode) => {
    const mode = targetMode ?? gameModeRef.current;
    if (mode === 'gold') {
      if (!goldUnlockedRef.current) return;
      const safeStage = Math.max(1, Math.min(TOTAL_GOLD_STAGES, targetStage));
      if (!isStageUnlocked(safeStage, completedGoldStagesRef.current)) return;
      if (diamondsRef.current <= 0) return;

      const cfg = GOLD_STAGES[safeStage - 1];
      const sim = simRef.current;
      const activeCopy = COPY[langRef.current];

      gameModeRef.current = 'gold';
      setGameMode('gold');

      sim.items = [];
      sim.particles = [];
      sim.floatingTexts = [];
      sim.playerX = sim.width / 2;
      sim.playerVx = 0;
      sim.playerBounce = 0;
      sim.playerGlowAlpha = 0;
      sim.invulnTimer = 0;
      sim.shieldTimer = 0;
      sim.freezeTimer = 0;
      sim.slowTimer = 0;
      sim.speedBoostTimer = 0;
      sim.shakeTimer = 0;
      sim.hitFlashAlpha = 0;
      sim.stageBannerTimer = 1.5;
      sim.stageBannerText = activeCopy.goldStageBanner(safeStage);
      sim.stageBannerSub = activeCopy.stageGoalLabel(cfg.pointsNeeded);
      sim.spawnTimer = 0.28;
      sim.lastHazardX = -999;
      sim.input.pointerActive = false;
      sim.input.pointerId = null;
      sim.input.leftBtn = false;
      sim.input.rightBtn = false;

      scoreRef.current = 0;
      stagePointsRef.current = 0;
      stageNumRef.current = safeStage;
      streakRef.current = 0;
      stagesModalOpenRef.current = false;
      indexModalOpenRef.current = false;
      shopModalOpenRef.current = false;
      bagModalOpenRef.current = false;
      settingsModalOpenRef.current = false;
      gamesModalOpenRef.current = false;
      statusRef.current = 'PLAYING';

      setScore(0);
      setStagePoints(0);
      setStageNum(safeStage);
      setStagesModalOpen(false);
      setIndexModalOpen(false);
      setShopModalOpen(false);
      setBagModalOpen(false);
      setSettingsModalOpen(false);
      setGamesModalOpen(false);
      setIsNewBest(false);
      setStatus('PLAYING');

      audioRef.current.playStart();
      audioRef.current.startMusic(safeStage * 2);
      return;
    }

    if (mode === 'fruit') {
      if (!fruitUnlockedRef.current) return;
      const safeStage = Math.max(1, Math.min(TOTAL_FRUIT_STAGES, targetStage));
      if (!isStageUnlocked(safeStage, completedFruitStagesRef.current)) return;
      if (cornRef.current <= 0) return;

      const cfg = FRUIT_STAGES[safeStage - 1];
      const sim = simRef.current;
      const activeCopy = COPY[langRef.current];

      gameModeRef.current = 'fruit';
      setGameMode('fruit');

      sim.items = [];
      sim.particles = [];
      sim.floatingTexts = [];
      sim.playerX = sim.width / 2;
      sim.playerVx = 0;
      sim.playerBounce = 0;
      sim.playerGlowAlpha = 0;
      sim.invulnTimer = 0;
      sim.shieldTimer = 0;
      sim.freezeTimer = 0;
      sim.slowTimer = 0;
      sim.speedBoostTimer = 0;
      sim.shakeTimer = 0;
      sim.hitFlashAlpha = 0;
      sim.stageBannerTimer = 1.5;
      sim.stageBannerText = activeCopy.fruitStageBanner(safeStage);
      sim.stageBannerSub = activeCopy.stageGoalLabel(cfg.pointsNeeded);
      sim.spawnTimer = 0.28;
      sim.lastHazardX = -999;
      sim.input.pointerActive = false;
      sim.input.pointerId = null;
      sim.input.leftBtn = false;
      sim.input.rightBtn = false;

      scoreRef.current = 0;
      stagePointsRef.current = 0;
      stageNumRef.current = safeStage;
      streakRef.current = 0;
      stagesModalOpenRef.current = false;
      indexModalOpenRef.current = false;
      shopModalOpenRef.current = false;
      bagModalOpenRef.current = false;
      settingsModalOpenRef.current = false;
      gamesModalOpenRef.current = false;
      statusRef.current = 'PLAYING';

      setScore(0);
      setStagePoints(0);
      setStageNum(safeStage);
      setStagesModalOpen(false);
      setIndexModalOpen(false);
      setShopModalOpen(false);
      setBagModalOpen(false);
      setSettingsModalOpen(false);
      setGamesModalOpen(false);
      setIsNewBest(false);
      setStatus('PLAYING');

      audioRef.current.playStart();
      audioRef.current.startMusic(safeStage * 2);
      return;
    }

    const safeStage = Math.max(1, Math.min(TOTAL_STAGES, targetStage));
    if (!isStageUnlocked(safeStage, completedStagesRef.current)) return;
    if (livesRef.current <= 0) return;

    const cfg = STAGES[safeStage - 1];
    const sim = simRef.current;
    const activeCopy = COPY[langRef.current];

    gameModeRef.current = 'normal';
    setGameMode('normal');

    sim.items = [];
    sim.particles = [];
    sim.floatingTexts = [];
    sim.playerX = sim.width / 2;
    sim.playerVx = 0;
    sim.playerBounce = 0;
    sim.playerGlowAlpha = 0;
    sim.invulnTimer = 0;
    sim.shieldTimer = 0;
    sim.freezeTimer = 0;
    sim.slowTimer = 0;
    sim.speedBoostTimer = 0;
    sim.shakeTimer = 0;
    sim.hitFlashAlpha = 0;
    sim.stageBannerTimer = 1.5;
    sim.stageBannerText = activeCopy.stageBanner(safeStage);
    sim.stageBannerSub = activeCopy.stageGoalLabel(cfg.pointsNeeded);
    sim.spawnTimer = 0.28;
    sim.lastHazardX = -999;
    sim.input.pointerActive = false;
    sim.input.pointerId = null;
    sim.input.leftBtn = false;
    sim.input.rightBtn = false;

    scoreRef.current = 0;
    stagePointsRef.current = 0;
    stageNumRef.current = safeStage;
    streakRef.current = 0;
    stagesModalOpenRef.current = false;
    indexModalOpenRef.current = false;
    shopModalOpenRef.current = false;
    bagModalOpenRef.current = false;
    settingsModalOpenRef.current = false;
    gamesModalOpenRef.current = false;
    statusRef.current = 'PLAYING';

    setScore(0);
    setStagePoints(0);
    setStageNum(safeStage);
    setStagesModalOpen(false);
    setIndexModalOpen(false);
    setShopModalOpen(false);
    setBagModalOpen(false);
    setSettingsModalOpen(false);
    setGamesModalOpen(false);
    setIsNewBest(false);
    setStatus('PLAYING');

    audioRef.current.playStart();
    audioRef.current.startMusic(safeStage);
  }, []);

  const resetAndStartGame = useCallback(() => {
    startAtStage(1, gameModeRef.current);
  }, [startAtStage]);

  const retryCurrentStage = useCallback(() => {
    startAtStage(stageNumRef.current, gameModeRef.current);
  }, [startAtStage]);

  const proceedToNextStage = useCallback(() => {
    if (statusRef.current !== 'STAGE_CLEAR') return;
    const isFruit = gameModeRef.current === 'fruit';
    const isGold = gameModeRef.current === 'gold';
    if (
      isFruit
        ? cornRef.current <= 0
        : isGold
        ? diamondsRef.current <= 0
        : livesRef.current <= 0
    ) {
      return;
    }

    const sim = simRef.current;
    const maxStages = isFruit
      ? TOTAL_FRUIT_STAGES
      : isGold
      ? TOTAL_GOLD_STAGES
      : TOTAL_STAGES;
    const nextStage = Math.min(maxStages, stageNumRef.current + 1);
    const nextCfg = isFruit
      ? FRUIT_STAGES[nextStage - 1]
      : isGold
      ? GOLD_STAGES[nextStage - 1]
      : STAGES[nextStage - 1];
    const activeCopy = COPY[langRef.current];

    sim.items = [];
    sim.playerVx = 0;
    sim.invulnTimer = 0;
    sim.shieldTimer = 0;
    sim.freezeTimer = 0;
    sim.slowTimer = 0;
    sim.speedBoostTimer = 0;
    sim.spawnTimer = 0.28;
    sim.lastHazardX = -999;
    sim.input.pointerActive = false;
    sim.input.pointerId = null;
    sim.input.leftBtn = false;
    sim.input.rightBtn = false;
    sim.stageBannerText = isFruit
      ? activeCopy.fruitStageBanner(nextStage)
      : isGold
      ? activeCopy.goldStageBanner(nextStage)
      : activeCopy.stageBanner(nextStage);
    sim.stageBannerSub = activeCopy.stageGoalLabel(nextCfg.pointsNeeded);
    sim.stageBannerTimer = 1.5;

    stagePointsRef.current = 0;
    stageNumRef.current = nextStage;
    statusRef.current = 'PLAYING';
    setStagePoints(0);
    setStageNum(nextStage);
    setStatus('PLAYING');

    audioRef.current.playStart();
    audioRef.current.startMusic(isFruit || isGold ? nextStage * 2 : nextStage);
  }, []);

  const selectOrBuySkin = useCallback((id: CatcherSkinId) => {
    const def = SKIN_CATALOG.find((s) => s.id === id);
    if (!def) return;
    const cur = shopRef.current;
    const owned = cur.ownedSkins.includes(id);

    if (owned) {
      if (cur.equippedSkin === id) return;
      const nextShop: ShopState = { ...cur, equippedSkin: id };
      shopRef.current = nextShop;
      setShop(nextShop);
      persistShopState(nextShop);
      audioRef.current.playStart();
      return;
    }

    if (coinsRef.current < def.price) return;
    const nextCoins = coinsRef.current - def.price;
    coinsRef.current = nextCoins;
    setCoins(nextCoins);
    try {
      window.localStorage.setItem(COINS_STORAGE_KEY, String(nextCoins));
    } catch {
      // Ignore storage errors
    }

    const nextShop: ShopState = {
      ...cur,
      ownedSkins: [...cur.ownedSkins, id],
      equippedSkin: id,
    };
    shopRef.current = nextShop;
    setShop(nextShop);
    persistShopState(nextShop);
    audioRef.current.playStageUp();
  }, []);

  const selectOrBuyPlusSkin = useCallback((id: PlusPointSkinId) => {
    const def = PLUS_POINT_CATALOG.find((s) => s.id === id);
    if (!def) return;
    const cur = shopRef.current;
    const owned = cur.ownedPlusSkins.includes(id);

    if (owned) {
      if (cur.equippedPlusSkin === id) return;
      const nextShop: ShopState = { ...cur, equippedPlusSkin: id };
      shopRef.current = nextShop;
      setShop(nextShop);
      persistShopState(nextShop);
      audioRef.current.playStart();
      return;
    }

    if (coinsRef.current < def.price) return;
    const nextCoins = coinsRef.current - def.price;
    coinsRef.current = nextCoins;
    setCoins(nextCoins);
    try {
      window.localStorage.setItem(COINS_STORAGE_KEY, String(nextCoins));
    } catch {
      // Ignore storage errors
    }

    const nextShop: ShopState = {
      ...cur,
      ownedPlusSkins: [...cur.ownedPlusSkins, id],
      equippedPlusSkin: id,
    };
    shopRef.current = nextShop;
    setShop(nextShop);
    persistShopState(nextShop);
    audioRef.current.playStageUp();
  }, []);

  const selectOrBuyMinusSkin = useCallback((id: MinusPointSkinId) => {
    const def = MINUS_POINT_CATALOG.find((s) => s.id === id);
    if (!def) return;
    const cur = shopRef.current;
    const owned = cur.ownedMinusSkins.includes(id);

    if (owned) {
      if (cur.equippedMinusSkin === id) return;
      const nextShop: ShopState = { ...cur, equippedMinusSkin: id };
      shopRef.current = nextShop;
      setShop(nextShop);
      persistShopState(nextShop);
      audioRef.current.playStart();
      return;
    }

    if (coinsRef.current < def.price) return;
    const nextCoins = coinsRef.current - def.price;
    coinsRef.current = nextCoins;
    setCoins(nextCoins);
    try {
      window.localStorage.setItem(COINS_STORAGE_KEY, String(nextCoins));
    } catch {
      // Ignore storage errors
    }

    const nextShop: ShopState = {
      ...cur,
      ownedMinusSkins: [...cur.ownedMinusSkins, id],
      equippedMinusSkin: id,
    };
    shopRef.current = nextShop;
    setShop(nextShop);
    persistShopState(nextShop);
    audioRef.current.playStageUp();
  }, []);

  const buySupply = useCallback(
    (id: SupplyId) => {
      const def = SUPPLY_CATALOG.find((s) => s.id === id);
      if (!def) return;

      if (id === 'one_heart') {
        if (livesRef.current < MAX_LIVES) {
          buyLifeForMode('normal');
        } else {
          buyLifeToBag('normal');
        }
        return;
      }
      if (id === 'one_corn') {
        if (cornRef.current < MAX_CORN) {
          buyLifeForMode('fruit');
        } else {
          buyLifeToBag('fruit');
        }
        return;
      }
      if (id === 'one_diamond') {
        if (diamondsRef.current < MAX_DIAMONDS) {
          buyLifeForMode('gold');
        } else {
          buyLifeToBag('gold');
        }
        return;
      }

      if (id === 'full_diamonds') {
        if (diamondsRef.current >= MAX_DIAMONDS) return;
        if (pinkCoinsRef.current < def.price) return;
        const nextPinkCoins = pinkCoinsRef.current - def.price;
        pinkCoinsRef.current = nextPinkCoins;
        setPinkCoins(nextPinkCoins);
        try {
          window.localStorage.setItem(
            PINK_COINS_STORAGE_KEY,
            String(nextPinkCoins)
          );
        } catch {
          // Ignore storage errors
        }
        diamondsRef.current = MAX_DIAMONDS;
        lastDiamondRegenAtRef.current = 0;
        setDiamonds(MAX_DIAMONDS);
        setNextDiamondInMs(0);
        persistDiamondsState(MAX_DIAMONDS, 0);
        audioRef.current.playStageUp();
        return;
      }

      if (coinsRef.current < def.price) return;

      if (id === 'shield') {
        const cur = shopRef.current;
        if (cur.shields >= MAX_SHIELDS) return;
        const nextCoins = coinsRef.current - def.price;
        coinsRef.current = nextCoins;
        setCoins(nextCoins);
        try {
          window.localStorage.setItem(COINS_STORAGE_KEY, String(nextCoins));
        } catch {
          // Ignore storage errors
        }
        const nextShop: ShopState = {
          ...cur,
          shields: Math.min(MAX_SHIELDS, cur.shields + 1),
        };
        shopRef.current = nextShop;
        setShop(nextShop);
        persistShopState(nextShop);
        audioRef.current.playBuyHeart();
        return;
      }

      if (id === 'full_hearts') {
        if (livesRef.current >= MAX_LIVES) return;
        const nextCoins = coinsRef.current - def.price;
        coinsRef.current = nextCoins;
        setCoins(nextCoins);
        try {
          window.localStorage.setItem(COINS_STORAGE_KEY, String(nextCoins));
        } catch {
          // Ignore storage errors
        }
        livesRef.current = MAX_LIVES;
        lastHeartRegenAtRef.current = 0;
        setLives(MAX_LIVES);
        setNextHeartInMs(0);
        persistLivesState(MAX_LIVES, 0);
        audioRef.current.playStageUp();
        return;
      }

      if (id === 'full_corn') {
        if (cornRef.current >= MAX_CORN) return;
        const nextCoins = coinsRef.current - def.price;
        coinsRef.current = nextCoins;
        setCoins(nextCoins);
        try {
          window.localStorage.setItem(COINS_STORAGE_KEY, String(nextCoins));
        } catch {
          // Ignore storage errors
        }
        cornRef.current = MAX_CORN;
        lastCornRegenAtRef.current = 0;
        setCorn(MAX_CORN);
        setNextCornInMs(0);
        persistCornState(MAX_CORN, 0);
        audioRef.current.playStageUp();
        return;
      }
    },
    [buyLifeForMode, buyLifeToBag]
  );

  const openStagesModal = useCallback(() => {
    if (stagesModalOpenRef.current) {
      stagesModalOpenRef.current = false;
      setStagesModalOpen(false);
      if (statusBeforeModalRef.current === 'PLAYING') {
        statusRef.current = 'PLAYING';
        setStatus('PLAYING');
      }
      return;
    }

    const hadModalOpen =
      settingsModalOpenRef.current ||
      indexModalOpenRef.current ||
      shopModalOpenRef.current ||
      bagModalOpenRef.current ||
      gamesModalOpenRef.current;
    if (settingsModalOpenRef.current) {
      settingsModalOpenRef.current = false;
      setSettingsModalOpen(false);
    }
    if (indexModalOpenRef.current) {
      indexModalOpenRef.current = false;
      setIndexModalOpen(false);
    }
    if (shopModalOpenRef.current) {
      shopModalOpenRef.current = false;
      setShopModalOpen(false);
    }
    if (bagModalOpenRef.current) {
      bagModalOpenRef.current = false;
      setBagModalOpen(false);
    }
    if (gamesModalOpenRef.current) {
      gamesModalOpenRef.current = false;
      setGamesModalOpen(false);
    }
    if (!hadModalOpen) {
      statusBeforeModalRef.current = statusRef.current;
      if (statusRef.current === 'PLAYING') {
        statusRef.current = 'PAUSED';
        setStatus('PAUSED');
      }
    }

    simRef.current.input.pointerActive = false;
    simRef.current.input.leftBtn = false;
    simRef.current.input.rightBtn = false;
    setStagesModalTab(gameModeRef.current);
    stagesModalOpenRef.current = true;
    setStagesModalOpen(true);
  }, []);

  const closeStagesModal = useCallback(() => {
    if (!stagesModalOpenRef.current) return;
    stagesModalOpenRef.current = false;
    setStagesModalOpen(false);
    if (statusBeforeModalRef.current === 'PLAYING') {
      statusRef.current = 'PLAYING';
      setStatus('PLAYING');
    }
  }, []);

  const openShopModal = useCallback(() => {
    if (shopModalOpenRef.current) {
      shopModalOpenRef.current = false;
      setShopModalOpen(false);
      if (statusBeforeModalRef.current === 'PLAYING') {
        statusRef.current = 'PLAYING';
        setStatus('PLAYING');
      }
      return;
    }

    const hadModalOpen =
      stagesModalOpenRef.current ||
      indexModalOpenRef.current ||
      bagModalOpenRef.current ||
      settingsModalOpenRef.current ||
      gamesModalOpenRef.current;
    if (stagesModalOpenRef.current) {
      stagesModalOpenRef.current = false;
      setStagesModalOpen(false);
    }
    if (indexModalOpenRef.current) {
      indexModalOpenRef.current = false;
      setIndexModalOpen(false);
    }
    if (bagModalOpenRef.current) {
      bagModalOpenRef.current = false;
      setBagModalOpen(false);
    }
    if (settingsModalOpenRef.current) {
      settingsModalOpenRef.current = false;
      setSettingsModalOpen(false);
    }
    if (gamesModalOpenRef.current) {
      gamesModalOpenRef.current = false;
      setGamesModalOpen(false);
    }
    if (!hadModalOpen) {
      statusBeforeModalRef.current = statusRef.current;
      if (statusRef.current === 'PLAYING') {
        statusRef.current = 'PAUSED';
        setStatus('PAUSED');
      }
    }

    simRef.current.input.pointerActive = false;
    simRef.current.input.leftBtn = false;
    simRef.current.input.rightBtn = false;
    shopModalOpenRef.current = true;
    setShopModalOpen(true);
  }, []);

  const closeShopModal = useCallback(() => {
    if (!shopModalOpenRef.current) return;
    shopModalOpenRef.current = false;
    setShopModalOpen(false);
    if (statusBeforeModalRef.current === 'PLAYING') {
      statusRef.current = 'PLAYING';
      setStatus('PLAYING');
    }
  }, []);

  const openBagModal = useCallback(() => {
    if (bagModalOpenRef.current) {
      bagModalOpenRef.current = false;
      setBagModalOpen(false);
      if (statusBeforeModalRef.current === 'PLAYING') {
        statusRef.current = 'PLAYING';
        setStatus('PLAYING');
      }
      return;
    }

    const hadModalOpen =
      stagesModalOpenRef.current ||
      indexModalOpenRef.current ||
      shopModalOpenRef.current ||
      settingsModalOpenRef.current ||
      gamesModalOpenRef.current;
    if (stagesModalOpenRef.current) {
      stagesModalOpenRef.current = false;
      setStagesModalOpen(false);
    }
    if (indexModalOpenRef.current) {
      indexModalOpenRef.current = false;
      setIndexModalOpen(false);
    }
    if (shopModalOpenRef.current) {
      shopModalOpenRef.current = false;
      setShopModalOpen(false);
    }
    if (settingsModalOpenRef.current) {
      settingsModalOpenRef.current = false;
      setSettingsModalOpen(false);
    }
    if (gamesModalOpenRef.current) {
      gamesModalOpenRef.current = false;
      setGamesModalOpen(false);
    }
    if (!hadModalOpen) {
      statusBeforeModalRef.current = statusRef.current;
      if (statusRef.current === 'PLAYING') {
        statusRef.current = 'PAUSED';
        setStatus('PAUSED');
      }
    }

    simRef.current.input.pointerActive = false;
    simRef.current.input.leftBtn = false;
    simRef.current.input.rightBtn = false;
    bagModalOpenRef.current = true;
    setBagModalOpen(true);
  }, []);

  const closeBagModal = useCallback(() => {
    if (!bagModalOpenRef.current) return;
    bagModalOpenRef.current = false;
    setBagModalOpen(false);
    if (statusBeforeModalRef.current === 'PLAYING') {
      statusRef.current = 'PLAYING';
      setStatus('PLAYING');
    }
  }, []);

  const openIndexModal = useCallback(() => {
    if (indexModalOpenRef.current) {
      indexModalOpenRef.current = false;
      setIndexModalOpen(false);
      if (statusBeforeModalRef.current === 'PLAYING') {
        statusRef.current = 'PLAYING';
        setStatus('PLAYING');
      }
      return;
    }

    const hadModalOpen =
      stagesModalOpenRef.current ||
      settingsModalOpenRef.current ||
      shopModalOpenRef.current ||
      bagModalOpenRef.current ||
      gamesModalOpenRef.current;
    if (stagesModalOpenRef.current) {
      stagesModalOpenRef.current = false;
      setStagesModalOpen(false);
    }
    if (settingsModalOpenRef.current) {
      settingsModalOpenRef.current = false;
      setSettingsModalOpen(false);
    }
    if (shopModalOpenRef.current) {
      shopModalOpenRef.current = false;
      setShopModalOpen(false);
    }
    if (bagModalOpenRef.current) {
      bagModalOpenRef.current = false;
      setBagModalOpen(false);
    }
    if (gamesModalOpenRef.current) {
      gamesModalOpenRef.current = false;
      setGamesModalOpen(false);
    }
    if (!hadModalOpen) {
      statusBeforeModalRef.current = statusRef.current;
      if (statusRef.current === 'PLAYING') {
        statusRef.current = 'PAUSED';
        setStatus('PAUSED');
      }
    }

    simRef.current.input.pointerActive = false;
    simRef.current.input.leftBtn = false;
    simRef.current.input.rightBtn = false;
    setIndexModalWorld(gameModeRef.current);
    indexModalOpenRef.current = true;
    setIndexModalOpen(true);
  }, []);

  const closeIndexModal = useCallback(() => {
    if (!indexModalOpenRef.current) return;
    indexModalOpenRef.current = false;
    setIndexModalOpen(false);
    if (statusBeforeModalRef.current === 'PLAYING') {
      statusRef.current = 'PLAYING';
      setStatus('PLAYING');
    }
  }, []);

  const openSettingsModal = useCallback(() => {
    if (settingsModalOpenRef.current) {
      settingsModalOpenRef.current = false;
      setSettingsModalOpen(false);
      if (statusBeforeModalRef.current === 'PLAYING') {
        statusRef.current = 'PLAYING';
        setStatus('PLAYING');
      }
      return;
    }

    const hadModalOpen =
      stagesModalOpenRef.current ||
      indexModalOpenRef.current ||
      shopModalOpenRef.current ||
      bagModalOpenRef.current ||
      gamesModalOpenRef.current;
    if (stagesModalOpenRef.current) {
      stagesModalOpenRef.current = false;
      setStagesModalOpen(false);
    }
    if (indexModalOpenRef.current) {
      indexModalOpenRef.current = false;
      setIndexModalOpen(false);
    }
    if (shopModalOpenRef.current) {
      shopModalOpenRef.current = false;
      setShopModalOpen(false);
    }
    if (bagModalOpenRef.current) {
      bagModalOpenRef.current = false;
      setBagModalOpen(false);
    }
    if (gamesModalOpenRef.current) {
      gamesModalOpenRef.current = false;
      setGamesModalOpen(false);
    }
    if (!hadModalOpen) {
      statusBeforeModalRef.current = statusRef.current;
      if (statusRef.current === 'PLAYING') {
        statusRef.current = 'PAUSED';
        setStatus('PAUSED');
      }
    }

    simRef.current.input.pointerActive = false;
    simRef.current.input.leftBtn = false;
    simRef.current.input.rightBtn = false;
    settingsModalOpenRef.current = true;
    setSettingsModalOpen(true);
  }, []);

  const closeSettingsModal = useCallback(() => {
    if (!settingsModalOpenRef.current) return;
    settingsModalOpenRef.current = false;
    setSettingsModalOpen(false);
    if (statusBeforeModalRef.current === 'PLAYING') {
      statusRef.current = 'PLAYING';
      setStatus('PLAYING');
    }
  }, []);

  const openGamesModal = useCallback(() => {
    if (gamesModalOpenRef.current) {
      gamesModalOpenRef.current = false;
      setGamesModalOpen(false);
      if (statusBeforeModalRef.current === 'PLAYING') {
        statusRef.current = 'PLAYING';
        setStatus('PLAYING');
      }
      return;
    }

    const hadModalOpen =
      stagesModalOpenRef.current ||
      indexModalOpenRef.current ||
      shopModalOpenRef.current ||
      bagModalOpenRef.current ||
      settingsModalOpenRef.current;
    if (stagesModalOpenRef.current) {
      stagesModalOpenRef.current = false;
      setStagesModalOpen(false);
    }
    if (indexModalOpenRef.current) {
      indexModalOpenRef.current = false;
      setIndexModalOpen(false);
    }
    if (shopModalOpenRef.current) {
      shopModalOpenRef.current = false;
      setShopModalOpen(false);
    }
    if (bagModalOpenRef.current) {
      bagModalOpenRef.current = false;
      setBagModalOpen(false);
    }
    if (settingsModalOpenRef.current) {
      settingsModalOpenRef.current = false;
      setSettingsModalOpen(false);
    }
    if (!hadModalOpen) {
      statusBeforeModalRef.current = statusRef.current;
      if (statusRef.current === 'PLAYING') {
        statusRef.current = 'PAUSED';
        setStatus('PAUSED');
      }
    }

    simRef.current.input.pointerActive = false;
    simRef.current.input.leftBtn = false;
    simRef.current.input.rightBtn = false;
    gamesModalOpenRef.current = true;
    setGamesModalOpen(true);
  }, []);

  const closeGamesModal = useCallback(() => {
    if (!gamesModalOpenRef.current) return;
    gamesModalOpenRef.current = false;
    setGamesModalOpen(false);
    if (statusBeforeModalRef.current === 'PLAYING') {
      statusRef.current = 'PLAYING';
      setStatus('PLAYING');
    }
  }, []);

  const togglePause = useCallback(() => {
    if (
      stagesModalOpenRef.current ||
      indexModalOpenRef.current ||
      shopModalOpenRef.current ||
      bagModalOpenRef.current ||
      settingsModalOpenRef.current ||
      gamesModalOpenRef.current
    ) {
      return;
    }
    if (statusRef.current === 'PLAYING') {
      statusRef.current = 'PAUSED';
      setStatus('PAUSED');
    } else if (statusRef.current === 'PAUSED') {
      statusRef.current = 'PLAYING';
      setStatus('PLAYING');
    }
  }, []);

  const toggleMusic = useCallback(() => {
    setMusicEnabled((prev) => !prev);
  }, []);

  const toggleSfx = useCallback(() => {
    setSfxEnabled((prev) => !prev);
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && statusRef.current === 'PLAYING') {
        statusRef.current = 'PAUSED';
        setStatus('PAUSED');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();

      if (shopModalOpenRef.current) {
        if (code === 'Escape') {
          e.preventDefault();
          closeShopModal();
        }
        return;
      }

      if (bagModalOpenRef.current) {
        if (code === 'Escape') {
          e.preventDefault();
          closeBagModal();
        }
        return;
      }

      if (settingsModalOpenRef.current) {
        if (code === 'Escape') {
          e.preventDefault();
          closeSettingsModal();
        }
        return;
      }

      if (indexModalOpenRef.current) {
        if (code === 'Escape') {
          e.preventDefault();
          closeIndexModal();
        }
        return;
      }

      if (gamesModalOpenRef.current) {
        if (code === 'Escape') {
          e.preventDefault();
          closeGamesModal();
        }
        return;
      }

      if (stagesModalOpenRef.current) {
        if (code === 'Escape') {
          e.preventDefault();
          closeStagesModal();
        }
        return;
      }

      if (code === 'ArrowLeft' || code === 'KeyA' || key === 'a') {
        simRef.current.input.leftKey = true;
        simRef.current.input.pointerActive = false;
        if (statusRef.current === 'PLAYING') e.preventDefault();
      } else if (code === 'ArrowRight' || code === 'KeyD' || key === 'd') {
        simRef.current.input.rightKey = true;
        simRef.current.input.pointerActive = false;
        if (statusRef.current === 'PLAYING') e.preventDefault();
      } else if (code === 'KeyP' || code === 'Escape') {
        if (statusRef.current === 'PLAYING' || statusRef.current === 'PAUSED') {
          e.preventDefault();
          togglePause();
        }
      } else if (code === 'KeyM') {
        toggleMusic();
      } else if (code === 'Space' || code === 'Enter') {
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== 'BUTTON') {
          if (statusRef.current === 'STAGE_CLEAR') {
            e.preventDefault();
            proceedToNextStage();
          } else if (statusRef.current === 'GAME_OVER') {
            e.preventDefault();
            retryCurrentStage();
          } else if (
            statusRef.current === 'START' ||
            statusRef.current === 'VICTORY'
          ) {
            e.preventDefault();
            resetAndStartGame();
          }
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();
      if (code === 'ArrowLeft' || code === 'KeyA' || key === 'a') {
        simRef.current.input.leftKey = false;
      } else if (code === 'ArrowRight' || code === 'KeyD' || key === 'd') {
        simRef.current.input.rightKey = false;
      }
    };

    const onBlur = () => {
      simRef.current.input.leftKey = false;
      simRef.current.input.rightKey = false;
      simRef.current.input.leftBtn = false;
      simRef.current.input.rightBtn = false;
      simRef.current.input.pointerActive = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [
    closeGamesModal,
    closeIndexModal,
    closeSettingsModal,
    closeShopModal,
    closeStagesModal,
    proceedToNextStage,
    resetAndStartGame,
    retryCurrentStage,
    toggleMusic,
    togglePause,
  ]);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const resizeCanvas = () => {
      const rect = stage.getBoundingClientRect();
      const w = Math.max(280, Math.floor(rect.width));
      const h = Math.max(300, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const sim = simRef.current;
      const prevW = sim.width || w;
      const ratioX = prevW > 0 ? sim.playerX / prevW : 0.5;

      sim.width = w;
      sim.height = h;
      sim.playerWidth = Math.max(66, Math.min(96, Math.round(w * 0.13)));
      sim.playerHeight = 26;
      sim.playerY = h - Math.max(46, Math.min(62, Math.round(h * 0.1)));
      sim.playerX = Math.max(
        sim.playerWidth / 2 + 12,
        Math.min(w - sim.playerWidth / 2 - 12, ratioX * w)
      );

      if (sim.stars.length === 0) {
        initStars(w, h);
      } else {
        for (const s of sim.stars) {
          s.x = Math.min(w, s.x);
          s.y = Math.min(h, s.y);
        }
        if (sim.fruitMotifs.length === 0) {
          sim.fruitMotifs = initFruitBgMotifs(w, h);
        } else {
          for (const m of sim.fruitMotifs) {
            m.x = Math.min(w, m.x);
            m.y = Math.min(h, m.y);
          }
        }
        if (sim.goldMotifs.length === 0) {
          sim.goldMotifs = initGoldBgMotifs(w, h);
        } else {
          for (const m of sim.goldMotifs) {
            m.x = Math.min(w, m.x);
            m.y = Math.min(h, m.y);
          }
        }
      }
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [initStars]);

  // Main 60fps HTML5 Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    const spawnBurst = (
      x: number,
      y: number,
      color: string,
      count: number,
      speedScale = 1
    ) => {
      const sim = simRef.current;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
        const speed = (65 + Math.random() * 155) * speedScale;
        const maxLife = 0.28 + Math.random() * 0.24;
        sim.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 25,
          radius: 2 + Math.random() * 3.2,
          color,
          alpha: 1,
          life: maxLife,
          maxLife,
        });
      }
    };

    const tryAwardPinkCoins = (x: number, y: number) => {
      const currentStage = stageNumRef.current;
      const alreadyWonStage =
        gameModeRef.current === 'gold'
          ? completedGoldStagesRef.current.includes(currentStage)
          : gameModeRef.current === 'fruit'
          ? completedFruitStagesRef.current.includes(currentStage)
          : completedStagesRef.current.includes(currentStage);
      if (alreadyWonStage) return;

      if (Math.random() >= PINK_COIN_DROP_CHANCE) return;
      const drop =
        PINK_COIN_MIN_DROP +
        Math.floor(Math.random() * (PINK_COIN_MAX_DROP - PINK_COIN_MIN_DROP + 1));
      const nextPinkCoins = pinkCoinsRef.current + drop;
      pinkCoinsRef.current = nextPinkCoins;
      setPinkCoins(nextPinkCoins);
      try {
        window.localStorage.setItem(
          PINK_COINS_STORAGE_KEY,
          String(nextPinkCoins)
        );
      } catch {
        // Ignore storage errors
      }
      spawnBurst(x, y, '#f472b6', 8, 0.88);
      simRef.current.floatingTexts.push({
        x,
        y: y - 32,
        vy: -48,
        text:
          langRef.current === 'ar'
            ? `+${drop} عملة وردية`
            : `+${drop} Pink`,
        color: '#f9a8d4',
        life: 0.85,
        maxLife: 0.85,
      });
    };

    const spawnFallingObject = () => {
      const sim = simRef.current;

      if (gameModeRef.current === 'gold') {
        const gCfg =
          GOLD_STAGES[Math.min(stageNumRef.current - 1, TOTAL_GOLD_STAGES - 1)];
        const isHazard = Math.random() < gCfg.hazardChance;
        let gKind: GoldItemKind;
        if (isHazard) {
          const roll = Math.random();
          if (roll < gCfg.bombRatio) {
            gKind = 'mimic_bomb';
          } else if (roll < gCfg.bombRatio + (1 - gCfg.bombRatio) * 0.54) {
            gKind = 'rust_anvil';
          } else {
            gKind = 'cursed_rock';
          }
        } else {
          const roll = Math.random();
          if (roll < 0.36) {
            gKind = 'gold_coin';
          } else if (roll < 0.66) {
            gKind = 'gold_bar';
          } else if (roll < 0.87) {
            gKind = 'gold_crown';
          } else {
            gKind = 'blue_diamond';
          }
        }

        const margin = Math.max(30, sim.playerWidth * 0.42);
        const usableW = Math.max(80, sim.width - margin * 2);
        let spawnX = margin + Math.random() * usableW;
        for (let attempt = 0; attempt < 6; attempt++) {
          const candidate = margin + Math.random() * usableW;
          const tooCloseToRecentTop = sim.items.some(
            (item) => item.y < 105 && Math.abs(item.x - candidate) < 62
          );
          const tooCloseToHazard =
            isHazard && Math.abs(candidate - sim.lastHazardX) < 58;
          if (!tooCloseToRecentTop && !tooCloseToHazard) {
            spawnX = candidate;
            break;
          }
        }
        if (isHazard) {
          sim.lastHazardX = spawnX;
        }

        const speedVariance =
          gKind === 'mimic_bomb'
            ? 1.12 + Math.random() * 0.24
            : isHazard
            ? 0.92 + Math.random() * 0.3
            : gKind === 'blue_diamond'
            ? 1.0 + Math.random() * 0.28
            : 0.86 + Math.random() * 0.32;
        const heightFactor = Math.max(0.82, Math.min(1.22, sim.height / 540));
        const speed = gCfg.baseSpeed * speedVariance * heightFactor;
        const radius =
          gKind === 'blue_diamond' || gKind === 'gold_crown'
            ? Math.max(16, Math.min(20, sim.width * 0.025))
            : isHazard
            ? Math.max(16, Math.min(20, sim.width * 0.025))
            : Math.max(15, Math.min(19, sim.width * 0.024));
        const driftRange = isHazard ? gCfg.lateralDrift : gCfg.lateralDrift * 0.7;

        sim.items.push({
          id: sim.nextId++,
          kind: gKind,
          x: spawnX,
          y: -radius - 10,
          radius,
          speed,
          vx: driftRange > 0 ? (Math.random() * 2 - 1) * driftRange : 0,
          rotation: 0,
          rotSpeed: gKind === 'cursed_rock' ? (Math.random() > 0.5 ? 1 : -1) * 1.4 : 0,
          pulsePhase: Math.random() * Math.PI * 2,
        });
        return;
      }

      if (gameModeRef.current === 'fruit') {
        const fCfg =
          FRUIT_STAGES[Math.min(stageNumRef.current - 1, TOTAL_FRUIT_STAGES - 1)];
        const isVeg = Math.random() < fCfg.vegChance;
        let fKind: FruitItemKind;
        if (isVeg) {
          const roll = Math.random();
          if (roll < fCfg.pepperRatio) {
            fKind = 'veg_pepper';
          } else if (roll < fCfg.pepperRatio + (1 - fCfg.pepperRatio) * 0.52) {
            fKind = 'veg_broccoli';
          } else {
            fKind = 'veg_carrot';
          }
        } else {
          const roll = Math.random();
          if (roll < 0.34) {
            fKind = 'fruit_apple';
          } else if (roll < 0.64) {
            fKind = 'fruit_orange';
          } else if (roll < 0.86) {
            fKind = 'fruit_strawberry';
          } else {
            fKind = 'fruit_watermelon';
          }
        }

        const margin = Math.max(30, sim.playerWidth * 0.42);
        const usableW = Math.max(80, sim.width - margin * 2);
        let spawnX = margin + Math.random() * usableW;
        for (let attempt = 0; attempt < 6; attempt++) {
          const candidate = margin + Math.random() * usableW;
          const tooCloseToRecentTop = sim.items.some(
            (item) => item.y < 105 && Math.abs(item.x - candidate) < 62
          );
          const tooCloseToHazard =
            isVeg && Math.abs(candidate - sim.lastHazardX) < 58;
          if (!tooCloseToRecentTop && !tooCloseToHazard) {
            spawnX = candidate;
            break;
          }
        }
        if (isVeg) {
          sim.lastHazardX = spawnX;
        }

        const speedVariance =
          fKind === 'veg_pepper'
            ? 1.12 + Math.random() * 0.24
            : isVeg
            ? 0.92 + Math.random() * 0.3
            : fKind === 'fruit_watermelon'
            ? 0.96 + Math.random() * 0.28
            : 0.86 + Math.random() * 0.32;
        const heightFactor = Math.max(0.82, Math.min(1.22, sim.height / 540));
        const speed = fCfg.baseSpeed * speedVariance * heightFactor;
        const radius =
          fKind === 'fruit_watermelon'
            ? Math.max(17, Math.min(21, sim.width * 0.026))
            : isVeg
            ? Math.max(16, Math.min(20, sim.width * 0.025))
            : Math.max(15, Math.min(19, sim.width * 0.024));
        const driftRange = isVeg ? fCfg.lateralDrift : fCfg.lateralDrift * 0.7;

        sim.items.push({
          id: sim.nextId++,
          kind: fKind,
          x: spawnX,
          y: -radius - 10,
          radius,
          speed,
          vx: driftRange > 0 ? (Math.random() * 2 - 1) * driftRange : 0,
          rotation: 0,
          rotSpeed: isVeg ? (Math.random() > 0.5 ? 1 : -1) * 1.1 : 0,
          pulsePhase: Math.random() * Math.PI * 2,
        });
        return;
      }

      const cfg = STAGES[Math.min(stageNumRef.current - 1, TOTAL_STAGES - 1)];

      const isHazard = Math.random() < cfg.hazardChance;
      let kind: ItemKind;
      if (isHazard) {
        const roll = Math.random();
        const stage = stageNumRef.current;
        const arrowPoolRatio =
          stage >= 6
            ? Math.min(0.42, cfg.arrowHazardRatio + 0.1)
            : stage >= 3
            ? Math.min(0.36, cfg.arrowHazardRatio + 0.06)
            : cfg.arrowHazardRatio;
        if (roll < arrowPoolRatio) {
          if (stage >= 6) {
            const subRoll = Math.random();
            if (subRoll < 0.46) {
              kind = 'hazard_arrow';
            } else if (subRoll < 0.73) {
              kind = 'hazard_arrow_amber';
            } else {
              kind = 'hazard_arrow_violet';
            }
          } else if (stage >= 3) {
            kind = Math.random() < 0.6 ? 'hazard_arrow' : 'hazard_arrow_amber';
          } else {
            kind = 'hazard_arrow';
          }
        } else {
          const remRoll =
            (roll - arrowPoolRatio) /
            Math.max(0.01, 1 - arrowPoolRatio);
          if (remRoll < cfg.starHazardRatio) {
            kind = 'hazard_star';
          } else if (
            remRoll <
            cfg.starHazardRatio +
              (1 - cfg.starHazardRatio) * cfg.squareHazardRatio
          ) {
            kind = 'hazard_square';
          } else {
            kind = 'hazard_spike';
          }
        }
      } else {
        // Collectible types: Stage 1–19 (Green +2, Pink +3, Blue +4); Stage 20+ adds Purple Diamond (+5, 5%) & Golden Star (+7, 5%)
        const roll = Math.random();
        if (stageNumRef.current >= 20) {
          if (roll < 0.15) {
            kind = 'green_circle';
          } else if (roll < 0.56) {
            kind = 'pink_circle';
          } else if (roll < 0.9) {
            kind = 'blue_triangle';
          } else if (roll < 0.95) {
            kind = 'purple_diamond';
          } else {
            kind = 'gold_star';
          }
        } else if (roll < 0.17) {
          kind = 'green_circle';
        } else if (roll < 0.62) {
          kind = 'pink_circle';
        } else {
          kind = 'blue_triangle';
        }
      }

      const margin = Math.max(30, sim.playerWidth * 0.42);
      const usableW = Math.max(80, sim.width - margin * 2);

      let spawnX = margin + Math.random() * usableW;
      for (let attempt = 0; attempt < 6; attempt++) {
        const candidate = margin + Math.random() * usableW;
        const tooCloseToRecentTop = sim.items.some(
          (item) => item.y < 105 && Math.abs(item.x - candidate) < 62
        );
        const tooCloseToHazard =
          isHazard && Math.abs(candidate - sim.lastHazardX) < 58;
        if (!tooCloseToRecentTop && !tooCloseToHazard) {
          spawnX = candidate;
          break;
        }
      }

      if (isHazard) {
        sim.lastHazardX = spawnX;
      }

      const speedVariance =
        kind === 'hazard_arrow'
          ? ARROW_SPEED_MULTIPLIER
          : kind === 'hazard_arrow_amber'
          ? AMBER_ARROW_SPEED_MULTIPLIER
          : kind === 'hazard_arrow_violet'
          ? VIOLET_ARROW_SPEED_MULTIPLIER
          : kind === 'hazard_square'
          ? 0.96 + Math.random() * 0.3
          : kind === 'hazard_star'
          ? 0.88 + Math.random() * 0.28
          : kind === 'hazard_spike'
          ? 0.9 + Math.random() * 0.34
          : kind === 'gold_star'
          ? 1.04 + Math.random() * 0.3
          : kind === 'purple_diamond'
          ? 0.96 + Math.random() * 0.32
          : kind === 'green_circle'
          ? 0.9 + Math.random() * 0.3
          : kind === 'blue_triangle'
          ? 0.92 + Math.random() * 0.34
          : 0.84 + Math.random() * 0.36;

      const heightFactor = Math.max(0.82, Math.min(1.22, sim.height / 540));
      const speed = cfg.baseSpeed * speedVariance * heightFactor;

      const radius =
        kind === 'hazard_arrow' ||
        kind === 'hazard_arrow_amber' ||
        kind === 'hazard_arrow_violet'
          ? Math.max(12, Math.min(15, sim.width * 0.02))
          : kind === 'hazard_square' || kind === 'hazard_star'
          ? Math.max(16, Math.min(20, sim.width * 0.025))
          : kind === 'hazard_spike'
          ? Math.max(15, Math.min(19, sim.width * 0.024))
          : Math.max(14, Math.min(18, sim.width * 0.023));

      const driftRange =
        kind === 'hazard_arrow'
          ? 0
          : kind === 'hazard_arrow_violet'
          ? cfg.lateralDrift * 0.35
          : isHazard
          ? cfg.lateralDrift
          : cfg.lateralDrift * 0.65;
      const amberSlantVx =
        kind === 'hazard_arrow_amber'
          ? (Math.random() > 0.5 ? 1 : -1) *
            (Math.max(46, cfg.lateralDrift * 0.95) + Math.random() * 24)
          : driftRange > 0
          ? (Math.random() * 2 - 1) * driftRange
          : 0;
      sim.items.push({
        id: sim.nextId++,
        kind,
        x: spawnX,
        y: -radius - 10,
        radius,
        speed,
        vx: amberSlantVx,
        rotation: 0,
        rotSpeed:
          kind === 'hazard_spike'
            ? (Math.random() > 0.5 ? 1 : -1) * 2.4
            : kind === 'green_circle'
            ? (Math.random() > 0.5 ? 1 : -1) * 2.2
            : kind === 'gold_star'
            ? (Math.random() > 0.5 ? 1 : -1) * 1.9
            : kind === 'hazard_star'
            ? (Math.random() > 0.5 ? 1 : -1) * 1.4
            : 0,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    };

    const update = (dt: number) => {
      const sim = simRef.current;

      const isSpeedBoostActive =
        statusRef.current === 'PLAYING' && sim.speedBoostTimer > 0;
      const starSpeedMul =
        statusRef.current === 'PLAYING' ? (isSpeedBoostActive ? 2.6 : 1) : 0.45;
      for (const s of sim.stars) {
        s.y += s.speed * starSpeedMul * dt;
        if (s.y > sim.height + 4) {
          s.y = -4;
          s.x = Math.random() * sim.width;
        }
      }
      for (const m of sim.fruitMotifs) {
        m.y += m.speed * starSpeedMul * dt;
        m.rotation += m.rotSpeed * dt;
        if (m.y > sim.height + m.size + 24) {
          m.y = -m.size - 24;
          m.x = Math.random() * sim.width;
        }
      }
      for (const m of sim.goldMotifs) {
        m.y += m.speed * starSpeedMul * dt;
        m.rotation += m.rotSpeed * dt;
        if (m.y > sim.height + m.size + 24) {
          m.y = -m.size - 24;
          m.x = Math.random() * sim.width;
        }
      }

      if (statusRef.current !== 'PLAYING') {
        if (
          statusRef.current === 'STAGE_CLEAR' ||
          statusRef.current === 'GAME_OVER' ||
          statusRef.current === 'VICTORY'
        ) {
          for (let i = sim.particles.length - 1; i >= 0; i--) {
            const p = sim.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
              sim.particles.splice(i, 1);
              continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 260 * dt;
            p.alpha = p.life / p.maxLife;
          }
          for (let i = sim.floatingTexts.length - 1; i >= 0; i--) {
            const ft = sim.floatingTexts[i];
            ft.life -= dt;
            if (ft.life <= 0) {
              sim.floatingTexts.splice(i, 1);
              continue;
            }
            ft.y += ft.vy * dt;
          }
          if (sim.shakeTimer > 0) sim.shakeTimer = Math.max(0, sim.shakeTimer - dt);
          if (sim.hitFlashAlpha > 0)
            sim.hitFlashAlpha = Math.max(0, sim.hitFlashAlpha - dt * 2.4);
        }
        return;
      }

      // Tick 5-second +100% (2x) game speed boost in real time
      const gameSpeedMul =
        sim.speedBoostTimer > 0 ? SPEED_BOOST_MULTIPLIER : 1;
      const simDt = dt * gameSpeedMul;
      if (sim.speedBoostTimer > 0) {
        sim.speedBoostTimer = Math.max(0, sim.speedBoostTimer - dt);
      }

      if (sim.slowTimer > 0) {
        sim.slowTimer = Math.max(0, sim.slowTimer - dt);
      }

      // Smooth player horizontal movement (locked in place while frozen by Red Freeze Star)
      const halfW = sim.playerWidth / 2;
      const minX = halfW + 10;
      const maxX = sim.width - halfW - 10;
      const slowMul = sim.slowTimer > 0 ? VIOLET_ARROW_SLOW_FACTOR : 1;
      const maxSpeed =
        Math.max(580, sim.width * 1.02) *
        (gameSpeedMul > 1 ? SPEED_BOOST_PLAYER_SLOW : 1) *
        slowMul;

      if (sim.freezeTimer > 0) {
        sim.freezeTimer = Math.max(0, sim.freezeTimer - dt);
        sim.playerVx = 0;
      } else {
        const moveDir =
          (sim.input.rightKey || sim.input.rightBtn ? 1 : 0) -
          (sim.input.leftKey || sim.input.leftBtn ? 1 : 0);

        if (moveDir !== 0) {
          const targetVx = moveDir * maxSpeed;
          const accel = 1 - Math.exp(-22 * dt);
          sim.playerVx += (targetVx - sim.playerVx) * accel;
          sim.playerX += sim.playerVx * dt;
        } else if (sim.input.pointerActive) {
          const clampedTarget = Math.max(
            minX,
            Math.min(maxX, sim.input.pointerTargetX)
          );
          const diffX = clampedTarget - sim.playerX;
          const follow = 1 - Math.exp(-26 * dt);
          let step = diffX * follow;
          if (gameSpeedMul > 1 || slowMul < 1) {
            const maxStep = maxSpeed * dt;
            step = Math.max(-maxStep, Math.min(maxStep, step));
          }
          sim.playerVx = dt > 0 ? step / dt : 0;
          sim.playerX += step;
        } else {
          const decel = Math.exp(-18 * dt);
          sim.playerVx *= decel;
          if (Math.abs(sim.playerVx) < 4) sim.playerVx = 0;
          sim.playerX += sim.playerVx * dt;
        }
      }

      if (sim.playerX < minX) {
        sim.playerX = minX;
        sim.playerVx = 0;
      } else if (sim.playerX > maxX) {
        sim.playerX = maxX;
        sim.playerVx = 0;
      }

      if (sim.invulnTimer > 0) sim.invulnTimer = Math.max(0, sim.invulnTimer - dt);
      if (sim.shieldTimer > 0) sim.shieldTimer = Math.max(0, sim.shieldTimer - dt);
      if (sim.playerBounce > 0) sim.playerBounce = Math.max(0, sim.playerBounce - dt * 5.2);
      if (sim.playerGlowAlpha > 0)
        sim.playerGlowAlpha = Math.max(0, sim.playerGlowAlpha - dt * 2.8);
      if (sim.shakeTimer > 0) sim.shakeTimer = Math.max(0, sim.shakeTimer - dt);
      if (sim.hitFlashAlpha > 0)
        sim.hitFlashAlpha = Math.max(0, sim.hitFlashAlpha - dt * 2.5);
      if (sim.stageBannerTimer > 0)
        sim.stageBannerTimer = Math.max(0, sim.stageBannerTimer - dt);

      // Spawning cadence governed by current stage (scales 2x during green orb speed boost)
      const activeSpawnInterval =
        gameModeRef.current === 'fruit'
          ? FRUIT_STAGES[Math.min(stageNumRef.current - 1, TOTAL_FRUIT_STAGES - 1)]
              .spawnInterval
          : gameModeRef.current === 'gold'
          ? GOLD_STAGES[Math.min(stageNumRef.current - 1, TOTAL_GOLD_STAGES - 1)]
              .spawnInterval
          : STAGES[Math.min(stageNumRef.current - 1, TOTAL_STAGES - 1)]
              .spawnInterval;
      sim.spawnTimer -= simDt;
      if (sim.spawnTimer <= 0) {
        spawnFallingObject();
        sim.spawnTimer = activeSpawnInterval * (0.82 + Math.random() * 0.36);
      }

      // Collision checks
      const catcherTop = sim.playerY - sim.playerHeight / 2;
      const catcherBottom = sim.playerY + sim.playerHeight / 2;
      const catcherLeft = sim.playerX - halfW;
      const catcherRight = sim.playerX + halfW;

      for (let i = sim.items.length - 1; i >= 0; i--) {
        const item = sim.items[i];

        item.y += item.speed * simDt;
        item.x += item.vx * simDt;
        item.rotation += item.rotSpeed * simDt;
        item.pulsePhase += simDt * 5.2;

        if (item.x < item.radius + 10) {
          item.x = item.radius + 10;
          item.vx = Math.abs(item.vx);
        } else if (item.x > sim.width - item.radius - 10) {
          item.x = sim.width - item.radius - 10;
          item.vx = -Math.abs(item.vx);
        }

        const isFruitWorld = gameModeRef.current === 'fruit';
        const isGoldWorld = gameModeRef.current === 'gold';
        const isPoint = isFruitWorld
          ? FRUIT_ITEM_STATS[item.kind as FruitItemKind]?.isFruit ?? false
          : isGoldWorld
          ? GOLD_ITEM_STATS[item.kind as GoldItemKind]?.isTreasure ?? false
          : item.kind === 'pink_circle' ||
            item.kind === 'blue_triangle' ||
            item.kind === 'green_circle' ||
            item.kind === 'purple_diamond' ||
            item.kind === 'gold_star';

        if (item.y - item.radius > sim.height + 24) {
          if (isPoint) {
            streakRef.current = 0;
          }
          sim.items.splice(i, 1);
          continue;
        }

        const hitPad = isPoint ? 4 : -4;
        const nearestX = Math.max(
          catcherLeft - hitPad,
          Math.min(item.x, catcherRight + hitPad)
        );
        const nearestY = Math.max(
          catcherTop - hitPad,
          Math.min(item.y, catcherBottom + hitPad)
        );
        const dx = item.x - nearestX;
        const dy = item.y - nearestY;
        const effectiveRadius = Math.max(6, item.radius + (isPoint ? 2 : -2));

        if (dx * dx + dy * dy <= effectiveRadius * effectiveRadius) {
          sim.items.splice(i, 1);

          if (isGoldWorld) {
            const gKind = item.kind as GoldItemKind;
            const gStats = GOLD_ITEM_STATS[gKind];

            // Discover & unlock this item in the dedicated Gold Index on catch/touch
            if (!discoveredGoldItemsRef.current.includes(gKind)) {
              const updated = [...discoveredGoldItemsRef.current, gKind];
              discoveredGoldItemsRef.current = updated;
              setDiscoveredGoldItems(updated);
              try {
                window.localStorage.setItem(
                  DISCOVERED_GOLD_ITEMS_STORAGE_KEY,
                  JSON.stringify(updated)
                );
              } catch {
                // Ignore storage errors
              }
            }

            if (gStats.isTreasure) {
              const value = gStats.pointsDelta;
              const nextScore = scoreRef.current + value;
              scoreRef.current = nextScore;
              setScore(nextScore);

              const nextStagePoints = stagePointsRef.current + value;
              stagePointsRef.current = nextStagePoints;
              setStagePoints(nextStagePoints);

              if (nextScore > bestScoreRef.current) {
                bestScoreRef.current = nextScore;
                setBestScore(nextScore);
                setIsNewBest(true);
                try {
                  window.localStorage.setItem(
                    BEST_SCORE_STORAGE_KEY,
                    String(nextScore)
                  );
                } catch {
                  // Ignore storage errors
                }
              }

              sim.playerBounce = 1;
              sim.playerGlowColor = gStats.color;
              sim.playerGlowAlpha = 1;

              spawnBurst(item.x, item.y, gStats.color, 16, 1.08);
              spawnBurst(item.x, item.y, '#fef9c3', 6, 0.78);
              sim.floatingTexts.push({
                x: item.x,
                y: item.y - 10,
                vy: -56,
                text: `+${value}`,
                color: gStats.textColor,
                life: 0.7,
                maxLife: 0.7,
              });
              tryAwardPinkCoins(item.x, item.y);

              const currentGoldCfg =
                GOLD_STAGES[
                  Math.min(stageNumRef.current - 1, TOTAL_GOLD_STAGES - 1)
                ];

              if (nextStagePoints >= currentGoldCfg.pointsNeeded) {
                const clearedStage = stageNumRef.current;
                const alreadyCompleted =
                  completedGoldStagesRef.current.includes(clearedStage);
                const earnedCoins = alreadyCompleted
                  ? 0
                  : getGoldStageClearCoins(diamondsRef.current);
                setLastEarnedCoins(earnedCoins);
                if (earnedCoins > 0) {
                  const nextCoins = coinsRef.current + earnedCoins;
                  coinsRef.current = nextCoins;
                  setCoins(nextCoins);
                  try {
                    window.localStorage.setItem(
                      COINS_STORAGE_KEY,
                      String(nextCoins)
                    );
                  } catch {
                    // Ignore storage errors
                  }
                }

                if (!alreadyCompleted) {
                  const updated = [...completedGoldStagesRef.current, clearedStage];
                  completedGoldStagesRef.current = updated;
                  setCompletedGoldStages(updated);
                  try {
                    window.localStorage.setItem(
                      COMPLETED_GOLD_STAGES_STORAGE_KEY,
                      JSON.stringify(updated)
                    );
                  } catch {
                    // Ignore storage errors
                  }
                }

                sim.input.pointerActive = false;
                sim.input.pointerId = null;
                sim.input.leftBtn = false;
                sim.input.rightBtn = false;

                if (clearedStage >= TOTAL_GOLD_STAGES) {
                  statusRef.current = 'VICTORY';
                  setStatus('VICTORY');
                  spawnBurst(sim.width * 0.35, sim.height * 0.4, '#fbbf24', 24, 1.35);
                  spawnBurst(sim.width * 0.65, sim.height * 0.4, '#38bdf8', 24, 1.35);
                  audioRef.current.playVictory();
                } else {
                  statusRef.current = 'STAGE_CLEAR';
                  setStatus('STAGE_CLEAR');
                  spawnBurst(sim.width * 0.35, sim.height * 0.42, '#fbbf24', 18, 1.2);
                  spawnBurst(sim.width * 0.65, sim.height * 0.42, '#38bdf8', 18, 1.2);
                  audioRef.current.playStageUp();
                }
                streakRef.current = Math.min(streakRef.current + 1, 10);
                break;
              } else {
                audioRef.current.playCatch(streakRef.current, value >= 4);
                streakRef.current = Math.min(streakRef.current + 1, 10);
              }
            } else {
              // Active 2-second shield barrier blocks all vault hazards cleanly
              if (sim.shieldTimer > 0) {
                sim.playerGlowColor = '#38bdf8';
                sim.playerGlowAlpha = 0.9;
                spawnBurst(item.x, item.y, '#7dd3fc', 16, 1.1);
                sim.floatingTexts.push({
                  x: item.x,
                  y: item.y - 12,
                  vy: -50,
                  text: langRef.current === 'ar' ? 'محمي!' : 'Shielded!',
                  color: '#bae6fd',
                  life: 0.75,
                  maxLife: 0.75,
                });
                audioRef.current.playBuyHeart();
                continue;
              }

              // Shop Shield auto-activates for 2 full seconds on vault hazard contact
              if (sim.invulnTimer <= 0 && shopRef.current.shields > 0) {
                const nextShop: ShopState = {
                  ...shopRef.current,
                  shields: Math.max(0, shopRef.current.shields - 1),
                };
                shopRef.current = nextShop;
                setShop(nextShop);
                persistShopState(nextShop);

                sim.shieldTimer = SHIELD_DURATION;
                sim.playerGlowColor = '#38bdf8';
                sim.playerGlowAlpha = 1;
                spawnBurst(item.x, item.y, '#7dd3fc', 22, 1.25);
                sim.floatingTexts.push({
                  x: item.x,
                  y: item.y - 12,
                  vy: -52,
                  text:
                    langRef.current === 'ar'
                      ? `درع الحماية · ${SHIELD_DURATION}ث!`
                      : `Shield · ${SHIELD_DURATION}s!`,
                  color: '#bae6fd',
                  life: 0.95,
                  maxLife: 0.95,
                });
                audioRef.current.playBuyHeart();
                continue;
              }

              // Vault hazard hit: subtracts stage points & score AND deducts Diamond lives
              const penalty = Math.abs(gStats.pointsDelta);
              const nextStagePoints = Math.max(0, stagePointsRef.current - penalty);
              stagePointsRef.current = nextStagePoints;
              setStagePoints(nextStagePoints);

              const nextScore = Math.max(0, scoreRef.current - penalty);
              scoreRef.current = nextScore;
              setScore(nextScore);
              streakRef.current = 0;

              if (sim.invulnTimer <= 0) {
                const prevDiamonds = diamondsRef.current;
                const nextDiamonds = Math.max(0, prevDiamonds - gStats.diamondDamage);
                diamondsRef.current = nextDiamonds;
                setDiamonds(nextDiamonds);
                if (prevDiamonds >= MAX_DIAMONDS && nextDiamonds < MAX_DIAMONDS) {
                  lastDiamondRegenAtRef.current = Date.now();
                  setNextDiamondInMs(HEART_REGEN_MS);
                }
                persistDiamondsState(nextDiamonds, lastDiamondRegenAtRef.current);

                const isHeavyHaz = gStats.diamondDamage >= 2;
                sim.shakeTimer = isHeavyHaz ? 0.32 : 0.24;
                sim.shakeIntensity = isHeavyHaz ? 10 : 7;
                sim.hitFlashAlpha = isHeavyHaz ? 0.42 : 0.3;
                sim.invulnTimer = 0.75;

                spawnBurst(item.x, item.y, '#ef4444', isHeavyHaz ? 22 : 16, 1.2);
                spawnBurst(item.x, item.y, '#38bdf8', 8, 0.9);
                sim.floatingTexts.push({
                  x: item.x,
                  y: item.y - 12,
                  vy: -52,
                  text:
                    langRef.current === 'ar'
                      ? `-${penalty} · -${gStats.diamondDamage} ألماسة`
                      : `-${penalty} · -${gStats.diamondDamage} 💎`,
                  color: '#fecaca',
                  life: 0.9,
                  maxLife: 0.9,
                });

                if (nextDiamonds <= 0) {
                  statusRef.current = 'GAME_OVER';
                  setStatus('GAME_OVER');
                  audioRef.current.playGameOver();
                  break;
                } else {
                  audioRef.current.playHazardHit(isHeavyHaz);
                }
              } else {
                spawnBurst(item.x, item.y, '#fca5a5', 8, 0.85);
                sim.floatingTexts.push({
                  x: item.x,
                  y: item.y - 12,
                  vy: -48,
                  text: `-${penalty}`,
                  color: '#fecaca',
                  life: 0.7,
                  maxLife: 0.7,
                });
              }
            }
            continue;
          }

          if (isFruitWorld) {
            const fKind = item.kind as FruitItemKind;
            const fStats = FRUIT_ITEM_STATS[fKind];

            // Discover & unlock this fruit/vegetable in the dedicated Fruit Index on catch/touch
            if (!discoveredFruitItemsRef.current.includes(fKind)) {
              const updated = [...discoveredFruitItemsRef.current, fKind];
              discoveredFruitItemsRef.current = updated;
              setDiscoveredFruitItems(updated);
              try {
                window.localStorage.setItem(
                  DISCOVERED_FRUIT_ITEMS_STORAGE_KEY,
                  JSON.stringify(updated)
                );
              } catch {
                // Ignore storage errors
              }
            }

            if (fStats.isFruit) {
              const value = fStats.pointsDelta;
              const nextScore = scoreRef.current + value;
              scoreRef.current = nextScore;
              setScore(nextScore);

              const nextStagePoints = stagePointsRef.current + value;
              stagePointsRef.current = nextStagePoints;
              setStagePoints(nextStagePoints);

              if (nextScore > bestScoreRef.current) {
                bestScoreRef.current = nextScore;
                setBestScore(nextScore);
                setIsNewBest(true);
                try {
                  window.localStorage.setItem(
                    BEST_SCORE_STORAGE_KEY,
                    String(nextScore)
                  );
                } catch {
                  // Ignore storage errors
                }
              }

              sim.playerBounce = 1;
              sim.playerGlowColor = fStats.color;
              sim.playerGlowAlpha = 1;

              spawnBurst(item.x, item.y, fStats.color, 15, 1.05);
              spawnBurst(item.x, item.y, '#fef9c3', 5, 0.72);
              sim.floatingTexts.push({
                x: item.x,
                y: item.y - 10,
                vy: -56,
                text: `+${value}`,
                color: fStats.textColor,
                life: 0.68,
                maxLife: 0.68,
              });
              tryAwardPinkCoins(item.x, item.y);

              const currentFruitCfg =
                FRUIT_STAGES[
                  Math.min(stageNumRef.current - 1, TOTAL_FRUIT_STAGES - 1)
                ];

              if (nextStagePoints >= currentFruitCfg.pointsNeeded) {
                const clearedStage = stageNumRef.current;
                const alreadyCompleted =
                  completedFruitStagesRef.current.includes(clearedStage);
                const earnedCoins = alreadyCompleted
                  ? 0
                  : getFruitStageClearCoins(cornRef.current);
                setLastEarnedCoins(earnedCoins);
                if (earnedCoins > 0) {
                  const nextCoins = coinsRef.current + earnedCoins;
                  coinsRef.current = nextCoins;
                  setCoins(nextCoins);
                  try {
                    window.localStorage.setItem(
                      COINS_STORAGE_KEY,
                      String(nextCoins)
                    );
                  } catch {
                    // Ignore storage errors
                  }
                }

                if (!alreadyCompleted) {
                  const updated = [...completedFruitStagesRef.current, clearedStage];
                  completedFruitStagesRef.current = updated;
                  setCompletedFruitStages(updated);
                  try {
                    window.localStorage.setItem(
                      COMPLETED_FRUIT_STAGES_STORAGE_KEY,
                      JSON.stringify(updated)
                    );
                  } catch {
                    // Ignore storage errors
                  }
                }

                sim.input.pointerActive = false;
                sim.input.pointerId = null;
                sim.input.leftBtn = false;
                sim.input.rightBtn = false;

                if (clearedStage >= TOTAL_FRUIT_STAGES) {
                  statusRef.current = 'VICTORY';
                  setStatus('VICTORY');
                  spawnBurst(sim.width * 0.35, sim.height * 0.4, '#facc15', 22, 1.3);
                  spawnBurst(sim.width * 0.65, sim.height * 0.4, '#4ade80', 22, 1.3);
                  audioRef.current.playVictory();
                } else {
                  statusRef.current = 'STAGE_CLEAR';
                  setStatus('STAGE_CLEAR');
                  spawnBurst(sim.width * 0.35, sim.height * 0.42, '#fb923c', 16, 1.15);
                  spawnBurst(sim.width * 0.65, sim.height * 0.42, '#4ade80', 16, 1.15);
                  audioRef.current.playStageUp();
                }
                streakRef.current = Math.min(streakRef.current + 1, 10);
                break;
              } else {
                audioRef.current.playCatch(streakRef.current, value >= 4);
                streakRef.current = Math.min(streakRef.current + 1, 10);
              }
            } else {
              // Active 2-second shield barrier blocks all vegetables cleanly without losing points or corn
              if (sim.shieldTimer > 0) {
                sim.playerGlowColor = '#38bdf8';
                sim.playerGlowAlpha = 0.9;
                spawnBurst(item.x, item.y, '#7dd3fc', 16, 1.1);
                sim.floatingTexts.push({
                  x: item.x,
                  y: item.y - 12,
                  vy: -50,
                  text: langRef.current === 'ar' ? 'محمي!' : 'Shielded!',
                  color: '#bae6fd',
                  life: 0.75,
                  maxLife: 0.75,
                });
                audioRef.current.playBuyHeart();
                continue;
              }

              // Shop Shield auto-activates for 2 full seconds on vegetable contact
              if (sim.invulnTimer <= 0 && shopRef.current.shields > 0) {
                const nextShop: ShopState = {
                  ...shopRef.current,
                  shields: Math.max(0, shopRef.current.shields - 1),
                };
                shopRef.current = nextShop;
                setShop(nextShop);
                persistShopState(nextShop);

                sim.shieldTimer = SHIELD_DURATION;
                sim.playerGlowColor = '#38bdf8';
                sim.playerGlowAlpha = 1;
                spawnBurst(item.x, item.y, '#7dd3fc', 22, 1.25);
                sim.floatingTexts.push({
                  x: item.x,
                  y: item.y - 12,
                  vy: -52,
                  text:
                    langRef.current === 'ar'
                      ? `درع الحماية · ${SHIELD_DURATION}ث!`
                      : `Shield · ${SHIELD_DURATION}s!`,
                  color: '#bae6fd',
                  life: 0.95,
                  maxLife: 0.95,
                });
                audioRef.current.playBuyHeart();
                continue;
              }

              // Vegetable hit: subtracts stage points & score AND deducts Corn lives
              const penalty = Math.abs(fStats.pointsDelta);
              const nextStagePoints = Math.max(0, stagePointsRef.current - penalty);
              stagePointsRef.current = nextStagePoints;
              setStagePoints(nextStagePoints);

              const nextScore = Math.max(0, scoreRef.current - penalty);
              scoreRef.current = nextScore;
              setScore(nextScore);
              streakRef.current = 0;

              if (sim.invulnTimer <= 0) {
                const prevCorn = cornRef.current;
                const nextCorn = Math.max(0, prevCorn - fStats.cornDamage);
                cornRef.current = nextCorn;
                setCorn(nextCorn);
                if (prevCorn >= MAX_CORN && nextCorn < MAX_CORN) {
                  lastCornRegenAtRef.current = Date.now();
                  setNextCornInMs(HEART_REGEN_MS);
                }
                persistCornState(nextCorn, lastCornRegenAtRef.current);

                const isHeavyVeg = fStats.cornDamage >= 2;
                sim.shakeTimer = isHeavyVeg ? 0.32 : 0.24;
                sim.shakeIntensity = isHeavyVeg ? 10 : 7;
                sim.hitFlashAlpha = isHeavyVeg ? 0.42 : 0.3;
                sim.invulnTimer = 0.75;

                spawnBurst(item.x, item.y, '#ef4444', isHeavyVeg ? 22 : 16, 1.2);
                spawnBurst(item.x, item.y, '#facc15', 8, 0.9);
                sim.floatingTexts.push({
                  x: item.x,
                  y: item.y - 12,
                  vy: -52,
                  text:
                    langRef.current === 'ar'
                      ? `-${penalty} · -${fStats.cornDamage} ذرة`
                      : `-${penalty} · -${fStats.cornDamage} Corn`,
                  color: '#fecaca',
                  life: 0.9,
                  maxLife: 0.9,
                });

                if (nextCorn <= 0) {
                  statusRef.current = 'GAME_OVER';
                  setStatus('GAME_OVER');
                  audioRef.current.playGameOver();
                  break;
                } else {
                  audioRef.current.playHazardHit(isHeavyVeg);
                }
              } else {
                spawnBurst(item.x, item.y, '#fca5a5', 8, 0.85);
                sim.floatingTexts.push({
                  x: item.x,
                  y: item.y - 12,
                  vy: -48,
                  text: `-${penalty}`,
                  color: '#fecaca',
                  life: 0.7,
                  maxLife: 0.7,
                });
              }
            }
            continue;
          }

          // Discover & unlock this item in the Normal Index ONLY when caught/touched by the player
          const normalKind = item.kind as ItemKind;
          if (!discoveredItemsRef.current.includes(normalKind)) {
            const updated = [...discoveredItemsRef.current, normalKind];
            discoveredItemsRef.current = updated;
            setDiscoveredItems(updated);
            try {
              window.localStorage.setItem(
                DISCOVERED_ITEMS_STORAGE_KEY,
                JSON.stringify(updated)
              );
            } catch {
              // Ignore storage errors
            }
          }

          if (isPoint) {
            const isGreen = item.kind === 'green_circle';
            const isTriangle = item.kind === 'blue_triangle';
            const isPurple = item.kind === 'purple_diamond';
            const isGoldStar = item.kind === 'gold_star';
            const value = isGoldStar
              ? GOLD_STAR_POINTS
              : isPurple
              ? PURPLE_DIAMOND_POINTS
              : isGreen
              ? GREEN_CIRCLE_POINTS
              : isTriangle
              ? BLUE_TRIANGLE_POINTS
              : PINK_CIRCLE_POINTS;
            const color = isGoldStar
              ? '#fbbf24'
              : isPurple
              ? '#c084fc'
              : isGreen
              ? '#10b981'
              : isTriangle
              ? '#38bdf8'
              : '#f472b6';
            const textColor = isGoldStar
              ? '#fef08a'
              : isPurple
              ? '#f3e8ff'
              : isGreen
              ? '#a7f3d0'
              : isTriangle
              ? '#bae6fd'
              : '#fbcfe8';

            const nextScore = scoreRef.current + value;
            scoreRef.current = nextScore;
            setScore(nextScore);

            const nextStagePoints = stagePointsRef.current + value;
            stagePointsRef.current = nextStagePoints;
            setStagePoints(nextStagePoints);

            if (nextScore > bestScoreRef.current) {
              bestScoreRef.current = nextScore;
              setBestScore(nextScore);
              setIsNewBest(true);
              try {
                window.localStorage.setItem(
                  BEST_SCORE_STORAGE_KEY,
                  String(nextScore)
                );
              } catch {
                // Ignore storage errors
              }
            }

            if (isGreen) {
              sim.speedBoostTimer = SPEED_BOOST_DURATION;
            }

            sim.playerBounce = 1;
            sim.playerGlowColor = color;
            sim.playerGlowAlpha = 1;

            spawnBurst(item.x, item.y, color, isGreen ? 18 : 14, isGreen ? 1.2 : 1);
            spawnBurst(item.x, item.y, '#ffffff', 5, 0.7);
            sim.floatingTexts.push({
              x: item.x,
              y: item.y - 10,
              vy: -56,
              text: isGreen
                ? langRef.current === 'ar'
                  ? `⚡ سرعة ×2 · مشية -50% · +${value}`
                  : `⚡ 2x World · -50% Move · +${value}`
                : `+${value}`,
              color: textColor,
              life: isGreen ? 0.95 : 0.65,
              maxLife: isGreen ? 0.95 : 0.65,
            });
            tryAwardPinkCoins(item.x, item.y);

            // Check stage completion (1 heart = +1 coin, 2 hearts = +2 coins, 3 hearts = +4 coins)
            const currentStageCfg =
              STAGES[Math.min(stageNumRef.current - 1, TOTAL_STAGES - 1)];

            if (nextStagePoints >= currentStageCfg.pointsNeeded) {
              const clearedStage = stageNumRef.current;
              const alreadyCompleted =
                completedStagesRef.current.includes(clearedStage);
              const earnedCoins = alreadyCompleted
                ? 0
                : getStageClearCoins(livesRef.current);
              setLastEarnedCoins(earnedCoins);
              if (earnedCoins > 0) {
                const nextCoins = coinsRef.current + earnedCoins;
                coinsRef.current = nextCoins;
                setCoins(nextCoins);
                try {
                  window.localStorage.setItem(
                    COINS_STORAGE_KEY,
                    String(nextCoins)
                  );
                } catch {
                  // Ignore storage errors
                }
              }

              if (!alreadyCompleted) {
                const updated = [...completedStagesRef.current, clearedStage];
                completedStagesRef.current = updated;
                setCompletedStages(updated);
                try {
                  window.localStorage.setItem(
                    COMPLETED_STAGES_STORAGE_KEY,
                    JSON.stringify(updated)
                  );
                } catch {
                  // Ignore storage errors
                }
              }

              sim.slowTimer = 0;
              sim.speedBoostTimer = 0;
              sim.input.pointerActive = false;
              sim.input.pointerId = null;
              sim.input.leftBtn = false;
              sim.input.rightBtn = false;

              if (clearedStage >= TOTAL_STAGES) {
                statusRef.current = 'VICTORY';
                setStatus('VICTORY');
                spawnBurst(sim.width * 0.35, sim.height * 0.4, '#f472b6', 20, 1.3);
                spawnBurst(sim.width * 0.65, sim.height * 0.4, '#38bdf8', 20, 1.3);
                audioRef.current.playVictory();
              } else {
                statusRef.current = 'STAGE_CLEAR';
                setStatus('STAGE_CLEAR');
                spawnBurst(sim.width * 0.35, sim.height * 0.42, '#f472b6', 16, 1.15);
                spawnBurst(sim.width * 0.65, sim.height * 0.42, '#38bdf8', 16, 1.15);
                audioRef.current.playStageUp();
              }
              streakRef.current = Math.min(streakRef.current + 1, 10);
              break;
            } else {
              if (isGreen) {
                audioRef.current.playSpeedBoost();
              } else {
                audioRef.current.playCatch(streakRef.current, isTriangle);
              }
              streakRef.current = Math.min(streakRef.current + 1, 10);
            }
          } else if (item.kind === 'hazard_star') {
            // Red Freeze Star: freezes player movement for 4 seconds AND awards +3 points
            const value = FREEZE_STAR_POINTS;
            const nextScore = scoreRef.current + value;
            scoreRef.current = nextScore;
            setScore(nextScore);

            const nextStagePoints = stagePointsRef.current + value;
            stagePointsRef.current = nextStagePoints;
            setStagePoints(nextStagePoints);

            if (nextScore > bestScoreRef.current) {
              bestScoreRef.current = nextScore;
              setBestScore(nextScore);
              setIsNewBest(true);
              try {
                window.localStorage.setItem(
                  BEST_SCORE_STORAGE_KEY,
                  String(nextScore)
                );
              } catch {
                // Ignore storage errors
              }
            }

            sim.freezeTimer = FREEZE_DURATION;
            sim.playerVx = 0;
            sim.playerBounce = 0.8;
            sim.playerGlowColor = '#7dd3fc';
            sim.playerGlowAlpha = 1;
            sim.shakeTimer = 0.2;
            sim.shakeIntensity = 6;

            spawnBurst(item.x, item.y, '#ef4444', 14, 1.05);
            spawnBurst(item.x, item.y, '#7dd3fc', 12, 1.0);
            sim.floatingTexts.push({
              x: item.x,
              y: item.y - 12,
              vy: -52,
              text:
                langRef.current === 'ar'
                  ? `❄ تجميد 4ث · +${value}`
                  : `❄ Freeze 4s · +${value}`,
              color: '#bae6fd',
              life: 0.95,
              maxLife: 0.95,
            });

            const currentStageCfg =
              STAGES[Math.min(stageNumRef.current - 1, TOTAL_STAGES - 1)];

            if (nextStagePoints >= currentStageCfg.pointsNeeded) {
              const clearedStage = stageNumRef.current;
              const alreadyCompleted =
                completedStagesRef.current.includes(clearedStage);
              const earnedCoins = alreadyCompleted
                ? 0
                : getStageClearCoins(livesRef.current);
              setLastEarnedCoins(earnedCoins);
              if (earnedCoins > 0) {
                const nextCoins = coinsRef.current + earnedCoins;
                coinsRef.current = nextCoins;
                setCoins(nextCoins);
                try {
                  window.localStorage.setItem(
                    COINS_STORAGE_KEY,
                    String(nextCoins)
                  );
                } catch {
                  // Ignore storage errors
                }
              }

              if (!alreadyCompleted) {
                const updated = [...completedStagesRef.current, clearedStage];
                completedStagesRef.current = updated;
                setCompletedStages(updated);
                try {
                  window.localStorage.setItem(
                    COMPLETED_STAGES_STORAGE_KEY,
                    JSON.stringify(updated)
                  );
                } catch {
                  // Ignore storage errors
                }
              }

              sim.freezeTimer = 0;
              sim.slowTimer = 0;
              sim.speedBoostTimer = 0;
              sim.input.pointerActive = false;
              sim.input.pointerId = null;
              sim.input.leftBtn = false;
              sim.input.rightBtn = false;

              if (clearedStage >= TOTAL_STAGES) {
                statusRef.current = 'VICTORY';
                setStatus('VICTORY');
                spawnBurst(sim.width * 0.35, sim.height * 0.4, '#f472b6', 20, 1.3);
                spawnBurst(sim.width * 0.65, sim.height * 0.4, '#38bdf8', 20, 1.3);
                audioRef.current.playVictory();
              } else {
                statusRef.current = 'STAGE_CLEAR';
                setStatus('STAGE_CLEAR');
                spawnBurst(sim.width * 0.35, sim.height * 0.42, '#f472b6', 16, 1.15);
                spawnBurst(sim.width * 0.65, sim.height * 0.42, '#38bdf8', 16, 1.15);
                audioRef.current.playStageUp();
              }
              break;
            } else {
              audioRef.current.playFreeze();
            }
          } else if (item.kind === 'hazard_arrow_amber') {
            // Mild Amber Slant Arrow: spares hearts, deducts only 2 stage points (blocked cleanly by active shield)
            if (sim.shieldTimer > 0) {
              sim.playerGlowColor = '#38bdf8';
              sim.playerGlowAlpha = 0.85;
              spawnBurst(item.x, item.y, '#7dd3fc', 14, 1.0);
              sim.floatingTexts.push({
                x: item.x,
                y: item.y - 12,
                vy: -50,
                text: langRef.current === 'ar' ? 'محمي!' : 'Shielded!',
                color: '#bae6fd',
                life: 0.72,
                maxLife: 0.72,
              });
              audioRef.current.playBuyHeart();
              continue;
            }
            const nextScore = Math.max(
              0,
              scoreRef.current - AMBER_ARROW_POINT_PENALTY
            );
            scoreRef.current = nextScore;
            setScore(nextScore);

            const nextStagePoints = Math.max(
              0,
              stagePointsRef.current - AMBER_ARROW_POINT_PENALTY
            );
            stagePointsRef.current = nextStagePoints;
            setStagePoints(nextStagePoints);

            streakRef.current = 0;
            sim.playerBounce = 0.55;
            sim.playerGlowColor = '#f59e0b';
            sim.playerGlowAlpha = 0.85;
            sim.shakeTimer = 0.14;
            sim.shakeIntensity = 3.5;

            spawnBurst(item.x, item.y, '#f59e0b', 14, 0.95);
            spawnBurst(item.x, item.y, '#fde68a', 6, 0.7);
            sim.floatingTexts.push({
              x: item.x,
              y: item.y - 12,
              vy: -50,
              text:
                langRef.current === 'ar'
                  ? `-${AMBER_ARROW_POINT_PENALTY} نقاط`
                  : `-${AMBER_ARROW_POINT_PENALTY} pts`,
              color: '#fde68a',
              life: 0.85,
              maxLife: 0.85,
            });
            audioRef.current.playHazardHit(false);
          } else if (item.kind === 'hazard_arrow_violet') {
            // Mild Violet Slow Arrow: spares hearts, gently slows (-30% for 2.5s) & deducts 1 point
            if (sim.shieldTimer > 0) {
              sim.playerGlowColor = '#38bdf8';
              sim.playerGlowAlpha = 0.85;
              spawnBurst(item.x, item.y, '#7dd3fc', 14, 1.0);
              sim.floatingTexts.push({
                x: item.x,
                y: item.y - 12,
                vy: -50,
                text: langRef.current === 'ar' ? 'محمي!' : 'Shielded!',
                color: '#bae6fd',
                life: 0.72,
                maxLife: 0.72,
              });
              audioRef.current.playBuyHeart();
              continue;
            }
            const nextScore = Math.max(
              0,
              scoreRef.current - VIOLET_ARROW_POINT_PENALTY
            );
            scoreRef.current = nextScore;
            setScore(nextScore);

            const nextStagePoints = Math.max(
              0,
              stagePointsRef.current - VIOLET_ARROW_POINT_PENALTY
            );
            stagePointsRef.current = nextStagePoints;
            setStagePoints(nextStagePoints);

            streakRef.current = 0;
            sim.slowTimer = VIOLET_ARROW_SLOW_DURATION;
            sim.playerBounce = 0.55;
            sim.playerGlowColor = '#c084fc';
            sim.playerGlowAlpha = 0.9;
            sim.shakeTimer = 0.14;
            sim.shakeIntensity = 3.5;

            spawnBurst(item.x, item.y, '#a855f7', 14, 0.95);
            spawnBurst(item.x, item.y, '#e9d5ff', 7, 0.75);
            sim.floatingTexts.push({
              x: item.x,
              y: item.y - 12,
              vy: -50,
              text:
                langRef.current === 'ar'
                  ? `تبطيء 2.5ث · -${VIOLET_ARROW_POINT_PENALTY}`
                  : `Slow 2.5s · -${VIOLET_ARROW_POINT_PENALTY}`,
              color: '#e9d5ff',
              life: 0.92,
              maxLife: 0.92,
            });
            audioRef.current.playHazardHit(false);
          } else {
            // Red hazard hit: spike = -1 life, red square = -2 lives
            const isHeavySquare = item.kind === 'hazard_square';
            const damage = isHeavySquare ? 2 : 1;

            // Active 2-second shield barrier blocks all red hazards cleanly without losing hearts
            if (sim.shieldTimer > 0) {
              sim.playerGlowColor = '#38bdf8';
              sim.playerGlowAlpha = 0.9;
              spawnBurst(item.x, item.y, '#7dd3fc', 16, 1.1);
              sim.floatingTexts.push({
                x: item.x,
                y: item.y - 12,
                vy: -50,
                text: langRef.current === 'ar' ? 'محمي!' : 'Shielded!',
                color: '#bae6fd',
                life: 0.75,
                maxLife: 0.75,
              });
              audioRef.current.playBuyHeart();
              continue;
            }

            if (sim.invulnTimer <= 0) {
              // Shop Shield auto-activates for 2 full seconds without losing hearts
              if (shopRef.current.shields > 0) {
                const nextShop: ShopState = {
                  ...shopRef.current,
                  shields: Math.max(0, shopRef.current.shields - 1),
                };
                shopRef.current = nextShop;
                setShop(nextShop);
                persistShopState(nextShop);

                sim.shieldTimer = SHIELD_DURATION;
                sim.playerGlowColor = '#38bdf8';
                sim.playerGlowAlpha = 1;
                spawnBurst(item.x, item.y, '#7dd3fc', 22, 1.25);
                sim.floatingTexts.push({
                  x: item.x,
                  y: item.y - 12,
                  vy: -52,
                  text:
                    langRef.current === 'ar'
                      ? `درع الحماية · ${SHIELD_DURATION}ث!`
                      : `Shield · ${SHIELD_DURATION}s!`,
                  color: '#bae6fd',
                  life: 0.95,
                  maxLife: 0.95,
                });
                audioRef.current.playBuyHeart();
                continue;
              }
              const prevLives = livesRef.current;
              const nextLives = Math.max(0, prevLives - damage);
              livesRef.current = nextLives;
              streakRef.current = 0;
              setLives(nextLives);
              if (prevLives >= MAX_LIVES && nextLives < MAX_LIVES) {
                lastHeartRegenAtRef.current = Date.now();
                setNextHeartInMs(HEART_REGEN_MS);
              }
              persistLivesState(nextLives, lastHeartRegenAtRef.current);

              sim.shakeTimer = isHeavySquare ? 0.32 : 0.24;
              sim.shakeIntensity = isHeavySquare ? 10 : 7;
              sim.hitFlashAlpha = isHeavySquare ? 0.44 : 0.32;
              sim.invulnTimer = 0.75;

              spawnBurst(
                item.x,
                item.y,
                isHeavySquare ? '#dc2626' : '#ef4444',
                isHeavySquare ? 24 : 18,
                isHeavySquare ? 1.35 : 1.15
              );
              spawnBurst(item.x, item.y, '#fca5a5', 8, 0.85);
              sim.floatingTexts.push({
                x: item.x,
                y: item.y - 12,
                vy: -50,
                text: `-${damage}`,
                color: '#fecaca',
                life: 0.82,
                maxLife: 0.82,
              });

              if (nextLives <= 0) {
                sim.slowTimer = 0;
                sim.speedBoostTimer = 0;
                statusRef.current = 'GAME_OVER';
                setStatus('GAME_OVER');
                audioRef.current.playGameOver();
                break;
              } else {
                audioRef.current.playHazardHit(isHeavySquare);
              }
            }
          }
        }
      }

      // Particles (accelerated with world speed during boost)
      for (let i = sim.particles.length - 1; i >= 0; i--) {
        const p = sim.particles[i];
        p.life -= simDt;
        if (p.life <= 0) {
          sim.particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * simDt;
        p.y += p.vy * simDt;
        p.vy += 280 * simDt;
        p.vx *= Math.exp(-2.5 * simDt);
        p.alpha = p.life / p.maxLife;
      }

      // Floating score / damage callouts
      for (let i = sim.floatingTexts.length - 1; i >= 0; i--) {
        const ft = sim.floatingTexts[i];
        ft.life -= dt;
        if (ft.life <= 0) {
          sim.floatingTexts.splice(i, 1);
          continue;
        }
        ft.y += ft.vy * simDt;
      }
    };

    const drawPinkCircle = (item: FallingItem) => {
      const r = item.radius * 1.06;
      const pulse = 1 + Math.sin(item.pulsePhase) * 0.045;

      ctx.save();
      ctx.translate(item.x, item.y);

      // Soft pink 3D ambient aura
      const glow = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, r * 2.05);
      glow.addColorStop(0, 'rgba(244, 114, 182, 0.46)');
      glow.addColorStop(1, 'rgba(244, 114, 182, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.05, 0, Math.PI * 2);
      ctx.fill();

      ctx.scale(pulse, pulse);

      // Subtle bottom-right drop shadow for 3D float depth
      ctx.beginPath();
      ctx.arc(r * 0.14, r * 0.22, r * 0.96, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2, 6, 23, 0.48)';
      ctx.fill();

      // 3D glossy pink sphere with off-center key light & deep core shadow
      const sphereGrad = ctx.createRadialGradient(
        -r * 0.36,
        -r * 0.38,
        r * 0.08,
        0,
        0,
        r * 1.08
      );
      sphereGrad.addColorStop(0, '#fdf2f8');
      sphereGrad.addColorStop(0.24, '#f472b6');
      sphereGrad.addColorStop(0.62, '#db2777');
      sphereGrad.addColorStop(0.92, '#831843');
      sphereGrad.addColorStop(1, '#500724');

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // Reflected bottom-right rim light (gives true spherical volume)
      const rimGrad = ctx.createRadialGradient(
        r * 0.45,
        r * 0.48,
        r * 0.05,
        r * 0.35,
        r * 0.38,
        r * 0.85
      );
      rimGrad.addColorStop(0, 'rgba(251, 207, 232, 0.48)');
      rimGrad.addColorStop(0.5, 'rgba(244, 114, 182, 0.12)');
      rimGrad.addColorStop(1, 'rgba(244, 114, 182, 0)');
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Crisp specular outer ring
      ctx.strokeStyle = 'rgba(252, 231, 243, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Angled glossy glass specular highlight (top-left)
      ctx.save();
      ctx.translate(-r * 0.34, -r * 0.36);
      ctx.rotate(-0.65);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.32, r * 0.16, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.fill();
      ctx.restore();

      // Embossed +3 value indicator with subtle shadow
      ctx.font = `800 ${Math.round(r * 0.9)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(80, 7, 36, 0.65)';
      ctx.fillText('3', 1, 2.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('3', 0, 1);

      ctx.restore();
    };

    const drawGreenCircle = (item: FallingItem) => {
      const r = item.radius * 1.08;
      const pulse = 1 + Math.sin(item.pulsePhase * 1.35) * 0.055;

      ctx.save();
      ctx.translate(item.x, item.y);

      // Vibrant emerald 3D turbo aura
      const glow = ctx.createRadialGradient(0, 0, r * 0.22, 0, 0, r * 2.2);
      glow.addColorStop(0, 'rgba(16, 185, 129, 0.56)');
      glow.addColorStop(0.55, 'rgba(52, 211, 153, 0.22)');
      glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.scale(pulse, pulse);

      // Rotating luminous speed ring orbiting the emerald 3D sphere
      ctx.save();
      ctx.rotate(item.rotation);
      ctx.strokeStyle = 'rgba(110, 231, 183, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.28, 0, Math.PI * 0.65);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.28, Math.PI, Math.PI * 1.65);
      ctx.stroke();
      ctx.restore();

      // Drop shadow for 3D float depth
      ctx.beginPath();
      ctx.arc(r * 0.14, r * 0.22, r * 0.96, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2, 6, 23, 0.48)';
      ctx.fill();

      // 3D glossy emerald sphere
      const sphereGrad = ctx.createRadialGradient(
        -r * 0.36,
        -r * 0.38,
        r * 0.08,
        0,
        0,
        r * 1.08
      );
      sphereGrad.addColorStop(0, '#ecfdf5');
      sphereGrad.addColorStop(0.24, '#34d399');
      sphereGrad.addColorStop(0.62, '#059669');
      sphereGrad.addColorStop(0.92, '#065f46');
      sphereGrad.addColorStop(1, '#022c22');

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // Reflected bottom-right rim light
      const rimGrad = ctx.createRadialGradient(
        r * 0.45,
        r * 0.48,
        r * 0.05,
        r * 0.35,
        r * 0.38,
        r * 0.85
      );
      rimGrad.addColorStop(0, 'rgba(167, 243, 208, 0.52)');
      rimGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.14)');
      rimGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Specular outer ring
      ctx.strokeStyle = 'rgba(209, 250, 229, 0.9)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Glossy top-left highlight
      ctx.save();
      ctx.translate(-r * 0.34, -r * 0.36);
      ctx.rotate(-0.65);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.32, r * 0.16, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.76)';
      ctx.fill();
      ctx.restore();

      // Embossed +2 value indicator
      ctx.font = `800 ${Math.round(r * 0.88)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(2, 44, 34, 0.72)';
      ctx.fillText('2', 1, 2.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('2', 0, 1);

      ctx.restore();
    };

    const drawBlueTriangle = (item: FallingItem) => {
      const r = item.radius * 1.08;
      const pulse = 1 + Math.sin(item.pulsePhase) * 0.045;
      const sway = Math.sin(item.pulsePhase * 0.6) * 0.08;
      const shimmerShift = Math.sin(item.pulsePhase * 0.8) * r * 0.08;

      ctx.save();
      ctx.translate(item.x, item.y);

      // Luminous sky-blue 3D crystal aura
      const glow = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, r * 2.1);
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.46)');
      glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(sway);
      ctx.scale(pulse, pulse);

      const topX = 0;
      const topY = -r * 1.18;
      const rightX = r * 1.14;
      const rightY = r * 0.88;
      const leftX = -r * 1.14;
      const leftY = r * 0.88;
      // Raised 3D pyramid apex shifted slightly toward light source
      const apexX = -r * 0.08 + shimmerShift;
      const apexY = r * 0.14;

      // Drop shadow beneath the 3D pyramid
      ctx.beginPath();
      ctx.moveTo(topX + r * 0.14, topY + r * 0.2);
      ctx.lineTo(rightX + r * 0.14, rightY + r * 0.2);
      ctx.lineTo(leftX + r * 0.14, leftY + r * 0.2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(2, 6, 23, 0.5)';
      ctx.fill();

      // Facet 1 (Left-Top Lit Face — brightest)
      const leftFacet = ctx.createLinearGradient(leftX, topY, apexX, rightY);
      leftFacet.addColorStop(0, '#e0f2fe');
      leftFacet.addColorStop(0.42, '#38bdf8');
      leftFacet.addColorStop(1, '#0284c7');
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(apexX, apexY);
      ctx.lineTo(leftX, leftY);
      ctx.closePath();
      ctx.fillStyle = leftFacet;
      ctx.fill();

      // Facet 2 (Right Shaded Face — medium-deep sapphire)
      const rightFacet = ctx.createLinearGradient(topX, topY, rightX, rightY);
      rightFacet.addColorStop(0, '#38bdf8');
      rightFacet.addColorStop(0.45, '#0369a1');
      rightFacet.addColorStop(1, '#0c4a6e');
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(rightX, rightY);
      ctx.lineTo(apexX, apexY);
      ctx.closePath();
      ctx.fillStyle = rightFacet;
      ctx.fill();

      // Facet 3 (Bottom Bevel Face — deep shadow with subtle cyan bounce)
      const bottomFacet = ctx.createLinearGradient(leftX, apexY, rightX, rightY);
      bottomFacet.addColorStop(0, '#075985');
      bottomFacet.addColorStop(0.55, '#0c4a6e');
      bottomFacet.addColorStop(1, '#082f49');
      ctx.beginPath();
      ctx.moveTo(leftX, leftY);
      ctx.lineTo(apexX, apexY);
      ctx.lineTo(rightX, rightY);
      ctx.closePath();
      ctx.fillStyle = bottomFacet;
      ctx.fill();

      // Crisp luminous internal 3D ridge lines meeting at the apex
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(apexX, apexY);
      ctx.lineTo(leftX, leftY);
      ctx.moveTo(apexX, apexY);
      ctx.lineTo(rightX, rightY);
      ctx.stroke();

      // Bright outer crystal bevel stroke
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(rightX, rightY);
      ctx.lineTo(leftX, leftY);
      ctx.closePath();
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Embossed +4 value indicator with subtle shadow
      ctx.font = `800 ${Math.round(r * 0.84)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(8, 47, 73, 0.78)';
      ctx.fillText('4', 1, r * 0.28 + 1.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('4', 0, r * 0.28);

      ctx.restore();
    };

    const drawPurpleDiamond = (item: FallingItem) => {
      const r = item.radius * 1.12;
      const pulse = 1 + Math.sin(item.pulsePhase * 1.2) * 0.06;

      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.scale(pulse, pulse);

      // Luminous royal violet aura
      const aura = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.8);
      aura.addColorStop(0, 'rgba(192, 132, 252, 0.58)');
      aura.addColorStop(0.55, 'rgba(147, 51, 234, 0.24)');
      aura.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // 3D drop shadow
      ctx.beginPath();
      ctx.moveTo(2, -r * 1.05 + 3);
      ctx.lineTo(r * 0.92 + 2, 3);
      ctx.lineTo(2, r * 1.05 + 3);
      ctx.lineTo(-r * 0.92 + 2, 3);
      ctx.closePath();
      ctx.fillStyle = 'rgba(2, 6, 23, 0.5)';
      ctx.fill();

      // Faceted crystal diamond body
      const topFacet = ctx.createLinearGradient(-r, -r, r, r);
      topFacet.addColorStop(0, '#f5d0fe');
      topFacet.addColorStop(0.42, '#c084fc');
      topFacet.addColorStop(1, '#7e22ce');
      ctx.fillStyle = topFacet;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.08);
      ctx.lineTo(r * 0.94, 0);
      ctx.lineTo(0, r * 1.08);
      ctx.lineTo(-r * 0.94, 0);
      ctx.closePath();
      ctx.fill();

      // Lower-right shaded facet
      ctx.fillStyle = 'rgba(88, 28, 135, 0.55)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r * 0.94, 0);
      ctx.lineTo(0, r * 1.08);
      ctx.closePath();
      ctx.fill();

      // Bright top-left crystal highlight facet
      ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.02);
      ctx.lineTo(-r * 0.86, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#f3e8ff';
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.08);
      ctx.lineTo(r * 0.94, 0);
      ctx.lineTo(0, r * 1.08);
      ctx.lineTo(-r * 0.94, 0);
      ctx.closePath();
      ctx.stroke();

      ctx.font = `800 ${Math.round(r * 0.84)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(59, 7, 100, 0.85)';
      ctx.fillText('5', 1, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('5', 0, 1);

      ctx.restore();
    };

    const drawGoldStar = (item: FallingItem) => {
      const r = item.radius * 1.15;
      const pulse = 1 + Math.sin(item.pulsePhase * 1.5) * 0.07;

      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.scale(pulse, pulse);

      // Radiant golden glow aura
      const aura = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.95);
      aura.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
      aura.addColorStop(0.5, 'rgba(251, 191, 36, 0.3)');
      aura.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.95, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.rotate(item.rotation);
      const spikes = 5;
      const outerR = r * 1.2;
      const innerR = r * 0.56;
      const verts: { x: number; y: number }[] = [];
      for (let i = 0; i < spikes * 2; i++) {
        const rad = i % 2 === 0 ? outerR : innerR;
        const ang = (i * Math.PI) / spikes - Math.PI / 2;
        verts.push({ x: Math.cos(ang) * rad, y: Math.sin(ang) * rad });
      }

      // 3D beveled gold facets
      for (let i = 0; i < verts.length; i++) {
        const curr = verts[i];
        const next = verts[(i + 1) % verts.length];
        const grad = ctx.createLinearGradient(0, 0, curr.x, curr.y);
        if (i % 2 === 0) {
          grad.addColorStop(0, '#fef9c3');
          grad.addColorStop(0.5, '#fbbf24');
          grad.addColorStop(1, '#d97706');
        } else {
          grad.addColorStop(0, '#fde047');
          grad.addColorStop(0.55, '#f59e0b');
          grad.addColorStop(1, '#92400e');
        }
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(curr.x, curr.y);
        ctx.lineTo(next.x, next.y);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.beginPath();
      verts.forEach((v, idx) => {
        if (idx === 0) ctx.moveTo(v.x, v.y);
        else ctx.lineTo(v.x, v.y);
      });
      ctx.closePath();
      ctx.strokeStyle = '#fef9c3';
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();

      ctx.font = `900 ${Math.round(r * 0.8)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(120, 53, 15, 0.9)';
      ctx.fillText('7', 1, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('7', 0, 1);

      ctx.restore();
    };

    const drawHazardSpike = (item: FallingItem) => {
      const r = item.radius * 1.04;
      const pulse = 1 + Math.sin(item.pulsePhase * 1.4) * 0.07;

      ctx.save();
      ctx.translate(item.x, item.y);

      // Pulsing danger halo
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + Math.sin(item.pulsePhase * 1.4) * 0.15})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.38 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Subtle 3D drop shadow
      ctx.beginPath();
      ctx.arc(r * 0.14, r * 0.22, r * 0.92, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2, 6, 23, 0.5)';
      ctx.fill();

      // 3D metallic-red rotating spikes
      ctx.save();
      ctx.rotate(item.rotation);
      const spikes = 8;
      const spikeGrad = ctx.createLinearGradient(-r, -r, r, r);
      spikeGrad.addColorStop(0, '#fca5a5');
      spikeGrad.addColorStop(0.35, '#ef4444');
      spikeGrad.addColorStop(0.75, '#991b1b');
      spikeGrad.addColorStop(1, '#450a0a');

      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const rad = i % 2 === 0 ? r * 1.24 : r * 0.72;
        const ang = (i * Math.PI) / spikes;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = spikeGrad;
      ctx.fill();
      ctx.strokeStyle = '#fecaca';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.restore();

      // 3D spherical crimson core mine
      const coreGrad = ctx.createRadialGradient(
        -r * 0.26,
        -r * 0.28,
        r * 0.06,
        0,
        0,
        r * 0.76
      );
      coreGrad.addColorStop(0, '#f87171');
      coreGrad.addColorStop(0.35, '#b91c1c');
      coreGrad.addColorStop(0.8, '#7f1d1d');
      coreGrad.addColorStop(1, '#450a0a');
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Tiny glossy specular dot on core
      ctx.beginPath();
      ctx.arc(-r * 0.26, -r * 0.28, r * 0.14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fill();

      ctx.font = `800 ${Math.round(r * 0.78)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(69, 10, 10, 0.8)';
      ctx.fillText('-1', 1, 2.2);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('-1', 0, 1);

      ctx.restore();
    };

    const drawHazardSquare = (item: FallingItem) => {
      const r = item.radius * 1.04;
      const size = r * 1.9;
      const half = size / 2;
      const bevel = size * 0.16;
      const pulse = 1 + Math.sin(item.pulsePhase * 1.6) * 0.055;

      ctx.save();
      ctx.translate(item.x, item.y);

      // Outer crimson warning square halo
      const haloSize = size * 1.24 * pulse;
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.36 + Math.sin(item.pulsePhase * 1.6) * 0.18})`;
      ctx.lineWidth = 1.8;
      drawRoundedRectPath(
        ctx,
        -haloSize / 2,
        -haloSize / 2,
        haloSize,
        haloSize,
        6
      );
      ctx.stroke();

      // 3D drop shadow behind block
      drawRoundedRectPath(ctx, -half + 3, -half + 4.5, size, size, 4);
      ctx.fillStyle = 'rgba(2, 6, 23, 0.56)';
      ctx.fill();

      // Base 3D beveled red cube faces
      // Top bevel (brightest)
      ctx.beginPath();
      ctx.moveTo(-half, -half);
      ctx.lineTo(half, -half);
      ctx.lineTo(half - bevel, -half + bevel);
      ctx.lineTo(-half + bevel, -half + bevel);
      ctx.closePath();
      ctx.fillStyle = '#f87171';
      ctx.fill();

      // Left bevel (lit)
      ctx.beginPath();
      ctx.moveTo(-half, -half);
      ctx.lineTo(-half + bevel, -half + bevel);
      ctx.lineTo(-half + bevel, half - bevel);
      ctx.lineTo(-half, half);
      ctx.closePath();
      ctx.fillStyle = '#dc2626';
      ctx.fill();

      // Right bevel (shaded)
      ctx.beginPath();
      ctx.moveTo(half, -half);
      ctx.lineTo(half, half);
      ctx.lineTo(half - bevel, half - bevel);
      ctx.lineTo(half - bevel, -half + bevel);
      ctx.closePath();
      ctx.fillStyle = '#7f1d1d';
      ctx.fill();

      // Bottom bevel (deepest shadow)
      ctx.beginPath();
      ctx.moveTo(-half, half);
      ctx.lineTo(-half + bevel, half - bevel);
      ctx.lineTo(half - bevel, half - bevel);
      ctx.lineTo(half, half);
      ctx.closePath();
      ctx.fillStyle = '#450a0a';
      ctx.fill();

      // Raised front 3D center face with subtle top-left sheen
      const innerSize = size - bevel * 2;
      const faceGrad = ctx.createLinearGradient(
        -innerSize / 2,
        -innerSize / 2,
        innerSize / 2,
        innerSize / 2
      );
      faceGrad.addColorStop(0, '#dc2626');
      faceGrad.addColorStop(0.55, '#991b1b');
      faceGrad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = faceGrad;
      ctx.fillRect(-innerSize / 2, -innerSize / 2, innerSize, innerSize);

      // Crisp specular highlight rim
      drawRoundedRectPath(ctx, -half, -half, size, size, 3);
      ctx.strokeStyle = 'rgba(254, 202, 202, 0.8)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Unmistakable embossed -2 label
      ctx.font = `800 ${Math.round(r * 0.86)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(69, 10, 10, 0.85)';
      ctx.fillText('-2', 1, 2.2);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('-2', 0, 1);

      ctx.restore();
    };

    const drawHazardStar = (item: FallingItem) => {
      const r = item.radius * 1.14;
      const pulse = 1 + Math.sin(item.pulsePhase * 1.5) * 0.06;

      ctx.save();
      ctx.translate(item.x, item.y);

      // Crimson + icy aura around the 3D freeze star
      const aura = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.0);
      aura.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
      aura.addColorStop(0.55, 'rgba(125, 211, 252, 0.24)');
      aura.addColorStop(1, 'rgba(125, 211, 252, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.scale(pulse, pulse);

      // Rotating 3D faceted 5-pointed crimson star
      ctx.save();
      ctx.rotate(item.rotation);

      const points = 5;
      const outerR = r * 1.24;
      const innerR = r * 0.54;
      const verts: { x: number; y: number }[] = [];
      for (let i = 0; i < points * 2; i++) {
        const rad = i % 2 === 0 ? outerR : innerR;
        const ang = (i * Math.PI) / points - Math.PI / 2;
        verts.push({ x: Math.cos(ang) * rad, y: Math.sin(ang) * rad });
      }

      // Drop shadow beneath star
      ctx.save();
      ctx.translate(2.5, 4);
      ctx.beginPath();
      verts.forEach((v, idx) => {
        if (idx === 0) ctx.moveTo(v.x, v.y);
        else ctx.lineTo(v.x, v.y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(2, 6, 23, 0.52)';
      ctx.fill();
      ctx.restore();

      // Draw 10 alternating lit/shaded 3D bevel facets meeting at center apex
      for (let i = 0; i < verts.length; i++) {
        const curr = verts[i];
        const next = verts[(i + 1) % verts.length];
        const isLitFacet = i % 2 === 0;
        const facetGrad = ctx.createLinearGradient(0, 0, curr.x, curr.y);
        if (isLitFacet) {
          facetGrad.addColorStop(0, '#fca5a5');
          facetGrad.addColorStop(0.45, '#ef4444');
          facetGrad.addColorStop(1, '#b91c1c');
        } else {
          facetGrad.addColorStop(0, '#dc2626');
          facetGrad.addColorStop(0.55, '#991b1b');
          facetGrad.addColorStop(1, '#450a0a');
        }
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(curr.x, curr.y);
        ctx.lineTo(next.x, next.y);
        ctx.closePath();
        ctx.fillStyle = facetGrad;
        ctx.fill();
      }

      // Crisp icy-crimson bevel outline
      ctx.beginPath();
      verts.forEach((v, idx) => {
        if (idx === 0) ctx.moveTo(v.x, v.y);
        else ctx.lineTo(v.x, v.y);
      });
      ctx.closePath();
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.restore();

      // Upright center frost +3 badge for instant readability
      ctx.font = `800 ${Math.round(r * 0.66)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(69, 10, 10, 0.85)';
      ctx.fillText('❄', 1, 1.5);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillText('❄', 0, 0.5);

      ctx.restore();
    };

    const drawHazardArrow = (item: FallingItem) => {
      const r = item.radius * 1.1;

      ctx.save();
      ctx.translate(item.x, item.y);

      // Fiery crimson slipstream trail streaking upward behind the blazing arrow
      const trailGrad = ctx.createLinearGradient(0, -r * 4.5, 0, r * 0.4);
      trailGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      trailGrad.addColorStop(0.55, 'rgba(239, 68, 68, 0.38)');
      trailGrad.addColorStop(1, 'rgba(252, 165, 165, 0.72)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.moveTo(-r * 0.42, -r * 0.4);
      ctx.lineTo(r * 0.42, -r * 0.4);
      ctx.lineTo(0, -r * 4.5);
      ctx.closePath();
      ctx.fill();

      // Intense crimson glow around arrowhead
      const glow = ctx.createRadialGradient(0, r * 0.35, r * 0.15, 0, r * 0.2, r * 1.9);
      glow.addColorStop(0, 'rgba(239, 68, 68, 0.62)');
      glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, r * 0.25, r * 1.9, 0, Math.PI * 2);
      ctx.fill();

      // Subtle 3D drop shadow
      ctx.save();
      ctx.translate(2.5, 3.5);
      ctx.beginPath();
      ctx.moveTo(0, r * 1.45);
      ctx.lineTo(r * 1.05, r * 0.1);
      ctx.lineTo(r * 0.38, r * 0.1);
      ctx.lineTo(r * 0.45, -r * 1.35);
      ctx.lineTo(0, -r * 0.98);
      ctx.lineTo(-r * 0.45, -r * 1.35);
      ctx.lineTo(-r * 0.38, r * 0.1);
      ctx.lineTo(-r * 1.05, r * 0.1);
      ctx.closePath();
      ctx.fillStyle = 'rgba(2, 6, 23, 0.54)';
      ctx.fill();
      ctx.restore();

      // Left lit 3D half of the crimson downward arrow
      const leftGrad = ctx.createLinearGradient(-r, -r * 1.3, 0, r * 1.45);
      leftGrad.addColorStop(0, '#fecaca');
      leftGrad.addColorStop(0.4, '#ef4444');
      leftGrad.addColorStop(1, '#dc2626');
      ctx.beginPath();
      ctx.moveTo(0, r * 1.45);
      ctx.lineTo(-r * 1.05, r * 0.1);
      ctx.lineTo(-r * 0.38, r * 0.1);
      ctx.lineTo(-r * 0.45, -r * 1.35);
      ctx.lineTo(0, -r * 0.98);
      ctx.closePath();
      ctx.fillStyle = leftGrad;
      ctx.fill();

      // Right shaded 3D half of the crimson downward arrow
      const rightGrad = ctx.createLinearGradient(0, -r * 1.3, r, r * 1.45);
      rightGrad.addColorStop(0, '#dc2626');
      rightGrad.addColorStop(0.55, '#991b1b');
      rightGrad.addColorStop(1, '#450a0a');
      ctx.beginPath();
      ctx.moveTo(0, r * 1.45);
      ctx.lineTo(r * 1.05, r * 0.1);
      ctx.lineTo(r * 0.38, r * 0.1);
      ctx.lineTo(r * 0.45, -r * 1.35);
      ctx.lineTo(0, -r * 0.98);
      ctx.closePath();
      ctx.fillStyle = rightGrad;
      ctx.fill();

      // Bright center 3D spine ridge
      ctx.strokeStyle = 'rgba(254, 226, 226, 0.9)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.95);
      ctx.lineTo(0, r * 1.4);
      ctx.stroke();

      // Sharp glowing outline
      ctx.beginPath();
      ctx.moveTo(0, r * 1.45);
      ctx.lineTo(r * 1.05, r * 0.1);
      ctx.lineTo(r * 0.38, r * 0.1);
      ctx.lineTo(r * 0.45, -r * 1.35);
      ctx.lineTo(0, -r * 0.98);
      ctx.lineTo(-r * 0.45, -r * 1.35);
      ctx.lineTo(-r * 0.38, r * 0.1);
      ctx.lineTo(-r * 1.05, r * 0.1);
      ctx.closePath();
      ctx.strokeStyle = '#fecaca';
      ctx.lineWidth = 1.4;
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.restore();
    };

    const drawHazardArrowAmber = (item: FallingItem) => {
      // Golden Slant Arrow: distinctive Twin-Winged Golden Dart / Spearhead
      const r = item.radius * 1.12;
      const slantAngle = Math.max(
        -0.44,
        Math.min(0.44, Math.atan2(-item.vx, Math.max(80, item.speed)))
      );

      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(slantAngle);

      // Twin golden shimmer slipstream ribbons
      const trailGrad = ctx.createLinearGradient(0, -r * 3.1, 0, r * 0.2);
      trailGrad.addColorStop(0, 'rgba(250, 204, 21, 0)');
      trailGrad.addColorStop(0.55, 'rgba(250, 204, 21, 0.34)');
      trailGrad.addColorStop(1, 'rgba(254, 249, 195, 0.72)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.moveTo(-r * 0.52, -r * 0.55);
      ctx.lineTo(-r * 0.14, -r * 0.55);
      ctx.lineTo(-r * 0.25, -r * 3.0);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(r * 0.52, -r * 0.55);
      ctx.lineTo(r * 0.14, -r * 0.55);
      ctx.lineTo(r * 0.25, -r * 3.0);
      ctx.closePath();
      ctx.fill();

      // Radiant golden aura
      const glow = ctx.createRadialGradient(0, r * 0.15, r * 0.12, 0, r * 0.1, r * 1.85);
      glow.addColorStop(0, 'rgba(250, 204, 21, 0.56)');
      glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, r * 0.1, r * 1.85, 0, Math.PI * 2);
      ctx.fill();

      // Swept falcon-wing double chevron blades
      const wingGrad = ctx.createLinearGradient(-r * 1.25, -r * 0.5, r * 1.25, r * 0.75);
      wingGrad.addColorStop(0, '#fef08a');
      wingGrad.addColorStop(0.5, '#eab308');
      wingGrad.addColorStop(1, '#a16207');
      ctx.fillStyle = wingGrad;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.92);
      ctx.lineTo(r * 1.28, -r * 0.12);
      ctx.lineTo(r * 0.96, -r * 0.56);
      ctx.lineTo(r * 0.28, r * 0.15);
      ctx.lineTo(0, -r * 0.22);
      ctx.lineTo(-r * 0.28, r * 0.15);
      ctx.lineTo(-r * 0.96, -r * 0.56);
      ctx.lineTo(-r * 1.28, -r * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fef9c3';
      ctx.lineWidth = 1.25;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Forked swallowtail golden tail fins
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.52);
      ctx.lineTo(r * 0.62, -r * 1.38);
      ctx.lineTo(r * 0.24, -r * 0.96);
      ctx.lineTo(0, -r * 1.15);
      ctx.lineTo(-r * 0.24, -r * 0.96);
      ctx.lineTo(-r * 0.62, -r * 1.38);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // Central faceted golden spearhead (lit left + shaded right)
      const spearLeft = ctx.createLinearGradient(-r * 0.45, -r * 1.0, 0, r * 1.56);
      spearLeft.addColorStop(0, '#fefce8');
      spearLeft.addColorStop(0.4, '#facc15');
      spearLeft.addColorStop(1, '#ca8a04');
      ctx.beginPath();
      ctx.moveTo(0, r * 1.56);
      ctx.lineTo(-r * 0.48, r * 0.46);
      ctx.lineTo(-r * 0.2, -r * 0.95);
      ctx.lineTo(0, -r * 0.78);
      ctx.closePath();
      ctx.fillStyle = spearLeft;
      ctx.fill();

      const spearRight = ctx.createLinearGradient(0, -r * 1.0, r * 0.45, r * 1.56);
      spearRight.addColorStop(0, '#eab308');
      spearRight.addColorStop(0.55, '#a16207');
      spearRight.addColorStop(1, '#713f12');
      ctx.beginPath();
      ctx.moveTo(0, r * 1.56);
      ctx.lineTo(r * 0.48, r * 0.46);
      ctx.lineTo(r * 0.2, -r * 0.95);
      ctx.lineTo(0, -r * 0.78);
      ctx.closePath();
      ctx.fillStyle = spearRight;
      ctx.fill();

      // Spearhead highlight outline & glowing collar gem
      ctx.beginPath();
      ctx.moveTo(0, r * 1.56);
      ctx.lineTo(r * 0.48, r * 0.46);
      ctx.lineTo(r * 0.2, -r * 0.95);
      ctx.lineTo(0, -r * 0.78);
      ctx.lineTo(-r * 0.2, -r * 0.95);
      ctx.lineTo(-r * 0.48, r * 0.46);
      ctx.closePath();
      ctx.strokeStyle = '#fef9c3';
      ctx.lineWidth = 1.3;
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -r * 0.14, r * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.restore();
    };

    const drawHazardArrowViolet = (item: FallingItem) => {
      // Violet Slow Arrow: distinctive Crescent-Blade Arcane Bolt
      const r = item.radius * 1.12;
      const pulse = 1 + Math.sin(item.pulsePhase * 1.5) * 0.045;

      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.scale(pulse, pulse);

      // Arcane mist trail
      const trailGrad = ctx.createLinearGradient(0, -r * 3.3, 0, r * 0.2);
      trailGrad.addColorStop(0, 'rgba(168, 85, 247, 0)');
      trailGrad.addColorStop(0.55, 'rgba(168, 85, 247, 0.32)');
      trailGrad.addColorStop(1, 'rgba(245, 208, 254, 0.7)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.moveTo(-r * 0.34, -r * 0.45);
      ctx.lineTo(r * 0.34, -r * 0.45);
      ctx.lineTo(0, -r * 3.3);
      ctx.closePath();
      ctx.fill();

      // Pulsing slow-field halo ring
      const glow = ctx.createRadialGradient(0, 0, r * 0.18, 0, 0, r * 1.9);
      glow.addColorStop(0, 'rgba(192, 132, 252, 0.58)');
      glow.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(233, 213, 255, 0.42)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, -r * 0.05, r * 0.78, 0, Math.PI * 2);
      ctx.stroke();

      // Sweeping curved crescent-moon guard blades
      const crescentGrad = ctx.createLinearGradient(-r * 1.25, -r * 0.3, r * 1.25, r * 0.85);
      crescentGrad.addColorStop(0, '#f5d0fe');
      crescentGrad.addColorStop(0.45, '#a855f7');
      crescentGrad.addColorStop(1, '#581c87');
      ctx.fillStyle = crescentGrad;
      ctx.beginPath();
      ctx.moveTo(-r * 1.24, -r * 0.18);
      ctx.quadraticCurveTo(0, r * 1.15, r * 1.24, -r * 0.18);
      ctx.quadraticCurveTo(0, r * 0.45, -r * 1.24, -r * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f3e8ff';
      ctx.lineWidth = 1.25;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Flared twin arcane tail plumes
      ctx.fillStyle = '#7e22ce';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.55);
      ctx.quadraticCurveTo(r * 0.78, -r * 0.92, r * 0.62, -r * 1.42);
      ctx.quadraticCurveTo(r * 0.2, -r * 1.05, 0, -r * 1.25);
      ctx.quadraticCurveTo(-r * 0.2, -r * 1.05, -r * 0.62, -r * 1.42);
      ctx.quadraticCurveTo(-r * 0.78, -r * 0.92, 0, -r * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d8b4fe';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // Crystal needle-lance shaft & sharp tip
      const lanceGrad = ctx.createLinearGradient(-r * 0.35, -r * 1.1, r * 0.35, r * 1.54);
      lanceGrad.addColorStop(0, '#faf5ff');
      lanceGrad.addColorStop(0.45, '#c084fc');
      lanceGrad.addColorStop(1, '#6b21a8');
      ctx.fillStyle = lanceGrad;
      ctx.beginPath();
      ctx.moveTo(0, r * 1.54);
      ctx.lineTo(r * 0.34, r * 0.52);
      ctx.lineTo(r * 0.18, -r * 1.15);
      ctx.lineTo(0, -r * 0.9);
      ctx.lineTo(-r * 0.18, -r * 1.15);
      ctx.lineTo(-r * 0.34, r * 0.52);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f5d0fe';
      ctx.lineWidth = 1.25;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Glowing amethyst diamond core
      ctx.beginPath();
      ctx.moveTo(0, r * 0.28);
      ctx.lineTo(r * 0.28, -r * 0.05);
      ctx.lineTo(0, -r * 0.38);
      ctx.lineTo(-r * 0.28, -r * 0.05);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      ctx.restore();
    };

    const drawPlayer = () => {
      const sim = simRef.current;
      if (sim.invulnTimer > 0 && Math.floor(sim.invulnTimer * 16) % 2 === 0) {
        return;
      }

      const w = sim.playerWidth;
      const h = sim.playerHeight;
      const halfW = w / 2;
      const halfH = h / 2;
      const isFrozen = sim.freezeTimer > 0;
      const isTurbo = sim.speedBoostTimer > 0 && !isFrozen;
      const tilt = isFrozen
        ? 0
        : Math.max(-0.14, Math.min(0.14, sim.playerVx / 3000));
      const scaleX = 1 + sim.playerBounce * 0.11;
      const scaleY = 1 - sim.playerBounce * 0.13;

      if (gameModeRef.current === 'gold') {
        drawGoldTreasureCatcher(
          ctx,
          sim.playerX,
          sim.playerY,
          w,
          h,
          tilt,
          scaleX,
          scaleY,
          sim.playerGlowColor,
          sim.playerGlowAlpha
        );
        drawCatcherShieldBubble(
          ctx,
          sim.playerX,
          sim.playerY,
          w,
          h,
          shopRef.current.shields,
          false,
          sim.shieldTimer
        );
        return;
      }

      if (gameModeRef.current === 'fruit') {
        drawFruitPearCatcher(
          ctx,
          sim.playerX,
          sim.playerY,
          w,
          h,
          tilt,
          scaleX,
          scaleY,
          sim.playerGlowColor,
          sim.playerGlowAlpha
        );
        drawCatcherShieldBubble(
          ctx,
          sim.playerX,
          sim.playerY,
          w,
          h,
          shopRef.current.shields,
          true,
          sim.shieldTimer
        );
        return;
      }

      const activeSkin = shopRef.current.equippedSkin;
      if (activeSkin === 'ufo') {
        drawUfoCatcher(
          ctx,
          sim.playerX,
          sim.playerY,
          w,
          h,
          tilt,
          scaleX,
          scaleY,
          isFrozen,
          isTurbo,
          sim.playerGlowColor,
          sim.playerGlowAlpha
        );
        drawCatcherShieldBubble(
          ctx,
          sim.playerX,
          sim.playerY,
          w,
          h,
          shopRef.current.shields,
          false,
          sim.shieldTimer
        );
        if (isFrozen) {
          ctx.save();
          ctx.translate(sim.playerX, sim.playerY);
          drawRoundedRectPath(ctx, -halfW - 6, -halfH - 9, w + 12, h + 16, 10);
          ctx.fillStyle = 'rgba(186, 230, 253, 0.32)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(224, 242, 254, 0.92)';
          ctx.lineWidth = 2.2;
          ctx.stroke();
          const freezeFrac = Math.max(0, Math.min(1, sim.freezeTimer / FREEZE_DURATION));
          const meterW = w * 0.9;
          const meterY = -halfH - 21;
          drawRoundedRectPath(ctx, -meterW / 2, meterY, meterW, 5, 2.5);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
          ctx.fill();
          drawRoundedRectPath(ctx, -meterW / 2, meterY, meterW * freezeFrac, 5, 2.5);
          ctx.fillStyle = '#7dd3fc';
          ctx.fill();
          ctx.fillStyle = '#e0f2fe';
          ctx.font = '700 12px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`❄ ${sim.freezeTimer.toFixed(1)}s`, 0, meterY - 3);
          ctx.restore();
        } else if (sim.slowTimer > 0) {
          ctx.save();
          ctx.translate(sim.playerX, sim.playerY);
          const slowFrac = Math.max(
            0,
            Math.min(1, sim.slowTimer / VIOLET_ARROW_SLOW_DURATION)
          );
          const meterW = w * 0.84;
          const meterY = -halfH - 19;
          drawRoundedRectPath(ctx, -meterW / 2, meterY, meterW, 4.5, 2.25);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
          ctx.fill();
          drawRoundedRectPath(ctx, -meterW / 2, meterY, meterW * slowFrac, 4.5, 2.25);
          ctx.fillStyle = '#c084fc';
          ctx.fill();
          ctx.fillStyle = '#f3e8ff';
          ctx.font = '700 11px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`▼ ${sim.slowTimer.toFixed(1)}s`, 0, meterY - 3);
          ctx.restore();
        }
        return;
      }

      const skinPal = getSkinPalette(activeSkin);
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * (isTurbo ? 0.018 : 0.008));
      const isCatchFlash = sim.playerGlowAlpha > 0.05;
      const accentColor = isFrozen
        ? '#bae6fd'
        : isCatchFlash
        ? sim.playerGlowColor
        : isTurbo
        ? '#34d399'
        : skinPal.accent;

      ctx.save();
      ctx.translate(sim.playerX, sim.playerY);
      ctx.rotate(tilt);
      ctx.scale(scaleX, scaleY);

      // Strong ambient aura so the catcher pops immediately against the dark arena
      const auraGrad = ctx.createRadialGradient(0, 0, 6, 0, 2, w * 0.92);
      auraGrad.addColorStop(
        0,
        isFrozen
          ? 'rgba(186, 230, 253, 0.65)'
          : isCatchFlash
          ? `${sim.playerGlowColor}99`
          : isTurbo
          ? 'rgba(16, 185, 129, 0.62)'
          : skinPal.aura0
      );
      auraGrad.addColorStop(
        0.55,
        isFrozen
          ? 'rgba(56, 189, 248, 0.25)'
          : isCatchFlash
          ? `${sim.playerGlowColor}33`
          : isTurbo
          ? 'rgba(16, 185, 129, 0.24)'
          : skinPal.auraMid
      );
      auraGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.ellipse(0, 2, w * 0.92, h * 1.65, 0, 0, Math.PI * 2);
      ctx.fill();

      // Upward energy catch-field beam right above the cradle lip
      const beamGrad = ctx.createLinearGradient(0, -halfH - 18, 0, -halfH + 2);
      beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      beamGrad.addColorStop(
        1,
        isCatchFlash
          ? `${sim.playerGlowColor}88`
          : isTurbo
          ? 'rgba(52, 211, 153, 0.55)'
          : skinPal.beam1
      );
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(-halfW + 10, -halfH - 14);
      ctx.lineTo(halfW - 10, -halfH - 14);
      ctx.lineTo(halfW - 4, -halfH + 2);
      ctx.lineTo(-halfW + 4, -halfH + 2);
      ctx.closePath();
      ctx.fill();

      // Dual animated thruster jets beneath the hull (extinguished while frozen; supercharged in 2x turbo)
      if (!isFrozen) {
        const thrusterLen =
          (isTurbo ? 15 : 8) + pulse * (isTurbo ? 9 : 5) + Math.min(5, Math.abs(sim.playerVx) / 140);
        for (const tx of [-halfW * 0.46, halfW * 0.46]) {
          const flameGrad = ctx.createLinearGradient(
            tx,
            halfH - 2,
            tx,
            halfH + thrusterLen
          );
          flameGrad.addColorStop(0, '#ffffff');
          flameGrad.addColorStop(0.4, isTurbo ? '#34d399' : skinPal.flameMid);
          flameGrad.addColorStop(1, isTurbo ? 'rgba(16, 185, 129, 0)' : skinPal.flameEnd);
          ctx.fillStyle = flameGrad;
          ctx.beginPath();
          ctx.moveTo(tx - 6, halfH - 2);
          ctx.lineTo(tx + 6, halfH - 2);
          ctx.lineTo(tx, halfH + thrusterLen);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Sculpted winged catcher cradle silhouette (raised left/right bumpers)
      ctx.beginPath();
      ctx.moveTo(-halfW, -halfH - 5);
      ctx.lineTo(-halfW + 11, -halfH - 5);
      ctx.lineTo(-halfW + 16, -halfH + 2);
      ctx.lineTo(halfW - 16, -halfH + 2);
      ctx.lineTo(halfW - 11, -halfH - 5);
      ctx.lineTo(halfW, -halfH - 5);
      ctx.quadraticCurveTo(halfW + 3, 2, halfW - 10, halfH);
      ctx.lineTo(-halfW + 10, halfH);
      ctx.quadraticCurveTo(-halfW - 3, 2, -halfW, -halfH - 5);
      ctx.closePath();

      const hullGrad = ctx.createLinearGradient(0, -halfH - 5, 0, halfH);
      hullGrad.addColorStop(0, skinPal.hullStops[0]);
      hullGrad.addColorStop(0.35, skinPal.hullStops[1]);
      hullGrad.addColorStop(0.7, skinPal.hullStops[2]);
      hullGrad.addColorStop(1, skinPal.hullStops[3]);
      ctx.fillStyle = hullGrad;
      ctx.fill();

      // Crisp high-contrast bright outline around entire catcher
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Dark inner cockpit band for crisp depth contrast
      drawRoundedRectPath(ctx, -halfW + 14, -halfH + 7, w - 28, h - 13, 6);
      ctx.fillStyle = skinPal.cockpit;
      ctx.fill();

      // Bright luminous catch bar along the top rim
      const barW = w - 24;
      drawRoundedRectPath(ctx, -barW / 2, -halfH + 1, barW, 5.5, 2.75);
      ctx.fillStyle = accentColor;
      ctx.fill();
      drawRoundedRectPath(ctx, -barW * 0.36, -halfH + 2, barW * 0.72, 2.2, 1.1);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Glowing center core jewel
      ctx.beginPath();
      ctx.arc(0, 2, 4.4, 0, Math.PI * 2);
      ctx.fillStyle = isFrozen
        ? '#bae6fd'
        : isCatchFlash
        ? sim.playerGlowColor
        : skinPal.core;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // High-visibility tip beacons on left & right wings so edges are unmistakable
      for (const tipX of [-halfW + 5.5, halfW - 5.5]) {
        ctx.beginPath();
        ctx.arc(tipX, -halfH - 1, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = isFrozen ? '#bae6fd' : skinPal.tip;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }

      // Crystalline ice block encasing the catcher while frozen + countdown meter
      if (isFrozen) {
        drawRoundedRectPath(ctx, -halfW - 6, -halfH - 9, w + 12, h + 16, 10);
        ctx.fillStyle = 'rgba(186, 230, 253, 0.32)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.92)';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Countdown progress bar & remaining seconds directly above frozen catcher
        const freezeFrac = Math.max(0, Math.min(1, sim.freezeTimer / FREEZE_DURATION));
        const meterW = w * 0.9;
        const meterY = -halfH - 21;
        drawRoundedRectPath(ctx, -meterW / 2, meterY, meterW, 5, 2.5);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fill();
        drawRoundedRectPath(ctx, -meterW / 2, meterY, meterW * freezeFrac, 5, 2.5);
        ctx.fillStyle = '#7dd3fc';
        ctx.fill();

        ctx.fillStyle = '#e0f2fe';
        ctx.font = '700 12px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`❄ ${sim.freezeTimer.toFixed(1)}s`, 0, meterY - 3);
      } else if (sim.slowTimer > 0) {
        const slowFrac = Math.max(
          0,
          Math.min(1, sim.slowTimer / VIOLET_ARROW_SLOW_DURATION)
        );
        const meterW = w * 0.84;
        const meterY = -halfH - 19;
        drawRoundedRectPath(ctx, -meterW / 2, meterY, meterW, 4.5, 2.25);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
        ctx.fill();
        drawRoundedRectPath(ctx, -meterW / 2, meterY, meterW * slowFrac, 4.5, 2.25);
        ctx.fillStyle = '#c084fc';
        ctx.fill();
        ctx.fillStyle = '#f3e8ff';
        ctx.font = '700 11px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`▼ ${sim.slowTimer.toFixed(1)}s`, 0, meterY - 3);
      }

      ctx.restore();

      drawCatcherShieldBubble(
        ctx,
        sim.playerX,
        sim.playerY,
        w,
        h,
        shopRef.current.shields,
        false,
        sim.shieldTimer
      );
    };

    const render = () => {
      const sim = simRef.current;
      const { width, height } = sim;

      ctx.save();

      if (sim.shakeTimer > 0) {
        const mag = sim.shakeIntensity * (sim.shakeTimer / 0.32);
        ctx.translate(
          (Math.random() - 0.5) * mag * 2,
          (Math.random() - 0.5) * mag * 1.4
        );
      }

      const isFruitRender = gameModeRef.current === 'fruit';
      const isGoldRender = gameModeRef.current === 'gold';
      const isSpeedBoost =
        !isFruitRender &&
        !isGoldRender &&
        sim.speedBoostTimer > 0 &&
        statusRef.current === 'PLAYING';

      if (isFruitRender) {
        drawFruitBackground(ctx, width, height, sim.fruitMotifs);
      } else if (isGoldRender) {
        drawGoldBackground(ctx, width, height, sim.goldMotifs);
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#070f1e');
        bgGrad.addColorStop(0.55, '#0b1629');
        bgGrad.addColorStop(1, '#101f38');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(-14, -14, width + 28, height + 28);

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.045)';
        ctx.lineWidth = 1;
        const gridStep = Math.max(48, Math.round(width / 12));
        ctx.beginPath();
        for (let gx = gridStep; gx < width; gx += gridStep) {
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, height);
        }
        for (let gy = gridStep; gy < height; gy += gridStep) {
          ctx.moveTo(0, gy);
          ctx.lineTo(width, gy);
        }
        ctx.stroke();

        for (const s of sim.stars) {
          ctx.fillStyle = isSpeedBoost
            ? `rgba(167, 243, 208, ${Math.min(0.85, s.alpha * 1.6)})`
            : `rgba(226, 232, 240, ${s.alpha})`;
          ctx.beginPath();
          if (isSpeedBoost) {
            ctx.fillRect(s.x - s.r * 0.5, s.y - s.r * 5, s.r, s.r * 9);
          } else {
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Subtle emerald turbo edge streaks during +100% (2x) speed boost
        if (isSpeedBoost) {
          const boostFade = Math.min(1, sim.speedBoostTimer / 0.4);
          const turboVignette = ctx.createRadialGradient(
            width / 2,
            height / 2,
            Math.min(width, height) * 0.32,
            width / 2,
            height / 2,
            Math.max(width, height) * 0.72
          );
          turboVignette.addColorStop(0, 'rgba(16, 185, 129, 0)');
          turboVignette.addColorStop(1, `rgba(16, 185, 129, ${0.18 * boostFade})`);
          ctx.fillStyle = turboVignette;
          ctx.fillRect(0, 0, width, height);
        }
      }

      const railY = sim.playerY + sim.playerHeight / 2 + 10;
      ctx.strokeStyle =
        isFruitRender || isGoldRender
          ? 'rgba(250, 204, 21, 0.28)'
          : 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, railY);
      ctx.lineTo(width - 20, railY);
      ctx.stroke();

      // Bright tracking highlight on the rail directly under the player
      const railGlow = ctx.createLinearGradient(
        sim.playerX - sim.playerWidth * 0.9,
        railY,
        sim.playerX + sim.playerWidth * 0.9,
        railY
      );
      railGlow.addColorStop(
        0,
        isFruitRender || isGoldRender
          ? 'rgba(250, 204, 21, 0)'
          : isSpeedBoost
          ? 'rgba(16, 185, 129, 0)'
          : 'rgba(56, 189, 248, 0)'
      );
      railGlow.addColorStop(
        0.5,
        isGoldRender
          ? 'rgba(251, 191, 36, 0.96)'
          : isFruitRender
          ? 'rgba(250, 204, 21, 0.92)'
          : isSpeedBoost
          ? 'rgba(52, 211, 153, 0.95)'
          : 'rgba(125, 211, 252, 0.95)'
      );
      railGlow.addColorStop(
        1,
        isFruitRender || isGoldRender
          ? 'rgba(250, 204, 21, 0)'
          : isSpeedBoost
          ? 'rgba(16, 185, 129, 0)'
          : 'rgba(56, 189, 248, 0)'
      );
      ctx.strokeStyle = railGlow;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(Math.max(20, sim.playerX - sim.playerWidth * 0.9), railY);
      ctx.lineTo(Math.min(width - 20, sim.playerX + sim.playerWidth * 0.9), railY);
      ctx.stroke();

      const activePlusSkin = shopRef.current.equippedPlusSkin;
      const activeMinusSkin = shopRef.current.equippedMinusSkin;

      for (const item of sim.items) {
        if (isFruitRender) {
          drawFruitCanvasItem(ctx, item as FruitRenderItem);
        } else if (isGoldRender) {
          drawGoldCanvasItem(ctx, item as GoldRenderItem);
        } else if (
          item.kind === 'pink_circle' ||
          item.kind === 'green_circle' ||
          item.kind === 'blue_triangle' ||
          item.kind === 'purple_diamond' ||
          item.kind === 'gold_star'
        ) {
          if (activePlusSkin !== 'classic') {
            drawCustomPlusPoint(ctx, item, activePlusSkin);
          } else if (item.kind === 'pink_circle') {
            drawPinkCircle(item);
          } else if (item.kind === 'green_circle') {
            drawGreenCircle(item);
          } else if (item.kind === 'purple_diamond') {
            drawPurpleDiamond(item);
          } else if (item.kind === 'gold_star') {
            drawGoldStar(item);
          } else {
            drawBlueTriangle(item);
          }
        } else if (activeMinusSkin !== 'classic') {
          drawCustomMinusPoint(ctx, item, activeMinusSkin);
        } else if (item.kind === 'hazard_square') {
          drawHazardSquare(item);
        } else if (item.kind === 'hazard_star') {
          drawHazardStar(item);
        } else if (item.kind === 'hazard_arrow') {
          drawHazardArrow(item);
        } else if (item.kind === 'hazard_arrow_amber') {
          drawHazardArrowAmber(item);
        } else if (item.kind === 'hazard_arrow_violet') {
          drawHazardArrowViolet(item);
        } else {
          drawHazardSpike(item);
        }
      }

      drawPlayer();

      for (const p of sim.particles) {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 17px "Segoe UI", system-ui, sans-serif';
      for (const ft of sim.floatingTexts) {
        const alpha = Math.max(0, ft.life / ft.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.globalAlpha = 1;

      // Non-blocking Stage Banner notification on stage transitions
      if (sim.stageBannerTimer > 0 && statusRef.current === 'PLAYING') {
        const fade = Math.min(1, sim.stageBannerTimer / 0.35);
        ctx.save();
        ctx.globalAlpha = fade;
        const bannerW = Math.min(240, width - 40);
        const bannerH = 54;
        const bx = (width - bannerW) / 2;
        const by = Math.max(24, height * 0.14);

        drawRoundedRectPath(ctx, bx, by, bannerW, bannerH, 10);
        ctx.fillStyle = 'rgba(15, 26, 46, 0.88)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 18px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sim.stageBannerText, width / 2, by + 20);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(sim.stageBannerSub, width / 2, by + 39);
        ctx.restore();
      }

      // Non-blocking 2x Speed Boost + 50% Slow Move Countdown Bar at top-center
      if (isSpeedBoost) {
        ctx.save();
        const barW = Math.min(256, width - 32);
        const barH = 30;
        const bx = (width - barW) / 2;
        const by = 14;
        const frac = Math.max(0, Math.min(1, sim.speedBoostTimer / SPEED_BOOST_DURATION));

        drawRoundedRectPath(ctx, bx, by, barW, barH, 8);
        ctx.fillStyle = 'rgba(6, 44, 34, 0.88)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Progress fill track at bottom of badge
        const trackX = bx + 10;
        const trackY = by + barH - 6.5;
        const trackW = barW - 20;
        drawRoundedRectPath(ctx, trackX, trackY, trackW, 3.5, 1.75);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fill();
        drawRoundedRectPath(ctx, trackX, trackY, trackW * frac, 3.5, 1.75);
        ctx.fillStyle = '#34d399';
        ctx.fill();

        ctx.fillStyle = '#d1fae5';
        ctx.font = '700 11.5px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label =
          langRef.current === 'ar'
            ? `⚡ سرعة ×2 · مشية -50% · ${sim.speedBoostTimer.toFixed(1)}ث`
            : `⚡ 2x WORLD · -50% MOVE · ${sim.speedBoostTimer.toFixed(1)}s`;
        ctx.fillText(label, width / 2, by + 12.5);
        ctx.restore();
      }

      if (sim.hitFlashAlpha > 0.01) {
        const hitGrad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          Math.min(width, height) * 0.25,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.72
        );
        hitGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
        hitGrad.addColorStop(1, `rgba(239, 68, 68, ${sim.hitFlashAlpha})`);
        ctx.fillStyle = hitGrad;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.restore();
    };

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      update(dt);
      render();
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (statusRef.current !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    simRef.current.input.pointerActive = true;
    simRef.current.input.pointerId = e.pointerId;
    simRef.current.input.pointerTargetX = e.clientX - rect.left;
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (statusRef.current !== 'PLAYING') return;
    if (
      !simRef.current.input.pointerActive ||
      simRef.current.input.pointerId !== e.pointerId
    ) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    simRef.current.input.pointerTargetX = e.clientX - rect.left;
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (simRef.current.input.pointerId === e.pointerId) {
      simRef.current.input.pointerActive = false;
      simRef.current.input.pointerId = null;
    }
  };

  const setLeftHold = (active: boolean) => {
    simRef.current.input.leftBtn = active;
    if (active) simRef.current.input.pointerActive = false;
  };

  const setRightHold = (active: boolean) => {
    simRef.current.input.rightBtn = active;
    if (active) simRef.current.input.pointerActive = false;
  };

  const anyModalOpen =
    stagesModalOpen ||
    indexModalOpen ||
    shopModalOpen ||
    bagModalOpen ||
    settingsModalOpen ||
    gamesModalOpen;
  const totalBagCount = bag.hearts + bag.corn + bag.diamonds;
  const positiveCatalog = INDEX_CATALOG.filter((e) => e.category === 'positive');
  const negativeCatalog = INDEX_CATALOG.filter((e) => e.category === 'negative');
  const activeIndexEntries =
    indexTab === 'positive' ? positiveCatalog : negativeCatalog;
  const positiveDiscoveredCount = positiveCatalog.filter((e) =>
    discoveredItems.includes(e.kind)
  ).length;
  const negativeDiscoveredCount = negativeCatalog.filter((e) =>
    discoveredItems.includes(e.kind)
  ).length;

  const fruitPositiveCatalog = FRUIT_INDEX_CATALOG.filter(
    (e) => e.category === 'positive'
  );
  const fruitNegativeCatalog = FRUIT_INDEX_CATALOG.filter(
    (e) => e.category === 'negative'
  );
  const activeFruitIndexEntries =
    indexTab === 'positive' ? fruitPositiveCatalog : fruitNegativeCatalog;
  const fruitPositiveDiscoveredCount = fruitPositiveCatalog.filter((e) =>
    discoveredFruitItems.includes(e.kind)
  ).length;
  const fruitNegativeDiscoveredCount = fruitNegativeCatalog.filter((e) =>
    discoveredFruitItems.includes(e.kind)
  ).length;

  const goldPositiveCatalog = GOLD_INDEX_CATALOG.filter(
    (e) => e.category === 'positive'
  );
  const goldNegativeCatalog = GOLD_INDEX_CATALOG.filter(
    (e) => e.category === 'negative'
  );
  const activeGoldIndexEntries =
    indexTab === 'positive' ? goldPositiveCatalog : goldNegativeCatalog;
  const goldPositiveDiscoveredCount = goldPositiveCatalog.filter((e) =>
    discoveredGoldItems.includes(e.kind)
  ).length;
  const goldNegativeDiscoveredCount = goldNegativeCatalog.filter((e) =>
    discoveredGoldItems.includes(e.kind)
  ).length;

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="h-[100dvh] w-full bg-[#070e1a] text-slate-100 flex flex-col overflow-hidden"
    >
      {/* Top HUD Bar — 2 compact rows on mobile & tablet (zero overlap), single spacious row on lg+ */}
      <header className="relative z-30 w-full border-b border-white/10 bg-[#0b1424]/95 shrink-0">
        <div className="mx-auto max-w-[1040px] px-3 sm:px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between lg:h-16 lg:gap-4">
          {/* Row 1 on <lg (Title + Controls); splits cleanly on lg+ via display:contents */}
          <div className="h-10 lg:h-auto flex items-center justify-between gap-1.5 lg:contents">
            {/* Title Wordmark */}
            <div className="text-xs sm:text-base lg:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 lg:order-1">
              {t.title}
            </div>

            {/* Utility Controls */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0 lg:order-3">
              {/* Compact Stages Navigation Button ("المراحل") */}
              <button
                type="button"
                onClick={openStagesModal}
                aria-expanded={stagesModalOpen}
                className={`h-7 lg:h-8 px-1.5 sm:px-2.5 inline-flex items-center justify-center gap-1 rounded-md border text-[11px] sm:text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 whitespace-nowrap shrink-0 cursor-pointer ${
                  stagesModalOpen
                    ? 'border-sky-400/60 bg-sky-500/20 text-sky-200'
                    : 'border-white/12 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                <span>{t.stagesBtn}</span>
              </button>

              {/* Games Button ("اللعاب") right next to Stages */}
              <button
                type="button"
                onClick={openGamesModal}
                aria-expanded={gamesModalOpen}
                className={`h-7 lg:h-8 px-1.5 sm:px-2.5 inline-flex items-center justify-center gap-1 rounded-md border text-[11px] sm:text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 whitespace-nowrap shrink-0 cursor-pointer ${
                  gamesModalOpen
                    ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200'
                    : 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-100'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="6" width="20" height="12" rx="4" />
                  <line x1="6" y1="12" x2="10" y2="12" />
                  <line x1="8" y1="10" x2="8" y2="14" />
                  <circle cx="15.5" cy="11" r="1" fill="currentColor" stroke="none" />
                  <circle cx="18" cy="13" r="1" fill="currentColor" stroke="none" />
                </svg>
                <span>{t.gamesBtn}</span>
              </button>

              {/* Shop Button ("المتجر") */}
              <button
                type="button"
                onClick={openShopModal}
                aria-expanded={shopModalOpen}
                className={`h-7 lg:h-8 px-1.5 sm:px-2.5 inline-flex items-center justify-center gap-1 rounded-md border text-[11px] sm:text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 whitespace-nowrap shrink-0 cursor-pointer ${
                  shopModalOpen
                    ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                    : 'border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 hover:text-amber-100'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>{t.shopBtn}</span>
              </button>

              {/* Bag Button ("الحقيبة") */}
              <button
                type="button"
                onClick={openBagModal}
                aria-expanded={bagModalOpen}
                className={`h-7 lg:h-8 px-1.5 sm:px-2.5 inline-flex items-center justify-center gap-1 rounded-md border text-[11px] sm:text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 whitespace-nowrap shrink-0 cursor-pointer ${
                  bagModalOpen
                    ? 'border-rose-400/60 bg-rose-500/20 text-rose-200'
                    : 'border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 hover:text-rose-100'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 10a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9z" />
                  <path d="M9 6V5a3 3 0 0 1 6 0v1" />
                  <path d="M9 13h6" />
                </svg>
                <span>{t.bagBtn}</span>
                {totalBagCount > 0 && (
                  <span className="font-num text-[10px] font-bold text-white">
                    ({totalBagCount})
                  </span>
                )}
              </button>

              {/* Index Button ("الاندكس") */}
              <button
                type="button"
                onClick={openIndexModal}
                aria-expanded={indexModalOpen}
                className={`h-7 lg:h-8 px-1.5 sm:px-2.5 inline-flex items-center justify-center gap-1 rounded-md border text-[11px] sm:text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 whitespace-nowrap shrink-0 cursor-pointer ${
                  indexModalOpen
                    ? 'border-sky-400/60 bg-sky-500/20 text-sky-200'
                    : 'border-white/12 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span>{t.indexBtn}</span>
              </button>

              {(status === 'PLAYING' || status === 'PAUSED') && !anyModalOpen && (
                <button
                  type="button"
                  onClick={togglePause}
                  aria-label={status === 'PAUSED' ? t.resume : t.pause}
                  title={status === 'PAUSED' ? t.resume : t.pause}
                  className="h-7 w-7 lg:h-8 lg:w-8 inline-flex items-center justify-center rounded-md border border-white/10 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer shrink-0"
                >
                  {status === 'PAUSED' ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
                    </svg>
                  )}
                </button>
              )}

              {/* Settings Button ("الإعدادات") */}
              <button
                type="button"
                onClick={openSettingsModal}
                aria-expanded={settingsModalOpen}
                aria-label={t.settingsBtn}
                className={`h-7 lg:h-8 px-1.5 sm:px-2.5 inline-flex items-center justify-center gap-1 rounded-md border text-[11px] sm:text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 whitespace-nowrap shrink-0 cursor-pointer ${
                  settingsModalOpen
                    ? 'border-sky-400/60 bg-sky-500/20 text-sky-200'
                    : 'border-white/12 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span className="hidden sm:inline">{t.settingsBtn}</span>
              </button>

              <button
                type="button"
                onClick={toggleLang}
                aria-label={t.langToggleAria}
                className="hidden sm:inline-flex h-7 lg:h-8 px-2.5 items-center justify-center rounded-md border border-white/10 bg-slate-900/80 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.langToggle}
              </button>
            </div>
          </div>

          {/* Row 2 on <lg (Dedicated Metrics Bar); middle section on lg+ */}
          <div
            className="h-9 lg:h-auto border-t border-white/5 lg:border-t-0 flex items-center justify-between lg:justify-center gap-2 sm:gap-3 lg:gap-4 min-w-0 lg:order-2"
            aria-live="polite"
          >
            {/* Stage Indicator */}
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-[11px] sm:text-xs text-slate-400">
                {t.stage}
              </span>
              <span
                className={`font-num text-xs sm:text-sm lg:text-base font-bold ${
                  isGoldMode
                    ? 'text-yellow-300'
                    : isFruitMode
                    ? 'text-amber-300'
                    : 'text-sky-300'
                }`}
              >
                {stageNum}/{activeTotalStages}
              </span>
            </div>

            <div className="h-3.5 sm:h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />

            {/* Stage Progress & Score */}
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-[11px] sm:text-xs lg:text-sm text-slate-400">
                {t.score}
              </span>
              <span className="font-num text-xs sm:text-sm lg:text-base font-bold text-white">
                {stagePoints}
              </span>
              <span className="font-num text-[11px] sm:text-xs text-slate-400">
                /{currentStageConfig.pointsNeeded}
              </span>
            </div>

            <div className="h-3.5 sm:h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />

            {/* Coins (الفلوس) */}
            <div
              className="flex items-center gap-1 whitespace-nowrap"
              aria-label={`${t.coins}: ${coins}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-amber-400 shrink-0"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9.5"
                  fill="currentColor"
                  stroke="#fef3c7"
                  strokeWidth="1.6"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="5.5"
                  fill="none"
                  stroke="#b45309"
                  strokeWidth="1.4"
                />
              </svg>
              <span className="font-num text-xs sm:text-sm lg:text-base font-bold text-amber-300">
                {coins}
              </span>
            </div>

            <div className="h-3.5 sm:h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />

            {/* Pink Coins (العملات الوردية) + Benefit Info */}
            <div className="relative flex items-center whitespace-nowrap">
              <button
                type="button"
                onClick={() => setPinkCoinInfoOpen((prev) => !prev)}
                aria-expanded={pinkCoinInfoOpen}
                aria-label={`${t.pinkCoins}: ${pinkCoins} — ${t.pinkCoinBenefitDesc}`}
                title={`${t.pinkCoinBenefitTitle}: ${t.pinkCoinBenefitDesc}`}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${
                  pinkCoinInfoOpen
                    ? 'border-pink-400/70 bg-pink-500/20'
                    : 'border-pink-400/30 bg-pink-500/10 hover:bg-pink-500/20'
                }`}
              >
                <PinkCoinIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4.5 lg:h-4.5 shrink-0" />
                <span className="font-num text-xs sm:text-sm lg:text-base font-bold text-pink-300">
                  {pinkCoins}
                </span>
                <span className="hidden md:inline text-[10px] font-semibold text-pink-200/90 border-s border-pink-400/30 ps-1">
                  {t.pinkCoinShortBenefit}
                </span>
                <span
                  aria-hidden="true"
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-pink-400/25 text-[9px] font-bold text-pink-100"
                >
                  ؟
                </span>
              </button>

              {pinkCoinInfoOpen && (
                <div
                  role="dialog"
                  aria-label={t.pinkCoinBenefitTitle}
                  className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-40 w-64 sm:w-72 p-3 rounded-xl border border-pink-400/45 bg-[#120d1f]/98 shadow-2xl whitespace-normal text-start"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <PinkCoinIcon className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold text-pink-200">
                        {t.pinkCoinBenefitTitle}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPinkCoinInfoOpen(false)}
                      aria-label={t.close}
                      className="text-slate-400 hover:text-white text-xs font-bold px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[11px] sm:text-xs text-pink-100/95 leading-relaxed">
                    {t.pinkCoinBenefitDesc}
                  </p>
                </div>
              )}
            </div>

            <div className="hidden xl:block h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />

            {/* Best Score (desktop HUD; also always shown in overlays) */}
            <div className="hidden xl:flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-sm text-slate-400">{t.best}</span>
              <span className="font-num text-base font-bold text-slate-200">
                {bestScore}
              </span>
            </div>

            <div className="h-3.5 sm:h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />

            {/* Lives (Hearts in Normal, Corn in Fruit, Diamonds in Gold) + live 5-min regen + buy button */}
            <div
              className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
              aria-label={`${
                isGoldMode ? t.diamondsLabel : isFruitMode ? t.cornLabel : t.lives
              }: ${activeLives}/${activeMaxLives}`}
            >
              {isGoldMode ? (
                <DiamondIcon
                  className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                    activeLives > 0 ? '' : 'opacity-40 grayscale'
                  }`}
                />
              ) : isFruitMode ? (
                <CornIcon
                  className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                    activeLives > 0 ? '' : 'opacity-40 grayscale'
                  }`}
                />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${
                    activeLives > 0 ? 'text-rose-500' : 'text-slate-600'
                  }`}
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              )}
              <span
                className={`font-num text-xs sm:text-sm lg:text-base font-bold ${
                  activeLives > 0
                    ? isGoldMode
                      ? 'text-sky-300'
                      : isFruitMode
                      ? 'text-amber-300'
                      : 'text-rose-300'
                    : 'text-slate-400'
                }`}
              >
                {activeLives}/{activeMaxLives}
              </span>
              {activeLives < activeMaxLives && (
                <span className="font-num text-[10px] sm:text-xs font-semibold text-sky-300 bg-sky-500/15 border border-sky-400/25 rounded px-1 py-0.5">
                  {formatCountdown(activeNextRegenMs)}
                </span>
              )}
              <button
                type="button"
                onClick={buyHeart}
                disabled={
                  activeLives >= activeMaxLives ||
                  activeLifeCurrencyBalance < activeLifeBuyCost
                }
                aria-label={
                  isGoldMode
                    ? t.buyDiamondAria
                    : isFruitMode
                    ? t.buyCornAria
                    : t.buyHeartAria
                }
                title={
                  activeLives >= activeMaxLives
                    ? isGoldMode
                      ? t.diamondsFullTip
                      : isFruitMode
                      ? t.cornFullTip
                      : t.heartsFullTip
                    : activeLifeCurrencyBalance < activeLifeBuyCost
                    ? isGoldMode
                      ? t.needCoinsDiamondTip
                      : isFruitMode
                      ? t.needCoinsCornTip
                      : t.needCoinsTip
                    : isGoldMode
                    ? t.buyDiamondAria
                    : isFruitMode
                    ? t.buyCornAria
                    : t.buyHeartAria
                }
                className={`h-6 px-1.5 inline-flex items-center justify-center gap-0.5 rounded border text-[10px] sm:text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 shrink-0 ${
                  activeLives < activeMaxLives &&
                  activeLifeCurrencyBalance >= activeLifeBuyCost
                    ? isGoldMode
                      ? 'border-pink-400/65 bg-pink-500/25 text-pink-200 hover:bg-pink-500/40 active:scale-95 cursor-pointer'
                      : 'border-amber-400/50 bg-amber-500/20 text-amber-200 hover:bg-amber-500/35 active:scale-95 cursor-pointer'
                    : 'border-white/10 bg-slate-900/70 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>+</span>
                <span className="font-num">{activeLifeBuyCost}</span>
                {isGoldMode ? (
                  <PinkCoinIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 shrink-0"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9.5"
                      fill="currentColor"
                      stroke="#fef3c7"
                      strokeWidth="1.6"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Thin Stage Progress Bar */}
        <div
          className="h-[3px] w-full bg-white/5 overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(stageProgressRatio * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t.stage}
        >
          <div
            className={`h-full transition-transform duration-150 origin-left rtl:origin-right ${
              isGoldMode
                ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-sky-400'
                : isFruitMode
                ? 'bg-gradient-to-r from-amber-400 via-lime-400 to-rose-400'
                : 'bg-gradient-to-r from-pink-400 to-sky-400'
            }`}
            style={{ transform: `scaleX(${stageProgressRatio})` }}
          />
        </div>
      </header>

      {/* Main Game Arena Container */}
      <main className="flex-1 min-h-0 w-full mx-auto max-w-[1040px] px-3 sm:px-6 py-3 sm:py-4 flex flex-col gap-3">
        <div
          ref={stageRef}
          className="relative flex-1 min-h-0 w-full rounded-xl overflow-hidden border border-white/10 bg-[#081120] shadow-2xl"
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerUp}
            className="block w-full h-full touch-none cursor-grab active:cursor-grabbing"
          />

          {/* Start Overlay */}
          {status === 'START' && !anyModalOpen && (
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-[#060c17]/74 backdrop-blur-[3px]">
              <div className="w-full max-w-md rounded-xl border border-white/12 bg-[#0f1a2e]/95 p-5 sm:p-8 text-center shadow-2xl">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2.5 text-balance">
                  {t.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-5">
                  {t.rule}
                </p>

                {/* Crisp 2x2 Visual Legend */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 py-3.5 mb-6 border-y border-white/10 text-xs sm:text-sm text-slate-200">
                  <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 shrink-0"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="#ec4899"
                        stroke="#fbcfe8"
                        strokeWidth="1.8"
                      />
                      <text
                        x="12"
                        y="16"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="700"
                      >
                        3
                      </text>
                    </svg>
                    <span>{t.pinkLegend}</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 shrink-0"
                      aria-hidden="true"
                    >
                      <polygon
                        points="12,2 22,20 2,20"
                        fill="#0284c7"
                        stroke="#bae6fd"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <text
                        x="12"
                        y="17.5"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="700"
                      >
                        4
                      </text>
                    </svg>
                    <span>{t.blueLegend}</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 shrink-0"
                      aria-hidden="true"
                    >
                      <polygon
                        points="12,1 14.8,6.2 20.5,4.5 18.2,10 23,12 18.2,14 20.5,19.5 14.8,17.8 12,23 9.2,17.8 3.5,19.5 5.8,14 1,12 5.8,10 3.5,4.5 9.2,6.2"
                        fill="#dc2626"
                      />
                      <text
                        x="12"
                        y="15.5"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="800"
                      >
                        -1
                      </text>
                    </svg>
                    <span>{t.spikeLegend}</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 shrink-0"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2.5"
                        fill="#b91c1c"
                        stroke="#fca5a5"
                        strokeWidth="1.8"
                      />
                      <text
                        x="12"
                        y="15.5"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9.5"
                        fontWeight="800"
                      >
                        -2
                      </text>
                    </svg>
                    <span>{t.squareLegend}</span>
                  </div>
                </div>

                {lives <= 0 && (
                  <p className="text-xs sm:text-sm font-semibold text-rose-300 mb-3">
                    {t.noHeartsNotice(formatCountdown(nextHeartInMs))}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  {lives <= 0 && (
                    <button
                      type="button"
                      disabled={coins < HEART_COST_COINS}
                      onClick={buyHeart}
                      className={`w-full sm:w-auto px-5 py-3.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 whitespace-nowrap ${
                        coins >= HEART_COST_COINS
                          ? 'bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                      }`}
                    >
                      {t.buyHeartBtn}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={lives <= 0}
                    onClick={resetAndStartGame}
                    className={`w-full sm:w-auto min-w-[200px] px-8 py-3.5 rounded-lg font-bold text-base transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1a2e] whitespace-nowrap ${
                      lives <= 0
                        ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
                        : 'bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-slate-950 cursor-pointer'
                    }`}
                  >
                    {lives <= 0
                      ? t.waitHeartBtn(formatCountdown(nextHeartInMs))
                      : t.startBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pause Overlay */}
          {status === 'PAUSED' && !anyModalOpen && (
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-[#060c17]/75 backdrop-blur-[3px]">
              <div className="w-full max-w-sm rounded-xl border border-white/12 bg-[#0f1a2e]/95 p-6 sm:p-7 text-center shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {t.paused}
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={togglePause}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-slate-950 font-bold text-sm sm:text-base transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 whitespace-nowrap cursor-pointer"
                  >
                    {t.resumeBtn}
                  </button>
                  <button
                    type="button"
                    onClick={retryCurrentStage}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg border border-white/15 bg-slate-800/80 hover:bg-slate-700 text-slate-100 font-semibold text-sm sm:text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 whitespace-nowrap cursor-pointer"
                  >
                    {t.restartBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stage Clear Overlay with Coin Reward & Next Stage Button */}
          {status === 'STAGE_CLEAR' && !anyModalOpen && (
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-[#060c17]/76 backdrop-blur-[3px]">
              <div
                className={`w-full max-w-md rounded-xl border bg-[#0f1a2e]/95 p-6 sm:p-8 text-center shadow-2xl ${
                  isGoldMode
                    ? 'border-yellow-400/40'
                    : isFruitMode
                    ? 'border-amber-400/30'
                    : 'border-sky-400/25'
                }`}
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-balance">
                  {isGoldMode
                    ? t.goldStageCompleteTitle(stageNum)
                    : isFruitMode
                    ? t.fruitStageCompleteTitle(stageNum)
                    : t.stageCompleteTitle(stageNum)}
                </h2>
                <p
                  className={`text-sm sm:text-base font-bold mb-1.5 ${
                    lastEarnedCoins > 0 ? 'text-amber-300' : 'text-slate-400'
                  }`}
                >
                  {isGoldMode
                    ? t.goldCoinsEarned(lastEarnedCoins, diamonds)
                    : isFruitMode
                    ? t.fruitCoinsEarned(lastEarnedCoins, corn)
                    : t.coinsEarned(lastEarnedCoins, lives)}
                </p>
                <p className="text-xs sm:text-sm text-sky-300 font-medium mb-5">
                  {t.nextGoalText(nextStageConfig.pointsNeeded)}
                </p>

                <div className="grid grid-cols-3 divide-x divide-white/10 rtl:divide-x-reverse py-4 mb-6 border-y border-white/10">
                  <div className="px-2">
                    <div className="text-xs text-slate-400 mb-1">
                      {t.score}
                    </div>
                    <div className="font-num text-2xl sm:text-3xl font-bold text-white">
                      {score}
                    </div>
                  </div>
                  <div className="px-2">
                    <div className="text-xs text-slate-400 mb-1">
                      {t.coins}
                    </div>
                    <div className="font-num text-2xl sm:text-3xl font-bold text-amber-300">
                      {coins}
                    </div>
                  </div>
                  <div className="px-2">
                    <div className="text-xs text-slate-400 mb-1">
                      {isGoldMode
                        ? t.diamondsLabel
                        : isFruitMode
                        ? t.cornLabel
                        : t.lives}
                    </div>
                    <div
                      className={`font-num text-2xl sm:text-3xl font-bold ${
                        isGoldMode
                          ? 'text-sky-300'
                          : isFruitMode
                          ? 'text-amber-300'
                          : 'text-rose-400'
                      }`}
                    >
                      {activeLives}/{activeMaxLives}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={activeLives <= 0}
                  onClick={proceedToNextStage}
                  className={`w-full sm:w-auto min-w-[220px] px-8 py-3.5 rounded-lg font-bold text-base transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1a2e] whitespace-nowrap ${
                    activeLives <= 0
                      ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
                      : isGoldMode
                      ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-sky-400 hover:brightness-110 active:scale-[0.98] text-slate-950 cursor-pointer'
                      : isFruitMode
                      ? 'bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 cursor-pointer'
                      : 'bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-slate-950 cursor-pointer'
                  }`}
                >
                  {activeLives <= 0
                    ? isGoldMode
                      ? t.waitDiamondBtn(formatCountdown(activeNextRegenMs))
                      : isFruitMode
                      ? t.waitCornBtn(formatCountdown(activeNextRegenMs))
                      : t.waitHeartBtn(formatCountdown(activeNextRegenMs))
                    : isGoldMode
                    ? t.goldNextStageBtn(stageNum + 1)
                    : isFruitMode
                    ? t.fruitNextStageBtn(stageNum + 1)
                    : t.nextStageBtn(stageNum + 1)}
                </button>
              </div>
            </div>
          )}

          {/* Game Over / Victory Overlay */}
          {(status === 'GAME_OVER' || status === 'VICTORY') && !anyModalOpen && (
              <div className="absolute inset-0 flex items-center justify-center p-4 bg-[#060c17]/78 backdrop-blur-[3px]">
                <div
                  className={`w-full max-w-md rounded-xl border bg-[#0f1a2e]/95 p-6 sm:p-8 text-center shadow-2xl ${
                    isGoldMode ? 'border-yellow-400/35' : 'border-white/12'
                  }`}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-balance">
                    {status === 'VICTORY'
                      ? isGoldMode
                        ? t.goldVictoryTitle
                        : isFruitMode
                        ? t.fruitVictoryTitle
                        : t.victoryTitle
                      : t.gameOver}
                  </h2>

                  {status === 'VICTORY' ? (
                    <>
                      <p
                        className={`text-sm font-bold mb-1 ${
                          lastEarnedCoins > 0 ? 'text-amber-300' : 'text-slate-400'
                        }`}
                      >
                        {isGoldMode
                          ? t.goldCoinsEarned(lastEarnedCoins, diamonds)
                          : isFruitMode
                          ? t.fruitCoinsEarned(lastEarnedCoins, corn)
                          : t.coinsEarned(lastEarnedCoins, lives)}
                      </p>
                      <p className="text-sm font-medium text-emerald-300 mb-3">
                        {isGoldMode
                          ? t.goldVictorySubtitle
                          : isFruitMode
                          ? t.fruitVictorySubtitle
                          : t.victorySubtitle}
                      </p>
                    </>
                  ) : (
                    isNewBest &&
                    score > 0 && (
                      <p className="text-sm font-semibold text-amber-300 mb-3">
                        {t.newBest}
                      </p>
                    )
                  )}

                  <div className="grid grid-cols-3 divide-x divide-white/10 rtl:divide-x-reverse py-4 my-5 border-y border-white/10">
                    <div className="px-2">
                      <div className="text-xs text-slate-400 mb-1">
                        {t.finalScore}
                      </div>
                      <div className="font-num text-2xl sm:text-3xl font-bold text-white">
                        {score}
                      </div>
                    </div>
                    <div className="px-2">
                      <div className="text-xs text-slate-400 mb-1">
                        {t.coins}
                      </div>
                      <div className="font-num text-2xl sm:text-3xl font-bold text-amber-300">
                        {coins}
                      </div>
                    </div>
                    <div className="px-2">
                      <div className="text-xs text-slate-400 mb-1">
                        {t.stage}
                      </div>
                      <div
                        className={`font-num text-2xl sm:text-3xl font-bold ${
                          isGoldMode
                            ? 'text-yellow-300'
                            : isFruitMode
                            ? 'text-amber-300'
                            : 'text-sky-300'
                        }`}
                      >
                        {stageNum}/{activeTotalStages}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 mb-5">
                    {t.bestFull}:{' '}
                    <span className="font-num font-bold text-slate-200">
                      {bestScore}
                    </span>
                  </div>

                  {activeLives <= 0 && (
                    <p className="text-xs sm:text-sm font-semibold text-rose-300 mb-3">
                      {isGoldMode
                        ? t.noDiamondsNotice(formatCountdown(activeNextRegenMs))
                        : isFruitMode
                        ? t.noCornNotice(formatCountdown(activeNextRegenMs))
                        : t.noHeartsNotice(formatCountdown(activeNextRegenMs))}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    {activeLives <= 0 && (
                      <button
                        type="button"
                        disabled={activeLifeCurrencyBalance < activeLifeBuyCost}
                        onClick={buyHeart}
                        className={`w-full sm:w-auto px-5 py-3.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 whitespace-nowrap ${
                          activeLifeCurrencyBalance >= activeLifeBuyCost
                            ? isGoldMode
                              ? 'bg-pink-400 hover:bg-pink-300 active:scale-[0.98] text-slate-950 cursor-pointer'
                              : 'bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                        }`}
                      >
                        {isGoldMode
                          ? t.buyDiamondBtn
                          : isFruitMode
                          ? t.buyCornBtn
                          : t.buyHeartBtn}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={activeLives <= 0}
                      onClick={
                        status === 'GAME_OVER'
                          ? retryCurrentStage
                          : resetAndStartGame
                      }
                      className={`w-full sm:w-auto min-w-[200px] px-8 py-3.5 rounded-lg font-bold text-base transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1a2e] whitespace-nowrap ${
                        activeLives <= 0
                          ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
                          : isGoldMode
                          ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-sky-400 hover:brightness-110 active:scale-[0.98] text-slate-950 cursor-pointer'
                          : isFruitMode
                          ? 'bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 cursor-pointer'
                          : 'bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-slate-950 cursor-pointer'
                      }`}
                    >
                      {activeLives <= 0
                        ? isGoldMode
                          ? t.waitDiamondBtn(formatCountdown(activeNextRegenMs))
                          : isFruitMode
                          ? t.waitCornBtn(formatCountdown(activeNextRegenMs))
                          : t.waitHeartBtn(formatCountdown(activeNextRegenMs))
                        : t.playAgainBtn}
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* Stages Selector Overlay ("المراحل") — Normal Stages (50) + Fruit Stages (15, 32-coin unlock) */}
          {stagesModalOpen && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5 bg-[#060c17]/82 backdrop-blur-[4px]">
              <div className="w-full max-w-lg max-h-full flex flex-col rounded-xl border border-white/14 bg-[#0f1a2e]/98 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
                      {t.stagesModalTitle}
                    </h2>
                    <span className="text-xs sm:text-sm text-amber-300 font-semibold font-num whitespace-nowrap">
                      · {coins} {t.coins}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={closeStagesModal}
                    aria-label={t.close}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer shrink-0"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="px-5 pt-3.5 pb-5 overflow-y-auto">
                  {/* World Tabs inside Stages Modal: Normal (50) | Fruit (15) | Gold (15) */}
                  <div
                    role="tablist"
                    aria-label={t.stagesModalTitle}
                    className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-slate-950/75 border border-white/10 mb-3.5"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={stagesModalTab === 'normal'}
                      onClick={() => setStagesModalTab('normal')}
                      className={`h-10 px-2 rounded-md inline-flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 whitespace-nowrap cursor-pointer ${
                        stagesModalTab === 'normal'
                          ? 'bg-sky-500 text-slate-950'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <span>{t.normalWorldLabel}</span>
                      <span
                        className={`font-num text-[10px] sm:text-[11px] ${
                          stagesModalTab === 'normal'
                            ? 'text-slate-900'
                            : 'text-slate-400'
                        }`}
                      >
                        ({TOTAL_STAGES})
                      </span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={stagesModalTab === 'fruit'}
                      onClick={() => setStagesModalTab('fruit')}
                      className={`h-10 px-2 rounded-md inline-flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 whitespace-nowrap cursor-pointer ${
                        stagesModalTab === 'fruit'
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-amber-200 hover:text-white hover:bg-amber-500/15'
                      }`}
                    >
                      <span>{t.fruitWorldLabel}</span>
                      {!fruitUnlocked ? (
                        <span
                          className={`font-num text-[10px] inline-flex items-center gap-0.5 px-1 py-0.5 rounded ${
                            stagesModalTab === 'fruit'
                              ? 'bg-slate-950/20 text-slate-950'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="w-2.5 h-2.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect x="5" y="11" width="14" height="10" rx="2" />
                            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                          </svg>
                          {FRUIT_UNLOCK_COST}
                        </span>
                      ) : (
                        <span
                          className={`font-num text-[10px] sm:text-[11px] ${
                            stagesModalTab === 'fruit'
                              ? 'text-slate-900'
                              : 'text-amber-300/80'
                          }`}
                        >
                          ({TOTAL_FRUIT_STAGES})
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={stagesModalTab === 'gold'}
                      onClick={() => setStagesModalTab('gold')}
                      className={`h-10 px-2 rounded-md inline-flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 whitespace-nowrap cursor-pointer ${
                        stagesModalTab === 'gold'
                          ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-sky-400 text-slate-950'
                          : 'text-yellow-200 hover:text-white hover:bg-yellow-500/15'
                      }`}
                    >
                      <span>{t.goldWorldLabel}</span>
                      {!goldUnlocked ? (
                        <span
                          className={`font-num text-[10px] inline-flex items-center gap-0.5 px-1 py-0.5 rounded ${
                            stagesModalTab === 'gold'
                              ? 'bg-slate-950/20 text-slate-950'
                              : 'bg-yellow-400/20 text-yellow-300'
                          }`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="w-2.5 h-2.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect x="5" y="11" width="14" height="10" rx="2" />
                            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                          </svg>
                          {GOLD_UNLOCK_COST}
                        </span>
                      ) : (
                        <span
                          className={`font-num text-[10px] sm:text-[11px] ${
                            stagesModalTab === 'gold'
                              ? 'text-slate-950/85'
                              : 'text-sky-300/90'
                          }`}
                        >
                          ({TOTAL_GOLD_STAGES})
                        </span>
                      )}
                    </button>
                  </div>

                  {stagesModalTab === 'normal' ? (
                    <>
                      <p className="text-xs sm:text-sm text-slate-300 mb-3">
                        {t.stagesModalHint}
                      </p>
                      {lives <= 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 p-2.5 rounded-lg border border-rose-400/25 bg-rose-500/10">
                          <p className="text-xs sm:text-sm font-semibold text-rose-300">
                            {t.noHeartsNotice(formatCountdown(nextHeartInMs))}
                          </p>
                          <button
                            type="button"
                            disabled={coins < HEART_COST_COINS}
                            onClick={() => buyLifeForMode('normal')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
                              coins >= HEART_COST_COINS
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {t.buyHeartBtn}
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                        {STAGES.map((cfg) => {
                          const isCurrent =
                            !isFruitMode &&
                            !isGoldMode &&
                            cfg.stage === stageNum;
                          const isCompleted = completedStages.includes(cfg.stage);
                          const unlocked = isStageUnlocked(cfg.stage, completedStages);
                          const canEnter = unlocked && lives > 0;
                          return (
                            <button
                              key={cfg.stage}
                              type="button"
                              disabled={!canEnter}
                              aria-label={
                                unlocked
                                  ? `${t.stageBanner(cfg.stage)} — ${cfg.pointsNeeded} ${t.ptsShort}`
                                  : t.lockedStageAria(cfg.stage)
                              }
                              onClick={() => {
                                if (canEnter) startAtStage(cfg.stage, 'normal');
                              }}
                              className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-lg border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                                !unlocked
                                  ? 'border-white/5 bg-slate-950/70 text-slate-500 opacity-65 cursor-not-allowed'
                                  : isCurrent
                                  ? 'border-sky-400 bg-sky-500/20 text-white cursor-pointer'
                                  : isCompleted
                                  ? 'border-emerald-400/35 bg-emerald-500/10 text-slate-100 hover:bg-emerald-500/20 cursor-pointer'
                                  : 'border-white/12 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:border-white/25 cursor-pointer'
                              }`}
                            >
                              {!unlocked ? (
                                <span
                                  className="absolute top-1.5 end-1.5 text-slate-500"
                                  aria-hidden="true"
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <rect x="5" y="11" width="14" height="10" rx="2" />
                                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                                  </svg>
                                </span>
                              ) : (
                                isCompleted && (
                                  <span
                                    className="absolute top-1.5 end-1.5 text-emerald-400"
                                    aria-hidden="true"
                                  >
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="w-3.5 h-3.5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  </span>
                                )
                              )}
                              <span className="font-num text-base sm:text-lg font-bold">
                                {cfg.stage}
                              </span>
                              <span
                                className={`font-num text-[11px] whitespace-nowrap ${
                                  unlocked ? 'text-slate-400' : 'text-slate-600'
                                }`}
                              >
                                {cfg.pointsNeeded} {t.ptsShort}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : stagesModalTab === 'gold' ? (
                    !goldUnlocked ? (
                      <div className="rounded-xl border border-yellow-400/35 bg-gradient-to-b from-[#332208]/90 via-[#1b150a]/95 to-[#0c1624]/95 p-5 text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <GoldIndexIcon kind="gold_coin" />
                          <GoldIndexIcon kind="gold_bar" />
                          <GoldIndexIcon kind="gold_crown" />
                          <GoldIndexIcon kind="blue_diamond" />
                          <DiamondIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-yellow-200 mb-2">
                          {t.goldUnlockTitle}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4">
                          {t.goldUnlockDesc}
                        </p>

                        <button
                          type="button"
                          disabled={coins < GOLD_UNLOCK_COST}
                          onClick={unlockGoldWorld}
                          className={`w-full sm:w-auto min-w-[230px] px-6 py-3 rounded-lg font-bold text-sm sm:text-base transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 whitespace-nowrap ${
                            coins >= GOLD_UNLOCK_COST
                              ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-sky-400 hover:brightness-110 active:scale-[0.98] text-slate-950 cursor-pointer'
                              : 'bg-slate-800 text-slate-400 border border-white/10 cursor-not-allowed'
                          }`}
                        >
                          {t.goldUnlockBtn}
                        </button>

                        {coins < GOLD_UNLOCK_COST && (
                          <p className="text-xs text-yellow-300/85 mt-2.5 font-medium">
                            {t.goldNeedCoins(GOLD_UNLOCK_COST - coins)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="text-xs sm:text-sm text-yellow-100/90 mb-3">
                          {t.goldStagesModalHint}
                        </p>

                      {/* Dedicated Diamonds Lives Bar inside Gold Stages (10 Pink Coins per diamond) */}
                      <div className="flex flex-col gap-2 mb-3 p-2.5 rounded-lg border border-yellow-400/30 bg-gradient-to-r from-[#231907]/90 via-[#1b160b]/90 to-[#0d1f32]/90">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <DiamondIcon className="w-5 h-5 shrink-0" />
                            <span className="text-xs sm:text-sm font-bold text-sky-200">
                              {t.diamondsLabel}:{' '}
                              <span className="font-num text-yellow-200">
                                {diamonds}/{MAX_DIAMONDS}
                              </span>
                            </span>
                            {diamonds < MAX_DIAMONDS && (
                              <span className="font-num text-[11px] font-semibold text-sky-300 bg-sky-500/15 border border-sky-400/25 rounded px-1.5 py-0.5">
                                {formatCountdown(nextDiamondInMs)}
                              </span>
                            )}
                          </div>
                          {diamonds < MAX_DIAMONDS && (
                            <button
                              type="button"
                              disabled={pinkCoins < DIAMOND_COST_COINS}
                              onClick={() => buyLifeForMode('gold')}
                              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                                pinkCoins >= DIAMOND_COST_COINS
                                  ? 'bg-pink-400 hover:bg-pink-300 text-slate-950 cursor-pointer'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              <PinkCoinIcon className="w-3.5 h-3.5 shrink-0" />
                              <span>{t.buyDiamondBtn}</span>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-pink-200/90 border-t border-white/10 pt-1.5">
                          <PinkCoinIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-num font-bold text-pink-300">
                            {pinkCoins}
                          </span>
                          <span>{t.pinkCoins}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-pink-100/85">
                            {t.pinkCoinBenefitDesc}
                          </span>
                        </div>
                      </div>

                      {diamonds <= 0 && (
                        <p className="text-xs sm:text-sm font-semibold text-rose-300 mb-3">
                          {t.noDiamondsNotice(formatCountdown(nextDiamondInMs))}
                        </p>
                      )}

                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                        {GOLD_STAGES.map((cfg) => {
                          const isCurrent = isGoldMode && cfg.stage === stageNum;
                          const isCompleted = completedGoldStages.includes(cfg.stage);
                          const unlocked = isStageUnlocked(
                            cfg.stage,
                            completedGoldStages
                          );
                          const canEnter = unlocked && diamonds > 0;
                          return (
                            <button
                              key={cfg.stage}
                              type="button"
                              disabled={!canEnter}
                              aria-label={
                                unlocked
                                  ? `${t.goldStageBanner(cfg.stage)} — ${cfg.pointsNeeded} ${t.ptsShort}`
                                  : t.lockedStageAria(cfg.stage)
                              }
                              onClick={() => {
                                if (canEnter) startAtStage(cfg.stage, 'gold');
                              }}
                              className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-lg border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 ${
                                !unlocked
                                  ? 'border-white/5 bg-slate-950/70 text-slate-500 opacity-65 cursor-not-allowed'
                                  : isCurrent
                                  ? 'border-yellow-400 bg-gradient-to-b from-yellow-400/25 to-sky-500/20 text-white cursor-pointer'
                                  : isCompleted
                                  ? 'border-sky-400/40 bg-gradient-to-b from-amber-500/20 to-sky-500/15 text-yellow-50 hover:from-amber-500/30 hover:to-sky-500/25 cursor-pointer'
                                  : 'border-yellow-400/25 bg-[#1e1709]/80 text-yellow-100 hover:bg-[#2a200d]/90 hover:border-yellow-300/45 cursor-pointer'
                              }`}
                            >
                              {!unlocked ? (
                                <span
                                  className="absolute top-1.5 end-1.5 text-slate-500"
                                  aria-hidden="true"
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <rect x="5" y="11" width="14" height="10" rx="2" />
                                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                                  </svg>
                                </span>
                              ) : (
                                isCompleted && (
                                  <span
                                    className="absolute top-1.5 end-1.5 text-sky-300"
                                    aria-hidden="true"
                                  >
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="w-3.5 h-3.5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  </span>
                                )
                              )}
                              <span className="font-num text-base sm:text-lg font-bold">
                                {cfg.stage}
                              </span>
                              <span
                                className={`font-num text-[11px] whitespace-nowrap ${
                                  unlocked ? 'text-yellow-200/85' : 'text-slate-600'
                                }`}
                              >
                                {cfg.pointsNeeded} {t.ptsShort}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      </>
                    )
                  ) : !fruitUnlocked ? (
                    <div className="rounded-xl border border-amber-400/25 bg-gradient-to-b from-emerald-950/75 via-slate-900/90 to-slate-950/90 p-5 text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <FruitIndexIcon kind="fruit_apple" />
                        <FruitIndexIcon kind="fruit_orange" />
                        <FruitIndexIcon kind="fruit_strawberry" />
                        <FruitIndexIcon kind="fruit_watermelon" />
                        <CornIcon className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-amber-200 mb-2">
                        {t.fruitUnlockTitle}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4">
                        {t.fruitUnlockDesc}
                      </p>

                      <button
                        type="button"
                        disabled={coins < FRUIT_UNLOCK_COST}
                        onClick={unlockFruitWorld}
                        className={`w-full sm:w-auto min-w-[230px] px-6 py-3 rounded-lg font-bold text-sm sm:text-base transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 whitespace-nowrap ${
                          coins >= FRUIT_UNLOCK_COST
                            ? 'bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 cursor-pointer'
                            : 'bg-slate-800 text-slate-400 border border-white/10 cursor-not-allowed'
                        }`}
                      >
                        {t.fruitUnlockBtn}
                      </button>

                      {coins < FRUIT_UNLOCK_COST && (
                        <p className="text-xs text-amber-300/85 mt-2.5 font-medium">
                          {t.fruitNeedCoins(FRUIT_UNLOCK_COST - coins)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-xs sm:text-sm text-amber-100/90 mb-3">
                        {t.fruitStagesModalHint}
                      </p>

                      {/* Dedicated Corn Lives Bar inside Fruit Stages */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 p-2.5 rounded-lg border border-amber-400/25 bg-emerald-950/55">
                        <div className="flex items-center gap-1.5">
                          <CornIcon className="w-5 h-5 shrink-0" />
                          <span className="text-xs sm:text-sm font-bold text-amber-200">
                            {t.cornLabel}:{' '}
                            <span className="font-num">
                              {corn}/{MAX_CORN}
                            </span>
                          </span>
                          {corn < MAX_CORN && (
                            <span className="font-num text-[11px] font-semibold text-sky-300 bg-sky-500/15 border border-sky-400/25 rounded px-1.5 py-0.5">
                              {formatCountdown(nextCornInMs)}
                            </span>
                          )}
                        </div>
                        {corn < MAX_CORN && (
                          <button
                            type="button"
                            disabled={coins < HEART_COST_COINS}
                            onClick={() => buyLifeForMode('fruit')}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
                              coins >= HEART_COST_COINS
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {t.buyCornBtn}
                          </button>
                        )}
                      </div>

                      {corn <= 0 && (
                        <p className="text-xs sm:text-sm font-semibold text-rose-300 mb-3">
                          {t.noCornNotice(formatCountdown(nextCornInMs))}
                        </p>
                      )}

                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                        {FRUIT_STAGES.map((cfg) => {
                          const isCurrent = isFruitMode && cfg.stage === stageNum;
                          const isCompleted = completedFruitStages.includes(cfg.stage);
                          const unlocked = isStageUnlocked(
                            cfg.stage,
                            completedFruitStages
                          );
                          const canEnter = unlocked && corn > 0;
                          return (
                            <button
                              key={cfg.stage}
                              type="button"
                              disabled={!canEnter}
                              aria-label={
                                unlocked
                                  ? `${t.fruitStageBanner(cfg.stage)} — ${cfg.pointsNeeded} ${t.ptsShort}`
                                  : t.lockedStageAria(cfg.stage)
                              }
                              onClick={() => {
                                if (canEnter) startAtStage(cfg.stage, 'fruit');
                              }}
                              className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-lg border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                                !unlocked
                                  ? 'border-white/5 bg-slate-950/70 text-slate-500 opacity-65 cursor-not-allowed'
                                  : isCurrent
                                  ? 'border-amber-400 bg-amber-500/20 text-white cursor-pointer'
                                  : isCompleted
                                  ? 'border-lime-400/35 bg-emerald-500/15 text-slate-100 hover:bg-emerald-500/25 cursor-pointer'
                                  : 'border-amber-300/18 bg-emerald-950/55 text-amber-100 hover:bg-emerald-900/65 hover:border-amber-300/35 cursor-pointer'
                              }`}
                            >
                              {!unlocked ? (
                                <span
                                  className="absolute top-1.5 end-1.5 text-slate-500"
                                  aria-hidden="true"
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <rect x="5" y="11" width="14" height="10" rx="2" />
                                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                                  </svg>
                                </span>
                              ) : (
                                isCompleted && (
                                  <span
                                    className="absolute top-1.5 end-1.5 text-lime-400"
                                    aria-hidden="true"
                                  >
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="w-3.5 h-3.5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  </span>
                                )
                              )}
                              <span className="font-num text-base sm:text-lg font-bold">
                                {cfg.stage}
                              </span>
                              <span
                                className={`font-num text-[11px] whitespace-nowrap ${
                                  unlocked ? 'text-amber-200/80' : 'text-slate-600'
                                }`}
                              >
                                {cfg.pointsNeeded} {t.ptsShort}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Index Overlay ("الاندكس") — Normal + Fruit + Gold Indexes with catch-based discovery lock */}
          {indexModalOpen && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5 bg-[#060c17]/82 backdrop-blur-[4px]">
              <div className="w-full max-w-md max-h-full flex flex-col rounded-xl border border-white/14 bg-[#0f1a2e]/98 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
                      {indexModalWorld === 'gold'
                        ? t.goldIndexWorldBtn
                        : indexModalWorld === 'fruit'
                        ? t.fruitIndexWorldBtn
                        : t.indexModalTitle}
                    </h2>
                    <span
                      className={`text-xs sm:text-sm font-semibold font-num whitespace-nowrap ${
                        indexModalWorld === 'gold'
                          ? 'text-yellow-300'
                          : indexModalWorld === 'fruit'
                          ? 'text-amber-300'
                          : 'text-sky-300'
                      }`}
                    >
                      ·{' '}
                      {indexModalWorld === 'gold'
                        ? t.indexDiscoveredCount(
                            discoveredGoldItems.length,
                            GOLD_INDEX_CATALOG.length
                          )
                        : indexModalWorld === 'fruit'
                        ? t.indexDiscoveredCount(
                            discoveredFruitItems.length,
                            FRUIT_INDEX_CATALOG.length
                          )
                        : t.indexDiscoveredCount(
                            discoveredItems.length,
                            INDEX_CATALOG.length
                          )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={closeIndexModal}
                    aria-label={t.close}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer shrink-0"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="px-5 pt-3.5 pb-5 overflow-y-auto">
                  {/* World Switcher: Normal vs Fruit vs Gold Index */}
                  <div
                    role="tablist"
                    aria-label={t.indexModalTitle}
                    className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-slate-950/75 border border-white/10 mb-3"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={indexModalWorld === 'normal'}
                      onClick={() => setIndexModalWorld('normal')}
                      className={`h-9 px-1.5 rounded-md inline-flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 whitespace-nowrap cursor-pointer ${
                        indexModalWorld === 'normal'
                          ? 'bg-sky-500 text-slate-950'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <span>{t.normalIndexWorldBtn}</span>
                      <span
                        className={`font-num text-[10px] ${
                          indexModalWorld === 'normal'
                            ? 'text-slate-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {discoveredItems.length}/{INDEX_CATALOG.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={indexModalWorld === 'fruit'}
                      onClick={() => setIndexModalWorld('fruit')}
                      className={`h-9 px-1.5 rounded-md inline-flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 whitespace-nowrap cursor-pointer ${
                        indexModalWorld === 'fruit'
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-amber-200 hover:text-white hover:bg-amber-500/15'
                      }`}
                    >
                      <span>{t.fruitIndexWorldBtn}</span>
                      <span
                        className={`font-num text-[10px] ${
                          indexModalWorld === 'fruit'
                            ? 'text-slate-900'
                            : 'text-amber-300/80'
                        }`}
                      >
                        {discoveredFruitItems.length}/{FRUIT_INDEX_CATALOG.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={indexModalWorld === 'gold'}
                      onClick={() => setIndexModalWorld('gold')}
                      className={`h-9 px-1.5 rounded-md inline-flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 whitespace-nowrap cursor-pointer ${
                        indexModalWorld === 'gold'
                          ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-sky-400 text-slate-950'
                          : 'text-yellow-200 hover:text-white hover:bg-yellow-500/15'
                      }`}
                    >
                      <span>{t.goldIndexWorldBtn}</span>
                      <span
                        className={`font-num text-[10px] ${
                          indexModalWorld === 'gold'
                            ? 'text-slate-950/85'
                            : 'text-sky-300/90'
                        }`}
                      >
                        {discoveredGoldItems.length}/{GOLD_INDEX_CATALOG.length}
                      </span>
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 mb-3.5 leading-relaxed">
                    {indexModalWorld === 'gold'
                      ? t.goldIndexModalHint
                      : indexModalWorld === 'fruit'
                      ? t.fruitIndexModalHint
                      : t.indexModalHint}
                  </p>

                  {/* Two Filter Buttons: Plus (+) and Minus (-) */}
                  <div
                    role="tablist"
                    aria-label={t.indexModalTitle}
                    className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-slate-950/70 border border-white/10 mb-4"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={indexTab === 'positive'}
                      onClick={() => setIndexTab('positive')}
                      className={`h-10 px-3 rounded-md inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 whitespace-nowrap cursor-pointer ${
                        indexTab === 'positive'
                          ? indexModalWorld === 'gold'
                            ? 'bg-gradient-to-r from-yellow-400 to-sky-400 text-slate-950'
                            : indexModalWorld === 'fruit'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-sky-500 text-slate-950'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <span>
                        {indexModalWorld === 'gold'
                          ? t.goldIndexPlusTab
                          : indexModalWorld === 'fruit'
                          ? t.fruitIndexPlusTab
                          : t.indexPlusTab}
                      </span>
                      <span
                        className={`font-num text-[11px] ${
                          indexTab === 'positive' ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {indexModalWorld === 'gold'
                          ? `${goldPositiveDiscoveredCount}/${goldPositiveCatalog.length}`
                          : indexModalWorld === 'fruit'
                          ? `${fruitPositiveDiscoveredCount}/${fruitPositiveCatalog.length}`
                          : `${positiveDiscoveredCount}/${positiveCatalog.length}`}
                      </span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={indexTab === 'negative'}
                      onClick={() => setIndexTab('negative')}
                      className={`h-10 px-3 rounded-md inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 whitespace-nowrap cursor-pointer ${
                        indexTab === 'negative'
                          ? 'bg-rose-500 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <span>
                        {indexModalWorld === 'gold'
                          ? t.goldIndexMinusTab
                          : indexModalWorld === 'fruit'
                          ? t.fruitIndexMinusTab
                          : t.indexMinusTab}
                      </span>
                      <span
                        className={`font-num text-[11px] ${
                          indexTab === 'negative' ? 'text-rose-100' : 'text-slate-400'
                        }`}
                      >
                        {indexModalWorld === 'gold'
                          ? `${goldNegativeDiscoveredCount}/${goldNegativeCatalog.length}`
                          : indexModalWorld === 'fruit'
                          ? `${fruitNegativeDiscoveredCount}/${fruitNegativeCatalog.length}`
                          : `${negativeDiscoveredCount}/${negativeCatalog.length}`}
                      </span>
                    </button>
                  </div>

                  {/* Entries List */}
                  <div className="space-y-3" role="tabpanel">
                    {indexModalWorld === 'gold'
                      ? activeGoldIndexEntries.map((entry) => {
                          const discovered = discoveredGoldItems.includes(entry.kind);
                          const isPositive = entry.category === 'positive';
                          return (
                            <div
                              key={entry.kind}
                              className={`flex items-center gap-3.5 p-3.5 rounded-lg border transition-colors ${
                                discovered
                                  ? isPositive
                                    ? 'border-yellow-400/30 bg-gradient-to-r from-[#221908]/85 to-[#101c2d]/85'
                                    : 'border-rose-400/25 bg-slate-900/85'
                                  : 'border-white/8 bg-slate-950/75 opacity-85'
                              }`}
                            >
                              <div
                                className={`w-12 h-12 rounded-lg border flex items-center justify-center shrink-0 ${
                                  discovered
                                    ? 'border-yellow-400/25 bg-[#161108]'
                                    : 'border-yellow-400/18 bg-[#120e07]'
                                }`}
                                aria-hidden="true"
                              >
                                <GoldIndexIcon kind={entry.kind} />
                              </div>

                              <div className="min-w-0 flex-1">
                                {discovered ? (
                                  <>
                                    <div className="flex items-baseline justify-between gap-2">
                                      <span className="text-sm sm:text-base font-bold text-white truncate">
                                        {lang === 'ar' ? entry.nameAr : entry.nameEn}
                                      </span>
                                      <span
                                        className={`font-num text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 ${
                                          entry.kind === 'blue_diamond'
                                            ? 'text-sky-300'
                                            : isPositive
                                            ? 'text-yellow-300'
                                            : 'text-rose-400'
                                        }`}
                                      >
                                        {lang === 'ar' ? entry.valueAr : entry.valueEn}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                      {lang === 'ar'
                                        ? entry.benefitAr
                                        : entry.benefitEn}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-baseline justify-between gap-2">
                                      <span className="text-sm sm:text-base font-bold text-slate-100 truncate">
                                        {lang === 'ar' ? entry.nameAr : entry.nameEn}
                                      </span>
                                      <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap shrink-0">
                                        {lang === 'ar' ? 'فائدته مقفلة' : 'Effect Locked'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                      {lang === 'ar'
                                        ? 'الفائدة مخفية — التقطه أو المسه أثناء اللعب لفتح فائدته.'
                                        : 'Benefit hidden — catch or touch it during play to unlock its effect.'}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      : indexModalWorld === 'fruit'
                      ? activeFruitIndexEntries.map((entry) => {
                          const discovered = discoveredFruitItems.includes(entry.kind);
                          const isPositive = entry.category === 'positive';
                          return (
                            <div
                              key={entry.kind}
                              className={`flex items-center gap-3.5 p-3.5 rounded-lg border transition-colors ${
                                discovered
                                  ? isPositive
                                    ? 'border-emerald-400/25 bg-emerald-950/45'
                                    : 'border-rose-400/25 bg-slate-900/85'
                                  : 'border-white/8 bg-slate-950/75 opacity-85'
                              }`}
                            >
                              <div
                                className={`w-12 h-12 rounded-lg border flex items-center justify-center shrink-0 ${
                                  discovered
                                    ? 'border-white/12 bg-[#0a1a12]'
                                    : 'border-emerald-400/15 bg-[#09150f]'
                                }`}
                                aria-hidden="true"
                              >
                                <FruitIndexIcon kind={entry.kind} />
                              </div>

                              <div className="min-w-0 flex-1">
                                {discovered ? (
                                  <>
                                    <div className="flex items-baseline justify-between gap-2">
                                      <span className="text-sm sm:text-base font-bold text-white truncate">
                                        {lang === 'ar' ? entry.nameAr : entry.nameEn}
                                      </span>
                                      <span
                                        className={`font-num text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 ${
                                          isPositive
                                            ? 'text-lime-300'
                                            : 'text-rose-400'
                                        }`}
                                      >
                                        {lang === 'ar' ? entry.valueAr : entry.valueEn}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                      {lang === 'ar'
                                        ? entry.benefitAr
                                        : entry.benefitEn}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-baseline justify-between gap-2">
                                      <span className="text-sm sm:text-base font-bold text-slate-100 truncate">
                                        {lang === 'ar' ? entry.nameAr : entry.nameEn}
                                      </span>
                                      <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap shrink-0">
                                        {lang === 'ar' ? 'فائدته مقفلة' : 'Effect Locked'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                      {lang === 'ar'
                                        ? 'الفائدة مخفية — التقطه أو المسه أثناء اللعب لفتح فائدته.'
                                        : 'Benefit hidden — catch or touch it during play to unlock its effect.'}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      : activeIndexEntries.map((entry) => {
                          const discovered = discoveredItems.includes(entry.kind);
                          const isPositive = entry.category === 'positive';
                          return (
                            <div
                              key={entry.kind}
                              className={`flex items-center gap-3.5 p-3.5 rounded-lg border transition-colors ${
                                discovered
                                  ? isPositive
                                    ? 'border-sky-400/25 bg-slate-900/85'
                                    : 'border-rose-400/25 bg-slate-900/85'
                                  : 'border-white/10 bg-slate-900/65'
                              }`}
                            >
                              {/* Item Artwork (always visible; value digits appear once discovered) */}
                              <div
                                className={`w-12 h-12 rounded-lg border flex items-center justify-center shrink-0 ${
                                  discovered
                                    ? 'border-white/12 bg-[#0a1324]'
                                    : 'border-white/10 bg-[#0b1426]'
                                }`}
                                aria-hidden="true"
                              >
                                {entry.kind === 'pink_circle' ? (
                                  <svg viewBox="0 0 24 24" className="w-8 h-8">
                                    <circle
                                      cx="12"
                                      cy="12"
                                      r="9.5"
                                      fill="#ec4899"
                                      stroke="#fbcfe8"
                                      strokeWidth="1.8"
                                    />
                                    {discovered && (
                                      <text
                                        x="12"
                                        y="16"
                                        textAnchor="middle"
                                        fill="#ffffff"
                                        fontSize="11"
                                        fontWeight="700"
                                      >
                                        3
                                      </text>
                                    )}
                                  </svg>
                                ) : entry.kind === 'blue_triangle' ? (
                                  <svg viewBox="0 0 24 24" className="w-8 h-8">
                                    <polygon
                                      points="12,2.5 21.5,20 2.5,20"
                                      fill="#0284c7"
                                      stroke="#bae6fd"
                                      strokeWidth="1.8"
                                      strokeLinejoin="round"
                                    />
                                    {discovered && (
                                      <text
                                        x="12"
                                        y="17.5"
                                        textAnchor="middle"
                                        fill="#ffffff"
                                        fontSize="10"
                                        fontWeight="700"
                                      >
                                        4
                                      </text>
                                    )}
                                  </svg>
                                ) : entry.kind === 'green_circle' ? (
                                  <svg viewBox="0 0 24 24" className="w-8 h-8">
                                    <circle
                                      cx="12"
                                      cy="12"
                                      r="9.5"
                                      fill="#059669"
                                      stroke="#a7f3d0"
                                      strokeWidth="1.8"
                                    />
                                    {discovered && (
                                      <text
                                        x="12"
                                        y="16"
                                        textAnchor="middle"
                                        fill="#ffffff"
                                        fontSize="11"
                                        fontWeight="800"
                                      >
                                        2
                                      </text>
                                    )}
                                  </svg>
                                ) : entry.kind === 'purple_diamond' ? (
                                  <svg viewBox="0 0 24 24" className="w-8 h-8">
                                    <polygon
                                      points="12,2.5 21.5,12 12,21.5 2.5,12"
                                      fill="#9333ea"
                                      stroke="#f3e8ff"
                                      strokeWidth="1.8"
                                      strokeLinejoin="round"
                                    />
                                    {discovered && (
                                      <text
                                        x="12"
                                        y="15.8"
                                        textAnchor="middle"
                                        fill="#ffffff"
                                        fontSize="10.5"
                                        fontWeight="800"
                                      >
                                        5
                                      </text>
                                    )}
                                  </svg>
                                ) : entry.kind === 'gold_star' ? (
                                  <svg viewBox="0 0 24 24" className="w-8 h-8">
                                    <polygon
                                      points="12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6"
                                      fill="#f59e0b"
                                      stroke="#fef9c3"
                                      strokeWidth="1.6"
                                      strokeLinejoin="round"
                                    />
                                    {discovered && (
                                      <text
                                        x="12"
                                        y="15.8"
                                        textAnchor="middle"
                                        fill="#ffffff"
                                        fontSize="9.5"
                                        fontWeight="900"
                                      >
                                        7
                                      </text>
                                    )}
                                  </svg>
                                ) : entry.kind === 'hazard_spike' ? (
                                  <svg viewBox="-1 -1 26 26" className="w-8 h-8">
                                    <polygon
                                      points="12,1 14.8,6.2 20.5,4.5 18.2,10 23,12 18.2,14 20.5,19.5 14.8,17.8 12,23 9.2,17.8 3.5,19.5 5.8,14 1,12 5.8,10 3.5,4.5 9.2,6.2"
                                      fill="#dc2626"
                                      stroke="#fca5a5"
                                      strokeWidth="1"
                                      strokeLinejoin="round"
                                    />
                                    {discovered && (
                                      <text
                                        x="12"
                                        y="15.5"
                                        textAnchor="middle"
                                        fill="#ffffff"
                                        fontSize="9"
                                        fontWeight="800"
                                      >
                                        -1
                                      </text>
                                    )}
                                  </svg>
                                ) : entry.kind === 'hazard_star' ? (
                                  <svg viewBox="0 0 24 24" className="w-8 h-8">
                                    <polygon
                                      points="12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6"
                                      fill="#dc2626"
                                      stroke="#bae6fd"
                                      strokeWidth="1.5"
                                      strokeLinejoin="round"
                                    />
                                    {discovered && (
                                      <text
                                        x="12"
                                        y="15.2"
                                        textAnchor="middle"
                                        fill="#e0f2fe"
                                        fontSize="8.5"
                                        fontWeight="800"
                                      >
                                        ❄
                                      </text>
                                    )}
                                  </svg>
                                ) : entry.kind === 'hazard_arrow' ? (
                                  <svg viewBox="-1 -1 26 26" className="w-8 h-8">
                                    <polygon
                                      points="12,22 20,11 15,11 15.5,2 12,4.5 8.5,2 9,11 4,11"
                                      fill="#dc2626"
                                      stroke="#fecaca"
                                      strokeWidth="1.5"
                                      strokeLinejoin="round"
                                    />
                                    <line
                                      x1="12"
                                      y1="4.5"
                                      x2="12"
                                      y2="20"
                                      stroke="#fee2e2"
                                      strokeWidth="1.2"
                                    />
                                  </svg>
                                ) : entry.kind === 'hazard_arrow_amber' ? (
                                  <svg viewBox="-2 -2 28 28" className="w-9 h-9">
                                    <g transform="rotate(-16 12 12)">
                                      {/* Swept golden falcon wings */}
                                      <polygon
                                        points="12,17.2 21.5,10.5 19.2,7.2 14,12.2 12,9.8 10,12.2 4.8,7.2 2.5,10.5"
                                        fill="#eab308"
                                        stroke="#fef9c3"
                                        strokeWidth="1.15"
                                        strokeLinejoin="round"
                                      />
                                      {/* Forked tail fins */}
                                      <polygon
                                        points="12,8 16.5,2 13.8,5 12,3.6 10.2,5 7.5,2"
                                        fill="#ca8a04"
                                        stroke="#fde047"
                                        strokeWidth="1"
                                        strokeLinejoin="round"
                                      />
                                      {/* Central golden diamond spearhead */}
                                      <polygon
                                        points="12,22.2 15.6,14.5 13.4,5.4 12,6.8 10.6,5.4 8.4,14.5"
                                        fill="#facc15"
                                        stroke="#fef9c3"
                                        strokeWidth="1.2"
                                        strokeLinejoin="round"
                                      />
                                      <circle
                                        cx="12"
                                        cy="10.8"
                                        r="1.7"
                                        fill="#ffffff"
                                        stroke="#d97706"
                                        strokeWidth="1"
                                      />
                                    </g>
                                  </svg>
                                ) : entry.kind === 'hazard_arrow_violet' ? (
                                  <svg viewBox="-2 -2 28 28" className="w-9 h-9">
                                    {/* Arcane halo ring */}
                                    <circle
                                      cx="12"
                                      cy="11.5"
                                      r="5.6"
                                      fill="none"
                                      stroke="#e9d5ff"
                                      strokeOpacity="0.45"
                                      strokeWidth="1.1"
                                    />
                                    {/* Curved crescent-moon blade */}
                                    <path
                                      d="M2.6,10.5 Q12,20.2 21.4,10.5 Q12,15.2 2.6,10.5 Z"
                                      fill="#a855f7"
                                      stroke="#f3e8ff"
                                      strokeWidth="1.2"
                                      strokeLinejoin="round"
                                    />
                                    {/* Flared arcane tail plumes */}
                                    <path
                                      d="M12,7.8 Q17.6,5.4 16.6,2.2 Q13.6,4.8 12,3.4 Q10.4,4.8 7.4,2.2 Q6.4,5.4 12,7.8 Z"
                                      fill="#7e22ce"
                                      stroke="#d8b4fe"
                                      strokeWidth="1"
                                      strokeLinejoin="round"
                                    />
                                    {/* Crystal needle-lance */}
                                    <polygon
                                      points="12,22.2 14.5,14.8 13.3,4.2 12,5.8 10.7,4.2 9.5,14.8"
                                      fill="#c084fc"
                                      stroke="#f5d0fe"
                                      strokeWidth="1.15"
                                      strokeLinejoin="round"
                                    />
                                    {/* Amethyst diamond core */}
                                    <polygon
                                      points="12,13.8 14,11.5 12,9.2 10,11.5"
                                      fill="#ffffff"
                                      stroke="#9333ea"
                                      strokeWidth="1"
                                    />
                                  </svg>
                                ) : (
                                  <svg viewBox="0 0 24 24" className="w-8 h-8">
                                    <rect
                                      x="3"
                                      y="3"
                                      width="18"
                                      height="18"
                                      rx="2.5"
                                      fill="#b91c1c"
                                      stroke="#fca5a5"
                                      strokeWidth="1.8"
                                    />
                                    {discovered && (
                                      <text
                                        x="12"
                                        y="15.5"
                                        textAnchor="middle"
                                        fill="#ffffff"
                                        fontSize="9.5"
                                        fontWeight="800"
                                      >
                                        -2
                                      </text>
                                    )}
                                  </svg>
                                )}
                              </div>

                              {/* Entry Text */}
                              <div className="min-w-0 flex-1">
                                {discovered ? (
                                  <>
                                    <div className="flex items-baseline justify-between gap-2">
                                      <span className="text-sm sm:text-base font-bold text-white truncate">
                                        {lang === 'ar' ? entry.nameAr : entry.nameEn}
                                      </span>
                                      <span
                                        className={`font-num text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 ${
                                          entry.kind === 'pink_circle'
                                            ? 'text-pink-300'
                                            : entry.kind === 'blue_triangle'
                                            ? 'text-sky-300'
                                            : entry.kind === 'green_circle'
                                            ? 'text-emerald-300'
                                            : entry.kind === 'purple_diamond'
                                            ? 'text-purple-300'
                                            : entry.kind === 'gold_star'
                                            ? 'text-yellow-300'
                                            : entry.kind === 'hazard_arrow_amber'
                                            ? 'text-amber-300'
                                            : entry.kind === 'hazard_arrow_violet'
                                            ? 'text-violet-300'
                                            : 'text-rose-400'
                                        }`}
                                      >
                                        {lang === 'ar' ? entry.valueAr : entry.valueEn}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                      {lang === 'ar'
                                        ? entry.benefitAr
                                        : entry.benefitEn}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-baseline justify-between gap-2">
                                      <span className="text-sm sm:text-base font-bold text-slate-100 truncate">
                                        {lang === 'ar' ? entry.nameAr : entry.nameEn}
                                      </span>
                                      <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap shrink-0">
                                        {lang === 'ar' ? 'فائدته مقفلة' : 'Effect Locked'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                      {lang === 'ar'
                                        ? 'الفائدة مخفية — التقطه أو المسه أثناء اللعب لفتح فائدته.'
                                        : 'Benefit hidden — catch or touch it during play to unlock its effect.'}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shop Overlay ("المتجر") */}
          {shopModalOpen && (
            <ShopModal
              lang={lang}
              coins={coins}
              pinkCoins={pinkCoins}
              lives={lives}
              maxLives={MAX_LIVES}
              corn={corn}
              maxCorn={MAX_CORN}
              diamonds={diamonds}
              maxDiamonds={MAX_DIAMONDS}
              shop={shop}
              activeTab={shopTab}
              pointsSubTab={shopPointsSubTab}
              onChangeTab={setShopTab}
              onChangePointsSubTab={setShopPointsSubTab}
              onClose={closeShopModal}
              onSelectOrBuySkin={selectOrBuySkin}
              onSelectOrBuyPlusSkin={selectOrBuyPlusSkin}
              onSelectOrBuyMinusSkin={selectOrBuyMinusSkin}
              onBuySupply={buySupply}
            />
          )}

          {/* Bag Overlay ("الحقيبة") — Store & Use Hearts, Corn, and Diamonds */}
          {bagModalOpen && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5 bg-[#060c17]/82 backdrop-blur-[4px]">
              <div className="w-full max-w-md max-h-full flex flex-col rounded-xl border border-white/14 bg-[#0f1a2e]/98 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 shrink-0">
                  <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
                      {t.bagTitle}
                    </h2>
                    <span className="text-xs sm:text-sm text-amber-300 font-semibold font-num whitespace-nowrap">
                      · {coins} {t.coins}
                    </span>
                    <span className="text-xs sm:text-sm text-pink-300 font-semibold font-num whitespace-nowrap inline-flex items-center gap-1">
                      <span>·</span>
                      <PinkCoinIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{pinkCoins}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={closeBagModal}
                    aria-label={t.close}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 cursor-pointer shrink-0"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="px-5 pt-3.5 pb-5 overflow-y-auto space-y-3">
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {t.bagDesc}
                  </p>

                  {(
                    [
                      {
                        mode: 'normal' as GameMode,
                        title: t.bagHeartsTitle,
                        sub: t.bagHeartsSub,
                        stored: bag.hearts,
                        active: lives,
                        max: MAX_LIVES,
                        cost: HEART_COST_COINS,
                        borderClass: 'border-rose-400/25 bg-rose-950/20',
                        countClass: 'text-rose-300',
                        useBtnClass:
                          'bg-rose-500 hover:bg-rose-400 text-white cursor-pointer',
                      },
                      {
                        mode: 'fruit' as GameMode,
                        title: t.bagCornTitle,
                        sub: t.bagCornSub,
                        stored: bag.corn,
                        active: corn,
                        max: MAX_CORN,
                        cost: HEART_COST_COINS,
                        borderClass: 'border-amber-400/25 bg-amber-950/20',
                        countClass: 'text-amber-300',
                        useBtnClass:
                          'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer',
                      },
                      {
                        mode: 'gold' as GameMode,
                        title: t.bagDiamondsTitle,
                        sub: t.bagDiamondsSub,
                        stored: bag.diamonds,
                        active: diamonds,
                        max: MAX_DIAMONDS,
                        cost: DIAMOND_COST_COINS,
                        borderClass: 'border-sky-400/25 bg-sky-950/25',
                        countClass: 'text-sky-300',
                        useBtnClass:
                          'bg-gradient-to-r from-yellow-400 to-sky-400 hover:brightness-110 text-slate-950 cursor-pointer',
                      },
                    ] as const
                  ).map((row) => {
                    const isPinkRow = row.mode === 'gold';
                    const canUse = row.stored > 0 && row.active < row.max;
                    const canStore = row.active > 1;
                    const canBuyToBag =
                      (isPinkRow ? pinkCoins : coins) >= row.cost;
                    return (
                      <div
                        key={row.mode}
                        className={`p-3.5 rounded-lg border ${row.borderClass} space-y-3`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-11 h-11 rounded-lg border border-white/10 bg-[#0a1324] flex items-center justify-center shrink-0"
                              aria-hidden="true"
                            >
                              {row.mode === 'normal' ? (
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-6 h-6 text-rose-500"
                                  fill="currentColor"
                                >
                                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                              ) : row.mode === 'fruit' ? (
                                <CornIcon className="w-6 h-6" />
                              ) : (
                                <DiamondIcon className="w-6 h-6" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm sm:text-base font-bold text-white truncate">
                                {row.title}
                              </div>
                              <div className="text-xs text-slate-400">
                                {row.sub} · {t.bagActiveLabel}:{' '}
                                <span className="font-num font-bold text-slate-200">
                                  {row.active}/{row.max}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-end shrink-0">
                            <div className="text-[11px] text-slate-400">
                              {t.bagInBagLabel}
                            </div>
                            <div
                              className={`font-num text-xl font-bold ${row.countClass}`}
                            >
                              {row.stored}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={!canUse}
                            onClick={() => useLifeFromBag(row.mode)}
                            className={`flex-1 min-w-[110px] h-9 px-3 rounded-md text-xs font-bold transition-all active:scale-[0.98] whitespace-nowrap ${
                              canUse
                                ? row.useBtnClass
                                : 'bg-slate-800/90 text-slate-500 border border-white/10 cursor-not-allowed'
                            }`}
                          >
                            {row.active >= row.max
                              ? t.bagFullBadge
                              : t.bagUseBtn}
                          </button>

                          <button
                            type="button"
                            disabled={!canStore}
                            onClick={() => storeLifeInBag(row.mode)}
                            className={`h-9 px-3 rounded-md text-xs font-semibold border transition-colors whitespace-nowrap ${
                              canStore
                                ? 'border-white/15 bg-slate-900/90 text-slate-100 hover:bg-slate-800 cursor-pointer'
                                : 'border-white/5 bg-slate-950/60 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            {t.bagStoreBtn}
                          </button>

                          <button
                            type="button"
                            disabled={!canBuyToBag}
                            onClick={() => buyLifeToBag(row.mode)}
                            className={`h-9 px-3 rounded-md text-xs font-bold border transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                              canBuyToBag
                                ? isPinkRow
                                  ? 'border-pink-400/50 bg-pink-500/20 text-pink-200 hover:bg-pink-500/30 cursor-pointer'
                                  : 'border-amber-400/45 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 cursor-pointer'
                                : 'border-white/5 bg-slate-950/60 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            {isPinkRow && (
                              <PinkCoinIcon className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>
                              {isPinkRow ? t.bagBuyDiamondBtn : t.bagBuyBtn}
                            </span>
                          </button>
                        </div>
                        {isPinkRow && (
                          <p className="text-[11px] text-pink-200/85 leading-relaxed">
                            {t.pinkCoinBenefitDesc}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Settings Overlay ("الإعدادات") */}
          {settingsModalOpen && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-[#060c17]/82 backdrop-blur-[4px]">
              <div className="w-full max-w-md rounded-xl border border-white/14 bg-[#0f1a2e]/98 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {t.settingsTitle}
                  </h2>
                  <button
                    type="button"
                    onClick={closeSettingsModal}
                    aria-label={t.close}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer shrink-0"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="divide-y divide-white/10 px-5">
                  {/* Music Toggle */}
                  <div className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <div className="text-sm sm:text-base font-semibold text-white">
                        {t.musicLabel}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {t.musicDesc}
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={musicEnabled}
                      onClick={toggleMusic}
                      className={`h-10 min-w-[84px] px-3.5 rounded-lg border text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 whitespace-nowrap shrink-0 cursor-pointer ${
                        musicEnabled
                          ? 'border-sky-400/50 bg-sky-500 text-slate-950 hover:bg-sky-400'
                          : 'border-white/15 bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {musicEnabled ? t.onLabel : t.offLabel}
                    </button>
                  </div>

                  {/* Sound Effects Toggle */}
                  <div className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <div className="text-sm sm:text-base font-semibold text-white">
                        {t.sfxLabel}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {t.sfxDesc}
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={sfxEnabled}
                      onClick={toggleSfx}
                      className={`h-10 min-w-[84px] px-3.5 rounded-lg border text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 whitespace-nowrap shrink-0 cursor-pointer ${
                        sfxEnabled
                          ? 'border-sky-400/50 bg-sky-500 text-slate-950 hover:bg-sky-400'
                          : 'border-white/15 bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {sfxEnabled ? t.onLabel : t.offLabel}
                    </button>
                  </div>

                  {/* Language Segmented Selector */}
                  <div className="flex items-center justify-between gap-4 py-4">
                    <div className="text-sm sm:text-base font-semibold text-white">
                      {t.languageLabel}
                    </div>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-white/10 shrink-0">
                      <button
                        type="button"
                        onClick={() => setLang('ar')}
                        className={`h-8 px-3 rounded-md text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          lang === 'ar'
                            ? 'bg-sky-500 text-slate-950'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        العربية
                      </button>
                      <button
                        type="button"
                        onClick={() => setLang('en')}
                        className={`h-8 px-3 rounded-md text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          lang === 'en'
                            ? 'bg-sky-500 text-slate-950'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Controls Bar */}
        <div className="shrink-0 flex items-center justify-between gap-3">
          <p className="hidden md:block text-xs text-slate-400">
            {t.controlsHint}
          </p>

          <div
            dir="ltr"
            className="w-full md:w-auto grid grid-cols-2 md:flex items-center gap-3"
          >
            <button
              type="button"
              aria-label={t.moveLeft}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setLeftHold(true);
              }}
              onPointerUp={() => setLeftHold(false)}
              onPointerCancel={() => setLeftHold(false)}
              onLostPointerCapture={() => setLeftHold(false)}
              className="h-12 md:h-11 md:w-28 rounded-lg border border-white/12 bg-[#111c30] hover:bg-[#182640] active:bg-sky-500/20 active:border-sky-400/50 text-slate-100 inline-flex items-center justify-center gap-2 transition-colors touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              type="button"
              aria-label={t.moveRight}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setRightHold(true);
              }}
              onPointerUp={() => setRightHold(false)}
              onPointerCancel={() => setRightHold(false)}
              onLostPointerCapture={() => setRightHold(false)}
              className="h-12 md:h-11 md:w-28 rounded-lg border border-white/12 bg-[#111c30] hover:bg-[#182640] active:bg-sky-500/20 active:border-sky-400/50 text-slate-100 inline-flex items-center justify-center gap-2 transition-colors touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </main>

      {/* Full-Screen Mini-Game ("اللعاب") — Arrow Escape Puzzle */}
      {gamesModalOpen && (
        <GamesModal
          lang={lang}
          sfxEnabled={sfxEnabled}
          onClose={closeGamesModal}
        />
      )}
    </div>
  );
}
