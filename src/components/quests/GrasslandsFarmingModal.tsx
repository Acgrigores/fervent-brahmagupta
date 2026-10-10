'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { X, CheckCircle, Sparkles, Sliders, Wheat, HeartHandshake } from 'lucide-react';

export default function GrasslandsFarmingModal() {
  const { activeQuestModal, closeQuestModal, completeQuest } = useGameState();

  // Smart farming simulation toggles
  const [noTill, setNoTill] = useState(false);
  const [precisionIrrigation, setPrecisionIrrigation] = useState(false);
  const [pollinatorCorridor, setPollinatorCorridor] = useState(false);
  const [biologicalCropProtection, setBiologicalCropProtection] = useState(false);
  const [isPetitionSigned, setIsPetitionSigned] = useState(false);

  if (activeQuestModal !== 'grasslands_farming') return null;

  // Calculate scores
  const activeCount = [noTill, precisionIrrigation, pollinatorCorridor, biologicalCropProtection].filter(Boolean).length;
  const yieldScore = 60 + (noTill ? 10 : 0) + (precisionIrrigation ? 18 : 0) + (biologicalCropProtection ? 12 : 0);
  const biodiversityScore = 20 + (noTill ? 20 : 0) + (precisionIrrigation ? 15 : 0) + (pollinatorCorridor ? 35 : 0) + (biologicalCropProtection ? 10 : 0);
  const carbonStorage = (noTill ? 220 : 0) + (pollinatorCorridor ? 140 : 0);

  const isBalanced = activeCount === 4;

  const handleApplyStrategy = () => {
    if (!isBalanced || isPetitionSigned) return;
    sounds.playCoin();
    setIsPetitionSigned(true);

    completeQuest(
      'quest_grasslands',
      'Configured Bayer Smart Farming precision agriculture and signed petition supporting regenerative farmer subsidies. Achieved 100% yield security and blooming monarch pollinator corridors.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel">
      <div className="relative w-full max-w-2xl pixel-panel overflow-hidden text-[#2e1005] shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header - Pixel Farm Wood Banner */}
        <div className="flex items-center justify-between p-3.5 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌻</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-pixel-heading text-xs text-[#fde68a] tracking-wider">SMART FARMING SIMULATOR</h3>
                <span className="text-[7.5px] font-bold px-1.5 py-0.2 bg-[#3e1a06] text-[#fde68a] border border-[#fde68a]">
                  BAYER AG
                </span>
              </div>
              <p className="text-[9px] text-[#fde68a]/80 mt-0.5">Regenerative Farmlands • Support Aura the Monarch</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1 pixel-btn-red"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* Introduction */}
          <div className="pixel-card p-3 bg-[#fefce8] text-[9.5px] text-[#5c2c16] leading-relaxed">
            <p>
              Agriculture feeds 8 billion people, but traditional monoculture depletes topsoil.
              <strong className="text-[#2e1005]"> Bayer Smart Farming & Precision Ag</strong> empowers farmers to harvest maximum crops while regenerating soil biology and providing native pollinator corridors!
            </p>
          </div>

          {/* Interactive Strategy Configuration */}
          <div className="space-y-2">
            <h4 className="text-[9.5px] font-pixel-heading text-[#2e1005] uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#b45309]" />
              <span>SELECT REGENERATIVE INNOVATIONS:</span>
            </h4>

            {/* Toggle 1: No-Till & Cover Crops */}
            <div
              onClick={() => { sounds.playClick(); setNoTill(!noTill); }}
              className={`p-3 border-2 cursor-pointer transition-all flex items-center justify-between shadow-[2px_2px_0px_#2e1005] ${
                noTill
                  ? 'bg-[#dcfce7] border-[#15803d] text-[#14532d]'
                  : 'bg-[#fffbf2] border-[#5c2c16] text-[#5c2c16] hover:bg-[#fde68a]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🌾</span>
                <div>
                  <div className="text-[9.5px] font-pixel-heading text-[#2e1005]">NO-TILL & CLOVER COVER CROPS</div>
                  <div className="text-[8.5px] text-[#5c2c16]">Keeps root networks intact, prevents topsoil erosion, stores 220kg CO2/ac</div>
                </div>
              </div>
              <div className={`w-5 h-5 border-2 flex items-center justify-center ${noTill ? 'bg-[#15803d] border-[#14532d]' : 'border-[#5c2c16] bg-white'}`}>
                {noTill && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
            </div>

            {/* Toggle 2: Precision Drip Irrigation */}
            <div
              onClick={() => { sounds.playClick(); setPrecisionIrrigation(!precisionIrrigation); }}
              className={`p-3 border-2 cursor-pointer transition-all flex items-center justify-between shadow-[2px_2px_0px_#2e1005] ${
                precisionIrrigation
                  ? 'bg-[#dcfce7] border-[#15803d] text-[#14532d]'
                  : 'bg-[#fffbf2] border-[#5c2c16] text-[#5c2c16] hover:bg-[#fde68a]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🛰️</span>
                <div>
                  <div className="text-[9.5px] font-pixel-heading text-[#2e1005]">SATELLITE SOIL MOISTURE & DRIP</div>
                  <div className="text-[8.5px] text-[#5c2c16]">Saves 65% water with AI moisture maps, stops runoff</div>
                </div>
              </div>
              <div className={`w-5 h-5 border-2 flex items-center justify-center ${precisionIrrigation ? 'bg-[#15803d] border-[#14532d]' : 'border-[#5c2c16] bg-white'}`}>
                {precisionIrrigation && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
            </div>

            {/* Toggle 3: Pollinator Buffer Corridors */}
            <div
              onClick={() => { sounds.playClick(); setPollinatorCorridor(!pollinatorCorridor); }}
              className={`p-3 border-2 cursor-pointer transition-all flex items-center justify-between shadow-[2px_2px_0px_#2e1005] ${
                pollinatorCorridor
                  ? 'bg-[#dcfce7] border-[#15803d] text-[#14532d]'
                  : 'bg-[#fffbf2] border-[#5c2c16] text-[#5c2c16] hover:bg-[#fde68a]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🦋</span>
                <div>
                  <div className="text-[9.5px] font-pixel-heading text-[#2e1005]">15% MILKWEED & WILDFLOWER STRIPS</div>
                  <div className="text-[8.5px] text-[#5c2c16]">Provides critical nectar shelters for migrating Monarch butterflies</div>
                </div>
              </div>
              <div className={`w-5 h-5 border-2 flex items-center justify-center ${pollinatorCorridor ? 'bg-[#15803d] border-[#14532d]' : 'border-[#5c2c16] bg-white'}`}>
                {pollinatorCorridor && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
            </div>

            {/* Toggle 4: Targeted Bio-Protection */}
            <div
              onClick={() => { sounds.playClick(); setBiologicalCropProtection(!biologicalCropProtection); }}
              className={`p-3 border-2 cursor-pointer transition-all flex items-center justify-between shadow-[2px_2px_0px_#2e1005] ${
                biologicalCropProtection
                  ? 'bg-[#dcfce7] border-[#15803d] text-[#14532d]'
                  : 'bg-[#fffbf2] border-[#5c2c16] text-[#5c2c16] hover:bg-[#fde68a]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🧪</span>
                <div>
                  <div className="text-[9.5px] font-pixel-heading text-[#2e1005]">PRECISION BIO-CROP PROTECTION</div>
                  <div className="text-[8.5px] text-[#5c2c16]">Protects crops from blight while eliminating chemical drift</div>
                </div>
              </div>
              <div className={`w-5 h-5 border-2 flex items-center justify-center ${biologicalCropProtection ? 'bg-[#15803d] border-[#14532d]' : 'border-[#5c2c16] bg-white'}`}>
                {biologicalCropProtection && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
            </div>
          </div>

          {/* Real-Time Outcome Gauges */}
          <div className="grid grid-cols-3 gap-2.5 p-3 pixel-card bg-[#fffbf2]">
            <div className="text-center">
              <div className="text-[8.5px] text-[#5c2c16] font-bold">CROP YIELD</div>
              <div className="text-xs font-pixel-heading text-[#b45309] mt-0.5">{yieldScore}%</div>
              <div className="text-[7.5px] text-[#78350f]">Food Security</div>
            </div>

            <div className="text-center">
              <div className="text-[8.5px] text-[#5c2c16] font-bold">BIODIVERSITY</div>
              <div className="text-xs font-pixel-heading text-[#15803d] mt-0.5">{biodiversityScore}%</div>
              <div className="text-[7.5px] text-[#78350f]">Monarch Shelters</div>
            </div>

            <div className="text-center">
              <div className="text-[8.5px] text-[#5c2c16] font-bold">CARBON CAPTURE</div>
              <div className="text-xs font-pixel-heading text-[#0284c7] mt-0.5">+{carbonStorage} kg</div>
              <div className="text-[7.5px] text-[#78350f]">Soil Sequestration</div>
            </div>
          </div>

          {/* Farmer Support Advocacy Action */}
          <div className="p-3.5 pixel-card bg-[#fefce8] space-y-2">
            <h5 className="text-[9.5px] font-pixel-heading text-[#2e1005] flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-[#b45309]" />
              <span>SUBSIDIZE REGENERATIVE FAMILY FARMS</span>
            </h5>
            <p className="text-[9px] text-[#5c2c16] leading-relaxed">
              Transitioning to precision tools has upfront costs. By signing this resolution, you support granting $2.5M in regional precision ag credits to family farms adopting pollinator margins!
            </p>

            {!isPetitionSigned ? (
              <button
                onClick={handleApplyStrategy}
                disabled={!isBalanced}
                className="w-full py-2 pixel-btn flex items-center justify-center gap-2 text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wheat className="w-4 h-4" />
                <span>
                  {isBalanced
                    ? 'SIGN RESOLUTION & COMPLETE QUEST'
                    : 'ENABLE ALL 4 INNOVATIONS TO BALANCE!'}
                </span>
              </button>
            ) : (
              <div className="p-2.5 border-2 border-[#15803d] bg-[#dcfce7] text-center text-[9px] text-[#14532d] font-bold">
                🎉 Resolution signed & Smart Farm online! The grasslands are flourishing with golden wheat and monarchs!
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t-2 border-[#5c2c16] flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[9.5px] text-[#15803d] font-bold">
              <Sparkles className="w-4 h-4 text-[#16a34a]" /> REWARD: +450 COINS & 100% FLOURISH
            </span>
            {isPetitionSigned ? (
              <button
                onClick={closeQuestModal}
                className="px-4 py-2 pixel-btn-green text-[10px]"
              >
                BACK TO WORLD
              </button>
            ) : (
              <button
                onClick={closeQuestModal}
                className="px-3 py-1.5 pixel-btn text-[10px]"
              >
                CANCEL
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
