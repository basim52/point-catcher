export type ArenaStatus = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type WeaponId =
  | 'plasma_pistol'
  | 'twin_blasters'
  | 'scatter_shotgun'
  | 'frost_rifle'
  | 'thunder_cannon'
  | 'venom_gatling'
  | 'dragon_flamethrower'
  | 'cosmic_annihilator';

export type PetId =
  | 'wolf'
  | 'falcon'
  | 'bear'
  | 'panther'
  | 'lion'
  | 'baby_dragon';

export type FruitId =
  | 'apple'
  | 'banana'
  | 'watermelon'
  | 'mango'
  | 'dragonfruit'
  | 'golden_date';

export type ArenaMonsterKind =
  | 'imp'
  | 'goblin'
  | 'crawler'
  | 'brute'
  | 'wraith'
  | 'minotaur'
  | 'warlordBoss'
  | 'titanBoss';

export const ARENA_RADIUS = 19.5;
export const WARLORD_BOSS_INTERVAL_SEC = 180; // Exact 3 minutes
export const TITAN_BOSS_INTERVAL_SEC = 600; // Exact 10 minutes
export const BASE_MAX_ENERGY = 120;
export const MAX_PET_LEVEL = 5;
export const MAX_PET_SQUAD = 12;

export const ALL_WEAPON_IDS: readonly WeaponId[] = [
  'plasma_pistol',
  'twin_blasters',
  'scatter_shotgun',
  'frost_rifle',
  'thunder_cannon',
  'venom_gatling',
  'dragon_flamethrower',
  'cosmic_annihilator',
];

export const ALL_PET_IDS: readonly PetId[] = [
  'wolf',
  'falcon',
  'bear',
  'panther',
  'lion',
  'baby_dragon',
];

export const ALL_FRUIT_IDS: readonly FruitId[] = [
  'apple',
  'banana',
  'watermelon',
  'mango',
  'dragonfruit',
  'golden_date',
];

export interface WeaponSpec {
  id: WeaponId;
  cost: number;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  damage: number;
  fireInterval: number;
  projectileSpeed: number;
  range: number;
  pellets: number;
  spreadAngle: number;
  splashRadius: number;
  slowDuration: number;
  poisonDps: number;
  poisonDuration: number;
  pierce: number;
  color: string;
  accent: string;
}

export interface PetSpec {
  id: PetId;
  cost: number;
  upgradeCostBase: number;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  style: 'melee' | 'ranged';
  flying?: boolean;
  baseHp: number;
  damage: number;
  attackInterval: number;
  speed: number;
  range: number;
  splashRadius: number;
  slowDuration: number;
  coinBonusPct?: number;
  primaryColor: string;
  accentColor: string;
  scale: number;
}

export interface FruitSpec {
  id: FruitId;
  cost: number;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  healAmount: number; // 9999 = full heal
  maxEnergyBonus: number; // permanent max HP/Energy increase
  speedBuffSec?: number;
  damageBuffSec?: number;
  shieldBuffSec?: number;
  rapidFireBuffSec?: number;
  color: string;
  accent: string;
}

export interface ArenaMonsterSpec {
  kind: ArenaMonsterKind;
  nameAr: string;
  nameEn: string;
  baseHp: number;
  speed: number;
  contactDamage: number;
  rewardCoins: number;
  rewardScore: number;
  radius: number;
  scale: number;
  primaryColor: string;
  accentColor: string;
  flying?: boolean;
  ranged?: boolean;
}

