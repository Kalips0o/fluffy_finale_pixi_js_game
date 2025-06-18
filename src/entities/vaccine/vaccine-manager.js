import * as PIXI from 'pixi.js';
import { Vaccine } from './vaccine';
import { VaccineExplosion } from '../effects/VaccineExplosion';

export class VaccineManager {
    constructor(app, worldContainer, sceneManager) {
        this.app = app;
        this.worldContainer = sceneManager.worldContainer;
        this.sceneManager = sceneManager;
        this.resources = sceneManager.resources;
        this.vaccines = [];
        this.spawnInterval = 2500; // Уменьшаем интервал появления вакцин с 4000 до 2500 мс
        this.lastSpawnTime = 0;
        this.minSpawnDistance = 1200; // Уменьшаем минимальное расстояние между вакцинами
        this.spawnDistanceVariation = 800; // Вариация расстояния
        this.verticalVariation = 200; // Вариация по вертикали
        this.minDistanceFromDoctor = 1000; // Минимальное расстояние от докторов
        this.vaccineExplosion = new VaccineExplosion(app, this.worldContainer);
        console.log('VaccineExplosion initialized:', this.vaccineExplosion);

        // Создаем контейнер для отладочной графики
        // this.debugContainer = new PIXI.Container();
        // this.worldContainer.addChild(this.debugContainer);
    }

    init() {
        // Инициализация
    }

    spawnVaccine() {
        const currentTime = Date.now();
        if (currentTime - this.lastSpawnTime < this.spawnInterval) return;

        // Проверяем расстояние до последней вакцины
        if (this.vaccines.length > 0) {
            const lastVaccine = this.vaccines[this.vaccines.length - 1];
            const worldX = this.sceneManager.camera.getWorldPosition(this.app.screen.width);
            const distance = worldX - lastVaccine.sprite.x;
            if (distance < this.minSpawnDistance) return;
        }

        // Проверяем расстояние до ближайшего доктора
        const worldX = this.sceneManager.camera.getWorldPosition(this.app.screen.width + 100);
        const baseWorldX = worldX + Math.random() * this.spawnDistanceVariation;
        
        // Проверяем, нет ли докторов слишком близко
        const doctors = this.sceneManager.doctorManager.doctors;
        for (const doctor of doctors) {
            if (Math.abs(baseWorldX - doctor.sprite.x) < this.minDistanceFromDoctor) {
                return; // Не спавним вакцину, если слишком близко к доктору
            }
        }

        // Определяем высоту вакцины (над землей или на земле)
        const grassY = this.getGrassY();
        const isFloating = Math.random() > 0.5; // 50% шанс, что вакцина будет в воздухе
        const verticalOffset = isFloating ? 
            -Math.random() * this.verticalVariation : // В воздухе
            Math.random() * 20 - 30; // На земле, но не прижимаем к ней (от -30 до -10)

        const vaccine = new Vaccine(this.app, this.resources, baseWorldX, grassY + verticalOffset, this.sceneManager);
        
        // Добавляем вакцину в контейнер мира
        this.sceneManager.worldContainer.addChild(vaccine.sprite);
        
        // Создаем и добавляем графику для отладки
        // vaccine.debugGraphics = new PIXI.Graphics();
        // this.debugContainer.addChild(vaccine.debugGraphics);
        
        this.vaccines.push(vaccine);
        this.lastSpawnTime = currentTime;
    }

    getGrassY() {
        const desiredSoilHeight = 130;
        const soilY = Math.round(this.app.screen.height - desiredSoilHeight);
        return soilY + desiredSoilHeight - 150;
    }

