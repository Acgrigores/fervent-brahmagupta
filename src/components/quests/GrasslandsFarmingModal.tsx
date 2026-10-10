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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#fffdfa] border-4 border-amber-950/20 rounded-3xl p-6 shadow-2xl text-stone-900 max-h-[90vh] overflow-y-auto">
        {/* Vintage Wooden Plaque Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#78350f] via-[#92400e] to-[#78350f] text-[#fffbeb] p-4 rounded-2xl border-2 border-[#451a03] shadow-md mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌻</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-amber-100">Field to Future: Smart Farming Simulator</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-200 border border-amber-600">
                  Powered by Bayer
                </span>
              </div>
              <p className="text-xs text-amber-200/90 font-sans">Regenerative Farmlands • Support Aura the Monarch Butterfly</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1.5 rounded-full bg-amber-950/40 hover:bg-amber-950/70 text-amber-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Introduction */}
        <div className="p-4 bg-[#fefce8] border border-amber-200 rounded-2xl mb-5 text-xs text-stone-700 leading-relaxed shadow-sm">
          <p>
            Agriculture feeds 8 billion people, but traditional monoculture depletes topsoil and destroys milkweed.
            <strong> Bayer Smart Farming & Precision Agriculture</strong> empowers farmers to harvest maximum crops while regenerating soil biology and providing native pollinator corridors!
          </p>
        </div>

        {/* Interactive Strategy Configuration */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-serif font-bold text-amber-950 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-amber-700" />
            <span>Select Regenerative Smart Farming Innovations:</span>
          </h4>

          {/* Toggle 1: No-Till & Cover Crops */}
          <div
            onClick={() => { sounds.playClick(); setNoTill(!noTill); }}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between shadow-sm ${
              noTill
                ? 'bg-emerald-50 border-emerald-500 text-stone-900'
                : 'bg-white border-amber-200/80 text-stone-600 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌾</span>
              <div>
                <div className="text-xs font-serif font-bold text-stone-900">Regenerative No-Till & Clover Cover Crops</div>
                <div className="text-[11px] text-stone-600">Keeps root networks intact, prevents topsoil erosion, stores 220kg CO2/acre</div>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${noTill ? 'bg-emerald-600 border-emerald-600' : 'border-stone-300'}`}>
              {noTill && <CheckCircle className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>

          {/* Toggle 2: Precision Drip Irrigation */}
          <div
            onClick={() => { sounds.playClick(); setPrecisionIrrigation(!precisionIrrigation); }}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between shadow-sm ${
              precisionIrrigation
                ? 'bg-emerald-50 border-emerald-500 text-stone-900'
                : 'bg-white border-amber-200/80 text-stone-600 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛰️</span>
              <div>
                <div className="text-xs font-serif font-bold text-stone-900">Satellite Soil Moisture & Precision Drip Irrigation</div>
                <div className="text-[11px] text-stone-600">Saves 65% water using AI moisture maps and stops fertilizer runoff</div>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${precisionIrrigation ? 'bg-emerald-600 border-emerald-600' : 'border-stone-300'}`}>
              {precisionIrrigation && <CheckCircle className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>

          {/* Toggle 3: Pollinator Buffer Corridors */}
          <div
            onClick={() => { sounds.playClick(); setPollinatorCorridor(!pollinatorCorridor); }}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between shadow-sm ${
              pollinatorCorridor
                ? 'bg-emerald-50 border-emerald-500 text-stone-900'
                : 'bg-white border-amber-200/80 text-stone-600 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🦋</span>
              <div>
                <div className="text-xs font-serif font-bold text-stone-900">15% Field Margin Native Milkweed & Wildflower Strips</div>
                <div className="text-[11px] text-stone-600">Provides critical nectar shelters for migrating Monarch butterflies</div>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${pollinatorCorridor ? 'bg-emerald-600 border-emerald-600' : 'border-stone-300'}`}>
              {pollinatorCorridor && <CheckCircle className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>

          {/* Toggle 4: Targeted Bio-Protection */}
          <div
            onClick={() => { sounds.playClick(); setBiologicalCropProtection(!biologicalCropProtection); }}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between shadow-sm ${
              biologicalCropProtection
                ? 'bg-emerald-50 border-emerald-500 text-stone-900'
                : 'bg-white border-amber-200/80 text-stone-600 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧪</span>
              <div>
                <div className="text-xs font-serif font-bold text-stone-900">Precision Biological Crop Protection & Drone Scouting</div>
                <div className="text-[11px] text-stone-600">Protects crops from fungal blight while eliminating indiscriminate chemical drift</div>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${biologicalCropProtection ? 'bg-emerald-600 border-emerald-600' : 'border-stone-300'}`}>
              {biologicalCropProtection && <CheckCircle className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>
        </div>

        {/* Real-Time Outcome Gauges */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-amber-50/70 rounded-2xl border border-amber-200 mb-5">
          <div className="text-center">
            <div className="text-xs font-medium text-stone-600 mb-1">Crop Yield Index</div>
            <div className="text-lg font-serif font-bold text-amber-800">{yieldScore}%</div>
            <div className="text-[10px] text-stone-500">Food Security Guaranteed</div>
          </div>

          <div className="text-center">
            <div className="text-xs font-medium text-stone-600 mb-1">Pollinator Biodiversity</div>
            <div className="text-lg font-serif font-bold text-emerald-700">{biodiversityScore}%</div>
            <div className="text-[10px] text-stone-500">Monarch Corridors Blooming</div>
          </div>

          <div className="text-center">
            <div className="text-xs font-medium text-stone-600 mb-1">Soil Carbon Captured</div>
            <div className="text-lg font-serif font-bold text-cyan-800">+{carbonStorage} kg/ac</div>
            <div className="text-[10px] text-stone-500">Climate Tech in Soil</div>
          </div>
        </div>

        {/* Farmer Support Advocacy Action */}
        <div className="p-4 bg-white border border-amber-200 rounded-2xl mb-4 shadow-sm">
          <h5 className="text-xs font-serif font-bold text-stone-900 mb-1 flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-amber-700" />
            <span>Community Petition: Subsidize Smart Farming for Local Family Growers</span>
          </h5>
          <p className="text-[11px] text-stone-600 leading-relaxed mb-3">
            Transitioning to precision tools has upfront costs. By signing this resolution, you support granting $2.5M in regional precision ag equipment credits to family farms adopting regenerative pollinator margins!
          </p>

          {!isPetitionSigned ? (
            <button
              onClick={handleApplyStrategy}
              disabled={!isBalanced}
              className="w-full py-2.5 bg-[#78350f] hover:bg-[#92400e] disabled:bg-stone-200 text-white disabled:text-stone-400 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <Wheat className="w-4 h-4" />
              <span>
                {isBalanced
                  ? 'Sign Resolution & Complete Smart Farming Quest'
                  : 'Enable all 4 Smart Farming innovations above to balance harvest!'}
              </span>
            </button>
          ) : (
            <div className="p-3 bg-emerald-100 border border-emerald-400 rounded-xl text-center text-xs text-emerald-800 font-bold">
              🎉 Resolution signed & Smart Farm online! The grasslands are flourishing with golden wheat and monarchs!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs pt-3 border-t border-amber-200">
          <span className="flex items-center gap-1.5 text-amber-800 font-bold">
            <Sparkles className="w-4 h-4 text-amber-600" /> Reward: +450 Golden Pollen Coins & 100% Farmland Flourish
          </span>
          {isPetitionSigned ? (
            <button
              onClick={closeQuestModal}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-all shadow-sm"
            >
              Back to World
            </button>
          ) : (
            <button
              onClick={closeQuestModal}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
