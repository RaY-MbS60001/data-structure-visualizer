class StackManager {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.apiBaseUrl = 'http://localhost:8080/api/stack';
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
        
        // Push button
        document.getElementById('push-btn')?.addEventListener('click', () => this.pushFile());
        
        // Pop button
        document.getElementById('pop-btn')?.addEventListener('click', () => this.popFile());
        
        // Peek button
        document.getElementById('peek-btn')?.addEventListener('click', () => this.peekFile());
        
        // Quick actions
        document.getElementById('refresh-btn')?.addEventListener('click', () => this.loadCurrentState());
        document.getElementById('clear-btn')?.addEventListener('click', () => this.clearStack());
    }
    
    updateUploadZone(filename) {
        const uploadZone = document.getElementById('upload-zone');
        uploadZone.querySelector('.upload-content').innerHTML = `
            <span class="upload-icon">✅</span>
            <p><strong>${filename}</strong></p>
            <small>Click to change file</small>
        `;
    }
    
    async pushFile() {
        if (!this.selectedFile) {
            this.showToast('Please select a file first', 'warning');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', this.selectedFile);
        
        try {
            this.showToast('Pushing to stack...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/push`, {
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
            this.showToast('Push failed: ' + error.message, 'error');
        }
    }
    
    async popFile() {
        try {
            this.showToast('Popping from stack...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/pop`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('File popped successfully', 'success');
                setTimeout(() => this.loadCurrentState(), 3000);
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            this.showToast('Pop failed: ' + error.message, 'error');
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
            
            document.getElementById('stack-size').textContent = data.size || 0;
            
            const status = data.isEmpty ? 'Empty' : 
                          data.isFull ? 'Full' : 'Active';
            document.getElementById('stack-status').textContent = status;
            
            if (data.isEmpty) {
                document.getElementById('empty-state')?.classList.remove('hidden');
            }
            
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }
    
    async clearStack() {
        if (!confirm('Clear all files from stack?')) return;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/clear`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Stack cleared', 'success');
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
            push: `// PUSH Operation
public void push(T element) {
    if (isFull()) {
        throw new StackOverflowError();
    }
    
    stack[++top] = element;
    size++;
}`,
            pop: `// POP Operation
public T pop() {
    if (isEmpty()) {
        throw new StackUnderflowError();
    }
    
    T element = stack[top];
    stack[top--] = null;
    size--;
    
    return element;
}`,
            peek: `// PEEK Operation
public T peek() {
    if (isEmpty()) {
        throw new StackUnderflowError();
    }
    
    return stack[top];
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