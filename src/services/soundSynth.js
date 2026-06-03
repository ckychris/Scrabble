// Web Audio Synth Engine for Cantonese Scrabble
class SoundSynth {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playTick() {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        this.ctx.currentTime + 0.05,
      );

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("Audio Context failed to play", e);
    }
  }

  playPlace() {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        250,
        this.ctx.currentTime + 0.08,
      );
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        this.ctx.currentTime + 0.08,
      );

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio Context failed to play", e);
    }
  }

  playCorrect() {
    try {
      this.init();

      // Harmonious major triad arpeggio (C5 -> E5 -> G5)
      this.playTone(523.25, 0.1, 0.04);
      setTimeout(() => this.playTone(659.25, 0.1, 0.04), 80);
      setTimeout(() => this.playTone(783.99, 0.25, 0.05), 160);
    } catch (e) {
      console.warn("Audio Context failed to play", e);
    }
  }

  playIncorrect() {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        this.ctx.currentTime + 0.25,
      );

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Audio Context failed to play", e);
    }
  }

  playRecall() {
    try {
      this.init();
      // Cascading descending tones
      this.playTone(600, 0.06, 0.03);
      setTimeout(() => this.playTone(500, 0.06, 0.03), 50);
      setTimeout(() => this.playTone(400, 0.08, 0.03), 100);
    } catch (e) {
      console.warn("Audio Context failed to play", e);
    }
  }

  playVictory() {
    try {
      this.init();
      // Upward sweeping victory chime
      this.playTone(523.25, 0.15, 0.05); // C5
      setTimeout(() => this.playTone(587.33, 0.15, 0.05), 100); // D5
      setTimeout(() => this.playTone(659.25, 0.15, 0.05), 200); // E5
      setTimeout(() => this.playTone(783.99, 0.15, 0.05), 300); // G5
      setTimeout(() => this.playTone(1046.5, 0.4, 0.06), 400); // C6
    } catch (e) {
      console.warn("Audio Context failed to play", e);
    }
  }

  playTone(freq, duration, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      this.ctx.currentTime + duration,
    );

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
}

export default new SoundSynth();
