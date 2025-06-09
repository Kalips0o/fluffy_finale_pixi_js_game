import { Background } from './layers/background';
import { Foliage } from './layers/foliage';
import { Garlands } from './layers/garlands';
import { Fireflies } from './layers/fireflies';
import { Ground } from './layers/ground';
import { Trees } from './layers/trees';
import { Rabbit } from './entities/rabbit/rabbit';

export class SceneManager {
    constructor(app, resources) {
        this.app = app;
        this.resources = resources;

        this.layers = {
            background: new Background(app, resources),
            backFoliage: new Foliage(app, resources, 'violet_foliage.png'),
            backGarlands: new Garlands(app, resources, true),
            frontFoliage: new Foliage(app, resources, 'violet_foliage.png'),
            fireflies: new Fireflies(app, resources),
            ground: new Ground(app, resources),
            trees: new Trees(app, resources),
            frontGarlands: new Garlands(app, resources, false),
            topFoliage: new Foliage(app, resources, 'foliage.png')
        };

        // Создаем зайца
        this.rabbit = new Rabbit(app, resources);

        // Добавляем обновление состояния зайца в игровой цикл
        this.app.ticker.add((delta) => {
            this.rabbit.update(delta);
        });
    }

    drawScene() {
        this.app.stage.removeChildren();

        // Порядок отрисовки важен!
        this.layers.background.draw();
        this.layers.backFoliage.draw();
        this.layers.backGarlands.draw();
        this.layers.frontFoliage.draw();
        this.layers.fireflies.draw();
        this.layers.ground.draw();
        this.layers.trees.draw();
        this.layers.frontGarlands.draw();
        this.layers.topFoliage.draw();

        // Добавляем зайца поверх всех слоев
        this.app.stage.addChild(this.rabbit.sprite);
    }
}
