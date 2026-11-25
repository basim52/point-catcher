import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type IconProps = { className?: string };

const IconX: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconPlay: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);

const IconCheck: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconSkull: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3a8 8 0 0 0-8 8c0 2.7 1.3 5 3.3 6.4V20a1 1 0 0 0 1 1h7.4a1 1 0 0 0 1-1v-2.6A8 8 0 0 0 12 3Z" />
    <circle cx="9" cy="11.5" r="1.4" fill="currentColor" />
    <circle cx="15" cy="11.5" r="1.4" fill="currentColor" />
    <line x1="10" y1="18" x2="10" y2="21" />
    <line x1="14" y1="18" x2="14" y2="21" />
  </svg>
);

const IconVolume2: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 5a9.5 9.5 0 0 1 0 14" />
  </svg>
);

const IconVolumeX: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="22" y1="9" x2="16" y2="15" />
    <line x1="16" y1="9" x2="22" y2="15" />
  </svg>
);

const IconHelpCircle: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4" />
    <line x1="12" y1="17.5" x2="12.01" y2="17.5" />
  </svg>
);

const IconRotateCcw: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10" />
  </svg>
);

const IconSparkles: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
    <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />
  </svg>
);

const IconTrophy: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
    <path d="M6 4h12v5a6 6 0 0 1-12 0V4Z" />
    <line x1="12" y1="15" x2="12" y2="20" />
    <line x1="8" y1="20" x2="16" y2="20" />
  </svg>
);

const IconFlame: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12.5 2.2c.4 3.1-1.9 4.7-2.6 6.7-.5 1.4.2 2.9 1.4 3.4-.3-1.4.7-2.6 1.8-3.2 2.4 1.8 4.4 4.3 4.4 7.4a6 6 0 0 1-12 0c0-3.3 2.1-6.2 4.3-8.6 1.1-1.2 2.1-3.1 2.7-5.7Z" />
  </svg>
);

const IconArrowLeft: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconArrowRight: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconArrowUp: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const IconLock: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const X = IconX;
const Play = IconPlay;
const Check = IconCheck;
const Skull = IconSkull;
const Volume2 = IconVolume2;
const VolumeX = IconVolumeX;
const HelpCircle = IconHelpCircle;
const RotateCcw = IconRotateCcw;
const Sparkles = IconSparkles;
const Trophy = IconTrophy;
const Flame = IconFlame;
const ArrowLeft = IconArrowLeft;
const ArrowRight = IconArrowRight;
const ArrowUp = IconArrowUp;
const Lock = IconLock;
import { devilAudio } from './audio';
import {
  DEVIL_TRAP_LEVELS,
  DEVIL_TRAP_LEVELS_PER_TIER,
  DEVIL_TRAP_TOTAL_LEVELS,
  getLevelsByDifficulty,
} from './levels';
import {
  readDevilTrapStats,
  saveDevilTrapStats,
  type BlockKind,
  type DevilDifficulty,
  type DevilLevelDef,
  type DevilTrapStats,
  type SpikeDir,
} from './types';

// Logical 16:9 canvas dimensions
const CANVAS_W = 960;
const CANVAS_H = 540;

// Physics constants (tuned for crisp, fair, zero-slip 2D platforming)
const BASE_PLAYER_W = 24;
const BASE_PLAYER_H = 32;
const PLAYER_SCALE = 1.5;
const PLAYER_W = Math.round(BASE_PLAYER_W * PLAYER_SCALE); // 36 (+50%)
const PLAYER_H = Math.round(BASE_PLAYER_H * PLAYER_SCALE); // 48 (+50%)
const DOOR_W = 36;
const DOOR_H = 54;
const GRAVITY = 1650;
const JUMP_VEL = 615;
const BOUNCE_VEL = 760;
const RUN_SPEED = 290;
const GROUND_ACCEL = 2900;
const AIR_ACCEL = 2150;
const MAX_FALL = 820;
const COYOTE_TIME = 0.095;
const JUMP_BUFFER = 0.105;

interface Palette {
  bg: string;
  bgInner: string;
  blockFill: string;
  blockTop: string;
  blockEdge: string;
  crumbleFill: string;
  crumbleCrack: string;
  bouncyFill: string;
  spikeFill: string;
  spikeGlint: string;
  sawBlade: string;
  sawCore: string;
  doorGlow: string;
  doorInner: string;
  doorFrame: string;
  playerFill: string;
  playerEye: string;
  accent: string;
  badgeText: string;
}

const PALETTES: Record<DevilDifficulty, Palette> = {
  normal: {
    bg: '#091826',
    bgInner: '#102A3E',
    blockFill: '#14B8A6',
    blockTop: '#5EEAD4',
    blockEdge: '#0F766E',
    crumbleFill: '#0D9488',
    crumbleCrack: '#042F2E',
    bouncyFill: '#FACC15',
    spikeFill: '#0B0F1A',
    spikeGlint: '#38BDF8',
    sawBlade: '#0F172A',
    sawCore: '#F43F5E',
    doorGlow: 'rgba(103, 232, 249, 0.34)',
    doorInner: '#ECFEFF',
    doorFrame: '#062030',
    playerFill: '#070B14',
    playerEye: '#67E8F9',
    accent: '#2DD4BF',
    badgeText: '#CCFBF1',
  },
  hard: {
    bg: '#130A2A',
    bgInner: '#211245',
    blockFill: '#A855F7',
    blockTop: '#D8B4FE',
    blockEdge: '#6B21A8',
    crumbleFill: '#9333EA',
    crumbleCrack: '#2E1065',
    bouncyFill: '#22D3EE',
    spikeFill: '#0D061F',
    spikeGlint: '#F472B6',
    sawBlade: '#140826',
    sawCore: '#FB7185',
    doorGlow: 'rgba(244, 114, 182, 0.34)',
    doorInner: '#FDF2F8',
    doorFrame: '#190830',
    playerFill: '#0A0416',
    playerEye: '#F9A8D4',
    accent: '#E879F9',
    badgeText: '#FAE8FF',
  },
  impossible: {
    bg: '#07140E',
    bgInner: '#0F261A',
    blockFill: '#84CC16',
    blockTop: '#BEF264',
    blockEdge: '#4D7C0F',
    crumbleFill: '#65A30D',
    crumbleCrack: '#1A2E05',
    bouncyFill: '#38BDF8',
    spikeFill: '#DC2626',
    spikeGlint: '#D9F99D',
    sawBlade: '#07120B',
    sawCore: '#F43F5E',
    doorGlow: 'rgba(190, 242, 100, 0.36)',
    doorInner: '#F7FEE7',
    doorFrame: '#081C10',
    playerFill: '#050C08',
    playerEye: '#BEF264',
    accent: '#A3E635',
    badgeText: '#ECFCCB',
  },
};

interface RuntimeBlock {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: BlockKind;
  crumbleDelay: number;
  visible: boolean;
  solid: boolean;
  // Movement / drop state
  targetX: number;
  targetY: number;
  moveSpeed: number;
  dropping: boolean;
  dropVy: number;
  dropWait: number;
  crumbleTimer: number; // >0 once stepped on
  shakeX: number;
}

interface RuntimeSpike {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  dir: SpikeDir;
  active: boolean;
  extend: number; // 0..1 smooth pop animation
  targetX: number;
  targetY: number;
  moveSpeed: number;
}

interface RuntimeSaw {
  id: string;
  x: number;
  y: number;
  r: number;
  active: boolean;
  angle: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  moveSpeed: number;
  patrol?: { dx: number; dy: number; speed: number; t: number };
}

interface RuntimeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

