// Procedural Web Audio Music Synthesizer
// Provides separate, rich, adaptive ambient background music for each biome (including the Farm)
// Features distinct signature foley soundscapes, organic percussion grooves, and melodic identities
// Zero external mp3 dependencies, seamless loops, and smooth cross-fading

import { BiomeId } from '@/types/game';

interface BiomeTrackConfig {
  bpm: number;
  timbre: 'folk_piano' | 'flute_marimba' | 'water_bell' | 'ice_chime' | 'kalimba' | 'oud' | 'steel_pan';
  droneFreq: number; // Hz for warm ambient pad
  droneType: OscillatorType;
  droneFilterFreq: number;
  foleyType: 'farm_morning' | 'forest_canopy' | 'lake_shores' | 'tundra_blizzard' | 'grasslands_meadow' | 'desert_oasis' | 'reefs_ocean';
  percussionStyle: 'folk_brush' | 'bamboo_log' | 'water_bubble' | 'glacial_none' | 'prairie_shaker' | 'caravan_doumbek' | 'island_calypso';
  chords: number[][]; // MIDI chords for each of the 4 bars
  bassNotes: number[]; // MIDI bass notes for each bar
  // Melody events: [stepIndex (0..15), midiNote, durationInSteps]
  melodyEvents: [number, number, number][];
}

