export type BiomeId = 'clearing' | 'forest' | 'lake' | 'tundra' | 'grasslands' | 'desert' | 'reefs';

export type AnimalId = 'red_panda' | 'manatee' | 'polar_bear' | 'butterfly' | 'cheetah' | 'sea_turtle';

export interface AnimalInfo {
  id: AnimalId;
  name: string;
  species: string;
  biome: BiomeId;
  biomeName: string;
  avatar: string;
  tagline: string;
  description: string;
  threat: string;
  solution: string;
  coinName: string;
  coinIcon: string;
  voicePitch: number;
  initialGreeting: string;
  suggestedQuestions: string[];
}

export interface CropInfo {
  biome: BiomeId;
  name: string;
  icon: string;
  deadIcon: string;
  crisisDescription: string;
  flourishDescription: string;
  yieldMultiplier: number;
  crisisHeadline?: string;
  detailedCrisisReason?: string;
  threatFactors?: string[];
  restorationSolution?: string;
  guardianAnimalId?: AnimalId;
  produceIcon?: string;
  produceName?: string;
  biomeDisplayName?: string;
}

export type CropHarvestStatus = 'crisis' | 'grown' | 'growing';

export interface CropPlotState {
  status: CropHarvestStatus;
  plantedAt?: number;
  growDurationMs: number;
  harvestCount: number;
}

export interface CoinLedger {
  forest: number;
  lake: number;
  tundra: number;
  grasslands: number;
  desert: number;
  reefs: number;
}

export interface Quest {
  id: string;
  biome: BiomeId;
  title: string;
  subtitle: string;
  description: string;
  rewardCoins: number;
  rewardRestoration: number;
  completed: boolean;
  actionType: 'wildfire_quench' | 'forest_campaign' | 'lake_recycling' | 'tundra_petition' | 'grasslands_farming' | 'reef_navigation' | 'desert_aquifer';
  icon: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  biome: BiomeId | 'global';
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export interface ActionRecord {
  id: string;
  title: string;
  type: string;
  biome: BiomeId;
  timestamp: string;
  impactMetrics: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  geminiApiKey: string;
  reducedMotion: boolean;
}
