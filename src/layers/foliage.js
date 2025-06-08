import * as PIXI from 'pixi.js';
export class Foliage {
    constructor(app, resources, textureName) {
        this.app = app;
        this.resources = resources;
        this.textureName = textureName;
    }

    draw() {
        const texture = this.resources.textures[this.textureName];
        if (!texture) return;

        const desiredHeight = this.textureName === 'violet_foliage.png' ? 270 : null;
        const scale = desiredHeight ? desiredHeight / texture.height : 1;
        const tileWidth = Math.ceil(texture.width * scale);
        const overlap = 5;

        let x = 0;
        const y = 0;

        while (x < this.app.screen.width + tileWidth) {
            const foliage = new PIXI.Sprite(texture);
            foliage.x = Math.round(x);
            foliage.y = y;
            foliage.anchor.set(0, 0);
            foliage.scale.set(scale);
            this.app.stage.addChild(foliage);
            x += tileWidth - overlap;
        }
    }
}
