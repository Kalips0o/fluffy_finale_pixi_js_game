import * as PIXI from 'pixi.js';
import { Trees } from './trees';

export class Ground {
    constructor(app, resources) {
        this.app = app;
        this.resources = resources;
        this.trees = new Trees(app, resources);
    }

    draw() {
        const soilTexture = this.resources.textures['soil.png'];
        const grassTexture = this.resources.textures['grass.png'];
        const lavaGrassTexture = this.resources.textures['grass_lava.png'];

        if (!soilTexture || !grassTexture) return;

        this.drawGrass(grassTexture);
        // Рисуем стволы между слоями травы
        const grassY = this.getGrassY();
        this.trees.drawTrunks(grassY);
        this.drawLavaGrass(lavaGrassTexture);
        this.drawSoil(soilTexture);
    }

    getGrassY() {
        const desiredSoilHeight = 130;
        const soilScale = desiredSoilHeight / this.resources.textures['soil.png'].height;
        const soilY = Math.round(this.app.screen.height - desiredSoilHeight);
        return soilY + desiredSoilHeight - Math.floor(this.resources.textures['grass.png'].height * 1.3);
    }

    drawGrass(texture) {
        const grassY = this.getGrassY();
        let x = 0;
        const tileWidth = Math.ceil(texture.width);
        const overlap = 5;

        while (x < this.app.screen.width + tileWidth) {
            const grass = new PIXI.Sprite(texture);
            grass.x = Math.round(x);
            grass.y = grassY;
            grass.anchor.set(0, 0);
            this.app.stage.addChild(grass);
            x += tileWidth - overlap;
        }
    }

    drawLavaGrass(texture) {
        if (!texture) return;

        const desiredSoilHeight = 130;
        const soilScale = desiredSoilHeight / this.resources.textures['soil.png'].height;
        const soilY = Math.round(this.app.screen.height - desiredSoilHeight);
        const lavaGrassY = soilY + desiredSoilHeight - Math.floor(texture.height * 1);

        let x = 0;
        const tileWidth = Math.ceil(texture.width);
        const overlap = 10;

        while (x < this.app.screen.width + tileWidth) {
            const lavaGrass = new PIXI.Sprite(texture);
            lavaGrass.x = Math.round(x);
            lavaGrass.y = lavaGrassY;
            lavaGrass.anchor.set(0, 0);
            this.app.stage.addChild(lavaGrass);
            x += tileWidth - overlap;
        }
    }

    drawSoil(texture) {
        const desiredHeight = 130;
        const scale = desiredHeight / texture.height;
        const y = Math.round(this.app.screen.height - desiredHeight);

        let x = 0;
        const tileWidth = Math.round(texture.width * scale);
        const overlap = 10;

        while (x < this.app.screen.width + tileWidth) {
            const soil = new PIXI.Sprite(texture);
            soil.x = Math.round(x);
            soil.y = y;
            soil.anchor.set(0, 0);
            soil.scale.set(scale);
            this.app.stage.addChild(soil);
            x += tileWidth - overlap;
        }
    }
}
