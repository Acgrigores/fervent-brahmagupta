// Procedural Web Audio API sound synthesizer
// Provides rich game audio without requiring external mp3 assets
// Generates responsive step sound effects & adaptive biome background music

import { BiomeId } from '@/types/game';
import { BiomeMusicManager } from './biomeMusic';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private music: BiomeMusicManager = new BiomeMusicManager();
  private noiseBuffer: AudioBuffer | null = null;
  private stepFoot: boolean = false; // Alternates left/right footstep

  constructor() {
    // AudioContext will be initialized on first user interaction or explicit call
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.initCtx();
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio);
      window.addEventListener('keydown', unlockAudio);
      window.addEventListener('touchstart', unlockAudio);
    }
  }

  public initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.music.init(this.ctx);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    this.music.setEnabled(val);
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setBiome(biome: BiomeId) {
    this.initCtx();
    this.music.setBiome(biome);
  }

  public getBiome(): BiomeId | null {
    return this.music.getCurrentBiome();
  }

  public setMusicVolume(val: number) {
    this.music.setVolume(val);
  }

  public stopMusic() {
    this.music.stopAll();
  }

  // 1-second cached noise buffer for realistic footsteps & texture effects
  private getNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (!this.noiseBuffer) {
      const size = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < size; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return this.noiseBuffer;
  }

  // ===============================================================
  // 👣 PROCEDURAL DYNAMIC FOOTSTEPS FOR AVATAR MOVEMENT
  // Natural alternating left/right cadence with surface-specific acoustic textures
  // ===============================================================
  public playStep(biome: BiomeId = 'clearing') {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Alternate left foot vs right foot subtle frequency shift
    this.stepFoot = !this.stepFoot;
    const footMod = this.stepFoot ? 1.05 : 0.95;

    // 1. Low transient thump (shoe impact on ground)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    let baseFreq = 85;
    let noiseFilterFreq = 580;
    let noiseFilterType: BiquadFilterType = 'bandpass';
    let noiseFilterQ = 1.3;
    let stepDuration = 0.06;
    let oscGainVal = 0.055;
    let noiseGainVal = 0.045;

    switch (biome) {
      case 'clearing': // Farm dirt & grass path
        baseFreq = 85;
        noiseFilterFreq = 620;
        noiseFilterType = 'bandpass';
        noiseFilterQ = 1.3;
        stepDuration = 0.06;
        break;

      case 'forest': // Soft woodland earth & pine needles
        baseFreq = 95;
        noiseFilterFreq = 880;
        noiseFilterType = 'bandpass';
        noiseFilterQ = 1.2;
        stepDuration = 0.065;
        break;

      case 'lake': // Moist shoreline & wet pebbles
        baseFreq = 135;
        noiseFilterFreq = 1150;
        noiseFilterType = 'bandpass';
        noiseFilterQ = 1.6;
        stepDuration = 0.07;
        noiseGainVal = 0.05;
        break;

      case 'tundra': // Crisp snow & ice crust
        baseFreq = 110;
        noiseFilterFreq = 2200;
        noiseFilterType = 'highpass';
        noiseFilterQ = 1.8;
        stepDuration = 0.055;
        oscGainVal = 0.035;
        noiseGainVal = 0.065;
        break;

      case 'grasslands': // Dry prairie loam & rustling turf
        baseFreq = 90;
        noiseFilterFreq = 720;
        noiseFilterType = 'bandpass';
        noiseFilterQ = 1.1;
        stepDuration = 0.06;
        break;

      case 'desert': // Soft sliding sand
        baseFreq = 75;
        noiseFilterFreq = 780;
        noiseFilterType = 'lowpass';
        noiseFilterQ = 0.9;
        stepDuration = 0.075;
        oscGainVal = 0.04;
        noiseGainVal = 0.05;
        break;

      case 'reefs': // Wooden dock & shallow crystal water
        baseFreq = 150;
        noiseFilterFreq = 1350;
        noiseFilterType = 'bandpass';
        noiseFilterQ = 1.5;
        stepDuration = 0.065;
        noiseGainVal = 0.05;
        break;
    }

    const freq = baseFreq * footMod;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(28, freq * 0.45), t + stepDuration);

    oscGain.gain.setValueAtTime(oscGainVal, t);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t + stepDuration);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + stepDuration);

    // 2. Texture noise crunch (shoes scuffing dirt / leaves / snow / sand)
    const nBuf = this.getNoiseBuffer();
    if (nBuf) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = nBuf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = noiseFilterType;
      filter.frequency.setValueAtTime(noiseFilterFreq * footMod, t);
      filter.Q.setValueAtTime(noiseFilterQ, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(noiseGainVal, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + stepDuration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + stepDuration);
    }
  }

  // Sparkling coin pickup chime
  public playCoin() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, t + 0.08); // E6

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Major triumph fanfare for quest completions & badge unlock
  public playFanfare() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  // Soft dialogue speech chirp tailored to animal pitch
  public playAnimalChirp(pitchMultiplier: number = 1.0) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 400 * pitchMultiplier;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.linearRampToValueAtTime(baseFreq + 60, t + 0.04);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Lush flourishing bloom whoosh
  public playBloom() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.5);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.6);
  }

  // Water splash / quench sound
  public playWaterSplash() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Descending buzz for taking damage / losing a heart
  public playHurt() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.35);

    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.38);
  }

  // UI click sound
  public playClick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.03);

    gain.gain.setValueAtTime(0.045, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // 🍄 Spring boing sound for mushroom jumping
  public playBoing() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(580, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.28);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.32);
  }

  // ❄️ Crisp swoosh ice slide sound for tundra ice patch
  public playIceSlide() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const noise = this.getNoiseBuffer();
    if (!noise) return;

    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.25);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    src.start(t);
    src.stop(t + 0.3);
  }

  // 🦋 Butterfly flutter flutter sound
  public playFlutter() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [0, 0.05, 0.11, 0.18, 0.26].forEach((delay, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const freq = 650 + idx * 160;
      osc.frequency.setValueAtTime(freq, t + delay);
      osc.frequency.exponentialRampToValueAtTime(freq + 80, t + delay + 0.05);

      gain.gain.setValueAtTime(0.06, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + delay);
      osc.stop(t + delay + 0.06);
    });
  }

  // 🍂 Rustling leaves & wind chime for seasonal tree transition
  public playRustle() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const noise = this.getNoiseBuffer();
    if (noise) {
      const src = this.ctx.createBufferSource();
      src.buffer = noise;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(600, t + 0.45);
      filter.Q.value = 1.5;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      src.start(t);
      src.stop(t + 0.5);
    }

    // Melodic gentle chime tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1174, t + 0.35);

    oscGain.gain.setValueAtTime(0.05, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  // 🫧 Bubble pop sound for Nemo in reef
  public playBubble() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(860, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }
}

export const sounds = new SoundEngine();