const BIOME_CONFIGS: Record<BiomeId, BiomeTrackConfig> = {
  // 1. Central Farm (Bayer Eco-Farm): Cozy pastoral folk, morning wind chimes, acoustic brush
  clearing: {
    bpm: 74,
    timbre: 'folk_piano',
    droneFreq: 130.81, // C3
    droneType: 'sine',
    droneFilterFreq: 520,
    foleyType: 'farm_morning',
    percussionStyle: 'folk_brush',
    chords: [
      [48, 55, 59, 64], // Cmaj7: C3, G3, B3, E4
      [45, 52, 55, 60], // Am7:   A2, E3, G3, C4
      [41, 48, 57, 64], // Fmaj7: F2, C3, A3, E4
      [43, 50, 55, 60], // Gsus4: G2, D3, G3, C4
    ],
    bassNotes: [36, 45, 41, 43], // C2, A2, F2, G2
    melodyEvents: [
      [0, 64, 1.5], // E4
      [2, 67, 1.5], // G4
      [4, 71, 1.0], // B4
      [5, 72, 1.0], // C5
      [6, 74, 2.0], // D5
      [8, 69, 1.5], // A4
      [10, 72, 1.5], // C5
      [12, 67, 2.0], // G4
      [14, 64, 2.0], // E4
    ],
  },

  // 2. Forest (Old-Growth Canopy): Mystic bamboo mist, songbirds, hollow bamboo percussion
  forest: {
    bpm: 56,
    timbre: 'flute_marimba',
    droneFreq: 146.83, // D3
    droneType: 'sine',
    droneFilterFreq: 460,
    foleyType: 'forest_canopy',
    percussionStyle: 'bamboo_log',
    chords: [
      [38, 45, 53, 60, 64], // Dm9:   D2, A2, F3, C4, E4
      [43, 47, 53, 57, 62], // G9:    G2, B2, F3, A3, D4
      [46, 53, 57, 62],     // Bbmaj7:Bb2, F3, A3, D4
      [45, 52, 55, 60],     // Am7:   A2, E3, G3, C4
    ],
    bassNotes: [38, 43, 46, 45],
    melodyEvents: [
      [0, 62, 2.0],  // D4
      [3, 65, 1.0],  // F4
      [4, 69, 2.0],  // A4
      [7, 72, 1.0],  // C5
      [8, 74, 2.5],  // D5
      [11, 76, 1.0], // E5
      [12, 72, 2.0], // C5
      [14, 69, 2.0], // A4
    ],
  },

  // 3. Lake (Crystal Marsh & Lake): Shoreline ripples, aquatic bubbles, cascading droplet bells
  lake: {
    bpm: 62,
    timbre: 'water_bell',
    droneFreq: 98.0, // G2
    droneType: 'sine',
    droneFilterFreq: 380,
    foleyType: 'lake_shores',
    percussionStyle: 'water_bubble',
    chords: [
      [39, 46, 55, 62], // Ebmaj7: Eb2, Bb2, G3, D4
      [44, 51, 60, 67], // Abmaj7: Ab2, Eb3, C4, G4
      [36, 43, 51, 58], // Cm9:    C2, G2, Eb3, Bb3
      [46, 53, 62, 65], // Bbadd9: Bb2, F3, D4, F4
    ],
    bassNotes: [39, 44, 36, 46],
    melodyEvents: [
      [0, 63, 1.5], // Eb4
      [2, 67, 1.5], // G4
      [4, 70, 1.5], // Bb4
      [6, 72, 1.5], // C5
      [8, 75, 2.0], // Eb5
      [10, 74, 1.5], // D5
      [12, 70, 2.0], // Bb4
      [14, 67, 2.0], // G4
    ],
  },

  // 4. Tundra (Glacial Permafrost): Howling arctic wind, crystal frost snaps, NO drums
  tundra: {
    bpm: 48,
    timbre: 'ice_chime',
    droneFreq: 82.41, // E2 (sub-polar drone)
    droneType: 'triangle',
    droneFilterFreq: 340,
    foleyType: 'tundra_blizzard',
    percussionStyle: 'glacial_none',
    chords: [
      [40, 47, 55, 62, 66], // Em9:   E2, B2, G3, D4, F#4
      [36, 43, 52, 59, 66], // Cmaj7: C2, G2, E3, B3, F#4
      [38, 45, 54, 59],     // D6:    D2, A2, F#3, B3
      [47, 54, 62, 69],     // Bm7:   B2, F#3, D4, A4
    ],
    bassNotes: [40, 36, 38, 47],
    melodyEvents: [
      [0, 71, 2.5],  // B4
      [3, 74, 1.5],  // D5
      [4, 78, 2.5],  // F#5
      [7, 83, 1.5],  // B5
      [8, 79, 2.5],  // G5
      [11, 76, 1.5], // E5
      [12, 74, 2.0], // D5
      [14, 71, 2.0], // B4
    ],
  },

  // 5. Grasslands (Prairie & Wheatlands): Summer cicadas, brisk acoustic shaker groove, cheerful kalimba
  grasslands: {
    bpm: 82,
    timbre: 'kalimba',
    droneFreq: 146.83, // D3
    droneType: 'triangle',
    droneFilterFreq: 490,
    foleyType: 'grasslands_meadow',
    percussionStyle: 'prairie_shaker',
    chords: [
      [38, 45, 54, 61], // Dmaj7: D2, A2, F#3, C#4
      [43, 50, 59, 64], // Gadd9: G2, D3, B3, E4
      [47, 54, 62, 69], // Bm7:   B2, F#3, D4, A4
      [45, 52, 57, 62], // Asus4: A2, E3, A3, D4
    ],
    bassNotes: [38, 43, 47, 45],
    melodyEvents: [
      [0, 62, 1.5], // D4
      [2, 66, 1.5], // F#4
      [4, 69, 1.0], // A4
      [5, 71, 1.0], // B4
      [6, 74, 2.0], // D5
      [8, 73, 1.5], // C#5
      [10, 69, 1.5], // A4
      [12, 66, 2.0], // F#4
      [14, 69, 2.0], // A4
    ],
  },

  // 6. Desert (Sunfire Savanna Oasis): Swirling sands, hypnotic caravan doumbek rhythm, exotic oud
  desert: {
    bpm: 64,
    timbre: 'oud',
    droneFreq: 146.83, // D3 (Tanpura drone)
    droneType: 'triangle',
    droneFilterFreq: 440,
    foleyType: 'desert_oasis',
    percussionStyle: 'caravan_doumbek',
    chords: [
      [38, 45, 54, 62], // D:  D2, A2, F#3, D4
      [39, 46, 55, 63], // Eb: Eb2, Bb2, G3, Eb4
      [43, 50, 58, 62], // Gm: G2, D3, Bb3, D4
      [38, 45, 54, 62], // D:  D2, A2, F#3, D4
    ],
    bassNotes: [38, 39, 43, 38],
    melodyEvents: [
      [0, 62, 1.5], // D4
      [2, 63, 1.5], // Eb4
      [4, 66, 2.0], // F#4
      [6, 67, 1.0], // G4
      [7, 66, 1.0], // F#4
      [8, 63, 1.5], // Eb4
      [10, 62, 1.5], // D4
      [12, 57, 2.0], // A3
      [14, 62, 2.0], // D4
    ],
  },

  // 7. Reefs (Hawksbill Coral Barrier): Rolling ocean wave breakers, calypso offbeat sway, steel pan
  reefs: {
    bpm: 70,
    timbre: 'steel_pan',
    droneFreq: 87.31, // F2 (ocean sub)
    droneType: 'sine',
    droneFilterFreq: 360,
    foleyType: 'reefs_ocean',
    percussionStyle: 'island_calypso',
    chords: [
      [41, 48, 57, 64], // Fmaj7: F2, C3, A3, E4
      [36, 43, 52, 59], // Cmaj7: C2, G2, E3, B3
      [38, 45, 53, 60], // Dm9:   D2, A2, F3, C4
      [43, 50, 53, 60], // G7sus: G2, D3, F3, C4
    ],
    bassNotes: [41, 36, 38, 43],
    melodyEvents: [
      [0, 65, 1.5], // F4
      [2, 69, 1.5], // A4
      [4, 72, 1.0], // C5
      [5, 76, 1.0], // E5
      [6, 77, 2.0], // F5
      [8, 76, 1.5], // E5
      [10, 72, 1.5], // C5
      [12, 69, 2.0], // A4
      [14, 72, 2.0], // C5
    ],
  },
};

