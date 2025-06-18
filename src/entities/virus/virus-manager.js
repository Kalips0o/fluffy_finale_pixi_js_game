import * as PIXI from 'pixi.js';
import { Virus } from './virus';

export class VirusManager {
    constructor(app, worldContainer, sceneManager) {
        this.app = app;
        this.worldContainer = sceneManager.worldContainer;
        this.sceneManager = sceneManager;
        this.resources = sceneManager.resources;
        this.viruses = [];
        this.spawnInterval = 2000; // Интервал между попытками спавна *нового* паттерна/линии
        this.lastSpawnTime = 0;
        this.minSpawnDistance = 200; // Уменьшаем расстояние между вирусами в волне
        this.spawnDistanceVariation = 100; // Уменьшаем вариацию для более плотных групп
        this.verticalVariation = 80; // Небольшая вертикальная вариация внутри линии для естественности
        this.minDistanceFromDoctor = 500; // Минимальное расстояние от докторов

        // Параметры для волн вирусов
        this.patternIndex = 0;
        this.patterns = [
            { count: 5, height: 0.15, spacing: 150 },  // 5 вирусов низко
            { count: 4, height: 0.25, spacing: 150 },  // 4 вируса чуть выше
            { count: 5, height: 0.35, spacing: 150 },  // 5 вирусов на средней высоте
            { count: 4, height: 0.45, spacing: 150 },  // 4 вируса выше среднего
            { count: 5, height: 0.55, spacing: 150 }   // 5 вирусов на максимальной высоте
        ];
        this.virusesInCurrentPattern = 0;
        this._currentPatternStartX = 0;
        this._horizontalGapBetweenPatterns = 3000; // Увеличиваем отступ между группами для лучшей читаемости
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
        
        // Проверяем, нет ли докторов слишком близко
        const doctors = this.sceneManager.doctorManager.doctors;
        for (const doctor of doctors) {
            if (Math.abs(worldX - doctor.sprite.x) < this.minDistanceFromDoctor) {
                return; // Не спавним вирус, если слишком близко к доктору
            }
        }

        // Определяем высоту вируса на основе текущего паттерна
        const grassY = this.getGrassY();
        const screenHeight = this.app.screen.height;
        const baseHeight = grassY - (screenHeight * currentPattern.height);
        
        // Добавляем небольшое случайное отклонение по высоте для всей группы
        const heightVariation = (Math.random() - 0.5) * 30; // Уменьшаем вариацию высоты
        const targetY = baseHeight + heightVariation;

        // Спавним группу вирусов на одном уровне
        for (let i = 0; i < currentPattern.count; i++) {
            const baseWorldX = worldX + (i * currentPattern.spacing);
            
            // Выбираем случайную текстуру вируса
            const virusNumber = Math.floor(Math.random() * 10) + 1;
            const virusTexture = `vir_${virusNumber}.png`;

            const virus = new Virus(this.app, this.resources, baseWorldX, targetY, this.sceneManager, virusTexture);
            
            // Добавляем вирус в контейнер мира
            this.sceneManager.worldContainer.addChild(virus.container);
            
            this.viruses.push(virus);
        }

        this.lastSpawnTime = currentTime;

        // Переходим к следующему паттерну после создания всей группы
        this.patternIndex = (this.patternIndex + 1) % this.patterns.length;
        this.virusesInCurrentPattern = 0;
        this._currentPatternStartX = 0;
    }

    getGrassY() {
        const desiredSoilHeight = 130;
        const soilY = Math.round(this.app.screen.height - desiredSoilHeight);
        return soilY + desiredSoilHeight - 150;
    }

    update(delta) {
        // Спавним новые вирусы только если игра не окончена
        if (!this.sceneManager.rabbit.physics.gameOver) {
            this.spawnVirus();
        }
        
        // Обновляем существующие вирусы (они продолжают двигаться даже при gameOver)
        this.viruses = this.viruses.filter(virus => {
            if (!virus.isActive) {
                virus.deactivate();
                return false;
            }

            virus.update(delta);
            
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
                    this.handleCollection(virus, rabbit); // Восстанавливаем обработку сбора
                    this.sceneManager.uiManager.incrementVirusCount(); // Увеличиваем счетчик вирусов
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
        
        // Воспроизводим звук сбора вируса
        if (this.sceneManager && this.sceneManager.playSound) {
            this.sceneManager.playSound('collected_the_virus');
        }
        
        // Здесь можно добавить эффект сбора вируса
        // Например, анимацию исчезновения или эффект частиц
    }

    cleanup() {
        // Удаляем все вирусы
        this.viruses.forEach(virus => virus.deactivate());
        this.viruses = [];
    }
} 