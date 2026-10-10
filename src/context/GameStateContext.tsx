'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { BiomeId, AnimalId, CoinLedger, Quest, Badge, ActionRecord, GameSettings, CropPlotState } from '@/types/game';
import { ANIMALS, INITIAL_BADGES, INITIAL_QUESTS, FARM_CROPS, CHARITIES } from '@/data/animals';
import { sounds } from '@/utils/soundEffects';

interface GameStateContextType {
  currentBiome: BiomeId;
  setCurrentBiome: (biome: BiomeId) => void;
  restoration: Record<BiomeId, number>;
  globalFlourish: number;
  coins: CoinLedger;
  totalCoins: number;
  biomeTimeSpent: Record<BiomeId, number>;
  getBiomeMoneyRaised: (biome: BiomeId) => number;
  totalMoneyRaised: number;
  donationPoolDollars: number;
  quests: Quest[];
  badges: Badge[];
  actions: ActionRecord[];
  activeDialogueAnimal: AnimalId | null;
  openDialogue: (animalId: AnimalId) => void;
  closeDialogue: () => void;
  activeQuestModal: Quest['actionType'] | null;
  openQuestModal: (actionType: Quest['actionType']) => void;
  closeQuestModal: () => void;
  completeQuest: (questId: string, impactSummary: string) => void;
  addCoins: (biome: BiomeId, amount: number) => void;
  boostRestoration: (biome: BiomeId, amount: number) => void;
  triggerAdBoost: (sponsorName: string) => void;
  settings: GameSettings;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  isQuestsOpen: boolean;
  setIsQuestsOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
  activeCropModal: Exclude<BiomeId, 'clearing'> | null;
  openCropModal: (biome: Exclude<BiomeId, 'clearing'>) => void;
  closeCropModal: () => void;
  cropPlots: Record<Exclude<BiomeId, 'clearing'>, CropPlotState>;
  harvestCrop: (biome: Exclude<BiomeId, 'clearing'>) => boolean;
  fixCrop: (biome: Exclude<BiomeId, 'clearing'>) => void;
  forceGrowCrop: (biome: Exclude<BiomeId, 'clearing'>) => void;
  boostGrowingCrops: (ms: number) => number;
  recentBuyerEvent: {
    id: string;
    biome: Exclude<BiomeId, 'clearing'>;
    cropName: string;
    produceIcon: string;
    coinsEarned: number;
    timestamp: number;
  } | null;
  clearBuyerEvent: () => void;
  isPremiseOpen: boolean;
  setIsPremiseOpen: (open: boolean) => void;
  openPremiseModal: () => void;
  closePremiseModal: () => void;
  isAnyPopupOpen: boolean;
  notification: string | null;
  setNotification: (msg: string | null) => void;
  resetGame: () => void;
}

const defaultCoins: CoinLedger = {
  forest: 0,
  lake: 0,
  tundra: 0,
  grasslands: 0,
  desert: 0,
  reefs: 0,
};

const defaultRestoration: Record<BiomeId, number> = {
  clearing: 0,
  forest: 0,
  lake: 0,
  tundra: 0,
  grasslands: 0,
  desert: 0,
  reefs: 0,
};

const defaultCropPlots: Record<Exclude<BiomeId, 'clearing'>, CropPlotState> = {
  lake: { status: 'crisis', growDurationMs: 20 * 60 * 1000, harvestCount: 0 },
  forest: { status: 'crisis', growDurationMs: 20 * 60 * 1000, harvestCount: 0 },
  tundra: { status: 'crisis', growDurationMs: 20 * 60 * 1000, harvestCount: 0 },
  grasslands: { status: 'crisis', growDurationMs: 20 * 60 * 1000, harvestCount: 0 },
  desert: { status: 'crisis', growDurationMs: 20 * 60 * 1000, harvestCount: 0 },
  reefs: { status: 'crisis', growDurationMs: 20 * 60 * 1000, harvestCount: 0 },
};

const defaultBiomeTimeSpent: Record<BiomeId, number> = {
  clearing: 0,
  forest: 0,
  lake: 0,
  tundra: 0,
  grasslands: 0,
  desert: 0,
  reefs: 0,
};

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