export const WEAPON_SPECS: Record<WeaponId, WeaponSpec> = {
  plasma_pistol: {
    id: 'plasma_pistol',
    cost: 0,
    nameAr: 'مسدس البلازما',
    nameEn: 'Plasma Pistol',
    descAr: 'سلاحك الأساسي — طلقات سريعة ومتوازنة للدفاع عن نفسك.',
    descEn: 'Starter energy sidearm with steady, reliable shots.',
    damage: 18,
    fireInterval: 0.42,
    projectileSpeed: 22,
    range: 14,
    pellets: 1,
    spreadAngle: 0,
    splashRadius: 0,
    slowDuration: 0,
    poisonDps: 0,
    poisonDuration: 0,
    pierce: 0,
    color: '#38bdf8',
    accent: '#0284c7',
  },
  twin_blasters: {
    id: 'twin_blasters',
    cost: 90,
    nameAr: 'مسدسان مزدوجان',
    nameEn: 'Twin Blasters',
    descAr: 'يطلق طلقتين متوازيتين بسرعة عالية لمضاعفة الضرر.',
    descEn: 'Fires twin parallel plasma bolts at high speed.',
    damage: 21,
    fireInterval: 0.34,
    projectileSpeed: 24,
    range: 15,
    pellets: 2,
    spreadAngle: 0.14,
    splashRadius: 0,
    slowDuration: 0,
    poisonDps: 0,
    poisonDuration: 0,
    pierce: 0,
    color: '#4ade80',
    accent: '#16a34a',
  },
  scatter_shotgun: {
    id: 'scatter_shotgun',
    cost: 210,
    nameAr: 'بندقية الرش البركانية',
    nameEn: 'Volcanic Shotgun',
    descAr: 'تطلق 5 شظايا نارية واسعة لصدّ مجموعات الوحوش القريبة.',
    descEn: 'Blasts 5 fiery pellets in a wide cone to shred swarms.',
    damage: 22,
    fireInterval: 0.62,
    projectileSpeed: 21,
    range: 13,
    pellets: 5,
    spreadAngle: 0.48,
    splashRadius: 0.7,
    slowDuration: 0,
    poisonDps: 0,
    poisonDuration: 0,
    pierce: 0,
    color: '#fb923c',
    accent: '#ea580c',
  },
  frost_rifle: {
    id: 'frost_rifle',
    cost: 380,
    nameAr: 'بندقية الصقيع',
    nameEn: 'Frost Rifle',
    descAr: 'طلقات جليدية تخترق هدفين وتجمّد سرعة الوحوش بنسبة 45%.',
    descEn: 'Piercing frost bolts that chill and slow monsters by 45%.',
    damage: 42,
    fireInterval: 0.35,
    projectileSpeed: 27,
    range: 17,
    pellets: 2,
    spreadAngle: 0.1,
    splashRadius: 1.0,
    slowDuration: 3.0,
    poisonDps: 0,
    poisonDuration: 0,
    pierce: 1,
    color: '#67e8f9',
    accent: '#06b6d4',
  },
  thunder_cannon: {
    id: 'thunder_cannon',
    cost: 650,
    nameAr: 'مدفع الصاعقة',
    nameEn: 'Thunder Cannon',
    descAr: 'قذائف برق ضخمة تنفجر وتصعق جميع الوحوش حول الهدف!',
    descEn: 'Heavy lightning shells that detonate in a huge shockwave.',
    damage: 88,
    fireInterval: 0.56,
    projectileSpeed: 23,
    range: 17,
    pellets: 1,
    spreadAngle: 0,
    splashRadius: 3.6,
    slowDuration: 1.2,
    poisonDps: 0,
    poisonDuration: 0,
    pierce: 0,
    color: '#fde047',
    accent: '#eab308',
  },
  venom_gatling: {
    id: 'venom_gatling',
    cost: 1050,
    nameAr: 'رشاش السموم',
    nameEn: 'Venom Gatling',
    descAr: 'إطلاق فائق السرعة مع أبواغ سامة تذيب الوحوش والزعماء باستمرار.',
    descEn: 'Ultra-rapid toxic rotary cannon with stacking poison DoT.',
    damage: 38,
    fireInterval: 0.14,
    projectileSpeed: 28,
    range: 17.5,
    pellets: 2,
    spreadAngle: 0.16,
    splashRadius: 1.2,
    slowDuration: 0,
    poisonDps: 36,
    poisonDuration: 4.5,
    pierce: 1,
    color: '#a3e635',
    accent: '#65a30d',
  },
  dragon_flamethrower: {
    id: 'dragon_flamethrower',
    cost: 1650,
    nameAr: 'قاذف لهب التنين',
    nameEn: 'Dragon Cannon',
    descAr: '3 كرات لهب متفجرة تخترق صفوف الوحوش وتضرب بضرر ناري كاسح!',
    descEn: 'Triple explosive dragonfire orbs that pierce through hordes.',
    damage: 105,
    fireInterval: 0.34,
    projectileSpeed: 25,
    range: 18,
    pellets: 3,
    spreadAngle: 0.28,
    splashRadius: 2.8,
    slowDuration: 0,
    poisonDps: 28,
    poisonDuration: 3.5,
    pierce: 2,
    color: '#fb7185',
    accent: '#e11d48',
  },
  cosmic_annihilator: {
    id: 'cosmic_annihilator',
    cost: 2600,
    nameAr: 'مدمّر المجرة',
    nameEn: 'Cosmic Annihilator',
    descAr: 'أقوى سلاح في الحلبة — 5 أشعة كونية بالتجميد والسم والانفجار الواسع!',
    descEn: 'Ultimate 5-beam cosmic railgun with freeze, venom, and nova splash.',
    damage: 142,
    fireInterval: 0.28,
    projectileSpeed: 31,
    range: 20,
    pellets: 5,
    spreadAngle: 0.38,
    splashRadius: 3.2,
    slowDuration: 3.2,
    poisonDps: 50,
    poisonDuration: 4.5,
    pierce: 2,
    color: '#e879f9',
    accent: '#9333ea',
  },
};

