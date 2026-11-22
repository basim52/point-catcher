export type DateCatcherStatus = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type PowerUpKind = 'magnet' | 'big_basket' | 'slow_mo' | 'shield';

export type FallingKind =
  | 'date'
  | 'golden_date'
  | 'rutab_cluster'
  | 'stone'
  | 'wasp'
  | PowerUpKind;

export interface FallingEntity {
  id: number;
  kind: FallingKind;
  x: number;
  y: number;
  z: number;
  vy: number;
  vx: number;
  baseX: number;
  phase: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  rotSpeedX: number;
  rotSpeedY: number;
  scale: number;
  radius: number;
}

export interface ParticleEntity {
  active: boolean;
  kind: 'gold' | 'sand';
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

export interface ActivePowerUp {
  kind: PowerUpKind;
  remaining: number; // seconds left (max 7)
  duration: number;
}

export interface HudSnapshot {
  status: DateCatcherStatus;
  score: number;
  bestScore: number;
  lives: number;
  level: number;
  isEndless: boolean;
  comboStreak: number;
  comboMultiplier: 1 | 2 | 3;
  activePowerUp: ActivePowerUp | null;
  levelToast: string | null;
  isNewBest: boolean;
}

export const DATE_CATCHER_BEST_KEY = 'date_catcher_best_v1';
export const DATE_CATCHER_SOUND_KEY = 'date_catcher_sound_v1';

export const PLAY_HALF_WIDTH = 4.6;
export const BASKET_Y = 0.45;
export const BASKET_BASE_HALF_W = 0.88;
export const SPAWN_Y = 7.35;
export const MAX_LIVES = 3;
export const POWERUP_DURATION_SEC = 7;
export const POINTS_PER_LEVEL = 30;
export const MAX_STANDARD_LEVEL = 10;
export const MAX_ACTIVE_ITEMS = 28; // Combined with particles (32) <= 60 total 3D dynamic objects
export const MAX_PARTICLES = 32;

// 5 cluster x-positions hanging under the hero palm crown
export const CLUSTER_X_POSITIONS = [-3.3, -1.65, 0, 1.65, 3.3];

export const POWERUP_META: Record<
  PowerUpKind,
  { nameAr: string; descAr: string; color: string }
> = {
  magnet: {
    nameAr: 'مغناطيس التمر',
    descAr: 'يسحب التمر القريب نحو السلة',
    color: '#f43f5e',
  },
  big_basket: {
    nameAr: 'سلة كبيرة',
    descAr: 'يتضاعف عرض السلة لالتقاط أسهل',
    color: '#f59e0b',
  },
  slow_mo: {
    nameAr: 'تبطيء الوقت',
    descAr: 'كل شيء يسقط بنصف السرعة',
    color: '#38bdf8',
  },
  shield: {
    nameAr: 'درع الحماية',
    descAr: 'يحمي السلة من ضربة واحدة',
    color: '#10b981',
  },
};

export const SAUDI_LEVEL_TOASTS: string[] = [
  'كفو عليك!',
  'يا سلام، استمر!',
  'والله بطل!',
  'عاشوا! صيدك ذهب!',
  'ما شاء الله عليك!',
  'يا عيني على الحماس!',
  'قمة الأداء يا بطل!',
  'شغلك مضبوط!',
  'فنان صيد التمر!',
  'كفو! دخلت الوضع اللانهائي!',
  'أسطورة النخيل — واصل!',
];

export function readDateCatcherBestScore(): number {
  try {
    const raw = window.localStorage.getItem(DATE_CATCHER_BEST_KEY);
    const val = raw ? Number(raw) : 0;
    return Number.isFinite(val) && val > 0 ? Math.floor(val) : 0;
  } catch {
    return 0;
  }
}

export function saveDateCatcherBestScore(score: number): void {
  try {
    window.localStorage.setItem(
      DATE_CATCHER_BEST_KEY,
      String(Math.max(0, Math.floor(score)))
    );
  } catch {
    // ignore storage errors
  }
}

export function readDateCatcherSoundEnabled(): boolean {
  try {
    const raw = window.localStorage.getItem(DATE_CATCHER_SOUND_KEY);
    if (raw === null) return true;
    return raw === '1';
  } catch {
    return true;
  }
}

export function saveDateCatcherSoundEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(DATE_CATCHER_SOUND_KEY, enabled ? '1' : '0');
  } catch {
    // ignore storage errors
  }
}
