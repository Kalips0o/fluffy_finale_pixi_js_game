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
        this.direction = 1; // 1 for right, -1 for left
        this.isJumping = false;
        this.jumpPower = -40; // Возвращаем прежнюю силу прыжка
        this.gravity = 0.6; // Возвращаем прежнюю гравитацию
        this.jumpVelocity = 0;
        this.jumpDistance = 0;
        this.initialJumpX = 0;
        this.maxJumpDistance = 200; // Максимальное расстояние прыжка
        this.animationSpeed = 1.4; // Возвращаем прежнюю скорость анимации
        this.jumpAnimationSpeed = 2.0; // Делаем анимацию прыжка значительно медленнее
        this.animationFrame = 0;
        this.animationTime = 0;
        this.setupAnimations();
        this.createSprite();
        this.setupControls();
    }

    setupAnimations() {
        // Создаем анимации из спрайтов
        const runFrames = [
            'run_rabbit_1.png',
            'run_rabbit_2.png',
            'run_rabbit_3.png',
            'run_rabbit_4.png'
        ];

        // Добавляем кадры для стоящего кролика
        const idleFrames = [
            'rabbit_is_standing_1.png',
            'rabbit_is_standing_2.png'
        ];

        // Добавляем кадры для прыжка
        const jumpFrames = [
            'bunny_jumping_1.png',
            'bunny_jumping_2.png',
            'bunny_jumping_3.png',
            'bunny_jumping_4.png'
        ];

        this.animations.run = runFrames.map(frame => this.resources.textures[frame]);
        this.animations.idle = idleFrames.map(frame => this.resources.textures[frame]);
        this.animations.jump = jumpFrames.map(frame => this.resources.textures[frame]);
    }

    createSprite() {
        // Создаем спрайт зайца
        this.sprite = new PIXI.Sprite(this.animations.idle[0]);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.2); // Уменьшаем размер зайца

        // Позиционируем зайца в нижней части экрана
        const grassY = this.getGrassY();
        this.sprite.x = this.app.screen.width / 2;
        this.sprite.y = grassY - this.sprite.height / 2;

        this.app.stage.addChild(this.sprite);
    }

    getGrassY() {
        const desiredSoilHeight = 130;
        const soilScale = desiredSoilHeight / this.resources.textures['soil.png'].height;
        const soilY = Math.round(this.app.screen.height - desiredSoilHeight);
        return soilY + desiredSoilHeight - 50; // Позиционируем зайца  выше поверхности почвы
    }

    setupControls() {
        // Обработка нажатий клавиш
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                this.isMoving = true;
                this.direction = e.key === 'ArrowLeft' ? -1 : 1;
                // Отражение спрайта при повороте
                this.sprite.scale.x = Math.abs(this.sprite.scale.x) * this.direction;
                if (!this.isJumping) {
                    this.playAnimation('run');
                }
            }
            // Добавляем прыжок на пробел
            if (e.key === ' ' && !this.isJumping) {
                this.isJumping = true;
                this.jumpVelocity = this.jumpPower;
                this.initialJumpX = this.sprite.x;
                this.jumpDistance = 0;
                this.playAnimation('jump');
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                this.isMoving = false;
                if (!this.isJumping) {
                    this.stopAnimation();
                    // Мгновенно переключаемся на первый кадр стояния
                    this.sprite.texture = this.animations.idle[0];
                }
            }
        });
    }

    playAnimation(name) {
        if (this.currentAnimation !== name) {
            console.log('Switching to animation:', name); // Отладочный вывод
            this.currentAnimation = name;
            this.animationFrame = 0;
            this.animationTime = 0;
            this.sprite.texture = this.animations[name][0];

            // Устанавливаем скорость анимации в зависимости от типа
            if (name === 'idle') {
                this.animationSpeed = 30; // Медленная анимация для стояния
            } else if (name === 'jump') {
                this.animationSpeed = 100; // Очень медленная анимация для прыжка
                console.log('Jump animation speed set to:', this.animationSpeed); // Отладочный вывод
            } else {
                this.animationSpeed = 1.4; // Нормальная скорость для бега
            }
        }
    }

    stopAnimation() {
        this.currentAnimation = 'idle';
        this.animationFrame = 0;
        this.animationTime = 0;
        this.animationSpeed = 30; // Медленная анимация для стояния
    }

    update(delta) {
        // Обновляем позицию по горизонтали
        if (this.isMoving && !this.isJumping) {
            this.sprite.x += this.speed * this.direction * delta;
        }

        // Обновляем позицию по вертикали (прыжок)
        if (this.isJumping) {
            // Обновляем вертикальную скорость и позицию
            this.jumpVelocity += this.gravity;
            this.sprite.y += this.jumpVelocity * delta;

            // Рассчитываем горизонтальное движение во время прыжка
            // Даже если не нажаты клавиши движения, кролик движется вперед
            const jumpProgress = Math.abs(this.jumpVelocity) / Math.abs(this.jumpPower);
            const horizontalSpeed = this.speed * (1 - jumpProgress * 0.3); // Меньшее замедление в верхней точке
            this.sprite.x += horizontalSpeed * this.direction * delta;
            this.jumpDistance = Math.abs(this.sprite.x - this.initialJumpX);

            // Проверяем, не выходит ли кролик за верхнюю границу экрана
            if (this.sprite.y < this.sprite.height / 1.8) {
                this.sprite.y = this.sprite.height / 1.8;
                this.jumpVelocity = 0;
            }

            // Проверяем, не приземлился ли кролик
            const groundY = this.getGrassY() - this.sprite.height / 2;
            if (this.sprite.y >= groundY) {
                this.sprite.y = groundY;
                this.isJumping = false;
                this.jumpVelocity = 0;
                if (!this.isMoving) {
                    this.stopAnimation();
                    // Мгновенно переключаемся на первый кадр стояния
                    this.sprite.texture = this.animations.idle[0];
                } else {
                    this.playAnimation('run');
                }
            }
        }

        // Ограничиваем движение в пределах экрана по горизонтали
        const bounds = this.sprite.getBounds();
        if (bounds.left < 0) {
            this.sprite.x = bounds.width / 2;
        } else if (bounds.right > this.app.screen.width) {
            this.sprite.x = this.app.screen.width - bounds.width / 2;
        }

        // Обновляем анимацию
        if (this.currentAnimation) {
            this.animationTime += delta;
            if (this.animationTime >= this.animationSpeed) {
                this.animationTime = 0;
                const frames = this.animations[this.currentAnimation];
                this.animationFrame = (this.animationFrame + 1) % frames.length;
                this.sprite.texture = frames[this.animationFrame];
                if (this.currentAnimation === 'jump') {
                    console.log('Jump frame:', this.animationFrame, 'Speed:', this.animationSpeed); // Отладочный вывод
                }
            }
        }
    }
}
