'use client';

import React, { useState, useEffect } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { Info, Zap, Sprout, X } from 'lucide-react';

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
      {/* Bottom Sticky Ad Banner - Pixel Farm Theme (Kept above modals so it never blurs out on focus) */}
      <div className="relative z-[60] w-full bg-[#5c2c16] border-t-4 border-[#2e1005] px-3 py-2 flex items-center justify-between gap-3 select-none text-[#fffbeb] font-pixel shadow-md">
        {/* Ad Tag & Icon */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[8px] uppercase font-bold px-1 py-0.5 bg-[#b45309] border border-[#fde68a] text-[#fffbeb]">
              AD
            </span>
            <span className="text-xl">{currentAd.icon}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-[10px] font-bold text-[#fde68a] truncate">{currentAd.headline}</h4>
              <span className="text-[8px] font-bold px-1.5 py-0.2 bg-[#2e1005] text-[#86efac] border border-[#15803d] hidden sm:inline-block">
                {currentAd.sponsor}
              </span>
            </div>
            <p className="text-[8.5px] text-[#fffbeb]/80 truncate hidden md:block">{currentAd.body}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleBoostClick}
            disabled={boostCooldown}
            className={`pixel-btn-green px-2.5 py-1 text-[9px] font-bold flex items-center gap-1 ${
              boostCooldown ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Zap className="w-3 h-3 text-[#fde68a]" />
            <span>{boostCooldown ? 'BOOST CLAIMED' : 'ECO-BOOST (+150 COINS)'}</span>
          </button>

          <button
            onClick={() => setShowInfo(true)}
            title="How Ad Revenue Funds Conservation"
            className="pixel-btn p-1 text-[9px]"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info Modal - Pixel Art Farm Theme */}
      {showInfo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel">
          <div className="relative w-full max-w-md pixel-panel p-5 text-[#2e1005] shadow-2xl">
            <div className="flex items-center justify-between border-b-2 border-[#5c2c16] pb-2.5 mb-3">
              <h3 className="font-pixel-heading text-xs text-[#5c2c16] flex items-center gap-2">
                <Sprout className="w-4 h-4 text-[#15803d]" />
                <span>SPONSOR IMPACT POOL</span>
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1 pixel-btn-red text-[9px]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 text-[9px] leading-relaxed text-[#451a03]">
              <p>
                In <strong>Field to Future</strong>, ad interactions simulate corporate sponsorship match pools from <strong>Bayer Crop Science & Eco-Partners</strong>.
              </p>

              <div className="p-2.5 pixel-card space-y-1">
                <div className="font-bold text-[#15803d]">1. PLAY & RESTORE:</div>
                <p className="text-[#5c2c16] text-[8px]">Every minute spent exploring biomes and solving crop crises earns Biome Coins.</p>
              </div>

              <div className="p-2.5 pixel-card space-y-1">
                <div className="font-bold text-[#b45309]">2. CORPORATE SPONSOR MATCH:</div>
                <p className="text-[#5c2c16] text-[8px]">Sponsors fund grants for verified wildlife and agriculture initiatives.</p>
              </div>

              <div className="p-2.5 pixel-card space-y-1">
                <div className="font-bold text-[#0369a1]">3. YOU CHOOSE THE CAUSE:</div>
                <p className="text-[#5c2c16] text-[8px]">In your portfolio, pledge coins to Monarch corridors, Red Pandas, or Reef preservation!</p>
              </div>

              <button
                onClick={() => setShowInfo(false)}
                className="pixel-btn-green w-full py-2 text-[10px] font-bold"
              >
                KEEP PLAYING!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
