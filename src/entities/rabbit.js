import * as PIXI from 'pixi.js';

export class Rabbit {
    constructor(app, resources) {
        this.app = app;
        this.resources = resources;
        this.sprite = null;
        this.animations = {};
        this.currentAnimation = null;
        this.speed = 5;
        this.isMoving = false;
        this.direction = 1;
        this.isJumping = false;
        this.isHitting = false;
        this.hitJumpPower = -15;
        this.jumpPower = -40;
        this.gravity = 0.6;
        this.jumpVelocity = 0;
        this.initialJumpX = 0;
        this.animationSpeed = 1.4;
        this.hitAnimationSpeed = 0.5;

        this.hitFrameDuration = 80;
        this.hitPauseFrame = 3;
        this.hitPauseDuration = 800;
        this.animationFrame = 0;
        this.animationTime = 0;

        // Добавим хитбокс для удара
        this.hitArea = new PIXI.Rectangle();
        this.hitActive = false;

        this.setupAnimations();
        this.createSprite();
        this.setupControls();
    }

    setupAnimations() {
        const runFrames = ['run_rabbit_1.png', 'run_rabbit_2.png', 'run_rabbit_3.png', 'run_rabbit_4.png'];
        const idleFrames = ['rabbit_is_standing_1.png', 'rabbit_is_standing_2.png'];
        const jumpFrames = ['bunny_jumping_1.png', 'bunny_jumping_2.png', 'bunny_jumping_3.png', 'bunny_jumping_4.png'];
        const hitFrames = ['bunny_jumping_1.png', 'bunny_hits_1.png', 'bunny_hits_3.png', 'bunny_hits_4.png'];

        this.animations.run = runFrames.map(f => this.resources.textures[f]);
        this.animations.idle = idleFrames.map(f => this.resources.textures[f]);
        this.animations.jump = jumpFrames.map(f => this.resources.textures[f]);
        this.animations.hit = hitFrames.map(f => this.resources.textures[f]);
    }

