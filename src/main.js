import * as PIXI from 'pixi.js';
import { setupApp } from './appSetup';
import { SceneManager } from './sceneManager';
import { loadAssets } from './assetLoader';

// Инициализация приложения
const app = setupApp();

// Загрузка ассетов и создание сцены
loadAssets().then((resources) => {
    const sceneManager = new SceneManager(app, resources);
    sceneManager.drawScene();

    window.addEventListener('resize', () => sceneManager.drawScene());
});
