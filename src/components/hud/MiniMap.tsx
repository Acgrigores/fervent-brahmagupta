'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { BiomeId } from '@/types/game';
import { FARM_CROPS } from '@/data/animals';
import { sounds } from '@/utils/soundEffects';
import { Compass } from 'lucide-react';

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
    ? biomeNodes.find((b) => b.id === hoveredBiome) || (hoveredBiome === 'clearing' ? { label: 'Central Farm', cropName: '6 Crops', id: 'clearing' as BiomeId } : null)
    : null;

  return (
    <div className="absolute top-3 right-3 z-20 hidden lg:block pixel-panel p-2.5 select-none w-60 text-[#2e1005] font-pixel shadow-xl">
      {/* Pixel Header */}
      <div className="flex items-center justify-between mb-1.5 border-b-2 border-[#5c2c16] pb-1">
        <span className="text-[10px] font-bold text-[#5c2c16] flex items-center gap-1.5 uppercase">
          <Compass className="w-3.5 h-3.5 text-[#b45309]" />
          <span>FARM MAP</span>
        </span>
        <span className="text-[8.5px] px-1 py-0.5 bg-[#fef08a] border border-[#ca8a04] text-[#854d0e] font-bold">
          {currentBiome.toUpperCase()}
        </span>
      </div>

      {/* Interactive Path Map SVG - Retro Pixel Parchment */}
      <div className="relative w-full h-40 bg-[#fde68a]/30 border-2 border-[#5c2c16] overflow-hidden flex items-center justify-center">
        <svg viewBox="0 0 220 170" className="w-full h-full relative z-10">
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
                {/* Wide invisible stroke for easy clicking to travel */}
                <line
                  x1={farmNode.cx}
                  y1={farmNode.cy}
                  x2={node.cx}
                  y2={node.cy}
                  stroke="transparent"
                  strokeWidth="20"
                />

                {/* Outer shadow stroke */}
                <line
                  x1={farmNode.cx}
                  y1={farmNode.cy}
                  x2={node.cx}
                  y2={node.cy}
                  stroke="#2e1005"
                  strokeWidth={isHovered ? 5 : 3.5}
                  strokeLinecap="square"
                />

                {/* Inner color-coded path stroke */}
                <line
                  x1={farmNode.cx}
                  y1={farmNode.cy}
                  x2={node.cx}
                  y2={node.cy}
                  stroke={node.pathStroke}
                  strokeWidth={isHovered ? 3 : 2}
                  strokeDasharray={isRestored ? 'none' : '3 3'}
                  strokeLinecap="square"
                />
              </g>
            );
          })}

          {/* Central Farm Hub Node - Click to travel there */}
          <g
            className="cursor-pointer"
            onClick={() => handleSelectBiome('clearing')}
            onMouseEnter={() => setHoveredBiome('clearing')}
            onMouseLeave={() => setHoveredBiome(null)}
          >
            <rect
              x={farmNode.cx - 12}
              y={farmNode.cy - 12}
              width="24"
              height="24"
              fill={currentBiome === 'clearing' ? '#86efac' : '#fef3c7'}
              stroke="#2e1005"
              strokeWidth="2.5"
            />
            <rect
              x={farmNode.cx - 5}
              y={farmNode.cy - 5}
              width="10"
              height="10"
              fill="#15803d"
            />
            <text
              x={farmNode.cx}
              y={farmNode.cy + 19}
              textAnchor="middle"
              className="text-[7.5px] font-bold fill-[#2e1005] pointer-events-none font-pixel"
            >
              FARM
            </text>
          </g>

          {/* Biome Destination Nodes - Click to travel there */}
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
                {/* Active Player Beacon Highlight */}
                {isCurrent && (
                  <rect
                    x={node.cx - 13}
                    y={node.cy - 13}
                    width="26"
                    height="26"
                    fill="none"
                    stroke="#b45309"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                    className="animate-spin"
                  />
                )}

                {/* Outer Node Square (Pixel Art Style) */}
                <rect
                  x={node.cx - (isHovered || isCurrent ? 10 : 8)}
                  y={node.cy - (isHovered || isCurrent ? 10 : 8)}
                  width={isHovered || isCurrent ? 20 : 16}
                  height={isHovered || isCurrent ? 20 : 16}
                  fill={isCurrent ? '#fef08a' : '#ffffff'}
                  stroke="#2e1005"
                  strokeWidth="2"
                />

                {/* Inner Core */}
                <rect
                  x={node.cx - 4}
                  y={node.cy - 4}
                  width="8"
                  height="8"
                  fill={isRestored ? '#16a34a' : node.color}
                />

                {/* Biome Name Label */}
                <text
                  x={node.cx}
                  y={node.cy + (node.cy > 100 ? 17 : -12)}
                  textAnchor="middle"
                  className={`text-[7.5px] font-bold font-pixel pointer-events-none ${
                    isCurrent ? 'fill-[#b45309] font-extrabold' : 'fill-[#2e1005]'
                  }`}
                >
                  {node.label.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Direct Travel Status Info / Tooltip */}
      <div className="mt-1.5 p-1.5 pixel-card text-[8.5px]">
        {activeHover ? (
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#78350f]">
              {activeHover.label.toUpperCase()}
            </span>
            <span className="text-[#15803d] font-bold">
              CLICK TO TRAVEL →
            </span>
          </div>
        ) : (
          <div className="text-stone-700 flex items-center justify-between">
            <span className="font-bold text-[#5c2c16]">DESTINATION NODES:</span>
            <span className="text-[#b45309] font-bold">CLICK TO TRAVEL</span>
          </div>
        )}
      </div>
    </div>
  );
}
