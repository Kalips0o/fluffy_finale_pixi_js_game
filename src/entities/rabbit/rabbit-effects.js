import * as PIXI from 'pixi.js';

export class RabbitEffects {
    constructor(rabbit, resources) {
        this.rabbit = rabbit;
        this.resources = resources;
        this.bloodEffect = null;
        this.isEffectActive = false;
        this.effectTimeout = null;
    }

    setup() {
        this.cleanup();
        this.createBloodEffect();
    }

    cleanup() {
        if (this.bloodEffect) {
            if (this.bloodEffect.parent) {
                this.bloodEffect.parent.removeChild(this.bloodEffect);
            }
            this.bloodEffect.destroy();
            this.bloodEffect = null;
        }
        if (this.effectTimeout) {
            clearTimeout(this.effectTimeout);
            this.effectTimeout = null;
        }
        this.isEffectActive = false;
    }

    createBloodEffect() {
        this.bloodEffect = new PIXI.Sprite(this.resources.textures['bunny_hits_4.png']);
        this.bloodEffect.anchor.set(0.5);
        this.bloodEffect.scale.set(0.15);
        this.bloodEffect.visible = false;
        this.rabbit.app.stage.addChild(this.bloodEffect);
    }

    showBlood() {
        if (this.isEffectActive) return;

        this.bloodEffect.x = this.rabbit.sprite.x;
        this.bloodEffect.y = this.rabbit.sprite.y + this.rabbit.sprite.height/2;
        this.bloodEffect.scale.x = Math.abs(this.bloodEffect.scale.x) * this.rabbit.direction;
        this.bloodEffect.scale.set(0.12);
        this.bloodEffect.visible = true;
        this.isEffectActive = true;

        if (this.effectTimeout) {
            clearTimeout(this.effectTimeout);
        }

        this.effectTimeout = setTimeout(() => {
            this.bloodEffect.visible = false;
            this.isEffectActive = false;
            this.effectTimeout = null;
        }, 500);
    }

    update() {
        if (this.bloodEffect && this.bloodEffect.visible) {
            this.bloodEffect.x = this.rabbit.sprite.x;
            this.bloodEffect.y = this.rabbit.sprite.y + this.rabbit.sprite.height/2;
        }
    }
}
