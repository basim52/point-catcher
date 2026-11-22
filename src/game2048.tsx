import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MusicToggleButton, useGameMusic } from './gameMusic';

type MoveDir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew: boolean;
  justMerged: boolean;
}

interface Snapshot {
  tiles: Tile[];
  score: number;
}

export interface Neon2048Stats {
  bestScore: number;
  bestTile: number;
}

export interface Neon2048GameProps {
  lang: 'ar' | 'en';
  sfxEnabled: boolean;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  onExitToHub: () => void;
}

const GRID = 4;
const STATS_KEY = 'point_catcher_neon_2048_stats_v1';
const MAX_UNDO = 10;

export function read2048Stats(): Neon2048Stats {
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return { bestScore: 0, bestTile: 0 };
    const parsed = JSON.parse(raw);
    const bestScore = Number(parsed?.bestScore);
    const bestTile = Number(parsed?.bestTile);
    return {
      bestScore: Number.isFinite(bestScore) && bestScore > 0 ? bestScore : 0,
      bestTile: Number.isFinite(bestTile) && bestTile > 0 ? bestTile : 0,
    };
  } catch {
    return { bestScore: 0, bestTile: 0 };
  }
}

function save2048Stats(stats: Neon2048Stats): void {
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage errors
  }
}

let globalTileUid = 1;
function nextTileId(): number {
  return globalTileUid++;
}

function getEmptyCells(tiles: Tile[]): { row: number; col: number }[] {
  const occupied = new Set(tiles.map((t) => `${t.row},${t.col}`));
  const empty: { row: number; col: number }[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      if (!occupied.has(`${row},${col}`)) {
        empty.push({ row, col });
      }
    }
  }
  return empty;
}

function spawnRandomTile(tiles: Tile[]): Tile | null {
  const empty = getEmptyCells(tiles);
  if (empty.length === 0) return null;
  const pick = empty[Math.floor(Math.random() * empty.length)];
  return {
    id: nextTileId(),
    value: Math.random() < 0.9 ? 2 : 4,
    row: pick.row,
    col: pick.col,
    isNew: true,
    justMerged: false,
  };
}

function createInitialTiles(): Tile[] {
  const first = spawnRandomTile([]);
  if (!first) return [];
  const second = spawnRandomTile([first]);
  return second ? [first, second] : [first];
}

function canAnyMove(tiles: Tile[]): boolean {
  if (tiles.length < GRID * GRID) return true;
  const grid: number[][] = Array.from({ length: GRID }, () =>
    Array(GRID).fill(0)
  );
  for (const t of tiles) {
    grid[t.row][t.col] = t.value;
  }
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const v = grid[r][c];
      if (r + 1 < GRID && grid[r + 1][c] === v) return true;
      if (c + 1 < GRID && grid[r][c + 1] === v) return true;
    }
  }
  return false;
}

function executeMove(
  tiles: Tile[],
  dir: MoveDir
): {
  nextTiles: Tile[];
  scoreGain: number;
  moved: boolean;
  highestMerged: number;
} {
  const grid: (Tile | null)[][] = Array.from({ length: GRID }, () =>
    Array(GRID).fill(null)
  );
  for (const t of tiles) {
    grid[t.row][t.col] = t;
  }

  const nextTiles: Tile[] = [];
  let scoreGain = 0;
  let moved = false;
  let highestMerged = 0;

  for (let lineIdx = 0; lineIdx < GRID; lineIdx++) {
    const line: Tile[] = [];
    for (let step = 0; step < GRID; step++) {
      const r =
        dir === 'UP'
          ? step
          : dir === 'DOWN'
          ? GRID - 1 - step
          : lineIdx;
      const c =
        dir === 'LEFT'
          ? step
          : dir === 'RIGHT'
          ? GRID - 1 - step
          : lineIdx;
      const cell = grid[r][c];
      if (cell) line.push(cell);
    }

    let writeSlot = 0;
    let i = 0;
    while (i < line.length) {
      const targetRow =
        dir === 'UP'
          ? writeSlot
          : dir === 'DOWN'
          ? GRID - 1 - writeSlot
          : lineIdx;
      const targetCol =
        dir === 'LEFT'
          ? writeSlot
          : dir === 'RIGHT'
          ? GRID - 1 - writeSlot
          : lineIdx;

      if (i + 1 < line.length && line[i].value === line[i + 1].value) {
        const mergedValue = line[i].value * 2;
        scoreGain += mergedValue;
        if (mergedValue > highestMerged) highestMerged = mergedValue;
        moved = true;
        nextTiles.push({
          id: line[i].id,
          value: mergedValue,
          row: targetRow,
          col: targetCol,
          isNew: false,
          justMerged: true,
        });
        i += 2;
      } else {
        const src = line[i];
        if (src.row !== targetRow || src.col !== targetCol) {
          moved = true;
        }
        nextTiles.push({
          id: src.id,
          value: src.value,
          row: targetRow,
          col: targetCol,
          isNew: false,
          justMerged: false,
        });
        i += 1;
      }
      writeSlot += 1;
    }
  }

  return { nextTiles, scoreGain, moved, highestMerged };
}

