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
  icon: string;
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
          private windmillBlades: Phaser.GameObjects.Container | null = null;
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

                const redX = this.add.text(pointer.x, pointer.y, '⛔ Stay on Stone Path', {
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

            // Create Farmer Avatar at central farm plaza
            this.createFarmerPlayer(500, 470);

            // Initial Room Build
            this.currentRoomId = stateRef.current.currentBiome;
            this.buildRoom(this.currentRoomId);
          }

          private createFarmerPlayer(x: number, y: number) {
            this.player = this.add.container(x, y);

            // Ground shadow
            const shadow = this.add.ellipse(0, 16, 26, 12, 0x000000, 0.35);

            // Farmer aura & circle
            const aura = this.add.circle(0, 0, 22, 0x10b981, 0.25);
            this.tweens.add({ targets: aura, scale: 1.25, alpha: 0.1, duration: 800, yoyo: true, repeat: -1 });

            const baseCircle = this.add.circle(0, 0, 15, 0x0284c7, 1);
            baseCircle.setStrokeStyle(2, 0xffffff);

            const emoji = this.add.text(0, -3, '👨‍🌾', { fontSize: '22px' }).setOrigin(0.5);

            this.player.add([shadow, aura, baseCircle, emoji]);
            this.physics.add.existing(this.player);

            this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
            this.playerBody.setCircle(14, -14, -14);
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
                this.teleportPlayer(500, 600);
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
            this.windmillBlades = null;
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
          // 🏡 MAXIMALIST CENTRAL BAYER FARM (GARDENSCAPES / HAY DAY STYLE)
          // ===============================================================
          private buildMaximalistFarmRoom() {
            const w = this.canvasW;
            const h = this.canvasH;
            const isFarmRestored = (stateRef.current.restoration['clearing'] || 0) >= 80;

            // 1. Lush Green Lawn Base with diagonal mowing stripes
            const lawn = this.add.graphics();
            lawn.fillStyle(isFarmRestored ? 0x48bb78 : 0x27272a, 1);
            lawn.fillRect(0, 0, w, h);

            lawn.fillStyle(isFarmRestored ? 0x38a169 : 0x212124, 0.45);
            for (let i = -w; i < w * 2; i += 70) {
              lawn.fillTriangle(i, 0, i + 35, 0, i + h + 35, h);
              lawn.fillTriangle(i, 0, i + h + 35, h, i + h, h);
            }
            this.worldContainer.add(lawn);

            // 2. Strict Walkable Flagstone Path Network (Every gate is inside!)
            this.pathPolygons = [
              // Central Main Plaza
              new Phaser.Geom.Rectangle(420, 350, 160, 170),
              // Main Horizontal Highway (reaching Lake on West, Grasslands on East)
              new Phaser.Geom.Rectangle(50, 430, 900, 75),
              // Main Vertical Grand Avenue (reaching Tundra on North, Reefs on South)
              new Phaser.Geom.Rectangle(460, 90, 80, 600),
              // Northwest Branch (reaching Forest gate & House)
              new Phaser.Geom.Rectangle(100, 220, 380, 70),
              new Phaser.Geom.Rectangle(100, 140, 75, 160),
              // Northeast Branch (reaching Barn, Windmill, Wheat)
              new Phaser.Geom.Rectangle(520, 220, 380, 70),
              new Phaser.Geom.Rectangle(760, 140, 75, 160),
              // Southwest Branch (reaching Corn & Pool)
              new Phaser.Geom.Rectangle(180, 480, 75, 170),
              new Phaser.Geom.Rectangle(180, 610, 300, 70),
              // Southeast Branch (reaching Desert gate & Melons)
              new Phaser.Geom.Rectangle(750, 480, 75, 170),
              new Phaser.Geom.Rectangle(520, 610, 410, 70),
            ];

            // Render Flagstone Slabs on all paths
            this.renderFlagstonePaths();

            // 3. Buildings & Architecture
            this.renderCottageHouse(240, 165);
            this.renderRedBarn(500, 115);
            this.renderWindmill(820, 125);
            this.renderSwimmingPool(140, 540);

            // 4. White Picket Fences bordering paths
            this.renderPicketFences();

            // 5. Six Dedicated Crop Fields along paths
            this.renderFarmCropField(270, 395, 'lake', '🌽', '🥀', 'Sweet Golden Corn', 'Lake Water Polluted');
            this.renderFarmCropField(180, 195, 'forest', '🍎', '🪵', 'Apple Orchard', 'Wildfire Smoke Blight');
            this.renderFarmCropField(720, 195, 'tundra', '🌾', '🍂', 'Glacial Winter Wheat', 'Coal Soot Fallout');
            this.renderFarmCropField(820, 395, 'grasslands', '🌻', '🥀', 'Pollinator Sunflowers', 'Pesticide & Topsoil Loss');
            this.renderFarmCropField(740, 580, 'desert', '🍈', '🏜️', 'Sugar Melons', 'Aquifer Depleted');
            this.renderFarmCropField(400, 620, 'reefs', '🌱', '🌊', 'Tidal Rice & Kelp', 'Boat Propellers & Oil');

            // 6. Maximalist Gardenscapes Props (Trees, Flowerbeds, Arches, Benches)
            this.renderGardenProps();

            // 7. Interactive Directional Signs right at the path ends!
            this.renderPathGateSigns();
          }

          private renderFlagstonePaths() {
            const gfx = this.add.graphics();

            // Terracotta brick border
            gfx.fillStyle(0xb45309, 0.9);
            this.pathPolygons.forEach((poly) => {
              gfx.fillRoundedRect(poly.x - 4, poly.y - 4, poly.width + 8, poly.height + 8, 8);
            });

            // Light-grey flagstone slabs
            gfx.fillStyle(0xe2e8f0, 1);
            this.pathPolygons.forEach((poly) => {
              gfx.fillRoundedRect(poly.x, poly.y, poly.width, poly.height, 6);
            });

            // Stone slab mortar lines
            gfx.lineStyle(2, 0x94a3b8, 0.6);
            this.pathPolygons.forEach((poly) => {
              for (let px = poly.x + 24; px < poly.x + poly.width; px += 26) {
                gfx.lineBetween(px, poly.y + 2, px, poly.y + poly.height - 2);
              }
              for (let py = poly.y + 22; py < poly.y + poly.height; py += 24) {
                gfx.lineBetween(poly.x + 2, py, poly.x + poly.width - 2, py);
              }
            });

            this.worldContainer.add(gfx);
          }

          private renderCottageHouse(x: number, y: number) {
            const container = this.add.container(x, y);
            container.add(this.add.ellipse(0, 36, 110, 24, 0x000000, 0.3));

            const walls = this.add.rectangle(0, 10, 96, 60, 0xd97706).setStrokeStyle(2, 0x78350f);
            const roof = this.add.triangle(0, -32, -60, 14, 60, 14, 0, -32, 0x2563eb).setStrokeStyle(2, 0x1e3a8a);
            const door = this.add.rectangle(0, 24, 20, 32, 0x451a03);
            const w1 = this.add.rectangle(-26, 8, 16, 18, 0xbae6fd).setStrokeStyle(2, 0xffffff);
            const w2 = this.add.rectangle(26, 8, 16, 18, 0xbae6fd).setStrokeStyle(2, 0xffffff);
            const flowers = this.add.rectangle(26, 20, 20, 6, 0xfacc15);

            container.add([walls, roof, door, w1, w2, flowers]);
            this.worldContainer.add(container);
          }

          private renderRedBarn(x: number, y: number) {
            const container = this.add.container(x, y);
            container.add(this.add.ellipse(0, 40, 120, 26, 0x000000, 0.3));

            const barnBody = this.add.rectangle(0, 10, 100, 65, 0xb91c1c).setStrokeStyle(2, 0xffffff);
            const roof = this.add.triangle(0, -34, -58, 14, 58, 14, 0, -34, 0x991b1b).setStrokeStyle(2, 0xffffff);
            const barnDoor = this.add.rectangle(0, 24, 30, 38, 0x450a0a).setStrokeStyle(2, 0xfef08a);
            const silo = this.add.rectangle(65, 8, 30, 70, 0x94a3b8).setStrokeStyle(2, 0xe2e8f0);
            const dome = this.add.arc(65, -27, 15, 180, 360, false, 0x64748b).setStrokeStyle(2, 0xe2e8f0);

            container.add([silo, dome, barnBody, roof, barnDoor]);
            this.worldContainer.add(container);
          }

          private renderWindmill(x: number, y: number) {
            const container = this.add.container(x, y);
            container.add(this.add.ellipse(0, 40, 70, 20, 0x000000, 0.3));

            const tower = this.add.triangle(0, 10, -26, 35, 26, 35, 0, -35, 0x78716c).setStrokeStyle(2, 0xffffff);
            this.windmillBlades = this.add.container(0, -25);
            this.windmillBlades.add([
              this.add.rectangle(0, 0, 6, 68, 0xf5f5f4),
              this.add.rectangle(0, 0, 68, 6, 0xf5f5f4),
            ]);
            container.add([tower, this.windmillBlades]);

            this.tweens.add({
              targets: this.windmillBlades,
              angle: 360,
              duration: 4000,
              repeat: -1,
            });

            this.worldContainer.add(container);
          }

          private renderSwimmingPool(x: number, y: number) {
            const container = this.add.container(x, y);
            const patio = this.add.rectangle(0, 0, 110, 80, 0xd97706).setStrokeStyle(3, 0xb45309);
            const water = this.add.rectangle(0, 0, 94, 64, 0x06b6d4).setStrokeStyle(2, 0x38bdf8);
            const floatie = this.add.text(-15, -10, '🟡', { fontSize: '18px' }).setOrigin(0.5);
            const board = this.add.rectangle(35, 0, 24, 8, 0xffffff);

            container.add([patio, water, floatie, board]);
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

            // Fences bordering the main highway
            drawFenceSegment(60, 424, 410, 424);
            drawFenceSegment(590, 424, 940, 424);
            drawFenceSegment(60, 510, 410, 510);
            drawFenceSegment(590, 510, 940, 510);

            // Fences along vertical avenue
            drawFenceSegment(454, 150, 454, 340);
            drawFenceSegment(546, 150, 546, 340);

            this.worldContainer.add(gfx);
          }

          private renderFarmCropField(
            x: number,
            y: number,
            biome: Exclude<BiomeId, 'clearing'>,
            flourishIcon: string,
            deadIcon: string,
            cropName: string,
            crisisNotice: string
          ) {
            const isFlourished = (stateRef.current.restoration[biome] || 0) >= 80;
            const container = this.add.container(x, y);

            // Soil Bed
            const soil = this.add.rectangle(0, 0, 116, 68, isFlourished ? 0x3f2e1e : 0x1f1f23);
            soil.setStrokeStyle(2, isFlourished ? 0x22c55e : 0xd97706);

            // Crop Label Tag
            const title = this.add.text(0, -26, isFlourished ? `✨ ${cropName}` : `⚠️ ${cropName}`, {
              fontSize: '10px',
              fontStyle: 'bold',
              fontFamily: 'system-ui',
              color: isFlourished ? '#86efac' : '#fef08a',
              backgroundColor: '#09090bf0',
              padding: { x: 5, y: 2 },
            }).setOrigin(0.5);

            container.add([soil, title]);

            // Stalks
            for (let i = 0; i < 3; i++) {
              const sx = -30 + i * 30;
              const emoji = this.add.text(sx, 4, isFlourished ? flourishIcon : deadIcon, {
                fontSize: '22px',
              }).setOrigin(0.5);

              if (isFlourished) {
                this.tweens.add({
                  targets: emoji,
                  angle: { from: -4, to: 4 },
                  duration: 1200 + i * 200,
                  yoyo: true,
                  repeat: -1,
                });
              }
              container.add(emoji);
            }

            // Subtitle
            const sub = this.add.text(0, 25, isFlourished ? 'Harvest Thriving' : crisisNotice, {
              fontSize: '8px',
              fontFamily: 'system-ui',
              color: isFlourished ? '#4ade80' : '#f87171',
            }).setOrigin(0.5);
            container.add(sub);

            container.setSize(116, 68);
            soil.setInteractive({ useHandCursor: true });
            soil.on('pointerdown', () => {
              sounds.playClick();
              stateRef.current.setCurrentBiome(biome);
            });

            this.worldContainer.add(container);

            this.currentHotspots.push({
              id: `crop_${biome}`,
              name: `${cropName} (${isFlourished ? 'Thriving' : 'Failing'})`,
              x,
              y,
              icon: isFlourished ? flourishIcon : deadIcon,
              type: 'crop',
              targetBiome: biome,
            });
          }

          private renderGardenProps() {
            this.addAppleTree(130, 340);
            this.addAppleTree(360, 310);
            this.addAppleTree(640, 310);
            this.addAppleTree(880, 280);

            this.addFlowerBed(320, 415, '🌼');
            this.addFlowerBed(680, 415, '🌻');
            this.addFlowerBed(320, 520, '🌷');
            this.addFlowerBed(680, 520, '🌼');

            // Mushroom table & stools
            const mTable = this.add.container(700, 330);
            mTable.add([
              this.add.circle(0, 0, 14, 0xef4444).setStrokeStyle(2, 0xffffff),
              this.add.text(0, -1, '🍄', { fontSize: '18px' }).setOrigin(0.5),
            ]);
            this.worldContainer.add(mTable);

            // Bicycles parked
            const bike = this.add.text(440, 420, '🚲', { fontSize: '18px' }).setOrigin(0.5);
            this.worldContainer.add(bike);

            // Picnic table with red cloth
            const picnic = this.add.container(850, 595);
            picnic.add([
              this.add.rectangle(0, 0, 36, 24, 0xd97706),
              this.add.rectangle(0, 0, 30, 18, 0xef4444).setStrokeStyle(1, 0xffffff),
            ]);
            this.worldContainer.add(picnic);

            // Street lamps
            this.addStreetLamp(455, 330);
            this.addStreetLamp(545, 330);
            this.addStreetLamp(455, 525);
            this.addStreetLamp(545, 525);

            // Rose Trellis Arch across the path
            const arch = this.add.container(500, 350);
            const archFrame = this.add.arc(0, 0, 28, 180, 360, false, 0xffffff).setStrokeStyle(3, 0xffffff);
            const roses = this.add.text(0, -28, '🌹🌹🌹', { fontSize: '12px' }).setOrigin(0.5);
            arch.add([archFrame, roses]);
            this.worldContainer.add(arch);
          }

          private addAppleTree(x: number, y: number) {
            const container = this.add.container(x, y);
            container.add(this.add.ellipse(0, 22, 40, 14, 0x000000, 0.3));
            container.add(this.add.rectangle(0, 12, 10, 26, 0x451a03));
            container.add(this.add.circle(0, -6, 26, 0x16a34a).setStrokeStyle(1.5, 0x22c55e));
            container.add(this.add.circle(-10, -12, 16, 0x15803d));
            container.add(this.add.circle(10, -12, 16, 0x15803d));
            container.add(this.add.text(-8, -8, '🍎', { fontSize: '11px' }).setOrigin(0.5));
            container.add(this.add.text(8, -12, '🍎', { fontSize: '11px' }).setOrigin(0.5));
            container.add(this.add.text(0, 4, '🍎', { fontSize: '11px' }).setOrigin(0.5));
            this.worldContainer.add(container);
          }

          private addFlowerBed(x: number, y: number, flowerEmoji: string) {
            const bed = this.add.container(x, y);
            bed.add(this.add.rectangle(0, 0, 55, 12, 0x3f2e1e).setStrokeStyle(1, 0x78350f));
            for (let i = -18; i <= 18; i += 12) {
              bed.add(this.add.text(i, -2, flowerEmoji, { fontSize: '12px' }).setOrigin(0.5));
            }
            this.worldContainer.add(bed);
          }

          private addStreetLamp(x: number, y: number) {
            const lamp = this.add.container(x, y);
            lamp.add(this.add.rectangle(0, 0, 3, 24, 0x1e3a8a));
            lamp.add(this.add.circle(0, -14, 6, 0xfef08a, 0.9).setStrokeStyle(1, 0x1e3a8a));
            this.worldContainer.add(lamp);
          }

          private renderPathGateSigns() {
            this.createGateSign(75, 465, 'lake', '⬅️ LAKE (🌽 Corn)');
            this.createGateSign(130, 160, 'forest', '↖️ FOREST (🍎 Apples)');
            this.createGateSign(500, 115, 'tundra', '⬆️ TUNDRA (🌾 Wheat)');
            this.createGateSign(925, 465, 'grasslands', '➡️ PRAIRIE (🌻 Sunflowers)');
            this.createGateSign(900, 645, 'desert', '↘️ DESERT (🍈 Melons)');
            this.createGateSign(500, 660, 'reefs', '⬇️ REEFS (🌱 Rice)');
          }

          private createGateSign(x: number, y: number, targetBiome: BiomeId, label: string) {
            const container = this.add.container(x, y);

            const bg = this.add.rectangle(0, 0, 136, 30, 0x18181b, 0.95);
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
              icon: '🚪',
              type: 'gate',
              targetBiome,
            });
          }

          // ===============================================================
          // 🗺️ MAXIMALIST BIOME ROOMS (LAKE, FOREST, TUNDRA, ETC.)
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

            // 2. Render Flagstone Boardwalk / Path
            this.renderFlagstonePaths();

            // 3. Fences along path sides
            const fenceGfx = this.add.graphics();
            fenceGfx.fillStyle(0xffffff, 0.9);
            fenceGfx.fillRect(426, 170, 4, 500);
            fenceGfx.fillRect(570, 170, 4, 500);
            this.worldContainer.add(fenceGfx);

            // 4. Biome-Specific Maximalist Foreground Elements
            if (biome === 'lake') this.renderLakeForeground(isRestored);
            else if (biome === 'forest') this.renderForestForeground(isRestored);
            else if (biome === 'tundra') this.renderTundraForeground(isRestored);
            else if (biome === 'grasslands') this.renderGrasslandsForeground(isRestored);
            else if (biome === 'desert') this.renderDesertForeground(isRestored);
            else if (biome === 'reefs') this.renderReefsForeground(isRestored);

            // 5. Endangered Animal Friend at Center (500, 330)
            const animalId = this.getAnimalForBiome(biome);
            if (animalId) {
              this.spawnBiomeAnimal(animalId, 500, 330);
            }

            // 6. Action Plan Quest Station at (500, 180)
            this.spawnBiomeQuestStation(biome, isRestored);

            // 7. Return to Farm Gate at Bottom (500, 670)
            const returnSign = this.add.container(500, 670);
            const returnBg = this.add.rectangle(0, 0, 250, 36, 0x18181b, 0.95).setStrokeStyle(2, 0xf59e0b);
            const returnText = this.add.text(0, 0, '🏡 RETURN TO CENTRAL FARM', {
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
              icon: '🏡',
              type: 'gate',
              targetBiome: 'clearing',
            });
          }

          // --- BIOME FOREGROUND GENERATORS ---
          private renderLakeForeground(isRestored: boolean) {
            if (!isRestored) {
              // Floating plastics, oil barrels, murky sludge
              const trash = ['🛢️', '🧴', '📦', '🗑️', '☣️'];
              trash.forEach((icon, i) => {
                const t = this.add.text(120 + i * 180, 220 + (i % 2) * 260, icon, { fontSize: '28px' }).setOrigin(0.5);
                this.tweens.add({ targets: t, y: t.y - 10, duration: 1500 + i * 200, yoyo: true, repeat: -1 });
                this.worldContainer.add(t);
              });
              const notice = this.add.text(250, 140, '☣️ TOXIC RUNOFF: Plastics & heavy metals choke water feeding corn fields!', {
                fontSize: '11px',
                fontStyle: 'bold',
                fontFamily: 'system-ui',
                color: '#f87171',
                backgroundColor: '#450a0aee',
                padding: { x: 8, y: 4 },
              });
              this.worldContainer.add(notice);
            } else {
              // Water lilies, blooming lotus, clean water intake station
              ['🪷', '🌸', '🪷', '🌸', '🦆'].forEach((icon, i) => {
                const f = this.add.text(120 + i * 180, 220 + (i % 2) * 260, icon, { fontSize: '26px' }).setOrigin(0.5);
                this.tweens.add({ targets: f, angle: { from: -5, to: 5 }, duration: 2000, yoyo: true, repeat: -1 });
                this.worldContainer.add(f);
              });
              const pump = this.add.container(260, 220);
              pump.add([
                this.add.rectangle(0, 0, 90, 40, 0x0284c7).setStrokeStyle(2, 0x38bdf8),
                this.add.text(0, -6, '💧 Eco-Pump', { fontSize: '10px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5),
                this.add.text(0, 8, 'Watering Sweet Corn', { fontSize: '8px', color: '#bae6fd' }).setOrigin(0.5),
              ]);
              this.worldContainer.add(pump);
            }
          }

          private renderForestForeground(isRestored: boolean) {
            if (!isRestored) {
              ['🔥', '🪵', '🔥', '🪵', '⚠️'].forEach((icon, i) => {
                const f = this.add.text(130 + i * 180, 220 + (i % 2) * 260, icon, { fontSize: '28px' }).setOrigin(0.5);
                this.worldContainer.add(f);
              });
              const notice = this.add.text(260, 140, '🔥 WILDFIRE EMERGENCY: Dense smoke & ash blocking sun to apple orchard!', {
                fontSize: '11px',
                fontStyle: 'bold',
                fontFamily: 'system-ui',
                color: '#f87171',
                backgroundColor: '#450a0aee',
                padding: { x: 8, y: 4 },
              });
              this.worldContainer.add(notice);
            } else {
              ['🌲', '🌳', '🌸', '🍄', '🐦'].forEach((icon, i) => {
                const f = this.add.text(130 + i * 180, 220 + (i % 2) * 260, icon, { fontSize: '30px' }).setOrigin(0.5);
                this.worldContainer.add(f);
              });
              const nursery = this.add.container(260, 220);
              nursery.add([
                this.add.rectangle(0, 0, 95, 40, 0x16a34a).setStrokeStyle(2, 0x86efac),
                this.add.text(0, -6, '🌲 Pioneer Saplings', { fontSize: '9px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5),
                this.add.text(0, 8, 'Canopy Restored!', { fontSize: '8px', color: '#bbf7d0' }).setOrigin(0.5),
              ]);
              this.worldContainer.add(nursery);
            }
          }

          private renderTundraForeground(isRestored: boolean) {
            if (!isRestored) {
              ['🏭', '🛢️', '🏭', '🛢️', '☠️'].forEach((icon, i) => {
                const f = this.add.text(130 + i * 180, 220 + (i % 2) * 260, icon, { fontSize: '28px' }).setOrigin(0.5);
                this.worldContainer.add(f);
              });
              const notice = this.add.text(240, 140, '🏭 COAL PLANT SOOT: Acid ash falling on permafrost & killing winter wheat!', {
                fontSize: '11px',
                fontStyle: 'bold',
                fontFamily: 'system-ui',
                color: '#f87171',
                backgroundColor: '#450a0aee',
                padding: { x: 8, y: 4 },
              });
              this.worldContainer.add(notice);
            } else {
              ['❄️', '💎', '🎄', '🌬️', '✨'].forEach((icon, i) => {
                const f = this.add.text(130 + i * 180, 220 + (i % 2) * 260, icon, { fontSize: '28px' }).setOrigin(0.5);
                this.worldContainer.add(f);
              });
              const turbine = this.add.container(260, 220);
              turbine.add([
                this.add.rectangle(0, 0, 95, 40, 0x0284c7).setStrokeStyle(2, 0x38bdf8),
                this.add.text(0, -6, '⚡ Clean Energy', { fontSize: '10px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5),
                this.add.text(0, 8, 'Wheat Ground Pure', { fontSize: '8px', color: '#bae6fd' }).setOrigin(0.5),
              ]);
              this.worldContainer.add(turbine);
            }
          }

          private renderGrasslandsForeground(isRestored: boolean) {
            if (!isRestored) {
              ['☠️', '🛢️', '🥀', '🏜️', '⚠️'].forEach((icon, i) => {
                const f = this.add.text(130 + i * 180, 220 + (i % 2) * 260, icon, { fontSize: '28px' }).setOrigin(0.5);
                this.worldContainer.add(f);
              });
              const notice = this.add.text(240, 140, '☠️ CHEMICAL TOXICITY: Overspray wiped out pollinators & sunflower seeds!', {
                fontSize: '11px',
                fontStyle: 'bold',
                fontFamily: 'system-ui',
                color: '#f87171',
                backgroundColor: '#450a0aee',
                padding: { x: 8, y: 4 },
              });
              this.worldContainer.add(notice);
            } else {
              ['🌻', '🪻', '🦋', '🐝', '🌾'].forEach((icon, i) => {
                const f = this.add.text(130 + i * 180, 220 + (i % 2) * 260, icon, { fontSize: '30px' }).setOrigin(0.5);
                this.worldContainer.add(f);
              });
              const sensor = this.add.container(260, 220);
              sensor.add([
                this.add.rectangle(0, 0, 105, 40, 0x15803d).setStrokeStyle(2, 0x4ade80),
                this.add.text(0, -6, '📡 Bayer Smart Farm', { fontSize: '9px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5),
                this.add.text(0, 8, 'Precision Drip & Sensors', { fontSize: '8px', color: '#bbf7d0' }).setOrigin(0.5),
              ]);
              this.worldContainer.add(sensor);
            }
          }

          private renderDesertForeground(isRestored: boolean) {
            if (!isRestored) {
              ['🦴', '🏜️', '🥀', '💨', '⚠️'].forEach((icon, i) => {
                const f = this.add.text(130 + i * 180, 220 + (i % 2) * 260, icon, { fontSize: '28px' }).setOrigin(0.5);
                this.worldContainer.add(f);
              });
              const notice = this.add.text(260, 140, '🏜️ SEVERE DROUGHT: Aquifers depleted, melon vines withered and dying!', {
                fontSize: '11px',
                fontStyle: 'bold',
                fontFamily: 'system-ui',
                color: '#f87171',
                backgroundColor: '#450a0aee',
                padding: { x: 8, y: 4 },
              });
              this.worldContainer.add(notice);
            } else {
              ['🌴', '💧', '🍈', '🌸', '✨'].forEach((icon, i) => {
                const f = this.add.text(130 + i * 180, 220 + (i % 2) * 260, icon, { fontSize: '30px' }).setOrigin(0.5);
                this.worldContainer.add(f);
              });
              const oasis = this.add.container(260, 220);
              oasis.add([
                this.add.rectangle(0, 0, 95, 40, 0xd97706).setStrokeStyle(2, 0xfde047),
                this.add.text(0, -6, '💧 Living Oasis', { fontSize: '10px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5),
                this.add.text(0, 8, 'Sugar Melons Growing', { fontSize: '8px', color: '#fef08a' }).setOrigin(0.5),
              ]);
              this.worldContainer.add(oasis);
            }
          }

          private renderReefsForeground(isRestored: boolean) {
            if (!isRestored) {
              ['⚓', '🛢️', '🚤', '☠️', '⚠️'].forEach((icon, i) => {
                const f = this.add.text(130 + i * 180, 220 + (i % 2) * 260, icon, { fontSize: '28px' }).setOrigin(0.5);
                this.worldContainer.add(f);
              });
              const notice = this.add.text(240, 140, '🚤 SPEEDBOAT WAKES: Propellers destroying reef & smothering tidal rice!', {
                fontSize: '11px',
                fontStyle: 'bold',
                fontFamily: 'system-ui',
                color: '#f87171',
                backgroundColor: '#450a0aee',
                padding: { x: 8, y: 4 },
              });
              this.worldContainer.add(notice);
            } else {
              ['🪸', '🐠', '🐟', '🌊', '✨'].forEach((icon, i) => {
                const f = this.add.text(130 + i * 180, 220 + (i % 2) * 260, icon, { fontSize: '28px' }).setOrigin(0.5);
                this.worldContainer.add(f);
              });
              const buoy = this.add.container(260, 220);
              buoy.add([
                this.add.rectangle(0, 0, 105, 40, 0x0891b2).setStrokeStyle(2, 0x67e8f9),
                this.add.text(0, -6, '🧭 Sanctuary Zone', { fontSize: '9px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5),
                this.add.text(0, 8, 'Tidal Rice Thriving', { fontSize: '8px', color: '#cffafe' }).setOrigin(0.5),
              ]);
              this.worldContainer.add(buoy);
            }
          }

          private spawnBiomeQuestStation(biome: BiomeId, isRestored: boolean) {
            const container = this.add.container(500, 180);

            const questMap: Record<BiomeId, { name: string; icon: string; action: any }> = {
              lake: { name: 'Circular Waste Recycling Quiz', icon: '♻️', action: 'lake_quiz' },
              forest: { name: 'Fire Prevention & Email Campaign', icon: '🚒', action: 'forest_post' },
              tundra: { name: 'Coal Plant Shutdown Petition', icon: '⚡', action: 'tundra_petition' },
              grasslands: { name: 'Bayer Smart Precision Simulator', icon: '🚜', action: 'grasslands_petition' },
              desert: { name: 'Aquifer Restoration & Quench', icon: '💧', action: 'wildfire_quench' },
              reefs: { name: 'Maritime GPS Radar Redirection', icon: '🧭', action: 'reef_divert' },
              clearing: { name: 'Restore Habitats', icon: '🏡', action: null },
            };

            const qInfo = questMap[biome];
            if (!qInfo || !qInfo.action) return;

            const bg = this.add.rectangle(0, 0, 260, 34, 0x18181b, 0.95);
            bg.setStrokeStyle(2, isRestored ? 0x22c55e : 0xf59e0b);

            const text = this.add.text(
              0,
              0,
              isRestored ? `✅ ${qInfo.name} Completed` : `🎯 Take Action: ${qInfo.name}`,
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
              icon: qInfo.icon,
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

            const glow = this.add.circle(0, 0, 46, 0x10b981, 0.35);
            this.tweens.add({ targets: glow, scale: 1.35, alpha: 0.1, duration: 900, yoyo: true, repeat: -1 });

            const bubble = this.add.circle(0, 0, 36, 0x09090b, 0.95).setStrokeStyle(3, 0x10b981);
            const emoji = this.add.text(0, -2, info.avatar, { fontSize: '40px' }).setOrigin(0.5);

            const tag = this.add.text(0, 52, `💬 Talk to ${info.name} • ${info.species}`, {
              fontSize: '12px',
              fontStyle: 'bold',
              fontFamily: 'system-ui',
              color: '#ffffff',
              backgroundColor: '#09090bf0',
              padding: { x: 10, y: 4 },
            }).setOrigin(0.5);

            container.add([glow, bubble, emoji, tag]);

            bubble.setInteractive({ useHandCursor: true });
            bubble.on('pointerdown', () => {
              sounds.playClick();
              stateRef.current.openDialogue(animalId);
            });

            this.worldContainer.add(container);

            this.currentHotspots.push({
              id: `animal_${animalId}`,
              name: `Talk to ${info.name}`,
              x,
              y,
              icon: info.avatar,
              type: 'animal',
              animalId,
            });
          }

          update() {
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
            } else {
              this.playerBody.setVelocity(0, 0);
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
            <span>Stay on the stone paths! Picket fences protect the farm crops and flowers.</span>
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

      {/* Proximity Interaction Prompt */}
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
            <span className="text-2xl">{activeNearbyHotspot.icon}</span>
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
        <span>WASD / Arrow Keys or Click on stone paths • Stay on the pathways</span>
      </div>
    </div>
  );
}
