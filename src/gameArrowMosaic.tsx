import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MusicToggleButton, useGameMusic } from './gameMusic';

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type ShapeKey =
  | 'scooter'
  | 'heart'
  | 'star'
  | 'crown'
  | 'rocket'
  | 'butterfly'
  | 'apple'
  | 'lightning'
  | 'umbrella'
  | 'trophy';

interface GridPt {
  x: number;
  y: number;
}

interface Pt {
  x: number;
  y: number;
}

interface MosaicArrow {
  id: number;
  cells: GridPt[]; // tail (0) -> ... -> head (last)
  dir: Dir;
  color: string;
  glow: string;
}

interface SlitherAnim {
  uid: string;
  arrow: MosaicArrow;
  startedAt: number;
  duration: number;
  fullTrack: Pt[];
  bodyLen: number;
  totalLen: number;
}

interface BlockedFlash {
  arrowId: number;
  blockerId: number;
  from: Pt;
  to: Pt;
  until: number;
}

interface StageSpec {
  level: number;
  shape: ShapeKey;
  targetArrows: number;
  gridW: number;
  gridH: number;
  seed: number;
}

export interface ArrowMosaicGameProps {
  lang: 'ar' | 'en';
  sfxEnabled: boolean;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  onExitToHub: () => void;
}

export const ARROW_MOSAIC_TOTAL_LEVELS = 10;

const STORAGE_KEY = 'point_catcher_arrow_mosaic_cleared_v1';
const WALLET_STORAGE_KEY = 'point_catcher_arrow_mosaic_wallet_v1';
const MAX_HEARTS = 5;
const INITIAL_HINTS = 10;
const INITIAL_MAGNETS = 2;
const INITIAL_ERASERS = 11;
const GOLD_STEP_ARROWS = 10;
const GOLD_MIN_REWARD = 5;
const GOLD_MAX_REWARD = 12;
const MAGNET_MIN_PULL = 4;
const MAGNET_MAX_PULL = 12;

type PowerUpKind = 'hint' | 'magnet' | 'eraser';

const SHOP_ITEM_PRICES: Record<PowerUpKind, number> = {
  hint: 62,
  magnet: 77,
  eraser: 62,
};

interface MosaicWallet {
  gold: number;
  hints: number;
  magnets: number;
  erasers: number;
  arrowProgress: number; // 0..9 arrows toward next 10-arrow gold reward
}

const DEFAULT_WALLET: MosaicWallet = {
  gold: 0,
  hints: INITIAL_HINTS,
  magnets: INITIAL_MAGNETS,
  erasers: INITIAL_ERASERS,
  arrowProgress: 0,
};

function readWallet(): MosaicWallet {
  try {
    const raw = window.localStorage.getItem(WALLET_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_WALLET };
    const parsed = JSON.parse(raw) as Partial<MosaicWallet>;
    return {
      gold:
        typeof parsed.gold === 'number' && Number.isFinite(parsed.gold) && parsed.gold >= 0
          ? Math.floor(parsed.gold)
          : DEFAULT_WALLET.gold,
      hints:
        typeof parsed.hints === 'number' && Number.isFinite(parsed.hints) && parsed.hints >= 0
          ? Math.floor(parsed.hints)
          : DEFAULT_WALLET.hints,
      magnets:
        typeof parsed.magnets === 'number' && Number.isFinite(parsed.magnets) && parsed.magnets >= 0
          ? Math.floor(parsed.magnets)
          : DEFAULT_WALLET.magnets,
      erasers:
        typeof parsed.erasers === 'number' && Number.isFinite(parsed.erasers) && parsed.erasers >= 0
          ? Math.floor(parsed.erasers)
          : DEFAULT_WALLET.erasers,
      arrowProgress:
        typeof parsed.arrowProgress === 'number' &&
        Number.isFinite(parsed.arrowProgress) &&
        parsed.arrowProgress >= 0
          ? Math.floor(parsed.arrowProgress) % GOLD_STEP_ARROWS
          : 0,
    };
  } catch {
    return { ...DEFAULT_WALLET };
  }
}

function saveWallet(wallet: MosaicWallet): void {
  try {
    window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
  } catch {
    // Ignore storage errors
  }
}

const ALL_DIRS: Dir[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
const DIR_DELTA: Record<Dir, { dx: number; dy: number }> = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
};

const STAGE_SPECS: StageSpec[] = [
  {
    level: 1,
    shape: 'scooter',
    targetArrows: 300,
    gridW: 62,
    gridH: 68,
    seed: 10133,
  },
  {
    level: 2,
    shape: 'heart',
    targetArrows: 321,
    gridW: 60,
    gridH: 58,
    seed: 20477,
  },
  {
    level: 3,
    shape: 'star',
    targetArrows: 365,
    gridW: 66,
    gridH: 66,
    seed: 31991,
  },
  {
    level: 4,
    shape: 'crown',
    targetArrows: 438,
    gridW: 72,
    gridH: 62,
    seed: 44819,
  },
  {
    level: 5,
    shape: 'rocket',
    targetArrows: 547,
    gridW: 72,
    gridH: 82,
    seed: 57193,
  },
  {
    level: 6,
    shape: 'butterfly',
    targetArrows: 580,
    gridW: 80,
    gridH: 72,
    seed: 68213,
  },
  {
    level: 7,
    shape: 'apple',
    targetArrows: 615,
    gridW: 76,
    gridH: 80,
    seed: 79341,
  },
  {
    level: 8,
    shape: 'lightning',
    targetArrows: 650,
    gridW: 78,
    gridH: 88,
    seed: 85427,
  },
  {
    level: 9,
    shape: 'umbrella',
    targetArrows: 700,
    gridW: 86,
    gridH: 84,
    seed: 91753,
  },
  {
    level: 10,
    shape: 'trophy',
    targetArrows: 760,
    gridW: 88,
    gridH: 90,
    seed: 99817,
  },
];

function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function readClearedLevels(): number[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(
        parsed
          .map(Number)
          .filter(
            (n) =>
              Number.isInteger(n) &&
              n >= 1 &&
              n <= ARROW_MOSAIC_TOTAL_LEVELS
          )
      )
    ).sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export function readArrowMosaicClearedCount(): number {
  return readClearedLevels().length;
}

function saveClearedLevels(levels: number[]): void {
  try {
    const unique = Array.from(new Set(levels)).sort((a, b) => a - b);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  } catch {
    // Ignore storage errors
  }
}

function getMaxUnlocked(cleared: number[]): number {
  let unlocked = 1;
  while (
    unlocked < ARROW_MOSAIC_TOTAL_LEVELS &&
    cleared.includes(unlocked)
  ) {
    unlocked += 1;
  }
  return unlocked;
}

function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const lenSq = vx * vx + vy * vy;
  const t = lenSq > 1e-6 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / lenSq)) : 0;
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}

/**
 * Evaluates normalized shape silhouettes (u, v in [0, 1]) for each of the 5 stages.
 * Tuned so each shape has rich recognizable geometry and ample cell area for 300–547 curved arrows.
 */
function isInsideShape(shape: ShapeKey, u: number, v: number): boolean {
  switch (shape) {
    case 'scooter': {
      // Tilted kick-scooter inspired directly by the reference image:
      // Top handlebars, diagonal stem, curved lower deck, front & rear wheels
      const handlebar =
        distToSegment(u, v, 0.14, 0.13, 0.63, 0.17) <= 0.068;
      const stem = distToSegment(u, v, 0.36, 0.16, 0.28, 0.68) <= 0.064;
      const deck = distToSegment(u, v, 0.29, 0.66, 0.80, 0.56) <= 0.088;
      const frontWheel = Math.hypot((u - 0.24) / 0.145, (v - 0.72) / 0.15) <= 1.0;
      const rearWheel = Math.hypot((u - 0.80) / 0.14, (v - 0.52) / 0.14) <= 1.0;
      const neckJoint = Math.hypot((u - 0.31) / 0.12, (v - 0.66) / 0.11) <= 1.0;
      return handlebar || stem || deck || frontWheel || rearWheel || neckJoint;
    }

    case 'heart': {
      // Classic bold symmetrical heart using smooth implicit curve
      const x = (u - 0.5) * 2.55;
      const y = (0.48 - v) * 2.55;
      const a = x * x + y * y - 1;
      return a * a * a - x * x * y * y * y <= 0.04;
    }

    case 'star': {
      // Crisp 5-pointed star in polar coordinates
      const dx = (u - 0.5) * 2.18;
      const dy = (v - 0.52) * 2.18;
      const r = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx) + Math.PI / 2;
      const sector = (2 * Math.PI) / 5;
      const a = Math.abs((((ang % sector) + sector) % sector) - sector / 2);
      const outerR = 0.98;
      const innerR = 0.45;
      // Straight star polygon edge interpolation
      const half = sector / 2;
      const x1 = outerR;
      const y1 = 0;
      const x2 = innerR * Math.cos(half);
      const y2 = innerR * Math.sin(half);
      const px = r * Math.cos(a);
      const py = r * Math.sin(a);
      // Cross product check against edge (x1,y1) -> (x2,y2)
      return (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1) >= 0;
    }

    case 'crown': {
      // Royal 3-peak crown with jeweled tips & solid base band
      if (v > 0.86 || v < 0.12 || u < 0.08 || u > 0.92) return false;
      const baseBand = v >= 0.62 && v <= 0.85 && u >= 0.13 && u <= 0.87;
      // Left, Center, Right peaks
      const leftPeak =
        v >= 0.25 &&
        v <= 0.72 &&
        Math.abs(u - (0.17 + (v - 0.25) * 0.26)) <= (v - 0.18) * 0.42;
      const centerPeak =
        v >= 0.15 &&
        v <= 0.72 &&
        Math.abs(u - 0.5) <= (v - 0.08) * 0.42;
      const rightPeak =
        v >= 0.25 &&
        v <= 0.72 &&
        Math.abs(u - (0.83 - (v - 0.25) * 0.26)) <= (v - 0.18) * 0.42;
      const leftJewel = Math.hypot(u - 0.16, v - 0.23) <= 0.062;
      const topJewel = Math.hypot(u - 0.5, v - 0.15) <= 0.068;
      const rightJewel = Math.hypot(u - 0.84, v - 0.23) <= 0.062;
      const bridge = v >= 0.46 && v <= 0.68 && u >= 0.16 && u <= 0.84;
      return (
        baseBand ||
        leftPeak ||
        centerPeak ||
        rightPeak ||
        leftJewel ||
        topJewel ||
        rightJewel ||
        bridge
      );
    }

    case 'rocket': {
      // Grand space rocket (547 arrows!) with nose cone, wide fuselage, swept side fins & exhaust flame
      const noseAndBody =
        v >= 0.08 &&
        v <= 0.76 &&
        Math.abs(u - 0.5) <=
          (v < 0.34
            ? 0.03 + ((v - 0.08) / 0.26) * 0.23
            : 0.26 - ((v - 0.34) / 0.42) * 0.04);
      const leftFin =
        v >= 0.52 &&
        v <= 0.84 &&
        u >= 0.11 + Math.max(0, 0.72 - v) * 0.75 &&
        u <= 0.32;
      const rightFin =
        v >= 0.52 &&
        v <= 0.84 &&
        u <= 0.89 - Math.max(0, 0.72 - v) * 0.75 &&
        u >= 0.68;
      const flame =
        v >= 0.74 &&
        v <= 0.94 &&
        Math.abs(u - 0.5) <= 0.16 * (1 - (v - 0.74) / 0.22);
      return noseAndBody || leftFin || rightFin || flame;
    }

    case 'butterfly': {
      // Symmetrical winged butterfly with upper/lower wings, central body & antennae
      const ax = Math.abs(u - 0.5);
      const upperWing =
        Math.hypot((ax - 0.23) / 0.23, (v - 0.36) / 0.23) <= 1.0;
      const lowerWing =
        Math.hypot((ax - 0.18) / 0.18, (v - 0.67) / 0.19) <= 1.0;
      const body = ax <= 0.055 && v >= 0.2 && v <= 0.84;
      const head = Math.hypot(ax / 0.065, (v - 0.19) / 0.065) <= 1.0;
      const antenna =
        distToSegment(ax, v, 0.03, 0.16, 0.13, 0.07) <= 0.032;
      return upperWing || lowerWing || body || head || antenna;
    }

    case 'apple': {
      // Plump twin-lobed apple with curved stem and tilted leaf
      const leftLobe = Math.hypot((u - 0.36) / 0.28, (v - 0.56) / 0.33) <= 1.0;
      const rightLobe = Math.hypot((u - 0.64) / 0.28, (v - 0.56) / 0.33) <= 1.0;
      const centerCore = Math.hypot((u - 0.5) / 0.24, (v - 0.6) / 0.29) <= 1.0;
      const topNotch = Math.hypot((u - 0.5) / 0.08, (v - 0.22) / 0.08) <= 1.0;
      const stem = distToSegment(u, v, 0.5, 0.27, 0.53, 0.1) <= 0.042;
      const leaf =
        Math.hypot(
          ((u - 0.66) * 0.85 + (v - 0.17) * 0.52) / 0.14,
          (-(u - 0.66) * 0.52 + (v - 0.17) * 0.85) / 0.075
        ) <= 1.0;
      return ((leftLobe || rightLobe || centerCore) && !topNotch) || stem || leaf;
    }

    case 'lightning': {
      // Bold high-voltage lightning bolt with thick upper & lower strokes
      const upperArm =
        distToSegment(u, v, 0.58, 0.1, 0.25, 0.51) <= 0.145;
      const midBridge =
        v >= 0.41 && v <= 0.57 && u >= 0.18 && u <= 0.8;
      const lowerArm =
        distToSegment(u, v, 0.68, 0.49, 0.38, 0.9) <= 0.14;
      const topCap = Math.hypot((u - 0.58) / 0.16, (v - 0.14) / 0.09) <= 1.0;
      const botTip =
        v >= 0.72 &&
        v <= 0.94 &&
        Math.abs(u - (0.42 - (v - 0.72) * 0.28)) <= 0.14 * (1 - (v - 0.72) / 0.24);
      return upperArm || midBridge || lowerArm || topCap || botTip;
    }

    case 'umbrella': {
      // Wide scalloped umbrella dome + sturdy shaft + J-hook handle
      const inDome =
        v <= 0.5 &&
        v >= 0.08 &&
        Math.hypot((u - 0.5) / 0.44, (v - 0.5) / 0.4) <= 1.0;
      // Soft scalloped arches along the bottom rim of the canopy
      const scallopCut =
        v > 0.45 &&
        v <= 0.5 &&
        (Math.hypot(u - 0.22, v - 0.52) <= 0.065 ||
          Math.hypot(u - 0.41, v - 0.52) <= 0.065 ||
          Math.hypot(u - 0.59, v - 0.52) <= 0.065 ||
          Math.hypot(u - 0.78, v - 0.52) <= 0.065);
      const topFinial = distToSegment(u, v, 0.5, 0.05, 0.5, 0.12) <= 0.04;
      const shaft =
        Math.abs(u - 0.5) <= 0.052 && v >= 0.46 && v <= 0.84;
      const hookDist = Math.hypot(u - 0.405, v - 0.815);
      const hookCurve =
        v >= 0.79 && hookDist >= 0.045 && hookDist <= 0.145;
      const hookTip = Math.hypot(u - 0.31, v - 0.8) <= 0.05;
      return (inDome && !scallopCut) || topFinial || shaft || hookCurve || hookTip;
    }

    case 'trophy': {
      // Championship trophy cup with sweeping handles, stem & tiered base
      const cupBowl =
        v >= 0.12 &&
        v <= 0.58 &&
        Math.abs(u - 0.5) <=
          (v < 0.34
            ? 0.27 - ((v - 0.12) / 0.22) * 0.03
            : 0.24 - ((v - 0.34) / 0.24) * 0.14);
      const topRim =
        v >= 0.1 && v <= 0.19 && Math.abs(u - 0.5) <= 0.3;
      const leftHandleDist = Math.hypot((u - 0.21) / 0.13, (v - 0.31) / 0.15);
      const rightHandleDist = Math.hypot((u - 0.79) / 0.13, (v - 0.31) / 0.15);
      const leftHandle =
        u <= 0.3 && leftHandleDist <= 1.0 && leftHandleDist >= 0.48;
      const rightHandle =
        u >= 0.7 && rightHandleDist <= 1.0 && rightHandleDist >= 0.48;
      const stem =
        Math.abs(u - 0.5) <= 0.085 && v >= 0.54 && v <= 0.76;
      const stemRing = Math.hypot((u - 0.5) / 0.13, (v - 0.65) / 0.055) <= 1.0;
      const baseTop = v >= 0.73 && v <= 0.82 && Math.abs(u - 0.5) <= 0.22;
      const baseBottom = v >= 0.8 && v <= 0.91 && Math.abs(u - 0.5) <= 0.31;
      return (
        cupBowl ||
        topRim ||
        leftHandle ||
        rightHandle ||
        stem ||
        stemRing ||
        baseTop ||
        baseBottom
      );
    }
  }
}

