import * as PIXI from 'pixi.js';

export class Virus {
    constructor(app, resources, x, y, sceneManager, textureName) {
        this.app = app;
        this.resources = resources;
        this.x = x;
        this.y = y;
        this.isActive = true;
        this.isCollected = false;
        this.sceneManager = sceneManager;
        this.textureName = textureName;

        // Параметры для анимации вертикального качания
        this.swingAmplitude = 3; // Амплитуда качания
        this.swingSpeed = 0.03; // Скорость качания
        this.swingTime = Math.random() * Math.PI * 2; // Начальная фаза (случайная)
        this.baseY = y; // Сохраняем базовую Y-координату

        // Параметры для анимации горизонтального качания
        this.horizontalSwingAmplitude = Math.PI / 6; // Амплитуда качания в радианах (30 градусов)
        this.horizontalSwingSpeed = 0.02; // Скорость горизонтального качания
        this.horizontalSwingTime = Math.random() * Math.PI * 2; // Начальная фаза (случайная)
        this.baseRotation = 0; // Базовая ротация

        // Параметры для анимации свечения
        this.glowScale = 1.1; // Начальный масштаб свечения (уменьшен)
        this.glowScaleSpeed = 0.0008; // Скорость изменения масштаба (замедлена)
        this.glowScaleDirection = 1; // Направление изменения масштаба

        this.init();
    }

    init() {
        // Создаем контейнер для вируса и его свечения
        this.container = new PIXI.Container();
        this.container.x = this.x;
        this.container.y = this.y;

        // Создаем спрайт свечения
        this.glowSprite = new PIXI.Sprite(this.resources.textures['glow.png']);
        this.glowSprite.anchor.set(0.5);
        this.glowSprite.scale.set(this.glowScale * 0.8); // Увеличиваем размер свечения
        this.glowSprite.alpha = 0.4; // Делаем свечение более прозрачным
        this.glowSprite.tint = 0x88FF88; // Более мягкий зеленый цвет
        this.container.addChild(this.glowSprite);

        // Создаем спрайт вируса
        this.sprite = new PIXI.Sprite(this.resources.textures[this.textureName]);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.2); // Увеличиваем размер вируса
        this.container.addChild(this.sprite);

        // Создаем хитбокс
        this.hitbox = new PIXI.Rectangle(
            this.container.x - this.sprite.width * 0.3,
            this.container.y - this.sprite.height * 0.3,
            this.sprite.width * 0.6,
            this.sprite.height * 0.6
        );
    }

    update(delta) {
        if (!this.isActive) return;

        // Обновляем анимацию вертикального качания
        this.swingTime += this.swingSpeed * delta;
        const swingOffset = Math.sin(this.swingTime) * this.swingAmplitude;
        this.container.y = this.baseY + swingOffset;

        // Обновляем анимацию горизонтального качания
        this.horizontalSwingTime += this.horizontalSwingSpeed * delta;
        const horizontalSwing = Math.sin(this.horizontalSwingTime) * this.horizontalSwingAmplitude;
        this.container.rotation = horizontalSwing;

        // Обновляем анимацию свечения
        this.glowScale += this.glowScaleSpeed * this.glowScaleDirection * delta;
        if (this.glowScale > 1.2) {
            this.glowScale = 1.2;
            this.glowScaleDirection = -1;
        } else if (this.glowScale < 1.0) {
            this.glowScale = 1.0;
            this.glowScaleDirection = 1;
        }
        this.glowSprite.scale.set(this.glowScale * 0.8);

        // Обновляем хитбокс с учетом поворота
        const cos = Math.cos(horizontalSwing);
        const sin = Math.sin(horizontalSwing);
        const hitboxWidth = this.sprite.width * 0.6;
        const hitboxHeight = this.sprite.height * 0.6;
        
        // Вычисляем новые размеры хитбокса с учетом поворота
        const newWidth = Math.abs(hitboxWidth * cos) + Math.abs(hitboxHeight * sin);
        const newHeight = Math.abs(hitboxWidth * sin) + Math.abs(hitboxHeight * cos);
        
        this.hitbox.width = newWidth;
        this.hitbox.height = newHeight;
        this.hitbox.x = this.container.x - newWidth / 2;
        this.hitbox.y = this.container.y - newHeight / 2;
    }

    deactivate() {
        if (!this.isActive) return;
        this.isActive = false;
        if (this.container && this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
        this.container = null;
        this.sprite = null;
        this.glowSprite = null;
        this.hitbox = null;
    }
} 