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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel">
      <div className="relative w-full max-w-xl pixel-panel overflow-hidden text-[#2e1005] shadow-2xl">
        {/* Header - Pixel Farm Wood Banner */}
        <div className="flex items-center justify-between p-3.5 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border-2 border-[#fde68a] bg-[#2e1005] flex items-center justify-center shadow-inner">
              <Sun className="w-5 h-5 text-[#fde68a]" />
            </div>
            <div>
              <h3 className="font-pixel-heading text-xs text-[#fde68a] tracking-wider">SOLAR ARTESIAN WELL</h3>
              <p className="text-[9px] text-[#fde68a]/80 mt-0.5">Savanna Oasis • Drought Recovery for Zuri the Cheetah</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1 pixel-btn-red"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Phase Progress Bar */}
          <div className="grid grid-cols-3 gap-2 text-center text-[9px]">
            <div
              className={`p-2 border-2 transition-all font-bold ${
                solarPanels.length === totalPanels
                  ? 'bg-[#fef3c7] border-[#b45309] text-[#78350f]'
                  : 'bg-[#fffbf2] border-[#c49a6c] text-[#78350f]'
              }`}
            >
              1. SOLAR ({solarPanels.length}/{totalPanels})
            </div>
            <div
              className={`p-2 border-2 transition-all font-bold ${
                aquiferPumped
                  ? 'bg-[#e0f2fe] border-[#0284c7] text-[#0369a1]'
                  : 'bg-[#fffbf2] border-[#c49a6c] text-[#78350f]'
              }`}
            >
              2. WELL ({aquiferPumped ? 'ACTIVE' : 'STANDBY'})
            </div>
            <div
              className={`p-2 border-2 transition-all font-bold ${
                greenBelts.length === totalBelts
                  ? 'bg-[#dcfce7] border-[#15803d] text-[#14532d]'
                  : 'bg-[#fffbf2] border-[#c49a6c] text-[#78350f]'
              }`}
            >
              3. ACACIA ({greenBelts.length}/{totalBelts})
            </div>
          </div>

          {/* Instructions */}
          <div className="pixel-card p-3 bg-[#fefce8]">
            {solarPanels.length < totalPanels && (
              <p className="text-[9.5px] text-[#78350f] leading-relaxed">
                Align 4 photovoltaic solar trackers with the savanna sun to power the submersible pump.
              </p>
            )}
            {solarPanels.length === totalPanels && !aquiferPumped && (
              <p className="text-[9.5px] text-[#0369a1] leading-relaxed font-bold">
                Solar power established! Tap the central pressure valve to draw subterranean aquifer water into the basin!
              </p>
            )}
            {aquiferPumped && greenBelts.length < totalBelts && (
              <p className="text-[9.5px] text-[#14532d] leading-relaxed">
                Freshwater is surging! Plant 4 deep-rooted acacia belts to shield the oasis from sand dunes!
              </p>
            )}
            {isCompleted && (
              <div className="flex items-center gap-2 text-[9.5px] text-[#14532d] font-bold">
                <CheckCircle className="w-4 h-4 text-[#15803d]" />
                <span>Oasis restored! 25,000 gal/day freshwater recharge online. Sugar Melons revived!</span>
              </div>
            )}
          </div>

          {/* Interactive Workspace */}
          <div className="p-3 bg-[#e8dfc8] border-2 border-[#5c2c16] space-y-3">
            {/* Phase 1: Solar Trackers */}
            <div>
              <div className="text-[9.5px] font-pixel-heading text-[#2e1005] mb-2 flex items-center justify-between">
                <span>SOLAR TRACKERS</span>
                <span className="text-[#b45309] font-bold">{solarPanels.length * 25}% POWER</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: totalPanels }).map((_, idx) => {
                  const isOnline = solarPanels.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleTogglePanel(idx)}
                      disabled={isOnline}
                      className={`p-2 border-2 flex flex-col items-center gap-1 transition-all ${
                        isOnline
                          ? 'bg-[#fef3c7] border-[#b45309] text-[#78350f] shadow-none'
                          : 'bg-[#fffbf2] border-[#5c2c16] hover:bg-[#fde68a] text-[#2e1005] shadow-[2px_2px_0px_#2e1005]'
                      }`}
                    >
                      <Sun className={`w-4 h-4 ${isOnline ? 'text-[#b45309]' : 'text-stone-400'}`} />
                      <span className="text-[8.5px] font-bold">PANEL #{idx + 1}</span>
                      <span className="text-[7.5px]">{isOnline ? 'TRACKING' : 'OFFLINE'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Phase 2: Artesian Pump Valve */}
            {solarPanels.length === totalPanels && (
              <div className="pt-2 border-t-2 border-[#5c2c16]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[9.5px] font-pixel-heading text-[#2e1005] flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-[#0284c7]" />
                      <span>ARTESIAN BOREHOLE VALVE</span>
                    </h4>
                    <p className="text-[8px] text-[#5c2c16]">Aquifer depth: 140m • Pressure: 8.4 Bar</p>
                  </div>
                  <button
                    onClick={handlePumpAquifer}
                    disabled={aquiferPumped}
                    className={`px-3 py-1.5 text-[9.5px] font-bold ${
                      aquiferPumped
                        ? 'border-2 border-[#0284c7] bg-[#e0f2fe] text-[#0369a1]'
                        : 'pixel-btn'
                    }`}
                  >
                    {aquiferPumped ? 'FLOWING!' : 'OPEN VALVE'}
                  </button>
                </div>
              </div>
            )}

            {/* Phase 3: Acacia Green Belts */}
            {aquiferPumped && (
              <div className="pt-2 border-t-2 border-[#5c2c16]">
                <div className="text-[9.5px] font-pixel-heading text-[#2e1005] mb-2 flex items-center justify-between">
                  <span>ACACIA BUFFER BELTS</span>
                  <span className="text-[#15803d] font-bold">{greenBelts.length * 25}% COVER</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: totalBelts }).map((_, idx) => {
                    const isPlanted = greenBelts.includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => handlePlantBelt(idx)}
                        disabled={isPlanted}
                        className={`p-2 border-2 flex flex-col items-center gap-1 transition-all ${
                          isPlanted
                            ? 'bg-[#dcfce7] border-[#15803d] text-[#14532d] shadow-none'
                            : 'bg-[#fffbf2] border-[#5c2c16] hover:bg-[#dcfce7] text-[#2e1005] shadow-[2px_2px_0px_#2e1005]'
                        }`}
                      >
                        <Sprout className={`w-4 h-4 ${isPlanted ? 'text-[#15803d]' : 'text-stone-400'}`} />
                        <span className="text-[8.5px] font-bold">ZONE #{idx + 1}</span>
                        <span className="text-[7.5px]">{isPlanted ? 'ROOTED' : 'PARCHED'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t-2 border-[#5c2c16]">
            <span className="flex items-center gap-1.5 text-[9.5px] text-[#b45309] font-bold">
              <Sparkles className="w-4 h-4 text-[#b45309]" /> REWARD: +420 COINS & 100% FLOURISH
            </span>

            {isCompleted ? (
              <button
                onClick={closeQuestModal}
                className="px-4 py-2 pixel-btn-green text-[10px]"
              >
                RETURN TO WORLD
              </button>
            ) : (
              <button
                onClick={closeQuestModal}
                className="px-3 py-1.5 pixel-btn text-[10px]"
              >
                CLOSE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
