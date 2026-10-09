'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { BiomeId, AnimalId } from '@/types/game';
import { ANIMALS, BIOMES_INFO } from '@/data/animals';
import { MessageSquare, Sparkles, Footprints } from 'lucide-react';

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

  // References to keep phaser callbacks up to date without destroying game
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

      // Custom Scene
      class MainWorldScene extends Phaser.Scene {
        private player!: Phaser.GameObjects.Arc;
        private playerGlow!: Phaser.GameObjects.Arc;
        private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
        private wasd!: {
          W: Phaser.Input.Keyboard.Key;
          A: Phaser.Input.Keyboard.Key;
          S: Phaser.Input.Keyboard.Key;
          D: Phaser.Input.Keyboard.Key;
          E: Phaser.Input.Keyboard.Key;
        };
        private animalsGroup!: Phaser.GameObjects.Group;
        private particlesGroup!: Phaser.GameObjects.Group;
        private flowersGroup!: Phaser.GameObjects.Group;
        private moveTarget: { x: number; y: number } | null = null;
        private speed: number = 260;

        constructor() {
          super({ key: 'MainWorldScene' });
        }

        create() {
          const worldWidth = 3200;
          const worldHeight = 2400;

          // Set physics and camera bounds
          this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
          this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

          // 1. Draw Biome Background Sectors
          this.drawBiomeMap(worldWidth, worldHeight);

          // 2. Groups
          this.animalsGroup = this.add.group();
          this.particlesGroup = this.add.group();
          this.flowersGroup = this.add.group();

          // 3. Spawn Animal NPCs
          this.spawnAnimals();

          // 4. Create Player
          this.createPlayer();

          // 5. Camera follow player
          this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
          this.cameras.main.setZoom(1.1);

          // 6. Setup Inputs
          if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = {
              W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
              A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
              S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
              D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
              E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            };
          }

          // 7. Click / Tap to move
          this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.moveTarget = { x: worldPoint.x, y: worldPoint.y };

            // Ripple indicator at click target
            const ripple = this.add.circle(worldPoint.x, worldPoint.y, 8, 0xffffff, 0.8);
            this.tweens.add({
              targets: ripple,
              scale: 3,
              alpha: 0,
              duration: 400,
              onComplete: () => ripple.destroy(),
            });
          });

          // 8. Ambient atmospheric particles
          this.createAmbientAtmosphere();
        }

        private drawBiomeMap(w: number, h: number) {
          const gfx = this.add.graphics();

          // Background base
          gfx.fillStyle(0x18181b, 1);
          gfx.fillRect(0, 0, w, h);

          // Biome 1: Center Ash Clearing (Wildfire ground zero)
          gfx.fillStyle(0x27272a, 1);
          gfx.fillCircle(1600, 1200, 420);
          // Scorched ring
          gfx.lineStyle(8, 0xef4444, 0.4);
          gfx.strokeCircle(1600, 1200, 420);

          // Biome 2: NW Bamboo Forest
          gfx.fillStyle(0x14532d, 0.85);
          gfx.fillRect(100, 100, 1100, 900);
          gfx.lineStyle(4, 0x22c55e, 0.5);
          gfx.strokeRect(100, 100, 1100, 900);

          // Biome 3: SW Crystal Lake & Marsh
          gfx.fillStyle(0x0c4a6e, 0.85);
          gfx.fillRect(100, 1400, 1100, 900);
          gfx.lineStyle(4, 0x38bdf8, 0.5);
          gfx.strokeRect(100, 1400, 1100, 900);

          // Biome 4: North Glacial Tundra
          gfx.fillStyle(0x334155, 0.85);
          gfx.fillRect(1250, 100, 800, 750);
          gfx.lineStyle(4, 0xe2e8f0, 0.5);
          gfx.strokeRect(1250, 100, 800, 750);

          // Biome 5: SE Bayer Regenerative Farmland & Grasslands
          gfx.fillStyle(0x713f12, 0.85);
          gfx.fillRect(2050, 1400, 1050, 900);
          gfx.lineStyle(4, 0xeab308, 0.5);
          gfx.strokeRect(2050, 1400, 1050, 900);

          // Biome 6: East Sunfire Desert Oasis
          gfx.fillStyle(0x7c2d12, 0.85);
          gfx.fillRect(2150, 500, 950, 850);
          gfx.lineStyle(4, 0xf97316, 0.5);
          gfx.strokeRect(2150, 500, 950, 850);

          // Biome 7: South Hawksbill Coral Reefs
          gfx.fillStyle(0x164e63, 0.85);
          gfx.fillRect(1200, 1650, 850, 650);
          gfx.lineStyle(4, 0x06b6d4, 0.5);
          gfx.strokeRect(1200, 1650, 850, 650);

          // Interconnecting Pathway roads
          gfx.lineStyle(48, 0x3f3f46, 0.6);
          // Path from center to Forest
          gfx.lineBetween(1600, 1200, 650, 550);
          // Path from center to Lake
          gfx.lineBetween(1600, 1200, 650, 1850);
          // Path from center to Tundra
          gfx.lineBetween(1600, 1200, 1600, 400);
          // Path from center to Farmland
          gfx.lineBetween(1600, 1200, 2550, 1850);
          // Path from center to Desert
          gfx.lineBetween(1600, 1200, 2650, 1000);
          // Path from center to Reefs
          gfx.lineBetween(1600, 1200, 1600, 2050);

          // Add Biome Title Markers on Map
          this.addBiomeText(1600, 1130, 'CHARRED ASH CLEARING', 'Ground Zero (Extinguish Flares)');
          this.addBiomeText(650, 320, 'BAMBOO CANOPY FOREST', 'Red Panda Habitat');
          this.addBiomeText(650, 1620, 'CRYSTAL MARSH & LAKE', 'Manatee Sanctuary');
          this.addBiomeText(1600, 220, 'GLACIAL TUNDRA', 'Polar Bear Pack Ice');
          this.addBiomeText(2550, 1620, 'BAYER SMART FARMLAND', 'Regenerative Monarch Corridor');
          this.addBiomeText(2650, 720, 'SUNFIRE SAVANNA OASIS', 'Cheetah Range');
          this.addBiomeText(1600, 1880, 'HAWKSBILL CORAL REEF', 'Marine Protected Area');
        }

        private addBiomeText(x: number, y: number, title: string, subtitle: string) {
          const titleText = this.add.text(x, y, title, {
            fontSize: '18px',
            fontFamily: 'system-ui, sans-serif',
            fontStyle: 'bold',
            color: '#f8fafc',
            stroke: '#09090b',
            strokeThickness: 4,
          });
          titleText.setOrigin(0.5);

          const subText = this.add.text(x, y + 22, subtitle, {
            fontSize: '13px',
            fontFamily: 'system-ui, sans-serif',
            color: '#cbd5e1',
            stroke: '#09090b',
            strokeThickness: 3,
          });
          subText.setOrigin(0.5);
        }

        private spawnAnimals() {
          ANIMAL_POSITIONS.forEach((pos) => {
            const info = ANIMALS[pos.id];

            // Animal Aura Container
            const container = this.add.container(pos.x, pos.y);

            // Pulsing base circle
            const baseCircle = this.add.circle(0, 0, 36, 0x10b981, 0.25);
            this.tweens.add({
              targets: baseCircle,
              scale: 1.25,
              alpha: 0.1,
              duration: 1200,
              yoyo: true,
              repeat: -1,
            });

            // Animal Icon Bubble
            const bubble = this.add.circle(0, 0, 26, 0x18181b, 0.9);
            bubble.setStrokeStyle(3, 0x10b981, 1);

            // Animal Emoji
            const emoji = this.add.text(0, -2, info.avatar, {
              fontSize: '28px',
            });
            emoji.setOrigin(0.5);

            // Floating Name Tag
            const tag = this.add.text(0, 38, `${info.name} (${info.coinIcon})`, {
              fontSize: '13px',
              fontStyle: 'bold',
              fontFamily: 'system-ui, sans-serif',
              color: '#ffffff',
              backgroundColor: '#09090bee',
              padding: { x: 8, y: 4 },
            });
            tag.setOrigin(0.5);

            container.add([baseCircle, bubble, emoji, tag]);

            // Interactive Click on Animal
            bubble.setInteractive({ useHandCursor: true });
            bubble.on('pointerdown', () => {
              stateRef.current.openDialogue(pos.id);
            });

            this.animalsGroup.add(container);
          });
        }

        private createPlayer() {
          // Player container
          const startX = 1600;
          const startY = 1200;

          // Player Aura
          this.playerGlow = this.add.circle(startX, startY, 28, 0x22c55e, 0.3);
          this.tweens.add({
            targets: this.playerGlow,
            scale: 1.3,
            alpha: 0.15,
            duration: 1000,
            yoyo: true,
            repeat: -1,
          });

          // Player Body
          this.player = this.add.circle(startX, startY, 18, 0x10b981, 1);
          this.player.setStrokeStyle(3, 0xffffff, 1);
          this.physics.add.existing(this.player);

          // Player emoji / explorer hat
          const hatText = this.add.text(startX, startY - 1, '🌱', {
            fontSize: '18px',
          });
          hatText.setOrigin(0.5);

          // Keep hat locked to player position
          this.events.on('update', () => {
            this.playerGlow.setPosition(this.player.x, this.player.y);
            hatText.setPosition(this.player.x, this.player.y - 1);
            setPlayerCoords({ x: Math.round(this.player.x), y: Math.round(this.player.y) });
          });
        }

        private createAmbientAtmosphere() {
          // Wildfire Clearing: Floating Ember particles
          for (let i = 0; i < 35; i++) {
            const ember = this.add.circle(
              1600 + (Math.random() - 0.5) * 600,
              1200 + (Math.random() - 0.5) * 600,
              Math.random() * 3 + 2,
              0xf97316,
              0.8
            );

            this.tweens.add({
              targets: ember,
              y: ember.y - 120 - Math.random() * 80,
              x: ember.x + (Math.random() - 0.5) * 40,
              alpha: 0,
              duration: 2000 + Math.random() * 2000,
              repeat: -1,
              delay: Math.random() * 2000,
              onRepeat: () => {
                ember.y = 1200 + (Math.random() - 0.5) * 500;
                ember.x = 1600 + (Math.random() - 0.5) * 500;
                ember.alpha = 0.8;
              },
            });
          }

          // Tundra: Snow particles
          for (let i = 0; i < 40; i++) {
            const snow = this.add.circle(
              1250 + Math.random() * 800,
              100 + Math.random() * 750,
              Math.random() * 2.5 + 1.5,
              0xffffff,
              0.7
            );

            this.tweens.add({
              targets: snow,
              y: snow.y + 100 + Math.random() * 50,
              x: snow.x + (Math.random() - 0.5) * 30,
              alpha: 0.2,
              duration: 2500 + Math.random() * 2000,
              repeat: -1,
              delay: Math.random() * 2000,
            });
          }

          // Farmland: Pollen & Spores
          for (let i = 0; i < 30; i++) {
            const pollen = this.add.circle(
              2050 + Math.random() * 1050,
              1400 + Math.random() * 900,
              Math.random() * 3 + 1,
              0xfacc15,
              0.75
            );

            this.tweens.add({
              targets: pollen,
              y: pollen.y + (Math.random() - 0.5) * 50,
              x: pollen.x + (Math.random() - 0.5) * 60,
              alpha: 0.3,
              duration: 1800 + Math.random() * 1500,
              yoyo: true,
              repeat: -1,
            });
          }
        }

        update() {
          let vx = 0;
          let vy = 0;

          // Keyboard controls
          if (this.cursors && this.wasd) {
            if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
            if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
            if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
            if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

            // Talk prompt shortcut: Press 'E'
            if (Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
              if (nearbyAnimal) {
                stateRef.current.openDialogue(nearbyAnimal);
              }
            }
          }

          // Mouse / Touch tap-to-move handling
          if (this.moveTarget) {
            const dist = Phaser.Math.Distance.Between(
              this.player.x,
              this.player.y,
              this.moveTarget.x,
              this.moveTarget.y
            );
            if (dist > 10) {
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

          // Normalize velocity
          if (vx !== 0 || vy !== 0) {
            const len = Math.sqrt(vx * vx + vy * vy);
            vx = (vx / len) * this.speed;
            vy = (vy / len) * this.speed;

            // Footstep ripple effect
            if (Math.random() < 0.15) {
              const footstep = this.add.circle(
                this.player.x,
                this.player.y + 12,
                4,
                0x10b981,
                0.5
              );
              this.tweens.add({
                targets: footstep,
                scale: 1.8,
                alpha: 0,
                duration: 450,
                onComplete: () => footstep.destroy(),
              });
            }
          }

          // Move player
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          if (body) {
            body.setVelocity(vx, vy);
          }

          // Biome Detection
          this.checkCurrentBiome();

          // Animal Proximity Detection
          this.checkAnimalProximity();
        }

        private checkCurrentBiome() {
          const px = this.player.x;
          const py = this.player.y;
          let detected: BiomeId = 'clearing';

          // NW Forest
          if (px >= 100 && px <= 1200 && py >= 100 && py <= 1000) {
            detected = 'forest';
          }
          // SW Lake
          else if (px >= 100 && px <= 1200 && py >= 1400 && py <= 2300) {
            detected = 'lake';
          }
          // North Tundra
          else if (px >= 1250 && px <= 2050 && py >= 100 && py <= 850) {
            detected = 'tundra';
          }
          // SE Farmland
          else if (px >= 2050 && px <= 3100 && py >= 1400 && py <= 2300) {
            detected = 'grasslands';
          }
          // East Desert
          else if (px >= 2150 && px <= 3100 && py >= 500 && py <= 1350) {
            detected = 'desert';
          }
          // South Reefs
          else if (px >= 1200 && px <= 2050 && py >= 1650 && py <= 2300) {
            detected = 'reefs';
          } else {
            detected = 'clearing';
          }

          if (detected !== stateRef.current.currentBiome) {
            setCurrentBiome(detected);
          }
        }

        private checkAnimalProximity() {
          let closestAnimal: AnimalId | null = null;
          let minDistance = 110;

          ANIMAL_POSITIONS.forEach((pos) => {
            const dist = Phaser.Math.Distance.Between(
              this.player.x,
              this.player.y,
              pos.x,
              pos.y
            );
            if (dist < minDistance) {
              minDistance = dist;
              closestAnimal = pos.id;
            }
          });

          setNearbyAnimal(closestAnimal);
        }
      }

      // Phaser Game Configuration
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
        scene: [MainWorldScene],
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
  }, [setCurrentBiome]);

  // Dynamic Shader / CSS Filter Layer based on restoration level:
  // Starts ugly/desaturated (wildfire destruction) -> transitions to flourishing vibrant greens & colors!
  const currentRestorationLevel = restoration[currentBiome] || 0;
  // Calculate desaturation & ash filter
  // 0% restoration: 85% desaturated, dark, sepia haze
  // 100% restoration: 140% saturation, glowing vibrancy
  const grayscaleAmount = Math.max(0, 85 - currentRestorationLevel * 0.85);
  const saturationAmount = 70 + currentRestorationLevel * 0.7; // 70% to 140%
  const sepiaAmount = Math.max(0, 30 - currentRestorationLevel * 0.3); // 30% to 0%

  const canvasFilterStyle = {
    filter: `grayscale(${grayscaleAmount}%) saturate(${saturationAmount}%) sepia(${sepiaAmount}%) contrast(105%)`,
    transition: 'filter 1.2s ease-in-out',
  };

  const currentInfo = BIOMES_INFO[currentBiome];
  const animal = nearbyAnimal ? ANIMALS[nearbyAnimal] : null;

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden select-none bg-zinc-950">
      {/* 1. HTML5 Canvas Container with WebGL Dynamic Flourish Shader Filter */}
      <div
        ref={containerRef}
        style={canvasFilterStyle}
        className="w-full h-full cursor-crosshair"
      />

      {/* 2. Ash & Ember Smoldering Vignette (Visible when restoration is low) */}
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

      {/* 3. Flourishing Sunburst Glow (Visible when restoration reaches 100%) */}
      {currentRestorationLevel >= 90 && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-1000 animate-pulse"
          style={{
            background:
              'radial-gradient(circle at center, rgba(34, 197, 94, 0.12) 0%, transparent 70%)',
          }}
        />
      )}

      {/* 4. Active Biome HUD Card (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-sm">
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 shadow-2xl text-white">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full animate-ping"
                style={{ backgroundColor: currentInfo.color }}
              />
              <h2 className="font-bold text-sm tracking-wide text-zinc-100">
                {currentInfo.name}
              </h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300">
              {currentRestorationLevel}% Flourished
            </span>
          </div>

          <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
            {currentRestorationLevel >= 75
              ? currentInfo.flourishDescription
              : currentInfo.ashDescription}
          </p>

          {/* Biome Restoration Bar */}
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700/50 mb-2">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${currentRestorationLevel}%`,
                backgroundColor: currentRestorationLevel > 50 ? '#22c55e' : '#f97316',
              }}
            />
          </div>

          {/* Quick Quest Action Button */}
          {quests.find((q) => q.biome === currentBiome && !q.completed) && (
            <button
              onClick={() => {
                const quest = quests.find((q) => q.biome === currentBiome && !q.completed);
                if (quest) openQuestModal(quest.actionType);
              }}
              className="w-full mt-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Solve Environmental Crisis</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Floating Proximity Animal Interaction Banner (Center Bottom) */}
      {animal && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 animate-bounce">
          <button
            onClick={() => openDialogue(animal.id)}
            className="flex items-center gap-3 px-5 py-3 bg-zinc-900/95 hover:bg-zinc-850 text-white rounded-full border-2 border-emerald-500 shadow-2xl shadow-emerald-950 backdrop-blur-lg transition-transform active:scale-95"
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
                Earn {animal.coinName} ({animal.coinIcon}) & Learn Eco-Solutions
              </div>
            </div>
            <MessageSquare className="w-5 h-5 text-emerald-400 ml-1" />
          </button>
        </div>
      )}

      {/* 6. On-Screen Touch / Arrow Controls for Mobile & Clickers */}
      <div className="absolute bottom-24 right-4 z-20 flex flex-col items-center gap-1 bg-zinc-900/80 backdrop-blur-md p-2 rounded-2xl border border-zinc-800 shadow-xl sm:hidden">
        <span className="text-[10px] text-zinc-400 font-mono">TAP TO MOVE</span>
      </div>

      {/* 7. Controls Helper Hint (Bottom Left) */}
      <div className="absolute bottom-20 left-4 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800 text-zinc-400 text-[11px]">
        <Footprints className="w-3.5 h-3.5 text-emerald-400" />
        <span>WASD / Arrow Keys or Click ground to walk • Press [E] to talk • ({playerCoords.x}, {playerCoords.y})</span>
      </div>
    </div>
  );
}
