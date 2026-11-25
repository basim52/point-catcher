import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MusicToggleButton, useGameMusic } from './gameMusic';

export interface FruitSlashGameProps {
  lang: 'ar' | 'en';
  sfxEnabled: boolean;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  onExitToHub: () => void;
}

export interface FruitSlashStats {
  bestClassic: number;
  bestZen: number;
  bestCombo: number;
  totalSliced: number;
}

type SlashMode = 'classic' | 'zen';
type SlashView = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

type FruitKind =
  | 'watermelon'
  | 'orange'
  | 'kiwi'
  | 'pomegranate'
  | 'mango'
  | 'apple'
  | 'freeze'
  | 'frenzy'
  | 'bomb';

interface FruitSpec {
  kind: FruitKind;
  radius: number;
  points: number;
  outer: string;
  rind: string;
  inner: string;
  seedColor: string;
  juice: string;
  isBomb?: boolean;
  isFreeze?: boolean;
  isFrenzy?: boolean;
}

interface WholeItem {
  id: number;
  spec: FruitSpec;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  entered: boolean;
}

interface SlicedHalf {
  spec: FruitSpec;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  side: -1 | 1;
  alpha: number;
}

interface JuiceDrop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  life: number;
  maxLife: number;
}

interface BoardStain {
  x: number;
  y: number;
  r: number;
  color: string;
  alpha: number;
}

interface FloatingCallout {
  text: string;
  x: number;
  y: number;
  color: string;
  scale: number;
  life: number;
  maxLife: number;
}

interface BladePoint {
  x: number;
  y: number;
  time: number;
}

const STATS_KEY = 'point_catcher_fruit_slash_2d_v1';
const MAX_HEARTS = 3;
const ZEN_DURATION = 60;
const CANVAS_W = 960;
const CANVAS_H = 560;

const FRUIT_SPECS: Record<FruitKind, FruitSpec> = {
  watermelon: {
    kind: 'watermelon',
    radius: 42,
    points: 10,
    outer: '#15803d',
    rind: '#bbf7d0',
    inner: '#ef4444',
    seedColor: '#1f2937',
    juice: '#f43f5e',
  },
  orange: {
    kind: 'orange',
    radius: 31,
    points: 10,
    outer: '#ea580c',
    rind: '#fed7aa',
    inner: '#fb923c',
    seedColor: '#fffbeb',
    juice: '#fb923c',
  },
  kiwi: {
    kind: 'kiwi',
    radius: 28,
    points: 15,
    outer: '#78350f',
    rind: '#d9f99d',
    inner: '#84cc16',
    seedColor: '#111827',
    juice: '#a3e635',
  },
  pomegranate: {
    kind: 'pomegranate',
    radius: 34,
    points: 15,
    outer: '#9f1239',
    rind: '#fecdd3',
    inner: '#e11d48',
    seedColor: '#fff1f2',
    juice: '#fb7185',
  },
  mango: {
    kind: 'mango',
    radius: 33,
    points: 12,
    outer: '#d97706',
    rind: '#fef3c7',
    inner: '#facc15',
    seedColor: '#b45309',
    juice: '#fbbf24',
  },
  apple: {
    kind: 'apple',
    radius: 30,
    points: 12,
    outer: '#dc2626',
    rind: '#fee2e2',
    inner: '#fef9c3',
    seedColor: '#451a03',
    juice: '#fca5a5',
  },
  freeze: {
    kind: 'freeze',
    radius: 32,
    points: 20,
    outer: '#0284c7',
    rind: '#e0f2fe',
    inner: '#38bdf8',
    seedColor: '#ffffff',
    juice: '#7dd3fc',
    isFreeze: true,
  },
  frenzy: {
    kind: 'frenzy',
    radius: 35,
    points: 30,
    outer: '#eab308',
    rind: '#fef9c3',
    inner: '#fde047',
    seedColor: '#ffffff',
    juice: '#fde047',
    isFrenzy: true,
  },
  bomb: {
    kind: 'bomb',
    radius: 33,
    points: 0,
    outer: '#18181b',
    rind: '#ef4444',
    inner: '#ef4444',
    seedColor: '#fbbf24',
    juice: '#f97316',
    isBomb: true,
  },
};

const REGULAR_FRUITS: FruitKind[] = [
  'watermelon',
  'orange',
  'kiwi',
  'pomegranate',
  'mango',
  'apple',
];

export function readFruitSlashStats(): FruitSlashStats {
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return { bestClassic: 0, bestZen: 0, bestCombo: 0, totalSliced: 0 };
    const p = JSON.parse(raw) as Partial<FruitSlashStats>;
    return {
      bestClassic: typeof p.bestClassic === 'number' ? Math.max(0, Math.floor(p.bestClassic)) : 0,
      bestZen: typeof p.bestZen === 'number' ? Math.max(0, Math.floor(p.bestZen)) : 0,
      bestCombo: typeof p.bestCombo === 'number' ? Math.max(0, Math.floor(p.bestCombo)) : 0,
      totalSliced: typeof p.totalSliced === 'number' ? Math.max(0, Math.floor(p.totalSliced)) : 0,
    };
  } catch {
    return { bestClassic: 0, bestZen: 0, bestCombo: 0, totalSliced: 0 };
  }
}