    update(delta) {
        // Спавним новые вакцины только если игра не окончена
        if (!this.sceneManager.rabbit.physics.gameOver) {
            this.spawnVaccine();
        }
        
        // Обновляем существующие вакцины (они продолжают двигаться даже при gameOver)
        this.vaccines = this.vaccines.filter(vaccine => {
            if (!vaccine.isActive) {
                // Удаляем графику отладки
                // if (vaccine.debugGraphics && vaccine.debugGraphics.parent) {
                //     vaccine.debugGraphics.parent.removeChild(vaccine.debugGraphics);
                // }
                vaccine.deactivate();
                return false;
            }

            vaccine.update(delta);
            
            // Обновляем графику отладки
            // if (vaccine.debugGraphics) {
            //     vaccine.debugGraphics.clear();
            //     vaccine.debugGraphics.lineStyle(2, 0x00FF00);
            //     vaccine.debugGraphics.drawRect(vaccine.hitbox.x, vaccine.hitbox.y, vaccine.hitbox.width, vaccine.hitbox.height);
            // }
            
            // Проверяем столкновение с кроликом
            if (vaccine.isActive) {
                const rabbit = this.sceneManager.rabbit;
                const vaccineHitbox = vaccine.hitbox;
                
                // Проверяем столкновение при ударе
                if (rabbit.physics.hitActive) {
                    const hitArea = rabbit.physics.hitArea;
                    const hitCollision = 
                        hitArea.x < vaccineHitbox.x + vaccineHitbox.width &&
                        hitArea.x + hitArea.width > vaccineHitbox.x &&
                        hitArea.y < vaccineHitbox.y + vaccineHitbox.height &&
                        hitArea.y + hitArea.height > vaccineHitbox.y;

                    if (hitCollision) {
                        console.log('Vaccine hit collision detected!');
                        this.handleHitCollision(vaccine, rabbit);
                        return false;
                    }
                }
                
                // Проверяем обычное столкновение
                const rabbitX = rabbit.sprite.x;
                const rabbitY = rabbit.sprite.y;
                const rabbitWidth = rabbit.sprite.width * 0.4;
                const rabbitHeight = rabbit.sprite.height * 0.6;
                
                const regularCollision = 
                    rabbitX - rabbitWidth/2 < vaccineHitbox.x + vaccineHitbox.width &&
                    rabbitX + rabbitWidth/2 > vaccineHitbox.x &&
                    rabbitY - rabbitHeight/2 < vaccineHitbox.y + vaccineHitbox.height &&
                    rabbitY + rabbitHeight/2 > vaccineHitbox.y;

                if (regularCollision) {
                    console.log('Vaccine regular collision detected!');
                    this.handleCollision(vaccine, rabbit);
                    return false;
                }
            }
            
            return true;
        });
    }

    handleHitCollision(vaccine, rabbit) {
        if (vaccine.isHit) return;
        vaccine.isHit = true;
        vaccine.sprite.visible = false;
        
        // Воспроизводим звук взрыва вакцины
        if (this.sceneManager && this.sceneManager.playSound) {
            this.sceneManager.playSound('vaccine_explosion');
        }
        
        this.vaccineExplosion.createExplosion(vaccine.sprite.x, vaccine.sprite.y, vaccine.sprite);
        this.sceneManager.addCameraBloodSplatter();
        this.sceneManager.rabbit.animations.playFallingAnimation(true); // Добавляем параметр true для взрыва
    }

    handleCollision(vaccine, rabbit) {
        if (vaccine.isHit) return;
        vaccine.isHit = true;
        vaccine.sprite.visible = false;
        
        // Воспроизводим звук взрыва вакцины
        if (this.sceneManager && this.sceneManager.playSound) {
            this.sceneManager.playSound('vaccine_explosion');
        }
        
        this.vaccineExplosion.createExplosion(vaccine.sprite.x, vaccine.sprite.y, vaccine.sprite);
        this.sceneManager.rabbit.animations.playFallingAnimation(true); // Добавляем параметр true для взрыва
    }

    cleanup() {
        // Удаляем все вакцины
        this.vaccines.forEach(vaccine => vaccine.deactivate());
        this.vaccines = [];
    }
} 