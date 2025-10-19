class FileLinkedListVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.animationQueue = [];
        this.isAnimating = false;
        
        // Visual settings
        this.nodeWidth = 180;
        this.nodeHeight = 100;
        this.nodeSpacing = 80;
        this.startX = 100;
        this.startY = 250;
        this.zoom = 1;
        
        // WebSocket
        this.stompClient = null;
        this.isConnected = false;
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.connectWebSocket();
        
        // Zoom controls
        document.getElementById('zoom-in')?.addEventListener('click', () => this.adjustZoom(0.1));
        document.getElementById('zoom-out')?.addEventListener('click', () => this.adjustZoom(-0.1));
        document.getElementById('fit-screen')?.addEventListener('click', () => this.fitToScreen());
    }
    
    resizeCanvas() {
        const wrapper = this.canvas.parentElement;
        this.canvas.width = wrapper.clientWidth;
        this.canvas.height = wrapper.clientHeight;
        this.draw();
    }
    
    adjustZoom(delta) {
        this.zoom = Math.max(0.5, Math.min(2, this.zoom + delta));
        this.draw();
    }
    
    fitToScreen() {
        if (this.nodes.length === 0) return;
        
        const totalWidth = (this.nodeWidth + this.nodeSpacing) * this.nodes.length;
        const availableWidth = this.canvas.width - 200;
        this.zoom = availableWidth / totalWidth;
        this.draw();
    }
    
    connectWebSocket() {
        const socket = new SockJS('http://localhost:8080/ws-visualization');
        this.stompClient = Stomp.over(socket);
        
        this.stompClient.connect({}, 
            (frame) => {
                console.log('✅ WebSocket Connected:', frame);
                this.isConnected = true;
                this.updateConnectionStatus(true);
                
                // Subscribe to visualization topic
                this.stompClient.subscribe('/topic/visualization', (message) => {
                    const step = JSON.parse(message.body);
                    this.animationQueue.push(step);
                    
                    if (!this.isAnimating) {
                        this.processAnimationQueue();
                    }
                });
            },
            (error) => {
                console.error('❌ WebSocket Error:', error);
                this.isConnected = false;
                this.updateConnectionStatus(false);
                
                // Retry connection
                setTimeout(() => this.connectWebSocket(), 5000);
            }
        );
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
        // Update operation panel
        this.updateOperationPanel(step);
        
        // Update code highlight
        this.highlightCode(step.operation);
        
        // Hide empty state if exists
        const emptyState = document.getElementById('empty-state');
        if (emptyState && step.nodes && step.nodes.length > 0) {
            emptyState.classList.add('hidden');
        }
        
        // Update nodes data
        this.nodes = step.nodes || [];
        
        // Update progress
        if (step.stepNumber && step.totalSteps) {
            document.getElementById('operation-progress').textContent = 
                `Step ${step.stepNumber}/${step.totalSteps}`;
        }
        
        // Animate based on operation type
        switch(step.operation) {
            case 'CREATE_NODE':
                await this.animateCreateNode(step);
                break;
            case 'TRAVERSE':
            case 'COMPARE':
                await this.animateTraverse(step);
                break;
            case 'LINK_NODE':
            case 'RELINK':
                await this.animateLinkNode(step);
                break;
            case 'FOUND':
            case 'FOUND_TARGET':
                await this.animateFound(step);
                break;
            case 'DELETE_HEAD':
                await this.animateDelete(step);
                break;
            case 'COMPLETE':
                await this.animateComplete(step);
                break;
            default:
                this.draw();
                await this.sleep(500);
        }
    }
    
    async animateCreateNode(step) {
        if (this.nodes.length === 0) return;
        
        const newNode = this.nodes[this.nodes.length - 1];
        const targetX = this.calculateNodeX(this.nodes.length - 1);
        
        // Fade in animation
        for (let alpha = 0; alpha <= 1; alpha += 0.1) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawAllNodes(this.nodes.length - 1);
            this.drawNode(newNode, targetX, this.startY, alpha);
            await this.sleep(30);
        }
        
        this.draw();
    }
    
    async animateTraverse(step) {
        const highlightedId = step.highlightedNodeId;
        if (!highlightedId) {
            this.draw();
            return;
        }
        
        const highlightedIndex = this.nodes.findIndex(n => n.nodeId === highlightedId);
        if (highlightedIndex === -1) {
            this.draw();
            return;
        }
        
        // Pulse animation on current node
        for (let scale = 1; scale <= 1.2; scale += 0.04) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawAllNodes(highlightedIndex, scale);
            await this.sleep(20);
        }
        
        for (let scale = 1.2; scale >= 1; scale -= 0.04) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawAllNodes(highlightedIndex, scale);
            await this.sleep(20);
        }
        
        this.draw();
    }
    
    async animateLinkNode(step) {
        if (this.nodes.length < 2) {
            this.draw();
            return;
        }
        
        const lastIndex = this.nodes.length - 1;
        const secondLastX = this.calculateNodeX(lastIndex - 1);
        const lastX = this.calculateNodeX(lastIndex);
        
        // Draw arrow animation
        for (let progress = 0; progress <= 1; progress += 0.05) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawAllNodes();
            
            // Animated arrow
            const startX = secondLastX + this.nodeWidth * this.zoom;
            const endX = lastX;
            const currentX = startX + (endX - startX) * progress;
            const y = this.startY + (this.nodeHeight * this.zoom) / 2;
            
            this.ctx.save();
            this.ctx.strokeStyle = '#00ff88';
            this.ctx.lineWidth = 3;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#00ff88';
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(currentX, y);
            this.ctx.stroke();
            
            // Arrow head
            if (progress > 0.7) {
                this.drawArrowHead(currentX, y, '#00ff88');
            }
            
            this.ctx.restore();
            await this.sleep(20);
        }
        
        this.draw();
    }
    
    async animateFound(step) {
        const highlightedId = step.highlightedNodeId;
        if (!highlightedId) {
            this.draw();
            return;
        }
        
        const foundIndex = this.nodes.findIndex(n => n.nodeId === highlightedId);
        if (foundIndex === -1) {
            this.draw();
            return;
        }
        
        // Victory animation - glow effect
        for (let i = 0; i < 3; i++) {
            for (let glow = 0; glow <= 30; glow += 3) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawAllNodes(foundIndex, 1, glow);
                await this.sleep(30);
            }
            for (let glow = 30; glow >= 0; glow -= 3) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawAllNodes(foundIndex, 1, glow);
                await this.sleep(30);
            }
        }
        
        this.draw();
    }
    
    async animateDelete(step) {
        const highlightedId = step.highlightedNodeId;
        if (!highlightedId) {
            this.draw();
            return;
        }
        
        const deleteIndex = this.nodes.findIndex(n => n.nodeId === highlightedId);
        if (deleteIndex === -1) {
            this.draw();
            return;
        }
        
        // Fade out and shrink
        for (let progress = 1; progress >= 0; progress -= 0.1) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawAllNodes(deleteIndex, progress, 0, progress);
            await this.sleep(40);
        }
        
        this.draw();
    }
    
    async animateComplete(step) {
        // Final flash animation
        for (let i = 0; i < 2; i++) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 255, 136, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
            await this.sleep(100);
            
            this.draw();
            await this.sleep(100);
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.nodes.length === 0) {
            return;
        }
        
        this.drawAllNodes();
    }
    
    drawAllNodes(highlightIndex = -1, highlightScale = 1, glow = 0, alpha = 1) {
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const x = this.calculateNodeX(i);
            const scale = (i === highlightIndex) ? highlightScale : 1;
            const nodeAlpha = (i === highlightIndex) ? alpha : 1;
            
            this.drawNode(node, x, this.startY, nodeAlpha, scale, glow, i === highlightIndex);
            
            // Draw arrow to next node
            if (i < this.nodes.length - 1 && node.nextNodeId) {
                this.drawArrow(
                    x + this.nodeWidth * this.zoom,
                    this.startY + (this.nodeHeight * this.zoom) / 2,
                    this.calculateNodeX(i + 1),
                    this.startY + (this.nodeHeight * this.zoom) / 2
                );
            }
        }
        
        // Draw HEAD indicator on first node
        if (this.nodes.length > 0) {
            this.drawHeadIndicator(this.calculateNodeX(0), this.startY);
        }
    }
    
    drawNode(node, x, y, alpha = 1, scale = 1, glow = 0, isHighlighted = false) {
        const ctx = this.ctx;
        const width = this.nodeWidth * this.zoom * scale;
        const height = this.nodeHeight * this.zoom * scale;
        const adjustedX = x - (width - this.nodeWidth * this.zoom) / 2;
        const adjustedY = y - (height - this.nodeHeight * this.zoom) / 2;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Glow effect
        if (glow > 0) {
            ctx.shadowBlur = glow;
            ctx.shadowColor = '#00ff88';
        }
        
        // Node rectangle
        ctx.fillStyle = isHighlighted ? 'rgba(0, 255, 136, 0.3)' : 'rgba(44, 62, 80, 0.9)';
        ctx.strokeStyle = isHighlighted ? '#00ff88' : '#34495e';
        ctx.lineWidth = isHighlighted ? 3 : 2;
        
        this.roundRect(ctx, adjustedX, adjustedY, width, height, 10);
        ctx.fill();
        ctx.stroke();
        
        // File icon
        ctx.fillStyle = '#00ff88';
        ctx.font = `${24 * this.zoom * scale}px Arial`;
        ctx.fillText('📄', adjustedX + 10 * this.zoom, adjustedY + 35 * this.zoom);
        
        // Filename
        ctx.fillStyle = '#ecf0f1';
        ctx.font = `bold ${14 * this.zoom * scale}px Arial`;
        ctx.fillText(
            this.truncateText(node.filename, 15),
            adjustedX + 45 * this.zoom,
            adjustedY + 30 * this.zoom
        );
        
        // File size
        ctx.fillStyle = '#95a5a6';
        ctx.font = `${11 * this.zoom * scale}px Arial`;
        ctx.fillText(
            node.size,
            adjustedX + 45 * this.zoom,
            adjustedY + 50 * this.zoom
        );
        
        // Position badge
        ctx.fillStyle = isHighlighted ? '#00ff88' : '#34495e';
        ctx.fillRect(adjustedX + width - 35 * this.zoom, adjustedY + 5 * this.zoom, 30 * this.zoom, 20 * this.zoom);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${12 * this.zoom * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(
            node.position,
            adjustedX + width - 20 * this.zoom,
            adjustedY + 19 * this.zoom
        );
        ctx.textAlign = 'left';
        
        // Next pointer indicator
        if (node.nextNodeId) {
            ctx.fillStyle = '#00ff88';
            ctx.font = `${10 * this.zoom * scale}px Arial`;
            ctx.fillText('next →', adjustedX + 10 * this.zoom, adjustedY + height - 10 * this.zoom);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.fillText('null', adjustedX + 10 * this.zoom, adjustedY + height - 10 * this.zoom);
        }
        
        ctx.restore();
    }
    
    drawArrow(x1, y1, x2, y2, color = '#00d9ff') {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        ctx.setLineDash([]);
        this.drawArrowHead(x2, y2, color);
        ctx.restore();
    }
    
    drawArrowHead(x, y, color = '#00d9ff') {
        const ctx = this.ctx;
        const headLength = 10 * this.zoom;
        
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
    
    drawHeadIndicator(x, y) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.fillStyle = '#00ff88';
        ctx.font = `bold ${16 * this.zoom}px Arial`;
        ctx.fillText('HEAD', x, y - 20 * this.zoom);
        
        // Arrow pointing down
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 20 * this.zoom, y - 10 * this.zoom);
        ctx.lineTo(x + 20 * this.zoom, y);
        ctx.stroke();
        
        this.drawArrowHead(x + 20 * this.zoom, y, '#00ff88');
        ctx.restore();
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
    
    calculateNodeX(index) {
        return this.startX + index * (this.nodeWidth + this.nodeSpacing) * this.zoom;
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
            'CREATE_NODE': 'Node newNode = new Node(file);',
            'TRAVERSE': 'current = current.next;',
            'COMPARE': 'if (current.file.filename.equals(target))',
            'LINK_NODE': 'previous.next = newNode;',
            'FOUND': 'return current; // Found!',
            'DELETE_HEAD': 'head = head.next;',
            'RELINK': 'previous.next = current.next;'
        };
        
        const codeLine = codeMap[operation] || 'Processing...';
        document.getElementById('current-line').textContent = codeLine;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}