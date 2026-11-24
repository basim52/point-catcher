import React from 'react';
import { CornIcon } from './fruitWorld';
import { DIAMOND_COST_COINS, DiamondIcon } from './goldWorld';
import {
  SPACE_GALAXY_BONUS_COINS,
  SPACE_PULSAR_BONUS_COINS,
  SpaceCoinIcon,
  SpaceShipSkinId,
  SpaceStarIcon,
} from './spaceWorld';

export type CatcherSkinId = 'classic' | 'gold' | 'emerald' | 'royal' | 'ufo';
export type PlusPointSkinId = 'classic' | 'gems' | 'stars' | 'hearts' | 'coins';
export type MinusPointSkinId =
  | 'classic'
  | 'bombs'
  | 'skulls'
  | 'sawblades'
  | 'meteors';
export type SupplyId =
  | 'shield'
  | 'full_hearts'
  | 'full_corn'
  | 'full_diamonds'
  | 'one_heart'
  | 'one_corn'
  | 'one_diamond';
export type SpaceSupplyId = 'one_star' | 'space_shield' | 'full_stars';
export type ShopTab = 'skins' | 'points' | 'supplies' | 'upgrades' | 'space';
export type PointsSubTab = 'plus' | 'minus';

export interface ShopState {
  ownedSkins: CatcherSkinId[];
  equippedSkin: CatcherSkinId;
  ownedPlusSkins: PlusPointSkinId[];
  equippedPlusSkin: PlusPointSkinId;
  ownedMinusSkins: MinusPointSkinId[];
  equippedMinusSkin: MinusPointSkinId;
  shields: number;
  maxHeartsUpgrade: number;
  ownedSpaceSkins: SpaceShipSkinId[];
  equippedSpaceSkin: SpaceShipSkinId;
  maxStarsUpgrade: number;
  spaceMagnetLevel: number;
  spaceStartShieldLevel: number;
}

export interface SkinDefinition {
  id: CatcherSkinId;
  price: number;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
}

export interface SpaceSkinDefinition {
  id: SpaceShipSkinId;
  price: number;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
}

export interface SpaceSupplyDefinition {
  id: SpaceSupplyId;
  price: number;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
}

export interface PointSkinDefinition<T extends string> {
  id: T;
  price: number;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
}

export interface SupplyDefinition {
  id: SupplyId;
  price: number;
  currency?: 'gold' | 'pink';
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
}

export const SHOP_STORAGE_KEY = 'point_catcher_shop_v1';
export const MAX_SHIELDS = 5;
export const SHIELD_DURATION = 2;
export const MAX_HEARTS_UPGRADE_LEVELS = 5;
// Expensive progressive Pink Coin costs for +1 Max Heart per level (10 -> 11 -> 12 -> 13 -> 14 -> 15)
export const MAX_HEARTS_UPGRADE_COSTS: readonly number[] = [180, 300, 450, 675, 975];

export const MAX_STARS_UPGRADE_LEVELS = 5;
export const MAX_STARS_UPGRADE_COSTS: readonly number[] = [120, 220, 350, 500, 700];
export const SPACE_MAGNET_LEVELS = 3;
export const SPACE_MAGNET_COSTS: readonly number[] = [160, 320, 520];
export const SPACE_START_SHIELD_LEVELS = 3;
export const SPACE_START_SHIELD_COSTS: readonly number[] = [140, 280, 460];
export const SPACE_START_SHIELD_DURATIONS: readonly number[] = [0, 3, 5, 8];

export const SPACE_SKIN_CATALOG: SpaceSkinDefinition[] = [
  {
    id: 'default',
    price: 0,
    nameAr: 'المكوك الكوني',
    nameEn: 'Cosmic Shuttle',
    descAr: 'مركبة الفضاء الأصلية بمحركات أيونية زرقاء وهيكل بنفسجي مضيء.',
    descEn: 'Original deep-space plasma shuttle with blue ion thrusters.',
  },
  {
    id: 'nebula_cruiser',
    price: 90,
    nameAr: 'طرادة السديم',
    nameEn: 'Nebula Cruiser',
    descAr: 'هيكل سديمي أرجواني-وردي مع شعاع طاقة سماوي ومحركات بلازما فائقة.',
    descEn: 'Vibrant magenta-violet nebula hull with cyan plasma ribbon.',
  },
  {
    id: 'solar_phoenix',
    price: 180,
    nameAr: 'عنقاء الشمس',
    nameEn: 'Solar Phoenix',
    descAr: 'مركبة ذهبية ملتهبة بنواة شمسية وشعاع حراري متوهج في عالم الفضاء.',
    descEn: 'Blazing golden solar-phoenix hull with fiery orange thrusters.',
  },
  {
    id: 'galaxy_emperor',
    price: 300,
    nameAr: 'إمبراطور المجرة',
    nameEn: 'Galaxy Emperor',
    descAr: 'أفخم مركبة كونية بتاج ذهبي و3 محركات دفع زمردية وشعاع شفق قوس قزح!',
    descEn: 'Royal triple-thruster flagship crowned in gold with emerald aurora beams!',
  },
];

export const SPACE_SUPPLY_CATALOG: SpaceSupplyDefinition[] = [
  {
    id: 'one_star',
    price: 30,
    nameAr: '+1 نجمة فضاء',
    nameEn: '+1 Space Star',
    descAr: 'تضيف نجمة حياة واحدة لعالم الفضاء فوراً (وإذا امتلأت تُخزَّن في الحقيبة).',
    descEn: 'Adds 1 Star life for Space World immediately (stores in Bag if full).',
  },
  {
    id: 'space_shield',
    price: 50,
    nameAr: '+1 درع فضائي',
    nameEn: '+1 Cosmic Shield',
    descAr: 'يضيف شحنة درع حماية واحدة تعمل تلقائياً لحمايتك من العوائق لمدة ثانيتين (حتى 5 دروع).',
    descEn: 'Adds 1 auto-activating protection shield charge blocking hazards for 2s (up to 5).',
  },
  {
    id: 'full_stars',
    price: 160,
    nameAr: 'تعبئة نجوم الفضاء بالكامل',
    nameEn: 'Full Stars Refill',
    descAr: 'تعبّئ جميع نجوم حياتك في عالم الفضاء إلى الحد الأقصى دفعة واحدة.',
    descEn: 'Refills your entire Space World Star pool back to maximum capacity.',
  },
];

export const SKIN_CATALOG: SkinDefinition[] = [
  {
    id: 'classic',
    price: 0,
    nameAr: 'السماوي الكلاسيكي',
    nameEn: 'Classic Sky',
    descAr: 'التصميم الأصلي الأنيق باللون السماوي وشعاع الالتقاط المضيء.',
    descEn: 'Original sky-blue hull with luminous energy catch beam.',
  },
  {
    id: 'gold',
    price: 20,
    nameAr: 'الملتقط الذهبي الملكي',
    nameEn: 'Royal Gold',
    descAr: 'هيكل ذهبي لامع مع جوهرة ياقوتية ومحركات لهب ذهبية.',
    descEn: 'Polished gold hull with ruby core jewel and golden thrusters.',
  },
  {
    id: 'emerald',
    price: 24,
    nameAr: 'الزمرد النيون',
    nameEn: 'Neon Emerald',
    descAr: 'هيكل زمردي مشع بشعاع طاقة أخضر وتفاصيل نيون حادة.',
    descEn: 'Radiant emerald chassis with bright jade energy field.',
  },
  {
    id: 'royal',
    price: 30,
    nameAr: 'الأرجواني الفضائي',
    nameEn: 'Cosmic Amethyst',
    descAr: 'تصميم بنفسجي فاخر بنواة متوهجة وحواف لؤلؤية.',
    descEn: 'Deep amethyst hull with radiant star core and pearl trim.',
  },
  {
    id: 'ufo',
    price: 36,
    nameAr: 'صحن الفضاء الطائر',
    nameEn: 'Flying Saucer UFO',
    descAr: 'صحن فضائي ثلاثي الأبعاد بقبة زجاجية وأضواء دوّارة وشعاع جذب.',
    descEn: '3D flying saucer with glass dome, rotating lights, and tractor beam.',
  },
];

export const SUPPLY_CATALOG: SupplyDefinition[] = [
  {
    id: 'shield',
    price: 12,
    nameAr: 'درع الحماية',
    nameEn: 'Shield Charge',
    descAr: 'يتفعّل تلقائياً عند لمس أي عائق أو خضار ويحميك بالكامل لمدة ثانيتين بدون خسارة قلوب أو ذرة أو نقاط.',
    descEn: 'Auto-activates on hazard or vegetable contact and protects you for 2 full seconds without losing hearts, corn, or points (stacks up to 5).',
  },
  {
    id: 'one_heart',
    price: 5,
    nameAr: '+1 قلب',
    nameEn: '+1 Heart',
    descAr: 'يضيف قلباً واحداً فوراً مقابل 5 فلوس (وإذا امتلأت القلوب يُخزَّن في الحقيبة).',
    descEn: 'Adds 1 heart for 5 coins (stores in your Bag if hearts are already full).',
  },
  {
    id: 'one_corn',
    price: 5,
    nameAr: '+1 ذرة',
    nameEn: '+1 Corn',
    descAr: 'يضيف ذرة واحدة فوراً مقابل 5 فلوس (وإذا امتلأت الذرة تُخزَّن في الحقيبة).',
    descEn: 'Adds 1 corn for 5 coins (stores in your Bag if corn is already full).',
  },
  {
    id: 'one_diamond',
    price: DIAMOND_COST_COINS,
    currency: 'pink',
    nameAr: '+1 ألماسة',
    nameEn: '+1 Diamond',
    descAr: `يضيف ألماسة (قلب) واحدة فوراً مقابل ${DIAMOND_COST_COINS} عملة وردية (وإذا امتلأ الألماس يُخزَّن في الحقيبة).`,
    descEn: `Adds 1 diamond for ${DIAMOND_COST_COINS} Pink Coins (stores in your Bag if diamonds are already full).`,
  },
  {
    id: 'full_hearts',
    price: 100,
    nameAr: 'تعبئة القلوب (10/10)',
    nameEn: 'Full Hearts Refill',
    descAr: 'يعبّئ رصيد القلوب بالكامل إلى 10/10 دفعة واحدة.',
    descEn: 'Refills your entire Normal Stages heart pool back to 10/10.',
  },
  {
    id: 'full_corn',
    price: 100,
    nameAr: 'تعبئة الذرة (10/10)',
    nameEn: 'Full Corn Refill',
    descAr: 'يعبّئ رصيد الذرة في عالم الفواكه بالكامل إلى 10/10 دفعة واحدة.',
    descEn: 'Refills your entire Fruit World corn pool back to 10/10.',
  },
  {
    id: 'full_diamonds',
    price: 400,
    currency: 'pink',
    nameAr: 'تعبئة الألماس (10/10)',
    nameEn: 'Full Diamonds Refill',
    descAr: 'يعبّئ رصيد الألماس في مراحل الذهب بالكامل إلى 10/10 دفعة واحدة مقابل 400 عملة وردية.',
    descEn: 'Refills your entire Gold Stages diamond pool back to 10/10 for 400 Pink Coins.',
  },
];

