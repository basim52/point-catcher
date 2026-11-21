import React, { useCallback, useEffect, useRef, useState } from 'react';

type SnakeDir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type WallMode = 'walls' | 'wrap';
type SpeedTier = 'slow' | 'normal' | 'fast';
type GamePhase = 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
type ProduceKind =
  | 'apple'
  | 'carrot'
  | 'strawberry'
  | 'broccoli'
  | 'watermelon'
  | 'eggplant'
  | 'corn'
  | 'cherry';

interface Cell {
  x: number;
  y: number;
}

interface FoodItem extends Cell {
  kind: ProduceKind;
}

interface BonusFood {
  x: number;
  y: number;
  spawnedAt: number;
  expiresAt: number;
}

const PRODUCE_LIST: { kind: ProduceKind; burstColor: string; glowColor: string }[] = [
  { kind: 'apple', burstColor: '#fb7185', glowColor: '#f43f5e' },
  { kind: 'carrot', burstColor: '#fb923c', glowColor: '#f97316' },
  { kind: 'strawberry', burstColor: '#f43f5e', glowColor: '#e11d48' },
  { kind: 'broccoli', burstColor: '#4ade80', glowColor: '#22c55e' },
  { kind: 'watermelon', burstColor: '#fb7185', glowColor: '#10b981' },
  { kind: 'eggplant', burstColor: '#c084fc', glowColor: '#a855f7' },
  { kind: 'corn', burstColor: '#fde047', glowColor: '#eab308' },
  { kind: 'cherry', burstColor: '#f43f5e', glowColor: '#fb7185' },
];

function randomProduceKind(exclude?: ProduceKind): ProduceKind {
  const pool = exclude
    ? PRODUCE_LIST.filter((p) => p.kind !== exclude)
    : PRODUCE_LIST;
  return pool[Math.floor(Math.random() * pool.length)].kind;
}

function getProduceMeta(kind: ProduceKind) {
  return PRODUCE_LIST.find((p) => p.kind === kind) ?? PRODUCE_LIST[0];
}

