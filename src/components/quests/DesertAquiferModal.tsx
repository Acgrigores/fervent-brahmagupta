'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { X, CheckCircle, Circle, MapPin, Users, Sparkles, Award, Droplets } from 'lucide-react';
import { US_GRID, US_GRID_ALPHABET, US_GRID_COLS, US_GRID_ROWS, US_STATES } from '@/data/usStateGrid';

// ---------------------------------------------------------------
// "Desert Health Across the USA": a pixel map of the lower 48 states split into
// regions. Click every region to learn how people there can help keep deserts
// healthy, and find local groups and volunteer opportunities.
// ---------------------------------------------------------------
type RegionId = 'pacific' | 'mountain' | 'southwest' | 'plains' | 'midwest' | 'southeast' | 'northeast';

interface Region {
  name: string;
  states: string;
  color: string;
  hover: string;
  why: string;
  actions: string[];
  groups: { name: string; what: string }[];
}

const REGIONS: Record<RegionId, Region> = {
  pacific: {
    name: 'Pacific West',
    states: 'California, Oregon, Washington',
    color: '#38bdf8',
    hover: '#7dd3fc',
    why: "Southern California is home to the Mojave and Colorado Deserts, and millions of Californians drink water from the Colorado River.",
    actions: [
      'Swap thirsty lawns for drought-tolerant native plants',
      'Water gardens early in the morning so less evaporates',
      'Stay on trails in desert parks to protect fragile soil crusts',
      'Help prevent wildfires, which spread fast through invasive desert grasses',
    ],
    groups: [
      { name: 'Mojave Desert Land Trust', what: 'Volunteer with desert habitat restoration and native seed projects in the Mojave.' },
      { name: 'California Native Plant Society', what: 'Local chapters lead plant walks, restoration days and native plant sales.' },
      { name: 'Joshua Tree National Park volunteers', what: 'Help with trail work and visitor education. Find openings on Volunteer.gov.' },
    ],
  },
  mountain: {
    name: 'Mountain West',
    states: 'Nevada, Utah, Colorado, Idaho, Montana, Wyoming',
    color: '#a78bfa',
    hover: '#c4b5fd',
    why: 'Mountain snowpack here feeds the Colorado River, which supplies water to about 40 million people and farms across the desert Southwest. The Great Basin is a cold desert too!',
    actions: [
      'Save water at home: every gallon helps keep the Colorado River flowing',
      'Help restore sagebrush habitat for wildlife like sage-grouse',
      'Never drive off-road on desert soil, where tire tracks can last for decades',
      'Learn about and pull invasive cheatgrass, which fuels wildfires',
    ],
    groups: [
      { name: 'Great Basin Institute', what: 'Runs conservation and restoration programs across Nevada and the West.' },
      { name: 'Volunteers for Outdoor Colorado', what: 'One-day trail building and habitat restoration projects around Colorado.' },
      { name: 'Friends of Nevada Wilderness', what: 'Volunteer trips to clean up and restore wild desert lands in Nevada.' },
    ],
  },
  southwest: {
    name: 'Desert Southwest',
    states: 'Arizona, New Mexico, Texas',
    color: '#f97316',
    hover: '#fdba74',
    why: "This is desert country: the Sonoran and Chihuahuan Deserts are here, home to saguaros, roadrunners and Zuri's oasis friends. Groundwater is being pumped faster than rain can refill it.",
    actions: [
      'Plant native, water-wise gardens (xeriscaping) and harvest rainwater',
      'Join invasive buffelgrass pulls, which protect saguaros from fire',
      'Report leaks and support smart groundwater rules in your town',
      'Pack out all trash on desert hikes and keep pets on trails',
    ],
    groups: [
      { name: 'Arizona-Sonora Desert Museum', what: 'Volunteer as a docent or helper at this Tucson desert museum and zoo.' },
      { name: 'Texas Master Naturalist', what: 'Local chapters train volunteers to care for native habitats across Texas.' },
      { name: 'Audubon Southwest', what: 'Bird and habitat conservation projects in Arizona and New Mexico.' },
    ],
  },
  plains: {
    name: 'Great Plains',
    states: 'North Dakota, South Dakota, Nebraska, Kansas, Oklahoma',
    color: '#facc15',
    hover: '#fde68a',
    why: 'The Ogallala Aquifer under the Plains is one of the largest in the world, but it is being drained for irrigation. Bare, dry soil here once blew away in the Dust Bowl, a reminder of how land can turn desert-like.',
    actions: [
      'Support efficient irrigation that protects the Ogallala Aquifer',
      'Plant windbreaks and shelterbelts that stop soil from blowing away',
      'Help restore native prairie grasses with deep, soil-holding roots',
      'Learn how cover crops keep farmland soil healthy in dry years',
    ],
    groups: [
      { name: 'The Nature Conservancy prairie preserves', what: 'Volunteer at preserves like the Tallgrass Prairie Preserve in Oklahoma.' },
      { name: 'Pheasants Forever & Quail Forever', what: 'Local chapters plant and restore grassland habitat with volunteers.' },
      { name: "Nebraska's Natural Resources Districts", what: 'Local districts run tree-planting and groundwater conservation programs.' },
    ],
  },
  midwest: {
    name: 'Midwest',
    states: 'Minnesota, Iowa, Missouri, Wisconsin, Illinois, Michigan, Indiana, Ohio',
    color: '#4ade80',
    hover: '#86efac',
    why: "Even far from any desert, Midwest choices matter: using less energy slows the climate warming that makes droughts hotter and longer in desert regions.",
    actions: [
      'Save energy at home: lights off, smart thermostats, cleaner power',
      'Waste less food, since growing it uses lots of water',
      'Support regenerative farming that keeps soil healthy and moist',
      'Write to leaders about protecting water and climate',
    ],
    groups: [
      { name: 'Alliance for the Great Lakes', what: 'Join volunteer beach cleanups and freshwater protection events.' },
      { name: "Citizens' Climate Lobby", what: 'Local chapters across the country help people speak up for climate action.' },
      { name: 'Pheasants Forever', what: 'Midwest chapters restore prairie and wetland habitat with volunteers.' },
    ],
  },
  southeast: {
    name: 'Southeast',
    states: 'Arkansas, Louisiana, Mississippi, Alabama, Georgia, Florida, Tennessee, Kentucky, the Carolinas, Virginia, West Virginia',
    color: '#f472b6',
    hover: '#f9a8d4',
    why: "A lot of out-of-season fruit and veggies are grown in desert farmland using scarce desert water. What we buy anywhere affects desert water use.",
    actions: [
      'Choose local, in-season produce when you can',
      'Plant trees and protect wetlands that keep water in the land',
      'Cut energy use to slow the warming behind desert droughts',
      'Reduce single-use plastic, which can blow into desert landscapes',
    ],
    groups: [
      { name: 'Keep America Beautiful affiliates', what: 'Local groups host community cleanups and tree plantings.' },
      { name: 'Sierra Club chapters', what: 'Join outings, service trips and local environmental campaigns.' },
      { name: 'Audubon chapters', what: 'Volunteer for bird counts and habitat projects near you.' },
    ],
  },
  northeast: {
    name: 'Northeast',
    states: 'Pennsylvania, New York, New Jersey, Maryland, Delaware & New England',
    color: '#94a3b8',
    hover: '#cbd5e1',
    why: 'Big cities can make a big difference: clean energy and smart shopping in the Northeast help slow the climate change that is drying out deserts.',
    actions: [
      'Support clean energy like solar and wind in your community',
      'Use reusable bottles and bags, and recycle',
      'Learn which products use lots of desert water to grow',
      'Donate or fundraise for desert conservation groups',
    ],
    groups: [
      { name: 'Appalachian Mountain Club', what: 'Volunteer trail crews and outdoor stewardship programs.' },
      { name: '350.org local groups', what: 'Community climate action groups that organize events.' },
      { name: 'Volunteer.gov', what: 'Find volunteer projects at national parks and public lands, including desert parks.' },
    ],
  },
};

