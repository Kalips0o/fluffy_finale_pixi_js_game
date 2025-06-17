import * as PIXI from 'pixi.js';

export class RabbitEffects {
    constructor(rabbit, resources) {
        this.rabbit = rabbit;
        this.resources = resources;
    }

    setup() {
        // Отладочная графика убрана
    }

    showGroundHit() {
        // Просто показываем анимацию удара по земле
        this.rabbit.sprite.texture = this.resources.textures['bunny_hits_the_ground.png'];
    }

    update() {
        // Отладочная графика убрана
    }
}
