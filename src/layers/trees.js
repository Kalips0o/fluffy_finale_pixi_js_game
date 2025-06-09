import * as PIXI from 'pixi.js';

export class Trees {
    constructor(app, resources) {
        this.app = app;
        this.resources = resources;
        this.sprites = {
            trunks: [],
            crowns: []
        };
    }

    draw(container) {
        this.drawCrowns(container);
    }

    drawTrunks(grassY, container) {
        const trunk1 = this.resources.textures['tree_trunk_1.png'];
        const trunk2 = this.resources.textures['tree_trunk_2.png'];

        if (!trunk1 || !trunk2) return;

        // Создаем несколько деревьев для бесконечной прокрутки
        const positions = [
            { x: this.app.screen.width * 0.3, y: grassY + 150, scale: 1.0 },
            { x: this.app.screen.width * 0.7, y: grassY + 140, scale: 1.2 },
            { x: this.app.screen.width * 1.3, y: grassY + 145, scale: 1.0 },
            { x: this.app.screen.width * 1.7, y: grassY + 155, scale: 1.2 }
        ];

        positions.forEach((pos, index) => {
            const texture = index % 2 === 0 ? trunk1 : trunk2;
            const trunk = new PIXI.Sprite(texture);
            trunk.x = Math.round(pos.x);
            trunk.y = Math.round(pos.y);
            trunk.anchor.set(0.5, 1);
            trunk.scale.set(pos.scale);
            container.addChild(trunk);
            this.sprites.trunks.push(trunk);
        });
    }

    drawCrowns(container) {
        const texture = this.resources.textures['tree crowns.png'];
        if (!texture) return;

        const tileWidth = Math.ceil(texture.width);
        const overlap = 10;
        const numTiles = Math.ceil(this.app.screen.width / (tileWidth - overlap)) + 2;

        for (let i = 0; i < numTiles; i++) {
            const crowns = new PIXI.Sprite(texture);
            crowns.x = Math.round(i * (tileWidth - overlap));
            crowns.y = 0;
            crowns.anchor.set(0, 0);
            container.addChild(crowns);
            this.sprites.crowns.push(crowns);
        }
    }

    updatePosition(camera) {
        const worldX = camera.currentX;

        // Обновляем позиции крон
        this.sprites.crowns.forEach((sprite, index) => {
            const tileWidth = sprite.width;
            const overlap = 10;
            const startIndex = Math.floor(worldX / (tileWidth - overlap));
            sprite.x = Math.round((startIndex + index) * (tileWidth - overlap));
        });

        // Проверяем и обновляем позиции стволов
        this.checkAndUpdateTrunks(worldX);
    }

    checkAndUpdateTrunks(worldX) {
        const screenWidth = this.app.screen.width;
        const currentScreenIndex = Math.floor(worldX / screenWidth);

        // Проверяем каждый ствол
        this.sprites.trunks.forEach((sprite, index) => {
            const trunkScreenIndex = Math.floor(sprite.x / screenWidth);
            
            // Если ствол находится на экране, который мы уже прошли
            if (trunkScreenIndex < currentScreenIndex) {
                // Перемещаем его на два экрана вперед
                const newScreenIndex = currentScreenIndex + 1;
                const baseX = (index % 2 === 0 ? 0.3 : 0.7) * screenWidth;
                sprite.x = newScreenIndex * screenWidth + baseX;
            }
            // Если ствол находится на экране, который мы еще не достигли
            else if (trunkScreenIndex > currentScreenIndex + 1) {
                // Перемещаем его на текущий экран
                const baseX = (index % 2 === 0 ? 0.3 : 0.7) * screenWidth;
                sprite.x = currentScreenIndex * screenWidth + baseX;
            }
        });
    }
}
