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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <div>
              <h3 className="font-bold text-lg text-white">Extinguish Wildfire Flare-ups</h3>
              <p className="text-xs text-zinc-400">Charred Clearing • Phase 1 Ecosystem Renewal</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-5 bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-800">
          {step === 'quench' && (
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <Droplets className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>
                Tap each burning ember hotspot to extinguish the fire flares with mountain spring water! ({quenchedSpots.length}/{totalSpots})
              </span>
            </div>
          )}
          {step === 'plant' && (
            <div className="flex items-center gap-2 text-xs text-emerald-300">
              <Sprout className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                The ground has cooled! Tap each cleared spot to sow hardy pioneer seedlings and moss spores! ({plantedSpots.length}/{totalSpots})
              </span>
            </div>
          )}
          {step === 'done' && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Wildfire cleared! Pioneer sprouts have taken root. Clearing flourished to 100%!</span>
            </div>
          )}
        </div>

        {/* Interactive Ember Hotspot Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-zinc-950 rounded-2xl border border-zinc-800/80">
          {Array.from({ length: totalSpots }).map((_, idx) => {
            const isQuenched = quenchedSpots.includes(idx);
            const isPlanted = plantedSpots.includes(idx);

            return (
              <button
                key={idx}
                onClick={() => handleSpotClick(idx)}
                className={`h-24 rounded-2xl flex flex-col items-center justify-center p-2 border transition-all transform active:scale-95 ${
                  isPlanted
                    ? 'bg-emerald-950/80 border-emerald-500 shadow-lg shadow-emerald-950/50'
                    : isQuenched
                    ? 'bg-zinc-800/80 border-zinc-600'
                    : 'bg-red-950/60 border-red-500/80 hover:bg-red-900/60 shadow-md shadow-red-950/60 animate-pulse'
                }`}
              >
                {isPlanted ? (
                  <>
                    <span className="text-3xl">🌱</span>
                    <span className="text-[10px] text-emerald-300 font-bold mt-1">Sprouting!</span>
                  </>
                ) : isQuenched ? (
                  <>
                    <span className="text-3xl">💨</span>
                    <span className="text-[10px] text-zinc-300 font-medium mt-1">Cooled Soil</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl">🔥</span>
                    <span className="text-[10px] text-red-300 font-bold mt-1">Ember Hotspot</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Sparkles className="w-4 h-4" /> Reward: +250 Coins & 100% Flourish
          </span>
          {step === 'done' && (
            <button
              onClick={closeQuestModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg"
            >
              Return to World
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
