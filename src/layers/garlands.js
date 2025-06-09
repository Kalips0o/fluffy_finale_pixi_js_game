import * as PIXI from 'pixi.js';
export class Garlands {
    constructor(app, resources, isBackLayer) {
        this.app = app;
        this.resources = resources;
        this.isBackLayer = isBackLayer;
        this.sprites = [];
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

    draw(container) {
        const numGarlands = 8;
        const baseScale = 0.12;
        const screenWidth = this.app.screen.width;

        // Создаем гирлянды для двух экранов
        for (let screen = 0; screen < 2; screen++) {
            for (let i = 0; i < numGarlands; i++) {
                const type = this.garlandTypes[Math.floor(Math.random() * this.garlandTypes.length)];
                const texture = this.resources.textures[type];
                if (!texture) continue;

                const garland = this.createGarland(texture, type, baseScale, screen * screenWidth);
                container.addChild(garland);
                this.sprites.push(garland);
            }
        }
    }

    createGarland(texture, type, baseScale, baseX) {
        const garland = new PIXI.Sprite(texture);

        const x = baseX + Math.random() * this.app.screen.width;
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

    updatePosition(camera) {
        const worldX = camera.currentX;
        const screenWidth = this.app.screen.width;

        // Обновляем позиции всех гирлянд
        this.sprites.forEach((sprite, index) => {
            const tileWidth = screenWidth;
            const overlap = 0;
            const startIndex = Math.floor(worldX / (tileWidth - overlap));
            sprite.x = Math.round((startIndex + index) * (tileWidth - overlap));
        });
    }
}
