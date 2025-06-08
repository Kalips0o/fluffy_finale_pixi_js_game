import * as PIXI from 'pixi.js';

export function setupApp() {
    const app = new PIXI.Application({
        resizeTo: window,
        backgroundColor: 0x222233,
    });

    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.appendChild(app.view);

    return app;
}
