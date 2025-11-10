// Map Manager
class MapManager {
    constructor() {
        this.visualizer = new MapVisualizer('mapCanvas');
        this.currentProvince = null;
        this.currentAlgorithm = 'dijkstra';
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // City selection
        document.getElementById('startCity').addEventListener('change', (e) => {
            this.visualizer.selectedStart = e.target.value;
            this.visualizer.redraw();
        });
        
        document.getElementById('endCity').addEventListener('change', (e) => {
            this.visualizer.selectedEnd = e.target.value;
            this.visualizer.redraw();
        });
        
        // Algorithm selection
        document.getElementById('algorithm').addEventListener('change', (e) => {
            this.currentAlgorithm = e.target.value;
        });
        
        // Find route button
        document.getElementById('find-route-btn').addEventListener('click', () => {
            this.findRoute();
        });
        
        // Clear button
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearRoute();
        });
        
        // WebSocket subscriptions
        wsHandler.subscribe('/topic/pathfinding', (data) => {
            this.handlePathfindingUpdate(data);
        });
    }
    
    async loadMap(province) {
        this.currentProvince = province;
        await this.visualizer.loadMapData(province);
        
        // Populate city dropdowns
        this.populateCitySelects();
    }
    
    populateCitySelects() {
        const startSelect = document.getElementById('startCity');
        const endSelect = document.getElementById('endCity');
        
        // Clear existing options
        startSelect.innerHTML = '<option value="">Select Start City</option>';
        endSelect.innerHTML = '<option value="">Select Destination</option>';
        
        // Add cities
        this.visualizer.nodes.forEach(node => {
            const startOption = document.createElement('option');
            startOption.value = node.id;
            startOption.textContent = node.name;
            startSelect.appendChild(startOption);
            
            const endOption = document.createElement('option');
            endOption.value = node.id;
            endOption.textContent = node.name;
            endSelect.appendChild(endOption);
        });
    }
    
    async findRoute() {
        const startCity = this.visualizer.selectedStart || document.getElementById('startCity').value;
        const endCity = this.visualizer.selectedEnd || document.getElementById('endCity').value;
        
        if (!startCity || !endCity) {
            this.showAlert('Please select both start and destination cities', 'warning');
            return;
        }
        
        if (startCity === endCity) {
            this.showAlert('Start and destination cities cannot be the same', 'warning');
            return;
        }
        
        // Update UI
        document.getElementById('find-route-btn').disabled = true;
        document.getElementById('route-status').textContent = 'Finding route...';
        document.getElementById('route-status').className = 'status-badge calculating';
        
        try {
            const result = await this.visualizer.findShortestPath(startCity, endCity, this.currentAlgorithm);
            
            if (result) {
                this.displayRouteInfo(result);
                this.showAlert(`Route found: ${result.distance}km`, 'success');
                
                // Send to backend
                wsHandler.send('/app/pathfinding/route', {
                    province: this.currentProvince,
                    start: startCity,
                    end: endCity,
                    algorithm: this.currentAlgorithm,
                    path: result.path,
                    distance: result.distance
                });
            } else {
                this.showAlert('No route found', 'error');
                document.getElementById('route-status').textContent = 'No route found';
                document.getElementById('route-status').className = 'status-badge error';
            }
        } catch (error) {
            console.error('Error finding route:', error);
            this.showAlert('Error finding route', 'error');
        }
        
        document.getElementById('find-route-btn').disabled = false;
    }
    
    displayRouteInfo(result) {
        // Update status
        document.getElementById('route-status').textContent = 'Route found';
        document.getElementById('route-status').className = 'status-badge success';
        
        // Display distance
        document.getElementById('route-distance').textContent = result.distance.toFixed(1);
        
        // Calculate and display travel time
        const avgSpeed = 80; // km/h average speed
        const travelTime = result.distance / avgSpeed;
        const hours = Math.floor(travelTime);
        const minutes = Math.round((travelTime - hours) * 60);
        document.getElementById('route-time').textContent = 
            hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        
        // Display route path
        const pathNames = result.path.map(nodeId => {
            const node = this.visualizer.nodes.get(nodeId);
            return node ? node.name : nodeId;
        });
        document.getElementById('route-path').textContent = pathNames.join(' → ');
        
        // Display algorithm stats
        document.getElementById('nodes-explored').textContent = this.visualizer.visitedNodes.size;
        document.getElementById('path-length').textContent = result.path.length;
    }
    
    clearRoute() {
        this.visualizer.selectedStart = null;
        this.visualizer.selectedEnd = null;
        this.visualizer.resetPath();
        
        document.getElementById('startCity').value = '';
        document.getElementById('endCity').value = '';
        document.getElementById('route-distance').textContent = '-';
        document.getElementById('route-time').textContent = '-';
        document.getElementById('route-path').textContent = '-';
        document.getElementById('nodes-explored').textContent = '-';
        document.getElementById('path-length').textContent = '-';
        document.getElementById('route-status').textContent = 'Ready';
        document.getElementById('route-status').className = 'status-badge';
    }
    
    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `route-alert ${type}`;
        alertDiv.textContent = message;
        
        const container = document.querySelector('.map-controls');
        container.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
    
    handlePathfindingUpdate(data) {
        // Handle real-time updates from other users
        if (data.province === this.currentProvince) {
            console.log('Pathfinding update received:', data);
        }
    }
}

// Global instance
const mapManager = new MapManager();