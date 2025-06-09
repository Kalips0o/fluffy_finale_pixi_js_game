import * as PIXI from 'pixi.js';
import { Trees } from './trees';

export class Ground {
    constructor(app, resources) {
        this.app = app;
        this.resources = resources;
        this.trees = new Trees(app, resources);
        this.soilSprites = [];
        this.grassSprites = [];
        this.lavaGrassSprites = [];
        this.rabbit = null;
    }

    setRabbit(rabbit) {
        this.rabbit = rabbit;
    }

    draw(container) {
        const soilTexture = this.resources.textures['soil.png'];
        const grassTexture = this.resources.textures['grass.png'];
        const lavaGrassTexture = this.resources.textures['grass_lava.png'];

        if (!soilTexture || !grassTexture) return;

        this.drawGrass(grassTexture, container);
        // Рисуем стволы между слоями травы
        const grassY = this.getGrassY();
        this.trees.drawTrunks(grassY, container);
        this.drawLavaGrass(lavaGrassTexture, container);
        this.drawSoil(soilTexture, container);
    }

    getGrassY() {
        const desiredSoilHeight = 130;
        const soilScale = desiredSoilHeight / this.resources.textures['soil.png'].height;
        const soilY = Math.round(this.app.screen.height - desiredSoilHeight);
        return soilY + desiredSoilHeight - Math.floor(this.resources.textures['grass.png'].height * 1.3);
    }

    drawGrass(texture, container) {
        const grassY = this.getGrassY();
        const tileWidth = Math.ceil(texture.width);
        const overlap = 5;
        const numTiles = Math.ceil(this.app.screen.width / (tileWidth - overlap)) + 2;

        for (let i = 0; i < numTiles; i++) {
            const grass = new PIXI.Sprite(texture);
            grass.x = Math.round(i * (tileWidth - overlap));
            grass.y = grassY;
            grass.anchor.set(0, 0);
            container.addChild(grass);
            this.grassSprites.push(grass);
        }
    }

    drawLavaGrass(texture, container) {
        if (!texture) return;

        const desiredSoilHeight = 130;
        const soilScale = desiredSoilHeight / this.resources.textures['soil.png'].height;
        const soilY = Math.round(this.app.screen.height - desiredSoilHeight);
        const lavaGrassY = soilY + desiredSoilHeight - Math.floor(texture.height * 1);

        const tileWidth = Math.ceil(texture.width);
        const overlap = 10;
        const numTiles = Math.ceil(this.app.screen.width / (tileWidth - overlap)) + 2;

        for (let i = 0; i < numTiles; i++) {
            const lavaGrass = new PIXI.Sprite(texture);
            lavaGrass.x = Math.round(i * (tileWidth - overlap));
            lavaGrass.y = lavaGrassY;
            lavaGrass.anchor.set(0, 0);
            container.addChild(lavaGrass);
            this.lavaGrassSprites.push(lavaGrass);
        }
    }

    drawSoil(texture, container) {
        const desiredHeight = 130;
        const scale = desiredHeight / texture.height;
        const y = Math.round(this.app.screen.height - desiredHeight);
        const tileWidth = Math.round(texture.width * scale);
        const overlap = 10;
        const numTiles = Math.ceil(this.app.screen.width / (tileWidth - overlap)) + 2;

        for (let i = 0; i < numTiles; i++) {
            const soil = new PIXI.Sprite(texture);
            soil.x = Math.round(i * (tileWidth - overlap));
            soil.y = y;
            soil.anchor.set(0, 0);
            soil.scale.set(scale);
            container.addChild(soil);
            this.soilSprites.push(soil);
        }
    }

    updatePosition(camera) {
        const worldX = camera.currentX;

        // Обновляем позиции всех тайлов
        this.soilSprites.forEach((sprite, index) => {
            const tileWidth = sprite.width;
            const overlap = 10;
            const startIndex = Math.floor(worldX / (tileWidth - overlap));
            sprite.x = Math.round((startIndex + index) * (tileWidth - overlap));
        });

        this.grassSprites.forEach((sprite, index) => {
            const tileWidth = sprite.width;
            const overlap = 5;
            const startIndex = Math.floor(worldX / (tileWidth - overlap));
            sprite.x = Math.round((startIndex + index) * (tileWidth - overlap));
        });

        this.lavaGrassSprites.forEach((sprite, index) => {
            const tileWidth = sprite.width;
            const overlap = 10;
            const startIndex = Math.floor(worldX / (tileWidth - overlap));
            sprite.x = Math.round((startIndex + index) * (tileWidth - overlap));
        });

        // Обновляем позиции деревьев
        if (this.trees.updatePosition) {
            this.trees.updatePosition(camera);
        }
    }
}
