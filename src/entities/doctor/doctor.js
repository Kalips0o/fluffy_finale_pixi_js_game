import * as PIXI from 'pixi.js';
import { BloodSplatter } from '../effects/BloodSplatter';

export class Doctor {
    constructor(app, resources, x, y, sceneManager) {
        this.app = app;
        this.resources = resources;
        this.x = x;
        this.y = y;
        this.isActive = true;
        this.animationSpeed = 20; // Увеличиваем с 0.1 до 0.3 для более медленной анимации
        this.animationTime = 0;
        this.currentFrame = 0;
        this.frames = ['doctor_1.png', 'doctor_2.png', 'doctor_3.png'];
        this.isSmiling = false;

        // Добавляем параметры для движения
        this.speed = 0.3;
        this.direction = -1; // Начинаем движение влево
        this.startX = x;
        this.walkDistance = 100; // Расстояние, которое доктор проходит в одну сторону

        this.sceneManager = sceneManager;

        this.init();
    }

    init() {
        // Создаем спрайт доктора
        this.sprite = new PIXI.Sprite(this.resources.textures[this.frames[0]]);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.15);
        // Устанавливаем начальное отражение в зависимости от направления
        this.sprite.scale.x = this.direction === -1 ? Math.abs(this.sprite.scale.x) : -Math.abs(this.sprite.scale.x);
        this.sprite.x = this.x;
        this.sprite.y = this.y + 5; // Опускаем доктора на 20 пикселей ниже

        // Создаем хитбокс
        this.hitbox = new PIXI.Rectangle(
            this.sprite.x - this.sprite.width * 0.25,
            this.sprite.y - this.sprite.height * 0.25,
            this.sprite.width * 0.5,
            this.sprite.height * 0.5
        );
    }

    update(delta) {
        if (!this.isActive) return;

        // Если доктор улыбается, не обновляем анимацию
        if (!this.isSmiling) {
            // Обновляем анимацию
            this.animationTime += delta;
            if (this.animationTime >= this.animationSpeed) {
                this.animationTime = 0;
                this.currentFrame = (this.currentFrame + 1) % this.frames.length;
                this.sprite.texture = this.resources.textures[this.frames[this.currentFrame]];
            }

            // Обновляем движение
            this.sprite.x += this.speed * this.direction * delta;

            // Проверяем, не вышел ли доктор за пределы своей зоны патрулирования
            if (Math.abs(this.sprite.x - this.startX) >= this.walkDistance) {
                this.direction *= -1; // Разворачиваемся
                // Обновляем отражение спрайта в зависимости от нового направления
                this.sprite.scale.x = this.direction === -1 ? Math.abs(this.sprite.scale.x) : -Math.abs(this.sprite.scale.x);
            }
        }

        // Обновляем хитбокс
        this.hitbox.x = this.sprite.x - this.sprite.width * 0.25;
        this.hitbox.y = this.sprite.y - this.sprite.height * 0.25;
    }

    startSmiling() {
        // Сначала поворачиваемся в сторону падения кролика
        this.direction = this.sceneManager.rabbit.direction;
        this.sprite.scale.x = this.direction === -1 ? Math.abs(this.sprite.scale.x) : Math.abs(this.sprite.scale.x);

        // Добавляем задержку перед показом улыбки
        setTimeout(() => {
            this.isSmiling = true;
            this.sprite.texture = this.resources.textures['doctor_smiling.png'];
        }, 500); // 500мс задержка
    }

    checkCollision(rabbit) {
        if (!this.isActive) return false;

        const rabbitBounds = rabbit.sprite.getBounds();
        return this.hitbox.intersects(rabbitBounds);
    }

    deactivate() {
        if (!this.isActive) return; // Prevent multiple deactivations
        this.isActive = false;
        if (this.sprite && this.sprite.parent) {
            // Create blood splatter effect at the doctor's position
            const splatterX = this.hitbox.x + this.hitbox.width / 2;
            const splatterY = this.hitbox.y + this.hitbox.height / 2;
            const splatter = new BloodSplatter(this.app, splatterX, splatterY, this.resources, this.sceneManager.worldContainer);
            this.sceneManager.addBloodSplatter(splatter);

            // Make doctor sprite invisible immediately
            this.sprite.visible = false;

            // Remove the sprite after a short delay to ensure blood effect is visible
            setTimeout(() => {
                if (this.sprite && this.sprite.parent) {
                    this.sprite.parent.removeChild(this.sprite);
                }
            }, 100);
        }
        this.sprite = null;
        this.hitbox = null;
    }
}
