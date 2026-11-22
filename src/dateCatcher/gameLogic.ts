import {
  ActivePowerUp,
  BASKET_BASE_HALF_W,
  BASKET_Y,
  CLUSTER_X_POSITIONS,
  DateCatcherStatus,
  FallingEntity,
  FallingKind,
  HudSnapshot,
  MAX_ACTIVE_ITEMS,
  MAX_LIVES,
  MAX_PARTICLES,
  MAX_STANDARD_LEVEL,
  ParticleEntity,
  PLAY_HALF_WIDTH,
  POINTS_PER_LEVEL,
  POWERUP_DURATION_SEC,
  PowerUpKind,
  readDateCatcherBestScore,
  SAUDI_LEVEL_TOASTS,
  saveDateCatcherBestScore,
  SPAWN_Y,
} from './types';
import { DateCatcherAudio } from './audio';

export interface PendingDrop {
  clusterIdx: number;
  timer: number;
  kind: FallingKind;
}

export interface DateCatcherWorld {
  status: DateCatcherStatus;
  score: number;
  bestScore: number;
  isNewBest: boolean;
  lives: number;
  level: number;
  isEndless: boolean;
  comboStreak: number;
  comboMultiplier: 1 | 2 | 3;
  activePowerUp: ActivePowerUp | null;
  levelToast: string | null;
  levelToastTimer: number;

  // Player basket kinematics
  basketX: number;
  basketTargetX: number;
  basketVx: number;
  basketTilt: number;
  basketBounce: number;
  basketWidthScale: number;
  basketHitFlash: number;

  // Input flags
  keyLeft: boolean;
  keyRight: boolean;
  pointerDragging: boolean;

  // Camera shake & tree cluster telegraph timers
  cameraShake: number;
  clusterShakeTimers: number[];
  pendingDrops: PendingDrop[];
  spawnCooldown: number;
  nextEntityId: number;

  // Dynamic pools (total <= 60 objects)
  items: FallingEntity[];
  particles: ParticleEntity[];
}

export function createInitialWorld(): DateCatcherWorld {
  const particles: ParticleEntity[] = Array.from({ length: MAX_PARTICLES }, () => ({
    active: false,
    kind: 'gold',
    x: 0,
    y: -10,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    life: 0,
    maxLife: 0.5,
    size: 0.1,
  }));

  return {
    status: 'START',
    score: 0,
    bestScore: readDateCatcherBestScore(),
    isNewBest: false,
    lives: MAX_LIVES,
    level: 1,
    isEndless: false,
    comboStreak: 0,
    comboMultiplier: 1,
    activePowerUp: null,
    levelToast: null,
    levelToastTimer: 0,

    basketX: 0,
    basketTargetX: 0,
    basketVx: 0,
    basketTilt: 0,
    basketBounce: 0,
    basketWidthScale: 1,
    basketHitFlash: 0,

    keyLeft: false,
    keyRight: false,
    pointerDragging: false,

    cameraShake: 0,
    clusterShakeTimers: CLUSTER_X_POSITIONS.map(() => 0),
    pendingDrops: [],
    spawnCooldown: 0.55,
    nextEntityId: 1,

    items: [],
    particles,
  };
}

export function resetWorldForPlay(world: DateCatcherWorld): void {
  world.status = 'PLAYING';
  world.score = 0;
  world.isNewBest = false;
  world.lives = MAX_LIVES;
  world.level = 1;
  world.isEndless = false;
  world.comboStreak = 0;
  world.comboMultiplier = 1;
  world.activePowerUp = null;
  world.levelToast = null;
  world.levelToastTimer = 0;

  world.basketX = 0;
  world.basketTargetX = 0;
  world.basketVx = 0;
  world.basketTilt = 0;
  world.basketBounce = 0;
  world.basketWidthScale = 1;
  world.basketHitFlash = 0;

  world.cameraShake = 0;
  world.clusterShakeTimers.fill(0);
  world.pendingDrops.length = 0;
  world.spawnCooldown = 0.45;
  world.items.length = 0;
  for (let i = 0; i < world.particles.length; i++) {
    world.particles[i].active = false;
  }
}

export function extractHudSnapshot(world: DateCatcherWorld): HudSnapshot {
  return {
    status: world.status,
    score: world.score,
    bestScore: world.bestScore,
    lives: world.lives,
    level: world.level,
    isEndless: world.isEndless,
    comboStreak: world.comboStreak,
    comboMultiplier: world.comboMultiplier,
    activePowerUp: world.activePowerUp ? { ...world.activePowerUp } : null,
    levelToast: world.levelToast,
    isNewBest: world.isNewBest,
  };
}

function isBeneficialDate(kind: FallingKind): boolean {
  return kind === 'date' || kind === 'golden_date' || kind === 'rutab_cluster';
}

