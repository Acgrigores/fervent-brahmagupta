'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { AnimalInfo, Quest } from '@/types/game';
import { shuffle, seeded, makeLayer, mix, outlineArt, applyHurtShake, drawHurtFeedback } from './canvasFx';
import { X, Heart, ArrowRight, RotateCcw, Coins, Trophy } from 'lucide-react';

// ---------------------------------------------------------------
// Coralia's reef questions. Each answer gets matched to a coral color.
// ---------------------------------------------------------------
interface ReefQuestion {
  q: string;
  options: string[];
  answer: string;
  fact: string;
}

const QUESTIONS: ReefQuestion[] = [
  {
    q: 'What are coral reefs made of?',
    options: ['Tiny animals called coral polyps', 'Plain rocks', 'Underwater plants', 'Sand castles'],
    answer: 'Tiny animals called coral polyps',
    fact: 'Coral polyps are tiny animals that build hard skeletons. Millions of them together make a reef!',
  },
  {
    q: 'What gives many corals their bright colors?',
    options: ['Tiny algae living inside them', 'Paint from boats', 'Fish scales', 'Moonlight'],
    answer: 'Tiny algae living inside them',
    fact: 'Corals share their homes with tiny algae that make food from sunlight and give them their colors.',
  },
  {
    q: 'What is coral bleaching?',
    options: ['Corals turning white when the water gets too hot', 'Divers cleaning the coral', 'Corals going to sleep', 'Fish painting the coral'],
    answer: 'Corals turning white when the water gets too hot',
    fact: 'When water gets too warm, corals push out their algae and turn white. If it lasts too long, they starve.',
  },
  {
    q: 'Hawksbill sea turtles help reefs stay healthy by eating what?',
    options: ['Sea sponges', 'Coral', 'Sharks', 'Sand'],
    answer: 'Sea sponges',
    fact: 'Hawksbills munch on sponges that would otherwise crowd out and smother the coral.',
  },
  {
    q: 'About how much of all ocean life depends on coral reefs?',
    options: ['About one quarter', 'Almost none', 'Just one fish', 'Only the sharks'],
    answer: 'About one quarter',
    fact: 'Reefs cover less than 1% of the ocean floor, but about a quarter of all sea creatures rely on them!',
  },
  {
    q: 'Which sunscreen is kinder to coral reefs?',
    options: ['Reef-safe mineral sunscreen', 'Any spray sunscreen', 'Extra oily sunscreen', 'Sunscreen makes no difference'],
    answer: 'Reef-safe mineral sunscreen',
    fact: 'Some sunscreen chemicals harm baby corals. Mineral sunscreens like zinc oxide are a safer choice.',
  },
  {
    q: 'Why should you never stand on or touch coral?',
    options: ['It can hurt or kill the living polyps', 'It is too cold', 'It will turn into gold', 'It is fine to touch'],
    answer: 'It can hurt or kill the living polyps',
    fact: 'Coral is alive! Even a gentle touch can damage the thin layer of polyps.',
  },
  {
    q: 'How can ships help protect coral reefs?',
    options: ['Use GPS and charts to steer around reefs', 'Drop anchors on the coral', 'Sail faster over reefs', 'Turn off their lights'],
    answer: 'Use GPS and charts to steer around reefs',
    fact: 'Ships that run aground or drop anchor can crush reefs that took hundreds of years to grow.',
  },
  {
    q: 'What is the largest coral reef in the world?',
    options: ['The Great Barrier Reef', 'The Grand Canyon Reef', 'The Arctic Reef', 'The Amazon Reef'],
    answer: 'The Great Barrier Reef',
    fact: "Australia's Great Barrier Reef is so big it can be seen from space!",
  },
  {
    q: 'What happens when the ocean soaks up too much carbon dioxide?',
    options: ['It turns more acidic and coral struggles to build', 'It gets sweeter', 'It freezes', 'Coral grows twice as fast'],
    answer: 'It turns more acidic and coral struggles to build',
    fact: 'More acidic water makes it harder for corals and shellfish to build their hard skeletons and shells.',
  },
  {
    q: 'Which fish famously lives among sea anemones on the reef?',
    options: ['Clownfish', 'Penguin', 'Polar bear', 'Seal'],
    answer: 'Clownfish',
    fact: 'Clownfish are protected from the anemone\'s sting by a special slime coat. Penguins and polar bears live far from reefs!',
  },
  {
    q: 'What is one thing you can do at home to help coral reefs?',
    options: ['Use less plastic and save energy', 'Pour chemicals down the drain', 'Leave the lights on all day', 'Buy souvenirs made of coral'],
    answer: 'Use less plastic and save energy',
    fact: 'Less plastic means less ocean trash, and saving energy helps keep ocean water from warming.',
  },
];

