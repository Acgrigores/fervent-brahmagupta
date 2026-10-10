'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { AnimalInfo, Quest } from '@/types/game';
import {
  shuffle,
  seeded,
  makeLayer,
  ridge,
  mix,
  drawTiled,
  circleHitsRect,
  applyHurtShake,
  drawHurtFeedback,
} from './canvasFx';
import { X, Heart, ArrowRight, RotateCcw, HelpCircle, Coins, Trophy } from 'lucide-react';

// ---------------------------------------------------------------
// Grassland trivia: answering one correctly wins back a heart
// ---------------------------------------------------------------
interface TriviaQuestion {
  q: string;
  options: string[];
  answer: string;
  fact: string;
}

const TRIVIA: TriviaQuestion[] = [
  {
    q: 'What is the ONLY plant monarch caterpillars can eat?',
    options: ['Milkweed', 'Clover', 'Sunflower leaves', 'Prairie grass'],
    answer: 'Milkweed',
    fact: 'Monarchs lay their eggs only on milkweed. Planting milkweed in grasslands gives baby monarchs a home!',
  },
  {
    q: 'How far can monarch butterflies migrate each fall?',
    options: ['Up to 3,000 miles', 'About 30 miles', 'About 300 miles', 'Over 30,000 miles'],
    answer: 'Up to 3,000 miles',
    fact: 'Monarchs fly up to 3,000 miles from Canada and the U.S. all the way to the forests of Mexico!',
  },
  {
    q: 'About how many bites of the food we eat depend on pollinators like bees and butterflies?',
    options: ['1 out of every 3 bites', '1 out of every 100 bites', 'None of it', 'Every single bite'],
    answer: '1 out of every 3 bites',
    fact: 'Roughly 1 in 3 bites of food relies on pollinators. Fruits, nuts and veggies need us!',
  },
  {
    q: 'Why can prairie grasses survive droughts and wildfires?',
    options: ['They have very deep roots', 'Their leaves are waterproof', 'They hibernate in winter', 'They grow back from seeds only'],
    answer: 'They have very deep roots',
    fact: 'Some prairie grass roots grow over 10 feet deep, so the plant survives even when the top burns or dries out.',
  },
  {
    q: 'Which large animal once roamed North American prairies, helping the grassland by grazing?',
    options: ['Bison', 'Camels', 'Kangaroos', 'Penguins'],
    answer: 'Bison',
    fact: 'Millions of bison grazed the prairies. Their grazing and trampling helped wildflowers and new grass grow.',
  },
  {
    q: 'Which of these helps pollinators most on a farm?',
    options: ['Planting strips of wildflowers', 'Mowing every flower down', 'Spraying pesticides everywhere', 'Paving the field edges'],
    answer: 'Planting strips of wildflowers',
    fact: 'Wildflower strips along fields give bees and butterflies food and shelter, and they help the crops too!',
  },
  {
    q: 'What does "precision agriculture" mean?',
    options: [
      'Using sensors and data to give crops exactly what they need',
      'Planting crops in perfectly straight lines',
      'Only farming at night',
      'Using the biggest tractor possible',
    ],
    answer: 'Using sensors and data to give crops exactly what they need',
    fact: 'Precision farming uses sensors, GPS and data to use less water, fertilizer and spray, which is kinder to grasslands.',
  },
  {
    q: 'What part of their body do butterflies taste with?',
    options: ['Their feet', 'Their wings', 'Their eyes', "They can't taste"],
    answer: 'Their feet',
    fact: 'Butterflies have taste sensors on their feet, so they can taste a leaf just by standing on it!',
  },
  {
    q: 'What is one of the biggest threats to grasslands around the world?',
    options: ['Being plowed up or paved over', 'Too many rainbows', 'Too much snow', 'Too many butterflies'],
    answer: 'Being plowed up or paved over',
    fact: 'Grasslands are some of the least protected places on Earth. Many have been turned into fields and cities.',
  },
  {
    q: 'Why are monarch butterflies bright orange and black?',
    options: ['To warn predators they taste bad', 'To stay warm in the sun', 'To hide in the grass', 'To attract bees'],
    answer: 'To warn predators they taste bad',
    fact: 'Milkweed makes monarchs taste yucky to birds, and their bright colors are a warning: "Don\'t eat me!"',
  },
  {
    q: 'Healthy grassland soil stores lots of which thing, helping fight climate change?',
    options: ['Carbon', 'Plastic', 'Salt', 'Sand'],
    answer: 'Carbon',
    fact: 'Grassland plants pull carbon from the air and store it deep in their roots and soil.',
  },
  {
    q: 'Which of these animals can be pollinators?',
    options: ['All of these: bees, butterflies, hummingbirds and bats', 'Only bees', 'Only butterflies', 'Only birds'],
    answer: 'All of these: bees, butterflies, hummingbirds and bats',
    fact: 'Lots of animals carry pollen from flower to flower, even bats and beetles!',
  },
  {
    q: 'What does a caterpillar form when it is changing into a butterfly?',
    options: ['A chrysalis', 'An egg', 'A nest', 'A burrow'],
    answer: 'A chrysalis',
    fact: 'Inside the chrysalis, a caterpillar completely rebuilds its body into a butterfly. That\'s called metamorphosis!',
  },
  {
    q: 'How do cover crops planted between harvests help a farm?',
    options: ['They protect the soil and add nutrients', 'They attract harmful pests', 'They use up all the water', 'They block sunlight from the next crop'],
    answer: 'They protect the soil and add nutrients',
    fact: 'Cover crops keep soil from blowing or washing away and feed it nutrients for the next crop.',
  },
];

