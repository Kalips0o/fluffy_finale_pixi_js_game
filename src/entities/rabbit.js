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
        this.hitJumpPower = -25; // Увеличили высоту прыжка при ударе
        this.jumpPower = -40;
        this.gravity = 0.6;
        this.jumpVelocity = 0;
        this.initialJumpX = 0;
        this.animationSpeed = 1.4;
        this.hitAnimationSpeed = 0.5;

        this.hitFrameDuration = 80;
        this.hitPauseFrame = 3;
        this.hitPauseDuration = 700;
        this.animationFrame = 0;
        this.animationTime = 0;
        this.hitLanding = false; // Флаг приземления после удара

        // Хитбокс и эффекты
        this.hitArea = new PIXI.Rectangle();
        this.hitActive = false;
        this.bloodEffect = null;

        this.setupAnimations();
        this.createSprite();
        this.setupControls();
        this.createBloodEffect();
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

    createBloodEffect() {
        this.bloodEffect = new PIXI.Sprite(this.resources.textures['bunny_hits_4.png']);
        this.bloodEffect.anchor.set(0.5);
        this.bloodEffect.scale.set(0.2);
        this.bloodEffect.visible = false;
        this.app.stage.addChild(this.bloodEffect);
    }

    showBloodEffect() {
        this.bloodEffect.x = this.sprite.x;
        this.bloodEffect.y = this.sprite.y + this.sprite.height/2;
        this.bloodEffect.scale.x = Math.abs(this.bloodEffect.scale.x) * this.direction;
        this.bloodEffect.visible = true;

        // Анимация исчезновения
        setTimeout(() => {
            this.bloodEffect.visible = false;
        }, 500);
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
        if (!this.isHitting && !this.isJumping) {
            this.isHitting = true;
            this.isJumping = true;
            this.hitActive = false;
            this.hitLanding = false;
            this.jumpVelocity = this.hitJumpPower;
            this.initialJumpX = this.sprite.x;
            this.playAnimation('hit');
            this.animationFrame = 0;
            this.animationTime = 0;
            this.sprite.scale.set(0.18);
            if (this.direction === -1) {
                this.sprite.scale.x = -0.18;
            }
            this.updateGroundPosition();

            // Наклон вперед при ударе
            this.sprite.rotation = this.direction * 0.1;
            this.updateHitArea();
        }
    }

    updateHitArea() {
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
        this.sprite.rotation = 0;
        this.updateGroundPosition();
    }

    update(delta) {
        if (this.isMoving && !this.isHitting) {
            this.sprite.x += this.speed * this.direction * delta;
        }

        if (this.isJumping || this.isHitting) {
            this.jumpVelocity += this.gravity;
            this.sprite.y += this.jumpVelocity * delta;

            // При ударе небольшое движение вперед без перемещения по земле
            if (this.isHitting && this.jumpVelocity < 0) {
                this.sprite.x += this.direction * 2 * delta;
            }

            // Верхняя граница
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

                if (this.isHitting && !this.hitLanding) {
                    this.hitLanding = true;
                    this.showBloodEffect();
                    this.sprite.rotation = 0;
                    // Показываем 4-й кадр при приземлении
                    this.sprite.texture = this.animations.hit[3];
                    this.animationFrame = 3;
                    this.animationTime = 0;

                    setTimeout(() => {
                        this.isHitting = false;
                        this.isJumping = false;
                        this.hitActive = false;
                        this.hitLanding = false;
                        this.animationFrame = 0;
                        this.animationTime = 0;
                        if (this.isMoving) {
                            this.playAnimation('run');
                        } else {
                            this.stopAnimation();
                            this.sprite.texture = this.animations.idle[0];
                        }
                    }, 1000); // Увеличили задержку до 1 секунды
                }

                if (this.isJumping && !this.isHitting) {
                    this.isJumping = false;
                    if (this.isMoving) {
                        this.playAnimation('run');
                    } else {
                        this.stopAnimation();
                        this.sprite.texture = this.animations.idle[0];
                    }
                }
            }
        }

        // Границы экрана
        const bounds = this.sprite.getBounds();
        if (bounds.left < 0) this.sprite.x = bounds.width / 2;
        else if (bounds.right > this.app.screen.width) this.sprite.x = this.app.screen.width - bounds.width / 2;

        // Анимация
        if (this.currentAnimation) {
            this.animationTime += delta;

            if (this.currentAnimation === 'hit' && !this.hitLanding) {
                const frames = this.animations.hit;
                const frameDuration = this.animationFrame === this.hitPauseFrame ?
                    this.hitPauseDuration : this.hitFrameDuration;

                if (this.animationTime >= frameDuration / 16.666) {
                    this.animationTime = 0;
                    this.animationFrame++;

                    // Активация хитбокса на 2 кадре
                    if (this.animationFrame === 2 && !this.hitActive) {
                        this.hitActive = true;
                        this.updateHitArea();
                    } else if (this.animationFrame > 2) {
                        this.hitActive = false;
                    }

                    // Не показываем последний кадр до приземления
                    if (this.animationFrame >= frames.length - 1) {
                        this.animationFrame = frames.length - 2;
                    }
                }
                this.sprite.texture = frames[this.animationFrame];
            } else if (this.currentAnimation !== 'hit') {
                if (this.animationTime >= this.animationSpeed) {
                    this.animationTime = 0;
                    const frames = this.animations[this.currentAnimation];
                    this.animationFrame = (this.animationFrame + 1) % frames.length;
                    this.sprite.texture = frames[this.animationFrame];
                }
            }
        }
    }

    checkHit(target) {
        if (!this.hitActive) return false;
        this.updateHitArea();
        return this.hitArea.contains(target.x, target.y);
    }
}
