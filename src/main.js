import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#040410',
  scene: [GameScene, UIScene],
  parent: document.body,
});