function isPowerUp(kind: FallingKind): kind is PowerUpKind {
  return (
    kind === 'magnet' ||
    kind === 'big_basket' ||
    kind === 'slow_mo' ||
    kind === 'shield'
  );
}

function spawnParticleBurst(
  world: DateCatcherWorld,
  x: number,
  y: number,
  z: number,
  kind: 'gold' | 'sand',
  count: number
): void {
  let spawned = 0;
  for (let i = 0; i < world.particles.length && spawned < count; i++) {
    const p = world.particles[i];
    if (!p.active) {
      p.active = true;
      p.kind = kind;
      p.x = x + (Math.random() - 0.5) * 0.35;
      p.y = y + Math.random() * 0.15;
      p.z = z + (Math.random() - 0.5) * 0.35;
      const angle = Math.random() * Math.PI * 2;
      const speed = kind === 'gold' ? 1.4 + Math.random() * 2.1 : 0.7 + Math.random() * 1.4;
      p.vx = Math.cos(angle) * speed;
      p.vy = kind === 'gold' ? 2.1 + Math.random() * 2.0 : 0.8 + Math.random() * 1.2;
      p.vz = Math.sin(angle) * speed * 0.6;
      p.maxLife = kind === 'gold' ? 0.52 + Math.random() * 0.25 : 0.45 + Math.random() * 0.2;
      p.life = p.maxLife;
      p.size = kind === 'gold' ? 0.08 + Math.random() * 0.06 : 0.11 + Math.random() * 0.07;
      spawned++;
    }
  }
}

function pickNextDropKind(level: number): FallingKind {
  const r = Math.random();
  // Obstacle chance scales gently from 16% at Lv.1 up to 34% in Endless
  const hazardChance = Math.min(0.34, 0.15 + (level - 1) * 0.018);
  const powerupChance = 0.065;

  if (r < hazardChance) {
    // Wasps appear more from level 2+
    const waspShare = level === 1 ? 0.3 : Math.min(0.55, 0.36 + (level - 1) * 0.02);
    return Math.random() < waspShare ? 'wasp' : 'stone';
  }

  if (r < hazardChance + powerupChance) {
    const powers: PowerUpKind[] = ['magnet', 'big_basket', 'slow_mo', 'shield'];
    return powers[Math.floor(Math.random() * powers.length)];
  }

  // Remaining are dates: regular brown date, rare golden date, very rare rutab cluster
  const d = Math.random();
  if (d < 0.055) return 'rutab_cluster';
  if (d < 0.19) return 'golden_date';
  return 'date';
}

function createFallingEntity(
  world: DateCatcherWorld,
  kind: FallingKind,
  spawnX: number
): FallingEntity {
  const levelScale = Math.min(2.15, 1 + (world.level - 1) * 0.095);
  let baseSpeed = 3.25 * levelScale;
  let radius = 0.34;
  let scale = 1;

  if (kind === 'golden_date') {
    baseSpeed *= 1.16;
    radius = 0.36;
  } else if (kind === 'rutab_cluster') {
    baseSpeed *= 1.06;
    radius = 0.48;
  } else if (kind === 'stone') {
    baseSpeed *= 1.12;
    radius = 0.38;
  } else if (kind === 'wasp') {
    baseSpeed *= 0.94;
    radius = 0.42;
  } else if (isPowerUp(kind)) {
    baseSpeed *= 0.88;
    radius = 0.42;
  }

  const clampedX = Math.max(
    -PLAY_HALF_WIDTH + 0.45,
    Math.min(PLAY_HALF_WIDTH - 0.45, spawnX + (Math.random() - 0.5) * 0.7)
  );

  return {
    id: world.nextEntityId++,
    kind,
    x: clampedX,
    y: SPAWN_Y,
    z: 0,
    vy: baseSpeed,
    vx: 0,
    baseX: clampedX,
    phase: Math.random() * Math.PI * 2,
    rotX: Math.random() * Math.PI,
    rotY: Math.random() * Math.PI,
    rotZ: Math.random() * 0.5,
    rotSpeedX: (Math.random() - 0.5) * 3.0,
    rotSpeedY: (Math.random() - 0.5) * 3.2,
    scale,
    radius,
  };
}

/**
 * Advances simulation by delta seconds (clamped for tab-switch safety).
 * Returns true if any HUD-visible state changed so React can refresh HUD cleanly.
 */
