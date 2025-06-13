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
import { BloodSplatter } from './entities/effects/BloodSplatter';

export class SceneManager {
    constructor(app, resources) {
        this.app = app;
        this.resources = resources;
        this.isPaused = false;

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
        this.vaccineManager = new VaccineManager(app, resources, this);
        this.vaccineManager.init();

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

        // Затем добавляем обновление состояния зайца и камеры в игровой цикл
        this.app.ticker.add((delta) => {
            if (!this.isPaused) {
                this.rabbit.update(delta);
                this.camera.update();
                this.doctorManager.update(delta);
                this.vaccineManager.update(delta);

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
        pauseButton.scale.set(0.3);
        pauseButton.x = this.app.screen.width - 120;
        pauseButton.y = this.app.screen.height - 150;
        pauseButton.interactive = true;
        pauseButton.buttonMode = true;
        pauseButton.visible = false; // Initially hidden

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
        this.isPaused = !this.isPaused;

        if (!this.pausePanel) {
            this.createPausePanel();
        }

        this.pausePanel.visible = this.isPaused;
        this.pauseButton.visible = !this.isPaused;
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
            this.pauseButton.visible = true;
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
}
