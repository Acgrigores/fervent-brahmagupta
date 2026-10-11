'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import {
  X,
  Droplets,
  CheckCircle,
  Sparkles,
  Shield,
  Users,
  Award,
  CheckSquare,
  Square,
  Waves,
} from 'lucide-react';

interface WaterHabit {
  id: string;
  title: string;
  desc: string;
  gallonsSaved: number;
  icon: string;
}

const WATER_HABITS: WaterHabit[] = [
  {
    id: 'shower',
    title: 'Keep Showers Under 5 Minutes',
    desc: 'Reduces shower volume by 12–15 gallons daily.',
    gallonsSaved: 12,
    icon: '🚿',
  },
  {
    id: 'leaks',
    title: 'Check & Fix Faucet/Pipe Leaks',
    desc: 'A single dripping faucet wastes up to 20 gallons every day.',
    gallonsSaved: 20,
    icon: '🔧',
  },
  {
    id: 'dusk_watering',
    title: 'Water Plants at Dawn or Dusk',
    desc: 'Cuts midday solar evaporation by 30% for gardens & crops.',
    gallonsSaved: 25,
    icon: '🌱',
  },
  {
    id: 'rainwater',
    title: 'Collect Rainwater & Use Greywater',
    desc: 'Uses ambient rainfall for irrigation instead of municipal supply.',
    gallonsSaved: 35,
    icon: '🌧️',
  },
  {
    id: 'appliances',
    title: 'Run Dishwasher & Laundry Full Only',
    desc: 'Maximizes load efficiency, saving 15 gallons per load.',
    gallonsSaved: 15,
    icon: '🍽️',
  },
  {
    id: 'drip_irrigation',
    title: 'Support Precision Drip Irrigation',
    desc: 'Delivers water directly to crop root zones without runoff.',
    gallonsSaved: 30,
    icon: '🌾',
  },
];

