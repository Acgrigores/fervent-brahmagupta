'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { AnimalInfo, Quest } from '@/types/game';
import { shuffle, seeded, makeLayer, drawTiled, outlineArt } from './canvasFx';
import { X, ArrowRight, RotateCcw, Coins, CheckCircle, Trophy, HelpCircle } from 'lucide-react';

// ---------------------------------------------------------------
// Questions: one for every piece of trash in a net, two for every piece in the ocean
// ---------------------------------------------------------------
interface QuizQuestion {
  q: string;
  options: string[];
  answer: string;
}

const NET_QUIZ: QuizQuestion[] = [
  {
    q: 'Which bin should an empty soda can go in?',
    options: ['Recycling', 'Compost', 'Landfill trash', 'The ocean'],
    answer: 'Recycling',
  },
  {
    q: 'Why should batteries never go in the regular trash?',
    options: ['They can leak toxic metals and even start fires', 'They are too heavy', 'They melt in the sun', 'They attract polar bears'],
    answer: 'They can leak toxic metals and even start fires',
  },
  {
    q: 'What do polar bears use the sea ice for?',
    options: ['Hunting seals', 'Building nests', 'Growing food', 'Storing fish'],
    answer: 'Hunting seals',
  },
  {
    q: 'Which material can be recycled again and again without wearing out?',
    options: ['Glass', 'Chip bags', 'Foam cups', 'Plastic straws'],
    answer: 'Glass',
  },
  {
    q: 'What should you do to a plastic bottle before recycling it?',
    options: ['Rinse it out', 'Fill it with sand', 'Paint it', 'Freeze it'],
    answer: 'Rinse it out',
  },
  {
    q: 'Why do chip bags usually go in the landfill trash?',
    options: ['They are plastic and foil stuck together', 'They are made of paper', 'They are too small to see', 'They turn into compost'],
    answer: 'They are plastic and foil stuck together',
  },
  {
    q: 'Which is a good way to make less trash?',
    options: ['Pack lunch in a reusable container', 'Use a new plastic fork every day', 'Buy lots of wrapped snacks', 'Throw away old toys that still work'],
    answer: 'Pack lunch in a reusable container',
  },
  {
    q: "Why does the Arctic's white ice matter for the whole planet?",
    options: ['It reflects sunlight and helps keep Earth cool', 'It makes the oceans saltier', 'It stops all the wind', 'It grows plants for animals'],
    answer: 'It reflects sunlight and helps keep Earth cool',
  },
  {
    q: 'What happens to Arctic sea ice as the planet gets warmer?',
    options: ['It melts and shrinks', 'It grows thicker', 'It turns green', 'Nothing changes'],
    answer: 'It melts and shrinks',
  },
  {
    q: 'Which way of getting to a nearby friend makes the least pollution?',
    options: ['Walking or biking', 'A big truck', 'A private jet', 'A gas-powered boat'],
    answer: 'Walking or biking',
  },
];

const OCEAN_QUIZ: QuizQuestion[] = [
  {
    q: 'What is a "ghost net"?',
    options: ['A lost fishing net that keeps trapping sea animals', 'A net made of ice', 'A net used to catch ghosts', 'A net that is invisible'],
    answer: 'A lost fishing net that keeps trapping sea animals',
  },
  {
    q: 'What can happen when sea animals eat plastic?',
    options: ['Their stomachs fill up and they can get sick or starve', 'They get stronger', 'They learn to swim faster', 'Nothing happens'],
    answer: 'Their stomachs fill up and they can get sick or starve',
  },
  {
    q: 'Can plastic trash reach the Arctic, far from cities?',
    options: ['Yes, ocean currents carry it there', 'No, it is too cold', 'No, polar bears block it', 'Only in summer'],
    answer: 'Yes, ocean currents carry it there',
  },
  {
    q: 'What is the biggest patch of floating ocean garbage called?',
    options: ['The Great Pacific Garbage Patch', 'The Arctic Trash Island', 'The Atlantic Junk Pile', 'The Polar Plastic Lake'],
    answer: 'The Great Pacific Garbage Patch',
  },
  {
    q: 'Which is an easy way to keep plastic out of the ocean?',
    options: ['Use a reusable water bottle and bag', 'Throw trash in rivers', 'Use more straws', 'Bury plastic at the beach'],
    answer: 'Use a reusable water bottle and bag',
  },
  {
    q: 'Why are balloons let go outside dangerous for sea life?',
    options: ['They land in the sea and animals mistake them for food', 'They scare away the fish', 'They make the water warmer', "They aren't dangerous"],
    answer: 'They land in the sea and animals mistake them for food',
  },
  {
    q: 'Sea turtles often mistake plastic bags for which food?',
    options: ['Jellyfish', 'Seaweed cookies', 'Crabs', 'Penguins'],
    answer: 'Jellyfish',
  },
];
const QUESTIONS_PER_NETTED = 1;
const QUESTIONS_PER_OCEAN = 2;

type QuizKind = 'net' | 'ocean';
type AfterQuiz = 'aim' | 'levelclear' | 'won';

// ---------------------------------------------------------------
// Game constants
// ---------------------------------------------------------------
const W = 640;
const H = 360;
const CX = 320;
const CY = 182;
const P = 2;
const BEAR_R = 17;
const TRASH_R = 13;
const BEAR_MASS = 3;
const MAX_LAUNCH = 640;
const MAX_PULL = 120;
const COINS_PER_TRASH = 3;
const COINS_PER_FLOE = 25;

