import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MusicToggleButton, useGameMusic } from './gameMusic';

export const BRICK_BREAKER_TOTAL_LEVELS = 15;

const STORAGE_KEY = 'point_catcher_brick_breaker_v1';

export interface BrickBreakerStats {
  bestScore: number;
  clearedStages: number[];
}

export function readBrickBreakerStats(): BrickBreakerStats {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { bestScore: 0, clearedStages: [] };
    const parsed = JSON.parse(raw) as Partial<BrickBreakerStats>;
    const bestScore =
      typeof parsed.bestScore === 'number' && Number.isFinite(parsed.bestScore)
        ? Math.max(0, Math.floor(parsed.bestScore))
        : 0;
    const clearedStages = Array.isArray(parsed.clearedStages)
      ? Array.from(
          new Set(
            parsed.clearedStages.filter(
              (n): n is number =>
                typeof n === 'number' &&
                Number.isInteger(n) &&
                n >= 1 &&
                n <= BRICK_BREAKER_TOTAL_LEVELS
            )
          )
        ).sort((a, b) => a - b)
      : [];
    return { bestScore, clearedStages };
  } catch {
    return { bestScore: 0, clearedStages: [] };
  }
}

function saveBrickBreakerStats(stats: BrickBreakerStats): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage errors
  }
}

type BrickKind = 'normal' | 'steel' | 'titanium' | 'bomb' | 'prism';
type PowerUpKind = 'multiball' | 'wide' | 'fire' | 'heart';
type PlayPhase = 'READY' | 'PLAYING' | 'PAUSED' | 'STAGE_CLEAR' | 'GAME_OVER' | 'ALL_CLEAR';

interface StageBlueprint {
  stage: number;
  nameAr: string;
  nameEn: string;
  ballSpeed: number;
  rows: string[];
}

// 9 columns per row:
// . = empty | 1..6 = 1-HP neon bricks | S = 2-HP steel | T = 3-HP titanium | B = 3x3 bomb | P = guaranteed power-up prism
const STAGES: StageBlueprint[] = [
  {
    stage: 1,
    nameAr: 'الجدار الكلاسيكي',
    nameEn: 'Classic Wall',
    ballSpeed: 335,
    rows: [
      '1111P1111',
      '222222222',
      '333B3B333',
      '444444444',
      '555555555',
    ],
  },
  {
    stage: 2,
    nameAr: 'الماسة المضيئة',
    nameEn: 'Neon Diamond',
    ballSpeed: 345,
    rows: [
      '....6....',
      '...5P5...',
      '..44B44..',
      '.333S333.',
      '..22B22..',
      '...1P1...',
      '....1....',
    ],
  },
  {
    stage: 3,
    nameAr: 'البرجان التوأم',
    nameEn: 'Twin Towers',
    ballSpeed: 355,
    rows: [
      'SSS...SSS',
      '1P1...1P1',
      '2B2.6.2B2',
      '333.5.333',
      '444.4.444',
      '5S5...5S5',
    ],
  },
  {
    stage: 4,
    nameAr: 'قوس الألوان',
    nameEn: 'Rainbow Arch',
    ballSpeed: 362,
    rows: [
      '..11P11..',
      '.222B222.',
      '33S...S33',
      '44..6..44',
      '55.5P5.55',
      '6S..B..S6',
    ],
  },
  {
    stage: 5,
    nameAr: 'مصفوفة القنابل',
    nameEn: 'Bomb Matrix',
    ballSpeed: 370,
    rows: [
      'S1B1P1B1S',
      '222222222',
      '3B3S3S3B3',
      '4444B4444',
      '5P55555P5',
      'S66B6B66S',
    ],
  },
  {
    stage: 6,
    nameAr: 'قلعة القلب',
    nameEn: 'Heart Fortress',
    ballSpeed: 376,
    rows: [
      '.55...55.',
      '55P5.5P55',
      '555B5B555',
      '5S55555S5',
      '.555T555.',
      '..55B55..',
      '...555...',
      '....5....',
    ],
  },
  {
    stage: 7,
    nameAr: 'رقعة الفولاذ',
    nameEn: 'Steel Checkerboard',
    ballSpeed: 382,
    rows: [
      'S1S1P1S1S',
      '2S2S2S2S2',
      'S3B3S3B3S',
      '4S4S4S4S4',
      'S5S5P5S5S',
      '6S6B6B6S6',
    ],
  },
  {
    stage: 8,
    nameAr: 'السهمان المزدوجان',
    nameEn: 'Twin Arrows',
    ballSpeed: 390,
    rows: [
      '..1...1..',
      '.121.121.',
      '12P2B2P21',
      '.S3S.S3S.',
      '..4...4..',
      '.55B5B55.',
      '6666T6666',
    ],
  },
  {
    stage: 9,
    nameAr: 'انفجار النجوم',
    nameEn: 'Star Burst',
    ballSpeed: 396,
    rows: [
      '1...T...1',
      '.2.3P3.2.',
      '..45B54..',
      'S6B6T6B6S',
      '..45B54..',
      '.2.3P3.2.',
      '1...S...1',
    ],
  },
  {
    stage: 10,
    nameAr: 'بوابات المتاهة',
    nameEn: 'Labyrinth Gates',
    ballSpeed: 404,
    rows: [
      'T111P111T',
      'S.......S',
      'S.33B33.S',
      'S.4P.P4.S',
      'S.55B55.S',
      'S.......S',
      'SS22B22SS',
    ],
  },
  {
    stage: 11,
    nameAr: 'هرم المنشور',
    nameEn: 'Prism Pyramid',
    ballSpeed: 410,
    rows: [
      '....T....',
      '...6P6...',
      '..55B55..',
      '.4S444S4.',
      '333B3B333',
      '2P22T22P2',
      'S111B111S',
    ],
  },
  {
    stage: 12,
    nameAr: 'المفاعل النووي',
    nameEn: 'Core Reactor',
    ballSpeed: 418,
    rows: [
      '22S1P1S22',
      '2..3B3..2',
      'S.4TTT4.S',
      'P.B5T5B.P',
      'S.4TTT4.S',
      '2..3B3..2',
      '22S111S22',
    ],
  },
  {
    stage: 13,
    nameAr: 'حصن التاج',
    nameEn: 'Crown Citadel',
    ballSpeed: 425,
    rows: [
      'T...T...T',
      '44.4P4.44',
      '4B44B44B4',
      'S5555555S',
      '6P6S6S6P6',
      'S11B1B11S',
      'TT22222TT',
    ],
  },
  {
    stage: 14,
    nameAr: 'عاصفة النيازك',
    nameEn: 'Meteor Shower',
    ballSpeed: 432,
    rows: [
      '5B.3T.1B5',
      'S5.P3.S15',
      '.4B.2T.B4',
      '6S4.P2.4S',
      'T.3B.1B.T',
      'P6S3.6S1P',
      '222B2B222',
    ],
  },
  {
    stage: 15,
    nameAr: 'القلعة الملكية',
    nameEn: 'Royal Boss Wall',
    ballSpeed: 440,
    rows: [
      'T6T5P5T6T',
      '6B6S4S6B6',
      'S33BTB33S',
      '2P2TTT2P2',
      'S11B5B11S',
      '44S2P2S44',
      'TSS1B1SST',
    ],
  },
];

const NEON_PALETTE: Record<
  string,
  { fill: string; hi: string; low: string; glow: string }
> = {
  '1': { fill: '#06b6d4', hi: '#a5f3fc', low: '#0e7490', glow: 'rgba(6, 182, 212, 0.5)' },
  '2': { fill: '#38bdf8', hi: '#e0f2fe', low: '#0369a1', glow: 'rgba(56, 189, 248, 0.5)' },
  '3': { fill: '#10b981', hi: '#a7f3d0', low: '#047857', glow: 'rgba(16, 185, 129, 0.5)' },
  '4': { fill: '#f59e0b', hi: '#fef08a', low: '#b45309', glow: 'rgba(245, 158, 11, 0.5)' },
  '5': { fill: '#f43f5e', hi: '#fecdd3', low: '#be123c', glow: 'rgba(244, 63, 94, 0.5)' },
  '6': { fill: '#a855f7', hi: '#f3e8ff', low: '#6b21a8', glow: 'rgba(168, 85, 247, 0.5)' },
};

