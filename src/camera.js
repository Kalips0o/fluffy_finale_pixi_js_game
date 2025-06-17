import * as PIXI from 'pixi.js';

export class Camera {
    constructor(app) {
        this.app = app;
        this.container = new PIXI.Container();
        this.target = null;
        this.offset = 350; // Смещение камеры
        this.currentX = 0;
        this.startX = 200; // Начальная позиция кролика
        this.cameraStartX = 300; // Позиция, после которой камера начинает двигаться
    }

    setTarget(target) {
        this.target = target;
    }

    update() {
        if (!this.target) return;

        // Проверяем, не окончена ли игра
        if (this.target.physics && this.target.physics.gameOver) {
            return; // Останавливаем движение камеры, если игра окончена
        }

        // Получаем размеры экрана
        const screenWidth = this.app.screen.width;
        
        // Вычисляем позицию камеры
        const targetX = this.target.sprite.x;
        
        // Если кролик не дошел до точки начала движения камеры
        if (targetX < this.startX + this.cameraStartX) {
            this.currentX = 0;
        } else {
            // Вычисляем, насколько кролик прошел за точку начала движения камеры
            const distanceTraveled = targetX - (this.startX + this.cameraStartX);
            this.currentX = distanceTraveled;
        }
        
        this.container.x = -this.currentX;
    }

    getWorldPosition(screenX) {
        return screenX + this.currentX;
    }

    getScreenPosition(worldX) {
        return worldX - this.currentX;
    }
} 