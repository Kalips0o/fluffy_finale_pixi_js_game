export class RabbitControls {
    constructor(rabbit) {
        this.rabbit = rabbit;
    }

    setup() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    handleKeyDown(e) {
        if (e.key === 'ArrowLeft' && !this.rabbit.physics.isJumping && !this.rabbit.physics.isHitting) {
            this.rabbit.isMoving = true;
            this.rabbit.direction = -1;
            this.rabbit.animations.play('run');
        }
        if (e.key === 'ArrowRight' && !this.rabbit.physics.isJumping && !this.rabbit.physics.isHitting) {
            this.rabbit.isMoving = true;
            this.rabbit.direction = 1;
            this.rabbit.animations.play('run');
        }
        if (e.key === ' ' && !this.rabbit.physics.isJumping && !this.rabbit.physics.isHitting) {
            this.rabbit.physics.startJump();
        }
        if ((e.key === 'у' || e.key === 'e') && !this.rabbit.physics.isHitting && !this.rabbit.physics.isJumping) {
            this.rabbit.physics.startHit();
        }
    }

    handleKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            this.rabbit.isMoving = false;
            if (!this.rabbit.physics.isJumping && !this.rabbit.physics.isHitting) {
                this.rabbit.animations.stop();
                this.rabbit.sprite.texture = this.rabbit.animations.getFrame('idle', 0);
            }
        }
    }
}
