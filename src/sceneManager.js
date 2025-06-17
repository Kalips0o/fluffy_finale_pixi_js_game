import * as PIXI from 'pixi.js';
import { Background } from './layers/background';
import { Foliage } from './layers/foliage';
import { Garlands } from './layers/garlands';
import { Fireflies } from './layers/fireflies';
import { Ground } from './layers/ground';
import { Trees } from './layers/trees';
import { Rabbit } from './entities/rabbit/rabbit';
import { Camera } from './camera';
import { DoctorManager } from './entities/doctor/doctor-manager';
import { VaccineManager } from './entities/vaccine/vaccine-manager';
import { VirusManager } from './entities/virus/virus-manager';
import { BloodSplatter } from './entities/effects/BloodSplatter';

export class SceneManager {
    constructor(app, resources) {
        this.app = app;
        this.resources = resources;
        this.isPaused = false;
        this.isGameRunning = true;
        this.countersShown = false; // Флаг для отслеживания показа счетчиков
        this.virusCount = 0; // Добавляем счетчик вирусов
        this.bestScore = 0; // Лучший результат

        // Создаем контейнеры
        this.camera = new Camera(app);
        this.worldContainer = new PIXI.Container();
        this.app.stage.addChild(this.camera.container);
        this.camera.container.addChild(this.worldContainer);

        // Инициализируем все слои
        this.initializeLayers();

        // Создаем зайца
        this.rabbit = new Rabbit(app, resources, this);
        this.worldContainer.addChildAt(this.rabbit.sprite, 0);  // Добавляем кролика на самый задний план
        this.camera.setTarget(this.rabbit);

        // Создаем менеджер докторов
        this.doctorManager = new DoctorManager(app, resources, this);
        this.doctorManager.init();

        // Создаем менеджер вакцин
        this.vaccineManager = new VaccineManager(app, this.worldContainer, this);
        this.vaccineManager.init();

        // Создаем менеджер вирусов
        this.virusManager = new VirusManager(app, this.worldContainer, this);
        this.virusManager.init();

        this.bloodSplatterEffects = [];
        this.cameraBloodSplatterEffects = []; // New array for camera blood splatters
        if (this.doctorManager) {
            this.doctorManager.doctors.forEach(doctor => {
                if (doctor.isActive) {
                    this.worldContainer.addChild(doctor.sprite);
                }
            });
        }

        // Устанавливаем начальную позицию кролика (200 пикселей от левого края)
        this.rabbitStartX = 200;
        this.rabbit.sprite.x = this.rabbitStartX;
        this.camera.currentX = 0;

        // Устанавливаем границы для камеры
        this.camera.minX = 0;
        this.camera.maxX = 10000; // Достаточно большое значение для бесконечной прокрутки

        // Сначала отрисовываем сцену
        this.drawScene();

        // Добавляем кнопку паузы
        this.createPauseButton();

        // Создаем счетчик вирусов
        this.createVirusCounter();

        // Добавляем обновление состояния зайца и камеры в игровой цикл
        this.app.ticker.add((delta) => {
            if (!this.isPaused) {
                this.rabbit.update(delta);
                this.camera.update();
                this.doctorManager.update(delta);
                this.vaccineManager.update(delta);
                this.virusManager.update(delta);

                // Update blood splatter effects
                for (let i = this.bloodSplatterEffects.length - 1; i >= 0; i--) {
                    const splatter = this.bloodSplatterEffects[i];
                    splatter.update(delta);
                    if (splatter.splatters.length === 0) {
                        this.bloodSplatterEffects.splice(i, 1);
                    }
                }

                // Update camera blood splatter effects
                for (let i = this.cameraBloodSplatterEffects.length - 1; i >= 0; i--) {
                    const splatter = this.cameraBloodSplatterEffects[i];
                    splatter.alpha -= splatter.fadeSpeed * delta;
                    if (splatter.alpha <= 0) {
                        if (splatter.parent) {
                            this.app.stage.removeChild(splatter);
                        }
                        this.cameraBloodSplatterEffects.splice(i, 1);
                    }
                }
                this.updateWorldPosition();
                this.updateSpriteZOrder();
            }
        });

        // Добавляем обработчик изменения размера окна
        window.addEventListener('resize', () => {
            this.drawScene();
        });
    }

