'use client';

import React, { useState, useEffect } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { FARM_CROPS } from '@/data/animals';
import { BiomeId } from '@/types/game';
import { sounds } from '@/utils/soundEffects';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowRight,
  Home,
  Trees,
  Droplets,
  Snowflake,
  Sun,
  Flame,
  Waves,
} from 'lucide-react';

interface BiomeTheme {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  headerBg: string;
  headerBorderColor: string;
  iconBg: string;
  iconBorderColor: string;
  iconColor: string;
  titleColor: string;
  subtextColor: string;
  panelBorderColor: string;
  badgeBg: string;
  badgeBorderColor: string;
  badgeTextColor: string;
}

const BIOME_THEMES: Record<BiomeId, BiomeTheme> = {
  clearing: {
    title: 'CENTRAL FARM',
    subtitle: 'Save biomes to revive crops',
    icon: Home,
    headerBg: '#5c2c16',
    headerBorderColor: '#2e1005',
    iconBg: '#78350f',
    iconBorderColor: '#fde68a',
    iconColor: '#fde68a',
    titleColor: '#fde68a',
    subtextColor: 'rgba(253, 230, 138, 0.85)',
    panelBorderColor: '#3e1a06',
    badgeBg: '#15803d',
    badgeBorderColor: '#86efac',
    badgeTextColor: '#fffbeb',
  },
  reefs: {
    title: 'REEFS',
    subtitle: 'Coastal Tidal Rice & Bio-Kelp',
    icon: Waves,
    headerBg: '#0e7490',
    headerBorderColor: '#164e63',
    iconBg: '#0891b2',
    iconBorderColor: '#67e8f9',
    iconColor: '#a5f3fc',
    titleColor: '#a5f3fc',
    subtextColor: 'rgba(165, 243, 252, 0.85)',
    panelBorderColor: '#0e7490',
    badgeBg: '#0891b2',
    badgeBorderColor: '#67e8f9',
    badgeTextColor: '#ffffff',
  },
  lake: {
    title: 'LAKE',
    subtitle: 'Golden Sweet Corn & Watershed',
    icon: Droplets,
    headerBg: '#0369a1',
    headerBorderColor: '#082f49',
    iconBg: '#0284c7',
    iconBorderColor: '#7dd3fc',
    iconColor: '#bae6fd',
    titleColor: '#bae6fd',
    subtextColor: 'rgba(186, 230, 253, 0.85)',
    panelBorderColor: '#0369a1',
    badgeBg: '#0284c7',
    badgeBorderColor: '#7dd3fc',
    badgeTextColor: '#ffffff',
  },
  forest: {
    title: 'FOREST',
    subtitle: 'Canopy Apple & Berry Orchard',
    icon: Trees,
    headerBg: '#14532d',
    headerBorderColor: '#052e16',
    iconBg: '#166534',
    iconBorderColor: '#86efac',
    iconColor: '#86efac',
    titleColor: '#bbf7d0',
    subtextColor: 'rgba(187, 247, 208, 0.85)',
    panelBorderColor: '#14532d',
    badgeBg: '#15803d',
    badgeBorderColor: '#86efac',
    badgeTextColor: '#ffffff',
  },
  tundra: {
    title: 'TUNDRA',
    subtitle: 'Glacial Winter Wheat & Permafrost',
    icon: Snowflake,
    headerBg: '#0284c7',
    headerBorderColor: '#0c4a6e',
    iconBg: '#0369a1',
    iconBorderColor: '#bae6fd',
    iconColor: '#e0f2fe',
    titleColor: '#f0f9ff',
    subtextColor: 'rgba(240, 249, 255, 0.85)',
    panelBorderColor: '#0284c7',
    badgeBg: '#0369a1',
    badgeBorderColor: '#38bdf8',
    badgeTextColor: '#ffffff',
  },
  grasslands: {
    title: 'GRASSLANDS',
    subtitle: 'Giant Pollinator Sunflowers',
    icon: Sun,
    headerBg: '#b45309',
    headerBorderColor: '#451a03',
    iconBg: '#d97706',
    iconBorderColor: '#fde68a',
    iconColor: '#fde68a',
    titleColor: '#fef3c7',
    subtextColor: 'rgba(254, 243, 199, 0.85)',
    panelBorderColor: '#b45309',
    badgeBg: '#d97706',
    badgeBorderColor: '#fde68a',
    badgeTextColor: '#ffffff',
  },
  desert: {
    title: 'DESERT',
    subtitle: 'Arid Sugar Melons & Sorghum',
    icon: Flame,
    headerBg: '#c2410c',
    headerBorderColor: '#431407',
    iconBg: '#ea580c',
    iconBorderColor: '#fed7aa',
    iconColor: '#fed7aa',
    titleColor: '#ffedd5',
    subtextColor: 'rgba(255, 237, 213, 0.85)',
    panelBorderColor: '#c2410c',
    badgeBg: '#ea580c',
    badgeBorderColor: '#fdba74',
    badgeTextColor: '#ffffff',
  },
};

