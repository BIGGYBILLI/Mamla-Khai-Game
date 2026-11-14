// Tiny WebAudio layer: engine drone, siren, crash, camera flash, UI ticks.
// Everything is synthesised — no audio files.

export class GameAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.engine = null;
    this.sirenNode = null;
    this.master = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(this.ctx.destination);
      this.noiseBuffer = this.makeNoise();
    } catch {
      this.ctx = null;
    }
  }

  makeNoise() {
    const len = this.ctx.sampleRate * 1.2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.setTargetAtTime(muted ? 0 : 0.55, this.ctx.currentTime, 0.05);
  }

  startEngine() {
    if (!this.ctx || this.engine) return;
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(this.master);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.Q.value = 4;
    filter.connect(out);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 52;
    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = 26;
    const g2 = ctx.createGain();
    g2.gain.value = 0.35;

    const osc1g = ctx.createGain();
    osc1g.gain.value = 0.5;

    osc1.connect(osc1g).connect(filter);
    osc2.connect(g2).connect(filter);
    osc1.start();
    osc2.start();

    out.gain.setTargetAtTime(0.13, ctx.currentTime, 0.4);
    this.engine = { out, filter, osc1, osc2, osc1g };
  }

  setEngine(pct, active) {
    if (!this.engine || !this.ctx) return;
    const t = this.ctx.currentTime;
    const p = Math.max(0, Math.min(1, pct));
    const base = 42 + p * 105;
    this.engine.osc1.frequency.setTargetAtTime(base, t, 0.08);
    this.engine.osc2.frequency.setTargetAtTime(base / 2, t, 0.08);
    this.engine.filter.frequency.setTargetAtTime(420 + p * 1500, t, 0.12);
    this.engine.out.gain.setTargetAtTime(active ? 0.09 + p * 0.07 : 0.0, t, 0.25);
  }

  stopEngine() {
    if (!this.engine || !this.ctx) return;
    const e = this.engine;
    this.engine = null;
    e.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    setTimeout(() => {
      try {
        e.osc1.stop();
        e.osc2.stop();
      } catch {}
    }, 600);
  }

  crash(intensity = 1) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5 * intensity, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    src.connect(filter).connect(g).connect(this.master);
    src.start();
    src.stop(ctx.currentTime + 0.5);

    const thump = ctx.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(120, ctx.currentTime);
    thump.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.4 * intensity, ctx.currentTime);
    tg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    thump.connect(tg).connect(this.master);
    thump.start();
    thump.stop(ctx.currentTime + 0.4);
  }

  flash() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    src.connect(filter).connect(g).connect(this.master);
    src.start();
    src.stop(ctx.currentTime + 0.1);
  }

  beep(freq = 660, dur = 0.09, type = 'square', vol = 0.06) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + dur);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(ctx.currentTime + dur + 0.02);
  }

  challan() {
    if (!this.ctx) return;
    this.beep(300, 0.12, 'sawtooth', 0.05);
    setTimeout(() => this.beep(220, 0.18, 'sawtooth', 0.05), 130);
  }

  startSiren() {
    if (!this.ctx || this.sirenNode) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 780;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(0.028, ctx.currentTime, 0.3);
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.55;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 190;
    lfo.connect(lfoGain).connect(osc.frequency);
    osc.connect(g).connect(this.master);
    osc.start();
    lfo.start();
    this.sirenNode = { osc, lfo, g };
  }

  stopSiren() {
    if (!this.sirenNode || !this.ctx) return;
    const s = this.sirenNode;
    this.sirenNode = null;
    s.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
    setTimeout(() => {
      try {
        s.osc.stop();
        s.lfo.stop();
      } catch {}
    }, 600);
  }
}
