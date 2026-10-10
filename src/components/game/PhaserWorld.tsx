'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { BiomeId, AnimalId } from '@/types/game';
import { ANIMALS } from '@/data/animals';
import { sounds } from '@/utils/soundEffects';
import { ArrowLeft } from 'lucide-react';

interface Hotspot {
  id: string;
  name: string;
  x: number;
  y: number;
  iconSprite?: string;
  type: 'animal' | 'crop' | 'gate' | 'quest';
  animalId?: AnimalId;
  targetBiome?: BiomeId;
  questAction?: any;
}

export default function PhaserWorld() {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<any>(null);
  const {
    currentBiome,
    setCurrentBiome,
    restoration,
    globalFlourish,
    quests,
    openDialogue,
    openQuestModal,
    openCropModal,
    activeDialogueAnimal,
    activeQuestModal,
    activeCropModal,
    cropPlots,
    harvestCrop,
    boostGrowingCrops,
    recentBuyerEvent,
    clearBuyerEvent,
    addCoins,
    isPremiseOpen,
    isProfileOpen,
    isQuestsOpen,
    isSettingsOpen,
    isHelpOpen,
    isAnyPopupOpen,
  } = useGameState();

  const [zoomLevel, setZoomLevel] = useState(1.38);
  const onZoomChangeRef = useRef<((z: number) => void) | null>(null);

  useEffect(() => {
    onZoomChangeRef.current = (z: number) => {
      setZoomLevel(Math.round(z * 100) / 100);
    };
  }, []);

  const handleZoomChange = (delta: number) => {
    sounds.playClick();
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('GardenscapesWorldScene') as any;
      if (scene && typeof scene.applyZoom === 'function') {
        const next = Math.round((scene.currentZoom + delta) * 10) / 10;
        scene.applyZoom(next);
        setZoomLevel(scene.currentZoom);
      }
    }
  };

  const handleResetZoom = () => {
    sounds.playClick();
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('GardenscapesWorldScene') as any;
      if (scene && typeof scene.resetZoom === 'function') {
        scene.resetZoom();
        setZoomLevel(scene.defaultZoom);
      }
    }
  };

  const stateRef = useRef({
    currentBiome,
    restoration,
    globalFlourish,
    quests,
    openDialogue,
    setCurrentBiome,
    openQuestModal,
    openCropModal,
    cropPlots,
    harvestCrop,
    boostGrowingCrops,
    recentBuyerEvent,
    clearBuyerEvent,
    addCoins,
    activeDialogueAnimal,
    activeQuestModal,
    activeCropModal,
    isPremiseOpen,
    isProfileOpen,
    isQuestsOpen,
    isSettingsOpen,
    isHelpOpen,
    isAnyPopupOpen,
    activeHotspotId: null as string | null,
    nearbyHotspot: null as Hotspot | null,
  });

  // Keep stateRef synchronously up-to-date on EVERY render so Phaser never reads stale state
  stateRef.current.currentBiome = currentBiome;
  stateRef.current.restoration = restoration;
  stateRef.current.globalFlourish = globalFlourish;
  stateRef.current.quests = quests;
  stateRef.current.openDialogue = openDialogue;
  stateRef.current.setCurrentBiome = setCurrentBiome;
  stateRef.current.openQuestModal = openQuestModal;
  stateRef.current.openCropModal = openCropModal;
  stateRef.current.cropPlots = cropPlots;
  stateRef.current.harvestCrop = harvestCrop;
  stateRef.current.boostGrowingCrops = boostGrowingCrops;
  stateRef.current.recentBuyerEvent = recentBuyerEvent;
  stateRef.current.clearBuyerEvent = clearBuyerEvent;
  stateRef.current.addCoins = addCoins;
  stateRef.current.activeDialogueAnimal = activeDialogueAnimal;
  stateRef.current.activeQuestModal = activeQuestModal;
  stateRef.current.activeCropModal = activeCropModal;
  stateRef.current.isPremiseOpen = isPremiseOpen;
  stateRef.current.isProfileOpen = isProfileOpen;
  stateRef.current.isQuestsOpen = isQuestsOpen;
  stateRef.current.isSettingsOpen = isSettingsOpen;
  stateRef.current.isHelpOpen = isHelpOpen;
  stateRef.current.isAnyPopupOpen = isAnyPopupOpen;

  // Handle Enter key for interacting with nearby world objects; revert to normal for mini-games/modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;

      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return; // normal browser input behavior
      }

      const s = stateRef.current;
      const isAnyModalOpen = Boolean(
        s.activeDialogueAnimal ||
        s.activeQuestModal ||
        s.activeCropModal ||
        s.isPremiseOpen ||
        s.isProfileOpen ||
        s.isQuestsOpen ||
        s.isSettingsOpen ||
        s.isHelpOpen
      );

      // In mini-games & modals, revert strictly to normal behavior
      if (isAnyModalOpen) {
        return;
      }

      // In the world: interact with nearby hotspot
      const scene = phaserGameRef.current?.scene?.getScene('GardenscapesWorldScene') as any;
      const targetHotspot = scene?.nearbyHotspot || s.nearbyHotspot;
      if (targetHotspot) {
        e.preventDefault();
        sounds.playClick();
        if (targetHotspot.type === 'animal' && targetHotspot.animalId) {
          s.openDialogue(targetHotspot.animalId);
        } else if (targetHotspot.type === 'gate' && targetHotspot.targetBiome) {
          s.setCurrentBiome(targetHotspot.targetBiome);
        } else if (targetHotspot.type === 'crop' && targetHotspot.targetBiome && targetHotspot.targetBiome !== 'clearing') {
          const b = targetHotspot.targetBiome as Exclude<BiomeId, 'clearing'>;
          const isRestored = (s.restoration[b] || 0) >= 80;
          const isBaby = s.cropPlots?.[b]?.status === 'growing';
          if (isRestored && !isBaby) {
            s.harvestCrop(b);
          } else {
            s.openCropModal(b);
          }
        } else if (targetHotspot.type === 'quest' && targetHotspot.questAction) {
          s.openQuestModal(targetHotspot.questAction);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync React room state changes into Phaser scene
  useEffect(() => {
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('GardenscapesWorldScene');
      if (scene && typeof scene.changeRoom === 'function') {
        scene.changeRoom(currentBiome);
      }
    }
  }, [currentBiome]);

  // Sync restoration changes, quest completions, or game resets into active scene
  useEffect(() => {
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('GardenscapesWorldScene');
      if (scene && typeof scene.rebuildCurrentRoom === 'function') {
        scene.rebuildCurrentRoom(restoration);
      }
    }
  }, [restoration, quests, globalFlourish, cropPlots]);

  // Trigger visiting buyer walking up the path when a crop is purchased
  useEffect(() => {
    if (recentBuyerEvent && phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('GardenscapesWorldScene') as any;
      if (scene && typeof scene.spawnCustomerBuyer === 'function') {
        scene.spawnCustomerBuyer(recentBuyerEvent.biome, recentBuyerEvent.cropName, recentBuyerEvent.produceIcon);
        clearBuyerEvent();
      }
    }
  }, [recentBuyerEvent, clearBuyerEvent]);

  useEffect(() => {
    let isMounted = true;

    async function initPhaser() {
      if (typeof window !== 'undefined' && containerRef.current && !phaserGameRef.current) {
        const Phaser = (await import('phaser')).default;

        class GardenscapesWorldScene extends Phaser.Scene {
          private player!: Phaser.GameObjects.Container;
          private playerSprite!: Phaser.GameObjects.Image;
          private playerBody!: Phaser.Physics.Arcade.Body;
          private cursors!: any;
          private moveTarget: { x: number; y: number } | null = null;
          private currentPathWaypoints: { x: number; y: number }[] = [];
          private readonly TILE_SIZE: number = 15;
          public currentRoomId: BiomeId = 'clearing';
          public restorationData: Record<BiomeId, number> | null = null;
          private worldContainer!: Phaser.GameObjects.Container;
          private easterEggsContainer!: Phaser.GameObjects.Container;
          private footprintsContainer!: Phaser.GameObjects.Container;
          private signsContainer!: Phaser.GameObjects.Container;
          private lastFootprintPos: { x: number; y: number } = { x: 700, y: 420 };
          private footstepToggle: boolean = false;
          private readonly FOOTSTEP_DISTANCE: number = 16;
          private pathPolygons: Phaser.Geom.Rectangle[] = [];
          private currentHotspots: Hotspot[] = [];
          private nearbyHotspot: Hotspot | null = null;
          private isTransitioning: boolean = false;
          private transitionCooldownUntil: number = 0;
          private speed: number = 290;
          public canvasW: number = 1400;
          public canvasH: number = 750;
          public defaultZoom: number = 1.38;
          public currentZoom: number = 1.38;
          private nextStepTime: number = 0;
          private stepInterval: number = 250;
          private ignorePathClickUntil: number = 0;
          private mushroomObj: Phaser.GameObjects.Container | null = null;
          private mushroomJumpTween: Phaser.Tweens.Tween | null = null;
          private windmillBoostUntil = 0;
          private tundraIcePatch: Phaser.Geom.Rectangle | null = null;
          private isSlidingOnIce: boolean = false;
          private lastIceSlideSoundTime: number = 0;
          private nextFarmerBreathTime: number = 0;
          private grasslandsGrassPatch: {
            x: number;
            y: number;
            container: Phaser.GameObjects.Container;
            restingButterflies: Phaser.GameObjects.Image[];
            triggered: boolean;
            readyAt: number;
          } | null = null;
          private nemoObj: {
            container: Phaser.GameObjects.Container;
            sprite: Phaser.GameObjects.Image;
            baseX: number;
            baseY: number;
            isSpinning: boolean;
          } | null = null;
          private nextNemoBubbleTime: number = 0;
          private interactiveForestTrees: {
            container: Phaser.GameObjects.Container | Phaser.GameObjects.Image;
            sprite: Phaser.GameObjects.Image;
            season: 'summer' | 'autumn';
          }[] = [];
          private roomTimers: Phaser.Time.TimerEvent[] = [];

          constructor() {
            super({ key: 'GardenscapesWorldScene' });
          }

          public applyZoom(zoom: number) {
            const clamped = Phaser.Math.Clamp(zoom, 1.0, 2.2);
            this.currentZoom = clamped;
            this.cameras.main.setZoom(clamped);
            if (onZoomChangeRef.current) {
              onZoomChangeRef.current(clamped);
            }
          }

          public resetZoom() {
            this.applyZoom(this.defaultZoom);
            if (this.player) {
              this.cameras.main.centerOn(this.player.x, this.player.y);
            }
          }

          preload() {
            // Detailed grass backgrounds
            this.load.image('grass_flourish', '/assets/grass_flourish.png');
            this.load.image('grass_dead', '/assets/grass_dead.png');

            // Pixel-art biome backgrounds (Dying/polluted vs Flourishing/clean) - see scripts/generate_biome_backgrounds.py
            this.load.image('biome_lake_dead', '/assets/biomes/lake_dead.png');
            this.load.image('biome_lake_flourish', '/assets/biomes/lake_flourish.png');
            this.load.image('biome_forest_dead', '/assets/biomes/forest_dead.png');
            this.load.image('biome_forest_flourish', '/assets/biomes/forest_flourish.png');
            this.load.image('biome_tundra_dead', '/assets/biomes/tundra_dead.png');
            this.load.image('biome_tundra_flourish', '/assets/biomes/tundra_flourish.png');
            this.load.image('biome_grasslands_dead', '/assets/biomes/grasslands_dead.png');
            this.load.image('biome_grasslands_flourish', '/assets/biomes/grasslands_flourish.png');
            this.load.image('biome_desert_dead', '/assets/biomes/desert_dead.png');
            this.load.image('biome_desert_flourish', '/assets/biomes/desert_flourish.png');
            this.load.image('biome_reefs_dead', '/assets/biomes/reefs_dead.png');
            this.load.image('biome_reefs_flourish', '/assets/biomes/reefs_flourish.png');

            // Sprites & generated images
            this.load.image('farmer', '/assets/sprites/farmer.png');
            this.load.image('house', '/assets/sprites/house.png');
            this.load.image('barn', '/assets/sprites/barn.png');
            this.load.image('trees', '/assets/sprites/trees.png');
            this.load.image('crop_dead', '/assets/crops/crop_dead.png');
            this.load.image('crop_lake_dead', '/assets/crops/crop_lake_dead.png');
            this.load.image('crop_forest_dead', '/assets/crops/crop_forest_dead.png');
            this.load.image('crop_tundra_dead', '/assets/crops/crop_tundra_dead.png');
            this.load.image('crop_grasslands_dead', '/assets/crops/crop_grasslands_dead.png');
            this.load.image('crop_desert_dead', '/assets/crops/crop_desert_dead.png');
            this.load.image('crop_flourish', '/assets/crops/crop_flourish.png');
            this.load.image('crop_baby', '/assets/crops/crop_baby.png');
            this.load.image('windmill_tower', '/assets/sprites/windmill_tower.png');
            this.load.image('windmill_blades', '/assets/sprites/windmill_blades.png');
            this.load.image('buyer', '/assets/sprites/buyer.png');
            this.load.image('glow_aura', '/assets/sprites/glow_aura.png');
            this.load.image('produce_corn', '/assets/crops/produce_corn.png');
            this.load.image('produce_apple', '/assets/crops/produce_apple.png');
            this.load.image('produce_wheat', '/assets/crops/produce_wheat.png');
            this.load.image('produce_sunflower', '/assets/crops/produce_sunflower.png');
            this.load.image('produce_melon', '/assets/crops/produce_melon.png');
            this.load.image('produce_rice', '/assets/crops/produce_rice.png');

            // Animals
            this.load.image('manatee', '/assets/sprites/manatee.png');
            this.load.image('red_panda', '/assets/sprites/red_panda.png');
            this.load.image('polar_bear', '/assets/sprites/polar_bear.png');
            this.load.image('butterfly', '/assets/sprites/butterfly.png');
            this.load.image('cheetah', '/assets/sprites/cheetah.png');
            this.load.image('sea_turtle', '/assets/sprites/sea_turtle.png');
            // Sad versions shown until the animal's biome is restored
            (['manatee', 'red_panda', 'polar_bear', 'butterfly', 'cheetah', 'sea_turtle'] as const).forEach((id) => {
              this.load.image(`${id}_sad`, `/assets/sprites/${id}_sad.png`);
            });

            // Biome Paths
            this.load.image('path_farm', '/assets/paths/path_farm.png');
            this.load.image('path_lake', '/assets/paths/path_lake.png');
            this.load.image('path_forest', '/assets/paths/path_forest.png');
            this.load.image('path_tundra', '/assets/paths/path_tundra.png');
            this.load.image('path_grasslands', '/assets/paths/path_grasslands.png');
            this.load.image('path_desert', '/assets/paths/path_desert.png');
            this.load.image('path_reefs', '/assets/paths/path_reefs.png');

            // Miniature Biome Easter Egg Sprites
            this.load.image('mushroom', '/assets/sprites/mushroom.png');
            this.load.image('nemo', '/assets/sprites/nemo.png');
            this.load.image('cactus', '/assets/sprites/cactus.png');
            this.load.image('cactus_trunk', '/assets/sprites/cactus_trunk.png');
            this.load.image('cactus_arm', '/assets/sprites/cactus_arm.png');
            this.load.image('tall_grass', '/assets/sprites/tall_grass.png');
            this.load.image('ice_patch', '/assets/sprites/ice_patch.png');
          }

          create() {
            this.canvasW = this.scale.width || 1400;
            this.canvasH = 750;

            this.physics.world.setBounds(0, 0, this.canvasW, this.canvasH);
            this.cameras.main.setBounds(0, 0, this.canvasW, this.canvasH);
            this.cameras.main.setRoundPixels(true);

            // Set little green sprout custom cursor
            this.input.setDefaultCursor("url('/assets/sprout_cursor.svg') 2 4, auto");

            this.worldContainer = this.add.container(0, 0);
            this.worldContainer.setDepth(1);

            this.easterEggsContainer = this.add.container(0, 0);
            this.easterEggsContainer.setDepth(25);

            this.footprintsContainer = this.add.container(0, 0);
            this.footprintsContainer.setDepth(15);

            this.signsContainer = this.add.container(0, 0);
            this.signsContainer.setDepth(35);

            // Setup Arrow Keys ONLY for keyboard navigation (strictly NO spacebar/letter capture)
            if (this.input.keyboard) {
              this.input.keyboard.clearCaptures();
              this.cursors = {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP, false),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN, false),
                left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT, false),
                right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT, false),
              };
            }

            // Click-to-move along paths (supports multi-turn navigation & path-snapping)
            this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
              sounds.initCtx();
              if (this.isTransitioning) return;
              if (this.time.now < this.ignorePathClickUntil) return;

              // Use camera-transformed world coordinates for accurate click-to-move while zoomed/panned
              const clickX = pointer.worldX;
              const clickY = pointer.worldY;

              const target = this.getClosestPointOnWalkablePath(clickX, clickY);
              const clickDistFromPath = Phaser.Math.Distance.Between(clickX, clickY, target.x, target.y);

              // Allow clicks directly on path or within 90px (e.g. clicking animals, signs, or path edges)
              if (clickDistFromPath <= 90) {
                this.walkPlayerTo(pointer.x, pointer.y);
              }
            });

            // Smooth mouse wheel / pinch zooming with bounds clamping
            this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any, _deltaX: number, deltaY: number) => {
              const targetZoom = Phaser.Math.Clamp(this.cameras.main.zoom - deltaY * 0.0012, 1.0, 2.2);
              this.applyZoom(targetZoom);
            });

            // Create Farmer Avatar Sprite at central farm plaza
            this.createFarmerPlayer(this.canvasW / 2, 420);

            // Initial Room Build & Biome Background Music
            this.currentRoomId = stateRef.current.currentBiome;
            this.buildRoom(this.currentRoomId);
            sounds.setBiome(this.currentRoomId);

            // START ZOOMED IN ON MAP & FOLLOW USER AS THEY MOVE IN TIME
            this.applyZoom(this.defaultZoom);
            this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
            this.cameras.main.centerOn(this.player.x, this.player.y);
          }

          private createFarmerPlayer(x: number, y: number) {
            this.player = this.add.container(x, y);
            this.player.setDepth(50);

            // Soft ground shadow anchored precisely directly under the soles of the boots
            const shadow = this.add.ellipse(0, 0, 30, 9, 0x000000, 0.45);

            // Farmer image sprite with origin at the bottom feet (0.5, 1.0)
            this.playerSprite = this.add.image(0, 0, 'farmer');
            this.playerSprite.setDisplaySize(42, 56);
            this.playerSprite.setOrigin(0.5, 1.0);

            this.player.add([shadow, this.playerSprite]);
            this.physics.add.existing(this.player);

            this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
            this.playerBody.setCircle(14, -14, -20);
            this.playerBody.setCollideWorldBounds(true);
            this.lastFootprintPos = { x, y };
          }

          private walkPlayerTo(targetX: number, targetY: number) {
            const target = this.getClosestPointOnWalkablePath(targetX, targetY);
            const playerStart = this.isPointOnWalkablePath(this.player.x, this.player.y, 0)
              ? { x: this.player.x, y: this.player.y }
              : this.getClosestPointOnWalkablePath(this.player.x, this.player.y);

            const waypoints = this.findPath(playerStart.x, playerStart.y, target.x, target.y);

            if (
              waypoints.length > 0 &&
              Phaser.Math.Distance.Between(this.player.x, this.player.y, waypoints[0].x, waypoints[0].y) < 14
            ) {
              waypoints.shift();
            }

            if (waypoints.length > 0) {
              this.currentPathWaypoints = waypoints;
              this.moveTarget = waypoints[waypoints.length - 1];

              const ripple = this.add.circle(target.x, target.y, 8, 0xfbbf24, 0.9);
              this.tweens.add({
                targets: ripple,
                scale: 2.2,
                alpha: 0,
                duration: 300,
                onComplete: () => ripple.destroy(),
              });
            }
          }

          public rebuildCurrentRoom(newRestoration?: Record<BiomeId, number> | null) {
            if (newRestoration) {
              this.restorationData = newRestoration;
            }
            this.buildRoom(this.currentRoomId);
          }

          /**
           * Opposite-side room transition handler:
           * Spawns comfortably far away from the edge (180-260px buffer)
           * so it never accidentally triggers an immediate room switch.
           */
          public changeRoom(biome: BiomeId, customSpawn?: { x: number; y: number }) {
            if ((biome === this.currentRoomId && !customSpawn) || this.isTransitioning) return;
            this.isTransitioning = true;
            sounds.playBloom();
            sounds.setBiome(biome);
            this.nextStepTime = this.time ? this.time.now + 600 : 0;

            const previousRoom = this.currentRoomId;

            let executed = false;
            const finishTransition = () => {
              if (executed) return;
              executed = true;

              this.currentRoomId = biome;
              this.buildRoom(biome);

              // Reset zoom so each map starts zoomed in
              this.applyZoom(this.defaultZoom);

              // Determine entry coordinates close to the entrance (safely offset from edge to not trigger back-transition)
              const w = this.canvasW;
              if (customSpawn) {
                this.teleportPlayer(customSpawn.x, customSpawn.y);
              } else if (biome === 'clearing') {
                // Entering Central Farm from a biome:
                if (previousRoom === 'lake') {
                  // Lake is on Left -> entered farm on Left edge, spawn close to entrance at x = 70
                  this.teleportPlayer(70, 420);
                  if (this.playerSprite) this.playerSprite.setFlipX(true);
                } else if (previousRoom === 'grasslands') {
                  // Grasslands is on Right -> entered farm on Right edge, spawn close to entrance at x = w - 70
                  this.teleportPlayer(w - 70, 420);
                  if (this.playerSprite) this.playerSprite.setFlipX(false);
                } else if (previousRoom === 'forest') {
                  // Forest is North-West -> entered farm at North-West lane, spawn close to entrance at y = 70
                  this.teleportPlayer(190, 70);
                } else if (previousRoom === 'tundra') {
                  // Tundra is North-Center -> entered farm at North Avenue, spawn close to entrance at y = 70
                  this.teleportPlayer(w / 2, 70);
                } else if (previousRoom === 'reefs') {
                  // Reefs is South-Center -> entered farm at South Avenue, spawn close to entrance at y = 680
                  this.teleportPlayer(w / 2, 680);
                } else if (previousRoom === 'desert') {
                  // Desert is South-East -> entered farm at South-East lane, spawn close to entrance at y = 680
                  this.teleportPlayer(w - 170, 680);
                } else {
                  this.teleportPlayer(w / 2, 420);
                }
              } else {
                // Entering a specific Biome from Central Farm:
                if (biome === 'lake') {
                  // Exited Farm on Left -> enter Lake on RIGHT edge close to entrance at x = w - 70
                  this.teleportPlayer(w - 70, 375);
                  if (this.playerSprite) this.playerSprite.setFlipX(false);
                } else if (biome === 'grasslands') {
                  // Exited Farm on Right -> enter Grasslands on LEFT edge close to entrance at x = 70
                  this.teleportPlayer(70, 375);
                  if (this.playerSprite) this.playerSprite.setFlipX(true);
                } else if (biome === 'forest' || biome === 'tundra') {
                  // Exited Farm on Top -> enter at BOTTOM edge close to entrance at y = 680
                  this.teleportPlayer(w / 2, 680);
                } else if (biome === 'reefs' || biome === 'desert') {
                  // Exited Farm on Bottom -> enter at TOP edge close to entrance at y = 70
                  this.teleportPlayer(w / 2, 70);
                } else {
                  this.teleportPlayer(w / 2, 375);
                }
              }

              if (biome === 'tundra') {
                this.nextFarmerBreathTime = this.time.now + 350;
              }

              // Center camera immediately over player at new spawn and follow
              this.cameras.main.centerOn(this.player.x, this.player.y);
              this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

              this.cameras.main.fadeIn(150, 0, 0, 0);
              this.time.delayedCall(200, () => {
                this.isTransitioning = false;
                // Add 1.2s cooldown so rapid edge/gate triggers cannot happen immediately after spawning
                this.transitionCooldownUntil = this.time.now + 1200;
              });
            };

            this.cameras.main.fadeOut(150, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, finishTransition);
            this.time.delayedCall(220, finishTransition);
          }

          private teleportPlayer(x: number, y: number) {
            this.player.setPosition(x, y);
            if (this.playerBody) {
              this.playerBody.reset(x, y);
              this.playerBody.setVelocity(0, 0);
            }
            this.moveTarget = null;
            this.currentPathWaypoints = [];
            this.cameras.main.centerOn(x, y);
            this.nextStepTime = (this.time ? this.time.now : 0) + 400;
          }

          private isPointOnWalkablePath(x: number, y: number, margin: number = 0): boolean {
            for (const poly of this.pathPolygons) {
              const minX = poly.x - margin;
              const maxX = poly.x + poly.width + margin;
              const minY = poly.y - margin;
              const maxY = poly.y + poly.height + margin;
              if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                return true;
              }
            }
            return false;
          }

          private getClosestPointOnWalkablePath(x: number, y: number): { x: number; y: number } {
            if (this.pathPolygons.length === 0) {
              return { x, y };
            }

            let bestX = x;
            let bestY = y;
            let minDistanceSq = Number.POSITIVE_INFINITY;

            for (const poly of this.pathPolygons) {
              // Clamp with a small internal margin so the point is safely inside the corridor
              const minX = poly.x + 4;
              const maxX = poly.x + poly.width - 4;
              const minY = poly.y + 4;
              const maxY = poly.y + poly.height - 4;

              const clampedX = minX <= maxX ? Phaser.Math.Clamp(x, minX, maxX) : poly.x + poly.width / 2;
              const clampedY = minY <= maxY ? Phaser.Math.Clamp(y, minY, maxY) : poly.y + poly.height / 2;

              const dSq = (x - clampedX) * (x - clampedX) + (y - clampedY) * (y - clampedY);
              if (dSq < minDistanceSq) {
                minDistanceSq = dSq;
                bestX = clampedX;
                bestY = clampedY;
              }
            }

            return { x: bestX, y: bestY };
          }

          private hasDirectLineOfSight(
            x1: number,
            y1: number,
            x2: number,
            y2: number,
            margin: number = 0
          ): boolean {
            const dist = Phaser.Math.Distance.Between(x1, y1, x2, y2);
            if (dist < 6) return true;

            const stepSize = 10;
            const steps = Math.ceil(dist / stepSize);
            const dx = (x2 - x1) / steps;
            const dy = (y2 - y1) / steps;

            for (let i = 1; i < steps; i++) {
              const sx = x1 + dx * i;
              const sy = y1 + dy * i;
              if (!this.isPointOnWalkablePath(sx, sy, margin)) {
                return false;
              }
            }

            return this.isPointOnWalkablePath(x2, y2, margin);
          }

          private findPath(
            startX: number,
            startY: number,
            targetX: number,
            targetY: number
          ): { x: number; y: number }[] {
            // 1. Direct Line-of-Sight check (fastest path: ~0ms)
            if (this.hasDirectLineOfSight(startX, startY, targetX, targetY, 0)) {
              return [{ x: targetX, y: targetY }];
            }

            // 2. Orthogonal A* Grid Pathfinding
            const TILE = this.TILE_SIZE; // 15px
            const COLS = Math.ceil(this.canvasW / TILE);
            const ROWS = Math.ceil(this.canvasH / TILE);
            const TOTAL_CELLS = COLS * ROWS;

            const toCell = (x: number, y: number) => ({
              c: Phaser.Math.Clamp(Math.floor(x / TILE), 0, COLS - 1),
              r: Phaser.Math.Clamp(Math.floor(y / TILE), 0, ROWS - 1),
            });

            const startCell = toCell(startX, startY);
            const targetCell = toCell(targetX, targetY);

            if (startCell.c === targetCell.c && startCell.r === targetCell.r) {
              return [{ x: targetX, y: targetY }];
            }

            const isCellWalkable = (c: number, r: number): boolean => {
              const cx = c * TILE + TILE / 2;
              const cy = r * TILE + TILE / 2;
              return this.isPointOnWalkablePath(cx, cy, 2);
            };

            const getNearestWalkableCell = (orig: { c: number; r: number }) => {
              if (isCellWalkable(orig.c, orig.r)) return orig;
              for (let radius = 1; radius <= 4; radius++) {
                for (let dc = -radius; dc <= radius; dc++) {
                  for (let dr = -radius; dr <= radius; dr++) {
                    const nc = orig.c + dc;
                    const nr = orig.r + dr;
                    if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS && isCellWalkable(nc, nr)) {
                      return { c: nc, r: nr };
                    }
                  }
                }
              }
              return orig;
            };

            const actualStart = getNearestWalkableCell(startCell);
            const actualTarget = getNearestWalkableCell(targetCell);

            const startId = actualStart.r * COLS + actualStart.c;
            const targetId = actualTarget.r * COLS + actualTarget.c;

            const gScore = new Float32Array(TOTAL_CELLS).fill(1e9);
            const cameFrom = new Int32Array(TOTAL_CELLS).fill(-1);
            const inClosed = new Uint8Array(TOTAL_CELLS);

            const heapIds: number[] = [startId];
            const heapScores: number[] = [0];

            const pushHeap = (id: number, f: number) => {
              heapIds.push(id);
              heapScores.push(f);
              let idx = heapIds.length - 1;
              while (idx > 0) {
                const parent = (idx - 1) >> 1;
                if (heapScores[idx] < heapScores[parent]) {
                  const tid = heapIds[idx]; heapIds[idx] = heapIds[parent]; heapIds[parent] = tid;
                  const ts = heapScores[idx]; heapScores[idx] = heapScores[parent]; heapScores[parent] = ts;
                  idx = parent;
                } else {
                  break;
                }
              }
            };

            const popHeap = (): number => {
              const topId = heapIds[0];
              const lastId = heapIds.pop()!;
              const lastScore = heapScores.pop()!;
              if (heapIds.length > 0) {
                heapIds[0] = lastId;
                heapScores[0] = lastScore;
                let idx = 0;
                const len = heapIds.length;
                while (true) {
                  const left = (idx << 1) + 1;
                  const right = left + 1;
                  let smallest = idx;
                  if (left < len && heapScores[left] < heapScores[smallest]) smallest = left;
                  if (right < len && heapScores[right] < heapScores[smallest]) smallest = right;
                  if (smallest !== idx) {
                    const tid = heapIds[idx]; heapIds[idx] = heapIds[smallest]; heapIds[smallest] = tid;
                    const ts = heapScores[idx]; heapScores[idx] = heapScores[smallest]; heapScores[smallest] = ts;
                    idx = smallest;
                  } else {
                    break;
                  }
                }
              }
              return topId;
            };

            gScore[startId] = 0;
            const heuristic = (c: number, r: number) =>
              Math.abs(c - actualTarget.c) + Math.abs(r - actualTarget.r);

            let found = false;
            let iterations = 0;
            const maxIterations = 2500;

            while (heapIds.length > 0 && iterations++ < maxIterations) {
              const currentId = popHeap();
              if (currentId === targetId) {
                found = true;
                break;
              }

              if (inClosed[currentId]) continue;
              inClosed[currentId] = 1;

              const currC = currentId % COLS;
              const currR = Math.floor(currentId / COLS);
              const currG = gScore[currentId];

              const neighbors = [
                { c: currC + 1, r: currR },
                { c: currC - 1, r: currR },
                { c: currC, r: currR + 1 },
                { c: currC, r: currR - 1 },
              ];

              for (const nb of neighbors) {
                if (nb.c < 0 || nb.c >= COLS || nb.r < 0 || nb.r >= ROWS) continue;
                const nbId = nb.r * COLS + nb.c;
                if (inClosed[nbId]) continue;
                if (!isCellWalkable(nb.c, nb.r)) continue;

                const tentativeG = currG + 1;
                if (tentativeG < gScore[nbId]) {
                  cameFrom[nbId] = currentId;
                  gScore[nbId] = tentativeG;
                  const fScore = tentativeG + heuristic(nb.c, nb.r);
                  pushHeap(nbId, fScore);
                }
              }
            }

            if (!found) {
              return [{ x: targetX, y: targetY }];
            }

            // Reconstruct path
            const rawPoints: { x: number; y: number }[] = [];
            let curr = targetId;
            while (curr !== -1) {
              const c = curr % COLS;
              const r = Math.floor(curr / COLS);
              rawPoints.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 });
              if (curr === startId) break;
              curr = cameFrom[curr];
            }
            rawPoints.reverse();

            if (rawPoints.length <= 1) {
              return [{ x: targetX, y: targetY }];
            }

            rawPoints[0] = { x: startX, y: startY };
            rawPoints[rawPoints.length - 1] = { x: targetX, y: targetY };

            // 3. String-Pulling / Line-of-Sight smoothing
            const smoothed: { x: number; y: number }[] = [];
            let currentIndex = 0;

            while (currentIndex < rawPoints.length - 1) {
              let furthestVisible = currentIndex + 1;
              for (let k = rawPoints.length - 1; k > currentIndex; k--) {
                if (
                  this.hasDirectLineOfSight(
                    rawPoints[currentIndex].x,
                    rawPoints[currentIndex].y,
                    rawPoints[k].x,
                    rawPoints[k].y,
                    0
                  )
                ) {
                  furthestVisible = k;
                  break;
                }
              }
              smoothed.push(rawPoints[furthestVisible]);
              currentIndex = furthestVisible;
            }

            if (smoothed.length > 0) {
              smoothed[smoothed.length - 1] = { x: targetX, y: targetY };
            } else {
              smoothed.push({ x: targetX, y: targetY });
            }

            return smoothed;
          }

          private buildRoom(biome: BiomeId) {
            this.worldContainer.removeAll(true);
            this.easterEggsContainer.removeAll(true);
            this.footprintsContainer.removeAll(true);
            this.signsContainer.removeAll(true);
            this.roomTimers.forEach((t) => t.destroy());
            this.roomTimers = [];
            this.pathPolygons = [];
            this.currentHotspots = [];
            this.nearbyHotspot = null;
            stateRef.current.activeHotspotId = null;
            if (this.player) {
              this.lastFootprintPos = { x: this.player.x, y: this.player.y };
            }

            // Reset miniature easter egg state
            this.mushroomObj = null;
            if (this.mushroomJumpTween) {
              this.mushroomJumpTween.stop();
              this.mushroomJumpTween = null;
            }
            this.tundraIcePatch = null;
            this.isSlidingOnIce = false;
            this.grasslandsGrassPatch = null;
            this.nemoObj = null;
            this.interactiveForestTrees = [];
            if (this.playerSprite) {
              this.playerSprite.y = 0;
              this.playerSprite.angle = 0;
            }

            const currentRestorationVal = (this.restorationData?.[biome] ?? stateRef.current.restoration?.[biome] ?? 0);
            const isQuestCompleted = Boolean(stateRef.current.quests?.some((q: any) => q.biome === biome && q.completed));
            const isRestored = currentRestorationVal > 0 || isQuestCompleted;

            if (biome === 'clearing') {
              this.buildMaximalistFarmRoom(isRestored);
            } else {
              this.buildMaximalistBiomeRoom(biome, isRestored);
            }
          }

          // ===============================================================
          // ✨ INTERACTIVE OBJECT HOVER GLOW HELPER
          // Makes clickable objects glow radiant golden amber on hover
          // ===============================================================
          private makeClickableAndGlow(
            target: any,
            onClick?: (pointer: Phaser.Input.Pointer) => void,
            options?: {
              glowRadius?: number;
              glowColor?: number;
              parentContainer?: Phaser.GameObjects.Container;
              glowOffset?: { x: number; y: number };
            }
          ) {
            target.setInteractive({ useHandCursor: true });

            let activeGlow: Phaser.GameObjects.Image | null = null;
            let activeTween: Phaser.Tweens.Tween | null = null;

            target.on('pointerover', () => {
              if (stateRef.current.isAnyPopupOpen) return;
              // 1. Highlight tint on sprite
              if (typeof target.setTint === 'function') {
                target.setTint(0xfff8b0);
              }

              // 2. Additive luminous glow halo aura
              if (!activeGlow && this.textures.exists('glow_aura')) {
                const ox = options?.glowOffset?.x ?? 0;
                const oy = options?.glowOffset?.y ?? 0;
                const gx = target.x !== undefined ? target.x + ox : ox;
                const gy = target.y !== undefined ? target.y + oy : oy;
                const container = options?.parentContainer || target.parentContainer;

                if (container && typeof container.add === 'function') {
                  activeGlow = this.add.image(gx, gy, 'glow_aura');
                  const radius = options?.glowRadius || Math.max(target.displayWidth || 60, target.displayHeight || 60) * 1.35;
                  activeGlow.setDisplaySize(radius, radius);
                  activeGlow.setBlendMode(Phaser.BlendModes.ADD);
                  activeGlow.setTint(options?.glowColor || 0xffea00);
                  activeGlow.setAlpha(0.7);
                  container.add(activeGlow);
                  container.sendToBack(activeGlow);
                  activeTween = this.tweens.add({
                    targets: activeGlow,
                    alpha: { from: 0.5, to: 0.95 },
                    duration: 650,
                    yoyo: true,
                    repeat: -1,
                  });
                }
              }

              // 3. WebGL postFX glow if supported
              try {
                if (target.postFX?.addGlow) {
                  target._hoverGlowFX = target.postFX.addGlow(0xfde047, 4, 0, false, 0.1, 8);
                }
              } catch {}
            });

            target.on('pointerout', () => {
              if (typeof target.clearTint === 'function') {
                target.clearTint();
              }
              if (activeTween) {
                activeTween.stop();
                activeTween = null;
              }
              if (activeGlow) {
                activeGlow.destroy();
                activeGlow = null;
              }
              try {
                if (target._hoverGlowFX && target.postFX?.remove) {
                  target.postFX.remove(target._hoverGlowFX);
                  target._hoverGlowFX = null;
                }
              } catch {}
            });

            if (onClick) {
              target.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                pointer.event?.stopPropagation?.();
                this.ignorePathClickUntil = this.time.now + 250;
                if (stateRef.current.isAnyPopupOpen) return;
                onClick(pointer);
              });
            }
          }

          // ===============================================================
          // 🪵 VINTAGE WOODEN POSTED SIGN HELPER (COMPACT RUSTIC SIGNS)
          // Crisp, high-resolution (3x) text with balanced, slim wooden posts
          // ===============================================================
          private createVintageWoodenSign(
            x: number,
            y: number,
            title: string,
            subtitle?: string,
            width: number = 135,
            baseHeight: number = 28,
            statusColor: string = '#fde68a',
            onClick?: () => void,
            postPos: 'bottom' | 'top' | 'none' = 'bottom'
          ): Phaser.GameObjects.Container {
            const container = this.add.container(x, y);

            // Legible pixel art font: Silkscreen at 3x resolution for tack-sharp camera zoom
            const pixelFont = "'Silkscreen', monospace";

            // Title Text: Pure white, clean 1.0px outline, resolution: 3 to stay crisp and readable
            const titleFontSize = subtitle ? '11px' : '11.5px';
            const titleText = this.add.text(0, 0, title, {
              fontSize: titleFontSize,
              fontStyle: 'bold',
              fontFamily: pixelFont,
              color: '#ffffff',
              stroke: '#140702',
              strokeThickness: 1.0,
              shadow: { offsetX: 0.5, offsetY: 0.8, color: '#140702', blur: 0, fill: true },
              wordWrap: { width: width - 12, useAdvancedWrap: true },
              align: 'center',
              resolution: 3,
            }).setOrigin(0.5);

            let subText: Phaser.GameObjects.Text | null = null;
            if (subtitle) {
              subText = this.add.text(0, 0, subtitle, {
                fontSize: '9.5px',
                fontStyle: 'normal',
                fontFamily: pixelFont,
                color: statusColor || '#fde68a',
                stroke: '#140702',
                strokeThickness: 1.0,
                shadow: { offsetX: 0.5, offsetY: 0.8, color: '#140702', blur: 0, fill: true },
                wordWrap: { width: width - 12, useAdvancedWrap: true },
                align: 'center',
                resolution: 3,
              }).setOrigin(0.5);
            }

            // Compact padding so sign fits Users snugly around text without bulky billboard edges
            const titleHeight = Math.ceil(titleText.height);
            const subHeight = subText ? Math.ceil(subText.height) : 0;
            const textSpacing = 2;
            const verticalPadding = 8;
            const totalContentHeight = titleHeight + (subHeight > 0 ? subHeight + textSpacing : 0);
            const actualHeight = Math.max(baseHeight, Math.round(totalContentHeight + verticalPadding));

            // Integer-rounded positioning to prevent subpixel rasterization blurring
            if (subText) {
              titleText.y = Math.round(-actualHeight / 2 + verticalPadding / 2 + titleHeight / 2);
              subText.y = Math.round(titleText.y + titleHeight / 2 + textSpacing + subHeight / 2);
            } else {
              titleText.y = 0;
            }

            // 1. Slim Sturdy Wooden Post (compact 8px width)
            if (postPos === 'bottom') {
              const post = this.add.rectangle(0, Math.round(actualHeight / 2 + 7), 8, 14, 0x451a03);
              const postHighlight = this.add.rectangle(-1.5, Math.round(actualHeight / 2 + 7), 2, 12, 0x78350f);
              container.add([post, postHighlight]);
            } else if (postPos === 'top') {
              const post = this.add.rectangle(0, Math.round(-actualHeight / 2 - 7), 8, 14, 0x451a03);
              const postHighlight = this.add.rectangle(-1.5, Math.round(-actualHeight / 2 - 7), 2, 12, 0x78350f);
              container.add([post, postHighlight]);
            }

            // 2. Vintage Wooden Plank Board (Pixel-aligned, high contrast)
            const shadow = this.add.rectangle(1.5, 1.5, width, actualHeight, 0x000000, 0.4);
            const boardRim = this.add.rectangle(0, 0, width, actualHeight, 0x3e1a06);
            const boardFace = this.add.rectangle(0, 0, width - 3, actualHeight - 3, 0x78350f);
            const grain1 = this.add.rectangle(0, Math.round(-actualHeight / 4), width - 8, 1, 0x92400e, 0.4);
            const grain2 = this.add.rectangle(0, Math.round(actualHeight / 4), width - 8, 1, 0x5c2c16, 0.4);

            // Small corner nail rivets
            const nail1 = this.add.circle(-Math.round(width / 2) + 5, -Math.round(actualHeight / 2) + 5, 1.5, 0xd97706);
            const nail2 = this.add.circle(Math.round(width / 2) - 5, -Math.round(actualHeight / 2) + 5, 1.5, 0xd97706);
            const nail3 = this.add.circle(-Math.round(width / 2) + 5, Math.round(actualHeight / 2) - 5, 1.5, 0xd97706);
            const nail4 = this.add.circle(Math.round(width / 2) - 5, Math.round(actualHeight / 2) - 5, 1.5, 0xd97706);

            container.add([shadow, boardRim, boardFace, grain1, grain2, nail1, nail2, nail3, nail4]);
            container.add(titleText);
            if (subText) {
              container.add(subText);
            }

            if (onClick) {
              this.makeClickableAndGlow(boardFace, onClick, { parentContainer: container, glowRadius: width * 1.15 });
              titleText.setInteractive({ useHandCursor: true });
              titleText.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                pointer.event?.stopPropagation?.();
                this.ignorePathClickUntil = this.time.now + 250;
                onClick();
              });
              if (subText) {
                subText.setInteractive({ useHandCursor: true });
                subText.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                  pointer.event?.stopPropagation?.();
                  this.ignorePathClickUntil = this.time.now + 250;
                  onClick();
                });
              }
            }

            this.signsContainer.add(container);
            return container;
          }

          // ===============================================================
          // 🏡 FULL-WIDTH HORIZONTAL BAYER FARM (1400x750 SCREEN-WIDE)
          // ===============================================================
          private buildMaximalistFarmRoom(isFarmRestoredParam?: boolean) {
            const w = this.canvasW;
            const h = this.canvasH;
            const currentRestorationVal = (this.restorationData?.['clearing'] ?? stateRef.current.restoration?.['clearing'] ?? 0);
            const isQuestCompleted = Boolean(stateRef.current.quests?.some((q: any) => q.biome === 'clearing' && q.completed));
            const isFarmRestored = isFarmRestoredParam ?? (currentRestorationVal > 0 || isQuestCompleted);

            // 1. Detailed Grass Background spanning full width
            const grassKey = isFarmRestored ? 'grass_flourish' : 'grass_dead';
            const lawn = this.add.image(w / 2, h / 2, grassKey);
            lawn.setDisplaySize(w, h);
            this.worldContainer.add(lawn);

            // 2. Walkable Dirt Path Network (Leading Completely OFFSCREEN)
            this.pathPolygons = [
              // Central Main Plaza
              new Phaser.Geom.Rectangle(w / 2 - 70, 350, 140, 140),
              // Main Horizontal Dirt Highway leading completely offscreen West & East
              new Phaser.Geom.Rectangle(-60, 390, w + 120, 60),
              // Main Vertical Dirt Avenue leading completely offscreen North & South
              new Phaser.Geom.Rectangle(w / 2 - 30, -60, 60, 870),
              // West Access Lane leading up to Forest exit
              new Phaser.Geom.Rectangle(160, -60, 60, 500),
              // East Access Lane leading down to Desert exit
              new Phaser.Geom.Rectangle(w - 200, 390, 60, 420),
              // Path leading down to Water Conservation Pledge sign where the pool was
              new Phaser.Geom.Rectangle(w / 2 - 390, 450, 60, 160),
            ];

            // Render Packed Dirt Paths
            this.renderBiomePaths('path_farm');

            // 3. Buildings & Orchard Grove
            // Farmhouse Cottage (clickable with hover glow)
            const house = this.add.image(w / 2 - 360, 120, 'house');
            house.setDisplaySize(140, 140);
            this.makeClickableAndGlow(house, () => {
              sounds.playClick();
              this.spawnFloatingBubble(w / 2 - 360, 45, '🏡 Farmhouse: Cozy cottage overlooking the regenerative crops!');
            });
            this.worldContainer.add(house);

            // Clumped Orchard Grove
            const orchardSoil = this.add.ellipse(w / 2 - 190, 130, 150, 95, 0x543315, 0.4);
            const trees1 = this.add.image(w / 2 - 230, 115, 'trees').setDisplaySize(95, 95).setOrigin(0.5, 0.85);
            const trees2 = this.add.image(w / 2 - 150, 110, 'trees').setDisplaySize(95, 95).setOrigin(0.5, 0.85);
            const trees3 = this.add.image(w / 2 - 190, 145, 'trees').setDisplaySize(100, 100).setOrigin(0.5, 0.85);
            this.worldContainer.add([orchardSoil, trees1, trees2, trees3]);

            // Dynamic tree wind swaying tweens
            [trees1, trees2, trees3].forEach((t, i) => {
              this.tweens.add({
                targets: t,
                angle: { from: -2.2, to: 2.2 },
                duration: 2400 + i * 400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: i * 300,
              });
            });

            // Ambient gentle leaves drifting from the orchard
            const orchardLeafTimer = this.time.addEvent({
              delay: 1100,
              loop: true,
              callback: () => {
                const lx = Phaser.Math.Between(w / 2 - 260, w / 2 - 130);
                const ly = Phaser.Math.Between(90, 150);
                const leaf = this.add.ellipse(lx, ly, 5, 2.5, isFarmRestored ? 0x22c55e : 0x78716c, 0.8);
                this.worldContainer.add(leaf);
                this.tweens.add({
                  targets: leaf,
                  x: lx + Phaser.Math.Between(40, 110),
                  y: ly + Phaser.Math.Between(70, 160),
                  angle: 180,
                  alpha: 0,
                  duration: 2600,
                  ease: 'Quad.easeOut',
                  onComplete: () => leaf.destroy(),
                });
              },
            });
            this.roomTimers.push(orchardLeafTimer);

            // Barn & Silo (clickable with hover glow)
            const barn = this.add.image(w / 2 + 350, 120, 'barn');
            barn.setDisplaySize(150, 150);
            this.makeClickableAndGlow(barn, () => {
              sounds.playClick();
              this.spawnFloatingBubble(w / 2 + 350, 45, '🌾 Red Barn: Storage for organic seeds and bio-fertilizer.');
            });
            this.worldContainer.add(barn);

            // Moving Windmill (Clean energy for the farm, uses images, NOT polygons!)
            // Sits on the open lawn south of the main road, clear of every crop plot
            this.renderFarmWindmill(w / 2 + 150, 565);

            // 4. Six Dedicated Crop Fields (Displays Specific Dead, Baby, or Flourishing Image!)
            this.renderFarmCropField(w / 2 - 360, 290, 'lake', 'Golden Sweet Corn', 'Lake Water Polluted');
            this.renderFarmCropField(w / 2 - 170, 290, 'forest', 'Canopy Apple Orchard', 'Wildfire Smoke Blight');
            this.renderFarmCropField(w / 2 + 170, 200, 'tundra', 'Glacial Winter Wheat', 'Coal Soot Fallout');
            this.renderFarmCropField(w / 2 + 350, 290, 'grasslands', 'Giant Sunflowers', 'Pesticide & Topsoil Loss');
            this.renderFarmCropField(w / 2 - 170, 580, 'reefs', 'Tidal Rice & Kelp', 'Boat Propellers & Oil');
            this.renderFarmCropField(w / 2 + 330, 580, 'desert', 'Sugar Melons', 'Aquifer Depleted');

            // 5. Elemental Biome Portals (Replaced signs with living environmental indicators)
            this.renderElementalBiomePortals();

            // 6. Farm Activity Station (Extinguish Wildfire Flare-ups)
            this.spawnBiomeQuestStation('clearing', isFarmRestored);

            // NOTE: Per specification, no easter eggs are on the farm!
          }

          private renderBiomePaths(textureKey: string) {
            this.pathPolygons.forEach((poly) => {
              const tile = this.add.tileSprite(
                poly.x,
                poly.y,
                poly.width,
                poly.height,
                textureKey
              ).setOrigin(0, 0);
              this.worldContainer.add(tile);
            });
          }

          // ===============================================================
          // 💨 RENEWABLE ENERGY MOVING WINDMILL (IMAGES, NOT POLYGONS!)
          // ===============================================================
          private renderFarmWindmill(x: number, y: number) {
            const container = this.add.container(x, y);
            container.setDepth(14);

            // Soft shadow
            const shadow = this.add.ellipse(0, 68, 90, 26, 0x000000, 0.35);

            // Windmill Tower image (real PNG image, NO polygons!)
            const tower = this.add.image(0, 0, 'windmill_tower');
            tower.setDisplaySize(115, 150);

            // Windmill Blades image (centered rotor, real PNG image, NO polygons!)
            // Placed at rotor axle hub near the top of the tower
            const blades = this.add.image(0, -38, 'windmill_blades');
            blades.setDisplaySize(135, 135);
            blades.setOrigin(0.5, 0.5);

            container.add([shadow, tower, blades]);
            this.worldContainer.add(container);

            // Continuous rotating blades tween (windmill that moves!)
            const spinTween = this.tweens.add({
              targets: blades,
              angle: 360,
              duration: 4600,
              repeat: -1,
              ease: 'Linear',
            });

            // Fast spin while a recent boost is active (survives the room rebuild that the boost triggers)
            const applyBoostSpin = () => {
              const remaining = this.windmillBoostUntil - this.time.now;
              if (remaining <= 0) return;
              spinTween.setTimeScale(2.6);
              this.time.delayedCall(remaining, () => spinTween.setTimeScale(1.0));
            };
            applyBoostSpin();

            // Click: shave 10 seconds off the remaining grow time of every restored crop
            const onWindmillClick = () => {
              sounds.playRustle();
              this.windmillBoostUntil = this.time.now + 2200;
              applyBoostSpin();
              const boosted = stateRef.current.boostGrowingCrops(10_000);
              if (boosted === 0) {
                this.spawnFloatingBubble(x, y - 75, '💨 Eco-Windmill: No sprouts growing right now. Harvest a restored crop first!');
              }
            };

            // Clickable and glows on hover!
            this.makeClickableAndGlow(tower, onWindmillClick, { parentContainer: container, glowRadius: 130 });
            this.makeClickableAndGlow(blades, onWindmillClick, { parentContainer: container, glowRadius: 140 });

            // Vintage wooden sign beside the windmill
            this.createVintageWoodenSign(
              x,
              y + 80,
              '💨 ECO-WINDMILL',
              'Tap: crops grow 10s faster!',
              165,
              28,
              '#93c5fd',
              onWindmillClick,
              'bottom'
            );
          }

          // ===============================================================
          // 🛒 VISITING CUSTOMER BUYER SPRITE
          // Walks up the dirt path to your farm and purchases the crop!
          // ===============================================================
          public spawnCustomerBuyer(
            biome: Exclude<BiomeId, 'clearing'>,
            cropName: string,
            produceIconKey?: string
          ) {
            if (this.currentRoomId !== 'clearing') return;

            const w = this.canvasW;
            const startX = w / 2;
            const startY = 740;
            const targetY = 440; // Central farm plaza

            const buyerContainer = this.add.container(startX, startY);
            buyerContainer.setDepth(34);

            const shadow = this.add.ellipse(0, 10, 52, 18, 0x000000, 0.4);
            const buyerSprite = this.add.image(0, 0, 'buyer');
            buyerSprite.setDisplaySize(50, 96);
            buyerSprite.setOrigin(0.5, 0.9);

            buyerContainer.add([shadow, buyerSprite]);

            // Clickable & glows on hover
            this.makeClickableAndGlow(buyerSprite, () => {
              sounds.playClick();
              this.spawnFloatingBubble(buyerContainer.x, buyerContainer.y - 85, '😊 "I love buying fresh local crops!"');
            }, { parentContainer: buyerContainer, glowRadius: 95 });

            this.worldContainer.add(buyerContainer);

            // Walking sway tween
            const walkSway = this.tweens.add({
              targets: buyerSprite,
              angle: { from: -4, to: 4 },
              duration: 170,
              yoyo: true,
              repeat: -1,
            });

            // Step sounds
            const stepTimer = this.time.addEvent({
              delay: 380,
              repeat: 5,
              callback: () => sounds.playStep(),
            });
            this.roomTimers.push(stepTimer);

            // Speech sign while walking up the path
            const walkSign = this.createVintageWoodenSign(
              startX,
              startY - 90,
              '🚶 VISITING BUYER',
              `Smelling fresh ${cropName}!`,
              175,
              26,
              '#fde68a',
              undefined,
              'none'
            );

            // Move container up the path towards farm plaza
            this.tweens.add({
              targets: [buyerContainer, walkSign],
              y: '-= 300',
              duration: 2500,
              ease: 'Linear',
              onComplete: () => {
                walkSway.stop();
                buyerSprite.angle = 0;
                walkSign.destroy();

                // Arrived at farm!
                sounds.playCoin();

                // Produce icon flying from farm to buyer
                const defaultKey = `produce_${biome === 'lake' ? 'corn' : biome === 'forest' ? 'apple' : biome === 'tundra' ? 'wheat' : biome === 'grasslands' ? 'sunflower' : biome === 'desert' ? 'melon' : 'rice'}`;
                const pKey = produceIconKey && this.textures.exists(produceIconKey) ? produceIconKey : defaultKey;
                const textureToUse = this.textures.exists(pKey) ? pKey : 'crop_flourish';
                const produceToken = this.add.image(startX, targetY - 40, textureToUse);
                produceToken.setDisplaySize(42, 42).setDepth(36);
                this.tweens.add({
                  targets: produceToken,
                  y: targetY - 75,
                  alpha: { from: 1, to: 0 },
                  scale: { from: 0.6, to: 1.1 },
                  duration: 950,
                  onComplete: () => produceToken.destroy(),
                });

                // Sparkling golden coin particles burst around the buyer
                for (let i = 0; i < 12; i++) {
                  const coin = this.add.circle(
                    startX + Phaser.Math.Between(-28, 28),
                    targetY - 45 + Phaser.Math.Between(-15, 15),
                    4.5,
                    0xfacc15
                  ).setStrokeStyle(1.5, 0x854d0e);
                  coin.setDepth(37);
                  this.tweens.add({
                    targets: coin,
                    x: coin.x + Phaser.Math.Between(-40, 40),
                    y: coin.y - Phaser.Math.Between(30, 70),
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => coin.destroy(),
                  });
                }

                // Add coins to player ledger
                stateRef.current.addCoins('clearing', 50);

                // Cheerful purchase speech sign
                const purchaseSign = this.createVintageWoodenSign(
                  startX,
                  targetY - 95,
                  '🪙 PURCHASE COMPLETE!',
                  `Bought ${cropName} (+50 Coins)`,
                  215,
                  28,
                  '#86efac',
                  undefined,
                  'none'
                );

                // After 2.5s, buyer happily waves and walks back down the path!
                this.time.delayedCall(2400, () => {
                  purchaseSign.destroy();

                  const departSign = this.createVintageWoodenSign(
                    startX,
                    targetY - 90,
                    '👋 THANK YOU!',
                    'Heading to town market',
                    170,
                    26,
                    '#fde68a',
                    undefined,
                    'none'
                  );

                  const returnSway = this.tweens.add({
                    targets: buyerSprite,
                    angle: { from: -4, to: 4 },
                    duration: 170,
                    yoyo: true,
                    repeat: -1,
                  });

                  this.tweens.add({
                    targets: [buyerContainer, departSign],
                    y: '+= 320',
                    duration: 2500,
                    ease: 'Linear',
                    onComplete: () => {
                      returnSway.stop();
                      departSign.destroy();
                      buyerContainer.destroy();
                    },
                  });
                });
              },
            });
          }

          // CROP FIELD: Displays Dead Picture, Baby Sprouts, or Flourishing Picture with Vintage Wooden Sign
          private renderFarmCropField(
            x: number,
            y: number,
            biome: Exclude<BiomeId, 'clearing'>,
            cropName: string,
            crisisNotice: string
          ) {
            const isRestored = (this.restorationData?.[biome] ?? stateRef.current.restoration?.[biome] ?? 0) >= 80;
            const currentPlot = stateRef.current.cropPlots?.[biome];
            const isBaby = currentPlot?.status === 'growing';
            const isReadyToHarvest = isRestored && !isBaby;

            const container = this.add.container(x, y);

            // Raise crop position vertically away from the sign so they never overlap
            const cropOffsetY = -26;

            // Real Image Sprite (Biome-specific Dead vs Baby Sprout vs Flourishing image) raised cleanly away from sign
            const deadTextureKey = this.textures.exists(`crop_${biome}_dead`) ? `crop_${biome}_dead` : 'crop_dead';
            let textureKey = deadTextureKey;
            if (isBaby) {
              textureKey = 'crop_baby';
            } else if (isReadyToHarvest) {
              textureKey = 'crop_flourish';
            }

            const cropImage = this.add.image(0, cropOffsetY, textureKey);
            cropImage.setDisplaySize(100, 100);

            container.add(cropImage);

            // Clickable & glows on hover!
            this.makeClickableAndGlow(cropImage, () => {
              if (isReadyToHarvest) {
                // Harvest crop!
                sounds.playBloom();
                const success = stateRef.current.harvestCrop(biome);
                if (success) {
                  // Floating produce animation
                  const produceKey = `produce_${biome === 'lake' ? 'corn' : biome === 'forest' ? 'apple' : biome === 'tundra' ? 'wheat' : biome === 'grasslands' ? 'sunflower' : biome === 'desert' ? 'melon' : 'rice'}`;
                  if (this.textures.exists(produceKey)) {
                    const token = this.add.image(x, y, produceKey).setDisplaySize(50, 50).setDepth(45);
                    this.tweens.add({
                      targets: token,
                      y: y - 60,
                      scale: { from: 0.6, to: 1.1 },
                      alpha: { from: 1, to: 0 },
                      duration: 1200,
                      onComplete: () => token.destroy(),
                    });
                  }
                  // Sprout particles
                  for (let i = 0; i < 8; i++) {
                    const sp = this.add.circle(x + Phaser.Math.Between(-25, 25), y + Phaser.Math.Between(-15, 15), 3, 0x86efac).setDepth(46);
                    this.tweens.add({
                      targets: sp,
                      y: sp.y - Phaser.Math.Between(20, 50),
                      alpha: 0,
                      duration: 800,
                      onComplete: () => sp.destroy(),
                    });
                  }
                  this.rebuildCurrentRoom(this.restorationData);
                }
              } else if (isBaby) {
                sounds.playClick();
                stateRef.current.openCropModal(biome);
              } else {
                sounds.playClick();
                stateRef.current.openCropModal(biome);
              }
            }, { parentContainer: container, glowRadius: 130 });

            this.worldContainer.add(container);

            // Vintage wooden posted sign cleanly positioned below the raised crop
            let subLabel = `⚠ ${crisisNotice}`;
            let subColor = '#fca5a5';
            if (isBaby) {
              const now = Date.now();
              const timeRemainingMs = currentPlot?.plantedAt ? Math.max(0, currentPlot.growDurationMs - (now - currentPlot.plantedAt)) : 0;
              const mins = Math.ceil(timeRemainingMs / 60000);
              subLabel = `🌱 Baby Sprouts (${mins}m left)`;
              subColor = '#fef08a';
            } else if (isReadyToHarvest) {
              subLabel = '🌾 Click to Harvest!';
              subColor = '#86efac';
            }
            this.createVintageWoodenSign(
              x,
              y + 46,
              cropName,
              subLabel,
              145,
              28,
              subColor,
              () => {
                if (isReadyToHarvest) {
                  cropImage.emit('pointerdown');
                } else {
                  sounds.playClick();
                  stateRef.current.openCropModal(biome);
                }
              },
              'bottom'
            );

            this.currentHotspots.push({
              id: `crop_${biome}`,
              name: `${cropName} (${isBaby ? 'Growing' : (isReadyToHarvest ? 'Flourishing' : 'Crisis')})`,
              x,
              y: y + cropOffsetY,
              iconSprite: textureKey,
              type: 'crop',
              targetBiome: biome,
            });
          }

          // ===============================================================
          // 🌿 ELEMENTAL BIOME PORTALS (VISUAL STORYTELLING INDICATORS)
          // Replaces wooden text signs with living environmental indicators:
          // 1. Lake: Wooden pier dock extending into blue water with swimming fish
          // 2. Arctic Tundra: Glacial ice sheet with fractures & frost sparkles
          // 3. Cloud Forest: Forest trees framing the trail with mushrooms & leafy canopy
          // 4. Desert Oasis: Golden sand dunes with saguaro cactus & desert stones
          // 5. Coral Reefs: Turquoise tidal lagoon with swaying sea anemone & bubbles
          // 6. Prairie Grasslands: Waving golden prairie grass with wild sunflowers
          // ===============================================================
          private renderElementalBiomePortals() {
            const w = this.canvasW;
            this.createLakeDockPortal(60, 420);
            this.createForestGrovePortal(190, 40);
            this.createTundraIcePortal(w / 2, 38);
            this.createGrasslandsPrairiePortal(w - 65, 420);
            this.createDesertOasisPortal(w - 170, 705);
            this.createReefsAnemonePortal(w / 2, 705);
          }

          // 1. 🌊 LAKE DOCK (Path turns into a wooden dock over water with a swimming fish)
          private createLakeDockPortal(x: number, y: number) {
            const container = this.add.container(x, y);

            // Deep lake water cove extending off the west edge
            const waterDeep = this.add.ellipse(-15, 0, 135, 82, 0x0284c7, 0.95);
            const waterShallow = this.add.ellipse(-20, 0, 115, 66, 0x38bdf8, 0.7);
            const waterHighlight = this.add.ellipse(-30, -10, 80, 40, 0x7dd3fc, 0.5);

            // Subtle water ripple ring
            const ripple = this.add.ellipse(-25, 12, 60, 30, 0xffffff, 0.35);
            this.tweens.add({
              targets: ripple,
              scaleX: 1.35,
              scaleY: 1.35,
              alpha: 0,
              duration: 2200,
              repeat: -1,
              ease: 'Sine.easeOut',
            });

            // Wooden dock structure extending into the water
            const supportTop = this.add.rectangle(-12, -18, 72, 6, 0x3e1a06);
            const supportBottom = this.add.rectangle(-12, 18, 72, 6, 0x3e1a06);

            const dockElements: Phaser.GameObjects.GameObject[] = [
              waterDeep,
              waterShallow,
              waterHighlight,
              ripple,
              supportTop,
              supportBottom,
            ];

            // 5 wooden dock planks with rustic texture and brass nails
            for (let i = 0; i < 5; i++) {
              const px = -40 + i * 14;
              const plank = this.add.rectangle(px, 0, 11, 46, 0x78350f).setStrokeStyle(1, 0x451a03);
              const nailTop = this.add.circle(px, -16, 1.2, 0xd97706);
              const nailBottom = this.add.circle(px, 16, 1.2, 0xd97706);
              dockElements.push(plank, nailTop, nailBottom);
            }

            // Mooring post / piling driven into the lake bed with wrapped rope
            const piling = this.add.rectangle(26, -20, 10, 18, 0x451a03);
            const rope = this.add.rectangle(26, -20, 12, 4, 0xfde68a);
            dockElements.push(piling, rope);

            // Swimming clownfish in the water beside the dock
            const fish = this.add.image(-28, 24, 'nemo');
            fish.setDisplaySize(28, 28);
            this.tweens.add({
              targets: fish,
              y: 18,
              angle: -8,
              duration: 1300,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });

            // Ascending water bubble
            const bubble = this.add.circle(-18, 16, 2.5, 0xffffff, 0.75);
            this.tweens.add({
              targets: bubble,
              y: -12,
              alpha: 0,
              duration: 1800,
              repeat: -1,
              ease: 'Cubic.easeOut',
            });

            dockElements.push(fish, bubble);
            container.add(dockElements);

            const triggerLake = () => {
              sounds.playClick();
              stateRef.current.setCurrentBiome('lake');
            };

            container.setSize(100, 70);
            container.setInteractive({ useHandCursor: true });
            container.on('pointerdown', triggerLake);
            fish.setInteractive({ useHandCursor: true });
            fish.on('pointerdown', triggerLake);

            this.worldContainer.add(container);

            this.currentHotspots.push({
              id: 'gate_lake',
              name: 'Lake Dock',
              x,
              y,
              iconSprite: 'nemo',
              type: 'gate',
              targetBiome: 'lake',
            });
          }

          // 2. 🌲 CLOUD FOREST TREES (Woodland trees framing trail with mushrooms & canopy)
          private createForestGrovePortal(x: number, y: number) {
            const container = this.add.container(x, y);

            // Mossy woodland stepping stones on the path
            const stone1 = this.add.ellipse(-8, 8, 14, 8, 0x64748b).setStrokeStyle(1, 0x166534);
            const stone2 = this.add.ellipse(10, 16, 16, 9, 0x475569).setStrokeStyle(1, 0x166534);

            // Two majestic woodland trees flanking the trail exit
            const leftTree = this.add.image(-44, -14, 'trees');
            leftTree.setDisplaySize(66, 66);
            const rightTree = this.add.image(42, -14, 'trees');
            rightTree.setDisplaySize(66, 66);

            // Soft emerald canopy arch connecting treetops overhead
            const canopyArch = this.add.ellipse(0, -30, 76, 24, 0x14532d, 0.65);

            // Wild woodland mushroom in clear foreground beside stepping stones (no trees overhead)
            const mushroom = this.add.image(-10, 22, 'mushroom');
            mushroom.setDisplaySize(20, 20);
            this.tweens.add({
              targets: mushroom,
              angle: 6,
              duration: 1600,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });

            // Falling woodland leaf drifting softly down
            const leaf = this.add.ellipse(0, -10, 4, 6, 0x22c55e, 0.85);
            this.tweens.add({
              targets: leaf,
              y: 20,
              x: 8,
              angle: 120,
              duration: 2500,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });

            container.add([stone1, stone2, leftTree, rightTree, canopyArch, mushroom, leaf]);

            const triggerForest = () => {
              sounds.playClick();
              stateRef.current.setCurrentBiome('forest');
            };

            container.setSize(100, 70);
            container.setInteractive({ useHandCursor: true });
            container.on('pointerdown', triggerForest);

            this.worldContainer.add(container);

            this.currentHotspots.push({
              id: 'gate_forest',
              name: 'Cloud Forest',
              x,
              y,
              iconSprite: 'trees',
              type: 'gate',
              targetBiome: 'forest',
            });
          }

          // 3. ❄️ ARCTIC TUNDRA ICE (Glacial ice sheet with fractures & sparkling frost)
          private createTundraIcePortal(x: number, y: number) {
            const container = this.add.container(x, y);

            // Snow banks framing the icy pass
            const snowLeft = this.add.ellipse(-34, -2, 28, 22, 0xf1f5f9, 0.95).setStrokeStyle(1, 0xbae6fd);
            const snowRight = this.add.ellipse(34, -2, 28, 22, 0xf1f5f9, 0.95).setStrokeStyle(1, 0xbae6fd);

            // Glacial ice base
            const iceBase = this.add.rectangle(0, 0, 72, 48, 0xbae6fd, 0.9).setStrokeStyle(2, 0x93c5fd);

            // Textured ice patch sprite
            const iceTexture = this.add.image(0, 0, 'ice_patch');
            iceTexture.setDisplaySize(68, 44);
            iceTexture.setAlpha(0.85);

            // Fractured ice cracks
            const crack1 = this.add.line(0, 0, -22, -12, 8, 4, 0xffffff, 0.8).setLineWidth(1.5);
            const crack2 = this.add.line(0, 0, 8, 4, 24, -14, 0xffffff, 0.8).setLineWidth(1.5);
            const iceShine = this.add.rectangle(-14, -10, 26, 3.5, 0xffffff, 0.65).setRotation(-0.15);

            // Sparkling frost crystal glints
            const glint1 = this.add.circle(-14, 6, 2.5, 0xffffff, 0.9);
            const glint2 = this.add.circle(18, -8, 2, 0xffffff, 0.9);
            this.tweens.add({
              targets: [glint1, glint2],
              scale: { from: 0.6, to: 1.4 },
              alpha: { from: 0.3, to: 1.0 },
              duration: 800,
              yoyo: true,
              repeat: -1,
            });

            container.add([snowLeft, snowRight, iceBase, iceTexture, crack1, crack2, iceShine, glint1, glint2]);

            const triggerTundra = () => {
              sounds.playClick();
              stateRef.current.setCurrentBiome('tundra');
            };

            container.setSize(76, 50);
            container.setInteractive({ useHandCursor: true });
            container.on('pointerdown', triggerTundra);

            this.worldContainer.add(container);

            this.currentHotspots.push({
              id: 'gate_tundra',
              name: 'Arctic Tundra',
              x,
              y,
              iconSprite: 'ice_patch',
              type: 'gate',
              targetBiome: 'tundra',
            });
          }

          // 4. 🌻 PRAIRIE GRASSLANDS (Waving golden prairie grass with wild sunflowers)
          private createGrasslandsPrairiePortal(x: number, y: number) {
            const container = this.add.container(x, y);

            // Topsoil transition
            const soil = this.add.ellipse(10, 0, 80, 54, 0x271908, 0.35);

            // Tall waving prairie grass clump
            const tallGrass = this.add.image(18, -10, 'tall_grass');
            tallGrass.setDisplaySize(44, 48);
            this.tweens.add({
              targets: tallGrass,
              angle: 5,
              duration: 1700,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });

            // Wild sunflowers along the meadow trail
            const flower1Stem = this.add.rectangle(12, 18, 3, 14, 0x15803d);
            const flower1Petals = this.add.circle(12, 12, 7, 0xfacc15);
            const flower1Center = this.add.circle(12, 12, 3.5, 0x451a03);

            const flower2Stem = this.add.rectangle(-14, 22, 2.5, 11, 0x15803d);
            const flower2Petals = this.add.circle(-14, 17, 5.5, 0xfbbf24);
            const flower2Center = this.add.circle(-14, 17, 2.5, 0x451a03);

            // Fluttering prairie butterfly / sparkle
            const butterflyDot = this.add.circle(-8, -18, 3, 0xfef08a, 0.9);
            this.tweens.add({
              targets: butterflyDot,
              y: -24,
              x: -4,
              duration: 900,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });

            container.add([
              soil,
              tallGrass,
              flower1Stem,
              flower1Petals,
              flower1Center,
              flower2Stem,
              flower2Petals,
              flower2Center,
              butterflyDot,
            ]);

            const triggerGrasslands = () => {
              sounds.playClick();
              stateRef.current.setCurrentBiome('grasslands');
            };

            container.setSize(80, 60);
            container.setInteractive({ useHandCursor: true });
            container.on('pointerdown', triggerGrasslands);

            this.worldContainer.add(container);

            this.currentHotspots.push({
              id: 'gate_grasslands',
              name: 'Prairie Grasslands',
              x,
              y,
              iconSprite: 'tall_grass',
              type: 'gate',
              targetBiome: 'grasslands',
            });
          }

          // 5. 🌵 DESERT OASIS (Golden sand dunes with saguaro cactus & desert stones)
          private createDesertOasisPortal(x: number, y: number) {
            const container = this.add.container(x, y);

            // Golden sand dunes spilling over the southern trail
            const sandBase = this.add.ellipse(0, 10, 85, 48, 0xd97706, 0.85);
            const sandCrest = this.add.ellipse(-6, 8, 70, 34, 0xfde68a, 0.7);

            // Desert pebbles
            const pebble1 = this.add.circle(-22, 18, 3.5, 0x92400e);
            const pebble2 = this.add.circle(18, 22, 2.5, 0xb45309);

            // Saguaro cactus standing beside the sandy path
            const cactus = this.add.image(24, -6, 'cactus');
            cactus.setDisplaySize(46, 50);

            // Desert yellow flower bloom on top of the cactus
            const bloomOuter = this.add.circle(24, -30, 4, 0xfde047);
            const bloomInner = this.add.circle(24, -30, 2, 0xeab308);

            // Subtle warm sun sparkle
            const heatShimmer = this.add.circle(-14, -4, 2, 0xfef08a, 0.75);
            this.tweens.add({
              targets: heatShimmer,
              alpha: { from: 0.2, to: 0.9 },
              scale: { from: 0.6, to: 1.3 },
              duration: 1100,
              yoyo: true,
              repeat: -1,
            });

            container.add([sandBase, sandCrest, pebble1, pebble2, cactus, bloomOuter, bloomInner, heatShimmer]);

            const triggerDesert = () => {
              sounds.playClick();
              stateRef.current.setCurrentBiome('desert');
            };

            container.setSize(85, 60);
            container.setInteractive({ useHandCursor: true });
            container.on('pointerdown', triggerDesert);

            this.worldContainer.add(container);

            this.currentHotspots.push({
              id: 'gate_desert',
              name: 'Desert Oasis',
              x,
              y,
              iconSprite: 'cactus',
              type: 'gate',
              targetBiome: 'desert',
            });
          }

          // 6. 🪸 CORAL REEFS ANEMONE (Turquoise tidal lagoon with swaying sea anemone & bubbles)
          private createReefsAnemonePortal(x: number, y: number) {
            const container = this.add.container(x, y);

            // Sunlit turquoise lagoon pool at the southern exit
            const poolDeep = this.add.ellipse(0, 8, 86, 50, 0x0891b2, 0.85);
            const poolShallow = this.add.ellipse(0, 7, 72, 36, 0x67e8f9, 0.65);
            const poolHighlight = this.add.ellipse(-10, 3, 44, 20, 0xa5f3fc, 0.5);

            // Coral branch & spiral seashell
            const coral1 = this.add.rectangle(-22, 6, 5, 14, 0xfb923c);
            const coral2 = this.add.rectangle(-18, 3, 8, 4, 0xfb923c);
            const shell = this.add.circle(-10, 18, 3.5, 0xffedd5);

            // Swaying Sea Anemone with radiating tentacles
            const anemoneContainer = this.add.container(16, 4);
            const anemoneBody = this.add.circle(0, 0, 9, 0xe11d48);
            const anemoneHighlight = this.add.circle(-2, -2, 5, 0xf43f5e);

            // Radiating soft tentacles in vibrant coral pink & violet
            const t1 = this.add.ellipse(-7, -7, 5, 9, 0xf472b6).setRotation(-0.6);
            const t2 = this.add.ellipse(0, -10, 5, 10, 0xe879f9);
            const t3 = this.add.ellipse(7, -7, 5, 9, 0xfb7185).setRotation(0.6);
            const t4 = this.add.ellipse(10, 0, 9, 5, 0xf472b6);
            const t5 = this.add.ellipse(7, 7, 5, 9, 0xe879f9).setRotation(-0.6);
            const t6 = this.add.ellipse(0, 9, 5, 9, 0xfb7185);
            const t7 = this.add.ellipse(-7, 7, 5, 9, 0xf472b6).setRotation(0.6);
            const t8 = this.add.ellipse(-10, 0, 9, 5, 0xe879f9);

            anemoneContainer.add([t1, t2, t3, t4, t5, t6, t7, t8, anemoneBody, anemoneHighlight]);

            // Soft swaying animation mimicking underwater currents
            this.tweens.add({
              targets: anemoneContainer,
              scaleX: 1.12,
              scaleY: 0.9,
              angle: 5,
              duration: 1300,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });

            // Ascending sea bubble
            const bubble = this.add.circle(6, 12, 2.5, 0xffffff, 0.7);
            this.tweens.add({
              targets: bubble,
              y: -14,
              alpha: 0,
              duration: 1800,
              repeat: -1,
              ease: 'Cubic.easeOut',
            });

            container.add([poolDeep, poolShallow, poolHighlight, coral1, coral2, shell, anemoneContainer, bubble]);

            const triggerReefs = () => {
              sounds.playClick();
              stateRef.current.setCurrentBiome('reefs');
            };

            container.setSize(86, 52);
            container.setInteractive({ useHandCursor: true });
            container.on('pointerdown', triggerReefs);

            this.worldContainer.add(container);

            this.currentHotspots.push({
              id: 'gate_reefs',
              name: 'Coral Reefs',
              x,
              y,
              iconSprite: 'sea_turtle',
              type: 'gate',
              targetBiome: 'reefs',
            });
          }

          // 7. 🏡 FARM RETURN GATEWAY (Replaces return wooden signs inside biomes)
          private createFarmReturnPortal(x: number, y: number) {
            const container = this.add.container(x, y);

            // Rustic wooden fence posts
            const postLeft = this.add.rectangle(-18, 0, 7, 28, 0x451a03);
            const postRight = this.add.rectangle(18, 0, 7, 28, 0x451a03);
            const rail1 = this.add.rectangle(0, -6, 38, 4.5, 0x78350f);
            const rail2 = this.add.rectangle(0, 6, 38, 4.5, 0x78350f);

            // Glowing farm brass lantern hanging on iron crook
            const crook = this.add.rectangle(-17, -16, 10, 2.5, 0x292524);
            const lanternBody = this.add.rectangle(-12, -10, 7, 9, 0xb45309);
            const flame = this.add.circle(-12, -10, 3, 0xfef08a);
            const halo = this.add.circle(-12, -10, 9, 0xfde68a, 0.35);

            this.tweens.add({
              targets: [halo],
              alpha: { from: 0.2, to: 0.5 },
              scale: { from: 0.85, to: 1.2 },
              duration: 650,
              yoyo: true,
              repeat: -1,
            });

            // Fresh green farm sprout at the gate post
            const sprout1 = this.add.ellipse(14, 12, 4.5, 8, 0x4ade80).setRotation(0.4);
            const sprout2 = this.add.ellipse(18, 12, 4.5, 8, 0x22c55e).setRotation(-0.4);

            container.add([postLeft, postRight, rail1, rail2, crook, lanternBody, halo, flame, sprout1, sprout2]);

            const triggerReturn = () => {
              sounds.playClick();
              stateRef.current.setCurrentBiome('clearing');
            };

            container.setSize(44, 34);
            container.setInteractive({ useHandCursor: true });
            container.on('pointerdown', triggerReturn);

            this.worldContainer.add(container);

            this.currentHotspots.push({
              id: 'gate_clearing',
              name: 'Return to Central Farm',
              x,
              y,
              type: 'gate',
              targetBiome: 'clearing',
            });
          }

          // ===============================================================
          // 🗺️ FULL-WIDTH BIOME ROOMS (SCREEN-WIDE HIGH-RES IMAGES)
          // ===============================================================
          private buildMaximalistBiomeRoom(biome: BiomeId, isRestored: boolean) {
            const w = this.canvasW;
            const h = this.canvasH;

            // 1. Biome Real Image
            const bgKey = `biome_${biome}_${isRestored ? 'flourish' : 'dead'}`;
            const bgImage = this.add.image(w / 2, h / 2, bgKey);
            bgImage.setDisplaySize(w, h);
            this.worldContainer.add(bgImage);

            // 2. Walkable paths designed for opposite-side entry/exit
            let pathKey = 'path_farm';
            if (biome === 'lake') {
              pathKey = 'path_lake';
              this.pathPolygons = [
                new Phaser.Geom.Rectangle(160, 340, w + 60, 70),
                new Phaser.Geom.Rectangle(w / 2 - 40, 140, 80, 480),
              ];
            } else if (biome === 'grasslands') {
              pathKey = 'path_grasslands';
              this.pathPolygons = [
                new Phaser.Geom.Rectangle(-60, 340, w - 100, 70),
                new Phaser.Geom.Rectangle(w / 2 - 40, 140, 80, 480),
              ];
            } else if (biome === 'forest') {
              pathKey = 'path_forest';
              this.pathPolygons = [
                new Phaser.Geom.Rectangle(w / 2 - 40, 140, 80, 670),
                new Phaser.Geom.Rectangle(w / 2 - 460, 340, 920, 70),
              ];
            } else if (biome === 'tundra') {
              pathKey = 'path_tundra';
              this.pathPolygons = [
                new Phaser.Geom.Rectangle(w / 2 - 40, 140, 80, 670),
                new Phaser.Geom.Rectangle(w / 2 - 460, 340, 920, 70),
              ];
            } else if (biome === 'desert') {
              pathKey = 'path_desert';
              this.pathPolygons = [
                new Phaser.Geom.Rectangle(w / 2 - 40, -60, 80, 710),
                new Phaser.Geom.Rectangle(w / 2 - 460, 340, 920, 70),
              ];
            } else if (biome === 'reefs') {
              pathKey = 'path_reefs';
              this.pathPolygons = [
                new Phaser.Geom.Rectangle(w / 2 - 40, -60, 80, 710),
                new Phaser.Geom.Rectangle(w / 2 - 460, 340, 920, 70),
              ];
            }

            this.renderBiomePaths(pathKey);

            // 3. Animal Friend at Center (w / 2, 330)
            const animalId = this.getAnimalForBiome(biome);
            if (animalId) {
              this.spawnBiomeAnimal(animalId, w / 2, 330, isRestored);
            }

            // 4. Action Plan Quest Station at (w / 2, 180)
            this.spawnBiomeQuestStation(biome, isRestored);

            // Dynamic Environmental Effects (Dynamic water ripples/caustics/sparkles and swaying trees/leaves)
            if (biome === 'lake') {
              this.createDynamicLakeWater(isRestored);
            } else if (biome === 'reefs') {
              this.createDynamicReefWater(isRestored);
            } else if (biome === 'forest') {
              this.createDynamicForestEnvironment(isRestored);
            }

            // 5. Miniature Biome Easter Eggs (Only unlocked after environment has been healed!)
            if (isRestored) {
              if (biome === 'forest') {
                this.spawnForestEasterEggs();
              } else if (biome === 'tundra') {
                this.spawnTundraEasterEggs();
              } else if (biome === 'grasslands') {
                this.spawnGrasslandsEasterEggs();
              } else if (biome === 'desert') {
                this.spawnDesertEasterEggs();
              } else if (biome === 'reefs') {
                this.spawnReefEasterEggs();
              } else if (biome === 'lake') {
                this.spawnLakeEasterEggs();
              }
            }

            // 6. Return to Central Farm Portal placed at exit edge (Rustic farm gateway)
            if (biome === 'lake') {
              this.createFarmReturnPortal(w - 70, 375);
            } else if (biome === 'grasslands') {
              this.createFarmReturnPortal(70, 375);
            } else if (biome === 'forest' || biome === 'tundra') {
              this.createFarmReturnPortal(w / 2, 715);
            } else if (biome === 'reefs' || biome === 'desert') {
              this.createFarmReturnPortal(w / 2, 35);
            }
          }

          private spawnBiomeQuestStation(biome: BiomeId, isRestored: boolean) {
            const questMap: Record<BiomeId, { name: string; action: any }> = {
              lake: { name: 'Circular Waste Recycling Quiz', action: 'lake_recycling' },
              forest: { name: 'Fire Prevention & Email Campaign', action: 'forest_campaign' },
              tundra: { name: 'Coal Plant Shutdown Petition', action: 'tundra_petition' },
              grasslands: { name: 'Bayer Smart Precision Simulator', action: 'grasslands_farming' },
              desert: { name: 'Solar Artesian Well & Aquifer Restoration', action: 'desert_aquifer' },
              reefs: { name: 'Maritime GPS Radar Redirection', action: 'reef_navigation' },
              clearing: { name: 'Water Usage Pledge to Prevent Droughts', action: 'wildfire_quench' },
            };

            const qInfo = questMap[biome];
            if (!qInfo || !qInfo.action) return;

            const triggerAction = () => {
              if (stateRef.current.isAnyPopupOpen) return;
              sounds.playClick();
              stateRef.current.openQuestModal(qInfo.action);
            };

            // Requirement 3: Move the big sign about putting out the fire on the farm to where the pool was (w / 2 - 360, 580)
            const signX = biome === 'clearing' ? (this.canvasW / 2 - 360) : (this.canvasW / 2);
            const signY = biome === 'clearing' ? 580 : 180;
            const signWidth = biome === 'clearing' ? 245 : 210;
            const signColor = biome === 'clearing' ? '#38bdf8' : '#fde68a';

            const title = isRestored
              ? (biome === 'clearing' ? '✓ PLEDGED: Drought Prevention' : `✓ RESTORED: ${qInfo.name}`)
              : `ACTION PLAN: ${qInfo.name}`;
            const subtitle = isRestored
              ? (biome === 'clearing' ? 'Water Conserved • Tap to review pledge' : 'Habitat Flourishing • Tap to review')
              : (biome === 'clearing' ? 'Pledge water usage to prevent droughts' : 'Tap sign to launch action plan');

            this.createVintageWoodenSign(
              signX,
              signY,
              title,
              subtitle,
              signWidth,
              32,
              signColor,
              triggerAction,
              'bottom'
            );

            this.currentHotspots.push({
              id: `quest_${biome}`,
              name: qInfo.name,
              x: signX,
              y: signY,
              type: 'quest',
              questAction: qInfo.action,
            });
          }

          // ===============================================================
          // 🌊 DYNAMIC WATER & FOREST ENVIRONMENTAL EFFECTS
          // ===============================================================
          private createDynamicLakeWater(isRestored: boolean) {
            // 1. Glistening horizontal surface water ripples
            const rippleStreaks = [
              { x: 260, y: 220, width: 110 },
              { x: 420, y: 270, width: 140 },
              { x: 220, y: 460, width: 95 },
              { x: 360, y: 520, width: 130 },
              { x: 170, y: 320, width: 85 },
              { x: 490, y: 450, width: 105 },
            ];

            rippleStreaks.forEach((pt, i) => {
              const streak = this.add.ellipse(
                pt.x,
                pt.y,
                pt.width,
                5,
                isRestored ? 0xbae6fd : 0x0284c7,
                isRestored ? 0.45 : 0.35
              );
              this.worldContainer.add(streak);
              this.tweens.add({
                targets: streak,
                scaleX: { from: 0.85, to: 1.25 },
                alpha: { from: 0.25, to: 0.65 },
                x: pt.x + (i % 2 === 0 ? 10 : -10),
                duration: 1800 + i * 250,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
              });
            });

            // 2. Periodic expanding water ripple rings
            const rippleTimer = this.time.addEvent({
              delay: 1300,
              loop: true,
              callback: () => {
                const rx = Phaser.Math.Between(160, 520);
                const ry = Phaser.Math.Between(190, 540);
                const ring = this.add.ellipse(rx, ry, 18, 9, 0x000000, 0);
                ring.setStrokeStyle(1.5, isRestored ? 0xa5f3fc : 0x38bdf8, 0.75);
                this.worldContainer.add(ring);
                this.tweens.add({
                  targets: ring,
                  scaleX: 3.2,
                  scaleY: 2.5,
                  alpha: 0,
                  duration: 2100,
                  ease: 'Quad.easeOut',
                  onComplete: () => ring.destroy(),
                });
              },
            });
            this.roomTimers.push(rippleTimer);

            // 3. Sunlight water sparkles / glints
            const glintTimer = this.time.addEvent({
              delay: 600,
              loop: true,
              callback: () => {
                const gx = Phaser.Math.Between(150, 540);
                const gy = Phaser.Math.Between(180, 550);
                const star = this.add.star(gx, gy, 4, 2, 5, isRestored ? 0xffffff : 0x7dd3fc, 0);
                this.worldContainer.add(star);
                this.tweens.add({
                  targets: star,
                  scale: { from: 0.2, to: 1.15 },
                  alpha: { from: 0, to: 0.9 },
                  duration: 450,
                  yoyo: true,
                  ease: 'Sine.easeInOut',
                  onComplete: () => star.destroy(),
                });
              },
            });
            this.roomTimers.push(glintTimer);
          }

          private createDynamicReefWater(isRestored: boolean) {
            const w = this.canvasW;

            // 1. Dynamic undersea caustics ribbons
            const caustics = [
              { x: 260, y: 220, w: 120, h: 5 },
              { x: 440, y: 270, w: 150, h: 6 },
              { x: 290, y: 490, w: 130, h: 5 },
              { x: 520, y: 530, w: 110, h: 5 },
              { x: w - 280, y: 230, w: 140, h: 6 },
              { x: w - 220, y: 470, w: 115, h: 5 },
            ];

            caustics.forEach((cp, i) => {
              const band = this.add.ellipse(
                cp.x,
                cp.y,
                cp.w,
                cp.h,
                isRestored ? 0x67e8f9 : 0x0284c7,
                0.4
              );
              this.worldContainer.add(band);
              this.tweens.add({
                targets: band,
                scaleX: { from: 0.85, to: 1.25 },
                scaleY: { from: 0.7, to: 1.4 },
                alpha: { from: 0.2, to: 0.65 },
                x: cp.x + (i % 2 === 0 ? 14 : -14),
                duration: 2200 + i * 300,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
              });
            });

            // 2. Translucent bubbles rising from reef seabed
            const bubbleTimer = this.time.addEvent({
              delay: 480,
              loop: true,
              callback: () => {
                const bx = Phaser.Math.Between(180, w - 180);
                const by = Phaser.Math.Between(440, 680);
                const radius = Phaser.Math.Between(2, 5);
                const bubble = this.add.circle(bx, by, radius, isRestored ? 0xe0f2fe : 0x7dd3fc, 0.75);
                bubble.setStrokeStyle(1, 0xffffff, 0.6);
                this.worldContainer.add(bubble);
                this.tweens.add({
                  targets: bubble,
                  y: by - Phaser.Math.Between(130, 250),
                  x: bx + Phaser.Math.Between(-25, 25),
                  alpha: 0,
                  duration: Phaser.Math.Between(2200, 3500),
                  ease: 'Quad.easeOut',
                  onComplete: () => bubble.destroy(),
                });
              },
            });
            this.roomTimers.push(bubbleTimer);

            // 3. Aqua ocean surface sparkles
            const reefGlintTimer = this.time.addEvent({
              delay: 650,
              loop: true,
              callback: () => {
                const gx = Phaser.Math.Between(180, w - 180);
                const gy = Phaser.Math.Between(140, 600);
                const glint = this.add.star(gx, gy, 4, 2, 5, isRestored ? 0x67e8f9 : 0x38bdf8, 0);
                this.worldContainer.add(glint);
                this.tweens.add({
                  targets: glint,
                  scale: { from: 0.2, to: 1.1 },
                  alpha: { from: 0, to: 0.85 },
                  duration: 500,
                  yoyo: true,
                  ease: 'Sine.easeInOut',
                  onComplete: () => glint.destroy(),
                });
              },
            });
            this.roomTimers.push(reefGlintTimer);
          }

          private createDynamicForestEnvironment(isRestored: boolean) {
            const w = this.canvasW;

            // 1. Ambient swaying trees along forest backdrop (kept clear of the bouncy mushroom at w/2 - 410, 375)
            const bgTreePositions = [
              { x: w / 2 - 320, y: 160 },
              { x: w / 2 + 320, y: 160 },
              { x: w / 2 - 420, y: 560 },
              { x: w / 2 + 420, y: 440 },
            ];

            bgTreePositions.forEach((pos, i) => {
              const tree = this.add.image(pos.x, pos.y, 'trees');
              tree.setDisplaySize(110, 110);
              tree.setOrigin(0.5, 0.85);
              if (!isRestored) {
                tree.setTint(0x78716c);
              }
              this.worldContainer.add(tree);
              this.tweens.add({
                targets: tree,
                angle: { from: -2.2, to: 2.2 },
                duration: 2500 + i * 400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: i * 250,
              });
            });

            // 2. Drifting leaves / embers across the breeze
            const leafColors = isRestored
              ? [0x16a34a, 0x22c55e, 0x4ade80, 0xca8a04]
              : [0x78716c, 0xa8a29e, 0x57534e, 0xef4444];

            const leafTimer = this.time.addEvent({
              delay: 650,
              loop: true,
              callback: () => {
                const lx = Phaser.Math.Between(100, w - 100);
                const ly = Phaser.Math.Between(20, 280);
                const color = Phaser.Utils.Array.GetRandom(leafColors);
                const leaf = this.add.ellipse(lx, ly, 6, 3, color, 0.85);
                this.worldContainer.add(leaf);
                this.tweens.add({
                  targets: leaf,
                  x: lx + Phaser.Math.Between(60, 160),
                  y: ly + Phaser.Math.Between(120, 260),
                  angle: 360,
                  alpha: 0,
                  duration: Phaser.Math.Between(2600, 4200),
                  ease: 'Quad.easeOut',
                  onComplete: () => leaf.destroy(),
                });
              },
            });
            this.roomTimers.push(leafTimer);
          }

          private getAnimalForBiome(biome: BiomeId): AnimalId | null {
            if (biome === 'forest') return 'red_panda';
            if (biome === 'lake') return 'manatee';
            if (biome === 'tundra') return 'polar_bear';
            if (biome === 'grasslands') return 'butterfly';
            if (biome === 'desert') return 'cheetah';
            if (biome === 'reefs') return 'sea_turtle';
            return null;
          }

          private spawnBiomeAnimal(animalId: AnimalId, x: number, y: number, isRestored: boolean) {
            const info = ANIMALS[animalId];
            const hasMiniGame = ['manatee', 'butterfly', 'cheetah', 'polar_bear', 'sea_turtle', 'red_panda'].includes(animalId);
            const container = this.add.container(x, y);

            // Ground shadow
            const shadow = this.add.ellipse(0, 44, 76, 22, 0x000000, 0.35);

            // Ambient breathing glow (gloomy grey until the biome is restored)
            const glow = this.add.circle(0, 0, 46, isRestored ? 0x10b981 : 0x64748b, 0.25);
            this.tweens.add({ targets: glow, scale: 1.25, alpha: 0.08, duration: 900, yoyo: true, repeat: -1 });

            // Animal image sprite: sad until its biome is restored, then happy
            const sprite = this.add.image(0, 0, isRestored ? animalId : `${animalId}_sad`);
            sprite.setDisplaySize(80, 80);
            sprite.setOrigin(0.5, 0.5);

            // Happy friends bounce; sad ones slump slowly
            this.tweens.add({
              targets: sprite,
              y: isRestored ? sprite.y - 6 : sprite.y + 3,
              duration: isRestored ? 1400 : 2200,
              yoyo: true,
              repeat: -1,
            });

            container.add([shadow, glow, sprite]);

            // Little pixel rain cloud hanging over sad friends until their biome is restored
            if (!isRestored) {
              const cloud = this.add.container(0, -66);
              const puffs = this.add.graphics();
              puffs.fillStyle(0x334155, 1);
              puffs.fillRect(-26, -6, 52, 16);
              puffs.fillRect(-18, -14, 20, 8);
              puffs.fillRect(-2, -18, 18, 12);
              puffs.fillStyle(0x64748b, 1);
              puffs.fillRect(-24, -4, 48, 12);
              puffs.fillRect(-16, -12, 16, 8);
              puffs.fillRect(0, -16, 14, 12);
              puffs.fillStyle(0x94a3b8, 1);
              puffs.fillRect(-14, -10, 8, 4);
              puffs.fillRect(2, -14, 8, 4);
              cloud.add(puffs);

              [-16, -4, 8, 18].forEach((dropX, i) => {
                const drop = this.add.rectangle(dropX, 12, 3, 7, 0x60a5fa);
                cloud.add(drop);
                this.tweens.add({
                  targets: drop,
                  y: 34,
                  alpha: { from: 1, to: 0 },
                  duration: 650,
                  delay: i * 170,
                  repeat: -1,
                });
              });

              this.tweens.add({ targets: cloud, x: 5, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
              container.add(cloud);
            }

            const triggerChat = () => {
              sounds.playClick();
              stateRef.current.openDialogue(animalId);
            };

            this.makeClickableAndGlow(sprite, triggerChat, { parentContainer: container, glowRadius: 110 });

            // Floating name label below the animal
            const nameLabel = this.add.text(0, 54, info.name, {
              fontSize: '12px',
              fontStyle: 'bold',
              fontFamily: "'Silkscreen', monospace",
              color: '#ffffff',
              stroke: '#140702',
              strokeThickness: 3,
              align: 'center',
              resolution: 3,
            }).setOrigin(0.5);
            container.add(nameLabel);
            this.tweens.add({
              targets: nameLabel,
              y: 58,
              duration: 1600,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });

            this.worldContainer.add(container);

            this.currentHotspots.push({
              id: `animal_${animalId}`,
              name: hasMiniGame ? `Play with ${info.name}` : `Talk to ${info.name}`,
              x,
              y,
              iconSprite: animalId,
              type: 'animal',
              animalId,
            });
          }

          // ===============================================================
          // 🐣 MINIATURE BIOME EASTER EGGS (UNLOCKED AFTER ENVIRONMENT HEALED)
          // ===============================================================

          // 1. 🍄 FOREST EASTER EGGS: Bouncy mushroom in corner of path & season-changing trees
          private spawnForestEasterEggs() {
            const w = this.canvasW;

            // Mushroom in corner of path (dead-end of western horizontal trail)
            const mx = w / 2 - 410;
            const my = 375;

            const mContainer = this.add.container(mx, my);
            mContainer.setDepth(22);

            const mShadow = this.add.ellipse(0, 16, 40, 14, 0x000000, 0.45);
            const mSprite = this.add.image(0, 0, 'mushroom');
            mSprite.setDisplaySize(48, 48);
            mSprite.setName('mushroom_sprite');

            // Ambient gentle pulse (scale never exceeds 1.0)
            const mGlow = this.add.circle(0, 2, 24, 0xef4444, 0.2);
            this.tweens.add({
              targets: mGlow,
              scale: { from: 1.0, to: 0.75 },
              alpha: { from: 0.25, to: 0.08 },
              duration: 900,
              yoyo: true,
              repeat: -1,
            });

            mContainer.add([mShadow, mGlow, mSprite]);

            // Clickable & glows on hover
            this.makeClickableAndGlow(mSprite, (pointer: Phaser.Input.Pointer) => {
              pointer.event?.stopPropagation?.();
              this.ignorePathClickUntil = this.time.now + 250;
              this.walkPlayerTo(mx, my);
            }, { parentContainer: mContainer, glowRadius: 65 });

            this.easterEggsContainer.add(mContainer);
            this.mushroomObj = mContainer;

            this.createVintageWoodenSign(
              mx,
              my - 48,
              '🍄 BOUNCY MUSHROOM',
              'Step on to bounce!',
              180,
              32,
              '#ef4444',
              () => {
                this.walkPlayerTo(mx, my);
              },
              'none'
            );

            // Interactive season-changing trees around the forest
            this.interactiveForestTrees = [];
            const treePositions = [
              { x: w / 2 - 300, y: 220 },
              { x: w / 2 + 300, y: 220 },
              { x: w / 2 - 300, y: 530 },
              { x: w / 2 + 300, y: 530 },
              { x: w / 2 - 440, y: 210 },
              { x: w / 2 + 440, y: 210 },
            ];

            treePositions.forEach((pos) => {
              const tContainer = this.add.container(pos.x, pos.y);
              tContainer.setDepth(24);

              const tSprite = this.add.image(0, 0, 'trees');
              tSprite.setDisplaySize(115, 115);
              tSprite.setOrigin(0.5, 0.5);

              // Gentle ambient swaying in the breeze
              this.tweens.add({
                targets: tSprite,
                angle: { from: -2.2, to: 2.2 },
                duration: 2500 + Math.random() * 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: Math.random() * 500,
              });

              tContainer.add(tSprite);

              const treeData = {
                container: tContainer,
                sprite: tSprite,
                season: 'summer' as 'summer' | 'autumn',
              };
              this.interactiveForestTrees.push(treeData);

              // Clickable & glows on hover
              this.makeClickableAndGlow(tSprite, (pointer: Phaser.Input.Pointer) => {
                pointer.event?.stopPropagation?.();
                this.ignorePathClickUntil = this.time.now + 250;
                this.toggleForestTreeSeason(treeData);
              }, { parentContainer: tContainer, glowRadius: 130 });

              this.easterEggsContainer.add(tContainer);
            });

            this.createVintageWoodenSign(
              w / 2 - 300,
              145,
              '🌲 CANOPY OAKS',
              'Click trees to change seasons!',
              210,
              32,
              '#86efac',
              () => {
                if (this.interactiveForestTrees.length > 0) {
                  this.toggleForestTreeSeason(this.interactiveForestTrees[0]);
                }
              },
              'none'
            );
          }

          private toggleForestTreeSeason(treeData: {
            container: Phaser.GameObjects.Container | Phaser.GameObjects.Image;
            sprite: Phaser.GameObjects.Image;
            season: 'summer' | 'autumn';
          }) {
            sounds.playRustle();

            // Joyful wobble
            this.tweens.add({
              targets: treeData.sprite,
              angle: { from: -4, to: 4 },
              duration: 80,
              yoyo: true,
              repeat: 3,
              onComplete: () => {
                treeData.sprite.angle = 0;
              },
            });

            if (treeData.season === 'summer') {
              treeData.season = 'autumn';
              const autumnTints = [0xf59e0b, 0xea580c, 0xd97706, 0xf97316];
              const tint = autumnTints[Phaser.Math.Between(0, autumnTints.length - 1)];
              treeData.sprite.setTint(tint);
              this.spawnAutumnLeafParticles(treeData.container.x, treeData.container.y - 25);
            } else {
              treeData.season = 'summer';
              treeData.sprite.clearTint();
              this.spawnSummerSparkleParticles(treeData.container.x, treeData.container.y - 25);
            }
          }

          private spawnMushroomSporeParticles(x: number, y: number) {
            const sporeColors = [0xfef08a, 0xfca5a5, 0xffffff, 0xfde047];
            for (let i = 0; i < 7; i++) {
              const sp = this.add.circle(
                x + Phaser.Math.Between(-16, 16),
                y + Phaser.Math.Between(-8, 8),
                Phaser.Math.Between(2, 4),
                sporeColors[i % sporeColors.length],
                0.9
              );
              sp.setDepth(55);
              this.tweens.add({
                targets: sp,
                x: sp.x + Phaser.Math.Between(-28, 28),
                y: sp.y - Phaser.Math.Between(15, 36),
                alpha: 0,
                scale: 0.2,
                duration: Phaser.Math.Between(450, 750),
                onComplete: () => sp.destroy(),
              });
            }
          }

          private spawnAutumnLeafParticles(x: number, y: number) {
            const leafColors = [0xf59e0b, 0xea580c, 0xd97706, 0xef4444, 0xfbbf24];
            for (let i = 0; i < 16; i++) {
              const leaf = this.add.ellipse(
                x + Phaser.Math.Between(-45, 45),
                y + Phaser.Math.Between(-35, 15),
                8,
                5,
                leafColors[i % leafColors.length],
                0.95
              );
              leaf.setDepth(55);
              const driftX = Phaser.Math.Between(-40, 40);
              const fallY = Phaser.Math.Between(60, 110);
              this.tweens.add({
                targets: leaf,
                x: leaf.x + driftX,
                y: leaf.y + fallY,
                angle: Phaser.Math.Between(120, 360),
                alpha: 0,
                duration: Phaser.Math.Between(1200, 2000),
                ease: 'Quad.easeOut',
                onComplete: () => leaf.destroy(),
              });
            }
          }

          private spawnSummerSparkleParticles(x: number, y: number) {
            for (let i = 0; i < 10; i++) {
              const sp = this.add.circle(
                x + Phaser.Math.Between(-35, 35),
                y + Phaser.Math.Between(-25, 25),
                3,
                0x86efac,
                0.9
              );
              sp.setDepth(55);
              this.tweens.add({
                targets: sp,
                y: sp.y - 45,
                alpha: 0,
                scale: 0.3,
                duration: 900,
                onComplete: () => sp.destroy(),
              });
            }
          }

          // 2. ❄️ TUNDRA EASTER EGG: Patch of ice on less-used path that the sprite can slide on
          private spawnTundraEasterEggs() {
            const w = this.canvasW;

            // Ice patch on western horizontal side path
            const iceX = w / 2 - 270;
            const iceY = 375;
            const iceW = 160;
            const iceH = 65;

            this.tundraIcePatch = new Phaser.Geom.Rectangle(iceX - iceW / 2, iceY - iceH / 2, iceW, iceH);

            const iceContainer = this.add.container(iceX, iceY);
            iceContainer.setDepth(12);

            // Translucent crystalline pack ice
            const iceBase = this.add.rectangle(0, 0, iceW, iceH, 0x67e8f9, 0.75)
              .setStrokeStyle(2.5, 0xbae6fd, 0.95);

            // Glossy reflection gleam
            const shine = this.add.rectangle(0, -6, iceW - 20, 12, 0xffffff, 0.55);
            shine.setRotation(-0.06);

            // Frosted fracture lines
            const crack1 = this.add.line(0, 0, -50, 10, -10, -8, 0xffffff, 0.8).setLineWidth(1.5);
            const crack2 = this.add.line(0, 0, 15, -12, 55, 8, 0xffffff, 0.7).setLineWidth(1.5);

            // Sparkling frost glint (scale never exceeds 1.0)
            const glint = this.add.circle(45, -16, 3, 0xffffff, 0.9);
            this.tweens.add({
              targets: glint,
              scale: { from: 0.6, to: 1.0 },
              alpha: { from: 0.3, to: 1.0 },
              duration: 700,
              yoyo: true,
              repeat: -1,
            });

            // Clickable & glows on hover
            this.makeClickableAndGlow(iceBase, (pointer: Phaser.Input.Pointer) => {
              pointer.event?.stopPropagation?.();
              this.ignorePathClickUntil = this.time.now + 250;
              this.walkPlayerTo(iceX, iceY);
            }, { parentContainer: iceContainer, glowRadius: 180 });

            iceContainer.add([iceBase, shine, crack1, crack2, glint]);
            this.easterEggsContainer.add(iceContainer);

            // Warning sign beside ice
            this.createVintageWoodenSign(
              iceX,
              iceY - 50,
              '❄️ GLACIAL ICE SHEET',
              'Caution: Slippery! Slide across',
              145,
              28,
              '#bae6fd',
              () => {
                this.walkPlayerTo(iceX, iceY);
              },
              'none'
            );
          }

          private spawnIceGliderParticles(x: number, y: number) {
            for (let i = 0; i < 2; i++) {
              const spark = this.add.circle(
                x + Phaser.Math.Between(-8, 8),
                y + Phaser.Math.Between(-2, 4),
                Phaser.Math.Between(2, 3),
                0xffffff,
                0.85
              );
              spark.setDepth(55);
              this.tweens.add({
                targets: spark,
                alpha: 0,
                scale: 0.2,
                duration: 250,
                onComplete: () => spark.destroy(),
              });
            }
          }

          // ❄️ Visible farmer's breath in the freezing Arctic Tundra
          private spawnFarmerBreath() {
            if (!this.player || !this.playerSprite || this.currentRoomId !== 'tundra') return;

            const facingRight = this.playerSprite.flipX;
            const mouthX = this.player.x + (facingRight ? 11 : -11);
            const mouthY = this.player.y - 42;

            // Emit soft drifting puffs of frosty condensed breath
            for (let i = 0; i < 3; i++) {
              this.time.delayedCall(i * 85, () => {
                if (!this.player || this.currentRoomId !== 'tundra') return;

                const size = 2.5 + i * 1.2;
                const breath = this.add.circle(
                  mouthX + (facingRight ? i * 2 : -i * 2),
                  mouthY + (i === 1 ? -1 : 1),
                  size,
                  0xf0f9ff,
                  0.75
                );
                breath.setDepth(55);

                const driftX = facingRight ? (12 + i * 6) : (-12 - i * 6);
                const driftY = -(8 + i * 4);

                this.tweens.add({
                  targets: breath,
                  x: breath.x + driftX,
                  y: breath.y + driftY,
                  scale: 1.8,
                  alpha: 0,
                  duration: 750 + i * 100,
                  ease: 'Sine.easeOut',
                  onComplete: () => breath.destroy(),
                });
              });
            }
          }

          // 3. 🦋 GRASSLANDS EASTER EGG: Patch of grass with butterflies that fly up and away
          private spawnGrasslandsEasterEggs() {
            const w = this.canvasW;

            // Patch of grass along the path
            const gx = w / 2 + 250;
            const gy = 375;

            const grassContainer = this.add.container(gx, gy);
            grassContainer.setDepth(18);

            const grassSprite = this.add.image(0, 0, 'tall_grass');
            grassSprite.setDisplaySize(64, 64);
            grassContainer.add(grassSprite);

            // Resting butterflies gently fluttering wings
            const restingButterflies: Phaser.GameObjects.Image[] = [];
            const restingOffsets = [
              { x: -14, y: -16, tint: 0xf97316 },
              { x: 12, y: -20, tint: 0x38bdf8 },
              { x: 0, y: -26, tint: 0xfacc15 },
            ];

            restingOffsets.forEach((off) => {
              const bf = this.add.image(off.x, off.y, 'butterfly');
              bf.setDisplaySize(20, 20);
              bf.setTint(off.tint);
              this.tweens.add({
                targets: bf,
                scaleX: 0.6,
                duration: Phaser.Math.Between(350, 600),
                yoyo: true,
                repeat: -1,
              });
              grassContainer.add(bf);
              restingButterflies.push(bf);
            });

            this.easterEggsContainer.add(grassContainer);

            this.grasslandsGrassPatch = {
              x: gx,
              y: gy,
              container: grassContainer,
              restingButterflies,
              triggered: false,
              readyAt: 0,
            };

            // Clickable & glows on hover
            this.makeClickableAndGlow(grassSprite, (pointer: Phaser.Input.Pointer) => {
              pointer.event?.stopPropagation?.();
              this.ignorePathClickUntil = this.time.now + 250;
              this.walkPlayerTo(gx, gy);
            }, { parentContainer: grassContainer, glowRadius: 85 });

            this.createVintageWoodenSign(
              gx,
              gy - 48,
              '🦋 PRAIRIE MONARCH GRASS',
              'Walk through to flutter!',
              200,
              32,
              '#fde68a',
              () => {
                this.walkPlayerTo(gx, gy);
              },
              'none'
            );
          }

          private triggerButterflySwarm(
            gx: number,
            gy: number,
            grassContainer: Phaser.GameObjects.Container,
            restingButterflies: Phaser.GameObjects.Image[]
          ) {
            sounds.playFlutter();

            // Rustle grass blades (wobble only, scale never exceeds 1.0)
            this.tweens.add({
              targets: grassContainer,
              angle: { from: -4, to: 4 },
              scaleX: 1.0,
              scaleY: 0.85,
              duration: 90,
              yoyo: true,
              repeat: 3,
            });

            // Hide resting butterflies
            restingButterflies.forEach((bf) => bf.setVisible(false));

            // Swarm of vibrant butterflies flying up and away into the sky
            const colors = [0xf97316, 0x38bdf8, 0xfacc15, 0xec4899, 0xa855f7, 0x22c55e];

            for (let i = 0; i < 11; i++) {
              const startX = gx + Phaser.Math.Between(-18, 18);
              const startY = gy + Phaser.Math.Between(-15, 5);

              const bf = this.add.image(startX, startY, 'butterfly');
              bf.setDisplaySize(24, 24);
              bf.setTint(colors[i % colors.length]);
              bf.setDepth(60);

              // Fast wing flapping
              this.tweens.add({
                targets: bf,
                scaleX: { from: 0.85, to: -0.85 },
                duration: 65,
                yoyo: true,
                repeat: -1,
              });

              // Upward & away flight trajectory
              const targetX = gx + Phaser.Math.Between(-180, 180);
              const targetY = -70; // ascends into the open sky

              this.tweens.add({
                targets: bf,
                x: targetX,
                y: targetY,
                duration: Phaser.Math.Between(1800, 2600),
                ease: 'Sine.easeOut',
                onComplete: () => {
                  bf.destroy();
                },
              });
            }
          }

          private respawnRestingButterflies(patch: {
            container: Phaser.GameObjects.Container;
            restingButterflies: Phaser.GameObjects.Image[];
          }) {
            patch.restingButterflies.forEach((bf) => {
              bf.setVisible(true);
              bf.setAlpha(0);
              this.tweens.add({
                targets: bf,
                alpha: 1,
                duration: 800,
              });
            });
          }

          // 4. 🌵 DESERT EASTER EGG: Cacti that wave (two arms; one arm moves as if waving)
          private spawnDesertEasterEggs() {
            const w = this.canvasW;

            const cactusPositions = [
              { x: w / 2 - 250, y: 240, scale: 1.0 },
              { x: w / 2 + 250, y: 480, scale: 1.05 },
              { x: w / 2 - 320, y: 500, scale: 0.95 },
            ];

            cactusPositions.forEach((pos) => {
              const cContainer = this.add.container(pos.x, pos.y);
              cContainer.setDepth(20);
              cContainer.setScale(pos.scale);

              const shadow = this.add.ellipse(0, 36, 56, 18, 0x000000, 0.35);

              // Trunk with stationary left arm
              const trunk = this.add.image(0, 0, 'cactus_trunk');
              trunk.setDisplaySize(76, 76);

              // Right arm that waves back and forth
              const arm = this.add.image(16, -2, 'cactus_arm');
              arm.setDisplaySize(54, 54);
              arm.setOrigin(0.25, 0.8);

              // Friendly waving animation
              const waveTween = this.tweens.add({
                targets: arm,
                angle: { from: -16, to: 32 },
                duration: 520,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
              });

              cContainer.add([shadow, trunk, arm]);

              const onCactusClick = (pointer: Phaser.Input.Pointer) => {
                pointer.event?.stopPropagation?.();
                this.ignorePathClickUntil = this.time.now + 200;
                sounds.playClick();

                waveTween.setTimeScale(2.5);
                this.time.delayedCall(1600, () => waveTween.setTimeScale(1.0));

                this.spawnFloatingBubble(pos.x, pos.y - 48, '🌵 👋 Howdy!');
              };

              // Clickable & glows on hover
              this.makeClickableAndGlow(trunk, onCactusClick, { parentContainer: cContainer, glowRadius: 85 });
              this.makeClickableAndGlow(arm, onCactusClick, { parentContainer: cContainer, glowRadius: 65 });

              this.easterEggsContainer.add(cContainer);
            });

            this.createVintageWoodenSign(
              w / 2 - 250,
              165,
              '🌵 WAVING SAGUARO',
              'Two arms • Tap to say Howdy!',
              210,
              32,
              '#fed7aa',
              () => {
                this.spawnFloatingBubble(w / 2 - 250, 240 - 48, '🌵 👋 Howdy!');
                sounds.playClick();
              },
              'none'
            );
          }

          // 5. 🐠 REEF EASTER EGG: Nemo swimming around his sea anemone
          private spawnReefEasterEggs() {
            const w = this.canvasW;

            const nemoX = w / 2 + 250;
            const nemoY = 270;

            // Sea anemone cluster on the coral seabed
            const anemoneContainer = this.add.container(nemoX, nemoY + 45);
            anemoneContainer.setDepth(16);

            const shadow = this.add.ellipse(0, 18, 54, 16, 0x000000, 0.35);
            anemoneContainer.add(shadow);

            const tentacleColors = [0xf472b6, 0xa855f7, 0xec4899, 0x38bdf8];
            for (let i = -4; i <= 4; i++) {
              const tentacle = this.add.ellipse(
                i * 6,
                -10 + Math.abs(i) * 2,
                8,
                28,
                tentacleColors[(i + 4) % tentacleColors.length]
              );
              this.tweens.add({
                targets: tentacle,
                angle: { from: -14, to: 14 },
                duration: 1100 + i * 100,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
              });
              anemoneContainer.add(tentacle);
            }
            this.easterEggsContainer.add(anemoneContainer);

            // Nemo clownfish sprite
            const nemoContainer = this.add.container(nemoX, nemoY);
            nemoContainer.setDepth(25);

            const nemoSprite = this.add.image(0, 0, 'nemo');
            nemoSprite.setDisplaySize(54, 54);
            nemoSprite.setOrigin(0.5, 0.5);

            nemoContainer.add(nemoSprite);
            this.easterEggsContainer.add(nemoContainer);

            const nemoData = {
              container: nemoContainer,
              sprite: nemoSprite,
              baseX: nemoX,
              baseY: nemoY,
              isSpinning: false,
            };
            this.nemoObj = nemoData;

            // Clickable & glows on hover
            this.makeClickableAndGlow(nemoSprite, (pointer: Phaser.Input.Pointer) => {
              pointer.event?.stopPropagation?.();
              this.ignorePathClickUntil = this.time.now + 200;
              this.triggerNemoLoop(nemoData);
            }, { parentContainer: nemoContainer, glowRadius: 75 });

            this.createVintageWoodenSign(
              nemoX,
              nemoY - 50,
              "🐠 NEMO'S ANEMONE",
              'Tap Nemo to do a spin loop!',
              200,
              32,
              '#67e8f9',
              () => {
                if (this.nemoObj) {
                  this.triggerNemoLoop(this.nemoObj);
                }
              },
              'none'
            );
          }

          // 6. 🌊 LAKE EASTER EGGS: Nemo swimming in freshwater & lakeside butterflies
          private spawnLakeEasterEggs() {
            const w = this.canvasW;

            // 1. 🐠 Nemo swimming in Lake waters
            const nemoX = w / 2 + 250;
            const nemoY = 270;

            const anemoneContainer = this.add.container(nemoX, nemoY + 45);
            anemoneContainer.setDepth(16);

            const shadow = this.add.ellipse(0, 18, 54, 16, 0x000000, 0.35);
            anemoneContainer.add(shadow);

            const tentacleColors = [0x38bdf8, 0x0284c7, 0x7dd3fc, 0xbae6fd];
            for (let i = -4; i <= 4; i++) {
              const tentacle = this.add.ellipse(
                i * 6,
                -10 + Math.abs(i) * 2,
                8,
                28,
                tentacleColors[(i + 4) % tentacleColors.length]
              );
              this.tweens.add({
                targets: tentacle,
                angle: { from: -14, to: 14 },
                duration: 1100 + i * 100,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
              });
              anemoneContainer.add(tentacle);
            }
            this.easterEggsContainer.add(anemoneContainer);

            const nemoContainer = this.add.container(nemoX, nemoY);
            nemoContainer.setDepth(25);

            const nemoSprite = this.add.image(0, 0, 'nemo');
            nemoSprite.setDisplaySize(54, 54);
            nemoSprite.setOrigin(0.5, 0.5);

            nemoContainer.add(nemoSprite);
            this.easterEggsContainer.add(nemoContainer);

            const nemoData = {
              container: nemoContainer,
              sprite: nemoSprite,
              baseX: nemoX,
              baseY: nemoY,
              isSpinning: false,
            };
            this.nemoObj = nemoData;

            // Clickable & glows on hover
            this.makeClickableAndGlow(nemoSprite, (pointer: Phaser.Input.Pointer) => {
              pointer.event?.stopPropagation?.();
              this.ignorePathClickUntil = this.time.now + 200;
              this.triggerNemoLoop(nemoData);
            }, { parentContainer: nemoContainer, glowRadius: 75 });

            this.createVintageWoodenSign(
              nemoX,
              nemoY - 50,
              "🐠 NEMO'S LAGOON",
              'Tap to do a spin loop!',
              190,
              32,
              '#38bdf8',
              () => {
                if (this.nemoObj) {
                  this.triggerNemoLoop(this.nemoObj);
                }
              },
              'none'
            );

            // 2. 🪷 Floating Water Lilies with Butterflies resting on them (w / 2 - 250, 375)
            const gx = w / 2 - 250;
            const gy = 375;

            const lilyContainer = this.add.container(gx, gy);
            lilyContainer.setDepth(18);

            const waterGlow = this.add.ellipse(0, 6, 74, 38, 0x0284c7, 0.4);
            const pad1 = this.add.ellipse(-14, 4, 40, 24, 0x0f766e);
            const pad2 = this.add.ellipse(14, 6, 36, 22, 0x115e59);
            const lotus1 = this.add.star(-14, 4, 5, 4, 9, 0xf472b6);
            const lotusCenter1 = this.add.circle(-14, 4, 3, 0xfef08a);
            const lotus2 = this.add.star(14, 6, 5, 3, 7, 0xffffff);
            const lotusCenter2 = this.add.circle(14, 6, 2.5, 0xfde047);

            lilyContainer.add([waterGlow, pad1, pad2, lotus1, lotusCenter1, lotus2, lotusCenter2]);

            const restingButterflies: Phaser.GameObjects.Image[] = [];
            const restingOffsets = [
              { x: -14, y: -16, tint: 0x38bdf8 },
              { x: 12, y: -20, tint: 0x0284c7 },
              { x: 0, y: -26, tint: 0xfacc15 },
            ];

            restingOffsets.forEach((off) => {
              const bf = this.add.image(off.x, off.y, 'butterfly');
              bf.setDisplaySize(20, 20);
              bf.setTint(off.tint);
              this.tweens.add({
                targets: bf,
                scaleX: 0.6,
                duration: Phaser.Math.Between(350, 600),
                yoyo: true,
                repeat: -1,
              });
              lilyContainer.add(bf);
              restingButterflies.push(bf);
            });

            this.easterEggsContainer.add(lilyContainer);

            this.grasslandsGrassPatch = {
              x: gx,
              y: gy,
              container: lilyContainer,
              restingButterflies,
              triggered: false,
              readyAt: 0,
            };

            // Clickable & glows on hover
            this.makeClickableAndGlow(pad1, (pointer: Phaser.Input.Pointer) => {
              pointer.event?.stopPropagation?.();
              this.ignorePathClickUntil = this.time.now + 250;
              this.walkPlayerTo(gx, gy);
            }, { parentContainer: lilyContainer, glowRadius: 85 });

            this.createVintageWoodenSign(
              gx,
              gy - 48,
              '🪷 FLOATING WATER LILIES',
              'Skim across the lilies!',
              200,
              32,
              '#bae6fd',
              () => {
                this.walkPlayerTo(gx, gy);
              },
              'none'
            );
          }

          private triggerNemoLoop(nemoData: {
            container: Phaser.GameObjects.Container;
            sprite: Phaser.GameObjects.Image;
            baseX: number;
            baseY: number;
            isSpinning: boolean;
          }) {
            if (nemoData.isSpinning) return;
            nemoData.isSpinning = true;
            sounds.playBubble();

            // Burst bubbles
            for (let i = 0; i < 6; i++) {
              this.spawnReefBubble(
                nemoData.container.x + Phaser.Math.Between(-15, 15),
                nemoData.container.y + Phaser.Math.Between(-10, 10)
              );
            }

            // 360 loop-de-loop spin (scale never exceeds 1.0)
            this.tweens.add({
              targets: nemoData.sprite,
              angle: 360,
              scaleX: 1.0,
              scaleY: 1.0,
              duration: 650,
              ease: 'Cubic.easeInOut',
              onComplete: () => {
                nemoData.sprite.angle = 0;
                nemoData.sprite.setScale(1);
                nemoData.isSpinning = false;
              },
            });

            this.spawnFloatingBubble(
              nemoData.container.x,
              nemoData.container.y - 36,
              'Nemo! 🐠 "Just keep swimming!"'
            );
          }

          private spawnReefBubble(x: number, y: number) {
            const bubble = this.add.circle(x, y, Phaser.Math.Between(3, 6), 0xbae6fd, 0.85)
              .setStrokeStyle(1, 0xffffff, 0.9);
            bubble.setDepth(55);

            this.tweens.add({
              targets: bubble,
              y: y - Phaser.Math.Between(50, 90),
              x: x + Phaser.Math.Between(-12, 12),
              alpha: 0,
              duration: Phaser.Math.Between(900, 1500),
              ease: 'Sine.easeOut',
              onComplete: () => bubble.destroy(),
            });
          }

          private spawnFloatingBubble(x: number, y: number, text: string) {
            const font = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            const bubbleCont = this.add.container(x, y);
            bubbleCont.setDepth(60);

            const label = this.add.text(0, 0, text, {
              fontSize: '11px',
              fontStyle: 'bold',
              fontFamily: font,
              color: '#ffffff',
              stroke: '#1c0d02',
              strokeThickness: 2.5,
            }).setOrigin(0.5);

            const padW = label.width + 16;
            const padH = label.height + 8;
            const bg = this.add.rectangle(0, 0, padW, padH, 0x1c1917, 0.85)
              .setStrokeStyle(1.5, 0xfbbf24, 0.9);

            bubbleCont.add([bg, label]);

            this.tweens.add({
              targets: bubbleCont,
              y: y - 26,
              alpha: 0,
              delay: 800,
              duration: 800,
              ease: 'Quad.easeOut',
              onComplete: () => bubbleCont.destroy(),
            });
          }

          update(time: number, delta: number) {
            if (this.isTransitioning) return;

            let vx = 0;
            let vy = 0;

            // 1. Navigation uses ARROW KEYS ONLY
            const isArrowDown =
              this.cursors &&
              (this.cursors.left?.isDown ||
                this.cursors.right?.isDown ||
                this.cursors.up?.isDown ||
                this.cursors.down?.isDown);

            if (isArrowDown) {
              // Arrow keys immediately override click waypoints
              this.currentPathWaypoints = [];
              this.moveTarget = null;

              if (this.cursors.left?.isDown) vx -= 1;
              if (this.cursors.right?.isDown) vx += 1;
              if (this.cursors.up?.isDown) vy -= 1;
              if (this.cursors.down?.isDown) vy += 1;
            } else if (this.currentPathWaypoints.length > 0) {
              // 2. Multi-turn Waypoint navigation
              const target = this.currentPathWaypoints[0];
              const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y);

              if (dist <= 12) {
                this.currentPathWaypoints.shift();
                if (this.currentPathWaypoints.length > 0) {
                  const nextTarget = this.currentPathWaypoints[0];
                  const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nextTarget.x, nextTarget.y);
                  vx = Math.cos(angle);
                  vy = Math.sin(angle);
                } else {
                  this.moveTarget = null;
                }
              } else {
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
                vx = Math.cos(angle);
                vy = Math.sin(angle);
              }
            }

            const dt = delta ? Math.min(delta / 1000, 0.04) : 0.016;
            const closestNow = this.getClosestPointOnWalkablePath(this.player.x, this.player.y);
            const currentDistFromPath = Phaser.Math.Distance.Between(
              this.player.x,
              this.player.y,
              closestNow.x,
              closestNow.y
            );

            // Check if sprite is on Tundra Glacial Ice Patch
            const isOnIce =
              this.currentRoomId === 'tundra' &&
              this.tundraIcePatch &&
              this.tundraIcePatch.contains(this.player.x, this.player.y);

            this.isSlidingOnIce = !!isOnIce;
            const currentSpeed = isOnIce ? 460 : this.speed;

            // Path constraint check & Anti-stuck recovery
            if (vx !== 0 || vy !== 0) {
              // Mirror farmer icon so it always faces forward into motion
              if (vx > 0.05) {
                if (this.playerSprite) this.playerSprite.setFlipX(true);
              } else if (vx < -0.05) {
                if (this.playerSprite) this.playerSprite.setFlipX(false);
              }

              const len = Math.sqrt(vx * vx + vy * vy);
              const nvx = vx / len;
              const nvy = vy / len;
              const step = currentSpeed * dt;

              const nextX = this.player.x + nvx * step;
              const nextY = this.player.y + nvy * step;

              const canMoveBoth = this.isPointOnWalkablePath(nextX, nextY, 4);
              const canMoveX = this.isPointOnWalkablePath(nextX, this.player.y, 4);
              const canMoveY = this.isPointOnWalkablePath(this.player.x, nextY, 4);

              if (canMoveBoth) {
                this.playerBody.setVelocity(nvx * currentSpeed, nvy * currentSpeed);
              } else if (canMoveX && !canMoveY) {
                this.playerBody.setVelocity(nvx * currentSpeed, 0);
              } else if (canMoveY && !canMoveX) {
                this.playerBody.setVelocity(0, nvy * currentSpeed);
              } else {
                // If moving toward path when slightly off-path, allow movement that decreases distance
                const nextClosest = this.getClosestPointOnWalkablePath(nextX, nextY);
                const nextDist = Phaser.Math.Distance.Between(
                  nextX,
                  nextY,
                  nextClosest.x,
                  nextClosest.y
                );

                if (nextDist < currentDistFromPath) {
                  this.playerBody.setVelocity(nvx * currentSpeed, nvy * currentSpeed);
                } else {
                  this.playerBody.setVelocity(0, 0);
                  if (this.currentPathWaypoints.length > 0) {
                    this.currentPathWaypoints.shift();
                  }
                }
              }

              if (isOnIce) {
                // Ice skating posture: tilt slightly and spray frost sparks
                if (this.playerSprite) {
                  this.playerSprite.angle = nvx >= 0 ? 8 : -8;
                }
                this.spawnIceGliderParticles(this.player.x, this.player.y);
                if (time >= this.lastIceSlideSoundTime) {
                  sounds.playIceSlide();
                  this.lastIceSlideSoundTime = time + 260;
                }
              } else {
                if (this.playerSprite) {
                  this.playerSprite.angle = Math.sin(time * 0.015) * 5;
                }
                // Spawn footprints while walking (fading after 3 seconds)
                const movedDist = Phaser.Math.Distance.Between(
                  this.player.x,
                  this.player.y,
                  this.lastFootprintPos.x,
                  this.lastFootprintPos.y
                );
                if (movedDist >= this.FOOTSTEP_DISTANCE) {
                  this.spawnFootprint();
                  this.lastFootprintPos = { x: this.player.x, y: this.player.y };
                }
              }
            } else {
              this.playerBody.setVelocity(0, 0);
              if (this.playerSprite && !this.mushroomJumpTween) {
                this.playerSprite.angle = 0;
              }
            }

            // Step sounds for when avatar is moving around on the map (suppressed while sliding on ice)
            const isMoving =
              this.playerBody &&
              (Math.abs(this.playerBody.velocity.x) > 10 || Math.abs(this.playerBody.velocity.y) > 10);

            if (isMoving) {
              if (!isOnIce && time >= this.nextStepTime) {
                sounds.playStep(this.currentRoomId);
                this.nextStepTime = time + this.stepInterval;
              }
            } else {
              // Reset so footsteps trigger promptly when walking starts again
              this.nextStepTime = Math.min(this.nextStepTime, time + 40);
            }

            // ===============================================================
            // ❄️ TUNDRA COLD BREATH: Farmer exhales visible frosty breath in the freezing arctic
            // ===============================================================
            if (this.currentRoomId === 'tundra' && this.player && this.playerSprite) {
              if (time >= this.nextFarmerBreathTime) {
                this.spawnFarmerBreath();
                this.nextFarmerBreathTime = time + Phaser.Math.Between(1800, 2400);
              }
            }

            // ===============================================================
            // 🍄 FOREST MUSHROOM BOUNCING EASTER EGG (NOT ON FARM)
            // If sprite gets on top of mushroom, start jumping up and down
            // ===============================================================
            if (this.currentRoomId === 'forest' && this.mushroomObj) {
              const distToMushroom = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                this.mushroomObj.x,
                this.mushroomObj.y
              );

              if (distToMushroom < 28) {
                if (!this.mushroomJumpTween) {
                  sounds.playBoing();
                  const mSprite = this.mushroomObj.getByName('mushroom_sprite') as Phaser.GameObjects.Image;
                  if (mSprite) {
                    // Squash/stretch peaks at ~100px wide (half the previous 200px max)
                    const maxBounceScale = 100 / mSprite.width;
                    this.tweens.add({
                      targets: mSprite,
                      scaleX: maxBounceScale,
                      scaleY: maxBounceScale * 0.8,
                      duration: 110,
                      yoyo: true,
                      ease: 'Sine.easeInOut',
                    });
                  }
                  this.mushroomJumpTween = this.tweens.add({
                    targets: this.playerSprite,
                    y: -44,
                    duration: 220,
                    yoyo: true,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                      this.mushroomJumpTween = null;
                    },
                  });
                  this.spawnMushroomSporeParticles(this.mushroomObj.x, this.mushroomObj.y);
                }
              } else if (!this.mushroomJumpTween && this.playerSprite && this.playerSprite.y !== 0) {
                this.playerSprite.y = 0;
              }
            }

            // ===============================================================
            // 🦋 GRASSLANDS & LAKE BUTTERFLY PATCH EASTER EGG (NOT ON FARM)
            // When sprite walks through grass, butterflies fly up and away
            // ===============================================================
            if ((this.currentRoomId === 'grasslands' || this.currentRoomId === 'lake') && this.grasslandsGrassPatch) {
              const patch = this.grasslandsGrassPatch;
              const distToPatch = Phaser.Math.Distance.Between(this.player.x, this.player.y, patch.x, patch.y);

              if (distToPatch < 42 && !patch.triggered) {
                patch.triggered = true;
                patch.readyAt = time + 7500;
                this.triggerButterflySwarm(patch.x, patch.y, patch.container, patch.restingButterflies);
              } else if (patch.triggered && time > patch.readyAt && distToPatch > 90) {
                patch.triggered = false;
                this.respawnRestingButterflies(patch);
              }
            }

            // ===============================================================
            // 🐠 REEF & LAKE NEMO SWIMMING EASTER EGG
            // ===============================================================
            if ((this.currentRoomId === 'reefs' || this.currentRoomId === 'lake') && this.nemoObj) {
              const nemo = this.nemoObj;
              if (!nemo.isSpinning) {
                const t = time * 0.0016;
                nemo.container.x = nemo.baseX + Math.sin(t) * 44;
                nemo.container.y = nemo.baseY + Math.sin(t * 2) * 16;
                nemo.sprite.flipX = Math.cos(t) > 0;
                nemo.sprite.angle = Math.sin(time * 0.012) * 6;
              }
              if (time >= this.nextNemoBubbleTime) {
                this.spawnReefBubble(nemo.container.x, nemo.container.y - 10);
                this.nextNemoBubbleTime = time + Phaser.Math.Between(800, 1600);
              }
            }

            // ===============================================================
            // OPPOSITE-SIDE SCREEN EDGE TRANSITIONS
            // "If a user exits a page, make them enter the new page on the opposite side"
            // Guarded by transitionCooldownUntil so players can never instantly re-trigger!
            // ===============================================================
            if (time > this.transitionCooldownUntil) {
              const w = this.canvasW;
              const h = this.canvasH;
              if (this.currentRoomId === 'clearing') {
                if (this.player.x <= 28) {
                  stateRef.current.setCurrentBiome('lake');
                  return;
                }
                if (this.player.x >= w - 28) {
                  stateRef.current.setCurrentBiome('grasslands');
                  return;
                }
                if (this.player.y <= 28 && this.player.x < 450) {
                  stateRef.current.setCurrentBiome('forest');
                  return;
                }
                if (this.player.y <= 28 && this.player.x >= 450) {
                  stateRef.current.setCurrentBiome('tundra');
                  return;
                }
                if (this.player.y >= h - 28 && this.player.x < w - 450) {
                  stateRef.current.setCurrentBiome('reefs');
                  return;
                }
                if (this.player.y >= h - 28 && this.player.x >= w - 450) {
                  stateRef.current.setCurrentBiome('desert');
                  return;
                }
              } else {
                if (this.currentRoomId === 'lake' && this.player.x >= w - 28) {
                  stateRef.current.setCurrentBiome('clearing');
                  return;
                }
                if (this.currentRoomId === 'grasslands' && this.player.x <= 28) {
                  stateRef.current.setCurrentBiome('clearing');
                  return;
                }
                if (
                  (this.currentRoomId === 'forest' || this.currentRoomId === 'tundra') &&
                  this.player.y >= h - 28
                ) {
                  stateRef.current.setCurrentBiome('clearing');
                  return;
                }
                if (
                  (this.currentRoomId === 'reefs' || this.currentRoomId === 'desert') &&
                  this.player.y <= 28
                ) {
                  stateRef.current.setCurrentBiome('clearing');
                  return;
                }
              }
            }

            // Proximity to hotspots for interactive prompt display
            let nearest: Hotspot | null = null;
            let minDistance = 75;

            for (const hs of this.currentHotspots) {
              const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, hs.x, hs.y);
              if (dist < minDistance) {
                minDistance = dist;
                nearest = hs;
              }
            }

            this.nearbyHotspot = nearest;

            if (nearest?.id !== stateRef.current.activeHotspotId) {
              stateRef.current.activeHotspotId = nearest?.id || null;
            }
          }

          // Spawn cute little footprints that fade away after 3 seconds
          private spawnFootprint() {
            if (this.isTransitioning) return;

            const moveAngle = Phaser.Math.Angle.Between(
              this.lastFootprintPos.x,
              this.lastFootprintPos.y,
              this.player.x,
              this.player.y
            );

            // Alternate left and right foot offset slightly perpendicular to movement vector
            const sideOffset = this.footstepToggle ? 5 : -5;
            this.footstepToggle = !this.footstepToggle;

            const perpAngle = moveAngle + Math.PI / 2;
            const fx = this.player.x + Math.cos(perpAngle) * sideOffset;
            const fy = this.player.y + Math.sin(perpAngle) * sideOffset;

            // Footprints are gray until a biome is healed
            const currentRestorationVal = (this.restorationData?.[this.currentRoomId] ?? stateRef.current.restoration?.[this.currentRoomId] ?? 0);
            const isCurrentQuestCompleted = Boolean(stateRef.current.quests?.some((q: any) => q.biome === this.currentRoomId && q.completed));
            const isCurrentBiomeHealed = currentRestorationVal > 0 || isCurrentQuestCompleted;

            const hasHealedAnyBiome =
              Object.values(this.restorationData ?? stateRef.current.restoration ?? {}).some((val: any) => Number(val) > 0) ||
              Boolean(stateRef.current.quests?.some((q: any) => q.completed));

            const isHealed = this.currentRoomId === 'clearing'
              ? (isCurrentBiomeHealed || hasHealedAnyBiome)
              : isCurrentBiomeHealed;

            let printColor = 0x808080; // neutral gray until a biome is healed
            let printAlpha = 0.85;
            let strokeColor = 0x404040; // dark gray outline

            if (isHealed) {
              printColor = 0x241105; // rich dark loam boot print
              printAlpha = 0.85;
              strokeColor = 0x140702;

              if (this.currentRoomId === 'tundra') {
                printColor = 0x1d4ed8; // crisp snow blue indentation
                printAlpha = 0.8;
                strokeColor = 0x1e3a8a;
              } else if (this.currentRoomId === 'lake' || this.currentRoomId === 'reefs') {
                printColor = 0x0369a1; // wet splash water print
                printAlpha = 0.85;
                strokeColor = 0x075985;
              } else if (this.currentRoomId === 'desert') {
                printColor = 0x78350f; // deep sand tread
                printAlpha = 0.85;
                strokeColor = 0x451a03;
              } else if (this.currentRoomId === 'forest') {
                printColor = 0x1c1917; // rich woodland humus
                printAlpha = 0.85;
                strokeColor = 0x0c0a09;
              } else if (this.currentRoomId === 'grasslands') {
                printColor = 0x271908; // deep topsoil
                printAlpha = 0.85;
                strokeColor = 0x140b03;
              }
            }

            const foot = this.add.container(fx, fy);
            foot.setRotation(moveAngle);

            // Detailed boot print: Front sole + Back heel with subtle crisp edge
            const sole = this.add.ellipse(3, 0, 9, 6, printColor, printAlpha).setStrokeStyle(1, strokeColor, 0.4);
            const heel = this.add.ellipse(-3.5, 0, 5, 4.5, printColor, printAlpha * 0.95).setStrokeStyle(1, strokeColor, 0.4);

            foot.add([sole, heel]);
            this.footprintsContainer.add(foot);

            // Dynamic footstep ripples & splashes in water biomes
            if (this.currentRoomId === 'lake' || this.currentRoomId === 'reefs') {
              const waterRipple = this.add.ellipse(fx, fy, 14, 8, 0x38bdf8, 0);
              waterRipple.setStrokeStyle(1.5, 0x7dd3fc, 0.85);
              this.footprintsContainer.add(waterRipple);
              this.tweens.add({
                targets: waterRipple,
                scaleX: 2.8,
                scaleY: 2.2,
                alpha: 0,
                duration: 650,
                ease: 'Sine.easeOut',
                onComplete: () => waterRipple.destroy(),
              });

              for (let i = 0; i < 3; i++) {
                const splashDrop = this.add.circle(
                  fx + Phaser.Math.Between(-8, 8),
                  fy + Phaser.Math.Between(-4, 4),
                  Phaser.Math.Between(1.5, 2.5),
                  0xe0f2fe,
                  0.85
                );
                this.footprintsContainer.add(splashDrop);
                this.tweens.add({
                  targets: splashDrop,
                  y: splashDrop.y - Phaser.Math.Between(6, 14),
                  alpha: 0,
                  duration: 350,
                  ease: 'Quad.easeOut',
                  onComplete: () => splashDrop.destroy(),
                });
              }
            }

            // Footprint: fully visible for 0.5s, then smoothly fades out over 1.8s
            this.tweens.add({
              targets: foot,
              alpha: 0,
              delay: 500,
              duration: 1800,
              ease: 'Quad.easeOut',
              onComplete: () => {
                foot.destroy();
              },
            });
          }
        }

        const initialW = containerRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1400);
        const initialH = containerRef.current?.clientHeight || 750;
        const gameH = 750;
        const gameW = Math.max(1400, Math.round(gameH * (initialW / (initialH || 1))));

        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          parent: containerRef.current,
          width: gameW,
          height: gameH,
          backgroundColor: '#1b4332',
          render: {
            antialias: true,
            antialiasGL: true,
            roundPixels: true,
          },
          physics: {
            default: 'arcade',
            arcade: { gravity: { x: 0, y: 0 }, debug: false },
          },
          scene: [GardenscapesWorldScene],
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
        };

        if (isMounted) {
          phaserGameRef.current = new Phaser.Game(config);
        }

        const handleResize = () => {
          if (!containerRef.current || !phaserGameRef.current) return;
          const newW = containerRef.current.clientWidth || window.innerWidth || 1400;
          const newH = containerRef.current.clientHeight || 750;
          const calculatedW = Math.max(1400, Math.round(750 * (newW / (newH || 1))));
          phaserGameRef.current.scale.resize(calculatedW, 750);
          const scene = phaserGameRef.current.scene.getScene('GardenscapesWorldScene') as GardenscapesWorldScene;
          if (scene && typeof scene.rebuildCurrentRoom === 'function') {
            scene.canvasW = calculatedW;
            scene.cameras.main.setBounds(0, 0, calculatedW, 750);
            scene.physics.world.setBounds(0, 0, calculatedW, 750);
            scene.rebuildCurrentRoom();
            if ((scene as any).player) {
              scene.cameras.main.centerOn((scene as any).player.x, (scene as any).player.y);
            }
          }
        };
        window.addEventListener('resize', handleResize);
      }
    }

    initPhaser();

    return () => {
      isMounted = false;
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden select-none bg-[#1c1917] flex items-center justify-center font-pixel">
      {/* HTML5 Canvas Stretching Edge-to-Edge Horizontally across the entire screen without beige borders */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden border-y-4 border-[#3e1a06] bg-[#1c1917] shadow-inner [&>canvas]:!w-full [&>canvas]:!h-full [&>canvas]:!object-cover [&>canvas]:![image-rendering:auto]"
        style={{ cursor: "url('/assets/sprout_cursor.svg') 2 4, auto" }}
      />

      {/* Return to Central Farm Sign (When in biomes) */}
      {currentBiome !== 'clearing' && (
        <div className="absolute top-3 left-3 z-30 animate-in fade-in">
          <button
            onClick={() => { sounds.playClick(); setCurrentBiome('clearing'); }}
            className="pixel-btn flex items-center gap-2 px-3.5 py-2 text-[11px] font-bold shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-[#fde68a]" />
            <span>RETURN TO FARM</span>
          </button>
        </div>
      )}

      {/* Retro Zoom Controls Overlay */}
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1 pixel-panel p-1 shadow-lg bg-[#fef3c7]/95 border-2 border-[#5c2c16]">
        <button
          type="button"
          onClick={() => handleZoomChange(-0.2)}
          className="w-6 h-6 flex items-center justify-center font-bold text-xs bg-[#fde68a] hover:bg-[#fcd34d] active:scale-95 border border-[#b45309] text-[#78350f] transition-all"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          −
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          className="px-1.5 h-6 flex items-center justify-center font-bold text-[9px] bg-[#fffbeb] hover:bg-[#fef3c7] border border-[#ca8a04] text-[#854d0e] transition-all"
          title="Reset to default zoomed-in view (160%)"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <button
          type="button"
          onClick={() => handleZoomChange(0.2)}
          className="w-6 h-6 flex items-center justify-center font-bold text-xs bg-[#fde68a] hover:bg-[#fcd34d] active:scale-95 border border-[#b45309] text-[#78350f] transition-all"
          title="Zoom In"
          aria-label="Zoom In"
        >
          +
        </button>
      </div>
    </div>
  );
}