    createPauseButton() {
        // Create pause button
        const pauseButton = new PIXI.Sprite(PIXI.Texture.from('assets/hud/pause.png'));
        pauseButton.anchor.set(0.5);
        pauseButton.scale.set(0.5); // Изначально уменьшена для анимации
        pauseButton.x = this.app.screen.width - 120;
        pauseButton.y = this.app.screen.height - 150;
        pauseButton.interactive = true;
        pauseButton.buttonMode = true;
        pauseButton.visible = false; // Initially hidden
        pauseButton.alpha = 0; // Изначально прозрачна

        // Add hover effects
        pauseButton.on('pointerover', () => {
            pauseButton.scale.set(0.33);
            pauseButton.tint = 0xDDDDDD;
        });
        pauseButton.on('pointerout', () => {
            pauseButton.scale.set(0.3);
            pauseButton.tint = 0xFFFFFF;
        });

        pauseButton.on('pointerdown', () => {
            this.togglePause();
        });

        this.app.stage.addChild(pauseButton);
        this.pauseButton = pauseButton;
    }

    createPausePanel() {
        // Create pause panel container
        const pausePanel = new PIXI.Container();

        // Create background panel
        const panelBg = new PIXI.Sprite(PIXI.Texture.from('assets/hud/pausedPanel.png'));
        panelBg.anchor.set(0.5);
        panelBg.x = this.app.screen.width / 2;
        panelBg.y = this.app.screen.height / 2;
        panelBg.scale.set(0.6);
        pausePanel.addChild(panelBg);

        // Create sound button
        const soundButton = new PIXI.Sprite(PIXI.Texture.from('assets/hud/soundOn.png'));
        soundButton.anchor.set(0.5);
        soundButton.x = this.app.screen.width / 2 - 160;
        soundButton.y = this.app.screen.height / 2;
        soundButton.scale.set(0.32);
        soundButton.interactive = true;
        soundButton.buttonMode = true;

        // Add hover effects
        soundButton.on('pointerover', () => {
            soundButton.scale.set(0.35);
            soundButton.tint = 0xDDDDDD;
        });
        soundButton.on('pointerout', () => {
            soundButton.scale.set(0.32);
            soundButton.tint = 0xFFFFFF;
        });

        // Add click handler to toggle sound button texture
        soundButton.on('pointerdown', () => {
            const currentTexture = soundButton.texture;
            if (currentTexture === PIXI.Texture.from('assets/hud/soundOn.png')) {
                soundButton.texture = PIXI.Texture.from('assets/hud/soundOff.png');
            } else {
                soundButton.texture = PIXI.Texture.from('assets/hud/soundOn.png');
            }
        });

        pausePanel.addChild(soundButton);

        // Create continue button
        const continueButton = new PIXI.Sprite(PIXI.Texture.from('assets/hud/ContinuePlay.png'));
        continueButton.anchor.set(0.5);
        continueButton.x = this.app.screen.width / 2;
        continueButton.y = this.app.screen.height / 2;
        continueButton.scale.set(0.32);
        continueButton.interactive = true;
        continueButton.buttonMode = true;

        // Add hover effects
        continueButton.on('pointerover', () => {
            continueButton.scale.set(0.35);
            continueButton.tint = 0xDDDDDD;
        });
        continueButton.on('pointerout', () => {
            continueButton.scale.set(0.32);
            continueButton.tint = 0xFFFFFF;
        });

        continueButton.on('pointerdown', () => {
            this.togglePause();
        });
        pausePanel.addChild(continueButton);

        // Create restart button
        const restartButton = new PIXI.Sprite(PIXI.Texture.from('assets/hud/RestartPlay.png'));
        restartButton.anchor.set(0.5);
        restartButton.x = this.app.screen.width / 2 + 160;
        restartButton.y = this.app.screen.height / 2;
        restartButton.scale.set(0.32);
        restartButton.interactive = true;
        restartButton.buttonMode = true;

        // Add hover effects
        restartButton.on('pointerover', () => {
            restartButton.scale.set(0.35);
            restartButton.tint = 0xDDDDDD;
        });
        restartButton.on('pointerout', () => {
            restartButton.scale.set(0.32);
            restartButton.tint = 0xFFFFFF;
        });

        restartButton.on('pointerdown', () => {
            window.location.reload();
        });
        pausePanel.addChild(restartButton);

        this.app.stage.addChild(pausePanel);
        this.pausePanel = pausePanel;
        pausePanel.visible = false;
    }

    togglePause() {
        // Не позволяем ставить на паузу, если игра окончена
        if (this.rabbit.physics.gameOver) return;

        this.isPaused = !this.isPaused;

        if (!this.pausePanel) {
            this.createPausePanel();
        }

        this.pausePanel.visible = this.isPaused;

        // Показываем/скрываем кнопку паузы
        if (this.isPaused) {
            this.pauseButton.visible = false;
        } else {
            // При возобновлении игры показываем кнопку паузы с анимацией
            if (this.countersShown) { // Только если счетчики уже были показаны
                this.showPauseButtonWithAnimation();
            }
        }
    }

