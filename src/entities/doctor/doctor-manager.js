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
                doctor.deactivate();
                return false;
            }

            doctor.update(delta);
            
            // Проверяем столкновение с кроликом только если доктор активен
            if (doctor.isActive && doctor.checkCollision(this.sceneManager.rabbit)) {
                this.handleCollision(doctor);
                doctor.deactivate();
                return false;
            }
            
            return doctor.isActive;
        });
    }

    handleCollision(doctor) {
        if (!doctor.isActive) return; // Предотвращаем повторную обработку столкновения
        
        // Если кролик в процессе удара (активен хитбокс), доктор исчезает
        if (this.sceneManager.rabbit.physics.hitActive) {
            this.sceneManager.rabbit.physics.hitDoctor = true;
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