const STORAGE_KEY = 'field_to_future_state_v1';

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [currentBiome, setCurrentBiomeState] = useState<BiomeId>('clearing');
  const [restoration, setRestoration] = useState<Record<BiomeId, number>>(defaultRestoration);
  const [coins, setCoins] = useState<CoinLedger>(defaultCoins);
  const [biomeTimeSpent, setBiomeTimeSpent] = useState<Record<BiomeId, number>>(defaultBiomeTimeSpent);
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [activeDialogueAnimal, setActiveDialogueAnimal] = useState<AnimalId | null>(null);
  const [activeQuestModal, setActiveQuestModal] = useState<Quest['actionType'] | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [cropPlots, setCropPlots] = useState<Record<Exclude<BiomeId, 'clearing'>, CropPlotState>>(defaultCropPlots);
  const [recentBuyerEvent, setRecentBuyerEvent] = useState<{
    id: string;
    biome: Exclude<BiomeId, 'clearing'>;
    cropName: string;
    produceIcon: string;
    coinsEarned: number;
    timestamp: number;
  } | null>(null);

  // Modals
  const [isProfileOpen, setIsProfileOpenState] = useState(false);
  const [isQuestsOpen, setIsQuestsOpenState] = useState(false);
  const [isSettingsOpen, setIsSettingsOpenState] = useState(false);
  const [isHelpOpen, setIsHelpOpenState] = useState(false);
  const [activeCropModal, setActiveCropModalState] = useState<Exclude<BiomeId, 'clearing'> | null>(null);
  const [isPremiseOpen, setIsPremiseOpenState] = useState(true);

  // Synchronous refs to prevent multiple modals opening simultaneously or on top of each other
  const activeDialogueAnimalRef = useRef<AnimalId | null>(null);
  const activeQuestModalRef = useRef<Quest['actionType'] | null>(null);
  const activeCropModalRef = useRef<Exclude<BiomeId, 'clearing'> | null>(null);
  const isProfileOpenRef = useRef(false);
  const isQuestsOpenRef = useRef(false);
  const isSettingsOpenRef = useRef(false);
  const isHelpOpenRef = useRef(false);
  const isPremiseOpenRef = useRef(true);

  activeDialogueAnimalRef.current = activeDialogueAnimal;
  activeQuestModalRef.current = activeQuestModal;
  activeCropModalRef.current = activeCropModal;
  isProfileOpenRef.current = isProfileOpen;
  isQuestsOpenRef.current = isQuestsOpen;
  isSettingsOpenRef.current = isSettingsOpen;
  isHelpOpenRef.current = isHelpOpen;
  isPremiseOpenRef.current = isPremiseOpen;

  const checkIsAnyPopupOpen = useCallback(() => {
    return Boolean(
      activeDialogueAnimalRef.current ||
      activeQuestModalRef.current ||
      activeCropModalRef.current ||
      isProfileOpenRef.current ||
      isQuestsOpenRef.current ||
      isSettingsOpenRef.current ||
      isHelpOpenRef.current ||
      isPremiseOpenRef.current
    );
  }, []);

  const isAnyPopupOpen = Boolean(
    activeDialogueAnimal ||
    activeQuestModal ||
    activeCropModal ||
    isProfileOpen ||
    isQuestsOpen ||
    isSettingsOpen ||
    isHelpOpen ||
    isPremiseOpen
  );

  const openCropModal = useCallback((biome: Exclude<BiomeId, 'clearing'>) => {
    if (checkIsAnyPopupOpen()) return;
    sounds.playClick();
    activeCropModalRef.current = biome;
    setActiveCropModalState(biome);
  }, [checkIsAnyPopupOpen]);

  const closeCropModal = useCallback(() => {
    activeCropModalRef.current = null;
    setActiveCropModalState(null);
  }, []);

  const setIsPremiseOpen = useCallback((open: boolean) => {
    if (open) {
      if (checkIsAnyPopupOpen()) return;
      sounds.playClick();
      isPremiseOpenRef.current = true;
      setIsPremiseOpenState(true);
    } else {
      isPremiseOpenRef.current = false;
      setIsPremiseOpenState(false);
    }
  }, [checkIsAnyPopupOpen]);

  const openPremiseModal = useCallback(() => {
    setIsPremiseOpen(true);
  }, [setIsPremiseOpen]);

  const closePremiseModal = useCallback(() => {
    setIsPremiseOpen(false);
  }, [setIsPremiseOpen]);

  const setIsProfileOpen = useCallback((open: boolean) => {
    if (open) {
      if (checkIsAnyPopupOpen()) return;
      isProfileOpenRef.current = true;
      setIsProfileOpenState(true);
    } else {
      isProfileOpenRef.current = false;
      setIsProfileOpenState(false);
    }
  }, [checkIsAnyPopupOpen]);

  const setIsQuestsOpen = useCallback((open: boolean) => {
    if (open) {
      if (checkIsAnyPopupOpen()) return;
      isQuestsOpenRef.current = true;
      setIsQuestsOpenState(true);
    } else {
      isQuestsOpenRef.current = false;
      setIsQuestsOpenState(false);
    }
  }, [checkIsAnyPopupOpen]);

  const setIsSettingsOpen = useCallback((open: boolean) => {
    if (open) {
      if (checkIsAnyPopupOpen()) return;
      isSettingsOpenRef.current = true;
      setIsSettingsOpenState(true);
    } else {
      isSettingsOpenRef.current = false;
      setIsSettingsOpenState(false);
    }
  }, [checkIsAnyPopupOpen]);

  const setIsHelpOpen = useCallback((open: boolean) => {
    if (open) {
      if (checkIsAnyPopupOpen()) return;
      isHelpOpenRef.current = true;
      setIsHelpOpenState(true);
    } else {
      isHelpOpenRef.current = false;
      setIsHelpOpenState(false);
    }
  }, [checkIsAnyPopupOpen]);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    geminiApiKey: '',
    reducedMotion: false,
  });

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.restoration) setRestoration(parsed.restoration);
        if (parsed.coins) setCoins(parsed.coins);
        if (parsed.quests) setQuests(parsed.quests);
        if (parsed.badges) setBadges(parsed.badges);
        if (parsed.actions) setActions(parsed.actions);
        if (parsed.cropPlots) setCropPlots(parsed.cropPlots);
        if (parsed.biomeTimeSpent) setBiomeTimeSpent(parsed.biomeTimeSpent);
        if (parsed.settings) {
          setSettings(parsed.settings);
          sounds.setEnabled(parsed.settings.soundEnabled ?? true);
        }
      }
    } catch (e) {
      console.warn('Could not read saved game state:', e);
    }
  }, []);

  // Save to local storage
  const saveState = useCallback(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          restoration,
          coins,
          biomeTimeSpent,
          quests,
          badges,
          actions,
          cropPlots,
          settings,
        })
      );
    } catch (e) {
      console.warn('Could not persist game state:', e);
    }
  }, [restoration, coins, biomeTimeSpent, quests, badges, actions, cropPlots, settings]);

  useEffect(() => {
    saveState();
  }, [saveState]);

  // Biome change handler
  const setCurrentBiome = (biome: BiomeId) => {
    setCurrentBiomeState(biome);
    sounds.setBiome(biome);
  };

  // Sync active biome music whenever currentBiome changes
  useEffect(() => {
    sounds.setBiome(currentBiome);
  }, [currentBiome]);

  // Sound toggle
  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.soundEnabled !== undefined) {
        sounds.setEnabled(newSettings.soundEnabled);
      }
      return updated;
    });
  };

  // Active biome time ticker:
  // Tracks seconds spent in each biome so corporate sponsor donations are automatically
  // allocated to the organization associated with that specific biome.
  useEffect(() => {
    const timer = setInterval(() => {
      setBiomeTimeSpent((prev) => ({
        ...prev,
        [currentBiome]: (prev[currentBiome] || 0) + 1,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentBiome]);

  // Passive coin & time ticker:
  // "The more time you spend in a biome or talking to an animal, the more coins you get for the biome/animal"
  useEffect(() => {
    const timer = setInterval(() => {
      // Award passive coins based on current biome
      if (currentBiome !== 'clearing') {
        const targetCoinKey = currentBiome as keyof CoinLedger;
        setCoins((prev) => ({
          ...prev,
          [targetCoinKey]: prev[targetCoinKey] + 1,
        }));
      }

      // If active dialogue is open, extra token awarded for learning!
      if (activeDialogueAnimal) {
        const animal = ANIMALS[activeDialogueAnimal];
        if (animal && animal.biome !== 'clearing') {
          const coinKey = animal.biome as keyof CoinLedger;
          setCoins((prev) => ({
            ...prev,
            [coinKey]: prev[coinKey] + 2,
          }));
        }
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [currentBiome, activeDialogueAnimal]);

  // Global flourish index (average of all biomes 0-100)
  const biomesList: BiomeId[] = ['clearing', 'forest', 'lake', 'tundra', 'grasslands', 'desert', 'reefs'];
  const globalFlourish = Math.round(
    biomesList.reduce((acc, b) => acc + (restoration[b] || 0), 0) / biomesList.length
  );

  // Total coins
  const totalCoins =
    coins.forest +
    coins.lake +
    coins.tundra +
    coins.grasslands +
    coins.desert +
    coins.reefs;

  // Donations are automatically allocated to different organizations based on time spent in that specific biome:
  // - Corporate sponsor matching rate based on time spent in that biome ($0.002/sec = $0.12/minute)
  // - Plus activity bonuses (500 biome coins = $1.00 USD)
  const getBiomeMoneyRaised = useCallback(
    (biome: BiomeId): number => {
      const timeSeconds = biomeTimeSpent[biome] || 0;
      const timeDollars = timeSeconds * 0.002;
      const coinDollars =
        biome === 'clearing'
          ? (totalCoins / 6) / 500
          : ((coins[biome as keyof CoinLedger] || 0) / 500);
      return Number((timeDollars + coinDollars).toFixed(2));
    },
    [biomeTimeSpent, coins, totalCoins]
  );

  const totalMoneyRaised = Number(
    biomesList.reduce((acc, b) => acc + getBiomeMoneyRaised(b), 0).toFixed(2)
  );

  // Backward-compatible alias for total money raised
  const donationPoolDollars = totalMoneyRaised;

  // Add coins
  const addCoins = (biome: BiomeId, amount: number) => {
    sounds.playCoin();
    if (biome === 'clearing') {
      // Distribute evenly among all biomes
      const share = Math.ceil(amount / 6);
      setCoins((prev) => ({
        forest: prev.forest + share,
        lake: prev.lake + share,
        tundra: prev.tundra + share,
        grasslands: prev.grasslands + share,
        desert: prev.desert + share,
        reefs: prev.reefs + share,
      }));
    } else {
      const key = biome as keyof CoinLedger;
      setCoins((prev) => ({
        ...prev,
        [key]: (prev[key] || 0) + amount,
      }));
    }
  };

  // Boost restoration
  const boostRestoration = useCallback((biome: BiomeId, amount: number) => {
    setRestoration((prev) => {
      const current = prev[biome] || 0;
      const next = Math.min(100, current + amount);
      return {
        ...prev,
        [biome]: next,
      };
    });
  }, []);

  // Open & Close Dialogue
  const openDialogue = useCallback((animalId: AnimalId) => {
    if (checkIsAnyPopupOpen()) return;
    sounds.playClick();
    activeDialogueAnimalRef.current = animalId;
    setActiveDialogueAnimal(animalId);
  }, [checkIsAnyPopupOpen]);

  const closeDialogue = useCallback(() => {
    activeDialogueAnimalRef.current = null;
    setActiveDialogueAnimal(null);
  }, []);

  // Quest Modals
  const openQuestModal = useCallback((actionType: Quest['actionType']) => {
    if (checkIsAnyPopupOpen()) return;
    sounds.playClick();
    activeQuestModalRef.current = actionType;
    setActiveQuestModal(actionType);
  }, [checkIsAnyPopupOpen]);

  const closeQuestModal = useCallback(() => {
    activeQuestModalRef.current = null;
    setActiveQuestModal(null);
  }, []);

  // Complete Quest
  const completeQuest = (questId: string, impactSummary: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || quest.completed) return;

    sounds.playFanfare();
    sounds.playBloom();

    // Dynamically trigger confetti
    if (typeof window !== 'undefined') {
      import('canvas-confetti').then((confettiModule) => {
        const confetti = confettiModule.default;
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#38bdf8', '#eab308', '#f97316', '#a855f7'],
        });
      });
    }

    // Mark quest completed
    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, completed: true } : q))
    );

    // Boost restoration to 100% for this biome
    setRestoration((prev) => ({
      ...prev,
      [quest.biome]: 100,
    }));

    // Reward coins
    addCoins(quest.biome, quest.rewardCoins);

    // Unlock corresponding badge
    setBadges((prev) =>
      prev.map((b) => {
        if (b.biome === quest.biome) {
          return { ...b, unlocked: true, unlockedAt: new Date().toLocaleDateString() };
        }
        return b;
      })
    );

    // Add action record
    const newAction: ActionRecord = {
      id: `act_${Date.now()}`,
      title: quest.title,
      type: quest.actionType,
      biome: quest.biome,
      timestamp: new Date().toLocaleString(),
      impactMetrics: impactSummary,
    };
    setActions((prev) => [newAction, ...prev]);

    setNotification(`🎉 Quest Completed! +${quest.rewardCoins} Coins & ${quest.biome.toUpperCase()} Biome Flourished to 100%!`);
    setTimeout(() => setNotification(null), 5000);
  };

  // Check for World Flourish 100% completion badge
  useEffect(() => {
    if (globalFlourish >= 100) {
      setBadges((prev) =>
        prev.map((b) => {
          if (b.id === 'badge_world_flourish' && !b.unlocked) {
            sounds.playFanfare();
            return { ...b, unlocked: true, unlockedAt: new Date().toLocaleDateString() };
          }
          return b;
        })
      );
    }
  }, [globalFlourish]);

  // Dummy Ad Sponsor Boost:
  // "Ads at the bottom to pay for stuff. Dummy ads for demo if not approved"
  const triggerAdBoost = (sponsorName: string) => {
    sounds.playCoin();
    sounds.playBloom();

    const currentOrGeneral = currentBiome === 'clearing' ? 'grasslands' : currentBiome;
    addCoins(currentOrGeneral, 150);
    boostRestoration(currentOrGeneral, 20);

    const targetOrg = CHARITIES.find((c) => c.biome === currentOrGeneral);
    const orgLabel = targetOrg ? targetOrg.name : 'Conservation Partners';
    setNotification(`🌟 Sponsored by ${sponsorName}! +150 Biome Coins & +$0.30 automatically allocated to ${orgLabel}!`);
    setTimeout(() => setNotification(null), 4500);
  };

  // Maturation ticker: monitors crops and matures baby sprouts after 20 minutes (1,200,000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCropPlots((prev) => {
        let changed = false;
        const next = { ...prev };
        (Object.keys(next) as Array<Exclude<BiomeId, 'clearing'>>).forEach((b) => {
          const plot = next[b];
          const isRestored = (restoration[b] || 0) >= 80;
          if (isRestored) {
            if (plot.status === 'growing' && plot.plantedAt) {
              if (now - plot.plantedAt >= plot.growDurationMs) {
                next[b] = { ...plot, status: 'grown', plantedAt: undefined };
                changed = true;
              }
            } else if (plot.status === 'crisis') {
              next[b] = { ...plot, status: 'grown' };
              changed = true;
            }
          } else if (!isRestored && plot.status !== 'growing') {
            if (plot.status !== 'crisis') {
              next[b] = { ...plot, status: 'crisis' };
              changed = true;
            }
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restoration]);

  // Harvest fixed crop: produces grown crop and re-plants baby sprout that takes 20 mins to grow
  const harvestCrop = useCallback((biome: Exclude<BiomeId, 'clearing'>): boolean => {
    const isRestored = (restoration[biome] || 0) >= 80;
    const currentPlot = cropPlots[biome];
    if (!isRestored || currentPlot.status === 'growing') {
      return false;
    }

    sounds.playBloom();
    const crop = FARM_CROPS[biome];
    const now = Date.now();

    setCropPlots((prev) => ({
      ...prev,
      [biome]: {
        ...prev[biome],
        status: 'growing',
        plantedAt: now,
        harvestCount: (prev[biome]?.harvestCount || 0) + 1,
      },
    }));

    setNotification(`🌾 Bountiful Harvest: Collected 1x ${crop.name}! Baby sprouts re-planted (takes 20 mins to grow).`);
    setTimeout(() => setNotification(null), 4000);

    // Trigger Buyer arrival on the farm!
    setRecentBuyerEvent({
      id: Math.random().toString(),
      biome,
      cropName: crop.name,
      produceIcon: crop.produceIcon || '/assets/crops/crop_flourish.png',
      coinsEarned: 50,
      timestamp: now,
    });

    return true;
  }, [restoration, cropPlots]);

  const fixCrop = useCallback((biome: Exclude<BiomeId, 'clearing'>) => {
    sounds.playBloom();
    boostRestoration(biome, 100);
    setCropPlots((prev) => ({
      ...prev,
      [biome]: {
        ...prev[biome],
        status: 'grown',
        plantedAt: undefined,
      },
    }));
    const crop = FARM_CROPS[biome];
    setNotification(`✨ ${crop.name} has been restored! The crop is flourishing and ready for harvest.`);
    setTimeout(() => setNotification(null), 4000);
  }, [boostRestoration]);

  const forceGrowCrop = useCallback((biome: Exclude<BiomeId, 'clearing'>) => {
    sounds.playBloom();
    setCropPlots((prev) => ({
      ...prev,
      [biome]: {
        ...prev[biome],
        status: 'grown',
        plantedAt: undefined,
      },
    }));
    const crop = FARM_CROPS[biome];
    setNotification(`🌱 Baby sprouts for ${crop.name} have matured into full harvest!`);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // Eco-windmill boost: shaves `ms` off the remaining grow time of every restored, growing crop.
  // Returns how many crops were boosted.
  const boostGrowingCrops = useCallback((ms: number): number => {
    const isBoostable = (b: Exclude<BiomeId, 'clearing'>, plot: CropPlotState) =>
      (restoration[b] || 0) >= 80 && plot.status === 'growing' && Boolean(plot.plantedAt);

    const boostedCount = (Object.keys(cropPlots) as Array<Exclude<BiomeId, 'clearing'>>)
      .filter((b) => isBoostable(b, cropPlots[b])).length;
    if (boostedCount === 0) return 0;

    setCropPlots((prev) => {
      const next = { ...prev };
      (Object.keys(next) as Array<Exclude<BiomeId, 'clearing'>>).forEach((b) => {
        const plot = next[b];
        if (isBoostable(b, plot)) {
          next[b] = { ...plot, plantedAt: (plot.plantedAt as number) - ms };
        }
      });
      return next;
    });
    setNotification(`💨 Eco-Windmill boost! ${boostedCount} growing crop${boostedCount === 1 ? '' : 's'} ${boostedCount === 1 ? 'is' : 'are'} now ${Math.round(ms / 1000)}s closer to harvest.`);
    setTimeout(() => setNotification(null), 3000);
    return boostedCount;
  }, [restoration, cropPlots]);

  const clearBuyerEvent = useCallback(() => {
    setRecentBuyerEvent(null);
  }, []);

  const resetGame = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setRestoration(defaultRestoration);
    setCoins(defaultCoins);
    setBiomeTimeSpent(defaultBiomeTimeSpent);
    setQuests(INITIAL_QUESTS);
    setBadges(INITIAL_BADGES);
    setActions([]);
    setCropPlots(defaultCropPlots);
    setRecentBuyerEvent(null);
    setCurrentBiomeState('clearing');
    sounds.playBloom();
    setNotification('Game progress successfully reset to beginning! Welcome back to the Farm.');
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <GameStateContext.Provider
      value={{
        currentBiome,
        setCurrentBiome,
        restoration,
        globalFlourish,
        coins,
        totalCoins,
        biomeTimeSpent,
        getBiomeMoneyRaised,
        totalMoneyRaised,
        donationPoolDollars,
        quests,
        badges,
        actions,
        activeDialogueAnimal,
        openDialogue,
        closeDialogue,
        activeQuestModal,
        openQuestModal,
        closeQuestModal,
        completeQuest,
        addCoins,
        boostRestoration,
        triggerAdBoost,
        settings,
        updateSettings,
        isProfileOpen,
        setIsProfileOpen,
        isQuestsOpen,
        setIsQuestsOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        isHelpOpen,
        setIsHelpOpen,
        activeCropModal,
        openCropModal,
        closeCropModal,
        cropPlots,
        harvestCrop,
        fixCrop,
        forceGrowCrop,
        boostGrowingCrops,
        recentBuyerEvent,
        clearBuyerEvent,
        isPremiseOpen,
        setIsPremiseOpen,
        openPremiseModal,
        closePremiseModal,
        isAnyPopupOpen,
        notification,
        setNotification,
        resetGame,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}