    initializeLayers() {
        // Проверяем наличие всех необходимых текстур
        const checkTexture = (name) => {
            if (!this.resources.textures[name]) {
                console.error(`Missing texture: ${name}`);
                return false;
            }
            return true;
        };

        // Проверяем основные текстуры
        const hasBasicTextures = checkTexture('bg.png') &&
                               checkTexture('soil.png') &&
                               checkTexture('grass.png');

        if (!hasBasicTextures) {
            console.error('Missing basic textures');
            return;
        }

        // Инициализируем слои
        this.layers = {
            background: new Background(this.app, this.resources),
            backFoliage: new Foliage(this.app, this.resources, 'violet_foliage.png'),
            backGarlands: new Garlands(this.app, this.resources, true),
            frontFoliage: new Foliage(this.app, this.resources, 'violet_foliage.png'),
            fireflies: new Fireflies(this.app, this.resources),
            ground: new Ground(this.app, this.resources),
            trees: new Trees(this.app, this.resources),
            frontGarlands: new Garlands(this.app, this.resources, false),
            topFoliage: new Foliage(this.app, this.resources, 'foliage.png')
        };

        // Устанавливаем ссылку на кролика в слое земли
        this.layers.ground.setRabbit(this.rabbit);
    }

    updateWorldPosition() {
        // Show pause button when camera starts moving and game is not over
        if (this.camera.currentX > 0 && !this.pauseButton.visible && !this.rabbit.physics.gameOver) {
            // Показываем кнопку паузы с анимацией
            this.showPauseButtonWithAnimation();

            // Показываем счетчики с анимацией одновременно с кнопкой паузы
            this.showCountersWithAnimation();
        }

        // Обновляем позицию всех слоев относительно камеры
        Object.values(this.layers).forEach(layer => {
            if (layer.updatePosition) {
                layer.updatePosition(this.camera);
            }
        });
    }

    drawScene() {
        // Очищаем и перерисовываем только слои. Кролик и доктора остаются в worldContainer.
        // Для этого нужно, чтобы каждый слой имел метод 'cleanup' или чтобы их спрайты не добавлялись повторно.
        // Если слои рисуют свои спрайты каждый раз, то нужно удалить старые.
        // Проверим, имеют ли слои метод 'clear' или 'removeChildren' для своих внутренних спрайтов.

        // Временно, чтобы решить проблему с дублированием, будем очищать все слои
        // и перерисовывать их, но оставим кролика и докторов.
        // Нам нужно убедиться, что слои могут корректно удалять свои предыдущие отрисовки.

        // Обновляем слои
        this.layers.background.draw(this.worldContainer);
        this.layers.backFoliage.draw(this.worldContainer);
        this.layers.backGarlands.draw(this.worldContainer);
        this.layers.frontFoliage.draw(this.worldContainer);
        this.layers.fireflies.draw(this.worldContainer);
        this.layers.ground.draw(this.worldContainer);
        this.layers.trees.draw(this.worldContainer);
        this.layers.frontGarlands.draw(this.worldContainer);
        this.layers.topFoliage.draw(this.worldContainer);

        // Кролик и доктора уже добавлены в worldContainer и не удаляются.
        // Их порядок отрисовки относительно слоев будет определяться порядком добавления в worldContainer.
        // Если нужно, чтобы они были поверх всех слоев, их нужно добавлять после всех слоев.
        // Так как они были добавлены в конструкторе, они могут быть под какими-то слоями.
        // Лучше всего их переместить наверх, если они должны быть всегда поверх.
        if (this.doctorManager) {
            this.doctorManager.doctors.forEach(doctor => {
                if (doctor.isActive) {
                    this.worldContainer.setChildIndex(doctor.sprite, this.worldContainer.children.length - 1);
                }
            });
        }
        this.worldContainer.setChildIndex(this.rabbit.sprite, this.worldContainer.children.length - 1); // Перемещаем кролика на самый верхний слой

        // Перемещаем отладочный контейнер на самый верх
        if (this.doctorManager && this.doctorManager.debugContainer) {
            this.worldContainer.setChildIndex(this.doctorManager.debugContainer, this.worldContainer.children.length - 1);
        }
    }

    // Добавляем метод для принудительной перерисовки сцены
    redrawScene() {
        this.drawScene();
    }

