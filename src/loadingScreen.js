import * as PIXI from 'pixi.js';

export class LoadingScreen {
    constructor(app) {
        this.app = app;
        this.container = new PIXI.Container();
        this.splashSprite = null;
        this.loadingSprites = [];
        this.currentLoadingIndex = 0;
        this.isVisible = false;
        this.loadingAnimationInterval = null;
        this.firefliesInfo = [];
        this.firefliesTime = 0;
    }

    async show() {
        try {
            // Загружаем загрузочный экран
            const bootSplashTexture = await PIXI.Assets.load('/img/boot_splash.png');

            // Создаем спрайт загрузочного экрана
            this.splashSprite = new PIXI.Sprite(bootSplashTexture);

            // Растягиваем изображение на весь экран с сохранением пропорций
            const scaleX = this.app.screen.width / this.splashSprite.width;
            const scaleY = this.app.screen.height / this.splashSprite.height;
            const scale = Math.max(scaleX, scaleY); // Используем Math.max для покрытия всего экрана

            this.splashSprite.scale.set(scale);

            // Центрируем изображение
            this.splashSprite.anchor.set(0.5);
            this.splashSprite.x = this.app.screen.width / 2;
            this.splashSprite.y = this.app.screen.height / 2;

            // Добавляем в контейнер
            this.container.addChild(this.splashSprite);

            // Создаем анимацию загрузки
            await this.createLoadingAnimation();

            // Создаем анимацию светлячков
            await this.createFirefliesAnimation();

            // Добавляем контейнер на сцену
            this.app.stage.addChild(this.container);

            this.isVisible = true;
            console.log('Loading screen shown');

        } catch (error) {
            console.error('Error loading splash screen:', error);
            // Если не удалось загрузить загрузочный экран, продолжаем без него
        }
    }

    async createLoadingAnimation() {
        try {
            // Загружаем текстуры загрузки
            const loadingAssets = await PIXI.Assets.load('/img/loading.json');

            // Создаем спрайты для анимации загрузки
            const loadingTextures = [
                loadingAssets.textures['loading_01.png'],
                loadingAssets.textures['loading_02.png'],
                loadingAssets.textures['loading_03.png'],
                loadingAssets.textures['loading_04.png']
            ];

            // Создаем спрайты и размещаем их по центру
            loadingTextures.forEach((texture, index) => {
                const sprite = new PIXI.Sprite(texture);
                sprite.anchor.set(0.5);
                sprite.x = this.app.screen.width / 2 - 20; // Смещаем на 20 пикселей влево
                sprite.y = this.app.screen.height / 2 + 230; // Опускаем на 230 пикселей ниже центра

                // Масштабируем спрайт загрузки (уменьшаем размер)
                const scaleX = this.app.screen.width / sprite.width * 0.14;
                const scaleY = this.app.screen.height / sprite.height * 0.14;
                const scale = Math.min(scaleX, scaleY);
                sprite.scale.set(scale);

                // Изначально скрываем все спрайты
                sprite.alpha = 0;

                this.loadingSprites.push(sprite);
                this.container.addChild(sprite);
            });

            // Запускаем анимацию
            this.startLoadingAnimation();

        } catch (error) {
            console.error('Error creating loading animation:', error);
        }
    }

    async createFirefliesAnimation() {
        try {
            // Загружаем текстуры светлячков
            const worldAssets = await PIXI.Assets.load('/img/WorldAssets-hd.json');

            const types = ['firefly_1.png', 'firefly_2.png', 'firefly_3.png', 'firefly_4.png', 'firefly_5.png'];
            const count = 25; // Увеличиваем количество светлячков для загрузочного экрана

            // Создаем светлячков
            for (let i = 0; i < count; i++) {
                const type = types[Math.floor(Math.random() * types.length)];
                const texture = worldAssets.textures[type];
                if (!texture) continue;

                const firefly = this.createFirefly(texture);
                this.container.addChild(firefly.sprite);
                this.firefliesInfo.push(firefly.info);
            }

            // Запускаем анимацию светлячков
            this.startFirefliesAnimation();

        } catch (error) {
            console.error('Error creating fireflies animation:', error);
        }
    }

