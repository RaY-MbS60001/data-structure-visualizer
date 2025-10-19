class StackVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.animationQueue = [];
        this.isAnimating = false;
        
        // Visual settings
        this.nodeWidth = 200;
        this.nodeHeight = 80;
        this.nodeSpacing = 20;
        this.startX = 300;
        this.startY = 100;
        
        this.initWebSocket();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const wrapper = this.canvas.parentElement;
        this.canvas.width = wrapper.clientWidth;
        this.canvas.height = wrapper.clientHeight;
        this.draw();
    }
    
    initWebSocket() {
        const socket = new SockJS('http://localhost:8080/ws-visualization');
        this.stompClient = Stomp.over(socket);
        
        this.stompClient.connect({}, () => {
            console.log('✅ Stack WebSocket Connected');
            this.updateConnectionStatus(true);
            
            this.stompClient.subscribe('/topic/stack-visualization', (message) => {
                const step = JSON.parse(message.body);
                this.animationQueue.push(step);
                
                if (!this.isAnimating) {
                    this.processAnimationQueue();
                }
            });
        }, (error) => {
            console.error('❌ WebSocket Error:', error);
            this.updateConnectionStatus(false);
            setTimeout(() => this.initWebSocket(), 5000);
        });
    }
    
    updateConnectionStatus(connected) {
        const indicator = document.getElementById('connection-indicator');
        const text = document.getElementById('connection-text');
        
        if (connected) {
            indicator.className = 'status-dot connected';
            text.textContent = 'Connected';
        } else {
            indicator.className = 'status-dot disconnected';
            text.textContent = 'Disconnected';
        }
    }
    
    async processAnimationQueue() {
        this.isAnimating = true;
        
        while (this.animationQueue.length > 0) {
            const step = this.animationQueue.shift();
            await this.animateStep(step);
        }
        
        this.isAnimating = false;
    }
    
    async animateStep(step) {
        this.updateOperationPanel(step);
        this.highlightCode(step.operation);
        
        const emptyState = document.getElementById('empty-state');
        if (emptyState && step.nodes && step.nodes.length > 0) {
            emptyState.classList.add('hidden');
        } else if (emptyState && step.nodes && step.nodes.length === 0) {
            emptyState.classList.remove('hidden');
        }
        
        this.nodes = step.nodes || [];
        
        if (step.stepNumber && step.totalSteps) {
            document.getElementById('operation-progress').textContent = 
                `Step ${step.stepNumber}/${step.totalSteps}`;
        }
        
        switch(step.operation) {
            case 'PREPARE_PUSH':
            case 'CREATE_NODE':
                await this.animatePush(step);
                break;
            case 'SHOW_TOP':
                await this.animatePeek(step);
                break;
            case 'REMOVING':
                await this.animatePop(step);
                break;
            case 'OVERFLOW':
            case 'UNDERFLOW':
                await this.animateError(step);
                break;
            default:
                this.draw();
                await this.sleep(500);
        }
        
        this.updateStats();
    }
    
    async animatePush(step) {
        if (this.nodes.length === 0) return;
        
        const newNode = this.nodes[this.nodes.length - 1];
        const targetY = this.calculateNodeY(this.nodes.length - 1);
        
        // Slide in from top
        for (let y = -100; y <= targetY; y += 10) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawAllNodes(this.nodes.length - 1);
            this.drawNode(newNode, this.startX, y, 1, 1, 10, true);
            await this.sleep(20);
        }
        
        this.draw();
    }
    
    async animatePeek(step) {
        const topIndex = this.nodes.length - 1;
        if (topIndex < 0) return;
        
        // Pulse animation
        for (let i = 0; i < 3; i++) {
            for (let scale = 1; scale <= 1.15; scale += 0.03) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawAllNodes(topIndex, scale, 15);
                await this.sleep(20);
            }
            for (let scale = 1.15; scale >= 1; scale -= 0.03) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawAllNodes(topIndex, scale, 15);
                await this.sleep(20);
            }
        }
    }
    
    async animatePop(step) {
        const topIndex = this.nodes.length;
        const startY = this.calculateNodeY(topIndex);
        
        // Slide out upward
        for (let y = startY; y >= -100; y -= 10) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawAllNodes();
            
            // Draw disappearing node
            if (step.metadata && step.metadata.removed) {
                const ghostNode = {
                    filename: step.metadata.removed,
                    size: '',
                    position: topIndex
                };
                this.drawNode(ghostNode, this.startX, y, 0.5, 1, 0, false);
            }
            
            await this.sleep(20);
        }
        
        this.draw();
    }
    
    async animateError(step) {
        // Screen shake effect
        for (let i = 0; i < 5; i++) {
            this.ctx.save();
            this.ctx.translate(Math.random() * 10 - 5, Math.random() * 10 - 5);
            this.draw();
            this.ctx.restore();
            await this.sleep(100);
        }
        this.draw();
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.nodes.length === 0) return;
        
        // Draw "TOP" indicator
        this.drawTopIndicator();
        
        // Draw "BOTTOM" indicator
        this.drawBottomIndicator();
        
        this.drawAllNodes();
    }
    
    drawAllNodes(highlightIndex = -1, highlightScale = 1, glow = 0) {
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const y = this.calculateNodeY(i);
            const scale = (i === highlightIndex) ? highlightScale : 1;
            const nodeGlow = (i === highlightIndex) ? glow : 0;
            
            this.drawNode(node, this.startX, y, 1, scale, nodeGlow, i === this.nodes.length - 1);
        }
    }
    
    drawNode(node, x, y, alpha = 1, scale = 1, glow = 0, isTop = false) {
        const ctx = this.ctx;
        const width = this.nodeWidth * scale;
        const height = this.nodeHeight * scale;
        const adjustedX = x - (width - this.nodeWidth) / 2;
        const adjustedY = y - (height - this.nodeHeight) / 2;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (glow > 0) {
            ctx.shadowBlur = glow;
            ctx.shadowColor = '#00ff88';
        }
        
        // Node rectangle
        ctx.fillStyle = isTop ? 'rgba(0, 255, 136, 0.3)' : 'rgba(44, 62, 80, 0.9)';
        ctx.strokeStyle = isTop ? '#00ff88' : '#34495e';
        ctx.lineWidth = isTop ? 3 : 2;
        
        this.roundRect(ctx, adjustedX, adjustedY, width, height, 10);
        ctx.fill();
        ctx.stroke();
        
        // File icon
        ctx.fillStyle = '#00ff88';
        ctx.font = `${20 * scale}px Arial`;
        ctx.fillText('📄', adjustedX + 15, adjustedY + 35);
        
        // Filename
        ctx.fillStyle = '#ecf0f1';
        ctx.font = `bold ${13 * scale}px Arial`;
        ctx.fillText(
            this.truncateText(node.filename, 20),
            adjustedX + 50,
            adjustedY + 30
        );
        
        // Size
        ctx.fillStyle = '#95a5a6';
        ctx.font = `${10 * scale}px Arial`;
        ctx.fillText(node.size, adjustedX + 50, adjustedY + 50);
        
        // Position badge
        if (isTop) {
            ctx.fillStyle = '#00ff88';
            ctx.font = `bold ${11 * scale}px Arial`;
            ctx.fillText('TOP', adjustedX + width - 40, adjustedY + 25);
        }
        
        ctx.restore();
    }
    
    drawTopIndicator() {
        const ctx = this.ctx;
        const topY = this.calculateNodeY(this.nodes.length - 1);
        
        ctx.save();
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('TOP →', this.startX - 80, topY + this.nodeHeight / 2);
        
        // Arrow
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.startX - 20, topY + this.nodeHeight / 2);
        ctx.lineTo(this.startX, topY + this.nodeHeight / 2);
        ctx.stroke();
        
        this.drawArrowHead(this.startX, topY + this.nodeHeight / 2, '#00ff88');
        ctx.restore();
    }
    
    drawBottomIndicator() {
        const ctx = this.ctx;
        const bottomY = this.calculateNodeY(0);
        
        ctx.save();
        ctx.fillStyle = '#95a5a6';
        ctx.font = '14px Arial';
        ctx.fillText('BOTTOM', this.startX - 80, bottomY + this.nodeHeight / 2);
        ctx.restore();
    }
    
    drawArrowHead(x, y, color) {
        const ctx = this.ctx;
        const headLength = 8;
        
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - headLength, y - headLength / 2);
        ctx.lineTo(x - headLength, y + headLength / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    calculateNodeY(index) {
        // Stack grows upward (reverse index)
        const reversedIndex = this.nodes.length - 1 - index;
        return this.startY + reversedIndex * (this.nodeHeight + this.nodeSpacing);
    }
    
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
    
    updateOperationPanel(step) {
        const panel = document.getElementById('operation-description');
        let badgeClass = step.operation.toLowerCase().replace('_', '-');
        
        panel.innerHTML = `
            <div class="operation-badge ${badgeClass}">
                ${step.operation.replace(/_/g, ' ')}
            </div>
            <p>${step.description}</p>
        `;
    }
    
    highlightCode(operation) {
        const codeMap = {
            'PREPARE_PUSH': 'if (!isFull()) {',
            'CREATE_NODE': 'stack[++top] = element;',
            'SHOW_TOP': 'return stack[top];',
            'REMOVING': 'T element = stack[top--];',
            'OVERFLOW': 'throw new StackOverflowError();',
            'UNDERFLOW': 'throw new StackUnderflowError();'
        };
        
        const codeLine = codeMap[operation] || 'Processing...';
        document.getElementById('current-line').textContent = codeLine;
    }
    
    updateStats() {
        document.getElementById('stack-size').textContent = this.nodes.length;
        
        const status = this.nodes.length === 0 ? 'Empty' : 
                      this.nodes.length >= 10 ? 'Full' : 'Active';
        document.getElementById('stack-status').textContent = status;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}