// ---------------------------------------------------------------
// Game constants (logical canvas pixels)
// ---------------------------------------------------------------
const W = 640;
const H = 360;
const GROUND = 330;
const BIRD_X = 150;
const HIT_RADIUS = 11;
const GRAVITY = 900;
const FLAP_VELOCITY = -290;
const MAX_FALL = 420;
const PILLAR_W = 56;
const MAX_HEARTS = 3;
const INVULNERABLE_SECONDS = 1.6;
const COINS_PER_FLOWER = 2;
const BEST_KEY = 'aura_flappy_best';

type Mode = 'ready' | 'playing' | 'trivia' | 'gameover';

interface Pillar {
  x: number;
  gapTop: number;
  gapBottom: number;
  passed: boolean;
  tint: number;
  seed: number;
}

const HIT_LINES = [
  'Ouch! That grass tickles my wings!',
  'Eek! Careful near those droopy flowers!',
  "Whoa! I'm okay, let's keep flying!",
  'Oof! Flap a little sooner next time!',
];

const PETALS = [
  ['#c084fc', '#7e22ce', '#e9d5ff'],
  ['#f472b6', '#be185d', '#fbcfe8'],
  ['#fbbf24', '#b45309', '#fef3c7'],
];

// ---------------------------------------------------------------
// Prairie background: layers are drawn once to offscreen canvases that tile
// every W pixels, then panned at different speeds for smooth parallax
// ---------------------------------------------------------------
interface Layers {
  sky: HTMLCanvasElement;
  scrolling: [HTMLCanvasElement, number][];
}

