export type PlantMergeStatus =
  | 'START'
  | 'PLAYING'
  | 'PAUSED'
  | 'EATING_HOUSE'
  | 'GAME_OVER';

export type PlantTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export const MAX_PLANT_TIER: PlantTier = 11;
export const MEGA_BOSS_INTERVAL_SEC = 300; // 5 minutes

export const ALL_PLANT_TIERS: readonly PlantTier[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
];

export type MonsterKind =
  | 'slime'
  | 'skeleton'
  | 'spider'
  | 'goblin'
  | 'beetle'
  | 'wasp'
  | 'mushroom'
  | 'mummy'
  | 'wolf'
  | 'bat'
  | 'troll'
  | 'orc'
  | 'ghost'
  | 'darkKnight'
  | 'golem'
  | 'scorpion'
  | 'magma'
  | 'iceYeti'
  | 'dragon'
  | 'boss'
  | 'megaBoss';

export const ALL_MONSTER_KINDS: readonly MonsterKind[] = [
  'slime',
  'skeleton',
  'spider',
  'goblin',
  'beetle',
  'wasp',
  'mushroom',
  'mummy',
  'wolf',
  'bat',
  'troll',
  'orc',
  'ghost',
  'darkKnight',
  'golem',
  'scorpion',
  'magma',
  'iceYeti',
  'dragon',
  'boss',
  'megaBoss',
];

export interface PlantTierSpec {
  tier: PlantTier;
  cost: number; // Shop price in coins
  isNew?: boolean; // Highlight the 5 new shop plants
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  maxHp: number;
  damage: number;
  fireInterval: number; // seconds between shots
  projectileSpeed: number;
  projectileColor: string;
  accentColor: string;
  slowFactor?: number;
  slowDuration?: number;
  splashRadius?: number;
  poisonDps?: number;
  poisonDuration?: number;
  twinShot?: boolean;
  tripleShot?: boolean;
  coinsPerSec?: number; // bonus passive coin income
}

export interface MonsterSpec {
  kind: MonsterKind;
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  baseHp: number;
  speed: number;
  attackDamage: number;
  attackInterval: number;
  rewardCoins: number;
  rewardScore: number;
  baseDamage: number; // damage per house bite
  scale: number;
  primaryColor: string;
  accentColor: string;
  flying?: boolean;
}

export interface PlantEntity {
  id: number;
  row: number; // 0..2
  col: number; // 0..4
  tier: PlantTier;
  hp: number;
  maxHp: number;
  fireCooldown: number;
  recoil: number;
  spawnAnim: number;
  hitFlash: number;
}

export interface MonsterEntity {
  id: number;
  kind: MonsterKind;
  row: number; // 0..2
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  speed: number;
  attackCooldown: number;
  hitFlash: number;
  slowTimer: number;
  poisonTimer: number;
  poisonDps: number;
  walkPhase: number;
  isAttacking: boolean;
  isEatingHouse: boolean;
  summonCooldown: number;
}

export interface ProjectileEntity {
  id: number;
  row: number;
  x: number;
  y: number;
  z: number;
  speed: number;
  damage: number;
  color: string;
  tier: PlantTier;
  splashRadius: number;
  slowFactor: number;
  slowDuration: number;
  poisonDps: number;
  poisonDuration: number;
}

