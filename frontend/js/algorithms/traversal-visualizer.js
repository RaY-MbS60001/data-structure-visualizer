// Tree/Graph Traversal Visualizer
class TraversalVisualizer extends VisualizerBase {
    constructor(canvasId) {
        super(canvasId);
        this.structureType = 'tree'; // tree or graph
        this.nodes = new Map();
        this.edges = [];
        this.traversalOrder = [];
        this.currentStep = -1;
        this.isRunning = false;
        this.delay = 500;
        
        this.buildSampleTree();
    }
    
    buildSampleTree() {
        this.nodes.clear();
        this.edges = [];
        this.structureType = 'tree';
        
        // Create a balanced binary tree
        const treeData = [
            {id: 'A', x: this.width / 2, y: 80, value: 'A'},
            {id: 'B', x: this.width / 2 - 150, y: 180, value: 'B'},
            {id: 'C', x: this.width / 2 + 150, y: 180, value: 'C'},
            {id: 'D', x: this.width / 2 - 225, y: 280, value: 'D'},
            {id: 'E', x: this.width / 2 - 75, y: 280, value: 'E'},
            {id: 'F', x: this.width / 2 + 75, y: 280, value: 'F'},
            {id: 'G', x: this.width / 2 + 225, y: 280, value: 'G'},
            {id: 'H', x: this.width / 2 - 262, y: 380, value: 'H'},
            {id: 'I', x: this.width / 2 - 187, y: 380, value: 'I'},
            {id: 'I', x: this.width / 2 - 187, y: 380, value: 'I'},
            {id: 'J', x: this.width / 2 - 112, y: 380, value: 'J'},
            {id: 'K', x: this.width / 2 - 37, y: 380, value: 'K'}
        ];
        
        treeData.forEach(node => {
            this.nodes.set(node.id, {
                ...node,
                state: 'default',
                left: null,
                right: null,
                visited: false,
                level: Math.floor((node.y - 80) / 100)
            });
        });
        
        // Set up tree relationships
        this.nodes.get('A').left = 'B';
        this.nodes.get('A').right = 'C';
        this.nodes.get('B').left = 'D';
        this.nodes.get('B').right = 'E';
        this.nodes.get('C').left = 'F';
        this.nodes.get('C').right = 'G';
        this.nodes.get('D').left = 'H';
        this.nodes.get('D').right = 'I';
        this.nodes.get('E').left = 'J';
        this.nodes.get('E').right = 'K';
        
        // Create edges based on relationships
        this.createTreeEdges();
        
        this.reset();
        this.redraw();
    }
    
    buildSampleGraph() {
        this.nodes.clear();
        this.edges = [];
        this.structureType = 'graph';
        
        // Create a sample graph
        const graphData = [
            {id: '1', x: 200, y: 150, value: '1'},
            {id: '2', x: 400, y: 100, value: '2'},
            {id: '3', x: 600, y: 150, value: '3'},
            {id: '4', x: 150, y: 300, value: '4'},
            {id: '5', x: 400, y: 250, value: '5'},
            {id: '6', x: 650, y: 300, value: '6'},
            {id: '7', x: 300, y: 400, value: '7'},
            {id: '8', x: 500, y: 400, value: '8'}
        ];
        
        graphData.forEach(node => {
            this.nodes.set(node.id, {
                ...node,
                state: 'default',
                visited: false,
                neighbors: []
            });
        });
        
        // Define graph edges
        const graphEdges = [
            ['1', '2'], ['1', '4'], ['2', '3'], ['2', '5'],
            ['3', '5'], ['3', '6'], ['4', '5'], ['4', '7'],
            ['5', '6'], ['5', '7'], ['5', '8'], ['6', '8'],
            ['7', '8']
        ];
        
        // Create bidirectional edges
        graphEdges.forEach(([source, target]) => {
            this.edges.push({source, target});
            this.nodes.get(source).neighbors.push(target);
            this.nodes.get(target).neighbors.push(source);
        });
        
        this.reset();
        this.redraw();
    }
    
    createTreeEdges() {
        this.edges = [];
        this.nodes.forEach(node => {
            if (node.left) {
                this.edges.push({source: node.id, target: node.left});
            }
            if (node.right) {
                this.edges.push({source: node.id, target: node.right});
            }
        });
    }
    
    async startTraversal(algorithm) {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.traversalOrder = [];
        this.currentStep = -1;
        this.reset();
        
        const startNode = this.structureType === 'tree' ? 'A' : '1';
        
        switch(algorithm) {
            case 'bfs':
                await this.bfs(startNode);
                break;
            case 'dfs':
                await this.dfs(startNode);
                break;
            case 'inorder':
                if (this.structureType === 'tree') {
                    await this.inorderTraversal('A');
                }
                break;
            case 'preorder':
                if (this.structureType === 'tree') {
                    await this.preorderTraversal('A');
                }
                break;
            case 'postorder':
                if (this.structureType === 'tree') {
                    await this.postorderTraversal('A');
                }
                break;
        }
        
        this.isRunning = false;
        this.showTraversalComplete();
    }
    
    async bfs(startId) {
        const queue = [startId];
        const visited = new Set();
        
        while (queue.length > 0 && this.isRunning) {
            const nodeId = queue.shift();
            if (visited.has(nodeId)) continue;
            
            visited.add(nodeId);
            const node = this.nodes.get(nodeId);
            
            // Animate visiting
            node.state = 'visiting';
            this.redraw();
            await this.sleep(this.delay);
            
            // Mark as visited
            node.state = 'visited';
            node.visited = true;
            this.traversalOrder.push(nodeId);
            this.updateTraversalOrder();
            
            // Add neighbors to queue
            if (this.structureType === 'tree') {
                if (node.left && !visited.has(node.left)) {
                    queue.push(node.left);
                    this.highlightEdge(nodeId, node.left);
                }
                if (node.right && !visited.has(node.right)) {
                    queue.push(node.right);
                    this.highlightEdge(nodeId, node.right);
                }
            } else {
                for (const neighbor of node.neighbors) {
                    if (!visited.has(neighbor)) {
                        queue.push(neighbor);
                        this.highlightEdge(nodeId, neighbor);
                    }
                }
            }
            
            this.redraw();
        }
    }
    
