import React from 'react';

export type MonsterItemKind =
  | 'monster_ember'
  | 'monster_fang'
  | 'monster_rune'
  | 'monster_crystal'
  | 'monster_totem'
  | 'monster_dragon_heart'
  | 'monster_slime'
  | 'monster_claw'
  | 'monster_fireball'
  | 'monster_venom'
  | 'monster_curse'
  | 'monster_hell_meteor';

export interface MonsterStageConfig {
  stage: number;
  pointsNeeded: number;
  baseSpeed: number;
  spawnInterval: number;
  hazardChance: number;
  lateralDrift: number;
}

export interface MonsterIndexEntry {
  kind: MonsterItemKind;
  category: 'positive' | 'negative';
  minStage: number;
  nameAr: string;
  nameEn: string;
  valueAr: string;
  valueEn: string;
  benefitAr: string;
  benefitEn: string;
}

export interface MonsterBgMotif {
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotSpeed: number;
  alpha: number;
  flickerPhase: number;
  flickerSpeed: number;
  motif: 'ember' | 'rune_ring' | 'ash_shard' | 'fang_mark';
  hue: string;
}

export interface MonsterRenderItem {
  kind: MonsterItemKind;
  x: number;
  y: number;
  radius: number;
  rotation: number;
  pulsePhase: number;
}

export type MonsterSpecies =
  | 'magma_imp'
  | 'venom_beast'
  | 'shadow_cyclops'
  | 'bone_wyvern'
  | 'abyssal_fiend'
  | 'grand_magma'
  | 'grand_hydra'
  | 'grand_shadow'
  | 'grand_dragon'
  | 'grand_king';

export interface MonsterBossConfig {
  stage: number;
  species: MonsterSpecies;
  isGrandMonster: boolean;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  maxHp: number;
  patrolSpeed: number;
  attackInterval: number;
  barrageCount: number;
  attackKinds: MonsterItemKind[];
  firstClearCoins: number;
  firstClearPinkCoins: number;
  replayPinkCoins: number;
  primaryColor: string;
  secondaryColor: string;
  eyeColor: string;
  glowColor: string;
}

