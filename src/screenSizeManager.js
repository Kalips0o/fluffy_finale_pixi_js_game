export class ScreenSizeManager {
    constructor() {
        this.minWidth = 768;
        this.minHeight = 600;
        this.screenTooSmallElement = null;
        this.gameContainer = null;
        this.isMobile = false;
        
        this.init();
    }
    
    init() {
        this.screenTooSmallElement = document.getElementById('screen-too-small');
        this.gameContainer = document.getElementById('game-container');
        
        if (!this.screenTooSmallElement) {
            console.error('Screen too small element not found');
            return;
        }
        
        // Определяем мобильное устройство
        this.detectMobile();
        
        // Проверяем размер экрана при загрузке
        this.checkScreenSize();
        
        // Добавляем слушатель изменения размера окна
        window.addEventListener('resize', () => {
            this.checkScreenSize();
        });
        
        // Добавляем слушатель изменения ориентации (для мобильных устройств)
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.checkScreenSize();
            }, 100);
        });
    }
    
    detectMobile() {
        // Проверяем различные признаки мобильного устройства
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileUA = /mobile|android|iphone|ipad|phone|blackberry|opera mini|iemobile/i.test(userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 600;
        
        this.isMobile = isMobileUA || isTouchDevice || isSmallScreen;
        
        console.log(`Mobile detection: UA=${isMobileUA}, Touch=${isTouchDevice}, Small=${isSmallScreen}, IsMobile=${this.isMobile}`);
    }
    
    checkScreenSize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Если это мобильное устройство, показываем изображение
        if (this.isMobile) {
            this.showScreenTooSmall();
            return;
        }
        
        const isTooSmall = width < this.minWidth || height < this.minHeight;
        
        if (isTooSmall) {
            this.showScreenTooSmall();
        } else {
            this.hideScreenTooSmall();
        }
        
        console.log(`Screen size: ${width}x${height}, Too small: ${isTooSmall}, Mobile: ${this.isMobile}`);
    }
    
    showScreenTooSmall() {
        if (this.screenTooSmallElement) {
            this.screenTooSmallElement.style.display = 'flex';
        }
        
        // Останавливаем игру если она запущена
        if (window.sceneManager) {
            window.sceneManager.isPaused = true;
        }
    }
    
    hideScreenTooSmall() {
        if (this.screenTooSmallElement) {
            this.screenTooSmallElement.style.display = 'none';
        }
        
        // Возобновляем игру если она была остановлена из-за размера экрана
        if (window.sceneManager && window.sceneManager.isPaused) {
            // Проверяем, что пауза была вызвана размером экрана, а не пользователем
            // Здесь можно добавить дополнительную логику если нужно
        }
    }
    
    // Метод для изменения минимальных размеров
    setMinSize(width, height) {
        this.minWidth = width;
        this.minHeight = height;
        this.checkScreenSize();
    }
    
    // Метод для принудительного включения/выключения мобильного режима
    setMobileMode(enabled) {
        this.isMobile = enabled;
        this.checkScreenSize();
    }
} 