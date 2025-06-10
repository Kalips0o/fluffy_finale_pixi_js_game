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
        this.minSpawnDistance = 1000; // Минимальное расстояние между докторами

        // Создаем контейнер для отладочной графики
        this.debugContainer = new PIXI.Container();
        this.sceneManager.worldContainer.addChild(this.debugContainer);
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

        // Создаем нового доктора
        const worldX = this.sceneManager.camera.getWorldPosition(this.app.screen.width + 100);
        const grassY = this.getGrassY();
        const doctor = new Doctor(this.app, this.resources, worldX, grassY - 50, this.sceneManager);
        
        // Добавляем доктора в контейнер мира
        this.sceneManager.worldContainer.addChild(doctor.sprite);
        
        // Создаем и добавляем графику для отладки
        doctor.debugGraphics = new PIXI.Graphics();
        this.debugContainer.addChild(doctor.debugGraphics);
        
        this.doctors.push(doctor);
        
        this.lastSpawnTime = currentTime;
    }

    getGrassY() {
        const desiredSoilHeight = 130;
        const soilY = Math.round(this.app.screen.height - desiredSoilHeight);
        return soilY + desiredSoilHeight - 150;
    }

    update(delta) {
        // Спавним новых докторов
        this.spawnDoctor();

        // Обновляем существующих докторов
        this.doctors = this.doctors.filter(doctor => {
            if (!doctor.isActive) {
                // Удаляем графику отладки
                if (doctor.debugGraphics && doctor.debugGraphics.parent) {
                    doctor.debugGraphics.parent.removeChild(doctor.debugGraphics);
                }
                doctor.deactivate();
                return false;
            }

            doctor.update(delta);
            
            // Обновляем графику отладки
            if (doctor.debugGraphics) {
                doctor.debugGraphics.clear();
                doctor.debugGraphics.lineStyle(2, 0x00FF00);
                doctor.debugGraphics.drawRect(doctor.hitbox.x, doctor.hitbox.y, doctor.hitbox.width, doctor.hitbox.height);
            }
            
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
            this.sceneManager.addCameraBloodSplatter(); // Add blood splatter to camera when hitting
            doctor.deactivate();
            return;
        }
        
        console.log('Regular collision detected, triggering game over');
        // Immediately stop rabbit movement and change texture
        rabbit.physics.speed = 0;
        rabbit.physics.isJumping = false;
        rabbit.physics.isHitting = false;
        rabbit.physics.gameOver = true;
        
        // Stop any current animations
        if (rabbit.animations) {
            rabbit.animations.stop();
        }
        
        // Change to falling sprite immediately
        rabbit.sprite.texture = rabbit.resources.textures['rabbit_fell_2.png'];
        const scale = 0.15;
        rabbit.sprite.scale.set(scale);
        if (rabbit.direction === -1) {
            rabbit.sprite.scale.x = -scale;
        }
        rabbit.sprite.rotation = 0;
        
        // Disable controls
        if (rabbit.controls) {
            rabbit.controls.disable();
        }
        
        // Start falling animation after a short delay
        setTimeout(() => {
            this.playFallingAnimation(rabbit);
        }, 100);
    }

    triggerGameOver(rabbit) {
        // This method is now just a wrapper for handleCollision
        this.handleCollision(rabbit);
    }

    playFallingAnimation(rabbit) {
        // Start spiral falling animation
        const startX = rabbit.sprite.x;
        const startY = rabbit.sprite.y;
        const direction = rabbit.direction;
        const groundY = rabbit.physics.getGrassY();
        
        // Define bounce points with increased distance and height
        const bounces = [
            { x: startX + (direction * 150), y: groundY - 20, rotation: Math.PI * 0.5 },  // First bounce
            { x: startX + (direction * 280), y: groundY - 15, rotation: Math.PI * 1.2 },  // Second bounce
            { x: startX + (direction * 350), y: groundY - 80, rotation: Math.PI * 1.8 }   // Final jump before hiding
        ];
        
        const duration = 2500;
        const startTime = Date.now();
        
        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Calculate which bounce we're in
            const bounceProgress = progress * bounces.length;
            const currentBounce = Math.floor(bounceProgress);
            const bounceFraction = bounceProgress - currentBounce;
            
            // Get current and next bounce points
            const current = bounces[Math.min(currentBounce, bounces.length - 1)];
            const next = bounces[Math.min(currentBounce + 1, bounces.length - 1)];
            
            // Calculate position with bounce effect
            if (currentBounce < bounces.length - 1) {
                // Parabolic movement between bounces
                const height = 50 * Math.sin(bounceFraction * Math.PI);
                rabbit.sprite.x = current.x + (next.x - current.x) * bounceFraction;
                rabbit.sprite.y = current.y + (next.y - current.y) * bounceFraction - height;
                rabbit.sprite.rotation = current.rotation + (next.rotation - current.rotation) * bounceFraction;
            } else {
                // Final jump and hide
                const finalProgress = (progress - (bounces.length - 1) / bounces.length) * bounces.length;
                
                if (finalProgress < 0.5) {
                    // Jump up
                    const jumpHeight = 100 * Math.sin(finalProgress * Math.PI);
                    rabbit.sprite.x = next.x;
                    rabbit.sprite.y = next.y - jumpHeight;
                    rabbit.sprite.rotation = next.rotation;
                } else {
                    // Move behind grass
                    rabbit.sprite.x = next.x;
                    rabbit.sprite.y = groundY + 50; // Move below grass
                    rabbit.sprite.rotation = next.rotation;
                }
            }
            
            // Ensure the falling texture is maintained
            rabbit.sprite.texture = rabbit.resources.textures['rabbit_fell_2.png'];
            
            // Continue animation if not finished
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Move to back layer only at the very end
                if (rabbit.sprite.parent) {
                    rabbit.sprite.parent.removeChild(rabbit.sprite);
                    rabbit.sceneManager.worldContainer.addChildAt(rabbit.sprite, 0);
                }
                
                // Hide sprite and show game over
                rabbit.sprite.visible = false;
                this.showGameOver();
            }
        };
        
        // Start animation
        requestAnimationFrame(animate);
    }

    showGameOver() {
        const gameOverSprite = new PIXI.Sprite(this.resources.textures['game-over.png']);
        gameOverSprite.anchor.set(0.5);
        gameOverSprite.x = this.app.screen.width / 2;
        gameOverSprite.y = this.app.screen.height / 2;
        gameOverSprite.scale.set(0.5);
        
        // Add to stage instead of world container so it's not affected by camera
        this.app.stage.addChild(gameOverSprite);
        
        // Add click handler to restart game
        gameOverSprite.interactive = true;
        gameOverSprite.on('pointerdown', () => {
            window.location.reload();
        });
    }

    cleanup() {
        // Удаляем всех докторов
        this.doctors.forEach(doctor => doctor.deactivate());
        this.doctors = [];
    }
} 