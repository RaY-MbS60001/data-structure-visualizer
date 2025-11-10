// Graph Manager
class GraphManager {
    constructor() {
        this.visualizer = new GraphVisualizer('graphCanvas');
        this.setupEventListeners();
        this.nodeIdCounter = 1;
        this.edgeIdCounter = 1;
        this.mode = 'node'; // 'node' or 'edge'
        this.edgeStart = null;
        
        // Load sample graph
        this.loadSampleGraph();
    }
    
    setupEventListeners() {
        // Mode buttons
        document.getElementById('modeNode')?.addEventListener('click', () => {
            this.mode = 'node';
            this.edgeStart = null;
            this.updateModeUI();
        });
        
        document.getElementById('modeEdge')?.addEventListener('click', () => {
            this.mode = 'edge';
            this.updateModeUI();
        });
        
        // Canvas click
        this.visualizer.canvas.addEventListener('click', (e) => {
            if (this.mode === 'node') {
                this.handleNodeClick(e);
            } else if (this.mode === 'edge') {
                this.handleEdgeClick(e);
            }
        });
        
        // Algorithm buttons
        document.getElementById('runDijkstra')?.addEventListener('click', () => {
            this.runDijkstra();
        });
        
        document.getElementById('runBFS')?.addEventListener('click', () => {
            this.runBFS();
        });
        
        document.getElementById('runDFS')?.addEventListener('click', () => {
            this.runDFS();
        });
    }
    
    loadSampleGraph() {
        // Create a sample graph
        const nodes = [
            {id: 'A', x: 100, y: 200},
            {id: 'B', x: 300, y: 100},
            {id: 'C', x: 500, y: 100},
            {id: 'D', x: 300, y: 300},
            {id: 'E', x: 500, y: 300},
            {id: 'F', x: 700, y: 200}
        ];
        
        nodes.forEach(node => {
            this.visualizer.addNode(node.id, node.id, node.x, node.y);
        });
        
        const edges = [
            {source: 'A', target: 'B', weight: 4},
            {source: 'A', target: 'D', weight: 2},
            {source: 'B', target: 'C', weight: 5},
            {source: 'B', target: 'D', weight: 1},
            {source: 'C', target: 'E', weight: 3},
            {source: 'C', target: 'F', weight: 2},
            {source: 'D', target: 'E', weight: 4},
            {source: 'E', target: 'F', weight: 1}
        ];
        
        edges.forEach(edge => {
            this.visualizer.addEdge(edge.source, edge.target, edge.weight);
        });
    }
    
    handleNodeClick(e) {
        const rect = this.visualizer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if clicking on existing node
        for (const [id, node] of this.visualizer.nodes) {
            const dist = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
            if (dist <= node.radius) {
                // Remove node
                this.visualizer.nodes.delete(id);
                // Remove connected edges
                this.visualizer.edges = this.visualizer.edges.filter(edge => 
                    edge.source !== id && edge.target !== id
                );
                this.visualizer.redraw();
                return;
            }
        }
        
        // Add new node
        const nodeId = `N${this.nodeIdCounter++}`;
        this.visualizer.addNode(nodeId, nodeId, x, y);
    }
    
    handleEdgeClick(e) {
        const rect = this.visualizer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Find clicked node
        let clickedNode = null;
        for (const [id, node] of this.visualizer.nodes) {
            const dist = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
            if (dist <= node.radius) {
                clickedNode = id;
                break;
            }
        }
        
        if (clickedNode) {
            if (!this.edgeStart) {
                // First click - select start node
                this.edgeStart = clickedNode;
                this.visualizer.nodes.get(clickedNode).highlighted = true;
                this.visualizer.redraw();
            } else if (this.edgeStart !== clickedNode) {
                // Second click - create edge
                const weight = parseFloat(prompt('Enter edge weight:', '1')) || 1;
                this.visualizer.addEdge(this.edgeStart, clickedNode, weight);
                
                // Reset
                this.visualizer.nodes.get(this.edgeStart).highlighted = false;
                this.edgeStart = null;
                this.visualizer.redraw();
            }
        }
    }
    
    updateModeUI() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (this.mode === 'node') {
            document.getElementById('modeNode')?.classList.add('active');
        } else {
            document.getElementById('modeEdge')?.classList.add('active');
        }
    }
    
    async runDijkstra() {
        const start = prompt('Enter start node ID:');
        const end = prompt('Enter end node ID:');
        
        if (!start || !end || !this.visualizer.nodes.has(start) || !this.visualizer.nodes.has(end)) {
            alert('Invalid node IDs');
            return;
        }
        
        // Send request to backend
        const response = await fetch('http://localhost:8080/api/algorithm/dijkstra', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                graph: {
                    nodes: Array.from(this.visualizer.nodes.entries()).map(([id, node]) => ({
                        id, label: node.label, x: node.x, y: node.y
                    })),
                    edges: this.visualizer.edges
                },
                startId: start,
                endId: end
            })
        });
        
        const result = await response.json();
        
        if (result.path) {
            this.visualizer.highlightPath(result.path);
        }
    }
    
    async runBFS() {
        const start = prompt('Enter start node ID:');
        
        if (!start || !this.visualizer.nodes.has(start)) {
            alert('Invalid node ID');
            return;
        }
        
        // Visual BFS implementation
        const visited = new Set();
        const queue = [start];
        
        while (queue.length > 0) {
            const nodeId = queue.shift();
            if (visited.has(nodeId)) continue;
            
            visited.add(nodeId);
            const node = this.visualizer.nodes.get(nodeId);
            
            // Highlight current node
            node.highlighted = true;
            node.visited = true;
            this.visualizer.redraw();
            await this.delay(500);
            
            // Find neighbors
            const neighbors = [];
            this.visualizer.edges.forEach(edge => {
                if (edge.source === nodeId && !visited.has(edge.target)) {
                    neighbors.push(edge.target);
                } else if (edge.target === nodeId && !visited.has(edge.source)) {
                    neighbors.push(edge.source);
                }
            });
            
            neighbors.forEach(n => queue.push(n));
        }
        
        // Reset highlights after 2 seconds
        setTimeout(() => {
            this.visualizer.nodes.forEach(node => {
                node.highlighted = false;
                node.visited = false;
            });
            this.visualizer.redraw();
        }, 2000);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize
const graphManager = new GraphManager();