export function stepWorld(
  world: DateCatcherWorld,
  rawDt: number,
  audio: DateCatcherAudio
): boolean {
  const dt = Math.min(rawDt, 0.05);
  let hudDirty = false;

  // Always animate camera shake, cluster shakes, and particles smoothly
  if (world.cameraShake > 0) {
    world.cameraShake = Math.max(0, world.cameraShake - dt * 2.8);
  }
  if (world.basketHitFlash > 0) {
    world.basketHitFlash = Math.max(0, world.basketHitFlash - dt * 2.4);
  }
  if (world.basketBounce > 0) {
    world.basketBounce = Math.max(0, world.basketBounce - dt * 5.2);
  }

  for (let i = 0; i < world.clusterShakeTimers.length; i++) {
    if (world.clusterShakeTimers[i] > 0) {
      world.clusterShakeTimers[i] = Math.max(0, world.clusterShakeTimers[i] - dt);
    }
  }

  // Update active particles
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
    p.vy -= (p.kind === 'gold' ? 5.2 : 3.4) * dt;
    if (p.y < 0.04) {
      p.y = 0.04;
      p.vy *= -0.2;
    }
  }

  if (world.status !== 'PLAYING') {
    return false;
  }

  // Level encouragement toast timer
  if (world.levelToastTimer > 0) {
    world.levelToastTimer -= dt;
    if (world.levelToastTimer <= 0) {
      world.levelToastTimer = 0;
      world.levelToast = null;
      hudDirty = true;
    }
  }

  // Active power-up countdown
  if (world.activePowerUp) {
    world.activePowerUp.remaining -= dt;
    if (world.activePowerUp.remaining <= 0) {
      world.activePowerUp = null;
      hudDirty = true;
    } else {
      hudDirty = true; // smooth countdown bar update
    }
  }

  // Basket keyboard movement
  const keyDir = (world.keyRight ? 1 : 0) - (world.keyLeft ? 1 : 0);
  if (keyDir !== 0 && !world.pointerDragging) {
    const moveSpeed = 10.2;
    world.basketTargetX += keyDir * moveSpeed * dt;
  }

  const desiredScale =
    world.activePowerUp?.kind === 'big_basket' ? 2.0 : 1.0;
  world.basketWidthScale +=
    (desiredScale - world.basketWidthScale) * (1 - Math.exp(-10 * dt));

  const currentHalfW = BASKET_BASE_HALF_W * world.basketWidthScale;
  const maxPlayerX = Math.max(0.5, PLAY_HALF_WIDTH - currentHalfW * 0.65);
  world.basketTargetX = Math.max(
    -maxPlayerX,
    Math.min(maxPlayerX, world.basketTargetX)
  );

  const prevBasketX = world.basketX;
  world.basketX +=
    (world.basketTargetX - world.basketX) * (1 - Math.exp(-16 * dt));
  world.basketVx = dt > 0.0001 ? (world.basketX - prevBasketX) / dt : 0;

  // Basket subtle tilt toward direction of travel
  const targetTilt = Math.max(-0.24, Math.min(0.24, -world.basketVx * 0.024));
  world.basketTilt +=
    (targetTilt - world.basketTilt) * (1 - Math.exp(-12 * dt));

  const timeScale = world.activePowerUp?.kind === 'slow_mo' ? 0.5 : 1.0;

  // Trigger new pending drops with palm cluster shake telegraph
  world.spawnCooldown -= dt * timeScale;
  if (
    world.spawnCooldown <= 0 &&
    world.items.length + world.pendingDrops.length < MAX_ACTIVE_ITEMS
  ) {
    const clusterIdx = Math.floor(Math.random() * CLUSTER_X_POSITIONS.length);
    const kind = pickNextDropKind(world.level);
    world.clusterShakeTimers[clusterIdx] = 0.42;
    world.pendingDrops.push({
      clusterIdx,
      timer: 0.34,
      kind,
    });
    const baseInterval = Math.max(0.36, 1.02 - (world.level - 1) * 0.058);
    world.spawnCooldown = baseInterval * (0.78 + Math.random() * 0.44);
  }

  // Release pending drops after brief cluster shake
  for (let i = world.pendingDrops.length - 1; i >= 0; i--) {
    const pd = world.pendingDrops[i];
    pd.timer -= dt * timeScale;
    if (pd.timer <= 0) {
      const spawnX = CLUSTER_X_POSITIONS[pd.clusterIdx];
      world.items.push(createFallingEntity(world, pd.kind, spawnX));
      world.pendingDrops.splice(i, 1);
    }
  }

  const magnetActive = world.activePowerUp?.kind === 'magnet';

  // Step falling items & resolve collisions
  for (let i = world.items.length - 1; i >= 0; i--) {
    const item = world.items[i];
    item.y -= item.vy * timeScale * dt;
    item.phase += dt * 4.2 * timeScale;

    if (item.kind === 'wasp') {
      // Zigzag horizontal swoop
      const amp = 1.25;
      item.x = item.baseX + Math.sin(item.phase * 1.45) * amp;
      item.x = Math.max(-PLAY_HALF_WIDTH + 0.35, Math.min(PLAY_HALF_WIDTH - 0.35, item.x));
      item.rotY = Math.cos(item.phase * 1.45) >= 0 ? 0.35 : -0.35;
    } else {
      item.rotX += item.rotSpeedX * dt * timeScale;
      item.rotY += item.rotSpeedY * dt * timeScale;
    }

    // Magnet pulls beneficial dates smoothly toward basket
    if (magnetActive && isBeneficialDate(item.kind)) {
      const dx = world.basketX - item.x;
      const dy = BASKET_Y + 0.35 - item.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4.5 && dist > 0.05) {
        const pull = (1 - dist / 4.5) * 11.5 * dt;
        item.x += (dx / dist) * pull;
        item.y += (dy / dist) * pull * 0.35;
      }
    }

    // Catch / collision check with basket rim zone
    const catchTop = BASKET_Y + 0.62;
    const catchBottom = BASKET_Y - 0.25;
    if (item.y <= catchTop && item.y >= catchBottom) {
      const horizLimit = currentHalfW + item.radius * 0.72;
      if (Math.abs(item.x - world.basketX) <= horizLimit) {
        if (isBeneficialDate(item.kind)) {
          // Score & combo progression
          world.comboStreak += 1;
          world.comboMultiplier =
            world.comboStreak >= 10 ? 3 : world.comboStreak >= 5 ? 2 : 1;

          const basePts =
            item.kind === 'rutab_cluster'
              ? 10
              : item.kind === 'golden_date'
              ? 5
              : 1;
          world.score += basePts * world.comboMultiplier;
          world.basketBounce = 1.0;

          if (world.score > world.bestScore) {
            world.bestScore = world.score;
            world.isNewBest = true;
            saveDateCatcherBestScore(world.bestScore);
          }

          if (item.kind === 'golden_date' || item.kind === 'rutab_cluster') {
            audio.playGolden();
            spawnParticleBurst(world, item.x, BASKET_Y + 0.45, 0, 'gold', 12);
          } else {
            audio.playCatch(world.comboMultiplier);
            spawnParticleBurst(world, item.x, BASKET_Y + 0.45, 0, 'gold', 6);
          }

          // Check level progression (every 30 points)
          const targetLevel = Math.floor(world.score / POINTS_PER_LEVEL) + 1;
          if (targetLevel > world.level) {
            world.level = targetLevel;
            world.isEndless = targetLevel > MAX_STANDARD_LEVEL;
            const toastIdx = Math.min(
              SAUDI_LEVEL_TOASTS.length - 1,
              targetLevel - 2
            );
            world.levelToast =
              world.isEndless && targetLevel === MAX_STANDARD_LEVEL + 1
                ? 'كفو! دخلت الوضع اللانهائي!'
                : SAUDI_LEVEL_TOASTS[Math.max(0, toastIdx)];
            world.levelToastTimer = 2.6;
            audio.playLevelUp();
          }

          hudDirty = true;
        } else if (isPowerUp(item.kind)) {
          world.activePowerUp = {
            kind: item.kind,
            remaining: POWERUP_DURATION_SEC,
            duration: POWERUP_DURATION_SEC,
          };
          world.basketBounce = 0.9;
          audio.playPowerUp();
          spawnParticleBurst(world, item.x, BASKET_Y + 0.45, 0, 'gold', 10);
          hudDirty = true;
        } else {
          // Stone or Wasp hit!
          if (world.activePowerUp?.kind === 'shield') {
            world.activePowerUp = null;
            world.basketBounce = 0.8;
            audio.playShieldBlock();
            spawnParticleBurst(world, item.x, BASKET_Y + 0.5, 0, 'gold', 10);
          } else {
            world.lives = Math.max(0, world.lives - 1);
            world.comboStreak = 0;
            world.comboMultiplier = 1;
            world.cameraShake = 1.0;
            world.basketHitFlash = 1.0;
            audio.playHurt();
            spawnParticleBurst(world, item.x, BASKET_Y + 0.35, 0, 'sand', 9);
            if (world.lives <= 0) {
              world.status = 'GAME_OVER';
              audio.stopMusic();
            }
          }
          hudDirty = true;
        }

        world.items.splice(i, 1);
        continue;
      }
    }

    // Ground impact check (y <= 0.15)
    if (item.y <= 0.15) {
      if (isBeneficialDate(item.kind)) {
        // No heart lost on ground miss, but breaks combo streak & kicks up sand dust!
        spawnParticleBurst(world, item.x, 0.12, 0, 'sand', 6);
        if (world.comboStreak > 0) {
          world.comboStreak = 0;
          world.comboMultiplier = 1;
          hudDirty = true;
        }
      } else if (item.kind === 'stone') {
        spawnParticleBurst(world, item.x, 0.12, 0, 'sand', 5);
      }
      world.items.splice(i, 1);
    }
  }

  return hudDirty;
}