export const PET_SPECS: Record<PetId, PetSpec> = {
  wolf: {
    id: 'wolf',
    cost: 120,
    upgradeCostBase: 140,
    nameAr: 'ذئب القتال',
    nameEn: 'Battle Wolf',
    descAr: 'يركض سريعاً بجانبك وينهش الوحوش القريبة بهجمات خاطفة.',
    descEn: 'Agile melee hound that chases down and bites nearby monsters.',
    style: 'melee',
    baseHp: 77,
    damage: 5,
    attackInterval: 0.65,
    speed: 10.2,
    range: 10,
    splashRadius: 0.8,
    slowDuration: 0,
    primaryColor: '#64748b',
    accentColor: '#38bdf8',
    scale: 1.0,
  },
  falcon: {
    id: 'falcon',
    cost: 240,
    upgradeCostBase: 260,
    nameAr: 'الصقر الجارح',
    nameEn: 'Desert Falcon',
    descAr: 'يحلّق فوقك ويطلق ريشاً حاداً على الوحوش من مسافة بعيدة.',
    descEn: 'Soars overhead firing sharp golden feathers at distant foes.',
    style: 'ranged',
    flying: true,
    baseHp: 88,
    damage: 6,
    attackInterval: 0.58,
    speed: 11.5,
    range: 15,
    splashRadius: 0,
    slowDuration: 0,
    primaryColor: '#b45309',
    accentColor: '#fde047',
    scale: 0.95,
  },
  bear: {
    id: 'bear',
    cost: 420,
    upgradeCostBase: 420,
    nameAr: 'الدب الحارس',
    nameEn: 'Guardian Bear',
    descAr: 'دب مدرّع ضخم يسحق مجموعات الوحوش بضربات أرضية متفجرة.',
    descEn: 'Armored grizzly that slams groups of monsters with shockwaves.',
    style: 'melee',
    baseHp: 182,
    damage: 11,
    attackInterval: 0.92,
    speed: 8.6,
    range: 9.5,
    splashRadius: 2.8,
    slowDuration: 1.2,
    primaryColor: '#78350f',
    accentColor: '#f59e0b',
    scale: 1.22,
  },
  panther: {
    id: 'panther',
    cost: 680,
    upgradeCostBase: 620,
    nameAr: 'النمر الكهربائي',
    nameEn: 'Thunder Panther',
    descAr: 'نمر سريع يطلق صواعق كهربائية تبطّئ الوحوش وتضرب حولهم.',
    descEn: 'Swift violet panther launching chilling lightning bolts.',
    style: 'ranged',
    baseHp: 154,
    damage: 10,
    attackInterval: 0.54,
    speed: 11.2,
    range: 14,
    splashRadius: 2.0,
    slowDuration: 2.2,
    primaryColor: '#312e81',
    accentColor: '#67e8f9',
    scale: 1.08,
  },
  lion: {
    id: 'lion',
    cost: 1100,
    upgradeCostBase: 950,
    nameAr: 'الأسد الذهبي',
    nameEn: 'Golden Lion',
    descAr: 'أسد ملكي يطلق موجات نارية قوية ويزيد عملات القتل بنسبة +15%!',
    descEn: 'Royal lion blasting fiery roars and boosting Coin drops by +15%!',
    style: 'ranged',
    baseHp: 238,
    damage: 17,
    attackInterval: 0.68,
    speed: 9.8,
    range: 14.5,
    splashRadius: 3.1,
    slowDuration: 0,
    coinBonusPct: 15,
    primaryColor: '#d97706',
    accentColor: '#fef08a',
    scale: 1.2,
  },
  baby_dragon: {
    id: 'baby_dragon',
    cost: 1850,
    upgradeCostBase: 1450,
    nameAr: 'التنين المرافق',
    nameEn: 'Companion Dragon',
    descAr: 'تنين مجنح أسطوري يحلّق معك ويقذف كرات نار عملاقة لسحق الزعماء!',
    descEn: 'Winged dragon soaring beside you launching massive fireballs!',
    style: 'ranged',
    flying: true,
    baseHp: 322,
    damage: 26,
    attackInterval: 0.55,
    speed: 12.2,
    range: 17.5,
    splashRadius: 3.6,
    slowDuration: 0,
    primaryColor: '#be123c',
    accentColor: '#fb923c',
    scale: 1.25,
  },
};

