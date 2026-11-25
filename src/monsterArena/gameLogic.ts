import { MonsterArenaAudio } from './audio';
import {
  ARENA_MONSTER_SPECS,
  ARENA_RADIUS,
  ArenaMonsterEntity,
  ArenaMonsterKind,
  ArenaParticle,
  ArenaPetEntity,
  ArenaPickup,
  ArenaProjectile,
  ArenaStatus,
  BASE_MAX_ENERGY,
  clearMonsterArenaSavedRun,
  FRUIT_SPECS,
  FruitId,
  MAX_PET_LEVEL,
  MAX_PET_SQUAD,
  MEAT_SPECS,
  MeatId,
  MonsterArenaHudSnapshot,
  MonsterArenaSavedRun,
  PET_SPECS,
  PetId,
  readMonsterArenaSavedRun,
  readMonsterArenaStats,
  readMonsterArenaTimers,
  SavedPetSlot,
  saveMonsterArenaRun,
  saveMonsterArenaStats,
  saveMonsterArenaTimers,
  TITAN_BOSS_INTERVAL_SEC,
  WARLORD_BOSS_INTERVAL_SEC,
  WEAPON_SPECS,
  WeaponId,
} from './types';

export interface MonsterArenaInput {
  moveX: number; // -1..1
  moveZ: number; // -1..1
}

export interface MonsterArenaWorld {
  lang: 'ar' | 'en';
  status: ArenaStatus;
  coins: number;
  score: number;
  wave: number;
  waveKills: number;
  waveTargetKills: number;
  kills: number;
  fruitsEaten: number;
  meatsFed: number;
  energy: number;
  maxEnergy: number;
  playerX: number;
  playerZ: number;
  playerAngle: number;
  playerWalkPhase: number;
  playerRecoil: number;
  playerHurtFlash: number;
  invulnTimer: number;
  dashTimer: number;
  dashCooldown: number;
  dashDirX: number;
  dashDirZ: number;
  fireCooldown: number;
  activeWeapon: WeaponId;
  ownedWeapons: WeaponId[];
  pets: ArenaPetEntity[];
  selectedPetId: number | null;
  monsters: ArenaMonsterEntity[];
  projectiles: ArenaProjectile[];
  pickups: ArenaPickup[];
  particles: ArenaParticle[];
  warlordTimer: number;
  warlordLevel: number;
  warlordWarned20: boolean;
  titanTimer: number;
  titanLevel: number;
  titanWarned30: boolean;
  speedBuffTimer: number;
  damageBuffTimer: number;
  shieldBuffTimer: number;
  rapidFireBuffTimer: number;
  petFuryBuffTimer: number;
  petFuryDmgPct: number;
  petFurySpdPct: number;
  spawnTimer: number;
  autoSaveTimer: number;
  bannerText: string;
  bannerTone: 'info' | 'boss' | 'shop' | 'warn';
  bannerTimer: number;
  shakeTimer: number;
  shakeIntensity: number;
  bestScore: number;
  bestWave: number;
  bestKills: number;
  titansDefeated: number;
  hasSavedRun: boolean;
  savedWave: number;
  savedCoins: number;
  nextId: number;
  elapsed: number;
  version: number;
}

const PET_LEVEL_DMG_MUL = [1.0, 2.35, 4.8, 8.8, 15.0] as const;
const PET_LEVEL_HP_MUL = [1.0, 1.9, 3.3, 5.5, 9.0] as const;

export function getPetDamageMultiplier(level: number): number {
  const idx = Math.max(0, Math.min(PET_LEVEL_DMG_MUL.length - 1, level - 1));
  return PET_LEVEL_DMG_MUL[idx];
}

export function getPetMaxHp(petId: PetId, level: number, bonusMaxHp = 0): number {
  const idx = Math.max(0, Math.min(PET_LEVEL_HP_MUL.length - 1, level - 1));
  return Math.round(PET_SPECS[petId].baseHp * PET_LEVEL_HP_MUL[idx]) + Math.max(0, Math.round(bonusMaxHp));
}

