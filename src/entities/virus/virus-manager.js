import * as PIXI from 'pixi.js';
import { Virus } from './virus';

export class VirusManager {
    constructor(app, worldContainer, sceneManager) {
        this.app = app;
        this.worldContainer = sceneManager.worldContainer;
        this.sceneManager = sceneManager;
        this.resources = sceneManager.resources;
        this.viruses = [];
        this.spawnInterval = 800; // Уменьшаем интервал между волнами
        this.lastSpawnTime = 0;
        this.minSpawnDistance = 200; // Уменьшаем расстояние между вирусами в волне
        this.spawnDistanceVariation = 100; // Уменьшаем вариацию для более плотных групп
        this.verticalVariation = 100; // Уменьшаем вертикальную вариацию для более четких волн
        this.minDistanceFromDoctor = 500; // Минимальное расстояние от докторов

        // Параметры для волн вирусов
        this.patternIndex = 0;
        this.patterns = [
            { count: 8, height: 0.3, spacing: 0.8 }, // Волна из 8 вирусов внизу
            { count: 8, height: 0.4, spacing: 0.8 }, // Волна из 8 вирусов чуть выше
            { count: 8, height: 0.5, spacing: 0.8 }, // Волна из 8 вирусов в середине
            { count: 8, height: 0.6, spacing: 0.8 }, // Волна из 8 вирусов чуть ниже верхнего
            { count: 8, height: 0.7, spacing: 0.8 }, // Волна из 8 вирусов вверху
            { count: 6, height: 0.35, spacing: 1.0 }, // Волна из 6 вирусов между нижним и средним
            { count: 6, height: 0.45, spacing: 1.0 }, // Волна из 6 вирусов между средним и верхним
            { count: 6, height: 0.55, spacing: 1.0 }, // Волна из 6 вирусов в верхней части
            { count: 6, height: 0.65, spacing: 1.0 }  // Волна из 6 вирусов в нижней части
        ];
        this.virusesInCurrentPattern = 0;
        this.waveSpacing = 0; // Текущее расстояние между вирусами в волне

        // Создаем контейнер для отладочной графики
        this.debugContainer = new PIXI.Container();
        this.worldContainer.addChild(this.debugContainer);
    }

    init() {
        // Инициализация
    }

    spawnVirus() {
        const currentTime = Date.now();
        if (currentTime - this.lastSpawnTime < this.spawnInterval) return;

        // Проверяем расстояние до последнего вируса
        if (this.viruses.length > 0) {
            const lastVirus = this.viruses[this.viruses.length - 1];
            const worldX = this.sceneManager.camera.getWorldPosition(this.app.screen.width);
            const distance = worldX - lastVirus.sprite.x;
            if (distance < this.minSpawnDistance) return;
        }

        // Проверяем расстояние до ближайшего доктора
        const worldX = this.sceneManager.camera.getWorldPosition(this.app.screen.width + 100);
        const currentPattern = this.patterns[this.patternIndex];
        
        // Вычисляем позицию для нового вируса в волне
        const baseWorldX = worldX + (this.waveSpacing * currentPattern.spacing);
        this.waveSpacing += this.minSpawnDistance;
        
        // Проверяем, нет ли докторов слишком близко
        const doctors = this.sceneManager.doctorManager.doctors;
        for (const doctor of doctors) {
            if (Math.abs(baseWorldX - doctor.sprite.x) < this.minDistanceFromDoctor) {
                return; // Не спавним вирус, если слишком близко к доктору
            }
        }

        // Определяем высоту вируса на основе текущего паттерна
        const grassY = this.getGrassY();
        const screenHeight = this.app.screen.height;
        const baseHeight = grassY - (screenHeight * currentPattern.height);
        
        // Добавляем небольшое случайное отклонение по высоте
        const heightVariation = (Math.random() - 0.5) * this.verticalVariation;
        const targetY = baseHeight + heightVariation;

        // Выбираем случайную текстуру вируса
        const virusNumber = Math.floor(Math.random() * 10) + 1; // От 1 до 10
        const virusTexture = `vir_${virusNumber}.png`;

        const virus = new Virus(this.app, this.resources, baseWorldX, targetY, this.sceneManager, virusTexture);
        
        // Добавляем вирус в контейнер мира
        this.sceneManager.worldContainer.addChild(virus.container);
        
        // Создаем и добавляем графику для отладки
        virus.debugGraphics = new PIXI.Graphics();
        this.debugContainer.addChild(virus.debugGraphics);
        
        this.viruses.push(virus);
        this.lastSpawnTime = currentTime;

        // Обновляем счетчик вирусов в текущем паттерне
        this.virusesInCurrentPattern++;
        if (this.virusesInCurrentPattern >= currentPattern.count) {
            // Переходим к следующему паттерну
            this.patternIndex = (this.patternIndex + 1) % this.patterns.length;
            this.virusesInCurrentPattern = 0;
            this.waveSpacing = 0; // Сбрасываем расстояние для новой волны
        }
    }

    getGrassY() {
        const desiredSoilHeight = 130;
        const soilY = Math.round(this.app.screen.height - desiredSoilHeight);
        return soilY + desiredSoilHeight - 150;
    }

    update(delta) {
        // Спавним новые вирусы
        this.spawnVirus();

        // Обновляем существующие вирусы
        this.viruses = this.viruses.filter(virus => {
            if (!virus.isActive) {
                // Удаляем графику отладки
                if (virus.debugGraphics && virus.debugGraphics.parent) {
                    virus.debugGraphics.parent.removeChild(virus.debugGraphics);
                }
                virus.deactivate();
                return false;
            }

            virus.update(delta);
            
            // Обновляем графику отладки
            if (virus.debugGraphics) {
                virus.debugGraphics.clear();
                virus.debugGraphics.lineStyle(2, 0x00FF00);
                virus.debugGraphics.drawRect(virus.hitbox.x, virus.hitbox.y, virus.hitbox.width, virus.hitbox.height);
            }
            
            // Проверяем столкновение с кроликом
            if (virus.isActive) {
                const rabbit = this.sceneManager.rabbit;
                const virusHitbox = virus.hitbox;
                
                // Проверяем обычное столкновение
                const rabbitX = rabbit.sprite.x;
                const rabbitY = rabbit.sprite.y;
                const rabbitWidth = rabbit.sprite.width * 0.4;
                const rabbitHeight = rabbit.sprite.height * 0.6;
                
                const collision = 
                    rabbitX - rabbitWidth/2 < virusHitbox.x + virusHitbox.width &&
                    rabbitX + rabbitWidth/2 > virusHitbox.x &&
                    rabbitY - rabbitHeight/2 < virusHitbox.y + virusHitbox.height &&
                    rabbitY + rabbitHeight/2 > virusHitbox.y;

                if (collision) {
                    console.log('Virus collected!');
                    this.handleCollection(virus, rabbit);
                    return false;
                }
            }
            
            return true;
        });
    }

    handleCollection(virus, rabbit) {
        if (virus.isCollected) return;
        virus.isCollected = true;
        virus.container.visible = false; // Скрываем весь контейнер (и вирус, и свечение)
        // Здесь можно добавить эффект сбора вируса
        // Например, анимацию исчезновения или эффект частиц
    }

    cleanup() {
        // Удаляем все вирусы
        this.viruses.forEach(virus => virus.deactivate());
        this.viruses = [];
    }
} 