'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { BiomeId, AnimalId } from '@/types/game';
import { ANIMALS, BIOMES_INFO, FARM_CROPS } from '@/data/animals';
import { BIOME_WARP_COORDS } from '@/components/hud/FastTravelDock';
import { MessageSquare, Sparkles, Footprints, Sprout, ArrowRight } from 'lucide-react';

interface AnimalPosition {
  id: AnimalId;
  x: number;
  y: number;
  biome: BiomeId;
}

const ANIMAL_POSITIONS: AnimalPosition[] = [
  { id: 'red_panda', x: 650, y: 550, biome: 'forest' },
  { id: 'manatee', x: 650, y: 1850, biome: 'lake' },
  { id: 'polar_bear', x: 1600, y: 400, biome: 'tundra' },
  { id: 'butterfly', x: 2550, y: 1850, biome: 'grasslands' },
  { id: 'cheetah', x: 2650, y: 1000, biome: 'desert' },
  { id: 'sea_turtle', x: 1600, y: 2050, biome: 'reefs' },
];

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
  const [playerCoords, setPlayerCoords] = useState<{ x: number; y: number }>({ x: 1600, y: 1200 });

  const stateRef = useRef({
    currentBiome,
    restoration,
    openDialogue,
  });

  useEffect(() => {
    stateRef.current = {
      currentBiome,
      restoration,
      openDialogue,
    };
  }, [currentBiome, restoration, openDialogue]);

  useEffect(() => {
    let isMounted = true;

    async function initPhaser() {
      if (typeof window === 'undefined' || !containerRef.current) return;
      if (phaserGameRef.current) return;

      const Phaser = (await import('phaser')).default;

      class MaximalistWorldScene extends Phaser.Scene {
        private player!: Phaser.GameObjects.Arc;
        private playerGlow!: Phaser.GameObjects.Arc;
        private hatText!: Phaser.GameObjects.Text;
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
        private speed: number = 380;
        private windmillBlades!: Phaser.GameObjects.Container;
        private dynamicElements: { [key: string]: Phaser.GameObjects.GameObject[] } = {};

        constructor() {
          super({ key: 'MaximalistWorldScene' });
        }

        create() {
          const worldWidth = 3200;
          const worldHeight = 2400;

          this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
          this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

          // 1. Draw Base Biome Terrain & Cobblestone Highways
          this.drawTerrainAndRoads(worldWidth, worldHeight);

          // 2. Draw Central Bayer Farm & The 6 Crop Fields
          this.drawCentralFarm();

          // 3. Draw Maximalist Biome Flora, Ice, Water, Fauna
          this.drawMaximalistEcosystems();

          // 4. Spawn Animal NPCs
          this.spawnAnimals();

          // 5. Create Player
          this.createPlayer();

          // 6. Camera Follow
          this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
          this.cameras.main.setZoom(1.05);

          // 7. Input Controls
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

          // 8. Pointer / Tap to Move
          this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.moveTarget = { x: worldPoint.x, y: worldPoint.y };

            const ripple = this.add.circle(worldPoint.x, worldPoint.y, 10, 0x34d399, 0.8);
            this.tweens.add({
              targets: ripple,
              scale: 2.5,
              alpha: 0,
              duration: 350,
              onComplete: () => ripple.destroy(),
            });
          });

          // 9. Listen for Warp Player Events
          const handleWarp = (e: any) => {
            const { x, y } = e.detail;
            if (this.player) {
              this.player.setPosition(x, y);
              this.moveTarget = null;
              this.cameras.main.pan(x, y, 500, 'Power2');
            }
          };
          window.addEventListener('WARP_PLAYER', handleWarp);

          // 10. Ambient particles (pollen, embers, snow, water sparkles)
          this.createMaximalistAtmosphere();
        }

        private drawTerrainAndRoads(w: number, h: number) {
          const gfx = this.add.graphics();

          // Base earth ground
          gfx.fillStyle(0x18181b, 1);
          gfx.fillRect(0, 0, w, h);

          // Biome 1: Forest (NW)
          gfx.fillStyle(0x0f2d18, 1);
          gfx.fillRect(100, 100, 1150, 950);
          gfx.lineStyle(6, 0x15803d, 0.4);
          gfx.strokeRect(100, 100, 1150, 950);

          // Biome 2: Lake (SW)
          gfx.fillStyle(0x082f49, 1);
          gfx.fillRect(100, 1350, 1150, 950);
          gfx.lineStyle(6, 0x0284c7, 0.4);
          gfx.strokeRect(100, 1350, 1150, 950);

          // Biome 3: Tundra (North)
          gfx.fillStyle(0x1e293b, 1);
          gfx.fillRect(1250, 100, 800, 750);
          gfx.lineStyle(6, 0x94a3b8, 0.4);
          gfx.strokeRect(1250, 100, 800, 750);

          // Biome 4: Grasslands & Prairie (SE)
          gfx.fillStyle(0x422006, 1);
          gfx.fillRect(2050, 1350, 1050, 950);
          gfx.lineStyle(6, 0xca8a04, 0.4);
          gfx.strokeRect(2050, 1350, 1050, 950);

          // Biome 5: Desert (East)
          gfx.fillStyle(0x451a03, 1);
          gfx.fillRect(2150, 500, 950, 800);
          gfx.lineStyle(6, 0xea580c, 0.4);
          gfx.strokeRect(2150, 500, 950, 800);

          // Biome 6: Reefs (South)
          gfx.fillStyle(0x164e63, 1);
          gfx.fillRect(1200, 1650, 850, 650);
          gfx.lineStyle(6, 0x0891b2, 0.4);
          gfx.strokeRect(1200, 1650, 850, 650);

          // Central Bayer Farm Base
          gfx.fillStyle(0x27272a, 1);
          gfx.fillCircle(1600, 1200, 360);
          gfx.lineStyle(8, 0x10b981, 0.6);
          gfx.strokeCircle(1600, 1200, 360);

          // Cobblestone Highway Roads from Central Farm to each Biome
          gfx.lineStyle(64, 0x3f3f46, 0.85);
          // To Forest
          gfx.lineBetween(1600, 1200, 650, 550);
          // To Lake
          gfx.lineBetween(1600, 1200, 650, 1850);
          // To Tundra
          gfx.lineBetween(1600, 1200, 1600, 400);
          // To Grasslands
          gfx.lineBetween(1600, 1200, 2550, 1850);
          // To Desert
          gfx.lineBetween(1600, 1200, 2650, 1000);
          // To Reefs
          gfx.lineBetween(1600, 1200, 1600, 2050);

          // Road borders / Curbs
          gfx.lineStyle(4, 0x71717a, 0.8);
          this.drawRoadBorders(gfx, 1600, 1200, 650, 550);
          this.drawRoadBorders(gfx, 1600, 1200, 650, 1850);
          this.drawRoadBorders(gfx, 1600, 1200, 1600, 400);
          this.drawRoadBorders(gfx, 1600, 1200, 2550, 1850);
          this.drawRoadBorders(gfx, 1600, 1200, 2650, 1000);
          this.drawRoadBorders(gfx, 1600, 1200, 1600, 2050);

          // Wooden Road Signs at Junctions
          this.addRoadSign(1320, 1000, '↖️ BAMBOO FOREST & ORCHARD', 'Paku the Red Panda (Save Apples 🍎)');
          this.addRoadSign(1320, 1400, '↙️ CRYSTAL LAKE & WATERWAYS', 'Mo the Manatee (Save Corn 🌽)');
          this.addRoadSign(1600, 920, '⬆️ GLACIAL TUNDRA', 'Nanuk the Polar Bear (Save Wheat 🌾)');
          this.addRoadSign(1880, 1400, '↘️ SMART FARMLAND', 'Aura the Monarch (Save Sunflowers 🌻)');
          this.addRoadSign(1920, 1120, '➡️ SAVANNA OASIS', 'Zuri the Cheetah (Save Melons 🍈)');
          this.addRoadSign(1600, 1480, '⬇️ CORAL BARRIER', 'Coralia the Sea Turtle (Save Rice 🌱)');
        }

        private drawRoadBorders(gfx: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number) {
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const perp = angle + Math.PI / 2;
          const offset = 32;

          gfx.lineBetween(
            x1 + Math.cos(perp) * offset,
            y1 + Math.sin(perp) * offset,
            x2 + Math.cos(perp) * offset,
            y2 + Math.sin(perp) * offset
          );
          gfx.lineBetween(
            x1 - Math.cos(perp) * offset,
            y1 - Math.sin(perp) * offset,
            x2 - Math.cos(perp) * offset,
            y2 - Math.sin(perp) * offset
          );
        }

        private addRoadSign(x: number, y: number, text: string, sub: string) {
          const container = this.add.container(x, y);
          const bg = this.add.rectangle(0, 0, 230, 40, 0x18181b, 0.9);
          bg.setStrokeStyle(2, 0xd97706);

          const t1 = this.add.text(0, -6, text, {
            fontSize: '11px',
            fontFamily: 'system-ui',
            fontStyle: 'bold',
            color: '#fef3c7',
          }).setOrigin(0.5);

          const t2 = this.add.text(0, 8, sub, {
            fontSize: '9px',
            fontFamily: 'system-ui',
            color: '#a1a1aa',
          }).setOrigin(0.5);

          container.add([bg, t1, t2]);
        }

        private drawCentralFarm() {
          const cx = 1600;
          const cy = 1200;

          // 1. Red Central Farm Barn
          const barn = this.add.container(cx, cy - 40);
          const barnBase = this.add.rectangle(0, 0, 110, 80, 0xb91c1c);
          barnBase.setStrokeStyle(3, 0xffffff);

          const roof = this.add.triangle(0, -55, -65, 15, 65, 15, 0, -35, 0x991b1b);
          roof.setStrokeStyle(2, 0xffffff);

          const barnDoor = this.add.rectangle(0, 15, 36, 48, 0x450a0a);
          barnDoor.setStrokeStyle(2, 0xfef08a);

          const farmTitle = this.add.text(0, -35, 'BAYER ECO-FARM', {
            fontSize: '10px',
            fontStyle: 'bold',
            fontFamily: 'system-ui',
            color: '#fef08a',
            backgroundColor: '#09090b',
            padding: { x: 4, y: 2 },
          }).setOrigin(0.5);

          barn.add([barnBase, roof, barnDoor, farmTitle]);

          // 2. Animated Farm Windmill
          const windmill = this.add.container(cx + 120, cy - 70);
          const millTower = this.add.triangle(0, 0, -25, 40, 25, 40, 0, -40, 0x78716c);
          millTower.setStrokeStyle(2, 0xffffff);

          this.windmillBlades = this.add.container(0, -38);
          const blade1 = this.add.rectangle(0, 0, 8, 70, 0xf5f5f4);
          const blade2 = this.add.rectangle(0, 0, 70, 8, 0xf5f5f4);
          this.windmillBlades.add([blade1, blade2]);

          windmill.add([millTower, this.windmillBlades]);

          // Windmill rotation tween
          this.tweens.add({
            targets: this.windmillBlades,
            angle: 360,
            duration: 5000,
            repeat: -1,
          });

          // 3. Central Grain Silo
          const silo = this.add.container(cx - 120, cy - 60);
          const siloBody = this.add.rectangle(0, 0, 45, 80, 0x94a3b8);
          siloBody.setStrokeStyle(2, 0xe2e8f0);
          const siloDome = this.add.arc(0, -40, 22, 180, 360, false, 0x64748b);
          siloDome.setStrokeStyle(2, 0xe2e8f0);
          silo.add([siloBody, siloDome]);

          // 4. Draw the 6 Crop Plots around the Farm Hub!
          this.drawFarmCropPlots(cx, cy);
        }

        private drawFarmCropPlots(cx: number, cy: number) {
          // Plot 1: West -> Lake -> Corn
          this.createCropField(cx - 190, cy + 60, 'lake', '🌽', '🥀', 'Sweet Golden Corn');

          // Plot 2: NW -> Forest -> Apple & Bamboo Orchard
          this.createCropField(cx - 160, cy - 140, 'forest', '🍎', '🪵', 'Canopy Apple Orchard');

          // Plot 3: North -> Tundra -> Winter Wheat
          this.createCropField(cx, cy - 180, 'tundra', '🌾', '🍂', 'Glacial Winter Wheat');

          // Plot 4: SE -> Grasslands -> Sunflowers
          this.createCropField(cx + 160, cy + 130, 'grasslands', '🌻', '🥀', 'Pollinator Sunflowers');

          // Plot 5: East -> Desert -> Melons & Sorghum
          this.createCropField(cx + 190, cy + 10, 'desert', '🍈', '🏜️', 'Sugar Melons');

          // Plot 6: South -> Reefs -> Coastal Tidal Rice
          this.createCropField(cx, cy + 190, 'reefs', '🌱', '🌊', 'Tidal Rice & Kelp');
        }

        private createCropField(
          x: number,
          y: number,
          biome: Exclude<BiomeId, 'clearing'>,
          flourishIcon: string,
          deadIcon: string,
          cropName: string
        ) {
          const container = this.add.container(x, y);

          // Plot ground
          const plotBg = this.add.rectangle(0, 0, 110, 75, 0x3f3f46, 0.9);
          plotBg.setStrokeStyle(2, 0x71717a);

          // Label
          const label = this.add.text(0, -32, cropName, {
            fontSize: '9px',
            fontStyle: 'bold',
            fontFamily: 'system-ui',
            color: '#fef08a',
            backgroundColor: '#09090bee',
            padding: { x: 3, y: 1 },
          }).setOrigin(0.5);

          container.add([plotBg, label]);

          // Stalks grid (2 rows of 4 stalks)
          const stalks: Phaser.GameObjects.Text[] = [];
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
              const sx = -38 + col * 25;
              const sy = -10 + row * 24;
              const stalkText = this.add.text(sx, sy, deadIcon, {
                fontSize: '18px',
              }).setOrigin(0.5);
              container.add(stalkText);
              stalks.push(stalkText);
            }
          }

          // Register dynamic update hook for this crop
          this.events.on('update', () => {
            const isFlourished = (stateRef.current.restoration[biome] || 0) >= 80;
            if (isFlourished) {
              plotBg.setFillStyle(0x14532d, 0.9);
              plotBg.setStrokeStyle(2, 0x22c55e);
              stalks.forEach((st) => st.setText(flourishIcon));
            } else {
              plotBg.setFillStyle(0x27272a, 0.9);
              plotBg.setStrokeStyle(2, 0x71717a);
              stalks.forEach((st) => st.setText(deadIcon));
            }
          });
        }

        private drawMaximalistEcosystems() {
          // LAKE (SW: 100-1200, 1400-2300) - Water waves, reeds, lilypads
          for (let i = 0; i < 40; i++) {
            const lx = 200 + Math.random() * 950;
            const ly = 1450 + Math.random() * 800;
            const lily = this.add.circle(lx, ly, 10 + Math.random() * 8, 0x065f46, 0.8);
            lily.setStrokeStyle(2, 0x10b981);
            if (Math.random() < 0.4) {
              const flower = this.add.text(lx, ly, '🪷', { fontSize: '14px' }).setOrigin(0.5);
            }
          }

          // FOREST (NW: 100-1200, 100-1000) - 50+ procedural pine and bamboo trees
          for (let i = 0; i < 50; i++) {
            const fx = 150 + Math.random() * 1050;
            const fy = 150 + Math.random() * 850;
            const tree = this.add.container(fx, fy);
            const trunk = this.add.rectangle(0, 10, 8, 24, 0x451a03);
            const foliage = this.add.triangle(0, -10, -22, 18, 22, 18, 0, -25, 0x15803d);
            foliage.setStrokeStyle(1, 0x22c55e);
            tree.add([trunk, foliage]);
          }

          // TUNDRA (North: 1250-2050, 100-800) - Icebergs & glacial crystals
          for (let i = 0; i < 35; i++) {
            const tx = 1300 + Math.random() * 700;
            const ty = 150 + Math.random() * 650;
            const berg = this.add.polygon(tx, ty, [
              0, -20,
              18, -6,
              12, 16,
              -14, 14,
              -18, -4
            ], 0x93c5fd, 0.75);
            berg.setStrokeStyle(2, 0xffffff);
          }

          // GRASSLANDS (SE: 2050-3100, 1400-2300) - Wildflower meadows & sunflowers
          for (let i = 0; i < 50; i++) {
            const gx = 2100 + Math.random() * 950;
            const gy = 1420 + Math.random() * 800;
            const flowerEmoji = ['🌻', '🌺', '🌸', '🌼', '🌾', '🦋'][Math.floor(Math.random() * 6)];
            this.add.text(gx, gy, flowerEmoji, { fontSize: '18px' }).setOrigin(0.5);
          }

          // DESERT (East: 2150-3100, 500-1350) - Dunes, acacia trees & palms
          for (let i = 0; i < 30; i++) {
            const dx = 2200 + Math.random() * 850;
            const dy = 550 + Math.random() * 750;
            const palm = this.add.text(dx, dy, '🌴', { fontSize: '26px' }).setOrigin(0.5);
          }

          // REEFS (South: 1200-2050, 1650-2300) - Coral clusters & anemones
          for (let i = 0; i < 35; i++) {
            const rx = 1250 + Math.random() * 750;
            const ry = 1700 + Math.random() * 550;
            const coral = this.add.text(rx, ry, ['🪸', '🐠', '🫧', '🐚'][Math.floor(Math.random() * 4)], {
              fontSize: '20px',
            }).setOrigin(0.5);
          }
        }

        private spawnAnimals() {
          ANIMAL_POSITIONS.forEach((pos) => {
            const info = ANIMALS[pos.id];

            const container = this.add.container(pos.x, pos.y);

            const baseCircle = this.add.circle(0, 0, 42, 0x10b981, 0.3);
            this.tweens.add({
              targets: baseCircle,
              scale: 1.3,
              alpha: 0.1,
              duration: 1200,
              yoyo: true,
              repeat: -1,
            });

            const bubble = this.add.circle(0, 0, 30, 0x18181b, 0.95);
            bubble.setStrokeStyle(3, 0x10b981, 1);

            const emoji = this.add.text(0, -2, info.avatar, {
              fontSize: '32px',
            }).setOrigin(0.5);

            const tag = this.add.text(0, 44, `${info.name} (${info.coinIcon})`, {
              fontSize: '13px',
              fontStyle: 'bold',
              fontFamily: 'system-ui',
              color: '#ffffff',
              backgroundColor: '#09090bf0',
              padding: { x: 8, y: 4 },
            }).setOrigin(0.5);

            container.add([baseCircle, bubble, emoji, tag]);

            bubble.setInteractive({ useHandCursor: true });
            bubble.on('pointerdown', () => {
              stateRef.current.openDialogue(pos.id);
            });

            // Floating bobbing motion
            this.tweens.add({
              targets: container,
              y: pos.y - 6,
              duration: 1500,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });
          });
        }

        private createPlayer() {
          const startX = 1600;
          const startY = 1200;

          this.playerGlow = this.add.circle(startX, startY, 32, 0x10b981, 0.35);
          this.tweens.add({
            targets: this.playerGlow,
            scale: 1.35,
            alpha: 0.15,
            duration: 900,
            yoyo: true,
            repeat: -1,
          });

          this.player = this.add.circle(startX, startY, 20, 0x10b981, 1);
          this.player.setStrokeStyle(3, 0xffffff, 1);
          this.physics.add.existing(this.player);

          this.hatText = this.add.text(startX, startY - 1, '👨‍🌾', {
            fontSize: '22px',
          }).setOrigin(0.5);

          this.events.on('update', () => {
            this.playerGlow.setPosition(this.player.x, this.player.y);
            this.hatText.setPosition(this.player.x, this.player.y - 1);
            setPlayerCoords({ x: Math.round(this.player.x), y: Math.round(this.player.y) });
          });
        }

        private createMaximalistAtmosphere() {
          // Pollen & spore floating particles
          for (let i = 0; i < 40; i++) {
            const p = this.add.circle(
              1600 + (Math.random() - 0.5) * 1400,
              1200 + (Math.random() - 0.5) * 1000,
              Math.random() * 3 + 1.5,
              0xfacc15,
              0.8
            );

            this.tweens.add({
              targets: p,
              y: p.y - 80 - Math.random() * 40,
              x: p.x + (Math.random() - 0.5) * 60,
              alpha: 0.1,
              duration: 2500 + Math.random() * 2000,
              repeat: -1,
              yoyo: true,
            });
          }
        }

        update() {
          let vx = 0;
          let vy = 0;

          const isShift = this.wasd?.SHIFT.isDown || this.cursors?.shift?.isDown;
          const currentSpeed = isShift ? 520 : this.speed;

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
            const dist = Phaser.Math.Distance.Between(
              this.player.x,
              this.player.y,
              this.moveTarget.x,
              this.moveTarget.y
            );
            if (dist > 12) {
              const angle = Phaser.Math.Angle.Between(
                this.player.x,
                this.player.y,
                this.moveTarget.x,
                this.moveTarget.y
              );
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

            if (Math.random() < 0.2) {
              const footstep = this.add.circle(
                this.player.x,
                this.player.y + 14,
                4,
                0x34d399,
                0.6
              );
              this.tweens.add({
                targets: footstep,
                scale: 2,
                alpha: 0,
                duration: 400,
                onComplete: () => footstep.destroy(),
              });
            }
          }

          const body = this.player.body as Phaser.Physics.Arcade.Body;
          if (body) {
            body.setVelocity(vx, vy);
          }

          this.checkContinuousBiome();
          this.checkAnimalProximity();
        }

        private checkContinuousBiome() {
          const px = this.player.x;
          const py = this.player.y;

          // Continuous distance-based biome detection (No dead zones!)
          let closestBiome: BiomeId = 'clearing';
          let minDistance = 650; // Central farm radius

          const centers: { id: BiomeId; x: number; y: number }[] = [
            { id: 'forest', x: 650, y: 550 },
            { id: 'lake', x: 650, y: 1850 },
            { id: 'tundra', x: 1600, y: 400 },
            { id: 'grasslands', x: 2550, y: 1850 },
            { id: 'desert', x: 2650, y: 1000 },
            { id: 'reefs', x: 1600, y: 2050 },
          ];

          centers.forEach((c) => {
            const dist = Phaser.Math.Distance.Between(px, py, c.x, c.y);
            if (dist < minDistance) {
              minDistance = dist;
              closestBiome = c.id;
            }
          });

          if (closestBiome !== stateRef.current.currentBiome) {
            setCurrentBiome(closestBiome);
          }
        }

        private checkAnimalProximity() {
          let closest: AnimalId | null = null;
          let minDistance = 140;

          ANIMAL_POSITIONS.forEach((pos) => {
            const dist = Phaser.Math.Distance.Between(
              this.player.x,
              this.player.y,
              pos.x,
              pos.y
            );
            if (dist < minDistance) {
              minDistance = dist;
              closest = pos.id;
            }
          });

          setNearbyAnimal(closest);
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: containerRef.current.clientWidth || 1024,
        height: containerRef.current.clientHeight || 640,
        backgroundColor: '#09090b',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scene: [MaximalistWorldScene],
        scale: {
          mode: Phaser.Scale.RESIZE,
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
  }, [setCurrentBiome, nearbyAnimal]);

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
    <div className="relative w-full h-full flex-1 overflow-hidden select-none bg-zinc-950">
      {/* HTML5 Canvas with Dynamic Shader */}
      <div
        ref={containerRef}
        style={canvasFilterStyle}
        className="w-full h-full cursor-crosshair"
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

      {/* Active Biome HUD Card */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-2 max-w-xs">
        <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-3.5 shadow-2xl text-white">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full animate-ping"
                style={{ backgroundColor: currentInfo.color }}
              />
              <h2 className="font-bold text-xs tracking-wide text-zinc-100">
                {currentInfo.name}
              </h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-zinc-800 text-zinc-300">
              {currentRestorationLevel}%
            </span>
          </div>

          {currentCrop && (
            <div className="mt-1.5 p-2 bg-zinc-900 rounded-xl border border-zinc-800 text-[11px] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{currentRestorationLevel >= 80 ? currentCrop.icon : currentCrop.deadIcon}</span>
                <span className="text-zinc-200 font-bold">{currentCrop.name}</span>
              </div>
              <span className={currentRestorationLevel >= 80 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-medium'}>
                {currentRestorationLevel >= 80 ? 'Flourishing' : 'Threatened'}
              </span>
            </div>
          )}

          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden border border-zinc-700/50 my-2">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${currentRestorationLevel}%`,
                backgroundColor: currentRestorationLevel > 50 ? '#22c55e' : '#f97316',
              }}
            />
          </div>

          {quests.find((q) => q.biome === currentBiome && !q.completed) && (
            <button
              onClick={() => {
                const quest = quests.find((q) => q.biome === currentBiome && !q.completed);
                if (quest) openQuestModal(quest.actionType);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Solve Crisis & Revive Crop</span>
            </button>
          )}
        </div>
      </div>

      {/* Proximity Animal Interaction Banner */}
      {animal && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 animate-bounce">
          <button
            onClick={() => openDialogue(animal.id)}
            className="flex items-center gap-3 px-5 py-3 bg-zinc-900/95 hover:bg-zinc-850 text-white rounded-full border-2 border-emerald-500 shadow-2xl backdrop-blur-lg transition-transform active:scale-95"
          >
            <span className="text-2xl">{animal.avatar}</span>
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
        <span>WASD / Arrow Keys or Click ground to walk • Shift to Sprint • ({playerCoords.x}, {playerCoords.y})</span>
      </div>
    </div>
  );
}
