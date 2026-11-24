import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGamePlayTracking } from './analytics/tracker';
import { miniGameId } from './analytics/games';
import {
  Neon2048Game,
  Neon2048PreviewArt,
  read2048Stats,
  type Neon2048Stats,
} from './game2048';
import {
  NeonSnakeGame,
  NeonSnakePreviewArt,
  readSnakeStats,
  type NeonSnakeStats,
} from './gameSnake';
import {
  APPLE_CATCH_TOTAL_LEVELS,
  AppleCatchGame,
  AppleCatchPreviewArt,
  readAppleCatchClearedCount,
} from './gameAppleCatch';
import {
  ARROW_MOSAIC_TOTAL_LEVELS,
  ArrowMosaicGame,
  ArrowMosaicPreviewArt,
  readArrowMosaicClearedCount,
} from './gameArrowMosaic';
import {
  FRUIT_TIERS,
  FruitMergeGame,
  FruitMergePreviewArt,
  readFruitMergeStats,
  type FruitMergeStats,
} from './gameFruitMerge';
import {
  BRICK_BREAKER_TOTAL_LEVELS,
  BrickBreakerGame,
  BrickBreakerPreviewArt,
  readBrickBreakerStats,
  type BrickBreakerStats,
} from './gameBrickBreaker';
import { MusicToggleButton, useGameMusic } from './gameMusic';
import { DateCatcherGame, DateCatcherPreviewArt } from './dateCatcher/DateCatcherGame';
import { readDateCatcherBestScore } from './dateCatcher/types';
import { DesertRallyGame, DesertRallyPreviewArt } from './desertRally/DesertRallyGame';
import { readDesertRallyStats, type RallyStats } from './desertRally/types';
import { ShawarmaGame, ShawarmaPreviewArt } from './shawarmaShop/ShawarmaGame';
import { readShawarmaStats, type ShawarmaStats } from './shawarmaShop/types';
import { PlantMergeGame, PlantMergePreviewArt } from './plantMerge/PlantMergeGame';
import { readPlantMergeStats, type PlantMergeStats } from './plantMerge/types';
import { MonsterArenaGame, MonsterArenaPreviewArt } from './monsterArena/MonsterArenaGame';
import { readMonsterArenaStats, type MonsterArenaStats } from './monsterArena/types';
import {
  DEVIL_TRAP_TOTAL_LEVELS,
  DevilTrapGame,
  DevilTrapPreviewArt,
  readDevilTrapStats,
} from './devilTrap/DevilTrapGame';
import type { DevilTrapStats } from './devilTrap/types';

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type TierKey = 'intro' | 'curved' | 'woven' | 'hard' | 'master' | 'legend';

interface GridPt {
  x: number;
  y: number;
}

interface Pt {
  x: number;
  y: number;
}

interface ArrowPiece {
  id: number;
  cells: GridPt[]; // ordered from tail (index 0) to head (last index)
  dir: Dir; // exit direction pointed by arrowhead
  isGold: boolean;
  colorIdx: number;
}

interface LevelSpec {
  level: number;
  tierKey: TierKey;
  gridSize: number;
  targetFill: number; // fraction of cells woven with tightly interlocked curved arrows
  minLen: number;
  maxLen: number;
  bendProb: number; // probability of bending at each tail step (creates ⤵️⤴️ curves)
  minBendsWanted: number;
  seed: number;
}

interface SlitherAnim {
  uid: string;
  piece: ArrowPiece;
  startedAt: number;
  duration: number;
  fullTrack: Pt[];
  bodyLen: number;
  totalLen: number;
}

interface BlockedImpact {
  pieceId: number;
  blockerId: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface GamesModalProps {
  lang: 'ar' | 'en';
  sfxEnabled: boolean;
  musicEnabled: boolean;
  initialGame?: MiniGameId | null;
  onToggleMusic: () => void;
  onClose: () => void;
}

const BOARD_SIZE = 640;
const BOARD_PAD = 24;
const MAX_HEARTS = 3;
const COMPLETED_LEVELS_KEY = 'point_catcher_arrow_puzzle_v6_braided';
const TOTAL_LEVELS = 25;

const ALL_DIRS: Dir[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

const DIR_DELTA: Record<Dir, { dx: number; dy: number }> = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
};

// High-contrast vibrant jewel tones so every interlocked curved arrow stands apart from the luminous Golden Arrow
const ARROW_PALETTES = [
  { main: '#38bdf8', light: '#e0f2fe', dark: '#0369a1' }, // Sky Blue
  { main: '#34d399', light: '#d1fae5', dark: '#047857' }, // Emerald
  { main: '#a78bfa', light: '#ede9fe', dark: '#5b21b6' }, // Violet
  { main: '#fb7185', light: '#ffe4e6', dark: '#be123c' }, // Rose
  { main: '#22d3ee', light: '#cffafe', dark: '#0e7490' }, // Cyan
  { main: '#818cf8', light: '#e0e7ff', dark: '#3730a3' }, // Indigo
];

const GOLD_PALETTE = {
  main: '#fbbf24',
  light: '#fef9c3',
  dark: '#92400e',
};

// 20 progressively harder, deeply curved (⤴️⤵️) & tightly braided arrow puzzles — 100% verified solvable
const LEVEL_SPECS: LevelSpec[] = Array.from({ length: TOTAL_LEVELS }, (_, i) => {
  const level = i + 1;
  // Levels 1-4: Curvy ⤴️⤵️ L/U/S arrows tightly braided together right from Level 1
  if (level <= 4) {
    return {
      level,
      tierKey: 'intro',
      gridSize: 8,
      targetFill: 0.87 + level * 0.01,
      minLen: 4,
      maxLen: 7 + Math.floor(level / 2),
      bendProb: 0.88,
      minBendsWanted: 2,
      seed: 1607 + level * 7919,
    };
  }
  // Levels 5-8: Dense multi-bend ⤵️⤴️ hooks & S-curves woven shoulder-to-shoulder
  if (level <= 8) {
    return {
      level,
      tierKey: 'curved',
      gridSize: 9,
      targetFill: 0.90,
      minLen: 4,
      maxLen: 9,
      bendProb: 0.91,
      minBendsWanted: 2,
      seed: 3517 + level * 6133,
    };
  }
  // Levels 9-12: Tightly braided U-wraps, zigzags & nested coils
  if (level <= 12) {
    return {
      level,
      tierKey: 'woven',
      gridSize: 10,
      targetFill: 0.92,
      minLen: 5,
      maxLen: 10,
      bendProb: 0.93,
      minBendsWanted: 3,
      seed: 5903 + level * 5237,
    };
  }
  // Levels 13-16: Deep multi-layer interlocking curved labyrinth
  if (level <= 16) {
    return {
      level,
      tierKey: 'hard',
      gridSize: 11,
      targetFill: 0.93,
      minLen: 5,
      maxLen: 12,
      bendProb: 0.95,
      minBendsWanted: 3,
      seed: 8317 + level * 4421,
    };
  }
  // Levels 17-20: Master Braided Labyrinth — extreme sinuous ⤴️⤵️ interlocks, 100% solvable
  if (level <= 20) {
    return {
      level,
      tierKey: 'master',
      gridSize: 12,
      targetFill: 0.94,
      minLen: 6,
      maxLen: 14,
      bendProb: 0.96,
      minBendsWanted: 4,
      seed: 9973 + level * 3571,
    };
  }
  // Levels 21-25: Legendary Labyrinth — 5 brand-new ultra-dense 13×13 curved mazes, 100% solvable
  return {
    level,
    tierKey: 'legend',
    gridSize: 13,
    targetFill: 0.94,
    minLen: 6,
    maxLen: 15,
    bendProb: 0.97,
    minBendsWanted: 4,
    seed: 12503 + level * 4127,
  };
});

function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

function getHeadCell(piece: ArrowPiece): GridPt {
  return piece.cells[piece.cells.length - 1];
}

function getForwardRayCells(head: GridPt, dir: Dir, gridSize: number): GridPt[] {
  const { dx, dy } = DIR_DELTA[dir];
  const ray: GridPt[] = [];
  let cx = head.x + dx;
  let cy = head.y + dy;
  while (cx >= 0 && cx < gridSize && cy >= 0 && cy < gridSize) {
    ray.push({ x: cx, y: cy });
    cx += dx;
    cy += dy;
  }
  return ray;
}

function countBends(cells: GridPt[]): number {
  let bends = 0;
  for (let i = 1; i < cells.length - 1; i++) {
    const dx1 = cells[i].x - cells[i - 1].x;
    const dy1 = cells[i].y - cells[i - 1].y;
    const dx2 = cells[i + 1].x - cells[i].x;
    const dy2 = cells[i + 1].y - cells[i].y;
    if (dx1 !== dx2 || dy1 !== dy2) bends++;
  }
  return bends;
}

function gridToBoard(pt: GridPt, gridSize: number): Pt {
  const cellSize = (BOARD_SIZE - BOARD_PAD * 2) / gridSize;
  return {
    x: BOARD_PAD + (pt.x + 0.5) * cellSize,
    y: BOARD_PAD + (pt.y + 0.5) * cellSize,
  };
}

function findFirstBlocker(
  piece: ArrowPiece,
  allPieces: ArrowPiece[],
  gridSize: number
): { blocker: ArrowPiece; hitCell: GridPt; steps: number } | null {
  const cellToPiece = new Map<string, ArrowPiece>();
  for (const p of allPieces) {
    if (p.id === piece.id) continue;
    for (const c of p.cells) {
      cellToPiece.set(cellKey(c.x, c.y), p);
    }
  }
  const ray = getForwardRayCells(getHeadCell(piece), piece.dir, gridSize);
  for (let i = 0; i < ray.length; i++) {
    const hit = cellToPiece.get(cellKey(ray[i].x, ray[i].y));
    if (hit) {
      return { blocker: hit, hitCell: ray[i], steps: i + 1 };
    }
  }
  return null;
}

function getAllBlockers(
  piece: ArrowPiece,
  allPieces: ArrowPiece[],
  gridSize: number
): ArrowPiece[] {
  const cellToPiece = new Map<string, ArrowPiece>();
  for (const p of allPieces) {
    if (p.id === piece.id) continue;
    for (const c of p.cells) {
      cellToPiece.set(cellKey(c.x, c.y), p);
    }
  }
  const seen = new Set<number>();
  const blockers: ArrowPiece[] = [];
  for (const r of getForwardRayCells(getHeadCell(piece), piece.dir, gridSize)) {
    const hit = cellToPiece.get(cellKey(r.x, r.y));
    if (hit && !seen.has(hit.id)) {
      seen.add(hit.id);
      blockers.push(hit);
    }
  }
  return blockers;
}

function computeGoldDependencyStats(
  pieces: ArrowPiece[],
  gridSize: number
): { depCount: number; maxDepth: number } {
  const gold = pieces.find((p) => p.isGold);
  if (!gold) return { depCount: 0, maxDepth: 0 };
  const depthMap = new Map<number, number>([[gold.id, 0]]);
  const queue: ArrowPiece[] = [gold];
  let maxDepth = 0;

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const d = depthMap.get(curr.id) ?? 0;
    for (const b of getAllBlockers(curr, pieces, gridSize)) {
      if (!depthMap.has(b.id)) {
        depthMap.set(b.id, d + 1);
        if (d + 1 > maxDepth) maxDepth = d + 1;
        queue.push(b);
      }
    }
  }
  return { depCount: depthMap.size - 1, maxDepth };
}

/**
 * Belt-and-suspenders verification: repeatedly removes unblocked arrows to guarantee
 * 100% of arrows (including the Golden Arrow) can exit cleanly with ZERO deadlocks.
 */
function verifyCompletelySolvable(
  pieces: ArrowPiece[],
  gridSize: number
): boolean {
  let remaining = [...pieces];
  while (remaining.length > 0) {
    const nextRemaining = remaining.filter(
      (p) => findFirstBlocker(p, remaining, gridSize) !== null
    );
    if (nextRemaining.length === remaining.length) {
      return false;
    }
    remaining = nextRemaining;
  }
  return true;
}

/**
 * Generates a tightly interlocked, curved (⤵️⤴️) arrow labyrinth via Reverse Peel-Back:
 * - Every newly placed arrow has its head's forward exit ray 100% clear of all previously placed
 *   arrows (and of its own bent tail!), mathematically guaranteeing solvability.
 * - Its bent/curved tail actively weaves across earlier arrows' exit rays and hugs their curves
 *   so arrows interlock deeply without ever becoming impossible.
 */
