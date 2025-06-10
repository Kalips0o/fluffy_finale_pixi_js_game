import * as PIXI from 'pixi.js';

export class BloodSplatter {
    constructor(app, x, y, resources, worldContainer) {
        this.app = app;
        this.x = x;
        this.y = y;
        this.resources = resources;
        this.worldContainer = worldContainer;
        this.splatters = [];
        this.createSplatter();
    }

    createSplatter() {
        // Create pool of blood (added first to ensure it's at the back and part of the main splatters array)
        const poolOfBlood = new PIXI.Sprite(this.resources.textures['pool_of_blood.png']);
        poolOfBlood.anchor.set(0.5);
        poolOfBlood.scale.set(0.8, 0.4); // Smaller height, adjust as needed
        poolOfBlood.x = this.x;
        poolOfBlood.y = this.y + 110; // Adjusted to be on the ground, lowered by 5px
        poolOfBlood.alpha = 1;
        poolOfBlood.fadeSpeed = 0.0005; // Slow fade
        this.splatters.push(poolOfBlood); // Add to splatters array
        this.worldContainer.addChild(poolOfBlood);

        // Create central blood surge
        const centralSurge = new PIXI.Sprite(this.resources.textures['central_blood_surge.png']);
        centralSurge.anchor.set(0.5);
        centralSurge.scale.set(0.8);
        centralSurge.x = this.x;
        centralSurge.y = this.app.screen.height - 250;
        centralSurge.alpha = 1;
        centralSurge.fadeSpeed = 0.005;
        this.splatters.push(centralSurge);
        this.worldContainer.addChild(centralSurge);

        // Create blood under hammer
        const bloodUnderHammer = new PIXI.Sprite(this.resources.textures['blood_under_the_hammer.png']);
        bloodUnderHammer.anchor.set(0.5);
        bloodUnderHammer.scale.set(0.6);
        bloodUnderHammer.x = this.x;
        bloodUnderHammer.y = this.app.screen.height - 140;
        bloodUnderHammer.alpha = 1;
        bloodUnderHammer.fadeSpeed = 0.003;
        this.splatters.push(bloodUnderHammer);
        this.worldContainer.addChild(bloodUnderHammer);

        // Create blood splatters
        const numberOfSplatterParticles = 5; // Уменьшаем количество брызг
        for (let i = 0; i < numberOfSplatterParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            // Заменяем текстуру на drops_of_blood.png
            const splatter = new PIXI.Sprite(this.resources.textures['drops_of_blood.png']);
            splatter.anchor.set(0.5);
            splatter.scale.set(0.4 + Math.random() * 0.6);
            splatter.x = this.x;
            splatter.y = this.y;
            splatter.rotation = Math.random() * Math.PI * 2;

            splatter.vx = vx;
            splatter.vy = vy;
            splatter.alpha = 1;
            splatter.fadeSpeed = 0.002 + Math.random() * 0.003;

            this.splatters.push(splatter);
            this.worldContainer.addChild(splatter);
        }
    }

    update(delta) {
        // No longer handle pool of blood separately here
        // if (this.poolOfBloodSprite) {
        //     this.poolOfBloodSprite.alpha -= this.poolOfBloodSprite.fadeSpeed * delta;
        //     if (this.poolOfBloodSprite.alpha <= 0) {
        //         if (this.poolOfBloodSprite.parent) {
        //             this.worldContainer.removeChild(this.poolOfBloodSprite);
        //         }
        //         this.poolOfBloodSprite = null; // Clear reference
        //     }
        // }

        for (let i = this.splatters.length - 1; i >= 0; i--) {
            const splatter = this.splatters[i];

            // Apply movement only to splatter particles that have vx (velocity x)
            if (splatter.vx !== undefined) {
                splatter.x += splatter.vx * delta;
                splatter.y += splatter.vy * delta;
                splatter.vy += 0.02; // Gravity effect
            }

            splatter.alpha -= splatter.fadeSpeed * delta;

            if (splatter.alpha <= 0) {
                if (splatter.parent) {
                    this.worldContainer.removeChild(splatter);
                }
                this.splatters.splice(i, 1);
            }
        }
    }
}
