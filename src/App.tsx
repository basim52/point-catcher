/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

type Lang = 'ar' | 'en';
type GameStatus =
  | 'START'
  | 'PLAYING'
  | 'PAUSED'
  | 'STAGE_CLEAR'
  | 'GAME_OVER'
  | 'VICTORY';
type ItemKind = 'pink_circle' | 'blue_triangle' | 'hazard_spike' | 'hazard_square';

interface StageConfig {
  stage: number;
  startScore: number;
  targetScore: number;
  pointsNeeded: number;
  baseSpeed: number;
  spawnInterval: number;
  hazardChance: number;
  squareHazardRatio: number;
  lateralDrift: number;
}

interface FallingItem {
  id: number;
  kind: ItemKind;
  x: number;
  y: number;
  radius: number;
  speed: number;
  vx: number;
  rotation: number;
  rotSpeed: number;
  pulsePhase: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface AmbientStar {
  x: number;
  y: number;
  r: number;
  speed: number;
  alpha: number;
}

const MAX_LIVES = 3;
const TOTAL_STAGES = 25;
const PINK_CIRCLE_POINTS = 3;
const BLUE_TRIANGLE_POINTS = 4;
const BEST_SCORE_STORAGE_KEY = 'point_catcher_best_score_v1';
const COINS_STORAGE_KEY = 'point_catcher_coins_v1';
const COMPLETED_STAGES_STORAGE_KEY = 'point_catcher_completed_stages_v1';
const SFX_STORAGE_KEY = 'point_catcher_sfx_v1';
const MUSIC_STORAGE_KEY = 'point_catcher_music_v1';
const LANG_STORAGE_KEY = 'point_catcher_lang_v1';

function getStageClearCoins(remainingLives: number): number {
  if (remainingLives >= 3) return 4;
  if (remainingLives === 2) return 2;
  return 1;
}

// Build 25 stages (5% easier overall), with NO -2 red square hazards in Stages 1–5:
// Stages 1–5 only spawn -1 spiky hazards; -2 red squares start from Stage 6.
const STAGES: StageConfig[] = (() => {
  const list: StageConfig[] = [];
  let cumulative = 0;
  for (let s = 1; s <= TOTAL_STAGES; s++) {
    const t = (s - 1) / (TOTAL_STAGES - 1);
    const pointsNeeded = Math.round((45 + s * 15) * 0.95);
    const startScore = cumulative;
    cumulative += pointsNeeded;
    const rawSquareRatio =
      s <= 5 ? 0 : 0.3 + ((s - 6) / (TOTAL_STAGES - 6)) * 0.34;
    list.push({
      stage: s,
      startScore,
      targetScore: cumulative,
      pointsNeeded,
      baseSpeed: (225 + t * 335) * 0.95,
      spawnInterval: Math.max(0.19, (0.68 - t * 0.49) * 1.05),
      hazardChance: (0.34 + t * 0.26) * 0.95,
      squareHazardRatio: rawSquareRatio * 0.95,
      lateralDrift: (28 + t * 105) * 0.95,
    });
  }
  return list;
})();

function isStageUnlocked(stage: number, completed: number[]): boolean {
  if (stage <= 1) return true;
  return completed.includes(stage - 1) || completed.includes(stage);
}



const COPY = {
  ar: {
    title: 'صياد النقاط',
    rule: 'اجتز 25 مرحلة بالتقاط الدوائر الوردية (+3) والمثلثات الزرقاء (+4) وتجنب العوائق الحمراء.',
    startBtn: 'ابدأ اللعب',
    playAgainBtn: 'العب مرة أخرى',
    resumeBtn: 'استئناف اللعب',
    restartBtn: 'إعادة البدء',
    score: 'النقاط',
    best: 'الأفضل',
    bestFull: 'أفضل نتيجة',
    lives: 'الأرواح',
    stage: 'المرحلة',
    stageReached: 'المرحلة التي وصلت إليها',
    gameOver: 'انتهت اللعبة',
    victoryTitle: 'مبروك! أنهيت جميع المراحل',
    victorySubtitle: 'أكملت المراحل الـ 25 بنجاح!',
    finalScore: 'النتيجة النهائية',
    newBest: 'رقم قياسي جديد!',
    paused: 'إيقاف مؤقت',
    pinkLegend: 'دائرة وردية (+3)',
    blueLegend: 'مثلث أزرق (+4)',
    spikeLegend: 'عائق أحمر (-1 روح)',
    squareLegend: 'مربع أحمر (-2 روح)',
    controlsHint: 'الأسهم أو A / D أو السحب للتحريك',
    moveLeft: 'تحريك لليسار',
    moveRight: 'تحريك لليمين',
    mute: 'كتم الصوت',
    unmute: 'تفعيل الصوت',
    pause: 'إيقاف مؤقت',
    resume: 'استئناف',
    langToggle: 'EN',
    langToggleAria: 'Switch to English',
    stageBanner: (n: number) => `المرحلة ${n}`,
    stageGoalLabel: (n: number) => `الهدف: ${n} نقطة`,
    stageCompleteTitle: (n: number) => `أكملت المرحلة ${n}!`,
    nextStageBtn: (n: number) => `الانتقال إلى المرحلة ${n}`,
    nextGoalText: (pts: number) => `هدف المرحلة التالية: ${pts} نقطة`,
    stagesBtn: 'المراحل',
    stagesModalTitle: 'المراحل',
    stagesModalHint: 'فُز بكل مرحلة لفتح التالية — المكافأة: 1 قلب = 1، 2 قلب = 2، 3 قلوب = 4 فلوس.',
    lockedStageAria: (n: number) => `المرحلة ${n} مقفلة`,
    settingsBtn: 'الإعدادات',
    settingsTitle: 'الإعدادات',
    musicLabel: 'الموسيقى الحماسية',
    musicDesc: 'موسيقى إلكترونية سريعة أثناء اللعب',
    sfxLabel: 'المؤثرات الصوتية',
    sfxDesc: 'أصوات التقاط النقاط والعوائق والمراحل',
    languageLabel: 'اللغة',
    onLabel: 'تشغيل',
    offLabel: 'إيقاف',
    coins: 'الفلوس',
    coinsEarned: (earned: number, remainingLives: number) =>
      `+${earned} فلوس مكافأة إنهاء المرحلة (${remainingLives} ${
        remainingLives === 1 ? 'قلب' : remainingLives === 2 ? 'قلبان' : 'قلوب'
      })!`,
    ptsShort: 'نقطة',
    close: 'إغلاق',
  },
  en: {
    title: 'Point Catcher',
    rule: 'Clear 25 stages by catching pink circles (+3) and blue triangles (+4) while dodging red hazards.',
    startBtn: 'Start Game',
    playAgainBtn: 'Play Again',
    resumeBtn: 'Resume',
    restartBtn: 'Restart',
    score: 'Score',
    best: 'Best',
    bestFull: 'Best Score',
    lives: 'Lives',
    stage: 'Stage',
    stageReached: 'Stage Reached',
    gameOver: 'Game Over',
    victoryTitle: 'Victory! All 25 Stages Cleared',
    victorySubtitle: 'You mastered every stage!',
    finalScore: 'Final Score',
    newBest: 'New Best Score!',
    paused: 'Paused',
    pinkLegend: 'Pink Circle (+3)',
    blueLegend: 'Blue Triangle (+4)',
    spikeLegend: 'Red Spike (-1 Life)',
    squareLegend: 'Red Square (-2 Lives)',
    controlsHint: 'Arrow keys, A / D, or drag to move',
    moveLeft: 'Move Left',
    moveRight: 'Move Right',
    mute: 'Mute Sound',
    unmute: 'Unmute Sound',
    pause: 'Pause Game',
    resume: 'Resume Game',
    langToggle: 'عربي',
    langToggleAria: 'التبديل إلى العربية',
    stageBanner: (n: number) => `Stage ${n}`,
    stageGoalLabel: (n: number) => `Goal: ${n} pts`,
    stageCompleteTitle: (n: number) => `Stage ${n} Complete!`,
    nextStageBtn: (n: number) => `Continue to Stage ${n}`,
    nextGoalText: (pts: number) => `Next Stage Goal: ${pts} pts`,
    stagesBtn: 'Stages',
    stagesModalTitle: 'Stages',
    stagesModalHint: 'Clear each stage to unlock the next — Reward: 1♥ = 1, 2♥ = 2, 3♥ = 4 coins.',
    lockedStageAria: (n: number) => `Stage ${n} locked`,
    settingsBtn: 'Settings',
    settingsTitle: 'Settings',
    musicLabel: 'Energetic Music',
    musicDesc: 'Upbeat arcade synth soundtrack while playing',
    sfxLabel: 'Sound Effects',
    sfxDesc: 'Point catches, hazard hits, and stage chimes',
    languageLabel: 'Language',
    onLabel: 'On',
    offLabel: 'Off',
    coins: 'Coins',
    coinsEarned: (earned: number, remainingLives: number) =>
      `+${earned} ${earned === 1 ? 'Coin' : 'Coins'} Reward (${remainingLives} ${
        remainingLives === 1 ? 'Heart' : 'Hearts'
      })!`,
    ptsShort: 'pts',
    close: 'Close',
  },
} as const;

class ArcadeAudio {
  private ctx: AudioContext | null = null;
  private sfxEnabled = true;
  private musicEnabled = true;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private nextNoteTime = 0;
  private musicBpm = 136;
  private noiseBuffer: AudioBuffer | null = null;

  public setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
  }

  public setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  public setStageTempo(stage: number): void {
    const t = Math.max(0, Math.min(1, (stage - 1) / (TOTAL_STAGES - 1)));
    this.musicBpm = Math.round(136 + t * 18); // 136 -> 154 BPM
  }

  private getOrCreateContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private ensureContext(): AudioContext | null {
    if (!this.sfxEnabled) return null;
    return this.getOrCreateContext();
  }

