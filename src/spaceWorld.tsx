import React from 'react';

export type SpaceItemKind =
  | 'space_stardust'
  | 'space_moon'
  | 'space_comet'
  | 'space_saturn'
  | 'space_nebula'
  | 'space_solar'
  | 'space_aurora'
  | 'space_pulsar'
  | 'space_galaxy'
  | 'space_emerald_star'
  | 'space_quasar_orb'
  | 'space_diamond_meteor'
  | 'space_crown_nova'
  | 'space_omega_crystal'
  | 'space_debris'
  | 'space_dust_cloud'
  | 'space_ice_shard'
  | 'space_acid_comet'
  | 'space_emp_ring'
  | 'space_laser_drone'
  | 'space_meteor'
  | 'space_plasma_bolt'
  | 'space_cryo_mine'
  | 'space_solar_flare'
  | 'space_rogue_satellite'
  | 'space_gravity_orb'
  | 'space_blackhole'
  | 'space_antimatter'
  | 'space_void_crystal'
  | 'space_supernova_core';

export interface SpaceStageConfig {
  stage: number;
  pointsNeeded: number;
  baseSpeed: number;
  spawnInterval: number;
  hazardChance: number;
  lateralDrift: number;
}

export interface SpaceIndexEntry {
  kind: SpaceItemKind;
  category: 'positive' | 'negative';
  minStage: number;
  nameAr: string;
  nameEn: string;
  valueAr: string;
  valueEn: string;
  benefitAr: string;
  benefitEn: string;
}

export interface SpaceBgMotif {
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotSpeed: number;
  alpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  motif: 'star_cross' | 'planet' | 'ringed_planet' | 'nebula_orb' | 'comet_streak';
  hue: string;
}

export interface SpaceRenderItem {
  kind: SpaceItemKind;
  x: number;
  y: number;
  radius: number;
  rotation: number;
  pulsePhase: number;
}

export type SpaceShipSkinId =
  | 'default'
  | 'nebula_cruiser'
  | 'solar_phoenix'
  | 'galaxy_emperor';

export const TOTAL_SPACE_STAGES = 50;
export const SPACE_UNLOCK_COST = 40;
export const SPACE_UNLOCK_PINK_COST = 400;
export const MAX_STARS = 10;

export const SPACE_COIN_DROP_CHANCE = 0.7;
export const SPACE_COIN_MIN_DROP = 1;
export const SPACE_COIN_MAX_DROP = 3;
export const SPACE_PULSAR_BONUS_COINS = 4;
export const SPACE_GALAXY_BONUS_COINS = 8;
export const SPACE_OMEGA_BONUS_COINS = 10;

export function getSpaceStageClearCoins(remainingStars: number): number {
  if (remainingStars >= 8) return 16;
  if (remainingStars >= 5) return 10;
  return 6;
}

export function getSpaceStageClearSpaceCoins(
  remainingStars: number,
  isFirstClear: boolean
): number {
  if (!isFirstClear) return 6;
  if (remainingStars >= 8) return 32;
  if (remainingStars >= 5) return 20;
  return 12;
}

export type SpaceBossTier =
  | 'meteor_warden'
  | 'cryo_sovereign'
  | 'nebula_leviathan'
  | 'void_emperor'
  | 'supernova_overlord'
  | 'omega_emperor';

export interface SpaceBossConfig {
  stage: number;
  tier: SpaceBossTier;
  isSupreme?: boolean;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  maxHp: number;
  patrolSpeed: number;
  attackInterval: number;
  barrageCount: number;
  attackKinds: SpaceItemKind[];
  firstClearCoins: number;
  firstClearSpaceCoins: number;
  replaySpaceCoins: number;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
}

export interface SpaceBossRuntime {
  config: SpaceBossConfig;
  x: number;
  y: number;
  baseY: number;
  vx: number;
  hp: number;
  maxHp: number;
  hitFlash: number;
  recoilY: number;
  attackTimer: number;
  telegraphTimer: number;
  pulsePhase: number;
  enraged: boolean;
  enrageAnnounced: boolean;
}

export interface BossLaserBeam {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  life: number;
  maxLife: number;
}

export const SPACE_BOSS_CONFIGS: SpaceBossConfig[] = [
  {
    stage: 5,
    tier: 'meteor_warden',
    nameAr: 'صائد الشهب',
    nameEn: 'Meteor Scout',
    titleAr: 'زعيم المرحلة 5',
    titleEn: 'Stage 5 Boss',
    maxHp: 110,
    patrolSpeed: 88,
    attackInterval: 3.35,
    barrageCount: 2,
    attackKinds: ['space_meteor', 'space_laser_drone', 'space_debris'],
    firstClearCoins: 18,
    firstClearSpaceCoins: 45,
    replaySpaceCoins: 15,
    primaryColor: '#fb923c',
    secondaryColor: '#fde68a',
    glowColor: 'rgba(251, 146, 60, 0.7)',
  },
  {
    stage: 10,
    tier: 'meteor_warden',
    nameAr: 'حارس النيازك',
    nameEn: 'Meteor Warden',
    titleAr: 'زعيم المرحلة 10',
    titleEn: 'Stage 10 Boss',
    maxHp: 160,
    patrolSpeed: 98,
    attackInterval: 3.15,
    barrageCount: 2,
    attackKinds: ['space_meteor', 'space_plasma_bolt', 'space_laser_drone'],
    firstClearCoins: 20,
    firstClearSpaceCoins: 60,
    replaySpaceCoins: 20,
    primaryColor: '#f97316',
    secondaryColor: '#fbbf24',
    glowColor: 'rgba(249, 115, 22, 0.72)',
  },
  {
    stage: 15,
    tier: 'cryo_sovereign',
    nameAr: 'عاصفة الصقيع',
    nameEn: 'Frost Raider',
    titleAr: 'زعيم المرحلة 15',
    titleEn: 'Stage 15 Boss',
    maxHp: 210,
    patrolSpeed: 108,
    attackInterval: 3.0,
    barrageCount: 3,
    attackKinds: ['space_cryo_mine', 'space_ice_shard', 'space_emp_ring'],
    firstClearCoins: 23,
    firstClearSpaceCoins: 75,
    replaySpaceCoins: 24,
    primaryColor: '#22d3ee',
    secondaryColor: '#e0f2fe',
    glowColor: 'rgba(34, 211, 238, 0.72)',
  },
  {
    stage: 20,
    tier: 'cryo_sovereign',
    nameAr: 'ملك الجليد الكوني',
    nameEn: 'Cryo Sovereign',
    titleAr: 'زعيم المرحلة 20',
    titleEn: 'Stage 20 Boss',
    maxHp: 260,
    patrolSpeed: 120,
    attackInterval: 2.85,
    barrageCount: 3,
    attackKinds: ['space_cryo_mine', 'space_ice_shard', 'space_plasma_bolt', 'space_solar_flare'],
    firstClearCoins: 26,
    firstClearSpaceCoins: 90,
    replaySpaceCoins: 28,
    primaryColor: '#06b6d4',
    secondaryColor: '#bae6fd',
    glowColor: 'rgba(6, 182, 212, 0.76)',
  },
  {
    stage: 25,
    tier: 'nebula_leviathan',
    nameAr: 'شبح السديم',
    nameEn: 'Nebula Phantom',
    titleAr: 'زعيم المرحلة 25',
    titleEn: 'Stage 25 Boss',
    maxHp: 315,
    patrolSpeed: 130,
    attackInterval: 2.72,
    barrageCount: 3,
    attackKinds: ['space_gravity_orb', 'space_blackhole', 'space_rogue_satellite'],
    firstClearCoins: 30,
    firstClearSpaceCoins: 105,
    replaySpaceCoins: 32,
    primaryColor: '#e879f9',
    secondaryColor: '#fae8ff',
    glowColor: 'rgba(232, 121, 249, 0.76)',
  },
  {
    stage: 30,
    tier: 'nebula_leviathan',
    nameAr: 'عملاق السديم',
    nameEn: 'Nebula Leviathan',
    titleAr: 'زعيم المرحلة 30',
    titleEn: 'Stage 30 Boss',
    maxHp: 370,
    patrolSpeed: 140,
    attackInterval: 2.6,
    barrageCount: 3,
    attackKinds: ['space_blackhole', 'space_antimatter', 'space_gravity_orb'],
    firstClearCoins: 34,
    firstClearSpaceCoins: 120,
    replaySpaceCoins: 36,
    primaryColor: '#d946ef',
    secondaryColor: '#f0abfc',
    glowColor: 'rgba(217, 70, 239, 0.78)',
  },
  {
    stage: 35,
    tier: 'void_emperor',
    nameAr: 'فارس الفراغ',
    nameEn: 'Void Vanguard',
    titleAr: 'زعيم المرحلة 35',
    titleEn: 'Stage 35 Boss',
    maxHp: 430,
    patrolSpeed: 150,
    attackInterval: 2.48,
    barrageCount: 4,
    attackKinds: ['space_void_crystal', 'space_antimatter', 'space_gravity_orb'],
    firstClearCoins: 38,
    firstClearSpaceCoins: 140,
    replaySpaceCoins: 40,
    primaryColor: '#8b5cf6',
    secondaryColor: '#ddd6fe',
    glowColor: 'rgba(139, 92, 246, 0.8)',
  },
  {
    stage: 40,
    tier: 'void_emperor',
    nameAr: 'إمبراطور الفراغ',
    nameEn: 'Void Emperor',
    titleAr: 'زعيم المرحلة 40',
    titleEn: 'Stage 40 Boss',
    maxHp: 490,
    patrolSpeed: 160,
    attackInterval: 2.38,
    barrageCount: 4,
    attackKinds: ['space_void_crystal', 'space_blackhole', 'space_antimatter'],
    firstClearCoins: 42,
    firstClearSpaceCoins: 160,
    replaySpaceCoins: 46,
    primaryColor: '#7c3aed',
    secondaryColor: '#c4b5fd',
    glowColor: 'rgba(124, 58, 237, 0.82)',
  },
  {
    stage: 45,
    tier: 'supernova_overlord',
    nameAr: 'نذير السوبرنوفا',
    nameEn: 'Supernova Herald',
    titleAr: 'زعيم المرحلة 45',
    titleEn: 'Stage 45 Boss',
    maxHp: 560,
    patrolSpeed: 170,
    attackInterval: 2.26,
    barrageCount: 4,
    attackKinds: ['space_supernova_core', 'space_solar_flare', 'space_antimatter'],
    firstClearCoins: 50,
    firstClearSpaceCoins: 195,
    replaySpaceCoins: 56,
    primaryColor: '#f43f5e',
    secondaryColor: '#fde047',
    glowColor: 'rgba(244, 63, 94, 0.84)',
  },
  {
    stage: 49,
    tier: 'omega_emperor',
    isSupreme: true,
    nameAr: 'الوحش الأكبر · طاغية المجرة',
    nameEn: 'Supreme Beast · Omega Overlord',
    titleAr: 'الوحش الأكبر الأسطوري — المرحلة 49',
    titleEn: 'Supreme Mythic Beast — Stage 49',
    maxHp: 1350,
    patrolSpeed: 225,
    attackInterval: 1.65,
    barrageCount: 5,
    attackKinds: [
      'space_supernova_core',
      'space_void_crystal',
      'space_blackhole',
      'space_antimatter',
      'space_solar_flare',
    ],
    firstClearCoins: 120,
    firstClearSpaceCoins: 450,
    replaySpaceCoins: 140,
    primaryColor: '#dc2626',
    secondaryColor: '#facc15',
    glowColor: 'rgba(220, 38, 38, 0.94)',
  },
  {
    stage: 50,
    tier: 'supernova_overlord',
    nameAr: 'سيد السوبرنوفا',
    nameEn: 'Supernova Overlord',
    titleAr: 'الزعيم الأسطوري النهائي',
    titleEn: 'Final Cosmic Overlord',
    maxHp: 640,
    patrolSpeed: 182,
    attackInterval: 2.15,
    barrageCount: 4,
    attackKinds: ['space_supernova_core', 'space_solar_flare', 'space_void_crystal', 'space_blackhole'],
    firstClearCoins: 60,
    firstClearSpaceCoins: 240,
    replaySpaceCoins: 70,
    primaryColor: '#ef4444',
    secondaryColor: '#fde047',
    glowColor: 'rgba(239, 68, 68, 0.85)',
  },
];

export function getSpaceBossConfig(stage: number): SpaceBossConfig | null {
  return SPACE_BOSS_CONFIGS.find((b) => b.stage === stage) ?? null;
}

export function isSpaceBossStage(stage: number): boolean {
  return SPACE_BOSS_CONFIGS.some((b) => b.stage === stage);
}

