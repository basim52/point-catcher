import {
  DESPAWN_Z,
  LANE_X,
  MAX_RALLY_LIVES,
  MAX_RALLY_PARTICLES,
  PLAYER_Z,
  RALLY_TOASTS_AR,
  RALLY_TOASTS_EN,
  RallyHudSnapshot,
  RallyParticle,
  RallyStatus,
  readDesertRallyStats,
  saveDesertRallyStats,
  SPAWN_Z,
  TrackEntity,
} from './types';
import { DesertRallyAudio } from './audio';

export interface DesertRallyWorld {
  status: RallyStatus;
  lang: 'ar' | 'en';
  score: number;
  bestScore: number;
  distanceM: number;
  bestDistanceM: number;
  isNewBest: boolean;
  coinsCollected: number;
  lives: number;
  sector: number;
  toast: string | null;
  toastTimer: number;

  // Vehicle physics
  lane: number; // 0, 1, 2
  carX: number;
  carY: number;
  carVy: number;
  carRoll: number;
  carPitch: number;
  wheelSpin: number;
  roadOffset: number;
  speed: number; // world units / sec

  // Abilities & feedback
  nitroCharge: number; // 0..100
  nitroTimer: number; // > 0 when turbo active
  shieldActive: boolean;
  invulnTimer: number;
  cameraShake: number;

  // Spawner
  spawnDistAcc: number;
  nextEntityId: number;
  entities: TrackEntity[];
  particles: RallyParticle[];
}

export function createInitialRallyWorld(lang: 'ar' | 'en'): DesertRallyWorld {
  const stats = readDesertRallyStats();
  const particles: RallyParticle[] = Array.from(
    { length: MAX_RALLY_PARTICLES },
    () => ({
      active: false,
      kind: 'dust',
      x: 0,
      y: -10,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.4,
      size: 0.12,
    })
  );

  return {
    status: 'START',
    lang,
    score: 0,
    bestScore: stats.bestScore,
    distanceM: 0,
    bestDistanceM: stats.bestDistanceM,
    isNewBest: false,
    coinsCollected: 0,
    lives: MAX_RALLY_LIVES,
    sector: 1,
    toast: null,
    toastTimer: 0,

    lane: 1,
    carX: 0,
    carY: 0,
    carVy: 0,
    carRoll: 0,
    carPitch: 0,
    wheelSpin: 0,
    roadOffset: 0,
    speed: 22,

    nitroCharge: 35,
    nitroTimer: 0,
    shieldActive: false,
    invulnTimer: 0,
    cameraShake: 0,

    spawnDistAcc: 0,
    nextEntityId: 1,
    entities: [],
    particles,
  };
}

export function resetRallyWorld(world: DesertRallyWorld): void {
  world.status = 'PLAYING';
  world.score = 0;
  world.distanceM = 0;
  world.isNewBest = false;
  world.coinsCollected = 0;
  world.lives = MAX_RALLY_LIVES;
  world.sector = 1;
  world.toast = null;
  world.toastTimer = 0;

  world.lane = 1;
  world.carX = 0;
  world.carY = 0;
  world.carVy = 0;
  world.carRoll = 0;
  world.carPitch = 0;
  world.speed = 24;

  world.nitroCharge = 35;
  world.nitroTimer = 0;
  world.shieldActive = false;
  world.invulnTimer = 0;
  world.cameraShake = 0;

  world.spawnDistAcc = 0;
  world.entities.length = 0;
  for (let i = 0; i < world.particles.length; i++) {
    world.particles[i].active = false;
  }

  // Pre-seed two friendly opening rows so the highway looks rich immediately
  spawnCoinLine(world, 1, -28, 4);
  spawnCoinLine(world, Math.random() < 0.5 ? 0 : 2, -52, 4);
}

