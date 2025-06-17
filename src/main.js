import * as PIXI from 'pixi.js';
import { setupApp } from './appSetup';
import { SceneManager } from './sceneManager';
import { loadAssets } from './assetLoader';
import { ScreenSizeManager } from './screenSizeManager';
import { LoadingScreen } from './loadingScreen';

// Инициализация приложения
const app = setupApp();

// Глобальная переменная для доступа к sceneManager из консоли
let sceneManager;
let screenSizeManager;
let loadingScreen;

// Инициализируем менеджер размера экрана
screenSizeManager = new ScreenSizeManager();

// Обработчик изменения размера окна для загрузочного экрана
window.addEventListener('resize', () => {
    if (loadingScreen && loadingScreen.isVisible) {
        loadingScreen.resize();
    }
});

// Показываем загрузочный экран
loadingScreen = new LoadingScreen(app);
loadingScreen.show().then(() => {
    // После показа загрузочного экрана начинаем загрузку ресурсов
    return loadAssets();
}).then((resources) => {
    // Минимальное время показа загрузочного экрана (2 секунды для прохождения всех 4 стадий)
    const minLoadingTime = 2000;
    const loadingStartTime = Date.now();
    
    return new Promise((resolve) => {
        const checkTime = () => {
            const elapsedTime = Date.now() - loadingStartTime;
            if (elapsedTime >= minLoadingTime) {
                resolve(resources);
            } else {
                setTimeout(checkTime, 100);
            }
        };
        checkTime();
    });
}).then((resources) => {
    // Скрываем загрузочный экран
    loadingScreen.hide();
    
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
}).catch((error) => {
    console.error('Error during loading:', error);
    // Скрываем загрузочный экран в случае ошибки
    if (loadingScreen) {
        loadingScreen.hide();
    }
});
