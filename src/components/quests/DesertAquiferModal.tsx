'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { X, Sun, Droplets, Sprout, CheckCircle, Sparkles } from 'lucide-react';

export default function DesertAquiferModal() {
  const { activeQuestModal, closeQuestModal, completeQuest } = useGameState();
  const [solarPanels, setSolarPanels] = useState<number[]>([]);
  const [aquiferPumped, setAquiferPumped] = useState(false);
  const [greenBelts, setGreenBelts] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  if (activeQuestModal !== 'desert_aquifer') return null;

  const totalPanels = 4;
  const totalBelts = 4;

  const handleTogglePanel = (idx: number) => {
    if (solarPanels.includes(idx)) return;
    sounds.playCoin();
    setSolarPanels((prev) => [...prev, idx]);
  };

  const handlePumpAquifer = () => {
    if (solarPanels.length < totalPanels || aquiferPumped) return;
    sounds.playWaterSplash();
    setAquiferPumped(true);
  };

  const handlePlantBelt = (idx: number) => {
    if (!aquiferPumped || greenBelts.includes(idx)) return;
    sounds.playBloom();
    const updated = [...greenBelts, idx];
    setGreenBelts(updated);

    if (updated.length === totalBelts) {
      setTimeout(() => {
        setIsCompleted(true);
        completeQuest(
          'quest_desert',
          'Commissioned 4 solar artesian tracking panels, tapped deep freshwater aquifer, and planted acacia green-belts to stop desertification.'
        );
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-[#fffdfa] border-4 border-amber-950/20 rounded-3xl p-6 shadow-2xl text-stone-900">
        {/* Vintage Wooden Plaque Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#78350f] via-[#92400e] to-[#78350f] text-[#fffbeb] p-4 rounded-2xl border-2 border-[#451a03] shadow-md mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900/60 border border-amber-600/60 flex items-center justify-center shadow-inner">
              <Sun className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-100">Solar Artesian Well & Aquifer Restoration</h3>
              <p className="text-xs text-amber-200/90 font-sans">Sunfire Savanna Oasis • Drought Recovery for Zuri the Cheetah</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1.5 rounded-full bg-amber-950/40 hover:bg-amber-950/70 text-amber-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase Progress Bar */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div
            className={`p-2 rounded-xl border text-[11px] font-bold transition-all shadow-sm ${
              solarPanels.length === totalPanels
                ? 'bg-amber-100 border-amber-400 text-amber-950'
                : 'bg-stone-50 border-stone-200 text-stone-500'
            }`}
          >
            1. Solar Tracking ({solarPanels.length}/{totalPanels})
          </div>
          <div
            className={`p-2 rounded-xl border text-[11px] font-bold transition-all shadow-sm ${
              aquiferPumped
                ? 'bg-cyan-100 border-cyan-400 text-cyan-950'
                : 'bg-stone-50 border-stone-200 text-stone-500'
            }`}
          >
            2. Artesian Well ({aquiferPumped ? 'Active' : 'Standby'})
          </div>
          <div
            className={`p-2 rounded-xl border text-[11px] font-bold transition-all shadow-sm ${
              greenBelts.length === totalBelts
                ? 'bg-emerald-100 border-emerald-400 text-emerald-950'
                : 'bg-stone-50 border-stone-200 text-stone-500'
            }`}
          >
            3. Acacia Barrier ({greenBelts.length}/{totalBelts})
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-4 bg-[#fefce8] p-3.5 rounded-2xl border border-amber-200 shadow-sm">
          {solarPanels.length < totalPanels && (
            <p className="text-xs text-amber-900 font-medium">
              Align 4 photovoltaic solar trackers with the savanna sun to power the deep-well submersible turbine.
            </p>
          )}
          {solarPanels.length === totalPanels && !aquiferPumped && (
            <p className="text-xs text-cyan-900 font-medium">
              Solar power established! Tap the central pressure valve to draw subterranean aquifer water into the dry basin.
            </p>
          )}
          {aquiferPumped && greenBelts.length < totalBelts && (
            <p className="text-xs text-emerald-900 font-medium">
              Freshwater is surging! Plant 4 deep-rooted acacia and succulent buffer belts to shield the oasis from encroaching sand dunes.
            </p>
          )}
          {isCompleted && (
            <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Oasis restored! 25,000 gal/day freshwater recharge online. Arid Sugar Melons revived!</span>
            </div>
          )}
        </div>

        {/* Interactive Workspace */}
        <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 mb-5 space-y-4 shadow-sm">
          {/* Phase 1: Solar Trackers */}
          <div>
            <div className="text-[11px] text-amber-950 font-serif font-bold mb-2 flex items-center justify-between">
              <span>PHOTOVOLTAIC SOLAR TRACKERS</span>
              <span className="text-amber-800 font-mono font-bold">{solarPanels.length * 25}% POWER</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: totalPanels }).map((_, idx) => {
                const isOnline = solarPanels.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => handleTogglePanel(idx)}
                    disabled={isOnline}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all shadow-sm ${
                      isOnline
                        ? 'bg-amber-100 border-amber-500 text-amber-950'
                        : 'bg-white border-amber-200 hover:border-amber-400 text-stone-600'
                    }`}
                  >
                    <Sun className={`w-5 h-5 ${isOnline ? 'text-amber-600 animate-pulse' : 'text-stone-400'}`} />
                    <span className="text-[10px] font-bold">Panel #{idx + 1}</span>
                    <span className="text-[9px] font-mono">{isOnline ? 'Tracking' : 'Offline'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phase 2: Artesian Pump Valve */}
          {solarPanels.length === totalPanels && (
            <div className="pt-2 border-t border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-serif font-bold text-stone-900 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-cyan-700" />
                    <span>Subterranean Artesian Borehole Valve</span>
                  </h4>
                  <p className="text-[11px] text-stone-600">Depleted aquifer depth: 140m • Pressure: 8.4 Bar</p>
                </div>
                <button
                  onClick={handlePumpAquifer}
                  disabled={aquiferPumped}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                    aquiferPumped
                      ? 'bg-cyan-100 border-2 border-cyan-500 text-cyan-900'
                      : 'bg-cyan-700 hover:bg-cyan-800 text-white'
                  }`}
                >
                  {aquiferPumped ? 'Aquifer Flowing' : 'Open Water Valve'}
                </button>
              </div>
            </div>
          )}

          {/* Phase 3: Acacia Green Belts */}
          {aquiferPumped && (
            <div className="pt-2 border-t border-amber-200">
              <div className="text-[11px] text-amber-950 font-serif font-bold mb-2 flex items-center justify-between">
                <span>DROUGHT-RESILIENT ACACIA BUFFER BELTS</span>
                <span className="text-emerald-800 font-mono font-bold">{greenBelts.length * 25}% COVER</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: totalBelts }).map((_, idx) => {
                  const isPlanted = greenBelts.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => handlePlantBelt(idx)}
                      disabled={isPlanted}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all shadow-sm ${
                        isPlanted
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                          : 'bg-white border-amber-200 hover:border-emerald-400 text-stone-600'
                      }`}
                    >
                      <Sprout className={`w-5 h-5 ${isPlanted ? 'text-emerald-700' : 'text-stone-400'}`} />
                      <span className="text-[10px] font-bold">Zone #{idx + 1}</span>
                      <span className="text-[9px] font-mono">{isPlanted ? 'Rooted' : 'Parched'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-amber-200">
          <div className="flex items-center gap-2 text-xs text-amber-900 font-bold">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Reward: +420 Desert Sunfire Coins • 100% Oasis Flourish</span>
          </div>

          {isCompleted ? (
            <button
              onClick={closeQuestModal}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Continue Journey
            </button>
          ) : (
            <button
              onClick={closeQuestModal}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
