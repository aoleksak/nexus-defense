import Phaser from 'phaser';
import { TOWERS } from '../config/towers.js';

const PX = 1040;
const PW = 240;

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
    this.selectedType = null;
    this.buttons = {};
  }

  create() {
    this.selectedType = null;
    this.buttons = {};

    this.drawPanel();
    this.createStats();
    this.createTowerButtons();

    this.game.events.on('statsUpdate', this.onStats, this);
    this.game.events.on('waveStart', this.onWaveStart, this);
    this.game.events.on('waveComplete', this.onWaveComplete, this);
    this.game.events.on('gameOver', this.onGameOver, this);
  }

  drawPanel() {
    const g = this.add.graphics();
    g.fillStyle(0x080820);
    g.fillRect(PX, 0, PW, 720);
    g.lineStyle(2, 0x0066ff, 0.6);
    g.beginPath(); g.moveTo(PX, 0); g.lineTo(PX, 720); g.strokePath();
  }

  createStats() {
    const x = PX + 14;
    const mono = (size, color = '#00ccff') => ({ fontFamily: 'monospace', fontSize: `${size}px`, color });

    this.add.text(x, 10, 'NEXUS DEFENSE', mono(15, '#ffffff')).setFontStyle('bold');
    this.add.text(x, 28, '─'.repeat(20), mono(10, '#003377'));

    this.livesText    = this.add.text(x, 40,  '♥ Lives: 20',      mono(13));
    this.creditsText  = this.add.text(x, 56,  '◈ Credits: 150',   mono(13));
    this.scoreText    = this.add.text(x, 72,  '★ Score: 0',       mono(13));
    this.waveText     = this.add.text(x, 88,  'Wave: 0 / 8',      mono(13));
    this.countdownText = this.add.text(x, 104, 'First wave in: 5s', mono(11, '#ffaa00'));

    this.add.text(x, 120, '─'.repeat(20), mono(10, '#003377'));
    this.add.text(x, 133, 'TOWERS', mono(11, '#6666cc'));
  }

  createTowerButtons() {
    const x = PX + 10;
    let y = 148;
    const BTN_H = 38;
    const BTN_STEP = 44;

    for (const [key, def] of Object.entries(TOWERS)) {
      const btn = this.add.graphics();
      const label = this.add.text(x + 28, y + 4, '', { fontFamily: 'monospace', fontSize: '11px', color: '#aabbcc' });
      this.buttons[key] = { btn, label, y, def, key };
      this.drawButton(key, false);

      const zone = this.add.zone(x, y, PW - 20, BTN_H).setOrigin(0).setInteractive();
      zone.on('pointerdown', () => this.selectTower(key));
      zone.on('pointerover', () => { if (this.selectedType !== key) this.drawButton(key, true); });
      zone.on('pointerout',  () => { if (this.selectedType !== key) this.drawButton(key, false); });

      y += BTN_STEP;
    }

    y += 4;
    this.add.text(x + 4, y, '[Cancel Selection]', { fontFamily: 'monospace', fontSize: '11px', color: '#556677' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.selectTower(null))
      .on('pointerover', function() { this.setColor('#aabbcc'); })
      .on('pointerout',  function() { this.setColor('#556677'); });

    y += 26;
    this.add.text(x + 4, y, '[Launch Wave Now]', { fontFamily: 'monospace', fontSize: '11px', color: '#ff9900' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        const gs = this.scene.get('GameScene');
        if (!gs.waveActive && gs.waveIndex < 8) gs.nextWaveCountdown = 0;
      })
      .on('pointerover', function() { this.setColor('#ffcc44'); })
      .on('pointerout',  function() { this.setColor('#ff9900'); });
  }

  drawButton(key, hover) {
    const { btn, label, y, def } = this.buttons[key];
    const x = PX + 10;
    const w = PW - 20;
    const BTN_H = 38;
    const selected = this.selectedType === key;

    btn.clear();
    btn.fillStyle(selected ? 0x112244 : hover ? 0x0b1428 : 0x060614);
    btn.fillRect(x, y, w, BTN_H);
    btn.lineStyle(selected ? 2 : 1, selected ? def.color : hover ? 0x334455 : 0x1a2233);
    btn.strokeRect(x, y, w, BTN_H);

    btn.fillStyle(def.color);
    btn.fillCircle(x + 14, y + BTN_H / 2, 9);
    btn.fillStyle(0xffffff, 0.5);
    btn.fillCircle(x + 11, y + BTN_H / 2 - 3, 3);

    label.setPosition(x + 28, y + 4);
    label.setText(`${def.name}  ${def.cost}◈\n${def.description}`);
    label.setColor(selected ? '#ffffff' : '#aabbcc');
  }

  selectTower(type) {
    const prev = this.selectedType;
    this.selectedType = type;
    if (prev && this.buttons[prev]) this.drawButton(prev, false);
    if (type && this.buttons[type]) this.drawButton(type, false);
    this.scene.get('GameScene').selectedTowerType = type;
  }

  onStats(data) {
    this.livesText.setText(`♥ Lives: ${data.lives}`);
    this.creditsText.setText(`◈ Credits: ${data.credits}`);
    this.scoreText.setText(`★ Score: ${data.score}`);
    this.waveText.setText(`Wave: ${data.wave} / ${data.totalWaves}`);

    if (data.waveActive) {
      this.countdownText.setText('Wave in progress...').setColor('#ff6600');
    } else if (data.wave < data.totalWaves) {
      this.countdownText.setText(`Next wave in: ${data.countdown}s`).setColor('#ffaa00');
    } else {
      this.countdownText.setText('All waves complete!').setColor('#888888');
    }
  }

  onWaveStart(waveNum) {
    this.flash(`WAVE ${waveNum}`, 0xff6600);
  }

  onWaveComplete(waveNum) {
    if (waveNum < 8) this.flash('+50◈  Wave Clear!', 0x00ff88);
  }

  onGameOver({ won, score }) {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, 1280, 720);

    this.add.text(640, 290, won ? 'VICTORY' : 'DEFEATED', {
      fontFamily: 'monospace', fontSize: '72px',
      color: won ? '#00ff88' : '#ff2222',
      fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(640, 385, `Final Score: ${score}`, {
      fontFamily: 'monospace', fontSize: '28px', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(640, 432, 'Refresh to play again', {
      fontFamily: 'monospace', fontSize: '17px', color: '#666688',
    }).setOrigin(0.5);
  }

  flash(msg, color) {
    const hex = `#${color.toString(16).padStart(6, '0')}`;
    const txt = this.add.text(520, 360, msg, {
      fontFamily: 'monospace', fontSize: '34px', color: hex,
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: txt, alpha: 0, y: 300, duration: 2000, ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }
}
