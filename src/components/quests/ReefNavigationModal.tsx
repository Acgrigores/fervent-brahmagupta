'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { seeded, makeLayer, outlineArt, applyHurtShake } from '@/components/minigames/canvasFx';
import { X, ArrowRight, CheckCircle, Circle, Ship, Palmtree, Sparkles, Award, RotateCcw } from 'lucide-react';

// ---------------------------------------------------------------
// Part 1 "Safe Passage": drag each ship along a route to its matching dock.
// Routes over a reef are allowed, but the ship crashes, the coral bleaches, and the
// ship sails back to try again. Part 2 "Vacation Quiz": reef-safe travel habits.
// ---------------------------------------------------------------
const W = 640;
const H = 360;
const SHIP_R = 10; // how close a route can get to a reef
const PORT_R = 22;
const SPEED = 120; // px per second when sailing
const RETURN_SPEED = 230;
const BEACH = 44;

const REEFS: [number, number, number][] = [
  [175, 120, 30],
  [165, 255, 28],
  [270, 60, 26],
  [285, 190, 34],
  [300, 320, 26],
  [400, 120, 30],
  [410, 255, 32],
  [505, 60, 24],
  [510, 185, 28],
  [520, 310, 24],
];

type ShipKind = 'cargo' | 'cruise' | 'fishing';
interface ShipDef {
  kind: ShipKind;
  name: string;
  flag: string;
  flagName: string;
  start: [number, number];
  port: [number, number];
}

const SHIPS: ShipDef[] = [
  { kind: 'cargo', name: 'cargo ship', flag: '#dc2626', flagName: 'red', start: [64, 80], port: [600, 280] },
  { kind: 'cruise', name: 'cruise ship', flag: '#2563eb', flagName: 'blue', start: [64, 180], port: [600, 80] },
  { kind: 'fishing', name: 'fishing boat', flag: '#eab308', flagName: 'yellow', start: [64, 280], port: [600, 180] },
];

const reefAt = (x: number, y: number) => REEFS.findIndex(([rx, ry, r]) => Math.hypot(x - rx, y - ry) < r + SHIP_R);
const offMap = (x: number, y: number) => y < 8 || y > H - 8 || x < BEACH - 6 || x > W - 4;

interface QuizItem {
  q: string;
  good: 'yes' | 'no';
  why: string;
}

const QUIZ: QuizItem[] = [
  { q: "You're snorkeling and spot a beautiful coral. Do you reach out and touch it?", good: 'no', why: 'Coral is a living animal. Even a gentle touch can scrape off its protective slime and spread disease.' },
  { q: 'Before swimming at the beach, do you put on reef-safe mineral sunscreen?', good: 'yes', why: 'Some sunscreen chemicals, like oxybenzone, can harm coral. Mineral sunscreens with zinc oxide are a safer choice.' },
  { q: 'At a gift shop, do you buy a souvenir made from real coral or seashells?', good: 'no', why: 'Buying coral and shells encourages people to take them from the reef. Choose a photo or locally made art instead!' },
  { q: 'Tired while snorkeling, do you stand on the reef to rest?', good: 'no', why: 'Standing on coral crushes it. Rest by floating, or swim back to a sandy spot or the boat.' },
  { q: 'Do you book boat and dive tours with eco-certified, reef-friendly operators?', good: 'yes', why: 'Eco-certified operators use mooring buoys, keep groups small and teach guests how to protect the reef.' },
  { q: 'Do you toss bread or snacks into the water to feed the fish?', good: 'no', why: 'Feeding fish changes their natural behavior and diet, which throws the whole reef ecosystem off balance.' },
  { q: 'On your way off the beach, do you pick up your trash and take it with you?', good: 'yes', why: 'Plastic and litter wash into the ocean, where it can smother coral and harm turtles like Coralia.' },
  { q: 'If you go boating, do you tie up to a mooring buoy instead of dropping anchor on the reef?', good: 'yes', why: 'Anchors and chains can smash coral that took hundreds of years to grow. Mooring buoys keep boats off the reef.' },
];

type Part = 'ocean' | 'quiz' | 'done';
const QUIZ_DOT_COLORS = ['#f472b6', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#38bdf8', '#a78bfa', '#e879f9'];
type ShipMode = 'idle' | 'sailing' | 'crashed' | 'returning' | 'docked';

interface ShipState {
  pos: [number, number];
  angle: number;
  mode: ShipMode;
  route: [number, number][];
  progress: number;
  timer: number;
  crashReef: number;
}

const freshShips = (): ShipState[] =>
  SHIPS.map((s) => ({ pos: [...s.start] as [number, number], angle: 0, mode: 'idle', route: [], progress: 0, timer: 0, crashReef: -1 }));

// ---------------------------------------------------------------
// Pixel art (drawn once into offscreen canvases)
// ---------------------------------------------------------------
function buildWater() {
  return makeLayer(W, H, (ctx) => {
    const rand = seeded(12);
    ctx.fillStyle = '#0b6aa6';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = rand() < 0.5 ? '#0e78b8' : '#095d93';
      ctx.fillRect(Math.floor((rand() * W) / 2) * 2, Math.floor((rand() * H) / 2) * 2, 2 + Math.floor(rand() * 3) * 2, 2);
    }
  });
}

// Pastel beach hut: thatched roof, plank walls, shuttered window, door, porch, stilts and a surfboard
const HUT_ART = [
  '.....TTTT.......',
  '...TTtTTtTT.....',
  '.TTtTTtTTtTT..F.',
  'TtTTtTTtTTtTT.Ff',
  'yyyyyyyyyyyyy.Ff',
  '.WwWwWwWwWwW..Ff',
  '.WSgSWwWDDwW..Ff',
  '.WSgSWwWDDwW..Ff',
  '.WwWwWwWDdwW..Ff',
  'hhhhhhhhhhhhh.F.',
  '.p..p...p..p....',
  '.p..p...p..p....',
];
const HUT_COLORS: Record<string, string> = {
  T: '#e5b04f',
  t: '#a8742a',
  y: '#92400e',
  W: '#5eead4',
  w: '#2dd4bf',
  S: '#f472b6',
  g: '#fde68a',
  D: '#9a3412',
  d: '#facc15',
  h: '#b45309',
  p: '#78350f',
  F: '#fb7185',
  f: '#fde047',
};

