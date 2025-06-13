import * as PIXI from 'pixi.js';

export class Vaccine {
    constructor(app, resources, x, y, sceneManager) {
        this.app = app;
        this.resources = resources;
        this.x = x;
        this.y = y;
        this.isActive = true;
        this.sceneManager = sceneManager;
        this.isSmiling = false;

        // Параметры для анимации качания
        this.swingAmplitude = 5; // Амплитуда качания
        this.swingSpeed = 0.02; // Скорость качания
        this.swingTime = Math.random() * Math.PI * 2; // Начальная фаза (случайная)
        this.baseY = y; // Сохраняем базовую Y-координату

        this.init();
    }

    init() {
        // Создаем спрайт вакцины
        this.sprite = new PIXI.Sprite(this.resources.textures['vaccine.png']);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.17);
        this.sprite.x = this.x;
        this.sprite.y = this.y;

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

        // Обновляем анимацию качания
        this.swingTime += this.swingSpeed * delta;
        const swingOffset = Math.sin(this.swingTime) * this.swingAmplitude;
        this.sprite.y = this.baseY + swingOffset;

        // Обновляем хитбокс
        this.hitbox.x = this.sprite.x - this.sprite.width * 0.25;
        this.hitbox.y = this.sprite.y - this.sprite.height * 0.25;
    }

    startSmiling() {
        // Добавляем задержку перед показом улыбки
        setTimeout(() => {
            this.isSmiling = true;
            // Можно добавить специальную текстуру для улыбающейся вакцины, если она есть
            // this.sprite.texture = this.resources.textures['vaccine_smiling.png'];
        }, 500); // 500мс задержка
    }

    deactivate() {
        if (!this.isActive) return;
        this.isActive = false;
        if (this.sprite && this.sprite.parent) {
            this.sprite.parent.removeChild(this.sprite);
        }
        this.sprite = null;
        this.hitbox = null;
    }
} 