import * as PIXI from 'pixi.js';
export class RabbitPhysics {
    constructor(rabbit) {
        this.rabbit = rabbit;

        // Физические свойства
        this.speed = 5;
        this.isJumping = false;
        this.isHitting = false;
        
        // Параметры для прыжка
        this.jumpPower = -70;
        this.jumpGravity = 0.35;
        this.jumpForwardSpeed = 10;
        
        // Параметры для удара
        this.hitJumpPower = -25;
        this.hitGravity = 0.6;
        this.hitForwardSpeed = 2;
        
        this.jumpVelocity = 0;
        this.hitLanding = false;
        this.hitDoctor = false;
        this.gameOver = false;

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
        const hitWidth = 100;
        const hitHeight = 80;
        let offsetX;

        if (this.rabbit.direction === 1) {
            offsetX = 30;
        } else {
            offsetX = -hitWidth - 30;
        }

        this.hitArea.x = this.rabbit.sprite.x + offsetX;
        this.hitArea.y = this.rabbit.sprite.y + 30;
        this.hitArea.width = hitWidth;
        this.hitArea.height = hitHeight;
    }

    startJump() {
        this.isJumping = true;
        this.jumpVelocity = this.jumpPower;
        this.rabbit.animations.play('jump');
    }

    startHit() {
        if (this.isHitting || this.gameOver) return;
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
        if (this.gameOver) return;
        if (this.isJumping || this.isHitting) {
            // Выбираем параметры в зависимости от типа действия
            const gravity = this.isHitting ? this.hitGravity : this.jumpGravity;
            this.jumpVelocity += gravity;
            this.rabbit.sprite.y += this.jumpVelocity * delta;

            // Движение вперед
            if (this.isHitting) {
                // При ударе двигаемся вперед только когда прыгаем вверх
                if (this.jumpVelocity < 0) {
                    const jumpProgress = Math.abs(this.jumpVelocity) / Math.abs(this.hitJumpPower);
                    const speed = this.hitForwardSpeed * (1 - jumpProgress * 0.2);
                    const newX = this.rabbit.sprite.x + speed * this.rabbit.direction * delta;
                    this.rabbit.sprite.x = newX;
                }
            } else {
                // При обычном прыжке двигаемся вперед всегда
                const jumpProgress = Math.abs(this.jumpVelocity) / Math.abs(this.jumpPower);
                const speed = this.jumpForwardSpeed * (1 - jumpProgress * 0.2);
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

        // Устанавливаем правильную текстуру для последнего кадра удара сразу при приземлении
        if (this.hitDoctor) {
            this.rabbit.sprite.texture = this.rabbit.resources.textures['bunny_hits_4.png'];
        } else {
            this.rabbit.sprite.texture = this.rabbit.resources.textures['bunny_hits_the_ground.png'];
        }
        const scale = 0.15;
        this.rabbit.sprite.scale.set(scale);
        if (this.rabbit.direction === -1) {
            this.rabbit.sprite.scale.x = -scale;
        }

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

            // Масштаб вернется к 0.15 при переходе в 'run' или 'idle' анимацию
            if (this.rabbit.isMoving) {
                this.rabbit.animations.play('run');
            } else {
                this.rabbit.animations.stop();
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