export interface MonsterBossRuntime {
  config: MonsterBossConfig;
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

export const TOTAL_MONSTER_STAGES = 50;
export const MAX_MONSTER_SKULLS = 10;

export function isGrandMonsterStage(stage: number): boolean {
  return stage >= 10 && stage <= TOTAL_MONSTER_STAGES && stage % 10 === 0;
}

export function getMonsterStageClearCoins(remainingSkulls: number): number {
  if (remainingSkulls >= 8) return 18;
  if (remainingSkulls >= 5) return 12;
  return 7;
}

/**
 * Grand Monsters appear every 10 stages (10, 20, 30, 40, 50).
 * Buffed by +75% strength across all Monster Bosses & Grand Monsters
 * (Grand Monster HP scales from 595 up to 945 HP at Stage 50).
 */
const GRAND_MONSTER_MAP: Record<number, MonsterBossConfig> = {
  10: {
    stage: 10,
    species: 'grand_magma',
    isGrandMonster: true,
    nameAr: 'غول الحمم الأكبر',
    nameEn: 'Grand Magma Colossus',
    titleAr: 'الوحش الأكبر · المرحلة 10',
    titleEn: 'Grand Monster · Stage 10',
    maxHp: 595,
    patrolSpeed: 148,
    attackInterval: 2.05,
    barrageCount: 4,
    attackKinds: ['monster_fireball', 'monster_claw', 'monster_hell_meteor'],
    firstClearCoins: 45,
    firstClearPinkCoins: 70,
    replayPinkCoins: 22,
    primaryColor: '#ea580c',
    secondaryColor: '#fbbf24',
    eyeColor: '#fef08a',
    glowColor: 'rgba(234, 88, 12, 0.78)',
  },
  20: {
    stage: 20,
    species: 'grand_hydra',
    isGrandMonster: true,
    nameAr: 'هيدرا السموم الأكبر',
    nameEn: 'Grand Venom Hydra',
    titleAr: 'الوحش الأكبر · المرحلة 20',
    titleEn: 'Grand Monster · Stage 20',
    maxHp: 685,
    patrolSpeed: 162,
    attackInterval: 1.92,
    barrageCount: 4,
    attackKinds: ['monster_venom', 'monster_slime', 'monster_claw', 'monster_fireball'],
    firstClearCoins: 55,
    firstClearPinkCoins: 85,
    replayPinkCoins: 26,
    primaryColor: '#10b981',
    secondaryColor: '#a3e635',
    eyeColor: '#fef08a',
    glowColor: 'rgba(16, 185, 129, 0.78)',
  },
  30: {
    stage: 30,
    species: 'grand_shadow',
    isGrandMonster: true,
    nameAr: 'شيطان الظلال الأكبر',
    nameEn: 'Grand Shadow Fiend',
    titleAr: 'الوحش الأكبر · المرحلة 30',
    titleEn: 'Grand Monster · Stage 30',
    maxHp: 770,
    patrolSpeed: 175,
    attackInterval: 1.8,
    barrageCount: 5,
    attackKinds: ['monster_curse', 'monster_claw', 'monster_venom', 'monster_hell_meteor'],
    firstClearCoins: 70,
    firstClearPinkCoins: 105,
    replayPinkCoins: 32,
    primaryColor: '#7c3aed',
    secondaryColor: '#e879f9',
    eyeColor: '#fde047',
    glowColor: 'rgba(139, 92, 246, 0.8)',
  },
  40: {
    stage: 40,
    species: 'grand_dragon',
    isGrandMonster: true,
    nameAr: 'تنين الهاوية الأكبر',
    nameEn: 'Grand Abyssal Dragon',
    titleAr: 'الوحش الأكبر · المرحلة 40',
    titleEn: 'Grand Monster · Stage 40',
    maxHp: 860,
    patrolSpeed: 188,
    attackInterval: 1.68,
    barrageCount: 5,
    attackKinds: ['monster_hell_meteor', 'monster_fireball', 'monster_curse', 'monster_venom'],
    firstClearCoins: 85,
    firstClearPinkCoins: 125,
    replayPinkCoins: 38,
    primaryColor: '#dc2626',
    secondaryColor: '#fb7185',
    eyeColor: '#fde047',
    glowColor: 'rgba(220, 38, 38, 0.82)',
  },
  50: {
    stage: 50,
    species: 'grand_king',
    isGrandMonster: true,
    nameAr: 'ملك الوحوش الأكبر',
    nameEn: 'Grand King of Monsters',
    titleAr: 'الوحش الأكبر النهائي · المرحلة 50',
    titleEn: 'Final Grand Monster · Stage 50',
    maxHp: 945,
    patrolSpeed: 202,
    attackInterval: 1.55,
    barrageCount: 6,
    attackKinds: ['monster_hell_meteor', 'monster_curse', 'monster_fireball', 'monster_venom', 'monster_claw'],
    firstClearCoins: 110,
    firstClearPinkCoins: 165,
    replayPinkCoins: 50,
    primaryColor: '#be123c',
    secondaryColor: '#f59e0b',
    eyeColor: '#fef08a',
    glowColor: 'rgba(244, 63, 94, 0.88)',
  },
};

const REGULAR_SPECIES_POOL: Array<{
  species: MonsterSpecies;
  namesAr: string[];
  namesEn: string[];
  primaryColor: string;
  secondaryColor: string;
  eyeColor: string;
  glowColor: string;
  attackKinds: MonsterItemKind[];
}> = [
  {
    species: 'magma_imp',
    namesAr: ['عفريت الجمر', 'وحش الحمم', 'شرارة البركان'],
    namesEn: ['Ember Imp', 'Magma Hound', 'Lava Spark'],
    primaryColor: '#f97316',
    secondaryColor: '#fde047',
    eyeColor: '#fef9c3',
    glowColor: 'rgba(249, 115, 22, 0.65)',
    attackKinds: ['monster_slime', 'monster_claw', 'monster_fireball'],
  },
  {
    species: 'venom_beast',
    namesAr: ['وحش السموم', 'مفترس المستنقع', 'أفعى الحمض'],
    namesEn: ['Venom Beast', 'Swamp Stalker', 'Acid Fang'],
    primaryColor: '#16a34a',
    secondaryColor: '#84cc16',
    eyeColor: '#fef08a',
    glowColor: 'rgba(34, 197, 94, 0.65)',
    attackKinds: ['monster_slime', 'monster_venom', 'monster_claw'],
  },
  {
    species: 'shadow_cyclops',
    namesAr: ['عملاق الظل', 'عين الهاوية', 'شبح الكهف'],
    namesEn: ['Shadow Cyclops', 'Abyssal Eye', 'Cavern Wraith'],
    primaryColor: '#9333ea',
    secondaryColor: '#d946ef',
    eyeColor: '#fde047',
    glowColor: 'rgba(168, 85, 247, 0.68)',
    attackKinds: ['monster_claw', 'monster_curse', 'monster_venom'],
  },
  {
    species: 'bone_wyvern',
    namesAr: ['تنين العظام', 'حارس اللهب', 'ناب الجحيم'],
    namesEn: ['Bone Wyvern', 'Flame Guardian', 'Hellfang'],
    primaryColor: '#e11d48',
    secondaryColor: '#fb923c',
    eyeColor: '#fef08a',
    glowColor: 'rgba(225, 29, 72, 0.7)',
    attackKinds: ['monster_fireball', 'monster_claw', 'monster_hell_meteor'],
  },
  {
    species: 'abyssal_fiend',
    namesAr: ['شيطان البركان', 'سيد الظلام', 'حارس العرش'],
    namesEn: ['Volcanic Fiend', 'Dark Warden', 'Throne Beast'],
    primaryColor: '#9f1239',
    secondaryColor: '#f43f5e',
    eyeColor: '#fde047',
    glowColor: 'rgba(190, 18, 60, 0.74)',
    attackKinds: ['monster_hell_meteor', 'monster_curse', 'monster_fireball', 'monster_venom'],
  },
];

export function getMonsterBossConfig(stage: number): MonsterBossConfig {
  const safeStage = Math.max(1, Math.min(TOTAL_MONSTER_STAGES, stage));
  const grand = GRAND_MONSTER_MAP[safeStage];
  if (grand) return grand;

  const tierIndex = Math.min(4, Math.floor((safeStage - 1) / 10));
  const variantIndex = (safeStage - 1) % 3;
  const spec = REGULAR_SPECIES_POOL[tierIndex];

  const maxHp = Math.round((90 + (safeStage - 1) * 4.5) * 1.75);
  const patrolSpeed = Math.round((76 + safeStage * 0.95) * 1.32);
  const attackInterval = Number(
    Math.max(1.75, (3.4 - safeStage * 0.017) * 0.74).toFixed(2)
  );
  const barrageCount = safeStage >= 35 ? 4 : safeStage >= 14 ? 3 : 2;

  return {
    stage: safeStage,
    species: spec.species,
    isGrandMonster: false,
    nameAr: spec.namesAr[variantIndex],
    nameEn: spec.namesEn[variantIndex],
    titleAr: `وحش المرحلة ${safeStage}`,
    titleEn: `Stage ${safeStage} Monster`,
    maxHp,
    patrolSpeed,
    attackInterval,
    barrageCount,
    attackKinds: spec.attackKinds,
    firstClearCoins: 18 + tierIndex * 4,
    firstClearPinkCoins: 24 + tierIndex * 6,
    replayPinkCoins: 10,
    primaryColor: spec.primaryColor,
    secondaryColor: spec.secondaryColor,
    eyeColor: spec.eyeColor,
    glowColor: spec.glowColor,
  };
}

export function createMonsterBossRuntime(
  stage: number,
  arenaWidth: number
): MonsterBossRuntime {
  const config = getMonsterBossConfig(stage);
  const baseY = config.isGrandMonster ? 124 : 114;
  return {
    config,
    x: arenaWidth * 0.5,
    y: baseY,
    baseY,
    vx: config.patrolSpeed,
    hp: config.maxHp,
    maxHp: config.maxHp,
    hitFlash: 0,
    recoilY: 0,
    attackTimer: config.isGrandMonster ? 1.15 : 1.45,
    telegraphTimer: 0,
    pulsePhase: 0,
    enraged: false,
    enrageAnnounced: false,
  };
}

export const MONSTER_STAGES: MonsterStageConfig[] = Array.from(
  { length: TOTAL_MONSTER_STAGES },
  (_, index) => {
    const stage = index + 1;
    const bossCfg = getMonsterBossConfig(stage);
    const isGrand = bossCfg.isGrandMonster;
    const baseSpeed = Math.round((138 + index * 2.5 + (isGrand ? 10 : 0)) * 1.18);
    const spawnInterval = Number(
      Math.max(0.38, 0.78 - index * 0.0072 - (isGrand ? 0.04 : 0)).toFixed(2)
    );
    const hazardChance = Number(
      Math.min(0.54, 0.3 + index * 0.0044 + (isGrand ? 0.04 : 0)).toFixed(2)
    );
    const lateralDrift = stage >= 5 ? Math.min(64, 16 + (stage - 5) * 1.05) : 0;

    return {
      stage,
      pointsNeeded: bossCfg.maxHp,
      baseSpeed,
      spawnInterval,
      hazardChance,
      lateralDrift,
    };
  }
);

export const MONSTER_ITEM_STATS: Record<
  MonsterItemKind,
  {
    points: number;
    category: 'positive' | 'negative';
    minStage: number;
    weight: number;
    speedMul: number;
    skullDamage: number;
    slowDuration: number;
    slowFactor: number;
    freezeDuration: number;
    clearsSlow?: boolean;
    grantsShield?: number;
    color: string;
    glow: string;
    badgeText: string;
  }
> = {
  // === 6 Positive Monster Relics (damage the hovering Monster!) ===
  monster_ember: {
    points: 3,
    category: 'positive',
    minStage: 1,
    weight: 26,
    speedMul: 0.96,
    skullDamage: 0,
    slowDuration: 0,
    slowFactor: 1,
    freezeDuration: 0,
    color: '#fb923c',
    glow: 'rgba(251, 146, 60, 0.55)',
    badgeText: '+3',
  },
  monster_fang: {
    points: 5,
    category: 'positive',
    minStage: 1,
    weight: 23,
    speedMul: 1.0,
    skullDamage: 0,
    slowDuration: 0,
    slowFactor: 1,
    freezeDuration: 0,
    color: '#fde047',
    glow: 'rgba(253, 224, 71, 0.58)',
    badgeText: '+5',
  },
  monster_rune: {
    points: 7,
    category: 'positive',
    minStage: 1,
    weight: 19,
    speedMul: 1.04,
    skullDamage: 0,
    slowDuration: 0,
    slowFactor: 1,
    freezeDuration: 0,
    color: '#34d399',
    glow: 'rgba(52, 211, 153, 0.62)',
    badgeText: '+7',
  },
  monster_crystal: {
    points: 9,
    category: 'positive',
    minStage: 1,
    weight: 15,
    speedMul: 1.08,
    skullDamage: 0,
    slowDuration: 0,
    slowFactor: 1,
    freezeDuration: 0,
    clearsSlow: true,
    color: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.65)',
    badgeText: '+9',
  },
  monster_totem: {
    points: 11,
    category: 'positive',
    minStage: 1,
    weight: 11,
    speedMul: 1.12,
    skullDamage: 0,
    slowDuration: 0,
    slowFactor: 1,
    freezeDuration: 0,
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.68)',
    badgeText: '+11',
  },
  monster_dragon_heart: {
    points: 13,
    category: 'positive',
    minStage: 1,
    weight: 7,
    speedMul: 1.15,
    skullDamage: 0,
    slowDuration: 0,
    slowFactor: 1,
    freezeDuration: 0,
    clearsSlow: true,
    grantsShield: 3.5,
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.8)',
    badgeText: '+13',
  },

  // === 6 Negative Monster Attacks / Hazards ===
  monster_slime: {
    points: -2,
    category: 'negative',
    minStage: 1,
    weight: 22,
    speedMul: 0.94,
    skullDamage: 0,
    slowDuration: 2.2,
    slowFactor: 0.56,
    freezeDuration: 0,
    color: '#84cc16',
    glow: 'rgba(132, 204, 22, 0.55)',
    badgeText: '-2',
  },
  monster_claw: {
    points: -3,
    category: 'negative',
    minStage: 1,
    weight: 22,
    speedMul: 1.06,
    skullDamage: 1,
    slowDuration: 0,
    slowFactor: 1,
    freezeDuration: 0,
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.58)',
    badgeText: '-3',
  },
  monster_fireball: {
    points: -4,
    category: 'negative',
    minStage: 2,
    weight: 18,
    speedMul: 1.16,
    skullDamage: 1,
    slowDuration: 0,
    slowFactor: 1,
    freezeDuration: 0,
    color: '#ea580c',
    glow: 'rgba(234, 88, 12, 0.65)',
    badgeText: '-4',
  },
  monster_venom: {
    points: -4,
    category: 'negative',
    minStage: 4,
    weight: 15,
    speedMul: 1.04,
    skullDamage: 1,
    slowDuration: 2.8,
    slowFactor: 0.45,
    freezeDuration: 0,
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.62)',
    badgeText: '-4',
  },
  monster_curse: {
    points: -5,
    category: 'negative',
    minStage: 7,
    weight: 12,
    speedMul: 1.08,
    skullDamage: 2,
    slowDuration: 0,
    slowFactor: 1,
    freezeDuration: 2.4,
    color: '#9333ea',
    glow: 'rgba(147, 51, 234, 0.72)',
    badgeText: '-5',
  },
  monster_hell_meteor: {
    points: -6,
    category: 'negative',
    minStage: 10,
    weight: 10,
    speedMul: 1.24,
    skullDamage: 2,
    slowDuration: 0,
    slowFactor: 1,
    freezeDuration: 0,
    color: '#b91c1c',
    glow: 'rgba(185, 28, 28, 0.75)',
    badgeText: '-6',
  },
};

