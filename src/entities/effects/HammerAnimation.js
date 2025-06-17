import * as PIXI from 'pixi.js';

export class HammerAnimation {
    constructor(app, resources, worldContainer) {
        this.app = app;
        this.resources = resources;
        this.worldContainer = worldContainer;
        this.hammer = null;
    }

    start(startX, startY, groundY) {
        // Create hammer sprite
        this.hammer = new PIXI.Sprite(this.resources.textures['hammer.png']);
        this.hammer.anchor.set(0.5);
        this.hammer.scale.set(0.2);
        this.hammer.x = startX;
        this.hammer.y = startY;
        this.hammer.rotation = 0;
        this.worldContainer.addChild(this.hammer);

        const duration = 2000; // Увеличиваем длительность для более плавной дуги
        const startTime = Date.now();

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Красивая анимация: молоток отлетает влево и падает вниз по дуге
            const horizontalDistance = 350; // Расстояние влево
            const verticalDistance = groundY - startY + 100; // Расстояние вниз + немного ниже земли
            
            // Горизонтальное движение (равномерное)
            const hammerX = startX - (progress * horizontalDistance);
            
            // Вертикальное движение (параболическая дуга)
            const hammerY = startY + (progress * progress * verticalDistance); // Квадратичная функция для дуги
            
            // Легкое вращение для реалистичности
            const hammerRotation = progress * Math.PI * 2.5; // Увеличиваем поворот до 2.5 оборотов
            
            this.hammer.x = hammerX;
            this.hammer.y = hammerY;
            this.hammer.rotation = hammerRotation;
            
            // Continue animation if not finished
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Hide hammer
                this.hammer.visible = false;
            }
        };
        
        // Start animation
        requestAnimationFrame(animate);
    }
} 