export const FRUIT_SPECS: Record<FruitId, FruitSpec> = {
  apple: {
    id: 'apple',
    cost: 25,
    nameAr: 'تفاح الطاقة',
    nameEn: 'Energy Apple',
    descAr: 'يستعيد +45 طاقة وصحة فوراً للعودة للقتال بسرعة.',
    descEn: 'Restores +45 Energy/HP immediately.',
    healAmount: 45,
    maxEnergyBonus: 0,
    color: '#ef4444',
    accent: '#fca5a5',
  },
  banana: {
    id: 'banana',
    cost: 45,
    nameAr: 'موز السرعة',
    nameEn: 'Turbo Banana',
    descAr: 'يستعيد +65 طاقة ويعطيك سرعة حركة +28% لمدة 15 ثانية.',
    descEn: 'Restores +65 Energy and boosts move speed by +28% for 15s.',
    healAmount: 65,
    maxEnergyBonus: 0,
    speedBuffSec: 15,
    color: '#facc15',
    accent: '#fef08a',
  },
  watermelon: {
    id: 'watermelon',
    cost: 80,
    nameAr: 'بطيخ الحيوية',
    nameEn: 'Vitality Melon',
    descAr: 'يمتلئ شريط الطاقة 100% + يزيد الحد الأقصى للطاقة +20 بشكل دائم!',
    descEn: 'Full Energy refill + permanent +20 Max Energy!',
    healAmount: 9999,
    maxEnergyBonus: 20,
    color: '#22c55e',
    accent: '#fb7185',
  },
  mango: {
    id: 'mango',
    cost: 130,
    nameAr: 'مانجو القوة',
    nameEn: 'Power Mango',
    descAr: 'شفاء كامل + +35 طاقة قصوى دائمة + ضرر +25% لمدة 20 ثانية!',
    descEn: 'Full heal + permanent +35 Max Energy + +25% DMG for 20s!',
    healAmount: 9999,
    maxEnergyBonus: 35,
    damageBuffSec: 20,
    color: '#f97316',
    accent: '#fde047',
  },
  dragonfruit: {
    id: 'dragonfruit',
    cost: 220,
    nameAr: 'فاكهة التنين',
    nameEn: 'Dragon Fruit',
    descAr: 'شفاء كامل + +60 طاقة قصوى دائمة + درع حماية يمتص الضرر 12 ثانية!',
    descEn: 'Full heal + permanent +60 Max Energy + 12s Energy Shield!',
    healAmount: 9999,
    maxEnergyBonus: 60,
    shieldBuffSec: 12,
    color: '#ec4899',
    accent: '#f9a8d4',
  },
  golden_date: {
    id: 'golden_date',
    cost: 380,
    nameAr: 'التمر الملكي الذهبي',
    nameEn: 'Royal Golden Date',
    descAr: 'شفاء كامل + +110 طاقة قصوى دائمة + سرعة إطلاق +35% لمدة 25 ثانية!',
    descEn: 'Full heal + permanent +110 Max Energy + +35% Fire Rate for 25s!',
    healAmount: 9999,
    maxEnergyBonus: 110,
    rapidFireBuffSec: 25,
    color: '#eab308',
    accent: '#fef9c3',
  },
};