export const VALID_MONSTER_KINDS: MonsterItemKind[] = Object.keys(
  MONSTER_ITEM_STATS
) as MonsterItemKind[];

export const MONSTER_INDEX_CATALOG: MonsterIndexEntry[] = [
  {
    kind: 'monster_ember',
    category: 'positive',
    minStage: 1,
    nameAr: 'جمرة الروح',
    nameEn: 'Soul Ember',
    valueAr: '+3 ضرر للوحش',
    valueEn: '+3 Boss DMG',
    benefitAr: 'تطلق شرارة صياد تضرب الوحش وتنقص 3 من طاقته.',
    benefitEn: 'Fires a hunter bolt that deals 3 damage to the Monster.',
  },
  {
    kind: 'monster_fang',
    category: 'positive',
    minStage: 1,
    nameAr: 'ناب الصياد',
    nameEn: 'Hunter Fang',
    valueAr: '+5 ضرر للوحش',
    valueEn: '+5 Boss DMG',
    benefitAr: 'ناب ذهبي حاد يوجه ضربة بقوة 5 ضد الوحش.',
    benefitEn: 'Golden hunter fang dealing 5 damage to the Monster.',
  },
  {
    kind: 'monster_rune',
    category: 'positive',
    minStage: 1,
    nameAr: 'رونة القوة',
    nameEn: 'Power Rune',
    valueAr: '+7 ضرر للوحش',
    valueEn: '+7 Boss DMG',
    benefitAr: 'حجر طاقة زمردي يطلق شعاعاً ينقص 7 من طاقة الوحش.',
    benefitEn: 'Emerald rune unleashing a 7-damage beam at the Monster.',
  },
  {
    kind: 'monster_crystal',
    category: 'positive',
    minStage: 1,
    nameAr: 'بلورة الدم',
    nameEn: 'Blood Crystal',
    valueAr: '+9 ضرر + فك البطء',
    valueEn: '+9 DMG + Cleanse',
    benefitAr: 'تضرب الوحش بـ 9 ضرر وتزيل فوراً أي بطء سام عنك.',
    benefitEn: 'Deals 9 damage to the Monster and immediately clears slow.',
  },
  {
    kind: 'monster_totem',
    category: 'positive',
    minStage: 1,
    nameAr: 'طوطم الوحش',
    nameEn: 'Beast Totem',
    valueAr: '+11 ضرر للوحش',
    valueEn: '+11 Boss DMG',
    benefitAr: 'طوطم أسطوري يوجه ضربة قوية بـ 11 ضرر ضد الوحش الأكبر.',
    benefitEn: 'Ancient totem dealing 11 heavy damage to the Monster.',
  },
  {
    kind: 'monster_dragon_heart',
    category: 'positive',
    minStage: 1,
    nameAr: 'قلب التنين',
    nameEn: 'Dragon Heart',
    valueAr: '+13 ضرر + درع 3.5ث',
    valueEn: '+13 DMG + 3.5s Shield',
    benefitAr: 'أقوى نقطة في عالم الوحوش! تضرب بـ 13 ضرر وتمنحك درع حماية 3.5 ثوانٍ.',
    benefitEn: 'Strongest Monster relic! Deals 13 damage and grants a 3.5s shield.',
  },
  {
    kind: 'monster_slime',
    category: 'negative',
    minStage: 1,
    nameAr: 'وحل سام',
    nameEn: 'Toxic Slime',
    valueAr: '-2 + بطء',
    valueEn: '-2 + Slow',
    benefitAr: 'يبطئ حركتك لثانيتين، تجنبه أثناء هجمات الوحش.',
    benefitEn: 'Slows your movement for 2.2s—dodge during barrages.',
  },
  {
    kind: 'monster_claw',
    category: 'negative',
    minStage: 1,
    nameAr: 'مخلب الظل',
    nameEn: 'Shadow Claw',
    valueAr: '-3 · -1 جمجمة',
    valueEn: '-3 · -1 Skull',
    benefitAr: 'ضربة مخلب حادة تخصم روح وحش واحدة.',
    benefitEn: 'Sharp claw strike that costs 1 Monster Skull.',
  },
  {
    kind: 'monster_fireball',
    category: 'negative',
    minStage: 2,
    nameAr: 'كرة الحمم',
    nameEn: 'Magma Fireball',
    valueAr: '-4 · -1 جمجمة · سريع',
    valueEn: '-4 · -1 Skull · Fast',
    benefitAr: 'كرة نار سريعة يقذفها الوحش، تخصم جمجمة واحدة.',
    benefitEn: 'Fast volcanic fireball hurled by the Monster (-1 Skull).',
  },
  {
    kind: 'monster_venom',
    category: 'negative',
    minStage: 4,
    nameAr: 'سم قاتل',
    nameEn: 'Deadly Venom',
    valueAr: '-4 · بطء شديد · -1 جمجمة',
    valueEn: '-4 · Heavy Slow · -1 Skull',
    benefitAr: 'سم أخضر يبطئك بشدة ويخصم روح وحش.',
    benefitEn: 'Toxic orb inflicting heavy slow and costing 1 Skull.',
  },
  {
    kind: 'monster_curse',
    category: 'negative',
    minStage: 7,
    nameAr: 'لعنة الهاوية',
    nameEn: 'Abyssal Curse',
    valueAr: '-5 · تجميد · -2 جمجمة',
    valueEn: '-5 · Freeze · -2 Skulls',
    benefitAr: 'لعنة بنفسجية تجمد حركتك لحظياً وتخصم جمجمتين!',
    benefitEn: 'Abyssal curse that briefly freezes you and costs 2 Skulls.',
  },
  {
    kind: 'monster_hell_meteor',
    category: 'negative',
    minStage: 10,
    nameAr: 'نيزك الجحيم',
    nameEn: 'Hellfire Meteor',
    valueAr: '-6 · -2 جمجمة · فائق السرعة',
    valueEn: '-6 · -2 Skulls · Blazing',
    benefitAr: 'أخطر قذائف الوحش الأكبر! سريع جداً ويخصم جمجمتين.',
    benefitEn: 'Deadliest Grand Monster projectile—blazing fast, costs 2 Skulls.',
  },
];

