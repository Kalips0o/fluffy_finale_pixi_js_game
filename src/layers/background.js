import * as PIXI from 'pixi.js';
export class Background {
    constructor(app, resources) {
        this.app = app;
        this.resources = resources;
        this.sprites = [];
    }

    draw(container) {
        const bgTexture = this.resources.textures['bg.png'];
        if (!bgTexture) return;

        // Создаем три спрайта для бесконечной прокрутки
        for (let i = 0; i < 3; i++) {
            const bg = new PIXI.Sprite(bgTexture);
            bg.anchor.set(0, 0);
            bg.width = this.app.screen.width;
            bg.height = this.app.screen.height;
            bg.x = i * this.app.screen.width;
            container.addChild(bg);
            this.sprites.push(bg);
        }
    }

    updatePosition(camera) {
        if (!this.sprites.length) return;

        const screenWidth = this.app.screen.width;
        const worldX = camera.currentX;

        // Обновляем позиции спрайтов для создания эффекта бесконечной прокрутки
        this.sprites.forEach((sprite, index) => {
            const baseX = index * screenWidth;
            const offset = Math.floor(worldX / screenWidth) * screenWidth;
            sprite.x = baseX - offset;

            // Если спрайт ушел за левую границу, перемещаем его вправо
            if (sprite.x < -screenWidth) {
                sprite.x += screenWidth * 3;
            }
            // Если спрайт ушел за правую границу, перемещаем его влево
            else if (sprite.x > screenWidth * 2) {
                sprite.x -= screenWidth * 3;
            }
        });
    }
}
