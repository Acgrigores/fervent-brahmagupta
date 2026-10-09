'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import {
  X,
  Coins,
  Award,
  Heart,
  FileCheck,
  CheckCircle,
} from 'lucide-react';

interface CharityOrg {
  id: string;
  name: string;
  mission: string;
  cause: string;
  icon: string;
  matchSponsor: string;
}

const CHARITIES: CharityOrg[] = [
  {
    id: 'bayer_farming',
    name: 'Bayer ForwardFarming & Soil Health Initiative',
    mission: 'Empowering smallholder and family farmers with precision regenerative agriculture, cover crops, and pollinator corridors.',
    cause: 'Sustainable Food Security & Soil Conservation',
    icon: '🌾',
    matchSponsor: 'Bayer Crop Science Grant Pool',
  },
  {
    id: 'wwf_canopy',
    name: 'World Wildlife Fund (WWF) - Red Panda Canopy Defense',
    mission: 'Guarding cloud forest bamboo habitats from climate-driven wildfires and establishing community firebreaks.',
    cause: 'Forest Fire Resilience & Endangered Species',
    icon: '🎋',
    matchSponsor: '1% for the Planet Match',
  },
  {
    id: 'ocean_cleanup',
    name: 'The Ocean Cleanup & Freshwater Interceptor Project',
    mission: 'Deploying solar river interceptors to block plastic waste before it pollutes manatee lagoons and oceanic reefs.',
    cause: 'Marine & Wetland Debris Diversion',
    icon: '🦭',
    matchSponsor: 'EcoAd Ad Revenue Pool',
  },
  {
    id: 'polar_bears_intl',
    name: 'Polar Bears International - Arctic Sea Ice Action',
    mission: 'Advocating to retire coal and industrial emissions, funding real-time radar tracking on sea ice floes.',
    cause: 'Cryosphere Climate Tech & Clean Energy',
    icon: '🐻‍❄️',
    matchSponsor: 'Clean Energy Foundation',
  },
  {
    id: 'xerces_pollinator',
    name: 'Xerces Society for Invertebrate Conservation',
    mission: 'Restoring native milkweed nectar pathways for migrating Monarch butterflies across agricultural corridors.',
    cause: 'Pollinator Sanctuaries & Biodiversity',
    icon: '🦋',
    matchSponsor: 'Bayer Pollinator Pledge',
  },
  {
    id: 'coral_restoration',
    name: 'Coral Restoration Foundation',
    mission: 'Outplanting heat-resilient micro-fragment corals onto barrier reefs and educating maritime vessel corridors.',
    cause: 'Oceanic Coral Nurseries & Marine Preserves',
    icon: '🪸',
    matchSponsor: 'Global Reef Initiative',
  },
];

