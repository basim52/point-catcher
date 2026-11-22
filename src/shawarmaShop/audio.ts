// Procedural Web Audio API SFX & warm street-food restaurant groove for Shawarma King 3D

export class ShawarmaAudio {
  private ctx: AudioContext | null = null;
  private bgTimer: number | null = null;
  private step = 0;
  public enabled = true;

  private ensure(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
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

  public setEnabled(val: boolean): void {
    this.enabled = val;
    if (!val) this.stopMusic();
  }

  public playPlaceBread(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.08);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playSliceMeat(electric = false): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * (electric ? 0.12 : 0.2));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(electric ? 3400 : 2500, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (electric ? 0.12 : 0.2));
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  public playChopPotato(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Crisp double wooden-board chop-chop
    [0, 0.08, 0.16].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + delay;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.055);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.065);
    });
  }

  public playAddTopping(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.07);
    gain.gain.setValueAtTime(0.085, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playPourDrink(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [420, 620, 840].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.04;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.075, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    });
  }

  public playGrillWrap(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.25);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.8;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1900, now);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.08, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
  }

  public playCashRegister(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [987.77, 1318.51, 1567.98].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.055;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.27);
    });
  }

  public playWrongOrLeave(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(115, now + 0.22);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playDayComplete(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.085;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  public startMusic(): void {
    if (!this.enabled || this.bgTimer !== null) return;
    const ctx = this.ensure();
    if (!ctx) return;

    const melody = [
      293.66, 0, 349.23, 392.0, 440.0, 0, 392.0, 349.23,
      329.63, 0, 392.0, 440.0, 493.88, 0, 440.0, 392.0,
      349.23, 392.0, 440.0, 0, 523.25, 0, 440.0, 392.0,
      349.23, 329.63, 293.66, 0, 293.66, 0, 0, 0,
    ];
    const bass = [
      146.83, 0, 0, 0, 110.0, 0, 0, 0,
      130.81, 0, 0, 0, 146.83, 0, 110.0, 0,
      174.61, 0, 0, 0, 146.83, 0, 0, 0,
      110.0, 0, 146.83, 0, 146.83, 0, 0, 0,
    ];

    this.step = 0;
    this.bgTimer = window.setInterval(() => {
      if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      const idx = this.step % melody.length;

      const m = melody[idx];
      if (m > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(m, now);
        gain.gain.setValueAtTime(0.028, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      }

      const b = bass[idx];
      if (b > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(b, now);
        gain.gain.setValueAtTime(0.032, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }

      this.step++;
    }, 240);
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
