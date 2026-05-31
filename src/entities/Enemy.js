import { ENEMIES } from '../config/enemies.js';

export default class Enemy {
  constructor(scene, type, pathPoints) {
    this.scene = scene;
    this.type = type;

    const def = ENEMIES[type];
    this.maxHealth = def.health;
    this.health = def.health;
    this.speed = def.speed;
    this.reward = def.reward;
    this.livesLost = def.livesLost;
    this.color = def.color;
    this.size = def.size;

    this.pathPoints = pathPoints;
    this.pathIndex = 0;
    this.alive = true;
    this.reached = false;
    this.slowFactor = 1;
    this.slowTimer = 0;
    this.frozen = false;
    this.frozenTimer = 0;
    this.shatterBonus = false;

    this.x = pathPoints[0].x;
    this.y = pathPoints[0].y;

    this.gfx = scene.add.graphics().setDepth(5);
    this.hpBar = scene.add.graphics().setDepth(6);
    this.draw();
  }

  draw() {
    this.gfx.clear();

    if (this.frozen) {
      this.gfx.fillStyle(0x88eeff, 0.3);
      this.gfx.fillCircle(this.x, this.y, this.size + 6);
      this.gfx.lineStyle(2, 0x88eeff, 0.9);
      this.gfx.strokeCircle(this.x, this.y, this.size + 3);
    }

    switch (this.type) {
      case 'raider':    this._drawRaider(); break;
      case 'scout':     this._drawScout(); break;
      case 'outlaw':    this._drawOutlaw(); break;
      case 'desperado': this._drawDesperado(); break;
      default:          this._drawDefault(); break;
    }

    this.hpBar.clear();
    if (this.health < this.maxHealth) {
      const w = this.size * 2.8;
      const bx = this.x - w / 2;
      const by = this.y - this.size - 9;
      this.hpBar.fillStyle(0x222222);
      this.hpBar.fillRect(bx, by, w, 4);
      const pct = this.health / this.maxHealth;
      this.hpBar.fillStyle(pct > 0.5 ? 0x44ff44 : pct > 0.25 ? 0xffdd00 : 0xff2200);
      this.hpBar.fillRect(bx, by, w * pct, 4);
    }
  }

  _drawDefault() {
    this.gfx.fillStyle(this.color, 0.25);
    this.gfx.fillCircle(this.x, this.y, this.size + 5);
    this.gfx.fillStyle(this.color);
    this.gfx.fillCircle(this.x, this.y, this.size);
    this.gfx.fillStyle(0xffffff, 0.4);
    this.gfx.fillCircle(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.28);
  }

  _drawRaider() {
    const s = this.size;
    // Aura
    this.gfx.fillStyle(this.color, 0.2);
    this.gfx.fillCircle(this.x, this.y, s + 3);
    // Body
    this.gfx.fillStyle(this.color);
    this.gfx.fillCircle(this.x, this.y, s);
    // Hat brim
    this.gfx.fillStyle(0x2a1100);
    this.gfx.fillRect(this.x - s - 1, this.y - s + 1, (s + 1) * 2, 3);
    // Hat crown
    this.gfx.fillRect(this.x - s * 0.55, this.y - s - 6, s * 1.1, 7);
    // Eyes
    this.gfx.fillStyle(0xffffff, 0.9);
    this.gfx.fillCircle(this.x - 2.5, this.y + 1, 1.5);
    this.gfx.fillCircle(this.x + 2.5, this.y + 1, 1.5);
  }

  _drawScout() {
    const s = this.size;
    // Diamond aura
    this.gfx.fillStyle(this.color, 0.2);
    this.gfx.fillTriangle(this.x, this.y - s - 3, this.x + s + 3, this.y, this.x, this.y + s + 3);
    this.gfx.fillTriangle(this.x, this.y - s - 3, this.x - s - 3, this.y, this.x, this.y + s + 3);
    // Diamond body
    this.gfx.fillStyle(this.color);
    this.gfx.fillTriangle(this.x, this.y - s, this.x + s, this.y, this.x, this.y + s);
    this.gfx.fillTriangle(this.x, this.y - s, this.x - s, this.y, this.x, this.y + s);
    // Bandana slash
    this.gfx.lineStyle(2, 0xcc6600, 0.9);
    this.gfx.beginPath();
    this.gfx.moveTo(this.x - s * 0.6, this.y);
    this.gfx.lineTo(this.x + s * 0.6, this.y);
    this.gfx.strokePath();
    // Speed streaks
    this.gfx.lineStyle(1, this.color, 0.4);
    this.gfx.beginPath();
    this.gfx.moveTo(this.x - s * 1.2, this.y - s * 0.3);
    this.gfx.lineTo(this.x - s * 2.0, this.y - s * 0.3);
    this.gfx.strokePath();
    this.gfx.beginPath();
    this.gfx.moveTo(this.x - s * 1.2, this.y + s * 0.3);
    this.gfx.lineTo(this.x - s * 2.0, this.y + s * 0.3);
    this.gfx.strokePath();
  }

