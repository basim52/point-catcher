class PartyAudioEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private ensureCtx(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    gainPeak = 0.08,
    delay = 0,
    endFreq?: number
  ): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playCoin(): void {
    this.playTone(988, 0.07, 'square', 0.06, 0);
    this.playTone(1319, 0.16, 'square', 0.06, 0.065);
  }

  public playJump(): void {
    this.playTone(320, 0.14, 'triangle', 0.09, 0, 740);
  }

  public playStar(): void {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, idx) => this.playTone(n, 0.11, 'triangle', 0.08, idx * 0.055));
  }

  public playHit(): void {
    this.playTone(190, 0.16, 'sawtooth', 0.08, 0, 75);
  }

  public playSelect(): void {
    this.playTone(620, 0.07, 'triangle', 0.07, 0, 820);
  }

  public playCountdown(go: boolean): void {
    if (go) {
      this.playTone(880, 0.24, 'square', 0.08, 0, 1175);
    } else {
      this.playTone(440, 0.1, 'square', 0.06, 0);
    }
  }

  public playVictory(): void {
    const melody = [523, 659, 784, 1046, 784, 1046];
    const times = [0, 0.09, 0.18, 0.27, 0.4, 0.5];
    melody.forEach((f, i) =>
      this.playTone(f, i === melody.length - 1 ? 0.35 : 0.11, 'triangle', 0.09, times[i])
    );
  }
}

export const partyAudio = new PartyAudioEngine();