class Neon2048Audio {
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

  public playSlide(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(175, now + 0.055);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  public playMerge(highestVal: number): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const power = Math.max(2, Math.min(12, Math.log2(highestVal)));
    const freq = 280 * Math.pow(1.12, power - 2);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.28, now + 0.09);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playWin2048(): void {
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
    [329.63, 277.18, 220.0, 174.61].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + i * 0.095;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.065, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }
}

function getTileTheme(value: number): {
  bg: string;
  border: string;
  text: string;
  glow: string;
  fontSize: string;
} {
  const fontSize =
    value >= 1024
      ? 'text-lg sm:text-xl'
      : value >= 128
      ? 'text-xl sm:text-2xl'
      : 'text-2xl sm:text-3xl';

  switch (value) {
    case 2:
      return {
        bg: 'bg-[radial-gradient(circle_at_32%_28%,#38bdf8_0%,#153966_48%,#0a1931_100%)]',
        border: 'border-sky-300/45',
        text: 'text-sky-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]',
        glow: 'shadow-[inset_-4px_-6px_12px_rgba(0,0,0,0.55),inset_2px_3px_6px_rgba(186,230,253,0.28),0_4px_14px_rgba(56,189,248,0.22)]',
        fontSize,
      };
    case 4:
      return {
        bg: 'bg-[radial-gradient(circle_at_32%_28%,#67e8f9_0%,#0e6087_48%,#07283d_100%)]',
        border: 'border-cyan-200/55',
        text: 'text-cyan-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]',
        glow: 'shadow-[inset_-4px_-6px_12px_rgba(0,0,0,0.55),inset_2px_3px_6px_rgba(165,243,252,0.34),0_4px_16px_rgba(34,211,238,0.3)]',
        fontSize,
      };
    case 8:
      return {
        bg: 'bg-[radial-gradient(circle_at_32%_28%,#5eead4_0%,#0d9488_50%,#064e4b_100%)]',
        border: 'border-teal-200/65',
        text: 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
        glow: 'shadow-[inset_-4px_-6px_12px_rgba(0,0,0,0.5),inset_2px_3px_6px_rgba(204,251,241,0.38),0_4px_18px_rgba(20,184,166,0.42)]',
        fontSize,
      };
    case 16:
      return {
        bg: 'bg-[radial-gradient(circle_at_32%_28%,#6ee7b7_0%,#059669_50%,#064e3b_100%)]',
        border: 'border-emerald-200/70',
        text: 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
        glow: 'shadow-[inset_-4px_-6px_12px_rgba(0,0,0,0.5),inset_2px_3px_6px_rgba(209,250,229,0.4),0_4px_20px_rgba(16,185,129,0.46)]',
        fontSize,
      };
    case 32:
      return {
        bg: 'bg-[radial-gradient(circle_at_32%_28%,#a5b4fc_0%,#4f46e5_50%,#251e7a_100%)]',
        border: 'border-indigo-200/70',
        text: 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
        glow: 'shadow-[inset_-4px_-6px_12px_rgba(0,0,0,0.5),inset_2px_3px_6px_rgba(224,231,255,0.4),0_4px_20px_rgba(99,102,241,0.5)]',
        fontSize,
      };
    case 64:
      return {
        bg: 'bg-[radial-gradient(circle_at_32%_28%,#c4b5fd_0%,#7c3aed_50%,#3b1078_100%)]',
        border: 'border-violet-200/75',
        text: 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
        glow: 'shadow-[inset_-4px_-6px_12px_rgba(0,0,0,0.5),inset_2px_3px_6px_rgba(237,233,254,0.42),0_4px_22px_rgba(139,92,246,0.55)]',
        fontSize,
      };
    case 128:
      return {
        bg: 'bg-[radial-gradient(circle_at_32%_28%,#f0abfc_0%,#c026d3_50%,#580c68_100%)]',
        border: 'border-fuchsia-200/80',
        text: 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
        glow: 'shadow-[inset_-4px_-6px_12px_rgba(0,0,0,0.5),inset_2px_3px_6px_rgba(250,232,255,0.44),0_4px_24px_rgba(217,70,239,0.6)]',
        fontSize,
      };
    case 256:
      return {
        bg: 'bg-[radial-gradient(circle_at_32%_28%,#fda4af_0%,#e11d48_50%,#6d0a27_100%)]',
        border: 'border-rose-200/80',
        text: 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
        glow: 'shadow-[inset_-4px_-6px_12px_rgba(0,0,0,0.5),inset_2px_3px_6px_rgba(255,228,230,0.44),0_4px_24px_rgba(244,63,94,0.62)]',
        fontSize,
      };
    case 512:
      return {
        bg: 'bg-[radial-gradient(circle_at_32%_28%,#fdba74_0%,#ea580c_50%,#7c1d06_100%)]',
        border: 'border-orange-200/85',
        text: 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
        glow: 'shadow-[inset_-4px_-6px_12px_rgba(0,0,0,0.5),inset_2px_3px_6px_rgba(255,237,213,0.46),0_4px_26px_rgba(249,115,22,0.65)]',
        fontSize,
      };
    case 1024:
      return {
        bg: 'bg-[radial-gradient(circle_at_32%_28%,#fef08a_0%,#f59e0b_52%,#92400e_100%)]',
        border: 'border-amber-100/90',
        text: 'text-slate-950',
        glow: 'shadow-[inset_-4px_-6px_12px_rgba(120,53,15,0.45),inset_2px_3px_6px_rgba(255,255,255,0.55),0_4px_28px_rgba(245,158,11,0.7)]',
        fontSize,
      };
    case 2048:
      return {
        bg: 'bg-[radial-gradient(circle_at_32%_28%,#ffffff_0%,#fde047_38%,#eab308_72%,#a16207_100%)]',
        border: 'border-yellow-50',
        text: 'text-slate-950',
        glow: 'shadow-[inset_-4px_-6px_12px_rgba(133,77,14,0.45),inset_2px_3px_8px_rgba(255,255,255,0.7),0_0_32px_rgba(250,204,21,0.85)]',
        fontSize,
      };
    default:
      return {
        bg: 'bg-[radial-gradient(circle_at_32%_28%,#ffffff_0%,#67e8f9_32%,#d946ef_68%,#581c87_100%)]',
        border: 'border-white',
        text: 'text-slate-950',
        glow: 'shadow-[inset_-4px_-6px_12px_rgba(59,7,100,0.45),inset_2px_3px_8px_rgba(255,255,255,0.75),0_0_34px_rgba(232,121,249,0.88)]',
        fontSize,
      };
  }
}

