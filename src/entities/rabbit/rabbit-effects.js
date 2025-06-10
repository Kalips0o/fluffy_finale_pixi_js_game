import * as PIXI from 'pixi.js';

export class RabbitEffects {
    constructor(rabbit, resources) {
        this.rabbit = rabbit;
        this.resources = resources;
        this.hitboxGraphics = null;
    }

    setup() {
        // Create hitbox visualization
        this.hitboxGraphics = new PIXI.Graphics();
        this.hitboxGraphics.lineStyle(2, 0xFF0000, 1);
        this.rabbit.app.stage.addChild(this.hitboxGraphics);
    }

    showGroundHit() {
        // Просто показываем анимацию удара по земле
        this.rabbit.sprite.texture = this.resources.textures['bunny_hits_the_ground.png'];
    }

    update() {
        // Update hitbox visualization
        if (this.hitboxGraphics) {
            this.hitboxGraphics.clear();

            // Only show hitbox when hitting
            if (this.rabbit.physics.isHitting) {
                this.hitboxGraphics.lineStyle(2, 0xFF0000, 1);
                this.hitboxGraphics.drawRect(
                    this.rabbit.physics.hitArea.x,
                    this.rabbit.physics.hitArea.y,
                    this.rabbit.physics.hitArea.width,
                    this.rabbit.physics.hitArea.height
                );
            }
        }
    }
}
