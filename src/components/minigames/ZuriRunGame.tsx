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
import { X, Heart, ArrowRight, RotateCcw, BookOpen, Coins, CheckCircle, Flag } from 'lucide-react';

// ---------------------------------------------------------------
// Drought article + quiz: reading it and answering correctly restores one life
// ---------------------------------------------------------------
const ARTICLE: { title: string; body: string }[] = [
  {
    title: 'What is a drought?',
    body: 'A drought is a long stretch of time with much less rain than usual. Soil dries out, rivers and lakes shrink, and the water stored underground in aquifers drops. Hotter temperatures make droughts last longer, because heat pulls even more water out of the ground and plants.',
  },
  {
    title: 'Save water at home',
    body: 'Every drop counts! Take shorter showers and turn off the tap while you brush your teeth. Fix leaks fast: one dripping faucet can waste over 3,000 gallons of water in a year. Running the dishwasher or washing machine only when it is full saves water too.',
  },
  {
    title: 'Smarter farming',
    body: 'Farms use most of the fresh water on Earth, so smart farming makes a huge difference. Drip irrigation sends water straight to plant roots through little tubes, so very little is lost to evaporation. Farmers can also grow drought-tolerant crops and spread mulch, a cozy blanket of straw or wood chips that keeps soil cool and moist.',
  },
  {
    title: 'Protect water underground',
    body: 'An aquifer is water stored underground in layers of rock, sand and soil. Aquifers refill very slowly, so pumping out too much can drain them for many years. Rain gardens and ground that lets water soak in, instead of pavement, help rain trickle back down and refill them.',
  },
  {
    title: 'Plants that help',
    body: 'Native plants that grow naturally in an area have deep roots, so they need less watering and hold soil in place. Trees shade the ground and keep it from drying out. Planting them instead of thirsty lawns keeps more water in the ground for everyone.',
  },
  {
    title: 'Catch the rain',
    body: 'Rain barrels collect rainwater that runs off roofs. That saved water can be used later to water gardens, so less has to be pumped from rivers and aquifers.',
  },
];

interface QuizQuestion {
  q: string;
  options: string[];
  answer: string;
  section: string;
}

const QUIZ_POOL: QuizQuestion[] = [
  {
    q: 'Which way of watering sends water straight to plant roots?',
    options: ['Drip irrigation', 'Sprinklers at noon', 'Flooding the whole field', 'Hosing down the driveway'],
    answer: 'Drip irrigation',
    section: 'Smarter farming',
  },
  {
    q: 'About how much water can one dripping faucet waste in a year?',
    options: ['Over 3,000 gallons', 'About 1 cup', 'About 10 gallons', 'No water at all'],
    answer: 'Over 3,000 gallons',
    section: 'Save water at home',
  },
  {
    q: 'What does a rain barrel do?',
    options: ['Collects rainwater from roofs to use later', 'Makes it rain', 'Stores soda', 'Heats up water'],
    answer: 'Collects rainwater from roofs to use later',
    section: 'Catch the rain',
  },
  {
    q: 'Why are native plants with deep roots good during droughts?',
    options: ['They need less water and hold soil in place', 'They only grow underwater', 'They make clouds', 'They use the most water'],
    answer: 'They need less water and hold soil in place',
    section: 'Plants that help',
  },
  {
    q: 'What is an aquifer?',
    options: ['Water stored underground in rock and soil', 'A water park', 'A kind of cloud', 'A desert animal'],
    answer: 'Water stored underground in rock and soil',
    section: 'Protect water underground',
  },
  {
    q: 'How does mulch help plants during a drought?',
    options: ['It keeps soil cool and moist', 'It makes plants thirstier', 'It attracts tumbleweeds', 'It melts in the sun'],
    answer: 'It keeps soil cool and moist',
    section: 'Smarter farming',
  },
  {
    q: 'Why do hot temperatures make droughts worse?',
    options: ['Heat pulls more water out of the ground and plants', 'Heat makes more rain fall', 'Heat freezes rivers', "Heat doesn't change anything"],
    answer: 'Heat pulls more water out of the ground and plants',
    section: 'What is a drought?',
  },
];
const QUIZ_LENGTH = 3;

// ---------------------------------------------------------------
// Game constants (logical canvas pixels)
// ---------------------------------------------------------------
const W = 640;
const H = 360;
const GROUND = 304;
const CHEETAH_X = 130;
const GRAVITY = 2300;
const JUMP_VELOCITY = -800;
const HOLD_SECONDS = 0.22; // holding jump this long makes it floatier
const START_SPEED = 300;
const MAX_SPEED = 540;
const GOAL = 26000; // distance to the oasis in px
const PX_PER_METER = 20;
const STOP_DISTANCE = 200; // Zuri glides this far past the goal to reach the shade
const MAX_LIVES = 3;
const INVULNERABLE_SECONDS = 1.6;
const COINS_PER_DODGE = 1;
const OASIS_BONUS = 40;
const P = 2; // cheetah art pixel size

type Mode = 'ready' | 'running' | 'arriving' | 'napping' | 'gameover' | 'article' | 'quiz';

interface Tumbleweed {
  x: number;
  y: number;
  r: number;
  vy: number;
  bounces: boolean;
  hop: number; // upward speed each time it bounces
  angle: number;
  extra: number;
  sprite: number;
  passed: boolean;
  knocked: boolean;
}

interface Dust {
  x: number;
  y: number;
  life: number;
}

const HIT_LINES = [
  'Oof! That tumbleweed was prickly!',
  'Yikes! Jump sooner, those things roll fast!',
  "Ouch! I'm okay, keep running!",
  'Eek! Hold the jump button to leap higher!',
];

// ---------------------------------------------------------------
// Cheetah pixel art (side view, facing right)
// Each pose is drawn once into a small offscreen canvas at "art pixel" resolution,
// shaded and outlined automatically, then scaled up by P when drawn.
// ---------------------------------------------------------------
const ART_W = 56;
const ART_H = 32;
const ORIGIN_X = 24; // art x that sits at CHEETAH_X
const GROUND_ROW = 30; // art row that sits on the ground line

const FUR = {
  outline: '#2b1a10',
  base: '#e8ad4a',
  light: '#f7cd7b',
  dark: '#c4862f',
  far: '#b97a2a',
  cream: '#fbe7bf',
  muzzle: '#f3d49a',
  spot: '#2b1a10',
  nose: '#3a2418',
  eye: '#f2a516',
  white: '#fffaf0',
};

type Pt = [number, number];
interface Gait {
  bob: number;
  head: number;
  tail: number;
  feet: [Pt, Pt, Pt, Pt]; // far front, near front, far back, near back
}

