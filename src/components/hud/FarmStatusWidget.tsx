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
      <div className="bg-amber-50/95 backdrop-blur-md border-2 border-amber-900/40 rounded-2xl shadow-xl overflow-hidden transition-all text-stone-900">
        {/* Header Bar - Vintage Wooden Sign Plaque */}
        <div
          onClick={() => { sounds.playClick(); setIsExpanded(!isExpanded); }}
          className="p-3 bg-amber-900 border-b-2 border-amber-950 flex items-center justify-between cursor-pointer hover:bg-amber-850 transition-colors shadow-sm text-amber-50"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-950 border border-amber-700 flex items-center justify-center shadow-inner">
              <Home className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold font-serif tracking-wide text-amber-100">
                  Central Bayer Farm
                </h3>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-900 text-emerald-200 border border-emerald-600">
                  {flourishingCount}/6 Crops
                </span>
              </div>
              <p className="text-[10px] text-amber-200/80">Save biomes to revive failing crops</p>
            </div>
          </div>

          <button className="text-amber-200 hover:text-white p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded Crops List */}
        {isExpanded && (
          <div className="p-3 space-y-2 max-h-[50vh] overflow-y-auto bg-amber-50/80">
            {cropKeys.map((biomeKey) => {
              const crop = FARM_CROPS[biomeKey];
              const isFlourished = (restoration[biomeKey] || 0) >= 80;

              return (
                <div
                  key={biomeKey}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                    isFlourished
                      ? 'bg-emerald-50/90 border-emerald-300 shadow-sm'
                      : 'bg-white border-amber-200 hover:border-amber-400 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={isFlourished ? crop.icon : crop.deadIcon}
                      alt={crop.name}
                      className="w-10 h-10 object-contain rounded-lg border border-amber-200 bg-amber-50/50 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-900 truncate font-serif">
                          {crop.name}
                        </span>
                        <span className="text-[9px] uppercase px-1 rounded bg-stone-100 text-stone-600 border border-stone-200 font-mono">
                          {biomeKey}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-600 truncate">
                        {isFlourished ? 'Thriving harvest!' : crop.crisisDescription}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isFlourished ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Flourishing</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setCurrentBiome(biomeKey as BiomeId);
                        }}
                        className="flex items-center gap-1 text-[10px] font-serif font-bold px-2 py-1 rounded-lg bg-amber-800 hover:bg-amber-700 text-amber-50 border border-amber-950 transition-all shadow-sm active:scale-95"
                      >
                        <span>Enter Biome</span>
                        <ArrowRight className="w-3 h-3 text-amber-300" />
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
