import { PlantMergeAudio } from './audio';
import {
  clampPlantTier,
  clearSavedGarden,
  COL_X,
  FARM_GATE_X,
  GRID_COLS,
  GRID_ROWS,
  LANE_Z,
  MAX_FARM_HP,
  MEGA_BOSS_INTERVAL_SEC,
  MONSTER_SPAWN_X,
  MONSTER_SPECS,
  MonsterEntity,
  MonsterKind,
  ParticleBurst,
  PLANT_SPECS,
  PlantEntity,
  PlantMergeHudSnapshot,
  PlantMergeSavedGarden,
  PlantMergeStatus,
  PlantTier,
  ProjectileEntity,
  readPlantMergeIndex,
  readPlantMergeStats,
  readSavedGarden,
  SavedPlantSlot,
  saveGardenState,
  savePlantMergeIndex,
  savePlantMergeStats,
} from './types';

export interface PlantMergeWorld {
  lang: 'ar' | 'en';
  status: PlantMergeStatus;
  wave: number;
  coins: number;
  lastCoinReward: number;
  lastCoinRewardTimer: number;
  score: number;
  bestScore: number;
  bestWave: number;
  highestTier: PlantTier;
  farmHp: number;
  maxFarmHp: number;
  selectedShopTier: PlantTier;
  powerLevel: number; // global plant damage & HP upgrade level (1..12)
  waterBoostTimer: number;
  selectedPlot: { row: number; col: number } | null;
  speedMul: 1 | 2;
  bannerText: string;
  bannerTone: 'info' | 'boss' | 'merge' | 'warn';
  bannerTimer: number;
  shakeTimer: number;
  shakeIntensity: number;
  houseBiteShake: number;
  houseEatTimer: number;
  houseEatProgress: number;
  houseDebrisTimer: number;
  megaBossTimer: number;
  megaBossCount: number;
  plants: PlantEntity[];
  monsters: MonsterEntity[];
  projectiles: ProjectileEntity[];
  particles: ParticleBurst[];
  nextId: number;
  waveSpawnQueue: MonsterKind[];
  waveTotalMonsters: number;
  waveDefeatedInWave: number;
  spawnTimer: number;
  waveRestTimer: number;
  passiveCoinCarry: number;
  autoSaveTimer: number;
  poisonParticleTimer: number;
  monstersDefeated: number;
  hasSavedGarden: boolean;
  savedWave: number;
  savedPlantCount: number;
  discoveredPlants: PlantTier[];
  defeatedMonsters: Partial<Record<MonsterKind, number>>;
  elapsed: number;
  version: number;
}

export const MAX_POWER_LEVEL = 12;
export const HOUSE_EAT_DURATION = 2.5;
export const WATER_BOOST_COST = 50;
export const WATER_BOOST_DURATION = 7.5;

const STRONG_SUMMON_POOL: readonly MonsterKind[] = [
  'troll',
  'orc',
  'darkKnight',
  'golem',
  'scorpion',
  'magma',
  'iceYeti',
  'dragon',
];

export function getPowerUpgradeCost(powerLevel: number): number {
  if (powerLevel >= MAX_POWER_LEVEL) return 0;
  return 70 + (powerLevel - 1) * 65;
}

export function getPlantSellValue(tier: PlantTier): number {
  return Math.max(10, Math.floor(PLANT_SPECS[tier].cost * 0.5));
}

function pickWeighted<T>(items: Array<[T, number]>): T {
  let total = 0;
  for (const [, w] of items) total += w;
  let r = Math.random() * total;
  for (const [val, w] of items) {
    r -= w;
    if (r <= 0) return val;
  }
  return items[items.length - 1][0];
}

function buildWaveQueue(wave: number): MonsterKind[] {
  const queue: MonsterKind[] = [];
  const count = Math.min(30, 5 + Math.floor(wave * 2.0));

  for (let i = 0; i < count; i++) {
    if (wave === 1) {
      queue.push(
        pickWeighted<MonsterKind>([
          ['slime', 48],
          ['skeleton', 32],
          ['spider', 20],
        ])
      );
    } else if (wave === 2) {
      queue.push(
        pickWeighted<MonsterKind>([
          ['slime', 18],
          ['skeleton', 16],
          ['spider', 14],
          ['goblin', 14],
          ['beetle', 16],
          ['wasp', 14],
          ['mushroom', 8],
        ])
      );
    } else if (wave === 3) {
      queue.push(
        pickWeighted<MonsterKind>([
          ['skeleton', 12],
          ['spider', 11],
          ['goblin', 12],
          ['beetle', 14],
          ['wasp', 13],
          ['mummy', 16],
          ['mushroom', 8],
          ['wolf', 8],
          ['bat', 6],
        ])
      );
    } else if (wave === 4) {
      queue.push(
        pickWeighted<MonsterKind>([
          ['beetle', 10],
          ['wasp', 10],
          ['mummy', 12],
          ['troll', 16],
          ['darkKnight', 12],
          ['wolf', 10],
          ['bat', 8],
          ['orc', 10],
          ['ghost', 8],
          ['golem', 4],
        ])
      );
    } else if (wave === 5) {
      queue.push(
        pickWeighted<MonsterKind>([
          ['beetle', 9],
          ['wasp', 10],
          ['mummy', 11],
          ['troll', 14],
          ['darkKnight', 16],
          ['orc', 10],
          ['ghost', 9],
          ['golem', 8],
          ['scorpion', 7],
          ['magma', 6],
        ])
      );
    } else if (wave === 6) {
      queue.push(
        pickWeighted<MonsterKind>([
          ['beetle', 7],
          ['wasp', 7],
          ['mummy', 8],
          ['troll', 10],
          ['darkKnight', 11],
          ['wolf', 8],
          ['bat', 7],
          ['orc', 10],
          ['ghost', 8],
          ['golem', 8],
          ['scorpion', 9],
          ['magma', 7],
        ])
      );
    } else {
      queue.push(
        pickWeighted<MonsterKind>([
          ['slime', 3],
          ['skeleton', 4],
          ['spider', 4],
          ['goblin', 4],
          ['beetle', 5],
          ['wasp', 5],
          ['mushroom', 5],
          ['mummy', 6],
          ['wolf', 6],
          ['bat', 5],
          ['troll', 7],
          ['orc', 7],
          ['ghost', 6],
          ['darkKnight', 8],
          ['golem', 6],
          ['scorpion', 6],
          ['magma', 6],
          ['iceYeti', 6],
          ['dragon', wave >= 8 ? 6 : 4],
        ])
      );
    }
  }

  // Guarantee the 5 new monsters appear cleanly across Waves 2 to 5
  if (wave === 2 && queue.length >= 2) {
    queue[1] = 'beetle';
    queue[Math.min(queue.length - 1, 3)] = 'wasp';
  } else if (wave === 3 && queue.length >= 3) {
    queue[1] = 'mummy';
    queue[Math.min(queue.length - 1, 3)] = 'wasp';
    queue[Math.min(queue.length - 1, 5)] = 'beetle';
  } else if (wave === 4 && queue.length >= 3) {
    queue[1] = 'troll';
    queue[Math.min(queue.length - 1, 3)] = 'mummy';
    queue[Math.min(queue.length - 1, 5)] = 'darkKnight';
  } else if (wave === 5 && queue.length >= 4) {
    queue[1] = 'darkKnight';
    queue[Math.min(queue.length - 1, 3)] = 'troll';
    queue[Math.min(queue.length - 1, 5)] = 'wasp';
  }

  if (wave % 5 === 0) {
    queue.push('boss');
  }
  return queue;
}