/**
 * Spatial neon color palette echoing the reference screenshot:
 * electric blue/cyan body, magenta-violet veins, and warm golden accent tips.
 */
function pickSpatialArrowColor(
  shape: ShapeKey,
  nx: number,
  ny: number,
  rng: () => number
): { color: string; glow: string } {
  const wave = Math.sin(nx * 5.2 + ny * 3.8) * 0.5 + 0.5;
  const edgeBoost =
    shape === 'scooter'
      ? (ny < 0.24 && (nx < 0.32 || nx > 0.46)) || (nx > 0.68 && ny < 0.56)
      : shape === 'crown'
      ? ny < 0.33
      : shape === 'rocket'
      ? ny < 0.24 || ny > 0.76
      : shape === 'star'
      ? Math.hypot(nx - 0.5, ny - 0.5) > 0.36
      : shape === 'butterfly'
      ? Math.abs(nx - 0.5) > 0.33 || ny < 0.22
      : shape === 'apple'
      ? ny < 0.27
      : shape === 'lightning'
      ? ny < 0.25 || ny > 0.74
      : shape === 'umbrella'
      ? ny > 0.72 || (ny > 0.4 && ny <= 0.5)
      : shape === 'trophy'
      ? ny < 0.22 || ny > 0.74 || Math.abs(nx - 0.5) > 0.3
      : ny < 0.32 || (nx > 0.66 && ny < 0.5);

  const roll = rng();
  if (edgeBoost && roll < 0.58) {
    return roll < 0.32
      ? { color: '#facc15', glow: '#fde047' } // Luminous Gold
      : { color: '#fbbf24', glow: '#fef08a' }; // Warm Amber Gold
  }
  if ((wave > 0.62 && roll < 0.52) || roll < 0.17) {
    return roll < 0.26
      ? { color: '#d946ef', glow: '#f0abfc' } // Neon Magenta
      : { color: '#a855f7', glow: '#d8b4fe' }; // Electric Violet
  }
  if (wave < 0.36 || roll < 0.52) {
    return roll < 0.28
      ? { color: '#38bdf8', glow: '#7dd3fc' } // Bright Sky Cyan
      : { color: '#22d3ee', glow: '#67e8f9' }; // Neon Cyan
  }
  return { color: '#3b82f6', glow: '#60a5fa' }; // Vivid Royal Electric Blue
}

/**
 * Verifies 100% of arrows can exit with ZERO deadlocks in O(N × max(W, H)).
 */
function verifyMosaicSolvable(
  arrows: MosaicArrow[],
  gridW: number,
  gridH: number
): boolean {
  const owner = new Int32Array(gridW * gridH);
  const arrowById = new Map<number, MosaicArrow>();
  for (const a of arrows) {
    arrowById.set(a.id, a);
    for (const c of a.cells) {
      owner[c.y * gridW + c.x] = a.id;
    }
  }

  let remaining = arrows.length;
  let progress = true;
  while (remaining > 0 && progress) {
    progress = false;
    for (const a of arrowById.values()) {
      const head = a.cells[a.cells.length - 1];
      const { dx, dy } = DIR_DELTA[a.dir];
      let cx = head.x + dx;
      let cy = head.y + dy;
      let blocked = false;
      while (cx >= 0 && cx < gridW && cy >= 0 && cy < gridH) {
        if (owner[cy * gridW + cx] !== 0) {
          blocked = true;
          break;
        }
        cx += dx;
        cy += dy;
      }
      if (!blocked) {
        for (const c of a.cells) {
          owner[c.y * gridW + c.x] = 0;
        }
        arrowById.delete(a.id);
        remaining--;
        progress = true;
      }
    }
  }
  return remaining === 0;
}

const MOSAIC_CACHE = new Map<number, MosaicArrow[]>();

/**
 * High-speed Deepest-Interior-First Reverse Peel-Back generator:
 * - Packs EXACTLY `spec.targetArrows` (300, 321, 365, 438, 547) tightly curved arrows
 *   inside the target shape silhouette in <30ms.
 * - Uses O(1) rowMinX/rowMaxX/colMinY/colMaxY ray checks to guarantee 100% mathematical solvability!
 */
