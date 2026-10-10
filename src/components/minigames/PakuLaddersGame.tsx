'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { AnimalInfo, Quest } from '@/types/game';
import { shuffle, seeded, makeLayer, outlineArt } from './canvasFx';
import { X, ArrowRight, RotateCcw, Coins, Trophy, Dices, BookOpen, CheckCircle } from 'lucide-react';

// ---------------------------------------------------------------
// Endangered animals: landing on their square means reading about them
// and answering two questions before the game moves on
// ---------------------------------------------------------------
type FaceKind = 'tiger' | 'orangutan' | 'elephant' | 'gorilla' | 'redpanda' | 'pangolin' | 'rhino' | 'tamarin' | 'okapi';

interface EndangeredAnimal {
  id: FaceKind;
  name: string;
  status: string;
  article: string[];
  questions: { q: string; options: string[]; answer: string }[];
}

const ENDANGERED: EndangeredAnimal[] = [
  {
    id: 'tiger',
    name: 'Bengal Tiger',
    status: 'ENDANGERED',
    article: [
      'Bengal tigers live in the forests and grasslands of India and nearby countries. They are the largest cats in the world, and no two tigers have the same stripe pattern, just like human fingerprints!',
      'There are only about 4,000 wild tigers left on Earth. Their biggest dangers are poaching (illegal hunting) and losing their forest homes to farms, roads and cities.',
      'There is good news: protected tiger reserves and rangers have helped tiger numbers in India grow for the first time in over 100 years.',
    ],
    questions: [
      { q: 'What are the biggest dangers to tigers?', options: ['Poaching and losing their forest homes', 'Too much rain', 'Eating too many berries', 'Cold winters'], answer: 'Poaching and losing their forest homes' },
      { q: "What is special about each tiger's stripes?", options: ['No two tigers have the same pattern', 'They glow in the dark', 'They change color in summer', 'Every tiger has exactly 10'], answer: 'No two tigers have the same pattern' },
      { q: 'What has helped tiger numbers grow in India?', options: ['Protected reserves and rangers', 'More roads through forests', 'Cutting down trees', 'Zoos only'], answer: 'Protected reserves and rangers' },
    ],
  },
  {
    id: 'orangutan',
    name: 'Bornean Orangutan',
    status: 'CRITICALLY ENDANGERED',
    article: [
      'Orangutans are great apes with shaggy orange fur. They live high in the rainforest trees of Borneo and spend almost their whole lives off the ground.',
      'Every night, an orangutan builds a brand-new nest out of leaves and branches to sleep in! They also spread seeds as they eat fruit, which helps new trees grow.',
      'Their rainforests are being cut down for palm oil plantations and logging. Choosing products with sustainable palm oil helps protect their home.',
    ],
    questions: [
      { q: 'What do orangutans build every night?', options: ['A new nest of leaves and branches', 'A cave', 'A dam in the river', 'A burrow underground'], answer: 'A new nest of leaves and branches' },
      { q: 'What is destroying many orangutan forests?', options: ['Palm oil plantations and logging', 'Too many orangutans', 'Snowstorms', 'Volcanoes only'], answer: 'Palm oil plantations and logging' },
      { q: 'How do orangutans help the rainforest?', options: ['They spread seeds that grow new trees', 'They dig wells', 'They eat all the insects', 'They build roads'], answer: 'They spread seeds that grow new trees' },
    ],
  },
  {
    id: 'elephant',
    name: 'Asian Elephant',
    status: 'ENDANGERED',
    article: [
      'Asian elephants roam the forests of South and Southeast Asia. They are "ecosystem engineers": as they walk and eat, they make trails, open up clearings and spread seeds that other animals and plants rely on.',
      'Elephants need huge areas to find enough food. When forests are split up by farms and roads, elephants can get stuck or wander into villages looking for food.',
      'Wildlife corridors, which are strips of forest that connect bigger forests, let elephants travel safely between their homes.',
    ],
    questions: [
      { q: 'Why are elephants called "ecosystem engineers"?', options: ['They shape the forest by making trails and spreading seeds', 'They build houses', 'They fix broken trees', 'They design bridges'], answer: 'They shape the forest by making trails and spreading seeds' },
      { q: 'How do wildlife corridors help elephants?', options: ['They connect forests so elephants can travel safely', 'They keep elephants in cages', 'They are roads for trucks', 'They block elephants from moving'], answer: 'They connect forests so elephants can travel safely' },
      { q: 'What happens when forests get split up by roads and farms?', options: ['Elephants get stuck or wander into villages', 'Elephants grow bigger', 'Nothing changes for elephants', 'Elephants learn to fly'], answer: 'Elephants get stuck or wander into villages' },
    ],
  },
  {
    id: 'gorilla',
    name: 'Mountain Gorilla',
    status: 'ENDANGERED',
    article: [
      'Mountain gorillas live in misty cloud forests on volcanoes in central Africa. They live in family groups led by a big adult male called a silverback, named for the silver hair on his back.',
      'Not long ago, there were only about 250 mountain gorillas left. Today there are more than 1,000!',
      'Their numbers grew because park rangers protect them from poachers, and visitors who come to see gorillas pay money that helps protect their forests.',
    ],
    questions: [
      { q: 'Who leads a mountain gorilla family?', options: ['A silverback', 'The youngest baby', 'A golden eagle', 'Nobody leads them'], answer: 'A silverback' },
      { q: 'Why have mountain gorilla numbers grown?', options: ['Rangers protect them and visitors help pay for protection', 'They moved to cities', 'Their forests were cut down', 'They started eating meat'], answer: 'Rangers protect them and visitors help pay for protection' },
      { q: 'Where do mountain gorillas live?', options: ['Misty forests on mountains in central Africa', 'Deserts in Australia', 'The Arctic ice', 'Coral reefs'], answer: 'Misty forests on mountains in central Africa' },
    ],
  },
  {
    id: 'redpanda',
    name: 'Red Panda',
    status: 'ENDANGERED',
    article: [
      "That's me! Red pandas live in cool mountain bamboo forests of the Himalayas. Even though we're called pandas, we're not bears. We're our own special family!",
      'We eat mostly bamboo, and we wrap our big fluffy tails around ourselves like a blanket to stay warm on cold nights.',
      'There may be fewer than 10,000 red pandas left in the wild. Our forests are being cut down, so protecting and replanting forests helps us survive.',
    ],
    questions: [
      { q: 'What do red pandas mostly eat?', options: ['Bamboo', 'Fish', 'Cheese', 'Grass seeds'], answer: 'Bamboo' },
      { q: 'How do red pandas use their fluffy tails?', options: ['As a blanket to stay warm', 'To swim faster', 'To dig holes', 'To catch fish'], answer: 'As a blanket to stay warm' },
      { q: 'What helps red pandas survive?', options: ['Protecting and replanting their forests', 'Cutting down bamboo', 'Building more roads', 'Keeping them as pets'], answer: 'Protecting and replanting their forests' },
    ],
  },
  {
    id: 'pangolin',
    name: 'Sunda Pangolin',
    status: 'CRITICALLY ENDANGERED',
    article: [
      'Pangolins are the only mammals in the world covered in hard scales! When they get scared, they curl up into a tight, armored ball.',
      'They have no teeth. Instead they slurp up ants and termites with a sticky tongue that can be longer than their whole body.',
      'Sadly, pangolins are one of the most illegally hunted and traded animals in the world, for their scales and meat. New laws and rescue centers are working to protect them.',
    ],
    questions: [
      { q: "What covers a pangolin's body?", options: ['Hard scales', 'Feathers', 'Long fur', 'A shell like a turtle'], answer: 'Hard scales' },
      { q: 'What does a pangolin do when it is scared?', options: ['Curls up into a ball', 'Roars loudly', 'Climbs to the moon', 'Changes color'], answer: 'Curls up into a ball' },
      { q: 'Why are pangolins critically endangered?', options: ['Illegal hunting and trading', 'They eat too many ants', 'They are too slow to find food', 'Too much rain'], answer: 'Illegal hunting and trading' },
    ],
  },
  {
    id: 'rhino',
    name: 'Sumatran Rhino',
    status: 'CRITICALLY ENDANGERED',
    article: [
      'The Sumatran rhino is the smallest rhino on Earth, and the only one covered in shaggy reddish hair! It lives in thick rainforests in Indonesia.',
      'There are fewer than 50 Sumatran rhinos left in the wild, which makes it one of the rarest large animals in the world.',
      'Scientists have built special sanctuaries where rhinos are protected and baby rhinos can be born safely, giving the species a chance to recover.',
    ],
    questions: [
      { q: 'About how many Sumatran rhinos are left in the wild?', options: ['Fewer than 50', 'About 10,000', 'Over a million', 'Exactly 500'], answer: 'Fewer than 50' },
      { q: 'What is unusual about Sumatran rhinos?', options: ['They are covered in reddish hair', 'They can fly', 'They live underwater', 'They have no horns at all'], answer: 'They are covered in reddish hair' },
      { q: 'How are people helping Sumatran rhinos?', options: ['Sanctuaries where babies can be born safely', 'Moving them to the desert', 'Cutting down their forests', 'Painting their horns'], answer: 'Sanctuaries where babies can be born safely' },
    ],
  },
  {
    id: 'tamarin',
    name: 'Golden Lion Tamarin',
    status: 'ENDANGERED',
    article: [
      "Golden lion tamarins are tiny monkeys with bright golden-orange fur and a fluffy mane, just like a lion's! They live in the Atlantic Forest of Brazil.",
      'Most of their forest was cut down, leaving only small patches. In the 1970s, there were only about 200 left in the wild.',
      'People planted strips of trees called corridors to connect the forest patches. Now there are a few thousand tamarins, one of the great conservation success stories!',
    ],
    questions: [
      { q: 'Where do golden lion tamarins live?', options: ['The Atlantic Forest of Brazil', 'The North Pole', 'The Sahara Desert', 'Under the ocean'], answer: 'The Atlantic Forest of Brazil' },
      { q: 'What helped golden lion tamarins come back?', options: ['Planting tree corridors to connect forests', 'Building more cities', 'Keeping them as pets', 'Cutting down old trees'], answer: 'Planting tree corridors to connect forests' },
      { q: 'Why are they called "lion" tamarins?', options: ['They have a golden mane like a lion', 'They roar like lions', 'They hunt zebras', 'They live in Africa with lions'], answer: 'They have a golden mane like a lion' },
    ],
  },
  {
    id: 'okapi',
    name: 'Okapi',
    status: 'ENDANGERED',
    article: [
      "The okapi has stripy legs like a zebra, but its closest relative is actually the giraffe! It lives deep in the rainforests of the Democratic Republic of the Congo.",
      'Okapis have long, bendy tongues, so long they can lick their own eyes and ears clean!',
      'Okapis are threatened by logging, mining and hunting in their forest. Protected reserves like the Okapi Wildlife Reserve help keep them safe.',
    ],
    questions: [
      { q: "What is the okapi's closest relative?", options: ['The giraffe', 'The zebra', 'The horse', 'The elephant'], answer: 'The giraffe' },
      { q: 'What can an okapi do with its long tongue?', options: ['Lick its own eyes and ears clean', 'Catch flies like a frog', 'Whistle songs', 'Dig holes'], answer: 'Lick its own eyes and ears clean' },
      { q: 'Where do okapis live?', options: ['Rainforests in the Congo', 'Icy mountains', 'Sandy beaches', 'City parks'], answer: 'Rainforests in the Congo' },
    ],
  },
];
const QUESTIONS_PER_ARTICLE = 2;