export default function WildfireQuenchModal() {
  const { activeQuestModal, closeQuestModal, completeQuest, quests } = useGameState();

  const quest = quests.find((q) => q.id === 'quest_clearing');
  const isAlreadyCompleted = Boolean(quest?.completed);

  const [signerName, setSignerName] = useState('Farmer Alex');
  const [region, setRegion] = useState('Central Valley Watershed');
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([
    'shower',
    'leaks',
    'dusk_watering',
    'drip_irrigation',
  ]);
  const [pledgeCommitted, setPledgeCommitted] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [communityCount, setCommunityCount] = useState(18492);

  if (activeQuestModal !== 'wildfire_quench') return null;

  const toggleHabit = (id: string) => {
    sounds.playClick();
    setSelectedHabitIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const calculatedGallonsSaved = selectedHabitIds.reduce((sum, id) => {
    const habit = WATER_HABITS.find((h) => h.id === id);
    return sum + (habit ? habit.gallonsSaved : 0);
  }, 0);

  const handleSubmitPledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim() || !pledgeCommitted || selectedHabitIds.length === 0) return;

    sounds.playFanfare();
    sounds.playBloom();
    setIsSubmitted(true);
    setCommunityCount((c) => c + 1);

    completeQuest(
      'quest_clearing',
      `Pledged to conserve ${calculatedGallonsSaved} gallons of water daily (${selectedHabitIds.length} commitments) to prevent agricultural droughts. Community watershed protected!`
    );
  };

  const showCertificate = isSubmitted || isAlreadyCompleted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel select-none">
      <div className="relative w-full max-w-2xl pixel-panel overflow-hidden text-[#2e1005] shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header - Pixel Farm Wood Banner */}
        <div className="flex items-center justify-between p-3.5 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0284c7] border-2 border-[#bae6fd] flex items-center justify-center shadow-inner">
              <Droplets className="w-5 h-5 text-[#e0f2fe]" />
            </div>
            <div>
              <h3 className="font-pixel-heading text-xs text-[#fde68a] tracking-wider">
                WATER USAGE & DROUGHT PLEDGE
              </h3>
              <p className="text-[9px] text-[#fde68a]/80 mt-0.5">
                Bayer Central Eco-Farm • Conserve Water to Prevent Droughts
              </p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1 pixel-btn-red text-[10px]"
            title="Close Pledge"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Mission Hero Banner */}
          <div className="pixel-card p-4 bg-[#f0f9ff] border-2 border-[#0284c7]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-[#0369a1] uppercase tracking-wider">
                <Shield className="w-4 h-4 text-[#0284c7]" />
                <span>DROUGHT PREVENTION INITIATIVE</span>
              </div>
              <span className="text-[8.5px] px-2 py-0.5 bg-[#0284c7] text-white font-bold">
                PHASE 1 WATER SECURITY
              </span>
            </div>
            <h4 className="text-xs font-pixel-heading text-[#0c4a6e] mb-1.5 leading-snug">
              MAKE THE COMMUNITY PLEDGE: SAFEGUARD OUR AQUIFERS & PREVENT CROPLAND DROUGHTS
            </h4>
            <p className="text-[9.5px] text-[#075985] leading-relaxed mb-3">
              Agriculture consumes 70% of freshwater worldwide. When groundwater tables drop, regional farms suffer soil dryouts, stunted crops, and emergency irrigation bans. By pledging simple daily water conservation practices, every household helps maintain regional water levels to prevent droughts.
            </p>

            {/* Live Community Counter */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#e0f2fe] border border-[#7dd3fc] text-[9.5px] font-bold text-[#0369a1]">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>{communityCount.toLocaleString()} PLEDGES RECORDED</span>
              </span>
              <span className="flex items-center gap-1.5 text-[#0f766e]">
                <Waves className="w-3.5 h-3.5" />
                <span>2.6M+ GALLONS PROTECTED MONTHLY</span>
              </span>
            </div>
          </div>

          {/* Key Impact Metrics */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 pixel-card text-center bg-[#fffbf2]">
              <div className="text-xs font-pixel-heading text-[#0284c7]">
                {calculatedGallonsSaved} GAL/DAY
              </div>
              <div className="text-[8px] text-[#5c2c16] font-bold mt-1">YOUR DAILY SAVINGS</div>
            </div>
            <div className="p-2.5 pixel-card text-center bg-[#fffbf2]">
              <div className="text-xs font-pixel-heading text-[#0369a1]">
                {calculatedGallonsSaved * 30} GAL
              </div>
              <div className="text-[8px] text-[#5c2c16] font-bold mt-1">MONTHLY IMPACT</div>
            </div>
            <div className="p-2.5 pixel-card text-center bg-[#fffbf2]">
              <div className="text-xs font-pixel-heading text-[#15803d]">6 CROPS</div>
              <div className="text-[8px] text-[#5c2c16] font-bold mt-1">PROTECTED FROM DROUGHT</div>
            </div>
          </div>

          {!showCertificate ? (
            <form onSubmit={handleSubmitPledge} className="space-y-4">
              {/* Selectable Pledge Commitments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-pixel-heading text-[#2e1005]">
                    SELECT YOUR WATER CONSERVATION HABITS:
                  </label>
                  <span className="text-[9px] text-[#0369a1] font-bold">
                    ({selectedHabitIds.length}/{WATER_HABITS.length} Selected)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {WATER_HABITS.map((habit) => {
                    const isSelected = selectedHabitIds.includes(habit.id);
                    return (
                      <div
                        key={habit.id}
                        onClick={() => toggleHabit(habit.id)}
                        className={`p-2.5 border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-[#e0f2fe] border-[#0284c7] shadow-[2px_2px_0px_#0284c7]'
                            : 'bg-[#fffbf2] border-[#5c2c16] opacity-75 hover:opacity-100'
                        }`}
                      >
                        <button
                          type="button"
                          className="mt-0.5 text-[#0284c7] flex-shrink-0"
                          aria-label={isSelected ? 'Unselect habit' : 'Select habit'}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#0284c7]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#78350f]" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9.5px] font-bold text-[#2e1005]">
                              {habit.icon} {habit.title}
                            </span>
                            <span className="text-[8px] font-bold text-[#0284c7] flex-shrink-0">
                              +{habit.gallonsSaved} gal/d
                            </span>
                          </div>
                          <p className="text-[8.5px] text-[#5c2c16] mt-0.5 leading-snug">
                            {habit.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pledging Details */}
              <div className="p-3.5 pixel-card bg-[#fefce8] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-[#5c2c16] mb-1">
                      PLEDGER / FARMER NAME
                    </label>
                    <input
                      type="text"
                      required
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full bg-[#fffbf2] border-2 border-[#5c2c16] px-2.5 py-1.5 text-[9.5px] text-[#2e1005] focus:outline-none focus:border-[#0284c7]"
                      placeholder="e.g. Jordan River"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[#5c2c16] mb-1">
                      COMMUNITY / REGION
                    </label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-[#fffbf2] border-2 border-[#5c2c16] px-2.5 py-1.5 text-[9.5px] text-[#2e1005] focus:outline-none focus:border-[#0284c7]"
                      placeholder="e.g. Northern Watershed"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={pledgeCommitted}
                    onChange={(e) => setPledgeCommitted(e.target.checked)}
                    className="w-4 h-4 text-[#0284c7] accent-[#0284c7] cursor-pointer"
                  />
                  <span className="text-[9px] text-[#5c2c16] font-bold leading-tight">
                    I solemnly pledge to conserve water daily to safeguard farm crops and prevent regional droughts.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={selectedHabitIds.length === 0 || !pledgeCommitted || !signerName.trim()}
                  className="w-full py-2.5 pixel-btn flex items-center justify-center gap-2 text-[10.5px] font-bold disabled:opacity-50"
                >
                  <Droplets className="w-4 h-4 text-[#38bdf8]" />
                  <span>SIGN & RECORD WATER PLEDGE</span>
                </button>
              </div>
            </form>
          ) : (
            /* Official Certificate of Water Stewardship */
            <div className="p-4 sm:p-5 border-4 border-[#0284c7] bg-[#f0f9ff] text-center space-y-3 shadow-md relative overflow-hidden">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#0284c7] border-2 border-[#bae6fd] text-white mx-auto shadow-inner">
                <Award className="w-7 h-7 text-[#fde68a]" />
              </div>

              <div>
                <span className="text-[8.5px] font-bold tracking-widest text-[#0369a1] uppercase">
                  OFFICIAL ENVIRONMENTAL CERTIFICATE
                </span>
                <h5 className="text-xs sm:text-sm font-pixel-heading text-[#0c4a6e] mt-0.5">
                  COMMUNITY WATER GUARDIAN PLEDGE
                </h5>
              </div>

              <div className="p-3 bg-[#e0f2fe] border-2 border-[#7dd3fc] text-[9.5px] text-[#075985] space-y-1">
                <p>
                  Presented to <strong className="text-[#0c4a6e] text-[10px]">{signerName}</strong> ({region})
                </p>
                <p className="text-[9px]">
                  For committing to save <strong className="text-[#0284c7]">{calculatedGallonsSaved || 35} Gallons/Day</strong> ({selectedHabitIds.length || 4} habits) to sustain groundwater and protect all 6 farm crops from drought.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-[9.5px] text-[#15803d] font-bold">
                <CheckCircle className="w-4 h-4 text-[#16a34a]" />
                <span>PLEDGE VERIFIED • CENTRAL FARM RESTORED TO 100% FLOURISH!</span>
              </div>
            </div>
          )}

          {/* Footer info & Rewards */}
          <div className="flex items-center justify-between text-[10px] pt-3 border-t-2 border-[#5c2c16]">
            <span className="flex items-center gap-1.5 text-[#0369a1] font-bold">
              <Sparkles className="w-4 h-4 text-[#0284c7]" /> REWARD: +250 COINS & 100% FARM FLOURISH
            </span>
            {showCertificate ? (
              <button
                onClick={closeQuestModal}
                className="px-4 py-2 pixel-btn-green text-[10px] font-bold"
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
