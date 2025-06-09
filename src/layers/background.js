import * as PIXI from 'pixi.js';
export class Background {
    constructor(app, resources) {
        this.app = app;
        this.resources = resources;
        this.sprites = [];
    }

    draw(container) {
        const bgTexture = this.resources.textures['bg.png'];
        if (!bgTexture) return;

        const tileWidth = Math.ceil(bgTexture.width);
        const overlap = 5;
        const numTiles = Math.ceil(this.app.screen.width / (tileWidth - overlap)) + 2;

        for (let i = 0; i < numTiles; i++) {
            const bg = new PIXI.Sprite(bgTexture);
            bg.anchor.set(0, 0);
            bg.width = this.app.screen.width;
            bg.height = this.app.screen.height;
            bg.x = Math.round(i * (tileWidth - overlap));
            container.addChild(bg);
            this.sprites.push(bg);
        }
    }

    updatePosition(camera) {
        const worldX = camera.currentX;

        // Обновляем позиции всех тайлов
        this.sprites.forEach((sprite, index) => {
            const tileWidth = sprite.width;
            const overlap = 5;
            const startIndex = Math.floor(worldX / (tileWidth - overlap));
            sprite.x = Math.round((startIndex + index) * (tileWidth - overlap));
        });
    }
}
