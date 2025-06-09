import * as PIXI from 'pixi.js';
import { setupApp } from './appSetup';
import { SceneManager } from './sceneManager';
import { loadAssets } from './assetLoader';

// Инициализация приложения
const app = setupApp();

// Загрузка ассетов и создание сцены
loadAssets().then((resources) => {
    // Создаем менеджер сцены
    const sceneManager = new SceneManager(app, resources);
    
    // Обработчик изменения размера окна (перенесен в SceneManager)
    // window.addEventListener('resize', () => {
    //     sceneManager.drawScene();
    // });
});
