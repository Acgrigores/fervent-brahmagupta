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
  X,
  BookOpen,
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
    openPremiseModal,
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
      setIsSettingsOpen(false);
    }
  };

  return (
    <>
      {/* Top HUD Bar - Pixel Art Farm Theme */}
      <header className="w-full bg-[#5c2c16] border-b-4 border-[#2e1005] px-3 py-2 z-30 flex items-center justify-between gap-3 select-none text-[#fffbeb] shadow-md font-pixel">
        {/* Logo & Theme Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-none bg-[#78350f] border-2 border-[#fde68a] flex items-center justify-center shadow-inner">
            <Sprout className="w-4 h-4 text-[#86efac]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-pixel-heading text-xs tracking-wider text-[#fde68a] drop-shadow-[1px_1px_0px_#2e1005]">
                FIELD TO FUTURE
              </h1>
              <span className="text-[9px] px-1 py-0.5 bg-[#15803d] border border-[#86efac] text-[#fffbeb] font-bold">
                BLOOM
              </span>
            </div>
            <span className="text-[8px] text-[#fde68a]/70 hidden sm:inline tracking-tight">
              Bayer Smart Farm • Eco-Flourish
            </span>
          </div>
        </div>

        {/* Global Flourish Bar (Middle) */}
        <div className="flex-1 max-w-xs md:max-w-md hidden sm:flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#fde68a] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#fbbf24]" />
              <span>FLOURISH:</span>
            </span>
            <span className="font-bold text-[#86efac]">{globalFlourish}%</span>
          </div>

          <div className="w-full bg-[#2e1005] h-3 border-2 border-[#1a0802] p-0.5 shadow-inner">
            <div
              className="h-full transition-all duration-500 bg-gradient-to-r from-[#ea580c] via-[#eab308] to-[#22c55e]"
              style={{ width: `${globalFlourish}%` }}
            />
          </div>
        </div>

        {/* Right HUD Controls (Pixel Farm Buttons) */}
        <div className="flex items-center gap-1.5">
          {/* Coin Treasury Button */}
          <button
            onClick={() => { sounds.playClick(); setIsProfileOpen(true); }}
            className="pixel-btn flex items-center gap-1 px-2.5 py-1 text-[10px]"
            title="Coin Treasury & Causes"
          >
            <Coins className="w-3.5 h-3.5 text-[#fde68a]" />
            <span className="font-bold">{totalCoins.toLocaleString()}</span>
          </button>

          {/* Quests Button */}
          <button
            onClick={() => { sounds.playClick(); setIsQuestsOpen(true); }}
            className="pixel-btn relative p-1.5 text-[10px]"
            title="Quests Board"
          >
            <ScrollText className="w-3.5 h-3.5" />
            {uncompletedQuestsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#b91c1c] border border-[#fde68a] text-white text-[8px] font-bold flex items-center justify-center">
                {uncompletedQuestsCount}
              </span>
            )}
          </button>

          {/* Profile / Portfolio Button */}
          <button
            onClick={() => { sounds.playClick(); setIsProfileOpen(true); }}
            className="pixel-btn p-1.5 text-[10px]"
            title="Farm Portfolio & Treasury"
          >
            <User className="w-3.5 h-3.5" />
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={() => {
              sounds.playClick();
              updateSettings({ soundEnabled: !settings.soundEnabled });
            }}
            className="p-2 rounded-xl bg-white hover:bg-amber-50 border border-stone-300 text-stone-700 hover:text-stone-900 transition-all shadow-sm active:scale-95"
            title={settings.soundEnabled ? 'Mute Audio & Biome Music' : 'Enable Audio & Biome Music'}
          >
            {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#86efac]" /> : <VolumeX className="w-3.5 h-3.5 text-[#fca5a5]" />}
          </button>

          {/* Game Premise & Story Button */}
          <button
            onClick={() => { sounds.playClick(); openPremiseModal(); }}
            className="pixel-btn flex items-center gap-1 px-2 py-1 text-[10px] text-[#fde68a]"
            title="Game Premise & Story"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-bold">STORY</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => { sounds.playClick(); setIsSettingsOpen(true); }}
            className="pixel-btn p-1.5 text-[10px]"
            title="Game & AI Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Help & Guide Button */}
          <button
            onClick={() => { sounds.playClick(); setIsHelpOpen(true); }}
            className="pixel-btn p-1.5 text-[10px]"
            title="Farm Guide & Map"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Settings Modal - Pixel Art Farm Theme with Reset Progress */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel">
          <div className="relative w-full max-w-md pixel-panel p-5 text-[#2e1005]">
            <div className="flex items-center justify-between border-b-2 border-[#5c2c16] pb-2.5 mb-4">
              <h3 className="font-pixel-heading text-xs text-[#5c2c16] flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#b45309]" />
                <span>GAME SETTINGS</span>
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 pixel-btn-red text-[9px]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-[10px]">
              <div>
                <label className="block text-[#5c2c16] font-bold mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#b45309]" />
                  <span>GEMINI API KEY (OPTIONAL):</span>
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy... (Leave empty for built-in simulation)"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full bg-[#fffbf2] border-2 border-[#5c2c16] p-2 text-[#2e1005] placeholder-[#a88a6d] focus:outline-none focus:border-[#b45309] font-mono text-xs"
                />
                <p className="text-[8.5px] text-[#78350f] mt-1 leading-normal">
                  If set, calls stream from Gemini 1.5 Flash. Otherwise, our built-in offline smart dialog engine is active!
                </p>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-stone-700 font-medium">Audio, Steps & Biome Music:</span>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                    className="accent-emerald-600 w-4 h-4 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Reset Progress Button KEPT IN SETTINGS ONLY as requested */}
              <div className="p-3 bg-[#fee2e2] border-2 border-[#ef4444] space-y-2">
                <div className="text-[9px] text-[#991b1b] font-bold">
                  RESET PROGRESS:
                </div>
                <p className="text-[8px] text-[#7f1d1d] leading-tight">
                  Wipes all saved restoration, biome coins, and unlocked badges back to Day 1.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="pixel-btn-red w-full py-1.5 text-[9px] font-bold flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET ALL GAME PROGRESS</span>
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="pixel-btn px-3 py-1.5 text-[9px]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="pixel-btn-green px-4 py-1.5 text-[9px] font-bold"
                >
                  SAVE SETTINGS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guide Modal - Pixel Art Farm Theme */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel">
          <div className="relative w-full max-w-lg pixel-panel p-5 text-[#2e1005] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-[#5c2c16] pb-2.5 mb-3">
              <h3 className="font-pixel-heading text-xs text-[#5c2c16] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#b45309]" />
                <span>FARM GUIDE & BIOMES</span>
              </h3>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1 pixel-btn-red text-[9px]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 text-[9.5px] leading-relaxed text-[#451a03]">
              <p>
                Welcome to <strong>Field to Future: Bloom</strong>! You begin at the central farm hub where 6 crops are failing due to crises in neighboring biomes.
              </p>

              <div className="p-3 pixel-card space-y-1.5">
                <h4 className="font-bold text-[#78350f] uppercase">CONTROLS & TRAVEL:</h4>
                <div className="space-y-1 text-[#5c2c16] text-[8.5px]">
                  <div>• <strong>Arrow Keys</strong>: Walk along paths</div>
                  <div>• <strong>Click Ground</strong>: Click-to-move along paths</div>
                  <div>• <strong>Click Map Nodes</strong>: Instant travel to any biome</div>
                  <div>• <strong>Screen Edges</strong>: Walk offscreen to transition to connected biomes</div>
                </div>
              </div>

              <div className="p-3 pixel-card space-y-1.5">
                <h4 className="font-bold text-[#78350f] uppercase">6 BIOMES & CROP CRISES:</h4>
                <div className="space-y-1 text-[#5c2c16] text-[8.5px]">
                  <div>• <strong>Lake (West)</strong>: Mo the Manatee $\rightarrow$ Golden Corn</div>
                  <div>• <strong>Forest (NW)</strong>: Paku the Red Panda $\rightarrow$ Canopy Apples</div>
                  <div>• <strong>Tundra (North)</strong>: Nanuk the Polar Bear $\rightarrow$ Winter Wheat</div>
                  <div>• <strong>Prairie (East)</strong>: Aura the Monarch $\rightarrow$ Sunflowers</div>
                  <div>• <strong>Desert (SE)</strong>: Zuri the Cheetah $\rightarrow$ Sugar Melons</div>
                  <div>• <strong>Reefs (South)</strong>: Coralia the Sea Turtle $\rightarrow$ Tidal Rice</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setIsHelpOpen(false);
                    openPremiseModal();
                  }}
                  className="pixel-btn w-full py-2 text-[9.5px] font-bold text-[#fde68a] flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>VIEW FULL STORY & PREMISE</span>
                </button>

                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="pixel-btn-green w-full py-2 text-[9.5px] font-bold"
                >
                  CLOSE GUIDE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
