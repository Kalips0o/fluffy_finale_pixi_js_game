import * as PIXI from 'pixi.js';
export class Garlands {
    constructor(app, resources, isBackLayer) {
        this.app = app;
        this.resources = resources;
        this.isBackLayer = isBackLayer;
        this.garlandTypes = [
            'garland_spider_1.png',
            'garland_spider_long_1.png',
            'garland_spider_long_2.png',
            'garland_spider_3.png',
            'garland_star_1.png',
            'garland_star_long_1.png',
            'garland_star_long_2.png',
            'garland_star_2.png'
        ];
    }

    draw() {
        const container = new PIXI.Container();
        const numGarlands = 8;
        const baseScale = 0.12;

        for (let i = 0; i < numGarlands; i++) {
            const type = this.garlandTypes[Math.floor(Math.random() * this.garlandTypes.length)];
            const texture = this.resources.textures[type];
            if (!texture) continue;

            const garland = this.createGarland(texture, type, baseScale);
            container.addChild(garland);
        }

        this.app.stage.addChild(container);
    }

    createGarland(texture, type, baseScale) {
        const garland = new PIXI.Sprite(texture);

        const x = Math.random() * this.app.screen.width;
        let y, scale;

        if (this.isBackLayer) {
            y = 40 + Math.random() * 80;
            scale = baseScale * 0.98;
        } else {
            y = -60 + Math.random() * 80;
            scale = baseScale;
        }

        garland.x = Math.round(x);
        garland.y = y;
        garland.anchor.set(0.5, -0.2);
        garland.scale.set(scale);

        return garland;
    }
}
