export class RabbitAnimations {
    constructor(rabbit, resources) {
        this.rabbit = rabbit;
        this.resources = resources;
        this.animations = {};
        this.currentAnimation = null;
        this.animationFrame = 0;
        this.animationTime = 0;

        // Настройки анимации
        this.animationSpeeds = {
            run: 1.4,
            idle: 30,
            jump: 100,
            hit: 0.5
        };
        this.hitFrameDuration = 80;
        this.hitPauseFrame = 3;
        this.hitPauseDuration = 700;
    }

    setup() {
        const runFrames = ['run_rabbit_1.png', 'run_rabbit_2.png', 'run_rabbit_3.png', 'run_rabbit_4.png'];
        const idleFrames = ['rabbit_is_standing_1.png', 'rabbit_is_standing_2.png'];
        const jumpFrames = ['bunny_jumping_1.png', 'bunny_jumping_2.png', 'bunny_jumping_3.png', 'bunny_jumping_4.png'];
        const hitFrames = ['bunny_jumping_1.png', 'bunny_hits_1.png', 'bunny_hits_3.png', 'bunny_hits_4.png'];

        this.animations.run = runFrames.map(f => this.resources.textures[f]);
        this.animations.idle = idleFrames.map(f => this.resources.textures[f]);
        this.animations.jump = jumpFrames.map(f => this.resources.textures[f]);
        this.animations.hit = hitFrames.map(f => this.resources.textures[f]);
    }

    getFrame(animation, frame) {
        return this.animations[animation][frame];
    }

    play(name) {
        if (this.currentAnimation !== name) {
            this.currentAnimation = name;
            this.animationFrame = 0;
            this.animationTime = 0;
            this.rabbit.sprite.texture = this.getFrame(name, 0);

            // Обновляем масштаб и направление
            const scale = name === 'hit' ? 0.13 : 0.15;
            this.rabbit.sprite.scale.set(scale);
            if (this.rabbit.direction === -1) {
                this.rabbit.sprite.scale.x = -scale;
            }
        }
    }

    stop() {
        this.currentAnimation = 'idle';
        this.animationFrame = 0;
        this.animationTime = 0;
        this.rabbit.sprite.scale.set(0.15);
        if (this.rabbit.direction === -1) {
            this.rabbit.sprite.scale.x = -0.15;
        }
        this.rabbit.sprite.rotation = 0;
    }

    update(delta) {
        if (!this.currentAnimation) return;

        this.animationTime += delta;
        const speed = this.animationSpeeds[this.currentAnimation] || 1;

        if (this.currentAnimation === 'hit' && !this.rabbit.physics.hitLanding) {
            this.updateHitAnimation();
        } else if (this.currentAnimation !== 'hit') {
            if (this.animationTime >= speed) {
                this.animationTime = 0;
                const frames = this.animations[this.currentAnimation];
                this.animationFrame = (this.animationFrame + 1) % frames.length;
                this.rabbit.sprite.texture = frames[this.animationFrame];
            }
        }
    }

    updateHitAnimation() {
        const frameDuration = this.animationFrame === this.hitPauseFrame ?
            this.hitPauseDuration : this.hitFrameDuration;

        if (this.animationTime >= frameDuration / 16.666) {
            this.animationTime = 0;
            this.animationFrame++;

            if (this.animationFrame === 2 && !this.rabbit.physics.hitActive) {
                this.rabbit.physics.hitActive = true;
                this.rabbit.physics.updateHitArea();
            } else if (this.animationFrame > 2) {
                this.rabbit.physics.hitActive = false;
            }

            if (this.animationFrame >= this.animations.hit.length - 1) {
                this.animationFrame = this.animations.hit.length - 2;
            }
        }
        this.rabbit.sprite.texture = this.animations.hit[this.animationFrame];
    }
}
