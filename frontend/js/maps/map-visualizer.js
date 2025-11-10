// Map Visualizer for Geographic Routes
class MapVisualizer extends VisualizerBase {
    constructor(canvasId) {
        super(canvasId);
        this.mapData = null;
        this.nodes = new Map();
        this.edges = [];
        this.selectedStart = null;
        this.selectedEnd = null;
        this.currentPath = [];
        this.visitedNodes = new Set();
        this.isRunning = false;
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.hoveredNode = null;
        
        this.setupMapEventListeners();
    }
    
    setupMapEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleMapClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('wheel', (e) => this.handleZoom(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredNode = null;
            this.isDragging = false;
            this.redraw();
        });
    }
    
    async loadMapData(province) {
        try {
            // In real implementation, this would fetch from backend
            // For now, we'll create sample data
            if (province === 'kzn') {
                this.mapData = this.createKZNData();
            } else if (province === 'gauteng') {
                this.mapData = this.createGautengData();
            }
            
            this.processMapData();
            this.fitMapToCanvas();
            this.redraw();
        } catch (error) {
            console.error('Error loading map data:', error);
        }
    }
    
    createKZNData() {
        return {
            nodes: [
                {id: 'durban', name: 'Durban', x: 400, y: 350, lat: -29.8587, lon: 31.0218},
                {id: 'pmb', name: 'Pietermaritzburg', x: 350, y: 280, lat: -29.6006, lon: 30.3794},
                {id: 'richards', name: 'Richards Bay', x: 450, y: 200, lat: -28.7610, lon: 32.0379},
                {id: 'newcastle', name: 'Newcastle', x: 250, y: 150, lat: -27.7576, lon: 29.9318},
                {id: 'ladysmith', name: 'Ladysmith', x: 300, y: 220, lat: -28.5592, lon: 29.7819},
                {id: 'empangeni', name: 'Empangeni', x: 430, y: 250, lat: -28.7620, lon: 31.8967},
                {id: 'port_shepstone', name: 'Port Shepstone', x: 380, y: 420, lat: -30.7414, lon: 30.4550}
            ],
            edges: [
                {source: 'durban', target: 'pmb', distance: 80, roadName: 'N3'},
                {source: 'durban', target: 'richards', distance: 170, roadName: 'N2'},
                {source: 'pmb', target: 'ladysmith', distance: 160, roadName: 'N3'},
                {source: 'ladysmith', target: 'newcastle', distance: 100, roadName: 'N11'},
                {source: 'richards', target: 'empangeni', distance: 30, roadName: 'N2'},
                {source: 'durban', target: 'port_shepstone', distance: 120, roadName: 'N2'},
                {source: 'durban', target: 'empangeni', distance: 150, roadName: 'R102'},
                {source: 'pmb', target: 'newcastle', distance: 240, roadName: 'N3/N11'}
            ]
        };
    }
    
    createGautengData() {
        return {
            nodes: [
                {id: 'jhb', name: 'Johannesburg', x: 400, y: 300, lat: -26.2041, lon: 28.0473},
                {id: 'pta', name: 'Pretoria', x: 400, y: 180, lat: -25.7479, lon: 28.2293},
                {id: 'sandton', name: 'Sandton', x: 420, y: 280, lat: -26.1076, lon: 28.0567},
                {id: 'soweto', name: 'Soweto', x: 350, y: 330, lat: -26.2678, lon: 27.8585},
                {id: 'kempton', name: 'Kempton Park', x: 480, y: 290, lat: -26.1077, lon: 28.2294},
                {id: 'randburg', name: 'Randburg', x: 380, y: 260, lat: -26.0937, lon: 28.0067},
                {id: 'centurion', name: 'Centurion', x: 400, y: 230, lat: -25.8744, lon: 28.1875}
            ],
            edges: [
                {source: 'jhb', target: 'pta', distance: 60, roadName: 'N1'},
                {source: 'jhb', target: 'sandton', distance: 15, roadName: 'M1'},
                {source: 'jhb', target: 'soweto', distance: 20, roadName: 'M70'},
                {source: 'sandton', target: 'pta', distance: 50, roadName: 'N1'},
                {source: 'jhb', target: 'kempton', distance: 25, roadName: 'R24'},
                {source: 'sandton', target: 'randburg', distance: 10, roadName: 'N1'},
                {source: 'pta', target: 'centurion', distance: 20, roadName: 'N1'},
                {source: 'centurion', target: 'jhb', distance: 40, roadName: 'N1/N14'},
                {source: 'randburg', target: 'soweto', distance: 25, roadName: 'R564'}
            ]
        };
    }
    
    processMapData() {
        this.nodes.clear();
        this.edges = [];
        
        // Process nodes
        this.mapData.nodes.forEach(node => {
            this.nodes.set(node.id, {
                ...node,
                state: 'default',
                distance: Infinity,
                previous: null,
                neighbors: []
            });
        });
        
        // Process edges and build adjacency
        this.mapData.edges.forEach(edge => {
            this.edges.push({
                ...edge,
                highlighted: false,
                inPath: false
            });
            
            // Build adjacency list
            this.nodes.get(edge.source).neighbors.push({
                id: edge.target,
                distance: edge.distance,
                roadName: edge.roadName
            });
            this.nodes.get(edge.target).neighbors.push({
                id: edge.source,
                distance: edge.distance,
                roadName: edge.roadName
            });
        });
    }
    
    fitMapToCanvas() {
        if (!this.mapData) return;
        
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        this.nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y);
        });
        
        const mapWidth = maxX - minX;
        const mapHeight = maxY - minY;
        const padding = 100;
        
        const scaleX = (this.width - 2 * padding) / mapWidth;
        const scaleY = (this.height - 2 * padding) / mapHeight;
        this.scale = Math.min(scaleX, scaleY) * 0.8;
        
        this.offsetX = (this.width - mapWidth * this.scale) / 2 - minX * this.scale;
        this.offsetY = (this.height - mapHeight * this.scale) / 2 - minY * this.scale;
    }
    
    async findShortestPath(startId, endId, algorithm = 'dijkstra') {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.currentPath = [];
        this.visitedNodes.clear();
        this.resetNodeStates();
        
        let result;
        if (algorithm === 'dijkstra') {
            result = await this.dijkstra(startId, endId);
        } else if (algorithm === 'astar') {
            result = await this.aStar(startId, endId);
        } else if (algorithm === 'bfs') {
            result = await this.bfs(startId, endId);
        }
        
        if (result && result.path.length > 0) {
            await this.animatePath(result.path);
        }
        
        this.isRunning = false;
        return result;
    }
    
    async dijkstra(startId, endId) {
        const distances = new Map();
        const previous = new Map();
        const unvisited = new Set();
        
        // Initialize
        this.nodes.forEach((node, id) => {
            distances.set(id, id === startId ? 0 : Infinity);
            previous.set(id, null);
            unvisited.add(id);
        });
        
        while (unvisited.size > 0) {
            if (!this.isRunning) return null;
            
            // Find unvisited node with minimum distance
            let currentId = null;
            let minDistance = Infinity;
            
            unvisited.forEach(id => {
                if (distances.get(id) < minDistance) {
                    minDistance = distances.get(id);
                    currentId = id;
                }
            });
            
            if (currentId === null || currentId === endId) break;
            
            unvisited.delete(currentId);
            this.visitedNodes.add(currentId);
            
            // Animate current node
            const currentNode = this.nodes.get(currentId);
            currentNode.state = 'visiting';
            this.redraw();
            await this.sleep(100);
            currentNode.state = 'visited';
            
            // Update distances to neighbors
            currentNode.neighbors.forEach(neighbor => {
                if (unvisited.has(neighbor.id)) {
                    const alt = distances.get(currentId) + neighbor.distance;
                    if (alt < distances.get(neighbor.id)) {
                        distances.set(neighbor.id, alt);
                        previous.set(neighbor.id, currentId);
                        
                        // Highlight edge being considered
                        this.highlightEdge(currentId, neighbor.id, true);
                        this.redraw();
                        await this.sleep(50);
                        this.highlightEdge(currentId, neighbor.id, false);
                    }
                }
            });
        }
        
        // Reconstruct path
        const path = [];
        let currentId = endId;
        
        while (currentId !== null) {
            path.unshift(currentId);
            currentId = previous.get(currentId);
        }
        
        if (path[0] !== startId) return null;
        
        return {
            path: path,
            distance: distances.get(endId)
        };
    }
    
    async aStar(startId, endId) {
        const openSet = new Set([startId]);
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        // Initialize
        this.nodes.forEach((node, id) => {
            gScore.set(id, Infinity);
            fScore.set(id, Infinity);
        });
        
        gScore.set(startId, 0);
        fScore.set(startId, this.heuristic(startId, endId));
        
        while (openSet.size > 0) {
            if (!this.isRunning) return null;
            
            // Find node in openSet with lowest fScore
            let currentId = null;
            let lowestFScore = Infinity;
            
            openSet.forEach(id => {
                if (fScore.get(id) < lowestFScore) {
                    lowestFScore = fScore.get(id);
                    currentId = id;
                }
            });
            
            if (currentId === endId) {
                // Reconstruct path
                const path = [];
                while (currentId) {
                    path.unshift(currentId);
                    currentId = cameFrom.get(currentId);
                }
                return { path: path, distance: gScore.get(endId) };
            }
            
            openSet.delete(currentId);
            this.visitedNodes.add(currentId);
            
            // Animate current node
            const currentNode = this.nodes.get(currentId);
            currentNode.state = 'visiting';
            this.redraw();
            await this.sleep(100);
            currentNode.state = 'visited';
            
            // Check neighbors
            currentNode.neighbors.forEach(neighbor => {
                const tentativeGScore = gScore.get(currentId) + neighbor.distance;
                
                if (tentativeGScore < gScore.get(neighbor.id)) {
                    cameFrom.set(neighbor.id, currentId);
                    gScore.set(neighbor.id, tentativeGScore);
                    fScore.set(neighbor.id, gScore.get(neighbor.id) + this.heuristic(neighbor.id, endId));
                    
                    if (!openSet.has(neighbor.id)) {
                        openSet.add(neighbor.id);
                    }
                    
                    // Highlight edge
                    this.highlightEdge(currentId, neighbor.id, true);
                    this.redraw();
                    await this.sleep(50);
                    this.highlightEdge(currentId, neighbor.id, false);
                }
            });
        }
        
        return null;
    }
    
    async bfs(startId, endId) {
        const queue = [startId];
        const visited = new Set([startId]);
        const previous = new Map([[startId, null]]);
        
        while (queue.length > 0) {
            if (!this.isRunning) return null;
            
            const currentId = queue.shift();
            
            if (currentId === endId) {
                // Reconstruct path
                const path = [];
                let nodeId = endId;
                while (nodeId !== null) {
                    path.unshift(nodeId);
                    nodeId = previous.get(nodeId);
                }
                
                // Calculate total distance
                let distance = 0;
                for (let i = 0; i < path.length - 1; i++) {
                    const edge = this.findEdge(path[i], path[i + 1]);
                    if (edge) distance += edge.distance;
                }
                
                return { path: path, distance: distance };
            }
            
            this.visitedNodes.add(currentId);
            
            // Animate current node
            const currentNode = this.nodes.get(currentId);
            currentNode.state = 'visiting';
            this.redraw();
            await this.sleep(100);
            currentNode.state = 'visited';
            
            // Check neighbors
            currentNode.neighbors.forEach(neighbor => {
                if (!visited.has(neighbor.id)) {
                    visited.add(neighbor.id);
                    queue.push(neighbor.id);
                    previous.set(neighbor.id, currentId);
                    
                    // Highlight edge
                    this.highlightEdge(currentId, neighbor.id, true);
                    this.redraw();
                    await this.sleep(50);
                    this.highlightEdge(currentId, neighbor.id, false);
                }
            });
        }
        
        return null;
    }
    
    heuristic(nodeId1, nodeId2) {
        const node1 = this.nodes.get(nodeId1);
        const node2 = this.nodes.get(nodeId2);
        
        // Euclidean distance heuristic
        return Math.sqrt(
            Math.pow(node2.x - node1.x, 2) + 
            Math.pow(node2.y - node1.y, 2)
        ) * 0.5; // Scale factor to make heuristic admissible
    }
    
    async animatePath(path) {
        // Highlight path edges
        for (let i = 0; i < path.length - 1; i++) {
            const edge = this.findEdge(path[i], path[i + 1]);
            if (edge) {
                edge.inPath = true;
                this.redraw();
                await this.sleep(200);
            }
        }
        
        // Highlight path nodes
        path.forEach(nodeId => {
            const node = this.nodes.get(nodeId);
            if (node) node.state = 'inPath';
        });
        
        this.currentPath = path;
        this.redraw();
    }
    
    findEdge(sourceId, targetId) {
        return this.edges.find(edge => 
            (edge.source === sourceId && edge.target === targetId) ||
            (edge.source === targetId && edge.target === sourceId)
        );
    }
    
    highlightEdge(sourceId, targetId, highlight) {
        const edge = this.findEdge(sourceId, targetId);
        if (edge) edge.highlighted = highlight;
    }
    
    handleMapClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Find clicked node
        let clickedNode = null;
        this.nodes.forEach(node => {
            const nodeX = node.x * this.scale + this.offsetX;
            const nodeY = node.y * this.scale + this.offsetY;
            const distance = Math.sqrt(Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2));
            
            if (distance <= 20) {
                clickedNode = node;
            }
        });
        
        if (clickedNode) {
            if (!this.selectedStart) {
                this.selectedStart = clickedNode.id;
                document.getElementById('startCity').value = clickedNode.id;
            } else if (!this.selectedEnd || this.selectedStart === this.selectedEnd) {
                this.selectedEnd = clickedNode.id;
                document.getElementById('endCity').value = clickedNode.id;
            } else {
                // Reset selection
                this.selectedStart = clickedNode.id;
                this.selectedEnd = null;
                document.getElementById('startCity').value = clickedNode.id;
                document.getElementById('endCity').value = '';
                this.resetPath();
            }
            this.redraw();
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isDragging) {
            this.offsetX += x - this.dragStart.x;
            this.offsetY += y - this.dragStart.y;
            this.dragStart = { x, y };
            this.redraw();
            return;
        }
        
        // Check hover
        let hoveredNode = null;
        this.nodes.forEach(node => {
            const nodeX = node.x * this.scale + this.offsetX;
            const nodeY = node.y * this.scale + this.offsetY;
            const distance = Math.sqrt(Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2));
            
            if (distance <= 20) {
                hoveredNode = node;
            }
        });
        
        if (hoveredNode !== this.hoveredNode) {
            this.hoveredNode = hoveredNode;
            this.canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
            this.redraw();
        }
    }
    
    handleMouseDown(e) {
        if (!this.hoveredNode) {
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            this.dragStart = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    handleMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = this.hoveredNode ? 'pointer' : 'default';
    }
    
    handleZoom(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = this.scale * delta;
        
        if (newScale >= 0.5 && newScale <= 3) {
            // Zoom towards mouse position
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.offsetX = x - (x - this.offsetX) * delta;
            this.offsetY = y - (y - this.offsetY) * delta;
            this.scale = newScale;
            
            this.redraw();
        }
    }
    
    resetNodeStates() {
        this.nodes.forEach(node => {
            node.state = 'default';
            node.distance = Infinity;
            node.previous = null;
        });
        this.edges.forEach(edge => {
            edge.highlighted = false;
            edge.inPath = false;
        });
    }
    
    resetPath() {
        this.currentPath = [];
        this.visitedNodes.clear();
        this.resetNodeStates();
        this.redraw();
    }
    
    redraw() {
        this.clear();
        this.drawBackground();
        
        // Draw edges
        this.edges.forEach(edge => {
            const source = this.nodes.get(edge.source);
            const target = this.nodes.get(edge.target);
            
            if (source && target) {
                const x1 = source.x * this.scale + this.offsetX;
                const y1 = source.y * this.scale + this.offsetY;
                const x2 = target.x * this.scale + this.offsetX;
                const y2 = target.y * this.scale + this.offsetY;
                
                let color = this.colors.gray;
                let lineWidth = 2;
                
                if (edge.inPath) {
                    color = this.colors.success;
                    lineWidth = 4;
                } else if (edge.highlighted) {
                    color = this.colors.warning;
                    lineWidth = 3;
                }
                
                this.drawEdge(x1, y1, x2, y2, {
                    color: color,
                    lineWidth: lineWidth,
                    label: edge.roadName + '\n' + edge.distance + 'km',
                    curved: false
                });
            }
        });
        
        // Draw nodes
        this.nodes.forEach(node => {
            const x = node.x * this.scale + this.offsetX;
            const y = node.y * this.scale + this.offsetY;
            
            let style = {
                fillColor: this.colors.dark,
                strokeColor: this.colors.primary,
                textColor: this.colors.light,
                lineWidth: 2,
                glow: false
            };
            
            if (node.id === this.selectedStart) {
                style.fillColor = this.colors.success;
                style.strokeColor = this.colors.success;
                style.textColor = this.colors.dark;
                style.glow = true;
            } else if (node.id === this.selectedEnd) {
                style.fillColor = this.colors.danger;
                style.strokeColor = this.colors.danger;
                style.textColor = this.colors.light;
                style.glow = true;
            } else if (node.state === 'visiting') {
                style.fillColor = this.colors.warning;
                style.strokeColor = this.colors.warning;
                style.textColor = this.colors.dark;
            } else if (node.state === 'visited') {
                style.fillColor = this.colors.secondary;
                style.strokeColor = this.colors.secondary;
                style.textColor = this.colors.light;
            } else if (node.state === 'inPath') {
                style.fillColor = this.colors.success;
                style.strokeColor = this.colors.success;
                style.textColor = this.colors.dark;
            }
            
            if (node === this.hoveredNode) {
                style.lineWidth = 3;
                style.glow = true;
            }
            
            this.drawNode(x, y, 15, '', style);
            
            // Draw city name
            this.drawText(node.name, x, y - 25, {
                color: this.colors.light,
                font: 'bold 14px "Segoe UI", sans-serif'
            });
        });
        
        // Draw legend
        this.drawLegend();
    }
    
    drawLegend() {
        const legendX = 20;
        const legendY = this.height - 120;
        
        this.ctx.save();
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(legendX, legendY, 200, 100);
        
        this.ctx.strokeStyle = this.colors.primary;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(legendX, legendY, 200, 100);
        
        // Legend items
        const items = [
            { color: this.colors.success, label: 'Start/Path' },
            { color: this.colors.danger, label: 'Destination' },
            { color: this.colors.secondary, label: 'Visited' },
            { color: this.colors.primary, label: 'Unvisited' }
        ];
        
        items.forEach((item, index) => {
            const y = legendY + 20 + index * 20;
            
            // Node sample
            this.ctx.fillStyle = item.color;
            this.ctx.beginPath();
            this.ctx.arc(legendX + 20, y, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Label
            this.ctx.fillStyle = this.colors.light;
            this.ctx.font = '12px "Segoe UI", sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(item.label, legendX + 35, y + 4);
        });
        
        this.ctx.restore();
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}