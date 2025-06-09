import * as PIXI from 'pixi.js';

export async function loadAssets() {
    try {
        // Загружаем все необходимые ресурсы
        const worldAssets = await PIXI.Assets.load('src/img/WorldAssets-hd.json');
        const rabbitAssets = await PIXI.Assets.load('src/img/rabbit.json');
        
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
            'firefly_5.png'
        ];

        // Объединяем ресурсы
        const resources = {
            textures: {
                ...worldAssets.textures,
                ...rabbitAssets.textures
            }
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
