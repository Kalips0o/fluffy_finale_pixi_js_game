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

        // Calculate minimum spacing between garlands (30% of screen width)
        const minSpacing = this.app.screen.width * 0.3;
        
        // Try to find a position that's not too close to existing garlands
        let x, attempts = 0;
        do {
            x = baseX + Math.random() * this.app.screen.width;
            attempts++;
        } while (this.isTooCloseToOtherGarlands(x) && attempts < 10);

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

    isTooCloseToOtherGarlands(x) {
        const minSpacing = this.app.screen.width * 0.3;
        return this.sprites.some(sprite => Math.abs(sprite.x - x) < minSpacing);
    }

    updatePosition(camera) {
        const worldX = camera.currentX;
        const screenWidth = this.app.screen.width;

        // Проверяем и обновляем позиции гирлянд
        this.checkAndUpdateGarlands(worldX, screenWidth);
    }

    checkAndUpdateGarlands(worldX, screenWidth) {
        // Determine current screen index
        const currentScreenIndex = Math.floor(worldX / screenWidth);
        
        // Check each garland
        this.sprites.forEach((sprite, index) => {
            const garlandScreenIndex = Math.floor(sprite.x / screenWidth);
            
            // If garland is on a screen we've passed
            if (garlandScreenIndex < currentScreenIndex) {
                // Move it two screens ahead with better spacing
                const newScreenIndex = currentScreenIndex + 1;
                const baseX = newScreenIndex * screenWidth;
                const spacing = screenWidth / 4; // Divide screen into 4 sections
                const section = index % 4;
                sprite.x = baseX + (section * spacing) + (Math.random() * spacing * 0.5);
            }
            // If garland is on a screen we haven't reached yet
            else if (garlandScreenIndex > currentScreenIndex + 1) {
                // Move it to current screen with better spacing
                const baseX = currentScreenIndex * screenWidth;
                const spacing = screenWidth / 4;
                const section = index % 4;
                sprite.x = baseX + (section * spacing) + (Math.random() * spacing * 0.5);
            }
        });
    }
}
