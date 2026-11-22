import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MusicToggleButton, useGameMusic } from './gameMusic';

type GamePhase = 'READY' | 'PLAYING' | 'PAUSED' | 'STAGE_CLEAR' | 'GAME_OVER';
type FallKind =
  | 'red-apple'
  | 'green-apple'
  | 'gold-apple'
  | 'purple-apple'
  | 'broccoli'
  | 'carrot'
  | 'eggplant'
  | 'chili';

interface FallingItem {
  id: number;
  kind: FallKind;
  isApple: boolean;
  appleValue: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  spin: number;
  swayAmp: number;
  swaySpeed: number;
  swayPhase: number;
  baseX: number;
  age: number;
}

interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
}

interface FloatingNote {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface StageSpec {
  level: number;
  tierKey: 'orchard' | 'garden' | 'storm' | 'master';
  targetApples: number;
  spawnIntervalMs: number;
  veggieRatio: number;
  minSpeed: number;
  maxSpeed: number;
  swayChance: number;
  goldChance: number;
  purpleChance: number;
}

export interface AppleCatchGameProps {
  lang: 'ar' | 'en';
  sfxEnabled: boolean;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  onExitToHub: () => void;
}

export const APPLE_CATCH_TOTAL_LEVELS = 20;

const STORAGE_KEY = 'point_catcher_apple_catch_cleared_v1';
const MAX_HEARTS = 3;
const CANVAS_W = 640;
const CANVAS_H = 520;
const BASKET_Y = CANVAS_H - 46;
const BASKET_W = 90;
const BASKET_H = 38;

const STAGE_SPECS: StageSpec[] = Array.from(
  { length: APPLE_CATCH_TOTAL_LEVELS },
  (_, idx) => {
    const level = idx + 1;
    if (level <= 5) {
      return {
        level,
        tierKey: 'orchard',
        targetApples: 4 + Math.round((level - 1) * 1.75), // 4, 6, 8, 9, 11 (+75% step)
        spawnIntervalMs: 225 - (level - 1) * 11, // ~5x denser veggie storm
        veggieRatio: 0.92 + (level - 1) * 0.006, // ~92%–94.4% veggies, rare apples
        minSpeed: 165 + (level - 1) * 12,
        maxSpeed: 240 + (level - 1) * 16,
        swayChance: level >= 4 ? 0.14 : 0,
        goldChance: 0.14,
        purpleChance: 0,
      };
    }
    if (level <= 10) {
      const k = level - 6;
      return {
        level,
        tierKey: 'garden',
        targetApples: 4 + Math.round((level - 1) * 1.75), // 13, 15, 16, 18, 20 (+75% step)
        spawnIntervalMs: 174 - k * 8, // 174..142ms
        veggieRatio: 0.945 + k * 0.004, // ~94.5%–96.1% veggies
        minSpeed: 225 + k * 13,
        maxSpeed: 315 + k * 16,
        swayChance: 0.18 + k * 0.03,
        goldChance: 0.15,
        purpleChance: 0,
      };
    }
    if (level <= 15) {
      const k = level - 11;
      return {
        level,
        tierKey: 'storm',
        targetApples: 4 + Math.round((level - 1) * 1.75), // 22, 23, 25, 27, 29 (+75% step)
        spawnIntervalMs: 136 - k * 6, // 136..112ms
        veggieRatio: 0.96 + k * 0.0025, // ~96%–97% veggies
        minSpeed: 280 + k * 14,
        maxSpeed: 385 + k * 16,
        swayChance: 0.28 + k * 0.03,
        goldChance: 0.16,
        purpleChance: level >= 14 ? 0.14 : 0, // Purple Apple (+4) unlocks at Stage 14!
      };
    }
    const k = level - 16;
    return {
      level,
      tierKey: 'master',
      targetApples: 29 + Math.round((k + 1) * 3.5), // 33, 36, 40, 43, 47 (+75% step)
      spawnIntervalMs: 108 - k * 4, // 108..92ms intense veggie downpour
      veggieRatio: 0.968 + k * 0.0015, // ~96.8%–97.4% veggies
      minSpeed: 340 + k * 14,
      maxSpeed: 460 + k * 16,
      swayChance: 0.36 + k * 0.03,
      goldChance: 0.18,
      purpleChance: 0.16,
    };
  }
);

function readClearedLevels(): number[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(Number)
      .filter(
        (n) =>
          Number.isInteger(n) && n >= 1 && n <= APPLE_CATCH_TOTAL_LEVELS
      );
  } catch {
    return [];
  }
}

export function readAppleCatchClearedCount(): number {
  return readClearedLevels().length;
}

function saveClearedLevels(levels: number[]): void {
  try {
    const unique = Array.from(new Set(levels)).sort((a, b) => a - b);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  } catch {
    // Ignore storage quota errors
  }
}

function getMaxUnlocked(cleared: number[]): number {
  let unlocked = 1;
  while (
    unlocked < APPLE_CATCH_TOTAL_LEVELS &&
    cleared.includes(unlocked)
  ) {
    unlocked += 1;
  }
  return unlocked;
}

class AppleCatchAudio {
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

