'use client';

import React from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { X, Compass, Waves, ArrowRight, HelpCircle } from 'lucide-react';

export default function NemoLostModal() {
  const {
    isNemoModalOpen,
    closeNemoModal,
    guideNemoHome,
  } = useGameState();

  if (!isNemoModalOpen) return null;

  const handleGuideHome = (travelToReef: boolean) => {
    sounds.playBloom();
    guideNemoHome(travelToReef);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/75 backdrop-blur-sm animate-in fade-in duration-200 font-pixel">
      <div className="relative w-full max-w-lg pixel-panel overflow-hidden text-[#2e1005] shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header - Retro Wooden Plank */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#78350f] border-2 border-[#fde68a] flex items-center justify-center p-1 shadow-inner">
              <img
                src="/assets/sprites/nemo.png"
                alt="Nemo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-pixel-heading text-xs sm:text-sm text-[#fde68a] tracking-wider">
                NEMO
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              closeNemoModal();
            }}
            className="p-1 pixel-btn-red text-[10px]"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-[9.5px] leading-relaxed text-[#451a03] bg-[#fcf6e8]">
          {/* Main Question Alert Banner */}
          <div className="p-4 pixel-card bg-[#e0f2fe] border-[#0284c7] flex items-center gap-3 text-[#0369a1]">
            <div className="w-9 h-9 bg-[#bae6fd] border border-[#0284c7] flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-[#0284c7]" />
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#075985] font-semibold leading-relaxed">
              What’s Nemo doing here? Clownfish aren’t found in lakes. Help direct Nemo back to his home.
            </p>
          </div>

          {/* Educational / Habitat Note */}
          <div className="p-3.5 pixel-card bg-[#fffbeb] border-[#d97706] space-y-1.5 text-[#78350f]">
            <div className="flex items-center gap-1.5 text-[#92400e] font-bold text-[9.5px]">
              <Compass className="w-3.5 h-3.5 text-[#d97706]" />
              <span>Coral Reef Habitat</span>
            </div>
            <p className="text-[9px] text-[#854d0e] leading-relaxed">
              Clownfish are saltwater marine fish that live in ocean coral reefs alongside sea anemones. Freshwater lakes are not their natural environment.
            </p>
          </div>

          {/* Action Choice Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => handleGuideHome(true)}
              className="flex-1 py-2.5 px-4 pixel-btn text-[#fffbeb] bg-[#0284c7] hover:bg-[#0369a1] border-[#075985] flex items-center justify-center gap-2 text-[10px] font-bold shadow-md cursor-pointer"
            >
              <Waves className="w-4 h-4 text-sky-200" />
              <span>Direct Nemo Home to Coral Reefs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                closeNemoModal();
              }}
              className="py-2.5 px-4 pixel-btn text-[#78350f] bg-[#fef3c7] hover:bg-[#fde68a] border-[#b45309] text-[9.5px] cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