const WORLD_W = 480;
const WORLD_H = 620;
const GRID_COLS = 9;
const BRICK_GAP = 5;
const GRID_PAD_X = 16;
const GRID_TOP_Y = 54;
const BRICK_H = 24;
const BRICK_W = (WORLD_W - GRID_PAD_X * 2 - BRICK_GAP * (GRID_COLS - 1)) / GRID_COLS;
const PADDLE_Y = WORLD_H - 46;
const PADDLE_H = 14;
const BASE_PADDLE_W = 92;
const WIDE_PADDLE_W = 136;
const BALL_R = 7.5;
const START_LIVES = 3;
const MAX_LIVES = 3;
const MAX_BALLS = 9;

interface Brick {
  id: number;
  row: number;
  col: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: BrickKind;
  colorKey: string;
  hp: number;
  maxHp: number;
  alive: boolean;
  hitFlash: number;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  stuck: boolean;
  trail: { x: number; y: number }[];
}

interface PowerUp {
  id: number;
  kind: PowerUpKind;
  x: number;
  y: number;
  vy: number;
  w: number;
  h: number;
  pulse: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

interface Shockwave {
  x: number;
  y: number;
  r: number;
  maxR: number;
  color: string;
  life: number;
  maxLife: number;
}

interface FloatingPopup {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

class BrickAudio {
  private ctx: AudioContext | null = null;
  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
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

  public paddle(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.065);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  public brickHit(enabled: boolean, combo: number, armored: boolean): void {
    if (!enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    if (armored) {
      osc.type = 'square';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.06);
      gain.gain.setValueAtTime(0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    } else {
      const pentatonic = [330, 392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5];
      const freq = pentatonic[Math.min(Math.max(0, combo - 1), pentatonic.length - 1)];
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.18, now + 0.07);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public bomb(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(155, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.28);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.31);
  }

  public powerUp(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.045;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    });
  }

  public loseLife(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.25);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  public stageClear(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.065;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.085, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }
}

const COPY = {
  ar: {
    title: 'تكسير النيون',
    backBtn: 'الصالة',
    stageLabel: (n: number) => `المرحلة ${n}/${BRICK_BREAKER_TOTAL_LEVELS}`,
    stagesBtn: 'المراحل',
    scoreLabel: 'النقاط',
    bestLabel: 'الأعلى',
    comboLabel: (n: number) => `كومبو ×${n}`,
    tapToLaunch: 'اضغط أو اضغط مسافة لإطلاق الكرة',
    moveHint: 'حرّك المضرب باللمس أو الماوس أو الأسهم',
    pauseTitle: 'إيقاف مؤقت',
    resumeBtn: 'متابعة',
    restartBtn: 'إعادة المرحلة',
    stageClearTitle: 'تمت المرحلة بنجاح!',
    allClearTitle: 'بطل تكسير النيون!',
    allClearDesc: 'أنهيت جميع المراحل الـ 15 ببراعة عالية!',
    nextStageBtn: 'المرحلة التالية',
    gameOverTitle: 'انتهت القلوب',
    gameOverDesc: 'لا تستسلم! أعد المحاولة وكسّر كل الطوب.',
    retryBtn: 'إعادة المحاولة',
    chooseStageTitle: 'اختر المرحلة',
    closeBtn: 'إغلاق',
    wideTag: 'مضرب عريض',
    fireTag: 'كرة نارية',
    powerMulti: '×3 كرات!',
    powerWide: 'مضرب عريض!',
    powerFire: 'كرة نارية خارقة!',
    powerHeart: '+1 قلب!',
    bombBlast: 'انفجار!',
    clearedWord: 'مكتملة',
    lockedWord: 'مقفلة',
  },
  en: {
    title: 'Neon Brick Breaker',
    backBtn: 'Hub',
    stageLabel: (n: number) => `Stage ${n}/${BRICK_BREAKER_TOTAL_LEVELS}`,
    stagesBtn: 'Stages',
    scoreLabel: 'Score',
    bestLabel: 'Best',
    comboLabel: (n: number) => `Combo ×${n}`,
    tapToLaunch: 'Tap or press Space to launch ball',
    moveHint: 'Drag, move mouse, or use Arrow keys',
    pauseTitle: 'Paused',
    resumeBtn: 'Resume',
    restartBtn: 'Restart Stage',
    stageClearTitle: 'Stage Cleared!',
    allClearTitle: 'Neon Champion!',
    allClearDesc: 'You conquered all 15 brick-breaker stages!',
    nextStageBtn: 'Next Stage',
    gameOverTitle: 'Out of Hearts',
    gameOverDesc: 'Shake it off and shatter every last brick.',
    retryBtn: 'Try Again',
    chooseStageTitle: 'Select Stage',
    closeBtn: 'Close',
    wideTag: 'Wide Paddle',
    fireTag: 'Fireball',
    powerMulti: '×3 Multi-Ball!',
    powerWide: 'Wide Paddle!',
    powerFire: 'Piercing Fireball!',
    powerHeart: '+1 Heart!',
    bombBlast: 'BOOM!',
    clearedWord: 'Cleared',
    lockedWord: 'Locked',
  },
} as const;

function buildBricksForStage(stageNum: number): Brick[] {
  const bp = STAGES[Math.max(0, Math.min(STAGES.length - 1, stageNum - 1))];
  const bricks: Brick[] = [];
  let nextId = 1;

  bp.rows.forEach((rowStr, rIdx) => {
    for (let cIdx = 0; cIdx < GRID_COLS; cIdx++) {
      const ch = rowStr[cIdx] ?? '.';
      if (ch === '.' || ch === ' ') continue;

      let kind: BrickKind = 'normal';
      let hp = 1;
      let colorKey = '1';

      if (ch === 'S') {
        kind = 'steel';
        hp = 2;
      } else if (ch === 'T') {
        kind = 'titanium';
        hp = 3;
      } else if (ch === 'B') {
        kind = 'bomb';
        hp = 1;
      } else if (ch === 'P') {
        kind = 'prism';
        hp = 1;
      } else if (NEON_PALETTE[ch]) {
        kind = 'normal';
        hp = 1;
        colorKey = ch;
      } else {
        continue;
      }

      bricks.push({
        id: nextId++,
        row: rIdx,
        col: cIdx,
        x: GRID_PAD_X + cIdx * (BRICK_W + BRICK_GAP),
        y: GRID_TOP_Y + rIdx * (BRICK_H + BRICK_GAP),
        w: BRICK_W,
        h: BRICK_H,
        kind,
        colorKey,
        hp,
        maxHp: hp,
        alive: true,
        hitFlash: 0,
      });
    }
  });

  return bricks;
}

export function BrickBreakerPreviewArt() {
  return (
    <svg
      viewBox="0 0 260 130"
      className="w-full h-full block"
      fill="none"
      aria-hidden="true"
    >
      <rect width="260" height="130" fill="#060e1f" />
      <radialGradient id="bbGlow" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#060e1f" stopOpacity="0" />
      </radialGradient>
      <rect width="260" height="130" fill="url(#bbGlow)" />

      {/* Top rows of neon bricks */}
      {[
        { x: 18, y: 14, c: '#f43f5e' },
        { x: 56, y: 14, c: '#f59e0b' },
        { x: 94, y: 14, c: '#e879f9' },
        { x: 132, y: 14, c: '#f59e0b' },
        { x: 170, y: 14, c: '#f43f5e' },
        { x: 208, y: 14, c: '#06b6d4' },
        { x: 18, y: 32, c: '#06b6d4' },
        { x: 56, y: 32, c: '#10b981' },
        { x: 94, y: 32, c: '#ef4444' }, // bomb
        { x: 132, y: 32, c: '#38bdf8' },
        { x: 170, y: 32, c: '#10b981' },
        { x: 208, y: 32, c: '#a855f7' },
        { x: 56, y: 50, c: '#94a3b8' }, // steel
        { x: 132, y: 50, c: '#38bdf8' },
        { x: 170, y: 50, c: '#94a3b8' },
      ].map((b, i) => (
        <g key={i}>
          <rect
            x={b.x}
            y={b.y}
            width="33"
            height="13"
            rx="3"
            fill={b.c}
            stroke="#ffffff"
            strokeOpacity="0.35"
            strokeWidth="0.9"
          />
          <rect
            x={b.x + 2}
            y={b.y + 1.5}
            width="29"
            height="3"
            rx="1.5"
            fill="#ffffff"
            fillOpacity="0.35"
          />
        </g>
      ))}

      {/* Shockwave burst around shattered brick */}
      <circle
        cx="110"
        cy="56"
        r="16"
        stroke="#fb923c"
        strokeWidth="1.6"
        strokeOpacity="0.6"
        strokeDasharray="3 3"
      />

      {/* Glowing comet trail & ball */}
      <path
        d="M 134 104 Q 152 82 114 60"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.45"
        strokeDasharray="4 4"
      />
      <circle cx="114" cy="60" r="9" fill="#38bdf8" fillOpacity="0.3" />
      <circle cx="114" cy="60" r="5" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />

      {/* Second multi-ball */}
      <circle cx="182" cy="76" r="8" fill="#fb923c" fillOpacity="0.32" />
      <circle cx="182" cy="76" r="4.5" fill="#fef08a" stroke="#f97316" strokeWidth="1.5" />

      {/* Falling power-up capsule */}
      <rect
        x="62"
        y="76"
        width="26"
        height="11"
        rx="5.5"
        fill="#0891b2"
        stroke="#a5f3fc"
        strokeWidth="1.1"
      />
      <text
        x="75"
        y="84.3"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="7.5"
        fontWeight="800"
      >
        ×3
      </text>

      {/* Neon paddle */}
      <rect
        x="96"
        y="108"
        width="74"
        height="10"
        rx="5"
        fill="#0ea5e9"
        stroke="#bae6fd"
        strokeWidth="1.4"
      />
      <rect x="108" y="110.5" width="50" height="3" rx="1.5" fill="#e0f2fe" fillOpacity="0.7" />
    </svg>
  );
}

interface BrickBreakerGameProps {
  lang: 'ar' | 'en';
  sfxEnabled: boolean;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  onExitToHub: () => void;
}

export const BrickBreakerGame: React.FC<BrickBreakerGameProps> = ({
  lang,
  sfxEnabled,
  musicEnabled,
  onToggleMusic,
  onExitToHub,
}) => {
  const t = COPY[lang];
  useGameMusic('brick-breaker', musicEnabled);

  const [stats, setStats] = useState<BrickBreakerStats>(() => readBrickBreakerStats());
  const initialStage = Math.min(
    BRICK_BREAKER_TOTAL_LEVELS,
    stats.clearedStages.length > 0
      ? Math.max(...stats.clearedStages) + 1
      : 1
  );

  const [stageNum, setStageNum] = useState<number>(initialStage);
  const [phase, setPhase] = useState<PlayPhase>('READY');
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(START_LIVES);
  const [combo, setCombo] = useState<number>(0);
  const [wideRemaining, setWideRemaining] = useState<number>(0);
  const [fireRemaining, setFireRemaining] = useState<number>(0);
  const [showStages, setShowStages] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<BrickAudio>(new BrickAudio());
  const sfxRef = useRef(sfxEnabled);
  const langRef = useRef(lang);
  const statsRef = useRef(stats);
  const phaseRef = useRef<PlayPhase>(phase);
  const stageNumRef = useRef<number>(stageNum);
  const scoreRef = useRef<number>(score);
  const livesRef = useRef<number>(lives);

  useEffect(() => {
    sfxRef.current = sfxEnabled;
  }, [sfxEnabled]);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    stageNumRef.current = stageNum;
  }, [stageNum]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  const simRef = useRef({
    paddleX: WORLD_W / 2,
    paddleW: BASE_PADDLE_W,
    paddleBounce: 0,
    bricks: buildBricksForStage(initialStage),
    balls: [] as Ball[],
    powerUps: [] as PowerUp[],
    particles: [] as Particle[],
    shockwaves: [] as Shockwave[],
    popups: [] as FloatingPopup[],
    nextId: 1,
    combo: 0,
    wideTimer: 0,
    fireTimer: 0,
    shakeTime: 0,
    shakeIntensity: 0,
    time: 0,
    keys: { left: false, right: false },
  });