  _drawOutlaw() {
    const s = this.size;
    // Hex aura
    this.gfx.fillStyle(this.color, 0.2);
    this._hexFill(s + 3);
    // Hex body
    this.gfx.fillStyle(this.color);
    this._hexFill(s);
    // Wide-brim hat
    this.gfx.fillStyle(0x1a0800);
    this.gfx.fillRect(this.x - s - 3, this.y - s, (s + 3) * 2, 3);
    this.gfx.fillRect(this.x - s * 0.6, this.y - s - 8, s * 1.2, 8);
    // Duster coat hem
    this.gfx.fillStyle(0x7a3300, 0.55);
    this.gfx.fillTriangle(
      this.x - s, this.y + s * 0.4,
      this.x + s, this.y + s * 0.4,
      this.x, this.y + s + 4
    );
  }

  _hexFill(r) {
    for (let i = 0; i < 6; i++) {
      const a1 = (i / 6) * Math.PI * 2 - Math.PI / 6;
      const a2 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 6;
      this.gfx.fillTriangle(
        this.x, this.y,
        this.x + Math.cos(a1) * r, this.y + Math.sin(a1) * r,
        this.x + Math.cos(a2) * r, this.y + Math.sin(a2) * r
      );
    }
  }

  _drawDesperado() {
    const s = this.size;
    // Menacing aura
    this.gfx.fillStyle(this.color, 0.12);
    this.gfx.fillCircle(this.x, this.y, s + 7);
    // 8-pointed star
    this.gfx.fillStyle(this.color);
    for (let i = 0; i < 8; i++) {
      const a1 = (i / 8) * Math.PI * 2;
      const a2 = ((i + 0.5) / 8) * Math.PI * 2;
      const a3 = ((i + 1) / 8) * Math.PI * 2;
      this.gfx.fillTriangle(
        this.x + Math.cos(a1) * s,        this.y + Math.sin(a1) * s,
        this.x + Math.cos(a2) * s * 0.45, this.y + Math.sin(a2) * s * 0.45,
        this.x + Math.cos(a3) * s,        this.y + Math.sin(a3) * s
      );
    }
    // Dark core
    this.gfx.fillStyle(0x3a0000);
    this.gfx.fillCircle(this.x, this.y, s * 0.55);
    // Glowing eyes
    this.gfx.fillStyle(0xff2200, 0.95);
    this.gfx.fillCircle(this.x - 4, this.y - 2, 3);
    this.gfx.fillCircle(this.x + 4, this.y - 2, 3);
    // Snarl
    this.gfx.lineStyle(1, 0xff4400, 0.8);
    this.gfx.beginPath();
    this.gfx.moveTo(this.x - 4, this.y + 4);
    this.gfx.lineTo(this.x - 1, this.y + 6);
    this.gfx.lineTo(this.x + 1, this.y + 6);
    this.gfx.lineTo(this.x + 4, this.y + 4);
    this.gfx.strokePath();
  }

  update(delta) {
    if (!this.alive || this.reached) return;

    if (this.frozenTimer > 0) {
      this.frozenTimer -= delta;
      if (this.frozenTimer <= 0) {
        this.frozen = false;
        this.frozenTimer = 0;
        this.shatterBonus = false;
      }
      this.draw();
      return;
    }

    if (this.slowTimer > 0) {
      this.slowTimer -= delta;
      if (this.slowTimer <= 0) this.slowFactor = 1;
    }

    const nextIdx = this.pathIndex + 1;
    if (nextIdx >= this.pathPoints.length) { this.reached = true; return; }

    const target = this.pathPoints[nextIdx];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const move = (this.speed * this.slowFactor * delta) / 1000;

    if (dist <= move) {
      this.x = target.x;
      this.y = target.y;
      this.pathIndex = nextIdx;
    } else {
      this.x += (dx / dist) * move;
      this.y += (dy / dist) * move;
    }

    this.draw();
  }

  takeDamage(amount) {
    let dmg = amount;
    if (this.frozen && this.shatterBonus) {
      dmg *= 2;
      this.shatterBonus = false;
    }
    this.health -= dmg;
    if (this.health <= 0) { this.health = 0; this.alive = false; }
  }

  applySlow(factor, duration) {
    if (factor < this.slowFactor) this.slowFactor = factor;
    if (duration > this.slowTimer) this.slowTimer = duration;
  }

  applyFreeze(duration) {
    this.frozen = true;
    this.frozenTimer = Math.max(this.frozenTimer, duration);
    this.shatterBonus = true;
    this.slowFactor = 1;
    this.slowTimer = 0;
  }

  destroy() {
    this.gfx.destroy();
    this.hpBar.destroy();
  }
}