// Each floe has three collection nets around its edge (netAngles: where on the edge, netR: basket size).
// oceanGaps: openings in the ice wall where trash can slip into the sea
const LEVELS = [
  { trash: 4, ry: 128, netAngles: [0.1, 2.35, -2.35], netR: 40, oceanGaps: [-1.05, 1.2, 3.3] },
  { trash: 6, ry: 116, netAngles: [Math.PI - 0.1, 0.8, -0.8], netR: 36, oceanGaps: [0, 2.0, -2.0] },
  { trash: 8, ry: 104, netAngles: [-0.3, Math.PI + 0.3, 1.6], netR: 33, oceanGaps: [0.75, 2.5, -1.75] },
];
const CUBE_BAND = 0.15; // thickness of the ice-cube wall, in floe-radius units
const OCEAN_GAP_HALF = 17; // half-width of a wall gap, in px (trash is 26px across)
const ASPECT = 1.4; // floe is wider than it is tall

const TRASH_TYPES = ['plastic_bottle', 'aluminum_can', 'chip_bag', 'foam_cup', 'glass_jar', 'candy_wrapper', 'plastic_straw', 'battery'];

type Mode = 'ready' | 'aim' | 'moving' | 'evaluating' | 'quiz' | 'levelclear' | 'won';

interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  mass: number;
  angle: number;
  spin: number;
  type: string;
  falling: boolean; // left the ice (into the net or the ocean)
  fallT: number;
  netted: boolean; // caught in the net
  lost: boolean; // went into the ocean; washes back onto the ice after the shot
  netIndex: number; // which net caught it
}

interface Splash {
  x: number;
  y: number;
  t: number;
}

// Wobbly floe edge (in normalized units, 1 = average edge)
function edgeAt(theta: number, seed: number) {
  return 1 + 0.05 * Math.sin(3 * theta + seed) + 0.03 * Math.sin(7 * theta + seed * 2);
}

function floeDistance(x: number, y: number, ry: number) {
  const dx = (x - CX) / (ry * ASPECT);
  const dy = (y - CY) / ry;
  return { d: Math.hypot(dx, dy), theta: Math.atan2(dy, dx) };
}

// ---------------------------------------------------------------
// Pre-drawn art
// ---------------------------------------------------------------
function buildWater() {
  return makeLayer(W, H, (ctx) => {
    const rand = seeded(41);
    ctx.fillStyle = '#1d5f8f';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 140; i++) {
      const x = Math.floor((rand() * W) / 2) * 2;
      const y = Math.floor((rand() * H) / 2) * 2;
      const len = 6 + Math.floor(rand() * 6) * 2;
      for (const dx of [0, -W]) {
        ctx.fillStyle = rand() < 0.5 ? '#2f7cb3' : '#5aa3d6';
        ctx.fillRect(x + dx, y, len, 2);
      }
    }
    // Little drifting ice chunks
    for (let i = 0; i < 10; i++) {
      const x = Math.floor((rand() * W) / 2) * 2;
      const y = Math.floor((rand() * H) / 2) * 2;
      for (const dx of [0, -W]) {
        ctx.fillStyle = '#d7ecf8';
        ctx.fillRect(x + dx, y, 8, 4);
        ctx.fillStyle = '#9cc7e3';
        ctx.fillRect(x + dx, y + 4, 8, 2);
      }
    }
  });
}

function buildFloe(ry: number, seed: number) {
  return makeLayer(W, H, (ctx) => {
    const rand = seeded(seed * 97 + 5);
    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        const { d, theta } = floeDistance(x + 1, y + 1, ry);
        const edge = edgeAt(theta, seed);
        if (d <= edge) {
          ctx.fillStyle = d > edge - 0.05 ? '#cfe3f1' : rand() < 0.06 ? '#dbe8f3' : rand() < 0.03 ? '#ffffff' : '#eef5fb';
          ctx.fillRect(x, y, 2, 2);
        } else if (y > CY && d <= edge + 0.07 * Math.sin(Math.max(0, theta))) {
          // Icy cliff face on the near (south) side gives the floe some thickness
          ctx.fillStyle = d <= edge + 0.035 ? '#9cc7e3' : '#6fa6cf';
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
    // Cracks
    ctx.fillStyle = '#bcd3e6';
    for (let c = 0; c < 4; c++) {
      let x = CX + (rand() - 0.5) * ry * 1.6;
      let y = CY + (rand() - 0.5) * ry;
      for (let i = 0; i < 14; i++) {
        if (floeDistance(x, y, ry).d < 0.9) ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, 2, 2);
        x += (rand() - 0.3) * 6;
        y += (rand() - 0.5) * 6;
      }
    }
  });
}

const angleDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

// A net's basket sits just past the floe edge, with its mouth facing the ice
function netGeometry(lvl: number, index: number) {
  const { ry, netAngles, netR } = LEVELS[lvl];
  const netAngle = netAngles[index];
  const e = edgeAt(netAngle, lvl + 1);
  const ex = CX + Math.cos(netAngle) * e * ry * ASPECT;
  const ey = CY + Math.sin(netAngle) * e * ry;
  const len = Math.hypot(ex - CX, ey - CY);
  const ox = (ex - CX) / len;
  const oy = (ey - CY) / len;
  return { cx: ex + ox * netR * 0.6, cy: ey + oy * netR * 0.6, ox, oy, r: netR, edgeDist: len };
}

const allNets = (lvl: number) => LEVELS[lvl].netAngles.map((_, i) => netGeometry(lvl, i));

// True when an edge angle lines up with a net's mouth (where the ice wall has a gap)
function inNetGap(lvl: number, theta: number, pad = 0) {
  return LEVELS[lvl].netAngles.some((a, i) => {
    const net = netGeometry(lvl, i);
    return Math.abs(angleDiff(theta, a)) < (net.r * 0.85) / net.edgeDist + pad;
  });
}

