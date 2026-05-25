import Phaser from 'phaser';
import { TOWERS } from '../config/towers.js';

const PX = 1040;  // panel x start
const PW = 240;   // panel width

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

    this.add.text(x, 12, 'NEXUS DEFENSE', mono(17, '#ffffff')).setFontStyle('bold');
    this.add.text(x, 34, '─'.repeat(20), mono(11, '#003377'));

    this.livesText    = this.add.text(x, 52,  '♥ Lives: 20',      mono(15));
    this.creditsText  = this.add.text(x, 74,  '◈ Credits: 150',   mono(15));
    this.scoreText    = this.add.text(x, 96,  '★ Score: 0',       mono(15));
    this.waveText     = this.add.text(x, 118, 'Wave: 0 / 8',      mono(15));
    this.countdownText = this.add.text(x, 140, 'First wave in: 5s', mono(13, '#ffaa00'));

    this.add.text(x, 162, '─'.repeat(20), mono(11, '#003377'));
    this.add.text(x, 178, 'TOWERS', mono(12, '#6666cc'));
  }

  createTowerButtons() {
    const x = PX + 10;
    let y = 196;

    for (const [key, def] of Object.entries(TOWERS)) {
      const btn = this.add.graphics();
      const label = this.add.text(x + 34, y + 5, '', { fontFamily: 'monospace', fontSize: '12px', color: '#aabbcc' });
      this.buttons[key] = { btn, label, y, def, key };
      this.drawButton(key, false);

      const zone = this.add.zone(x, y, PW - 20, 50).setOrigin(0).setInteractive();
      zone.on('pointerdown', () => this.selectTower(key));
      zone.on('pointerover', () => { if (this.selectedType !== key) this.drawButton(key, true); });
      zone.on('pointerout',  () => { if (this.selectedType !== key) this.drawButton(key, false); });

      y += 56;
    }

    // Cancel selection
    y += 4;
    this.add.text(x + 4, y, '[Cancel Selection]', { fontFamily: 'monospace', fontSize: '12px', color: '#556677' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.selectTower(null))
      .on('pointerover', function() { this.setColor('#aabbcc'); })
      .on('pointerout',  function() { this.setColor('#556677'); });

    // Launch wave early
    y += 28;
    this.add.text(x + 4, y, '[Launch Wave Now]', { fontFamily: 'monospace', fontSize: '12px', color: '#ff9900' })
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
    const selected = this.selectedType === key;

    btn.clear();
    btn.fillStyle(selected ? 0x112244 : hover ? 0x0b1428 : 0x060614);
    btn.fillRect(x, y, w, 50);
    btn.lineStyle(selected ? 2 : 1, selected ? def.color : hover ? 0x334455 : 0x1a2233);
    btn.strokeRect(x, y, w, 50);

    btn.fillStyle(def.color);
    btn.fillCircle(x + 17, y + 25, 11);
    btn.fillStyle(0xffffff, 0.5);
    btn.fillCircle(x + 13, y + 21, 4);

    label.setPosition(x + 34, y + 5);
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
