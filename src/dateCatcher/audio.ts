// Procedural Web Audio API sound effects & light warm oasis background music for Date Catcher 3D

export class DateCatcherAudio {
  private ctx: AudioContext | null = null;
  private bgTimer: number | null = null;
  private bgStep = 0;
  public enabled = true;

  private ensure(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
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
    return this.ctx;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    if (!val) {
      this.stopMusic();
    }
  }

  public playCatch(comboMultiplier: 1 | 2 | 3): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const baseFreq = comboMultiplier === 3 ? 620 : comboMultiplier === 2 ? 540 : 460;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.42, now + 0.09);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playGolden(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.055;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playPowerUp(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.05;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.21);
    });
  }

  public playHurt(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(92, now + 0.24);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.27);
  }

  public playShieldBlock(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.05;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.17);
    });
  }

  public playLevelUp(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Warm cheerful Hijazi-tinted ascending cadence
    [293.66, 369.99, 440.0, 587.33, 739.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.075;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  public startMusic(): void {
    if (!this.enabled) return;
    if (this.bgTimer !== null) return;
    const ctx = this.ensure();
    if (!ctx) return;

    // Gentle sunset oasis melody (D major / warm pentatonic plucked oud feel)
    const melody = [
      293.66, 0, 329.63, 369.99, 440.0, 0, 369.99, 329.63,
      293.66, 0, 440.0, 493.88, 587.33, 0, 493.88, 440.0,
      369.99, 0, 440.0, 493.88, 440.0, 369.99, 329.63, 0,
      293.66, 329.63, 369.99, 0, 293.66, 0, 0, 0,
    ];
    const bass = [
      146.83, 0, 0, 0, 110.0, 0, 0, 0,
      146.83, 0, 0, 0, 146.83, 0, 110.0, 0,
      123.47, 0, 0, 0, 110.0, 0, 0, 0,
      146.83, 0, 110.0, 0, 146.83, 0, 0, 0,
    ];

    this.bgStep = 0;
    this.bgTimer = window.setInterval(() => {
      if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      const idx = this.bgStep % melody.length;
      const mFreq = melody[idx];
      const bFreq = bass[idx];

      if (mFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(mFreq, now);
        gain.gain.setValueAtTime(0.032, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }

      if (bFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(bFreq, now);
        gain.gain.setValueAtTime(0.036, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.44);
      }

      this.bgStep++;
    }, 285);
  }

  public stopMusic(): void {
    if (this.bgTimer !== null) {
      window.clearInterval(this.bgTimer);
      this.bgTimer = null;
    }
  }

  public dispose(): void {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
