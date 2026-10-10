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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#fffdfa] border-4 border-amber-950/20 rounded-3xl p-6 shadow-2xl text-stone-900 max-h-[90vh] overflow-y-auto">
        {/* Vintage Wooden Plaque Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#78350f] via-[#92400e] to-[#78350f] text-[#fffbeb] p-4 rounded-2xl border-2 border-[#451a03] shadow-md mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐻‍❄️</span>
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-100">Change.org Arctic Action Portal</h3>
              <p className="text-xs text-amber-200/90 font-sans">Glacial Tundra • Stand with Nanuk the Polar Bear</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1.5 rounded-full bg-amber-950/40 hover:bg-amber-950/70 text-amber-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Petition Hero Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border-2 border-sky-200 mb-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-800 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4 text-sky-700" />
            <span>Official Climate Initiative</span>
          </div>
          <h4 className="text-base font-serif font-bold text-stone-900 mb-2">
            Decommission the Arctic Horizon Coal Plant & Fund Clean Wind Microgrids
          </h4>
          <p className="text-xs text-stone-600 leading-relaxed mb-4">
            The Arctic Horizon thermal station emits over 1.4 million metric tons of CO2 and black carbon soot annually.
            Soot darkens pristine polar ice, causing it to absorb solar radiation and melt 40% faster. We demand the Arctic Energy Council decommission this plant immediately.
          </p>

          {/* Signatures Progress */}
          <div>
            <div className="flex items-center justify-between text-xs text-stone-700 mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-sky-800">
                <Users className="w-3.5 h-3.5" />
                {signatures.toLocaleString()} verified signatures
              </span>
              <span className="text-stone-500 font-medium">Goal: {targetSignatures.toLocaleString()}</span>
            </div>
            <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden border border-stone-300">
              <div
                className="bg-sky-600 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (signatures / targetSignatures) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Real-World Climate Impact Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-sm text-center">
            <div className="text-lg font-serif font-bold text-sky-800">1.42M Tons</div>
            <div className="text-[10px] text-stone-600 font-medium">Annual CO2 Prevented</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-sm text-center">
            <div className="text-lg font-serif font-bold text-cyan-800">4,260 km²</div>
            <div className="text-[10px] text-stone-600 font-medium">Arctic Sea Ice Preserved</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-sm text-center">
            <div className="text-lg font-serif font-bold text-emerald-800">180+</div>
            <div className="text-[10px] text-stone-600 font-medium">Polar Bear Families Sheltered</div>
          </div>
        </div>

        {/* Sign Petition Form */}
        {!isSigned ? (
          <form onSubmit={handleSign} className="p-4 bg-[#fefce8] rounded-2xl border border-amber-200 space-y-3 shadow-sm">
            <h5 className="text-xs font-serif font-bold text-stone-900 uppercase tracking-wide">
              Add Your Name to the Official Submission
            </h5>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-sky-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">Country / Region</label>
                <input
                  type="text"
                  value={signerCountry}
                  onChange={(e) => setSignerCountry(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-sky-500 shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">Reason for Signing</label>
              <textarea
                rows={2}
                value={signerReason}
                onChange={(e) => setSignerReason(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-sky-500 shadow-inner"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Sign Petition & Deliver to Arctic Energy Council</span>
            </button>
          </form>
        ) : (
          <div className="p-5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-center space-y-2 shadow-sm">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <h5 className="text-sm font-serif font-bold text-stone-900">Signature Officially Recorded!</h5>
            <p className="text-xs text-stone-600">
              Thank you, <strong>{signerName}</strong> ({signerCountry}). Your signature tipped the initiative over 49,900 supporters!
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-sky-800 font-bold">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Reward: +400 Frost Auric Coins & 100% Tundra Flourish</span>
          </div>

          {isSigned ? (
            <button
              onClick={closeQuestModal}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Return to World
            </button>
          ) : (
            <button
              onClick={closeQuestModal}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
