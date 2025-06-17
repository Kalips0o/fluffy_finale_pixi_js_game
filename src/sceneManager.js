import * as PIXI from 'pixi.js';
import { Rabbit } from './entities/rabbit/rabbit';
import { Camera } from './camera';
import { DoctorManager } from './entities/doctor/doctor-manager';
import { VaccineManager } from './entities/vaccine/vaccine-manager';
import { VirusManager } from './entities/virus/virus-manager';

import { UIManager } from './managers/uiManager';
import { LayerManager } from './managers/layerManager';
import { EffectManager } from './managers/effectManager .js';

export class SceneManager {
    constructor(app, resources) {
        this.app = app;
        this.resources = resources;
        this.isPaused = false;
        this.isGameRunning = true;
        this.isFirstGame = true; // Флаг для отслеживания первого запуска
        this.startSign = null;

        // Загружаем флаг первого запуска из localStorage
        const savedFirstGame = localStorage.getItem('isFirstGame');
        this.isFirstGame = savedFirstGame === null ? true : savedFirstGame === 'true';

        // Создаем контейнеры
        this.camera = new Camera(app);
        this.worldContainer = new PIXI.Container();
        this.app.stage.addChild(this.camera.container);
        this.camera.container.addChild(this.worldContainer);

        // Инициализируем UI Manager
        this.uiManager = new UIManager(app, resources, this);

        // Инициализируем Layer Manager
        this.layerManager = new LayerManager(app, resources, this.worldContainer, this);

        // Инициализируем Effect Manager
        this.effectManager = new EffectManager(app, resources, this);

        // Создаем зайца
        this.rabbit = new Rabbit(app, resources, this);
        this.worldContainer.addChildAt(this.rabbit.sprite, 0);  // Добавляем кролика на самый задний план
        this.camera.setTarget(this.rabbit);

        // Устанавливаем ссылку на кролика в LayerManager
        this.layerManager.setRabbit(this.rabbit);

        // Создаем менеджер докторов
        this.doctorManager = new DoctorManager(app, resources, this);
        this.doctorManager.init();

        // Создаем менеджер вакцин
        this.vaccineManager = new VaccineManager(app, this.worldContainer, this);
        this.vaccineManager.init();

        // Создаем менеджер вирусов
        this.virusManager = new VirusManager(app, this.worldContainer, this);
        this.virusManager.init();

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

        // Добавляем обновление состояния зайца и камеры в игровой цикл
        this.app.ticker.add((delta) => {
            if (!this.isPaused) {
                // Обновляем кролика и камеру только если игра не окончена
                if (!this.rabbit.physics.gameOver) {
                    this.rabbit.update(delta);
                    this.camera.update();
                    this.updateWorldPosition();
                }

                // Менеджеры продолжают обновляться даже при gameOver
                this.doctorManager.update(delta);
                this.vaccineManager.update(delta);
                this.virusManager.update(delta);

                // Обновляем эффекты крови
                this.effectManager.update(delta);

                this.updateSpriteZOrder();
            }
        });

        // Добавляем обработчик изменения размера окна
        window.addEventListener('resize', () => {
            this.drawScene();
        });
    }

    updateWorldPosition() {
        // Show pause button when camera starts moving and game is not over
        if (this.camera.currentX > 0 && !this.uiManager.pauseButton.visible && !this.rabbit.physics.gameOver) {
            // Показываем кнопку паузы с анимацией
            this.uiManager.showPauseButtonWithAnimation();

            // Показываем счетчики с анимацией одновременно с кнопкой паузы
            this.uiManager.showCountersWithAnimation();
        }

        // Обновляем позицию всех слоев относительно камеры
        this.layerManager.updateWorldPosition(this.camera);
    }

    drawScene() {
        // Отрисовываем сцену через LayerManager
        this.layerManager.drawScene();

        // Создаем табличку START только при первом запуске игры
        if (!this.startSign && this.isFirstGame) {
            this.createStartSign();
        }
    }