function serializePlants(plants: PlantEntity[]): SavedPlantSlot[] {
  return plants.map((p) => ({
    row: p.row,
    col: p.col,
    tier: p.tier,
    hpRatio: p.maxHp > 0 ? Math.max(0.15, Math.min(1, p.hp / p.maxHp)) : 1,
  }));
}

function hydratePlants(
  world: PlantMergeWorld,
  slots: SavedPlantSlot[],
  fullHeal = false
): void {
  world.plants = [];
  const powerMul = 1 + (world.powerLevel - 1) * 0.16;
  for (const s of slots) {
    const tier = clampPlantTier(s.tier);
    const spec = PLANT_SPECS[tier];
    const maxHp = Math.round(spec.maxHp * powerMul);
    const hp = fullHeal
      ? maxHp
      : Math.max(1, Math.round(maxHp * Math.min(1, Math.max(0.15, s.hpRatio))));
    world.plants.push({
      id: world.nextId++,
      row: s.row,
      col: s.col,
      tier,
      hp,
      maxHp,
      fireCooldown: 0.35 + Math.random() * 0.35,
      recoil: 0,
      spawnAnim: 1,
      hitFlash: 0,
    });
  }
}

function getStarterSlots(): SavedPlantSlot[] {
  return [
    { row: 1, col: 0, tier: 1, hpRatio: 1 },
    { row: 0, col: 0, tier: 1, hpRatio: 1 },
    { row: 2, col: 0, tier: 1, hpRatio: 1 },
  ];
}

function recordDiscoveredPlant(world: PlantMergeWorld, tier: PlantTier): void {
  if (!world.discoveredPlants.includes(tier)) {
    world.discoveredPlants = [...world.discoveredPlants, tier].sort((a, b) => a - b);
    savePlantMergeIndex({
      discoveredPlants: world.discoveredPlants,
      defeatedMonsters: world.defeatedMonsters,
    });
  }
}

function recordDefeatedMonster(world: PlantMergeWorld, kind: MonsterKind): void {
  world.defeatedMonsters = {
    ...world.defeatedMonsters,
    [kind]: (world.defeatedMonsters[kind] ?? 0) + 1,
  };
  savePlantMergeIndex({
    discoveredPlants: world.discoveredPlants,
    defeatedMonsters: world.defeatedMonsters,
  });
}

export function savePlantMergeWorldNow(world: PlantMergeWorld): void {
  if (
    world.status === 'EATING_HOUSE' ||
    world.status === 'GAME_OVER' ||
    world.farmHp <= 0
  ) {
    return;
  }

  const plantsToSave =
    world.plants.length > 0 ? serializePlants(world.plants) : getStarterSlots();

  const snapshot: PlantMergeSavedGarden = {
    wave: Math.max(1, world.wave),
    coins: Math.max(0, Math.floor(world.coins)),
    score: Math.max(0, Math.floor(world.score)),
    farmHp: Math.max(1, Math.min(MAX_FARM_HP, world.farmHp)),
    powerLevel: world.powerLevel,
    selectedShopTier: world.selectedShopTier,
    speedMul: world.speedMul,
    monstersDefeated: world.monstersDefeated,
    megaBossTimer: Math.max(1, Math.min(MEGA_BOSS_INTERVAL_SEC, world.megaBossTimer)),
    megaBossCount: world.megaBossCount,
    plants: plantsToSave,
    savedAt: Date.now(),
  };

  saveGardenState(snapshot);
  world.hasSavedGarden = true;
  world.savedWave = snapshot.wave;
  world.savedPlantCount = snapshot.plants.length;
}

export function createInitialPlantMergeWorld(lang: 'ar' | 'en'): PlantMergeWorld {
  const stats = readPlantMergeStats();
  const saved = readSavedGarden();
  const idx = readPlantMergeIndex();

  const world: PlantMergeWorld = {
    lang,
    status: 'START',
    wave: saved ? saved.wave : 1,
    coins: saved ? saved.coins : 100,
    lastCoinReward: 0,
    lastCoinRewardTimer: 0,
    score: saved ? saved.score : 0,
    bestScore: stats.bestScore,
    bestWave: stats.bestWave,
    highestTier: stats.highestTier,
    farmHp: saved ? Math.max(1, saved.farmHp) : MAX_FARM_HP,
    maxFarmHp: MAX_FARM_HP,
    selectedShopTier: saved ? saved.selectedShopTier : 1,
    powerLevel: saved ? saved.powerLevel : 1,
    waterBoostTimer: 0,
    selectedPlot: null,
    speedMul: saved ? saved.speedMul : 1,
    bannerText: '',
    bannerTone: 'info',
    bannerTimer: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
    houseBiteShake: 0,
    houseEatTimer: 0,
    houseEatProgress: 0,
    houseDebrisTimer: 0,
    megaBossTimer: saved ? saved.megaBossTimer : MEGA_BOSS_INTERVAL_SEC,
    megaBossCount: saved ? saved.megaBossCount : 0,
    plants: [],
    monsters: [],
    projectiles: [],
    particles: [],
    nextId: 1,
    waveSpawnQueue: [],
    waveTotalMonsters: 0,
    waveDefeatedInWave: 0,
    spawnTimer: 1.0,
    waveRestTimer: 0,
    passiveCoinCarry: 0,
    autoSaveTimer: 3.0,
    poisonParticleTimer: 0.25,
    monstersDefeated: saved ? saved.monstersDefeated : 0,
    hasSavedGarden: Boolean(saved && saved.plants.length > 0),
    savedWave: saved ? saved.wave : 1,
    savedPlantCount: saved ? saved.plants.length : 0,
    discoveredPlants: idx.discoveredPlants,
    defeatedMonsters: idx.defeatedMonsters,
    elapsed: 0,
    version: 1,
  };

  if (saved && saved.plants.length > 0) {
    hydratePlants(world, saved.plants, false);
    for (const p of world.plants) {
      recordDiscoveredPlant(world, p.tier);
    }
  } else {
    hydratePlants(world, getStarterSlots(), true);
  }

  return world;
}