export const PLUS_POINT_CATALOG: PointSkinDefinition<PlusPointSkinId>[] = [
  {
    id: 'classic',
    price: 0,
    nameAr: 'النقاط الكلاسيكية',
    nameEn: 'Classic Shapes',
    descAr: 'الدائرة الوردية (+1)، الدائرة الخضراء (+2)، والمثلث الأزرق (+3) الأصلية.',
    descEn: 'Original pink circle (+1), green orb (+2), and blue triangle (+3).',
  },
  {
    id: 'gems',
    price: 18,
    nameAr: 'الجواهر الماسية',
    nameEn: 'Cut Diamonds',
    descAr: 'تحوّل النقاط الإيجابية إلى ألماسات مقطوعة ثلاثية الأبعاد بلمعان كريستالي.',
    descEn: 'Transforms positive points into faceted 3D diamonds with crystal shine.',
  },
  {
    id: 'stars',
    price: 24,
    nameAr: 'النجوم المتوهجة',
    nameEn: 'Glowing Stars',
    descAr: 'تحوّل النقاط إلى نجوم خماسية لامعة تدور بنعومة مع هالة مضيئة.',
    descEn: 'Turns positive points into radiant spinning 5-point stars.',
  },
  {
    id: 'hearts',
    price: 28,
    nameAr: 'القلوب اللامعة',
    nameEn: 'Glossy Hearts',
    descAr: 'تحوّل النقاط إلى قلوب زجاجية ثلاثية الأبعاد بألوان زاهية لكل قيمة.',
    descEn: 'Turns positive points into glossy 3D hearts color-coded by value.',
  },
  {
    id: 'coins',
    price: 34,
    nameAr: 'الميداليات الملكية',
    nameEn: 'Royal Medallions',
    descAr: 'عملات فاخرة بإطار ذهبي محفور ونواة ملوّنة تبرز قيمة كل نقطة.',
    descEn: 'Gold-rimmed collector medallions with vibrant value-coded cores.',
  },
];

export const MINUS_POINT_CATALOG: PointSkinDefinition<MinusPointSkinId>[] = [
  {
    id: 'classic',
    price: 0,
    nameAr: 'العوائق الكلاسيكية',
    nameEn: 'Classic Hazards',
    descAr: 'الأشواك الحمراء، المربع (-2)، السهم السريع، ونجمة التجميد الأصلية.',
    descEn: 'Original red spikes, heavy squares (-2), fast arrows, and freeze stars.',
  },
  {
    id: 'bombs',
    price: 20,
    nameAr: 'القنابل المشتعلة',
    nameEn: 'Lit Bombs',
    descAr: 'تحوّل العوائق إلى قنابل سوداء وحمراء ثلاثية الأبعاد بفتيل مشتعل.',
    descEn: 'Transforms hazards into 3D lit bombs with glowing fuses and sparks.',
  },
  {
    id: 'skulls',
    price: 26,
    nameAr: 'جماجم الخطر',
    nameEn: 'Danger Skulls',
    descAr: 'تحوّل العوائق إلى شارات جماجم قرمزية متوهجة بعيون حمراء حادة.',
    descEn: 'Turns hazards into glowing crimson warning skulls with piercing eyes.',
  },
  {
    id: 'sawblades',
    price: 30,
    nameAr: 'شفرات المنشار',
    nameEn: 'Crimson Sawblades',
    descAr: 'تحوّل العوائق إلى شفرات منشار معدنية حادة دوّارة بنواة نارية.',
    descEn: 'Turns hazards into spinning serrated metal sawblades with fiery cores.',
  },
  {
    id: 'meteors',
    price: 35,
    nameAr: 'النيازك الملتهبة',
    nameEn: 'Flaming Meteors',
    descAr: 'تحوّل العوائق إلى صخور نيازك بركانية مشتعلة بحمم متوهجة.',
    descEn: 'Turns hazards into molten volcanic meteors blazing with magma.',
  },
];

const VALID_SKIN_IDS: CatcherSkinId[] = SKIN_CATALOG.map((s) => s.id);
const VALID_PLUS_IDS: PlusPointSkinId[] = PLUS_POINT_CATALOG.map((s) => s.id);
const VALID_MINUS_IDS: MinusPointSkinId[] = MINUS_POINT_CATALOG.map((s) => s.id);
const VALID_SPACE_SKIN_IDS: SpaceShipSkinId[] = SPACE_SKIN_CATALOG.map((s) => s.id);

export function getDefaultShopState(): ShopState {
  return {
    ownedSkins: ['classic'],
    equippedSkin: 'classic',
    ownedPlusSkins: ['classic'],
    equippedPlusSkin: 'classic',
    ownedMinusSkins: ['classic'],
    equippedMinusSkin: 'classic',
    shields: 0,
    maxHeartsUpgrade: 0,
    ownedSpaceSkins: ['default'],
    equippedSpaceSkin: 'default',
    maxStarsUpgrade: 0,
    spaceMagnetLevel: 0,
    spaceStartShieldLevel: 0,
  };
}