// 6-frame gallop: flight, front strike, front support, gathered, hind support, push-off
const GALLOP: Gait[] = [
  { bob: -2, head: 0, tail: -2, feet: [[42, 25], [44, 24], [6, 25], [4, 24]] },
  { bob: -1, head: 1, tail: -1, feet: [[40, 29], [37, 28], [9, 26], [7, 25]] },
  { bob: 0, head: 1, tail: 0, feet: [[33, 29], [35, 29], [14, 27], [12, 26]] },
  { bob: 1, head: 0, tail: 1, feet: [[27, 28], [29, 29], [22, 29], [20, 28]] },
  { bob: 0, head: -1, tail: 0, feet: [[34, 26], [36, 25], [18, 29], [15, 29]] },
  { bob: -1, head: -1, tail: -1, feet: [[40, 25], [42, 24], [10, 29], [8, 28]] },
];
const JUMP_UP: Gait = { bob: -1, head: -1, tail: -2, feet: [[42, 23], [44, 22], [6, 24], [3, 23]] };
const JUMP_DOWN: Gait = { bob: 0, head: 1, tail: 1, feet: [[40, 28], [42, 27], [11, 24], [8, 23]] };

type CheetahFrame = 'sleep' | 'jumpUp' | 'jumpDown' | `run${number}`;

function makeArtCanvas(draw: (px: (x: number, y: number, w: number, h: number, c: string) => void, ctx: CanvasRenderingContext2D) => void) {
  return makeLayer(ART_W, ART_H, (ctx) => {
    const px = (x: number, y: number, w: number, h: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(x), Math.round(y), w, h);
    };
    draw(px, ctx);

    // Shade: lit top edges, darker undersides; then a 1px outline around everything
    const img = ctx.getImageData(0, 0, ART_W, ART_H);
    const d = img.data;
    const at = (x: number, y: number) => (y * ART_W + x) * 4;
    const opaque = (x: number, y: number) => x >= 0 && y >= 0 && x < ART_W && y < ART_H && d[at(x, y) + 3] > 0;
    const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const [br, bg, bb] = hex(FUR.base);
    const set = (i: number, c: string) => {
      const [r, g, b] = hex(c);
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
    };
    const shaded = new Uint8ClampedArray(d);
    for (let y = 0; y < ART_H; y++) {
      for (let x = 0; x < ART_W; x++) {
        const i = at(x, y);
        if (d[i] === br && d[i + 1] === bg && d[i + 2] === bb) {
          if (!opaque(x, y - 1)) {
            const [r, g, b] = hex(FUR.light);
            shaded.set([r, g, b, 255], i);
          } else if (!opaque(x, y + 1) || !opaque(x, y + 2)) {
            const [r, g, b] = hex(FUR.dark);
            shaded.set([r, g, b, 255], i);
          }
        }
      }
    }
    d.set(shaded);
    const outline: number[] = [];
    for (let y = 0; y < ART_H; y++) {
      for (let x = 0; x < ART_W; x++) {
        if (!opaque(x, y) && (opaque(x + 1, y) || opaque(x - 1, y) || opaque(x, y + 1) || opaque(x, y - 1))) outline.push(at(x, y));
      }
    }
    outline.forEach((i) => set(i, FUR.outline));
    ctx.putImageData(img, 0, 0);
  });
}

function fillEllipse(px: (x: number, y: number, w: number, h: number, c: string) => void, cx: number, cy: number, rx: number, ry: number, c: string) {
  for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
    const half = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));
    const x0 = Math.round(cx - half);
    const x1 = Math.round(cx + half);
    if (x1 >= x0) px(x0, y, x1 - x0 + 1, 1, c);
  }
}

// Stamps a thick pixel line (no anti-aliasing)
function stampLine(px: (x: number, y: number, w: number, h: number, c: string) => void, a: Pt, b: Pt, width: number, color: (i: number, n: number) => string) {
  const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1);
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(a[0] + ((b[0] - a[0]) * i) / steps) - Math.floor(width / 2);
    const y = Math.round(a[1] + ((b[1] - a[1]) * i) / steps) - Math.floor(width / 2);
    px(x, y, width, width, color(i, steps));
  }
}

function drawSpots(px: (x: number, y: number, w: number, h: number, c: string) => void, spots: Pt[], dy: number) {
  spots.forEach(([x, y], i) => px(x, y + dy, i % 3 === 0 ? 2 : 1, 1, FUR.spot));
}

const BODY_SPOTS: Pt[] = [
  [12, 14], [15, 12], [18, 15], [20, 13], [23, 14], [26, 13], [28, 15], [31, 14], [33, 16], [16, 17], [21, 17],
  [25, 16], [29, 18], [13, 18], [10, 16], [35, 13], [19, 19], [24, 19], [34, 19],
];

function buildRunFrame(g: Gait) {
  return makeArtCanvas((px) => {
    const b = g.bob;
    const shoulder: Pt = [32, 19 + b];
    const hip: Pt = [16, 18 + b];

    const leg = (from: Pt, foot: Pt, front: boolean, far: boolean) => {
      const tone = far ? FUR.far : FUR.base;
      const mid: Pt = [(from[0] + foot[0]) / 2, (from[1] + foot[1]) / 2];
      const len = Math.hypot(foot[0] - from[0], foot[1] - from[1]) || 1;
      const bend = front ? 2 : -2.5; // elbows bend back, hocks bend forward
      const knee: Pt = [mid[0] + ((foot[1] - from[1]) / len) * bend, mid[1] - ((foot[0] - from[0]) / len) * bend * 0.3];
      stampLine(px, from, knee, front ? 3 : 4, () => tone);
      stampLine(px, knee, foot, 2, () => tone);
      px(foot[0] - 1, foot[1] - 1, 3, 2, far ? FUR.dark : FUR.cream);
    };

    // Far legs behind the body
    leg(shoulder, g.feet[0], true, true);
    leg(hip, g.feet[2], false, true);

    // Tail: rings, then a white tip
    const t0: Pt = [10, 15 + b];
    const t1: Pt = [3, 18 + b];
    const t2: Pt = [2, 9 + b + g.tail];
    const tailPts: Pt[] = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      tailPts.push([(1 - t) ** 2 * t0[0] + 2 * (1 - t) * t * t1[0] + t * t * t2[0], (1 - t) ** 2 * t0[1] + 2 * (1 - t) * t * t1[1] + t * t * t2[1]]);
    }
    tailPts.forEach(([x, y], i) => {
      const c = i >= 13 ? FUR.white : i >= 9 && i % 2 === 1 ? FUR.spot : i % 4 === 3 ? FUR.spot : FUR.base;
      px(Math.round(x) - 1, Math.round(y) - 1, 2, 2, c);
    });

    // Body: muscular hindquarters, slim waist, deep chest, cream belly
    fillEllipse(px, 16, 17 + b, 7, 6, FUR.base);
    fillEllipse(px, 24, 16.5 + b, 11, 5, FUR.base);
    fillEllipse(px, 32, 17.5 + b, 6, 6, FUR.base);
    fillEllipse(px, 26, 21 + b, 8, 1.6, FUR.cream);
    fillEllipse(px, 33, 21 + b, 3.5, 2, FUR.cream);
    drawSpots(px, BODY_SPOTS, b);

    // Neck and head
    const h = b + g.head;
    fillEllipse(px, 36.5, 14 + h, 3.5, 4.5, FUR.base);
    fillEllipse(px, 41, 10 + h, 5, 4, FUR.base);
    fillEllipse(px, 43.5, 13 + h, 2.6, 1.3, FUR.muzzle);
    px(37, 5 + h, 2, 2, FUR.base);
    px(41, 5 + h, 2, 2, FUR.base);
    px(38, 6 + h, 1, 1, FUR.spot);
    px(42, 6 + h, 1, 1, FUR.spot);
    // Amber eye, nose, mouth and black tear marks
    px(42, 8 + h, 2, 2, FUR.eye);
    px(43, 9 + h, 1, 1, FUR.spot);
    px(42, 8 + h, 1, 1, FUR.white);
    px(45, 10 + h, 2, 1, FUR.nose);
    px(44, 13 + h, 2, 1, FUR.spot);
    [[42, 10], [42, 11], [43, 12]].forEach(([x, y]) => px(x, y + h, 1, 1, FUR.spot));
    [[37, 9], [39, 12], [36, 16]].forEach(([x, y]) => px(x, y + h, 1, 1, FUR.spot));

    // Near legs in front of the body
    leg(shoulder, g.feet[1], true, false);
    leg(hip, g.feet[3], false, false);
  });
}

