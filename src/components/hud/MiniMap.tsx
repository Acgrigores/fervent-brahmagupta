'use client';

import React from 'react';
import { useGameState } from '@/context/GameStateContext';
import { BiomeId } from '@/types/game';
import { MapPin } from 'lucide-react';

export default function MiniMap() {
  const { currentBiome, restoration } = useGameState();

  const biomes: { id: BiomeId; label: string; x: string; y: string; color: string }[] = [
    { id: 'clearing', label: 'Ground Zero', x: '50%', y: '50%', color: '#ef4444' },
    { id: 'forest', label: 'Forest', x: '22%', y: '25%', color: '#16a34a' },
    { id: 'lake', label: 'Lake', x: '22%', y: '75%', color: '#0284c7' },
    { id: 'tundra', label: 'Tundra', x: '50%', y: '18%', color: '#38bdf8' },
    { id: 'grasslands', label: 'Farmland', x: '78%', y: '75%', color: '#eab308' },
    { id: 'desert', label: 'Desert', x: '80%', y: '42%', color: '#f97316' },
    { id: 'reefs', label: 'Reefs', x: '50%', y: '82%', color: '#06b6d4' },
  ];

  return (
    <div className="absolute top-4 right-4 z-20 hidden lg:block bg-zinc-950/85 backdrop-blur-md border border-zinc-800 rounded-2xl p-3 shadow-2xl select-none w-52">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span>Biome Radar</span>
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">3200x2400</span>
      </div>

      {/* Radar Map Graphic */}
      <div className="relative w-full h-36 bg-zinc-900 rounded-xl border border-zinc-800/80 overflow-hidden">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />

        {/* Biome nodes */}
        {biomes.map((b) => {
          const isCurrent = currentBiome === b.id;
          const isFlourished = (restoration[b.id] || 0) >= 80;

          return (
            <div
              key={b.id}
              style={{ left: b.x, top: b.y }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                  isCurrent ? 'ring-2 ring-white scale-125' : ''
                }`}
                style={{
                  backgroundColor: isFlourished ? '#22c55e' : b.color,
                  boxShadow: isCurrent ? '0 0 10px #ffffff' : 'none',
                }}
              >
                {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
              </div>
              <span className="text-[9px] text-zinc-300 font-mono mt-0.5 leading-none drop-shadow">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
