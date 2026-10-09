'use client';

import React from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { X, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';

export default function QuestsDrawer() {
  const {
    isQuestsOpen,
    setIsQuestsOpen,
    quests,
    openQuestModal,
  } = useGameState();

  if (!isQuestsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-2xl text-white max-h-[85vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📜</span>
            <div>
              <h3 className="font-bold text-lg text-white">Biomes Ecological Quests</h3>
              <p className="text-xs text-zinc-400">
                Complete quests to clean up habitats and transform the world into a flourishing paradise
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsQuestsOpen(false)}
            className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quest List */}
        <div className="space-y-3 flex-1 overflow-y-auto">
          {quests.map((q) => (
            <div
              key={q.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                q.completed
                  ? 'bg-zinc-950/60 border-zinc-800 opacity-75'
                  : 'bg-zinc-950 border-emerald-500/50 hover:border-emerald-500 shadow-md'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className="text-3xl filter drop-shadow">{q.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{q.title}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase bg-zinc-800 text-zinc-300">
                      {q.biome}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{q.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-semibold mt-1">
                    <Sparkles className="w-3 h-3" />
                    <span>+{q.rewardCoins} Biome Coins • 100% Biome Flourish</span>
                  </div>
                </div>
              </div>

              <div>
                {q.completed ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold px-3 py-1.5 bg-emerald-950/40 border border-emerald-900 rounded-xl">
                    <CheckCircle className="w-4 h-4" />
                    <span>Completed</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setIsQuestsOpen(false);
                      openQuestModal(q.actionType);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
