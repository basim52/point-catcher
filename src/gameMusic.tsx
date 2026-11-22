import React, { useEffect } from 'react';

export type GameMusicTrack =
  | 'hub'
  | 'arrow-escape'
  | 'arrow-mosaic'
  | 'neon-2048'
  | 'neon-snake'
  | 'apple-catch'
  | 'fruit-merge'
  | 'brick-breaker';

interface TrackSpec {
  stepMs: number;
  leadWave: OscillatorType;
  bassWave: OscillatorType;
  leadVol: number;
  bassVol: number;
  padVol: number;
  hatVol: number;
  leadNotes: number[]; // Hz (0 = rest)
  bassNotes: number[]; // Hz (0 = rest)
  padChords: number[][]; // 1 chord per 8 steps
}

// Procedural looping Web Audio tracks — each mini-game has its own distinct musical personality
const TRACK_SPECS: Record<GameMusicTrack, TrackSpec> = {
  // Subtle neon arcade lounge theme for Games Hub
  hub: {
    stepMs: 280,
    leadWave: 'sine',
    bassWave: 'triangle',
    leadVol: 0.032,
    bassVol: 0.036,
    padVol: 0.015,
    hatVol: 0,
    leadNotes: [
      440.0, 0, 523.25, 0, 659.25, 0, 587.33, 523.25,
      349.23, 0, 440.0, 0, 523.25, 0, 493.88, 0,
      523.25, 0, 659.25, 0, 783.99, 0, 659.25, 587.33,
      392.0, 0, 493.88, 0, 587.33, 0, 493.88, 0,
    ],
    bassNotes: [
      110.0, 0, 0, 0, 110.0, 0, 164.81, 0,
      87.31, 0, 0, 0, 87.31, 0, 130.81, 0,
      130.81, 0, 0, 0, 130.81, 0, 196.0, 0,
      98.0, 0, 0, 0, 98.0, 0, 146.83, 0,
    ],
    padChords: [
      [220.0, 261.63, 329.63],
      [174.61, 220.0, 261.63],
      [261.63, 329.63, 392.0],
      [196.0, 246.94, 293.66],
    ],
  },

  // Calm crystalline puzzle pulse for Arrow Escape
  'arrow-escape': {
    stepMs: 265,
    leadWave: 'triangle',
    bassWave: 'sine',
    leadVol: 0.042,
    bassVol: 0.045,
    padVol: 0.016,
    hatVol: 0.008,
    leadNotes: [
      349.23, 440.0, 523.25, 659.25, 523.25, 440.0, 587.33, 0,
      293.66, 349.23, 440.0, 523.25, 440.0, 349.23, 523.25, 0,
      466.16, 587.33, 698.46, 587.33, 523.25, 440.0, 466.16, 0,
      523.25, 392.0, 440.0, 587.33, 523.25, 0, 392.0, 0,
    ],
    bassNotes: [
      87.31, 0, 0, 130.81, 0, 0, 87.31, 0,
      73.42, 0, 0, 110.0, 0, 0, 73.42, 0,
      116.54, 0, 0, 174.61, 0, 0, 116.54, 0,
      130.81, 0, 0, 196.0, 0, 0, 98.0, 0,
    ],
    padChords: [
      [174.61, 220.0, 261.63, 329.63],
      [146.83, 174.61, 220.0, 261.63],
      [233.08, 293.66, 349.23],
      [261.63, 329.63, 392.0],
    ],
  },

  // Sparkling rhythmic kaleidoscope synth pulse for Arrow Mosaic (300–547 arrows)
  'arrow-mosaic': {
    stepMs: 225,
    leadWave: 'sine',
    bassWave: 'triangle',
    leadVol: 0.042,
    bassVol: 0.044,
    padVol: 0.017,
    hatVol: 0.01,
    leadNotes: [
      523.25, 0, 659.25, 783.99, 659.25, 0, 587.33, 523.25,
      440.0, 0, 523.25, 659.25, 523.25, 0, 493.88, 440.0,
      349.23, 440.0, 523.25, 0, 659.25, 587.33, 523.25, 0,
      392.0, 493.88, 587.33, 659.25, 587.33, 0, 493.88, 0,
    ],
    bassNotes: [
      130.81, 0, 0, 196.0, 130.81, 0, 164.81, 0,
      110.0, 0, 0, 164.81, 110.0, 0, 130.81, 0,
      87.31, 0, 0, 130.81, 87.31, 0, 110.0, 0,
      98.0, 0, 0, 146.83, 98.0, 0, 123.47, 0,
    ],
    padChords: [
      [261.63, 329.63, 392.0],
      [220.0, 261.63, 329.63],
      [174.61, 220.0, 261.63],
      [196.0, 246.94, 293.66],
    ],
  },

  // Smooth cosmic synthwave chill groove for Neon 2048
  'neon-2048': {
    stepMs: 245,
    leadWave: 'sine',
    bassWave: 'triangle',
    leadVol: 0.044,
    bassVol: 0.045,
    padVol: 0.017,
    hatVol: 0.01,
    leadNotes: [
      329.63, 0, 493.88, 587.33, 659.25, 0, 587.33, 493.88,
      523.25, 0, 659.25, 783.99, 659.25, 0, 587.33, 493.88,
      392.0, 0, 493.88, 587.33, 783.99, 0, 659.25, 587.33,
      587.33, 0, 739.99, 659.25, 587.33, 493.88, 440.0, 0,
    ],
    bassNotes: [
      82.41, 0, 164.81, 0, 82.41, 0, 123.47, 0,
      130.81, 0, 196.0, 0, 130.81, 0, 164.81, 0,
      98.0, 0, 196.0, 0, 98.0, 0, 146.83, 0,
      146.83, 0, 220.0, 0, 146.83, 0, 110.0, 0,
    ],
    padChords: [
      [164.81, 196.0, 246.94, 293.66],
      [130.81, 164.81, 196.0, 246.94],
      [196.0, 246.94, 293.66],
      [146.83, 185.0, 220.0],
    ],
  },

  // Punchy retro-neon arcade chiptune beat for Neon Snake
  'neon-snake': {
    stepMs: 188,
    leadWave: 'square',
    bassWave: 'triangle',
    leadVol: 0.026,
    bassVol: 0.052,
    padVol: 0.011,
    hatVol: 0.015,
    leadNotes: [
      293.66, 0, 349.23, 440.0, 523.25, 0, 440.0, 349.23,
      466.16, 0, 587.33, 523.25, 466.16, 440.0, 392.0, 0,
      329.63, 0, 392.0, 523.25, 587.33, 0, 523.25, 440.0,
      440.0, 0, 554.37, 659.25, 587.33, 523.25, 440.0, 0,
    ],
    bassNotes: [
      73.42, 146.83, 73.42, 0, 110.0, 0, 73.42, 146.83,
      116.54, 0, 174.61, 0, 116.54, 0, 116.54, 174.61,
      130.81, 0, 196.0, 0, 130.81, 0, 130.81, 196.0,
      110.0, 0, 164.81, 0, 110.0, 138.59, 164.81, 0,
    ],
    padChords: [
      [146.83, 174.61, 220.0],
      [116.54, 146.83, 174.61],
      [130.81, 164.81, 196.0],
      [110.0, 138.59, 164.81],
    ],
  },

  // Energetic, cheerful orchard arcade bounce for Apple Catch
  'apple-catch': {
    stepMs: 176,
    leadWave: 'triangle',
    bassWave: 'triangle',
    leadVol: 0.048,
    bassVol: 0.052,
    padVol: 0.014,
    hatVol: 0.015,
    leadNotes: [
      392.0, 493.88, 587.33, 0, 783.99, 0, 659.25, 587.33,
      739.99, 0, 587.33, 440.0, 587.33, 659.25, 587.33, 0,
      659.25, 0, 783.99, 659.25, 587.33, 493.88, 392.0, 493.88,
      523.25, 659.25, 783.99, 659.25, 587.33, 0, 523.25, 0,
    ],
    bassNotes: [
      98.0, 0, 196.0, 0, 146.83, 0, 196.0, 0,
      146.83, 0, 220.0, 0, 110.0, 0, 146.83, 0,
      164.81, 0, 246.94, 0, 123.47, 0, 164.81, 0,
      130.81, 0, 196.0, 0, 146.83, 0, 196.0, 0,
    ],
    padChords: [
      [196.0, 246.94, 293.66],
      [146.83, 185.0, 220.0],
      [164.81, 196.0, 246.94],
      [130.81, 164.81, 196.0],
    ],
  },

  // Warm sunny marimba bounce for Fruit Merge
  'fruit-merge': {
    stepMs: 215,
    leadWave: 'sine',
    bassWave: 'triangle',
    leadVol: 0.046,
    bassVol: 0.044,
    padVol: 0.014,
    hatVol: 0.009,
    leadNotes: [
      523.25, 659.25, 783.99, 0, 659.25, 587.33, 523.25, 0,
      440.0, 523.25, 659.25, 0, 587.33, 523.25, 440.0, 0,
      349.23, 440.0, 523.25, 659.25, 587.33, 0, 523.25, 440.0,
      392.0, 493.88, 587.33, 0, 659.25, 587.33, 493.88, 0,
    ],
    bassNotes: [
      130.81, 0, 196.0, 0, 130.81, 0, 164.81, 0,
      110.0, 0, 164.81, 0, 110.0, 0, 130.81, 0,
      87.31, 0, 130.81, 0, 87.31, 0, 110.0, 0,
      98.0, 0, 146.83, 0, 98.0, 0, 123.47, 0,
    ],
    padChords: [
      [261.63, 329.63, 392.0],
      [220.0, 261.63, 329.63],
      [174.61, 220.0, 261.63],
      [196.0, 246.94, 293.66],
    ],
  },

  // Energetic neon synthwave arpeggio drive for Neon Brick Breaker
  'brick-breaker': {
    stepMs: 170,
    leadWave: 'triangle',
    bassWave: 'sawtooth',
    leadVol: 0.044,
    bassVol: 0.026,
    padVol: 0.015,
    hatVol: 0.014,
    leadNotes: [
      523.25, 0, 659.25, 783.99, 1046.5, 0, 783.99, 659.25,
      587.33, 0, 739.99, 880.0, 739.99, 0, 587.33, 440.0,
      493.88, 0, 587.33, 783.99, 987.77, 0, 783.99, 587.33,
      440.0, 523.25, 659.25, 783.99, 659.25, 0, 523.25, 0,
    ],
    bassNotes: [
      130.81, 0, 130.81, 0, 196.0, 0, 130.81, 164.81,
      146.83, 0, 146.83, 0, 220.0, 0, 146.83, 185.0,
      123.47, 0, 123.47, 0, 196.0, 0, 123.47, 146.83,
      110.0, 0, 110.0, 0, 164.81, 0, 130.81, 0,
    ],
    padChords: [
      [261.63, 329.63, 392.0],
      [293.66, 369.99, 440.0],
      [246.94, 293.66, 392.0],
      [220.0, 261.63, 329.63],
    ],
  },
};

