import React, { useEffect, useRef, useState } from 'react';
import { partyAudio } from './audio';
import { drawHeroSprite } from './CharacterArt';
import { ArrowGlyphSvg } from './MiniGameArt';
import {
  MARIO_MINI_GAME_MAP,
  mulberry32,
  PARTY_CHARACTER_MAP,
  type MarioMiniGameId,
  type PartyCharacterId,
} from './types';

export interface MiniGamePlayProps {
  gameId: MarioMiniGameId;
  seed: number;
  durationSec: number;
  characterId: PartyCharacterId;
  rivalCharacterId?: PartyCharacterId;
  rivalProgress?: number;
  rivalScore?: number;
  lang: 'ar' | 'en';
  onLiveUpdate: (score: number, progress: number, done: boolean) => void;
}

const CANVAS_W = 720;
const CANVAS_H = 420;

interface FloatingPop {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export const MiniGamesArcadeCanvas: React.FC<MiniGamePlayProps> = ({
  gameId,
  seed,
  durationSec,
  characterId,
  rivalCharacterId,
  rivalProgress = 0,
  lang,
  onLiveUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hudScore, setHudScore] = useState(0);
  const [hudTime, setHudTime] = useState(durationSec);
  const [hudHint, setHudHint] = useState('');

  const keysRef = useRef<Record<string, boolean>>({});
  const pointerRef = useRef<{ down: boolean; x: number; y: number; justPressed: boolean }>({
    down: false,
    x: CANVAS_W / 2,
    y: CANVAS_H / 2,
    justPressed: false,
  });
  const rivalProgressRef = useRef(rivalProgress);
  rivalProgressRef.current = rivalProgress;

  const onLiveUpdateRef = useRef(onLiveUpdate);
  onLiveUpdateRef.current = onLiveUpdate;

  const spec = MARIO_MINI_GAME_MAP[gameId];
  const heroColor = PARTY_CHARACTER_MAP[characterId]?.primary ?? '#ef4444';

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', ' '].includes(e.key) ||
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)
      ) {
        e.preventDefault();
      }
      if (!keysRef.current[e.code]) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          pointerRef.current.justPressed = true;
        }
      }
      keysRef.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rng = mulberry32(seed || 12345);
    let score = 0;
    let elapsed = 0;
    let done = false;
    let lastSyncAt = 0;
    let lastHudAt = 0;
    let rafId = 0;
    let lastTs = performance.now();

    const pops: FloatingPop[] = [];
    const addPop = (x: number, y: number, text: string, color: string) => {
      pops.push({ x, y, text, color, life: 0.7 });
    };

    // Player kinematic state shared cleanly across all 15 canvas games
    const player = {
      x: CANVAS_W * 0.5,
      y: CANVAS_H - 76,
      vx: 0,
      vy: 0,
      facing: 1 as 1 | -1,
      onGround: true,
      jumpsLeft: 2,
      anim: 0,
      invuln: 0,
    };

    // Per-game arena objects (deterministic from seed!)
    type Block = { x: number; y: number; kind: 'coin' | 'star' | 'spike'; cooldown: number; bump: number };
    const blocks: Block[] = [];

    type PipeObs = { x: number; h: number; w: number; passed: boolean; hasCoin: boolean; coinTaken: boolean; isFire?: boolean };
    const pipes: PipeObs[] = [];

    type FallingObj = { x: number; y: number; vy: number; kind: 'coin' | 'star' | 'bomb' | 'thwomp'; r: number };
    const falling: FallingObj[] = [];

    type CloudPlat = { x: number; y: number; w: number; hasCoin: boolean };
    const clouds: CloudPlat[] = [];
    let cameraY = 0;
    let maxHeight = 0;

    type TargetObj = { x: number; y: number; vx: number; vy: number; r: number; kind: 'koopa' | 'star' | 'bomb'; alive: boolean };
    const targets: TargetObj[] = [];
    type Shot = { x: number; y: number; vx: number; vy: number; life: number };
    const shots: Shot[] = [];

    // Boo Red Light state
    let booLooking = false;
    let booWarn = false;
    let booTimer = 2.2;
    let booDistance = 0;
    let booFrozenPenalty = 0;

    // Bullet Bill Airship state
    type Bullet = { x: number; y: number; vx: number; vy: number; r: number };
    const bullets: Bullet[] = [];
    type LaserWarn = { x: number; y: number; vx: number; vy: number; timer: number };
    const laserWarns: LaserWarn[] = [];
    let playerShield = false;
    type Pickup = { x: number; y: number; kind: 'coin' | 'star' | 'shield' };
    const pickups: Pickup[] = [];

    // Crumbling Lava Tiles state (#6 lava_bridge_dash — 7x5 basalt stepping stones over lava)
    const LAVA_COLS = 7;
    const LAVA_ROWS = 5;
    type LavaTile = {
      col: number;
      row: number;
      state: 'solid' | 'cracking' | 'sunk';
      timer: number;
      pickup: 'none' | 'coin' | 'star';
    };
    const lavaTiles: LavaTile[] = [];

    // Crown Castle Brick-Breaker state (#25 crown_castle_sprint)
    type CastleBrick = { x: number; y: number; w: number; h: number; hp: number; kind: 'brick' | 'gold' | 'star' };
    const castleBricks: CastleBrick[] = [];
    type ShellBall = { x: number; y: number; vx: number; vy: number; r: number; color: string };
    const shellBalls: ShellBall[] = [];
    type CastleDrop = { x: number; y: number; vy: number; kind: 'coin' | 'multiball' };
    const castleDrops: CastleDrop[] = [];
    const crownBoss = { x: CANVAS_W / 2, y: 54, vx: 135, hitFlash: 0 };

    // Warp-Pipe Pac-Mario Maze state (#14 coin_magnet_maze — 15x9 brick corridor maze)
    const MAZE_COLS = 15;
    const MAZE_ROWS = 9;
    const MAZE_TEMPLATE = [
      '###############',
      '#S.....#.....S#',
      '#.##.#.#.#.##.#',
      '#....#...#....#',
      ' ..#.## ##.#.. ',
      '#....#...#....#',
      '#.##.#.#.#.##.#',
      '#S...........S#',
      '###############',
    ];
    const mazeWalls: boolean[][] = [];
    type MazeDot = { col: number; row: number; kind: 'coin' | 'star'; taken: boolean };
    const mazeDots: MazeDot[] = [];
    type MazeGhost = { x: number; y: number; vx: number; vy: number; color: string; respawn: number };
    const mazeGhosts: MazeGhost[] = [];
    let mazePowerTimer = 0;

    // Paint Tiles Party state (8 cols x 5 rows)
    const PAINT_COLS = 8;
    const PAINT_ROWS = 5;
    const paintGrid: number[] = new Array(PAINT_COLS * PAINT_ROWS).fill(0);
    const rivalBot = { x: CANVAS_W * 0.78, y: CANVAS_H * 0.5, vx: 130, vy: 110 };

    // Penguin Ice Slide state
    type GateObj = { x: number; y: number; w: number; kind: 'ring' | 'snowman'; hit: boolean };
    const gates: GateObj[] = [];

    // Shell Soccer state
    let aimAngle = -Math.PI / 2;
    let aimDir = 1;
    let keeperX = CANVAS_W / 2;
    let keeperDir = 1;
    let goalX = CANVAS_W / 2;
    let goalDir = 1;
    let kickCooldown = 0;

    // Fire Bar Jump state
    let fireAngle = 0;
    let fireSpeed = 2.35;
    let fireClearedCount = 0;
    let prevFireCross = false;

    // Sky Balloon state
    type SkyObj = { x: number; y: number; kind: 'ring' | 'balloon' | 'spiny'; taken: boolean };
    const skyObjs: SkyObj[] = [];

    // Spawn timers
    let spawnTimer = 0.2;
    let scrollDist = 0;

    const resetCastleBricks = () => {
      castleBricks.length = 0;
      const cols = 9;
      const rows = 4;
      const bw = 66;
      const bh = 22;
      const startX = (CANVAS_W - cols * (bw + 6)) / 2 + bw / 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const roll = rng();
          castleBricks.push({
            x: startX + c * (bw + 6),
            y: 96 + r * (bh + 7),
            w: bw,
            h: bh,
            hp: r === 0 ? 2 : 1,
            kind: roll < 0.16 ? 'star' : roll < 0.5 ? 'gold' : 'brick',
          });
        }
      }
    };

    // --- Initialize Game-Specific Layouts ---
    if (gameId === 'coin_block_bash') {
      player.x = CANVAS_W * 0.5;
      player.y = CANVAS_H - 76;
      for (let i = 0; i < 6; i++) {
        blocks.push({
          x: 90 + i * 108,
          y: 210 + (i % 2) * 18,
          kind: i === 2 ? 'star' : i === 4 ? 'spike' : 'coin',
          cooldown: 0,
          bump: 0,
        });
      }
    } else if (gameId === 'pipe_sprint') {
      player.x = 138;
      player.y = CANVAS_H - 78;
      for (let i = 0; i < 4; i++) {
        pipes.push({
          x: 440 + i * 240,
          h: 54 + Math.floor(rng() * 44),
          w: 48,
          passed: false,
          hasCoin: true,
          coinTaken: false,
          isFire: false,
        });
      }
    } else if (gameId === 'lava_bridge_dash') {
      player.x = CANVAS_W / 2;
      player.y = CANVAS_H / 2;
      for (let r = 0; r < LAVA_ROWS; r++) {
        for (let c = 0; c < LAVA_COLS; c++) {
          const isCenter = c === 3 && r === 2;
          const roll = rng();
          lavaTiles.push({
            col: c,
            row: r,
            state: 'solid',
            timer: 0,
            pickup: isCenter ? 'none' : roll < 0.15 ? 'star' : roll < 0.55 ? 'coin' : 'none',
          });
        }
      }
    } else if (gameId === 'crown_castle_sprint') {
      player.x = CANVAS_W / 2;
      player.y = CANVAS_H - 36;
      resetCastleBricks();
      shellBalls.push({
        x: CANVAS_W / 2,
        y: CANVAS_H - 64,
        vx: (rng() > 0.5 ? 1 : -1) * 230,
        vy: -310,
        r: 12,
        color: '#22c55e',
      });
    } else if (gameId === 'cloud_tower_climb') {
      player.x = CANVAS_W / 2;
      player.y = CANVAS_H - 90;
      player.vy = -560;
      clouds.push({ x: CANVAS_W / 2 - 70, y: CANVAS_H - 42, w: 140, hasCoin: false });
      for (let i = 1; i <= 14; i++) {
        clouds.push({
          x: 60 + rng() * (CANVAS_W - 220),
          y: CANVAS_H - 42 - i * 68,
          w: 112,
          hasCoin: i % 2 === 0,
        });
      }
    } else if (gameId === 'fireball_duel') {
      player.x = CANVAS_W / 2;
      player.y = CANVAS_H - 58;
      for (let i = 0; i < 6; i++) {
        targets.push({
          x: 90 + rng() * (CANVAS_W - 180),
          y: 72 + (i % 3) * 62,
          vx: (rng() > 0.5 ? 1 : -1) * (90 + rng() * 110),
          vy: 0,
          r: 25,
          kind: i === 0 ? 'star' : i === 5 ? 'bomb' : 'koopa',
          alive: true,
        });
      }
    } else if (gameId === 'boo_red_light') {
      player.x = 76;
      player.y = CANVAS_H - 96;
      booTimer = 2.0 + rng() * 1.4;
    } else if (gameId === 'bullet_bill_dodge') {
      player.x = CANVAS_W / 2;
      player.y = CANVAS_H / 2;
      for (let i = 0; i < 5; i++) {
        pickups.push({
          x: 85 + rng() * (CANVAS_W - 170),
          y: 85 + rng() * (CANVAS_H - 170),
          kind: i === 0 ? 'star' : i === 1 ? 'shield' : 'coin',
        });
      }
    } else if (gameId === 'coin_magnet_maze') {
      const cellW = CANVAS_W / MAZE_COLS;
      const cellH = CANVAS_H / MAZE_ROWS;
      for (let r = 0; r < MAZE_ROWS; r++) {
        const rowArr: boolean[] = [];
        for (let c = 0; c < MAZE_COLS; c++) {
          const ch = MAZE_TEMPLATE[r][c];
          const isWall = ch === '#';
          rowArr.push(isWall);
          if (ch === '.' || ch === 'S') {
            mazeDots.push({ col: c, row: r, kind: ch === 'S' ? 'star' : 'coin', taken: false });
          }
        }
        mazeWalls.push(rowArr);
      }
      player.x = 7.5 * cellW;
      player.y = 7.5 * cellH;
      mazeGhosts.push(
        { x: 5.5 * cellW, y: 3.5 * cellH, vx: 115, vy: 0, color: '#f8fafc', respawn: 0 },
        { x: 9.5 * cellW, y: 3.5 * cellH, vx: -115, vy: 0, color: '#fda4af', respawn: 0 }
      );
    } else if (gameId === 'paint_tiles_party') {
      player.x = 140;
      player.y = CANVAS_H / 2;
    } else if (gameId === 'penguin_ice_slide') {
      player.x = CANVAS_W / 2;
      player.y = 104;
    } else if (gameId === 'shell_soccer_kick') {
      player.x = CANVAS_W / 2;
      player.y = CANVAS_H - 58;
    } else if (gameId === 'fire_bar_jump') {
      player.x = CANVAS_W / 2;
      player.y = CANVAS_H - 86;
    } else if (gameId === 'sky_balloon_pop') {
      player.x = 155;
      player.y = CANVAS_H / 2;
    }

    const drawCoin = (cx: number, cy: number, r = 13) => {
      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.78, r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - 2.2, cy - r * 0.48, 4.4, r * 0.96);
      ctx.restore();
    };

    const drawStar = (cx: number, cy: number, r = 17) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const ang = (i * Math.PI) / 5 - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.48;
        if (i === 0) ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
        else ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4, -3, 2.5, 6);
      ctx.fillRect(1.5, -3, 2.5, 6);
      ctx.restore();
    };

    const drawBomb = (cx: number, cy: number, r = 16) => {
      ctx.save();
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + 8, cy - r - 9);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx + 9, cy - r - 10, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 6, cy - 3, 4, 6);
      ctx.fillRect(cx + 2, cy - 3, 4, 6);
      ctx.restore();
    };

    const drawMarioSkyBg = (topColor: string, botColor: string, groundColor: string) => {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, topColor);
      grad.addColorStop(1, botColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Soft Mario Hills & Clouds
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 210 - elapsed * 24) % (CANVAS_W + 140) + CANVAS_W + 140) % (CANVAS_W + 140) - 70;
        const cy = 58 + (i % 2) * 34;
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.arc(cx + 22, cy - 6, 26, 0, Math.PI * 2);
        ctx.arc(cx + 46, cy, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      if (groundColor) {
        ctx.fillStyle = groundColor;
        ctx.fillRect(0, CANVAS_H - 48, CANVAS_W, 48);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(0, CANVAS_H - 54, CANVAS_W, 10);
        // Brick joints
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2;
        for (let bx = 0; bx < CANVAS_W; bx += 40) {
          ctx.strokeRect(bx, CANVAS_H - 44, 40, 22);
          ctx.strokeRect(bx - 20, CANVAS_H - 22, 40, 22);
        }
      }
    };

    const step = (ts: number) => {
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      elapsed += dt;
      const timeLeft = Math.max(0, durationSec - elapsed);
      const timeProgress = Math.min(100, Math.round((elapsed / durationSec) * 100));

      const k = keysRef.current;
      const left = k.ArrowLeft || k.KeyA;
      const right = k.ArrowRight || k.KeyD;
      const up = k.ArrowUp || k.KeyW;
      const down = k.ArrowDown || k.KeyS;
      const space = k.Space || k.ArrowUp || k.KeyW;
      const ptr = pointerRef.current;
      const jumpTrigger = ptr.justPressed;
      ptr.justPressed = false;

      if (player.invuln > 0) player.invuln = Math.max(0, player.invuln - dt);

      // ======================== 15 UNIQUE GAME LOOPS ========================
      if (gameId === 'coin_block_bash') {
        drawMarioSkyBg('#2563eb', '#60a5fa', '#b45309');

        const moveSpeed = 310;
        let dx = (right ? 1 : 0) - (left ? 1 : 0);
        if (ptr.down && Math.abs(ptr.x - player.x) > 18) {
          dx = ptr.x > player.x ? 1 : -1;
        }
        player.vx = dx * moveSpeed;
        if (dx !== 0) {
          player.facing = dx > 0 ? 1 : -1;
          player.anim += dt;
        }
        if ((jumpTrigger || (ptr.down && ptr.y < CANVAS_H - 130)) && player.onGround) {
          player.vy = -590;
          player.onGround = false;
          partyAudio.playJump();
        }
        player.vy += 1550 * dt;
        player.x = Math.max(30, Math.min(CANVAS_W - 30, player.x + player.vx * dt));
        player.y += player.vy * dt;
        if (player.y >= CANVAS_H - 76) {
          player.y = CANVAS_H - 76;
          player.vy = 0;
          player.onGround = true;
        }

        // Update & draw ? Blocks
        for (const b of blocks) {
          if (b.cooldown > 0) b.cooldown -= dt;
          if (b.bump > 0) b.bump = Math.max(0, b.bump - dt * 55);

          // Headbutt check
          if (
            player.vy < 0 &&
            Math.abs(player.x - b.x) < 38 &&
            player.y - 26 <= b.y + 26 &&
            player.y - 26 >= b.y - 8
          ) {
            player.vy = 180;
            b.bump = 12;
            if (b.cooldown <= 0) {
              if (b.kind === 'spike') {
                score = Math.max(0, score - 15);
                addPop(b.x, b.y - 24, '-15', '#ef4444');
                partyAudio.playHit();
              } else if (b.kind === 'star') {
                score += 35;
                addPop(b.x, b.y - 24, '+35 ★', '#fde047');
                partyAudio.playStar();
              } else {
                score += 15;
                addPop(b.x, b.y - 24, '+15', '#facc15');
                partyAudio.playCoin();
              }
              b.cooldown = 0.85;
              const roll = rng();
              b.kind = roll < 0.2 ? 'star' : roll < 0.42 ? 'spike' : 'coin';
            }
          }

          const by = b.y - b.bump;
          ctx.fillStyle =
            b.cooldown > 0
              ? '#64748b'
              : b.kind === 'spike'
              ? '#dc2626'
              : b.kind === 'star'
              ? '#a855f7'
              : '#f59e0b';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(b.x - 24, by - 24, 48, 48, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            b.cooldown > 0 ? '·' : b.kind === 'spike' ? '✖' : b.kind === 'star' ? '★' : '?',
            b.x,
            by + 1
          );
        }

        drawHeroSprite(ctx, characterId, player.x, player.y, 46, player.facing, player.anim, !player.onGround);
      } else if (gameId === 'pipe_sprint') {
        drawMarioSkyBg('#0284c7', '#7dd3fc', '#b45309');

        const runSpeed = 275 + elapsed * 7.5;
        scrollDist += runSpeed * dt;
        player.anim += dt * 1.4;

        if (jumpTrigger && player.jumpsLeft > 0) {
          player.vy = player.jumpsLeft === 2 ? -565 : -490;
          player.onGround = false;
          player.jumpsLeft -= 1;
          partyAudio.playJump();
        }
        player.vy += 1580 * dt;
        player.y += player.vy * dt;
        if (player.y >= CANVAS_H - 76) {
          player.y = CANVAS_H - 76;
          player.vy = 0;
          player.onGround = true;
          player.jumpsLeft = 2;
        }

        for (const p of pipes) {
          p.x -= runSpeed * dt;
          if (p.x < -70) {
            p.x = CANVAS_W + 130 + rng() * 140;
            p.h = 48 + Math.floor(rng() * 54);
            p.passed = false;
            p.coinTaken = false;
          }

          ctx.fillStyle = '#16a34a';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 3;
          ctx.fillRect(p.x - p.w / 2, CANVAS_H - 54 - p.h, p.w, p.h);
          ctx.strokeRect(p.x - p.w / 2, CANVAS_H - 54 - p.h, p.w, p.h);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(p.x - p.w / 2 - 5, CANVAS_H - 54 - p.h, p.w + 10, 16);
          ctx.strokeRect(p.x - p.w / 2 - 5, CANVAS_H - 54 - p.h, p.w + 10, 16);

          if (
            player.invuln <= 0 &&
            Math.abs(player.x - p.x) < p.w / 2 + 14 &&
            player.y + 18 > CANVAS_H - 54 - p.h
          ) {
            score = Math.max(0, score - 20);
            player.invuln = 0.85;
            addPop(player.x, player.y - 30, '-20', '#ef4444');
            partyAudio.playHit();
          }

          if (!p.coinTaken) {
            const cy = CANVAS_H - 54 - p.h - 48;
            drawCoin(p.x, cy, 13);
            if (Math.hypot(player.x - p.x, player.y - cy) < 36) {
              p.coinTaken = true;
              score += 20;
              addPop(p.x, cy - 16, '+20', '#fde047');
              partyAudio.playCoin();
            }
          }

          if (!p.passed && p.x < player.x - 28) {
            p.passed = true;
            score += 10;
            addPop(player.x, player.y - 34, '+10', '#86efac');
          }
        }

        if (rivalCharacterId) {
          const ghostX = 60 + (CANVAS_W - 120) * (rivalProgressRef.current / 100);
          drawHeroSprite(ctx, rivalCharacterId, ghostX, 46, 26, 1, elapsed, false, 0.72);
        }

        drawHeroSprite(
          ctx,
          characterId,
          player.x,
          player.y,
          46,
          1,
          player.anim,
          !player.onGround,
          player.invuln > 0 ? 0.55 : 1
        );
      } else if (gameId === 'lava_bridge_dash') {
        // UNIQUE GAME #6: CRUMBLING LAVA TILES (7x5 volcanic stone grid over bubbling molten lava!)
        const lavaGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
        lavaGrad.addColorStop(0, '#7c2d12');
        lavaGrad.addColorStop(0.5, '#ea580c');
        lavaGrad.addColorStop(1, '#991b1b');
        ctx.fillStyle = lavaGrad;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Animated bubbling lava rings
        ctx.fillStyle = 'rgba(254, 240, 138, 0.28)';
        for (let i = 0; i < 12; i++) {
          const bx = ((i * 83 + elapsed * 18) % CANVAS_W);
          const by = ((i * 59 + Math.sin(elapsed * 2 + i) * 16) % CANVAS_H);
          const br = 8 + Math.sin(elapsed * 4 + i * 1.7) * 5;
          ctx.beginPath();
          ctx.arc(bx, by, Math.max(3, br), 0, Math.PI * 2);
          ctx.fill();
        }

        const padX = 54;
        const padY = 34;
        const tileW = (CANVAS_W - padX * 2) / LAVA_COLS;
        const tileH = (CANVAS_H - padY * 2) / LAVA_ROWS;

        let dx = (right ? 1 : 0) - (left ? 1 : 0);
        let dy = (down ? 1 : 0) - (up ? 1 : 0);
        if (ptr.down) {
          const vx = ptr.x - player.x;
          const vy = ptr.y - player.y;
          const d = Math.hypot(vx, vy);
          if (d > 10) {
            dx = vx / d;
            dy = vy / d;
          }
        }
        const mLen = Math.hypot(dx, dy);
        if (mLen > 0.05) {
          player.x = Math.max(padX + 18, Math.min(CANVAS_W - padX - 18, player.x + (dx / mLen) * 280 * dt));
          player.y = Math.max(padY + 18, Math.min(CANVAS_H - padY - 18, player.y + (dy / mLen) * 280 * dt));
          player.facing = dx >= 0 ? 1 : -1;
          player.anim += dt * 1.5;
        }

        const pCol = Math.max(0, Math.min(LAVA_COLS - 1, Math.floor((player.x - padX) / tileW)));
        const pRow = Math.max(0, Math.min(LAVA_ROWS - 1, Math.floor((player.y - padY) / tileH)));
        const standingTile = lavaTiles[pRow * LAVA_COLS + pCol];

        if (standingTile) {
          if (standingTile.state === 'solid') {
            standingTile.state = 'cracking';
            standingTile.timer = 1.25;
          } else if (standingTile.state === 'sunk' && player.invuln <= 0) {
            score = Math.max(0, score - 15);
            player.invuln = 0.9;
            addPop(player.x, player.y - 26, lang === 'ar' ? 'حمم! -15' : 'LAVA! -15', '#fef08a');
            partyAudio.playHit();
            // Rescue to a solid tile
            const safe = lavaTiles.find((t) => t.state === 'solid');
            if (safe) {
              player.x = padX + (safe.col + 0.5) * tileW;
              player.y = padY + (safe.row + 0.5) * tileH;
            }
          }
          if (standingTile.pickup !== 'none' && standingTile.state !== 'sunk') {
            const isStar = standingTile.pickup === 'star';
            const pts = isStar ? 40 : 18;
            score += pts;
            addPop(player.x, player.y - 22, isStar ? '+40 ★' : '+18', isStar ? '#fde047' : '#fdba74');
            if (isStar) partyAudio.playStar();
            else partyAudio.playCoin();
            standingTile.pickup = 'none';
          }
        }

        // Update & draw tiles
        for (const t of lavaTiles) {
          if (t.state === 'cracking') {
            t.timer -= dt;
            if (t.timer <= 0) {
              t.state = 'sunk';
              t.timer = 3.2;
            }
          } else if (t.state === 'sunk') {
            t.timer -= dt;
            if (t.timer <= 0) {
              t.state = 'solid';
              const r = rng();
              t.pickup = r < 0.18 ? 'star' : r < 0.6 ? 'coin' : 'none';
            }
          }

          const tx = padX + t.col * tileW + 4;
          const ty = padY + t.row * tileH + 4;
          const tw = tileW - 8;
          const th = tileH - 8;
          if (t.state !== 'sunk') {
            const shake = t.state === 'cracking' ? Math.sin(elapsed * 42) * 2.5 : 0;
            ctx.fillStyle = t.state === 'cracking' ? '#f97316' : '#334155';
            ctx.strokeStyle = t.state === 'cracking' ? '#fef08a' : '#64748b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(tx + shake, ty, tw, th, 10);
            ctx.fill();
            ctx.stroke();

            if (t.state === 'cracking') {
              ctx.strokeStyle = '#7c2d12';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(tx + 12, ty + 10);
              ctx.lineTo(tx + tw * 0.5, ty + th * 0.55);
              ctx.lineTo(tx + tw - 12, ty + th - 10);
              ctx.stroke();
            }

            if (t.pickup === 'star') drawStar(tx + tw / 2, ty + th / 2, 16);
            else if (t.pickup === 'coin') drawCoin(tx + tw / 2, ty + th / 2, 12);
          } else {
            ctx.strokeStyle = 'rgba(254, 215, 170, 0.35)';
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(tx + 4, ty + 4, tw - 8, th - 8);
            ctx.setLineDash([]);
          }
        }

        drawHeroSprite(
          ctx,
          characterId,
          player.x,
          player.y,
          44,
          player.facing,
          player.anim,
          false,
          player.invuln > 0 ? 0.5 : 1
        );
      } else if (gameId === 'crown_castle_sprint') {
        // UNIQUE GAME #25: CROWN CASTLE BRICK-BREAKER (Royal Shield Paddle + Bouncing Koopa Shells + Crown Boss!)
        const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
        bgGrad.addColorStop(0, '#1e1b4b');
        bgGrad.addColorStop(1, '#312e81');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Starry castle background dots
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        for (let i = 0; i < 20; i++) {
          ctx.fillRect((i * 97) % CANVAS_W, (i * 53) % (CANVAS_H - 80), 3, 3);
        }

        // Move Royal Shield Paddle
        const paddleW = 128;
        const paddleY = CANVAS_H - 34;
        let dx = (right ? 1 : 0) - (left ? 1 : 0);
        if (ptr.down || Math.abs(ptr.x - player.x) > 4) {
          if (ptr.down) {
            player.x += (ptr.x - player.x) * Math.min(1, dt * 16);
          }
        }
        if (dx !== 0) {
          player.x += dx * 460 * dt;
          player.facing = dx > 0 ? 1 : -1;
        }
        player.x = Math.max(paddleW / 2 + 12, Math.min(CANVAS_W - paddleW / 2 - 12, player.x));

        // Orbiting Bowser Crown Boss at top
        crownBoss.x += crownBoss.vx * dt;
        if (crownBoss.x < 75 || crownBoss.x > CANVAS_W - 75) crownBoss.vx *= -1;
        if (crownBoss.hitFlash > 0) crownBoss.hitFlash -= dt;

        ctx.save();
        ctx.fillStyle = crownBoss.hitFlash > 0 ? '#ffffff' : '#facc15';
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(crownBoss.x - 32, crownBoss.y + 14);
        ctx.lineTo(crownBoss.x - 36, crownBoss.y - 12);
        ctx.lineTo(crownBoss.x - 14, crownBoss.y);
        ctx.lineTo(crownBoss.x, crownBoss.y - 18);
        ctx.lineTo(crownBoss.x + 14, crownBoss.y);
        ctx.lineTo(crownBoss.x + 36, crownBoss.y - 12);
        ctx.lineTo(crownBoss.x + 32, crownBoss.y + 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Draw Castle Bricks
        let aliveBricks = 0;
        for (const b of castleBricks) {
          if (b.hp <= 0) continue;
          aliveBricks++;
          ctx.fillStyle =
            b.kind === 'star'
              ? '#a855f7'
              : b.kind === 'gold'
              ? '#f59e0b'
              : b.hp > 1
              ? '#ef4444'
              : '#d97706';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#fffbeb';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.kind === 'star' ? '★' : b.kind === 'gold' ? '?' : '▪', b.x, b.y + 1);
        }
        if (aliveBricks === 0) {
          score += 65;
          addPop(CANVAS_W / 2, 160, lang === 'ar' ? 'جدار جديد! +65' : 'NEW WAVE! +65', '#fde047');
          partyAudio.playStar();
          resetCastleBricks();
        }

        // Update Bouncing Koopa Shells
        for (let bi = shellBalls.length - 1; bi >= 0; bi--) {
          const ball = shellBalls[bi];
          ball.x += ball.vx * dt;
          ball.y += ball.vy * dt;

          if (ball.x < ball.r + 6) {
            ball.x = ball.r + 6;
            ball.vx = Math.abs(ball.vx);
          } else if (ball.x > CANVAS_W - ball.r - 6) {
            ball.x = CANVAS_W - ball.r - 6;
            ball.vx = -Math.abs(ball.vx);
          }
          if (ball.y < ball.r + 6) {
            ball.y = ball.r + 6;
            ball.vy = Math.abs(ball.vy);
          }

          // Paddle bounce
          if (
            ball.vy > 0 &&
            ball.y + ball.r >= paddleY - 12 &&
            ball.y - ball.r <= paddleY + 12 &&
            Math.abs(ball.x - player.x) <= paddleW / 2 + ball.r
          ) {
            const offset = (ball.x - player.x) / (paddleW / 2);
            ball.vx = offset * 330;
            ball.vy = -Math.max(290, Math.abs(ball.vy) * 1.02);
            ball.y = paddleY - 13 - ball.r;
            partyAudio.playJump();
          }

          // Crown Boss hit!
          if (Math.hypot(ball.x - crownBoss.x, ball.y - crownBoss.y) < 38) {
            ball.vy = Math.abs(ball.vy);
            crownBoss.hitFlash = 0.25;
            score += 45;
            addPop(crownBoss.x, crownBoss.y + 24, '★ +45!', '#fde047');
            partyAudio.playStar();
          }

          // Brick hits
          for (const b of castleBricks) {
            if (b.hp <= 0) continue;
            if (
              Math.abs(ball.x - b.x) < b.w / 2 + ball.r &&
              Math.abs(ball.y - b.y) < b.h / 2 + ball.r
            ) {
              b.hp -= 1;
              ball.vy = -ball.vy;
              if (b.hp <= 0) {
                const pts = b.kind === 'star' ? 30 : b.kind === 'gold' ? 18 : 12;
                score += pts;
                addPop(b.x, b.y, `+${pts}`, b.kind === 'star' ? '#fde047' : '#86efac');
                if (b.kind === 'star') partyAudio.playStar();
                else partyAudio.playCoin();
                if (b.kind === 'star' || rng() < 0.26) {
                  castleDrops.push({
                    x: b.x,
                    y: b.y,
                    vy: 175,
                    kind: b.kind === 'star' && shellBalls.length < 3 ? 'multiball' : 'coin',
                  });
                }
              } else {
                partyAudio.playSelect();
              }
              break;
            }
          }

          // Draw spinning Koopa shell
          ctx.fillStyle = ball.color;
          ctx.strokeStyle = '#fef9c3';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          if (ball.y > CANVAS_H + 20) {
            shellBalls.splice(bi, 1);
          }
        }

        if (shellBalls.length === 0) {
          score = Math.max(0, score - 12);
          addPop(player.x, paddleY - 24, '-12', '#ef4444');
          partyAudio.playHit();
          shellBalls.push({
            x: player.x,
            y: paddleY - 30,
            vx: (rng() > 0.5 ? 1 : -1) * 210,
            vy: -310,
            r: 12,
            color: '#22c55e',
          });
        }

        // Falling drops
        for (let di = castleDrops.length - 1; di >= 0; di--) {
          const dr = castleDrops[di];
          dr.y += dr.vy * dt;
          if (dr.kind === 'multiball') {
            drawStar(dr.x, dr.y, 14);
          } else {
            drawCoin(dr.x, dr.y, 11);
          }
          if (Math.abs(dr.x - player.x) < paddleW / 2 + 14 && Math.abs(dr.y - paddleY) < 22) {
            if (dr.kind === 'multiball') {
              shellBalls.push({
                x: player.x,
                y: paddleY - 26,
                vx: (rng() > 0.5 ? 1 : -1) * 240,
                vy: -320,
                r: 12,
                color: '#ef4444',
              });
              score += 20;
              addPop(player.x, paddleY - 28, lang === 'ar' ? 'صدفة إضافية! +20' : 'MULTI-SHELL! +20', '#38bdf8');
              partyAudio.playStar();
            } else {
              score += 15;
              addPop(dr.x, paddleY - 24, '+15', '#fde047');
              partyAudio.playCoin();
            }
            castleDrops.splice(di, 1);
            continue;
          }
          if (dr.y > CANVAS_H + 20) castleDrops.splice(di, 1);
        }

        // Draw Royal Shield Paddle + Hero Icon
        ctx.fillStyle = heroColor;
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(player.x - paddleW / 2, paddleY - 9, paddleW, 18, 9);
        ctx.fill();
        ctx.stroke();
        drawHeroSprite(ctx, characterId, player.x, paddleY - 12, 32, player.facing, elapsed, false);
      } else if (gameId === 'star_rain_catch') {
        drawMarioSkyBg('#0f172a', '#312e81', '#1e293b');

        const moveSpeed = 370;
        let dx = (right ? 1 : 0) - (left ? 1 : 0);
        if (ptr.down) {
          const diff = ptr.x - player.x;
          if (Math.abs(diff) > 10) dx = Math.max(-1, Math.min(1, diff / 45));
        }
        player.x = Math.max(30, Math.min(CANVAS_W - 30, player.x + dx * moveSpeed * dt));
        if (Math.abs(dx) > 0.1) {
          player.facing = dx > 0 ? 1 : -1;
          player.anim += dt * 1.4;
        }

        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawnTimer = 0.28 + rng() * 0.16;
          const r = rng();
          falling.push({
            x: 36 + rng() * (CANVAS_W - 72),
            y: -24,
            vy: 190 + rng() * 140,
            kind: r < 0.24 ? 'star' : r < 0.65 ? 'coin' : r < 0.88 ? 'bomb' : 'thwomp',
            r: r >= 0.88 ? 22 : 16,
          });
        }

        for (let i = falling.length - 1; i >= 0; i--) {
          const f = falling[i];
          f.y += f.vy * dt;
          if (f.kind === 'star') drawStar(f.x, f.y, 17);
          else if (f.kind === 'coin') drawCoin(f.x, f.y, 13);
          else if (f.kind === 'bomb') drawBomb(f.x, f.y, 16);
          else {
            ctx.fillStyle = '#475569';
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2.5;
            ctx.fillRect(f.x - 20, f.y - 22, 40, 44);
            ctx.strokeRect(f.x - 20, f.y - 22, 40, 44);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(f.x - 10, f.y - 6, 7, 7);
            ctx.fillRect(f.x + 3, f.y - 6, 7, 7);
          }

          if (Math.hypot(player.x - f.x, player.y - f.y) < 36) {
            if (f.kind === 'star') {
              score += 30;
              addPop(f.x, f.y, '+30 ★', '#fde047');
              partyAudio.playStar();
            } else if (f.kind === 'coin') {
              score += 12;
              addPop(f.x, f.y, '+12', '#facc15');
              partyAudio.playCoin();
            } else {
              score = Math.max(0, score - 25);
              addPop(f.x, f.y, '-25', '#ef4444');
              partyAudio.playHit();
            }
            falling.splice(i, 1);
            continue;
          }
          if (f.y > CANVAS_H + 30) falling.splice(i, 1);
        }

        drawHeroSprite(ctx, characterId, player.x, player.y, 48, player.facing, player.anim, false);
      } else if (gameId === 'cloud_tower_climb') {
        drawMarioSkyBg('#0369a1', '#7dd3fc', '');

        let dx = (right ? 1 : 0) - (left ? 1 : 0);
        if (ptr.down) {
          const diff = ptr.x - player.x;
          if (Math.abs(diff) > 10) dx = Math.max(-1, Math.min(1, diff / 55));
        }
        player.x += dx * 360 * dt;
        if (player.x < 16) player.x = CANVAS_W - 16;
        if (player.x > CANVAS_W - 16) player.x = 16;
        if (Math.abs(dx) > 0.1) player.facing = dx > 0 ? 1 : -1;

        player.vy += 1220 * dt;
        player.y += player.vy * dt;

        // Bounce off clouds while falling
        if (player.vy > 0) {
          for (const cl of clouds) {
            if (
              player.x >= cl.x - 14 &&
              player.x <= cl.x + cl.w + 14 &&
              player.y + 20 >= cl.y &&
              player.y + 20 <= cl.y + 22
            ) {
              player.vy = -575;
              partyAudio.playJump();
              if (cl.hasCoin) {
                cl.hasCoin = false;
                score += 20;
                addPop(cl.x + cl.w / 2, cl.y - cameraY - 18, '+20', '#fde047');
                partyAudio.playCoin();
              }
            }
          }
        }

        // Scroll camera upward
        if (player.y - cameraY < 165) {
          cameraY = player.y - 165;
          const heightPts = Math.floor(-cameraY / 18);
          if (heightPts > maxHeight) {
            score += (heightPts - maxHeight) * 2;
            maxHeight = heightPts;
          }
        }

        // Safety cloud floor rescue if hero falls below view
        if (player.y - cameraY > CANVAS_H + 20) {
          player.y = cameraY + CANVAS_H - 40;
          player.vy = -610;
          score = Math.max(0, score - 15);
          addPop(player.x, CANVAS_H - 50, '-15', '#ef4444');
          partyAudio.playHit();
        }

        // Recycle clouds below screen to top
        let minCloudY = Math.min(...clouds.map((c) => c.y));
        for (const cl of clouds) {
          if (cl.y - cameraY > CANVAS_H + 35) {
            minCloudY -= 68;
            cl.y = minCloudY;
            cl.x = 45 + rng() * (CANVAS_W - 190);
            cl.hasCoin = rng() > 0.42;
          }

          const sy = cl.y - cameraY;
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(cl.x, sy, cl.w, 22, 11);
          ctx.fill();
          ctx.stroke();
          if (cl.hasCoin) drawCoin(cl.x + cl.w / 2, sy - 18, 12);
        }

        drawHeroSprite(ctx, characterId, player.x, player.y - cameraY, 44, player.facing, elapsed, player.vy < 0);
      } else if (gameId === 'fireball_duel') {
        drawMarioSkyBg('#431407', '#9a3412', '#1e293b');

        // Aim turret with pointer or keys
        const aimX = ptr.x;
        const aimY = Math.min(CANVAS_H - 110, ptr.y);
        const angle = Math.atan2(aimY - player.y, aimX - player.x);

        if (jumpTrigger || (ptr.down && kickCooldown <= 0)) {
          shots.push({
            x: player.x,
            y: player.y - 16,
            vx: Math.cos(angle) * 560,
            vy: Math.sin(angle) * 560,
            life: 1.4,
          });
          kickCooldown = 0.22;
          partyAudio.playJump();
        }
        if (kickCooldown > 0) kickCooldown -= dt;

        // Aim guide line
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
        ctx.setLineDash([7, 7]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - 14);
        ctx.lineTo(player.x + Math.cos(angle) * 180, player.y - 14 + Math.sin(angle) * 180);
        ctx.stroke();
        ctx.setLineDash([]);

        // Update targets
        for (const t of targets) {
          t.x += t.vx * dt;
          if (t.x < 40 || t.x > CANVAS_W - 40) t.vx *= -1;
          if (!t.alive) {
            t.x = 60 + rng() * (CANVAS_W - 120);
            t.y = 62 + rng() * 180;
            t.kind = rng() < 0.28 ? 'star' : rng() < 0.82 ? 'koopa' : 'bomb';
            t.alive = true;
          }
          if (t.kind === 'star') drawStar(t.x, t.y, 22);
          else if (t.kind === 'bomb') drawBomb(t.x, t.y, 20);
          else {
            // Koopa Shell Target
            ctx.fillStyle = '#22c55e';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(t.x, t.y, 10, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Update fireballs
        for (let i = shots.length - 1; i >= 0; i--) {
          const s = shots[i];
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.life -= dt;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(s.x, s.y, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
          ctx.fill();

          let hit = false;
          for (const t of targets) {
            if (Math.hypot(s.x - t.x, s.y - t.y) < t.r + 12) {
              t.alive = false;
              hit = true;
              if (t.kind === 'star') {
                score += 35;
                addPop(t.x, t.y, '+35 ★', '#fde047');
                partyAudio.playStar();
              } else if (t.kind === 'koopa') {
                score += 18;
                addPop(t.x, t.y, '+18', '#86efac');
                partyAudio.playCoin();
              } else {
                score = Math.max(0, score - 20);
                addPop(t.x, t.y, '-20', '#ef4444');
                partyAudio.playHit();
              }
              break;
            }
          }
          if (hit || s.life <= 0) shots.splice(i, 1);
        }

        drawHeroSprite(ctx, characterId, player.x, player.y, 48, 1, elapsed, false);
      } else if (gameId === 'boo_red_light') {
        drawMarioSkyBg('#1e1b4b', '#312e81', '#475569');

        booTimer -= dt;
        if (!booLooking && !booWarn && booTimer <= 0.65) {
          booWarn = true;
          partyAudio.playSelect();
        }
        if (booTimer <= 0) {
          booLooking = !booLooking;
          booWarn = false;
          booTimer = booLooking ? 1.15 + rng() * 1.1 : 1.7 + rng() * 1.6;
        }

        const running = (space || right || ptr.down) && booFrozenPenalty <= 0;
        if (booFrozenPenalty > 0) booFrozenPenalty -= dt;

        if (running) {
          if (booLooking) {
            booDistance = Math.max(0, booDistance - 65);
            score = Math.max(0, score - 20);
            booFrozenPenalty = 0.75;
            addPop(player.x, player.y - 36, lang === 'ar' ? 'كشفك بو! -20' : 'CAUGHT! -20', '#ef4444');
            partyAudio.playHit();
          } else {
            booDistance += 125 * dt;
            score += Math.round(62 * dt);
            player.anim += dt * 1.6;
            if (booDistance >= 520) {
              booDistance = 0;
              score += 90;
              addPop(CANVAS_W - 110, player.y - 40, '+90 ★', '#fde047');
              partyAudio.playStar();
            }
          }
        }

        player.x = 74 + (booDistance / 520) * (CANVAS_W - 190);

        // Star Goal Flag on right
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(CANVAS_W - 92, 130, 8, CANVAS_H - 184);
        drawStar(CANVAS_W - 88, 124, 20);

        // Giant Ghost Boo at top-right
        const bx = CANVAS_W - 120;
        const by = 110;
        ctx.save();
        ctx.fillStyle = booLooking ? '#fecdd3' : booWarn ? '#fef08a' : '#f8fafc';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(bx, by, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Boo Eyes / Glare
        if (booLooking) {
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(bx - 14, by - 6, 7, 0, Math.PI * 2);
          ctx.arc(bx + 6, by - 6, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(239,68,68,0.22)';
          ctx.beginPath();
          ctx.moveTo(bx - 30, by);
          ctx.lineTo(40, CANVAS_H - 40);
          ctx.lineTo(40, 120);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(bx - 18, by - 4);
          ctx.lineTo(bx - 4, by - 4);
          ctx.moveTo(bx + 4, by - 4);
          ctx.lineTo(bx + 18, by - 4);
          ctx.stroke();
        }
        ctx.restore();

        // Clear Banner Cue
        const statusMsg = booLooking
          ? lang === 'ar'
            ? 'تجمّد! بو ينظر إليك!'
            : 'FREEZE! BOO IS LOOKING!'
          : booWarn
          ? lang === 'ar'
            ? 'استعد للتوقف...'
            : 'GET READY TO STOP...'
          : lang === 'ar'
          ? 'اركض الآن! بو نائم'
          : 'RUN NOW! BOO IS SLEEPING';
        if (ts - lastHudAt > 120) setHudHint(statusMsg);

        drawHeroSprite(
          ctx,
          characterId,
          player.x,
          player.y,
          50,
          1,
          player.anim,
          false,
          booFrozenPenalty > 0 ? 0.5 : 1
        );
      } else if (gameId === 'bullet_bill_dodge') {
        // UPGRADED GAME #13: BOWSER AIRSHIP CANNON STORM (Wooden Deck + Laser Warning Sights + Shield Bubbles!)
        ctx.fillStyle = '#451a03';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        // Wooden deck planks + brass rivets
        ctx.strokeStyle = 'rgba(254, 215, 170, 0.14)';
        ctx.lineWidth = 2;
        for (let gy = 0; gy < CANVAS_H; gy += 36) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(CANVAS_W, gy);
          ctx.stroke();
        }
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, CANVAS_W - 10, CANVAS_H - 10);

        let dx = (right ? 1 : 0) - (left ? 1 : 0);
        let dy = (down ? 1 : 0) - (up ? 1 : 0);
        if (ptr.down) {
          const vx = ptr.x - player.x;
          const vy = ptr.y - player.y;
          const dist = Math.hypot(vx, vy);
          if (dist > 10) {
            dx = vx / dist;
            dy = vy / dist;
          }
        }
        const len = Math.hypot(dx, dy);
        if (len > 0.05) {
          const spd = 300;
          player.x = Math.max(30, Math.min(CANVAS_W - 30, player.x + (dx / len) * spd * dt));
          player.y = Math.max(30, Math.min(CANVAS_H - 30, player.y + (dy / len) * spd * dt));
          player.facing = dx >= 0 ? 1 : -1;
          player.anim += dt * 1.4;
        }

        score += Math.round(12 * dt);
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawnTimer = Math.max(0.36, 0.78 - elapsed * 0.015);
          const side = Math.floor(rng() * 4);
          const spd = 250 + rng() * 140;
          if (side === 0) laserWarns.push({ x: 16, y: 42 + rng() * (CANVAS_H - 84), vx: spd, vy: 0, timer: 0.52 });
          else if (side === 1) laserWarns.push({ x: CANVAS_W - 16, y: 42 + rng() * (CANVAS_H - 84), vx: -spd, vy: 0, timer: 0.52 });
          else if (side === 2) laserWarns.push({ x: 42 + rng() * (CANVAS_W - 84), y: 16, vx: 0, vy: spd, timer: 0.52 });
          else laserWarns.push({ x: 42 + rng() * (CANVAS_W - 84), y: CANVAS_H - 16, vx: 0, vy: -spd, timer: 0.52 });
        }

        // Draw telegraphing laser warnings + iron cannons
        for (let wi = laserWarns.length - 1; wi >= 0; wi--) {
          const w = laserWarns[wi];
          w.timer -= dt;
          ctx.save();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
          ctx.setLineDash([8, 6]);
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(w.x, w.y);
          ctx.lineTo(w.x + Math.sign(w.vx) * CANVAS_W, w.y + Math.sign(w.vy) * CANVAS_H);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(w.x, w.y, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          if (w.timer <= 0) {
            bullets.push({ x: w.x, y: w.y, vx: w.vx, vy: w.vy, r: 17 });
            laserWarns.splice(wi, 1);
          }
        }

        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          // Smoke trail
          ctx.fillStyle = 'rgba(226, 232, 240, 0.35)';
          ctx.beginPath();
          ctx.arc(b.x - Math.sign(b.vx) * 20, b.y - Math.sign(b.vy) * 20, 9, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(b.x + Math.sign(b.vx) * 6, b.y - 3, 4.5, 0, Math.PI * 2);
          ctx.fill();

          if (player.invuln <= 0 && Math.hypot(player.x - b.x, player.y - b.y) < b.r + 17) {
            if (playerShield) {
              playerShield = false;
              player.invuln = 0.7;
              addPop(player.x, player.y - 26, lang === 'ar' ? 'صدّ الدرع!' : 'SHIELD BLOCK!', '#38bdf8');
              partyAudio.playSelect();
            } else {
              score = Math.max(0, score - 22);
              player.invuln = 0.85;
              addPop(player.x, player.y - 24, '-22', '#ef4444');
              partyAudio.playHit();
            }
            bullets.splice(i, 1);
            continue;
          }
          if (b.x < -60 || b.x > CANVAS_W + 60 || b.y < -60 || b.y > CANVAS_H + 60) {
            bullets.splice(i, 1);
          }
        }

        // Draw & collect coins, stars, and Shield Bubbles
        for (const p of pickups) {
          if (p.kind === 'star') drawStar(p.x, p.y, 17);
          else if (p.kind === 'shield') {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else drawCoin(p.x, p.y, 13);

          if (Math.hypot(player.x - p.x, player.y - p.y) < 34) {
            if (p.kind === 'shield') {
              playerShield = true;
              score += 15;
              addPop(p.x, p.y - 12, lang === 'ar' ? 'درع حماية!' : 'SHIELD!', '#38bdf8');
              partyAudio.playStar();
            } else {
              const pts = p.kind === 'star' ? 35 : 15;
              score += pts;
              addPop(p.x, p.y - 12, `+${pts}`, '#fde047');
              if (p.kind === 'star') partyAudio.playStar();
              else partyAudio.playCoin();
            }
            p.x = 60 + rng() * (CANVAS_W - 120);
            p.y = 60 + rng() * (CANVAS_H - 120);
            const r = rng();
            p.kind = r < 0.22 ? 'star' : r < 0.38 ? 'shield' : 'coin';
          }
        }

        if (playerShield) {
          ctx.strokeStyle = '#38bdf8';
          ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(player.x, player.y, 28, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        drawHeroSprite(
          ctx,
          characterId,
          player.x,
          player.y,
          44,
          player.facing,
          player.anim,
          false,
          player.invuln > 0 ? 0.5 : 1
        );
      } else if (gameId === 'coin_magnet_maze') {
        // UNIQUE GAME #14: WARP-PIPE PAC-MARIO MAZE (Brick Wall Corridors + Warp Tunnels + Edible Ghosts!)
        const cellW = CANVAS_W / MAZE_COLS;
        const cellH = CANVAS_H / MAZE_ROWS;
        ctx.fillStyle = '#042f2e';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        if (mazePowerTimer > 0) mazePowerTimer = Math.max(0, mazePowerTimer - dt);

        const isWallAt = (px: number, py: number, radius = 14) => {
          const pts = [
            [px - radius, py - radius],
            [px + radius, py - radius],
            [px - radius, py + radius],
            [px + radius, py + radius],
          ];
          for (const [tx, ty] of pts) {
            const c = Math.floor(tx / cellW);
            const r = Math.floor(ty / cellH);
            if (r < 0 || r >= MAZE_ROWS) return true;
            if (c < 0 || c >= MAZE_COLS) continue; // Warp tunnel exit!
            if (mazeWalls[r]?.[c]) return true;
          }
          return false;
        };

        let dx = (right ? 1 : 0) - (left ? 1 : 0);
        let dy = (down ? 1 : 0) - (up ? 1 : 0);
        if (ptr.down) {
          const vx = ptr.x - player.x;
          const vy = ptr.y - player.y;
          const d = Math.hypot(vx, vy);
          if (d > 10) {
            dx = vx / d;
            dy = vy / d;
          }
        }
        const mLen = Math.hypot(dx, dy);
        if (mLen > 0.05) {
          const spd = mazePowerTimer > 0 ? 275 : 235;
          const nx = player.x + (dx / mLen) * spd * dt;
          const ny = player.y + (dy / mLen) * spd * dt;
          if (!isWallAt(nx, player.y, 13)) player.x = nx;
          if (!isWallAt(player.x, ny, 13)) player.y = ny;
          // Left/Right Warp Pipe Tunnel wraparound!
          if (player.x < -8) player.x = CANVAS_W + 6;
          if (player.x > CANVAS_W + 8) player.x = -6;
          player.facing = dx >= 0 ? 1 : -1;
          player.anim += dt * 1.6;
        }

        // Draw Brick Walls & Side Warp Pipes
        for (let r = 0; r < MAZE_ROWS; r++) {
          for (let c = 0; c < MAZE_COLS; c++) {
            if (!mazeWalls[r]?.[c]) continue;
            ctx.fillStyle = '#0f766e';
            ctx.strokeStyle = '#134e4a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4, 6);
            ctx.fill();
            ctx.stroke();
          }
        }
        // Warp Tunnel Indicators on Row 4 edges
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(0, 4 * cellH + 4, 10, cellH - 8);
        ctx.fillRect(CANVAS_W - 10, 4 * cellH + 4, 10, cellH - 8);

        // Draw & collect Maze Coins + Power Stars
        let remainingDots = 0;
        for (const d of mazeDots) {
          if (d.taken) continue;
          remainingDots++;
          const cx = (d.col + 0.5) * cellW;
          const cy = (d.row + 0.5) * cellH;
          if (d.kind === 'star') drawStar(cx, cy, 14);
          else drawCoin(cx, cy, 8.5);
          if (Math.hypot(player.x - cx, player.y - cy) < 22) {
            d.taken = true;
            if (d.kind === 'star') {
              mazePowerTimer = 4.2;
              score += 30;
              addPop(cx, cy - 12, lang === 'ar' ? '★ اطارد الأشباح! +30' : '★ CHOMP GHOSTS! +30', '#fde047');
              partyAudio.playStar();
            } else {
              score += 10;
              partyAudio.playCoin();
            }
          }
        }
        if (remainingDots === 0) {
          score += 60;
          addPop(CANVAS_W / 2, CANVAS_H / 2, lang === 'ar' ? '★ متاهة كاملة! +60' : '★ MAZE CLEAR! +60', '#fde047');
          partyAudio.playStar();
          for (const d of mazeDots) d.taken = false;
        }

        // Update & draw Patrolling Maze Ghosts
        for (const g of mazeGhosts) {
          if (g.respawn > 0) {
            g.respawn -= dt;
            continue;
          }
          const gSpd = mazePowerTimer > 0 ? 85 : 120;
          const nx = g.x + Math.sign(g.vx) * gSpd * dt;
          const ny = g.y + Math.sign(g.vy) * gSpd * dt;
          if (isWallAt(nx, ny, 13) || rng() < 0.025) {
            const dirs = [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ].filter(([ddx, ddy]) => !isWallAt(g.x + ddx * 16, g.y + ddy * 16, 13));
            if (dirs.length > 0) {
              const pick = dirs[Math.floor(rng() * dirs.length)];
              g.vx = pick[0] * gSpd;
              g.vy = pick[1] * gSpd;
            }
          } else {
            g.x = nx;
            g.y = ny;
          }
          if (g.x < 10) g.x = CANVAS_W - 14;
          if (g.x > CANVAS_W - 10) g.x = 14;

          ctx.fillStyle = mazePowerTimer > 0 ? '#3b82f6' : g.color;
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(g.x, g.y, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = mazePowerTimer > 0 ? '#fef08a' : '#0f172a';
          ctx.fillRect(g.x - 6, g.y - 4, 4, 5);
          ctx.fillRect(g.x + 2, g.y - 4, 4, 5);

          if (Math.hypot(player.x - g.x, player.y - g.y) < 28) {
            if (mazePowerTimer > 0) {
              score += 45;
              g.respawn = 3.0;
              g.x = 7.5 * cellW;
              g.y = 3.5 * cellH;
              addPop(player.x, player.y - 24, lang === 'ar' ? 'أكلت الشبح! +45' : 'GHOST CHOMP! +45', '#38bdf8');
              partyAudio.playStar();
            } else if (player.invuln <= 0) {
              score = Math.max(0, score - 18);
              player.invuln = 1.0;
              addPop(player.x, player.y - 24, '-18', '#ef4444');
              partyAudio.playHit();
            }
          }
        }

        if (mazePowerTimer > 0) {
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(player.x, player.y, 24, 0, Math.PI * 2);
          ctx.stroke();
        }
        drawHeroSprite(
          ctx,
          characterId,
          player.x,
          player.y,
          36,
          player.facing,
          player.anim,
          false,
          player.invuln > 0 ? 0.5 : 1
        );
      } else if (gameId === 'paint_tiles_party') {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        const padX = 56;
        const padY = 44;
        const cellW = (CANVAS_W - padX * 2) / PAINT_COLS;
        const cellH = (CANVAS_H - padY * 2) / PAINT_ROWS;

        let dx = (right ? 1 : 0) - (left ? 1 : 0);
        let dy = (down ? 1 : 0) - (up ? 1 : 0);
        if (ptr.down) {
          const vx = ptr.x - player.x;
          const vy = ptr.y - player.y;
          const dist = Math.hypot(vx, vy);
          if (dist > 8) {
            dx = vx / dist;
            dy = vy / dist;
          }
        }
        const len = Math.hypot(dx, dy);
        if (len > 0.05) {
          player.x = Math.max(padX + 16, Math.min(CANVAS_W - padX - 16, player.x + (dx / len) * 290 * dt));
          player.y = Math.max(padY + 16, Math.min(CANVAS_H - padY - 16, player.y + (dy / len) * 290 * dt));
          player.facing = dx >= 0 ? 1 : -1;
          player.anim += dt * 1.5;
        }

        // Rival bot painter keeps arena lively
        rivalBot.x += rivalBot.vx * dt;
        rivalBot.y += rivalBot.vy * dt;
        if (rivalBot.x < padX + 20 || rivalBot.x > CANVAS_W - padX - 20) rivalBot.vx *= -1;
        if (rivalBot.y < padY + 20 || rivalBot.y > CANVAS_H - padY - 20) rivalBot.vy *= -1;

        const pCol = Math.max(0, Math.min(PAINT_COLS - 1, Math.floor((player.x - padX) / cellW)));
        const pRow = Math.max(0, Math.min(PAINT_ROWS - 1, Math.floor((player.y - padY) / cellH)));
        const pIdx = pRow * PAINT_COLS + pCol;
        if (paintGrid[pIdx] !== 1) {
          paintGrid[pIdx] = 1;
          score += 12;
          partyAudio.playCoin();
        }

        const rCol = Math.max(0, Math.min(PAINT_COLS - 1, Math.floor((rivalBot.x - padX) / cellW)));
        const rRow = Math.max(0, Math.min(PAINT_ROWS - 1, Math.floor((rivalBot.y - padY) / cellH)));
        paintGrid[rRow * PAINT_COLS + rCol] = 2;

        for (let r = 0; r < PAINT_ROWS; r++) {
          for (let c = 0; c < PAINT_COLS; c++) {
            const val = paintGrid[r * PAINT_COLS + c];
            ctx.fillStyle = val === 1 ? heroColor : val === 2 ? '#475569' : '#312e81';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(padX + c * cellW + 3, padY + r * cellH + 3, cellW - 6, cellH - 6, 8);
            ctx.fill();
            ctx.stroke();
          }
        }

        drawHeroSprite(
          ctx,
          rivalCharacterId ?? 'koopa',
          rivalBot.x,
          rivalBot.y,
          38,
          rivalBot.vx >= 0 ? 1 : -1,
          elapsed,
          false,
          0.75
        );
        drawHeroSprite(ctx, characterId, player.x, player.y, 44, player.facing, player.anim, false);
      } else if (gameId === 'penguin_ice_slide') {
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
        grad.addColorStop(0, '#bae6fd');
        grad.addColorStop(1, '#e0f2fe');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Snow speed lines
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 10; i++) {
          const ly = ((i * 65 - elapsed * 260) % CANVAS_H + CANVAS_H) % CANVAS_H;
          ctx.beginPath();
          ctx.moveTo(40 + i * 72, ly);
          ctx.lineTo(40 + i * 72, ly + 26);
          ctx.stroke();
        }

        let dx = (right ? 1 : 0) - (left ? 1 : 0);
        if (ptr.down) {
          const diff = ptr.x - player.x;
          if (Math.abs(diff) > 10) dx = Math.max(-1, Math.min(1, diff / 45));
        }
        player.vx = player.vx * 0.9 + dx * 380 * 0.1;
        player.x = Math.max(36, Math.min(CANVAS_W - 36, player.x + player.vx * dt));
        if (Math.abs(dx) > 0.1) player.facing = dx > 0 ? 1 : -1;

        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawnTimer = 0.55;
          gates.push({
            x: 75 + rng() * (CANVAS_W - 150),
            y: CANVAS_H + 30,
            w: 64,
            kind: rng() > 0.42 ? 'ring' : 'snowman',
            hit: false,
          });
        }

        for (let i = gates.length - 1; i >= 0; i--) {
          const g = gates[i];
          g.y -= (245 + elapsed * 6) * dt;
          if (g.kind === 'ring') {
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.ellipse(g.x, g.y, 34, 14, 0, 0, Math.PI * 2);
            ctx.stroke();
            drawStar(g.x, g.y, 13);
            if (!g.hit && Math.hypot(player.x - g.x, player.y - g.y) < 38) {
              g.hit = true;
              score += 25;
              addPop(g.x, g.y - 16, '+25 ★', '#0284c7');
              partyAudio.playStar();
            }
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(g.x, g.y + 8, 18, 0, Math.PI * 2);
            ctx.arc(g.x, g.y - 10, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#f97316';
            ctx.fillRect(g.x, g.y - 12, 10, 4);
            if (!g.hit && Math.hypot(player.x - g.x, player.y - g.y) < 34) {
              g.hit = true;
              score = Math.max(0, score - 20);
              addPop(g.x, g.y - 16, '-20', '#ef4444');
              partyAudio.playHit();
            }
          }
          if (g.y < -40) gates.splice(i, 1);
        }

        drawHeroSprite(ctx, characterId, player.x, player.y, 46, player.facing, elapsed, false);
      } else if (gameId === 'shell_soccer_kick') {
        ctx.fillStyle = '#15803d';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 4;
        ctx.strokeRect(24, 24, CANVAS_W - 48, CANVAS_H - 48);

        // Moving Goal & Keeper
        goalX += goalDir * 90 * dt;
        if (goalX < 180 || goalX > CANVAS_W - 180) goalDir *= -1;
        keeperX += keeperDir * 215 * dt;
        if (keeperX < goalX - 85 || keeperX > goalX + 85) keeperDir *= -1;

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(goalX - 105, 32, 210, 14);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(goalX - 100, 46, 200, 32);

        // Goalkeeper Bowser Jr / Koopa
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(keeperX - 24, 72, 48, 24, 8);
        ctx.fill();
        ctx.stroke();

        // Sweeping Aim Arrow
        aimAngle += aimDir * 2.15 * dt;
        if (aimAngle > -0.65) aimDir = -1;
        if (aimAngle < -Math.PI + 0.65) aimDir = 1;

        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - 26);
        ctx.lineTo(player.x + Math.cos(aimAngle) * 110, player.y - 26 + Math.sin(aimAngle) * 110);
        ctx.stroke();

        if (kickCooldown > 0) kickCooldown -= dt;
        if ((jumpTrigger || ptr.down) && kickCooldown <= 0) {
          shots.push({
            x: player.x,
            y: player.y - 28,
            vx: Math.cos(aimAngle) * 540,
            vy: Math.sin(aimAngle) * 540,
            life: 1.5,
          });
          kickCooldown = 0.42;
          partyAudio.playJump();
        }

        for (let i = shots.length - 1; i >= 0; i--) {
          const s = shots[i];
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.life -= dt;
          ctx.fillStyle = '#22c55e';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          if (Math.abs(s.x - keeperX) < 34 && Math.abs(s.y - 84) < 22) {
            addPop(s.x, s.y, lang === 'ar' ? 'صدّها!' : 'SAVED!', '#ef4444');
            partyAudio.playHit();
            shots.splice(i, 1);
            continue;
          }
          if (s.y <= 68 && Math.abs(s.x - goalX) < 102) {
            score += 30;
            addPop(s.x, 76, lang === 'ar' ? 'هدف! +30' : 'GOAL! +30', '#fde047');
            partyAudio.playStar();
            shots.splice(i, 1);
            continue;
          }
          if (s.y < 10 || s.x < 10 || s.x > CANVAS_W - 10 || s.life <= 0) shots.splice(i, 1);
        }

        drawHeroSprite(ctx, characterId, player.x, player.y, 48, 1, elapsed, false);
      } else if (gameId === 'fire_bar_jump') {
        drawMarioSkyBg('#450a0a', '#7c2d12', '#334155');

        if (jumpTrigger && player.onGround) {
          player.vy = -595;
          player.onGround = false;
          partyAudio.playJump();
        }
        player.vy += 1650 * dt;
        player.y += player.vy * dt;
        if (player.y >= CANVAS_H - 84) {
          player.y = CANVAS_H - 84;
          player.vy = 0;
          player.onGround = true;
        }

        // Spinning Mario Castle Fire-Bar Rope!
        fireAngle += fireSpeed * dt;
        const barPhase = Math.sin(fireAngle);
        const barX = CANVAS_W / 2 + Math.cos(fireAngle) * 185;
        const barY = CANVAS_H - 68 + Math.sin(fireAngle) * 18;
        const inFront = Math.sin(fireAngle) >= 0;

        const drawFireBar = () => {
          for (let i = -3; i <= 3; i++) {
            const fx = CANVAS_W / 2 + (barX - CANVAS_W / 2) * (i / 3);
            const fy = barY - Math.abs(i) * 4;
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(fx, fy, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(fx, fy, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        };

        if (!inFront) drawFireBar();
        drawHeroSprite(
          ctx,
          characterId,
          player.x,
          player.y,
          52,
          1,
          elapsed,
          !player.onGround,
          player.invuln > 0 ? 0.5 : 1
        );
        if (inFront) drawFireBar();

        const crossingCenter = inFront && Math.abs(barX - player.x) < 28 && barPhase > 0.65;
        if (crossingCenter && !prevFireCross) {
          if (player.y < CANVAS_H - 118) {
            fireClearedCount += 1;
            const bonus = 15 + Math.min(25, fireClearedCount * 3);
            score += bonus;
            fireSpeed = Math.min(5.6, fireSpeed + 0.18);
            addPop(player.x, player.y - 42, `+${bonus}`, '#fde047');
            partyAudio.playCoin();
          } else if (player.invuln <= 0) {
            score = Math.max(0, score - 20);
            fireSpeed = Math.max(2.35, fireSpeed - 0.5);
            player.invuln = 0.75;
            addPop(player.x, player.y - 36, '-20', '#ef4444');
            partyAudio.playHit();
          }
        }
        prevFireCross = crossingCenter;
      } else if (gameId === 'sky_balloon_pop') {
        drawMarioSkyBg('#1d4ed8', '#38bdf8', '');

        let vyTarget = 120;
        if (up || space || ptr.down) vyTarget = -215;
        if (down) vyTarget = 225;
        player.vy += (vyTarget - player.vy) * Math.min(1, dt * 8);
        player.y = Math.max(46, Math.min(CANVAS_H - 46, player.y + player.vy * dt));

        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawnTimer = 0.58;
          const r = rng();
          skyObjs.push({
            x: CANVAS_W + 40,
            y: 55 + rng() * (CANVAS_H - 110),
            kind: r < 0.35 ? 'ring' : r < 0.72 ? 'balloon' : 'spiny',
            taken: false,
          });
        }

        for (let i = skyObjs.length - 1; i >= 0; i--) {
          const o = skyObjs[i];
          o.x -= 240 * dt;
          if (!o.taken) {
            if (o.kind === 'ring') {
              ctx.strokeStyle = '#facc15';
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.ellipse(o.x, o.y, 14, 34, 0, 0, Math.PI * 2);
              ctx.stroke();
              if (Math.hypot(player.x - o.x, player.y - o.y) < 38) {
                o.taken = true;
                score += 25;
                addPop(o.x, o.y - 20, '+25 ★', '#fde047');
                partyAudio.playStar();
              }
            } else if (o.kind === 'balloon') {
              ctx.fillStyle = '#ec4899';
              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(o.x, o.y, 18, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              drawCoin(o.x, o.y, 9);
              if (Math.hypot(player.x - o.x, player.y - o.y) < 36) {
                o.taken = true;
                score += 15;
                addPop(o.x, o.y - 16, '+15', '#facc15');
                partyAudio.playCoin();
              }
            } else {
              drawBomb(o.x, o.y, 19);
              if (player.invuln <= 0 && Math.hypot(player.x - o.x, player.y - o.y) < 36) {
                o.taken = true;
                score = Math.max(0, score - 22);
                player.invuln = 0.8;
                addPop(o.x, o.y - 16, '-22', '#ef4444');
                partyAudio.playHit();
              }
            }
          }
          if (o.x < -50) skyObjs.splice(i, 1);
        }

        // Balloon tethered above hero
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - 18);
        ctx.lineTo(player.x, player.y - 44);
        ctx.stroke();
        ctx.fillStyle = heroColor;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(player.x, player.y - 54, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        drawHeroSprite(ctx, characterId, player.x, player.y, 40, 1, elapsed, true);
      }

      // Draw Floating Score Pops
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        p.y -= 42 * dt;
        p.life -= dt;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / 0.7);
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(p.text, p.x + 2, p.y + 2);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
        if (p.life <= 0) pops.splice(i, 1);
      }

      if (ts - lastHudAt > 90) {
        lastHudAt = ts;
        setHudScore(score);
        setHudTime(Math.ceil(timeLeft));
      }

      if (ts - lastSyncAt > 360 || timeLeft <= 0) {
        lastSyncAt = ts;
        const isFinished = timeLeft <= 0;
        onLiveUpdateRef.current(score, isFinished ? 100 : timeProgress, isFinished);
        if (isFinished) {
          done = true;
          return;
        }
      }

      if (!done) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [gameId, seed, durationSec, characterId, rivalCharacterId, heroColor, lang]);

  const mapPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="w-full max-w-[740px] flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 border border-white/15">
        <div className="flex items-center gap-3">
          <span className="font-bold text-amber-300 text-sm sm:text-base">
            {lang === 'ar' ? spec.nameAr : spec.nameEn}
          </span>
          {hudHint && (
            <span className="text-xs sm:text-sm font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-md">
              {hudHint}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 font-mono tabular-nums text-sm sm:text-base">
          <span className="text-amber-300 font-extrabold">{hudScore} pts</span>
          <span className="text-cyan-300 font-bold">{hudTime}s</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onPointerDown={(e) => {
          const p = mapPointer(e);
          pointerRef.current = { down: true, x: p.x, y: p.y, justPressed: true };
        }}
        onPointerMove={(e) => {
          const p = mapPointer(e);
          pointerRef.current.x = p.x;
          pointerRef.current.y = p.y;
        }}
        onPointerUp={() => {
          pointerRef.current.down = false;
        }}
        onPointerLeave={() => {
          pointerRef.current.down = false;
        }}
        className="w-full max-w-[740px] aspect-[720/420] rounded-2xl border-2 border-amber-400/50 shadow-2xl touch-none select-none cursor-crosshair bg-slate-950"
      />

      {/* Mobile & Desktop Arrow Pad + Touch Action Bar */}
      <div className="w-full max-w-[740px] rounded-xl bg-slate-900/90 border border-white/15 px-3 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        {/* Directional Arrow Pad (forced LTR so Left arrow is always Left and Right is always Right) */}
        <div dir="ltr" className="flex items-center gap-2">
          {(gameId === 'lava_bridge_dash' ||
            gameId === 'bullet_bill_dodge' ||
            gameId === 'coin_magnet_maze' ||
            gameId === 'paint_tiles_party' ||
            gameId === 'sky_balloon_pop') ? (
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                aria-label="Up"
                onPointerDown={(e) => {
                  e.preventDefault();
                  keysRef.current.ArrowUp = true;
                }}
                onPointerUp={() => {
                  keysRef.current.ArrowUp = false;
                }}
                onPointerLeave={() => {
                  keysRef.current.ArrowUp = false;
                }}
                onPointerCancel={() => {
                  keysRef.current.ArrowUp = false;
                }}
                className="w-11 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 text-white border border-white/15 flex items-center justify-center touch-none select-none cursor-pointer"
              >
                <ArrowGlyphSvg dir="up" size={18} />
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Left"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    keysRef.current.ArrowLeft = true;
                  }}
                  onPointerUp={() => {
                    keysRef.current.ArrowLeft = false;
                  }}
                  onPointerLeave={() => {
                    keysRef.current.ArrowLeft = false;
                  }}
                  onPointerCancel={() => {
                    keysRef.current.ArrowLeft = false;
                  }}
                  className="w-11 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 text-white border border-white/15 flex items-center justify-center touch-none select-none cursor-pointer"
                >
                  <ArrowGlyphSvg dir="left" size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Down"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    keysRef.current.ArrowDown = true;
                  }}
                  onPointerUp={() => {
                    keysRef.current.ArrowDown = false;
                  }}
                  onPointerLeave={() => {
                    keysRef.current.ArrowDown = false;
                  }}
                  onPointerCancel={() => {
                    keysRef.current.ArrowDown = false;
                  }}
                  className="w-11 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 text-white border border-white/15 flex items-center justify-center touch-none select-none cursor-pointer"
                >
                  <ArrowGlyphSvg dir="down" size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Right"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    keysRef.current.ArrowRight = true;
                  }}
                  onPointerUp={() => {
                    keysRef.current.ArrowRight = false;
                  }}
                  onPointerLeave={() => {
                    keysRef.current.ArrowRight = false;
                  }}
                  onPointerCancel={() => {
                    keysRef.current.ArrowRight = false;
                  }}
                  className="w-11 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 text-white border border-white/15 flex items-center justify-center touch-none select-none cursor-pointer"
                >
                  <ArrowGlyphSvg dir="right" size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Left"
                onPointerDown={(e) => {
                  e.preventDefault();
                  keysRef.current.ArrowLeft = true;
                }}
                onPointerUp={() => {
                  keysRef.current.ArrowLeft = false;
                }}
                onPointerLeave={() => {
                  keysRef.current.ArrowLeft = false;
                }}
                onPointerCancel={() => {
                  keysRef.current.ArrowLeft = false;
                }}
                className="w-12 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 text-white border border-white/15 flex items-center justify-center touch-none select-none cursor-pointer"
              >
                <ArrowGlyphSvg dir="left" size={20} />
              </button>
              <button
                type="button"
                aria-label="Right"
                onPointerDown={(e) => {
                  e.preventDefault();
                  keysRef.current.ArrowRight = true;
                }}
                onPointerUp={() => {
                  keysRef.current.ArrowRight = false;
                }}
                onPointerLeave={() => {
                  keysRef.current.ArrowRight = false;
                }}
                onPointerCancel={() => {
                  keysRef.current.ArrowRight = false;
                }}
                className="w-12 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 text-white border border-white/15 flex items-center justify-center touch-none select-none cursor-pointer"
              >
                <ArrowGlyphSvg dir="right" size={20} />
              </button>
            </div>
          )}
        </div>

        <span className="hidden sm:inline text-slate-300 text-xs">
          {lang === 'ar' ? spec.controlsAr : spec.controlsEn}
        </span>

        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            pointerRef.current.justPressed = true;
            keysRef.current.Space = true;
          }}
          onPointerUp={() => {
            keysRef.current.Space = false;
          }}
          onPointerLeave={() => {
            keysRef.current.Space = false;
          }}
          onPointerCancel={() => {
            keysRef.current.Space = false;
          }}
          className="h-11 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-extrabold text-sm touch-none select-none cursor-pointer flex items-center gap-1.5 shadow"
        >
          <ArrowGlyphSvg dir="up" size={16} />
          <span>{lang === 'ar' ? 'قفز / تنفيذ' : 'JUMP / ACT'}</span>
        </button>
      </div>
    </div>
  );
};