export const ARENA_MONSTER_SPECS: Record<ArenaMonsterKind, ArenaMonsterSpec> = {
  imp: {
    kind: 'imp',
    nameAr: 'عفريت الحلبة',
    nameEn: 'Arena Imp',
    baseHp: 38,
    speed: 4.5,
    contactDamage: 10,
    rewardCoins: 10,
    rewardScore: 15,
    radius: 0.65,
    scale: 0.9,
    primaryColor: '#ea580c',
    accentColor: '#fde047',
  },
  goblin: {
    kind: 'goblin',
    nameAr: 'محارب الغول',
    nameEn: 'Goblin Raider',
    baseHp: 62,
    speed: 3.8,
    contactDamage: 14,
    rewardCoins: 14,
    rewardScore: 22,
    radius: 0.72,
    scale: 1.0,
    primaryColor: '#16a34a',
    accentColor: '#fbbf24',
  },
  crawler: {
    kind: 'crawler',
    nameAr: 'عنكبوت الحمم',
    nameEn: 'Lava Crawler',
    baseHp: 54,
    speed: 5.4,
    contactDamage: 15,
    rewardCoins: 16,
    rewardScore: 26,
    radius: 0.68,
    scale: 0.96,
    primaryColor: '#4c1d95',
    accentColor: '#a3e635',
  },
  brute: {
    kind: 'brute',
    nameAr: 'عملاق الصخر',
    nameEn: 'Rock Brute',
    baseHp: 150,
    speed: 2.6,
    contactDamage: 22,
    rewardCoins: 26,
    rewardScore: 42,
    radius: 0.98,
    scale: 1.32,
    primaryColor: '#475569',
    accentColor: '#fb923c',
  },
  wraith: {
    kind: 'wraith',
    nameAr: 'شبح الجحيم',
    nameEn: 'Inferno Wraith',
    baseHp: 96,
    speed: 3.9,
    contactDamage: 18,
    rewardCoins: 24,
    rewardScore: 38,
    radius: 0.76,
    scale: 1.05,
    primaryColor: '#0e7490',
    accentColor: '#67e8f9',
    flying: true,
    ranged: true,
  },
  minotaur: {
    kind: 'minotaur',
    nameAr: 'المينوتور الهائج',
    nameEn: 'Raging Minotaur',
    baseHp: 240,
    speed: 3.7,
    contactDamage: 28,
    rewardCoins: 42,
    rewardScore: 68,
    radius: 1.1,
    scale: 1.48,
    primaryColor: '#7f1d1d',
    accentColor: '#f59e0b',
  },
  warlordBoss: {
    kind: 'warlordBoss',
    nameAr: 'سيد الحمم',
    nameEn: 'Inferno Warlord',
    baseHp: 1450,
    speed: 3.35,
    contactDamage: 34,
    rewardCoins: 420,
    rewardScore: 650,
    radius: 1.48,
    scale: 1.85,
    primaryColor: '#7c2d12',
    accentColor: '#f97316',
    ranged: true,
  },
  titanBoss: {
    kind: 'titanBoss',
    nameAr: 'الطاغية الأبدي',
    nameEn: 'Eternal Dread Titan',
    baseHp: 4200,
    speed: 2.9,
    contactDamage: 46,
    rewardCoins: 1200,
    rewardScore: 1800,
    radius: 2.0,
    scale: 2.45,
    primaryColor: '#1e062c',
    accentColor: '#f43f5e',
    ranged: true,
  },
};

