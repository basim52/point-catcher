// Procedural Web Audio API sound effects & energetic desert rally synth loop

export class DesertRallyAudio {
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

  public playCoin(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.08);
    gain.gain.setValueAtTime(0.085, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playLaneShift(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.055);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playJump(bigRamp = false): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(bigRamp ? 240 : 190, now);
    osc.frequency.exponentialRampToValueAtTime(bigRamp ? 660 : 480, now + 0.18);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playNitro(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [330, 440, 659.25, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.045;
      osc.type = 'sawtooth';
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, t);
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.065, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playShieldPickup(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.05;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.19);
    });
  }

  public playShieldBlock(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.16);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playCrash(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.28);
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.31);
  }

  public playSectorUp(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.06;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.23);
    });
  }

  public startMusic(): void {
    if (!this.enabled || this.bgTimer !== null) return;
    const ctx = this.ensure();
    if (!ctx) return;

    // Driving warm synthwave-desert bass + lead riff
    const bassLine = [
      110, 110, 146.83, 110, 130.81, 130.81, 164.81, 146.83,
      98, 98, 130.81, 98, 110, 130.81, 146.83, 164.81,
    ];
    const leadLine = [
      440, 0, 523.25, 587.33, 0, 523.25, 440, 392,
      440, 0, 587.33, 659.25, 587.33, 0, 523.25, 440,
    ];

    this.step = 0;
    this.bgTimer = window.setInterval(() => {
      if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      const idx = this.step % bassLine.length;

      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      const bFilt = this.ctx.createBiquadFilter();
      bFilt.type = 'lowpass';
      bFilt.frequency.setValueAtTime(420, now);
      bOsc.type = 'sawtooth';
      bOsc.frequency.setValueAtTime(bassLine[idx], now);
      bGain.gain.setValueAtTime(0.036, now);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      bOsc.connect(bFilt);
      bFilt.connect(bGain);
      bGain.connect(this.ctx.destination);
      bOsc.start(now);
      bOsc.stop(now + 0.17);

      const lFreq = leadLine[idx];
      if (lFreq > 0) {
        const lOsc = this.ctx.createOscillator();
        const lGain = this.ctx.createGain();
        lOsc.type = 'triangle';
        lOsc.frequency.setValueAtTime(lFreq, now);
        lGain.gain.setValueAtTime(0.026, now);
        lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        lOsc.connect(lGain);
        lGain.connect(this.ctx.destination);
        lOsc.start(now);
        lOsc.stop(now + 0.16);
      }

      this.step++;
    }, 185);
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