  public playCatchApple(streak: number): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freq = 440 * Math.pow(1.045, Math.min(streak, 12));
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.45, now + 0.085);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playCatchGold(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [659.25, 880, 1174.66, 1396.91].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.05;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.21);
    });
  }

  public playCatchPurple(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 783.99, 1046.5, 1318.51, 1567.98].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.045;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  public playHitVeggie(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(195, now);
    osc.frequency.exponentialRampToValueAtTime(88, now + 0.19);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playStageWin(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
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
}

function drawFallingSprite(
  ctx: CanvasRenderingContext2D,
  item: FallingItem
): void {
  const r = item.radius;
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate(item.angle);

  // Subtle warning ring behind vegetables so players can read apples vs veggies in a split second
  if (!item.isApple) {
    ctx.save();
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.42)';
    ctx.fillStyle = 'rgba(244, 63, 94, 0.1)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  switch (item.kind) {
    case 'red-apple':
    case 'green-apple':
    case 'gold-apple':
    case 'purple-apple': {
      const isPurple = item.kind === 'purple-apple';
      const isGold = item.kind === 'gold-apple';
      const isGreen = item.kind === 'green-apple';
      ctx.shadowColor = isPurple
        ? '#d946ef'
        : isGold
        ? '#facc15'
        : isGreen
        ? '#4ade80'
        : '#fb7185';
      ctx.shadowBlur = isPurple ? 15 : isGold ? 13 : 10;

      const grad = ctx.createRadialGradient(-r * 0.24, -r * 0.22, 1.5, 0, 0, r * 0.92);
      if (isPurple) {
        grad.addColorStop(0, '#fae8ff');
        grad.addColorStop(0.38, '#d946ef');
        grad.addColorStop(0.78, '#9333ea');
        grad.addColorStop(1, '#4c1d95');
      } else if (isGold) {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#fde047');
        grad.addColorStop(0.8, '#f59e0b');
        grad.addColorStop(1, '#92400e');
      } else if (isGreen) {
        grad.addColorStop(0, '#dcfce7');
        grad.addColorStop(0.45, '#4ade80');
        grad.addColorStop(1, '#15803d');
      } else {
        grad.addColorStop(0, '#fda4af');
        grad.addColorStop(0.45, '#ef4444');
        grad.addColorStop(1, '#991b1b');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(-r * 0.2, r * 0.08, r * 0.58, 0, Math.PI * 2);
      ctx.arc(r * 0.2, r * 0.08, r * 0.58, 0, Math.PI * 2);
      ctx.fill();

      // Stem
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isPurple ? '#f0abfc' : '#d97706';
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.38);
      ctx.quadraticCurveTo(r * 0.1, -r * 0.72, r * 0.24, -r * 0.8);
      ctx.stroke();

      // Leaf
      ctx.fillStyle = isPurple ? '#e879f9' : isGold ? '#fef08a' : '#4ade80';
      ctx.beginPath();
      ctx.ellipse(r * 0.32, -r * 0.58, r * 0.3, r * 0.15, -0.45, 0, Math.PI * 2);
      ctx.fill();

      // Glossy highlight
      ctx.fillStyle = 'rgba(255,255,255,0.48)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.28, -r * 0.12, r * 0.18, r * 0.09, -0.6, 0, Math.PI * 2);
      ctx.fill();

      if (isGold || isPurple || isGreen) {
        ctx.fillStyle = isPurple ? '#ffffff' : isGreen ? '#052e16' : '#451a03';
        ctx.font = '800 13.5px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isPurple ? '+4' : '+2', 0, r * 0.14);
      }
      break;
    }

    case 'broccoli': {
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.roundRect(-r * 0.26, r * 0.08, r * 0.52, r * 0.76, 5);
      ctx.fill();
      const grad = ctx.createRadialGradient(-r * 0.15, -r * 0.35, 2, 0, -r * 0.2, r * 0.9);
      grad.addColorStop(0, '#86efac');
      grad.addColorStop(0.55, '#16a34a');
      grad.addColorStop(1, '#14532d');
      ctx.fillStyle = grad;
      [
        [-0.44, -0.18, 0.42],
        [0.44, -0.18, 0.42],
        [0, -0.44, 0.48],
        [-0.24, -0.34, 0.4],
        [0.24, -0.34, 0.4],
      ].forEach(([px, py, pr]) => {
        ctx.beginPath();
        ctx.arc(px * r, py * r, pr * r, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'carrot': {
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(-r * 0.22, -r * 0.74, r * 0.2, r * 0.36, -0.38, 0, Math.PI * 2);
      ctx.ellipse(0, -r * 0.8, r * 0.2, r * 0.38, 0, 0, Math.PI * 2);
      ctx.ellipse(r * 0.22, -r * 0.74, r * 0.2, r * 0.36, 0.38, 0, Math.PI * 2);
      ctx.fill();
      const grad = ctx.createLinearGradient(-r * 0.5, -r * 0.45, r * 0.5, r * 0.85);
      grad.addColorStop(0, '#fdba74');
      grad.addColorStop(0.5, '#f97316');
      grad.addColorStop(1, '#c2410c');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-r * 0.48, -r * 0.42);
      ctx.quadraticCurveTo(0, -r * 0.64, r * 0.48, -r * 0.42);
      ctx.lineTo(0, r * 0.94);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(124,45,18,0.58)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-r * 0.24, -r * 0.1);
      ctx.lineTo(r * 0.14, -r * 0.1);
      ctx.moveTo(-r * 0.14, r * 0.24);
      ctx.lineTo(r * 0.18, r * 0.24);
      ctx.stroke();
      break;
    }

    case 'eggplant': {
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 12;
      const grad = ctx.createRadialGradient(-r * 0.2, 0, 2, 0, r * 0.14, r * 1.05);
      grad.addColorStop(0, '#e879f9');
      grad.addColorStop(0.5, '#9333ea');
      grad.addColorStop(1, '#3b0764');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.16, r * 0.55, r * 0.76, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 0.44);
      ctx.quadraticCurveTo(0, -r * 0.74, r * 0.4, -r * 0.44);
      ctx.lineTo(0, -r * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.34)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.24, r * 0.1, r * 0.13, r * 0.34, -0.15, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'chili': {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      const grad = ctx.createLinearGradient(-r * 0.5, -r * 0.5, r * 0.5, r * 0.8);
      grad.addColorStop(0, '#fb7185');
      grad.addColorStop(0.5, '#dc2626');
      grad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-r * 0.25, -r * 0.45);
      ctx.quadraticCurveTo(r * 0.65, -r * 0.1, r * 0.42, r * 0.85);
      ctx.quadraticCurveTo(-r * 0.1, r * 0.55, -r * 0.45, -r * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-r * 0.34, -r * 0.34);
      ctx.quadraticCurveTo(-r * 0.52, -r * 0.68, -r * 0.22, -r * 0.86);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

function drawBasket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tilt: number,
  bounceScale: number,
  hurtFlash: boolean
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(bounceScale, 2 - bounceScale);

  const halfW = BASKET_W / 2;
  const halfH = BASKET_H / 2;

  ctx.shadowColor = hurtFlash ? '#f43f5e' : '#38bdf8';
  ctx.shadowBlur = hurtFlash ? 24 : 16;

  // Basket main trapezoidal body
  const bodyGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
  if (hurtFlash) {
    bodyGrad.addColorStop(0, '#fb7185');
    bodyGrad.addColorStop(1, '#9f1239');
  } else {
    bodyGrad.addColorStop(0, '#f59e0b');
    bodyGrad.addColorStop(0.55, '#b45309');
    bodyGrad.addColorStop(1, '#78350f');
  }
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(-halfW + 4, -halfH + 4);
  ctx.lineTo(halfW - 4, -halfH + 4);
  ctx.lineTo(halfW - 14, halfH);
  ctx.lineTo(-halfW + 14, halfH);
  ctx.closePath();
  ctx.fill();

  // Woven horizontal & vertical lines
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(254, 243, 199, 0.32)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-halfW + 9, 0);
  ctx.lineTo(halfW - 9, 0);
  ctx.moveTo(-halfW + 12, halfH * 0.55);
  ctx.lineTo(halfW - 12, halfH * 0.55);
  for (let wx = -halfW + 22; wx <= halfW - 22; wx += 18) {
    ctx.moveTo(wx, -halfH + 6);
    ctx.lineTo(wx * 0.82, halfH - 2);
  }
  ctx.stroke();

  // Glowing top rim
  const rimGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, -halfH);
  if (hurtFlash) {
    rimGrad.addColorStop(0, '#fda4af');
    rimGrad.addColorStop(0.5, '#ffe4e6');
    rimGrad.addColorStop(1, '#fda4af');
  } else {
    rimGrad.addColorStop(0, '#fde047');
    rimGrad.addColorStop(0.5, '#fef9c3');
    rimGrad.addColorStop(1, '#fbbf24');
  }
  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.roundRect(-halfW, -halfH, BASKET_W, 11, 5.5);
  ctx.fill();

  ctx.restore();
}

const COPY_APPLE = {
  ar: {
    exitBtn: 'خروج',
    title: 'أمسك التفاح وتجنب الخضار',
    stageWord: 'المرحلة',
    applesGoal: (caught: number, target: number) => `${caught} / ${target}`,
    levelsBtn: 'المراحل',
    indexBtn: 'الدليل',
    pauseBtn: 'إيقاف',
    resumeBtn: 'استمرار',
    restartBtn: 'إعادة',
    startBtn: 'ابدأ المرحلة',
    nextStageBtn: 'المرحلة التالية',
    tryAgainBtn: 'حاول مجدداً',
    stageGoalPrompt: (level: number, target: number) =>
      `التقط ${target} تفاحة للفوز بالمرحلة ${level}، وتجنّب جميع الخضار!`,
    goldenTip: 'الذهبية +2 تفاحة · البنفسجية +4 تفاحات (من المرحلة 14+)!',
    stageClearTitle: (level: number) => `أحسنت! أنهيت المرحلة ${level}`,
    allClearTitle: 'بطل البستان! أنهيت جميع المراحل الـ 20!',
    stageClearSub: (caught: number) => `التقطت ${caught} تفاحة بنجاح.`,
    gameOverTitle: 'انتهت القلوب!',
    gameOverSub: (caught: number, target: number) =>
      `التقطت ${caught} من أصل ${target} تفاحة — تجنّب الخضار وحاول مجدداً!`,
    pausedTitle: 'إيقاف مؤقت',
    levelsModalTitle: 'مراحل أمسك التفاح',
    levelsModalSub: (cleared: number) =>
      `مكتمل ${cleared} / ${APPLE_CATCH_TOTAL_LEVELS} · المراحل تُفتح بالتسلسل بعد الفوز`,
    indexModalTitle: 'دليل التفاح والخضار',
    indexModalSub: 'تعرّف على كل عنصر وفائدته أو خطورته داخل اللعبة',
    indexApplesHeading: 'التفاح — التقطه للفوز بالمرحلة',
    indexVeggiesHeading: 'الخضار — تجنّبها لحماية قلوبك',
    closeBtn: 'إغلاق',
    tierNames: {
      orchard: 'بداية البستان (1 – 5)',
      garden: 'مطر الحديقة (6 – 10)',
      storm: 'عاصفة الخضار (11 – 15)',
      master: 'تحدي الحصاد (16 – 20)',
    },
    controlsHint: 'اسحب السلة بإصبعك أو الماوس أو استخدم أسهم اليسار واليمين',
    indexItems: [
      {
        kind: 'red-apple' as FallKind,
        category: 'apple' as const,
        name: 'التفاحة الحمراء',
        badge: '+1 تفاحة',
        unlock: 'من المرحلة 1',
        benefit: 'التفاحة الأساسية في اللعبة؛ كل تفاحة تلتقطها تزيد رصيدك بـ 1 وتقرّبك من إنهاء المرحلة.',
      },
      {
        kind: 'green-apple' as FallKind,
        category: 'apple' as const,
        name: 'التفاحة الخضراء',
        badge: '+2 تفاحة',
        unlock: 'من المرحلة 5+',
        benefit: 'أسرع قليلاً في الهبوط من التفاحة الحمراء وتمنحك تفاحتين (+2) دفعة واحدة لتسريع إنهاء المرحلة.',
      },
      {
        kind: 'gold-apple' as FallKind,
        category: 'apple' as const,
        name: 'التفاحة الذهبية',
        badge: '+2 تفاحة',
        unlock: 'جميع المراحل (نادرة)',
        benefit: 'تفاحة لامعة نادرة تُحسب بتفاحتين (+2) دفعة واحدة لتسريع الفوز في المراحل الصعبة.',
      },
      {
        kind: 'purple-apple' as FallKind,
        category: 'apple' as const,
        name: 'التفاحة البنفسجية',
        badge: '+4 تفاحات',
        unlock: 'من المرحلة 14+',
        benefit: 'تفاحة أسطورية سريعة تبدأ بالظهور من المرحلة 14 فما فوق، وتعطيك +4 تفاحات بضربة واحدة!',
      },
      {
        kind: 'broccoli' as FallKind,
        category: 'veggie' as const,
        name: 'البروكلي',
        badge: '-1 قلب',
        unlock: 'من المرحلة 1',
        benefit: 'عائق أخضر محاط بهالة حمراء؛ التقاطه يخصم قلباً واحداً ويُصفر سلسلة الالتقاط.',
      },
      {
        kind: 'carrot' as FallKind,
        category: 'veggie' as const,
        name: 'الجزر',
        badge: '-1 قلب',
        unlock: 'من المرحلة 1',
        benefit: 'يسقط بكثافة وسط العاصفة؛ تجنّبه تماماً حتى تحافظ على قلوبك الثلاثة.',
      },
      {
        kind: 'eggplant' as FallKind,
        category: 'veggie' as const,
        name: 'الباذنجان',
        badge: '-1 قلب',
        unlock: 'من المرحلة 1',
        benefit: 'خضار خطير لونه بنفسجي داكن محاط بحلقة تحذير حمراء؛ انتبه لعدم الخلط بينه وبين التفاحة البنفسجية!',
      },
      {
        kind: 'chili' as FallKind,
        category: 'veggie' as const,
        name: 'الفلفل الحار',
        badge: '-1 قلب',
        unlock: 'من المرحلة 1',
        benefit: 'فلفل أحمر حار يخصم قلباً فور لمس السلة؛ ميّزه بشكله المقوس وحلقته الحمراء وتفاده بسرعة.',
      },
    ],
  },
  en: {
    exitBtn: 'Exit',
    title: 'Catch Apples, Dodge Veggies',
    stageWord: 'Stage',
    applesGoal: (caught: number, target: number) => `${caught} / ${target}`,
    levelsBtn: 'Stages',
    indexBtn: 'Index',
    pauseBtn: 'Pause',
    resumeBtn: 'Resume',
    restartBtn: 'Restart',
    startBtn: 'Start Stage',
    nextStageBtn: 'Next Stage',
    tryAgainBtn: 'Try Again',
    stageGoalPrompt: (level: number, target: number) =>
      `Catch ${target} apples to clear Stage ${level}, and dodge every vegetable!`,
    goldenTip: 'Golden +2 apples · Purple +4 apples (Stage 14+)!',
    stageClearTitle: (level: number) => `Stage ${level} Cleared!`,
    allClearTitle: 'Orchard Champion! All 20 Stages Cleared!',
    stageClearSub: (caught: number) => `You caught ${caught} apples.`,
    gameOverTitle: 'Out of Hearts!',
    gameOverSub: (caught: number, target: number) =>
      `Caught ${caught} of ${target} apples — dodge the veggies and try again!`,
    pausedTitle: 'Paused',
    levelsModalTitle: 'Apple Catch Stages',
    levelsModalSub: (cleared: number) =>
      `Cleared ${cleared} / ${APPLE_CATCH_TOTAL_LEVELS} · Win stages in order to unlock the next`,
    indexModalTitle: 'Apples & Veggies Index',
    indexModalSub: 'Every falling item, its visual look, and its effect in the game',
    indexApplesHeading: 'Apples — Catch to Clear Stages',
    indexVeggiesHeading: 'Vegetables — Dodge to Protect Hearts',
    closeBtn: 'Close',
    tierNames: {
      orchard: 'Orchard Start (1 – 5)',
      garden: 'Garden Rush (6 – 10)',
      storm: 'Veggie Storm (11 – 15)',
      master: 'Harvest Master (16 – 20)',
    },
    controlsHint: 'Drag the basket with touch/mouse or use Left & Right arrows',
    indexItems: [
      {
        kind: 'red-apple' as FallKind,
        category: 'apple' as const,
        name: 'Red Apple',
        badge: '+1 Apple',
        unlock: 'From Stage 1',
        benefit: 'The core target apple. Every catch adds +1 toward your stage goal and builds your streak.',
      },
      {
        kind: 'green-apple' as FallKind,
        category: 'apple' as const,
        name: 'Green Apple',
        badge: '+2 Apples',
        unlock: 'Stage 5+',
        benefit: 'Falls slightly faster than a Red Apple and grants +2 apples toward clearing the stage.',
      },
      {
        kind: 'gold-apple' as FallKind,
        category: 'apple' as const,
        name: 'Golden Apple',
        badge: '+2 Apples',
        unlock: 'All Stages (Rare)',
        benefit: 'Rare glowing apple stamped +2 that doubles your catch value and speeds up tough stages.',
      },
      {
        kind: 'purple-apple' as FallKind,
        category: 'apple' as const,
        name: 'Purple Apple',
        badge: '+4 Apples',
        unlock: 'Stage 14+',
        benefit: 'Legendary fast neon-purple apple unlocked at Stage 14+ — worth a massive +4 apples at once!',
      },
      {
        kind: 'broccoli' as FallKind,
        category: 'veggie' as const,
        name: 'Broccoli',
        badge: '-1 Heart',
        unlock: 'From Stage 1',
        benefit: 'Hazard marked with a red warning ring. Catching it costs 1 heart and resets your streak.',
      },
      {
        kind: 'carrot' as FallKind,
        category: 'veggie' as const,
        name: 'Carrot',
        badge: '-1 Heart',
        unlock: 'From Stage 1',
        benefit: 'Rains down heavily in veggie storms — weave around it to keep your 3 hearts safe.',
      },
      {
        kind: 'eggplant' as FallKind,
        category: 'veggie' as const,
        name: 'Eggplant',
        badge: '-1 Heart',
        unlock: 'From Stage 1',
        benefit: 'Dark purple hazard inside a red danger ring — watch closely so you do not mistake it for a Purple Apple!',
      },
      {
        kind: 'chili' as FallKind,
        category: 'veggie' as const,
        name: 'Chili Pepper',
        badge: '-1 Heart',
        unlock: 'From Stage 1',
        benefit: 'Fiery curved pepper that takes 1 heart on contact — spot its red ring and dodge fast.',
      },
    ],
  },
} as const;

function IndexItemIcon({ kind }: { kind: FallKind }) {
  const isVeggie =
    kind === 'broccoli' ||
    kind === 'carrot' ||
    kind === 'eggplant' ||
    kind === 'chili';
  const uid = `idx-${kind}`;

  return (
    <svg
      viewBox="0 0 48 48"
      className="w-11 h-11 shrink-0"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${uid}-red`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="48%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </radialGradient>
        <radialGradient id={`${uid}-green`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#dcfce7" />
          <stop offset="48%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#15803d" />
        </radialGradient>
        <radialGradient id={`${uid}-gold`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#fde047" />
          <stop offset="80%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#92400e" />
        </radialGradient>
        <radialGradient id={`${uid}-purple`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fae8ff" />
          <stop offset="40%" stopColor="#d946ef" />
          <stop offset="80%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#4c1d95" />
        </radialGradient>
        <radialGradient id={`${uid}-egg`} cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#e879f9" />
          <stop offset="50%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#3b0764" />
        </radialGradient>
      </defs>

      {isVeggie ? (
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="rgba(244, 63, 94, 0.12)"
          stroke="rgba(244, 63, 94, 0.55)"
          strokeWidth="1.6"
        />
      ) : (
        <circle
          cx="24"
          cy="24"
          r="20"
          fill={
            kind === 'purple-apple'
              ? 'rgba(217, 70, 239, 0.18)'
              : kind === 'gold-apple'
              ? 'rgba(250, 204, 21, 0.18)'
              : kind === 'green-apple'
              ? 'rgba(74, 222, 128, 0.14)'
              : 'rgba(251, 113, 133, 0.14)'
          }
        />
      )}

      {(kind === 'red-apple' ||
        kind === 'green-apple' ||
        kind === 'gold-apple' ||
        kind === 'purple-apple') && (
        <g transform="translate(24, 25)">
          <circle
            cx="-4"
            cy="1.5"
            r="10.2"
            fill={`url(#${uid}-${
              kind === 'purple-apple'
                ? 'purple'
                : kind === 'gold-apple'
                ? 'gold'
                : kind === 'green-apple'
                ? 'green'
                : 'red'
            })`}
          />
          <circle
            cx="4"
            cy="1.5"
            r="10.2"
            fill={`url(#${uid}-${
              kind === 'purple-apple'
                ? 'purple'
                : kind === 'gold-apple'
                ? 'gold'
                : kind === 'green-apple'
                ? 'green'
                : 'red'
            })`}
          />
          <path
            d="M 0 -7 Q 2 -13 4.5 -14.5"
            stroke={kind === 'purple-apple' ? '#f0abfc' : '#d97706'}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <ellipse
            cx="6"
            cy="-10.5"
            rx="5.4"
            ry="2.6"
            transform="rotate(-25 6 -10.5)"
            fill={
              kind === 'purple-apple'
                ? '#e879f9'
                : kind === 'gold-apple'
                ? '#fef08a'
                : '#4ade80'
            }
          />
          <ellipse
            cx="-5.5"
            cy="-2.2"
            rx="3.2"
            ry="1.6"
            transform="rotate(-32 -5.5 -2.2)"
            fill="rgba(255,255,255,0.48)"
          />
          {(kind === 'gold-apple' ||
            kind === 'purple-apple' ||
            kind === 'green-apple') && (
            <text
              x="0"
              y="3"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={
                kind === 'purple-apple'
                  ? '#ffffff'
                  : kind === 'green-apple'
                  ? '#052e16'
                  : '#451a03'
              }
              fontSize="11"
              fontWeight="800"
              fontFamily="system-ui, sans-serif"
            >
              {kind === 'purple-apple' ? '+4' : '+2'}
            </text>
          )}
        </g>
      )}

      {kind === 'broccoli' && (
        <g transform="translate(24, 25)">
          <rect x="-4" y="1" width="8" height="12" rx="3" fill="#86efac" />
          <circle cx="-7" cy="-3" r="6.8" fill="#16a34a" />
          <circle cx="7" cy="-3" r="6.8" fill="#16a34a" />
          <circle cx="0" cy="-7" r="7.6" fill="#22c55e" />
          <circle cx="-3.5" cy="-5.5" r="5.4" fill="#4ade80" opacity="0.6" />
        </g>
      )}

      {kind === 'carrot' && (
        <g transform="translate(24, 25)">
          <ellipse cx="-3.5" cy="-12" rx="3" ry="5.5" transform="rotate(-22 -3.5 -12)" fill="#4ade80" />
          <ellipse cx="0" cy="-13" rx="3" ry="6" fill="#22c55e" />
          <ellipse cx="3.5" cy="-12" rx="3" ry="5.5" transform="rotate(22 3.5 -12)" fill="#4ade80" />
          <path d="M -8 -6 Q 0 -10 8 -6 L 0 15 Z" fill="#f97316" />
          <line x1="-4" y1="-1.5" x2="2.5" y2="-1.5" stroke="#7c2d12" strokeOpacity="0.55" strokeWidth="1.6" />
          <line x1="-2.2" y1="4" x2="3" y2="4" stroke="#7c2d12" strokeOpacity="0.55" strokeWidth="1.6" />
        </g>
      )}

      {kind === 'eggplant' && (
        <g transform="translate(24, 24)">
          <ellipse cx="0" cy="3" rx="9" ry="12.2" fill={`url(#${uid}-egg)`} />
          <path d="M -6.5 -7 Q 0 -12 6.5 -7 L 0 -3 Z" fill="#4ade80" />
          <ellipse cx="-3.8" cy="2" rx="2.1" ry="5.5" transform="rotate(-8 -3.8 2)" fill="rgba(255,255,255,0.34)" />
        </g>
      )}

      {kind === 'chili' && (
        <g transform="translate(24, 25)">
          <path
            d="M -4 -7 Q 10.5 -1.5 6.8 13.5 Q -1.5 8.8 -7.2 -3 Z"
            fill="#dc2626"
          />
          <path
            d="M -5.4 -5.4 Q -8.2 -10.8 -3.5 -13.6"
            stroke="#4ade80"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}

export function AppleCatchPreviewArt() {
  return (
    <svg
      viewBox="0 0 260 130"
      className="w-full h-full block"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="ac-red-apple" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </radialGradient>
        <radialGradient id="ac-gold-apple" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        <linearGradient id="ac-basket" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>

      <rect width="260" height="130" fill="#071123" />
      <circle cx="130" cy="70" r="78" fill="#ef4444" opacity="0.1" />
      <circle cx="195" cy="40" r="44" fill="#facc15" opacity="0.1" />

      {/* Falling Red Apple */}
      <g transform="translate(82, 42)">
        <circle cx="0" cy="0" r="15" fill="#f43f5e" opacity="0.2" />
        <circle cx="-3.5" cy="1.5" r="8" fill="url(#ac-red-apple)" />
        <circle cx="3.5" cy="1.5" r="8" fill="url(#ac-red-apple)" />
        <path d="M 0 -6 Q 2 -11 4.5 -12" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="5.5" cy="-9" rx="4.5" ry="2.2" transform="rotate(-25 5.5 -9)" fill="#4ade80" />
      </g>

      {/* Falling Golden Apple */}
      <g transform="translate(152, 34)">
        <circle cx="0" cy="0" r="16" fill="#facc15" opacity="0.24" />
        <circle cx="-3.5" cy="1.5" r="8" fill="url(#ac-gold-apple)" />
        <circle cx="3.5" cy="1.5" r="8" fill="url(#ac-gold-apple)" />
        <path d="M 0 -6 Q 2 -11 4.5 -12" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="5.5" cy="-9" rx="4.5" ry="2.2" transform="rotate(-25 5.5 -9)" fill="#fef08a" />
      </g>

      {/* Veggie to dodge: Broccoli (left) with red danger ring */}
      <g transform="translate(42, 74)">
        <circle cx="0" cy="0" r="14" fill="#f43f5e" opacity="0.12" stroke="#f43f5e" strokeOpacity="0.5" strokeWidth="1.2" />
        <rect x="-3" y="1" width="6" height="8" rx="2" fill="#86efac" />
        <circle cx="-4.5" cy="-2" r="4.8" fill="#22c55e" />
        <circle cx="4.5" cy="-2" r="4.8" fill="#22c55e" />
        <circle cx="0" cy="-5" r="5.2" fill="#16a34a" />
      </g>

      {/* Veggie to dodge: Carrot (right) with red danger ring */}
      <g transform="translate(212, 62)">
        <circle cx="0" cy="0" r="14" fill="#f43f5e" opacity="0.12" stroke="#f43f5e" strokeOpacity="0.5" strokeWidth="1.2" />
        <g transform="rotate(-25)">
          <ellipse cx="0" cy="-8" rx="2.4" ry="4" fill="#4ade80" />
          <path d="M -5 -4 Q 0 -7 5 -4 L 0 10 Z" fill="#f97316" />
        </g>
      </g>

      {/* Glowing Catching Basket */}
      <g transform="translate(125, 102)">
        <path d="M -30 -8 L 30 -8 L 22 14 L -22 14 Z" fill="url(#ac-basket)" />
        <rect x="-33" y="-12" width="66" height="7" rx="3.5" fill="#fde047" />
        <line x1="-26" y1="2" x2="26" y2="2" stroke="#fef3c7" strokeOpacity="0.35" strokeWidth="1.4" />
      </g>
    </svg>
  );
}

interface CatchEngine {
  basketX: number;
  targetBasketX: number | null;
  basketVx: number;
  basketBounce: number;
  hurtUntil: number;
  shakeUntil: number;
  items: FallingItem[];
  particles: SplashParticle[];
  floats: FloatingNote[];
  caught: number;
  hearts: number;
  streak: number;
  spawnTimerMs: number;
  sinceLastAppleMs: number;
  nextItemId: number;
  holdLeft: boolean;
  holdRight: boolean;
}

export const AppleCatchGame: React.FC<AppleCatchGameProps> = ({
  lang,
  sfxEnabled,
  musicEnabled,
  onToggleMusic,
  onExitToHub,
}) => {
  const t = COPY_APPLE[lang];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<AppleCatchAudio>(new AppleCatchAudio());

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
  const [phase, setPhase] = useState<GamePhase>('READY');
  const [caughtApples, setCaughtApples] = useState<number>(0);
  const [hearts, setHearts] = useState<number>(MAX_HEARTS);
  const [levelsModalOpen, setLevelsModalOpen] = useState<boolean>(false);
  const [indexModalOpen, setIndexModalOpen] = useState<boolean>(false);

  useGameMusic(
    'apple-catch',
    musicEnabled && phase !== 'PAUSED' && phase !== 'GAME_OVER'
  );

  const spec = STAGE_SPECS[currentLevel - 1] ?? STAGE_SPECS[0];
  const specRef = useRef<StageSpec>(spec);
  const phaseRef = useRef<GamePhase>(phase);
  const levelsOpenRef = useRef<boolean>(levelsModalOpen);
  const indexOpenRef = useRef<boolean>(indexModalOpen);
  const clearedRef = useRef<number[]>(clearedLevels);

  specRef.current = spec;
  phaseRef.current = phase;
  levelsOpenRef.current = levelsModalOpen;
  indexOpenRef.current = indexModalOpen;
  clearedRef.current = clearedLevels;

  useEffect(() => {
    audioRef.current.enabled = sfxEnabled;
  }, [sfxEnabled]);

  const makeFreshEngine = useCallback((): CatchEngine => ({
    basketX: CANVAS_W / 2,
    targetBasketX: null,
    basketVx: 0,
    basketBounce: 1,
    hurtUntil: 0,
    shakeUntil: 0,
    items: [],
    particles: [],
    floats: [],
    caught: 0,
    hearts: MAX_HEARTS,
    streak: 0,
    spawnTimerMs: 140,
    sinceLastAppleMs: 900,
    nextItemId: 1,
    holdLeft: false,
    holdRight: false,
  }), []);

  const engineRef = useRef<CatchEngine>(makeFreshEngine());

  const startStage = useCallback(
    (levelNum: number, autoPlay = true) => {
      const clamped = Math.max(
        1,
        Math.min(APPLE_CATCH_TOTAL_LEVELS, levelNum)
      );
      setCurrentLevel(clamped);
      specRef.current = STAGE_SPECS[clamped - 1];
      engineRef.current = makeFreshEngine();
      setCaughtApples(0);
      setHearts(MAX_HEARTS);
      setLevelsModalOpen(false);
      setPhase(autoPlay ? 'PLAYING' : 'READY');
    },
    [makeFreshEngine]
  );

  const togglePause = useCallback(() => {
    if (phaseRef.current === 'PLAYING') {
      setPhase('PAUSED');
    } else if (phaseRef.current === 'PAUSED') {
      setPhase('PLAYING');
    }
  }, []);

  // Keyboard controls (Left/Right/A/D + Space/P + Escape)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (indexOpenRef.current) {
          setIndexModalOpen(false);
        } else if (levelsOpenRef.current) {
          setLevelsModalOpen(false);
        } else {
          onExitToHub();
        }
        return;
      }

      if (levelsOpenRef.current || indexOpenRef.current) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        engineRef.current.holdLeft = true;
        engineRef.current.targetBasketX = null;
        if (phaseRef.current === 'READY') setPhase('PLAYING');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        engineRef.current.holdRight = true;
        engineRef.current.targetBasketX = null;
        if (phaseRef.current === 'READY') setPhase('PLAYING');
      } else if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (phaseRef.current === 'READY') {
          setPhase('PLAYING');
        } else if (phaseRef.current === 'PLAYING' || phaseRef.current === 'PAUSED') {
          togglePause();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        engineRef.current.holdLeft = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        engineRef.current.holdRight = false;
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [onExitToHub, togglePause]);

  // 60fps simulation & render loop
  useEffect(() => {
    let rafId = 0;
    let prevAt = performance.now();

    const spawnSplash = (x: number, y: number, color: string, count: number) => {
      const eng = engineRef.current;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const spd = 65 + Math.random() * 145;
        eng.particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 35,
          life: 0,
          maxLife: 0.35 + Math.random() * 0.25,
          radius: 2.5 + Math.random() * 2.8,
          color,
        });
      }
    };

    const spawnItem = () => {
      const eng = engineRef.current;
      const st = specRef.current;

      // Drastically rarer apples (~7x rarer relative to veggies) with a fair anti-drought guard
      const minAppleGapMs = Math.max(1750, 2350 - st.level * 25);
      const maxAppleGapMs = Math.max(3100, 4100 - st.level * 45);
      let isVeggie: boolean;
      if (eng.sinceLastAppleMs < minAppleGapMs) {
        isVeggie = true;
      } else if (eng.sinceLastAppleMs >= maxAppleGapMs) {
        isVeggie = false;
      } else {
        isVeggie = Math.random() < st.veggieRatio;
      }

      let kind: FallKind;
      let appleValue = 0;
      if (isVeggie) {
        const veggies: FallKind[] = ['broccoli', 'carrot', 'eggplant', 'chili'];
        kind = veggies[Math.floor(Math.random() * veggies.length)];
      } else {
        eng.sinceLastAppleMs = 0;
        const r = Math.random();
        if (st.level >= 14 && r < st.purpleChance) {
          kind = 'purple-apple';
          appleValue = 4;
        } else if (r < st.purpleChance + st.goldChance) {
          kind = 'gold-apple';
          appleValue = 2;
        } else if (
          st.level >= 5 &&
          r < st.purpleChance + st.goldChance + 0.26
        ) {
          kind = 'green-apple';
          appleValue = 2;
        } else {
          kind = 'red-apple';
          appleValue = 1;
        }
      }

      const radius = isVeggie ? 16 : 24; // Apples enlarged by +50% (16 -> 24)
      const margin = isVeggie ? 30 : 44;

      // Pick a readable lane: rare apples seek clearance from top veggies; veggies avoid clumping right onto new apples
      let baseX = margin + Math.random() * (CANVAS_W - margin * 2);
      if (!isVeggie) {
        const topVeggies = eng.items.filter((it) => !it.isApple && it.y < 150);
        let bestX = baseX;
        let bestScore = -1;
        for (let c = 0; c < 8; c++) {
          const cand = margin + Math.random() * (CANVAS_W - margin * 2);
          let minDist = 9999;
          for (const v of topVeggies) {
            const d = Math.abs(cand - v.x);
            if (d < minDist) minDist = d;
          }
          if (minDist > bestScore) {
            bestScore = minDist;
            bestX = cand;
          }
        }
        baseX = bestX;
      } else {
        const topItems = eng.items.filter(
          (it) => (it.isApple && it.y < 120) || (!it.isApple && it.y < 42)
        );
        if (topItems.length > 0) {
          let bestX = baseX;
          let bestScore = -1;
          for (let c = 0; c < 4; c++) {
            const cand = margin + Math.random() * (CANVAS_W - margin * 2);
            let minDist = 9999;
            for (const other of topItems) {
              const weight = other.isApple ? 1.5 : 1;
              const d = Math.abs(cand - other.x) / weight;
              if (d < minDist) minDist = d;
            }
            if (minDist > bestScore) {
              bestScore = minDist;
              bestX = cand;
            }
          }
          baseX = bestX;
        }
      }

      const baseSpeed =
        st.minSpeed + Math.random() * (st.maxSpeed - st.minSpeed);
      const speedMult =
        kind === 'purple-apple'
          ? 1.14
          : kind === 'gold-apple'
          ? 1.1
          : kind === 'green-apple'
          ? 1.05
          : 1;
      const doesSway = Math.random() < st.swayChance;

      eng.items.push({
        id: eng.nextItemId++,
        kind,
        isApple: !isVeggie,
        appleValue,
        x: baseX,
        baseX,
        y: -radius - 6,
        vx: (Math.random() - 0.5) * (st.level >= 7 ? 32 : 12),
        vy: baseSpeed * speedMult,
        radius,
        angle: (Math.random() - 0.5) * 0.4,
        spin: (Math.random() - 0.5) * 2.2,
        swayAmp: doesSway ? (isVeggie ? 18 + Math.random() * 22 : 20 + Math.random() * 24) : 0,
        swaySpeed: 2.1 + Math.random() * 1.5,
        swayPhase: Math.random() * Math.PI * 2,
        age: 0,
      });
    };

    const markStageCleared = (levelNum: number) => {
      if (!clearedRef.current.includes(levelNum)) {
        const next = [...clearedRef.current, levelNum].sort((a, b) => a - b);
        clearedRef.current = next;
        setClearedLevels(next);
        saveClearedLevels(next);
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - prevAt) / 1000));
      prevAt = now;

      const eng = engineRef.current;
      const st = specRef.current;
      const isPlaying =
        phaseRef.current === 'PLAYING' &&
        !levelsOpenRef.current &&
        !indexOpenRef.current;

      if (isPlaying) {
        // Move basket smoothly
        const prevX = eng.basketX;
        const keySpeed = 590;
        if (eng.holdLeft && !eng.holdRight) {
          eng.basketX -= keySpeed * dt;
        } else if (eng.holdRight && !eng.holdLeft) {
          eng.basketX += keySpeed * dt;
        } else if (eng.targetBasketX !== null) {
          const diff = eng.targetBasketX - eng.basketX;
          eng.basketX += diff * Math.min(1, dt * 20);
        }

        const minX = BASKET_W / 2 + 8;
        const maxX = CANVAS_W - BASKET_W / 2 - 8;
        eng.basketX = Math.max(minX, Math.min(maxX, eng.basketX));
        eng.basketVx = dt > 0 ? (eng.basketX - prevX) / dt : 0;

        // Recover bounce scale smoothly
        eng.basketBounce += (1 - eng.basketBounce) * Math.min(1, dt * 12);

        // Spawn falling items
        eng.sinceLastAppleMs += dt * 1000;
        eng.spawnTimerMs -= dt * 1000;
        if (eng.spawnTimerMs <= 0) {
          spawnItem();
          eng.spawnTimerMs =
            st.spawnIntervalMs * (0.8 + Math.random() * 0.4);
        }

        // Update falling items & collision with basket
        const catchTop = BASKET_Y - BASKET_H / 2 - 4;
        const catchBottom = BASKET_Y + BASKET_H / 2;
        const appleCatchHalfW = BASKET_W / 2 + 4;
        const veggieHitHalfW = BASKET_W / 2 - 4;

        for (let i = eng.items.length - 1; i >= 0; i--) {
          const it = eng.items[i];
          it.age += dt;
          it.y += it.vy * dt;
          it.baseX += it.vx * dt;
          if (it.baseX < 28) {
            it.baseX = 28;
            it.vx = Math.abs(it.vx);
          } else if (it.baseX > CANVAS_W - 28) {
            it.baseX = CANVAS_W - 28;
            it.vx = -Math.abs(it.vx);
          }
          it.x =
            it.baseX +
            (it.swayAmp > 0
              ? Math.sin(it.age * it.swaySpeed + it.swayPhase) * it.swayAmp
              : 0);
          it.x = Math.max(24, Math.min(CANVAS_W - 24, it.x));
          it.angle += it.spin * dt;

          // Check basket collision (generous for rare apples, crisp & fair for dense veggies)
          const inY = it.isApple
            ? it.y + it.radius * 0.68 >= catchTop && it.y - it.radius * 0.5 <= catchBottom
            : it.y + it.radius * 0.55 >= catchTop + 4 && it.y - it.radius * 0.4 <= catchBottom - 2;
          const inX = it.isApple
            ? Math.abs(it.x - eng.basketX) <= appleCatchHalfW + it.radius * 0.45
            : Math.abs(it.x - eng.basketX) <= veggieHitHalfW + it.radius * 0.25;

          if (inY && inX) {
            eng.items.splice(i, 1);

            if (it.isApple) {
              eng.caught += it.appleValue;
              if (it.kind !== 'green-apple') {
                eng.streak += 1;
              }
              eng.basketBounce = 1.15;
              setCaughtApples(eng.caught);

              if (it.kind === 'purple-apple') {
                eng.basketBounce = 1.22;
                audioRef.current.playCatchPurple();
                spawnSplash(it.x, BASKET_Y - 12, '#d946ef', 24);
                eng.floats.push({
                  x: it.x,
                  y: BASKET_Y - 28,
                  text: '+4!',
                  color: '#f0abfc',
                  life: 0,
                  maxLife: 0.95,
                });
              } else if (it.kind === 'gold-apple') {
                audioRef.current.playCatchGold();
                spawnSplash(it.x, BASKET_Y - 12, '#fde047', 18);
                eng.floats.push({
                  x: it.x,
                  y: BASKET_Y - 26,
                  text: '+2!',
                  color: '#fef08a',
                  life: 0,
                  maxLife: 0.85,
                });
              } else if (it.kind === 'green-apple') {
                audioRef.current.playCatchApple(2);
                spawnSplash(it.x, BASKET_Y - 12, '#4ade80', 16);
                eng.floats.push({
                  x: it.x,
                  y: BASKET_Y - 26,
                  text: '+2!',
                  color: '#86efac',
                  life: 0,
                  maxLife: 0.82,
                });
              } else {
                audioRef.current.playCatchApple(eng.streak);
                spawnSplash(it.x, BASKET_Y - 12, '#fb7185', 12);
                eng.floats.push({
                  x: it.x,
                  y: BASKET_Y - 24,
                  text: '+1',
                  color: '#fda4af',
                  life: 0,
                  maxLife: 0.72,
                });
              }

              if (eng.caught >= st.targetApples) {
                audioRef.current.playStageWin();
                markStageCleared(st.level);
                setPhase('STAGE_CLEAR');
                break;
              }
            } else {
              // Hit a vegetable!
              if (now >= eng.hurtUntil) {
                eng.hearts = Math.max(0, eng.hearts - 1);
                eng.streak = 0;
                eng.hurtUntil = now + 750;
                eng.shakeUntil = now + 260;
                setHearts(eng.hearts);
                audioRef.current.playHitVeggie();
                spawnSplash(it.x, BASKET_Y - 10, '#f43f5e', 16);
                eng.floats.push({
                  x: it.x,
                  y: BASKET_Y - 28,
                  text: '-1 ♥',
                  color: '#fb7185',
                  life: 0,
                  maxLife: 0.9,
                });

                if (eng.hearts <= 0) {
                  audioRef.current.playGameOver();
                  setPhase('GAME_OVER');
                  break;
                }
              }
            }
            continue;
          }

          if (it.y - it.radius > CANVAS_H + 16) {
            eng.items.splice(i, 1);
          }
        }
      }

      // Update particles & floating notes
      for (let i = eng.particles.length - 1; i >= 0; i--) {
        const p = eng.particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          eng.particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 260 * dt;
      }

      for (let i = eng.floats.length - 1; i >= 0; i--) {
        const f = eng.floats[i];
        f.life += dt;
        if (f.life >= f.maxLife) {
          eng.floats.splice(i, 1);
          continue;
        }
        f.y -= 44 * dt;
      }

      // Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          if (now < eng.shakeUntil) {
            const mag = ((eng.shakeUntil - now) / 260) * 7;
            ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
          }

          // Deep neon night orchard sky gradient
          const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
          bg.addColorStop(0, '#0a162b');
          bg.addColorStop(0.75, '#071122');
          bg.addColorStop(1, '#091b24');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

          // Subtle star/firefly backdrop dots
          ctx.fillStyle = 'rgba(148, 163, 184, 0.14)';
          for (let i = 0; i < 24; i++) {
            const sx = ((i * 97) % (CANVAS_W - 40)) + 20;
            const sy = ((i * 61) % (CANVAS_H - 120)) + 20;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.3, 0, Math.PI * 2);
            ctx.fill();
          }

          // Soft neon horizon ground line
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.22)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(16, CANVAS_H - 18);
          ctx.lineTo(CANVAS_W - 16, CANVAS_H - 18);
          ctx.stroke();

          // Draw falling apples & veggies
          for (const it of eng.items) {
            drawFallingSprite(ctx, it);
          }

          // Draw player basket
          const tilt = Math.max(-0.16, Math.min(0.16, eng.basketVx * 0.00028));
          const hurtFlash =
            now < eng.hurtUntil && Math.floor(now / 85) % 2 === 0;
          drawBasket(
            ctx,
            eng.basketX,
            BASKET_Y,
            tilt,
            eng.basketBounce,
            hurtFlash
          );

          // Draw splash particles
          for (const p of eng.particles) {
            const alpha = Math.max(0, 1 - p.life / p.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Draw floating score/damage texts
          for (const f of eng.floats) {
            const alpha = Math.max(0, 1 - f.life / f.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = f.color;
            ctx.font = '800 20px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(f.text, f.x, f.y);
            ctx.restore();
          }

          ctx.restore();
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const updateBasketFromClientX = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    const normX = (clientX - rect.left) / rect.width;
    engineRef.current.targetBasketX = normX * CANVAS_W;
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase === 'READY') {
      setPhase('PLAYING');
    }
    if (phase === 'PLAYING' || phase === 'READY') {
      e.currentTarget.setPointerCapture(e.pointerId);
      updateBasketFromClientX(e.clientX);
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'PLAYING') return;
    if (e.pointerType === 'mouse' || e.buttons > 0) {
      updateBasketFromClientX(e.clientX);
    }
  };

  const progressPct = Math.min(
    100,
    Math.round((caughtApples / Math.max(1, spec.targetApples)) * 100)
  );
  const allCleared = currentLevel >= APPLE_CATCH_TOTAL_LEVELS;

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 h-[100dvh] z-50 bg-[#060c18] text-slate-100 flex flex-col overflow-hidden select-none"
    >
      {/* Top Bar with Corner Exit Button */}
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

          {/* Center Stage & Title */}
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xs sm:text-base font-bold text-white whitespace-nowrap truncate">
              {t.title}
            </h1>
            <span className="text-slate-600 hidden sm:inline">·</span>
            <span className="font-num text-xs sm:text-sm font-bold text-amber-300 whitespace-nowrap shrink-0">
              {t.stageWord} {currentLevel}/{APPLE_CATCH_TOTAL_LEVELS}
            </span>
          </div>

          {/* 3 Hearts Indicator + Music Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 shrink-0" aria-label="Hearts">
              {Array.from({ length: MAX_HEARTS }).map((_, idx) => {
                const filled = idx < hearts;
                return (
                  <svg
                    key={idx}
                    viewBox="0 0 24 24"
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                      filled ? 'text-rose-500 scale-100' : 'text-slate-700 scale-90'
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
      </header>

      {/* Main Stage */}
      <main className="relative flex-1 min-h-0 flex flex-col items-center justify-start px-2.5 sm:px-5 pt-2 pb-3 gap-2 overflow-y-auto">
        <div className="w-[min(96vw,calc((100dvh-180px)*64/52),680px)] min-w-[280px] flex flex-col items-center gap-2 shrink-0">
          {/* Apple Goal Progress Bar */}
          <div className="w-full flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-rose-200 whitespace-nowrap shrink-0">
              <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-br from-rose-300 via-red-500 to-red-800 border border-rose-200/60" />
              <span className="font-num">
                {t.applesGoal(caughtApples, spec.targetApples)}
              </span>
            </div>
            <div className="flex-1 h-2.5 rounded-full bg-slate-900 border border-white/10 overflow-hidden">
              <div
                style={{ width: `${progressPct}%` }}
                className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-150"
              />
            </div>
            <span className="font-num text-xs font-bold text-emerald-300 whitespace-nowrap shrink-0">
              {progressPct}%
            </span>
          </div>

          {/* Interactive Falling Canvas */}
          <div
            dir="ltr"
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            className="relative w-full aspect-[64/52] rounded-2xl border border-rose-400/25 bg-[#071122] shadow-[0_0_40px_rgba(244,63,94,0.12)] touch-none overflow-hidden"
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full h-full block"
            />

            {/* Ready Overlay */}
            {phase === 'READY' && (
              <div
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                className="absolute inset-0 z-10 flex items-center justify-center p-5 bg-[#050b16]/80 backdrop-blur-[2px]"
              >
                <div className="w-full max-w-xs text-center">
                  <div className="text-xs font-bold text-amber-300 mb-1">
                    {t.stageWord} {currentLevel} / {APPLE_CATCH_TOTAL_LEVELS}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    {t.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-1.5">
                    {t.stageGoalPrompt(currentLevel, spec.targetApples)}
                  </p>
                  <p className="text-xs text-amber-300 mb-5">{t.goldenTip}</p>
                  <button
                    type="button"
                    onClick={() => startStage(currentLevel, true)}
                    className="min-w-[165px] px-6 py-3 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm sm:text-base transition-colors whitespace-nowrap cursor-pointer"
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
                className="absolute inset-0 z-10 flex items-center justify-center p-5 bg-[#050b16]/84 backdrop-blur-[3px]"
              >
                <div className="w-full max-w-xs text-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
                    {t.pausedTitle}
                  </h2>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={togglePause}
                      className="w-full sm:w-auto min-w-[140px] px-5 py-3 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {t.resumeBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => startStage(currentLevel, true)}
                      className="w-full sm:w-auto px-5 py-3 rounded-lg border border-white/15 bg-slate-800/85 hover:bg-slate-700 text-slate-100 font-semibold text-sm transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {t.restartBtn}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stage Clear Overlay */}
            {phase === 'STAGE_CLEAR' && (
              <div
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                className="absolute inset-0 z-10 flex items-center justify-center p-5 bg-[#050b16]/86 backdrop-blur-[3px]"
              >
                <div className="w-full max-w-xs text-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-amber-300 mb-1.5">
                    {allCleared
                      ? t.allClearTitle
                      : t.stageClearTitle(currentLevel)}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 mb-5">
                    {t.stageClearSub(caughtApples)}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    {!allCleared && (
                      <button
                        type="button"
                        onClick={() => startStage(currentLevel + 1, true)}
                        className="w-full sm:w-auto min-w-[155px] px-6 py-3 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm sm:text-base transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {t.nextStageBtn}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => startStage(currentLevel, true)}
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
                className="absolute inset-0 z-10 flex items-center justify-center p-5 bg-[#050b16]/88 backdrop-blur-[3px]"
              >
                <div className="w-full max-w-xs text-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-rose-300 mb-1.5">
                    {t.gameOverTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-5">
                    {t.gameOverSub(caughtApples, spec.targetApples)}
                  </p>
                  <button
                    type="button"
                    onClick={() => startStage(currentLevel, true)}
                    className="min-w-[160px] px-6 py-3 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm sm:text-base transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {t.tryAgainBtn}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Controls Bar: Stages / Pause / Restart + Big Left/Right Hold Arrows */}
          <div className="w-full flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (phase === 'PLAYING') setPhase('PAUSED');
                  setLevelsModalOpen(true);
                }}
                className="h-11 px-2.5 sm:px-3.5 rounded-xl border border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                {t.levelsBtn}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (phase === 'PLAYING') setPhase('PAUSED');
                  setIndexModalOpen(true);
                }}
                className="h-11 px-2.5 sm:px-3.5 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-200 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
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
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span>{t.indexBtn}</span>
              </button>

              <button
                type="button"
                disabled={phase !== 'PLAYING' && phase !== 'PAUSED'}
                onClick={togglePause}
                className={`h-11 px-2.5 sm:px-3.5 rounded-xl border text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                  phase !== 'PLAYING' && phase !== 'PAUSED'
                    ? 'border-white/5 bg-slate-900/50 text-slate-500 cursor-not-allowed'
                    : 'border-white/15 bg-slate-900/90 hover:bg-slate-800 text-slate-100 cursor-pointer'
                }`}
              >
                {phase === 'PAUSED' ? t.resumeBtn : t.pauseBtn}
              </button>

              <button
                type="button"
                onClick={() => startStage(currentLevel, true)}
                className="h-11 px-2.5 sm:px-3.5 rounded-xl border border-rose-400/35 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                {t.restartBtn}
              </button>
            </div>

            {/* Holdable Left / Right Move Buttons */}
            <div dir="ltr" className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                aria-label="Move Left"
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (phase === 'READY') setPhase('PLAYING');
                  engineRef.current.holdLeft = true;
                  engineRef.current.targetBasketX = null;
                }}
                onPointerUp={() => {
                  engineRef.current.holdLeft = false;
                }}
                onPointerLeave={() => {
                  engineRef.current.holdLeft = false;
                }}
                onPointerCancel={() => {
                  engineRef.current.holdLeft = false;
                }}
                className="w-13 h-11 sm:w-14 sm:h-11 rounded-xl border border-rose-400/40 bg-slate-900/95 hover:bg-slate-800 active:bg-rose-500/30 active:scale-95 text-rose-100 inline-flex items-center justify-center transition-all cursor-pointer touch-manipulation"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6"
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
              <button
                type="button"
                aria-label="Move Right"
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (phase === 'READY') setPhase('PLAYING');
                  engineRef.current.holdRight = true;
                  engineRef.current.targetBasketX = null;
                }}
                onPointerUp={() => {
                  engineRef.current.holdRight = false;
                }}
                onPointerLeave={() => {
                  engineRef.current.holdRight = false;
                }}
                onPointerCancel={() => {
                  engineRef.current.holdRight = false;
                }}
                className="w-13 h-11 sm:w-14 sm:h-11 rounded-xl border border-rose-400/40 bg-slate-900/95 hover:bg-slate-800 active:bg-rose-500/30 active:scale-95 text-rose-100 inline-flex items-center justify-center transition-all cursor-pointer touch-manipulation"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6"
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
            </div>
          </div>

          <p className="text-center text-[11px] sm:text-xs text-slate-400">
            {t.controlsHint}
          </p>
        </div>

        {/* Locked Stages Selector Modal */}
        {levelsModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            onClick={() => setLevelsModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[84dvh] rounded-2xl border border-white/15 bg-[#0c1629] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {t.levelsModalTitle}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {t.levelsModalSub(clearedLevels.length)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLevelsModalOpen(false)}
                  className="h-9 px-3 rounded-lg border border-white/15 bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-100 cursor-pointer"
                >
                  {t.closeBtn}
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-4">
                {(['orchard', 'garden', 'storm', 'master'] as const).map(
                  (tierKey) => {
                    const tierStages = STAGE_SPECS.filter(
                      (s) => s.tierKey === tierKey
                    );
                    return (
                      <div key={tierKey}>
                        <h3 className="text-xs font-bold text-amber-300 mb-2">
                          {t.tierNames[tierKey]}
                        </h3>
                        <div className="grid grid-cols-5 gap-2">
                          {tierStages.map((s) => {
                            const isDone = clearedLevels.includes(s.level);
                            const isUnlocked = s.level <= maxUnlocked;
                            const isActive = s.level === currentLevel;
                            return (
                              <button
                                key={s.level}
                                type="button"
                                disabled={!isUnlocked}
                                onClick={() => startStage(s.level, false)}
                                className={`relative h-14 rounded-xl border flex flex-col items-center justify-center transition-colors ${
                                  !isUnlocked
                                    ? 'border-white/5 bg-slate-900/50 text-slate-600 cursor-not-allowed'
                                    : isActive
                                    ? 'border-rose-400 bg-rose-500/20 text-white cursor-pointer'
                                    : isDone
                                    ? 'border-emerald-400/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100 cursor-pointer'
                                    : 'border-white/15 bg-slate-800/80 hover:bg-slate-700 text-slate-100 cursor-pointer'
                                }`}
                              >
                                <span className="font-num text-sm font-extrabold leading-none">
                                  {s.level}
                                </span>
                                {isUnlocked ? (
                                  <span className="font-num text-[10px] text-slate-300 mt-0.5">
                                    {s.targetApples}
                                  </span>
                                ) : (
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="w-3.5 h-3.5 mt-0.5 text-slate-500"
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
                                )}
                                {isDone && (
                                  <span
                                    aria-hidden="true"
                                    className="absolute top-1 end-1 text-emerald-400"
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
                  }
                )}
              </div>
            </div>
          </div>
        )}

        {/* Apples & Vegetables Visual Index Modal */}
        {indexModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm"
            onClick={() => setIndexModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[86dvh] rounded-2xl border border-white/15 bg-[#0c1629] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {t.indexModalTitle}
                  </h2>
                  <p className="text-xs text-slate-400">{t.indexModalSub}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIndexModalOpen(false)}
                  className="h-9 px-3 rounded-lg border border-white/15 bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-100 cursor-pointer"
                >
                  {t.closeBtn}
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-5">
                {/* Apples Section */}
                <section>
                  <h3 className="text-xs sm:text-sm font-bold text-emerald-300 mb-2.5">
                    {t.indexApplesHeading}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {t.indexItems
                      .filter((item) => item.category === 'apple')
                      .map((item) => {
                        const accentClass =
                          item.kind === 'purple-apple'
                            ? 'border-fuchsia-400/40 bg-fuchsia-500/10'
                            : item.kind === 'gold-apple'
                            ? 'border-amber-400/40 bg-amber-500/10'
                            : item.kind === 'green-apple'
                            ? 'border-emerald-400/35 bg-emerald-500/10'
                            : 'border-rose-400/35 bg-rose-500/10';
                        const badgeClass =
                          item.kind === 'purple-apple'
                            ? 'text-fuchsia-200 bg-fuchsia-500/25 border-fuchsia-400/40'
                            : item.kind === 'gold-apple'
                            ? 'text-amber-200 bg-amber-500/25 border-amber-400/40'
                            : 'text-emerald-200 bg-emerald-500/20 border-emerald-400/35';

                        return (
                          <div
                            key={item.kind}
                            className={`rounded-xl border p-3 flex items-start gap-3 ${accentClass}`}
                          >
                            <div className="rounded-lg bg-[#071122] border border-white/10 p-1 shrink-0">
                              <IndexItemIcon kind={item.kind} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="text-sm font-bold text-white truncate">
                                  {item.name}
                                </span>
                                <span
                                  className={`font-num text-[11px] font-extrabold px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0 ${badgeClass}`}
                                >
                                  {item.badge}
                                </span>
                              </div>
                              <div className="text-[11px] font-semibold text-slate-300 mb-1">
                                {item.unlock}
                              </div>
                              <p className="text-xs text-slate-300/90 leading-relaxed">
                                {item.benefit}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </section>

                {/* Vegetables Section */}
                <section>
                  <h3 className="text-xs sm:text-sm font-bold text-rose-300 mb-2.5">
                    {t.indexVeggiesHeading}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {t.indexItems
                      .filter((item) => item.category === 'veggie')
                      .map((item) => (
                        <div
                          key={item.kind}
                          className="rounded-xl border border-rose-400/25 bg-slate-900/75 p-3 flex items-start gap-3"
                        >
                          <div className="rounded-lg bg-[#071122] border border-white/10 p-1 shrink-0">
                            <IndexItemIcon kind={item.kind} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-sm font-bold text-white truncate">
                                {item.name}
                              </span>
                              <span className="font-num text-[11px] font-extrabold px-2 py-0.5 rounded-md border border-rose-400/40 bg-rose-500/20 text-rose-200 whitespace-nowrap shrink-0">
                                {item.badge}
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-400 mb-1">
                              {item.unlock}
                            </div>
                            <p className="text-xs text-slate-300/90 leading-relaxed">
                              {item.benefit}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