export function resumeSavedPlantMergeRun(
  world: PlantMergeWorld,
  audio: PlantMergeAudio
): void {
  const saved = readSavedGarden();
  if (!saved || saved.plants.length === 0) {
    startNewPlantMergeRun(world, audio);
    return;
  }

  world.wave = saved.wave;
  world.coins = Math.max(saved.coins, 50);
  world.lastCoinReward = 0;
  world.lastCoinRewardTimer = 0;
  world.score = saved.score;
  world.powerLevel = saved.powerLevel;
  world.selectedShopTier = saved.selectedShopTier;
  world.speedMul = saved.speedMul;
  world.monstersDefeated = saved.monstersDefeated;
  world.farmHp = Math.max(1, Math.min(MAX_FARM_HP, saved.farmHp));
  world.megaBossTimer = saved.megaBossTimer;
  world.megaBossCount = saved.megaBossCount;
  hydratePlants(world, saved.plants, false);

  world.status = 'PLAYING';
  world.waterBoostTimer = 0;
  world.selectedPlot = null;
  world.monsters = [];
  world.projectiles = [];
  world.particles = [];
  world.passiveCoinCarry = 0;
  world.shakeTimer = 0;
  world.houseBiteShake = 0;
  world.houseEatTimer = 0;
  world.houseEatProgress = 0;
  startWave(world, world.wave, audio);
  savePlantMergeWorldNow(world);
  world.version++;
}

export function startNewPlantMergeRun(
  world: PlantMergeWorld,
  audio: PlantMergeAudio
): void {
  world.status = 'PLAYING';
  world.wave = 1;
  world.coins = 100;
  world.lastCoinReward = 0;
  world.lastCoinRewardTimer = 0;
  world.score = 0;
  world.farmHp = MAX_FARM_HP;
  world.selectedShopTier = 1;
  world.powerLevel = 1;
  world.waterBoostTimer = 0;
  world.selectedPlot = null;
  world.speedMul = 1;
  world.monsters = [];
  world.projectiles = [];
  world.particles = [];
  world.monstersDefeated = 0;
  world.passiveCoinCarry = 0;
  world.shakeTimer = 0;
  world.houseBiteShake = 0;
  world.houseEatTimer = 0;
  world.houseEatProgress = 0;
  world.megaBossTimer = MEGA_BOSS_INTERVAL_SEC;
  world.megaBossCount = 0;
  hydratePlants(world, getStarterSlots(), true);
  recordDiscoveredPlant(world, 1);
  startWave(world, 1, audio);
  savePlantMergeWorldNow(world);
  world.version++;
}

function startWave(
  world: PlantMergeWorld,
  wave: number,
  audio: PlantMergeAudio
): void {
  world.wave = wave;
  const queue = buildWaveQueue(wave);
  world.waveSpawnQueue = queue;
  world.waveTotalMonsters = queue.length;
  world.waveDefeatedInWave = 0;
  world.spawnTimer = 0.9;
  world.waveRestTimer = 0;
  const isBossWave = wave % 5 === 0;
  setBanner(
    world,
    isBossWave
      ? world.lang === 'ar'
        ? `موجة الزعيم ${wave}! ملك الظلام قادم!`
        : `Boss Wave ${wave}! Dread Titan Incoming!`
      : world.lang === 'ar'
      ? `الموجة ${wave} — اقتل الوحوش لجمع الفلوس واشترِ نباتات من المتجر!`
      : `Wave ${wave} — Kill monsters for Coins & buy plants in the Shop!`,
    isBossWave ? 'boss' : 'info',
    2.8
  );
  if (isBossWave) {
    audio.playBossWarn();
  }
  savePlantMergeWorldNow(world);
}

function setBanner(
  world: PlantMergeWorld,
  text: string,
  tone: 'info' | 'boss' | 'merge' | 'warn',
  duration: number
): void {
  world.bannerText = text;
  world.bannerTone = tone;
  world.bannerTimer = duration;
}

function spawnParticles(
  world: PlantMergeWorld,
  x: number,
  y: number,
  z: number,
  color: string,
  count: number,
  speed = 3.2
): void {
  for (let i = 0; i < count; i++) {
    if (world.particles.length >= 80) {
      world.particles.shift();
    }
    const ang = Math.random() * Math.PI * 2;
    const mag = speed * (0.4 + Math.random() * 0.75);
    world.particles.push({
      id: world.nextId++,
      x,
      y,
      z,
      vx: Math.cos(ang) * mag,
      vy: 1.6 + Math.random() * 2.6,
      vz: Math.sin(ang) * mag,
      color,
      size: 0.1 + Math.random() * 0.11,
      life: 0.45 + Math.random() * 0.25,
      maxLife: 0.65,
    });
  }
}

function persistBestIfNeeded(world: PlantMergeWorld): void {
  let changed = false;
  if (world.score > world.bestScore) {
    world.bestScore = world.score;
    changed = true;
  }
  if (world.wave > world.bestWave) {
    world.bestWave = world.wave;
    changed = true;
  }
  if (changed) {
    savePlantMergeStats({
      bestWave: world.bestWave,
      bestScore: world.bestScore,
      highestTier: world.highestTier,
    });
  }
}

function getPlantAt(
  world: PlantMergeWorld,
  row: number,
  col: number
): PlantEntity | undefined {
  return world.plants.find((p) => p.row === row && p.col === col);
}

/**
 * Buy a specific plant tier from the Shop and place it on the target plot (or first open plot)
 */