class GameMusicEngine {
  private ctx: AudioContext | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private timerId: number | null = null;
  private activeTrack: GameMusicTrack | null = null;
  private stepIdx = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AC) {
        this.ctx = new AC();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && !this.noiseBuf) {
      const len = Math.floor(this.ctx.sampleRate * 0.05);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      }
      this.noiseBuf = buf;
    }
    return this.ctx;
  }

  public unlock(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public start(track: GameMusicTrack): void {
    if (this.activeTrack === track && this.timerId !== null) {
      this.unlock();
      return;
    }
    this.stop();
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.activeTrack = track;
    this.stepIdx = 0;
    const spec = TRACK_SPECS[track];

    const playStep = () => {
      if (this.activeTrack !== track) return;
      const audioCtx = this.ensureContext();
      if (!audioCtx || audioCtx.state !== 'running') return;

      const now = audioCtx.currentTime;
      const stepSec = spec.stepMs / 1000;
      const step = this.stepIdx % spec.leadNotes.length;

      // 1) Lead melody note
      const leadFreq = spec.leadNotes[step];
      if (leadFreq > 0) {
        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();
        osc.type = spec.leadWave;
        osc.frequency.setValueAtTime(leadFreq, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(
          spec.leadWave === 'square' ? 1450 : 2800,
          now
        );
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(spec.leadVol, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(
          0.0008,
          now + Math.max(0.08, stepSec * 0.92)
        );
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + stepSec + 0.02);
      }

      // 2) Warm bassline note
      const bassFreq = spec.bassNotes[step];
      if (bassFreq > 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = spec.bassWave;
        osc.frequency.setValueAtTime(bassFreq, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(spec.bassVol, now + 0.018);
        gain.gain.exponentialRampToValueAtTime(
          0.0008,
          now + Math.max(0.11, stepSec * 1.35)
        );
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + stepSec * 1.45);
      }

      // 3) Soft harmonic pad chord every 8 steps
      if (step % 8 === 0 && spec.padVol > 0) {
        const chordIdx = Math.floor(step / 8) % spec.padChords.length;
        const chord = spec.padChords[chordIdx];
        const padDur = stepSec * 7.6;
        for (const freq of chord) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(
            spec.padVol / chord.length,
            now + 0.14
          );
          gain.gain.exponentialRampToValueAtTime(0.0005, now + padDur);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + padDur + 0.04);
        }
      }

      // 4) Light rhythmic hi-hat pulse on off-beats
      if (spec.hatVol > 0 && step % 2 === 1 && this.noiseBuf) {
        const src = audioCtx.createBufferSource();
        const hp = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();
        src.buffer = this.noiseBuf;
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(6200, now);
        gain.gain.setValueAtTime(spec.hatVol, now);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.042);
        src.connect(hp);
        hp.connect(gain);
        gain.connect(audioCtx.destination);
        src.start(now);
      }

      this.stepIdx += 1;
    };

    playStep();
    this.timerId = window.setInterval(playStep, spec.stepMs);
  }

  public stop(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.activeTrack = null;
  }
}

