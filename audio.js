(function () {
  'use strict';

  class VillageAudio {
    constructor() {
      this.context = null;
      this.master = null;
      this.ambient = null;
      this.muted = false; try { this.muted = localStorage.getItem('gaon-astra-muted') === 'true'; } catch {}
      this.phase = 'day';
      this.lastStep = 0;
      this.birdTimer = null;
    }

    init() {
      if (this.context) {
        if (this.context.state === 'suspended') this.context.resume();
        return;
      }
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.context.destination);
      this.startAmbience();
    }

    startAmbience() {
      if (!this.context || this.ambient) return;
      const filter = this.context.createBiquadFilter();
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 92;
      filter.type = 'lowpass';
      filter.frequency.value = 260;
      gain.gain.value = 0.018;
      oscillator.connect(filter).connect(gain).connect(this.master);
      oscillator.start();
      this.ambient = { oscillator, filter, gain };
      this.scheduleBird();
    }

    scheduleBird() {
      clearTimeout(this.birdTimer);
      const delay = 7000 + Math.random() * 9000;
      this.birdTimer = setTimeout(() => {
        if (this.phase === 'day' && !this.muted) this.play('bird');
        this.scheduleBird();
      }, delay);
    }

    setPhase(phase) {
      this.phase = phase;
      if (!this.context || !this.ambient) return;
      const now = this.context.currentTime;
      this.ambient.oscillator.frequency.setTargetAtTime(phase === 'night' ? 68 : 92, now, 1.4);
      this.ambient.gain.gain.setTargetAtTime(phase === 'night' ? 0.012 : 0.018, now, 1.2);
    }

    setMuted(muted) {
      this.muted = muted;
      try { localStorage.setItem('gaon-astra-muted', String(muted)); } catch {}
      if (this.master && this.context) this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.context.currentTime, 0.03);
      return this.muted;
    }

    toggle() {
      this.init();
      return this.setMuted(!this.muted);
    }

    tone(frequency, duration, type, volume, delay) {
      if (!this.context || this.muted) return;
      const start = this.context.currentTime + (delay || 0);
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type || 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(volume || 0.08, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(gain).connect(this.master);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    }

    noise(duration, volume) {
      if (!this.context || this.muted) return;
      const length = Math.floor(this.context.sampleRate * duration);
      const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / length);
      const source = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      source.buffer = buffer;
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      gain.gain.value = volume || 0.04;
      source.connect(filter).connect(gain).connect(this.master);
      source.start();
    }

    play(name) {
      this.init();
      if (!this.context || this.muted) return;
      if (name === 'click') this.tone(290, 0.07, 'triangle', 0.035);
      if (name === 'coin') { this.tone(660, 0.12, 'sine', 0.07); this.tone(880, 0.16, 'sine', 0.055, 0.09); }
      if (name === 'build') { this.noise(0.12, 0.035); this.tone(230, 0.16, 'triangle', 0.05, 0.05); }
      if (name === 'warning') { this.tone(180, 0.2, 'sawtooth', 0.045); this.tone(145, 0.28, 'sawtooth', 0.04, 0.18); }
      if (name === 'dusk') { this.tone(392, 0.45, 'sine', 0.05); this.tone(294, 0.55, 'sine', 0.04, 0.24); }
      if (name === 'dawn') { this.tone(392, 0.25, 'sine', 0.05); this.tone(523, 0.3, 'sine', 0.055, 0.15); this.tone(659, 0.42, 'sine', 0.045, 0.32); }
      if (name === 'vote') { this.tone(262, 0.13, 'triangle', 0.05); this.tone(330, 0.13, 'triangle', 0.05, 0.13); }
      if (name === 'celebrate') { [523, 659, 784, 1047].forEach((frequency, index) => this.tone(frequency, 0.42, 'sine', 0.055, index * 0.12)); }
      if (name === 'bird') { this.tone(1650, 0.08, 'sine', 0.018); this.tone(2050, 0.1, 'sine', 0.014, 0.08); }
      if (name === 'step') {
        const now = performance.now();
        if (now - this.lastStep < 320) return;
        this.lastStep = now;
        this.noise(0.055, 0.018);
      }
    }
  }

  window.Gaon = window.Gaon || {};
  window.Gaon.audio = new VillageAudio();
}());
