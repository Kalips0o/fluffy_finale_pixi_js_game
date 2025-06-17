import * as PIXI from 'pixi.js';

export function setupApp() {
    const app = new PIXI.Application({
        resizeTo: window,
        backgroundColor: 0x333333,
    });

    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    
    // Добавляем PIXI приложение в game-container
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.appendChild(app.view);
    } else {
        // Fallback если game-container не найден
        document.body.appendChild(app.view);
    }

    return app;
}
