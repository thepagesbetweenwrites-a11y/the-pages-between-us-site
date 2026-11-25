// Fully synthesized atmosphere for Fujinomachi (Web Audio API, no audio files).
// Three channels share one master bus:
//   sea   – filtered brown noise breathing on slow LFOs, plus a foam wash
//   furin – a glass wind chime: inharmonic sine partials through a soft delay
//   rain  – soft rain on a window: band-limited noise bed plus random droplet ticks

type Ctx = AudioContext;
export type Channel = "sea" | "furin" | "rain";
export type Levels = Record<Channel, number>;

export const CHANNELS: { id: Channel; label: string }[] = [
  { id: "sea", label: "Coastal sea" },
  { id: "furin", label: "Distant furin" },
  { id: "rain", label: "Soft rain on window" },
];

export const DEFAULT_LEVELS: Levels = { sea: 0.7, furin: 0.5, rain: 0 };

function noiseBuffer(ctx: Ctx, seconds: number, brown: boolean) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * white) / 1.02;
        d[i] = last * 3.2;
      } else d[i] = white * 0.5;
    }
  }
  return buf;
}

export class Soundscape {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private bus: Record<Channel, GainNode> | null = null;
  private waveFilter: BiquadFilterNode | null = null;
  private washGain: GainNode | null = null;
  private chimeBus: GainNode | null = null;
  private dropBus: GainNode | null = null;
  private whiteBuf: AudioBuffer | null = null;
  private chimeTimer: number | null = null;
  private dropTimer: number | null = null;
  private velocity = 0;
  private running = false;
  private levels: Levels = { ...DEFAULT_LEVELS };

  get isRunning() {
    return this.running;
  }

  async start(levels?: Levels) {
    if (levels) this.levels = { ...levels };
    if (this.running) return;
    if (!this.ctx) this.build();
    const ctx = this.ctx!;
    if (ctx.state === "suspended") await ctx.resume();
    this.master!.gain.cancelScheduledValues(ctx.currentTime);
    this.master!.gain.setTargetAtTime(0.6, ctx.currentTime, 1.2);
    this.running = true;
    this.applyLevels(0.6);
    this.scheduleChime(1.5);
    this.scheduleDrop();
  }

  stop() {
    if (!this.ctx || !this.running) return;
    const ctx = this.ctx;
    this.master!.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
    if (this.chimeTimer) window.clearTimeout(this.chimeTimer);
    if (this.dropTimer) window.clearTimeout(this.dropTimer);
    this.chimeTimer = this.dropTimer = null;
    this.running = false;
    window.setTimeout(() => {
      if (!this.running) void ctx.suspend();
    }, 2500);
  }

  setLevel(ch: Channel, v: number) {
    this.levels[ch] = Math.max(0, Math.min(1, v));
    if (this.running) this.applyLevels(0.15);
  }

  /** Feed scroll velocity (any units ~0..60); the sea swells and brightens. */
  setVelocity(v: number) {
    if (!this.ctx || !this.running) return;
    const target = Math.min(Math.abs(v) / 40, 1);
    this.velocity += (target - this.velocity) * 0.15;
    const t = this.ctx.currentTime;
    this.waveFilter!.frequency.setTargetAtTime(520 + this.velocity * 1400, t, 0.25);
    this.washGain!.gain.setTargetAtTime(0.06 + this.velocity * 0.22, t, 0.3);
  }

  /** Strike the furin now (e.g. when an artifact or map stop is opened). */
  chime(intensity = 1) {
    if (!this.ctx || !this.running || this.levels.furin <= 0) return;
    this.strike(intensity);
  }

  private applyLevels(tau: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    // Perceptual curve: slider position squared.
    (Object.keys(this.levels) as Channel[]).forEach((ch) => {
      const v = this.levels[ch];
      this.bus![ch].gain.setTargetAtTime(v * v, t, tau);
    });
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

    const mk = () => {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(master);
      return g;
    };
    this.bus = { sea: mk(), furin: mk(), rain: mk() };

    // --- Sea: brown noise -> lowpass breathing on a slow LFO -> gain swell.
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx, 6, true);
    noise.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 520;
    lp.Q.value = 0.4;
    this.waveFilter = lp;
    const swell = ctx.createGain();
    swell.gain.value = 0.45;
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
    noise.connect(lp).connect(swell).connect(this.bus.sea);

