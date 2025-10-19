class TreeVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.animationQueue = [];
        this.isAnimating = false;
        
        // Visual settings
        this.nodeRadius = 35;
        this.levelHeight = 120;
        this.horizontalSpacing = 180;
        this.startY = 80;
        
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
            console.log('✅ Tree WebSocket Connected');
            this.updateConnectionStatus(true);
            
            this.stompClient.subscribe('/topic/tree-visualization', (message) => {
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
        
        // Build node positions
        this.buildNodePositions();
        
        switch(step.operation) {
            case 'START_INSERT':
            case 'SET_ROOT':
                await this.animateInsert(step);
                break;
            case 'TRAVERSE':
            case 'COMPARE':
                await this.animateTraverse(step);
                break;
            case 'GO_LEFT':
            case 'GO_RIGHT':
                await this.animateDirection(step);
                break;
            case 'INSERT_NODE':
                await this.animateNewNode(step);
                break;
            case 'FOUND':
                await this.animateFound(step);
                break;
            case 'NOT_FOUND':
                await this.animateNotFound(step);
                break;
            default:
                this.draw();
                await this.sleep(500);
        }
        
        this.updateStats();
    }
    
    buildNodePositions() {
        if (this.nodes.length === 0) return;
        
        // Create a map of nodes by ID
        this.nodeMap = new Map();
        this.nodes.forEach(node => {
            this.nodeMap.set(node.nodeId, {
                ...node,
                x: 0,
                y: 0,
                visited: false
            });
        });
        
        // Find root (level 0)
        const root = this.nodes.find(n => n.level === 0);
        if (!root) return;
        
        // Calculate positions
        this.calculatePositions(root.nodeId, this.canvas.width / 2, this.startY, this.canvas.width / 4);
    }
    
    calculatePositions(nodeId, x, y, horizontalSpacing) {
        const node = this.nodeMap.get(nodeId);
        if (!node) return;
        
        node.x = x;
        node.y = y;
        
        const nextY = y + this.levelHeight;
        const nextSpacing = horizontalSpacing / 2;
        
        // Position left child
        if (node.leftChildId) {
            this.calculatePositions(node.leftChildId, x - horizontalSpacing, nextY, nextSpacing);
        }
        
        // Position right child
        if (node.rightChildId) {
            this.calculatePositions(node.rightChildId, x + horizontalSpacing, nextY, nextSpacing);
        }
    }
    
    async animateInsert(step) {
        // Highlight all nodes briefly
        for (let i = 0; i < 2; i++) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawTree(true);
            await this.sleep(200);
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawTree(false);
            await this.sleep(200);
        }
    }
    
    async animateTraverse(step) {
        const highlightedId = step.highlightedNodeId;
        if (!highlightedId) {
            this.draw();
            return;
        }
        
        // Pulse the current node
        for (let i = 0; i < 3; i++) {
            for (let scale = 1; scale <= 1.3; scale += 0.05) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawTree(false, highlightedId, scale, 20);
                await this.sleep(15);
            }
            for (let scale = 1.3; scale >= 1; scale -= 0.05) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawTree(false, highlightedId, scale, 20);
                await this.sleep(15);
            }
        }
    }
    
    async animateDirection(step) {
        const highlightedId = step.highlightedNodeId;
        const direction = step.operation === 'GO_LEFT' ? 'left' : 'right';
        
        if (!highlightedId) {
            this.draw();
            return;
        }
        
        const currentNode = this.nodeMap.get(highlightedId);
        if (!currentNode) {
            this.draw();
            return;
        }
        
        const childId = direction === 'left' ? currentNode.leftChildId : currentNode.rightChildId;
        
        // Draw arrow animation
        if (childId) {
            const childNode = this.nodeMap.get(childId);
            if (childNode) {
                // Animate arrow from current to child
                for (let progress = 0; progress <= 1; progress += 0.05) {
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.drawTree(false);
                    
                    // Draw animated arrow
                    this.drawAnimatedArrow(
                        currentNode.x, currentNode.y + this.nodeRadius,
                        childNode.x, childNode.y - this.nodeRadius,
                        progress,
                        '#00ff88'
                    );
                    
                    await this.sleep(20);
                }
            }
        }
        
        this.draw();
    }
    
    async animateNewNode(step) {
        const highlightedId = step.highlightedNodeId;
        if (!highlightedId) {
            this.draw();
            return;
        }
        
        const newNode = this.nodeMap.get(highlightedId);
        if (!newNode) {
            this.draw();
            return;
        }
        
        // Fade in the new node
        for (let alpha = 0; alpha <= 1; alpha += 0.1) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawTree(false);
            
            // Draw new node with alpha
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.drawNode(newNode, newNode.x, newNode.y, 1, 15, true);
            this.ctx.restore();
            
            await this.sleep(30);
        }
        
        this.draw();
    }
    
    async animateFound(step) {
        const highlightedId = step.highlightedNodeId;
        if (!highlightedId) {
            this.draw();
            return;
        }
        
        // Victory animation - glow effect
        for (let i = 0; i < 5; i++) {
            for (let glow = 0; glow <= 40; glow += 4) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawTree(false, highlightedId, 1.2, glow);
                await this.sleep(25);
            }
            for (let glow = 40; glow >= 0; glow -= 4) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawTree(false, highlightedId, 1.2, glow);
                await this.sleep(25);
            }
        }
        
        this.draw();
    }
    
    async animateNotFound(step) {
        // Screen shake
        for (let i = 0; i < 5; i++) {
            this.ctx.save();
            this.ctx.translate(Math.random() * 8 - 4, Math.random() * 8 - 4);
            this.draw();
            this.ctx.restore();
            await this.sleep(80);
        }
        this.draw();
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.nodes.length === 0) return;
        
        this.drawTree();
    }
    
    drawTree(highlightAll = false, highlightId = null, highlightScale = 1, glow = 0) {
        if (this.nodes.length === 0) return;
        
        // Draw edges first (so nodes appear on top)
        this.nodeMap.forEach(node => {
            if (node.leftChildId) {
                const leftChild = this.nodeMap.get(node.leftChildId);
                if (leftChild) {
                    this.drawEdge(node.x, node.y, leftChild.x, leftChild.y, false);
                }
            }
            if (node.rightChildId) {
                const rightChild = this.nodeMap.get(node.rightChildId);
                if (rightChild) {
                    this.drawEdge(node.x, node.y, rightChild.x, rightChild.y, false);
                }
            }
        });
        
        // Draw nodes
        this.nodeMap.forEach(node => {
            const isHighlighted = highlightAll || node.nodeId === highlightId;
            const scale = isHighlighted ? highlightScale : 1;
            const nodeGlow = isHighlighted ? glow : 0;
            
            this.drawNode(node, node.x, node.y, scale, nodeGlow, isHighlighted);
        });
        
        // Draw root indicator
        const root = Array.from(this.nodeMap.values()).find(n => n.level === 0);
        if (root) {
            this.drawRootIndicator(root.x, root.y);
        }
    }
    
    drawNode(node, x, y, scale = 1, glow = 0, isHighlighted = false) {
        const ctx = this.ctx;
        const radius = this.nodeRadius * scale;
        
        ctx.save();
        
        if (glow > 0) {
            ctx.shadowBlur = glow;
            ctx.shadowColor = '#00ff88';
        }
        
        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHighlighted ? 'rgba(0, 255, 136, 0.3)' : 'rgba(44, 62, 80, 0.9)';
        ctx.fill();
        ctx.strokeStyle = isHighlighted ? '#00ff88' : '#34495e';
        ctx.lineWidth = isHighlighted ? 4 : 2;
        ctx.stroke();
        
        // File icon
        ctx.shadowBlur = 0;
        ctx.font = `${16 * scale}px Arial`;
        ctx.fillStyle = '#00ff88';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📄', x, y - 5);
        
        // Filename (truncated)
        ctx.font = `bold ${10 * scale}px Arial`;
        ctx.fillStyle = '#ecf0f1';
        const truncated = this.truncateText(node.filename, 10);
        ctx.fillText(truncated, x, y + 12);
        
        // Level indicator
        ctx.font = `${8 * scale}px Arial`;
        ctx.fillStyle = '#95a5a6';
        ctx.fillText(`L${node.level}`, x, y + 22);
        
        ctx.restore();
    }
    
    drawEdge(x1, y1, x2, y2, isHighlighted = false) {
        const ctx = this.ctx;
        
        // Calculate connection points (from edge of circles, not centers)
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const startX = x1 + this.nodeRadius * Math.cos(angle);
        const startY = y1 + this.nodeRadius * Math.sin(angle);
        const endX = x2 - this.nodeRadius * Math.cos(angle);
        const endY = y2 - this.nodeRadius * Math.sin(angle);
        
        ctx.save();
        ctx.strokeStyle = isHighlighted ? '#00ff88' : '#34495e';
        ctx.lineWidth = isHighlighted ? 3 : 2;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        ctx.restore();
    }
    
    drawAnimatedArrow(x1, y1, x2, y2, progress, color) {
        const ctx = this.ctx;
        
        const currentX = x1 + (x2 - x1) * progress;
        const currentY = y1 + (y2 - y1) * progress;
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        
        // Draw arrow head
        if (progress > 0.7) {
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const headLength = 15;
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(currentX, currentY);
            ctx.lineTo(
                currentX - headLength * Math.cos(angle - Math.PI / 6),
                currentY - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
                currentX - headLength * Math.cos(angle + Math.PI / 6),
                currentY - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawRootIndicator(x, y) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ROOT', x, y - this.nodeRadius - 20);
        
        // Arrow pointing down
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - this.nodeRadius - 10);
        ctx.lineTo(x, y - this.nodeRadius - 2);
        ctx.stroke();
        
        // Arrow head
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.moveTo(x, y - this.nodeRadius);
        ctx.lineTo(x - 5, y - this.nodeRadius - 5);
        ctx.lineTo(x + 5, y - this.nodeRadius - 5);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 2) + '..';
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
            'START_INSERT': 'public Node insert(Node root, T data) {',
            'SET_ROOT': 'return new Node(data);',
            'TRAVERSE': 'if (current == null) return null;',
            'COMPARE': 'if (data.compareTo(current.data) < 0)',
            'GO_LEFT': 'root.left = insert(root.left, data);',
            'GO_RIGHT': 'root.right = insert(root.right, data);',
            'INSERT_NODE': 'return new Node(data);',
            'FOUND': 'return current; // Found!',
            'NOT_FOUND': 'return null; // Not found'
        };
        
        const codeLine = codeMap[operation] || 'Processing...';
        document.getElementById('current-line').textContent = codeLine;
    }
    
    updateStats() {
        document.getElementById('tree-size').textContent = this.nodes.length;
        
        // Calculate tree height (max level + 1)
        const maxLevel = this.nodes.length > 0 
            ? Math.max(...this.nodes.map(n => n.level))
            : 0;
        document.getElementById('tree-height').textContent = maxLevel + 1;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}