function buildHut() {
  const w = HUT_ART[0].length + 2;
  const h = HUT_ART.length + 2;
  return makeLayer(w, h, (ctx) => {
    HUT_ART.forEach((row, y) =>
      row.split('').forEach((ch, x) => {
        if (!HUT_COLORS[ch]) return;
        ctx.fillStyle = HUT_COLORS[ch];
        ctx.fillRect(x + 1, y + 1, 1, 1);
      })
    );
    outlineArt(ctx, w, h, '#1c1917');
  });
}

function buildBeach() {
  return makeLayer(W, H, (ctx) => {
    const rand = seeded(4);
    // Sand with a wavy shoreline and foam
    for (let y = 0; y < H; y += 2) {
      const edge = BEACH - 6 + Math.round(Math.sin(y / 18) * 3) * 2;
      ctx.fillStyle = '#e9d39b';
      ctx.fillRect(0, y, edge, 2);
      ctx.fillStyle = '#f5e4b5';
      ctx.fillRect(edge - 4, y, 4, 2);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(edge, y, 2, 2);
    }
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = rand() < 0.5 ? '#d6bd82' : '#fbefcf';
      ctx.fillRect(Math.floor(rand() * (BEACH - 12)), Math.floor(rand() * H), 2, 2);
    }
    // Palm trees and a little beach hut
    const palm = (x: number, y: number) => {
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 ? '#92400e' : '#78350f';
        ctx.fillRect(x + Math.round(i / 3) * 2, y - i * 4, 4, 4);
      }
      ctx.fillStyle = '#15803d';
      [[-10, -26], [-6, -28], [4, -28], [8, -26], [-12, -22], [10, -22]].forEach(([dx, dy]) => ctx.fillRect(x + dx, y + dy, 8, 3));
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x - 4, y - 30, 12, 4);
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(x, y - 24, 3, 3);
    };
    palm(10, 40);
    palm(16, 230);
    palm(8, 345);
    // Cozy beach hut on stilts, drawn at 2x like the ships
    const hut = buildHut();
    ctx.drawImage(hut, 2, 112, hut.width * 2, hut.height * 2);
  });
}

// Coral palettes: [base, dark, light]. The bleached set replaces them when a reef is dying.
const CORAL_PALETTE: [string, string, string][] = [
  ['#f472b6', '#be185d', '#fbcfe8'],
  ['#fb923c', '#c2410c', '#fed7aa'],
  ['#a78bfa', '#6d28d9', '#ddd6fe'],
  ['#facc15', '#a16207', '#fef08a'],
  ['#f87171', '#b91c1c', '#fecaca'],
  ['#e879f9', '#a21caf', '#fae8ff'],
  ['#2dd4bf', '#0f766e', '#ccfbf1'],
  ['#fb7185', '#be123c', '#ffe4e6'],
  ['#a3e635', '#4d7c0f', '#ecfccb'],
  ['#60a5fa', '#1d4ed8', '#dbeafe'],
  ['#fdba74', '#c2410c', '#ffedd5'],
];
const BLEACHED_PALETTE: [string, string, string][] = [
  ['#f5f5f4', '#a8a29e', '#ffffff'],
  ['#e7e5e4', '#a8a29e', '#fafaf9'],
  ['#fafaf9', '#d6d3d1', '#ffffff'],
];

type CoralShape = 'branch' | 'brain' | 'fan' | 'tube' | 'anemone' | 'star';
const CORAL_SHAPES: CoralShape[] = ['branch', 'brain', 'fan', 'tube', 'anemone', 'branch', 'brain', 'star'];

function drawCoralShape(c: CanvasRenderingContext2D, shape: CoralShape, x: number, y: number, [base, dark, light]: [string, string, string]) {
  const px = (dx: number, dy: number, w: number, h: number, color: string) => {
    c.fillStyle = color;
    c.fillRect(x + dx, y + dy, w, h);
  };
  switch (shape) {
    case 'branch':
      // Antler coral with light tips
      px(-1, -2, 2, 7, dark);
      [[-5, -6, 4], [3, -8, 5], [-2, -9, 3], [5, -3, 3], [-6, -1, 3]].forEach(([dx, dy, len]) => {
        px(dx, dy, 2, len, base);
        px(dx, dy, 2, 1, light);
      });
      px(-5, -3, 5, 1, base);
      px(1, -4, 5, 1, base);
      break;
    case 'brain': {
      // Round dome with winding grooves
      for (let dy = -5; dy <= 4; dy++) {
        const half = Math.round(6 * Math.sqrt(Math.max(0, 1 - (dy / 5.5) ** 2)));
        px(-half, dy, half * 2, 1, dy < -2 ? light : base);
      }
      [[-4, -2], [-1, -3], [2, -2], [-3, 0], [0, 1], [3, 0], [-2, 2], [1, 3]].forEach(([dx, dy]) => px(dx, dy, 2, 1, dark));
      break;
    }
    case 'fan':
      // Lacy sea fan on a short stalk
      for (let dy = -8; dy <= -1; dy++) {
        const half = Math.round(7 * Math.sqrt(Math.max(0, 1 - ((dy + 1) / 8) ** 2)));
        for (let dx = -half; dx < half; dx++) px(dx, dy, 1, 1, (dx + dy) % 3 === 0 || (dx - dy) % 4 === 0 ? dark : dy < -5 ? light : base);
      }
      px(-1, -1, 2, 4, dark);
      break;
    case 'tube':
      // Cluster of tube coral with glowing openings
      [[-5, -6, 8], [-1, -9, 11], [3, -5, 7], [6, -3, 5]].forEach(([dx, dy, len]) => {
        px(dx, dy, 3, len, base);
        px(dx + 2, dy, 1, len, dark);
        px(dx, dy, 3, 1, light);
      });
      break;
    case 'anemone':
      // Swaying anemone tentacles around a bright center
      [[-6, -4], [-4, -7], [-1, -8], [2, -8], [5, -6], [6, -3], [-6, -1], [6, 0]].forEach(([dx, dy]) => {
        px(dx, dy, 2, 3, base);
        px(dx, dy, 2, 1, light);
      });
      px(-3, -3, 7, 5, dark);
      px(-2, -2, 5, 3, light);
      break;
    case 'star':
      // A little starfish resting on the sand
      px(-1, -5, 3, 11, base);
      px(-5, -1, 11, 3, base);
      px(-4, -4, 2, 2, base);
      px(3, -4, 2, 2, base);
      px(-4, 3, 2, 2, base);
      px(3, 3, 2, 2, base);
      px(0, 0, 1, 1, dark);
      px(-1, -5, 1, 1, light);
      break;
  }
}