const COPY_2048 = {
  ar: {
    exitBtn: 'خروج',
    title: 'تحدي 2048 النيون',
    hintLine:
      'اسحب في أي اتجاه أو استخدم الأسهم لدمج الكرات المتشابهة والوصول إلى كرة 2048!',
    scoreLabel: 'النقاط',
    bestLabel: 'الأعلى',
    maxTileLabel: 'أكبر كرة',
    undoBtn: 'تراجع',
    newGameBtn: 'لعبة جديدة',
    winTitle: 'مبروك! وصلت إلى كرة 2048',
    winSub: 'يمكنك الاستمرار باللعب لمطاردة كرة 4096 وتحطيم رقمك القياسي.',
    keepPlayingBtn: 'استمر باللعب',
    gameOverTitle: 'انتهت الحركات!',
    gameOverSub: (score: number, maxTile: number) =>
      `النقاط: ${score} · أكبر كرة وصلت لها: ${maxTile}`,
    tryAgainBtn: 'العب مجدداً',
  },
  en: {
    exitBtn: 'Exit',
    title: 'Neon 2048',
    hintLine:
      'Swipe or use arrow keys / WASD to merge matching neon balls and reach 2048!',
    scoreLabel: 'Score',
    bestLabel: 'Best',
    maxTileLabel: 'Top Ball',
    undoBtn: 'Undo',
    newGameBtn: 'New Game',
    winTitle: 'You Reached 2048!',
    winSub: 'Keep going to chase the 4096 ball and set a new high score.',
    keepPlayingBtn: 'Keep Playing',
    gameOverTitle: 'No Moves Left!',
    gameOverSub: (score: number, maxTile: number) =>
      `Score: ${score} · Highest ball: ${maxTile}`,
    tryAgainBtn: 'Play Again',
  },
} as const;

