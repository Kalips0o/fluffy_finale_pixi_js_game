import * as PIXI from 'pixi.js';
import { setupApp } from './appSetup';
import { SceneManager } from './sceneManager';
import { loadAssets } from './assetLoader';
import { ScreenSizeManager } from './screenSizeManager';

// Инициализация приложения
const app = setupApp();

// Глобальная переменная для доступа к sceneManager из консоли
let sceneManager;
let screenSizeManager;

// Инициализируем менеджер размера экрана
screenSizeManager = new ScreenSizeManager();

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
    
    // Добавляем глобальную функцию для изменения минимального размера экрана
    window.setMinScreenSize = (width, height) => {
        if (screenSizeManager) {
            screenSizeManager.setMinSize(width, height);
            console.log(`Минимальный размер экрана изменен на ${width}x${height}`);
        } else {
            console.error('ScreenSizeManager не найден');
        }
    };
    
    // Добавляем глобальную функцию для управления мобильным режимом
    window.setMobileMode = (enabled) => {
        if (screenSizeManager) {
            screenSizeManager.setMobileMode(enabled);
            console.log(`Мобильный режим ${enabled ? 'включен' : 'выключен'}`);
        } else {
            console.error('ScreenSizeManager не найден');
        }
    };
    
    // Обработчик изменения размера окна (перенесен в SceneManager)
    // window.addEventListener('resize', () => {
    //     sceneManager.drawScene();
    // });
});