export function extractRallyHud(world: DesertRallyWorld): RallyHudSnapshot {
  return {
    status: world.status,
    score: Math.floor(world.score),
    bestScore: world.bestScore,
    distanceM: Math.floor(world.distanceM),
    bestDistanceM: world.bestDistanceM,
    speedKmh: Math.round(world.speed * 4.4),
    coinsCollected: world.coinsCollected,
    lives: world.lives,
    nitroCharge: Math.round(world.nitroCharge),
    nitroActive: world.nitroTimer > 0,
    shieldActive: world.shieldActive,
    sector: world.sector,
    toast: world.toast,
    isNewBest: world.isNewBest,
  };
}

export function shiftLane(
  world: DesertRallyWorld,
  dir: -1 | 1,
  audio: DesertRallyAudio
): void {
  if (world.status !== 'PLAYING') return;
  const next = Math.max(0, Math.min(2, world.lane + dir));
  if (next !== world.lane) {
    world.lane = next;
    audio.playLaneShift();
  }
}

export function triggerJump(
  world: DesertRallyWorld,
  audio: DesertRallyAudio
): void {
  if (world.status !== 'PLAYING') return;
  if (world.carY <= 0.06) {
    world.carVy = 11.4;
    audio.playJump(false);
    spawnBurst(world, world.carX, 0.15, PLAYER_Z + 0.8, 'dust', 6);
  }
}

export function triggerNitro(
  world: DesertRallyWorld,
  audio: DesertRallyAudio
): boolean {
  if (world.status !== 'PLAYING') return false;
  if (world.nitroTimer > 0 || world.nitroCharge < 100) return false;
  world.nitroCharge = 0;
  world.nitroTimer = 4.6;
  world.cameraShake = 0.35;
  audio.playNitro();
  spawnBurst(world, world.carX, world.carY + 0.4, PLAYER_Z + 1.2, 'nitro', 12);
  return true;
}

function spawnBurst(
  world: DesertRallyWorld,
  x: number,
  y: number,
  z: number,
  kind: 'gold' | 'nitro' | 'dust',
  count: number
): void {
  let n = 0;
  for (let i = 0; i < world.particles.length && n < count; i++) {
    const p = world.particles[i];
    if (!p.active) {
      p.active = true;
      p.kind = kind;
      p.x = x + (Math.random() - 0.5) * 0.6;
      p.y = y + Math.random() * 0.25;
      p.z = z + (Math.random() - 0.5) * 0.5;
      p.vx = (Math.random() - 0.5) * 3.8;
      p.vy = kind === 'dust' ? 1.2 + Math.random() * 1.8 : 2.2 + Math.random() * 2.6;
      p.vz = kind === 'nitro' ? 5 + Math.random() * 4 : (Math.random() - 0.5) * 3.2;
      p.maxLife = kind === 'dust' ? 0.38 : 0.48;
      p.life = p.maxLife;
      p.size = kind === 'dust' ? 0.16 : 0.11;
      n++;
    }
  }
}

function spawnCoinLine(
  world: DesertRallyWorld,
  lane: number,
  startZ: number,
  count: number,
  arcJump = false
): void {
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    const arcY = arcJump ? Math.sin(t * Math.PI) * 2.1 : 0;
    world.entities.push({
      id: world.nextEntityId++,
      kind: 'coin',
      lane,
      x: LANE_X[lane],
      y: 0.72 + arcY,
      z: startZ - i * 2.5,
      speedFactor: 1,
      rotY: i * 0.5,
      collected: false,
      hit: false,
      tintIndex: 0,
    });
  }
}