export interface ArenaPetEntity {
  id: number;
  petId: PetId;
  level: number;
  slot: number;
  hp: number;
  maxHp: number;
  hitFlash: number;
  hurtCooldown: number;
  x: number;
  z: number;
  guardX: number | null;
  guardZ: number | null;
  angle: number;
  attackCooldown: number;
  animPhase: number;
  lungeTimer: number;
}

export interface ArenaMonsterEntity {
  id: number;
  kind: ArenaMonsterKind;
  x: number;
  z: number;
  angle: number;
  hp: number;
  maxHp: number;
  speed: number;
  hitFlash: number;
  slowTimer: number;
  poisonTimer: number;
  poisonDps: number;
  attackCooldown: number;
  rangedCooldown: number;
  summonCooldown: number;
  walkPhase: number;
}

export interface ArenaProjectile {
  id: number;
  fromEnemy: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  damage: number;
  color: string;
  size: number;
  life: number;
  splashRadius: number;
  slowDuration: number;
  poisonDps: number;
  poisonDuration: number;
  pierceLeft: number;
  hitIds: number[];
}

export interface ArenaPickup {
  id: number;
  kind: 'coin' | 'berry';
  x: number;
  z: number;
  value: number;
  life: number;
  phase: number;
}

export interface ArenaParticle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface MonsterArenaStats {
  bestScore: number;
  bestWave: number;
  bestKills: number;
  titansDefeated: number;
}

export interface SavedPetSlot {
  petId: PetId;
  level: number;
  slot: number;
  hp?: number;
  maxHp?: number;
  guardX?: number | null;
  guardZ?: number | null;
}

export interface MonsterArenaSavedTimers {
  warlordTimer: number;
  warlordLevel: number;
  titanTimer: number;
  titanLevel: number;
  savedAt: number;
}

export interface MonsterArenaSavedRun {
  coins: number;
  score: number;
  wave: number;
  kills: number;
  energy: number;
  maxEnergy: number;
  activeWeapon: WeaponId;
  ownedWeapons: WeaponId[];
  ownedPets?: Partial<Record<PetId, number>>;
  petRoster?: SavedPetSlot[];
  warlordTimer?: number;
  warlordLevel?: number;
  titanTimer: number;
  titanLevel: number;
  fruitsEaten: number;
  savedAt: number;
}

export interface MonsterArenaHudSnapshot {
  status: ArenaStatus;
  coins: number;
  score: number;
  wave: number;
  kills: number;
  energy: number;
  maxEnergy: number;
  activeWeapon: WeaponId;
  ownedWeapons: WeaponId[];
  petRoster: SavedPetSlot[];
  mergeableCount: number;
  selectedPetId: number | null;
  selectedPetInfo: { petId: PetId; level: number; slot: number } | null;
  hasStationedPets: boolean;
  warlordTimer: number;
  warlordActive: boolean;
  warlordHp: number;
  warlordMaxHp: number;
  warlordLevel: number;
  titanTimer: number;
  titanActive: boolean;
  titanHp: number;
  titanMaxHp: number;
  titanLevel: number;
  speedBuffTimer: number;
  damageBuffTimer: number;
  shieldBuffTimer: number;
  rapidFireBuffTimer: number;
  dashCooldown: number;
  bannerText: string;
  bannerTone: 'info' | 'boss' | 'shop' | 'warn';
  bestScore: number;
  bestWave: number;
  bestKills: number;
  titansDefeated: number;
  hasSavedRun: boolean;
  savedWave: number;
  savedCoins: number;
}