const sharedMusicEngine = new GameMusicEngine();

/**
 * Plays a unique looping soundtrack for the active game whenever `active` is true,
 * automatically unlocking Web Audio on user interaction and stopping cleanly on unmount.
 */
export function useGameMusic(track: GameMusicTrack, active: boolean): void {
  useEffect(() => {
    if (!active) {
      sharedMusicEngine.stop();
      return;
    }

    sharedMusicEngine.start(track);

    const handleUnlock = () => {
      sharedMusicEngine.unlock();
    };
    window.addEventListener('pointerdown', handleUnlock, { passive: true });
    window.addEventListener('keydown', handleUnlock, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
      sharedMusicEngine.stop();
    };
  }, [track, active]);
}

export function MusicToggleButton({
  enabled,
  onToggle,
  lang,
}: {
  enabled: boolean;
  onToggle: () => void;
  lang: 'ar' | 'en';
}) {
  const label =
    lang === 'ar'
      ? enabled
        ? 'إيقاف الموسيقى'
        : 'تشغيل الموسيقى'
      : enabled
      ? 'Mute Music'
      : 'Unmute Music';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className={`h-8 w-8 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg border transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
        enabled
          ? 'border-sky-400/40 bg-sky-500/15 hover:bg-sky-500/25 text-sky-200'
          : 'border-white/12 bg-slate-900/80 hover:bg-slate-800 text-slate-500'
      }`}
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
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
        {!enabled && <line x1="3" y1="3" x2="21" y2="21" stroke="#fb7185" strokeWidth="2.3" />}
      </svg>
    </button>
  );
}