function buildSleepFrame() {
  return makeArtCanvas((px) => {
    // Tail wrapped around the front
    stampLine(px, [8, 27], [12, 29], 2, () => FUR.base);
    stampLine(px, [12, 29], [34, 29], 2, (i) => (i % 4 === 2 ? FUR.spot : FUR.base));
    px(34, 28, 2, 2, FUR.white);
    // Curled body and hindquarters
    fillEllipse(px, 13, 24, 6, 5, FUR.base);
    fillEllipse(px, 23, 25, 12, 4.5, FUR.base);
    fillEllipse(px, 24, 28, 9, 1.4, FUR.cream);
    drawSpots(px, [[10, 22], [14, 21], [18, 23], [22, 22], [26, 23], [30, 22], [16, 25], [24, 25], [12, 26], [20, 26], [28, 25]], 0);
    // Front paws and head resting on them
    px(37, 28, 7, 2, FUR.cream);
    fillEllipse(px, 38, 24, 5, 4, FUR.base);
    fillEllipse(px, 41.5, 26.5, 2.5, 1.3, FUR.muzzle);
    px(35, 19, 2, 2, FUR.base);
    px(39, 19, 2, 2, FUR.base);
    // Closed, content eyes and tear marks
    [[38, 23], [39, 24], [40, 24], [41, 23]].forEach(([x, y]) => px(x, y, 1, 1, FUR.spot));
    [[40, 25], [41, 26]].forEach(([x, y]) => px(x, y, 1, 1, FUR.spot));
    px(42, 24, 2, 1, FUR.nose);
    [[34, 23], [36, 21]].forEach(([x, y]) => px(x, y, 1, 1, FUR.spot));
  });
}

function buildCheetahFrames() {
  const frames: Record<string, HTMLCanvasElement> = {
    sleep: buildSleepFrame(),
    jumpUp: buildRunFrame(JUMP_UP),
    jumpDown: buildRunFrame(JUMP_DOWN),
  };
  GALLOP.forEach((g, i) => (frames[`run${i}`] = buildRunFrame(g)));
  return frames;
}

function drawCheetah(ctx: CanvasRenderingContext2D, frames: Record<string, HTMLCanvasElement>, frame: CheetahFrame, x: number, y: number) {
  ctx.drawImage(frames[frame], Math.round(x - ORIGIN_X * P), Math.round(y - GROUND_ROW * P), ART_W * P, ART_H * P);
}

// ---------------------------------------------------------------
// Tumbleweeds: tangled twig balls, pre-drawn and rotated as they roll
// ---------------------------------------------------------------
const TUMBLE_SIZES = [15, 19, 23];

function makeTumbleweed(r: number, seed: number) {
  const size = r * 2 + 6;
  return makeLayer(size, size, (ctx) => {
    const rand = seeded(seed);
    const c = size / 2;
    const dot = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, 2, 2);
    };
    // Dense outer tangle, then twigs criss-crossing the middle
    for (let a = 0; a < Math.PI * 2; a += 0.09) {
      const rr = r - 1 - rand() * 4;
      dot(c + Math.cos(a) * rr, c + Math.sin(a) * rr, rand() < 0.5 ? '#6b4b25' : '#4a3218');
    }
    for (let i = 0; i < 34; i++) {
      const a1 = rand() * Math.PI * 2;
      const a2 = a1 + 1 + rand() * 2.5;
      const r1 = rand() * (r - 2);
      const r2 = rand() * (r - 2);
      const x1 = c + Math.cos(a1) * r1;
      const y1 = c + Math.sin(a1) * r1;
      const x2 = c + Math.cos(a2) * r2;
      const y2 = c + Math.sin(a2) * r2;
      const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2);
      const color = rand() < 0.4 ? '#c49a5c' : rand() < 0.5 ? '#8a6436' : '#5e4222';
      for (let s = 0; s <= steps; s++) dot(x1 + ((x2 - x1) * s) / steps, y1 + ((y2 - y1) * s) / steps, color);
    }
  });
}

// ---------------------------------------------------------------
// Desert background layers (pre-drawn, tile every W px)
// ---------------------------------------------------------------
interface Layers {
  sky: HTMLCanvasElement;
  scrolling: [HTMLCanvasElement, number][];
}