// ---------------------------------------------------------------
// The board: a winding forest trail of stepping-stone squares that climbs
// from START (bottom left) to the bamboo grove (top left)
// ---------------------------------------------------------------
const W = 640;
const H = 360;
const LAST = 44;
const COINS_PER_ARTICLE = 5;
const WIN_COINS = 40;
const PASS_Y = [322, 244, 166, 88];
const TRAIL_LEFT = 70;
const TRAIL_RIGHT = 570;

// Dense points along the trail: four wobbly passes joined by U-turns.
// The third value is which pass (row) the point is on, or -1 on a U-turn.
function buildTrail(): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let p = 0; p < PASS_Y.length; p++) {
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = p % 2 === 0 ? TRAIL_LEFT + (TRAIL_RIGHT - TRAIL_LEFT) * t : TRAIL_RIGHT - (TRAIL_RIGHT - TRAIL_LEFT) * t;
      pts.push([x, PASS_Y[p] + Math.sin(t * Math.PI * 3 + p) * 7, p]);
    }
    if (p < PASS_Y.length - 1) {
      const cx = p % 2 === 0 ? TRAIL_RIGHT : TRAIL_LEFT;
      const cy = (PASS_Y[p] + PASS_Y[p + 1]) / 2;
      const r = (PASS_Y[p] - PASS_Y[p + 1]) / 2;
      for (let i = 1; i < 30; i++) {
        const a = Math.PI / 2 + (i / 30) * Math.PI;
        const bulge = p % 2 === 0 ? -Math.cos(a) : Math.cos(a); // curve outward on either side
        pts.push([cx + bulge * r * 0.9, cy + Math.sin(a) * r, -1]);
      }
    }
  }
  return pts;
}
const TRAIL = buildTrail();

// Squares spaced evenly along the trail (index 0 = square 1), and which pass each one is on
const SQUARE_PASS: number[] = [];
const SQUARES: [number, number][] = (() => {
  const cum = [0];
  for (let i = 1; i < TRAIL.length; i++) cum.push(cum[i - 1] + Math.hypot(TRAIL[i][0] - TRAIL[i - 1][0], TRAIL[i][1] - TRAIL[i - 1][1]));
  const total = cum[cum.length - 1];
  return Array.from({ length: LAST }, (_, n) => {
    const i = cum.findIndex((c) => c >= (n / (LAST - 1)) * total);
    SQUARE_PASS.push(TRAIL[i][2]);
    return [Math.round(TRAIL[i][0]), Math.round(TRAIL[i][1])] as [number, number];
  });
})();

// Endangered animal squares (square -> ENDANGERED index). Stepping on one, even passing over it, means learning about it.
const ANIMAL_SQUARES: Record<number, number> = { 3: 0, 7: 5, 11: 1, 17: 6, 22: 2, 25: 7, 32: 3, 36: 8, 40: 4 };

// ---------------------------------------------------------------
// Trees (climb up) and snakes (slide down) are placed randomly each game.
// Each links a square to the closest square on the pass above (tree) or below (snake).
// ---------------------------------------------------------------
interface Link {
  from: number;
  to: number;
}
interface Layout {
  trees: Link[];
  snakes: Link[];
}
const TREE_COUNT = 4;
const SNAKE_COUNT = 3;
const SAFE_FINISH = 10; // no snake heads in the last 10 squares

// Squares on a given pass that are close enough to link to square n
function linkTargets(n: number, pass: number) {
  const [x, y] = SQUARES[n - 1];
  return SQUARE_PASS.map((p, i) => i + 1).filter(
    (m) => SQUARE_PASS[m - 1] === pass && Math.hypot(SQUARES[m - 1][0] - x, SQUARES[m - 1][1] - y) < 100
  );
}

