'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const PhaserWorld = dynamic(() => import('@/components/game/PhaserWorld'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-amber-50/70 text-stone-700">
      <Loader2 className="w-10 h-10 animate-spin text-amber-700 mb-4" />
      <h2 className="text-lg font-serif font-bold text-amber-950">Awakening the Biome Engine...</h2>
      <p className="text-xs text-stone-500 mt-1">Generating terrain shaders, ecosystems, and wildlife</p>
    </div>
  ),
});

export default function GameCanvas() {
  return (
    <div className="relative w-full h-full flex-1 flex flex-col items-center justify-center overflow-hidden">
      <PhaserWorld />
    </div>
  );
}
