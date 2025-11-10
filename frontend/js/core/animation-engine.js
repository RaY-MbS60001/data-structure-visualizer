// Animation Engine for smooth transitions
class AnimationEngine {
    constructor() {
        this.animations = [];
        this.isRunning = false;
        this.isPaused = false;
        this.speed = 1.0;
        this.lastTime = 0;
    }
    
    addAnimation(animation) {
        this.animations.push(animation);
        if (!this.isRunning && !this.isPaused) {
            this.start();
        }
    }
    
    addSequence(animations) {
        // Add animations that run one after another
        let delay = 0;
        animations.forEach(anim => {
            this.addAnimation(new DelayedAnimation(anim, delay));
            delay += anim.duration;
        });
    }
    
    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.animate();
    }
    
    pause() {
        this.isPaused = true;
    }
    
    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            this.animate();
        }
    }
    
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.animations = [];
    }
    
    setSpeed(speed) {
        this.speed = Math.max(0.1, Math.min(5.0, speed));
    }
    
    animate(currentTime = 0) {
        if (!this.isRunning || this.isPaused) return;
        
        const deltaTime = this.lastTime ? (currentTime - this.lastTime) * this.speed : 0;
        this.lastTime = currentTime;
        
        // Update all animations
        this.animations = this.animations.filter(animation => {
            const isComplete = animation.update(deltaTime);
            return !isComplete;
        });
        
        // Continue animation loop
        if (this.animations.length > 0) {
            requestAnimationFrame((time) => this.animate(time));
        } else {
            this.isRunning = false;
        }
    }
}

// Base Animation class
class Animation {
    constructor(duration, updateFn, completeFn = null) {
        this.duration = duration;
        this.updateFn = updateFn;
        this.completeFn = completeFn;
        this.elapsed = 0;
    }
    
    update(deltaTime) {
        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / this.duration, 1.0);
        
        this.updateFn(progress);
        
        if (progress >= 1.0) {
            if (this.completeFn) {
                this.completeFn();
            }
            return true; // Animation complete
        }
        
        return false; // Animation ongoing
    }
}

// Delayed Animation wrapper
class DelayedAnimation extends Animation {
    constructor(animation, delay) {
        super(animation.duration + delay, () => {}, animation.completeFn);
        this.animation = animation;
        this.delay = delay;
    }
    
    update(deltaTime) {
        this.elapsed += deltaTime;
        
        if (this.elapsed >= this.delay) {
            const animDeltaTime = Math.min(deltaTime, this.elapsed - this.delay);
            return this.animation.update(animDeltaTime);
        }
        
        return false;
    }
}

// Easing functions
const Easing = {
    linear: t => t,
    easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeOut: t => t * (2 - t),
    easeIn: t => t * t,
    elastic: t => {
        if (t === 0 || t === 1) return t;
        const p = 0.3;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    },
    bounce: t => {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    }
};

// Global animation engine
const animationEngine = new AnimationEngine();