interface FloatingTaunt {
  text: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

interface RuntimeState {
  level: DevilLevelDef;
  px: number;
  py: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  coyote: number;
  jumpBuffer: number;
  gravityDir: 1 | -1;
  controlsReversed: boolean;
  scaleX: number;
  scaleY: number;
  runCycle: number;
  shockTimer: number;
  dead: boolean;
  deathTimer: number;
  won: boolean;
  winTimer: number;
  shakeTimer: number;
  shakeIntensity: number;
  doorX: number;
  doorY: number;
  doorTargetX: number;
  doorTargetY: number;
  doorSpeed: number;
  blocks: RuntimeBlock[];
  spikes: RuntimeSpike[];
  saws: RuntimeSaw[];
  firedTriggers: Set<string>;
  particles: RuntimeParticle[];
  taunts: FloatingTaunt[];
  time: number;
}

function createRuntimeState(level: DevilLevelDef): RuntimeState {
  return {
    level,
    px: level.spawn.x - (PLAYER_W - BASE_PLAYER_W) / 2,
    py: level.spawn.y - (PLAYER_H - BASE_PLAYER_H),
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: false,
    coyote: 0,
    jumpBuffer: 0,
    gravityDir: 1,
    controlsReversed: false,
    scaleX: 1,
    scaleY: 1,
    runCycle: 0,
    shockTimer: 0,
    dead: false,
    deathTimer: 0,
    won: false,
    winTimer: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
    doorX: level.door.x,
    doorY: level.door.y,
    doorTargetX: level.door.x,
    doorTargetY: level.door.y,
    doorSpeed: 0,
    blocks: level.blocks.map((b) => {
      const kind = b.kind ?? 'solid';
      return {
        id: b.id,
        x: b.x,
        y: b.y,
        w: b.w,
        h: b.h,
        kind,
        crumbleDelay: b.crumbleDelay ?? 0.3,
        visible: kind !== 'invisible',
        solid: kind !== 'fakeSolid',
        targetX: b.x,
        targetY: b.y,
        moveSpeed: 0,
        dropping: false,
        dropVy: 0,
        dropWait: 0,
        crumbleTimer: -1,
        shakeX: 0,
      };
    }),
    spikes: level.spikes.map((s) => ({
      id: s.id,
      x: s.x,
      y: s.y,
      w: s.w,
      h: s.h,
      dir: s.dir,
      active: !s.hidden,
      extend: s.hidden ? 0 : 1,
      targetX: s.x,
      targetY: s.y,
      moveSpeed: 0,
    })),
    saws: (level.saws ?? []).map((saw) => ({
      id: saw.id,
      x: saw.x,
      y: saw.y,
      r: saw.r,
      active: !saw.hidden,
      angle: 0,
      originX: saw.x,
      originY: saw.y,
      targetX: saw.x,
      targetY: saw.y,
      moveSpeed: 0,
      patrol: saw.patrol ? { ...saw.patrol, t: 0 } : undefined,
    })),
    firedTriggers: new Set<string>(),
    particles: [],
    taunts: [],
    time: 0,
  };
}

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function moveToward(cur: number, target: number, maxDelta: number): number {
  if (Math.abs(target - cur) <= maxDelta) return target;
  return cur + Math.sign(target - cur) * maxDelta;
}

const DIFF_META: Record<
  DevilDifficulty,
  {
    ar: string;
    en: string;
    subAr: string;
    subEn: string;
    accentClass: string;
    borderClass: string;
    bgClass: string;
  }
> = {
  normal: {
    ar: 'عادي',
    en: 'Normal',
    subAr: '100 مرحلة · خدع كلاسيكية متدرجة',
    subEn: '100 Stages · Classic Troll Traps',
    accentClass: 'text-teal-300',
    borderClass: 'border-teal-400/55',
    bgClass: 'bg-teal-500/15',
  },
  hard: {
    ar: 'صعب',
    en: 'Hard',
    subAr: '100 مرحلة · مناشير وأبواب كاذبة وعكس تحكم',
    subEn: '100 Stages · Saws, Fake Doors & Reversed Controls',
    accentClass: 'text-fuchsia-300',
    borderClass: 'border-fuchsia-400/55',
    bgClass: 'bg-fuchsia-500/15',
  },
  impossible: {
    ar: 'مستحيل',
    en: 'Impossible',
    subAr: '100 مرحلة · جاذبية مقلوبة ومكابس وجحيم الخدع',
    subEn: '100 Stages · Gravity Flips, Crushers & Pure Chaos',
    accentClass: 'text-lime-300',
    borderClass: 'border-lime-400/55',
    bgClass: 'bg-lime-500/15',
  },
};

export interface DevilTrapGameProps {
  lang: 'ar' | 'en';
  onExit: () => void;
}

export const DevilTrapGame: React.FC<DevilTrapGameProps> = ({ lang, onExit }) => {
  const isAr = lang === 'ar';

  const [stats, setStats] = useState<DevilTrapStats>(() => readDevilTrapStats());
  const [view, setView] = useState<'menu' | 'playing'>('menu');
  const [selectedDiff, setSelectedDiff] = useState<DevilDifficulty>('normal');
  const [stagePage, setStagePage] = useState<number>(0); // 0..4 (20 stages per page)
  const [currentLevel, setCurrentLevel] = useState<DevilLevelDef>(DEVIL_TRAP_LEVELS[0]);
  const [stageDeaths, setStageDeaths] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [stageCleared, setStageCleared] = useState(false);
  const [muted, setMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<RuntimeState>(createRuntimeState(DEVIL_TRAP_LEVELS[0]));
  const keysRef = useRef({ left: false, right: false, jumpHeld: false });
  const stageDeathsRef = useRef(0);
  const statsRef = useRef(stats);
  statsRef.current = stats;

  const tierLevels = useMemo(() => getLevelsByDifficulty(selectedDiff), [selectedDiff]);

  const completedSet = useMemo(
    () => new Set(stats.completedLevelIds),
    [stats.completedLevelIds]
  );

  const isLevelUnlocked = useCallback(
    (lvl: DevilLevelDef): boolean => {
      if (lvl.indexInTier <= 1) return true;
      const done = statsRef.current.completedLevelIds;
      if (done.includes(lvl.id)) return true;
      const sameTier = getLevelsByDifficulty(lvl.difficulty);
      const prevLvl = sameTier[lvl.indexInTier - 2];
      return prevLvl ? done.includes(prevLvl.id) : true;
    },
    []
  );

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      devilAudio.muted = next;
      return next;
    });
  }, []);

  const startLevel = useCallback(
    (lvl: DevilLevelDef) => {
      if (!isLevelUnlocked(lvl)) return;
      setSelectedDiff(lvl.difficulty);
      setStagePage(Math.floor((lvl.indexInTier - 1) / 20));
      setCurrentLevel(lvl);
      setStageDeaths(0);
      stageDeathsRef.current = 0;
      setShowHint(false);
      setStageCleared(false);
      stateRef.current = createRuntimeState(lvl);
      keysRef.current = { left: false, right: false, jumpHeld: false };
      setView('playing');
    },
    [isLevelUnlocked]
  );

  const restartCurrentLevel = useCallback(() => {
    setStageCleared(false);
    stateRef.current = createRuntimeState(currentLevel);
  }, [currentLevel]);

  const handleNextLevel = useCallback(() => {
    const idx = DEVIL_TRAP_LEVELS.findIndex((l) => l.id === currentLevel.id);
    if (idx >= 0 && idx + 1 < DEVIL_TRAP_LEVELS.length) {
      startLevel(DEVIL_TRAP_LEVELS[idx + 1]);
    } else {
      setView('menu');
    }
  }, [currentLevel.id, startLevel]);

  // Keyboard controls
  useEffect(() => {
    if (view !== 'playing') return;

    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (
        code === 'ArrowLeft' ||
        code === 'ArrowRight' ||
        code === 'ArrowUp' ||
        code === 'Space'
      ) {
        e.preventDefault();
      }
      if (code === 'Escape') {
        e.preventDefault();
        setView('menu');
        return;
      }
      if (stageCleared) {
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          handleNextLevel();
        } else if (code === 'KeyR') {
          e.preventDefault();
          restartCurrentLevel();
        }
        return;
      }
      if (code === 'KeyR') {
        e.preventDefault();
        restartCurrentLevel();
        return;
      }
      if (code === 'ArrowLeft' || code === 'KeyA') {
        keysRef.current.left = true;
      }
      if (code === 'ArrowRight' || code === 'KeyD') {
        keysRef.current.right = true;
      }
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
        if (!keysRef.current.jumpHeld) {
          stateRef.current.jumpBuffer = JUMP_BUFFER;
        }
        keysRef.current.jumpHeld = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'ArrowLeft' || code === 'KeyA') {
        keysRef.current.left = false;
      }
      if (code === 'ArrowRight' || code === 'KeyD') {
        keysRef.current.right = false;
      }
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
        keysRef.current.jumpHeld = false;
        // Variable jump height cut
        const s = stateRef.current;
        if (!s.dead && !s.won) {
          if (s.gravityDir === 1 && s.vy < -210) {
            s.vy *= 0.52;
          } else if (s.gravityDir === -1 && s.vy > 210) {
            s.vy *= 0.52;
          }
        }
      }
    };

    const onBlur = () => {
      keysRef.current = { left: false, right: false, jumpHeld: false };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [view, stageCleared, handleNextLevel, restartCurrentLevel]);

  // Main 60fps Game Loop (Canvas 2D)
  useEffect(() => {
    if (view !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    const spawnBurst = (
      s: RuntimeState,
      x: number,
      y: number,
      count: number,
      color: string,
      speed = 210
    ) => {
      for (let i = 0; i < count; i += 1) {
        const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const mag = speed * (0.35 + Math.random() * 0.75);
        s.particles.push({
          x,
          y,
          vx: Math.cos(ang) * mag,
          vy: Math.sin(ang) * mag - 45,
          size: 3 + Math.random() * 4.5,
          life: 0.25 + Math.random() * 0.25,
          maxLife: 0.5,
          color,
        });
      }
    };

    const killPlayer = (s: RuntimeState, customTaunt?: string) => {
      if (s.dead || s.won) return;
      s.dead = true;
      s.deathTimer = 0.28;
      s.shakeTimer = 0.16;
      s.shakeIntensity = 7;
      devilAudio.playDeath();

      const pal = PALETTES[s.level.difficulty];
      spawnBurst(s, s.px + PLAYER_W / 2, s.py + PLAYER_H / 2, 18, pal.playerFill, 260);
      spawnBurst(s, s.px + PLAYER_W / 2, s.py + PLAYER_H / 2, 10, pal.accent, 210);

      if (customTaunt) {
        s.taunts.push({
          text: customTaunt,
          x: Math.min(820, Math.max(140, s.px + PLAYER_W / 2)),
          y: Math.max(130, s.py - 18),
          life: 1.05,
          maxLife: 1.05,
        });
      }

      stageDeathsRef.current += 1;
      setStageDeaths(stageDeathsRef.current);

      const nextStats: DevilTrapStats = {
        ...statsRef.current,
        totalDeaths: statsRef.current.totalDeaths + 1,
      };
      statsRef.current = nextStats;
      saveDevilTrapStats(nextStats);
      setStats(nextStats);
    };

    const winStage = (s: RuntimeState) => {
      if (s.won || s.dead) return;
      s.won = true;
      s.winTimer = 0;
      devilAudio.playWin();
      const pal = PALETTES[s.level.difficulty];
      spawnBurst(s, s.doorX + DOOR_W / 2, s.doorY + DOOR_H / 2, 24, pal.doorInner, 280);
      spawnBurst(s, s.doorX + DOOR_W / 2, s.doorY + DOOR_H / 2, 16, pal.accent, 220);

      const prev = statsRef.current;
      const completed = prev.completedLevelIds.includes(s.level.id)
        ? prev.completedLevelIds
        : [...prev.completedLevelIds, s.level.id];
      const prevBest = prev.bestDeathsByLevel[s.level.id];
      const bestForLevel =
        typeof prevBest === 'number'
          ? Math.min(prevBest, stageDeathsRef.current)
          : stageDeathsRef.current;

      const updated: DevilTrapStats = {
        ...prev,
        completedLevelIds: completed,
        bestDeathsByLevel: {
          ...prev.bestDeathsByLevel,
          [s.level.id]: bestForLevel,
        },
      };
      statsRef.current = updated;
      saveDevilTrapStats(updated);
      setStats(updated);
      setStageCleared(true);
    };

    const step = (dt: number) => {
      const s = stateRef.current;
      s.time += dt;
      const pal = PALETTES[s.level.difficulty];

      // Update screen shake
      if (s.shakeTimer > 0) {
        s.shakeTimer = Math.max(0, s.shakeTimer - dt);
      }

      // Update particles
      for (let i = s.particles.length - 1; i >= 0; i -= 1) {
        const p = s.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          s.particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 520 * dt;
      }

      // Update floating taunts
      for (let i = s.taunts.length - 1; i >= 0; i -= 1) {
        const t = s.taunts[i];
        t.life -= dt;
        t.y -= 28 * dt;
        if (t.life <= 0) s.taunts.splice(i, 1);
      }

      // Handle instant respawn after death
      if (s.dead) {
        s.deathTimer -= dt;
        if (s.deathTimer <= 0) {
          const fresh = createRuntimeState(s.level);
          // Carry over any lingering taunt slightly if helpful? Clean reset feels snappiest!
          stateRef.current = fresh;
        }
        return;
      }

      if (s.won) {
        s.winTimer += dt;
        return;
      }

      // 1. Evaluate triggers
      for (const trig of s.level.triggers) {
        if (s.firedTriggers.has(trig.id)) continue;
        if (trig.requireAirborne && s.grounded) continue;
        if (
          rectsOverlap(
            s.px,
            s.py,
            PLAYER_W,
            PLAYER_H,
            trig.zone.x,
            trig.zone.y,
            trig.zone.w,
            trig.zone.h
          )
        ) {
          s.firedTriggers.add(trig.id);
          s.shockTimer = 0.42;

          let playedSpecialSound = false;
          for (const act of trig.actions) {
            if (act.type === 'moveBlock') {
              const b = s.blocks.find((item) => item.id === act.targetId);
              if (b) {
                b.targetX = b.x + act.dx;
                b.targetY = b.y + act.dy;
                b.moveSpeed = act.speed;
              }
            } else if (act.type === 'dropBlock') {
              const b = s.blocks.find((item) => item.id === act.targetId);
              if (b) {
                b.dropping = true;
                b.dropWait = act.delay ?? 0;
              }
            } else if (act.type === 'hideBlock') {
              const b = s.blocks.find((item) => item.id === act.targetId);
              if (b) {
                b.visible = false;
                b.solid = false;
              }
            } else if (act.type === 'revealBlock') {
              const b = s.blocks.find((item) => item.id === act.targetId);
              if (b) {
                b.visible = true;
                b.solid = true;
                spawnBurst(s, b.x + b.w / 2, b.y + b.h / 2, 10, pal.blockTop, 130);
              }
            } else if (act.type === 'toggleSpike') {
              const sp = s.spikes.find((item) => item.id === act.targetId);
              if (sp) sp.active = act.show;
            } else if (act.type === 'moveSpike') {
              const sp = s.spikes.find((item) => item.id === act.targetId);
              if (sp) {
                sp.active = true;
                sp.targetX = sp.x + act.dx;
                sp.targetY = sp.y + act.dy;
                sp.moveSpeed = act.speed;
              }
            } else if (act.type === 'moveSaw') {
              const saw = s.saws.find((item) => item.id === act.targetId);
              if (saw) {
                if (act.show) saw.active = true;
                saw.targetX = saw.x + act.dx;
                saw.targetY = saw.y + act.dy;
                saw.moveSpeed = act.speed;
              }
            } else if (act.type === 'moveDoor') {
              s.doorTargetX = s.doorX + act.dx;
              s.doorTargetY = s.doorY + act.dy;
              s.doorSpeed = act.speed;
              devilAudio.playDoorTroll();
              playedSpecialSound = true;
            } else if (act.type === 'flipGravity') {
              s.gravityDir = act.dir;
              s.grounded = false;
              s.vy = act.dir * 120;
              devilAudio.playGravityFlip();
              playedSpecialSound = true;
            } else if (act.type === 'reverseControls') {
              s.controlsReversed = act.active;
              devilAudio.playDoorTroll();
              playedSpecialSound = true;
            }
          }

          if (!playedSpecialSound) {
            devilAudio.playTrap();
          }

          if (trig.taunt) {
            s.taunts.push({
              text: isAr ? trig.taunt.ar : trig.taunt.en,
              x: Math.min(820, Math.max(140, s.px + PLAYER_W / 2)),
              y: Math.max(125, s.py - 20),
              life: 1.0,
              maxLife: 1.0,
            });
          }
        }
      }

      // 2. Update moving / dropping / crumbling blocks
      for (const b of s.blocks) {
        const prevX = b.x;
        const prevY = b.y;

        if (b.moveSpeed > 0) {
          b.x = moveToward(b.x, b.targetX, b.moveSpeed * dt);
          b.y = moveToward(b.y, b.targetY, b.moveSpeed * dt);
        }

        if (b.crumbleTimer > 0) {
          b.crumbleTimer -= dt;
          b.shakeX = Math.sin(s.time * 75) * 3.5;
          if (b.crumbleTimer <= 0) {
            b.dropping = true;
            b.shakeX = 0;
            devilAudio.playTrap();
          }
        }

        if (b.dropping) {
          if (b.dropWait > 0) {
            b.dropWait -= dt;
          } else {
            b.dropVy += 1900 * dt;
            b.y += b.dropVy * dt;
            if (b.y > CANVAS_H + 140) {
              b.solid = false;
              b.visible = false;
            }
          }
        }

        const dx = b.x - prevX;
        const dy = b.y - prevY;

        // If a crushing block moves downward onto the player
        if (
          b.solid &&
          dy > 0 &&
          rectsOverlap(s.px + 2, s.py + 2, PLAYER_W - 4, PLAYER_H - 4, b.x, b.y, b.w, b.h)
        ) {
          if (s.grounded && s.gravityDir === 1) {
            killPlayer(s, isAr ? 'سُحقت!' : 'Crushed!');
            return;
          }
          s.py = b.y + b.h;
        }

        // Carry player horizontally if standing on moving platform
        if (
          b.solid &&
          dx !== 0 &&
          s.grounded &&
          s.px + PLAYER_W > prevX &&
          s.px < prevX + b.w
        ) {
          const onTop = s.gravityDir === 1 && Math.abs(s.py + PLAYER_H - prevY) < 4;
          const onBottom = s.gravityDir === -1 && Math.abs(s.py - (prevY + b.h)) < 4;
          if (onTop || onBottom) {
            s.px += dx;
          }
        }
      }

      // Update door movement
      if (s.doorSpeed > 0) {
        s.doorX = moveToward(s.doorX, s.doorTargetX, s.doorSpeed * dt);
        s.doorY = moveToward(s.doorY, s.doorTargetY, s.doorSpeed * dt);
      }

      // Update spikes
      for (const sp of s.spikes) {
        const targetExt = sp.active ? 1 : 0;
        sp.extend = moveToward(sp.extend, targetExt, dt * 11);
        if (sp.moveSpeed > 0) {
          sp.x = moveToward(sp.x, sp.targetX, sp.moveSpeed * dt);
          sp.y = moveToward(sp.y, sp.targetY, sp.moveSpeed * dt);
        }
      }

      // Update saws
      for (const saw of s.saws) {
        if (!saw.active) continue;
        saw.angle += dt * 9.5;
        if (saw.moveSpeed > 0) {
          saw.x = moveToward(saw.x, saw.targetX, saw.moveSpeed * dt);
          saw.y = moveToward(saw.y, saw.targetY, saw.moveSpeed * dt);
        } else if (saw.patrol) {
          saw.patrol.t += dt * saw.patrol.speed;
          const wave = (Math.sin(saw.patrol.t) + 1) * 0.5;
          saw.x = saw.originX + saw.patrol.dx * wave;
          saw.y = saw.originY + saw.patrol.dy * wave;
        }
      }

      // 3. Player horizontal physics
      const rawLeft = keysRef.current.left;
      const rawRight = keysRef.current.right;
      const moveLeft = s.controlsReversed ? rawRight : rawLeft;
      const moveRight = s.controlsReversed ? rawLeft : rawRight;

      let targetVx = 0;
      if (moveLeft && !moveRight) {
        targetVx = -RUN_SPEED;
        s.facing = -1;
      } else if (moveRight && !moveLeft) {
        targetVx = RUN_SPEED;
        s.facing = 1;
      }

      const accel = s.grounded ? GROUND_ACCEL : AIR_ACCEL;
      s.vx = moveToward(s.vx, targetVx, accel * dt);

      // Jump timers
      if (s.grounded) {
        s.coyote = COYOTE_TIME;
      } else {
        s.coyote = Math.max(0, s.coyote - dt);
      }
      if (s.jumpBuffer > 0) {
        s.jumpBuffer = Math.max(0, s.jumpBuffer - dt);
      }

      // Execute jump
      if (s.jumpBuffer > 0 && s.coyote > 0) {
        s.vy = -JUMP_VEL * s.gravityDir;
        s.grounded = false;
        s.coyote = 0;
        s.jumpBuffer = 0;
        s.scaleX = 0.76;
        s.scaleY = 1.28;
        devilAudio.playJump(s.gravityDir === -1);
        const dustY = s.gravityDir === 1 ? s.py + PLAYER_H : s.py;
        spawnBurst(s, s.px + PLAYER_W / 2, dustY, 6, pal.blockTop, 95);
      }

      // Gravity
      s.vy += GRAVITY * s.gravityDir * dt;
      if (s.gravityDir === 1 && s.vy > MAX_FALL) s.vy = MAX_FALL;
      if (s.gravityDir === -1 && s.vy < -MAX_FALL) s.vy = -MAX_FALL;

      // Move X & resolve collisions
      s.px += s.vx * dt;
      for (const b of s.blocks) {
        if (!b.solid) continue;
        if (rectsOverlap(s.px, s.py, PLAYER_W, PLAYER_H, b.x, b.y, b.w, b.h)) {
          if (s.vx > 0) {
            s.px = b.x - PLAYER_W;
          } else if (s.vx < 0) {
            s.px = b.x + b.w;
          }
          s.vx = 0;
        }
      }

      // Move Y & resolve collisions
      const wasGrounded = s.grounded;
      s.grounded = false;
      s.py += s.vy * dt;

      for (const b of s.blocks) {
        if (!b.solid) continue;
        if (rectsOverlap(s.px, s.py, PLAYER_W, PLAYER_H, b.x, b.y, b.w, b.h)) {
          if (s.vy > 0) {
            s.py = b.y - PLAYER_H;
            if (s.gravityDir === 1) {
              if (b.kind === 'bouncy') {
                s.vy = -BOUNCE_VEL;
                s.scaleX = 0.7;
                s.scaleY = 1.35;
                devilAudio.playBounce();
                spawnBurst(s, s.px + PLAYER_W / 2, s.py + PLAYER_H, 10, pal.bouncyFill, 150);
                continue;
              }
              s.grounded = true;
              if (b.kind === 'crumble' && b.crumbleTimer < 0 && !b.dropping) {
                b.crumbleTimer = b.crumbleDelay;
              }
            } else if (b.kind === 'invisible' && !b.visible) {
              b.visible = true;
            }
            s.vy = 0;
          } else if (s.vy < 0) {
            s.py = b.y + b.h;
            if (s.gravityDir === -1) {
              s.grounded = true;
              if (b.kind === 'crumble' && b.crumbleTimer < 0 && !b.dropping) {
                b.crumbleTimer = b.crumbleDelay;
              }
            } else if (b.kind === 'invisible' && !b.visible) {
              b.visible = true;
            }
            s.vy = 0;
          }
        }
      }

      // Landing squash
      if (!wasGrounded && s.grounded) {
        s.scaleX = 1.24;
        s.scaleY = 0.78;
        const dustY = s.gravityDir === 1 ? s.py + PLAYER_H : s.py;
        spawnBurst(s, s.px + PLAYER_W / 2, dustY, 5, pal.blockTop, 80);
      }

      // Smooth spring scale recovery
      s.scaleX += (1 - s.scaleX) * Math.min(1, dt * 16);
      s.scaleY += (1 - s.scaleY) * Math.min(1, dt * 16);

      if (s.grounded && Math.abs(s.vx) > 25) {
        s.runCycle += dt * 16;
      } else {
        s.runCycle = 0;
      }
      if (s.shockTimer > 0) s.shockTimer = Math.max(0, s.shockTimer - dt);

      // 4. Hazard Checks
      // Pit / ceiling abyss death
      if (s.py > CANVAS_H + 36 || s.py + PLAYER_H < -48) {
        killPlayer(s);
        return;
      }

      // Spikes (forgiving inset scaled for enlarged hero)
      for (const sp of s.spikes) {
        if (sp.extend < 0.35) continue;
        const insetX = 4;
        const insetY = 4;
        if (
          rectsOverlap(
            s.px + 5,
            s.py + 5,
            PLAYER_W - 10,
            PLAYER_H - 10,
            sp.x + insetX,
            sp.y + insetY,
            Math.max(4, sp.w - insetX * 2),
            Math.max(4, sp.h - insetY * 2)
          )
        ) {
          killPlayer(s);
          return;
        }
      }

      // Saws (circle vs player box)
      for (const saw of s.saws) {
        if (!saw.active) continue;
        const nearestX = Math.max(s.px + 5, Math.min(saw.x, s.px + PLAYER_W - 5));
        const nearestY = Math.max(s.py + 5, Math.min(saw.y, s.py + PLAYER_H - 5));
        const dx = saw.x - nearestX;
        const dy = saw.y - nearestY;
        const hitR = saw.r - 4;
        if (dx * dx + dy * dy < hitR * hitR) {
          killPlayer(s);
          return;
        }
      }

      // Fake Doors
      if (s.level.fakeDoors) {
        for (const fd of s.level.fakeDoors) {
          if (rectsOverlap(s.px, s.py, PLAYER_W, PLAYER_H, fd.x + 4, fd.y + 4, DOOR_W - 8, DOOR_H - 4)) {
            killPlayer(s, isAr ? 'باب مزيف! اصعد للأعلى!' : 'Fake door! Go up!');
            return;
          }
        }
      }

      // Real Exit Door
      if (
        rectsOverlap(
          s.px,
          s.py,
          PLAYER_W,
          PLAYER_H,
          s.doorX + 6,
          s.doorY + 6,
          DOOR_W - 12,
          DOOR_H - 6
        )
      ) {
        winStage(s);
      }
    };

    const drawDoor = (x: number, y: number, pal: Palette, time: number, isFake = false) => {
      const cx = x + DOOR_W / 2;
      const cy = y + DOOR_H / 2;

      // Soft pulsing light aura
      const pulse = 1 + Math.sin(time * 4.5) * 0.08;
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 52 * pulse);
      grad.addColorStop(0, pal.doorGlow);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - 36, y - 36, DOOR_W + 72, DOOR_H + 72);

      // Outer dark archway
      ctx.fillStyle = pal.doorFrame;
      ctx.beginPath();
      ctx.roundRect(x - 3, y - 3, DOOR_W + 6, DOOR_H + 3, [18, 18, 2, 2]);
      ctx.fill();

      // Glowing doorway interior
      ctx.fillStyle = pal.doorInner;
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, DOOR_W - 6, DOOR_H - 3, [14, 14, 0, 0]);
      ctx.fill();

      // Subtle inner shimmer stripe
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(x + 9, y + 10, 5, DOOR_H - 14);

      // Tiny barely-noticeable devil horns quirk on fake doors for eagle-eyed players
      if (isFake) {
        ctx.fillStyle = pal.doorFrame;
        ctx.fillRect(cx - 5, y + 18, 3, 3);
        ctx.fillRect(cx + 2, y + 18, 3, 3);
      }
    };

    const drawSpikes = (sp: RuntimeSpike, pal: Palette) => {
      if (sp.extend <= 0.02) return;
      const teeth = Math.max(1, Math.round(sp.w / 16));
      const tw = sp.w / teeth;
      const extH = sp.h * sp.extend;

      ctx.save();
      for (let i = 0; i < teeth; i += 1) {
        const tx = sp.x + i * tw;
        ctx.beginPath();
        if (sp.dir === 'up') {
          const baseY = sp.y + sp.h;
          ctx.moveTo(tx + 1, baseY);
          ctx.lineTo(tx + tw / 2, baseY - extH);
          ctx.lineTo(tx + tw - 1, baseY);
        } else {
          const baseY = sp.y;
          ctx.moveTo(tx + 1, baseY);
          ctx.lineTo(tx + tw / 2, baseY + extH);
          ctx.lineTo(tx + tw - 1, baseY);
        }
        ctx.closePath();
        ctx.fillStyle = pal.spikeFill;
        ctx.fill();
        ctx.strokeStyle = pal.spikeGlint;
        ctx.lineWidth = 1.25;
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawSaw = (saw: RuntimeSaw, pal: Palette) => {
      if (!saw.active) return;
      ctx.save();
      ctx.translate(saw.x, saw.y);
      ctx.rotate(saw.angle);

      const teeth = 10;
      const outerR = saw.r;
      const innerR = saw.r * 0.72;
      ctx.beginPath();
      for (let i = 0; i < teeth * 2; i += 1) {
        const ang = (i * Math.PI) / teeth;
        const rad = i % 2 === 0 ? outerR : innerR;
        const x = Math.cos(ang) * rad;
        const y = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = pal.sawBlade;
      ctx.fill();
      ctx.strokeStyle = pal.spikeGlint;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Glowing hub
      ctx.beginPath();
      ctx.arc(0, 0, saw.r * 0.34, 0, Math.PI * 2);
      ctx.fillStyle = pal.sawCore;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, saw.r * 0.14, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      const s = stateRef.current;
      const pal = PALETTES[s.level.difficulty];

      ctx.save();
      // Camera shake offset
      if (s.shakeTimer > 0) {
        const mag = s.shakeIntensity * (s.shakeTimer / 0.16);
        ctx.translate((Math.random() - 0.5) * mag * 2, (Math.random() - 0.5) * mag * 2);
      }

      // 1. Background gradient
      const bgGrad = ctx.createRadialGradient(
        CANVAS_W * 0.5,
        CANVAS_H * 0.45,
        40,
        CANVAS_W * 0.5,
        CANVAS_H * 0.5,
        560
      );
      bgGrad.addColorStop(0, pal.bgInner);
      bgGrad.addColorStop(1, pal.bg);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Subtle atmospheric vertical grid lines (very understated)
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let gx = 80; gx < CANVAS_W; gx += 80) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, CANVAS_H);
        ctx.stroke();
      }

      // Gravity-flipped atmospheric lines
      if (s.gravityDir === -1) {
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.14)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i += 1) {
          const lx = 90 + i * 110;
          const ly = CANVAS_H - ((s.time * 180 + i * 70) % CANVAS_H);
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx, ly + 26);
          ctx.stroke();
        }
      }

      // Reversed controls room edge glow
      if (s.controlsReversed) {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
        ctx.lineWidth = 8;
        ctx.strokeRect(42, 108, CANVAS_W - 84, CANVAS_H - 116);
      }

      // 2. Doors (fake & real)
      if (s.level.fakeDoors) {
        for (const fd of s.level.fakeDoors) {
          drawDoor(fd.x, fd.y, pal, s.time, true);
        }
      }
      drawDoor(s.doorX, s.doorY, pal, s.time, false);

      // 3. Spikes (drawn right before blocks so hidden bases tuck cleanly)
      for (const sp of s.spikes) {
        drawSpikes(sp, pal);
      }

      // 4. Blocks / Terrain
      for (const b of s.blocks) {
        if (!b.visible) continue;
        const bx = b.x + b.shakeX;
        const by = b.y;

        if (b.kind === 'bouncy') {
          ctx.fillStyle = pal.bouncyFill;
          ctx.beginPath();
          ctx.roundRect(bx, by, b.w, b.h, 6);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.fillRect(bx + 6, by + 3, b.w - 12, 4);
          // Upward chevron hint
          ctx.strokeStyle = '#064E3B';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(bx + b.w / 2 - 7, by + b.h - 6);
          ctx.lineTo(bx + b.w / 2, by + 6);
          ctx.lineTo(bx + b.w / 2 + 7, by + b.h - 6);
          ctx.stroke();
          continue;
        }

        const isCrumble = b.kind === 'crumble';
        const isFake = b.kind === 'fakeSolid';

        ctx.fillStyle = isCrumble ? pal.crumbleFill : pal.blockFill;
        if (isFake) {
          ctx.globalAlpha = 0.78;
        }
        ctx.fillRect(bx, by, b.w, b.h);

        // Crisp top bevel highlight for playable floor surfaces
        if (by > 40 && b.w >= 30) {
          ctx.fillStyle = pal.blockTop;
          ctx.fillRect(bx, by, b.w, Math.min(5, b.h));
        }

        // Subtle dark border seam
        ctx.strokeStyle = pal.blockEdge;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx + 0.75, by + 0.75, b.w - 1.5, b.h - 1.5);

        // Crack lines on crumbling stones
        if (isCrumble) {
          ctx.strokeStyle = pal.crumbleCrack;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx + b.w * 0.25, by + 2);
          ctx.lineTo(bx + b.w * 0.34, by + b.h * 0.55);
          ctx.lineTo(bx + b.w * 0.28, by + b.h - 2);
          ctx.moveTo(bx + b.w * 0.68, by + 2);
          ctx.lineTo(bx + b.w * 0.62, by + b.h * 0.6);
          ctx.lineTo(bx + b.w * 0.74, by + b.h - 2);
          ctx.stroke();
        }

        if (isFake) {
          ctx.globalAlpha = 1;
        }
      }

      // 5. Spinning Saws
      for (const saw of s.saws) {
        drawSaw(saw, pal);
      }

      // 6. Player Hero (iconic Level Devil silhouetted runner)
      if (!s.dead) {
        const cx = s.px + PLAYER_W / 2;
        const pivotY = s.gravityDir === 1 ? s.py + PLAYER_H : s.py;

        ctx.save();
        ctx.translate(cx, pivotY);
        ctx.scale(s.scaleX * PLAYER_SCALE, s.scaleY * PLAYER_SCALE * s.gravityDir);

        // Tiny animated legs
        const legSwing = Math.sin(s.runCycle) * 4.5;
        ctx.fillStyle = pal.playerFill;
        ctx.fillRect(-7 + legSwing * 0.6, -7, 5, 7);
        ctx.fillRect(2 - legSwing * 0.6, -7, 5, 7);

        // Crisp rounded square torso/head
        ctx.beginPath();
        ctx.roundRect(-11, -31, 22, 25, 5);
        ctx.fill();

        // Expressive eyes looking in facing direction
        const eyeOffsetX = s.facing * 3;
        const eyeRadius = s.shockTimer > 0 ? 3.2 : 2.3;
        ctx.fillStyle = pal.playerEye;
        ctx.beginPath();
        ctx.arc(-3.5 + eyeOffsetX, -20, eyeRadius, 0, Math.PI * 2);
        ctx.arc(4.5 + eyeOffsetX, -20, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Tiny shocked mouth when a trap triggers!
        if (s.shockTimer > 0) {
          ctx.beginPath();
          ctx.arc(0.5 + eyeOffsetX, -13, 2.3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Reversed controls indicator right above player
        if (s.controlsReversed) {
          ctx.save();
          ctx.font = 'bold 14px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#FDA4AF';
          ctx.fillText('⇄', cx, s.py - 10);
          ctx.restore();
        }
      }

      // 7. Particles
      for (const p of s.particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      // 8. Floating witty taunts
      for (const t of s.taunts) {
        const alpha = Math.min(1, t.life / 0.35);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = '800 18px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000000';
        ctx.fillText(t.text, t.x + 2, t.y + 2);
        ctx.fillStyle = '#FFFBEB';
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      }

      ctx.restore();
    };

    const loop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(0.033, Math.max(0.001, rawDt));

      step(dt);
      render();
      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [view, isAr]);

  // Touch helper handlers
  const bindHold = (dir: 'left' | 'right') => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      keysRef.current[dir] = true;
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      keysRef.current[dir] = false;
    },
    onPointerLeave: () => {
      keysRef.current[dir] = false;
    },
    onPointerCancel: () => {
      keysRef.current[dir] = false;
    },
  });

  const handleTouchJumpDown = (e: React.PointerEvent) => {
    e.preventDefault();
    stateRef.current.jumpBuffer = JUMP_BUFFER;
    keysRef.current.jumpHeld = true;
  };

  const handleTouchJumpUp = (e: React.PointerEvent) => {
    e.preventDefault();
    keysRef.current.jumpHeld = false;
    const s = stateRef.current;
    if (!s.dead && !s.won) {
      if (s.gravityDir === 1 && s.vy < -210) s.vy *= 0.52;
      else if (s.gravityDir === -1 && s.vy > 210) s.vy *= 0.52;
    }
  };

  const diffMeta = DIFF_META[currentLevel.difficulty];
  const nextLevelObj = useMemo(() => {
    const idx = DEVIL_TRAP_LEVELS.findIndex((l) => l.id === currentLevel.id);
    return idx >= 0 && idx + 1 < DEVIL_TRAP_LEVELS.length ? DEVIL_TRAP_LEVELS[idx + 1] : null;
  }, [currentLevel.id]);

  // =========================================================================
  // VIEW 1: LEVEL & DIFFICULTY SELECT MENU
  // =========================================================================
  if (view === 'menu') {
    const nextInTier =
      tierLevels.find((lvl) => !completedSet.has(lvl.id)) ?? tierLevels[0];
    const pal = PALETTES[selectedDiff];

    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="fixed inset-0 z-50 flex flex-col overflow-y-auto text-cyan-50 select-none"
        style={{ backgroundColor: pal.bg }}
      >
        {/* Minimalist Top Bar */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-xl bg-black/30 hover:bg-black/45 px-3.5 py-2 text-sm font-bold text-cyan-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>{isAr ? 'خروج' : 'Exit'}</span>
          </button>

          <div className="flex items-center gap-3 text-sm font-bold text-cyan-100/90 tabular-nums">
            <span>
              {completedSet.size}/{DEVIL_TRAP_TOTAL_LEVELS} {isAr ? 'مكتمل' : 'Cleared'}
            </span>
            <span className="opacity-40">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Skull className="w-4 h-4 text-rose-400" />
              {stats.totalDeaths}
            </span>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="rounded-lg bg-black/30 hover:bg-black/45 p-2 transition cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Hero Title & Difficulty Picker */}
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-5 py-7 gap-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-black tracking-widest uppercase text-teal-300/85 mb-1">
                {isAr ? 'لعبة منصات 2D · فخاخ غير متوقعة' : '2D TROLL PLATFORMER · UNFAIRLY FUN'}
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                {isAr ? 'بوابة الشيطان' : "Devil's Gate"}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-cyan-100/75 max-w-xl">
                {isAr
                  ? 'كل خطوة قد تخونك! حفر تفتح فجأة، أشواك مختبئة، أبواب تهرب، وجاذبية مقلوبة عبر 300 مرحلة (100 مرحلة في كل مستوى صعوبة).'
                  : 'Every step can betray you! Sudden pits, ambush spikes, runaway doors, and gravity flips across 300 stages (100 per difficulty tier).'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => startLevel(nextInTier)}
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5 text-base font-black text-slate-950 shadow-lg transition hover:brightness-110 active:scale-95 cursor-pointer shrink-0"
              style={{ backgroundColor: pal.blockFill }}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                {isAr
                  ? `العب ${DIFF_META[selectedDiff].ar} #${nextInTier.indexInTier}`
                  : `Play ${DIFF_META[selectedDiff].en} #${nextInTier.indexInTier}`}
              </span>
            </button>
          </div>

          {/* 3 Difficulty Tabs: Normal (100) / Hard (100) / Impossible (100) */}
          <div className="grid grid-cols-3 gap-3">
            {(['normal', 'hard', 'impossible'] as DevilDifficulty[]).map((diff) => {
              const m = DIFF_META[diff];
              const levelsIn = getLevelsByDifficulty(diff);
              const clearedIn = levelsIn.filter((l) => completedSet.has(l.id)).length;
              const isSelected = selectedDiff === diff;
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => {
                    setSelectedDiff(diff);
                    const firstOpen = levelsIn.find((l) => !completedSet.has(l.id));
                    setStagePage(firstOpen ? Math.floor((firstOpen.indexInTier - 1) / 20) : 0);
                  }}
                  className={`flex flex-col items-start rounded-2xl border p-3.5 sm:p-4 text-start transition cursor-pointer ${
                    isSelected
                      ? `${m.borderClass} ${m.bgClass} shadow-lg`
                      : 'border-white/10 bg-black/25 hover:bg-black/35'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className={`text-base sm:text-xl font-black ${isSelected ? m.accentClass : 'text-white'}`}>
                      {isAr ? m.ar : m.en}
                    </span>
                    <span className="text-xs font-extrabold text-white/75 tabular-nums">
                      {clearedIn}/{levelsIn.length}
                    </span>
                  </div>
                  <span className="mt-1 text-[11px] sm:text-xs text-white/65 leading-snug">
                    {isAr ? m.subAr : m.subEn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 5 Page Tabs for 100 Stages (1–20, 21–40, 41–60, 61–80, 81–100) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {[0, 1, 2, 3, 4].map((pg) => {
                const startNum = pg * 20 + 1;
                const endNum = startNum + 19;
                const pageSlice = tierLevels.slice(pg * 20, pg * 20 + 20);
                const pageCleared = pageSlice.filter((l) => completedSet.has(l.id)).length;
                const pageHasUnlocked = pageSlice.some((l) => isLevelUnlocked(l));
                const active = stagePage === pg;
                return (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setStagePage(pg)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs sm:text-sm font-extrabold tabular-nums transition cursor-pointer ${
                      active
                        ? 'border-white/40 bg-white/18 text-white shadow-sm'
                        : pageHasUnlocked
                          ? 'border-white/10 bg-black/25 text-white/75 hover:bg-black/40 hover:text-white'
                          : 'border-white/8 bg-black/20 text-white/40 hover:bg-black/30'
                    }`}
                  >
                    {!pageHasUnlocked && <Lock className="w-3 h-3 opacity-75" />}
                    <span>{startNum}–{endNum}</span>
                    {pageCleared > 0 && (
                      <span className="text-[11px] text-emerald-300">
                        ({pageCleared}/20)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-bold text-cyan-200/75 tabular-nums">
              {isAr
                ? `المراحل ${stagePage * 20 + 1} – ${stagePage * 20 + 20} من 100`
                : `Stages ${stagePage * 20 + 1}–${stagePage * 20 + 20} of 100`}
            </span>
          </div>

          {/* 20-Stage Compact Grid for Current Page */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {tierLevels.slice(stagePage * 20, stagePage * 20 + 20).map((lvl) => {
              const isDone = completedSet.has(lvl.id);
              const unlocked = isLevelUnlocked(lvl);
              const isCurrentNext = unlocked && !isDone;
              const isMilestone = lvl.indexInTier % 10 === 0;
              const bestDeaths = stats.bestDeathsByLevel[lvl.id];
              return (
                <button
                  key={lvl.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => startLevel(lvl)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-3 text-start transition min-h-[86px] ${
                    !unlocked
                      ? 'border-white/8 bg-black/40 opacity-50 cursor-not-allowed'
                      : isDone
                        ? 'border-emerald-400/45 bg-emerald-950/35 hover:bg-emerald-950/50 hover:-translate-y-0.5 cursor-pointer'
                        : isCurrentNext
                          ? 'border-cyan-300/80 bg-cyan-500/20 hover:bg-cyan-500/30 hover:-translate-y-0.5 shadow-md cursor-pointer'
                          : isMilestone
                            ? 'border-teal-400/55 bg-teal-950/35 hover:bg-teal-950/55 hover:-translate-y-0.5 cursor-pointer'
                            : 'border-white/14 bg-black/30 hover:bg-black/45 hover:-translate-y-0.5 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-xl font-black tabular-nums leading-none"
                      style={{
                        color: !unlocked
                          ? 'rgba(255,255,255,0.38)'
                          : isMilestone
                            ? '#67E8F9'
                            : pal.blockTop,
                      }}
                    >
                      {lvl.indexInTier}
                    </span>
                    {!unlocked ? (
                      <Lock className="w-4 h-4 text-white/40" />
                    ) : isDone ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : isMilestone ? (
                      <Flame className="w-4 h-4 text-cyan-300" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-cyan-200 group-hover:text-white transition" />
                    )}
                  </div>

                  <div className="mt-2">
                    <div className={`text-xs font-extrabold leading-tight truncate ${unlocked ? 'text-white' : 'text-white/45'}`}>
                      {unlocked
                        ? isAr
                          ? lvl.titleAr
                          : lvl.titleEn
                        : isAr
                          ? 'مقفلة'
                          : 'Locked'}
                    </div>
                    {typeof bestDeaths === 'number' && (
                      <div className="mt-0.5 text-[10px] font-bold text-emerald-300/90 tabular-nums">
                        {isAr ? `أقل موت: ${bestDeaths}` : `Best: ${bestDeaths}`}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Controls footer hint */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-white/55 border-t border-white/10 pt-4">
            <span>
              {isAr
                ? 'التحكم: الأسهم أو A / D للحركة · Space أو W للقفز · R لإعادة فورية'
                : 'Controls: Arrows or A / D to move · Space or W to jump · R instant restart'}
            </span>
            <span>{isAr ? 'أزرار لمس مدمجة للجوال' : 'Touch controls included on mobile'}</span>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE 2D CANVAS GAMEPLAY
  // =========================================================================
  const pal = PALETTES[currentLevel.difficulty];

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between text-white select-none overflow-hidden"
      style={{ backgroundColor: '#050C14' }}
    >
      {/* Compact Unobtrusive Top HUD */}
      <header className="w-full max-w-5xl flex items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView('menu')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs sm:text-sm font-bold transition cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>{isAr ? 'المراحل' : 'Stages'}</span>
          </button>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold tabular-nums">
            <span className={diffMeta.accentClass}>
              {isAr ? diffMeta.ar : diffMeta.en} {currentLevel.indexInTier}/{DEVIL_TRAP_LEVELS_PER_TIER}
            </span>
            <span className="hidden sm:inline opacity-35">·</span>
            <span className="hidden sm:inline text-white/95">
              {isAr ? currentLevel.titleAr : currentLevel.titleEn}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold tabular-nums">
          <span className="inline-flex items-center gap-1 text-rose-300 px-2">
            <Skull className="w-4 h-4" />
            <span>{stageDeaths}</span>
          </span>

          <button
            type="button"
            onClick={() => setShowHint((h) => !h)}
            title={isAr ? 'تلميح' : 'Hint'}
            className={`rounded-xl px-2.5 py-1.5 transition cursor-pointer inline-flex items-center gap-1 ${
              showHint ? 'bg-teal-400 text-slate-950' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{isAr ? 'تلميح' : 'Hint'}</span>
          </button>

          <button
            type="button"
            onClick={restartCurrentLevel}
            title={isAr ? 'إعادة (R)' : 'Restart (R)'}
            className="rounded-xl bg-white/10 hover:bg-white/20 p-1.5 sm:px-2.5 sm:py-1.5 transition cursor-pointer inline-flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="rounded-xl bg-white/10 hover:bg-white/20 p-1.5 transition cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Optional Hint Strip */}
      {showHint && (
        <div className="w-full max-w-4xl px-4 pb-1">
          <div className="rounded-xl border border-teal-400/35 bg-teal-950/65 px-4 py-2 text-center text-xs sm:text-sm font-bold text-teal-100">
            {isAr ? currentLevel.hintAr : currentLevel.hintEn}
          </div>
        </div>
      )}

      {/* Main 16:9 Canvas Stage */}
      <div className="relative flex flex-1 w-full items-center justify-center px-3 py-1 min-h-0">
        <div
          className="relative w-full max-w-5xl aspect-[16/9] max-h-full rounded-2xl overflow-hidden shadow-2xl border-2"
          style={{ borderColor: pal.blockEdge }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="block h-full w-full"
          />

          {/* Stage Cleared Overlay */}
          {stageCleared && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
              <div
                className="w-full max-w-sm rounded-3xl border-2 p-6 text-center shadow-2xl"
                style={{
                  backgroundColor: pal.bg,
                  borderColor: pal.blockFill,
                }}
              >
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/20 text-cyan-300">
                  {nextLevelObj ? <Sparkles className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
                </div>
                <h2 className="text-2xl font-black text-white">
                  {nextLevelObj
                    ? isAr
                      ? 'نجوت من الفخ!'
                      : 'Stage Cleared!'
                    : isAr
                      ? 'أسطورة بوابة الشيطان!'
                      : "Devil's Gate Conquered!"}
                </h2>
                <p className="mt-1.5 text-sm font-bold text-cyan-100/80 tabular-nums">
                  {isAr
                    ? `${currentLevel.titleAr} · عدد الوفيات: ${stageDeaths}`
                    : `${currentLevel.titleEn} · Deaths: ${stageDeaths}`}
                </p>

                <div className="mt-5 flex items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={restartCurrentLevel}
                    className="rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-bold text-white transition cursor-pointer"
                  >
                    {isAr ? 'إعادة' : 'Replay'}
                  </button>
                  <button
                    type="button"
                    onClick={handleNextLevel}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-slate-950 transition hover:brightness-110 cursor-pointer"
                    style={{ backgroundColor: pal.blockFill }}
                  >
                    <span>
                      {nextLevelObj
                        ? isAr
                          ? 'المرحلة التالية'
                          : 'Next Stage'
                        : isAr
                          ? 'قائمة المراحل'
                          : 'All Stages'}
                    </span>
                    <Flame className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Responsive Bottom Touch Controls (LTR directional layout so Left is always Left) */}
      <div
        dir="ltr"
        className="w-full max-w-5xl flex items-center justify-between px-4 pb-3 pt-1 touch-none"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Move Left"
            {...bindHold('left')}
            className="flex h-14 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 active:bg-white/25 text-white shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <button
            type="button"
            aria-label="Move Right"
            {...bindHold('right')}
            className="flex h-14 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 active:bg-white/25 text-white shadow-md cursor-pointer"
          >
            <ArrowRight className="w-7 h-7" />
          </button>
        </div>

        <div className="hidden md:block text-xs font-bold text-white/45">
          {isAr
            ? 'A / D أو الأسهم · Space للقفز · R إعادة فورية'
            : 'A / D or Arrows · Space to Jump · R Instant Restart'}
        </div>

        <button
          type="button"
          aria-label="Jump"
          onPointerDown={handleTouchJumpDown}
          onPointerUp={handleTouchJumpUp}
          onPointerLeave={handleTouchJumpUp}
          onPointerCancel={handleTouchJumpUp}
          className="flex h-14 w-24 items-center justify-center gap-1.5 rounded-2xl border-2 font-black text-stone-950 shadow-md active:scale-95 cursor-pointer"
          style={{
            backgroundColor: pal.blockFill,
            borderColor: pal.blockTop,
          }}
        >
          <ArrowUp className="w-6 h-6 stroke-[3]" />
          <span className="text-sm">{isAr ? 'قفز' : 'JUMP'}</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Custom iconic SVG preview card artwork for the Games Hub (zero external URLs).
 */
export const DevilTrapPreviewArt: React.FC = () => (
  <svg
    viewBox="0 0 320 180"
    className="h-full w-full"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="dt-bg" cx="50%" cy="45%" r="65%">
        <stop offset="0%" stopColor="#123047" />
        <stop offset="100%" stopColor="#081523" />
      </radialGradient>
      <radialGradient id="dt-door-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#67E8F9" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Deep midnight navy chamber */}
    <rect width="320" height="180" fill="url(#dt-bg)" />

    {/* Electric teal framing walls */}
    <rect x="0" y="0" width="320" height="28" fill="#14B8A6" />
    <rect x="0" y="0" width="18" height="180" fill="#14B8A6" />
    <rect x="302" y="0" width="18" height="180" fill="#14B8A6" />

    {/* Left floor & right floor with collapsing pit in the middle */}
    <rect x="18" y="132" width="88" height="48" fill="#14B8A6" />
    <rect x="18" y="132" width="88" height="4" fill="#5EEAD4" />

    {/* Dropping trap block mid-fall */}
    <g transform="translate(110, 148) rotate(8)">
      <rect x="0" y="0" width="44" height="36" fill="#0D9488" stroke="#042F2E" strokeWidth="1.5" />
      <rect x="0" y="0" width="44" height="3" fill="#5EEAD4" />
    </g>

    <rect x="162" y="132" width="140" height="48" fill="#14B8A6" />
    <rect x="162" y="132" width="140" height="4" fill="#5EEAD4" />

    {/* Pop-up ambush spikes */}
    <g fill="#0B0F1A" stroke="#38BDF8" strokeWidth="1.2">
      <polygon points="172,132 180,114 188,132" />
      <polygon points="188,132 196,114 204,132" />
      <polygon points="204,132 212,114 220,132" />
    </g>

    {/* Glowing runaway exit door with motion streaks */}
    <circle cx="268" cy="108" r="34" fill="url(#dt-door-glow)" />
    <line x1="234" y1="98" x2="246" y2="98" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <line x1="228" y1="108" x2="244" y2="108" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    <rect x="252" y="84" width="30" height="48" rx="14" fill="#062030" />
    <rect x="256" y="88" width="22" height="44" rx="10" fill="#ECFEFF" />

    {/* Enlarged (+50%) Silhouetted Hero leaping over the collapsing pit */}
    <g transform="translate(106, 62) rotate(-10) scale(1.5)">
      <rect x="0" y="0" width="22" height="24" rx="5" fill="#070B14" />
      <rect x="2" y="22" width="5" height="7" rx="1.5" fill="#070B14" />
      <rect x="14" y="20" width="5" height="7" rx="1.5" fill="#070B14" />
      {/* Wide surprised eyes */}
      <circle cx="9" cy="10" r="2.7" fill="#67E8F9" />
      <circle cx="16.5" cy="10" r="2.7" fill="#67E8F9" />
      <circle cx="13" cy="16.5" r="2" fill="#67E8F9" />
    </g>

    {/* Tiny spinning saw near ceiling */}
    <g transform="translate(176, 56)">
      <circle cx="0" cy="0" r="13" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="0" cy="0" r="5" fill="#F43F5E" />
    </g>
  </svg>
);

export { DEVIL_TRAP_TOTAL_LEVELS, readDevilTrapStats };
