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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-[#fffdfa] border-4 border-amber-950/20 rounded-3xl p-6 shadow-2xl text-stone-900">
        {/* Vintage Wooden Plaque Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#78350f] via-[#92400e] to-[#78350f] text-[#fffbeb] p-4 rounded-2xl border-2 border-[#451a03] shadow-md mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-100">Extinguish Wildfire Flare-ups</h3>
              <p className="text-xs text-amber-200/90 font-sans">Charred Clearing • Phase 1 Ecosystem Renewal</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1.5 rounded-full bg-amber-950/40 hover:bg-amber-950/70 text-amber-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-5 bg-[#fefce8] p-3.5 rounded-2xl border border-amber-200">
          {step === 'quench' && (
            <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
              <Droplets className="w-4 h-4 text-cyan-600 flex-shrink-0" />
              <span>
                Tap each burning ember hotspot to extinguish the fire flares with mountain spring water! ({quenchedSpots.length}/{totalSpots})
              </span>
            </div>
          )}
          {step === 'plant' && (
            <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
              <Sprout className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                The ground has cooled! Tap each cleared spot to sow hardy pioneer seedlings and moss spores! ({plantedSpots.length}/{totalSpots})
              </span>
            </div>
          )}
          {step === 'done' && (
            <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Wildfire cleared! Pioneer sprouts have taken root. Clearing flourished to 100%!</span>
            </div>
          )}
        </div>

        {/* Interactive Ember Hotspot Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80">
          {Array.from({ length: totalSpots }).map((_, idx) => {
            const isQuenched = quenchedSpots.includes(idx);
            const isPlanted = plantedSpots.includes(idx);

            return (
              <button
                key={idx}
                onClick={() => handleSpotClick(idx)}
                className={`h-24 rounded-2xl flex flex-col items-center justify-center p-2 border-2 transition-all transform active:scale-95 shadow-sm ${
                  isPlanted
                    ? 'bg-emerald-50 border-emerald-500 shadow-md'
                    : isQuenched
                    ? 'bg-stone-100 border-stone-300'
                    : 'bg-red-50 border-red-400 hover:bg-red-100 animate-pulse'
                }`}
              >
                {isPlanted ? (
                  <>
                    <span className="text-3xl">🌱</span>
                    <span className="text-[10px] text-emerald-800 font-bold mt-1">Sprouting!</span>
                  </>
                ) : isQuenched ? (
                  <>
                    <span className="text-3xl">💨</span>
                    <span className="text-[10px] text-stone-600 font-medium mt-1">Cooled Soil</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl">🔥</span>
                    <span className="text-[10px] text-red-700 font-bold mt-1">Ember Hotspot</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-stone-600 pt-2 border-t border-amber-200">
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <Sparkles className="w-4 h-4 text-emerald-600" /> Reward: +250 Coins & 100% Flourish
          </span>
          {step === 'done' ? (
            <button
              onClick={closeQuestModal}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
            >
              Return to World
            </button>
          ) : (
            <button
              onClick={closeQuestModal}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
