import * as PIXI from 'pixi.js';
export class Background {
    constructor(app, resources) {
        this.app = app;
        this.resources = resources;
    }

    draw() {
        const bgTexture = this.resources.textures['bg.png'];
        if (!bgTexture) return;

        const bg = new PIXI.Sprite(bgTexture);
        bg.anchor.set(0, 0);
        bg.width = this.app.screen.width;
        bg.height = this.app.screen.height;
        this.app.stage.addChild(bg);
    }
}
