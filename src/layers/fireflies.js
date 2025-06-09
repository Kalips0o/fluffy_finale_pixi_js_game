import * as PIXI from 'pixi.js';

export class Fireflies {
    constructor(app, resources) {
        this.app = app;
        this.resources = resources;
        this.firefliesInfo = [];
        this.time = 0;
        this.container = null;
    }

    draw(container) {
        this.container = container;
        const types = ['firefly_1.png', 'firefly_2.png', 'firefly_3.png', 'firefly_4.png', 'firefly_5.png'];
        const count = 40;
        const screenWidth = this.app.screen.width;

        // Создаем светлячков для двух экранов
        for (let screen = 0; screen < 2; screen++) {
            for (let i = 0; i < count; i++) {
                const type = types[Math.floor(Math.random() * types.length)];
                const texture = this.resources.textures[type];
                if (!texture) continue;

                const firefly = this.createFirefly(texture, screen * screenWidth);
                container.addChild(firefly.sprite);
                this.firefliesInfo.push(firefly.info);
            }
        }

        this.setupAnimation();
    }

    createFirefly(texture, baseX) {
        const firefly = new PIXI.Sprite(texture);

        // Распределяем светлячков по всей высоте экрана
        const grassY = this.getGrassY();
        const minY = 0;
        const maxY = grassY + 200; // Добавляем область ниже травы
        firefly.y = minY + Math.random() * (maxY - minY);
        
        // Распределяем по всей ширине экрана
        firefly.x = baseX + Math.random() * this.app.screen.width;
        
        firefly.anchor.set(0.5);
        firefly.alpha = 1;
        firefly.tint = 0x90FF90;

        const baseSize = 8 + Math.random() * 8;
        firefly.width = baseSize;
        firefly.height = baseSize;

        return {
            sprite: firefly,
            info: {
                sprite: firefly,
                startX: firefly.x,
                startY: firefly.y,
                speed: 0.02 + Math.random() * 0.03,
                angle: Math.random() * Math.PI * 2,
                angleSpeed: 0.001 + Math.random() * 0.002,
                glowSpeed: 0.1 + Math.random() * 0.15,
                glowOffset: Math.random() * Math.PI * 2,
                radius: 15 + Math.random() * 30,
                verticalSpeed: 0.01 + Math.random() * 0.015,
                verticalOffset: Math.random() * Math.PI * 2,
                secondaryRadius: 8 + Math.random() * 12,
                secondarySpeed: 0.015 + Math.random() * 0.02,
                secondaryOffset: Math.random() * Math.PI * 2,
                tertiarySpeed: 0.008 + Math.random() * 0.012,
                tertiaryOffset: Math.random() * Math.PI * 2,
                colorSpeed: 0.2 + Math.random() * 0.3,
                colorOffset: Math.random() * Math.PI * 2,
                baseX: firefly.x
            }
        };
    }

    getGrassY() {
        const desiredSoilHeight = 130;
        const soilScale = desiredSoilHeight / this.resources.textures['soil.png'].height;
        const soilY = Math.round(this.app.screen.height - desiredSoilHeight);
        return soilY + desiredSoilHeight - Math.floor(this.resources.textures['grass.png'].height * 1.3);
    }

    setupAnimation() {
        this.app.ticker.add(() => {
            this.time += 0.002;
            this.firefliesInfo.forEach(info => {
                // Основное движение по кругу
                info.sprite.x = info.baseX + Math.cos(info.angle) * info.radius;
                info.sprite.y = info.startY + Math.sin(info.angle) * info.radius;
                info.angle += info.angleSpeed;

                // Вертикальное движение
                info.sprite.y += Math.sin(this.time * info.verticalSpeed + info.verticalOffset) * 0.5;

                // Вторичное движение
                info.sprite.x += Math.cos(this.time * info.secondarySpeed + info.secondaryOffset) * info.secondaryRadius * 0.1;
                info.sprite.y += Math.sin(this.time * info.secondarySpeed + info.secondaryOffset) * info.secondaryRadius * 0.1;

                // Третичное движение для более сложной траектории
                info.sprite.x += Math.cos(this.time * info.tertiarySpeed + info.tertiaryOffset) * 2;
                info.sprite.y += Math.sin(this.time * info.tertiarySpeed + info.tertiaryOffset) * 2;

                // Пульсация свечения
                const glow = Math.sin(this.time * info.glowSpeed + info.glowOffset) * 0.3 + 0.7;
                info.sprite.alpha = glow;

                // Изменение цвета
                const hue = (Math.sin(this.time * info.colorSpeed + info.colorOffset) * 0.1 + 0.1) * 360;
                info.sprite.tint = PIXI.utils.rgb2hex([
                    Math.sin(hue * Math.PI / 180) * 0.5 + 0.5,
                    Math.sin((hue + 120) * Math.PI / 180) * 0.5 + 0.5,
                    Math.sin((hue + 240) * Math.PI / 180) * 0.5 + 0.5
                ]);
            });
        });
    }

    updatePosition(camera) {
        const worldX = camera.currentX;
        const screenWidth = this.app.screen.width;

        this.firefliesInfo.forEach(info => {
            const baseX = info.baseX;
            const offset = Math.floor(worldX / screenWidth) * screenWidth;
            info.baseX = baseX - offset;
        });
    }
}
