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
        
        // If rabbit is just passing through, trigger game over
        this.triggerGameOver(rabbit);
    }

    triggerGameOver(rabbit) {
        // Stop rabbit movement
        rabbit.physics.speed = 0;
        rabbit.physics.isJumping = false;
        rabbit.physics.isHitting = false;
        rabbit.physics.gameOver = true;
        
        // Play falling animation sequence
        this.playFallingAnimation(rabbit);
    }

    playFallingAnimation(rabbit) {
        // Immediately change to falling sprite and set proper scale
        rabbit.sprite.texture = rabbit.resources.textures['rabbit_fell_2.png'];
        const scale = 0.15;
        rabbit.sprite.scale.set(scale);
        if (rabbit.direction === -1) {
            rabbit.sprite.scale.x = -scale;
        }
        
        // Start spiral falling animation
        const startX = rabbit.sprite.x;
        const startY = rabbit.sprite.y;
        const direction = rabbit.direction; // Get rabbit's direction
        const targetX = startX + (direction * 200); // Move forward in the direction rabbit was moving
        const targetY = startY - 150; // First move up
        const finalY = startY - 50; // Fall between grass layers
        const startRotation = 0;
        const targetRotation = Math.PI * 4; // Two full rotations
        const duration = 2000; // 2 seconds for smoother animation
        const startTime = Date.now();
        
        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smoother easing function
            const easeProgress = 1 - Math.pow(1 - progress, 4); // Changed to power of 4 for smoother motion
            
            // Calculate spiral movement with smoother sine
            const spiralProgress = Math.sin(progress * Math.PI * 3) * 40; // Reduced amplitude and frequency
            
            // Update position with spiral effect
            rabbit.sprite.x = startX + (targetX - startX) * easeProgress + spiralProgress;
            
            // First move up, then down with smoother transition
            if (progress < 0.4) { // Longer upward phase
                // Moving up phase with smooth easing
                const upProgress = progress / 0.4; // Scale to 0-1
                const upEase = 1 - Math.pow(1 - upProgress, 2); // Quadratic easing
                rabbit.sprite.y = startY + (targetY - startY) * upEase;
            } else {
                // Falling down phase with smooth easing
                const downProgress = (progress - 0.4) / 0.6; // Scale to 0-1
                const downEase = 1 - Math.pow(1 - downProgress, 3); // Cubic easing
                rabbit.sprite.y = targetY + (finalY - targetY) * downEase;
            }
            
            // Smoother rotation
            rabbit.sprite.rotation = startRotation + targetRotation * easeProgress;
            
            // Continue animation if not finished
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Hide rabbit completely after animation
                rabbit.sprite.visible = false;
                
                // Show game over screen
                setTimeout(() => {
                    this.showGameOver();
                }, 500);
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