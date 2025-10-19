class StorageManager {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.apiBaseUrl = 'http://localhost:8080/api/files';
        this.selectedFile = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadCurrentState();
        this.setupCodeTabs();
    }
    
    setupEventListeners() {
        // Upload
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');
        const uploadBtn = document.getElementById('upload-btn');
        
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
        
        uploadBtn?.addEventListener('click', () => this.uploadFile());
        
        // Search
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');
        
        searchBtn?.addEventListener('click', () => this.searchFile());
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchFile();
        });
        
        // Delete
        const deleteBtn = document.getElementById('delete-btn');
        deleteBtn?.addEventListener('click', () => this.deleteFile());
        
        // Quick actions
        const refreshBtn = document.getElementById('refresh-btn');
        const clearAllBtn = document.getElementById('clear-all-btn');
        
        refreshBtn?.addEventListener('click', () => this.loadCurrentState());
        clearAllBtn?.addEventListener('click', () => this.clearAllFiles());
    }
    
    updateUploadZone(filename) {
        const uploadZone = document.getElementById('upload-zone');
        uploadZone.querySelector('.upload-content').innerHTML = `
            <span class="upload-icon">✅</span>
            <p><strong>${filename}</strong></p>
            <small>Click to change file</small>
        `;
    }
    
    async uploadFile() {
        if (!this.selectedFile) {
            this.showToast('Please select a file first', 'warning');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', this.selectedFile);
        
        try {
            this.showToast('Uploading file...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/upload`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast(data.message, 'success');
                this.selectedFile = null;
                this.resetUploadZone();
                
                // Refresh state after animation completes
                setTimeout(() => this.loadCurrentState(), data.steps * 800 + 1000);
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            this.showToast('Upload failed: ' + error.message, 'error');
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
    
    async searchFile() {
        const searchInput = document.getElementById('search-input');
        const filename = searchInput.value.trim();
        
        if (!filename) {
            this.showToast('Please enter a filename', 'warning');
            return;
        }
        
        try {
            this.showToast('Searching for: ' + filename, 'info');
            
            const response = await fetch(
                `${this.apiBaseUrl}/search?filename=${encodeURIComponent(filename)}`
            );
            
            const data = await response.json();
            
            if (data.success) {
                // Animation will be handled by WebSocket
                console.log('Search started');
            }
        } catch (error) {
            this.showToast('Search failed: ' + error.message, 'error');
        }
    }
    
    async deleteFile() {
        const deleteSelect = document.getElementById('delete-select');
        const filename = deleteSelect.value;
        
        if (!filename) {
            this.showToast('Please select a file to delete', 'warning');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
            return;
        }
        
        try {
            this.showToast('Deleting file...', 'info');
            
            const response = await fetch(
                `${this.apiBaseUrl}/delete?filename=${encodeURIComponent(filename)}`,
                { method: 'DELETE' }
            );
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('File deleted successfully', 'success');
                
                // Refresh state after animation completes
                setTimeout(() => this.loadCurrentState(), 3000);
            }
        } catch (error) {
            this.showToast('Delete failed: ' + error.message, 'error');
        }
    }
    
    async loadCurrentState() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/state`);
            const data = await response.json();
            
            // Update stats
            document.getElementById('file-count').textContent = data.totalFiles || 0;
            document.getElementById('storage-used').textContent = 
                this.formatBytes(data.totalStorageUsed || 0);
            
            // Update delete dropdown
            this.updateDeleteDropdown(data.files || []);
            
            // If no files, show empty state
            if (data.isEmpty) {
                document.getElementById('empty-state')?.classList.remove('hidden');
            }
            
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }
    
    updateDeleteDropdown(files) {
        const deleteSelect = document.getElementById('delete-select');
        
        deleteSelect.innerHTML = '<option value="">-- Select file to delete --</option>';
        
        files.forEach(file => {
            const option = document.createElement('option');
            option.value = file.filename;
            option.textContent = `${file.filename} (${this.formatBytes(file.size)})`;
            deleteSelect.appendChild(option);
        });
    }
    
    async clearAllFiles() {
        if (!confirm('Are you sure you want to delete ALL files? This cannot be undone!')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/list`);
            const data = await response.json();
            
            for (const file of data.files || []) {
                await fetch(
                    `${this.apiBaseUrl}/delete?filename=${encodeURIComponent(file.filename)}`,
                    { method: 'DELETE' }
                );
            }
            
            this.showToast('All files cleared', 'success');
            setTimeout(() => this.loadCurrentState(), 1000);
            
        } catch (error) {
            this.showToast('Clear failed: ' + error.message, 'error');
        }
    }
    
    setupCodeTabs() {
        const tabs = document.querySelectorAll('.code-tab');
        const codeDisplay = document.getElementById('code-display');
        
        const codeSnippets = {
            insert: `// Insert operation in FileLinkedList
public void insert(StoredFile file) {
    Node newNode = new Node(file);
    
    if (head == null) {
        // Empty list - set as head
        head = newNode;
    } else {
        // Traverse to end
        Node current = head;
        while (current.next != null) {
            current = current.next;
        }
        // Link new node
        current.next = newNode;
    }
    
    size++;
}`,
            search: `// Search operation in FileLinkedList
public Node search(String filename) {
    Node current = head;
    int position = 0;
    
    while (current != null) {
        // Compare with target
        if (current.file.getFilename()
                   .equals(filename)) {
            // Found!
            return current;
        }
        
        current = current.next;
        position++;
    }
    
    // Not found
    return null;
}`,
            delete: `// Delete operation in FileLinkedList
public boolean delete(String filename) {
    if (head == null) return false;
    
    // Special case: delete head
    if (head.file.getFilename()
               .equals(filename)) {
        head = head.next;
        size--;
        return true;
    }
    
    // General case
    Node current = head;
    Node previous = null;
    
    while (current != null) {
        if (current.file.getFilename()
                   .equals(filename)) {
            // Relink: bypass current node
            previous.next = current.next;
            size--;
            return true;
        }
        
        previous = current;
        current = current.next;
    }
    
    return false;
}`
        };
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Update code display
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
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
}