export function Neon2048PreviewArt() {
  const sampleBalls = [
    { v: '2', hi: '#7dd3fc', mid: '#153966', lo: '#09152a', stroke: '#38bdf8', text: '#e0f2fe' },
    { v: '16', hi: '#6ee7b7', mid: '#059669', lo: '#064e3b', stroke: '#6ee7b7', text: '#ffffff' },
    { v: '64', hi: '#c4b5fd', mid: '#7c3aed', lo: '#3b1078', stroke: '#c4b5fd', text: '#ffffff' },
    { v: '256', hi: '#fda4af', mid: '#e11d48', lo: '#6d0a27', stroke: '#fda4af', text: '#ffffff' },
    { v: '8', hi: '#5eead4', mid: '#0d9488', lo: '#064e4b', stroke: '#5eead4', text: '#ffffff' },
    { v: '128', hi: '#f0abfc', mid: '#c026d3', lo: '#580c68', stroke: '#f0abfc', text: '#ffffff' },
    { v: '512', hi: '#fdba74', mid: '#ea580c', lo: '#7c1d06', stroke: '#fdba74', text: '#ffffff' },
    { v: '2048', hi: '#ffffff', mid: '#facc15', lo: '#a16207', stroke: '#fef9c3', text: '#0f172a' },
  ];

  return (
    <svg
      viewBox="0 0 260 130"
      className="w-full h-full block"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        {sampleBalls.map((ball) => (
          <radialGradient
            key={ball.v}
            id={`n2048-ball-${ball.v}`}
            cx="32%"
            cy="28%"
            r="72%"
          >
            <stop offset="0%" stopColor={ball.hi} />
            <stop offset="48%" stopColor={ball.mid} />
            <stop offset="100%" stopColor={ball.lo} />
          </radialGradient>
        ))}
      </defs>

      <rect width="260" height="130" fill="#071123" />
      <circle cx="198" cy="90" r="62" fill="#facc15" opacity="0.14" />
      <circle cx="64" cy="40" r="56" fill="#38bdf8" opacity="0.13" />

      <g transform="translate(26, 15)">
        {sampleBalls.map((ball, idx) => {
          const col = idx % 4;
          const row = Math.floor(idx / 4);
          const cx = col * 53 + 24;
          const cy = row * 51 + 24;
          return (
            <g key={ball.v}>
              <circle
                cx={cx}
                cy={cy}
                r="22.5"
                fill="#040a16"
                stroke="#ffffff"
                strokeOpacity="0.06"
                strokeWidth="1"
              />
              <circle
                cx={cx}
                cy={cy}
                r="20.5"
                fill={`url(#n2048-ball-${ball.v})`}
                stroke={ball.stroke}
                strokeWidth={ball.v === '2048' ? '1.8' : '1.2'}
              />
              <ellipse
                cx={cx - 6.5}
                cy={cy - 8.5}
                rx="6.2"
                ry="3.1"
                transform={`rotate(-26 ${cx - 6.5} ${cy - 8.5})`}
                fill="#ffffff"
                opacity="0.34"
              />
              <text
                x={cx}
                y={cy + 5}
                textAnchor="middle"
                fill={ball.text}
                fontSize={
                  ball.v.length >= 4 ? '11.5' : ball.v.length === 3 ? '13' : '15'
                }
                fontWeight="800"
                fontFamily="system-ui, sans-serif"
              >
                {ball.v}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export const Neon2048Game: React.FC<Neon2048GameProps> = ({
  lang,
  sfxEnabled,
  musicEnabled,
  onToggleMusic,
  onExitToHub,
}) => {
  const t = COPY_2048[lang];
  const audioRef = useRef<Neon2048Audio>(new Neon2048Audio());

  const [tiles, setTiles] = useState<Tile[]>(() => createInitialTiles());
  const [score, setScore] = useState<number>(0);
  const [stats, setStats] = useState<Neon2048Stats>(() => read2048Stats());
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [winBannerVisible, setWinBannerVisible] = useState<boolean>(false);
  const [hasReached2048, setHasReached2048] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [lastGain, setLastGain] = useState<{ id: number; amount: number } | null>(
    null
  );

  useGameMusic('neon-2048', musicEnabled && !gameOver);

  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const gainCounterRef = useRef<number>(1);

  useEffect(() => {
    audioRef.current.enabled = sfxEnabled;
  }, [sfxEnabled]);

  const currentMaxTile = useMemo(
    () => tiles.reduce((max, tile) => Math.max(max, tile.value), 0),
    [tiles]
  );

  const startNewGame = useCallback(() => {
    setTiles(createInitialTiles());
    setScore(0);
    setHistory([]);
    setWinBannerVisible(false);
    setHasReached2048(false);
    setGameOver(false);
    setLastGain(null);
  }, []);

  const performMove = useCallback(
    (dir: MoveDir) => {
      if (gameOver || winBannerVisible) return;

      const { nextTiles, scoreGain, moved, highestMerged } = executeMove(
        tiles,
        dir
      );
      if (!moved) return;

      setHistory((prev) => [
        ...prev.slice(-(MAX_UNDO - 1)),
        {
          tiles: tiles.map((tile) => ({
            ...tile,
            isNew: false,
            justMerged: false,
          })),
          score,
        },
      ]);

      const spawned = spawnRandomTile(nextTiles);
      const finalTiles = spawned ? [...nextTiles, spawned] : nextTiles;
      const nextScore = score + scoreGain;
      const nextMaxTile = finalTiles.reduce(
        (m, tile) => Math.max(m, tile.value),
        0
      );

      setTiles(finalTiles);
      setScore(nextScore);

      if (scoreGain > 0) {
        setLastGain({ id: gainCounterRef.current++, amount: scoreGain });
      }

      setStats((prev) => {
        const updatedBestScore = Math.max(prev.bestScore, nextScore);
        const updatedBestTile = Math.max(prev.bestTile, nextMaxTile);
        if (
          updatedBestScore !== prev.bestScore ||
          updatedBestTile !== prev.bestTile
        ) {
          const nextStats = {
            bestScore: updatedBestScore,
            bestTile: updatedBestTile,
          };
          save2048Stats(nextStats);
          return nextStats;
        }
        return prev;
      });

      if (!hasReached2048 && nextMaxTile >= 2048) {
        setHasReached2048(true);
        setWinBannerVisible(true);
        audioRef.current.playWin2048();
      } else if (!canAnyMove(finalTiles)) {
        setGameOver(true);
        audioRef.current.playGameOver();
      } else if (highestMerged > 0) {
        audioRef.current.playMerge(highestMerged);
      } else {
        audioRef.current.playSlide();
      }
    },
    [gameOver, hasReached2048, score, tiles, winBannerVisible]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setTiles(prev.tiles);
    setScore(prev.score);
    setGameOver(false);
    setWinBannerVisible(false);
  }, [history]);

  // Keyboard controls (Arrows + WASD + Escape back to Games Hub)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onExitToHub();
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        performMove('UP');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        performMove('DOWN');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        performMove('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        performMove('RIGHT');
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onExitToHub, performMove]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeStartRef.current) return;
    const dx = e.clientX - swipeStartRef.current.x;
    const dy = e.clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 26) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      performMove(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      performMove(dy > 0 ? 'DOWN' : 'UP');
    }
  };

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 bg-[#060c18] text-slate-100 flex flex-col overflow-hidden select-none"
    >
      {/* Top Bar with Dedicated Corner Exit Button */}
      <header className="w-full border-b border-white/10 bg-[#0a1324]/95 shrink-0">
        <div className="mx-auto max-w-[960px] h-14 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-3">
          {/* Corner Exit Button back to Games Hub */}
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

          {/* Center Game Title */}
          <h1 className="text-sm sm:text-lg font-bold text-white whitespace-nowrap truncate">
            {t.title}
          </h1>

          {/* Live Inline Score & Best */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm shrink-0">
            <div className="relative whitespace-nowrap">
              <span className="text-slate-400">{t.scoreLabel}: </span>
              <span className="font-num font-bold text-white">{score}</span>
              {lastGain && (
                <span
                  key={lastGain.id}
                  className="ms-1 font-num text-[11px] font-bold text-emerald-300"
                >
                  +{lastGain.amount}
                </span>
              )}
            </div>
            <div className="whitespace-nowrap">
              <span className="text-slate-400">{t.bestLabel}: </span>
              <span className="font-num font-bold text-amber-300">
                {stats.bestScore}
              </span>
            </div>
            <div className="hidden md:block whitespace-nowrap">
              <span className="text-slate-400">{t.maxTileLabel}: </span>
              <span className="font-num font-bold text-cyan-300">
                {Math.max(currentMaxTile, stats.bestTile)}
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

      {/* Main 2048 Stage */}
      <main className="relative flex-1 min-h-0 flex flex-col items-center justify-center px-3 sm:px-6 py-3 gap-3 overflow-y-auto">
        <p className="text-center text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
          {t.hintLine}
        </p>

        {/* 4x4 Glowing Neon Board */}
        <div
          dir="ltr"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            swipeStartRef.current = null;
          }}
          className="relative w-full max-w-[390px] sm:max-w-[410px] aspect-square rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-[#0d192f] to-[#071021] p-2.5 sm:p-3 shadow-[0_0_40px_rgba(6,182,212,0.12)] touch-none overflow-hidden"
        >
          {/* Recessed 4x4 Circular Sockets */}
          <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-2 sm:gap-2.5">
            {Array.from({ length: GRID * GRID }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-full bg-slate-950/85 border border-white/[0.06] shadow-[inset_0_4px_10px_rgba(0,0,0,0.75)]"
              />
            ))}
          </div>

          {/* Animated Sliding Neon Spheres Layer */}
          <div className="absolute inset-2.5 sm:inset-3 pointer-events-none">
            {tiles.map((tile) => {
              const theme = getTileTheme(tile.value);
              return (
                <div
                  key={tile.id}
                  style={{
                    width: '25%',
                    height: '25%',
                    transform: `translate3d(${tile.col * 100}%, ${
                      tile.row * 100
                    }%, 0)`,
                    transition:
                      'transform 125ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                  className="absolute top-0 left-0 p-1 sm:p-1.5"
                >
                  <div
                    className={`relative w-full h-full rounded-full border flex items-center justify-center font-num font-extrabold tracking-tight overflow-hidden transition-transform duration-150 ${
                      theme.bg
                    } ${theme.border} ${theme.text} ${theme.glow} ${
                      theme.fontSize
                    } ${tile.justMerged ? 'scale-[1.08]' : 'scale-100'}`}
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-[11%] left-[19%] w-[36%] h-[19%] rounded-full bg-white/35 blur-[1px] -rotate-[24deg]"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-[21%] left-[16%] w-[9%] h-[9%] rounded-full bg-white/60"
                    />
                    <span className="relative z-10 leading-none">
                      {tile.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reached 2048 Victory Overlay */}
          {winBannerVisible && (
            <div
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              className="absolute inset-0 z-10 flex items-center justify-center p-5 bg-[#050b16]/86 backdrop-blur-[3px]"
            >
              <div className="w-full max-w-xs text-center">
                <div className="relative w-18 h-18 mx-auto mb-3 rounded-full bg-[radial-gradient(circle_at_32%_28%,#ffffff_0%,#fde047_38%,#eab308_72%,#a16207_100%)] border border-yellow-100 flex items-center justify-center font-num font-extrabold text-slate-950 text-lg shadow-[inset_-4px_-6px_12px_rgba(133,77,14,0.45),0_0_30px_rgba(250,204,21,0.75)] overflow-hidden">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-[12%] left-[20%] w-[34%] h-[18%] rounded-full bg-white/45 blur-[1px] -rotate-[24deg]"
                  />
                  <span className="relative z-10 leading-none">2048</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5">
                  {t.winTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
                  {t.winSub}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setWinBannerVisible(false)}
                    className="w-full sm:w-auto min-w-[140px] px-5 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {t.keepPlayingBtn}
                  </button>
                  <button
                    type="button"
                    onClick={startNewGame}
                    className="w-full sm:w-auto px-5 py-3 rounded-lg border border-white/15 bg-slate-800/85 hover:bg-slate-700 text-slate-100 font-semibold text-sm transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {t.newGameBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameOver && (
            <div
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              className="absolute inset-0 z-10 flex items-center justify-center p-5 bg-[#050b16]/88 backdrop-blur-[3px]"
            >
              <div className="w-full max-w-xs text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5">
                  {t.gameOverTitle}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-amber-300 mb-5">
                  {t.gameOverSub(score, currentMaxTile)}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={startNewGame}
                    className="w-full sm:w-auto min-w-[150px] px-6 py-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm sm:text-base transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {t.tryAgainBtn}
                  </button>
                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="w-full sm:w-auto px-5 py-3 rounded-lg border border-white/15 bg-slate-800/85 hover:bg-slate-700 text-slate-100 font-semibold text-sm transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {t.undoBtn}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls Bar: Undo & New Game + Large Cross D-Pad */}
        <div className="w-full max-w-[410px] flex items-center justify-between gap-3 shrink-0 pt-0.5">
          <div className="flex flex-col gap-2 shrink-0 min-w-[104px] sm:min-w-[120px]">
            <button
              type="button"
              disabled={history.length === 0}
              onClick={handleUndo}
              className={`h-12 px-3.5 rounded-xl border text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                history.length === 0
                  ? 'border-white/5 bg-slate-900/50 text-slate-500 cursor-not-allowed'
                  : 'border-white/15 bg-slate-900/90 hover:bg-slate-800 text-slate-100 cursor-pointer'
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
              onClick={startNewGame}
              className="h-12 px-3.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
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
              <span>{t.newGameBtn}</span>
            </button>
          </div>

          {/* Large Cross D-Pad: Up on Top, Down on Bottom, Left on Left, Right on Right */}
          <div
            dir="ltr"
            className="grid grid-cols-3 grid-rows-3 gap-1.5 sm:gap-2 mx-auto touch-manipulation"
          >
            <div aria-hidden="true" />
            <button
              type="button"
              aria-label="Up"
              onPointerDown={(e) => {
                e.preventDefault();
                performMove('UP');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  performMove('UP');
                }
              }}
              className="w-15 h-13 sm:w-16 sm:h-14 rounded-xl border border-cyan-400/30 bg-slate-900/95 hover:bg-slate-800 active:bg-cyan-500/30 active:scale-95 text-cyan-100 shadow-md inline-flex items-center justify-center transition-all cursor-pointer touch-manipulation"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>
            <div aria-hidden="true" />

            <button
              type="button"
              aria-label="Left"
              onPointerDown={(e) => {
                e.preventDefault();
                performMove('LEFT');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  performMove('LEFT');
                }
              }}
              className="w-15 h-13 sm:w-16 sm:h-14 rounded-xl border border-cyan-400/30 bg-slate-900/95 hover:bg-slate-800 active:bg-cyan-500/30 active:scale-95 text-cyan-100 shadow-md inline-flex items-center justify-center transition-all cursor-pointer touch-manipulation"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div
              aria-hidden="true"
              className="w-15 h-13 sm:w-16 sm:h-14 rounded-xl bg-slate-950/70 border border-white/[0.06] flex items-center justify-center"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/35" />
            </div>

            <button
              type="button"
              aria-label="Right"
              onPointerDown={(e) => {
                e.preventDefault();
                performMove('RIGHT');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  performMove('RIGHT');
                }
              }}
              className="w-15 h-13 sm:w-16 sm:h-14 rounded-xl border border-cyan-400/30 bg-slate-900/95 hover:bg-slate-800 active:bg-cyan-500/30 active:scale-95 text-cyan-100 shadow-md inline-flex items-center justify-center transition-all cursor-pointer touch-manipulation"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <div aria-hidden="true" />
            <button
              type="button"
              aria-label="Down"
              onPointerDown={(e) => {
                e.preventDefault();
                performMove('DOWN');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  performMove('DOWN');
                }
              }}
              className="w-15 h-13 sm:w-16 sm:h-14 rounded-xl border border-cyan-400/30 bg-slate-900/95 hover:bg-slate-800 active:bg-cyan-500/30 active:scale-95 text-cyan-100 shadow-md inline-flex items-center justify-center transition-all cursor-pointer touch-manipulation"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div aria-hidden="true" />
          </div>
        </div>
      </main>
    </div>
  );
};
