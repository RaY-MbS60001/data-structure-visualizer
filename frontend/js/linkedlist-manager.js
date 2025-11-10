// Linked List Manager
class LinkedListManager {
    constructor() {
        this.visualizer = new LinkedListVisualizer('linkedListCanvas');
        this.setupEventListeners();
        
        // Subscribe to WebSocket updates
        wsHandler.subscribe('/topic/linkedlist', (data) => {
            this.handleWebSocketUpdate(data);
        });
    }
    
    setupEventListeners() {
        // Speed slider
        document.getElementById('speedSlider')?.addEventListener('input', (e) => {
            const speed = e.target.value;
            document.getElementById('speedValue').textContent = speed;
            animationEngine.setSpeed(speed / 50);
        });
        
        // Enter key on input
        document.getElementById('valueInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addNode();
            }
        });
    }
    
    addNode() {
        const input = document.getElementById('valueInput');
        const value = input.value.trim();
        
        if (value) {
            this.visualizer.addNode(value);
            this.updateNodeCount();
            input.value = '';
            input.focus();
            
            // Send to backend
            fetch('http://localhost:8080/api/linkedlist/add', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({value: value})
            });
        }
    }
    
    removeNode() {
        const input = document.getElementById('valueInput');
        const index = parseInt(input.value);
        
        if (!isNaN(index)) {
            this.visualizer.removeNode(index);
            this.updateNodeCount();
            input.value = '';
            
            // Send to backend
            fetch(`http://localhost:8080/api/linkedlist/remove/${index}`, {
                method: 'DELETE'
            });
        } else if (this.visualizer.nodes.length > 0) {
            // Remove last node if no index specified
            this.visualizer.removeNode(this.visualizer.nodes.length - 1);
            this.updateNodeCount();
        }
    }
    
    clear() {
        this.visualizer.nodes = [];
        this.visualizer.redraw();
        this.updateNodeCount();
        
        // Send to backend
        fetch('http://localhost:8080/api/linkedlist/clear', {
            method: 'DELETE'
        });
    }
    
    updateNodeCount() {
        document.getElementById('nodeCount').textContent = this.visualizer.nodes.length;
    }
    
    handleWebSocketUpdate(data) {
        switch(data.operation) {
            case 'add':
                this.visualizer.addNode(data.value, true);
                this.updateNodeCount();
                break;
            case 'remove':
                this.visualizer.removeNode(data.index, true);
                this.updateNodeCount();
                break;
            case 'clear':
                this.clear();
                break;
        }
    }
}

// Initialize
const linkedListManager = new LinkedListManager();
