import * as PIXI from 'pixi.js';
export class RabbitPhysics {
    constructor(rabbit) {
        this.rabbit = rabbit;

        // Физические свойства
        this.speed = 5;
        this.isJumping = false;
        this.isHitting = false;
        this.hitJumpPower = -25;
        this.jumpPower = -40;
        this.gravity = 0.6;
        this.jumpVelocity = 0;
        this.hitLanding = false;
        this.hitDoctor = false;

        // Хитбокс
        this.hitArea = new PIXI.Rectangle();
        this.hitActive = false;
    }

    getGrassY() {
        const desiredSoilHeight = 130;
        const soilY = Math.round(this.rabbit.app.screen.height - desiredSoilHeight);
        return soilY + desiredSoilHeight - 150;
    }

    updateGroundPosition() {
        const groundY = this.getGrassY();
        const scaledHeight = this.rabbit.sprite.height * this.rabbit.sprite.scale.y;
        this.rabbit.sprite.y = groundY - scaledHeight / 2;
    }

    updateHitArea() {
        const hitWidth = 50;
        const hitHeight = 30;
        const offsetX = this.rabbit.direction === 1 ? 30 : -hitWidth - 30;

        this.hitArea.x = this.rabbit.sprite.x + offsetX;
        this.hitArea.y = this.rabbit.sprite.y - hitHeight/2;
        this.hitArea.width = hitWidth;
        this.hitArea.height = hitHeight;
    }

    startJump() {
        this.isJumping = true;
        this.jumpVelocity = this.jumpPower;
        this.rabbit.animations.play('jump');
    }

    startHit() {
        if (this.isHitting) return; // Prevent multiple hits
        this.isHitting = true;
        this.isJumping = true;
        this.hitActive = false;
        this.hitLanding = false;
        this.hitDoctor = false;
        this.jumpVelocity = this.hitJumpPower;
        this.rabbit.animations.play('hit');
        this.rabbit.sprite.rotation = this.rabbit.direction * 0.1;
        this.updateHitArea();
    }

    updateMovement(delta) {
        if (this.rabbit.isMoving && !this.isHitting) {
            const newX = this.rabbit.sprite.x + this.speed * this.rabbit.direction * delta;

            // Проверяем границы движения
            if (this.rabbit.direction === 1) {
                // Движение вправо - не ограничиваем
                this.rabbit.sprite.x = newX;
            } else {
                // Движение влево - ограничиваем стартовой позицией
                const worldX = this.rabbit.sceneManager.camera.getWorldPosition(newX);
                if (worldX >= this.rabbit.sceneManager.rabbitStartX) {
                    this.rabbit.sprite.x = newX;
                }
            }
        }
    }

    handleJump(delta) {
        if (this.isJumping || this.isHitting) {
            this.jumpVelocity += this.gravity;
            this.rabbit.sprite.y += this.jumpVelocity * delta;

            if (this.jumpVelocity < 0) {
                const jumpPower = this.isHitting ? this.hitJumpPower : this.jumpPower;
                const forwardSpeed = this.isHitting ? 5 : 3;
                const jumpProgress = Math.abs(this.jumpVelocity) / Math.abs(jumpPower);
                const speed = forwardSpeed * (1 - jumpProgress * 0.5);
                const newX = this.rabbit.sprite.x + speed * this.rabbit.direction * delta;

                // Проверяем границы движения при прыжке
                if (this.rabbit.direction === 1) {
                    // Движение вправо - не ограничиваем
                    this.rabbit.sprite.x = newX;
                } else {
                    // Движение влево - ограничиваем стартовой позицией
                    const worldX = this.rabbit.sceneManager.camera.getWorldPosition(newX);
                    if (worldX >= this.rabbit.sceneManager.rabbitStartX) {
                        this.rabbit.sprite.x = newX;
                    }
                }
            }

            if (this.rabbit.sprite.y < this.rabbit.sprite.height / 1.8) {
                this.rabbit.sprite.y = this.rabbit.sprite.height / 1.8;
                this.jumpVelocity = 0;
            }

            this.checkLanding();
        }
    }

    checkLanding() {
        const groundY = this.getGrassY();
        const scaledHeight = this.rabbit.sprite.height * this.rabbit.sprite.scale.y;

        if (this.rabbit.sprite.y >= groundY - scaledHeight / 2) {
            this.rabbit.sprite.y = groundY - scaledHeight / 2;
            this.jumpVelocity = 0;

            if (this.isHitting && !this.hitLanding) {
                this.handleHitLanding();
            }

            if (this.isJumping && !this.isHitting) {
                this.handleRegularLanding();
            }
        }
    }

    handleHitLanding() {
        if (this.hitLanding) return; // Prevent multiple landings
        this.hitLanding = true;
        this.rabbit.effects.showGroundHit();
        this.rabbit.sprite.rotation = 0;

        // Clear any existing timeout
        if (this.hitTimeout) {
            clearTimeout(this.hitTimeout);
        }

        this.hitTimeout = setTimeout(() => {
            this.isHitting = false;
            this.isJumping = false;
            this.hitActive = false;
            this.hitLanding = false;
            this.hitDoctor = false;
            if (this.rabbit.isMoving) {
                this.rabbit.animations.play('run');
            } else {
                this.rabbit.animations.stop();
                this.rabbit.sprite.texture = this.rabbit.animations.getFrame('idle', 0);
            }
        }, 700);
    }

    handleRegularLanding() {
        this.isJumping = false;
        if (this.rabbit.isMoving) {
            this.rabbit.animations.play('run');
        } else {
            this.rabbit.animations.stop();
            this.rabbit.sprite.texture = this.rabbit.animations.getFrame('idle', 0);
        }
    }

    handleBounds() {
        const worldX = this.rabbit.sceneManager.camera.getWorldPosition(this.rabbit.sprite.x);
        const bounds = this.rabbit.sprite.getBounds();

        // Проверяем только левую границу (стартовая позиция)
        if (worldX < this.rabbit.sceneManager.rabbitStartX) {
            this.rabbit.sprite.x = this.rabbit.sceneManager.camera.getScreenPosition(this.rabbit.sceneManager.rabbitStartX);
        }
    }
}
