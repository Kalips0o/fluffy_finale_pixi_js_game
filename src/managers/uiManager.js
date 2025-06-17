import * as PIXI from 'pixi.js';

export class UIManager {
    constructor(app, resources, sceneManager) {
        this.app = app;
        this.resources = resources;
        this.sceneManager = sceneManager;
        
        // UI state
        this.isPaused = false;
        this.countersShown = false;
        this.virusCount = 0;
        this.bestScore = 0;
        
        // UI elements
        this.pauseButton = null;
        this.pausePanel = null;
        this.virusCounterContainer = null;
        this.virulenceBarContainer = null;
        this.bestScoreContainer = null;
        this.virusDigitSprites = [];
        this.bestDigitSprites = [];
        this.commaSprite = null;
        this.bestCommaSprite = null;
        this.virulenceBarBackground = null;
        this.virulenceBarFill = null;
        this.virulenceSign = null;
        this.bestSprite = null;
        
        this.init();
    }

    init() {
        this.createPauseButton();
        this.createVirusCounter();
        this.loadBestScore();
    }

    createPauseButton() {
        // Create pause button
        const pauseButton = new PIXI.Sprite(PIXI.Texture.from('assets/hud/pause.png'));
        pauseButton.anchor.set(0.5);
        pauseButton.scale.set(0.5); // Изначально уменьшена для анимации
        pauseButton.x = this.app.screen.width - 120;
        pauseButton.y = this.app.screen.height - 150;
        pauseButton.interactive = true;
        pauseButton.buttonMode = true;
        pauseButton.visible = false; // Initially hidden
        pauseButton.alpha = 0; // Изначально прозрачна

        // Add hover effects
        pauseButton.on('pointerover', () => {
            pauseButton.scale.set(0.33);
            pauseButton.tint = 0xDDDDDD;
        });
        pauseButton.on('pointerout', () => {
            pauseButton.scale.set(0.3);
            pauseButton.tint = 0xFFFFFF;
        });

        pauseButton.on('pointerdown', () => {
            this.togglePause();
        });

        this.app.stage.addChild(pauseButton);
        this.pauseButton = pauseButton;
    }

    createPausePanel() {
        // Create pause panel container
        const pausePanel = new PIXI.Container();

        // Create background panel
        const panelBg = new PIXI.Sprite(PIXI.Texture.from('assets/hud/pausedPanel.png'));
        panelBg.anchor.set(0.5);
        panelBg.x = this.app.screen.width / 2;
        panelBg.y = this.app.screen.height / 2;
        panelBg.scale.set(0.6);
        pausePanel.addChild(panelBg);

        // Create sound button
        const soundButton = new PIXI.Sprite(PIXI.Texture.from('assets/hud/soundOn.png'));
        soundButton.anchor.set(0.5);
        soundButton.x = this.app.screen.width / 2 - 160;
        soundButton.y = this.app.screen.height / 2;
        soundButton.scale.set(0.32);
        soundButton.interactive = true;
        soundButton.buttonMode = true;

        // Add hover effects
        soundButton.on('pointerover', () => {
            soundButton.scale.set(0.35);
            soundButton.tint = 0xDDDDDD;
        });
        soundButton.on('pointerout', () => {
            soundButton.scale.set(0.32);
            soundButton.tint = 0xFFFFFF;
        });

        // Add click handler to toggle sound button texture
        soundButton.on('pointerdown', () => {
            const currentTexture = soundButton.texture;
            if (currentTexture === PIXI.Texture.from('assets/hud/soundOn.png')) {
                soundButton.texture = PIXI.Texture.from('assets/hud/soundOff.png');
            } else {
                soundButton.texture = PIXI.Texture.from('assets/hud/soundOn.png');
            }
        });

        pausePanel.addChild(soundButton);

        // Create continue button
        const continueButton = new PIXI.Sprite(PIXI.Texture.from('assets/hud/ContinuePlay.png'));
        continueButton.anchor.set(0.5);
        continueButton.x = this.app.screen.width / 2;
        continueButton.y = this.app.screen.height / 2;
        continueButton.scale.set(0.32);
        continueButton.interactive = true;
        continueButton.buttonMode = true;

        // Add hover effects
        continueButton.on('pointerover', () => {
            continueButton.scale.set(0.35);
            continueButton.tint = 0xDDDDDD;
        });
        continueButton.on('pointerout', () => {
            continueButton.scale.set(0.32);
            continueButton.tint = 0xFFFFFF;
        });

        continueButton.on('pointerdown', () => {
            this.togglePause();
        });

        pausePanel.addChild(continueButton);

        // Create restart button
        const restartButton = new PIXI.Sprite(PIXI.Texture.from('assets/hud/RestartPlay.png'));
        restartButton.anchor.set(0.5);
        restartButton.x = this.app.screen.width / 2 + 160;
        restartButton.y = this.app.screen.height / 2;
        restartButton.scale.set(0.32);
        restartButton.interactive = true;
        restartButton.buttonMode = true;

        // Add hover effects
        restartButton.on('pointerover', () => {
            restartButton.scale.set(0.35);
            restartButton.tint = 0xDDDDDD;
        });
        restartButton.on('pointerout', () => {
            restartButton.scale.set(0.32);
            restartButton.tint = 0xFFFFFF;
        });

        restartButton.on('pointerdown', () => {
            // Удаляем табличку START перед перезагрузкой
            if (this.sceneManager) {
                this.sceneManager.removeStartSign();
            }
            
            // Restart game logic
            location.reload();
        });

        pausePanel.addChild(restartButton);

        // Initially hide the panel
        pausePanel.alpha = 0;
        pausePanel.visible = false;

        this.app.stage.addChild(pausePanel);
        this.pausePanel = pausePanel;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.showPausePanel();
        } else {
            this.hidePausePanel();
        }
        
