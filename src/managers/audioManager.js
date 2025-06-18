export class AudioManager {
    constructor() {
        this.sounds = {};
        this.volume = 0.5;
        this.backgroundMusic = null;
        this.backgroundMusicVolume = 0.3; // Приглушенная громкость для фоновой музыки
        this.hasUserInteracted = false; // Флаг первого взаимодействия пользователя
        
        // Загружаем состояние звука из localStorage
        const savedSoundState = localStorage.getItem('soundEnabled');
        this.isSoundEnabled = savedSoundState === null ? true : savedSoundState === 'true';
        
        this.init();
    }

    init() {
        // Создаем аудио элементы для каждого звука
        this.loadSound('collected_the_virus', '/audio/collected_the_virus.mp3');
        this.loadSound('fail', '/audio/fail.mp3');
        this.loadSound('blow_to_doctor', '/audio/blow_to_doctor.mp3');
        this.loadSound('hits_the_ground', '/audio/hits_the_ground.mp3');
        this.loadSound('bunny_jumping', '/audio/bunny_jumping.mp3');
        this.loadSound('rabbit_runs', '/audio/rabbit_runs.mp3');
        this.loadSound('the_rabbit_collided_with_the_doctor', '/audio/the_rabbit_collided_with_the_doctor.mp3');
        this.loadSound('vaccine_explosion', '/audio/Vaccine_explosion.mp3');
        this.loadSound('vaccine_injury', '/audio/Vaccine_injury.mp3');
        
        // Загружаем фоновую музыку
        this.loadBackgroundMusic();
    }

    loadBackgroundMusic() {
        this.backgroundMusic = new Audio('/audio/Monkeys-Spinning-Monkeys.mp3');
        this.backgroundMusic.loop = true; // Зацикливаем музыку
        this.backgroundMusic.volume = this.backgroundMusicVolume;
        this.backgroundMusic.preload = 'auto';
    }

    // Метод для отметки первого взаимодействия пользователя
    markUserInteraction() {
        if (!this.hasUserInteracted) {
            this.hasUserInteracted = true;
            // Запускаем фоновую музыку при первом взаимодействии
            this.startBackgroundMusic();
        }
    }

    loadSound(name, src) {
        const audio = new Audio();
        audio.src = src;
        audio.preload = 'auto';
        audio.volume = this.volume;
        
        this.sounds[name] = audio;
    }

    playSound(name) {
        // Отмечаем взаимодействие пользователя при любом звуке
        this.markUserInteraction();
        
        if (!this.isSoundEnabled || !this.sounds[name]) {
            return null;
        }
        
        try {
            // Создаем копию аудио для возможности одновременного воспроизведения
            const audioClone = this.sounds[name].cloneNode();
            audioClone.volume = this.volume;
            audioClone.play().catch(error => {
                console.warn('Ошибка воспроизведения звука:', error);
            });
            return audioClone;
        } catch (error) {
            console.warn('Ошибка воспроизведения звука:', error);
            return null;
        }
    }

    startBackgroundMusic() {
        if (this.backgroundMusic && this.isSoundEnabled && this.hasUserInteracted) {
            this.backgroundMusic.volume = this.backgroundMusicVolume;
            this.backgroundMusic.play().catch(error => {
                console.warn('Ошибка воспроизведения фоновой музыки:', error);
            });
        }
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    }

    stopSound(audioElement) {
        if (audioElement) {
            try {
                audioElement.pause();
                audioElement.currentTime = 0;
            } catch (error) {
                console.warn('Ошибка остановки звука:', error);
            }
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // Обновляем громкость для всех загруженных звуков
        Object.values(this.sounds).forEach(audio => {
            audio.volume = this.volume;
        });
    }

    toggleSound() {
        this.isSoundEnabled = !this.isSoundEnabled;
        
        // Сохраняем состояние звука в localStorage
        localStorage.setItem('soundEnabled', this.isSoundEnabled.toString());
        
        // Управляем фоновой музыкой в зависимости от состояния звука
        if (this.isSoundEnabled) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
        
        return this.isSoundEnabled;
    }

    isSoundOn() {
        return this.isSoundEnabled;
    }
} 