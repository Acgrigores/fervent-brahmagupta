'use client';

import React from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { X, CheckCircle, Sparkles, ArrowRight, Award, Home } from 'lucide-react';

export default function QuestsDrawer() {
  const {
    isQuestsOpen,
    setIsQuestsOpen,
    quests,
    openQuestModal,
  } = useGameState();

  if (!isQuestsOpen) return null;

  const animalMap: Record<string, string> = {
    forest: 'red_panda',
    lake: 'manatee',
    tundra: 'polar_bear',
    grasslands: 'butterfly',
    desert: 'cheetah',
    reefs: 'sea_turtle',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel">
      <div className="relative w-full max-w-2xl pixel-panel p-5 text-[#2e1005] max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Header - Pixel Art Bulletin Board Banner */}
        <div className="flex items-center justify-between border-b-2 border-[#5c2c16] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#78350f] border-2 border-[#fde68a] flex items-center justify-center shadow-inner">
              <Award className="w-4 h-4 text-[#fde68a]" />
            </div>
            <div>
              <h3 className="font-pixel-heading text-xs text-[#5c2c16]">
                COMMUNITY BOARD
              </h3>
              <p className="text-[8.5px] text-[#78350f]">
                Complete farm quests to revive wildlife & crops
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsQuestsOpen(false)}
            className="p-1 pixel-btn-red text-[9px]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quest List */}
        <div className="space-y-2.5 flex-1 overflow-y-auto pt-1">
          {quests.map((q) => {
            const animalSprite = animalMap[q.biome];

            return (
              <div
                key={q.id}
                className={`p-3 pixel-card transition-all flex items-center justify-between gap-3 ${
                  q.completed
                    ? 'bg-[#f0fdf4] border-[#15803d]'
                    : 'bg-[#fffbf2] border-[#5c2c16] hover:border-[#b45309]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {animalSprite ? (
                    <img
                      src={`/assets/sprites/${animalSprite}.png`}
                      alt={q.title}
                      className="w-9 h-9 object-cover border-2 border-[#5c2c16] bg-[#fef3c7] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-[#fef3c7] border-2 border-[#5c2c16] flex items-center justify-center flex-shrink-0">
                      <Home className="w-4 h-4 text-[#78350f]" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-[9.5px] font-bold text-[#2e1005]">{q.title}</h4>
                      <span className="text-[8px] uppercase px-1 bg-[#fef08a] text-[#854d0e] border border-[#ca8a04]">
                        {q.biome}
                      </span>
                    </div>
                    <p className="text-[8.5px] text-[#5c2c16] mt-0.5 leading-normal">{q.description}</p>
                    <div className="flex items-center gap-1.5 text-[8px] text-[#15803d] font-bold mt-1">
                      <Sparkles className="w-2.5 h-2.5 text-[#16a34a]" />
                      <span>+{q.rewardCoins} COINS • 100% FLOURISH</span>
                    </div>
                  </div>
                </div>

                <div>
                  {q.completed ? (
                    <div className="flex items-center gap-1 text-[8px] text-[#15803d] font-bold px-2 py-1 bg-[#dcfce7] border border-[#16a34a]">
                      <CheckCircle className="w-3 h-3 text-[#16a34a]" />
                      <span>SAVED</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setIsQuestsOpen(false);
                        openQuestModal(q.actionType);
                      }}
                      className="pixel-btn-green flex items-center gap-1 px-3 py-1 text-[8.5px] font-bold whitespace-nowrap"
                    >
                      <span>START</span>
                      <ArrowRight className="w-3 h-3 text-[#86efac]" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
