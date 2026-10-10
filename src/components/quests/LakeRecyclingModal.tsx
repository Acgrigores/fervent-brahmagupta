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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-[#fffdfa] border-4 border-amber-950/20 rounded-3xl p-6 shadow-2xl text-stone-900">
        {/* Vintage Wooden Plaque Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#78350f] via-[#92400e] to-[#78350f] text-[#fffbeb] p-4 rounded-2xl border-2 border-[#451a03] shadow-md mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🦭</span>
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-100">Watershed Waste & Recycling Challenge</h3>
              <p className="text-xs text-amber-200/90 font-sans">Crystal Marsh • Protect Mo the Manatee</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1.5 rounded-full bg-amber-950/40 hover:bg-amber-950/70 text-amber-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isFinished ? (
          <div>
            {/* Progress bar */}
            <div className="flex items-center justify-between text-xs text-stone-600 mb-2 font-medium">
              <span>Item {currentIndex + 1} of {ITEMS_TO_SORT.length}</span>
              <span className="font-bold text-emerald-700">Score: {score}</span>
            </div>
            <div className="w-full bg-amber-100 h-2.5 rounded-full overflow-hidden mb-6 border border-amber-200">
              <div
                className="bg-cyan-600 h-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / ITEMS_TO_SORT.length) * 100}%` }}
              />
            </div>

            {/* Current Item Card */}
            <div className="p-6 bg-[#fefce8] border border-amber-200/80 rounded-2xl flex flex-col items-center text-center mb-5 shadow-sm">
              <span className="text-5xl mb-3 filter drop-shadow-sm">{currentItem.emoji}</span>
              <h4 className="text-base font-serif font-bold text-stone-900 mb-1">{currentItem.item}</h4>
              <p className="text-xs text-stone-600">Where should this item be diverted to protect aquatic life?</p>
            </div>

            {/* Category Options */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  disabled={feedback !== null}
                  className={`p-3.5 rounded-2xl border-2 text-left flex items-center gap-3 transition-all active:scale-95 disabled:cursor-not-allowed ${cat.color} hover:brightness-95 shadow-sm`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-bold">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Feedback alert */}
            {feedback && (
              <div
                className={`p-4 rounded-2xl border-2 text-xs mb-4 animate-in fade-in ${
                  isCorrect
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                    : 'bg-amber-50 border-amber-400 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {isCorrect ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Correct Sorting!</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Educational Correction:</span>
                    </>
                  )}
                </div>
                <p className="leading-relaxed">{feedback}</p>
                <button
                  onClick={handleNext}
                  className="mt-3 px-4 py-1.5 bg-[#78350f] hover:bg-[#92400e] text-white rounded-xl font-bold transition-all shadow-sm"
                >
                  {currentIndex < ITEMS_TO_SORT.length - 1 ? 'Next Item →' : 'Complete Quest →'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="inline-flex p-4 bg-cyan-100 border-2 border-cyan-400 rounded-full mb-4 shadow-sm">
              <Award className="w-12 h-12 text-cyan-700" />
            </div>
            <h4 className="text-xl font-serif font-bold text-stone-900 mb-2">Watershed Restored!</h4>
            <p className="text-xs text-stone-600 max-w-md mx-auto mb-6 leading-relaxed">
              You correctly sorted critical waste items and mitigated dangerous chemical runoff. Mo the Manatee and hundreds of aquatic organisms can now graze in crystal-clear waters!
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 font-bold mb-6">
              <Sparkles className="w-4 h-4 text-emerald-600" /> +300 Azure Ripple Coins & 100% Lake Flourish!
            </div>
            <button
              onClick={closeQuestModal}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              Back to World
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
