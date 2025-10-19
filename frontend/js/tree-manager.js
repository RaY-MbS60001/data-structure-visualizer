class TreeManager {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.apiBaseUrl = 'http://localhost:8080/api/tree';
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
        
        // Insert button
        document.getElementById('insert-btn')?.addEventListener('click', () => this.insertFile());
        
        // Search button
        const searchInput = document.getElementById('search-input');
        document.getElementById('search-btn')?.addEventListener('click', () => this.searchFile());
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchFile();
        });
        
        // Traversal buttons
        document.getElementById('inorder-btn')?.addEventListener('click', () => this.performTraversal('inorder'));
        document.getElementById('preorder-btn')?.addEventListener('click', () => this.performTraversal('preorder'));
        document.getElementById('postorder-btn')?.addEventListener('click', () => this.performTraversal('postorder'));
        
        // Quick actions
        document.getElementById('refresh-btn')?.addEventListener('click', () => this.loadCurrentState());
        document.getElementById('clear-btn')?.addEventListener('click', () => this.clearTree());
    }
    
    updateUploadZone(filename) {
        const uploadZone = document.getElementById('upload-zone');
        uploadZone.querySelector('.upload-content').innerHTML = `
            <span class="upload-icon">✅</span>
            <p><strong>${filename}</strong></p>
            <small>Click to change file</small>
        `;
    }
    
    async insertFile() {
        if (!this.selectedFile) {
            this.showToast('Please select a file first', 'warning');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', this.selectedFile);
        
        try {
            this.showToast('Inserting into tree...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/insert`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast(data.message, 'success');
                this.selectedFile = null;
                this.resetUploadZone();
                
                setTimeout(() => this.loadCurrentState(), data.steps * 900 + 1000);
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            this.showToast('Insert failed: ' + error.message, 'error');
        }
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
                console.log('Search started');
            }
        } catch (error) {
            this.showToast('Search failed: ' + error.message, 'error');
        }
    }
    
    async performTraversal(type) {
        this.showToast(`Performing ${type} traversal...`, 'info');
        
        // This would need a backend endpoint for traversals
        // For now, just show a message
        setTimeout(() => {
            this.showToast(`${type} traversal: Feature coming soon!`, 'info');
        }, 1000);
    }
    
    async loadCurrentState() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/state`);
            const data = await response.json();
            
            document.getElementById('tree-size').textContent = data.size || 0;
            
            if (data.isEmpty) {
                document.getElementById('empty-state')?.classList.remove('hidden');
            }
            
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }
    
    async clearTree() {
        if (!confirm('Clear the entire tree? This cannot be undone!')) return;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/clear`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Tree cleared', 'success');
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
            <small>Sorted by filename</small>
        `;
    }
    
    setupCodeTabs() {
        const tabs = document.querySelectorAll('.code-tab');
        const codeDisplay = document.getElementById('code-display');
        
        const codeSnippets = {
            insert: `// INSERT Operation (Recursive)
public Node insert(Node root, T data) {
    // Base case: empty spot found
    if (root == null) {
        return new Node(data);
    }
    
    // Compare and go left or right
    if (data.compareTo(root.data) < 0) {
        root.left = insert(root.left, data);
    } else {
        root.right = insert(root.right, data);
    }
    
    return root;
}`,
            search: `// SEARCH Operation (Recursive)
public Node search(Node root, T data) {
    // Base cases
    if (root == null) {
        return null; // Not found
    }
    
    if (data.equals(root.data)) {
        return root; // Found!
    }
    
    // Recursively search left or right
    if (data.compareTo(root.data) < 0) {
        return search(root.left, data);
    } else {
        return search(root.right, data);
    }
}`,
            traversal: `// IN-ORDER Traversal (Left-Root-Right)
public void inorder(Node root) {
    if (root == null) return;
    
    inorder(root.left);     // Visit left
    visit(root);            // Visit root
    inorder(root.right);    // Visit right
}

// PRE-ORDER (Root-Left-Right)
public void preorder(Node root) {
    if (root == null) return;
    
    visit(root);
    preorder(root.left);
    preorder(root.right);
}

// POST-ORDER (Left-Right-Root)
public void postorder(Node root) {
    if (root == null) return;
    
    postorder(root.left);
    postorder(root.right);
    visit(root);
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