export function pickMonsterItemKind(
  stage: number,
  isHazard: boolean
): MonsterItemKind {
  const category: 'positive' | 'negative' = isHazard ? 'negative' : 'positive';
  const eligible = VALID_MONSTER_KINDS.filter((kind) => {
    const st = MONSTER_ITEM_STATS[kind];
    return st.category === category && st.minStage <= stage;
  });
  let totalWeight = 0;
  for (const kind of eligible) {
    totalWeight += MONSTER_ITEM_STATS[kind].weight;
  }
  let roll = Math.random() * totalWeight;
  for (const kind of eligible) {
    roll -= MONSTER_ITEM_STATS[kind].weight;
    if (roll <= 0) return kind;
  }
  return eligible[0] ?? (isHazard ? 'monster_claw' : 'monster_ember');
}

export function initMonsterBgMotifs(
  width: number,
  height: number
): MonsterBgMotif[] {
  const motifs: MonsterBgMotif[] = [];
  const count = 42;
  const types: MonsterBgMotif['motif'][] = [
    'ember',
    'ember',
    'ember',
    'ash_shard',
    'rune_ring',
    'fang_mark',
  ];
  const hues = ['#fb923c', '#f43f5e', '#fbbf24', '#a855f7', '#34d399'];
  for (let i = 0; i < count; i++) {
    const motif = types[i % types.length];
    motifs.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: motif === 'rune_ring' ? 14 + Math.random() * 14 : 3 + Math.random() * 6,
      speed: motif === 'ember' ? 18 + Math.random() * 34 : 8 + Math.random() * 16,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.9,
      alpha: motif === 'rune_ring' ? 0.12 + Math.random() * 0.12 : 0.35 + Math.random() * 0.5,
      flickerPhase: Math.random() * Math.PI * 2,
      flickerSpeed: 2 + Math.random() * 4,
      motif,
      hue: hues[i % hues.length],
    });
  }
  return motifs;
}

