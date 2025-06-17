export class EntityManager {
    constructor(app, resources, worldContainer, sceneManager) {
        this.app = app;
        this.resources = resources;
        this.worldContainer = worldContainer;
        this.sceneManager = sceneManager;

        // Сущности
        this.rabbit = null;
        this.doctorManager = null;
        this.vaccineManager = null;
        this.virusManager = null;

        // Эффекты
        this.bloodSplatterEffects = [];
        this.cameraBloodSplatterEffects = [];

        // Настройки кролика
        this.rabbitStartX = 200;

        this.init();
    }

    init() {
        this.createRabbit();
        this.createDoctorManager();
        this.createVaccineManager();
        this.createVirusManager();
        this.setupCamera();
    }

    createRabbit() {
        // Создаем зайца
        this.rabbit = new Rabbit(this.app, this.resources, this.sceneManager);
        this.worldContainer.addChildAt(this.rabbit.sprite, 0);  // Добавляем кролика на самый задний план

        // Устанавливаем начальную позицию кролика
        this.rabbit.sprite.x = this.rabbitStartX;
    }

    createDoctorManager() {
        // Создаем менеджер докторов
        this.doctorManager = new DoctorManager(this.app, this.resources, this.sceneManager);
        this.doctorManager.init();

        // Добавляем активных докторов в worldContainer
        if (this.doctorManager) {
            this.doctorManager.doctors.forEach(doctor => {
                if (doctor.isActive) {
                    this.worldContainer.addChild(doctor.sprite);
                }
            });
        }
    }

    createVaccineManager() {
        // Создаем менеджер вакцин
        this.vaccineManager = new VaccineManager(this.app, this.worldContainer, this.sceneManager);
        this.vaccineManager.init();
    }

    createVirusManager() {
        // Создаем менеджер вирусов
        this.virusManager = new VirusManager(this.app, this.worldContainer, this.sceneManager);
        this.virusManager.init();
    }

    setupCamera() {
        // Устанавливаем кролика как цель камеры
        this.sceneManager.camera.setTarget(this.rabbit);

        // Устанавливаем границы для камеры
        this.sceneManager.camera.minX = 0;
        this.sceneManager.camera.maxX = 10000; // Достаточно большое значение для бесконечной прокрутки
        this.sceneManager.camera.currentX = 0;
    }

    update(delta) {
        if (this.sceneManager.isPaused) return;

        // Проверяем, не окончена ли игра
        if (this.rabbit && this.rabbit.physics && this.rabbit.physics.gameOver) {
            return; // Останавливаем обновление игры, если кролик умер
        }

        // Обновляем кролика
        this.rabbit.update(delta);

        // Обновляем докторов
        if (this.doctorManager) {
            this.doctorManager.update(delta);
        }

        // Обновляем вакцины
        if (this.vaccineManager) {
            this.vaccineManager.update(delta);
        }

        // Обновляем вирусы
        if (this.virusManager) {
            this.virusManager.update(delta);
        }

        // Обновляем эффекты крови
        this.updateBloodSplatters(delta);
        this.updateCameraBloodSplatters(delta);
    }

    updateBloodSplatters(delta) {
        // Update blood splatter effects
        for (let i = this.bloodSplatterEffects.length - 1; i >= 0; i--) {
            const splatter = this.bloodSplatterEffects[i];
            splatter.update(delta);
            if (splatter.splatters.length === 0) {
                this.bloodSplatterEffects.splice(i, 1);
            }
        }
    }

    updateCameraBloodSplatters(delta) {
        // Update camera blood splatter effects
        for (let i = this.cameraBloodSplatterEffects.length - 1; i >= 0; i--) {
            const splatter = this.cameraBloodSplatterEffects[i];
            splatter.alpha -= splatter.fadeSpeed * delta;
            if (splatter.alpha <= 0) {
                if (splatter.parent) {
                    this.app.stage.removeChild(splatter);
                }
                this.cameraBloodSplatterEffects.splice(i, 1);
            }
        }
    }

    // Метод для добавления эффектов крови
    addBloodSplatter(splatter) {
        this.bloodSplatterEffects.push(splatter);
    }

    // Метод для добавления эффектов крови на камеру
    addCameraBloodSplatter() {
        // Create one large blood splatter on the camera
        const splatterTextureName = Math.random() < 0.5 ? 'blood_spatter_1.png' : 'blood_spatter_3.png';
        const splatter = new PIXI.Sprite(this.resources.textures[splatterTextureName]);
        splatter.anchor.set(0.5);
        splatter.scale.set(6.0 + Math.random() * 3.0); // Extremely large scale to ensure full screen coverage

        if (splatterTextureName === 'blood_spatter_1.png') {
            // Position for blood_spatter_1.png (bottom-left corner)
            splatter.x = this.app.screen.width * 0.2;
            splatter.y = this.app.screen.height * 0.8;
        } else {
            // Randomly position on left or right side of the screen for other splatters
            if (Math.random() < 0.5) {
                splatter.x = this.app.screen.width * 0.2 + Math.random() * this.app.screen.width * 0.1; // Left side
            } else {
                splatter.x = this.app.screen.width * 0.8 - Math.random() * this.app.screen.width * 0.1; // Right side
            }
            splatter.y = this.app.screen.height * 0.5 + (Math.random() - 0.5) * this.app.screen.height * 0.2; // Vertical position slightly randomized around center
        }

        splatter.rotation = Math.random() * Math.PI * 2;
        splatter.alpha = 1;
        splatter.fadeSpeed = 0.005 + Math.random() * 0.005; // Faster fade for a more noticeable disappearance
        this.cameraBloodSplatterEffects.push(splatter);
        this.app.stage.addChild(splatter);
    }

    cleanup() {
        // Очищаем докторов
        if (this.doctorManager) {
            this.doctorManager.cleanup();
        }

        // Очищаем вакцины
        if (this.vaccineManager) {
            this.vaccineManager.cleanup();
        }

        // Очищаем вирусы
        if (this.virusManager) {
            this.virusManager.cleanup();
        }

        // Очищаем эффекты крови
        this.bloodSplatterEffects.forEach(effect => effect.cleanup());
        this.bloodSplatterEffects = [];
        this.cameraBloodSplatterEffects.forEach(effect => effect.cleanup());
        this.cameraBloodSplatterEffects = [];

        // Очищаем кролика
        if (this.rabbit) {
            this.rabbit.cleanup();
        }
    }

    reset() {
        // Сбрасываем все сущности
        this.cleanup();

        // Сбрасываем ссылки
        this.rabbit = null;
        this.doctorManager = null;
        this.vaccineManager = null;
        this.virusManager = null;

        // Пересоздаем сущности
        this.init();
    }

    // Геттеры для доступа к сущностям
    getRabbit() {
        return this.rabbit;
    }

    getDoctorManager() {
        return this.doctorManager;
    }

    getVaccineManager() {
        return this.vaccineManager;
    }

    getVirusManager() {
        return this.virusManager;
    }
}