// A reef: a sandy, turquoise lagoon with a foam ring and a colorful (or bleached) coral garden
function buildReef(r: number, index: number, bleached: boolean) {
  const size = (r + 14) * 2;
  return makeLayer(size, size, (ctx) => {
    const c = size / 2;
    const rand = seeded(index * 17 + 3);
    const disc = (cx: number, cy: number, rr: number, color: string) => {
      ctx.fillStyle = color;
      for (let dy = -rr; dy <= rr; dy += 2) {
        const half = Math.round(Math.sqrt(Math.max(0, rr * rr - dy * dy)) / 2) * 2;
        if (half > 0) ctx.fillRect(cx - half, cy + dy, half * 2, 2);
      }
    };
    // Lagoon: foam ring, shallow turquoise bands and sandy patches
    disc(c, c, r + 11, 'rgba(240, 249, 255, 0.7)');
    disc(c, c, r + 9, bleached ? '#6fc9be' : '#14b8a6');
    disc(c, c, r + 5, bleached ? '#8dd8cd' : '#2dd4bf');
    disc(c, c, r, bleached ? '#a7e3da' : '#5eead4');
    for (let i = 0; i < 3; i++) {
      const a = rand() * Math.PI * 2;
      disc(Math.round(c + Math.cos(a) * r * 0.4), Math.round(c + Math.sin(a) * r * 0.4), Math.round(r * 0.35), bleached ? '#e7dfc8' : '#fde9b0');
    }
    // Foam sparkle on the ring
    ctx.fillStyle = '#ffffff';
    for (let a = 0; a < Math.PI * 2; a += 0.45) ctx.fillRect(Math.round(c + Math.cos(a + index) * (r + 10)), Math.round(c + Math.sin(a + index) * (r + 10)), 2, 2);

    // Coral garden (outlined so every piece pops)
    const palette = bleached ? BLEACHED_PALETTE : CORAL_PALETTE;
    const corals = makeLayer(size, size, (cc) => {
      const placed: [number, number][] = [];
      // Spread the corals across the whole lagoon instead of bunching in the middle
      for (let tries = 0; tries < 200 && placed.length < Math.round(r / 2.4); tries++) {
        const a = rand() * Math.PI * 2;
        const d = (0.25 + 0.75 * Math.sqrt(rand())) * (r - 6);
        const x = Math.round(c + Math.cos(a) * d);
        const y = Math.round(c + Math.sin(a) * d) + 4;
        if (placed.some(([px, py]) => Math.hypot(px - x, py - y) < 12)) continue;
        placed.push([x, y]);
      }
      placed
        .sort((p, q) => p[1] - q[1])
        .forEach(([x, y], i) => {
          const colors = palette[Math.floor(rand() * palette.length)];
          drawCoralShape(cc, CORAL_SHAPES[(i + index) % CORAL_SHAPES.length], x, y, colors);
        });
      outlineArt(cc, size, size, bleached ? '#78716c' : '#3b0764');
    });
    ctx.drawImage(corals, 0, 0);
  });
}

// Ships face right; drawn at 2x and rotated toward where they are heading
const SHIP_ART: Record<ShipKind, string[]> = {
  cargo: [
    '...RRBBGGYY.......',
    '...RRBBGGYYWWW....',
    'hhhhhhhhhhhhhhhh..',
    'hhhhhhhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhhh..',
    '..dddddddddddd....',
  ],
  cruise: [
    '......KK..KK......',
    '....wwwwwwwwww....',
    '...wbwbwbwbwbwww..',
    'hhhhhhhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhhhhh',
    '..dddddddddddddd..',
  ],
  fishing: [
    '.......m..........',
    '.......m.nnn......',
    '.....wwmwnnn......',
    'hhhhhhhhhhhhhh....',
    '.hhhhhhhhhhhhhh...',
    '..dddddddddd......',
  ],
};
const SHIP_COLORS: Record<ShipKind, Record<string, string>> = {
  cargo: { R: '#ef4444', B: '#3b82f6', G: '#22c55e', Y: '#facc15', W: '#f8fafc', h: '#b91c1c', d: '#7f1d1d' },
  cruise: { K: '#f97316', w: '#f8fafc', b: '#38bdf8', h: '#1d4ed8', d: '#1e3a8a' },
  fishing: { m: '#78350f', n: '#d6d3d1', w: '#f8fafc', h: '#ca8a04', d: '#854d0e' },
};

function buildShip(kind: ShipKind) {
  const rows = SHIP_ART[kind];
  const w = rows[0].length + 2;
  const h = rows.length + 2;
  return makeLayer(w, h, (ctx) => {
    rows.forEach((row, y) =>
      row.split('').forEach((ch, x) => {
        const color = SHIP_COLORS[kind][ch];
        if (!color) return;
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, 1, 1);
      })
    );
    outlineArt(ctx, w, h, '#1c1917');
  });
}

