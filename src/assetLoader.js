import * as PIXI from 'pixi.js';

export async function loadAssets() {
    const worldAssets = await PIXI.Assets.load('src/img/WorldAssets-hd.json');
    const rabbitAssets = await PIXI.Assets.load('src/img/rabbit.json');
    
    // Объединяем ресурсы
    const resources = {
        textures: {
            ...worldAssets.textures,
            ...rabbitAssets.textures
        }
    };
    
    window._fluffyWorldAtlas = resources;
    return resources;
}