export function createSpaceBossRuntime(
  stage: number,
  canvasWidth: number
): SpaceBossRuntime | null {
  const config = getSpaceBossConfig(stage);
  if (!config) return null;
  const dir = Math.random() > 0.5 ? 1 : -1;
  return {
    config,
    x: canvasWidth / 2,
    y: 86,
    baseY: 86,
    vx: dir * config.patrolSpeed,
    hp: config.maxHp,
    maxHp: config.maxHp,
    hitFlash: 0,
    recoilY: 0,
    attackTimer: 1.65,
    telegraphTimer: 0,
    pulsePhase: 0,
    enraged: false,
    enrageAnnounced: false,
  };
}

export interface SpaceItemStat {
  isPositive: boolean;
  pointsDelta: number;
  starDamage: number;
  speedMul: number;
  minStage: number;
  spawnWeight: number;
  clearsSlow?: boolean;
  shieldDuration?: number;
  slowDuration?: number;
  heavySlowDuration?: number;
  freezeDuration?: number;
  color: string;
  textColor: string;
}

export const SPACE_ITEM_STATS: Record<SpaceItemKind, SpaceItemStat> = {
  space_stardust: {
    isPositive: true,
    pointsDelta: 2,
    starDamage: 0,
    speedMul: 0.92,
    minStage: 1,
    spawnWeight: 28,
    color: '#38bdf8',
    textColor: '#bae6fd',
  },
  space_moon: {
    isPositive: true,
    pointsDelta: 3,
    starDamage: 0,
    speedMul: 0.96,
    minStage: 1,
    spawnWeight: 24,
    color: '#e2e8f0',
    textColor: '#f8fafc',
  },
  space_comet: {
    isPositive: true,
    pointsDelta: 4,
    starDamage: 0,
    speedMul: 1.24,
    minStage: 1,
    spawnWeight: 19,
    color: '#22d3ee',
    textColor: '#a5f3fc',
  },
  space_saturn: {
    isPositive: true,
    pointsDelta: 5,
    starDamage: 0,
    speedMul: 1.0,
    minStage: 2,
    spawnWeight: 16,
    color: '#fbbf24',
    textColor: '#fef08a',
  },
  space_nebula: {
    isPositive: true,
    pointsDelta: 5,
    starDamage: 0,
    speedMul: 1.04,
    minStage: 4,
    spawnWeight: 13,
    clearsSlow: true,
    color: '#e879f9',
    textColor: '#f5d0fe',
  },
  space_solar: {
    isPositive: true,
    pointsDelta: 6,
    starDamage: 0,
    speedMul: 1.08,
    minStage: 7,
    spawnWeight: 12,
    color: '#fb923c',
    textColor: '#fed7aa',
  },
  space_aurora: {
    isPositive: true,
    pointsDelta: 7,
    starDamage: 0,
    speedMul: 1.12,
    minStage: 11,
    spawnWeight: 9,
    shieldDuration: 4,
    color: '#34d399',
    textColor: '#a7f3d0',
  },
  space_pulsar: {
    isPositive: true,
    pointsDelta: 8,
    starDamage: 0,
    speedMul: 1.18,
    minStage: 16,
    spawnWeight: 8,
    color: '#818cf8',
    textColor: '#c7d2fe',
  },
  space_galaxy: {
    isPositive: true,
    pointsDelta: 12,
    starDamage: 0,
    speedMul: 1.2,
    minStage: 20,
    spawnWeight: 4,
    color: '#c084fc',
    textColor: '#f3e8ff',
  },
  space_emerald_star: {
    isPositive: true,
    pointsDelta: 5,
    starDamage: 0,
    speedMul: 1.04,
    minStage: 1,
    spawnWeight: 15,
    color: '#10b981',
    textColor: '#a7f3d0',
  },
  space_quasar_orb: {
    isPositive: true,
    pointsDelta: 7,
    starDamage: 0,
    speedMul: 1.1,
    minStage: 1,
    spawnWeight: 12,
    color: '#f43f5e',
    textColor: '#fecdd3',
  },
  space_diamond_meteor: {
    isPositive: true,
    pointsDelta: 9,
    starDamage: 0,
    speedMul: 1.16,
    minStage: 1,
    spawnWeight: 9,
    color: '#38bdf8',
    textColor: '#e0f2fe',
  },
  space_crown_nova: {
    isPositive: true,
    pointsDelta: 11,
    starDamage: 0,
    speedMul: 1.2,
    minStage: 1,
    spawnWeight: 7,
    clearsSlow: true,
    color: '#f59e0b',
    textColor: '#fef08a',
  },
  space_omega_crystal: {
    isPositive: true,
    pointsDelta: 14,
    starDamage: 0,
    speedMul: 1.24,
    minStage: 1,
    spawnWeight: 5,
    shieldDuration: 3,
    color: '#facc15',
    textColor: '#fef9c3',
  },
  space_debris: {
    isPositive: false,
    pointsDelta: -2,
    starDamage: 0,
    speedMul: 0.96,
    minStage: 1,
    spawnWeight: 26,
    color: '#94a3b8',
    textColor: '#cbd5e1',
  },
  space_dust_cloud: {
    isPositive: false,
    pointsDelta: -2,
    starDamage: 0,
    speedMul: 0.94,
    minStage: 2,
    spawnWeight: 22,
    slowDuration: 2,
    color: '#84cc16',
    textColor: '#d9f99d',
  },
  space_ice_shard: {
    isPositive: false,
    pointsDelta: -2,
    starDamage: 0,
    speedMul: 1.05,
    minStage: 3,
    spawnWeight: 20,
    slowDuration: 2.5,
    color: '#67e8f9',
    textColor: '#cffafe',
  },
  space_acid_comet: {
    isPositive: false,
    pointsDelta: -3,
    starDamage: 0,
    speedMul: 1.28,
    minStage: 5,
    spawnWeight: 18,
    slowDuration: 3,
    color: '#a3e635',
    textColor: '#ecfccb',
  },
  space_emp_ring: {
    isPositive: false,
    pointsDelta: -3,
    starDamage: 0,
    speedMul: 1.12,
    minStage: 8,
    spawnWeight: 15,
    heavySlowDuration: 3,
    color: '#eab308',
    textColor: '#fef08a',
  },
  space_laser_drone: {
    isPositive: false,
    pointsDelta: -2,
    starDamage: 1,
    speedMul: 1.06,
    minStage: 4,
    spawnWeight: 19,
    color: '#fb7185',
    textColor: '#ffe4e6',
  },
  space_meteor: {
    isPositive: false,
    pointsDelta: -3,
    starDamage: 1,
    speedMul: 1.08,
    minStage: 1,
    spawnWeight: 24,
    color: '#f97316',
    textColor: '#fecaca',
  },
  space_plasma_bolt: {
    isPositive: false,
    pointsDelta: -3,
    starDamage: 1,
    speedMul: 1.58,
    minStage: 6,
    spawnWeight: 16,
    color: '#f43f5e',
    textColor: '#fda4af',
  },
  space_cryo_mine: {
    isPositive: false,
    pointsDelta: -3,
    starDamage: 1,
    speedMul: 1.02,
    minStage: 10,
    spawnWeight: 13,
    freezeDuration: 3,
    color: '#ef4444',
    textColor: '#fecaca',
  },
  space_solar_flare: {
    isPositive: false,
    pointsDelta: -4,
    starDamage: 1,
    speedMul: 1.48,
    minStage: 12,
    spawnWeight: 14,
    color: '#f59e0b',
    textColor: '#fef3c7',
  },
  space_rogue_satellite: {
    isPositive: false,
    pointsDelta: -4,
    starDamage: 1,
    speedMul: 1.18,
    minStage: 19,
    spawnWeight: 12,
    color: '#64748b',
    textColor: '#e2e8f0',
  },
  space_gravity_orb: {
    isPositive: false,
    pointsDelta: -4,
    starDamage: 1,
    speedMul: 1.04,
    minStage: 16,
    spawnWeight: 12,
    heavySlowDuration: 3.5,
    color: '#6366f1',
    textColor: '#e0e7ff',
  },
  space_blackhole: {
    isPositive: false,
    pointsDelta: -5,
    starDamage: 2,
    speedMul: 1.14,
    minStage: 14,
    spawnWeight: 10,
    color: '#a855f7',
    textColor: '#f5d0fe',
  },
  space_antimatter: {
    isPositive: false,
    pointsDelta: -5,
    starDamage: 2,
    speedMul: 1.24,
    minStage: 24,
    spawnWeight: 10,
    color: '#ec4899',
    textColor: '#fce7f3',
  },
  space_void_crystal: {
    isPositive: false,
    pointsDelta: -5,
    starDamage: 2,
    speedMul: 1.16,
    minStage: 30,
    spawnWeight: 9,
    freezeDuration: 3.5,
    color: '#7c3aed',
    textColor: '#ede9fe',
  },
  space_supernova_core: {
    isPositive: false,
    pointsDelta: -6,
    starDamage: 2,
    speedMul: 1.42,
    minStage: 36,
    spawnWeight: 8,
    color: '#dc2626',
    textColor: '#fee2e2',
  },
};