function buildLayers(): Layers {
  const sky = makeLayer(W, H, (ctx) => {
    // Banded sky: blue overhead fading to a warm golden horizon
    const bands = 14;
    for (let i = 0; i < bands; i++) {
      ctx.fillStyle = mix('#64b5e8', '#fde3a7', i / (bands - 1));
      ctx.fillRect(0, i * 18, W, 18);
    }
    ctx.fillStyle = '#fde3a7';
    ctx.fillRect(0, bands * 18, W, H);
    // Low prairie sun with a soft halo
    const sun = (r: number, color: string) => {
      ctx.fillStyle = color;
      for (let y = -r; y <= r; y += 2) {
        const half = Math.round(Math.sqrt(r * r - y * y) / 2) * 2;
        ctx.fillRect(470 - half, 172 + y, half * 2, 2);
      }
    };
    sun(36, '#fdecc0');
    sun(26, '#fff4cf');
    sun(20, '#fffbea');
  });

  const clouds = makeLayer(W, H, (ctx) => {
    const cloud = (x: number, y: number) => {
      for (const dx of [0, -W]) {
        ctx.fillStyle = '#f6e7cf';
        ctx.fillRect(x + dx, y + 6, 56, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + dx + 4, y, 48, 8);
        ctx.fillRect(x + dx + 12, y - 8, 20, 8);
        ctx.fillRect(x + dx + 28, y - 4, 14, 4);
      }
    };
    cloud(40, 46);
    cloud(250, 84);
    cloud(420, 34);
    cloud(600, 70);
  });

  const far = makeLayer(W, H, (ctx) => {
    const tops = ridge(ctx, W, H, 222, [[10, 2, 0.4], [5, 5, 1.7]], '#a9bfae', '#bccdbf');
    // Distant windmill: tapered tower and four blades
    const wx = 380;
    const top = tops[wx];
    ctx.fillStyle = '#6f7f78';
    for (let y = 0; y < 44; y += 2) {
      const half = 1 + Math.floor(y / 11);
      ctx.fillRect(wx - half * 2 + 2, top - 44 + y, half * 4 - 2, 2);
    }
    ctx.fillRect(wx - 1, top - 48, 4, 4);
    for (let i = 1; i <= 7; i++) {
      ctx.fillRect(wx + 1 + i * 2, top - 48 - i * 2, 2, 2);
      ctx.fillRect(wx - 1 - i * 2, top - 46 + i * 2, 2, 2);
      ctx.fillRect(wx - 1 - i * 2, top - 48 - i * 2, 2, 2);
      ctx.fillRect(wx + 1 + i * 2, top - 46 + i * 2, 2, 2);
    }
    // A few hazy trees
    [90, 150, 520, 560].forEach((x) => {
      const base = tops[x];
      ctx.fillStyle = '#7f9686';
      ctx.fillRect(x - 1, base - 6, 2, 6);
      ctx.fillStyle = '#93ab98';
      [[4, 18], [8, 16], [10, 14], [10, 12], [8, 10], [4, 8]].forEach(([half, up]) => ctx.fillRect(x - half, base - up, half * 2, 2));
    });
  });

  const mid = makeLayer(W, H, (ctx) => {
    const rand = seeded(11);
    const tops = ridge(ctx, W, H, 250, [[8, 3, 0.5], [4, 7, 2]], '#c9bf6b', '#d9cf82');
    // Grass texture strokes
    for (let i = 0; i < 260; i++) {
      const x = Math.floor((rand() * W) / 2) * 2;
      const y = tops[x] + 4 + Math.floor((rand() * (GROUND - tops[x])) / 2) * 2;
      ctx.fillStyle = rand() < 0.5 ? '#b3a95a' : '#d6cd86';
      ctx.fillRect(x, y, 2, 4);
    }
    // Grazing bison
    [140, 470].forEach((bx) => {
      const by = tops[bx] + 8;
      ctx.fillStyle = '#4a3426';
      ctx.fillRect(bx, by - 8, 18, 8);
      ctx.fillRect(bx - 2, by - 12, 10, 6);
      ctx.fillRect(bx - 6, by - 8, 6, 6);
      ctx.fillStyle = '#3a281c';
      [0, 4, 12, 16].forEach((lx) => ctx.fillRect(bx + lx, by, 2, 4));
    });
  });

  const near = makeLayer(W, H, (ctx) => {
    const rand = seeded(23);
    const tops = ridge(ctx, W, H, 288, [[6, 4, 1], [3, 9, 0]], '#8fb852', '#a6cd66');
    // Tufts of prairie grass along the crest
    for (let x = 0; x < W; x += 6) {
      const h = 4 + Math.floor(rand() * 4) * 2;
      ctx.fillStyle = rand() < 0.5 ? '#7aa645' : '#a6cd66';
      ctx.fillRect(x, tops[x] - h, 2, h);
    }
    // Coneflowers and black-eyed susans
    for (let i = 0; i < 26; i++) {
      const x = 4 + Math.floor((rand() * (W - 8)) / 2) * 2;
      const y = tops[x] + 4 + Math.floor((rand() * (GROUND - tops[x] - 12)) / 2) * 2;
      const purple = rand() < 0.5;
      ctx.fillStyle = '#5f8c3a';
      ctx.fillRect(x, y + 2, 2, 6);
      ctx.fillStyle = purple ? '#c084fc' : '#facc15';
      ctx.fillRect(x - 2, y, 6, 2);
      ctx.fillRect(x, y - 2, 2, 6);
      ctx.fillStyle = purple ? '#7c2d12' : '#3f2a14';
      ctx.fillRect(x, y, 2, 2);
    }
  });

  const ground = makeLayer(W, H, (ctx) => {
    const rand = seeded(5);
    ctx.fillStyle = '#6a9f3c';
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = '#82bb4c';
    ctx.fillRect(0, GROUND, W, 4);
    for (let x = 0; x < W; x += 4) {
      const h = 2 + Math.floor(rand() * 3) * 2;
      ctx.fillStyle = rand() < 0.5 ? '#5a8f32' : '#94c95a';
      ctx.fillRect(x, GROUND - h, 2, h);
    }
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(0, H - 10, W, 10);
    ctx.fillStyle = '#a0703a';
    for (let x = 0; x < W; x += 24) ctx.fillRect(x + Math.floor(rand() * 10) * 2, H - 6, 4, 2);
  });

  return { sky, scrolling: [[clouds, 0.08], [far, 0.2], [mid, 0.45], [near, 0.75], [ground, 1]] };
}

function drawBackground(ctx: CanvasRenderingContext2D, layers: Layers, scroll: number) {
  ctx.drawImage(layers.sky, 0, 0);
  layers.scrolling.forEach(([layer, factor]) => drawTiled(ctx, layer, scroll * factor));
}

// ---------------------------------------------------------------
// Obstacles
// ---------------------------------------------------------------

