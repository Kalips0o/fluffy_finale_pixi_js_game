import * as PIXI from 'pixi.js';

export class RabbitEffects {
    constructor(rabbit, resources) {
        this.rabbit = rabbit;
        this.resources = resources;
        this.bloodEffect = null;
    }

    setup() {
        this.createBloodEffect();
    }

    createBloodEffect() {
        this.bloodEffect = new PIXI.Sprite(this.resources.textures['bunny_hits_4.png']);
        this.bloodEffect.anchor.set(0.5);
        this.bloodEffect.scale.set(0.15);
        this.bloodEffect.visible = false;
        this.rabbit.app.stage.addChild(this.bloodEffect);
    }

    showBlood() {
        this.bloodEffect.x = this.rabbit.sprite.x;
        this.bloodEffect.y = this.rabbit.sprite.y + this.rabbit.sprite.height/2;
        this.bloodEffect.scale.x = Math.abs(this.bloodEffect.scale.x) * this.rabbit.direction;
        this.bloodEffect.scale.set(0.12);
        this.bloodEffect.visible = true;

        setTimeout(() => {
            this.bloodEffect.visible = false;
        }, 500);
    }

    update() {
        // Можно добавить обновление других эффектов
    }
}
