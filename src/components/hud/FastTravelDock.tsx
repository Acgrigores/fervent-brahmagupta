'use client';

import React from 'react';
import { useGameState } from '@/context/GameStateContext';
import { BiomeId } from '@/types/game';
import { BIOMES_INFO, FARM_CROPS } from '@/data/animals';
import { sounds } from '@/utils/soundEffects';
import { Compass, Check } from 'lucide-react';

interface BiomeDockEntry {
  id: BiomeId;
  label: string;
  avatar: string;
  coords: { x: number; y: number };
}

export const BIOME_WARP_COORDS: Record<BiomeId, { x: number; y: number }> = {
  clearing: { x: 1600, y: 1200 }, // Central Farm
  forest: { x: 650, y: 550 },
  lake: { x: 650, y: 1850 },
  tundra: { x: 1600, y: 400 },
  grasslands: { x: 2550, y: 1850 },
  desert: { x: 2650, y: 1000 },
  reefs: { x: 1600, y: 2050 },
};

const DOCK_ENTRIES: BiomeDockEntry[] = [
  { id: 'clearing', label: 'Central Farm', avatar: '🏡', coords: BIOME_WARP_COORDS.clearing },
  { id: 'lake', label: 'Lake (Corn)', avatar: '🌽', coords: BIOME_WARP_COORDS.lake },
  { id: 'forest', label: 'Forest (Apples)', avatar: '🍎', coords: BIOME_WARP_COORDS.forest },
  { id: 'tundra', label: 'Tundra (Wheat)', avatar: '🌾', coords: BIOME_WARP_COORDS.tundra },
  { id: 'grasslands', label: 'Grasslands (Sunflowers)', avatar: '🌻', coords: BIOME_WARP_COORDS.grasslands },
  { id: 'desert', label: 'Desert (Melons)', avatar: '🍈', coords: BIOME_WARP_COORDS.desert },
  { id: 'reefs', label: 'Reefs (Rice)', avatar: '🌱', coords: BIOME_WARP_COORDS.reefs },
];

export default function FastTravelDock() {
  const { currentBiome, setCurrentBiome, restoration } = useGameState();

  const handleWarp = (entry: BiomeDockEntry) => {
    sounds.playClick();
    setCurrentBiome(entry.id);

    // Dispatch global event so Phaser player can warp immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('WARP_PLAYER', {
          detail: { x: entry.coords.x, y: entry.coords.y, biome: entry.id },
        })
      );
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-1.5 p-1.5 bg-zinc-950/85 backdrop-blur-md rounded-2xl border border-zinc-800 shadow-2xl select-none">
      <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 px-2">
        <Compass className="w-3.5 h-3.5 text-emerald-400" />
        <span>Travel:</span>
      </div>

      {DOCK_ENTRIES.map((entry) => {
        const isCurrent = currentBiome === entry.id;
        const isFlourished = (restoration[entry.id] || 0) >= 80;

        return (
          <button
            key={entry.id}
            onClick={() => handleWarp(entry)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
              isCurrent
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400'
                : 'bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800/80'
            }`}
          >
            <span>{entry.avatar}</span>
            <span className="hidden lg:inline">{entry.label}</span>
            {isFlourished && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}