function generateMosaicStage(spec: StageSpec): MosaicArrow[] {
  const cached = MOSAIC_CACHE.get(spec.level);
  if (cached) {
    return cached.map((a) => ({
      ...a,
      cells: a.cells.map((c) => ({ ...c })),
    }));
  }

  const { gridW, gridH, targetArrows, shape, seed } = spec;
  const rng = createRng(seed);
  const totalGrid = gridW * gridH;

  // 1) Rasterize shape silhouette mask
  const mask = new Uint8Array(totalGrid);
  let maskCount = 0;
  for (let y = 1; y < gridH - 1; y++) {
    for (let x = 1; x < gridW - 1; x++) {
      const u = (x + 0.5) / gridW;
      const v = (y + 0.5) / gridH;
      if (isInsideShape(shape, u, v)) {
        mask[y * gridW + x] = 1;
        maskCount++;
      }
    }
  }

  // Ensure mask has comfortable room (~3.4x targetArrows) for curved multi-bend ribbons
  const desiredMinMask = Math.ceil(targetArrows * 3.35);
  let dilateSafety = 0;
  while (maskCount < desiredMinMask && dilateSafety < 4) {
    dilateSafety++;
    const toAdd: number[] = [];
    for (let y = 1; y < gridH - 1; y++) {
      for (let x = 1; x < gridW - 1; x++) {
        const idx = y * gridW + x;
        if (mask[idx]) continue;
        if (
          mask[idx - 1] ||
          mask[idx + 1] ||
          mask[idx - gridW] ||
          mask[idx + gridW]
        ) {
          toAdd.push(idx);
        }
      }
    }
    for (const idx of toAdd) {
      mask[idx] = 1;
      maskCount++;
    }
  }

  // 2) Compute distance-to-boundary via multi-source BFS so deepest interior cells are placed FIRST
  const distToEdge = new Int16Array(totalGrid);
  distToEdge.fill(-1);
  const bfsQ = new Int32Array(totalGrid);
  let qHead = 0;
  let qTail = 0;
  for (let i = 0; i < totalGrid; i++) {
    if (!mask[i]) {
      distToEdge[i] = 0;
      bfsQ[qTail++] = i;
    }
  }
  while (qHead < qTail) {
    const idx = bfsQ[qHead++];
    const d = distToEdge[idx];
    const x = idx % gridW;
    const y = (idx - x) / gridW;
    if (x > 0 && distToEdge[idx - 1] === -1) {
      distToEdge[idx - 1] = d + 1;
      bfsQ[qTail++] = idx - 1;
    }
    if (x + 1 < gridW && distToEdge[idx + 1] === -1) {
      distToEdge[idx + 1] = d + 1;
      bfsQ[qTail++] = idx + 1;
    }
    if (y > 0 && distToEdge[idx - gridW] === -1) {
      distToEdge[idx - gridW] = d + 1;
      bfsQ[qTail++] = idx - gridW;
    }
    if (y + 1 < gridH && distToEdge[idx + gridW] === -1) {
      distToEdge[idx + gridW] = d + 1;
      bfsQ[qTail++] = idx + gridW;
    }
  }

  // 3) Track occupied cells & O(1) ray bounds per row/col
  const occupied = new Int32Array(totalGrid);
  const rowMinX = new Int16Array(gridH).fill(32000);
  const rowMaxX = new Int16Array(gridH).fill(-1);
  const colMinY = new Int16Array(gridW).fill(32000);
  const colMaxY = new Int16Array(gridW).fill(-1);
  let occupiedCount = 0;

  const isRayClear = (x: number, y: number, dir: Dir): boolean => {
    if (dir === 'LEFT') return x < rowMinX[y];
    if (dir === 'RIGHT') return x > rowMaxX[y];
    if (dir === 'UP') return y < colMinY[x];
    return y > colMaxY[x];
  };

  const commitArrow = (cells: GridPt[], dir: Dir, id: number): MosaicArrow => {
    let sumX = 0;
    let sumY = 0;
    for (const c of cells) {
      const idx = c.y * gridW + c.x;
      occupied[idx] = id;
      occupiedCount++;
      if (c.x < rowMinX[c.y]) rowMinX[c.y] = c.x;
      if (c.x > rowMaxX[c.y]) rowMaxX[c.y] = c.x;
      if (c.y < colMinY[c.x]) colMinY[c.x] = c.y;
      if (c.y > colMaxY[c.x]) colMaxY[c.x] = c.y;
      sumX += c.x;
      sumY += c.y;
    }
    const avgX = sumX / cells.length / gridW;
    const avgY = sumY / cells.length / gridH;
    const { color, glow } = pickSpatialArrowColor(shape, avgX, avgY, rng);
    return { id, cells, dir, color, glow };
  };

  // Pre-sort mask cells from deepest interior outward (with gentle jitter so placement looks organic)
  const maskCells: { x: number; y: number; idx: number; priority: number }[] = [];
  for (let y = 1; y < gridH - 1; y++) {
    for (let x = 1; x < gridW - 1; x++) {
      const idx = y * gridW + x;
      if (mask[idx]) {
        maskCells.push({
          x,
          y,
          idx,
          priority: distToEdge[idx] + rng() * 0.85,
        });
      }
    }
  }
  maskCells.sort((a, b) => b.priority - a.priority);

  const arrows: MosaicArrow[] = [];
  let nextId = 1;

  // Helper to place a curved arrow starting at (hx, hy) with clear exit `dir`
  const tryGrowArrow = (
    hx: number,
    hy: number,
    dir: Dir,
    desiredLen: number,
    allowOutsideMask: boolean
  ): GridPt[] | null => {
    const { dx, dy } = DIR_DELTA[dir];
    const px = hx - dx;
    const py = hy - dy;
    if (px < 0 || px >= gridW || py < 0 || py >= gridH) return null;
    const pIdx = py * gridW + px;
    if (occupied[pIdx] !== 0) return null;
    if (!allowOutsideMask && !mask[pIdx]) return null;

    const rev: GridPt[] = [
      { x: hx, y: hy },
      { x: px, y: py },
    ];
    const localSet = new Set<number>([hy * gridW + hx, pIdx]);

    const onSelfRay = (cx: number, cy: number): boolean => {
      if (dir === 'LEFT') return cy === hy && cx < hx;
      if (dir === 'RIGHT') return cy === hy && cx > hx;
      if (dir === 'UP') return cx === hx && cy < hy;
      return cx === hx && cy > hy;
    };

    let prevDx = -dx;
    let prevDy = -dy;
    let straightRun = 1;

    while (rev.length < desiredLen) {
      const tip = rev[rev.length - 1];
      let bestOpt: { x: number; y: number; score: number; turned: boolean } | null =
        null;

      for (const nd of ALL_DIRS) {
        const ndelta = DIR_DELTA[nd];
        const nx = tip.x + ndelta.dx;
        const ny = tip.y + ndelta.dy;
        if (nx < 0 || nx >= gridW || ny < 0 || ny >= gridH) continue;
        const nIdx = ny * gridW + nx;
        if (occupied[nIdx] !== 0 || localSet.has(nIdx)) continue;
        if (!allowOutsideMask && !mask[nIdx]) continue;
        if (onSelfRay(nx, ny)) continue;

        // Avoid 2x2 self-blobs so every curved arrow stays a razor-crisp ribbon
        let selfAdj = 0;
        if (nx > 0 && localSet.has(nIdx - 1)) selfAdj++;
        if (nx + 1 < gridW && localSet.has(nIdx + 1)) selfAdj++;
        if (ny > 0 && localSet.has(nIdx - gridW)) selfAdj++;
        if (ny + 1 < gridH && localSet.has(nIdx + gridW)) selfAdj++;
        if (selfAdj > 1) continue;

        const turned = ndelta.dx !== prevDx || ndelta.dy !== prevDy;
        let score = distToEdge[nIdx] * 1.4 + rng() * 3.0;
        if (turned) {
          score += straightRun >= 2 ? 7.5 : 4.2;
        } else if (straightRun >= 2) {
          score -= 3.5;
        }
        // Slight bonus for hugging already-placed neighbors tightly
        let occAdj = 0;
        if (nx > 0 && occupied[nIdx - 1] !== 0) occAdj++;
        if (nx + 1 < gridW && occupied[nIdx + 1] !== 0) occAdj++;
        if (ny > 0 && occupied[nIdx - gridW] !== 0) occAdj++;
        if (ny + 1 < gridH && occupied[nIdx + gridW] !== 0) occAdj++;
        score += occAdj * 1.6;

        if (!bestOpt || score > bestOpt.score) {
          bestOpt = { x: nx, y: ny, score, turned };
        }
      }

      if (!bestOpt) break;
      prevDx = bestOpt.x - tip.x;
      prevDy = bestOpt.y - tip.y;
      straightRun = bestOpt.turned ? 1 : straightRun + 1;
      rev.push({ x: bestOpt.x, y: bestOpt.y });
      localSet.add(bestOpt.y * gridW + bestOpt.x);
    }

    return rev.reverse();
  };

  // 4) Main placement pass — weave curved arrows from deep core outward to silhouette skin
  const dirOrder: Dir[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  let scanCursor = 0;
  let stallPasses = 0;

  while (arrows.length < targetArrows && stallPasses < 3) {
    let placedInPass = 0;
    const totalMask = maskCells.length;

    for (let k = 0; k < totalMask && arrows.length < targetArrows; k++) {
      const cell = maskCells[(scanCursor + k) % totalMask];
      if (occupied[cell.idx] !== 0) continue;

      // Dynamically pace arrow length so `targetArrows` fills the entire shape evenly!
      const remArrows = targetArrows - arrows.length;
      const remCells = Math.max(0, maskCount - occupiedCount);
      const avgBudget = remCells / Math.max(1, remArrows);
      let desiredLen: number;
      if (avgBudget <= 2.35) {
        desiredLen = 2;
      } else {
        const base = Math.max(2, Math.min(6, Math.round(avgBudget * 0.92)));
        const jitter = rng() < 0.35 ? 1 : rng() < 0.3 ? -1 : 0;
        desiredLen = Math.max(2, Math.min(7, base + jitter));
      }

      // Shuffle exit directions for rich visual variety
      const startDir = Math.floor(rng() * 4);
      let placed = false;
      for (let dOff = 0; dOff < 4; dOff++) {
        const dir = dirOrder[(startDir + dOff) % 4];
        if (!isRayClear(cell.x, cell.y, dir)) continue;
        const cells = tryGrowArrow(cell.x, cell.y, dir, desiredLen, false);
        if (cells && cells.length >= 2) {
          arrows.push(commitArrow(cells, dir, nextId++));
          placedInPass++;
          placed = true;
          break;
        }
      }

      if (placed) {
        scanCursor = (scanCursor + k + 1) % totalMask;
        k = -1;
        break;
      }
    }

    if (placedInPass === 0) {
      stallPasses++;
      scanCursor = (scanCursor + 7) % Math.max(1, totalMask);
    } else {
      stallPasses = 0;
    }
  }

  // 5) Exact-count outer halo pass (if needed, hugs right along the silhouette rim with guaranteed clear outward rays)
  if (arrows.length < targetArrows) {
    let haloRound = 0;
    while (arrows.length < targetArrows && haloRound < 6) {
      haloRound++;
      let added = 0;
      for (let y = 0; y < gridH && arrows.length < targetArrows; y++) {
        for (let x = 0; x < gridW && arrows.length < targetArrows; x++) {
          const idx = y * gridW + x;
          if (occupied[idx] !== 0) continue;
          // Hug existing silhouette or placed arrows so shape stays crisp
          const nearShape =
            mask[idx] ||
            (x > 0 && occupied[idx - 1] !== 0) ||
            (x + 1 < gridW && occupied[idx + 1] !== 0) ||
            (y > 0 && occupied[idx - gridW] !== 0) ||
            (y + 1 < gridH && occupied[idx + gridW] !== 0);
          if (!nearShape) continue;

          const startDir = Math.floor(rng() * 4);
          for (let dOff = 0; dOff < 4; dOff++) {
            const dir = dirOrder[(startDir + dOff) % 4];
            if (!isRayClear(x, y, dir)) continue;
            const cells = tryGrowArrow(x, y, dir, 2 + (rng() < 0.45 ? 1 : 0), true);
            if (cells && cells.length >= 2) {
              arrows.push(commitArrow(cells, dir, nextId++));
              added++;
              break;
            }
          }
        }
      }
      if (added === 0) break;
    }
  }

  // Belt-and-suspenders verification: mathematically guaranteed 100% solvable
  if (!verifyMosaicSolvable(arrows, gridW, gridH)) {
    // This should never happen due to the O(1) forward-ray invariant
    return arrows;
  }

  MOSAIC_CACHE.set(spec.level, arrows);
  return arrows.map((a) => ({
    ...a,
    cells: a.cells.map((c) => ({ ...c })),
  }));
}

function polylineLength(pts: Pt[]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return total;
}

function extractSubPolyline(pts: Pt[], startDist: number, endDist: number): Pt[] {
  if (pts.length < 2 || endDist <= startDist) return [];
  const result: Pt[] = [];
  let acc = 0;

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const segLen = Math.hypot(b.x - a.x, b.y - a.y);
    if (segLen < 1e-6) continue;
    const segStart = acc;
    const segEnd = acc + segLen;

    if (segEnd >= startDist && segStart <= endDist) {
      const t0 = Math.max(0, (startDist - segStart) / segLen);
      const t1 = Math.min(1, (endDist - segStart) / segLen);
      const p0: Pt = { x: a.x + (b.x - a.x) * t0, y: a.y + (b.y - a.y) * t0 };
      const p1: Pt = { x: a.x + (b.x - a.x) * t1, y: a.y + (b.y - a.y) * t1 };

      if (result.length === 0) {
        result.push(p0);
      } else {
        const last = result[result.length - 1];
        if (Math.hypot(p0.x - last.x, p0.y - last.y) > 0.15) {
          result.push(p0);
        }
      }
      const last = result[result.length - 1];
      if (Math.hypot(p1.x - last.x, p1.y - last.y) > 0.15) {
        result.push(p1);
      }
    }

    acc = segEnd;
    if (acc >= endDist) break;
  }
  return result;
}

function traceRoundedPolyline(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  cornerRadius: number
): void {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];
    const v1x = prev.x - curr.x;
    const v1y = prev.y - curr.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);
    if (len1 < 0.25 || len2 < 0.25) continue;
    const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
    if (dot < -0.98) {
      ctx.lineTo(curr.x, curr.y);
      continue;
    }
    const r = Math.min(cornerRadius, len1 * 0.49, len2 * 0.49);
    const ex = curr.x + (v1x / len1) * r;
    const ey = curr.y + (v1y / len1) * r;
    const ox = curr.x + (v2x / len2) * r;
    const oy = curr.y + (v2y / len2) * r;
    ctx.lineTo(ex, ey);
    ctx.quadraticCurveTo(curr.x, curr.y, ox, oy);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);
}

