import * as PIXI from 'pixi.js';

export class HammerAnimation {
    constructor(app, resources, worldContainer) {
        this.app = app;
        this.resources = resources;
        this.worldContainer = worldContainer;
        this.hammer = null;
    }

    start(startX, startY, groundY) {
        // Create hammer sprite
        this.hammer = new PIXI.Sprite(this.resources.textures['hammer.png']);
        this.hammer.anchor.set(0.5);
        this.hammer.scale.set(0.2);
        this.hammer.x = startX;
        this.hammer.y = startY;
        this.hammer.rotation = 0;
        this.worldContainer.addChild(this.hammer);

        const duration = 2500;
        const startTime = Date.now();

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Animate hammer
            const hammerProgress = Math.min(progress * 1.5, 1); // Hammer animation is faster
            if (hammerProgress < 0.7) {
                // Hammer flies to the left
                const hammerX = startX - (hammerProgress * 300); // Move left
                const hammerY = startY - (Math.sin(hammerProgress * Math.PI * 2) * 100); // Up and down motion
                const hammerRotation = hammerProgress * Math.PI * 4; // Spinning rotation
                
                this.hammer.x = hammerX;
                this.hammer.y = hammerY;
                this.hammer.rotation = hammerRotation;
            } else {
                // Hammer falls to the ground
                const fallProgress = (hammerProgress - 0.7) / 0.3; // Scale to 0-1
                const fallX = startX - 300 + (fallProgress * 50); // Slight forward movement
                const fallY = startY + (fallProgress * (groundY - startY + 50)); // Fall to ground
                const fallRotation = Math.PI * 4 + (fallProgress * Math.PI * 0.5); // Final rotation
                
                this.hammer.x = fallX;
                this.hammer.y = fallY;
                this.hammer.rotation = fallRotation;
            }
            
            // Continue animation if not finished
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Hide hammer
                this.hammer.visible = false;
            }
        };
        
        // Start animation
        requestAnimationFrame(animate);
    }
} 