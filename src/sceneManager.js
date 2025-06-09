import * as PIXI from 'pixi.js';
import { Background } from './layers/background';
import { Foliage } from './layers/foliage';
import { Garlands } from './layers/garlands';
import { Fireflies } from './layers/fireflies';
import { Ground } from './layers/ground';
import { Trees } from './layers/trees';
import { Rabbit } from './entities/rabbit/rabbit';
import { Camera } from './camera';

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
        this.camera.setTarget(this.rabbit);

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
            this.updateWorldPosition();
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
        // Очищаем контейнер мира
        this.worldContainer.removeChildren();

        // Порядок отрисовки важен!
        this.layers.background.draw(this.worldContainer);
        this.layers.backFoliage.draw(this.worldContainer);
        this.layers.backGarlands.draw(this.worldContainer);
        this.layers.frontFoliage.draw(this.worldContainer);
        this.layers.fireflies.draw(this.worldContainer);
        this.layers.ground.draw(this.worldContainer);
        this.layers.trees.draw(this.worldContainer);
        this.layers.frontGarlands.draw(this.worldContainer);
        this.layers.topFoliage.draw(this.worldContainer);

        // Добавляем зайца в контейнер только если он еще не добавлен
        if (!this.rabbit.sprite.parent) {
            this.worldContainer.addChild(this.rabbit.sprite);
        }
    }
}