// Bottom obstacle: a clump of individual tall grass blades
function drawTallGrass(ctx: CanvasRenderingContext2D, p: Pillar) {
  const rand = seeded(p.seed);
  const x0 = Math.floor(p.x);
  for (let i = 0; i < 8; i++) {
    const baseX = x0 + 4 + i * 6 + Math.floor(rand() * 2) * 2;
    // The middle blades reach the gap; the outer ones are a bit shorter
    const tip = Math.round((p.gapBottom + (i === 3 || i === 4 ? 0 : 4 + rand() * 22)) / 2) * 2;
    const lean = (rand() - 0.5) * 16;
    const golden = rand() < 0.25;
    const len = GROUND - tip;
    for (let y = tip; y < GROUND; y += 2) {
      const t = (GROUND - y) / len; // 1 at the tip, 0 at the base
      const width = t > 0.85 ? 2 : t > 0.5 ? 4 : 6;
      const x = Math.round((baseX + lean * t * t) / 2) * 2;
      ctx.fillStyle = '#245a24';
      ctx.fillRect(x - 2, y, width + 2, 2);
      ctx.fillStyle = golden && t > 0.75 ? '#e2c35a' : t > 0.6 ? '#7fcf5f' : t > 0.3 ? '#55a845' : '#3d8a38';
      ctx.fillRect(x, y, width, 2);
    }
  }
}

// Top obstacle: flower stems hanging down with wilting, drooping blooms
function drawDroopingFlowers(ctx: CanvasRenderingContext2D, p: Pillar) {
  const rand = seeded(p.seed * 7 + 3);
  const x0 = Math.floor(p.x);
  const stems = [
    { sx: x0 + 10, end: p.gapTop - 8 - Math.floor(rand() * 6) * 2 },
    { sx: x0 + 28, end: p.gapTop },
    { sx: x0 + 44, end: p.gapTop - 14 - Math.floor(rand() * 6) * 2 },
  ];
  stems.forEach(({ sx, end }, i) => {
    const [petal, petalDark, petalLight] = PETALS[(p.tint + i) % PETALS.length];
    const bendY = Math.round((end - 24) / 2) * 2;
    const phase = rand() * 6;
    const stemX = (y: number) => sx + Math.round(Math.sin(y / 38 + phase) * 1.5) * 2;
    // Gently wavy stem hanging from above
    for (let y = -2; y < bendY; y += 2) {
      const x = stemX(y);
      ctx.fillStyle = '#245a24';
      ctx.fillRect(x - 2, y, 6, 2);
      ctx.fillStyle = '#4c9a3f';
      ctx.fillRect(x, y, 2, 2);
      // Drooping leaves
      if ((y + i * 20) % 56 === 0 && y > 10) {
        const right = Math.floor(y / 56 + i) % 2 === 0;
        ctx.fillStyle = '#5cae48';
        ctx.fillRect(right ? x + 2 : x - 8, y, 6, 2);
        ctx.fillRect(right ? x + 6 : x - 10, y + 2, 4, 2);
        ctx.fillStyle = '#245a24';
        ctx.fillRect(right ? x + 8 : x - 10, y + 4, 2, 2);
      }
    }
    // Neck curls over, then the bloom hangs face-down
    const nx = stemX(bendY);
    ctx.fillStyle = '#245a24';
    ctx.fillRect(nx - 2, bendY, 10, 6);
    ctx.fillStyle = '#4c9a3f';
    ctx.fillRect(nx, bendY, 4, 2);
    ctx.fillRect(nx + 2, bendY + 2, 4, 2);
    const hx = nx + 4;
    const hy = bendY + 6;
    // Green calyx
    ctx.fillStyle = '#3d8a38';
    ctx.fillRect(hx - 4, hy, 8, 2);
    // Petal bell
    ctx.fillStyle = petalDark;
    ctx.fillRect(hx - 8, hy + 2, 16, 8);
    ctx.fillStyle = petal;
    ctx.fillRect(hx - 6, hy + 2, 12, 6);
    ctx.fillStyle = petalLight;
    ctx.fillRect(hx - 4, hy + 2, 4, 2);
    // Petal tips hanging down
    [-8, -2, 4].forEach((dx, j) => {
      const len = j === 1 ? 8 : 6;
      ctx.fillStyle = petalDark;
      ctx.fillRect(hx + dx, hy + 10, 4, len);
      ctx.fillStyle = petal;
      ctx.fillRect(hx + dx, hy + 10, 2, len - 2);
    });
  });
}

// ---------------------------------------------------------------
interface Props {
  animal: AnimalInfo;
  isHappy: boolean;
  quest?: Quest;
  onClose: () => void;
  onStartQuest: () => void;
}