class BiomeTrackInstance {
  private ctx: AudioContext;
  private config: BiomeTrackConfig;
  public biome: BiomeId;
  public trackGain: GainNode;
  private delayNode: DelayNode | null;
  private activeNodes: AudioNode[] = [];
  private intervalId: number | null = null;
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private isStopping: boolean = false;
  private cachedNoiseBuffer: AudioBuffer | null = null;

  constructor(
    ctx: AudioContext,
    biome: BiomeId,
    masterGain: GainNode,
    delayNode: DelayNode | null
  ) {
    this.ctx = ctx;
    this.biome = biome;
    this.config = BIOME_CONFIGS[biome] || BIOME_CONFIGS.clearing;
    this.delayNode = delayNode;

    this.trackGain = this.ctx.createGain();
    this.trackGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.trackGain.connect(masterGain);
    if (this.delayNode) {
      const sendGain = this.ctx.createGain();
      sendGain.gain.setValueAtTime(0.24, this.ctx.currentTime);
      this.trackGain.connect(sendGain);
      sendGain.connect(this.delayNode);
    }

    this.startDrone();
    this.startFoleyAmbience();
    this.startScheduler();
  }

  public fadeIn(durationSec: number = 1.4) {
    const t = this.ctx.currentTime;
    this.trackGain.gain.cancelScheduledValues(t);
    this.trackGain.gain.setValueAtTime(Math.max(0.0001, this.trackGain.gain.value), t);
    this.trackGain.gain.linearRampToValueAtTime(1.0, t + durationSec);
  }

  public fadeOut(durationSec: number = 1.2, onComplete?: () => void) {
    if (this.isStopping) return;
    this.isStopping = true;
    const t = this.ctx.currentTime;
    this.trackGain.gain.cancelScheduledValues(t);
    this.trackGain.gain.setValueAtTime(this.trackGain.gain.value, t);
    this.trackGain.gain.linearRampToValueAtTime(0.0001, t + durationSec);

    setTimeout(() => {
      this.dispose();
      if (onComplete) onComplete();
    }, (durationSec + 0.1) * 1000);
  }

  private getNoiseBuffer(): AudioBuffer {
    if (!this.cachedNoiseBuffer) {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.cachedNoiseBuffer = buffer;
    }
    return this.cachedNoiseBuffer;
  }

  // ===============================================================
  // 🌿 1. CORE HARMONIC DRONE / PAD
  // ===============================================================
  private startDrone() {
    try {
      const droneOsc = this.ctx.createOscillator();
      droneOsc.type = this.config.droneType;
      droneOsc.frequency.setValueAtTime(this.config.droneFreq, this.ctx.currentTime);

      const droneFilter = this.ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(this.config.droneFilterFreq, this.ctx.currentTime);

      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(0.055, this.ctx.currentTime);

      droneOsc.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(this.trackGain);

      droneOsc.start();
      this.activeNodes.push(droneOsc, droneFilter, droneGain);
    } catch (e) {
      console.warn('Could not start drone:', e);
    }
  }

