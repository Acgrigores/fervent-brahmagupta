'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import {
  Coins,
  ScrollText,
  User,
  Volume2,
  VolumeX,
  Settings,
  HelpCircle,
  Sparkles,
  Key,
  Compass,
  RotateCcw,
  Sprout,
} from 'lucide-react';

export default function TopNavHUD() {
  const {
    globalFlourish,
    totalCoins,
    quests,
    settings,
    updateSettings,
    setIsProfileOpen,
    setIsQuestsOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isHelpOpen,
    setIsHelpOpen,
    resetGame,
  } = useGameState();

  const [tempApiKey, setTempApiKey] = useState(settings.geminiApiKey || '');

  const uncompletedQuestsCount = quests.filter((q) => !q.completed).length;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ geminiApiKey: tempApiKey.trim() });
    setIsSettingsOpen(false);
  };

  const handleReset = () => {
    sounds.playClick();
    if (confirm('Are you sure you want to reset all game progress, coins, and crop restoration back to the beginning?')) {
      resetGame();
    }
  };

  return (
    <>
      {/* Top HUD Bar - Clean Warm Light Mode */}
      <header className="w-full bg-white/95 border-b border-amber-200/80 backdrop-blur-md px-4 py-2.5 z-30 flex items-center justify-between gap-4 select-none shadow-sm text-stone-900">
        {/* Logo & Theme Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-400/80 flex items-center justify-center shadow-sm">
              <Sprout className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm tracking-wide text-stone-900 font-serif">
                  Field to Future
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  Bloom
                </span>
              </div>
              <span className="text-[10px] text-stone-500 hidden sm:inline">
                Sponsored by Bayer • Agriculture & Sustainability
              </span>
            </div>
          </div>
        </div>

        {/* Global Flourish Bar (Middle) */}
        <div className="flex-1 max-w-xs md:max-w-md hidden sm:flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-600 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>World Flourish Index:</span>
            </span>
            <span className="font-bold text-emerald-700">{globalFlourish}%</span>
          </div>

          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden border border-stone-300">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-500"
              style={{ width: `${globalFlourish}%` }}
            />
          </div>
        </div>

        {/* Right HUD Controls */}
        <div className="flex items-center gap-2">
          {/* Coin Treasury Pill */}
          <button
            onClick={() => { sounds.playClick(); setIsProfileOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-amber-950 transition-all shadow-sm active:scale-95"
            title="Coin Treasury & Causes"
          >
            <Coins className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-xs">{totalCoins.toLocaleString()}</span>
          </button>

          {/* Quests Button */}
          <button
            onClick={() => { sounds.playClick(); setIsQuestsOpen(true); }}
            className="relative p-2 rounded-xl bg-white hover:bg-amber-50 border border-stone-300 text-stone-700 hover:text-stone-900 transition-all shadow-sm active:scale-95"
            title="Quests Drawer"
          >
            <ScrollText className="w-4 h-4" />
            {uncompletedQuestsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shadow">
                {uncompletedQuestsCount}
              </span>
            )}
          </button>

          {/* Profile / Portfolio Button */}
          <button
            onClick={() => { sounds.playClick(); setIsProfileOpen(true); }}
            className="p-2 rounded-xl bg-white hover:bg-amber-50 border border-stone-300 text-stone-700 hover:text-stone-900 transition-all shadow-sm active:scale-95"
            title="Impact Portfolio"
          >
            <User className="w-4 h-4" />
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={() => {
              sounds.playClick();
              updateSettings({ soundEnabled: !settings.soundEnabled });
            }}
            className="p-2 rounded-xl bg-white hover:bg-amber-50 border border-stone-300 text-stone-700 hover:text-stone-900 transition-all shadow-sm active:scale-95"
            title={settings.soundEnabled ? 'Mute SFX' : 'Enable SFX'}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
          </button>

          {/* Settings Button */}
          <button
            onClick={() => { sounds.playClick(); setIsSettingsOpen(true); }}
            className="p-2 rounded-xl bg-white hover:bg-amber-50 border border-stone-300 text-stone-700 hover:text-stone-900 transition-all shadow-sm active:scale-95"
            title="Gemini AI & Engine Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Help & Guide Button */}
          <button
            onClick={() => { sounds.playClick(); setIsHelpOpen(true); }}
            className="p-2 rounded-xl bg-white hover:bg-amber-50 border border-stone-300 text-stone-700 hover:text-stone-900 transition-all shadow-sm active:scale-95"
            title="Game Guide & World Map"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Prominent Reset Progress Button - Vintage Wooden Sign Aesthetic */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-900 hover:bg-amber-800 border-2 border-amber-950 text-amber-100 font-serif font-bold text-xs shadow-md transition-all active:scale-95"
            title="Reset Game Progress to Beginning"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">Reset Progress</span>
          </button>
        </div>
      </header>

      {/* Settings Modal - Light Mode */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border-2 border-amber-900/40 rounded-3xl p-6 shadow-2xl text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2 font-serif">
                <Settings className="w-4 h-4 text-emerald-600" />
                <span>Game & Gemini 1.5 Flash AI Configuration</span>
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>Google Gemini API Key (Optional)</span>
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy... (Leave empty to use built-in simulation)"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
                <p className="text-[10px] text-stone-500 mt-1.5 leading-relaxed">
                  If provided, calls stream directly from Google Gemini 1.5 Flash. If left blank, our built-in intelligent dynamic persona engine delivers responses out of the box!
                </p>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-stone-700 font-medium">Sound Effects & Synthesis:</span>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                    className="accent-emerald-600 w-4 h-4 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Progress</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guide Modal - Light Mode */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white border-2 border-amber-900/40 rounded-3xl p-6 shadow-2xl text-stone-900 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2 font-serif">
                <Compass className="w-5 h-5 text-emerald-600" />
                <span>Field to Future World Guide & Map</span>
              </h3>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
              <p>
                Welcome to <strong>Field to Future: Bloom</strong>! You begin at the central farm hub where 6 crops are failing due to crises in neighboring biomes. Walk to each biome, talk to the animals, and complete environmental action plans to revive each habitat!
              </p>

              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2">
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wide font-serif">Controls & Movement:</h4>
                <div className="grid grid-cols-2 gap-2 text-stone-600">
                  <div>• <strong>Arrow Keys</strong>: Walk along paths</div>
                  <div>• <strong>Click Ground</strong>: Click-to-move along paths</div>
                  <div>• <strong>Click Animals / Signs</strong>: Interact & Talk</div>
                  <div>• <strong>Screen Transitions</strong>: Exiting one side enters on the opposite side</div>
                </div>
              </div>

              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2">
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wide font-serif">Biomes & Endangered Species:</h4>
                <div className="space-y-1.5 text-stone-700">
                  <div>• <strong>NW - Forest</strong>: Paku the Red Panda (Stop wildfires $\rightarrow$ Canopy Apples)</div>
                  <div>• <strong>West - Lake</strong>: Mo the Manatee (Watershed waste recycling $\rightarrow$ Golden Sweet Corn)</div>
                  <div>• <strong>North - Tundra</strong>: Nanuk the Polar Bear (Retire coal plant $\rightarrow$ Winter Wheat)</div>
                  <div>• <strong>East - Prairie</strong>: Aura the Monarch (Bayer Smart Farming $\rightarrow$ Sunflowers)</div>
                  <div>• <strong>SE - Desert</strong>: Zuri the Cheetah (Solar artesian wells $\rightarrow$ Sugar Melons)</div>
                  <div>• <strong>South - Reefs</strong>: Coralia the Sea Turtle (Divert vessel routes $\rightarrow$ Tidal Rice)</div>
                </div>
              </div>

              <button
                onClick={() => setIsHelpOpen(false)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
              >
                Let&apos;s Flourish!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
