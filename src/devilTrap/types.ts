export type DevilDifficulty = 'normal' | 'hard' | 'impossible';

export type BlockKind = 'solid' | 'crumble' | 'invisible' | 'fakeSolid' | 'bouncy';

export type SpikeDir = 'up' | 'down' | 'left' | 'right';

export interface BlockDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind?: BlockKind;
  /** Seconds before a crumble block drops after being stepped on */
  crumbleDelay?: number;
}

export interface SpikeDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  dir: SpikeDir;
  /** Starts hidden/retracted until triggered */
  hidden?: boolean;
}

export interface SawDef {
  id: string;
  x: number;
  y: number;
  r: number;
  hidden?: boolean;
  /** Optional continuous oscillation patrol */
  patrol?: {
    dx: number;
    dy: number;
    speed: number;
  };
}

export interface DoorDef {
  x: number;
  y: number;
}

export interface FakeDoorDef {
  id: string;
  x: number;
  y: number;
}

export type TriggerAction =
  | { type: 'moveBlock'; targetId: string; dx: number; dy: number; speed: number }
  | { type: 'dropBlock'; targetId: string; delay?: number }
  | { type: 'hideBlock'; targetId: string }
  | { type: 'revealBlock'; targetId: string }
  | { type: 'toggleSpike'; targetId: string; show: boolean }
  | { type: 'moveSpike'; targetId: string; dx: number; dy: number; speed: number }
  | { type: 'moveSaw'; targetId: string; dx: number; dy: number; speed: number; show?: boolean }
  | { type: 'moveDoor'; dx: number; dy: number; speed: number }
  | { type: 'flipGravity'; dir: 1 | -1 }
  | { type: 'reverseControls'; active: boolean };

export interface TriggerDef {
  id: string;
  zone: { x: number; y: number; w: number; h: number };
  requireAirborne?: boolean;
  delay?: number;
  taunt?: { ar: string; en: string };
  actions: TriggerAction[];
}

export interface DevilLevelDef {
  id: string;
  difficulty: DevilDifficulty;
  indexInTier: number; // 1..5
  titleAr: string;
  titleEn: string;
  hintAr: string;
  hintEn: string;
  spawn: { x: number; y: number };
  door: DoorDef;
  fakeDoors?: FakeDoorDef[];
  blocks: BlockDef[];
  spikes: SpikeDef[];
  saws?: SawDef[];
  triggers: TriggerDef[];
}

export interface DevilTrapStats {
  completedLevelIds: string[];
  totalDeaths: number;
  bestDeathsByLevel: Record<string, number>;
}

const STORAGE_KEY = 'point_catcher_devil_trap_v1';

export const EMPTY_DEVIL_TRAP_STATS: DevilTrapStats = {
  completedLevelIds: [],
  totalDeaths: 0,
  bestDeathsByLevel: {},
};

export function readDevilTrapStats(): DevilTrapStats {
  if (typeof window === 'undefined') return EMPTY_DEVIL_TRAP_STATS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DEVIL_TRAP_STATS;
    const parsed = JSON.parse(raw) as Partial<DevilTrapStats>;
    return {
      completedLevelIds: Array.isArray(parsed.completedLevelIds)
        ? parsed.completedLevelIds.filter((x): x is string => typeof x === 'string')
        : [],
      totalDeaths: typeof parsed.totalDeaths === 'number' && Number.isFinite(parsed.totalDeaths)
        ? Math.max(0, Math.floor(parsed.totalDeaths))
        : 0,
      bestDeathsByLevel:
        parsed.bestDeathsByLevel && typeof parsed.bestDeathsByLevel === 'object'
          ? (parsed.bestDeathsByLevel as Record<string, number>)
          : {},
    };
  } catch {
    return EMPTY_DEVIL_TRAP_STATS;
  }
}

export function saveDevilTrapStats(stats: DevilTrapStats): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors
  }
}