export const SPACE_INDEX_CATALOG: SpaceIndexEntry[] = [
  // 9 Positive Cosmic Points (ordered weakest -> strongest)
  {
    kind: 'space_stardust',
    category: 'positive',
    minStage: 1,
    nameAr: 'غبار النجوم',
    nameEn: 'Stardust Orb',
    valueAr: '+2 نقاط',
    valueEn: '+2 pts',
    benefitAr: 'كرة ضوئية من غبار النجوم تمنحك نقطتين عند التقاطها.',
    benefitEn: 'Glowing stardust orb awarding 2 points when caught.',
  },
  {
    kind: 'space_moon',
    category: 'positive',
    minStage: 1,
    nameAr: 'القمر الفضي',
    nameEn: 'Silver Moon',
    valueAr: '+3 نقاط',
    valueEn: '+3 pts',
    benefitAr: 'هلال قمري فضي يضيف 3 نقاط لرصيد مرحلتك.',
    benefitEn: 'Crescent silver moon granting 3 points toward your stage goal.',
  },
  {
    kind: 'space_comet',
    category: 'positive',
    minStage: 1,
    nameAr: 'المذنب الأزرق',
    nameEn: 'Blue Comet',
    valueAr: '+4 نقاط · سريع',
    valueEn: '+4 pts · Fast',
    benefitAr: 'مذنب سماوي سريع الذيل يعطيك 4 نقاط إذا لحقت به.',
    benefitEn: 'Fast streaking cosmic comet worth 4 points if you catch it.',
  },
  {
    kind: 'space_saturn',
    category: 'positive',
    minStage: 2,
    nameAr: 'كوكب زحل',
    nameEn: 'Ringed Saturn',
    valueAr: '+5 نقاط',
    valueEn: '+5 pts',
    benefitAr: 'كوكب ذهبي بحلقات مضيئة يمنحك 5 نقاط دفعة واحدة (المرحلة 2+).',
    benefitEn: 'Golden ringed planet awarding 5 points immediately (Stage 2+).',
  },
  {
    kind: 'space_nebula',
    category: 'positive',
    minStage: 4,
    nameAr: 'بلورة السديم',
    nameEn: 'Nebula Crystal',
    valueAr: '+5 نقاط · تزيل التبطيء',
    valueEn: '+5 pts · Clears Slow',
    benefitAr: 'بلورة سديمية تعطي 5 نقاط وتزيل أي تبطيء أو تجميد فوراً (المرحلة 4+).',
    benefitEn: 'Nebula crystal giving 5 points and immediately clearing slow or freeze (Stage 4+).',
  },
  {
    kind: 'space_solar',
    category: 'positive',
    minStage: 7,
    nameAr: 'نواة الشمس',
    nameEn: 'Solar Core',
    valueAr: '+6 نقاط',
    valueEn: '+6 pts',
    benefitAr: 'نواة شمسية متوهجة تمنحك 6 نقاط قوية لتجاوز المراحل بسرعة (المرحلة 7+).',
    benefitEn: 'Radiant solar core delivering 6 points to rocket through stages (Stage 7+).',
  },
  {
    kind: 'space_aurora',
    category: 'positive',
    minStage: 11,
    nameAr: 'جوهرة الشفق',
    nameEn: 'Aurora Prism',
    valueAr: '+7 نقاط · درع 4ث',
    valueEn: '+7 pts · 4s Shield',
    benefitAr: 'منشور شفق قطبي يعطيك 7 نقاط ويفعّل درع حماية كوني لمدة 4 ثوانٍ (المرحلة 11+).',
    benefitEn: 'Aurora prism awarding 7 points and activating a 4-second cosmic shield (Stage 11+).',
  },
  {
    kind: 'space_pulsar',
    category: 'positive',
    minStage: 16,
    nameAr: 'نجم النابض',
    nameEn: 'Pulsar Star',
    valueAr: '+8 نقاط',
    valueEn: '+8 pts',
    benefitAr: 'نجم نابض فائق الطاقة يمنحك 8 نقاط عند التقاطه (المرحلة 16+).',
    benefitEn: 'High-energy pulsing star worth 8 full points on catch (Stage 16+).',
  },
  {
    kind: 'space_emerald_star',
    category: 'positive',
    minStage: 1,
    nameAr: 'نجمة الزمرد',
    nameEn: 'Emerald Star',
    valueAr: '+5 نقاط · كل المراحل',
    valueEn: '+5 pts · All Stages',
    benefitAr: 'نجمة زمردية متألقة تتواجد في جميع مراحل الفضاء وتمنحك 5 نقاط فورية!',
    benefitEn: 'Radiant emerald star found in every Space stage, awarding 5 instant points!',
  },
  {
    kind: 'space_quasar_orb',
    category: 'positive',
    minStage: 1,
    nameAr: 'كرة الكوازار',
    nameEn: 'Quasar Orb',
    valueAr: '+7 نقاط · كل المراحل',
    valueEn: '+7 pts · All Stages',
    benefitAr: 'نواة كوازار متوهجة بشعاعين طاقيين تتواجد بكل المراحل وتمنحك 7 نقاط!',
    benefitEn: 'Twin-jet glowing quasar core appearing in all stages for 7 points!',
  },
  {
    kind: 'space_diamond_meteor',
    category: 'positive',
    minStage: 1,
    nameAr: 'نيزك الألماس',
    nameEn: 'Diamond Meteor',
    valueAr: '+9 نقاط · كل المراحل',
    valueEn: '+9 pts · All Stages',
    benefitAr: 'نيزك ألماسي نقي يسقط في جميع المراحل ويمنحك 9 نقاط قوية دفعة واحدة!',
    benefitEn: 'Pure diamond comet appearing in every stage and delivering 9 strong points!',
  },
  {
    kind: 'space_crown_nova',
    category: 'positive',
    minStage: 1,
    nameAr: 'تاج السوبرنوفا',
    nameEn: 'Crown Nova',
    valueAr: '+11 نقطة · تزيل التبطيء',
    valueEn: '+11 pts · Clears Slow',
    benefitAr: 'تاج نجمي ذهبي يتواجد في كل المراحل، يمنحك 11 نقطة ويزيل التبطيء والتجميد فوراً!',
    benefitEn: 'Golden stellar crown available in all stages — grants 11 points and clears slow/freeze!',
  },
  {
    kind: 'space_galaxy',
    category: 'positive',
    minStage: 20,
    nameAr: 'المجرة الأسطورية',
    nameEn: 'Mythic Galaxy',
    valueAr: '+12 نقطة · نادر',
    valueEn: '+12 pts · Rare',
    benefitAr: 'مجرة حلزونية نادرة تمنحك 12 نقطة و+8 عملات فضاء دفعة واحدة (المرحلة 20+)!',
    benefitEn: 'Rare spiral galaxy awarding 12 points and +8 Space Coins at once (Stage 20+)!',
  },
  {
    kind: 'space_omega_crystal',
    category: 'positive',
    minStage: 1,
    nameAr: 'بلورة الأوميغا',
    nameEn: 'Omega Crystal',
    valueAr: '+14 نقطة · درع 3ث · كل المراحل',
    valueEn: '+14 pts · 3s Shield · All Stages',
    benefitAr: 'أقوى نقطة في الفضاء — تتواجد بكل المراحل وتمنحك 14 نقطة + درع 3 ثوانٍ + 10 عملات فضاء مضمونة!',
    benefitEn: 'Strongest Space orb — found in all stages, awarding 14 points, a 3s shield & +10 Space Coins!',
  },

  // 16 Negative Cosmic Hazards (ordered weakest -> strongest)
  {
    kind: 'space_debris',
    category: 'negative',
    minStage: 1,
    nameAr: 'حطام فضائي',
    nameEn: 'Space Debris',
    valueAr: '-2 نقاط',
    valueEn: '-2 pts',
    benefitAr: 'قطعة حطام معدني تنقص نقطتين فقط دون أن تنقص من نجومك.',
    benefitEn: 'Floating metal wreckage that deducts 2 points without harming your Star lives.',
  },
  {
    kind: 'space_dust_cloud',
    category: 'negative',
    minStage: 2,
    nameAr: 'غيمة غبار سام',
    nameEn: 'Toxic Dust Cloud',
    valueAr: '-2 نقاط · تبطيء 2ث',
    valueEn: '-2 pts · Slow 2s',
    benefitAr: 'سحابة غبار فضائي سام تنقص نقطتين وتبطّئ مركبتك لمدة ثانيتين دون خسارة نجمة (المرحلة 2+).',
    benefitEn: 'Toxic cosmic dust cloud deducting 2 points and slowing your ship for 2s (Stage 2+).',
  },
  {
    kind: 'space_ice_shard',
    category: 'negative',
    minStage: 3,
    nameAr: 'شظية جليد كوني',
    nameEn: 'Cosmic Ice Shard',
    valueAr: '-2 نقاط · تبطيء 2.5ث',
    valueEn: '-2 pts · Slow 2.5s',
    benefitAr: 'شظية متجمدة تنقص نقطتين وتبطّئ مركبتك 2.5 ثانية دون خسارة نجمة (المرحلة 3+).',
    benefitEn: 'Freezing shard that deducts 2 points and slows your ship for 2.5s (Stage 3+).',
  },
  {
    kind: 'space_acid_comet',
    category: 'negative',
    minStage: 5,
    nameAr: 'مذنب حمضي',
    nameEn: 'Acid Comet',
    valueAr: '-3 نقاط · تبطيء 3ث · سريع',
    valueEn: '-3 pts · Slow 3s · Fast',
    benefitAr: 'مذنب أخضر حمضي سريع ينقص 3 نقاط ويبطّئ مركبتك 3 ثوانٍ دون خسارة نجمة (المرحلة 5+).',
    benefitEn: 'Fast acidic comet deducting 3 points and slowing your ship for 3s (Stage 5+).',
  },
  {
    kind: 'space_emp_ring',
    category: 'negative',
    minStage: 8,
    nameAr: 'حلقة كهرومغناطيسية',
    nameEn: 'EMP Ring',
    valueAr: '-3 نقاط · تبطيء شديد 3ث',
    valueEn: '-3 pts · Heavy Slow 3s',
    benefitAr: 'نبضة كهرومغناطيسية تشوّش محركاتك وتبطّئ المركبة بشدة لمدة 3 ثوانٍ مع -3 نقاط (المرحلة 8+).',
    benefitEn: 'Electromagnetic shock ring causing heavy slow for 3s and -3 points (Stage 8+).',
  },
  {
    kind: 'space_laser_drone',
    category: 'negative',
    minStage: 4,
    nameAr: 'طائرة ليزر',
    nameEn: 'Laser Drone',
    valueAr: '-2 نقاط · -1 نجمة',
    valueEn: '-2 pts · -1 Star',
    benefitAr: 'درون فضائي مسلّح بالليزر ينقص نقطتين ونجمة واحدة عند الاصطدام به (المرحلة 4+).',
    benefitEn: 'Armed laser patrol drone dealing -2 points and -1 Star life on contact (Stage 4+).',
  },
  {
    kind: 'space_meteor',
    category: 'negative',
    minStage: 1,
    nameAr: 'نيزك مشتعل',
    nameEn: 'Blazing Meteor',
    valueAr: '-3 نقاط · -1 نجمة',
    valueEn: '-3 pts · -1 Star',
    benefitAr: 'صخرة نيزكية ملتهبة تنقص 3 نقاط ونجمة واحدة عند الاصطدام بها.',
    benefitEn: 'Flaming meteor rock that deducts 3 points and 1 Star life on impact.',
  },
  {
    kind: 'space_plasma_bolt',
    category: 'negative',
    minStage: 6,
    nameAr: 'صاعقة البلازما',
    nameEn: 'Plasma Bolt',
    valueAr: '-3 نقاط · -1 نجمة · سريع',
    valueEn: '-3 pts · -1 Star · Fast',
    benefitAr: 'شعاع بلازما فائق السرعة ينقص 3 نقاط ونجمة واحدة (المرحلة 6+).',
    benefitEn: 'High-velocity plasma bolt dealing -3 points and -1 Star life (Stage 6+).',
  },
  {
    kind: 'space_cryo_mine',
    category: 'negative',
    minStage: 10,
    nameAr: 'لغم التجميد',
    nameEn: 'Cryo Mine',
    valueAr: '-3 نقاط · تجميد 3ث · -1 نجمة',
    valueEn: '-3 pts · Freeze 3s · -1 Star',
    benefitAr: 'لغم فضائي خطير يجمّد مركبتك 3 ثوانٍ وينقص 3 نقاط ونجمة واحدة (المرحلة 10+).',
    benefitEn: 'Cryo space mine freezing your ship for 3s while taking 3 points and 1 Star (Stage 10+).',
  },
  {
    kind: 'space_solar_flare',
    category: 'negative',
    minStage: 12,
    nameAr: 'انفجار شمسي',
    nameEn: 'Solar Flare',
    valueAr: '-4 نقاط · -1 نجمة · سريع',
    valueEn: '-4 pts · -1 Star · Fast',
    benefitAr: 'موجة لهب شمسي خاطفة تنقص 4 نقاط ونجمة واحدة بسرعة عالية (المرحلة 12+).',
    benefitEn: 'Blistering high-speed solar eruption dealing -4 points and -1 Star (Stage 12+).',
  },
  {
    kind: 'space_rogue_satellite',
    category: 'negative',
    minStage: 19,
    nameAr: 'قمر صناعي محطم',
    nameEn: 'Rogue Satellite',
    valueAr: '-4 نقاط · -1 نجمة',
    valueEn: '-4 pts · -1 Star',
    benefitAr: 'قمر صناعي خارج عن السيطرة يهوي بسرعة وينقص 4 نقاط ونجمة واحدة (المرحلة 19+).',
    benefitEn: 'Out-of-control orbital satellite crashing down for -4 points and -1 Star (Stage 19+).',
  },
  {
    kind: 'space_gravity_orb',
    category: 'negative',
    minStage: 16,
    nameAr: 'كرة الجاذبية',
    nameEn: 'Gravity Orb',
    valueAr: '-4 نقاط · تبطيء شديد 3.5ث · -1 نجمة',
    valueEn: '-4 pts · Heavy Slow 3.5s · -1 Star',
    benefitAr: 'كرة جاذبية ثقيلة تسحب مركبتك وتبطّئها بشدة 3.5 ثانية مع -4 نقاط و-1 نجمة (المرحلة 16+).',
    benefitEn: 'Dense gravity sphere applying 3.5s heavy slow plus -4 points and -1 Star (Stage 16+).',
  },
  {
    kind: 'space_blackhole',
    category: 'negative',
    minStage: 14,
    nameAr: 'الثقب الأسود',
    nameEn: 'Black Hole',
    valueAr: '-5 نقاط · -2 نجمة',
    valueEn: '-5 pts · -2 Stars',
    benefitAr: 'ثقب أسود دوّار يبتلع 5 نقاط ونجمتين دفعة واحدة عند لمسه (المرحلة 14+).',
    benefitEn: 'Swirling cosmic anomaly swallowing 5 points and 2 Star lives at once (Stage 14+).',
  },
  {
    kind: 'space_antimatter',
    category: 'negative',
    minStage: 24,
    nameAr: 'كرة المادة المضادة',
    nameEn: 'Antimatter Orb',
    valueAr: '-5 نقاط · -2 نجمة',
    valueEn: '-5 pts · -2 Stars',
    benefitAr: 'كرة طاقة مضادة متفجرة تدمّر 5 نقاط ونجمتين فور الاصطدام بها (المرحلة 24+).',
    benefitEn: 'Volatile antimatter sphere obliterating 5 points and 2 Stars on touch (Stage 24+).',
  },
  {
    kind: 'space_void_crystal',
    category: 'negative',
    minStage: 30,
    nameAr: 'بلورة الفراغ',
    nameEn: 'Void Crystal',
    valueAr: '-5 نقاط · تجميد 3.5ث · -2 نجمة',
    valueEn: '-5 pts · Freeze 3.5s · -2 Stars',
    benefitAr: 'بلورة فراغ مظلمة تجمّد مركبتك 3.5 ثانية وتنقص 5 نقاط ونجمتين (المرحلة 30+).',
    benefitEn: 'Dark void crystal freezing your ship for 3.5s while taking 5 points and 2 Stars (Stage 30+).',
  },
  {
    kind: 'space_supernova_core',
    category: 'negative',
    minStage: 36,
    nameAr: 'نواة السوبرنوفا',
    nameEn: 'Supernova Core',
    valueAr: '-6 نقاط · -2 نجمة · سريع',
    valueEn: '-6 pts · -2 Stars · Fast',
    benefitAr: 'أشرس عائق في الفضاء العميق — نواة نجم منفجر تنقص 6 نقاط ونجمتين بسرعة فائقة (المرحلة 36+)!',
    benefitEn: 'Deadliest deep-space core — roaring supernova blast dealing -6 points and -2 Stars (Stage 36+)!',
  },
];

export const VALID_SPACE_KINDS: SpaceItemKind[] = SPACE_INDEX_CATALOG.map(
  (entry) => entry.kind
);

