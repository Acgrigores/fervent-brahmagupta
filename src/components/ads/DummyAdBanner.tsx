'use client';

import React, { useState, useEffect } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { Info, Zap } from 'lucide-react';

interface EcoAd {
  id: string;
  sponsor: string;
  category: string;
  headline: string;
  body: string;
  icon: string;
  themeColor: string;
}

const ADS: EcoAd[] = [
  {
    id: 'bayer',
    sponsor: 'Bayer Crop Science',
    category: 'Field to Future Sponsor',
    headline: 'Field to Future: Precision Ag for a Hunger-Free, Sustainable World',
    body: 'Harnessing satellite data, biological crop protection, and pollinator corridors to help farmers grow more with fewer resources.',
    icon: '🌾',
    themeColor: '#eab308',
  },
  {
    id: 'patagonia',
    sponsor: 'Patagonia 1% For The Planet',
    category: 'Eco-Champion Partner',
    headline: '1% For The Planet: Grassroots Environmental Defense',
    body: 'Pledging 1% of sales to non-profits preserving endangered wild habitats and stopping climate degradation.',
    icon: '🏔️',
    themeColor: '#06b6d4',
  },
  {
    id: 'oceancleanup',
    sponsor: 'The Ocean Cleanup',
    category: 'Clean Waters Partner',
    headline: 'Intercepting River Plastics Before Reaching Marine Sanctuaries',
    body: 'Solar-powered Interceptors extract plastic debris from estuaries, keeping sea turtles and manatees safe.',
    icon: '🌊',
    themeColor: '#0284c7',
  },
  {
    id: 'ecosia',
    sponsor: 'Ecosia Eco Search',
    category: 'Reforestation Partner',
    headline: 'Planting Trees with Every Search You Make',
    body: 'Over 200 million native trees planted across biodiversity hotspots to revitalize degraded soils and watersheds.',
    icon: '🌳',
    themeColor: '#16a34a',
  },
];

export default function DummyAdBanner() {
  const { triggerAdBoost } = useGameState();
  const [adIndex, setAdIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [boostCooldown, setBoostCooldown] = useState(false);

  // Rotate ads every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % ADS.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const currentAd = ADS[adIndex];

  const handleBoostClick = () => {
    if (boostCooldown) return;
    triggerAdBoost(currentAd.sponsor);
    setBoostCooldown(true);
    setTimeout(() => setBoostCooldown(false), 8000);
  };

  return (
    <>
      {/* Bottom Sticky Ad Banner */}
      <div className="w-full bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-md px-4 py-2.5 z-30 flex items-center justify-between gap-4 select-none">
        {/* Ad Tag & Icon */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              AD
            </span>
            <span className="text-2xl">{currentAd.icon}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white truncate">{currentAd.headline}</h4>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline-block"
                style={{ backgroundColor: `${currentAd.themeColor}22`, color: currentAd.themeColor }}
              >
                {currentAd.sponsor}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate hidden md:block">{currentAd.body}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleBoostClick}
            disabled={boostCooldown}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              boostCooldown
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black shadow-emerald-950/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{boostCooldown ? 'Boost Claimed' : 'Claim Ad Eco-Boost (+150 Coins)'}</span>
          </button>

          <button
            onClick={() => setShowInfo(true)}
            title="How Ad Revenue Funds Conservation"
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>🌱</span>
                <span>How Free-to-Play Games Fund Real Conservation</span>
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <p>
                In <strong>Field to Future</strong>, you don't need real money to make a tangible global impact.
              </p>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1.5">
                <div className="font-bold text-emerald-400">1. Play & Learn:</div>
                <p className="text-zinc-400">Every minute you spend exploring biomes and talking with endangered animals earns Biome Coins.</p>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1.5">
                <div className="font-bold text-amber-400">2. Sponsored Ad Revenue Pool:</div>
                <p className="text-zinc-400">
                  Ad impressions and clicks generate simulated corporate sponsorship credits from partners like Bayer Crop Science and environmental foundations.
                </p>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1.5">
                <div className="font-bold text-cyan-400">3. Direct Real-World Allocations:</div>
                <p className="text-zinc-400">
                  You choose in your Impact Profile where funds go—protecting Red Panda canopies, planting monarch milkweed corridors, or restoring coral reefs!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInfo(false)}
              className="mt-5 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all"
            >
              Got it, let's keep playing!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
