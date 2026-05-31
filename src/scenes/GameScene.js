import Phaser from 'phaser';
import Tower from '../entities/Tower.js';
import Enemy from '../entities/Enemy.js';
import { WAVES } from '../config/waves.js';
import { TOWERS } from '../config/towers.js';

const CELL = 40;
const PLAY_W = 1040;
const PLAY_H = 720;
const COLS = PLAY_W / CELL;  // 26
const ROWS = PLAY_H / CELL;  // 18

// Path waypoints as [col, row]; col -1 and 26 are off-screen entry/exit
const PATH_GRID = [
  [-1, 9], [5, 9], [5, 3], [13, 3], [13, 14], [20, 14], [20, 5], [26, 5],
];

function gridToPixel(col, row) {
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
}

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.lives = 20;
    this.credits = 150;
    this.score = 0;
    this.waveIndex = 0;
    this.waveActive = false;
    this.nextWaveCountdown = 5000;
    this.waveTime = 0;
    this.gameOver = false;
    this.won = false;

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.spawnQueue = [];
    this.pathCells = new Set();
    this.selectedTowerType = null;
    this.selectedTower = null;

    this.pathPoints = PATH_GRID.map(([c, r]) => gridToPixel(c, r));
    this.buildPathCells();

    this.drawBackground();
    this.drawPath();
    this.addPathTiles();
    this.drawGrid();
    this.scatterDecor();

    this.hoverGfx = this.add.graphics().setDepth(8);

    this.input.on('pointermove', this.onHover, this);
    this.input.on('pointerdown', this.onClick, this);

    this.scene.launch('UIScene');
  }

  buildPathCells() {
    for (let i = 0; i < PATH_GRID.length - 1; i++) {
      const [c1, r1] = PATH_GRID[i];
      const [c2, r2] = PATH_GRID[i + 1];
      if (c1 === c2) {
        for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) this.pathCells.add(`${c1},${r}`);
      } else {
        for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) this.pathCells.add(`${c},${r1}`);
      }
    }
  }

  isBlocked(col, row) {
    return this.pathCells.has(`${col},${row}`) || this.towers.some(t => t.col === col && t.row === row);
  }

  drawBackground() {
    const g = this.add.graphics().setDepth(0);

    // Night sky gradient (dark brown-black at top, slightly warmer at horizon)
    g.fillStyle(0x0a0603);
    g.fillRect(0, 0, PLAY_W, PLAY_H);

    // Stars (frontier night sky)
    for (let i = 0; i < 140; i++) {
      const alpha = Phaser.Math.FloatBetween(0.15, 0.85);
      const sz = Math.random() < 0.1 ? 2 : 1;
      g.fillStyle(0xfffde8, alpha);
      g.fillRect(Phaser.Math.Between(0, PLAY_W), Phaser.Math.Between(0, PLAY_H * 0.65), sz, sz);
    }

    // Distant mountain silhouettes
    g.fillStyle(0x150d06);
    g.fillTriangle(0, 420, 160, 240, 320, 420);
    g.fillTriangle(200, 420, 390, 210, 580, 420);
    g.fillTriangle(480, 420, 640, 255, 800, 420);
    g.fillTriangle(700, 420, 880, 230, 1040, 420);

    // Prairie ground (lower third)
    g.fillStyle(0x1a1106);
    g.fillRect(0, 420, PLAY_W, PLAY_H - 420);

    // Side panel background
    g.fillStyle(0x100a04);
    g.fillRect(PLAY_W, 0, 1280 - PLAY_W, PLAY_H);
    g.lineStyle(2, 0xaa7722, 0.7);
    g.beginPath(); g.moveTo(PLAY_W, 0); g.lineTo(PLAY_W, PLAY_H); g.strokePath();
  }

  drawGrid() {
    const g = this.add.graphics().setDepth(1);
    g.lineStyle(1, 0x251708, 0.5);
    for (let c = 0; c <= COLS; c++) {
      g.beginPath(); g.moveTo(c * CELL, 0); g.lineTo(c * CELL, PLAY_H); g.strokePath();
    }
    for (let r = 0; r <= ROWS; r++) {
      g.beginPath(); g.moveTo(0, r * CELL); g.lineTo(PLAY_W, r * CELL); g.strokePath();
    }
  }

  drawPath() {
    const g = this.add.graphics().setDepth(2);
    const pts = this.pathPoints;

    const line = (w, color, alpha = 1) => {
      g.lineStyle(w, color, alpha);
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
      g.strokePath();
    };

    // Dirt trail
    line(CELL, 0x2a1a0a);
    line(CELL - 6, 0x3d2510);
    line(CELL - 12, 0x4a2d12);
    line(2, 0x8b6914, 0.6);

    // Entry arrow (gold — wagon enters from the east)
    g.fillStyle(0xd4a843, 0.9);
    const ep = pts[0];
    g.fillTriangle(ep.x - 6, ep.y - 8, ep.x - 6, ep.y + 8, ep.x + 10, ep.y);

    // Exit arrow (red — settlers lost)
    g.fillStyle(0xcc3322, 0.9);
    const xp = pts[pts.length - 1];
    g.fillTriangle(xp.x - 10, xp.y - 8, xp.x - 10, xp.y + 8, xp.x + 6, xp.y);

    // Direction arrows along trail
    for (let i = 0; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      const a = Math.atan2(pts[i + 1].y - pts[i].y, pts[i + 1].x - pts[i].x);
      const s = 7;
      g.fillStyle(0x8b6914, 0.45);
      g.fillTriangle(
        mx + Math.cos(a) * s, my + Math.sin(a) * s,
        mx + Math.cos(a + 2.4) * s * 0.6, my + Math.sin(a + 2.4) * s * 0.6,
        mx + Math.cos(a - 2.4) * s * 0.6, my + Math.sin(a - 2.4) * s * 0.6
      );
    }
  }

  addPathTiles() {
    if (!this.textures.exists('tile_dirt')) return;
    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const p1 = this.pathPoints[i];
      const p2 = this.pathPoints[i + 1];
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      const w  = Math.abs(p2.x - p1.x) + CELL;
      const h  = Math.abs(p2.y - p1.y) + CELL;
      this.add.tileSprite(cx, cy, w, h, 'tile_dirt').setDepth(2).setAlpha(0.55);
    }
  }

  scatterDecor() {
    if (this.textures.exists('plant')) {
      for (let i = 0; i < 24; i++) {
        const col = Phaser.Math.Between(1, COLS - 2);
        const row = Phaser.Math.Between(11, ROWS - 2);
        if (!this.pathCells.has(`${col},${row}`)) {
          const { x, y } = gridToPixel(col, row);
          this.add.image(x, y - 2, 'plant')
            .setDepth(2)
            .setScale(Phaser.Math.FloatBetween(0.32, 0.62))
            .setAlpha(Phaser.Math.FloatBetween(0.5, 0.8));
        }
      }
    }
    if (this.textures.exists('basin')) {
      const spots = [[3, 13], [17, 12]];
      for (const [col, row] of spots) {
        if (!this.pathCells.has(`${col},${row}`)) {
          const { x, y } = gridToPixel(col, row);
          this.add.image(x, y, 'basin').setDepth(2).setScale(0.55).setAlpha(0.75);
        }
      }
    }
  }

  onHover(pointer) {
    if (pointer.x >= PLAY_W) { this.hoverGfx.clear(); this.input.setDefaultCursor('default'); return; }
    const col = Math.floor(pointer.x / CELL);
    const row = Math.floor(pointer.y / CELL);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) { this.hoverGfx.clear(); return; }

    this.hoverGfx.clear();
    for (const t of this.towers) t.showRange(false);

    if (this.selectedTowerType) {
      const ok = !this.isBlocked(col, row);
      const cx = col * CELL + CELL / 2;
      const cy = row * CELL + CELL / 2;
      const towerDef = TOWERS[this.selectedTowerType];
      // range preview circle
      this.hoverGfx.fillStyle(towerDef.color, 0.07);
      this.hoverGfx.fillCircle(cx, cy, towerDef.range);
      this.hoverGfx.lineStyle(1, towerDef.color, 0.4);
      this.hoverGfx.strokeCircle(cx, cy, towerDef.range);
      // cell highlight
      this.hoverGfx.fillStyle(ok ? 0x00ff00 : 0xff0000, 0.25);
      this.hoverGfx.fillRect(col * CELL, row * CELL, CELL, CELL);
      this.hoverGfx.lineStyle(2, ok ? 0x00ff00 : 0xff0000, 0.8);
      this.hoverGfx.strokeRect(col * CELL, row * CELL, CELL, CELL);
    } else {
      const hovered = this.towers.find(t => t.col === col && t.row === row);
      if (hovered) {
        hovered.showRange(true);
        this.input.setDefaultCursor('pointer');
      } else {
        this.input.setDefaultCursor('default');
      }
    }
  }

  onClick(pointer) {
    if (this.gameOver || pointer.x >= PLAY_W) return;
    const col = Math.floor(pointer.x / CELL);
    const row = Math.floor(pointer.y / CELL);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;

    const existing = this.towers.find(t => t.col === col && t.row === row) || null;

    if (existing) {
      // Always show popup when clicking a placed tower
      this.selectedTower = existing;
      this.game.events.emit('towerSelect', existing);
    } else if (this.selectedTowerType && !this.pathCells.has(`${col},${row}`)) {
      const cost = TOWERS[this.selectedTowerType].cost;
      if (this.credits < cost) return;
      this.credits -= cost;
      this.towers.push(new Tower(this, col, row, this.selectedTowerType));
      this.pushStats();
    } else {
      this.selectedTower = null;
      this.game.events.emit('towerSelect', null);
    }
  }

  getStats() {
    return {
      lives: this.lives,
      credits: this.credits,
      score: this.score,
      wave: this.waveIndex,
      totalWaves: WAVES.length,
      countdown: Math.max(0, Math.ceil(this.nextWaveCountdown / 1000)),
      waveActive: this.waveActive,
    };
  }

  pushStats() {
    this.game.events.emit('statsUpdate', this.getStats());
  }

  update(time, delta) {
    if (this.gameOver) return;

    // Wave countdown
    if (!this.waveActive && this.waveIndex < WAVES.length) {
      this.nextWaveCountdown -= delta;
      if (this.nextWaveCountdown <= 0) {
        this.startWave();
      }
    }

    // Spawn from queue
    if (this.spawnQueue.length > 0) {
      this.spawnQueue[0].timer -= delta;
      if (this.spawnQueue[0].timer <= 0) {
        const entry = this.spawnQueue.shift();
        this.enemies.push(new Enemy(this, entry.type, this.pathPoints));
      }
    }

    // Wave complete when queue empty and all enemies gone
    if (this.waveActive && this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.waveActive = false;
      this.waveIndex++;
      this.credits += 50;
      this.nextWaveCountdown = 8000;
      this.game.events.emit('waveComplete', this.waveIndex);
      if (this.waveIndex >= WAVES.length) { this.triggerEnd(true); return; }
      this.pushStats();
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(delta);
      if (e.reached) {
        this.lives -= e.livesLost;
        e.destroy();
        this.enemies.splice(i, 1);
        if (this.lives <= 0) { this.lives = 0; this.triggerEnd(false); return; }
        this.pushStats();
      } else if (!e.alive) {
        this.score += e.reward;
        this.credits += e.reward;
        e.destroy();
        this.enemies.splice(i, 1);
        this.pushStats();
      }
    }

    // Update towers
    for (const t of this.towers) t.update(time, this.enemies, this.projectiles);

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(delta, this.enemies);
      if (!p.active) { p.destroy(); this.projectiles.splice(i, 1); }
    }

    // Throttled stats push for countdown display
    this._statsTick = (this._statsTick || 0) + delta;
    if (this._statsTick >= 250) { this._statsTick = 0; this.pushStats(); }
  }

  startWave() {
    this.waveActive = true;
    const wave = WAVES[this.waveIndex];

    // Build absolute-time events, then convert to relative delays
    const events = [];
    for (const group of wave.enemies) {
      for (let i = 0; i < group.count; i++) {
        events.push({ time: i * group.interval, type: group.type });
      }
    }
    events.sort((a, b) => a.time - b.time);

    let prev = 0;
    this.spawnQueue = events.map(e => {
      const rel = e.time - prev;
      prev = e.time;
      return { timer: rel, type: e.type };
    });

    this.game.events.emit('waveStart', this.waveIndex + 1);
    this.pushStats();
  }

  triggerEnd(won) {
    this.gameOver = true;
    this.won = won;
    this.game.events.emit('gameOver', { won, score: this.score });
  }
}
