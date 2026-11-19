/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

type Lang = 'ar' | 'en';
type GameStatus = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
type CollectibleShape = 'diamond' | 'star' | 'hex' | 'orb';

interface FallingItem {
  id: number;
  kind: 'point' | 'hazard';
  x: number;
  y: number;
  radius: number;
  speed: number;
  vx: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  coreColor: string;
  shape: CollectibleShape;
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
const POINT_VALUE = 10;
const BEST_SCORE_STORAGE_KEY = 'point_catcher_best_score_v1';
const MUTE_STORAGE_KEY = 'point_catcher_muted_v1';
const LANG_STORAGE_KEY = 'point_catcher_lang_v1';

const COLLECTIBLE_THEMES: Array<{
  color: string;
  coreColor: string;
  shape: CollectibleShape;
}> = [
  { color: '#10b981', coreColor: '#d1fae5', shape: 'diamond' },
  { color: '#38bdf8', coreColor: '#e0f2fe', shape: 'star' },
  { color: '#fbbf24', coreColor: '#fef3c7', shape: 'hex' },
  { color: '#a78bfa', coreColor: '#ede9fe', shape: 'orb' },
];

const COPY = {
  ar: {
    title: 'صياد النقاط',
    rule: 'التقط النقاط الملونة (+10) وتجنب العوائق الحمراء قبل نفاد الأرواح.',
    startBtn: 'ابدأ اللعب',
    playAgainBtn: 'العب مرة أخرى',
    resumeBtn: 'استئناف اللعب',
    restartBtn: 'إعادة البدء',
    score: 'النقاط',
    best: 'أفضل نتيجة',
    lives: 'الأرواح',
    gameOver: 'انتهت اللعبة',
    finalScore: 'النتيجة النهائية',
    newBest: 'رقم قياسي جديد!',
    paused: 'إيقاف مؤقت',
    safeLegend: 'نقطة آمنة (+10)',
    hazardLegend: 'عائق أحمر (-1 روح)',
    controlsHint: 'الأسهم أو A / D أو السحب للتحريك',
    moveLeft: 'تحريك لليسار',
    moveRight: 'تحريك لليمين',
    mute: 'كتم الصوت',
    unmute: 'تفعيل الصوت',
    pause: 'إيقاف مؤقت',
    resume: 'استئناف',
    langToggle: 'EN',
    langToggleAria: 'Switch to English',
  },
  en: {
    title: 'Point Catcher',
    rule: 'Catch colorful points (+10) and dodge red hazards before your lives run out.',
    startBtn: 'Start Game',
    playAgainBtn: 'Play Again',
    resumeBtn: 'Resume',
    restartBtn: 'Restart',
    score: 'Score',
    best: 'Best',
    lives: 'Lives',
    gameOver: 'Game Over',
    finalScore: 'Final Score',
    newBest: 'New Best Score!',
    paused: 'Paused',
    safeLegend: 'Safe Point (+10)',
    hazardLegend: 'Red Hazard (-1 Life)',
    controlsHint: 'Arrow keys, A / D, or drag to move',
    moveLeft: 'Move Left',
    moveRight: 'Move Right',
    mute: 'Mute Sound',
    unmute: 'Unmute Sound',
    pause: 'Pause Game',
    resume: 'Resume Game',
    langToggle: 'عربي',
    langToggleAria: 'التبديل إلى العربية',
  },
} as const;

class ArcadeAudio {
  private ctx: AudioContext | null = null;
  private muted = false;

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
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

  public playCatch(streak: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const baseFreq = scale[Math.min(streak, scale.length - 1)];

    const osc = ctx.createOscillator();
    const harm = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.18, now + 0.09);

    harm.type = 'triangle';
    harm.frequency.setValueAtTime(baseFreq * 1.5, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.15);

    const harmGain = ctx.createGain();
    harmGain.gain.setValueAtTime(0.03, now);
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

  public playHazardHit(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(72, now + 0.22);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.exponentialRampToValueAtTime(160, now + 0.22);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.24);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
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

export default function App() {
  const [lang, setLang] = useState<Lang>(() => readStoredLang());
  const [status, setStatus] = useState<GameStatus>('START');
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() =>
    readStoredNumber(BEST_SCORE_STORAGE_KEY, 0)
  );
  const [lives, setLives] = useState<number>(MAX_LIVES);
  const [muted, setMuted] = useState<boolean>(() =>
    readStoredBoolean(MUTE_STORAGE_KEY, false)
  );
  const [isNewBest, setIsNewBest] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<ArcadeAudio>(new ArcadeAudio());