export function readStoredShopState(): ShopState {
  const fallback = getDefaultShopState();
  try {
    const raw = window.localStorage.getItem(SHOP_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;

    const rawOwned = Array.isArray(parsed.ownedSkins) ? parsed.ownedSkins : [];
    const ownedSet = new Set<CatcherSkinId>(['classic']);
    for (const s of rawOwned) {
      if (typeof s === 'string' && VALID_SKIN_IDS.includes(s as CatcherSkinId)) {
        ownedSet.add(s as CatcherSkinId);
      }
    }
    const ownedSkins = Array.from(ownedSet);
    const equippedSkin: CatcherSkinId =
      typeof parsed.equippedSkin === 'string' &&
      ownedSet.has(parsed.equippedSkin as CatcherSkinId)
        ? (parsed.equippedSkin as CatcherSkinId)
        : 'classic';

    const rawPlusOwned = Array.isArray(parsed.ownedPlusSkins)
      ? parsed.ownedPlusSkins
      : [];
    const ownedPlusSet = new Set<PlusPointSkinId>(['classic']);
    for (const s of rawPlusOwned) {
      if (typeof s === 'string' && VALID_PLUS_IDS.includes(s as PlusPointSkinId)) {
        ownedPlusSet.add(s as PlusPointSkinId);
      }
    }
    const ownedPlusSkins = Array.from(ownedPlusSet);
    const equippedPlusSkin: PlusPointSkinId =
      typeof parsed.equippedPlusSkin === 'string' &&
      ownedPlusSet.has(parsed.equippedPlusSkin as PlusPointSkinId)
        ? (parsed.equippedPlusSkin as PlusPointSkinId)
        : 'classic';

    const rawMinusOwned = Array.isArray(parsed.ownedMinusSkins)
      ? parsed.ownedMinusSkins
      : [];
    const ownedMinusSet = new Set<MinusPointSkinId>(['classic']);
    for (const s of rawMinusOwned) {
      if (
        typeof s === 'string' &&
        VALID_MINUS_IDS.includes(s as MinusPointSkinId)
      ) {
        ownedMinusSet.add(s as MinusPointSkinId);
      }
    }
    const ownedMinusSkins = Array.from(ownedMinusSet);
    const equippedMinusSkin: MinusPointSkinId =
      typeof parsed.equippedMinusSkin === 'string' &&
      ownedMinusSet.has(parsed.equippedMinusSkin as MinusPointSkinId)
        ? (parsed.equippedMinusSkin as MinusPointSkinId)
        : 'classic';

    const rawSpaceOwned = Array.isArray(parsed.ownedSpaceSkins)
      ? parsed.ownedSpaceSkins
      : [];
    const ownedSpaceSet = new Set<SpaceShipSkinId>(['default']);
    for (const s of rawSpaceOwned) {
      if (
        typeof s === 'string' &&
        VALID_SPACE_SKIN_IDS.includes(s as SpaceShipSkinId)
      ) {
        ownedSpaceSet.add(s as SpaceShipSkinId);
      }
    }
    const ownedSpaceSkins = Array.from(ownedSpaceSet);
    const equippedSpaceSkin: SpaceShipSkinId =
      typeof parsed.equippedSpaceSkin === 'string' &&
      ownedSpaceSet.has(parsed.equippedSpaceSkin as SpaceShipSkinId)
        ? (parsed.equippedSpaceSkin as SpaceShipSkinId)
        : 'default';

    const shields = clampInt(parsed.shields, 0, MAX_SHIELDS);
    const maxHeartsUpgrade = clampInt(
      parsed.maxHeartsUpgrade,
      0,
      MAX_HEARTS_UPGRADE_LEVELS
    );
    const maxStarsUpgrade = clampInt(
      parsed.maxStarsUpgrade,
      0,
      MAX_STARS_UPGRADE_LEVELS
    );
    const spaceMagnetLevel = clampInt(
      parsed.spaceMagnetLevel,
      0,
      SPACE_MAGNET_LEVELS
    );
    const spaceStartShieldLevel = clampInt(
      parsed.spaceStartShieldLevel,
      0,
      SPACE_START_SHIELD_LEVELS
    );

    return {
      ownedSkins,
      equippedSkin,
      ownedPlusSkins,
      equippedPlusSkin,
      ownedMinusSkins,
      equippedMinusSkin,
      shields,
      maxHeartsUpgrade,
      ownedSpaceSkins,
      equippedSpaceSkin,
      maxStarsUpgrade,
      spaceMagnetLevel,
      spaceStartShieldLevel,
    };
  } catch {
    return fallback;
  }
}

export function persistShopState(state: ShopState): void {
  try {
    window.localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function clampInt(val: unknown, min: number, max: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, Math.floor(val)));
}

export interface SkinPalette {
  accent: string;
  aura0: string;
  auraMid: string;
  beam1: string;
  flameMid: string;
  flameEnd: string;
  hullStops: [string, string, string, string];
  cockpit: string;
  core: string;
  tip: string;
}

export function getSkinPalette(skin: CatcherSkinId): SkinPalette {
  if (skin === 'gold') {
    return {
      accent: '#fbbf24',
      aura0: 'rgba(251, 191, 36, 0.56)',
      auraMid: 'rgba(245, 158, 11, 0.2)',
      beam1: 'rgba(253, 224, 71, 0.45)',
      flameMid: '#f59e0b',
      flameEnd: 'rgba(245, 158, 11, 0)',
      hullStops: ['#fffbeb', '#fde68a', '#f59e0b', '#92400e'],
      cockpit: '#291506',
      core: '#f43f5e',
      tip: '#fef08a',
    };
  }
  if (skin === 'emerald') {
    return {
      accent: '#34d399',
      aura0: 'rgba(16, 185, 129, 0.56)',
      auraMid: 'rgba(5, 150, 105, 0.2)',
      beam1: 'rgba(110, 231, 183, 0.46)',
      flameMid: '#10b981',
      flameEnd: 'rgba(16, 185, 129, 0)',
      hullStops: ['#ecfdf5', '#a7f3d0', '#10b981', '#065f46'],
      cockpit: '#042319',
      core: '#fde047',
      tip: '#6ee7b7',
    };
  }
  if (skin === 'royal') {
    return {
      accent: '#c084fc',
      aura0: 'rgba(168, 85, 247, 0.56)',
      auraMid: 'rgba(126, 34, 206, 0.22)',
      beam1: 'rgba(216, 180, 254, 0.46)',
      flameMid: '#a855f7',
      flameEnd: 'rgba(168, 85, 247, 0)',
      hullStops: ['#faf5ff', '#e9d5ff', '#9333ea', '#4c1d95'],
      cockpit: '#1c0b33',
      core: '#f472b6',
      tip: '#f0abfc',
    };
  }
  return {
    accent: '#38bdf8',
    aura0: 'rgba(56, 189, 248, 0.52)',
    auraMid: 'rgba(14, 165, 233, 0.18)',
    beam1: 'rgba(125, 211, 252, 0.42)',
    flameMid: '#38bdf8',
    flameEnd: 'rgba(56, 189, 248, 0)',
    hullStops: ['#ffffff', '#e0f2fe', '#38bdf8', '#0369a1'],
    cockpit: '#0c1930',
    core: '#fde047',
    tip: '#fbbf24',
  };
}

export function drawUfoCatcher(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tilt: number,
  scaleX: number,
  scaleY: number,
  isFrozen: boolean,
  isTurbo: boolean,
  glowColor: string,
  glowAlpha: number
): void {
  const halfW = w / 2;
  const halfH = h / 2;
  const isCatchFlash = glowAlpha > 0.05;
  const tNow = performance.now() * 0.006;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scaleX, scaleY);

  // Ambient UFO glow
  const auraGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, w * 0.95);
  auraGrad.addColorStop(
    0,
    isFrozen
      ? 'rgba(186, 230, 253, 0.65)'
      : isCatchFlash
      ? `${glowColor}99`
      : isTurbo
      ? 'rgba(52, 211, 153, 0.62)'
      : 'rgba(56, 189, 248, 0.52)'
  );
  auraGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.92, h * 1.65, 0, 0, Math.PI * 2);
  ctx.fill();

  // Upward tractor beam
  const beamGrad = ctx.createLinearGradient(0, -halfH - 22, 0, -halfH);
  beamGrad.addColorStop(0, 'rgba(167, 243, 208, 0)');
  beamGrad.addColorStop(
    1,
    isCatchFlash ? `${glowColor}88` : 'rgba(52, 211, 153, 0.45)'
  );
  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(-halfW * 0.65, -halfH - 20);
  ctx.lineTo(halfW * 0.65, -halfH - 20);
  ctx.lineTo(halfW * 0.42, -halfH + 2);
  ctx.lineTo(-halfW * 0.42, -halfH + 2);
  ctx.closePath();
  ctx.fill();

  // Glass upper dome
  const domeGrad = ctx.createRadialGradient(-6, -halfH - 6, 2, 0, -halfH, halfW * 0.55);
  domeGrad.addColorStop(0, '#ecfeff');
  domeGrad.addColorStop(0.45, '#67e8f9');
  domeGrad.addColorStop(1, '#0e7490');
  ctx.fillStyle = domeGrad;
  ctx.beginPath();
  ctx.ellipse(0, -halfH + 4, halfW * 0.46, halfH * 0.95, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(207, 250, 254, 0.9)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Metallic saucer rim body
  const saucerGrad = ctx.createLinearGradient(0, -halfH + 2, 0, halfH + 2);
  saucerGrad.addColorStop(0, '#f8fafc');
  saucerGrad.addColorStop(0.45, '#94a3b8');
  saucerGrad.addColorStop(1, '#334155');
  ctx.fillStyle = saucerGrad;
  ctx.beginPath();
  ctx.ellipse(0, 3, halfW * 1.02, halfH * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Orbiting glowing saucer lights
  const lightCount = 5;
  for (let i = 0; i < lightCount; i++) {
    const frac = (i / (lightCount - 1)) * 2 - 1;
    const lx = frac * (halfW * 0.72);
    const ly = 3 + Math.cos(frac * 1.2) * 2.5;
    const blink = 0.5 + 0.5 * Math.sin(tNow + i * 1.1);
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fillStyle =
      blink > 0.5
        ? isTurbo
          ? '#34d399'
          : '#fde047'
        : '#38bdf8';
    ctx.fill();
  }

  // Hover pulse glow beneath saucer
  if (!isFrozen) {
    const hoverGrad = ctx.createRadialGradient(0, halfH + 2, 2, 0, halfH + 4, halfW * 0.55);
    hoverGrad.addColorStop(0, 'rgba(52, 211, 153, 0.8)');
    hoverGrad.addColorStop(1, 'rgba(52, 211, 153, 0)');
    ctx.fillStyle = hoverGrad;
    ctx.beginPath();
    ctx.ellipse(0, halfH + 4, halfW * 0.55, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawCatcherShieldBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  shields: number,
  isFruitMode: boolean,
  activeTimer: number = 0
): void {
  const isActive = activeTimer > 0;
  if (shields <= 0 && !isActive) return;

  const rx = isFruitMode ? Math.max(38, w * 0.58) : w * 0.64;
  const ry = isFruitMode ? h * 1.75 : h * 1.28;
  const cy = isFruitMode ? y - h * 0.42 : y;
  const now = performance.now();
  const pulse = isActive
    ? activeTimer < 0.45
      ? 0.65 + 0.35 * Math.sin(now * 0.032)
      : 0.9 + 0.1 * Math.sin(now * 0.012)
    : 0.88 + 0.12 * Math.sin(now * 0.006);

  ctx.save();
  ctx.translate(x, cy);

  const grad = ctx.createRadialGradient(0, 0, rx * 0.35, 0, 0, rx);
  if (isActive) {
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
    grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.28)');
    grad.addColorStop(1, `rgba(186, 230, 253, ${0.72 * pulse})`);
  } else {
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.03)');
    grad.addColorStop(0.75, 'rgba(56, 189, 248, 0.14)');
    grad.addColorStop(1, `rgba(125, 211, 252, ${0.42 * pulse})`);
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isActive
    ? `rgba(224, 242, 254, ${0.95 * pulse})`
    : `rgba(186, 230, 253, ${0.78 * pulse})`;
  ctx.lineWidth = isActive ? 2.8 : 2;
  ctx.stroke();

  // Active 2-second protection timer bar & remaining seconds readout
  if (isActive) {
    const frac = Math.max(0, Math.min(1, activeTimer / SHIELD_DURATION));
    const barW = Math.min(72, Math.max(52, rx * 1.15));
    const barH = 5;
    const barY = -ry - 12;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(-barW / 2, barY, barW, barH, 2.5);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(-barW / 2, barY, barW * frac, barH, 2.5);
    ctx.fill();

    ctx.fillStyle = '#e0f2fe';
    ctx.font = '800 11px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${activeTimer.toFixed(1)}s`, 0, barY - 2);
  }

  // Small crisp count indicator at top-right of bubble when > 1 standby shield (or >= 1 while active)
  if ((isActive && shields > 0) || (!isActive && shields > 1)) {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(rx * 0.7, -ry * 0.65, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = '#e0f2fe';
    ctx.font = '800 10px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(shields), rx * 0.7, -ry * 0.65 + 0.5);
  }

  ctx.restore();
}

export interface PointCanvasRenderItem {
  kind: string;
  x: number;
  y: number;
  radius: number;
  rotation: number;
  pulsePhase: number;
}

export function drawCustomPlusPoint(
  ctx: CanvasRenderingContext2D,
  item: PointCanvasRenderItem,
  skin: PlusPointSkinId
): void {
  const isGreen = item.kind === 'green_circle';
  const isBlue = item.kind === 'blue_triangle';
  const isPurple = item.kind === 'purple_diamond';
  const isGold = item.kind === 'gold_star';
  const isRoyalNova = item.kind === 'royal_nova';
  const label = isRoyalNova
    ? '+10'
    : isGold
    ? '+7'
    : isPurple || item.kind === 'amber_crescent'
    ? '+5'
    : isBlue || item.kind === 'coral_pentagon' || item.kind === 'indigo_octagon'
    ? '+4'
    : isGreen
    ? '+2'
    : '+3';
  const r = item.radius;
  const pulse = 1 + Math.sin(item.pulsePhase) * 0.06;

  const light = isRoyalNova
    ? '#fdf4ff'
    : isGold
    ? '#fef9c3'
    : isPurple
    ? '#f3e8ff'
    : isBlue
    ? '#e0f2fe'
    : isGreen
    ? '#d1fae5'
    : '#fce7f3';
  const mid = isRoyalNova
    ? '#e879f9'
    : isGold
    ? '#fbbf24'
    : isPurple
    ? '#c084fc'
    : isBlue
    ? '#38bdf8'
    : isGreen
    ? '#10b981'
    : '#f472b6';
  const deep = isRoyalNova
    ? '#86198f'
    : isGold
    ? '#b45309'
    : isPurple
    ? '#6b21a8'
    : isBlue
    ? '#0369a1'
    : isGreen
    ? '#047857'
    : '#be185d';
  const glow = isRoyalNova
    ? 'rgba(232, 121, 249, 0.66)'
    : isGold
    ? 'rgba(251, 191, 36, 0.58)'
    : isPurple
    ? 'rgba(192, 132, 252, 0.54)'
    : isBlue
    ? 'rgba(56, 189, 248, 0.5)'
    : isGreen
    ? 'rgba(16, 185, 129, 0.52)'
    : 'rgba(244, 114, 182, 0.5)';

  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.scale(pulse, pulse);

  // Soft outer glow
  const aura = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, r * 1.55);
  aura.addColorStop(0, glow);
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
  ctx.fill();

  if (skin === 'gems') {
    ctx.save();
    ctx.rotate(Math.sin(item.pulsePhase * 0.45) * 0.14);
    const grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, light);
    grad.addColorStop(0.45, mid);
    grad.addColorStop(1, deep);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.12);
    ctx.lineTo(r * 0.96, -r * 0.12);
    ctx.lineTo(0, r * 1.12);
    ctx.lineTo(-r * 0.96, -r * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Inner crystal facet sheen
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.02);
    ctx.lineTo(r * 0.48, -r * 0.15);
    ctx.lineTo(-r * 0.48, -r * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (skin === 'stars') {
    ctx.save();
    ctx.rotate(item.rotation * 0.65);
    const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 2, 0, 0, r * 1.15);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, mid);
    grad.addColorStop(1, deep);
    ctx.fillStyle = grad;
    ctx.beginPath();
    const spikes = 5;
    const outerR = r * 1.16;
    const innerR = r * 0.54;
    for (let i = 0; i < spikes * 2; i++) {
      const ang = (i * Math.PI) / spikes - Math.PI / 2;
      const rad = i % 2 === 0 ? outerR : innerR;
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  } else if (skin === 'hearts') {
    ctx.save();
    ctx.rotate(Math.sin(item.pulsePhase * 0.5) * 0.1);
    const grad = ctx.createRadialGradient(-r * 0.28, -r * 0.3, 2, 0, 0, r * 1.2);
    grad.addColorStop(0, light);
    grad.addColorStop(0.45, mid);
    grad.addColorStop(1, deep);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.96);
    ctx.bezierCurveTo(-r * 1.22, r * 0.2, -r * 1.1, -r * 0.95, 0, -r * 0.34);
    ctx.bezierCurveTo(r * 1.1, -r * 0.95, r * 1.22, r * 0.2, 0, r * 0.96);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.7;
    ctx.stroke();

    // Gloss highlight
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.36, -r * 0.32, r * 0.22, r * 0.12, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Royal Medallions ('coins')
    const rimGrad = ctx.createLinearGradient(-r, -r, r, r);
    rimGrad.addColorStop(0, '#fef08a');
    rimGrad.addColorStop(0.5, '#f59e0b');
    rimGrad.addColorStop(1, '#92400e');
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.04, 0, Math.PI * 2);
    ctx.fill();

    const coreGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 2, 0, 0, r * 0.8);
    coreGrad.addColorStop(0, light);
    coreGrad.addColorStop(0.5, mid);
    coreGrad.addColorStop(1, deep);
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.04, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Crisp value readout (+1 / +2 / +3)
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.max(10, Math.round(r * 0.62))}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(15, 23, 42, 0.8)';
  ctx.shadowBlur = 4;
  ctx.fillText(label, 0, skin === 'hearts' ? -r * 0.04 : 0.5);

  ctx.restore();
}