const STATS_KEY = 'point_catcher_monster_arena_stats_v1';
const SAVE_KEY = 'point_catcher_monster_arena_save_v1';
const TIMERS_KEY = 'point_catcher_monster_arena_timers_v1';
const SOUND_KEY = 'point_catcher_monster_arena_sound_v1';

export function readMonsterArenaTimers(): MonsterArenaSavedTimers | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(TIMERS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<MonsterArenaSavedTimers>;
    const rawWarlord = Number(p.warlordTimer);
    const rawTitan = Number(p.titanTimer);
    const warlordTimer =
      Number.isFinite(rawWarlord) && rawWarlord > 0 && rawWarlord <= WARLORD_BOSS_INTERVAL_SEC
        ? rawWarlord
        : WARLORD_BOSS_INTERVAL_SEC;
    const titanTimer =
      Number.isFinite(rawTitan) && rawTitan > 0 && rawTitan <= TITAN_BOSS_INTERVAL_SEC
        ? rawTitan
        : TITAN_BOSS_INTERVAL_SEC;
    return {
      warlordTimer,
      warlordLevel: Math.max(0, Math.floor(Number(p.warlordLevel) || 0)),
      titanTimer,
      titanLevel: Math.max(0, Math.floor(Number(p.titanLevel) || 0)),
      savedAt: Math.max(0, Number(p.savedAt) || Date.now()),
    };
  } catch {
    return null;
  }
}

export function saveMonsterArenaTimers(timers: MonsterArenaSavedTimers): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TIMERS_KEY, JSON.stringify(timers));
  } catch {
    // Ignore storage quota errors
  }
}

export function readMonsterArenaStats(): MonsterArenaStats {
  if (typeof window === 'undefined') {
    return { bestScore: 0, bestWave: 0, bestKills: 0, titansDefeated: 0 };
  }
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return { bestScore: 0, bestWave: 0, bestKills: 0, titansDefeated: 0 };
    const p = JSON.parse(raw) as Partial<MonsterArenaStats>;
    return {
      bestScore: Math.max(0, Math.floor(Number(p.bestScore) || 0)),
      bestWave: Math.max(0, Math.floor(Number(p.bestWave) || 0)),
      bestKills: Math.max(0, Math.floor(Number(p.bestKills) || 0)),
      titansDefeated: Math.max(0, Math.floor(Number(p.titansDefeated) || 0)),
    };
  } catch {
    return { bestScore: 0, bestWave: 0, bestKills: 0, titansDefeated: 0 };
  }
}

export function saveMonsterArenaStats(stats: MonsterArenaStats): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors
  }
}