function spawnPattern(world: DesertRallyWorld): void {
  if (world.entities.length > 42) return;

  // Fairness rule: pick 1 guaranteed safe/reward lane; remaining 2 lanes may hold hazards
  const lanes = [0, 1, 2];
  const safeLane = lanes[Math.floor(Math.random() * 3)];
  const otherLanes = lanes.filter((l) => l !== safeLane);

  const hazardCount =
    world.sector >= 3 && Math.random() < 0.62
      ? 2
      : Math.random() < 0.45
      ? 2
      : 1;

  for (let i = 0; i < hazardCount; i++) {
    const l = otherLanes[i];
    const r = Math.random();
    if (r < 0.44) {
      // Rival desert SUV/truck
      world.entities.push({
        id: world.nextEntityId++,
        kind: 'rival_truck',
        lane: l,
        x: LANE_X[l],
        y: 0,
        z: SPAWN_Z - Math.random() * 5,
        speedFactor: 0.58 + Math.random() * 0.14,
        rotY: 0,
        collected: false,
        hit: false,
        tintIndex: Math.floor(Math.random() * 3),
      });
    } else if (r < 0.74) {
      // Jumpable road barrier
      world.entities.push({
        id: world.nextEntityId++,
        kind: 'barrier',
        lane: l,
        x: LANE_X[l],
        y: 0,
        z: SPAWN_Z,
        speedFactor: 1,
        rotY: 0,
        collected: false,
        hit: false,
        tintIndex: 0,
      });
    } else {
      // Jumpable sandstone boulder
      world.entities.push({
        id: world.nextEntityId++,
        kind: 'boulder',
        lane: l,
        x: LANE_X[l],
        y: 0,
        z: SPAWN_Z,
        speedFactor: 1,
        rotY: Math.random() * Math.PI * 2,
        collected: false,
        hit: false,
        tintIndex: 0,
      });
    }
  }

  // Populate safe lane with coins, ramp+arc coins, nitro cell, or shield
  const rewardRoll = Math.random();
  if (rewardRoll < 0.16) {
    // Jump ramp + high arc of gold coins!
    world.entities.push({
      id: world.nextEntityId++,
      kind: 'ramp',
      lane: safeLane,
      x: LANE_X[safeLane],
      y: 0,
      z: SPAWN_Z + 3,
      speedFactor: 1,
      rotY: 0,
      collected: false,
      hit: false,
      tintIndex: 0,
    });
    spawnCoinLine(world, safeLane, SPAWN_Z - 2.5, 5, true);
  } else if (rewardRoll < 0.28) {
    world.entities.push({
      id: world.nextEntityId++,
      kind: 'nitro_cell',
      lane: safeLane,
      x: LANE_X[safeLane],
      y: 0.8,
      z: SPAWN_Z,
      speedFactor: 1,
      rotY: 0,
      collected: false,
      hit: false,
      tintIndex: 0,
    });
  } else if (rewardRoll < 0.35 && !world.shieldActive) {
    world.entities.push({
      id: world.nextEntityId++,
      kind: 'shield_orb',
      lane: safeLane,
      x: LANE_X[safeLane],
      y: 0.85,
      z: SPAWN_Z,
      speedFactor: 1,
      rotY: 0,
      collected: false,
      hit: false,
      tintIndex: 0,
    });
  } else {
    spawnCoinLine(world, safeLane, SPAWN_Z, 4, false);
  }
}

