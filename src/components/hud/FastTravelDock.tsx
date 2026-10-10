'use client';

import React from 'react';
import { useGameState } from '@/context/GameStateContext';
import { BiomeId } from '@/types/game';
import { sounds } from '@/utils/soundEffects';
import { Compass, Home, Droplets, Trees, Snowflake, Sun, Flame, Waves } from 'lucide-react';

interface BiomeDockEntry {
  id: BiomeId;
  label: string;
  icon: React.ReactNode;
}

const DOCK_ENTRIES: BiomeDockEntry[] = [
  { id: 'clearing', label: 'Central Farm', icon: <Home className="w-3.5 h-3.5 text-amber-400" /> },
  { id: 'lake', label: 'Lake (Corn)', icon: <Droplets className="w-3.5 h-3.5 text-cyan-400" /> },
  { id: 'forest', label: 'Forest (Apples)', icon: <Trees className="w-3.5 h-3.5 text-emerald-400" /> },
  { id: 'tundra', label: 'Tundra (Wheat)', icon: <Snowflake className="w-3.5 h-3.5 text-sky-300" /> },
  { id: 'grasslands', label: 'Grasslands (Sunflowers)', icon: <Sun className="w-3.5 h-3.5 text-amber-300" /> },
  { id: 'desert', label: 'Desert (Melons)', icon: <Flame className="w-3.5 h-3.5 text-orange-400" /> },
  { id: 'reefs', label: 'Reefs (Rice)', icon: <Waves className="w-3.5 h-3.5 text-teal-400" /> },
];

export default function FastTravelDock() {
  const { currentBiome, setCurrentBiome, restoration } = useGameState();

  const handleWarp = (entry: BiomeDockEntry) => {
    sounds.playClick();
    setCurrentBiome(entry.id);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-1.5 p-1.5 bg-zinc-950/90 backdrop-blur-md rounded-2xl border border-zinc-800 shadow-2xl select-none">
      <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 px-2">
        <Compass className="w-3.5 h-3.5 text-emerald-400" />
        <span>Room Travel:</span>
      </div>

      {DOCK_ENTRIES.map((entry) => {
        const isCurrent = currentBiome === entry.id;
        const isFlourished = (restoration[entry.id] || 0) >= 80;

        return (
          <button
            key={entry.id}
            onClick={() => handleWarp(entry)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
              isCurrent
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-400'
                : 'bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800'
            }`}
          >
            <span>{entry.icon}</span>
            <span className="hidden lg:inline">{entry.label}</span>
            {isFlourished && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}
