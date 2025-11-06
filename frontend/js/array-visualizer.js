class ArrayVisualizer {
    constructor() {
        this.container = document.getElementById('array-elements');
        this.elements = [];
        this.animationQueue = [];
        this.isAnimating = false;

        this.initWebSocket();
    }

    // ====== WEBSOCKET ======
    initWebSocket() {
        const socket = new SockJS('http://localhost:8080/ws-visualization');
        this.stompClient = Stomp.over(socket);

        this.stompClient.connect({}, () => {
            console.log('✅ Connected to Array WebSocket');
            this.stompClient.subscribe('/topic/array-visualization', (msg) => {
                const step = JSON.parse(msg.body);
                this.animationQueue.push(step);
                if (!this.isAnimating) this.processQueue();
            });
        }, (err) => {
            console.error('❌ WebSocket connection failed:', err);
            setTimeout(() => this.initWebSocket(), 5000);
        });
    }

    // ====== STEP PROCESSING ======
    async processQueue() {
        this.isAnimating = true;
        while (this.animationQueue.length > 0) {
            const step = this.animationQueue.shift();
            await this.animateStep(step);
        }
        this.isAnimating = false;
    }

    // ====== ANIMATION ======
    async animateStep(step) {
        this.updateOperationPanel(step);
        this.elements = step.elements || [];
        this.render(step.highlightedElementId);

        const progress = document.getElementById('operation-progress');
        if (progress && step.stepNumber)
            progress.textContent = `Step ${step.stepNumber}/${step.totalSteps}`;

        await this.sleep(700);
    }

    render(highlightId = null) {
  const container = document.getElementById('array-elements');
  container.innerHTML = '';

  if (!this.elements || this.elements.length === 0) {
    document.getElementById('empty-state').style.display = 'flex';
    return;
  }
  document.getElementById('empty-state').style.display = 'none';

  this.elements.forEach((el, i) => {
    const card = document.createElement('div');
    card.className = 'array-card fade-in';
    if (el.elementId === highlightId) {
      card.style.boxShadow = '0 0 25px rgba(0,255,136,0.9)';
      card.style.transform = 'scale(1.05)';
    }

    card.innerHTML = `
      <div class="array-pointer">${i === 0 ? 'START' : ''}</div>
      <div class="file-icon">📄</div>
      <div class="filename">${el.filename}</div>
      <div class="filesize">${el.size}</div>
    `;

    container.appendChild(card);
  });
}

    updateOperationPanel(step) {
        const desc = document.getElementById('operation-description');
        if (!desc) return;

        desc.innerHTML = `
            <div class="operation-badge">${step.operation}</div>
            <p>${step.description}</p>
        `;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}