import * as PIXI from 'pixi.js';

export class DustAnimation {
    constructor(app, resources, worldContainer) {
        this.app = app;
        this.resources = resources;
        this.worldContainer = worldContainer;
        this.dustSprites = [];
    }

    createDustEffect(x, y, rotation) {
        const dustSprite = new PIXI.Sprite(this.resources.textures['dust_clouds.png']);
        dustSprite.anchor.set(0.5);
        dustSprite.x = x;
        dustSprite.y = y;
        dustSprite.rotation = rotation;
        dustSprite.scale.set(0.5);
        dustSprite.alpha = 0.6;

        this.worldContainer.addChild(dustSprite);
        this.dustSprites.push({
            sprite: dustSprite,
            startTime: Date.now(),
            duration: 800,
            startScale: 0.8,
            endScale: 2,
            startY: y,
            endY: y - 40
        });
    }

    update() {
        const currentTime = Date.now();

        for (let i = this.dustSprites.length - 1; i >= 0; i--) {
            const dust = this.dustSprites[i];
            const elapsed = currentTime - dust.startTime;
            const progress = Math.min(elapsed / dust.duration, 1);

            const scale = dust.startScale + (dust.endScale - dust.startScale) * progress;
            dust.sprite.scale.set(scale);

            const newY = dust.startY + (dust.endY - dust.startY) * progress;
            dust.sprite.y = newY;

            dust.sprite.alpha = 0.6 * (1 - progress);

            if (progress >= 1) {
                this.worldContainer.removeChild(dust.sprite);
                this.dustSprites.splice(i, 1);
            }
        }
    }
}