  const statusRef = useRef<GameStatus>('START');
  const scoreRef = useRef<number>(0);
  const bestScoreRef = useRef<number>(bestScore);
  const livesRef = useRef<number>(MAX_LIVES);
  const streakRef = useRef<number>(0);

  // Mutable simulation state kept in a ref for jitter-free 60fps canvas animation
  const simRef = useRef({
    width: 800,
    height: 520,
    playerX: 400,
    playerVx: 0,
    playerWidth: 94,
    playerHeight: 22,
    playerY: 468,
    playerBounce: 0,
    playerGlowColor: '#38bdf8',
    playerGlowAlpha: 0,
    invulnTimer: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
    hitFlashAlpha: 0,
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

  // Sync HTML dir/lang attributes and localStorage
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore storage failures
    }
  }, [lang]);

  // Sync audio mute state
  useEffect(() => {
    audioRef.current.setMuted(muted);
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
    } catch {
      // Ignore storage failures
    }
  }, [muted]);

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

  const resetAndStartGame = useCallback(() => {
    const sim = simRef.current;
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
    sim.spawnTimer = 0.25;
    sim.lastHazardX = -999;
    sim.input.pointerActive = false;
    sim.input.pointerId = null;
    sim.input.leftBtn = false;
    sim.input.rightBtn = false;

    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    streakRef.current = 0;
    statusRef.current = 'PLAYING';

    setScore(0);
    setLives(MAX_LIVES);
    setIsNewBest(false);
    setStatus('PLAYING');

    audioRef.current.playStart();
  }, []);

  const togglePause = useCallback(() => {
    if (statusRef.current === 'PLAYING') {
      statusRef.current = 'PAUSED';
      setStatus('PAUSED');
    } else if (statusRef.current === 'PAUSED') {
      statusRef.current = 'PLAYING';
      setStatus('PLAYING');
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  }, []);

  // Auto-pause if the player switches tabs mid-game
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

  // Keyboard controls (supports both English and Arabic physical key layouts via e.code)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();

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
        toggleMute();
      } else if (code === 'Space' || code === 'Enter') {
        if (statusRef.current === 'START' || statusRef.current === 'GAME_OVER') {
          const activeTag = document.activeElement?.tagName;
          if (activeTag !== 'BUTTON') {
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
  }, [resetAndStartGame, toggleMute, togglePause]);

  // Responsive HiDPI Canvas sizing via ResizeObserver
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
      sim.playerWidth = Math.max(74, Math.min(108, Math.round(w * 0.145)));
      sim.playerHeight = 20;
      sim.playerY = h - Math.max(42, Math.min(58, Math.round(h * 0.095)));
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

  // Main 60fps HTML5 Canvas requestAnimationFrame loop
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
      const currentScore = scoreRef.current;

      // Smooth difficulty ramp (0.0 -> 1.0 over 0..1000 pts, gentle tail beyond)
      const diff = Math.min(1.25, currentScore / 900);
      const hazardChance = Math.min(0.39, 0.22 + diff * 0.14);
      const isHazard = Math.random() < hazardChance;

      const margin = Math.max(30, sim.playerWidth * 0.42);
      const usableW = Math.max(80, sim.width - margin * 2);

      // Fair placement: avoid stacking directly on top of another recent top item
      let spawnX = margin + Math.random() * usableW;
      for (let attempt = 0; attempt < 6; attempt++) {
        const candidate = margin + Math.random() * usableW;
        const tooCloseToRecentTop = sim.items.some(
          (item) => item.y < 105 && Math.abs(item.x - candidate) < 62
        );
        const tooCloseToHazard =
          isHazard && Math.abs(candidate - sim.lastHazardX) < 54;
        if (!tooCloseToRecentTop && !tooCloseToHazard) {
          spawnX = candidate;
          break;
        }
      }

      if (isHazard) {
        sim.lastHazardX = spawnX;
      }

      const baseSpeed = 165 + diff * 155;
      const speedVariance = isHazard
        ? 0.92 + Math.random() * 0.34
        : 0.84 + Math.random() * 0.42;
      // Scale fall speed subtly to arena height so small/tall viewports feel consistent
      const heightFactor = Math.max(0.82, Math.min(1.22, sim.height / 540));
      const speed = baseSpeed * speedVariance * heightFactor;

      const theme =
        COLLECTIBLE_THEMES[
          Math.floor(Math.random() * COLLECTIBLE_THEMES.length)
        ];

      const radius = isHazard
        ? Math.max(15, Math.min(19, sim.width * 0.024))
        : Math.max(13, Math.min(17, sim.width * 0.021));

      sim.items.push({
        id: sim.nextId++,
        kind: isHazard ? 'hazard' : 'point',
        x: spawnX,
        y: -radius - 10,
        radius,
        speed,
        vx: (Math.random() - 0.5) * (isHazard ? 18 : 14),
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() > 0.5 ? 1 : -1) * (isHazard ? 1.8 : 1.1),
        color: isHazard ? '#ef4444' : theme.color,
        coreColor: isHazard ? '#fecaca' : theme.coreColor,
        shape: theme.shape,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    };

    const update = (dt: number) => {
      const sim = simRef.current;

      // Always drift ambient stars gently so start/game-over screens feel alive
      const starSpeedMul = statusRef.current === 'PLAYING' ? 1 : 0.45;
      for (const s of sim.stars) {
        s.y += s.speed * starSpeedMul * dt;
        if (s.y > sim.height + 4) {
          s.y = -4;
          s.x = Math.random() * sim.width;
        }
      }

      if (statusRef.current !== 'PLAYING') {
        // Still settle any leftover particles smoothly on Game Over
        if (statusRef.current === 'GAME_OVER') {
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
      const maxSpeed = Math.max(540, sim.width * 0.92);

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

      // Timers & feedback animations
      if (sim.invulnTimer > 0) sim.invulnTimer = Math.max(0, sim.invulnTimer - dt);
      if (sim.playerBounce > 0) sim.playerBounce = Math.max(0, sim.playerBounce - dt * 5.2);
      if (sim.playerGlowAlpha > 0)
        sim.playerGlowAlpha = Math.max(0, sim.playerGlowAlpha - dt * 2.8);
      if (sim.shakeTimer > 0) sim.shakeTimer = Math.max(0, sim.shakeTimer - dt);
      if (sim.hitFlashAlpha > 0)
        sim.hitFlashAlpha = Math.max(0, sim.hitFlashAlpha - dt * 2.5);

      // Spawning cadence scales fairly with score
      const diff = Math.min(1.25, scoreRef.current / 900);
      const spawnInterval = Math.max(0.36, 0.9 - diff * 0.43);
      sim.spawnTimer -= dt;
      if (sim.spawnTimer <= 0) {
        spawnFallingObject();
        sim.spawnTimer = spawnInterval * (0.82 + Math.random() * 0.36);
      }

      // Update falling items & check collisions with the catcher
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

        // Gentle wall bounce
        if (item.x < item.radius + 10) {
          item.x = item.radius + 10;
          item.vx = Math.abs(item.vx);
        } else if (item.x > sim.width - item.radius - 10) {
          item.x = sim.width - item.radius - 10;
          item.vx = -Math.abs(item.vx);
        }

        // Remove if below arena
        if (item.y - item.radius > sim.height + 24) {
          if (item.kind === 'point') {
            streakRef.current = 0;
          }
          sim.items.splice(i, 1);
          continue;
        }

        // Circle vs rounded catcher rect collision
        // Slightly generous for points, slightly forgiving for hazards
        const hitPad = item.kind === 'point' ? 4 : -4;
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
        const effectiveRadius = Math.max(6, item.radius + (item.kind === 'hazard' ? -2 : 2));

        if (dx * dx + dy * dy <= effectiveRadius * effectiveRadius) {
          if (item.kind === 'point') {
            sim.items.splice(i, 1);
            const nextScore = scoreRef.current + POINT_VALUE;
            scoreRef.current = nextScore;
            setScore(nextScore);

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

            audioRef.current.playCatch(streakRef.current);
            streakRef.current = Math.min(streakRef.current + 1, 10);

            sim.playerBounce = 1;
            sim.playerGlowColor = item.color;
            sim.playerGlowAlpha = 1;

            spawnBurst(item.x, item.y, item.color, 14, 1);
            spawnBurst(item.x, item.y, '#ffffff', 5, 0.7);
            sim.floatingTexts.push({
              x: item.x,
              y: item.y - 10,
              vy: -56,
              text: `+${POINT_VALUE}`,
              color: item.coreColor,
              life: 0.65,
              maxLife: 0.65,
            });
          } else {
            // Hazard collision
            sim.items.splice(i, 1);
            if (sim.invulnTimer <= 0) {
              const nextLives = Math.max(0, livesRef.current - 1);
              livesRef.current = nextLives;
              streakRef.current = 0;
              setLives(nextLives);

              sim.shakeTimer = 0.24;
              sim.shakeIntensity = 7;
              sim.hitFlashAlpha = 0.34;
              sim.invulnTimer = 1.1;

              spawnBurst(item.x, item.y, '#ef4444', 18, 1.2);
              spawnBurst(item.x, item.y, '#fca5a5', 8, 0.85);
              sim.floatingTexts.push({
                x: item.x,
                y: item.y - 12,
                vy: -48,
                text: '-1',
                color: '#fca5a5',
                life: 0.75,
                maxLife: 0.75,
              });

              if (nextLives <= 0) {
                statusRef.current = 'GAME_OVER';
                setStatus('GAME_OVER');
                audioRef.current.playGameOver();
              } else {
                audioRef.current.playHazardHit();
              }
            }
          }
        }
      }

      // Update particles
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

      // Update floating texts
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

    const drawCollectible = (item: FallingItem) => {
      const r = item.radius;
      const pulse = 1 + Math.sin(item.pulsePhase) * 0.06;

      ctx.save();
      ctx.translate(item.x, item.y);

      // Soft outer halo
      const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.9);
      glow.addColorStop(0, `${item.color}55`);
      glow.addColorStop(1, `${item.color}00`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(item.rotation * 0.6);
      ctx.scale(pulse, pulse);

      ctx.fillStyle = item.color;
      ctx.strokeStyle = item.coreColor;
      ctx.lineWidth = 1.8;

      if (item.shape === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.12);
        ctx.lineTo(r * 0.92, 0);
        ctx.lineTo(0, r * 1.12);
        ctx.lineTo(-r * 0.92, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (item.shape === 'star') {
        ctx.beginPath();
        const spikes = 4;
        for (let i = 0; i < spikes * 2; i++) {
          const rad = i % 2 === 0 ? r * 1.18 : r * 0.48;
          const ang = (i * Math.PI) / spikes - Math.PI / 2;
          const px = Math.cos(ang) * rad;
          const py = Math.sin(ang) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (item.shape === 'hex') {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI) / 3 - Math.PI / 6;
          const px = Math.cos(ang) * r;
          const py = Math.sin(ang) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Crisp bright inner core specular highlight
      ctx.fillStyle = item.coreColor;
      ctx.beginPath();
      ctx.arc(-r * 0.18, -r * 0.18, r * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawHazard = (item: FallingItem) => {
      const r = item.radius;
      const pulse = 1 + Math.sin(item.pulsePhase * 1.4) * 0.08;

      ctx.save();
      ctx.translate(item.x, item.y);

      // Crimson warning ring
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.28 + Math.sin(item.pulsePhase * 1.4) * 0.14})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.38 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating jagged spike shell
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

      // Dark crimson core
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.64, 0, Math.PI * 2);
      ctx.fillStyle = '#7f1d1d';
      ctx.fill();

      // Unmistakable high-contrast white 'X' icon (non-color-only affordance)
      const cross = r * 0.34;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-cross, -cross);
      ctx.lineTo(cross, cross);
      ctx.moveTo(cross, -cross);
      ctx.lineTo(-cross, cross);
      ctx.stroke();

      ctx.restore();
    };

    const drawPlayer = () => {
      const sim = simRef.current;
      // Blink cleanly during brief post-hit invulnerability
      if (sim.invulnTimer > 0 && Math.floor(sim.invulnTimer * 16) % 2 === 0) {
        return;
      }

      const w = sim.playerWidth;
      const h = sim.playerHeight;
      const tilt = Math.max(-0.14, Math.min(0.14, sim.playerVx / 3200));
      const scaleX = 1 + sim.playerBounce * 0.1;
      const scaleY = 1 - sim.playerBounce * 0.14;

      ctx.save();
      ctx.translate(sim.playerX, sim.playerY);
      ctx.rotate(tilt);
      ctx.scale(scaleX, scaleY);

      // Subtle under-glow thruster field
      const underGlow = ctx.createRadialGradient(0, h * 0.4, 6, 0, h * 0.4, w * 0.72);
      underGlow.addColorStop(
        0,
        sim.playerGlowAlpha > 0.05
          ? `${sim.playerGlowColor}66`
          : 'rgba(56, 189, 248, 0.28)'
      );
      underGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = underGlow;
      ctx.beginPath();
      ctx.ellipse(0, h * 0.5, w * 0.72, h * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main catcher hull (sleek curved metallic tray)
      const hullGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      hullGrad.addColorStop(0, '#f8fafc');
      hullGrad.addColorStop(0.45, '#cbd5e1');
      hullGrad.addColorStop(1, '#64748b');

      drawRoundedRectPath(ctx, -w / 2, -h / 2, w, h, h / 2);
      ctx.fillStyle = hullGrad;
      ctx.fill();

      // Luminous top energy receiver rim
      const rimWidth = w * 0.72;
      const rimColor =
        sim.playerGlowAlpha > 0.05 ? sim.playerGlowColor : '#38bdf8';
      drawRoundedRectPath(ctx, -rimWidth / 2, -h / 2 + 2.5, rimWidth, 5, 2.5);
      ctx.fillStyle = rimColor;
      ctx.fill();

      // Side bumper accents
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-w / 2 + 10, 0, 3.2, 0, Math.PI * 2);
      ctx.arc(w / 2 - 10, 0, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const render = () => {
      const sim = simRef.current;
      const { width, height } = sim;

      ctx.save();

      // Screen shake on hazard hit
      if (sim.shakeTimer > 0) {
        const mag = sim.shakeIntensity * (sim.shakeTimer / 0.24);
        ctx.translate(
          (Math.random() - 0.5) * mag * 2,
          (Math.random() - 0.5) * mag * 1.4
        );
      }

      // 60% Dominant Velvet Midnight Arena Surface
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#070f1e');
      bgGrad.addColorStop(0.55, '#0b1629');
      bgGrad.addColorStop(1, '#101f38');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(-12, -12, width + 24, height + 24);

      // Subtle architectural arena grid lines
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

      // Ambient stars
      for (const s of sim.stars) {
        ctx.fillStyle = `rgba(226, 232, 240, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Subtle bottom player rail track line
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(20, sim.playerY + sim.playerHeight / 2 + 8);
      ctx.lineTo(width - 20, sim.playerY + sim.playerHeight / 2 + 8);
      ctx.stroke();

      // Falling collectibles & hazards
      for (const item of sim.items) {
        if (item.kind === 'point') {
          drawCollectible(item);
        } else {
          drawHazard(item);
        }
      }

      // Catcher character
      drawPlayer();

      // Particle bursts
      for (const p of sim.particles) {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Floating score / damage callouts
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 16px "Segoe UI", system-ui, sans-serif';
      for (const ft of sim.floatingTexts) {
        const alpha = Math.max(0, ft.life / ft.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.globalAlpha = 1;

      // Brief crimson edge vignette on hazard hit
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

  // Direct touch/mouse drag handlers on the Canvas
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

  // On-screen directional button handlers
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
      {/* Top HUD Bar */}
      <header className="w-full border-b border-white/10 bg-[#0b1424]/95 shrink-0">
        <div className="mx-auto max-w-[1040px] px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-6">
          {/* Title Wordmark (shown on sm+ so narrow mobile HUD never overflows) */}
          <div className="hidden sm:block text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            {t.title}
          </div>

          {/* Core Metrics: Clean unboxed tabular readouts with hairline separators */}
          <div
            className="flex items-center gap-2.5 sm:gap-6 min-w-0"
            aria-live="polite"
          >
            <div className="flex items-baseline gap-1 sm:gap-2 whitespace-nowrap">
              <span className="text-xs sm:text-sm text-slate-400">
                {t.score}
              </span>
              <span className="font-num text-sm sm:text-xl font-bold text-white">
                {score}
              </span>
            </div>

            <div className="h-4 sm:h-5 w-px bg-white/10 shrink-0" aria-hidden="true" />

            <div className="flex items-baseline gap-1 sm:gap-2 whitespace-nowrap">
              <span className="text-xs sm:text-sm text-slate-400">
                {t.best}
              </span>
              <span className="font-num text-sm sm:text-xl font-bold text-amber-300">
                {bestScore}
              </span>
            </div>

            <div className="h-4 sm:h-5 w-px bg-white/10 shrink-0" aria-hidden="true" />

            <div
              className="flex items-center gap-1.5 whitespace-nowrap"
              aria-label={`${t.lives}: ${lives}/${MAX_LIVES}`}
            >
              <span className="hidden sm:inline text-sm text-slate-400">
                {t.lives}
              </span>
              <div className="flex items-center gap-1" aria-hidden="true">
                {Array.from({ length: MAX_LIVES }).map((_, idx) => {
                  const active = idx < lives;
                  return (
                    <svg
                      key={idx}
                      viewBox="0 0 24 24"
                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-150 ${
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
              <span className="font-num text-xs sm:text-sm font-semibold text-slate-300">
                {lives}/{MAX_LIVES}
              </span>
            </div>
          </div>

          {/* Utility Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {(status === 'PLAYING' || status === 'PAUSED') && (
              <button
                type="button"
                onClick={togglePause}
                aria-label={status === 'PAUSED' ? t.resume : t.pause}
                title={status === 'PAUSED' ? t.resume : t.pause}
                className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer shrink-0"
              >
                {status === 'PAUSED' ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
                  </svg>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? t.unmute : t.mute}
              title={muted ? t.unmute : t.mute}
              aria-pressed={muted}
              className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer shrink-0"
            >
              {muted ? (
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-sky-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={toggleLang}
              aria-label={t.langToggleAria}
              className="h-10 px-3 inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.langToggle}
            </button>
          </div>
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
          {status === 'START' && (
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-[#060c17]/72 backdrop-blur-[3px]">
              <div className="w-full max-w-md rounded-xl border border-white/12 bg-[#0f1a2e]/95 p-6 sm:p-8 text-center shadow-2xl">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3 text-balance">
                  {t.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                  {t.rule}
                </p>

                {/* Clean visual legend (no pill clutter) */}
                <div className="flex items-center justify-center gap-6 py-3 mb-6 border-y border-white/10 text-xs sm:text-sm text-slate-300">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 text-emerald-400 shrink-0"
                      aria-hidden="true"
                    >
                      <polygon
                        points="12,2 21,12 12,22 3,12"
                        fill="currentColor"
                        stroke="#d1fae5"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <span>{t.safeLegend}</span>
                  </div>

                  <div className="h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />

                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 text-red-500 shrink-0"
                      aria-hidden="true"
                    >
                      <polygon
                        points="12,1 14.8,6.2 20.5,4.5 18.2,10 23,12 18.2,14 20.5,19.5 14.8,17.8 12,23 9.2,17.8 3.5,19.5 5.8,14 1,12 5.8,10 3.5,4.5 9.2,6.2"
                        fill="currentColor"
                      />
                      <path
                        d="M9.5 9.5l5 5m0-5l-5 5"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span>{t.hazardLegend}</span>
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
          {status === 'PAUSED' && (
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

          {/* Game Over Overlay */}
          {status === 'GAME_OVER' && (
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-[#060c17]/78 backdrop-blur-[3px]">
              <div className="w-full max-w-md rounded-xl border border-white/12 bg-[#0f1a2e]/95 p-6 sm:p-8 text-center shadow-2xl">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {t.gameOver}
                </h2>

                {isNewBest && score > 0 && (
                  <p className="text-sm font-semibold text-amber-300 mb-4">
                    {t.newBest}
                  </p>
                )}

                <div className="grid grid-cols-2 divide-x divide-white/10 rtl:divide-x-reverse py-4 my-5 border-y border-white/10">
                  <div className="px-3">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">
                      {t.finalScore}
                    </div>
                    <div className="font-num text-3xl sm:text-4xl font-bold text-white">
                      {score}
                    </div>
                  </div>
                  <div className="px-3">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">
                      {t.best}
                    </div>
                    <div className="font-num text-3xl sm:text-4xl font-bold text-amber-300">
                      {bestScore}
                    </div>
                  </div>
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
        </div>

        {/* Bottom Controls Bar: Always physical Left / Right buttons + keyboard/touch hint */}
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