  // ===============================================================
  // 🌊 2. SIGNATURE ENVIRONMENTAL FOLEY SOUNDSCAPES
  // Distinct natural acoustics (ocean surf, blizzards, cicadas, dunes)
  // ===============================================================
  private startFoleyAmbience() {
    try {
      const t = this.ctx.currentTime;
      const noiseBuffer = this.getNoiseBuffer();

      switch (this.config.foleyType) {
        // 🌊 Reefs: Rolling oceanic surf breakers swelling every 4.5 seconds
        case 'reefs_ocean': {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = noiseBuffer;
          noiseSrc.loop = true;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(260, t);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.015, t);

          // LFO for breathing ocean swell
          const lfo = this.ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.22, t); // ~4.5 second swell period

          const lfoFilterGain = this.ctx.createGain();
          lfoFilterGain.gain.setValueAtTime(500, t);
          lfo.connect(lfoFilterGain);
          lfoFilterGain.connect(filter.frequency);

          const lfoAmpGain = this.ctx.createGain();
          lfoAmpGain.gain.setValueAtTime(0.035, t);
          lfo.connect(lfoAmpGain);
          lfoAmpGain.connect(gain.gain);

          noiseSrc.connect(filter);
          filter.connect(gain);
          gain.connect(this.trackGain);

          noiseSrc.start();
          lfo.start();
          this.activeNodes.push(noiseSrc, filter, gain, lfo, lfoFilterGain, lfoAmpGain);
          break;
        }

        // ❄️ Tundra: Howling polar blizzard wind sweeping over ice floes
        case 'tundra_blizzard': {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = noiseBuffer;
          noiseSrc.loop = true;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(550, t);
          filter.Q.setValueAtTime(3.2, t);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.045, t);

          // Wind gust LFO
          const gustLfo = this.ctx.createOscillator();
          gustLfo.frequency.setValueAtTime(0.18, t); // slow gust cycle

          const gustMod = this.ctx.createGain();
          gustMod.gain.setValueAtTime(280, t);
          gustLfo.connect(gustMod);
          gustMod.connect(filter.frequency);

          noiseSrc.connect(filter);
          filter.connect(gain);
          gain.connect(this.trackGain);

          noiseSrc.start();
          gustLfo.start();
          this.activeNodes.push(noiseSrc, filter, gain, gustLfo, gustMod);
          break;
        }

        // 🌾 Grasslands: Summer cicadas buzzing in golden wheat
        case 'grasslands_meadow': {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = noiseBuffer;
          noiseSrc.loop = true;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(5200, t);
          filter.Q.setValueAtTime(2.5, t);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.02, t);

          // Fast insect tremolo LFO (10Hz)
          const tremolo = this.ctx.createOscillator();
          tremolo.frequency.setValueAtTime(10, t);

          const tremGain = this.ctx.createGain();
          tremGain.gain.setValueAtTime(0.012, t);
          tremolo.connect(tremGain);
          tremGain.connect(gain.gain);

          noiseSrc.connect(filter);
          filter.connect(gain);
          gain.connect(this.trackGain);

