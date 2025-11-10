// Searching Algorithm Visualizer
class SearchingVisualizer extends VisualizerBase {
    constructor(canvasId) {
        super(canvasId);
        this.array = [];
        this.arraySize = 20;
        this.maxValue = 100;
        this.searchValue = null;
        this.foundIndex = -1;
        this.currentIndex = -1;
        this.elementsChecked = 0;
        this.isRunning = false;
        this.delay = 300;
        
        this.generateSortedArray();
    }
    
    generateSortedArray() {
        this.array = [];
        
        for (let i = 0; i < this.arraySize; i++) {
            const value = Math.floor((i + 1) * (this.maxValue / this.arraySize)) + Math.floor(Math.random() * 5);
            this.array.push({
                value: Math.min(value, this.maxValue),
                state: 'default' // default, checking, checked, found, range
            });
        }
        
        // Ensure array is sorted
        this.array.sort((a, b) => a.value - b.value);
        
        this.reset();
        this.redraw();
    }
    
    generateRandomArray() {
        this.array = [];
        
        for (let i = 0; i < this.arraySize; i++) {
            this.array.push({
                value: Math.floor(Math.random() * this.maxValue) + 1,
                state: 'default'
            });
        }
        
        this.reset();
        this.redraw();
    }
    
    async search(value, algorithm) {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.searchValue = value;
        this.foundIndex = -1;
        this.currentIndex = -1;
        this.elementsChecked = 0;
        
        // Reset all states
        this.array.forEach(item => item.state = 'default');
        
        let result = -1;
        
        switch(algorithm) {
            case 'linear':
                result = await this.linearSearch();
                break;
            case 'binary':
                result = await this.binarySearch();
                break;
            case 'jump':
                result = await this.jumpSearch();
                break;
            case 'interpolation':
                result = await this.interpolationSearch();
                break;
        }
        
        this.isRunning = false;
        this.foundIndex = result;
        
        if (result !== -1) {
            this.array[result].state = 'found';
            this.showResult(true, result);
        } else {
            this.showResult(false, -1);
        }
        
        this.redraw();
    }
    
    async linearSearch() {
        for (let i = 0; i < this.array.length; i++) {
            if (!this.isRunning) return -1;
            
            this.currentIndex = i;
            this.array[i].state = 'checking';
            this.elementsChecked++;
            this.updateStats();
            this.redraw();
            
            await this.sleep(this.delay);
            
            if (this.array[i].value === this.searchValue) {
                return i;
            }
            
            this.array[i].state = 'checked';
        }
        
        return -1;
    }
    
    async binarySearch() {
        let left = 0;
        let right = this.array.length - 1;
        
        while (left <= right) {
            if (!this.isRunning) return -1;
            
            const mid = Math.floor((left + right) / 2);
            
            // Highlight search range
            for (let i = 0; i < this.array.length; i++) {
                if (i >= left && i <= right) {
                    if (this.array[i].state !== 'checked') {
                        this.array[i].state = 'range';
                    }
                } else {
                    if (this.array[i].state === 'range') {
                        this.array[i].state = 'checked';
                    }
                }
            }
            
            this.currentIndex = mid;
            this.array[mid].state = 'checking';
            this.elementsChecked++;
            this.updateStats();
            this.redraw();
            
            await this.sleep(this.delay);
            
            if (this.array[mid].value === this.searchValue) {
                return mid;
            } else if (this.array[mid].value < this.searchValue) {
                for (let i = left; i <= mid; i++) {
                    this.array[i].state = 'checked';
                }
                left = mid + 1;
            } else {
                for (let i = mid; i <= right; i++) {
                    this.array[i].state = 'checked';
                }
                right = mid - 1;
            }
        }
        
        return -1;
    }
    
    async jumpSearch() {
        const n = this.array.length;
        const step = Math.floor(Math.sqrt(n));
        let prev = 0;
        
        // Jump through blocks
        while (prev < n && this.array[Math.min(prev + step, n) - 1].value < this.searchValue) {
            if (!this.isRunning) return -1;
            
            // Highlight jump
            for (let i = prev; i < Math.min(prev + step, n); i++) {
                this.array[i].state = 'range';
            }
            
            this.currentIndex = Math.min(prev + step, n) - 1;
            this.array[this.currentIndex].state = 'checking';
            this.elementsChecked++;
            this.updateStats();
            this.redraw();
            
            await this.sleep(this.delay);
            
            // Mark block as checked
            for (let i = prev; i < Math.min(prev + step, n); i++) {
                this.array[i].state = 'checked';
            }
            
            prev += step;
        }
        
        // Linear search in the identified block
        for (let i = prev; i < Math.min(prev + step, n); i++) {
            if (!this.isRunning) return -1;
            
            this.currentIndex = i;
            this.array[i].state = 'checking';
            this.elementsChecked++;
            this.updateStats();
            this.redraw();
            
            await this.sleep(this.delay);
            
            if (this.array[i].value === this.searchValue) {
                return i;
            }
            
            if (this.array[i].value > this.searchValue) {
                break;
            }
            
            this.array[i].state = 'checked';
        }
        
        return -1;
    }
    