    // Новый метод для управления z-порядком спрайтов
    updateSpriteZOrder() {
        // Убедимся, что доктора добавлены в worldContainer, а затем установим их z-индекс.
        // Это важно, потому что новые доктора появляются в каждом кадре в DoctorManager.update
        // и добавляются в worldContainer в этот момент.
        // Нам нужно заново установить позицию кролика после добавления новых докторов.
        if (this.doctorManager) {
            this.doctorManager.doctors.forEach(doctor => {
                if (doctor.isActive && doctor.sprite && doctor.sprite.parent === this.worldContainer) {
                    // Ставим доктора перед кроликом, но не на самый верх
                    this.worldContainer.setChildIndex(doctor.sprite, this.worldContainer.children.length - 2);
                }
            });
        }

        // Всегда помещаем кролика на самый верхний слой
        if (this.rabbit && this.rabbit.sprite && this.rabbit.sprite.parent === this.worldContainer) {
            this.worldContainer.setChildIndex(this.rabbit.sprite, this.worldContainer.children.length - 1);
        }

        // Перемещаем отладочный контейнер на самый верх
        if (this.doctorManager && this.doctorManager.debugContainer) {
            this.worldContainer.setChildIndex(this.doctorManager.debugContainer, this.worldContainer.children.length - 1);
        }

        // Перемещаем частицы крови на самый верхний слой
        this.bloodSplatterEffects.forEach(bloodSplatterInstance => {
            bloodSplatterInstance.splatters.forEach(splatterParticle => {
                if (splatterParticle && splatterParticle.parent === this.worldContainer) {
                    this.worldContainer.setChildIndex(splatterParticle, this.worldContainer.children.length - 1);
                }
            });
        });
    }

    // Метод для добавления эффектов крови
    addBloodSplatter(splatter) {
        this.bloodSplatterEffects.push(splatter);
    }

    // Метод для добавления эффектов крови на камеру
    addCameraBloodSplatter() {
        // Create one large blood splatter on the camera
        const splatterTextureName = Math.random() < 0.5 ? 'blood_spatter_1.png' : 'blood_spatter_3.png';
        const splatter = new PIXI.Sprite(this.resources.textures[splatterTextureName]);
        splatter.anchor.set(0.5);
        splatter.scale.set(6.0 + Math.random() * 3.0); // Extremely large scale to ensure full screen coverage

        if (splatterTextureName === 'blood_spatter_1.png') {
            // Position for blood_spatter_1.png (bottom-left corner)
            splatter.x = this.app.screen.width * 0.2;
            splatter.y = this.app.screen.height * 0.8;
        } else {
            // Randomly position on left or right side of the screen for other splatters
            if (Math.random() < 0.5) {
                splatter.x = this.app.screen.width * 0.2 + Math.random() * this.app.screen.width * 0.1; // Left side
            } else {
                splatter.x = this.app.screen.width * 0.8 - Math.random() * this.app.screen.width * 0.1; // Right side
            }
            splatter.y = this.app.screen.height * 0.5 + (Math.random() - 0.5) * this.app.screen.height * 0.2; // Vertical position slightly randomized around center
        }

        splatter.rotation = Math.random() * Math.PI * 2;
        splatter.alpha = 1;
        splatter.fadeSpeed = 0.005 + Math.random() * 0.005; // Faster fade for a more noticeable disappearance
        this.cameraBloodSplatterEffects.push(splatter);
        this.app.stage.addChild(splatter);
    }

