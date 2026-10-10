'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { BiomeId, AnimalId, CoinLedger, Quest, Badge, ActionRecord, GameSettings } from '@/types/game';
import { ANIMALS, INITIAL_BADGES, INITIAL_QUESTS } from '@/data/animals';
import { sounds } from '@/utils/soundEffects';

interface GameStateContextType {
  currentBiome: BiomeId;
  setCurrentBiome: (biome: BiomeId) => void;
  restoration: Record<BiomeId, number>;
  globalFlourish: number;
  coins: CoinLedger;
  totalCoins: number;
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

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

const STORAGE_KEY = 'field_to_future_state_v1';

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [currentBiome, setCurrentBiomeState] = useState<BiomeId>('clearing');
  const [restoration, setRestoration] = useState<Record<BiomeId, number>>(defaultRestoration);
  const [coins, setCoins] = useState<CoinLedger>(defaultCoins);
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [activeDialogueAnimal, setActiveDialogueAnimal] = useState<AnimalId | null>(null);
  const [activeQuestModal, setActiveQuestModal] = useState<Quest['actionType'] | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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
          quests,
          badges,
          actions,
          settings,
        })
      );
    } catch (e) {
      console.warn('Could not persist game state:', e);
    }
  }, [restoration, coins, quests, badges, actions, settings]);

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

  // Donation pool: 500 coins = $1.00 USD
  const donationPoolDollars = Number((totalCoins / 500).toFixed(2));

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
  const boostRestoration = (biome: BiomeId, amount: number) => {
    setRestoration((prev) => {
      const current = prev[biome] || 0;
      const next = Math.min(100, current + amount);
      return {
        ...prev,
        [biome]: next,
      };
    });
  };

  // Open & Close Dialogue
  const openDialogue = (animalId: AnimalId) => {
    sounds.playClick();
    setActiveDialogueAnimal(animalId);
  };

  const closeDialogue = () => {
    sounds.playClick();
    setActiveDialogueAnimal(null);
  };

  // Quest Modals
  const openQuestModal = (actionType: Quest['actionType']) => {
    sounds.playClick();
    setActiveQuestModal(actionType);
  };

  const closeQuestModal = () => {
    sounds.playClick();
    setActiveQuestModal(null);
  };

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

    setNotification(`🌟 Sponsored by ${sponsorName}! +150 Biome Coins & +$0.30 added to the Global Conservation Fund!`);
    setTimeout(() => setNotification(null), 4500);
  };

  const resetGame = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setRestoration(defaultRestoration);
    setCoins(defaultCoins);
    setQuests(INITIAL_QUESTS);
    setBadges(INITIAL_BADGES);
    setActions([]);
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