// ---------------------------------------------------------------
// Pixel map: real state shapes (from the generated state grid), colored by region,
// with state lines between neighbouring states and a dark coastline/border outline
// ---------------------------------------------------------------
const REGION_STATES: Record<RegionId, string[]> = {
  pacific: ['CA', 'OR', 'WA'],
  mountain: ['NV', 'UT', 'CO', 'ID', 'MT', 'WY'],
  southwest: ['AZ', 'NM', 'TX'],
  plains: ['ND', 'SD', 'NE', 'KS', 'OK'],
  midwest: ['MN', 'IA', 'MO', 'WI', 'IL', 'MI', 'IN', 'OH'],
  southeast: ['AR', 'LA', 'MS', 'AL', 'GA', 'FL', 'TN', 'KY', 'NC', 'SC', 'VA', 'WV'],
  northeast: ['PA', 'NY', 'NJ', 'MD', 'DE', 'DC', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME'],
};
// Short two-line labels, centered over a few core states so they sit inside each region
const REGION_LABELS: Record<RegionId, { lines: string[]; anchor: string[] }> = {
  pacific: { lines: ['PACIFIC', 'WEST'], anchor: ['OR', 'CA'] },
  mountain: { lines: ['MOUNTAIN', 'WEST'], anchor: ['ID', 'WY', 'UT', 'NV'] },
  southwest: { lines: ['DESERT', 'SOUTHWEST'], anchor: ['AZ', 'NM', 'TX'] },
  plains: { lines: ['GREAT', 'PLAINS'], anchor: ['SD', 'NE', 'KS'] },
  midwest: { lines: ['MIDWEST'], anchor: ['IA', 'WI', 'IL'] },
  southeast: { lines: ['SOUTH', 'EAST'], anchor: ['TN', 'AL', 'GA'] },
  northeast: { lines: ['NORTH', 'EAST'], anchor: ['NY', 'PA'] },
};

const PX = 6; // screen pixels per map pixel
const MAP_W = US_GRID_COLS * PX;
const MAP_H = US_GRID_ROWS * PX;

const stateIndexAt = (col: number, row: number) => {
  if (row < 0 || row >= US_GRID_ROWS || col < 0 || col >= US_GRID_COLS) return -1;
  return US_GRID_ALPHABET.indexOf(US_GRID[row][col]);
};
const STATE_REGION: RegionId[] = US_STATES.map(
  (s) => (Object.keys(REGION_STATES) as RegionId[]).find((r) => REGION_STATES[r].includes(s.abbr)) ?? 'southeast'
);
const regionAtCell = (col: number, row: number): RegionId | null => {
  const i = stateIndexAt(col, row);
  return i >= 0 ? STATE_REGION[i] : null;
};

// Label anchor: the average position of the anchor states' pixels
const LABEL_POS = (Object.keys(REGION_LABELS) as RegionId[]).map((id) => {
  const wanted = REGION_LABELS[id].anchor.map((a) => US_STATES.findIndex((s) => s.abbr === a));
  let sx = 0;
  let sy = 0;
  let n = 0;
  US_GRID.forEach((line, row) =>
    line.split('').forEach((ch, col) => {
      if (wanted.includes(US_GRID_ALPHABET.indexOf(ch))) {
        sx += col + 0.5;
        sy += row + 0.5;
        n++;
      }
    })
  );
  return { id, x: (sx / n) * PX, y: (sy / n) * PX };
});

function drawUsMap(ctx: CanvasRenderingContext2D, highlight: RegionId | null, selected: RegionId | null, visited: RegionId[]) {
  ctx.clearRect(0, 0, MAP_W, MAP_H);
  ctx.fillStyle = '#bae6fd';
  ctx.fillRect(0, 0, MAP_W, MAP_H);

  // Land pixels colored by region
  for (let row = 0; row < US_GRID_ROWS; row++) {
    for (let col = 0; col < US_GRID_COLS; col++) {
      const region = regionAtCell(col, row);
      if (!region) continue;
      const r = REGIONS[region];
      ctx.fillStyle = region === selected || region === highlight ? r.hover : r.color;
      ctx.fillRect(col * PX, row * PX, PX, PX);
    }
  }

  // State lines (between different states) and the outer coastline/border (land next to water)
  for (let row = 0; row < US_GRID_ROWS; row++) {
    for (let col = 0; col < US_GRID_COLS; col++) {
      const here = stateIndexAt(col, row);
      if (here < 0) continue;
      const x = col * PX;
      const y = row * PX;
      const right = stateIndexAt(col + 1, row);
      const down = stateIndexAt(col, row + 1);
      const left = stateIndexAt(col - 1, row);
      const up = stateIndexAt(col, row - 1);
      ctx.fillStyle = 'rgba(28, 25, 23, 0.45)';
      if (right >= 0 && right !== here) ctx.fillRect(x + PX - 1, y, 1, PX);
      if (down >= 0 && down !== here) ctx.fillRect(x, y + PX - 1, PX, 1);
      ctx.fillStyle = '#1c1917';
      if (right < 0) ctx.fillRect(x + PX - 2, y, 2, PX);
      if (left < 0) ctx.fillRect(x, y, 2, PX);
      if (down < 0) ctx.fillRect(x, y + PX - 2, PX, 2);
      if (up < 0) ctx.fillRect(x, y, PX, 2);
    }
  }

  // Region labels (small pixel font with a light outline) and a check once explored
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.lineJoin = 'round'; // avoids spiky corners on the text outline
  LABEL_POS.forEach(({ id, x, y }) => {
    const lines = REGION_LABELS[id].lines;
    const done = visited.includes(id);
    lines.forEach((text, i) => {
      const ly = Math.round(y + (i - (lines.length - 1) / 2) * 11);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.strokeText(text, Math.round(x), ly);
      ctx.fillStyle = '#1c1917';
      ctx.fillText(text, Math.round(x), ly);
    });
    if (done) {
      // Little pixel check badge above the label
      const bx = Math.round(x) - 6;
      const by = Math.round(y - lines.length * 6 - 14);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(bx - 1, by - 1, 14, 12);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(bx, by, 12, 10);
      ctx.fillStyle = '#ffffff';
      [[1, 4], [3, 6], [5, 4], [7, 2], [9, 0]].forEach(([dx, dy]) => ctx.fillRect(bx + dx, by + dy + 1, 2, 2));
    }
  });
}

export default function DesertAquiferModal() {
  const { activeQuestModal, closeQuestModal, completeQuest, quests, restoration } = useGameState();
  const [selected, setSelected] = useState<RegionId | null>(null);
  const [visited, setVisited] = useState<RegionId[]>([]);
  const [hovered, setHovered] = useState<RegionId | null>(null);
  const regionIds = useMemo(() => Object.keys(REGIONS) as RegionId[], []);
  const mapRef = useRef<HTMLCanvasElement>(null);

  // Redraw the pixel map whenever the hover, selection or explored regions change
  useEffect(() => {
    const ctx = mapRef.current?.getContext('2d');
    if (ctx) drawUsMap(ctx, hovered, selected, visited);
  }, [hovered, selected, visited, activeQuestModal]);

  // Which region is under the pointer
  const regionFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * US_GRID_COLS);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * US_GRID_ROWS);
    return regionAtCell(col, row);
  };

  // Start fresh every time the task opens (also after the game progress is reset)
  useEffect(() => {
    if (activeQuestModal !== 'desert_aquifer') return;
    setSelected(null);
    setVisited([]);
    setHovered(null);
  }, [activeQuestModal]);

  if (activeQuestModal !== 'desert_aquifer') return null;

  const desertQuest = quests.find((q) => q.id === 'quest_desert');
  const restored = !!desertQuest?.completed && (restoration.desert || 0) >= 80;
  const allVisited = visited.length === regionIds.length;
  const region = selected ? REGIONS[selected] : null;

  const pick = (id: RegionId) => {
    setSelected(id);
    if (!visited.includes(id)) {
      sounds.playCoin();
      setVisited((v) => [...v, id]);
    } else {
      sounds.playClick();
    }
  };

  const finish = () => {
    if (!allVisited) return;
    completeQuest(
      'quest_desert',
      'Explored all seven US regions and learned how people everywhere can protect desert water, soil and wildlife, plus local groups to volunteer with.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel">
      <div className="relative w-full max-w-5xl h-full max-h-[720px] pixel-panel overflow-hidden text-[#2e1005] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌵</span>
            <div>
              <h3 className="font-pixel-heading text-[13px] text-[#fde68a] tracking-wider">DESERT HEALTH ACROSS THE USA</h3>
              <p className="text-[10.5px] text-[#fde68a]/85 mt-0.5">Sunfire Savanna • Everyone can help Zuri&apos;s desert, wherever they live</p>
            </div>
          </div>
          <button onClick={closeQuestModal} className="p-1 pixel-btn-red" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-3 py-1.5 bg-[#ffedd5] border-b-2 border-[#c2410c] flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] font-bold flex-shrink-0">
          <span className="text-[#7c2d12]">
            REGIONS EXPLORED: {visited.length}/{regionIds.length}
          </span>
          {/* Region names double as buttons (keyboard-friendly, and easier than tapping tiny regions) */}
          {regionIds.map((id) => (
            <button
              key={id}
              onClick={() => pick(id)}
              className={`flex items-center gap-1 hover:underline ${selected === id ? 'underline' : ''} ${visited.includes(id) ? 'text-[#15803d]' : 'text-[#78716c]'}`}
            >
              {visited.includes(id) ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
              {REGIONS[id].name}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3 p-3 bg-[#fffbf2]">
          {/* Map */}
          <div className="flex-1 md:flex-[3] min-h-0 flex flex-col gap-2">
            <p className="text-[11.5px] font-bold flex-shrink-0">Tap each colored region of the United States to see how people there can help keep deserts healthy.</p>
            <div className="flex-1 min-h-0 flex items-center justify-center bg-[#bae6fd] border-4 border-[#2e1005] shadow-[3px_3px_0px_#2e1005] p-1.5">
              <canvas
                ref={mapRef}
                width={MAP_W}
                height={MAP_H}
                className={`max-w-full max-h-full min-h-0 ${hovered ? 'cursor-pointer' : 'cursor-default'}`}
                style={{ imageRendering: 'pixelated' }}
                onMouseMove={(e) => setHovered(regionFromEvent(e))}
                onMouseLeave={() => setHovered(null)}
                onClick={(e) => {
                  const region = regionFromEvent(e);
                  if (region) pick(region);
                }}
                role="img"
                aria-label="Map of the United States with state lines, divided into seven colored regions"
              />
            </div>
            <p className="text-[9.5px] text-[#78716c] flex-shrink-0">Lower 48 states shown as pixels, with state lines. Map data: us-atlas.</p>
          </div>

          {/* Region details */}
          <div className="flex-1 md:flex-[2] min-h-0 flex flex-col gap-2">
            <div className="flex-1 min-h-0 overflow-y-auto pixel-card bg-white p-3 space-y-2.5 text-[11.5px] leading-relaxed">
              {region ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#2e1005] flex-shrink-0" style={{ background: region.color }} />
                    <h4 className="font-pixel-heading text-[12px]">{region.name.toUpperCase()}</h4>
                  </div>
                  <p className="text-[10.5px] text-[#78716c] flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {region.states}
                  </p>
                  <p className="flex gap-1.5">
                    <Droplets className="w-4 h-4 text-[#0284c7] flex-shrink-0 mt-0.5" />
                    <span>{region.why}</span>
                  </p>
                  <div>
                    <p className="font-bold text-[11px] text-[#c2410c] mb-1">WHAT YOU CAN DO HERE</p>
                    <ul className="space-y-1">
                      {region.actions.map((a) => (
                        <li key={a} className="flex gap-1.5">
                          <span className="text-[#c2410c]">▸</span> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-bold text-[11px] text-[#15803d] mb-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> VOLUNTEER & LOCAL GROUPS
                    </p>
                    <ul className="space-y-1.5">
                      {region.groups.map((g) => (
                        <li key={g.name} className="border-l-4 border-[#4ade80] pl-2">
                          <strong>{g.name}</strong>
                          <span className="block text-[10.5px]">{g.what}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[9.5px] text-[#78716c] mt-1.5">Check each group&apos;s website for current volunteer opportunities near you.</p>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-[#78350f]">
                  <MapPin className="w-8 h-8" />
                  <p className="text-[12px] font-bold">Pick a region on the map to start exploring!</p>
                  <p className="text-[11px]">
                    Deserts aren&apos;t just a Southwest problem. Water, energy and shopping choices everywhere affect them.
                  </p>
                </div>
              )}
            </div>

            {/* Finish */}
            <div className="flex-shrink-0 border-2 border-[#5c2c16] bg-[#fef3c7] p-2.5 text-center space-y-1.5">
              {restored ? (
                <>
                  <p className="flex items-center justify-center gap-1.5 font-bold text-[11.5px] text-[#15803d]">
                    <Award className="w-4 h-4" /> DESERT RESTORED! +420 COINS & 100% FLOURISH
                  </p>
                  <button onClick={closeQuestModal} className="pixel-btn-green px-4 py-1.5 text-[11px]">
                    BACK TO WORLD
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={finish}
                    disabled={!allVisited}
                    className="pixel-btn-green px-4 py-2 text-[11.5px] font-bold inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4" /> COMPLETE THE DESERT ACTION
                  </button>
                  <p className="text-[10px] text-[#78350f]">
                    {allVisited ? 'You explored every region! Restore the desert for Zuri (+420 coins).' : `Explore all ${regionIds.length} regions to finish (${visited.length}/${regionIds.length}).`}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
