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

    this.gfx.fillStyle(this.color, 0.25);
    this.gfx.fillCircle(this.x, this.y, this.size + 5);
    this.gfx.fillStyle(this.color);
    this.gfx.fillCircle(this.x, this.y, this.size);
    this.gfx.fillStyle(0xffffff, 0.4);
    this.gfx.fillCircle(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.28);

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
