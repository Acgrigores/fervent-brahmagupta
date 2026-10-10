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

  // Sync restoration changes or game resets into active scene
  useEffect(() => {
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('GardenscapesWorldScene');
      if (scene && typeof scene.rebuildCurrentRoom === 'function') {
        scene.rebuildCurrentRoom();
      }
    }
  }, [restoration]);

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
          private transitionCooldownUntil: number = 0;
          private speed: number = 290;
          private canvasW: number = 1400;
          private canvasH: number = 750;

          constructor() {
            super({ key: 'GardenscapesWorldScene' });
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
            this.canvasW = 1400;
            this.canvasH = 750;

            this.physics.world.setBounds(0, 0, this.canvasW, this.canvasH);
            this.cameras.main.setBounds(0, 0, this.canvasW, this.canvasH);

            this.worldContainer = this.add.container(0, 0);

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
              }
            });

            // Create Farmer Avatar Sprite at central farm plaza
            this.createFarmerPlayer(700, 420);

            // Initial Room Build
            this.currentRoomId = stateRef.current.currentBiome;
            this.buildRoom(this.currentRoomId);
          }

          private createFarmerPlayer(x: number, y: number) {
            this.player = this.add.container(x, y);

            // Soft ground shadow
            const shadow = this.add.ellipse(0, 22, 32, 14, 0x000000, 0.35);

            // Farmer image sprite
            this.playerSprite = this.add.image(0, 0, 'farmer');
            this.playerSprite.setDisplaySize(54, 54);
            this.playerSprite.setOrigin(0.5, 0.7);

            this.player.add([shadow, this.playerSprite]);
            this.physics.add.existing(this.player);

            this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
            this.playerBody.setCircle(16, -16, -6);
            this.playerBody.setCollideWorldBounds(true);
          }

          public rebuildCurrentRoom() {
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

            const previousRoom = this.currentRoomId;

            let executed = false;
            const finishTransition = () => {
              if (executed) return;
              executed = true;

              this.currentRoomId = biome;
              this.buildRoom(biome);

              // Determine opposite-side entry coordinates with large safety margin
              if (customSpawn) {
                this.teleportPlayer(customSpawn.x, customSpawn.y);
              } else if (biome === 'clearing') {
                // Entering Central Farm from a biome:
                if (previousRoom === 'lake') {
                  // Lake is on Left -> entered farm on Left edge, spawn at x = 260
                  this.teleportPlayer(260, 420);
                } else if (previousRoom === 'grasslands') {
                  // Grasslands is on Right -> entered farm on Right edge, spawn at x = 1140
                  this.teleportPlayer(1140, 420);
                } else if (previousRoom === 'forest') {
                  // Forest is North-West -> entered farm at North-West lane, spawn at y = 180
                  this.teleportPlayer(190, 180);
                } else if (previousRoom === 'tundra') {
                  // Tundra is North-Center -> entered farm at North Avenue, spawn at y = 180
                  this.teleportPlayer(700, 180);
                } else if (previousRoom === 'reefs') {
                  // Reefs is South-Center -> entered farm at South Avenue, spawn at y = 570
                  this.teleportPlayer(700, 570);
                } else if (previousRoom === 'desert') {
                  // Desert is South-East -> entered farm at South-East lane, spawn at y = 570
                  this.teleportPlayer(1230, 570);
                } else {
                  this.teleportPlayer(700, 420);
                }
              } else {
                // Entering a specific Biome from Central Farm:
                if (biome === 'lake') {
                  // Exited Farm on Left -> enter Lake on the RIGHT edge! (Spawn at x = 1140)
                  this.teleportPlayer(1140, 375);
                } else if (biome === 'grasslands') {
                  // Exited Farm on Right -> enter Grasslands on the LEFT edge! (Spawn at x = 260)
                  this.teleportPlayer(260, 375);
                } else if (biome === 'forest' || biome === 'tundra') {
                  // Exited Farm on Top -> enter at the BOTTOM edge! (Spawn at y = 570)
                  this.teleportPlayer(700, 570);
                } else if (biome === 'reefs' || biome === 'desert') {
                  // Exited Farm on Bottom -> enter at the TOP edge! (Spawn at y = 180)
                  this.teleportPlayer(700, 180);
                } else {
                  this.teleportPlayer(700, 375);
                }
              }

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
          // 🪵 VINTAGE WOODEN POSTED SIGN HELPER (RUSTIC CARVED SIGNS)
          // ===============================================================
          private createVintageWoodenSign(
            x: number,
            y: number,
            title: string,
            subtitle?: string,
            width: number = 160,
            height: number = 38,
            statusColor: string = '#fef3c7',
            onClick?: () => void,
            postPos: 'bottom' | 'top' | 'none' = 'bottom'
          ): Phaser.GameObjects.Container {
            const container = this.add.container(x, y);

            // 1. Sturdy Wooden Post
            if (postPos === 'bottom') {
              const post = this.add.rectangle(0, height / 2 + 10, 14, 26, 0x451a03);
              const postHighlight = this.add.rectangle(-2, height / 2 + 10, 4, 24, 0x78350f);
              container.add([post, postHighlight]);
            } else if (postPos === 'top') {
              const post = this.add.rectangle(0, -height / 2 - 10, 14, 26, 0x451a03);
              const postHighlight = this.add.rectangle(-2, -height / 2 - 10, 4, 24, 0x78350f);
              container.add([post, postHighlight]);
            }

            // 2. Vintage Wooden Plank Board
            const shadow = this.add.rectangle(2, 2, width, height, 0x000000, 0.45);
            const boardRim = this.add.rectangle(0, 0, width, height, 0x3e1a06);
            const boardFace = this.add.rectangle(0, 0, width - 4, height - 4, 0x78350f);
            const grain1 = this.add.rectangle(0, -height / 4 + 2, width - 12, 1, 0x92400e, 0.7);
            const grain2 = this.add.rectangle(0, height / 4 - 2, width - 12, 1, 0x5c2c16, 0.7);

            // Corner nail rivets
            const nail1 = this.add.circle(-width / 2 + 7, -height / 2 + 7, 2.5, 0xd97706);
            const nail2 = this.add.circle(width / 2 - 7, -height / 2 + 7, 2.5, 0xd97706);
            const nail3 = this.add.circle(-width / 2 + 7, height / 2 - 7, 2.5, 0xd97706);
            const nail4 = this.add.circle(width / 2 - 7, height / 2 - 7, 2.5, 0xd97706);

            container.add([shadow, boardRim, boardFace, grain1, grain2, nail1, nail2, nail3, nail4]);

            // 3. Carved Serif Text
            const titleY = subtitle ? -6 : 0;
            const titleText = this.add.text(0, titleY, title, {
              fontSize: subtitle ? '10px' : '11.5px',
              fontStyle: 'bold',
              fontFamily: 'Georgia, serif',
              color: '#fffbeb',
              stroke: '#2e1005',
              strokeThickness: 2,
            }).setOrigin(0.5);
            container.add(titleText);

            if (subtitle) {
              const subText = this.add.text(0, 8, subtitle, {
                fontSize: '8px',
                fontStyle: 'bold',
                fontFamily: 'Georgia, serif',
                color: statusColor,
                stroke: '#2e1005',
                strokeThickness: 1.5,
              }).setOrigin(0.5);
              container.add(subText);
            }

            if (onClick) {
              boardFace.setInteractive({ useHandCursor: true });
              boardFace.on('pointerdown', onClick);
              titleText.setInteractive({ useHandCursor: true });
              titleText.on('pointerdown', onClick);
            }

            this.worldContainer.add(container);
            return container;
          }

          // ===============================================================
          // 🏡 FULL-WIDTH HORIZONTAL BAYER FARM (1400x750 SCREEN-WIDE)
          // ===============================================================
          private buildMaximalistFarmRoom() {
            const w = this.canvasW;
            const h = this.canvasH;
            const isFarmRestored = (stateRef.current.restoration['clearing'] || 0) >= 80;

            // 1. Detailed Grass Background spanning full width
            const grassKey = isFarmRestored ? 'grass_flourish' : 'grass_dead';
            const lawn = this.add.image(w / 2, h / 2, grassKey);
            lawn.setDisplaySize(w, h);
            this.worldContainer.add(lawn);

            // 2. Walkable Dirt Path Network (Leading Completely OFFSCREEN)
            this.pathPolygons = [
              // Central Main Plaza
              new Phaser.Geom.Rectangle(630, 350, 140, 140),
              // Main Horizontal Dirt Highway leading completely offscreen West & East
              new Phaser.Geom.Rectangle(-60, 390, 1520, 60),
              // Main Vertical Dirt Avenue leading completely offscreen North & South
              new Phaser.Geom.Rectangle(670, -60, 60, 870),
              // West Access Lane leading up to Forest exit
              new Phaser.Geom.Rectangle(160, -60, 60, 500),
              // East Access Lane leading down to Desert exit
              new Phaser.Geom.Rectangle(1200, 390, 60, 420),
            ];

            // Render Packed Dirt Paths
            this.renderBiomePaths('path_farm');

            // 3. Buildings & Orchard Grove
            // Farmhouse Cottage
            const house = this.add.image(340, 120, 'house');
            house.setDisplaySize(140, 140);
            this.worldContainer.add(house);

            // Clumped Orchard Grove
            const orchardSoil = this.add.ellipse(510, 130, 150, 95, 0x543315, 0.4);
            const trees1 = this.add.image(470, 115, 'trees').setDisplaySize(95, 95);
            const trees2 = this.add.image(550, 110, 'trees').setDisplaySize(95, 95);
            const trees3 = this.add.image(510, 145, 'trees').setDisplaySize(100, 100);
            this.worldContainer.add([orchardSoil, trees1, trees2, trees3]);

            // Barn & Silo
            const barn = this.add.image(1050, 120, 'barn');
            barn.setDisplaySize(150, 150);
            this.worldContainer.add(barn);

            // Swimming Pool in Southwest sector
            this.renderSwimmingPool(340, 580);

            // 4. Six Dedicated Crop Fields (Displays One Dead vs Flourishing Image!)
            this.renderFarmCropField(340, 290, 'lake', 'Golden Sweet Corn', 'Lake Water Polluted');
            this.renderFarmCropField(530, 290, 'forest', 'Canopy Apple Orchard', 'Wildfire Smoke Blight');
            this.renderFarmCropField(870, 200, 'tundra', 'Glacial Winter Wheat', 'Coal Soot Fallout');
            this.renderFarmCropField(1050, 290, 'grasslands', 'Giant Sunflowers', 'Pesticide & Topsoil Loss');
            this.renderFarmCropField(530, 580, 'reefs', 'Tidal Rice & Kelp', 'Boat Propellers & Oil');
            this.renderFarmCropField(1030, 580, 'desert', 'Sugar Melons', 'Aquifer Depleted');

            // 5. Vintage Wooden Posted Directional Signs positioned near exits
            this.renderPathGateSigns();

            // 6. Farm Activity Station (Extinguish Wildfire Flare-ups)
            this.spawnBiomeQuestStation('clearing', isFarmRestored);
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

          private renderSwimmingPool(x: number, y: number) {
            const container = this.add.container(x, y);
            const patio = this.add.rectangle(0, 0, 110, 80, 0xd97706).setStrokeStyle(3, 0xb45309);
            const water = this.add.rectangle(0, 0, 94, 64, 0x06b6d4).setStrokeStyle(2, 0x38bdf8);
            const board = this.add.rectangle(35, 0, 24, 8, 0xffffff);

            container.add([patio, water, board]);
            this.worldContainer.add(container);
          }

          // CROP FIELD: Displays One Dead Picture or Flourishing Picture with Vintage Wooden Sign
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

            // Real Image Sprite (Dead vs Flourishing image)
            const textureKey = isFlourished ? 'crop_flourish' : 'crop_dead';
            const cropImage = this.add.image(0, 0, textureKey);
            cropImage.setDisplaySize(100, 100);

            container.add([shadow, cropImage]);

            cropImage.setInteractive({ useHandCursor: true });
            cropImage.on('pointerdown', () => {
              sounds.playClick();
              stateRef.current.setCurrentBiome(biome);
            });

            this.worldContainer.add(container);

            // Vintage wooden posted sign right at the crop plot
            this.createVintageWoodenSign(
              x,
              y + 44,
              cropName,
              isFlourished ? '✓ Flourishing Harvest' : `⚠ ${crisisNotice}`,
              164,
              32,
              isFlourished ? '#86efac' : '#fca5a5',
              () => {
                sounds.playClick();
                stateRef.current.setCurrentBiome(biome);
              },
              'bottom'
            );

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
            this.createGateSign(80, 420, 'lake', '← LAKE DOCK', 'Golden Sweet Corn');
            this.createGateSign(190, 40, 'forest', '↑ CLOUD FOREST', 'Apple Orchard');
            this.createGateSign(700, 40, 'tundra', '↑ ARCTIC TUNDRA', 'Winter Wheat');
            this.createGateSign(1320, 420, 'grasslands', 'PRAIRIE →', 'Giant Sunflowers');
            this.createGateSign(1230, 710, 'desert', '↓ DESERT OASIS', 'Sugar Melons');
            this.createGateSign(700, 710, 'reefs', '↓ CORAL REEFS', 'Tidal Rice');
          }

          private createGateSign(
            x: number,
            y: number,
            targetBiome: BiomeId,
            label: string,
            sublabel: string
          ) {
            this.createVintageWoodenSign(
              x,
              y,
              label,
              sublabel,
              148,
              34,
              '#fde68a',
              () => {
                sounds.playClick();
                stateRef.current.setCurrentBiome(targetBiome);
              },
              'none'
            );

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
          // 🗺️ FULL-WIDTH BIOME ROOMS (1400x750 REAL IMAGES)
          // NO POLYGONS! REPLACED ENTIRELY WITH HIGH-RES BIOME IMAGES!
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
                new Phaser.Geom.Rectangle(160, 340, 1300, 70),
                new Phaser.Geom.Rectangle(660, 140, 80, 480),
              ];
            } else if (biome === 'grasslands') {
              pathKey = 'path_grasslands';
              this.pathPolygons = [
                new Phaser.Geom.Rectangle(-60, 340, 1300, 70),
                new Phaser.Geom.Rectangle(660, 140, 80, 480),
              ];
            } else if (biome === 'forest') {
              pathKey = 'path_forest';
              this.pathPolygons = [
                new Phaser.Geom.Rectangle(660, 140, 80, 670),
                new Phaser.Geom.Rectangle(240, 340, 920, 70),
              ];
            } else if (biome === 'tundra') {
              pathKey = 'path_tundra';
              this.pathPolygons = [
                new Phaser.Geom.Rectangle(660, 140, 80, 670),
                new Phaser.Geom.Rectangle(240, 340, 920, 70),
              ];
            } else if (biome === 'desert') {
              pathKey = 'path_desert';
              this.pathPolygons = [
                new Phaser.Geom.Rectangle(660, -60, 80, 710),
                new Phaser.Geom.Rectangle(240, 340, 920, 70),
              ];
            } else if (biome === 'reefs') {
              pathKey = 'path_reefs';
              this.pathPolygons = [
                new Phaser.Geom.Rectangle(660, -60, 80, 710),
                new Phaser.Geom.Rectangle(240, 340, 920, 70),
              ];
            }

            this.renderBiomePaths(pathKey);

            // 3. Animal Friend at Center (700, 330)
            const animalId = this.getAnimalForBiome(biome);
            if (animalId) {
              this.spawnBiomeAnimal(animalId, 700, 330);
            }

            // 4. Action Plan Quest Station at (700, 180)
            this.spawnBiomeQuestStation(biome, isRestored);

            // 5. Return to Central Farm Signpost placed at exit edge
            if (biome === 'lake') {
              this.createVintageWoodenSign(
                1310,
                375,
                'FARM PORTAL →',
                'Return to Central Farm',
                150,
                34,
                '#fde68a',
                () => {
                  sounds.playClick();
                  stateRef.current.setCurrentBiome('clearing');
                },
                'none'
              );
              this.currentHotspots.push({
                id: 'gate_clearing',
                name: 'Return to Central Farm',
                x: 1310,
                y: 375,
                type: 'gate',
                targetBiome: 'clearing',
              });
            } else if (biome === 'grasslands') {
              this.createVintageWoodenSign(
                80,
                375,
                '← FARM PORTAL',
                'Return to Central Farm',
                150,
                34,
                '#fde68a',
                () => {
                  sounds.playClick();
                  stateRef.current.setCurrentBiome('clearing');
                },
                'none'
              );
              this.currentHotspots.push({
                id: 'gate_clearing',
                name: 'Return to Central Farm',
                x: 80,
                y: 375,
                type: 'gate',
                targetBiome: 'clearing',
              });
            } else if (biome === 'forest' || biome === 'tundra') {
              this.createVintageWoodenSign(
                700,
                710,
                '↓ RETURN TO CENTRAL FARM',
                'Opposite Portal to Bayer Farm',
                220,
                34,
                '#fde68a',
                () => {
                  sounds.playClick();
                  stateRef.current.setCurrentBiome('clearing');
                },
                'top'
              );
              this.currentHotspots.push({
                id: 'gate_clearing',
                name: 'Return to Central Farm',
                x: 700,
                y: 710,
                type: 'gate',
                targetBiome: 'clearing',
              });
            } else if (biome === 'reefs' || biome === 'desert') {
              this.createVintageWoodenSign(
                700,
                40,
                '↑ RETURN TO CENTRAL FARM',
                'Opposite Portal to Bayer Farm',
                220,
                34,
                '#fde68a',
                () => {
                  sounds.playClick();
                  stateRef.current.setCurrentBiome('clearing');
                },
                'bottom'
              );
              this.currentHotspots.push({
                id: 'gate_clearing',
                name: 'Return to Central Farm',
                x: 700,
                y: 40,
                type: 'gate',
                targetBiome: 'clearing',
              });
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
              clearing: { name: 'Extinguish Wildfire Flare-ups', action: 'wildfire_quench' },
            };

            const qInfo = questMap[biome];
            if (!qInfo || !qInfo.action) return;

            const triggerAction = () => {
              sounds.playClick();
              stateRef.current.openQuestModal(qInfo.action);
            };

            this.createVintageWoodenSign(
              700,
              180,
              isRestored ? `✓ RESTORED: ${qInfo.name}` : `ACTION PLAN: ${qInfo.name}`,
              isRestored ? 'Habitat Flourishing • Tap to review action' : 'Tap sign to launch environmental action',
              290,
              38,
              isRestored ? '#86efac' : '#fde68a',
              triggerAction,
              'bottom'
            );

            this.currentHotspots.push({
              id: `quest_${biome}`,
              name: qInfo.name,
              x: 700,
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

            container.add([shadow, glow, sprite]);

            const triggerChat = () => {
              sounds.playClick();
              stateRef.current.openDialogue(animalId);
            };

            sprite.setInteractive({ useHandCursor: true });
            sprite.on('pointerdown', triggerChat);

            this.worldContainer.add(container);

            this.createVintageWoodenSign(
              x,
              y + 54,
              info.name,
              `${info.species} • Tap to Chat`,
              170,
              32,
              '#fde68a',
              triggerChat,
              'none'
            );

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

              if (this.playerSprite) {
                this.playerSprite.angle = Math.sin(time * 0.015) * 5;
              }
            } else {
              this.playerBody.setVelocity(0, 0);
              if (this.playerSprite) {
                this.playerSprite.angle = 0;
              }
            }

            // Screen edge transitions (Guarded by transitionCooldownUntil)
            if (time > this.transitionCooldownUntil) {
              if (this.currentRoomId === 'clearing') {
                if (this.player.x <= 15) {
                  stateRef.current.setCurrentBiome('lake');
                  return;
                }
                if (this.player.x >= this.canvasW - 15) {
                  stateRef.current.setCurrentBiome('grasslands');
                  return;
                }
                if (this.player.y <= 15 && this.player.x < 450) {
                  stateRef.current.setCurrentBiome('forest');
                  return;
                }
                if (this.player.y <= 15 && this.player.x >= 450) {
                  stateRef.current.setCurrentBiome('tundra');
                  return;
                }
                if (this.player.y >= this.canvasH - 15 && this.player.x < 950) {
                  stateRef.current.setCurrentBiome('reefs');
                  return;
                }
                if (this.player.y >= this.canvasH - 15 && this.player.x >= 950) {
                  stateRef.current.setCurrentBiome('desert');
                  return;
                }
              } else {
                if (this.currentRoomId === 'lake' && this.player.x >= this.canvasW - 15) {
                  stateRef.current.setCurrentBiome('clearing');
                  return;
                }
                if (this.currentRoomId === 'grasslands' && this.player.x <= 15) {
                  stateRef.current.setCurrentBiome('clearing');
                  return;
                }
                if ((this.currentRoomId === 'forest' || this.currentRoomId === 'tundra') && this.player.y >= this.canvasH - 15) {
                  stateRef.current.setCurrentBiome('clearing');
                  return;
                }
                if ((this.currentRoomId === 'reefs' || this.currentRoomId === 'desert') && this.player.y <= 15) {
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
              setActiveNearbyHotspot(nearest);
            }
          }
        }

        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          parent: containerRef.current,
          width: 1400,
          height: 750,
          backgroundColor: '#fef3c7',
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
    <div className="relative w-full h-full flex-1 overflow-hidden select-none bg-[#fef3c7] flex items-center justify-center font-pixel">
      {/* HTML5 Canvas Stretching Edge-to-Edge Horizontally across the entire screen */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-crosshair flex items-center justify-center overflow-hidden border-y-4 border-[#3e1a06] bg-[#fef3c7] shadow-inner [&>canvas]:w-full [&>canvas]:h-full [&>canvas]:object-cover"
      />

      {/* Return to Central Farm Sign (When in biomes) */}
      {currentBiome !== 'clearing' && (
        <div className="absolute top-3 left-3 z-30 animate-in fade-in">
          <button
            onClick={() => { sounds.playClick(); setCurrentBiome('clearing'); }}
            className="pixel-btn flex items-center gap-1.5 px-3 py-1.5 text-[9.5px] font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#fde68a]" />
            <span>RETURN TO FARM</span>
          </button>
        </div>
      )}

      {/* Proximity Interaction Prompt (Retro Pixel Art Dialog Plaque) */}
      {activeNearbyHotspot && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 animate-bounce">
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
            className="pixel-panel px-4 py-2 flex items-center gap-2.5 transition-transform active:scale-95 shadow-2xl cursor-pointer"
          >
            {activeNearbyHotspot.animalId && (
              <img
                src={`/assets/sprites/${activeNearbyHotspot.animalId}.png`}
                alt={activeNearbyHotspot.name}
                className="w-8 h-8 object-cover border-2 border-[#5c2c16]"
              />
            )}
            <div className="text-left">
              <div className="text-[10px] font-bold text-[#b45309] uppercase">
                {activeNearbyHotspot.name}
              </div>
              <div className="text-[8.5px] text-[#5c2c16]">
                {activeNearbyHotspot.type === 'animal' && 'TAP TO CHAT WITH ANIMAL'}
                {activeNearbyHotspot.type === 'crop' && 'TAP TO INSPECT CROP HARVEST'}
                {activeNearbyHotspot.type === 'gate' && 'TAP TO ENTER BIOME'}
                {activeNearbyHotspot.type === 'quest' && 'TAP TO START ACTION PLAN'}
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