export default function AuraFlappyGame({ animal, isHappy, quest, onClose, onStartQuest }: Props) {
  const { addCoins } = useGameState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const addCoinsRef = useRef(addCoins);
  addCoinsRef.current = addCoins;

  const game = useRef({
    mode: 'ready' as Mode,
    y: H / 2,
    vy: 0,
    pillars: [] as Pillar[],
    score: 0,
    hearts: MAX_HEARTS,
    invulnerable: 0,
    scroll: 0,
    time: 0,
    lastFlap: -1,
    hurtTime: -10,
    hurtY: 0,
    freeze: 0,
    // Each flight gets one trivia heart; once it's earned, running out of hearts ends the flight
    reviveUsed: false,
  });
  const [reviveUsed, setReviveUsed] = useState(false);
  // Briefly highlights the heart that was just lost in the HUD
  const [lostHeartAt, setLostHeartAt] = useState<number | null>(null);

  const [mode, setModeState] = useState<Mode>('ready');
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [aura, setAura] = useState(
    "Hi friend! Now that my meadow is blooming, let's fly! Tap or press Space to flap my wings. Dodge the tall grass and droopy flowers! You have 3 hearts, plus one bonus heart you can win with trivia."
  );

  // Trivia state
  const [triviaDeck, setTriviaDeck] = useState<TriviaQuestion[]>(() => shuffle(TRIVIA));
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [triviaOptions, setTriviaOptions] = useState<string[]>([]);
  const [triviaResult, setTriviaResult] = useState<{ correct: boolean; choice: string } | null>(null);
  const [triviaFrom, setTriviaFrom] = useState<'heart' | 'revive'>('heart');
  const question = triviaDeck[triviaIndex % triviaDeck.length];

  const setMode = (m: Mode) => {
    game.current.mode = m;
    setModeState(m);
  };

  const auraSays = useCallback(
    (text: string) => {
      sounds.playAnimalChirp(animal.voicePitch);
      setAura(text);
    },
    [animal.voicePitch]
  );

  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem(BEST_KEY)) || 0);
    } catch {
      /* storage unavailable */
    }
    const img = new Image();
    img.src = animal.avatar;
    spriteRef.current = img;
  }, [animal.avatar]);

  // Stop highlighting the lost heart after its animation
  useEffect(() => {
    if (lostHeartAt === null) return;
    const timer = setTimeout(() => setLostHeartAt(null), 1200);
    return () => clearTimeout(timer);
  }, [lostHeartAt]);

  const flap = useCallback(() => {
    const g = game.current;
    if (g.mode === 'ready') {
      g.mode = 'playing';
      setModeState('playing');
    }
    if (g.mode !== 'playing') return;
    g.vy = FLAP_VELOCITY;
    g.lastFlap = g.time;
  }, []);

  const resetBird = () => {
    const g = game.current;
    g.y = H / 2;
    g.vy = 0;
    g.invulnerable = INVULNERABLE_SECONDS;
    // Clear obstacles right in front of Aura so the restart is fair
    g.pillars = g.pillars.filter((p) => p.x > BIRD_X + 160);
  };

  const restart = () => {
    sounds.playClick();
    const g = game.current;
    g.pillars = [];
    g.score = 0;
    g.hearts = MAX_HEARTS;
    g.y = H / 2;
    g.vy = 0;
    g.invulnerable = 0;
    g.hurtTime = -10;
    g.freeze = 0;
    g.reviveUsed = false;
    setReviveUsed(false);
    setHearts(MAX_HEARTS);
    setScore(0);
    setMode('ready');
    setAura('Ready for another flight? Tap or press Space to flap!');
  };

  // Keyboard: Space / Up / W flap. Captured so the farm world behind the modal doesn't react.
  useEffect(() => {
    if (!isHappy) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'ArrowUp' && e.code !== 'KeyW') return;
      if ((e.target as HTMLElement)?.tagName === 'BUTTON' && e.code === 'Space') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      flap();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isHappy, flap]);

  // Main game loop
  useEffect(() => {
    if (!isHappy) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;
    const layers = buildLayers();

    let raf = 0;
    let last = performance.now();

    const loseHeart = (message: string) => {
      const g = game.current;
      g.hearts -= 1;
      g.invulnerable = INVULNERABLE_SECONDS;
      // Hit-stop, shake, red flash and a falling heart make the hit obvious
      g.hurtTime = g.time;
      g.hurtY = g.y;
      g.freeze = 0.3;
      setHearts(g.hearts);
      setLostHeartAt(Date.now());
      sounds.playHurt();
      if (g.hearts <= 0) {
        g.mode = 'gameover';
        setModeState('gameover');
        try {
          const prevBest = Number(localStorage.getItem(BEST_KEY)) || 0;
          if (g.score > prevBest) localStorage.setItem(BEST_KEY, String(g.score));
        } catch {
          /* storage unavailable */
        }
        setBest((b) => Math.max(b, g.score));
        auraSays(
          g.reviveUsed
            ? `That's the end of our flight! We passed ${g.score} flower${g.score === 1 ? '' : 's'} together. Want to fly again?`
            : "Oh no, I'm out of hearts! Answer a grassland trivia question to win one back and keep flying!"
        );
      } else {
        auraSays(message);
      }
    };

    const step = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const g = game.current;
      g.time += dt;

      if (g.freeze > 0) {
        g.freeze -= dt;
      } else if (g.mode === 'playing') {
        const speed = Math.min(240, 150 + g.score * 4);
        const gap = Math.max(108, 136 - g.score * 2);
        g.scroll += speed * dt;
        g.vy = Math.min(MAX_FALL, g.vy + GRAVITY * dt);
        g.y += g.vy * dt;
        g.invulnerable = Math.max(0, g.invulnerable - dt);

        // Spawn and move obstacles
        const lastPillar = g.pillars[g.pillars.length - 1];
        if (!lastPillar || lastPillar.x < W - 230) {
          const center = 70 + gap / 2 + Math.random() * (GROUND - 60 - gap - 70);
          g.pillars.push({ x: W + 10, gapTop: center - gap / 2, gapBottom: center + gap / 2, passed: false, tint: Math.floor(Math.random() * 3), seed: Math.floor(Math.random() * 1e9) });
        }
        g.pillars.forEach((p) => (p.x -= speed * dt));
        g.pillars = g.pillars.filter((p) => p.x > -PILLAR_W - 10);

        // Score flowers we've flown past
        g.pillars.forEach((p) => {
          if (!p.passed && p.x + PILLAR_W < BIRD_X - HIT_RADIUS) {
            p.passed = true;
            g.score += 1;
            setScore(g.score);
            sounds.playCoin();
            addCoinsRef.current(animal.biome, COINS_PER_FLOWER);
          }
        });

        // Collisions
        if (g.y > GROUND - HIT_RADIUS) {
          g.y = GROUND - HIT_RADIUS;
          if (g.invulnerable <= 0) {
            g.vy = FLAP_VELOCITY;
            loseHeart('Ouch, I bumped the ground! Keep flapping!');
          } else {
            g.vy = 0;
          }
        } else if (g.y < HIT_RADIUS) {
          g.y = HIT_RADIUS;
          g.vy = 0;
        } else if (g.invulnerable <= 0) {
          const hit = g.pillars.some(
            (p) =>
              circleHitsRect(BIRD_X, g.y, HIT_RADIUS, p.x + 6, 0, PILLAR_W - 12, p.gapTop) ||
              circleHitsRect(BIRD_X, g.y, HIT_RADIUS, p.x + 6, p.gapBottom + 6, PILLAR_W - 12, GROUND - p.gapBottom)
          );
          if (hit) loseHeart(HIT_LINES[Math.floor(Math.random() * HIT_LINES.length)]);
        }
      } else if (g.mode === 'ready') {
        g.scroll += 30 * dt;
        g.y = H / 2 + Math.sin(g.time * 3) * 6;
      }

      // ---- Draw ----
      const sinceHurt = g.time - g.hurtTime;
      ctx.save();
      applyHurtShake(ctx, sinceHurt);
      drawBackground(ctx, layers, g.scroll);
      g.pillars.forEach((p) => {
        drawDroopingFlowers(ctx, p);
        drawTallGrass(ctx, p);
      });

      const blink = g.invulnerable > 0 && Math.floor(g.time * 10) % 2 === 0;
      const img = spriteRef.current;
      if (img && img.complete && !blink) {
        const flapping = g.time - g.lastFlap < 0.12 || (g.mode === 'ready' && Math.floor(g.time * 4) % 2 === 0);
        ctx.save();
        ctx.translate(BIRD_X, Math.round(g.y));
        ctx.rotate(g.mode === 'playing' ? Math.max(-0.4, Math.min(0.5, g.vy / 700)) : 0);
        ctx.scale(flapping ? 0.6 : 1, 1);
        // Source crop skips the ground shadow baked into the sprite
        ctx.drawImage(img, 0, 0, 200, 175, -20, -18, 40, 35);
        ctx.restore();
      }
      ctx.restore();

      drawHurtFeedback(ctx, {
        w: W,
        h: H,
        sinceHurt,
        x: BIRD_X,
        y: g.hurtY,
        livesLeft: g.hearts,
        showBanner: g.mode !== 'gameover',
      });

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isHappy, animal.biome, auraSays]);

  // ---- Trivia ----
  const openTrivia = (from: 'heart' | 'revive') => {
    sounds.playClick();
    setTriviaFrom(from);
    setTriviaResult(null);
    setTriviaOptions(shuffle(question.options));
    setMode('trivia');
  };

  const answerTrivia = (choice: string) => {
    if (triviaResult) return;
    const correct = choice === question.answer;
    setTriviaResult({ correct, choice });
    if (correct) {
      sounds.playFanfare();
      const g = game.current;
      g.hearts = Math.min(MAX_HEARTS, g.hearts + 1);
      g.reviveUsed = true;
      setReviveUsed(true);
      setHearts(g.hearts);
      auraSays(`Yes! ${question.fact} You won a heart back! That was your one trivia heart, so fly carefully!`);
    } else {
      sounds.playClick();
      auraSays(`Not quite! The answer is "${question.answer}". ${question.fact} Try another question!`);
    }
  };

  const nextQuestion = () => {
    sounds.playClick();
    const next = triviaIndex + 1;
    if (next % triviaDeck.length === 0) setTriviaDeck(shuffle(TRIVIA));
    setTriviaIndex(next);
    setTriviaResult(null);
    setTriviaOptions(shuffle(triviaDeck[next % triviaDeck.length].options));
  };

  const leaveTrivia = () => {
    sounds.playClick();
    const won = triviaResult?.correct;
    if (won) {
      // Move on to a fresh question for next time
      setTriviaIndex((i) => i + 1);
      if (triviaFrom === 'revive') resetBird();
      else game.current.invulnerable = INVULNERABLE_SECONDS;
      setMode('ready');
      setAura('Tap or press Space to keep flying!');
    } else {
      setMode(game.current.hearts <= 0 ? 'gameover' : 'ready');
    }
    setTriviaResult(null);
  };

  const avatar = isHappy ? animal.avatar : animal.avatar.replace('.png', '_sad.png');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-pixel">
      <div className="relative w-full max-w-3xl pixel-panel overflow-hidden flex flex-col max-h-full text-[#2e1005] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border-2 border-[#fde68a] bg-[#2e1005] overflow-hidden flex-shrink-0">
              <img src={avatar} alt={animal.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-xs font-pixel-heading text-[#fde68a] tracking-wider">
                {isHappy ? `${animal.name.toUpperCase()}'S MEADOW FLIGHT` : animal.name.toUpperCase()}
              </h3>
              <p className="text-[8.5px] text-[#fde68a]/80 mt-0.5">{animal.biomeName} • Flap through the wildflowers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 pixel-btn-red text-[9px]" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isHappy ? (
          /* Locked until the grasslands are restored */
          <div className="p-6 bg-[#fcf6e8] flex flex-col items-center text-center gap-3">
            <img src={avatar} alt={`${animal.name} looking sad`} className="w-28 h-28" style={{ imageRendering: 'pixelated' }} />
            <div className="pixel-card p-3 max-w-md text-[10px] leading-relaxed">
              <strong>{animal.name}:</strong> &quot;My wings feel too heavy to fly... the meadow is dry and the flowers are gone.
              Please help restore the grasslands, then come back and we&apos;ll fly together!&quot;
            </div>
            {quest && !quest.completed && (
              <button onClick={onStartQuest} className="pixel-btn-green px-3 py-1.5 text-[9px] font-bold flex items-center gap-1">
                <span>START ACTION PLAN: {quest.title.toUpperCase()}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-[#fcf6e8] p-3.5 space-y-2.5">
            {/* Aura's speech bubble */}
            <div className="flex items-start gap-3">
              <img src={avatar} alt={animal.name} className="w-12 h-12 flex-shrink-0" style={{ imageRendering: 'pixelated' }} />
              <div className="flex-1 border-2 border-[#5c2c16] bg-[#fffbf2] p-2.5 text-[10px] leading-relaxed shadow-[2px_2px_0px_#2e1005]" aria-live="polite">
                <strong>{animal.name}:</strong> {aura}
              </div>
            </div>

            {/* HUD */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] font-bold text-[#5c2c16]">
              <div className="flex items-center gap-1" aria-label={`${hearts} of ${MAX_HEARTS} hearts`}>
                {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                  <span key={i} className="relative inline-flex">
                    <Heart className={`w-5 h-5 ${i < hearts ? 'text-[#dc2626] fill-[#dc2626]' : 'text-[#a8a29e]'}`} />
                    {i === hearts && lostHeartAt !== null && (
                      <Heart key={lostHeartAt} className="absolute inset-0 w-5 h-5 text-[#dc2626] fill-[#dc2626] animate-ping" />
                    )}
                  </span>
                ))}
              </div>
              <span>FLOWERS PASSED: {score}</span>
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-[#b45309]" /> BEST: {Math.max(best, score)}
              </span>
              <span className="flex items-center gap-1 text-[#b45309]">
                <Coins className="w-3 h-3" /> +{COINS_PER_FLOWER} {animal.coinName.toUpperCase()} EACH
              </span>
              {reviveUsed ? (
                <span className="text-[#78350f]">TRIVIA HEART USED</span>
              ) : (
                <span className="text-[#15803d]">1 TRIVIA HEART AVAILABLE</span>
              )}
              {!reviveUsed && hearts < MAX_HEARTS && hearts > 0 && mode !== 'trivia' && (
                <button onClick={() => openTrivia('heart')} className="pixel-btn-green px-2 py-1 text-[8.5px] flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> WIN A HEART (TRIVIA)
                </button>
              )}
            </div>

            {/* Game canvas */}
            <div className="relative border-4 border-[#2e1005] shadow-[3px_3px_0px_#2e1005] select-none">
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                onPointerDown={(e) => {
                  e.preventDefault();
                  flap();
                }}
                className="block w-full h-auto cursor-pointer"
                style={{ imageRendering: 'pixelated', touchAction: 'none', aspectRatio: `${W} / ${H}` }}
                aria-label="Flappy butterfly game. Press Space or tap to flap."
              />

              {mode === 'ready' && (
                <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
                  <span className="pixel-card px-3 py-1.5 text-[10px] font-bold animate-pulse">TAP OR PRESS SPACE TO FLAP!</span>
                </div>
              )}

              {mode === 'gameover' && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#2e1005]/60">
                  <div className="pixel-panel p-4 text-center max-w-xs">
                    <h4 className="font-pixel-heading text-xs mb-1">{reviveUsed ? 'GAME OVER' : 'OUT OF HEARTS!'}</h4>
                    <p className="text-[9.5px] mb-3">
                      You flew past {score} flower{score === 1 ? '' : 's'}.{' '}
                      {reviveUsed
                        ? 'You already used your trivia heart this flight. Start a new flight to try again!'
                        : 'Answer a trivia question to win your one bonus heart and keep going!'}
                    </p>
                    <div className="flex flex-col gap-2">
                      {!reviveUsed && (
                        <button onClick={() => openTrivia('revive')} className="pixel-btn-green px-3 py-1.5 text-[9px] flex items-center justify-center gap-1">
                          <HelpCircle className="w-3 h-3" /> ANSWER TRIVIA FOR A HEART
                        </button>
                      )}
                      <button onClick={restart} className="pixel-btn px-3 py-1.5 text-[9px] flex items-center justify-center gap-1">
                        <RotateCcw className="w-3 h-3" /> START A NEW FLIGHT
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'trivia' && question && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#2e1005]/60 p-3 overflow-y-auto">
                  <div className="pixel-panel p-3.5 w-full max-w-md">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#15803d] mb-1">
                      <HelpCircle className="w-3.5 h-3.5" /> GRASSLAND TRIVIA • WIN A HEART
                    </div>
                    <p className="text-[10.5px] font-bold mb-2.5 leading-snug">{question.q}</p>
                    <div className="grid gap-1.5">
                      {triviaOptions.map((opt) => {
                        const picked = triviaResult?.choice === opt;
                        const reveal = triviaResult && opt === question.answer;
                        return (
                          <button
                            key={opt}
                            onClick={() => answerTrivia(opt)}
                            disabled={!!triviaResult}
                            className={`text-left px-2.5 py-1.5 border-2 text-[9.5px] shadow-[2px_2px_0px_#2e1005] transition-colors ${
                              reveal
                                ? 'bg-[#dcfce7] border-[#15803d]'
                                : picked
                                  ? 'bg-[#fee2e2] border-[#b91c1c]'
                                  : 'bg-[#fffbf2] border-[#5c2c16] hover:bg-[#fde68a]'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {triviaResult && (
                      <div className={`mt-2.5 p-2 border-2 text-[9px] leading-relaxed ${triviaResult.correct ? 'bg-[#dcfce7] border-[#15803d]' : 'bg-[#fef3c7] border-[#b45309]'}`}>
                        <strong>{triviaResult.correct ? 'CORRECT! +1 HEART' : 'NOT QUITE!'}</strong> {question.fact}
                      </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-2 mt-2.5">
                      {triviaResult && !triviaResult.correct && (
                        <button onClick={nextQuestion} className="pixel-btn-green px-3 py-1.5 text-[9px]">
                          TRY ANOTHER QUESTION →
                        </button>
                      )}
                      {triviaResult?.correct ? (
                        <button onClick={leaveTrivia} className="pixel-btn-green px-3 py-1.5 text-[9px]">
                          KEEP FLYING →
                        </button>
                      ) : (
                        <button onClick={leaveTrivia} className="pixel-btn px-3 py-1.5 text-[9px]">
                          BACK
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
