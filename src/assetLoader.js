import * as PIXI from 'pixi.js';

export async function loadAssets() {
    const resources = await PIXI.Assets.load('src/img/WorldAssets-hd.json');
    window._fluffyWorldAtlas = resources;
    return resources;
}
