// Sorting Algorithm Visualizer
class SortingVisualizer extends VisualizerBase {
    constructor(canvasId) {
        super(canvasId);
        this.array = [];
        this.arraySize = 20;
        this.maxValue = 100;
        this.barWidth = 0;
        this.comparisons = 0;
        this.swaps = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.delay = 50;

        this.generateRandomArray();
    }

    // ✅ Generate Random Array
    generateRandomArray(size = this.arraySize) {
        const overlay = document.getElementById("empty-state");
        if (overlay) overlay.style.display = "none";

        if (this.resizeCanvas) this.resizeCanvas();

        this.array = [];
        this.arraySize = size;

        for (let i = 0; i < size; i++) {
            this.array.push({
                value: Math.floor(Math.random() * this.maxValue) + 1,
                state: "default",
            });
        }

        this.comparisons = 0;
        this.swaps = 0;
        this.updateStats();
        this.redraw();
        console.log(`✅ Array generated with ${size} elements.`);
    }

    // ✅ Generate Sorted Array (Normal / Reverse)
    generateSortedArray(reverse = false) {
        const overlay = document.getElementById("empty-state");
        if (overlay) overlay.style.display = "none";
        if (this.resizeCanvas) this.resizeCanvas();

        this.array = [];
        for (let i = 0; i < this.arraySize; i++) {
            const value = reverse
                ? this.maxValue - i * Math.floor(this.maxValue / this.arraySize)
                : (i + 1) * Math.floor(this.maxValue / this.arraySize);

            this.array.push({
                value: value,
                state: "default",
            });
        }

        this.comparisons = 0;
        this.swaps = 0;
        this.updateStats();
        this.redraw();
    }

    // ✅ Start Sorting Process
    async start(algorithm) {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        this.comparisons = 0;
        this.swaps = 0;

        // Reset all states
        this.array.forEach((item) => (item.state = "default"));

        switch (algorithm) {
            case "bubble":
                await this.bubbleSort();
                break;
            case "quick":
                await this.quickSort(0, this.array.length - 1);
                break;
            case "merge":
                await this.mergeSort(0, this.array.length - 1);
                break;
            case "insertion":
                await this.insertionSort();
                break;
            case "selection":
                await this.selectionSort();
                break;
        }

        // ✅ Sorting complete, show final array sorted
        this.isRunning = false;
        this.markAllSorted();
        this.redraw();
    }

    pause() {
        this.isPaused = !this.isPaused;
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
    }

    // ✅ Bubble Sort
    async bubbleSort() {
        for (let i = 0; i < this.array.length - 1; i++) {
            let swapped = false;

            for (let j = 0; j < this.array.length - i - 1; j++) {
                if (!this.isRunning) return;
                while (this.isPaused) {
                    await this.sleep(100);
                }

                this.array[j].state = "comparing";
                this.array[j + 1].state = "comparing";
                this.comparisons++;
                this.updateStats();
                this.redraw();
                await this.sleep(this.delay);

                if (this.array[j].value > this.array[j + 1].value) {
                    this.array[j].state = "swapping";
                    this.array[j + 1].state = "swapping";
                    this.swaps++;
                    this.updateStats();
                    this.redraw();
                    await this.sleep(this.delay);

                    [this.array[j], this.array[j + 1]] = [
                        this.array[j + 1],
                        this.array[j],
                    ];
                    swapped = true;
                }

                this.array[j].state = "default";
                this.array[j + 1].state = "default";
            }

            this.array[this.array.length - i - 1].state = "sorted";
            this.redraw();

            if (!swapped) break;
        }

        if (this.array.length > 0) {
            this.array[0].state = "sorted";
        }
    }

    // ✅ Quick Sort
    async quickSort(low, high) {
        if (low < high) {
            const pi = await this.partition(low, high);
            await this.quickSort(low, pi - 1);
            await this.quickSort(pi + 1, high);
        }

        for (let i = low; i <= high; i++) {
            if (i >= 0 && i < this.array.length) {
                this.array[i].state = "sorted";
            }
        }
    }

    async partition(low, high) {
        const pivot = this.array[high].value;
        this.array[high].state = "pivot";
        this.redraw();

        let i = low - 1;

        for (let j = low; j <= high - 1; j++) {
            if (!this.isRunning) return;
            while (this.isPaused) {
                await this.sleep(100);
            }

            this.array[j].state = "comparing";
            this.comparisons++;
            this.updateStats();
            this.redraw();
            await this.sleep(this.delay);

            if (this.array[j].value < pivot) {
                i++;
                if (i !== j) {
                    this.array[i].state = "swapping";
                    this.array[j].state = "swapping";
                    this.swaps++;
                    this.updateStats();
                    this.redraw();
                    await this.sleep(this.delay);
                    [this.array[i], this.array[j]] = [
                        this.array[j],
                        this.array[i],
                    ];
                }
            }

            this.array[j].state = "default";
            if (i >= 0) this.array[i].state = "default";
        }

        i++;
        if (i !== high) {
            this.array[i].state = "swapping";
            this.array[high].state = "swapping";
            this.swaps++;
            this.updateStats();
            this.redraw();
            await this.sleep(this.delay);
            [this.array[i], this.array[high]] = [
                this.array[high],
                this.array[i],
            ];
        }

        this.array[i].state = "sorted";
        this.redraw();
        return i;
    }

