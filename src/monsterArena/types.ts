export type ArenaStatus = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type WeaponId =
  | 'plasma_pistol'
  | 'twin_blasters'
  | 'scatter_shotgun'
  | 'frost_rifle'
  | 'laser_sniper'
  | 'thunder_cannon'
  | 'sawblade_launcher'
  | 'venom_gatling'
  | 'magma_mortar'
  | 'dragon_flamethrower'
  | 'cryo_minigun'
  | 'cosmic_annihilator'
  | 'solar_nova_blade';

export type PetId =
  | 'wolf'
  | 'falcon'
  | 'tiger'
  | 'bear'
  | 'rhino'
  | 'panther'
  | 'gorilla'
  | 'lion'
  | 'shark'
  | 'baby_dragon'
  | 'trex';

export type FruitId =
  | 'apple'
  | 'strawberry'
  | 'banana'
  | 'grapes'
  | 'watermelon'
  | 'pineapple'
  | 'mango'
  | 'kiwi'
  | 'dragonfruit'
  | 'golden_date'
  | 'coconut';

export type MeatId =
  | 'chicken_leg'
  | 'lamb_chop'
  | 'beef_steak'
  | 'grilled_ribs'
  | 'wagyu_feast'
  | 'dragon_meat';

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
  'laser_sniper',
  'thunder_cannon',
  'sawblade_launcher',
  'venom_gatling',
  'magma_mortar',
  'dragon_flamethrower',
  'cryo_minigun',
  'cosmic_annihilator',
  'solar_nova_blade',
];

export const ALL_PET_IDS: readonly PetId[] = [
  'wolf',
  'falcon',
  'tiger',
  'bear',
  'rhino',
  'panther',
  'gorilla',
  'lion',
  'shark',
  'baby_dragon',
  'trex',
];

export const ALL_FRUIT_IDS: readonly FruitId[] = [
  'apple',
  'strawberry',
  'banana',
  'grapes',
  'watermelon',
  'pineapple',
  'mango',
  'kiwi',
  'dragonfruit',
  'golden_date',
  'coconut',
];

