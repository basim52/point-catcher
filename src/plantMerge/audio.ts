export class PlantMergeAudio {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private lastShotAt = 0;

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(
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
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, endFreq),
        now + duration
      );
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playPlant(): void {
    this.playTone(260, 420, 0.11, 'triangle', 0.12);
    this.playTone(520, 660, 0.1, 'sine', 0.08, 0.05);
  }

  public playMerge(newTier: number): void {
    const base = 330 + newTier * 62;
    this.playTone(base, base * 1.15, 0.14, 'triangle', 0.14, 0);
    this.playTone(base * 1.25, base * 1.4, 0.15, 'sine', 0.13, 0.065);
    this.playTone(base * 1.5, base * 1.9, 0.22, 'sine', 0.14, 0.13);
  }

  public playMove(): void {
    this.playTone(340, 290, 0.08, 'sine', 0.08);
  }

  public playShoot(tier: number): void {
    const now = performance.now();
    if (now - this.lastShotAt < 70) return;
    this.lastShotAt = now;
    const startFreq = 420 + tier * 55;
    this.playTone(startFreq, startFreq * 0.58, 0.08, 'triangle', 0.045);
  }

  public playMonsterDefeat(isBoss: boolean): void {
    if (isBoss) {
      this.playTone(196, 294, 0.24, 'sawtooth', 0.14, 0);
      this.playTone(330, 523, 0.28, 'triangle', 0.15, 0.12);
      this.playTone(523, 784, 0.38, 'sine', 0.16, 0.25);
    } else {
      this.playTone(290, 140, 0.12, 'triangle', 0.08);
      this.playTone(580, 740, 0.11, 'sine', 0.06, 0.04);
    }
  }

  public playWaterBoost(): void {
    this.playTone(480, 720, 0.16, 'sine', 0.1, 0);
    this.playTone(640, 960, 0.18, 'sine', 0.1, 0.07);
    this.playTone(820, 1180, 0.22, 'triangle', 0.1, 0.14);
  }

  public playUpgrade(): void {
    this.playTone(440, 554, 0.13, 'triangle', 0.12, 0);
    this.playTone(554, 659, 0.14, 'triangle', 0.12, 0.07);
    this.playTone(659, 880, 0.2, 'sine', 0.13, 0.14);
  }

  public playBossWarn(): void {
    this.playTone(165, 130, 0.28, 'sawtooth', 0.11, 0);
    this.playTone(165, 110, 0.36, 'sawtooth', 0.12, 0.24);
  }

  public playFarmHit(): void {
    this.playTone(170, 72, 0.24, 'sawtooth', 0.14);
  }

  public playHouseChomp(): void {
    this.playTone(145, 58, 0.16, 'sawtooth', 0.16, 0);
    this.playTone(230, 95, 0.12, 'square', 0.09, 0.06);
  }

  public playMegaBossSpawn(): void {
    this.playTone(110, 82, 0.45, 'sawtooth', 0.16, 0);
    this.playTone(165, 110, 0.5, 'sawtooth', 0.15, 0.22);
    this.playTone(98, 65, 0.65, 'triangle', 0.18, 0.48);
  }

  public playSummonMinions(): void {
    this.playTone(240, 420, 0.16, 'sawtooth', 0.09, 0);
    this.playTone(360, 190, 0.22, 'triangle', 0.1, 0.08);
  }

  public playWaveClear(): void {
    const notes = [392, 493.88, 587.33, 783.99];
    notes.forEach((n, idx) => {
      this.playTone(n, n, 0.18, 'triangle', 0.11, idx * 0.075);
    });
  }

  public playGameOver(): void {
    this.playTone(320, 240, 0.22, 'sawtooth', 0.11, 0);
    this.playTone(240, 180, 0.24, 'sawtooth', 0.11, 0.18);
    this.playTone(180, 110, 0.4, 'triangle', 0.12, 0.36);
  }

  public startMusic(): void {
    if (!this.enabled || this.musicTimer !== null || typeof window === 'undefined') {
      return;
    }
    // Upbeat pastoral adventure marimba loop in G major
    const melody = [
      392, 493.88, 587.33, 493.88, 659.25, 587.33, 493.88, 440,
      392, 440, 493.88, 587.33, 523.25, 493.88, 440, 0,
    ];
    const bass = [196, 0, 196, 0, 220, 0, 146.83, 0, 196, 0, 164.81, 0, 130.81, 0, 146.83, 0];
    this.musicTimer = window.setInterval(() => {
      if (!this.enabled) return;
      const idx = this.musicStep % melody.length;
      const m = melody[idx];
      const b = bass[idx];
      if (m > 0) this.playTone(m, m, 0.16, 'triangle', 0.028);
      if (b > 0) this.playTone(b, b, 0.22, 'sine', 0.032);
      this.musicStep++;
    }, 240);
  }

  public stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public dispose(): void {
    this.stopMusic();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
