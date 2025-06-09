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
            { x: this.app.screen.width * 0.3, y: grassY + 150 },
            { x: this.app.screen.width * 0.7, y: grassY + 140 },
            { x: this.app.screen.width * 1.3, y: grassY + 145 },
            { x: this.app.screen.width * 1.7, y: grassY + 155 }
        ];

        positions.forEach((pos, index) => {
            const texture = index % 2 === 0 ? trunk1 : trunk2;
            const trunk = new PIXI.Sprite(texture);
            trunk.x = Math.round(pos.x);
            trunk.y = Math.round(pos.y);
            trunk.anchor.set(0.5, 1);
            trunk.scale.set(1);
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

        // Обновляем позиции стволов
        this.sprites.trunks.forEach((sprite, index) => {
            const baseX = (index % 2 === 0 ? 0.3 : 0.7) * this.app.screen.width + Math.floor(index / 2) * this.app.screen.width;
            const offset = Math.floor(worldX / this.app.screen.width) * this.app.screen.width;
            sprite.x = baseX - offset;

            // Если ствол ушел за левую границу, перемещаем его вправо
            if (sprite.x < -sprite.width) {
                sprite.x += this.app.screen.width * 2;
            }
            // Если ствол ушел за правую границу, перемещаем его влево
            else if (sprite.x > this.app.screen.width) {
                sprite.x -= this.app.screen.width * 2;
            }
        });
    }
}