    async interpolationSearch() {
        let low = 0;
        let high = this.array.length - 1;
        
        while (low <= high && this.searchValue >= this.array[low].value && 
               this.searchValue <= this.array[high].value) {
            if (!this.isRunning) return -1;
            
            // Highlight search range
            for (let i = low; i <= high; i++) {
                if (this.array[i].state !== 'checked') {
                    this.array[i].state = 'range';
                }
            }
            
            if (low === high) {
                if (this.array[low].value === this.searchValue) {
                    return low;
                }
                return -1;
            }
            
            // Calculate position using interpolation formula
            const pos = low + Math.floor(
                ((high - low) / (this.array[high].value - this.array[low].value)) * 
                (this.searchValue - this.array[low].value)
            );
            
            this.currentIndex = pos;
            this.array[pos].state = 'checking';
            this.elementsChecked++;
            this.updateStats();
            this.redraw();
            
            await this.sleep(this.delay);
            
            if (this.array[pos].value === this.searchValue) {
                return pos;
            }
            
            if (this.array[pos].value < this.searchValue) {
                for (let i = low; i <= pos; i++) {
                    this.array[i].state = 'checked';
                }
                low = pos + 1;
            } else {
                for (let i = pos; i <= high; i++) {
                    this.array[i].state = 'checked';
                }
                high = pos - 1;
            }
        }
        
        return -1;
    }
    
    redraw() {
        this.clear();
        this.drawBackground();
        
        const boxWidth = 60;
        const boxHeight = 40;
        const spacing = 10;
        const itemsPerRow = Math.floor((this.width - 40) / (boxWidth + spacing));
        const startX = (this.width - (itemsPerRow * (boxWidth + spacing) - spacing)) / 2;
        const startY = 100;
        
        this.array.forEach((element, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            const x = startX + col * (boxWidth + spacing);
            const y = startY + row * (boxHeight + spacing * 2);
            
            // Set color based on state
            let fillColor = this.colors.dark;
            let strokeColor = this.colors.primary;
            let textColor = this.colors.light;
            let glow = false;
            
            switch(element.state) {
                case 'checking':
                    fillColor = this.colors.warning;
                    strokeColor = this.colors.warning;
                    textColor = this.colors.dark;
                    glow = true;
                    break;
                case 'checked':
                    fillColor = this.colors.darker;
                    strokeColor = this.colors.gray;
                    textColor = this.colors.gray;
                    break;
                case 'found':
                    fillColor = this.colors.success;
                    strokeColor = this.colors.success;
                    textColor = this.colors.dark;
                    glow = true;
                    break;
                case 'range':
                    fillColor = this.colors.dark;
                    strokeColor = this.colors.secondary;
                    textColor = this.colors.light;
                    break;
            }
            
            // Draw box
            this.ctx.save();
            
            if (glow) {
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = strokeColor;
            }
            
            this.ctx.fillStyle = fillColor;
            this.ctx.fillRect(x, y, boxWidth, boxHeight);
            
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, boxWidth, boxHeight);
            
            // Draw value
            this.ctx.fillStyle = textColor;
            this.ctx.font = '16px "Segoe UI", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(element.value.toString(), x + boxWidth / 2, y + boxHeight / 2);
            
            // Draw index
            this.ctx.fillStyle = this.colors.gray;
            this.ctx.font = '12px "Segoe UI", sans-serif';
            this.ctx.fillText(index.toString(), x + boxWidth / 2, y + boxHeight + 15);
            
            this.ctx.restore();
        });
        
        // Draw search value indicator
        if (this.searchValue !== null) {
            this.drawText(`Searching for: ${this.searchValue}`, this.width / 2, 50, {
                color: this.colors.primary,
                font: 'bold 18px "Segoe UI", sans-serif'
            });
        }
        
        // Draw current pointer
        if (this.currentIndex >= 0 && this.currentIndex < this.array.length) {
            const row = Math.floor(this.currentIndex / itemsPerRow);
            const col = this.currentIndex % itemsPerRow;
            const x = startX + col * (boxWidth + spacing) + boxWidth / 2;
            const y = startY + row * (boxHeight + spacing * 2) - 20;
            
            this.ctx.save();
            this.ctx.fillStyle = this.colors.warning;
            this.ctx.font = '20px "Segoe UI", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('↓', x, y);
            this.ctx.restore();
        }
    }
    
    reset() {
        this.searchValue = null;
        this.foundIndex = -1;
        this.currentIndex = -1;
        this.elementsChecked = 0;
        this.array.forEach(element => element.state = 'default');
        this.updateStats();
        this.redraw();
    }
    
    updateStats() {
        document.getElementById('elements-checked').textContent = this.elementsChecked;
        document.getElementById('current-index').textContent = 
            this.currentIndex >= 0 ? this.currentIndex : '-';
    }
    
    showResult(found, index) {
        const resultElement = document.getElementById('search-result');
        const resultText = document.getElementById('result-text');
        
        if (found) {
            resultText.textContent = `Found at index ${index}!`;
            resultElement.className = 'search-result found';
        } else {
            resultText.textContent = 'Not found';
            resultElement.className = 'search-result not-found';
        }
        
        resultElement.style.display = 'block';
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    setSpeed(speed) {
        this.delay = Math.max(50, 1000 - (speed * 9));
    }
}