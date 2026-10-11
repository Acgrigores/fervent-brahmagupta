'use client';

import React from 'react';
import { useGameState } from '@/context/GameStateContext';
import { Sparkles } from 'lucide-react';

export default function NotificationToast() {
  const { notification } = useGameState();

  if (!notification) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300 pointer-events-none">
      <div className="flex items-center gap-2.5 px-5 py-2.5 bg-zinc-900/95 border border-emerald-500/80 rounded-full shadow-2xl text-xs font-semibold text-emerald-300 backdrop-blur-md">
        <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
        <span>{notification}</span>
      </div>
    </div>
  );
}
