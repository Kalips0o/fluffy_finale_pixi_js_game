import { HammerAnimation } from '../effects/HammerAnimation';
import { DustAnimation } from '../effects/DustAnimation';

export class RabbitAnimations {
    constructor(rabbit, resources, app, worldContainer) {
        this.rabbit = rabbit;
        this.resources = resources;
        this.animations = {};
        this.currentAnimation = null;
        this.animationFrame = 0;
        this.animationTime = 0;
        this.hammerAnimation = new HammerAnimation(app, resources, worldContainer);
        this.dustAnimation = new DustAnimation(app, resources, worldContainer);

        this.animationSpeeds = {
            run: 1.4,
            idle: 30,
            jump: 100,
            hit: 0.5,
            falling: 1
        };
        this.hitFrameDuration = 80;
        this.hitPauseFrame = 2;
        this.hitPauseDuration = 700;
    }

    setup() {
        const runFrames = ['run_rabbit_1.png', 'run_rabbit_2.png', 'run_rabbit_3.png', 'run_rabbit_4.png'];
        const idleFrames = ['rabbit_is_standing_1.png', 'rabbit_is_standing_2.png'];
        const jumpFrames = ['bunny_jumping_1.png', 'bunny_jumping_2.png', 'bunny_jumping_3.png', 'bunny_jumping_4.png'];
        const hitFrames = ['bunny_jumping_1.png', 'bunny_hits_1.png', 'bunny_hits_3.png'];
        const fallingFrames = ['rabbit_fell_2.png'];

        this.animations.run = runFrames.map(f => this.resources.textures[f]);
        this.animations.idle = idleFrames.map(f => this.resources.textures[f]);
        this.animations.jump = jumpFrames.map(f => this.resources.textures[f]);
        this.animations.hit = hitFrames.map(f => this.resources.textures[f]);
        this.animations.falling = fallingFrames.map(f => this.resources.textures[f]);
    }

    getFrame(name, frame) {
        return this.animations[name][frame];
    }

    play(name) {
        if (this.currentAnimation === name) return;
        this.currentAnimation = name;
        this.animationFrame = 0;
        this.animationTime = 0;
        this.rabbit.sprite.texture = this.getFrame(name, 0);

        const scale = 0.15;
        this.rabbit.sprite.scale.set(scale);
        if (this.rabbit.direction === -1) {
            this.rabbit.sprite.scale.x = -scale;
        }

        if (name === 'falling') {
            this.playFallingAnimation();
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
        } else if (this.currentAnimation !== 'hit' && this.currentAnimation !== 'falling') {
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

            if (this.rabbit.physics.hitLanding && this.animationFrame >= this.animations.hit.length - 1) {
                if (this.rabbit.physics.hitDoctor) {
                    this.rabbit.sprite.texture = this.resources.textures['bunny_hits_4.png'];
                } else {
                    this.rabbit.sprite.texture = this.resources.textures['bunny_hits_the_ground.png'];
                }

                const finalScale = 0.12;
                this.rabbit.sprite.scale.set(finalScale);
                if (this.rabbit.direction === -1) {
                    this.rabbit.sprite.scale.x = -finalScale;
                }
                return;
            }

            if (this.animationFrame < this.animations.hit.length) {
                this.rabbit.sprite.texture = this.animations.hit[this.animationFrame];
            }
        }
    }

    playFallingAnimation() {
        const startX = this.rabbit.sprite.x;
        const startY = this.rabbit.sprite.y;
        const direction = this.rabbit.direction;
        const groundY = this.rabbit.physics.getGrassY();

        const bounces = [
            { x: startX + direction * 150, y: groundY - 20, rotation: Math.PI * 0.5 },
            { x: startX + direction * 280, y: groundY - 20, rotation: Math.PI * 1.2 },
            { x: startX + direction * 480, y: groundY + 30, rotation: Math.PI * 1.7 }
        ];

        const duration = 2500;
        const startTime = Date.now();

        if (this.rabbit.sprite.parent) {
            const treeTrunksLayer = this.rabbit.sceneManager.worldContainer.children.find(
                child => child.name === 'treeTrunksLayer'
            );
            if (treeTrunksLayer) {
                const treeTrunksIndex = this.rabbit.sceneManager.worldContainer.children.indexOf(treeTrunksLayer);
                this.rabbit.sceneManager.worldContainer.setChildIndex(this.rabbit.sprite, treeTrunksIndex);
            } else {
                this.rabbit.sceneManager.worldContainer.setChildIndex(this.rabbit.sprite, 0);
            }
        }

        let lastBounceY = null;
        let lastBounceTime = startTime;

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const bounceProgress = progress * bounces.length;
            const currentBounce = Math.floor(bounceProgress);
            const bounceFraction = bounceProgress - currentBounce;

            const current = bounces[Math.min(currentBounce, bounces.length - 1)];
            const next = bounces[Math.min(currentBounce + 1, bounces.length - 1)];

            if (currentBounce < bounces.length - 1) {
                const height = 50 * Math.sin(bounceFraction * Math.PI);
                const newY = current.y + (next.y - current.y) * bounceFraction - height;

                this.rabbit.sprite.x = current.x + (next.x - current.x) * bounceFraction;
                this.rabbit.sprite.y = newY;
                this.rabbit.sprite.rotation = current.rotation + (next.rotation - current.rotation) * bounceFraction;
                
                // Создаем эффект пыли при отскоке
                if (lastBounceY !== null && newY > lastBounceY && currentTime - lastBounceTime > 150) {
                    this.dustAnimation.createDustEffect(
                        this.rabbit.sprite.x,
                        this.rabbit.sprite.y + 20,
                        Math.PI * 0.5
                    );
                    lastBounceTime = currentTime;
                }
                lastBounceY = newY;
            } else {
                const finalProgress = (progress - (bounces.length - 1) / bounces.length) * bounces.length;

                if (finalProgress < 0.5) {
                    const jumpHeight = 100 * Math.sin(finalProgress * Math.PI);
                    const newY = next.y - jumpHeight;

                    this.rabbit.sprite.x = next.x;
                    this.rabbit.sprite.y = newY;
                    this.rabbit.sprite.rotation = next.rotation;
                    lastBounceY = newY;
                } else {
                    const behindProgress = (finalProgress - 0.5) * 2;
                    const newY = groundY + (100 * behindProgress);

                    this.rabbit.sprite.x = next.x;
                    this.rabbit.sprite.y = newY;
                    this.rabbit.sprite.rotation = next.rotation;
                    lastBounceY = newY;
                }
            }

            this.rabbit.sprite.texture = this.resources.textures['rabbit_fell_2.png'];
            this.dustAnimation.update();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.rabbit.sprite.visible = false;
                this.showGameOver();
            }
        };

        requestAnimationFrame(animate);
        this.hammerAnimation.start(startX, startY, groundY);
    }

    showGameOver() {
        const gameOverSprite = new PIXI.Sprite(this.resources.textures['game-over.png']);
        gameOverSprite.anchor.set(0.5);
        gameOverSprite.x = this.rabbit.app.screen.width / 2;
        gameOverSprite.y = this.rabbit.app.screen.height / 2;
        gameOverSprite.scale.set(0.5);
        this.rabbit.app.stage.addChild(gameOverSprite);
        gameOverSprite.interactive = true;
        gameOverSprite.on('pointerdown', () => {
            window.location.reload();
        });
    }
}
