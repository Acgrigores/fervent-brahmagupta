'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { X, Copy, Check, Mail, Sparkles, Camera, ExternalLink } from 'lucide-react';

export default function ForestFireModal() {
  const { activeQuestModal, closeQuestModal, completeQuest, quests, restoration } = useGameState();
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [tab, setTab] = useState<'social' | 'email'>('social');

  if (activeQuestModal !== 'forest_campaign') return null;

  // Read the real game state (not a local flag) so a reset game can be restored again
  const forestQuest = quests.find((q) => q.id === 'quest_forest');
  const completed = !!forestQuest?.completed && (restoration.forest || 0) >= 80;

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

  // Copying either message or opening the email restores the forest
  const restoreForest = () => {
    if (completed) return;
    completeQuest(
      'quest_forest',
      'Published viral forest fire prevention awareness campaign and submitted official early-warning drone petition letter.'
    );
  };

  // Clipboard can be blocked (e.g. non-secure pages), so fall back to a hidden textarea and never throw
  const copyText = (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => undefined);
        return;
      }
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    } catch {
      /* copying failed; the forest is still restored */
    }
  };

  const handleCopyCaption = () => {
    restoreForest();
    copyText(socialCaption);
    sounds.playCoin();
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const handleCopyEmail = () => {
    restoreForest();
    copyText(`Subject: ${emailSubject}\n\n${emailBody}`);
    sounds.playCoin();
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel">
      <div className="relative w-full max-w-2xl pixel-panel overflow-hidden text-[#2e1005] shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header - Pixel Farm Wood Banner */}
        <div className="flex items-center justify-between p-3.5 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎋</span>
            <div>
              <h3 className="font-pixel-heading text-xs text-[#fde68a] tracking-wider">FOREST ADVOCACY HUB</h3>
              <p className="text-[9px] text-[#fde68a]/80 mt-0.5">Old-Growth Canopy • Stand with Paku the Red Panda</p>
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
          {/* Tab switcher */}
          <div className="flex gap-2 p-1.5 bg-[#e8dfc8] border-2 border-[#5c2c16]">
            <button
              onClick={() => setTab('social')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold border-2 transition-all ${
                tab === 'social'
                  ? 'bg-[#5c2c16] text-[#fde68a] border-[#2e1005]'
                  : 'bg-[#fffbf2] text-[#5c2c16] border-transparent hover:border-[#5c2c16]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>SOCIAL CAMPAIGN</span>
            </button>
            <button
              onClick={() => setTab('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold border-2 transition-all ${
                tab === 'email'
                  ? 'bg-[#5c2c16] text-[#fde68a] border-[#2e1005]'
                  : 'bg-[#fffbf2] text-[#5c2c16] border-transparent hover:border-[#5c2c16]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>REPRESENTATIVE PETITION</span>
            </button>
          </div>

          {/* Tab 1: Social Media Generator */}
          {tab === 'social' && (
            <div className="space-y-3">
              <div className="pixel-card p-4 bg-[#fefce8]">
                <div className="flex items-center justify-between mb-3 border-b-2 border-[#5c2c16] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🦊</span>
                    <div>
                      <h4 className="text-[10px] font-pixel-heading text-[#2e1005]">CANOPY DEFENSE INITIATIVE</h4>
                      <p className="text-[8.5px] text-[#78350f]">Field to Future Eco-Campaign</p>
                    </div>
                  </div>
                  <span className="text-[8.5px] px-2 py-0.5 bg-[#15803d] text-[#fffbeb] border border-[#2e1005] font-bold">
                    #SAVETHECANOPY
                  </span>
                </div>

                <div className="p-3 bg-[#fffbf2] border-2 border-[#5c2c16] mb-3 text-[9.5px] leading-relaxed text-[#2e1005] whitespace-pre-line">
                  {socialCaption}
                </div>

                <div className="flex items-center justify-between text-[8.5px] text-[#78350f]">
                  <span>Spreads Wildfire Education to 500+ Peers</span>
                  <span>Target: Forestry Dept & State Senates</span>
                </div>
              </div>

              <button
                onClick={handleCopyCaption}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 pixel-btn text-[10px]"
              >
                {copiedCaption ? <Check className="w-4 h-4 text-[#86efac]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCaption ? 'COPIED TO CLIPBOARD!' : 'COPY POST CAPTION & HASHTAGS'}</span>
              </button>
            </div>
          )}

          {/* Tab 2: Representative Email Template */}
          {tab === 'email' && (
            <div className="space-y-3">
              <div className="pixel-card p-4 bg-[#fffbf2] space-y-2">
                <div className="text-[9.5px] text-[#78350f]">
                  <span>Subject: </span>
                  <strong className="text-[#2e1005]">{emailSubject}</strong>
                </div>
                <div className="border-t-2 border-[#5c2c16] pt-2 text-[9px] text-[#2e1005] leading-relaxed whitespace-pre-line font-mono bg-[#fefce8] p-2.5 border border-[#c49a6c]">
                  {emailBody}
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                  onClick={restoreForest}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 pixel-btn-green text-[11px] font-bold"
                >
                  <Mail className="w-4 h-4" />
                  <span>OPEN IN MAIL</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={handleCopyEmail}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 pixel-btn text-[10px]"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-[#86efac]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? 'COPIED!' : 'COPY EMAIL TEXT'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Reward status: the forest is restored as soon as a message is copied or opened in mail */}
          <div className="pt-3 border-t-2 border-[#5c2c16] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] text-[#15803d] font-bold">
              <Sparkles className="w-4 h-4 text-[#16a34a]" />
              <span>
                {completed
                  ? 'FOREST RESTORED! +350 COINS & 100% CANOPY FLOURISH'
                  : 'COPY A MESSAGE OR OPEN IN MAIL TO RESTORE THE FOREST (+350 COINS)'}
              </span>
            </div>
            {completed && (
              <button onClick={closeQuestModal} className="px-4 py-2 pixel-btn text-[10px] flex-shrink-0">
                CLOSE HUB
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
