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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎋</span>
            <div>
              <h3 className="font-bold text-lg text-white">Forest Fire Prevention & Advocacy Hub</h3>
              <p className="text-xs text-zinc-400">Old-Growth Canopy • Stand with Paku the Red Panda</p>
            </div>
          </div>
          <button
            onClick={closeQuestModal}
            className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 bg-zinc-950 rounded-2xl border border-zinc-800 mb-5">
          <button
            onClick={() => setTab('social')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'social'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Instagram & Social Kit</span>
          </button>
          <button
            onClick={() => setTab('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'email'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Official Representative Email</span>
          </button>
        </div>

        {/* Tab 1: Social Media Generator */}
        {tab === 'social' && (
          <div className="space-y-4">
            {/* Social Post Visual Preview Card */}
            <div className="relative rounded-2xl p-6 bg-gradient-to-br from-emerald-950 via-zinc-900 to-amber-950 border border-emerald-500/40 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🦊</span>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Canopy Defense Initiative
                    </h4>
                    <p className="text-[10px] text-zinc-400">Field to Future Eco-Campaign</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-700 text-emerald-300 font-semibold">
                  #SaveTheCanopy
                </span>
              </div>

              <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80 mb-3">
                <p className="text-xs text-zinc-200 whitespace-pre-line leading-relaxed font-sans">
                  {socialCaption}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Verified Impact: Spreads Wildfire Education to 500+ Peers</span>
                <span>Target: Forestry Dept & State Senates</span>
              </div>
            </div>

            <button
              onClick={handleCopyCaption}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-white transition-all border border-zinc-700"
            >
              {copiedCaption ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCaption ? 'Copied to Clipboard!' : 'Copy Post Caption & Hashtags'}</span>
            </button>
          </div>
        )}

        {/* Tab 2: Representative Email Template */}
        {tab === 'email' && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
              <div className="text-xs text-zinc-400">
                <span className="text-zinc-500">Subject: </span>
                <strong className="text-zinc-200">{emailSubject}</strong>
              </div>
              <div className="border-t border-zinc-800/80 pt-2">
                <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed font-mono">
                  {emailBody}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyEmail}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-white transition-all border border-zinc-700"
              >
                {copiedEmail ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedEmail ? 'Copied Email Draft!' : 'Copy Email Text'}</span>
              </button>
              <a
                href={`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-cyan-700 hover:bg-cyan-600 rounded-xl text-xs font-bold text-white transition-all"
              >
                <span>Open Mail Client</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Publish & Complete Action Button */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Reward: +350 Amber Bamboo Coins & 100% Forest Flourish</span>
          </div>

          {!completed ? (
            <button
              onClick={handlePublish}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Launch Campaign & Complete Quest</span>
            </button>
          ) : (
            <button
              onClick={closeQuestModal}
              className="px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-xs font-bold transition-all"
            >
              Close Hub
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
