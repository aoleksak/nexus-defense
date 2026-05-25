export default class Projectile {
  constructor(scene, x, y, target, config) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.target = target;
    this.speed = config.speed;
    this.damage = config.damage;
    this.color = config.color;
    this.splashRadius = config.splashRadius || 0;
    this.slow = config.slow || null;
    this.freeze = config.freeze || null;
    this.active = true;

    this.gfx = scene.add.graphics().setDepth(7);
    this.draw();
  }

  draw() {
    this.gfx.clear();
    this.gfx.fillStyle(this.color, 0.35);
    this.gfx.fillCircle(this.x, this.y, 7);
    this.gfx.fillStyle(this.color, 1);
    this.gfx.fillCircle(this.x, this.y, 4);
  }

  update(delta, enemies) {
    if (!this.active) return;
    if (!this.target?.alive) { this.active = false; return; }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const move = (this.speed * delta) / 1000;

    if (dist <= move + 6) {
      this.onHit(enemies);
      this.active = false;
    } else {
      this.x += (dx / dist) * move;
      this.y += (dy / dist) * move;
      this.draw();
    }
  }

  onHit(enemies) {
    if (this.splashRadius > 0) {
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - this.x;
        const dy = e.y - this.y;
        if (Math.sqrt(dx * dx + dy * dy) <= this.splashRadius) {
          e.takeDamage(this.damage);
          if (this.slow) e.applySlow(this.slow.factor, this.slow.duration);
          if (this.freeze) e.applyFreeze(this.freeze.duration);
        }
      }
      const fx = this.scene.add.graphics().setDepth(7);
      fx.fillStyle(this.color, 0.5);
      fx.fillCircle(this.x, this.y, this.splashRadius);
      this.scene.time.delayedCall(130, () => fx.destroy());
    } else {
      this.target.takeDamage(this.damage);
      if (this.slow) this.target.applySlow(this.slow.factor, this.slow.duration);
      if (this.freeze) this.target.applyFreeze(this.freeze.duration);
    }
  }

  destroy() {
    this.gfx.destroy();
  }
}