    const wash = ctx.createBufferSource();
    wash.buffer = noiseBuffer(ctx, 4, true);
    wash.loop = true;
    wash.playbackRate.value = 2.7;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2400;
    bp.Q.value = 0.6;
    const washGain = ctx.createGain();
    washGain.gain.value = 0.06;
    this.washGain = washGain;
    wash.connect(bp).connect(washGain).connect(this.bus.sea);

    // --- Furin: bus with a soft feedback delay for distance.
    const chime = ctx.createGain();
    chime.gain.value = 0.22;
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.37;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const dlp = ctx.createBiquadFilter();
    dlp.type = "lowpass";
    dlp.frequency.value = 3200;
    chime.connect(this.bus.furin);
    chime.connect(delay);
    delay.connect(dlp).connect(fb).connect(delay);
    dlp.connect(this.bus.furin);
    this.chimeBus = chime;

    // --- Rain on a window: a muffled noise bed (the glass takes the top off)
    // with a slow flutter, plus droplet ticks scheduled at random.
    const white = noiseBuffer(ctx, 3, false);
    this.whiteBuf = white;
    const bed = ctx.createBufferSource();
    bed.buffer = white;
    bed.loop = true;
    const bedHp = ctx.createBiquadFilter();
    bedHp.type = "highpass";
    bedHp.frequency.value = 450;
    const bedLp = ctx.createBiquadFilter();
    bedLp.type = "lowpass";
    bedLp.frequency.value = 3800;
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.2;
    const flutter = ctx.createOscillator();
    flutter.frequency.value = 0.21;
    const flutterGain = ctx.createGain();
    flutterGain.gain.value = 0.06;
    flutter.connect(flutterGain).connect(bedGain.gain);
    bed.connect(bedHp).connect(bedLp).connect(bedGain).connect(this.bus.rain);
    const drops = ctx.createGain();
    drops.gain.value = 0.5;
    drops.connect(this.bus.rain);
    this.dropBus = drops;

    [noise, wash, lfoA, lfoB, lfoF, bed, flutter].forEach((n) => n.start());
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

  /** One droplet: a few ms of band-passed noise with a fast decay. */
  private drop() {
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.01;
    const src = ctx.createBufferSource();
    src.buffer = this.whiteBuf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1800 + Math.random() * 4200;
    f.Q.value = 4 + Math.random() * 6;
    const g = ctx.createGain();
    const peak = 0.05 + Math.random() * 0.12;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03 + Math.random() * 0.05);
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;
    src.connect(f).connect(g).connect(pan).connect(this.dropBus!);
    src.start(t, Math.random() * 2);
    src.stop(t + 0.12);
  }

  private scheduleChime(delaySec?: number) {
    const wait = delaySec ?? 4 + Math.random() * 7;
    this.chimeTimer = window.setTimeout(() => {
      if (!this.running) return;
      if (this.levels.furin > 0) {
        this.strike(0.55 + Math.random() * 0.45);
        // Sometimes the clapper swings back for a quick second note.
        if (Math.random() < 0.45) window.setTimeout(() => this.running && this.strike(0.35), 180 + Math.random() * 260);
      }
      this.scheduleChime();
    }, wait * 1000);
  }

  private scheduleDrop() {
    // Denser droplets as the rain slider rises; idle-polls slowly when muted.
    const r = this.levels.rain;
    const wait = r > 0 ? 40 + Math.random() * (260 - r * 200) : 400;
    this.dropTimer = window.setTimeout(() => {
      if (!this.running) return;
      if (this.levels.rain > 0) {
        this.drop();
        if (Math.random() < 0.3) this.drop();
      }
      this.scheduleDrop();
    }, wait);
  }
}

export const soundscape = new Soundscape();