  const spawnDockedBall = useCallback(() => {
    const sim = simRef.current;
    sim.balls = [
      {
        id: sim.nextId++,
        x: sim.paddleX,
        y: PADDLE_Y - PADDLE_H / 2 - BALL_R - 1,
        vx: 0,
        vy: 0,
        stuck: true,
        trail: [],
      },
    ];
  }, []);

  const loadStage = useCallback(
    (targetStage: number, resetScore: boolean) => {
      const clamped = Math.max(1, Math.min(BRICK_BREAKER_TOTAL_LEVELS, targetStage));
      const sim = simRef.current;
      sim.paddleX = WORLD_W / 2;
      sim.paddleW = BASE_PADDLE_W;
      sim.paddleBounce = 0;
      sim.bricks = buildBricksForStage(clamped);
      sim.powerUps = [];
      sim.particles = [];
      sim.shockwaves = [];
      sim.popups = [];
      sim.combo = 0;
      sim.wideTimer = 0;
      sim.fireTimer = 0;
      sim.shakeTime = 0;

      stageNumRef.current = clamped;
      setStageNum(clamped);
      setCombo(0);
      setWideRemaining(0);
      setFireRemaining(0);

      if (resetScore) {
        scoreRef.current = 0;
        setScore(0);
        livesRef.current = START_LIVES;
        setLives(START_LIVES);
      } else if (livesRef.current < START_LIVES) {
        livesRef.current = START_LIVES;
        setLives(START_LIVES);
      }

      spawnDockedBall();
      phaseRef.current = 'READY';
      setPhase('READY');
      setShowStages(false);
    },
    [spawnDockedBall]
  );

  // Initialize docked ball on mount
  useEffect(() => {
    spawnDockedBall();
  }, [spawnDockedBall]);

  const launchBalls = useCallback(() => {
    const sim = simRef.current;
    if (phaseRef.current !== 'READY' && phaseRef.current !== 'PLAYING') return;
    const bp = STAGES[Math.max(0, Math.min(STAGES.length - 1, stageNumRef.current - 1))];
    let launched = false;
    for (const ball of sim.balls) {
      if (ball.stuck) {
        const angle = (Math.random() * 0.44 - 0.22); // slight crisp launch angle
        ball.vx = Math.sin(angle) * bp.ballSpeed;
        ball.vy = -Math.cos(angle) * bp.ballSpeed;
        ball.stuck = false;
        launched = true;
      }
    }
    if (launched) {
      audioRef.current.paddle(sfxRef.current);
      phaseRef.current = 'PLAYING';
      setPhase('PLAYING');
    }
  }, []);