function generateLayout(): Layout {
  const squares = Array.from({ length: LAST - 2 }, (_, i) => i + 2);
  const reserved = new Set<number>([1, LAST, ...Object.keys(ANIMAL_SQUARES).map(Number)]);
  for (let attempt = 0; attempt < 300; attempt++) {
    // Link ends stay at least one square apart so trees and snakes never chain or overlap
    const ends = new Set<number>();
    const free = (n: number) => !reserved.has(n) && !ends.has(n - 1) && !ends.has(n) && !ends.has(n + 1);
    const trees: Link[] = [];
    const snakes: Link[] = [];
    // Links spanning the same rows must sit at least 50px apart so they never cross
    const clearOfOthers = (a: number, b: number) =>
      [...trees, ...snakes].every((l) => {
        const midA = (SQUARES[a - 1][0] + SQUARES[b - 1][0]) / 2;
        const midB = (SQUARES[l.from - 1][0] + SQUARES[l.to - 1][0]) / 2;
        const rowsA = [SQUARES[a - 1][1], SQUARES[b - 1][1]].sort((p, q) => p - q);
        const rowsB = [SQUARES[l.from - 1][1], SQUARES[l.to - 1][1]].sort((p, q) => p - q);
        const sameRows = rowsA[0] < rowsB[1] && rowsB[0] < rowsA[1];
        return !sameRows || Math.abs(midA - midB) >= 50;
      });
    const pick = (from: number, pass: number, up: boolean) =>
      shuffle(linkTargets(from, pass)).find((to) => free(to) && (up ? to - from >= 4 : from - to >= 4) && clearOfOthers(from, to));
    for (const from of shuffle(squares)) {
      if (trees.length === TREE_COUNT) break;
      const pass = SQUARE_PASS[from - 1];
      if (pass < 0 || pass >= PASS_Y.length - 1 || !free(from)) continue;
      const to = pick(from, pass + 1, true);
      if (!to) continue;
      trees.push({ from, to });
      ends.add(from).add(to);
    }
    for (const from of shuffle(squares)) {
      if (snakes.length === SNAKE_COUNT) break;
      const pass = SQUARE_PASS[from - 1];
      if (pass < 1 || from > LAST - SAFE_FINISH || !free(from)) continue;
      const to = pick(from, pass - 1, false);
      if (!to) continue;
      snakes.push({ from, to });
      ends.add(from).add(to);
    }
    if (trees.length === TREE_COUNT && snakes.length === SNAKE_COUNT) return { trees, snakes };
  }
  // Fallback layout (always valid)
  return {
    trees: [
      { from: 4, to: 18 },
      { from: 8, to: 14 },
      { from: 16, to: 29 },
      { from: 26, to: 41 },
    ],
    snakes: [
      { from: 13, to: 9 },
      { from: 19, to: 5 },
      { from: 30, to: 15 },
    ],
  };
}

function squareCenter(n: number): [number, number] {
  if (n <= 0) return [SQUARES[0][0] - 40, SQUARES[0][1]];
  return SQUARES[n - 1];
}

type Who = 'you' | 'paku';
const TOKEN_OFFSET: Record<Who, [number, number]> = { you: [-7, 2], paku: [8, -4] };
const tokenPoint = (n: number, who: Who): [number, number] => {
  const [x, y] = squareCenter(n);
  return [x + TOKEN_OFFSET[who][0], y + TOKEN_OFFSET[who][1]];
};

// Points along a snake's wiggly body, head first
function snakePath(from: number, to: number): [number, number][] {
  const [x1, y1] = squareCenter(from);
  const [x2, y2] = squareCenter(to);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;
  return Array.from({ length: 41 }, (_, i) => {
    const t = i / 40;
    const wave = Math.sin(t * Math.PI * 3) * 9 * Math.sin(t * Math.PI);
    return [x1 + (x2 - x1) * t + nx * wave, y1 + (y2 - y1) * t + ny * wave];
  });
}

// Points up a tree trunk, from the roots to the canopy
function treePath(from: number, to: number): [number, number][] {
  const [x1, y1] = squareCenter(from);
  const [x2, y2] = squareCenter(to);
  return Array.from({ length: 31 }, (_, i) => {
    const t = i / 30;
    return [x1 + (x2 - x1) * t + Math.sin(t * Math.PI * 2) * 3, y1 + (y2 - y1) * t];
  });
}

// ---------------------------------------------------------------
// Pixel art
// ---------------------------------------------------------------
// Hand-placed 16x16 pixel portraits so each endangered animal is easy to recognize
const FACE_ART: Record<FaceKind, { rows: string[]; colors: Record<string, string> }> = {
  tiger: {
    rows: [
      '..oo........oo..',
      '.owwo......owwo.',
      '.oooookookoooo..',
      'okoooooookooooko',
      'okkooooooooookko',
      'ooooyeooooeyoooo',
      'okooooooooooooko',
      'okkoowwwwwwookko',
      '.ooowwwppwwwooo.',
      '.oowwwwkkwwwwoo.',
      '..owwwkwwkwwwo..',
      '...owwwwwwwwo...',
      '....oooooooo....',
    ],
    colors: { o: '#f59e0b', k: '#1c1917', w: '#fff7ed', p: '#f472b6', y: '#a3e635', e: '#1c1917' },
  },
  redpanda: {
    rows: [
      '..rr........rr..',
      '.rwwr......rwwr.',
      '.rrrrrrrrrrrrrr.',
      'rrwwrrrrrrrrwwrr',
      'rrrrrrrrrrrrrrrr',
      'rrrkrrrrrrrrkrrr',
      'rwwwRrrrrrrRwwwr',
      'rwwwwRrrrrRwwwwr',
      '.rwwwwwkkwwwwwr.',
      '..rwwwwwwwwwwr..',
      '...rrwwwwwwrr...',
      '....rrrrrrrr....',
    ],
    colors: { r: '#c2410c', R: '#7c2d12', w: '#ffffff', k: '#1c1917' },
  },
  orangutan: {
    rows: [
      '....oooooooo....',
      '..oooooooooooo..',
      '.ooooffffffoooo.',
      'ooooffffffffoooo',
      'oooffkffffkffooo',
      'ooffffffffffffoo',
      'ooffffFkkFffffoo',
      'ooffffffffffffoo',
      '.offFFFFFFFFffo.',
      '.offFkkkkkkFffo.',
      '..ofFFFFFFFFfo..',
      '..oooffffffooo..',
      '...oooooooooo...',
    ],
    colors: { o: '#c2410c', f: '#e9b98a', F: '#c98d5f', k: '#1c1917' },
  },
  elephant: {
    rows: [
      '................',
      'GGGG.gggggg.GGGG',
      'GppGggggggggGppG',
      'GppggggggggggppG',
      'GppggkggggkggppG',
      'GppggggggggggppG',
      '..GGggggggggGG..',
      '....wggggggw....',
      '....w.gggg.w....',
      '......gggg......',
      '......gGgg......',
      '......gggg......',
      '.......ggg......',
      '........gg......',
    ],
    colors: { g: '#9ca3af', G: '#6b7280', p: '#f9a8d4', w: '#f8fafc', k: '#1c1917' },
  },
  gorilla: {
    rows: [
      '.....dddddd.....',
      '....dddddddd....',
      '...dddddddddd...',
      '..dddFFFFFFddd..',
      '.dddfkffffkfddd.',
      'dddffffffffffddd',
      'dddfffFFFFfffddd',
      'dddffFkFFkFffddd',
      '.ddffffffffffdd.',
      '.ddfFFFFFFFFfdd.',
      '..ddffffffffdd..',
      '...dddddddddd...',
    ],
    colors: { d: '#1f2937', f: '#6b7280', F: '#4b5563', k: '#0b0f14' },
  },
  pangolin: {
    rows: [
      '................',
      '................',
      '....SSSSSS......',
      '..SSsSsSsSSS....',
      '.SsSsSsSsSsSS...',
      'SsSsSsSsSsSsSff.',
      'SsSsSsSsSsSsfkff',
      'SSsSsSsSsSsSffff',
      '.SSsSsSsSsSSff..',
      '..SSSSSSSSSS....',
      '...ff....ff.....',
    ],
    colors: { S: '#713f12', s: '#c27d2c', f: '#e7b77c', k: '#1c1917' },
  },
  rhino: {
    rows: [
      '..GG........GG..',
      '..GgG......GgG..',
      '...grggrggrgg...',
      '..gggggggggggg..',
      '.gkgggghhggggkg.',
      '.gggggghhgggggg.',
      '.ggggghhhhggggg.',
      '.gggghhhhhhgggg.',
      '..gggggggggggg..',
      '..ggGGggggGGgg..',
      '...gggggggggg...',
      '....gggggggg....',
    ],
    colors: { g: '#78716c', G: '#57534e', h: '#f5f5f4', r: '#b45309', k: '#1c1917' },
  },
  tamarin: {
    rows: [
      '....YYyyyyYY....',
      '..YyyyyyyyyyyY..',
      '.YyyyyyyyyyyyyY.',
      'yyyyyddddddyyyyy',
      'yyyyddddddddyyyy',
      'yyyydakddkadyyyy',
      'yyyyddddddddyyyy',
      'yyyyyddkkddyyyyy',
      '.yyyyddddddyyyy.',
      '.Yyyyyddddyyyyy.',
      '..yyyyyyyyyyyy..',
      '...YyyyyyyyyY...',
    ],
    colors: { y: '#f59e0b', Y: '#fcd34d', d: '#3f2a1d', a: '#fbbf24', k: '#0b0f14' },
  },
  okapi: {
    rows: [
      'BB............BB',
      'BbB....hh....BbB',
      '.BbB...hh...BbB.',
      '..BBbbbbbbbbBB..',
      '...bbbbbbbbbb...',
      '...bkbbbbbbkb...',
      '...bbbbbbbbbb...',
      '....bbbbbbbb....',
      '....bbbbbbbb....',
      '....wwbbbbww....',
      '....wwwwwwww....',
      '....wwwkkwww....',
      '.....wwwwww.....',
    ],
    colors: { B: '#3f1d0e', b: '#6b3a1e', h: '#2b130a', w: '#efe1c6', k: '#1c1917' },
  },
};

