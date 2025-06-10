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
        const doctor = new Doctor(this.app, this.resources, worldX, grassY - 50);
        
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
                if (rabbit.physics.hitActive) {
                    // Проверяем пересечение хитбоксов
                    const hitArea = rabbit.physics.hitArea;
                    const doctorHitbox = doctor.hitbox;
                    
                    // Проверяем пересечение по всем сторонам
                    const collision = 
                        hitArea.x < doctorHitbox.x + doctorHitbox.width &&
                        hitArea.x + hitArea.width > doctorHitbox.x &&
                        hitArea.y < doctorHitbox.y + doctorHitbox.height &&
                        hitArea.y + hitArea.height > doctorHitbox.y;

                    if (collision) {
                        console.log('Collision detected!', {
                            hitArea: {
                                x: hitArea.x,
                                y: hitArea.y,
                                width: hitArea.width,
                                height: hitArea.height
                            },
                            doctorHitbox: {
                                x: doctorHitbox.x,
                                y: doctorHitbox.y,
                                width: doctorHitbox.width,
                                height: doctorHitbox.height
                            }
                        });
                        this.handleCollision(doctor);
                        doctor.deactivate();
                        return false;
                    }
                }
            }
            
            return doctor.isActive;
        });
    }

    handleCollision(doctor) {
        if (!doctor.isActive) return; // Предотвращаем повторную обработку столкновения
        
        // Если кролик в процессе удара (активен хитбокс), доктор исчезает
        if (this.sceneManager.rabbit.physics.hitActive) {
            console.log('Setting hitDoctor flag'); // Добавляем отладочный вывод
            // Устанавливаем флаг удара по доктору
            this.sceneManager.rabbit.physics.hitDoctor = true;
            // Деактивируем доктора
            doctor.deactivate();
        } else {
            // Иначе кролик получает урон
            this.sceneManager.rabbit.takeDamage();
        }
    }

    cleanup() {
        // Удаляем всех докторов
        this.doctors.forEach(doctor => doctor.deactivate());
        this.doctors = [];
    }
} 