    async dfs(nodeId, visited = new Set()) {
        if (!this.isRunning || visited.has(nodeId)) return;
        
        visited.add(nodeId);
        const node = this.nodes.get(nodeId);
        
        // Animate visiting
        node.state = 'visiting';
        this.redraw();
        await this.sleep(this.delay);
        
        // Mark as visited
        node.state = 'visited';
        node.visited = true;
        this.traversalOrder.push(nodeId);
        this.updateTraversalOrder();
        this.redraw();
        
        // Visit neighbors
        if (this.structureType === 'tree') {
            if (node.left) {
                this.highlightEdge(nodeId, node.left);
                await this.dfs(node.left, visited);
            }
            if (node.right) {
                this.highlightEdge(nodeId, node.right);
                await this.dfs(node.right, visited);
            }
        } else {
            for (const neighbor of node.neighbors) {
                if (!visited.has(neighbor)) {
                    this.highlightEdge(nodeId, neighbor);
                    await this.dfs(neighbor, visited);
                }
            }
        }
    }
    
    async inorderTraversal(nodeId) {
        if (!nodeId || !this.isRunning) return;
        
        const node = this.nodes.get(nodeId);
        
        // Visit left subtree
        if (node.left) {
            await this.inorderTraversal(node.left);
        }
        
        // Visit node
        node.state = 'visiting';
        this.redraw();
        await this.sleep(this.delay);
        
        node.state = 'visited';
        node.visited = true;
        this.traversalOrder.push(nodeId);
        this.updateTraversalOrder();
        this.redraw();
        
        // Visit right subtree
        if (node.right) {
            await this.inorderTraversal(node.right);
        }
    }
    
    async preorderTraversal(nodeId) {
        if (!nodeId || !this.isRunning) return;
        
        const node = this.nodes.get(nodeId);
        
        // Visit node first
        node.state = 'visiting';
        this.redraw();
        await this.sleep(this.delay);
        
        node.state = 'visited';
        node.visited = true;
        this.traversalOrder.push(nodeId);
        this.updateTraversalOrder();
        this.redraw();
        
        // Visit left subtree
        if (node.left) {
            await this.preorderTraversal(node.left);
        }
        
        // Visit right subtree
        if (node.right) {
            await this.preorderTraversal(node.right);
        }
    }
    
    async postorderTraversal(nodeId) {
        if (!nodeId || !this.isRunning) return;
        
        const node = this.nodes.get(nodeId);
        
        // Visit left subtree
        if (node.left) {
            await this.postorderTraversal(node.left);
        }
        
        // Visit right subtree
        if (node.right) {
            await this.postorderTraversal(node.right);
        }
        
        // Visit node last
        node.state = 'visiting';
        this.redraw();
        await this.sleep(this.delay);
        
        node.state = 'visited';
        node.visited = true;
        this.traversalOrder.push(nodeId);
        this.updateTraversalOrder();
        this.redraw();
    }
    
    highlightEdge(source, target) {
        const edge = this.edges.find(e => 
            (e.source === source && e.target === target) ||
            (e.source === target && e.target === source)
        );
        if (edge) {
            edge.highlighted = true;
        }
    }
    
    redraw() {
        this.clear();
        this.drawBackground();
        
        // Draw edges
        this.edges.forEach(edge => {
            const source = this.nodes.get(edge.source);
            const target = this.nodes.get(edge.target);
            
            if (source && target) {
                const color = edge.highlighted ? this.colors.success : 
                            (source.visited && target.visited ? this.colors.secondary : this.colors.gray);
                
                this.drawEdge(source.x, source.y, target.x, target.y, {
                    color: color,
                    lineWidth: edge.highlighted ? 3 : 2,
                    arrow: this.structureType === 'tree'
                });
            }
        });
        
        // Draw nodes
        this.nodes.forEach(node => {
            let style = {
                fillColor: this.colors.dark,
                strokeColor: this.colors.primary,
                textColor: this.colors.light,
                glow: false
            };
            
            if (node.state === 'visiting') {
                style.fillColor = this.colors.warning;
                style.strokeColor = this.colors.warning;
                style.textColor = this.colors.dark;
                style.glow = true;
            } else if (node.state === 'visited') {
                style.fillColor = this.colors.success;
                style.strokeColor = this.colors.success;
                style.textColor = this.colors.dark;
            }
            
            this.drawNode(node.x, node.y, 25, node.value, style);
        });
    }
    
    reset() {
        this.nodes.forEach(node => {
            node.state = 'default';
            node.visited = false;
        });
        this.edges.forEach(edge => edge.highlighted = false);
        this.traversalOrder = [];
        this.updateTraversalOrder();
        this.redraw();
    }
    
    updateTraversalOrder() {
        const display = document.getElementById('traversal-order');
        if (display) {
            display.textContent = this.traversalOrder.join(' → ');
        }
    }
    
    showTraversalComplete() {
        const statusBadge = document.getElementById('status-badge');
        if (statusBadge) {
            statusBadge.textContent = 'Traversal Complete';
            statusBadge.className = 'operation-badge complete';
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    setSpeed(speed) {
        this.delay = Math.max(100, 1500 - (speed * 14));
    }
}