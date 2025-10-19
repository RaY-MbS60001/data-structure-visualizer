class QueueManager {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.apiBaseUrl = 'http://localhost:8080/api/queue';
        this.selectedFile = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadCurrentState();
        this.setupCodeTabs();
    }
    
    setupEventListeners() {
        // Upload zone
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');
        
        uploadZone?.addEventListener('click', () => fileInput.click());
        
        uploadZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });
        
        uploadZone?.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });
        
        uploadZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.selectedFile = files[0];
                this.updateUploadZone(files[0].name);
            }
        });
        
        fileInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.selectedFile = e.target.files[0];
                this.updateUploadZone(e.target.files[0].name);
            }
        });
        
        // Enqueue button
        document.getElementById('enqueue-btn')?.addEventListener('click', () => this.enqueueFile());
        
        // Dequeue button
        document.getElementById('dequeue-btn')?.addEventListener('click', () => this.dequeueFile());
        
        // Peek button
        document.getElementById('peek-btn')?.addEventListener('click', () => this.peekFile());
        
        // Quick actions
        document.getElementById('refresh-btn')?.addEventListener('click', () => this.loadCurrentState());
        document.getElementById('clear-btn')?.addEventListener('click', () => this.clearQueue());
    }
    
    updateUploadZone(filename) {
        const uploadZone = document.getElementById('upload-zone');
        uploadZone.querySelector('.upload-content').innerHTML = `
            <span class="upload-icon">✅</span>
            <p><strong>${filename}</strong></p>
            <small>Click to change file</small>
        `;
    }
    
    async enqueueFile() {
        if (!this.selectedFile) {
            this.showToast('Please select a file first', 'warning');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', this.selectedFile);
        
        try {
            this.showToast('Enqueuing to queue...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/enqueue`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast(data.message, 'success');
                this.selectedFile = null;
                this.resetUploadZone();
                
                setTimeout(() => this.loadCurrentState(), data.steps * 800 + 1000);
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            this.showToast('Enqueue failed: ' + error.message, 'error');
        }
    }
    
    async dequeueFile() {
        try {
            this.showToast('Dequeuing from queue...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/dequeue`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('File dequeued successfully', 'success');
                setTimeout(() => this.loadCurrentState(), 3000);
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            this.showToast('Dequeue failed: ' + error.message, 'error');
        }
    }
    
    async peekFile() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/peek`);
            const data = await response.json();
            
            if (data.success) {
                console.log('Peek operation started');
            }
        } catch (error) {
            this.showToast('Peek failed: ' + error.message, 'error');
        }
    }
    
    async loadCurrentState() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/state`);
            const data = await response.json();
            
            document.getElementById('queue-size').textContent = data.size || 0;
            
            const status = data.isEmpty ? 'Empty' : 
                          data.isFull ? 'Full' : 'Active';
            document.getElementById('queue-status').textContent = status;
            
            if (data.isEmpty) {
                document.getElementById('empty-state')?.classList.remove('hidden');
            }
            
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }
    
    async clearQueue() {
        if (!confirm('Clear all files from queue?')) return;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/clear`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Queue cleared', 'success');
                this.loadCurrentState();
            }
        } catch (error) {
            this.showToast('Clear failed: ' + error.message, 'error');
        }
    }
    
    resetUploadZone() {
        const uploadZone = document.getElementById('upload-zone');
        uploadZone.querySelector('.upload-content').innerHTML = `
            <span class="upload-icon">📁</span>
            <p>Click or drag file here</p>
            <small>Max 10MB</small>
        `;
    }
    
    setupCodeTabs() {
        const tabs = document.querySelectorAll('.code-tab');
        const codeDisplay = document.getElementById('code-display');
        
        const codeSnippets = {
            enqueue: `// ENQUEUE Operation
public void enqueue(T element) {
    if (isFull()) {
        throw new QueueFullException();
    }
    
    rear = (rear + 1) % capacity;
    queue[rear] = element;
    size++;
}`,
            dequeue: `// DEQUEUE Operation
public T dequeue() {
    if (isEmpty()) {
        throw new QueueEmptyException();
    }
    
    T element = queue[front];
    queue[front] = null;
    front = (front + 1) % capacity;
    size--;
    
    return element;
}`,
            peek: `// PEEK Operation
public T peek() {
    if (isEmpty()) {
        throw new QueueEmptyException();
    }
    
    return queue[front];
}`
        };
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const codeType = tab.getAttribute('data-code');
                codeDisplay.textContent = codeSnippets[codeType] || '// Code not available';
            });
        });
    }
    
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastIcon = document.getElementById('toast-icon');
        const toastMessage = document.getElementById('toast-message');
        
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        toastIcon.textContent = icons[type] || icons.info;
        toastMessage.textContent = message;
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}