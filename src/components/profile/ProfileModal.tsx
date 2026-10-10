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
  Globe,
  RotateCcw,
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
    icon: '/assets/sprites/butterfly.png',
    matchSponsor: 'Bayer Crop Science Grant Pool',
  },
  {
    id: 'wwf_canopy',
    name: 'World Wildlife Fund (WWF) - Red Panda Canopy Defense',
    mission: 'Guarding cloud forest bamboo habitats from climate-driven wildfires and establishing community firebreaks.',
    cause: 'Forest Fire Resilience & Endangered Species',
    icon: '/assets/sprites/red_panda.png',
    matchSponsor: '1% for the Planet Match',
  },
  {
    id: 'ocean_cleanup',
    name: 'The Ocean Cleanup & Freshwater Interceptor Project',
    mission: 'Deploying solar river interceptors to block plastic waste before it pollutes manatee lagoons and oceanic reefs.',
    cause: 'Marine & Wetland Debris Diversion',
    icon: '/assets/sprites/manatee.png',
    matchSponsor: 'EcoAd Ad Revenue Pool',
  },
  {
    id: 'polar_bears_intl',
    name: 'Polar Bears International - Arctic Sea Ice Action',
    mission: 'Advocating to retire coal and industrial emissions, funding real-time radar tracking on sea ice floes.',
    cause: 'Cryosphere Climate Tech & Clean Energy',
    icon: '/assets/sprites/polar_bear.png',
    matchSponsor: 'Clean Energy Foundation',
  },
  {
    id: 'xerces_pollinator',
    name: 'Xerces Society for Invertebrate Conservation',
    mission: 'Restoring native milkweed nectar pathways for migrating Monarch butterflies across agricultural corridors.',
    cause: 'Pollinator Sanctuaries & Biodiversity',
    icon: '/assets/sprites/butterfly.png',
    matchSponsor: 'Bayer Pollinator Pledge',
  },
  {
    id: 'coral_restoration',
    name: 'Coral Restoration Foundation',
    mission: 'Outplanting heat-resilient micro-fragment corals onto barrier reefs and educating maritime vessel corridors.',
    cause: 'Oceanic Coral Nurseries & Marine Preserves',
    icon: '/assets/sprites/sea_turtle.png',
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
    resetGame,
  } = useGameState();

  const [activeTab, setActiveTab] = useState<'coins' | 'badges' | 'donations' | 'actions'>('coins');
  const [allocatedCharity, setAllocatedCharity] = useState<string | null>(null);

  if (!isProfileOpen) return null;

  const handleAllocateDonation = (charity: CharityOrg) => {
    sounds.playCoin();
    sounds.playBloom();
    setAllocatedCharity(charity.name);
    setNotification(`Allocated $${donationPoolDollars.toFixed(2)} USD in sponsored funding to ${charity.name}!`);
    setTimeout(() => setNotification(null), 5000);
  };

  const coinEntries = [
    { key: 'forest', name: 'Amber Bamboo Coin', sprite: '/assets/sprites/red_panda.png', balance: coins.forest, animal: 'Paku the Red Panda', bg: 'bg-amber-50 border-amber-300 text-amber-950' },
    { key: 'lake', name: 'Azure Ripple Coin', sprite: '/assets/sprites/manatee.png', balance: coins.lake, animal: 'Mo the Manatee', bg: 'bg-sky-50 border-sky-300 text-sky-950' },
    { key: 'tundra', name: 'Frost Auric Coin', sprite: '/assets/sprites/polar_bear.png', balance: coins.tundra, animal: 'Nanuk the Polar Bear', bg: 'bg-blue-50 border-blue-300 text-blue-950' },
    { key: 'grasslands', name: 'Golden Pollen Coin', sprite: '/assets/sprites/butterfly.png', balance: coins.grasslands, animal: 'Aura the Monarch Butterfly', bg: 'bg-yellow-50 border-yellow-300 text-yellow-950' },
    { key: 'desert', name: 'Sunfire Dune Coin', sprite: '/assets/sprites/cheetah.png', balance: coins.desert, animal: 'Zuri the Cheetah', bg: 'bg-orange-50 border-orange-300 text-orange-950' },
    { key: 'reefs', name: 'Coral Pearl Coin', sprite: '/assets/sprites/sea_turtle.png', balance: coins.reefs, animal: 'Coralia the Sea Turtle', bg: 'bg-teal-50 border-teal-300 text-teal-950' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-[#fffdfa] border-4 border-amber-950/20 rounded-3xl p-6 shadow-2xl text-stone-900 max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Vintage Wooden Plaque Header */}
        <div className="relative flex items-center justify-between bg-gradient-to-r from-[#78350f] via-[#92400e] to-[#78350f] text-[#fffbeb] p-4 rounded-2xl border-2 border-[#451a03] shadow-md mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-900/60 border border-amber-600/50 flex items-center justify-center shadow-inner">
              <Globe className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-100 tracking-wide">
                Eco-Impact Portfolio & Treasury
              </h3>
              <p className="text-xs text-amber-200/90 font-sans">
                Track Biome Coins • Allocate Sponsored Donations • View Earned Badges
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsProfileOpen(false)}
            className="p-1.5 rounded-full bg-amber-950/40 hover:bg-amber-950/70 text-amber-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="grid grid-cols-3 gap-3 mb-5 p-4 bg-[#fefce8] rounded-2xl border border-amber-200/80 shadow-sm">
          <div className="text-center border-r border-amber-200 pr-2">
            <span className="text-[11px] font-bold text-amber-900/70 uppercase tracking-wide">Total Biome Coins</span>
            <div className="text-xl font-serif font-bold text-emerald-700 flex items-center justify-center gap-1.5 mt-0.5">
              <Coins className="w-5 h-5 text-amber-600" />
              <span>{totalCoins.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-center border-r border-amber-200 px-2">
            <span className="text-[11px] font-bold text-amber-900/70 uppercase tracking-wide">Donation Pool</span>
            <div className="text-xl font-serif font-bold text-amber-800 flex items-center justify-center gap-1 mt-0.5">
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              <span>${donationPoolDollars.toFixed(2)} USD</span>
            </div>
            <span className="text-[9px] text-amber-950/60">Funded by Bayer & Sponsors</span>
          </div>

          <div className="text-center pl-2">
            <span className="text-[11px] font-bold text-amber-900/70 uppercase tracking-wide">World Flourish Index</span>
            <div className="text-xl font-serif font-bold text-emerald-700 mt-0.5">
              {globalFlourish}% Restored
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1.5 bg-amber-100/70 rounded-2xl border border-amber-200 mb-5">
          <button
            onClick={() => setActiveTab('coins')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'coins'
                ? 'bg-[#78350f] text-white shadow-sm font-serif'
                : 'text-stone-700 hover:text-stone-900 hover:bg-white/50'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Biome Coins ({coinEntries.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'badges'
                ? 'bg-[#78350f] text-white shadow-sm font-serif'
                : 'text-stone-700 hover:text-stone-900 hover:bg-white/50'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Badges ({badges.filter((b) => b.unlocked).length}/{badges.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('donations')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'donations'
                ? 'bg-[#78350f] text-white shadow-sm font-serif'
                : 'text-stone-700 hover:text-stone-900 hover:bg-white/50'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Allocate Donations</span>
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'actions'
                ? 'bg-[#78350f] text-white shadow-sm font-serif'
                : 'text-stone-700 hover:text-stone-900 hover:bg-white/50'
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
                  className={`p-4 rounded-2xl border ${c.bg} flex items-center justify-between shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    <img src={c.sprite} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-amber-900/20 shadow-sm" />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 font-serif">{c.name}</h4>
                      <p className="text-[11px] text-stone-600">{c.animal}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-stone-900 font-serif">{c.balance}</div>
                    <div className="text-[10px] text-stone-500 font-medium">Coins</div>
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
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
                      : 'bg-stone-50 border-stone-200 opacity-60 grayscale'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Award className={`w-5 h-5 ${b.unlocked ? 'text-amber-600' : 'text-stone-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-stone-900 font-serif">{b.title}</h4>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-amber-100 text-amber-900 font-bold border border-amber-200">
                        {b.rarity}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">{b.description}</p>
                    {b.unlocked && (
                      <div className="text-[10px] text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Unlocked {b.unlockedAt}
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
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-stone-700 leading-relaxed">
                <strong>How Free-to-Play Funds Real Conservation:</strong> Every coin you earn through gameplay, talking with animals, and viewing sponsored ads translates into verified corporate match dollars provided by <strong>Bayer Crop Science & Eco-Partners</strong>. Choose where to allocate your balance!
              </div>

              {CHARITIES.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img src={c.icon} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-amber-900/20" />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 font-serif">{c.name}</h4>
                      <p className="text-[11px] text-stone-600 mt-0.5">{c.mission}</p>
                      <div className="text-[10px] text-emerald-700 font-bold mt-1">
                        Match Sponsor: {c.matchSponsor}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAllocateDonation(c)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex-shrink-0"
                  >
                    Allocate ${donationPoolDollars.toFixed(2)}
                  </button>
                </div>
              ))}

              {allocatedCharity && (
                <div className="p-3 bg-emerald-100 border border-emerald-400 rounded-xl text-center text-xs text-emerald-800 font-bold">
                  🎉 You have successfully pledged ${donationPoolDollars.toFixed(2)} to {allocatedCharity}!
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACTIONS LOG */}
          {activeTab === 'actions' && (
            <div className="space-y-3">
              {actions.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-500 font-medium">
                  No actions completed yet. Quench wildfire embers, sort waste, sign petitions, or configure smart farming to record your real-world impact!
                </div>
              ) : (
                actions.map((act) => (
                  <div key={act.id} className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-stone-900 font-serif">{act.title}</h4>
                      <span className="text-[10px] text-stone-500">{act.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-semibold">{act.impactMetrics}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Reset Progress Button */}
        <div className="border-t border-amber-200/70 pt-4 mt-4 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('Reset all progress, coins, badges, and restoration back to day 1?')) {
                resetGame();
                setIsProfileOpen(false);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-300 text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Progress</span>
          </button>

          <button
            onClick={() => setIsProfileOpen(false)}
            className="px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