// ---------------------------------------------------------------
// Coral colors and pixel art. Each question offers 4 of these at random,
// and every coral that grows gets its own slight shade, so no two reefs match.
// ---------------------------------------------------------------
interface CoralColor {
  name: string;
  base: string;
  light: string;
  dark: string;
}

const CORAL_COLORS: CoralColor[] = [
  { name: 'PINK', base: '#f472b6', light: '#fbcfe8', dark: '#be185d' },
  { name: 'ORANGE', base: '#fb923c', light: '#fed7aa', dark: '#c2410c' },
  { name: 'PURPLE', base: '#a78bfa', light: '#ddd6fe', dark: '#6d28d9' },
  { name: 'YELLOW', base: '#facc15', light: '#fef08a', dark: '#a16207' },
  { name: 'RED', base: '#ef4444', light: '#fecaca', dark: '#991b1b' },
  { name: 'TEAL', base: '#2dd4bf', light: '#ccfbf1', dark: '#0f766e' },
  { name: 'BLUE', base: '#60a5fa', light: '#dbeafe', dark: '#1d4ed8' },
  { name: 'LIME', base: '#a3e635', light: '#ecfccb', dark: '#4d7c0f' },
  { name: 'MAGENTA', base: '#e879f9', light: '#fae8ff', dark: '#a21caf' },
  { name: 'PEACH', base: '#fdba74', light: '#ffedd5', dark: '#c2410c' },
  { name: 'LAVENDER', base: '#c4b5fd', light: '#ede9fe', dark: '#7c3aed' },
  { name: 'CORAL', base: '#fb7185', light: '#ffe4e6', dark: '#be123c' },
];
const BLEACHED: CoralColor = { name: 'BLEACHED', base: '#f5f5f4', light: '#ffffff', dark: '#a8a29e' };
const OPTIONS_PER_QUESTION = 4;
type CoralKind = 'branch' | 'brain' | 'fan';
const KINDS: CoralKind[] = ['branch', 'brain', 'fan'];
const ART = 18; // coral art canvas size (art pixels)
const P = 3; // coral art pixel size on the canvas

