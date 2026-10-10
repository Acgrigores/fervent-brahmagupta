'use client';

import React, { useState, useEffect } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { Info, Zap, Sprout } from 'lucide-react';

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
    themeColor: '#b45309',
  },
  {
    id: 'patagonia',
    sponsor: 'Patagonia 1% For The Planet',
    category: 'Eco-Champion Partner',
    headline: '1% For The Planet: Grassroots Environmental Defense',
    body: 'Pledging 1% of sales to non-profits preserving endangered wild habitats and stopping climate degradation.',
    icon: '🏔️',
    themeColor: '#0e7490',
  },
  {
    id: 'oceancleanup',
    sponsor: 'The Ocean Cleanup',
    category: 'Clean Waters Partner',
    headline: 'Intercepting River Plastics Before Reaching Marine Sanctuaries',
    body: 'Solar-powered Interceptors extract plastic debris from estuaries, keeping sea turtles and manatees safe.',
    icon: '🌊',
    themeColor: '#0369a1',
  },
  {
    id: 'ecosia',
    sponsor: 'Ecosia Eco Search',
    category: 'Reforestation Partner',
    headline: 'Planting Trees with Every Search You Make',
    body: 'Over 200 million native trees planted across biodiversity hotspots to revitalize degraded soils and watersheds.',
    icon: '🌳',
    themeColor: '#15803d',
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
      {/* Bottom Sticky Ad Banner - Warm Light Mode */}
      <div className="w-full bg-white/95 border-t border-amber-200/80 backdrop-blur-md px-4 py-2.5 z-30 flex items-center justify-between gap-4 select-none shadow-sm text-stone-900">
        {/* Ad Tag & Icon */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
              AD
            </span>
            <span className="text-2xl">{currentAd.icon}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold font-serif text-stone-900 truncate">{currentAd.headline}</h4>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline-block border border-amber-300"
                style={{ backgroundColor: `${currentAd.themeColor}15`, color: currentAd.themeColor }}
              >
                {currentAd.sponsor}
              </span>
            </div>
            <p className="text-[11px] text-stone-600 truncate hidden md:block">{currentAd.body}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleBoostClick}
            disabled={boostCooldown}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
              boostCooldown
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white shadow-emerald-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{boostCooldown ? 'Boost Claimed' : 'Claim Ad Eco-Boost (+150 Coins)'}</span>
          </button>

          <button
            onClick={() => setShowInfo(true)}
            title="How Ad Revenue Funds Conservation"
            className="p-1.5 text-stone-600 hover:text-stone-900 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-300 transition-colors"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info Modal - Light Mode */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border-2 border-amber-900/40 rounded-3xl p-6 shadow-2xl text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2 font-serif">
                <Sprout className="w-5 h-5 text-emerald-600" />
                <span>How Free-to-Play Games Fund Real Conservation</span>
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-stone-400 hover:text-stone-700 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-700 leading-relaxed">
              <p>
                In <strong>Field to Future</strong>, you don&apos;t need real money to make a tangible global impact.
              </p>
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1">
                <div className="font-bold text-emerald-800 font-serif">1. Play & Learn:</div>
                <p className="text-stone-600">Every minute you spend exploring biomes and talking with endangered animals earns Biome Coins.</p>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1">
                <div className="font-bold text-amber-900 font-serif">2. Sponsored Ad Revenue Pool:</div>
                <p className="text-stone-600">
                  Ad impressions and clicks generate simulated corporate sponsorship credits from partners like Bayer Crop Science and environmental foundations.
                </p>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1">
                <div className="font-bold text-cyan-800 font-serif">3. Direct Real-World Allocations:</div>
                <p className="text-stone-600">
                  You choose in your Impact Profile where funds go—protecting Red Panda canopies, planting monarch milkweed corridors, or restoring coral reefs!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInfo(false)}
              className="mt-5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
            >
              Got it, let&apos;s keep playing!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
