// ════════════════════════════════════════════════════════════════
// audio.js — paisaje sonoro 100% sintetizado (WebAudio)
//   rumor de multitud · tambor huéhuetl · viento del valle · estallidos
// ════════════════════════════════════════════════════════════════

export class SoundScape {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this._drumTimer = null;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    const ctx = this.ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // ── rumor de multitud: ruido filtrado con oleaje ──
    const noiseBuf = this._noiseBuffer(4);
    this.crowdSrc = ctx.createBufferSource();
    this.crowdSrc.buffer = noiseBuf;
    this.crowdSrc.loop = true;
    this.crowdFilter = ctx.createBiquadFilter();
    this.crowdFilter.type = 'bandpass';
    this.crowdFilter.frequency.value = 750;
    this.crowdFilter.Q.value = 0.55;
    this.crowdGain = ctx.createGain();
    this.crowdGain.gain.value = 0;
    this.crowdSrc.connect(this.crowdFilter).connect(this.crowdGain).connect(this.master);
    this.crowdSrc.start();

    // oleaje lento del público
    this.swellLFO = ctx.createOscillator();
    this.swellLFO.frequency.value = 0.07;
    this.swellDepth = ctx.createGain();
    this.swellDepth.gain.value = 0.04;
    this.swellLFO.connect(this.swellDepth).connect(this.crowdGain.gain);
    this.swellLFO.start();

    // ── viento del valle: ruido grave muy filtrado ──
    this.windSrc = ctx.createBufferSource();
    this.windSrc.buffer = noiseBuf;
    this.windSrc.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 240;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.05;
    this.windSrc.connect(windFilter).connect(this.windGain).connect(this.master);
    this.windSrc.start();

    // ── colchón armónico (quinta abierta, muy tenue) ──
    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0.0;
    for (const f of [55, 82.4, 110.8]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = (Math.random() - 0.5) * 7;
      const g = ctx.createGain();
      g.gain.value = 0.33;
      o.connect(g).connect(this.padGain);
      o.start();
    }
    this.padGain.connect(this.master);
  }

  _noiseBuffer(secs) {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate * secs, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {           // ruido "café" (más natural)
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.2;
    }
    return buf;
  }

  toggle() {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.enabled = !this.enabled;
    this._ramp(this.master.gain, this.enabled ? 0.9 : 0, 1.2);
    return this.enabled;
  }

  _ramp(param, v, t) {
    const now = this.ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(v, now + t);
  }

  /** intensidad del público 0..1 y presencia del colchón armónico */
  setScene({ crowd = 0.3, pad = 0.02, wind = 0.05 } = {}) {
    if (!this.ctx) return;
    this._ramp(this.crowdGain.gain, crowd * 0.4, 3);
    this._ramp(this.padGain.gain, pad, 4);
    this._ramp(this.windGain.gain, wind, 3);
  }

  /** rugido de gol */
  roar() {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    const g = this.crowdGain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.55, now + 0.35);
    g.exponentialRampToValueAtTime(Math.max(0.12, g.value), now + 6);
  }

  /** golpe de huéhuetl (tambor ceremonial) */
  drum(when = 0, pitch = 58) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(pitch * 2.4, t);
    o.frequency.exponentialRampToValueAtTime(pitch, t + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + 0.7);
  }

  /** latido ceremonial continuo (capítulo I) */
  startDrums() {
    this.stopDrums();
    let beat = 0;
    this._drumTimer = setInterval(() => {
      this.drum(0, 56);
      if (beat % 2 === 1) this.drum(0.34, 74);
      beat++;
    }, 1350);
  }
  stopDrums() {
    if (this._drumTimer) { clearInterval(this._drumTimer); this._drumTimer = null; }
  }

  /** estallido de pirotecnia */
  boom() {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + Math.random() * 0.1;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.5);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(120, t + 0.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    src.connect(f).connect(g).connect(this.master);
    src.start(t); src.stop(t + 0.55);
  }
}
