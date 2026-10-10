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
    openCropModal,
  } = useGameState();

  const [activeNearbyHotspot, setActiveNearbyHotspot] = useState<Hotspot | null>(null);

  const stateRef = useRef({
    currentBiome,
    restoration,
    openDialogue,
    setCurrentBiome,
    openQuestModal,
    openCropModal,
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
      openCropModal,
    };
  }, [currentBiome, restoration, openDialogue, setCurrentBiome, openQuestModal, openCropModal]);

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
          private currentPathWaypoints: { x: number; y: number }[] = [];
          private readonly TILE_SIZE: number = 15;
          public currentRoomId: BiomeId = 'clearing';
          private worldContainer!: Phaser.GameObjects.Container;
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
          private nextStepTime: number = 0;
          private stepInterval: number = 250;
          private ignorePathClickUntil: number = 0;
          private mushroomObj: Phaser.GameObjects.Container | null = null;
          private mushroomJumpTween: Phaser.Tweens.Tween | null = null;
          private tundraIcePatch: Phaser.Geom.Rectangle | null = null;
          private isSlidingOnIce: boolean = false;
          private lastIceSlideSoundTime: number = 0;
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
            container: Phaser.GameObjects.Container;
            sprite: Phaser.GameObjects.Image;
            season: 'summer' | 'autumn';
          }[] = [];

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

            // Set little green sprout custom cursor
            this.input.setDefaultCursor("url('/assets/sprout_cursor.svg') 2 4, auto");

            this.worldContainer = this.add.container(0, 0);
            this.worldContainer.setDepth(1);

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

              const target = this.getClosestPointOnWalkablePath(pointer.x, pointer.y);
              const clickDistFromPath = Phaser.Math.Distance.Between(pointer.x, pointer.y, target.x, target.y);

              // Allow clicks directly on path or within 90px (e.g. clicking animals, signs, or path edges)
              if (clickDistFromPath <= 90) {
                this.walkPlayerTo(pointer.x, pointer.y);
              }
            });

            // Create Farmer Avatar Sprite at central farm plaza
            this.createFarmerPlayer(this.canvasW / 2, 420);

            // Initial Room Build & Biome Background Music
            this.currentRoomId = stateRef.current.currentBiome;
            this.buildRoom(this.currentRoomId);
            sounds.setBiome(this.currentRoomId);
          }

          private createFarmerPlayer(x: number, y: number) {
            this.player = this.add.container(x, y);
            this.player.setDepth(50);

            // Soft ground shadow anchored precisely at the feet (0, 0)
            const shadow = this.add.ellipse(0, 0, 32, 12, 0x000000, 0.4);

            // Farmer image sprite with origin at the bottom feet (0.5, 1.0)
            this.playerSprite = this.add.image(0, 0, 'farmer');
            this.playerSprite.setDisplaySize(54, 54);
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
            sounds.setBiome(biome);
            this.nextStepTime = this.time ? this.time.now + 600 : 0;

            const previousRoom = this.currentRoomId;

            let executed = false;
            const finishTransition = () => {
              if (executed) return;
              executed = true;

              this.currentRoomId = biome;
              this.buildRoom(biome);

              // Determine opposite-side entry coordinates with large safety margin
              const w = this.canvasW;
              if (customSpawn) {
                this.teleportPlayer(customSpawn.x, customSpawn.y);
              } else if (biome === 'clearing') {
                // Entering Central Farm from a biome:
                if (previousRoom === 'lake') {
                  // Lake is on Left -> entered farm on Left edge, spawn at x = 260
                  this.teleportPlayer(260, 420);
                } else if (previousRoom === 'grasslands') {
                  // Grasslands is on Right -> entered farm on Right edge, spawn at x = w - 260
                  this.teleportPlayer(w - 260, 420);
                } else if (previousRoom === 'forest') {
                  // Forest is North-West -> entered farm at North-West lane, spawn at y = 180
                  this.teleportPlayer(190, 180);
                } else if (previousRoom === 'tundra') {
                  // Tundra is North-Center -> entered farm at North Avenue, spawn at y = 180
                  this.teleportPlayer(w / 2, 180);
                } else if (previousRoom === 'reefs') {
                  // Reefs is South-Center -> entered farm at South Avenue, spawn at y = 570
                  this.teleportPlayer(w / 2, 570);
                } else if (previousRoom === 'desert') {
                  // Desert is South-East -> entered farm at South-East lane, spawn at y = 570
                  this.teleportPlayer(w - 170, 570);
                } else {
                  this.teleportPlayer(w / 2, 420);
                }
              } else {
                // Entering a specific Biome from Central Farm:
                if (biome === 'lake') {
                  // Exited Farm on Left -> enter Lake on the RIGHT edge! (Spawn at x = w - 260)
                  this.teleportPlayer(w - 260, 375);
                } else if (biome === 'grasslands') {
                  // Exited Farm on Right -> enter Grasslands on the LEFT edge! (Spawn at x = 260)
                  this.teleportPlayer(260, 375);
                } else if (biome === 'forest' || biome === 'tundra') {
                  // Exited Farm on Top -> enter at the BOTTOM edge! (Spawn at y = 570)
                  this.teleportPlayer(w / 2, 570);
                } else if (biome === 'reefs' || biome === 'desert') {
                  // Exited Farm on Bottom -> enter at the TOP edge! (Spawn at y = 180)
                  this.teleportPlayer(w / 2, 180);
                } else {
                  this.teleportPlayer(w / 2, 375);
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
            this.footprintsContainer.removeAll(true);
            this.signsContainer.removeAll(true);
            this.pathPolygons = [];
            this.currentHotspots = [];
            this.nearbyHotspot = null;
            stateRef.current.activeHotspotId = null;
            setActiveNearbyHotspot(null);
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

            const isRestored = (stateRef.current.restoration[biome] || 0) >= 80;

            if (biome === 'clearing') {
              this.buildMaximalistFarmRoom();
            } else {
              this.buildMaximalistBiomeRoom(biome, isRestored);
            }
          }

          // ===============================================================
          // 🪵 VINTAGE WOODEN POSTED SIGN HELPER (RUSTIC CARVED SIGNS)
          // Text is white, slightly larger, non-pixelated, and signs expand dynamically in height
          // ===============================================================
          private createVintageWoodenSign(
            x: number,
            y: number,
            title: string,
            subtitle?: string,
            width: number = 180,
            baseHeight: number = 44,
            statusColor: string = '#ffffff',
            onClick?: () => void,
            postPos: 'bottom' | 'top' | 'none' = 'bottom'
          ): Phaser.GameObjects.Container {
            const container = this.add.container(x, y);

            // Clean, non-pixelated, smooth modern font
            const smoothFont = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

            // Title Text: Pure white, slightly larger, crisp outline
            const titleFontSize = subtitle ? '12.5px' : '13.5px';
            const titleText = this.add.text(0, 0, title, {
              fontSize: titleFontSize,
              fontStyle: 'bold',
              fontFamily: smoothFont,
              color: '#ffffff',
              stroke: '#1c0d02',
              strokeThickness: 2.5,
              wordWrap: { width: width - 20, useAdvancedWrap: true },
              align: 'center',
            }).setOrigin(0.5);

            let subText: Phaser.GameObjects.Text | null = null;
            if (subtitle) {
              subText = this.add.text(0, 0, subtitle, {
                fontSize: '10px',
                fontStyle: '600',
                fontFamily: smoothFont,
                color: '#ffffff',
                stroke: '#1c0d02',
                strokeThickness: 2,
                wordWrap: { width: width - 20, useAdvancedWrap: true },
                align: 'center',
              }).setOrigin(0.5);
            }

            // Calculate needed height so text NEVER runs off of the sign
            const titleHeight = titleText.height;
            const subHeight = subText ? subText.height : 0;
            const textSpacing = 4;
            const verticalPadding = 18;
            const totalContentHeight = titleHeight + (subHeight > 0 ? subHeight + textSpacing : 0);
            const actualHeight = Math.max(baseHeight, totalContentHeight + verticalPadding);

            // Position text elements vertically centered
            if (subText) {
              titleText.y = -actualHeight / 2 + verticalPadding / 2 + titleHeight / 2;
              subText.y = titleText.y + titleHeight / 2 + textSpacing + subHeight / 2;
            } else {
              titleText.y = 0;
            }

            // 1. Sturdy Wooden Post (connected cleanly to actualHeight)
            if (postPos === 'bottom') {
              const post = this.add.rectangle(0, actualHeight / 2 + 10, 14, 26, 0x451a03);
              const postHighlight = this.add.rectangle(-2, actualHeight / 2 + 10, 4, 24, 0x78350f);
              container.add([post, postHighlight]);
            } else if (postPos === 'top') {
              const post = this.add.rectangle(0, -actualHeight / 2 - 10, 14, 26, 0x451a03);
              const postHighlight = this.add.rectangle(-2, -actualHeight / 2 - 10, 4, 24, 0x78350f);
              container.add([post, postHighlight]);
            }

            // 2. Vintage Wooden Plank Board (Sized dynamically to actualHeight)
            const shadow = this.add.rectangle(2, 2, width, actualHeight, 0x000000, 0.45);
            const boardRim = this.add.rectangle(0, 0, width, actualHeight, 0x3e1a06);
            const boardFace = this.add.rectangle(0, 0, width - 4, actualHeight - 4, 0x78350f);
            const grain1 = this.add.rectangle(0, -actualHeight / 4 + 2, width - 12, 1, 0x92400e, 0.7);
            const grain2 = this.add.rectangle(0, actualHeight / 4 - 2, width - 12, 1, 0x5c2c16, 0.7);

            // Corner nail rivets
            const nail1 = this.add.circle(-width / 2 + 7, -actualHeight / 2 + 7, 2.5, 0xd97706);
            const nail2 = this.add.circle(width / 2 - 7, -actualHeight / 2 + 7, 2.5, 0xd97706);
            const nail3 = this.add.circle(-width / 2 + 7, actualHeight / 2 - 7, 2.5, 0xd97706);
            const nail4 = this.add.circle(width / 2 - 7, actualHeight / 2 - 7, 2.5, 0xd97706);

            container.add([shadow, boardRim, boardFace, grain1, grain2, nail1, nail2, nail3, nail4]);
            container.add(titleText);
            if (subText) {
              container.add(subText);
            }

            if (onClick) {
              boardFace.setInteractive({ useHandCursor: true });
              boardFace.on('pointerdown', onClick);
              titleText.setInteractive({ useHandCursor: true });
              titleText.on('pointerdown', onClick);
              if (subText) {
                subText.setInteractive({ useHandCursor: true });
                subText.on('pointerdown', onClick);
              }
            }

            this.signsContainer.add(container);
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
              new Phaser.Geom.Rectangle(w / 2 - 70, 350, 140, 140),
              // Main Horizontal Dirt Highway leading completely offscreen West & East
              new Phaser.Geom.Rectangle(-60, 390, w + 120, 60),
              // Main Vertical Dirt Avenue leading completely offscreen North & South
              new Phaser.Geom.Rectangle(w / 2 - 30, -60, 60, 870),
              // West Access Lane leading up to Forest exit
              new Phaser.Geom.Rectangle(160, -60, 60, 500),
              // East Access Lane leading down to Desert exit
              new Phaser.Geom.Rectangle(w - 200, 390, 60, 420),
            ];

            // Render Packed Dirt Paths
            this.renderBiomePaths('path_farm');

            // 3. Buildings & Orchard Grove
            // Farmhouse Cottage
            const house = this.add.image(w / 2 - 360, 120, 'house');
            house.setDisplaySize(140, 140);
            this.worldContainer.add(house);

            // Clumped Orchard Grove
            const orchardSoil = this.add.ellipse(w / 2 - 190, 130, 150, 95, 0x543315, 0.4);
            const trees1 = this.add.image(w / 2 - 230, 115, 'trees').setDisplaySize(95, 95);
            const trees2 = this.add.image(w / 2 - 150, 110, 'trees').setDisplaySize(95, 95);
            const trees3 = this.add.image(w / 2 - 190, 145, 'trees').setDisplaySize(100, 100);
            this.worldContainer.add([orchardSoil, trees1, trees2, trees3]);

            // Barn & Silo
            const barn = this.add.image(w / 2 + 350, 120, 'barn');
            barn.setDisplaySize(150, 150);
            this.worldContainer.add(barn);

            // Swimming Pool in Southwest sector
            this.renderSwimmingPool(w / 2 - 360, 580);

            // 4. Six Dedicated Crop Fields (Displays One Dead vs Flourishing Image!)
            this.renderFarmCropField(w / 2 - 360, 290, 'lake', 'Golden Sweet Corn', 'Lake Water Polluted');
            this.renderFarmCropField(w / 2 - 170, 290, 'forest', 'Canopy Apple Orchard', 'Wildfire Smoke Blight');
            this.renderFarmCropField(w / 2 + 170, 200, 'tundra', 'Glacial Winter Wheat', 'Coal Soot Fallout');
            this.renderFarmCropField(w / 2 + 350, 290, 'grasslands', 'Giant Sunflowers', 'Pesticide & Topsoil Loss');
            this.renderFarmCropField(w / 2 - 170, 580, 'reefs', 'Tidal Rice & Kelp', 'Boat Propellers & Oil');
            this.renderFarmCropField(w / 2 + 330, 580, 'desert', 'Sugar Melons', 'Aquifer Depleted');

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
              stateRef.current.openCropModal(biome);
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
                stateRef.current.openCropModal(biome);
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
            const w = this.canvasW;
            this.createGateSign(80, 420, 'lake', '← LAKE DOCK', 'Golden Sweet Corn');
            this.createGateSign(190, 40, 'forest', '↑ CLOUD FOREST', 'Apple Orchard');
            this.createGateSign(w / 2, 40, 'tundra', '↑ ARCTIC TUNDRA', 'Winter Wheat');
            this.createGateSign(w - 80, 420, 'grasslands', 'PRAIRIE →', 'Giant Sunflowers');
            this.createGateSign(w - 170, 710, 'desert', '↓ DESERT OASIS', 'Sugar Melons');
            this.createGateSign(w / 2, 710, 'reefs', '↓ CORAL REEFS', 'Tidal Rice');
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
              164,
              38,
              '#ffffff',
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
              this.spawnBiomeAnimal(animalId, w / 2, 330);
            }

            // 4. Action Plan Quest Station at (w / 2, 180)
            this.spawnBiomeQuestStation(biome, isRestored);

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
              }
            }

            // 6. Return to Central Farm Signpost placed at exit edge
            if (biome === 'lake') {
              this.createVintageWoodenSign(
                w - 90,
                375,
                'FARM PORTAL →',
                'Return to Central Farm',
                170,
                38,
                '#ffffff',
                () => {
                  sounds.playClick();
                  stateRef.current.setCurrentBiome('clearing');
                },
                'none'
              );
              this.currentHotspots.push({
                id: 'gate_clearing',
                name: 'Return to Central Farm',
                x: w - 90,
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
                170,
                38,
                '#ffffff',
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
                w / 2,
                710,
                '↓ RETURN TO CENTRAL FARM',
                'Opposite Portal to Bayer Farm',
                230,
                38,
                '#ffffff',
                () => {
                  sounds.playClick();
                  stateRef.current.setCurrentBiome('clearing');
                },
                'top'
              );
              this.currentHotspots.push({
                id: 'gate_clearing',
                name: 'Return to Central Farm',
                x: w / 2,
                y: 710,
                type: 'gate',
                targetBiome: 'clearing',
              });
            } else if (biome === 'reefs' || biome === 'desert') {
              this.createVintageWoodenSign(
                w / 2,
                40,
                '↑ RETURN TO CENTRAL FARM',
                'Opposite Portal to Bayer Farm',
                230,
                38,
                '#ffffff',
                () => {
                  sounds.playClick();
                  stateRef.current.setCurrentBiome('clearing');
                },
                'bottom'
              );
              this.currentHotspots.push({
                id: 'gate_clearing',
                name: 'Return to Central Farm',
                x: w / 2,
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
              this.canvasW / 2,
              180,
              isRestored ? `✓ RESTORED: ${qInfo.name}` : `ACTION PLAN: ${qInfo.name}`,
              isRestored ? 'Habitat Flourishing • Tap to review action' : 'Tap sign to launch environmental action',
              320,
              44,
              '#ffffff',
              triggerAction,
              'bottom'
            );

            this.currentHotspots.push({
              id: `quest_${biome}`,
              name: qInfo.name,
              x: this.canvasW / 2,
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

            // Gentle ambient glow inviting the sprite
            const mGlow = this.add.circle(0, 2, 24, 0xef4444, 0.2);
            this.tweens.add({
              targets: mGlow,
              scale: 1.3,
              alpha: 0.05,
              duration: 900,
              yoyo: true,
              repeat: -1,
            });

            mContainer.add([mShadow, mGlow, mSprite]);

            mSprite.setInteractive({ useHandCursor: true });
            mSprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
              pointer.event?.stopPropagation?.();
              this.walkPlayerTo(mx, my);
            });

            this.worldContainer.add(mContainer);
            this.mushroomObj = mContainer;

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

              const tShadow = this.add.ellipse(0, 42, 90, 26, 0x000000, 0.35);
              const tSprite = this.add.image(0, 0, 'trees');
              tSprite.setDisplaySize(115, 115);
              tSprite.setOrigin(0.5, 0.85);

              tContainer.add([tShadow, tSprite]);

              const treeData = {
                container: tContainer,
                sprite: tSprite,
                season: 'summer' as 'summer' | 'autumn',
              };
              this.interactiveForestTrees.push(treeData);

              tSprite.setInteractive({ useHandCursor: true });
              tSprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                pointer.event?.stopPropagation?.();
                this.ignorePathClickUntil = this.time.now + 250;
                this.toggleForestTreeSeason(treeData);
              });

              this.worldContainer.add(tContainer);
            });
          }

          private toggleForestTreeSeason(treeData: {
            container: Phaser.GameObjects.Container;
            sprite: Phaser.GameObjects.Image;
            season: 'summer' | 'autumn';
          }) {
            sounds.playRustle();

            // Joyful wobble
            this.tweens.add({
              targets: treeData.container,
              angle: { from: -4, to: 4 },
              duration: 80,
              yoyo: true,
              repeat: 3,
              onComplete: () => {
                treeData.container.angle = 0;
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

            // Sparkling frost glint
            const glint = this.add.circle(45, -16, 3, 0xffffff, 0.9);
            this.tweens.add({
              targets: glint,
              scale: { from: 0.6, to: 1.5 },
              alpha: { from: 0.3, to: 1.0 },
              duration: 700,
              yoyo: true,
              repeat: -1,
            });

            iceContainer.add([iceBase, shine, crack1, crack2, glint]);
            this.worldContainer.add(iceContainer);

            // Warning sign beside ice
            this.createVintageWoodenSign(
              iceX,
              iceY - 50,
              '❄️ GLACIAL ICE SHEET',
              'Caution: Slippery! Slide across',
              180,
              30,
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

            this.worldContainer.add(grassContainer);

            this.grasslandsGrassPatch = {
              x: gx,
              y: gy,
              container: grassContainer,
              restingButterflies,
              triggered: false,
              readyAt: 0,
            };
          }

          private triggerButterflySwarm(
            gx: number,
            gy: number,
            grassContainer: Phaser.GameObjects.Container,
            restingButterflies: Phaser.GameObjects.Image[]
          ) {
            sounds.playFlutter();

            // Rustle grass blades
            this.tweens.add({
              targets: grassContainer,
              scaleX: 1.2,
              scaleY: 0.8,
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

              trunk.setInteractive({ useHandCursor: true });
              arm.setInteractive({ useHandCursor: true });

              const onCactusClick = (pointer: Phaser.Input.Pointer) => {
                pointer.event?.stopPropagation?.();
                this.ignorePathClickUntil = this.time.now + 200;
                sounds.playClick();

                waveTween.setTimeScale(2.5);
                this.time.delayedCall(1600, () => waveTween.setTimeScale(1.0));

                this.spawnFloatingBubble(pos.x, pos.y - 48, '🌵 👋 Howdy!');
              };

              trunk.on('pointerdown', onCactusClick);
              arm.on('pointerdown', onCactusClick);

              this.worldContainer.add(cContainer);
            });
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
            this.worldContainer.add(anemoneContainer);

            // Nemo clownfish sprite
            const nemoContainer = this.add.container(nemoX, nemoY);
            nemoContainer.setDepth(25);

            const nemoSprite = this.add.image(0, 0, 'nemo');
            nemoSprite.setDisplaySize(54, 54);
            nemoSprite.setOrigin(0.5, 0.5);

            nemoContainer.add(nemoSprite);
            this.worldContainer.add(nemoContainer);

            const nemoData = {
              container: nemoContainer,
              sprite: nemoSprite,
              baseX: nemoX,
              baseY: nemoY,
              isSpinning: false,
            };
            this.nemoObj = nemoData;

            nemoSprite.setInteractive({ useHandCursor: true });
            nemoSprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
              pointer.event?.stopPropagation?.();
              this.ignorePathClickUntil = this.time.now + 200;
              this.triggerNemoLoop(nemoData);
            });
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

            // 360 loop-de-loop spin
            this.tweens.add({
              targets: nemoData.sprite,
              angle: 360,
              scaleX: 1.25,
              scaleY: 1.25,
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
            // 🍄 FOREST MUSHROOM BOUNCING EASTER EGG
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
                    this.tweens.add({
                      targets: mSprite,
                      scaleX: 1.35,
                      scaleY: 0.7,
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
            // 🦋 GRASSLANDS BUTTERFLY PATCH EASTER EGG
            // When sprite walks through grass, butterflies fly up and away
            // ===============================================================
            if (this.currentRoomId === 'grasslands' && this.grasslandsGrassPatch) {
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
            // 🐠 REEF NEMO SWIMMING EASTER EGG
            // ===============================================================
            if (this.currentRoomId === 'reefs' && this.nemoObj) {
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
                if (this.player.x <= 22) {
                  stateRef.current.setCurrentBiome('lake');
                  return;
                }
                if (this.player.x >= w - 22) {
                  stateRef.current.setCurrentBiome('grasslands');
                  return;
                }
                if (this.player.y <= 22 && this.player.x < 450) {
                  stateRef.current.setCurrentBiome('forest');
                  return;
                }
                if (this.player.y <= 22 && this.player.x >= 450) {
                  stateRef.current.setCurrentBiome('tundra');
                  return;
                }
                if (this.player.y >= h - 22 && this.player.x < w - 450) {
                  stateRef.current.setCurrentBiome('reefs');
                  return;
                }
                if (this.player.y >= h - 22 && this.player.x >= w - 450) {
                  stateRef.current.setCurrentBiome('desert');
                  return;
                }
              } else {
                if (this.currentRoomId === 'lake' && this.player.x >= w - 22) {
                  stateRef.current.setCurrentBiome('clearing');
                  return;
                }
                if (this.currentRoomId === 'grasslands' && this.player.x <= 22) {
                  stateRef.current.setCurrentBiome('clearing');
                  return;
                }
                if (
                  (this.currentRoomId === 'forest' || this.currentRoomId === 'tundra') &&
                  this.player.y >= h - 22
                ) {
                  stateRef.current.setCurrentBiome('clearing');
                  return;
                }
                if (
                  (this.currentRoomId === 'reefs' || this.currentRoomId === 'desert') &&
                  this.player.y <= 22
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
              setActiveNearbyHotspot(nearest);
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

            // Biome-specific footprint colors & opacity for distinct visibility
            let printColor = 0x241105; // rich dark loam boot print
            let printAlpha = 0.85;
            let strokeColor = 0x140702;

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

            const foot = this.add.container(fx, fy);
            foot.setRotation(moveAngle);

            // Detailed boot print: Front sole + Back heel with subtle crisp edge
            const sole = this.add.ellipse(3, 0, 9, 6, printColor, printAlpha).setStrokeStyle(1, strokeColor, 0.4);
            const heel = this.add.ellipse(-3.5, 0, 5, 4.5, printColor, printAlpha * 0.95).setStrokeStyle(1, strokeColor, 0.4);

            foot.add([sole, heel]);
            this.footprintsContainer.add(foot);

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
        className="w-full h-full flex items-center justify-center overflow-hidden border-y-4 border-[#3e1a06] bg-[#1c1917] shadow-inner [&>canvas]:!w-full [&>canvas]:!h-full [&>canvas]:!object-cover"
        style={{ cursor: "url('/assets/sprout_cursor.svg') 2 4, auto" }}
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
              } else if (activeNearbyHotspot.type === 'crop' && activeNearbyHotspot.targetBiome && activeNearbyHotspot.targetBiome !== 'clearing') {
                openCropModal(activeNearbyHotspot.targetBiome as Exclude<BiomeId, 'clearing'>);
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