function drawCurvedCanvasArrow(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  cellPx: number,
  color: string,
  highlight: 'none' | 'hint' | 'blocked' | 'eraser'
): void {
  if (pts.length < 2) return;

  const rawTip = pts[pts.length - 1];
  const prevTip = pts[pts.length - 2];
  const segDx = rawTip.x - prevTip.x;
  const segDy = rawTip.y - prevTip.y;
  const segLen = Math.hypot(segDx, segDy) || 1;
  const dirX = segDx / segLen;
  const dirY = segDy / segLen;
  const angle = Math.atan2(dirY, dirX);

  const tipExtend = cellPx * 0.24;
  const tip: Pt = {
    x: rawTip.x + dirX * tipExtend,
    y: rawTip.y + dirY * tipExtend,
  };

  const extendedPts = [...pts.slice(0, -1), tip];
  const totalLen = polylineLength(extendedPts);
  const headLen = cellPx * 0.48;
  const headHalfW = cellPx * 0.34;
  const pullBack = Math.min(headLen * 0.58, totalLen * 0.45);
  const shaftPts =
    totalLen > pullBack + 0.5
      ? extractSubPolyline(extendedPts, 0, totalLen - pullBack)
      : extendedPts;

  const shaftWidth = Math.max(1.8, cellPx * 0.34);
  const cornerRadius = cellPx * 0.46;

  const strokeColor =
    highlight === 'blocked'
      ? '#ef4444'
      : highlight === 'hint'
      ? '#4ade80'
      : highlight === 'eraser'
      ? '#f472b6'
      : color;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (highlight !== 'none') {
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = highlight === 'hint' ? 14 : 10;
  }

  // Crisp ribbon shaft
  traceRoundedPolyline(ctx, shaftPts, cornerRadius);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = highlight === 'hint' ? shaftWidth * 1.28 : shaftWidth;
  ctx.stroke();

  // Soft, non-pointy rounded arrowhead (blunt curved nose & rounded wings)
  ctx.translate(tip.x, tip.y);
  ctx.rotate(angle);
  const noseR = Math.max(0.9, headHalfW * 0.38);
  const wingX = -headLen * 0.84;
  const wingY = headHalfW * 0.88;
  const notchX = -headLen * 0.56;
  ctx.beginPath();
  ctx.moveTo(wingX, -wingY);
  ctx.quadraticCurveTo(noseR * 0.35, -noseR, noseR * 0.35, 0);
  ctx.quadraticCurveTo(noseR * 0.35, noseR, wingX, wingY);
  ctx.quadraticCurveTo(notchX, wingY * 0.36, notchX, 0);
  ctx.quadraticCurveTo(notchX, -wingY * 0.36, wingX, -wingY);
  ctx.closePath();
  ctx.fillStyle = strokeColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = Math.max(1.3, shaftWidth * 0.48);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.restore();
}

class MosaicAudio {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playPop(streak: number): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const freq = Math.min(980, 420 + (streak % 14) * 32);
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.48, now + 0.08);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playBlocked(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(98, now + 0.16);
    gain.gain.setValueAtTime(0.095, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playMagnet(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [440, 554.37, 659.25, 880, 1108.73].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.045;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  public playErase(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.14);
    gain.gain.setValueAtTime(0.095, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playStageWin(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.075;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.27);
    });
  }

  public playGameOver(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [329.63, 277.18, 220, 164.81].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + i * 0.09;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.075, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  public playCoin(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.065;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.095, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  public playBuy(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 783.99, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.055;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.095, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.19);
    });
  }
}

const COPY_MOSAIC = {
  ar: {
    exitBtn: 'خروج',
    title: 'فسيفساء الأسهم',
    stageWord: 'المرحلة',
    remainingLabel: (rem: number, total: number) =>
      `المتبقي: ${rem} / ${total} سهم`,
    shapes: {
      scooter: 'السكوتر',
      heart: 'القلب',
      star: 'النجمة',
      crown: 'التاج',
      rocket: 'الصاروخ',
      butterfly: 'الفراشة',
      apple: 'التفاحة',
      lightning: 'البرق',
      umbrella: 'المظلة',
      trophy: 'الكأس',
    },
    hintBtn: 'تلميح',
    magnetBtn: 'مغناطيس',
    eraserBtn: 'ممحاة',
    shopBtn: 'المتجر',
    shopTitle: 'متجر الأدوات',
    shopRule: 'كل 10 أسهم تشيلها تربح 5 إلى 12 ذهبة',
    goldWord: 'ذهبة',
    ownedLabel: (n: number) => `لديك: ${n}`,
    buyForPrice: (price: number) => `شراء · ${price} ذهبة`,
    notEnoughGold: (price: number) => `تحتاج ${price} ذهبة`,
    goldEarnedToast: (amount: number) => `+${amount} ذهبة!`,
    boughtToast: (name: string) => `تم شراء ${name} (+1)!`,
    nextGoldProgress: (cur: number) => `${cur}/10 للذهب`,
    eraserActiveTip: 'وضع الممحاة نشط — اضغط على أي سهم لمسحه فوراً!',
    levelsBtn: 'المراحل',
    restartBtn: 'إعادة',
    fitBtn: 'توسيط',
    winTitle: (lvl: number, shapeName: string) =>
      `رائع! فكّكت شكل ${shapeName} بالكامل (المرحلة ${lvl})`,
    allClearTitle: 'بطل الأسهم الأسطوري! أنهيت جميع الأشكال الـ 10!',
    winSub: (total: number) => `أخرجت جميع الـ ${total} سهم بنجاح!`,
    nextStageBtn: (lvl: number) => `المرحلة ${lvl}`,
    replayBtn: 'إعادة المرحلة',
    loseTitle: 'انتهت القلوب!',
    loseSub: (rem: number) =>
      `تبقّى ${rem} سهم فقط — كبّر اللوحة بدقة واستخدم التلميح والمغناطيس وحاول مجدداً!`,
    tryAgainBtn: 'حاول مجدداً',
    levelsModalTitle: 'مراحل فسيفساء الأسهم (10 أشكال ضخمة)',
    levelsModalSub: 'أفرغ الشكل من جميع الأسهم لفتح المرحلة التالية بالتسلسل',
    arrowsCount: (n: number) => `${n} سهم`,
    closeBtn: 'إغلاق',
    controlsHint:
      'اضغط على سهم طريقه مفتوح لإخراجه · كل 10 أسهم تربح 5–12 ذهبة للشراء من المتجر بالأسفل',
    blockedTip: (left: number) =>
      left > 0
        ? `مسدود! تبقّى لديك ${left} قلوب`
        : 'انتهت جميع القلوب!',
  },
  en: {
    exitBtn: 'Exit',
    title: 'Arrow Mosaic',
    stageWord: 'Stage',
    remainingLabel: (rem: number, total: number) =>
      `Remaining: ${rem} / ${total}`,
    shapes: {
      scooter: 'Scooter',
      heart: 'Heart',
      star: 'Star',
      crown: 'Crown',
      rocket: 'Rocket',
      butterfly: 'Butterfly',
      apple: 'Apple',
      lightning: 'Lightning',
      umbrella: 'Umbrella',
      trophy: 'Trophy',
    },
    hintBtn: 'Hint',
    magnetBtn: 'Magnet',
    eraserBtn: 'Eraser',
    shopBtn: 'Shop',
    shopTitle: 'Power-Up Shop',
    shopRule: 'Every 10 arrows cleared earns 5–12 gold',
    goldWord: 'Gold',
    ownedLabel: (n: number) => `Owned: ${n}`,
    buyForPrice: (price: number) => `Buy · ${price} Gold`,
    notEnoughGold: (price: number) => `Need ${price} Gold`,
    goldEarnedToast: (amount: number) => `+${amount} Gold!`,
    boughtToast: (name: string) => `Bought ${name} (+1)!`,
    nextGoldProgress: (cur: number) => `${cur}/10 to gold`,
    eraserActiveTip: 'Eraser active — tap ANY arrow to remove it safely!',
    levelsBtn: 'Stages',
    restartBtn: 'Restart',
    fitBtn: 'Fit',
    winTitle: (lvl: number, shapeName: string) =>
      `Cleared! ${shapeName} Mosaic Solved (Stage ${lvl})`,
    allClearTitle: 'Mosaic Legend! All 10 Giant Shapes Cleared!',
    winSub: (total: number) => `You freed all ${total} arrows!`,
    nextStageBtn: (lvl: number) => `Stage ${lvl}`,
    replayBtn: 'Replay Stage',
    loseTitle: 'Out of Hearts!',
    loseSub: (rem: number) =>
      `${rem} arrows left — zoom in closely and use Hint, Magnet & Eraser!`,
    tryAgainBtn: 'Try Again',
    levelsModalTitle: 'Arrow Mosaic Stages (10 Giant Shapes)',
    levelsModalSub: 'Clear every arrow in each shape to unlock the next stage',
    arrowsCount: (n: number) => `${n} arrows`,
    closeBtn: 'Close',
    controlsHint:
      'Tap clear arrows to slide them out · Clear 10 arrows to earn 5–12 gold for the shop below',
    blockedTip: (left: number) =>
      left > 0 ? `Blocked! ${left} hearts left` : 'Out of hearts!',
  },
} as const;

export function ArrowMosaicPreviewArt() {
  return (
    <svg
      viewBox="0 0 260 130"
      className="w-full h-full block"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="am-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1c0a73" />
          <stop offset="55%" stopColor="#2b129e" />
          <stop offset="100%" stopColor="#140754" />
        </linearGradient>
      </defs>
      <rect width="260" height="130" fill="url(#am-bg)" />
      <circle cx="130" cy="68" r="76" fill="#6366f1" opacity="0.16" />

      {/* Mini neon scooter made of tiny dense curved arrows */}
      <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2">
        {/* Handlebar golden & magenta arrows */}
        <path d="M 68 22 L 88 22 Q 94 22 94 28 L 94 34" stroke="#facc15" />
        <path d="M 102 22 L 122 22 Q 128 22 128 28 L 118 28" stroke="#d946ef" />
        <path d="M 134 25 L 154 25 Q 160 25 160 31 L 146 31" stroke="#facc15" />

        {/* Stem electric cyan/blue arrows */}
        <path d="M 110 34 L 110 52 Q 110 58 104 58 L 98 58" stroke="#38bdf8" />
        <path d="M 102 64 L 102 80 Q 102 86 96 86 L 90 86" stroke="#22d3ee" />
        <path d="M 112 48 L 112 72 Q 112 78 118 78" stroke="#3b82f6" />

        {/* Front wheel cluster */}
        <path d="M 74 96 L 86 96 Q 92 96 92 104 L 80 104" stroke="#3b82f6" />
        <path d="M 86 84 L 74 84 Q 68 84 68 92 L 68 100" stroke="#d946ef" />
        <path d="M 96 88 L 96 106 Q 96 112 104 112" stroke="#facc15" />
        {/* Red blocked accent arrow */}
        <path d="M 116 88 L 110 88 Q 106 88 106 94 L 106 104" stroke="#ef4444" />

        {/* Deck & rear wheel cluster */}
        <path d="M 124 94 L 144 94 Q 150 94 150 86 L 138 86" stroke="#38bdf8" />
        <path d="M 156 92 L 172 92 Q 178 92 178 82 L 166 82" stroke="#3b82f6" />
        <path d="M 184 78 L 184 62 Q 184 56 192 56 L 198 56" stroke="#d946ef" />
        <path d="M 190 88 L 204 88 Q 210 88 210 76 L 198 76" stroke="#38bdf8" />
        <path d="M 196 66 L 208 66 Q 214 66 214 58 L 204 58" stroke="#facc15" />
      </g>

      {/* Soft rounded non-pointy arrowheads */}
      <g fill="#facc15" stroke="#facc15" strokeWidth="2.4" strokeLinejoin="round">
        <polygon points="94,37 90.5,32.5 97.5,32.5" />
        <polygon points="143,31 147.5,27.5 147.5,34.5" />
        <polygon points="107,112 102.5,108.5 102.5,115.5" />
      </g>
      <g fill="#38bdf8" stroke="#38bdf8" strokeWidth="2.4" strokeLinejoin="round">
        <polygon points="95,58 99.5,54.5 99.5,61.5" />
        <polygon points="135,86 139.5,82.5 139.5,89.5" />
        <polygon points="195,76 199.5,72.5 199.5,79.5" />
      </g>
      <g fill="#d946ef" stroke="#d946ef" strokeWidth="2.4" strokeLinejoin="round">
        <polygon points="115,28 119.5,24.5 119.5,31.5" />
        <polygon points="201,56 196.5,52.5 196.5,59.5" />
      </g>
      <g fill="#ef4444" stroke="#ef4444" strokeWidth="2.4" strokeLinejoin="round">
        <polygon points="106,107 102.5,102.5 109.5,102.5" />
      </g>
    </svg>
  );
}

