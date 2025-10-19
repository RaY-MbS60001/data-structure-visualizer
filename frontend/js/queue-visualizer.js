class QueueVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.animationQueue = [];
        this.isAnimating = false;
        
        // Visual settings
        this.nodeWidth = 150;
        this.nodeHeight = 100;
        this.nodeSpacing = 30;
        this.startX = 100;
        this.startY = 250;
        
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
            console.log('✅ Queue WebSocket Connected');
            this.updateConnectionStatus(true);
            
            this.stompClient.subscribe('/topic/queue-visualization', (message) => {
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
            case 'PREPARE_ENQUEUE':
            case 'CREATE_NODE':
                await this.animateEnqueue(step);
                break;
            case 'SHOW_FRONT':
                await this.animatePeek(step);
                break;
            case 'REMOVING':
                await this.animateDequeue(step);
                break;
            case 'QUEUE_FULL':
            case 'QUEUE_EMPTY':
                await this.animateError(step);
                break;
            default:
                this.draw();
                await this.sleep(500);
        }
        
        this.updateStats();
    }
    
    async animateEnqueue(step) {
        if (this.nodes.length === 0) return;
        
        const newNode = this.nodes[this.nodes.length - 1];
        const targetX = this.calculateNodeX(this.nodes.length - 1);
        
        // Slide in from right
        for (let x = this.canvas.width; x >= targetX; x -= 15) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawAllNodes(this.nodes.length - 1);
            this.drawNode(newNode, x, this.startY, 1, 1, 10, false, true);
            await this.sleep(20);
        }
        
        this.draw();
    }
    
    async animatePeek(step) {
        const frontIndex = 0;
        if (this.nodes.length === 0) return;
        
        // Pulse animation
        for (let i = 0; i < 3; i++) {
            for (let scale = 1; scale <= 1.15; scale += 0.03) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawAllNodes(frontIndex, scale, 15);
                await this.sleep(20);
            }
            for (let scale = 1.15; scale >= 1; scale -= 0.03) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawAllNodes(frontIndex, scale, 15);
                await this.sleep(20);
            }
        }
    }
    
    async animateDequeue(step) {
        if (this.nodes.length === 0) return;
        
        const startX = this.calculateNodeX(0);
        
        // Slide out to left
        for (let x = startX; x >= -this.nodeWidth; x -= 15) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw remaining nodes
            for (let i = 1; i < this.nodes.length; i++) {
                const node = this.nodes[i];
                const nodeX = this.calculateNodeX(i);
                this.drawNode(node, nodeX, this.startY, 1, 1, 0, false, false);
            }
            
            // Draw disappearing node
            if (step.metadata && step.metadata.removed) {
                const ghostNode = {
                    filename: step.metadata.removed,
                    size: '',
                    position: 0
                };
                this.drawNode(ghostNode, x, this.startY, 0.5, 1, 0, true, false);
            }
            
            await this.sleep(20);
        }
        
        this.draw();
    }
    
    async animateError(step) {
        // Screen shake
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
        
        // Draw indicators
        this.drawFrontIndicator();
        this.drawRearIndicator();
        
        this.drawAllNodes();
    }
    
    drawAllNodes(highlightIndex = -1, highlightScale = 1, glow = 0) {
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const x = this.calculateNodeX(i);
            const scale = (i === highlightIndex) ? highlightScale : 1;
            const nodeGlow = (i === highlightIndex) ? glow : 0;
            
            this.drawNode(
                node, x, this.startY, 1, scale, nodeGlow,
                i === 0, // isFront
                i === this.nodes.length - 1 // isRear
            );
            
            // Draw arrow to next
            if (i < this.nodes.length - 1) {
                this.drawArrow(
                    x + this.nodeWidth,
                    this.startY + this.nodeHeight / 2,
                    this.calculateNodeX(i + 1),
                    this.startY + this.nodeHeight / 2
                );
            }
        }
    }
    
    drawNode(node, x, y, alpha = 1, scale = 1, glow = 0, isFront = false, isRear = false) {
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
        let fillColor = 'rgba(44, 62, 80, 0.9)';
        if (isFront) fillColor = 'rgba(0, 255, 136, 0.2)';
        if (isRear) fillColor = 'rgba(0, 217, 255, 0.2)';
        
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = isFront ? '#00ff88' : (isRear ? '#00d9ff' : '#34495e');
        ctx.lineWidth = (isFront || isRear) ? 3 : 2;
        
        this.roundRect(ctx, adjustedX, adjustedY, width, height, 10);
        ctx.fill();
        ctx.stroke();
        
        // File icon
        ctx.fillStyle = '#00ff88';
        ctx.font = `${20 * scale}px Arial`;
        ctx.fillText('📄', adjustedX + 15, adjustedY + 40);
        
        // Filename
        ctx.fillStyle = '#ecf0f1';
        ctx.font = `bold ${12 * scale}px Arial`;
        ctx.fillText(
            this.truncateText(node.filename, 15),
            adjustedX + 45,
            adjustedY + 35
        );
        
        // Size
        ctx.fillStyle = '#95a5a6';
        ctx.font = `${10 * scale}px Arial`;
        ctx.fillText(node.size, adjustedX + 45, adjustedY + 55);
        
        // Label
        if (isFront) {
            ctx.fillStyle = '#00ff88';
            ctx.font = `bold ${10 * scale}px Arial`;
            ctx.fillText('FRONT', adjustedX + 10, adjustedY + height - 10);
        }
        if (isRear) {
            ctx.fillStyle = '#00d9ff';
            ctx.font = `bold ${10 * scale}px Arial`;
            ctx.fillText('REAR', adjustedX + width - 45, adjustedY + height - 10);
        }
        
        ctx.restore();
    }
    
    drawFrontIndicator() {
        if (this.nodes.length === 0) return;
        
        const ctx = this.ctx;
        const frontX = this.calculateNodeX(0);
        
        ctx.save();
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('FRONT →', frontX - 90, this.startY - 30);
        ctx.restore();
    }
    
    drawRearIndicator() {
        if (this.nodes.length === 0) return;
        
        const ctx = this.ctx;
        const rearX = this.calculateNodeX(this.nodes.length - 1);
        
        ctx.save();
        ctx.fillStyle = '#00d9ff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('← REAR', rearX + this.nodeWidth + 10, this.startY - 30);
        ctx.restore();
    }
    
    drawArrow(x1, y1, x2, y2) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.strokeStyle = '#00d9ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        ctx.setLineDash([]);
        this.drawArrowHead(x2, y2, '#00d9ff');
        ctx.restore();
    }
    
    drawArrowHead(x, y, color) {
        const ctx = this.ctx;
        const headLength = 10;
        
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
    
    calculateNodeX(index) {
        return this.startX + index * (this.nodeWidth + this.nodeSpacing);
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
            'PREPARE_ENQUEUE': 'if (!isFull()) {',
            'CREATE_NODE': 'queue[rear] = element;',
            'SHOW_FRONT': 'return queue[front];',
            'REMOVING': 'T element = queue[front++];',
            'QUEUE_FULL': 'throw new QueueFullException();',
            'QUEUE_EMPTY': 'throw new QueueEmptyException();'
        };
        
        const codeLine = codeMap[operation] || 'Processing...';
        document.getElementById('current-line').textContent = codeLine;
    }
    
    updateStats() {
        document.getElementById('queue-size').textContent = this.nodes.length;
        
        const status = this.nodes.length === 0 ? 'Empty' : 
                      this.nodes.length >= 10 ? 'Full' : 'Active';
        document.getElementById('queue-status').textContent = status;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}