export interface ParticleBurst {
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

export interface SavedPlantSlot {
  row: number;
  col: number;
  tier: PlantTier;
  hpRatio: number;
}

export interface PlantMergeSavedGarden {
  wave: number;
  coins: number;
  score: number;
  farmHp: number;
  powerLevel: number;
  selectedShopTier: PlantTier;
  speedMul: 1 | 2;
  monstersDefeated: number;
  megaBossTimer: number;
  megaBossCount: number;
  plants: SavedPlantSlot[];
  savedAt: number;
}

export interface PlantMergeIndexData {
  discoveredPlants: PlantTier[];
  defeatedMonsters: Partial<Record<MonsterKind, number>>;
}

export interface PlantMergeHudSnapshot {
  status: PlantMergeStatus;
  wave: number;
  waveProgress: number;
  bossActive: boolean;
  bossHpRatio: number;
  megaBossTimer: number;
  megaBossActive: boolean;
  megaBossHp: number;
  megaBossMaxHp: number;
  megaBossLevel: number;
  houseBeingEaten: boolean;
  coins: number;
  lastCoinReward: number;
  lastCoinRewardTimer: number;
  score: number;
  bestScore: number;
  bestWave: number;
  highestTier: PlantTier;
  farmHp: number;
  maxFarmHp: number;
  plantCount: number;
  maxPlots: number;
  selectedShopTier: PlantTier;
  selectedPlantTier: PlantTier | null;
  selectedPlantSellValue: number;
  powerLevel: number;
  powerUpgradeCost: number;
  waterCost: number;
  waterBoostTimer: number;
  selectedPlot: { row: number; col: number } | null;
  speedMul: 1 | 2;
  bannerText: string;
  bannerTone: 'info' | 'boss' | 'merge' | 'warn';
  monstersDefeated: number;
  hasSavedGarden: boolean;
  savedWave: number;
  savedPlantCount: number;
  discoveredPlants: PlantTier[];
  defeatedMonsters: Partial<Record<MonsterKind, number>>;
}

export interface PlantMergeStats {
  bestWave: number;
  bestScore: number;
  highestTier: PlantTier;
}

export const GRID_ROWS = 3;
export const GRID_COLS = 5;
export const MAX_FARM_HP = 5;

export const LANE_Z: readonly number[] = [-2.55, 0, 2.55];
export const COL_X: readonly number[] = [-4.2, -2.55, -0.9, 0.75, 2.4];
export const MONSTER_SPAWN_X = 8.9;
export const FARM_GATE_X = -5.55;

/**
 * 11 Purchasable 3D Plant Types — Ultra-Hardcore Balance (-400% HP/DMG/Poison = ÷5, +350% Shop Prices)
 */
export const PLANT_SPECS: Record<PlantTier, PlantTierSpec> = {
  1: {
    tier: 1,
    cost: 113,
    nameAr: 'برعم البازلاء',
    nameEn: 'Pea Sprout',
    roleAr: 'يطلق كرات بازلاء سريعة لحماية المسار بسعر اقتصادي.',
    roleEn: 'Fires steady pea shots to defend a lane at low cost.',
    maxHp: 9,
    damage: 2,
    fireInterval: 1.15,
    projectileSpeed: 9.5,
    projectileColor: '#86efac',
    accentColor: '#22c55e',
    coinsPerSec: 0,
  },
  2: {
    tier: 2,
    cost: 270,
    nameAr: 'زهرة النار',
    nameEn: 'Ember Tulip',
    roleAr: 'تطلق كرات نار حارقة تنفجر وتصيب الوحوش المجاورة.',
    roleEn: 'Launches fiery bolts that explode for splash damage.',
    maxHp: 14,
    damage: 4,
    fireInterval: 1.02,
    projectileSpeed: 10.6,
    projectileColor: '#fb923c',
    accentColor: '#ea580c',
    splashRadius: 0.75,
    coinsPerSec: 0,
  },
  3: {
    tier: 3,
    cost: 495,
    nameAr: 'صبار الجليد',
    nameEn: 'Frost Cactus',
    roleAr: 'يرمي شظايا جليدية تبطّئ حركة الوحوش بنسبة 48% وتؤخر وصولهم للمنزل.',
    roleEn: 'Shoots frost shards that slow monsters by 48%.',
    maxHp: 23,
    damage: 6,
    fireInterval: 0.94,
    projectileSpeed: 11.4,
    projectileColor: '#67e8f9',
    accentColor: '#06b6d4',
    slowFactor: 0.52,
    slowDuration: 2.6,
    coinsPerSec: 0,
  },
  4: {
    tier: 4,
    cost: 810,
    nameAr: 'زهرة الصاعقة',
    nameEn: 'Storm Sunflower',
    roleAr: 'تضرب صواعق كهربائية جماعية وتولّد فلوساً إضافية لمزرعتك تلقائياً.',
    roleEn: 'Deals lightning splash and generates bonus Coins automatically.',
    maxHp: 34,
    damage: 11,
    fireInterval: 0.82,
    projectileSpeed: 13.0,
    projectileColor: '#fde047',
    accentColor: '#eab308',
    splashRadius: 1.15,
    coinsPerSec: 2.2,
  },
  5: {
    tier: 5,
    cost: 1260,
    nameAr: 'زهرة التنين',
    nameEn: 'Dragon Blossom',
    roleAr: 'تطلق كرتي بلازما متفجرتين وتساعد في الدفاع عن المسارات الأخرى!',
    roleEn: 'Fires twin explosive plasma orbs and supports adjacent lanes.',
    maxHp: 50,
    damage: 16,
    fireInterval: 0.72,
    projectileSpeed: 14.2,
    projectileColor: '#e879f9',
    accentColor: '#a855f7',
    splashRadius: 1.45,
    twinShot: true,
    coinsPerSec: 0.8,
  },
  6: {
    tier: 6,
    cost: 1890,
    nameAr: 'شجرة الكريستال',
    nameEn: 'Crystal Ancient',
    roleAr: 'شعاع مزدوج يجمّد الوحوش وينفجر بمساحة واسعة عبر جميع المسارات.',
    roleEn: 'Twin frost nova beams with wide splash and chilling slow.',
    maxHp: 78,
    damage: 31,
    fireInterval: 0.64,
    projectileSpeed: 15.8,
    projectileColor: '#34d399',
    accentColor: '#10b981',
    splashRadius: 1.9,
    slowFactor: 0.48,
    slowDuration: 2.8,
    twinShot: true,
    coinsPerSec: 1.5,
  },
  7: {
    tier: 7,
    cost: 2610,
    isNew: true,
    nameAr: 'فطر السم',
    nameEn: 'Venom Shroom',
    roleAr: 'يطلق أبواغاً سامة مزدوجة تنفجر وتسبب ضرر سم مستمر يذيب الوحوش الثقيلة.',
    roleEn: 'Fires twin toxic spores with splash and strong poison DoT.',
    maxHp: 108,
    damage: 43,
    fireInterval: 0.62,
    projectileSpeed: 15.2,
    projectileColor: '#a3e635',
    accentColor: '#65a30d',
    splashRadius: 2.1,
    poisonDps: 9,
    poisonDuration: 4.0,
    twinShot: true,
    coinsPerSec: 1.8,
  },
  8: {
    tier: 8,
    cost: 3510,
    isNew: true,
    nameAr: 'لوتس القمر',
    nameEn: 'Lunar Lotus',
    roleAr: 'تطلق أقواساً قمرية مبطّئة وتدرّ دخلاً عالياً من الفلوس كل ثانية.',
    roleEn: 'Chilling lunar arcs plus strong passive Coin generation.',
    maxHp: 148,
    damage: 59,
    fireInterval: 0.58,
    projectileSpeed: 16.8,
    projectileColor: '#93c5fd',
    accentColor: '#3b82f6',
    splashRadius: 2.25,
    slowFactor: 0.42,
    slowDuration: 3.4,
    twinShot: true,
    coinsPerSec: 4.5,
  },
  9: {
    tier: 9,
    cost: 4725,
    isNew: true,
    nameAr: 'نخلة البركان',
    nameEn: 'Volcano Palm',
    roleAr: 'تقذف 3 قنابل حمم بركانية متفجرة في كل طلقة لسحق موجات الوحوش.',
    roleEn: 'Launches 3 explosive volcanic magma bombs per shot.',
    maxHp: 204,
    damage: 82,
    fireInterval: 0.6,
    projectileSpeed: 16.5,
    projectileColor: '#fb7185',
    accentColor: '#e11d48',
    splashRadius: 2.55,
    tripleShot: true,
    coinsPerSec: 2.5,
  },
  10: {
    tier: 10,
    cost: 6300,
    isNew: true,
    nameAr: 'زهرة النجم',
    nameEn: 'Starlight Orchid',
    roleAr: 'أشعة نجمية ثلاثية سريعة تجمع بين التجميد والسم والانفجار الواسع.',
    roleEn: 'Triple cosmic rays combining freeze, venom DoT, and wide splash.',
    maxHp: 276,
    damage: 112,
    fireInterval: 0.54,
    projectileSpeed: 18.2,
    projectileColor: '#38bdf8',
    accentColor: '#0284c7',
    splashRadius: 2.8,
    slowFactor: 0.4,
    slowDuration: 3.5,
    poisonDps: 15,
    poisonDuration: 4.5,
    tripleShot: true,
    coinsPerSec: 4.0,
  },
  11: {
    tier: 11,
    cost: 8550,
    isNew: true,
    nameAr: 'حارس المجرة',
    nameEn: 'Galaxy Guardian',
    roleAr: 'أقوى نبتة كونية — 3 أشعة نوفا مدمّرة بالتجميد والسم ودخل فلوس ضخم!',
    roleEn: 'Ultimate cosmic tree: triple nova with freeze, poison & huge Coins.',
    maxHp: 380,
    damage: 156,
    fireInterval: 0.48,
    projectileSpeed: 19.8,
    projectileColor: '#fef08a',
    accentColor: '#f59e0b',
    splashRadius: 3.3,
    slowFactor: 0.36,
    slowDuration: 4.0,
    poisonDps: 22,
    poisonDuration: 5.0,
    tripleShot: true,
    coinsPerSec: 7.5,
  },
};

/**
 * 21 Distinct 3D Monster Species — Rewarding Coin Drops on Every Kill
 */
export const MONSTER_SPECS: Record<MonsterKind, MonsterSpec> = {
  slime: {
    kind: 'slime',
    nameAr: 'سلايم الوحل',
    nameEn: 'Mud Slime',
    roleAr: 'وحش بطيء أساسي يعطي فلوساً سريعة عند قتله.',
    roleEn: 'Basic slow ooze.',
    baseHp: 52,
    speed: 1.05,
    attackDamage: 14,
    attackInterval: 1.1,
    rewardCoins: 16,
    rewardScore: 15,
    baseDamage: 1,
    scale: 1,
    primaryColor: '#65a30d',
    accentColor: '#bef264',
  },
  skeleton: {
    kind: 'skeleton',
    nameAr: 'هيكل عظمي',
    nameEn: 'Bone Skeleton',
    roleAr: 'محارب عظمي رشيق بسيف.',
    roleEn: 'Agile sword skeleton.',
    baseHp: 64,
    speed: 1.38,
    attackDamage: 17,
    attackInterval: 0.95,
    rewardCoins: 20,
    rewardScore: 20,
    baseDamage: 1,
    scale: 1.0,
    primaryColor: '#e2e8f0',
    accentColor: '#94a3b8',
  },
  spider: {
    kind: 'spider',
    nameAr: 'عنكبوت السم',
    nameEn: 'Venom Spider',
    roleAr: 'عنكبوت سريع زاحف يهاجم بسرعة.',
    roleEn: 'Swift venomous crawler.',
    baseHp: 58,
    speed: 1.72,
    attackDamage: 16,
    attackInterval: 0.82,
    rewardCoins: 22,
    rewardScore: 24,
    baseDamage: 1,
    scale: 0.95,
    primaryColor: '#2e1065',
    accentColor: '#84cc16',
  },
  goblin: {
    kind: 'goblin',
    nameAr: 'عفريت الغابة',
    nameEn: 'Forest Goblin',
    roleAr: 'مهاجم سريع بهراوة خشبية.',
    roleEn: 'Fast club raider.',
    baseHp: 82,
    speed: 1.5,
    attackDamage: 20,
    attackInterval: 0.9,
    rewardCoins: 26,
    rewardScore: 26,
    baseDamage: 1,
    scale: 1,
    primaryColor: '#dc2626',
    accentColor: '#fbbf24',
  },
  beetle: {
    kind: 'beetle',
    nameAr: 'خنفساء الدرع',
    nameEn: 'Iron Beetle',
    roleAr: 'خنفساء مدرّعة بقرن قوي تظهر من الجولة 2 حتى 5 وتتحمل الضربات.',
    roleEn: 'Armored horned beetle spawning from Wave 2 to 5.',
    baseHp: 118,
    speed: 1.02,
    attackDamage: 19,
    attackInterval: 1.05,
    rewardCoins: 30,
    rewardScore: 30,
    baseDamage: 1,
    scale: 1.06,
    primaryColor: '#047857',
    accentColor: '#fbbf24',
  },
  wasp: {
    kind: 'wasp',
    nameAr: 'دبور السم',
    nameEn: 'Venom Wasp',
    roleAr: 'دبور طائر فائق السرعة بإبرة سامة يظهر بين الجولتين 2 و5.',
    roleEn: 'Swift flying stinger spawning across Waves 2 to 5.',
    baseHp: 74,
    speed: 1.92,
    attackDamage: 20,
    attackInterval: 0.8,
    rewardCoins: 28,
    rewardScore: 32,
    baseDamage: 1,
    scale: 0.96,
    primaryColor: '#ca8a04',
    accentColor: '#fde047',
    flying: true,
  },
  mushroom: {
    kind: 'mushroom',
    nameAr: 'وحش الفطر',
    nameEn: 'Spore Brute',
    roleAr: 'فطر سميك يتحمل الضربات ويعطي فلوساً ممتازة.',
    roleEn: 'Sturdy fungal tank.',
    baseHp: 148,
    speed: 0.88,
    attackDamage: 22,
    attackInterval: 1.18,
    rewardCoins: 34,
    rewardScore: 34,
    baseDamage: 1,
    scale: 1.12,
    primaryColor: '#b91c1c',
    accentColor: '#fef3c7',
  },
  mummy: {
    kind: 'mummy',
    nameAr: 'مومياء الرمال',
    nameEn: 'Sand Mummy',
    roleAr: 'مومياء ملعونة صلبة تظهر بين الجولة 3 و5 بضرر عالٍ.',
    roleEn: 'Cursed desert mummy spawning from Wave 3 to 5.',
    baseHp: 162,
    speed: 0.94,
    attackDamage: 24,
    attackInterval: 1.08,
    rewardCoins: 38,
    rewardScore: 38,
    baseDamage: 1,
    scale: 1.08,
    primaryColor: '#d6c39c',
    accentColor: '#2dd4bf',
  },
  wolf: {
    kind: 'wolf',
    nameAr: 'ذئب الظل',
    nameEn: 'Shadow Wolf',
    roleAr: 'صياد ليلي فائق السرعة.',
    roleEn: 'Ultra-fast dark hunter.',
    baseHp: 94,
    speed: 2.02,
    attackDamage: 24,
    attackInterval: 0.78,
    rewardCoins: 32,
    rewardScore: 36,
    baseDamage: 1,
    scale: 1.04,
    primaryColor: '#1f2937',
    accentColor: '#f59e0b',
  },
  bat: {
    kind: 'bat',
    nameAr: 'خفاش الظلام',
    nameEn: 'Shadow Imp',
    roleAr: 'طائر سريع يرفرف بجناحيه.',
    roleEn: 'Swift flying shadow.',
    baseHp: 76,
    speed: 1.88,
    attackDamage: 19,
    attackInterval: 0.85,
    rewardCoins: 30,
    rewardScore: 32,
    baseDamage: 1,
    scale: 0.96,
    primaryColor: '#4c1d95',
    accentColor: '#f472b6',
    flying: true,
  },
  troll: {
    kind: 'troll',
    nameAr: 'ترول المستنقع',
    nameEn: 'Swamp Troll',
    roleAr: 'عملاق مستنقعات بهراوة حجرية يظهر في الجولتين 4 و5.',
    roleEn: 'Hulking swamp brute spawning in Waves 4 and 5.',
    baseHp: 218,
    speed: 0.86,
    attackDamage: 31,
    attackInterval: 1.18,
    rewardCoins: 48,
    rewardScore: 46,
    baseDamage: 1,
    scale: 1.2,
    primaryColor: '#0f766e',
    accentColor: '#a3e635',
  },
  orc: {
    kind: 'orc',
    nameAr: 'أورك المدرّع',
    nameEn: 'Armored Orc',
    roleAr: 'محارب مدرّع بفأس حربي ثقيل.',
    roleEn: 'Heavy axe warrior.',
    baseHp: 195,
    speed: 0.96,
    attackDamage: 30,
    attackInterval: 1.15,
    rewardCoins: 45,
    rewardScore: 44,
    baseDamage: 1,
    scale: 1.16,
    primaryColor: '#15803d',
    accentColor: '#9ca3af',
  },
  ghost: {
    kind: 'ghost',
    nameAr: 'شبح الضباب',
    nameEn: 'Mist Wraith',
    roleAr: 'طيف طائر سريع الاختراق.',
    roleEn: 'Hovering phantom menace.',
    baseHp: 122,
    speed: 1.64,
    attackDamage: 26,
    attackInterval: 0.88,
    rewardCoins: 40,
    rewardScore: 42,
    baseDamage: 1,
    scale: 1.02,
    primaryColor: '#0e7490',
    accentColor: '#67e8f9',
    flying: true,
  },
  darkKnight: {
    kind: 'darkKnight',
    nameAr: 'فارس الظل',
    nameEn: 'Shadow Knight',
    roleAr: 'فارس مدرّع بسيف متوهج ودرع حديدي يظهر في الجولتين 4 و5 بمكافأة كبيرة.',
    roleEn: 'Armored dark knight with glowing greatsword spawning in Waves 4 & 5.',
    baseHp: 265,
    speed: 1.12,
    attackDamage: 36,
    attackInterval: 1.0,
    rewardCoins: 62,
    rewardScore: 58,
    baseDamage: 1,
    scale: 1.18,
    primaryColor: '#312e81',
    accentColor: '#c084fc',
  },
  golem: {
    kind: 'golem',
    nameAr: 'غول الصخر',
    nameEn: 'Stone Golem',
    roleAr: 'عملاق حجري ثقيل شديد التحمل.',
    roleEn: 'Heavy boulder titan.',
    baseHp: 245,
    speed: 0.72,
    attackDamage: 34,
    attackInterval: 1.35,
    rewardCoins: 55,
    rewardScore: 52,
    baseDamage: 1,
    scale: 1.24,
    primaryColor: '#475569',
    accentColor: '#f97316',
  },
  scorpion: {
    kind: 'scorpion',
    nameAr: 'عقرب الصحراء',
    nameEn: 'Dune Scorpion',
    roleAr: 'عقرب مدرّع بذيل لاسع وسرعة عالية.',
    roleEn: 'Armored stinger beast.',
    baseHp: 175,
    speed: 1.44,
    attackDamage: 32,
    attackInterval: 0.92,
    rewardCoins: 52,
    rewardScore: 55,
    baseDamage: 1,
    scale: 1.1,
    primaryColor: '#b45309',
    accentColor: '#c084fc',
  },
  magma: {
    kind: 'magma',
    nameAr: 'عملاق الحمم',
    nameEn: 'Magma Elemental',
    roleAr: 'وحش بركاني بضرر حارق ومكافأة كبيرة.',
    roleEn: 'Molten volcanic brute.',
    baseHp: 310,
    speed: 0.84,
    attackDamage: 42,
    attackInterval: 1.2,
    rewardCoins: 72,
    rewardScore: 68,
    baseDamage: 1,
    scale: 1.3,
    primaryColor: '#451a03',
    accentColor: '#fb923c',
  },
  iceYeti: {
    kind: 'iceYeti',
    nameAr: 'يتي الجليد',
    nameEn: 'Frost Yeti',
    roleAr: 'عملاق ثلجي شديد التحمل.',
    roleEn: 'Massive glacier beast.',
    baseHp: 390,
    speed: 0.76,
    attackDamage: 46,
    attackInterval: 1.28,
    rewardCoins: 86,
    rewardScore: 78,
    baseDamage: 1,
    scale: 1.38,
    primaryColor: '#cbd5e1',
    accentColor: '#38bdf8',
  },
  dragon: {
    kind: 'dragon',
    nameAr: 'تنين الظلام',
    nameEn: 'Shadow Drake',
    roleAr: 'تنين مجنح فتاك يطير بسرعة ويمنح فلوساً وفيرة.',
    roleEn: 'Winged dread mini-boss.',
    baseHp: 460,
    speed: 1.24,
    attackDamage: 52,
    attackInterval: 1.05,
    rewardCoins: 115,
    rewardScore: 105,
    baseDamage: 2,
    scale: 1.34,
    primaryColor: '#7f1d1d',
    accentColor: '#facc15',
    flying: true,
  },
  boss: {
    kind: 'boss',
    nameAr: 'ملك الظلام',
    nameEn: 'Dread Titan',
    roleAr: 'زعيم الوحوش يظهر كل 5 موجات بمكافأة ضخمة.',
    roleEn: 'Colossal Boss every 5th wave.',
    baseHp: 980,
    speed: 0.56,
    attackDamage: 56,
    attackInterval: 1.25,
    rewardCoins: 240,
    rewardScore: 240,
    baseDamage: 2,
    scale: 1.65,
    primaryColor: '#1e1b4b',
    accentColor: '#ef4444',
  },
  megaBoss: {
    kind: 'megaBoss',
    nameAr: 'العملاق المدمّر',
    nameEn: 'Abyssal Colossal',
    roleAr: 'يظهر كل 5 دقائق ويستدعي وحوشاً قوية ويمنح 600 عملة عند قتله!',
    roleEn: 'Spawns every 5 min, summons elites & drops 600 Coins!',
    baseHp: 3800,
    speed: 0.44,
    attackDamage: 92,
    attackInterval: 1.15,
    rewardCoins: 600,
    rewardScore: 950,
    baseDamage: 3,
    scale: 2.25,
    primaryColor: '#180624',
    accentColor: '#f43f5e',
  },
};

const STATS_STORAGE_KEY = 'point_catcher_plant_merge_stats_v1';
const SOUND_STORAGE_KEY = 'point_catcher_plant_merge_sound_v1';
const GARDEN_STORAGE_KEY = 'point_catcher_plant_merge_garden_v2';
const INDEX_STORAGE_KEY = 'point_catcher_plant_merge_index_v1';

export function clampPlantTier(value: number): PlantTier {
  const n = Math.floor(Number(value) || 1);
  if (n < 1) return 1;
  if (n > MAX_PLANT_TIER) return MAX_PLANT_TIER;
  return n as PlantTier;
}

export function readPlantMergeStats(): PlantMergeStats {
  if (typeof window === 'undefined') {
    return { bestWave: 0, bestScore: 0, highestTier: 1 };
  }
  try {
    const raw = window.localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return { bestWave: 0, bestScore: 0, highestTier: 1 };
    const parsed = JSON.parse(raw) as Partial<PlantMergeStats>;
    return {
      bestWave: Math.max(0, Math.floor(Number(parsed.bestWave) || 0)),
      bestScore: Math.max(0, Math.floor(Number(parsed.bestScore) || 0)),
      highestTier: clampPlantTier(Number(parsed.highestTier) || 1),
    };
  } catch {
    return { bestWave: 0, bestScore: 0, highestTier: 1 };
  }
}

export function savePlantMergeStats(stats: PlantMergeStats): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors
  }
}

