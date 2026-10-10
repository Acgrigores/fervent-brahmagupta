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
  const farmNode = { id: 'clearing' as BiomeId, label: 'Central Farm', cx: 110, cy: 85, color: '#10b981' };

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
      color: '#38bdf8',
      pathStroke: '#38bdf8',
      cropName: FARM_CROPS.tundra.name,
    },
    {
      id: 'grasslands',
      label: 'Prairie',
      cx: 188,
      cy: 85,
      color: '#eab308',
      pathStroke: '#eab308',
      cropName: FARM_CROPS.grasslands.name,
    },
    {
      id: 'desert',
      label: 'Desert',
      cx: 175,
      cy: 142,
      color: '#f97316',
      pathStroke: '#f97316',
      cropName: FARM_CROPS.desert.name,
    },
    {
      id: 'reefs',
      label: 'Reefs',
      cx: 110,
      cy: 145,
      color: '#06b6d4',
      pathStroke: '#06b6d4',
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
    <div className="absolute top-4 right-4 z-20 hidden lg:block bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-3 shadow-2xl select-none w-64">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>Biome Map & Travel Paths</span>
        </span>
        <span className="text-[9px] font-mono text-zinc-400">Click to travel</span>
      </div>

      {/* Interactive Path Map SVG */}
      <div className="relative w-full h-44 bg-zinc-900/90 rounded-xl border border-zinc-800/80 overflow-hidden flex items-center justify-center">
        {/* Subtle coordinate grid lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:10px_10px] opacity-35 pointer-events-none" />

        <svg viewBox="0 0 220 170" className="w-full h-full relative z-10">
          <defs>
            {/* Pulsing glow filter for active player position */}
            <filter id="map-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
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
                  strokeWidth="14"
                />

                {/* Outer path glow */}
                <line
                  x1={farmNode.cx}
                  y1={farmNode.cy}
                  x2={node.cx}
                  y2={node.cy}
                  stroke={node.pathStroke}
                  strokeWidth={isHovered ? 5 : 3}
                  strokeOpacity={isHovered ? 0.7 : 0.3}
                  strokeLinecap="round"
                />

                {/* Inner color-coded active path stroke */}
                <line
                  x1={farmNode.cx}
                  y1={farmNode.cy}
                  x2={node.cx}
                  y2={node.cy}
                  stroke={node.pathStroke}
                  strokeWidth={isHovered ? 2.5 : 1.8}
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
            {/* Hub base ring */}
            <circle
              cx={farmNode.cx}
              cy={farmNode.cy}
              r={hoveredBiome === 'clearing' ? 14 : 12}
              fill="#18181b"
              stroke="#10b981"
              strokeWidth="2.5"
            />
            {/* Inner fill */}
            <circle
              cx={farmNode.cx}
              cy={farmNode.cy}
              r="6.5"
              fill={currentBiome === 'clearing' ? '#34d399' : '#10b981'}
            />
            <text
              x={farmNode.cx}
              y={farmNode.cy + 19}
              textAnchor="middle"
              className="text-[8px] font-bold fill-zinc-300 pointer-events-none font-sans"
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
                    strokeWidth="1.5"
                    className="animate-ping opacity-60"
                  />
                )}

                {/* Outer Node Circle */}
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r={isHovered || isCurrent ? 11 : 9}
                  fill="#18181b"
                  stroke={isRestored ? '#22c55e' : node.color}
                  strokeWidth={isCurrent ? 2.5 : 1.8}
                  filter={isCurrent ? 'url(#map-glow)' : undefined}
                />

                {/* Inner Core */}
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r="4.5"
                  fill={isRestored ? '#22c55e' : node.color}
                />

                {/* Biome Name Label */}
                <text
                  x={node.cx}
                  y={node.cy + (node.cy > 100 ? 16 : -13)}
                  textAnchor="middle"
                  className={`text-[8px] font-bold font-sans pointer-events-none transition-all ${
                    isCurrent ? 'fill-white' : 'fill-zinc-400 group-hover:fill-zinc-200'
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
          <span className="text-[9px] font-mono text-zinc-400 bg-zinc-950/80 px-1.5 py-0.5 rounded border border-zinc-800">
            Current: <strong className="text-white capitalize">{currentBiome}</strong>
          </span>
        </div>
      </div>

      {/* Interactive Tooltip Card */}
      <div className="mt-2 p-2 bg-zinc-900 rounded-xl border border-zinc-800 text-[10px]">
        {activeHover ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-white flex items-center gap-1">
                <span>{activeHover.label}</span>
                {activeHover.id !== 'clearing' && (
                  <span
                    className={`text-[8.5px] px-1 py-0.2 rounded font-semibold ${
                      (restoration[activeHover.id] || 0) >= 80
                        ? 'bg-emerald-950 text-emerald-300'
                        : 'bg-amber-950 text-amber-300'
                    }`}
                  >
                    {(restoration[activeHover.id] || 0) >= 80 ? 'Flourishing' : 'In Crisis'}
                  </span>
                )}
              </div>
              <div className="text-zinc-400 text-[9.5px]">Crop: {activeHover.cropName}</div>
            </div>
            <button
              onClick={() => handleSelectBiome(activeHover.id)}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[9px] shadow"
            >
              Enter
            </button>
          </div>
        ) : (
          <div className="text-zinc-400 flex items-center justify-between">
            <span>Hover or click paths to traverse biomes</span>
            <Sparkles className="w-3 h-3 text-emerald-400" />
          </div>
        )}
      </div>
    </div>
  );
}