export function stepRallyWorld(
  world: DesertRallyWorld,
  rawDt: number,
  audio: DesertRallyAudio
): boolean {
  const dt = Math.min(rawDt, 0.05);
  let hudDirty = false;

  // Idle road roll on start screen so the 3D scene feels alive
  if (world.status === 'START') {
    world.roadOffset = (world.roadOffset + 12 * dt) % 12;
    world.wheelSpin += 10 * dt;
    return false;
  }

  if (world.cameraShake > 0) {
    world.cameraShake = Math.max(0, world.cameraShake - dt * 2.5);
  }

  // Update particles always
  for (let i = 0; i < world.particles.length; i++) {
    const p = world.particles[i];
    if (!p.active) continue;
    p.life -= dt;
    if (p.life <= 0) {
      p.active = false;
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.vy -= 7.5 * dt;
    if (p.y < 0.05) {
      p.y = 0.05;
      p.vy *= -0.2;
    }
  }

  if (world.status !== 'PLAYING') {
    return false;
  }

  // Timers
  if (world.invulnTimer > 0) {
    world.invulnTimer = Math.max(0, world.invulnTimer - dt);
  }
  if (world.toastTimer > 0) {
    world.toastTimer -= dt;
    if (world.toastTimer <= 0) {
      world.toastTimer = 0;
      world.toast = null;
      hudDirty = true;
    }
  }

  if (world.nitroTimer > 0) {
    world.nitroTimer = Math.max(0, world.nitroTimer - dt);
    if (Math.random() < 0.45) {
      spawnBurst(world, world.carX, world.carY + 0.35, PLAYER_Z + 1.35, 'nitro', 1);
    }
    hudDirty = true;
  }

  // Target speed scales smoothly with distance + turbo boost
  const baseSpeed = Math.min(44, 24 + world.distanceM * 0.0068);
  const targetSpeed = world.nitroTimer > 0 ? baseSpeed * 1.48 : baseSpeed;
  world.speed += (targetSpeed - world.speed) * (1 - Math.exp(-5.5 * dt));

  const dz = world.speed * dt;
  world.roadOffset = (world.roadOffset + dz) % 12;
  world.wheelSpin += dz * 1.65;

  // Distance & score progression
  const mult = world.nitroTimer > 0 ? 2 : 1;
  world.distanceM += dz * 0.42;
  world.score += dz * 0.32 * mult;

  // Sector milestone every 350m
  const targetSector = Math.floor(world.distanceM / 350) + 1;
  if (targetSector > world.sector) {
    world.sector = targetSector;
    const list = world.lang === 'ar' ? RALLY_TOASTS_AR : RALLY_TOASTS_EN;
    world.toast = list[(targetSector - 2) % list.length];
    world.toastTimer = 2.4;
    audio.playSectorUp();
    hudDirty = true;
  }

  // Smooth lateral lane tracking + body roll
  const targetX = LANE_X[world.lane];
  const prevX = world.carX;
  world.carX += (targetX - world.carX) * (1 - Math.exp(-14 * dt));
  const vx = dt > 0.0001 ? (world.carX - prevX) / dt : 0;
  const targetRoll = Math.max(-0.26, Math.min(0.26, -vx * 0.022));
  world.carRoll += (targetRoll - world.carRoll) * (1 - Math.exp(-12 * dt));

  // Vertical jump physics & pitch
  if (world.carY > 0 || world.carVy > 0) {
    world.carY += world.carVy * dt;
    world.carVy -= 28.5 * dt;
    if (world.carY <= 0) {
      world.carY = 0;
      world.carVy = 0;
      spawnBurst(world, world.carX, 0.1, PLAYER_Z + 0.6, 'dust', 5);
    }
  }
  const targetPitch = world.carY > 0.02 ? Math.max(-0.28, Math.min(0.32, world.carVy * 0.025)) : 0;
  world.carPitch += (targetPitch - world.carPitch) * (1 - Math.exp(-10 * dt));

  // Spawn road patterns at distance intervals
  const patternSpacing = Math.max(15, 22 - world.sector * 0.8);
  world.spawnDistAcc += dz;
  if (world.spawnDistAcc >= patternSpacing) {
    world.spawnDistAcc = 0;
    spawnPattern(world);
  }

  // Step entities & resolve collisions
  for (let i = world.entities.length - 1; i >= 0; i--) {
    const e = world.entities[i];
    e.z += dz * e.speedFactor;
    if (e.kind === 'coin' || e.kind === 'nitro_cell' || e.kind === 'shield_orb') {
      e.rotY += dt * 3.2;
    }

    if (e.z > DESPAWN_Z) {
      world.entities.splice(i, 1);
      continue;
    }

    const dx = Math.abs(e.x - world.carX);
    const zDiff = Math.abs(e.z - PLAYER_Z);

    if (e.kind === 'coin' && !e.collected) {
      if (dx < 1.1 && zDiff < 1.5 && Math.abs(e.y - (world.carY + 0.65)) < 1.25) {
        e.collected = true;
        world.coinsCollected += 1;
        world.score += 10 * mult;
        world.nitroCharge = Math.min(100, world.nitroCharge + 7);
        audio.playCoin();
        spawnBurst(world, e.x, e.y, e.z, 'gold', 6);
        world.entities.splice(i, 1);
        hudDirty = true;
        continue;
      }
    } else if (e.kind === 'nitro_cell' && !e.collected) {
      if (dx < 1.15 && zDiff < 1.6 && world.carY < 1.8) {
        e.collected = true;
        world.nitroCharge = Math.min(100, world.nitroCharge + 45);
        world.score += 25 * mult;
        if (world.nitroCharge >= 100 && world.nitroTimer <= 0) {
          triggerNitro(world, audio);
        } else {
          audio.playCoin();
        }
        spawnBurst(world, e.x, e.y, e.z, 'nitro', 10);
        world.entities.splice(i, 1);
        hudDirty = true;
        continue;
      }
    } else if (e.kind === 'shield_orb' && !e.collected) {
      if (dx < 1.15 && zDiff < 1.6 && world.carY < 1.8) {
        e.collected = true;
        world.shieldActive = true;
        world.score += 20;
        audio.playShieldPickup();
        spawnBurst(world, e.x, e.y, e.z, 'nitro', 8);
        world.entities.splice(i, 1);
        hudDirty = true;
        continue;
      }
    } else if (e.kind === 'ramp' && !e.hit) {
      if (dx < 1.05 && zDiff < 1.6 && world.carY < 0.7) {
        e.hit = true;
        world.carVy = 14.2;
        world.score += 30;
        audio.playJump(true);
        spawnBurst(world, world.carX, 0.25, PLAYER_Z, 'gold', 8);
        hudDirty = true;
      }
    } else if (
      (e.kind === 'barrier' || e.kind === 'boulder' || e.kind === 'rival_truck') &&
      !e.hit
    ) {
      const hitZ = e.kind === 'rival_truck' ? 2.2 : 1.15;
      const clearHeight = e.kind === 'rival_truck' ? 1.85 : 1.05;
      if (dx < 1.0 && zDiff < hitZ && world.carY < clearHeight) {
        e.hit = true;
        // Nitro turbo smashes right through obstacles for bonus points!
        if (world.nitroTimer > 0) {
          world.score += 40;
          world.cameraShake = 0.4;
          audio.playShieldBlock();
          spawnBurst(world, e.x, 0.8, e.z, 'gold', 12);
          world.entities.splice(i, 1);
          hudDirty = true;
          continue;
        }

        if (world.invulnTimer > 0) {
          continue;
        }

        if (world.shieldActive) {
          world.shieldActive = false;
          world.invulnTimer = 1.0;
          world.cameraShake = 0.45;
          audio.playShieldBlock();
          spawnBurst(world, e.x, 0.8, e.z, 'nitro', 10);
          world.entities.splice(i, 1);
          hudDirty = true;
          continue;
        }

        // Lose 1 heart
        world.lives = Math.max(0, world.lives - 1);
        world.invulnTimer = 1.45;
        world.cameraShake = 1.0;
        world.speed = Math.max(18, world.speed * 0.72);
        audio.playCrash();
        spawnBurst(world, e.x, 0.7, e.z, 'dust', 12);

        if (world.lives <= 0) {
          world.status = 'GAME_OVER';
          audio.stopMusic();
        }
        hudDirty = true;
      }
    }
  }

  // Persist high scores
  const intScore = Math.floor(world.score);
  const intDist = Math.floor(world.distanceM);
  if (intScore > world.bestScore || intDist > world.bestDistanceM) {
    if (intScore > world.bestScore) {
      world.bestScore = intScore;
      world.isNewBest = true;
    }
    if (intDist > world.bestDistanceM) {
      world.bestDistanceM = intDist;
    }
    saveDesertRallyStats({
      bestScore: world.bestScore,
      bestDistanceM: world.bestDistanceM,
    });
  }

  return hudDirty || true;
}