// Biome-specific color themes for the "GO" buttons
const BIOME_BTN_STYLES: Record<Exclude<BiomeId, 'clearing'>, {
  bg: string;
  borderHighlight: string;
  borderShadow: string;
  arrow: string;
}> = {
  lake: {
    bg: '#0284c7',
    borderHighlight: '#7dd3fc',
    borderShadow: '#082f49',
    arrow: '#bae6fd',
  },
  forest: {
    bg: '#16a34a',
    borderHighlight: '#86efac',
    borderShadow: '#052e16',
    arrow: '#bbf7d0',
  },
  tundra: {
    bg: '#0284c7',
    borderHighlight: '#bae6fd',
    borderShadow: '#0c4a6e',
    arrow: '#e0f2fe',
  },
  grasslands: {
    bg: '#d97706',
    borderHighlight: '#fde68a',
    borderShadow: '#451a03',
    arrow: '#fef08a',
  },
  desert: {
    bg: '#ea580c',
    borderHighlight: '#fed7aa',
    borderShadow: '#431407',
    arrow: '#fed7aa',
  },
  reefs: {
    bg: '#0891b2',
    borderHighlight: '#67e8f9',
    borderShadow: '#164e63',
    arrow: '#a5f3fc',
  },
};

export default function FarmStatusWidget() {
  const { currentBiome, restoration, setCurrentBiome, openCropModal } = useGameState();
  // Default to collapsed when entering any biome
  const [isExpanded, setIsExpanded] = useState(false);

  // Every time the user enters a biome (currentBiome changes), collapse the task list by default
  useEffect(() => {
    setIsExpanded(false);
  }, [currentBiome]);

  const cropKeys = Object.keys(FARM_CROPS) as (keyof typeof FARM_CROPS)[];
  const flourishingCount = cropKeys.filter((k) => (restoration[k] || 0) >= 80).length;

  const theme = BIOME_THEMES[currentBiome] || BIOME_THEMES.clearing;
  const ActiveIcon = theme.icon;

  return (
    <div className="absolute top-3 right-3 z-20 w-80 sm:w-88 max-w-[calc(100vw-1.5rem)] select-none font-pixel transition-all duration-300">
      <div
        className="pixel-panel shadow-2xl overflow-hidden transition-all duration-300 text-[#2e1005]"
        style={{
          borderColor: theme.panelBorderColor,
          boxShadow: `3px 3px 0px ${theme.headerBorderColor}`,
        }}
      >
        {/* Dynamic Header Bar - Colors & Title reflect current biome avatar is in */}
        <div
          onClick={() => {
            sounds.playClick();
            setIsExpanded(!isExpanded);
          }}
          className="p-2.5 border-b-4 flex items-center justify-between cursor-pointer transition-all duration-300 hover:brightness-110 shadow-sm text-[#fffbeb]"
          style={{
            backgroundColor: theme.headerBg,
            borderBottomColor: theme.headerBorderColor,
          }}
          title={isExpanded ? 'Click to collapse task list' : 'Click to expand task list'}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-6 h-6 border-2 flex items-center justify-center flex-shrink-0 transition-colors"
              style={{
                backgroundColor: theme.iconBg,
                borderColor: theme.iconBorderColor,
              }}
            >
              <ActiveIcon className="w-3.5 h-3.5" style={{ color: theme.iconColor }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3
                  className="text-[11.5px] font-pixel-heading tracking-wider"
                  style={{ color: theme.titleColor }}
                >
                  {theme.title}
                </h3>
                <span
                  className="text-[9px] px-1.5 py-0.5 border font-bold"
                  style={{
                    backgroundColor: theme.badgeBg,
                    borderColor: theme.badgeBorderColor,
                    color: theme.badgeTextColor,
                  }}
                >
                  {flourishingCount}/6 CROPS
                </span>
              </div>
              <p
                className="text-[8.5px] truncate mt-0.5"
                style={{ color: theme.subtextColor }}
              >
                {currentBiome === 'clearing'
                  ? 'Save biomes to revive crops'
                  : `Current Biome • ${FARM_CROPS[currentBiome as Exclude<BiomeId, 'clearing'>]?.name || 'Revive Crop'}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sounds.playClick();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 transition-transform hover:scale-110 flex-shrink-0 ml-1"
            style={{ color: theme.titleColor }}
            aria-label={isExpanded ? 'Collapse crop list' : 'Expand crop list'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded Crops List */}
        {isExpanded && (
          <div className="p-2 space-y-1.5 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto bg-[#fcf6e8]">
            {cropKeys.map((biomeKey) => {
              const crop = FARM_CROPS[biomeKey];
              const isFlourished = (restoration[biomeKey] || 0) >= 80;
              const isCurrentBiome = currentBiome === biomeKey;
              const btnStyle = BIOME_BTN_STYLES[biomeKey];

              return (
                <div
                  key={biomeKey}
                  onClick={() => {
                    sounds.playClick();
                    openCropModal(biomeKey);
                  }}
                  className={`p-2 pixel-card transition-all flex items-start justify-between gap-2 cursor-pointer hover:scale-[1.01] ${
                    isFlourished
                       ? 'bg-[#f0fdf4] border-[#15803d] hover:bg-[#dcfce7]'
                      : isCurrentBiome
                      ? 'bg-[#fefce8] border-2 border-[#b45309] shadow-sm'
                      : 'bg-[#fffbf2] border-[#5c2c16] hover:border-[#b45309] hover:bg-[#fef9c3]'
                  }`}
                  title="Click to view crop details & restoration steps"
                >
                  {/* Left: Crop Thumbnail Icon */}
                  <div className="relative flex-shrink-0 mt-0.5">
                    <img
                      src={isFlourished ? crop.icon : crop.deadIcon}
                      alt={crop.name}
                      className="w-8 h-8 object-contain border-2 border-[#5c2c16] bg-[#fef3c7]"
                    />
                    {isCurrentBiome && (
                      <span
                        title="Avatar is currently in this biome"
                        className="absolute -top-1 -right-1 flex h-2 w-2"
                      >
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                      </span>
                    )}
                  </div>

                  {/* Middle: Title (max 2 lines) + Biome Tag, and Description (unlimited lines) */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                      <h4
                        className="text-[11px] font-bold text-[#2e1005] leading-snug break-words"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'break-word',
                        }}
                      >
                        {crop.name}
                      </h4>
                      <span
                        className={`text-[8px] uppercase px-1 py-0.5 border flex-shrink-0 font-bold whitespace-nowrap ml-1 ${
                          isCurrentBiome
                            ? 'bg-[#fde047] text-[#713f12] border-[#ca8a04]'
                            : 'bg-[#fef08a] text-[#854d0e] border-[#ca8a04]'
                        }`}
                      >
                        {biomeKey}
                      </span>
                    </div>

                    <p className="text-[8.5px] sm:text-[9.5px] text-[#78350f] leading-relaxed break-words whitespace-normal mt-1">
                      {isFlourished ? '✓ Thriving harvest!' : crop.crisisDescription}
                    </p>
                  </div>

                  {/* Right: Action Button or Saved Status */}
                  <div className="flex-shrink-0 self-start mt-0.5 ml-1">
                    {isFlourished ? (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#15803d] px-1.5 py-0.5 bg-[#dcfce7] border border-[#16a34a] whitespace-nowrap">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>SAVED</span>
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playClick();
                          if (isCurrentBiome) {
                            openCropModal(biomeKey);
                          } else {
                            setCurrentBiome(biomeKey as BiomeId);
                          }
                        }}
                        style={{
                          backgroundColor: btnStyle.bg,
                          borderTopColor: btnStyle.borderHighlight,
                          borderLeftColor: btnStyle.borderHighlight,
                          borderRightColor: btnStyle.borderShadow,
                          borderBottomColor: btnStyle.borderShadow,
                        }}
                        className="pixel-btn flex items-center gap-1 text-[8px] px-2 py-1 font-bold cursor-pointer whitespace-nowrap text-[#fffbeb] hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] transition-all"
                        title={isCurrentBiome ? `Current biome: click to inspect ${crop.name}` : `Fast travel to ${biomeKey}`}
                      >
                        <span>GO</span>
                        <ArrowRight className="w-2.5 h-2.5" style={{ color: btnStyle.arrow }} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