export function drawCustomMinusPoint(
  ctx: CanvasRenderingContext2D,
  item: PointCanvasRenderItem,
  skin: MinusPointSkinId
): void {
  const isGiantBlack = item.kind === 'hazard_black_square';
  const isHeavy = item.kind === 'hazard_square';
  const isFreeze = item.kind === 'hazard_star';
  const isAmberArrow = item.kind === 'hazard_arrow_amber';
  const isVioletArrow = item.kind === 'hazard_arrow_violet';
  const isArrow =
    item.kind === 'hazard_arrow' || isAmberArrow || isVioletArrow;
  const r = item.radius;
  const pulse = 1 + Math.sin(item.pulsePhase * 1.2) * 0.05;

  const rimColor = isGiantBlack
    ? '#f87171'
    : isFreeze
    ? '#7dd3fc'
    : isAmberArrow
    ? '#fde68a'
    : isVioletArrow
    ? '#e9d5ff'
    : isHeavy
    ? '#fca5a5'
    : '#fecaca';
  const glowColor = isGiantBlack
    ? 'rgba(239, 68, 68, 0.52)'
    : isFreeze
    ? 'rgba(56, 189, 248, 0.45)'
    : isAmberArrow
    ? 'rgba(245, 158, 11, 0.52)'
    : isVioletArrow
    ? 'rgba(168, 85, 247, 0.52)'
    : isHeavy
    ? 'rgba(220, 38, 38, 0.58)'
    : 'rgba(239, 68, 68, 0.48)';

  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.scale(pulse, pulse);

  // Speed trail for arrow hazards
  if (isArrow) {
    const trailGrad = ctx.createLinearGradient(0, -r * 2.4, 0, -r * 0.4);
    trailGrad.addColorStop(
      0,
      isAmberArrow
        ? 'rgba(245, 158, 11, 0)'
        : isVioletArrow
        ? 'rgba(168, 85, 247, 0)'
        : 'rgba(239, 68, 68, 0)'
    );
    trailGrad.addColorStop(
      1,
      isAmberArrow
        ? 'rgba(251, 191, 36, 0.55)'
        : isVioletArrow
        ? 'rgba(192, 132, 252, 0.55)'
        : 'rgba(248, 113, 113, 0.55)'
    );
    ctx.fillStyle = trailGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.3);
    ctx.lineTo(0, -r * 2.5);
    ctx.lineTo(r * 0.45, -r * 0.3);
    ctx.closePath();
    ctx.fill();
  }

  // Danger aura
  const aura = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, r * 1.55);
  aura.addColorStop(0, glowColor);
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
  ctx.fill();

  if (skin === 'bombs') {
    // Fuse & glowing spark
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 0.2, -r * 0.85);
    ctx.quadraticCurveTo(r * 0.65, -r * 1.35, r * 0.9, -r * 1.05);
    ctx.stroke();

    const sparkR = 3.5 + Math.sin(item.pulsePhase * 3) * 1.3;
    ctx.fillStyle = isFreeze ? '#7dd3fc' : '#facc15';
    ctx.beginPath();
    ctx.arc(r * 0.9, -r * 1.05, sparkR, 0, Math.PI * 2);
    ctx.fill();

    // Bomb iron sphere
    const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
    bodyGrad.addColorStop(0, isFreeze ? '#38bdf8' : '#7f1d1d');
    bodyGrad.addColorStop(0.55, '#1e293b');
    bodyGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isFreeze ? '#7dd3fc' : '#ef4444';
    ctx.lineWidth = isHeavy ? 2.6 : 1.9;
    ctx.stroke();

    // Top fuse cap
    ctx.fillStyle = '#475569';
    ctx.fillRect(-r * 0.22, -r * 1.08, r * 0.44, r * 0.24);
  } else if (skin === 'skulls') {
    // Crimson danger medallion with crisp skull silhouette
    const bgGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.25, 2, 0, 0, r * 1.05);
    bgGrad.addColorStop(0, isFreeze ? '#38bdf8' : '#ef4444');
    bgGrad.addColorStop(0.65, isFreeze ? '#0c4a6e' : '#991b1b');
    bgGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = isHeavy ? 2.6 : 1.8;
    ctx.stroke();

    // Skull cranium + jaw
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, -r * 0.14, r * 0.56, Math.PI * 0.82, Math.PI * 2.18);
    ctx.lineTo(r * 0.34, r * 0.48);
    ctx.lineTo(-r * 0.34, r * 0.48);
    ctx.closePath();
    ctx.fill();

    // Glowing red / icy eye sockets
    ctx.fillStyle = isFreeze ? '#0284c7' : '#dc2626';
    ctx.beginPath();
    ctx.arc(-r * 0.22, -r * 0.12, r * 0.15, 0, Math.PI * 2);
    ctx.arc(r * 0.22, -r * 0.12, r * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Teeth lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.12, r * 0.26);
    ctx.lineTo(-r * 0.12, r * 0.48);
    ctx.moveTo(r * 0.12, r * 0.26);
    ctx.lineTo(r * 0.12, r * 0.48);
    ctx.stroke();
  } else if (skin === 'sawblades') {
    ctx.save();
    ctx.rotate(item.rotation * 2.2);
    const teeth = isHeavy ? 10 : 8;
    const outerR = r * 1.12;
    const innerR = r * 0.72;
    const bladeGrad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, outerR);
    bladeGrad.addColorStop(0, isFreeze ? '#bae6fd' : '#fca5a5');
    bladeGrad.addColorStop(0.55, isFreeze ? '#0284c7' : '#dc2626');
    bladeGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * Math.PI * 2;
      const a1 = ((i + 0.42) / teeth) * Math.PI * 2;
      const a2 = ((i + 0.85) / teeth) * Math.PI * 2;
      if (i === 0) ctx.moveTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
      else ctx.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
      ctx.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
      ctx.lineTo(Math.cos(a2) * innerR, Math.sin(a2) * innerR);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  } else {
    // Flaming Meteors ('meteors')
    const flameGrad = ctx.createLinearGradient(0, -r * 1.9, 0, r * 0.4);
    flameGrad.addColorStop(0, isFreeze ? 'rgba(125,211,252,0)' : 'rgba(251,146,60,0)');
    flameGrad.addColorStop(0.65, isFreeze ? 'rgba(56,189,248,0.55)' : 'rgba(249,115,22,0.6)');
    flameGrad.addColorStop(1, isFreeze ? '#7dd3fc' : '#ef4444');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, 0);
    ctx.quadraticCurveTo(0, -r * 2.1, r * 0.85, 0);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.rotate(item.rotation * 0.7);
    const rockGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 2, 0, 0, r);
    rockGrad.addColorStop(0, isFreeze ? '#bae6fd' : '#fb923c');
    rockGrad.addColorStop(0.45, isFreeze ? '#0369a1' : '#991b1b');
    rockGrad.addColorStop(1, '#1c1917');
    ctx.fillStyle = rockGrad;
    ctx.beginPath();
    const pts = 7;
    for (let i = 0; i < pts; i++) {
      const ang = (i / pts) * Math.PI * 2;
      const rad = r * (i % 2 === 0 ? 1.02 : 0.82);
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = isFreeze ? '#e0f2fe' : '#fde047';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  // Distinct crisp indicator badge for -3 Giant Black Square, -2 Heavy Square, or Freeze Star
  if (isGiantBlack) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.max(12, Math.round(r * 0.58))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(220, 38, 38, 0.95)';
    ctx.shadowBlur = 5;
    ctx.fillText('-3', 0, 1);
  } else if (isHeavy) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.max(10, Math.round(r * 0.62))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText('-2', 0, 1);
  } else if (isFreeze) {
    ctx.fillStyle = '#e0f2fe';
    ctx.font = `900 ${Math.max(11, Math.round(r * 0.66))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(2, 132, 199, 0.9)';
    ctx.shadowBlur = 5;
    ctx.fillText('❄', 0, 1);
  } else if (isAmberArrow) {
    ctx.fillStyle = '#fef3c7';
    ctx.font = `900 ${Math.max(9.5, Math.round(r * 0.58))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(120, 53, 15, 0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText('-2', 0, 1);
  } else if (isVioletArrow) {
    ctx.fillStyle = '#f3e8ff';
    ctx.font = `900 ${Math.max(10, Math.round(r * 0.62))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(88, 28, 135, 0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText('▼', 0, 1);
  } else if (
    item.kind === 'minus_crimson_hex' ||
    item.kind === 'minus_rust_diamond' ||
    item.kind === 'minus_slate_cross' ||
    item.kind === 'minus_teal_bolt' ||
    item.kind === 'minus_plum_ring'
  ) {
    const minusText =
      item.kind === 'minus_plum_ring'
        ? '-5'
        : item.kind === 'minus_rust_diamond' || item.kind === 'minus_teal_bolt'
        ? '-4'
        : '-3';
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.max(9.5, Math.round(r * 0.58))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(15, 23, 42, 0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText(minusText, 0, 1);
  } else if (skin === 'bombs') {
    ctx.fillStyle = '#fecaca';
    ctx.font = `900 ${Math.max(10, Math.round(r * 0.56))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isArrow ? '↓' : '-1', 0, 1);
  }

  ctx.restore();
}

function CoinMiniIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-3.5 h-3.5 text-amber-400 shrink-0"
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
  );
}

