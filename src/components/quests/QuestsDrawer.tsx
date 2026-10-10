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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white border-2 border-amber-900/40 rounded-3xl p-6 shadow-2xl text-stone-900 max-h-[85vh] overflow-y-auto flex flex-col">
        {/* Header - Vintage Wooden Plaque */}
        <div className="flex items-center justify-between border-b-2 border-amber-950 pb-4 mb-4 bg-amber-900 text-amber-50 p-4 -m-6 mb-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-700 flex items-center justify-center shadow-inner">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold font-serif text-lg text-amber-100">Biomes Ecological Quests</h3>
              <p className="text-xs text-amber-200/80">
                Complete quests to clean up habitats and transform the world into a flourishing paradise
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsQuestsOpen(false)}
            className="p-1.5 rounded-full bg-amber-950/60 text-amber-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quest List */}
        <div className="space-y-3 flex-1 overflow-y-auto pt-2">
          {quests.map((q) => {
            const animalSprite = animalMap[q.biome];

            return (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  q.completed
                    ? 'bg-stone-50 border-stone-200 opacity-80'
                    : 'bg-white border-amber-200 hover:border-amber-400 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {animalSprite ? (
                    <img
                      src={`/assets/sprites/${animalSprite}.png`}
                      alt={q.title}
                      className="w-10 h-10 rounded-full object-cover border border-amber-300 bg-amber-50 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0">
                      <Home className="w-5 h-5 text-amber-700" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold font-serif text-stone-900">{q.title}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase bg-stone-100 text-stone-600 border border-stone-200">
                        {q.biome}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">{q.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-emerald-700 font-semibold mt-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>+{q.rewardCoins} Biome Coins • 100% Biome Flourish</span>
                    </div>
                  </div>
                </div>

                <div>
                  {q.completed ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold px-3 py-1.5 bg-emerald-100 border border-emerald-300 rounded-xl">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Completed</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setIsQuestsOpen(false);
                        openQuestModal(q.actionType);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-900 hover:bg-amber-800 text-amber-50 border border-amber-950 rounded-xl font-serif text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                      <span>Launch</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
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