function generateAttempt(spec: LevelSpec, seedOffset: number): ArrowPiece[] {
  const rng = createRng(spec.seed + seedOffset * 104729);
  const { gridSize, targetFill, minLen, maxLen, bendProb, minBendsWanted } =
    spec;

  const totalBoardCells = gridSize * gridSize;
  const targetOccupiedCells = Math.floor(totalBoardCells * targetFill);

  const occupied = new Map<string, number>();
  const pieces: ArrowPiece[] = [];
  let nextId = 1;

  // 1) Place a dramatic multi-bend Golden Arrow (5-7 cells, 2-3 curves!) buried in the center
  const goldDir = ALL_DIRS[Math.floor(rng() * 4)];
  const { dx: gdx, dy: gdy } = DIR_DELTA[goldDir];
  const center = Math.floor(gridSize / 2);
  const backShift = gridSize >= 10 ? 2 : 1;
  let ghx = center - gdx * backShift + Math.floor((rng() - 0.5) * 2);
  let ghy = center - gdy * backShift + Math.floor((rng() - 0.5) * 2);
  ghx = Math.max(1, Math.min(gridSize - 2, ghx));
  ghy = Math.max(1, Math.min(gridSize - 2, ghy));

  const goldHead: GridPt = { x: ghx, y: ghy };
  const goldRaySet = new Set(
    getForwardRayCells(goldHead, goldDir, gridSize).map((r) =>
      cellKey(r.x, r.y)
    )
  );
  const goldPre: GridPt = { x: ghx - gdx, y: ghy - gdy };
  const goldRevCells: GridPt[] = [goldHead];

  if (
    goldPre.x >= 0 &&
    goldPre.x < gridSize &&
    goldPre.y >= 0 &&
    goldPre.y < gridSize
  ) {
    goldRevCells.push(goldPre);
    const goldDesiredLen = gridSize >= 11 ? 7 : gridSize >= 9 ? 6 : 5;
    let prevDx = -gdx;
    let prevDy = -gdy;
    let straightStreak = 1;

    while (goldRevCells.length < goldDesiredLen) {
      const tip = goldRevCells[goldRevCells.length - 1];
      const usedSet = new Set(goldRevCells.map((c) => cellKey(c.x, c.y)));
      const options: { pt: GridPt; turned: boolean }[] = [];
      for (const d of ALL_DIRS) {
        const { dx, dy } = DIR_DELTA[d];
        const nx = tip.x + dx;
        const ny = tip.y + dy;
        const k = cellKey(nx, ny);
        if (
          nx >= 0 &&
          nx < gridSize &&
          ny >= 0 &&
          ny < gridSize &&
          !usedSet.has(k) &&
          !goldRaySet.has(k)
        ) {
          let selfAdj = 0;
          for (const nd of ALL_DIRS) {
            const ad = DIR_DELTA[nd];
            if (usedSet.has(cellKey(nx + ad.dx, ny + ad.dy))) selfAdj++;
          }
          if (selfAdj > 1) continue;
          options.push({
            pt: { x: nx, y: ny },
            turned: dx !== prevDx || dy !== prevDy,
          });
        }
      }
      if (options.length === 0) break;
      const turnedOpts = options.filter((o) => o.turned);
      const pool =
        turnedOpts.length > 0 && (straightStreak >= 2 || rng() < 0.85)
          ? turnedOpts
          : options;
      const pick = pool[Math.floor(rng() * pool.length)];
      const ndx = pick.pt.x - tip.x;
      const ndy = pick.pt.y - tip.y;
      straightStreak = ndx === prevDx && ndy === prevDy ? straightStreak + 1 : 1;
      prevDx = ndx;
      prevDy = ndy;
      goldRevCells.push(pick.pt);
    }
  }

  const goldPiece: ArrowPiece = {
    id: nextId++,
    cells: goldRevCells.reverse(), // tail -> ... -> head
    dir: goldDir,
    isGold: true,
    colorIdx: -1,
  };
  pieces.push(goldPiece);
  for (const c of goldPiece.cells) {
    occupied.set(cellKey(c.x, c.y), goldPiece.id);
  }

  const goldChainIds = new Set<number>([goldPiece.id]);

  // Helper: map every empty cell to which placed arrows' exit rays pass through it
  const buildRayTargetMap = (): Map<string, number[]> => {
    const map = new Map<string, number[]>();
    for (const p of pieces) {
      for (const r of getForwardRayCells(getHeadCell(p), p.dir, gridSize)) {
        const k = cellKey(r.x, r.y);
        if (!occupied.has(k)) {
          const list = map.get(k);
          if (list) list.push(p.id);
          else map.set(k, [p.id]);
        }
      }
    }
    return map;
  };

  // Helper: inspect how tightly a cell hugs & braids between OTHER arrows
  const getAdjacentArrowStats = (
    x: number,
    y: number
  ): { totalNeighbors: number; distinctIds: number[] } => {
    let totalNeighbors = 0;
    const distinctIds: number[] = [];
    for (const d of ALL_DIRS) {
      const ad = DIR_DELTA[d];
      const id = occupied.get(cellKey(x + ad.dx, y + ad.dy));
      if (id !== undefined) {
        totalNeighbors++;
        if (!distinctIds.includes(id)) distinctIds.push(id);
      }
    }
    return { totalNeighbors, distinctIds };
  };

  // 2) Weave sinuous, heavily curved arrows until the board is densely braided (~88-94% full!)
  const maxSteps = totalBoardCells;
  for (let step = 1; step < maxSteps; step++) {
    if (occupied.size >= targetOccupiedCells) break;

    const rayTargets = buildRayTargetMap();

    // Collect all valid (headCell, exitDir) whose forward exit ray is 100% clear of occupied cells
    const validHeads: { head: GridPt; dir: Dir; pre: GridPt }[] = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (occupied.has(cellKey(x, y))) continue;
        for (const dir of ALL_DIRS) {
          const { dx, dy } = DIR_DELTA[dir];
          const px = x - dx;
          const py = y - dy;
          if (px < 0 || px >= gridSize || py < 0 || py >= gridSize) continue;
          if (occupied.has(cellKey(px, py))) continue;

          // Solvability invariant: forward exit ray must contain ZERO occupied cells
          const ray = getForwardRayCells({ x, y }, dir, gridSize);
          if (ray.some((r) => occupied.has(cellKey(r.x, r.y)))) continue;

          validHeads.push({ head: { x, y }, dir, pre: { x: px, y: py } });
        }
      }
    }

    if (validHeads.length === 0) break;

    const fillRatio = occupied.size / totalBoardCells;
    // Sample a rich set of valid heads and weave long curved snakes through gaps & hooks
    const headsToEvaluate = Math.min(validHeads.length, 54);
    const candidates: {
      piece: ArrowPiece;
      score: number;
      blocksChain: boolean;
    }[] = [];

    for (let hIdx = 0; hIdx < headsToEvaluate; hIdx++) {
      const pick =
        validHeads.length <= headsToEvaluate
          ? validHeads[hIdx]
          : validHeads[Math.floor(rng() * validHeads.length)];

      const selfRaySet = new Set(
        getForwardRayCells(pick.head, pick.dir, gridSize).map((r) =>
          cellKey(r.x, r.y)
        )
      );

      // Push for long, deeply curved snakes; gracefully allow shorter hooks when filling the last pockets
      const desiredLen =
        fillRatio > 0.78
          ? 3 + Math.floor(rng() * Math.max(2, maxLen - 3))
          : minLen + Math.floor(rng() * (maxLen - minLen + 1));

      const revCells: GridPt[] = [pick.head, pick.pre];
      const localUsed = new Set<string>([
        cellKey(pick.head.x, pick.head.y),
        cellKey(pick.pre.x, pick.pre.y),
      ]);

      let prevDx = pick.pre.x - pick.head.x;
      let prevDy = pick.pre.y - pick.head.y;
      let straightStreak = 1;
      let bendsSoFar = 0;

      // Grow sinuous multi-bend tail backward from preHead
      while (revCells.length < desiredLen) {
        const curr = revCells[revCells.length - 1];
        const stepOptions: { pt: GridPt; stepScore: number; turned: boolean }[] =
          [];

        for (const d of ALL_DIRS) {
          const { dx, dy } = DIR_DELTA[d];
          const nx = curr.x + dx;
          const ny = curr.y + dy;
          if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) continue;
          const k = cellKey(nx, ny);
          if (occupied.has(k) || localUsed.has(k) || selfRaySet.has(k)) continue;

          // Keep crisp ribbon curves (no 2x2 self-touching blobs) while allowing tight U-hooks around pockets
          let selfAdj = 0;
          for (const nd of ALL_DIRS) {
            const ad = DIR_DELTA[nd];
            if (localUsed.has(cellKey(nx + ad.dx, ny + ad.dy))) selfAdj++;
          }
          if (selfAdj > 1) continue;

          const turned = dx !== prevDx || dy !== prevDy;
          let sScore = rng() * 2.5;

          // Strongly force curves (⤴️⤵️, U-hooks, S-waves, zigzags) & discourage flat straight runs!
          if (turned) {
            sScore += bendsSoFar < minBendsWanted ? 19 : 13.5;
            if (straightStreak >= 2) sScore += 9;
          } else {
            if (straightStreak >= 2) sScore -= 11;
            else if (rng() > bendProb) sScore += 1.5;
            else sScore -= 4;
          }

          // Massive bonus for slicing right across the Golden Arrow's or chain's exit ray!
          const hitRayIds = rayTargets.get(k);
          if (hitRayIds) {
            if (hitRayIds.includes(goldPiece.id)) sScore += 22;
            if (hitRayIds.some((id) => goldChainIds.has(id))) sScore += 15;
            else sScore += 8;
          }

          // Huge braiding bonus for threading right between & hugging multiple existing curved arrows!
          const adj = getAdjacentArrowStats(nx, ny);
          sScore += adj.totalNeighbors * 4.5 + adj.distinctIds.length * 7.5;

          stepOptions.push({ pt: { x: nx, y: ny }, stepScore: sScore, turned });
        }

        if (stepOptions.length === 0) break;
        stepOptions.sort((a, b) => b.stepScore - a.stepScore);
        const topPick =
          stepOptions[Math.floor(rng() * Math.min(2, stepOptions.length))];
        const ndx = topPick.pt.x - curr.x;
        const ndy = topPick.pt.y - curr.y;
        if (topPick.turned) {
          bendsSoFar++;
          straightStreak = 1;
        } else {
          straightStreak++;
        }
        prevDx = ndx;
        prevDy = ndy;
        revCells.push(topPick.pt);
        localUsed.add(cellKey(topPick.pt.x, topPick.pt.y));
      }

      const orderedCells = revCells.reverse();
      const bends = countBends(orderedCells);

      // Evaluate overall braiding, interlocking depth & curviness
      let blocksGold = false;
      const blockedChainSet = new Set<number>();
      const blockedAnySet = new Set<number>();
      const touchedArrowsSet = new Set<number>();
      let huggingScore = 0;

      for (const c of orderedCells) {
        const k = cellKey(c.x, c.y);
        const hitIds = rayTargets.get(k);
        if (hitIds) {
          for (const id of hitIds) {
            blockedAnySet.add(id);
            if (id === goldPiece.id) blocksGold = true;
            if (goldChainIds.has(id)) blockedChainSet.add(id);
          }
        }
        const adj = getAdjacentArrowStats(c.x, c.y);
        huggingScore += adj.totalNeighbors;
        for (const id of adj.distinctIds) touchedArrowsSet.add(id);
      }

      let totalScore = rng() * 3;
      if (step <= 4 && blocksGold) totalScore += 42;
      else if (blocksGold) totalScore += 18;
      totalScore += blockedChainSet.size * 21;
      totalScore += blockedAnySet.size * 8;

      // Heavy reward for braiding around multiple distinct arrows ("اشبكهم ببعض")
      totalScore += touchedArrowsSet.size * 10 + huggingScore * 2.8;
      totalScore += orderedCells.length * 3.4;

      // Heavy reward for rich multi-bend ⤴️⤵️ curvature ("ميلهم أكثر") and penalty for short/straight stubs
      totalScore += bends * 12;
      if (bends >= minBendsWanted) totalScore += 14;
      if (fillRatio < 0.78 && bends === 0) totalScore -= 45;
      if (fillRatio < 0.78 && orderedCells.length < 3) totalScore -= 35;

      const selfRayLen = selfRaySet.size;
      if (selfRayLen >= 2) totalScore += 5;
      else if (selfRayLen === 1) totalScore += 2.5;

      candidates.push({
        piece: {
          id: nextId,
          cells: orderedCells,
          dir: pick.dir,
          isGold: false,
          colorIdx: (nextId + Math.floor(rng() * 3)) % ARROW_PALETTES.length,
        },
        score: totalScore,
        blocksChain: blockedChainSet.size > 0,
      });
    }

    if (candidates.length === 0) break;
    candidates.sort((a, b) => b.score - a.score);
    const chosenEntry =
      candidates[Math.floor(rng() * Math.min(2, candidates.length))];
    const chosen = chosenEntry.piece;
    chosen.id = nextId++;

    // Assign a color distinct from adjacent occupied arrows when possible so nested curves pop vividly!
    const neighborColors = new Set<number>();
    for (const c of chosen.cells) {
      for (const d of ALL_DIRS) {
        const ad = DIR_DELTA[d];
        const nid = occupied.get(cellKey(c.x + ad.dx, c.y + ad.dy));
        if (nid !== undefined) {
          const np = pieces.find((p) => p.id === nid);
          if (np && !np.isGold) neighborColors.add(np.colorIdx);
        }
      }
    }
    const availableColors = ARROW_PALETTES.map((_, idx) => idx).filter(
      (idx) => !neighborColors.has(idx)
    );
    chosen.colorIdx =
      availableColors.length > 0
        ? availableColors[Math.floor(rng() * availableColors.length)]
        : Math.floor(rng() * ARROW_PALETTES.length);

    if (chosenEntry.blocksChain) {
      goldChainIds.add(chosen.id);
    }

    pieces.push(chosen);
    for (const c of chosen.cells) {
      occupied.set(cellKey(c.x, c.y), chosen.id);
    }
  }

  return pieces;
}

const LEVEL_CACHE = new Map<number, ArrowPiece[]>();

