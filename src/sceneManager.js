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

export class SceneManager {
    constructor(app, resources) {
        this.app = app;
        this.resources = resources;
        
        // Создаем контейнеры
        this.camera = new Camera(app);
        this.worldContainer = new PIXI.Container();
        this.app.stage.addChild(this.camera.container);
        this.camera.container.addChild(this.worldContainer);

        // Инициализируем все слои
        this.initializeLayers();

        // Создаем зайца
        this.rabbit = new Rabbit(app, resources, this);
        this.worldContainer.addChild(this.rabbit.sprite);
        this.camera.setTarget(this.rabbit);

        // Создаем менеджер докторов
        this.doctorManager = new DoctorManager(app, resources, this);
        this.doctorManager.init();
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

        // Затем добавляем обновление состояния зайца и камеры в игровой цикл
        this.app.ticker.add((delta) => {
            this.rabbit.update(delta);
            this.camera.update();
            this.doctorManager.update(delta);
            this.updateWorldPosition();
            this.updateSpriteZOrder();
        });

        // Добавляем обработчик изменения размера окна
        window.addEventListener('resize', () => {
            this.drawScene();
        });
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
    }
}
