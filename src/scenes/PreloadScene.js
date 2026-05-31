import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    this.load.image('tile_dirt', 'assets/tile3.png');
    this.load.image('plant',     'assets/plant_1.png');
    this.load.image('basin',     'assets/basin.png');
  }

  create() {
    this.scene.start('GameScene');
  }
}