        // Notify scene manager about pause state change
        if (this.sceneManager) {
            this.sceneManager.isPaused = this.isPaused;
        }
    }

    showPausePanel() {
        if (!this.pausePanel) {
            this.createPausePanel();
        }

        this.pausePanel.visible = true;
        this.pausePanel.alpha = 0;

        // Animate panel appearance
        const duration = 300;
        const startTime = Date.now();
        const startScale = 0.8;
        const endScale = 1.0;

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const scale = startScale + (endScale - startScale) * this.easeOutElastic(progress);
            const alpha = progress;

            this.pausePanel.scale.set(scale);
            this.pausePanel.alpha = alpha;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    hidePausePanel() {
        if (!this.pausePanel) return;

        const duration = 200;
        const startTime = Date.now();
        const startAlpha = this.pausePanel.alpha;

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            this.pausePanel.alpha = startAlpha * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.pausePanel.visible = false;
            }
        };

        requestAnimationFrame(animate);
    }

    createVirusCounter() {
        // Создаем контейнер для счетчика
        this.virusCounterContainer = new PIXI.Container();
        this.virusCounterContainer.x = this.app.screen.width - 570; // Перемещаем весь счетчик еще правее
        this.virusCounterContainer.y = 70; // Та же высота, что и у шкалы
        this.virusCounterContainer.alpha = 0; // Изначально скрыт
        this.virusCounterContainer.scale.set(0.5); // Изначально уменьшен
        this.app.stage.addChild(this.virusCounterContainer);

        // Создаем спрайты для цифр
        this.virusDigitSprites = [];
        for (let i = 0; i < 4; i++) { // Поддерживаем до 9999 вирусов
            const digitSprite = new PIXI.Sprite(this.resources.textures['0.png']);
            digitSprite.anchor.set(0.5);
            digitSprite.scale.set(0.3);
            digitSprite.x = i * 65;
            digitSprite.visible = true;
            this.virusCounterContainer.addChild(digitSprite);
            this.virusDigitSprites.push(digitSprite);
        }

        // Добавляем запятую (изначально скрыта)
        this.commaSprite = new PIXI.Sprite(this.resources.textures['comma.png']);
        this.commaSprite.anchor.set(0.5);
        this.commaSprite.scale.set(0.15);
        this.commaSprite.x = -10; // Изначальное положение запятой (будет переопределено)
        this.commaSprite.visible = false;
        this.virusCounterContainer.addChild(this.commaSprite);

        this.createVirulenceBar();

        // Обновляем отображение счетчика
        this.updateVirusCounter();
    }

    createVirulenceBar() {
        this.virulenceBarContainer = new PIXI.Container();
        this.virulenceBarContainer.x = this.app.screen.width - 172; // Располагаем справа в углу
        this.virulenceBarContainer.y = 70; // Та же высота, что и у счетчика
        this.virulenceBarContainer.alpha = 0; // Изначально скрыт
        this.virulenceBarContainer.scale.set(0.5); // Изначально уменьшен
        this.app.stage.addChild(this.virulenceBarContainer);

        // Background of the virulence bar (skale.png) - добавляем первым (будет на заднем плане)
        this.virulenceBarBackground = new PIXI.Sprite(this.resources.textures['skale.png']);
        this.virulenceBarBackground.scale.set(32 / 37); // Увеличиваем масштаб, чтобы высота стала примерно 30 пикселей
        this.virulenceBarBackground.anchor.set(0.5);
        this.virulenceBarBackground.x = 0;
        this.virulenceBarBackground.y = 0;
        this.virulenceBarContainer.addChild(this.virulenceBarBackground);

        // Green filling for the virulence bar
        this.virulenceBarFill = new PIXI.Graphics();
        this.virulenceBarFill.beginFill(0x00FF00);
        this.virulenceBarFill.drawRect(0, 0, 0, this.virulenceBarBackground.height * 0.9); // Slightly smaller than background
        this.virulenceBarFill.endFill();
        this.virulenceBarFill.x = -this.virulenceBarBackground.width * 0.5;
        this.virulenceBarFill.y = -this.virulenceBarBackground.height * 0.35;
        this.virulenceBarContainer.addChild(this.virulenceBarFill);

        // Add the virulence sign (table.png) - добавляем последним (будет на переднем плане)
        this.virulenceSign = new PIXI.Sprite(this.resources.textures['table.png']);
        this.virulenceSign.anchor.set(0.5);
        this.virulenceSign.scale.set(0.3);
        this.virulenceSign.x = 0;
        this.virulenceSign.y = 0;
        this.virulenceBarContainer.addChild(this.virulenceSign);

        // Добавляем элемент "Best" под табличкой вирулентности
        this.createBestScore();

        this.updateVirulenceBar();
    }

    createBestScore() {
        // Создаем контейнер для лучшего результата
        this.bestScoreContainer = new PIXI.Container();
        this.bestScoreContainer.x = this.app.screen.width - 172; // Та же позиция X что и у таблички вирулентности
        this.bestScoreContainer.y = 145; // Под табличкой вирулентности
        this.bestScoreContainer.alpha = 0; // Изначально скрыт
        this.bestScoreContainer.scale.set(0.7); // Изначально уменьшен
        this.app.stage.addChild(this.bestScoreContainer);

        // Добавляем картинку "best" из текстур
        this.bestSprite = new PIXI.Sprite(this.resources.textures['best.png']);
        this.bestSprite.anchor.set(0.5);
        this.bestSprite.scale.set(0.3); // Уменьшаем размер слова BEST еще
        this.bestSprite.x = -50; // Смещаем левее
        this.bestSprite.y = 5;
        this.bestScoreContainer.addChild(this.bestSprite);

        // Создаем спрайты для цифр лучшего результата
        this.bestDigitSprites = [];
        for (let i = 0; i < 4; i++) { // Поддерживаем до 9999 вирусов
            const digitSprite = new PIXI.Sprite(this.resources.textures['0.png']);
            digitSprite.anchor.set(0.5);
            digitSprite.scale.set(0.13); // Уменьшаем размер цифр
            digitSprite.x = 60 * i; // Промежуток между цифрами
            digitSprite.visible = true;
            this.bestScoreContainer.addChild(digitSprite);
            this.bestDigitSprites.push(digitSprite);
        }

        // Добавляем запятую для лучшего результата (изначально скрыта)
        this.bestCommaSprite = new PIXI.Sprite(this.resources.textures['comma.png']);
        this.bestCommaSprite.anchor.set(0.5);
        this.bestCommaSprite.scale.set(0.12); // Уменьшаем размер запятой
        this.bestCommaSprite.x = -15;
        this.bestCommaSprite.visible = false;
        this.bestScoreContainer.addChild(this.bestCommaSprite);

        // Загружаем лучший результат из sessionStorage
        this.loadBestScore();
        this.updateBestScore();
    }

    updateVirulenceBar() {
        if (this.virulenceBarFill) {
            const maxWidth = this.virulenceBarBackground.width * 0.99; // Уменьшаем максимальную ширину, чтобы шкала не выходила за табличку
            const clampedVirusCount = Math.min(this.virusCount, 1000); // Ограничиваем до 1000 вирусов
            const fillWidth = (clampedVirusCount / 1000) * maxWidth;
            this.virulenceBarFill.clear();
            this.virulenceBarFill.beginFill(0x00FF00);
            this.virulenceBarFill.drawRect(0, 0, fillWidth, this.virulenceBarBackground.height * 0.9);
            this.virulenceBarFill.endFill();
            this.virulenceBarFill.x = -this.virulenceBarBackground.width * 0.5;
            this.virulenceBarFill.y = -this.virulenceBarBackground.height * 0.35;
        }
    }

    updateVirusCounter() {
        const count = this.virusCount.toString();
        const numDigits = count.length;

        // The rightmost position for the last digit. We use the last sprite slot.
        const rightmostDigitSlotX = (this.virusDigitSprites.length - 1) * 65;

        for (let i = 0; i < this.virusDigitSprites.length; i++) {
            const digitSprite = this.virusDigitSprites[i];

            // Determine the index of the digit in 'count' that corresponds to this sprite slot 'i'
            const digitIndexInCount = i - (this.virusDigitSprites.length - numDigits);

            if (digitIndexInCount >= 0 && digitIndexInCount < numDigits) {
                const digitChar = count[digitIndexInCount];
                digitSprite.texture = this.resources.textures[`${digitChar}.png`];
                digitSprite.visible = true;
                // Position for right alignment (relative to the container)
                digitSprite.x = rightmostDigitSlotX - (this.virusDigitSprites.length - 1 - i) * 65;
            } else {
                digitSprite.visible = false; // Hide leading unused slots
            }
        }

        // Position comma for right alignment
        if (this.virusCount > 999) {
            this.commaSprite.visible = true;
            // Comma should be after the thousands digit.
            // The actual visible thousands digit sprite will be at index (this.virusDigitSprites.length - numDigits)
            const thousandsDigitSpriteIndex = this.virusDigitSprites.length - numDigits;
            this.commaSprite.x = this.virusDigitSprites[thousandsDigitSpriteIndex].x + 32.5; // 32.5 is half of 65
        } else {
            this.commaSprite.visible = false;
        }
    }

    incrementVirusCount() {
        this.virusCount += 10; // Каждый вирус равен 10 очкам
        this.updateVirusCounter();
        this.updateVirulenceBar();
        this.saveBestScore();
    }

    showCountersWithAnimation() {
        if (this.countersShown) return; // Не показываем повторно
        this.countersShown = true;

        // Анимация появления счетчика вирусов
        const virusCounterDuration = 800;
        const virusCounterStartTime = Date.now();
        const virusCounterStartScale = 0.5;
        const virusCounterEndScale = 1.0;
        const virusCounterStartAlpha = 0;
        const virusCounterEndAlpha = 1;

        const animateVirusCounter = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - virusCounterStartTime;
            const progress = Math.min(elapsed / virusCounterDuration, 1);

            const scale = virusCounterStartScale + (virusCounterEndScale - virusCounterStartScale) * this.easeOutBack(progress);
            const alpha = virusCounterStartAlpha + (virusCounterEndAlpha - virusCounterStartAlpha) * this.easeOutQuad(progress);

            this.virusCounterContainer.scale.set(scale);
            this.virusCounterContainer.alpha = alpha;

            if (progress < 1) {
                requestAnimationFrame(animateVirusCounter);
            }
        };

        // Анимация появления шкалы вирулентности (с задержкой)
        setTimeout(() => {
            const virulenceBarDuration = 800;
            const virulenceBarStartTime = Date.now();
            const virulenceBarStartScale = 0.5;
            const virulenceBarEndScale = 1.0;
            const virulenceBarStartAlpha = 0;
            const virulenceBarEndAlpha = 1;

            const animateVirulenceBar = () => {
                const currentTime = Date.now();
                const elapsed = currentTime - virulenceBarStartTime;
                const progress = Math.min(elapsed / virulenceBarDuration, 1);

                const scale = virulenceBarStartScale + (virulenceBarEndScale - virulenceBarStartScale) * this.easeOutBack(progress);
                const alpha = virulenceBarStartAlpha + (virulenceBarEndAlpha - virulenceBarStartAlpha) * this.easeOutQuad(progress);

                this.virulenceBarContainer.scale.set(scale);
                this.virulenceBarContainer.alpha = alpha;

                if (progress < 1) {
                    requestAnimationFrame(animateVirulenceBar);
                }
            };

            requestAnimationFrame(animateVirulenceBar);
        }, 200); // Задержка 200мс для последовательного появления

        // Анимация появления лучшего результата (с задержкой)
        setTimeout(() => {
            const bestScoreDuration = 800;
            const bestScoreStartTime = Date.now();
            const bestScoreStartScale = 0.5;
            const bestScoreEndScale = 1.0;
            const bestScoreStartAlpha = 0;
            const bestScoreEndAlpha = 1;

            const animateBestScore = () => {
                const currentTime = Date.now();
                const elapsed = currentTime - bestScoreStartTime;
                const progress = Math.min(elapsed / bestScoreDuration, 1);

                const scale = bestScoreStartScale + (bestScoreEndScale - bestScoreStartScale) * this.easeOutBack(progress);
                const alpha = bestScoreStartAlpha + (bestScoreEndAlpha - bestScoreStartAlpha) * this.easeOutQuad(progress);

                this.bestScoreContainer.scale.set(scale);
                this.bestScoreContainer.alpha = alpha;

                if (progress < 1) {
                    requestAnimationFrame(animateBestScore);
                }
            };

            requestAnimationFrame(animateBestScore);
        }, 400); // Задержка 400мс для последовательного появления

        requestAnimationFrame(animateVirusCounter);
    }

    showPauseButtonWithAnimation() {
        if (!this.pauseButton || this.pauseButton.alpha > 0) return; // Не показываем повторно

        this.pauseButton.visible = true;
        this.pauseButton.eventMode = 'static'; // Включаем взаимодействие с кнопкой

        // Анимация появления кнопки паузы
        const pauseButtonDuration = 800;
        const pauseButtonStartTime = Date.now();
        const pauseButtonStartScale = 0.5;
        const pauseButtonEndScale = 0.3; // Финальный размер кнопки
        const pauseButtonStartAlpha = 0;
        const pauseButtonEndAlpha = 1;

        const animatePauseButton = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - pauseButtonStartTime;
            const progress = Math.min(elapsed / pauseButtonDuration, 1);

            const scale = pauseButtonStartScale + (pauseButtonEndScale - pauseButtonStartScale) * this.easeOutBack(progress);
            const alpha = pauseButtonStartAlpha + (pauseButtonEndAlpha - pauseButtonStartAlpha) * this.easeOutQuad(progress);

            this.pauseButton.scale.set(scale);
            this.pauseButton.alpha = alpha;

            if (progress < 1) {
                requestAnimationFrame(animatePauseButton);
            }
        };

        requestAnimationFrame(animatePauseButton);
    }

    loadBestScore() {
        // Загружаем лучший результат из sessionStorage
        const savedBestScore = sessionStorage.getItem('fluffyBestScore');
        this.bestScore = savedBestScore ? parseInt(savedBestScore) : 0;
    }

    saveBestScore() {
        // Сохраняем лучший результат в sessionStorage
        if (this.virusCount > this.bestScore) {
            this.bestScore = this.virusCount;
            sessionStorage.setItem('fluffyBestScore', this.bestScore.toString());
            this.updateBestScore(); // Обновляем отображение
        }
    }

    updateBestScore() {
        if (!this.bestDigitSprites) return;

        const count = this.bestScore.toString();
        const numDigits = count.length;

        // Считаем, сколько цифр будет отображаться
        let visibleIndex = 0;
        for (let i = 0; i < this.bestDigitSprites.length; i++) {
            const digitSprite = this.bestDigitSprites[i];
            const digitIndexInCount = i - (this.bestDigitSprites.length - numDigits);
            if (digitIndexInCount >= 0 && digitIndexInCount < numDigits) {
                const digitChar = count[digitIndexInCount];
                digitSprite.texture = this.resources.textures[`${digitChar}.png`];
                digitSprite.visible = true;
                digitSprite.x = visibleIndex * 25; // Промежуток слева направо
                visibleIndex++;
            } else {
                digitSprite.visible = false;
            }
        }

        // Запятая после тысяч
        if (this.bestScore > 999) {
            this.bestCommaSprite.visible = true;
            // Запятая после первой цифры (тысячи)
            let commaPos = 25; // после первой цифры
            this.bestCommaSprite.x = commaPos + 2; // чуть правее центра
        } else {
            this.bestCommaSprite.visible = false;
        }
    }

    reset() {
        this.virusCount = 0;
        this.countersShown = false;
        
        if (this.virusCounterContainer) {
            this.virusCounterContainer.destroy({children: true});
            this.virusCounterContainer = null;
        }
        if (this.virulenceBarContainer) {
            this.virulenceBarContainer.destroy({children: true});
            this.virulenceBarContainer = null;
        }
        if (this.bestScoreContainer) {
            this.bestScoreContainer.destroy({children: true});
            this.bestScoreContainer = null;
        }
        if (this.virulenceSign) {
            this.virulenceSign.destroy();
            this.virulenceSign = null;
        }
        if (this.virulenceBarBackground) {
            this.virulenceBarBackground.destroy();
            this.virulenceBarBackground = null;
        }
        if (this.virulenceBarFill) {
            this.virulenceBarFill.destroy();
            this.virulenceBarFill = null;
        }
        if (this.pauseButton) {
            this.pauseButton.destroy();
            this.pauseButton = null;
        }
        if (this.pausePanel) {
            this.pausePanel.destroy({children: true});
            this.pausePanel = null;
        }
    }

    // Animation easing functions
    easeOutElastic(x) {
        const c4 = (2 * Math.PI) / 3;
        return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }

    easeOutQuad(x) {
        return 1 - (1 - x) * (1 - x);
    }

    easeOutBack(x) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }
}
