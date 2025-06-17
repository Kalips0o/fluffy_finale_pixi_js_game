import * as PIXI from 'pixi.js';

export async function loadAssets() {
    try {
        // Загружаем все необходимые ресурсы
        const worldAssets = await PIXI.Assets.load('/img/WorldAssets-hd.json');
        const rabbitAssets = await PIXI.Assets.load('/img/rabbit.json');
        const obstaclesAssets = await PIXI.Assets.load('/img/obstacles.json');
        const loadingAssets = await PIXI.Assets.load('/img/loading.json');
        
        // Проверяем, что все необходимые текстуры загружены
        const requiredTextures = [
            'bg.png',
            'soil.png',
            'grass.png',
            'grass_lava.png',
            'violet_foliage.png',
            'foliage.png',
            'tree crowns.png',
            'tree_trunk_1.png',
            'tree_trunk_2.png',
            'garland_spider_1.png',
            'garland_spider_long_1.png',
            'garland_spider_long_2.png',
            'garland_spider_3.png',
            'garland_star_1.png',
            'garland_star_long_1.png',
            'garland_star_long_2.png',
            'garland_star_2.png',
            'firefly_1.png',
            'firefly_2.png',
            'firefly_3.png',
            'firefly_4.png',
            'firefly_5.png',
            'doctor_1.png',
            'hammer.png',
            'dust_clouds.png',
            'game-over.png',
            'vaccine-top-part.png',
            'vaccine-lower-part.png',
            'fragment__vaccine_1.png',
            'fragment__vaccine_2.png',
            'start.png'
        ];

        // Создаем текстуры из спрайт-листов
        const textures = {};
        
        // Добавляем текстуры из WorldAssets
        if (worldAssets.textures) {
            Object.entries(worldAssets.textures).forEach(([key, texture]) => {
                textures[key] = texture;
            });
        }

        // Добавляем текстуры из rabbitAssets
        if (rabbitAssets.textures) {
            Object.entries(rabbitAssets.textures).forEach(([key, texture]) => {
                textures[key] = texture;
            });
        }

        // Добавляем текстуры из obstaclesAssets
        if (obstaclesAssets.textures) {
            Object.entries(obstaclesAssets.textures).forEach(([key, texture]) => {
                textures[key] = texture;
            });
        }

        // Добавляем текстуры из loadingAssets
        if (loadingAssets.textures) {
            Object.entries(loadingAssets.textures).forEach(([key, texture]) => {
                textures[key] = texture;
            });
        }

        // Объединяем ресурсы
        const resources = {
            textures: textures
        };

        // Проверяем наличие всех текстур
        const missingTextures = requiredTextures.filter(texture => !resources.textures[texture]);
        if (missingTextures.length > 0) {
            console.error('Missing textures:', missingTextures);
            throw new Error('Some required textures are missing');
        }

        console.log('All resources loaded successfully');
        return resources;
    } catch (error) {
        console.error('Error loading assets:', error);
        throw error;
    }
}
