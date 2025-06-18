import * as PIXI from 'pixi.js';
import { Doctor } from './doctor';

export class DoctorManager {
    constructor(app, resources, sceneManager) {
        this.app = app;
        this.resources = resources;
        this.sceneManager = sceneManager;
        this.doctors = [];
        this.spawnInterval = 5000; // Интервал появления докторов (в миллисекундах)
        this.lastSpawnTime = 0;
        this.minSpawnDistance = 2000; // Увеличиваем минимальное расстояние между докторами
        this.spawnDistanceVariation = 1000; // Добавляем вариацию расстояния
        this.verticalVariation = 30; // Добавляем вариацию по вертикали

        // Создаем контейнер для отладочной графики
        // this.debugContainer = new PIXI.Container();
        // this.sceneManager.worldContainer.addChild(this.debugContainer);
    }

    init() {
        // Удаляем добавление обновления в игровой цикл отсюда, будем вызывать его из SceneManager
        // this.app.ticker.add(this.update.bind(this));
    }

    spawnDoctor() {
        const currentTime = Date.now();
        if (currentTime - this.lastSpawnTime < this.spawnInterval) return;

        // Проверяем расстояние до последнего доктора
        if (this.doctors.length > 0) {
            const lastDoctor = this.doctors[this.doctors.length - 1];
            const worldX = this.sceneManager.camera.getWorldPosition(this.app.screen.width);
            const distance = worldX - lastDoctor.sprite.x;
            if (distance < this.minSpawnDistance) return;
        }

        // Создаем нового доктора с случайным смещением
        const baseWorldX = this.sceneManager.camera.getWorldPosition(this.app.screen.width + 100);
        const randomDistance = Math.random() * this.spawnDistanceVariation;
        const worldX = baseWorldX + randomDistance;
        const grassY = this.getGrassY();
        const verticalOffset = (Math.random() - 0.5) * this.verticalVariation;
        const doctor = new Doctor(this.app, this.resources, worldX, grassY - 30 + verticalOffset, this.sceneManager);
        
        // Добавляем доктора в контейнер мира
        this.sceneManager.worldContainer.addChild(doctor.sprite);
        
        this.doctors.push(doctor);
        
        this.lastSpawnTime = currentTime;
    }

    getGrassY() {
        const desiredSoilHeight = 130;
        const soilY = Math.round(this.app.screen.height - desiredSoilHeight);
        return soilY + desiredSoilHeight - 150;
    }

    update(delta) {
        // Спавним новых докторов только если игра не окончена
        if (!this.sceneManager.rabbit.physics.gameOver) {
            this.spawnDoctor();
        }
        
        // Обновляем существующих докторов (они продолжают двигаться даже при gameOver)
        this.doctors = this.doctors.filter(doctor => {
            if (!doctor.isActive) {
                doctor.deactivate();
                return false;
            }

            doctor.update(delta);
            
            // Обновляем графику отладки
            // if (doctor.debugGraphics) {
            //     doctor.debugGraphics.clear();
            // }
            
            // Проверяем столкновение с кроликом только если доктор активен
            if (doctor.isActive) {
                const rabbit = this.sceneManager.rabbit;
                const doctorHitbox = doctor.hitbox;
                
                // Проверяем столкновение при ударе
                if (rabbit.physics.hitActive) {
                    const hitArea = rabbit.physics.hitArea;
                    const hitCollision = 
                        hitArea.x < doctorHitbox.x + doctorHitbox.width &&
                        hitArea.x + hitArea.width > doctorHitbox.x &&
                        hitArea.y < doctorHitbox.y + doctorHitbox.height &&
                        hitArea.y + hitArea.height > doctorHitbox.y;

                    if (hitCollision) {
                        console.log('Hit collision detected!');
                        this.handleCollision(doctor);
                        return false;
                    }
                }
                
                // Проверяем обычное столкновение с более точным хитбоксом кролика
                const rabbitX = rabbit.sprite.x;
                const rabbitY = rabbit.sprite.y;
                const rabbitWidth = rabbit.sprite.width * 0.4; // Уменьшаем ширину хитбокса
                const rabbitHeight = rabbit.sprite.height * 0.6; // Уменьшаем высоту хитбокса
                
                const regularCollision = 
                    rabbitX - rabbitWidth/2 < doctorHitbox.x + doctorHitbox.width &&
                    rabbitX + rabbitWidth/2 > doctorHitbox.x &&
                    rabbitY - rabbitHeight/2 < doctorHitbox.y + doctorHitbox.height &&
                    rabbitY + rabbitHeight/2 > doctorHitbox.y;

                if (regularCollision) {
                    console.log('Regular collision detected!', {
                        rabbit: {
                            x: rabbitX,
                            y: rabbitY,
                            width: rabbitWidth,
                            height: rabbitHeight
                        },
                        doctor: {
                            x: doctorHitbox.x,
                            y: doctorHitbox.y,
                            width: doctorHitbox.width,
                            height: doctorHitbox.height
                        }
                    });
                    this.handleCollision(doctor);
                    return false;
                }
            }
            
            return doctor.isActive;
        });
    }

    handleCollision(doctor) {
        const rabbit = this.sceneManager.rabbit;
        
        // If rabbit is hitting, deactivate the doctor and show blood splatter
        if (rabbit.physics.hitActive) {
            // Устанавливаем флаг, что кролик ударил доктора
            rabbit.physics.hitDoctor = true;
            
            // Воспроизводим звук удара по доктору
            if (this.sceneManager && this.sceneManager.playSound) {
                this.sceneManager.playSound('blow_to_doctor');
            }
            
            this.sceneManager.addCameraBloodSplatter(); // Add blood splatter to camera when hitting
            doctor.deactivate();
            return;
        }
        
        console.log('Regular collision detected, triggering game over');
        
        // Воспроизводим звук столкновения с доктором
        if (this.sceneManager && this.sceneManager.playSound) {
            this.sceneManager.playSound('the_rabbit_collided_with_the_doctor');
        }
        
        // Make the doctor smile and face right
        doctor.startSmiling();
        
        // Immediately stop rabbit movement and change texture
        rabbit.physics.speed = 0;
        rabbit.physics.isJumping = false;
        rabbit.physics.isHitting = false;
        rabbit.physics.gameOver = true;
        
        // Stop any current animations
        if (rabbit.animations) {
            rabbit.animations.stop();
        }
        
        // Disable controls
        if (rabbit.controls) {
            rabbit.controls.disable();
        }

        // Скрываем кнопку паузы и панель паузы
        if (this.sceneManager.uiManager && this.sceneManager.uiManager.pauseButton) {
            this.sceneManager.uiManager.pauseButton.visible = false;
        }
        if (this.sceneManager.uiManager && this.sceneManager.uiManager.pausePanel) {
            this.sceneManager.uiManager.pausePanel.visible = false;
        }
        
        // Start falling animation
        rabbit.animations.play('falling');
    }

    triggerGameOver(rabbit) {
        // This method is now just a wrapper for handleCollision
        this.handleCollision(rabbit);
    }

    cleanup() {
        // Удаляем всех докторов
        this.doctors.forEach(doctor => doctor.deactivate());
        this.doctors = [];
    }
} 