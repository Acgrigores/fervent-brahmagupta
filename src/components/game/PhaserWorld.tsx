'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { BiomeId, AnimalId } from '@/types/game';
import { ANIMALS } from '@/data/animals';
import { sounds } from '@/utils/soundEffects';
import { Footprints, ArrowLeft, ShieldAlert } from 'lucide-react';

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
  const [offPathWarning, setOffPathWarning] = useState(false);

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
          private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
          private wasd!: {
            W: Phaser.Input.Keyboard.Key;
            A: Phaser.Input.Keyboard.Key;
            S: Phaser.Input.Keyboard.Key;
            D: Phaser.Input.Keyboard.Key;
            E: Phaser.Input.Keyboard.Key;
            SHIFT: Phaser.Input.Keyboard.Key;
          };
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

            // Setup Keyboard inputs
            if (this.input.keyboard) {
              this.cursors = this.input.keyboard.createCursorKeys();
              this.wasd = {
                W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
                E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
                SHIFT: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
              };
            }

            // Click-to-move strictly on paths
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
              } else {
                setOffPathWarning(true);
                setTimeout(() => setOffPathWarning(false), 1400);

                const redX = this.add.text(pointer.x, pointer.y, 'Stay on Path', {
                  fontSize: '11px',
                  fontStyle: 'bold',
                  fontFamily: 'system-ui',
                  color: '#ef4444',
                  backgroundColor: '#09090bee',
                  padding: { x: 5, y: 2 },
                }).setOrigin(0.5);

                this.tweens.add({
                  targets: redX,
                  y: pointer.y - 18,
                  alpha: 0,
                  duration: 750,
                  onComplete: () => redX.destroy(),
                });
              }
            });

            // Create Farmer Avatar Sprite at central farm plaza
            this.createFarmerPlayer(500, 470);

            // Initial Room Build
            this.currentRoomId = stateRef.current.currentBiome;
            this.buildRoom(this.currentRoomId);
          }

          private createFarmerPlayer(x: number, y: number) {
            this.player = this.add.container(x, y);

            // Ground shadow
            const shadow = this.add.ellipse(0, 22, 32, 14, 0x000000, 0.4);

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
                this.teleportPlayer(500, 470);
              } else {
                this.teleportPlayer(500, 590);
              }

              this.cameras.main.fadeIn(150, 0, 0, 0);
              this.time.delayedCall(200, () => {
                this.isTransitioning = false;
              });
            };

            this.cameras.main.fadeOut(150, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, finishTransition);
            // Bulletproof safety timeout
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
          // 🏡 CENTRAL BAYER FARM (DIRT PATHS, SPRITES, 6 CROP FIELDS)
          // ===============================================================
          private buildMaximalistFarmRoom() {
            const w = this.canvasW;
            const h = this.canvasH;
            const isFarmRestored = (stateRef.current.restoration['clearing'] || 0) >= 80;

            // 1. Lawn Base
            const lawn = this.add.graphics();
            lawn.fillStyle(isFarmRestored ? 0x48bb78 : 0x27272a, 1);
            lawn.fillRect(0, 0, w, h);
            lawn.fillStyle(isFarmRestored ? 0x38a169 : 0x202023, 0.45);
            for (let i = -w; i < w * 2; i += 70) {
              lawn.fillTriangle(i, 0, i + 35, 0, i + h + 35, h);
              lawn.fillTriangle(i, 0, i + h + 35, h, i + h, h);
            }
            this.worldContainer.add(lawn);

            // 2. Walkable Dirt Path Network
            this.pathPolygons = [
              // Central Main Plaza
              new Phaser.Geom.Rectangle(410, 340, 180, 180),
              // Main Horizontal Dirt Highway (reaching Lake on West, Grasslands on East)
              new Phaser.Geom.Rectangle(50, 425, 900, 80),
              // Main Vertical Dirt Avenue (reaching Tundra on North, Reefs on South)
              new Phaser.Geom.Rectangle(460, 90, 80, 600),
              // Northwest Branch (reaching Forest gate & House)
              new Phaser.Geom.Rectangle(90, 220, 390, 75),
              new Phaser.Geom.Rectangle(90, 140, 80, 160),
              // Northeast Branch (reaching Barn, Wheat)
              new Phaser.Geom.Rectangle(520, 220, 390, 75),
              new Phaser.Geom.Rectangle(760, 140, 80, 160),
              // Southwest Branch (reaching Corn & Pool)
              new Phaser.Geom.Rectangle(180, 480, 80, 170),
              new Phaser.Geom.Rectangle(180, 610, 300, 75),
              // Southeast Branch (reaching Desert gate & Melons)
              new Phaser.Geom.Rectangle(750, 480, 80, 170),
              new Phaser.Geom.Rectangle(520, 610, 410, 75),
            ];

            // Render Packed Dirt Paths ("dirt for the farm")
            this.renderBiomePaths('path_farm');

            // 3. Generated Building & Tree Sprites (No polygons!)
            // Farmhouse
            const house = this.add.image(240, 150, 'house');
            house.setDisplaySize(150, 150);
            this.worldContainer.add(house);

            // Barn & Silo
            const barn = this.add.image(500, 105, 'barn');
            barn.setDisplaySize(160, 160);
            this.worldContainer.add(barn);

            // Apple Tree Clusters
            const trees1 = this.add.image(130, 320, 'trees');
            trees1.setDisplaySize(115, 115);
            const trees2 = this.add.image(870, 260, 'trees');
            trees2.setDisplaySize(115, 115);
            const trees3 = this.add.image(690, 155, 'trees');
            trees3.setDisplaySize(105, 105);
            this.worldContainer.add([trees1, trees2, trees3]);

            // Swimming Pool
            this.renderSwimmingPool(140, 540);

            // Fences along dirt paths
            this.renderPicketFences();

            // 4. Six Dedicated Crop Fields (One Dead Picture or Flourishing Picture!)
            this.renderFarmCropField(270, 385, 'lake', 'Golden Sweet Corn', 'Lake Water Polluted');
            this.renderFarmCropField(180, 185, 'forest', 'Apple Orchard', 'Wildfire Smoke Blight');
            this.renderFarmCropField(730, 185, 'tundra', 'Glacial Winter Wheat', 'Coal Soot Fallout');
            this.renderFarmCropField(830, 385, 'grasslands', 'Giant Sunflowers', 'Pesticide & Topsoil Loss');
            this.renderFarmCropField(750, 575, 'desert', 'Sugar Melons', 'Aquifer Depleted');
            this.renderFarmCropField(390, 615, 'reefs', 'Tidal Rice & Kelp', 'Boat Propellers & Oil');

            // 5. Directional Navigation Signs (No emojis!)
            this.renderPathGateSigns();
          }

          private renderBiomePaths(textureKey: string) {
            // Render tiled path texture matching the biome
            this.pathPolygons.forEach((poly) => {
              // Subtle dark shadow border
              const border = this.add.rectangle(
                poly.x + poly.width / 2,
                poly.y + poly.height / 2,
                poly.width + 6,
                poly.height + 6,
                0x18181b,
                0.7
              );
              this.worldContainer.add(border);

              // Tiled path texture
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

          private renderPicketFences() {
            const gfx = this.add.graphics();
            gfx.fillStyle(0xffffff, 1);
            gfx.lineStyle(1.5, 0xd1d5db, 1);

            const drawFenceSegment = (x1: number, y1: number, x2: number, y2: number) => {
              const count = Math.floor(Phaser.Math.Distance.Between(x1, y1, x2, y2) / 10);
              for (let i = 0; i <= count; i++) {
                const t = count === 0 ? 0 : i / count;
                const fx = x1 + (x2 - x1) * t;
                const fy = y1 + (y2 - y1) * t;
                gfx.fillRect(fx - 2, fy - 10, 4, 14);
                gfx.fillTriangle(fx - 2, fy - 10, fx + 2, fy - 10, fx, fy - 14);
              }
              gfx.lineBetween(x1, y1 - 4, x2, y2 - 4);
              gfx.lineBetween(x1, y1 - 8, x2, y2 - 8);
            };

            drawFenceSegment(60, 420, 400, 420);
            drawFenceSegment(600, 420, 940, 420);
            drawFenceSegment(60, 510, 400, 510);
            drawFenceSegment(600, 510, 940, 510);
            drawFenceSegment(454, 150, 454, 335);
            drawFenceSegment(546, 150, 546, 335);

            this.worldContainer.add(gfx);
          }

          // CROP FIELD: Displays Dead Picture or Flourishing Picture!
          private renderFarmCropField(
            x: number,
            y: number,
            biome: Exclude<BiomeId, 'clearing'>,
            cropName: string,
            crisisNotice: string
          ) {
            const isFlourished = (stateRef.current.restoration[biome] || 0) >= 80;
            const container = this.add.container(x, y);

            // Ground shadow
            const shadow = this.add.ellipse(0, 36, 105, 24, 0x000000, 0.35);

            // Image sprite: One Dead Picture or Flourishing Picture! (No polygons!)
            const textureKey = isFlourished ? 'crop_flourish' : 'crop_dead';
            const cropImage = this.add.image(0, 0, textureKey);
            cropImage.setDisplaySize(120, 120);

            // Status label badge (No emojis!)
            const badgeBg = this.add.rectangle(0, 48, 160, 22, 0x18181b, 0.95);
            badgeBg.setStrokeStyle(1.5, isFlourished ? 0x22c55e : 0xef4444);

            const badgeText = this.add.text(
              0,
              48,
              isFlourished ? `Flourishing: ${cropName}` : `${cropName} • ${crisisNotice}`,
              {
                fontSize: '8.5px',
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

          private renderPathGateSigns() {
            this.createGateSign(75, 465, 'lake', 'LAKE [Golden Corn]');
            this.createGateSign(130, 160, 'forest', 'FOREST [Apple Orchard]');
            this.createGateSign(500, 115, 'tundra', 'TUNDRA [Winter Wheat]');
            this.createGateSign(925, 465, 'grasslands', 'PRAIRIE [Sunflowers]');
            this.createGateSign(900, 645, 'desert', 'DESERT [Sugar Melons]');
            this.createGateSign(500, 660, 'reefs', 'REEFS [Tidal Rice]');
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
          // 🗺️ BIOME ROOMS (TEXTURED PATHS: DOCK, ICE, SAND, ETC.)
          // ===============================================================
          private buildMaximalistBiomeRoom(biome: BiomeId, isRestored: boolean) {
            const w = this.canvasW;
            const h = this.canvasH;

            // Walkable corridor connecting entrance (bottom) to sanctuary (center) and station (top)
            this.pathPolygons = [
              new Phaser.Geom.Rectangle(430, 140, 140, 560),
              new Phaser.Geom.Rectangle(200, 330, 600, 85),
            ];

            // 1. Base Terrain
            const terrain = this.add.graphics();
            if (biome === 'lake') terrain.fillStyle(isRestored ? 0x0284c7 : 0x1f2937, 1);
            else if (biome === 'forest') terrain.fillStyle(isRestored ? 0x14532d : 0x1c1917, 1);
            else if (biome === 'tundra') terrain.fillStyle(isRestored ? 0x1e293b : 0x0f172a, 1);
            else if (biome === 'grasslands') terrain.fillStyle(isRestored ? 0x65a30d : 0x292524, 1);
            else if (biome === 'desert') terrain.fillStyle(isRestored ? 0xd97706 : 0x451a03, 1);
            else if (biome === 'reefs') terrain.fillStyle(isRestored ? 0x0891b2 : 0x134e4a, 1);
            terrain.fillRect(0, 0, w, h);
            this.worldContainer.add(terrain);

            // 2. Render Path matching the biome! ("a dock for the lake, etc.")
            let pathKey = 'path_farm';
            if (biome === 'lake') pathKey = 'path_lake';
            else if (biome === 'forest') pathKey = 'path_forest';
            else if (biome === 'tundra') pathKey = 'path_tundra';
            else if (biome === 'grasslands') pathKey = 'path_grasslands';
            else if (biome === 'desert') pathKey = 'path_desert';
            else if (biome === 'reefs') pathKey = 'path_reefs';

            this.renderBiomePaths(pathKey);

            // 3. Animal Friend at Center (500, 330) using real transparent sprite!
            const animalId = this.getAnimalForBiome(biome);
            if (animalId) {
              this.spawnBiomeAnimal(animalId, 500, 330);
            }

            // 4. Action Plan Quest Station at (500, 180) (No emojis!)
            this.spawnBiomeQuestStation(biome, isRestored);

            // 5. Return to Farm Gate at Bottom (500, 670)
            const returnSign = this.add.container(500, 670);
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
              y: 670,
              type: 'gate',
              targetBiome: 'clearing',
            });
          }

          private spawnBiomeQuestStation(biome: BiomeId, isRestored: boolean) {
            const container = this.add.container(500, 180);

            const questMap: Record<BiomeId, { name: string; action: any }> = {
              lake: { name: 'Circular Waste Recycling Quiz', action: 'lake_quiz' },
              forest: { name: 'Fire Prevention & Email Campaign', action: 'forest_post' },
              tundra: { name: 'Coal Plant Shutdown Petition', action: 'tundra_petition' },
              grasslands: { name: 'Bayer Smart Precision Simulator', action: 'grasslands_petition' },
              desert: { name: 'Aquifer Restoration & Quench', action: 'wildfire_quench' },
              reefs: { name: 'Maritime GPS Radar Redirection', action: 'reef_divert' },
              clearing: { name: 'Restore Habitats', action: null },
            };

            const qInfo = questMap[biome];
            if (!qInfo || !qInfo.action) return;

            const bg = this.add.rectangle(0, 0, 260, 34, 0x18181b, 0.95);
            bg.setStrokeStyle(2, isRestored ? 0x22c55e : 0xf59e0b);

            const text = this.add.text(
              0,
              0,
              isRestored ? `Completed: ${qInfo.name}` : `Take Action: ${qInfo.name}`,
              {
                fontSize: '10px',
                fontStyle: 'bold',
                fontFamily: 'system-ui',
                color: isRestored ? '#86efac' : '#fbbf24',
              }
            ).setOrigin(0.5);

            container.add([bg, text]);
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', () => {
              sounds.playClick();
              stateRef.current.openQuestModal(qInfo.action);
            });

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

          // ANIMAL SPRITE: Real transparent image sprite! (No emojis!)
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

            sprite.setInteractive({ useHandCursor: true });
            sprite.on('pointerdown', () => {
              sounds.playClick();
              stateRef.current.openDialogue(animalId);
            });

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

            const isShift = this.wasd?.SHIFT.isDown || this.cursors?.shift?.isDown;
            const currentSpeed = isShift ? 420 : this.speed;

            if (this.cursors && this.wasd) {
              if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
              if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
              if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
              if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

              if (Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
                if (this.nearbyHotspot) {
                  this.triggerHotspotAction(this.nearbyHotspot);
                }
              }
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
              const step = currentSpeed * 0.016;
              const nextX = this.player.x + (vx / len) * step;
              const nextY = this.player.y + (vy / len) * step;

              if (this.isPointOnWalkablePath(nextX, nextY)) {
                this.playerBody.setVelocity((vx / len) * currentSpeed, (vy / len) * currentSpeed);
              } else if (this.isPointOnWalkablePath(nextX, this.player.y)) {
                this.playerBody.setVelocity((vx / len) * currentSpeed, 0);
              } else if (this.isPointOnWalkablePath(this.player.x, nextY)) {
                this.playerBody.setVelocity(0, (vy / len) * currentSpeed);
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

              // Automatic walk-through transition for gates
              if (hs.type === 'gate' && hs.targetBiome && dist < 42) {
                this.triggerHotspotAction(hs);
                return;
              }
            }

            this.nearbyHotspot = nearest;

            // Only notify React when hotspot changes to avoid 60fps re-renders
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

  const currentRestorationLevel = restoration[currentBiome] || 0;
  const grayscaleAmount = Math.max(0, 85 - currentRestorationLevel * 0.85);
  const saturationAmount = 70 + currentRestorationLevel * 0.7;
  const sepiaAmount = Math.max(0, 35 - currentRestorationLevel * 0.35);
  const brightnessAmount = 75 + currentRestorationLevel * 0.35;

  const canvasFilterStyle = {
    filter: `grayscale(${grayscaleAmount}%) saturate(${saturationAmount}%) sepia(${sepiaAmount}%) brightness(${brightnessAmount}%)`,
    transition: 'filter 1.2s ease-in-out',
  };

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden select-none bg-zinc-950 flex items-center justify-center">
      {/* HTML5 Canvas with Procedural 2.5D Foreground Engine */}
      <div
        ref={containerRef}
        style={canvasFilterStyle}
        className="w-full h-full cursor-crosshair flex items-center justify-center max-w-[1000px] max-h-[750px] shadow-2xl rounded-2xl overflow-hidden border border-zinc-800"
      />

      {/* Ash & Smolder Vignette when low restoration */}
      {currentRestorationLevel < 70 && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
          style={{
            opacity: Math.max(0, (70 - currentRestorationLevel) / 70),
            background:
              'radial-gradient(ellipse at center, transparent 35%, rgba(15, 10, 5, 0.55) 75%, rgba(5, 5, 5, 0.85) 100%)',
            boxShadow: 'inset 0 0 100px rgba(220, 38, 38, 0.3)',
          }}
        />
      )}

      {/* Off-Path Step Blocked Toast */}
      {offPathWarning && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 animate-bounce pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 bg-red-950/90 border border-red-500/80 rounded-full shadow-2xl text-xs font-bold text-red-200 backdrop-blur-md">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Stay on the paths! Picket fences protect the farm crops and garden beds.</span>
          </div>
        </div>
      )}

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
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>{activeNearbyHotspot.name}</span>
                <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-mono">
                  [Press E or Tap]
                </span>
              </div>
              <div className="text-[11px] text-zinc-300">
                {activeNearbyHotspot.type === 'animal' && 'Chat with animal & learn crisis solution'}
                {activeNearbyHotspot.type === 'crop' && 'Inspect crop & travel to its biome'}
                {activeNearbyHotspot.type === 'gate' && 'Travel along path into this area'}
                {activeNearbyHotspot.type === 'quest' && 'Start action plan to restore this habitat'}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Controls Hint */}
      <div className="absolute bottom-20 left-4 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800 text-zinc-400 text-[11px]">
        <Footprints className="w-3.5 h-3.5 text-emerald-400" />
        <span>WASD / Arrow Keys or Click on paths • Stay on the pathways</span>
      </div>
    </div>
  );
}
