// Fully synthesized "Coastal Waves & Distant Furin" soundscape (Web Audio API).
// No audio files: waves are filtered brown noise breathing on slow LFOs, and
// the furin (glass wind chime) is a small bank of inharmonic sine partials.

type Ctx = AudioContext;

function brownNoiseBuffer(ctx: Ctx, seconds = 6) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.2;
    }
  }
  return buf;
}

export class Soundscape {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private waveFilter: BiquadFilterNode | null = null;
  private washGain: GainNode | null = null;
  private chimeBus: GainNode | null = null;
  private chimeTimer: number | null = null;
  private velocity = 0;
  private running = false;

  get isRunning() {
    return this.running;
  }

  async start() {
    if (this.running) return;
    if (!this.ctx) this.build();
    const ctx = this.ctx!;
    if (ctx.state === "suspended") await ctx.resume();
    this.master!.gain.cancelScheduledValues(ctx.currentTime);
    this.master!.gain.setTargetAtTime(0.55, ctx.currentTime, 1.2);
    this.running = true;
    this.scheduleChime(1.5);
  }

  stop() {
    if (!this.ctx || !this.running) return;
    const ctx = this.ctx;
    this.master!.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
    if (this.chimeTimer) window.clearTimeout(this.chimeTimer);
    this.chimeTimer = null;
    this.running = false;
    window.setTimeout(() => {
      if (!this.running) void ctx.suspend();
    }, 2500);
  }

  /** Feed scroll velocity (any units ~0..60); the sea swells and brightens. */
  setVelocity(v: number) {
    if (!this.ctx || !this.running) return;
    const target = Math.min(Math.abs(v) / 40, 1);
    this.velocity += (target - this.velocity) * 0.15;
    const t = this.ctx.currentTime;
    this.waveFilter!.frequency.setTargetAtTime(520 + this.velocity * 1400, t, 0.25);
    this.washGain!.gain.setTargetAtTime(0.06 + this.velocity * 0.22, t, 0.3);
    this.master!.gain.setTargetAtTime(0.55 + this.velocity * 0.25, t, 0.4);
  }

  /** Strike the furin now (e.g. when an artifact is opened). */
  chime(intensity = 1) {
    if (!this.ctx || !this.running) return;
    this.strike(intensity);
  }

  private build() {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
    this.master = master;

    // --- Waves: brown noise -> lowpass breathing on a slow LFO -> gain swell.
    const noise = ctx.createBufferSource();
    noise.buffer = brownNoiseBuffer(ctx);
    noise.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 520;
    lp.Q.value = 0.4;
    this.waveFilter = lp;
    const swell = ctx.createGain();
    swell.gain.value = 0.45;
    // Two LFOs at non-related rates -> irregular wave sets.
    const lfoA = ctx.createOscillator();
    lfoA.frequency.value = 0.075;
    const lfoAGain = ctx.createGain();
    lfoAGain.gain.value = 0.28;
    const lfoB = ctx.createOscillator();
    lfoB.frequency.value = 0.131;
    const lfoBGain = ctx.createGain();
    lfoBGain.gain.value = 0.12;
    lfoA.connect(lfoAGain).connect(swell.gain);
    lfoB.connect(lfoBGain).connect(swell.gain);
    const lfoF = ctx.createOscillator();
    lfoF.frequency.value = 0.075;
    const lfoFGain = ctx.createGain();
    lfoFGain.gain.value = 260;
    lfoF.connect(lfoFGain).connect(lp.frequency);
    noise.connect(lp).connect(swell).connect(master);

    // --- Foam wash: high-passed hiss that rides on top during swells.
    const wash = ctx.createBufferSource();
    wash.buffer = brownNoiseBuffer(ctx, 4);
    wash.loop = true;
    wash.playbackRate.value = 2.7;
    const hp = ctx.createBiquadFilter();
    hp.type = "bandpass";
    hp.frequency.value = 2400;
    hp.Q.value = 0.6;
    const washGain = ctx.createGain();
    washGain.gain.value = 0.06;
    this.washGain = washGain;
    wash.connect(hp).connect(washGain).connect(master);

    // --- Furin bus with a soft feedback delay for distance.
    const bus = ctx.createGain();
    bus.gain.value = 0.22;
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.37;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const dlp = ctx.createBiquadFilter();
    dlp.type = "lowpass";
    dlp.frequency.value = 3200;
    bus.connect(master);
    bus.connect(delay);
    delay.connect(dlp).connect(fb).connect(delay);
    dlp.connect(master);
    this.chimeBus = bus;

    [noise, wash, lfoA, lfoB, lfoF].forEach((n) => n.start());
  }

  private strike(intensity: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.02;
    const base = [1568, 1760, 2093, 2349, 2637][Math.floor(Math.random() * 5)] * (0.98 + Math.random() * 0.04);
    const partials = [1, 2.76, 5.4, 8.93];
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.2 - 0.6;
    pan.connect(this.chimeBus!);
    partials.forEach((ratio, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = base * ratio;
      o.detune.value = (Math.random() - 0.5) * 8;
      const g = ctx.createGain();
      const peak = (0.16 / (i + 1)) * intensity;
      const decay = 2.8 / (1 + i * 0.7);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      o.connect(g).connect(pan);
      o.start(t);
      o.stop(t + decay + 0.1);
    });
  }

  private scheduleChime(delaySec?: number) {
    const wait = delaySec ?? 4 + Math.random() * 7;
    this.chimeTimer = window.setTimeout(() => {
      if (!this.running) return;
      this.strike(0.55 + Math.random() * 0.45);
      // Sometimes the clapper swings back for a quick second note.
      if (Math.random() < 0.45) window.setTimeout(() => this.running && this.strike(0.35), 180 + Math.random() * 260);
      this.scheduleChime();
    }, wait * 1000);
  }
}

export const soundscape = new Soundscape();