export function actionBuyAndPlant(
  world: PlantMergeWorld,
  audio: PlantMergeAudio,
  tier: PlantTier = world.selectedShopTier,
  targetPlot?: { row: number; col: number }
): boolean {
  if (world.status !== 'PLAYING') return false;
  const spec = PLANT_SPECS[tier];
  const cost = spec.cost;

  if (world.coins < cost) {
    setBanner(
      world,
      world.lang === 'ar'
        ? `تحتاج ${cost} عملة لشراء ${spec.nameAr}! اقتل الوحوش لجمع الفلوس.`
        : `Need ${cost} Coins to buy ${spec.nameEn}! Kill monsters to earn more.`,
      'warn',
      1.9
    );
    return false;
  }

  let slot: { row: number; col: number } | null = null;
  if (targetPlot && !getPlantAt(world, targetPlot.row, targetPlot.col)) {
    slot = targetPlot;
  } else {
    const candidates: Array<{ row: number; col: number }> = [];
    for (let c = 0; c < GRID_COLS; c++) {
      for (let r = 0; r < GRID_ROWS; r++) {
        if (!getPlantAt(world, r, c)) {
          candidates.push({ row: r, col: c });
        }
      }
    }
    if (candidates.length === 0) {
      setBanner(
        world,
        world.lang === 'ar'
          ? 'المزرعة ممتلئة (15/15) — اختر نبتة وبِعها لتفريغ مكان!'
          : 'Garden full (15/15) — select a plant and sell it to make room!',
        'warn',
        2.1
      );
      return false;
    }
    slot = candidates[Math.floor(Math.random() * Math.min(4, candidates.length))];
  }

  world.coins -= cost;
  world.selectedShopTier = tier;
  const powerMul = 1 + (world.powerLevel - 1) * 0.16;
  const maxHp = Math.round(spec.maxHp * powerMul);

  world.plants.push({
    id: world.nextId++,
    row: slot.row,
    col: slot.col,
    tier,
    hp: maxHp,
    maxHp,
    fireCooldown: 0.3,
    recoil: 0,
    spawnAnim: 0,
    hitFlash: 0,
  });

  recordDiscoveredPlant(world, tier);
  if (tier > world.highestTier) {
    world.highestTier = tier;
    savePlantMergeStats({
      bestWave: world.bestWave,
      bestScore: world.bestScore,
      highestTier: world.highestTier,
    });
  }

  spawnParticles(
    world,
    COL_X[slot.col],
    0.65,
    LANE_Z[slot.row],
    spec.accentColor,
    12,
    2.8
  );
  if (tier >= 4) {
    audio.playMerge(Math.min(7, tier));
  } else {
    audio.playPlant();
  }
  setBanner(
    world,
    world.lang === 'ar'
      ? `تم شراء وزراعة ${spec.nameAr}!`
      : `Bought & planted ${spec.nameEn}!`,
    'merge',
    1.7
  );
  world.selectedPlot = null;
  savePlantMergeWorldNow(world);
  world.version++;
  return true;
}

export function actionSellSelectedPlant(
  world: PlantMergeWorld,
  audio: PlantMergeAudio
): boolean {
  if (world.status !== 'PLAYING' || !world.selectedPlot) return false;
  const { row, col } = world.selectedPlot;
  const plant = getPlantAt(world, row, col);
  if (!plant) {
    world.selectedPlot = null;
    world.version++;
    return false;
  }

  const refund = getPlantSellValue(plant.tier);
  const spec = PLANT_SPECS[plant.tier];
  world.coins += refund;
  world.lastCoinReward = refund;
  world.lastCoinRewardTimer = 1.4;
  world.plants = world.plants.filter((p) => p.id !== plant.id);
  world.selectedPlot = null;

  spawnParticles(world, COL_X[col], 0.65, LANE_Z[row], '#fde047', 12, 2.8);
  audio.playUpgrade();
  setBanner(
    world,
    world.lang === 'ar'
      ? `بِعت ${spec.nameAr} وحصلت على +${refund} عملة`
      : `Sold ${spec.nameEn} for +${refund} Coins`,
    'info',
    1.7
  );
  savePlantMergeWorldNow(world);
  world.version++;
  return true;
}

/**
 * Interact with a 3D garden soil plot:
 * - If nothing selected & plot empty -> Buy & plant the active shop plant right there!
 * - If nothing selected & plot occupied -> Select that placed plant (to move, swap, or sell).
 * - If placed plant selected & target empty -> Move plant there.
 * - If placed plant selected & target occupied -> Swap their positions (NO merging!).
 */
export function actionInteractPlot(
  world: PlantMergeWorld,
  row: number,
  col: number,
  audio: PlantMergeAudio
): boolean {
  if (world.status !== 'PLAYING') return false;
  const clickedPlant = getPlantAt(world, row, col);
  const sel = world.selectedPlot;

  if (!sel) {
    if (clickedPlant) {
      world.selectedPlot = { row, col };
      audio.playMove();
      world.version++;
      return true;
    }
    return actionBuyAndPlant(world, audio, world.selectedShopTier, { row, col });
  }

  if (sel.row === row && sel.col === col) {
    world.selectedPlot = null;
    world.version++;
    return true;
  }

  const selectedPlant = getPlantAt(world, sel.row, sel.col);
  if (!selectedPlant) {
    world.selectedPlot = null;
    world.version++;
    return true;
  }

  if (!clickedPlant) {
    selectedPlant.row = row;
    selectedPlant.col = col;
    selectedPlant.spawnAnim = 0.25;
    world.selectedPlot = null;
    spawnParticles(world, COL_X[col], 0.35, LANE_Z[row], '#86efac', 7, 1.8);
    audio.playMove();
    savePlantMergeWorldNow(world);
    world.version++;
    return true;
  }

  // Swap positions of the two plants (no merging)
  const tmpRow = selectedPlant.row;
  const tmpCol = selectedPlant.col;
  selectedPlant.row = clickedPlant.row;
  selectedPlant.col = clickedPlant.col;
  clickedPlant.row = tmpRow;
  clickedPlant.col = tmpCol;
  selectedPlant.spawnAnim = 0.35;
  clickedPlant.spawnAnim = 0.35;
  world.selectedPlot = null;
  audio.playMove();
  savePlantMergeWorldNow(world);
  world.version++;
  return true;
}

export function actionWaterBoost(
  world: PlantMergeWorld,
  audio: PlantMergeAudio
): boolean {
  if (world.status !== 'PLAYING') return false;
  if (world.coins < WATER_BOOST_COST) return false;
  world.coins -= WATER_BOOST_COST;
  world.waterBoostTimer = Math.max(world.waterBoostTimer, WATER_BOOST_DURATION);
  for (const p of world.plants) {
    p.hp = p.maxHp;
    spawnParticles(world, COL_X[p.col], 0.85, LANE_Z[p.row], '#38bdf8', 5, 2.2);
  }
  audio.playWaterBoost();
  setBanner(
    world,
    world.lang === 'ar'
      ? 'سقاية سحرية! شفاء كامل وسرعة هجوم ×2!'
      : 'Magic Watering! Full Heal & 2× Attack Speed!',
    'merge',
    2.2
  );
  savePlantMergeWorldNow(world);
  world.version++;
  return true;
}