export function readPlantMergeIndex(): PlantMergeIndexData {
  if (typeof window === 'undefined') {
    return { discoveredPlants: [1], defeatedMonsters: {} };
  }
  try {
    const raw = window.localStorage.getItem(INDEX_STORAGE_KEY);
    if (!raw) return { discoveredPlants: [1], defeatedMonsters: {} };
    const parsed = JSON.parse(raw) as Partial<PlantMergeIndexData>;
    const plantSet = new Set<PlantTier>([1]);
    if (Array.isArray(parsed.discoveredPlants)) {
      for (const t of parsed.discoveredPlants) {
        plantSet.add(clampPlantTier(Number(t)));
      }
    }
    const defeated: Partial<Record<MonsterKind, number>> = {};
    if (parsed.defeatedMonsters && typeof parsed.defeatedMonsters === 'object') {
      for (const kind of ALL_MONSTER_KINDS) {
        const val = Number(
          (parsed.defeatedMonsters as Record<string, unknown>)[kind]
        );
        if (Number.isFinite(val) && val > 0) {
          defeated[kind] = Math.floor(val);
        }
      }
    }
    return {
      discoveredPlants: Array.from(plantSet).sort((a, b) => a - b),
      defeatedMonsters: defeated,
    };
  } catch {
    return { discoveredPlants: [1], defeatedMonsters: {} };
  }
}

