'use client';

import React from 'react';
import { GameStateProvider } from '@/context/GameStateContext';
import GameCanvas from '@/components/game/GameCanvas';
import TopNavHUD from '@/components/hud/TopNavHUD';
import MiniMap from '@/components/hud/MiniMap';
import NotificationToast from '@/components/hud/NotificationToast';
import DummyAdBanner from '@/components/ads/DummyAdBanner';
import DialogueModal from '@/components/dialogue/DialogueModal';
import ProfileModal from '@/components/profile/ProfileModal';
import QuestsDrawer from '@/components/quests/QuestsDrawer';
import FarmStatusWidget from '@/components/hud/FarmStatusWidget';

// Eco-Quest Modals
import WildfireQuenchModal from '@/components/quests/WildfireQuenchModal';
import LakeRecyclingModal from '@/components/quests/LakeRecyclingModal';
import ForestFireModal from '@/components/quests/ForestFireModal';
import TundraPetitionModal from '@/components/quests/TundraPetitionModal';
import GrasslandsFarmingModal from '@/components/quests/GrasslandsFarmingModal';
import ReefNavigationModal from '@/components/quests/ReefNavigationModal';
import DesertAquiferModal from '@/components/quests/DesertAquiferModal';

export default function Home() {
  return (
    <GameStateProvider>
      <main className="relative flex flex-col h-screen w-screen overflow-hidden bg-amber-50/50 text-stone-900 font-sans">
        {/* Top Navigation HUD with World Flourish Meter & Treasury */}
        <TopNavHUD />

        {/* Central Game Canvas Container */}
        <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col">
          <GameCanvas />
          <FarmStatusWidget />
          <MiniMap />
          <NotificationToast />

          {/* Dialogue & Quest Modals Overlay */}
          <DialogueModal />
          <WildfireQuenchModal />
          <LakeRecyclingModal />
          <ForestFireModal />
          <TundraPetitionModal />
          <GrasslandsFarmingModal />
          <ReefNavigationModal />
          <DesertAquiferModal />
          <ProfileModal />
          <QuestsDrawer />
        </div>

        {/* Bottom Dummy Ad Banner for Eco-Sponsorship */}
        <DummyAdBanner />
      </main>
    </GameStateProvider>
  );
}