export const SPACE_POSITIVE_KINDS: SpaceItemKind[] = SPACE_INDEX_CATALOG.filter(
  (e) => e.category === 'positive'
).map((e) => e.kind);

export const SPACE_NEGATIVE_KINDS: SpaceItemKind[] = SPACE_INDEX_CATALOG.filter(
  (e) => e.category === 'negative'
).map((e) => e.kind);

export const SPACE_STAGES: SpaceStageConfig[] = (() => {
  const list: SpaceStageConfig[] = [];
  for (let s = 1; s <= TOTAL_SPACE_STAGES; s++) {
    const t = (s - 1) / (TOTAL_SPACE_STAGES - 1);
    const tCurve = Math.pow(t, 0.9);
    const bossCfg = getSpaceBossConfig(s);
    const pointsNeeded = bossCfg ? bossCfg.maxHp : Math.round(52 + s * 14);
    list.push({
      stage: s,
      pointsNeeded,
      baseSpeed: Math.round(176 + tCurve * 295),
      spawnInterval: Number((0.76 - tCurve * 0.44).toFixed(3)),
      hazardChance: Number((0.23 + tCurve * 0.25).toFixed(3)),
      lateralDrift: s <= 2 ? 0 : Math.round(14 + t * 92),
    });
  }
  return list;
})();

export function pickSpaceItemKind(stageNum: number, isHazard: boolean): SpaceItemKind {
  const pool = (isHazard ? SPACE_NEGATIVE_KINDS : SPACE_POSITIVE_KINDS).filter(
    (k) => stageNum >= SPACE_ITEM_STATS[k].minStage
  );
  if (pool.length === 0) {
    return isHazard ? 'space_meteor' : 'space_stardust';
  }
  let totalWeight = 0;
  for (const k of pool) {
    totalWeight += SPACE_ITEM_STATS[k].spawnWeight;
  }
  let roll = Math.random() * totalWeight;
  for (const k of pool) {
    roll -= SPACE_ITEM_STATS[k].spawnWeight;
    if (roll <= 0) return k;
  }
  return pool[pool.length - 1];
}

export function initSpaceBgMotifs(width: number, height: number): SpaceBgMotif[] {
  const motifs: SpaceBgMotif['motif'][] = [
    'star_cross',
    'star_cross',
    'nebula_orb',
    'planet',
    'ringed_planet',
    'comet_streak',
  ];
  const hues = ['#a855f7', '#38bdf8', '#e879f9', '#34d399', '#818cf8', '#f472b6'];
  const count = Math.max(26, Math.min(48, Math.round((width * height) / 22000)));
  const arr: SpaceBgMotif[] = [];
  for (let i = 0; i < count; i++) {
    const motif = motifs[i % motifs.length];
    arr.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size:
        motif === 'star_cross'
          ? 6 + Math.random() * 7
          : motif === 'nebula_orb'
          ? 24 + Math.random() * 34
          : motif === 'comet_streak'
          ? 14 + Math.random() * 14
          : 11 + Math.random() * 12,
      speed: motif === 'comet_streak' ? 32 + Math.random() * 30 : 8 + Math.random() * 16,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.45,
      alpha: motif === 'nebula_orb' ? 0.08 + Math.random() * 0.09 : 0.16 + Math.random() * 0.24,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 1.5 + Math.random() * 2.4,
      motif,
      hue: hues[i % hues.length],
    });
  }
  return arr;
}

