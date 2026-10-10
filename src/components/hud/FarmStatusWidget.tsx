'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { FARM_CROPS } from '@/data/animals';
import { BiomeId } from '@/types/game';
import { sounds } from '@/utils/soundEffects';
import { ChevronDown, ChevronUp, CheckCircle2, ArrowRight, Home } from 'lucide-react';

export default function FarmStatusWidget() {
  const { restoration, setCurrentBiome } = useGameState();
  const [isExpanded, setIsExpanded] = useState(true);

  const cropKeys = Object.keys(FARM_CROPS) as (keyof typeof FARM_CROPS)[];
  const flourishingCount = cropKeys.filter((k) => (restoration[k] || 0) >= 80).length;

  return (
    <div className="absolute top-20 left-4 z-20 max-w-xs sm:max-w-sm select-none">
      <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-all">
        {/* Header Bar */}
        <div
          onClick={() => { sounds.playClick(); setIsExpanded(!isExpanded); }}
          className="p-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between cursor-pointer hover:bg-zinc-850 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Home className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-white tracking-wide">Central Bayer Farm</h3>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                  {flourishingCount}/6 Crops
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">Save each biome to revive failing crops</p>
            </div>
          </div>

          <button className="text-zinc-400 hover:text-white p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded Crops List */}
        {isExpanded && (
          <div className="p-3 space-y-2 max-h-[50vh] overflow-y-auto">
            {cropKeys.map((biomeKey) => {
              const crop = FARM_CROPS[biomeKey];
              const isFlourished = (restoration[biomeKey] || 0) >= 80;

              return (
                <div
                  key={biomeKey}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                    isFlourished
                      ? 'bg-emerald-950/30 border-emerald-500/50'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={isFlourished ? crop.icon : crop.deadIcon}
                      alt={crop.name}
                      className="w-10 h-10 object-contain rounded-lg border border-zinc-700 bg-zinc-950 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{crop.name}</span>
                        <span className="text-[9px] uppercase px-1 rounded bg-zinc-800 text-zinc-400 font-mono">
                          {biomeKey}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {isFlourished ? 'Thriving harvest!' : crop.crisisDescription}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isFlourished ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Flourishing</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setCurrentBiome(biomeKey as BiomeId);
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white transition-all shadow active:scale-95"
                      >
                        <span>Enter Biome</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
