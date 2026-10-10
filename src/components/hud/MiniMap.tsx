'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { BiomeId } from '@/types/game';
import { FARM_CROPS } from '@/data/animals';
import { sounds } from '@/utils/soundEffects';
import { Compass, Sparkles } from 'lucide-react';

interface BiomeNode {
  id: BiomeId;
  label: string;
  cx: number;
  cy: number;
  color: string;
  pathStroke: string;
  cropName: string;
}

export default function MiniMap() {
  const { currentBiome, restoration, setCurrentBiome } = useGameState();
  const [hoveredBiome, setHoveredBiome] = useState<BiomeId | null>(null);

  // SVG coordinate geometry centered around Central Farm at (110, 85)
  const farmNode = { id: 'clearing' as BiomeId, label: 'Central Farm', cx: 110, cy: 85, color: '#15803d' };

  const biomeNodes: BiomeNode[] = [
    {
      id: 'lake',
      label: 'Lake',
      cx: 32,
      cy: 85,
      color: '#0284c7',
      pathStroke: '#0284c7',
      cropName: FARM_CROPS.lake.name,
    },
    {
      id: 'forest',
      label: 'Forest',
      cx: 45,
      cy: 35,
      color: '#16a34a',
      pathStroke: '#16a34a',
      cropName: FARM_CROPS.forest.name,
    },
    {
      id: 'tundra',
      label: 'Tundra',
      cx: 110,
      cy: 25,
      color: '#0284c7',
      pathStroke: '#0284c7',
      cropName: FARM_CROPS.tundra.name,
    },
    {
      id: 'grasslands',
      label: 'Prairie',
      cx: 188,
      cy: 85,
      color: '#d97706',
      pathStroke: '#d97706',
      cropName: FARM_CROPS.grasslands.name,
    },
    {
      id: 'desert',
      label: 'Desert',
      cx: 175,
      cy: 142,
      color: '#ea580c',
      pathStroke: '#ea580c',
      cropName: FARM_CROPS.desert.name,
    },
    {
      id: 'reefs',
      label: 'Reefs',
      cx: 110,
      cy: 145,
      color: '#0891b2',
      pathStroke: '#0891b2',
      cropName: FARM_CROPS.reefs.name,
    },
  ];

  const handleSelectBiome = (id: BiomeId) => {
    sounds.playClick();
    setCurrentBiome(id);
  };

  const activeHover = hoveredBiome
    ? biomeNodes.find((b) => b.id === hoveredBiome) || (hoveredBiome === 'clearing' ? { label: 'Bayer Central Farm', cropName: '6 Connected Crops', id: 'clearing' as BiomeId } : null)
    : null;

  return (
    <div className="absolute top-4 right-4 z-20 hidden lg:block bg-amber-50/95 backdrop-blur-md border-2 border-amber-900/40 rounded-2xl p-3 shadow-xl select-none w-64 text-stone-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold font-serif text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-emerald-700" />
          <span>Biome Map & Travel Paths</span>
        </span>
        <span className="text-[9px] font-mono text-stone-500">Click to travel</span>
      </div>

      {/* Interactive Path Map SVG - Warm Parchment Background */}
      <div className="relative w-full h-44 bg-amber-100/70 rounded-xl border border-amber-300 overflow-hidden flex items-center justify-center shadow-inner">
        {/* Subtle parchment grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#b45309_1px,transparent_1px)] [background-size:10px_10px] opacity-20 pointer-events-none" />

        <svg viewBox="0 0 220 170" className="w-full h-full relative z-10">
          <defs>
            <filter id="map-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Color-Coded Branching Paths from Central Farm to Each Biome */}
          {biomeNodes.map((node) => {
            const isHovered = hoveredBiome === node.id;
            const isRestored = (restoration[node.id] || 0) >= 80;

            return (
              <g
                key={`path-${node.id}`}
                className="cursor-pointer group"
                onClick={() => handleSelectBiome(node.id)}
                onMouseEnter={() => setHoveredBiome(node.id)}
                onMouseLeave={() => setHoveredBiome(null)}
              >
                {/* Wide invisible stroke for easy clicking */}
                <line
                  x1={farmNode.cx}
                  y1={farmNode.cy}
                  x2={node.cx}
                  y2={node.cy}
                  stroke="transparent"
                  strokeWidth="16"
                />

                {/* Outer path glow */}
                <line
                  x1={farmNode.cx}
                  y1={farmNode.cy}
                  x2={node.cx}
                  y2={node.cy}
                  stroke={node.pathStroke}
                  strokeWidth={isHovered ? 5.5 : 3.5}
                  strokeOpacity={isHovered ? 0.6 : 0.25}
                  strokeLinecap="round"
                />

                {/* Inner color-coded path stroke */}
                <line
                  x1={farmNode.cx}
                  y1={farmNode.cy}
                  x2={node.cx}
                  y2={node.cy}
                  stroke={node.pathStroke}
                  strokeWidth={isHovered ? 2.8 : 2}
                  strokeDasharray={isRestored ? 'none' : '4 3'}
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {/* Central Farm Hub Node */}
          <g
            className="cursor-pointer"
            onClick={() => handleSelectBiome('clearing')}
            onMouseEnter={() => setHoveredBiome('clearing')}
            onMouseLeave={() => setHoveredBiome(null)}
          >
            <circle
              cx={farmNode.cx}
              cy={farmNode.cy}
              r={hoveredBiome === 'clearing' ? 14 : 12}
              fill="#fef3c7"
              stroke="#15803d"
              strokeWidth="2.5"
            />
            <circle
              cx={farmNode.cx}
              cy={farmNode.cy}
              r="6.5"
              fill={currentBiome === 'clearing' ? '#16a34a' : '#15803d'}
            />
            <text
              x={farmNode.cx}
              y={farmNode.cy + 19}
              textAnchor="middle"
              className="text-[8px] font-bold fill-amber-950 pointer-events-none font-serif"
            >
              Farm Hub
            </text>
          </g>

          {/* Biome Destination Nodes */}
          {biomeNodes.map((node) => {
            const isCurrent = currentBiome === node.id;
            const isHovered = hoveredBiome === node.id;
            const isRestored = (restoration[node.id] || 0) >= 80;

            return (
              <g
                key={`node-${node.id}`}
                className="cursor-pointer group"
                onClick={() => handleSelectBiome(node.id)}
                onMouseEnter={() => setHoveredBiome(node.id)}
                onMouseLeave={() => setHoveredBiome(null)}
              >
                {/* Active Player Beacon Ping */}
                {isCurrent && (
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r="15"
                    fill="none"
                    stroke={node.color}
                    strokeWidth="1.8"
                    className="animate-ping opacity-60"
                  />
                )}

                {/* Outer Node Circle */}
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r={isHovered || isCurrent ? 11 : 9}
                  fill="#ffffff"
                  stroke={isRestored ? '#15803d' : node.color}
                  strokeWidth={isCurrent ? 2.5 : 1.8}
                  filter={isCurrent ? 'url(#map-glow)' : undefined}
                />

                {/* Inner Core */}
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r="4.5"
                  fill={isRestored ? '#16a34a' : node.color}
                />

                {/* Biome Name Label */}
                <text
                  x={node.cx}
                  y={node.cy + (node.cy > 100 ? 16 : -13)}
                  textAnchor="middle"
                  className={`text-[8px] font-bold font-serif pointer-events-none transition-all ${
                    isCurrent ? 'fill-stone-900 font-extrabold' : 'fill-stone-700 group-hover:fill-stone-900'
                  }`}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Current Location Badge overlay */}
        <div className="absolute bottom-1.5 left-2 pointer-events-none">
          <span className="text-[9px] font-mono text-stone-700 bg-white/90 px-1.5 py-0.5 rounded border border-amber-300 shadow-sm">
            Current: <strong className="text-amber-900 capitalize">{currentBiome}</strong>
          </span>
        </div>
      </div>

      {/* Interactive Tooltip Card - Warm Card */}
      <div className="mt-2 p-2 bg-white rounded-xl border border-amber-200 text-[10px] shadow-sm">
        {activeHover ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-stone-900 flex items-center gap-1 font-serif">
                <span>{activeHover.label}</span>
                {activeHover.id !== 'clearing' && (
                  <span
                    className={`text-[8.5px] px-1 py-0.2 rounded font-semibold ${
                      (restoration[activeHover.id] || 0) >= 80
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {(restoration[activeHover.id] || 0) >= 80 ? 'Flourishing' : 'In Crisis'}
                  </span>
                )}
              </div>
              <div className="text-stone-600 text-[9.5px]">Crop: {activeHover.cropName}</div>
            </div>
            <button
              onClick={() => handleSelectBiome(activeHover.id)}
              className="px-2.5 py-1 bg-amber-800 hover:bg-amber-700 text-amber-50 rounded-lg font-bold font-serif text-[9px] shadow-sm border border-amber-950"
            >
              Enter
            </button>
          </div>
        ) : (
          <div className="text-stone-600 flex items-center justify-between">
            <span>Hover or click paths to traverse biomes</span>
            <Sparkles className="w-3 h-3 text-emerald-600" />
          </div>
        )}
      </div>
    </div>
  );
}