const FACE_SIZE = 18; // 16x16 art plus a 1px outline
function buildFace(kind: FaceKind) {
  const { rows, colors } = FACE_ART[kind];
  const top = Math.floor((16 - rows.length) / 2) + 1;
  return makeLayer(FACE_SIZE, FACE_SIZE, (ctx) => {
    rows.forEach((row, y) =>
      row.split('').forEach((c, x) => {
        if (!colors[c]) return;
        ctx.fillStyle = colors[c];
        ctx.fillRect(x + 1, y + top, 1, 1);
      })
    );
    outlineArt(ctx, FACE_SIZE, FACE_SIZE, '#1c1917');
  });
}

// Cozy bamboo hut that marks HOME
const HUT_W = 20;
const HUT_H = 18;
function buildHut() {
  return makeLayer(HUT_W, HUT_H, (ctx) => {
    const px = (x: number, y: number, w: number, h: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
    };
    // Little red pennant on top
    px(10, 0, 1, 4, '#5b3a1e');
    px(11, 0, 3, 1, '#dc2626');
    px(11, 1, 2, 1, '#dc2626');
    // Thatched roof with straw streaks
    for (let y = 3; y <= 8; y++) {
      const half = (y - 2) * 1.6 + 1;
      for (let x = Math.round(10 - half); x <= Math.round(9 + half); x++) px(x, y, 1, 1, (x + y) % 3 === 0 ? '#b7832a' : '#e5b04f');
    }
    px(1, 9, 18, 1, '#9a6a1e');
    // Bamboo walls
    for (let y = 10; y <= 16; y++) {
      for (let x = 3; x <= 16; x++) px(x, y, 1, 1, y === 12 ? '#3f6212' : x % 3 === 0 ? '#4d7c0f' : '#84cc16');
    }
    // Glowing windows and a round-topped door
    px(5, 11, 2, 2, '#fde68a');
    px(13, 11, 2, 2, '#fde68a');
    px(9, 12, 2, 1, '#3f2a14');
    px(8, 13, 4, 4, '#3f2a14');
    px(10, 15, 1, 1, '#facc15');
    outlineArt(ctx, HUT_W, HUT_H, '#1c1917');
  });
}

// Your farmer pawn: woven straw hat, rosy cheeks, red shirt, blue overalls and boots
const FARMER_W = 14;
const FARMER_H = 20;
function buildFarmer() {
  const rows = [
    '...YYYYYY...',
    '...YyYYyY...',
    '..hhhhhhhh..',
    'YYYYYYYYYYYY',
    '.yyyyyyyyyy.',
    '..HssssssH..',
    '..sesssses..',
    '..cssmmssc..',
    '...SssssS...',
    '..rorrrror..',
    '.rRooooooRr.',
    '.s.oobboo.s.',
    '...oOOOOo...',
    '...oooooo...',
    '...oo..oo...',
    '...OO..OO...',
    '..kkk..kkk..',
    '..KKK..KKK..',
  ];
  const colors: Record<string, string> = {
    Y: '#fcd34d',
    y: '#d97706',
    h: '#b91c1c',
    H: '#78350f',
    s: '#f8c8a0',
    S: '#e0a27a',
    e: '#1c1917',
    c: '#f9a8d4',
    m: '#9a3412',
    r: '#dc2626',
    R: '#991b1b',
    o: '#3b82f6',
    O: '#1d4ed8',
    b: '#fde68a',
    k: '#6b4226',
    K: '#3e2412',
  };
  return makeLayer(FARMER_W, FARMER_H, (ctx) => {
    rows.forEach((row, y) =>
      row.split('').forEach((c, x) => {
        if (!colors[c]) return;
        ctx.fillStyle = colors[c];
        ctx.fillRect(x + 1, y + 1, 1, 1);
      })
    );
    outlineArt(ctx, FARMER_W, FARMER_H, '#1c1917');
  });
}

const HOME = SQUARES[LAST - 1];

