import * as PIXI from 'pixi.js';
import { RabbitAnimations } from './rabbit-animations';
import { RabbitControls } from './rabbit-controls';
import { RabbitPhysics } from './rabbit-physics';
import { RabbitEffects } from './rabbit-effects';

export class Rabbit {
    constructor(app, resources, sceneManager) {
        this.app = app;
        this.resources = resources;
        this.sceneManager = sceneManager;

        // Подкомпоненты
        this.animations = new RabbitAnimations(this, resources, app, sceneManager.worldContainer);
        this.controls = new RabbitControls(this);
        this.physics = new RabbitPhysics(this);
        this.effects = new RabbitEffects(this, resources);

        // Основные свойства
        this.sprite = null;
        this.direction = 1;
        this.isMoving = false;

        this.init();
    }

    init() {
        this.animations.setup();
        this.createSprite();
        this.controls.setup();
        this.effects.setup();
    }

    createSprite() {
        this.sprite = new PIXI.Sprite(this.animations.getFrame('idle', 0));
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.15);
        this.physics.updateGroundPosition();
    }

    update(delta) {
        this.physics.updateMovement(delta);
        this.physics.handleJump(delta);
        this.physics.handleBounds();
        this.animations.update(delta);
        this.effects.update();
    }
}