          noiseSrc.start();
          tremolo.start();
          this.activeNodes.push(noiseSrc, filter, gain, tremolo, tremGain);
          break;
        }

        // 🏜️ Desert: Whistling warm dune wind & sand friction
        case 'desert_oasis': {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = noiseBuffer;
          noiseSrc.loop = true;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(420, t);
          filter.Q.setValueAtTime(1.8, t);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.028, t);

          noiseSrc.connect(filter);
          filter.connect(gain);
          gain.connect(this.trackGain);

          noiseSrc.start();
          this.activeNodes.push(noiseSrc, filter, gain);
          break;
        }

        // 🌲 Forest: Canopy leaf murmur & woodland mist
        case 'forest_canopy': {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = noiseBuffer;
          noiseSrc.loop = true;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(680, t);
          filter.Q.setValueAtTime(1.2, t);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.025, t);

          noiseSrc.connect(filter);
          filter.connect(gain);
          gain.connect(this.trackGain);

          noiseSrc.start();
          this.activeNodes.push(noiseSrc, filter, gain);
          break;
        }

        // 💧 Lake: Gentle shoreline water lapping
        case 'lake_shores': {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = noiseBuffer;
          noiseSrc.loop = true;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(480, t);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.022, t);

          noiseSrc.connect(filter);
          filter.connect(gain);
          gain.connect(this.trackGain);

          noiseSrc.start();
          this.activeNodes.push(noiseSrc, filter, gain);
          break;
        }

        // 🏡 Central Farm: Sunny morning homestead warmth
        case 'farm_morning':
        default: {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = noiseBuffer;
          noiseSrc.loop = true;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(520, t);
          filter.Q.setValueAtTime(0.9, t);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.016, t);

          noiseSrc.connect(filter);
          filter.connect(gain);
          gain.connect(this.trackGain);

          noiseSrc.start();
          this.activeNodes.push(noiseSrc, filter, gain);
          break;
        }
      }
    } catch (e) {
      console.warn('Foley ambience error:', e);
    }
  }

  // ===============================================================
  // 🥁 3. MUSIC & PERCUSSION SCHEDULER
  // ===============================================================
  private startScheduler() {
    const stepDuration = 60 / this.config.bpm / 2; // eighth-note step duration
    this.nextStepTime = this.ctx.currentTime + 0.1;

    this.intervalId = window.setInterval(() => {
      if (this.isStopping) return;

      const scheduleAhead = 0.35;
      while (this.nextStepTime < this.ctx.currentTime + scheduleAhead) {
        this.scheduleStep(this.currentStep, this.nextStepTime, stepDuration);
        this.nextStepTime += stepDuration;
        this.currentStep = (this.currentStep + 1) % 16;
      }
    }, 60);
  }

  private scheduleStep(step: number, time: number, stepDuration: number) {
    const barIndex = Math.floor(step / 4);
    const stepInBar = step % 4;

    // 1. Bass note on downbeat of bar (rich, deep acoustic anchor)
    if (stepInBar === 0) {
      const bassMidi = this.config.bassNotes[barIndex] || 36;
      this.playSynthNote(bassMidi, time, stepDuration * 3.6, 'bass', 0.12);
    }

    // 2. Harmonic chord pad on beat 0 and beat 2 of bar
    if (stepInBar === 0 || stepInBar === 2) {
      const chord = this.config.chords[barIndex] || [];
      for (const noteMidi of chord) {
        this.playSynthNote(noteMidi, time, stepDuration * 2.8, 'pad', 0.05);
      }
    }

    // 3. Melodic motifs and arpeggios
    const melodyEvents = this.config.melodyEvents.filter((ev) => ev[0] === step);
    for (const [, midi, durSteps] of melodyEvents) {
      this.playSynthNote(midi, time, stepDuration * durSteps, this.config.timbre, 0.10);
    }

    // 4. Distinct Rhythmic Percussion Textures for each biome
    this.schedulePercussion(step, time);
  }

  // ===============================================================
  // 🪘 4. PROCEDURAL BIOME PERCUSSION & RHYTHMIC GROOVES
  // ===============================================================
  private schedulePercussion(step: number, time: number) {
    if (this.isStopping) return;

    try {
      switch (this.config.percussionStyle) {
        // 🏜️ Desert: Caravan Doumbek groove (Dum on 1, Tek on 2.5)
        case 'caravan_doumbek': {
          if (step % 4 === 0) {
            // Low resonant Doumbek "Dum"
            this.playDrumThump(time, 92, 40, 0.11, 0.09);
          } else if (step % 4 === 2) {
            // High snappy Doumbek "Tek"
            this.playDrumClick(time, 880, 0.04, 0.06);
          } else if (step % 8 === 7) {
            // Soft pickup "Ka"
            this.playDrumClick(time, 720, 0.03, 0.04);
          }
          break;
        }

        // 🌾 Grasslands: Crisp acoustic 16th-note prairie shaker
        case 'prairie_shaker': {
          const isAccent = step % 4 === 2;
          this.playShakerTick(time, isAccent ? 0.06 : 0.035, isAccent ? 4800 : 5400);
          break;
        }

        // 🌊 Reefs: Island calypso offbeat clave & buoyant bubble pop
        case 'island_calypso': {
          if (step % 2 === 1) {
            // Reggae / Calypso offbeat woodblock
            this.playDrumClick(time, 1150, 0.03, 0.06);
          }
          if (step % 4 === 2) {
            // Underwater bubble pop
            this.playBubblePop(time, 420, 780, 0.05);
          }
          break;
        }

        // 🌲 Forest: Hollow bamboo log drum & soft branch tap
        case 'bamboo_log': {
          if (step % 4 === 0) {
            this.playDrumThump(time, 210, 105, 0.08, 0.075);
          } else if (step % 8 === 6) {
            this.playDrumClick(time, 1200, 0.025, 0.045);
          }
          break;
        }

        // 💧 Lake: Freshwater bubbles & droplet pings
        case 'water_bubble': {
          if (step % 4 === 1 || step % 4 === 3) {
            this.playBubblePop(time, 480, 840, 0.045);
          }
          break;
        }

        // 🏡 Farm: Warm acoustic folk wire brush tap on backbeats
        case 'folk_brush': {
          if (step % 4 === 2) {
            this.playShakerTick(time, 0.05, 3400);
          }
          break;
        }

        // ❄️ Tundra: NO DRUMS (spacious glacial breathing stillness)
        case 'glacial_none':
        default:
          break;
      }
    } catch (e) {
      console.warn('Percussion schedule error:', e);
    }
  }

  // --- Drum Synthesizer Helpers ---
  private playDrumThump(time: number, startFreq: number, endFreq: number, dur: number, vol: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + dur);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(gain);
    gain.connect(this.trackGain);
    osc.start(time);
    osc.stop(time + dur);
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };
  }

  private playDrumClick(time: number, freq: number, dur: number, vol: number) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, time);
    filter.Q.setValueAtTime(3.5, time);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.trackGain);
    osc.start(time);
    osc.stop(time + dur);
    osc.onended = () => {
      try {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {}
    };
  }

  private playShakerTick(time: number, vol: number, filterFreq: number) {
    const nBuf = this.getNoiseBuffer();
    const src = this.ctx.createBufferSource();
    src.buffer = nBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(filterFreq, time);
    const gain = this.ctx.createGain();
    const dur = 0.035;
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.trackGain);
    src.start(time);
    src.stop(time + dur);
    src.onended = () => {
      try {
        src.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {}
    };
  }

  private playBubblePop(time: number, startFreq: number, endFreq: number, vol: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dur = 0.04;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + dur);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(gain);
    gain.connect(this.trackGain);
    osc.start(time);
    osc.stop(time + dur);
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };
  }

  // ===============================================================
  // 🎹 5. INSTRUMENT TIMBRE SYNTHESIZER
  // ===============================================================
  private playSynthNote(
    midi: number,
    time: number,
    duration: number,
    timbre: string,
    volume: number
  ) {
    if (this.isStopping) return;

    try {
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      switch (timbre) {
        case 'folk_piano':
          osc.type = 'triangle';
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2400, time);
          filter.frequency.exponentialRampToValueAtTime(800, time + duration);
          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.linearRampToValueAtTime(volume, time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
          break;

        case 'flute_marimba':
          osc.type = 'sine';
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1700, time);
          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.linearRampToValueAtTime(volume * 0.95, time + 0.035);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + duration * 1.1);
          break;

        case 'water_bell':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq + 26, time);
          osc.frequency.exponentialRampToValueAtTime(freq, time + 0.035);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(3200, time);
          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.linearRampToValueAtTime(volume, time + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.9);
          break;

        case 'ice_chime':
          osc.type = 'sine';
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(freq, time);
          filter.Q.setValueAtTime(2.2, time);
          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.linearRampToValueAtTime(volume * 0.9, time + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(1.8, duration * 1.8));
          break;

        case 'kalimba':
          osc.type = 'triangle';
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(freq * 1.45, time);
          filter.Q.setValueAtTime(1.6, time);
          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.linearRampToValueAtTime(volume * 0.95, time + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.85);
          break;

        case 'oud':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq * 1.05, time);
          osc.frequency.linearRampToValueAtTime(freq, time + 0.022);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2100, time);
          filter.frequency.exponentialRampToValueAtTime(600, time + duration);
          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.linearRampToValueAtTime(volume, time + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
          break;

        case 'steel_pan':
          osc.type = 'sine';
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2800, time);
          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.linearRampToValueAtTime(volume, time + 0.018);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.95);
          break;

        case 'bass':
          osc.type = 'triangle';
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(260, time);
          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.linearRampToValueAtTime(volume, time + 0.035);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
          break;

        case 'pad':
        default:
          osc.type = 'sine';
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(700, time);
          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.linearRampToValueAtTime(volume, time + 0.25);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
          break;
      }

      osc.frequency.setValueAtTime(freq, time);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.trackGain);

      osc.start(time);
      const stopTime = time + Math.max(duration * 2.2, 0.6);
      osc.stop(stopTime);

      osc.onended = () => {
        try {
          osc.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {
          // ignore
        }
      };
    } catch (e) {
      console.warn('Note schedule failed:', e);
    }
  }

  public dispose() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    for (const node of this.activeNodes) {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        if ('disconnect' in node && typeof (node as AudioNode).disconnect === 'function') {
          (node as AudioNode).disconnect();
        }
      } catch {
        // ignore
      }
    }
    this.activeNodes = [];
    try {
      this.trackGain.disconnect();
    } catch {
      // ignore
    }
  }
}