    showPausePanel() {
        if (!this.pausePanel) {
            this.pausePanel = new PIXI.Container();
            this.pausePanel.alpha = 0;
            this.pausePanel.scale.set(0.1); // Начинаем с очень маленького размера
            this.pausePanel.x = this.app.screen.width / 2;
            this.pausePanel.y = this.app.screen.height / 2;
            this.pausePanel.pivot.set(0.5);
            this.app.stage.addChild(this.pausePanel);

            const panel = new PIXI.Sprite(this.resources.textures['rules_of_the_game.png']);
            panel.anchor.set(0.5);
            this.pausePanel.addChild(panel);

            const continueButton = new PIXI.Sprite(this.resources.textures['3_ready.png']);
            continueButton.anchor.set(0.5);
            continueButton.x = 0;
            continueButton.y = 100;
            continueButton.scale.set(0.2);
            continueButton.eventMode = 'static';
            continueButton.cursor = 'pointer';
            continueButton.on('pointerdown', () => {
                this.hidePausePanel();
                this.isPaused = false;
            });
            this.pausePanel.addChild(continueButton);

            const restartButton = new PIXI.Sprite(this.resources.textures['2_set.png']);
            restartButton.anchor.set(0.5);
            restartButton.x = 0;
            restartButton.y = 200;
            restartButton.scale.set(0.2);
            restartButton.eventMode = 'static';
            restartButton.cursor = 'pointer';
            restartButton.on('pointerdown', () => {
                window.location.reload();
            });
            this.pausePanel.addChild(restartButton);
        }

        this.pausePanel.visible = true;
        this.isPaused = true;

        // Анимация появления
        const duration = 1200; // Увеличиваем длительность для более плавной анимации
        const startTime = Date.now();
        const startScale = 0.1; // Начинаем с очень маленького размера
        const endScale = 0.4; // Увеличиваем конечный размер
        const startAlpha = 0;
        const endAlpha = 1;

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Используем более плавную функцию для масштабирования
            const scale = startScale + (endScale - startScale) * this.easeOutElastic(progress);
            const alpha = startAlpha + (endAlpha - startAlpha) * this.easeOutQuad(progress);

            this.pausePanel.scale.set(scale);
            this.pausePanel.alpha = alpha;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // Функция для эластичного эффекта
    easeOutElastic(x) {
        const c4 = (2 * Math.PI) / 3;
        return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }

    // Функция для плавного появления
    easeOutQuad(x) {
        return 1 - (1 - x) * (1 - x);
    }

    update(delta) {
        if (this.isPaused) return;

        // Проверяем, не окончена ли игра
        if (this.rabbit && this.rabbit.physics && this.rabbit.physics.gameOver) {
            return; // Останавливаем обновление игры, если кролик умер
        }

        // Обновляем камеру
        this.camera.update(delta);

        // Обновляем все слои
        Object.values(this.layers).forEach(layer => layer.updatePosition(this.camera));

        // Обновляем кролика
        this.rabbit.update(delta);

        // Обновляем докторов
        if (this.doctorManager) {
            this.doctorManager.update(delta);
        }

        // Обновляем вакцины
        if (this.vaccineManager) {
            this.vaccineManager.update(delta);
        }

        // Обновляем вирусы
        if (this.virusManager) {
            this.virusManager.update(delta);
        }

        // Обновляем эффекты крови
        this.updateBloodSplatters(delta);
        this.updateCameraBloodSplatters(delta);

        // Обновляем z-порядок спрайтов
        this.updateSpriteZOrder();
    }

    cleanup() {
        // Очищаем все слои
        Object.values(this.layers).forEach(layer => {
            if (layer.cleanup) {
                layer.cleanup();
            }
        });

        // Очищаем докторов
        if (this.doctorManager) {
            this.doctorManager.cleanup();
        }

        // Очищаем вакцины
        if (this.vaccineManager) {
            this.vaccineManager.cleanup();
        }

        // Очищаем вирусы
        if (this.virusManager) {
            this.virusManager.cleanup();
        }

        // Очищаем эффекты крови
        this.bloodSplatterEffects.forEach(effect => effect.cleanup());
        this.bloodSplatterEffects = [];
        this.cameraBloodSplatterEffects.forEach(effect => effect.cleanup());
        this.cameraBloodSplatterEffects = [];

        // Очищаем кролика
        if (this.rabbit) {
            this.rabbit.cleanup();
        }
    }

    createVirusCounter() {
        // Создаем контейнер для счетчика
        this.virusCounterContainer = new PIXI.Container();
        this.virusCounterContainer.x = this.app.screen.width - 570; // Перемещаем весь счетчик еще правее
        this.virusCounterContainer.y = 70; // Та же высота, что и у шкалы
        this.virusCounterContainer.alpha = 0; // Изначально скрыт
        this.virusCounterContainer.scale.set(0.5); // Изначально уменьшен
        this.app.stage.addChild(this.virusCounterContainer);

        // Создаем спрайты для цифр
        this.virusDigitSprites = [];
        for (let i = 0; i < 4; i++) { // Поддерживаем до 9999 вирусов
            const digitSprite = new PIXI.Sprite(this.resources.textures['0.png']);
            digitSprite.anchor.set(0.5);
            digitSprite.scale.set(0.3);
            digitSprite.x = i * 65;
            digitSprite.visible = true;
            this.virusCounterContainer.addChild(digitSprite);
            this.virusDigitSprites.push(digitSprite);
        }

        // Добавляем запятую (изначально скрыта)
        this.commaSprite = new PIXI.Sprite(this.resources.textures['comma.png']);
        this.commaSprite.anchor.set(0.5);
        this.commaSprite.scale.set(0.15);
        this.commaSprite.x = -10; // Изначальное положение запятой (будет переопределено)
        this.commaSprite.visible = false;
        this.virusCounterContainer.addChild(this.commaSprite);

        this.createVirulenceBar();

        // Обновляем отображение счетчика
        this.updateVirusCounter();
    }

    createVirulenceBar() {
        this.virulenceBarContainer = new PIXI.Container();
        this.virulenceBarContainer.x = this.app.screen.width - 172; // Располагаем справа в углу
        this.virulenceBarContainer.y = 70; // Та же высота, что и у счетчика
        this.virulenceBarContainer.alpha = 0; // Изначально скрыт
        this.virulenceBarContainer.scale.set(0.5); // Изначально уменьшен
        this.app.stage.addChild(this.virulenceBarContainer);

        // Background of the virulence bar (skale.png) - добавляем первым (будет на заднем плане)
        this.virulenceBarBackground = new PIXI.Sprite(this.resources.textures['skale.png']);
        this.virulenceBarBackground.scale.set(32 / 37); // Увеличиваем масштаб, чтобы высота стала примерно 30 пикселей
        this.virulenceBarBackground.anchor.set(0.5);
        this.virulenceBarBackground.x = 0;
        this.virulenceBarBackground.y = 0;
        this.virulenceBarContainer.addChild(this.virulenceBarBackground);

        // Green filling for the virulence bar
        this.virulenceBarFill = new PIXI.Graphics();
        this.virulenceBarFill.beginFill(0x00FF00);
        this.virulenceBarFill.drawRect(0, 0, 0, this.virulenceBarBackground.height * 0.9); // Slightly smaller than background
        this.virulenceBarFill.endFill();
        this.virulenceBarFill.x = -this.virulenceBarBackground.width * 0.5;
        this.virulenceBarFill.y = -this.virulenceBarBackground.height * 0.35;
        this.virulenceBarContainer.addChild(this.virulenceBarFill);

        // Add the virulence sign (table.png) - добавляем последним (будет на переднем плане)
        this.virulenceSign = new PIXI.Sprite(this.resources.textures['table.png']);
        this.virulenceSign.anchor.set(0.5);
        this.virulenceSign.scale.set(0.3);
        this.virulenceSign.x = 0;
        this.virulenceSign.y = 0;
        this.virulenceBarContainer.addChild(this.virulenceSign);

        // Добавляем элемент "Best" под табличкой вирулентности
        this.createBestScore();

        this.updateVirulenceBar();
    }

    createBestScore() {
        // Создаем контейнер для лучшего результата
        this.bestScoreContainer = new PIXI.Container();
        this.bestScoreContainer.x = this.app.screen.width - 172; // Та же позиция X что и у таблички вирулентности
        this.bestScoreContainer.y = 145; // Под табличкой вирулентности
        this.bestScoreContainer.alpha = 0; // Изначально скрыт
        this.bestScoreContainer.scale.set(0.7); // Изначально уменьшен
        this.app.stage.addChild(this.bestScoreContainer);

        // Добавляем картинку "best" из текстур
        this.bestSprite = new PIXI.Sprite(this.resources.textures['best.png']);
        this.bestSprite.anchor.set(0.5);
        this.bestSprite.scale.set(0.3); // Уменьшаем размер слова BEST еще
        this.bestSprite.x = -50; // Смещаем левее
        this.bestSprite.y = 5;
        this.bestScoreContainer.addChild(this.bestSprite);

        // Создаем спрайты для цифр лучшего результата
        this.bestDigitSprites = [];
        for (let i = 0; i < 4; i++) { // Поддерживаем до 9999 вирусов
            const digitSprite = new PIXI.Sprite(this.resources.textures['0.png']);
            digitSprite.anchor.set(0.5);
            digitSprite.scale.set(0.13); // Уменьшаем размер цифр
            digitSprite.x = 60 * i; // Промежуток между цифрами
            digitSprite.visible = true;
            this.bestScoreContainer.addChild(digitSprite);
            this.bestDigitSprites.push(digitSprite);
        }

        // Добавляем запятую для лучшего результата (изначально скрыта)
        this.bestCommaSprite = new PIXI.Sprite(this.resources.textures['comma.png']);
        this.bestCommaSprite.anchor.set(0.5);
        this.bestCommaSprite.scale.set(0.12); // Уменьшаем размер запятой
        this.bestCommaSprite.x = -15;
        this.bestCommaSprite.visible = false;
        this.bestScoreContainer.addChild(this.bestCommaSprite);

        // Загружаем лучший результат из sessionStorage
        this.loadBestScore();
        this.updateBestScore();
    }

    updateVirulenceBar() {
        if (this.virulenceBarFill) {
            const maxWidth = this.virulenceBarBackground.width * 0.99; // Уменьшаем максимальную ширину, чтобы шкала не выходила за табличку
            const clampedVirusCount = Math.min(this.virusCount, 1000); // Ограничиваем до 1000 вирусов
            const fillWidth = (clampedVirusCount / 1000) * maxWidth;
            this.virulenceBarFill.clear();
            this.virulenceBarFill.beginFill(0x00FF00);
            this.virulenceBarFill.drawRect(0, 0, fillWidth, this.virulenceBarBackground.height * 0.9);
            this.virulenceBarFill.endFill();
            this.virulenceBarFill.x = -this.virulenceBarBackground.width * 0.5;
            this.virulenceBarFill.y = -this.virulenceBarBackground.height * 0.35;
        }
    }

    updateVirusCounter() {
        const count = this.virusCount.toString();
        const numDigits = count.length;

        // The rightmost position for the last digit. We use the last sprite slot.
        const rightmostDigitSlotX = (this.virusDigitSprites.length - 1) * 65;

        for (let i = 0; i < this.virusDigitSprites.length; i++) {
            const digitSprite = this.virusDigitSprites[i];

            // Determine the index of the digit in 'count' that corresponds to this sprite slot 'i'
            const digitIndexInCount = i - (this.virusDigitSprites.length - numDigits);

            if (digitIndexInCount >= 0 && digitIndexInCount < numDigits) {
                const digitChar = count[digitIndexInCount];
                digitSprite.texture = this.resources.textures[`${digitChar}.png`];
                digitSprite.visible = true;
                // Position for right alignment (relative to the container)
                digitSprite.x = rightmostDigitSlotX - (this.virusDigitSprites.length - 1 - i) * 65;
            } else {
                digitSprite.visible = false; // Hide leading unused slots
            }
        }

        // Position comma for right alignment
        if (this.virusCount > 999) {
            this.commaSprite.visible = true;
            // Comma should be after the thousands digit.
            // The actual visible thousands digit sprite will be at index (this.virusDigitSprites.length - numDigits)
            const thousandsDigitSpriteIndex = this.virusDigitSprites.length - numDigits;
            this.commaSprite.x = this.virusDigitSprites[thousandsDigitSpriteIndex].x + 32.5; // 32.5 is half of 65
        } else {
            this.commaSprite.visible = false;
        }
    }

    incrementVirusCount() {
        this.virusCount += 10; // Каждый вирус равен 10 очкам
        this.updateVirusCounter();
        this.updateVirulenceBar();
    }

    reset() {
        this.clearTimers();
        this.isGameRunning = false;
        this.rabbit = null;
        this.score = 0;
        this.virusCount = 0; // Reset virus count on game reset
        this.currentWorldSpeed = this.initialWorldSpeed;
        this.gameSpeedMultiplier = 1;

        if (this.app.stage) {
            this.app.stage.removeChildren();
        }
        if (this.worldContainer) {
            this.worldContainer.removeChildren();
        }
        if (this.frontLayer) {
            this.frontLayer.removeChildren();
        }
        if (this.backLayer) {
            this.backLayer.removeChildren();
        }
        if (this.scoreText) {
            this.scoreText.destroy();
            this.scoreText = null;
        }
        if (this.virusCounterContainer) {
            this.virusCounterContainer.destroy({children: true});
            this.virusCounterContainer = null;
        }
        if (this.virulenceBarContainer) {
            this.virulenceBarContainer.destroy({children: true});
            this.virulenceBarContainer = null;
        }
        if (this.bestScoreContainer) {
            this.bestScoreContainer.destroy({children: true});
            this.bestScoreContainer = null;
        }
        if (this.virulenceSign) {
            this.virulenceSign.destroy();
            this.virulenceSign = null;
        }
        if (this.virulenceBarBackground) {
            this.virulenceBarBackground.destroy();
            this.virulenceBarBackground = null;
        }
        if (this.virulenceBarFill) {
            this.virulenceBarFill.destroy();
            this.virulenceBarFill = null;
        }
    }

    showCountersWithAnimation() {
        if (this.countersShown) return; // Не показываем повторно
        this.countersShown = true;

        // Анимация появления счетчика вирусов
        const virusCounterDuration = 800;
        const virusCounterStartTime = Date.now();
        const virusCounterStartScale = 0.5;
        const virusCounterEndScale = 1.0;
        const virusCounterStartAlpha = 0;
        const virusCounterEndAlpha = 1;

        const animateVirusCounter = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - virusCounterStartTime;
            const progress = Math.min(elapsed / virusCounterDuration, 1);

            const scale = virusCounterStartScale + (virusCounterEndScale - virusCounterStartScale) * this.easeOutBack(progress);
            const alpha = virusCounterStartAlpha + (virusCounterEndAlpha - virusCounterStartAlpha) * this.easeOutQuad(progress);

            this.virusCounterContainer.scale.set(scale);
            this.virusCounterContainer.alpha = alpha;

            if (progress < 1) {
                requestAnimationFrame(animateVirusCounter);
            }
        };

        // Анимация появления шкалы вирулентности (с задержкой)
        setTimeout(() => {
            const virulenceBarDuration = 800;
            const virulenceBarStartTime = Date.now();
            const virulenceBarStartScale = 0.5;
            const virulenceBarEndScale = 1.0;
            const virulenceBarStartAlpha = 0;
            const virulenceBarEndAlpha = 1;

            const animateVirulenceBar = () => {
                const currentTime = Date.now();
                const elapsed = currentTime - virulenceBarStartTime;
                const progress = Math.min(elapsed / virulenceBarDuration, 1);

                const scale = virulenceBarStartScale + (virulenceBarEndScale - virulenceBarStartScale) * this.easeOutBack(progress);
                const alpha = virulenceBarStartAlpha + (virulenceBarEndAlpha - virulenceBarStartAlpha) * this.easeOutQuad(progress);

                this.virulenceBarContainer.scale.set(scale);
                this.virulenceBarContainer.alpha = alpha;

                if (progress < 1) {
                    requestAnimationFrame(animateVirulenceBar);
                }
            };

            requestAnimationFrame(animateVirulenceBar);
        }, 200); // Задержка 200мс для последовательного появления

        // Анимация появления лучшего результата (с задержкой)
        setTimeout(() => {
            const bestScoreDuration = 800;
            const bestScoreStartTime = Date.now();
            const bestScoreStartScale = 0.5;
            const bestScoreEndScale = 1.0;
            const bestScoreStartAlpha = 0;
            const bestScoreEndAlpha = 1;

            const animateBestScore = () => {
                const currentTime = Date.now();
                const elapsed = currentTime - bestScoreStartTime;
                const progress = Math.min(elapsed / bestScoreDuration, 1);

                const scale = bestScoreStartScale + (bestScoreEndScale - bestScoreStartScale) * this.easeOutBack(progress);
                const alpha = bestScoreStartAlpha + (bestScoreEndAlpha - bestScoreStartAlpha) * this.easeOutQuad(progress);

                this.bestScoreContainer.scale.set(scale);
                this.bestScoreContainer.alpha = alpha;

                if (progress < 1) {
                    requestAnimationFrame(animateBestScore);
                }
            };

            requestAnimationFrame(animateBestScore);
        }, 400); // Задержка 400мс для последовательного появления

        requestAnimationFrame(animateVirusCounter);
    }