export function savePlantMergeIndex(indexData: PlantMergeIndexData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(INDEX_STORAGE_KEY, JSON.stringify(indexData));
  } catch {
    // Ignore storage quota errors
  }
}

export function readSavedGarden(): PlantMergeSavedGarden | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(GARDEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlantMergeSavedGarden> & {
      sun?: number;
    };
    if (!Array.isArray(parsed.plants)) return null;

    const seen = new Set<string>();
    const cleanPlants: SavedPlantSlot[] = [];
    for (const slot of parsed.plants) {
      if (!slot || typeof slot !== 'object') continue;
      const row = Math.floor(Number(slot.row));
      const col = Math.floor(Number(slot.col));
      if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) continue;
      const key = `${row}-${col}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const hpRatioRaw = Number(slot.hpRatio);
      const hpRatio =
        Number.isFinite(hpRatioRaw) && hpRatioRaw > 0
          ? Math.min(1, Math.max(0.1, hpRatioRaw))
          : 1;
      cleanPlants.push({
        row,
        col,
        tier: clampPlantTier(Number(slot.tier) || 1),
        hpRatio,
      });
    }

    const rawTimer = Number(parsed.megaBossTimer);
    const megaBossTimer =
      Number.isFinite(rawTimer) && rawTimer > 0 && rawTimer <= MEGA_BOSS_INTERVAL_SEC
        ? rawTimer
        : MEGA_BOSS_INTERVAL_SEC;

    const savedCoins =
      parsed.coins !== undefined ? Number(parsed.coins) : Number(parsed.sun);

    return {
      wave: Math.max(1, Math.floor(Number(parsed.wave) || 1)),
      coins: Math.max(0, Math.floor(Number.isFinite(savedCoins) ? savedCoins : 100)),
      score: Math.max(0, Math.floor(Number(parsed.score) || 0)),
      farmHp: Math.min(
        MAX_FARM_HP,
        Math.max(1, Math.floor(Number(parsed.farmHp) || MAX_FARM_HP))
      ),
      powerLevel: Math.min(12, Math.max(1, Math.floor(Number(parsed.powerLevel) || 1))),
      selectedShopTier: clampPlantTier(Number(parsed.selectedShopTier) || 1),
      speedMul: parsed.speedMul === 2 ? 2 : 1,
      monstersDefeated: Math.max(0, Math.floor(Number(parsed.monstersDefeated) || 0)),
      megaBossTimer,
      megaBossCount: Math.max(0, Math.floor(Number(parsed.megaBossCount) || 0)),
      plants: cleanPlants,
      savedAt: Math.max(0, Number(parsed.savedAt) || Date.now()),
    };
  } catch {
    return null;
  }
}

export function saveGardenState(garden: PlantMergeSavedGarden): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(garden));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearSavedGarden(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(GARDEN_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function readPlantMergeSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(SOUND_STORAGE_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export function savePlantMergeSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore storage quota errors
  }
}
