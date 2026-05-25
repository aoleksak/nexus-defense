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
    this.buffedUntil = 0;
    this._burstFiring = false;
    this._nanoTick = 0;
    this._relayGfx = null;
    this._naniteGfx = null;

    this.gfx = scene.add.graphics().setDepth(4);
    this.rangeGfx = scene.add.graphics().setDepth(3);

    if (type === 'nanite') {
      this._naniteGfx = scene.add.graphics().setDepth(3);
      this._naniteGfx.fillStyle(def.color, 0.07);
      this._naniteGfx.fillCircle(this.x, this.y, def.range);
      this._naniteGfx.lineStyle(1, def.color, 0.2);
      this._naniteGfx.strokeCircle(this.x, this.y, def.range);
    }
    if (type === 'supportRelay') {
      this._relayGfx = scene.add.graphics().setDepth(3);
    }

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

    if (this.type === 'nanite' || this.type === 'supportRelay') return;

    const bLen = h * 0.75;
    const thick = this.type === 'minigun' ? 4 : this.type === 'railgun' ? 5 : 3;
    this.gfx.lineStyle(thick, this.color);
    this.gfx.beginPath();
    this.gfx.moveTo(this.x, this.y);
    this.gfx.lineTo(this.x + Math.cos(this.angle) * bLen, this.y + Math.sin(this.angle) * bLen);
    this.gfx.strokePath();
  }

  showRange(visible) {
    this.rangeGfx.clear();
    if (visible) {
      this.rangeGfx.fillStyle(this.color, 0.06);
      this.rangeGfx.fillCircle(this.x, this.y, this.range);
      this.rangeGfx.lineStyle(1, this.color, 0.5);
      this.rangeGfx.strokeCircle(this.x, this.y, this.range);
      if (this.type === 'artillery' && this.def.minRange) {
        this.rangeGfx.lineStyle(1, 0xff4444, 0.4);
        this.rangeGfx.strokeCircle(this.x, this.y, this.def.minRange);
      }
    }
  }

  _effectiveFireRate(time) {
    return Math.floor(this.fireRate * (time < this.buffedUntil ? 0.75 : 1));
  }

  _findTarget(enemies) {
    let target = null;
    let bestProgress = -1;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > this.range) continue;
      if (this.type === 'artillery' && this.def.minRange && dist < this.def.minRange) continue;
      const progress = e.pathIndex + (e.pathIndex < e.pathPoints.length - 1
        ? 1 - Phaser.Math.Distance.Between(e.x, e.y, e.pathPoints[e.pathIndex + 1].x, e.pathPoints[e.pathIndex + 1].y) / CELL
        : 0);
      if (progress > bestProgress) { bestProgress = progress; target = e; }
    }
    return target;
  }

  update(time, enemies, projectiles) {
    if (this.type === 'nanite') { this._updateNanite(time, enemies); return; }
    if (this.type === 'supportRelay') { this._updateRelay(time); return; }
    if (this._burstFiring) return;

    if (time - this.lastFire < this._effectiveFireRate(time)) return;

    const target = this._findTarget(enemies);
    if (!target) return;

    this.angle = Math.atan2(target.y - this.y, target.x - this.x);
    this.draw();
    this.lastFire = time;

    if (this.type === 'tesla') this._fireTesla(target, enemies);
    else if (this.type === 'railgun') this._fireRailgun(target, enemies);
    else if (this.type === 'minigun') this._fireMinigun(target, projectiles);
    else this._fireStandard(target, projectiles);
  }

  _fireStandard(target, projectiles) {
    const def = this.def;
    projectiles.push(new Projectile(this.scene, this.x, this.y, target, {
      speed: def.projectileSpeed,
      damage: def.damage,
      color: def.projectileColor,
      splashRadius: def.splashRadius || 0,
      slow: def.slowFactor ? { factor: def.slowFactor, duration: def.slowDuration } : null,
      freeze: def.freezeDuration ? { duration: def.freezeDuration } : null,
    }));
  }

  _fireTesla(primaryTarget, enemies) {
    const def = this.def;
    const chain = [primaryTarget];
    let current = primaryTarget;

    for (let i = 1; i < (def.chainCount || 4); i++) {
      let next = null;
      let bestDist = def.chainRange || 80;
      for (const e of enemies) {
        if (!e.alive || chain.includes(e)) continue;
        const dist = Phaser.Math.Distance.Between(current.x, current.y, e.x, e.y);
        if (dist < bestDist) { bestDist = dist; next = e; }
      }
      if (!next) break;
      chain.push(next);
      current = next;
    }

    const g = this.scene.add.graphics().setDepth(7);
    let prev = { x: this.x, y: this.y };
    chain.forEach((e, i) => {
      e.takeDamage(Math.floor(def.damage * Math.pow(0.7, i)));
      g.lineStyle(Math.max(1, 2.5 - i * 0.4), 0x88ccff, 0.9 - i * 0.15);
      g.beginPath();
      g.moveTo(prev.x, prev.y);
      const mx = (prev.x + e.x) / 2 + (Math.random() - 0.5) * 18;
      const my = (prev.y + e.y) / 2 + (Math.random() - 0.5) * 18;
      g.lineTo(mx, my);
      g.lineTo(e.x, e.y);
      g.strokePath();
      prev = { x: e.x, y: e.y };
    });
    this.scene.time.delayedCall(120, () => g.destroy());
  }

  _fireRailgun(target, enemies) {
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > this.range) continue;
      if (dx * cos + dy * sin < 0) continue;
      if (Math.abs(dx * sin - dy * cos) <= 8 + e.size) e.takeDamage(this.def.damage);
    }

    const g = this.scene.add.graphics().setDepth(7);
    const endX = this.x + cos * this.range;
    const endY = this.y + sin * this.range;
    g.lineStyle(4, 0xffdd88, 0.9);
    g.beginPath(); g.moveTo(this.x, this.y); g.lineTo(endX, endY); g.strokePath();
    g.lineStyle(2, 0xffffff, 0.6);
    g.beginPath(); g.moveTo(this.x, this.y); g.lineTo(endX, endY); g.strokePath();
    this.scene.time.delayedCall(160, () => g.destroy());
  }

  _fireMinigun(target, projectiles) {
    this._burstFiring = true;
    const def = this.def;
    const BURST = 6;
    for (let i = 0; i < BURST; i++) {
      this.scene.time.delayedCall(i * 80, () => {
        if (!target.alive) return;
        this.angle = Math.atan2(target.y - this.y, target.x - this.x);
        this.draw();
        projectiles.push(new Projectile(this.scene, this.x, this.y, target, {
          speed: def.projectileSpeed,
          damage: def.damage,
          color: def.projectileColor,
        }));
      });
    }
    this.scene.time.delayedCall(BURST * 80, () => { this._burstFiring = false; });
  }

  _updateNanite(time, enemies) {
    if (time - this._nanoTick < this.fireRate) return;
    this._nanoTick = time;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      if (Math.sqrt(dx * dx + dy * dy) <= this.range) e.takeDamage(this.def.damage);
    }
    const g = this.scene.add.graphics().setDepth(7);
    g.fillStyle(this.color, 0.14);
    g.fillCircle(this.x, this.y, this.range);
    this.scene.time.delayedCall(200, () => g.destroy());
  }

  _updateRelay(time) {
    if (time - this.lastFire < this.fireRate) return;
    this.lastFire = time;
    if (this._relayGfx) this._relayGfx.clear();
    const towers = this.scene.towers;
    if (!towers) return;
    for (const t of towers) {
      if (t === this) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, t.x, t.y);
      if (dist <= this.range) {
        t.buffedUntil = time + 2000;
        if (this._relayGfx) {
          this._relayGfx.lineStyle(1, this.color, 0.35);
          this._relayGfx.beginPath();
          this._relayGfx.moveTo(this.x, this.y);
          this._relayGfx.lineTo(t.x, t.y);
          this._relayGfx.strokePath();
        }
      }
    }
  }

  destroy() {
    this.gfx.destroy();
    this.rangeGfx.destroy();
    if (this._naniteGfx) this._naniteGfx.destroy();
    if (this._relayGfx) this._relayGfx.destroy();
  }
}