function buildBoard() {
  return makeLayer(W, H, (ctx) => {
    const rand = seeded(31);
    // Forest floor
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = i % 2 ? '#4d7c0f' : '#3f6212';
      ctx.fillRect(0, i * 20, W, 20);
    }
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = rand() < 0.5 ? '#65a30d' : '#365314';
      ctx.fillRect(Math.floor((rand() * W) / 2) * 2, Math.floor((rand() * H) / 2) * 2, 2, 4);
    }
    // Little flowers and mushrooms
    for (let i = 0; i < 30; i++) {
      const x = Math.floor((rand() * W) / 2) * 2;
      const y = Math.floor((rand() * H) / 2) * 2;
      if (rand() < 0.6) {
        ctx.fillStyle = ['#fde047', '#f9a8d4', '#ffffff', '#c4b5fd'][i % 4];
        ctx.fillRect(x, y, 2, 2);
        ctx.fillRect(x - 2, y + 2, 2, 2);
        ctx.fillRect(x + 2, y + 2, 2, 2);
      } else {
        ctx.fillStyle = '#f5f5f4';
        ctx.fillRect(x + 2, y + 4, 2, 4);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(x, y, 6, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 2, y + 1, 2, 2);
      }
    }
    // Round forest trees along the edges
    const roundTree = (x: number, y: number, r: number) => {
      ctx.fillStyle = '#4a2c17';
      ctx.fillRect(x - 2, y, 4, r);
      for (let dy = -r; dy <= r; dy += 2) {
        const half = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)) / 2) * 2;
        ctx.fillStyle = '#14532d';
        ctx.fillRect(x - half - 2, y + dy, half * 2 + 4, 2);
        ctx.fillStyle = dy < -r / 3 ? '#22c55e' : '#15803d';
        ctx.fillRect(x - half, y + dy, half * 2, 2);
      }
    };
    const pine = (x: number, base: number, h: number) => {
      ctx.fillStyle = '#4a2c17';
      ctx.fillRect(x - 2, base - 4, 4, 6);
      for (let row = 0; row < h; row += 2) {
        const half = Math.round(((row % 10) / 10 + row / h) * (h / 3.2)) + 2;
        ctx.fillStyle = '#14532d';
        ctx.fillRect(x - half - 1, base - 4 - h + row, half * 2 + 2, 2);
        ctx.fillStyle = row % 10 < 4 ? '#16a34a' : '#15803d';
        ctx.fillRect(x - half, base - 4 - h + row, half * 2, 2);
      }
    };
    // Fill every gap between the trail's bends with trees so the trail winds through a forest
    const nearTrail = (x: number, y: number, pad: number) => TRAIL.some(([tx, ty]) => Math.abs(tx - x) < pad && Math.abs(ty - y) < pad);
    const spots: [number, number, number, boolean][] = [];
    for (let y = 10; y < H + 10; y += 13) {
      for (let x = 6 + ((y / 13) % 2) * 11; x < W; x += 24) {
        const jx = x + Math.floor(rand() * 8) - 4;
        const jy = y + Math.floor(rand() * 6) - 3;
        if (x > W - 80 && y < 60) continue; // keep the die corner clear
        if (!nearTrail(jx, jy, 30)) spots.push([jx, jy, 7 + Math.floor(rand() * 5), rand() < 0.55]);
      }
    }
    spots
      .sort((a, b) => a[1] - b[1])
      .forEach(([x, y, r, isPine]) => (isPine ? pine(x, y + r, r * 2 + 4) : roundTree(x, y, r)));

    // Dirt trail
    TRAIL.forEach(([x, y]) => {
      ctx.fillStyle = '#5b3a1e';
      ctx.fillRect(Math.round(x) - 17, Math.round(y) - 17, 34, 34);
    });
    TRAIL.forEach(([x, y]) => {
      ctx.fillStyle = '#a16207';
      ctx.fillRect(Math.round(x) - 15, Math.round(y) - 15, 30, 30);
    });
    TRAIL.forEach(([x, y], i) => {
      if (i % 7 === 0) {
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(Math.round(x) - 4 + (i % 3) * 4, Math.round(y) - 8 + (i % 5) * 3, 2, 2);
      }
    });

    // Stepping stones: rounded pebbles lit from the top left, with moss and a soft shadow
    SQUARES.forEach(([x, y], i) => {
      const n = i + 1;
      const tones = [
        ['#e7e2d8', '#f7f4ee', '#c4bcae'],
        ['#ddd5c7', '#f1ece2', '#b9b0a0'],
        ['#e3dccf', '#f5f1e8', '#bfb6a6'],
      ][n % 3];
      const rx = 15;
      const ry = 13;
      ctx.fillStyle = 'rgba(30, 20, 10, 0.35)';
      for (let dy = -ry; dy <= ry; dy += 2) {
        const half = Math.round((rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2))) / 2) * 2;
        ctx.fillRect(x - half + 2, y + dy + 3, half * 2, 2);
      }
      for (let dy = -ry; dy <= ry; dy += 2) {
        for (let dx = -rx; dx <= rx; dx += 2) {
          const d = (dx / rx) ** 2 + (dy / ry) ** 2;
          if (d > 1) continue;
          const light = -(dx / rx) * 0.6 - (dy / ry) * 0.8;
          ctx.fillStyle = d > 0.78 ? '#57534e' : light > 0.55 ? tones[1] : light < -0.45 ? tones[2] : tones[0];
          if (d <= 0.78 && rand() < 0.06) ctx.fillStyle = tones[2];
          ctx.fillRect(x + dx, y + dy, 2, 2);
        }
      }
      // Moss on the upper-left rim and a tiny crack
      for (let k = 0; k < 4; k++) {
        const a = Math.PI + 0.5 + rand() * 1.4;
        ctx.fillStyle = rand() < 0.5 ? '#65a30d' : '#84cc16';
        ctx.fillRect(Math.round((x + Math.cos(a) * (rx - 3)) / 2) * 2, Math.round((y + Math.sin(a) * (ry - 3)) / 2) * 2, 4, 2);
      }
      if (rand() < 0.4) {
        ctx.fillStyle = tones[2];
        ctx.fillRect(x + 6, y + 4, 2, 2);
        ctx.fillRect(x + 8, y + 6, 2, 2);
      }
      // Engraved number
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(String(n), x + 1, y + 5);
      ctx.fillStyle = '#44403c';
      ctx.fillText(String(n), x, y + 4);
      ctx.textAlign = 'left';
    });

    // START sign
    const [sx, sy] = SQUARES[0];
    ctx.fillStyle = '#5b3a1e';
    ctx.fillRect(sx - 52, sy - 10, 2, 22);
    ctx.fillStyle = '#3e1a06';
    ctx.fillRect(sx - 68, sy - 22, 44, 15);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(sx - 67, sy - 21, 42, 13);
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#fde68a';
    ctx.fillText('START', sx - 66, sy - 11);

    // HOME: a golden square in the bamboo grove
    const [hx, hy] = HOME;
    ctx.fillStyle = '#3e1a06';
    ctx.fillRect(hx - 20, hy + 11, 40, 13);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(hx - 19, hy + 12, 38, 11);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(hx - 19, hy + 12, 38, 2);
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde68a';
    ctx.fillText('HOME', hx, hy + 21);
    ctx.textAlign = 'left';
  });
}

// Bamboo stalks around HOME. `grow` (0-1) stretches them up to the sky when someone wins.
function drawBamboo(ctx: CanvasRenderingContext2D, grow: number, time: number) {
  const [hx, hy] = HOME;
  // [x offset, resting height]; stalks with 0 height only sprout during the win
  const stalks: [number, number][] = [
    [-40, 34],
    [-31, 46],
    [-24, 38],
    [24, 34],
    [33, 44],
    [-48, 0],
    [-12, 0],
    [10, 0],
    [42, 0],
  ];
  stalks.forEach(([dx, restHeight], i) => {
    const baseY = hy + 10;
    const height = restHeight + (baseY + 20 - restHeight) * (restHeight ? grow : Math.max(0, grow * 1.2 - 0.2));
    if (height <= 0) return;
    const x = hx + dx;
    for (let y = baseY; y > baseY - height; y -= 2) {
      const seg = Math.floor((baseY - y) / 14);
      ctx.fillStyle = (baseY - y) % 14 < 2 ? '#3f6212' : seg % 2 ? '#65a30d' : '#84cc16';
      ctx.fillRect(x, y, 5, 2);
      if ((baseY - y) % 28 === 12) {
        const sway = Math.round(Math.sin(time * 2 + i + y / 20) * 1);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x + (i % 2 ? 5 : -8), y + sway, 8, 2);
        ctx.fillRect(x + (i % 2 ? 9 : -10), y + 2 + sway, 4, 2);
      }
    }
  });
}

function drawTree(ctx: CanvasRenderingContext2D, from: number, to: number) {
  const pts = treePath(from, to);
  // Trunk with bark texture and little branch stubs to climb on
  pts.forEach(([x, y], i) => {
    ctx.fillStyle = '#3e1f0b';
    ctx.fillRect(Math.round(x) - 5, Math.round(y) - 2, 10, 4);
    ctx.fillStyle = i % 3 === 0 ? '#6b3f1d' : '#7c4a23';
    ctx.fillRect(Math.round(x) - 4, Math.round(y) - 2, 8, 4);
    if (i % 6 === 3) {
      const dir = i % 12 === 3 ? 1 : -1;
      ctx.fillStyle = '#5b3417';
      ctx.fillRect(Math.round(x) + (dir > 0 ? 4 : -10), Math.round(y) - 1, 6, 2);
    }
  });
  // Roots and leafy canopy
  const [rx, ry] = pts[0];
  ctx.fillStyle = '#3e1f0b';
  ctx.fillRect(Math.round(rx) - 9, Math.round(ry) + 2, 18, 3);
  const [cx, cy] = pts[pts.length - 1];
  const canopy: [number, number, number, string][] = [
    [0, -10, 11, '#15803d'],
    [-9, -4, 8, '#16a34a'],
    [9, -4, 8, '#16a34a'],
    [0, -6, 7, '#22c55e'],
  ];
  const blob = (bx: number, by: number, r: number, color: string) => {
    ctx.fillStyle = color;
    for (let y = -r; y <= r; y += 2) {
      const half = Math.round(Math.sqrt(Math.max(0, r * r - y * y)) / 2) * 2;
      ctx.fillRect(Math.round(bx) - half, Math.round(by) + y, half * 2, 2);
    }
  };
  canopy.forEach(([dx, dy, r]) => blob(cx + dx, cy + dy, r + 1, '#14532d'));
  canopy.forEach(([dx, dy, r, c]) => blob(cx + dx, cy + dy, r, c));
  ctx.fillStyle = '#86efac';
  ctx.fillRect(Math.round(cx) - 6, Math.round(cy) - 16, 4, 2);
}

