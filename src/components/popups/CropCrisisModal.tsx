'use client';

import React from 'react';
import { useGameState } from '@/context/GameStateContext';
import { FARM_CROPS, ANIMALS, BIOMES_INFO } from '@/data/animals';
import { sounds } from '@/utils/soundEffects';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sprout,
  MapPin,
  ShieldAlert,
} from 'lucide-react';

export default function CropCrisisModal() {
  const {
    activeCropModal,
    closeCropModal,
    restoration,
    setCurrentBiome,
    cropPlots,
    harvestCrop,
    forceGrowCrop,
  } = useGameState();

  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!activeCropModal) return null;

  const crop = FARM_CROPS[activeCropModal];
  if (!crop) return null;

  const currentRestoration = restoration[activeCropModal] || 0;
  const isFlourished = currentRestoration >= 80;
  const currentPlot = cropPlots[activeCropModal] || { status: isFlourished ? 'grown' : 'crisis', growDurationMs: 20 * 60 * 1000, harvestCount: 0 };
  const isGrowing = currentPlot.status === 'growing';
  const guardianAnimal = crop.guardianAnimalId ? ANIMALS[crop.guardianAnimalId] : null;
  const biomeInfo = BIOMES_INFO[activeCropModal];

  const timeRemainingMs = isGrowing && currentPlot.plantedAt
    ? Math.max(0, currentPlot.growDurationMs - (now - currentPlot.plantedAt))
    : 0;
  const minutesLeft = Math.floor(timeRemainingMs / 60000);
  const secondsLeft = Math.floor((timeRemainingMs % 60000) / 1000);
  const formattedTime = `${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
  const growProgressPercent = isGrowing && currentPlot.plantedAt
    ? Math.min(100, Math.round(((now - currentPlot.plantedAt) / currentPlot.growDurationMs) * 100))
    : 100;

  const handleHarvest = () => {
    sounds.playBloom();
    harvestCrop(activeCropModal);
  };

  const handleTravelToBiome = () => {
    sounds.playBloom();
    closeCropModal();
    setCurrentBiome(activeCropModal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/75 backdrop-blur-sm animate-in fade-in duration-200 font-pixel">
      <div className="relative w-full max-w-xl pixel-panel overflow-hidden text-[#2e1005] shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header - Retro Wooden Plank */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#78350f] border-2 border-[#fde68a] flex items-center justify-center p-1 shadow-inner">
              <img
                src={isFlourished ? crop.icon : crop.deadIcon}
                alt={crop.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-pixel-heading text-xs sm:text-sm text-[#fde68a] tracking-wider">
                  {crop.name.toUpperCase()}
                </h3>
              </div>
              <p className="text-[8.5px] sm:text-[9.5px] text-[#fde68a]/80 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#fde68a]" />
                <span>Central Farm Plot • Sourced by {biomeInfo.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              closeCropModal();
            }}
            className="p-1 pixel-btn-red text-[10px]"
            title="Close Crop Info"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto text-[9.5px] leading-relaxed text-[#451a03] bg-[#fcf6e8]">
          {/* Status Alert Banner */}
          {isGrowing ? (
            <div className="p-3 pixel-card bg-[#fefce8] border-[#ca8a04] flex flex-col gap-2 text-[#713f12]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#fef08a] border border-[#eab308] flex items-center justify-center flex-shrink-0">
                  <Sprout className="w-5 h-5 text-[#a16207]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[10px] text-[#a16207] uppercase flex items-center gap-1.5 justify-between">
                    <span>🌱 STATUS: BABY SPROUTS (GROWING)</span>
                    <span className="text-[8.5px] px-1.5 py-0.5 bg-[#fef08a] text-[#854d0e] font-mono font-bold border border-[#ca8a04]">
                      ⏳ {formattedTime} LEFT
                    </span>
                  </div>
                  <p className="text-[8.5px] text-[#854d0e] mt-0.5">
                    Re-planted baby version! Takes 20 minutes to reach full maturity.
                  </p>
                </div>
              </div>
              <div className="w-full bg-[#fef08a] h-2.5 border border-[#ca8a04] p-0.5 mt-1">
                <div
                  className="h-full bg-gradient-to-r from-[#eab308] to-[#22c55e] transition-all duration-300"
                  style={{ width: `${growProgressPercent}%` }}
                />
              </div>
            </div>
          ) : isFlourished ? (
            <div className="p-3 pixel-card bg-[#f0fdf4] border-[#15803d] flex items-center gap-3 text-[#14532d]">
              <div className="w-8 h-8 bg-[#dcfce7] border border-[#16a34a] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#15803d]" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-[10px] text-[#15803d] uppercase flex items-center gap-1.5">
                  <span>✓ STATUS: GROWN VERSION - READY FOR HARVEST!</span>
                  <span className="text-[8px] px-1 bg-[#86efac] text-[#064e3b]">
                    {currentRestoration}% RESTORED
                  </span>
                </div>
                <p className="text-[8.5px] text-[#166534] mt-0.5">
                  {crop.flourishDescription} Harvest to produce grown crop and re-plant baby sprouts!
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 pixel-card bg-[#fef2f2] border-[#dc2626] flex items-center gap-3 text-[#7f1d1d]">
              <div className="w-8 h-8 bg-[#fee2e2] border border-[#ef4444] flex items-center justify-center flex-shrink-0 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-[#dc2626]" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-[10px] text-[#dc2626] uppercase flex items-center gap-1.5">
                  <span>⚠ STATUS: CRITICAL - CROP IS DYING</span>
                  <span className="text-[8px] px-1 bg-[#fca5a5] text-[#7f1d1d]">
                    {currentRestoration}% HEALTH
                  </span>
                </div>
                <p className="text-[8.5px] text-[#991b1b] mt-0.5">
                  Severe crisis in the {biomeInfo.name} is starving this crop!
                </p>
              </div>
            </div>
          )}

          {/* Visual Pair: Crop Status & Wildlife Guardian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Crop Card */}
            <div className="p-3 pixel-card bg-[#fffbf2] border-[#5c2c16] flex items-center gap-3">
              <img
                src={isGrowing ? '/assets/crops/crop_baby.png' : (isFlourished ? (crop.produceIcon || crop.icon) : crop.deadIcon)}
                alt={crop.name}
                className="w-12 h-12 object-contain border-2 border-[#5c2c16] bg-[#fef3c7] p-1 flex-shrink-0 shadow-sm"
              />
              <div className="min-w-0">
                <div className="text-[8px] text-[#78350f] uppercase font-bold">
                  {isGrowing ? '🌱 Baby Sprouts (20m)' : (isFlourished ? '🌾 Grown Crop Produce' : '⚠ Withered Crop')}
                </div>
                <div className="font-bold text-[10px] text-[#2e1005] truncate">{crop.name}</div>
                <div className="text-[8px] text-[#15803d] font-bold mt-0.5">
                  Yield: {crop.yieldMultiplier}x Multiplier
                </div>
              </div>
            </div>

            {/* Wildlife Guardian Card */}
            {guardianAnimal && (
              <div className="p-3 pixel-card bg-[#fffbf2] border-[#5c2c16] flex items-center gap-3">
                <img
                  src={guardianAnimal.avatar}
                  alt={guardianAnimal.name}
                  className="w-12 h-12 object-cover border-2 border-[#5c2c16] bg-[#fed7aa] flex-shrink-0 shadow-sm"
                />
                <div className="min-w-0">
                  <div className="text-[8px] text-[#78350f] uppercase font-bold">Ecosystem Guardian</div>
                  <div className="font-bold text-[10px] text-[#2e1005] truncate">
                    {guardianAnimal.name}
                  </div>
                  <div className="text-[8px] text-[#b45309] truncate">
                    {guardianAnimal.species}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Core Explanation: WHY THE CROP IS DYING */}
          <div className="p-3.5 pixel-card bg-[#fffdfa] border-2 border-[#b45309] space-y-2">
            <div className="flex items-center gap-2 border-b border-[#d97706]/30 pb-1.5">
              <ShieldAlert className="w-4 h-4 text-[#dc2626]" />
              <h4 className="font-bold text-[#78350f] uppercase text-[10px]">
                {isFlourished ? 'ECOLOGICAL HEALING ACHIEVED:' : 'WHY THIS CROP IS DYING:'}
              </h4>
            </div>

            {crop.crisisHeadline && (
              <div className="font-bold text-[#b91c1c] text-[9.5px]">
                {isFlourished ? '✓ Balanced Ecosystem & Regenerative Farmland' : crop.crisisHeadline}
              </div>
            )}

            <p className="text-[#451a03] leading-relaxed text-[9px]">
              {isFlourished ? crop.flourishDescription : (crop.detailedCrisisReason || crop.crisisDescription)}
            </p>

            {crop.threatFactors && crop.threatFactors.length > 0 && !isFlourished && (
              <div className="mt-2 space-y-1 bg-[#fefce8] p-2 border border-[#fde68a]">
                <div className="font-bold text-[#854d0e] text-[8px] uppercase">Direct Causes:</div>
                {crop.threatFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[8px] text-[#78350f]">
                    <span className="text-[#dc2626] font-bold">•</span>
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HOW TO RESTORE IT / HARVEST GUIDE */}
          <div className="p-3 pixel-card bg-[#f0fdf4] border-[#15803d] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#15803d] font-bold text-[9.5px] uppercase">
              <Sprout className="w-3.5 h-3.5" />
              <span>{isFlourished ? 'HARVEST & MARKET SALES:' : 'HOW TO SAVE THIS CROP:'}</span>
            </div>
            <p className="text-[8.5px] text-[#14532d] leading-relaxed">
              {isFlourished ? (
                'Harvesting yields grown produce and automatically re-plants baby sprouts taking 20 minutes to grow. When you harvest, a visiting merchant sprite will walk up the farm path to purchase your crop for coins!'
              ) : (
                crop.restorationSolution ||
                `Travel to ${biomeInfo.name} and meet ${guardianAnimal?.name || 'the animal guardian'} to complete ecological restoration actions.`
              )}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t-4 border-[#2e1005] bg-[#5c2c16] flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0">
          <button
            onClick={() => {
              sounds.playClick();
              closeCropModal();
            }}
            className="pixel-btn px-3 py-2 text-[9px] font-bold text-[#fde68a]"
          >
            STAY IN FARM
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {!isFlourished ? (
              <button
                onClick={handleTravelToBiome}
                className="pixel-btn px-4 py-2 text-[10px] font-bold text-[#fde68a] flex items-center gap-1.5"
              >
                <span>TRAVEL TO {biomeInfo.name.toUpperCase()}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : isGrowing ? (
              <>
                <button
                  onClick={() => forceGrowCrop(activeCropModal)}
                  className="pixel-btn px-3.5 py-2 text-[9px] font-bold text-[#fde68a] flex items-center gap-1"
                  title="Skip remaining time for demo"
                >
                  <span>⚡ SKIP 20M (DEMO)</span>
                </button>

                <button
                  onClick={handleTravelToBiome}
                  className="pixel-btn-green px-4 py-2 text-[10px] font-bold flex items-center gap-1.5"
                >
                  <span>VISIT {biomeInfo.name.toUpperCase()}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={handleHarvest}
                className="pixel-btn-green px-6 py-2.5 text-[11px] font-bold flex items-center gap-2 shadow-lg"
              >
                <span>🌾 HARVEST CROP (+50 COINS)</span>
                <ArrowRight className="w-4 h-4 text-[#86efac]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
