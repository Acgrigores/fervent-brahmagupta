'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const PhaserWorld = dynamic(() => import('@/components/game/PhaserWorld'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-300">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
      <h2 className="text-lg font-bold text-white">Awakening the Biome Engine...</h2>
      <p className="text-xs text-zinc-500 mt-1">Generating terrain shaders, ecosystems, and wildlife</p>
    </div>
  ),
});

export default function GameCanvas() {
  return (
    <div className="relative w-full h-full flex-1 flex flex-col overflow-hidden">
      <PhaserWorld />
    </div>
  );
}
