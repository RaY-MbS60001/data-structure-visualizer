// WebSocket Handler for real-time updates
class WebSocketHandler {
    constructor(endpoint = '/ws-visualization') {
        this.endpoint = endpoint;
        this.stompClient = null;
        this.subscriptions = new Map();
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        
        this.connect();
    }
    
    connect() {
        try {
            const socket = new SockJS(`http://localhost:8080${this.endpoint}`);
            this.stompClient = Stomp.over(socket);
            
            // Disable debug logs in production
            this.stompClient.debug = null;
            
            this.stompClient.connect({}, 
                (frame) => this.onConnect(frame),
                (error) => this.onError(error)
            );
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.scheduleReconnect();
        }
    }
    
    onConnect(frame) {
        console.log('✅ WebSocket Connected:', frame);
        this.connected = true;
        this.reconnectAttempts = 0;
        
        // Update UI connection status
        this.updateConnectionStatus('connected');
        
        // Resubscribe to all topics
        this.subscriptions.forEach((callback, topic) => {
            this.subscribe(topic, callback);
        });
        
        // Emit custom event
        window.dispatchEvent(new CustomEvent('websocket-connected'));
    }
    
    onError(error) {
        console.error('❌ WebSocket Error:', error);
        this.connected = false;
        this.updateConnectionStatus('disconnected');
        this.scheduleReconnect();
    }
    
    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * this.reconnectAttempts;
            console.log(`Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts})`);
            
            setTimeout(() => {
                this.updateConnectionStatus('connecting');
                this.connect();
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
            this.updateConnectionStatus('failed');
        }
    }
    
    subscribe(topic, callback) {
        if (!this.connected || !this.stompClient) {
            // Store subscription for later
            this.subscriptions.set(topic, callback);
            return null;
        }
        
        const subscription = this.stompClient.subscribe(topic, (message) => {
            try {
                const data = JSON.parse(message.body);
                callback(data);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        });
        
        this.subscriptions.set(topic, callback);
        return subscription;
    }
    
    send(destination, data) {
        if (!this.connected || !this.stompClient) {
            console.warn('Cannot send - WebSocket not connected');
            return false;
        }
        
        try {
            this.stompClient.send(destination, {}, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }
    
    unsubscribe(topic) {
        this.subscriptions.delete(topic);
    }
    
    disconnect() {
        if (this.stompClient) {
            this.stompClient.disconnect();
            this.connected = false;
            this.updateConnectionStatus('disconnected');
        }
    }
    
    updateConnectionStatus(status) {
        const indicator = document.getElementById('connection-indicator');
        const text = document.getElementById('connection-text');
        
        if (indicator) {
            indicator.className = `status-dot ${status}`;
        }
        
        if (text) {
            const messages = {
                'connecting': 'Connecting...',
                'connected': 'Connected',
                'disconnected': 'Disconnected',
                'failed': 'Connection Failed'
            };
            text.textContent = messages[status] || status;
        }
    }
}

// Create global instance
const wsHandler = new WebSocketHandler();