// Sunset beach postcard scene behind the vacation quiz
function buildVacationScene() {
  const VW = 320;
  const VH = 180;
  return makeLayer(VW, VH, (ctx) => {
    const rand = seeded(77);
    const px = (x: number, y: number, w: number, h: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
    };
    // Sunset sky bands with squiggly, pixel-stepped edges between the colors
    const sky = ['#7c3aed', '#a855f7', '#d946ef', '#f472b6', '#fb7185', '#fb923c', '#fbbf24', '#fde68a'];
    for (let x = 0; x < VW; x += 2) {
      let top = 0;
      sky.forEach((c, i) => {
        // Each boundary wiggles with two waves of different sizes, rounded to whole pixels
        const bottom =
          i === sky.length - 1
            ? 96
            : (i + 1) * 12 + Math.round(Math.sin(x / (9 + i * 2) + i * 1.7) * 2.5 + Math.sin(x / 4 + i * 3) * 1);
        px(x, top, 2, bottom - top, c);
        top = bottom;
      });
    }
    // Big sun sitting on the horizon
    for (let dy = -26; dy <= 0; dy++) {
      const half = Math.round(Math.sqrt(26 * 26 - dy * dy));
      px(220 - half, 96 + dy, half * 2, 1, dy > -6 ? '#fde047' : '#fef08a');
    }
    // Seagulls
    [[60, 30], [80, 22], [140, 40], [260, 28]].forEach(([x, y]) => {
      px(x, y, 3, 1, '#1e1b4b');
      px(x + 3, y - 1, 1, 1, '#1e1b4b');
      px(x + 4, y, 3, 1, '#1e1b4b');
    });
    // Sea with sparkles and a little island
    ['#0ea5e9', '#0284c7', '#0369a1', '#075985'].forEach((c, i) => px(0, 96 + i * 8, VW, 8, c));
    for (let i = 0; i < 60; i++) px(Math.floor(rand() * VW), 98 + Math.floor(rand() * 28), 4, 1, rand() < 0.5 ? '#fde68a' : '#bae6fd');
    px(196, 104, 50, 1, '#fde047');
    px(204, 108, 34, 1, '#fde047');
    px(60, 93, 40, 4, '#15803d');
    px(66, 91, 28, 2, '#16a34a');
    px(78, 80, 2, 12, '#78350f');
    [[-8, 0], [-5, -2], [2, -2], [5, 0]].forEach(([dx, dy]) => px(76 + dx, 80 + dy, 7, 2, '#22c55e'));
    // Sandy beach with a foamy shoreline
    px(0, 128, VW, 52, '#f5d58f');
    for (let x = 0; x < VW; x += 2) px(x, 128 + Math.round(Math.sin(x / 9) * 2), 2, 3, '#fefce8');
    for (let i = 0; i < 120; i++) px(Math.floor(rand() * VW), 134 + Math.floor(rand() * 46), 1, 1, rand() < 0.5 ? '#e6be6e' : '#fff7d6');
    // Striped beach umbrella and towel
    for (let dy = 0; dy < 10; dy++) {
      const half = 4 + dy * 2;
      for (let x = -half; x < half; x++) px(250 + x, 132 + dy, 1, 1, Math.floor((x + half) / 4) % 2 ? '#ffffff' : '#ef4444');
    }
    px(249, 142, 2, 26, '#78350f');
    px(222, 160, 34, 12, '#38bdf8');
    for (let x = 222; x < 256; x += 6) px(x, 160, 3, 12, '#fde047');
    // Sandcastle
    px(150, 158, 24, 12, '#d6a85a');
    px(152, 150, 6, 8, '#d6a85a');
    px(166, 150, 6, 8, '#d6a85a');
    px(158, 146, 8, 12, '#e3b96b');
    px(160, 162, 4, 8, '#7c5a2a');
    px(161, 140, 1, 6, '#78350f');
    px(162, 140, 4, 3, '#f472b6');
    // Palm trees on both sides
    const palm = (x: number, base: number, lean: number) => {
      for (let i = 0; i < 16; i++) px(x + Math.round((i * lean) / 16), base - i * 4, 5, 4, i % 2 ? '#92400e' : '#78350f');
      const tx = x + lean + 2;
      const ty = base - 64;
      [[-18, 4], [-12, -2], [-4, -6], [6, -6], [14, -2], [20, 4]].forEach(([dx, dy]) => {
        px(tx + dx - 4, ty + dy, 12, 3, '#15803d');
        px(tx + dx - 2, ty + dy - 1, 8, 2, '#22c55e');
      });
      px(tx - 2, ty + 2, 4, 4, '#7c2d12');
      px(tx + 3, ty + 3, 4, 4, '#7c2d12');
    };
    palm(18, 176, 10);
    palm(292, 178, -12);
    // Seashells and a starfish in the sand
    [[110, 170, '#f9a8d4'], [196, 174, '#fdba74'], [40, 166, '#c4b5fd']].forEach(([x, y, c]) => {
      px(x as number, y as number, 4, 3, c as string);
      px((x as number) + 1, (y as number) - 1, 2, 1, c as string);
    });
    px(282, 170, 7, 2, '#fb923c');
    px(284, 167, 3, 8, '#fb923c');
  });
}

function drawPort(ctx: CanvasRenderingContext2D, s: ShipDef, time: number) {
  const [x, y] = s.port;
  // Wooden pier on posts
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(x - 10, y - 16, 44, 32);
  ctx.fillStyle = '#92400e';
  ctx.fillRect(x - 9, y - 15, 42, 30);
  ctx.fillStyle = '#b45309';
  for (let i = 0; i < 7; i++) ctx.fillRect(x - 9, y - 14 + i * 4, 42, 2);
  ctx.fillStyle = '#3f2a14';
  [[-10, -18], [30, -18], [-10, 14], [30, 14]].forEach(([dx, dy]) => ctx.fillRect(x + dx, y + dy, 4, 4));
  // Waving flag in the ship's color
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(x + 22, y - 36, 2, 22);
  const wave = Math.round(Math.sin(time * 5) * 1);
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(x + 24, y - 37 + wave, 14, 10);
  ctx.fillStyle = s.flag;
  ctx.fillRect(x + 24, y - 36 + wave, 13, 8);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(x + 24, y - 36 + wave, 13, 2);
}