    createFirefly(texture) {
        const firefly = new PIXI.Sprite(texture);

        // Распределяем светлячков по всему экрану
        firefly.x = Math.random() * this.app.screen.width;
        firefly.y = Math.random() * this.app.screen.height;

        firefly.anchor.set(0.5);
        firefly.alpha = 0.8;
        firefly.tint = 0x90FF90;

        const baseSize = 10 + Math.random() * 8; // Увеличиваем размер светлячков (было 6-12, теперь 10-18)
        firefly.width = baseSize;
        firefly.height = baseSize;

        return {
            sprite: firefly,
            info: {
                sprite: firefly,
                startX: firefly.x,
                startY: firefly.y,
                speed: 0.015 + Math.random() * 0.02,
                angle: Math.random() * Math.PI * 2,
                angleSpeed: 0.001 + Math.random() * 0.002,
                glowSpeed: 0.08 + Math.random() * 0.12,
                glowOffset: Math.random() * Math.PI * 2,
                radius: 20 + Math.random() * 40,
                verticalSpeed: 0.008 + Math.random() * 0.012,
                verticalOffset: Math.random() * Math.PI * 2,
                secondaryRadius: 10 + Math.random() * 15,
                secondarySpeed: 0.012 + Math.random() * 0.018,
                secondaryOffset: Math.random() * Math.PI * 2
            }
        };
    }

    startFirefliesAnimation() {
        this.firefliesTime = 0;
        this.firefliesAnimationFunction = (delta) => {
            this.firefliesTime += 0.001;

            this.firefliesInfo.forEach(info => {
                // Основное движение по кругу
                info.sprite.x = info.startX + Math.cos(info.angle) * info.radius;
                info.sprite.y = info.startY + Math.sin(info.angle) * info.radius;
                info.angle += info.angleSpeed;

                // Вертикальное движение
                info.sprite.y += Math.sin(this.firefliesTime * info.verticalSpeed + info.verticalOffset) * 0.3;

                // Вторичное движение
                info.sprite.x += Math.cos(this.firefliesTime * info.secondarySpeed + info.secondaryOffset) * info.secondaryRadius * 0.08;
                info.sprite.y += Math.sin(this.firefliesTime * info.secondarySpeed + info.secondaryOffset) * info.secondaryRadius * 0.08;

                // Пульсация свечения
                const glow = Math.sin(this.firefliesTime * info.glowSpeed + info.glowOffset) * 0.2 + 0.6;
                info.sprite.alpha = glow;
            });
        };

        this.app.ticker.add(this.firefliesAnimationFunction);
    }

    startLoadingAnimation() {
        // Показываем первый спрайт
        this.showLoadingSprite(0);

        // Запускаем интервал для смены спрайтов
        this.loadingAnimationInterval = setInterval(() => {
            this.currentLoadingIndex = (this.currentLoadingIndex + 1) % this.loadingSprites.length;
            this.showLoadingSprite(this.currentLoadingIndex);
        }, 500); // Смена каждые 500мс
    }

    showLoadingSprite(index) {
        // Скрываем все спрайты
        this.loadingSprites.forEach((sprite, i) => {
            if (i === index) {
                sprite.alpha = 1;
            } else {
                sprite.alpha = 0;
            }
        });
    }

    hide() {
        if (this.isVisible && this.container.parent) {
            // Останавливаем анимацию загрузки
            if (this.loadingAnimationInterval) {
                clearInterval(this.loadingAnimationInterval);
                this.loadingAnimationInterval = null;
            }

            // Останавливаем анимацию светлячков
            if (this.app.ticker && this.firefliesAnimationFunction) {
                this.app.ticker.remove(this.firefliesAnimationFunction);
            }

            // Очищаем светлячков
            this.firefliesInfo.forEach(info => {
                if (info.sprite && info.sprite.parent) {
                    info.sprite.parent.removeChild(info.sprite);
                    info.sprite.destroy();
                }
            });
            this.firefliesInfo = [];

            this.app.stage.removeChild(this.container);
            this.isVisible = false;
            console.log('Loading screen hidden');
        }
    }

    // Обновляем размер при изменении размера окна
    resize() {
        if (this.splashSprite && this.isVisible) {
            const scaleX = this.app.screen.width / this.splashSprite.width;
            const scaleY = this.app.screen.height / this.splashSprite.height;
            const scale = Math.max(scaleX, scaleY);

            this.splashSprite.scale.set(scale);
            this.splashSprite.x = this.app.screen.width / 2;
            this.splashSprite.y = this.app.screen.height / 2;
        }

        // Обновляем позиции спрайтов загрузки
        this.loadingSprites.forEach(sprite => {
            sprite.x = this.app.screen.width / 2 - 20; // Смещаем на 20 пикселей влево
            sprite.y = this.app.screen.height / 2 + 230; // Опускаем на 200 пикселей ниже центра

            const scaleX = this.app.screen.width / sprite.width * 0.14;
            const scaleY = this.app.screen.height / sprite.height * 0.14;
            const scale = Math.min(scaleX, scaleY);
            sprite.scale.set(scale);
        });

        // Обновляем позиции светлячков
        this.firefliesInfo.forEach(info => {
            // Пересчитываем начальные позиции для нового размера экрана
            if (info.startX > this.app.screen.width) {
                info.startX = Math.random() * this.app.screen.width;
            }
            if (info.startY > this.app.screen.height) {
                info.startY = Math.random() * this.app.screen.height;
            }
        });
    }
}