    easeOutBack(x) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }

    showPauseButtonWithAnimation() {
        if (!this.pauseButton || this.pauseButton.alpha > 0) return; // Не показываем повторно

        this.pauseButton.visible = true;
        this.pauseButton.eventMode = 'static'; // Включаем взаимодействие с кнопкой

        // Анимация появления кнопки паузы
        const pauseButtonDuration = 800;
        const pauseButtonStartTime = Date.now();
        const pauseButtonStartScale = 0.5;
        const pauseButtonEndScale = 0.3; // Финальный размер кнопки
        const pauseButtonStartAlpha = 0;
        const pauseButtonEndAlpha = 1;

        const animatePauseButton = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - pauseButtonStartTime;
            const progress = Math.min(elapsed / pauseButtonDuration, 1);

            const scale = pauseButtonStartScale + (pauseButtonEndScale - pauseButtonStartScale) * this.easeOutBack(progress);
            const alpha = pauseButtonStartAlpha + (pauseButtonEndAlpha - pauseButtonStartAlpha) * this.easeOutQuad(progress);

            this.pauseButton.scale.set(scale);
            this.pauseButton.alpha = alpha;

            if (progress < 1) {
                requestAnimationFrame(animatePauseButton);
            }
        };

        requestAnimationFrame(animatePauseButton);
    }

    loadBestScore() {
        // Загружаем лучший результат из sessionStorage
        const savedBestScore = sessionStorage.getItem('fluffyBestScore');
        this.bestScore = savedBestScore ? parseInt(savedBestScore) : 0;
    }

    saveBestScore() {
        // Сохраняем лучший результат в sessionStorage
        if (this.virusCount > this.bestScore) {
            this.bestScore = this.virusCount;
            sessionStorage.setItem('fluffyBestScore', this.bestScore.toString());
            this.updateBestScore(); // Обновляем отображение
        }
    }

    updateBestScore() {
        if (!this.bestDigitSprites) return;

        const count = this.bestScore.toString();
        const numDigits = count.length;

        // Считаем, сколько цифр будет отображаться
        let visibleIndex = 0;
        for (let i = 0; i < this.bestDigitSprites.length; i++) {
            const digitSprite = this.bestDigitSprites[i];
            const digitIndexInCount = i - (this.bestDigitSprites.length - numDigits);
            if (digitIndexInCount >= 0 && digitIndexInCount < numDigits) {
                const digitChar = count[digitIndexInCount];
                digitSprite.texture = this.resources.textures[`${digitChar}.png`];
                digitSprite.visible = true;
                digitSprite.x = visibleIndex * 25; // Промежуток слева направо
                visibleIndex++;
            } else {
                digitSprite.visible = false;
            }
        }

        // Запятая после тысяч
        if (this.bestScore > 999) {
            this.bestCommaSprite.visible = true;
            // Запятая после первой цифры (тысячи)
            let commaPos = 25; // после первой цифры
            this.bestCommaSprite.x = commaPos + 2; // чуть правее центра
        } else {
            this.bestCommaSprite.visible = false;
        }
    }
}
