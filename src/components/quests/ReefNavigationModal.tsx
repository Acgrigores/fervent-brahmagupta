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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#fffdfa] border-4 border-amber-950/20 rounded-3xl p-6 shadow-2xl text-stone-900 max-h-[90vh] overflow-y-auto">
        {/* Vintage Wooden Plaque Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#78350f] via-[#92400e] to-[#78350f] text-[#fffbeb] p-4 rounded-2xl border-2 border-[#451a03] shadow-md mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐢</span>
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-100">Marine Sanctuary Navigation Diverter</h3>
              <p className="text-xs text-amber-200/90 font-sans">Hawksbill Coral Barrier • Protect Coralia & Fragile Reefs</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1.5 rounded-full bg-amber-950/40 hover:bg-amber-950/70 text-amber-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Narrative & Map Card */}
        <div className="p-4 bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 border-2 border-teal-200 rounded-2xl mb-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4 text-teal-700" />
            <span>Radar GPS Corridor Control</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed mb-3">
            Motorboat propellers inflict devastating lacerations on endangered Hawksbill sea turtles, and heavy anchors pulverize decades of fragile staghorn coral.
            <strong> Realign GPS navigational waypoints</strong> for each incoming vessel to guide them into safe, deep offshore shipping trenches!
          </p>

          <div className="p-3 bg-white rounded-xl border border-teal-200 flex items-center justify-between text-xs shadow-inner">
            <span className="text-stone-600 font-medium">Vessels Safely Redirected:</span>
            <span className="font-bold text-teal-800">
              {vessels.filter((v) => v.diverted).length} / {vessels.length}
            </span>
          </div>
        </div>

        {/* Vessel Route Control Cards */}
        <div className="space-y-3 mb-5">
          {vessels.map((v) => (
            <div
              key={v.id}
              className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between shadow-sm ${
                v.diverted
                  ? 'bg-teal-50/70 border-teal-400 text-stone-900'
                  : 'bg-white border-amber-200 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl filter drop-shadow-sm">{v.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-serif font-bold text-stone-900">{v.name}</span>
                    <span className="text-[10px] text-stone-500 font-medium">({v.type})</span>
                  </div>
                  <div className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                    <span className="text-stone-400">Route:</span>
                    <span className={v.diverted ? 'text-teal-700 font-semibold' : 'text-red-600 font-bold'}>
                      {v.channel}
                    </span>
                  </div>
                </div>
              </div>

              {!v.diverted ? (
                <button
                  onClick={() => handleDivert(v.id)}
                  className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Divert Route</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-teal-700 font-bold px-2">
                  <CheckCircle className="w-4 h-4 text-teal-600" />
                  <span>Protected</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Non-Profit Coral Pledge */}
        {allDiverted && !pledged && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl mb-4 animate-in fade-in shadow-sm">
            <h5 className="text-xs font-serif font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              <span>Coral Reef Restoration Non-Profit Pledge</span>
            </h5>
            <p className="text-[11px] text-stone-600 leading-relaxed mb-3">
              By confirming this diversion, you allocate sponsored funding from our ad pool to the <strong>Coral Restoration Foundation</strong> to outplant 50 micro-fragment corals onto damaged nursery beds!
            </p>
            <button
              onClick={handleComplete}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Confirm Navigational Safe Zone & Pledge Coral Grant
            </button>
          </div>
        )}

        {pledged && (
          <div className="p-4 bg-teal-100 border border-teal-400 rounded-2xl mb-4 text-center text-xs text-teal-900 font-bold">
            🌊 All ships have navigated safely into offshore trenches! The coral polyps are glowing with life!
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs pt-3 border-t border-amber-200">
          <span className="flex items-center gap-1.5 text-teal-800 font-bold">
            <Sparkles className="w-4 h-4 text-teal-600" /> Reward: +380 Coral Pearl Coins & 100% Reef Flourish
          </span>
          {pledged ? (
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