  // Keyboard bindings
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showStages) {
          setShowStages(false);
        } else {
          onExitToHub();
        }
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        simRef.current.keys.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        simRef.current.keys.right = true;
      }
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') {
        if (phaseRef.current === 'READY') {
          e.preventDefault();
          launchBalls();
        }
      }
      if (e.key === 'p' || e.key === 'P') {
        if (phaseRef.current === 'PLAYING') {
          phaseRef.current = 'PAUSED';
          setPhase('PAUSED');
        } else if (phaseRef.current === 'PAUSED') {
          phaseRef.current = 'PLAYING';
          setPhase('PLAYING');
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        simRef.current.keys.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        simRef.current.keys.right = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [launchBalls, onExitToHub, showStages]);

  // Main 60fps simulation & render loop
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();

    const addScore = (pts: number) => {
      const next = scoreRef.current + pts;
      scoreRef.current = next;
      setScore(next);
      if (next > statsRef.current.bestScore) {
        const updated: BrickBreakerStats = {
          ...statsRef.current,
          bestScore: next,
        };
        statsRef.current = updated;
        setStats(updated);
        saveBrickBreakerStats(updated);
      }
    };

    const spawnParticles = (x: number, y: number, color: string, count: number, speedMul = 1) => {
      const sim = simRef.current;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = (65 + Math.random() * 190) * speedMul;
        const maxLife = 0.28 + Math.random() * 0.34;
        sim.particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: 2.2 + Math.random() * 3.4,
          color,
          life: maxLife,
          maxLife,
        });
      }
    };

    const maybeDropPowerUp = (brick: Brick) => {
      const sim = simRef.current;
      const chance = brick.kind === 'prism' ? 1.0 : brick.kind === 'titanium' ? 0.38 : 0.16;
      if (Math.random() > chance) return;

      const roll = Math.random();
      let kind: PowerUpKind;
      if (roll < 0.34) {
        kind = 'multiball';
      } else if (roll < 0.64) {
        kind = 'wide';
      } else if (roll < 0.88) {
        kind = 'fire';
      } else {
        kind = livesRef.current < MAX_LIVES ? 'heart' : 'multiball';
      }

      sim.powerUps.push({
        id: sim.nextId++,
        kind,
        x: brick.x + brick.w / 2,
        y: brick.y + brick.h / 2,
        vy: 145,
        w: 44,
        h: 18,
        pulse: Math.random() * Math.PI * 2,
      });
    };

    const getBrickColor = (brick: Brick): string => {
      if (brick.kind === 'steel') return '#94a3b8';
      if (brick.kind === 'titanium') return '#eab308';
      if (brick.kind === 'bomb') return '#f97316';
      if (brick.kind === 'prism') return '#e879f9';
      return NEON_PALETTE[brick.colorKey]?.fill ?? '#38bdf8';
    };

    const damageBrick = (brick: Brick, dmg: number, fromBomb = false) => {
      if (!brick.alive) return;
      const sim = simRef.current;
      brick.hp -= dmg;
      brick.hitFlash = 1;

      const cx = brick.x + brick.w / 2;
      const cy = brick.y + brick.h / 2;
      const col = getBrickColor(brick);

      if (brick.hp > 0) {
        audioRef.current.brickHit(sfxRef.current, sim.combo, true);
        spawnParticles(cx, cy, '#e2e8f0', 6, 0.75);
        return;
      }

      // Brick destroyed!
      brick.alive = false;
      sim.combo += 1;
      setCombo(sim.combo);

      const basePts =
        brick.kind === 'titanium'
          ? 35
          : brick.kind === 'steel'
          ? 20
          : brick.kind === 'prism'
          ? 25
          : brick.kind === 'bomb'
          ? 30
          : 10;
      const mult = Math.min(5, 1 + Math.floor((sim.combo - 1) / 4));
      const pts = basePts * mult;
      addScore(pts);

      spawnParticles(cx, cy, col, brick.kind === 'bomb' ? 22 : 12, brick.kind === 'bomb' ? 1.35 : 1);
      spawnParticles(cx, cy, '#ffffff', 4, 0.65);

      sim.popups.push({
        x: cx,
        y: cy - 4,
        vy: -46,
        text: mult > 1 ? `+${pts} ×${mult}` : `+${pts}`,
        color: mult > 1 ? '#fde047' : '#e0f2fe',
        life: 0.68,
        maxLife: 0.68,
      });

      if (!fromBomb) {
        maybeDropPowerUp(brick);
      }

      if (brick.kind === 'bomb') {
        audioRef.current.bomb(sfxRef.current);
        sim.shakeTime = 0.26;
        sim.shakeIntensity = 7;
        sim.shockwaves.push({
          x: cx,
          y: cy,
          r: 8,
          maxR: BRICK_W * 2.15,
          color: '#fb923c',
          life: 0.34,
          maxLife: 0.34,
        });
        sim.popups.push({
          x: cx,
          y: cy - 18,
          vy: -56,
          text: COPY[langRef.current].bombBlast,
          color: '#fdba74',
          life: 0.85,
          maxLife: 0.85,
        });

        // Blast 3x3 neighbors
        for (const other of sim.bricks) {
          if (
            other.alive &&
            Math.abs(other.row - brick.row) <= 1 &&
            Math.abs(other.col - brick.col) <= 1
          ) {
            damageBrick(other, 3, true);
          }
        }
      } else {
        audioRef.current.brickHit(sfxRef.current, sim.combo, false);
        if (brick.kind === 'titanium' || brick.kind === 'prism') {
          sim.shakeTime = Math.max(sim.shakeTime, 0.1);
          sim.shakeIntensity = Math.max(sim.shakeIntensity, 3);
        }
      }
    };

    const applyPowerUp = (pu: PowerUp) => {
      const sim = simRef.current;
      const copy = COPY[langRef.current];
      audioRef.current.powerUp(sfxRef.current);
      addScore(25);

      if (pu.kind === 'multiball') {
        const bp = STAGES[Math.max(0, Math.min(STAGES.length - 1, stageNumRef.current - 1))];
        const source = sim.balls.find((b) => !b.stuck) ?? sim.balls[0];
        if (source) {
          const baseAng = Math.atan2(source.vy || -bp.ballSpeed, source.vx || 0.2);
          const offsets = [-0.36, 0.36];
          for (const off of offsets) {
            if (sim.balls.length >= MAX_BALLS) break;
            const ang = baseAng + off;
            let vx = Math.cos(ang) * bp.ballSpeed;
            let vy = Math.sin(ang) * bp.ballSpeed;
            if (Math.abs(vy) < bp.ballSpeed * 0.32) {
              vy = -Math.sign(vy || 1) * bp.ballSpeed * 0.45;
              const rem = Math.sqrt(Math.max(100, bp.ballSpeed * bp.ballSpeed - vy * vy));
              vx = Math.sign(vx || 1) * rem;
            }
            sim.balls.push({
              id: sim.nextId++,
              x: source.x,
              y: source.y,
              vx,
              vy,
              stuck: false,
              trail: [],
            });
          }
        }
        sim.popups.push({
          x: pu.x,
          y: PADDLE_Y - 22,
          vy: -52,
          text: copy.powerMulti,
          color: '#67e8f9',
          life: 0.95,
          maxLife: 0.95,
        });
      } else if (pu.kind === 'wide') {
        sim.wideTimer = 12;
        setWideRemaining(12);
        sim.popups.push({
          x: pu.x,
          y: PADDLE_Y - 22,
          vy: -52,
          text: copy.powerWide,
          color: '#6ee7b7',
          life: 0.95,
          maxLife: 0.95,
        });
      } else if (pu.kind === 'fire') {
        sim.fireTimer = 8;
        setFireRemaining(8);
        sim.popups.push({
          x: pu.x,
          y: PADDLE_Y - 22,
          vy: -52,
          text: copy.powerFire,
          color: '#fdba74',
          life: 0.95,
          maxLife: 0.95,
        });
      } else if (pu.kind === 'heart') {
        if (livesRef.current < MAX_LIVES) {
          const nextLives = Math.min(MAX_LIVES, livesRef.current + 1);
          livesRef.current = nextLives;
          setLives(nextLives);
          sim.popups.push({
            x: pu.x,
            y: PADDLE_Y - 22,
            vy: -52,
            text: copy.powerHeart,
            color: '#fda4af',
            life: 0.95,
            maxLife: 0.95,
          });
        } else {
          addScore(50);
          sim.popups.push({
            x: pu.x,
            y: PADDLE_Y - 22,
            vy: -52,
            text: '+50',
            color: '#fde047',
            life: 0.95,
            maxLife: 0.95,
          });
        }
      }
      spawnParticles(pu.x, PADDLE_Y - 6, '#ffffff', 12, 0.9);
    };

    const stepSimulation = (dt: number) => {
      const sim = simRef.current;
      sim.time += dt;

      if (sim.shakeTime > 0) {
        sim.shakeTime = Math.max(0, sim.shakeTime - dt);
      }
      if (sim.paddleBounce > 0) {
        sim.paddleBounce = Math.max(0, sim.paddleBounce - dt * 5);
      }

      // Keyboard paddle movement
      const moveSpeed = 430;
      const moveDir = (sim.keys.right ? 1 : 0) - (sim.keys.left ? 1 : 0);
      if (
        moveDir !== 0 &&
        (phaseRef.current === 'READY' || phaseRef.current === 'PLAYING')
      ) {
        sim.paddleX += moveDir * moveSpeed * dt;
      }

      // Smooth paddle width transition
      const targetW = sim.wideTimer > 0 ? WIDE_PADDLE_W : BASE_PADDLE_W;
      sim.paddleW += (targetW - sim.paddleW) * Math.min(1, dt * 10);
      const halfPad = sim.paddleW / 2;
      sim.paddleX = Math.max(halfPad + 6, Math.min(WORLD_W - halfPad - 6, sim.paddleX));

      // Timers while playing
      if (phaseRef.current === 'PLAYING') {
        if (sim.wideTimer > 0) {
          sim.wideTimer = Math.max(0, sim.wideTimer - dt);
          setWideRemaining(Math.ceil(sim.wideTimer));
        }
        if (sim.fireTimer > 0) {
          sim.fireTimer = Math.max(0, sim.fireTimer - dt);
          setFireRemaining(Math.ceil(sim.fireTimer));
        }
      }

      // Brick flash decay
      for (const br of sim.bricks) {
        if (br.hitFlash > 0) {
          br.hitFlash = Math.max(0, br.hitFlash - dt * 6);
        }
      }

      // Particles & shockwaves & popups always animate smoothly
      for (let i = sim.particles.length - 1; i >= 0; i--) {
        const p = sim.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 260 * dt;
        p.life -= dt;
        if (p.life <= 0) sim.particles.splice(i, 1);
      }
      for (let i = sim.shockwaves.length - 1; i >= 0; i--) {
        const sw = sim.shockwaves[i];
        sw.life -= dt;
        const prog = 1 - Math.max(0, sw.life / sw.maxLife);
        sw.r = 8 + (sw.maxR - 8) * prog;
        if (sw.life <= 0) sim.shockwaves.splice(i, 1);
      }
      for (let i = sim.popups.length - 1; i >= 0; i--) {
        const pop = sim.popups[i];
        pop.y += pop.vy * dt;
        pop.life -= dt;
        if (pop.life <= 0) sim.popups.splice(i, 1);
      }

      // Keep docked ball centered on paddle
      for (const ball of sim.balls) {
        if (ball.stuck) {
          ball.x = sim.paddleX;
          ball.y = PADDLE_Y - PADDLE_H / 2 - BALL_R - 1;
        }
      }

      if (phaseRef.current !== 'PLAYING') return;

      const bp = STAGES[Math.max(0, Math.min(STAGES.length - 1, stageNumRef.current - 1))];
      const isFire = sim.fireTimer > 0;

      // Update falling power-ups
      for (let i = sim.powerUps.length - 1; i >= 0; i--) {
        const pu = sim.powerUps[i];
        pu.y += pu.vy * dt;
        pu.pulse += dt * 6;

        if (
          pu.y + pu.h / 2 >= PADDLE_Y - PADDLE_H / 2 &&
          pu.y - pu.h / 2 <= PADDLE_Y + PADDLE_H / 2 &&
          Math.abs(pu.x - sim.paddleX) <= sim.paddleW / 2 + pu.w / 2
        ) {
          applyPowerUp(pu);
          sim.powerUps.splice(i, 1);
          continue;
        }
        if (pu.y - pu.h > WORLD_H + 10) {
          sim.powerUps.splice(i, 1);
        }
      }

      // Sub-stepped ball movement & collision
      const SUBSTEPS = 3;
      const subDt = dt / SUBSTEPS;

      for (let bi = sim.balls.length - 1; bi >= 0; bi--) {
        const ball = sim.balls[bi];
        if (ball.stuck) continue;

        for (let s = 0; s < SUBSTEPS; s++) {
          ball.x += ball.vx * subDt;
          ball.y += ball.vy * subDt;

          // Wall collisions
          if (ball.x - BALL_R < 6) {
            ball.x = 6 + BALL_R;
            ball.vx = Math.abs(ball.vx);
          } else if (ball.x + BALL_R > WORLD_W - 6) {
            ball.x = WORLD_W - 6 - BALL_R;
            ball.vx = -Math.abs(ball.vx);
          }
          if (ball.y - BALL_R < 6) {
            ball.y = 6 + BALL_R;
            ball.vy = Math.abs(ball.vy);
          }

          // Paddle collision
          const padTop = PADDLE_Y - PADDLE_H / 2;
          const padBot = PADDLE_Y + PADDLE_H / 2;
          if (
            ball.vy > 0 &&
            ball.y + BALL_R >= padTop &&
            ball.y - BALL_R <= padBot &&
            ball.x >= sim.paddleX - halfPad - BALL_R * 0.7 &&
            ball.x <= sim.paddleX + halfPad + BALL_R * 0.7
          ) {
            const rel = Math.max(-1, Math.min(1, (ball.x - sim.paddleX) / halfPad));
            const maxAngle = 1.15; // ~66 deg
            const angle = rel * maxAngle;
            const spd = bp.ballSpeed;
            ball.vx = Math.sin(angle) * spd;
            ball.vy = -Math.cos(angle) * spd;
            ball.y = padTop - BALL_R - 0.5;
            sim.paddleBounce = 1;
            sim.combo = 0;
            setCombo(0);
            audioRef.current.paddle(sfxRef.current);
            spawnParticles(ball.x, padTop, isFire ? '#fb923c' : '#7dd3fc', 6, 0.55);
          }

          // Brick collisions
          for (const br of sim.bricks) {
            if (!br.alive) continue;
            const closestX = Math.max(br.x, Math.min(ball.x, br.x + br.w));
            const closestY = Math.max(br.y, Math.min(ball.y, br.y + br.h));
            const dx = ball.x - closestX;
            const dy = ball.y - closestY;
            if (dx * dx + dy * dy <= BALL_R * BALL_R) {
              if (!isFire) {
                const overlapX = BALL_R - Math.abs(dx);
                const overlapY = BALL_R - Math.abs(dy);
                if (overlapX < overlapY && Math.abs(dx) > 0.01) {
                  ball.vx = dx > 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
                  ball.x += dx > 0 ? overlapX : -overlapX;
                } else {
                  ball.vy = dy > 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
                  ball.y += dy > 0 ? overlapY : -overlapY;
                }
                // Prevent nearly horizontal stuck loops
                const speed = Math.hypot(ball.vx, ball.vy) || bp.ballSpeed;
                const minVy = speed * 0.24;
                if (Math.abs(ball.vy) < minVy) {
                  ball.vy = (ball.vy >= 0 ? 1 : -1) * minVy;
                  ball.vx =
                    (ball.vx >= 0 ? 1 : -1) *
                    Math.sqrt(Math.max(100, speed * speed - ball.vy * ball.vy));
                }
              }

              damageBrick(br, isFire ? 2 : 1, false);
              if (!isFire) break;
            }
          }
        }

        // Record smooth trail
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 9) ball.trail.shift();

        // Fell below paddle
        if (ball.y - BALL_R > WORLD_H + 14) {
          sim.balls.splice(bi, 1);
        }
      }

      // Check stage clear
      const anyAlive = sim.bricks.some((b) => b.alive);
      if (!anyAlive) {
        audioRef.current.stageClear(sfxRef.current);
        const clearedStage = stageNumRef.current;
        const alreadyCleared = statsRef.current.clearedStages.includes(clearedStage);
        const nextCleared = alreadyCleared
          ? statsRef.current.clearedStages
          : [...statsRef.current.clearedStages, clearedStage].sort((a, b) => a - b);
        const bonus = livesRef.current * 50;
        addScore(bonus);
        const updatedStats: BrickBreakerStats = {
          bestScore: Math.max(statsRef.current.bestScore, scoreRef.current),
          clearedStages: nextCleared,
        };
        statsRef.current = updatedStats;
        setStats(updatedStats);
        saveBrickBreakerStats(updatedStats);

        const nextPhase: PlayPhase =
          clearedStage >= BRICK_BREAKER_TOTAL_LEVELS ? 'ALL_CLEAR' : 'STAGE_CLEAR';
        phaseRef.current = nextPhase;
        setPhase(nextPhase);
        return;
      }

      // All balls lost -> lose 1 heart
      if (sim.balls.length === 0) {
        audioRef.current.loseLife(sfxRef.current);
        sim.combo = 0;
        setCombo(0);
        sim.wideTimer = 0;
        sim.fireTimer = 0;
        setWideRemaining(0);
        setFireRemaining(0);
        sim.shakeTime = 0.22;
        sim.shakeIntensity = 6;

        const nextLives = livesRef.current - 1;
        livesRef.current = nextLives;
        setLives(nextLives);

        if (nextLives <= 0) {
          phaseRef.current = 'GAME_OVER';
          setPhase('GAME_OVER');
        } else {
          spawnDockedBall();
          phaseRef.current = 'READY';
          setPhase('READY');
        }
      }
    };

    const drawRoundRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.lineTo(x + w - rr, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
      ctx.lineTo(x + w, y + h - rr);
      ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
      ctx.lineTo(x + rr, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
      ctx.lineTo(x, y + rr);
      ctx.quadraticCurveTo(x, y, x + rr, y);
      ctx.closePath();
    };

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.round(WORLD_W * dpr);
      const targetH = Math.round(WORLD_H * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const sim = simRef.current;
      ctx.save();
      ctx.scale(dpr, dpr);

      // Screen shake offset
      if (sim.shakeTime > 0) {
        const mag = sim.shakeIntensity * (sim.shakeTime / 0.26);
        ctx.translate(
          (Math.random() * 2 - 1) * mag,
          (Math.random() * 2 - 1) * mag
        );
      }

      // Arena backdrop
      const bg = ctx.createLinearGradient(0, 0, 0, WORLD_H);
      bg.addColorStop(0, '#050b18');
      bg.addColorStop(0.55, '#081329');
      bg.addColorStop(1, '#060d1f');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);

      // Subtle architectural grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.045)';
      ctx.lineWidth = 1;
      for (let gx = 40; gx < WORLD_W; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, WORLD_H);
        ctx.stroke();
      }
      for (let gy = 40; gy < WORLD_H; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(WORLD_W, gy);
        ctx.stroke();
      }

      // Crisp luminous arena walls (left, top, right)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(5, WORLD_H);
      ctx.lineTo(5, 5);
      ctx.lineTo(WORLD_W - 5, 5);
      ctx.lineTo(WORLD_W - 5, WORLD_H);
      ctx.stroke();

      // Stage title watermark in top arena margin
      const bp = STAGES[Math.max(0, Math.min(STAGES.length - 1, stageNumRef.current - 1))];
      ctx.font = '700 12px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.72)';
      ctx.fillText(
        `${stageNumRef.current}. ${langRef.current === 'ar' ? bp.nameAr : bp.nameEn}`,
        WORLD_W / 2,
        26
      );

      // Draw bricks
      for (const br of sim.bricks) {
        if (!br.alive) continue;
        ctx.save();

        let fill = '#38bdf8';
        let hi = '#e0f2fe';
        let low = '#0369a1';
        if (br.kind === 'steel') {
          fill = '#64748b';
          hi = '#e2e8f0';
          low = '#334155';
        } else if (br.kind === 'titanium') {
          fill = '#d97706';
          hi = '#fef08a';
          low = '#78350f';
        } else if (br.kind === 'bomb') {
          const pulse = 0.5 + 0.5 * Math.sin(sim.time * 7 + br.id);
          fill = pulse > 0.5 ? '#ef4444' : '#f97316';
          hi = '#fed7aa';
          low = '#991b1b';
        } else if (br.kind === 'prism') {
          fill = '#d946ef';
          hi = '#fdf4ff';
          low = '#701a75';
        } else {
          const pal = NEON_PALETTE[br.colorKey] ?? NEON_PALETTE['1'];
          fill = pal.fill;
          hi = pal.hi;
          low = pal.low;
        }

        const grad = ctx.createLinearGradient(br.x, br.y, br.x, br.y + br.h);
        grad.addColorStop(0, br.hitFlash > 0.1 ? '#ffffff' : fill);
        grad.addColorStop(1, low);

        drawRoundRect(ctx, br.x, br.y, br.w, br.h, 5);
        ctx.fillStyle = grad;
        ctx.fill();

        // Top gloss bevel
        drawRoundRect(ctx, br.x + 2, br.y + 2, br.w - 4, 5.5, 3);
        ctx.fillStyle = hi;
        ctx.globalAlpha = 0.38;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Outer crisp rim
        drawRoundRect(ctx, br.x, br.y, br.w, br.h, 5);
        ctx.strokeStyle = hi;
        ctx.globalAlpha = br.kind === 'prism' || br.kind === 'bomb' ? 0.85 : 0.42;
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Special brick emblems & armor cracks
        const cx = br.x + br.w / 2;
        const cy = br.y + br.h / 2;

        if (br.kind === 'bomb') {
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#991b1b';
          ctx.font = '900 10px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✦', cx, cy + 0.5);
        } else if (br.kind === 'prism') {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(cx, cy - 6);
          ctx.lineTo(cx + 6, cy);
          ctx.lineTo(cx, cy + 6);
          ctx.lineTo(cx - 6, cy);
          ctx.closePath();
          ctx.fill();
        } else if (br.kind === 'steel' || br.kind === 'titanium') {
          // Corner rivets
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.fillRect(br.x + 4, br.y + 4, 2.5, 2.5);
          ctx.fillRect(br.x + br.w - 6.5, br.y + 4, 2.5, 2.5);
          ctx.fillRect(br.x + 4, br.y + br.h - 6.5, 2.5, 2.5);
          ctx.fillRect(br.x + br.w - 6.5, br.y + br.h - 6.5, 2.5, 2.5);

          // Damage cracks when hit
          if (br.hp < br.maxHp) {
            ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(cx - 8, br.y + 2);
            ctx.lineTo(cx - 2, cy);
            ctx.lineTo(cx + 6, cy - 3);
            ctx.lineTo(cx + 10, br.y + br.h - 2);
            ctx.stroke();
            if (br.maxHp === 3 && br.hp === 1) {
              ctx.beginPath();
              ctx.moveTo(cx + 8, br.y + 3);
              ctx.lineTo(cx, cy + 2);
              ctx.lineTo(cx - 9, br.y + br.h - 3);
              ctx.stroke();
            }
          }

          // Remaining HP numeral for clarity (non-hue-only affordance)
          ctx.fillStyle = '#ffffff';
          ctx.font = '800 10px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(br.hp), cx, cy + 0.5);
        }

        ctx.restore();
      }

      // Draw shockwaves
      for (const sw of sim.shockwaves) {
        const alpha = Math.max(0, sw.life / sw.maxLife);
        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = alpha * 0.85;
        ctx.lineWidth = 3.5 * alpha + 1;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw falling power-up capsules
      for (const pu of sim.powerUps) {
        ctx.save();
        const scale = 1 + Math.sin(pu.pulse) * 0.05;
        ctx.translate(pu.x, pu.y);
        ctx.scale(scale, scale);

        const styles: Record<
          PowerUpKind,
          { fill: string; stroke: string; label: string }
        > = {
          multiball: { fill: '#0891b2', stroke: '#a5f3fc', label: '×3' },
          wide: { fill: '#059669', stroke: '#a7f3d0', label: '↔' },
          fire: { fill: '#ea580c', stroke: '#fed7aa', label: '🔥' },
          heart: { fill: '#e11d48', stroke: '#fecdd3', label: '♥' },
        };
        const st = styles[pu.kind];

        drawRoundRect(ctx, -pu.w / 2, -pu.h / 2, pu.w, pu.h, pu.h / 2);
        ctx.fillStyle = st.fill;
        ctx.fill();
        ctx.strokeStyle = st.stroke;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 11px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.label, 0, 0.5);
        ctx.restore();
      }

      // Draw neon paddle
      const halfPad = sim.paddleW / 2;
      const bounceOffset = sim.paddleBounce * 3;
      const isWide = sim.wideTimer > 0;
      const isFire = sim.fireTimer > 0;

      ctx.save();
      const padGlow = ctx.createRadialGradient(
        sim.paddleX,
        PADDLE_Y + bounceOffset,
        6,
        sim.paddleX,
        PADDLE_Y + bounceOffset,
        halfPad * 1.15
      );
      padGlow.addColorStop(
        0,
        isFire
          ? 'rgba(251, 146, 60, 0.32)'
          : isWide
          ? 'rgba(16, 185, 129, 0.3)'
          : 'rgba(56, 189, 248, 0.28)'
      );
      padGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = padGlow;
      ctx.beginPath();
      ctx.ellipse(
        sim.paddleX,
        PADDLE_Y + bounceOffset,
        halfPad * 1.18,
        22,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      const padGrad = ctx.createLinearGradient(
        sim.paddleX - halfPad,
        PADDLE_Y - PADDLE_H / 2,
        sim.paddleX - halfPad,
        PADDLE_Y + PADDLE_H / 2
      );
      if (isFire) {
        padGrad.addColorStop(0, '#fed7aa');
        padGrad.addColorStop(0.45, '#f97316');
        padGrad.addColorStop(1, '#9a3412');
      } else if (isWide) {
        padGrad.addColorStop(0, '#a7f3d0');
        padGrad.addColorStop(0.45, '#10b981');
        padGrad.addColorStop(1, '#065f46');
      } else {
        padGrad.addColorStop(0, '#bae6fd');
        padGrad.addColorStop(0.45, '#0ea5e9');
        padGrad.addColorStop(1, '#0369a1');
      }

      drawRoundRect(
        ctx,
        sim.paddleX - halfPad,
        PADDLE_Y - PADDLE_H / 2 + bounceOffset,
        sim.paddleW,
        PADDLE_H,
        PADDLE_H / 2
      );
      ctx.fillStyle = padGrad;
      ctx.fill();
      ctx.strokeStyle = isFire ? '#ffedd5' : isWide ? '#d1fae5' : '#e0f2fe';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Center core highlight on paddle
      drawRoundRect(
        ctx,
        sim.paddleX - halfPad * 0.48,
        PADDLE_Y - PADDLE_H / 2 + 2.5 + bounceOffset,
        sim.paddleW * 0.48,
        3.5,
        2
      );
      ctx.fillStyle = 'rgba(255,255,255,0.68)';
      ctx.fill();
      ctx.restore();

      // Aim guide arrow while docked in READY state
      if (phaseRef.current === 'READY') {
        const aimY = PADDLE_Y - PADDLE_H / 2 - BALL_R - 12;
        const bob = Math.sin(sim.time * 5) * 4;
        ctx.save();
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.72)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(sim.paddleX, aimY);
        ctx.lineTo(sim.paddleX, aimY - 34 - bob);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath();
        ctx.moveTo(sim.paddleX, aimY - 42 - bob);
        ctx.lineTo(sim.paddleX - 5, aimY - 32 - bob);
        ctx.lineTo(sim.paddleX + 5, aimY - 32 - bob);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Draw balls + trails
      for (const ball of sim.balls) {
        // Comet trail
        for (let i = 0; i < ball.trail.length; i++) {
          const pt = ball.trail[i];
          const ratio = (i + 1) / (ball.trail.length + 1);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, BALL_R * ratio * 0.85, 0, Math.PI * 2);
          ctx.fillStyle = isFire
            ? `rgba(251, 146, 60, ${ratio * 0.48})`
            : `rgba(56, 189, 248, ${ratio * 0.36})`;
          ctx.fill();
        }

        // Glow halo
        const bGlow = ctx.createRadialGradient(
          ball.x,
          ball.y,
          1,
          ball.x,
          ball.y,
          BALL_R * 2.4
        );
        bGlow.addColorStop(
          0,
          isFire ? 'rgba(254, 215, 170, 0.95)' : 'rgba(224, 242, 254, 0.95)'
        );
        bGlow.addColorStop(
          0.45,
          isFire ? 'rgba(249, 115, 22, 0.55)' : 'rgba(56, 189, 248, 0.45)'
        );
        bGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bGlow;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_R * 2.4, 0, Math.PI * 2);
        ctx.fill();

        // Crisp ball core
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
        ctx.fillStyle = isFire ? '#fef08a' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = isFire ? '#ea580c' : '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      // Draw particles
      for (const p of sim.particles) {
        const a = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      // Draw floating popups
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '800 13px "Segoe UI", system-ui, sans-serif';
      for (const pop of sim.popups) {
        const a = Math.max(0, pop.life / pop.maxLife);
        ctx.globalAlpha = a;
        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
        ctx.fillText(pop.text, pop.x + 1, pop.y + 1);
        ctx.fillStyle = pop.color;
        ctx.fillText(pop.text, pop.x, pop.y);
      }
      ctx.globalAlpha = 1;

      // Bottom ready instruction cue (non-blocking, below bricks & above paddle)
      if (phaseRef.current === 'READY') {
        ctx.font = '700 13px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(224, 242, 254, 0.88)';
        ctx.fillText(COPY[langRef.current].tapToLaunch, WORLD_W / 2, WORLD_H - 116);
      }

      ctx.restore();
    };

    const tick = (now: number) => {
      const dt = Math.min(0.032, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      stepSimulation(dt);
      render();
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [spawnDockedBall]);

  const updatePaddleFromClientX = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    const worldX = ((clientX - rect.left) / rect.width) * WORLD_W;
    const halfPad = simRef.current.paddleW / 2;
    simRef.current.paddleX = Math.max(
      halfPad + 6,
      Math.min(WORLD_W - halfPad - 6, worldX)
    );
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    updatePaddleFromClientX(e.clientX);
    if (phaseRef.current === 'READY') {
      launchBalls();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'mouse' || e.buttons > 0) {
      updatePaddleFromClientX(e.clientX);
    }
  };

  const highestUnlockedStage = Math.min(
    BRICK_BREAKER_TOTAL_LEVELS,
    stats.clearedStages.length > 0 ? Math.max(...stats.clearedStages) + 1 : 1
  );

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 bg-[#050b16] text-slate-100 flex flex-col overflow-hidden select-none"
    >
      {/* Tidy Arcade Top HUD */}
      <header className="w-full border-b border-white/10 bg-[#0a1324]/95 shrink-0">
        <div className="mx-auto max-w-[780px] h-14 px-2.5 sm:px-4 flex items-center justify-between gap-2">
          {/* Left: Back to Hub + Stage selector */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onExitToHub}
              className="h-9 px-2.5 sm:px-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 shrink-0 rtl:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>{t.backBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (phaseRef.current === 'PLAYING') {
                  phaseRef.current = 'PAUSED';
                  setPhase('PAUSED');
                }
                setShowStages(true);
              }}
              className="h-9 px-2.5 sm:px-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-400/35 bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 text-xs sm:text-sm font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 font-num"
            >
              <span>{t.stageLabel(stageNum)}</span>
            </button>
          </div>

          {/* Center: Clean unboxed HUD stats */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-num min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-slate-400 hidden sm:inline">{t.scoreLabel}</span>
              <span className="font-bold text-white">{score}</span>
            </div>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-slate-400 hidden sm:inline">{t.bestLabel}</span>
              <span className="font-bold text-amber-300">{stats.bestScore}</span>
            </div>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <div
              className="flex items-center gap-1 font-bold"
              aria-label={
                lang === 'ar'
                  ? `القلوب: ${lives} من ${MAX_LIVES}`
                  : `Hearts: ${lives} of ${MAX_LIVES}`
              }
            >
              <span className="inline-flex items-center gap-0.5" aria-hidden="true">
                {Array.from({ length: MAX_LIVES }).map((_, idx) => {
                  const filled = idx < lives;
                  return (
                    <svg
                      key={idx}
                      viewBox="0 0 24 24"
                      className={`w-4 h-4 transition-transform ${
                        filled
                          ? 'text-rose-500 scale-100 drop-shadow-[0_0_5px_rgba(244,63,94,0.55)]'
                          : 'text-slate-600/80 scale-90'
                      }`}
                      fill={filled ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2.1"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  );
                })}
              </span>
              <span className="text-rose-300 text-xs">{lives}/{MAX_LIVES}</span>
            </div>
          </div>

          {/* Right: Pause, Restart, Music */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (phaseRef.current === 'PLAYING') {
                  phaseRef.current = 'PAUSED';
                  setPhase('PAUSED');
                } else if (phaseRef.current === 'PAUSED') {
                  phaseRef.current = 'PLAYING';
                  setPhase('PLAYING');
                }
              }}
              aria-label={t.pauseTitle}
              title={t.pauseTitle}
              className="h-8 w-8 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg border border-white/12 bg-slate-900/80 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              {phase === 'PAUSED' ? (
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                  <polygon points="7,5 19,12 7,19" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => loadStage(stageNum, false)}
              aria-label={t.restartBtn}
              title={t.restartBtn}
              className="h-8 w-8 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg border border-white/12 bg-slate-900/80 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>

            <MusicToggleButton
              enabled={musicEnabled}
              onToggle={onToggleMusic}
              lang={lang}
            />
          </div>
        </div>
      </header>

      {/* Active Power-Up / Combo Status Strip (non-obtrusive, above playfield) */}
      <div className="h-7 px-3 flex items-center justify-center gap-4 text-xs font-num bg-[#070f20] border-b border-white/5 shrink-0">
        {combo >= 3 ? (
          <span className="font-bold text-amber-300">{t.comboLabel(combo)}</span>
        ) : (
          <span className="text-slate-400">{t.moveHint}</span>
        )}
        {wideRemaining > 0 && (
          <span className="font-bold text-emerald-300">
            ↔ {t.wideTag} · {wideRemaining}s
          </span>
        )}
        {fireRemaining > 0 && (
          <span className="font-bold text-orange-300">
            🔥 {t.fireTag} · {fireRemaining}s
          </span>
        )}
      </div>

      {/* Main Playfield Canvas Container */}
      <main className="flex-1 min-h-0 w-full flex items-center justify-center p-2 sm:p-4 relative">
        <div className="relative h-full max-h-[680px] aspect-[480/620] max-w-full rounded-xl overflow-hidden border border-sky-400/25 shadow-2xl bg-[#050b18]">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            className="w-full h-full block touch-none cursor-pointer"
          />

          {/* Paused Overlay */}
          {phase === 'PAUSED' && !showStages && (
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-5">
              <div className="w-full max-w-[290px] rounded-2xl border border-white/15 bg-[#0c172b] p-5 text-center shadow-2xl">
                <h2 className="text-lg font-bold text-white mb-4">{t.pauseTitle}</h2>
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      phaseRef.current = 'PLAYING';
                      setPhase('PLAYING');
                    }}
                    className="h-11 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-sm cursor-pointer transition-colors"
                  >
                    {t.resumeBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => loadStage(stageNum, false)}
                    className="h-10 rounded-lg border border-white/15 bg-slate-800/80 hover:bg-slate-700 text-slate-100 font-bold text-sm cursor-pointer transition-colors"
                  >
                    {t.restartBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStages(true)}
                    className="h-10 rounded-lg border border-sky-400/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 font-bold text-sm cursor-pointer transition-colors"
                  >
                    {t.stagesBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stage Clear / All Clear Overlay */}
          {(phase === 'STAGE_CLEAR' || phase === 'ALL_CLEAR') && !showStages && (
            <div className="absolute inset-0 bg-slate-950/78 backdrop-blur-xs flex items-center justify-center p-5">
              <div className="w-full max-w-[310px] rounded-2xl border border-emerald-400/35 bg-[#0c192b] p-5 text-center shadow-2xl">
                <div className="text-3xl mb-1" aria-hidden="true">
                  {phase === 'ALL_CLEAR' ? '🏆' : '✨'}
                </div>
                <h2 className="text-lg font-bold text-emerald-300 mb-1">
                  {phase === 'ALL_CLEAR' ? t.allClearTitle : t.stageClearTitle}
                </h2>
                {phase === 'ALL_CLEAR' && (
                  <p className="text-xs text-slate-300 mb-3">{t.allClearDesc}</p>
                )}
                <div className="my-3 py-2.5 px-3 rounded-xl bg-slate-900/75 border border-white/8 flex items-center justify-around font-num text-sm">
                  <div>
                    <div className="text-[11px] text-slate-400">{t.scoreLabel}</div>
                    <div className="font-bold text-white">{score}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">{t.bestLabel}</div>
                    <div className="font-bold text-amber-300">{stats.bestScore}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  {phase === 'STAGE_CLEAR' && stageNum < BRICK_BREAKER_TOTAL_LEVELS && (
                    <button
                      type="button"
                      onClick={() => loadStage(stageNum + 1, false)}
                      className="h-11 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm cursor-pointer transition-colors"
                    >
                      {t.nextStageBtn}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => loadStage(phase === 'ALL_CLEAR' ? 1 : stageNum, phase === 'ALL_CLEAR')}
                    className="h-10 rounded-lg border border-white/15 bg-slate-800/80 hover:bg-slate-700 text-slate-100 font-bold text-sm cursor-pointer transition-colors"
                  >
                    {t.restartBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {phase === 'GAME_OVER' && !showStages && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-5">
              <div className="w-full max-w-[300px] rounded-2xl border border-rose-400/35 bg-[#150d1e] p-5 text-center shadow-2xl">
                <h2 className="text-lg font-bold text-rose-300 mb-1">
                  {t.gameOverTitle}
                </h2>
                <p className="text-xs text-slate-300 mb-3">{t.gameOverDesc}</p>
                <div className="my-3 py-2.5 px-3 rounded-xl bg-slate-950/75 border border-white/8 flex items-center justify-around font-num text-sm">
                  <div>
                    <div className="text-[11px] text-slate-400">{t.scoreLabel}</div>
                    <div className="font-bold text-white">{score}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">{t.bestLabel}</div>
                    <div className="font-bold text-amber-300">{stats.bestScore}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => loadStage(stageNum, true)}
                    className="h-11 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm cursor-pointer transition-colors"
                  >
                    {t.retryBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStages(true)}
                    className="h-10 rounded-lg border border-white/15 bg-slate-800/80 hover:bg-slate-700 text-slate-100 font-bold text-sm cursor-pointer transition-colors"
                  >
                    {t.stagesBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stage Selector Modal */}
          {showStages && (
            <div className="absolute inset-0 bg-slate-950/88 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-[360px] max-h-full rounded-2xl border border-sky-400/30 bg-[#0b1528] p-4 flex flex-col shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-white">
                    {t.chooseStageTitle}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowStages(false)}
                    className="h-8 px-2.5 rounded-lg border border-white/15 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
                  >
                    {t.closeBtn}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 overflow-y-auto pr-0.5">
                  {STAGES.map((st) => {
                    const cleared = stats.clearedStages.includes(st.stage);
                    const unlocked = st.stage <= highestUnlockedStage;
                    const isCurrent = st.stage === stageNum;
                    return (
                      <button
                        key={st.stage}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => loadStage(st.stage, false)}
                        className={`p-2 rounded-xl border text-center transition-colors flex flex-col items-center justify-center min-h-[68px] ${
                          !unlocked
                            ? 'border-white/8 bg-slate-900/50 text-slate-600 cursor-not-allowed'
                            : isCurrent
                            ? 'border-sky-400 bg-sky-500/20 text-white cursor-pointer'
                            : cleared
                            ? 'border-emerald-400/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 cursor-pointer'
                            : 'border-white/15 bg-slate-900/90 hover:bg-slate-800 text-slate-100 cursor-pointer'
                        }`}
                      >
                        <span className="font-num text-sm font-extrabold">
                          {unlocked ? st.stage : '🔒'}
                        </span>
                        <span className="text-[10px] leading-tight mt-0.5 line-clamp-1 opacity-85">
                          {lang === 'ar' ? st.nameAr : st.nameEn}
                        </span>
                        <span className="text-[9px] mt-0.5 opacity-65">
                          {cleared ? t.clearedWord : !unlocked ? t.lockedWord : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
