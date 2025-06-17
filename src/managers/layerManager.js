import * as PIXI from 'pixi.js';
import { Background } from '../layers/background';
import { Foliage } from '../layers/foliage';
import { Garlands } from '../layers/garlands';
import { Fireflies } from '../layers/fireflies';
import { Ground } from '../layers/ground';
import { Trees } from '../layers/trees';

export class LayerManager {
    constructor(app, resources, worldContainer, sceneManager) {
        this.app = app;
        this.resources = resources;
        this.worldContainer = worldContainer;
        this.sceneManager = sceneManager;
        this.layers = {};
        
        this.init();
    }

    init() {
        this.initializeLayers();
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
    }

    setRabbit(rabbit) {
        // Устанавливаем ссылку на кролика в слое земли
        if (this.layers.ground && this.layers.ground.setRabbit) {
            this.layers.ground.setRabbit(rabbit);
        }
    }

    updateWorldPosition(camera) {
        // Обновляем позицию всех слоев относительно камеры
        Object.values(this.layers).forEach(layer => {
            if (layer.updatePosition) {
                layer.updatePosition(camera);
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
        const doctorManager = this.sceneManager.doctorManager;
        
        if (doctorManager) {
            doctorManager.doctors.forEach(doctor => {
                if (doctor.isActive) {
                    this.worldContainer.setChildIndex(doctor.sprite, this.worldContainer.children.length - 1);
                }
            });
        }
        
        const rabbit = this.sceneManager.rabbit;
        if (rabbit && rabbit.sprite) {
            this.worldContainer.setChildIndex(rabbit.sprite, this.worldContainer.children.length - 1); // Перемещаем кролика на самый верхний слой
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
        const doctorManager = this.sceneManager.doctorManager;
        const rabbit = this.sceneManager.rabbit;
        
        if (doctorManager) {
            doctorManager.doctors.forEach(doctor => {
                if (doctor.isActive && doctor.sprite && doctor.sprite.parent === this.worldContainer) {
                    // Ставим доктора перед кроликом, но не на самый верх
                    this.worldContainer.setChildIndex(doctor.sprite, this.worldContainer.children.length - 2);
                }
            });
        }

        // Всегда помещаем кролика на самый верхний слой
        if (rabbit && rabbit.sprite && rabbit.sprite.parent === this.worldContainer) {
            this.worldContainer.setChildIndex(rabbit.sprite, this.worldContainer.children.length - 1);
        }

        // Перемещаем частицы крови на самый верхний слой
        const bloodSplatterEffects = this.sceneManager.effectManager.getBloodSplatterEffects();
        if (bloodSplatterEffects) {
            bloodSplatterEffects.forEach(bloodSplatterInstance => {
                bloodSplatterInstance.splatters.forEach(splatterParticle => {
                    if (splatterParticle && splatterParticle.parent === this.worldContainer) {
                        this.worldContainer.setChildIndex(splatterParticle, this.worldContainer.children.length - 1);
                    }
                });
            });
        }
    }

    cleanup() {
        // Очищаем все слои
        Object.values(this.layers).forEach(layer => {
            if (layer.cleanup) {
                layer.cleanup();
            }
        });
    }

    reset() {
        // Сбрасываем все слои
        this.cleanup();
        this.layers = {};
        this.init();
    }
}
