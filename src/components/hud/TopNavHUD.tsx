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

  return (
    <>
      {/* Top HUD Bar */}
      <header className="w-full bg-zinc-950/90 border-b border-zinc-800 backdrop-blur-md px-4 py-3 z-30 flex items-center justify-between gap-4 select-none">
        {/* Logo & Theme Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center">
              <Sprout className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm tracking-wide text-white">
                  Field to Future
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Bloom
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 hidden sm:inline">
                Sponsored by Bayer • Agriculture & Sustainability
              </span>
            </div>
          </div>
        </div>

        {/* Global Flourish Bar (Middle) */}
        <div className="flex-1 max-w-xs md:max-w-md hidden sm:flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>World Flourish Index:</span>
            </span>
            <span className="font-bold text-emerald-400">{globalFlourish}%</span>
          </div>

          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-700/60">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400"
              style={{ width: `${globalFlourish}%` }}
            />
          </div>
        </div>

        {/* Right HUD Controls */}
        <div className="flex items-center gap-2">
          {/* Coin Treasury Pill */}
          <button
            onClick={() => { sounds.playClick(); setIsProfileOpen(true); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-emerald-500 text-white transition-all shadow-md active:scale-95"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs">{totalCoins.toLocaleString()}</span>
          </button>

          {/* Quests Button */}
          <button
            onClick={() => { sounds.playClick(); setIsQuestsOpen(true); }}
            className="relative p-2 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-emerald-500 text-zinc-300 hover:text-white transition-all active:scale-95"
            title="Quests Drawer"
          >
            <ScrollText className="w-4 h-4" />
            {uncompletedQuestsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center">
                {uncompletedQuestsCount}
              </span>
            )}
          </button>

          {/* Profile Button */}
          <button
            onClick={() => { sounds.playClick(); setIsProfileOpen(true); }}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-emerald-500 text-zinc-300 hover:text-white transition-all active:scale-95"
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
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-emerald-500 text-zinc-300 hover:text-white transition-all active:scale-95"
            title={settings.soundEnabled ? 'Mute SFX' : 'Enable SFX'}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          {/* Settings / Gemini API Key Modal */}
          <button
            onClick={() => { sounds.playClick(); setIsSettingsOpen(true); }}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-emerald-500 text-zinc-300 hover:text-white transition-all active:scale-95"
            title="Gemini AI & Engine Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Help & Guide Button */}
          <button
            onClick={() => { sounds.playClick(); setIsHelpOpen(true); }}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-emerald-500 text-zinc-300 hover:text-white transition-all active:scale-95"
            title="Game Guide & World Map"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Game & Gemini 1.5 Flash AI Configuration</span>
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-bold mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Gemini API Key (Optional)</span>
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy... (Leave empty to use built-in persona simulation)"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">
                  If provided, calls stream directly from Google Gemini 1.5 Flash. If left blank, our built-in intelligent dynamic persona engine delivers responses out of the box!
                </p>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">Sound Effects & Synthesis:</span>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                    className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset all game coins, biomes, and quests to the beginning?')) {
                      resetGame();
                      setIsSettingsOpen(false);
                    }
                  }}
                  className="px-3 py-2 bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-300 rounded-xl font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Progress</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guide & Mini-Map Guide Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-2xl text-white max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                <span>Field to Future World Guide & Map</span>
              </h3>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
              <p>
                Welcome to <strong>Field to Future: Bloom</strong>! You begin in a scorched wildfire clearing surrounded by damaged biomes. Through exploration, dialogue with endangered species, and environmental actions, you can restore each habitat to 100% flourishing vitality.
              </p>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide">Controls:</h4>
                <div className="grid grid-cols-2 gap-2 text-zinc-400">
                  <div>• <strong>WASD / Arrow Keys</strong>: Walk</div>
                  <div>• <strong>Click / Tap Ground</strong>: Move to point</div>
                  <div>• <strong>[E] or Click Animal</strong>: Dialogue</div>
                  <div>• <strong>Bottom Banner</strong>: Sponsor Eco-Boosts</div>
                </div>
              </div>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide">Biomes & Animal Friends:</h4>
                <div className="space-y-1.5 text-zinc-300">
                  <div>🎋 <strong>NW - Bamboo Forest</strong>: Paku the Red Panda (Stop wildfires & save the canopy)</div>
                  <div>💧 <strong>SW - Crystal Marsh</strong>: Mo the Manatee (Watershed recycling quiz)</div>
                  <div>❄️ <strong>North - Glacial Tundra</strong>: Nanuk the Polar Bear (Decommission coal plant)</div>
                  <div>🌻 <strong>SE - Smart Farmland</strong>: Aura the Monarch (Bayer Precision Agriculture simulator)</div>
                  <div>⚡ <strong>East - Savanna Oasis</strong>: Zuri the Cheetah (Solar wellsprings)</div>
                  <div>🪸 <strong>South - Coral Barrier</strong>: Coralia the Sea Turtle (Divert vessel traffic)</div>
                </div>
              </div>

              <button
                onClick={() => setIsHelpOpen(false)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all shadow-md"
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
