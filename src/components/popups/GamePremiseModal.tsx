'use client';

import React from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import {
  X,
  Sparkles,
  Compass,
  Sprout,
  ShieldAlert,
  ArrowRight,
  Droplets,
  Flame,
  Snowflake,
  Sun,
  Waves,
} from 'lucide-react';

export default function GamePremiseModal() {
  const { isPremiseOpen, closePremiseModal } = useGameState();

  if (!isPremiseOpen) return null;

  const handleStart = () => {
    sounds.playBloom();
    closePremiseModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/75 backdrop-blur-sm animate-in fade-in duration-200 font-pixel">
      <div className="relative w-full max-w-2xl pixel-panel overflow-hidden text-[#2e1005] shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header - Retro Wooden Plank */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#78350f] border-2 border-[#fde68a] flex items-center justify-center shadow-inner">
              <Sprout className="w-5 h-5 text-[#86efac]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-pixel-heading text-xs sm:text-sm text-[#fde68a] tracking-wider">
                  SOW GOOD: BLOOM
                </h2>
                <span className="hidden sm:inline-block text-[8px] px-1.5 py-0.5 bg-[#15803d] border border-[#86efac] text-white font-bold uppercase">
                  ECO-MISSION
                </span>
              </div>
              <p className="text-[8.5px] sm:text-[9.5px] text-[#fde68a]/80 mt-0.5">
                The Central Farm Crisis • Eco-Restoration RPG
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              closePremiseModal();
            }}
            className="p-1 pixel-btn-red text-[10px]"
            title="Close Premise"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Story Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-[9.5px] leading-relaxed text-[#451a03] bg-[#fcf6e8]">
          {/* Narrative Hero Banner */}
          <div className="p-3.5 pixel-card bg-gradient-to-br from-[#fef3c7] via-[#fffbeb] to-[#fef08a] border-2 border-[#b45309] shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🌾</span>
              <div>
                <h3 className="font-pixel-heading text-[10.5px] text-[#92400e] mb-1">
                  THE PREMISE: A DYING FARM, A BROKEN PLANET
                </h3>
                <p className="text-[#5c2c16] text-[9px] leading-relaxed">
                  Welcome to the <strong>Central Eco-Farm</strong>. Once a vibrant heartland feeding communities and sustaining nature, 
                  the farm is now on the brink of complete agricultural collapse. 
                  Surrounding environmental disasters—toxic watershed runoff, catastrophic wildfires, coal soot fallout, 
                  pollinator extinction, severe drought, and marine pollution—have severed the planet&apos;s life-support cycles.
                </p>
                <div className="mt-2 p-2 bg-[#fef2f2] border border-[#ef4444] text-[#991b1b] flex items-center gap-2 text-[8.5px] font-bold">
                  <ShieldAlert className="w-4 h-4 text-[#dc2626] flex-shrink-0" />
                  <span>
                    URGENT: All 6 vital central farm crops are withering and dying from crises in neighboring biomes!
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Biomes & Dying Crops Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-[#78350f] uppercase flex items-center gap-1.5 text-[9.5px]">
                <ShieldAlert className="w-3.5 h-3.5 text-[#dc2626]" />
                <span>6 ECOSYSTEM CRISES & FAILING CROPS</span>
              </h4>
              <span className="text-[8px] text-[#78350f]/80">Save biomes to revive crops</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Lake */}
              <div className="p-2 pixel-card bg-[#f0f9ff] border-[#0284c7] flex items-center gap-2">
                <div className="w-7 h-7 bg-[#0284c7]/20 border border-[#0284c7] flex items-center justify-center flex-shrink-0">
                  <Droplets className="w-4 h-4 text-[#0284c7]" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[#0369a1] text-[9px] truncate">
                    Golden Sweet Corn ↔ Lake
                  </div>
                  <p className="text-[8px] text-[#0c4a6e] truncate">
                    Dying from microplastics & toxic algae blooms
                  </p>
                </div>
              </div>

              {/* Forest */}
              <div className="p-2 pixel-card bg-[#f0fdf4] border-[#16a34a] flex items-center gap-2">
                <div className="w-7 h-7 bg-[#16a34a]/20 border border-[#16a34a] flex items-center justify-center flex-shrink-0">
                  <Flame className="w-4 h-4 text-[#ea580c]" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[#15803d] text-[9px] truncate">
                    Apple Orchard ↔ Canopy Forest
                  </div>
                  <p className="text-[8px] text-[#14532d] truncate">
                    Suffocated by wildfire smoke & charred blossoms
                  </p>
                </div>
              </div>

              {/* Tundra */}
              <div className="p-2 pixel-card bg-[#f0fdfa] border-[#0891b2] flex items-center gap-2">
                <div className="w-7 h-7 bg-[#0891b2]/20 border border-[#0891b2] flex items-center justify-center flex-shrink-0">
                  <Snowflake className="w-4 h-4 text-[#0284c7]" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[#0e7490] text-[9px] truncate">
                    Winter Wheat ↔ Glacial Tundra
                  </div>
                  <p className="text-[8px] text-[#164e63] truncate">
                    Frozen in coal soot fallout & toxic black ice
                  </p>
                </div>
              </div>

              {/* Grasslands */}
              <div className="p-2 pixel-card bg-[#fefce8] border-[#ca8a04] flex items-center gap-2">
                <div className="w-7 h-7 bg-[#ca8a04]/20 border border-[#ca8a04] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-[#ca8a04]" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[#a16207] text-[9px] truncate">
                    Sunflowers ↔ Smart Prairie
                  </div>
                  <p className="text-[8px] text-[#713f12] truncate">
                    Barren from milkweed loss & pollinator collapse
                  </p>
                </div>
              </div>

              {/* Desert */}
              <div className="p-2 pixel-card bg-[#fff7ed] border-[#ea580c] flex items-center gap-2">
                <div className="w-7 h-7 bg-[#ea580c]/20 border border-[#ea580c] flex items-center justify-center flex-shrink-0">
                  <Sun className="w-4 h-4 text-[#ea580c]" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[#c2410c] text-[9px] truncate">
                    Sugar Melons ↔ Savanna Oasis
                  </div>
                  <p className="text-[8px] text-[#7c2d12] truncate">
                    Parched into dust bowls by aquifer depletion
                  </p>
                </div>
              </div>

              {/* Reefs */}
              <div className="p-2 pixel-card bg-[#ecfeff] border-[#06b6d4] flex items-center gap-2">
                <div className="w-7 h-7 bg-[#06b6d4]/20 border border-[#06b6d4] flex items-center justify-center flex-shrink-0">
                  <Waves className="w-4 h-4 text-[#06b6d4]" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[#0e7490] text-[9px] truncate">
                    Tidal Rice ↔ Coral Barrier
                  </div>
                  <p className="text-[8px] text-[#155e75] truncate">
                    Poisoned by speedboat wakes & fuel spills
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Your 4-Step Objective */}
          <div className="p-3 pixel-card bg-[#fffbf2] border-[#5c2c16]">
            <h4 className="font-bold text-[#78350f] uppercase mb-2 flex items-center gap-1.5 text-[9.5px]">
              <Compass className="w-3.5 h-3.5 text-[#b45309]" />
              <span>YOUR RESTORATION MISSION:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[8.5px] text-[#5c2c16]">
              <div className="p-2 bg-[#fefce8] border border-[#fde68a]">
                <strong>1. INSPECT CROPS:</strong> Click any crop in the Central Farm to see why it is dying and jump to its biome.
              </div>
              <div className="p-2 bg-[#fefce8] border border-[#fde68a]">
                <strong>2. JOURNEY TO BIOMES:</strong> Walk through road gates or use the Mini-Map to reach the 6 crisis zones.
              </div>
              <div className="p-2 bg-[#fefce8] border border-[#fde68a]">
                <strong>3. TALK WITH ANIMALS:</strong> Consult with endangered wildlife guardians to discover actionable solutions.
              </div>
              <div className="p-2 bg-[#fefce8] border border-[#fde68a]">
                <strong>4. BLOOM THE PLANET:</strong> Quench fires, sort waste, petition coal plants, and deploy smart farming to revive crops!
              </div>
            </div>
          </div>

          {/* Controls Mini-Bar */}
          <div className="p-2.5 bg-[#fef3c7] border-2 border-[#d97706] text-[#78350f] flex flex-wrap items-center justify-between gap-2 text-[8px]">
            <div>
              <span className="font-bold">CONTROLS:</span> Use <strong>Arrow Keys / WASD</strong> or <strong>Click Ground</strong> to walk.
            </div>
            <div>
              <strong>TIP:</strong> Click crops in the Central Farm anytime to check status!
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t-4 border-[#2e1005] bg-[#5c2c16] flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-[8px] text-[#fde68a]/80 text-center sm:text-left">
            <span>Re-open anytime by clicking the </span>
            <strong className="text-[#fde68a]">❓ Guide</strong>
            <span> button in the top HUD.</span>
          </div>

          <button
            onClick={handleStart}
            className="pixel-btn-green w-full sm:w-auto px-6 py-2.5 text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-2 tracking-wider"
          >
            <span>ENTER CENTRAL FARM & START RESTORING</span>
            <ArrowRight className="w-4 h-4 text-[#86efac]" />
          </button>
        </div>
      </div>
    </div>
  );
}
