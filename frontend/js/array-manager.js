class ArrayManager {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.apiBaseUrl = 'http://localhost:8080/api/array';
        this.selectedFile = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCurrentState();
        this.setupCodeTabs();
    }

    // ====== EVENT LISTENERS ======
    setupEventListeners() {
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');

        if (!uploadZone || !fileInput) {
            console.error('Upload elements missing!');
            return;
        }

        // --- Click opens file dialog ---
        uploadZone.addEventListener('click', () => fileInput.click());

        // --- Drag over zone ---
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.classList.add('drag-over');
        });

        // --- Drag leave zone ---
        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
        });

        // --- Drop file into zone ---
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                this.selectedFile = files[0];
                fileInput.files = files; // sync with hidden input
                this.updateUploadZone(this.selectedFile.name);
            }
        });

        // --- Manual input change ---
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                this.selectedFile = files[0];
                this.updateUploadZone(this.selectedFile.name);
            }
        });

        // --- Buttons ---
        document.getElementById('insert-btn')?.addEventListener('click', () => this.insertFile());
        document.getElementById('search-btn')?.addEventListener('click', () => this.searchFile());
        document.getElementById('access-btn')?.addEventListener('click', () => this.accessFile());
        document.getElementById('delete-btn')?.addEventListener('click', () => this.deleteFile());
        document.getElementById('resize-btn')?.addEventListener('click', () => this.resizeArray());
        document.getElementById('clear-btn')?.addEventListener('click', () => this.clearArray());
        document.getElementById('refresh-btn')?.addEventListener('click', () => this.loadCurrentState());
    }

    // ====== UPLOAD ZONE UI ======
    updateUploadZone(filename) {
        const zone = document.getElementById('upload-zone');
        zone.querySelector('.upload-content').innerHTML = `
            <span class="upload-icon">✅</span>
            <p><strong>${filename}</strong></p>
            <small>Click to change file</small>
        `;
    }

    resetUploadZone() {
        const zone = document.getElementById('upload-zone');
        zone.querySelector('.upload-content').innerHTML = `
            <span class="upload-icon">📁</span>
            <p>Click or drag file here</p>
            <small>Max 10MB</small>
        `;
    }

    // ====== ARRAY OPERATIONS ======
    async insertFile() {
        if (!this.selectedFile) {
            this.showToast('⚠️ Please select a file first', 'warning');
            return;
        }

        const index = document.getElementById('insert-index').value || 0;
        const formData = new FormData();
        formData.append('file', this.selectedFile);

        this.showToast('📤 Inserting file...', 'info');
        try {
            const res = await fetch(`${this.apiBaseUrl}/insert?index=${index}`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                this.showToast('✅ Insert started', 'success');
                this.selectedFile = null;
                this.resetUploadZone();
                setTimeout(() => this.loadCurrentState(), 2000);
            } else {
                this.showToast(data.message, 'error');
            }
        } catch (err) {
            this.showToast('❌ Insert failed: ' + err.message, 'error');
        }
    }

    async searchFile() {
        const name = document.getElementById('search-input').value.trim();
        if (!name) return this.showToast('⚠️ Enter a filename', 'warning');
        this.showToast(`🔍 Searching for '${name}'`, 'info');

        const res = await fetch(`${this.apiBaseUrl}/search?filename=${encodeURIComponent(name)}`);
        const data = await res.json();
        if (data.success)
            this.showToast('🎉 Search visualization started', 'success');
        else this.showToast(data.message, 'error');
    }

    async accessFile() {
        const index = document.getElementById('access-index').value || 0;
        this.showToast(`⚡ Accessing index ${index}`, 'info');
        const res = await fetch(`${this.apiBaseUrl}/access?index=${index}`);
        const data = await res.json();
        if (data.success) this.showToast('✅ Access started', 'success');
        else this.showToast(data.message, 'error');
    }

    async deleteFile() {
        const index = document.getElementById('delete-index').value || 0;
        this.showToast(`🗑️ Deleting at index ${index}`, 'info');
        const res = await fetch(`${this.apiBaseUrl}/delete?index=${index}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.success)
            this.showToast('🧹 Delete visualization started', 'success');
        else this.showToast(data.message, 'error');
    }

    async resizeArray() {
        const capacity = document.getElementById('capacity-input').value || 10;
        await fetch(`${this.apiBaseUrl}/resize?capacity=${capacity}`, { method: 'POST' });
        this.showToast(`♻️ Array resized to ${capacity}`, 'success');
        this.loadCurrentState();
    }

    async clearArray() {
        if (!confirm('Clear all files from array?')) return;
        await fetch(`${this.apiBaseUrl}/clear`, { method: 'DELETE' });
        this.showToast('🧹 Array cleared', 'success');
        this.loadCurrentState();
    }

    async loadCurrentState() {
        try {
            const res = await fetch(`${this.apiBaseUrl}/state`);
            const data = await res.json();

            document.getElementById('file-count').textContent = data.size ?? 0;
            document.getElementById('array-capacity').textContent = data.capacity ?? 10;
            document.getElementById('free-slots').textContent =
                (data.capacity ?? 10) - (data.size ?? 0);

            if (data.isEmpty)
                document.getElementById('empty-state')?.classList.remove('hidden');
            else
                document.getElementById('empty-state')?.classList.add('hidden');
        } catch (err) {
            console.error(err);
            this.showToast('❌ Could not load state', 'error');
        }
    }

    // ====== CODE PANEL ======
    setupCodeTabs() {
        const tabs = document.querySelectorAll('.code-tab');
        const display = document.getElementById('code-display');
        const snippets = {
            insert: `// INSERT Operation\narray[index] = file;`,
            search: `// SEARCH Operation\nfor (file : array)\n if (file.equals(target)) found = true;`,
            delete: `// DELETE Operation\narray[index] = null;\nshiftLeft(index);`,
            access: `// ACCESS Operation\nreturn array[index];`
        };

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const code = tab.getAttribute('data-code');
                display.textContent = snippets[code] || '// Code not available';
            });
        });
    }

    // ====== TOAST NOTIFICATIONS ======
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toast-icon');
        const msg = document.getElementById('toast-message');
        const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
        icon.textContent = icons[type] || 'ℹ️';
        msg.textContent = message;

        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}