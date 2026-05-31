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
    this.damage = def.damage;
    this.range = def.range;
    this.fireRate = def.fireRate;
    this.color = def.color;
    this.tier = 1;
    this.totalSpent = def.cost;

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

    if (type === 'fever') {
      this._naniteGfx = scene.add.graphics().setDepth(3);
      this._naniteGfx.fillStyle(def.color, 0.07);
      this._naniteGfx.fillCircle(this.x, this.y, def.range);
      this._naniteGfx.lineStyle(1, def.color, 0.2);
      this._naniteGfx.strokeCircle(this.x, this.y, def.range);
    }
    if (type === 'watchtower') {
      this._relayGfx = scene.add.graphics().setDepth(3);
    }

    this.draw();
  }

  draw() {
    this.gfx.clear();
    const h = CELL / 2;

    this.gfx.fillStyle(0x1e1208);
    this.gfx.fillRect(this.x - h + 2, this.y - h + 2, CELL - 4, CELL - 4);

    switch (this.type) {
      case 'rifle':      this._drawRifle(h); break;
      case 'dynamite':   this._drawDynamite(h); break;
      case 'lasso':      this._drawLasso(h); break;
      case 'shotgun':    this._drawShotgun(h); break;
      case 'gatling':    this._drawGatling(h); break;
      case 'lightning':  this._drawLightning(h); break;
      case 'blizzard':   this._drawBlizzard(h); break;
      case 'buffalo':    this._drawBuffalo(h); break;
      case 'fever':      this._drawFever(h); break;
      case 'howitzer':   this._drawHowitzer(h); break;
      case 'watchtower': this._drawWatchtower(h); break;
    }

    if (this.tier >= 2) {
      this.gfx.lineStyle(this.tier >= 3 ? 2 : 1, this.tier >= 3 ? 0xffdd44 : 0xaaaaaa, 0.9);
      this.gfx.strokeCircle(this.x, this.y, h - 1);
    }
  }

  _barrel(len, thick) {
    this.gfx.lineStyle(thick, this.color);
    this.gfx.beginPath();
    this.gfx.moveTo(this.x, this.y);
    this.gfx.lineTo(this.x + Math.cos(this.angle) * len, this.y + Math.sin(this.angle) * len);
    this.gfx.strokePath();
  }

  _drawRifle(h) {
    this.gfx.fillStyle(0x4a2e0a);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      this.gfx.fillEllipse(this.x + Math.cos(a) * (h - 6), this.y + Math.sin(a) * (h - 6), 10, 7);
    }
    this.gfx.fillStyle(this.color, 0.85);
    this.gfx.fillCircle(this.x, this.y, h * 0.35);
    this._barrel(h * 0.95, 2);
    this.gfx.fillStyle(0x887700);
    this.gfx.fillCircle(
      this.x + Math.cos(this.angle) * h * 0.45,
      this.y + Math.sin(this.angle) * h * 0.45, 2.5
    );
  }

  _drawDynamite(h) {
    this.gfx.fillStyle(0xaa1a00);
    this.gfx.fillRect(this.x - 7, this.y - 10, 14, 18);
    this.gfx.fillStyle(0x222222);
    this.gfx.fillRect(this.x - 8, this.y - 6, 16, 3);
    this.gfx.fillRect(this.x - 8, this.y + 3, 16, 3);
    this.gfx.fillStyle(this.color, 0.85);
    this.gfx.fillRect(this.x - 5, this.y - 3, 10, 5);
    this.gfx.lineStyle(2, 0x886633);
    this.gfx.beginPath();
    this.gfx.moveTo(this.x + 3, this.y - 10);
    this.gfx.lineTo(this.x + 8, this.y - 17);
    this.gfx.strokePath();
    this.gfx.fillStyle(0xffee00);
    this.gfx.fillCircle(this.x + 8, this.y - 17, 3);
  }

  _drawLasso(h) {
    this.gfx.fillStyle(0x6b3a1f);
    this.gfx.fillRect(this.x - 2, this.y - h + 4, 4, CELL - 8);
    this.gfx.lineStyle(2, this.color, 0.85);
    this.gfx.strokeCircle(this.x, this.y, h * 0.5);
    this.gfx.lineStyle(1, this.color, 0.45);
    this.gfx.strokeCircle(this.x, this.y, h * 0.72);
    const lx = this.x + Math.cos(this.angle) * (h - 3);
    const ly = this.y + Math.sin(this.angle) * (h - 3);
    this.gfx.lineStyle(2, this.color, 0.9);
    this.gfx.strokeCircle(lx, ly, 5);
    this.gfx.lineStyle(1, this.color, 0.6);
    this.gfx.beginPath();
    this.gfx.moveTo(this.x, this.y);
    this.gfx.lineTo(lx, ly);
    this.gfx.strokePath();
  }

  _drawShotgun(h) {
    this.gfx.fillStyle(0x3d2008);
    this.gfx.fillRect(this.x - h + 4, this.y - h + 4, CELL - 8, CELL - 8);
    this.gfx.lineStyle(1, 0x6b4a1f, 0.8);
    this.gfx.strokeRect(this.x - h + 4, this.y - h + 4, CELL - 8, CELL - 8);
    const perpX = -Math.sin(this.angle) * 3;
    const perpY =  Math.cos(this.angle) * 3;
    const bLen = h * 0.8;
    this.gfx.lineStyle(3, this.color);
    this.gfx.beginPath();
    this.gfx.moveTo(this.x + perpX, this.y + perpY);
    this.gfx.lineTo(this.x + perpX + Math.cos(this.angle) * bLen, this.y + perpY + Math.sin(this.angle) * bLen);
    this.gfx.strokePath();
    this.gfx.beginPath();
    this.gfx.moveTo(this.x - perpX, this.y - perpY);
    this.gfx.lineTo(this.x - perpX + Math.cos(this.angle) * bLen, this.y - perpY + Math.sin(this.angle) * bLen);
    this.gfx.strokePath();
  }

  _drawGatling(h) {
    this.gfx.fillStyle(0x1a1a1a);
    this.gfx.fillCircle(this.x, this.y, h - 3);
    this.gfx.lineStyle(2, this.color, 0.6);
    this.gfx.strokeCircle(this.x, this.y, h - 3);
    this.gfx.fillStyle(this.color);
    for (let i = 0; i < 6; i++) {
      const a = this.angle + (i / 6) * Math.PI * 2;
      this.gfx.fillCircle(this.x + Math.cos(a) * (h * 0.45), this.y + Math.sin(a) * (h * 0.45), 3);
    }
    this.gfx.fillStyle(0x555555);
    this.gfx.fillCircle(this.x, this.y, 4.5);
    this.gfx.fillStyle(this.color, 0.8);
    this.gfx.fillCircle(this.x, this.y, 2);
  }

  _drawLightning(h) {
    this.gfx.fillStyle(0x0a1833);
    this.gfx.fillCircle(this.x, this.y, h - 3);
    this.gfx.lineStyle(2, this.color, 0.8);
    this.gfx.strokeCircle(this.x, this.y, h - 3);
    this.gfx.lineStyle(1, this.color, 0.35);
    this.gfx.strokeCircle(this.x, this.y, h * 0.55);
    this.gfx.lineStyle(3, this.color);
    this.gfx.beginPath();
    this.gfx.moveTo(this.x, this.y + 4);
    this.gfx.lineTo(this.x, this.y - h + 2);
    this.gfx.strokePath();
    this.gfx.fillStyle(0xffffff, 0.95);
    this.gfx.fillCircle(this.x, this.y - h + 2, 2.5);
  }

  _drawBlizzard(h) {
    this.gfx.fillStyle(0x0d1f2d);
    this.gfx.fillCircle(this.x, this.y, h - 3);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const tip = { x: this.x + Math.cos(a) * (h - 4), y: this.y + Math.sin(a) * (h - 4) };
      this.gfx.lineStyle(2, this.color, 0.9);
      this.gfx.beginPath();
      this.gfx.moveTo(this.x, this.y);
      this.gfx.lineTo(tip.x, tip.y);
      this.gfx.strokePath();
      const cbR = (h - 4) * 0.5;
      const cbX = this.x + Math.cos(a) * cbR;
      const cbY = this.y + Math.sin(a) * cbR;
      this.gfx.lineStyle(1, this.color, 0.6);
      this.gfx.beginPath();
      this.gfx.moveTo(cbX + Math.cos(a + Math.PI / 6) * 4, cbY + Math.sin(a + Math.PI / 6) * 4);
      this.gfx.lineTo(cbX + Math.cos(a - Math.PI / 6) * 4, cbY + Math.sin(a - Math.PI / 6) * 4);
      this.gfx.strokePath();
      this.gfx.fillStyle(this.color, 0.8);
      this.gfx.fillCircle(tip.x, tip.y, 2);
    }
    this.gfx.fillStyle(0xeeffff);
    this.gfx.fillCircle(this.x, this.y, 3.5);
  }

  _drawBuffalo(h) {
    this.gfx.fillStyle(0x241304);
    this.gfx.fillRect(this.x - h + 3, this.y - h + 3, CELL - 6, CELL - 6);
    this.gfx.lineStyle(2, this.color, 0.6);
    this.gfx.strokeRect(this.x - h + 3, this.y - h + 3, CELL - 6, CELL - 6);
    this.gfx.fillStyle(this.color, 0.7);
    for (const [dx, dy] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
      this.gfx.fillCircle(this.x + dx * (h - 7), this.y + dy * (h - 7), 2.5);
    }
    this._barrel(h * 1.1, 5);
    const bpX = this.x + Math.cos(this.angle) * h * 0.5;
    const bpY = this.y + Math.sin(this.angle) * h * 0.5;
    const perpX = -Math.sin(this.angle) * 5;
    const perpY =  Math.cos(this.angle) * 5;
    this.gfx.lineStyle(1, this.color, 0.6);
    this.gfx.beginPath();
    this.gfx.moveTo(bpX + perpX, bpY + perpY + 4);
    this.gfx.lineTo(bpX, bpY);
    this.gfx.lineTo(bpX - perpX, bpY - perpY + 4);
    this.gfx.strokePath();
  }

  _drawFever(h) {
    this.gfx.fillStyle(0x0d2208);
    this.gfx.fillCircle(this.x, this.y, h - 3);
    this.gfx.lineStyle(1, this.color, 0.5);
    this.gfx.strokeCircle(this.x, this.y, h - 3);
    this.gfx.fillStyle(this.color, 0.9);
    this.gfx.fillCircle(this.x, this.y - 2, h * 0.38);
    this.gfx.fillStyle(0x0d2208);
    this.gfx.fillCircle(this.x - 4, this.y - 4, 2.5);
    this.gfx.fillCircle(this.x + 4, this.y - 4, 2.5);
    this.gfx.fillStyle(this.color, 0.8);
    this.gfx.fillRect(this.x - 5, this.y + 3, 10, 5);
    this.gfx.fillStyle(0x0d2208);
    for (let i = 0; i < 3; i++) this.gfx.fillRect(this.x - 4 + i * 3, this.y + 4, 2, 3);
  }

  _drawHowitzer(h) {
    this.gfx.fillStyle(0x2a1108);
    this.gfx.fillRect(this.x - h + 6, this.y - 5, CELL - 12, 10);
    for (const wX of [this.x - 9, this.x + 9]) {
      this.gfx.fillStyle(0x3d1a08);
      this.gfx.fillCircle(wX, this.y + 5, 7);
      this.gfx.lineStyle(2, 0x6b3311, 0.9);
      this.gfx.strokeCircle(wX, this.y + 5, 7);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI;
        this.gfx.lineStyle(1, 0x6b3311, 0.7);
        this.gfx.beginPath();
        this.gfx.moveTo(wX + Math.cos(a) * 6, this.y + 5 + Math.sin(a) * 6);
        this.gfx.lineTo(wX - Math.cos(a) * 6, this.y + 5 - Math.sin(a) * 6);
        this.gfx.strokePath();
      }
    }
    this._barrel(h * 0.85, 7);
    const mX = this.x + Math.cos(this.angle) * (h * 0.85);
    const mY = this.y + Math.sin(this.angle) * (h * 0.85);
    this.gfx.fillStyle(0x221108);
    this.gfx.fillCircle(mX, mY, 5);
    this.gfx.lineStyle(2, this.color, 0.8);
    this.gfx.strokeCircle(mX, mY, 5);
  }

  _drawWatchtower(h) {
    const legW = 12;
    this.gfx.lineStyle(2, 0x6b3a1f);
    this.gfx.beginPath();
    this.gfx.moveTo(this.x - legW, this.y + h - 3);
    this.gfx.lineTo(this.x, this.y - h * 0.3);
    this.gfx.lineTo(this.x + legW, this.y + h - 3);
    this.gfx.strokePath();
    this.gfx.lineStyle(1, 0x6b3a1f, 0.7);
    this.gfx.beginPath();
    this.gfx.moveTo(this.x - legW * 0.6, this.y + h * 0.25);
    this.gfx.lineTo(this.x + legW * 0.6, this.y - h * 0.05);
    this.gfx.strokePath();
    this.gfx.beginPath();
    this.gfx.moveTo(this.x + legW * 0.6, this.y + h * 0.25);
    this.gfx.lineTo(this.x - legW * 0.6, this.y - h * 0.05);
    this.gfx.strokePath();
    this.gfx.fillStyle(0x5a2e10);
    this.gfx.fillRect(this.x - legW - 2, this.y - h + 2, legW * 2 + 4, 8);
    this.gfx.lineStyle(1, this.color, 0.6);
    this.gfx.strokeRect(this.x - legW - 2, this.y - h + 2, legW * 2 + 4, 8);
    this.gfx.fillStyle(this.color, 0.8);
    for (let i = 0; i < 3; i++) this.gfx.fillRect(this.x - legW + i * 9, this.y - h - 1, 5, 4);
    this.gfx.fillStyle(0xffdd88, 0.9);
    this.gfx.fillCircle(this.x, this.y - h + 6, 3);
  }

  showRange(visible) {
    this.rangeGfx.clear();
    if (visible) {
      this.rangeGfx.fillStyle(this.color, 0.06);
      this.rangeGfx.fillCircle(this.x, this.y, this.range);
      this.rangeGfx.lineStyle(1, this.color, 0.5);
      this.rangeGfx.strokeCircle(this.x, this.y, this.range);
      if (this.type === 'howitzer' && this.def.minRange) {
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
      if (this.type === 'howitzer' && this.def.minRange && dist < this.def.minRange) continue;
      const progress = e.pathIndex + (e.pathIndex < e.pathPoints.length - 1
        ? 1 - Phaser.Math.Distance.Between(e.x, e.y, e.pathPoints[e.pathIndex + 1].x, e.pathPoints[e.pathIndex + 1].y) / CELL
        : 0);
      if (progress > bestProgress) { bestProgress = progress; target = e; }
    }
    return target;
  }

  update(time, enemies, projectiles) {
    if (this.type === 'fever') { this._updateNanite(time, enemies); return; }
    if (this.type === 'watchtower') { this._updateRelay(time); return; }
    if (this._burstFiring) return;

    if (time - this.lastFire < this._effectiveFireRate(time)) return;

    const target = this._findTarget(enemies);
    if (!target) return;

    this.angle = Math.atan2(target.y - this.y, target.x - this.x);
    this.draw();
    this.lastFire = time;

    if (this.type === 'lightning') this._fireTesla(target, enemies);
    else if (this.type === 'buffalo') this._fireRailgun(target, enemies);
    else if (this.type === 'gatling') this._fireMinigun(target, projectiles);
    else this._fireStandard(target, projectiles);
  }

  _fireStandard(target, projectiles) {
    const def = this.def;
    projectiles.push(new Projectile(this.scene, this.x, this.y, target, {
      speed: def.projectileSpeed,
      damage: this.damage,
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
      e.takeDamage(Math.floor(this.damage * Math.pow(0.7, i)));
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
      if (Math.abs(dx * sin - dy * cos) <= 8 + e.size) e.takeDamage(this.damage);
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
          damage: this.damage,
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
      if (Math.sqrt(dx * dx + dy * dy) <= this.range) e.takeDamage(this.damage);
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

  upgradeCost() {
    if (this.tier >= 3) return null;
    return this.tier === 1 ? Math.floor(this.def.cost * 0.6) : Math.floor(this.def.cost * 0.8);
  }

  sellValue() {
    return Math.floor(this.totalSpent * 0.5);
  }

  upgrade() {
    const cost = this.upgradeCost();
    if (!cost) return;
    this.tier++;
    this.totalSpent += cost;
    this.damage = Math.floor(this.damage * 1.35);
    this.range = Math.floor(this.range * 1.15);
    this.fireRate = Math.floor(this.fireRate * 0.85);
    if (this._naniteGfx) {
      this._naniteGfx.destroy();
      this._naniteGfx = this.scene.add.graphics().setDepth(3);
      this._naniteGfx.fillStyle(this.def.color, 0.07);
      this._naniteGfx.fillCircle(this.x, this.y, this.range);
      this._naniteGfx.lineStyle(1, this.def.color, 0.2);
      this._naniteGfx.strokeCircle(this.x, this.y, this.range);
    }
    this.draw();
  }

  destroy() {
    this.gfx.destroy();
    this.rangeGfx.destroy();
    if (this._naniteGfx) this._naniteGfx.destroy();
    if (this._relayGfx) this._relayGfx.destroy();
  }
}
