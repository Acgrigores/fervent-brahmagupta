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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-600/60 flex items-center justify-center">
              <Sun className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Solar Artesian Well & Aquifer Restoration</h3>
              <p className="text-xs text-zinc-400">Sunfire Savanna Oasis • Drought Recovery for Zuri the Cheetah</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase Progress Bar */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div
            className={`p-2 rounded-xl border text-[11px] font-semibold transition-all ${
              solarPanels.length === totalPanels
                ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
            }`}
          >
            1. Solar Tracking ({solarPanels.length}/{totalPanels})
          </div>
          <div
            className={`p-2 rounded-xl border text-[11px] font-semibold transition-all ${
              aquiferPumped
                ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
            }`}
          >
            2. Artesian Well ({aquiferPumped ? 'Active' : 'Standby'})
          </div>
          <div
            className={`p-2 rounded-xl border text-[11px] font-semibold transition-all ${
              greenBelts.length === totalBelts
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
            }`}
          >
            3. Acacia Barrier ({greenBelts.length}/{totalBelts})
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-4 bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
          {solarPanels.length < totalPanels && (
            <p className="text-xs text-amber-300">
              Align 4 photovoltaic solar trackers with the savanna sun to power the deep-well submersible turbine.
            </p>
          )}
          {solarPanels.length === totalPanels && !aquiferPumped && (
            <p className="text-xs text-cyan-300">
              Solar power established! Tap the central pressure valve to draw subterranean aquifer water into the dry basin.
            </p>
          )}
          {aquiferPumped && greenBelts.length < totalBelts && (
            <p className="text-xs text-emerald-300">
              Freshwater is surging! Plant 4 deep-rooted acacia and succulent buffer belts to shield the oasis from encroaching sand dunes.
            </p>
          )}
          {isCompleted && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>Oasis restored! 25,000 gal/day freshwater recharge online. Arid Sugar Melons revived!</span>
            </div>
          )}
        </div>

        {/* Interactive Workspace */}
        <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800/80 mb-5 space-y-4">
          {/* Phase 1: Solar Trackers */}
          <div>
            <div className="text-[11px] text-zinc-400 font-bold mb-2 flex items-center justify-between">
              <span>PHOTOVOLTAIC SOLAR TRACKERS</span>
              <span className="text-amber-400 font-mono">{solarPanels.length * 25}% POWER</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: totalPanels }).map((_, idx) => {
                const isOnline = solarPanels.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => handleTogglePanel(idx)}
                    disabled={isOnline}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      isOnline
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                        : 'bg-zinc-900 border-zinc-800 hover:border-amber-600/60 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Sun className={`w-5 h-5 ${isOnline ? 'text-amber-400 animate-pulse' : 'text-zinc-600'}`} />
                    <span className="text-[10px] font-bold">Panel #{idx + 1}</span>
                    <span className="text-[9px] font-mono">{isOnline ? 'Tracking' : 'Offline'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phase 2: Artesian Pump Valve */}
          {solarPanels.length === totalPanels && (
            <div className="pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    <span>Subterranean Artesian Borehole Valve</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">Depleted aquifer depth: 140m • Pressure: 8.4 Bar</p>
                </div>
                <button
                  onClick={handlePumpAquifer}
                  disabled={aquiferPumped}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 ${
                    aquiferPumped
                      ? 'bg-cyan-950/60 border border-cyan-500 text-cyan-300'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  {aquiferPumped ? 'Aquifer Flowing' : 'Open Water Valve'}
                </button>
              </div>
            </div>
          )}

          {/* Phase 3: Acacia Green Belts */}
          {aquiferPumped && (
            <div className="pt-2 border-t border-zinc-800">
              <div className="text-[11px] text-zinc-400 font-bold mb-2 flex items-center justify-between">
                <span>DROUGHT-RESILIENT ACACIA BUFFER BELTS</span>
                <span className="text-emerald-400 font-mono">{greenBelts.length * 25}% COVER</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: totalBelts }).map((_, idx) => {
                  const isPlanted = greenBelts.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => handlePlantBelt(idx)}
                      disabled={isPlanted}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        isPlanted
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                          : 'bg-zinc-900 border-zinc-800 hover:border-emerald-600/60 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Sprout className={`w-5 h-5 ${isPlanted ? 'text-emerald-400' : 'text-zinc-600'}`} />
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Reward: +420 Desert Sunfire Coins • 100% Oasis Flourish</span>
          </div>

          {isCompleted ? (
            <button
              onClick={closeQuestModal}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
            >
              Continue Journey
            </button>
          ) : (
            <button
              onClick={closeQuestModal}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