export function PinkCoinIcon({ className = 'w-3.5 h-3.5 shrink-0' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        fill="#ec4899"
        stroke="#fbcfe8"
        strokeWidth="1.7"
      />
      <circle
        cx="12"
        cy="12"
        r="5.6"
        fill="none"
        stroke="#9d174d"
        strokeWidth="1.4"
      />
      <polygon
        points="12,8 15,12 12,16 9,12"
        fill="#fdf2f8"
        fillOpacity="0.92"
      />
    </svg>
  );
}

function SkinArt({ id }: { id: CatcherSkinId }) {
  if (id === 'ufo') {
    return (
      <svg viewBox="0 0 36 24" className="w-9 h-7">
        <ellipse cx="18" cy="10" rx="8" ry="6" fill="#67e8f9" stroke="#ecfeff" strokeWidth="1.2" />
        <ellipse cx="18" cy="14" rx="15" ry="5" fill="#94a3b8" stroke="#ffffff" strokeWidth="1.3" />
        <circle cx="10" cy="14" r="1.5" fill="#fde047" />
        <circle cx="18" cy="15" r="1.5" fill="#34d399" />
        <circle cx="26" cy="14" r="1.5" fill="#fde047" />
      </svg>
    );
  }
  const pal = getSkinPalette(id);
  return (
    <svg viewBox="0 0 36 24" className="w-9 h-7">
      <path
        d="M3 8h5l2 3h16l2-3h5c1 4 0 9-4 10H7C3 17 2 12 3 8z"
        fill={pal.hullStops[2]}
        stroke="#ffffff"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <rect x="9" y="10" width="18" height="3.2" rx="1.6" fill={pal.accent} />
      <circle cx="18" cy="14.2" r="2" fill={pal.core} />
    </svg>
  );
}

function SupplyArt({ id }: { id: SupplyId }) {
  if (id === 'shield') {
    return (
      <svg viewBox="0 0 24 24" className="w-7 h-7 text-sky-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.2" />
      </svg>
    );
  }
  if (id === 'one_corn' || id === 'full_corn') {
    return <CornIcon className="w-7 h-7" />;
  }
  if (id === 'one_diamond' || id === 'full_diamonds') {
    return <DiamondIcon className="w-7 h-7" />;
  }
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 text-rose-500" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function PlusPointArt({ id }: { id: PlusPointSkinId }) {
  if (id === 'gems') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="14,3 24,13 14,25 4,13"
          fill="#38bdf8"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <polygon points="14,4 19,12 9,12" fill="rgba(255,255,255,0.45)" />
      </svg>
    );
  }
  if (id === 'stars') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="14,3 17.2,10.2 25,11 19,16.2 20.8,24 14,19.8 7.2,24 9,16.2 3,11 10.8,10.2"
          fill="#f472b6"
          stroke="#ffffff"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (id === 'hearts') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <path
          d="M14 24.2C6 18.8 3.5 14 3.5 9.8 3.5 6.4 6.2 4 9.3 4c2 0 3.7 1 4.7 2.6C15 5 16.7 4 18.7 4c3.1 0 5.8 2.4 5.8 5.8 0 4.2-2.5 9-10.5 14.4z"
          fill="#10b981"
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  if (id === 'coins') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <circle cx="14" cy="14" r="10.5" fill="#f59e0b" stroke="#fef3c7" strokeWidth="1.5" />
        <circle cx="14" cy="14" r="7.5" fill="#38bdf8" />
        <text x="14" y="17" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="800">
          +3
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 28 28" className="w-7 h-7">
      <circle cx="9.5" cy="16.5" r="6" fill="#f472b6" stroke="#ffffff" strokeWidth="1.3" />
      <polygon points="19,5 25,16 13,16" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function MinusPointArt({ id }: { id: MinusPointSkinId }) {
  if (id === 'bombs') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <path d="M16 7 Q20 3 23 5" fill="none" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" />
        <circle cx="23.5" cy="5.5" r="2.2" fill="#facc15" />
        <circle cx="13" cy="16" r="8.5" fill="#1e293b" stroke="#ef4444" strokeWidth="1.8" />
        <text x="13" y="19" textAnchor="middle" fill="#fecaca" fontSize="8" fontWeight="800">
          -1
        </text>
      </svg>
    );
  }
  if (id === 'skulls') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <circle cx="14" cy="14" r="10.5" fill="#991b1b" stroke="#fecaca" strokeWidth="1.5" />
        <path d="M8.5 13.5a5.5 5.5 0 1 1 11 0v3.5h-2.5v2h-6v-2H8.5z" fill="#f8fafc" />
        <circle cx="11.8" cy="13.2" r="1.5" fill="#dc2626" />
        <circle cx="16.2" cy="13.2" r="1.5" fill="#dc2626" />
      </svg>
    );
  }
  if (id === 'sawblades') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="14,2.5 16.5,7.2 21.8,5.8 20.5,11 25.5,14 20.5,17 21.8,22.2 16.5,20.8 14,25.5 11.5,20.8 6.2,22.2 7.5,17 2.5,14 7.5,11 6.2,5.8 11.5,7.2"
          fill="#dc2626"
          stroke="#fecaca"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="14" r="3.6" fill="#0f172a" stroke="#ffffff" strokeWidth="1.2" />
      </svg>
    );
  }
  if (id === 'meteors') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <path d="M7 15 Q14 2 21 15 Z" fill="#f97316" fillOpacity="0.7" />
        <polygon
          points="14,7 21,11 22,19 16,24 9,23 6,16 8,10"
          fill="#991b1b"
          stroke="#fde047"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 28 28" className="w-7 h-7">
      <polygon
        points="14,3 17,10 24,10 18.5,15 20.5,22 14,18 7.5,22 9.5,15 4,10 11,10"
        fill="#ef4444"
        stroke="#fecaca"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpaceShipArt({ id }: { id: SpaceShipSkinId }) {
  const colors =
    id === 'nebula_cruiser'
      ? { hull: '#a855f7', stroke: '#f5d0fe', beam: '#22d3ee', visor: '#f472b6' }
      : id === 'solar_phoenix'
      ? { hull: '#ea580c', stroke: '#fde68a', beam: '#fef08a', visor: '#fbbf24' }
      : id === 'galaxy_emperor'
      ? { hull: '#0f766e', stroke: '#fde047', beam: '#34d399', visor: '#c084fc' }
      : { hull: '#4c1d95', stroke: '#c4b5fd', beam: '#38bdf8', visor: '#a5f3fc' };

  return (
    <svg viewBox="0 0 36 24" className="w-9 h-7">
      <path
        d="M3 8 L7 4 L11 10 L25 10 L29 4 L33 8 Q32 18 24 18 L12 18 Q4 18 3 8 Z"
        fill={colors.hull}
        stroke={colors.stroke}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M9 8 Q18 12 27 8"
        fill="none"
        stroke={colors.beam}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="13" y="12.5" width="10" height="3.2" rx="1.6" fill={colors.visor} />
      {id === 'galaxy_emperor' && (
        <polygon points="18,6 20.5,9.5 18,11 15.5,9.5" fill="#fde047" />
      )}
    </svg>
  );
}

interface ShopModalProps {
  lang: 'ar' | 'en';
  coins: number;
  pinkCoins: number;
  spaceCoins: number;
  lives: number;
  maxLives: number;
  corn: number;
  maxCorn: number;
  diamonds: number;
  maxDiamonds: number;
  stars: number;
  maxStars: number;
  shop: ShopState;
  activeTab: ShopTab;
  pointsSubTab: PointsSubTab;
  onChangeTab: (tab: ShopTab) => void;
  onChangePointsSubTab: (sub: PointsSubTab) => void;
  onClose: () => void;
  onSelectOrBuySkin: (id: CatcherSkinId) => void;
  onSelectOrBuyPlusSkin: (id: PlusPointSkinId) => void;
  onSelectOrBuyMinusSkin: (id: MinusPointSkinId) => void;
  onBuySupply: (id: SupplyId) => void;
  onBuyMaxHeartsUpgrade: () => void;
  onSelectOrBuySpaceSkin: (id: SpaceShipSkinId) => void;
  onBuySpaceSupply: (id: SpaceSupplyId) => void;
  onBuyMaxStarsUpgrade: () => void;
  onBuySpaceMagnetUpgrade: () => void;
  onBuySpaceStartShieldUpgrade: () => void;
}

