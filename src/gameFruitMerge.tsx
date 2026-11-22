import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MusicToggleButton, useGameMusic } from './gameMusic';

export interface FruitMergeGameProps {
  lang: 'ar' | 'en';
  sfxEnabled: boolean;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  onExitToHub: () => void;
}

export interface FruitMergeStats {
  bestScore: number;
  maxTier: number;
}

interface FruitSpec {
  tier: number;
  radius: number;
  score: number;
  coinReward: number;
  nameAr: string;
  nameEn: string;
  fill: string;
  shade: string;
  highlight: string;
  stroke: string;
  juice: string;
}

interface FruitMergeWallet {
  coins: number;
  swaps: number;
  shakes: number;
  clears: number;
}

interface FruitBody {
  id: number;
  tier: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  radius: number;
  spawnedAt: number;
  scaleAnim: number; // squash/pop spring on spawn or merge
  merged: boolean;
}

interface MergeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  life: number;
  maxLife: number;
}

interface MergeRing {
  x: number;
  y: number;
  r: number;
  maxR: number;
  color: string;
  life: number;
  maxLife: number;
}

interface FloatingScore {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

const STORAGE_KEY = 'point_catcher_fruit_merge_stats_v1';
const WALLET_STORAGE_KEY = 'point_catcher_fruit_merge_wallet_v1';

const SHOP_PRICES = {
  swap: 25,
  shake: 45,
  clearSmall: 60,
} as const;

const JACKPOT_COINS = 300;

// Logical canvas dimensions (tall crisp orchard glass jar)
const WORLD_W = 420;
const WORLD_H = 560;
const WALL_LEFT = 16;
const WALL_RIGHT = WORLD_W - 16;
const FLOOR_Y = WORLD_H - 16;
const DANGER_Y = 98;
const DROP_Y = 46;
const DROP_COOLDOWN_MS = 420;
const DANGER_HOLD_SECONDS = 2.2;

// 11 handcrafted fruit evolution tiers (Cherry -> Golden Watermelon)
export const FRUIT_TIERS: FruitSpec[] = [
  {
    tier: 0,
    radius: 16,
    score: 2,
    coinReward: 0,
    nameAr: 'كرز',
    nameEn: 'Cherry',
    fill: '#e11d48',
    shade: '#9f1239',
    highlight: '#fda4af',
    stroke: '#4c0519',
    juice: '#fb7185',
  },
  {
    tier: 1,
    radius: 22,
    score: 6,
    coinReward: 2,
    nameAr: 'فراولة',
    nameEn: 'Strawberry',
    fill: '#f43f5e',
    shade: '#be123c',
    highlight: '#fecdd3',
    stroke: '#881337',
    juice: '#fb7185',
  },
  {
    tier: 2,
    radius: 28,
    score: 12,
    coinReward: 4,
    nameAr: 'عنب',
    nameEn: 'Grape',
    fill: '#9333ea',
    shade: '#6b21a8',
    highlight: '#e9d5ff',
    stroke: '#3b0764',
    juice: '#c084fc',
  },
  {
    tier: 3,
    radius: 34,
    score: 20,
    coinReward: 7,
    nameAr: 'برتقال',
    nameEn: 'Orange',
    fill: '#f97316',
    shade: '#c2410c',
    highlight: '#fed7aa',
    stroke: '#7c2d12',
    juice: '#fb923c',
  },
  {
    tier: 4,
    radius: 41,
    score: 32,
    coinReward: 12,
    nameAr: 'تفاحة',
    nameEn: 'Apple',
    fill: '#dc2626',
    shade: '#991b1b',
    highlight: '#fca5a5',
    stroke: '#450a0a',
    juice: '#ef4444',
  },
  {
    tier: 5,
    radius: 48,
    score: 48,
    coinReward: 18,
    nameAr: 'كمثرى',
    nameEn: 'Pear',
    fill: '#a3e635',
    shade: '#4d7c0f',
    highlight: '#ecfccb',
    stroke: '#365314',
    juice: '#bef264',
  },
  {
    tier: 6,
    radius: 55,
    score: 68,
    coinReward: 26,
    nameAr: 'خوخ',
    nameEn: 'Peach',
    fill: '#fb7185',
    shade: '#e11d48',
    highlight: '#ffe4e6',
    stroke: '#881337',
    juice: '#fda4af',
  },
  {
    tier: 7,
    radius: 63,
    score: 96,
    coinReward: 38,
    nameAr: 'أناناس',
    nameEn: 'Pineapple',
    fill: '#facc15',
    shade: '#ca8a04',
    highlight: '#fef9c3',
    stroke: '#713f12',
    juice: '#fde047',
  },
  {
    tier: 8,
    radius: 72,
    score: 135,
    coinReward: 55,
    nameAr: 'شمام',
    nameEn: 'Melon',
    fill: '#34d399',
    shade: '#059669',
    highlight: '#d1fae5',
    stroke: '#064e3b',
    juice: '#6ee7b7',
  },
  {
    tier: 9,
    radius: 82,
    score: 200,
    coinReward: 85,
    nameAr: 'بطيخ',
    nameEn: 'Watermelon',
    fill: '#16a34a',
    shade: '#14532d',
    highlight: '#86efac',
    stroke: '#052e16',
    juice: '#4ade80',
  },
  {
    tier: 10,
    radius: 90,
    score: 500,
    coinReward: 150,
    nameAr: 'بطيخ ذهبي',
    nameEn: 'Golden Melon',
    fill: '#f59e0b',
    shade: '#b45309',
    highlight: '#fef08a',
    stroke: '#451a03',
    juice: '#fde047',
  },
];

// Strictly capped at Fruit #4 (Orange, tier 3): anything rarer has 0% drop chance,
// and rarer droppable fruits (Grape & Orange) have halved probabilities.
const DROP_WEIGHTS = [0.5, 0.32, 0.11, 0.07];

function rollDropTier(): number {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < DROP_WEIGHTS.length; i++) {
    acc += DROP_WEIGHTS[i];
    if (r <= acc) return i;
  }
  return 0;
}

export function readFruitMergeStats(): FruitMergeStats {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { bestScore: 0, maxTier: 0 };
    const parsed = JSON.parse(raw) as Partial<FruitMergeStats>;
    return {
      bestScore:
        typeof parsed.bestScore === 'number' && Number.isFinite(parsed.bestScore)
          ? Math.max(0, Math.floor(parsed.bestScore))
          : 0,
      maxTier:
        typeof parsed.maxTier === 'number' && Number.isFinite(parsed.maxTier)
          ? Math.max(0, Math.min(FRUIT_TIERS.length - 1, Math.floor(parsed.maxTier)))
          : 0,
    };
  } catch {
    return { bestScore: 0, maxTier: 0 };
  }
}

function saveFruitMergeStats(stats: FruitMergeStats): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage errors
  }
}

function readFruitMergeWallet(): FruitMergeWallet {
  try {
    const raw = window.localStorage.getItem(WALLET_STORAGE_KEY);
    if (!raw) return { coins: 0, swaps: 3, shakes: 2, clears: 2 };
    const parsed = JSON.parse(raw) as Partial<FruitMergeWallet>;
    return {
      coins:
        typeof parsed.coins === 'number' && Number.isFinite(parsed.coins)
          ? Math.max(0, Math.floor(parsed.coins))
          : 0,
      swaps:
        typeof parsed.swaps === 'number' && Number.isFinite(parsed.swaps)
          ? Math.max(0, Math.floor(parsed.swaps))
          : 3,
      shakes:
        typeof parsed.shakes === 'number' && Number.isFinite(parsed.shakes)
          ? Math.max(0, Math.floor(parsed.shakes))
          : 2,
      clears:
        typeof parsed.clears === 'number' && Number.isFinite(parsed.clears)
          ? Math.max(0, Math.floor(parsed.clears))
          : 2,
    };
  } catch {
    return { coins: 0, swaps: 3, shakes: 2, clears: 2 };
  }
}