export class BiomeMusicManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private currentBiome: BiomeId | null = null;
  private currentTrack: BiomeTrackInstance | null = null;
  private fadingTracks: Set<BiomeTrackInstance> = new Set();
  private enabled: boolean = true;
  private musicVolume: number = 0.42; // Elevated background music volume for crisp audible presence

  public init(ctx: AudioContext) {
    if (this.ctx === ctx && this.masterGain) return;
    this.ctx = ctx;

    // Master Music Gain Bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.enabled ? this.musicVolume : 0.0001, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Warm Ambient Echo / Spatial Delay Bus
    try {
      this.delayNode = this.ctx.createDelay();
      this.delayNode.delayTime.setValueAtTime(0.36, this.ctx.currentTime);

      const delayFeedback = this.ctx.createGain();
      delayFeedback.gain.setValueAtTime(0.25, this.ctx.currentTime);

      const delayFilter = this.ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.setValueAtTime(1500, this.ctx.currentTime);

      this.delayNode.connect(delayFilter);
      delayFilter.connect(delayFeedback);
      delayFeedback.connect(this.delayNode);
      delayFilter.connect(this.masterGain);
    } catch (e) {
      console.warn('Delay bus setup error:', e);
      this.delayNode = null;
    }

    // If a biome was set before AudioContext was ready, start it now
    if (this.currentBiome && !this.currentTrack) {
      this.setBiome(this.currentBiome);
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(
        enabled ? this.musicVolume : 0.0001,
        t + 0.2
      );
    }

    if (enabled && !this.currentTrack && this.currentBiome && this.ctx) {
      this.setBiome(this.currentBiome);
    }
  }

  public setVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx && this.enabled) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.linearRampToValueAtTime(this.musicVolume, t + 0.1);
    }
  }

  public getCurrentBiome(): BiomeId | null {
    return this.currentBiome;
  }

  public setBiome(biome: BiomeId) {
    this.currentBiome = biome;
    if (!this.ctx || !this.masterGain) return;

    // If this biome is already playing as the current track, nothing to do
    if (this.currentTrack && this.currentTrack.biome === biome) {
      return;
    }

    // 1. Crossfade out the existing track
    if (this.currentTrack) {
      const oldTrack = this.currentTrack;
      this.fadingTracks.add(oldTrack);
      oldTrack.fadeOut(1.3, () => {
        this.fadingTracks.delete(oldTrack);
      });
      this.currentTrack = null;
    }

    // 2. Instantiate and crossfade in the new biome track
    try {
      const newTrack = new BiomeTrackInstance(
        this.ctx,
        biome,
        this.masterGain,
        this.delayNode
      );
      newTrack.fadeIn(1.5);
      this.currentTrack = newTrack;
    } catch (e) {
      console.warn('Failed to start biome music track:', e);
    }
  }

  public stopAll() {
    if (this.currentTrack) {
      this.currentTrack.fadeOut(0.3);
      this.currentTrack = null;
    }
    this.fadingTracks.forEach((track) => {
      track.fadeOut(0.3);
    });
    this.fadingTracks.clear();
  }
}