export function readMonsterArenaSavedRun(): MonsterArenaSavedRun | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<MonsterArenaSavedRun>;
    const ownedSet = new Set<WeaponId>(['plasma_pistol']);
    if (Array.isArray(p.ownedWeapons)) {
      for (const w of p.ownedWeapons) {
        if (ALL_WEAPON_IDS.includes(w as WeaponId)) {
          ownedSet.add(w as WeaponId);
        }
      }
    }
    const activeWeapon: WeaponId =
      p.activeWeapon && ownedSet.has(p.activeWeapon)
        ? p.activeWeapon
        : 'plasma_pistol';
    const petRoster: SavedPetSlot[] = [];
    const usedSlots = new Set<number>();
    const pickFreeSlot = (preferred?: number): number => {
      if (
        typeof preferred === 'number' &&
        Number.isInteger(preferred) &&
        preferred >= 0 &&
        preferred < MAX_PET_SQUAD &&
        !usedSlots.has(preferred)
      ) {
        usedSlots.add(preferred);
        return preferred;
      }
      for (let s = 0; s < MAX_PET_SQUAD; s++) {
        if (!usedSlots.has(s)) {
          usedSlots.add(s);
          return s;
        }
      }
      return 0;
    };

    if (Array.isArray(p.petRoster)) {
      for (const slot of p.petRoster) {
        if (
          slot &&
          ALL_PET_IDS.includes(slot.petId as PetId) &&
          petRoster.length < MAX_PET_SQUAD
        ) {
          const lv = Math.max(1, Math.min(MAX_PET_LEVEL, Math.floor(Number(slot.level) || 1)));
          const gx = typeof slot.guardX === 'number' && Number.isFinite(slot.guardX) ? slot.guardX : null;
          const gz = typeof slot.guardZ === 'number' && Number.isFinite(slot.guardZ) ? slot.guardZ : null;
          const savedHp = typeof slot.hp === 'number' && Number.isFinite(slot.hp) && slot.hp > 0 ? slot.hp : undefined;
          petRoster.push({
            petId: slot.petId as PetId,
            level: lv,
            slot: pickFreeSlot(slot.slot),
            hp: savedHp,
            guardX: gx,
            guardZ: gz,
          });
        }
      }
    } else if (p.ownedPets && typeof p.ownedPets === 'object') {
      // Backward compatibility for earlier saved runs
      for (const pid of ALL_PET_IDS) {
        const lv = Math.floor(Number((p.ownedPets as Record<string, unknown>)[pid]) || 0);
        if (lv >= 1 && petRoster.length < MAX_PET_SQUAD) {
          petRoster.push({
            petId: pid,
            level: Math.min(MAX_PET_LEVEL, lv),
            slot: pickFreeSlot(),
            guardX: null,
            guardZ: null,
          });
        }
      }
    }
    const maxEnergy = Math.max(BASE_MAX_ENERGY, Math.floor(Number(p.maxEnergy) || BASE_MAX_ENERGY));
    const energy = Math.min(maxEnergy, Math.max(15, Math.floor(Number(p.energy) || maxEnergy)));
    const rawWarlord = Number(p.warlordTimer);
    const warlordTimer =
      Number.isFinite(rawWarlord) && rawWarlord > 0 && rawWarlord <= WARLORD_BOSS_INTERVAL_SEC
        ? rawWarlord
        : WARLORD_BOSS_INTERVAL_SEC;
    const rawTitan = Number(p.titanTimer);
    const titanTimer =
      Number.isFinite(rawTitan) && rawTitan > 0 && rawTitan <= TITAN_BOSS_INTERVAL_SEC
        ? rawTitan
        : TITAN_BOSS_INTERVAL_SEC;

    return {
      coins: Math.max(0, Math.floor(Number(p.coins) || 0)),
      score: Math.max(0, Math.floor(Number(p.score) || 0)),
      wave: Math.max(1, Math.floor(Number(p.wave) || 1)),
      kills: Math.max(0, Math.floor(Number(p.kills) || 0)),
      energy,
      maxEnergy,
      activeWeapon,
      ownedWeapons: Array.from(ownedSet),
      petRoster,
      warlordTimer,
      warlordLevel: Math.max(0, Math.floor(Number(p.warlordLevel) || 0)),
      titanTimer,
      titanLevel: Math.max(0, Math.floor(Number(p.titanLevel) || 0)),
      fruitsEaten: Math.max(0, Math.floor(Number(p.fruitsEaten) || 0)),
      savedAt: Math.max(0, Number(p.savedAt) || Date.now()),
    };
  } catch {
    return null;
  }
}

export function saveMonsterArenaRun(run: MonsterArenaSavedRun): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(run));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearMonsterArenaSavedRun(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function readMonsterArenaSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(SOUND_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export function saveMonsterArenaSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SOUND_KEY, String(enabled));
  } catch {
    // Ignore storage errors
  }
}
