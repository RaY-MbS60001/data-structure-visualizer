// Base Visualizer Class
class VisualizerBase {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas with id '${canvasId}' not found`);
        }

        this.ctx = this.canvas.getContext('2d');
        this.isAnimating = false;
        this.animationSpeed = 1.0;

        // 🎨 Color palette
        this.colors = {
            primary: '#00ff88',
            secondary: '#00d9ff',
            danger: '#ff4757',
            warning: '#ffa502',
            dark: '#1a1a2e',
            darker: '#0f0f1e',
            light: '#eee',
            gray: '#6c757d'
        };

        // ✅ Create a bound resize handler so we can remove it later
        this.resizeCanvasBound = this.resizeCanvas.bind(this);

        this.setupCanvas();
        this.setupEventListeners();

        // Add the listener using bound version
        window.addEventListener('resize', this.resizeCanvasBound);
    }

    setupCanvas() {
        this.resizeCanvas();

        // Set default text styles
        this.ctx.font = '16px "Segoe UI", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // Account for high-DPI screens
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        // Apply CSS resize
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        // Scale the context to ensure correct rendering
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // reset before scaling
        this.ctx.scale(dpr, dpr);

        // Store true canvas size
        this.width = rect.width;
        this.height = rect.height;

        // 🟢 When subclass defines redraw(), call it safely
        if (this.redraw && typeof this.redraw === 'function') {
            this.redraw();
        }
    }

    setupEventListeners() {
        // Empty; subclasses override
    }

    // 🔧 Legacy fallback for compatibility
    setupResponsive() {
        if (!this.resizeCanvasBound) {
            this.resizeCanvasBound = this.resizeCanvas.bind(this);
        }
        window.addEventListener('resize', this.resizeCanvasBound);
    }

    // 🧽 Clear the canvas
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    // 🌌 Background with gradient and grid
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, this.colors.darker);
        gradient.addColorStop(1, this.colors.dark);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.drawGrid();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.05)';
        this.ctx.lineWidth = 1;

        const gridSize = 50;

        // Vertical lines
        for (let x = 0; x <= this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    // 🟠 Draw circle node (used by tree/graph visualizers)
    drawNode(x, y, radius, label, style = {}) {
        const {
            fillColor = this.colors.dark,
            strokeColor = this.colors.primary,
            textColor = this.colors.light,
            lineWidth = 2,
            glow = false,
            scale = 1
        } = style;

        this.ctx.save();

        this.ctx.translate(x, y);
        this.ctx.scale(scale, scale);

        if (glow) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = strokeColor;
        }

        this.ctx.fillStyle = fillColor;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = lineWidth;

        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = textColor;
        this.ctx.font = `${14 * scale}px "Segoe UI", sans-serif`;
        this.ctx.fillText(label, 0, 0);

        this.ctx.restore();
    }

    // 🧵 Draw a connecting edge (graph)
    drawEdge(x1, y1, x2, y2, style = {}) {
        const {
            color = this.colors.primary,
            lineWidth = 2,
            arrow = true,
            dashed = false,
            label = '',
            curved = false
        } = style;

        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;

        if (dashed) this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();

        if (curved) {
            const cx = (x1 + x2) / 2;
            const cy = (y1 + y2) / 2 - 50;
            this.ctx.moveTo(x1, y1);
            this.ctx.quadraticCurveTo(cx, cy, x2, y2);
        } else {
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
        }

        this.ctx.stroke();

        if (arrow) {
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const arrowLength = 15;
            const arrowAngle = Math.PI / 6;

            this.ctx.beginPath();
            this.ctx.moveTo(x2, y2);
            this.ctx.lineTo(
                x2 - arrowLength * Math.cos(angle - arrowAngle),
                y2 - arrowLength * Math.sin(angle - arrowAngle)
            );
            this.ctx.moveTo(x2, y2);
            this.ctx.lineTo(
                x2 - arrowLength * Math.cos(angle + arrowAngle),
                y2 - arrowLength * Math.sin(angle + arrowAngle)
            );
            this.ctx.stroke();
        }

        if (label) {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            this.ctx.fillStyle = this.colors.light;
            this.ctx.font = '12px "Segoe UI", sans-serif';
            this.ctx.fillText(label, midX, midY - 10);
        }

        this.ctx.restore();
    }

    highlight(x, y, width, height, color = null) {
        this.ctx.save();
        this.ctx.fillStyle = color || this.colors.primary;
        this.ctx.globalAlpha = 0.2;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeStyle = color || this.colors.primary;
        this.ctx.globalAlpha = 1;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.restore();
    }

    drawText(text, x, y, style = {}) {
        const {
            color = this.colors.light,
            font = '16px "Segoe UI", sans-serif',
            align = 'center',
            baseline = 'middle'
        } = style;

        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.font = font;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    showEmptyState(show = true) {
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.classList.toggle('hidden', !show);
        }
    }

    redraw() {
        // Default behavior — clear + background
        this.clear();
        this.drawBackground();
    }

    animate(duration, updateFn, completeFn) {
        const startTime = performance.now();
        this.isAnimating = true;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(
                elapsed / (duration / this.animationSpeed),
                1
            );

            updateFn(progress);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                this.isAnimating = false;
                if (completeFn) completeFn();
            }
        };

        requestAnimationFrame(step);
    }
}