export function drawSpaceBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  motifs: SpaceBgMotif[]
) {
  const nowSec = performance.now() / 1000;

  // Deep cosmic galaxy backdrop
  const bgGrad = ctx.createLinearGradient(0, 0, width * 0.3, height);
  bgGrad.addColorStop(0, '#09041a');
  bgGrad.addColorStop(0.45, '#130930');
  bgGrad.addColorStop(0.8, '#0b102d');
  bgGrad.addColorStop(1, '#060718');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(-14, -14, width + 28, height + 28);

  // Subtle nebula aurora washes
  const neb1 = ctx.createRadialGradient(
    width * 0.22,
    height * 0.28,
    10,
    width * 0.22,
    height * 0.28,
    Math.max(width, height) * 0.52
  );
  neb1.addColorStop(0, 'rgba(168, 85, 247, 0.2)');
  neb1.addColorStop(0.55, 'rgba(79, 70, 229, 0.08)');
  neb1.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = neb1;
  ctx.fillRect(0, 0, width, height);

  const neb2 = ctx.createRadialGradient(
    width * 0.78,
    height * 0.65,
    10,
    width * 0.78,
    height * 0.65,
    Math.max(width, height) * 0.48
  );
  neb2.addColorStop(0, 'rgba(34, 211, 238, 0.16)');
  neb2.addColorStop(0.55, 'rgba(232, 121, 249, 0.07)');
  neb2.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = neb2;
  ctx.fillRect(0, 0, width, height);

  // Faint star-chart grid lines
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.05)';
  ctx.lineWidth = 1;
  const gridStep = Math.max(54, Math.round(width / 11));
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

  // Drifting cosmic motifs
  for (const m of motifs) {
    const twinkle = 0.65 + 0.35 * Math.sin(nowSec * m.twinkleSpeed + m.twinklePhase);
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.globalAlpha = m.alpha * twinkle;

    if (m.motif === 'nebula_orb') {
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, m.size);
      g.addColorStop(0, m.hue);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, m.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (m.motif === 'star_cross') {
      ctx.fillStyle = '#e0e7ff';
      ctx.beginPath();
      const s = m.size;
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s * 0.16, -s * 0.16, s, 0);
      ctx.quadraticCurveTo(s * 0.16, s * 0.16, 0, s);
      ctx.quadraticCurveTo(-s * 0.16, s * 0.16, -s, 0);
      ctx.quadraticCurveTo(-s * 0.16, -s * 0.16, 0, -s);
      ctx.closePath();
      ctx.fill();
    } else if (m.motif === 'planet') {
      ctx.fillStyle = m.hue;
      ctx.beginPath();
      ctx.arc(0, 0, m.size * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath();
      ctx.arc(-m.size * 0.2, -m.size * 0.2, m.size * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else if (m.motif === 'ringed_planet') {
      ctx.rotate(m.rotation * 0.3);
      ctx.fillStyle = m.hue;
      ctx.beginPath();
      ctx.arc(0, 0, m.size * 0.52, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e0e7ff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, m.size * 0.98, m.size * 0.3, -0.25, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -m.size);
      ctx.lineTo(0, m.size * 0.5);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, m.size * 0.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export function drawSpaceCanvasItem(
  ctx: CanvasRenderingContext2D,
  item: SpaceRenderItem
) {
  const { x, y, radius: r, kind, rotation, pulsePhase } = item;
  const pulse = 1 + Math.sin(pulsePhase) * 0.06;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);

  const drawBadge = (label: string, fill: string, textFill = '#ffffff') => {
    ctx.save();
    ctx.font = `900 ${Math.max(9, Math.round(r * 0.52))}px Tajawal, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(-r * 0.62, r * 0.48, r * 1.24, r * 0.62, 5);
    ctx.fill();
    ctx.fillStyle = textFill;
    ctx.fillText(label, 0, r * 0.8);
    ctx.restore();
  };

  if (kind === 'space_stardust') {
    // Glowing sky-blue 4-point stardust orb (+2)
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.45);
    glow.addColorStop(0, 'rgba(56, 189, 248, 0.72)');
    glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2);
    ctx.fill();

    const core = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 1, 0, 0, r);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.45, '#7dd3fc');
    core.addColorStop(1, '#0284c7');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2);
    ctx.fill();

    // Inner sparkle star
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.56);
    ctx.quadraticCurveTo(r * 0.14, -r * 0.14, r * 0.56, 0);
    ctx.quadraticCurveTo(r * 0.14, r * 0.14, 0, r * 0.56);
    ctx.quadraticCurveTo(-r * 0.14, r * 0.14, -r * 0.56, 0);
    ctx.quadraticCurveTo(-r * 0.14, -r * 0.14, 0, -r * 0.56);
    ctx.fill();
  } else if (kind === 'space_moon') {
    // Silver Crescent Moon (+3)
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.4);
    glow.addColorStop(0, 'rgba(226, 232, 240, 0.55)');
    glow.addColorStop(1, 'rgba(226, 232, 240, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0.35, Math.PI * 2 - 0.35);
    ctx.quadraticCurveTo(-r * 0.1, 0, r * 0.82, -r * 0.3);
    ctx.closePath();
    ctx.fill();

    // Moon crescent cutout using proper crescent path
    ctx.fillStyle = '#0f0a26';
    ctx.beginPath();
    ctx.arc(r * 0.34, -r * 0.14, r * 0.68, 0, Math.PI * 2);
    ctx.fill();

    // Bright rim
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0.72, Math.PI * 2 - 0.92);
    ctx.stroke();

    // Small companion star
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(r * 0.45, -r * 0.2, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'space_comet') {
    // Fast Blue Comet (+4) with trailing cyan tail pointing upward
    const tail = ctx.createLinearGradient(0, -r * 1.85, 0, r * 0.4);
    tail.addColorStop(0, 'rgba(34, 211, 238, 0)');
    tail.addColorStop(0.55, 'rgba(34, 211, 238, 0.55)');
    tail.addColorStop(1, 'rgba(207, 250, 254, 0.95)');
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.85);
    ctx.lineTo(r * 0.65, r * 0.25);
    ctx.lineTo(-r * 0.65, r * 0.25);
    ctx.closePath();
    ctx.fill();

    const head = ctx.createRadialGradient(-r * 0.15, r * 0.1, 1, 0, r * 0.2, r * 0.72);
    head.addColorStop(0, '#ffffff');
    head.addColorStop(0.5, '#67e8f9');
    head.addColorStop(1, '#0891b2');
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.arc(0, r * 0.2, r * 0.66, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'space_saturn') {
    // Golden Ringed Saturn (+5)
    ctx.rotate(-0.22);
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.45);
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
    glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2);
    ctx.fill();

    // Back ring
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.28, r * 0.36, 0, Math.PI, Math.PI * 2);
    ctx.stroke();

    // Planet body
    const body = ctx.createLinearGradient(-r, -r, r, r);
    body.addColorStop(0, '#fef08a');
    body.addColorStop(0.5, '#f59e0b');
    body.addColorStop(1, '#b45309');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.fill();

    // Front ring
    ctx.strokeStyle = '#fef9c3';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.28, r * 0.36, 0, 0, Math.PI);
    ctx.stroke();
  } else if (kind === 'space_nebula') {
    // Magenta Nebula Crystal (+5 + clears slow)
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.5);
    glow.addColorStop(0, 'rgba(232, 121, 249, 0.72)');
    glow.addColorStop(1, 'rgba(232, 121, 249, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, '#fae8ff');
    grad.addColorStop(0.45, '#e879f9');
    grad.addColorStop(1, '#9333ea');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.05);
    ctx.lineTo(r * 0.76, -r * 0.25);
    ctx.lineTo(r * 0.56, r * 0.85);
    ctx.lineTo(0, r * 1.05);
    ctx.lineTo(-r * 0.56, r * 0.85);
    ctx.lineTo(-r * 0.76, -r * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fdf4ff';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Facet shine
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.35, -r * 0.15);
    ctx.lineTo(0, r * 0.25);
    ctx.lineTo(-r * 0.35, -r * 0.15);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'space_solar') {
    // Blazing Solar Core (+6)
    ctx.rotate(rotation * 0.6);
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.6);
    glow.addColorStop(0, 'rgba(251, 146, 60, 0.8)');
    glow.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // 8 solar flares
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const ang = (i * Math.PI) / 8;
      const rad = i % 2 === 0 ? r * 1.08 : r * 0.68;
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    const sunCore = ctx.createRadialGradient(-r * 0.15, -r * 0.15, 1, 0, 0, r * 0.68);
    sunCore.addColorStop(0, '#ffffff');
    sunCore.addColorStop(0.55, '#fde047');
    sunCore.addColorStop(1, '#ea580c');
    ctx.fillStyle = sunCore;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'space_aurora') {
    // Emerald-Teal Aurora Shield Prism (+7 + 4s shield)
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.6);
    glow.addColorStop(0, 'rgba(52, 211, 153, 0.78)');
    glow.addColorStop(0.6, 'rgba(56, 189, 248, 0.35)');
    glow.addColorStop(1, 'rgba(52, 211, 153, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Shield-shaped prism
    const grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, '#a7f3d0');
    grad.addColorStop(0.5, '#10b981');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.0);
    ctx.lineTo(r * 0.84, -r * 0.45);
    ctx.quadraticCurveTo(r * 0.8, r * 0.52, 0, r * 1.02);
    ctx.quadraticCurveTo(-r * 0.8, r * 0.52, -r * 0.84, -r * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ecfdf5';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner glowing shield diamond
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.45);
    ctx.lineTo(r * 0.35, 0);
    ctx.lineTo(0, r * 0.45);
    ctx.lineTo(-r * 0.35, 0);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'space_pulsar') {
    // Indigo-Violet Pulsar Star (+8)
    ctx.rotate(rotation);
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.65);
    glow.addColorStop(0, 'rgba(129, 140, 248, 0.85)');
    glow.addColorStop(1, 'rgba(129, 140, 248, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.65, 0, Math.PI * 2);
    ctx.fill();

    // Outer orbital ring
    ctx.strokeStyle = '#a5b4fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.stroke();

    // Sharp 6-point pulsar star
    ctx.fillStyle = '#e0e7ff';
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const ang = (i * Math.PI) / 6;
      const rad = i % 2 === 0 ? r * 1.15 : r * 0.4;
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'space_galaxy') {
    // Mythic Spiral Galaxy (+12 Rare!)
    ctx.rotate(rotation * 1.4);
    const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.9);
    aura.addColorStop(0, 'rgba(240, 171, 252, 0.92)');
    aura.addColorStop(0.5, 'rgba(139, 92, 246, 0.5)');
    aura.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2);
    ctx.fill();

    // 3 spiral galaxy arms
    const armColors = ['#f0abfc', '#38bdf8', '#fde047'];
    for (let arm = 0; arm < 3; arm++) {
      ctx.save();
      ctx.rotate((arm * Math.PI * 2) / 3);
      ctx.strokeStyle = armColors[arm];
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.1) {
        const ang = t * 2.4;
        const rad = t * r * 1.1;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (t === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Bright mythic core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(-rotation * 1.4);
    drawBadge('+12', 'rgba(126, 34, 206, 0.9)', '#fef08a');
  } else if (kind === 'space_emerald_star') {
    // Sparkling Emerald Star (+5, All Stages)
    ctx.rotate(rotation * 0.5);
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.55);
    glow.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
    glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 1, 0, 0, r * 1.1);
    grad.addColorStop(0, '#ecfdf5');
    grad.addColorStop(0.45, '#34d399');
    grad.addColorStop(1, '#047857');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#d1fae5';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = (i * Math.PI) / 5 - Math.PI / 2;
      const rad = i % 2 === 0 ? r * 1.08 : r * 0.48;
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.rotate(-rotation * 0.5);
    drawBadge('+5', 'rgba(4, 120, 87, 0.92)', '#ecfdf5');
  } else if (kind === 'space_quasar_orb') {
    // Twin-Jet Quasar Orb (+7, All Stages)
    ctx.rotate(rotation * 0.8);
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.65);
    glow.addColorStop(0, 'rgba(244, 63, 94, 0.82)');
    glow.addColorStop(0.55, 'rgba(232, 121, 249, 0.35)');
    glow.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.65, 0, Math.PI * 2);
    ctx.fill();

    // Twin polar quasar jets
    const jetGrad = ctx.createLinearGradient(0, -r * 1.55, 0, r * 1.55);
    jetGrad.addColorStop(0, 'rgba(254, 205, 211, 0)');
    jetGrad.addColorStop(0.5, '#fb7185');
    jetGrad.addColorStop(1, 'rgba(254, 205, 211, 0)');
    ctx.strokeStyle = jetGrad;
    ctx.lineWidth = r * 0.42;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.35);
    ctx.lineTo(0, r * 1.35);
    ctx.stroke();

    // Glowing accretion disc
    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.15, r * 0.36, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Bright white-rose core
    const core = ctx.createRadialGradient(-r * 0.15, -r * 0.15, 1, 0, 0, r * 0.62);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.5, '#fb7185');
    core.addColorStop(1, '#be123c');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(-rotation * 0.8);
    drawBadge('+7', 'rgba(190, 18, 60, 0.92)', '#ffe4e6');
  } else if (kind === 'space_diamond_meteor') {
    // Faceted Diamond Meteor (+9, All Stages)
    const tail = ctx.createLinearGradient(0, -r * 1.75, 0, r * 0.3);
    tail.addColorStop(0, 'rgba(56, 189, 248, 0)');
    tail.addColorStop(0.6, 'rgba(125, 211, 252, 0.55)');
    tail.addColorStop(1, 'rgba(224, 242, 254, 0.92)');
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.75);
    ctx.lineTo(r * 0.72, r * 0.1);
    ctx.lineTo(-r * 0.72, r * 0.1);
    ctx.closePath();
    ctx.fill();

    const grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#7dd3fc');
    grad.addColorStop(0.8, '#0284c7');
    grad.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#f0f9ff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.86, -r * 0.1);
    ctx.lineTo(0, r * 0.96);
    ctx.lineTo(-r * 0.86, -r * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner sparkle facet
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.78);
    ctx.lineTo(r * 0.42, -r * 0.12);
    ctx.lineTo(0, r * 0.25);
    ctx.lineTo(-r * 0.42, -r * 0.12);
    ctx.closePath();
    ctx.fill();

    drawBadge('+9', 'rgba(3, 105, 161, 0.94)', '#e0f2fe');
  } else if (kind === 'space_crown_nova') {
    // Golden Crown Nova (+11 + Clears Slow, All Stages)
    const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.72);
    aura.addColorStop(0, 'rgba(253, 224, 71, 0.88)');
    aura.addColorStop(0.6, 'rgba(245, 158, 11, 0.36)');
    aura.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.72, 0, Math.PI * 2);
    ctx.fill();

    const crownGrad = ctx.createLinearGradient(0, -r * 0.9, 0, r * 0.75);
    crownGrad.addColorStop(0, '#fef9c3');
    crownGrad.addColorStop(0.5, '#fbbf24');
    crownGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = crownGrad;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(-r * 0.88, r * 0.45);
    ctx.lineTo(-r * 0.96, -r * 0.48);
    ctx.lineTo(-r * 0.38, -r * 0.02);
    ctx.lineTo(0, -r * 0.88);
    ctx.lineTo(r * 0.38, -r * 0.02);
    ctx.lineTo(r * 0.96, -r * 0.48);
    ctx.lineTo(r * 0.88, r * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crown center ruby gem
    ctx.fillStyle = '#e879f9';
    ctx.beginPath();
    ctx.arc(0, r * 0.14, r * 0.2, 0, Math.PI * 2);
    ctx.fill();

    drawBadge('+11', 'rgba(180, 83, 9, 0.95)', '#fef9c3');
  } else if (kind === 'space_omega_crystal') {
    // Mythic Prismatic Omega Crystal (+14 + 3s Shield + 10 Space Coins, All Stages!)
    ctx.rotate(rotation * 1.1);
    const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 2.0);
    aura.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
    aura.addColorStop(0.45, 'rgba(232, 121, 249, 0.55)');
    aura.addColorStop(0.75, 'rgba(56, 189, 248, 0.32)');
    aura.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting golden starlight ring
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.32, r * 0.46, 0.4, 0, Math.PI * 2);
    ctx.stroke();

    // Prismatic 8-facet mythic crystal
    const prismGrad = ctx.createLinearGradient(-r, -r, r, r);
    prismGrad.addColorStop(0, '#ffffff');
    prismGrad.addColorStop(0.28, '#fde047');
    prismGrad.addColorStop(0.62, '#e879f9');
    prismGrad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = prismGrad;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.16);
    ctx.lineTo(r * 0.78, -r * 0.44);
    ctx.lineTo(r * 0.96, r * 0.14);
    ctx.lineTo(r * 0.52, r * 0.88);
    ctx.lineTo(0, r * 1.12);
    ctx.lineTo(-r * 0.52, r * 0.88);
    ctx.lineTo(-r * 0.96, r * 0.14);
    ctx.lineTo(-r * 0.78, -r * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bright inner star
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.55);
    ctx.quadraticCurveTo(r * 0.14, -r * 0.14, r * 0.55, 0);
    ctx.quadraticCurveTo(r * 0.14, r * 0.14, 0, r * 0.55);
    ctx.quadraticCurveTo(-r * 0.14, r * 0.14, -r * 0.55, 0);
    ctx.quadraticCurveTo(-r * 0.14, -r * 0.14, 0, -r * 0.55);
    ctx.fill();

    ctx.rotate(-rotation * 1.1);
    drawBadge('+14', 'rgba(161, 98, 7, 0.96)', '#fef9c3');
  } else if (kind === 'space_debris') {
    // Jagged metallic Space Debris (-2 pts)
    ctx.rotate(rotation);
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, -r * 0.35);
    ctx.lineTo(-r * 0.1, -r * 0.9);
    ctx.lineTo(r * 0.85, -r * 0.45);
    ctx.lineTo(r * 0.65, r * 0.65);
    ctx.lineTo(-r * 0.25, r * 0.88);
    ctx.lineTo(-r * 0.92, r * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bolt details & warning stripe
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.2);
    ctx.lineTo(r * 0.4, r * 0.2);
    ctx.stroke();
  } else if (kind === 'space_ice_shard') {
    // Sharp Cyan Cosmic Ice Shard (-2 pts + Slow 2.5s)
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.35);
    glow.addColorStop(0, 'rgba(103, 232, 249, 0.55)');
    glow.addColorStop(1, 'rgba(103, 232, 249, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createLinearGradient(0, -r, 0, r);
    grad.addColorStop(0, '#ecfeff');
    grad.addColorStop(0.5, '#22d3ee');
    grad.addColorStop(1, '#0e7490');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, r * 1.12);
    ctx.lineTo(r * 0.66, -r * 0.2);
    ctx.lineTo(r * 0.3, -r * 0.98);
    ctx.lineTo(0, -r * 0.68);
    ctx.lineTo(-r * 0.3, -r * 0.98);
    ctx.lineTo(-r * 0.66, -r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  } else if (kind === 'space_meteor') {
    // Blazing Meteor (-3 pts, -1 Star)
    const flame = ctx.createLinearGradient(0, -r * 1.6, 0, r * 0.4);
    flame.addColorStop(0, 'rgba(249, 115, 22, 0)');
    flame.addColorStop(0.55, 'rgba(249, 115, 22, 0.72)');
    flame.addColorStop(1, 'rgba(239, 68, 68, 0.92)');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.65);
    ctx.lineTo(r * 0.85, r * 0.2);
    ctx.lineTo(-r * 0.85, r * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.rotate(rotation);
    ctx.fillStyle = '#44403c';
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.78);
    ctx.lineTo(r * 0.74, -r * 0.35);
    ctx.lineTo(r * 0.8, r * 0.42);
    ctx.lineTo(r * 0.12, r * 0.84);
    ctx.lineTo(-r * 0.7, r * 0.54);
    ctx.lineTo(-r * 0.78, -r * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing magma crack
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-r * 0.35, -r * 0.2);
    ctx.lineTo(0, r * 0.1);
    ctx.lineTo(r * 0.38, -r * 0.12);
    ctx.stroke();
  } else if (kind === 'space_plasma_bolt') {
    // High-speed crimson Plasma Bolt (-3 pts, -1 Star)
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.45);
    glow.addColorStop(0, 'rgba(244, 63, 94, 0.78)');
    glow.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f43f5e';
    ctx.strokeStyle = '#fecdd3';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(r * 0.24, -r * 1.15);
    ctx.lineTo(-r * 0.55, r * 0.06);
    ctx.lineTo(r * 0.04, r * 0.06);
    ctx.lineTo(-r * 0.26, r * 1.15);
    ctx.lineTo(r * 0.58, -r * 0.12);
    ctx.lineTo(-r * 0.04, -r * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'space_cryo_mine') {
    // Spiky Cryo Freeze Mine (-3 pts, Freeze 3s, -1 Star)
    ctx.rotate(rotation * 0.8);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.6;
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * r * 0.55, Math.sin(ang) * r * 0.55);
      ctx.lineTo(Math.cos(ang) * r * 1.08, Math.sin(ang) * r * 1.08);
      ctx.stroke();
    }

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pulsing frost-red eye
    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'space_dust_cloud') {
    // Toxic green cosmic dust cloud (-2 pts, Slow 2s)
    const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.45);
    aura.addColorStop(0, 'rgba(132, 204, 22, 0.72)');
    aura.addColorStop(1, 'rgba(132, 204, 22, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#365314';
    ctx.strokeStyle = '#a3e635';
    ctx.lineWidth = 1.6;
    const puffs = [
      { x: -r * 0.42, y: r * 0.12, cr: r * 0.52 },
      { x: r * 0.42, y: r * 0.14, cr: r * 0.48 },
      { x: 0, y: -r * 0.22, cr: r * 0.62 },
    ];
    for (const p of puffs) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.cr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#d9f99d';
    ctx.beginPath();
    ctx.arc(-r * 0.18, -r * 0.16, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.22, r * 0.08, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'space_laser_drone') {
    // Armed crimson Laser Drone (-2 pts, -1 Star)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 1.05, 0);
    ctx.lineTo(-r * 0.45, -r * 0.55);
    ctx.lineTo(r * 0.45, -r * 0.55);
    ctx.lineTo(r * 1.05, 0);
    ctx.lineTo(r * 0.45, r * 0.52);
    ctx.lineTo(-r * 0.45, r * 0.52);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing red eye + twin bottom laser prongs
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe4e6';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-r * 0.34, r * 0.52);
    ctx.lineTo(-r * 0.34, r * 1.05);
    ctx.moveTo(r * 0.34, r * 0.52);
    ctx.lineTo(r * 0.34, r * 1.05);
    ctx.stroke();
  } else if (kind === 'space_acid_comet') {
    // Streaking Toxic Acid Comet (-3 pts, Slow 3s)
    const tail = ctx.createLinearGradient(0, -r * 1.7, 0, r * 0.35);
    tail.addColorStop(0, 'rgba(163, 230, 53, 0)');
    tail.addColorStop(0.55, 'rgba(132, 204, 22, 0.72)');
    tail.addColorStop(1, 'rgba(217, 249, 157, 0.95)');
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.72);
    ctx.lineTo(r * 0.68, r * 0.25);
    ctx.lineTo(-r * 0.68, r * 0.25);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#65a30d';
    ctx.strokeStyle = '#ecfccb';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, r * 0.28, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#bef264';
    ctx.beginPath();
    ctx.arc(-r * 0.18, r * 0.16, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'space_emp_ring') {
    // High-voltage EMP Shock Ring (-3 pts, Heavy Slow 3s)
    ctx.rotate(rotation * 1.2);
    const glow = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, r * 1.4);
    glow.addColorStop(0, 'rgba(250, 204, 21, 0.75)');
    glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'space_solar_flare') {
    // Blistering Solar Flare (-4 pts, -1 Star, Fast)
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.55);
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.92)');
    glow.addColorStop(0.6, 'rgba(239, 68, 68, 0.65)');
    glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(rotation * 1.1);
    ctx.fillStyle = '#f97316';
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const ang = (i * Math.PI) / 6;
      const rad = i % 2 === 0 ? r * 1.1 : r * 0.56;
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'space_rogue_satellite') {
    // Tumbling Rogue Satellite (-4 pts, -1 Star)
    ctx.rotate(rotation * 0.9);
    // Twin solar panel wings
    ctx.fillStyle = '#1d4ed8';
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 1.4;
    ctx.fillRect(-r * 1.15, -r * 0.32, r * 0.68, r * 0.64);
    ctx.strokeRect(-r * 1.15, -r * 0.32, r * 0.68, r * 0.64);
    ctx.fillRect(r * 0.47, -r * 0.32, r * 0.68, r * 0.64);
    ctx.strokeRect(r * 0.47, -r * 0.32, r * 0.68, r * 0.64);

    // Cracked metallic core + red warning beacon
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.fillRect(-r * 0.42, -r * 0.5, r * 0.84, r);
    ctx.strokeRect(-r * 0.42, -r * 0.5, r * 0.84, r);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -r * 0.14, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'space_gravity_orb') {
    // Dense Indigo Gravity Orb (-4 pts, Heavy Slow 3.5s, -1 Star)
    ctx.rotate(rotation * 1.3);
    const aura = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.5);
    aura.addColorStop(0, 'rgba(99, 102, 241, 0.85)');
    aura.addColorStop(1, 'rgba(79, 70, 229, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#a5b4fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.96, 0, Math.PI * 1.45);
    ctx.stroke();

    ctx.fillStyle = '#312e81';
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.64, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#c7d2fe';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'space_antimatter') {
    // Volatile Pink/Black Antimatter Orb (-5 pts, -2 Stars)
    ctx.rotate(rotation * 1.5);
    const aura = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, r * 1.58);
    aura.addColorStop(0, 'rgba(236, 72, 153, 0.9)');
    aura.addColorStop(0.55, 'rgba(190, 24, 93, 0.55)');
    aura.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.58, 0, Math.PI * 2);
    ctx.fill();

    // Crossed orbital arcs
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 2.2;
    for (let a = 0; a < 3; a++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.15, r * 0.36, (a * Math.PI) / 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#fbcfe8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.54, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.rotate(-rotation * 1.5);
    drawBadge('-2★', 'rgba(190, 24, 93, 0.92)', '#fdf2f8');
  } else if (kind === 'space_void_crystal') {
    // Dark Void Freeze Crystal (-5 pts, Freeze 3.5s, -2 Stars)
    const aura = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.55);
    aura.addColorStop(0, 'rgba(124, 58, 237, 0.85)');
    aura.addColorStop(1, 'rgba(59, 7, 100, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.15);
    ctx.lineTo(r * 0.72, -r * 0.2);
    ctx.lineTo(r * 0.45, r * 1.05);
    ctx.lineTo(0, r * 0.82);
    ctx.lineTo(-r * 0.45, r * 1.05);
    ctx.lineTo(-r * 0.72, -r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(r * 0.26, 0);
    ctx.lineTo(0, r * 0.45);
    ctx.lineTo(-r * 0.26, 0);
    ctx.closePath();
    ctx.fill();

    drawBadge('-2★', 'rgba(76, 29, 149, 0.95)', '#bae6fd');
  } else if (kind === 'space_supernova_core') {
    // Deadliest Supernova Core (-6 pts, -2 Stars, Fast)
    ctx.rotate(rotation * 1.8);
    const blast = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.7);
    blast.addColorStop(0, '#ffffff');
    blast.addColorStop(0.35, 'rgba(251, 146, 60, 0.92)');
    blast.addColorStop(0.7, 'rgba(220, 38, 38, 0.75)');
    blast.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = blast;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const ang = (i * Math.PI) / 8;
      const rad = i % 2 === 0 ? r * 1.2 : r * 0.58;
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(-rotation * 1.8);
    drawBadge('-6', 'rgba(153, 27, 27, 0.95)', '#fef08a');
  } else {
    // space_blackhole (-5 pts, -2 Stars!)
    ctx.rotate(rotation * 1.6);
    const outer = ctx.createRadialGradient(0, 0, r * 0.45, 0, 0, r * 1.65);
    outer.addColorStop(0, 'rgba(168, 85, 247, 0.92)');
    outer.addColorStop(0.55, 'rgba(239, 68, 68, 0.55)');
    outer.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.65, 0, Math.PI * 2);
    ctx.fill();

    // Swirling accretion rings
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.25, r * 0.48, 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.15, r * 0.44, -0.55, 0, Math.PI * 2);
    ctx.stroke();

    // Pitch-black singularity event horizon
    ctx.fillStyle = '#030014';
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.rotate(-rotation * 1.6);
    drawBadge('-2★', 'rgba(153, 27, 27, 0.92)', '#fef2f2');
  }

  ctx.restore();
}

export function drawSpaceShipCatcher(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tilt: number,
  scaleX: number,
  scaleY: number,
  glowColor: string,
  glowAlpha: number,
  skin: SpaceShipSkinId = 'default'
) {
  const halfW = w / 2;
  const halfH = h / 2;

  const palette =
    skin === 'nebula_cruiser'
      ? {
          flameMid: '#f472b6',
          flameEnd: 'rgba(232, 121, 249, 0)',
          hull: ['#fdf4ff', '#e879f9', '#7e22ce', '#2e1065'] as const,
          stroke: '#f5d0fe',
          beam: ['#22d3ee', '#f472b6', '#22d3ee'] as const,
          visor: ['#f0abfc', '#0891b2'] as const,
          tripleThruster: false,
        }
      : skin === 'solar_phoenix'
      ? {
          flameMid: '#fb923c',
          flameEnd: 'rgba(239, 68, 68, 0)',
          hull: ['#fffbeb', '#fbbf24', '#ea580c', '#7c2d12'] as const,
          stroke: '#fde68a',
          beam: ['#fef08a', '#f97316', '#fef08a'] as const,
          visor: ['#fef9c3', '#dc2626'] as const,
          tripleThruster: false,
        }
      : skin === 'galaxy_emperor'
      ? {
          flameMid: '#34d399',
          flameEnd: 'rgba(56, 189, 248, 0)',
          hull: ['#fef9c3', '#34d399', '#0f766e', '#090d1e'] as const,
          stroke: '#fde047',
          beam: ['#34d399', '#fde047', '#c084fc'] as const,
          visor: ['#a7f3d0', '#7c3aed'] as const,
          tripleThruster: true,
        }
      : {
          flameMid: '#38bdf8',
          flameEnd: 'rgba(139, 92, 246, 0)',
          hull: ['#e0e7ff', '#818cf8', '#4c1d95', '#1e1b4b'] as const,
          stroke: '#c4b5fd',
          beam: ['#38bdf8', '#f0abfc', '#38bdf8'] as const,
          visor: ['#a5f3fc', '#0284c7'] as const,
          tripleThruster: false,
        };

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scaleX, scaleY);

  // Dynamic catch glow halo
  if (glowAlpha > 0.02) {
    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, halfW * 1.35);
    aura.addColorStop(0, glowColor);
    aura.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.globalAlpha = Math.min(0.65, glowAlpha * 0.65);
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, 0, halfW * 1.3, halfH * 2.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Twin or triple ion thruster plumes below
  const flamePulse = 0.8 + 0.25 * Math.sin(performance.now() * 0.024);
  const thrusterOffsets = palette.tripleThruster ? [-0.55, 0, 0.55] : [-0.5, 0.5];
  for (const offset of thrusterOffsets) {
    const tx = offset * halfW;
    const isCenter = offset === 0;
    const flameGrad = ctx.createRadialGradient(
      tx,
      halfH + 4,
      1,
      tx,
      halfH + 8,
      (isCenter ? 14 : 12) * flamePulse
    );
    flameGrad.addColorStop(0, '#ffffff');
    flameGrad.addColorStop(0.45, palette.flameMid);
    flameGrad.addColorStop(1, palette.flameEnd);
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.ellipse(
      tx,
      halfH + 6,
      isCenter ? 9 : 8,
      (isCenter ? 11 : 9) * flamePulse,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Sleek cosmic plasma collector hull
  const hullGrad = ctx.createLinearGradient(0, -halfH - 4, 0, halfH + 4);
  hullGrad.addColorStop(0, palette.hull[0]);
  hullGrad.addColorStop(0.35, palette.hull[1]);
  hullGrad.addColorStop(0.75, palette.hull[2]);
  hullGrad.addColorStop(1, palette.hull[3]);
  ctx.fillStyle = hullGrad;
  ctx.beginPath();
  ctx.moveTo(-halfW, -halfH * 0.45);
  ctx.lineTo(-halfW * 0.78, -halfH * 0.85);
  ctx.lineTo(-halfW * 0.56, -halfH * 0.15);
  ctx.lineTo(halfW * 0.56, -halfH * 0.15);
  ctx.lineTo(halfW * 0.78, -halfH * 0.85);
  ctx.lineTo(halfW, -halfH * 0.45);
  ctx.quadraticCurveTo(halfW * 0.92, halfH + 4, halfW * 0.48, halfH + 4);
  ctx.lineTo(-halfW * 0.48, halfH + 4);
  ctx.quadraticCurveTo(-halfW * 0.92, halfH + 4, -halfW, -halfH * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = palette.stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Energy catcher ribbon across the cradle
  const beamGrad = ctx.createLinearGradient(-halfW * 0.65, 0, halfW * 0.65, 0);
  beamGrad.addColorStop(0, palette.beam[0]);
  beamGrad.addColorStop(0.5, palette.beam[1]);
  beamGrad.addColorStop(1, palette.beam[2]);
  ctx.strokeStyle = beamGrad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-halfW * 0.62, -halfH * 0.38);
  ctx.quadraticCurveTo(0, -halfH * 0.05, halfW * 0.62, -halfH * 0.38);
  ctx.stroke();

  // Glowing cockpit visor core
  const visor = ctx.createLinearGradient(0, -2, 0, 8);
  visor.addColorStop(0, palette.visor[0]);
  visor.addColorStop(1, palette.visor[1]);
  ctx.fillStyle = visor;
  ctx.beginPath();
  ctx.roundRect(-halfW * 0.3, -1, w * 0.3, 8, 4);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Extra golden crown crest for Galaxy Emperor
  if (skin === 'galaxy_emperor') {
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(0, -halfH * 0.45);
    ctx.lineTo(6, -halfH * 0.12);
    ctx.lineTo(0, -halfH * 0.02);
    ctx.lineTo(-6, -halfH * 0.12);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function SpaceCoinIcon({
  className = 'w-3.5 h-3.5 shrink-0',
}: {
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9.5"
        fill="#7c3aed"
        stroke="#67e8f9"
        strokeWidth="1.7"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="8.2"
        ry="3.1"
        transform="rotate(-24 12 12)"
        fill="none"
        stroke="#e879f9"
        strokeWidth="1.3"
        strokeOpacity="0.85"
      />
      <path
        d="M12 6.5 Q13.1 10.9 17.5 12 Q13.1 13.1 12 17.5 Q10.9 13.1 6.5 12 Q10.9 10.9 12 6.5 Z"
        fill="#fef08a"
      />
    </svg>
  );
}

export function SpaceStarIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
      <polygon
        points="14,2.5 17.5,10 25.5,11 19.5,16.6 21,24.6 14,20.6 7,24.6 8.5,16.6 2.5,11 10.5,10"
        fill="#c084fc"
        stroke="#f5d0fe"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <polygon
        points="14,5.8 16.2,10.8 21.5,11.5 17.6,15.2 18.6,20.5 14,17.8 9.4,20.5 10.4,15.2 6.5,11.5 11.8,10.8"
        fill="#e9d5ff"
        fillOpacity="0.55"
      />
    </svg>
  );
}

export function SpaceIndexIcon({ kind }: { kind: SpaceItemKind }) {
  if (kind === 'space_stardust') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <circle cx="14" cy="14" r="10" fill="#0284c7" stroke="#bae6fd" strokeWidth="1.5" />
        <path
          d="M14 6 Q15.5 12.5 22 14 Q15.5 15.5 14 22 Q12.5 15.5 6 14 Q12.5 12.5 14 6 Z"
          fill="#ffffff"
        />
      </svg>
    );
  }
  if (kind === 'space_moon') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <path
          d="M18.5 5.5 A9.5 9.5 0 1 0 22.5 19.5 A7.4 7.4 0 1 1 18.5 5.5 Z"
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="9" r="1.8" fill="#fef08a" />
      </svg>
    );
  }
  if (kind === 'space_comet') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon points="14,2 21,18 7,18" fill="#22d3ee" fillOpacity="0.65" />
        <circle cx="14" cy="19" r="6.2" fill="#67e8f9" stroke="#ecfeff" strokeWidth="1.5" />
        <circle cx="12.5" cy="17.5" r="2" fill="#ffffff" />
      </svg>
    );
  }
  if (kind === 'space_saturn') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <circle cx="14" cy="14" r="7" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.2" />
        <ellipse
          cx="14"
          cy="14"
          rx="12"
          ry="3.6"
          transform="rotate(-18 14 14)"
          fill="none"
          stroke="#fef9c3"
          strokeWidth="2.2"
        />
      </svg>
    );
  }
  if (kind === 'space_nebula') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="14,3 22,11 19.5,22 14,25 8.5,22 6,11"
          fill="#e879f9"
          stroke="#fdf4ff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <polygon points="14,6 18,12 14,16 10,12" fill="rgba(255,255,255,0.5)" />
      </svg>
    );
  }
  if (kind === 'space_solar') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="14,2 16.8,7.5 22.8,5.2 20.5,11.2 26,14 20.5,16.8 22.8,22.8 16.8,20.5 14,26 11.2,20.5 5.2,22.8 7.5,16.8 2,14 7.5,11.2 5.2,5.2 11.2,7.5"
          fill="#fb923c"
        />
        <circle cx="14" cy="14" r="6.2" fill="#fde047" stroke="#ffffff" strokeWidth="1.3" />
      </svg>
    );
  }
  if (kind === 'space_aurora') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <path
          d="M14 3 L23 8.5 Q22.5 19.5 14 25 Q5.5 19.5 5 8.5 Z"
          fill="#10b981"
          stroke="#ecfdf5"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <polygon points="14,8 18,14 14,20 10,14" fill="#a7f3d0" />
      </svg>
    );
  }
  if (kind === 'space_pulsar') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <circle cx="14" cy="14" r="9.5" fill="none" stroke="#a5b4fc" strokeWidth="1.6" />
        <polygon
          points="14,2.5 16.6,10.5 24.5,8.5 18.2,14 24.5,19.5 16.6,17.5 14,25.5 11.4,17.5 3.5,19.5 9.8,14 3.5,8.5 11.4,10.5"
          fill="#e0e7ff"
        />
        <circle cx="14" cy="14" r="3.6" fill="#6366f1" />
      </svg>
    );
  }
  if (kind === 'space_galaxy') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <circle cx="14" cy="14" r="11" fill="#3b0764" stroke="#f0abfc" strokeWidth="1.4" />
        <path
          d="M14 14 C16 8 22 8 22 14 M14 14 C18 18 15 23 10 21 M14 14 C9 15 6 10 10 6"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="14" cy="14" r="3.5" fill="#ffffff" />
      </svg>
    );
  }
  if (kind === 'space_emerald_star') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="14,2.5 17.4,10 25.5,11 19.4,16.5 21,24.5 14,20.5 7,24.5 8.6,16.5 2.5,11 10.6,10"
          fill="#10b981"
          stroke="#d1fae5"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="14" r="3" fill="#ecfdf5" />
      </svg>
    );
  }
  if (kind === 'space_quasar_orb') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <line x1="14" y1="2.5" x2="14" y2="25.5" stroke="#fb7185" strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx="14" cy="14" rx="11" ry="3.8" fill="none" stroke="#fda4af" strokeWidth="1.8" />
        <circle cx="14" cy="14" r="5.5" fill="#e11d48" stroke="#ffffff" strokeWidth="1.3" />
        <circle cx="14" cy="14" r="2.2" fill="#ffffff" />
      </svg>
    );
  }
  if (kind === 'space_diamond_meteor') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon points="14,2 21,15 7,15" fill="#7dd3fc" fillOpacity="0.6" />
        <polygon
          points="14,6 23,14.5 14,25 5,14.5"
          fill="#38bdf8"
          stroke="#f0f9ff"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <polygon points="14,9.5 18.5,14.5 14,19.5 9.5,14.5" fill="#e0f2fe" fillOpacity="0.7" />
      </svg>
    );
  }
  if (kind === 'space_crown_nova') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="4.5,21 3.5,9.5 9.5,14 14,5 18.5,14 24.5,9.5 23.5,21"
          fill="#fbbf24"
          stroke="#fef9c3"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="16.5" r="2.3" fill="#e879f9" />
      </svg>
    );
  }
  if (kind === 'space_omega_crystal') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <ellipse
          cx="14"
          cy="14"
          rx="12"
          ry="4.5"
          transform="rotate(22 14 14)"
          fill="none"
          stroke="#fef08a"
          strokeWidth="1.7"
        />
        <polygon
          points="14,2.5 22,9 23.5,16 18.5,23.5 14,25.5 9.5,23.5 4.5,16 6,9"
          fill="#e879f9"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M14 8 Q15.3 12.7 20 14 Q15.3 15.3 14 20 Q12.7 15.3 8 14 Q12.7 12.7 14 8 Z"
          fill="#fef9c3"
        />
      </svg>
    );
  }
  if (kind === 'space_debris') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="5,10 13,4 23,9 21,21 11,24 4,17"
          fill="#475569"
          stroke="#cbd5e1"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <line x1="9" y1="12" x2="19" y2="16" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'space_ice_shard') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="14,25 21,11 17.5,4 14,7.5 10.5,4 7,11"
          fill="#22d3ee"
          stroke="#f87171"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === 'space_meteor') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon points="14,1.5 22,15 6,15" fill="#f97316" fillOpacity="0.8" />
        <polygon
          points="14,7 21.5,11 22,19 15,24 7,21 6.5,12"
          fill="#44403c"
          stroke="#f97316"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M10 14 L14 16.5 L18 13" fill="none" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'space_plasma_bolt') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="16.5,2.5 8,15 14.5,15 11.5,25.5 20.5,12.5 13.5,12.5"
          fill="#f43f5e"
          stroke="#fecdd3"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === 'space_cryo_mine') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <g stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round">
          <line x1="14" y1="3" x2="14" y2="25" />
          <line x1="3" y1="14" x2="25" y2="14" />
          <line x1="6.2" y1="6.2" x2="21.8" y2="21.8" />
          <line x1="21.8" y1="6.2" x2="6.2" y2="21.8" />
        </g>
        <circle cx="14" cy="14" r="6.8" fill="#1e293b" stroke="#ef4444" strokeWidth="1.8" />
        <circle cx="14" cy="14" r="2.8" fill="#7dd3fc" />
      </svg>
    );
  }
  if (kind === 'space_dust_cloud') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <circle cx="9.5" cy="16" r="5.5" fill="#365314" stroke="#a3e635" strokeWidth="1.4" />
        <circle cx="18.5" cy="16" r="5" fill="#365314" stroke="#a3e635" strokeWidth="1.4" />
        <circle cx="14" cy="11.5" r="6.5" fill="#4d7c0f" stroke="#a3e635" strokeWidth="1.4" />
        <circle cx="12" cy="11" r="1.4" fill="#d9f99d" />
        <circle cx="16.5" cy="15" r="1.2" fill="#d9f99d" />
      </svg>
    );
  }
  if (kind === 'space_laser_drone') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="3,13 9,7 19,7 25,13 19,19 9,19"
          fill="#1e293b"
          stroke="#fb7185"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="13" r="3.6" fill="#f43f5e" />
        <circle cx="14" cy="13" r="1.4" fill="#ffe4e6" />
        <line x1="10.5" y1="19" x2="10.5" y2="25" stroke="#fda4af" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="17.5" y1="19" x2="17.5" y2="25" stroke="#fda4af" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'space_acid_comet') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon points="14,2 21,18 7,18" fill="#84cc16" fillOpacity="0.72" />
        <circle cx="14" cy="19" r="6" fill="#65a30d" stroke="#ecfccb" strokeWidth="1.5" />
        <circle cx="12.2" cy="17.5" r="1.9" fill="#bef264" />
      </svg>
    );
  }
  if (kind === 'space_emp_ring') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <circle cx="14" cy="14" r="9.5" fill="none" stroke="#facc15" strokeWidth="2.6" />
        <circle cx="14" cy="14" r="5.6" fill="none" stroke="#38bdf8" strokeWidth="1.6" strokeDasharray="3 2.5" />
        <circle cx="14" cy="14" r="2.6" fill="#fef08a" />
      </svg>
    );
  }
  if (kind === 'space_solar_flare') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="14,2 16.5,8.2 22.8,5.2 19.8,11.5 26,14 19.8,16.5 22.8,22.8 16.5,19.8 14,26 11.5,19.8 5.2,22.8 8.2,16.5 2,14 8.2,11.5 5.2,5.2 11.5,8.2"
          fill="#f97316"
          stroke="#fef08a"
          strokeWidth="1.2"
        />
        <circle cx="14" cy="14" r="4.5" fill="#dc2626" />
      </svg>
    );
  }
  if (kind === 'space_rogue_satellite') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <rect x="2.5" y="10" width="7" height="8" rx="1" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1.3" />
        <rect x="18.5" y="10" width="7" height="8" rx="1" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1.3" />
        <rect x="9.8" y="7.5" width="8.4" height="13" rx="1.5" fill="#475569" stroke="#f87171" strokeWidth="1.5" />
        <circle cx="14" cy="12" r="2.2" fill="#ef4444" />
      </svg>
    );
  }
  if (kind === 'space_gravity_orb') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <circle cx="14" cy="14" r="10.2" fill="none" stroke="#a5b4fc" strokeWidth="1.8" strokeDasharray="16 6" />
        <circle cx="14" cy="14" r="6.8" fill="#312e81" stroke="#f87171" strokeWidth="1.6" />
        <circle cx="14" cy="14" r="2.4" fill="#c7d2fe" />
      </svg>
    );
  }
  if (kind === 'space_antimatter') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <ellipse cx="14" cy="14" rx="11" ry="4" fill="none" stroke="#f472b6" strokeWidth="1.8" />
        <ellipse cx="14" cy="14" rx="11" ry="4" transform="rotate(60 14 14)" fill="none" stroke="#f472b6" strokeWidth="1.8" />
        <ellipse cx="14" cy="14" rx="11" ry="4" transform="rotate(-60 14 14)" fill="none" stroke="#f472b6" strokeWidth="1.8" />
        <circle cx="14" cy="14" r="5.2" fill="#0f172a" stroke="#fbcfe8" strokeWidth="1.5" />
      </svg>
    );
  }
  if (kind === 'space_void_crystal') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="14,2.5 21.5,11.5 18.5,24.5 14,22 9.5,24.5 6.5,11.5"
          fill="#1e1b4b"
          stroke="#a78bfa"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <polygon points="14,8 17,14 14,19 11,14" fill="#38bdf8" />
      </svg>
    );
  }
  if (kind === 'space_supernova_core') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="14,1.8 16.3,8 22.6,5 19.6,11.2 26.2,14 19.6,16.8 22.6,23 16.3,20 14,26.2 11.7,20 5.4,23 8.4,16.8 1.8,14 8.4,11.2 5.4,5 11.7,8"
          fill="#dc2626"
          stroke="#fef08a"
          strokeWidth="1.4"
        />
        <circle cx="14" cy="14" r="4.2" fill="#ffffff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 28 28" className="w-7 h-7">
      <ellipse
        cx="14"
        cy="14"
        rx="12"
        ry="5"
        transform="rotate(20 14 14)"
        fill="none"
        stroke="#f43f5e"
        strokeWidth="2"
      />
      <ellipse
        cx="14"
        cy="14"
        rx="11"
        ry="4.5"
        transform="rotate(-28 14 14)"
        fill="none"
        stroke="#c084fc"
        strokeWidth="1.8"
      />
      <circle cx="14" cy="14" r="6.5" fill="#030014" stroke="#fde047" strokeWidth="1.5" />
    </svg>
  );
}

export function drawBossBeams(
  ctx: CanvasRenderingContext2D,
  beams: BossLaserBeam[]
): void {
  if (beams.length === 0) return;
  ctx.save();
  ctx.lineCap = 'round';
  for (const beam of beams) {
    const ratio = Math.max(0, Math.min(1, beam.life / beam.maxLife));
    ctx.globalAlpha = ratio * 0.55;
    ctx.strokeStyle = beam.color;
    ctx.lineWidth = 9 * ratio + 2;
    ctx.beginPath();
    ctx.moveTo(beam.fromX, beam.fromY);
    ctx.lineTo(beam.toX, beam.toY);
    ctx.stroke();

    ctx.globalAlpha = ratio * 0.95;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3 * ratio + 1;
    ctx.beginPath();
    ctx.moveTo(beam.fromX, beam.fromY);
    ctx.lineTo(beam.toX, beam.toY);
    ctx.stroke();

    // Impact ring on Boss hull
    const ringR = 8 + (1 - ratio) * 20;
    ctx.globalAlpha = ratio * 0.85;
    ctx.strokeStyle = beam.color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(beam.toX, beam.toY, ringR, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawSpaceBoss(
  ctx: CanvasRenderingContext2D,
  boss: SpaceBossRuntime,
  width: number,
  lang: 'ar' | 'en'
): void {
  const { config, x, y, hp, maxHp, hitFlash, telegraphTimer, pulsePhase, enraged } = boss;
  const hpRatio = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  const isCharging = telegraphTimer > 0;
  const chargePulse = isCharging ? 0.5 + 0.5 * Math.sin(pulsePhase * 18) : 0;
  const isSupreme = Boolean(config.isSupreme);
  const scale =
    Math.max(0.84, Math.min(1.06, width / 560)) * (isSupreme ? 1.24 : 1);

  // 1. Boss Ship Hull
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Outer cosmic aura (intensifies when enraged, charging, or Supreme Boss)
  const auraR =
    (isCharging ? 74 + chargePulse * 14 : enraged ? 68 : 58) +
    (isSupreme ? 18 : 0);
  const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, auraR);
  aura.addColorStop(
    0,
    isCharging
      ? 'rgba(254, 240, 138, 0.88)'
      : isSupreme
      ? 'rgba(250, 204, 21, 0.76)'
      : enraged
      ? 'rgba(239, 68, 68, 0.65)'
      : config.glowColor
  );
  aura.addColorStop(0.55, config.glowColor.replace(/[\d.]+\)$/, '0.32)'));
  aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, auraR, 0, Math.PI * 2);
  ctx.fill();

  // Telegraph attack warning ring + downward laser sights
  if (isCharging) {
    ctx.save();
    ctx.strokeStyle = `rgba(254, 240, 138, ${0.55 + chargePulse * 0.45})`;
    ctx.lineWidth = isSupreme ? 3.2 : 2.6;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(0, 4, (isSupreme ? 56 : 48) - chargePulse * 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Faint downward warning beams
    const aimGrad = ctx.createLinearGradient(0, 24, 0, 136);
    aimGrad.addColorStop(0, `rgba(248, 113, 113, ${0.46 + chargePulse * 0.35})`);
    aimGrad.addColorStop(1, 'rgba(248, 113, 113, 0)');
    ctx.strokeStyle = aimGrad;
    ctx.lineWidth = isSupreme ? 3.4 : 3;
    ctx.beginPath();
    ctx.moveTo(-24, 24);
    ctx.lineTo(-44, 128);
    ctx.moveTo(0, 26);
    ctx.lineTo(0, 136);
    ctx.moveTo(24, 24);
    ctx.lineTo(44, 128);
    if (isSupreme) {
      ctx.moveTo(-44, 20);
      ctx.lineTo(-76, 122);
      ctx.moveTo(44, 20);
      ctx.lineTo(76, 122);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Orbiting energy halo (Supreme Boss gets twin counter-rotating halos!)
  ctx.save();
  ctx.rotate(Math.sin(pulsePhase * 1.4) * 0.16);
  ctx.strokeStyle = enraged ? '#fca5a5' : config.secondaryColor;
  ctx.lineWidth = isSupreme ? 2.8 : 2.2;
  ctx.globalAlpha = isSupreme ? 0.88 : 0.72;
  ctx.beginPath();
  ctx.ellipse(0, 0, isSupreme ? 64 : 56, isSupreme ? 18 : 15, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (isSupreme) {
    ctx.rotate(-Math.sin(pulsePhase * 1.4) * 0.32);
    ctx.strokeStyle = '#e879f9';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 60, 22, 0.25, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Main Dreadnought Wings & Armored Silhouette per Tier
  const wingGrad = ctx.createLinearGradient(-56, -18, 56, 26);
  if (hitFlash > 0.12) {
    wingGrad.addColorStop(0, '#ffffff');
    wingGrad.addColorStop(0.5, '#fef9c3');
    wingGrad.addColorStop(1, '#ffffff');
  } else if (config.tier === 'omega_emperor') {
    wingGrad.addColorStop(0, '#1e0521');
    wingGrad.addColorStop(0.28, '#991b1b');
    wingGrad.addColorStop(0.5, '#facc15');
    wingGrad.addColorStop(0.72, '#991b1b');
    wingGrad.addColorStop(1, '#1e0521');
  } else if (config.tier === 'meteor_warden') {
    wingGrad.addColorStop(0, '#7c2d12');
    wingGrad.addColorStop(0.5, '#ea580c');
    wingGrad.addColorStop(1, '#431407');
  } else if (config.tier === 'cryo_sovereign') {
    wingGrad.addColorStop(0, '#0e7490');
    wingGrad.addColorStop(0.5, '#38bdf8');
    wingGrad.addColorStop(1, '#164e63');
  } else if (config.tier === 'nebula_leviathan') {
    wingGrad.addColorStop(0, '#701a75');
    wingGrad.addColorStop(0.5, '#e879f9');
    wingGrad.addColorStop(1, '#4a044e');
  } else if (config.tier === 'void_emperor') {
    wingGrad.addColorStop(0, '#2e1065');
    wingGrad.addColorStop(0.5, '#6d28d9');
    wingGrad.addColorStop(1, '#090418');
  } else {
    // Supernova Overlord
    wingGrad.addColorStop(0, '#991b1b');
    wingGrad.addColorStop(0.5, '#f59e0b');
    wingGrad.addColorStop(1, '#7f1d1d');
  }

  // Twin armored side wings
  ctx.fillStyle = wingGrad;
  ctx.strokeStyle = hitFlash > 0.12 ? '#ffffff' : config.secondaryColor;
  ctx.lineWidth = isSupreme ? 2.4 : 2;
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(22, -18);
  ctx.lineTo(isSupreme ? 58 : 52, -4);
  ctx.lineTo(isSupreme ? 50 : 44, 19);
  ctx.lineTo(22, 12);
  ctx.lineTo(14, 26);
  ctx.lineTo(0, 20);
  ctx.lineTo(-14, 26);
  ctx.lineTo(-22, 12);
  ctx.lineTo(isSupreme ? -50 : -44, 19);
  ctx.lineTo(isSupreme ? -58 : -52, -4);
  ctx.lineTo(-22, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Boss Crown Spikes on Top (Supreme gets 7 royal spikes, Supernova gets 5, others 3)
  const spikeCount = isSupreme
    ? 7
    : config.tier === 'supernova_overlord'
    ? 5
    : 3;
  ctx.fillStyle = hitFlash > 0.12 ? '#ffffff' : config.secondaryColor;
  for (let i = 0; i < spikeCount; i++) {
    const frac = (i / (spikeCount - 1)) * 2 - 1;
    const sx = frac * (isSupreme ? 30 : spikeCount === 5 ? 24 : 16);
    const sh =
      i === Math.floor(spikeCount / 2)
        ? isSupreme
          ? 18
          : 14
        : isSupreme
        ? 11
        : 9;
    ctx.beginPath();
    ctx.moveTo(sx - 4.5, -20);
    ctx.lineTo(sx, -20 - sh);
    ctx.lineTo(sx + 4.5, -20);
    ctx.closePath();
    ctx.fill();
  }

  // Wing-tip cannon emitters (Supreme Boss has 4 heavy cannons!)
  const cannonGlow = isCharging ? '#fef08a' : enraged ? '#f87171' : config.primaryColor;
  const cannonXs = isSupreme ? [-44, -24, 24, 44] : [-34, 34];
  for (const cx of cannonXs) {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = config.secondaryColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(cx - 5, 8, 10, 14, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = cannonGlow;
    ctx.beginPath();
    ctx.arc(cx, 21, isCharging ? 4.5 + chargePulse * 2 : 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Central Armored Cockpit & Glowing Boss Eye/Core
  ctx.fillStyle = hitFlash > 0.12 ? '#ffffff' : '#0b1024';
  ctx.strokeStyle = enraged ? '#f87171' : config.secondaryColor;
  ctx.lineWidth = isSupreme ? 2.6 : 2.2;
  ctx.beginPath();
  ctx.arc(0, 1, isSupreme ? 18 : 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const coreR = (isSupreme ? 11 : 9) + Math.sin(pulsePhase * 4.5) * 1.4;
  const coreGrad = ctx.createRadialGradient(0, -1, 1, 0, 1, coreR + 3);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.45, isCharging ? '#fde047' : enraged ? '#f43f5e' : config.secondaryColor);
  coreGrad.addColorStop(1, config.primaryColor);
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 1, coreR, 0, Math.PI * 2);
  ctx.fill();

  // Slit pupil for fierce boss look
  ctx.fillStyle = '#09041a';
  ctx.beginPath();
  ctx.ellipse(0, 1, 2.4, enraged ? 7 : 5.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 2. Top Sleek Boss Health Bar (always legible, centered at top of playfield)
  ctx.save();
  const barW = Math.min(isSupreme ? 372 : 340, width - 24);
  const barH = 36;
  const bx = (width - barW) / 2;
  const by = 8;

  // Panel background
  ctx.fillStyle = isSupreme
    ? 'rgba(30, 5, 18, 0.94)'
    : 'rgba(9, 6, 26, 0.88)';
  ctx.strokeStyle = isSupreme
    ? 'rgba(250, 204, 21, 0.95)'
    : enraged
    ? 'rgba(248, 113, 113, 0.85)'
    : 'rgba(192, 132, 252, 0.65)';
  ctx.lineWidth = isSupreme ? 2.2 : 1.6;
  ctx.beginPath();
  ctx.roundRect(bx, by, barW, barH, 9);
  ctx.fill();
  ctx.stroke();

  // Boss Name + Enrage / HP Text
  const bossIcon = isSupreme ? '🔥👑' : '👑';
  const bossTitle =
    lang === 'ar'
      ? `${bossIcon} ${config.nameAr}${enraged ? ' · غاضب!' : ''}`
      : `${bossIcon} ${config.nameEn}${enraged ? ' · ENRAGED!' : ''}`;
  const hpText = `${Math.ceil(hp)} / ${maxHp}`;

  ctx.font = '800 11.5px Tajawal, "Segoe UI", system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = lang === 'ar' ? 'right' : 'left';
  ctx.fillStyle = enraged ? '#fca5a5' : '#fef08a';
  ctx.fillText(bossTitle, lang === 'ar' ? bx + barW - 10 : bx + 10, by + 11.5);

  ctx.font = '800 11px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = lang === 'ar' ? 'left' : 'right';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(hpText, lang === 'ar' ? bx + 10 : bx + barW - 10, by + 11.5);

  // HP Track
  const trackX = bx + 9;
  const trackY = by + 21;
  const trackW = barW - 18;
  const trackH = 8;
  ctx.fillStyle = 'rgba(30, 41, 59, 0.92)';
  ctx.beginPath();
  ctx.roundRect(trackX, trackY, trackW, trackH, 4);
  ctx.fill();

  // HP Fill
  const fillW = Math.max(0, trackW * hpRatio);
  if (fillW > 0) {
    const hpGrad = ctx.createLinearGradient(trackX, trackY, trackX + trackW, trackY);
    if (enraged) {
      hpGrad.addColorStop(0, '#dc2626');
      hpGrad.addColorStop(0.5, '#f97316');
      hpGrad.addColorStop(1, '#fde047');
    } else {
      hpGrad.addColorStop(0, config.primaryColor);
      hpGrad.addColorStop(1, config.secondaryColor);
    }
    ctx.fillStyle = hpGrad;
    ctx.beginPath();
    ctx.roundRect(trackX, trackY, fillW, trackH, 4);
    ctx.fill();

    // Specular sheen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.roundRect(trackX, trackY, fillW, trackH * 0.45, 4);
    ctx.fill();
  }

  ctx.restore();
}