    // ✅ Insertion Sort
    async insertionSort() {
        for (let i = 1; i < this.array.length; i++) {
            if (!this.isRunning) return;
            while (this.isPaused) {
                await this.sleep(100);
            }

            const key = this.array[i];
            let j = i - 1;
            this.array[i].state = "comparing";
            this.redraw();

            while (j >= 0 && this.array[j].value > key.value) {
                if (!this.isRunning) return;
                while (this.isPaused) await this.sleep(100);

                this.array[j].state = "comparing";
                this.array[j + 1].state = "swapping";
                this.comparisons++;
                this.swaps++;
                this.updateStats();
                this.redraw();
                await this.sleep(this.delay);

                this.array[j + 1] = this.array[j];
                this.array[j].state = "default";
                j--;
            }

            this.array[j + 1] = key;
            this.array[j + 1].state = "sorted";
            for (let k = 0; k <= i; k++) {
                this.array[k].state = "sorted";
            }
            this.redraw();
        }
    }

    // ✅ Selection Sort
    async selectionSort() {
        for (let i = 0; i < this.array.length - 1; i++) {
            if (!this.isRunning) return;
            while (this.isPaused) await this.sleep(100);

            let minIdx = i;
            this.array[i].state = "comparing";

            for (let j = i + 1; j < this.array.length; j++) {
                if (!this.isRunning) return;
                while (this.isPaused) await this.sleep(100);

                this.array[j].state = "comparing";
                this.comparisons++;
                this.updateStats();
                this.redraw();
                await this.sleep(this.delay);

                if (this.array[j].value < this.array[minIdx].value) {
                    if (minIdx !== i) this.array[minIdx].state = "default";
                    minIdx = j;
                    this.array[minIdx].state = "pivot";
                } else {
                    this.array[j].state = "default";
                }
            }

            if (minIdx !== i) {
                this.array[i].state = "swapping";
                this.array[minIdx].state = "swapping";
                this.swaps++;
                this.updateStats();
                this.redraw();
                await this.sleep(this.delay);
                [this.array[i], this.array[minIdx]] = [
                    this.array[minIdx],
                    this.array[i],
                ];
            }

            this.array[i].state = "sorted";
            this.redraw();
        }

        if (this.array.length > 0) {
            this.array[this.array.length - 1].state = "sorted";
        }
    }

    // ✅ Redraw Bars
    redraw() {
        if (this.stopRedrawLoop) return;
        if (!this.array || !Array.isArray(this.array) || this.array.length === 0) {
            this.clear();
            this.drawBackground();
            return;
        }

        this.clear();
        this.drawBackground();

        const padding = 40;
        const availableWidth = this.width - 2 * padding;
        const availableHeight = this.height - 2 * padding;
        this.barWidth = availableWidth / this.array.length;
        const barSpacing = this.barWidth * 0.1;

        this.array.forEach((element, index) => {
            const barHeight =
                (element.value / this.maxValue) * availableHeight * 0.8;
            const x = padding + index * this.barWidth + barSpacing / 2;
            const y = this.height - padding - barHeight;
            const width = this.barWidth - barSpacing;

            let color;
            switch (element.state) {
                case "comparing":
                    color = this.colors.warning;
                    break;
                case "swapping":
                    color = this.colors.danger;
                    break;
                case "sorted":
                    color = this.colors.success;
                    break;
                case "pivot":
                    color = this.colors.secondary;
                    break;
                default:
                    color = this.colors.primary;
            }

            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, width, barHeight);

            if (element.state !== "default" && element.state !== "sorted") {
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = color;
                this.ctx.fillRect(x, y, width, barHeight);
                this.ctx.shadowBlur = 0;
            }

            if (this.array.length <= 30) {
                this.drawText(element.value.toString(), x + width / 2, y - 10, {
                    color: this.colors.light,
                    font: '12px "Segoe UI", sans-serif',
                });
            }
        });
    }

    updateStats() {
        document.getElementById("comparisons").textContent = this.comparisons;
        document.getElementById("swaps").textContent = this.swaps;
    }

// ✅ Keep bars visible after sorting
markAllSorted() {
    if (!this.array || this.array.length === 0) return;

    // Mark all as sorted
    this.array.forEach(el => el.state = 'sorted');
    this.isRunning = false;
    this.isPaused = false;

    // Redraw once and freeze frame
    this.redraw();

    // 🔒 Remove any automatic resize re‑draw that might clear canvas
    if (this.resizeCanvasBound) {
        window.removeEventListener('resize', this.resizeCanvasBound);
    }

    // 🔒 Disconnect further background clears
    this.stopRedrawLoop = true;
}

    // Utility
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    setSpeed(speed) {
        this.delay = Math.max(10, 1000 - speed * 10);
    }
}