export function drawMonsterBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  motifs: MonsterBgMotif[],
  timeSec: number,
  isGrandMonster: boolean
): void {
  // Deep volcanic obsidian-crimson lair backdrop (totally distinct from Space)
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  if (isGrandMonster) {
    bg.addColorStop(0, '#1c050d');
    bg.addColorStop(0.45, '#2b0915');
    bg.addColorStop(0.8, '#3b1114');
    bg.addColorStop(1, '#4c160e');
  } else {
    bg.addColorStop(0, '#100816');
    bg.addColorStop(0.5, '#1d0d1f');
    bg.addColorStop(0.84, '#2a111a');
    bg.addColorStop(1, '#381515');
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Bottom lava horizon glow
  const lavaPulse = 0.5 + 0.5 * Math.sin(timeSec * 2.1);
  const lavaGlow = ctx.createRadialGradient(
    width * 0.5,
    height * 1.02,
    20,
    width * 0.5,
    height * 0.95,
    Math.max(width, height) * 0.62
  );
  lavaGlow.addColorStop(
    0,
    isGrandMonster
      ? `rgba(249, 115, 22, ${0.32 + lavaPulse * 0.12})`
      : `rgba(225, 29, 72, ${0.22 + lavaPulse * 0.08})`
  );
  lavaGlow.addColorStop(0.55, 'rgba(153, 27, 27, 0.08)');
  lavaGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = lavaGlow;
  ctx.fillRect(0, 0, width, height);

  // Subtle carved cavern arches / cracks on left & right edges
  ctx.save();
  ctx.strokeStyle = isGrandMonster
    ? 'rgba(251, 146, 60, 0.12)'
    : 'rgba(244, 63, 94, 0.09)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const yOff = (i + 0.5) * (height / 4);
    ctx.beginPath();
    ctx.moveTo(0, yOff);
    ctx.lineTo(28, yOff + 14);
    ctx.lineTo(14, yOff + 36);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width, yOff + 18);
    ctx.lineTo(width - 28, yOff + 32);
    ctx.lineTo(width - 14, yOff + 54);
    ctx.stroke();
  }
  ctx.restore();

  // Rising volcanic embers & glowing rune rings
  for (const m of motifs) {
    const flicker = 0.65 + 0.35 * Math.sin(timeSec * m.flickerSpeed + m.flickerPhase);
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.rotation);
    ctx.globalAlpha = m.alpha * flicker;

    if (m.motif === 'ember') {
      ctx.fillStyle = m.hue;
      ctx.shadowColor = m.hue;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, m.size * 0.55, 0, Math.PI * 2);
      ctx.fill();
    } else if (m.motif === 'rune_ring') {
      ctx.strokeStyle = m.hue;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, m.size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-m.size * 0.6, 0);
      ctx.lineTo(m.size * 0.6, 0);
      ctx.moveTo(0, -m.size * 0.6);
      ctx.lineTo(0, m.size * 0.6);
      ctx.stroke();
    } else if (m.motif === 'ash_shard') {
      ctx.fillStyle = 'rgba(255, 228, 214, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, -m.size);
      ctx.lineTo(m.size * 0.6, 0);
      ctx.lineTo(0, m.size);
      ctx.lineTo(-m.size * 0.6, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.strokeStyle = m.hue;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-m.size, -m.size * 0.5);
      ctx.lineTo(0, m.size * 0.9);
      ctx.lineTo(m.size, -m.size * 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawMonsterCanvasItem(
  ctx: CanvasRenderingContext2D,
  item: MonsterRenderItem
): void {
  const { kind, x, y, radius, rotation, pulsePhase } = item;
  const stat = MONSTER_ITEM_STATS[kind];
  const pulse = 1 + Math.sin(pulsePhase) * 0.06;
  const r = radius * pulse;

  ctx.save();
  ctx.translate(x, y);

  // Soft outer aura
  const aura = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.45);
  aura.addColorStop(0, stat.glow);
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.rotate(rotation);

  switch (kind) {
    case 'monster_ember': {
      // Glowing flame drop
      const grad = ctx.createRadialGradient(0, r * 0.15, r * 0.1, 0, 0, r);
      grad.addColorStop(0, '#fef9c3');
      grad.addColorStop(0.5, '#fb923c');
      grad.addColorStop(1, '#c2410c');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.05);
      ctx.bezierCurveTo(r * 0.95, -r * 0.1, r * 0.9, r * 0.95, 0, r * 0.95);
      ctx.bezierCurveTo(-r * 0.9, r * 0.95, -r * 0.95, -r * 0.1, 0, -r * 1.05);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffedd5';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      break;
    }

    case 'monster_fang': {
      // Curved golden hunter fang
      const grad = ctx.createLinearGradient(-r, -r, r, r);
      grad.addColorStop(0, '#fef9c3');
      grad.addColorStop(0.55, '#facc15');
      grad.addColorStop(1, '#b45309');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, -r * 0.9);
      ctx.quadraticCurveTo(r * 0.85, -r * 0.35, r * 0.55, r * 0.98);
      ctx.quadraticCurveTo(-r * 0.35, r * 0.25, -r * 0.72, -r * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      break;
    }

    case 'monster_rune': {
      // Emerald hex rune stone
      const grad = ctx.createLinearGradient(-r, -r, r, r);
      grad.addColorStop(0, '#a7f3d0');
      grad.addColorStop(0.5, '#10b981');
      grad.addColorStop(1, '#065f46');
      ctx.fillStyle = grad;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 6;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d1fae5';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Rune glyph inside
      ctx.strokeStyle = '#ecfdf5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.5);
      ctx.lineTo(0, r * 0.5);
      ctx.moveTo(-r * 0.35, -r * 0.15);
      ctx.lineTo(0, -r * 0.5);
      ctx.lineTo(r * 0.35, -r * 0.15);
      ctx.stroke();
      break;
    }

    case 'monster_crystal': {
      // Crimson faceted crystal
      const grad = ctx.createLinearGradient(0, -r, 0, r);
      grad.addColorStop(0, '#fecdd3');
      grad.addColorStop(0.45, '#f43f5e');
      grad.addColorStop(1, '#881337');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.08);
      ctx.lineTo(r * 0.78, -r * 0.2);
      ctx.lineTo(r * 0.52, r * 0.92);
      ctx.lineTo(0, r * 1.05);
      ctx.lineTo(-r * 0.52, r * 0.92);
      ctx.lineTo(-r * 0.78, -r * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffe4e6';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      break;
    }

    case 'monster_totem': {
      // Violet-gold beast mask totem
      const grad = ctx.createLinearGradient(-r, -r, r, r);
      grad.addColorStop(0, '#f3e8ff');
      grad.addColorStop(0.45, '#a855f7');
      grad.addColorStop(1, '#581c87');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.9);
      ctx.lineTo(0, -r * 0.55);
      ctx.lineTo(r * 0.7, -r * 0.9);
      ctx.lineTo(r * 0.85, r * 0.25);
      ctx.lineTo(0, r * 1.02);
      ctx.lineTo(-r * 0.85, r * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Totem glowing eyes
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(-r * 0.28, -r * 0.05, r * 0.14, 0, Math.PI * 2);
      ctx.arc(r * 0.28, -r * 0.05, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'monster_dragon_heart': {
      // Radiant golden-ruby dragon heart orb with crown wings
      const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r * 1.08);
      grad.addColorStop(0, '#fef9c3');
      grad.addColorStop(0.42, '#fbbf24');
      grad.addColorStop(0.75, '#f43f5e');
      grad.addColorStop(1, '#881337');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.98);
      ctx.bezierCurveTo(r * 1.15, r * 0.2, r * 1.05, -r * 0.95, 0, -r * 0.35);
      ctx.bezierCurveTo(-r * 1.05, -r * 0.95, -r * 1.15, r * 0.2, 0, r * 0.98);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      break;
    }

    case 'monster_slime': {
      // Bubbling toxic slime blob
      const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
      grad.addColorStop(0, '#d9f99d');
      grad.addColorStop(0.55, '#84cc16');
      grad.addColorStop(1, '#365314');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, r * 0.08, r * 0.88, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ecfccb';
      ctx.beginPath();
      ctx.arc(-r * 0.32, -r * 0.22, r * 0.2, 0, Math.PI * 2);
      ctx.arc(r * 0.24, -r * 0.1, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }

    case 'monster_claw': {
      // Three crimson slash marks inside dark spiked badge
      ctx.fillStyle = '#2a0a12';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (const offset of [-r * 0.34, 0, r * 0.34]) {
        ctx.beginPath();
        ctx.moveTo(offset - r * 0.22, -r * 0.52);
        ctx.lineTo(offset + r * 0.22, r * 0.52);
        ctx.stroke();
      }
      break;
    }

    case 'monster_fireball': {
      // Blazing magma core with jagged corona
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      const spikes = 10;
      for (let i = 0; i < spikes * 2; i++) {
        const a = (i * Math.PI) / spikes;
        const rad = i % 2 === 0 ? r * 1.08 : r * 0.68;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      const core = ctx.createRadialGradient(0, 0, r * 0.08, 0, 0, r * 0.68);
      core.addColorStop(0, '#fef9c3');
      core.addColorStop(0.6, '#f97316');
      core.addColorStop(1, '#9a3412');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'monster_venom': {
      // Toxic emerald skull-orb
      const grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
      grad.addColorStop(0, '#6ee7b7');
      grad.addColorStop(0.55, '#059669');
      grad.addColorStop(1, '#022c22');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Angry toxic eyes
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, -r * 0.22);
      ctx.lineTo(-r * 0.1, -r * 0.05);
      ctx.lineTo(-r * 0.4, r * 0.12);
      ctx.closePath();
      ctx.moveTo(r * 0.45, -r * 0.22);
      ctx.lineTo(r * 0.1, -r * 0.05);
      ctx.lineTo(r * 0.4, r * 0.12);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'monster_curse': {
      // Abyssal cursed eye vortex
      const grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 1.05);
      grad.addColorStop(0, '#f5d0fe');
      grad.addColorStop(0.45, '#9333ea');
      grad.addColorStop(1, '#2e1065');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      // Slit eye
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.56, r * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.14, r * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'monster_hell_meteor': {
      // Cracked volcanic meteor boulder with red-gold magma veins
      ctx.fillStyle = '#1c0a0a';
      ctx.beginPath();
      const verts = 9;
      for (let i = 0; i < verts; i++) {
        const a = (i * Math.PI * 2) / verts;
        const jitter = i % 2 === 0 ? 1.05 : 0.84;
        const px = Math.cos(a) * r * jitter;
        const py = Math.sin(a) * r * jitter;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.6;
      ctx.stroke();

      // Magma crack X
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, -r * 0.35);
      ctx.lineTo(r * 0.45, r * 0.35);
      ctx.moveTo(r * 0.4, -r * 0.42);
      ctx.lineTo(-r * 0.35, r * 0.42);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();

  // Crisp readable value pill below/over item
  ctx.font = '800 11px "Cairo", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(12, 6, 16, 0.82)';
  const bw = stat.badgeText.length >= 3 ? 30 : 24;
  ctx.beginPath();
  ctx.roundRect(-bw / 2, r * 0.42, bw, 15, 7);
  ctx.fill();
  ctx.fillStyle = stat.category === 'positive' ? '#fef08a' : '#fca5a5';
  ctx.fillText(stat.badgeText, 0, r * 0.42 + 8);

  ctx.restore();
}

export function drawMonsterHunterCatcher(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  timeSec: number,
  isSlowed: boolean,
  isFrozen: boolean
): void {
  const halfW = width / 2;
  const halfH = height / 2;
  const pulse = 0.65 + 0.35 * Math.sin(timeSec * 6.5);

  ctx.save();
  ctx.translate(x, y);

  // Under-glow
  const underGlow = ctx.createRadialGradient(0, halfH * 0.4, 4, 0, halfH * 0.4, halfW * 1.05);
  underGlow.addColorStop(
    0,
    isFrozen
      ? 'rgba(168, 85, 247, 0.55)'
      : isSlowed
      ? 'rgba(132, 204, 22, 0.55)'
      : `rgba(244, 63, 94, ${0.42 + pulse * 0.16})`
  );
  underGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = underGlow;
  ctx.beginPath();
  ctx.ellipse(0, halfH * 0.4, halfW * 1.05, halfH * 1.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Obsidian-crimson hunter cradle hull with horned side guards
  const hullGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
  if (isFrozen) {
    hullGrad.addColorStop(0, '#c084fc');
    hullGrad.addColorStop(1, '#4c1d95');
  } else if (isSlowed) {
    hullGrad.addColorStop(0, '#a3e635');
    hullGrad.addColorStop(1, '#365314');
  } else {
    hullGrad.addColorStop(0, '#3f1d2e');
    hullGrad.addColorStop(0.5, '#1f1021');
    hullGrad.addColorStop(1, '#0f0712');
  }

  ctx.fillStyle = hullGrad;
  ctx.beginPath();
  ctx.moveTo(-halfW, -halfH * 0.8);
  ctx.lineTo(-halfW * 0.76, -halfH * 0.2);
  ctx.lineTo(halfW * 0.76, -halfH * 0.2);
  ctx.lineTo(halfW, -halfH * 0.8);
  ctx.lineTo(halfW * 0.86, halfH * 0.85);
  ctx.lineTo(0, halfH * 1.15);
  ctx.lineTo(-halfW * 0.86, halfH * 0.85);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = isFrozen ? '#e9d5ff' : isSlowed ? '#d9f99d' : '#fb7185';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Glowing hunter energy rim along top catching cradle
  const rimGrad = ctx.createLinearGradient(-halfW * 0.75, 0, halfW * 0.75, 0);
  rimGrad.addColorStop(0, '#fb923c');
  rimGrad.addColorStop(0.5, '#fef08a');
  rimGrad.addColorStop(1, '#fb923c');
  ctx.strokeStyle = rimGrad;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-halfW * 0.74, -halfH * 0.2);
  ctx.lineTo(halfW * 0.74, -halfH * 0.2);
  ctx.stroke();

  // Center core gem (where counter-bolts fire from)
  ctx.fillStyle = isFrozen ? '#f3e8ff' : '#fde047';
  ctx.shadowColor = '#f43f5e';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(0, -halfH * 0.52);
  ctx.lineTo(8, 2);
  ctx.lineTo(0, halfH * 0.58);
  ctx.lineTo(-8, 2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function drawMonsterBoss(
  ctx: CanvasRenderingContext2D,
  boss: MonsterBossRuntime,
  arenaWidth: number,
  timeSec: number,
  lang: 'ar' | 'en'
): void {
  const { config } = boss;
  const isGrand = config.isGrandMonster;
  const x = boss.x;
  const bob = Math.sin(timeSec * (isGrand ? 3.2 : 2.6) + boss.pulsePhase) * (isGrand ? 6 : 4);
  const y = boss.y + bob + boss.recoilY;
  const isEnraged = boss.enraged;
  const isTelegraphing = boss.telegraphTimer > 0;
  const scale = isGrand ? 1.24 : 0.96;

  ctx.save();
  ctx.translate(x, y);

  // Outer monstrous aura
  const auraR = isGrand ? 96 : 68;
  const aura = ctx.createRadialGradient(0, 0, 12, 0, 0, auraR);
  aura.addColorStop(
    0,
    boss.hitFlash > 0
      ? 'rgba(255, 255, 255, 0.85)'
      : isTelegraphing
      ? 'rgba(253, 224, 71, 0.65)'
      : config.glowColor
  );
  aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, auraR, 0, Math.PI * 2);
  ctx.fill();

  // Telegraph attack roar ring
  if (isTelegraphing) {
    const ringPulse = 1 - Math.min(1, boss.telegraphTimer / 0.62);
    ctx.strokeStyle = isGrand ? '#fde047' : '#fb923c';
    ctx.lineWidth = isGrand ? 3.5 : 2.6;
    ctx.globalAlpha = 0.85 - ringPulse * 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, (isGrand ? 56 : 42) + ringPulse * 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.scale(scale, scale);

  // Bat/Dragon Wings (Grand Monsters + Bone Wyvern + Abyssal Fiend)
  const wingFlap = Math.sin(timeSec * (isEnraged ? 9.5 : 6.2)) * 0.22;
  if (
    isGrand ||
    config.species === 'bone_wyvern' ||
    config.species === 'abyssal_fiend'
  ) {
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.scale(dir, 1);
      ctx.rotate(wingFlap);
      const wingGrad = ctx.createLinearGradient(18, -26, 74, 16);
      wingGrad.addColorStop(0, config.primaryColor);
      wingGrad.addColorStop(1, '#18060e');
      ctx.fillStyle = boss.hitFlash > 0 ? '#ffffff' : wingGrad;
      ctx.beginPath();
      ctx.moveTo(20, -6);
      ctx.quadraticCurveTo(46, -34, 72, -18);
      ctx.quadraticCurveTo(58, -2, 64, 14);
      ctx.quadraticCurveTo(46, 8, 42, 20);
      ctx.quadraticCurveTo(30, 8, 22, 12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = config.secondaryColor;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }
  } else {
    // Organic flailing tendrils/arms for regular imp/venom/cyclops monsters
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.scale(dir, 1);
      const sway = Math.sin(timeSec * 5.2 + dir) * 6;
      ctx.strokeStyle = boss.hitFlash > 0 ? '#ffffff' : config.primaryColor;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(26, 4);
      ctx.quadraticCurveTo(46, -4 + sway, 52, 16 + sway * 0.5);
      ctx.stroke();
      // Claw tip
      ctx.fillStyle = config.secondaryColor;
      ctx.beginPath();
      ctx.arc(52, 16 + sway * 0.5, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Curved Horns (twin horns, plus central crown horn on Grand Monsters)
  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.scale(dir, 1);
    ctx.fillStyle = boss.hitFlash > 0 ? '#ffffff' : '#fef3c7';
    ctx.beginPath();
    ctx.moveTo(14, -22);
    ctx.quadraticCurveTo(30, -44, 42, -32);
    ctx.quadraticCurveTo(30, -28, 24, -14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = config.secondaryColor;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }
  if (isGrand) {
    // Flaming Grand Crown spikes on top
    ctx.fillStyle = boss.hitFlash > 0 ? '#ffffff' : '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-14, -26);
    ctx.lineTo(-8, -44);
    ctx.lineTo(0, -34);
    ctx.lineTo(8, -48);
    ctx.lineTo(14, -26);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // Main organic monster head/body
  const bodyGrad = ctx.createRadialGradient(-8, -10, 6, 0, 2, 38);
  if (boss.hitFlash > 0) {
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(1, '#fecdd3');
  } else {
    bodyGrad.addColorStop(0, config.secondaryColor);
    bodyGrad.addColorStop(0.5, config.primaryColor);
    bodyGrad.addColorStop(1, '#1a060f');
  }
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.bezierCurveTo(28, -30, 38, -8, 33, 14);
  ctx.bezierCurveTo(28, 30, 12, 34, 0, 32);
  ctx.bezierCurveTo(-12, 34, -28, 30, -33, 14);
  ctx.bezierCurveTo(-38, -8, -28, -30, 0, -30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = isEnraged ? '#fef08a' : config.secondaryColor;
  ctx.lineWidth = isGrand ? 2.8 : 2.1;
  ctx.stroke();

  // Eyes (Cyclops has 1 giant glowing eye, Venom Hydra has 3 eyes, others have 2 fierce eyes)
  ctx.shadowColor = config.eyeColor;
  ctx.shadowBlur = 10;
  if (config.species === 'shadow_cyclops') {
    ctx.fillStyle = config.eyeColor;
    ctx.beginPath();
    ctx.ellipse(0, -4, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.ellipse(0, -4, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    for (const dir of [-1, 1]) {
      ctx.fillStyle = config.eyeColor;
      ctx.beginPath();
      ctx.moveTo(dir * 6, -4);
      ctx.lineTo(dir * 20, -12);
      ctx.lineTo(dir * 16, 1);
      ctx.closePath();
      ctx.fill();
    }
    if (config.species === 'venom_beast' || config.species === 'grand_hydra' || isGrand) {
      // Third forehead eye
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(0, -15, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;

  // Jagged fanged jaw (opens wider when telegraphing!)
  const jawOpen = isTelegraphing ? 12 : 7 + Math.sin(timeSec * 5) * 1.5;
  ctx.fillStyle = '#16040a';
  ctx.beginPath();
  ctx.ellipse(0, 14, 18, jawOpen, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sharp white fangs
  ctx.fillStyle = '#fffbeb';
  const fangXs = [-12, -5, 5, 12];
  for (const fx of fangXs) {
    ctx.beginPath();
    ctx.moveTo(fx - 2.6, 14 - jawOpen * 0.72);
    ctx.lineTo(fx, 14 + jawOpen * 0.15);
    ctx.lineTo(fx + 2.6, 14 - jawOpen * 0.72);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  // Top Monster HP Bar
  const barW = Math.min(arenaWidth - 36, isGrand ? 360 : 300);
  const barH = isGrand ? 16 : 13;
  const barX = (arenaWidth - barW) / 2;
  const barY = 14;
  const hpRatio = Math.max(0, Math.min(1, boss.hp / boss.maxHp));

  ctx.save();
  // Label above bar
  const bossName = lang === 'ar' ? config.nameAr : config.nameEn;
  const prefix = isGrand
    ? lang === 'ar'
      ? '🔥 الوحش الأكبر · '
      : '🔥 GRAND MONSTER · '
    : lang === 'ar'
    ? '👹 وحش · '
    : '👹 MONSTER · ';
  ctx.font = `800 ${isGrand ? 13 : 12}px "Cairo", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = isGrand ? '#fef08a' : '#fecdd3';
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 6;
  ctx.fillText(
    `${prefix}${bossName} (${Math.ceil(boss.hp)}/${boss.maxHp})`,
    arenaWidth / 2,
    barY + barH + 17
  );
  ctx.shadowBlur = 0;

  // Bar frame
  ctx.fillStyle = 'rgba(18, 6, 14, 0.84)';
  ctx.beginPath();
  ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 10);
  ctx.fill();

  // HP Fill
  if (hpRatio > 0) {
    const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    if (isGrand) {
      hpGrad.addColorStop(0, '#f59e0b');
      hpGrad.addColorStop(0.5, '#ef4444');
      hpGrad.addColorStop(1, '#be123c');
    } else {
      hpGrad.addColorStop(0, config.secondaryColor);
      hpGrad.addColorStop(1, config.primaryColor);
    }
    ctx.fillStyle = hpGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * hpRatio, barH, 8);
    ctx.fill();
  }

  ctx.strokeStyle = isGrand ? 'rgba(253, 224, 71, 0.78)' : 'rgba(251, 113, 133, 0.65)';
  ctx.lineWidth = isGrand ? 2 : 1.5;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 8);
  ctx.stroke();

  ctx.restore();
}

export const MonsterSkullIcon: React.FC<{
  filled?: boolean;
  className?: string;
}> = ({ filled = true, className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M5 4L8 7.5C9.2 6.8 10.6 6.5 12 6.5C13.4 6.5 14.8 6.8 16 7.5L19 4L18.5 9.2C19.5 10.4 20 11.9 20 13.5C20 17.2 17 20 12 20C7 20 4 17.2 4 13.5C4 11.9 4.5 10.4 5.5 9.2L5 4Z"
      fill={filled ? '#f43f5e' : 'rgba(148,163,184,0.22)'}
      stroke={filled ? '#fda4af' : 'rgba(148,163,184,0.45)'}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <circle
      cx="9.2"
      cy="13"
      r="1.5"
      fill={filled ? '#fef08a' : 'rgba(148,163,184,0.4)'}
    />
    <circle
      cx="14.8"
      cy="13"
      r="1.5"
      fill={filled ? '#fef08a' : 'rgba(148,163,184,0.4)'}
    />
    <path
      d="M9.5 16.8L10.8 15.8L12 16.8L13.2 15.8L14.5 16.8"
      stroke={filled ? '#fff1f2' : 'rgba(148,163,184,0.4)'}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const MonsterIndexIcon: React.FC<{
  kind: MonsterItemKind;
  className?: string;
}> = ({ kind, className = 'w-10 h-10' }) => {
  const stat = MONSTER_ITEM_STATS[kind];
  const isPos = stat.category === 'positive';
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`mg-${kind}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="45%" stopColor={stat.color} />
          <stop offset="100%" stopColor="#1c0914" />
        </radialGradient>
      </defs>
      <circle
        cx="20"
        cy="20"
        r="17"
        fill={isPos ? 'rgba(244,63,94,0.16)' : 'rgba(127,29,29,0.28)'}
        stroke={stat.color}
        strokeWidth="1.8"
      />
      {kind === 'monster_ember' && (
        <path
          d="M20 7C26 14 27 25 20 31C13 25 14 14 20 7Z"
          fill={`url(#mg-${kind})`}
          stroke="#ffedd5"
          strokeWidth="1.4"
        />
      )}
      {kind === 'monster_fang' && (
        <path
          d="M14 9C24 13 27 21 25 31C18 25 14 18 12 13Z"
          fill={`url(#mg-${kind})`}
          stroke="#fef9c3"
          strokeWidth="1.4"
        />
      )}
      {kind === 'monster_rune' && (
        <polygon
          points="20,7 31,13.5 31,26.5 20,33 9,26.5 9,13.5"
          fill={`url(#mg-${kind})`}
          stroke="#d1fae5"
          strokeWidth="1.5"
        />
      )}
      {kind === 'monster_crystal' && (
        <polygon
          points="20,6 29,17 25,33 15,33 11,17"
          fill={`url(#mg-${kind})`}
          stroke="#ffe4e6"
          strokeWidth="1.5"
        />
      )}
      {kind === 'monster_totem' && (
        <>
          <polygon
            points="11,9 20,14 29,9 31,23 20,33 9,23"
            fill={`url(#mg-${kind})`}
            stroke="#fde047"
            strokeWidth="1.5"
          />
          <circle cx="16" cy="20" r="2" fill="#fde047" />
          <circle cx="24" cy="20" r="2" fill="#fde047" />
        </>
      )}
      {kind === 'monster_dragon_heart' && (
        <path
          d="M20 32C10 24 9 12 16 11C18.5 10.6 20 13 20 15C20 13 21.5 10.6 24 11C31 12 30 24 20 32Z"
          fill={`url(#mg-${kind})`}
          stroke="#fef08a"
          strokeWidth="1.6"
        />
      )}
      {kind === 'monster_slime' && (
        <>
          <circle cx="20" cy="21" r="11" fill={`url(#mg-${kind})`} />
          <circle cx="16" cy="17" r="2.6" fill="#ecfccb" />
          <circle cx="23" cy="19" r="1.7" fill="#ecfccb" />
        </>
      )}
      {kind === 'monster_claw' && (
        <g stroke="#fca5a5" strokeWidth="2.8" strokeLinecap="round">
          <line x1="12" y1="12" x2="17" y2="28" />
          <line x1="18" y1="11" x2="23" y2="29" />
          <line x1="24" y1="12" x2="29" y2="28" />
        </g>
      )}
      {kind === 'monster_fireball' && (
        <>
          <polygon
            points="20,6 24,13 32,12 27,19 33,26 24,26 20,34 16,26 7,26 13,19 8,12 16,13"
            fill="#ea580c"
          />
          <circle cx="20" cy="20" r="7" fill="#fef08a" />
        </>
      )}
      {kind === 'monster_venom' && (
        <>
          <circle cx="20" cy="20" r="11" fill={`url(#mg-${kind})`} />
          <polygon points="13,17 18,19 14,22" fill="#fef08a" />
          <polygon points="27,17 22,19 26,22" fill="#fef08a" />
        </>
      )}
      {kind === 'monster_curse' && (
        <>
          <circle cx="20" cy="20" r="11" fill={`url(#mg-${kind})`} />
          <ellipse cx="20" cy="20" rx="7" ry="3.8" fill="#fde047" />
          <ellipse cx="20" cy="20" rx="2" ry="3.5" fill="#1e1b4b" />
        </>
      )}
      {kind === 'monster_hell_meteor' && (
        <>
          <polygon
            points="20,8 30,13 32,23 24,32 14,31 9,22 12,12"
            fill="#1c0a0a"
            stroke="#ef4444"
            strokeWidth="2.2"
          />
          <line x1="14" y1="15" x2="26" y2="25" stroke="#fbbf24" strokeWidth="2" />
          <line x1="25" y1="14" x2="15" y2="26" stroke="#fbbf24" strokeWidth="2" />
        </>
      )}
    </svg>
  );
};