function drawProduceItem(
  ctx: CanvasRenderingContext2D,
  kind: ProduceKind,
  cx: number,
  cy: number,
  size: number
): void {
  const meta = getProduceMeta(kind);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = meta.glowColor;
  ctx.shadowBlur = 14;

  switch (kind) {
    case 'apple': {
      // Glossy red apple body
      const grad = ctx.createRadialGradient(-size * 0.25, -size * 0.25, 1, 0, 0, size);
      grad.addColorStop(0, '#fda4af');
      grad.addColorStop(0.45, '#ef4444');
      grad.addColorStop(1, '#991b1b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(-size * 0.22, size * 0.08, size * 0.62, 0, Math.PI * 2);
      ctx.arc(size * 0.22, size * 0.08, size * 0.62, 0, Math.PI * 2);
      ctx.fill();
      // Stem
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.42);
      ctx.quadraticCurveTo(size * 0.1, -size * 0.78, size * 0.25, -size * 0.85);
      ctx.stroke();
      // Green leaf
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(size * 0.34, -size * 0.62, size * 0.32, size * 0.16, -0.45, 0, Math.PI * 2);
      ctx.fill();
      // Specular highlight
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.ellipse(-size * 0.32, -size * 0.12, size * 0.18, size * 0.1, -0.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'carrot': {
      ctx.rotate(-0.45);
      // Leafy green crown
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(-size * 0.2, -size * 0.72, size * 0.18, size * 0.34, -0.4, 0, Math.PI * 2);
      ctx.ellipse(0, -size * 0.78, size * 0.18, size * 0.36, 0, 0, Math.PI * 2);
      ctx.ellipse(size * 0.2, -size * 0.72, size * 0.18, size * 0.34, 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Orange tapered carrot body
      const grad = ctx.createLinearGradient(-size * 0.45, -size * 0.45, size * 0.45, size * 0.75);
      grad.addColorStop(0, '#fdba74');
      grad.addColorStop(0.5, '#f97316');
      grad.addColorStop(1, '#c2410c');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-size * 0.46, -size * 0.42);
      ctx.quadraticCurveTo(0, -size * 0.62, size * 0.46, -size * 0.42);
      ctx.lineTo(0, size * 0.92);
      ctx.closePath();
      ctx.fill();
      // Subtle ridges
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(124,45,18,0.55)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-size * 0.22, -size * 0.12);
      ctx.lineTo(size * 0.12, -size * 0.12);
      ctx.moveTo(-size * 0.12, size * 0.22);
      ctx.lineTo(size * 0.16, size * 0.22);
      ctx.stroke();
      break;
    }

    case 'strawberry': {
      const grad = ctx.createRadialGradient(-size * 0.2, -size * 0.2, 1, 0, 0, size);
      grad.addColorStop(0, '#fda4af');
      grad.addColorStop(0.45, '#f43f5e');
      grad.addColorStop(1, '#9f1239');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, size * 0.88);
      ctx.bezierCurveTo(-size * 0.85, size * 0.25, -size * 0.82, -size * 0.55, 0, -size * 0.52);
      ctx.bezierCurveTo(size * 0.82, -size * 0.55, size * 0.85, size * 0.25, 0, size * 0.88);
      ctx.fill();
      // Leafy crown
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.moveTo(-size * 0.46, -size * 0.48);
      ctx.lineTo(0, -size * 0.24);
      ctx.lineTo(size * 0.46, -size * 0.48);
      ctx.lineTo(size * 0.18, -size * 0.68);
      ctx.lineTo(0, -size * 0.5);
      ctx.lineTo(-size * 0.18, -size * 0.68);
      ctx.closePath();
      ctx.fill();
      // Golden seeds
      ctx.fillStyle = '#fef08a';
      const seeds = [
        [-0.25, -0.05],
        [0.25, -0.05],
        [0, 0.16],
        [-0.18, 0.36],
        [0.18, 0.36],
      ];
      for (const [sx, sy] of seeds) {
        ctx.beginPath();
        ctx.arc(sx * size, sy * size, 1.35, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'broccoli': {
      // Stalk
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.roundRect(-size * 0.24, size * 0.08, size * 0.48, size * 0.72, 4);
      ctx.fill();
      // Fluffy green crown florets
      const grad = ctx.createRadialGradient(-size * 0.15, -size * 0.35, 1, 0, -size * 0.2, size * 0.85);
      grad.addColorStop(0, '#86efac');
      grad.addColorStop(0.55, '#22c55e');
      grad.addColorStop(1, '#14532d');
      ctx.fillStyle = grad;
      const puffs = [
        [-0.42, -0.18, 0.4],
        [0.42, -0.18, 0.4],
        [0, -0.42, 0.46],
        [-0.22, -0.34, 0.38],
        [0.22, -0.34, 0.38],
      ];
      for (const [px, py, pr] of puffs) {
        ctx.beginPath();
        ctx.arc(px * size, py * size, pr * size, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'watermelon': {
      ctx.rotate(-0.2);
      // Outer emerald rind arc
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(0, -size * 0.15, size * 0.88, 0.12 * Math.PI, 0.88 * Math.PI);
      ctx.lineTo(0, -size * 0.58);
      ctx.closePath();
      ctx.fill();
      // Thin white pith + juicy coral-red wedge
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, -size * 0.15, size * 0.68, 0.14 * Math.PI, 0.86 * Math.PI);
      ctx.lineTo(0, -size * 0.52);
      ctx.closePath();
      ctx.fill();
      // Seeds
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0f172a';
      [
        [-0.24, 0.22],
        [0, 0.28],
        [0.24, 0.22],
        [0, -0.02],
      ].forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.ellipse(sx * size, sy * size, 1.4, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'eggplant': {
      ctx.rotate(0.42);
      const grad = ctx.createRadialGradient(-size * 0.2, 0, 1, 0, size * 0.1, size);
      grad.addColorStop(0, '#e879f9');
      grad.addColorStop(0.5, '#9333ea');
      grad.addColorStop(1, '#3b0764');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, size * 0.14, size * 0.52, size * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      // Green calyx cap
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.moveTo(-size * 0.36, -size * 0.42);
      ctx.quadraticCurveTo(0, -size * 0.72, size * 0.36, -size * 0.42);
      ctx.lineTo(0, -size * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.58);
      ctx.lineTo(size * 0.14, -size * 0.86);
      ctx.stroke();
      // Glossy highlight
      ctx.fillStyle = 'rgba(255,255,255,0.36)';
      ctx.beginPath();
      ctx.ellipse(-size * 0.22, size * 0.08, size * 0.13, size * 0.32, -0.15, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'corn': {
      ctx.rotate(-0.35);
      // Golden cob
      const grad = ctx.createLinearGradient(-size * 0.4, -size * 0.6, size * 0.4, size * 0.6);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#facc15');
      grad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.1, size * 0.4, size * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      // Kernel dots
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(161, 98, 7, 0.48)';
      for (let ry = -0.45; ry <= 0.25; ry += 0.24) {
        for (let rx = -0.16; rx <= 0.17; rx += 0.16) {
          ctx.beginPath();
          ctx.arc(rx * size, ry * size, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Green husks wrapping base
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(-size * 0.3, size * 0.34, size * 0.24, size * 0.52, -0.42, 0, Math.PI * 2);
      ctx.ellipse(size * 0.3, size * 0.34, size * 0.24, size * 0.52, 0.42, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'cherry': {
      // Twin arched stems
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-size * 0.36, size * 0.18);
      ctx.quadraticCurveTo(-size * 0.22, -size * 0.55, size * 0.12, -size * 0.75);
      ctx.moveTo(size * 0.36, size * 0.28);
      ctx.quadraticCurveTo(size * 0.28, -size * 0.42, size * 0.12, -size * 0.75);
      ctx.stroke();
      // Small leaf
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(size * 0.32, -size * 0.62, size * 0.24, size * 0.12, 0.35, 0, Math.PI * 2);
      ctx.fill();
      // Twin glossy cherries
      ctx.shadowColor = meta.glowColor;
      ctx.shadowBlur = 12;
      [
        [-0.36, 0.32],
        [0.36, 0.42],
      ].forEach(([cxOff, cyOff]) => {
        const g = ctx.createRadialGradient(
          cxOff * size - 2.5,
          cyOff * size - 2.5,
          1,
          cxOff * size,
          cyOff * size,
          size * 0.42
        );
        g.addColorStop(0, '#fda4af');
        g.addColorStop(0.5, '#e11d48');
        g.addColorStop(1, '#881337');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cxOff * size, cyOff * size, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
  }

  ctx.restore();
}

function drawGoldenPineapple(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  ctx.save();
  ctx.translate(cx, cy);

  // Leafy emerald-gold crown
  ctx.shadowColor = '#4ade80';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.96);
  ctx.lineTo(-size * 0.2, -size * 0.38);
  ctx.lineTo(size * 0.2, -size * 0.38);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-size * 0.44, -size * 0.76);
  ctx.lineTo(-size * 0.14, -size * 0.35);
  ctx.lineTo(-size * 0.34, -size * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.44, -size * 0.76);
  ctx.lineTo(size * 0.14, -size * 0.35);
  ctx.lineTo(size * 0.34, -size * 0.34);
  ctx.closePath();
  ctx.fill();

  // Radiant golden pineapple body
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 20;
  const grad = ctx.createRadialGradient(-size * 0.22, -size * 0.1, 1.5, 0, size * 0.14, size * 0.78);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.4, '#fde047');
  grad.addColorStop(0.8, '#f59e0b');
  grad.addColorStop(1, '#92400e');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.18, size * 0.52, size * 0.64, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle crosshatch diamond lines
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(146, 64, 14, 0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-size * 0.32, -size * 0.1);
  ctx.lineTo(size * 0.28, size * 0.48);
  ctx.moveTo(size * 0.32, -size * 0.1);
  ctx.lineTo(-size * 0.28, size * 0.48);
  ctx.stroke();

  ctx.restore();
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
}

interface FloatingScore {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface NeonSnakeStats {
  bestScore: number;
  bestLength: number;
}

export interface NeonSnakeGameProps {
  lang: 'ar' | 'en';
  sfxEnabled: boolean;
  onExitToHub: () => void;
}

const GRID_X = 26;
const GRID_Y = 16;
const CELL_PX = 30;
const CANVAS_W = GRID_X * CELL_PX;
const CANVAS_H = GRID_Y * CELL_PX;
const STATS_KEY = 'point_catcher_neon_snake_stats_v1';

const BASE_STEP_MS: Record<SpeedTier, number> = {
  slow: 155,
  normal: 118,
  fast: 86,
};

const DIR_VEC: Record<SnakeDir, Cell> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const OPPOSITE_DIR: Record<SnakeDir, SnakeDir> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

export function readSnakeStats(): NeonSnakeStats {
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return { bestScore: 0, bestLength: 0 };
    const parsed = JSON.parse(raw);
    const bestScore = Number(parsed?.bestScore);
    const bestLength = Number(parsed?.bestLength);
    return {
      bestScore: Number.isFinite(bestScore) && bestScore > 0 ? bestScore : 0,
      bestLength: Number.isFinite(bestLength) && bestLength > 0 ? bestLength : 0,
    };
  } catch {
    return { bestScore: 0, bestLength: 0 };
  }
}

function saveSnakeStats(stats: NeonSnakeStats): void {
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors
  }
}

function createInitialSnake(): Cell[] {
  const cy = Math.floor(GRID_Y / 2);
  const cx = Math.floor(GRID_X / 2);
  return [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
    { x: cx - 3, y: cy },
  ];
}

function spawnFreeCell(occupied: Cell[]): Cell {
  const blocked = new Set(occupied.map((c) => `${c.x},${c.y}`));
  const candidates: Cell[] = [];
  for (let y = 0; y < GRID_Y; y++) {
    for (let x = 0; x < GRID_X; x++) {
      if (!blocked.has(`${x},${y}`)) {
        candidates.push({ x, y });
      }
    }
  }
  if (candidates.length === 0) return { x: 0, y: 0 };
  return candidates[Math.floor(Math.random() * candidates.length)];
}

class NeonSnakeAudio {
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

  public playEat(combo: number): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const base = 390 * Math.pow(1.06, Math.min(combo, 10));
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.45, now + 0.085);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playBonusEat(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.055;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  public playTurn(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.028);
    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  public playCrash(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [280, 210, 150, 105].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + idx * 0.075;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  }
}

const COPY_SNAKE = {
  ar: {
    exitBtn: 'خروج',
    title: 'ثعبان النيون',
    scoreLabel: 'النقاط',
    bestLabel: 'الأعلى',
    lengthLabel: 'الطول',
    wallsMode: 'بجدران',
    wrapMode: 'بدون جدران',
    slowSpeed: 'بطيء',
    normalSpeed: 'عادي',
    fastSpeed: 'سريع',
    startTitle: 'ثعبان النيون',
    startSub:
      'التهم الفواكه والخضار المتوهجة لتنمو وتضاعف نقاطك، والتقط الأناناس الذهبي لمضاعفة ×2!',
    startBtn: 'ابدأ اللعب',
    pausedTitle: 'إيقاف مؤقت',
    resumeBtn: 'استمرار',
    pauseBtn: 'إيقاف',
    restartBtn: 'إعادة',
    gameOverTitle: 'انتهت الجولة!',
    gameOverSub: (score: number, length: number) =>
      `النقاط: ${score} · الطول النهائي: ${length}`,
    playAgainBtn: 'العب مجدداً',
    boostActive: 'مضاعفة ×2',
    controlsHint: 'الأسهم أو WASD أو السحب على الشاشة للتوجيه',
  },
  en: {
    exitBtn: 'Exit',
    title: 'Neon Snake',
    scoreLabel: 'Score',
    bestLabel: 'Best',
    lengthLabel: 'Length',
    wallsMode: 'Walls',
    wrapMode: 'No Walls',
    slowSpeed: 'Slow',
    normalSpeed: 'Normal',
    fastSpeed: 'Fast',
    startTitle: 'Neon Snake',
    startSub:
      'Eat glowing fruits & veggies to grow longer and catch the Golden Pineapple for +50 & 2x boost!',
    startBtn: 'Start Game',
    pausedTitle: 'Paused',
    resumeBtn: 'Resume',
    pauseBtn: 'Pause',
    restartBtn: 'Restart',
    gameOverTitle: 'Game Over!',
    gameOverSub: (score: number, length: number) =>
      `Score: ${score} · Final length: ${length}`,
    playAgainBtn: 'Play Again',
    boostActive: '2x Boost',
    controlsHint: 'Use Arrow keys, WASD, or swipe on the board to steer',
  },
} as const;

export function NeonSnakePreviewArt() {
  return (
    <svg
      viewBox="0 0 260 130"
      className="w-full h-full block"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="snake-body-grad" x1="20" y1="90" x2="180" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="55%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#6ee7b7" />
        </linearGradient>
        <radialGradient id="snake-apple-grad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="52%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </radialGradient>
        <linearGradient id="snake-carrot-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="55%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <radialGradient id="snake-pine-gold" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
      </defs>

      <rect width="260" height="130" fill="#071123" />

      {/* Subtle grid dots */}
      {Array.from({ length: 10 }).map((_, gx) =>
        Array.from({ length: 5 }).map((__, gy) => (
          <circle
            key={`${gx}-${gy}`}
            cx={20 + gx * 24}
            cy={17 + gy * 24}
            r="1.1"
            fill="#38bdf8"
            opacity="0.16"
          />
        ))
      )}

      {/* Ambient glow */}
      <circle cx="152" cy="52" r="56" fill="#10b981" opacity="0.13" />
      <circle cx="212" cy="44" r="30" fill="#f43f5e" opacity="0.14" />

      {/* Glowing coiled neon snake */}
      <path
        d="M 40 96 L 84 96 Q 100 96 100 80 L 100 58 Q 100 42 116 42 L 152 42"
        stroke="#34d399"
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.2"
      />
      <path
        d="M 40 96 L 84 96 Q 100 96 100 80 L 100 58 Q 100 42 116 42 L 152 42"
        stroke="url(#snake-body-grad)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Snake Head & Eyes */}
      <circle cx="154" cy="42" r="8.5" fill="#6ee7b7" />
      <circle cx="157.5" cy="38.5" r="2.1" fill="#052e16" />
      <circle cx="157.5" cy="45.5" r="2.1" fill="#052e16" />
      <circle cx="158.2" cy="38" r="0.7" fill="#ffffff" />
      <circle cx="158.2" cy="45" r="0.7" fill="#ffffff" />

      {/* Crisp Neon Red Apple ahead of snake */}
      <g transform="translate(208, 43)">
        <circle cx="0" cy="0" r="14" fill="#f43f5e" opacity="0.2" />
        <circle cx="-3" cy="1.5" r="7.5" fill="url(#snake-apple-grad)" />
        <circle cx="3" cy="1.5" r="7.5" fill="url(#snake-apple-grad)" />
        <path d="M 0 -5.5 Q 1.5 -10.5 4 -11.5" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="5" cy="-8.5" rx="4.2" ry="2.2" transform="rotate(-25 5 -8.5)" fill="#4ade80" />
        <ellipse cx="-4.2" cy="-1.2" rx="2.2" ry="1.2" transform="rotate(-35 -4.2 -1.2)" fill="#ffffff" opacity="0.5" />
      </g>

      {/* Crisp Neon Carrot */}
      <g transform="translate(154, 94) rotate(-25)">
        <circle cx="0" cy="0" r="14" fill="#f97316" opacity="0.16" />
        <ellipse cx="-2.8" cy="-9.5" rx="2.3" ry="4.5" transform="rotate(-22 -2.8 -9.5)" fill="#4ade80" />
        <ellipse cx="0" cy="-10.5" rx="2.3" ry="4.8" fill="#4ade80" />
        <ellipse cx="2.8" cy="-9.5" rx="2.3" ry="4.5" transform="rotate(22 2.8 -9.5)" fill="#4ade80" />
        <path d="M -6 -5.5 Q 0 -8.5 6 -5.5 L 0 12 Z" fill="url(#snake-carrot-grad)" />
      </g>

      {/* Golden Bonus Pineapple */}
      <g transform="translate(208, 92)">
        <circle cx="0" cy="0" r="15" fill="#facc15" opacity="0.18" />
        <circle cx="0" cy="0" r="12.5" stroke="#fde047" strokeWidth="1.3" strokeDasharray="52 18" opacity="0.72" />
        <path d="M 0 -11 L -2.6 -4 L 2.6 -4 Z" fill="#4ade80" />
        <path d="M -5.5 -8.5 L -1.8 -3.8 L -4.5 -3.6 Z" fill="#4ade80" />
        <path d="M 5.5 -8.5 L 1.8 -3.8 L 4.5 -3.6 Z" fill="#4ade80" />
        <ellipse cx="0" cy="2.2" rx="6.6" ry="8" fill="url(#snake-pine-gold)" stroke="#fef9c3" strokeWidth="1" />
      </g>
    </svg>
  );
}

interface EngineState {
  snake: Cell[];
  prevSnake: Cell[];
  dir: SnakeDir;
  dirQueue: SnakeDir[];
  food: FoodItem;
  bonus: BonusFood | null;
  eatenCount: number;
  score: number;
  combo: number;
  lastEatAt: number;
  boostUntil: number;
  lastStepAt: number;
  particles: Particle[];
  floats: FloatingScore[];
  shakeUntil: number;
}

export const NeonSnakeGame: React.FC<NeonSnakeGameProps> = ({
  lang,
  sfxEnabled,
  onExitToHub,
}) => {
  const t = COPY_SNAKE[lang];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<NeonSnakeAudio>(new NeonSnakeAudio());

  const [phase, setPhase] = useState<GamePhase>('READY');
  const [wallMode, setWallMode] = useState<WallMode>('walls');
  const [speedTier, setSpeedTier] = useState<SpeedTier>('normal');
  const [score, setScore] = useState<number>(0);
  const [length, setLength] = useState<number>(4);
  const [boostSeconds, setBoostSeconds] = useState<number>(0);
  const [stats, setStats] = useState<NeonSnakeStats>(() => readSnakeStats());

  const phaseRef = useRef<GamePhase>(phase);
  const wallModeRef = useRef<WallMode>(wallMode);
  const speedTierRef = useRef<SpeedTier>(speedTier);
  const statsRef = useRef<NeonSnakeStats>(stats);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  phaseRef.current = phase;
  wallModeRef.current = wallMode;
  speedTierRef.current = speedTier;
  statsRef.current = stats;

  useEffect(() => {
    audioRef.current.enabled = sfxEnabled;
  }, [sfxEnabled]);

  const buildFreshEngine = useCallback((): EngineState => {
    const snake = createInitialSnake();
    const firstFoodCell = spawnFreeCell(snake);
    return {
      snake,
      prevSnake: snake.map((c) => ({ ...c })),
      dir: 'RIGHT',
      dirQueue: [],
      food: { ...firstFoodCell, kind: randomProduceKind() },
      bonus: null,
      eatenCount: 0,
      score: 0,
      combo: 0,
      lastEatAt: 0,
      boostUntil: 0,
      lastStepAt: performance.now(),
      particles: [],
      floats: [],
      shakeUntil: 0,
    };
  }, []);

  const engineRef = useRef<EngineState>(buildFreshEngine());

  const syncBestStats = useCallback((nextScore: number, nextLen: number) => {
    const cur = statsRef.current;
    const bestScore = Math.max(cur.bestScore, nextScore);
    const bestLength = Math.max(cur.bestLength, nextLen);
    if (bestScore !== cur.bestScore || bestLength !== cur.bestLength) {
      const updated = { bestScore, bestLength };
      statsRef.current = updated;
      setStats(updated);
      saveSnakeStats(updated);
    }
  }, []);

  const startRun = useCallback(() => {
    const fresh = buildFreshEngine();
    fresh.lastStepAt = performance.now();
    engineRef.current = fresh;
    setScore(0);
    setLength(fresh.snake.length);
    setBoostSeconds(0);
    setPhase('PLAYING');
  }, [buildFreshEngine]);

  const togglePause = useCallback(() => {
    if (phaseRef.current === 'PLAYING') {
      setPhase('PAUSED');
    } else if (phaseRef.current === 'PAUSED') {
      engineRef.current.lastStepAt = performance.now();
      setPhase('PLAYING');
    }
  }, []);

  const queueDirection = useCallback((nextDir: SnakeDir) => {
    if (phaseRef.current === 'READY') {
      startRun();
    }
    if (phaseRef.current !== 'PLAYING') return;

    const eng = engineRef.current;
    const referenceDir =
      eng.dirQueue.length > 0 ? eng.dirQueue[eng.dirQueue.length - 1] : eng.dir;
    if (nextDir === referenceDir || nextDir === OPPOSITE_DIR[referenceDir]) {
      return;
    }
    if (eng.dirQueue.length < 2) {
      eng.dirQueue.push(nextDir);
      audioRef.current.playTurn();
    }
  }, [startRun]);

  // Keyboard controls (Arrows / WASD / Space / P / Escape back to Hub)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onExitToHub();
        return;
      }

      if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (phaseRef.current === 'READY' || phaseRef.current === 'GAME_OVER') {
          startRun();
        } else {
          togglePause();
        }
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        queueDirection('UP');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        queueDirection('DOWN');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        queueDirection('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        queueDirection('RIGHT');
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onExitToHub, queueDirection, startRun, togglePause]);

  // Main 60fps simulation & canvas render loop
  useEffect(() => {
    let rafId = 0;
    let prevFrameAt = performance.now();

    const spawnBurst = (cx: number, cy: number, color: string, count: number) => {
      const eng = engineRef.current;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = 70 + Math.random() * 140;
        eng.particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 0.38 + Math.random() * 0.25,
          radius: 2.2 + Math.random() * 2.6,
          color,
        });
      }
    };

    const stepSimulation = (now: number) => {
      const eng = engineRef.current;

      // Expire bonus orb if overdue
      if (eng.bonus && now >= eng.bonus.expiresAt) {
        eng.bonus = null;
      }

      // Consume next buffered turn
      if (eng.dirQueue.length > 0) {
        const candidate = eng.dirQueue.shift()!;
        if (candidate !== OPPOSITE_DIR[eng.dir]) {
          eng.dir = candidate;
        }
      }

      const head = eng.snake[0];
      const vec = DIR_VEC[eng.dir];
      let nx = head.x + vec.x;
      let ny = head.y + vec.y;

      if (wallModeRef.current === 'wrap') {
        nx = (nx + GRID_X) % GRID_X;
        ny = (ny + GRID_Y) % GRID_Y;
      } else {
        if (nx < 0 || nx >= GRID_X || ny < 0 || ny >= GRID_Y) {
          eng.shakeUntil = now + 260;
          audioRef.current.playCrash();
          syncBestStats(eng.score, eng.snake.length);
          setPhase('GAME_OVER');
          return;
        }
      }

      const willEatFood = nx === eng.food.x && ny === eng.food.y;
      const willEatBonus =
        eng.bonus !== null && nx === eng.bonus.x && ny === eng.bonus.y;

      // Check self collision (tail moves out unless growing)
      const bodyToCheck = willEatFood
        ? eng.snake
        : eng.snake.slice(0, eng.snake.length - 1);
      const hitSelf = bodyToCheck.some((seg) => seg.x === nx && seg.y === ny);
      if (hitSelf) {
        eng.shakeUntil = now + 260;
        audioRef.current.playCrash();
        syncBestStats(eng.score, eng.snake.length);
        setPhase('GAME_OVER');
        return;
      }

      // Save previous snapshot for smooth sub-step interpolation
      eng.prevSnake = eng.snake.map((c) => ({ ...c }));

      const nextSnake = [{ x: nx, y: ny }, ...eng.snake];
      if (!willEatFood) {
        nextSnake.pop();
      }
      eng.snake = nextSnake;

      const isBoosted = now < eng.boostUntil;
      const mult = isBoosted ? 2 : 1;

      if (willEatFood) {
        eng.eatenCount += 1;
        if (now - eng.lastEatAt < 3400) {
          eng.combo += 1;
        } else {
          eng.combo = 1;
        }
        eng.lastEatAt = now;

        const gained = 10 * mult;
        eng.score += gained;
        setScore(eng.score);
        setLength(eng.snake.length);
        syncBestStats(eng.score, eng.snake.length);
        audioRef.current.playEat(eng.combo);

        const px = (nx + 0.5) * CELL_PX;
        const py = (ny + 0.5) * CELL_PX;
        const eatenMeta = getProduceMeta(eng.food.kind);
        spawnBurst(px, py, eatenMeta.burstColor, 14);
        eng.floats.push({
          x: px,
          y: py - 8,
          text: `+${gained}`,
          color: isBoosted ? '#fde047' : eatenMeta.burstColor,
          life: 0,
          maxLife: 0.72,
        });

        const occupiedForFood = eng.bonus ? [...eng.snake, eng.bonus] : eng.snake;
        const nextFoodCell = spawnFreeCell(occupiedForFood);
        eng.food = {
          ...nextFoodCell,
          kind: randomProduceKind(eng.food.kind),
        };

        // Spawn a Golden Star Orb every 5 regular orbs eaten
        if (eng.eatenCount % 5 === 0 && !eng.bonus) {
          const bPos = spawnFreeCell([...eng.snake, eng.food]);
          eng.bonus = {
            x: bPos.x,
            y: bPos.y,
            spawnedAt: now,
            expiresAt: now + 7500,
          };
        }
      }

      if (willEatBonus && eng.bonus) {
        const gained = 50;
        eng.score += gained;
        eng.boostUntil = now + 6500;
        eng.bonus = null;
        setScore(eng.score);
        syncBestStats(eng.score, eng.snake.length);
        audioRef.current.playBonusEat();

        const px = (nx + 0.5) * CELL_PX;
        const py = (ny + 0.5) * CELL_PX;
        spawnBurst(px, py, '#fde047', 22);
        eng.floats.push({
          x: px,
          y: py - 10,
          text: '+50 · 2x!',
          color: '#fef08a',
          life: 0,
          maxLife: 0.95,
        });
      }
    };

    const drawFrame = (now: number, dtSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const eng = engineRef.current;

      // Dynamic tick interval (gently accelerates as snake grows)
      const baseMs = BASE_STEP_MS[speedTierRef.current];
      const speedReduction = Math.min(34, Math.floor((eng.snake.length - 4) * 1.4));
      const stepMs = Math.max(58, baseMs - speedReduction);

      if (phaseRef.current === 'PLAYING') {
        while (now - eng.lastStepAt >= stepMs) {
          eng.lastStepAt += stepMs;
          stepSimulation(now);
          if (phaseRef.current !== 'PLAYING') break;
        }
        const rem = Math.max(0, Math.ceil((eng.boostUntil - now) / 1000));
        setBoostSeconds((prev) => (prev !== rem ? rem : prev));
      }

      // Update particles & floating text
      for (let i = eng.particles.length - 1; i >= 0; i--) {
        const p = eng.particles[i];
        p.life += dtSec;
        if (p.life >= p.maxLife) {
          eng.particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dtSec;
        p.y += p.vy * dtSec;
        p.vx *= 0.94;
        p.vy *= 0.94;
      }

      for (let i = eng.floats.length - 1; i >= 0; i--) {
        const f = eng.floats[i];
        f.life += dtSec;
        if (f.life >= f.maxLife) {
          eng.floats.splice(i, 1);
          continue;
        }
        f.y -= 36 * dtSec;
      }

      const alpha =
        phaseRef.current === 'PLAYING'
          ? Math.max(0, Math.min(1, (now - eng.lastStepAt) / stepMs))
          : 1;

      ctx.save();

      // Subtle screen shake on crash
      if (now < eng.shakeUntil) {
        const mag = ((eng.shakeUntil - now) / 260) * 6;
        ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
      }

      // Arena backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bgGrad.addColorStop(0, '#0a1529');
      bgGrad.addColorStop(1, '#060d1c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Subtle dot grid
      ctx.fillStyle = 'rgba(56, 189, 248, 0.11)';
      for (let gy = 0; gy < GRID_Y; gy++) {
        for (let gx = 0; gx < GRID_X; gx++) {
          ctx.beginPath();
          ctx.arc(
            (gx + 0.5) * CELL_PX,
            (gy + 0.5) * CELL_PX,
            1.25,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // Arena border cue: solid rose-amber frame for Walls, dashed cyan portal frame for Wrap
      ctx.save();
      if (wallModeRef.current === 'walls') {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, CANVAS_W - 4, CANVAS_H - 4);
      } else {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 10]);
        ctx.strokeRect(2, 2, CANVAS_W - 4, CANVAS_H - 4);
      }
      ctx.restore();

      const pulse = 0.5 + 0.5 * Math.sin(now * 0.007);

      // Neon Fruit or Vegetable Item
      const fx = (eng.food.x + 0.5) * CELL_PX;
      const fy = (eng.food.y + 0.5) * CELL_PX;
      const foodSize = CELL_PX * (0.44 + pulse * 0.05);
      drawProduceItem(ctx, eng.food.kind, fx, fy, foodSize);

      // Golden Bonus Pineapple with circular countdown arc
      if (eng.bonus) {
        const bx = (eng.bonus.x + 0.5) * CELL_PX;
        const by = (eng.bonus.y + 0.5) * CELL_PX;
        const remainFrac = Math.max(
          0,
          (eng.bonus.expiresAt - now) / (eng.bonus.expiresAt - eng.bonus.spawnedAt)
        );
        const bonusSize = CELL_PX * (0.46 + pulse * 0.05);

        ctx.save();
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(
          bx,
          by,
          bonusSize + 4.5,
          -Math.PI / 2,
          -Math.PI / 2 + Math.PI * 2 * remainFrac
        );
        ctx.stroke();
        ctx.restore();

        drawGoldenPineapple(ctx, bx, by, bonusSize);
      }

      // Compute smoothly interpolated snake segment points
      const snakePts: { x: number; y: number; wrapped: boolean }[] = [];
      const curLen = eng.snake.length;
      for (let i = 0; i < curLen; i++) {
        const cur = eng.snake[i];
        const prev = eng.prevSnake[Math.min(i, eng.prevSnake.length - 1)] || cur;
        const dx = cur.x - prev.x;
        const dy = cur.y - prev.y;
        const wrapped = Math.abs(dx) > 1 || Math.abs(dy) > 1;
        const ix = wrapped ? cur.x : prev.x + dx * alpha;
        const iy = wrapped ? cur.y : prev.y + dy * alpha;
        snakePts.push({
          x: (ix + 0.5) * CELL_PX,
          y: (iy + 0.5) * CELL_PX,
          wrapped,
        });
      }

      const isBoosted = now < eng.boostUntil;

      // Draw glowing continuous spine segments (breaking cleanly across portal wraps)
      for (let i = snakePts.length - 1; i >= 0; i--) {
        const pt = snakePts[i];
        const tFrac = curLen <= 1 ? 0 : i / (curLen - 1);
        const radius = CELL_PX * (0.43 - tFrac * 0.14);

        // Bridge connector between adjacent non-wrapped segments
        if (i > 0) {
          const nextPt = snakePts[i - 1];
          const dist = Math.hypot(nextPt.x - pt.x, nextPt.y - pt.y);
          if (dist < CELL_PX * 1.6) {
            ctx.save();
            ctx.strokeStyle = isBoosted
              ? `hsl(${46 + tFrac * 32}, 96%, ${62 - tFrac * 14}%)`
              : `hsl(${156 + tFrac * 36}, 86%, ${58 - tFrac * 16}%)`;
            ctx.lineWidth = radius * 1.9;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(nextPt.x, nextPt.y);
            ctx.stroke();
            ctx.restore();
          }
        }

        ctx.save();
        if (i === 0) {
          ctx.shadowColor = isBoosted ? '#fde047' : '#34d399';
          ctx.shadowBlur = 18;
        }
        const segGrad = ctx.createRadialGradient(
          pt.x - radius * 0.3,
          pt.y - radius * 0.3,
          1,
          pt.x,
          pt.y,
          radius
        );
        if (isBoosted) {
          segGrad.addColorStop(0, '#fef9c3');
          segGrad.addColorStop(0.55, i === 0 ? '#facc15' : '#f59e0b');
          segGrad.addColorStop(1, '#92400e');
        } else {
          segGrad.addColorStop(0, i === 0 ? '#d1fae5' : '#a7f3d0');
          segGrad.addColorStop(
            0.55,
            `hsl(${154 + tFrac * 38}, 85%, ${54 - tFrac * 14}%)`
          );
          segGrad.addColorStop(
            1,
            `hsl(${165 + tFrac * 38}, 88%, ${24 - tFrac * 6}%)`
          );
        }
        ctx.fillStyle = segGrad;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw directional eyes on head
      if (snakePts.length > 0) {
        const headPt = snakePts[0];
        const vec = DIR_VEC[eng.dir];
        const perpX = -vec.y;
        const perpY = vec.x;
        const fwd = CELL_PX * 0.14;
        const side = CELL_PX * 0.16;

        [1, -1].forEach((sign) => {
          const ex = headPt.x + vec.x * fwd + perpX * side * sign;
          const ey = headPt.y + vec.y * fwd + perpY * side * sign;
          ctx.fillStyle = '#04121b';
          ctx.beginPath();
          ctx.arc(ex, ey, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex + vec.x * 0.9, ey + vec.y * 0.9, 1.2, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw burst particles
      for (const p of eng.particles) {
        const opacity = Math.max(0, 1 - p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * opacity, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw floating score popups
      for (const f of eng.floats) {
        const opacity = Math.max(0, 1 - f.life / f.maxLife);
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = f.color;
        ctx.font = '800 18px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }

      ctx.restore();
    };

    const loop = (now: number) => {
      const dtSec = Math.min(0.05, Math.max(0, (now - prevFrameAt) / 1000));
      prevFrameAt = now;
      drawFrame(now, dtSec);
      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [syncBestStats]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeStartRef.current) return;
    const dx = e.clientX - swipeStartRef.current.x;
    const dy = e.clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      queueDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      queueDirection(dy > 0 ? 'DOWN' : 'UP');
    }
  };

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 h-[100dvh] z-50 bg-[#060c18] text-slate-100 flex flex-col overflow-hidden select-none"
    >
      {/* Top Bar with Dedicated Corner Exit Button */}
      <header className="w-full border-b border-white/10 bg-[#0a1324]/95 shrink-0">
        <div className="mx-auto max-w-[960px] h-12 sm:h-14 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-3">
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

          {/* Center Title */}
          <h1 className="text-sm sm:text-lg font-bold text-white whitespace-nowrap truncate">
            {t.title}
          </h1>

          {/* Live Inline Metrics */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm shrink-0">
            <div className="whitespace-nowrap">
              <span className="text-slate-400">{t.scoreLabel}: </span>
              <span className="font-num font-bold text-white">{score}</span>
            </div>
            <div className="whitespace-nowrap">
              <span className="text-slate-400">{t.bestLabel}: </span>
              <span className="font-num font-bold text-amber-300">
                {stats.bestScore}
              </span>
            </div>
            <div className="hidden md:block whitespace-nowrap">
              <span className="text-slate-400">{t.lengthLabel}: </span>
              <span className="font-num font-bold text-emerald-300">
                {length}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Arena Stage */}
      <main className="relative flex-1 min-h-0 flex flex-col items-center justify-start px-2.5 sm:px-5 pt-1.5 pb-3 gap-2 overflow-y-auto">
        <div className="w-[min(96vw,calc((100dvh-250px)*13/8),820px)] min-w-[280px] flex flex-col items-center gap-1.5 shrink-0">
          {/* Compact Mode & Speed Selector Bar */}
          <div className="w-full flex items-center justify-between gap-1.5 shrink-0">
            {/* Walls / No Walls Toggle */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-900/90 border border-white/10">
              <button
                type="button"
                onClick={() => setWallMode('walls')}
                className={`h-7 sm:h-8 px-2.5 sm:px-3 rounded-md text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  wallMode === 'walls'
                    ? 'bg-rose-500/25 text-rose-200 border border-rose-400/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.wallsMode}
              </button>
              <button
                type="button"
                onClick={() => setWallMode('wrap')}
                className={`h-7 sm:h-8 px-2.5 sm:px-3 rounded-md text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  wallMode === 'wrap'
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.wrapMode}
              </button>
            </div>

            {/* Speed Tier Selector */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-900/90 border border-white/10">
              {(
                [
                  { id: 'slow' as const, label: t.slowSpeed },
                  { id: 'normal' as const, label: t.normalSpeed },
                  { id: 'fast' as const, label: t.fastSpeed },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSpeedTier(opt.id)}
                  className={`h-7 sm:h-8 px-2 sm:px-2.5 rounded-md text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    speedTier === opt.id
                      ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wide 13:8 Neon Snake Canvas */}
          <div
            dir="ltr"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
              swipeStartRef.current = null;
            }}
            className="relative w-full aspect-[13/8] rounded-2xl border border-emerald-400/25 bg-[#071021] shadow-[0_0_40px_rgba(16,185,129,0.12)] touch-none overflow-hidden"
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full h-full block"
            />

          {/* Live 2x Boost Countdown Text */}
          {boostSeconds > 0 && phase === 'PLAYING' && (
            <div
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              className="pointer-events-none absolute top-2.5 inset-x-0 flex justify-center"
            >
              <span className="px-3 py-1 rounded-md bg-slate-950/80 border border-amber-300/45 text-xs font-bold text-amber-300 font-num">
                {t.boostActive} · {boostSeconds}s
              </span>
            </div>
          )}

          {/* Ready Start Overlay */}
          {phase === 'READY' && (
            <div
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              className="absolute inset-0 z-10 flex items-center justify-center p-5 bg-[#050b16]/78 backdrop-blur-[2px]"
            >
              <div className="w-full max-w-xs text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {t.startTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
                  {t.startSub}
                </p>
                <button
                  type="button"
                  onClick={startRun}
                  className="min-w-[160px] px-6 py-3 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm sm:text-base transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t.startBtn}
                </button>
              </div>
            </div>
          )}

          {/* Paused Overlay */}
          {phase === 'PAUSED' && (
            <div
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              className="absolute inset-0 z-10 flex items-center justify-center p-5 bg-[#050b16]/82 backdrop-blur-[3px]"
            >
              <div className="w-full max-w-xs text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
                  {t.pausedTitle}
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={togglePause}
                    className="w-full sm:w-auto min-w-[140px] px-5 py-3 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {t.resumeBtn}
                  </button>
                  <button
                    type="button"
                    onClick={startRun}
                    className="w-full sm:w-auto px-5 py-3 rounded-lg border border-white/15 bg-slate-800/85 hover:bg-slate-700 text-slate-100 font-semibold text-sm transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {t.restartBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {phase === 'GAME_OVER' && (
            <div
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              className="absolute inset-0 z-10 flex items-center justify-center p-5 bg-[#050b16]/86 backdrop-blur-[3px]"
            >
              <div className="w-full max-w-xs text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5">
                  {t.gameOverTitle}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-emerald-300 mb-5">
                  {t.gameOverSub(score, length)}
                </p>
                <button
                  type="button"
                  onClick={startRun}
                  className="min-w-[160px] px-6 py-3 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm sm:text-base transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t.playAgainBtn}
                </button>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Bottom Controls: Action Buttons + Complete Cross D-Pad (All 4 Arrows Guaranteed Visible) */}
        <div className="w-[min(96vw,calc((100dvh-250px)*13/8),820px)] min-w-[280px] flex items-center justify-between gap-3 shrink-0 pb-1">
          <div className="flex flex-col sm:flex-row gap-2 shrink-0 min-w-[92px]">
            <button
              type="button"
              disabled={phase === 'READY' || phase === 'GAME_OVER'}
              onClick={togglePause}
              className={`h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl border text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                phase === 'READY' || phase === 'GAME_OVER'
                  ? 'border-white/5 bg-slate-900/50 text-slate-500 cursor-not-allowed'
                  : 'border-white/15 bg-slate-900/90 hover:bg-slate-800 text-slate-100 cursor-pointer'
              }`}
            >
              <span>{phase === 'PAUSED' ? t.resumeBtn : t.pauseBtn}</span>
            </button>

            <button
              type="button"
              onClick={startRun}
              className="h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl border border-emerald-400/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <span>{t.restartBtn}</span>
            </button>
          </div>

          {/* Complete Cross D-Pad: Up on Top, Down on Bottom, Left on Left, Right on Right */}
          <div
            dir="ltr"
            className="grid grid-cols-3 grid-rows-3 gap-1 sm:gap-1.5 mx-auto sm:mx-0 touch-manipulation shrink-0"
          >
            <div aria-hidden="true" />
            <button
              type="button"
              aria-label="Up"
              onPointerDown={(e) => {
                e.preventDefault();
                queueDirection('UP');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  queueDirection('UP');
                }
              }}
              className="w-12 h-[38px] sm:w-[54px] sm:h-[42px] rounded-xl border border-emerald-400/40 bg-slate-900/95 hover:bg-slate-800 active:bg-emerald-500/30 active:scale-95 text-emerald-100 shadow-md inline-flex items-center justify-center transition-all cursor-pointer touch-manipulation"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 sm:w-6 sm:h-6"
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
                queueDirection('LEFT');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  queueDirection('LEFT');
                }
              }}
              className="w-12 h-[38px] sm:w-[54px] sm:h-[42px] rounded-xl border border-emerald-400/40 bg-slate-900/95 hover:bg-slate-800 active:bg-emerald-500/30 active:scale-95 text-emerald-100 shadow-md inline-flex items-center justify-center transition-all cursor-pointer touch-manipulation"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 sm:w-6 sm:h-6"
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
              className="w-12 h-[38px] sm:w-[54px] sm:h-[42px] rounded-xl bg-slate-950/70 border border-white/[0.06] flex items-center justify-center"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400/35" />
            </div>

            <button
              type="button"
              aria-label="Right"
              onPointerDown={(e) => {
                e.preventDefault();
                queueDirection('RIGHT');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  queueDirection('RIGHT');
                }
              }}
              className="w-12 h-[38px] sm:w-[54px] sm:h-[42px] rounded-xl border border-emerald-400/40 bg-slate-900/95 hover:bg-slate-800 active:bg-emerald-500/30 active:scale-95 text-emerald-100 shadow-md inline-flex items-center justify-center transition-all cursor-pointer touch-manipulation"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 sm:w-6 sm:h-6"
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
                queueDirection('DOWN');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  queueDirection('DOWN');
                }
              }}
              className="w-12 h-[38px] sm:w-[54px] sm:h-[42px] rounded-xl border border-emerald-400/40 bg-slate-900/95 hover:bg-slate-800 active:bg-emerald-500/30 active:scale-95 text-emerald-100 shadow-md inline-flex items-center justify-center transition-all cursor-pointer touch-manipulation"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 sm:w-6 sm:h-6"
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