// Lightens/darkens every channel of a hex color
function shiftColor(hex: string, d: number) {
  const v = [1, 3, 5].map((i) => Math.max(0, Math.min(255, parseInt(hex.slice(i, i + 2), 16) + d)));
  return `#${v.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function jitterColor(c: CoralColor): CoralColor {
  const d = Math.round((Math.random() - 0.5) * 40);
  return { ...c, base: shiftColor(c.base, d), light: shiftColor(c.light, Math.round(d / 2)), dark: shiftColor(c.dark, d) };
}

function buildCoral(kind: CoralKind, c: CoralColor) {
  return makeLayer(ART, ART, (ctx) => {
    const px = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    };
    if (kind === 'branch') {
      // Antler-like branches with light tips
      const branches: [number, number, number, number][] = [
        [8, 16, 8, 6],
        [8, 12, 4, 7],
        [4, 7, 3, 3],
        [8, 11, 12, 6],
        [12, 6, 14, 2],
        [8, 8, 9, 2],
        [4, 9, 2, 6],
        [12, 9, 15, 7],
      ];
      branches.forEach(([x1, y1, x2, y2]) => {
        const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
        for (let i = 0; i <= steps; i++) {
          px(Math.round(x1 + ((x2 - x1) * i) / steps), Math.round(y1 + ((y2 - y1) * i) / steps), 2, 1, i < steps / 2 ? c.dark : c.base);
        }
        px(x2, y2, 2, 2, c.light);
      });
      px(6, 16, 6, 1, c.dark);
    } else if (kind === 'brain') {
      // Round dome with winding grooves
      for (let y = 6; y <= 16; y++) {
        const half = Math.round(7 * Math.sqrt(Math.max(0, 1 - ((y - 12) / 6.5) ** 2)));
        px(9 - half, y, half * 2, 1, y < 9 ? c.light : c.base);
      }
      [[4, 10], [6, 9], [8, 10], [10, 9], [12, 10], [5, 13], [7, 12], [9, 13], [11, 12], [13, 13], [6, 15], [10, 15]].forEach(([x, y]) =>
        px(x, y, 2, 1, c.dark)
      );
    } else {
      // Sea fan: a lacy fan on a short stalk
      for (let y = 2; y <= 13; y++) {
        const half = Math.round(7 * Math.sqrt(Math.max(0, 1 - ((y - 9) / 7.5) ** 2)));
        for (let x = 9 - half; x < 9 + half; x++) {
          const lace = (x + y) % 3 === 0 || (x - y + 30) % 4 === 0;
          px(x, y, 1, 1, lace ? c.dark : y < 6 ? c.light : c.base);
        }
      }
      px(8, 13, 2, 4, c.dark);
    }
    outlineArt(ctx, ART, ART, '#2a1a2e');
  });
}

// ---------------------------------------------------------------
// Scene
// ---------------------------------------------------------------
const W = 640;
const H = 360;
const ROCK = { cx: 320, cy: 268, rx: 150, ry: 70 };
const SAND_Y = 300;
const GOAL = 8;
const START_LIVES = 3;
const COINS_PER_CORAL = 5;
const REEF_BONUS = 30;

// A few water and rock tints, picked at random each game
const WATER_TINTS = [
  ['#38bdf8', '#0c4a6e'],
  ['#22d3ee', '#164e63'],
  ['#5eead4', '#134e4a'],
  ['#60a5fa', '#1e3a8a'],
];
const ROCK_TINTS = [
  ['#a8a29e', '#8b8580', '#6f6a66', '#57534e'],
  ['#b3a491', '#968773', '#796b5a', '#5f5245'],
  ['#9ca3af', '#7f8792', '#646b75', '#4b5159'],
];

function rockShape(x: number, y: number) {
  const nx = (x - ROCK.cx) / ROCK.rx;
  const ny = (y - ROCK.cy) / ROCK.ry;
  const wobble = 1 + 0.06 * Math.sin(nx * 9) + 0.04 * Math.sin(nx * 23 + 1);
  return { d: nx * nx + ny * ny, wobble };
}

// Generous hit area for dropping a coral on (or near) the rock
function overRock(x: number, y: number) {
  return ((x - ROCK.cx) / (ROCK.rx + 20)) ** 2 + ((y - ROCK.cy) / (ROCK.ry + 40)) ** 2 <= 1;
}

// Where a coral dropped at (x, y) takes root: right there if it's on the rock, otherwise the nearest rock surface
function rootOnRock(x: number, y: number) {
  let px = x;
  let py = Math.min(y, SAND_Y + 6);
  for (let i = 0; i < 40; i++) {
    const { d, wobble } = rockShape(px, py);
    if (d <= wobble * 0.92) break;
    px += (ROCK.cx - px) * 0.08;
    py += (ROCK.cy - py) * 0.08;
  }
  return { x: Math.round(px), y: Math.round(py) };
}

function buildBackground(tint: string[]) {
  return makeLayer(W, H, (ctx) => {
    const rand = seeded(19);
    // Water: bright near the surface, deep below
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = mix(tint[0], tint[1], i / 17);
      ctx.fillRect(0, i * 20, W, 20);
    }
    // Distant reef silhouettes
    ctx.fillStyle = mix(tint[1], '#0f766e', 0.4);
    for (let x = 0; x < W; x += 4) {
      const h = 30 + Math.round((Math.sin(x / 37) * 12 + Math.sin(x / 13) * 6) / 2) * 2;
      ctx.fillRect(x, SAND_Y - h, 4, h);
    }
    // Sand floor with ripples and shells
    ctx.fillStyle = '#e9d39b';
    ctx.fillRect(0, SAND_Y, W, H - SAND_Y);
    ctx.fillStyle = '#f5e4b5';
    ctx.fillRect(0, SAND_Y, W, 4);
    for (let i = 0; i < 70; i++) {
      const x = Math.floor((rand() * W) / 2) * 2;
      const y = SAND_Y + 8 + Math.floor((rand() * (H - SAND_Y - 12)) / 2) * 2;
      ctx.fillStyle = rand() < 0.6 ? '#d6bd82' : '#fbefcf';
      ctx.fillRect(x, y, rand() < 0.4 ? 10 : 4, 2);
    }
    [[60, 330], [560, 340], [500, 322], [110, 346]].forEach(([x, y]) => {
      ctx.fillStyle = '#fda4af';
      ctx.fillRect(x, y, 8, 4);
      ctx.fillRect(x + 2, y - 2, 4, 2);
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(x + 2, y, 2, 4);
    });
  });
}

function buildRock(tone: string[]) {
  return makeLayer(W, H, (ctx) => {
    const rand = seeded(7);
    for (let y = ROCK.cy - ROCK.ry; y <= ROCK.cy + ROCK.ry; y += 2) {
      for (let x = ROCK.cx - ROCK.rx; x <= ROCK.cx + ROCK.rx; x += 2) {
        const { d, wobble } = rockShape(x, y);
        if (d > wobble || y > SAND_Y + 14) continue;
        const nx = (x - ROCK.cx) / ROCK.rx;
        const ny = (y - ROCK.cy) / ROCK.ry;
        const shade = nx * 0.5 + ny * 0.8; // lit from the upper left
        ctx.fillStyle = d > wobble - 0.08 ? '#3f3f46' : shade < -0.45 ? tone[0] : shade < 0.1 ? tone[1] : shade < 0.5 ? tone[2] : tone[3];
        if (rand() < 0.05) ctx.fillStyle = tone[1];
        ctx.fillRect(x, y, 2, 2);
      }
    }
    // Cracks and little algae spots
    ctx.fillStyle = '#44403c';
    [[250, 260, 14], [380, 250, 10], [330, 290, 12]].forEach(([x, y, len]) => {
      for (let i = 0; i < len; i++) ctx.fillRect(x + i * 2, y + Math.round(Math.sin(i) * 2), 2, 2);
    });
    ctx.fillStyle = '#4d7c0f';
    [[200, 280], [440, 270], [300, 296], [360, 300]].forEach(([x, y]) => ctx.fillRect(x, y, 4, 2));
  });
}

interface Grown {
  x: number;
  y: number;
  sprite: HTMLCanvasElement;
  t: number;
  crumble: boolean;
}

interface Fish {
  x: number;
  y: number;
  speed: number;
  color: string;
}

type Mode = 'asking' | 'feedback' | 'won' | 'gameover';

// ---------------------------------------------------------------
interface Props {
  animal: AnimalInfo;
  isHappy: boolean;
  quest?: Quest;
  onClose: () => void;
  onStartQuest: () => void;
}

const pickColors = () => shuffle(CORAL_COLORS.map((_, i) => i)).slice(0, OPTIONS_PER_QUESTION);

export default function CoraliaReefGame({ animal, isHappy, quest, onClose, onStartQuest }: Props) {
  const { addCoins } = useGameState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const addCoinsRef = useRef(addCoins);
  addCoinsRef.current = addCoins;

  const scene = useRef({
    grown: [] as Grown[],
    fish: [] as Fish[],
    time: 0,
    hurtTime: -10,
    rockHover: false,
    sparkles: [] as { x: number; y: number; t: number }[],
    corals: 0,
  });

  const [deck, setDeck] = useState<ReefQuestion[]>(() => shuffle(QUESTIONS));
  const [qIndex, setQIndex] = useState(0);
  const [colorOrder, setColorOrder] = useState<number[]>(pickColors);
  const [tints, setTints] = useState(() => ({ water: Math.floor(Math.random() * WATER_TINTS.length), rock: Math.floor(Math.random() * ROCK_TINTS.length) }));
  const [mode, setMode] = useState<Mode>('asking');
  const [lives, setLives] = useState(START_LIVES);
  const [corals, setCorals] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ option: number; x: number; y: number; startX: number; startY: number; moved: boolean } | null>(null);
  const [swatches, setSwatches] = useState<string[]>([]);
  const [canvasSize, setCanvasSize] = useState({ w: W, h: H });

  const question = deck[qIndex % deck.length];
  // The canvas loop reads lives without restarting
  const livesRef = useRef(lives);
  livesRef.current = lives;

  // Coral swatch images for the palette (pixel art from the same sprites)
  useEffect(() => {
    setSwatches(CORAL_COLORS.map((c) => buildCoral('branch', c).toDataURL()));
  }, []);

  useEffect(() => {
    sounds.playAnimalChirp(animal.voicePitch);
  }, [animal.voicePitch, qIndex]);

  // Size the canvas to the largest 16:9 box that fits the space left in the window
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fit = () => {
      const { width, height } = stage.getBoundingClientRect();
      const w = Math.max(160, Math.min(width, (height * W) / H));
      setCanvasSize({ w: Math.floor(w), h: Math.floor((w * H) / W) });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [isHappy]);

  // option = which answer was dropped; (x, y) = where on the canvas it was dropped
  const submit = useCallback(
    (option: number, x: number, y: number) => {
      if (mode !== 'asking') return;
      const s = scene.current;
      const color = CORAL_COLORS[colorOrder[option]];
      const correct = question.options[option] === question.answer;
      const root = rootOnRock(x, y);
      setSelected(null);

      if (correct) {
        const kind = KINDS[Math.floor(Math.random() * KINDS.length)];
        s.grown.push({ ...root, sprite: buildCoral(kind, jitterColor(color)), t: 0, crumble: false });
        for (let i = 0; i < 10; i++) s.sparkles.push({ x: root.x + (Math.random() - 0.5) * 50, y: root.y - Math.random() * 50, t: -Math.random() * 0.4 });
        s.fish.push({ x: -20, y: 60 + Math.random() * 150, speed: 30 + Math.random() * 40, color: CORAL_COLORS[Math.floor(Math.random() * CORAL_COLORS.length)].base });
        sounds.playBloom();
        addCoinsRef.current(animal.biome, COINS_PER_CORAL);
        s.corals += 1;
        setCorals(s.corals);
        if (s.corals >= GOAL) {
          sounds.playFanfare();
          addCoinsRef.current(animal.biome, REEF_BONUS);
          setFeedback({ correct: true, text: `Yes! ${question.fact} And look... my rock is a whole reef now! Thank you, friend!` });
          setMode('won');
          return;
        }
        setFeedback({ correct: true, text: `Yes! ${question.fact}` });
      } else {
        // A bleached coral sprouts where it was dropped, then crumbles away
        s.grown.push({ ...root, sprite: buildCoral('branch', BLEACHED), t: 0, crumble: true });
        s.hurtTime = s.time;
        sounds.playHurt();
        const left = livesRef.current - 1;
        setLives(left);
        const rightColor = CORAL_COLORS[colorOrder[question.options.indexOf(question.answer)]].name.toLowerCase();
        if (left <= 0) {
          setFeedback({ correct: false, text: `Oh no... the answer was "${question.answer}" (the ${rightColor} coral). ${question.fact} We're out of hearts!` });
          setMode('gameover');
          return;
        }
        setFeedback({ correct: false, text: `Not quite! The answer was "${question.answer}" (the ${rightColor} coral). ${question.fact}` });
      }
      setMode('feedback');
    },
    [mode, colorOrder, question, animal.biome]
  );

  const nextQuestion = () => {
    sounds.playClick();
    const next = qIndex + 1;
    if (next % deck.length === 0) setDeck(shuffle(QUESTIONS));
    setQIndex(next);
    setColorOrder(pickColors());
    setFeedback(null);
    setMode('asking');
  };

  const restart = () => {
    sounds.playClick();
    Object.assign(scene.current, { grown: [], fish: [], hurtTime: -10, sparkles: [], corals: 0 });
    setDeck(shuffle(QUESTIONS));
    setQIndex(0);
    setColorOrder(pickColors());
    setTints({ water: Math.floor(Math.random() * WATER_TINTS.length), rock: Math.floor(Math.random() * ROCK_TINTS.length) });
    setLives(START_LIVES);
    setCorals(0);
    setFeedback(null);
    setSelected(null);
    setDrag(null);
    scene.current.rockHover = false;
    setMode('asking');
    sounds.playAnimalChirp(animal.voicePitch);
  };

  // ---- Dragging corals from the palette onto the rock ----
  const toCanvas = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    return x >= 0 && y >= 0 && x <= W && y <= H ? { x, y } : null;
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY, moved: d.moved || Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 6 } : d));
      const p = toCanvas(e.clientX, e.clientY);
      scene.current.rockHover = !!p && overRock(p.x, p.y);
    };
    const up = (e: PointerEvent) => {
      const p = toCanvas(e.clientX, e.clientY);
      scene.current.rockHover = false;
      const d = drag;
      setDrag(null);
      if (p && overRock(p.x, p.y)) submit(d.option, p.x, p.y);
      else if (!d.moved) {
        // A tap (no drag) selects the coral; then tap a spot on the rock
        sounds.playClick();
        setSelected((cur) => (cur === d.option ? null : d.option));
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [drag, submit]);

  // ---- Render loop ----
  useEffect(() => {
    if (!isHappy) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;
    const background = buildBackground(WATER_TINTS[tints.water]);
    const rock = buildRock(ROCK_TINTS[tints.rock]);
    const bubbles = Array.from({ length: 14 }, (_, i) => ({ x: (i * 47) % W, y: Math.random() * H, speed: 15 + Math.random() * 25 }));

    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const s = scene.current;
      s.time += dt;

      ctx.save();
      applyHurtShake(ctx, s.time - s.hurtTime);
      ctx.drawImage(background, 0, 0);

      // Sunbeams drifting through the water
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      for (let i = 0; i < 4; i++) {
        const bx = ((i * 190 + s.time * 12) % (W + 200)) - 100;
        for (let y = 0; y < SAND_Y; y += 4) ctx.fillRect(Math.round(bx + y * 0.35), y, 26, 4);
      }

      // Fish that arrive as the reef grows
      s.fish.forEach((f, i) => {
        f.x += f.speed * dt;
        if (f.x > W + 20) f.x = -20;
        const y = Math.round(f.y + Math.sin(s.time * 2 + i) * 4);
        const x = Math.round(f.x);
        ctx.fillStyle = f.color;
        ctx.fillRect(x, y, 12, 6);
        ctx.fillRect(x - 4, y - 2, 4, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 4, y, 2, 6);
        ctx.fillStyle = '#111827';
        ctx.fillRect(x + 9, y + 1, 2, 2);
      });

      // Swaying seaweed
      [[70, 9], [110, 7], [530, 8], [585, 10]].forEach(([sx, len]) => {
        for (let i = 0; i < len; i++) {
          const sway = Math.round(Math.sin(s.time * 1.5 + i * 0.6 + sx) * (i / 3));
          ctx.fillStyle = i % 2 ? '#15803d' : '#22c55e';
          ctx.fillRect(sx + sway * 2, SAND_Y + 6 - i * 8, 6, 8);
        }
      });

      // The rock, glowing while a coral is dragged over it
      if (s.rockHover) {
        ctx.fillStyle = 'rgba(253, 230, 138, 0.35)';
        for (let y = -ROCK.ry - 8; y <= ROCK.ry; y += 2) {
          const half = Math.round(((ROCK.rx + 8) * Math.sqrt(Math.max(0, 1 - (y / (ROCK.ry + 8)) ** 2))) / 2) * 2;
          ctx.fillRect(ROCK.cx - half, ROCK.cy + y, half * 2, 2);
        }
      }
      ctx.drawImage(rock, 0, 0);

      // Corals grow in where they were placed; bleached ones crumble away
      s.grown.forEach((g) => (g.t += dt));
      s.grown = s.grown.filter((g) => !(g.crumble && g.t > 1.4));
      s.grown
        .slice()
        .sort((a, b) => a.y - b.y)
        .forEach((g) => {
          const scale = g.crumble ? Math.max(0, 1 - Math.max(0, g.t - 0.6) / 0.8) : Math.min(1, g.t / 0.7);
          if (scale <= 0) return;
          const size = Math.round(ART * P * (0.3 + 0.7 * scale));
          ctx.globalAlpha = g.crumble ? Math.min(1, scale + 0.2) : 1;
          ctx.drawImage(g.sprite, Math.round(g.x - size / 2), Math.round(g.y - size + 4), size, size);
          ctx.globalAlpha = 1;
          if (g.crumble && g.t > 0.6) {
            ctx.fillStyle = '#d6d3d1';
            for (let i = 0; i < 5; i++) ctx.fillRect(g.x - 10 + i * 5, Math.round(g.y + (g.t - 0.6) * 40 + (i % 2) * 6), 2, 2);
          }
        });

      // Sparkles around new coral
      s.sparkles.forEach((sp) => (sp.t += dt));
      s.sparkles = s.sparkles.filter((sp) => sp.t < 0.9);
      s.sparkles.forEach((sp) => {
        if (sp.t < 0) return;
        ctx.globalAlpha = 1 - sp.t / 0.9;
        ctx.fillStyle = '#fef9c3';
        const x = Math.round(sp.x);
        const y = Math.round(sp.y - sp.t * 20);
        ctx.fillRect(x - 1, y - 3, 2, 6);
        ctx.fillRect(x - 3, y - 1, 6, 2);
        ctx.globalAlpha = 1;
      });

      // Bubbles
      ctx.fillStyle = 'rgba(224, 242, 254, 0.7)';
      bubbles.forEach((b) => {
        b.y -= b.speed * dt;
        if (b.y < -6) b.y = H;
        const x = Math.round(b.x + Math.sin(s.time + b.y / 30) * 3);
        ctx.fillRect(x, Math.round(b.y), 4, 4);
        ctx.fillRect(x + 1, Math.round(b.y) - 1, 2, 1);
      });
      ctx.restore();

      drawHurtFeedback(ctx, {
        w: W,
        h: H,
        sinceHurt: s.time - s.hurtTime,
        x: ROCK.cx,
        y: ROCK.cy - ROCK.ry,
        livesLeft: Math.max(0, livesRef.current),
        showBanner: livesRef.current > 0,
      });

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isHappy, tints]);

  const avatar = isHappy ? animal.avatar : animal.avatar.replace('.png', '_sad.png');
  const draggedSwatch = drag ? swatches[colorOrder[drag.option]] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-24 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-pixel">
      <div
        className={`relative w-full max-w-4xl pixel-panel overflow-hidden flex flex-col max-h-full text-[#2e1005] shadow-2xl ${isHappy ? 'h-full max-h-[760px]' : ''}`}
      >
        {/* Header with hearts and progress */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb] flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 border-2 border-[#fde68a] bg-[#2e1005] overflow-hidden flex-shrink-0">
              <img src={avatar} alt={animal.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[10px] font-pixel-heading text-[#fde68a] tracking-wider truncate">
                {isHappy ? `${animal.name.toUpperCase()}'S PAINT THE ROCK` : animal.name.toUpperCase()}
              </h3>
              <p className="text-[8px] text-[#fde68a]/80 truncate">{animal.biomeName} • Grow a coral reef</p>
            </div>
          </div>
          {isHappy && (
            <div className="flex items-center gap-3 text-[8.5px] font-bold">
              <div className="flex items-center gap-0.5" aria-label={`${lives} of ${START_LIVES} lives`}>
                {Array.from({ length: START_LIVES }).map((_, i) => (
                  <Heart key={i} className={`w-4 h-4 ${i < lives ? 'text-[#f87171] fill-[#f87171]' : 'text-[#a8a29e]'}`} />
                ))}
              </div>
              <span className="whitespace-nowrap">
                CORALS {corals}/{GOAL}
              </span>
              <span className="hidden sm:flex items-center gap-1 text-[#fde68a] whitespace-nowrap">
                <Coins className="w-3 h-3" /> +{COINS_PER_CORAL} EACH
              </span>
            </div>
          )}
          <button onClick={onClose} className="p-1 pixel-btn-red text-[9px] flex-shrink-0" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isHappy ? (
          /* Locked until the reef is restored */
          <div className="p-6 bg-[#fcf6e8] flex flex-col items-center text-center gap-3">
            <img src={avatar} alt={`${animal.name} looking sad`} className="w-28 h-28" style={{ imageRendering: 'pixelated' }} />
            <div className="pixel-card p-3 max-w-md text-[10px] leading-relaxed">
              <strong>{animal.name}:</strong> &quot;The reef is crumbling and the coral is all bleached... I&apos;m too sad to play.
              Please help protect the reef, then come back and we&apos;ll grow new coral together!&quot;
            </div>
            {quest && !quest.completed && (
              <button onClick={onStartQuest} className="pixel-btn-green px-3 py-1.5 text-[9px] font-bold flex items-center gap-1">
                <span>START ACTION PLAN: {quest.title.toUpperCase()}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col gap-2 bg-[#fcf6e8] p-2.5 overflow-hidden">
            {/* Coralia asks the question */}
            <div className="flex items-start gap-2 flex-shrink-0">
              <img src={avatar} alt={animal.name} className="w-10 h-10 flex-shrink-0" style={{ imageRendering: 'pixelated' }} />
              <div
                className={`flex-1 border-2 px-2.5 py-1.5 text-[9.5px] leading-snug shadow-[2px_2px_0px_#2e1005] ${
                  feedback ? (feedback.correct ? 'bg-[#dcfce7] border-[#15803d]' : 'bg-[#fee2e2] border-[#b91c1c]') : 'bg-[#e0f2fe] border-[#0369a1]'
                }`}
                aria-live="polite"
              >
                <strong>{animal.name}:</strong>{' '}
                {feedback ? feedback.text : <>{question.q} Drag the coral with the right answer onto my rock!</>}
                {mode === 'feedback' && (
                  <button onClick={nextQuestion} className="pixel-btn-green ml-2 px-2.5 py-0.5 text-[8.5px] inline-flex items-center gap-1 align-middle">
                    NEXT QUESTION <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {(mode === 'won' || mode === 'gameover') && (
                  <button onClick={restart} className="pixel-btn-green ml-2 px-2.5 py-0.5 text-[8.5px] inline-flex items-center gap-1 align-middle">
                    <RotateCcw className="w-3 h-3" /> PLAY AGAIN
                  </button>
                )}
              </div>
            </div>

            {/* Reef canvas: scales to fill the leftover space */}
            <div ref={stageRef} className="flex-1 min-h-0 flex items-center justify-center">
              <div className="relative border-4 border-[#2e1005] shadow-[3px_3px_0px_#2e1005] select-none" style={{ width: canvasSize.w, height: canvasSize.h }}>
                <canvas
                  ref={canvasRef}
                  width={W}
                  height={H}
                  onPointerDown={(e) => {
                    if (selected === null || mode !== 'asking') return;
                    const p = toCanvas(e.clientX, e.clientY);
                    if (p && overRock(p.x, p.y)) submit(selected, p.x, p.y);
                  }}
                  className={`block w-full h-full ${selected !== null ? 'cursor-pointer' : ''}`}
                  style={{ imageRendering: 'pixelated', touchAction: 'none' }}
                  aria-label="Coral reef rock. Drop the coral with the right answer onto the rock."
                />
                {selected !== null && mode === 'asking' && (
                  <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
                    <span className="bg-[#fffbf2]/90 border-2 border-[#5c2c16] px-2 py-1 text-[8.5px] font-bold">TAP A SPOT ON THE ROCK TO PLANT IT</span>
                  </div>
                )}

                {/* Compact end-of-game banner that always fits inside the reef */}
                {(mode === 'won' || mode === 'gameover') && (
                  <div className="absolute inset-x-0 top-2 z-10 flex justify-center px-2">
                    <div className="pixel-panel px-3 py-2 flex items-center gap-2.5 max-w-full">
                      {mode === 'won' && <Trophy className="w-5 h-5 text-[#b45309] flex-shrink-0" />}
                      <div className="text-left min-w-0">
                        <h4 className="font-pixel-heading text-[9px] leading-tight">{mode === 'won' ? 'REEF RESTORED!' : 'OUT OF HEARTS'}</h4>
                        <p className="text-[8.5px] leading-tight">
                          {mode === 'won' ? `All ${GOAL} corals grown! +${REEF_BONUS} coins` : `You grew ${corals} coral${corals === 1 ? '' : 's'}`}
                        </p>
                      </div>
                      <button onClick={restart} className="pixel-btn px-2.5 py-1 text-[8.5px] inline-flex items-center gap-1 flex-shrink-0">
                        <RotateCcw className="w-3 h-3" /> PLAY AGAIN
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Coral palette: each color is an answer */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 flex-shrink-0">
              {question.options.map((opt, i) => {
                const color = CORAL_COLORS[colorOrder[i]];
                const isSelected = selected === i;
                return (
                  <button
                    key={opt}
                    onPointerDown={(e) => {
                      if (mode !== 'asking') return;
                      e.preventDefault();
                      setDrag({ option: i, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false });
                    }}
                    disabled={mode !== 'asking'}
                    className={`flex items-center gap-2 px-2 py-1.5 border-2 text-left shadow-[2px_2px_0px_#2e1005] touch-none cursor-grab active:cursor-grabbing disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected ? 'border-[#b45309] bg-[#fde68a]' : 'border-[#5c2c16] bg-[#fffbf2] hover:bg-[#fef3c7]'
                    }`}
                    aria-pressed={isSelected}
                    aria-label={`${color.name.toLowerCase()} coral: ${opt}`}
                  >
                    {swatches[colorOrder[i]] ? (
                      <img src={swatches[colorOrder[i]]} alt="" draggable={false} className="w-8 h-8 flex-shrink-0" style={{ imageRendering: 'pixelated' }} />
                    ) : (
                      <span className="w-8 h-8 flex-shrink-0" style={{ background: color.base }} />
                    )}
                    <span className="text-[10.5px] leading-snug">
                      <span className="block font-bold text-[8.5px] opacity-70">{color.name} CORAL</span>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Coral following the pointer while dragging */}
      {drag && drag.moved && draggedSwatch && (
        <img
          src={draggedSwatch}
          alt=""
          className="pointer-events-none fixed z-[70] w-14 h-14 -translate-x-1/2 -translate-y-1/2"
          style={{ left: drag.x, top: drag.y, imageRendering: 'pixelated' }}
        />
      )}
    </div>
  );
}