export default function ProfileModal() {
  const {
    isProfileOpen,
    setIsProfileOpen,
    coins,
    totalCoins,
    donationPoolDollars,
    badges,
    actions,
    globalFlourish,
    setNotification,
  } = useGameState();

  const [activeTab, setActiveTab] = useState<'coins' | 'badges' | 'donations' | 'actions'>('coins');
  const [allocatedCharity, setAllocatedCharity] = useState<string | null>(null);

  if (!isProfileOpen) return null;

  const handleAllocateDonation = (charity: CharityOrg) => {
    sounds.playCoin();
    sounds.playBloom();
    setAllocatedCharity(charity.name);
    setNotification(`💖 Allocated $${donationPoolDollars.toFixed(2)} USD in sponsored funding to ${charity.name}!`);
    setTimeout(() => setNotification(null), 5000);
  };

  const coinEntries = [
    { key: 'forest', name: 'Amber Bamboo Coin', icon: '🎋', balance: coins.forest, animal: 'Paku the Red Panda', color: 'from-amber-950 to-emerald-950 border-amber-600' },
    { key: 'lake', name: 'Azure Ripple Coin', icon: '💧', balance: coins.lake, animal: 'Mo the Manatee', color: 'from-cyan-950 to-blue-950 border-cyan-500' },
    { key: 'tundra', name: 'Frost Auric Coin', icon: '❄️', balance: coins.tundra, animal: 'Nanuk the Polar Bear', color: 'from-sky-950 to-indigo-950 border-sky-400' },
    { key: 'grasslands', name: 'Golden Pollen Coin', icon: '🌻', balance: coins.grasslands, animal: 'Aura the Monarch Butterfly', color: 'from-yellow-950 to-amber-950 border-yellow-500' },
    { key: 'desert', name: 'Sunfire Dune Coin', icon: '⚡', balance: coins.desert, animal: 'Zuri the Cheetah', color: 'from-orange-950 to-red-950 border-orange-500' },
    { key: 'reefs', name: 'Coral Pearl Coin', icon: '🪸', balance: coins.reefs, animal: 'Coralia the Sea Turtle', color: 'from-teal-950 to-blue-950 border-teal-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-2xl shadow-lg shadow-emerald-950/60">
              🌍
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Eco-Impact Portfolio & Treasury</h3>
              <p className="text-xs text-zinc-400">
                Track Biome Coins • Allocate Sponsored Donations • View Earned Badges
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsProfileOpen(false)}
            className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="grid grid-cols-3 gap-3 mb-5 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
          <div className="text-center border-r border-zinc-800/80 pr-2">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wide">Total Biome Coins</span>
            <div className="text-xl font-bold text-emerald-400 flex items-center justify-center gap-1.5 mt-0.5">
              <Coins className="w-5 h-5" />
              <span>{totalCoins.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-center border-r border-zinc-800/80 px-2">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wide">Sponsored Donation Pool</span>
            <div className="text-xl font-bold text-cyan-400 flex items-center justify-center gap-1 mt-0.5">
              <Heart className="w-4 h-4 text-red-400 fill-red-400" />
              <span>${donationPoolDollars.toFixed(2)} USD</span>
            </div>
            <span className="text-[9px] text-zinc-500">Funded by Bayer & Ad Sponsors</span>
          </div>

          <div className="text-center pl-2">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wide">World Flourish Index</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5">
              {globalFlourish}% Restored
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 bg-zinc-950 rounded-2xl border border-zinc-800 mb-5">
          <button
            onClick={() => setActiveTab('coins')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'coins' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Biome Coins ({coinEntries.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'badges' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Badges ({badges.filter((b) => b.unlocked).length}/{badges.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('donations')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'donations' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Allocate Donations</span>
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'actions' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Action Log ({actions.length})</span>
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto">
          {/* TAB 1: BIOME COINS */}
          {activeTab === 'coins' && (
            <div className="grid grid-cols-2 gap-3">
              {coinEntries.map((c) => (
                <div
                  key={c.key}
                  className={`p-4 rounded-2xl border bg-gradient-to-br ${c.color} flex items-center justify-between shadow-lg`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl filter drop-shadow">{c.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{c.name}</h4>
                      <p className="text-[11px] text-zinc-300">{c.animal}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-white">{c.balance}</div>
                    <div className="text-[10px] text-zinc-400">Coins</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: BADGES */}
          {activeTab === 'badges' && (
            <div className="grid grid-cols-2 gap-3">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                    b.unlocked
                      ? 'bg-zinc-950 border-emerald-500/80 shadow-lg shadow-emerald-950/40'
                      : 'bg-zinc-950/40 border-zinc-800 opacity-50 grayscale'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-2xl flex-shrink-0">
                    {b.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{b.title}</h4>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-zinc-800 text-zinc-300">
                        {b.rarity}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{b.description}</p>
                    {b.unlocked && (
                      <div className="text-[10px] text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Unlocked {b.unlockedAt}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: DONATION ALLOCATION */}
          {activeTab === 'donations' && (
            <div className="space-y-3">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                💡 <strong>How Free-to-Play Funds Real Conservation:</strong> Every coin you earn through gameplay, talking with animals, and viewing sponsored ads translates into verified corporate match dollars provided by <strong>Bayer Crop Science & Eco-Partners</strong>. Choose where to allocate your balance!
              </div>

              {CHARITIES.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{c.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{c.name}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{c.mission}</p>
                      <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                        Match Sponsor: {c.matchSponsor}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAllocateDonation(c)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex-shrink-0"
                  >
                    Allocate ${donationPoolDollars.toFixed(2)}
                  </button>
                </div>
              ))}

              {allocatedCharity && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/80 rounded-xl text-center text-xs text-emerald-300 font-semibold">
                  🎉 You have successfully pledged ${donationPoolDollars.toFixed(2)} to {allocatedCharity}!
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACTIONS LOG */}
          {activeTab === 'actions' && (
            <div className="space-y-3">
              {actions.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No actions completed yet. Quench wildfire embers, sort waste, sign petitions, or configure smart farming to record your real-world impact!
                </div>
              ) : (
                actions.map((act) => (
                  <div key={act.id} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-white">{act.title}</h4>
                      <span className="text-[10px] text-zinc-500">{act.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-emerald-400 font-medium">{act.impactMetrics}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