    // Добавляем метод для принудительной перерисовки сцены
    redrawScene() {
        this.layerManager.redrawScene();
    }

    // Новый метод для управления z-порядком спрайтов
    updateSpriteZOrder() {
        this.layerManager.updateSpriteZOrder();
    }

    // Метод для добавления эффектов крови
    addBloodSplatter(splatter) {
        this.effectManager.addBloodSplatter(splatter);
    }

    // Метод для добавления эффектов крови на камеру
    addCameraBloodSplatter() {
        this.effectManager.addCameraBloodSplatter();
    }

    update(delta) {
        if (this.isPaused) return;

        // Проверяем, не окончена ли игра
        if (this.rabbit && this.rabbit.physics && this.rabbit.physics.gameOver) {
            return; // Останавливаем обновление игры, если кролик умер
        }

        // Обновляем камеру
        this.camera.update(delta);

        // Обновляем все слои через LayerManager
        this.layerManager.updateWorldPosition(this.camera);

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
        this.effectManager.update(delta);

        // Обновляем z-порядок спрайтов
        this.updateSpriteZOrder();
    }

    cleanup() {
        // Очищаем все менеджеры
        if (this.entityManager) {
            this.entityManager.cleanup();
        }
        if (this.effectManager) {
            this.effectManager.cleanup();
        }
        if (this.layerManager) {
            this.layerManager.cleanup();
        }
        if (this.uiManager) {
            this.uiManager.cleanup();
        }
        
        // Очищаем табличку START
        if (this.startSign && this.startSign.parent) {
            this.startSign.parent.removeChild(this.startSign);
            this.startSign = null;
        }
    }

    clearTimers() {
        // Очищаем все таймеры, если они есть
        // Этот метод может быть расширен в будущем для очистки других таймеров
    }

    reset() {
        this.clearTimers();
        this.isGameRunning = false;
        this.rabbit = null;
        this.score = 0;
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

        // Reset UI Manager
        if (this.uiManager) {
            this.uiManager.reset();
        }

        // Reset Layer Manager
        if (this.layerManager) {
            this.layerManager.reset();
        }
    }

    createStartSign() {
        // Создаем табличку START с текстурой
        this.startSign = new PIXI.Sprite(this.resources.textures['start.png']);
        this.startSign.anchor.set(0.5);

        // Позиционируем табличку
        this.startSign.x = this.rabbitStartX - 120; // Немного левее кролика
        const groundY = this.rabbit.physics.getGrassY();
        this.startSign.y = groundY + 10; // Ближе к земле

        // Устанавливаем размер таблички
        this.startSign.scale.set(0.5, 0.5);

        console.log('Позиция таблички START:', this.startSign.x, this.startSign.y);
        console.log('Размер таблички START:', this.startSign.width, this.startSign.height);
        console.log('Позиция земли:', groundY);

        // Добавляем табличку в worldContainer
        if (this.worldContainer) {
            this.worldContainer.addChild(this.startSign);

            // Устанавливаем z-индекс, чтобы табличка была видна
            this.worldContainer.setChildIndex(this.startSign, this.worldContainer.children.length - 1);

            console.log('Табличка START добавлена в worldContainer');
            console.log('Количество детей в worldContainer:', this.worldContainer.children.length);
        } else {
            console.error('worldContainer не найден!');
        }

        // Сохраняем флаг в localStorage, что это уже не первый запуск
        this.isFirstGame = false;
        localStorage.setItem('isFirstGame', 'false');
    }

    removeStartSign() {
        if (this.startSign && this.startSign.parent) {
            this.startSign.parent.removeChild(this.startSign);
            this.startSign = null;
        }
    }

    // Метод для сброса флага первого запуска (для тестирования)
    resetFirstGameFlag() {
        this.isFirstGame = true;
        localStorage.removeItem('isFirstGame');
        console.log('Флаг первого запуска сброшен');
    }
}
