'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { X, Droplets, Sprout, CheckCircle, Sparkles } from 'lucide-react';

export default function WildfireQuenchModal() {
  const { activeQuestModal, closeQuestModal, completeQuest } = useGameState();
  const [quenchedSpots, setQuenchedSpots] = useState<number[]>([]);
  const [plantedSpots, setPlantedSpots] = useState<number[]>([]);
  const [step, setStep] = useState<'quench' | 'plant' | 'done'>('quench');

  if (activeQuestModal !== 'wildfire_quench') return null;

  const totalSpots = 6;

  const handleSpotClick = (index: number) => {
    if (step === 'quench') {
      if (!quenchedSpots.includes(index)) {
        sounds.playWaterSplash();
        const updated = [...quenchedSpots, index];
        setQuenchedSpots(updated);
        if (updated.length === totalSpots) {
          setTimeout(() => {
            sounds.playBloom();
            setStep('plant');
          }, 400);
        }
      }
    } else if (step === 'plant') {
      if (!plantedSpots.includes(index)) {
        sounds.playCoin();
        const updated = [...plantedSpots, index];
        setPlantedSpots(updated);
        if (updated.length === totalSpots) {
          setTimeout(() => {
            setStep('done');
            completeQuest(
              'quest_clearing',
              'Quenched 6 smoldering wildfire hot-spots and sowed pioneer clover & moss to revitalize ground zero.'
            );
          }, 500);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel">
      <div className="relative w-full max-w-xl pixel-panel overflow-hidden text-[#2e1005] shadow-2xl">
        {/* Header - Pixel Farm Wood Banner */}
        <div className="flex items-center justify-between p-3.5 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <h3 className="font-pixel-heading text-xs text-[#fde68a] tracking-wider">EXTINGUISH WILDFIRE</h3>
              <p className="text-[9px] text-[#fde68a]/80 mt-0.5">Charred Clearing • Phase 1 Ecosystem Renewal</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1 pixel-btn-red"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Instructions */}
          <div className="pixel-card p-3 bg-[#fefce8]">
            {step === 'quench' && (
              <div className="flex items-center gap-2 text-[10px] text-[#78350f]">
                <Droplets className="w-4 h-4 text-[#0284c7] flex-shrink-0" />
                <span>
                  Tap each burning ember hotspot to quench flames! ({quenchedSpots.length}/{totalSpots})
                </span>
              </div>
            )}
            {step === 'plant' && (
              <div className="flex items-center gap-2 text-[10px] text-[#15803d]">
                <Sprout className="w-4 h-4 text-[#16a34a] flex-shrink-0" />
                <span>
                  Ground is cool! Tap each cleared spot to sow pioneer seeds! ({plantedSpots.length}/{totalSpots})
                </span>
              </div>
            )}
            {step === 'done' && (
              <div className="flex items-center gap-2 text-[10px] text-[#15803d] font-bold">
                <CheckCircle className="w-4 h-4 text-[#16a34a] flex-shrink-0" />
                <span>Wildfire cleared! Pioneer sprouts have taken root. Clearing flourished to 100%!</span>
              </div>
            )}
          </div>

          {/* Interactive Ember Hotspot Grid */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-[#e8dfc8] border-2 border-[#5c2c16]">
            {Array.from({ length: totalSpots }).map((_, idx) => {
              const isQuenched = quenchedSpots.includes(idx);
              const isPlanted = plantedSpots.includes(idx);

              return (
                <button
                  key={idx}
                  onClick={() => handleSpotClick(idx)}
                  className={`h-24 flex flex-col items-center justify-center p-2 border-2 transition-all transform active:scale-95 ${
                    isPlanted
                      ? 'bg-[#dcfce7] border-[#15803d] shadow-[2px_2px_0px_#15803d]'
                      : isQuenched
                      ? 'bg-[#e2e8f0] border-[#64748b] shadow-[2px_2px_0px_#475569]'
                      : 'bg-[#fee2e2] border-[#b91c1c] shadow-[2px_2px_0px_#991b1b] animate-pulse'
                  }`}
                >
                  {isPlanted ? (
                    <>
                      <span className="text-2xl">🌱</span>
                      <span className="text-[9px] text-[#15803d] font-bold mt-1">SPROUTING!</span>
                    </>
                  ) : isQuenched ? (
                    <>
                      <span className="text-2xl">💨</span>
                      <span className="text-[9px] text-[#475569] font-bold mt-1">COOLED SOIL</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">🔥</span>
                      <span className="text-[9px] text-[#b91c1c] font-bold mt-1">HOTSPOT</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between text-[10px] pt-3 border-t-2 border-[#5c2c16]">
            <span className="flex items-center gap-1.5 text-[#15803d] font-bold">
              <Sparkles className="w-4 h-4 text-[#15803d]" /> REWARD: +250 COINS & 100% FLOURISH
            </span>
            {step === 'done' ? (
              <button
                onClick={closeQuestModal}
                className="px-4 py-2 pixel-btn-green text-[10px]"
              >
                RETURN TO WORLD
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
