import * as PIXI from 'pixi.js';

export class VaccineExplosion {
    constructor(app, worldContainer) {
        this.app = app;
        this.worldContainer = worldContainer;
        this.particles = [];
        this.dustClouds = [];
        console.log('VaccineExplosion constructor called');
    }

    createExplosion(x, y, originalVaccineSprite) {
        console.log('Creating explosion at:', x, y);
        
        // Создаем верхнюю и нижнюю части вакцины
        const topPart = new PIXI.Sprite(PIXI.Texture.from('vaccine-top-part.png'));
        const lowerPart = new PIXI.Sprite(PIXI.Texture.from('vaccine-lower-part.png'));
        
        console.log('Created sprites:', { topPart, lowerPart });
        
        // Настраиваем части
        [topPart, lowerPart].forEach(part => {
            part.anchor.set(0.5);
            part.scale.set(0.17);
            part.x = x;
            part.y = y;
            this.worldContainer.addChild(part);
        });

        // Создаем клубы пыли (сначала пыль, чтобы она была под фрагментами)
        const numDustClouds = 15; // Уменьшаем количество пыли
        for (let i = 0; i < numDustClouds; i++) {
            const dust = new PIXI.Sprite(PIXI.Texture.from('dust_clouds.png'));
            dust.anchor.set(0.5);
            dust.scale.set(0.3 + Math.random() * 0.4);
            dust.x = x;
            dust.y = y;
            dust.rotation = Math.random() * Math.PI * 2;
            dust.alpha = 0.8;
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            dust.vx = Math.cos(angle) * speed;
            dust.vy = Math.sin(angle) * speed;
            
            this.worldContainer.addChild(dust);
            this.dustClouds.push(dust);
        }

        // Создаем частицы содержимого (фрагменты вакцины)
        const numParticles = 180; // Увеличиваем количество фрагментов
        for (let i = 0; i < numParticles; i++) {
            const particle = new PIXI.Sprite(
                PIXI.Texture.from(Math.random() < 0.5 ? 'fragment__vaccine_1.png' : 'fragment__vaccine_2.png')
            );
            particle.anchor.set(0.5);
            particle.scale.set(0.12 + Math.random() * 0.15);
            particle.x = x;
            particle.y = y;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.alpha = 1;
            
            // Случайное направление и скорость
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3; // Уменьшаем начальную скорость
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed - 1.5; // Уменьшаем начальный импульс вверх
            
            this.worldContainer.addChild(particle);
            this.particles.push(particle);
        }

        // Анимация взрыва
        const duration = 2500; // Увеличиваем длительность анимации
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Быстро скрываем оригинальную текстуру вакцины
            if (originalVaccineSprite) {
                originalVaccineSprite.alpha = 1 - progress * 3;
                if (progress > 0.33) {
                    this.worldContainer.removeChild(originalVaccineSprite);
                }
            }
            
            // Движение частей вакцины
            topPart.y = y - progress * 200;
            lowerPart.y = y + progress * 200;
            topPart.rotation = progress * Math.PI * 2;
            lowerPart.rotation = -progress * Math.PI * 2;
            topPart.alpha = 1 - progress * 0.7;
            lowerPart.alpha = 1 - progress * 0.7;
            
            // Движение клубов пыли
            this.dustClouds.forEach(dust => {
                dust.x += dust.vx;
                dust.y += dust.vy;
                dust.vy += 0.08;
                dust.rotation += 0.08;
                dust.alpha = 0.8 - progress * 0.8;
                dust.scale.x += 0.02;
                dust.scale.y += 0.02;
            });
            
            // Движение фрагментов вакцины
            this.particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.15; // Уменьшаем гравитацию для более медленного падения
                particle.rotation += 0.1; // Уменьшаем скорость вращения
                
                // Замедляем горизонтальное движение
                particle.vx *= 0.99; // Более плавное замедление
                
                // Замедляем вертикальное движение при падении
                if (particle.vy > 0) {
                    particle.vy *= 0.99; // Более плавное замедление
                }
                
                // Начинаем растворение только когда фрагменты начинают падать
                if (particle.vy > 0) {
                    particle.alpha = 1 - (progress - 0.5) * 0.6; // Начинаем растворение позже и делаем его еще более плавным
                }
            });
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Удаляем все элементы
                this.worldContainer.removeChild(topPart);
                this.worldContainer.removeChild(lowerPart);
                this.particles.forEach(particle => {
                    this.worldContainer.removeChild(particle);
                });
                this.dustClouds.forEach(dust => {
                    this.worldContainer.removeChild(dust);
                });
                this.particles = [];
                this.dustClouds = [];
            }
        };
        
        animate();
    }
} 