export function countMergeablePairs(
  roster: readonly { petId: PetId; level: number }[]
): number {
  const counts = new Map<string, number>();
  for (const p of roster) {
    if (p.level >= MAX_PET_LEVEL) continue;
    const key = `${p.petId}:${p.level}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let pairs = 0;
  for (const c of counts.values()) {
    pairs += Math.floor(c / 2);
  }
  return pairs;
}

function waveTargetFor(wave: number): number {
  return 10 + (wave - 1) * 4;
}

function setBanner(
  world: MonsterArenaWorld,
  text: string,
  tone: 'info' | 'boss' | 'shop' | 'warn',
  duration = 2.4
): void {
  world.bannerText = text;
  world.bannerTone = tone;
  world.bannerTimer = duration;
}

function spawnParticles(
  world: MonsterArenaWorld,
  x: number,
  y: number,
  z: number,
  color: string,
  count: number,
  speed = 4.2
): void {
  for (let i = 0; i < count; i++) {
    if (world.particles.length >= 110) {
      world.particles.shift();
    }
    const ang = Math.random() * Math.PI * 2;
    const mag = speed * (0.35 + Math.random() * 0.8);
    world.particles.push({
      id: world.nextId++,
      x,
      y,
      z,
      vx: Math.cos(ang) * mag,
      vy: 1.8 + Math.random() * 3.2,
      vz: Math.sin(ang) * mag,
      color,
      size: 0.12 + Math.random() * 0.14,
      life: 0.35 + Math.random() * 0.28,
      maxLife: 0.62,
    });
  }
}

function findFirstFreePetSlot(pets: readonly ArenaPetEntity[]): number {
  const used = new Set(pets.map((p) => p.slot));
  for (let s = 0; s < MAX_PET_SQUAD; s++) {
    if (!used.has(s)) return s;
  }
  return 0;
}

function loadPetsFromRoster(
  world: MonsterArenaWorld,
  roster: readonly SavedPetSlot[]
): void {
  const limited = roster.slice(0, MAX_PET_SQUAD);
  const used = new Set<number>();
  world.pets = limited.map((slot, idx) => {
    let slotIdx =
      typeof slot.slot === 'number' &&
      slot.slot >= 0 &&
      slot.slot < MAX_PET_SQUAD &&
      !used.has(slot.slot)
        ? slot.slot
        : idx;
    while (used.has(slotIdx) && slotIdx < MAX_PET_SQUAD) slotIdx++;
    if (used.has(slotIdx)) {
      for (let s = 0; s < MAX_PET_SQUAD; s++) {
        if (!used.has(s)) {
          slotIdx = s;
          break;
        }
      }
    }
    used.add(slotIdx);

    const ang = (slotIdx / MAX_PET_SQUAD) * Math.PI * 2;
    const gx = typeof slot.guardX === 'number' && Number.isFinite(slot.guardX) ? slot.guardX : null;
    const gz = typeof slot.guardZ === 'number' && Number.isFinite(slot.guardZ) ? slot.guardZ : null;
    const lv = Math.max(1, Math.min(MAX_PET_LEVEL, slot.level));
    const bonusMaxHp =
      typeof slot.bonusMaxHp === 'number' && Number.isFinite(slot.bonusMaxHp) && slot.bonusMaxHp > 0
        ? Math.floor(slot.bonusMaxHp)
        : 0;
    const maxHp = getPetMaxHp(slot.petId, lv, bonusMaxHp);
    const hp =
      typeof slot.hp === 'number' && Number.isFinite(slot.hp) && slot.hp > 0
        ? Math.min(maxHp, Math.max(1, Math.round(slot.hp)))
        : maxHp;
    return {
      id: world.nextId++,
      petId: slot.petId,
      level: lv,
      slot: slotIdx,
      hp,
      maxHp,
      bonusMaxHp,
      hitFlash: 0,
      hurtCooldown: 0,
      x: gx !== null ? gx : world.playerX + Math.cos(ang) * 2.6,
      z: gz !== null ? gz : world.playerZ + Math.sin(ang) * 2.6,
      guardX: gx,
      guardZ: gz,
      angle: ang,
      attackCooldown: 0.25,
      animPhase: Math.random() * Math.PI * 2,
      lungeTimer: 0,
    };
  });
}

function persistStatsIfNeeded(world: MonsterArenaWorld): void {
  let dirty = false;
  if (world.score > world.bestScore) {
    world.bestScore = world.score;
    dirty = true;
  }
  if (world.wave > world.bestWave) {
    world.bestWave = world.wave;
    dirty = true;
  }
  if (world.kills > world.bestKills) {
    world.bestKills = world.kills;
    dirty = true;
  }
  if (dirty) {
    saveMonsterArenaStats({
      bestScore: world.bestScore,
      bestWave: world.bestWave,
      bestKills: world.bestKills,
      titansDefeated: world.titansDefeated,
    });
  }
}

export function saveMonsterArenaNow(world: MonsterArenaWorld): void {
  if (world.status !== 'PLAYING' && world.status !== 'PAUSED') return;
  if (world.energy <= 0) return;

  const clampedWarlord = Math.max(1, Math.min(WARLORD_BOSS_INTERVAL_SEC, world.warlordTimer));
  const clampedTitan = Math.max(1, Math.min(TITAN_BOSS_INTERVAL_SEC, world.titanTimer));

  // Always persist exact boss timers independently as well
  saveMonsterArenaTimers({
    warlordTimer: clampedWarlord,
    warlordLevel: world.warlordLevel,
    titanTimer: clampedTitan,
    titanLevel: world.titanLevel,
    savedAt: Date.now(),
  });

  const run: MonsterArenaSavedRun = {
    coins: Math.max(0, Math.floor(world.coins)),
    score: Math.max(0, Math.floor(world.score)),
    wave: Math.max(1, world.wave),
    kills: Math.max(0, world.kills),
    energy: Math.max(10, Math.floor(world.energy)),
    maxEnergy: Math.max(BASE_MAX_ENERGY, Math.floor(world.maxEnergy)),
    activeWeapon: world.activeWeapon,
    ownedWeapons: [...world.ownedWeapons],
    petRoster: world.pets.map((p) => ({
      petId: p.petId,
      level: p.level,
      slot: p.slot,
      hp: Math.ceil(p.hp),
      maxHp: p.maxHp,
      bonusMaxHp: p.bonusMaxHp,
      guardX: p.guardX,
      guardZ: p.guardZ,
    })),
    warlordTimer: clampedWarlord,
    warlordLevel: world.warlordLevel,
    titanTimer: clampedTitan,
    titanLevel: world.titanLevel,
    fruitsEaten: world.fruitsEaten,
    meatsFed: world.meatsFed,
    savedAt: Date.now(),
  };
  saveMonsterArenaRun(run);
  world.hasSavedRun = true;
  world.savedWave = run.wave;
  world.savedCoins = run.coins;
}

export function createInitialMonsterArenaWorld(lang: 'ar' | 'en'): MonsterArenaWorld {
  const stats = readMonsterArenaStats();
  const saved = readMonsterArenaSavedRun();
  const savedTimers = readMonsterArenaTimers();
  const initialWarlordTimer =
    saved?.warlordTimer ?? savedTimers?.warlordTimer ?? WARLORD_BOSS_INTERVAL_SEC;
  const initialWarlordLevel = saved?.warlordLevel ?? savedTimers?.warlordLevel ?? 0;
  const initialTitanTimer =
    saved?.titanTimer ?? savedTimers?.titanTimer ?? TITAN_BOSS_INTERVAL_SEC;
  const initialTitanLevel = saved?.titanLevel ?? savedTimers?.titanLevel ?? 0;

  const world: MonsterArenaWorld = {
    lang,
    status: 'START',
    coins: saved ? saved.coins : 40,
    score: saved ? saved.score : 0,
    wave: saved ? saved.wave : 1,
    waveKills: 0,
    waveTargetKills: waveTargetFor(saved ? saved.wave : 1),
    kills: saved ? saved.kills : 0,
    fruitsEaten: saved ? saved.fruitsEaten : 0,
    meatsFed: saved?.meatsFed ?? 0,
    energy: saved ? saved.energy : BASE_MAX_ENERGY,
    maxEnergy: saved ? saved.maxEnergy : BASE_MAX_ENERGY,
    playerX: 0,
    playerZ: 0,
    playerAngle: 0,
    playerWalkPhase: 0,
    playerRecoil: 0,
    playerHurtFlash: 0,
    invulnTimer: 0,
    dashTimer: 0,
    dashCooldown: 0,
    dashDirX: 0,
    dashDirZ: 1,
    fireCooldown: 0.2,
    activeWeapon: saved ? saved.activeWeapon : 'plasma_pistol',
    ownedWeapons: saved ? saved.ownedWeapons : ['plasma_pistol'],
    pets: [],
    selectedPetId: null,
    monsters: [],
    projectiles: [],
    pickups: [],
    particles: [],
    warlordTimer: initialWarlordTimer,
    warlordLevel: initialWarlordLevel,
    warlordWarned20: initialWarlordTimer <= 20,
    titanTimer: initialTitanTimer,
    titanLevel: initialTitanLevel,
    titanWarned30: initialTitanTimer <= 30,
    speedBuffTimer: 0,
    damageBuffTimer: 0,
    shieldBuffTimer: 0,
    rapidFireBuffTimer: 0,
    petFuryBuffTimer: 0,
    petFuryDmgPct: 0,
    petFurySpdPct: 0,
    spawnTimer: 0.8,
    autoSaveTimer: 1.0,
    bannerText: '',
    bannerTone: 'info',
    bannerTimer: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
    bestScore: stats.bestScore,
    bestWave: stats.bestWave,
    bestKills: stats.bestKills,
    titansDefeated: stats.titansDefeated,
    hasSavedRun: Boolean(saved),
    savedWave: saved ? saved.wave : 1,
    savedCoins: saved ? saved.coins : 0,
    nextId: 1,
    elapsed: 0,
    version: 1,
  };
  if (saved?.petRoster?.length) {
    loadPetsFromRoster(world, saved.petRoster);
  }
  return world;
}

export function startNewMonsterArenaRun(
  world: MonsterArenaWorld,
  audio: MonsterArenaAudio
): void {
  const savedTimers = readMonsterArenaTimers();
  world.status = 'PLAYING';
  world.coins = 50;
  world.score = 0;
  world.wave = 1;
  world.waveKills = 0;
  world.waveTargetKills = waveTargetFor(1);
  world.kills = 0;
  world.fruitsEaten = 0;
  world.meatsFed = 0;
  world.maxEnergy = BASE_MAX_ENERGY;
  world.energy = BASE_MAX_ENERGY;
  world.playerX = 0;
  world.playerZ = 0;
  world.playerAngle = 0;
  world.playerRecoil = 0;
  world.playerHurtFlash = 0;
  world.invulnTimer = 1.0;
  world.dashTimer = 0;
  world.dashCooldown = 0;
  world.fireCooldown = 0.25;
  world.activeWeapon = 'plasma_pistol';
  world.ownedWeapons = ['plasma_pistol'];
  world.pets = [];
  world.selectedPetId = null;
  world.monsters = [];
  world.projectiles = [];
  world.pickups = [];
  world.particles = [];
  // Keep persisted boss countdown timers across exits/restarts
  world.warlordTimer = savedTimers?.warlordTimer ?? WARLORD_BOSS_INTERVAL_SEC;
  world.warlordLevel = savedTimers?.warlordLevel ?? 0;
  world.warlordWarned20 = world.warlordTimer <= 20;
  world.titanTimer = savedTimers?.titanTimer ?? TITAN_BOSS_INTERVAL_SEC;
  world.titanLevel = savedTimers?.titanLevel ?? 0;
  world.titanWarned30 = world.titanTimer <= 30;
  world.speedBuffTimer = 0;
  world.damageBuffTimer = 0;
  world.shieldBuffTimer = 0;
  world.rapidFireBuffTimer = 0;
  world.petFuryBuffTimer = 0;
  world.petFuryDmgPct = 0;
  world.petFurySpdPct = 0;
  world.spawnTimer = 0.5;
  world.autoSaveTimer = 1.0;
  world.shakeTimer = 0;
  setBanner(
    world,
    world.lang === 'ar'
      ? 'الموجة 1 — قاتل الوحوش، اشترِ وانقل وادمج الحيوانات، وتناول الفواكه!'
      : 'Wave 1 — Fight monsters, move & merge pets, and eat fruits for Energy!',
    'info',
    3.2
  );
  audio.playBuy();
  saveMonsterArenaNow(world);
  world.version++;
}

export function resumeMonsterArenaRun(
  world: MonsterArenaWorld,
  audio: MonsterArenaAudio
): void {
  const saved = readMonsterArenaSavedRun();
  if (!saved) {
    startNewMonsterArenaRun(world, audio);
    return;
  }
  const savedTimers = readMonsterArenaTimers();
  world.status = 'PLAYING';
  world.coins = saved.coins;
  world.score = saved.score;
  world.wave = saved.wave;
  world.waveKills = 0;
  world.waveTargetKills = waveTargetFor(saved.wave);
  world.kills = saved.kills;
  world.fruitsEaten = saved.fruitsEaten;
  world.meatsFed = saved.meatsFed ?? 0;
  world.maxEnergy = saved.maxEnergy;
  world.energy = saved.energy;
  world.activeWeapon = saved.activeWeapon;
  world.ownedWeapons = [...saved.ownedWeapons];
  world.warlordTimer =
    savedTimers && savedTimers.savedAt >= saved.savedAt
      ? savedTimers.warlordTimer
      : saved.warlordTimer ?? WARLORD_BOSS_INTERVAL_SEC;
  world.warlordLevel =
    savedTimers && savedTimers.savedAt >= saved.savedAt
      ? savedTimers.warlordLevel
      : saved.warlordLevel ?? 0;
  world.warlordWarned20 = world.warlordTimer <= 20;
  world.titanTimer =
    savedTimers && savedTimers.savedAt >= saved.savedAt
      ? savedTimers.titanTimer
      : saved.titanTimer;
  world.titanLevel =
    savedTimers && savedTimers.savedAt >= saved.savedAt
      ? savedTimers.titanLevel
      : saved.titanLevel;
  world.titanWarned30 = world.titanTimer <= 30;
  world.playerX = 0;
  world.playerZ = 0;
  world.selectedPetId = null;
  world.invulnTimer = 1.2;
  world.monsters = [];
  world.projectiles = [];
  world.pickups = [];
  world.particles = [];
  world.speedBuffTimer = 0;
  world.damageBuffTimer = 0;
  world.shieldBuffTimer = 0;
  world.rapidFireBuffTimer = 0;
  world.petFuryBuffTimer = 0;
  world.petFuryDmgPct = 0;
  world.petFurySpdPct = 0;
  world.spawnTimer = 0.7;
  world.autoSaveTimer = 1.0;
  loadPetsFromRoster(world, saved.petRoster ?? []);
  setBanner(
    world,
    world.lang === 'ar'
      ? `تم استئناف الحلبة — الموجة ${world.wave}`
      : `Arena Resumed — Wave ${world.wave}`,
    'info',
    2.4
  );
  audio.playBuy();
  world.version++;
}

export function actionTriggerDash(
  world: MonsterArenaWorld,
  input: MonsterArenaInput,
  audio: MonsterArenaAudio
): boolean {
  if (world.status !== 'PLAYING' || world.dashCooldown > 0) return false;
  let dx = input.moveX;
  let dz = input.moveZ;
  const len = Math.hypot(dx, dz);
  if (len > 0.1) {
    dx /= len;
    dz /= len;
  } else {
    dx = Math.sin(world.playerAngle);
    dz = Math.cos(world.playerAngle);
  }
  world.dashDirX = dx;
  world.dashDirZ = dz;
  world.dashTimer = 0.22;
  world.dashCooldown = 2.6;
  world.invulnTimer = Math.max(world.invulnTimer, 0.34);
  spawnParticles(world, world.playerX, 0.7, world.playerZ, '#38bdf8', 12, 5.2);
  audio.playDash();
  return true;
}

export function actionBuyFruit(
  world: MonsterArenaWorld,
  fruitId: FruitId,
  audio: MonsterArenaAudio
): boolean {
  const spec = FRUIT_SPECS[fruitId];
  if (world.coins < spec.cost) return false;
  world.coins -= spec.cost;
  world.fruitsEaten++;
  if (spec.maxEnergyBonus > 0) {
    world.maxEnergy += spec.maxEnergyBonus;
  }
  world.energy = Math.min(world.maxEnergy, world.energy + spec.healAmount);
  if (spec.speedBuffSec) {
    world.speedBuffTimer = Math.max(world.speedBuffTimer, spec.speedBuffSec);
  }
  if (spec.damageBuffSec) {
    world.damageBuffTimer = Math.max(world.damageBuffTimer, spec.damageBuffSec);
  }
  if (spec.shieldBuffSec) {
    world.shieldBuffTimer = Math.max(world.shieldBuffTimer, spec.shieldBuffSec);
  }
  if (spec.rapidFireBuffSec) {
    world.rapidFireBuffTimer = Math.max(
      world.rapidFireBuffTimer,
      spec.rapidFireBuffSec
    );
  }
  spawnParticles(world, world.playerX, 1.1, world.playerZ, spec.color, 18, 4.5);
  audio.playFruitEat();
  setBanner(
    world,
    world.lang === 'ar'
      ? `تناولت ${spec.nameAr}! طاقتك الآن ${Math.round(world.energy)}/${world.maxEnergy}`
      : `Ate ${spec.nameEn}! Energy ${Math.round(world.energy)}/${world.maxEnergy}`,
    'shop',
    2.2
  );
  saveMonsterArenaNow(world);
  world.version++;
  return true;
}

export function actionBuyMeat(
  world: MonsterArenaWorld,
  meatId: MeatId,
  audio: MonsterArenaAudio
): boolean {
  const spec = MEAT_SPECS[meatId];
  if (world.pets.length === 0) {
    setBanner(
      world,
      world.lang === 'ar'
        ? 'اشترِ حيواناً أولاً من متجر الحيوانات لإطعامه اللحوم!'
        : 'Buy a battle pet first from the Pets Shop to feed them meat!',
      'warn',
      2.6
    );
    world.version++;
    return false;
  }
  if (world.coins < spec.cost) return false;

  world.coins -= spec.cost;
  world.meatsFed++;

  for (const pet of world.pets) {
    pet.bonusMaxHp += spec.petMaxHpBonus;
    pet.maxHp = getPetMaxHp(pet.petId, pet.level, pet.bonusMaxHp);
    pet.hp = Math.min(pet.maxHp, pet.hp + spec.petHealAmount);
    pet.lungeTimer = 0.25;
    spawnParticles(world, pet.x, 1.0, pet.z, spec.color, 12, 4.4);
  }

  if (spec.buffDurationSec && spec.buffDurationSec > 0) {
    world.petFuryBuffTimer = Math.max(world.petFuryBuffTimer, spec.buffDurationSec);
    if (spec.petDmgBoostPct) {
      world.petFuryDmgPct = Math.max(world.petFuryDmgPct, spec.petDmgBoostPct);
    }
    if (spec.petSpeedBoostPct) {
      world.petFurySpdPct = Math.max(world.petFurySpdPct, spec.petSpeedBoostPct);
    }
  }

  audio.playFruitEat();
  setBanner(
    world,
    world.lang === 'ar'
      ? `🥩 أطعمت ${world.pets.length} حيوانات بـ ${spec.nameAr}! +${spec.petMaxHpBonus} طاقة قصوى دائمة!`
      : `🥩 Fed ${world.pets.length} pet${world.pets.length > 1 ? 's' : ''} ${spec.nameEn}! +${spec.petMaxHpBonus} permanent Max Energy!`,
    'shop',
    2.6
  );
  saveMonsterArenaNow(world);
  world.version++;
  return true;
}

export function actionBuyOrEquipWeapon(
  world: MonsterArenaWorld,
  weaponId: WeaponId,
  audio: MonsterArenaAudio
): boolean {
  const spec = WEAPON_SPECS[weaponId];
  if (world.ownedWeapons.includes(weaponId)) {
    world.activeWeapon = weaponId;
    audio.playBuy();
    setBanner(
      world,
      world.lang === 'ar'
        ? `تم تجهيز ${spec.nameAr}!`
        : `Equipped ${spec.nameEn}!`,
      'shop',
      1.8
    );
    saveMonsterArenaNow(world);
    world.version++;
    return true;
  }
  if (world.coins < spec.cost) return false;
  world.coins -= spec.cost;
  world.ownedWeapons = [...world.ownedWeapons, weaponId];
  world.activeWeapon = weaponId;
  spawnParticles(world, world.playerX, 1.1, world.playerZ, spec.color, 20, 5.0);
  audio.playBuy();
  setBanner(
    world,
    world.lang === 'ar'
      ? `اشتريت وجهّزت ${spec.nameAr}!`
      : `Bought & Equipped ${spec.nameEn}!`,
    'shop',
    2.4
  );
  saveMonsterArenaNow(world);
  world.version++;
  return true;
}

export function actionBuyPet(
  world: MonsterArenaWorld,
  petId: PetId,
  audio: MonsterArenaAudio
): boolean {
  const spec = PET_SPECS[petId];
  if (world.pets.length >= MAX_PET_SQUAD) {
    setBanner(
      world,
      world.lang === 'ar'
        ? 'الفريق ممتلئ (12 حيوان)! ادمج حيوانين متشابهين لإفساح مجال وتقويتهم!'
        : 'Squad full (12 pets)! Merge matching pets to free space & power up!',
      'warn',
      2.6
    );
    world.version++;
    return false;
  }
  if (world.coins < spec.cost) return false;
  world.coins -= spec.cost;
  const freeSlot = findFirstFreePetSlot(world.pets);
  const ang = (freeSlot / MAX_PET_SQUAD) * Math.PI * 2;
  const px = world.playerX + Math.cos(ang) * 2.5;
  const pz = world.playerZ + Math.sin(ang) * 2.5;
  const maxHp = getPetMaxHp(petId, 1, 0);
  world.pets.push({
    id: world.nextId++,
    petId,
    level: 1,
    slot: freeSlot,
    hp: maxHp,
    maxHp,
    bonusMaxHp: 0,
    hitFlash: 0,
    hurtCooldown: 0,
    x: px,
    z: pz,
    guardX: null,
    guardZ: null,
    angle: ang,
    attackCooldown: 0.25,
    animPhase: Math.random() * Math.PI * 2,
    lungeTimer: 0,
  });
  spawnParticles(world, px, 1.0, pz, spec.accentColor, 20, 4.8);
  audio.playBuy();
  const sameLv1Count = world.pets.filter((p) => p.petId === petId && p.level === 1).length;
  setBanner(
    world,
    world.lang === 'ar'
      ? sameLv1Count >= 2
        ? `انضم ${spec.nameAr}! اسحبه على مثيله لدمجه أو اضغط 🔀 دمج!`
        : `انضم إليك ${spec.nameAr} للقتال في الحلبة!`
      : sameLv1Count >= 2
      ? `${spec.nameEn} joined! Drag/move onto a match to Merge! 🔀`
      : `${spec.nameEn} joined your battle squad!`,
    'shop',
    2.6
  );
  saveMonsterArenaNow(world);
  world.version++;
  return true;
}

export function actionMoveOrMergeSlot(
  world: MonsterArenaWorld,
  fromSlot: number,
  toSlot: number,
  audio: MonsterArenaAudio
): boolean {
  if (
    fromSlot === toSlot ||
    fromSlot < 0 ||
    fromSlot >= MAX_PET_SQUAD ||
    toSlot < 0 ||
    toSlot >= MAX_PET_SQUAD
  ) {
    return false;
  }
  const idxA = world.pets.findIndex((p) => p.slot === fromSlot);
  if (idxA === -1) return false;
  const petA = world.pets[idxA];
  const idxB = world.pets.findIndex((p) => p.slot === toSlot);

  if (idxB === -1) {
    // Move / Transfer pet to the empty slot
    petA.slot = toSlot;
    petA.guardX = null;
    petA.guardZ = null;
    audio.playBuy();
    setBanner(
      world,
      world.lang === 'ar'
        ? `📍 تم نقل ${PET_SPECS[petA.petId].nameAr} إلى الخانة ${toSlot + 1}`
        : `📍 Moved ${PET_SPECS[petA.petId].nameEn} to Slot ${toSlot + 1}`,
      'info',
      1.6
    );
    saveMonsterArenaNow(world);
    world.version++;
    return true;
  }

  const petB = world.pets[idxB];
  if (petA.petId === petB.petId && petA.level === petB.level && petB.level < MAX_PET_LEVEL) {
    // Merge petA into petB at toSlot (preserve combined HP ratio & meat bonusMaxHp)
    const avgRatio =
      (petA.hp / Math.max(1, petA.maxHp) + petB.hp / Math.max(1, petB.maxHp)) * 0.5;
    petB.level += 1;
    petB.bonusMaxHp += petA.bonusMaxHp;
    petB.maxHp = getPetMaxHp(petB.petId, petB.level, petB.bonusMaxHp);
    petB.hp = Math.max(1, Math.min(petB.maxHp, Math.round(petB.maxHp * avgRatio)));
    petB.lungeTimer = 0.35;
    const mx = (petA.x + petB.x) * 0.5;
    const mz = (petA.z + petB.z) * 0.5;
    petB.x = mx;
    petB.z = mz;
    if (world.selectedPetId === petA.id) {
      world.selectedPetId = null;
    }
    world.pets.splice(idxA, 1);

    const spec = PET_SPECS[petB.petId];
    spawnParticles(world, mx, 1.2, mz, '#fde047', 24, 5.6);
    spawnParticles(world, mx, 1.1, mz, spec.accentColor, 18, 4.8);
    audio.playMerge();
    setBanner(
      world,
      world.lang === 'ar'
        ? `🔀 تم نقل ودمج ${spec.nameAr} إلى المستوى ${petB.level}! (ضرر ×${getPetDamageMultiplier(petB.level)})`
        : `🔀 Moved & Merged ${spec.nameEn} into Lv.${petB.level}! (×${getPetDamageMultiplier(petB.level)} DMG)`,
      'shop',
      2.8
    );
    saveMonsterArenaNow(world);
    world.version++;
    return true;
  }

  // Swap positions of two different pets
  petA.slot = toSlot;
  petB.slot = fromSlot;
  audio.playBuy();
  saveMonsterArenaNow(world);
  world.version++;
  return true;
}

export function actionSelectOrMerge3DPet(
  world: MonsterArenaWorld,
  petEntityId: number,
  audio: MonsterArenaAudio
): boolean {
  if (world.status !== 'PLAYING') return false;
  const targetIdx = world.pets.findIndex((p) => p.id === petEntityId);
  if (targetIdx === -1) return false;
  const targetPet = world.pets[targetIdx];

  if (world.selectedPetId === null) {
    world.selectedPetId = petEntityId;
    audio.playCoin();
    setBanner(
      world,
      world.lang === 'ar'
        ? `تم تحديد ${PET_SPECS[targetPet.petId].nameAr} Lv.${targetPet.level} — اضغط على مثيله للدمج 🔀 أو على أرض الحلبة لنقله 📍`
        : `Selected ${PET_SPECS[targetPet.petId].nameEn} Lv.${targetPet.level} — Tap a match to Merge 🔀 or the floor to Move 📍`,
      'info',
      3.0
    );
    world.version++;
    return true;
  }

  if (world.selectedPetId === petEntityId) {
    world.selectedPetId = null;
    world.version++;
    return true;
  }

  const selIdx = world.pets.findIndex((p) => p.id === world.selectedPetId);
  if (selIdx === -1) {
    world.selectedPetId = petEntityId;
    world.version++;
    return true;
  }

  const selPet = world.pets[selIdx];
  if (
    selPet.petId === targetPet.petId &&
    selPet.level === targetPet.level &&
    targetPet.level < MAX_PET_LEVEL
  ) {
    // Direct 3D Merge right at targetPet's spot (preserve combined HP ratio & meat bonusMaxHp)
    const avgRatio =
      (selPet.hp / Math.max(1, selPet.maxHp) + targetPet.hp / Math.max(1, targetPet.maxHp)) * 0.5;
    targetPet.level += 1;
    targetPet.bonusMaxHp += selPet.bonusMaxHp;
    targetPet.maxHp = getPetMaxHp(targetPet.petId, targetPet.level, targetPet.bonusMaxHp);
    targetPet.hp = Math.max(1, Math.min(targetPet.maxHp, Math.round(targetPet.maxHp * avgRatio)));
    targetPet.lungeTimer = 0.35;
    const mx = targetPet.x;
    const mz = targetPet.z;
    world.pets.splice(selIdx, 1);
    world.selectedPetId = null;

    const spec = PET_SPECS[targetPet.petId];
    spawnParticles(world, mx, 1.2, mz, '#fde047', 26, 5.8);
    spawnParticles(world, mx, 1.1, mz, spec.accentColor, 20, 4.8);
    audio.playMerge();
    setBanner(
      world,
      world.lang === 'ar'
        ? `🔀 دمج مباشر في الحلبة! ${spec.nameAr} أصبح Lv.${targetPet.level} (ضرر ×${getPetDamageMultiplier(targetPet.level)})`
        : `🔀 3D Arena Merge! ${spec.nameEn} is now Lv.${targetPet.level} (×${getPetDamageMultiplier(targetPet.level)} DMG)`,
      'shop',
      2.8
    );
    saveMonsterArenaNow(world);
    world.version++;
    return true;
  }

  // Otherwise switch selection to the clicked pet
  world.selectedPetId = petEntityId;
  audio.playCoin();
  setBanner(
    world,
    world.lang === 'ar'
      ? `تم تحديد ${PET_SPECS[targetPet.petId].nameAr} Lv.${targetPet.level} — اضغط على مثيله للدمج 🔀 أو على الأرض لنقله 📍`
      : `Selected ${PET_SPECS[targetPet.petId].nameEn} Lv.${targetPet.level} — Tap a match to Merge 🔀 or floor to Move 📍`,
    'info',
    2.6
  );
  world.version++;
  return true;
}

export function actionMoveSelectedPetToArenaPoint(
  world: MonsterArenaWorld,
  x: number,
  z: number,
  audio: MonsterArenaAudio
): boolean {
  if (world.status !== 'PLAYING' || world.selectedPetId === null) return false;
  const pet = world.pets.find((p) => p.id === world.selectedPetId);
  if (!pet) {
    world.selectedPetId = null;
    return false;
  }
  const dist = Math.hypot(x, z);
  const maxR = ARENA_RADIUS - 1.5;
  const cx = dist > maxR ? (x / dist) * maxR : x;
  const cz = dist > maxR ? (z / dist) * maxR : z;

  pet.guardX = cx;
  pet.guardZ = cz;
  pet.lungeTimer = 0.22;
  world.selectedPetId = null;
  spawnParticles(world, cx, 0.7, cz, '#38bdf8', 14, 4.2);
  audio.playBuy();
  setBanner(
    world,
    world.lang === 'ar'
      ? `📍 تم نقل ${PET_SPECS[pet.petId].nameAr} Lv.${pet.level} لحراسة هذا الموقع!`
      : `📍 Moved ${PET_SPECS[pet.petId].nameEn} Lv.${pet.level} to guard this spot!`,
    'info',
    2.0
  );
  saveMonsterArenaNow(world);
  world.version++;
  return true;
}

export function actionClearPetSelection(world: MonsterArenaWorld): void {
  if (world.selectedPetId !== null) {
    world.selectedPetId = null;
    world.version++;
  }
}

export function actionRecallAllPets(
  world: MonsterArenaWorld,
  audio: MonsterArenaAudio
): boolean {
  let recalled = 0;
  for (const p of world.pets) {
    if (p.guardX !== null || p.guardZ !== null) {
      p.guardX = null;
      p.guardZ = null;
      recalled++;
    }
  }
  world.selectedPetId = null;
  if (recalled === 0) return false;
  audio.playDash();
  setBanner(
    world,
    world.lang === 'ar'
      ? '🧲 عادت جميع الحيوانات للتحرك حولك!'
      : '🧲 All battle pets recalled to follow you!',
    'info',
    2.0
  );
  saveMonsterArenaNow(world);
  world.version++;
  return true;
}

export function actionMergePetPair(
  world: MonsterArenaWorld,
  petId: PetId,
  level: number,
  audio: MonsterArenaAudio
): boolean {
  if (level >= MAX_PET_LEVEL) return false;
  const matchingIndices: number[] = [];
  for (let i = 0; i < world.pets.length; i++) {
    const p = world.pets[i];
    if (p.petId === petId && p.level === level) {
      matchingIndices.push(i);
      if (matchingIndices.length === 2) break;
    }
  }
  if (matchingIndices.length < 2) return false;

  const keeper = world.pets[matchingIndices[0]];
  const consumed = world.pets[matchingIndices[1]];
  const avgRatio =
    (keeper.hp / Math.max(1, keeper.maxHp) + consumed.hp / Math.max(1, consumed.maxHp)) * 0.5;
  keeper.level = level + 1;
  keeper.bonusMaxHp += consumed.bonusMaxHp;
  keeper.maxHp = getPetMaxHp(keeper.petId, keeper.level, keeper.bonusMaxHp);
  keeper.hp = Math.max(1, Math.min(keeper.maxHp, Math.round(keeper.maxHp * avgRatio)));
  keeper.lungeTimer = 0.35;
  const mx = (keeper.x + consumed.x) * 0.5;
  const mz = (keeper.z + consumed.z) * 0.5;
  keeper.x = mx;
  keeper.z = mz;
  if (world.selectedPetId === consumed.id) world.selectedPetId = null;
  world.pets.splice(matchingIndices[1], 1);

  const spec = PET_SPECS[petId];
  spawnParticles(world, mx, 1.2, mz, '#fde047', 24, 5.6);
  spawnParticles(world, mx, 1.1, mz, spec.accentColor, 18, 4.8);
  audio.playMerge();
  setBanner(
    world,
    world.lang === 'ar'
      ? `🔀 تم دمج ${spec.nameAr} إلى المستوى ${keeper.level}! (ضرر ×${getPetDamageMultiplier(keeper.level)})`
      : `🔀 Merged ${spec.nameEn} into Lv.${keeper.level}! (×${getPetDamageMultiplier(keeper.level)} DMG)`,
    'shop',
    2.8
  );
  saveMonsterArenaNow(world);
  world.version++;
  return true;
}

export function actionMergeAllPets(
  world: MonsterArenaWorld,
  audio: MonsterArenaAudio
): boolean {
  let mergesDone = 0;
  let keepGoing = true;
  while (keepGoing) {
    keepGoing = false;
    outer: for (let i = 0; i < world.pets.length; i++) {
      const a = world.pets[i];
      if (a.level >= MAX_PET_LEVEL) continue;
      for (let j = i + 1; j < world.pets.length; j++) {
        const b = world.pets[j];
        if (b.petId === a.petId && b.level === a.level) {
          const avgRatio =
            (a.hp / Math.max(1, a.maxHp) + b.hp / Math.max(1, b.maxHp)) * 0.5;
          a.level++;
          a.bonusMaxHp += b.bonusMaxHp;
          a.maxHp = getPetMaxHp(a.petId, a.level, a.bonusMaxHp);
          a.hp = Math.max(1, Math.min(a.maxHp, Math.round(a.maxHp * avgRatio)));
          a.lungeTimer = 0.35;
          const mx = (a.x + b.x) * 0.5;
          const mz = (a.z + b.z) * 0.5;
          a.x = mx;
          a.z = mz;
          if (world.selectedPetId === b.id) world.selectedPetId = null;
          world.pets.splice(j, 1);
          spawnParticles(world, mx, 1.2, mz, '#fde047', 18, 5.4);
          spawnParticles(world, mx, 1.1, mz, PET_SPECS[a.petId].accentColor, 14, 4.6);
          mergesDone++;
          keepGoing = true;
          break outer;
        }
      }
    }
  }
  if (mergesDone === 0) return false;
  audio.playMerge();
  setBanner(
    world,
    world.lang === 'ar'
      ? `🔀 تم تنفيذ ${mergesDone} عملية دمج للحيوانات بنجاح! فريقك أصبح أقوى بكثير!`
      : `🔀 Completed ${mergesDone} Pet Merge${mergesDone > 1 ? 's' : ''}! Your squad powered up!`,
    'shop',
    2.8
  );
  saveMonsterArenaNow(world);
  world.version++;
  return true;
}

function pickMonsterKindForWave(wave: number): ArenaMonsterKind {
  const r = Math.random();
  if (wave === 1) {
    return r < 0.62 ? 'imp' : 'goblin';
  }
  if (wave === 2) {
    if (r < 0.35) return 'imp';
    if (r < 0.72) return 'goblin';
    return 'crawler';
  }
  if (wave === 3) {
    if (r < 0.2) return 'imp';
    if (r < 0.45) return 'goblin';
    if (r < 0.72) return 'crawler';
    return 'brute';
  }
  if (wave <= 5) {
    if (r < 0.16) return 'goblin';
    if (r < 0.36) return 'crawler';
    if (r < 0.58) return 'brute';
    if (r < 0.8) return 'wraith';
    return 'minotaur';
  }
  if (r < 0.12) return 'imp';
  if (r < 0.25) return 'goblin';
  if (r < 0.42) return 'crawler';
  if (r < 0.6) return 'brute';
  if (r < 0.8) return 'wraith';
  return 'minotaur';
}

function spawnArenaMonster(
  world: MonsterArenaWorld,
  kind: ArenaMonsterKind,
  opts?: { x?: number; z?: number; hpMul?: number }
): void {
  const spec = ARENA_MONSTER_SPECS[kind];
  const ang = Math.random() * Math.PI * 2;
  const dist = ARENA_RADIUS - 1.4;
  const x = opts?.x ?? Math.cos(ang) * dist;
  const z = opts?.z ?? Math.sin(ang) * dist;
  const waveMul = 1 + (world.wave - 1) * 0.2;
  const maxHp = Math.round(spec.baseHp * waveMul * (opts?.hpMul ?? 1));

  world.monsters.push({
    id: world.nextId++,
    kind,
    x,
    z,
    angle: Math.atan2(world.playerX - x, world.playerZ - z),
    hp: maxHp,
    maxHp,
    speed: spec.speed * (1 + Math.min(0.45, (world.wave - 1) * 0.03)),
    hitFlash: 0,
    slowTimer: 0,
    poisonTimer: 0,
    poisonDps: 0,
    attackCooldown: 0.4,
    rangedCooldown: kind === 'titanBoss' ? 2.4 : kind === 'warlordBoss' ? 2.2 : 2.6,
    summonCooldown: kind === 'titanBoss' ? 7.5 : kind === 'warlordBoss' ? 9.5 : 0,
    walkPhase: Math.random() * Math.PI * 2,
  });
}

function spawnThreeMinuteWarlordBoss(
  world: MonsterArenaWorld,
  audio: MonsterArenaAudio
): void {
  world.warlordLevel++;
  const hpMul = 1 + (world.warlordLevel - 1) * 0.42;
  const oppositeAng =
    Math.atan2(-world.playerZ, -world.playerX) + (Math.random() - 0.5) * 0.7;
  const bx = Math.cos(oppositeAng) * (ARENA_RADIUS - 3.0);
  const bz = Math.sin(oppositeAng) * (ARENA_RADIUS - 3.0);

  spawnArenaMonster(world, 'warlordBoss', { x: bx, z: bz, hpMul });
  // Spawn 1 rock brute escort
  const gx = Math.cos(oppositeAng + 0.28) * (ARENA_RADIUS - 2.8);
  const gz = Math.sin(oppositeAng + 0.28) * (ARENA_RADIUS - 2.8);
  spawnArenaMonster(world, 'brute', { x: gx, z: gz, hpMul: 1.05 });

  world.shakeTimer = 0.55;
  world.shakeIntensity = 0.28;
  spawnParticles(world, bx, 1.5, bz, '#f97316', 24, 5.4);
  spawnParticles(world, bx, 1.2, bz, '#fde047', 16, 4.6);
  audio.playTitanSpawn();
  setBanner(
    world,
    world.lang === 'ar'
      ? `🔥 وحش الـ 3 دقائق القوي «سيد الحمم» (مستوى ${world.warlordLevel}) اقتحم الحلبة!`
      : `🔥 3-Min Boss «Inferno Warlord» (Lv.${world.warlordLevel}) entered the Arena!`,
    'boss',
    4.0
  );
  world.version++;
}

function spawnTenMinuteTitanBoss(
  world: MonsterArenaWorld,
  audio: MonsterArenaAudio
): void {
  world.titanLevel++;
  const hpMul = 1 + (world.titanLevel - 1) * 0.55;
  // Spawn opposite side of player inside the arena rim
  const oppositeAng = Math.atan2(-world.playerZ, -world.playerX) + (Math.random() - 0.5) * 0.6;
  const bx = Math.cos(oppositeAng) * (ARENA_RADIUS - 3.2);
  const bz = Math.sin(oppositeAng) * (ARENA_RADIUS - 3.2);

  spawnArenaMonster(world, 'titanBoss', { x: bx, z: bz, hpMul });
  // Spawn 2 royal minotaur guards alongside the Titan
  for (let i = -1; i <= 1; i += 2) {
    const gx = Math.cos(oppositeAng + i * 0.25) * (ARENA_RADIUS - 3.0);
    const gz = Math.sin(oppositeAng + i * 0.25) * (ARENA_RADIUS - 3.0);
    spawnArenaMonster(world, 'minotaur', { x: gx, z: gz, hpMul: 1.1 });
  }

  world.shakeTimer = 0.85;
  world.shakeIntensity = 0.42;
  spawnParticles(world, bx, 1.8, bz, '#f43f5e', 30, 6.2);
  spawnParticles(world, bx, 1.4, bz, '#f59e0b', 22, 5.2);
  audio.playTitanSpawn();
  setBanner(
    world,
    world.lang === 'ar'
      ? `🔥 وحش الـ 10 دقائق «الطاغية الأبدي» (مستوى ${world.titanLevel}) دخل الحلبة!`
      : `🔥 10-Min Boss «Eternal Dread Titan» (Lv.${world.titanLevel}) has entered!`,
    'boss',
    4.5
  );
  world.version++;
}

function damageMonster(
  m: ArenaMonsterEntity,
  damage: number,
  slowDuration = 0,
  poisonDps = 0,
  poisonDuration = 0
): void {
  m.hp -= damage;
  m.hitFlash = 1;
  if (slowDuration > 0) {
    m.slowTimer = Math.max(m.slowTimer, slowDuration);
  }
  if (poisonDps > 0 && poisonDuration > 0) {
    m.poisonTimer = Math.max(m.poisonTimer, poisonDuration);
    m.poisonDps = Math.max(m.poisonDps, poisonDps);
  }
}

function damagePet(
  world: MonsterArenaWorld,
  petIndex: number,
  rawDamage: number,
  audio: MonsterArenaAudio
): boolean {
  const pet = world.pets[petIndex];
  if (!pet || pet.hurtCooldown > 0) return false;
  const dmg = Math.max(
    1,
    world.shieldBuffTimer > 0 ? Math.round(rawDamage * 0.6) : Math.round(rawDamage)
  );
  pet.hp = Math.max(0, pet.hp - dmg);
  pet.hitFlash = 1;
  pet.hurtCooldown = 0.52;
  spawnParticles(world, pet.x, 0.85, pet.z, '#ef4444', 8, 3.8);
  audio.playHurt();

  if (pet.hp <= 0) {
    const spec = PET_SPECS[pet.petId];
    const px = pet.x;
    const pz = pet.z;
    if (world.selectedPetId === pet.id) {
      world.selectedPetId = null;
    }
    world.pets.splice(petIndex, 1);
    spawnParticles(world, px, 1.0, pz, '#ef4444', 20, 5.4);
    spawnParticles(world, px, 0.9, pz, spec.accentColor, 14, 4.5);
    setBanner(
      world,
      world.lang === 'ar'
        ? `💀 مات ${spec.nameAr} (Lv.${pet.level}) بسبب الوحوش!`
        : `💀 ${spec.nameEn} (Lv.${pet.level}) was slain by monsters!`,
      'warn',
      3.0
    );
    saveMonsterArenaNow(world);
    world.version++;
    return true;
  }
  return false;
}

function findNearestMonster(
  world: MonsterArenaWorld,
  fromX: number,
  fromZ: number,
  maxRange: number
): ArenaMonsterEntity | null {
  let best: ArenaMonsterEntity | null = null;
  let bestDistSq = maxRange * maxRange;
  for (const m of world.monsters) {
    if (m.hp <= 0) continue;
    const dx = m.x - fromX;
    const dz = m.z - fromZ;
    const d2 = dx * dx + dz * dz;
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      best = m;
    }
  }
  return best;
}

export function stepMonsterArenaWorld(
  world: MonsterArenaWorld,
  rawDt: number,
  input: MonsterArenaInput,
  audio: MonsterArenaAudio
): boolean {
  const dt = Math.min(rawDt, 0.05);
  world.elapsed += dt;

  // Always animate particles
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const pt = world.particles[i];
    pt.life -= dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.z += pt.vz * dt;
    pt.vy -= 9.5 * dt;
    if (pt.y < 0.08) {
      pt.y = 0.08;
      pt.vy *= -0.35;
    }
    if (pt.life <= 0) {
      world.particles.splice(i, 1);
    }
  }

  if (world.status !== 'PLAYING') return false;

  if (world.bannerTimer > 0) {
    world.bannerTimer = Math.max(0, world.bannerTimer - dt);
    if (world.bannerTimer === 0) world.bannerText = '';
  }
  if (world.shakeTimer > 0) world.shakeTimer = Math.max(0, world.shakeTimer - dt);
  if (world.playerRecoil > 0) world.playerRecoil = Math.max(0, world.playerRecoil - dt * 6);
  if (world.playerHurtFlash > 0)
    world.playerHurtFlash = Math.max(0, world.playerHurtFlash - dt * 4.5);
  if (world.invulnTimer > 0) world.invulnTimer = Math.max(0, world.invulnTimer - dt);
  if (world.dashCooldown > 0) world.dashCooldown = Math.max(0, world.dashCooldown - dt);
  if (world.speedBuffTimer > 0) world.speedBuffTimer = Math.max(0, world.speedBuffTimer - dt);
  if (world.damageBuffTimer > 0) world.damageBuffTimer = Math.max(0, world.damageBuffTimer - dt);
  if (world.shieldBuffTimer > 0) world.shieldBuffTimer = Math.max(0, world.shieldBuffTimer - dt);
  if (world.rapidFireBuffTimer > 0)
    world.rapidFireBuffTimer = Math.max(0, world.rapidFireBuffTimer - dt);
  if (world.petFuryBuffTimer > 0) {
    world.petFuryBuffTimer = Math.max(0, world.petFuryBuffTimer - dt);
    if (world.petFuryBuffTimer === 0) {
      world.petFuryDmgPct = 0;
      world.petFurySpdPct = 0;
    }
  }

  // 1a) 3-Minute Strong Boss Countdown (Inferno Warlord)
  world.warlordTimer -= dt;
  if (!world.warlordWarned20 && world.warlordTimer <= 20 && world.warlordTimer > 0) {
    world.warlordWarned20 = true;
    setBanner(
      world,
      world.lang === 'ar'
        ? '⚠️ تبقى 20 ثانية على ظهور وحش الـ 3 دقائق القوي «سيد الحمم»!'
        : '⚠️ 20s until the 3-Min Inferno Warlord spawns!',
      'warn',
      3.0
    );
  }
  if (world.warlordTimer <= 0) {
    world.warlordTimer = WARLORD_BOSS_INTERVAL_SEC;
    world.warlordWarned20 = false;
    spawnThreeMinuteWarlordBoss(world, audio);
  }

  // 1b) 10-Minute Strong Boss Countdown (Eternal Dread Titan)
  world.titanTimer -= dt;
  if (!world.titanWarned30 && world.titanTimer <= 30 && world.titanTimer > 0) {
    world.titanWarned30 = true;
    setBanner(
      world,
      world.lang === 'ar'
        ? '⚠️ تبقى 30 ثانية على ظهور وحش الـ 10 دقائق القوي! جهّز أسلحتك وطاقتك!'
        : '⚠️ 30s until the 10-Min Dread Titan spawns! Stock up on fruits & gear!',
      'warn',
      3.5
    );
  }
  if (world.titanTimer <= 0) {
    world.titanTimer = TITAN_BOSS_INTERVAL_SEC;
    world.titanWarned30 = false;
    spawnTenMinuteTitanBoss(world, audio);
  }

  // Auto-save run & exact boss timers every 1 second so exiting never loses timer progress
  world.autoSaveTimer -= dt;
  if (world.autoSaveTimer <= 0) {
    world.autoSaveTimer = 1.0;
    saveMonsterArenaNow(world);
  }

  // 2) Player Movement & Dash
  const moveSpeed = 7.4 * (world.speedBuffTimer > 0 ? 1.28 : 1.0);
  if (world.dashTimer > 0) {
    world.dashTimer = Math.max(0, world.dashTimer - dt);
    world.playerX += world.dashDirX * 20.5 * dt;
    world.playerZ += world.dashDirZ * 20.5 * dt;
    world.playerWalkPhase += dt * 16;
  } else {
    let mx = input.moveX;
    let mz = input.moveZ;
    const mag = Math.hypot(mx, mz);
    if (mag > 0.05) {
      if (mag > 1) {
        mx /= mag;
        mz /= mag;
      }
      world.playerX += mx * moveSpeed * dt;
      world.playerZ += mz * moveSpeed * dt;
      world.playerWalkPhase += dt * (10.5 * Math.min(1, mag));
    }
  }

  // Clamp hero inside circular arena rim
  const maxR = ARENA_RADIUS - 1.2;
  const distFromCenter = Math.hypot(world.playerX, world.playerZ);
  if (distFromCenter > maxR) {
    world.playerX = (world.playerX / distFromCenter) * maxR;
    world.playerZ = (world.playerZ / distFromCenter) * maxR;
  }

  // 3) Auto-Aim & Auto-Fire Active Weapon
  const weapon = WEAPON_SPECS[world.activeWeapon];
  const nearestTarget = findNearestMonster(
    world,
    world.playerX,
    world.playerZ,
    weapon.range
  );
  if (nearestTarget) {
    world.playerAngle = Math.atan2(
      nearestTarget.x - world.playerX,
      nearestTarget.z - world.playerZ
    );
  } else if (Math.hypot(input.moveX, input.moveZ) > 0.1) {
    world.playerAngle = Math.atan2(input.moveX, input.moveZ);
  }

  const fireRateMul = world.rapidFireBuffTimer > 0 ? 1.35 : 1.0;
  const dmgBuffMul = world.damageBuffTimer > 0 ? 1.25 : 1.0;
  world.fireCooldown -= dt * fireRateMul;
  if (world.fireCooldown <= 0 && nearestTarget) {
    world.fireCooldown = weapon.fireInterval;
    world.playerRecoil = 1;
    const baseAngle = Math.atan2(
      nearestTarget.x - world.playerX,
      nearestTarget.z - world.playerZ
    );
    const dmg = Math.round(weapon.damage * dmgBuffMul);
    for (let p = 0; p < weapon.pellets; p++) {
      const t = weapon.pellets === 1 ? 0 : p / (weapon.pellets - 1) - 0.5;
      const shotAng = baseAngle + t * weapon.spreadAngle;
      world.projectiles.push({
        id: world.nextId++,
        fromEnemy: false,
        x: world.playerX + Math.sin(shotAng) * 0.9,
        y: 1.05,
        z: world.playerZ + Math.cos(shotAng) * 0.9,
        vx: Math.sin(shotAng) * weapon.projectileSpeed,
        vz: Math.cos(shotAng) * weapon.projectileSpeed,
        damage: dmg,
        color: weapon.color,
        size: weapon.splashRadius > 2 ? 0.3 : 0.2,
        life: weapon.range / weapon.projectileSpeed + 0.12,
        splashRadius: weapon.splashRadius,
        slowDuration: weapon.slowDuration,
        poisonDps: Math.round(weapon.poisonDps * dmgBuffMul),
        poisonDuration: weapon.poisonDuration,
        pierceLeft: weapon.pierce,
        hitIds: [],
      });
    }
    audio.playShoot(weapon.splashRadius >= 2 || weapon.pellets >= 4);
  }

  // 4) Update Companion Battle Pets
  const petCount = world.pets.length;
  const petDmgMul = world.petFuryBuffTimer > 0 ? 1 + world.petFuryDmgPct / 100 : 1;
  const petSpdMul = world.petFuryBuffTimer > 0 ? 1 + world.petFurySpdPct / 100 : 1;
  world.pets.forEach((pet) => {
    const spec = PET_SPECS[pet.petId];
    const lvMul = getPetDamageMultiplier(pet.level);
    pet.animPhase += dt * (spec.flying ? 11 : 8.5);
    if (pet.lungeTimer > 0) pet.lungeTimer = Math.max(0, pet.lungeTimer - dt);
    if (pet.attackCooldown > 0) pet.attackCooldown -= dt;
    if (pet.hitFlash > 0) pet.hitFlash = Math.max(0, pet.hitFlash - dt * 5.0);
    if (pet.hurtCooldown > 0) pet.hurtCooldown = Math.max(0, pet.hurtCooldown - dt);

    const orbitRadius = petCount > 6 ? 3.25 : 2.75;
    const orbitAng = world.elapsed * 0.65 + (pet.slot / MAX_PET_SQUAD) * Math.PI * 2;
    const hasCustomGuard = pet.guardX !== null && pet.guardZ !== null;
    const homeX = hasCustomGuard ? (pet.guardX as number) : world.playerX + Math.cos(orbitAng) * orbitRadius;
    const homeZ = hasCustomGuard ? (pet.guardZ as number) : world.playerZ + Math.sin(orbitAng) * orbitRadius;

    const searchOriginX = hasCustomGuard ? homeX : world.playerX;
    const searchOriginZ = hasCustomGuard ? homeZ : world.playerZ;
    const target = findNearestMonster(world, searchOriginX, searchOriginZ, spec.range + 2.5);

    if (spec.style === 'melee' && target) {
      const dx = target.x - pet.x;
      const dz = target.z - pet.z;
      const dist = Math.hypot(dx, dz);
      const reach = ARENA_MONSTER_SPECS[target.kind].radius + 0.95;
      pet.angle = Math.atan2(dx, dz);
      if (dist > reach) {
        const step = Math.min(dist - reach * 0.5, spec.speed * dt);
        pet.x += (dx / dist) * step;
        pet.z += (dz / dist) * step;
      } else if (pet.attackCooldown <= 0) {
        pet.attackCooldown = spec.attackInterval / ((1 + (pet.level - 1) * 0.12) * petSpdMul);
        pet.lungeTimer = 0.2;
        const dmg = Math.round(spec.damage * lvMul * petDmgMul);
        damageMonster(target, dmg, spec.slowDuration);
        if (spec.splashRadius > 0) {
          for (const other of world.monsters) {
            if (other.id === target.id || other.hp <= 0) continue;
            const od = Math.hypot(other.x - target.x, other.z - target.z);
            if (od <= spec.splashRadius) {
              damageMonster(other, Math.round(dmg * 0.65), spec.slowDuration);
            }
          }
        }
        spawnParticles(world, target.x, 0.9, target.z, spec.accentColor, 8, 3.8);
      }
    } else {
      // Follow smoothly near hero orbit slot
      const dx = homeX - pet.x;
      const dz = homeZ - pet.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.15) {
        const move = Math.min(dist, (spec.speed + 2.2) * dt);
        pet.x += (dx / dist) * move;
        pet.z += (dz / dist) * move;
      }
      if (target) {
        pet.angle = Math.atan2(target.x - pet.x, target.z - pet.z);
        if (spec.style === 'ranged' && pet.attackCooldown <= 0) {
          pet.attackCooldown = spec.attackInterval / ((1 + (pet.level - 1) * 0.14) * petSpdMul);
          pet.lungeTimer = 0.18;
          const dmg = Math.round(spec.damage * lvMul * petDmgMul);
          const ang = Math.atan2(target.x - pet.x, target.z - pet.z);
          world.projectiles.push({
            id: world.nextId++,
            fromEnemy: false,
            x: pet.x,
            y: spec.flying ? 1.85 : 0.95,
            z: pet.z,
            vx: Math.sin(ang) * 22,
            vz: Math.cos(ang) * 22,
            damage: dmg,
            color: spec.accentColor,
            size: spec.splashRadius > 2 ? 0.27 : 0.19,
            life: 0.9,
            splashRadius: spec.splashRadius,
            slowDuration: spec.slowDuration,
            poisonDps: 0,
            poisonDuration: 0,
            pierceLeft: 0,
            hitIds: [],
          });
        }
      } else if (dist > 0.25) {
        pet.angle = Math.atan2(dx, dz);
      }
    }
  });

  // 5) Spawn Regular Arena Monsters
  const maxActiveMonsters = Math.min(26, 8 + world.wave * 2);
  const nonBossCount = world.monsters.filter(
    (m) => m.kind !== 'titanBoss' && m.kind !== 'warlordBoss'
  ).length;
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0 && nonBossCount < maxActiveMonsters) {
    const kind = pickMonsterKindForWave(world.wave);
    spawnArenaMonster(world, kind);
    world.spawnTimer = Math.max(0.55, 1.85 - world.wave * 0.085);
  }

  // 6) Update Projectiles & Collisions
  for (let i = world.projectiles.length - 1; i >= 0; i--) {
    const proj = world.projectiles[i];
    proj.x += proj.vx * dt;
    proj.z += proj.vz * dt;
    proj.life -= dt;

    if (
      proj.life <= 0 ||
      Math.hypot(proj.x, proj.z) > ARENA_RADIUS + 2
    ) {
      world.projectiles.splice(i, 1);
      continue;
    }

    if (proj.fromEnemy) {
      const distP = Math.hypot(proj.x - world.playerX, proj.z - world.playerZ);
      if (distP <= 0.95 + proj.size) {
        if (world.invulnTimer <= 0) {
          const dmg =
            world.shieldBuffTimer > 0
              ? Math.round(proj.damage * 0.35)
              : proj.damage;
          world.energy = Math.max(0, world.energy - dmg);
          world.playerHurtFlash = 1;
          world.invulnTimer = 0.45;
          world.shakeTimer = 0.2;
          world.shakeIntensity = 0.2;
          spawnParticles(world, world.playerX, 1.0, world.playerZ, '#ef4444', 10, 4.0);
          audio.playHurt();
        }
        world.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with Companion Battle Pets (pets can take projectile hits & die!)
      let hitPet = false;
      for (let pi = world.pets.length - 1; pi >= 0; pi--) {
        const pet = world.pets[pi];
        const distPet = Math.hypot(proj.x - pet.x, proj.z - pet.z);
        if (distPet <= 0.88 + proj.size) {
          damagePet(world, pi, proj.damage, audio);
          world.projectiles.splice(i, 1);
          hitPet = true;
          break;
        }
      }
      if (hitPet) continue;
      continue;
    }

    let consumed = false;
    for (const m of world.monsters) {
      if (m.hp <= 0 || proj.hitIds.includes(m.id)) continue;
      const mSpec = ARENA_MONSTER_SPECS[m.kind];
      const dist = Math.hypot(m.x - proj.x, m.z - proj.z);
      if (dist <= mSpec.radius + proj.size + 0.18) {
        proj.hitIds.push(m.id);
        damageMonster(
          m,
          proj.damage,
          proj.slowDuration,
          proj.poisonDps,
          proj.poisonDuration
        );
        if (proj.splashRadius > 0) {
          for (const other of world.monsters) {
            if (other.id === m.id || other.hp <= 0) continue;
            if (Math.hypot(other.x - m.x, other.z - m.z) <= proj.splashRadius) {
              damageMonster(
                other,
                Math.round(proj.damage * 0.6),
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
          proj.splashRadius > 1.5 ? 9 : 4,
          3.4
        );
        if (proj.pierceLeft > 0) {
          proj.pierceLeft--;
        } else {
          consumed = true;
          break;
        }
      }
    }
    if (consumed) {
      world.projectiles.splice(i, 1);
    }
  }

  // 7) Update Monsters (Movement, Ranged Shots, Boss Summons, Contact Damage, Drops)
  const totalCoinBonusPct = world.pets.reduce(
    (sum, p) => sum + (PET_SPECS[p.petId].coinBonusPct ?? 0) * p.level,
    0
  );
  const coinBonusMul = 1 + Math.min(2.5, totalCoinBonusPct / 100);

  for (let i = world.monsters.length - 1; i >= 0; i--) {
    const m = world.monsters[i];
    const spec = ARENA_MONSTER_SPECS[m.kind];

    if (m.poisonTimer > 0 && m.poisonDps > 0) {
      m.poisonTimer = Math.max(0, m.poisonTimer - dt);
      m.hp -= m.poisonDps * dt;
    }

    if (m.hp <= 0) {
      const waveCoinMul = 1 + Math.min(1.6, (world.wave - 1) * 0.1);
      const rewardCoins = Math.round(spec.rewardCoins * waveCoinMul * coinBonusMul);
      world.score += spec.rewardScore;
      world.kills++;
      world.waveKills++;

      if (m.kind === 'titanBoss') {
        world.titansDefeated++;
        world.coins += rewardCoins;
        saveMonsterArenaStats({
          bestScore: Math.max(world.bestScore, world.score),
          bestWave: Math.max(world.bestWave, world.wave),
          bestKills: Math.max(world.bestKills, world.kills),
          titansDefeated: world.titansDefeated,
        });
        setBanner(
          world,
          world.lang === 'ar'
            ? `🏆 هزمت الطاغية الأبدي! +${rewardCoins.toLocaleString()} عملة!`
            : `🏆 Eternal Dread Titan Slain! +${rewardCoins.toLocaleString()} Coins!`,
          'boss',
          4.0
        );
        spawnParticles(world, m.x, 1.5, m.z, '#fde047', 28, 6.5);
        spawnParticles(world, m.x, 1.4, m.z, '#f43f5e', 24, 5.5);
        audio.playKill(true);
      } else if (m.kind === 'warlordBoss') {
        world.coins += rewardCoins;
        setBanner(
          world,
          world.lang === 'ar'
            ? `🔥 هزمت وحش الـ 3 دقائق «سيد الحمم»! +${rewardCoins.toLocaleString()} عملة!`
            : `🔥 Inferno Warlord Slain! +${rewardCoins.toLocaleString()} Coins!`,
          'boss',
          3.4
        );
        spawnParticles(world, m.x, 1.3, m.z, '#f97316', 22, 5.6);
        spawnParticles(world, m.x, 1.3, m.z, '#fde047', 18, 5.0);
        audio.playKill(true);
      } else {
        // Drop collectible coin pickup (and occasional energy berry)
        world.pickups.push({
          id: world.nextId++,
          kind: 'coin',
          x: m.x,
          z: m.z,
          value: rewardCoins,
          life: 18,
          phase: Math.random() * Math.PI * 2,
        });
        if (Math.random() < 0.09) {
          world.pickups.push({
            id: world.nextId++,
            kind: 'berry',
            x: m.x + (Math.random() - 0.5) * 0.9,
            z: m.z + (Math.random() - 0.5) * 0.9,
            value: 20,
            life: 16,
            phase: Math.random() * Math.PI * 2,
          });
        }
        spawnParticles(world, m.x, 0.9, m.z, spec.accentColor, 9, 3.8);
        audio.playKill(false);
      }

      // Check Wave advancement
      if (world.waveKills >= world.waveTargetKills) {
        world.wave++;
        world.waveKills = 0;
        world.waveTargetKills = waveTargetFor(world.wave);
        const waveBonus = 25 + world.wave * 10;
        world.coins += waveBonus;
        setBanner(
          world,
          world.lang === 'ar'
            ? `⭐ وصلت الموجة ${world.wave}! مكافأة +${waveBonus} عملة`
            : `⭐ Wave ${world.wave} Reached! +${waveBonus} Bonus Coins`,
          'info',
          2.6
        );
        saveMonsterArenaNow(world);
      }

      persistStatsIfNeeded(world);
      world.monsters.splice(i, 1);
      continue;
    }

    if (m.hitFlash > 0) m.hitFlash = Math.max(0, m.hitFlash - dt * 5.5);
    if (m.slowTimer > 0) m.slowTimer = Math.max(0, m.slowTimer - dt);
    if (m.attackCooldown > 0) m.attackCooldown -= dt;

    const slowMul = m.slowTimer > 0 ? 0.55 : 1.0;
    const dxPlayer = world.playerX - m.x;
    const dzPlayer = world.playerZ - m.z;
    const distPlayer = Math.hypot(dxPlayer, dzPlayer) || 0.001;

    // Monsters can aggro onto the closest companion pet if it is closer than the Hero (within 8.5m)
    let targetPetIdx = -1;
    let targetPetDist = Infinity;
    for (let pi = 0; pi < world.pets.length; pi++) {
      const pet = world.pets[pi];
      const pd = Math.hypot(pet.x - m.x, pet.z - m.z);
      if (pd < targetPetDist) {
        targetPetDist = pd;
        targetPetIdx = pi;
      }
    }

    const chasePet =
      targetPetIdx !== -1 &&
      targetPetDist < distPlayer * 0.92 &&
      targetPetDist <= 8.5;

    const targetX = chasePet ? world.pets[targetPetIdx].x : world.playerX;
    const targetZ = chasePet ? world.pets[targetPetIdx].z : world.playerZ;
    const dx = targetX - m.x;
    const dz = targetZ - m.z;
    const dist = Math.hypot(dx, dz) || 0.001;
    m.angle = Math.atan2(dx, dz);

    const stopDist = m.kind === 'wraith' ? 6.5 : spec.radius + 0.65;
    if (dist > stopDist) {
      m.x += (dx / dist) * m.speed * slowMul * dt;
      m.z += (dz / dist) * m.speed * slowMul * dt;
      m.walkPhase += dt * (spec.flying ? 11 : 8) * slowMul;
    }

    // Contact bite against Hero OR nearby Companion Pet
    if (m.attackCooldown <= 0) {
      const rawDmg = Math.round(spec.contactDamage * (1 + (world.wave - 1) * 0.06));
      if (targetPetIdx !== -1 && targetPetDist <= spec.radius + 0.85 && targetPetDist <= distPlayer) {
        m.attackCooldown = 0.85;
        damagePet(world, targetPetIdx, rawDmg, audio);
      } else if (distPlayer <= spec.radius + 0.78) {
        m.attackCooldown = 0.85;
        if (world.invulnTimer <= 0) {
          const dmg = world.shieldBuffTimer > 0 ? Math.round(rawDmg * 0.35) : rawDmg;
          world.energy = Math.max(0, world.energy - dmg);
          world.playerHurtFlash = 1;
          world.invulnTimer = 0.45;
          world.shakeTimer = 0.22;
          world.shakeIntensity =
            m.kind === 'titanBoss' ? 0.35 : m.kind === 'warlordBoss' ? 0.27 : 0.18;
          spawnParticles(world, world.playerX, 1.0, world.playerZ, '#ef4444', 10, 4.2);
          audio.playHurt();
        }
      } else if (targetPetIdx !== -1 && targetPetDist <= spec.radius + 0.85) {
        m.attackCooldown = 0.85;
        damagePet(world, targetPetIdx, rawDmg, audio);
      }
    }

    // Wraith, 3-Min Warlord Boss & 10-Min Titan Boss ranged attacks
    if (spec.ranged) {
      m.rangedCooldown -= dt;
      if (m.rangedCooldown <= 0) {
        if (m.kind === 'titanBoss') {
          m.rangedCooldown = 2.6;
          const burst = 8;
          const baseAng = Math.atan2(dx, dz);
          for (let b = 0; b < burst; b++) {
            const ang = baseAng + (b / burst) * Math.PI * 2;
            world.projectiles.push({
              id: world.nextId++,
              fromEnemy: true,
              x: m.x,
              y: 1.6,
              z: m.z,
              vx: Math.sin(ang) * 10.5,
              vz: Math.cos(ang) * 10.5,
              damage: 24,
              color: '#f43f5e',
              size: 0.32,
              life: 2.3,
              splashRadius: 0,
              slowDuration: 0,
              poisonDps: 0,
              poisonDuration: 0,
              pierceLeft: 0,
              hitIds: [],
            });
          }
          spawnParticles(world, m.x, 1.6, m.z, '#f43f5e', 14, 4.5);
        } else if (m.kind === 'warlordBoss') {
          m.rangedCooldown = 2.4;
          const fanCount = 5;
          const baseAng = Math.atan2(dx, dz);
          for (let b = 0; b < fanCount; b++) {
            const offset = (b - (fanCount - 1) / 2) * 0.22;
            const ang = baseAng + offset;
            world.projectiles.push({
              id: world.nextId++,
              fromEnemy: true,
              x: m.x,
              y: 1.35,
              z: m.z,
              vx: Math.sin(ang) * 11.6,
              vz: Math.cos(ang) * 11.6,
              damage: 20,
              color: '#fb923c',
              size: 0.28,
              life: 2.1,
              splashRadius: 0,
              slowDuration: 0,
              poisonDps: 0,
              poisonDuration: 0,
              pierceLeft: 0,
              hitIds: [],
            });
          }
          spawnParticles(world, m.x, 1.35, m.z, '#fb923c', 12, 4.2);
        } else if (dist < 15) {
          m.rangedCooldown = 2.9;
          const ang = Math.atan2(dx, dz);
          world.projectiles.push({
            id: world.nextId++,
            fromEnemy: true,
            x: m.x,
            y: 1.25,
            z: m.z,
            vx: Math.sin(ang) * 11,
            vz: Math.cos(ang) * 11,
            damage: 14,
            color: '#67e8f9',
            size: 0.22,
            life: 1.9,
            splashRadius: 0,
            slowDuration: 0,
            poisonDps: 0,
            poisonDuration: 0,
            pierceLeft: 0,
            hitIds: [],
          });
        }
      }
    }

    // Boss minion summons (3-Min Warlord & 10-Min Titan) — radially clamped inside circular arena
    const clampSummonPos = (rawX: number, rawZ: number) => {
      const limitR = ARENA_RADIUS - 1.5;
      const r = Math.hypot(rawX, rawZ);
      if (r > limitR && r > 0.001) {
        return { x: (rawX / r) * limitR, z: (rawZ / r) * limitR };
      }
      return { x: rawX, z: rawZ };
    };
    if (m.kind === 'titanBoss') {
      m.summonCooldown -= dt;
      if (m.summonCooldown <= 0 && world.monsters.length < 28) {
        m.summonCooldown = 8.5;
        for (let s = 0; s < 2; s++) {
          const sa = Math.random() * Math.PI * 2;
          const pos = clampSummonPos(m.x + Math.cos(sa) * 3.0, m.z + Math.sin(sa) * 3.0);
          spawnArenaMonster(world, s === 0 ? 'crawler' : 'brute', pos);
        }
        spawnParticles(world, m.x, 1.6, m.z, '#c084fc', 16, 4.5);
      }
    } else if (m.kind === 'warlordBoss') {
      m.summonCooldown -= dt;
      if (m.summonCooldown <= 0 && world.monsters.length < 26) {
        m.summonCooldown = 9.5;
        const sa = Math.random() * Math.PI * 2;
        const pos = clampSummonPos(m.x + Math.cos(sa) * 2.6, m.z + Math.sin(sa) * 2.6);
        spawnArenaMonster(world, Math.random() < 0.5 ? 'imp' : 'crawler', pos);
        spawnParticles(world, m.x, 1.3, m.z, '#f97316', 10, 4.0);
      }
    }
  }

  // 8) Update Pickups (Magnetic pull toward Hero)
  for (let i = world.pickups.length - 1; i >= 0; i--) {
    const pk = world.pickups[i];
    pk.life -= dt;
    pk.phase += dt * 4.5;
    if (pk.life <= 0) {
      world.pickups.splice(i, 1);
      continue;
    }
    const dx = world.playerX - pk.x;
    const dz = world.playerZ - pk.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 4.6 && dist > 0.05) {
      const pull = 12.5 * dt;
      pk.x += (dx / dist) * pull;
      pk.z += (dz / dist) * pull;
    }
    if (dist <= 1.05) {
      if (pk.kind === 'coin') {
        world.coins += pk.value;
        audio.playCoin();
      } else {
        world.energy = Math.min(world.maxEnergy, world.energy + pk.value);
        audio.playFruitEat();
      }
      world.pickups.splice(i, 1);
    }
  }

  // 9) Check Game Over
  if (world.energy <= 0) {
    world.energy = 0;
    world.status = 'GAME_OVER';
    clearMonsterArenaSavedRun();
    world.hasSavedRun = false;
    persistStatsIfNeeded(world);
    audio.playGameOver();
    world.version++;
  }

  return true;
}

export function extractMonsterArenaHud(
  world: MonsterArenaWorld
): MonsterArenaHudSnapshot {
  const warlord = world.monsters.find((m) => m.kind === 'warlordBoss');
  const titan = world.monsters.find((m) => m.kind === 'titanBoss');
  const selectedPet =
    world.selectedPetId !== null
      ? world.pets.find((p) => p.id === world.selectedPetId) ?? null
      : null;
  return {
    status: world.status,
    coins: Math.floor(world.coins),
    score: Math.floor(world.score),
    wave: world.wave,
    kills: world.kills,
    energy: Math.ceil(world.energy),
    maxEnergy: Math.round(world.maxEnergy),
    activeWeapon: world.activeWeapon,
    ownedWeapons: [...world.ownedWeapons],
    petRoster: world.pets.map((p) => ({
      petId: p.petId,
      level: p.level,
      slot: p.slot,
      hp: Math.ceil(p.hp),
      maxHp: p.maxHp,
      bonusMaxHp: p.bonusMaxHp,
      guardX: p.guardX,
      guardZ: p.guardZ,
    })),
    mergeableCount: countMergeablePairs(world.pets),
    selectedPetId: selectedPet ? selectedPet.id : null,
    selectedPetInfo: selectedPet
      ? { petId: selectedPet.petId, level: selectedPet.level, slot: selectedPet.slot }
      : null,
    hasStationedPets: world.pets.some((p) => p.guardX !== null || p.guardZ !== null),
    warlordTimer: world.warlordTimer,
    warlordActive: Boolean(warlord),
    warlordHp: warlord ? Math.max(0, Math.ceil(warlord.hp)) : 0,
    warlordMaxHp: warlord ? warlord.maxHp : 0,
    warlordLevel: Math.max(1, world.warlordLevel),
    titanTimer: world.titanTimer,
    titanActive: Boolean(titan),
    titanHp: titan ? Math.max(0, Math.ceil(titan.hp)) : 0,
    titanMaxHp: titan ? titan.maxHp : 0,
    titanLevel: Math.max(1, world.titanLevel),
    speedBuffTimer: world.speedBuffTimer,
    damageBuffTimer: world.damageBuffTimer,
    shieldBuffTimer: world.shieldBuffTimer,
    rapidFireBuffTimer: world.rapidFireBuffTimer,
    petFuryBuffTimer: world.petFuryBuffTimer,
    petFuryDmgPct: world.petFuryDmgPct,
    petFurySpdPct: world.petFurySpdPct,
    dashCooldown: world.dashCooldown,
    bannerText: world.bannerText,
    bannerTone: world.bannerTone,
    bestScore: world.bestScore,
    bestWave: world.bestWave,
    bestKills: world.bestKills,
    titansDefeated: world.titansDefeated,
    hasSavedRun: world.hasSavedRun,
    savedWave: world.savedWave,
    savedCoins: world.savedCoins,
  };
}
