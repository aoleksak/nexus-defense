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
    this.selectedTower = null;

    this.drawPanel();
    this.createStats();
    this.createTowerButtons();
    this.createUpgradePanel();

    this.game.events.on('statsUpdate', this.onStats, this);
    this.game.events.on('waveStart', this.onWaveStart, this);
    this.game.events.on('waveComplete', this.onWaveComplete, this);
    this.game.events.on('gameOver', this.onGameOver, this);
    this.game.events.on('towerSelect', this.onTowerSelect, this);
  }

  drawPanel() {
    const g = this.add.graphics();
    g.fillStyle(0x100a04);
    g.fillRect(PX, 0, PW, 720);
    g.lineStyle(2, 0xaa7722, 0.6);
    g.beginPath(); g.moveTo(PX, 0); g.lineTo(PX, 720); g.strokePath();
  }

  createStats() {
    const x = PX + 14;
    const mono = (size, color = '#d4a843') => ({ fontFamily: 'monospace', fontSize: `${size}px`, color });

    this.add.text(x, 10, "TRAIL'S END", mono(15, '#f5e6c8')).setFontStyle('bold');
    this.add.text(x, 28, '─'.repeat(20), mono(10, '#3d2005'));

    this.livesText    = this.add.text(x, 40,  '♥ Settlers: 20',    mono(13));
    this.creditsText  = this.add.text(x, 56,  '$ Provisions: 150', mono(13));
    this.scoreText    = this.add.text(x, 72,  '★ Miles: 0',        mono(13));
    this.waveText     = this.add.text(x, 88,  'Day: 0 / 8',        mono(13));
    this.countdownText = this.add.text(x, 104, 'Raiders attack in: 5s', mono(11, '#ffaa00'));

    this.add.text(x, 120, '─'.repeat(20), mono(10, '#3d2005'));
    this.add.text(x, 133, 'DEFENSES', mono(11, '#aa7733'));
  }

  createTowerButtons() {
    const x = PX + 10;
    let y = 148;
    const BTN_H = 38;
    const BTN_STEP = 44;

    for (const [key, def] of Object.entries(TOWERS)) {
      const btn = this.add.graphics();
      const label = this.add.text(x + 28, y + 4, '', { fontFamily: 'monospace', fontSize: '11px', color: '#c8aa77' });
      this.buttons[key] = { btn, label, y, def, key };
      this.drawButton(key, false);

      const zone = this.add.zone(x, y, PW - 20, BTN_H).setOrigin(0).setInteractive();
      zone.on('pointerdown', () => this.selectTower(key));
      zone.on('pointerover', () => { if (this.selectedType !== key) this.drawButton(key, true); });
      zone.on('pointerout',  () => { if (this.selectedType !== key) this.drawButton(key, false); });

      y += BTN_STEP;
    }

    y += 4;
    this.add.text(x + 4, y, '[Cancel Selection]', { fontFamily: 'monospace', fontSize: '11px', color: '#7a6040' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.selectTower(null))
      .on('pointerover', function() { this.setColor('#c8aa77'); })
      .on('pointerout',  function() { this.setColor('#7a6040'); });

    y += 26;
    this.add.text(x + 4, y, '[Send Raiders Now]', { fontFamily: 'monospace', fontSize: '11px', color: '#cc6600' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        const gs = this.scene.get('GameScene');
        if (!gs.waveActive && gs.waveIndex < 8) gs.nextWaveCountdown = 0;
      })
      .on('pointerover', function() { this.setColor('#ffaa33'); })
      .on('pointerout',  function() { this.setColor('#cc6600'); });
  }

  drawButton(key, hover) {
    const { btn, label, y, def } = this.buttons[key];
    const x = PX + 10;
    const w = PW - 20;
    const BTN_H = 38;
    const selected = this.selectedType === key;

    btn.clear();
    btn.fillStyle(selected ? 0x2a1a08 : hover ? 0x1c1005 : 0x130c03);
    btn.fillRect(x, y, w, BTN_H);
    btn.lineStyle(selected ? 2 : 1, selected ? def.color : hover ? 0x5a3a18 : 0x2e1c08);
    btn.strokeRect(x, y, w, BTN_H);

    btn.fillStyle(def.color);
    btn.fillCircle(x + 14, y + BTN_H / 2, 9);
    btn.fillStyle(0xffffff, 0.5);
    btn.fillCircle(x + 11, y + BTN_H / 2 - 3, 3);

    label.setPosition(x + 28, y + 4);
    label.setText(`${def.name}  $${def.cost}\n${def.description}`);
    label.setColor(selected ? '#f5e6c8' : '#c8aa77');
  }

  selectTower(type) {
    const prev = this.selectedType;
    this.selectedType = type;
    if (prev && this.buttons[prev]) this.drawButton(prev, false);
    if (type && this.buttons[type]) this.drawButton(type, false);
    this.scene.get('GameScene').selectedTowerType = type;
  }

  onStats(data) {
    this.livesText.setText(`♥ Settlers: ${data.lives}`);
    this.creditsText.setText(`$ Provisions: ${data.credits}`);
    this.scoreText.setText(`★ Miles: ${data.score}`);
    this.waveText.setText(`Day: ${data.wave} / ${data.totalWaves}`);

    if (data.waveActive) {
      this.countdownText.setText('Raid in progress...').setColor('#ff6600');
    } else if (data.wave < data.totalWaves) {
      this.countdownText.setText(`Raiders attack in: ${data.countdown}s`).setColor('#ffaa00');
    } else {
      this.countdownText.setText('Trail cleared!').setColor('#888877');
    }
  }

  onWaveStart(waveNum) {
    this.flash(`RAID ${waveNum}`, 0xff6600);
  }

  onWaveComplete(waveNum) {
    if (waveNum < 8) this.flash('+50$  Raid Repelled!', 0x88dd44);
  }

  onGameOver({ won, score }) {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, 1280, 720);

    this.add.text(640, 290, won ? 'TRAIL BLAZED!' : 'WAGON LOST', {
      fontFamily: 'monospace', fontSize: '60px',
      color: won ? '#d4a843' : '#cc3322',
      fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(640, 385, `Miles Traveled: ${score}`, {
      fontFamily: 'monospace', fontSize: '28px', color: '#f5e6c8',
    }).setOrigin(0.5);

    this.add.text(640, 432, 'Refresh to play again', {
      fontFamily: 'monospace', fontSize: '17px', color: '#7a6040',
    }).setOrigin(0.5);
  }

  createUpgradePanel() {
    const D = 20;
    const mono = (size, color) => ({ fontFamily: 'monospace', fontSize: `${size}px`, color });

    this.popupBg       = this.add.graphics().setDepth(D);
    this.popupTitle    = this.add.text(0, 0, '', mono(12, '#ffffff')).setDepth(D + 1).setFontStyle('bold');
    this.popupUpgrade  = this.add.text(0, 0, '', mono(11, '#ffaa00')).setDepth(D + 1);
    this.popupSell     = this.add.text(0, 0, '', mono(11, '#ff6655')).setDepth(D + 1);
    this.popupClose    = this.add.text(0, 0, '✕', mono(14, '#888899')).setDepth(D + 1);

    // Touch-friendly hit zones (36px tall each)
    this.popupUpgradeZone = this.add.zone(0, 0, 160, 36).setOrigin(0).setInteractive({ useHandCursor: true }).setDepth(D + 2);
    this.popupSellZone    = this.add.zone(0, 0, 160, 36).setOrigin(0).setInteractive({ useHandCursor: true }).setDepth(D + 2);
    this.popupCloseZone   = this.add.zone(0, 0, 36,  36).setOrigin(0).setInteractive({ useHandCursor: true }).setDepth(D + 2);

    this.popupUpgradeZone.on('pointerdown', () => this.doUpgrade());
    this.popupSellZone   .on('pointerdown', () => this.doSell());
    this.popupCloseZone  .on('pointerdown', () => this.hidePopup());

    this.popupUpgradeZone.on('pointerover', () => this.popupUpgrade.setColor('#ffcc44'));
    this.popupUpgradeZone.on('pointerout',  () => this.popupUpgrade.setColor('#ffaa00'));
    this.popupSellZone   .on('pointerover', () => this.popupSell.setColor('#ff9988'));
    this.popupSellZone   .on('pointerout',  () => this.popupSell.setColor('#ff6655'));
    this.popupCloseZone  .on('pointerover', () => this.popupClose.setColor('#ddddee'));
    this.popupCloseZone  .on('pointerout',  () => this.popupClose.setColor('#888899'));

    this.hidePopup();
  }

  showPopup(tower) {
    const W = 172, H = 100;
    let px = tower.x + 26;
    let py = tower.y - H - 10;
    if (px + W > 1030) px = tower.x - W - 26;
    if (py < 4) py = tower.y + 32;
    if (py + H > 716) py = 716 - H;

    const tiers = ['', 'Mk I', 'Mk II', 'Mk III'];
    const cost = tower.upgradeCost();

    this.popupBg.clear();
    this.popupBg.fillStyle(0x1a0e04, 0.97);
    this.popupBg.fillRect(px, py, W, H);
    this.popupBg.lineStyle(2, tower.color, 0.9);
    this.popupBg.strokeRect(px, py, W, H);
    this.popupBg.lineStyle(1, tower.color, 0.25);
    this.popupBg.beginPath();
    this.popupBg.moveTo(px + 1, py + 28);
    this.popupBg.lineTo(px + W - 1, py + 28);
    this.popupBg.strokePath();
    this.popupBg.setVisible(true);

    this.popupTitle .setPosition(px + 10, py + 7) .setText(`${tower.def.name} ${tiers[tower.tier]}`).setVisible(true);
    this.popupClose .setPosition(px + W - 22, py + 5).setVisible(true);
    this.popupCloseZone.setPosition(px + W - 34, py).setVisible(true);

    const mkLabel = ['', 'II', 'III'][tower.tier];
    this.popupUpgrade
      .setPosition(px + 10, py + 38)
      .setText(cost ? `[Upgrade to Mk ${mkLabel}: $${cost}]` : '[Max Tier]')
      .setColor(cost ? '#ffaa00' : '#556677')
      .setVisible(true);
    this.popupUpgradeZone.setPosition(px + 4, py + 30).setVisible(true);

    this.popupSell
      .setPosition(px + 10, py + 64)
      .setText(`[Sell for +$${tower.sellValue()}]`)
      .setVisible(true);
    this.popupSellZone.setPosition(px + 4, py + 58).setVisible(true);
  }

  hidePopup() {
    this.popupBg.clear().setVisible(false);
    [this.popupTitle, this.popupUpgrade, this.popupSell, this.popupClose,
     this.popupUpgradeZone, this.popupSellZone, this.popupCloseZone]
      .forEach(o => o.setVisible(false));
    this.selectedTower = null;
    const gs = this.scene.get('GameScene');
    if (gs) gs.selectedTower = null;
  }

  onTowerSelect(tower) {
    this.selectedTower = tower;
    if (!tower) { this.hidePopup(); return; }
    this.showPopup(tower);
  }

  doUpgrade() {
    if (!this.selectedTower) return;
    const cost = this.selectedTower.upgradeCost();
    if (!cost) return;
    const gs = this.scene.get('GameScene');
    if (gs.credits < cost) return;
    gs.credits -= cost;
    this.selectedTower.upgrade();
    gs.pushStats();
    this.showPopup(this.selectedTower);
  }

  doSell() {
    if (!this.selectedTower) return;
    const gs = this.scene.get('GameScene');
    gs.credits += this.selectedTower.sellValue();
    const idx = gs.towers.indexOf(this.selectedTower);
    if (idx >= 0) gs.towers.splice(idx, 1);
    this.selectedTower.destroy();
    this.hidePopup();
    gs.pushStats();
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
