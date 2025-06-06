import * as PIXI from 'pixi.js';

const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x222233,
});
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.appendChild(app.view);

let soilTexture = null;
let grassTexture = null;
let bgTexture = null;
function drawScene() {
    if (!soilTexture || !grassTexture || !bgTexture || !window._fluffyWorldAtlas) return;
    app.stage.removeChildren();
    // ФОН
    const bg = new PIXI.Sprite(bgTexture);
    bg.anchor.set(0, 0);
    bg.x = 0;
    bg.y = 0;
    bg.width = app.screen.width;
    bg.height = app.screen.height;
    app.stage.addChild(bg);

    // ФИОЛЕТОВАЯ ЛИСТВА (violet_foliage.png) — поверх фона
    const resources = window._fluffyWorldAtlas;
    if (resources.textures && resources.textures['violet_foliage.png']) {
        const foliageTexture = resources.textures['violet_foliage.png'];
        const desiredFoliageHeight = 270; // Желаемая высота листвы
        const foliageScale = desiredFoliageHeight / foliageTexture.height;
        const foliageTileWidth = Math.ceil(foliageTexture.width * foliageScale);
        const foliageOverlap = 5; // Перекрытие в 5 пикселей
        let xFoliage = 0;
        const foliageY = 0;

        // Добавляем дополнительные тайлы для обеспечения непрерывности при любом размере экрана
        while (xFoliage < app.screen.width + foliageTileWidth) {
            const foliage = new PIXI.Sprite(foliageTexture);
            foliage.x = Math.round(xFoliage);
            foliage.y = foliageY;
            foliage.anchor.set(0, 0);
            foliage.scale.set(foliageScale);
            app.stage.addChild(foliage);
            xFoliage += foliageTileWidth - foliageOverlap;
        }
    }

    // ГИРЛЯНДЫ — распределяем по разным слоям и высотам
    const garlandTypes = [
        'garland_spider_1.png',
        'garland_spider_long_1.png',
        'garland_spider_long_2.png',
        'garland_spider_3.png',
        'garland_star_1.png',
        'garland_star_long_1.png',
        'garland_star_long_2.png',
        'garland_star_2.png'
    ];

    // Создаем гирлянды с разным распределением
    const numGarlands = 15; // Увеличиваем количество гирлянд
    const baseGarlandScale = 0.12;

    // Создаем контейнеры для разных слоев гирлянд
    const backGarlands = new PIXI.Container(); // За фиолетовой листвой
    const frontGarlands = new PIXI.Container(); // Перед фиолетовой листвой

    // Массив для хранения информации о каждой гирлянде
    const garlandsInfo = [];

    for (let i = 0; i < numGarlands; i++) {
        const garlandType = garlandTypes[Math.floor(Math.random() * garlandTypes.length)];
        if (resources.textures && resources.textures[garlandType]) {
            const garland = new PIXI.Sprite(resources.textures[garlandType]);

            // Более естественное распределение по ширине экрана
            const randomX = Math.random() * app.screen.width;
            garland.x = Math.round(randomX);

            // Распределяем гирлянды по слоям в зависимости от наличия слова "long" в названии
            if (garlandType.includes('long')) {
                // За фиолетовой листвой - располагаем чуть ниже
                garland.y = 40 + Math.random() * 80; // От 40px до 120px от верха
                garland.scale.set(baseGarlandScale * 0.98); // Минимальное уменьшение размера
                backGarlands.addChild(garland);
            } else {
                // Перед фиолетовой листвой
                garland.y = -60 + Math.random() * 80; // От -60px до 20px
                garland.scale.set(baseGarlandScale);
                frontGarlands.addChild(garland);
            }

            garland.anchor.set(0.5, -0.2);

            // Сохраняем информацию о гирлянде для анимации
            garlandsInfo.push({
                sprite: garland,
                startX: garland.x,
                startY: garland.y,
                amplitude: 5 + Math.random() * 4, // Увеличиваем амплитуду качания от 5 до 9 пикселей
                speed: 0.3 + Math.random() * 0.3, // Увеличиваем скорость качания
                offset: Math.random() * Math.PI * 2, // Случайное начальное смещение фазы
                length: 100 + Math.random() * 100, // "Длина" гирлянды
                isLong: garlandType.includes('long'), // Флаг для длинных гирлянд
                verticalAmplitude: 1.5 + Math.random() * 2, // Увеличиваем амплитуду вертикального движения
                verticalSpeed: 0.15 + Math.random() * 0.25 // Увеличиваем скорость вертикального движения
            });
        }
    }



    // Добавляем слои в правильном порядке
    app.stage.addChild(backGarlands); // Добавляем задние гирлянды

    // ФИОЛЕТОВАЯ ЛИСТВА (violet_foliage.png) — между слоями гирлянд
    if (resources.textures && resources.textures['violet_foliage.png']) {
        const foliageTexture = resources.textures['violet_foliage.png'];
        const desiredFoliageHeight = 270; // Желаемая высота листвы
        const foliageScale = desiredFoliageHeight / foliageTexture.height;
        const foliageTileWidth = Math.ceil(foliageTexture.width * foliageScale);
        const foliageOverlap = 5; // Перекрытие в 5 пикселей
        let xFoliage = 0;
        const foliageY = 0;

        // Добавляем дополнительные тайлы для обеспечения непрерывности при любом размере экрана
        while (xFoliage < app.screen.width + foliageTileWidth) {
            const foliage = new PIXI.Sprite(foliageTexture);
            foliage.x = Math.round(xFoliage);
            foliage.y = foliageY;
            foliage.anchor.set(0, 0);
            foliage.scale.set(foliageScale);
            app.stage.addChild(foliage);
            xFoliage += foliageTileWidth - foliageOverlap;
        }
    }

    app.stage.addChild(frontGarlands); // Добавляем передние гирлянды после фиолетовой листвы

    // Теперь рисуем почву поверх травы
    const desiredSoilHeight = 130;
    const soilScale = desiredSoilHeight / soilTexture.height;
    // Поднимаем почву чуть выше нижнего края (например, на 20px)
    const soilYOffset = 0;
    const soilY = Math.round(app.screen.height - desiredSoilHeight - soilYOffset);
    let x = 0;
    const soilTileWidth = Math.round(soilTexture.width * soilScale);
    const soilOverlap = 10; // пикселей перекрытия между тайлами почвы

    // ТРАВА (grass) — сначала рисуем траву, потом почву, чтобы трава была "за" почвой
    // Перепроверяем траву: используем актуальный атлас и делаем перекрытие 5px
    const grassY = soilY + desiredSoilHeight - Math.floor(grassTexture.height * 1.3); // ниже почвы, но за ней
    x = 0;
    const grassTileWidth = Math.ceil(grassTexture.width);
    const grassOverlap = 5;
    while (x < app.screen.width + grassTileWidth) {
        const grass = new PIXI.Sprite(grassTexture);
        grass.x = Math.round(x);
        grass.y = grassY;
        grass.anchor.set(0, 0);
        app.stage.addChild(grass);
        x += grassTileWidth - grassOverlap;
    }

    // СТВОЛЫ ДЕРЕВЬЕВ — между слоями травы
    if (resources.textures && resources.textures['tree_trunk_1.png'] && resources.textures['tree_trunk_2.png']) {
        const trunkTypes = ['tree_trunk_1.png', 'tree_trunk_2.png'];
        const trunkScale = 1; // Увеличиваем масштаб стволов

        // Размещаем два ствола в разных позициях
        const trunkPositions = [
            { x: app.screen.width * 0.3, y: grassY + 150 }, // Первый ствол
            { x: app.screen.width * 0.7, y: grassY + 140 }  // Второй ствол
        ];

        trunkPositions.forEach((pos, index) => {
            const trunkType = trunkTypes[index % trunkTypes.length];
            const trunk = new PIXI.Sprite(resources.textures[trunkType]);
            trunk.x = Math.round(pos.x);
            trunk.y = Math.round(pos.y);
            trunk.anchor.set(0.5, 1); // Привязываем к нижней центральной точке
            trunk.scale.set(trunkScale);
            app.stage.addChild(trunk);
        });
    }

    // ТРАВА С ЛАВОЙ — поверх обычной травы
    if (resources.textures && resources.textures['grass_lava.png']) {
        const lavaGrassTexture = resources.textures['grass_lava.png'];
        const lavaGrassY = soilY + desiredSoilHeight - Math.floor(lavaGrassTexture.height * 1); // чуть выше почвы
        x = 0;
        const lavaGrassTileWidth = Math.ceil(lavaGrassTexture.width);
        const lavaGrassOverlap = 10;
        while (x < app.screen.width + lavaGrassTileWidth) {
            const lavaGrass = new PIXI.Sprite(lavaGrassTexture);
            lavaGrass.x = Math.round(x);
            lavaGrass.y = lavaGrassY;
            lavaGrass.anchor.set(0, 0);
            app.stage.addChild(lavaGrass);
            x += lavaGrassTileWidth - lavaGrassOverlap;
        }
    }

    // Теперь рисуем почву поверх травы
    x = 0;
    while (x < app.screen.width + soilOverlap) {
        const soil = new PIXI.Sprite(soilTexture);
        soil.x = Math.round(x);
        soil.y = soilY;
        soil.anchor.set(0, 0);
        soil.scale.set(soilScale);
        app.stage.addChild(soil);
        x += soilTileWidth - soilOverlap;
    }

    // КРОНЫ ДЕРЕВЬЕВ (tree crowns.png) — теперь на переднем плане
    if (resources.textures && resources.textures['tree crowns.png']) {
        const crownsTexture = resources.textures['tree crowns.png'];
        const crownsTileWidth = Math.ceil(crownsTexture.width);
        const crownsOverlap = 10; // Перекрытие
        let xCrowns = 0;
        const crownsY = 0;

        while (xCrowns < app.screen.width + crownsTileWidth) {
            const crowns = new PIXI.Sprite(crownsTexture);
            crowns.x = Math.round(xCrowns);
            crowns.y = crownsY;
            crowns.anchor.set(0, 0);
            app.stage.addChild(crowns);
            xCrowns += crownsTileWidth - crownsOverlap;
        }
    }

    // ДОПОЛНИТЕЛЬНАЯ ЛИСТВА — поверх крон деревьев
    if (resources.textures && resources.textures['foliage.png']) {
        const topFoliageTexture = resources.textures['foliage.png'];
        const topFoliageTileWidth = Math.ceil(topFoliageTexture.width);
        const topFoliageOverlap = 5;
        let xTopFoliage = 0;
        const topFoliageY = 0;

        while (xTopFoliage < app.screen.width + topFoliageTileWidth) {
            const topFoliage = new PIXI.Sprite(topFoliageTexture);
            topFoliage.x = Math.round(xTopFoliage);
            topFoliage.y = topFoliageY;
            topFoliage.anchor.set(0, 0);
            app.stage.addChild(topFoliage);
            xTopFoliage += topFoliageTileWidth - topFoliageOverlap;
        }
    }
}

PIXI.Assets.load('src/img/WorldAssets-hd.json').then((resources) => {
    soilTexture = resources.textures['soil.png'];
    grassTexture = resources.textures['grass.png'];
    bgTexture = resources.textures['bg.png'];
    window._fluffyWorldAtlas = resources;
    drawScene();
});

window.addEventListener('resize', drawScene);
