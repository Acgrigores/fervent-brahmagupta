'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { X, FileText, CheckCircle, Shield, Sparkles, Users } from 'lucide-react';

export default function TundraPetitionModal() {
  const { activeQuestModal, closeQuestModal, completeQuest } = useGameState();
  const [signatures, setSignatures] = useState(49892);
  const [signerName, setSignerName] = useState('');
  const [signerCountry, setSignerCountry] = useState('United States');
  const [signerReason, setSignerReason] = useState('To protect polar bears and prevent accelerating sea ice loss.');
  const [isSigned, setIsSigned] = useState(false);

  if (activeQuestModal !== 'tundra_petition') return null;

  const targetSignatures = 50000;

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim() || isSigned) return;

    sounds.playCoin();
    setIsSigned(true);
    setSignatures((s) => s + 1);

    completeQuest(
      'quest_tundra',
      `Signed petition as ${signerName} to retire the Arctic Horizon Coal Plant. Secured ${signatures + 1} signatures, preventing 1.42M tons of CO2 & preserving 4,260 km² of sea ice.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐻‍❄️</span>
            <div>
              <h3 className="font-bold text-lg text-white">Change.org Arctic Action Portal</h3>
              <p className="text-xs text-zinc-400">Glacial Tundra • Stand with Nanuk the Polar Bear</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Petition Hero Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950 via-zinc-900 to-indigo-950 border border-sky-500/40 mb-5">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Official Climate Initiative</span>
          </div>
          <h4 className="text-base font-bold text-white mb-2">
            Decommission the Arctic Horizon Coal Plant & Fund Clean Wind Microgrids
          </h4>
          <p className="text-xs text-zinc-300 leading-relaxed mb-4">
            The Arctic Horizon thermal station emits over 1.4 million metric tons of CO2 and black carbon soot annually.
            Soot darkens pristine polar ice, causing it to absorb solar radiation and melt 40% faster. We demand the Arctic Energy Council decommission this plant immediately.
          </p>

          {/* Signatures Progress */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-300 mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-sky-300">
                <Users className="w-3.5 h-3.5" />
                {signatures.toLocaleString()} verified signatures
              </span>
              <span className="text-zinc-400">Goal: {targetSignatures.toLocaleString()}</span>
            </div>
            <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-400 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (signatures / targetSignatures) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Real-World Climate Impact Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center">
            <div className="text-lg font-bold text-sky-400">1.42M Tons</div>
            <div className="text-[10px] text-zinc-400">Annual CO2 Prevented</div>
          </div>
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center">
            <div className="text-lg font-bold text-cyan-400">4,260 km²</div>
            <div className="text-[10px] text-zinc-400">Arctic Sea Ice Preserved</div>
          </div>
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center">
            <div className="text-lg font-bold text-emerald-400">180+</div>
            <div className="text-[10px] text-zinc-400">Polar Bear Families Sheltered</div>
          </div>
        </div>

        {/* Sign Petition Form */}
        {!isSigned ? (
          <form onSubmit={handleSign} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
            <h5 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
              Add Your Name to the Official Submission
            </h5>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Country / Region</label>
                <input
                  type="text"
                  value={signerCountry}
                  onChange={(e) => setSignerCountry(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Reason for Signing</label>
              <textarea
                rows={2}
                value={signerReason}
                onChange={(e) => setSignerReason(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-950/60 active:scale-95 flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Sign Petition & Deliver to Arctic Energy Council</span>
            </button>
          </form>
        ) : (
          <div className="p-5 bg-emerald-950/40 border border-emerald-500/60 rounded-2xl text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <h5 className="text-sm font-bold text-white">Signature Officially Recorded!</h5>
            <p className="text-xs text-zinc-300">
              Thank you, <strong>{signerName}</strong> ({signerCountry}). Your signature tipped the initiative over 49,900 supporters!
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-sky-400 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Reward: +400 Frost Auric Coins & 100% Tundra Flourish</span>
          </div>

          {isSigned && (
            <button
              onClick={closeQuestModal}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              Return to World
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
