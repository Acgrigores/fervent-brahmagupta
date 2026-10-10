'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { X, CheckCircle, AlertTriangle, Sparkles, Award } from 'lucide-react';

interface QuizItem {
  id: number;
  item: string;
  emoji: string;
  category: 'plastic_recycling' | 'compost' | 'hazardous' | 'runoff_filter';
  explanation: string;
}

const ITEMS_TO_SORT: QuizItem[] = [
  {
    id: 1,
    item: 'Single-Use PET Plastic Bottle',
    emoji: '🥤',
    category: 'plastic_recycling',
    explanation: 'Plastics must be washed and routed to circular municipal recycling so they never break down into toxic microplastics in shallow manatee lagoons.',
  },
  {
    id: 2,
    item: 'Rotting Banana Peels & Food Waste',
    emoji: '🍌',
    category: 'compost',
    explanation: 'Organics belong in municipal compost! When dumped in waterways, decomposing organics deplete dissolved oxygen that fish and aquatic plants need.',
  },
  {
    id: 3,
    item: 'Lithium Battery from a Boat Flashlight',
    emoji: '🔋',
    category: 'hazardous',
    explanation: 'Heavy metals (lead, cadmium, lithium) leach into sediments, causing organ failure in grazing manatees. Must go to dedicated hazardous drop-offs.',
  },
  {
    id: 4,
    item: 'Agricultural Nitrogen Runoff Filter Sump',
    emoji: '🌾',
    category: 'runoff_filter',
    explanation: 'Installing vegetative buffer strips and bio-char sumps absorbs fertilizer nitrates before they trigger toxic red tide algae blooms.',
  },
  {
    id: 5,
    item: 'Discarded Monofilament Fishing Line',
    emoji: '🎣',
    category: 'plastic_recycling',
    explanation: 'Fishing line remains in waters for 600 years and wraps around manatee flippers. Special monofilament recycling bins turn line into artificial fish habitats.',
  },
];

const CATEGORIES = [
  { id: 'plastic_recycling', label: 'Circular Plastics Recycling', icon: '♻️', color: 'border-sky-300 bg-sky-50 text-sky-950' },
  { id: 'compost', label: 'Organic Composting', icon: '🌱', color: 'border-emerald-300 bg-emerald-50 text-emerald-950' },
  { id: 'hazardous', label: 'Hazardous Waste Depot', icon: '⚠️', color: 'border-amber-300 bg-amber-50 text-amber-950' },
  { id: 'runoff_filter', label: 'Agri-Runoff Biofilter', icon: '🌾', color: 'border-blue-300 bg-blue-50 text-blue-950' },
];

export default function LakeRecyclingModal() {
  const { activeQuestModal, closeQuestModal, completeQuest } = useGameState();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (activeQuestModal !== 'lake_recycling') return null;

  const currentItem = ITEMS_TO_SORT[currentIndex];

  const handleSelectCategory = (categoryId: string) => {
    if (feedback) return;

    const correct = currentItem.category === categoryId;
    setIsCorrect(correct);
    setFeedback(currentItem.explanation);

    if (correct) {
      sounds.playCoin();
      setScore((s) => s + 1);
    } else {
      sounds.playClick();
    }
  };

  const handleNext = () => {
    setFeedback(null);
    setIsCorrect(null);

    if (currentIndex < ITEMS_TO_SORT.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsFinished(true);
      completeQuest(
        'quest_lake',
        `Mastered watershed circular recycling quiz with score ${score + 1}/${ITEMS_TO_SORT.length}, preventing 500kg of plastics and runoff from contaminating the manatee sanctuary.`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel">
      <div className="relative w-full max-w-xl pixel-panel overflow-hidden text-[#2e1005] shadow-2xl">
        {/* Header - Pixel Farm Wood Banner */}
        <div className="flex items-center justify-between p-3.5 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦭</span>
            <div>
              <h3 className="font-pixel-heading text-xs text-[#fde68a] tracking-wider">WATERSHED RECYCLING</h3>
              <p className="text-[9px] text-[#fde68a]/80 mt-0.5">Crystal Marsh • Protect Mo the Manatee</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1 pixel-btn-red"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {!isFinished ? (
            <div>
              {/* Progress bar */}
              <div className="flex items-center justify-between text-[10px] text-[#5c2c16] mb-1.5 font-bold">
                <span>ITEM {currentIndex + 1} OF {ITEMS_TO_SORT.length}</span>
                <span className="text-[#15803d]">SCORE: {score}</span>
              </div>
              <div className="w-full bg-[#3e1a06] h-3 border-2 border-[#2e1005] p-0.5 mb-5">
                <div
                  className="bg-[#0284c7] h-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / ITEMS_TO_SORT.length) * 100}%` }}
                />
              </div>

              {/* Current Item Card */}
              <div className="p-4 pixel-card flex flex-col items-center text-center mb-4 bg-[#fefce8]">
                <span className="text-4xl mb-2">{currentItem.emoji}</span>
                <h4 className="text-xs font-pixel-heading text-[#2e1005] mb-1">{currentItem.item.toUpperCase()}</h4>
                <p className="text-[9.5px] text-[#5c2c16]">Where should this item be diverted to protect aquatic life?</p>
              </div>

              {/* Category Options */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    disabled={feedback !== null}
                    className="p-3 border-2 border-[#5c2c16] bg-[#fffbf2] hover:bg-[#fde68a] active:translate-y-0.5 text-left flex items-center gap-2.5 shadow-[2px_2px_0px_#2e1005] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-[9.5px] font-bold text-[#2e1005]">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Feedback alert */}
              {feedback && (
                <div
                  className={`p-3 border-2 mb-2 ${
                    isCorrect
                      ? 'bg-[#dcfce7] border-[#15803d] text-[#14532d]'
                      : 'bg-[#fef3c7] border-[#b45309] text-[#78350f]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-[10px] mb-1">
                    {isCorrect ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-[#15803d]" />
                        <span>CORRECT SORTING!</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-[#b45309]" />
                        <span>EDUCATIONAL NOTE:</span>
                      </>
                    )}
                  </div>
                  <p className="text-[9px] leading-relaxed">{feedback}</p>
                  <button
                    onClick={handleNext}
                    className="mt-2.5 px-3 py-1.5 pixel-btn text-[9px]"
                  >
                    {currentIndex < ITEMS_TO_SORT.length - 1 ? 'NEXT ITEM →' : 'COMPLETE QUEST →'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex p-3 bg-[#e0f2fe] border-2 border-[#0284c7] mb-3">
                <Award className="w-8 h-8 text-[#0369a1]" />
              </div>
              <h4 className="text-xs font-pixel-heading text-[#2e1005] mb-2">WATERSHED RESTORED!</h4>
              <p className="text-[9.5px] text-[#5c2c16] max-w-md mx-auto mb-4 leading-relaxed">
                You correctly sorted critical waste items and mitigated dangerous chemical runoff. Mo the Manatee and hundreds of aquatic organisms can now graze in crystal-clear waters!
              </p>
              <div className="flex items-center justify-center gap-2 text-[10px] text-[#15803d] font-bold mb-4">
                <Sparkles className="w-4 h-4 text-[#16a34a]" /> +300 AZURE RIPPLE COINS & 100% LAKE FLOURISH!
              </div>
              <button
                onClick={closeQuestModal}
                className="px-5 py-2 pixel-btn-green text-[10px]"
              >
                BACK TO WORLD
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