  private ensureNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const bufferSize = Math.floor(ctx.sampleRate * 0.12);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private scheduleMusicStep(ctx: AudioContext, step: number, time: number): void {
    const stepDur = 60 / this.musicBpm / 4; // 16th note duration
    const bar = Math.floor(step / 16) % 4;
    const beatStep = step % 16;

    // Energetic minor arcade progression: Am -> F -> C -> G
    const bassRoots = [110.0, 87.31, 130.81, 98.0];
    const leadArps = [
      [440.0, 523.25, 659.25, 880.0, 659.25, 523.25, 587.33, 659.25],
      [349.23, 440.0, 523.25, 698.46, 523.25, 440.0, 523.25, 659.25],
      [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 783.99, 880.0],
      [392.0, 493.88, 587.33, 783.99, 659.25, 587.33, 493.88, 587.33],
    ];

    // 1. Driving 4-on-the-floor kick (+ syncopated pickup on step 14)
    if (beatStep === 0 || beatStep === 4 || beatStep === 8 || beatStep === 12 || beatStep === 14) {
      const kick = ctx.createOscillator();
      const gain = ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(145, time);
      kick.frequency.exponentialRampToValueAtTime(42, time + 0.095);
      gain.gain.setValueAtTime(beatStep === 14 ? 0.09 : 0.14, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
      kick.connect(gain);
      gain.connect(ctx.destination);
      kick.start(time);
      kick.stop(time + 0.12);
    }

    // 2. Crisp hi-hat & snare pulse
    if (beatStep % 2 === 0) {
      const isSnare = beatStep === 4 || beatStep === 12;
      const noise = ctx.createBufferSource();
      noise.buffer = this.ensureNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = isSnare ? 'bandpass' : 'highpass';
      filter.frequency.setValueAtTime(isSnare ? 1900 : 6200, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(isSnare ? 0.045 : 0.018, time);
      gain.gain.exponentialRampToValueAtTime(0.0008, time + (isSnare ? 0.085 : 0.03));

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(time);
      noise.stop(time + (isSnare ? 0.09 : 0.035));
    }

    // 3. Driving octave synth bassline on 8th notes
    if (beatStep % 2 === 0) {
      const root = bassRoots[bar];
      const freq = beatStep % 4 === 2 ? root * 2 : root;
      const bass = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      bass.type = 'sawtooth';
      bass.frequency.setValueAtTime(freq, time);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(620, time);
      filter.frequency.exponentialRampToValueAtTime(240, time + stepDur * 1.6);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.055, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + stepDur * 1.75);

      bass.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      bass.start(time);
      bass.stop(time + stepDur * 1.85);
    }

    // 4. Energetic synth arpeggio melody
    if (beatStep % 2 === 0) {
      const noteFreq = leadArps[bar][(beatStep / 2) % 8];
      const lead = ctx.createOscillator();
      const gain = ctx.createGain();
      lead.type = 'triangle';
      lead.frequency.setValueAtTime(noteFreq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.036, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, time + stepDur * 1.5);

      lead.connect(gain);
      gain.connect(ctx.destination);
      lead.start(time);
      lead.stop(time + stepDur * 1.6);
    }
  }

  public startMusic(stage: number): void {
    this.setStageTempo(stage);
    if (!this.musicEnabled) {
      this.stopMusic();
      return;
    }
    const ctx = this.getOrCreateContext();
    if (!ctx) return;
    if (this.musicTimer !== null) return;

    this.nextNoteTime = ctx.currentTime + 0.04;
    this.musicTimer = window.setInterval(() => {
      if (!this.musicEnabled || !this.ctx) {
        this.stopMusic();
        return;
      }
      if (this.ctx.state === 'suspended') return;
      const scheduleAhead = 0.14;
      while (this.nextNoteTime < this.ctx.currentTime + scheduleAhead) {
        this.scheduleMusicStep(this.ctx, this.musicStep, this.nextNoteTime);
        const stepDur = 60 / this.musicBpm / 4;
        this.nextNoteTime += stepDur;
        this.musicStep = (this.musicStep + 1) % 64;
      }
    }, 40);
  }

  public stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public playStart(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [440, 587.33];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.065);
      gain.gain.setValueAtTime(0.001, now + idx * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.065 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + idx * 0.065 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.065);
      osc.stop(now + idx * 0.065 + 0.17);
    });
  }

  public playCatch(streak: number, isTriangle: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const baseFreq =
      scale[Math.min(streak, scale.length - 1)] * (isTriangle ? 1.12 : 1.0);

    const osc = ctx.createOscillator();
    const harm = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.16, now + 0.09);

    harm.type = 'triangle';
    harm.frequency.setValueAtTime(baseFreq * 1.5, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.085, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.15);

    const harmGain = ctx.createGain();
    harmGain.gain.setValueAtTime(0.028, now);
    harmGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.12);

    osc.connect(gain);
    harm.connect(harmGain);
    harmGain.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    harm.start(now);
    osc.stop(now + 0.16);
    harm.stop(now + 0.13);
  }

  public playStageUp(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.08, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.19);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  public playHazardHit(heavy: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(heavy ? 150 : 195, now);
    osc.frequency.exponentialRampToValueAtTime(heavy ? 48 : 74, now + (heavy ? 0.3 : 0.22));

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(heavy ? 420 : 520, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + (heavy ? 0.3 : 0.22));

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(heavy ? 0.18 : 0.13, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + (heavy ? 0.32 : 0.24));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + (heavy ? 0.33 : 0.25));
  }

  public playGameOver(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [349.23, 293.66, 220.0];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.94, start + 0.22);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.095, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
  }

  public playVictory(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.09, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.34);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  }
}

function readStoredNumber(key: string, fallback: number): number {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function readStoredBoolean(key: string, fallback: boolean): boolean {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === 'true';
  } catch {
    return fallback;
  }
}

