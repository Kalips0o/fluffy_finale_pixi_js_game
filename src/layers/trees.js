import * as PIXI from 'pixi.js';

export class Trees {
    constructor(app, resources) {
        this.app = app;
        this.resources = resources;
    }

    draw() {
        this.drawCrowns();
    }

    drawTrunks(grassY) {
        const trunk1 = this.resources.textures['tree_trunk_1.png'];
        const trunk2 = this.resources.textures['tree_trunk_2.png'];

        if (!trunk1 || !trunk2) return;

        const positions = [
            { x: this.app.screen.width * 0.3, y: grassY + 150 },
            { x: this.app.screen.width * 0.7, y: grassY + 140 }
        ];

        positions.forEach((pos, index) => {
            const texture = index % 2 === 0 ? trunk1 : trunk2;
            const trunk = new PIXI.Sprite(texture);
            trunk.x = Math.round(pos.x);
            trunk.y = Math.round(pos.y);
            trunk.anchor.set(0.5, 1);
            trunk.scale.set(1);
            this.app.stage.addChild(trunk);
        });
    }

    drawCrowns() {
        const texture = this.resources.textures['tree crowns.png'];
        if (!texture) return;

        const tileWidth = Math.ceil(texture.width);
        const overlap = 10;
        let x = 0;
        const y = 0;

        while (x < this.app.screen.width + tileWidth) {
            const crowns = new PIXI.Sprite(texture);
            crowns.x = Math.round(x);
            crowns.y = y;
            crowns.anchor.set(0, 0);
            this.app.stage.addChild(crowns);
            x += tileWidth - overlap;
        }
    }
}