function drawSnake(ctx: CanvasRenderingContext2D, from: number, to: number, time: number) {
  const pts = snakePath(from, to);
  // Body from tail to head so the head sits on top
  for (let i = pts.length - 1; i >= 0; i--) {
    const [x, y] = pts[i];
    const w = i < 3 ? 10 : Math.max(4, 9 - Math.floor(i / 8));
    ctx.fillStyle = '#14532d';
    ctx.fillRect(Math.round(x - w / 2) - 1, Math.round(y - w / 2) - 1, w + 2, w + 2);
    ctx.fillStyle = Math.floor(i / 3) % 2 ? '#65a30d' : '#facc15';
    ctx.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w);
  }
  // Head with eyes and a flicking tongue
  const [hx, hy] = pts[0];
  ctx.fillStyle = '#14532d';
  ctx.fillRect(Math.round(hx) - 7, Math.round(hy) - 6, 14, 12);
  ctx.fillStyle = '#4d7c0f';
  ctx.fillRect(Math.round(hx) - 6, Math.round(hy) - 5, 12, 10);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(Math.round(hx) - 4, Math.round(hy) - 3, 3, 3);
  ctx.fillRect(Math.round(hx) + 1, Math.round(hy) - 3, 3, 3);
  ctx.fillStyle = '#111111';
  ctx.fillRect(Math.round(hx) - 3, Math.round(hy) - 2, 1, 2);
  ctx.fillRect(Math.round(hx) + 2, Math.round(hy) - 2, 1, 2);
  if (Math.floor(time * 2) % 2 === 0) {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(Math.round(hx) - 1, Math.round(hy) + 5, 2, 4);
    ctx.fillRect(Math.round(hx) - 2, Math.round(hy) + 8, 1, 2);
    ctx.fillRect(Math.round(hx) + 1, Math.round(hy) + 8, 1, 2);
  }
}

// Pixel die face
function drawDie(ctx: CanvasRenderingContext2D, x: number, y: number, value: number, size = 40) {
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(x - 2, y - 2, size + 4, size + 4);
  ctx.fillStyle = '#fffbeb';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#e7e5e4';
  ctx.fillRect(x, y + size - 4, size, 4);
  const pip = (cx: number, cy: number) => {
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(Math.round(x + cx * size) - 3, Math.round(y + cy * size) - 3, 6, 6);
  };
  const L = 0.25;
  const M = 0.5;
  const R = 0.75;
  const layouts: Record<number, [number, number][]> = {
    1: [[M, M]],
    2: [[L, L], [R, R]],
    3: [[L, L], [M, M], [R, R]],
    4: [[L, L], [R, L], [L, R], [R, R]],
    5: [[L, L], [R, L], [M, M], [L, R], [R, R]],
    6: [[L, L], [R, L], [L, M], [R, M], [L, R], [R, R]],
  };
  layouts[value].forEach(([cx, cy]) => pip(cx, cy));
}

type Mode = 'yourTurn' | 'busy' | 'pakuTurn' | 'celebrating' | 'won' | 'lost';

interface ArticleState {
  animal: EndangeredAnimal;
  stage: 'read' | 'quiz';
  questions: EndangeredAnimal['questions'];
  index: number;
  options: string[];
  wrong: string[];
  solved: boolean;
}

// ---------------------------------------------------------------
interface Props {
  animal: AnimalInfo;
  isHappy: boolean;
  quest?: Quest;
  onClose: () => void;
  onStartQuest: () => void;
}