export function actionUpgradePower(
  world: PlantMergeWorld,
  audio: PlantMergeAudio
): boolean {
  if (world.status !== 'PLAYING' || world.powerLevel >= MAX_POWER_LEVEL) return false;
  const cost = getPowerUpgradeCost(world.powerLevel);
  if (world.coins < cost) return false;
  world.coins -= cost;
  world.powerLevel++;
  const powerMul = 1 + (world.powerLevel - 1) * 0.16;
  for (const p of world.plants) {
    const spec = PLANT_SPECS[p.tier];
    const nextMax = Math.round(spec.maxHp * powerMul);
    const delta = nextMax - p.maxHp;
    p.maxHp = nextMax;
    p.hp = Math.min(nextMax, p.hp + Math.max(15, delta));
  }
  audio.playUpgrade();
  setBanner(
    world,
    world.lang === 'ar'
      ? `سماد القوة مستوى ${world.powerLevel}! (+16% ضرر وصحة)`
      : `Power Fertilizer Lv.${world.powerLevel}! (+16% DMG & HP)`,
    'merge',
    2.0
  );
  savePlantMergeWorldNow(world);
  world.version++;
  return true;
}

export function actionToggleSpeed(world: PlantMergeWorld): void {
  world.speedMul = world.speedMul === 1 ? 2 : 1;
  savePlantMergeWorldNow(world);
  world.version++;
}

function spawnMonsterEntity(
  world: PlantMergeWorld,
  kind: MonsterKind,
  opts?: { row?: number; x?: number; hpMul?: number }
): void {
  const spec = MONSTER_SPECS[kind];
  const waveScale = 1 + (world.wave - 1) * 0.22;
  const extraMul = opts?.hpMul ?? 1;
  const maxHp = Math.round(spec.baseHp * waveScale * extraMul);
  const row =
    opts?.row !== undefined
      ? opts.row
      : kind === 'boss' || kind === 'megaBoss'
      ? 1
      : Math.floor(Math.random() * GRID_ROWS);

  world.monsters.push({
    id: world.nextId++,
    kind,
    row,
    x: opts?.x ?? MONSTER_SPAWN_X,
    z: LANE_Z[row],
    hp: maxHp,
    maxHp,
    speed: spec.speed * (1 + Math.min(0.45, (world.wave - 1) * 0.028)),
    attackCooldown: 0.4,
    hitFlash: 0,
    slowTimer: 0,
    poisonTimer: 0,
    poisonDps: 0,
    walkPhase: Math.random() * Math.PI * 2,
    isAttacking: false,
    isEatingHouse: false,
    summonCooldown: kind === 'megaBoss' ? 3.8 : 0,
  });
}

function spawnNextMonster(world: PlantMergeWorld): void {
  const kind = world.waveSpawnQueue.shift();
  if (!kind) return;
  spawnMonsterEntity(world, kind);
}

function spawnColossalMegaBoss(
  world: PlantMergeWorld,
  audio: PlantMergeAudio
): void {
  world.megaBossCount++;
  const bossScaleMul = 1 + (world.megaBossCount - 1) * 0.5;
  spawnMonsterEntity(world, 'megaBoss', {
    row: 1,
    x: MONSTER_SPAWN_X + 0.35,
    hpMul: bossScaleMul,
  });

  for (let k = 0; k < 2; k++) {
    const elite =
      STRONG_SUMMON_POOL[Math.floor(Math.random() * STRONG_SUMMON_POOL.length)];
    const lane = k === 0 ? 0 : 2;
    spawnMonsterEntity(world, elite, {
      row: lane,
      x: MONSTER_SPAWN_X - 0.3,
      hpMul: 1.15,
    });
  }

  world.shakeTimer = 0.65;
  world.shakeIntensity = 0.3;
  spawnParticles(world, MONSTER_SPAWN_X, 1.8, 0, '#f43f5e', 26, 4.8);
  spawnParticles(world, MONSTER_SPAWN_X, 1.4, 0, '#a855f7', 18, 4.2);
  audio.playMegaBossSpawn();
  setBanner(
    world,
    world.lang === 'ar'
      ? `العملاق المدمّر (مستوى ${world.megaBossCount}) ظهر وينزل وحوشاً قوية!`
      : `Abyssal Colossal (Lv.${world.megaBossCount}) spawned with elite monsters!`,
    'boss',
    4.2
  );
  world.version++;
}

function triggerHouseDevouredSequence(
  world: PlantMergeWorld,
  audio: PlantMergeAudio
): void {
  world.farmHp = 0;
  world.status = 'EATING_HOUSE';
  world.houseEatTimer = HOUSE_EAT_DURATION;
  world.houseEatProgress = 0;
  world.houseDebrisTimer = 0.05;
  world.houseBiteShake = 1;
  world.shakeTimer = HOUSE_EAT_DURATION;
  world.shakeIntensity = 0.28;
  world.selectedPlot = null;

  clearSavedGarden();
  world.hasSavedGarden = false;
  world.savedPlantCount = 0;
  world.savedWave = 1;
  persistBestIfNeeded(world);

  audio.stopMusic();
  audio.playHouseChomp();
  setBanner(
    world,
    world.lang === 'ar'
      ? 'الوحش يلتهم المنزل! راحت الجلسة...'
      : 'A monster is devouring your house! Session lost...',
    'boss',
    HOUSE_EAT_DURATION + 0.5
  );
  world.version++;
}

