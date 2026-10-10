'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { X, Copy, Check, Share2, Mail, Sparkles, Camera, ExternalLink } from 'lucide-react';

export default function ForestFireModal() {
  const { activeQuestModal, closeQuestModal, completeQuest } = useGameState();
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [tab, setTab] = useState<'social' | 'email'>('social');
  const [completed, setCompleted] = useState(false);

  if (activeQuestModal !== 'forest_campaign') return null;

  const socialCaption = `🔥 Did you know mega-wildfires are devastating the cloud forest canopies where endangered Red Pandas like Paku live? 

When agricultural slash-and-burn practices or dry brush blazes burn out of control, nesting hollows vanish in hours. We need:
🌲 Early-warning thermal drone patrols
🎋 Community firebreaks and sustainable agroforestry
🌱 Precision fire risk mapping

Help us protect the canopy! #SaveTheCanopy #FieldToFuture #StopWildfires #RedPandaConservation #SmartAgriForests`;

  const emailSubject = `Urgent Petition: Fund Early-Warning Wildfire Drone Detection & Canopy Firebreaks`;
  const emailBody = `Dear Representative / Forestry Service Director,

I am writing as a concerned citizen to urge immediate state and federal budget allocation toward early-warning wildfire drone sensing, community firebreak corridors, and sustainable agroforestry buffers.

Climate-amplified megablazes are threatening critical high-altitude biodiversity hotspots—including the habitats of the endangered Red Panda and essential cloud forest watersheds. Deploying modern early-detection infrared technology and supporting agricultural buffer zones will stop blazes before they become catastrophic disasters.

Please support funding for proactive canopy protection and smart forest management.

Sincerely,
An Advocate for Environmental Solutions & Biodiversity`;

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(socialCaption);
    sounds.playCoin();
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`);
    sounds.playCoin();
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handlePublish = () => {
    setCompleted(true);
    completeQuest(
      'quest_forest',
      'Published viral forest fire prevention awareness campaign and submitted official early-warning drone petition letter.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#fffdfa] border-4 border-amber-950/20 rounded-3xl p-6 shadow-2xl text-stone-900 max-h-[90vh] overflow-y-auto">
        {/* Vintage Wooden Plaque Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#78350f] via-[#92400e] to-[#78350f] text-[#fffbeb] p-4 rounded-2xl border-2 border-[#451a03] shadow-md mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎋</span>
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-100">Forest Fire Prevention & Advocacy Hub</h3>
              <p className="text-xs text-amber-200/90 font-sans">Old-Growth Canopy • Stand with Paku the Red Panda</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1.5 rounded-full bg-amber-950/40 hover:bg-amber-950/70 text-amber-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1.5 bg-amber-100/70 rounded-2xl border border-amber-200 mb-5">
          <button
            onClick={() => setTab('social')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'social'
                ? 'bg-[#78350f] text-white shadow-sm font-serif'
                : 'text-stone-700 hover:text-stone-900 hover:bg-white/50'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Instagram & Social Kit</span>
          </button>
          <button
            onClick={() => setTab('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'email'
                ? 'bg-[#78350f] text-white shadow-sm font-serif'
                : 'text-stone-700 hover:text-stone-900 hover:bg-white/50'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Official Representative Email</span>
          </button>
        </div>

        {/* Tab 1: Social Media Generator */}
        {tab === 'social' && (
          <div className="space-y-4">
            <div className="relative rounded-2xl p-6 bg-gradient-to-br from-amber-50 via-[#fefce8] to-emerald-50 border-2 border-amber-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🦊</span>
                  <div>
                    <h4 className="text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">
                      Canopy Defense Initiative
                    </h4>
                    <p className="text-[10px] text-stone-500">Field to Future Eco-Campaign</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold">
                  #SaveTheCanopy
                </span>
              </div>

              <div className="p-4 bg-white/90 rounded-xl border border-amber-200/80 mb-3 shadow-inner">
                <p className="text-xs text-stone-800 whitespace-pre-line leading-relaxed font-sans">
                  {socialCaption}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
                <span>Verified Impact: Spreads Wildfire Education to 500+ Peers</span>
                <span>Target: Forestry Dept & State Senates</span>
              </div>
            </div>

            <button
              onClick={handleCopyCaption}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-100/80 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-bold transition-all border border-amber-300"
            >
              {copiedCaption ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCaption ? 'Copied to Clipboard!' : 'Copy Post Caption & Hashtags'}</span>
            </button>
          </div>
        )}

        {/* Tab 2: Representative Email Template */}
        {tab === 'email' && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-sm space-y-2">
              <div className="text-xs text-stone-600">
                <span className="text-stone-400">Subject: </span>
                <strong className="text-stone-900">{emailSubject}</strong>
              </div>
              <div className="border-t border-amber-100 pt-2">
                <p className="text-xs text-stone-700 whitespace-pre-line leading-relaxed font-mono">
                  {emailBody}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyEmail}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-100/80 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-bold transition-all border border-amber-300"
              >
                {copiedEmail ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                <span>{copiedEmail ? 'Copied Email Draft!' : 'Copy Email Text'}</span>
              </button>
              <a
                href={`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-cyan-700 hover:bg-cyan-800 rounded-xl text-xs font-bold text-white transition-all shadow-sm"
              >
                <span>Open Mail Client</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Publish & Complete Action Button */}
        <div className="mt-6 pt-4 border-t border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Reward: +350 Amber Bamboo Coins & 100% Forest Flourish</span>
          </div>

          {!completed ? (
            <button
              onClick={handlePublish}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Launch Campaign & Complete Quest</span>
            </button>
          ) : (
            <button
              onClick={closeQuestModal}
              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all"
            >
              Close Hub
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