function buildLayers(): Layers {
  const sky = makeLayer(W, H, (ctx) => {
    const bands = 14;
    for (let i = 0; i < bands; i++) {
      ctx.fillStyle = mix('#4aa3df', '#fbe0b0', i / (bands - 1));
      ctx.fillRect(0, i * 18, W, 18);
    }
    ctx.fillStyle = '#fbe0b0';
    ctx.fillRect(0, bands * 18, W, H);
    const sun = (rad: number, color: string) => {
      ctx.fillStyle = color;
      for (let y = -rad; y <= rad; y += 2) {
        const half = Math.round(Math.sqrt(rad * rad - y * y) / 2) * 2;
        ctx.fillRect(520 - half, 70 + y, half * 2, 2);
      }
    };
    sun(34, '#fde9b8');
    sun(24, '#fff3c9');
    sun(18, '#fffdf0');
  });

  const mesas = makeLayer(W, H, (ctx) => {
    const rand = seeded(3);
    ctx.fillStyle = '#e3b58c';
    ctx.fillRect(0, 236, W, H);
    [
      [30, 150, 186],
      [250, 330, 200],
      [430, 560, 176],
    ].forEach(([x0, x1, top]) => {
      for (let x = x0 - 24; x < x1 + 24; x += 2) {
        const slope = x < x0 ? (x0 - x) * 2 : x > x1 ? (x - x1) * 2 : 0;
        const y = top + slope;
        ctx.fillStyle = x > (x0 + x1) / 2 ? '#c98e63' : '#d9a275';
        ctx.fillRect(x, y, 2, H - y);
      }
      ctx.fillStyle = '#e8b789';
      ctx.fillRect(x0, top, x1 - x0, 2);
      // Rock layers
      ctx.fillStyle = '#bb8159';
      for (let y = top + 12; y < 236; y += 14) ctx.fillRect(x0 + 4 + Math.floor(rand() * 6) * 2, y, x1 - x0 - 16, 2);
    });
  });

  const dunes = makeLayer(W, H, (ctx) => {
    const rand = seeded(9);
    const tops = ridge(ctx, W, H, 250, [[9, 2, 0.8], [5, 5, 2.2]], '#e7b979', '#f3cf96');
    for (let i = 0; i < 70; i++) {
      const x = Math.floor((rand() * (W - 20)) / 2) * 2;
      const y = tops[x] + 6 + Math.floor((rand() * 30) / 2) * 2;
      ctx.fillStyle = '#d9a866';
      ctx.fillRect(x, y, 10 + Math.floor(rand() * 4) * 2, 2);
    }
    // Saguaro cacti
    [[110, 1], [360, 0], [540, 1]].forEach(([cx, arms]) => {
      const base = tops[cx] + 4;
      ctx.fillStyle = '#6f8f4f';
      ctx.fillRect(cx, base - 36, 6, 36);
      ctx.fillRect(cx - 8, base - 24, 8, 4);
      ctx.fillRect(cx - 8, base - 34, 4, 12);
      if (arms) {
        ctx.fillRect(cx + 6, base - 18, 8, 4);
        ctx.fillRect(cx + 10, base - 28, 4, 12);
      }
      ctx.fillStyle = '#86a862';
      ctx.fillRect(cx + 1, base - 34, 2, 30);
    });
  });

  const near = makeLayer(W, H, (ctx) => {
    const rand = seeded(17);
    const tops = ridge(ctx, W, H, 282, [[5, 3, 0.2], [3, 8, 1.4]], '#efc684', '#f7d89e');
    for (let i = 0; i < 18; i++) {
      const x = 6 + Math.floor((rand() * (W - 12)) / 2) * 2;
      const y = tops[x] + 4 + Math.floor((rand() * (GROUND - tops[x] - 8)) / 2) * 2;
      if (rand() < 0.5) {
        // Dry shrub
        ctx.fillStyle = '#9a7b4a';
        ctx.fillRect(x - 4, y - 4, 2, 4);
        ctx.fillRect(x, y - 6, 2, 6);
        ctx.fillRect(x + 4, y - 4, 2, 4);
        ctx.fillRect(x - 2, y - 2, 6, 2);
      } else {
        // Rock
        ctx.fillStyle = '#b9875a';
        ctx.fillRect(x - 4, y - 4, 10, 4);
        ctx.fillStyle = '#d6a678';
        ctx.fillRect(x - 2, y - 4, 4, 2);
      }
    }
  });

  const ground = makeLayer(W, H, (ctx) => {
    const rand = seeded(29);
    ctx.fillStyle = '#e9bb76';
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = '#f5d498';
    ctx.fillRect(0, GROUND, W, 4);
    for (let i = 0; i < 60; i++) {
      const x = Math.floor((rand() * W) / 2) * 2;
      const y = GROUND + 8 + Math.floor((rand() * (H - GROUND - 18)) / 2) * 2;
      ctx.fillStyle = rand() < 0.5 ? '#d7a462' : '#f2cd8f';
      ctx.fillRect(x, y, rand() < 0.3 ? 8 : 2, 2);
    }
    ctx.fillStyle = '#c99257';
    ctx.fillRect(0, H - 10, W, 10);
  });

  return { sky, scrolling: [[mesas, 0.1], [dunes, 0.35], [near, 0.7], [ground, 1]] };
}

// The oasis Zuri naps at. `ox` is the screen x of her nap spot.
function drawOasis(ctx: CanvasRenderingContext2D, ox: number) {
  const x0 = Math.round(ox);
  // Grass ring and pond
  for (let dy = -14; dy <= 14; dy += 2) {
    const half = Math.round((Math.sqrt(1 - (dy / 15) ** 2) * 96) / 2) * 2;
    ctx.fillStyle = '#7cb342';
    ctx.fillRect(x0 + 120 - half, GROUND + 22 + dy, half * 2, 2);
  }
  for (let dy = -10; dy <= 10; dy += 2) {
    const half = Math.round((Math.sqrt(1 - (dy / 11) ** 2) * 80) / 2) * 2;
    ctx.fillStyle = dy < -6 ? '#7fd0ee' : '#4fb3d9';
    ctx.fillRect(x0 + 120 - half, GROUND + 22 + dy, half * 2, 2);
  }
  ctx.fillStyle = '#c6ecf8';
  [[90, 18], [130, 24], [150, 16]].forEach(([dx, dy]) => ctx.fillRect(x0 + dx, GROUND + dy, 10, 2));

  // Palm trees
  const palm = (px: number, height: number, lean: number) => {
    let tx = px;
    let ty = GROUND;
    for (let i = 0; i < height; i++) {
      tx = px + Math.round((Math.sin(i / 7) * lean) / 2) * 2;
      ty = GROUND - i * 8;
      ctx.fillStyle = i % 2 ? '#9a6b3f' : '#7d5330';
      ctx.fillRect(tx, ty - 8, 8, 8);
    }
    const cx = tx + 4;
    const cy = ty - 8;
    [-1, 1].forEach((dir) =>
      [0, 1, 2].forEach((f) => {
        for (let k = 1; k <= 10; k++) {
          const x = cx + dir * k * (4 - f);
          const y = cy - 6 + f * 4 + Math.round((k * k) / (5 - f));
          ctx.fillStyle = k > 7 ? '#3a7a2c' : '#4f9a3a';
          ctx.fillRect(x, y, 4, 4);
        }
      })
    );
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(cx - 4, cy, 4, 4);
    ctx.fillRect(cx + 2, cy + 2, 4, 4);
  };
  palm(x0 - 70, 15, 10);
  palm(x0 + 200, 12, -8);

  // Shady nap spot
  ctx.fillStyle = 'rgba(60, 40, 20, 0.22)';
  ctx.fillRect(x0 - 40, GROUND - 2, 90, 6);
  ctx.fillRect(x0 - 30, GROUND + 4, 70, 2);
}