function saveFruitMergeWallet(wallet: FruitMergeWallet): void {
  try {
    window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
  } catch {
    // Ignore storage errors
  }
}

class MergeAudio {
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

  public playDrop(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.085);
    gain.gain.setValueAtTime(0.085, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playMerge(tier: number, combo: number): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const base = 330 * Math.pow(1.075, Math.min(14, tier + combo));
    [base, base * 1.25, base * 1.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      const t = now + idx * 0.032;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.085, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  public playJackpot(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.055;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  public playShake(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.14);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playBuy(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 880.0].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.06;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  public playGameOver(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [392.0, 349.23, 293.66, 220.0].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + idx * 0.11;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.065, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }
}

/**
 * Draws a charming, handcrafted 2D vector fruit at (0, 0) in local rotated space.
 */
function drawFruitGraphic(
  ctx: CanvasRenderingContext2D,
  tier: number,
  radius: number,
  showFace = true
): void {
  const spec = FRUIT_TIERS[Math.max(0, Math.min(FRUIT_TIERS.length - 1, tier))];
  const r = radius;

  // Radial spherical gradient for plump juicy depth
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.32, r * 0.1, 0, 0, r * 1.05);
  grad.addColorStop(0, spec.highlight);
  grad.addColorStop(0.28, spec.fill);
  grad.addColorStop(1, spec.shade);

  ctx.save();

  // Base fruit silhouette
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Tier-specific signature surface details clipped inside circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  if (tier === 1) {
    // Strawberry seeds
    ctx.fillStyle = '#fef08a';
    const seedCoords = [
      [-0.45, -0.25],
      [0.45, -0.22],
      [-0.3, 0.36],
      [0.32, 0.38],
      [0, 0.56],
      [-0.58, 0.15],
      [0.58, 0.12],
    ];
    for (const [sx, sy] of seedCoords) {
      ctx.beginPath();
      ctx.ellipse(sx * r, sy * r, r * 0.06, r * 0.1, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (tier === 2) {
    // Grape subtle cluster dimples
    ctx.fillStyle = 'rgba(233, 213, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.25, r * 0.3, 0, Math.PI * 2);
    ctx.arc(r * 0.35, -r * 0.2, r * 0.26, 0, Math.PI * 2);
    ctx.arc(0, r * 0.34, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
  } else if (tier === 5) {
    // Pear soft blush + speckles
    ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
    ctx.beginPath();
    ctx.arc(r * 0.25, r * 0.18, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else if (tier === 6) {
    // Peach warm golden cheek + soft cleft line
    const blush = ctx.createRadialGradient(r * 0.3, -r * 0.2, r * 0.1, r * 0.25, -r * 0.15, r * 0.85);
    blush.addColorStop(0, 'rgba(253, 224, 71, 0.65)');
    blush.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = blush;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.strokeStyle = 'rgba(159, 18, 57, 0.35)';
    ctx.lineWidth = Math.max(1.6, r * 0.05);
    ctx.beginPath();
    ctx.arc(r * 0.1, 0, r * 0.82, -Math.PI * 0.45, Math.PI * 0.3);
    ctx.stroke();
  } else if (tier === 7) {
    // Pineapple diagonal lattice lines
    ctx.strokeStyle = 'rgba(161, 98, 7, 0.34)';
    ctx.lineWidth = Math.max(1.5, r * 0.045);
    const step = r * 0.38;
    for (let d = -r * 2; d <= r * 2; d += step) {
      ctx.beginPath();
      ctx.moveTo(d, -r);
      ctx.lineTo(d + r * 1.4, r);
      ctx.moveTo(d, -r);
      ctx.lineTo(d - r * 1.4, r);
      ctx.stroke();
    }
  } else if (tier === 8) {
    // Melon soft pale netting lines
    ctx.strokeStyle = 'rgba(236, 253, 245, 0.38)';
    ctx.lineWidth = Math.max(1.5, r * 0.04);
    for (let a = -0.65; a <= 0.65; a += 0.32) {
      ctx.beginPath();
      ctx.ellipse(a * r * 0.6, 0, r * 0.35, r * 1.05, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (tier === 9 || tier === 10) {
    // Watermelon bold wavy dark stripes (emerald or bronze-gold)
    ctx.strokeStyle = tier === 10 ? 'rgba(120, 53, 15, 0.45)' : 'rgba(5, 46, 22, 0.68)';
    ctx.lineWidth = Math.max(3, r * 0.11);
    ctx.lineCap = 'round';
    for (const sx of [-0.62, -0.22, 0.22, 0.62]) {
      ctx.beginPath();
      ctx.moveTo(sx * r, -r * 1.05);
      ctx.bezierCurveTo(
        (sx - 0.14) * r,
        -r * 0.35,
        (sx + 0.14) * r,
        r * 0.35,
        sx * r,
        r * 1.05
      );
      ctx.stroke();
    }
    if (tier === 10) {
      // Golden Watermelon radiant inner sheen ring
      ctx.strokeStyle = 'rgba(254, 249, 195, 0.65)';
      ctx.lineWidth = Math.max(2, r * 0.05);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Glossy orchard dewdrop highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.32, -r * 0.34, r * 0.24, r * 0.14, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Crisp outer rim
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = spec.stroke;
  ctx.lineWidth = Math.max(1.5, Math.min(3.2, r * 0.055));
  ctx.stroke();

  // Top leaf / crown / stem ornament
  if (tier === 0 || tier === 4 || tier === 5) {
    // Stem + leaf
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = Math.max(1.8, r * 0.09);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.82);
    ctx.quadraticCurveTo(r * 0.08, -r * 1.15, r * 0.22, -r * 1.12);
    ctx.stroke();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(-r * 0.18, -r * 0.92, r * 0.22, r * 0.11, -0.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (tier === 1 || tier === 7) {
    // Leafy green crown (Strawberry / Pineapple)
    ctx.fillStyle = tier === 7 ? '#16a34a' : '#22c55e';
    ctx.beginPath();
    ctx.moveTo(-r * 0.34, -r * 0.78);
    ctx.lineTo(-r * 0.16, -r * 1.1);
    ctx.lineTo(0, -r * 0.88);
    ctx.lineTo(r * 0.16, -r * 1.12);
    ctx.lineTo(r * 0.34, -r * 0.78);
    ctx.closePath();
    ctx.fill();
  } else if (tier === 3 || tier === 6) {
    // Cute single side leaf
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(r * 0.2, -r * 0.9, r * 0.24, r * 0.11, 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (tier === 10) {
    // Golden Crown on Golden Watermelon
    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-r * 0.28, -r * 0.82);
    ctx.lineTo(-r * 0.22, -r * 1.1);
    ctx.lineTo(-r * 0.07, -r * 0.94);
    ctx.lineTo(0, -r * 1.14);
    ctx.lineTo(r * 0.07, -r * 0.94);
    ctx.lineTo(r * 0.22, -r * 1.1);
    ctx.lineTo(r * 0.28, -r * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Cheerful minimal arcade face (readable even on tiny fruits)
  if (showFace && r >= 14) {
    const eyeY = -r * 0.05;
    const eyeX = r * 0.24;
    const eyeR = Math.max(1.6, r * 0.085);

    ctx.fillStyle = '#1e1b18';
    ctx.beginPath();
    ctx.arc(-eyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // Eye catchlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-eyeX - eyeR * 0.28, eyeY - eyeR * 0.28, eyeR * 0.36, 0, Math.PI * 2);
    ctx.arc(eyeX - eyeR * 0.28, eyeY - eyeR * 0.28, eyeR * 0.36, 0, Math.PI * 2);
    ctx.fill();

    // Warm rosy cheeks
    ctx.fillStyle = 'rgba(255, 190, 200, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-eyeX * 1.38, eyeY + r * 0.14, r * 0.11, r * 0.065, 0, 0, Math.PI * 2);
    ctx.ellipse(eyeX * 1.38, eyeY + r * 0.14, r * 0.11, r * 0.065, 0, 0, Math.PI * 2);
    ctx.fill();

    // Happy smile arc
    ctx.strokeStyle = '#1e1b18';
    ctx.lineWidth = Math.max(1.3, r * 0.052);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, eyeY + r * 0.1, r * 0.16, 0.18 * Math.PI, 0.82 * Math.PI);
    ctx.stroke();
  }

  ctx.restore();
}

const COPY_MERGE = {
  ar: {
    exitBtn: 'خروج',
    title: 'دمج الفواكه',
    scoreLabel: 'النقاط',
    bestLabel: 'الأعلى',
    coinsLabel: 'الفلوس',
    nextLabel: 'التالي',
    restartBtn: 'جديد',
    swapBtn: 'تبديل',
    shakeBtn: 'رجّ الكوب',
    clearSmallBtn: 'تنظيف الصغار',
    shopBtn: 'المتجر',
    shopTitle: 'متجر الأدوات',
    shopEarnNote: 'كل فاكهة تحصل عليها بالدمج تمنحك فلوساً (من +2 حتى +150 عملة حسب حجم الفاكهة).',
    ownedLabel: (n: number) => `لديك: ${n}`,
    buyBtn: 'شراء',
    closeBtn: 'إغلاق',
    swapDesc: 'بدّل الفاكهة الحالية بالفاكهة التالية في الدور.',
    shakeDesc: 'هزّ الكوب بقوة لترتيب الفواكه وصنع دمج متتالي.',
    clearSmallDesc: 'أزل كل الكرز والفراولة فوراً لفتح مساحة داخل الكوب.',
    evolutionLabel: 'سلسلة الدمج',
    dangerWarn: 'انتبه! الكوب يمتلئ!',
    gameOverTitle: 'امتلأ الكوب!',
    gameOverSub: (score: number, fruitName: string) =>
      `سجّلت ${score} نقطة ووصلت إلى ${fruitName}!`,
    newRecordBadge: 'رقم قياسي جديد!',
    playAgainBtn: 'العب مجدداً',
    controlsHint: 'حرّك الفاكهة واضغط لإسقاطها · ادمج الفواكه المتشابهة حتى تصل للبطيخ الذهبي!',
    comboText: (n: number) => `كومبو ×${n}`,
    jackpotText: 'بطيخ ذهبي ×2! +1500',
  },
  en: {
    exitBtn: 'Exit',
    title: 'Fruit Merge',
    scoreLabel: 'Score',
    bestLabel: 'Best',
    coinsLabel: 'Coins',
    nextLabel: 'Next',
    restartBtn: 'New',
    swapBtn: 'Swap',
    shakeBtn: 'Shake Jar',
    clearSmallBtn: 'Clear Small',
    shopBtn: 'Shop',
    shopTitle: 'Power-Up Shop',
    shopEarnNote: 'Every fruit you create by merging rewards coins (+2 up to +150 by fruit size).',
    ownedLabel: (n: number) => `Owned: ${n}`,
    buyBtn: 'Buy',
    closeBtn: 'Close',
    swapDesc: 'Swap your current fruit with the next fruit in line.',
    shakeDesc: 'Shake the jar to settle gaps and trigger chain merges.',
    clearSmallDesc: 'Clear all Cherries & Strawberries immediately for space.',
    evolutionLabel: 'Merge Chain',
    dangerWarn: 'Watch out! Jar overflowing!',
    gameOverTitle: 'Jar Overflowed!',
    gameOverSub: (score: number, fruitName: string) =>
      `You scored ${score} pts and reached ${fruitName}!`,
    newRecordBadge: 'New High Score!',
    playAgainBtn: 'Play Again',
    controlsHint: 'Move & click/tap to drop · Merge matching fruits all the way to Golden Melon!',
    comboText: (n: number) => `COMBO ×${n}`,
    jackpotText: 'GOLDEN JACKPOT! +1500',
  },
} as const;

function CoinBadgeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="#facc15" stroke="#b45309" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="6.5" stroke="#fef08a" strokeWidth="1.2" opacity="0.85" />
      <path
        d="M12 7.5v9M14.3 9.7c0-1-1-1.7-2.3-1.7s-2.3.7-2.3 1.7c0 1.2 1.1 1.6 2.3 1.9 1.2.3 2.3.7 2.3 1.9 0 1-1 1.8-2.3 1.8s-2.3-.8-2.3-1.8"
        stroke="#92400e"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FruitMiniCanvas({ tier, size }: { tier: number; size: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(size * dpr);
    c.height = Math.round(size * dpr);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(size / 2, size * 0.56);
    drawFruitGraphic(ctx, tier, size * 0.34, size >= 28);
    ctx.restore();
  }, [tier, size]);

  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size }}
      className="block shrink-0"
      aria-hidden="true"
    />
  );
}

export function FruitMergePreviewArt() {
  return (
    <svg
      viewBox="0 0 260 130"
      className="w-full h-full block"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e1b18" />
          <stop offset="55%" stopColor="#2c2218" />
          <stop offset="100%" stopColor="#171412" />
        </linearGradient>
      </defs>
      <rect width="260" height="130" fill="url(#fm-bg)" />

      {/* Warm wooden orchard jar outline */}
      <path
        d="M 54 18 L 54 114 Q 54 122 62 122 L 198 122 Q 206 122 206 114 L 206 18"
        fill="#fef3c7"
        fillOpacity="0.08"
        stroke="#d97706"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="58"
        y1="32"
        x2="202"
        y2="32"
        stroke="#fb7185"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        opacity="0.7"
      />

      {/* Giant Watermelon */}
      <circle cx="96" cy="90" r="28" fill="#16a34a" stroke="#052e16" strokeWidth="2.5" />
      <path d="M 80 68 Q 86 90 80 112 M 96 62 Q 102 90 96 118 M 112 68 Q 118 90 112 112" stroke="#052e16" strokeWidth="3.5" strokeLinecap="round" opacity="0.65" />
      <circle cx="88" cy="88" r="2.2" fill="#1e1b18" />
      <circle cx="104" cy="88" r="2.2" fill="#1e1b18" />
      <path d="M 91 94 Q 96 99 101 94" stroke="#1e1b18" strokeWidth="2" strokeLinecap="round" />

      {/* Golden Pineapple */}
      <circle cx="154" cy="96" r="22" fill="#facc15" stroke="#713f12" strokeWidth="2.2" />
      <polygon points="145,76 150,65 154,73 158,65 163,76" fill="#16a34a" />
      <circle cx="148" cy="95" r="2" fill="#1e1b18" />
      <circle cx="160" cy="95" r="2" fill="#1e1b18" />
      <path d="M 150 100 Q 154 104 158 100" stroke="#1e1b18" strokeWidth="1.8" strokeLinecap="round" />

      {/* Plump Tangerine & Apple merging */}
      <circle cx="136" cy="60" r="16" fill="#f97316" stroke="#7c2d12" strokeWidth="2" />
      <ellipse cx="142" cy="44" rx="5" ry="2.5" fill="#22c55e" />
      <circle cx="182" cy="76" r="14" fill="#dc2626" stroke="#450a0a" strokeWidth="2" />

      {/* Dropping Grape with aim guideline */}
      <line x1="126" y1="22" x2="126" y2="44" stroke="#fde68a" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
      <circle cx="126" cy="18" r="10" fill="#9333ea" stroke="#3b0764" strokeWidth="1.8" />
    </svg>
  );
}

export const FruitMergeGame: React.FC<FruitMergeGameProps> = ({
  lang,
  sfxEnabled,
  musicEnabled,
  onToggleMusic,
  onExitToHub,
}) => {
  const t = COPY_MERGE[lang];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<MergeAudio>(new MergeAudio());

  const [score, setScore] = useState<number>(0);
  const [stats, setStats] = useState<FruitMergeStats>(() => readFruitMergeStats());
  const [wallet, setWallet] = useState<FruitMergeWallet>(() => readFruitMergeWallet());
  const [shopOpen, setShopOpen] = useState<boolean>(false);
  const [currentTier, setCurrentTier] = useState<number>(() => rollDropTier());
  const [nextTier, setNextTier] = useState<number>(() => rollDropTier());
  const [maxReachedTier, setMaxReachedTier] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [dangerRatio, setDangerRatio] = useState<number>(0);

  useGameMusic('fruit-merge', musicEnabled && !gameOver);

  // Physics world refs (60fps zero React re-render overhead)
  const fruitsRef = useRef<FruitBody[]>([]);
  const particlesRef = useRef<MergeParticle[]>([]);
  const ringsRef = useRef<MergeRing[]>([]);
  const popupsRef = useRef<FloatingScore[]>([]);
  const nextIdRef = useRef<number>(1);
  const aimXRef = useRef<number>(WORLD_W / 2);
  const lastDropAtRef = useRef<number>(0);
  const comboRef = useRef<{ count: number; lastAt: number }>({ count: 0, lastAt: 0 });
  const dangerTimerRef = useRef<number>(0);
  const shakeImpulseRef = useRef<{ until: number; mag: number }>({ until: 0, mag: 0 });
  const keysHeldRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  const scoreRef = useRef<number>(score);
  const statsRef = useRef<FruitMergeStats>(stats);
  const walletRef = useRef<FruitMergeWallet>(wallet);
  const shopOpenRef = useRef<boolean>(shopOpen);
  const currentTierRef = useRef<number>(currentTier);
  const nextTierRef = useRef<number>(nextTier);
  const maxReachedRef = useRef<number>(maxReachedTier);
  const gameOverRef = useRef<boolean>(gameOver);
  const langRef = useRef(lang);

  scoreRef.current = score;
  statsRef.current = stats;
  walletRef.current = wallet;
  shopOpenRef.current = shopOpen;
  currentTierRef.current = currentTier;
  nextTierRef.current = nextTier;
  maxReachedRef.current = maxReachedTier;
  gameOverRef.current = gameOver;
  langRef.current = lang;

  useEffect(() => {
    audioRef.current.enabled = sfxEnabled;
  }, [sfxEnabled]);

  const updateWallet = useCallback(
    (updater: (prev: FruitMergeWallet) => FruitMergeWallet) => {
      const next = updater(walletRef.current);
      walletRef.current = next;
      setWallet(next);
      saveFruitMergeWallet(next);
    },
    []
  );

  const spawnBurst = useCallback(
    (x: number, y: number, color: string, radius: number, count = 14) => {
      for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = 75 + Math.random() * 145;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed - 30,
          r: Math.max(2.5, Math.min(6, radius * 0.12)) * (0.7 + Math.random() * 0.6),
          color,
          life: 0,
          maxLife: 0.42 + Math.random() * 0.22,
        });
      }
      ringsRef.current.push({
        x,
        y,
        r: radius * 0.6,
        maxR: radius * 1.95,
        color,
        life: 0,
        maxLife: 0.34,
      });
    },
    []
  );

  const addScoreAndSync = useCallback(
    (points: number, coinsEarned: number, newTier?: number) => {
      const nextScore = scoreRef.current + points;
      scoreRef.current = nextScore;
      setScore(nextScore);

      if (coinsEarned > 0) {
        updateWallet((prev) => ({
          ...prev,
          coins: prev.coins + coinsEarned,
        }));
      }

      let nextMaxTier = maxReachedRef.current;
      if (typeof newTier === 'number' && newTier > nextMaxTier) {
        nextMaxTier = newTier;
        maxReachedRef.current = nextMaxTier;
        setMaxReachedTier(nextMaxTier);
      }

      const prevBest = statsRef.current;
      if (nextScore > prevBest.bestScore || nextMaxTier > prevBest.maxTier) {
        const updated: FruitMergeStats = {
          bestScore: Math.max(prevBest.bestScore, nextScore),
          maxTier: Math.max(prevBest.maxTier, nextMaxTier),
        };
        if (nextScore > prevBest.bestScore && prevBest.bestScore > 0) {
          setIsNewRecord(true);
        }
        statsRef.current = updated;
        setStats(updated);
        saveFruitMergeStats(updated);
      }
    },
    [updateWallet]
  );

  const resetGame = useCallback(() => {
    fruitsRef.current = [];
    particlesRef.current = [];
    ringsRef.current = [];
    popupsRef.current = [];
    nextIdRef.current = 1;
    aimXRef.current = WORLD_W / 2;
    lastDropAtRef.current = 0;
    comboRef.current = { count: 0, lastAt: 0 };
    dangerTimerRef.current = 0;
    shakeImpulseRef.current = { until: 0, mag: 0 };

    const first = rollDropTier();
    const second = rollDropTier();
    currentTierRef.current = first;
    nextTierRef.current = second;
    scoreRef.current = 0;
    maxReachedRef.current = 0;
    gameOverRef.current = false;
    shopOpenRef.current = false;

    setScore(0);
    setCurrentTier(first);
    setNextTier(second);
    setMaxReachedTier(0);
    setShopOpen(false);
    setGameOver(false);
    setIsNewRecord(false);
    setDangerRatio(0);
  }, []);

  const clampAimX = useCallback((rawX: number, tier: number) => {
    const r = FRUIT_TIERS[tier].radius;
    return Math.max(WALL_LEFT + r + 2, Math.min(WALL_RIGHT - r - 2, rawX));
  }, []);

  const dropCurrentFruit = useCallback(() => {
    if (gameOverRef.current || shopOpenRef.current) return;
    const now = performance.now();
    if (now - lastDropAtRef.current < DROP_COOLDOWN_MS) return;
    lastDropAtRef.current = now;

    const tier = currentTierRef.current;
    const spec = FRUIT_TIERS[tier];
    const x = clampAimX(aimXRef.current, tier);

    fruitsRef.current.push({
      id: nextIdRef.current++,
      tier,
      x,
      y: DROP_Y,
      vx: (Math.random() - 0.5) * 14,
      vy: 30,
      angle: 0,
      vAngle: (Math.random() - 0.5) * 0.8,
      radius: spec.radius,
      spawnedAt: now,
      scaleAnim: 1.12,
      merged: false,
    });

    if (tier > maxReachedRef.current) {
      maxReachedRef.current = tier;
      setMaxReachedTier(tier);
    }

    audioRef.current.playDrop();

    const upcoming = nextTierRef.current;
    const freshNext = rollDropTier();
    currentTierRef.current = upcoming;
    nextTierRef.current = freshNext;
    setCurrentTier(upcoming);
    setNextTier(freshNext);
    aimXRef.current = clampAimX(aimXRef.current, upcoming);
  }, [clampAimX]);

  // Utility 1: Swap current fruit with Next fruit (or open shop if empty)
  const handleSwap = useCallback(() => {
    if (gameOverRef.current) return;
    if (walletRef.current.swaps <= 0) {
      setShopOpen(true);
      return;
    }
    const cur = currentTierRef.current;
    const nxt = nextTierRef.current;
    currentTierRef.current = nxt;
    nextTierRef.current = cur;
    setCurrentTier(nxt);
    setNextTier(cur);
    aimXRef.current = clampAimX(aimXRef.current, nxt);
    updateWallet((prev) => ({ ...prev, swaps: Math.max(0, prev.swaps - 1) }));
    audioRef.current.playDrop();
  }, [clampAimX, updateWallet]);

  // Utility 2: Shake Jar physically to settle gaps & trigger chain merges (or open shop if empty)
  const handleShake = useCallback(() => {
    if (gameOverRef.current) return;
    if (walletRef.current.shakes <= 0) {
      setShopOpen(true);
      return;
    }
    if (fruitsRef.current.length === 0) return;
    const dir = Math.random() < 0.5 ? -1 : 1;
    for (const f of fruitsRef.current) {
      f.vx += dir * (135 + Math.random() * 85);
      f.vy -= 95 + Math.random() * 65;
      f.vAngle += (Math.random() - 0.5) * 4;
    }
    shakeImpulseRef.current = { until: performance.now() + 340, mag: 8 };
    updateWallet((prev) => ({ ...prev, shakes: Math.max(0, prev.shakes - 1) }));
    audioRef.current.playShake();
  }, [updateWallet]);

  // Utility 3: Clear Small Fruits (Cherries & Strawberries) to open tight space (or open shop if empty)
  const handleClearSmall = useCallback(() => {
    if (gameOverRef.current) return;
    if (walletRef.current.clears <= 0) {
      setShopOpen(true);
      return;
    }
    const smalls = fruitsRef.current.filter((f) => f.tier <= 1);
    if (smalls.length === 0) return;

    for (const f of smalls) {
      spawnBurst(f.x, f.y, FRUIT_TIERS[f.tier].juice, f.radius, 10);
    }
    fruitsRef.current = fruitsRef.current.filter((f) => f.tier > 1);
    updateWallet((prev) => ({ ...prev, clears: Math.max(0, prev.clears - 1) }));
    audioRef.current.playMerge(4, 2);
  }, [spawnBurst, updateWallet]);

  const handleBuyItem = useCallback(
    (item: 'swap' | 'shake' | 'clearSmall') => {
      const price = SHOP_PRICES[item];
      if (walletRef.current.coins < price) return;
      updateWallet((prev) => ({
        coins: prev.coins - price,
        swaps: prev.swaps + (item === 'swap' ? 1 : 0),
        shakes: prev.shakes + (item === 'shake' ? 1 : 0),
        clears: prev.clears + (item === 'clearSmall' ? 1 : 0),
      }));
      audioRef.current.playBuy();
    },
    [updateWallet]
  );

  // Keyboard controls (Left/Right/A/D to aim, Space/Enter/Down to drop, Escape to close shop / exit)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (shopOpenRef.current) {
          setShopOpen(false);
        } else {
          onExitToHub();
        }
        return;
      }
      if (shopOpenRef.current) return;
      if (gameOverRef.current) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          resetGame();
        }
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        keysHeldRef.current.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        keysHeldRef.current.right = true;
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        dropCurrentFruit();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysHeldRef.current.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysHeldRef.current.right = false;
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [dropCurrentFruit, onExitToHub, resetGame]);

  // Pointer aim & drop handlers on the jar canvas
  const mapClientXToWorld = useCallback(
    (clientX: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return aimXRef.current;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0) return aimXRef.current;
      const worldX = ((clientX - rect.left) / rect.width) * WORLD_W;
      return clampAimX(worldX, currentTierRef.current);
    },
    [clampAimX]
  );

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameOverRef.current || shopOpenRef.current) return;
    aimXRef.current = mapClientXToWorld(e.clientX);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameOverRef.current || shopOpenRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    aimXRef.current = mapClientXToWorld(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameOverRef.current || shopOpenRef.current) return;
    aimXRef.current = mapClientXToWorld(e.clientX);
    dropCurrentFruit();
  };

  // Main 60fps Rigid-Circle Physics + Canvas Render Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const stepPhysics = (dt: number, now: number) => {
      // Smooth keyboard aiming
      const aimSpeed = 290;
      if (keysHeldRef.current.left) {
        aimXRef.current = clampAimX(
          aimXRef.current - aimSpeed * dt,
          currentTierRef.current
        );
      }
      if (keysHeldRef.current.right) {
        aimXRef.current = clampAimX(
          aimXRef.current + aimSpeed * dt,
          currentTierRef.current
        );
      }

      const bodies = fruitsRef.current;
      const subSteps = 8;
      const subDt = dt / subSteps;
      const gravity = 1120;
      const pendingMerges: { a: FruitBody; b: FruitBody }[] = [];

      for (let s = 0; s < subSteps; s++) {
        // 1. Integrate velocities & positions
        for (let i = 0; i < bodies.length; i++) {
          const b = bodies[i];
          if (b.merged) continue;
          b.vy += gravity * subDt;
          b.vx *= 0.9992;
          b.vy *= 0.9992;
          b.x += b.vx * subDt;
          b.y += b.vy * subDt;
          b.angle += b.vAngle * subDt;
          b.vAngle *= 0.992;

          // Wall & floor containment with realistic rolling friction
          if (b.x - b.radius < WALL_LEFT) {
            b.x = WALL_LEFT + b.radius;
            b.vx = Math.abs(b.vx) * 0.22;
            b.vAngle += b.vy * 0.002;
          } else if (b.x + b.radius > WALL_RIGHT) {
            b.x = WALL_RIGHT - b.radius;
            b.vx = -Math.abs(b.vx) * 0.22;
            b.vAngle -= b.vy * 0.002;
          }

          if (b.y + b.radius > FLOOR_Y) {
            b.y = FLOOR_Y - b.radius;
            if (Math.abs(b.vy) < 28) {
              b.vy = 0;
            } else {
              b.vy = -Math.abs(b.vy) * 0.2;
            }
            b.vx *= 0.978;
            b.vAngle = b.vx / Math.max(12, b.radius);
          }
        }

        // 2. Pairwise circle-circle collision & same-tier merge detection
        for (let i = 0; i < bodies.length; i++) {
          const a = bodies[i];
          if (a.merged) continue;
          for (let j = i + 1; j < bodies.length; j++) {
            const b = bodies[j];
            if (b.merged) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const minDist = a.radius + b.radius;
            const distSq = dx * dx + dy * dy;

            if (distSq < minDist * minDist) {
              // Same tier -> schedule crisp merge!
              if (a.tier === b.tier) {
                a.merged = true;
                b.merged = true;
                pendingMerges.push({ a, b });
                break;
              }

              const dist = Math.sqrt(distSq) || 0.001;
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDist - dist;

              // Mass proportional to area (r^2)
              const massA = a.radius * a.radius;
              const massB = b.radius * b.radius;
              const invTotal = 1 / (massA + massB);
              const shareA = massB * invTotal;
              const shareB = massA * invTotal;

              // Positional separation
              const corr = overlap * 0.88;
              a.x -= nx * corr * shareA;
              a.y -= ny * corr * shareA;
              b.x += nx * corr * shareB;
              b.y += ny * corr * shareB;

              // Relative velocity along normal
              const rvx = b.vx - a.vx;
              const rvy = b.vy - a.vy;
              const velAlongNormal = rvx * nx + rvy * ny;

              if (velAlongNormal < 0) {
                const restitution = 0.16;
                const imp = -(1 + restitution) * velAlongNormal;
                a.vx -= imp * nx * shareA;
                a.vy -= imp * ny * shareA;
                b.vx += imp * nx * shareB;
                b.vy += imp * ny * shareB;

                // Tangential friction for realistic fruit rolling
                const tx = -ny;
                const ty = nx;
                const velTangent = rvx * tx + rvy * ty;
                const friction = 0.085;
                a.vx += velTangent * friction * tx * shareA;
                a.vy += velTangent * friction * ty * shareA;
                b.vx -= velTangent * friction * tx * shareB;
                b.vy -= velTangent * friction * ty * shareB;

                a.vAngle += (velTangent * 0.004) / Math.max(12, a.radius);
                b.vAngle -= (velTangent * 0.004) / Math.max(12, b.radius);
              }
            }
          }
        }
      }

      // 3. Process merges outside substeps cleanly
      if (pendingMerges.length > 0) {
        const survivors = bodies.filter((b) => !b.merged);
        const ct = COPY_MERGE[langRef.current];

        for (const { a, b } of pendingMerges) {
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;

          // Update chain combo
          if (now - comboRef.current.lastAt < 1250) {
            comboRef.current.count += 1;
          } else {
            comboRef.current.count = 1;
          }
          comboRef.current.lastAt = now;
          const combo = comboRef.current.count;

          // Special Super Jackpot if two max-tier Golden Watermelons merge!
          if (a.tier >= FRUIT_TIERS.length - 1) {
            const jackpotPts = 1500;
            spawnBurst(midX, midY, '#fde047', 88, 28);
            popupsRef.current.push({
              x: midX,
              y: midY - 12,
              text: `${ct.jackpotText} · +${JACKPOT_COINS}$`,
              color: '#fde047',
              life: 0,
              maxLife: 1.4,
            });
            audioRef.current.playJackpot();
            addScoreAndSync(jackpotPts, JACKPOT_COINS, a.tier);
            continue;
          }

          const nextT = a.tier + 1;
          const nextSpec = FRUIT_TIERS[nextT];
          const clampedX = Math.max(
            WALL_LEFT + nextSpec.radius,
            Math.min(WALL_RIGHT - nextSpec.radius, midX)
          );
          const clampedY = Math.min(FLOOR_Y - nextSpec.radius, midY);

          survivors.push({
            id: nextIdRef.current++,
            tier: nextT,
            x: clampedX,
            y: clampedY,
            vx: (a.vx + b.vx) * 0.3,
            vy: Math.min(-45, (a.vy + b.vy) * 0.25 - 35),
            angle: 0,
            vAngle: (Math.random() - 0.5) * 1.4,
            radius: nextSpec.radius,
            spawnedAt: now,
            scaleAnim: 1.28,
            merged: false,
          });

          const gained =
            nextSpec.score + (combo > 1 ? Math.round(nextSpec.score * 0.35 * (combo - 1)) : 0);
          const coinsEarned = nextSpec.coinReward;
          spawnBurst(clampedX, clampedY, nextSpec.juice, nextSpec.radius, 14 + nextT);
          popupsRef.current.push({
            x: clampedX,
            y: clampedY - nextSpec.radius * 0.5,
            text:
              combo > 1
                ? `+${gained} · +${coinsEarned}$ ${ct.comboText(combo)}`
                : `+${gained} · +${coinsEarned}$`,
            color: combo > 1 ? '#fde047' : '#fef08a',
            life: 0,
            maxLife: 0.98,
          });
          audioRef.current.playMerge(nextT, combo);
          addScoreAndSync(gained, coinsEarned, nextT);
        }

        fruitsRef.current = survivors;
      }

      // 4. Spring-settle scale animations & check overflow danger line
      let anyAboveDanger = false;
      for (const b of fruitsRef.current) {
        if (b.scaleAnim > 1.001) {
          b.scaleAnim += (1 - b.scaleAnim) * Math.min(1, dt * 14);
        } else {
          b.scaleAnim = 1;
        }
        // Grace period of 1.3s after drop/merge before checking overflow
        if (now - b.spawnedAt > 1300 && b.y - b.radius < DANGER_Y) {
          anyAboveDanger = true;
        }
      }

      if (anyAboveDanger) {
        dangerTimerRef.current += dt;
        const ratio = Math.min(1, dangerTimerRef.current / DANGER_HOLD_SECONDS);
        setDangerRatio(ratio);
        if (dangerTimerRef.current >= DANGER_HOLD_SECONDS) {
          gameOverRef.current = true;
          setGameOver(true);
          audioRef.current.playGameOver();
        }
      } else if (dangerTimerRef.current > 0) {
        dangerTimerRef.current = Math.max(0, dangerTimerRef.current - dt * 2.2);
        setDangerRatio(dangerTimerRef.current / DANGER_HOLD_SECONDS);
      }

      // 5. Update particles, rings & floating score popups
      particlesRef.current = particlesRef.current.filter((p) => {
        p.life += dt;
        p.vy += 420 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        return p.life < p.maxLife;
      });

      ringsRef.current = ringsRef.current.filter((rg) => {
        rg.life += dt;
        const prog = rg.life / rg.maxLife;
        rg.r = rg.r + (rg.maxR - rg.r) * Math.min(1, prog * 0.45);
        return rg.life < rg.maxLife;
      });

      popupsRef.current = popupsRef.current.filter((pop) => {
        pop.life += dt;
        pop.y -= 44 * dt;
        return pop.life < pop.maxLife;
      });
    };

    const renderFrame = (now: number) => {
      const dt = Math.min(0.032, Math.max(0.004, (now - lastTime) / 1000));
      lastTime = now;

      if (!gameOverRef.current && !shopOpenRef.current) {
        stepPhysics(dt, now);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const tw = Math.round(WORLD_W * dpr);
        const th = Math.round(WORLD_H * dpr);
        if (canvas.width !== tw || canvas.height !== th) {
          canvas.width = tw;
          canvas.height = th;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(dpr, dpr);

          // Optional screen-shake when Shake Jar button is used
          if (now < shakeImpulseRef.current.until) {
            const rem = (shakeImpulseRef.current.until - now) / 340;
            const sx = (Math.random() - 0.5) * 2 * shakeImpulseRef.current.mag * rem;
            const sy = (Math.random() - 0.5) * 1.2 * shakeImpulseRef.current.mag * rem;
            ctx.translate(sx, sy);
          }

          // Warm dark orchard walnut-amber backdrop
          const bg = ctx.createLinearGradient(0, 0, 0, WORLD_H);
          bg.addColorStop(0, '#2a1f18');
          bg.addColorStop(0.55, '#1f1712');
          bg.addColorStop(1, '#16100c');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, WORLD_W, WORLD_H);

          // Inner glass jar playing area
          const jarBg = ctx.createLinearGradient(0, DANGER_Y, 0, FLOOR_Y);
          jarBg.addColorStop(0, 'rgba(254, 243, 199, 0.04)');
          jarBg.addColorStop(1, 'rgba(254, 243, 199, 0.09)');
          ctx.fillStyle = jarBg;
          ctx.fillRect(WALL_LEFT, DANGER_Y, WALL_RIGHT - WALL_LEFT, FLOOR_Y - DANGER_Y);

          // Subtle vertical jar glass sheen
          ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
          ctx.fillRect(WALL_LEFT + 8, DANGER_Y + 6, 12, FLOOR_Y - DANGER_Y - 14);

          // Danger overflow line (pulses bright red when filling up)
          const dangerProgress = Math.min(1, dangerTimerRef.current / DANGER_HOLD_SECONDS);
          ctx.save();
          ctx.strokeStyle =
            dangerProgress > 0.05
              ? `rgba(244, 63, 94, ${0.65 + 0.35 * Math.sin(now * 0.02)})`
              : 'rgba(251, 191, 36, 0.42)';
          ctx.lineWidth = dangerProgress > 0.05 ? 2.6 : 1.6;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(WALL_LEFT, DANGER_Y);
          ctx.lineTo(WALL_RIGHT, DANGER_Y);
          ctx.stroke();
          ctx.setLineDash([]);

          if (dangerProgress > 0.02) {
            ctx.fillStyle = 'rgba(244, 63, 94, 0.88)';
            ctx.fillRect(
              WALL_LEFT,
              DANGER_Y - 3,
              (WALL_RIGHT - WALL_LEFT) * dangerProgress,
              5
            );
          }
          ctx.restore();

          // Aim drop guideline & hovering current fruit
          if (!gameOverRef.current) {
            const curT = currentTierRef.current;
            const curSpec = FRUIT_TIERS[curT];
            const ax = clampAimX(aimXRef.current, curT);
            const ready = now - lastDropAtRef.current >= DROP_COOLDOWN_MS * 0.8;

            ctx.save();
            ctx.strokeStyle = 'rgba(254, 243, 199, 0.28)';
            ctx.lineWidth = 1.6;
            ctx.setLineDash([5, 6]);
            ctx.beginPath();
            ctx.moveTo(ax, DROP_Y + curSpec.radius);
            ctx.lineTo(ax, FLOOR_Y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            ctx.save();
            ctx.globalAlpha = ready ? 1 : 0.45;
            ctx.translate(ax, DROP_Y);
            drawFruitGraphic(ctx, curT, curSpec.radius, true);
            ctx.restore();
          }

          // Draw all fruits inside jar
          for (const f of fruitsRef.current) {
            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.rotate(f.angle);
            ctx.scale(f.scaleAnim, f.scaleAnim);
            drawFruitGraphic(ctx, f.tier, f.radius, true);
            ctx.restore();
          }

          // Merge shockwave rings
          for (const rg of ringsRef.current) {
            const alpha = Math.max(0, 1 - rg.life / rg.maxLife);
            ctx.save();
            ctx.strokeStyle = rg.color;
            ctx.globalAlpha = alpha * 0.8;
            ctx.lineWidth = 3.2 * alpha;
            ctx.beginPath();
            ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Juice burst particles
          for (const p of particlesRef.current) {
            const alpha = Math.max(0, 1 - p.life / p.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * alpha + 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Solid wooden-amber jar frame walls & base
          ctx.save();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(WALL_LEFT - 2, DANGER_Y - 12);
          ctx.lineTo(WALL_LEFT - 2, FLOOR_Y + 2);
          ctx.lineTo(WALL_RIGHT + 2, FLOOR_Y + 2);
          ctx.lineTo(WALL_RIGHT + 2, DANGER_Y - 12);
          ctx.stroke();

          ctx.strokeStyle = '#fde68a';
          ctx.lineWidth = 1.6;
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.moveTo(WALL_LEFT - 2, DANGER_Y - 12);
          ctx.lineTo(WALL_LEFT - 2, FLOOR_Y + 2);
          ctx.lineTo(WALL_RIGHT + 2, FLOOR_Y + 2);
          ctx.lineTo(WALL_RIGHT + 2, DANGER_Y - 12);
          ctx.stroke();
          ctx.restore();

          // Floating merge score & combo popups
          for (const pop of popupsRef.current) {
            const alpha = Math.max(0, 1 - pop.life / pop.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = '800 17px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'rgba(20, 14, 10, 0.9)';
            ctx.lineWidth = 4;
            ctx.strokeText(pop.text, pop.x, pop.y);
            ctx.fillStyle = pop.color;
            ctx.fillText(pop.text, pop.x, pop.y);
            ctx.restore();
          }

          ctx.restore();
        }
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(rafId);
  }, [addScoreAndSync, clampAimX, spawnBurst]);

  const highestFruitName =
    lang === 'ar'
      ? FRUIT_TIERS[maxReachedTier].nameAr
      : FRUIT_TIERS[maxReachedTier].nameEn;

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 h-[100dvh] z-50 bg-[#17120e] text-amber-50 flex flex-col overflow-hidden select-none"
    >
      {/* Top Bar: Corner Exit, Title + Score/Best, Next Fruit + Music Toggle */}
      <header className="w-full border-b border-amber-200/12 bg-[#211913]/95 shrink-0">
        <div className="mx-auto max-w-[920px] h-14 px-3 sm:px-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onExitToHub}
            className="h-9 px-3 sm:px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 hover:text-white text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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

          {/* Center: Game Name + Score / Best / Coins */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-amber-200 whitespace-nowrap truncate hidden md:block">
              {t.title}
            </h1>
            <span className="text-amber-200/25 hidden md:inline" aria-hidden="true">
              ·
            </span>
            <div className="flex items-center gap-2.5 sm:gap-3.5 text-xs sm:text-sm whitespace-nowrap">
              <div>
                <span className="text-amber-200/70 me-1">{t.scoreLabel}:</span>
                <span className="font-num tabular-nums font-extrabold text-white">
                  {score}
                </span>
              </div>
              <div className="hidden sm:block">
                <span className="text-amber-200/70 me-1">{t.bestLabel}:</span>
                <span className="font-num tabular-nums font-extrabold text-amber-300">
                  {stats.bestScore}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShopOpen(true)}
                className="inline-flex items-center gap-1 font-num tabular-nums font-extrabold text-yellow-300 hover:text-yellow-200 transition-colors cursor-pointer"
                title={t.shopTitle}
              >
                <CoinBadgeIcon className="w-4 h-4" />
                <span>{wallet.coins}</span>
              </button>
            </div>
          </div>

          {/* Right: Next Fruit Preview + Music Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-amber-300/25 bg-[#16100c]">
              <span className="text-[11px] font-semibold text-amber-200/80 hidden sm:inline">
                {t.nextLabel}
              </span>
              <FruitMiniCanvas tier={nextTier} size={28} />
            </div>
            <MusicToggleButton
              enabled={musicEnabled}
              onToggle={onToggleMusic}
              lang={lang}
            />
          </div>
        </div>
      </header>

      {/* Main Play Stage */}
      <main className="relative flex-1 min-h-0 flex flex-col items-center justify-center px-3 py-2 sm:py-3 overflow-hidden">
        {/* Danger warning bar */}
        {dangerRatio > 0.12 && !gameOver && (
          <div className="mb-1.5 text-xs font-extrabold text-rose-300 tracking-wide">
            {t.dangerWarn}
          </div>
        )}

        {/* Responsive Orchard Jar Canvas */}
        <div className="relative flex-1 min-h-0 w-full flex items-center justify-center">
          <div className="relative h-full max-h-[560px] aspect-[3/4] max-w-full rounded-2xl overflow-hidden shadow-2xl border border-amber-400/25 bg-[#1c1510]">
            <canvas
              ref={canvasRef}
              onPointerMove={handlePointerMove}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              className="w-full h-full block touch-none cursor-pointer"
            />

            {/* Game Over Modal Overlay */}
            {gameOver && (
              <div className="absolute inset-0 z-20 flex items-center justify-center p-5 bg-[#120d0a]/88 backdrop-blur-[3px]">
                <div className="w-full max-w-xs rounded-2xl border border-amber-300/40 bg-[#221912] p-6 text-center shadow-2xl">
                  {isNewRecord && (
                    <div className="text-xs font-extrabold text-amber-300 mb-1">
                      {t.newRecordBadge}
                    </div>
                  )}
                  <h2 className="text-xl font-extrabold text-white mb-2">
                    {t.gameOverTitle}
                  </h2>
                  <p className="text-sm text-amber-100/85 mb-5 leading-relaxed">
                    {t.gameOverSub(score, highestFruitName)}
                  </p>
                  <button
                    type="button"
                    onClick={resetGame}
                    className="w-full py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-stone-950 font-extrabold text-sm sm:text-base transition-all cursor-pointer"
                  >
                    {t.playAgainBtn}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Evolution Chain + Action Tools + Shop Button */}
      <footer className="w-full border-t border-amber-200/12 bg-[#211913]/95 px-2.5 sm:px-5 py-2 shrink-0">
        <div className="mx-auto max-w-[780px] flex flex-col gap-2">
          {/* Interactive Action Controls */}
          <div className="flex items-center justify-center flex-wrap gap-2">
            <button
              type="button"
              disabled={gameOver}
              onClick={handleSwap}
              className={`h-10 px-3 sm:px-3.5 rounded-xl border text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                gameOver
                  ? 'border-white/10 bg-stone-900/50 text-stone-500 cursor-not-allowed'
                  : wallet.swaps <= 0
                  ? 'border-amber-300/25 bg-stone-900/65 hover:border-amber-300/50 text-amber-200/75 cursor-pointer'
                  : 'border-amber-300/45 bg-amber-500/15 hover:bg-amber-500/25 text-amber-100 cursor-pointer'
              }`}
            >
              {t.swapBtn}{' '}
              <span className="font-num tabular-nums text-amber-300">
                ({wallet.swaps > 0 ? wallet.swaps : '+'})
              </span>
            </button>

            <button
              type="button"
              disabled={gameOver}
              onClick={handleShake}
              className={`h-10 px-3 sm:px-3.5 rounded-xl border text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                gameOver
                  ? 'border-white/10 bg-stone-900/50 text-stone-500 cursor-not-allowed'
                  : wallet.shakes <= 0
                  ? 'border-emerald-300/25 bg-stone-900/65 hover:border-emerald-300/50 text-emerald-200/75 cursor-pointer'
                  : 'border-emerald-300/45 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100 cursor-pointer'
              }`}
            >
              {t.shakeBtn}{' '}
              <span className="font-num tabular-nums text-emerald-300">
                ({wallet.shakes > 0 ? wallet.shakes : '+'})
              </span>
            </button>

            <button
              type="button"
              disabled={gameOver}
              onClick={handleClearSmall}
              className={`h-10 px-3 sm:px-3.5 rounded-xl border text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                gameOver
                  ? 'border-white/10 bg-stone-900/50 text-stone-500 cursor-not-allowed'
                  : wallet.clears <= 0
                  ? 'border-rose-300/25 bg-stone-900/65 hover:border-rose-300/50 text-rose-200/75 cursor-pointer'
                  : 'border-rose-300/45 bg-rose-500/15 hover:bg-rose-500/25 text-rose-100 cursor-pointer'
              }`}
            >
              {t.clearSmallBtn}{' '}
              <span className="font-num tabular-nums text-rose-300">
                ({wallet.clears > 0 ? wallet.clears : '+'})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShopOpen(true)}
              className="h-10 px-3.5 rounded-xl border border-yellow-400/55 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 text-xs sm:text-sm font-extrabold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <CoinBadgeIcon className="w-4 h-4" />
              <span>{t.shopBtn}</span>
              <span className="font-num tabular-nums text-yellow-300">
                {wallet.coins}
              </span>
            </button>

            <button
              type="button"
              onClick={resetGame}
              className="h-10 px-3 rounded-xl border border-white/15 bg-stone-800/80 hover:bg-stone-700 text-amber-100 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
            >
              {t.restartBtn}
            </button>
          </div>

          {/* 11-Tier Fruit Merge Evolution Guide Strip */}
          <div className="flex items-center justify-center gap-1 overflow-x-auto pb-0.5">
            {FRUIT_TIERS.map((f, idx) => {
              const unlocked = idx <= maxReachedTier;
              return (
                <div
                  key={f.tier}
                  title={
                    f.coinReward > 0
                      ? `${lang === 'ar' ? f.nameAr : f.nameEn} (+${f.coinReward})`
                      : lang === 'ar'
                      ? f.nameAr
                      : f.nameEn
                  }
                  className={`flex items-center gap-0.5 shrink-0 transition-opacity ${
                    unlocked ? 'opacity-100' : 'opacity-45'
                  }`}
                >
                  <FruitMiniCanvas tier={f.tier} size={22} />
                  {idx < FRUIT_TIERS.length - 1 && (
                    <span
                      className="text-[10px] text-amber-200/35"
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </footer>

      {/* Power-Up Shop Modal */}
      {shopOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0a07]/85 backdrop-blur-[3px]"
          onClick={() => setShopOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-amber-400/35 bg-[#231912] p-5 shadow-2xl text-amber-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Shop Header */}
            <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-amber-200/12">
              <div className="flex items-center gap-2">
                <CoinBadgeIcon className="w-5 h-5" />
                <h2 className="text-lg font-extrabold text-amber-100">
                  {t.shopTitle}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-1.5 font-num tabular-nums font-extrabold text-sm text-yellow-300">
                  <CoinBadgeIcon className="w-4 h-4" />
                  <span>{wallet.coins}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShopOpen(false)}
                  className="w-8 h-8 rounded-lg border border-white/15 bg-stone-800/80 hover:bg-stone-700 text-amber-100 text-sm font-bold inline-flex items-center justify-center cursor-pointer"
                  aria-label={t.closeBtn}
                >
                  ✕
                </button>
              </div>
            </div>

            <p className="text-xs text-amber-200/80 leading-relaxed mb-4">
              {t.shopEarnNote}
            </p>

            {/* Shop Items */}
            <div className="flex flex-col gap-2.5">
              {/* Item 1: Swap */}
              <div className="rounded-xl border border-amber-300/25 bg-[#19120d] p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-amber-200">
                      {t.swapBtn}
                    </span>
                    <span className="text-xs font-semibold text-amber-300/75 font-num tabular-nums">
                      {t.ownedLabel(wallet.swaps)}
                    </span>
                  </div>
                  <p className="text-xs text-amber-100/65 mt-0.5 leading-snug">
                    {t.swapDesc}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={wallet.coins < SHOP_PRICES.swap}
                  onClick={() => handleBuyItem('swap')}
                  className={`h-10 px-3.5 rounded-xl font-extrabold text-xs sm:text-sm inline-flex items-center gap-1.5 shrink-0 transition-all ${
                    wallet.coins >= SHOP_PRICES.swap
                      ? 'bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-stone-950 cursor-pointer'
                      : 'bg-stone-800 text-stone-500 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  <span>{t.buyBtn}</span>
                  <span className="font-num tabular-nums">{SHOP_PRICES.swap}</span>
                </button>
              </div>

              {/* Item 2: Shake Jar */}
              <div className="rounded-xl border border-emerald-300/25 bg-[#19120d] p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-emerald-200">
                      {t.shakeBtn}
                    </span>
                    <span className="text-xs font-semibold text-emerald-300/75 font-num tabular-nums">
                      {t.ownedLabel(wallet.shakes)}
                    </span>
                  </div>
                  <p className="text-xs text-amber-100/65 mt-0.5 leading-snug">
                    {t.shakeDesc}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={wallet.coins < SHOP_PRICES.shake}
                  onClick={() => handleBuyItem('shake')}
                  className={`h-10 px-3.5 rounded-xl font-extrabold text-xs sm:text-sm inline-flex items-center gap-1.5 shrink-0 transition-all ${
                    wallet.coins >= SHOP_PRICES.shake
                      ? 'bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] text-stone-950 cursor-pointer'
                      : 'bg-stone-800 text-stone-500 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  <span>{t.buyBtn}</span>
                  <span className="font-num tabular-nums">{SHOP_PRICES.shake}</span>
                </button>
              </div>

              {/* Item 3: Clear Small */}
              <div className="rounded-xl border border-rose-300/25 bg-[#19120d] p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-rose-200">
                      {t.clearSmallBtn}
                    </span>
                    <span className="text-xs font-semibold text-rose-300/75 font-num tabular-nums">
                      {t.ownedLabel(wallet.clears)}
                    </span>
                  </div>
                  <p className="text-xs text-amber-100/65 mt-0.5 leading-snug">
                    {t.clearSmallDesc}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={wallet.coins < SHOP_PRICES.clearSmall}
                  onClick={() => handleBuyItem('clearSmall')}
                  className={`h-10 px-3.5 rounded-xl font-extrabold text-xs sm:text-sm inline-flex items-center gap-1.5 shrink-0 transition-all ${
                    wallet.coins >= SHOP_PRICES.clearSmall
                      ? 'bg-rose-400 hover:bg-rose-300 active:scale-[0.98] text-stone-950 cursor-pointer'
                      : 'bg-stone-800 text-stone-500 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  <span>{t.buyBtn}</span>
                  <span className="font-num tabular-nums">
                    {SHOP_PRICES.clearSmall}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