export function ShopModal({
  lang,
  coins,
  pinkCoins,
  spaceCoins,
  lives,
  maxLives,
  corn,
  maxCorn,
  diamonds,
  maxDiamonds,
  stars,
  maxStars,
  shop,
  activeTab,
  pointsSubTab,
  onChangeTab,
  onChangePointsSubTab,
  onClose,
  onSelectOrBuySkin,
  onSelectOrBuyPlusSkin,
  onSelectOrBuyMinusSkin,
  onBuySupply,
  onBuyMaxHeartsUpgrade,
  onSelectOrBuySpaceSkin,
  onBuySpaceSupply,
  onBuyMaxStarsUpgrade,
  onBuySpaceMagnetUpgrade,
  onBuySpaceStartShieldUpgrade,
}: ShopModalProps) {
  const isAr = lang === 'ar';

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5 bg-[#060c17]/82 backdrop-blur-[4px]">
      <div className="w-full max-w-lg max-h-full flex flex-col rounded-xl border border-white/14 bg-[#0f1a2e]/98 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
              {isAr ? 'المتجر' : 'Shop'}
            </h2>
            <span className="text-xs sm:text-sm text-amber-300 font-semibold font-num whitespace-nowrap inline-flex items-center gap-1">
              <span aria-hidden="true">·</span>
              <CoinMiniIcon />
              <span>{coins}</span>
            </span>
            <span className="text-xs sm:text-sm text-pink-300 font-semibold font-num whitespace-nowrap inline-flex items-center gap-1">
              <span aria-hidden="true">·</span>
              <PinkCoinIcon />
              <span>{pinkCoins}</span>
            </span>
            <span className="text-xs sm:text-sm text-violet-300 font-semibold font-num whitespace-nowrap inline-flex items-center gap-1">
              <span aria-hidden="true">·</span>
              <SpaceCoinIcon />
              <span>{spaceCoins}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
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

        {/* Body */}
        <div className="px-5 pt-3.5 pb-5 overflow-y-auto">
          {/* Category Tabs */}
          <div
            role="tablist"
            aria-label={isAr ? 'أقسام المتجر' : 'Shop categories'}
            className="grid grid-cols-5 gap-1 p-1 rounded-lg bg-slate-950/75 border border-white/10 mb-4"
          >
            {(
              [
                ['skins', isAr ? 'الملتقط' : 'Catcher'],
                ['points', isAr ? 'النقاط' : 'Points'],
                ['supplies', isAr ? 'الإمدادات' : 'Supplies'],
                ['upgrades', isAr ? 'التطويرات' : 'Upgrades'],
                ['space', isAr ? 'متجر الفضاء' : 'Space'],
              ] as [ShopTab, string][]
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                type="button"
                role="tab"
                aria-selected={activeTab === tabKey}
                onClick={() => onChangeTab(tabKey)}
                className={`h-9 px-1 rounded-md text-[10px] sm:text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 whitespace-nowrap cursor-pointer ${
                  activeTab === tabKey
                    ? tabKey === 'space'
                      ? 'bg-gradient-to-r from-violet-500 to-cyan-400 text-slate-950'
                      : tabKey === 'upgrades'
                      ? 'bg-pink-400 text-slate-950'
                      : 'bg-amber-400 text-slate-950'
                    : tabKey === 'space'
                    ? 'text-violet-200 hover:text-white hover:bg-violet-900/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Point Shapes Tab (Plus / Minus sections) */}
          {activeTab === 'points' && (
            <div className="space-y-3" role="tabpanel">
              <div
                role="tablist"
                aria-label={isAr ? 'أقسام أشكال النقاط' : 'Point shape sections'}
                className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-900/90 border border-white/10"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={pointsSubTab === 'plus'}
                  onClick={() => onChangePointsSubTab('plus')}
                  className={`h-8 px-3 rounded-md text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    pointsSubTab === 'plus'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {isAr ? 'قسم الزائد (+)' : 'Plus (+)'}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={pointsSubTab === 'minus'}
                  onClick={() => onChangePointsSubTab('minus')}
                  className={`h-8 px-3 rounded-md text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    pointsSubTab === 'minus'
                      ? 'bg-rose-500 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {isAr ? 'قسم الناقص (-)' : 'Minus (-)'}
                </button>
              </div>

              {pointsSubTab === 'plus' ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? 'تُغيّر أشكال النقاط الإيجابية (+1، +2، +3) في المراحل العادية.'
                      : 'Customizes positive point shapes (+1, +2, +3) in Normal Stages.'}
                  </p>
                  {PLUS_POINT_CATALOG.map((item) => {
                    const owned = shop.ownedPlusSkins.includes(item.id);
                    const equipped = shop.equippedPlusSkin === item.id;
                    const canAfford = !owned && coins >= item.price;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3.5 p-3.5 rounded-lg border transition-colors ${
                          equipped
                            ? 'border-emerald-400/45 bg-emerald-500/10'
                            : 'border-white/10 bg-slate-900/80'
                        }`}
                      >
                        <div
                          className="w-12 h-12 rounded-lg border border-white/10 bg-[#0a1324] flex items-center justify-center shrink-0"
                          aria-hidden="true"
                        >
                          <PlusPointArt id={item.id} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm sm:text-base font-bold text-white truncate">
                              {isAr ? item.nameAr : item.nameEn}
                            </span>
                            {equipped && (
                              <span className="text-xs font-semibold text-emerald-300 whitespace-nowrap shrink-0">
                                {isAr ? 'مُجهّز' : 'Equipped'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                            {isAr ? item.descAr : item.descEn}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={equipped || (!owned && !canAfford)}
                          onClick={() => onSelectOrBuyPlusSkin(item.id)}
                          className={`h-8 px-3 rounded-md inline-flex items-center justify-center gap-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                            equipped
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 cursor-default'
                              : owned
                              ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer'
                              : canAfford
                              ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                          }`}
                        >
                          {equipped ? (
                            <span>{isAr ? 'مفعّل' : 'Active'}</span>
                          ) : owned ? (
                            <span>{isAr ? 'تجهيز' : 'Equip'}</span>
                          ) : (
                            <>
                              <span className="font-num">{item.price}</span>
                              <CoinMiniIcon />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? 'تُغيّر أشكال العوائق الناقصة (الأشواك، المربع -2، السهم السريع، نجمة التجميد) في المراحل العادية.'
                      : 'Customizes hazard shapes (spikes, heavy squares, fast arrows, freeze stars) in Normal Stages.'}
                  </p>
                  {MINUS_POINT_CATALOG.map((item) => {
                    const owned = shop.ownedMinusSkins.includes(item.id);
                    const equipped = shop.equippedMinusSkin === item.id;
                    const canAfford = !owned && coins >= item.price;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3.5 p-3.5 rounded-lg border transition-colors ${
                          equipped
                            ? 'border-rose-400/45 bg-rose-500/10'
                            : 'border-white/10 bg-slate-900/80'
                        }`}
                      >
                        <div
                          className="w-12 h-12 rounded-lg border border-white/10 bg-[#0a1324] flex items-center justify-center shrink-0"
                          aria-hidden="true"
                        >
                          <MinusPointArt id={item.id} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm sm:text-base font-bold text-white truncate">
                              {isAr ? item.nameAr : item.nameEn}
                            </span>
                            {equipped && (
                              <span className="text-xs font-semibold text-rose-300 whitespace-nowrap shrink-0">
                                {isAr ? 'مُجهّز' : 'Equipped'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                            {isAr ? item.descAr : item.descEn}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={equipped || (!owned && !canAfford)}
                          onClick={() => onSelectOrBuyMinusSkin(item.id)}
                          className={`h-8 px-3 rounded-md inline-flex items-center justify-center gap-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                            equipped
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 cursor-default'
                              : owned
                              ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer'
                              : canAfford
                              ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                          }`}
                        >
                          {equipped ? (
                            <span>{isAr ? 'مفعّل' : 'Active'}</span>
                          ) : owned ? (
                            <span>{isAr ? 'تجهيز' : 'Equip'}</span>
                          ) : (
                            <>
                              <span className="font-num">{item.price}</span>
                              <CoinMiniIcon />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Skins Tab */}
          {activeTab === 'skins' && (
            <div className="space-y-3" role="tabpanel">
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'تعمل هذه الأشكال في المراحل العادية، بينما يحتفظ عالم الفواكه بملتقط الكمثرى المأكولة.'
                  : 'Skins apply to Normal Stages while Fruit World keeps the bitten pear catcher.'}
              </p>
              {SKIN_CATALOG.map((skin) => {
                const owned = shop.ownedSkins.includes(skin.id);
                const equipped = shop.equippedSkin === skin.id;
                const canAfford = !owned && coins >= skin.price;
                return (
                  <div
                    key={skin.id}
                    className={`flex items-center gap-3.5 p-3.5 rounded-lg border transition-colors ${
                      equipped
                        ? 'border-amber-400/45 bg-amber-500/10'
                        : 'border-white/10 bg-slate-900/80'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-lg border border-white/10 bg-[#0a1324] flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <SkinArt id={skin.id} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm sm:text-base font-bold text-white truncate">
                          {isAr ? skin.nameAr : skin.nameEn}
                        </span>
                        {equipped && (
                          <span className="text-xs font-semibold text-amber-300 whitespace-nowrap shrink-0">
                            {isAr ? 'مُجهّز' : 'Equipped'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        {isAr ? skin.descAr : skin.descEn}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={equipped || (!owned && !canAfford)}
                      onClick={() => onSelectOrBuySkin(skin.id)}
                      className={`h-8 px-3 rounded-md inline-flex items-center justify-center gap-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                        equipped
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 cursor-default'
                          : owned
                          ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer'
                          : canAfford
                          ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                      }`}
                    >
                      {equipped ? (
                        <span>{isAr ? 'مفعّل' : 'Active'}</span>
                      ) : owned ? (
                        <span>{isAr ? 'تجهيز' : 'Equip'}</span>
                      ) : (
                        <>
                          <span className="font-num">{skin.price}</span>
                          <CoinMiniIcon />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Supplies Tab */}
          {activeTab === 'supplies' && (
            <div className="space-y-3" role="tabpanel">
              <div className="flex items-start gap-2.5 p-3 rounded-lg border border-pink-400/30 bg-pink-950/30">
                <PinkCoinIcon className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs text-pink-100 leading-relaxed">
                  <strong className="text-pink-300">
                    {isAr ? 'العملة الوردية:' : 'Pink Coins:'}
                  </strong>{' '}
                  {isAr
                    ? `فائدتها شراء الألماس لمراحل الذهب (${DIAMOND_COST_COINS} عملة وردية = +1 ألماسة). مع كل نقطة تلتقطها احتمال 50% لربح 1 إلى 3 عملات وردية (فقط في المراحل التي لم تفز بها بعد).`
                    : `Used to buy Diamonds for Gold Stages (${DIAMOND_COST_COINS} Pink Coins = +1 Diamond). Every point caught has a 50% chance to drop 1–3 Pink Coins (only in stages not yet cleared).`}
                </p>
              </div>
              {SUPPLY_CATALOG.map((sup) => {
                const isPinkCurrency = sup.currency === 'pink';
                const balance = isPinkCurrency ? pinkCoins : coins;
                const isFull =
                  (sup.id === 'shield' && shop.shields >= MAX_SHIELDS) ||
                  (sup.id === 'full_hearts' && lives >= maxLives) ||
                  (sup.id === 'full_corn' && corn >= maxCorn) ||
                  (sup.id === 'full_diamonds' && diamonds >= maxDiamonds);
                const canAfford = !isFull && balance >= sup.price;
                const stockText =
                  sup.id === 'shield'
                    ? isAr
                      ? `لديك ${shop.shields}/${MAX_SHIELDS}`
                      : `Owned ${shop.shields}/${MAX_SHIELDS}`
                    : sup.id === 'one_heart' || sup.id === 'full_hearts'
                    ? isAr
                      ? `القلوب ${lives}/${maxLives}`
                      : `Hearts ${lives}/${maxLives}`
                    : sup.id === 'one_corn' || sup.id === 'full_corn'
                    ? isAr
                      ? `الذرة ${corn}/${maxCorn}`
                      : `Corn ${corn}/${maxCorn}`
                    : isAr
                    ? `الألماس ${diamonds}/${maxDiamonds}`
                    : `Diamonds ${diamonds}/${maxDiamonds}`;

                return (
                  <div
                    key={sup.id}
                    className={`flex items-center gap-3.5 p-3.5 rounded-lg border ${
                      isPinkCurrency
                        ? 'border-pink-400/25 bg-pink-950/15'
                        : 'border-white/10 bg-slate-900/80'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-lg border border-white/10 bg-[#0a1324] flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <SupplyArt id={sup.id} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm sm:text-base font-bold text-white truncate">
                          {sup.id === 'full_hearts'
                            ? isAr
                              ? `تعبئة القلوب (${maxLives}/${maxLives})`
                              : `Full Hearts Refill (${maxLives}/${maxLives})`
                            : isAr
                            ? sup.nameAr
                            : sup.nameEn}
                        </span>
                        <span className="font-num text-xs font-semibold text-slate-400 whitespace-nowrap shrink-0">
                          {stockText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        {sup.id === 'full_hearts'
                          ? isAr
                            ? `يعبّئ رصيد القلوب بالكامل إلى ${maxLives}/${maxLives} دفعة واحدة.`
                            : `Refills your entire Normal Stages heart pool back to ${maxLives}/${maxLives}.`
                          : isAr
                          ? sup.descAr
                          : sup.descEn}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isFull || !canAfford}
                      onClick={() => onBuySupply(sup.id)}
                      className={`h-8 px-3 rounded-md inline-flex items-center justify-center gap-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                        isFull
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 cursor-default'
                          : canAfford
                          ? isPinkCurrency
                            ? 'bg-pink-400 hover:bg-pink-300 active:scale-95 text-slate-950 cursor-pointer'
                            : 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                      }`}
                    >
                      {isFull ? (
                        <span>{isAr ? 'ممتلئ' : 'Full'}</span>
                      ) : (
                        <>
                          <span className="font-num">{sup.price}</span>
                          {isPinkCurrency ? <PinkCoinIcon /> : <CoinMiniIcon />}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upgrades Tab (Single permanent upgrade: Max Hearts 10 -> 15 in 5 expensive Pink Coin tiers) */}
          {activeTab === 'upgrades' && (() => {
            const level = shop.maxHeartsUpgrade;
            const isMaxed = level >= MAX_HEARTS_UPGRADE_LEVELS;
            const nextCost = isMaxed ? 0 : MAX_HEARTS_UPGRADE_COSTS[level];
            const canAfford = !isMaxed && pinkCoins >= nextCost;
            const baseMax = maxLives - level;
            const maxPossible = baseMax + MAX_HEARTS_UPGRADE_LEVELS;

            return (
              <div className="space-y-3.5" role="tabpanel">
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-pink-400/30 bg-pink-950/30">
                  <PinkCoinIcon className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-xs text-pink-100 leading-relaxed">
                    <strong className="text-pink-300">
                      {isAr ? 'التطويرات الدائمة:' : 'Permanent Upgrades:'}
                    </strong>{' '}
                    {isAr
                      ? 'تُشترى التطويرات بالعملة الوردية وتبقى مفعّلة معك بشكل دائم.'
                      : 'Permanent upgrades are purchased with Pink Coins and stay active forever.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-pink-400/35 bg-gradient-to-b from-pink-950/35 to-slate-900/90 space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className="w-13 h-13 rounded-xl border border-rose-400/35 bg-[#1b0b18] flex items-center justify-center shrink-0 relative"
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-7 h-7 text-rose-500"
                        fill="currentColor"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span className="font-num absolute -bottom-1 -right-1 text-[10px] font-black bg-pink-400 text-slate-950 rounded px-1 leading-tight shadow">
                        +1
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-white">
                          {isAr ? 'زيادة عدد القلوب' : 'Max Hearts Capacity'}
                        </h3>
                        <span className="font-num text-xs font-bold text-pink-300 whitespace-nowrap shrink-0">
                          {isAr
                            ? `التطويرة ${level}/${MAX_HEARTS_UPGRADE_LEVELS}`
                            : `Tier ${level}/${MAX_HEARTS_UPGRADE_LEVELS}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {isAr
                          ? `ترفع الحد الأقصى لقلوبك من ${baseMax} حتى ${maxPossible} قلباً (5 تطويرات — كل تطويرة تزيد +1 قلب دائماً وتعطيك قلباً فورياً).`
                          : `Raises your maximum hearts from ${baseMax} up to ${maxPossible} (5 upgrades — each tier adds +1 permanent max heart and grants +1 heart immediately).`}
                      </p>
                      <div className="font-num text-xs font-bold text-rose-300 mt-2">
                        {isAr
                          ? `الحد الأقصى الحالي: ${maxLives} / ${maxPossible} قلب`
                          : `Current Max: ${maxLives} / ${maxPossible} Hearts`}
                      </div>
                    </div>
                  </div>

                  {/* 5 Upgrade Tier Steps */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {MAX_HEARTS_UPGRADE_COSTS.map((tierCost, idx) => {
                      const tierNum = idx + 1;
                      const targetHearts = baseMax + tierNum;
                      const completed = level >= tierNum;
                      const isNext = level === idx;
                      return (
                        <div
                          key={tierNum}
                          className={`rounded-lg border px-1.5 py-2 text-center transition-colors ${
                            completed
                              ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200'
                              : isNext
                              ? 'border-pink-400/60 bg-pink-500/15 text-white'
                              : 'border-white/10 bg-slate-950/60 text-slate-500'
                          }`}
                        >
                          <div className="font-num text-xs font-black">
                            {targetHearts} ❤
                          </div>
                          <div className="font-num text-[10px] font-semibold mt-0.5 flex items-center justify-center gap-0.5">
                            {completed ? (
                              <span>{isAr ? 'تم' : 'Done'}</span>
                            ) : (
                              <>
                                <span>{tierCost}</span>
                                <PinkCoinIcon className="w-2.5 h-2.5 shrink-0" />
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Purchase Action */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="text-xs text-slate-300 font-num">
                      {isMaxed
                        ? isAr
                          ? 'وصلت للحد الأقصى (15 قلباً)!'
                          : 'Maximum capacity reached (15 Hearts)!'
                        : isAr
                        ? `التطويرة القادمة: ${maxLives} ← ${maxLives + 1} قلب`
                        : `Next Upgrade: ${maxLives} → ${maxLives + 1} Hearts`}
                    </div>
                    <button
                      type="button"
                      disabled={isMaxed || !canAfford}
                      onClick={onBuyMaxHeartsUpgrade}
                      className={`h-9 px-4 rounded-lg inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 ${
                        isMaxed
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 cursor-default'
                          : canAfford
                          ? 'bg-pink-400 hover:bg-pink-300 active:scale-95 text-slate-950 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                      }`}
                    >
                      {isMaxed ? (
                        <span>{isAr ? 'مكتمل (15/15)' : 'Maxed (15/15)'}</span>
                      ) : (
                        <>
                          <span>{isAr ? 'تطوير' : 'Upgrade'}</span>
                          <span className="font-num">{nextCost}</span>
                          <PinkCoinIcon className="w-4 h-4 shrink-0" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Space Shop Tab (متجر الفضاء بعملات الفضاء) */}
          {activeTab === 'space' && (() => {
            const starsLevel = shop.maxStarsUpgrade;
            const starsMaxed = starsLevel >= MAX_STARS_UPGRADE_LEVELS;
            const nextStarsCost = starsMaxed ? 0 : MAX_STARS_UPGRADE_COSTS[starsLevel];
            const canAffordStars = !starsMaxed && spaceCoins >= nextStarsCost;
            const baseMaxStars = maxStars - starsLevel;
            const maxPossibleStars = baseMaxStars + MAX_STARS_UPGRADE_LEVELS;

            const magnetLevel = shop.spaceMagnetLevel;
            const magnetMaxed = magnetLevel >= SPACE_MAGNET_LEVELS;
            const nextMagnetCost = magnetMaxed ? 0 : SPACE_MAGNET_COSTS[magnetLevel];
            const canAffordMagnet = !magnetMaxed && spaceCoins >= nextMagnetCost;

            const startShieldLevel = shop.spaceStartShieldLevel;
            const startShieldMaxed = startShieldLevel >= SPACE_START_SHIELD_LEVELS;
            const nextStartShieldCost = startShieldMaxed
              ? 0
              : SPACE_START_SHIELD_COSTS[startShieldLevel];
            const canAffordStartShield =
              !startShieldMaxed && spaceCoins >= nextStartShieldCost;

            return (
              <div className="space-y-4" role="tabpanel">
                {/* How to Get Space Coins Guide */}
                <div className="p-3.5 rounded-xl border border-violet-400/40 bg-gradient-to-br from-violet-950/60 via-[#150f33]/90 to-cyan-950/40 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <SpaceCoinIcon className="w-5 h-5 shrink-0" />
                      <h3 className="text-xs sm:text-sm font-extrabold text-cyan-200">
                        {isAr ? 'كيف تجيب عملات الفضاء؟' : 'How to Earn Space Coins?'}
                      </h3>
                    </div>
                    <span className="font-num text-xs font-bold text-violet-200 bg-violet-500/20 border border-violet-400/35 rounded-md px-2 py-0.5 inline-flex items-center gap-1">
                      <SpaceCoinIcon className="w-3.5 h-3.5 shrink-0" />
                      {spaceCoins}
                    </span>
                  </div>
                  <ul className="space-y-1 text-[11px] sm:text-xs text-violet-100/95 leading-relaxed list-disc list-inside">
                    <li>
                      {isAr
                        ? 'التقط النقاط الإيجابية في عالم الفضاء: احتمال 70% تسقط لك 1 إلى 3 عملات فضاء مع كل نقطة (حتى عند إعادة المراحل).'
                        : 'Catch positive points in Space World: 70% chance to drop 1–3 Space Coins per catch (works on replays too).'}
                    </li>
                    <li>
                      {isAr
                        ? `التقط النقاط الكونية النادرة: نجم النابض (+8) يعطي +${SPACE_PULSAR_BONUS_COINS} عملات، المجرة الأسطورية (+12) تعطي +${SPACE_GALAXY_BONUS_COINS} عملات، وبلورة الأوميغا (+14) تعطي +10 عملات فضاء مضمونة!`
                        : `Catch rare cosmic orbs: Pulsar Star (+8) gives +${SPACE_PULSAR_BONUS_COINS}, Mythic Galaxy (+12) gives +${SPACE_GALAXY_BONUS_COINS}, and Omega Crystal (+14) guarantees +10 Space Coins!`}
                    </li>
                    <li>
                      {isAr
                        ? 'أكمل مراحل الفضاء (1–50): أول فوز يمنحك 12 أو 20 أو 32 عملة فضاء حسب نجومك المتبقية (+6 عملات عند إعادة أي مرحلة).'
                        : 'Clear Space Stages (1–50): first clear awards 12 / 20 / 32 Space Coins based on remaining Stars (+6 on stage replays).'}
                    </li>
                    <li className="text-amber-200 font-semibold">
                      {isAr
                        ? '👑 اهزم «زعيم الفضاء» كل 5 مراحل (45–240 عملة فضاء) و«🔥 الوحش الأكبر» في المرحلة 49 لمكافأة أسطورية (+450 عملة فضاء، و+140 عند الإعادة)!'
                        : '👑 Defeat Space Bosses every 5 stages (45–240 Space Coins) and the 🔥 Supreme Beast at Stage 49 for a massive +450 Space Coins (+140 on replays)!'}
                    </li>
                  </ul>
                </div>

                {/* Section 1: Exclusive Space Ship Skins */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-violet-300">
                    {isAr ? 'مركبات عالم الفضاء' : 'Space World Starships'}
                  </h3>
                  {SPACE_SKIN_CATALOG.map((skin) => {
                    const owned = shop.ownedSpaceSkins.includes(skin.id);
                    const equipped = shop.equippedSpaceSkin === skin.id;
                    const canAfford = !owned && spaceCoins >= skin.price;
                    return (
                      <div
                        key={skin.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          equipped
                            ? 'border-cyan-400/55 bg-violet-500/15'
                            : 'border-violet-400/20 bg-slate-900/80'
                        }`}
                      >
                        <div
                          className="w-12 h-12 rounded-lg border border-violet-400/25 bg-[#0b0820] flex items-center justify-center shrink-0"
                          aria-hidden="true"
                        >
                          <SpaceShipArt id={skin.id} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-bold text-white truncate">
                              {isAr ? skin.nameAr : skin.nameEn}
                            </span>
                            {equipped && (
                              <span className="text-[11px] font-bold text-cyan-300 whitespace-nowrap shrink-0">
                                {isAr ? 'مُجهّزة' : 'Equipped'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                            {isAr ? skin.descAr : skin.descEn}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={equipped || (!owned && !canAfford)}
                          onClick={() => onSelectOrBuySpaceSkin(skin.id)}
                          className={`h-8 px-3 rounded-md inline-flex items-center justify-center gap-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                            equipped
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 cursor-default'
                              : owned
                              ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 cursor-pointer'
                              : canAfford
                              ? 'bg-gradient-to-r from-violet-400 to-cyan-300 hover:brightness-110 active:scale-95 text-slate-950 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                          }`}
                        >
                          {equipped ? (
                            <span>{isAr ? 'مفعّلة' : 'Active'}</span>
                          ) : owned ? (
                            <span>{isAr ? 'تجهيز' : 'Equip'}</span>
                          ) : (
                            <>
                              <span className="font-num">{skin.price}</span>
                              <SpaceCoinIcon />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Section 2: Space Supplies */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-cyan-300">
                    {isAr ? 'إمدادات الفضاء' : 'Space Supplies'}
                  </h3>
                  {SPACE_SUPPLY_CATALOG.map((sup) => {
                    const isFull =
                      (sup.id === 'space_shield' && shop.shields >= MAX_SHIELDS) ||
                      (sup.id === 'full_stars' && stars >= maxStars);
                    const canAfford = !isFull && spaceCoins >= sup.price;
                    const stockText =
                      sup.id === 'space_shield'
                        ? isAr
                          ? `لديك ${shop.shields}/${MAX_SHIELDS}`
                          : `Owned ${shop.shields}/${MAX_SHIELDS}`
                        : isAr
                        ? `النجوم ${stars}/${maxStars}`
                        : `Stars ${stars}/${maxStars}`;
                    return (
                      <div
                        key={sup.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-violet-400/25 bg-[#120d28]/85"
                      >
                        <div
                          className="w-12 h-12 rounded-lg border border-violet-400/25 bg-[#0a0820] flex items-center justify-center shrink-0"
                          aria-hidden="true"
                        >
                          {sup.id === 'space_shield' ? (
                            <svg
                              viewBox="0 0 24 24"
                              className="w-7 h-7 text-cyan-300"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path
                                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                                fill="currentColor"
                                fillOpacity="0.22"
                              />
                            </svg>
                          ) : (
                            <SpaceStarIcon className="w-7 h-7" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-bold text-white truncate">
                              {sup.id === 'full_stars'
                                ? isAr
                                  ? `تعبئة النجوم (${maxStars}/${maxStars})`
                                  : `Full Stars (${maxStars}/${maxStars})`
                                : isAr
                                ? sup.nameAr
                                : sup.nameEn}
                            </span>
                            <span className="font-num text-xs font-semibold text-violet-300 whitespace-nowrap shrink-0">
                              {stockText}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                            {isAr ? sup.descAr : sup.descEn}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isFull || !canAfford}
                          onClick={() => onBuySpaceSupply(sup.id)}
                          className={`h-8 px-3 rounded-md inline-flex items-center justify-center gap-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                            isFull
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 cursor-default'
                              : canAfford
                              ? 'bg-gradient-to-r from-violet-400 to-cyan-300 hover:brightness-110 active:scale-95 text-slate-950 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                          }`}
                        >
                          {isFull ? (
                            <span>{isAr ? 'ممتلئ' : 'Full'}</span>
                          ) : (
                            <>
                              <span className="font-num">{sup.price}</span>
                              <SpaceCoinIcon />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Section 3: Permanent Space Upgrades */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-fuchsia-300">
                    {isAr ? 'تطويرات الفضاء الدائمة' : 'Permanent Space Upgrades'}
                  </h3>

                  {/* Upgrade A: Max Space Stars 10 -> 15 */}
                  <div className="p-3.5 rounded-xl border border-violet-400/35 bg-gradient-to-b from-violet-950/40 to-slate-900/90 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl border border-violet-400/35 bg-[#120b2a] flex items-center justify-center shrink-0 relative">
                        <SpaceStarIcon className="w-7 h-7" />
                        <span className="font-num absolute -bottom-1 -right-1 text-[10px] font-black bg-cyan-300 text-slate-950 rounded px-1 leading-tight">
                          +1
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {isAr ? 'زيادة نجوم الفضاء' : 'Max Space Stars'}
                          </h4>
                          <span className="font-num text-xs font-bold text-cyan-300 whitespace-nowrap">
                            {starsLevel}/{MAX_STARS_UPGRADE_LEVELS}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                          {isAr
                            ? `ترفع الحد الأقصى لنجوم عالم الفضاء من ${baseMaxStars} حتى ${maxPossibleStars} نجمة (+1 نجمة فورية مع كل تطويرة).`
                            : `Raises max Space World Stars from ${baseMaxStars} up to ${maxPossibleStars} (+1 immediate Star per tier).`}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {MAX_STARS_UPGRADE_COSTS.map((tierCost, idx) => {
                        const tierNum = idx + 1;
                        const targetStars = baseMaxStars + tierNum;
                        const done = starsLevel >= tierNum;
                        const isNext = starsLevel === idx;
                        return (
                          <div
                            key={tierNum}
                            className={`rounded-lg border px-1 py-1.5 text-center ${
                              done
                                ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200'
                                : isNext
                                ? 'border-cyan-400/60 bg-violet-500/20 text-white'
                                : 'border-white/10 bg-slate-950/60 text-slate-500'
                            }`}
                          >
                            <div className="font-num text-xs font-black">
                              {targetStars} ★
                            </div>
                            <div className="font-num text-[10px] font-semibold mt-0.5 flex items-center justify-center gap-0.5">
                              {done ? (
                                <span>{isAr ? 'تم' : 'Done'}</span>
                              ) : (
                                <>
                                  <span>{tierCost}</span>
                                  <SpaceCoinIcon className="w-2.5 h-2.5 shrink-0" />
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="font-num text-xs text-violet-200">
                        {starsMaxed
                          ? isAr
                            ? `الحد الأقصى مكتمل (${maxPossibleStars}★)`
                            : `Max reached (${maxPossibleStars}★)`
                          : isAr
                          ? `الحد الحالي: ${maxStars} ← ${maxStars + 1}★`
                          : `Current: ${maxStars} → ${maxStars + 1}★`}
                      </span>
                      <button
                        type="button"
                        disabled={starsMaxed || !canAffordStars}
                        onClick={onBuyMaxStarsUpgrade}
                        className={`h-8 px-3.5 rounded-lg inline-flex items-center justify-center gap-1.5 text-xs font-bold whitespace-nowrap ${
                          starsMaxed
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 cursor-default'
                            : canAffordStars
                            ? 'bg-gradient-to-r from-violet-400 to-cyan-300 hover:brightness-110 active:scale-95 text-slate-950 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                        }`}
                      >
                        {starsMaxed ? (
                          <span>{isAr ? 'مكتمل' : 'Maxed'}</span>
                        ) : (
                          <>
                            <span>{isAr ? 'تطوير' : 'Upgrade'}</span>
                            <span className="font-num">{nextStarsCost}</span>
                            <SpaceCoinIcon />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Upgrade B: Cosmic Magnet Lv.1-3 */}
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-cyan-400/30 bg-[#0d152b]/90">
                    <div
                      className="w-12 h-12 rounded-xl border border-cyan-400/35 bg-[#091326] flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-6 h-6 text-cyan-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 4v7a6 6 0 0 0 12 0V4" />
                        <line x1="4" y1="4" x2="8" y2="4" />
                        <line x1="16" y1="4" x2="20" y2="4" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-sm font-bold text-white truncate">
                          {isAr ? 'مغناطيس الفضاء' : 'Cosmic Magnet'}
                        </h4>
                        <span className="font-num text-xs font-bold text-cyan-300 whitespace-nowrap">
                          {isAr
                            ? `م${magnetLevel}/${SPACE_MAGNET_LEVELS}`
                            : `Lv.${magnetLevel}/${SPACE_MAGNET_LEVELS}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        {isAr
                          ? 'يجذب النقاط الكونية الإيجابية القريبة نحو مركبتك تلقائياً في عالم الفضاء (3 مستويات).'
                          : 'Pulls nearby positive cosmic points toward your ship in Space World (3 tiers).'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={magnetMaxed || !canAffordMagnet}
                      onClick={onBuySpaceMagnetUpgrade}
                      className={`h-8 px-3 rounded-lg inline-flex items-center justify-center gap-1.5 text-xs font-bold whitespace-nowrap shrink-0 ${
                        magnetMaxed
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 cursor-default'
                          : canAffordMagnet
                          ? 'bg-gradient-to-r from-violet-400 to-cyan-300 hover:brightness-110 active:scale-95 text-slate-950 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                      }`}
                    >
                      {magnetMaxed ? (
                        <span>{isAr ? 'مكتمل' : 'Maxed'}</span>
                      ) : (
                        <>
                          <span className="font-num">{nextMagnetCost}</span>
                          <SpaceCoinIcon />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Upgrade C: Cosmic Starting Shield Lv.1-3 */}
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-fuchsia-400/30 bg-[#170e2e]/90">
                    <div
                      className="w-12 h-12 rounded-xl border border-fuchsia-400/35 bg-[#120826] flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-6 h-6 text-fuchsia-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path
                          d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                          fill="currentColor"
                          fillOpacity="0.2"
                        />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-sm font-bold text-white truncate">
                          {isAr ? 'درع البداية الكوني' : 'Cosmic Start Shield'}
                        </h4>
                        <span className="font-num text-xs font-bold text-fuchsia-300 whitespace-nowrap">
                          {startShieldLevel > 0
                            ? `${SPACE_START_SHIELD_DURATIONS[startShieldLevel]}s`
                            : `0/${SPACE_START_SHIELD_LEVELS}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        {isAr
                          ? 'تبدأ كل مرحلة في عالم الفضاء بدرع حماية تلقائي (3ث ← 5ث ← 8ث) يحميك من العوائق!'
                          : 'Start every Space Stage with an automatic protective shield (3s → 5s → 8s)!'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={startShieldMaxed || !canAffordStartShield}
                      onClick={onBuySpaceStartShieldUpgrade}
                      className={`h-8 px-3 rounded-lg inline-flex items-center justify-center gap-1.5 text-xs font-bold whitespace-nowrap shrink-0 ${
                        startShieldMaxed
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 cursor-default'
                          : canAffordStartShield
                          ? 'bg-gradient-to-r from-violet-400 to-cyan-300 hover:brightness-110 active:scale-95 text-slate-950 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                      }`}
                    >
                      {startShieldMaxed ? (
                        <span>{isAr ? 'مكتمل' : 'Maxed'}</span>
                      ) : (
                        <>
                          <span className="font-num">{nextStartShieldCost}</span>
                          <SpaceCoinIcon />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