export function stepPlantMergeWorld(
  world: PlantMergeWorld,
  rawDt: number,
  audio: PlantMergeAudio
): boolean {
  const dt = Math.min(rawDt, 0.05);
  world.elapsed += dt;

  // Always decay particles
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const pt = world.particles[i];
    pt.life -= dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.z += pt.vz * dt;
    pt.vy -= 7.8 * dt;
    if (pt.y < 0.06) {
      pt.y = 0.06;
      pt.vy *= -0.3;
    }
    if (pt.life <= 0) {
      world.particles.splice(i, 1);
    }
  }

  if (world.houseBiteShake > 0) {
    world.houseBiteShake = Math.max(0, world.houseBiteShake - dt * 3.4);
  }
  if (world.lastCoinRewardTimer > 0) {
    world.lastCoinRewardTimer = Math.max(0, world.lastCoinRewardTimer - dt);
  }

  // Dramatic 3D House-Eating Finale Sequence
  if (world.status === 'EATING_HOUSE') {
    world.houseEatTimer = Math.max(0, world.houseEatTimer - dt);
    world.houseEatProgress = Math.min(
      1,
      1 - world.houseEatTimer / HOUSE_EAT_DURATION
    );
    world.houseBiteShake = 1;
    world.shakeTimer = Math.max(0, world.houseEatTimer);

    for (const m of world.monsters) {
      if (m.isEatingHouse) {
        m.walkPhase += dt * 16;
      }
    }

    world.houseDebrisTimer -= dt;
    if (world.houseDebrisTimer <= 0) {
      world.houseDebrisTimer = 0.24;
      const debrisZ = (Math.random() - 0.5) * 3.6;
      spawnParticles(world, -6.2, 1.35, debrisZ, '#b91c1c', 7, 4.2);
      spawnParticles(world, -6.1, 0.95, debrisZ, '#e7d3b0', 7, 3.8);
      spawnParticles(world, -5.85, 0.65, debrisZ, '#78350f', 5, 3.2);
      audio.playHouseChomp();
    }

    if (world.houseEatTimer <= 0) {
      world.status = 'GAME_OVER';
      audio.playGameOver();
      world.version++;
    }
    return true;
  }

  if (world.status !== 'PLAYING') {
    return false;
  }

  const simDt = dt * world.speedMul;

  if (world.bannerTimer > 0) {
    world.bannerTimer = Math.max(0, world.bannerTimer - dt);
    if (world.bannerTimer === 0) {
      world.bannerText = '';
    }
  }
  if (world.shakeTimer > 0) {
    world.shakeTimer = Math.max(0, world.shakeTimer - dt);
  }
  if (world.waterBoostTimer > 0) {
    world.waterBoostTimer = Math.max(0, world.waterBoostTimer - simDt);
  }

  // 0) 5-Minute Colossal Mega-Boss Countdown Timer
  world.megaBossTimer -= simDt;
  if (world.megaBossTimer <= 0) {
    world.megaBossTimer = MEGA_BOSS_INTERVAL_SEC;
    spawnColossalMegaBoss(world, audio);
  }

  // Periodic auto-save every 3s while alive
  world.autoSaveTimer -= dt;
  if (world.autoSaveTimer <= 0) {
    world.autoSaveTimer = 3.0;
    savePlantMergeWorldNow(world);
  }

  // 1) Bonus passive coins ONLY from money-producing plants (+ tiny garden drip)
  let coinRate = 0.8;
  for (const p of world.plants) {
    const spec = PLANT_SPECS[p.tier];
    coinRate += spec.coinsPerSec ?? 0;
  }
  if (world.waterBoostTimer > 0) {
    coinRate *= 1.5;
  }
  world.passiveCoinCarry += coinRate * simDt;
  if (world.passiveCoinCarry >= 1) {
    const gained = Math.floor(world.passiveCoinCarry);
    world.passiveCoinCarry -= gained;
    world.coins += gained;
  }

  // 2) Spawn wave monsters
  const hasNonMegaWaveMonsters = world.monsters.some((m) => m.kind !== 'megaBoss');
  if (world.waveSpawnQueue.length > 0) {
    world.spawnTimer -= simDt;
    if (world.spawnTimer <= 0) {
      spawnNextMonster(world);
      const baseGap = Math.max(0.62, 2.05 - world.wave * 0.085);
      world.spawnTimer = baseGap * (0.75 + Math.random() * 0.5);
    }
  } else if (!hasNonMegaWaveMonsters && world.monsters.length === 0) {
    if (world.waveRestTimer <= 0) {
      const waveBonus = 40 + world.wave * 15;
      world.coins += waveBonus;
      world.lastCoinReward = waveBonus;
      world.lastCoinRewardTimer = 1.8;
      world.score += 65 + world.wave * 22;
      persistBestIfNeeded(world);
      savePlantMergeWorldNow(world);
      audio.playWaveClear();
      setBanner(
        world,
        world.lang === 'ar'
          ? `أنهيت الموجة ${world.wave}! +${waveBonus} عملة`
          : `Wave ${world.wave} Cleared! +${waveBonus} Coins`,
        'merge',
        2.1
      );
      world.waveRestTimer = 2.4;
    } else {
      world.waveRestTimer -= simDt;
      if (world.waveRestTimer <= 0) {
        startWave(world, world.wave + 1, audio);
      }
    }
  }

  // 3) Update Plants
  const fireRateMul = world.waterBoostTimer > 0 ? 1.9 : 1.0;
  const damageMul = 1 + (world.powerLevel - 1) * 0.16;

  for (const plant of world.plants) {
    if (plant.spawnAnim < 1) {
      plant.spawnAnim = Math.min(1, plant.spawnAnim + dt * 4.5);
    }
    if (plant.recoil > 0) {
      plant.recoil = Math.max(0, plant.recoil - dt * 5.2);
    }
    if (plant.hitFlash > 0) {
      plant.hitFlash = Math.max(0, plant.hitFlash - dt * 4.5);
    }

    const spec = PLANT_SPECS[plant.tier];
    plant.fireCooldown -= simDt * fireRateMul;

    if (plant.fireCooldown <= 0) {
      const plantX = COL_X[plant.col];
      let targetMonster = world.monsters.find(
        (m) => m.row === plant.row && m.x >= plantX - 0.5
      );
      if (!targetMonster && plant.tier >= 5 && world.monsters.length > 0) {
        targetMonster = world.monsters.reduce<MonsterEntity | undefined>(
          (closest, m) => {
            if (!closest || m.x < closest.x) return m;
            return closest;
          },
          undefined
        );
      }

      if (targetMonster) {
        const dmg = Math.max(1, Math.round(spec.damage * damageMul));
        const shotRow = targetMonster.row;
        const shotZ = LANE_Z[shotRow];
        const offsets = spec.tripleShot
          ? [-0.32, 0, 0.32]
          : spec.twinShot
          ? [-0.24, 0.24]
          : [0];
        for (const zOff of offsets) {
          world.projectiles.push({
            id: world.nextId++,
            row: shotRow,
            x: plantX + 0.45,
            y: 0.78 + Math.min(0.45, plant.tier * 0.04),
            z: shotZ + zOff,
            speed: spec.projectileSpeed,
            damage: dmg,
            color: spec.projectileColor,
            tier: plant.tier,
            splashRadius: spec.splashRadius ?? 0,
            slowFactor: spec.slowFactor ?? 1,
            slowDuration: spec.slowDuration ?? 0,
            poisonDps: spec.poisonDps ? Math.round(spec.poisonDps * damageMul) : 0,
            poisonDuration: spec.poisonDuration ?? 0,
          });
        }
        plant.fireCooldown = spec.fireInterval;
        plant.recoil = 1;
        audio.playShoot(Math.min(7, plant.tier));
      }
    }
  }

  // 4) Update Projectiles & Hit Detection
  for (let i = world.projectiles.length - 1; i >= 0; i--) {
    const proj = world.projectiles[i];
    proj.x += proj.speed * simDt;

    if (proj.x > MONSTER_SPAWN_X + 1.4) {
      world.projectiles.splice(i, 1);
      continue;
    }

    let hitMonster: MonsterEntity | null = null;
    for (const m of world.monsters) {
      if (m.row !== proj.row) continue;
      const hitRadius =
        m.kind === 'megaBoss'
          ? 1.35
          : m.kind === 'boss'
          ? 1.05
          : m.kind === 'dragon' || m.kind === 'iceYeti'
          ? 0.82
          : m.kind === 'troll' || m.kind === 'darkKnight'
          ? 0.76
          : 0.68;
      if (Math.abs(m.x - proj.x) <= hitRadius) {
        hitMonster = m;
        break;
      }
    }

    if (hitMonster) {
      applyDamageToMonster(
        hitMonster,
        proj.damage,
        proj.slowFactor,
        proj.slowDuration,
        proj.poisonDps,
        proj.poisonDuration
      );
      if (proj.splashRadius > 0) {
        for (const other of world.monsters) {
          if (other.id === hitMonster.id) continue;
          const dx = other.x - hitMonster.x;
          const dz = other.z - hitMonster.z;
          if (dx * dx + dz * dz <= proj.splashRadius * proj.splashRadius) {
            applyDamageToMonster(
              other,
              Math.max(1, Math.round(proj.damage * 0.56)),
              proj.slowFactor,
              proj.slowDuration,
              Math.round(proj.poisonDps * 0.6),
              proj.poisonDuration
            );
          }
        }
      }
      spawnParticles(
        world,
        proj.x,
        proj.y,
        proj.z,
        proj.color,
        proj.splashRadius > 0 ? 8 : 5,
        2.5
      );
      world.projectiles.splice(i, 1);
    }
  }

  // 5) Update Monsters (poison, Mega-Boss minion summoning, chomping plants, eating house, KILL COIN REWARDS)
  world.poisonParticleTimer -= simDt;
  const emitPoisonPuff = world.poisonParticleTimer <= 0;
  if (emitPoisonPuff) world.poisonParticleTimer = 0.35;

  const newlySummoned: Array<{ kind: MonsterKind; row: number; x: number }> = [];

  for (let i = world.monsters.length - 1; i >= 0; i--) {
    const m = world.monsters[i];

    if (m.poisonTimer > 0 && m.poisonDps > 0) {
      m.poisonTimer = Math.max(0, m.poisonTimer - simDt);
      m.hp -= m.poisonDps * simDt;
      if (emitPoisonPuff) {
        spawnParticles(world, m.x, 0.7, m.z, '#a3e635', 2, 1.3);
      }
    }

    if (m.hp <= 0) {
      const spec = MONSTER_SPECS[m.kind];
      const waveCoinScale = 1 + Math.min(1.5, (world.wave - 1) * 0.08);
      const earnedCoins = Math.round(spec.rewardCoins * waveCoinScale);
      world.coins += earnedCoins;
      world.lastCoinReward = earnedCoins;
      world.lastCoinRewardTimer = 1.45;
      world.score += spec.rewardScore;
      world.monstersDefeated++;
      recordDefeatedMonster(world, m.kind);

      if (m.kind !== 'megaBoss') {
        world.waveDefeatedInWave++;
      } else {
        setBanner(
          world,
          world.lang === 'ar'
            ? `هزمت العملاق المدمّر! +${earnedCoins} عملة!`
            : `Abyssal Colossal Defeated! +${earnedCoins} Coins!`,
          'merge',
          3.2
        );
      }

      // Golden coin shower + monster accent burst!
      spawnParticles(world, m.x, 0.95, m.z, '#fde047', 8, 3.4);
      spawnParticles(
        world,
        m.x,
        0.85,
        m.z,
        spec.accentColor,
        m.kind === 'megaBoss' ? 28 : m.kind === 'boss' ? 20 : 9,
        m.kind === 'megaBoss' ? 5.4 : m.kind === 'boss' ? 4.5 : 3.0
      );
      audio.playMonsterDefeat(
        m.kind === 'megaBoss' || m.kind === 'boss' || m.kind === 'dragon'
      );
      persistBestIfNeeded(world);
      world.monsters.splice(i, 1);
      continue;
    }

    if (m.hitFlash > 0) m.hitFlash = Math.max(0, m.hitFlash - dt * 5.0);
    if (m.slowTimer > 0) m.slowTimer = Math.max(0, m.slowTimer - simDt);

    const slowMul = m.slowTimer > 0 ? 0.5 : 1.0;
    const spec = MONSTER_SPECS[m.kind];

    if (m.kind === 'megaBoss' && !m.isEatingHouse) {
      m.summonCooldown -= simDt;
      if (m.summonCooldown <= 0) {
        m.summonCooldown = 5.6;
        const spawnX = Math.min(MONSTER_SPAWN_X, m.x + 0.55);
        for (let s = 0; s < 2; s++) {
          const elite =
            STRONG_SUMMON_POOL[
              Math.floor(Math.random() * STRONG_SUMMON_POOL.length)
            ];
          const lane = Math.floor(Math.random() * GRID_ROWS);
          newlySummoned.push({ kind: elite, row: lane, x: spawnX });
        }
        spawnParticles(world, m.x, 1.6, m.z, '#c084fc', 18, 4.0);
        audio.playSummonMinions();
        setBanner(
          world,
          world.lang === 'ar'
            ? 'العملاق المدمّر يستدعي وحوشاً قوية!'
            : 'Abyssal Colossal summons strong monsters!',
          'boss',
          2.2
        );
      }
    }

    if (m.isEatingHouse) {
      m.isAttacking = true;
      m.walkPhase += simDt * 13.5 * slowMul;
      m.attackCooldown -= simDt * slowMul;
      if (m.attackCooldown <= 0) {
        m.attackCooldown = 0.65;
        world.farmHp = Math.max(0, world.farmHp - spec.baseDamage);
        world.houseBiteShake = 1;
        world.shakeTimer = 0.3;
        world.shakeIntensity = 0.22;
        spawnParticles(world, -6.05, 1.15, m.z, '#b91c1c', 10, 3.6);
        spawnParticles(world, -5.95, 0.85, m.z, '#e7d3b0', 9, 3.2);
        audio.playHouseChomp();

        if (world.farmHp <= 0) {
          triggerHouseDevouredSequence(world, audio);
          return true;
        } else {
          setBanner(
            world,
            world.lang === 'ar'
              ? `وحش يأكل المنزل! (صحة المنزل: ${world.farmHp}/${world.maxFarmHp})`
              : `Monster is eating the house! (House HP: ${world.farmHp}/${world.maxFarmHp})`,
            'warn',
            1.9
          );
          savePlantMergeWorldNow(world);
        }
      }
      continue;
    }

    let blockingPlant: PlantEntity | null = null;
    for (const p of world.plants) {
      if (p.row !== m.row) continue;
      const px = COL_X[p.col];
      if (m.x >= px - 0.15 && m.x <= px + 0.85) {
        blockingPlant = p;
        break;
      }
    }

    if (blockingPlant) {
      m.isAttacking = true;
      m.walkPhase += simDt * 8.5 * slowMul;
      m.attackCooldown -= simDt * slowMul;
      if (m.attackCooldown <= 0) {
        const dmg = Math.round(spec.attackDamage * (1 + (world.wave - 1) * 0.09));
        blockingPlant.hp -= dmg;
        blockingPlant.hitFlash = 1;
        m.attackCooldown = spec.attackInterval;
        spawnParticles(
          world,
          COL_X[blockingPlant.col] + 0.25,
          0.65,
          LANE_Z[blockingPlant.row],
          '#f87171',
          5,
          2.0
        );
        if (blockingPlant.hp <= 0) {
          spawnParticles(
            world,
            COL_X[blockingPlant.col],
            0.55,
            LANE_Z[blockingPlant.row],
            '#4ade80',
            12,
            2.8
          );
          if (
            world.selectedPlot &&
            world.selectedPlot.row === blockingPlant.row &&
            world.selectedPlot.col === blockingPlant.col
          ) {
            world.selectedPlot = null;
          }
          world.plants = world.plants.filter((p) => p.id !== blockingPlant!.id);
          savePlantMergeWorldNow(world);
          world.version++;
        }
      }
    } else {
      m.isAttacking = false;
      m.x -= m.speed * slowMul * simDt;
      m.walkPhase += simDt * (spec.flying ? 11.5 : 7.5) * slowMul;

      if (m.x <= FARM_GATE_X) {
        m.x = FARM_GATE_X;
        m.isEatingHouse = true;
        m.isAttacking = true;
        m.attackCooldown = 0.25;
        world.houseBiteShake = 1;
        spawnParticles(world, -5.9, 1.0, m.z, '#ef4444', 12, 3.2);
        audio.playHouseChomp();
        setBanner(
          world,
          world.lang === 'ar'
            ? 'تحذير! وحش وصل للنهاية ويبدأ بأكل المنزل!'
            : 'Warning! A monster reached the end and is eating your house!',
          'warn',
          2.2
        );
      }
    }
  }

  for (const s of newlySummoned) {
    spawnMonsterEntity(world, s.kind, { row: s.row, x: s.x, hpMul: 1.15 });
  }

  return true;
}

