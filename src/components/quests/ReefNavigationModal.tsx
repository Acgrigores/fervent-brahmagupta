'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { X, Navigation, CheckCircle, Sparkles, Compass, Heart } from 'lucide-react';

interface Vessel {
  id: number;
  name: string;
  type: string;
  icon: string;
  diverted: boolean;
  channel: string;
}

const INITIAL_VESSELS: Vessel[] = [
  { id: 1, name: 'S/S Pacific Vista', type: 'Mega Cruise Liner', icon: '🚢', diverted: false, channel: 'Shallow Turtle Bay' },
  { id: 2, name: 'Oceanic Bulk 402', type: 'Container Freighter', icon: '⛴️', diverted: false, channel: 'Coral Barrier Crest' },
  { id: 3, name: 'Island Swift V', type: 'Tourist Speedboat', icon: '🚤', diverted: false, channel: 'Nursery Seagrass Shallows' },
  { id: 4, name: 'Deep Hauler IX', type: 'Trawler Fleet', icon: '🛳️', diverted: false, channel: 'Spawning Atoll Reef' },
];

export default function ReefNavigationModal() {
  const { activeQuestModal, closeQuestModal, completeQuest } = useGameState();
  const [vessels, setVessels] = useState<Vessel[]>(INITIAL_VESSELS);
  const [pledged, setPledged] = useState(false);

  if (activeQuestModal !== 'reef_navigation') return null;

  const allDiverted = vessels.every((v) => v.diverted);

  const handleDivert = (id: number) => {
    sounds.playWaterSplash();
    setVessels((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, diverted: true, channel: 'Deep-Water Offshore Sanctuary Channel' } : v
      )
    );
  };

  const handleComplete = () => {
    sounds.playCoin();
    setPledged(true);
    completeQuest(
      'quest_reefs',
      'Rerouted 4 maritime vessels into deep-water navigational channels and pledged support to Coral Restoration Foundation, eliminating propeller strikes for Hawksbill sea turtles.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel">
      <div className="relative w-full max-w-2xl pixel-panel overflow-hidden text-[#2e1005] shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header - Pixel Farm Wood Banner */}
        <div className="flex items-center justify-between p-3.5 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐢</span>
            <div>
              <h3 className="font-pixel-heading text-xs text-[#fde68a] tracking-wider">REEF NAVIGATION DIVERTER</h3>
              <p className="text-[9px] text-[#fde68a]/80 mt-0.5">Hawksbill Barrier • Protect Coralia & Fragile Reefs</p>
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
          {/* Narrative & Map Card */}
          <div className="pixel-card p-4 bg-[#f0fdfa]">
            <div className="flex items-center gap-2 text-[9.5px] font-bold text-[#0f766e] uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4 text-[#0d9488]" />
              <span>RADAR GPS CORRIDOR CONTROL</span>
            </div>
            <p className="text-[9.5px] text-[#5c2c16] leading-relaxed mb-3">
              Motorboat propellers inflict devastating lacerations on endangered sea turtles, and heavy anchors pulverize fragile coral.
              <strong className="text-[#2e1005]"> Realign GPS waypoints</strong> for incoming vessels to steer them into safe offshore trenches!
            </p>

            <div className="p-2.5 bg-[#fffbf2] border-2 border-[#5c2c16] flex items-center justify-between text-[9px] font-bold">
              <span className="text-[#5c2c16]">VESSELS DIVERTED:</span>
              <span className="text-[#0f766e]">
                {vessels.filter((v) => v.diverted).length} / {vessels.length}
              </span>
            </div>
          </div>

        {/* Vessel Route Control Cards */}
        <div className="space-y-2.5">
          {vessels.map((v) => (
            <div
              key={v.id}
              className={`p-3 border-2 flex items-center justify-between shadow-[2px_2px_0px_#2e1005] transition-all ${
                v.diverted
                  ? 'bg-[#ccfbf1] border-[#0f766e] text-[#134e4a]'
                  : 'bg-[#fffbf2] border-[#5c2c16] text-[#2e1005]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{v.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9.5px] font-pixel-heading text-[#2e1005]">{v.name}</span>
                    <span className="text-[8px] text-[#78350f]">({v.type})</span>
                  </div>
                  <div className="text-[8.5px] text-[#5c2c16] flex items-center gap-1.5 mt-0.5">
                    <span>ROUTE:</span>
                    <span className={v.diverted ? 'text-[#0f766e] font-bold' : 'text-[#b91c1c] font-bold'}>
                      {v.channel}
                    </span>
                  </div>
                </div>
              </div>

              {!v.diverted ? (
                <button
                  onClick={() => handleDivert(v.id)}
                  className="px-3 py-1.5 pixel-btn flex items-center gap-1.5 text-[9.5px]"
                >
                  <Navigation className="w-3 h-3" />
                  <span>DIVERT</span>
                </button>
              ) : (
                <div className="flex items-center gap-1 text-[9px] text-[#0f766e] font-bold px-2">
                  <CheckCircle className="w-4 h-4 text-[#0f766e]" />
                  <span>PROTECTED</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Non-Profit Coral Pledge */}
        {allDiverted && !pledged && (
          <div className="p-3.5 pixel-card bg-[#dcfce7] border-[#15803d] space-y-2">
            <h5 className="text-[9.5px] font-pixel-heading text-[#14532d] flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              <span>CORAL RESTORATION FOUNDATION PLEDGE</span>
            </h5>
            <p className="text-[9px] text-[#14532d] leading-relaxed">
              By confirming this diversion, sponsored funding is allocated to the Coral Restoration Foundation to outplant 50 micro-fragment corals onto damaged nursery beds!
            </p>
            <button
              onClick={handleComplete}
              className="w-full py-2 pixel-btn-green text-[10px]"
            >
              CONFIRM SAFE ZONE & PLEDGE CORAL GRANT
            </button>
          </div>
        )}

        {pledged && (
          <div className="p-3 border-2 border-[#0f766e] bg-[#ccfbf1] text-center text-[9.5px] text-[#134e4a] font-bold">
            🌊 All ships have navigated safely into offshore trenches! Coral polyps are glowing with life!
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t-2 border-[#5c2c16] flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[9.5px] text-[#0f766e] font-bold">
            <Sparkles className="w-4 h-4 text-[#0d9488]" /> REWARD: +380 COINS & 100% REEF FLOURISH
          </span>
          {pledged ? (
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