function generatePuzzleLevel(spec: LevelSpec): ArrowPiece[] {
  const cached = LEVEL_CACHE.get(spec.level);
  if (cached) {
    return cached.map((p) => ({
      ...p,
      cells: p.cells.map((c) => ({ ...c })),
    }));
  }

  let bestPieces: ArrowPiece[] = [];
  let bestQuality = -1;

  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = generateAttempt(spec, attempt);
    if (
      candidate.length < 2 ||
      !verifyCompletelySolvable(candidate, spec.gridSize)
    ) {
      continue;
    }
    const { depCount, maxDepth } = computeGoldDependencyStats(
      candidate,
      spec.gridSize
    );
    const totalBends = candidate.reduce((s, p) => s + countBends(p.cells), 0);
    const totalCells = candidate.reduce((s, p) => s + p.cells.length, 0);
    const quality =
      maxDepth * 14 + depCount * 4 + totalBends * 2.5 + totalCells * 0.6;
    if (quality > bestQuality) {
      bestQuality = quality;
      bestPieces = candidate;
    }
    // Once we have evaluated 3 solid attempts and found a rich solvable board, stop early for speed
    if (attempt >= 2 && bestPieces.length >= 2) break;
  }

  // Guaranteed safe fallback so a level can never render empty
  if (bestPieces.length === 0) {
    bestPieces = generateAttempt({ ...spec, targetFill: 0.72 }, 99);
  }

  LEVEL_CACHE.set(spec.level, bestPieces);
  return bestPieces.map((p) => ({
    ...p,
    cells: p.cells.map((c) => ({ ...c })),
  }));
}

/**
 * Polyline arc-length helpers for silky 60fps curved slither-out animations (⤵️⤴️)
 */
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
        if (Math.hypot(p0.x - last.x, p0.y - last.y) > 0.25) {
          result.push(p0);
        }
      }
      const last = result[result.length - 1];
      if (Math.hypot(p1.x - last.x, p1.y - last.y) > 0.25) {
        result.push(p1);
      }
    }

    acc = segEnd;
    if (acc >= endDist) break;
  }

  return result;
}

/**
 * Builds a smooth quadratic-rounded SVG path (⤵️⤴️) through any polyline.
 * Dynamically clamps corner radii near short segments so animations never kink or flicker.
 */
function buildRoundedSvgPath(pts: Pt[], cornerRadius: number): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
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
    if (len1 < 0.5 || len2 < 0.5) continue;

    // Check if collinear (skip quadratic curve if straight)
    const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
    if (dot < -0.98) {
      d += ` L ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
      continue;
    }

    const r = Math.min(cornerRadius, len1 * 0.498, len2 * 0.498);
    const entryX = curr.x + (v1x / len1) * r;
    const entryY = curr.y + (v1y / len1) * r;
    const exitX = curr.x + (v2x / len2) * r;
    const exitY = curr.y + (v2y / len2) * r;
    d += ` L ${entryX.toFixed(2)} ${entryY.toFixed(2)} Q ${curr.x.toFixed(
      2
    )} ${curr.y.toFixed(2)} ${exitX.toFixed(2)} ${exitY.toFixed(2)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
  return d;
}

function readCompletedLevels(): number[] {
  try {
    const raw = window.localStorage.getItem(COMPLETED_LEVELS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(
        parsed
          .map((n) => Number(n))
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_LEVELS)
      )
    );
  } catch {
    return [];
  }
}

class PuzzleAudio {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playSlide(streak: number): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const base = Math.min(880, 390 + Math.min(streak, 10) * 38);
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.54, now + 0.1);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playHeartLost(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [210, 130].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + idx * 0.075;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.72, t + 0.09);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  public playGameOver(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [293.66, 246.94, 196.0, 146.83].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + i * 0.095;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.075, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  public playGoldWin(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.07;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }
}

const PUZZLE_COPY = {
  ar: {
    exitBtn: 'خروج',
    gameTitle: 'لغز الأسهم',
    goalLine:
      'أسهم منحنية ومتداخلة — اضغط على أي سهم طريق رأسه مفتوح لينساب خارجاً وحرّر السهم الذهبي بـ 3 قلوب فقط!',
    levelLabel: 'المرحلة',
    movesLabel: 'الحركات',
    leftLabel: 'الأسهم',
    solvedLabel: 'المحلولة',
    tiers: {
      intro: 'بداية ومنعطفات',
      curved: 'أسهم منحنية',
      woven: 'تشابك متعرج',
      hard: 'متاهة صعبة',
      master: 'متاهة الخبراء',
      legend: 'متاهة الأساطير (21–25)',
    },
    heartsAria: (n: number) => `القلوب المتبقية: ${n} من ${MAX_HEARTS}`,
    undoBtn: 'تراجع',
    restartBtn: 'إعادة',
    levelsBtn: 'المراحل',
    winTitle: (lvl: number) => `عبقري! حرّرت السهم الذهبي في المرحلة ${lvl}`,
    allClearTitle: 'أسطورة الألغاز! أنهيت جميع الـ 25 متاهة بنجاح',
    winSummary: (moves: number, hearts: number) =>
      `الحركات: ${moves} · القلوب المتبقية: ${hearts}/${MAX_HEARTS}`,
    loseTitle: 'انتهت القلوب!',
    loseSub: (moves: number) =>
      `نفدت محاولاتك الثلاث بعد ${moves} حركة — تأمّل اتجاه رأس كل سهم وحاول مجدداً.`,
    retryBtn: 'إعادة المحاولة',
    nextLevelBtn: (lvl: number) => `المرحلة ${lvl}`,
    replayAllBtn: 'العب من المرحلة 1',
    replayLevelBtn: 'إعادة المرحلة',
    levelsModalTitle: 'اختر المرحلة (25 لغز أسهم منحنية)',
    levelsModalSub: 'المراحل مقفلة — فُز بكل مرحلة لفتح المرحلة التالية.',
    lockedAria: (lvl: number) => `المرحلة ${lvl} مقفلة`,
    close: 'إغلاق',
    blockedTip: (left: number) =>
      left > 0
        ? `خطأ! طريق رأس السهم مسدود — تبقّى لديك ${left} ${left === 1 ? 'قلب' : 'قلوب'} فقط.`
        : 'خطأ! نفدت جميع قلوبك!',
    goldFreeTip: 'طريق السهم الذهبي مفتوح الآن — اضغط عليه لينساب خارجاً!',
  },
  en: {
    exitBtn: 'Exit',
    gameTitle: 'Arrow Escape',
    goalLine:
      'Interlocked curved arrows — tap any arrow with a clear head path to slither it out and free the Golden Arrow with 3 hearts!',
    levelLabel: 'Level',
    movesLabel: 'Moves',
    leftLabel: 'Arrows',
    solvedLabel: 'Solved',
    tiers: {
      intro: 'Intro Bends',
      curved: 'Curved Arrows',
      woven: 'Woven Tangle',
      hard: 'Hard Maze',
      master: 'Master Maze',
      legend: 'Legendary Maze (21–25)',
    },
    heartsAria: (n: number) => `Hearts remaining: ${n} of ${MAX_HEARTS}`,
    undoBtn: 'Undo',
    restartBtn: 'Restart',
    levelsBtn: 'Levels',
    winTitle: (lvl: number) => `Brilliant! Golden Arrow Freed (Level ${lvl})`,
    allClearTitle: 'Grandmaster! All 25 Curved Mazes Cleared',
    winSummary: (moves: number, hearts: number) =>
      `Moves: ${moves} · Hearts left: ${hearts}/${MAX_HEARTS}`,
    loseTitle: 'Out of Hearts!',
    loseSub: (moves: number) =>
      `All 3 hearts lost after ${moves} moves — check each arrowhead path and try again.`,
    retryBtn: 'Try Again',
    nextLevelBtn: (lvl: number) => `Level ${lvl}`,
    replayAllBtn: 'Play from Level 1',
    replayLevelBtn: 'Replay Level',
    levelsModalTitle: 'Choose Level (25 Curved Mazes)',
    levelsModalSub: 'Levels are locked — beat each level to unlock the next.',
    lockedAria: (lvl: number) => `Level ${lvl} locked`,
    close: 'Close',
    blockedTip: (left: number) =>
      left > 0
        ? `Blocked! Wrong tap — ${left} ${left === 1 ? 'heart' : 'hearts'} left.`
        : 'Blocked! No hearts remaining!',
    goldFreeTip: 'Golden Arrow path is clear — tap it to slither free!',
  },
} as const;

/**
 * Renders a smooth curved/bent ribbon arrow (⤵️⤴️) along an arbitrary polyline,
 * with crisp casing shadow, vibrant shaft, specular highlight, and sharp barbed arrowhead.
 */
