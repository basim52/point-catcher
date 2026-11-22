export type RallyStatus = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type TrackEntityKind =
  | 'coin'
  | 'nitro_cell'
  | 'shield_orb'
  | 'ramp'
  | 'barrier'
  | 'boulder'
  | 'rival_truck';

export interface TrackEntity {
  id: number;
  kind: TrackEntityKind;
  lane: number; // 0 = left, 1 = center, 2 = right
  x: number;
  y: number;
  z: number; // Negative = ahead of player, positive = behind camera
  speedFactor: number; // Rival trucks move forward slowly relative to road
  rotY: number;
  collected: boolean;
  hit: boolean;
  tintIndex: number;
}

export interface RallyParticle {
  active: boolean;
  kind: 'gold' | 'nitro' | 'dust';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface RallyHudSnapshot {
  status: RallyStatus;
  score: number;
  bestScore: number;
  distanceM: number;
  bestDistanceM: number;
  speedKmh: number;
  coinsCollected: number;
  lives: number;
  nitroCharge: number; // 0..100
  nitroActive: boolean;
  shieldActive: boolean;
  sector: number;
  toast: string | null;
  isNewBest: boolean;
}

export const LANE_X = [-2.4, 0, 2.4] as const;
export const ROAD_WIDTH = 8.4;
export const PLAYER_Z = 4.2;
export const SPAWN_Z = -78;
export const DESPAWN_Z = 14;
export const MAX_RALLY_LIVES = 3;
export const MAX_RALLY_PARTICLES = 36;

export const RALLY_BEST_SCORE_KEY = 'desert_rally_best_score_v1';
export const RALLY_BEST_DIST_KEY = 'desert_rally_best_dist_v1';
export const RALLY_SOUND_KEY = 'desert_rally_sound_v1';

export const RALLY_TOASTS_AR = [
  'انطلاقة نارية!',
  'بطل الصحراء!',
  'تجاوز أسطوري!',
  'سرعة خرافية!',
  'كفو! قيادة احترافية!',
  'لا شيء يوقفك!',
];

export const RALLY_TOASTS_EN = [
  'Blazing Start!',
  'Desert Champion!',
  'Epic Overtake!',
  'Turbo Speed!',
  'Pro Rally Driving!',
  'Unstoppable!',
];

export interface RallyStats {
  bestScore: number;
  bestDistanceM: number;
}

export function readDesertRallyStats(): RallyStats {
  try {
    const scoreRaw = window.localStorage.getItem(RALLY_BEST_SCORE_KEY);
    const distRaw = window.localStorage.getItem(RALLY_BEST_DIST_KEY);
    const bestScore = scoreRaw ? Math.max(0, Math.floor(Number(scoreRaw))) : 0;
    const bestDistanceM = distRaw ? Math.max(0, Math.floor(Number(distRaw))) : 0;
    return {
      bestScore: Number.isFinite(bestScore) ? bestScore : 0,
      bestDistanceM: Number.isFinite(bestDistanceM) ? bestDistanceM : 0,
    };
  } catch {
    return { bestScore: 0, bestDistanceM: 0 };
  }
}

export function saveDesertRallyStats(stats: RallyStats): void {
  try {
    window.localStorage.setItem(
      RALLY_BEST_SCORE_KEY,
      String(Math.max(0, Math.floor(stats.bestScore)))
    );
    window.localStorage.setItem(
      RALLY_BEST_DIST_KEY,
      String(Math.max(0, Math.floor(stats.bestDistanceM)))
    );
  } catch {
    // ignore storage errors
  }
}

export function readDesertRallySoundEnabled(): boolean {
  try {
    const raw = window.localStorage.getItem(RALLY_SOUND_KEY);
    if (raw === null) return true;
    return raw === '1';
  } catch {
    return true;
  }
}

export function saveDesertRallySoundEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(RALLY_SOUND_KEY, enabled ? '1' : '0');
  } catch {
    // ignore storage errors
  }
}
