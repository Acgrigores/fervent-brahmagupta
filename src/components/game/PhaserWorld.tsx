'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { BiomeId, AnimalId } from '@/types/game';
import { ANIMALS, BIOMES_INFO, FARM_CROPS } from '@/data/animals';
import { sounds } from '@/utils/soundEffects';
import { MessageSquare, Sparkles, Footprints, ArrowLeft, ArrowRight, Sprout, AlertCircle, CheckCircle2 } from 'lucide-react';

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

const ROOM_HOTSPOTS: Record<BiomeId, Hotspot[]> = {
  clearing: [
    { id: 'crop_lake', name: 'Sweet Golden Corn', x: 260, y: 380, icon: '🌽', type: 'crop', targetBiome: 'lake' },
    { id: 'crop_forest', name: 'Canopy Apple Orchard', x: 200, y: 160, icon: '🍎', type: 'crop', targetBiome: 'forest' },
    { id: 'crop_tundra', name: 'Glacial Winter Wheat', x: 740, y: 180, icon: '🌾', type: 'crop', targetBiome: 'tundra' },
    { id: 'crop_grasslands', name: 'Pollinator Sunflowers', x: 800, y: 440, icon: '🌻', type: 'crop', targetBiome: 'grasslands' },
    { id: 'crop_desert', name: 'Sugar Melons', x: 680, y: 640, icon: '🍈', type: 'crop', targetBiome: 'desert' },
    { id: 'crop_reefs', name: 'Tidal Rice & Marsh', x: 280, y: 650, icon: '🌱', type: 'crop', targetBiome: 'reefs' },
    { id: 'gate_lake', name: 'To Crystal Lake', x: 80, y: 400, icon: '🌊', type: 'gate', targetBiome: 'lake' },
    { id: 'gate_forest', name: 'To Bamboo Forest', x: 100, y: 100, icon: '🎋', type: 'gate', targetBiome: 'forest' },
    { id: 'gate_tundra', name: 'To Glacial Tundra', x: 880, y: 80, icon: '❄️', type: 'gate', targetBiome: 'tundra' },
    { id: 'gate_grasslands', name: 'To Smart Prairie', x: 920, y: 440, icon: '🌻', type: 'gate', targetBiome: 'grasslands' },
    { id: 'gate_desert', name: 'To Savanna Oasis', x: 880, y: 660, icon: '⚡', type: 'gate', targetBiome: 'desert' },
    { id: 'gate_reefs', name: 'To Coral Barrier', x: 120, y: 680, icon: '🪸', type: 'gate', targetBiome: 'reefs' },
  ],
  lake: [
    { id: 'animal_manatee', name: 'Mo the Manatee', x: 440, y: 550, icon: '🦭', type: 'animal', animalId: 'manatee' },
    { id: 'quest_lake', name: 'Watershed Recycling Station', x: 800, y: 280, icon: '♻️', type: 'quest', questAction: 'lake_recycling' },
    { id: 'gate_farm', name: 'Return to Central Farm', x: 500, y: 700, icon: '🏡', type: 'gate', targetBiome: 'clearing' },
  ],
  forest: [
    { id: 'animal_red_panda', name: 'Paku the Red Panda', x: 480, y: 350, icon: '🦊', type: 'animal', animalId: 'red_panda' },
    { id: 'quest_forest', name: 'Forest Fire Defense Kit', x: 260, y: 480, icon: '🔥', type: 'quest', questAction: 'forest_campaign' },
    { id: 'gate_farm', name: 'Return to Central Farm', x: 500, y: 700, icon: '🏡', type: 'gate', targetBiome: 'clearing' },
  ],
  tundra: [
    { id: 'animal_polar_bear', name: 'Nanuk the Polar Bear', x: 390, y: 530, icon: '🐻‍❄️', type: 'animal', animalId: 'polar_bear' },
    { id: 'quest_tundra', name: 'Decommission Coal Plant', x: 700, y: 420, icon: '⚡', type: 'quest', questAction: 'tundra_petition' },
    { id: 'gate_farm', name: 'Return to Central Farm', x: 500, y: 700, icon: '🏡', type: 'gate', targetBiome: 'clearing' },
  ],
  grasslands: [
    { id: 'animal_butterfly', name: 'Aura the Monarch', x: 150, y: 240, icon: '🦋', type: 'animal', animalId: 'butterfly' },
    { id: 'quest_grasslands', name: 'Bayer Precision Weather Tower', x: 320, y: 380, icon: '🛰️', type: 'quest', questAction: 'grasslands_farming' },
    { id: 'gate_farm', name: 'Return to Central Farm', x: 500, y: 700, icon: '🏡', type: 'gate', targetBiome: 'clearing' },
  ],
  desert: [
    { id: 'animal_cheetah', name: 'Zuri the Cheetah', x: 340, y: 330, icon: '🐆', type: 'animal', animalId: 'cheetah' },
    { id: 'quest_desert', name: 'Solar Artesian Wellspring', x: 560, y: 370, icon: '☀️', type: 'quest', questAction: 'wildfire_quench' },
    { id: 'gate_farm', name: 'Return to Central Farm', x: 500, y: 700, icon: '🏡', type: 'gate', targetBiome: 'clearing' },
  ],
  reefs: [
    { id: 'animal_sea_turtle', name: 'Coralia the Sea Turtle', x: 580, y: 370, icon: '🐢', type: 'animal', animalId: 'sea_turtle' },
    { id: 'quest_reefs', name: 'Sanctuary Navigation Buoy', x: 220, y: 550, icon: '🧭', type: 'quest', questAction: 'reef_navigation' },
    { id: 'gate_farm', name: 'Return to Central Farm', x: 500, y: 700, icon: '🏡', type: 'gate', targetBiome: 'clearing' },
  ],
};

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

  const [activeNearbyHotspot, setActiveNearbyHotspot] = useState<Hotspot | null>(null);

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

  // Synchronize room changes with Phaser scene
  useEffect(() => {
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('IsometricWorldScene');
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

        class IsometricWorldScene extends Phaser.Scene {
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
          private backgroundSprite!: Phaser.GameObjects.Image;
          private hotspotsContainer!: Phaser.GameObjects.Container;
          private ambientParticlesContainer!: Phaser.GameObjects.Container;
          private currentHotspots: Hotspot[] = [];
          private speed: number = 300;
          private canvasWidth: number = 1000;
          private canvasHeight: number = 750;

          constructor() {
            super({ key: 'IsometricWorldScene' });
          }

          preload() {
            // Load the 7 high-definition 2.5D isometric images!
            this.load.image('room_clearing', '/assets/biomes/farm.jpg');
            this.load.image('room_lake', '/assets/biomes/lake.jpg');
            this.load.image('room_forest', '/assets/biomes/forest.jpg');
            this.load.image('room_tundra', '/assets/biomes/tundra.jpg');
            this.load.image('room_grasslands', '/assets/biomes/grasslands.jpg');
            this.load.image('room_desert', '/assets/biomes/desert.jpg');
            this.load.image('room_reefs', '/assets/biomes/reefs.jpg');
          }

          create() {
            this.canvasWidth = 1000;
            this.canvasHeight = 750;

            this.physics.world.setBounds(0, 0, this.canvasWidth, this.canvasHeight);
            this.cameras.main.setBounds(0, 0, this.canvasWidth, this.canvasHeight);

            // 1. Background image
            this.backgroundSprite = this.add.image(this.canvasWidth / 2, this.canvasHeight / 2, 'room_clearing');
            this.backgroundSprite.setDisplaySize(this.canvasWidth, this.canvasHeight);

            // 2. Hotspots container
            this.hotspotsContainer = this.add.container(0, 0);

            // 3. Ambient particles container
            this.ambientParticlesContainer = this.add.container(0, 0);

            // 4. Input controls
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

            // Click / tap to move
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

            // 5. Create Player
            this.createPlayer(500, 480);

            // 6. Build initial room
            this.loadRoomData(stateRef.current.currentBiome);
          }

          private createPlayer(x: number, y: number) {
            this.playerGlow = this.add.circle(x, y, 26, 0x10b981, 0.4);
            this.tweens.add({
              targets: this.playerGlow,
              scale: 1.3,
              alpha: 0.15,
              duration: 800,
              yoyo: true,
              repeat: -1,
            });

            this.player = this.add.circle(x, y, 16, 0x10b981, 1);
            this.player.setStrokeStyle(3, 0xffffff, 1);
            this.physics.add.existing(this.player);

            this.playerEmoji = this.add.text(x, y - 1, '👨‍🌾', { fontSize: '20px' }).setOrigin(0.5);

            this.events.on('update', () => {
              this.playerGlow.setPosition(this.player.x, this.player.y);
              this.playerEmoji.setPosition(this.player.x, this.player.y - 1);
            });
          }

          public changeRoom(newBiome: BiomeId) {
            if (newBiome === this.currentRoomId) return;

            sounds.playBloom();
            this.cameras.main.fadeOut(200, 0, 0, 0, (_camera: any, progress: number) => {
              if (progress === 1) {
                this.currentRoomId = newBiome;
                this.loadRoomData(newBiome);

                // Spawn position
                if (newBiome === 'clearing') {
                  this.teleportPlayer(500, 480);
                } else {
                  this.teleportPlayer(500, 620);
                }

                this.cameras.main.fadeIn(200, 0, 0, 0);
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

          private loadRoomData(biome: BiomeId) {
            this.backgroundSprite.setTexture(`room_${biome}`);
            this.hotspotsContainer.removeAll(true);
            this.ambientParticlesContainer.removeAll(true);
            setActiveNearbyHotspot(null);

            this.currentHotspots = ROOM_HOTSPOTS[biome] || [];

            // Spawn interactive hotspots for this room
            this.currentHotspots.forEach((hs) => {
              const container = this.add.container(hs.x, hs.y);

              // Pulsing aura ring
              const aura = this.add.circle(0, 0, 24, 0x10b981, 0.3);
              this.tweens.add({
                targets: aura,
                scale: 1.35,
                alpha: 0.1,
                duration: 1000,
                yoyo: true,
                repeat: -1,
              });

              // Icon bubble
              const bubble = this.add.circle(0, 0, 18, 0x09090b, 0.9);
              bubble.setStrokeStyle(2, hs.type === 'crop' ? 0xf59e0b : hs.type === 'gate' ? 0x38bdf8 : 0x10b981);

              const emoji = this.add.text(0, -1, hs.icon, { fontSize: '18px' }).setOrigin(0.5);

              // Floating tag
              const tag = this.add.text(0, 28, hs.name, {
                fontSize: '10px',
                fontStyle: 'bold',
                fontFamily: 'system-ui',
                color: '#ffffff',
                backgroundColor: '#09090bf0',
                padding: { x: 6, y: 2 },
              }).setOrigin(0.5);

              container.add([aura, bubble, emoji, tag]);

              // Bouncing animation
              this.tweens.add({
                targets: container,
                y: hs.y - 4,
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
              });

              // Click interaction
              bubble.setInteractive({ useHandCursor: true });
              bubble.on('pointerdown', () => {
                this.triggerHotspotAction(hs);
              });

              this.hotspotsContainer.add(container);
            });

            // Ambient particles (butterflies, pollen, or embers depending on restoration)
            const isRestored = (stateRef.current.restoration[biome] || 0) >= 80;
            const particleCount = isRestored ? 25 : 10;
            const particleColor = isRestored ? 0xfacc15 : 0xf97316;

            for (let i = 0; i < particleCount; i++) {
              const p = this.add.circle(
                Math.random() * this.canvasWidth,
                Math.random() * this.canvasHeight,
                Math.random() * 2.5 + 1.5,
                particleColor,
                0.7
              );
              this.tweens.add({
                targets: p,
                y: p.y - 40 - Math.random() * 30,
                x: p.x + (Math.random() - 0.5) * 40,
                alpha: 0.1,
                duration: 2000 + Math.random() * 2000,
                repeat: -1,
                yoyo: true,
              });
              this.ambientParticlesContainer.add(p);
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

          update() {
            let vx = 0;
            let vy = 0;

            const isShift = this.wasd?.SHIFT.isDown || this.cursors?.shift?.isDown;
            const currentSpeed = isShift ? 450 : this.speed;

            if (this.cursors && this.wasd) {
              if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
              if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
              if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
              if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

              if (Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
                if (activeNearbyHotspot) {
                  this.triggerHotspotAction(activeNearbyHotspot);
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

            if (vx !== 0 || vy !== 0) {
              const len = Math.sqrt(vx * vx + vy * vy);
              vx = (vx / len) * currentSpeed;
              vy = (vy / len) * currentSpeed;
            }

            const body = this.player.body as Phaser.Physics.Arcade.Body;
            if (body) {
              body.setVelocity(vx, vy);
            }

            // Proximity detection to hotspots
            let nearest: Hotspot | null = null;
            let minDistance = 65;

            for (const hs of this.currentHotspots) {
              const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, hs.x, hs.y);
              if (dist < minDistance) {
                minDistance = dist;
                nearest = hs;
              }
            }

            setActiveNearbyHotspot(nearest);
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
          scene: [IsometricWorldScene],
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
  // Dynamic WebGL / CSS Filter Layer:
  // Starts dead, dreary, desaturated, ash-covered (0%) -> becomes lush, sunlit, vibrant (100%)!
  const grayscaleAmount = Math.max(0, 85 - currentRestorationLevel * 0.85);
  const saturationAmount = 70 + currentRestorationLevel * 0.7;
  const sepiaAmount = Math.max(0, 35 - currentRestorationLevel * 0.35);
  const brightnessAmount = 75 + currentRestorationLevel * 0.35;

  const canvasFilterStyle = {
    filter: `grayscale(${grayscaleAmount}%) saturate(${saturationAmount}%) sepia(${sepiaAmount}%) brightness(${brightnessAmount}%)`,
    transition: 'filter 1.2s ease-in-out',
  };

  const currentCrop = currentBiome !== 'clearing' ? FARM_CROPS[currentBiome] : null;

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden select-none bg-zinc-950 flex items-center justify-center">
      {/* HTML5 Canvas with Dynamic Shader */}
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

      {/* Sunny Bloom Glow when restored */}
      {currentRestorationLevel >= 85 && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
          style={{
            background:
              'radial-gradient(circle at center, rgba(34, 197, 94, 0.08) 0%, transparent 70%)',
          }}
        />
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

      {/* Proximity Interaction Prompt (Center Bottom) */}
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
                {activeNearbyHotspot.type === 'crop' && 'Visit failing crop in this biome'}
                {activeNearbyHotspot.type === 'quest' && 'Launch conservation action & save crop'}
                {activeNearbyHotspot.type === 'gate' && 'Travel through gate to this area'}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Controls Hint */}
      <div className="absolute bottom-20 left-4 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800 text-zinc-400 text-[11px]">
        <Footprints className="w-3.5 h-3.5 text-emerald-400" />
        <span>WASD / Arrow Keys or Click to walk • Press [E] to interact • Use Top Bar to jump rooms</span>
      </div>
    </div>
  );
}