    createSprite() {
        this.sprite = new PIXI.Sprite(this.animations.idle[0]);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.2);
        this.updateGroundPosition();
        this.app.stage.addChild(this.sprite);
    }

    getGrassY() {
        const desiredSoilHeight = 130;
        const soilY = Math.round(this.app.screen.height - desiredSoilHeight);
        return soilY + desiredSoilHeight - 160;
    }

    updateGroundPosition() {
        const groundY = this.getGrassY();
        const scaledHeight = this.sprite.height * this.sprite.scale.y;
        this.sprite.y = groundY - scaledHeight / 2;
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && !this.isJumping && !this.isHitting) {
                this.isMoving = true;
                this.direction = -1;
                this.sprite.scale.x = -0.2;
                this.playAnimation('run');
            }
            if (e.key === 'ArrowRight' && !this.isJumping && !this.isHitting) {
                this.isMoving = true;
                this.direction = 1;
                this.sprite.scale.x = 0.2;
                this.playAnimation('run');
            }
            if (e.key === ' ' && !this.isJumping && !this.isHitting) {
                this.isJumping = true;
                this.jumpVelocity = this.jumpPower;
                this.initialJumpX = this.sprite.x;
                this.jumpDistance = 0;
                this.playAnimation('jump');
            }
            if (e.key === 'у' && !this.isHitting && !this.isJumping) {
                this.startHit();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                this.isMoving = false;
                if (!this.isJumping && !this.isHitting) {
                    this.stopAnimation();
                    this.sprite.texture = this.animations.idle[0];
                }
            }
        });
    }

    startHit() {
        this.isHitting = true;
        this.hitActive = false;
        this.jumpVelocity = this.hitJumpPower;
        this.playAnimation('hit');
        this.animationFrame = 0;
        this.sprite.scale.set(0.18);
        if (this.direction === -1) {
            this.sprite.scale.x = -0.18;
        }
        this.updateGroundPosition();

        this.currentAnimation = 'hit';

        // Обновляем хитбокс при ударе
        this.updateHitArea();
    }

    updateHitArea() {
        // Хитбокс будет перед кроликом в направлении удара
        const hitWidth = 50;
        const hitHeight = 30;
        const offsetX = this.direction === 1 ? 30 : -hitWidth - 30;

        this.hitArea.x = this.sprite.x + offsetX;
        this.hitArea.y = this.sprite.y - hitHeight/2;
        this.hitArea.width = hitWidth;
        this.hitArea.height = hitHeight;
    }

    playAnimation(name) {
        if (this.currentAnimation !== name) {
            this.currentAnimation = name;
            this.animationFrame = 0;
            this.animationTime = 0;
            this.sprite.texture = this.animations[name][0];
            if (name === 'idle') this.animationSpeed = 30;
            else if (name === 'jump') this.animationSpeed = 100;
            else if (name === 'hit') this.animationSpeed = this.hitAnimationSpeed;
            else this.animationSpeed = 1.4;

            // Maintain direction when changing animations
            if (this.direction === -1) {
                this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
            } else {
                this.sprite.scale.x = Math.abs(this.sprite.scale.x);
            }
        }
    }

    stopAnimation() {
        this.currentAnimation = 'idle';
        this.animationFrame = 0;
        this.animationTime = 0;
        this.animationSpeed = 30;
        this.sprite.scale.set(0.2);
        if (this.direction === -1) {
            this.sprite.scale.x = -0.2;
        }
        this.updateGroundPosition();
    }

    update(delta) {
        if (this.isMoving && !this.isHitting) {
            this.sprite.x += this.speed * this.direction * delta;
        }

        // Обновление физики прыжка/удара
        if (this.isJumping || this.isHitting) {
            this.jumpVelocity += this.gravity;
            this.sprite.y += this.jumpVelocity * delta;

            if (this.isJumping) {
                const jumpProgress = Math.abs(this.jumpVelocity) / Math.abs(this.jumpPower);
                const horizontalSpeed = this.speed * (1 - jumpProgress * 0.3);
                this.sprite.x += horizontalSpeed * this.direction * delta;
                this.jumpDistance = Math.abs(this.sprite.x - this.initialJumpX);
            }

            // Проверка выхода за верхнюю границу
            if (this.sprite.y < this.sprite.height / 1.8) {
                this.sprite.y = this.sprite.height / 1.8;
                this.jumpVelocity = 0;
            }

            // Проверка приземления
            const groundY = this.getGrassY();
            const scaledHeight = this.sprite.height * this.sprite.scale.y;
            if (this.sprite.y >= groundY - scaledHeight / 2) {
                this.sprite.y = groundY - scaledHeight / 2;
                this.jumpVelocity = 0;

                if (this.isJumping) {
                    this.isJumping = false;
                    this.isHitting = false;
                    if (this.isMoving) this.playAnimation('run');
                    else {
                        this.stopAnimation();
                        this.sprite.texture = this.animations.idle[0];
                    }
                }
            }
        }

        // Обновление границ экрана
        const bounds = this.sprite.getBounds();
        if (bounds.left < 0) this.sprite.x = bounds.width / 2;
        else if (bounds.right > this.app.screen.width) this.sprite.x = this.app.screen.width - bounds.width / 2;

        // Обновление анимации
        if (this.currentAnimation) {
            this.animationTime += delta;

            if (this.currentAnimation === 'hit') {
                const frames = this.animations.hit;
                const frameDuration = this.animationFrame === this.hitPauseFrame ?
                    this.hitPauseDuration : this.hitFrameDuration;

                if (this.animationTime >= frameDuration / 16.666) {
                    this.animationTime = 0;
                    this.animationFrame++;

                    // Активируем хитбокс на определенном кадре анимации
                    if (this.animationFrame === 2 && !this.hitActive) {
                        this.hitActive = true;
                        this.updateHitArea();
                    } else if (this.animationFrame > 2) {
                        this.hitActive = false;
                    }

                    if (this.animationFrame >= frames.length) {
                        this.sprite.texture = frames[frames.length - 1];
                        this.isHitting = false;
                        this.hitActive = false;
                        this.animationFrame = 0;
                        if (this.isMoving) this.playAnimation('run');
                        else {
                            this.stopAnimation();
                            this.sprite.texture = this.animations.idle[0];
                        }
                        return;
                    }
                }
                this.sprite.texture = frames[this.animationFrame];
            } else {
                if (this.animationTime >= this.animationSpeed) {
                    this.animationTime = 0;
                    const frames = this.animations[this.currentAnimation];
                    this.animationFrame = (this.animationFrame + 1) % frames.length;
                    this.sprite.texture = frames[this.animationFrame];
                }
            }
        }
    }

    // Метод для проверки попадания
    checkHit(target) {
        if (!this.hitActive) return false;

        this.updateHitArea();
        return this.hitArea.contains(target.x, target.y);
    }
}
