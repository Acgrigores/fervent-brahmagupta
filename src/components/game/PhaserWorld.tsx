'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { BiomeId, AnimalId } from '@/types/game';
import { ANIMALS, BIOMES_INFO, FARM_CROPS } from '@/data/animals';
import { sounds } from '@/utils/soundEffects';
import { MessageSquare, Sparkles, Footprints, ArrowLeft, ArrowRight } from 'lucide-react';

export default function PhaserWorld() {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<any>(null);
  const {
    currentBiome,
    setCurrentBiome,
    restoration,
    openDialogue,
    openQuestModal,
    quests,
  } = useGameState();

  const [nearbyAnimal, setNearbyAnimal] = useState<AnimalId | null>(null);

  const stateRef = useRef({
    currentBiome,
    restoration,
    openDialogue,
    setCurrentBiome,
    openQuestModal,
  });

  useEffect(() => {
    stateRef.current = {
      currentBiome,
      restoration,
      openDialogue,
      setCurrentBiome,
      openQuestModal,
    };
  }, [currentBiome, restoration, openDialogue, setCurrentBiome, openQuestModal]);

  // Listen for biome room changes and tell Phaser scene to transition rooms!
  useEffect(() => {
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('RoomWorldScene');
      if (scene && typeof scene.changeRoom === 'function') {
        scene.changeRoom(currentBiome);
      }
    }
  }, [currentBiome]);

  useEffect(() => {
    let isMounted = true;

    async function initPhaser() {
      if (typeof window === 'undefined' || !containerRef.current) return;
      if (phaserGameRef.current) return;

      const Phaser = (await import('phaser')).default;

      class RoomWorldScene extends Phaser.Scene {
        private player!: Phaser.GameObjects.Arc;
        private playerGlow!: Phaser.GameObjects.Arc;
        private playerEmoji!: Phaser.GameObjects.Text;
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
        private currentRoomId: BiomeId = 'clearing';
        private roomContainer!: Phaser.GameObjects.Container;
        private interactivePortals: { x: number; y: number; radius: number; targetBiome: BiomeId }[] = [];
        private currentAnimalObj: { id: AnimalId; x: number; y: number } | null = null;
        private speed: number = 320;
        private roomWidth: number = 1280;
        private roomHeight: number = 760;

        constructor() {
          super({ key: 'RoomWorldScene' });
        }

        create() {
          this.roomWidth = 1280;
          this.roomHeight = 760;

          this.physics.world.setBounds(0, 0, this.roomWidth, this.roomHeight);
          this.cameras.main.setBounds(0, 0, this.roomWidth, this.roomHeight);

          // Room container holds all static and dynamic elements of current room
          this.roomContainer = this.add.container(0, 0);

          // Setup Inputs
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

          // Click / Tap to move
          this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.moveTarget = { x: pointer.x, y: pointer.y };

            const ripple = this.add.circle(pointer.x, pointer.y, 8, 0x10b981, 0.8);
            this.tweens.add({
              targets: ripple,
              scale: 2.5,
              alpha: 0,
              duration: 350,
              onComplete: () => ripple.destroy(),
            });
          });

          // Create player
          this.createPlayer(640, 480);

          // Build initial room
          this.buildRoom(stateRef.current.currentBiome);
        }

        private createPlayer(x: number, y: number) {
          this.playerGlow = this.add.circle(x, y, 32, 0x10b981, 0.3);
          this.tweens.add({
            targets: this.playerGlow,
            scale: 1.3,
            alpha: 0.15,
            duration: 800,
            yoyo: true,
            repeat: -1,
          });

          this.player = this.add.circle(x, y, 20, 0x10b981, 1);
          this.player.setStrokeStyle(3, 0xffffff, 1);
          this.physics.add.existing(this.player);

          this.playerEmoji = this.add.text(x, y - 1, '👨‍🌾', { fontSize: '22px' }).setOrigin(0.5);

          this.events.on('update', () => {
            this.playerGlow.setPosition(this.player.x, this.player.y);
            this.playerEmoji.setPosition(this.player.x, this.player.y - 1);
          });
        }

        public changeRoom(newBiome: BiomeId) {
          if (newBiome === this.currentRoomId) return;

          sounds.playBloom();
          this.cameras.main.fadeOut(250, 0, 0, 0, (_camera: any, progress: number) => {
            if (progress === 1) {
              this.currentRoomId = newBiome;
              this.buildRoom(newBiome);

              // Spawn position depending on room
              if (newBiome === 'clearing') {
                this.teleportPlayer(640, 440);
              } else {
                // In a biome room, spawn near entrance
                this.teleportPlayer(640, 640);
              }

              this.cameras.main.fadeIn(250, 0, 0, 0);
            }
          });
        }

        private teleportPlayer(x: number, y: number) {
          this.player.setPosition(x, y);
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          if (body) {
            body.reset(x, y);
          }
          this.moveTarget = null;
        }

        private buildRoom(biome: BiomeId) {
          this.roomContainer.removeAll(true);
          this.interactivePortals = [];
          this.currentAnimalObj = null;
          setNearbyAnimal(null);

          const isRestored = (stateRef.current.restoration[biome] || 0) >= 80;

          if (biome === 'clearing') {
            this.buildCentralFarmRoom();
          } else if (biome === 'forest') {
            this.buildForestRoom(isRestored);
          } else if (biome === 'lake') {
            this.buildLakeRoom(isRestored);
          } else if (biome === 'tundra') {
            this.buildTundraRoom(isRestored);
          } else if (biome === 'grasslands') {
            this.buildGrasslandsRoom(isRestored);
          } else if (biome === 'desert') {
            this.buildDesertRoom(isRestored);
          } else if (biome === 'reefs') {
            this.buildReefsRoom(isRestored);
          }
        }

        // ==========================================
        // 🏡 ROOM 0: CENTRAL BAYER FARM
        // ==========================================
        private buildCentralFarmRoom() {
          const gfx = this.add.graphics();
          const w = this.roomWidth;
          const h = this.roomHeight;

          // Ground base
          gfx.fillStyle(0x1c1917, 1);
          gfx.fillRect(0, 0, w, h);

          // Central courtyard gravel
          gfx.fillStyle(0x292524, 1);
          gfx.fillCircle(w / 2, h / 2, 280);
          gfx.lineStyle(4, 0x78716c, 0.6);
          gfx.strokeCircle(w / 2, h / 2, 280);

          this.roomContainer.add(gfx);

          // 1. Red Central Barn in background
          const barn = this.add.container(w / 2, 190);
          const barnBase = this.add.rectangle(0, 0, 150, 95, 0xb91c1c);
          barnBase.setStrokeStyle(3, 0xffffff);
          const roof = this.add.triangle(0, -68, -85, 20, 85, 20, 0, -45, 0x991b1b);
          roof.setStrokeStyle(2, 0xffffff);
          const door = this.add.rectangle(0, 20, 44, 55, 0x450a0a);
          door.setStrokeStyle(2, 0xfef08a);
          const barnTitle = this.add.text(0, -42, 'BAYER ECO-FARM HUB', {
            fontSize: '11px',
            fontStyle: 'bold',
            fontFamily: 'system-ui',
            color: '#fef08a',
            backgroundColor: '#0c0a09f0',
            padding: { x: 6, y: 2 },
          }).setOrigin(0.5);

          barn.add([barnBase, roof, door, barnTitle]);
          this.roomContainer.add(barn);

          // 2. Windmill with spinning blades
          const windmill = this.add.container(w / 2 + 180, 160);
          const millTower = this.add.triangle(0, 0, -28, 45, 28, 45, 0, -50, 0x78716c);
          millTower.setStrokeStyle(2, 0xffffff);
          const blades = this.add.container(0, -48);
          blades.add([
            this.add.rectangle(0, 0, 8, 80, 0xf5f5f4),
            this.add.rectangle(0, 0, 80, 8, 0xf5f5f4),
          ]);
          windmill.add([millTower, blades]);
          this.tweens.add({ targets: blades, angle: 360, duration: 4000, repeat: -1 });
          this.roomContainer.add(windmill);

          // 3. Central Silo
          const silo = this.add.container(w / 2 - 180, 175);
          silo.add([
            this.add.rectangle(0, 0, 50, 90, 0x94a3b8).setStrokeStyle(2, 0xe2e8f0),
            this.add.arc(0, -45, 25, 180, 360, false, 0x64748b).setStrokeStyle(2, 0xe2e8f0),
          ]);
          this.roomContainer.add(silo);

          // 4. Six Dedicated Crop Plots on the Farm!
          this.drawFarmCropPlot(w / 2 - 270, 360, 'lake', '🌽', '🥀', 'Sweet Golden Corn', 'Canal: Choked by Lake Plastics');
          this.drawFarmCropPlot(w / 2 - 270, 540, 'forest', '🍎', '🪵', 'Apple & Berry Orchard', 'Orchard: Scorched by Wildfire Ash');
          this.drawFarmCropPlot(w / 2 - 120, 620, 'tundra', '🌾', '🍂', 'Glacial Winter Wheat', 'Soil: Poisoned by Coal Soot');
          this.drawFarmCropPlot(w / 2 + 120, 620, 'grasslands', '🌻', '🥀', 'Pollinator Sunflowers', 'Meadow: Zero Monarch Bees');
          this.drawFarmCropPlot(w / 2 + 270, 540, 'desert', '🍈', '🏜️', 'Arid Sugar Melons', 'Field: Parched Drought Dust');
          this.drawFarmCropPlot(w / 2 + 270, 360, 'reefs', '🌱', '🌊', 'Coastal Tidal Rice', 'Estuary: Poisoned by Oil Slicks');

          // 5. Six Prominent, Clickable & Walkable EXIT PORTAL GATES!
          this.addFarmExitGate(110, 200, 'forest', '↖️ BAMBOO FOREST', 'Red Panda (🍎 Apples)');
          this.addFarmExitGate(110, 560, 'lake', '⬅️ CRYSTAL LAKE', 'Manatee (🌽 Corn)');
          this.addFarmExitGate(w / 2, 70, 'tundra', '⬆️ GLACIAL TUNDRA', 'Polar Bear (🌾 Wheat)');
          this.addFarmExitGate(w - 110, 200, 'desert', '↗️ SAVANNA OASIS', 'Cheetah (🍈 Melons)');
          this.addFarmExitGate(w - 110, 560, 'grasslands', '➡️ SMART PRAIRIE', 'Monarch (🌻 Sunflowers)');
          this.addFarmExitGate(w / 2, h - 60, 'reefs', '⬇️ CORAL BARRIER', 'Sea Turtle (🌱 Rice)');
        }

        private drawFarmCropPlot(
          x: number,
          y: number,
          biome: Exclude<BiomeId, 'clearing'>,
          flourishIcon: string,
          deadIcon: string,
          cropName: string,
          threatText: string
        ) {
          const isFlourished = (stateRef.current.restoration[biome] || 0) >= 80;
          const container = this.add.container(x, y);

          const plotBg = this.add.rectangle(0, 0, 160, 90, isFlourished ? 0x14532d : 0x292524, 0.95);
          plotBg.setStrokeStyle(3, isFlourished ? 0x22c55e : 0xd97706);

          const title = this.add.text(0, -32, cropName, {
            fontSize: '11px',
            fontStyle: 'bold',
            fontFamily: 'system-ui',
            color: isFlourished ? '#86efac' : '#fef08a',
          }).setOrigin(0.5);

          const sub = this.add.text(0, 30, isFlourished ? '✨ Flourishing Harvest!' : threatText, {
            fontSize: '9px',
            fontFamily: 'system-ui',
            color: isFlourished ? '#4ade80' : '#fca5a5',
          }).setOrigin(0.5);

          container.add([plotBg, title, sub]);

          // Stalks
          for (let col = 0; col < 4; col++) {
            const sx = -45 + col * 30;
            const emoji = this.add.text(sx, -2, isFlourished ? flourishIcon : deadIcon, {
              fontSize: '24px',
            }).setOrigin(0.5);
            container.add(emoji);
          }

          // Clicking plot warps directly to that biome!
          plotBg.setInteractive({ useHandCursor: true });
          plotBg.on('pointerdown', () => {
            stateRef.current.setCurrentBiome(biome);
          });

          this.roomContainer.add(container);
        }

        private addFarmExitGate(x: number, y: number, targetBiome: BiomeId, title: string, sub: string) {
          const container = this.add.container(x, y);

          const gateBg = this.add.rectangle(0, 0, 180, 54, 0x18181b, 0.95);
          gateBg.setStrokeStyle(2, 0x10b981);

          const aura = this.add.circle(0, 0, 24, 0x10b981, 0.25);
          this.tweens.add({ targets: aura, scale: 1.4, alpha: 0.05, duration: 900, yoyo: true, repeat: -1 });

          const t1 = this.add.text(0, -8, title, {
            fontSize: '11px',
            fontStyle: 'bold',
            fontFamily: 'system-ui',
            color: '#34d399',
          }).setOrigin(0.5);

          const t2 = this.add.text(0, 10, sub, {
            fontSize: '9px',
            fontFamily: 'system-ui',
            color: '#d1d5db',
          }).setOrigin(0.5);

          container.add([gateBg, aura, t1, t2]);

          gateBg.setInteractive({ useHandCursor: true });
          gateBg.on('pointerdown', () => {
            stateRef.current.setCurrentBiome(targetBiome);
          });

          this.interactivePortals.push({ x, y, radius: 55, targetBiome });
          this.roomContainer.add(container);
        }

        private addReturnGate(x: number, y: number) {
          const container = this.add.container(x, y);

          const gateBg = this.add.rectangle(0, 0, 260, 48, 0x18181b, 0.95);
          gateBg.setStrokeStyle(2, 0xf59e0b);

          const t1 = this.add.text(0, -6, '🏡 RETURN TO CENTRAL FARM', {
            fontSize: '11px',
            fontStyle: 'bold',
            fontFamily: 'system-ui',
            color: '#fbbf24',
          }).setOrigin(0.5);

          const t2 = this.add.text(0, 10, 'Check Crop Health & Harvest Status', {
            fontSize: '9px',
            fontFamily: 'system-ui',
            color: '#a1a1aa',
          }).setOrigin(0.5);

          container.add([gateBg, t1, t2]);

          gateBg.setInteractive({ useHandCursor: true });
          gateBg.on('pointerdown', () => {
            stateRef.current.setCurrentBiome('clearing');
          });

          this.interactivePortals.push({ x, y, radius: 65, targetBiome: 'clearing' });
          this.roomContainer.add(container);
        }

        // ==========================================
        // 🎋 ROOM 1: BAMBOO FOREST (RED PANDA)
        // ==========================================
        private buildForestRoom(isRestored: boolean) {
          const gfx = this.add.graphics();
          const w = this.roomWidth;
          const h = this.roomHeight;

          gfx.fillStyle(isRestored ? 0x064e3b : 0x1c1917, 1);
          gfx.fillRect(0, 0, w, h);
          this.roomContainer.add(gfx);

          // Maximalist conifer & bamboo trees
          for (let i = 0; i < 45; i++) {
            const tx = 60 + Math.random() * (w - 120);
            const ty = 80 + Math.random() * (h - 220);

            if (isRestored) {
              const tree = this.add.container(tx, ty);
              tree.add([
                this.add.rectangle(0, 14, 10, 28, 0x451a03),
                this.add.triangle(0, -8, -25, 22, 25, 22, 0, -32, 0x15803d).setStrokeStyle(1, 0x22c55e),
              ]);
              this.roomContainer.add(tree);
            } else {
              // Charred dead skeletal tree
              const deadTree = this.add.container(tx, ty);
              deadTree.add([
                this.add.rectangle(0, 0, 10, 36, 0x262626),
                this.add.line(0, -10, -14, -10, 14, 10, 0x404040),
                this.add.circle(0, 16, 4, 0xf97316, 0.8), // burning ember
              ]);
              this.roomContainer.add(deadTree);
            }
          }

          // Paku the Red Panda in the clearing center
          this.spawnRoomAnimal('red_panda', w / 2, 340);

          // Status & Quest Banner
          this.addRoomBanner(w / 2, 100, 'BAMBOO CANOPY FOREST', 'Habitats Threatened by Megablazes • Revives Farm Apple Orchard 🍎');

          // Return gate at bottom
          this.addReturnGate(w / 2, h - 50);
        }

        // ==========================================
        // 💧 ROOM 2: CRYSTAL LAKE (MANATEE)
        // ==========================================
        private buildLakeRoom(isRestored: boolean) {
          const gfx = this.add.graphics();
          const w = this.roomWidth;
          const h = this.roomHeight;

          // Lake water body
          gfx.fillStyle(isRestored ? 0x0284c7 : 0x2e1065, 1);
          gfx.fillRect(0, 0, w, h);

          // Lake water ripples
          gfx.fillStyle(isRestored ? 0x38bdf8 : 0x3b0764, 0.85);
          gfx.fillCircle(w / 2, h / 2 - 40, 320);

          this.roomContainer.add(gfx);

          // Maximalist flora / pollution
          for (let i = 0; i < 35; i++) {
            const lx = 80 + Math.random() * (w - 160);
            const ly = 120 + Math.random() * (h - 260);

            if (isRestored) {
              const lily = this.add.circle(lx, ly, 14, 0x059669, 0.9).setStrokeStyle(2, 0x34d399);
              const flower = this.add.text(lx, ly, '🪷', { fontSize: '16px' }).setOrigin(0.5);
              this.roomContainer.add([lily, flower]);
            } else {
              // Floating plastic bottles & toxic algae scum
              const trash = this.add.text(lx, ly, ['🥤', '🧴', '☣️', '🪣'][Math.floor(Math.random() * 4)], {
                fontSize: '18px',
              }).setOrigin(0.5);
              this.roomContainer.add(trash);
            }
          }

          // Mo the Manatee
          this.spawnRoomAnimal('manatee', w / 2, 340);

          this.addRoomBanner(w / 2, 100, 'CRYSTAL MARSH & LAKE', 'Plastic Runoff Clogs Farm Irrigation • Revives Sweet Corn 🌽');
          this.addReturnGate(w / 2, h - 50);
        }

        // ==========================================
        // ❄️ ROOM 3: GLACIAL TUNDRA (POLAR BEAR)
        // ==========================================
        private buildTundraRoom(isRestored: boolean) {
          const gfx = this.add.graphics();
          const w = this.roomWidth;
          const h = this.roomHeight;

          gfx.fillStyle(isRestored ? 0x0f172a : 0x18181b, 1);
          gfx.fillRect(0, 0, w, h);

          // Glacier ice sheet
          gfx.fillStyle(isRestored ? 0xe0f2fe : 0x3f3f46, 0.9);
          gfx.fillRoundedRect(120, 140, w - 240, h - 280, 40);
          gfx.lineStyle(4, isRestored ? 0x38bdf8 : 0x27272a);
          gfx.strokeRoundedRect(120, 140, w - 240, h - 280, 40);

          this.roomContainer.add(gfx);

          // Ice crystals or soot piles
          for (let i = 0; i < 30; i++) {
            const ix = 160 + Math.random() * (w - 320);
            const iy = 180 + Math.random() * (h - 320);

            if (isRestored) {
              const berg = this.add.polygon(ix, iy, [0, -18, 16, -4, 10, 14, -12, 12, -16, -2], 0x7dd3fc, 0.85);
              berg.setStrokeStyle(2, 0xffffff);
              this.roomContainer.add(berg);
            } else {
              const soot = this.add.circle(ix, iy, 12 + Math.random() * 8, 0x18181b, 0.9).setStrokeStyle(2, 0x000000);
              this.roomContainer.add(soot);
            }
          }

          this.spawnRoomAnimal('polar_bear', w / 2, 340);
          this.addRoomBanner(w / 2, 90, 'GLACIAL TUNDRA', 'Coal Plant Soot Melts Sea Ice • Revives Winter Wheat 🌾');
          this.addReturnGate(w / 2, h - 50);
        }

        // ==========================================
        // 🌻 ROOM 4: GRASSLANDS & PRAIRIE (MONARCH BUTTERFLY)
        // ==========================================
        private buildGrasslandsRoom(isRestored: boolean) {
          const gfx = this.add.graphics();
          const w = this.roomWidth;
          const h = this.roomHeight;

          gfx.fillStyle(isRestored ? 0x713f12 : 0x271f1a, 1);
          gfx.fillRect(0, 0, w, h);
          this.roomContainer.add(gfx);

          // Maximalist sunflowers, wildflowers, and milkweed
          for (let i = 0; i < 55; i++) {
            const gx = 80 + Math.random() * (w - 160);
            const gy = 120 + Math.random() * (h - 260);

            if (isRestored) {
              const flower = this.add.text(gx, gy, ['🌻', '🌺', '🌸', '🌼', '🌾', '🦋'][Math.floor(Math.random() * 6)], {
                fontSize: '22px',
              }).setOrigin(0.5);
              this.roomContainer.add(flower);
            } else {
              const deadGrass = this.add.text(gx, gy, '🥀', { fontSize: '18px' }).setOrigin(0.5);
              this.roomContainer.add(deadGrass);
            }
          }

          this.spawnRoomAnimal('butterfly', w / 2, 340);
          this.addRoomBanner(w / 2, 100, 'REGENERATIVE PRAIRIE', 'Topsoil Loss Killed Pollinators • Revives Giant Sunflowers 🌻');
          this.addReturnGate(w / 2, h - 50);
        }

        // ==========================================
        // ⚡ ROOM 5: SUNFIRE SAVANNA (CHEETAH)
        // ==========================================
        private buildDesertRoom(isRestored: boolean) {
          const gfx = this.add.graphics();
          const w = this.roomWidth;
          const h = this.roomHeight;

          gfx.fillStyle(isRestored ? 0x9a3412 : 0x451a03, 1);
          gfx.fillRect(0, 0, w, h);

          // Oasis pool in center if restored
          if (isRestored) {
            gfx.fillStyle(0x0284c7, 0.9);
            gfx.fillCircle(w / 2, 380, 130);
            gfx.lineStyle(4, 0x38bdf8);
            gfx.strokeCircle(w / 2, 380, 130);
          }

          this.roomContainer.add(gfx);

          // Palms or dry skulls
          for (let i = 0; i < 35; i++) {
            const dx = 80 + Math.random() * (w - 160);
            const dy = 140 + Math.random() * (h - 260);

            if (isRestored) {
              const palm = this.add.text(dx, dy, '🌴', { fontSize: '28px' }).setOrigin(0.5);
              this.roomContainer.add(palm);
            } else {
              const dust = this.add.text(dx, dy, '🏜️', { fontSize: '20px' }).setOrigin(0.5);
              this.roomContainer.add(dust);
            }
          }

          this.spawnRoomAnimal('cheetah', w / 2, 340);
          this.addRoomBanner(w / 2, 100, 'SUNFIRE SAVANNA OASIS', 'Severe Drought Parched Water Wells • Revives Sugar Melons 🍈');
          this.addReturnGate(w / 2, h - 50);
        }

        // ==========================================
        // 🪸 ROOM 6: CORAL BARRIER (SEA TURTLE)
        // ==========================================
        private buildReefsRoom(isRestored: boolean) {
          const gfx = this.add.graphics();
          const w = this.roomWidth;
          const h = this.roomHeight;

          gfx.fillStyle(isRestored ? 0x0e7490 : 0x164e63, 1);
          gfx.fillRect(0, 0, w, h);
          this.roomContainer.add(gfx);

          // Corals & sea creatures
          for (let i = 0; i < 40; i++) {
            const rx = 80 + Math.random() * (w - 160);
            const ry = 140 + Math.random() * (h - 260);

            if (isRestored) {
              const coral = this.add.text(rx, ry, ['🪸', '🐠', '🫧', '🐚'][Math.floor(Math.random() * 4)], {
                fontSize: '24px',
              }).setOrigin(0.5);
              this.roomContainer.add(coral);
            } else {
              const bleached = this.add.text(rx, ry, '💀', { fontSize: '18px' }).setOrigin(0.5);
              this.roomContainer.add(bleached);
            }
          }

          this.spawnRoomAnimal('sea_turtle', w / 2, 340);
          this.addRoomBanner(w / 2, 100, 'HAWKSBILL CORAL BARRIER', 'Propeller Strikes Threaten Sanctuary • Revives Tidal Rice 🌱');
          this.addReturnGate(w / 2, h - 50);
        }

        private spawnRoomAnimal(animalId: AnimalId, x: number, y: number) {
          const info = ANIMALS[animalId];
          const container = this.add.container(x, y);

          const glow = this.add.circle(0, 0, 48, 0x10b981, 0.35);
          this.tweens.add({ targets: glow, scale: 1.35, alpha: 0.1, duration: 1000, yoyo: true, repeat: -1 });

          const bubble = this.add.circle(0, 0, 36, 0x18181b, 0.95);
          bubble.setStrokeStyle(3, 0x10b981);

          const emoji = this.add.text(0, -2, info.avatar, { fontSize: '40px' }).setOrigin(0.5);

          const tag = this.add.text(0, 52, `${info.name} • ${info.species}`, {
            fontSize: '13px',
            fontStyle: 'bold',
            fontFamily: 'system-ui',
            color: '#ffffff',
            backgroundColor: '#09090bf0',
            padding: { x: 10, y: 4 },
          }).setOrigin(0.5);

          container.add([glow, bubble, emoji, tag]);

          bubble.setInteractive({ useHandCursor: true });
          bubble.on('pointerdown', () => {
            stateRef.current.openDialogue(animalId);
          });

          this.currentAnimalObj = { id: animalId, x, y };
          this.roomContainer.add(container);
        }

        private addRoomBanner(x: number, y: number, title: string, subtitle: string) {
          const container = this.add.container(x, y);

          const bg = this.add.rectangle(0, 0, 580, 54, 0x09090bee, 0.95);
          bg.setStrokeStyle(2, 0x10b981);

          const t1 = this.add.text(0, -8, title, {
            fontSize: '15px',
            fontStyle: 'bold',
            fontFamily: 'system-ui',
            color: '#10b981',
          }).setOrigin(0.5);

          const t2 = this.add.text(0, 12, subtitle, {
            fontSize: '11px',
            fontFamily: 'system-ui',
            color: '#e2e8f0',
          }).setOrigin(0.5);

          container.add([bg, t1, t2]);
          this.roomContainer.add(container);
        }

        update() {
          let vx = 0;
          let vy = 0;

          const isShift = this.wasd?.SHIFT.isDown || this.cursors?.shift?.isDown;
          const currentSpeed = isShift ? 480 : this.speed;

          if (this.cursors && this.wasd) {
            if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
            if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
            if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
            if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

            if (Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
              if (nearbyAnimal) {
                stateRef.current.openDialogue(nearbyAnimal);
              }
            }
          }

          if (this.moveTarget) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.moveTarget.x, this.moveTarget.y);
            if (dist > 10) {
              const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.moveTarget.x, this.moveTarget.y);
              vx = Math.cos(angle);
              vy = Math.sin(angle);
            } else {
              this.moveTarget = null;
            }
          }

          if (vx !== 0 || vy !== 0) {
            const len = Math.sqrt(vx * vx + vy * vy);
            vx = (vx / len) * currentSpeed;
            vy = (vy / len) * currentSpeed;
          }

          const body = this.player.body as Phaser.Physics.Arcade.Body;
          if (body) {
            body.setVelocity(vx, vy);
          }

          // Check if player walked into any exit portals / gates
          this.checkPortalCollisions();

          // Check proximity to animal in current room
          if (this.currentAnimalObj) {
            const dist = Phaser.Math.Distance.Between(
              this.player.x,
              this.player.y,
              this.currentAnimalObj.x,
              this.currentAnimalObj.y
            );
            setNearbyAnimal(dist < 130 ? this.currentAnimalObj.id : null);
          }
        }

        private checkPortalCollisions() {
          for (const portal of this.interactivePortals) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, portal.x, portal.y);
            if (dist < portal.radius) {
              stateRef.current.setCurrentBiome(portal.targetBiome);
              break;
            }
          }
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: 1280,
        height: 760,
        backgroundColor: '#09090b',
        physics: {
          default: 'arcade',
          arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        scene: [RoomWorldScene],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      };

      if (isMounted) {
        phaserGameRef.current = new Phaser.Game(config);
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
  const sepiaAmount = Math.max(0, 30 - currentRestorationLevel * 0.3);

  const canvasFilterStyle = {
    filter: `grayscale(${grayscaleAmount}%) saturate(${saturationAmount}%) sepia(${sepiaAmount}%) contrast(105%)`,
    transition: 'filter 1.2s ease-in-out',
  };

  const currentInfo = BIOMES_INFO[currentBiome];
  const animal = nearbyAnimal ? ANIMALS[nearbyAnimal] : null;
  const currentCrop = currentBiome !== 'clearing' ? FARM_CROPS[currentBiome] : null;

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden select-none bg-zinc-950 flex items-center justify-center">
      {/* HTML5 Canvas with Dynamic Shader */}
      <div
        ref={containerRef}
        style={canvasFilterStyle}
        className="w-full h-full cursor-crosshair flex items-center justify-center"
      />

      {/* Ash & Drought Vignette when low restoration */}
      {currentRestorationLevel < 70 && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
          style={{
            opacity: Math.max(0, (70 - currentRestorationLevel) / 70),
            background:
              'radial-gradient(ellipse at center, transparent 40%, rgba(20, 10, 5, 0.45) 80%, rgba(10, 5, 0, 0.8) 100%)',
            boxShadow: 'inset 0 0 100px rgba(239, 68, 68, 0.25)',
          }}
        />
      )}

      {/* Quick Room Nav Back Button if inside a Biome Room */}
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

      {/* Proximity Animal Interaction Banner */}
      {animal && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 animate-bounce">
          <button
            onClick={() => openDialogue(animal.id)}
            className="flex items-center gap-3 px-6 py-3 bg-zinc-900/95 hover:bg-zinc-850 text-white rounded-full border-2 border-emerald-500 shadow-2xl backdrop-blur-lg transition-transform active:scale-95"
          >
            <span className="text-3xl">{animal.avatar}</span>
            <div className="text-left">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>Talk with {animal.name}</span>
                <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-mono">
                  [Press E]
                </span>
              </div>
              <div className="text-xs text-zinc-300 font-medium">
                Learn crisis solution to save {currentCrop ? currentCrop.name : 'crops'}
              </div>
            </div>
            <MessageSquare className="w-5 h-5 text-emerald-400 ml-1" />
          </button>
        </div>
      )}

      {/* Controls Hint */}
      <div className="absolute bottom-20 left-4 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800 text-zinc-400 text-[11px]">
        <Footprints className="w-3.5 h-3.5 text-emerald-400" />
        <span>WASD / Arrow Keys or Click ground to walk • Walk into gates or use Travel bar at top to switch rooms</span>
      </div>
    </div>
  );
}