// ---------------------------------------------------------------
interface Props {
  animal: AnimalInfo;
  isHappy: boolean;
  quest?: Quest;
  onClose: () => void;
  onStartQuest: () => void;
}

export default function ZuriRunGame({ animal, isHappy, quest, onClose, onStartQuest }: Props) {
  const { addCoins } = useGameState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const addCoinsRef = useRef(addCoins);
  addCoinsRef.current = addCoins;

  const game = useRef({
    mode: 'ready' as Mode,
    y: GROUND,
    vy: 0,
    airTime: 0,
    holding: false,
    speed: START_SPEED,
    distance: 0,
    lastSpawn: 0,
    nextGap: 500,
    tumbleweeds: [] as Tumbleweed[],
    dust: [] as Dust[],
    dustTimer: 0,
    runPhase: 0,
    lives: MAX_LIVES,
    invulnerable: 0,
    time: 0,
    hurtTime: -10,
    hurtY: GROUND,
    freeze: 0,
    dodged: 0,
    arriveSpeed: 0,
    halfwayCheered: false,
    nearCheered: false,
    packWarned: false,
    reviveUsed: false,
  });

  const [mode, setModeState] = useState<Mode>('ready');
  const [lives, setLives] = useState(MAX_LIVES);
  const [dodged, setDodged] = useState(0);
  const [meters, setMeters] = useState(0);
  const [reviveUsed, setReviveUsed] = useState(false);
  const [lostLifeAt, setLostLifeAt] = useState<number | null>(null);
  const [zuri, setZuri] = useState(
    "Phew, it's sooo hot! Help me race across the dunes to the oasis for a nap in the shade! Tap or press Space to jump over the tumbleweeds. Hold it down to leap higher!"
  );

  // Article + quiz state
  const [quiz, setQuiz] = useState<{ questions: QuizQuestion[]; index: number; options: string[]; wrong: string[]; solved: boolean }>({
    questions: [],
    index: 0,
    options: [],
    wrong: [],
    solved: false,
  });

  const setMode = (m: Mode) => {
    game.current.mode = m;
    setModeState(m);
  };

  const zuriSays = useCallback(
    (text: string) => {
      sounds.playAnimalChirp(animal.voicePitch);
      setZuri(text);
    },
    [animal.voicePitch]
  );

  useEffect(() => {
    if (lostLifeAt === null) return;
    const timer = setTimeout(() => setLostLifeAt(null), 1200);
    return () => clearTimeout(timer);
  }, [lostLifeAt]);

  const press = useCallback(() => {
    const g = game.current;
    g.holding = true;
    if (g.mode === 'ready') {
      g.mode = 'running';
      setModeState('running');
      return;
    }
    if (g.mode !== 'running' || g.freeze > 0) return;
    if (g.y >= GROUND) {
      g.vy = JUMP_VELOCITY;
      g.airTime = 0;
    }
  }, []);

  const release = useCallback(() => {
    game.current.holding = false;
  }, []);

  const restart = () => {
    sounds.playClick();
    Object.assign(game.current, {
      y: GROUND,
      vy: 0,
      speed: START_SPEED,
      distance: 0,
      lastSpawn: 0,
      nextGap: 500,
      tumbleweeds: [],
      dust: [],
      lives: MAX_LIVES,
      invulnerable: 0,
      hurtTime: -10,
      freeze: 0,
      dodged: 0,
      halfwayCheered: false,
      nearCheered: false,
      packWarned: false,
      reviveUsed: false,
    });
    setLives(MAX_LIVES);
    setDodged(0);
    setMeters(0);
    setReviveUsed(false);
    setMode('ready');
    setZuri('Ready for another dash to the oasis? Tap or press Space to start!');
  };

  // Keyboard: Space / Up / W to jump (hold for a higher leap). Captured so the world behind doesn't react.
  useEffect(() => {
    if (!isHappy) return;
    const isJumpKey = (e: KeyboardEvent) => e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW';
    const onDown = (e: KeyboardEvent) => {
      if (!isJumpKey(e)) return;
      if ((e.target as HTMLElement)?.tagName === 'BUTTON' && e.code === 'Space') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat) press();
    };
    const onUp = (e: KeyboardEvent) => {
      if (isJumpKey(e)) release();
    };
    window.addEventListener('keydown', onDown, true);
    window.addEventListener('keyup', onUp, true);
    window.addEventListener('pointerup', release);
    return () => {
      window.removeEventListener('keydown', onDown, true);
      window.removeEventListener('keyup', onUp, true);
      window.removeEventListener('pointerup', release);
    };
  }, [isHappy, press, release]);

  // Main game loop
  useEffect(() => {
    if (!isHappy) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;
    const layers = buildLayers();
    const tumbleSprites = TUMBLE_SIZES.map((r, i) => makeTumbleweed(r, 100 + i * 31));
    const cheetahFrames = buildCheetahFrames();

    let raf = 0;
    let last = performance.now();
    let shownMeters = -1;

    const loseLife = (message: string) => {
      const g = game.current;
      g.lives -= 1;
      g.invulnerable = INVULNERABLE_SECONDS;
      g.hurtTime = g.time;
      g.hurtY = g.y - 44;
      g.freeze = 0.3;
      setLives(g.lives);
      setLostLifeAt(Date.now());
      sounds.playHurt();
      if (g.lives <= 0) {
        g.mode = 'gameover';
        setModeState('gameover');
        zuriSays(
          g.reviveUsed
            ? `Oh no, that's the end of my run! We made it ${Math.floor(g.distance / PX_PER_METER)} m. Want to try again?`
            : "Oh no, I'm out of lives! Read a quick article about preventing droughts and answer a few questions to earn one more life!"
        );
      } else {
        zuriSays(message);
      }
    };

    const step = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const g = game.current;
      g.time += dt;

      if (g.freeze > 0) {
        g.freeze -= dt;
      } else if (g.mode === 'running' || g.mode === 'arriving') {
        if (g.mode === 'running') {
          g.speed = Math.min(MAX_SPEED, START_SPEED + (g.distance / GOAL) * (MAX_SPEED - START_SPEED) * 1.1);
        } else {
          // Glide to a stop right in the palm shade
          g.speed = Math.max(0, g.speed - ((g.arriveSpeed * g.arriveSpeed) / (2 * STOP_DISTANCE)) * dt);
        }
        const move = g.speed * dt;
        g.distance += move;
        g.runPhase += move / 26;
        g.invulnerable = Math.max(0, g.invulnerable - dt);

        // Jumping
        if (g.y < GROUND || g.vy < 0) {
          g.airTime += dt;
          const floaty = g.holding && g.vy < 0 && g.airTime < HOLD_SECONDS;
          g.vy += GRAVITY * (floaty ? 0.45 : 1) * dt;
          g.y += g.vy * dt;
          if (g.y >= GROUND) {
            g.y = GROUND;
            g.vy = 0;
          }
        }

        // Dust kicked up behind her paws
        g.dustTimer -= dt;
        if (g.y >= GROUND && g.speed > 40 && g.dustTimer <= 0) {
          g.dustTimer = 0.06;
          g.dust.push({ x: CHEETAH_X - 22, y: GROUND - 4, life: 1 });
        }
        g.dust.forEach((d) => {
          d.x -= g.speed * 0.6 * dt;
          d.y -= 12 * dt;
          d.life -= dt * 2.2;
        });
        g.dust = g.dust.filter((d) => d.life > 0);

        // Spawn tumbleweeds until the oasis comes into view
        if (g.mode === 'running' && g.distance - g.lastSpawn > g.nextGap && g.distance < GOAL - 1100) {
          g.lastSpawn = g.distance;
          // Every so often a tight pack of 2-3 rolls in together. They share one speed so the
          // spacing never changes, and a single well-timed (held) jump clears the whole pack.
          const pack = g.distance > 2500 && Math.random() < 0.25 ? (Math.random() < 0.4 ? 3 : 2) : 1;
          const extra = 40 + Math.random() * (pack > 1 ? 60 : 110);
          // Packs mix rollers and bouncers (at least one of each). Pack bouncers take low,
          // out-of-sync hops so one jump still clears everything; lone bouncers hop high.
          const bounceFlags = pack === 1 ? [Math.random() < 0.4] : shuffle([true, false, Math.random() < 0.5]).slice(0, pack);
          if (pack > 1 && bounceFlags.every((b) => b === bounceFlags[0])) bounceFlags[0] = !bounceFlags[0];
          let x = W + 30;
          for (let i = 0; i < pack; i++) {
            const size = Math.floor(Math.random() * (pack > 1 ? 2 : TUMBLE_SIZES.length));
            const r = TUMBLE_SIZES[size];
            const hop = pack > 1 ? 150 + Math.random() * 70 : 240 + Math.random() * 140;
            x += r;
            g.tumbleweeds.push({
              x,
              y: GROUND - r,
              r,
              vy: bounceFlags[i] ? -Math.random() * hop : 0,
              bounces: bounceFlags[i],
              hop,
              angle: i,
              extra,
              sprite: size,
              passed: false,
              knocked: false,
            });
            x += r + 10;
          }
          g.nextGap = 300 + Math.random() * 380 + g.speed * 0.25 + (pack - 1) * 180;
          if (pack > 1 && !g.packWarned) {
            g.packWarned = true;
            zuriSays('Whoa, a whole bunch at once! Hold the jump to leap over them all!');
          }
        }

        g.tumbleweeds.forEach((t) => {
          const v = g.speed + t.extra;
          t.x -= v * dt;
          t.angle -= (v * dt) / t.r;
          if (t.knocked) {
            t.vy += GRAVITY * 0.5 * dt;
            t.y += t.vy * dt;
            t.x += 260 * dt;
            return;
          }
          if (t.bounces) {
            t.vy += GRAVITY * 0.5 * dt;
            t.y += t.vy * dt;
            if (t.y > GROUND - t.r) {
              t.y = GROUND - t.r;
              t.vy = -t.hop;
            }
          }
          if (!t.passed && t.x + t.r < CHEETAH_X - 18) {
            t.passed = true;
            g.dodged += 1;
            setDodged(g.dodged);
            addCoinsRef.current(animal.biome, COINS_PER_DODGE);
          }
        });
        g.tumbleweeds = g.tumbleweeds.filter((t) => t.x > -60 && t.y < H + 60);

        // Collisions
        if (g.mode === 'running' && g.invulnerable <= 0) {
          const hit = g.tumbleweeds.find(
            (t) => !t.knocked && !t.passed && circleHitsRect(t.x, t.y, t.r * 0.8, CHEETAH_X - 22, g.y - 38, 58, 32)
          );
          if (hit) {
            hit.knocked = true;
            hit.vy = -320;
            loseLife(HIT_LINES[Math.floor(Math.random() * HIT_LINES.length)]);
          }
        }

        // Progress cheers and arrival
        if (!g.halfwayCheered && g.distance > GOAL / 2) {
          g.halfwayCheered = true;
          zuriSays("Halfway there! I can almost smell the water. Keep it up!");
        }
        if (!g.nearCheered && g.distance > GOAL - 1100) {
          g.nearCheered = true;
          zuriSays('I see the oasis! Palm trees, cool water... almost there!');
        }
        if (g.mode === 'running' && g.distance >= GOAL) {
          g.mode = 'arriving';
          setModeState('arriving');
          g.arriveSpeed = g.speed;
        }
        if (g.mode === 'arriving' && g.speed <= 0 && g.y >= GROUND) {
          g.mode = 'napping';
          setModeState('napping');
          sounds.playFanfare();
          addCoinsRef.current(animal.biome, OASIS_BONUS);
          zuriSays('Ahhh... cool water and shade. You got me here! Time for a cat nap... Zzz...');
        }
        const wholeMeters = Math.floor(Math.min(GOAL, g.distance) / PX_PER_METER);
        if (wholeMeters !== shownMeters) {
          shownMeters = wholeMeters;
          setMeters(wholeMeters);
        }
      } else if (g.mode === 'ready') {
        g.runPhase = 0;
      }

      // ---- Draw ----
      const sinceHurt = g.time - g.hurtTime;
      ctx.save();
      applyHurtShake(ctx, sinceHurt);

      ctx.drawImage(layers.sky, 0, 0);
      layers.scrolling.forEach(([layer, factor]) => drawTiled(ctx, layer, g.distance * factor));

      const oasisX = CHEETAH_X + STOP_DISTANCE + (GOAL - g.distance);
      if (oasisX < W + 260) drawOasis(ctx, oasisX);

      g.dust.forEach((d) => {
        ctx.fillStyle = `rgba(243, 214, 162, ${Math.max(0, d.life) * 0.8})`;
        ctx.fillRect(Math.round(d.x), Math.round(d.y), 4, 4);
      });

      g.tumbleweeds.forEach((t) => {
        if (!t.knocked) {
          ctx.fillStyle = 'rgba(80, 50, 20, 0.18)';
          ctx.fillRect(Math.round(t.x - t.r * 0.8), GROUND, Math.round(t.r * 1.6), 4);
        }
        const sprite = tumbleSprites[t.sprite];
        ctx.save();
        ctx.translate(Math.round(t.x), Math.round(t.y));
        ctx.rotate(t.angle);
        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        ctx.restore();
      });

      // Zuri
      const blink = g.invulnerable > 0 && Math.floor(g.time * 10) % 2 === 0;
      if (!blink || g.mode === 'napping') {
        let frame: CheetahFrame = 'run2';
        if (g.mode === 'napping') frame = 'sleep';
        else if (g.y < GROUND) frame = g.vy < 0 ? 'jumpUp' : 'jumpDown';
        else if (g.mode === 'running' || g.mode === 'arriving') frame = `run${Math.floor(g.runPhase) % GALLOP.length}`;
        // Shadow shrinks as she leaps
        const lift = Math.min(1, (GROUND - g.y) / 160);
        const shadowW = Math.round(64 * (1 - lift * 0.5));
        ctx.fillStyle = `rgba(80, 50, 20, ${0.22 * (1 - lift * 0.5)})`;
        ctx.fillRect(CHEETAH_X + 4 - shadowW / 2, GROUND, shadowW, 4);
        drawCheetah(ctx, cheetahFrames, frame, CHEETAH_X, Math.round(g.y));
      }
      if (g.mode === 'napping') {
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffffff';
        [0, 0.6, 1.2].forEach((offset, i) => {
          const t = (g.time + offset) % 1.8;
          ctx.globalAlpha = Math.max(0, 1 - t / 1.8);
          ctx.fillText('z', CHEETAH_X + 36 + i * 10 + t * 8, GROUND - 26 - i * 12 - t * 18);
        });
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      drawHurtFeedback(ctx, {
        w: W,
        h: H,
        sinceHurt,
        x: CHEETAH_X,
        y: g.hurtY,
        livesLeft: g.lives,
        showBanner: g.mode !== 'gameover',
        noun: 'LIFE',
      });

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isHappy, animal.biome, zuriSays]);

  // ---- Article + quiz ----
  const loadQuestion = (questions: QuizQuestion[], index: number) => {
    setQuiz({ questions, index, options: shuffle(questions[index].options), wrong: [], solved: false });
  };

  const openArticle = () => {
    sounds.playClick();
    setQuiz({ questions: [], index: 0, options: [], wrong: [], solved: false });
    setMode('article');
  };

  const startQuiz = () => {
    sounds.playClick();
    // Coming back from rereading the article keeps the quiz where it was
    if (quiz.questions.length === 0) loadQuestion(shuffle(QUIZ_POOL).slice(0, QUIZ_LENGTH), 0);
    setMode('quiz');
  };

  const answer = (choice: string) => {
    const q = quiz.questions[quiz.index];
    if (quiz.solved || quiz.wrong.includes(choice)) return;
    if (choice === q.answer) {
      sounds.playCoin();
      setQuiz((cur) => ({ ...cur, solved: true }));
    } else {
      sounds.playClick();
      setQuiz((cur) => ({ ...cur, wrong: [...cur.wrong, choice] }));
    }
  };

  const nextQuizStep = () => {
    sounds.playClick();
    if (quiz.index < quiz.questions.length - 1) {
      loadQuestion(quiz.questions, quiz.index + 1);
      return;
    }
    // All questions answered: restore one life and keep running
    const g = game.current;
    g.lives = 1;
    g.reviveUsed = true;
    g.invulnerable = INVULNERABLE_SECONDS;
    g.y = GROUND;
    g.vy = 0;
    g.tumbleweeds = g.tumbleweeds.filter((t) => t.x > CHEETAH_X + 520);
    g.lastSpawn = g.distance;
    setLives(1);
    setReviveUsed(true);
    sounds.playFanfare();
    setMode('ready');
    zuriSays("You know your drought facts! I've got one more life. It's my last one, so let's be careful! Tap or press Space to keep running!");
  };

  const avatar = isHappy ? animal.avatar : animal.avatar.replace('.png', '_sad.png');
  const progress = Math.min(1, (meters * PX_PER_METER) / GOAL);
  const currentQuestion = quiz.questions[quiz.index];

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
                {isHappy ? `${animal.name.toUpperCase()}'S DUNE DASH` : animal.name.toUpperCase()}
              </h3>
              <p className="text-[8.5px] text-[#fde68a]/80 mt-0.5">{animal.biomeName} • Race to the oasis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 pixel-btn-red text-[9px]" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isHappy ? (
          /* Locked until the desert is restored */
          <div className="p-6 bg-[#fcf6e8] flex flex-col items-center text-center gap-3">
            <img src={avatar} alt={`${animal.name} looking sad`} className="w-28 h-28" style={{ imageRendering: 'pixelated' }} />
            <div className="pixel-card p-3 max-w-md text-[10px] leading-relaxed">
              <strong>{animal.name}:</strong> &quot;It&apos;s way too hot and dry to run... the wells are empty and there&apos;s no
              water anywhere. Please help bring water back to the desert, then we can race to the oasis together!&quot;
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
            {/* Zuri's speech bubble */}
            <div className="flex items-start gap-3">
              <img src={avatar} alt={animal.name} className="w-12 h-12 flex-shrink-0" style={{ imageRendering: 'pixelated' }} />
              <div className="flex-1 border-2 border-[#5c2c16] bg-[#fffbf2] p-2.5 text-[10px] leading-relaxed shadow-[2px_2px_0px_#2e1005]" aria-live="polite">
                <strong>{animal.name}:</strong> {zuri}
              </div>
            </div>

            {/* HUD */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] font-bold text-[#5c2c16]">
              <div className="flex items-center gap-1" aria-label={`${lives} of ${MAX_LIVES} lives`}>
                {Array.from({ length: MAX_LIVES }).map((_, i) => (
                  <span key={i} className="relative inline-flex">
                    <Heart className={`w-5 h-5 ${i < lives ? 'text-[#dc2626] fill-[#dc2626]' : 'text-[#a8a29e]'}`} />
                    {i === lives && lostLifeAt !== null && (
                      <Heart key={lostLifeAt} className="absolute inset-0 w-5 h-5 text-[#dc2626] fill-[#dc2626] animate-ping" />
                    )}
                  </span>
                ))}
              </div>
              <span>TUMBLEWEEDS DODGED: {dodged}</span>
              <span className="flex items-center gap-1 text-[#b45309]">
                <Coins className="w-3 h-3" /> +{COINS_PER_DODGE} PER DODGE • +{OASIS_BONUS} AT THE OASIS
              </span>
              {reviveUsed ? (
                <span className="text-[#78350f]">EXTRA LIFE USED</span>
              ) : (
                <span className="text-[#15803d]">1 EXTRA LIFE AVAILABLE</span>
              )}
            </div>

            {/* Distance to the oasis */}
            <div className="flex items-center gap-2 text-[8.5px] font-bold text-[#5c2c16]">
              <span className="whitespace-nowrap">{Math.floor(meters)} m</span>
              <div className="relative flex-1 h-3 bg-[#3e1a06] border-2 border-[#2e1005]">
                <div className="h-full bg-[#f59e0b] transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
              </div>
              <span className="whitespace-nowrap flex items-center gap-1">
                <Flag className="w-3 h-3 text-[#15803d]" /> OASIS {GOAL / PX_PER_METER} m
              </span>
            </div>

            {/* Game canvas */}
            <div className="relative border-4 border-[#2e1005] shadow-[3px_3px_0px_#2e1005] select-none">
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                onPointerDown={(e) => {
                  e.preventDefault();
                  press();
                }}
                className="block w-full h-auto cursor-pointer"
                style={{ imageRendering: 'pixelated', touchAction: 'none', aspectRatio: `${W} / ${H}` }}
                aria-label="Cheetah running game. Press Space or tap to jump, hold to jump higher."
              />

              {mode === 'ready' && (
                <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center">
                  <span className="pixel-card px-3 py-1.5 text-[10px] font-bold animate-pulse">TAP OR PRESS SPACE TO RUN & JUMP!</span>
                </div>
              )}

              {mode === 'napping' && (
                <div className="absolute inset-x-0 top-4 flex justify-center">
                  <div className="pixel-panel p-3.5 text-center max-w-xs">
                    <h4 className="font-pixel-heading text-xs mb-1">OASIS REACHED!</h4>
                    <p className="text-[9.5px] mb-2.5">
                      {animal.name} is napping in the shade. You dodged {dodged} tumbleweed{dodged === 1 ? '' : 's'} and earned a +{OASIS_BONUS} coin bonus!
                    </p>
                    <button onClick={restart} className="pixel-btn px-3 py-1.5 text-[9px] inline-flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> RUN AGAIN
                    </button>
                  </div>
                </div>
              )}

              {mode === 'gameover' && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#2e1005]/60">
                  <div className="pixel-panel p-4 text-center max-w-xs">
                    <h4 className="font-pixel-heading text-xs mb-1">{reviveUsed ? 'GAME OVER' : 'OUT OF LIVES!'}</h4>
                    <p className="text-[9.5px] mb-3">
                      You ran {Math.floor(meters)} m.{' '}
                      {reviveUsed
                        ? 'You already used your extra life this run. Start a new run to try again!'
                        : 'Read a short article about preventing droughts and answer a few questions to earn one extra life!'}
                    </p>
                    <div className="flex flex-col gap-2">
                      {!reviveUsed && (
                        <button onClick={openArticle} className="pixel-btn-green px-3 py-1.5 text-[9px] flex items-center justify-center gap-1">
                          <BookOpen className="w-3 h-3" /> READ & EARN A LIFE
                        </button>
                      )}
                      <button onClick={restart} className="pixel-btn px-3 py-1.5 text-[9px] flex items-center justify-center gap-1">
                        <RotateCcw className="w-3 h-3" /> START A NEW RUN
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'article' && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#2e1005]/70 p-3">
                  <div className="pixel-panel w-full max-w-lg max-h-full flex flex-col">
                    <div className="p-3 border-b-2 border-[#5c2c16] flex items-center gap-1.5 text-[10px] font-bold text-[#b45309]">
                      <BookOpen className="w-4 h-4" /> HOW WE CAN PREVENT DROUGHTS
                    </div>
                    <div className="p-3 overflow-y-auto space-y-2.5 text-[9.5px] leading-relaxed">
                      {ARTICLE.map((section) => (
                        <div key={section.title}>
                          <h5 className="font-bold text-[#2e1005] mb-0.5">{section.title}</h5>
                          <p>{section.body}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-2.5 border-t-2 border-[#5c2c16] flex justify-between items-center gap-2">
                      <span className="text-[8.5px] text-[#78350f]">Next: {QUIZ_LENGTH} questions about this article</span>
                      <button onClick={startQuiz} className="pixel-btn-green px-3 py-1.5 text-[9px] flex items-center gap-1">
                        I&apos;M READY FOR THE QUESTIONS <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'quiz' && currentQuestion && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#2e1005]/70 p-3 overflow-y-auto">
                  <div className="pixel-panel p-3.5 w-full max-w-md">
                    <div className="flex items-center justify-between text-[9px] font-bold text-[#b45309] mb-1">
                      <span>DROUGHT QUIZ</span>
                      <span>
                        QUESTION {quiz.index + 1} OF {quiz.questions.length}
                      </span>
                    </div>
                    <p className="text-[10.5px] font-bold mb-2.5 leading-snug">{currentQuestion.q}</p>
                    <div className="grid gap-1.5">
                      {quiz.options.map((opt) => {
                        const isWrong = quiz.wrong.includes(opt);
                        const isRight = quiz.solved && opt === currentQuestion.answer;
                        return (
                          <button
                            key={opt}
                            onClick={() => answer(opt)}
                            disabled={quiz.solved || isWrong}
                            className={`text-left px-2.5 py-1.5 border-2 text-[9.5px] shadow-[2px_2px_0px_#2e1005] transition-colors ${
                              isRight
                                ? 'bg-[#dcfce7] border-[#15803d]'
                                : isWrong
                                  ? 'bg-[#fee2e2] border-[#b91c1c] line-through opacity-70'
                                  : 'bg-[#fffbf2] border-[#5c2c16] hover:bg-[#fde68a]'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {quiz.wrong.length > 0 && !quiz.solved && (
                      <div className="mt-2.5 p-2 border-2 bg-[#fef3c7] border-[#b45309] text-[9px] leading-relaxed">
                        <strong>Not quite!</strong> Look back at the &quot;{currentQuestion.section}&quot; part of the article and try again.
                        <button onClick={() => setMode('article')} className="ml-1 underline font-bold">
                          Reread the article
                        </button>
                      </div>
                    )}
                    {quiz.solved && (
                      <div className="mt-2.5 p-2 border-2 bg-[#dcfce7] border-[#15803d] text-[9px] flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#15803d]" /> <strong>Correct!</strong>
                      </div>
                    )}

                    <div className="flex justify-end mt-2.5">
                      {quiz.solved && (
                        <button onClick={nextQuizStep} className="pixel-btn-green px-3 py-1.5 text-[9px]">
                          {quiz.index < quiz.questions.length - 1 ? 'NEXT QUESTION →' : 'EARN MY EXTRA LIFE →'}
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
