import * as PIXI from 'pixi.js';
export class Foliage {
    constructor(app, resources, textureName) {
        this.app = app;
        this.resources = resources;
        this.textureName = textureName;
        this.sprites = [];
    }

    draw(container) {
        const texture = this.resources.textures[this.textureName];
        if (!texture) return;

        const desiredHeight = this.textureName === 'violet_foliage.png' ? 270 : null;
        const scale = desiredHeight ? desiredHeight / texture.height : 1;
        const tileWidth = Math.ceil(texture.width * scale);
        const overlap = 5;
        const numTiles = Math.ceil(this.app.screen.width / (tileWidth - overlap)) + 1;

        for (let i = 0; i < numTiles; i++) {
            const foliage = new PIXI.Sprite(texture);
            foliage.x = i * (tileWidth - overlap);
            foliage.y = 0;
            foliage.anchor.set(0, 0);
            foliage.scale.set(scale);
            container.addChild(foliage);
            this.sprites.push(foliage);
        }
    }

    updatePosition(camera) {
        const worldX = camera.currentX;
        const screenWidth = this.app.screen.width;

        this.sprites.forEach((sprite, index) => {
            const tileWidth = sprite.width;
            const overlap = 5;
            const baseX = index * (tileWidth - overlap);
            const offset = Math.floor(worldX / (tileWidth - overlap)) * (tileWidth - overlap);
            sprite.x = baseX - offset;
        });
    }
}