function saveFruitSlashStats(s: FruitSlashStats): void {
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

class SlashAudio {
  private ctx: AudioContext | null = null;
  public enabled = true;
  private lastWhoosh = 0;

  private ensureCtx(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playWhoosh(): void {
    const now = performance.now();
    if (now - this.lastWhoosh < 130) return;
    this.lastWhoosh = now;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.11);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, t);
    filter.frequency.exponentialRampToValueAtTime(520, t + 0.1);
    filter.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    src.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    src.start(t);
  }

  public playSlice(comboCount = 1): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const base = 360 + Math.min(comboCount, 6) * 75;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(base * 1.65, t + 0.085);
    g.gain.setValueAtTime(0.14, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playCombo(count: number): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const freqs = count >= 4 ? [523.25, 659.25, 783.99, 1046.5] : [493.88, 659.25, 880];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      const st = t + idx * 0.045;
      osc.frequency.setValueAtTime(f, st);
      g.gain.setValueAtTime(0.001, st);
      g.gain.linearRampToValueAtTime(0.12, st + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.24);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(st);
      osc.stop(st + 0.26);
    });
  }

  public playFreeze(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    [987.77, 1318.5, 1567.98].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      const st = t + i * 0.05;
      osc.frequency.setValueAtTime(f, st);
      g.gain.setValueAtTime(0.09, st);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(st);
      osc.stop(st + 0.36);
    });
  }

  public playBomb(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.45);
    g.gain.setValueAtTime(0.24, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  public playMiss(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(130, t + 0.2);
    g.gain.setValueAtTime(0.11, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.23);
  }

  public dispose(): void {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

function segmentCircleHit(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cx: number,
  cy: number,
  r: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = 0;
  if (lenSq > 0.001) {
    t = Math.max(0, Math.min(1, ((cx - x1) * dx + (cy - y1) * dy) / lenSq));
  }
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  const distSq = (cx - px) * (cx - px) + (cy - py) * (cy - py);
  return distSq <= r * r;
}

function buildDojoWoodCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = CANVAS_W;
  c.height = CANVAS_H;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Warm cedar wood dojo plank wall
  ctx.fillStyle = '#3b2416';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const plankH = 70;
  for (let row = 0; row < Math.ceil(CANVAS_H / plankH); row++) {
    const y = row * plankH;
    const tone = row % 2 === 0 ? '#4a2e1d' : '#432818';
    const grad = ctx.createLinearGradient(0, y, 0, y + plankH);
    grad.addColorStop(0, '#5a3824');
    grad.addColorStop(0.12, tone);
    grad.addColorStop(0.9, '#392214');
    grad.addColorStop(1, '#26150c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, CANVAS_W, plankH);

    // Subtle wood grain waves
    ctx.strokeStyle = 'rgba(28, 14, 7, 0.22)';
    ctx.lineWidth = 1.2;
    for (let g = 0; g < 6; g++) {
      ctx.beginPath();
      const gy = y + 10 + g * 10;
      ctx.moveTo(0, gy);
      for (let x = 0; x <= CANVAS_W; x += 60) {
        const wave = Math.sin(x * 0.012 + row * 1.9 + g) * 2.5;
        ctx.lineTo(x, gy + wave);
      }
      ctx.stroke();
    }

    // Plank seam
    ctx.fillStyle = 'rgba(18, 9, 4, 0.65)';
    ctx.fillRect(0, y + plankH - 2, CANVAS_W, 2);
  }

  // Warm dojo spotlight vignette
  const vig = ctx.createRadialGradient(
    CANVAS_W * 0.5,
    CANVAS_H * 0.45,
    120,
    CANVAS_W * 0.5,
    CANVAS_H * 0.5,
    580
  );
  vig.addColorStop(0, 'rgba(255, 224, 178, 0.08)');
  vig.addColorStop(0.65, 'rgba(0, 0, 0, 0.06)');
  vig.addColorStop(1, 'rgba(12, 6, 3, 0.62)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  return c;
}

function drawWholeFruit(ctx: CanvasRenderingContext2D, item: WholeItem, nowSec: number): void {
  const { spec } = item;
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate(item.rot);

  // Subtle drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(4, 7, spec.radius * 0.96, spec.radius * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();

  if (spec.isBomb) {
    // Iron sphere bomb
    const bGrad = ctx.createRadialGradient(-10, -10, 4, 0, 0, spec.radius);
    bGrad.addColorStop(0, '#52525b');
    bGrad.addColorStop(0.45, '#27272a');
    bGrad.addColorStop(1, '#09090b');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(0, 0, spec.radius, 0, Math.PI * 2);
    ctx.fill();

    // Red warning X painted on bomb
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-11, -11);
    ctx.lineTo(11, 11);
    ctx.moveTo(11, -11);
    ctx.lineTo(-11, 11);
    ctx.stroke();

    // Fuse cap & burning spark
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(-7, -spec.radius - 6, 14, 9);
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -spec.radius - 5);
    ctx.quadraticCurveTo(10, -spec.radius - 16, 17, -spec.radius - 12);
    ctx.stroke();

    const pulse = 5 + Math.sin(nowSec * 36) * 2.5;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(17, -spec.radius - 12, pulse + 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(17, -spec.radius - 12, pulse * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return;
  }

  // Outer fruit body
  const grad = ctx.createRadialGradient(
    -spec.radius * 0.3,
    -spec.radius * 0.32,
    spec.radius * 0.12,
    0,
    0,
    spec.radius
  );
  grad.addColorStop(0, spec.rind);
  grad.addColorStop(0.35, spec.outer);
  grad.addColorStop(1, spec.outer);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, spec.radius, 0, Math.PI * 2);
  ctx.fill();

  // Watermelon dark stripes
  if (spec.kind === 'watermelon') {
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 4.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(i * 11, 0, spec.radius * 0.88, -0.7, 0.7);
      ctx.stroke();
    }
  } else if (spec.isFreeze) {
    // Frost aura + crystal star
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18);
      ctx.stroke();
    }
  } else if (spec.isFrenzy) {
    // Golden star emblem
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 18 : 8;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Glossy specular highlight
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.ellipse(
    -spec.radius * 0.32,
    -spec.radius * 0.34,
    spec.radius * 0.28,
    spec.radius * 0.16,
    -0.6,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Little stem + leaf for natural silhouette
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -spec.radius + 2);
  ctx.lineTo(3, -spec.radius - 8);
  ctx.stroke();
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(9, -spec.radius - 5, 7, 3.5, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSlicedHalf(ctx: CanvasRenderingContext2D, half: SlicedHalf): void {
  const { spec } = half;
  ctx.save();
  ctx.globalAlpha = Math.max(0, half.alpha);
  ctx.translate(half.x, half.y);
  ctx.rotate(half.rot);

  const startAng = half.side === -1 ? 0 : Math.PI;
  const endAng = half.side === -1 ? Math.PI : Math.PI * 2;

  // Outer skin semicircle
  ctx.fillStyle = spec.outer;
  ctx.beginPath();
  ctx.arc(0, 0, spec.radius, startAng, endAng);
  ctx.closePath();
  ctx.fill();

  // Rind layer
  ctx.fillStyle = spec.rind;
  ctx.beginPath();
  ctx.arc(0, 0, spec.radius * 0.87, startAng, endAng);
  ctx.closePath();
  ctx.fill();

  // Juicy inner flesh
  ctx.fillStyle = spec.inner;
  ctx.beginPath();
  ctx.arc(0, 0, spec.radius * 0.77, startAng, endAng);
  ctx.closePath();
  ctx.fill();

  // Seeds along cut semicircle
  ctx.fillStyle = spec.seedColor;
  const dir = half.side === -1 ? 1 : -1;
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI * (i + 1)) / 5;
    const sx = Math.cos(a) * spec.radius * 0.48;
    const sy = Math.sin(a) * spec.radius * 0.48 * dir;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 2.5, 4, a, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

const COPY = {
  ar: {
    title: 'سيف الفواكه 2D',
    subtitle: 'اسحب السيف لتقطيع الفواكه في الهواء وتحقيق ضربات الكومبو المتتالية!',
    classicMode: 'الوضع الكلاسيكي',
    classicDesc: '3 قلوب · احذر القنابل المشتعلة ولا تترك الفواكه تسقط',
    zenMode: 'وضع الزِن (60 ثانية)',
    zenDesc: 'بدون قنابل · تقطيع سريع وكومبو متواصل خلال دقيقة واحدة',
    startBtn: 'ابدأ التقطيع',
    exitBtn: 'خروج',
    pauseBtn: 'إيقاف',
    resumeBtn: 'متابعة',
    restartBtn: 'العب مجدداً',
    menuBtn: 'تغيير الوضع',
    scoreLabel: 'النقاط',
    bestLabel: 'الأعلى',
    timeLabel: 'الوقت',
    comboWord: 'كومبو',
    freezeBanner: 'تجميد زمني!',
    frenzyBanner: 'عاصفة فواكه!',
    bombHit: 'انفجار قنبلة!',
    gameOverTitle: 'انتهت الجولة!',
    zenOverTitle: 'انتهى الوقت!',
    maxComboLabel: 'أقوى كومبو',
    slicedLabel: 'فواكه مقطّعة',
    dragHint: 'اسحب بالماوس أو الإصبع فوق الفواكه لتقطيعها',
    pausedTitle: 'اللعبة متوقفة مؤقتاً',
  },
  en: {
    title: 'Fruit Slash 2D',
    subtitle: 'Swipe your blade across flying fruit for juicy combos and bonus streaks!',
    classicMode: 'Classic Mode',
    classicDesc: '3 Hearts · Dodge sizzling bombs and never miss a fruit',
    zenMode: 'Zen Mode (60s)',
    zenDesc: 'No bombs · Pure high-speed fruit slicing for 60 seconds',
    startBtn: 'Start Slicing',
    exitBtn: 'Exit',
    pauseBtn: 'Pause',
    resumeBtn: 'Resume',
    restartBtn: 'Play Again',
    menuBtn: 'Switch Mode',
    scoreLabel: 'Score',
    bestLabel: 'Best',
    timeLabel: 'Time',
    comboWord: 'COMBO',
    freezeBanner: 'TIME FREEZE!',
    frenzyBanner: 'FRUIT FRENZY!',
    bombHit: 'BOMB BLAST!',
    gameOverTitle: 'Game Over!',
    zenOverTitle: 'Time Up!',
    maxComboLabel: 'Best Combo',
    slicedLabel: 'Fruits Sliced',
    dragHint: 'Drag with mouse or finger across flying fruits to slice',
    pausedTitle: 'Game Paused',
  },
} as const;

export const FruitSlashPreviewArt: React.FC = () => (
  <svg
    viewBox="0 0 320 180"
    className="w-full h-full block"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="fsWood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5c3822" />
        <stop offset="50%" stopColor="#3f2415" />
        <stop offset="100%" stopColor="#26140b" />
      </linearGradient>
      <linearGradient id="fsBlade" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
        <stop offset="55%" stopColor="#e0f2fe" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#ffffff" />
      </linearGradient>
    </defs>

    {/* Warm cedar wood dojo backdrop */}
    <rect width="320" height="180" fill="url(#fsWood)" />
    <line x1="0" y1="45" x2="320" y2="45" stroke="#221007" strokeWidth="2" opacity="0.6" />
    <line x1="0" y1="90" x2="320" y2="90" stroke="#221007" strokeWidth="2" opacity="0.6" />
    <line x1="0" y1="135" x2="320" y2="135" stroke="#221007" strokeWidth="2" opacity="0.6" />

    {/* Juice splash droplets */}
    <circle cx="152" cy="74" r="6" fill="#fb7185" opacity="0.7" />
    <circle cx="178" cy="56" r="4" fill="#fb7185" opacity="0.75" />
    <circle cx="122" cy="108" r="5" fill="#fb923c" opacity="0.7" />
    <circle cx="218" cy="96" r="4.5" fill="#a3e635" opacity="0.7" />

    {/* Sliced Watermelon Halves (center focal anchor) */}
    <g transform="translate(148, 80) rotate(-26)">
      <path d="M-30,0 A30,30 0 0,1 30,0 Z" fill="#15803d" />
      <path d="M-25,0 A25,25 0 0,1 25,0 Z" fill="#bbf7d0" />
      <path d="M-21,0 A21,21 0 0,1 21,0 Z" fill="#ef4444" />
      <circle cx="-8" cy="-8" r="1.8" fill="#1f2937" />
      <circle cx="2" cy="-12" r="1.8" fill="#1f2937" />
      <circle cx="11" cy="-7" r="1.8" fill="#1f2937" />
    </g>
    <g transform="translate(168, 102) rotate(-22)">
      <path d="M-30,0 A30,30 0 0,0 30,0 Z" fill="#15803d" />
      <path d="M-25,0 A25,25 0 0,0 25,0 Z" fill="#bbf7d0" />
      <path d="M-21,0 A21,21 0 0,0 21,0 Z" fill="#ef4444" />
      <circle cx="-7" cy="9" r="1.8" fill="#1f2937" />
      <circle cx="5" cy="11" r="1.8" fill="#1f2937" />
    </g>

    {/* Flying Orange (left) */}
    <g transform="translate(82, 114)">
      <circle cx="0" cy="0" r="20" fill="#ea580c" />
      <circle cx="-6" cy="-6" r="6" fill="#fed7aa" opacity="0.35" />
      <ellipse cx="5" cy="-21" rx="6" ry="3" fill="#22c55e" transform="rotate(-20 5 -21)" />
    </g>

    {/* Flying Kiwi (right) */}
    <g transform="translate(232, 66)">
      <circle cx="0" cy="0" r="18" fill="#78350f" />
      <circle cx="0" cy="0" r="14" fill="#84cc16" />
      <circle cx="0" cy="0" r="5" fill="#ecfccb" />
    </g>

    {/* Sizzling Bomb (far right lower) */}
    <g transform="translate(264, 132)">
      <circle cx="0" cy="0" r="18" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
      <path d="M-6,-6 L6,6 M6,-6 L-6,6" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="11" cy="-19" r="4.5" fill="#f97316" />
      <circle cx="11" cy="-19" r="2" fill="#fef08a" />
    </g>

    {/* Sweeping Katana Blade Trail */}
    <path
      d="M36,144 Q148,88 286,34"
      fill="none"
      stroke="url(#fsBlade)"
      strokeWidth="6.5"
      strokeLinecap="round"
    />
  </svg>
);

export const FruitSlashGame: React.FC<FruitSlashGameProps> = ({
  lang,
  sfxEnabled,
  musicEnabled,
  onToggleMusic,
  onExitToHub,
}) => {
  const isAr = lang === 'ar';
  const t = COPY[lang];

  const [view, setView] = useState<SlashView>('TITLE');
  const [mode, setMode] = useState<SlashMode>('classic');
  const [score, setScore] = useState<number>(0);
  const [hearts, setHearts] = useState<number>(MAX_HEARTS);
  const [timeLeft, setTimeLeft] = useState<number>(ZEN_DURATION);
  const [roundMaxCombo, setRoundMaxCombo] = useState<number>(0);
  const [roundSliced, setRoundSliced] = useState<number>(0);
  const [activeEffect, setActiveEffect] = useState<'none' | 'freeze' | 'frenzy'>('none');
  const [stats, setStats] = useState<FruitSlashStats>(() => readFruitSlashStats());

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const woodCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<SlashAudio>(new SlashAudio());

  const viewRef = useRef<SlashView>(view);
  const modeRef = useRef<SlashMode>(mode);
  viewRef.current = view;
  modeRef.current = mode;

  useGameMusic('fruit-merge', musicEnabled && view === 'PLAYING');

  useEffect(() => {
    audioRef.current.enabled = sfxEnabled;
  }, [sfxEnabled]);

  useEffect(() => {
    return () => {
      audioRef.current.dispose();
    };
  }, []);

  // Mutable 60fps simulation ref
  const simRef = useRef({
    nextId: 1,
    score: 0,
    hearts: MAX_HEARTS,
    timeLeft: ZEN_DURATION,
    spawnTimer: 0.4,
    frenzyTimer: 0,
    frenzySpawnTimer: 0,
    freezeTimer: 0,
    shakeTimer: 0,
    flashAlpha: 0,
    flashColor: '#ffffff',
    roundSliced: 0,
    roundMaxCombo: 0,
    comboCount: 0,
    comboWindow: 0,
    comboX: CANVAS_W / 2,
    comboY: CANVAS_H / 2,
    items: [] as WholeItem[],
    halves: [] as SlicedHalf[],
    drops: [] as JuiceDrop[],
    stains: [] as BoardStain[],
    callouts: [] as FloatingCallout[],
    blade: [] as BladePoint[],
    pointerDown: false,
    lastPt: null as { x: number; y: number } | null,
    elapsed: 0,
  });

  const commitStats = useCallback((finalScore: number, maxCombo: number, sliced: number, m: SlashMode) => {
    setStats((prev) => {
      const next: FruitSlashStats = {
        bestClassic: m === 'classic' ? Math.max(prev.bestClassic, finalScore) : prev.bestClassic,
        bestZen: m === 'zen' ? Math.max(prev.bestZen, finalScore) : prev.bestZen,
        bestCombo: Math.max(prev.bestCombo, maxCombo),
        totalSliced: prev.totalSliced + sliced,
      };
      saveFruitSlashStats(next);
      return next;
    });
  }, []);

  const startRound = useCallback((chosenMode: SlashMode) => {
    const s = simRef.current;
    s.score = 0;
    s.hearts = MAX_HEARTS;
    s.timeLeft = ZEN_DURATION;
    s.spawnTimer = 0.35;
    s.frenzyTimer = 0;
    s.frenzySpawnTimer = 0;
    s.freezeTimer = 0;
    s.shakeTimer = 0;
    s.flashAlpha = 0;
    s.roundSliced = 0;
    s.roundMaxCombo = 0;
    s.comboCount = 0;
    s.comboWindow = 0;
    s.items = [];
    s.halves = [];
    s.drops = [];
    s.stains = [];
    s.callouts = [];
    s.blade = [];
    s.pointerDown = false;
    s.lastPt = null;
    s.elapsed = 0;

    setMode(chosenMode);
    modeRef.current = chosenMode;
    setScore(0);
    setHearts(MAX_HEARTS);
    setTimeLeft(ZEN_DURATION);
    setRoundMaxCombo(0);
    setRoundSliced(0);
    setActiveEffect('none');
    setView('PLAYING');
    viewRef.current = 'PLAYING';
  }, []);

  const finishRound = useCallback(() => {
    const s = simRef.current;
    viewRef.current = 'GAME_OVER';
    setView('GAME_OVER');
    setScore(s.score);
    setRoundMaxCombo(s.roundMaxCombo);
    setRoundSliced(s.roundSliced);
    commitStats(s.score, s.roundMaxCombo, s.roundSliced, modeRef.current);
  }, [commitStats]);

  // Keyboard Escape / Pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (viewRef.current === 'PLAYING') {
          setView('PAUSED');
        } else if (viewRef.current === 'PAUSED') {
          setView('PLAYING');
        } else {
          onExitToHub();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onExitToHub]);

  // Spawn helper
  const spawnItem = useCallback((kindOverride?: FruitKind, fromSide = false) => {
    const s = simRef.current;
    let kind: FruitKind;
    if (kindOverride) {
      kind = kindOverride;
    } else {
      const r = Math.random();
      if (modeRef.current === 'classic' && r < 0.145) {
        kind = 'bomb';
      } else if (r > 0.965) {
        kind = 'frenzy';
      } else if (r > 0.93) {
        kind = 'freeze';
      } else {
        kind = REGULAR_FRUITS[Math.floor(Math.random() * REGULAR_FRUITS.length)];
      }
    }

    const spec = FRUIT_SPECS[kind];
    let x: number;
    let y: number;
    let vx: number;
    let vy: number;

    if (fromSide) {
      const left = Math.random() < 0.5;
      x = left ? -24 : CANVAS_W + 24;
      y = CANVAS_H * (0.45 + Math.random() * 0.35);
      vx = (left ? 1 : -1) * (340 + Math.random() * 220);
      vy = -(430 + Math.random() * 190);
    } else {
      x = 120 + Math.random() * (CANVAS_W - 240);
      y = CANVAS_H + spec.radius + 10;
      const aimX = CANVAS_W * 0.5 + (Math.random() - 0.5) * 340;
      vx = (aimX - x) * (0.55 + Math.random() * 0.45);
      vy = -(640 + Math.random() * 185);
    }

    s.items.push({
      id: s.nextId++,
      spec,
      x,
      y,
      vx,
      vy,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 4.5,
      entered: false,
    });
  }, []);

  // Slice collision check along pointer segment
  const processBladeSegment = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      if (viewRef.current !== 'PLAYING') return;
      const s = simRef.current;
      const segDist = Math.hypot(x2 - x1, y2 - y1);
      if (segDist < 4) return;
      if (segDist > 16) audioRef.current.playWhoosh();

      const sliceAngle = Math.atan2(y2 - y1, x2 - x1);
      const remaining: WholeItem[] = [];
      let hitBomb = false;

      for (const item of s.items) {
        const hit = segmentCircleHit(x1, y1, x2, y2, item.x, item.y, item.spec.radius * 1.12);
        if (!hit) {
          remaining.push(item);
          continue;
        }

        if (item.spec.isBomb) {
          hitBomb = true;
          audioRef.current.playBomb();
          s.shakeTimer = 0.45;
          s.flashAlpha = 0.92;
          s.flashColor = '#fef08a';
          for (let i = 0; i < 36; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 160 + Math.random() * 440;
            s.drops.push({
              x: item.x,
              y: item.y,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              r: 4 + Math.random() * 6,
              color: i % 2 === 0 ? '#f97316' : '#fef08a',
              life: 0.7,
              maxLife: 0.7,
            });
          }
          s.callouts.push({
            text: t.bombHit,
            x: item.x,
            y: item.y,
            color: '#fca5a5',
            scale: 1.35,
            life: 1.1,
            maxLife: 1.1,
          });
          continue;
        }

        // Fruit sliced!
        s.roundSliced += 1;
        s.score += item.spec.points;
        s.comboCount += 1;
        s.comboWindow = 0.24;
        s.comboX = item.x;
        s.comboY = item.y;
        audioRef.current.playSlice(s.comboCount);

        // Two flying halves
        const perpX = -Math.sin(sliceAngle);
        const perpY = Math.cos(sliceAngle);
        for (const side of [-1, 1] as const) {
          s.halves.push({
            spec: item.spec,
            x: item.x + perpX * side * 8,
            y: item.y + perpY * side * 8,
            vx: item.vx + perpX * side * 120,
            vy: item.vy - 45 + perpY * side * 60,
            rot: sliceAngle,
            vrot: side * (2.6 + Math.random() * 2.2),
            side,
            alpha: 1,
          });
        }

        // Juice droplets
        for (let i = 0; i < 16; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 90 + Math.random() * 280;
          s.drops.push({
            x: item.x,
            y: item.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 60,
            r: 3 + Math.random() * 4.5,
            color: item.spec.juice,
            life: 0.55 + Math.random() * 0.25,
            maxLife: 0.8,
          });
        }

        // Subtle stain on wood dojo backdrop
        if (s.stains.length < 18) {
          s.stains.push({
            x: item.x,
            y: item.y,
            r: item.spec.radius * (0.75 + Math.random() * 0.45),
            color: item.spec.juice,
            alpha: 0.26,
          });
        }

        // Special fruits
        if (item.spec.isFreeze) {
          s.freezeTimer = 5.5;
          setActiveEffect('freeze');
          audioRef.current.playFreeze();
          s.callouts.push({
            text: t.freezeBanner,
            x: item.x,
            y: item.y - 16,
            color: '#7dd3fc',
            scale: 1.25,
            life: 1.2,
            maxLife: 1.2,
          });
        } else if (item.spec.isFrenzy) {
          s.frenzyTimer = 5.0;
          s.frenzySpawnTimer = 0.05;
          setActiveEffect('frenzy');
          audioRef.current.playCombo(4);
          s.callouts.push({
            text: t.frenzyBanner,
            x: item.x,
            y: item.y - 16,
            color: '#fde047',
            scale: 1.3,
            life: 1.2,
            maxLife: 1.2,
          });
        } else {
          s.callouts.push({
            text: `+${item.spec.points}`,
            x: item.x,
            y: item.y - 12,
            color: '#fffbeb',
            scale: 1,
            life: 0.65,
            maxLife: 0.65,
          });
        }
      }

      s.items = remaining;
      setScore(s.score);

      if (hitBomb) {
        s.hearts = 0;
        setHearts(0);
        finishRound();
      }
    },
    [finishRound, t.bombHit, t.freezeBanner, t.frenzyBanner]
  );

  // Main 60fps Canvas Loop
  useEffect(() => {
    if (!woodCanvasRef.current) {
      woodCanvasRef.current = buildDojoWoodCanvas();
    }
    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      const s = simRef.current;

      if (viewRef.current === 'PLAYING') {
        s.elapsed += rawDt;

        // Time scale when Freeze Berry is active
        const timeScale = s.freezeTimer > 0 ? 0.45 : 1.0;
        const dt = rawDt * timeScale;

        if (s.freezeTimer > 0) {
          s.freezeTimer = Math.max(0, s.freezeTimer - rawDt);
          if (s.freezeTimer <= 0 && s.frenzyTimer <= 0) setActiveEffect('none');
        }
        if (s.frenzyTimer > 0) {
          s.frenzyTimer = Math.max(0, s.frenzyTimer - rawDt);
          s.frenzySpawnTimer -= rawDt;
          if (s.frenzySpawnTimer <= 0) {
            s.frenzySpawnTimer = 0.24;
            const fKind = REGULAR_FRUITS[Math.floor(Math.random() * REGULAR_FRUITS.length)];
            spawnItem(fKind, true);
          }
          if (s.frenzyTimer <= 0 && s.freezeTimer <= 0) setActiveEffect('none');
        }

        // Zen countdown
        if (modeRef.current === 'zen') {
          const prevSec = Math.ceil(s.timeLeft);
          s.timeLeft = Math.max(0, s.timeLeft - (s.freezeTimer > 0 ? rawDt * 0.45 : rawDt));
          const curSec = Math.ceil(s.timeLeft);
          if (curSec !== prevSec) setTimeLeft(curSec);
          if (s.timeLeft <= 0) {
            finishRound();
          }
        }

        // Combo payout window
        if (s.comboWindow > 0) {
          s.comboWindow -= rawDt;
          if (s.comboWindow <= 0) {
            if (s.comboCount >= 3) {
              const bonus = s.comboCount * 15;
              s.score += bonus;
              if (s.comboCount > s.roundMaxCombo) s.roundMaxCombo = s.comboCount;
              setScore(s.score);
              audioRef.current.playCombo(s.comboCount);
              s.callouts.push({
                text: `${s.comboCount}× ${t.comboWord}! +${bonus}`,
                x: Math.max(110, Math.min(CANVAS_W - 110, s.comboX)),
                y: Math.max(70, Math.min(CANVAS_H - 90, s.comboY - 26)),
                color: '#fde047',
                scale: 1.35,
                life: 1.15,
                maxLife: 1.15,
              });
            }
            s.comboCount = 0;
          }
        }

        // Wave spawner
        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0) {
          const difficulty = Math.min(1, s.elapsed / 65);
          const count = 2 + Math.floor(Math.random() * (2 + difficulty * 3));
          for (let i = 0; i < count; i++) {
            spawnItem();
          }
          s.spawnTimer = Math.max(0.85, 1.85 - difficulty * 0.72);
        }

        // Physics for whole fruits
        const gravity = 690;
        const aliveItems: WholeItem[] = [];
        for (const item of s.items) {
          item.x += item.vx * dt;
          item.y += item.vy * dt;
          item.vy += gravity * dt;
          item.rot += item.vrot * dt;
          if (item.y < CANVAS_H - 10) item.entered = true;

          if (item.y > CANVAS_H + 85 && item.vy > 0) {
            // Missed an unsliced regular fruit in Classic mode
            if (
              modeRef.current === 'classic' &&
              item.entered &&
              !item.spec.isBomb &&
              !item.spec.isFreeze &&
              !item.spec.isFrenzy
            ) {
              s.hearts = Math.max(0, s.hearts - 1);
              setHearts(s.hearts);
              s.shakeTimer = 0.22;
              s.flashAlpha = 0.28;
              s.flashColor = '#ef4444';
              audioRef.current.playMiss();
              if (s.hearts <= 0) {
                finishRound();
              }
            }
            continue;
          }
          aliveItems.push(item);
        }
        s.items = aliveItems;

        // Sliced halves
        const aliveHalves: SlicedHalf[] = [];
        for (const h of s.halves) {
          h.x += h.vx * dt;
          h.y += h.vy * dt;
          h.vy += gravity * 1.05 * dt;
          h.rot += h.vrot * dt;
          h.alpha -= rawDt * 0.45;
          if (h.y < CANVAS_H + 90 && h.alpha > 0.02) aliveHalves.push(h);
        }
        s.halves = aliveHalves;

        // Juice drops
        const aliveDrops: JuiceDrop[] = [];
        for (const d of s.drops) {
          d.x += d.vx * rawDt;
          d.y += d.vy * rawDt;
          d.vy += 520 * rawDt;
          d.life -= rawDt;
          if (d.life > 0) aliveDrops.push(d);
        }
        s.drops = aliveDrops;

        // Fade wood stains slowly
        s.stains = s.stains
          .map((st) => ({ ...st, alpha: st.alpha - rawDt * 0.045 }))
          .filter((st) => st.alpha > 0.01);

        // Callouts
        s.callouts = s.callouts
          .map((c) => ({ ...c, y: c.y - 42 * rawDt, life: c.life - rawDt }))
          .filter((c) => c.life > 0);

        if (s.shakeTimer > 0) s.shakeTimer = Math.max(0, s.shakeTimer - rawDt);
        if (s.flashAlpha > 0) s.flashAlpha = Math.max(0, s.flashAlpha - rawDt * 1.9);
      }

      // Prune blade trail older than 135ms
      const cutoff = now - 135;
      if (s.blade.length > 0) {
        s.blade = s.blade.filter((p) => p.time >= cutoff);
      }

      // Render 2D Canvas
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.save();
        if (s.shakeTimer > 0) {
          const mag = 9 * (s.shakeTimer / 0.35);
          ctx.translate((Math.random() - 0.5) * mag * 2, (Math.random() - 0.5) * mag * 2);
        }

        if (woodCanvasRef.current) {
          ctx.drawImage(woodCanvasRef.current, 0, 0);
        }

        // Freeze icy border overlay
        if (s.freezeTimer > 0) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
          ctx.strokeStyle = 'rgba(125, 211, 252, 0.6)';
          ctx.lineWidth = 10;
          ctx.strokeRect(5, 5, CANVAS_W - 10, CANVAS_H - 10);
        } else if (s.frenzyTimer > 0) {
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
          ctx.lineWidth = 10;
          ctx.strokeRect(5, 5, CANVAS_W - 10, CANVAS_H - 10);
        }

        // Wood stains
        for (const st of s.stains) {
          ctx.save();
          ctx.globalAlpha = st.alpha;
          ctx.fillStyle = st.color;
          ctx.beginPath();
          ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Sliced halves
        for (const h of s.halves) {
          drawSlicedHalf(ctx, h);
        }

        // Whole flying fruits & bombs
        const nowSec = now * 0.001;
        for (const item of s.items) {
          drawWholeFruit(ctx, item, nowSec);
        }

        // Juice droplets
        for (const d of s.drops) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, d.life / d.maxLife);
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Calligraphic katana slash trail
        if (s.blade.length >= 2) {
          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          for (let i = 1; i < s.blade.length; i++) {
            const p0 = s.blade[i - 1];
            const p1 = s.blade[i];
            const frac = i / s.blade.length;
            ctx.strokeStyle =
              s.freezeTimer > 0
                ? `rgba(125, 211, 252, ${frac * 0.95})`
                : `rgba(254, 249, 195, ${frac * 0.95})`;
            ctx.lineWidth = 2 + frac * 11;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();

            ctx.strokeStyle = `rgba(255, 255, 255, ${frac})`;
            ctx.lineWidth = 1 + frac * 4.5;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Floating callouts
        for (const c of s.callouts) {
          const alpha = Math.min(1, c.life / 0.3);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.font = `900 ${Math.round(22 * c.scale)}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(0,0,0,0.65)';
          ctx.fillText(c.text, c.x + 2, c.y + 2);
          ctx.fillStyle = c.color;
          ctx.fillText(c.text, c.x, c.y);
          ctx.restore();
        }

        // Hit/bomb flash
        if (s.flashAlpha > 0.01) {
          ctx.fillStyle = s.flashColor;
          ctx.globalAlpha = s.flashAlpha;
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
          ctx.globalAlpha = 1;
        }

        ctx.restore();
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [finishRound, spawnItem, t.comboWord]);

  const toCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (viewRef.current !== 'PLAYING') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = toCanvasCoords(e);
    const s = simRef.current;
    s.pointerDown = true;
    s.lastPt = pt;
    s.blade.push({ x: pt.x, y: pt.y, time: performance.now() });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = simRef.current;
    if (!s.pointerDown || viewRef.current !== 'PLAYING') return;
    const pt = toCanvasCoords(e);
    if (s.lastPt) {
      processBladeSegment(s.lastPt.x, s.lastPt.y, pt.x, pt.y);
    }
    s.lastPt = pt;
    s.blade.push({ x: pt.x, y: pt.y, time: performance.now() });
  };

  const handlePointerUp = () => {
    const s = simRef.current;
    s.pointerDown = false;
    s.lastPt = null;
  };

  const currentBest = mode === 'classic' ? stats.bestClassic : stats.bestZen;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex flex-col bg-[#1b1009] text-amber-50 select-none overflow-hidden"
    >
      {/* Compact Top HUD */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3 px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExitToHub}
            className="px-3 py-1.5 rounded-lg bg-[#2e1c11] hover:bg-[#3f2718] border border-amber-200/15 text-xs sm:text-sm font-bold text-amber-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            {t.exitBtn}
          </button>
          <span className="text-sm sm:text-base font-black text-amber-200 whitespace-nowrap">
            {t.title}
          </span>
        </div>

        {view !== 'TITLE' && (
          <div className="flex items-center gap-4 text-xs sm:text-sm font-bold tabular-nums">
            <span className="text-amber-300">
              {t.scoreLabel}: <strong className="text-white text-base">{score}</strong>
            </span>
            <span className="hidden sm:inline text-amber-200/75">
              {t.bestLabel}: {Math.max(currentBest, score)}
            </span>
            {mode === 'classic' ? (
              <span className="flex items-center gap-1" aria-label={`Hearts: ${hearts}`}>
                {Array.from({ length: MAX_HEARTS }, (_, i) => (
                  <svg
                    key={i}
                    viewBox="0 0 24 24"
                    className={`w-4.5 h-4.5 ${i < hearts ? 'text-rose-500' : 'text-stone-700'}`}
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                ))}
              </span>
            ) : (
              <span className="text-sky-300 font-black">
                {t.timeLabel}: {timeLeft}s
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {view === 'PLAYING' && (
            <button
              type="button"
              onClick={() => setView('PAUSED')}
              className="px-3 py-1.5 rounded-lg bg-[#2e1c11] hover:bg-[#3f2718] border border-amber-200/15 text-xs font-bold text-amber-100 cursor-pointer whitespace-nowrap"
            >
              {t.pauseBtn}
            </button>
          )}
          <MusicToggleButton
            enabled={musicEnabled}
            onToggle={onToggleMusic}
            lang={lang}
          />
        </div>
      </header>

      {/* Main 2D Dojo Canvas Stage */}
      <main className="relative flex-1 flex items-center justify-center px-3 pb-3 min-h-0">
        <div className="relative w-full max-w-5xl aspect-[960/560] max-h-full rounded-2xl overflow-hidden border-2 border-[#6a4128] shadow-2xl bg-[#2a170d]">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="block w-full h-full touch-none cursor-crosshair"
          />

          {/* Active Power-Up Indicator */}
          {view === 'PLAYING' && activeEffect !== 'none' && (
            <div className="pointer-events-none absolute top-3 inset-x-0 flex justify-center">
              <span
                className={`px-3.5 py-1 rounded-lg text-xs font-black tracking-wide shadow ${
                  activeEffect === 'freeze'
                    ? 'bg-sky-500/90 text-slate-950'
                    : 'bg-amber-400/95 text-slate-950'
                }`}
              >
                {activeEffect === 'freeze' ? t.freezeBanner : t.frenzyBanner}
              </span>
            </div>
          )}

          {/* TITLE MENU OVERLAY */}
          {view === 'TITLE' && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#180d07]/80 p-4">
              <div className="w-full max-w-lg rounded-2xl border border-amber-300/30 bg-[#2a170e] p-6 text-center shadow-2xl">
                <h1 className="text-2xl sm:text-3xl font-black text-amber-200">
                  {t.title}
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-amber-100/80">
                  {t.subtitle}
                </p>

                <div className="grid grid-cols-2 gap-3 my-5 text-start">
                  <button
                    type="button"
                    onClick={() => setMode('classic')}
                    className={`p-3.5 rounded-xl border transition-colors cursor-pointer ${
                      mode === 'classic'
                        ? 'border-amber-400 bg-amber-500/15 text-white'
                        : 'border-white/12 bg-black/25 text-amber-100/75 hover:bg-black/35'
                    }`}
                  >
                    <div className="text-sm font-black text-amber-300">{t.classicMode}</div>
                    <div className="text-[11px] mt-1 leading-snug opacity-85">{t.classicDesc}</div>
                    <div className="text-[11px] font-bold text-amber-200 mt-2 tabular-nums">
                      {t.bestLabel}: {stats.bestClassic}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('zen')}
                    className={`p-3.5 rounded-xl border transition-colors cursor-pointer ${
                      mode === 'zen'
                        ? 'border-sky-400 bg-sky-500/15 text-white'
                        : 'border-white/12 bg-black/25 text-amber-100/75 hover:bg-black/35'
                    }`}
                  >
                    <div className="text-sm font-black text-sky-300">{t.zenMode}</div>
                    <div className="text-[11px] mt-1 leading-snug opacity-85">{t.zenDesc}</div>
                    <div className="text-[11px] font-bold text-sky-200 mt-2 tabular-nums">
                      {t.bestLabel}: {stats.bestZen}
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => startRound(mode)}
                  className="w-full py-3 rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 hover:from-amber-200 hover:to-orange-400 text-stone-950 font-black text-base transition-colors cursor-pointer"
                >
                  {t.startBtn}
                </button>
              </div>
            </div>
          )}

          {/* PAUSED OVERLAY */}
          {view === 'PAUSED' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-xs rounded-2xl border border-amber-300/30 bg-[#2a170e] p-5 text-center shadow-2xl">
                <h2 className="text-xl font-black text-amber-200 mb-4">{t.pausedTitle}</h2>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setView('PLAYING')}
                    className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm cursor-pointer"
                  >
                    {t.resumeBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => startRound(mode)}
                    className="w-full py-2.5 rounded-xl bg-[#3d2315] hover:bg-[#4e2d1b] text-amber-100 font-bold text-sm cursor-pointer"
                  >
                    {t.restartBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('TITLE')}
                    className="w-full py-2 rounded-xl border border-white/15 text-amber-200/90 hover:bg-white/5 font-bold text-xs cursor-pointer"
                  >
                    {t.menuBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GAME OVER OVERLAY */}
          {view === 'GAME_OVER' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/75 p-4">
              <div className="w-full max-w-sm rounded-2xl border border-amber-300/35 bg-[#2a170e] p-6 text-center shadow-2xl">
                <h2 className="text-2xl font-black text-amber-200">
                  {mode === 'zen' ? t.zenOverTitle : t.gameOverTitle}
                </h2>

                <div className="grid grid-cols-3 gap-2 my-4 text-xs tabular-nums">
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/10">
                    <div className="text-amber-200/70">{t.scoreLabel}</div>
                    <div className="text-lg font-black text-white mt-0.5">{score}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/10">
                    <div className="text-amber-200/70">{t.slicedLabel}</div>
                    <div className="text-lg font-black text-emerald-300 mt-0.5">{roundSliced}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/10">
                    <div className="text-amber-200/70">{t.maxComboLabel}</div>
                    <div className="text-lg font-black text-amber-300 mt-0.5">
                      {roundMaxCombo > 0 ? `${roundMaxCombo}×` : '—'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => startRound(mode)}
                    className="w-full py-3 rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 hover:from-amber-200 hover:to-orange-400 text-stone-950 font-black text-sm sm:text-base cursor-pointer"
                  >
                    {t.restartBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('TITLE')}
                    className="w-full py-2.5 rounded-xl bg-[#3d2315] hover:bg-[#4e2d1b] text-amber-100 font-bold text-xs sm:text-sm cursor-pointer"
                  >
                    {t.menuBtn}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="pb-2 text-center text-[11px] font-semibold text-amber-200/60 shrink-0">
        {t.dragHint}
      </footer>
    </div>
  );
};
