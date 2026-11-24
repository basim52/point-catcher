/**
 * 100% Procedural Web Audio API synthesizer for Monster Arena 3D
 */
export class MonsterArenaAudio {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private lastShootAt = 0;
  private lastCoinAt = 0;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private ensureContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), now + duration);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playShoot(heavy = false): void {
    const now = performance.now();
    if (now - this.lastShootAt < 55) return;
    this.lastShootAt = now;
    if (heavy) {
      this.tone(240, 68, 0.14, 'sawtooth', 0.09);
      this.tone(420, 120, 0.09, 'triangle', 0.06);
    } else {
      this.tone(540, 210, 0.075, 'triangle', 0.065);
    }
  }

  playKill(isBoss = false): void {
    if (isBoss) {
      this.tone(180, 65, 0.35, 'sawtooth', 0.15);
      this.tone(440, 880, 0.28, 'triangle', 0.12, 0.08);
      this.tone(660, 1180, 0.32, 'sine', 0.12, 0.2);
    } else {
      this.tone(290, 110, 0.1, 'square', 0.06);
    }
  }

  playCoin(): void {
    const now = performance.now();
    if (now - this.lastCoinAt < 45) return;
    this.lastCoinAt = now;
    this.tone(880, 1320, 0.08, 'sine', 0.065);
  }

  playFruitEat(): void {
    this.tone(460, 680, 0.09, 'sine', 0.1);
    this.tone(680, 1040, 0.14, 'triangle', 0.1, 0.07);
  }

  playBuy(): void {
    this.tone(523, 659, 0.09, 'triangle', 0.11);
    this.tone(659, 988, 0.16, 'triangle', 0.11, 0.08);
  }

  playMerge(): void {
    this.tone(440, 660, 0.11, 'triangle', 0.12);
    this.tone(660, 990, 0.13, 'sine', 0.12, 0.08);
    this.tone(880, 1480, 0.22, 'triangle', 0.14, 0.16);
  }

  playDash(): void {
    this.tone(320, 760, 0.12, 'sine', 0.09);
  }

  playHurt(): void {
    this.tone(180, 75, 0.15, 'sawtooth', 0.12);
  }

  playTitanSpawn(): void {
    this.tone(110, 58, 0.55, 'sawtooth', 0.18);
    this.tone(165, 82, 0.55, 'square', 0.12, 0.12);
    this.tone(220, 72, 0.65, 'sawtooth', 0.15, 0.32);
  }

  playGameOver(): void {
    this.tone(330, 220, 0.2, 'sawtooth', 0.11);
    this.tone(220, 110, 0.36, 'sawtooth', 0.11, 0.18);
  }

  dispose(): void {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