function readStoredLang(): Lang {
  try {
    const raw = window.localStorage.getItem(LANG_STORAGE_KEY);
    return raw === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function readStoredCompletedStages(): number[] {
  try {
    const raw = window.localStorage.getItem(COMPLETED_STAGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n): n is number =>
        typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= TOTAL_STAGES
    );
  } catch {
    return [];
  }
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => readStoredLang());
  const [status, setStatus] = useState<GameStatus>('START');
  const [score, setScore] = useState<number>(0);
  const [stagePoints, setStagePoints] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() =>
    readStoredNumber(BEST_SCORE_STORAGE_KEY, 0)
  );
  const [coins, setCoins] = useState<number>(() =>
    readStoredNumber(COINS_STORAGE_KEY, 0)
  );
  const [lastEarnedCoins, setLastEarnedCoins] = useState<number>(4);
  const [completedStages, setCompletedStages] = useState<number[]>(() =>
    readStoredCompletedStages()
  );
  const [lives, setLives] = useState<number>(MAX_LIVES);
  const [stageNum, setStageNum] = useState<number>(1);
  const [stagesModalOpen, setStagesModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(() =>
    readStoredBoolean(MUSIC_STORAGE_KEY, true)
  );
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(() =>
    readStoredBoolean(SFX_STORAGE_KEY, true)
  );
  const [isNewBest, setIsNewBest] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<ArcadeAudio>(new ArcadeAudio());

  const langRef = useRef<Lang>(lang);
  const statusRef = useRef<GameStatus>('START');
  const statusBeforeModalRef = useRef<GameStatus>('START');
  const stagesModalOpenRef = useRef<boolean>(false);
  const settingsModalOpenRef = useRef<boolean>(false);
  const scoreRef = useRef<number>(0);
  const stagePointsRef = useRef<number>(0);
  const bestScoreRef = useRef<number>(bestScore);
  const coinsRef = useRef<number>(coins);
  const completedStagesRef = useRef<number[]>(completedStages);
  const livesRef = useRef<number>(MAX_LIVES);
  const stageNumRef = useRef<number>(1);
  const streakRef = useRef<number>(0);

  const simRef = useRef({
    width: 800,
    height: 520,
    playerX: 400,
    playerVx: 0,
    playerWidth: 94,
    playerHeight: 26,
    playerY: 468,
    playerBounce: 0,
    playerGlowColor: '#38bdf8',
    playerGlowAlpha: 0,
    invulnTimer: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
    hitFlashAlpha: 0,
    stageBannerTimer: 0,
    stageBannerText: '',
    stageBannerSub: '',
    spawnTimer: 0.45,
    nextId: 1,
    lastHazardX: -999,
    items: [] as FallingItem[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    stars: [] as AmbientStar[],
    input: {
      leftKey: false,
      rightKey: false,
      leftBtn: false,
      rightBtn: false,
      pointerActive: false,
      pointerTargetX: 400,
      pointerId: null as number | null,
    },
  });

  const t = COPY[lang];
  const currentStageConfig = STAGES[Math.min(stageNum - 1, TOTAL_STAGES - 1)];
  const nextStageConfig =
    stageNum < TOTAL_STAGES ? STAGES[stageNum] : currentStageConfig;
  const stageProgressRatio =
    status === 'VICTORY' || status === 'STAGE_CLEAR'
      ? 1
      : Math.max(
          0,
          Math.min(1, stagePoints / currentStageConfig.pointsNeeded)
        );

  useEffect(() => {
    langRef.current = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore storage failures
    }
  }, [lang]);

  useEffect(() => {
    audioRef.current.setSfxEnabled(sfxEnabled);
    try {
      window.localStorage.setItem(SFX_STORAGE_KEY, String(sfxEnabled));
    } catch {
      // Ignore storage failures
    }
  }, [sfxEnabled]);

  useEffect(() => {
    audioRef.current.setMusicEnabled(musicEnabled);
    try {
      window.localStorage.setItem(MUSIC_STORAGE_KEY, String(musicEnabled));
    } catch {
      // Ignore storage failures
    }
  }, [musicEnabled]);

  // Keep energetic background music cleanly synced with active gameplay & Settings toggle
  useEffect(() => {
    const shouldPlayMusic =
      status === 'PLAYING' &&
      musicEnabled &&
      !stagesModalOpen &&
      !settingsModalOpen;

    if (shouldPlayMusic) {
      audioRef.current.startMusic(stageNum);
    } else {
      audioRef.current.stopMusic();
    }
  }, [status, musicEnabled, stagesModalOpen, settingsModalOpen, stageNum]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio.stopMusic();
    };
  }, []);

  const initStars = useCallback((width: number, height: number) => {
    const count = Math.max(24, Math.min(48, Math.floor((width * height) / 14000)));
    const stars: AmbientStar[] = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.8 + Math.random() * 1.4,
        speed: 12 + Math.random() * 26,
        alpha: 0.14 + Math.random() * 0.34,
      });
    }
    simRef.current.stars = stars;
  }, []);

  const startAtStage = useCallback((targetStage: number) => {
    const safeStage = Math.max(1, Math.min(TOTAL_STAGES, targetStage));
    if (!isStageUnlocked(safeStage, completedStagesRef.current)) return;
    const cfg = STAGES[safeStage - 1];
    const sim = simRef.current;
    const activeCopy = COPY[langRef.current];

    sim.items = [];
    sim.particles = [];
    sim.floatingTexts = [];
    sim.playerX = sim.width / 2;
    sim.playerVx = 0;
    sim.playerBounce = 0;
    sim.playerGlowAlpha = 0;
    sim.invulnTimer = 0;
    sim.shakeTimer = 0;
    sim.hitFlashAlpha = 0;
    sim.stageBannerTimer = 1.5;
    sim.stageBannerText = activeCopy.stageBanner(safeStage);
    sim.stageBannerSub = activeCopy.stageGoalLabel(cfg.pointsNeeded);
    sim.spawnTimer = 0.28;
    sim.lastHazardX = -999;
    sim.input.pointerActive = false;
    sim.input.pointerId = null;
    sim.input.leftBtn = false;
    sim.input.rightBtn = false;

    scoreRef.current = 0;
    stagePointsRef.current = 0;
    livesRef.current = MAX_LIVES;
    stageNumRef.current = safeStage;
    streakRef.current = 0;
    stagesModalOpenRef.current = false;
    settingsModalOpenRef.current = false;
    statusRef.current = 'PLAYING';

    setScore(0);
    setStagePoints(0);
    setLives(MAX_LIVES);
    setStageNum(safeStage);
    setStagesModalOpen(false);
    setSettingsModalOpen(false);
    setIsNewBest(false);
    setStatus('PLAYING');

    audioRef.current.playStart();
    audioRef.current.startMusic(safeStage);
  }, []);

  const resetAndStartGame = useCallback(() => {
    startAtStage(1);
  }, [startAtStage]);

  const proceedToNextStage = useCallback(() => {
    if (statusRef.current !== 'STAGE_CLEAR') return;
    const sim = simRef.current;
    const nextStage = Math.min(TOTAL_STAGES, stageNumRef.current + 1);
    const nextCfg = STAGES[nextStage - 1];
    const activeCopy = COPY[langRef.current];

    sim.items = [];
    sim.playerVx = 0;
    sim.invulnTimer = 0;
    sim.spawnTimer = 0.3;
    sim.lastHazardX = -999;
    sim.input.pointerActive = false;
    sim.input.pointerId = null;
    sim.input.leftBtn = false;
    sim.input.rightBtn = false;
    sim.stageBannerText = activeCopy.stageBanner(nextStage);
    sim.stageBannerSub = activeCopy.stageGoalLabel(nextCfg.pointsNeeded);
    sim.stageBannerTimer = 1.5;

    stagePointsRef.current = 0;
    livesRef.current = MAX_LIVES;
    stageNumRef.current = nextStage;
    statusRef.current = 'PLAYING';
    setStagePoints(0);
    setLives(MAX_LIVES);
    setStageNum(nextStage);
    setStatus('PLAYING');

    audioRef.current.playStart();
    audioRef.current.startMusic(nextStage);
  }, []);

  const openStagesModal = useCallback(() => {
    if (stagesModalOpenRef.current) {
      stagesModalOpenRef.current = false;
      setStagesModalOpen(false);
      if (statusBeforeModalRef.current === 'PLAYING') {
        statusRef.current = 'PLAYING';
        setStatus('PLAYING');
      }
      return;
    }

    if (settingsModalOpenRef.current) {
      settingsModalOpenRef.current = false;
      setSettingsModalOpen(false);
    } else {
      statusBeforeModalRef.current = statusRef.current;
      if (statusRef.current === 'PLAYING') {
        statusRef.current = 'PAUSED';
        setStatus('PAUSED');
      }
    }

    simRef.current.input.pointerActive = false;
    simRef.current.input.leftBtn = false;
    simRef.current.input.rightBtn = false;
    stagesModalOpenRef.current = true;
    setStagesModalOpen(true);
  }, []);

  const closeStagesModal = useCallback(() => {
    if (!stagesModalOpenRef.current) return;
    stagesModalOpenRef.current = false;
    setStagesModalOpen(false);
    if (statusBeforeModalRef.current === 'PLAYING') {
      statusRef.current = 'PLAYING';
      setStatus('PLAYING');
    }
  }, []);

  const openSettingsModal = useCallback(() => {
    if (settingsModalOpenRef.current) {
      settingsModalOpenRef.current = false;
      setSettingsModalOpen(false);
      if (statusBeforeModalRef.current === 'PLAYING') {
        statusRef.current = 'PLAYING';
        setStatus('PLAYING');
      }
      return;
    }

    if (stagesModalOpenRef.current) {
      stagesModalOpenRef.current = false;
      setStagesModalOpen(false);
    } else {
      statusBeforeModalRef.current = statusRef.current;
      if (statusRef.current === 'PLAYING') {
        statusRef.current = 'PAUSED';
        setStatus('PAUSED');
      }
    }

    simRef.current.input.pointerActive = false;
    simRef.current.input.leftBtn = false;
    simRef.current.input.rightBtn = false;
    settingsModalOpenRef.current = true;
    setSettingsModalOpen(true);
  }, []);

  const closeSettingsModal = useCallback(() => {
    if (!settingsModalOpenRef.current) return;
    settingsModalOpenRef.current = false;
    setSettingsModalOpen(false);
    if (statusBeforeModalRef.current === 'PLAYING') {
      statusRef.current = 'PLAYING';
      setStatus('PLAYING');
    }
  }, []);

  const togglePause = useCallback(() => {
    if (stagesModalOpenRef.current || settingsModalOpenRef.current) return;
    if (statusRef.current === 'PLAYING') {
      statusRef.current = 'PAUSED';
      setStatus('PAUSED');
    } else if (statusRef.current === 'PAUSED') {
      statusRef.current = 'PLAYING';
      setStatus('PLAYING');
    }
  }, []);

  const toggleMusic = useCallback(() => {
    setMusicEnabled((prev) => !prev);
  }, []);

  const toggleSfx = useCallback(() => {
    setSfxEnabled((prev) => !prev);
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && statusRef.current === 'PLAYING') {
        statusRef.current = 'PAUSED';
        setStatus('PAUSED');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();

      if (settingsModalOpenRef.current) {
        if (code === 'Escape') {
          e.preventDefault();
          closeSettingsModal();
        }
        return;
      }

      if (stagesModalOpenRef.current) {
        if (code === 'Escape') {
          e.preventDefault();
          closeStagesModal();
        }
        return;
      }

      if (code === 'ArrowLeft' || code === 'KeyA' || key === 'a') {
        simRef.current.input.leftKey = true;
        simRef.current.input.pointerActive = false;
        if (statusRef.current === 'PLAYING') e.preventDefault();
      } else if (code === 'ArrowRight' || code === 'KeyD' || key === 'd') {
        simRef.current.input.rightKey = true;
        simRef.current.input.pointerActive = false;
        if (statusRef.current === 'PLAYING') e.preventDefault();
      } else if (code === 'KeyP' || code === 'Escape') {
        if (statusRef.current === 'PLAYING' || statusRef.current === 'PAUSED') {
          e.preventDefault();
          togglePause();
        }
      } else if (code === 'KeyM') {
        toggleMusic();
      } else if (code === 'Space' || code === 'Enter') {
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== 'BUTTON') {
          if (statusRef.current === 'STAGE_CLEAR') {
            e.preventDefault();
            proceedToNextStage();
          } else if (
            statusRef.current === 'START' ||
            statusRef.current === 'GAME_OVER' ||
            statusRef.current === 'VICTORY'
          ) {
            e.preventDefault();
            resetAndStartGame();
          }
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();
      if (code === 'ArrowLeft' || code === 'KeyA' || key === 'a') {
        simRef.current.input.leftKey = false;
      } else if (code === 'ArrowRight' || code === 'KeyD' || key === 'd') {
        simRef.current.input.rightKey = false;
      }
    };

    const onBlur = () => {
      simRef.current.input.leftKey = false;
      simRef.current.input.rightKey = false;
      simRef.current.input.leftBtn = false;
      simRef.current.input.rightBtn = false;
      simRef.current.input.pointerActive = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [
    closeSettingsModal,
    closeStagesModal,
    proceedToNextStage,
    resetAndStartGame,
    toggleMusic,
    togglePause,
  ]);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const resizeCanvas = () => {
      const rect = stage.getBoundingClientRect();
      const w = Math.max(280, Math.floor(rect.width));
      const h = Math.max(300, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const sim = simRef.current;
      const prevW = sim.width || w;
      const ratioX = prevW > 0 ? sim.playerX / prevW : 0.5;

      sim.width = w;
      sim.height = h;
      sim.playerWidth = Math.max(66, Math.min(96, Math.round(w * 0.13)));
      sim.playerHeight = 26;
      sim.playerY = h - Math.max(46, Math.min(62, Math.round(h * 0.1)));
      sim.playerX = Math.max(
        sim.playerWidth / 2 + 12,
        Math.min(w - sim.playerWidth / 2 - 12, ratioX * w)
      );

      if (sim.stars.length === 0) {
        initStars(w, h);
      } else {
        for (const s of sim.stars) {
          s.x = Math.min(w, s.x);
          s.y = Math.min(h, s.y);
        }
      }
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [initStars]);

  // Main 60fps HTML5 Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    const spawnBurst = (
      x: number,
      y: number,
      color: string,
      count: number,
      speedScale = 1
    ) => {
      const sim = simRef.current;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
        const speed = (65 + Math.random() * 155) * speedScale;
        const maxLife = 0.28 + Math.random() * 0.24;
        sim.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 25,
          radius: 2 + Math.random() * 3.2,
          color,
          alpha: 1,
          life: maxLife,
          maxLife,
        });
      }
    };

    const spawnFallingObject = () => {
      const sim = simRef.current;
      const cfg = STAGES[Math.min(stageNumRef.current - 1, TOTAL_STAGES - 1)];

      const isHazard = Math.random() < cfg.hazardChance;
      let kind: ItemKind;
      if (isHazard) {
        kind =
          Math.random() < cfg.squareHazardRatio
            ? 'hazard_square'
            : 'hazard_spike';
      } else {
        // Two collectible types only: Pink Circle (+3) and Blue Triangle (+4)
        kind = Math.random() < 0.54 ? 'pink_circle' : 'blue_triangle';
      }

      const margin = Math.max(30, sim.playerWidth * 0.42);
      const usableW = Math.max(80, sim.width - margin * 2);

      let spawnX = margin + Math.random() * usableW;
      for (let attempt = 0; attempt < 6; attempt++) {
        const candidate = margin + Math.random() * usableW;
        const tooCloseToRecentTop = sim.items.some(
          (item) => item.y < 105 && Math.abs(item.x - candidate) < 62
        );
        const tooCloseToHazard =
          isHazard && Math.abs(candidate - sim.lastHazardX) < 58;
        if (!tooCloseToRecentTop && !tooCloseToHazard) {
          spawnX = candidate;
          break;
        }
      }

      if (isHazard) {
        sim.lastHazardX = spawnX;
      }

      const speedVariance =
        kind === 'hazard_square'
          ? 0.96 + Math.random() * 0.3
          : kind === 'hazard_spike'
          ? 0.9 + Math.random() * 0.34
          : kind === 'blue_triangle'
          ? 0.92 + Math.random() * 0.34
          : 0.84 + Math.random() * 0.36;

      const heightFactor = Math.max(0.82, Math.min(1.22, sim.height / 540));
      const speed = cfg.baseSpeed * speedVariance * heightFactor;

      const radius =
        kind === 'hazard_square'
          ? Math.max(16, Math.min(20, sim.width * 0.025))
          : kind === 'hazard_spike'
          ? Math.max(15, Math.min(19, sim.width * 0.024))
          : Math.max(14, Math.min(18, sim.width * 0.023));

      const driftRange = isHazard ? cfg.lateralDrift : cfg.lateralDrift * 0.65;
      sim.items.push({
        id: sim.nextId++,
        kind,
        x: spawnX,
        y: -radius - 10,
        radius,
        speed,
        vx: (Math.random() * 2 - 1) * driftRange,
        rotation: 0,
        rotSpeed:
          kind === 'hazard_spike'
            ? (Math.random() > 0.5 ? 1 : -1) * 2.4
            : 0,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    };

    const update = (dt: number) => {
      const sim = simRef.current;

      const starSpeedMul = statusRef.current === 'PLAYING' ? 1 : 0.45;
      for (const s of sim.stars) {
        s.y += s.speed * starSpeedMul * dt;
        if (s.y > sim.height + 4) {
          s.y = -4;
          s.x = Math.random() * sim.width;
        }
      }

      if (statusRef.current !== 'PLAYING') {
        if (
          statusRef.current === 'STAGE_CLEAR' ||
          statusRef.current === 'GAME_OVER' ||
          statusRef.current === 'VICTORY'
        ) {
          for (let i = sim.particles.length - 1; i >= 0; i--) {
            const p = sim.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
              sim.particles.splice(i, 1);
              continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 260 * dt;
            p.alpha = p.life / p.maxLife;
          }
          for (let i = sim.floatingTexts.length - 1; i >= 0; i--) {
            const ft = sim.floatingTexts[i];
            ft.life -= dt;
            if (ft.life <= 0) {
              sim.floatingTexts.splice(i, 1);
              continue;
            }
            ft.y += ft.vy * dt;
          }
          if (sim.shakeTimer > 0) sim.shakeTimer = Math.max(0, sim.shakeTimer - dt);
          if (sim.hitFlashAlpha > 0)
            sim.hitFlashAlpha = Math.max(0, sim.hitFlashAlpha - dt * 2.4);
        }
        return;
      }

      // Smooth player horizontal movement
      const halfW = sim.playerWidth / 2;
      const minX = halfW + 10;
      const maxX = sim.width - halfW - 10;
      const maxSpeed = Math.max(580, sim.width * 1.02);

      const moveDir =
        (sim.input.rightKey || sim.input.rightBtn ? 1 : 0) -
        (sim.input.leftKey || sim.input.leftBtn ? 1 : 0);

      if (moveDir !== 0) {
        const targetVx = moveDir * maxSpeed;
        const accel = 1 - Math.exp(-22 * dt);
        sim.playerVx += (targetVx - sim.playerVx) * accel;
        sim.playerX += sim.playerVx * dt;
      } else if (sim.input.pointerActive) {
        const clampedTarget = Math.max(
          minX,
          Math.min(maxX, sim.input.pointerTargetX)
        );
        const diffX = clampedTarget - sim.playerX;
        const follow = 1 - Math.exp(-26 * dt);
        const step = diffX * follow;
        sim.playerVx = dt > 0 ? step / dt : 0;
        sim.playerX += step;
      } else {
        const decel = Math.exp(-18 * dt);
        sim.playerVx *= decel;
        if (Math.abs(sim.playerVx) < 4) sim.playerVx = 0;
        sim.playerX += sim.playerVx * dt;
      }

      if (sim.playerX < minX) {
        sim.playerX = minX;
        sim.playerVx = 0;
      } else if (sim.playerX > maxX) {
        sim.playerX = maxX;
        sim.playerVx = 0;
      }

      if (sim.invulnTimer > 0) sim.invulnTimer = Math.max(0, sim.invulnTimer - dt);
      if (sim.playerBounce > 0) sim.playerBounce = Math.max(0, sim.playerBounce - dt * 5.2);
      if (sim.playerGlowAlpha > 0)
        sim.playerGlowAlpha = Math.max(0, sim.playerGlowAlpha - dt * 2.8);
      if (sim.shakeTimer > 0) sim.shakeTimer = Math.max(0, sim.shakeTimer - dt);
      if (sim.hitFlashAlpha > 0)
        sim.hitFlashAlpha = Math.max(0, sim.hitFlashAlpha - dt * 2.5);
      if (sim.stageBannerTimer > 0)
        sim.stageBannerTimer = Math.max(0, sim.stageBannerTimer - dt);

      // Spawning cadence governed by current stage
      const activeCfg = STAGES[Math.min(stageNumRef.current - 1, TOTAL_STAGES - 1)];
      sim.spawnTimer -= dt;
      if (sim.spawnTimer <= 0) {
        spawnFallingObject();
        sim.spawnTimer = activeCfg.spawnInterval * (0.82 + Math.random() * 0.36);
      }

      // Collision checks
      const catcherTop = sim.playerY - sim.playerHeight / 2;
      const catcherBottom = sim.playerY + sim.playerHeight / 2;
      const catcherLeft = sim.playerX - halfW;
      const catcherRight = sim.playerX + halfW;

      for (let i = sim.items.length - 1; i >= 0; i--) {
        const item = sim.items[i];
        item.y += item.speed * dt;
        item.x += item.vx * dt;
        item.rotation += item.rotSpeed * dt;
        item.pulsePhase += dt * 5.2;

        if (item.x < item.radius + 10) {
          item.x = item.radius + 10;
          item.vx = Math.abs(item.vx);
        } else if (item.x > sim.width - item.radius - 10) {
          item.x = sim.width - item.radius - 10;
          item.vx = -Math.abs(item.vx);
        }

        const isPoint =
          item.kind === 'pink_circle' || item.kind === 'blue_triangle';

        if (item.y - item.radius > sim.height + 24) {
          if (isPoint) {
            streakRef.current = 0;
          }
          sim.items.splice(i, 1);
          continue;
        }

        const hitPad = isPoint ? 4 : -4;
        const nearestX = Math.max(
          catcherLeft - hitPad,
          Math.min(item.x, catcherRight + hitPad)
        );
        const nearestY = Math.max(
          catcherTop - hitPad,
          Math.min(item.y, catcherBottom + hitPad)
        );
        const dx = item.x - nearestX;
        const dy = item.y - nearestY;
        const effectiveRadius = Math.max(6, item.radius + (isPoint ? 2 : -2));

        if (dx * dx + dy * dy <= effectiveRadius * effectiveRadius) {
          sim.items.splice(i, 1);

          if (isPoint) {
            const isTriangle = item.kind === 'blue_triangle';
            const value = isTriangle
              ? BLUE_TRIANGLE_POINTS
              : PINK_CIRCLE_POINTS;
            const color = isTriangle ? '#38bdf8' : '#f472b6';
            const textColor = isTriangle ? '#bae6fd' : '#fbcfe8';

            const nextScore = scoreRef.current + value;
            scoreRef.current = nextScore;
            setScore(nextScore);

            const nextStagePoints = stagePointsRef.current + value;
            stagePointsRef.current = nextStagePoints;
            setStagePoints(nextStagePoints);

            if (nextScore > bestScoreRef.current) {
              bestScoreRef.current = nextScore;
              setBestScore(nextScore);
              setIsNewBest(true);
              try {
                window.localStorage.setItem(
                  BEST_SCORE_STORAGE_KEY,
                  String(nextScore)
                );
              } catch {
                // Ignore storage errors
              }
            }

            sim.playerBounce = 1;
            sim.playerGlowColor = color;
            sim.playerGlowAlpha = 1;

            spawnBurst(item.x, item.y, color, 14, 1);
            spawnBurst(item.x, item.y, '#ffffff', 5, 0.7);
            sim.floatingTexts.push({
              x: item.x,
              y: item.y - 10,
              vy: -56,
              text: `+${value}`,
              color: textColor,
              life: 0.65,
              maxLife: 0.65,
            });

            // Check stage completion (1 heart = +1 coin, 2 hearts = +2 coins, 3 hearts = +4 coins)
            const currentStageCfg =
              STAGES[Math.min(stageNumRef.current - 1, TOTAL_STAGES - 1)];

            if (nextStagePoints >= currentStageCfg.pointsNeeded) {
              const clearedStage = stageNumRef.current;
              const earnedCoins = getStageClearCoins(livesRef.current);
              const nextCoins = coinsRef.current + earnedCoins;
              coinsRef.current = nextCoins;
              setLastEarnedCoins(earnedCoins);
              setCoins(nextCoins);
              try {
                window.localStorage.setItem(
                  COINS_STORAGE_KEY,
                  String(nextCoins)
                );
              } catch {
                // Ignore storage errors
              }

              setCompletedStages((prev) => {
                if (prev.includes(clearedStage)) return prev;
                const updated = [...prev, clearedStage];
                completedStagesRef.current = updated;
                try {
                  window.localStorage.setItem(
                    COMPLETED_STAGES_STORAGE_KEY,
                    JSON.stringify(updated)
                  );
                } catch {
                  // Ignore storage errors
                }
                return updated;
              });

              sim.input.pointerActive = false;
              sim.input.pointerId = null;
              sim.input.leftBtn = false;
              sim.input.rightBtn = false;

              if (clearedStage >= TOTAL_STAGES) {
                statusRef.current = 'VICTORY';
                setStatus('VICTORY');
                spawnBurst(sim.width * 0.35, sim.height * 0.4, '#f472b6', 20, 1.3);
                spawnBurst(sim.width * 0.65, sim.height * 0.4, '#38bdf8', 20, 1.3);
                audioRef.current.playVictory();
              } else {
                statusRef.current = 'STAGE_CLEAR';
                setStatus('STAGE_CLEAR');
                spawnBurst(sim.width * 0.35, sim.height * 0.42, '#f472b6', 16, 1.15);
                spawnBurst(sim.width * 0.65, sim.height * 0.42, '#38bdf8', 16, 1.15);
                audioRef.current.playStageUp();
              }
              streakRef.current = Math.min(streakRef.current + 1, 10);
              break;
            } else {
              audioRef.current.playCatch(streakRef.current, isTriangle);
              streakRef.current = Math.min(streakRef.current + 1, 10);
            }
          } else {
            // Red hazard hit: spike = -1 life, red square = -2 lives
            const isHeavySquare = item.kind === 'hazard_square';
            const damage = isHeavySquare ? 2 : 1;

            if (sim.invulnTimer <= 0) {
              const nextLives = Math.max(0, livesRef.current - damage);
              livesRef.current = nextLives;
              streakRef.current = 0;
              setLives(nextLives);

              sim.shakeTimer = isHeavySquare ? 0.32 : 0.24;
              sim.shakeIntensity = isHeavySquare ? 10 : 7;
              sim.hitFlashAlpha = isHeavySquare ? 0.44 : 0.32;
              sim.invulnTimer = 0.75;

              spawnBurst(
                item.x,
                item.y,
                isHeavySquare ? '#dc2626' : '#ef4444',
                isHeavySquare ? 24 : 18,
                isHeavySquare ? 1.35 : 1.15
              );
              spawnBurst(item.x, item.y, '#fca5a5', 8, 0.85);
              sim.floatingTexts.push({
                x: item.x,
                y: item.y - 12,
                vy: -50,
                text: `-${damage}`,
                color: '#fecaca',
                life: 0.82,
                maxLife: 0.82,
              });

              if (nextLives <= 0) {
                statusRef.current = 'GAME_OVER';
                setStatus('GAME_OVER');
                audioRef.current.playGameOver();
                break;
              } else {
                audioRef.current.playHazardHit(isHeavySquare);
              }
            }
          }
        }
      }

      // Particles
      for (let i = sim.particles.length - 1; i >= 0; i--) {
        const p = sim.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          sim.particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 280 * dt;
        p.vx *= Math.exp(-2.5 * dt);
        p.alpha = p.life / p.maxLife;
      }

      // Floating score / damage callouts
      for (let i = sim.floatingTexts.length - 1; i >= 0; i--) {
        const ft = sim.floatingTexts[i];
        ft.life -= dt;
        if (ft.life <= 0) {
          sim.floatingTexts.splice(i, 1);
          continue;
        }
        ft.y += ft.vy * dt;
      }
    };

    const drawPinkCircle = (item: FallingItem) => {
      const r = item.radius;
      const pulse = 1 + Math.sin(item.pulsePhase) * 0.05;

      ctx.save();
      ctx.translate(item.x, item.y);

      const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.9);
      glow.addColorStop(0, 'rgba(244, 114, 182, 0.42)');
      glow.addColorStop(1, 'rgba(244, 114, 182, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.scale(pulse, pulse);

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ec4899';
      ctx.fill();
      ctx.strokeStyle = '#fbcfe8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Subtle glossy top highlight
      ctx.beginPath();
      ctx.arc(-r * 0.28, -r * 0.3, r * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fill();

      // Clear +3 value indicator
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.round(r * 0.92)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('3', 0, 1);

      ctx.restore();
    };

    const drawBlueTriangle = (item: FallingItem) => {
      const r = item.radius;
      const pulse = 1 + Math.sin(item.pulsePhase) * 0.05;
      const sway = Math.sin(item.pulsePhase * 0.6) * 0.08;

      ctx.save();
      ctx.translate(item.x, item.y);

      const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.95);
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.42)');
      glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.95, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(sway);
      ctx.scale(pulse, pulse);

      // Crisp upward equilateral triangle
      const topY = -r * 1.15;
      const baseY = r * 0.88;
      const halfBase = r * 1.12;

      ctx.beginPath();
      ctx.moveTo(0, topY);
      ctx.lineTo(halfBase, baseY);
      ctx.lineTo(-halfBase, baseY);
      ctx.closePath();
      ctx.fillStyle = '#0284c7';
      ctx.fill();
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Clear +4 value indicator
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.round(r * 0.86)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('4', 0, r * 0.24);

      ctx.restore();
    };

    const drawHazardSpike = (item: FallingItem) => {
      const r = item.radius;
      const pulse = 1 + Math.sin(item.pulsePhase * 1.4) * 0.08;

      ctx.save();
      ctx.translate(item.x, item.y);

      ctx.strokeStyle = `rgba(239, 68, 68, ${0.28 + Math.sin(item.pulsePhase * 1.4) * 0.14})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.38 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.rotate(item.rotation);
      const spikes = 8;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const rad = i % 2 === 0 ? r * 1.24 : r * 0.72;
        const ang = (i * Math.PI) / spikes;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#dc2626';
      ctx.fill();
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
      ctx.fillStyle = '#7f1d1d';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${Math.round(r * 0.78)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('-1', 0, 1);

      ctx.restore();
    };

    const drawHazardSquare = (item: FallingItem) => {
      const r = item.radius;
      const size = r * 1.92;
      const half = size / 2;
      const pulse = 1 + Math.sin(item.pulsePhase * 1.6) * 0.06;

      ctx.save();
      ctx.translate(item.x, item.y);

      // Outer crimson warning square halo
      const haloSize = size * 1.24 * pulse;
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.36 + Math.sin(item.pulsePhase * 1.6) * 0.18})`;
      ctx.lineWidth = 1.8;
      drawRoundedRectPath(
        ctx,
        -haloSize / 2,
        -haloSize / 2,
        haloSize,
        haloSize,
        6
      );
      ctx.stroke();

      // Main bold red square body
      drawRoundedRectPath(ctx, -half, -half, size, size, 4);
      ctx.fillStyle = '#b91c1c';
      ctx.fill();
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Inner dark crimson frame for heavy hazard contrast
      const inner = size * 0.72;
      drawRoundedRectPath(ctx, -inner / 2, -inner / 2, inner, inner, 2);
      ctx.fillStyle = '#7f1d1d';
      ctx.fill();

      // Unmistakable -2 label
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${Math.round(r * 0.88)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('-2', 0, 1);

      ctx.restore();
    };

    const drawPlayer = () => {
      const sim = simRef.current;
      if (sim.invulnTimer > 0 && Math.floor(sim.invulnTimer * 16) % 2 === 0) {
        return;
      }

      const w = sim.playerWidth;
      const h = sim.playerHeight;
      const halfW = w / 2;
      const halfH = h / 2;
      const tilt = Math.max(-0.14, Math.min(0.14, sim.playerVx / 3000));
      const scaleX = 1 + sim.playerBounce * 0.11;
      const scaleY = 1 - sim.playerBounce * 0.13;
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.008);
      const isCatchFlash = sim.playerGlowAlpha > 0.05;
      const accentColor = isCatchFlash ? sim.playerGlowColor : '#38bdf8';

      ctx.save();
      ctx.translate(sim.playerX, sim.playerY);
      ctx.rotate(tilt);
      ctx.scale(scaleX, scaleY);

      // Strong ambient aura so the catcher pops immediately against the dark arena
      const auraGrad = ctx.createRadialGradient(0, 0, 6, 0, 2, w * 0.92);
      auraGrad.addColorStop(
        0,
        isCatchFlash ? `${sim.playerGlowColor}99` : 'rgba(56, 189, 248, 0.52)'
      );
      auraGrad.addColorStop(
        0.55,
        isCatchFlash ? `${sim.playerGlowColor}33` : 'rgba(14, 165, 233, 0.18)'
      );
      auraGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.ellipse(0, 2, w * 0.92, h * 1.65, 0, 0, Math.PI * 2);
      ctx.fill();

      // Upward energy catch-field beam right above the cradle lip
      const beamGrad = ctx.createLinearGradient(0, -halfH - 18, 0, -halfH + 2);
      beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      beamGrad.addColorStop(
        1,
        isCatchFlash ? `${sim.playerGlowColor}88` : 'rgba(125, 211, 252, 0.42)'
      );
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(-halfW + 10, -halfH - 14);
      ctx.lineTo(halfW - 10, -halfH - 14);
      ctx.lineTo(halfW - 4, -halfH + 2);
      ctx.lineTo(-halfW + 4, -halfH + 2);
      ctx.closePath();
      ctx.fill();

      // Dual animated thruster jets beneath the hull
      const thrusterLen = 8 + pulse * 5 + Math.min(5, Math.abs(sim.playerVx) / 140);
      for (const tx of [-halfW * 0.46, halfW * 0.46]) {
        const flameGrad = ctx.createLinearGradient(
          tx,
          halfH - 2,
          tx,
          halfH + thrusterLen
        );
        flameGrad.addColorStop(0, '#ffffff');
        flameGrad.addColorStop(0.4, '#38bdf8');
        flameGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(tx - 6, halfH - 2);
        ctx.lineTo(tx + 6, halfH - 2);
        ctx.lineTo(tx, halfH + thrusterLen);
        ctx.closePath();
        ctx.fill();
      }

      // Sculpted winged catcher cradle silhouette (raised left/right bumpers)
      ctx.beginPath();
      ctx.moveTo(-halfW, -halfH - 5);
      ctx.lineTo(-halfW + 11, -halfH - 5);
      ctx.lineTo(-halfW + 16, -halfH + 2);
      ctx.lineTo(halfW - 16, -halfH + 2);
      ctx.lineTo(halfW - 11, -halfH - 5);
      ctx.lineTo(halfW, -halfH - 5);
      ctx.quadraticCurveTo(halfW + 3, 2, halfW - 10, halfH);
      ctx.lineTo(-halfW + 10, halfH);
      ctx.quadraticCurveTo(-halfW - 3, 2, -halfW, -halfH - 5);
      ctx.closePath();

      const hullGrad = ctx.createLinearGradient(0, -halfH - 5, 0, halfH);
      hullGrad.addColorStop(0, '#ffffff');
      hullGrad.addColorStop(0.35, '#e0f2fe');
      hullGrad.addColorStop(0.7, '#38bdf8');
      hullGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = hullGrad;
      ctx.fill();

      // Crisp high-contrast bright outline around entire catcher
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Dark inner cockpit band for crisp depth contrast
      drawRoundedRectPath(ctx, -halfW + 14, -halfH + 7, w - 28, h - 13, 6);
      ctx.fillStyle = '#0c1930';
      ctx.fill();

      // Bright luminous catch bar along the top rim
      const barW = w - 24;
      drawRoundedRectPath(ctx, -barW / 2, -halfH + 1, barW, 5.5, 2.75);
      ctx.fillStyle = accentColor;
      ctx.fill();
      drawRoundedRectPath(ctx, -barW * 0.36, -halfH + 2, barW * 0.72, 2.2, 1.1);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Glowing center core jewel
      ctx.beginPath();
      ctx.arc(0, 2, 4.4, 0, Math.PI * 2);
      ctx.fillStyle = isCatchFlash ? sim.playerGlowColor : '#fde047';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // High-visibility amber tip beacons on left & right wings so edges are unmistakable
      for (const tipX of [-halfW + 5.5, halfW - 5.5]) {
        ctx.beginPath();
        ctx.arc(tipX, -halfH - 1, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }

      ctx.restore();
    };

    const render = () => {
      const sim = simRef.current;
      const { width, height } = sim;

      ctx.save();

      if (sim.shakeTimer > 0) {
        const mag = sim.shakeIntensity * (sim.shakeTimer / 0.32);
        ctx.translate(
          (Math.random() - 0.5) * mag * 2,
          (Math.random() - 0.5) * mag * 1.4
        );
      }

      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#070f1e');
      bgGrad.addColorStop(0.55, '#0b1629');
      bgGrad.addColorStop(1, '#101f38');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(-14, -14, width + 28, height + 28);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.045)';
      ctx.lineWidth = 1;
      const gridStep = Math.max(48, Math.round(width / 12));
      ctx.beginPath();
      for (let gx = gridStep; gx < width; gx += gridStep) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
      }
      for (let gy = gridStep; gy < height; gy += gridStep) {
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
      }
      ctx.stroke();

      for (const s of sim.stars) {
        ctx.fillStyle = `rgba(226, 232, 240, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const railY = sim.playerY + sim.playerHeight / 2 + 10;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, railY);
      ctx.lineTo(width - 20, railY);
      ctx.stroke();

      // Bright tracking highlight on the rail directly under the player
      const railGlow = ctx.createLinearGradient(
        sim.playerX - sim.playerWidth * 0.9,
        railY,
        sim.playerX + sim.playerWidth * 0.9,
        railY
      );
      railGlow.addColorStop(0, 'rgba(56, 189, 248, 0)');
      railGlow.addColorStop(0.5, 'rgba(125, 211, 252, 0.95)');
      railGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.strokeStyle = railGlow;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(Math.max(20, sim.playerX - sim.playerWidth * 0.9), railY);
      ctx.lineTo(Math.min(width - 20, sim.playerX + sim.playerWidth * 0.9), railY);
      ctx.stroke();

      for (const item of sim.items) {
        if (item.kind === 'pink_circle') {
          drawPinkCircle(item);
        } else if (item.kind === 'blue_triangle') {
          drawBlueTriangle(item);
        } else if (item.kind === 'hazard_square') {
          drawHazardSquare(item);
        } else {
          drawHazardSpike(item);
        }
      }

      drawPlayer();

      for (const p of sim.particles) {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 17px "Segoe UI", system-ui, sans-serif';
      for (const ft of sim.floatingTexts) {
        const alpha = Math.max(0, ft.life / ft.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.globalAlpha = 1;

      // Non-blocking Stage Banner notification on stage transitions
      if (sim.stageBannerTimer > 0 && statusRef.current === 'PLAYING') {
        const fade = Math.min(1, sim.stageBannerTimer / 0.35);
        ctx.save();
        ctx.globalAlpha = fade;
        const bannerW = Math.min(240, width - 40);
        const bannerH = 54;
        const bx = (width - bannerW) / 2;
        const by = Math.max(24, height * 0.14);

        drawRoundedRectPath(ctx, bx, by, bannerW, bannerH, 10);
        ctx.fillStyle = 'rgba(15, 26, 46, 0.88)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 18px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sim.stageBannerText, width / 2, by + 20);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(sim.stageBannerSub, width / 2, by + 39);
        ctx.restore();
      }

      if (sim.hitFlashAlpha > 0.01) {
        const hitGrad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          Math.min(width, height) * 0.25,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.72
        );
        hitGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
        hitGrad.addColorStop(1, `rgba(239, 68, 68, ${sim.hitFlashAlpha})`);
        ctx.fillStyle = hitGrad;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.restore();
    };

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      update(dt);
      render();
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (statusRef.current !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    simRef.current.input.pointerActive = true;
    simRef.current.input.pointerId = e.pointerId;
    simRef.current.input.pointerTargetX = e.clientX - rect.left;
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (statusRef.current !== 'PLAYING') return;
    if (
      !simRef.current.input.pointerActive ||
      simRef.current.input.pointerId !== e.pointerId
    ) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    simRef.current.input.pointerTargetX = e.clientX - rect.left;
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (simRef.current.input.pointerId === e.pointerId) {
      simRef.current.input.pointerActive = false;
      simRef.current.input.pointerId = null;
    }
  };

  const setLeftHold = (active: boolean) => {
    simRef.current.input.leftBtn = active;
    if (active) simRef.current.input.pointerActive = false;
  };

  const setRightHold = (active: boolean) => {
    simRef.current.input.rightBtn = active;
    if (active) simRef.current.input.pointerActive = false;
  };

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="h-[100dvh] w-full bg-[#070e1a] text-slate-100 flex flex-col overflow-hidden"
    >
      {/* Top HUD Bar — 2 compact rows on mobile (zero overlap between Stages & Hearts), single spacious row on md+ */}
      <header className="w-full border-b border-white/10 bg-[#0b1424]/95 shrink-0">
        <div className="mx-auto max-w-[1040px] px-3 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between md:h-16 md:gap-4">
          {/* Row 1 on mobile (Title + Controls); splits cleanly on md+ via display:contents */}
          <div className="h-10 md:h-auto flex items-center justify-between gap-2 md:contents">
            {/* Title Wordmark */}
            <div className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 md:order-1">
              {t.title}
            </div>

            {/* Utility Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 md:order-3">
              {/* Compact Stages Navigation Button ("المراحل") */}
              <button
                type="button"
                onClick={openStagesModal}
                aria-expanded={stagesModalOpen}
                className={`h-7 md:h-8 px-2 sm:px-2.5 inline-flex items-center justify-center gap-1 rounded-md border text-[11px] sm:text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 whitespace-nowrap shrink-0 cursor-pointer ${
                  stagesModalOpen
                    ? 'border-sky-400/60 bg-sky-500/20 text-sky-200'
                    : 'border-white/12 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                <span>{t.stagesBtn}</span>
              </button>

              {(status === 'PLAYING' || status === 'PAUSED') &&
                !stagesModalOpen &&
                !settingsModalOpen && (
                  <button
                    type="button"
                    onClick={togglePause}
                    aria-label={status === 'PAUSED' ? t.resume : t.pause}
                    title={status === 'PAUSED' ? t.resume : t.pause}
                    className="h-7 w-7 md:h-9 md:w-9 inline-flex items-center justify-center rounded-md md:rounded-lg border border-white/10 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer shrink-0"
                  >
                    {status === 'PAUSED' ? (
                      <svg
                        viewBox="0 0 24 24"
                        className="w-3.5 h-3.5 md:w-4 md:h-4"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        className="w-3.5 h-3.5 md:w-4 md:h-4"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
                      </svg>
                    )}
                  </button>
                )}

              {/* Settings Button ("الإعدادات") */}
              <button
                type="button"
                onClick={openSettingsModal}
                aria-expanded={settingsModalOpen}
                aria-label={t.settingsBtn}
                className={`h-7 md:h-9 px-2 md:px-3 inline-flex items-center justify-center gap-1.5 rounded-md md:rounded-lg border text-[11px] sm:text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 whitespace-nowrap shrink-0 cursor-pointer ${
                  settingsModalOpen
                    ? 'border-sky-400/60 bg-sky-500/20 text-sky-200'
                    : 'border-white/12 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>{t.settingsBtn}</span>
              </button>

              <button
                type="button"
                onClick={toggleLang}
                aria-label={t.langToggleAria}
                className="hidden sm:inline-flex h-7 md:h-9 px-2.5 items-center justify-center rounded-md md:rounded-lg border border-white/10 bg-slate-900/80 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.langToggle}
              </button>
            </div>
          </div>

          {/* Row 2 on mobile (Dedicated Metrics Bar); middle section on md+ */}
          <div
            className="h-9 md:h-auto border-t border-white/5 md:border-t-0 flex items-center justify-between md:justify-center gap-2 sm:gap-3 lg:gap-4 min-w-0 md:order-2"
            aria-live="polite"
          >
            {/* Stage Indicator */}
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-[11px] sm:text-xs md:hidden lg:inline text-slate-400">
                {t.stage}
              </span>
              <span className="font-num text-xs sm:text-sm lg:text-base font-bold text-sky-300">
                {stageNum}/{TOTAL_STAGES}
              </span>
            </div>

            <div className="h-3.5 sm:h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />

            {/* Stage Progress & Score */}
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-[11px] sm:text-xs lg:text-sm text-slate-400">
                {t.score}
              </span>
              <span className="font-num text-xs sm:text-sm lg:text-base font-bold text-white">
                {stagePoints}
              </span>
              <span className="font-num text-[11px] sm:text-xs text-slate-400">
                /{currentStageConfig.pointsNeeded}
              </span>
            </div>

            <div className="h-3.5 sm:h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />

            {/* Coins (الفلوس) */}
            <div
              className="flex items-center gap-1 whitespace-nowrap"
              aria-label={`${t.coins}: ${coins}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-amber-400 shrink-0"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9.5"
                  fill="currentColor"
                  stroke="#fef3c7"
                  strokeWidth="1.6"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="5.5"
                  fill="none"
                  stroke="#b45309"
                  strokeWidth="1.4"
                />
              </svg>
              <span className="font-num text-xs sm:text-sm lg:text-base font-bold text-amber-300">
                {coins}
              </span>
            </div>

            <div className="hidden xl:block h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />

            {/* Best Score (desktop HUD; also always shown in overlays) */}
            <div className="hidden xl:flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-sm text-slate-400">{t.best}</span>
              <span className="font-num text-base font-bold text-slate-200">
                {bestScore}
              </span>
            </div>

            <div className="h-3.5 sm:h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />

            {/* Lives */}
            <div
              className="flex items-center gap-1 whitespace-nowrap"
              aria-label={`${t.lives}: ${lives}/${MAX_LIVES}`}
            >
              <div className="flex items-center gap-0.5 sm:gap-1" aria-hidden="true">
                {Array.from({ length: MAX_LIVES }).map((_, idx) => {
                  const active = idx < lives;
                  return (
                    <svg
                      key={idx}
                      viewBox="0 0 24 24"
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 transition-transform duration-150 ${
                        active
                          ? 'text-rose-500 scale-100'
                          : 'text-slate-700 scale-90'
                      }`}
                      fill="currentColor"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  );
                })}
              </div>
              <span className="font-num text-[11px] sm:text-xs font-semibold text-slate-300 md:hidden lg:inline">
                {lives}/{MAX_LIVES}
              </span>
            </div>
          </div>
        </div>

        {/* Thin Stage Progress Bar */}
        <div
          className="h-[3px] w-full bg-white/5 overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(stageProgressRatio * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t.stage}
        >
          <div
            className="h-full bg-gradient-to-r from-pink-400 to-sky-400 transition-transform duration-150 origin-left rtl:origin-right"
            style={{ transform: `scaleX(${stageProgressRatio})` }}
          />
        </div>
      </header>

      {/* Main Game Arena Container */}
      <main className="flex-1 min-h-0 w-full mx-auto max-w-[1040px] px-3 sm:px-6 py-3 sm:py-4 flex flex-col gap-3">
        <div
          ref={stageRef}
          className="relative flex-1 min-h-0 w-full rounded-xl overflow-hidden border border-white/10 bg-[#081120] shadow-2xl"
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerUp}
            className="block w-full h-full touch-none cursor-grab active:cursor-grabbing"
          />

          {/* Start Overlay */}
          {status === 'START' && !stagesModalOpen && !settingsModalOpen && (
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-[#060c17]/74 backdrop-blur-[3px]">
              <div className="w-full max-w-md rounded-xl border border-white/12 bg-[#0f1a2e]/95 p-5 sm:p-8 text-center shadow-2xl">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2.5 text-balance">
                  {t.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-5">
                  {t.rule}
                </p>

                {/* Crisp 2x2 Visual Legend */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 py-3.5 mb-6 border-y border-white/10 text-xs sm:text-sm text-slate-200">
                  <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 shrink-0"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="#ec4899"
                        stroke="#fbcfe8"
                        strokeWidth="1.8"
                      />
                      <text
                        x="12"
                        y="16"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="700"
                      >
                        3
                      </text>
                    </svg>
                    <span>{t.pinkLegend}</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 shrink-0"
                      aria-hidden="true"
                    >
                      <polygon
                        points="12,2 22,20 2,20"
                        fill="#0284c7"
                        stroke="#bae6fd"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <text
                        x="12"
                        y="17.5"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="700"
                      >
                        4
                      </text>
                    </svg>
                    <span>{t.blueLegend}</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 shrink-0"
                      aria-hidden="true"
                    >
                      <polygon
                        points="12,1 14.8,6.2 20.5,4.5 18.2,10 23,12 18.2,14 20.5,19.5 14.8,17.8 12,23 9.2,17.8 3.5,19.5 5.8,14 1,12 5.8,10 3.5,4.5 9.2,6.2"
                        fill="#dc2626"
                      />
                      <text
                        x="12"
                        y="15.5"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="800"
                      >
                        -1
                      </text>
                    </svg>
                    <span>{t.spikeLegend}</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 shrink-0"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2.5"
                        fill="#b91c1c"
                        stroke="#fca5a5"
                        strokeWidth="1.8"
                      />
                      <text
                        x="12"
                        y="15.5"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9.5"
                        fontWeight="800"
                      >
                        -2
                      </text>
                    </svg>
                    <span>{t.squareLegend}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetAndStartGame}
                  className="w-full sm:w-auto min-w-[200px] px-8 py-3.5 rounded-lg bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-slate-950 font-bold text-base transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1a2e] whitespace-nowrap cursor-pointer"
                >
                  {t.startBtn}
                </button>
              </div>
            </div>
          )}

          {/* Pause Overlay */}
          {status === 'PAUSED' && !stagesModalOpen && !settingsModalOpen && (
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-[#060c17]/75 backdrop-blur-[3px]">
              <div className="w-full max-w-sm rounded-xl border border-white/12 bg-[#0f1a2e]/95 p-6 sm:p-7 text-center shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {t.paused}
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={togglePause}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-slate-950 font-bold text-sm sm:text-base transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 whitespace-nowrap cursor-pointer"
                  >
                    {t.resumeBtn}
                  </button>
                  <button
                    type="button"
                    onClick={resetAndStartGame}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg border border-white/15 bg-slate-800/80 hover:bg-slate-700 text-slate-100 font-semibold text-sm sm:text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 whitespace-nowrap cursor-pointer"
                  >
                    {t.restartBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stage Clear Overlay with Heart-Based Coin Reward & Next Stage Button */}
          {status === 'STAGE_CLEAR' && !stagesModalOpen && !settingsModalOpen && (
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-[#060c17]/76 backdrop-blur-[3px]">
              <div className="w-full max-w-md rounded-xl border border-sky-400/25 bg-[#0f1a2e]/95 p-6 sm:p-8 text-center shadow-2xl">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-balance">
                  {t.stageCompleteTitle(stageNum)}
                </h2>
                <p className="text-sm sm:text-base font-bold text-amber-300 mb-1.5">
                  {t.coinsEarned(lastEarnedCoins, lives)}
                </p>
                <p className="text-xs sm:text-sm text-sky-300 font-medium mb-5">
                  {t.nextGoalText(nextStageConfig.pointsNeeded)}
                </p>

                <div className="grid grid-cols-3 divide-x divide-white/10 rtl:divide-x-reverse py-4 mb-6 border-y border-white/10">
                  <div className="px-2">
                    <div className="text-xs text-slate-400 mb-1">
                      {t.score}
                    </div>
                    <div className="font-num text-2xl sm:text-3xl font-bold text-white">
                      {score}
                    </div>
                  </div>
                  <div className="px-2">
                    <div className="text-xs text-slate-400 mb-1">
                      {t.coins}
                    </div>
                    <div className="font-num text-2xl sm:text-3xl font-bold text-amber-300">
                      {coins}
                    </div>
                  </div>
                  <div className="px-2">
                    <div className="text-xs text-slate-400 mb-1">
                      {t.lives}
                    </div>
                    <div className="font-num text-2xl sm:text-3xl font-bold text-rose-400">
                      {lives}/{MAX_LIVES}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={proceedToNextStage}
                  className="w-full sm:w-auto min-w-[220px] px-8 py-3.5 rounded-lg bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-slate-950 font-bold text-base transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1a2e] whitespace-nowrap cursor-pointer"
                >
                  {t.nextStageBtn(stageNum + 1)}
                </button>
              </div>
            </div>
          )}

          {/* Game Over / Victory Overlay */}
          {(status === 'GAME_OVER' || status === 'VICTORY') &&
            !stagesModalOpen &&
            !settingsModalOpen && (
              <div className="absolute inset-0 flex items-center justify-center p-4 bg-[#060c17]/78 backdrop-blur-[3px]">
                <div className="w-full max-w-md rounded-xl border border-white/12 bg-[#0f1a2e]/95 p-6 sm:p-8 text-center shadow-2xl">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-balance">
                    {status === 'VICTORY' ? t.victoryTitle : t.gameOver}
                  </h2>

                  {status === 'VICTORY' ? (
                    <>
                      <p className="text-sm font-bold text-amber-300 mb-1">
                        {t.coinsEarned(lastEarnedCoins, lives)}
                      </p>
                      <p className="text-sm font-medium text-emerald-300 mb-3">
                        {t.victorySubtitle}
                      </p>
                    </>
                  ) : (
                    isNewBest &&
                    score > 0 && (
                      <p className="text-sm font-semibold text-amber-300 mb-3">
                        {t.newBest}
                      </p>
                    )
                  )}

                  <div className="grid grid-cols-3 divide-x divide-white/10 rtl:divide-x-reverse py-4 my-5 border-y border-white/10">
                    <div className="px-2">
                      <div className="text-xs text-slate-400 mb-1">
                        {t.finalScore}
                      </div>
                      <div className="font-num text-2xl sm:text-3xl font-bold text-white">
                        {score}
                      </div>
                    </div>
                    <div className="px-2">
                      <div className="text-xs text-slate-400 mb-1">
                        {t.coins}
                      </div>
                      <div className="font-num text-2xl sm:text-3xl font-bold text-amber-300">
                        {coins}
                      </div>
                    </div>
                    <div className="px-2">
                      <div className="text-xs text-slate-400 mb-1">
                        {t.stage}
                      </div>
                      <div className="font-num text-2xl sm:text-3xl font-bold text-sky-300">
                        {stageNum}/{TOTAL_STAGES}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 mb-5">
                    {t.bestFull}:{' '}
                    <span className="font-num font-bold text-slate-200">
                      {bestScore}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={resetAndStartGame}
                    className="w-full sm:w-auto min-w-[200px] px-8 py-3.5 rounded-lg bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-slate-950 font-bold text-base transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1a2e] whitespace-nowrap cursor-pointer"
                  >
                    {t.playAgainBtn}
                  </button>
                </div>
              </div>
            )}

          {/* Stages Selector Overlay ("المراحل") */}
          {stagesModalOpen && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5 bg-[#060c17]/82 backdrop-blur-[4px]">
              <div className="w-full max-w-lg max-h-full flex flex-col rounded-xl border border-white/14 bg-[#0f1a2e]/98 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
                      {t.stagesModalTitle}
                    </h2>
                    <span className="text-xs sm:text-sm text-amber-300 font-semibold font-num whitespace-nowrap">
                      · {coins} {t.coins}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={closeStagesModal}
                    aria-label={t.close}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer shrink-0"
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

                <div className="px-5 pt-3 pb-5 overflow-y-auto">
                  <p className="text-xs sm:text-sm text-slate-300 mb-4">
                    {t.stagesModalHint}
                  </p>

                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                    {STAGES.map((cfg) => {
                      const isCurrent = cfg.stage === stageNum;
                      const isCompleted = completedStages.includes(cfg.stage);
                      const unlocked = isStageUnlocked(cfg.stage, completedStages);
                      return (
                        <button
                          key={cfg.stage}
                          type="button"
                          disabled={!unlocked}
                          aria-label={
                            unlocked
                              ? `${t.stageBanner(cfg.stage)} — ${cfg.pointsNeeded} ${t.ptsShort}`
                              : t.lockedStageAria(cfg.stage)
                          }
                          onClick={() => {
                            if (unlocked) startAtStage(cfg.stage);
                          }}
                          className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-lg border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                            !unlocked
                              ? 'border-white/5 bg-slate-950/70 text-slate-500 opacity-65 cursor-not-allowed'
                              : isCurrent
                              ? 'border-sky-400 bg-sky-500/20 text-white cursor-pointer'
                              : isCompleted
                              ? 'border-emerald-400/35 bg-emerald-500/10 text-slate-100 hover:bg-emerald-500/20 cursor-pointer'
                              : 'border-white/12 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:border-white/25 cursor-pointer'
                          }`}
                        >
                          {!unlocked ? (
                            <span
                              className="absolute top-1.5 end-1.5 text-slate-500"
                              aria-hidden="true"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect x="5" y="11" width="14" height="10" rx="2" />
                                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                              </svg>
                            </span>
                          ) : (
                            isCompleted && (
                              <span
                                className="absolute top-1.5 end-1.5 text-emerald-400"
                                aria-hidden="true"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            )
                          )}
                          <span className="font-num text-base sm:text-lg font-bold">
                            {cfg.stage}
                          </span>
                          <span
                            className={`font-num text-[11px] whitespace-nowrap ${
                              unlocked ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            {cfg.pointsNeeded} {t.ptsShort}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Overlay ("الإعدادات") */}
          {settingsModalOpen && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-[#060c17]/82 backdrop-blur-[4px]">
              <div className="w-full max-w-md rounded-xl border border-white/14 bg-[#0f1a2e]/98 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {t.settingsTitle}
                  </h2>
                  <button
                    type="button"
                    onClick={closeSettingsModal}
                    aria-label={t.close}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer shrink-0"
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

                <div className="divide-y divide-white/10 px-5">
                  {/* Music Toggle */}
                  <div className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <div className="text-sm sm:text-base font-semibold text-white">
                        {t.musicLabel}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {t.musicDesc}
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={musicEnabled}
                      onClick={toggleMusic}
                      className={`h-10 min-w-[84px] px-3.5 rounded-lg border text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 whitespace-nowrap shrink-0 cursor-pointer ${
                        musicEnabled
                          ? 'border-sky-400/50 bg-sky-500 text-slate-950 hover:bg-sky-400'
                          : 'border-white/15 bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {musicEnabled ? t.onLabel : t.offLabel}
                    </button>
                  </div>

                  {/* Sound Effects Toggle */}
                  <div className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <div className="text-sm sm:text-base font-semibold text-white">
                        {t.sfxLabel}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {t.sfxDesc}
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={sfxEnabled}
                      onClick={toggleSfx}
                      className={`h-10 min-w-[84px] px-3.5 rounded-lg border text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 whitespace-nowrap shrink-0 cursor-pointer ${
                        sfxEnabled
                          ? 'border-sky-400/50 bg-sky-500 text-slate-950 hover:bg-sky-400'
                          : 'border-white/15 bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {sfxEnabled ? t.onLabel : t.offLabel}
                    </button>
                  </div>

                  {/* Language Segmented Selector */}
                  <div className="flex items-center justify-between gap-4 py-4">
                    <div className="text-sm sm:text-base font-semibold text-white">
                      {t.languageLabel}
                    </div>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-white/10 shrink-0">
                      <button
                        type="button"
                        onClick={() => setLang('ar')}
                        className={`h-8 px-3 rounded-md text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          lang === 'ar'
                            ? 'bg-sky-500 text-slate-950'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        العربية
                      </button>
                      <button
                        type="button"
                        onClick={() => setLang('en')}
                        className={`h-8 px-3 rounded-md text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          lang === 'en'
                            ? 'bg-sky-500 text-slate-950'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls Bar */}
        <div className="shrink-0 flex items-center justify-between gap-3">
          <p className="hidden md:block text-xs text-slate-400">
            {t.controlsHint}
          </p>

          <div
            dir="ltr"
            className="w-full md:w-auto grid grid-cols-2 md:flex items-center gap-3"
          >
            <button
              type="button"
              aria-label={t.moveLeft}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setLeftHold(true);
              }}
              onPointerUp={() => setLeftHold(false)}
              onPointerCancel={() => setLeftHold(false)}
              onLostPointerCapture={() => setLeftHold(false)}
              className="h-12 md:h-11 md:w-28 rounded-lg border border-white/12 bg-[#111c30] hover:bg-[#182640] active:bg-sky-500/20 active:border-sky-400/50 text-slate-100 inline-flex items-center justify-center gap-2 transition-colors touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              type="button"
              aria-label={t.moveRight}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setRightHold(true);
              }}
              onPointerUp={() => setRightHold(false)}
              onPointerCancel={() => setRightHold(false)}
              onLostPointerCapture={() => setRightHold(false)}
              className="h-12 md:h-11 md:w-28 rounded-lg border border-white/12 bg-[#111c30] hover:bg-[#182640] active:bg-sky-500/20 active:border-sky-400/50 text-slate-100 inline-flex items-center justify-center gap-2 transition-colors touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