function CurvedArrowGraphic({
  pts,
  cellSize,
  isGold,
  colorIdx,
  isBlockerFlash,
  isHovered,
  isGoldFree,
  interactive,
}: {
  pts: Pt[];
  cellSize: number;
  isGold: boolean;
  colorIdx: number;
  isBlockerFlash: boolean;
  isHovered: boolean;
  isGoldFree: boolean;
  interactive: boolean;
}) {
  if (pts.length < 2) return null;

  const pal = isGold
    ? GOLD_PALETTE
    : ARROW_PALETTES[Math.abs(colorIdx) % ARROW_PALETTES.length];

  const shaftWidth = cellSize * (isGold ? 0.43 : 0.37);
  const casingWidth = shaftWidth + Math.max(4.5, cellSize * 0.14);
  const cornerRadius = cellSize * 0.50;
  const headLen = cellSize * (isGold ? 0.53 : 0.47);
  const headHalfW = cellSize * (isGold ? 0.37 : 0.33);

  const rawTip = pts[pts.length - 1];
  const prevTip = pts[pts.length - 2];
  const segDx = rawTip.x - prevTip.x;
  const segDy = rawTip.y - prevTip.y;
  const segLen = Math.hypot(segDx, segDy) || 1;
  const dirX = segDx / segLen;
  const dirY = segDy / segLen;
  const angleDeg = (Math.atan2(dirY, dirX) * 180) / Math.PI;

  // Extend the sharp arrowhead tip slightly forward inside its own cell for sleek, unmistakable direction
  const tipExtend = cellSize * 0.25;
  const tip: Pt = {
    x: rawTip.x + dirX * tipExtend,
    y: rawTip.y + dirY * tipExtend,
  };

  // Pull the shaft end slightly behind the arrowhead tip so the point stays razor-sharp
  const extendedPts = [...pts.slice(0, -1), tip];
  const totalLen = polylineLength(extendedPts);
  const pullBack = Math.min(headLen * 0.62, totalLen * 0.45);
  const shaftPts =
    totalLen > pullBack + 1
      ? extractSubPolyline(extendedPts, 0, totalLen - pullBack)
      : extendedPts;

  const shaftPath = buildRoundedSvgPath(shaftPts, cornerRadius);
  const fullPath = buildRoundedSvgPath(extendedPts, cornerRadius);

  // Sharp barbed chevron/triangle arrowhead centered at tip pointing along +X
  const noseR = Math.max(2.2, headHalfW * 0.36);
  const wingX = -headLen * 0.86;
  const wingY = headHalfW * 0.88;
  const notchX = -headLen * 0.58;
  const headPath = `M ${wingX.toFixed(2)} ${(-wingY).toFixed(2)} Q ${(noseR * 0.35).toFixed(2)} ${(-noseR).toFixed(2)} ${(noseR * 0.35).toFixed(2)} 0 Q ${(noseR * 0.35).toFixed(2)} ${noseR.toFixed(2)} ${wingX.toFixed(2)} ${wingY.toFixed(2)} Q ${notchX.toFixed(2)} ${(wingY * 0.35).toFixed(2)} ${notchX.toFixed(2)} 0 Q ${notchX.toFixed(2)} ${(-wingY * 0.35).toFixed(2)} ${wingX.toFixed(2)} ${(-wingY).toFixed(2)} Z`;

  const mainFill = isBlockerFlash ? '#f43f5e' : pal.main;
  const darkStroke = isBlockerFlash ? '#ffe4e6' : pal.dark;
  const sheenColor = isBlockerFlash ? '#fff1f2' : pal.light;

  return (
    <>
      {/* Generous invisible hit path across the entire curved arrow body */}
      {interactive && (
        <path
          d={fullPath}
          fill="none"
          stroke="transparent"
          strokeWidth={cellSize * 0.84}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Status glow halo (Blocker flash / Hover / Golden aura) */}
      {(isBlockerFlash || isHovered || isGold) && (
        <g pointerEvents="none">
          <path
            d={shaftPath}
            fill="none"
            stroke={
              isBlockerFlash
                ? '#fb7185'
                : isGold
                ? '#fde047'
                : pal.light
            }
            strokeWidth={
              casingWidth +
              (isBlockerFlash || isGoldFree ? 8 : isHovered ? 5 : 4.5)
            }
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={
              isBlockerFlash
                ? 0.72
                : isGoldFree
                ? 0.56
                : isGold
                ? 0.28
                : 0.25
            }
          />
          <path
            d={headPath}
            transform={`translate(${tip.x.toFixed(2)}, ${tip.y.toFixed(
              2
            )}) rotate(${angleDeg.toFixed(2)})`}
            fill="none"
            stroke={
              isBlockerFlash
                ? '#fb7185'
                : isGold
                ? '#fde047'
                : pal.light
            }
            strokeWidth={isBlockerFlash || isGoldFree ? 7 : 4}
            strokeLinejoin="round"
            opacity={
              isBlockerFlash
                ? 0.72
                : isGoldFree
                ? 0.56
                : isGold
                ? 0.28
                : 0.25
            }
          />
        </g>
      )}

      {/* Subtle drop shadow so intertwined curves feel sculpted & tactile */}
      <g transform="translate(0, 3)" opacity="0.52" pointerEvents="none">
        <path
          d={shaftPath}
          fill="none"
          stroke="#020617"
          strokeWidth={casingWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={headPath}
          transform={`translate(${tip.x.toFixed(2)}, ${tip.y.toFixed(
            2
          )}) rotate(${angleDeg.toFixed(2)})`}
          fill="#020617"
        />
      </g>

      {/* Dark crisp outer casing (separates tightly hugging curves cleanly without grid boxes) */}
      <path
        d={shaftPath}
        fill="none"
        stroke={darkStroke}
        strokeWidth={casingWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="none"
      />

      {/* Vibrant inner curved arrow body */}
      <path
        d={shaftPath}
        fill="none"
        stroke={mainFill}
        strokeWidth={shaftWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="none"
      />

      {/* Luminous specular sheen tracing the entire curve */}
      <path
        d={shaftPath}
        fill="none"
        stroke={sheenColor}
        strokeWidth={Math.max(1.5, shaftWidth * 0.22)}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
        pointerEvents="none"
      />

      {/* Razor-sharp barbed arrowhead */}
      <path
        d={headPath}
        transform={`translate(${tip.x.toFixed(2)}, ${tip.y.toFixed(
          2
        )}) rotate(${angleDeg.toFixed(2)})`}
        fill={mainFill}
        stroke={darkStroke}
        strokeWidth={Math.max(1.8, cellSize * 0.05)}
        strokeLinejoin="round"
        pointerEvents="none"
      />

      {/* Golden Arrow tail jewel marker for instant spotting in dense mazes */}
      {isGold && pts.length >= 2 && (
        <circle
          cx={pts[0].x}
          cy={pts[0].y}
          r={Math.max(2.6, shaftWidth * 0.26)}
          fill="#fffbeb"
          opacity="0.95"
          pointerEvents="none"
        />
      )}
    </>
  );
}

function HeartIcon({ filled, pulse }: { filled: boolean; pulse: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-all duration-200 ${
        filled
          ? 'text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.55)] scale-100'
          : 'text-slate-700 scale-90'
      } ${pulse ? 'scale-125' : ''}`}
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
}

export type MiniGameId =
  | 'devil-trap'
  | 'monster-arena'
  | 'plant-merge'
  | 'shawarma-shop'
  | 'desert-rally'
  | 'date-catcher'
  | 'arrow-escape'
  | 'arrow-mosaic'
  | 'fruit-merge'
  | 'neon-2048'
  | 'neon-snake'
  | 'apple-catch'
  | 'brick-breaker';

const HUB_COPY = {
  ar: {
    exitBtn: 'خروج',
    hubTitle: 'صالة اللعاب',
    hubSubtitle: 'اختر اللعبة التي تريدها — ويمكنك إضافة ألعاب جديدة هنا لاحقاً.',
    gamesCount: (n: number) => `${n} ${n === 1 ? 'لعبة متاحة' : 'ألعاب متاحة'}`,
    playBtn: 'العب الآن',
    progressLabel: 'التقدم',
    bestScoreLabel: 'أعلى نقاط',
    heartsTag: '3 قلوب',
    arrowMosaicTag: '300–760 سهم',
    fruitMergeTag: '11 فاكهة',
    neonTag: '4×4 نيون',
    snakeTag: 'نيون كلاسيك',
    appleCatchTag: '20 مرحلة',
    brickBreakerTag: '3 قلوب · 15 مرحلة',
    dateCatcherTag: 'ثلاثية الأبعاد · 3 قلوب',
    dateCatcherTitle: 'صيد التمر 3D',
    dateCatcherDesc:
      'التقط التمر والرطب الذهبي المتساقط من النخلة بسلة الخوص في مزرعة غروب ثلاثية الأبعاد، وتجنّب الحصى والدبابير!',
    desertRallyTag: 'سباق 3D · نيترو وقفز',
    desertRallyTitle: 'سباق الصحراء 3D',
    desertRallyDesc:
      'انطلق بسيارة الرالي ثلاثية الأبعاد عبر طريق الوادي السريع، اقفز فوق الحواجز والصخور، اجمع العملات، وفعّل تيربو النيترو!',
    shawarmaTag: 'مطعم 3D · شاورما',
    shawarmaTitle: 'ملك الشاورما 3D',
    shawarmaDesc:
      'قصّ الشاورما من السيخ الدوّار وأضف الثومية والمخلل والبطاطس والشطة حسب طلبات الزبائن واجمع الريالات لتطوير محلك!',
    plantMergeTag: 'متجر 11 نبتة · 21 وحش · إندكس',
    plantMergeTitle: 'مزرعة النباتات 3D',
    plantMergeDesc:
      'اقتل الوحوش لجمع الفلوس، اشترِ 11 نوعاً من النباتات من المتجر مع أسعارها وفوائدها، احمِ المنزل من الأكل، وواجه العملاق كل 5 دقائق!',
    monsterArenaTag: 'فواكه · أسلحة · حيوانات · زعيم 3د و10د',
    monsterArenaTitle: 'حلبة الوحوش 3D',
    monsterArenaDesc:
      'قاتل الوحوش في حلبة بركانية 3D، تناول الفواكه لرفع الطاقة، اشترِ 8 أسلحة أقوى و6 حيوانات تقاتل معك، وواجه وحش الـ 3 دقائق ووحش الـ 10 دقائق!',
    devilTrapTag: '300 مرحلة · عادي · صعب · مستحيل',
    devilTrapTitle: 'بوابة الشيطان 2D',
    devilTrapDesc:
      'لعبة منصات 2D بفكرة Level Devil الأسطورية! 100 مرحلة عادي + 100 صعب + 100 مستحيل بحفر مفاجئة وأشواك مختبئة وأبواب هاربة وجاذبية مقلوبة!',
    arrowGameTitle: 'لغز الأسهم',
    arrowGameDesc:
      'حرّر السهم الذهبي من متاهة الأسهم المنحنية والمتشابكة عبر 25 مرحلة مقفلة بالتسلسل.',
    arrowMosaicTitle: 'فسيفساء الأسهم',
    arrowMosaicDesc:
      'فكّك أشكالاً عملاقة من مئات الأسهم الناعمة المتشابكة عبر 10 مراحل من 300 إلى 760 سهماً مع متجر الذهب والأدوات.',
    fruitMergeTitle: 'دمج الفواكه',
    fruitMergeDesc:
      'أسقط الفواكه وادمج المتشابه منها بفيزياء واقعية لتصل إلى البطيخ الذهبي وتحقق أعلى النقاط.',
    neon2048Title: 'تحدي 2048 النيون',
    neon2048Desc:
      'ادمج الكرات المتشابهة بسحب اللوحة للوصول إلى كرة 2048 وما بعدها مع حفظ أعلى رقم ونقاط.',
    neonSnakeTitle: 'ثعبان النيون',
    neonSnakeDesc:
      'التهم الفواكه والخضار المتوهجة والأناناس الذهبي ×2 في وضع الجدران أو بدون جدران بـ 3 سرعات.',
    appleCatchTitle: 'أمسك التفاح وتجنب الخضار',
    appleCatchDesc:
      'التقط العدد المطلوب من التفاح المتساقط وتفادَ الخضار عبر 20 مرحلة مقفلة بالتسلسل.',
    brickBreakerTitle: 'تكسير النيون',
    brickBreakerDesc:
      'كسّر طوب النيون والفولاذ والقنابل المتفجرة مع قدرات الكرة النارية وتعدد الكرات ×3 عبر 15 مرحلة مشوقة.',
    comingSoonTitle: 'ألعاب جديدة قريباً',
    comingSoonDesc: 'هذه المساحة جاهزة لإضافة المزيد من الألعاب الممتعة.',
  },
  en: {
    exitBtn: 'Exit',
    hubTitle: 'Games Hub',
    hubSubtitle: 'Pick a game to play — ready for more games anytime.',
    gamesCount: (n: number) => `${n} ${n === 1 ? 'Game' : 'Games'}`,
    playBtn: 'Play Now',
    progressLabel: 'Progress',
    bestScoreLabel: 'Best Score',
    heartsTag: '3 Hearts',
    arrowMosaicTag: '300–760 Arrows',
    fruitMergeTag: '11 Fruits',
    neonTag: '4×4 Neon',
    snakeTag: 'Neon Arcade',
    appleCatchTag: '20 Stages',
    brickBreakerTag: '3 Hearts · 15 Stages',
    dateCatcherTag: '3D · 3 Hearts',
    dateCatcherTitle: 'Date Catcher 3D',
    dateCatcherDesc:
      'Catch falling dates & golden rutab in a woven palm basket across a warm 3D sunset oasis while dodging stones and wasps!',
    desertRallyTag: '3D Racer · Nitro & Jumps',
    desertRallyTitle: 'Desert Rally 3D',
    desertRallyDesc:
      'Race your 3D rally buggy down the canyon highway, leap over barriers & boulders, collect gold coins, and ignite Turbo Nitro!',
    shawarmaTag: '3D Shop · Cooking',
    shawarmaTitle: 'Shawarma King 3D',
    shawarmaDesc:
      'Slice roasting meat off the spinning 3D spit, add garlic, pickles, fries & chili to order, earn SAR, and upgrade your shop!',
    plantMergeTag: '11-Plant Shop · 21 Monsters · Index',
    plantMergeTitle: 'Plant Defense 3D',
    plantMergeDesc:
      'Earn Coins by killing monsters, buy all 11 plants from the Plant Shop with listed prices & abilities, protect your house, and survive the 5-min Colossal Boss!',
    monsterArenaTag: 'Fruits · 8 Guns · 6 Pets · 3m & 10m Boss',
    monsterArenaTitle: 'Monster Arena 3D',
    monsterArenaDesc:
      'Fight waves of monsters in a 3D colosseum, eat fruits to raise Energy, unlock 8 weapons & 6 companion battle pets, and survive the 3-Min Warlord & 10-Min Dread Titan!',
    devilTrapTag: '300 Stages · Normal · Hard · Impossible',
    devilTrapTitle: "Devil's Gate 2D",
    devilTrapDesc:
      'Level Devil-style 2D troll platformer! 100 Normal + 100 Hard + 100 Impossible stages packed with collapsing pits, ambush spikes, fleeing doors & gravity flips!',
    arrowGameTitle: 'Arrow Escape',
    arrowGameDesc:
      'Free the Golden Arrow from interlocked curved arrows across 25 locked levels.',
    arrowMosaicTitle: 'Arrow Mosaic',
    arrowMosaicDesc:
      'Untangle 10 giant silhouette shapes made of 300 to 760 smooth curved arrows with a gold power-up shop.',
    fruitMergeTitle: 'Fruit Merge',
    fruitMergeDesc:
      'Drop and merge matching fruits with smooth physics all the way to the Golden Watermelon.',
    neon2048Title: 'Neon 2048',
    neon2048Desc:
      'Slide and merge matching neon balls to reach 2048 and beyond with saved high scores.',
    neonSnakeTitle: 'Neon Snake',
    neonSnakeDesc:
      'Eat glowing fruits, veggies, and golden 2x pineapples across Walls or No-Walls modes.',
    appleCatchTitle: 'Catch Apples, Dodge Veggies',
    appleCatchDesc:
      'Catch the target number of falling apples while dodging veggies across 20 locked stages.',
    brickBreakerTitle: 'Neon Brick Breaker',
    brickBreakerDesc:
      'Shatter neon, armored steel, and chain-exploding bomb bricks with ×3 Multi-Ball & Fireball across 15 stages.',
    comingSoonTitle: 'More Games Soon',
    comingSoonDesc: 'Space ready for adding new mini-games anytime.',
  },
} as const;

interface ArrowEscapeGameProps {
  lang: 'ar' | 'en';
  sfxEnabled: boolean;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  onExitToHub: () => void;
}

const ArrowEscapeGame: React.FC<ArrowEscapeGameProps> = ({
  lang,
  sfxEnabled,
  musicEnabled,
  onToggleMusic,
  onExitToHub,
}) => {
  const t = PUZZLE_COPY[lang];
  const audioRef = useRef<PuzzleAudio>(new PuzzleAudio());

  const [completedLevels, setCompletedLevels] = useState<number[]>(() =>
    readCompletedLevels()
  );

  // Strict sequential unlocking: Level 1 is open; Level N opens only after winning 1..N-1
  const maxUnlockedLevel = useMemo(() => {
    let highest = 1;
    while (highest < TOTAL_LEVELS && completedLevels.includes(highest)) {
      highest++;
    }
    return highest;
  }, [completedLevels]);

  const [currentLevel, setCurrentLevel] = useState<number>(() => {
    const done = readCompletedLevels();
    let highest = 1;
    while (highest < TOTAL_LEVELS && done.includes(highest)) {
      highest++;
    }
    return highest;
  });

  const spec = LEVEL_SPECS[currentLevel - 1];
  const cellSize = (BOARD_SIZE - BOARD_PAD * 2) / spec.gridSize;

  const [pieces, setPieces] = useState<ArrowPiece[]>(() =>
    generatePuzzleLevel(LEVEL_SPECS[currentLevel - 1])
  );
  const [history, setHistory] = useState<ArrowPiece[][]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [hearts, setHearts] = useState<number>(MAX_HEARTS);
  const [heartFlash, setHeartFlash] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);
  const [lost, setLost] = useState<boolean>(false);
  const [slithers, setSlithers] = useState<SlitherAnim[]>([]);
  const [animNow, setAnimNow] = useState<number>(() => performance.now());
  const [blockedImpact, setBlockedImpact] = useState<BlockedImpact | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [levelsPickerOpen, setLevelsPickerOpen] = useState<boolean>(false);

  const streakRef = useRef<number>(0);
  const bumpTimerRef = useRef<number | null>(null);
  const loseTimerRef = useRef<number | null>(null);

  useGameMusic('arrow-escape', musicEnabled && !lost);

  useEffect(() => {
    audioRef.current.enabled = sfxEnabled;
  }, [sfxEnabled]);

  useEffect(() => {
    return () => {
      if (bumpTimerRef.current !== null) window.clearTimeout(bumpTimerRef.current);
      if (loseTimerRef.current !== null) window.clearTimeout(loseTimerRef.current);
    };
  }, []);

  // 60fps animation loop active ONLY while one or more curved arrows are slithering out
  useEffect(() => {
    if (slithers.length === 0) return;
    let rafId = 0;
    const tick = (now: number) => {
      setAnimNow(now);
      setSlithers((prev) => {
        const alive = prev.filter((s) => now - s.startedAt < s.duration);
        return alive.length === prev.length ? prev : alive;
      });
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [slithers.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (levelsPickerOpen) {
          setLevelsPickerOpen(false);
        } else {
          onExitToHub();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [levelsPickerOpen, onExitToHub]);

  const loadLevel = useCallback(
    (lvl: number, bypassLock = false) => {
      const safeLvl = Math.max(1, Math.min(TOTAL_LEVELS, lvl));
      if (!bypassLock && safeLvl > maxUnlockedLevel) return;
      if (bumpTimerRef.current !== null)
        window.clearTimeout(bumpTimerRef.current);
      if (loseTimerRef.current !== null)
        window.clearTimeout(loseTimerRef.current);
      const nextSpec = LEVEL_SPECS[safeLvl - 1];
      setCurrentLevel(safeLvl);
      setPieces(generatePuzzleLevel(nextSpec));
      setHistory([]);
      setMoves(0);
      setHearts(MAX_HEARTS);
      setHeartFlash(false);
      setWon(false);
      setLost(false);
      setSlithers([]);
      setBlockedImpact(null);
      setHoveredId(null);
      setStatusMessage('');
      setLevelsPickerOpen(false);
      streakRef.current = 0;
    },
    [maxUnlockedLevel]
  );

  const isGoldCurrentlyFree = useMemo(() => {
    if (won || lost) return false;
    const gold = pieces.find((p) => p.isGold);
    if (!gold) return false;
    return findFirstBlocker(gold, pieces, spec.gridSize) === null;
  }, [lost, pieces, spec.gridSize, won]);

  const handleTapPiece = useCallback(
    (piece: ArrowPiece) => {
      if (won || lost || hearts <= 0 || levelsPickerOpen) return;

      const hit = findFirstBlocker(piece, pieces, spec.gridSize);
      if (hit) {
        streakRef.current = 0;
        const nextHearts = Math.max(0, hearts - 1);
        setHearts(nextHearts);
        setHeartFlash(true);

        const headPt = gridToBoard(getHeadCell(piece), spec.gridSize);
        const blockerPt = gridToBoard(hit.hitCell, spec.gridSize);
        setBlockedImpact({
          pieceId: piece.id,
          blockerId: hit.blocker.id,
          fromX: headPt.x,
          fromY: headPt.y,
          toX: blockerPt.x,
          toY: blockerPt.y,
        });
        setStatusMessage(t.blockedTip(nextHearts));

        if (bumpTimerRef.current !== null) {
          window.clearTimeout(bumpTimerRef.current);
        }
        bumpTimerRef.current = window.setTimeout(() => {
          setBlockedImpact(null);
          setHeartFlash(false);
        }, 460);

        if (nextHearts <= 0) {
          audioRef.current.playGameOver();
          if (loseTimerRef.current !== null) {
            window.clearTimeout(loseTimerRef.current);
          }
          loseTimerRef.current = window.setTimeout(() => {
            setLost(true);
          }, 380);
        } else {
          audioRef.current.playHeartLost();
        }
        return;
      }

      // Path ahead of arrowhead is 100% clear — slither the entire curved arrow out along its bend!
      setHistory((prev) => [...prev, pieces]);
      const remaining = pieces.filter((p) => p.id !== piece.id);
      setPieces(remaining);
      setMoves((m) => m + 1);
      setHoveredId(null);
      setBlockedImpact(null);
      setStatusMessage('');

      const boardPts = piece.cells.map((c) => gridToBoard(c, spec.gridSize));
      const bodyLen = polylineLength(boardPts);
      const { dx, dy } = DIR_DELTA[piece.dir];
      const headPt = boardPts[boardPts.length - 1];
      const exitDist = BOARD_SIZE + bodyLen + 80;
      const fullTrack: Pt[] = [
        ...boardPts,
        { x: headPt.x + dx * exitDist, y: headPt.y + dy * exitDist },
      ];
      const totalLen = polylineLength(fullTrack);
      const now = performance.now();
      setAnimNow(now);
      setSlithers((prev) => [
        ...prev,
        {
          uid: `${piece.id}-${now}-${Math.random()}`,
          piece,
          startedAt: now,
          duration: piece.isGold ? 520 : 410,
          fullTrack,
          bodyLen,
          totalLen,
        },
      ]);

      if (piece.isGold) {
        setWon(true);
        audioRef.current.playGoldWin();
        setCompletedLevels((prev) => {
          if (prev.includes(currentLevel)) return prev;
          const updated = [...prev, currentLevel];
          try {
            window.localStorage.setItem(
              COMPLETED_LEVELS_KEY,
              JSON.stringify(updated)
            );
          } catch {
            // Ignore storage errors
          }
          return updated;
        });
      } else {
        streakRef.current += 1;
        audioRef.current.playSlide(streakRef.current);
      }
    },
    [
      currentLevel,
      hearts,
      levelsPickerOpen,
      lost,
      pieces,
      spec.gridSize,
      t,
      won,
    ]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0 || won || lost || hearts <= 0) return;
    const prevPieces = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setPieces(prevPieces);
    setSlithers([]);
    setMoves((m) => Math.max(0, m - 1));
    setBlockedImpact(null);
    setStatusMessage('');
  }, [hearts, history, lost, won]);

  const orderedPieces = useMemo(() => {
    return [...pieces].sort((a, b) => Number(a.isGold) - Number(b.isGold));
  }, [pieces]);

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 bg-[#060c18] text-slate-100 flex flex-col overflow-hidden select-none"
    >
      {/* Top Bar with Dedicated Corner Exit Button & 3-Heart Indicator */}
      <header className="w-full border-b border-white/10 bg-[#0a1324]/95 shrink-0">
        <div className="mx-auto max-w-[960px] h-14 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-3">
          {/* Corner Exit Button (back to Games Hub) */}
          <button
            type="button"
            onClick={onExitToHub}
            className="h-9 px-3 sm:px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 hover:text-white text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 whitespace-nowrap shrink-0 cursor-pointer"
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

          {/* Center Title, Level & Tier */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-white whitespace-nowrap truncate">
              {t.gameTitle}
            </h1>
            <span className="text-slate-500" aria-hidden="true">
              ·
            </span>
            <span className="font-num text-xs sm:text-sm font-bold text-amber-300 whitespace-nowrap">
              {t.levelLabel} {currentLevel}/{TOTAL_LEVELS}
            </span>
            <span
              className="hidden sm:inline text-slate-500"
              aria-hidden="true"
            >
              ·
            </span>
            <span className="hidden sm:inline text-xs font-semibold text-sky-300 whitespace-nowrap">
              {t.tiers[spec.tierKey]}
            </span>
          </div>

          {/* 3 Hearts + Inline Metrics */}
          <div className="flex items-center gap-2.5 sm:gap-4 text-xs sm:text-sm shrink-0">
            <div
              className={`flex items-center gap-1 transition-transform duration-150 ${
                heartFlash ? 'scale-110' : ''
              }`}
              aria-label={t.heartsAria(hearts)}
            >
              {Array.from({ length: MAX_HEARTS }).map((_, idx) => (
                <HeartIcon
                  key={idx}
                  filled={idx < hearts}
                  pulse={heartFlash && idx === hearts}
                />
              ))}
            </div>

            <div className="hidden sm:block whitespace-nowrap">
              <span className="text-slate-400">{t.leftLabel}: </span>
              <span className="font-num font-bold text-sky-300">
                {pieces.length}
              </span>
            </div>
            <div className="hidden md:block whitespace-nowrap">
              <span className="text-slate-400">{t.movesLabel}: </span>
              <span className="font-num font-bold text-white">{moves}</span>
            </div>
            <div className="hidden lg:block whitespace-nowrap">
              <span className="text-slate-400">{t.solvedLabel}: </span>
              <span className="font-num font-bold text-emerald-300">
                {completedLevels.length}/{TOTAL_LEVELS}
              </span>
            </div>
            <MusicToggleButton
              enabled={musicEnabled}
              onToggle={onToggleMusic}
              lang={lang}
            />
          </div>
        </div>
      </header>

      {/* Main Puzzle Stage */}
      <main className="relative flex-1 min-h-0 flex flex-col items-center justify-center px-3 sm:px-6 py-2.5 sm:py-3.5 gap-2.5 sm:gap-3 overflow-y-auto">
        {/* Goal Banner / Dynamic Status Line */}
        <p
          className={`text-center text-xs sm:text-sm font-medium max-w-xl leading-relaxed transition-colors ${
            isGoldCurrentlyFree
              ? 'text-amber-300 font-bold'
              : statusMessage
              ? 'text-rose-300 font-semibold'
              : 'text-slate-300'
          }`}
        >
          {isGoldCurrentlyFree
            ? t.goldFreeTip
            : statusMessage || t.goalLine}
        </p>

        {/* Open Tactile Curved-Arrow Arena — NO squares, NO grid boxes */}
        <div
          dir="ltr"
          className={`relative w-full max-w-[540px] aspect-square rounded-2xl border transition-colors duration-200 bg-[radial-gradient(circle_at_50%_50%,#10213d_0%,#081224_62%,#050b16_100%)] shadow-2xl overflow-hidden ${
            heartFlash ? 'border-rose-500/70' : 'border-white/10'
          }`}
        >
          <svg
            viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
            className="w-full h-full block touch-manipulation"
            role="img"
            aria-label={t.gameTitle}
          >
            {/* Blocked Collision Sightline Flash */}
            {blockedImpact && (
              <g pointerEvents="none">
                <line
                  x1={blockedImpact.fromX}
                  y1={blockedImpact.fromY}
                  x2={blockedImpact.toX}
                  y2={blockedImpact.toY}
                  stroke="#fb7185"
                  strokeWidth="3.5"
                  strokeDasharray="7 5"
                  strokeLinecap="round"
                  opacity="0.92"
                />
                <circle
                  cx={blockedImpact.toX}
                  cy={blockedImpact.toY}
                  r="6.5"
                  fill="#fb7185"
                  opacity="0.95"
                />
              </g>
            )}

            {/* Interactive Interlocked Curved Arrows (⤵️⤴️) */}
            {orderedPieces.map((piece) => {
              const isBumped = blockedImpact?.pieceId === piece.id;
              const isBlockerFlash = blockedImpact?.blockerId === piece.id;
              const isHovered = hoveredId === piece.id;
              const { dx, dy } = DIR_DELTA[piece.dir];
              const bumpPx = isBumped ? cellSize * 0.16 : 0;

              const pts = piece.cells.map((c) => {
                const bp = gridToBoard(c, spec.gridSize);
                return { x: bp.x, y: bp.y };
              });

              return (
                <g
                  key={piece.id}
                  onClick={() => handleTapPiece(piece)}
                  onMouseEnter={() => setHoveredId(piece.id)}
                  onMouseLeave={() =>
                    setHoveredId((curr) => (curr === piece.id ? null : curr))
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTapPiece(piece);
                    }
                  }}
                  aria-label={
                    piece.isGold
                      ? lang === 'ar'
                        ? 'السهم الذهبي'
                        : 'Golden Arrow'
                      : `Curved Arrow ${piece.dir}`
                  }
                  style={{
                    transform: `translate(${dx * bumpPx}px, ${dy * bumpPx}px)`,
                    transition: 'transform 140ms cubic-bezier(0.22, 1, 0.36, 1)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <CurvedArrowGraphic
                    pts={pts}
                    cellSize={cellSize}
                    isGold={piece.isGold}
                    colorIdx={piece.colorIdx}
                    isBlockerFlash={isBlockerFlash}
                    isHovered={isHovered}
                    isGoldFree={piece.isGold && isGoldCurrentlyFree}
                    interactive={true}
                  />
                </g>
              );
            })}

            {/* 60fps Curved Slither-Out Animations (arrow glides around its own bend!) */}
            {slithers.map((anim) => {
              const rawT = Math.max(
                0,
                Math.min(1, (animNow - anim.startedAt) / anim.duration)
              );
              // Smooth accelerate-out easing clamped cleanly to [0, 1] so arrows never pop/shrink early
              const eased = Math.min(1, rawT * rawT * (1.85 - 0.85 * rawT));
              const maxTravel = Math.max(1, anim.totalLen - anim.bodyLen);
              const offset = eased * maxTravel;
              const livePts = extractSubPolyline(
                anim.fullTrack,
                offset,
                offset + anim.bodyLen
              );
              const opacity = rawT > 0.72 ? Math.max(0, 1 - (rawT - 0.72) / 0.28) : 1;

              return (
                <g
                  key={anim.uid}
                  pointerEvents="none"
                  style={{ opacity }}
                >
                  <CurvedArrowGraphic
                    pts={livePts}
                    cellSize={cellSize}
                    isGold={anim.piece.isGold}
                    colorIdx={anim.piece.colorIdx}
                    isBlockerFlash={false}
                    isHovered={false}
                    isGoldFree={anim.piece.isGold}
                    interactive={false}
                  />
                </g>
              );
            })}
          </svg>

          {/* Out of Hearts (Lose) Overlay */}
          {lost && (
            <div
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              className="absolute inset-0 z-10 flex items-center justify-center p-5 bg-[#050b16]/88 backdrop-blur-[3px]"
            >
              <div className="w-full max-w-xs text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center shadow-[0_0_24px_rgba(244,63,94,0.35)]">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-8 h-8 text-rose-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
                    <path d="M12 6l-2 4l4 3l-2 4" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5 text-balance">
                  {t.loseTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
                  {t.loseSub(moves)}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => loadLevel(currentLevel)}
                    className="w-full sm:w-auto min-w-[160px] px-6 py-3 rounded-lg bg-rose-500 hover:bg-rose-400 active:scale-[0.98] text-white font-bold text-sm sm:text-base transition-all whitespace-nowrap cursor-pointer"
                  >
                    {t.retryBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLevelsPickerOpen(true)}
                    className="w-full sm:w-auto px-5 py-3 rounded-lg border border-white/15 bg-slate-800/85 hover:bg-slate-700 text-slate-100 font-semibold text-sm transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {t.levelsBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Level Won Overlay */}
          {won && (
            <div
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              className="absolute inset-0 z-10 flex items-center justify-center p-5 bg-[#050b16]/86 backdrop-blur-[3px]"
            >
              <div className="w-full max-w-xs text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-b from-yellow-300 to-amber-500 border border-yellow-100 flex items-center justify-center shadow-[0_0_24px_rgba(251,191,36,0.5)]">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-8 h-8 text-amber-950"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5 text-balance">
                  {currentLevel >= TOTAL_LEVELS
                    ? t.allClearTitle
                    : t.winTitle(currentLevel)}
                </h2>
                <p className="text-sm font-semibold text-amber-300 mb-5">
                  {t.winSummary(moves, hearts)}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      loadLevel(
                        currentLevel >= TOTAL_LEVELS ? 1 : currentLevel + 1,
                        true
                      )
                    }
                    className="w-full sm:w-auto min-w-[160px] px-6 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-bold text-sm sm:text-base transition-all whitespace-nowrap cursor-pointer"
                  >
                    {currentLevel >= TOTAL_LEVELS
                      ? t.replayAllBtn
                      : t.nextLevelBtn(currentLevel + 1)}
                  </button>
                  <button
                    type="button"
                    onClick={() => loadLevel(currentLevel)}
                    className="w-full sm:w-auto px-5 py-3 rounded-lg border border-white/15 bg-slate-800/85 hover:bg-slate-700 text-slate-100 font-semibold text-sm transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {t.replayLevelBtn}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Clean Action Toolbar Below Arena */}
        <div className="w-full max-w-[540px] grid grid-cols-3 gap-2 shrink-0">
          <button
            type="button"
            disabled={history.length === 0 || won || lost || hearts <= 0}
            onClick={handleUndo}
            className={`h-11 px-2 rounded-lg border text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
              history.length === 0 || won || lost || hearts <= 0
                ? 'border-white/5 bg-slate-900/50 text-slate-500 cursor-not-allowed'
                : 'border-white/12 bg-slate-900/90 hover:bg-slate-800 text-slate-100 cursor-pointer'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
            <span>{t.undoBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => loadLevel(currentLevel)}
            className="h-11 px-2 rounded-lg border border-white/12 bg-slate-900/90 hover:bg-slate-800 text-slate-100 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>{t.restartBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => setLevelsPickerOpen(true)}
            className="h-11 px-2 rounded-lg border border-sky-400/35 bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>{t.levelsBtn}</span>
          </button>
        </div>

        {/* Level Picker Overlay Inside the Puzzle Game */}
        {levelsPickerOpen && (
          <div
            onClick={() => setLevelsPickerOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050b16]/86 backdrop-blur-[4px]"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border border-white/14 bg-[#0f1a2e]/98 p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {t.levelsModalTitle}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t.levelsModalSub}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLevelsPickerOpen(false)}
                  aria-label={t.close}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer shrink-0"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 max-h-[65vh] overflow-y-auto pe-1">
                {(
                  [
                    'intro',
                    'curved',
                    'woven',
                    'hard',
                    'master',
                    'legend',
                  ] as const
                ).map((tierKey) => {
                  const tierLevels = LEVEL_SPECS.filter(
                    (s) => s.tierKey === tierKey
                  );
                  return (
                    <div key={tierKey}>
                      <div className="text-xs font-semibold text-slate-400 mb-1.5">
                        {t.tiers[tierKey]}
                      </div>
                      <div
                        className={`grid gap-2 ${
                          tierLevels.length === 5
                            ? 'grid-cols-5'
                            : 'grid-cols-4'
                        }`}
                      >
                        {tierLevels.map((lvlSpec) => {
                          const isLocked = lvlSpec.level > maxUnlockedLevel;
                          const isDone =
                            !isLocked &&
                            completedLevels.includes(lvlSpec.level);
                          const isCurrent =
                            !isLocked && lvlSpec.level === currentLevel;
                          return (
                            <button
                              key={lvlSpec.level}
                              type="button"
                              disabled={isLocked}
                              onClick={() => {
                                if (!isLocked) loadLevel(lvlSpec.level);
                              }}
                              aria-label={
                                isLocked
                                  ? t.lockedAria(lvlSpec.level)
                                  : `${t.levelLabel} ${lvlSpec.level}`
                              }
                              className={`relative h-11 rounded-lg border font-num text-sm sm:text-base font-bold transition-colors flex items-center justify-center gap-1 ${
                                isLocked
                                  ? 'border-white/5 bg-slate-950/75 text-slate-600 cursor-not-allowed'
                                  : isCurrent
                                  ? 'border-amber-400 bg-amber-400/20 text-white cursor-pointer'
                                  : isDone
                                  ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25 cursor-pointer'
                                  : 'border-white/12 bg-slate-900/85 text-slate-200 hover:bg-slate-800 cursor-pointer'
                              }`}
                            >
                              <span>{lvlSpec.level}</span>
                              {isLocked && (
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-3.5 h-3.5 text-slate-500 shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <rect
                                    x="5"
                                    y="11"
                                    width="14"
                                    height="10"
                                    rx="2"
                                  />
                                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                                </svg>
                              )}
                              {isDone && (
                                <span
                                  className="absolute top-1 end-1 text-emerald-400"
                                  aria-hidden="true"
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
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

function ArrowEscapePreviewArt() {
  return (
    <svg
      viewBox="0 0 260 130"
      className="w-full h-full block"
      fill="none"
      aria-hidden="true"
    >
      <rect width="260" height="130" fill="#071123" />
      <circle cx="130" cy="65" r="72" fill="#13294d" opacity="0.45" />

      {/* Blue curved arrow (⤵️) */}
      <path
        d="M 38 34 L 96 34 Q 112 34 112 50 L 112 88"
        stroke="#0369a1"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 38 34 L 96 34 Q 112 34 112 50 L 112 88"
        stroke="#38bdf8"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 112 104 L 101 84 L 112 89 L 123 84 Z"
        fill="#38bdf8"
        stroke="#0369a1"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Emerald S-curved arrow (⤴️) */}
      <path
        d="M 218 96 L 176 96 Q 160 96 160 80 L 160 44 Q 160 28 176 28 L 204 28"
        stroke="#047857"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 218 96 L 176 96 Q 160 96 160 80 L 160 44 Q 160 28 176 28 L 204 28"
        stroke="#34d399"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 222 28 L 202 17 L 207 28 L 202 39 Z"
        fill="#34d399"
        stroke="#047857"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Rose hook arrow */}
      <path
        d="M 48 98 L 76 98 Q 88 98 88 86 L 88 64 Q 88 54 78 54 L 54 54"
        stroke="#be123c"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 48 98 L 76 98 Q 88 98 88 86 L 88 64 Q 88 54 78 54 L 54 54"
        stroke="#fb7185"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 38 54 L 56 44 L 52 54 L 56 64 Z"
        fill="#fb7185"
        stroke="#be123c"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Luminous Golden curved arrow in the heart */}
      <path
        d="M 136 96 L 136 52 Q 136 36 152 36 L 178 36"
        stroke="#fde047"
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.28"
      />
      <path
        d="M 136 96 L 136 52 Q 136 36 152 36 L 178 36"
        stroke="#92400e"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 136 96 L 136 52 Q 136 36 152 36 L 178 36"
        stroke="#fbbf24"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 196 36 L 174 24 L 180 36 L 174 48 Z"
        fill="#fbbf24"
        stroke="#92400e"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="136" cy="96" r="3" fill="#fffbeb" />
    </svg>
  );
}

export const GamesModal: React.FC<GamesModalProps> = ({
  lang,
  sfxEnabled,
  musicEnabled,
  initialGame = null,
  onToggleMusic,
  onClose,
}) => {
  const [activeGame, setActiveGame] = useState<MiniGameId | null>(initialGame);
  const [arrowSolvedCount, setArrowSolvedCount] = useState<number>(
    () => readCompletedLevels().length
  );
  const [stats2048, setStats2048] = useState<Neon2048Stats>(() =>
    read2048Stats()
  );
  const [snakeStats, setSnakeStats] = useState<NeonSnakeStats>(() =>
    readSnakeStats()
  );
  const [appleCatchCleared, setAppleCatchCleared] = useState<number>(() =>
    readAppleCatchClearedCount()
  );
  const [mosaicCleared, setMosaicCleared] = useState<number>(() =>
    readArrowMosaicClearedCount()
  );
  const [fruitMergeStats, setFruitMergeStats] = useState<FruitMergeStats>(() =>
    readFruitMergeStats()
  );
  const [brickBreakerStats, setBrickBreakerStats] = useState<BrickBreakerStats>(
    () => readBrickBreakerStats()
  );
  const [dateCatcherBest, setDateCatcherBest] = useState<number>(() =>
    readDateCatcherBestScore()
  );
  const [desertRallyStats, setDesertRallyStats] = useState<RallyStats>(() =>
    readDesertRallyStats()
  );
  const [shawarmaStats, setShawarmaStats] = useState<ShawarmaStats>(() =>
    readShawarmaStats()
  );
  const [plantMergeStats, setPlantMergeStats] = useState<PlantMergeStats>(() =>
    readPlantMergeStats()
  );
  const [monsterArenaStats, setMonsterArenaStats] = useState<MonsterArenaStats>(() =>
    readMonsterArenaStats()
  );
  const [devilTrapStats, setDevilTrapStats] = useState<DevilTrapStats>(() =>
    readDevilTrapStats()
  );

  // Private analytics: visit + active minutes for the open mini game.
  useGamePlayTracking(miniGameId(activeGame), activeGame !== null);

  // Play soft arcade lounge music while browsing the Games Hub
  useGameMusic('hub', musicEnabled && activeGame === null);

  // Allow Escape key to exit Games Hub cleanly back to the main game
  useEffect(() => {
    if (activeGame !== null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [activeGame, onClose]);

  const handleExitGameToHub = useCallback(() => {
    setArrowSolvedCount(readCompletedLevels().length);
    setStats2048(read2048Stats());
    setSnakeStats(readSnakeStats());
    setAppleCatchCleared(readAppleCatchClearedCount());
    setMosaicCleared(readArrowMosaicClearedCount());
    setFruitMergeStats(readFruitMergeStats());
    setBrickBreakerStats(readBrickBreakerStats());
    setDateCatcherBest(readDateCatcherBestScore());
    setDesertRallyStats(readDesertRallyStats());
    setShawarmaStats(readShawarmaStats());
    setPlantMergeStats(readPlantMergeStats());
    setMonsterArenaStats(readMonsterArenaStats());
    setDevilTrapStats(readDevilTrapStats());
    setActiveGame(null);
  }, []);

  if (activeGame === 'devil-trap') {
    return <DevilTrapGame lang={lang} onExit={handleExitGameToHub} />;
  }

  if (activeGame === 'monster-arena') {
    return <MonsterArenaGame lang={lang} onExit={handleExitGameToHub} />;
  }

  if (activeGame === 'plant-merge') {
    return <PlantMergeGame lang={lang} onExit={handleExitGameToHub} />;
  }

  if (activeGame === 'shawarma-shop') {
    return <ShawarmaGame lang={lang} onExit={handleExitGameToHub} />;
  }

  if (activeGame === 'desert-rally') {
    return <DesertRallyGame lang={lang} onExit={handleExitGameToHub} />;
  }

  if (activeGame === 'date-catcher') {
    return <DateCatcherGame onExit={handleExitGameToHub} />;
  }

  if (activeGame === 'arrow-escape') {
    return (
      <ArrowEscapeGame
        lang={lang}
        sfxEnabled={sfxEnabled}
        musicEnabled={musicEnabled}
        onToggleMusic={onToggleMusic}
        onExitToHub={handleExitGameToHub}
      />
    );
  }

  if (activeGame === 'arrow-mosaic') {
    return (
      <ArrowMosaicGame
        lang={lang}
        sfxEnabled={sfxEnabled}
        musicEnabled={musicEnabled}
        onToggleMusic={onToggleMusic}
        onExitToHub={handleExitGameToHub}
      />
    );
  }

  if (activeGame === 'fruit-merge') {
    return (
      <FruitMergeGame
        lang={lang}
        sfxEnabled={sfxEnabled}
        musicEnabled={musicEnabled}
        onToggleMusic={onToggleMusic}
        onExitToHub={handleExitGameToHub}
      />
    );
  }

  if (activeGame === 'neon-2048') {
    return (
      <Neon2048Game
        lang={lang}
        sfxEnabled={sfxEnabled}
        musicEnabled={musicEnabled}
        onToggleMusic={onToggleMusic}
        onExitToHub={handleExitGameToHub}
      />
    );
  }

  if (activeGame === 'neon-snake') {
    return (
      <NeonSnakeGame
        lang={lang}
        sfxEnabled={sfxEnabled}
        musicEnabled={musicEnabled}
        onToggleMusic={onToggleMusic}
        onExitToHub={handleExitGameToHub}
      />
    );
  }

  if (activeGame === 'apple-catch') {
    return (
      <AppleCatchGame
        lang={lang}
        sfxEnabled={sfxEnabled}
        musicEnabled={musicEnabled}
        onToggleMusic={onToggleMusic}
        onExitToHub={handleExitGameToHub}
      />
    );
  }

  if (activeGame === 'brick-breaker') {
    return (
      <BrickBreakerGame
        lang={lang}
        sfxEnabled={sfxEnabled}
        musicEnabled={musicEnabled}
        onToggleMusic={onToggleMusic}
        onExitToHub={handleExitGameToHub}
      />
    );
  }

  const ht = HUB_COPY[lang];
  const bestFruitTier = FRUIT_TIERS[Math.min(fruitMergeStats.maxTier, FRUIT_TIERS.length - 1)];

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 bg-[#060c18] text-slate-100 flex flex-col overflow-hidden select-none"
    >
      {/* Top Bar with Dedicated Corner Exit Button */}
      <header className="w-full border-b border-white/10 bg-[#0a1324]/95 shrink-0">
        <div className="mx-auto max-w-[960px] h-14 px-3 sm:px-5 flex items-center justify-between gap-3">
          {/* Corner Exit Button back to Main Game */}
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3 sm:px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 hover:text-white text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 whitespace-nowrap shrink-0 cursor-pointer"
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
            <span>{ht.exitBtn}</span>
          </button>

          {/* Center Title */}
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white whitespace-nowrap truncate">
              {ht.hubTitle}
            </h1>
          </div>

          {/* Available Games Count + Music Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="text-xs sm:text-sm font-semibold text-sky-300 whitespace-nowrap">
              {ht.gamesCount(13)}
            </div>
            <MusicToggleButton
              enabled={musicEnabled}
              onToggle={onToggleMusic}
              lang={lang}
            />
          </div>
        </div>
      </header>

      {/* Games Selection Lobby */}
      <main className="flex-1 min-h-0 overflow-y-auto px-2.5 sm:px-6 py-4 sm:py-8">
        <div className="mx-auto max-w-[920px]">
          <p className="text-xs sm:text-sm text-slate-300 mb-3.5 sm:mb-5">
            {ht.hubSubtitle}
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
            {/* Game Card 1: Arrow Escape */}
            <div className="group rounded-xl sm:rounded-2xl border border-amber-400/30 bg-[#0d182d] hover:border-amber-300/60 transition-colors overflow-hidden shadow-xl flex flex-col">
              <div className="aspect-[2/1] w-full border-b border-white/10 overflow-hidden bg-[#071123]">
                <ArrowEscapePreviewArt />
              </div>

              <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <h2 className="text-xs sm:text-lg font-bold text-white leading-snug">
                    {ht.arrowGameTitle}
                  </h2>
                  <span className="font-num text-[10px] sm:text-xs font-semibold text-rose-300 whitespace-nowrap">
                    {ht.heartsTag}
                  </span>
                </div>

                <p className="text-[11px] sm:text-sm text-slate-300 leading-snug sm:leading-relaxed mb-2.5 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">
                  {ht.arrowGameDesc}
                </p>

                <div className="flex items-center justify-between gap-1 text-[10.5px] sm:text-xs text-slate-400 mb-2 sm:mb-3 pt-2 sm:pt-2.5 border-t border-white/8">
                  <span className="truncate">{ht.progressLabel}</span>
                  <span className="font-num font-bold text-amber-300 whitespace-nowrap">
                    {arrowSolvedCount}/{TOTAL_LEVELS}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGame('arrow-escape')}
                  className="w-full h-9 sm:h-11 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-slate-950 font-bold text-xs sm:text-base transition-all cursor-pointer"
                >
                  {ht.playBtn}
                </button>
              </div>
            </div>

            {/* Game Card 2: Neon 2048 */}
            <div className="group rounded-xl sm:rounded-2xl border border-cyan-400/30 bg-[#0d182d] hover:border-cyan-300/60 transition-colors overflow-hidden shadow-xl flex flex-col">
              <div className="aspect-[2/1] w-full border-b border-white/10 overflow-hidden bg-[#071123]">
                <Neon2048PreviewArt />
              </div>

              <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <h2 className="text-xs sm:text-lg font-bold text-white leading-snug">
                    {ht.neon2048Title}
                  </h2>
                  <span className="font-num text-[10px] sm:text-xs font-semibold text-cyan-300 whitespace-nowrap">
                    {ht.neonTag}
                  </span>
                </div>

                <p className="text-[11px] sm:text-sm text-slate-300 leading-snug sm:leading-relaxed mb-2.5 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">
                  {ht.neon2048Desc}
                </p>

                <div className="flex items-center justify-between gap-1 text-[10.5px] sm:text-xs text-slate-400 mb-2 sm:mb-3 pt-2 sm:pt-2.5 border-t border-white/8">
                  <span className="truncate">{ht.bestScoreLabel}</span>
                  <span className="font-num font-bold text-cyan-300 truncate">
                    {stats2048.bestScore}
                    {stats2048.bestTile > 0 ? ` · ${stats2048.bestTile}` : ''}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGame('neon-2048')}
                  className="w-full h-9 sm:h-11 rounded-lg bg-cyan-400 hover:bg-cyan-300 active:scale-[0.99] text-slate-950 font-bold text-xs sm:text-base transition-all cursor-pointer"
                >
                  {ht.playBtn}
                </button>
              </div>
            </div>

            {/* Game Card 3: Neon Snake */}
            <div className="group rounded-xl sm:rounded-2xl border border-emerald-400/30 bg-[#0d182d] hover:border-emerald-300/60 transition-colors overflow-hidden shadow-xl flex flex-col">
              <div className="aspect-[2/1] w-full border-b border-white/10 overflow-hidden bg-[#071123]">
                <NeonSnakePreviewArt />
              </div>

              <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <h2 className="text-xs sm:text-lg font-bold text-white leading-snug">
                    {ht.neonSnakeTitle}
                  </h2>
                  <span className="font-num text-[10px] sm:text-xs font-semibold text-emerald-300 whitespace-nowrap">
                    {ht.snakeTag}
                  </span>
                </div>

                <p className="text-[11px] sm:text-sm text-slate-300 leading-snug sm:leading-relaxed mb-2.5 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">
                  {ht.neonSnakeDesc}
                </p>

                <div className="flex items-center justify-between gap-1 text-[10.5px] sm:text-xs text-slate-400 mb-2 sm:mb-3 pt-2 sm:pt-2.5 border-t border-white/8">
                  <span className="truncate">{ht.bestScoreLabel}</span>
                  <span className="font-num font-bold text-emerald-300 whitespace-nowrap">
                    {snakeStats.bestScore}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGame('neon-snake')}
                  className="w-full h-9 sm:h-11 rounded-lg bg-emerald-400 hover:bg-emerald-300 active:scale-[0.99] text-slate-950 font-bold text-xs sm:text-base transition-all cursor-pointer"
                >
                  {ht.playBtn}
                </button>
              </div>
            </div>

            {/* Game Card 4: Catch Apples, Dodge Veggies */}
            <div className="group rounded-xl sm:rounded-2xl border border-rose-400/30 bg-[#0d182d] hover:border-rose-300/60 transition-colors overflow-hidden shadow-xl flex flex-col">
              <div className="aspect-[2/1] w-full border-b border-white/10 overflow-hidden bg-[#071123]">
                <AppleCatchPreviewArt />
              </div>

              <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <h2 className="text-xs sm:text-lg font-bold text-white leading-snug">
                    {ht.appleCatchTitle}
                  </h2>
                  <span className="font-num text-[10px] sm:text-xs font-semibold text-rose-300 whitespace-nowrap">
                    {ht.appleCatchTag}
                  </span>
                </div>

                <p className="text-[11px] sm:text-sm text-slate-300 leading-snug sm:leading-relaxed mb-2.5 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">
                  {ht.appleCatchDesc}
                </p>

                <div className="flex items-center justify-between gap-1 text-[10.5px] sm:text-xs text-slate-400 mb-2 sm:mb-3 pt-2 sm:pt-2.5 border-t border-white/8">
                  <span className="truncate">{ht.progressLabel}</span>
                  <span className="font-num font-bold text-rose-300 whitespace-nowrap">
                    {appleCatchCleared}/{APPLE_CATCH_TOTAL_LEVELS}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGame('apple-catch')}
                  className="w-full h-9 sm:h-11 rounded-lg bg-rose-500 hover:bg-rose-400 active:scale-[0.99] text-white font-bold text-xs sm:text-base transition-all cursor-pointer"
                >
                  {ht.playBtn}
                </button>
              </div>
            </div>

            {/* Game Card 5: Arrow Mosaic (فسيفساء الأسهم) */}
            <div className="group rounded-xl sm:rounded-2xl border border-indigo-400/40 bg-[#0d182d] hover:border-indigo-300/75 transition-colors overflow-hidden shadow-xl flex flex-col">
              <div className="aspect-[2/1] w-full border-b border-white/10 overflow-hidden bg-[#1e0a6e]">
                <ArrowMosaicPreviewArt />
              </div>

              <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <h2 className="text-xs sm:text-lg font-bold text-white leading-snug">
                    {ht.arrowMosaicTitle}
                  </h2>
                  <span className="font-num text-[10px] sm:text-xs font-semibold text-indigo-300 whitespace-nowrap">
                    {ht.arrowMosaicTag}
                  </span>
                </div>

                <p className="text-[11px] sm:text-sm text-slate-300 leading-snug sm:leading-relaxed mb-2.5 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">
                  {ht.arrowMosaicDesc}
                </p>

                <div className="flex items-center justify-between gap-1 text-[10.5px] sm:text-xs text-slate-400 mb-2 sm:mb-3 pt-2 sm:pt-2.5 border-t border-white/8">
                  <span className="truncate">{ht.progressLabel}</span>
                  <span className="font-num font-bold text-indigo-300 whitespace-nowrap">
                    {mosaicCleared}/{ARROW_MOSAIC_TOTAL_LEVELS}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGame('arrow-mosaic')}
                  className="w-full h-9 sm:h-11 rounded-lg bg-indigo-500 hover:bg-indigo-400 active:scale-[0.99] text-white font-bold text-xs sm:text-base transition-all cursor-pointer"
                >
                  {ht.playBtn}
                </button>
              </div>
            </div>

            {/* Game Card 6: Fruit Merge (دمج الفواكه) */}
            <div className="group rounded-xl sm:rounded-2xl border border-orange-400/35 bg-[#0d182d] hover:border-orange-300/70 transition-colors overflow-hidden shadow-xl flex flex-col">
              <div className="aspect-[2/1] w-full border-b border-white/10 overflow-hidden bg-[#21130d]">
                <FruitMergePreviewArt />
              </div>

              <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <h2 className="text-xs sm:text-lg font-bold text-white leading-snug">
                    {ht.fruitMergeTitle}
                  </h2>
                  <span className="font-num text-[10px] sm:text-xs font-semibold text-orange-300 whitespace-nowrap">
                    {ht.fruitMergeTag}
                  </span>
                </div>

                <p className="text-[11px] sm:text-sm text-slate-300 leading-snug sm:leading-relaxed mb-2.5 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">
                  {ht.fruitMergeDesc}
                </p>

                <div className="flex items-center justify-between gap-1 text-[10.5px] sm:text-xs text-slate-400 mb-2 sm:mb-3 pt-2 sm:pt-2.5 border-t border-white/8">
                  <span className="truncate">{ht.bestScoreLabel}</span>
                  <span className="font-num font-bold text-orange-300 truncate">
                    {fruitMergeStats.bestScore}
                    {fruitMergeStats.bestScore > 0 && bestFruitTier
                      ? ` · ${lang === 'ar' ? bestFruitTier.nameAr : bestFruitTier.nameEn}`
                      : ''}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGame('fruit-merge')}
                  className="w-full h-9 sm:h-11 rounded-lg bg-orange-400 hover:bg-orange-300 active:scale-[0.99] text-slate-950 font-bold text-xs sm:text-base transition-all cursor-pointer"
                >
                  {ht.playBtn}
                </button>
              </div>
            </div>

            {/* Game Card 7: Neon Brick Breaker (تكسير النيون) */}
            <div className="group rounded-xl sm:rounded-2xl border border-sky-400/35 bg-[#0d182d] hover:border-sky-300/70 transition-colors overflow-hidden shadow-xl flex flex-col">
              <div className="aspect-[2/1] w-full border-b border-white/10 overflow-hidden bg-[#060e1f]">
                <BrickBreakerPreviewArt />
              </div>

              <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <h2 className="text-xs sm:text-lg font-bold text-white leading-snug">
                    {ht.brickBreakerTitle}
                  </h2>
                  <span className="font-num text-[10px] sm:text-xs font-semibold text-rose-300 whitespace-nowrap">
                    {ht.brickBreakerTag}
                  </span>
                </div>

                <p className="text-[11px] sm:text-sm text-slate-300 leading-snug sm:leading-relaxed mb-2.5 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">
                  {ht.brickBreakerDesc}
                </p>

                <div className="flex items-center justify-between gap-1 text-[10.5px] sm:text-xs text-slate-400 mb-2 sm:mb-3 pt-2 sm:pt-2.5 border-t border-white/8">
                  <span className="truncate">{ht.progressLabel}</span>
                  <span className="font-num font-bold text-sky-300 truncate">
                    {brickBreakerStats.clearedStages.length}/{BRICK_BREAKER_TOTAL_LEVELS}
                    {brickBreakerStats.bestScore > 0
                      ? ` · ${brickBreakerStats.bestScore}`
                      : ''}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGame('brick-breaker')}
                  className="w-full h-9 sm:h-11 rounded-lg bg-sky-400 hover:bg-sky-300 active:scale-[0.99] text-slate-950 font-bold text-xs sm:text-base transition-all cursor-pointer"
                >
                  {ht.playBtn}
                </button>
              </div>
            </div>

            {/* Game Card 8: Date Catcher 3D (صيد التمر) */}
            <div className="group rounded-xl sm:rounded-2xl border border-amber-400/50 bg-[#1a1314] hover:border-amber-300/80 transition-colors overflow-hidden shadow-xl flex flex-col">
              <div className="aspect-[2/1] w-full border-b border-white/10 overflow-hidden bg-[#2b1718]">
                <DateCatcherPreviewArt />
              </div>

              <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <h2 className="text-xs sm:text-lg font-bold text-amber-100 leading-snug">
                    {ht.dateCatcherTitle}
                  </h2>
                  <span className="font-num text-[10px] sm:text-xs font-semibold text-amber-300 whitespace-nowrap">
                    {ht.dateCatcherTag}
                  </span>
                </div>

                <p className="text-[11px] sm:text-sm text-amber-100/75 leading-snug sm:leading-relaxed mb-2.5 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">
                  {ht.dateCatcherDesc}
                </p>

                <div className="flex items-center justify-between gap-1 text-[10.5px] sm:text-xs text-amber-200/75 mb-2 sm:mb-3 pt-2 sm:pt-2.5 border-t border-white/10">
                  <span className="truncate">{ht.bestScoreLabel}</span>
                  <span className="font-num font-bold text-amber-300 whitespace-nowrap">
                    {dateCatcherBest}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGame('date-catcher')}
                  className="w-full h-9 sm:h-11 rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 active:scale-[0.99] text-[#2a1104] font-extrabold text-xs sm:text-base transition-all cursor-pointer"
                >
                  {ht.playBtn}
                </button>
              </div>
            </div>

            {/* Game Card 9: Desert Rally 3D (سباق الصحراء 3D) */}
            <div className="group rounded-xl sm:rounded-2xl border border-orange-400/55 bg-[#1a131b] hover:border-orange-300/85 transition-colors overflow-hidden shadow-xl flex flex-col">
              <div className="aspect-[2/1] w-full border-b border-white/10 overflow-hidden bg-[#1d2b53]">
                <DesertRallyPreviewArt />
              </div>

              <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <h2 className="text-xs sm:text-lg font-bold text-orange-100 leading-snug">
                    {ht.desertRallyTitle}
                  </h2>
                  <span className="font-num text-[10px] sm:text-xs font-semibold text-orange-300 whitespace-nowrap">
                    {ht.desertRallyTag}
                  </span>
                </div>

                <p className="text-[11px] sm:text-sm text-orange-100/75 leading-snug sm:leading-relaxed mb-2.5 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">
                  {ht.desertRallyDesc}
                </p>

                <div className="flex items-center justify-between gap-1 text-[10.5px] sm:text-xs text-orange-200/75 mb-2 sm:mb-3 pt-2 sm:pt-2.5 border-t border-white/10">
                  <span className="truncate">{ht.bestScoreLabel}</span>
                  <span className="font-num font-bold text-orange-300 whitespace-nowrap">
                    {desertRallyStats.bestScore}
                    {desertRallyStats.bestDistanceM > 0
                      ? ` · ${desertRallyStats.bestDistanceM}m`
                      : ''}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGame('desert-rally')}
                  className="w-full h-9 sm:h-11 rounded-lg bg-gradient-to-b from-orange-400 to-amber-500 hover:from-orange-300 hover:to-amber-400 active:scale-[0.99] text-slate-950 font-extrabold text-xs sm:text-base transition-all cursor-pointer"
                >
                  {ht.playBtn}
                </button>
              </div>
            </div>

            {/* Game Card 10: Shawarma King 3D (ملك الشاورما 3D) */}
            <div className="group rounded-xl sm:rounded-2xl border border-red-400/50 bg-[#1f1216] hover:border-amber-300/80 transition-colors overflow-hidden shadow-xl flex flex-col">
              <div className="aspect-[2/1] w-full border-b border-white/10 overflow-hidden bg-[#3b1824]">
                <ShawarmaPreviewArt />
              </div>

              <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <h2 className="text-xs sm:text-lg font-bold text-amber-100 leading-snug">
                    {ht.shawarmaTitle}
                  </h2>
                  <span className="font-num text-[10px] sm:text-xs font-semibold text-rose-300 whitespace-nowrap">
                    {ht.shawarmaTag}
                  </span>
                </div>

                <p className="text-[11px] sm:text-sm text-amber-100/75 leading-snug sm:leading-relaxed mb-2.5 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">
                  {ht.shawarmaDesc}
                </p>

                <div className="flex items-center justify-between gap-1 text-[10.5px] sm:text-xs text-amber-200/75 mb-2 sm:mb-3 pt-2 sm:pt-2.5 border-t border-white/10">
                  <span className="truncate">{ht.bestScoreLabel}</span>
                  <span className="font-num font-bold text-amber-300 whitespace-nowrap">
                    {shawarmaStats.bestCash > 0
                      ? `${shawarmaStats.bestCash} · D${shawarmaStats.bestDay}`
                      : '0'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGame('shawarma-shop')}
                  className="w-full h-9 sm:h-11 rounded-lg bg-gradient-to-b from-amber-300 to-orange-500 hover:from-amber-200 hover:to-orange-400 active:scale-[0.99] text-[#261105] font-extrabold text-xs sm:text-base transition-all cursor-pointer"
                >
                  {ht.playBtn}
                </button>
              </div>
            </div>

            {/* Game Card 11: Garden Merge 3D (مزرعة الدمج 3D) */}
            <div className="group rounded-xl sm:rounded-2xl border border-emerald-400/55 bg-[#0f1f17] hover:border-emerald-300/85 transition-colors overflow-hidden shadow-xl flex flex-col">
              <div className="aspect-[2/1] w-full border-b border-white/10 overflow-hidden bg-[#1a3a24]">
                <PlantMergePreviewArt />
              </div>

              <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <h2 className="text-xs sm:text-lg font-bold text-emerald-100 leading-snug">
                    {ht.plantMergeTitle}
                  </h2>
                  <span className="font-num text-[10px] sm:text-xs font-semibold text-emerald-300 whitespace-nowrap">
                    {ht.plantMergeTag}
                  </span>
                </div>

                <p className="text-[11px] sm:text-sm text-emerald-100/75 leading-snug sm:leading-relaxed mb-2.5 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">
                  {ht.plantMergeDesc}
                </p>

                <div className="flex items-center justify-between gap-1 text-[10.5px] sm:text-xs text-emerald-200/75 mb-2 sm:mb-3 pt-2 sm:pt-2.5 border-t border-white/10">
                  <span className="truncate">{ht.bestScoreLabel}</span>
                  <span className="font-num font-bold text-emerald-300 whitespace-nowrap">
                    {plantMergeStats.bestScore > 0
                      ? `${plantMergeStats.bestScore} · W${plantMergeStats.bestWave}`
                      : '0'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGame('plant-merge')}
                  className="w-full h-9 sm:h-11 rounded-lg bg-gradient-to-b from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 active:scale-[0.99] text-slate-950 font-extrabold text-xs sm:text-base transition-all cursor-pointer"
                >
                  {ht.playBtn}
                </button>
              </div>
            </div>

            {/* Game Card 12: Monster Arena 3D (حلبة الوحوش 3D) */}
            <div className="group rounded-xl sm:rounded-2xl border border-rose-400/60 bg-[#1a1026] hover:border-amber-300/85 transition-colors overflow-hidden shadow-xl flex flex-col">
              <div className="aspect-[2/1] w-full border-b border-white/10 overflow-hidden bg-[#241232]">
                <MonsterArenaPreviewArt />
              </div>

              <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <h2 className="text-xs sm:text-lg font-bold text-amber-100 leading-snug">
                    {ht.monsterArenaTitle}
                  </h2>
                  <span className="font-num text-[10px] sm:text-xs font-semibold text-rose-300 whitespace-nowrap">
                    {ht.monsterArenaTag}
                  </span>
                </div>

                <p className="text-[11px] sm:text-sm text-rose-100/80 leading-snug sm:leading-relaxed mb-2.5 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">
                  {ht.monsterArenaDesc}
                </p>

                <div className="flex items-center justify-between gap-1 text-[10.5px] sm:text-xs text-amber-200/80 mb-2 sm:mb-3 pt-2 sm:pt-2.5 border-t border-white/10">
                  <span className="truncate">{ht.bestScoreLabel}</span>
                  <span className="font-num font-bold text-amber-300 whitespace-nowrap">
                    {monsterArenaStats.bestScore > 0
                      ? `${monsterArenaStats.bestScore} · W${monsterArenaStats.bestWave}`
                      : '0'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGame('monster-arena')}
                  className="w-full h-9 sm:h-11 rounded-lg bg-gradient-to-b from-amber-400 to-rose-500 hover:from-amber-300 hover:to-rose-400 active:scale-[0.99] text-slate-950 font-extrabold text-xs sm:text-base transition-all cursor-pointer"
                >
                  {ht.playBtn}
                </button>
              </div>
            </div>

            {/* Game Card 13: Devil's Gate 2D (بوابة الشيطان 2D) */}
            <div className="group rounded-xl sm:rounded-2xl border border-amber-400/65 bg-[#2a150f] hover:border-yellow-300/90 transition-colors overflow-hidden shadow-xl flex flex-col">
              <div className="aspect-[2/1] w-full border-b border-white/10 overflow-hidden bg-[#381c13]">
                <DevilTrapPreviewArt />
              </div>

              <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <h2 className="text-xs sm:text-lg font-bold text-amber-100 leading-snug">
                    {ht.devilTrapTitle}
                  </h2>
                  <span className="font-num text-[10px] sm:text-xs font-semibold text-amber-300 whitespace-nowrap">
                    {ht.devilTrapTag}
                  </span>
                </div>

                <p className="text-[11px] sm:text-sm text-amber-100/80 leading-snug sm:leading-relaxed mb-2.5 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">
                  {ht.devilTrapDesc}
                </p>

                <div className="flex items-center justify-between gap-1 text-[10.5px] sm:text-xs text-amber-200/80 mb-2 sm:mb-3 pt-2 sm:pt-2.5 border-t border-white/10">
                  <span className="truncate">{ht.progressLabel}</span>
                  <span className="font-num font-bold text-yellow-300 whitespace-nowrap">
                    {devilTrapStats.completedLevelIds.length}/{DEVIL_TRAP_TOTAL_LEVELS}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveGame('devil-trap')}
                  className="w-full h-9 sm:h-11 rounded-lg bg-gradient-to-b from-amber-300 to-orange-500 hover:from-amber-200 hover:to-orange-400 active:scale-[0.99] text-stone-950 font-extrabold text-xs sm:text-base transition-all cursor-pointer"
                >
                  {ht.playBtn}
                </button>
              </div>
            </div>

            {/* Extensible Placeholder Slot for Future Games */}
            <div className="rounded-xl sm:rounded-2xl border border-dashed border-white/14 bg-[#0a1324]/60 p-3 sm:p-6 flex flex-col items-center justify-center text-center min-h-[190px] sm:min-h-[260px]">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl border border-white/12 bg-slate-900/80 flex items-center justify-center text-slate-400 mb-2 sm:mb-3">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <h2 className="text-xs sm:text-base font-bold text-slate-300 mb-1">
                {ht.comingSoonTitle}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 max-w-[220px] leading-snug sm:leading-relaxed">
                {ht.comingSoonDesc}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