// Distance in px from the floe centre to its edge at a given angle
function edgeDistance(lvl: number, theta: number) {
  const { ry } = LEVELS[lvl];
  const e = edgeAt(theta, lvl + 1);
  return Math.hypot(Math.cos(theta) * e * ry * ASPECT, Math.sin(theta) * e * ry);
}

// True when an edge angle lines up with one of the gaps that lead into the ocean
function inOceanGap(lvl: number, theta: number, pad = 0) {
  const half = OCEAN_GAP_HALF / edgeDistance(lvl, theta);
  return LEVELS[lvl].oceanGaps.some((a) => Math.abs(angleDiff(theta, a)) < half + pad);
}

function buildNet(lvl: number) {
  return makeLayer(W, H, (ctx) => {
    const { ry } = LEVELS[lvl];
    const seed = lvl + 1;
    allNets(lvl).forEach((net) => {
      for (let y = Math.floor(net.cy - net.r - 6); y < net.cy + net.r + 6; y += 2) {
        for (let x = Math.floor(net.cx - net.r - 6); x < net.cx + net.r + 6; x += 2) {
          const { d, theta } = floeDistance(x, y, ry);
          if (d < edgeAt(theta, seed) - 0.01) continue; // only over the water
          const dist = Math.hypot(x - net.cx, y - net.cy);
          if (dist <= net.r) {
            // Diagonal mesh
            const a = Math.round((x + y) / 2);
            const b = Math.round((x - y) / 2);
            ctx.fillStyle = a % 6 === 0 || b % 6 === 0 ? 'rgba(255, 255, 255, 0.75)' : 'rgba(8, 30, 52, 0.12)';
            ctx.fillRect(x, y, 2, 2);
          } else if (dist <= net.r + 4) {
            // Rope rim with knots
            ctx.fillStyle = Math.round(Math.atan2(y - net.cy, x - net.cx) * 8) % 3 === 0 ? '#fdba74' : '#c2410c';
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }
      // Orange floats marking the mouth of the net
      const px = -net.oy;
      const py = net.ox;
      [-1, 1].forEach((side) => {
        const fx = Math.round(net.cx - net.ox * net.r * 0.35 + px * net.r * 0.94 * side);
        const fy = Math.round(net.cy - net.oy * net.r * 0.35 + py * net.r * 0.94 * side);
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(fx - 5, fy - 4, 10, 10);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(fx - 4, fy - 5, 8, 9);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(fx - 4, fy - 2, 8, 2);
      });
    });
  });
}

// Chunky pixel ice cubes: bright top face, darker front face, a shine streak and the odd crack
const CUBE_ART = [
  ['.HTTTTt.', 'HTTTTttt', 'TTsTtttt', 'TsTttttt', 'tttttttt', 'FFFFFFff', 'FHFFFfff', '.ffffff.'],
  ['.TTTTTt.', 'TTTTsttt', 'TTTstttt', 'TTtttctt', 'tttttttt', 'FFFFFFff', 'FFFFFfHf', '.ffffff.'],
  ['.HTTtt..', 'HTTsttt.', 'TTstttt.', 'Tttcttt.', 'ttttttt.', 'FFFFFff.', 'FHFFfff.', '.fffff..'],
];
const CUBE_COLORS: Record<string, string> = {
  H: '#ffffff',
  T: '#eefaff',
  t: '#cdeefb',
  s: '#ffffff',
  c: '#a9d9f2',
  F: '#93cdee',
  f: '#6fb1de',
};

function buildCubeSprites() {
  return CUBE_ART.map((rows) =>
    makeLayer(10, 10, (ctx) => {
      rows.forEach((row, y) =>
        row.split('').forEach((ch, x) => {
          if (CUBE_COLORS[ch]) {
            ctx.fillStyle = CUBE_COLORS[ch];
            ctx.fillRect(x + 1, y + 1, 1, 1);
          }
        })
      );
      outlineArt(ctx, 10, 10, '#3f6f96');
    })
  );
}

// Ring of ice cubes along the floe edge, open at the net mouths and at a few ocean gaps
function buildIceWall(lvl: number) {
  const sprites = buildCubeSprites();
  return makeLayer(W, H, (ctx) => {
    const { ry } = LEVELS[lvl];
    const seed = lvl + 1;
    const rand = seeded(seed * 13);
    const cubes: [number, number, number][] = [];
    let theta = 0;
    while (theta < Math.PI * 2) {
      const d = edgeAt(theta, seed) - CUBE_BAND / 2;
      const x = CX + Math.cos(theta) * d * ry * ASPECT;
      const y = CY + Math.sin(theta) * d * ry;
      if (!inNetGap(lvl, theta, 0.05) && !inOceanGap(lvl, theta, 0.02)) {
        cubes.push([Math.round(x / 2) * 2, Math.round(y / 2) * 2 - (rand() < 0.3 ? 2 : 0), Math.floor(rand() * sprites.length)]);
      }
      theta += 15 / Math.hypot(x - CX, y - CY);
    }
    // Soft shadows on the ice first, then cubes back-to-front
    ctx.fillStyle = 'rgba(40, 90, 140, 0.25)';
    cubes.forEach(([x, y]) => ctx.fillRect(x - 6, y + 6, 16, 6));
    cubes
      .sort((a, b) => a[1] - b[1])
      .forEach(([x, y, v]) => ctx.drawImage(sprites[v], x - 10, y - 10, 20, 20));
  });
}

// Top-down polar bear, facing up
const BEAR_W = 20;
const BEAR_H = 24;
function buildBear() {
  return makeLayer(BEAR_W, BEAR_H, (ctx) => {
    const px = (x: number, y: number, w: number, h: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
    };
    const ellipse = (cx: number, cy: number, rx: number, ry: number, c: string) => {
      for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
        const half = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));
        px(Math.round(cx - half), y, Math.round(half * 2) + 1, 1, c);
      }
    };
    // Paws
    // Creamy fur (polar bears are a little yellow) so Nanuk stands out on the blue-white ice
    px(2, 8, 3, 4, '#e8dcc0');
    px(15, 8, 3, 4, '#e8dcc0');
    px(3, 17, 3, 4, '#e8dcc0');
    px(14, 17, 3, 4, '#e8dcc0');
    // Body with a shaded right/back side
    ellipse(10, 14, 7, 8, '#f8f0dc');
    ellipse(12, 16, 4, 5, '#e6d7b6');
    ellipse(9, 12, 3, 3, '#fffaf0');
    px(9, 22, 2, 1, '#e6d7b6');
    // Head
    ellipse(10, 5, 4.5, 4, '#fbf4e2');
    px(5, 1, 2, 2, '#f1e5c9');
    px(13, 1, 2, 2, '#f1e5c9');
    px(9, 0, 2, 1, '#1f2933');
    px(8, 3, 1, 1, '#1f2933');
    px(11, 3, 1, 1, '#1f2933');
    outlineArt(ctx, BEAR_W, BEAR_H, '#3b3328');
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

export default function NanukKnockoutGame({ animal, isHappy, quest, onClose, onStartQuest }: Props) {
  const { addCoins } = useGameState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trashImages = useRef<Record<string, HTMLImageElement>>({});
  const addCoinsRef = useRef(addCoins);
  addCoinsRef.current = addCoins;

  const game = useRef({
    mode: 'ready' as Mode,
    level: 0,
    bear: null as Body | null,
    trash: [] as Body[],
    splashes: [] as Splash[],
    aimStart: null as { x: number; y: number } | null,
    aim: null as { dx: number; dy: number; power: number } | null,
    facing: 0,
    knockedThisShot: 0,
    bearFell: false,
    time: 0,
  });

  const [mode, setModeState] = useState<Mode>('ready');
  const [level, setLevel] = useState(0);
  const [trashLeft, setTrashLeft] = useState(LEVELS[0].trash);
  const [cleared, setCleared] = useState(0);
  const [answered, setAnswered] = useState(0);
  // Questions queued up after a shot (net pieces first, then any ocean penalties)
  const [quiz, setQuiz] = useState<{
    items: { kind: QuizKind; question: QuizQuestion }[];
    index: number;
    options: string[];
    wrong: string[];
    solved: boolean;
    after: AfterQuiz;
  } | null>(null);
  // Shuffled decks so questions don't repeat until each pool runs out
  const decks = useRef<Record<QuizKind, QuizQuestion[]>>({ net: [], ocean: [] });
  const [nanuk, setNanuk] = useState(
    "Hi friend! Trash keeps washing up on my ice. Drag back from me to aim, then let go to slide into the trash. Knock it into one of the 3 NETS and answer a question for each piece. Careful: a few gaps in the ice wall lead to the ocean, and every piece in the ocean means TWO questions!"
  );

  const setMode = (m: Mode) => {
    game.current.mode = m;
    setModeState(m);
  };

  const nanukSays = useCallback(
    (text: string) => {
      sounds.playAnimalChirp(animal.voicePitch);
      setNanuk(text);
    },
    [animal.voicePitch]
  );

  useEffect(() => {
    TRASH_TYPES.forEach((t) => {
      const img = new Image();
      img.src = `/assets/recycling/${t}.png`;
      trashImages.current[t] = img;
    });
  }, []);

  const makeBear = (): Body => ({ x: CX, y: CY + 20, vx: 0, vy: 0, r: BEAR_R, mass: BEAR_MASS, angle: 0, spin: 0, type: 'bear', falling: false, fallT: 0, netted: false, lost: false, netIndex: -1 });

  const setupLevel = useCallback((lvl: number) => {
    const g = game.current;
    const { trash, ry } = LEVELS[lvl];
    const rand = seeded(Date.now() % 100000);
    g.level = lvl;
    g.bear = makeBear();
    g.trash = [];
    g.splashes = [];
    const types = shuffle(TRASH_TYPES);
    let tries = 0;
    while (g.trash.length < trash && tries++ < 2000) {
      const a = rand() * Math.PI * 2;
      const dist = 0.25 + rand() * 0.45;
      const x = CX + Math.cos(a) * dist * ry * ASPECT;
      const y = CY + Math.sin(a) * dist * ry;
      const clear =
        [g.bear, ...g.trash].every((b) => Math.hypot(b.x - x, b.y - y) > b.r + TRASH_R + 14) &&
        allNets(lvl).every((net) => Math.hypot(net.cx - x, net.cy - y) > net.r * 2);
      if (clear) {
        g.trash.push({
          x,
          y,
          vx: 0,
          vy: 0,
          r: TRASH_R,
          mass: 1,
          angle: rand() * 6,
          spin: 0,
          type: types[g.trash.length % types.length],
          falling: false,
          fallT: 0,
          netted: false,
          lost: false,
          netIndex: -1,
        });
      }
    }
    setLevel(lvl);
    setTrashLeft(g.trash.length);
  }, []);

  useEffect(() => {
    setupLevel(0);
  }, [setupLevel]);

  const drawQuestion = useCallback((kind: QuizKind) => {
    if (decks.current[kind].length === 0) decks.current[kind] = shuffle(kind === 'net' ? NET_QUIZ : OCEAN_QUIZ);
    return decks.current[kind].pop()!;
  }, []);

  const restart = () => {
    sounds.playClick();
    setCleared(0);
    setAnswered(0);
    setQuiz(null);
    setupLevel(0);
    setMode('aim');
    nanukSays("Let's clean up my ice again! Drag back from me to aim, then let go.");
  };

  const finishFloeMessage = (after: AfterQuiz, lvl: number) => {
    if (after === 'won') nanukSays('You did it! Every floe is sparkling clean. Now I can hunt and nap in peace. Thank you, friend!');
    else if (after === 'levelclear') nanukSays(`Floe ${lvl + 1} is spotless! The next one is smaller and messier. Ready?`);
  };

  // ---- Shot evaluation (called by the loop when everything stops) ----
  const evaluateShot = useCallback(() => {
    const g = game.current;

    // Trash that went into the ocean washes back up onto the ice
    const { ry } = LEVELS[g.level];
    const nets = allNets(g.level);
    const lostCount = g.trash.filter((t) => t.lost).length;
    g.trash.forEach((t) => {
      if (!t.lost) return;
      for (let tries = 0; tries < 200; tries++) {
        const a = Math.random() * Math.PI * 2;
        const dist = 0.2 + Math.random() * 0.5;
        const x = CX + Math.cos(a) * dist * ry * ASPECT;
        const y = CY + Math.sin(a) * dist * ry;
        const others = [g.bear!, ...g.trash.filter((o) => o !== t && !o.falling)];
        if (others.every((o) => Math.hypot(o.x - x, o.y - y) > o.r + TRASH_R + 6) && nets.every((n) => Math.hypot(n.cx - x, n.cy - y) > n.r * 1.6)) {
          Object.assign(t, { x, y, vx: 0, vy: 0, falling: false, lost: false, fallT: 0 });
          g.splashes.push({ x, y, t: 0 });
          break;
        }
      }
    });

    const remaining = g.trash.filter((t) => !t.netted).length;
    setTrashLeft(remaining);

    if (g.bearFell) {
      g.bear = makeBear();
      // Nudge any trash sitting on the respawn spot out of the way
      g.trash.forEach((t) => {
        if (!t.falling && Math.hypot(t.x - g.bear!.x, t.y - g.bear!.y) < BEAR_R + TRASH_R + 4) t.y -= 40;
      });
    }

    let after: AfterQuiz = 'aim';
    if (remaining === 0) {
      sounds.playFanfare();
      addCoinsRef.current(animal.biome, COINS_PER_FLOE);
      after = g.level === LEVELS.length - 1 ? 'won' : 'levelclear';
    }

    const netted = g.knockedThisShot;
    const items = [
      ...Array.from({ length: netted * QUESTIONS_PER_NETTED }, () => ({ kind: 'net' as QuizKind, question: drawQuestion('net') })),
      ...Array.from({ length: lostCount * QUESTIONS_PER_OCEAN }, () => ({ kind: 'ocean' as QuizKind, question: drawQuestion('ocean') })),
    ];

    if (items.length > 0) {
      setQuiz({ items, index: 0, options: shuffle(items[0].question.options), wrong: [], solved: false, after });
      setMode('quiz');
      if (lostCount > 0) sounds.playHurt();
      const netPart = netted > 0 ? `${netted} piece${netted === 1 ? '' : 's'} in the net, nice! ` : '';
      const oceanPart =
        lostCount > 0
          ? `But ${lostCount === 1 ? 'a piece' : `${lostCount} pieces`} slipped into the ocean, so that's ${lostCount * QUESTIONS_PER_OCEAN} penalty questions. The waves washed it back onto the ice. `
          : '';
      nanukSays(`${netPart}${oceanPart}Answer ${items.length === 1 ? 'this question' : `these ${items.length} questions`} to keep going!`);
      return;
    }

    // Nothing reached a net or the ocean: just try again
    nanukSays(g.bearFell ? "Brrr, that water's cold! Let's try again." : 'So close! Line up with a piece of trash and try again.');
    setMode('aim');
  }, [animal.biome, nanukSays, drawQuestion]);

  // ---- Aiming with the pointer ----
  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = game.current;
    if (g.mode === 'ready') {
      setMode('aim');
      return;
    }
    if (g.mode !== 'aim') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    g.aimStart = toCanvas(e);
    g.aim = { dx: 0, dy: 0, power: 0 };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = game.current;
    if (g.mode !== 'aim' || !g.aimStart) return;
    const p = toCanvas(e);
    const pullX = g.aimStart.x - p.x;
    const pullY = g.aimStart.y - p.y;
    const len = Math.hypot(pullX, pullY);
    if (len < 1) return;
    g.aim = { dx: pullX / len, dy: pullY / len, power: Math.min(1, len / MAX_PULL) };
    g.facing = Math.atan2(g.aim.dy, g.aim.dx) + Math.PI / 2;
  };

  const onPointerUp = () => {
    const g = game.current;
    if (g.mode !== 'aim' || !g.aim || !g.bear) return;
    const { dx, dy, power } = g.aim;
    g.aimStart = null;
    g.aim = null;
    if (power < 0.08) return;
    g.bear.vx = dx * power * MAX_LAUNCH;
    g.bear.vy = dy * power * MAX_LAUNCH;
    g.knockedThisShot = 0;
    g.bearFell = false;
    sounds.playClick();
    setMode('moving');
  };

  // ---- Main loop ----
  useEffect(() => {
    if (!isHappy) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;
    const water = buildWater();
    const floes = LEVELS.map((l, i) => buildFloe(l.ry, i + 1));
    const bearArt = buildBear();
    const nets = LEVELS.map((_, i) => buildNet(i));
    const walls = LEVELS.map((_, i) => buildIceWall(i));

    let raf = 0;
    let last = performance.now();

    const fall = (b: Body) => {
      b.falling = true;
      b.fallT = 0;
      game.current.splashes.push({ x: b.x, y: b.y, t: 0 });
      sounds.playWaterSplash();
    };

    // Caught pieces settle into the back of the basket
    const netSlot = (lvl: number, netIndex: number, index: number) => {
      const net = netGeometry(lvl, netIndex);
      const spread = ((index % 5) - 2) * 0.32 * net.r;
      const depth = net.r * (0.25 + 0.2 * Math.floor(index / 5));
      return { x: net.cx + net.ox * depth - net.oy * spread, y: net.cy + net.oy * depth + net.ox * spread };
    };

    const step = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const g = game.current;
      g.time += dt;
      const { ry } = LEVELS[g.level];
      const seed = g.level + 1;
      const bodies = [g.bear!, ...g.trash].filter(Boolean);

      if (g.mode === 'moving') {
        // Integrate with ice friction
        bodies.forEach((b) => {
          if (b.falling) {
            b.fallT += dt;
            if (b.netted) {
              // Glide into a spot at the back of the net
              const slot = netSlot(g.level, b.netIndex, g.trash.filter((t) => t.netted && t.netIndex === b.netIndex).indexOf(b));
              b.x += (slot.x - b.x) * Math.min(1, dt * 8);
              b.y += (slot.y - b.y) * Math.min(1, dt * 8);
            }
            return;
          }
          const speed = Math.hypot(b.vx, b.vy);
          if (speed > 0) {
            const slow = Math.max(0, speed - (speed * 1.5 + 35) * dt) / speed;
            b.vx *= slow;
            b.vy *= slow;
          }
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.angle += b.spin * dt;
          b.spin *= 0.97;
        });

        // The ice-cube wall bounces everything back, except trash heading through a net mouth
        bodies.forEach((b) => {
          if (b.falling) return;
          const { d, theta } = floeDistance(b.x, b.y, ry);
          const limit = edgeAt(theta, seed) - CUBE_BAND - b.r / (ry * 1.1);
          if (d <= limit || (b.type !== 'bear' && (inNetGap(g.level, theta) || inOceanGap(g.level, theta)))) return;
          const dx = b.x - CX;
          const dy = b.y - CY;
          b.x = CX + dx * (limit / d);
          b.y = CY + dy * (limit / d);
          let nx = dx / (ASPECT * ASPECT);
          let ny = dy;
          const nl = Math.hypot(nx, ny) || 1;
          nx /= nl;
          ny /= nl;
          const vn = b.vx * nx + b.vy * ny;
          if (vn > 0) {
            b.vx -= 1.7 * vn * nx;
            b.vy -= 1.7 * vn * ny;
            b.spin += (Math.random() - 0.5) * 8;
            if (vn > 60) sounds.playClick();
          }
        });

        // Elastic collisions between everything still on the ice
        const live = bodies.filter((b) => !b.falling);
        for (let i = 0; i < live.length; i++) {
          for (let j = i + 1; j < live.length; j++) {
            const a = live[i];
            const b = live[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            const minDist = a.r + b.r;
            if (dist === 0 || dist >= minDist) continue;
            const nx = dx / dist;
            const ny = dy / dist;
            // Separate
            const overlap = (minDist - dist) / 2;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;
            // Exchange momentum along the normal
            const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (rel <= 0) continue;
            const impulse = (2 * rel * 0.92) / (a.mass + b.mass);
            a.vx -= impulse * b.mass * nx;
            a.vy -= impulse * b.mass * ny;
            b.vx += impulse * a.mass * nx;
            b.vy += impulse * a.mass * ny;
            a.spin += (Math.random() - 0.5) * 12;
            b.spin += (Math.random() - 0.5) * 12;
            sounds.playClick();
          }
        }

        // Trash that reaches a net is caught (anything that somehow slips past the wall falls in)
        const nets = allNets(g.level);
        live.forEach((b) => {
          const netIndex = b.type === 'bear' ? -1 : nets.findIndex((n) => Math.hypot(b.x - n.cx, b.y - n.cy) < n.r);
          if (netIndex >= 0) {
            b.falling = true;
            b.netted = true;
            b.netIndex = netIndex;
            b.fallT = 0;
            g.knockedThisShot += 1;
            setCleared((c) => c + 1);
            addCoinsRef.current(animal.biome, COINS_PER_TRASH);
            sounds.playCoin();
            return;
          }
          const { d, theta } = floeDistance(b.x, b.y, ry);
          if (d > edgeAt(theta, seed)) {
            fall(b);
            if (b.type === 'bear') g.bearFell = true;
            else b.lost = true;
          }
        });

        const settled = bodies.every((b) => (b.falling ? b.fallT > 0.7 || (b.netted && b.fallT > 0.4) : Math.hypot(b.vx, b.vy) < 6));
        if (settled) {
          bodies.forEach((b) => {
            b.vx = 0;
            b.vy = 0;
          });
          g.mode = 'evaluating';
          evaluateShot();
        }
        if (g.bear && !g.bear.falling && Math.hypot(g.bear.vx, g.bear.vy) > 20) {
          g.facing = Math.atan2(g.bear.vy, g.bear.vx) + Math.PI / 2;
        }
      }
      g.splashes.forEach((s) => (s.t += dt));
      g.splashes = g.splashes.filter((s) => s.t < 0.8);

      // ---- Draw ----
      drawTiled(ctx, water, g.time * 6);

      const drawTrash = (t: Body) => {
        const img = trashImages.current[t.type];
        if (!img?.complete) return;
        // Ocean trash sinks; netted trash sits a little smaller in the basket
        const scale = t.lost ? Math.max(0, 1 - t.fallT / 0.6) : t.netted ? 0.8 : 1;
        if (scale <= 0) return;
        ctx.save();
        ctx.translate(Math.round(t.x), Math.round(t.y));
        ctx.rotate(t.angle);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -15, -15, 30, 30);
        ctx.restore();
      };

      // Caught trash sits under the mesh, ocean trash sinks beside the floe
      g.trash.filter((t) => t.netted || t.lost).forEach(drawTrash);
      ctx.drawImage(nets[g.level], 0, 0);
      ctx.drawImage(floes[g.level], 0, 0);
      ctx.drawImage(walls[g.level], 0, 0);

      // Pulsing "NET" markers so they're easy to spot
      if (g.mode === 'aim' || g.mode === 'ready') {
        ctx.globalAlpha = 0.65 + Math.sin(g.time * 4) * 0.35;
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        allNets(g.level).forEach((n) => {
          const lx = Math.round(Math.min(W - 16, Math.max(16, n.cx + n.ox * (n.r + 14))));
          const ly = Math.round(Math.min(H - 6, Math.max(10, n.cy + n.oy * (n.r + 14))));
          ctx.fillStyle = '#0c2a43';
          ctx.fillText('NET', lx + 1, ly + 5);
          ctx.fillStyle = '#fde68a';
          ctx.fillText('NET', lx, ly + 4);
        });
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
      }

      // Splashes
      g.splashes.forEach((s) => {
        const r = 6 + s.t * 40;
        ctx.globalAlpha = Math.max(0, 1 - s.t / 0.8);
        ctx.fillStyle = '#e0f2fe';
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          ctx.fillRect(Math.round(s.x + Math.cos(a) * r), Math.round(s.y + Math.sin(a) * r * 0.6), 4, 4);
        }
        ctx.globalAlpha = 1;
      });

      // Trash still on the ice
      g.trash.filter((t) => !t.falling).forEach(drawTrash);

      // Aim arrow
      if (g.mode === 'aim' && g.aim && g.bear && g.aim.power > 0.02) {
        const len = 28 + g.aim.power * 110;
        const color = g.aim.power < 0.5 ? '#22c55e' : g.aim.power < 0.8 ? '#f59e0b' : '#ef4444';
        for (let s = 24; s < len; s += 8) {
          ctx.fillStyle = color;
          ctx.fillRect(Math.round(g.bear.x + g.aim.dx * s) - 2, Math.round(g.bear.y + g.aim.dy * s) - 2, 4, 4);
        }
        const hx = g.bear.x + g.aim.dx * len;
        const hy = g.bear.y + g.aim.dy * len;
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(hx) - 4, Math.round(hy) - 4, 8, 8);
      }

      // Nanuk
      if (g.bear) {
        const b = g.bear;
        const scale = b.falling ? Math.max(0, 1 - b.fallT / 0.6) : 1;
        if (scale > 0) {
          ctx.fillStyle = 'rgba(30, 60, 90, 0.25)';
          ctx.fillRect(Math.round(b.x) - 14, Math.round(b.y) + 12, 28, 6);
          ctx.save();
          ctx.translate(Math.round(b.x), Math.round(b.y));
          ctx.rotate(g.facing);
          ctx.scale(scale, scale);
          ctx.drawImage(bearArt, (-BEAR_W * P) / 2, (-BEAR_H * P) / 2, BEAR_W * P, BEAR_H * P);
          ctx.restore();
        }
      }

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isHappy, animal.biome, evaluateShot]);

  // ---- Questions after a shot ----
  const answerQuiz = (choice: string) => {
    if (!quiz || quiz.solved || quiz.wrong.includes(choice)) return;
    if (choice === quiz.items[quiz.index].question.answer) {
      sounds.playCoin();
      setAnswered((n) => n + 1);
      setQuiz({ ...quiz, solved: true });
    } else {
      sounds.playClick();
      setQuiz({ ...quiz, wrong: [...quiz.wrong, choice] });
    }
  };

  const nextQuiz = () => {
    if (!quiz) return;
    sounds.playClick();
    if (quiz.index < quiz.items.length - 1) {
      const index = quiz.index + 1;
      setQuiz({ ...quiz, index, options: shuffle(quiz.items[index].question.options), wrong: [], solved: false });
      return;
    }
    const after = quiz.after;
    setQuiz(null);
    setMode(after);
    if (after === 'aim') nanukSays('Great answers! Line up your next shot.');
    else finishFloeMessage(after, game.current.level);
  };

  const nextLevel = () => {
    sounds.playClick();
    setupLevel(game.current.level + 1);
    setMode('aim');
  };

  const avatar = isHappy ? animal.avatar : animal.avatar.replace('.png', '_sad.png');
  const currentItem = quiz?.items[quiz.index];

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
                {isHappy ? `${animal.name.toUpperCase()}'S ICE KNOCKOUT` : animal.name.toUpperCase()}
              </h3>
              <p className="text-[8.5px] text-[#fde68a]/80 mt-0.5">{animal.biomeName} • Knock the trash off the ice</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 pixel-btn-red text-[9px]" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isHappy ? (
          /* Locked until the tundra is restored */
          <div className="p-6 bg-[#fcf6e8] flex flex-col items-center text-center gap-3">
            <img src={avatar} alt={`${animal.name} looking sad`} className="w-28 h-28" style={{ imageRendering: 'pixelated' }} />
            <div className="pixel-card p-3 max-w-md text-[10px] leading-relaxed">
              <strong>{animal.name}:</strong> &quot;My ice is melting and covered in soot... I don&apos;t feel like playing.
              Please help stop the pollution in the tundra, then come back and we&apos;ll clean up my ice together!&quot;
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
            {/* Nanuk's speech bubble */}
            <div className="flex items-start gap-3">
              <img src={avatar} alt={animal.name} className="w-12 h-12 flex-shrink-0" style={{ imageRendering: 'pixelated' }} />
              <div className="flex-1 border-2 border-[#5c2c16] bg-[#fffbf2] p-2.5 text-[10px] leading-relaxed shadow-[2px_2px_0px_#2e1005]" aria-live="polite">
                <strong>{animal.name}:</strong> {nanuk}
              </div>
            </div>

            {/* HUD */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] font-bold text-[#5c2c16]">
              <span>
                FLOE {level + 1} OF {LEVELS.length} • TRASH LEFT: {trashLeft}
              </span>
              <span>CLEARED: {cleared}</span>
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> QUESTIONS ANSWERED: {answered}
              </span>
              <span className="flex items-center gap-1 text-[#b45309]">
                <Coins className="w-3 h-3" /> +{COINS_PER_TRASH} PER PIECE • +{COINS_PER_FLOE} PER FLOE
              </span>
            </div>

            {/* Game canvas */}
            <div className="relative border-4 border-[#2e1005] shadow-[3px_3px_0px_#2e1005] select-none">
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="block w-full h-auto cursor-crosshair"
                style={{ imageRendering: 'pixelated', touchAction: 'none', aspectRatio: `${W} / ${H}` }}
                aria-label="Polar bear knockout game. Drag back to aim and set power, release to slide."
              />

              {mode === 'ready' && (
                <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                  <span className="pixel-card px-3 py-1.5 text-[10px] font-bold animate-pulse">CLICK OR TAP TO START!</span>
                </div>
              )}
              {mode === 'aim' && (
                <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
                  <span className="bg-[#fffbf2]/85 border-2 border-[#5c2c16] px-2 py-1 text-[8.5px] font-bold">
                    DRAG BACK (LIKE A SLINGSHOT) & RELEASE
                  </span>
                </div>
              )}

              {mode === 'levelclear' && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0c2a43]/50">
                  <div className="pixel-panel p-4 text-center max-w-xs">
                    <h4 className="font-pixel-heading text-xs mb-1">FLOE {level + 1} CLEAN!</h4>
                    <p className="text-[9.5px] mb-3">+{COINS_PER_FLOE} coins! The next floe is smaller with more trash.</p>
                    <button onClick={nextLevel} className="pixel-btn-green px-3 py-1.5 text-[9px] inline-flex items-center gap-1">
                      NEXT FLOE <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {mode === 'won' && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0c2a43]/50">
                  <div className="pixel-panel p-4 text-center max-w-xs">
                    <Trophy className="w-8 h-8 text-[#b45309] mx-auto mb-1" />
                    <h4 className="font-pixel-heading text-xs mb-1">ALL ICE CLEAN!</h4>
                    <p className="text-[9.5px] mb-3">
                      You netted {cleared} piece{cleared === 1 ? '' : 's'} of trash, answered {answered} question{answered === 1 ? '' : 's'}, and
                      cleared all {LEVELS.length} floes!
                    </p>
                    <button onClick={restart} className="pixel-btn px-3 py-1.5 text-[9px] inline-flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> PLAY AGAIN
                    </button>
                  </div>
                </div>
              )}

              {/* Questions after a shot: green for trash in the net, red for ocean penalties */}
              {mode === 'quiz' && quiz && currentItem && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0c2a43]/80 p-2.5 overflow-y-auto">
                  <div
                    className={`w-full max-w-md border-4 p-3 shadow-[4px_4px_0px_#000] ${
                      currentItem.kind === 'ocean' ? 'border-[#f87171] bg-[#450a0a] text-[#fef2f2]' : 'border-[#4ade80] bg-[#14532d] text-[#f0fdf4]'
                    }`}
                  >
                    <div className={`flex justify-between text-[8.5px] font-bold mb-1.5 ${currentItem.kind === 'ocean' ? 'text-[#fca5a5]' : 'text-[#bbf7d0]'}`}>
                      <span>{currentItem.kind === 'ocean' ? 'OCEAN PENALTY' : 'TRASH IN THE NET!'}</span>
                      <span>
                        QUESTION {quiz.index + 1} OF {quiz.items.length}
                      </span>
                    </div>
                    <p className="text-[10.5px] font-bold mb-2.5 leading-snug">{currentItem.question.q}</p>
                    <div className="grid gap-1.5">
                      {quiz.options.map((opt) => {
                        const isWrong = quiz.wrong.includes(opt);
                        const isRight = quiz.solved && opt === currentItem.question.answer;
                        return (
                          <button
                            key={opt}
                            onClick={() => answerQuiz(opt)}
                            disabled={quiz.solved || isWrong}
                            className={`text-left px-2.5 py-1.5 border-2 text-[9.5px] ${
                              isRight
                                ? 'bg-[#15803d] border-[#86efac]'
                                : isWrong
                                  ? 'bg-[#1c1917] border-[#57534e] line-through opacity-60'
                                  : currentItem.kind === 'ocean'
                                    ? 'bg-[#7f1d1d] border-[#f87171] hover:bg-[#991b1b]'
                                    : 'bg-[#166534] border-[#4ade80] hover:bg-[#15803d]'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {quiz.wrong.length > 0 && !quiz.solved && <p className="mt-2 text-[9px] opacity-90">Not quite, try another answer!</p>}
                    {quiz.solved && (
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="flex items-center gap-1 text-[9px] font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> CORRECT!
                        </span>
                        <button onClick={nextQuiz} className="px-3 py-1.5 text-[9px] font-bold bg-[#fde68a] text-[#1c1917] border-2 border-[#000] shadow-[2px_2px_0px_#000]">
                          {quiz.index < quiz.items.length - 1 ? 'NEXT QUESTION →' : 'BACK TO THE ICE →'}
                        </button>
                      </div>
                    )}
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
