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
  { id: 'clearing', label: 'Central Farm', icon: <Home className="w-3.5 h-3.5 text-amber-600" /> },
  { id: 'lake', label: 'Lake (Corn)', icon: <Droplets className="w-3.5 h-3.5 text-cyan-600" /> },
  { id: 'forest', label: 'Forest (Apples)', icon: <Trees className="w-3.5 h-3.5 text-emerald-600" /> },
  { id: 'tundra', label: 'Tundra (Wheat)', icon: <Snowflake className="w-3.5 h-3.5 text-sky-600" /> },
  { id: 'grasslands', label: 'Prairie (Sunflowers)', icon: <Sun className="w-3.5 h-3.5 text-amber-600" /> },
  { id: 'desert', label: 'Desert (Melons)', icon: <Flame className="w-3.5 h-3.5 text-orange-600" /> },
  { id: 'reefs', label: 'Reefs (Rice)', icon: <Waves className="w-3.5 h-3.5 text-teal-600" /> },
];

export default function FastTravelDock() {
  const { currentBiome, setCurrentBiome, restoration } = useGameState();

  const handleWarp = (entry: BiomeDockEntry) => {
    sounds.playClick();
    setCurrentBiome(entry.id);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-1.5 p-1.5 bg-amber-50/95 backdrop-blur-md rounded-2xl border-2 border-amber-900/40 shadow-xl select-none text-stone-900">
      <div className="flex items-center gap-1 text-[11px] font-bold font-serif text-amber-950 px-2">
        <Compass className="w-3.5 h-3.5 text-emerald-700" />
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
                ? 'bg-amber-900 text-amber-50 shadow-md border-2 border-amber-950 font-serif'
                : 'bg-white hover:bg-amber-100/70 text-stone-700 hover:text-stone-900 border border-amber-200'
            }`}
          >
            <span>{entry.icon}</span>
            <span className="hidden lg:inline">{entry.label}</span>
            {isFlourished && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}