function applyDamageToMonster(
  monster: MonsterEntity,
  damage: number,
  slowFactor: number,
  slowDuration: number,
  poisonDps: number,
  poisonDuration: number
): void {
  monster.hp -= damage;
  monster.hitFlash = 1;
  if (slowFactor < 1 && slowDuration > 0) {
    monster.slowTimer = Math.max(monster.slowTimer, slowDuration);
  }
  if (poisonDps > 0 && poisonDuration > 0) {
    monster.poisonTimer = Math.max(monster.poisonTimer, poisonDuration);
    monster.poisonDps = Math.max(monster.poisonDps, poisonDps);
  }
}

export function extractPlantMergeHud(
  world: PlantMergeWorld
): PlantMergeHudSnapshot {
  const boss = world.monsters.find((m) => m.kind === 'boss');
  const megaBoss = world.monsters.find((m) => m.kind === 'megaBoss');
  const houseBeingEaten =
    world.status === 'EATING_HOUSE' ||
    world.monsters.some((m) => m.isEatingHouse);

  const selectedPlant = world.selectedPlot
    ? getPlantAt(world, world.selectedPlot.row, world.selectedPlot.col)
    : undefined;

  const progress =
    world.waveTotalMonsters > 0
      ? Math.min(1, world.waveDefeatedInWave / world.waveTotalMonsters)
      : 0;

  return {
    status: world.status,
    wave: world.wave,
    waveProgress: progress,
    bossActive: Boolean(boss),
    bossHpRatio: boss ? Math.max(0, boss.hp / boss.maxHp) : 0,
    megaBossTimer: Math.max(0, world.megaBossTimer),
    megaBossActive: Boolean(megaBoss),
    megaBossHp: megaBoss ? Math.max(0, Math.ceil(megaBoss.hp)) : 0,
    megaBossMaxHp: megaBoss ? megaBoss.maxHp : 0,
    megaBossLevel: Math.max(1, world.megaBossCount),
    houseBeingEaten,
    coins: world.coins,
    lastCoinReward: world.lastCoinReward,
    lastCoinRewardTimer: world.lastCoinRewardTimer,
    score: world.score,
    bestScore: world.bestScore,
    bestWave: world.bestWave,
    highestTier: world.highestTier,
    farmHp: world.farmHp,
    maxFarmHp: world.maxFarmHp,
    plantCount: world.plants.length,
    maxPlots: GRID_ROWS * GRID_COLS,
    selectedShopTier: world.selectedShopTier,
    selectedPlantTier: selectedPlant ? selectedPlant.tier : null,
    selectedPlantSellValue: selectedPlant
      ? getPlantSellValue(selectedPlant.tier)
      : 0,
    powerLevel: world.powerLevel,
    powerUpgradeCost: getPowerUpgradeCost(world.powerLevel),
    waterCost: WATER_BOOST_COST,
    waterBoostTimer: world.waterBoostTimer,
    selectedPlot: world.selectedPlot ? { ...world.selectedPlot } : null,
    speedMul: world.speedMul,
    bannerText: world.bannerText,
    bannerTone: world.bannerTone,
    monstersDefeated: world.monstersDefeated,
    hasSavedGarden: world.hasSavedGarden,
    savedWave: world.savedWave,
    savedPlantCount: world.savedPlantCount,
    discoveredPlants: world.discoveredPlants,
    defeatedMonsters: world.defeatedMonsters,
  };
}
