import * as PIXI from 'pixi.js';

export class EffectManager {
    constructor(app, resources, sceneManager) {
        this.app = app;
        this.resources = resources;
        this.sceneManager = sceneManager;
        
        // Эффекты крови
        this.bloodSplatterEffects = [];
        this.cameraBloodSplatterEffects = [];
        
        this.init();
    }

    init() {
        // Инициализация менеджера эффектов
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

    // Обновление эффектов крови
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

    // Обновление эффектов крови на камере
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

    // Обновление всех эффектов
    update(delta) {
        this.updateBloodSplatters(delta);
        this.updateCameraBloodSplatters(delta);
    }

    // Очистка всех эффектов
    cleanup() {
        // Очищаем эффекты крови
        this.bloodSplatterEffects.forEach(effect => effect.cleanup());
        this.bloodSplatterEffects = [];
        this.cameraBloodSplatterEffects.forEach(effect => effect.cleanup());
        this.cameraBloodSplatterEffects = [];
    }

    // Сброс всех эффектов
    reset() {
        this.cleanup();
    }

    // Геттеры для доступа к эффектам
    getBloodSplatterEffects() {
        return this.bloodSplatterEffects;
    }

    getCameraBloodSplatterEffects() {
        return this.cameraBloodSplatterEffects;
    }
}
