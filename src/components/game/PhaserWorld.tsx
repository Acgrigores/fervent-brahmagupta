'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { BiomeId, AnimalId } from '@/types/game';
import { ANIMALS } from '@/data/animals';
import { sounds } from '@/utils/soundEffects';
import { Footprints, ArrowLeft } from 'lucide-react';

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
    openDialogue,
    openQuestModal,
  } = useGameState();

  const [activeNearbyHotspot, setActiveNearbyHotspot] = useState<Hotspot | null>(null);

  const stateRef = useRef({
    currentBiome,
    restoration,
    openDialogue,
    setCurrentBiome,
    openQuestModal,
    activeHotspotId: null as string | null,
  });

  useEffect(() => {
    stateRef.current = {
      ...stateRef.current,
      currentBiome,
      restoration,
      openDialogue,
      setCurrentBiome,
      openQuestModal,
    };
  }, [currentBiome, restoration, openDialogue, setCurrentBiome, openQuestModal]);

  // Sync React room state changes into Phaser scene
  useEffect(() => {
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('GardenscapesWorldScene');
      if (scene && typeof scene.changeRoom === 'function') {
        scene.changeRoom(currentBiome);
      }
    }
  }, [currentBiome]);

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
          public currentRoomId: BiomeId = 'clearing';
          private worldContainer!: Phaser.GameObjects.Container;
          private pathPolygons: Phaser.Geom.Rectangle[] = [];
          private currentHotspots: Hotspot[] = [];
          private nearbyHotspot: Hotspot | null = null;
          private isTransitioning: boolean = false;
          private speed: number = 290;
          private canvasW: number = 1000;
          private canvasH: number = 750;

          constructor() {
            super({ key: 'GardenscapesWorldScene' });
          }

          preload() {
            // Detailed grass backgrounds
            this.load.image('grass_flourish', '/assets/grass_flourish.png');
            this.load.image('grass_dead', '/assets/grass_dead.png');

            // Sprites & generated images
            this.load.image('farmer', '/assets/sprites/farmer.png');
            this.load.image('house', '/assets/sprites/house.png');
            this.load.image('barn', '/assets/sprites/barn.png');
            this.load.image('trees', '/assets/sprites/trees.png');
            this.load.image('crop_dead', '/assets/crops/crop_dead.png');
            this.load.image('crop_flourish', '/assets/crops/crop_flourish.png');

            // Animals
            this.load.image('manatee', '/assets/sprites/manatee.png');
            this.load.image('red_panda', '/assets/sprites/red_panda.png');
            this.load.image('polar_bear', '/assets/sprites/polar_bear.png');
            this.load.image('butterfly', '/assets/sprites/butterfly.png');
            this.load.image('cheetah', '/assets/sprites/cheetah.png');
            this.load.image('sea_turtle', '/assets/sprites/sea_turtle.png');

            // Biome Paths
            this.load.image('path_farm', '/assets/paths/path_farm.png');
            this.load.image('path_lake', '/assets/paths/path_lake.png');
            this.load.image('path_forest', '/assets/paths/path_forest.png');
            this.load.image('path_tundra', '/assets/paths/path_tundra.png');
            this.load.image('path_grasslands', '/assets/paths/path_grasslands.png');
            this.load.image('path_desert', '/assets/paths/path_desert.png');
            this.load.image('path_reefs', '/assets/paths/path_reefs.png');
          }

          create() {
            this.canvasW = 1000;
            this.canvasH = 750;

            this.physics.world.setBounds(0, 0, this.canvasW, this.canvasH);
            this.cameras.main.setBounds(0, 0, this.canvasW, this.canvasH);

            this.worldContainer = this.add.container(0, 0);

            // Setup Arrow Keys ONLY for keyboard navigation (strictly NO spacebar capture so chat inputs work!)
            if (this.input.keyboard) {
              this.input.keyboard.clearCaptures();
              this.cursors = {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP, false),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN, false),
                left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT, false),
                right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT, false),
              };
            }

            // Click-to-move strictly on paths (No popups or alerts!)
            this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
              if (this.isTransitioning) return;

              if (this.isPointOnWalkablePath(pointer.x, pointer.y)) {
                this.moveTarget = { x: pointer.x, y: pointer.y };

                const ripple = this.add.circle(pointer.x, pointer.y, 8, 0xfbbf24, 0.9);
                this.tweens.add({
                  targets: ripple,
                  scale: 2.2,
                  alpha: 0,
                  duration: 300,
                  onComplete: () => ripple.destroy(),
                });
              }
            });

            // Create Farmer Avatar Sprite at central farm plaza
            this.createFarmerPlayer(500, 420);

            // Initial Room Build
            this.currentRoomId = stateRef.current.currentBiome;
            this.buildRoom(this.currentRoomId);
          }

          private createFarmerPlayer(x: number, y: number) {
            this.player = this.add.container(x, y);

            // Soft ground shadow
            const shadow = this.add.ellipse(0, 22, 32, 14, 0x000000, 0.35);

            // Farmer image sprite (No emojis!)
            this.playerSprite = this.add.image(0, 0, 'farmer');
            this.playerSprite.setDisplaySize(54, 54);
            this.playerSprite.setOrigin(0.5, 0.7);

            this.player.add([shadow, this.playerSprite]);
            this.physics.add.existing(this.player);

            this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
            this.playerBody.setCircle(16, -16, -6);
            this.playerBody.setCollideWorldBounds(true);
          }

          public changeRoom(biome: BiomeId) {
            if (biome === this.currentRoomId || this.isTransitioning) return;
            this.isTransitioning = true;
            sounds.playBloom();

            let executed = false;
            const finishTransition = () => {
              if (executed) return;
              executed = true;

              this.currentRoomId = biome;
              this.buildRoom(biome);

              if (biome === 'clearing') {
                this.teleportPlayer(500, 420);
              } else {
                this.teleportPlayer(500, 600);
              }

              this.cameras.main.fadeIn(150, 0, 0, 0);
              this.time.delayedCall(200, () => {
                this.isTransitioning = false;
              });
            };

            this.cameras.main.fadeOut(150, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, finishTransition);
            // Safety timeout
            this.time.delayedCall(220, finishTransition);
          }

          private teleportPlayer(x: number, y: number) {
            this.player.setPosition(x, y);
            if (this.playerBody) {
              this.playerBody.reset(x, y);
            }
            this.moveTarget = null;
          }

          private isPointOnWalkablePath(x: number, y: number): boolean {
            for (const poly of this.pathPolygons) {
              if (poly.contains(x, y)) {
                return true;
              }
            }
            return false;
          }

          private buildRoom(biome: BiomeId) {
            this.worldContainer.removeAll(true);
            this.pathPolygons = [];
            this.currentHotspots = [];
            this.nearbyHotspot = null;
            stateRef.current.activeHotspotId = null;
            setActiveNearbyHotspot(null);

            const isRestored = (stateRef.current.restoration[biome] || 0) >= 80;

            if (biome === 'clearing') {
              this.buildMaximalistFarmRoom();
            } else {
              this.buildMaximalistBiomeRoom(biome, isRestored);
            }
          }

          // ===============================================================
          // 🏡 CENTRAL BAYER FARM (DETAILED GRASS, CLEAN PATHS, ZERO INTERSECTIONS)
          // ===============================================================
          private buildMaximalistFarmRoom() {
            const w = this.canvasW;
            const h = this.canvasH;
            const isFarmRestored = (stateRef.current.restoration['clearing'] || 0) >= 80;

            // 1. Detailed Grass Background
            const grassKey = isFarmRestored ? 'grass_flourish' : 'grass_dead';
            const lawn = this.add.image(w / 2, h / 2, grassKey);
            lawn.setDisplaySize(w, h);
            this.worldContainer.add(lawn);

            // 2. Clean Walkable Dirt Path Network (Leading Completely OFFSCREEN, NO vertical lines/dark borders!)
            this.pathPolygons = [
              // Central Main Plaza
              new Phaser.Geom.Rectangle(430, 350, 140, 140),
              // Main Horizontal Dirt Highway leading completely offscreen West & East
              new Phaser.Geom.Rectangle(-60, 390, 1120, 60),
              // Main Vertical Dirt Avenue leading completely offscreen North & South
              new Phaser.Geom.Rectangle(470, -60, 60, 870),
              // West Access Lane leading up to Forest exit
              new Phaser.Geom.Rectangle(90, -60, 60, 500),
              // East Access Lane leading down to Desert exit
              new Phaser.Geom.Rectangle(850, 400, 60, 410),
            ];

            // Render Packed Dirt Paths with seamless overlap and ZERO dark border lines!
            this.renderBiomePaths('path_farm');

            // 3. Buildings & Orchard Grove
            // Farmhouse Cottage
            const house = this.add.image(240, 120, 'house');
            house.setDisplaySize(140, 140);
            this.worldContainer.add(house);

            // Single Clumped Orchard Grove (Trees clumped into one grove!)
            const orchardSoil = this.add.ellipse(360, 130, 150, 95, 0x543315, 0.4);
            const trees1 = this.add.image(320, 115, 'trees').setDisplaySize(95, 95);
            const trees2 = this.add.image(390, 110, 'trees').setDisplaySize(95, 95);
            const trees3 = this.add.image(355, 145, 'trees').setDisplaySize(100, 100);
            this.worldContainer.add([orchardSoil, trees1, trees2, trees3]);

            // Barn & Silo
            const barn = this.add.image(720, 120, 'barn');
            barn.setDisplaySize(150, 150);
            this.worldContainer.add(barn);

            // Swimming Pool in Southwest sector
            this.renderSwimmingPool(240, 580);

            // 4. Six Dedicated Crop Fields (All positioned on open lawn with ZERO path intersection!)
            // Lake Corn: in Northwest sector (y=290 is well above Highway y=390, and right of West lane x=150)
            this.renderFarmCropField(250, 290, 'lake', 'Golden Sweet Corn', 'Lake Water Polluted');
            // Forest Apples: in Northwest sector (y=290 is well above Highway y=390, and left of Avenue x=470)
            this.renderFarmCropField(380, 290, 'forest', 'Canopy Apple Orchard', 'Wildfire Smoke Blight');
            // Tundra Wheat: in Northeast sector (y=200 is well above Highway y=390, and right of Avenue x=530)
            this.renderFarmCropField(600, 200, 'tundra', 'Glacial Winter Wheat', 'Coal Soot Fallout');
            // Grasslands Sunflowers: in Northeast sector (y=290 is well above Highway y=390, and left of East lane x=850)
            this.renderFarmCropField(740, 290, 'grasslands', 'Giant Sunflowers', 'Pesticide & Topsoil Loss');
            // Reefs Tidal Rice: in Southwest sector (y=580 is well below Highway y=450, and left of Avenue x=470)
            this.renderFarmCropField(370, 580, 'reefs', 'Tidal Rice & Kelp', 'Boat Propellers & Oil');
            // Desert Melons: in Southeast sector (y=580 is well below Highway y=450, right of Avenue x=530, left of East lane x=850)
            this.renderFarmCropField(720, 580, 'desert', 'Sugar Melons', 'Aquifer Depleted');

            // 5. Directional Navigation Signs leading offscreen
            this.renderPathGateSigns();

            // 6. Farm Activity Station (Extinguish Wildfire Flare-ups)
            this.spawnBiomeQuestStation('clearing', isFarmRestored);
          }

          private renderBiomePaths(textureKey: string) {
            // Render tiled path texture with seamless overlap and ZERO border lines!
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

          private renderSwimmingPool(x: number, y: number) {
            const container = this.add.container(x, y);
            const patio = this.add.rectangle(0, 0, 110, 80, 0xd97706).setStrokeStyle(3, 0xb45309);
            const water = this.add.rectangle(0, 0, 94, 64, 0x06b6d4).setStrokeStyle(2, 0x38bdf8);
            const board = this.add.rectangle(35, 0, 24, 8, 0xffffff);

            container.add([patio, water, board]);
            this.worldContainer.add(container);
          }

          // CROP FIELD: Displays One Dead Picture or Flourishing Picture!
          private renderFarmCropField(
            x: number,
            y: number,
            biome: Exclude<BiomeId, 'clearing'>,
            cropName: string,
            crisisNotice: string
          ) {
            const isFlourished = (stateRef.current.restoration[biome] || 0) >= 80;
            const container = this.add.container(x, y);

            // Soft shadow
            const shadow = this.add.ellipse(0, 32, 95, 20, 0x000000, 0.35);

            // Real Image Sprite (No polygons, No intersection!)
            const textureKey = isFlourished ? 'crop_flourish' : 'crop_dead';
            const cropImage = this.add.image(0, 0, textureKey);
            cropImage.setDisplaySize(100, 100);

            // Status badge
            const badgeBg = this.add.rectangle(0, 44, 150, 20, 0x18181b, 0.95);
            badgeBg.setStrokeStyle(1.5, isFlourished ? 0x22c55e : 0xef4444);

            const badgeText = this.add.text(
              0,
              44,
              isFlourished ? `Flourishing: ${cropName}` : `${cropName} • ${crisisNotice}`,
              {
                fontSize: '8px',
                fontStyle: 'bold',
                fontFamily: 'system-ui',
                color: isFlourished ? '#86efac' : '#fca5a5',
              }
            ).setOrigin(0.5);

            container.add([shadow, cropImage, badgeBg, badgeText]);
            cropImage.setInteractive({ useHandCursor: true });
            cropImage.on('pointerdown', () => {
              sounds.playClick();
              stateRef.current.setCurrentBiome(biome);
            });

            this.worldContainer.add(container);

            this.currentHotspots.push({
              id: `crop_${biome}`,
              name: `${cropName} (${isFlourished ? 'Flourishing' : 'Crisis'})`,
              x,
              y,
              iconSprite: textureKey,
              type: 'crop',
              targetBiome: biome,
            });
          }

          // Path portals positioned near offscreen exits
          private renderPathGateSigns() {
            this.createGateSign(45, 420, 'lake', 'LAKE [Golden Corn]');
            this.createGateSign(120, 30, 'forest', 'FOREST [Apple Orchard]');
            this.createGateSign(500, 30, 'tundra', 'TUNDRA [Winter Wheat]');
            this.createGateSign(955, 420, 'grasslands', 'PRAIRIE [Sunflowers]');
            this.createGateSign(880, 715, 'desert', 'DESERT [Sugar Melons]');
            this.createGateSign(500, 715, 'reefs', 'REEFS [Tidal Rice]');
          }

          private createGateSign(x: number, y: number, targetBiome: BiomeId, label: string) {
            const container = this.add.container(x, y);

            const bg = this.add.rectangle(0, 0, 142, 30, 0x18181b, 0.95);
            bg.setStrokeStyle(1.5, 0x10b981);

            const text = this.add.text(0, 0, label, {
              fontSize: '10px',
              fontStyle: 'bold',
              fontFamily: 'system-ui',
              color: '#34d399',
            }).setOrigin(0.5);

            container.add([bg, text]);
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', () => {
              sounds.playClick();
              stateRef.current.setCurrentBiome(targetBiome);
            });

            this.worldContainer.add(container);

            this.currentHotspots.push({
              id: `gate_${targetBiome}`,
              name: label,
              x,
              y,
              type: 'gate',
              targetBiome,
            });
          }

          // ===============================================================
          // 🗺️ BIOME ROOMS (RICH DECORATIONS: DEAD/POLLUTED -> THRIVING)
          // ===============================================================
          private buildMaximalistBiomeRoom(biome: BiomeId, isRestored: boolean) {
            const w = this.canvasW;
            const h = this.canvasH;

            // Walkable corridor connecting entrance/exit (bottom leading completely offscreen)
            // to sanctuary (center) and station (top)
            this.pathPolygons = [
              new Phaser.Geom.Rectangle(440, 140, 120, 670), // Y extends to 810 (leads offscreen!)
              new Phaser.Geom.Rectangle(160, 330, 680, 85),
            ];

            // 1. Base Terrain
            const terrain = this.add.graphics();
            if (biome === 'lake') terrain.fillStyle(isRestored ? 0x0284c7 : 0x1e293b, 1);
            else if (biome === 'forest') terrain.fillStyle(isRestored ? 0x14532d : 0x1c1917, 1);
            else if (biome === 'tundra') terrain.fillStyle(isRestored ? 0x1e293b : 0x0f172a, 1);
            else if (biome === 'grasslands') terrain.fillStyle(isRestored ? 0x65a30d : 0x292524, 1);
            else if (biome === 'desert') terrain.fillStyle(isRestored ? 0xd97706 : 0x451a03, 1);
            else if (biome === 'reefs') terrain.fillStyle(isRestored ? 0x0891b2 : 0x134e4a, 1);
            terrain.fillRect(0, 0, w, h);
            this.worldContainer.add(terrain);

            // 2. Render Biome Path matching the biome! (dock for lake, etc.)
            let pathKey = 'path_farm';
            if (biome === 'lake') pathKey = 'path_lake';
            else if (biome === 'forest') pathKey = 'path_forest';
            else if (biome === 'tundra') pathKey = 'path_tundra';
            else if (biome === 'grasslands') pathKey = 'path_grasslands';
            else if (biome === 'desert') pathKey = 'path_desert';
            else if (biome === 'reefs') pathKey = 'path_reefs';

            this.renderBiomePaths(pathKey);

            // 3. Rich Biome Props: Distinctive Visual Contrast (Dead/Polluted vs Thriving)
            this.renderBiomeAtmosphere(biome, isRestored);

            // 4. Animal Friend at Center (500, 330)
            const animalId = this.getAnimalForBiome(biome);
            if (animalId) {
              this.spawnBiomeAnimal(animalId, 500, 330);
            }

            // 5. Action Plan Quest Station at (500, 180)
            this.spawnBiomeQuestStation(biome, isRestored);

            // 6. Return to Central Farm Gate leading offscreen at bottom (500, 715)
            const returnSign = this.add.container(500, 715);
            const returnBg = this.add.rectangle(0, 0, 250, 36, 0x18181b, 0.95).setStrokeStyle(2, 0xf59e0b);
            const returnText = this.add.text(0, 0, 'RETURN TO CENTRAL FARM', {
              fontSize: '11px',
              fontStyle: 'bold',
              fontFamily: 'system-ui',
              color: '#fbbf24',
            }).setOrigin(0.5);

            returnSign.add([returnBg, returnText]);
            returnBg.setInteractive({ useHandCursor: true });
            returnBg.on('pointerdown', () => {
              sounds.playClick();
              stateRef.current.setCurrentBiome('clearing');
            });
            this.worldContainer.add(returnSign);

            this.currentHotspots.push({
              id: 'gate_clearing',
              name: 'Return to Central Farm',
              x: 500,
              y: 715,
              type: 'gate',
              targetBiome: 'clearing',
            });
          }

          // Render rich visual decorations that clearly shift between dead/polluted and thriving!
          private renderBiomeAtmosphere(biome: BiomeId, isRestored: boolean) {
            const gfx = this.add.graphics();

            if (biome === 'lake') {
              if (!isRestored) {
                // Polluted state: Toxic brown/green sludge pools, oily sheen, debris
                gfx.fillStyle(0x36301d, 0.7);
                gfx.fillEllipse(230, 200, 180, 90);
                gfx.fillEllipse(770, 240, 190, 85);
                gfx.fillEllipse(240, 520, 210, 100);
                gfx.fillEllipse(780, 530, 180, 95);

                // Rust hazard barrels
                const drawHazardBarrel = (bx: number, by: number) => {
                  gfx.fillStyle(0x78350f, 1);
                  gfx.fillRect(bx - 12, by - 16, 24, 32);
                  gfx.fillStyle(0xf59e0b, 1);
                  gfx.fillRect(bx - 12, by - 4, 24, 8);
                };
                drawHazardBarrel(210, 210);
                drawHazardBarrel(790, 250);
                drawHazardBarrel(260, 530);
                drawHazardBarrel(750, 540);
              } else {
                // Thriving state: Sparkling blue waters, floating blooming water lilies, lotus flowers
                gfx.fillStyle(0x38bdf8, 0.4);
                gfx.fillEllipse(230, 200, 190, 100);
                gfx.fillEllipse(770, 240, 200, 95);
                gfx.fillEllipse(240, 520, 220, 110);
                gfx.fillEllipse(780, 530, 190, 105);

                // Blooming water lotus blossoms
                const drawLotus = (lx: number, ly: number) => {
                  gfx.fillStyle(0x15803d, 1); // Lily pad
                  gfx.fillCircle(lx, ly, 16);
                  gfx.fillStyle(0xf472b6, 1); // Pink lotus petals
                  gfx.fillCircle(lx - 4, ly - 3, 7);
                  gfx.fillCircle(lx + 4, ly - 3, 7);
                  gfx.fillCircle(lx, ly - 7, 7);
                  gfx.fillStyle(0xfef08a, 1); // Yellow core
                  gfx.fillCircle(lx, ly - 3, 4);
                };
                drawLotus(220, 195);
                drawLotus(260, 215);
                drawLotus(760, 235);
                drawLotus(800, 255);
                drawLotus(230, 515);
                drawLotus(770, 525);
              }
            } else if (biome === 'forest') {
              if (!isRestored) {
                // Dead state: Charred burned tree stumps, smoke wisps, orange ember sparks
                const drawBurntStump = (sx: number, sy: number) => {
                  gfx.fillStyle(0x1c1917, 1);
                  gfx.fillRect(sx - 14, sy - 14, 28, 28);
                  gfx.fillStyle(0xea580c, 0.9); // Glowing ember core
                  gfx.fillCircle(sx, sy, 5);
                };
                drawBurntStump(220, 210);
                drawBurntStump(780, 230);
                drawBurntStump(240, 520);
                drawBurntStump(760, 540);
                drawBurntStump(180, 360);
                drawBurntStump(820, 360);
              } else {
                // Thriving state: Lush green tree clusters, blooming flowers
                const t1 = this.add.image(220, 210, 'trees').setDisplaySize(110, 110);
                const t2 = this.add.image(780, 230, 'trees').setDisplaySize(110, 110);
                const t3 = this.add.image(240, 520, 'trees').setDisplaySize(110, 110);
                const t4 = this.add.image(760, 540, 'trees').setDisplaySize(110, 110);
                this.worldContainer.add([t1, t2, t3, t4]);

                // Flowering underbrush
                gfx.fillStyle(0xec4899, 1);
                gfx.fillCircle(170, 350, 8);
                gfx.fillCircle(190, 365, 8);
                gfx.fillCircle(830, 350, 8);
                gfx.fillCircle(810, 365, 8);
              }
            } else if (biome === 'tundra') {
              if (!isRestored) {
                // Dead state: Black coal soot drifts, slush melt puddles, distant smoking coal chimney
                gfx.fillStyle(0x18181b, 0.85); // Soot patches
                gfx.fillEllipse(230, 210, 180, 75);
                gfx.fillEllipse(780, 230, 180, 75);
                gfx.fillEllipse(240, 520, 190, 80);
                gfx.fillEllipse(770, 530, 180, 80);

                // Distant smoking coal chimney
                gfx.fillStyle(0x27272a, 1);
                gfx.fillRect(840, 120, 22, 60);
                gfx.fillStyle(0x52525b, 0.6); // Smoke plume
                gfx.fillCircle(851, 105, 14);
                gfx.fillCircle(856, 85, 20);
              } else {
                // Thriving state: Crystalline solid blue icebergs, green northern aurora ribbon
                gfx.fillStyle(0x7dd3fc, 0.5); // Pristine ice floes
                gfx.fillEllipse(230, 210, 190, 85);
                gfx.fillEllipse(780, 230, 190, 85);
                gfx.fillEllipse(240, 520, 200, 90);
                gfx.fillEllipse(770, 530, 190, 90);

                // Sparkling ice spires
                const drawIceSpire = (ix: number, iy: number) => {
                  gfx.fillStyle(0xe0f2fe, 1);
                  gfx.fillTriangle(ix - 12, iy + 20, ix + 12, iy + 20, ix, iy - 25);
                  gfx.fillStyle(0x38bdf8, 0.8);
                  gfx.fillTriangle(ix, iy + 20, ix + 12, iy + 20, ix, iy - 25);
                };
                drawIceSpire(220, 205);
                drawIceSpire(780, 225);
                drawIceSpire(240, 515);
                drawIceSpire(770, 525);
              }
            } else if (biome === 'grasslands') {
              if (!isRestored) {
                // Dead state: Parched cracked soil, pesticide hazard drums, brown dry patches
                gfx.fillStyle(0x44403c, 0.8);
                gfx.fillEllipse(230, 210, 180, 75);
                gfx.fillEllipse(780, 230, 180, 75);
                gfx.fillEllipse(240, 520, 190, 80);
                gfx.fillEllipse(770, 530, 180, 80);

                // Chemical drums
                gfx.fillStyle(0xd97706, 1);
                gfx.fillRect(215, 200, 20, 26);
                gfx.fillRect(775, 220, 20, 26);
              } else {
                // Thriving state: Lush colorful wildflower pollinator meadow, golden wheat
                const drawFlowerPatch = (fx: number, fy: number, color: number) => {
                  gfx.fillStyle(color, 1);
                  for (let i = 0; i < 6; i++) {
                    const ox = Math.cos((i * Math.PI) / 3) * 10;
                    const oy = Math.sin((i * Math.PI) / 3) * 10;
                    gfx.fillCircle(fx + ox, fy + oy, 5);
                  }
                  gfx.fillStyle(0xfef08a, 1);
                  gfx.fillCircle(fx, fy, 4);
                };
                drawFlowerPatch(220, 200, 0xa855f7); // Lavender
                drawFlowerPatch(260, 225, 0xef4444); // Poppy
                drawFlowerPatch(760, 220, 0x3b82f6); // Cornflower
                drawFlowerPatch(800, 245, 0xf59e0b); // Marigold
                drawFlowerPatch(230, 515, 0xa855f7);
                drawFlowerPatch(770, 525, 0xef4444);
              }
            } else if (biome === 'desert') {
              if (!isRestored) {
                // Dead state: Scorched cracked clay, parched empty mud waterhole, bleached bones
                gfx.fillStyle(0x78350f, 0.85); // Cracked dust
                gfx.fillEllipse(230, 210, 180, 75);
                gfx.fillEllipse(780, 230, 180, 75);
                gfx.fillEllipse(240, 520, 190, 80);
                gfx.fillEllipse(770, 530, 180, 80);
              } else {
                // Thriving state: Cool freshwater oasis lagoon, palm canopy, blooming succulents
                gfx.fillStyle(0x06b6d4, 0.6); // Oasis water
                gfx.fillEllipse(230, 210, 180, 80);
                gfx.fillEllipse(780, 230, 180, 80);
                gfx.fillEllipse(240, 520, 190, 85);
                gfx.fillEllipse(770, 530, 180, 85);

                // Solar artesian pump beacon
                gfx.fillStyle(0x0284c7, 1);
                gfx.fillRect(225, 195, 12, 28);
                gfx.fillStyle(0x38bdf8, 1);
                gfx.fillCircle(231, 190, 8);
              }
            } else if (biome === 'reefs') {
              if (!isRestored) {
                // Dead state: Bleached white dead coral skeletons, murky boat scars
                gfx.fillStyle(0xd4d4d8, 0.7); // Bleached chalk skeleton
                gfx.fillRect(215, 195, 30, 30);
                gfx.fillRect(765, 215, 30, 30);
                gfx.fillRect(225, 505, 30, 30);
                gfx.fillRect(755, 515, 30, 30);
              } else {
                // Thriving state: Colorful living corals (magenta, purple, turquoise), swimming fish
                const drawCoralBranch = (cx: number, cy: number, color: number) => {
                  gfx.fillStyle(color, 1);
                  gfx.fillCircle(cx, cy, 14);
                  gfx.fillCircle(cx - 8, cy - 10, 9);
                  gfx.fillCircle(cx + 8, cy - 10, 9);
                  gfx.fillCircle(cx, cy - 16, 8);
                };
                drawCoralBranch(220, 200, 0xf43f5e); // Neon coral pink
                drawCoralBranch(260, 220, 0x8b5cf6); // Purple staghorn
                drawCoralBranch(760, 220, 0x14b8a6); // Emerald turquoise
                drawCoralBranch(800, 240, 0xf43f5e);
                drawCoralBranch(230, 515, 0x8b5cf6);
                drawCoralBranch(770, 525, 0x14b8a6);
              }
            }

            this.worldContainer.add(gfx);
          }

          private spawnBiomeQuestStation(biome: BiomeId, isRestored: boolean) {
            const container = this.add.container(500, 180);

            const questMap: Record<BiomeId, { name: string; action: any }> = {
              lake: { name: 'Circular Waste Recycling Quiz', action: 'lake_recycling' },
              forest: { name: 'Fire Prevention & Email Campaign', action: 'forest_campaign' },
              tundra: { name: 'Coal Plant Shutdown Petition', action: 'tundra_petition' },
              grasslands: { name: 'Bayer Smart Precision Simulator', action: 'grasslands_farming' },
              desert: { name: 'Solar Artesian Well & Aquifer Restoration', action: 'desert_aquifer' },
              reefs: { name: 'Maritime GPS Radar Redirection', action: 'reef_navigation' },
              clearing: { name: 'Extinguish Wildfire Flare-ups', action: 'wildfire_quench' },
            };

            const qInfo = questMap[biome];
            if (!qInfo || !qInfo.action) return;

            const bg = this.add.rectangle(0, 0, 280, 36, 0x18181b, 0.95);
            bg.setStrokeStyle(2, isRestored ? 0x22c55e : 0xf59e0b);

            const text = this.add.text(
              0,
              0,
              isRestored ? `Completed: ${qInfo.name}` : `Take Action: ${qInfo.name}`,
              {
                fontSize: '10.5px',
                fontStyle: 'bold',
                fontFamily: 'system-ui',
                color: isRestored ? '#86efac' : '#fbbf24',
              }
            ).setOrigin(0.5);

            container.add([bg, text]);

            const triggerAction = () => {
              sounds.playClick();
              stateRef.current.openQuestModal(qInfo.action);
            };

            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', triggerAction);

            text.setInteractive({ useHandCursor: true });
            text.on('pointerdown', triggerAction);

            this.worldContainer.add(container);

            this.currentHotspots.push({
              id: `quest_${biome}`,
              name: qInfo.name,
              x: 500,
              y: 180,
              type: 'quest',
              questAction: qInfo.action,
            });
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

          private spawnBiomeAnimal(animalId: AnimalId, x: number, y: number) {
            const info = ANIMALS[animalId];
            const container = this.add.container(x, y);

            // Ground shadow
            const shadow = this.add.ellipse(0, 44, 76, 22, 0x000000, 0.35);

            // Ambient breathing glow
            const glow = this.add.circle(0, 0, 46, 0x10b981, 0.25);
            this.tweens.add({ targets: glow, scale: 1.25, alpha: 0.08, duration: 900, yoyo: true, repeat: -1 });

            // Animal image sprite
            const sprite = this.add.image(0, 0, animalId);
            sprite.setDisplaySize(80, 80);
            sprite.setOrigin(0.5, 0.5);

            // Gentle float tween
            this.tweens.add({
              targets: sprite,
              y: sprite.y - 6,
              duration: 1400,
              yoyo: true,
              repeat: -1,
            });

            // Name Tag
            const tagBg = this.add.rectangle(0, 52, 170, 24, 0x18181b, 0.95);
            tagBg.setStrokeStyle(1.5, 0x10b981);
            const tagText = this.add.text(0, 52, `${info.name} • ${info.species}`, {
              fontSize: '11px',
              fontStyle: 'bold',
              fontFamily: 'system-ui',
              color: '#ffffff',
            }).setOrigin(0.5);

            container.add([shadow, glow, sprite, tagBg, tagText]);

            const triggerChat = () => {
              sounds.playClick();
              stateRef.current.openDialogue(animalId);
            };

            sprite.setInteractive({ useHandCursor: true });
            sprite.on('pointerdown', triggerChat);

            tagBg.setInteractive({ useHandCursor: true });
            tagBg.on('pointerdown', triggerChat);

            this.worldContainer.add(container);

            this.currentHotspots.push({
              id: `animal_${animalId}`,
              name: `Talk to ${info.name}`,
              x,
              y,
              iconSprite: animalId,
              type: 'animal',
              animalId,
            });
          }

          update(time: number) {
            if (this.isTransitioning) return;

            let vx = 0;
            let vy = 0;

            // Navigation uses ARROW KEYS ONLY
            if (this.cursors) {
              if (this.cursors.left?.isDown) vx -= 1;
              if (this.cursors.right?.isDown) vx += 1;
              if (this.cursors.up?.isDown) vy -= 1;
              if (this.cursors.down?.isDown) vy += 1;
            }

            if (this.moveTarget) {
              const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.moveTarget.x, this.moveTarget.y);
              if (dist > 8) {
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.moveTarget.x, this.moveTarget.y);
                vx = Math.cos(angle);
                vy = Math.sin(angle);
              } else {
                this.moveTarget = null;
              }
            }

            // Path constraint check: Prevent stepping off the path!
            if (vx !== 0 || vy !== 0) {
              const len = Math.sqrt(vx * vx + vy * vy);
              const step = this.speed * 0.016;
              const nextX = this.player.x + (vx / len) * step;
              const nextY = this.player.y + (vy / len) * step;

              if (this.isPointOnWalkablePath(nextX, nextY)) {
                this.playerBody.setVelocity((vx / len) * this.speed, (vy / len) * this.speed);
              } else if (this.isPointOnWalkablePath(nextX, this.player.y)) {
                this.playerBody.setVelocity((vx / len) * this.speed, 0);
              } else if (this.isPointOnWalkablePath(this.player.x, nextY)) {
                this.playerBody.setVelocity(0, (vy / len) * this.speed);
              } else {
                this.playerBody.setVelocity(0, 0);
                this.moveTarget = null;
              }

              // Subtle walking wobble on the farmer sprite
              if (this.playerSprite) {
                this.playerSprite.angle = Math.sin(time * 0.015) * 5;
              }
            } else {
              this.playerBody.setVelocity(0, 0);
              if (this.playerSprite) {
                this.playerSprite.angle = 0;
              }
            }

            // Proximity to hotspots
            let nearest: Hotspot | null = null;
            let minDistance = 75;

            for (const hs of this.currentHotspots) {
              const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, hs.x, hs.y);
              if (dist < minDistance) {
                minDistance = dist;
                nearest = hs;
              }

              // Automatic walk-through transition for gates leading offscreen!
              if (hs.type === 'gate' && hs.targetBiome && dist < 48) {
                this.triggerHotspotAction(hs);
                return;
              }
            }

            this.nearbyHotspot = nearest;

            // Only notify React when hotspot changes to avoid unnecessary re-renders
            if (nearest?.id !== stateRef.current.activeHotspotId) {
              stateRef.current.activeHotspotId = nearest?.id || null;
              setActiveNearbyHotspot(nearest);
            }
          }

          private triggerHotspotAction(hs: Hotspot) {
            sounds.playClick();
            if (hs.type === 'animal' && hs.animalId) {
              stateRef.current.openDialogue(hs.animalId);
            } else if (hs.type === 'gate' && hs.targetBiome) {
              stateRef.current.setCurrentBiome(hs.targetBiome);
            } else if (hs.type === 'crop' && hs.targetBiome) {
              stateRef.current.setCurrentBiome(hs.targetBiome);
            } else if (hs.type === 'quest' && hs.questAction) {
              stateRef.current.openQuestModal(hs.questAction);
            }
          }
        }

        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          parent: containerRef.current,
          width: 1000,
          height: 750,
          backgroundColor: '#09090b',
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
    <div className="relative w-full h-full flex-1 overflow-hidden select-none bg-zinc-950 flex items-center justify-center">
      {/* HTML5 Canvas with Clean, Crisp Rendering (No CSS Fader or Ash Filter!) */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-crosshair flex items-center justify-center max-w-[1000px] max-h-[750px] shadow-2xl rounded-2xl overflow-hidden border border-zinc-800"
      />

      {/* Quick Return to Central Farm Button */}
      {currentBiome !== 'clearing' && (
        <div className="absolute top-20 left-4 z-30 animate-in fade-in">
          <button
            onClick={() => { sounds.playClick(); setCurrentBiome('clearing'); }}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900/90 hover:bg-zinc-800 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/50 shadow-xl backdrop-blur-md active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Return to Central Farm</span>
          </button>
        </div>
      )}

      {/* Proximity Interaction Prompt (No emojis!) */}
      {activeNearbyHotspot && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 animate-bounce">
          <button
            onClick={() => {
              sounds.playClick();
              if (activeNearbyHotspot.type === 'animal' && activeNearbyHotspot.animalId) {
                openDialogue(activeNearbyHotspot.animalId);
              } else if (activeNearbyHotspot.type === 'gate' && activeNearbyHotspot.targetBiome) {
                setCurrentBiome(activeNearbyHotspot.targetBiome);
              } else if (activeNearbyHotspot.type === 'crop' && activeNearbyHotspot.targetBiome) {
                setCurrentBiome(activeNearbyHotspot.targetBiome);
              } else if (activeNearbyHotspot.type === 'quest' && activeNearbyHotspot.questAction) {
                openQuestModal(activeNearbyHotspot.questAction);
              }
            }}
            className="flex items-center gap-3 px-6 py-3 bg-zinc-900/95 hover:bg-zinc-850 text-white rounded-full border-2 border-emerald-500 shadow-2xl backdrop-blur-lg transition-transform active:scale-95"
          >
            {activeNearbyHotspot.animalId && (
              <img
                src={`/assets/sprites/${activeNearbyHotspot.animalId}.png`}
                alt={activeNearbyHotspot.name}
                className="w-8 h-8 rounded-full object-cover border border-emerald-400"
              />
            )}
            <div className="text-left">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {activeNearbyHotspot.name}
              </div>
              <div className="text-[11px] text-zinc-300">
                {activeNearbyHotspot.type === 'animal' && 'Tap to chat with animal & learn crisis solution'}
                {activeNearbyHotspot.type === 'crop' && 'Tap to inspect crop & travel to its biome'}
                {activeNearbyHotspot.type === 'gate' && 'Tap to enter this area'}
                {activeNearbyHotspot.type === 'quest' && 'Tap to start action plan to restore habitat'}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Controls Hint */}
      <div className="absolute bottom-20 left-4 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800 text-zinc-400 text-[11px]">
        <Footprints className="w-3.5 h-3.5 text-emerald-400" />
        <span>Arrow Keys or Click on paths to move • Walk up to animals, crops, and quest stations or tap them</span>
      </div>
    </div>
  );
}
