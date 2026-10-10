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
    <div className="absolute top-16 left-3 z-20 max-w-xs sm:max-w-sm select-none font-pixel">
      <div className="pixel-panel shadow-2xl overflow-hidden transition-all text-[#2e1005]">
        {/* Header Bar - Pixel Farm Wood Plank */}
        <div
          onClick={() => { sounds.playClick(); setIsExpanded(!isExpanded); }}
          className="p-2.5 bg-[#5c2c16] border-b-4 border-[#2e1005] flex items-center justify-between cursor-pointer hover:bg-[#6d330c] transition-colors shadow-sm text-[#fffbeb]"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#78350f] border-2 border-[#fde68a] flex items-center justify-center">
              <Home className="w-3.5 h-3.5 text-[#fde68a]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-[10px] font-pixel-heading text-[#fde68a]">
                  CENTRAL FARM
                </h3>
                <span className="text-[8px] px-1 py-0.5 bg-[#15803d] border border-[#86efac] text-[#fffbeb] font-bold">
                  {flourishingCount}/6 CROPS
                </span>
              </div>
              <p className="text-[7.5px] text-[#fde68a]/80">Save biomes to revive crops</p>
            </div>
          </div>

          <button className="text-[#fde68a] hover:text-white p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded Crops List */}
        {isExpanded && (
          <div className="p-2 space-y-1.5 max-h-[46vh] overflow-y-auto bg-[#fcf6e8]">
            {cropKeys.map((biomeKey) => {
              const crop = FARM_CROPS[biomeKey];
              const isFlourished = (restoration[biomeKey] || 0) >= 80;

              return (
                <div
                  key={biomeKey}
                  className={`p-2 pixel-card transition-all flex items-center justify-between gap-2 ${
                    isFlourished
                      ? 'bg-[#f0fdf4] border-[#15803d]'
                      : 'bg-[#fffbf2] border-[#5c2c16] hover:border-[#b45309]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={isFlourished ? crop.icon : crop.deadIcon}
                      alt={crop.name}
                      className="w-8 h-8 object-contain border-2 border-[#5c2c16] bg-[#fef3c7] flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[9.5px] font-bold text-[#2e1005] truncate">
                          {crop.name}
                        </span>
                        <span className="text-[7.5px] uppercase px-1 bg-[#fef08a] text-[#854d0e] border border-[#ca8a04]">
                          {biomeKey}
                        </span>
                      </div>
                      <p className="text-[7.5px] text-[#78350f] truncate">
                        {isFlourished ? '✓ Thriving harvest!' : crop.crisisDescription}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isFlourished ? (
                      <span className="flex items-center gap-0.5 text-[8px] font-bold text-[#15803d] px-1.5 py-0.5 bg-[#dcfce7] border border-[#16a34a]">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>SAVED</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setCurrentBiome(biomeKey as BiomeId);
                        }}
                        className="pixel-btn flex items-center gap-1 text-[8px] px-2 py-0.5 font-bold"
                      >
                        <span>GO</span>
                        <ArrowRight className="w-2.5 h-2.5 text-[#fde68a]" />
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
