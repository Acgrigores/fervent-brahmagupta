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
  cropName: string;
}

export default function MiniMap() {
  const { currentBiome, restoration, quests, setCurrentBiome } = useGameState();
  const [hoveredBiome, setHoveredBiome] = useState<BiomeId | null>(null);

  // SVG coordinate geometry centered around Central Farm at (110, 85)
  const farmNode = { id: 'clearing' as BiomeId, label: 'Central Farm', cx: 110, cy: 85 };

  const biomeNodes: BiomeNode[] = [
    {
      id: 'lake',
      label: 'Lake',
      cx: 32,
      cy: 85,
      cropName: FARM_CROPS.lake.name,
    },
    {
      id: 'forest',
      label: 'Forest',
      cx: 45,
      cy: 35,
      cropName: FARM_CROPS.forest.name,
    },
    {
      id: 'tundra',
      label: 'Tundra',
      cx: 110,
      cy: 25,
      cropName: FARM_CROPS.tundra.name,
    },
    {
      id: 'grasslands',
      label: 'Prairie',
      cx: 188,
      cy: 85,
      cropName: FARM_CROPS.grasslands.name,
    },
    {
      id: 'desert',
      label: 'Desert',
      cx: 175,
      cy: 142,
      cropName: FARM_CROPS.desert.name,
    },
    {
      id: 'reefs',
      label: 'Reefs',
      cx: 110,
      cy: 145,
      cropName: FARM_CROPS.reefs.name,
    },
  ];

  const isBiomeSolved = (biomeId: BiomeId): boolean => {
    const score = restoration[biomeId] || 0;
    const questDone = quests && quests.some((q) => q.biome === biomeId && q.completed);
    return score >= 80 || !!questDone;
  };

  const isFarmSolved = isBiomeSolved('clearing');

  const handleSelectBiome = (id: BiomeId) => {
    sounds.playClick();
    setCurrentBiome(id);
  };

  const activeHover = hoveredBiome
    ? biomeNodes.find((b) => b.id === hoveredBiome) ||
      (hoveredBiome === 'clearing'
        ? { label: 'Central Farm', cropName: '6 Crops', id: 'clearing' as BiomeId, cx: 110, cy: 85 }
        : null)
    : null;

  const activeHoverSolved = activeHover ? isBiomeSolved(activeHover.id) : false;

  return (
    <div className="absolute top-3 right-3 z-20 hidden lg:block pixel-panel p-2.5 select-none w-64 text-[#2e1005] font-pixel shadow-xl">
      {/* Pixel Header */}
      <div className="flex items-center justify-between mb-1.5 border-b-2 border-[#5c2c16] pb-1">
        <span className="text-[10px] font-bold text-[#5c2c16] flex items-center gap-1.5 uppercase">
          <Compass className="w-3.5 h-3.5 text-[#b45309]" />
          <span>FARM MAP</span>
        </span>
        <span className="text-[8.5px] px-1.5 py-0.5 bg-[#fef08a] border border-[#ca8a04] text-[#854d0e] font-bold">
          {currentBiome.toUpperCase()}
        </span>
      </div>

      {/* Color-Coded Map Legend */}
      <div className="flex items-center justify-between px-2 py-1 mb-1.5 bg-[#fef3c7] border border-[#b45309] text-[7.5px] rounded-sm">
        <div className="flex items-center gap-1 text-[#15803d] font-bold">
          <span className="w-2.5 h-2.5 bg-[#16a34a] border border-[#14532d] flex items-center justify-center text-white text-[6px]">
            ✓
          </span>
          <span>SOLVED</span>
        </div>
        <div className="flex items-center gap-1 text-[#c2410c] font-bold">
          <span className="w-2.5 h-2.5 bg-[#ea580c] border border-[#9a3412] flex items-center justify-center text-white text-[6px]">
            !
          </span>
          <span>UNSOLVED</span>
        </div>
        <div className="text-[7px] text-[#78350f]">
          TAP TO TRAVEL
        </div>
      </div>

      {/* Interactive Path Map SVG - Retro Pixel Parchment */}
      <div className="relative w-full h-40 bg-[#fde68a]/35 border-2 border-[#5c2c16] overflow-hidden flex items-center justify-center">
        <svg viewBox="0 0 220 170" className="w-full h-full relative z-10">
          {/* Color-Coded Branching Paths from Central Farm to Each Biome */}
          {biomeNodes.map((node) => {
            const isHovered = hoveredBiome === node.id;
            const isSolved = isBiomeSolved(node.id);
            const pathColor = isSolved ? '#16a34a' : '#ea580c';

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

                {/* Inner color-coded path stroke (Solid Green = Solved, Dashed Orange = Unsolved) */}
                <line
                  x1={farmNode.cx}
                  y1={farmNode.cy}
                  x2={node.cx}
                  y2={node.cy}
                  stroke={pathColor}
                  strokeWidth={isHovered ? 3.5 : 2.5}
                  strokeDasharray={isSolved ? 'none' : '4 3'}
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
              x={farmNode.cx - 13}
              y={farmNode.cy - 13}
              width="26"
              height="26"
              fill={currentBiome === 'clearing' ? '#bbf7d0' : isFarmSolved ? '#dcfce7' : '#ffedd5'}
              stroke={isFarmSolved ? '#15803d' : '#9a3412'}
              strokeWidth="2.5"
            />
            <rect
              x={farmNode.cx - 6}
              y={farmNode.cy - 6}
              width="12"
              height="12"
              fill={isFarmSolved ? '#16a34a' : '#ea580c'}
            />
            <text
              x={farmNode.cx}
              y={farmNode.cy + 3}
              textAnchor="middle"
              className="text-[7px] font-extrabold fill-white pointer-events-none font-pixel"
            >
              {isFarmSolved ? '✓' : '!'}
            </text>
            <text
              x={farmNode.cx}
              y={farmNode.cy + 21}
              textAnchor="middle"
              className={`text-[7.5px] font-bold pointer-events-none font-pixel ${
                isFarmSolved ? 'fill-[#15803d]' : 'fill-[#9a3412]'
              }`}
            >
              FARM
            </text>
          </g>

          {/* Biome Destination Nodes - Click to travel there */}
          {biomeNodes.map((node) => {
            const isCurrent = currentBiome === node.id;
            const isHovered = hoveredBiome === node.id;
            const isSolved = isBiomeSolved(node.id);
            const nodeFill = isSolved ? '#dcfce7' : '#ffedd5';
            const nodeStroke = isSolved ? '#15803d' : '#c2410c';
            const innerColor = isSolved ? '#16a34a' : '#ea580c';

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
                    x={node.cx - 14}
                    y={node.cy - 14}
                    width="28"
                    height="28"
                    fill="none"
                    stroke="#b45309"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                    className="animate-spin"
                  />
                )}

                {/* Outer Node Square (Pixel Art Style, Color Coded) */}
                <rect
                  x={node.cx - (isHovered || isCurrent ? 11 : 9)}
                  y={node.cy - (isHovered || isCurrent ? 11 : 9)}
                  width={isHovered || isCurrent ? 22 : 18}
                  height={isHovered || isCurrent ? 22 : 18}
                  fill={isCurrent ? '#fef08a' : nodeFill}
                  stroke={nodeStroke}
                  strokeWidth="2.5"
                />

                {/* Inner Core Status Badge */}
                <rect
                  x={node.cx - 5}
                  y={node.cy - 5}
                  width="10"
                  height="10"
                  fill={innerColor}
                />

                {/* Badge symbol: checkmark if solved, exclamation if unsolved */}
                <text
                  x={node.cx}
                  y={node.cy + 2.5}
                  textAnchor="middle"
                  className="text-[6.5px] font-extrabold fill-white pointer-events-none font-pixel"
                >
                  {isSolved ? '✓' : '!'}
                </text>

                {/* Biome Name Label (Color coded) */}
                <text
                  x={node.cx}
                  y={node.cy + (node.cy > 100 ? 18 : -13)}
                  textAnchor="middle"
                  className={`text-[7.5px] font-bold font-pixel pointer-events-none ${
                    isCurrent
                      ? 'fill-[#b45309] font-black'
                      : isSolved
                      ? 'fill-[#15803d]'
                      : 'fill-[#c2410c]'
                  }`}
                >
                  {node.label.toUpperCase()} {isSolved ? '✓' : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Direct Travel Status Info / Tooltip */}
      <div className="mt-1.5 p-1.5 pixel-card text-[8px]">
        {activeHover ? (
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#78350f]">
              {activeHover.label.toUpperCase()}:
            </span>
            <span className={activeHoverSolved ? 'text-[#15803d] font-bold' : 'text-[#ea580c] font-bold'}>
              {activeHoverSolved ? '✓ SOLVED • TRAVEL →' : '⚠ UNSOLVED • TRAVEL →'}
            </span>
          </div>
        ) : (
          <div className="text-stone-700 flex items-center justify-between">
            <span className="font-bold text-[#5c2c16]">DESTINATION:</span>
            <span className="text-[#b45309] font-bold">CLICK NODE TO TRAVEL</span>
          </div>
        )}
      </div>
    </div>
  );
}
