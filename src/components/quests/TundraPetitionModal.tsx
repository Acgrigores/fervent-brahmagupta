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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel">
      <div className="relative w-full max-w-2xl pixel-panel overflow-hidden text-[#2e1005] shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header - Pixel Farm Wood Banner */}
        <div className="flex items-center justify-between p-3.5 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐻‍❄️</span>
            <div>
              <h3 className="font-pixel-heading text-xs text-[#fde68a] tracking-wider">ARCTIC ACTION PORTAL</h3>
              <p className="text-[9px] text-[#fde68a]/80 mt-0.5">Glacial Tundra • Stand with Nanuk the Polar Bear</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1 pixel-btn-red"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* Petition Hero Banner */}
          <div className="pixel-card p-4 bg-[#f0f9ff]">
            <div className="flex items-center gap-2 text-[9.5px] font-bold text-[#0369a1] uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4 text-[#0284c7]" />
              <span>CLIMATE INITIATIVE</span>
            </div>
            <h4 className="text-xs font-pixel-heading text-[#2e1005] mb-2 leading-relaxed">
              DECOMMISSION THE ARCTIC HORIZON COAL PLANT
            </h4>
            <p className="text-[9.5px] text-[#5c2c16] leading-relaxed mb-3">
              The Arctic Horizon station emits 1.4M metric tons of CO2 and black soot annually.
              Soot darkens polar ice, absorbing heat and accelerating melting by 40%. We demand an immediate transition to wind microgrids.
            </p>

            {/* Signatures Progress */}
            <div>
              <div className="flex items-center justify-between text-[9px] text-[#2e1005] font-bold mb-1">
                <span className="flex items-center gap-1.5 text-[#0369a1]">
                  <Users className="w-3.5 h-3.5" />
                  {signatures.toLocaleString()} VERIFIED SIGNATURES
                </span>
                <span className="text-[#78350f]">GOAL: {targetSignatures.toLocaleString()}</span>
              </div>
              <div className="w-full bg-[#3e1a06] h-3 border-2 border-[#2e1005] p-0.5">
                <div
                  className="bg-[#0284c7] h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (signatures / targetSignatures) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Real-World Climate Impact Metrics */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 pixel-card text-center bg-[#fffbf2]">
              <div className="text-xs font-pixel-heading text-[#0369a1]">1.42M T</div>
              <div className="text-[8px] text-[#5c2c16] font-bold mt-1">CO2 PREVENTED</div>
            </div>
            <div className="p-2.5 pixel-card text-center bg-[#fffbf2]">
              <div className="text-xs font-pixel-heading text-[#0284c7]">4,260 KM²</div>
              <div className="text-[8px] text-[#5c2c16] font-bold mt-1">ICE PRESERVED</div>
            </div>
            <div className="p-2.5 pixel-card text-center bg-[#fffbf2]">
              <div className="text-xs font-pixel-heading text-[#15803d]">180+</div>
              <div className="text-[8px] text-[#5c2c16] font-bold mt-1">FAMILIES SAVED</div>
            </div>
          </div>

          {/* Sign Petition Form */}
          {!isSigned ? (
            <form onSubmit={handleSign} className="p-4 pixel-card bg-[#fefce8] space-y-3">
              <h5 className="text-[10px] font-pixel-heading text-[#2e1005]">
                ADD YOUR NAME TO THE SUBMISSION
              </h5>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-[#5c2c16] mb-1">FULL NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full bg-[#fffbf2] border-2 border-[#5c2c16] px-2.5 py-1.5 text-[9.5px] text-[#2e1005] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-[#5c2c16] mb-1">REGION</label>
                  <input
                    type="text"
                    value={signerCountry}
                    onChange={(e) => setSignerCountry(e.target.value)}
                    className="w-full bg-[#fffbf2] border-2 border-[#5c2c16] px-2.5 py-1.5 text-[9.5px] text-[#2e1005] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-[#5c2c16] mb-1">REASON FOR SIGNING</label>
                <textarea
                  rows={2}
                  value={signerReason}
                  onChange={(e) => setSignerReason(e.target.value)}
                  className="w-full bg-[#fffbf2] border-2 border-[#5c2c16] px-2.5 py-1.5 text-[9.5px] text-[#2e1005] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 pixel-btn flex items-center justify-center gap-2 text-[10px]"
              >
                <FileText className="w-4 h-4" />
                <span>SIGN OFFICIAL PETITION</span>
              </button>
            </form>
          ) : (
            <div className="p-4 border-2 border-[#15803d] bg-[#dcfce7] text-center space-y-1.5">
              <CheckCircle className="w-7 h-7 text-[#15803d] mx-auto" />
              <h5 className="text-xs font-pixel-heading text-[#14532d]">SIGNATURE RECORDED!</h5>
              <p className="text-[9.5px] text-[#14532d]">
                Thank you, <strong>{signerName}</strong> ({signerCountry}). Your signature tipped the initiative over 49,900 supporters!
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t-2 border-[#5c2c16] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-[#0369a1] font-bold">
              <Sparkles className="w-4 h-4 text-[#0284c7]" />
              <span>REWARD: +400 COINS & 100% TUNDRA FLOURISH</span>
            </div>

            {isSigned ? (
              <button
                onClick={closeQuestModal}
                className="px-4 py-2 pixel-btn-green text-[10px]"
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