export default function PakuLaddersGame({ animal, isHappy, quest, onClose, onStartQuest }: Props) {
  const { addCoins } = useGameState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pakuImg = useRef<HTMLImageElement | null>(null);
  const addCoinsRef = useRef(addCoins);
  addCoinsRef.current = addCoins;
  const alive = useRef(true);
  const [initialLayout] = useState(generateLayout);

  const game = useRef({
    pos: { you: 0, paku: 0 } as Record<Who, number>,
    token: { you: tokenPoint(0, 'you'), paku: tokenPoint(0, 'paku') } as Record<Who, [number, number]>,
    anim: null as null | { who: Who; points: [number, number][]; segMs: number; hop: boolean; elapsed: number; resolve: () => void },
    dice: 1,
    rolling: false,
    time: 0,
    winTime: -1,
    learned: new Set<number>(), // animal squares already read about this game
    layout: initialLayout,
    runId: 0, // bumps on restart so an in-progress turn stops
  });
  const quizResolve = useRef<(() => void) | null>(null);

  const [mode, setMode] = useState<Mode>('yourTurn');
  const [winner, setWinner] = useState<Who | null>(null);
  const [positions, setPositions] = useState<Record<Who, number>>({ you: 0, paku: 0 });
  const [articlesRead, setArticlesRead] = useState(0);
  const [article, setArticle] = useState<ArticleState | null>(null);
  const [paku, setPaku] = useState(
    "Let's race up the forest trail to the bamboo grove! Roll the die to move. Climb UP the trees, but watch out for snakes, they'll slide you DOWN! If you step on an endangered animal, you'll learn all about it."
  );
  const [canvasSize, setCanvasSize] = useState({ w: W, h: H });

  const pakuSays = useCallback(
    (text: string) => {
      sounds.playAnimalChirp(animal.voicePitch);
      setPaku(text);
    },
    [animal.voicePitch]
  );

  useEffect(() => {
    alive.current = true;
    const img = new Image();
    img.src = '/assets/sprites/red_panda.png';
    pakuImg.current = img;
    return () => {
      alive.current = false;
    };
  }, []);

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

  // ---- Turn helpers ----
  const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  const animate = (who: Who, points: [number, number][], segMs: number, hop: boolean) =>
    new Promise<void>((resolve) => {
      if (points.length === 0) return resolve();
      game.current.anim = { who, points: [game.current.token[who], ...points], segMs, hop, elapsed: 0, resolve };
    });

  const runArticle = (index: number) =>
    new Promise<void>((resolve) => {
      quizResolve.current = resolve;
      const a = ENDANGERED[index];
      const questions = shuffle(a.questions).slice(0, QUESTIONS_PER_ARTICLE);
      setArticle({ animal: a, stage: 'read', questions, index: 0, options: shuffle(questions[0].options), wrong: [], solved: false });
    });

  const takeTurn = async (who: Who) => {
    const g = game.current;
    const run = g.runId;
    const stillRunning = () => alive.current && g.runId === run;
    setMode(who === 'you' ? 'busy' : 'pakuTurn');

    // Roll
    g.rolling = true;
    sounds.playClick();
    await wait(650);
    if (!stillRunning()) return;
    const roll = 1 + Math.floor(Math.random() * 6);
    g.rolling = false;
    g.dice = roll;
    if (who === 'paku') pakuSays(`I rolled a ${roll}!`);

    // Hop square by square (bouncing back if the roll overshoots HOME).
    // You stop to learn about any endangered animal you step on, even in passing.
    const start = g.pos[who];
    const steps: number[] = [];
    for (let s = start + 1; s <= Math.min(start + roll, LAST); s++) steps.push(s);
    for (let s = LAST - 1; s >= LAST - (start + roll - LAST); s--) steps.push(s);
    for (const square of steps) {
      await animate(who, [tokenPoint(square, who)], 190, true);
      if (!stillRunning()) return;
      g.pos[who] = square;
      setPositions({ ...g.pos });
      const animalIndex = ANIMAL_SQUARES[square];
      if (who === 'you' && animalIndex !== undefined && !g.learned.has(square)) {
        g.learned.add(square);
        const a = ENDANGERED[animalIndex];
        sounds.playBloom();
        pakuSays(`You stepped on the ${a.name}! Let's learn about it before you keep going.`);
        await runArticle(animalIndex);
        if (!stillRunning()) return;
      }
    }

    const landed = g.pos[who];
    const tree = g.layout.trees.find((t) => t.from === landed);
    const snake = g.layout.snakes.find((s) => s.from === landed);
    if (tree) {
      sounds.playBloom();
      pakuSays(who === 'you' ? `A tree! Climb up to square ${tree.to}!` : `Wheee, I'm climbing up to square ${tree.to}!`);
      await animate(who, treePath(tree.from, tree.to).map(([x, y]) => [x + TOKEN_OFFSET[who][0], y + TOKEN_OFFSET[who][1]] as [number, number]), 30, false);
      g.pos[who] = tree.to;
    } else if (snake) {
      sounds.playHurt();
      pakuSays(who === 'you' ? `Oh no, a snake! Slide down to square ${snake.to}!` : `Eek, a snake! Down I go to square ${snake.to}...`);
      await animate(who, snakePath(snake.from, snake.to).map(([x, y]) => [x + TOKEN_OFFSET[who][0], y + TOKEN_OFFSET[who][1]] as [number, number]), 22, false);
      g.pos[who] = snake.to;
    }
    if (!stillRunning()) return;
    setPositions({ ...g.pos });

    // Reaching HOME: the bamboo shoots up to the sky, then the win screen appears
    if (g.pos[who] === LAST) {
      g.winTime = g.time;
      setMode('celebrating');
      sounds.playFanfare();
      pakuSays(who === 'you' ? 'You made it to the bamboo grove first! Look at the bamboo grow!' : 'I made it to the bamboo grove first! Look at the bamboo grow!');
      if (who === 'you') addCoinsRef.current(animal.biome, WIN_COINS);
      await wait(1900);
      if (!stillRunning()) return;
      setWinner(who);
      setMode(who === 'you' ? 'won' : 'lost');
      return;
    }

    // Paku shares a quick fact when he lands on an animal (and so do you on one you've already read)
    const landedAnimal = ANIMAL_SQUARES[g.pos[who]];
    if (landedAnimal !== undefined && (who === 'paku' || g.learned.has(g.pos[who])) && !tree && !snake) {
      const a = ENDANGERED[landedAnimal];
      pakuSays(`${who === 'paku' ? "I'm on" : "You're back on"} the ${a.name} square! Remember: ${a.article[0].split('. ')[0]}.`);
      await wait(1400);
      if (!stillRunning()) return;
    }

    if (who === 'you') {
      await wait(500);
      if (!stillRunning()) return;
      takeTurn('paku');
    } else {
      await wait(400);
      if (!stillRunning()) return;
      setMode('yourTurn');
      if (!tree && !snake && landedAnimal === undefined) pakuSays(`I'm on square ${g.pos.paku}. Your turn!`);
    }
  };

  const roll = () => {
    if (mode !== 'yourTurn') return;
    takeTurn('you');
  };

  const restart = () => {
    sounds.playClick();
    const g = game.current;
    g.runId += 1;
    g.anim = null;
    g.rolling = false;
    g.winTime = -1;
    g.learned = new Set();
    g.layout = generateLayout(); // new tree and snake spots every game
    g.pos = { you: 0, paku: 0 };
    g.token = { you: tokenPoint(0, 'you'), paku: tokenPoint(0, 'paku') };
    quizResolve.current = null;
    setArticle(null);
    setWinner(null);
    setPositions({ you: 0, paku: 0 });
    setArticlesRead(0);
    setMode('yourTurn');
    pakuSays('Rematch! The trees and snakes have moved to new spots. You go first, roll the die!');
  };

  // ---- Article + questions ----
  const startQuestions = () => {
    sounds.playClick();
    setArticle((a) => (a ? { ...a, stage: 'quiz' } : a));
  };

  const answer = (choice: string) => {
    if (!article || article.solved || article.wrong.includes(choice)) return;
    if (choice === article.questions[article.index].answer) {
      sounds.playCoin();
      setArticle({ ...article, solved: true });
    } else {
      sounds.playClick();
      setArticle({ ...article, wrong: [...article.wrong, choice] });
    }
  };

  const nextQuestion = () => {
    if (!article) return;
    sounds.playClick();
    if (article.index < article.questions.length - 1) {
      const index = article.index + 1;
      setArticle({ ...article, index, options: shuffle(article.questions[index].options), wrong: [], solved: false });
      return;
    }
    setArticle(null);
    setArticlesRead((n) => n + 1);
    addCoinsRef.current(animal.biome, COINS_PER_ARTICLE);
    pakuSays(`Great job learning about the ${article.animal.name}! Keep going!`);
    const resolve = quizResolve.current;
    quizResolve.current = null;
    resolve?.();
  };

  // ---- Render loop ----
  useEffect(() => {
    if (!isHappy) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;
    const board = buildBoard();
    const faces = ENDANGERED.map((a) => buildFace(a.id));
    const farmer = buildFarmer();
    const hut = buildHut();

    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = game.current;
      g.time += dt;

      // Advance the current token animation
      const a = g.anim;
      if (a) {
        a.elapsed += dt * 1000;
        const segs = a.points.length - 1;
        const progress = Math.min(segs, a.elapsed / a.segMs);
        const i = Math.min(segs - 1, Math.floor(progress));
        const f = progress - i;
        const [x1, y1] = a.points[i];
        const [x2, y2] = a.points[i + 1];
        g.token[a.who] = [x1 + (x2 - x1) * f, y1 + (y2 - y1) * f - (a.hop ? Math.sin(f * Math.PI) * 10 : 0)];
        if (progress >= segs) {
          g.token[a.who] = a.points[segs];
          g.anim = null;
          a.resolve();
        }
      }

      ctx.drawImage(board, 0, 0);

      // Endangered animal squares: golden glow + portrait (dimmed once you've read about them)
      Object.entries(ANIMAL_SQUARES).forEach(([sq, idx]) => {
        const [cx, cy] = squareCenter(Number(sq));
        const learned = g.learned.has(Number(sq));
        // Round badge: gold (or green once learned) ring, cream backing, crisp 2x portrait
        const ring = learned ? '#65a30d' : Math.sin(g.time * 3) > 0 ? '#fbbf24' : '#f59e0b';
        for (let dy = -19; dy <= 19; dy += 2) {
          const half = Math.round(Math.sqrt(Math.max(0, 19 * 19 - dy * dy)) / 2) * 2;
          ctx.fillStyle = Math.abs(dy) > 16 || half > Math.sqrt(Math.max(0, 16 * 16 - dy * dy)) ? ring : '#fffbeb';
          ctx.fillRect(Math.round(cx) - half, Math.round(cy) + dy, half * 2, 2);
        }
        ctx.fillStyle = '#fffbeb';
        for (let dy = -15; dy <= 15; dy += 2) {
          const half = Math.round(Math.sqrt(Math.max(0, 15 * 15 - dy * dy)) / 2) * 2;
          ctx.fillRect(Math.round(cx) - half, Math.round(cy) + dy, half * 2, 2);
        }
        ctx.drawImage(faces[idx], Math.round(cx - FACE_SIZE), Math.round(cy - FACE_SIZE), FACE_SIZE * 2, FACE_SIZE * 2);
      });

      g.layout.trees.forEach((t) => drawTree(ctx, t.from, t.to));
      g.layout.snakes.forEach((s) => drawSnake(ctx, s.from, s.to, g.time));

      // Bamboo grove (shoots up to the sky after a win)
      const grow = g.winTime < 0 ? 0 : Math.min(1, (g.time - g.winTime) / 1.5);
      drawBamboo(ctx, grow * grow * (3 - 2 * grow), g.time);
      ctx.drawImage(hut, HOME[0] - HUT_W, HOME[1] + 12 - HUT_H * 2, HUT_W * 2, HUT_H * 2);
      if (g.winTime >= 0) {
        const t = g.time - g.winTime;
        for (let i = 0; i < 14; i++) {
          const sx = HOME[0] + Math.sin(i * 2.3 + t) * 40;
          const sy = HOME[1] - ((t * 90 + i * 37) % 120);
          ctx.fillStyle = i % 2 ? '#fef08a' : '#ffffff';
          ctx.fillRect(Math.round(sx) - 1, Math.round(sy) - 3, 2, 6);
          ctx.fillRect(Math.round(sx) - 3, Math.round(sy) - 1, 6, 2);
        }
      }

      // Tokens: Paku (red panda sprite) and your farmer
      const [px, py] = g.token.paku;
      const img = pakuImg.current;
      if (img?.complete) ctx.drawImage(img, 0, 0, 200, 175, Math.round(px - 16), Math.round(py - 22), 32, 28);
      const [yx, yy] = g.token.you;
      ctx.fillStyle = 'rgba(20, 10, 0, 0.3)';
      ctx.fillRect(Math.round(yx) - 9, Math.round(yy) + 6, 18, 4);
      ctx.drawImage(farmer, Math.round(yx - FARMER_W), Math.round(yy - FARMER_H * 2 + 10), FARMER_W * 2, FARMER_H * 2);

      // Die in the top right corner
      const face = g.rolling ? 1 + (Math.floor(g.time * 20) % 6) : g.dice;
      drawDie(ctx, W - 58, 8, face, 40);

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isHappy]);

  const avatar = isHappy ? animal.avatar : animal.avatar.replace('.png', '_sad.png');
  const over = mode === 'won' || mode === 'lost';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-24 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-pixel">
      <div className={`relative w-full max-w-4xl pixel-panel overflow-hidden flex flex-col max-h-full text-[#2e1005] shadow-2xl ${isHappy ? 'h-full max-h-[760px]' : ''}`}>
        {/* Header with positions */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb] flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 border-2 border-[#fde68a] bg-[#2e1005] overflow-hidden flex-shrink-0">
              <img src={avatar} alt={animal.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[10px] font-pixel-heading text-[#fde68a] tracking-wider truncate">
                {isHappy ? `${animal.name.toUpperCase()}'S TREES & SNAKES` : animal.name.toUpperCase()}
              </h3>
              <p className="text-[9.5px] text-[#fde68a]/80 truncate">{animal.biomeName} • Race up the forest trail</p>
            </div>
          </div>
          {isHappy && (
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="whitespace-nowrap text-[#93c5fd]">YOU: {positions.you || 'START'}</span>
              <span className="whitespace-nowrap text-[#fdba74]">PAKU: {positions.paku || 'START'}</span>
              <span className="hidden sm:flex items-center gap-1 text-[#fde68a] whitespace-nowrap">
                <BookOpen className="w-3 h-3" /> {articlesRead}/{ENDANGERED.length}
              </span>
            </div>
          )}
          <button onClick={onClose} className="p-1 pixel-btn-red text-[9px] flex-shrink-0" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isHappy ? (
          /* Locked until the forest is restored */
          <div className="p-6 bg-[#fcf6e8] flex flex-col items-center text-center gap-3">
            <img src={avatar} alt={`${animal.name} looking sad`} className="w-28 h-28" style={{ imageRendering: 'pixelated' }} />
            <div className="pixel-card p-3 max-w-md text-[10px] leading-relaxed">
              <strong>{animal.name}:</strong> &quot;The forest is full of smoke and my bamboo is burning... I can&apos;t play right now.
              Please help put out the fires and protect the forest, then come back and race me!&quot;
            </div>
            {quest && !quest.completed && (
              <button onClick={onStartQuest} className="pixel-btn-green px-3 py-1.5 text-[9px] font-bold flex items-center gap-1">
                <span>START ACTION PLAN: {quest.title.toUpperCase()}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="relative flex-1 min-h-0 flex flex-col gap-2 bg-[#fcf6e8] p-2.5 overflow-hidden">
            {/* Paku talks */}
            <div className="flex items-start gap-2 flex-shrink-0">
              <img src={avatar} alt={animal.name} className="w-10 h-10 flex-shrink-0" style={{ imageRendering: 'pixelated' }} />
              <div className="flex-1 border-2 border-[#5c2c16] bg-[#fffbf2] px-2.5 py-1.5 text-[11px] leading-snug shadow-[2px_2px_0px_#2e1005]" aria-live="polite">
                <strong>{animal.name}:</strong> {paku}
              </div>
            </div>

            {/* Board: scales to fill the leftover space */}
            <div ref={stageRef} className="flex-1 min-h-0 flex items-center justify-center">
              <div className="relative border-4 border-[#2e1005] shadow-[3px_3px_0px_#2e1005] select-none" style={{ width: canvasSize.w, height: canvasSize.h }}>
                <canvas
                  ref={canvasRef}
                  width={W}
                  height={H}
                  className="block w-full h-full"
                  style={{ imageRendering: 'pixelated' }}
                  aria-label="Trees and snakes forest trail game against Paku the red panda"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
              <button
                onClick={roll}
                disabled={mode !== 'yourTurn'}
                className="pixel-btn-green px-4 py-2 text-[12px] font-bold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Dices className="w-4 h-4" />
                {mode === 'yourTurn' ? 'ROLL THE DIE' : mode === 'pakuTurn' ? "PAKU'S TURN..." : mode === 'busy' ? 'MOVING...' : 'GAME OVER'}
              </button>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-[#5c2c16]">
                <span className="text-[#15803d]">TREE = CLIMB UP</span>
                <span className="text-[#b45309]">SNAKE = SLIDE DOWN</span>
                <span className="text-[#a16207]">GOLD SQUARE = ENDANGERED ANIMAL</span>
                <span className="flex items-center gap-1 text-[#b45309]">
                  <Coins className="w-3 h-3" /> +{COINS_PER_ARTICLE} PER ARTICLE • +{WIN_COINS} FOR WINNING
                </span>
              </div>
            </div>

            {/* Win / lose screen (after the bamboo finishes growing) */}
            {over && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#14532d]/80 p-3">
                <div className="pixel-panel w-full max-w-sm p-5 text-center">
                  {winner === 'you' ? (
                    <Trophy className="w-12 h-12 text-[#b45309] mx-auto mb-2" />
                  ) : (
                    <img src={animal.avatar} alt={animal.name} className="w-16 h-16 mx-auto mb-1" style={{ imageRendering: 'pixelated' }} />
                  )}
                  <h4 className="font-pixel-heading text-sm mb-2">{winner === 'you' ? 'YOU WIN!' : 'PAKU WINS!'}</h4>
                  <p className="text-[11.5px] leading-relaxed mb-1">
                    {winner === 'you'
                      ? 'You raced up the forest trail and reached the bamboo grove before Paku!'
                      : 'Paku reached the bamboo grove first. So close!'}
                  </p>
                  <p className="text-[11px] text-[#15803d] font-bold mb-1">
                    Endangered animals learned: {articlesRead} of {ENDANGERED.length}
                  </p>
                  {winner === 'you' && <p className="text-[11px] text-[#b45309] font-bold mb-3">+{WIN_COINS} forest coins!</p>}
                  {winner !== 'you' && <div className="mb-3" />}
                  <button onClick={restart} className="pixel-btn-green px-4 py-2 text-[10px] inline-flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" /> PLAY AGAIN
                  </button>
                </div>
              </div>
            )}

            {/* Endangered animal article + questions (covers the whole game area) */}
            {article && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#14532d]/80 p-3">
                <div className="pixel-panel w-full max-w-lg max-h-full flex flex-col">
                  <div className="px-3 py-2 border-b-2 border-[#5c2c16] flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#14532d]">
                      <BookOpen className="w-4 h-4" /> {article.animal.name.toUpperCase()}
                    </span>
                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 bg-[#b91c1c] text-white">{article.animal.status}</span>
                  </div>
                  {article.stage === 'read' ? (
                    <>
                      <div className="p-3 overflow-y-auto space-y-2.5 text-[12px] leading-relaxed">
                        {article.animal.article.map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>
                      <div className="p-2.5 border-t-2 border-[#5c2c16] flex justify-between items-center gap-2">
                        <span className="text-[10px] text-[#78350f]">Next: {article.questions.length} questions</span>
                        <button onClick={startQuestions} className="pixel-btn-green px-3 py-1.5 text-[10.5px] inline-flex items-center gap-1">
                          I&apos;M READY <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 overflow-y-auto">
                      <div className="flex justify-between text-[10px] font-bold text-[#15803d] mb-1.5">
                        <span>
                          QUESTION {article.index + 1} OF {article.questions.length}
                        </span>
                        <button onClick={() => setArticle({ ...article, stage: 'read' })} className="underline">
                          Reread the article
                        </button>
                      </div>
                      <p className="text-[12.5px] font-bold mb-2.5 leading-snug">{article.questions[article.index].q}</p>
                      <div className="grid gap-1.5">
                        {article.options.map((opt) => {
                          const isWrong = article.wrong.includes(opt);
                          const isRight = article.solved && opt === article.questions[article.index].answer;
                          return (
                            <button
                              key={opt}
                              onClick={() => answer(opt)}
                              disabled={article.solved || isWrong}
                              className={`text-left px-2.5 py-2 border-2 text-[11.5px] shadow-[2px_2px_0px_#2e1005] ${
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
                      {article.wrong.length > 0 && !article.solved && (
                        <p className="mt-2 text-[10.5px] text-[#b91c1c]">Not quite! Try another answer, or reread the article.</p>
                      )}
                      {article.solved && (
                        <div className="flex items-center justify-between mt-2.5">
                          <span className="flex items-center gap-1 text-[10.5px] font-bold text-[#15803d]">
                            <CheckCircle className="w-3.5 h-3.5" /> CORRECT!
                          </span>
                          <button onClick={nextQuestion} className="pixel-btn-green px-3 py-1.5 text-[10.5px]">
                            {article.index < article.questions.length - 1 ? 'NEXT QUESTION →' : 'KEEP GOING →'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