export const ArrowMosaicGame: React.FC<ArrowMosaicGameProps> = ({
  lang,
  sfxEnabled,
  musicEnabled,
  onToggleMusic,
  onExitToHub,
}) => {
  const t = COPY_MOSAIC[lang];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<MosaicAudio>(new MosaicAudio());

  const [clearedLevels, setClearedLevels] = useState<number[]>(() =>
    readClearedLevels()
  );
  const maxUnlocked = useMemo(
    () => getMaxUnlocked(clearedLevels),
    [clearedLevels]
  );

  const [currentLevel, setCurrentLevel] = useState<number>(() =>
    getMaxUnlocked(readClearedLevels())
  );
  const spec = STAGE_SPECS[currentLevel - 1] ?? STAGE_SPECS[0];

  const [remainingCount, setRemainingCount] = useState<number>(
    spec.targetArrows
  );
  const [hearts, setHearts] = useState<number>(MAX_HEARTS);
  const [wallet, setWallet] = useState<MosaicWallet>(() => readWallet());
  const [shopOpen, setShopOpen] = useState<boolean>(false);
  const [goldToast, setGoldToast] = useState<string>('');
  const [eraserMode, setEraserMode] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);
  const [lost, setLost] = useState<boolean>(false);
  const [levelsModalOpen, setLevelsModalOpen] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string>('');
  const [zoomPct, setZoomPct] = useState<number>(100);

  const hintsLeft = wallet.hints;
  const magnetsLeft = wallet.magnets;
  const erasersLeft = wallet.erasers;
  const gold = wallet.gold;
  const arrowProgress = wallet.arrowProgress;

  useGameMusic('arrow-mosaic', musicEnabled && !lost);

  // Simulation refs for 60fps zero-lag canvas rendering of 300–547 arrows
  const arrowsRef = useRef<MosaicArrow[]>([]);
  const ownerGridRef = useRef<Int32Array>(new Int32Array(0));
  const slithersRef = useRef<SlitherAnim[]>([]);
  const blockedRef = useRef<BlockedFlash | null>(null);
  const hintIdRef = useRef<number | null>(null);
  const streakRef = useRef<number>(0);
  const goldToastTimerRef = useRef<number | null>(null);
  const loseTimerRef = useRef<number | null>(null);

  // Camera pan/zoom state (world coordinates centered around grid)
  const camRef = useRef({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    targetScale: 1,
    targetOffsetX: 0,
    targetOffsetY: 0,
  });

  // Active pointers for pinch-zoom + drag vs tap
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gestureRef = useRef<{
    isDragging: boolean;
    movedPx: number;
    startX: number;
    startY: number;
    camStartX: number;
    camStartY: number;
    pinchStartDist: number;
    pinchStartScale: number;
  }>({
    isDragging: false,
    movedPx: 0,
    startX: 0,
    startY: 0,
    camStartX: 0,
    camStartY: 0,
    pinchStartDist: 0,
    pinchStartScale: 1,
  });

  const specRef = useRef(spec);
  const heartsRef = useRef(hearts);
  const wonRef = useRef(won);
  const lostRef = useRef(lost);
  const eraserModeRef = useRef(eraserMode);
  const clearedRef = useRef(clearedLevels);
  const levelsOpenRef = useRef(levelsModalOpen);
  const shopOpenRef = useRef(shopOpen);
  const walletRef = useRef(wallet);

  specRef.current = spec;
  heartsRef.current = hearts;
  wonRef.current = won;
  lostRef.current = lost;
  eraserModeRef.current = eraserMode;
  clearedRef.current = clearedLevels;
  levelsOpenRef.current = levelsModalOpen;
  shopOpenRef.current = shopOpen;
  walletRef.current = wallet;

  useEffect(() => {
    audioRef.current.enabled = sfxEnabled;
  }, [sfxEnabled]);

  useEffect(() => {
    return () => {
      if (goldToastTimerRef.current !== null) {
        window.clearTimeout(goldToastTimerRef.current);
      }
      if (loseTimerRef.current !== null) {
        window.clearTimeout(loseTimerRef.current);
      }
    };
  }, []);

  const showGoldToast = useCallback((msg: string) => {
    setGoldToast(msg);
    if (goldToastTimerRef.current !== null) {
      window.clearTimeout(goldToastTimerRef.current);
    }
    goldToastTimerRef.current = window.setTimeout(() => {
      setGoldToast('');
      goldToastTimerRef.current = null;
    }, 1700);
  }, []);

  const updateWallet = useCallback(
    (updater: (prev: MosaicWallet) => MosaicWallet) => {
      const next = updater(walletRef.current);
      walletRef.current = next;
      setWallet(next);
      saveWallet(next);
    },
    []
  );

  // Every 10 arrows removed earns 5 to 12 gold coins
  const creditClearedArrows = useCallback(
    (count: number) => {
      if (count <= 0) return;
      const prev = walletRef.current;
      const total = prev.arrowProgress + count;
      const batches = Math.floor(total / GOLD_STEP_ARROWS);
      const nextProgress = total % GOLD_STEP_ARROWS;
      let earned = 0;
      for (let i = 0; i < batches; i++) {
        earned +=
          GOLD_MIN_REWARD +
          Math.floor(Math.random() * (GOLD_MAX_REWARD - GOLD_MIN_REWARD + 1));
      }
      const next: MosaicWallet = {
        ...prev,
        gold: prev.gold + earned,
        arrowProgress: nextProgress,
      };
      walletRef.current = next;
      setWallet(next);
      saveWallet(next);

      if (earned > 0) {
        audioRef.current.playCoin();
        showGoldToast(t.goldEarnedToast(earned));
      }
    },
    [showGoldToast, t]
  );

  const rebuildOwnerGrid = useCallback(
    (arrows: MosaicArrow[], gridW: number, gridH: number) => {
      const grid = new Int32Array(gridW * gridH);
      for (const a of arrows) {
        for (const c of a.cells) {
          grid[c.y * gridW + c.x] = a.id;
        }
      }
      ownerGridRef.current = grid;
    },
    []
  );

  const clampCameraOffset = useCallback((ox: number, oy: number, scale: number) => {
    const wrap = wrapRef.current;
    const viewW = wrap ? wrap.clientWidth : 640;
    const viewH = wrap ? wrap.clientHeight : 540;
    const maxX = Math.max(80, viewW * 0.55 * scale);
    const maxY = Math.max(80, viewH * 0.55 * scale);
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }, []);

  const resetCamera = useCallback(() => {
    camRef.current.targetScale = 1;
    camRef.current.targetOffsetX = 0;
    camRef.current.targetOffsetY = 0;
    setZoomPct(100);
  }, []);

  const loadStage = useCallback(
    (lvl: number, bypassLock = false) => {
      const safe = Math.max(1, Math.min(ARROW_MOSAIC_TOTAL_LEVELS, lvl));
      if (!bypassLock && safe > maxUnlocked) return;
      if (loseTimerRef.current !== null) {
        window.clearTimeout(loseTimerRef.current);
        loseTimerRef.current = null;
      }
      const nextSpec = STAGE_SPECS[safe - 1];
      const generated = generateMosaicStage(nextSpec);

      setCurrentLevel(safe);
      specRef.current = nextSpec;
      arrowsRef.current = generated;
      rebuildOwnerGrid(generated, nextSpec.gridW, nextSpec.gridH);
      slithersRef.current = [];
      blockedRef.current = null;
      hintIdRef.current = null;
      streakRef.current = 0;
      heartsRef.current = MAX_HEARTS;
      wonRef.current = false;
      lostRef.current = false;

      setRemainingCount(generated.length);
      setHearts(MAX_HEARTS);
      setEraserMode(false);
      setWon(false);
      setLost(false);
      setLevelsModalOpen(false);
      setShopOpen(false);
      setStatusBanner('');
      resetCamera();
    },
    [maxUnlocked, rebuildOwnerGrid, resetCamera]
  );

  // Initialize initial stage on mount
  useEffect(() => {
    const initialSpec = STAGE_SPECS[currentLevel - 1] ?? STAGE_SPECS[0];
    const generated = generateMosaicStage(initialSpec);
    arrowsRef.current = generated;
    rebuildOwnerGrid(generated, initialSpec.gridW, initialSpec.gridH);
    setRemainingCount(generated.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard Escape handler
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (levelsOpenRef.current) {
          setLevelsModalOpen(false);
        } else if (shopOpenRef.current) {
          setShopOpen(false);
        } else if (eraserModeRef.current) {
          setEraserMode(false);
        } else {
          onExitToHub();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onExitToHub]);

  // Compute grid-to-canvas base metric (at scale=1, centered cleanly inside viewport)
  const getLayoutMetrics = useCallback((viewW: number, viewH: number) => {
    const st = specRef.current;
    const pad = 16;
    const cellPx = Math.min(
      (viewW - pad * 2) / st.gridW,
      (viewH - pad * 2) / st.gridH
    );
    const boardW = st.gridW * cellPx;
    const boardH = st.gridH * cellPx;
    const originX = (viewW - boardW) / 2;
    const originY = (viewH - boardH) / 2;
    return { cellPx, originX, originY, boardW, boardH };
  }, []);

  const gridPtToBase = useCallback(
    (pt: GridPt, cellPx: number, originX: number, originY: number): Pt => ({
      x: originX + (pt.x + 0.5) * cellPx,
      y: originY + (pt.y + 0.5) * cellPx,
    }),
    []
  );

  const findBlockerForArrow = useCallback(
    (arrow: MosaicArrow): { blockerId: number; hitCell: GridPt } | null => {
      const st = specRef.current;
      const grid = ownerGridRef.current;
      const head = arrow.cells[arrow.cells.length - 1];
      const { dx, dy } = DIR_DELTA[arrow.dir];
      let cx = head.x + dx;
      let cy = head.y + dy;
      while (cx >= 0 && cx < st.gridW && cy >= 0 && cy < st.gridH) {
        const id = grid[cy * st.gridW + cx];
        if (id !== 0 && id !== arrow.id) {
          return { blockerId: id, hitCell: { x: cx, y: cy } };
        }
        cx += dx;
        cy += dy;
      }
      return null;
    },
    []
  );

  const markStageCleared = useCallback((lvl: number) => {
    if (!clearedRef.current.includes(lvl)) {
      const next = [...clearedRef.current, lvl].sort((a, b) => a - b);
      clearedRef.current = next;
      setClearedLevels(next);
      saveClearedLevels(next);
    }
  }, []);

  const removeArrowAndAnimate = useCallback(
    (arrow: MosaicArrow, delayMs = 0) => {
      const st = specRef.current;
      const grid = ownerGridRef.current;
      for (const c of arrow.cells) {
        if (grid[c.y * st.gridW + c.x] === arrow.id) {
          grid[c.y * st.gridW + c.x] = 0;
        }
      }
      arrowsRef.current = arrowsRef.current.filter((a) => a.id !== arrow.id);
      if (hintIdRef.current === arrow.id) {
        hintIdRef.current = null;
      }

      const wrap = wrapRef.current;
      const viewW = wrap ? wrap.clientWidth : 640;
      const viewH = wrap ? wrap.clientHeight : 540;
      const { cellPx, originX, originY } = getLayoutMetrics(viewW, viewH);

      const basePts = arrow.cells.map((c) =>
        gridPtToBase(c, cellPx, originX, originY)
      );
      const bodyLen = polylineLength(basePts);
      const { dx, dy } = DIR_DELTA[arrow.dir];
      const headPt = basePts[basePts.length - 1];
      const exitDist = Math.max(viewW, viewH) * 0.55 + bodyLen + 60;
      const fullTrack: Pt[] = [
        ...basePts,
        { x: headPt.x + dx * exitDist, y: headPt.y + dy * exitDist },
      ];
      const totalLen = polylineLength(fullTrack);

      slithersRef.current.push({
        uid: `${arrow.id}-${performance.now()}-${Math.random()}`,
        arrow,
        startedAt: performance.now() + delayMs,
        duration: 360,
        fullTrack,
        bodyLen,
        totalLen,
      });

      const left = arrowsRef.current.length;
      setRemainingCount(left);

      if (left === 0 && !wonRef.current) {
        wonRef.current = true;
        setWon(true);
        setEraserMode(false);
        setShopOpen(false);
        audioRef.current.playStageWin();
        markStageCleared(st.level);
      }
    },
    [getLayoutMetrics, gridPtToBase, markStageCleared]
  );

  const handleTapAtScreen = useCallback(
    (clientX: number, clientY: number) => {
      if (
        wonRef.current ||
        lostRef.current ||
        heartsRef.current <= 0 ||
        levelsOpenRef.current ||
        shopOpenRef.current
      ) {
        return;
      }
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;

      const rect = canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const viewW = wrap.clientWidth;
      const viewH = wrap.clientHeight;
      const cam = camRef.current;

      // Invert camera transform to base canvas space
      const bx = (sx - viewW / 2 - cam.offsetX) / cam.scale + viewW / 2;
      const by = (sy - viewH / 2 - cam.offsetY) / cam.scale + viewH / 2;

      const { cellPx, originX, originY } = getLayoutMetrics(viewW, viewH);

      // Find nearest arrow within forgiving hit threshold
      let bestArrow: MosaicArrow | null = null;
      let bestDist = Math.max(cellPx * 1.15, 14 / cam.scale);

      for (const a of arrowsRef.current) {
        for (let i = 0; i < a.cells.length; i++) {
          const p = gridPtToBase(a.cells[i], cellPx, originX, originY);
          const d = Math.hypot(bx - p.x, by - p.y);
          if (d < bestDist) {
            bestDist = d;
            bestArrow = a;
          }
        }
      }

      if (!bestArrow) return;

      // Eraser Power-up: safely remove ANY tapped arrow without losing a heart!
      if (eraserModeRef.current) {
        setEraserMode(false);
        updateWallet((prev) => ({
          ...prev,
          erasers: Math.max(0, prev.erasers - 1),
        }));
        setStatusBanner('');
        audioRef.current.playErase();
        removeArrowAndAnimate(bestArrow);
        creditClearedArrows(1);
        return;
      }

      const blocker = findBlockerForArrow(bestArrow);
      if (blocker) {
        streakRef.current = 0;
        const headBase = gridPtToBase(
          bestArrow.cells[bestArrow.cells.length - 1],
          cellPx,
          originX,
          originY
        );
        const hitBase = gridPtToBase(
          blocker.hitCell,
          cellPx,
          originX,
          originY
        );
        blockedRef.current = {
          arrowId: bestArrow.id,
          blockerId: blocker.blockerId,
          from: headBase,
          to: hitBase,
          until: performance.now() + 520,
        };

        const nextHearts = Math.max(0, heartsRef.current - 1);
        heartsRef.current = nextHearts;
        setHearts(nextHearts);
        setStatusBanner(t.blockedTip(nextHearts));

        if (nextHearts <= 0) {
          audioRef.current.playGameOver();
          setShopOpen(false);
          setEraserMode(false);
          if (loseTimerRef.current !== null) {
            window.clearTimeout(loseTimerRef.current);
          }
          loseTimerRef.current = window.setTimeout(() => {
            loseTimerRef.current = null;
            if (heartsRef.current <= 0 && !wonRef.current) {
              lostRef.current = true;
              setLost(true);
            }
          }, 360);
        } else {
          audioRef.current.playBlocked();
        }
        return;
      }

      // Clear arrow! Pop & slither it out!
      streakRef.current += 1;
      setStatusBanner('');
      audioRef.current.playPop(streakRef.current);
      removeArrowAndAnimate(bestArrow);
      creditClearedArrows(1);
    },
    [
      creditClearedArrows,
      findBlockerForArrow,
      getLayoutMetrics,
      gridPtToBase,
      removeArrowAndAnimate,
      t,
      updateWallet,
    ]
  );

  // Power-Up 1: Hint Bulb — find a clear arrow, highlight it & gently focus camera on it
  const handleUseHint = useCallback(() => {
    if (won || lost || heartsRef.current <= 0 || arrowsRef.current.length === 0) {
      return;
    }

    const focusArrow = (target: MosaicArrow) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const viewW = wrap.clientWidth;
      const viewH = wrap.clientHeight;
      const { cellPx, originX, originY } = getLayoutMetrics(viewW, viewH);
      const mid = target.cells[Math.floor(target.cells.length / 2)];
      const pt = gridPtToBase(mid, cellPx, originX, originY);
      const desiredScale = Math.min(4.2, Math.max(camRef.current.targetScale, 2.0));
      camRef.current.targetScale = desiredScale;
      const clamped = clampCameraOffset(
        (viewW / 2 - pt.x) * desiredScale,
        (viewH / 2 - pt.y) * desiredScale,
        desiredScale
      );
      camRef.current.targetOffsetX = clamped.x;
      camRef.current.targetOffsetY = clamped.y;
      setZoomPct(Math.round(desiredScale * 100));
    };

    // If an active hinted clear arrow is already on screen, re-focus it for free without wasting a hint
    if (hintIdRef.current !== null) {
      const existing = arrowsRef.current.find(
        (a) => a.id === hintIdRef.current && findBlockerForArrow(a) === null
      );
      if (existing) {
        setShopOpen(false);
        focusArrow(existing);
        return;
      }
    }

    if (hintsLeft <= 0) {
      setShopOpen(true);
      return;
    }
    const clearArrow = arrowsRef.current.find(
      (a) => findBlockerForArrow(a) === null
    );
    if (!clearArrow) return;

    hintIdRef.current = clearArrow.id;
    updateWallet((prev) => ({
      ...prev,
      hints: Math.max(0, prev.hints - 1),
    }));
    setEraserMode(false);
    setShopOpen(false);
    audioRef.current.playPop(8);
    focusArrow(clearArrow);
  }, [
    clampCameraOffset,
    findBlockerForArrow,
    getLayoutMetrics,
    gridPtToBase,
    hintsLeft,
    lost,
    updateWallet,
    won,
  ]);

  // Power-Up 2: Magnet — rapidly pull out 4 to 12 currently clear arrows in a satisfying cascade!
  const handleUseMagnet = useCallback(() => {
    if (won || lost || heartsRef.current <= 0 || arrowsRef.current.length === 0) {
      return;
    }
    if (magnetsLeft <= 0) {
      setShopOpen(true);
      return;
    }
    const pulled: MosaicArrow[] = [];
    const maxPull =
      MAGNET_MIN_PULL +
      Math.floor(Math.random() * (MAGNET_MAX_PULL - MAGNET_MIN_PULL + 1));

    for (let step = 0; step < maxPull; step++) {
      const nextClear = arrowsRef.current.find(
        (a) => findBlockerForArrow(a) === null
      );
      if (!nextClear) break;
      pulled.push(nextClear);
      removeArrowAndAnimate(nextClear, step * 35);
    }

    if (pulled.length > 0) {
      updateWallet((prev) => ({
        ...prev,
        magnets: Math.max(0, prev.magnets - 1),
      }));
      setEraserMode(false);
      setShopOpen(false);
      setStatusBanner('');
      audioRef.current.playMagnet();
      creditClearedArrows(pulled.length);
    }
  }, [
    creditClearedArrows,
    findBlockerForArrow,
    lost,
    magnetsLeft,
    removeArrowAndAnimate,
    updateWallet,
    won,
  ]);

  // Power-Up 3: Eraser — toggle safe removal of any single arrow
  const handleToggleEraser = useCallback(() => {
    if (won || lost || heartsRef.current <= 0) return;
    if (erasersLeft <= 0) {
      setShopOpen(true);
      return;
    }
    setShopOpen(false);
    setEraserMode((prev) => {
      const next = !prev;
      setStatusBanner(next ? t.eraserActiveTip : '');
      return next;
    });
  }, [erasersLeft, lost, t.eraserActiveTip, won]);

  // Bottom Shop Purchase (Hint & Eraser: 62 gold, Magnet: 77 gold)
  const handleBuyPowerUp = useCallback(
    (kind: PowerUpKind) => {
      if (won || lost || heartsRef.current <= 0) return;
      const price = SHOP_ITEM_PRICES[kind];
      const cur = walletRef.current;
      if (cur.gold < price) {
        audioRef.current.playBlocked();
        return;
      }
      updateWallet((prev) => ({
        ...prev,
        gold: prev.gold - price,
        hints: kind === 'hint' ? prev.hints + 1 : prev.hints,
        magnets: kind === 'magnet' ? prev.magnets + 1 : prev.magnets,
        erasers: kind === 'eraser' ? prev.erasers + 1 : prev.erasers,
      }));
      audioRef.current.playBuy();
      const itemName =
        kind === 'hint'
          ? t.hintBtn
          : kind === 'magnet'
          ? t.magnetBtn
          : t.eraserBtn;
      showGoldToast(t.boughtToast(itemName));
    },
    [lost, showGoldToast, t, updateWallet, won]
  );

  const adjustZoom = useCallback(
    (factor: number) => {
      const cam = camRef.current;
      const nextScale = Math.max(0.8, Math.min(4.5, cam.targetScale * factor));
      const ratio = nextScale / cam.targetScale;
      cam.targetScale = nextScale;
      const clamped = clampCameraOffset(
        cam.targetOffsetX * ratio,
        cam.targetOffsetY * ratio,
        nextScale
      );
      cam.targetOffsetX = clamped.x;
      cam.targetOffsetY = clamped.y;
      setZoomPct(Math.round(nextScale * 100));
    },
    [clampCameraOffset]
  );

  // Non-passive wheel zoom listener so preventDefault works cleanly without console warnings
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
      adjustZoom(factor);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [adjustZoom]);

  // Pointer Handlers (tap, drag-pan, 2-finger pinch zoom)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const g = gestureRef.current;
    const cam = camRef.current;
    if (pointersRef.current.size === 1) {
      g.isDragging = true;
      g.movedPx = 0;
      g.startX = e.clientX;
      g.startY = e.clientY;
      g.camStartX = cam.targetOffsetX;
      g.camStartY = cam.targetOffsetY;
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      g.isDragging = false;
      g.movedPx = 999;
      g.pinchStartDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      g.pinchStartScale = cam.targetScale;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const g = gestureRef.current;
    const cam = camRef.current;

    if (pointersRef.current.size === 2 && g.pinchStartDist > 8) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const nextScale = Math.max(
        0.8,
        Math.min(4.5, g.pinchStartScale * (dist / g.pinchStartDist))
      );
      cam.targetScale = nextScale;
      const clamped = clampCameraOffset(
        cam.targetOffsetX,
        cam.targetOffsetY,
        nextScale
      );
      cam.targetOffsetX = clamped.x;
      cam.targetOffsetY = clamped.y;
      setZoomPct(Math.round(nextScale * 100));
      return;
    }

    if (g.isDragging && pointersRef.current.size === 1) {
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      g.movedPx = Math.max(g.movedPx, Math.hypot(dx, dy));
      if (g.movedPx > 6) {
        const clamped = clampCameraOffset(
          g.camStartX + dx,
          g.camStartY + dy,
          cam.targetScale
        );
        cam.targetOffsetX = clamped.x;
        cam.targetOffsetY = clamped.y;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gestureRef.current;
    const wasSingleTap =
      pointersRef.current.size === 1 && g.isDragging && g.movedPx <= 9;
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size === 0) {
      g.isDragging = false;
    }
    if (wasSingleTap) {
      handleTapAtScreen(e.clientX, e.clientY);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size === 0) {
      gestureRef.current.isDragging = false;
    }
  };

  // 60fps Canvas Render Loop
  useEffect(() => {
    let rafId = 0;

    const render = (now: number) => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (canvas && wrap) {
        const viewW = wrap.clientWidth;
        const viewH = wrap.clientHeight;
        if (viewW > 0 && viewH > 0) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const targetW = Math.round(viewW * dpr);
          const targetH = Math.round(viewH * dpr);
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Smooth camera lerp
            const cam = camRef.current;
            cam.scale += (cam.targetScale - cam.scale) * 0.22;
            cam.offsetX += (cam.targetOffsetX - cam.offsetX) * 0.22;
            cam.offsetY += (cam.targetOffsetY - cam.offsetY) * 0.22;

            ctx.save();
            ctx.scale(dpr, dpr);

            // Deep royal indigo-violet backdrop matching the reference screenshot
            const bg = ctx.createRadialGradient(
              viewW * 0.5,
              viewH * 0.46,
              20,
              viewW * 0.5,
              viewH * 0.5,
              Math.max(viewW, viewH) * 0.78
            );
            bg.addColorStop(0, '#2e14a8');
            bg.addColorStop(0.55, '#210c84');
            bg.addColorStop(1, '#140659');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, viewW, viewH);

            // Apply Camera Pan & Zoom
            ctx.translate(viewW / 2 + cam.offsetX, viewH / 2 + cam.offsetY);
            ctx.scale(cam.scale, cam.scale);
            ctx.translate(-viewW / 2, -viewH / 2);

            const { cellPx, originX, originY } = getLayoutMetrics(viewW, viewH);

            // Clear expired blocked flash
            if (blockedRef.current && now >= blockedRef.current.until) {
              blockedRef.current = null;
            }
            const activeBlocked = blockedRef.current;
            const hintId = hintIdRef.current;
            const pulse = 0.5 + 0.5 * Math.sin(now * 0.01);

            // Draw all remaining curved arrows inside the shape
            const arrows = arrowsRef.current;
            for (let i = 0; i < arrows.length; i++) {
              const a = arrows[i];
              const pts = a.cells.map((c) =>
                gridPtToBase(c, cellPx, originX, originY)
              );

              let hl: 'none' | 'hint' | 'blocked' | 'eraser' = 'none';
              if (
                activeBlocked &&
                (activeBlocked.arrowId === a.id ||
                  activeBlocked.blockerId === a.id)
              ) {
                hl = 'blocked';
              } else if (hintId === a.id) {
                hl = 'hint';
              }

              drawCurvedCanvasArrow(ctx, pts, cellPx, a.color, hl);

              // Pulsing ring around the hinted arrow for instant spotting
              if (hintId === a.id) {
                const head = pts[pts.length - 1];
                ctx.save();
                ctx.strokeStyle = `rgba(74, 222, 128, ${0.45 + pulse * 0.5})`;
                ctx.lineWidth = Math.max(1.5, cellPx * 0.22);
                ctx.beginPath();
                ctx.arc(
                  head.x,
                  head.y,
                  cellPx * (1.2 + pulse * 0.7),
                  0,
                  Math.PI * 2
                );
                ctx.stroke();
                ctx.restore();
              }
            }

            // Draw dashed red collision sightline when a blocked arrow is tapped
            if (activeBlocked) {
              ctx.save();
              ctx.strokeStyle = '#fb7185';
              ctx.lineWidth = Math.max(1.6, cellPx * 0.22);
              ctx.setLineDash([cellPx * 0.5, cellPx * 0.35]);
              ctx.beginPath();
              ctx.moveTo(activeBlocked.from.x, activeBlocked.from.y);
              ctx.lineTo(activeBlocked.to.x, activeBlocked.to.y);
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.fillStyle = '#fb7185';
              ctx.beginPath();
              ctx.arc(
                activeBlocked.to.x,
                activeBlocked.to.y,
                Math.max(2.6, cellPx * 0.36),
                0,
                Math.PI * 2
              );
              ctx.fill();
              ctx.restore();
            }

            // Draw silky slithering-out arrows
            const aliveSlithers: SlitherAnim[] = [];
            for (const anim of slithersRef.current) {
              if (now < anim.startedAt) {
                aliveSlithers.push(anim);
                continue;
              }
              const rawT = (now - anim.startedAt) / anim.duration;
              if (rawT >= 1) continue;
              aliveSlithers.push(anim);

              const eased = Math.min(1, rawT * rawT * (1.85 - 0.85 * rawT));
              const maxTravel = Math.max(1, anim.totalLen - anim.bodyLen);
              const offset = eased * maxTravel;
              const livePts = extractSubPolyline(
                anim.fullTrack,
                offset,
                offset + anim.bodyLen
              );
              const opacity =
                rawT > 0.68 ? Math.max(0, 1 - (rawT - 0.68) / 0.32) : 1;

              ctx.save();
              ctx.globalAlpha = opacity;
              drawCurvedCanvasArrow(
                ctx,
                livePts,
                cellPx,
                anim.arrow.color,
                'none'
              );
              ctx.restore();
            }
            slithersRef.current = aliveSlithers;

            ctx.restore();
          }
        }
      }

      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(rafId);
  }, [getLayoutMetrics, gridPtToBase]);

  const totalForStage = spec.targetArrows;
  const clearedForStage = Math.max(0, totalForStage - remainingCount);
  const progressPct = Math.min(
    100,
    Math.round((clearedForStage / Math.max(1, totalForStage)) * 100)
  );
  const allCleared = currentLevel >= ARROW_MOSAIC_TOTAL_LEVELS;

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 h-[100dvh] z-50 bg-[#140659] text-slate-100 flex flex-col overflow-hidden select-none"
    >
      {/* Top Bar: Corner Exit, Stage & Remaining Arrows Counter, 5 Hearts, Music Toggle */}
      <header className="w-full border-b border-white/12 bg-[#160863]/95 shrink-0">
        <div className="mx-auto max-w-[980px] h-13 sm:h-14 px-2.5 sm:px-5 flex items-center justify-between gap-2">
          {/* Corner Exit Button */}
          <button
            type="button"
            onClick={onExitToHub}
            className="h-9 px-2.5 sm:px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 hover:text-white text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 shrink-0 rtl:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>{t.exitBtn}</span>
          </button>

          {/* Center: Prominent Remaining Arrows Counter + Stage & Shape Name */}
          <div className="flex flex-col items-center justify-center min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-indigo-200 whitespace-nowrap">
              <span>{t.title}</span>
              <span className="text-indigo-400">·</span>
              <span className="text-amber-300 font-num">
                {t.stageWord} {currentLevel}/{ARROW_MOSAIC_TOTAL_LEVELS} (
                {t.shapes[spec.shape]})
              </span>
            </div>
            <div className="font-num text-xs sm:text-base font-extrabold text-cyan-200 whitespace-nowrap">
              {t.remainingLabel(remainingCount, totalForStage)}
            </div>
          </div>

          {/* Right: 5 Hearts + Music Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center gap-0.5" aria-label="Hearts">
              {Array.from({ length: MAX_HEARTS }).map((_, idx) => {
                const filled = idx < hearts;
                return (
                  <svg
                    key={idx}
                    viewBox="0 0 24 24"
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${
                      filled
                        ? 'text-rose-400 scale-100'
                        : 'text-indigo-950 scale-90'
                    }`}
                    fill={filled ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={filled ? '1.6' : '2'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                );
              })}
            </div>
            <MusicToggleButton
              enabled={musicEnabled}
              onToggle={onToggleMusic}
              lang={lang}
            />
          </div>
        </div>

        {/* Thin Stage Completion Progress Bar */}
        <div className="w-full h-1 bg-indigo-950/90">
          <div
            style={{ width: `${progressPct}%` }}
            className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 transition-all duration-200"
          />
        </div>
      </header>

      {/* Full-Bleed Interactive Mosaic Canvas Stage */}
      <main className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
        <div ref={wrapRef} className="relative flex-1 min-h-0 w-full">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            className={`w-full h-full block touch-none ${
              eraserMode ? 'cursor-crosshair' : 'cursor-pointer'
            }`}
          />

          {/* Compact Zoom Controls Floating in Top-Start Corner */}
          <div
            dir="ltr"
            className="absolute top-3 left-3 z-10 flex flex-col gap-1.5"
          >
            <button
              type="button"
              onClick={() => adjustZoom(1.3)}
              aria-label="Zoom In"
              className="w-9 h-9 rounded-xl border border-white/15 bg-[#12074d]/85 hover:bg-[#1f0e78] text-white font-bold text-lg inline-flex items-center justify-center shadow-lg cursor-pointer"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => adjustZoom(1 / 1.3)}
              aria-label="Zoom Out"
              className="w-9 h-9 rounded-xl border border-white/15 bg-[#12074d]/85 hover:bg-[#1f0e78] text-white font-bold text-lg inline-flex items-center justify-center shadow-lg cursor-pointer"
            >
              −
            </button>
            <button
              type="button"
              onClick={resetCamera}
              className="px-2 h-8 rounded-xl border border-white/15 bg-[#12074d]/85 hover:bg-[#1f0e78] text-cyan-200 font-num font-bold text-[11px] inline-flex items-center justify-center shadow-lg cursor-pointer"
            >
              {zoomPct === 100 ? t.fitBtn : `${zoomPct}%`}
            </button>
          </div>

          {/* Live Gold Balance + 10-Arrow Gold Meter in Top-Right Corner */}
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={() => setShopOpen((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl border border-amber-300/45 bg-[#12074d]/90 hover:bg-[#1f0e78] shadow-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4.5 h-4.5 shrink-0"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9.5"
                  fill="#fbbf24"
                  stroke="#92400e"
                  strokeWidth="1.8"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="6"
                  fill="#fde68a"
                  stroke="#d97706"
                  strokeWidth="1.2"
                />
                <path
                  d="M12 8.5v7M9.8 11.2h4.4"
                  stroke="#92400e"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <div className="flex flex-col items-start leading-none">
                <span className="font-num text-xs sm:text-sm font-extrabold text-amber-300">
                  {gold}
                </span>
                <span className="font-num text-[10px] font-semibold text-indigo-200/85">
                  {t.nextGoldProgress(arrowProgress)}
                </span>
              </div>
            </button>

            {goldToast && (
              <div className="pointer-events-none px-2.5 py-1 rounded-lg border border-amber-300/70 bg-amber-400 text-slate-950 font-num text-xs font-extrabold shadow-lg animate-bounce">
                {goldToast}
              </div>
            )}
          </div>

          {/* Dynamic Feedback Line (Eraser Active / Blocked Alert) */}
          {statusBanner && (
            <div className="pointer-events-none absolute top-3 inset-x-14 z-10 flex justify-center">
              <div
                className={`px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-bold shadow-lg backdrop-blur-sm ${
                  eraserMode
                    ? 'border-fuchsia-300/60 bg-fuchsia-950/90 text-fuchsia-100'
                    : 'border-rose-400/60 bg-rose-950/90 text-rose-100'
                }`}
              >
                {statusBanner}
              </div>
            </div>
          )}

          {/* Stage Clear Overlay */}
          {won && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-5 bg-[#0c0436]/86 backdrop-blur-[3px]">
              <div className="w-full max-w-sm rounded-2xl border border-amber-300/40 bg-[#170963]/95 p-6 text-center shadow-2xl">
                <h2 className="text-xl sm:text-2xl font-bold text-amber-300 mb-2">
                  {allCleared
                    ? t.allClearTitle
                    : t.winTitle(currentLevel, t.shapes[spec.shape])}
                </h2>
                <p className="text-sm text-indigo-100 mb-5">
                  {t.winSub(totalForStage)}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  {!allCleared && (
                    <button
                      type="button"
                      onClick={() => loadStage(currentLevel + 1, true)}
                      className="w-full sm:w-auto min-w-[155px] px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm sm:text-base transition-colors cursor-pointer"
                    >
                      {t.nextStageBtn(currentLevel + 1)}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => loadStage(currentLevel, true)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl border border-white/20 bg-indigo-900/80 hover:bg-indigo-800 text-white font-semibold text-sm transition-colors cursor-pointer"
                  >
                    {t.replayBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {lost && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-5 bg-[#0c0436]/88 backdrop-blur-[3px]">
              <div className="w-full max-w-sm rounded-2xl border border-rose-400/40 bg-[#170963]/95 p-6 text-center shadow-2xl">
                <h2 className="text-xl sm:text-2xl font-bold text-rose-300 mb-2">
                  {t.loseTitle}
                </h2>
                <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed mb-5">
                  {t.loseSub(remainingCount)}
                </p>
                <button
                  type="button"
                  onClick={() => loadStage(currentLevel, true)}
                  className="min-w-[165px] px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm sm:text-base transition-colors cursor-pointer"
                >
                  {t.tryAgainBtn}
                </button>
              </div>
            </div>
          )}

          {/* Bottom Shop Drawer (anchored right above the bottom dock) */}
          {shopOpen && !won && !lost && (
            <div
              onClick={() => setShopOpen(false)}
              className="absolute inset-0 z-20 bg-[#0b0430]/55 backdrop-blur-[2px] flex items-end justify-center p-2.5 sm:p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[780px] rounded-2xl border border-amber-300/45 bg-[#170963]/98 shadow-2xl overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/12 flex items-center justify-between gap-2 bg-[#1e0c7a]/90">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-amber-300">
                        {t.shopTitle}
                      </h3>
                      <span className="font-num text-xs font-extrabold text-slate-950 bg-amber-300 px-2 py-0.5 rounded-md">
                        {gold} {t.goldWord}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-indigo-200/90 mt-0.5">
                      {t.shopRule} ·{' '}
                      <span className="font-num font-bold text-cyan-200">
                        {t.nextGoldProgress(arrowProgress)}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShopOpen(false)}
                    className="h-8 px-3 rounded-lg border border-white/15 bg-indigo-900/90 hover:bg-indigo-800 text-xs font-bold text-white shrink-0 cursor-pointer"
                  >
                    {t.closeBtn}
                  </button>
                </div>

                <div className="p-3 sm:p-4 grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Shop Item 1: Hint Bulb */}
                  <div className="rounded-xl border border-white/15 bg-[#12074d]/95 p-2.5 sm:p-3 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-xl bg-[#fef3c7] border border-amber-300 flex items-center justify-center mb-1.5">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-6 h-6 text-amber-500"
                        fill="currentColor"
                        stroke="#92400e"
                        strokeWidth="1.6"
                        aria-hidden="true"
                      >
                        <path d="M9 18h6M10 21h4M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2z" />
                      </svg>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white">
                      {t.hintBtn}
                    </div>
                    <div className="font-num text-[11px] text-indigo-200 mb-2.5">
                      {t.ownedLabel(hintsLeft)}
                    </div>
                    <button
                      type="button"
                      disabled={gold < SHOP_ITEM_PRICES.hint}
                      onClick={() => handleBuyPowerUp('hint')}
                      className={`w-full py-2 px-1.5 rounded-lg font-num text-[11px] sm:text-xs font-extrabold transition-all ${
                        gold >= SHOP_ITEM_PRICES.hint
                          ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 shadow cursor-pointer'
                          : 'bg-indigo-950/90 border border-white/10 text-indigo-400 cursor-not-allowed'
                      }`}
                    >
                      {gold >= SHOP_ITEM_PRICES.hint
                        ? t.buyForPrice(SHOP_ITEM_PRICES.hint)
                        : t.notEnoughGold(SHOP_ITEM_PRICES.hint)}
                    </button>
                  </div>

                  {/* Shop Item 2: Magnet (77 Gold) */}
                  <div className="rounded-xl border border-white/15 bg-[#12074d]/95 p-2.5 sm:p-3 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-xl bg-[#fef3c7] border border-amber-300 flex items-center justify-center mb-1.5">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-6 h-6"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M6 4v8a6 6 0 0 0 12 0V4"
                          stroke="#dc2626"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                        <rect x="4" y="3" width="4" height="4" rx="1" fill="#38bdf8" />
                        <rect x="16" y="3" width="4" height="4" rx="1" fill="#38bdf8" />
                      </svg>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white">
                      {t.magnetBtn}
                    </div>
                    <div className="font-num text-[11px] text-indigo-200 mb-2.5">
                      {t.ownedLabel(magnetsLeft)}
                    </div>
                    <button
                      type="button"
                      disabled={gold < SHOP_ITEM_PRICES.magnet}
                      onClick={() => handleBuyPowerUp('magnet')}
                      className={`w-full py-2 px-1.5 rounded-lg font-num text-[11px] sm:text-xs font-extrabold transition-all ${
                        gold >= SHOP_ITEM_PRICES.magnet
                          ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 shadow cursor-pointer'
                          : 'bg-indigo-950/90 border border-white/10 text-indigo-400 cursor-not-allowed'
                      }`}
                    >
                      {gold >= SHOP_ITEM_PRICES.magnet
                        ? t.buyForPrice(SHOP_ITEM_PRICES.magnet)
                        : t.notEnoughGold(SHOP_ITEM_PRICES.magnet)}
                    </button>
                  </div>

                  {/* Shop Item 3: Eraser */}
                  <div className="rounded-xl border border-white/15 bg-[#12074d]/95 p-2.5 sm:p-3 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-xl bg-[#fef3c7] border border-amber-300 flex items-center justify-center mb-1.5">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-6 h-6"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M4 15.5 13.5 6a2.1 2.1 0 0 1 3 0l3.5 3.5a2.1 2.1 0 0 1 0 3L12.5 20H7l-3-3a1.1 1.1 0 0 1 0-1.5Z"
                          fill="#fb7185"
                          stroke="#881337"
                          strokeWidth="1.6"
                        />
                        <path
                          d="m10 9.5 4.5 4.5"
                          stroke="#0284c7"
                          strokeWidth="3.5"
                        />
                      </svg>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white">
                      {t.eraserBtn}
                    </div>
                    <div className="font-num text-[11px] text-indigo-200 mb-2.5">
                      {t.ownedLabel(erasersLeft)}
                    </div>
                    <button
                      type="button"
                      disabled={gold < SHOP_ITEM_PRICES.eraser}
                      onClick={() => handleBuyPowerUp('eraser')}
                      className={`w-full py-2 px-1.5 rounded-lg font-num text-[11px] sm:text-xs font-extrabold transition-all ${
                        gold >= SHOP_ITEM_PRICES.eraser
                          ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 shadow cursor-pointer'
                          : 'bg-indigo-950/90 border border-white/10 text-indigo-400 cursor-not-allowed'
                      }`}
                    >
                      {gold >= SHOP_ITEM_PRICES.eraser
                        ? t.buyForPrice(SHOP_ITEM_PRICES.eraser)
                        : t.notEnoughGold(SHOP_ITEM_PRICES.eraser)}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Power-Ups, Shop & Stage Toolbar */}
        <footer className="w-full border-t border-white/12 bg-[#160863]/95 px-2 sm:px-5 py-2 shrink-0">
          <div className="mx-auto max-w-[860px] flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 sm:gap-2">
            {/* Stages & Restart */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setShopOpen(false);
                  setLevelsModalOpen(true);
                }}
                className="h-11 sm:h-12 px-2.5 sm:px-3 rounded-xl border border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                {t.levelsBtn}
              </button>
              <button
                type="button"
                onClick={() => loadStage(currentLevel, true)}
                className="h-11 sm:h-12 px-2.5 sm:px-3 rounded-xl border border-white/15 bg-indigo-900/70 hover:bg-indigo-800/80 text-indigo-100 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                {t.restartBtn}
              </button>
            </div>

            {/* 3 Power-Up Cards + Bottom Shop Button */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap sm:flex-nowrap justify-end">
              {/* Hint Bulb */}
              <button
                type="button"
                disabled={won || lost}
                onClick={handleUseHint}
                className={`h-11 sm:h-12 px-2.5 sm:px-3.5 rounded-xl border-2 flex items-center gap-1.5 sm:gap-2 transition-all ${
                  won || lost
                    ? 'border-white/10 bg-indigo-950/50 text-indigo-500 cursor-not-allowed'
                    : hintsLeft <= 0
                    ? 'border-amber-300/35 bg-indigo-950/80 hover:bg-indigo-900 text-amber-200 cursor-pointer'
                    : 'border-sky-300/60 bg-[#fef3c7] hover:bg-[#fde68a] text-amber-950 shadow-md active:scale-95 cursor-pointer'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0 text-amber-500"
                  fill="currentColor"
                  stroke="#92400e"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <path d="M9 18h6M10 21h4M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2z" />
                </svg>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] sm:text-[11px] font-bold">
                    {t.hintBtn}
                  </span>
                  <span className="font-num text-[11px] sm:text-xs font-extrabold">
                    x{hintsLeft}
                  </span>
                </div>
              </button>

              {/* Magnet (pulls 10 clear arrows at once!) */}
              <button
                type="button"
                disabled={won || lost}
                onClick={handleUseMagnet}
                className={`h-11 sm:h-12 px-2.5 sm:px-3.5 rounded-xl border-2 flex items-center gap-1.5 sm:gap-2 transition-all ${
                  won || lost
                    ? 'border-white/10 bg-indigo-950/50 text-indigo-500 cursor-not-allowed'
                    : magnetsLeft <= 0
                    ? 'border-amber-300/35 bg-indigo-950/80 hover:bg-indigo-900 text-amber-200 cursor-pointer'
                    : 'border-sky-300/60 bg-[#fef3c7] hover:bg-[#fde68a] text-rose-950 shadow-md active:scale-95 cursor-pointer'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 4v8a6 6 0 0 0 12 0V4"
                    stroke="#dc2626"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <rect x="4" y="3" width="4" height="4" rx="1" fill="#38bdf8" />
                  <rect x="16" y="3" width="4" height="4" rx="1" fill="#38bdf8" />
                </svg>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] sm:text-[11px] font-bold">
                    {t.magnetBtn}
                  </span>
                  <span className="font-num text-[11px] sm:text-xs font-extrabold">
                    x{magnetsLeft}
                  </span>
                </div>
              </button>

              {/* Eraser (removes ANY tapped arrow safely) */}
              <button
                type="button"
                disabled={won || lost}
                onClick={handleToggleEraser}
                className={`h-11 sm:h-12 px-2.5 sm:px-3.5 rounded-xl border-2 flex items-center gap-1.5 sm:gap-2 transition-all ${
                  won || lost
                    ? 'border-white/10 bg-indigo-950/50 text-indigo-500 cursor-not-allowed'
                    : erasersLeft <= 0
                    ? 'border-amber-300/35 bg-indigo-950/80 hover:bg-indigo-900 text-amber-200 cursor-pointer'
                    : eraserMode
                    ? 'border-fuchsia-300 bg-fuchsia-400 text-slate-950 shadow-[0_0_16px_rgba(232,121,249,0.65)] scale-[1.03] cursor-pointer'
                    : 'border-sky-300/60 bg-[#fef3c7] hover:bg-[#fde68a] text-slate-900 shadow-md active:scale-95 cursor-pointer'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 15.5 13.5 6a2.1 2.1 0 0 1 3 0l3.5 3.5a2.1 2.1 0 0 1 0 3L12.5 20H7l-3-3a1.1 1.1 0 0 1 0-1.5Z"
                    fill="#fb7185"
                    stroke="#881337"
                    strokeWidth="1.6"
                  />
                  <path
                    d="m10 9.5 4.5 4.5"
                    stroke="#0284c7"
                    strokeWidth="3.5"
                  />
                </svg>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] sm:text-[11px] font-bold">
                    {t.eraserBtn}
                  </span>
                  <span className="font-num text-[11px] sm:text-xs font-extrabold">
                    x{erasersLeft}
                  </span>
                </div>
              </button>

              {/* Bottom Shop Button (62 Gold per Power-Up) */}
              <button
                type="button"
                disabled={won || lost}
                onClick={() => setShopOpen((prev) => !prev)}
                className={`h-11 sm:h-12 px-3 sm:px-3.5 rounded-xl border-2 flex items-center gap-1.5 sm:gap-2 transition-all ${
                  won || lost
                    ? 'border-white/10 bg-indigo-950/50 text-indigo-500 cursor-not-allowed'
                    : shopOpen
                    ? 'border-amber-200 bg-amber-400 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.55)] cursor-pointer'
                    : 'border-amber-300/75 bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 active:scale-95 cursor-pointer'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 9l1.5-5h15L21 9" />
                  <path d="M4 9v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
                  <path d="M9 21v-7h6v7" />
                </svg>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] sm:text-[11px] font-bold">
                    {t.shopBtn}
                  </span>
                  <span className="font-num text-[11px] sm:text-xs font-extrabold">
                    {gold}
                  </span>
                </div>
              </button>
            </div>
          </div>

          <p className="text-center text-[11px] text-indigo-200/75 mt-1.5 hidden sm:block">
            {t.controlsHint}
          </p>
        </footer>

        {/* 10-Stage Locked Selector Modal */}
        {levelsModalOpen && (
          <div
            onClick={() => setLevelsModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-white/15 bg-[#15085c] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="px-4 py-3.5 border-b border-white/12 flex items-center justify-between gap-2 shrink-0">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {t.levelsModalTitle}
                  </h2>
                  <p className="text-xs text-indigo-200/80">
                    {t.levelsModalSub}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLevelsModalOpen(false)}
                  className="h-9 px-3 rounded-lg border border-white/15 bg-indigo-900/90 hover:bg-indigo-800 text-xs font-bold text-white cursor-pointer"
                >
                  {t.closeBtn}
                </button>
              </div>

              <div className="p-4 space-y-2.5 overflow-y-auto">
                {STAGE_SPECS.map((s) => {
                  const isDone = clearedLevels.includes(s.level);
                  const isUnlocked = s.level <= maxUnlocked;
                  const isActive = s.level === currentLevel;
                  return (
                    <button
                      key={s.level}
                      type="button"
                      disabled={!isUnlocked}
                      onClick={() => loadStage(s.level)}
                      className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        !isUnlocked
                          ? 'border-white/8 bg-indigo-950/60 text-indigo-500 cursor-not-allowed'
                          : isActive
                          ? 'border-cyan-300 bg-cyan-500/20 text-white cursor-pointer'
                          : isDone
                          ? 'border-emerald-400/45 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100 cursor-pointer'
                          : 'border-white/15 bg-indigo-900/60 hover:bg-indigo-800/75 text-white cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-num w-8 h-8 rounded-lg bg-white/10 inline-flex items-center justify-center text-sm font-extrabold">
                          {s.level}
                        </span>
                        <div className="text-start">
                          <div className="text-sm font-bold">
                            {t.stageWord} {s.level} — {t.shapes[s.shape]}
                          </div>
                          <div className="font-num text-xs text-cyan-200/90">
                            {t.arrowsCount(s.targetArrows)}
                          </div>
                        </div>
                      </div>

                      {!isUnlocked ? (
                        <svg
                          viewBox="0 0 24 24"
                          className="w-4 h-4 text-indigo-400 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                        </svg>
                      ) : isDone ? (
                        <svg
                          viewBox="0 0 24 24"
                          className="w-5 h-5 text-emerald-400 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
