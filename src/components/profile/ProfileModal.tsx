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
    { key: 'forest', name: 'Amber Bamboo Coin', sprite: '/assets/sprites/red_panda.png', balance: coins.forest, animal: 'Paku the Red Panda', bg: 'bg-[#fffbf2]' },
    { key: 'lake', name: 'Azure Ripple Coin', sprite: '/assets/sprites/manatee.png', balance: coins.lake, animal: 'Mo the Manatee', bg: 'bg-[#f0f9ff]' },
    { key: 'tundra', name: 'Frost Auric Coin', sprite: '/assets/sprites/polar_bear.png', balance: coins.tundra, animal: 'Nanuk the Polar Bear', bg: 'bg-[#eff6ff]' },
    { key: 'grasslands', name: 'Golden Pollen Coin', sprite: '/assets/sprites/butterfly.png', balance: coins.grasslands, animal: 'Aura the Monarch Butterfly', bg: 'bg-[#fefce8]' },
    { key: 'desert', name: 'Sunfire Dune Coin', sprite: '/assets/sprites/cheetah.png', balance: coins.desert, animal: 'Zuri the Cheetah', bg: 'bg-[#fff7ed]' },
    { key: 'reefs', name: 'Coral Pearl Coin', sprite: '/assets/sprites/sea_turtle.png', balance: coins.reefs, animal: 'Coralia the Sea Turtle', bg: 'bg-[#f0fdfa]' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel">
      <div className="relative w-full max-w-3xl pixel-panel p-5 text-[#2e1005] max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Pixel Wood Plaque Header */}
        <div className="flex items-center justify-between border-b-2 border-[#5c2c16] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#78350f] border-2 border-[#fde68a] flex items-center justify-center shadow-inner">
              <Globe className="w-4 h-4 text-[#fde68a]" />
            </div>
            <div>
              <h3 className="font-pixel-heading text-xs text-[#5c2c16]">
                FARM TREASURY & IMPACT
              </h3>
              <p className="text-[8.5px] text-[#78350f]">
                Coins • Sponsored Donations • Badges
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsProfileOpen(false)}
            className="p-1 pixel-btn-red text-[9px]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="grid grid-cols-3 gap-2.5 mb-4 p-3 bg-[#fefce8] border-2 border-[#5c2c16]">
          <div className="text-center border-r-2 border-[#5c2c16] pr-2">
            <span className="text-[8.5px] text-[#78350f] uppercase">BIOME COINS</span>
            <div className="text-sm font-bold text-[#15803d] flex items-center justify-center gap-1 mt-0.5">
              <Coins className="w-3.5 h-3.5 text-[#b45309]" />
              <span>{totalCoins.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-center border-r-2 border-[#5c2c16] px-2">
            <span className="text-[8.5px] text-[#78350f] uppercase">DONATION POOL</span>
            <div className="text-sm font-bold text-[#b45309] flex items-center justify-center gap-1 mt-0.5">
              <Heart className="w-3 h-3 text-[#b91c1c] fill-[#b91c1c]" />
              <span>${donationPoolDollars.toFixed(2)}</span>
            </div>
            <span className="text-[7.5px] text-[#78350f]/80">Bayer Sponsored</span>
          </div>

          <div className="text-center pl-2">
            <span className="text-[8.5px] text-[#78350f] uppercase">FLOURISH INDEX</span>
            <div className="text-sm font-bold text-[#15803d] mt-0.5">
              {globalFlourish}%
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1.5 p-1 bg-[#ecd9ba] border-2 border-[#5c2c16] mb-4">
          <button
            onClick={() => setActiveTab('coins')}
            className={`flex-1 py-1.5 text-[9px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'coins'
                ? 'bg-[#5c2c16] text-[#fffbeb] shadow-sm'
                : 'text-[#5c2c16] hover:bg-[#fffbf2]/60'
            }`}
          >
            <Coins className="w-3 h-3" />
            <span>COINS ({coinEntries.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-1.5 text-[9px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'badges'
                ? 'bg-[#5c2c16] text-[#fffbeb] shadow-sm'
                : 'text-[#5c2c16] hover:bg-[#fffbf2]/60'
            }`}
          >
            <Award className="w-3 h-3" />
            <span>BADGES ({badges.filter((b) => b.unlocked).length}/{badges.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('donations')}
            className={`flex-1 py-1.5 text-[9px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'donations'
                ? 'bg-[#5c2c16] text-[#fffbeb] shadow-sm'
                : 'text-[#5c2c16] hover:bg-[#fffbf2]/60'
            }`}
          >
            <Heart className="w-3 h-3" />
            <span>DONATIONS</span>
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 py-1.5 text-[9px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'actions'
                ? 'bg-[#5c2c16] text-[#fffbeb] shadow-sm'
                : 'text-[#5c2c16] hover:bg-[#fffbf2]/60'
            }`}
          >
            <FileCheck className="w-3 h-3" />
            <span>LOG ({actions.length})</span>
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto">
          {/* TAB 1: BIOME COINS */}
          {activeTab === 'coins' && (
            <div className="grid grid-cols-2 gap-2.5">
              {coinEntries.map((c) => (
                <div
                  key={c.key}
                  className={`p-3 pixel-card ${c.bg} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2.5">
                    <img src={c.sprite} alt={c.name} className="w-8 h-8 object-cover border-2 border-[#5c2c16]" />
                    <div>
                      <h4 className="text-[9px] font-bold text-[#2e1005]">{c.name}</h4>
                      <p className="text-[8px] text-[#78350f]">{c.animal}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#2e1005]">{c.balance}</div>
                    <div className="text-[7.5px] text-[#78350f]">Coins</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: BADGES */}
          {activeTab === 'badges' && (
            <div className="grid grid-cols-2 gap-2.5">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-3 pixel-card flex items-start gap-2.5 ${
                    b.unlocked
                      ? 'bg-[#f0fdf4] border-[#15803d]'
                      : 'bg-[#fffbf2] opacity-60 grayscale'
                  }`}
                >
                  <div className="w-8 h-8 bg-[#fef3c7] border-2 border-[#5c2c16] flex items-center justify-center flex-shrink-0">
                    <Award className={`w-4 h-4 ${b.unlocked ? 'text-[#b45309]' : 'text-stone-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[9px] font-bold text-[#2e1005]">{b.title}</h4>
                      <span className="text-[7.5px] px-1 py-0.2 bg-[#fef08a] border border-[#ca8a04] text-[#854d0e] font-bold uppercase">
                        {b.rarity}
                      </span>
                    </div>
                    <p className="text-[8px] text-[#5c2c16] mt-0.5 leading-normal">{b.description}</p>
                    {b.unlocked && (
                      <div className="text-[7.5px] text-[#15803d] font-bold mt-1 flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5 text-[#16a34a]" /> Unlocked {b.unlockedAt}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: DONATION ALLOCATION */}
          {activeTab === 'donations' && (
            <div className="space-y-2.5">
              <div className="p-2.5 pixel-card bg-[#fefce8] text-[8.5px] text-[#5c2c16] leading-normal">
                <strong>Free-to-Play Funds Real Conservation:</strong> Coins earned through gameplay translate into real corporate match funding from <strong>Bayer Crop Science & Partners</strong>.
              </div>

              {CHARITIES.map((c) => (
                <div
                  key={c.id}
                  className="p-3 pixel-card flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={c.icon} alt={c.name} className="w-8 h-8 object-cover border-2 border-[#5c2c16]" />
                    <div>
                      <h4 className="text-[9px] font-bold text-[#2e1005]">{c.name}</h4>
                      <p className="text-[8px] text-[#78350f] mt-0.5 leading-tight">{c.mission}</p>
                      <div className="text-[7.5px] text-[#15803d] font-bold mt-0.5">
                        Sponsor: {c.matchSponsor}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAllocateDonation(c)}
                    className="pixel-btn-green px-3 py-1.5 text-[8.5px] font-bold flex-shrink-0"
                  >
                    Pledge ${donationPoolDollars.toFixed(2)}
                  </button>
                </div>
              ))}

              {allocatedCharity && (
                <div className="p-2.5 bg-[#dcfce7] border-2 border-[#16a34a] text-center text-[9px] text-[#15803d] font-bold">
                  ✓ Pledged ${donationPoolDollars.toFixed(2)} to {allocatedCharity}!
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACTIONS LOG */}
          {activeTab === 'actions' && (
            <div className="space-y-2">
              {actions.length === 0 ? (
                <div className="text-center py-6 text-[9px] text-[#78350f]">
                  No actions completed yet. Complete biome quests to log your real-world conservation impact!
                </div>
              ) : (
                actions.map((act) => (
                  <div key={act.id} className="p-2.5 pixel-card">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-[9px] font-bold text-[#2e1005]">{act.title}</h4>
                      <span className="text-[7.5px] text-[#78350f]">{act.timestamp}</span>
                    </div>
                    <p className="text-[8px] text-[#15803d] font-bold">{act.impactMetrics}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer (No reset button here; kept only in Settings) */}
        <div className="border-t-2 border-[#5c2c16] pt-3 mt-3 flex items-center justify-end">
          <button
            onClick={() => setIsProfileOpen(false)}
            className="pixel-btn px-4 py-1.5 text-[9px] font-bold"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
