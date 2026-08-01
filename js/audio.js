/* 极地风暴 - 程序化音效引擎（WebAudio 合成，无外部资源） */
(function () {
  'use strict';

  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.sfxBus = null;
      this.musicBus = null;
      this.enabled = true;
      this.volume = 1;
      this.windGain = null;
      this._windTarget = 0.15;
      this._windNoise = null;
      this._padTimer = null;
      this._chordIdx = 0;
    }

    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? this.volume * 0.55 : 0;
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 1;
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.16;
      this.musicBus.connect(this.master);
      this._startWind();
      this._startPad();
    }

    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

    setEnabled(v) {
      this.enabled = v;
      if (this.master) this.master.gain.value = v ? this.volume * 0.55 : 0;
    }

    setVolume(v) {
      this.volume = v;
      if (this.master && this.enabled) this.master.gain.value = v * 0.55;
    }

    setWind(level) { this._windTarget = 0.12 + level * 0.5; }

    _noiseBuffer(sec) {
      const n = Math.floor(this.ctx.sampleRate * sec);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    }

    _startWind() {
      const buf = this._noiseBuffer(2);
      const src = this.ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 0.4;
      this.windGain = this.ctx.createGain();
      this.windGain.gain.value = 0.12;
      src.connect(lp); lp.connect(this.windGain); this.windGain.connect(this.sfxBus);
      src.start();
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.11;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.05;
      lfo.connect(lfoGain); lfoGain.connect(this.windGain.gain);
      lfo.start();
      this._windNoise = { lp, src };
    }

    _startPad() {
      const chords = [[110, 130.8, 164.8, 220], [87.3, 110, 130.8, 174.6], [98, 123.5, 146.8, 196]];
      const playChord = () => {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const ch = chords[this._chordIdx % chords.length];
        this._chordIdx++;
        ch.forEach((f, i) => {
          const o = this.ctx.createOscillator();
          o.type = i % 2 ? 'sine' : 'triangle';
          o.frequency.value = f;
          const g = this.ctx.createGain();
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.055, t + 4);
          g.gain.linearRampToValueAtTime(0, t + 9);
          const lp = this.ctx.createBiquadFilter();
          lp.type = 'lowpass'; lp.frequency.value = 900;
          o.connect(lp); lp.connect(g); g.connect(this.musicBus);
          o.start(t); o.stop(t + 10);
        });
      };
      playChord();
      this._padTimer = setInterval(playChord, 9000);
    }

    _tone(freq, dur, type, vol, opts) {
      if (!this.ctx || !this.enabled) return;
      opts = opts || {};
      const t = this.ctx.currentTime + (opts.delay || 0);
      const o = this.ctx.createOscillator();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (opts.slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slideTo), t + dur);
      const g = this.ctx.createGain();
      const v = vol === undefined ? 0.3 : vol;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let node = o;
      if (opts.filter) {
        const f = this.ctx.createBiquadFilter();
        f.type = opts.filter.type || 'lowpass';
        f.frequency.value = opts.filter.freq || 1000;
        if (opts.filter.slide) f.frequency.exponentialRampToValueAtTime(opts.filter.slide, t + dur);
        o.connect(f); node = f;
      }
      node.connect(g); g.connect(this.sfxBus);
      o.start(t); o.stop(t + dur + 0.06);
    }

    _noiseBurst(dur, vol, filterOpts) {
      if (!this.ctx || !this.enabled) return;
      const t = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this._noiseBuffer(Math.max(0.1, dur + 0.1));
      const f = this.ctx.createBiquadFilter();
      f.type = (filterOpts && filterOpts.type) || 'bandpass';
      f.frequency.value = (filterOpts && filterOpts.freq) || 1200;
      f.Q.value = (filterOpts && filterOpts.q) || 0.8;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(this.sfxBus);
      src.start(t);
    }

    uiClick() { this._tone(680, 0.07, 'square', 0.08, { slideTo: 520 }); }
    swing() { this._noiseBurst(0.22, 0.22, { type: 'bandpass', freq: 500, q: 0.5 }); }
    hit(heavy) {
      this._tone(150, 0.13, 'sine', 0.5, { slideTo: 55 });
      this._noiseBurst(heavy ? 0.3 : 0.12, heavy ? 0.5 : 0.25, { type: 'lowpass', freq: heavy ? 700 : 1400 });
    }
    crit() {
      this.hit(true);
      this._tone(1180, 0.14, 'square', 0.1, { slideTo: 1500, delay: 0.02 });
    }
    hurt() {
      this._tone(190, 0.22, 'sawtooth', 0.35, { slideTo: 80 });
      this._noiseBurst(0.2, 0.3, { type: 'lowpass', freq: 900 });
    }
    penguin(vol) {
      vol = vol === undefined ? 0.16 : vol;
      this._tone(720, 0.07, 'square', vol, { slideTo: 1050 });
      this._tone(1050, 0.08, 'square', vol, { slideTo: 780, delay: 0.09 });
    }
    penguinDie() {
      this._tone(900, 0.18, 'square', 0.12, { slideTo: 380 });
      this._tone(500, 0.2, 'sine', 0.12, { slideTo: 260, delay: 0.05 });
    }
    roar() {
      this._tone(95, 0.75, 'sawtooth', 0.55, { slideTo: 42, filter: { type: 'lowpass', freq: 420 } });
      this._noiseBurst(0.7, 0.35, { type: 'lowpass', freq: 500 });
      this._tone(70, 0.8, 'triangle', 0.4, { slideTo: 38, delay: 0.04 });
    }
    bossRoar() {
      this._tone(72, 1.0, 'sawtooth', 0.6, { slideTo: 30, filter: { type: 'lowpass', freq: 360 } });
      this._noiseBurst(0.95, 0.45, { type: 'lowpass', freq: 420 });
      this._tone(50, 1.0, 'square', 0.3, { slideTo: 24, delay: 0.1 });
    }
    iceCrack() {
      this._noiseBurst(0.28, 0.35, { type: 'highpass', freq: 2600 });
      this._tone(2400, 0.12, 'sine', 0.1, { slideTo: 3200 });
    }
    beam() {
      this._tone(420, 0.42, 'sawtooth', 0.16, { slideTo: 1800, filter: { type: 'highpass', freq: 500 } });
      this._noiseBurst(0.4, 0.18, { type: 'highpass', freq: 1800 });
    }
    explode() {
      this._noiseBurst(0.55, 0.6, { type: 'lowpass', freq: 800 });
      this._tone(95, 0.5, 'sine', 0.55, { slideTo: 26 });
    }
    heal() {
      [520, 660, 880].forEach((f, i) => this._tone(f, 0.16, 'sine', 0.12, { delay: i * 0.08 }));
    }
    levelUp() {
      [440, 550, 660, 880, 1100].forEach((f, i) => this._tone(f, 0.24, 'triangle', 0.18, { delay: i * 0.09 }));
    }
    dash() { this._noiseBurst(0.2, 0.2, { type: 'highpass', freq: 900 }); }
    pickup() { this._tone(880, 0.09, 'sine', 0.2, { slideTo: 1320 }); }
    pickupGold() { this._tone(880, 0.09, 'sine', 0.2, { slideTo: 1320 }); this._tone(1320, 0.12, 'sine', 0.18, { slideTo: 1760, delay: 0.07 }); }
    stun() {
      this._tone(320, 0.35, 'triangle', 0.2, { slideTo: 90 });
      this._tone(330, 0.3, 'sine', 0.1, { delay: 0.06 });
    }
    land() { this._tone(90, 0.18, 'sine', 0.4, { slideTo: 40 }); this._noiseBurst(0.18, 0.3, { type: 'lowpass', freq: 600 }); }
    jump() { this._noiseBurst(0.12, 0.12, { type: 'highpass', freq: 500 }); }
    cast() {
      this._tone(300, 0.25, 'triangle', 0.18, { slideTo: 900 });
      this._noiseBurst(0.22, 0.12, { type: 'highpass', freq: 2500 });
    }
    shield() {
      this._tone(220, 0.3, 'sine', 0.25, { slideTo: 440 });
      this._noiseBurst(0.3, 0.15, { type: 'bandpass', freq: 2400, q: 2 });
    }
    avalanche() {
      this._noiseBurst(1.2, 0.7, { type: 'lowpass', freq: 350 });
      this._tone(60, 1.1, 'sine', 0.7, { slideTo: 22 });
      this._tone(120, 0.9, 'sawtooth', 0.25, { slideTo: 40, delay: 0.1 });
    }
    waveStart() { this._tone(392, 0.16, 'triangle', 0.14); this._tone(523, 0.22, 'triangle', 0.14, { delay: 0.12 }); }
    victory() {
      [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.3, 'triangle', 0.2, { delay: i * 0.13 }));
    }
    defeat() {
      [392, 330, 262, 196].forEach((f, i) => this._tone(f, 0.32, 'sawtooth', 0.14, { delay: i * 0.18 }));
    }
    airdrop() {
      this._noiseBurst(1.8, 0.25, { type: 'lowpass', freq: 300 });
      this._tone(160, 1.6, 'triangle', 0.1, { slideTo: 60 });
    }
  }

  window.AudioFX = new AudioEngine();
})();
