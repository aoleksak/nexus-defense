import Phaser from 'phaser';
import { TOWERS } from '../config/towers.js';
import Projectile from './Projectile.js';

const CELL = 40;

export default class Tower {
  constructor(scene, col, row, type) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.type = type;

    const def = TOWERS[type];
    this.def = def;
    this.range = def.range;
    this.fireRate = def.fireRate;
    this.color = def.color;

    this.x = col * CELL + CELL / 2;
    this.y = row * CELL + CELL / 2;
    this.angle = -Math.PI / 2;
    this.lastFire = 0;

    this.gfx = scene.add.graphics().setDepth(4);
    this.rangeGfx = scene.add.graphics().setDepth(3);
    this.draw();
  }

  draw() {
    this.gfx.clear();
    const h = CELL / 2;

    this.gfx.fillStyle(0x111133);
    this.gfx.fillRect(this.x - h + 3, this.y - h + 3, CELL - 6, CELL - 6);

    this.gfx.lineStyle(2, this.color, 0.6);
    this.gfx.strokeCircle(this.x, this.y, h - 4);

    this.gfx.fillStyle(this.color, 0.9);
    this.gfx.fillCircle(this.x, this.y, h * 0.45);
    this.gfx.fillStyle(0xffffff, 0.7);
    this.gfx.fillCircle(this.x, this.y, h * 0.18);

    const bLen = h * 0.75;
    this.gfx.lineStyle(3, this.color);
    this.gfx.beginPath();
    this.gfx.moveTo(this.x, this.y);
    this.gfx.lineTo(this.x + Math.cos(this.angle) * bLen, this.y + Math.sin(this.angle) * bLen);
    this.gfx.strokePath();
  }

  showRange(visible) {
    this.rangeGfx.clear();
    if (visible) {
      this.rangeGfx.lineStyle(1, this.color, 0.5);
      this.rangeGfx.strokeCircle(this.x, this.y, this.range);
      this.rangeGfx.fillStyle(this.color, 0.06);
      this.rangeGfx.fillCircle(this.x, this.y, this.range);
    }
  }

  update(time, enemies, projectiles) {
    if (time - this.lastFire < this.fireRate) return;

    let target = null;
    let bestProgress = -1;

    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      if (Math.sqrt(dx * dx + dy * dy) > this.range) continue;
      // Prefer enemy furthest along the path
      const progress = e.pathIndex + (e.pathIndex < e.pathPoints.length - 1
        ? 1 - Phaser.Math.Distance.Between(e.x, e.y, e.pathPoints[e.pathIndex + 1].x, e.pathPoints[e.pathIndex + 1].y) / CELL
        : 0);
      if (progress > bestProgress) { bestProgress = progress; target = e; }
    }

    if (!target) return;

    this.angle = Math.atan2(target.y - this.y, target.x - this.x);
    this.draw();
    this.lastFire = time;

    const def = this.def;
    projectiles.push(new Projectile(this.scene, this.x, this.y, target, {
      speed: def.projectileSpeed,
      damage: def.damage,
      color: def.projectileColor,
      splashRadius: def.splashRadius || 0,
      slow: def.slowFactor ? { factor: def.slowFactor, duration: def.slowDuration } : null,
    }));
  }

  destroy() {
    this.gfx.destroy();
    this.rangeGfx.destroy();
  }
}