// ---------------------------------------------------------------
export default function ReefNavigationModal() {
  const { activeQuestModal, closeQuestModal, completeQuest, quests, restoration } = useGameState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: W, h: H });

  const [part, setPart] = useState<Part>('ocean');
  const [dockedList, setDockedList] = useState<boolean[]>(SHIPS.map(() => false));
  const [message, setMessage] = useState<{ tone: 'info' | 'good' | 'bad'; text: string }>({
    tone: 'info',
    text: 'Help these ships reach their docks! Press on a ship and drag a route to the dock with its matching flag. Keep to the deep blue water, away from my coral!',
  });
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<'yes' | 'no' | null>(null);
  const [vacationBg, setVacationBg] = useState<string | null>(null);

  // Paint the sunset beach backdrop for the quiz once
  useEffect(() => {
    setVacationBg(buildVacationScene().toDataURL());
  }, []);

  const sim = useRef({
    ships: freshShips(),
    drawing: null as null | { ship: number; points: [number, number][]; blocked: boolean },
    reefHealth: REEFS.map(() => 1), // 1 = healthy colors, 0 = fully bleached
    dying: REEFS.map(() => false),
    crumbs: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
    wake: [] as { x: number; y: number; life: number }[],
    hurtTime: -10,
    time: 0,
  });

  const resetOcean = () => {
    const g = sim.current;
    g.ships = freshShips();
    g.drawing = null;
    g.reefHealth = REEFS.map(() => 1);
    g.dying = REEFS.map(() => false);
    g.crumbs = [];
    g.wake = [];
    setDockedList(SHIPS.map(() => false));
  };

  // Start fresh every time the task opens (also after the game progress is reset)
  useEffect(() => {
    if (activeQuestModal !== 'reef_navigation') return;
    resetOcean();
    setPart('ocean');
    setQuizIndex(0);
    setQuizAnswer(null);
    setMessage({
      tone: 'info',
      text: 'Help these ships reach their docks! Press on a ship and drag a route to the dock with its matching flag. Keep to the deep blue water, away from my coral!',
    });
  }, [activeQuestModal]);

  // Fit the ocean canvas to the space left on screen
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      const w = Math.max(200, Math.min(width, (height * W) / H));
      setCanvasSize({ w: Math.floor(w), h: Math.floor((w * H) / W) });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [part, activeQuestModal]);

  // Ocean render + sailing loop
  useEffect(() => {
    if (activeQuestModal !== 'reef_navigation' || part !== 'ocean') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const water = buildWater();
    const beach = buildBeach();
    const reefAlive = REEFS.map(([, , r], i) => buildReef(r, i, false));
    const reefDead = REEFS.map(([, , r], i) => buildReef(r, i, true));
    const shipArt = SHIPS.map((s) => buildShip(s.kind));
    const fish = Array.from({ length: 6 }, (_, i) => ({ x: (i * 113) % W, y: 40 + ((i * 61) % 280), speed: 18 + (i % 3) * 8 }));
    const buoys: [number, number, string][] = [
      [230, 150, '#dc2626'],
      [345, 140, '#16a34a'],
      [460, 220, '#dc2626'],
      [355, 255, '#16a34a'],
    ];

    let raf = 0;
    let last = performance.now();

    // Moves a ship along its route; returns true when it reaches the end
    const advance = (ship: ShipState, dist: number) => {
      ship.progress += dist;
      let remaining = ship.progress;
      for (let k = 1; k < ship.route.length; k++) {
        const [x1, y1] = ship.route[k - 1];
        const [x2, y2] = ship.route[k];
        const seg = Math.hypot(x2 - x1, y2 - y1);
        if (remaining <= seg) {
          const t = seg ? remaining / seg : 1;
          ship.pos = [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
          if (seg > 0.5) ship.angle = Math.atan2(y2 - y1, x2 - x1);
          return false;
        }
        remaining -= seg;
      }
      ship.pos = ship.route[ship.route.length - 1];
      return true;
    };

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = sim.current;
      g.time += dt;

      g.ships.forEach((ship, i) => {
        const def = SHIPS[i];
        if (ship.mode === 'sailing') {
          const moving = !advance(ship, SPEED * dt);
          if (Math.random() < 0.5) g.wake.push({ x: ship.pos[0] - Math.cos(ship.angle) * 16, y: ship.pos[1] - Math.sin(ship.angle) * 16, life: 1 });
          if (!moving) {
            if (ship.crashReef >= 0) {
              // Hit the reef: the coral starts dying
              ship.mode = 'crashed';
              ship.timer = 1.6;
              g.dying[ship.crashReef] = true;
              g.hurtTime = g.time;
              sounds.playHurt();
              const [rx, ry] = REEFS[ship.crashReef];
              for (let k = 0; k < 18; k++) {
                g.crumbs.push({ x: rx + (Math.random() - 0.5) * 30, y: ry + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 40, vy: 10 + Math.random() * 30, life: 1 });
              }
            } else {
              ship.mode = 'docked';
              ship.angle = 0;
              ship.pos = [def.port[0] - 16, def.port[1]];
              sounds.playCoin();
              setDockedList((list) => list.map((d, k) => (k === i ? true : d)));
            }
          }
        } else if (ship.mode === 'crashed') {
          ship.timer -= dt;
          if (ship.timer <= 0) {
            // Head back to the harbor along the same route
            ship.route = [...ship.route].reverse();
            ship.progress = 0;
            ship.mode = 'returning';
          }
        } else if (ship.mode === 'returning') {
          if (advance(ship, RETURN_SPEED * dt)) {
            ship.mode = 'idle';
            ship.angle = 0;
            ship.pos = [...def.start];
            if (ship.crashReef >= 0) g.dying[ship.crashReef] = false; // the coral recovers for another try
            ship.crashReef = -1;
          }
        }
      });

      // Coral bleaches while a reef is "dying", and recovers once the ship is gone
      g.reefHealth = g.reefHealth.map((h, i) => (g.dying[i] ? Math.max(0, h - dt * 1.3) : Math.min(1, h + dt * 1.5)));
      g.crumbs.forEach((c) => {
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.life -= dt * 0.8;
      });
      g.crumbs = g.crumbs.filter((c) => c.life > 0);
      g.wake.forEach((w) => (w.life -= dt * 1.6));
      g.wake = g.wake.filter((w) => w.life > 0);

      // ---- Draw ----
      ctx.save();
      applyHurtShake(ctx, g.time - g.hurtTime);
      ctx.drawImage(water, 0, 0);
      // Drifting wave dashes and shimmer
      for (let i = 0; i < 60; i++) {
        const x = Math.round((((i * 97 + g.time * 14) % (W + 40)) - 20) / 2) * 2;
        const y = (i * 53) % H;
        ctx.fillStyle = i % 5 === 0 ? 'rgba(255,255,255,0.35)' : '#1d8fd1';
        ctx.fillRect(x, y, i % 5 === 0 ? 4 : 10, 2);
      }

      // Fish swimming in the deep water
      fish.forEach((f) => {
        f.x = (f.x + f.speed * dt) % (W + 30);
        const x = Math.round(f.x) - 15;
        const y = Math.round(f.y + Math.sin(g.time * 2 + f.y) * 3);
        ctx.fillStyle = 'rgba(7, 47, 84, 0.55)';
        ctx.fillRect(x, y, 8, 4);
        ctx.fillRect(x - 3, y - 1, 3, 6);
      });

      REEFS.forEach(([rx, ry, r], i) => {
        const size = (r + 14) * 2;
        ctx.drawImage(reefDead[i], rx - size / 2, ry - size / 2);
        ctx.globalAlpha = g.reefHealth[i];
        ctx.drawImage(reefAlive[i], rx - size / 2, ry - size / 2);
        ctx.globalAlpha = 1;
      });

      // Broken coral crumbling away
      g.crumbs.forEach((c) => {
        ctx.globalAlpha = Math.max(0, c.life);
        ctx.fillStyle = '#e7e5e4';
        ctx.fillRect(Math.round(c.x), Math.round(c.y), 3, 3);
      });
      ctx.globalAlpha = 1;

      // Channel buoys bobbing
      buoys.forEach(([x, y, color], i) => {
        const by = Math.round(y + Math.sin(g.time * 2 + i) * 2);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(x - 4, by - 6, 8, 10);
        ctx.fillStyle = color;
        ctx.fillRect(x - 3, by - 5, 6, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 3, by - 2, 6, 2);
      });

      ctx.drawImage(beach, 0, 0);
      SHIPS.forEach((s) => drawPort(ctx, s, g.time));

      // Foamy wake behind moving ships
      g.wake.forEach((w) => {
        ctx.globalAlpha = Math.max(0, w.life) * 0.8;
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(Math.round(w.x) - 2, Math.round(w.y) - 2, 4, 4);
      });
      ctx.globalAlpha = 1;

      // Route being drawn: ship color, red where it crosses a reef
      const d = g.drawing;
      if (d && d.points.length > 1) {
        d.points.forEach(([x, y], k) => {
          if (k % 2) return;
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6);
          ctx.fillStyle = reefAt(x, y) >= 0 ? '#ef4444' : SHIPS[d.ship].flag;
          ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
        });
      }

      // Ships (ready ships glow)
      g.ships.forEach((ship, i) => {
        const art = shipArt[i];
        const ready = ship.mode === 'idle' && !(d && d.ship === i);
        ctx.save();
        ctx.translate(Math.round(ship.pos[0]), Math.round(ship.pos[1] + (ship.mode === 'idle' || ship.mode === 'docked' ? Math.sin(g.time * 2 + i) : 0)));
        if (ready && Math.sin(g.time * 4) > 0) {
          ctx.fillStyle = 'rgba(253, 230, 138, 0.5)';
          ctx.fillRect(-art.width - 2, -art.height - 2, art.width * 2 + 4, art.height * 2 + 4);
        }
        ctx.rotate(ship.angle);
        ctx.drawImage(art, -art.width, -art.height, art.width * 2, art.height * 2);
        ctx.restore();
      });
      ctx.restore();

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [activeQuestModal, part]);

  if (activeQuestModal !== 'reef_navigation') return null;

  const reefQuest = quests.find((q) => q.id === 'quest_reefs');
  const restored = !!reefQuest?.completed && (restoration.reefs || 0) >= 80;
  const docked = dockedList.filter(Boolean).length;
  const allDocked = docked === SHIPS.length;
  const coraliaImg = restored ? '/assets/sprites/sea_turtle.png' : '/assets/sprites/sea_turtle_sad.png';

  // ---- Drawing routes ----
  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - rect.left) / rect.width) * W, ((e.clientY - rect.top) / rect.height) * H];
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toCanvas(e);
    const i = sim.current.ships.findIndex((s) => s.mode === 'idle' && Math.hypot(s.pos[0] - p[0], s.pos[1] - p[1]) < 24);
    if (i < 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    sim.current.drawing = { ship: i, points: [sim.current.ships[i].pos], blocked: false };
    setMessage({ tone: 'info', text: `Drawing a route for the ${SHIPS[i].name}. Steer to the ${SHIPS[i].flagName} flag, and watch out for red: that means coral!` });
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = sim.current.drawing;
    if (!d) return;
    const p = toCanvas(e);
    const [lx, ly] = d.points[d.points.length - 1];
    const dist = Math.hypot(p[0] - lx, p[1] - ly);
    if (dist < 4) return;
    // Fill in points so fast drags still follow every bit of the route
    const steps = Math.ceil(dist / 4);
    for (let k = 1; k <= steps; k++) {
      const x = lx + ((p[0] - lx) * k) / steps;
      const y = ly + ((p[1] - ly) * k) / steps;
      if (offMap(x, y)) continue;
      d.points.push([x, y]);
      if (reefAt(x, y) >= 0) d.blocked = true;
    }
  };

  const onUp = () => {
    const d = sim.current.drawing;
    if (!d) return;
    sim.current.drawing = null;
    const def = SHIPS[d.ship];
    const ship = sim.current.ships[d.ship];
    if (d.points.length < 3) return;

    // A route over a reef is allowed... but the ship will crash into the coral
    const hit = d.points.findIndex(([x, y]) => reefAt(x, y) >= 0);
    if (hit >= 0) {
      ship.route = d.points.slice(0, hit + 1);
      ship.crashReef = reefAt(d.points[hit][0], d.points[hit][1]);
      ship.progress = 0;
      ship.mode = 'sailing';
      sounds.playWaterSplash();
      setMessage({
        tone: 'bad',
        text: `Oh no! That route runs straight over my coral. Watch what happens when a ${def.name} hits a reef... The ship will sail back so you can find a safer route.`,
      });
      return;
    }

    const end = d.points[d.points.length - 1];
    if (Math.hypot(end[0] - def.port[0], end[1] - def.port[1]) > PORT_R + 14) {
      sounds.playClick();
      setMessage({ tone: 'bad', text: `The ${def.name} needs to finish at its own dock, the one with the ${def.flagName} flag.` });
      return;
    }
    ship.route = [...d.points, [def.port[0] - 16, def.port[1]]];
    ship.crashReef = -1;
    ship.progress = 0;
    ship.mode = 'sailing';
    sounds.playWaterSplash();
    setMessage({ tone: 'good', text: `Safe route! The ${def.name} is sailing through deep water, far from the coral. Thank you!` });
  };

  // ---- Quiz ----
  const item = QUIZ[quizIndex];
  const answer = (choice: 'yes' | 'no') => {
    if (quizAnswer === item.good) return;
    setQuizAnswer(choice);
    if (choice === item.good) sounds.playCoin();
    else sounds.playClick();
  };
  const nextQuestion = () => {
    sounds.playClick();
    if (quizIndex < QUIZ.length - 1) {
      setQuizIndex(quizIndex + 1);
      setQuizAnswer(null);
    } else {
      setPart('done');
    }
  };

  const finish = () => {
    completeQuest('quest_reefs', 'Steered three ships safely around the coral reefs and passed the reef-safe vacation quiz.');
  };

  const steps: { id: Part; label: string }[] = [
    { id: 'ocean', label: 'Safe passage' },
    { id: 'quiz', label: 'Vacation quiz' },
    { id: 'done', label: 'Restore the reef' },
  ];
  const partIndex = steps.findIndex((s) => s.id === part);
  const bubbleTone =
    message.tone === 'good' ? 'bg-[#dcfce7] border-[#15803d]' : message.tone === 'bad' ? 'bg-[#fee2e2] border-[#b91c1c]' : 'bg-[#e0f2fe] border-[#0369a1]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel">
      <div className="relative w-full max-w-3xl h-full max-h-[720px] pixel-panel overflow-hidden text-[#2e1005] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 p-3 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 border-2 border-[#fde68a] bg-[#2e1005] overflow-hidden flex-shrink-0">
              <img src={coraliaImg} alt="Coralia the sea turtle" className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-pixel-heading text-[13px] text-[#fde68a] tracking-wider truncate">SAFE PASSAGE FOR CORALIA</h3>
              <p className="text-[10.5px] text-[#fde68a]/85 mt-0.5 truncate">Coral Reef • Guide the ships, then travel reef-safe</p>
            </div>
          </div>
          {part === 'ocean' && (
            <div className="flex items-center gap-1.5" aria-label={`${docked} of ${SHIPS.length} ships docked`}>
              {SHIPS.map((s, i) => (
                <span
                  key={s.kind}
                  className={`w-7 h-7 border-2 flex items-center justify-center ${dockedList[i] ? 'border-[#fde68a]' : 'border-[#78350f] opacity-50'}`}
                  style={{ background: dockedList[i] ? s.flag : '#2e1005' }}
                  title={`${s.name}${dockedList[i] ? ' docked' : ''}`}
                >
                  <Ship className="w-4 h-4 text-white" />
                </span>
              ))}
            </div>
          )}
          <button onClick={closeQuestModal} className="p-1 pixel-btn-red flex-shrink-0" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="px-3 py-1.5 bg-[#e0f2fe] border-b-2 border-[#0369a1] flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold flex-shrink-0">
          {steps.map((s, i) => (
            <span key={s.id} className={`flex items-center gap-1 ${i < partIndex ? 'text-[#15803d]' : i === partIndex ? 'text-[#0c4a6e]' : 'text-[#78716c]'}`}>
              {i < partIndex ? <CheckCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
              {i + 1}. {s.label}
            </span>
          ))}
        </div>

        <div
          className="flex-1 min-h-0 flex flex-col gap-2 p-3 bg-[#fcf6e8]"
          style={
            part !== 'ocean' && vacationBg
              ? { backgroundImage: `url(${vacationBg})`, backgroundSize: 'cover', backgroundPosition: 'center bottom', imageRendering: 'pixelated' }
              : undefined
          }
        >
          {/* Part 1: the ocean */}
          {part === 'ocean' && (
            <>
              {/* Coralia's speech bubble (fixed height so the ocean never jumps around) */}
              <div className="flex items-start gap-2 flex-shrink-0">
                <img src={coraliaImg} alt="" className="w-10 h-10 flex-shrink-0" style={{ imageRendering: 'pixelated' }} />
                <div className={`flex-1 border-2 px-2.5 py-1.5 text-[11px] leading-snug h-[52px] overflow-hidden shadow-[2px_2px_0px_#2e1005] ${bubbleTone}`} aria-live="polite">
                  <strong>Coralia:</strong> {message.text}
                </div>
              </div>
              <div ref={stageRef} className="flex-1 min-h-0 flex items-center justify-center">
                <div className="border-4 border-[#2e1005] shadow-[3px_3px_0px_#2e1005]" style={{ width: canvasSize.w, height: canvasSize.h }}>
                  <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                    className="block w-full h-full cursor-crosshair"
                    style={{ imageRendering: 'pixelated', touchAction: 'none' }}
                    aria-label="Ocean map: drag each ship along a route to its matching dock without crossing the coral reefs"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    sounds.playClick();
                    resetOcean();
                  }}
                  className="pixel-btn px-3 py-1.5 text-[11px] inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> RESET SHIPS
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setPart('quiz');
                  }}
                  disabled={!allDocked}
                  className="pixel-btn-green px-4 py-2 text-[12px] inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Ship className="w-4 h-4" /> NEXT: VACATION QUIZ <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* Part 2: the vacation quiz, styled like a postcard from the beach */}
          {part === 'quiz' && (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center gap-2.5 py-1">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#4c1d95] text-[11.5px] font-bold text-white shadow-[2px_2px_0px_#2e1005]"
                style={{ background: 'linear-gradient(90deg, #f472b6, #fb923c, #facc15)' }}
              >
                <Palmtree className="w-4 h-4" /> ON VACATION, DO YOU...?
              </div>
              <div className="flex items-center gap-1 bg-white/80 border-2 border-[#4c1d95] px-2 py-1">
                {QUIZ.map((_, i) => (
                  <span
                    key={i}
                    className={`w-3.5 h-3.5 border-2 border-[#1c1917] ${i === quizIndex ? 'scale-125' : ''}`}
                    style={{ background: i <= quizIndex ? QUIZ_DOT_COLORS[i % QUIZ_DOT_COLORS.length] : '#ffffff', opacity: i > quizIndex ? 0.6 : 1 }}
                  />
                ))}
                <span className="ml-1.5 text-[10.5px] font-bold text-[#4c1d95]">
                  {quizIndex + 1}/{QUIZ.length}
                </span>
              </div>

              {/* Postcard: airmail stripes, a Coralia stamp and the question */}
              <div
                className="relative w-full max-w-lg p-[6px] shadow-[4px_4px_0px_#2e1005]"
                style={{ background: 'repeating-linear-gradient(135deg, #ef4444 0 10px, #ffffff 10px 20px, #2563eb 20px 30px, #ffffff 30px 40px)' }}
              >
                <div className="bg-[#fffbeb] px-4 py-4 pr-16 text-left">
                  <p className="text-[9.5px] font-bold text-[#b45309] mb-1 tracking-wide">GREETINGS FROM THE REEF!</p>
                  <p className="text-[13px] font-bold leading-snug text-[#1e1b4b]">{item.q}</p>
                </div>
                <div className="absolute top-3 right-3 w-12 h-14 bg-[#e0f2fe] border-2 border-dashed border-[#0369a1] p-0.5 rotate-3">
                  <img src={coraliaImg} alt="" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                </div>
              </div>

              <div className="flex gap-3">
                {(['yes', 'no'] as const).map((choice) => {
                  const picked = quizAnswer === choice;
                  const right = picked && choice === item.good;
                  const wrong = picked && choice !== item.good;
                  const base = choice === 'yes' ? 'bg-[#2dd4bf] hover:bg-[#5eead4] text-[#134e4a]' : 'bg-[#fb7185] hover:bg-[#fda4af] text-[#4c0519]';
                  return (
                    <button
                      key={choice}
                      onClick={() => answer(choice)}
                      disabled={quizAnswer === item.good}
                      className={`w-32 py-3 border-4 border-[#1c1917] text-[15px] font-bold shadow-[3px_3px_0px_#1c1917] inline-flex items-center justify-center gap-1.5 transition-transform active:translate-y-0.5 ${
                        right ? 'bg-[#4ade80] text-[#14532d] ring-4 ring-[#fde047]' : wrong ? 'bg-[#a8a29e] text-[#44403c] line-through' : base
                      } disabled:cursor-default`}
                    >
                      {choice === 'yes' ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      {choice.toUpperCase()}
                    </button>
                  );
                })}
              </div>

              {/* Travel tip sticky note */}
              {quizAnswer && (
                <div className={`relative max-w-lg px-3 pt-3 pb-2 text-[11.5px] leading-snug shadow-[3px_3px_0px_#2e1005] -rotate-1 ${quizAnswer === item.good ? 'bg-[#fef08a]' : 'bg-[#fed7aa]'}`}>
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-[#bae6fd]/80 border border-[#7dd3fc]" />
                  <strong className={quizAnswer === item.good ? 'text-[#15803d]' : 'text-[#c2410c]'}>
                    {quizAnswer === item.good ? 'TRAVEL TIP: Reef-friendly choice! ' : 'Hmm, think again! '}
                  </strong>
                  {quizAnswer === item.good ? item.why : 'That could hurt the reef. Try the other answer!'}
                </div>
              )}
              {quizAnswer === item.good && (
                <button onClick={nextQuestion} className="pixel-btn-green px-4 py-2 text-[12px] inline-flex items-center gap-1.5">
                  {quizIndex < QUIZ.length - 1 ? 'NEXT QUESTION' : 'FINISH THE QUIZ'} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Done */}
          {part === 'done' && (
            <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="bg-[#fffbeb]/95 border-4 border-[#1c1917] shadow-[4px_4px_0px_#1c1917] p-5 max-w-md flex flex-col items-center text-center gap-3">
              <div className="inline-flex p-3 bg-[#e0f2fe] border-2 border-[#0284c7]">
                <Award className="w-9 h-9 text-[#0369a1]" />
              </div>
              <h4 className="font-pixel-heading text-[13px]">{restored ? "CORALIA'S REEF IS RESTORED!" : 'REEF-SAFE TRAVELER!'}</h4>
              <p className="text-[12px] max-w-md">
                You guided all {SHIPS.length} ships safely around the coral and know how to protect reefs on vacation. Coralia&apos;s reef can
                finally heal!
              </p>
              {restored ? (
                <>
                  <p className="text-[12px] text-[#15803d] font-bold">+380 Coral Pearl Coins & 100% reef flourish</p>
                  <button onClick={closeQuestModal} className="pixel-btn-green px-4 py-2 text-[12px]">
                    BACK TO WORLD
                  </button>
                </>
              ) : (
                <button onClick={finish} className="pixel-btn-green px-5 py-2.5 text-[12.5px] font-bold inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> RESTORE THE REEF
                </button>
              )}
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
