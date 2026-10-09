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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌻</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Field to Future: Smart Farming Simulator</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700">
                  Powered by Bayer
                </span>
              </div>
              <p className="text-xs text-zinc-400">Regenerative Farmlands • Support Aura the Monarch Butterfly</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Introduction */}
        <div className="p-4 bg-gradient-to-r from-amber-950/60 via-zinc-900 to-emerald-950/60 border border-amber-600/40 rounded-2xl mb-5 text-xs text-zinc-200 leading-relaxed">
          <p>
            Agriculture feeds 8 billion people, but traditional monoculture depletes topsoil and destroys milkweed.
            <strong> Bayer Smart Farming & Precision Agriculture</strong> empowers farmers to harvest maximum crops while regenerating soil biology and providing native pollinator corridors!
          </p>
        </div>

        {/* Interactive Strategy Configuration */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Select Regenerative Smart Farming Innovations:</span>
          </h4>

          {/* Toggle 1: No-Till & Cover Crops */}
          <div
            onClick={() => { sounds.playClick(); setNoTill(!noTill); }}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              noTill
                ? 'bg-emerald-950/40 border-emerald-500 text-white'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌾</span>
              <div>
                <div className="text-xs font-bold text-zinc-100">Regenerative No-Till & Clover Cover Crops</div>
                <div className="text-[11px] text-zinc-400">Keeps root networks intact, prevents topsoil erosion, stores 220kg CO2/acre</div>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${noTill ? 'bg-emerald-500 border-emerald-400' : 'border-zinc-600'}`}>
              {noTill && <CheckCircle className="w-3.5 h-3.5 text-black" />}
            </div>
          </div>

          {/* Toggle 2: Precision Drip Irrigation */}
          <div
            onClick={() => { sounds.playClick(); setPrecisionIrrigation(!precisionIrrigation); }}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              precisionIrrigation
                ? 'bg-emerald-950/40 border-emerald-500 text-white'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛰️</span>
              <div>
                <div className="text-xs font-bold text-zinc-100">Satellite Soil Moisture & Precision Drip Irrigation</div>
                <div className="text-[11px] text-zinc-400">Saves 65% water using AI moisture maps and stops fertilizer runoff</div>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${precisionIrrigation ? 'bg-emerald-500 border-emerald-400' : 'border-zinc-600'}`}>
              {precisionIrrigation && <CheckCircle className="w-3.5 h-3.5 text-black" />}
            </div>
          </div>

          {/* Toggle 3: Pollinator Buffer Corridors */}
          <div
            onClick={() => { sounds.playClick(); setPollinatorCorridor(!pollinatorCorridor); }}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              pollinatorCorridor
                ? 'bg-emerald-950/40 border-emerald-500 text-white'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🦋</span>
              <div>
                <div className="text-xs font-bold text-zinc-100">15% Field Margin Native Milkweed & Wildflower Strips</div>
                <div className="text-[11px] text-zinc-400">Provides critical nectar shelters for migrating Monarch butterflies</div>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${pollinatorCorridor ? 'bg-emerald-500 border-emerald-400' : 'border-zinc-600'}`}>
              {pollinatorCorridor && <CheckCircle className="w-3.5 h-3.5 text-black" />}
            </div>
          </div>

          {/* Toggle 4: Targeted Bio-Protection */}
          <div
            onClick={() => { sounds.playClick(); setBiologicalCropProtection(!biologicalCropProtection); }}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              biologicalCropProtection
                ? 'bg-emerald-950/40 border-emerald-500 text-white'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧪</span>
              <div>
                <div className="text-xs font-bold text-zinc-100">Precision Biological Crop Protection & Drone Scouting</div>
                <div className="text-[11px] text-zinc-400">Protects crops from fungal blight while eliminating indiscriminate chemical drift</div>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${biologicalCropProtection ? 'bg-emerald-500 border-emerald-400' : 'border-zinc-600'}`}>
              {biologicalCropProtection && <CheckCircle className="w-3.5 h-3.5 text-black" />}
            </div>
          </div>
        </div>

        {/* Real-Time Outcome Gauges */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 mb-5">
          <div className="text-center">
            <div className="text-xs text-zinc-400 mb-1">Crop Yield Index</div>
            <div className="text-lg font-bold text-amber-400">{yieldScore}%</div>
            <div className="text-[10px] text-zinc-500">Food Security Guaranteed</div>
          </div>

          <div className="text-center">
            <div className="text-xs text-zinc-400 mb-1">Pollinator Biodiversity</div>
            <div className="text-lg font-bold text-emerald-400">{biodiversityScore}%</div>
            <div className="text-[10px] text-zinc-500">Monarch Corridors Blooming</div>
          </div>

          <div className="text-center">
            <div className="text-xs text-zinc-400 mb-1">Soil Carbon Captured</div>
            <div className="text-lg font-bold text-cyan-400">+{carbonStorage} kg/ac</div>
            <div className="text-[10px] text-zinc-500">Climate Tech in Soil</div>
          </div>
        </div>

        {/* Farmer Support Advocacy Action */}
        <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl mb-4">
          <h5 className="text-xs font-bold text-zinc-200 mb-1 flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-amber-400" />
            <span>Community Petition: Subsidize Smart Farming for Local Family Growers</span>
          </h5>
          <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
            Transitioning to precision tools has upfront costs. By signing this resolution, you support granting $2.5M in regional precision ag equipment credits to family farms adopting regenerative pollinator margins!
          </p>

          {!isPetitionSigned ? (
            <button
              onClick={handleApplyStrategy}
              disabled={!isBalanced}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-white disabled:text-zinc-500 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <Wheat className="w-4 h-4" />
              <span>
                {isBalanced
                  ? 'Sign Resolution & Complete Smart Farming Quest'
                  : 'Enable all 4 Smart Farming innovations above to balance harvest!'}
              </span>
            </button>
          ) : (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/80 rounded-xl text-center text-xs text-emerald-300 font-semibold">
              🎉 Resolution signed & Smart Farm online! The grasslands are flourishing with golden wheat and monarchs!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs pt-3 border-t border-zinc-800">
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Sparkles className="w-4 h-4" /> Reward: +450 Golden Pollen Coins & 100% Farmland Flourish
          </span>
          {isPetitionSigned && (
            <button
              onClick={closeQuestModal}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all"
            >
              Back to World
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
