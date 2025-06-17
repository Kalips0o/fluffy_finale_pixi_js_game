import * as PIXI from 'pixi.js';
import { setupApp } from './appSetup';
import { SceneManager } from './sceneManager';
import { loadAssets } from './assetLoader';

// Инициализация приложения
const app = setupApp();

// Глобальная переменная для доступа к sceneManager из консоли
let sceneManager;

// Загрузка ассетов и создание сцены
loadAssets().then((resources) => {
    // Создаем менеджер сцены
    sceneManager = new SceneManager(app, resources);
    
    // Добавляем глобальную функцию для сброса флага первого запуска
    window.resetFirstGameFlag = () => {
        if (sceneManager) {
            sceneManager.resetFirstGameFlag();
            console.log('Флаг первого запуска сброшен. Перезагрузите страницу для применения изменений.');
        } else {
            console.error('SceneManager не найден');
        }
    };
    
    // Обработчик изменения размера окна (перенесен в SceneManager)
    // window.addEventListener('resize', () => {
    //     sceneManager.drawScene();
    // });
});
