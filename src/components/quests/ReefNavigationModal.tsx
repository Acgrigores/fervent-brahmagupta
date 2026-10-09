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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐢</span>
            <div>
              <h3 className="font-bold text-lg text-white">Marine Sanctuary Navigation Diverter</h3>
              <p className="text-xs text-zinc-400">Hawksbill Coral Barrier • Protect Coralia & Fragile Reefs</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Narrative & Map Card */}
        <div className="p-4 bg-gradient-to-r from-cyan-950 via-zinc-900 to-blue-950 border border-cyan-500/40 rounded-2xl mb-5">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>Radar GPS Corridor Control</span>
          </div>
          <p className="text-xs text-zinc-200 leading-relaxed mb-3">
            Motorboat propellers inflict devastating lacerations on endangered Hawksbill sea turtles, and heavy anchors pulverize decades of fragile staghorn coral.
            <strong> Realign GPS navigational waypoints</strong> for each incoming vessel to guide them into safe, deep offshore shipping trenches!
          </p>

          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Vessels Safely Redirected:</span>
            <span className="font-bold text-cyan-300">
              {vessels.filter((v) => v.diverted).length} / {vessels.length}
            </span>
          </div>
        </div>

        {/* Vessel Route Control Cards */}
        <div className="space-y-3 mb-5">
          {vessels.map((v) => (
            <div
              key={v.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                v.diverted
                  ? 'bg-cyan-950/40 border-cyan-500/80 text-white'
                  : 'bg-zinc-950 border-red-500/40 text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl filter drop-shadow">{v.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{v.name}</span>
                    <span className="text-[10px] text-zinc-400">({v.type})</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                    <span className="text-zinc-500">Route:</span>
                    <span className={v.diverted ? 'text-emerald-400 font-medium' : 'text-red-400 font-bold'}>
                      {v.channel}
                    </span>
                  </div>
                </div>
              </div>

              {!v.diverted ? (
                <button
                  onClick={() => handleDivert(v.id)}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Divert Route</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Protected</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Non-Profit Coral Pledge */}
        {allDiverted && !pledged && (
          <div className="p-4 bg-emerald-950/50 border border-emerald-500/60 rounded-2xl mb-4 animate-in fade-in">
            <h5 className="text-xs font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-red-400" />
              <span>Coral Reef Restoration Non-Profit Pledge</span>
            </h5>
            <p className="text-[11px] text-zinc-300 leading-relaxed mb-3">
              By confirming this diversion, you allocate sponsored funding from our ad pool to the <strong>Coral Restoration Foundation</strong> to outplant 50 micro-fragment corals onto damaged nursery beds!
            </p>
            <button
              onClick={handleComplete}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
            >
              Confirm Navigational Safe Zone & Pledge Coral Grant
            </button>
          </div>
        )}

        {pledged && (
          <div className="p-4 bg-cyan-950/60 border border-cyan-500/80 rounded-2xl mb-4 text-center text-xs text-cyan-200">
            🌊 All ships have navigated safely into offshore trenches! The coral polyps are glowing with life!
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs pt-3 border-t border-zinc-800">
          <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
            <Sparkles className="w-4 h-4" /> Reward: +380 Coral Pearl Coins & 100% Reef Flourish
          </span>
          {pledged && (
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