export const ALL_MEAT_IDS: readonly MeatId[] = [
  'chicken_leg',
  'lamb_chop',
  'beef_steak',
  'grilled_ribs',
  'wagyu_feast',
  'dragon_meat',
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

export interface MeatSpec {
  id: MeatId;
  cost: number;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  petHealAmount: number; // 9999 = full pet energy heal
  petMaxHpBonus: number; // permanent max energy/HP bonus for every active pet
  petDmgBoostPct?: number; // temporary pet damage boost %
  petSpeedBoostPct?: number; // temporary pet attack speed boost %
  buffDurationSec?: number;
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
  laser_sniper: {
    id: 'laser_sniper',
    cost: 520,
    nameAr: 'قناص الليزر الثاقب',
    nameEn: 'Laser Rail Sniper',
    descAr: 'شعاع ليزر فائق السرعة يخترق 5 وحوش بخط مستقيم بضرر قاتل!',
    descEn: 'Hyper-velocity crimson rail beam piercing up to 5 monsters.',
    damage: 135,
    fireInterval: 0.65,
    projectileSpeed: 38,
    range: 22,
    pellets: 1,
    spreadAngle: 0,
    splashRadius: 0.9,
    slowDuration: 0,
    poisonDps: 0,
    poisonDuration: 0,
    pierce: 4,
    color: '#f43f5e',
    accent: '#9f1239',
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
  sawblade_launcher: {
    id: 'sawblade_launcher',
    cost: 860,
    nameAr: 'قاذف المناشير الفولاذية',
    nameEn: 'Sawblade Launcher',
    descAr: 'يطلق 3 مناشير فولاذية دوّارة تخترق 4 وحوش وتمزّق الصفوف!',
    descEn: 'Launches 3 spinning steel sawblades that shred through lines.',
    damage: 64,
    fireInterval: 0.44,
    projectileSpeed: 25,
    range: 17,
    pellets: 3,
    spreadAngle: 0.3,
    splashRadius: 1.5,
    slowDuration: 0,
    poisonDps: 0,
    poisonDuration: 0,
    pierce: 3,
    color: '#cbd5e1',
    accent: '#475569',
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
  magma_mortar: {
    id: 'magma_mortar',
    cost: 1350,
    nameAr: 'هاون الحمم المنصهرة',
    nameEn: 'Magma Mortar',
    descAr: 'قذائف حمم عملاقة بانفجار واسع النطاق وحروق مستمرة تلتهم الحشود!',
    descEn: 'Colossal molten shells with massive blast radius and burn DoT.',
    damage: 165,
    fireInterval: 0.68,
    projectileSpeed: 21,
    range: 19,
    pellets: 1,
    spreadAngle: 0,
    splashRadius: 4.8,
    slowDuration: 0.8,
    poisonDps: 45,
    poisonDuration: 4.0,
    pierce: 0,
    color: '#ff5722',
    accent: '#9a3412',
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
  cryo_minigun: {
    id: 'cryo_minigun',
    cost: 2100,
    nameAr: 'رشاش العاصفة الجليدية',
    nameEn: 'Cryo Storm Minigun',
    descAr: 'رشاش ثلاثي المواسير يطلق عاصفة جليد متواصلة تجمّد وتخترق كل من يقترب!',
    descEn: 'Tri-barrel frost minigun unleashing piercing sub-zero volleys.',
    damage: 58,
    fireInterval: 0.16,
    projectileSpeed: 30,
    range: 18.5,
    pellets: 3,
    spreadAngle: 0.22,
    splashRadius: 1.6,
    slowDuration: 4.0,
    poisonDps: 0,
    poisonDuration: 0,
    pierce: 1,
    color: '#38bdf8',
    accent: '#0369a1',
  },
  cosmic_annihilator: {
    id: 'cosmic_annihilator',
    cost: 2600,
    nameAr: 'مدمّر المجرة',
    nameEn: 'Cosmic Annihilator',
    descAr: '5 أشعة كونية بالتجميد والسم والانفجار الواسع لسحق موجات الوحوش!',
    descEn: '5-beam cosmic railgun with freeze, venom, and nova splash.',
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
  solar_nova_blade: {
    id: 'solar_nova_blade',
    cost: 3800,
    nameAr: 'مدفع السوبرنوفا الشمسي',
    nameEn: 'Solar Nova Cannon',
    descAr: 'أقوى سلاح أسطوري — 7 موجات شمسية خارقة بالتجميد والحرق والانفجار الهائل!',
    descEn: 'Ultimate 7-wave solar nova launcher with burn, freeze, pierce & huge blast!',
    damage: 185,
    fireInterval: 0.26,
    projectileSpeed: 34,
    range: 21.5,
    pellets: 7,
    spreadAngle: 0.52,
    splashRadius: 3.8,
    slowDuration: 3.5,
    poisonDps: 75,
    poisonDuration: 5.0,
    pierce: 3,
    color: '#fef08a',
    accent: '#ca8a04',
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
  tiger: {
    id: 'tiger',
    cost: 310,
    upgradeCostBase: 320,
    nameAr: 'النمر البنغالي',
    nameEn: 'Bengal Tiger',
    descAr: 'مفترس مخطط فائق السرعة يقفز على الوحوش بمخالب حادة واسعة.',
    descEn: 'Blazing-fast striped predator cleaving monsters with fierce slashes.',
    style: 'melee',
    baseHp: 135,
    damage: 9,
    attackInterval: 0.48,
    speed: 11.8,
    range: 11,
    splashRadius: 1.5,
    slowDuration: 0,
    primaryColor: '#f97316',
    accentColor: '#fde047',
    scale: 1.06,
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
  rhino: {
    id: 'rhino',
    cost: 540,
    upgradeCostBase: 540,
    nameAr: 'وحيد القرن المدرّع',
    nameEn: 'Armored Rhino',
    descAr: 'مدرّعة حية بطاقة عالية جداً ينطح الوحوش ويبطّئهم بصدمة أرضية!',
    descEn: 'Heavy armored tank with massive HP and stunning horn charges.',
    style: 'melee',
    baseHp: 265,
    damage: 13,
    attackInterval: 0.88,
    speed: 8.8,
    range: 10.5,
    splashRadius: 3.0,
    slowDuration: 1.8,
    primaryColor: '#475569',
    accentColor: '#e2e8f0',
    scale: 1.24,
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
  gorilla: {
    id: 'gorilla',
    cost: 880,
    upgradeCostBase: 820,
    nameAr: 'الغوريلا العملاقة',
    nameEn: 'Titan Gorilla',
    descAr: 'مقاتل جبار يضرب الأرض بموجات صدمية تدمّر الحشود وتبطئهم!',
    descEn: 'Colossal silverback brawler crushing monster packs with shockwaves.',
    style: 'melee',
    baseHp: 310,
    damage: 19,
    attackInterval: 0.82,
    speed: 9.4,
    range: 10.5,
    splashRadius: 3.5,
    slowDuration: 1.5,
    primaryColor: '#1e293b',
    accentColor: '#c084fc',
    scale: 1.28,
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
  shark: {
    id: 'shark',
    cost: 1420,
    upgradeCostBase: 1200,
    nameAr: 'القرش السماوي',
    nameEn: 'Sky Cyber Shark',
    descAr: 'قرش طائر يطلق قذائف بلازما مجمّدة ويزيد عملات القتل +10%!',
    descEn: 'Hovering cyber-shark firing freezing hydro-plasma + +10% Coins!',
    style: 'ranged',
    flying: true,
    baseHp: 270,
    damage: 21,
    attackInterval: 0.56,
    speed: 11.4,
    range: 16,
    splashRadius: 2.6,
    slowDuration: 2.0,
    coinBonusPct: 10,
    primaryColor: '#0284c7',
    accentColor: '#67e8f9',
    scale: 1.18,
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
  trex: {
    id: 'trex',
    cost: 2500,
    upgradeCostBase: 1950,
    nameAr: 'الديناصور الملكي',
    nameEn: 'Royal T-Rex',
    descAr: 'أقوى وحش مرافق — طاقة عملاقة وزئير بلازما متفجر + +20% عملات!',
    descEn: 'Apex colossal T-Rex with huge HP, explosive plasma roars & +20% Coins!',
    style: 'ranged',
    baseHp: 460,
    damage: 36,
    attackInterval: 0.58,
    speed: 10.6,
    range: 16.5,
    splashRadius: 4.2,
    slowDuration: 1.6,
    coinBonusPct: 20,
    primaryColor: '#15803d',
    accentColor: '#fde047',
    scale: 1.38,
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
  strawberry: {
    id: 'strawberry',
    cost: 35,
    nameAr: 'فراولة الانتعاش',
    nameEn: 'Fresh Strawberry',
    descAr: 'تستعيد +55 طاقة فوراً وتزيد الحد الأقصى لطاقتك +10 بشكل دائم!',
    descEn: 'Restores +55 Energy + permanent +10 Max Energy!',
    healAmount: 55,
    maxEnergyBonus: 10,
    color: '#fb7185',
    accent: '#fecdd3',
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
  grapes: {
    id: 'grapes',
    cost: 60,
    nameAr: 'عنب الحماية',
    nameEn: 'Shield Grapes',
    descAr: 'يستعيد +85 طاقة + +15 طاقة قصوى دائمة + درع حماية 8 ثوانٍ!',
    descEn: 'Restores +85 Energy + permanent +15 Max Energy + 8s Shield!',
    healAmount: 85,
    maxEnergyBonus: 15,
    shieldBuffSec: 8,
    color: '#a855f7',
    accent: '#e9d5ff',
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
  pineapple: {
    id: 'pineapple',
    cost: 105,
    nameAr: 'أناناس الإعصار',
    nameEn: 'Storm Pineapple',
    descAr: 'طاقة 100% + +28 طاقة قصوى دائمة + سرعة إطلاق +35% لمدة 18 ثانية!',
    descEn: 'Full Energy + permanent +28 Max Energy + +35% Fire Rate for 18s!',
    healAmount: 9999,
    maxEnergyBonus: 28,
    rapidFireBuffSec: 18,
    color: '#eab308',
    accent: '#fef08a',
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
  kiwi: {
    id: 'kiwi',
    cost: 175,
    nameAr: 'كيوي الصاعقة',
    nameEn: 'Thunder Kiwi',
    descAr: 'شفاء كامل + +48 طاقة قصوى دائمة + سرعة +28% وضرر +25% لمدة 22 ثانية!',
    descEn: 'Full heal + permanent +48 Max Energy + Speed & DMG buffs for 22s!',
    healAmount: 9999,
    maxEnergyBonus: 48,
    speedBuffSec: 22,
    damageBuffSec: 22,
    color: '#84cc16',
    accent: '#d9f99d',
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
  coconut: {
    id: 'coconut',
    cost: 520,
    nameAr: 'جوز الهند الأسطوري',
    nameEn: 'Mythic Coconut',
    descAr: 'شفاء كامل + +160 طاقة قصوى دائمة + درع وضرر وإطلاق سريع معاً!',
    descEn: 'Full heal + permanent +160 Max Energy + Shield, DMG & Rapid Fire!',
    healAmount: 9999,
    maxEnergyBonus: 160,
    shieldBuffSec: 20,
    damageBuffSec: 25,
    rapidFireBuffSec: 25,
    color: '#d97706',
    accent: '#fef3c7',
  },
};

export const MEAT_SPECS: Record<MeatId, MeatSpec> = {
  chicken_leg: {
    id: 'chicken_leg',
    cost: 30,
    nameAr: 'فخذ دجاج مشوي',
    nameEn: 'Roasted Chicken Leg',
    descAr: 'يطعم جميع حيواناتك ويعيد +60 طاقة + يزيد طاقتهم القصوى +15 دائماً!',
    descEn: 'Feeds all pets: restores +60 Energy & +15 permanent Max HP!',
    petHealAmount: 60,
    petMaxHpBonus: 15,
    color: '#f59e0b',
    accent: '#fde68a',
  },
  lamb_chop: {
    id: 'lamb_chop',
    cost: 65,
    nameAr: 'ريش لحم غنم',
    nameEn: 'Grilled Lamb Chops',
    descAr: 'يعيد +140 طاقة للحيوانات + +35 طاقة قصوى دائمة + ضرر +15% لمدة 20 ثانية!',
    descEn: '+140 Pet Energy + +35 permanent Max HP + +15% Pet DMG for 20s!',
    petHealAmount: 140,
    petMaxHpBonus: 35,
    petDmgBoostPct: 15,
    buffDurationSec: 20,
    color: '#ef4444',
    accent: '#fecaca',
  },
  beef_steak: {
    id: 'beef_steak',
    cost: 120,
    nameAr: 'ستيك لحم بقري فاخر',
    nameEn: 'Prime Beef Steak',
    descAr: 'شفاء 100% لجميع حيواناتك + +65 طاقة قصوى دائمة + سرعة هجوم +20% (25ث)!',
    descEn: 'Full 100% Pet Heal + +65 permanent Max HP + +20% Attack Speed (25s)!',
    petHealAmount: 9999,
    petMaxHpBonus: 65,
    petSpeedBoostPct: 20,
    buffDurationSec: 25,
    color: '#dc2626',
    accent: '#fca5a5',
  },
  grilled_ribs: {
    id: 'grilled_ribs',
    cost: 220,
    nameAr: 'أضلاع مشوية عملاقة',
    nameEn: 'Giant BBQ Ribs',
    descAr: 'شفاء 100% لجميع الحيوانات + +120 طاقة قصوى دائمة + ضرر +25% (30ث)!',
    descEn: 'Full Pet Heal + +120 permanent Max HP + +25% Pet DMG (30s)!',
    petHealAmount: 9999,
    petMaxHpBonus: 120,
    petDmgBoostPct: 25,
    buffDurationSec: 30,
    color: '#ea580c',
    accent: '#fed7aa',
  },
  wagyu_feast: {
    id: 'wagyu_feast',
    cost: 390,
    nameAr: 'وليمة لحم واغيو الملكي',
    nameEn: 'Royal Wagyu Feast',
    descAr: 'شفاء 100% + +220 طاقة قصوى دائمة لكل حيوان + ضرر +35% وسرعة +25% (35ث)!',
    descEn: 'Full Pet Heal + +220 Max HP + +35% Pet DMG & +25% Speed (35s)!',
    petHealAmount: 9999,
    petMaxHpBonus: 220,
    petDmgBoostPct: 35,
    petSpeedBoostPct: 25,
    buffDurationSec: 35,
    color: '#be123c',
    accent: '#fda4af',
  },
  dragon_meat: {
    id: 'dragon_meat',
    cost: 680,
    nameAr: 'لحم التنين الأسطوري',
    nameEn: 'Mythic Dragon Meat',
    descAr: 'أقوى وجبة — شفاء 100% + +400 طاقة قصوى دائمة لكل حيوان + ضرر +50% وسرعة +30% (45ث)!',
    descEn: 'Ultimate feast — Full Heal + +400 Max HP + +50% DMG & +30% Speed (45s)!',
    petHealAmount: 9999,
    petMaxHpBonus: 400,
    petDmgBoostPct: 50,
    petSpeedBoostPct: 30,
    buffDurationSec: 45,
    color: '#9333ea',
    accent: '#f0abfc',
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
  bonusMaxHp: number;
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
  bonusMaxHp?: number;
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
  meatsFed?: number;
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
  petFuryBuffTimer: number;
  petFuryDmgPct: number;
  petFurySpdPct: number;
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
          const savedHp =
            typeof slot.hp === 'number' && Number.isFinite(slot.hp) && slot.hp > 0
              ? slot.hp
              : undefined;
          const savedBonusMaxHp =
            typeof slot.bonusMaxHp === 'number' &&
            Number.isFinite(slot.bonusMaxHp) &&
            slot.bonusMaxHp > 0
              ? Math.floor(slot.bonusMaxHp)
              : 0;
          petRoster.push({
            petId: slot.petId as PetId,
            level: lv,
            slot: pickFreeSlot(slot.slot),
            hp: savedHp,
            bonusMaxHp: savedBonusMaxHp,
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
            bonusMaxHp: 0,
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
      meatsFed: Math.max(0, Math.floor(Number(p.meatsFed) || 0)),
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
