/* === PUZZLE GAMES 2 (5) === */

// 1. NONOGRAM
class NonogramGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.size = 8;
        this.cellSize = 40;
        this.gridOx = 140;
        this.gridOy = 140;
        this.startTime = Date.now();
        this.won = false;
        this.mistakes = 0;

        // Generate a random solution with ~40% filled cells
        this.solution = Array.from({length: this.size}, () =>
            Array.from({length: this.size}, () => Math.random() < 0.4 ? 1 : 0)
        );
        // Ensure at least one filled cell in every row and column
        for (let r = 0; r < this.size; r++) {
            if (!this.solution[r].some(v => v)) this.solution[r][randInt(0, this.size - 1)] = 1;
        }
        for (let c = 0; c < this.size; c++) {
            if (!this.solution.some(row => row[c])) this.solution[randInt(0, this.size - 1)][c] = 1;
        }

        this.grid = Array.from({length: this.size}, () => Array(this.size).fill(0)); // 0=empty, 1=filled, 2=marked-x
        this.rowClues = this.computeClues(false);
        this.colClues = this.computeClues(true);

        this.hoverR = -1; this.hoverC = -1;

        this.listenClick(e => this.handleClick(e, false));
        this.listenMouse('contextmenu', e => { e.preventDefault(); this.handleClick(e, true); });
        this.listenMouse('mousemove', e => this.handleHover(e));

        this.ui.innerHTML = '<div style="color:#888;font-size:12px;text-align:center;padding:4px">Left click: fill | Right click: mark X</div>';
        this.loop();
    }

    computeClues(isCol) {
        const clues = [];
        for (let i = 0; i < this.size; i++) {
            const line = [];
            for (let j = 0; j < this.size; j++) {
                line.push(isCol ? this.solution[j][i] : this.solution[i][j]);
            }
            const groups = [];
            let count = 0;
            for (const v of line) {
                if (v) count++;
                else { if (count > 0) groups.push(count); count = 0; }
            }
            if (count > 0) groups.push(count);
            clues.push(groups.length ? groups : [0]);
        }
        return clues;
    }

    getCell(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const c = Math.floor((x - this.gridOx) / this.cellSize);
        const r = Math.floor((y - this.gridOy) / this.cellSize);
        if (r >= 0 && r < this.size && c >= 0 && c < this.size) return {r, c};
        return null;
    }

    handleHover(e) {
        const cell = this.getCell(e);
        if (cell) { this.hoverR = cell.r; this.hoverC = cell.c; }
        else { this.hoverR = -1; this.hoverC = -1; }
    }

    handleClick(e, rightClick) {
        if (this.won) return;
        const cell = this.getCell(e);
        if (!cell) return;
        const {r, c} = cell;

        if (rightClick) {
            // Toggle X mark
            this.grid[r][c] = this.grid[r][c] === 2 ? 0 : 2;
        } else {
            // Toggle fill
            this.grid[r][c] = this.grid[r][c] === 1 ? 0 : 1;
        }
        this.checkWin();
    }

    checkWin() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const filled = this.grid[r][c] === 1;
                if (filled !== (this.solution[r][c] === 1)) return;
            }
        }
        this.won = true;
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const score = Math.max(100, 1000 - elapsed * 5);
        this.setScore(score);
        this.endGame();
        this.showOverlay('Puzzle Solved!', `Time: ${elapsed}s | Score: ${score}`);
    }

    update() {}

    render() {
        this.clear('#0f0f1a');
        const {ctx, size, cellSize, gridOx, gridOy} = this;

        // Draw grid background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(gridOx - 2, gridOy - 2, size * cellSize + 4, size * cellSize + 4);

        // Draw cells
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const x = gridOx + c * cellSize, y = gridOy + r * cellSize;

                // Highlight row/col on hover
                if (r === this.hoverR || c === this.hoverC) {
                    ctx.fillStyle = 'rgba(100,100,255,0.08)';
                    ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                }

                if (this.grid[r][c] === 1) {
                    ctx.fillStyle = this.won ? '#4caf50' : '#7c4dff';
                    ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
                } else if (this.grid[r][c] === 2) {
                    ctx.strokeStyle = '#ff5555';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x + 8, y + 8); ctx.lineTo(x + cellSize - 8, y + cellSize - 8);
                    ctx.moveTo(x + cellSize - 8, y + 8); ctx.lineTo(x + 8, y + cellSize - 8);
                    ctx.stroke();
                }

                // Cell border
                ctx.strokeStyle = '#2a2a4e';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cellSize, cellSize);
            }
        }

        // Draw thicker lines every 4 cells
        ctx.strokeStyle = '#4a4a7e';
        ctx.lineWidth = 2;
        for (let i = 0; i <= size; i += 4) {
            ctx.beginPath();
            ctx.moveTo(gridOx + i * cellSize, gridOy);
            ctx.lineTo(gridOx + i * cellSize, gridOy + size * cellSize);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(gridOx, gridOy + i * cellSize);
            ctx.lineTo(gridOx + size * cellSize, gridOy + i * cellSize);
            ctx.stroke();
        }

        // Row clues
        for (let r = 0; r < size; r++) {
            const clue = this.rowClues[r].join(' ');
            const cy = gridOy + r * cellSize + cellSize / 2 + 5;
            this.text(clue, gridOx - 10, cy, 14, '#b0b0d0', 'right');
        }

        // Column clues
        for (let c = 0; c < size; c++) {
            const nums = this.colClues[c];
            const cx = gridOx + c * cellSize + cellSize / 2;
            for (let i = 0; i < nums.length; i++) {
                const cy = gridOy - 10 - (nums.length - 1 - i) * 16;
                this.text(nums[i], cx, cy, 14, '#b0b0d0');
            }
        }

        // Timer
        if (!this.won) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.text(`Time: ${elapsed}s`, this.canvas.width / 2, this.canvas.height - 15, 14, '#888');
        }

        this.text('NONOGRAM', this.canvas.width / 2, 22, 18, '#7c4dff');
    }
}

// 2. TOWER OF HANOI
class HanoiGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.numDisks = 5;
        this.pegs = [[], [], []];
        for (let i = this.numDisks; i >= 1; i--) this.pegs[0].push(i);
        this.moves = 0;
        this.selected = -1; // selected peg index
        this.won = false;
        this.animating = false;
        this.floatingDisk = null; // {disk, fromPeg, x, y}

        this.diskColors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6'];

        this.pegX = [175, 350, 525];
        this.pegBaseY = 380;
        this.diskHeight = 30;
        this.maxDiskWidth = 140;
        this.minDiskWidth = 40;

        this.listenClick(e => this.handleClick(e));
        this.ui.innerHTML = '';
        this.loop();
    }

    getPegAtX(clickX) {
        for (let i = 0; i < 3; i++) {
            if (Math.abs(clickX - this.pegX[i]) < 100) return i;
        }
        return -1;
    }

    handleClick(e) {
        if (this.won || this.animating) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const peg = this.getPegAtX(x);
        if (peg === -1) return;

        if (this.selected === -1) {
            // Select a peg (must have disks)
            if (this.pegs[peg].length > 0) {
                this.selected = peg;
            }
        } else {
            if (peg === this.selected) {
                // Deselect
                this.selected = -1;
            } else {
                // Try to move
                const disk = this.pegs[this.selected][this.pegs[this.selected].length - 1];
                const topDest = this.pegs[peg].length ? this.pegs[peg][this.pegs[peg].length - 1] : Infinity;
                if (disk < topDest) {
                    this.pegs[this.selected].pop();
                    this.pegs[peg].push(disk);
                    this.moves++;
                    this.selected = -1;
                    this.checkWin();
                } else {
                    // Invalid move - flash
                    this.selected = -1;
                }
            }
        }
    }

    checkWin() {
        if (this.pegs[2].length === this.numDisks) {
            this.won = true;
            const optimal = Math.pow(2, this.numDisks) - 1; // 31 for 5 disks
            const score = Math.max(0, 1000 - (this.moves - optimal) * 30);
            this.setScore(score);
            this.endGame();
            this.showOverlay('Tower Complete!', `Moves: ${this.moves} (optimal: ${optimal}) | Score: ${score}`);
        }
    }

    getDiskWidth(disk) {
        return this.minDiskWidth + (disk - 1) * ((this.maxDiskWidth - this.minDiskWidth) / (this.numDisks - 1));
    }

    update() {}

    render() {
        this.clear('#0f0f1a');
        const {ctx, pegX, pegBaseY, diskHeight} = this;

        // Title
        this.text('TOWER OF HANOI', this.canvas.width / 2, 30, 20, '#c87137');

        // Draw base
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.roundRect(50, pegBaseY, 600, 16, 6);
        ctx.fill();

        // Draw pegs
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(pegX[i] - 5, pegBaseY - this.numDisks * diskHeight - 30, 10, this.numDisks * diskHeight + 30);

            // Peg labels
            this.text(['A', 'B', 'C'][i], pegX[i], pegBaseY + 40, 16, '#888');

            // Highlight selected peg
            if (this.selected === i) {
                ctx.strokeStyle = '#ffd54f';
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(pegX[i] - 80, pegBaseY - this.numDisks * diskHeight - 40, 160, this.numDisks * diskHeight + 42);
                ctx.setLineDash([]);

                // Arrow above selected peg
                this.text('\u25BC', pegX[i], pegBaseY - this.numDisks * diskHeight - 50, 20, '#ffd54f');
            }
        }

        // Draw disks on pegs
        for (let p = 0; p < 3; p++) {
            for (let d = 0; d < this.pegs[p].length; d++) {
                const disk = this.pegs[p][d];
                const w = this.getDiskWidth(disk);
                const x = pegX[p] - w / 2;
                const y = pegBaseY - (d + 1) * diskHeight;
                ctx.fillStyle = this.diskColors[disk - 1];
                ctx.beginPath();
                ctx.roundRect(x, y + 2, w, diskHeight - 4, 8);
                ctx.fill();

                // Disk number
                this.text(disk, pegX[p], y + diskHeight / 2 + 5, 14, '#fff');

                // Glow on selected top disk
                if (this.selected === p && d === this.pegs[p].length - 1) {
                    ctx.shadowColor = '#ffd54f';
                    ctx.shadowBlur = 15;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }
        }

        // Moves counter
        this.text(`Moves: ${this.moves}`, this.canvas.width / 2, this.canvas.height - 30, 16);
        const optimal = Math.pow(2, this.numDisks) - 1;
        this.text(`Optimal: ${optimal}`, this.canvas.width / 2, this.canvas.height - 10, 12, '#666');
        this.text('Click a peg to select, click another to move', this.canvas.width / 2, 60, 13, '#555');
    }
}

// 3. PATTERN MATCH
class PatternMatchGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.level = 1;
        this.lives = 3;
        this.phase = 'show'; // 'show', 'input', 'feedback'
        this.gridSize = 3;
        this.colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];
        this.cellSize = 80;
        this.pattern = [];
        this.playerPattern = [];
        this.showTimer = 0;
        this.feedbackTimer = 0;
        this.feedbackCorrect = false;
        this.maxLevel = 20;

        this.generateLevel();
        this.listenClick(e => this.handleClick(e));
        this.ui.innerHTML = '';
        this.loop();
    }

    generateLevel() {
        this.gridSize = Math.min(6, 3 + Math.floor((this.level - 1) / 3));
        const numColors = Math.min(this.colors.length, 2 + Math.floor((this.level - 1) / 2));
        const available = this.colors.slice(0, numColors);

        // Number of cells to color = increases with level
        const totalCells = this.gridSize * this.gridSize;
        const numColored = Math.min(totalCells, Math.floor(totalCells * 0.3) + this.level);

        this.pattern = Array.from({length: this.gridSize}, () => Array(this.gridSize).fill(null));
        this.playerPattern = Array.from({length: this.gridSize}, () => Array(this.gridSize).fill(null));

        // Place colored cells
        const positions = [];
        for (let r = 0; r < this.gridSize; r++) for (let c = 0; c < this.gridSize; c++) positions.push({r, c});
        shuffle(positions);
        for (let i = 0; i < Math.min(numColored, positions.length); i++) {
            const {r, c} = positions[i];
            this.pattern[r][c] = randChoice(available);
        }

        this.phase = 'show';
        this.showTimer = Date.now();
        this.showDuration = Math.max(1200, 3000 - this.level * 150);
        this.cellSize = Math.min(80, Math.floor(360 / this.gridSize));
    }

    getGridOrigin() {
        const totalW = this.gridSize * this.cellSize;
        return {
            ox: (this.canvas.width - totalW) / 2,
            oy: (this.canvas.height - totalW) / 2 + 20
        };
    }

    getCell(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const {ox, oy} = this.getGridOrigin();
        const c = Math.floor((x - ox) / this.cellSize);
        const r = Math.floor((y - oy) / this.cellSize);
        if (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) return {r, c};
        return null;
    }

    handleClick(e) {
        if (this.phase !== 'input') return;
        const cell = this.getCell(e);
        if (!cell) return;

        const {r, c} = cell;
        if (this.pattern[r][c] === null) {
            // This cell should be empty, cycle sets it to null
            if (this.playerPattern[r][c] !== null) {
                this.playerPattern[r][c] = null;
            }
            return;
        }

        // Cycle through available colors
        const numColors = Math.min(this.colors.length, 2 + Math.floor((this.level - 1) / 2));
        const available = this.colors.slice(0, numColors);
        const current = this.playerPattern[r][c];
        if (current === null) {
            this.playerPattern[r][c] = available[0];
        } else {
            const idx = available.indexOf(current);
            if (idx === available.length - 1) {
                this.playerPattern[r][c] = null;
            } else {
                this.playerPattern[r][c] = available[idx + 1];
            }
        }
    }

    checkPattern() {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.pattern[r][c] !== this.playerPattern[r][c]) return false;
            }
        }
        return true;
    }

    update() {
        if (this.phase === 'show') {
            if (Date.now() - this.showTimer > this.showDuration) {
                this.phase = 'input';
                this.playerPattern = Array.from({length: this.gridSize}, () => Array(this.gridSize).fill(null));
            }
        } else if (this.phase === 'feedback') {
            if (Date.now() - this.feedbackTimer > 1200) {
                if (this.feedbackCorrect) {
                    this.level++;
                    if (this.level > this.maxLevel) {
                        this.setScore(this.score);
                        this.endGame();
                        this.showOverlay('All Patterns Mastered!', `Final Score: ${this.score}`);
                        return;
                    }
                    this.generateLevel();
                } else {
                    if (this.lives <= 0) {
                        this.endGame();
                        this.showOverlay('Game Over', `Level: ${this.level} | Score: ${this.score}`);
                        return;
                    }
                    this.generateLevel();
                }
            }
        }
    }

    submitPattern() {
        if (this.checkPattern()) {
            this.feedbackCorrect = true;
            const bonus = this.level * 50;
            this.score += bonus;
            this.setScore(this.score);
        } else {
            this.feedbackCorrect = false;
            this.lives--;
        }
        this.phase = 'feedback';
        this.feedbackTimer = Date.now();
    }

    render() {
        this.clear('#0f0f1a');
        const {ctx, gridSize, cellSize} = this;
        const {ox, oy} = this.getGridOrigin();

        // Title and info
        this.text('PATTERN MATCH', this.canvas.width / 2, 25, 18, '#3a8a5a');
        this.text(`Level: ${this.level}`, this.canvas.width / 2, 50, 15);
        // Lives
        let livesStr = '';
        for (let i = 0; i < this.lives; i++) livesStr += '\u2764 ';
        this.text(livesStr, this.canvas.width / 2, 72, 16, '#e74c3c');

        // Phase label
        if (this.phase === 'show') {
            const remaining = Math.max(0, Math.ceil((this.showDuration - (Date.now() - this.showTimer)) / 1000));
            this.text(`Memorize! ${remaining}s`, this.canvas.width / 2, oy - 15, 16, '#ffd54f');
        } else if (this.phase === 'input') {
            this.text('Reproduce the pattern! Click cells to color.', this.canvas.width / 2, oy - 30, 14, '#aaa');
            this.text('Click Submit when done', this.canvas.width / 2, oy - 12, 12, '#777');
        } else if (this.phase === 'feedback') {
            this.text(this.feedbackCorrect ? 'Correct!' : 'Wrong!', this.canvas.width / 2, oy - 15, 18, this.feedbackCorrect ? '#4caf50' : '#f44336');
        }

        // Determine which pattern to show
        const displayPattern = (this.phase === 'show' || (this.phase === 'feedback' && !this.feedbackCorrect))
            ? this.pattern : this.playerPattern;

        // Draw grid
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const x = ox + c * cellSize, y = oy + r * cellSize;
                const color = displayPattern[r][c];

                ctx.fillStyle = color || '#1a1a2e';
                ctx.beginPath();
                ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 6);
                ctx.fill();

                ctx.strokeStyle = '#2a2a4e';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cellSize, cellSize);
            }
        }

        // During feedback, show the correct pattern side by side if wrong
        if (this.phase === 'feedback' && !this.feedbackCorrect) {
            this.text('Correct pattern shown', this.canvas.width / 2, oy + gridSize * cellSize + 25, 13, '#f44336');
        }

        // Submit button (during input phase)
        if (this.phase === 'input') {
            const btnX = this.canvas.width / 2 - 60;
            const btnY = oy + gridSize * cellSize + 15;
            ctx.fillStyle = '#3a8a5a';
            ctx.beginPath();
            ctx.roundRect(btnX, btnY, 120, 36, 8);
            ctx.fill();
            this.text('Submit', this.canvas.width / 2, btnY + 24, 16, '#fff');

            // Check if click is on submit button - we need a separate listener
            if (!this._submitBound) {
                this._submitBound = true;
                this.listenClick(e => {
                    if (this.phase !== 'input') return;
                    const rect = this.canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left, y = e.clientY - rect.top;
                    const {ox: gox, oy: goy} = this.getGridOrigin();
                    const bx = this.canvas.width / 2 - 60;
                    const by = goy + this.gridSize * this.cellSize + 15;
                    if (x >= bx && x <= bx + 120 && y >= by && y <= by + 36) {
                        this.submitPattern();
                    }
                });
            }
        }

        // Score
        this.text(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height - 15, 14, '#888');
    }
}

// 4. JIGSAW LITE
class JigsawGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.gridSize = 4;
        this.tileSize = 120;
        this.ox = (this.canvas.width - this.gridSize * this.tileSize) / 2;
        this.oy = (this.canvas.height - this.gridSize * this.tileSize) / 2 + 10;
        this.moves = 0;
        this.won = false;
        this.selected = null; // {r, c}
        this.startTime = Date.now();

        // Generate art on offscreen canvas
        this.artCanvas = document.createElement('canvas');
        this.artCanvas.width = this.gridSize * this.tileSize;
        this.artCanvas.height = this.gridSize * this.tileSize;
        this.generateArt();

        // Create tile order: tiles[r][c] = original index
        this.tiles = [];
        const indices = [];
        for (let i = 0; i < this.gridSize * this.gridSize; i++) indices.push(i);

        // Shuffle until not solved
        do {
            shuffle(indices);
        } while (this.isSorted(indices));

        for (let r = 0; r < this.gridSize; r++) {
            this.tiles.push([]);
            for (let c = 0; c < this.gridSize; c++) {
                this.tiles[r].push(indices[r * this.gridSize + c]);
            }
        }

        this.listenClick(e => this.handleClick(e));
        this.ui.innerHTML = '';
        this.loop();
    }

    isSorted(arr) {
        for (let i = 0; i < arr.length; i++) if (arr[i] !== i) return false;
        return true;
    }

    generateArt() {
        const ctx = this.artCanvas.getContext('2d');
        const w = this.artCanvas.width, h = this.artCanvas.height;

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#1a0533');
        grad.addColorStop(0.3, '#2d1b69');
        grad.addColorStop(0.6, '#11998e');
        grad.addColorStop(1, '#38ef7d');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Geometric shapes
        const shapes = 15;
        for (let i = 0; i < shapes; i++) {
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.random() * 0.4;
            const cx = Math.random() * w;
            const cy = Math.random() * h;
            const size = 30 + Math.random() * 100;

            ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 60%)`;

            const shapeType = randInt(0, 3);
            if (shapeType === 0) {
                // Circle
                ctx.beginPath();
                ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (shapeType === 1) {
                // Triangle
                ctx.beginPath();
                ctx.moveTo(cx, cy - size / 2);
                ctx.lineTo(cx - size / 2, cy + size / 2);
                ctx.lineTo(cx + size / 2, cy + size / 2);
                ctx.closePath();
                ctx.fill();
            } else if (shapeType === 2) {
                // Star
                ctx.beginPath();
                for (let j = 0; j < 10; j++) {
                    const r = j % 2 === 0 ? size / 2 : size / 4;
                    const angle = (j * Math.PI) / 5 - Math.PI / 2;
                    if (j === 0) ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
                    else ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
                }
                ctx.closePath();
                ctx.fill();
            } else {
                // Diamond
                ctx.beginPath();
                ctx.moveTo(cx, cy - size / 2);
                ctx.lineTo(cx + size / 3, cy);
                ctx.lineTo(cx, cy + size / 2);
                ctx.lineTo(cx - size / 3, cy);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }

        // Concentric rings
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 6; i++) {
            ctx.strokeStyle = `hsl(${i * 60}, 80%, 70%)`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, 40 + i * 35, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    handleClick(e) {
        if (this.won) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const c = Math.floor((x - this.ox) / this.tileSize);
        const r = Math.floor((y - this.oy) / this.tileSize);

        if (r < 0 || r >= this.gridSize || c < 0 || c >= this.gridSize) {
            this.selected = null;
            return;
        }

        if (this.selected === null) {
            this.selected = {r, c};
        } else {
            // Swap tiles
            const {r: sr, c: sc} = this.selected;
            if (sr !== r || sc !== c) {
                const temp = this.tiles[r][c];
                this.tiles[r][c] = this.tiles[sr][sc];
                this.tiles[sr][sc] = temp;
                this.moves++;
                this.checkWin();
            }
            this.selected = null;
        }
    }

    checkWin() {
        let idx = 0;
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.tiles[r][c] !== idx) return;
                idx++;
            }
        }
        this.won = true;
        const score = Math.max(100, 1000 - this.moves * 15);
        this.setScore(score);
        this.endGame();
        this.showOverlay('Puzzle Complete!', `Moves: ${this.moves} | Score: ${score}`);
    }

    update() {}

    render() {
        this.clear('#0f0f1a');
        const {ctx, gridSize, tileSize, ox, oy} = this;

        this.text('JIGSAW LITE', this.canvas.width / 2, 22, 18, '#9b59b6');

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const tileIdx = this.tiles[r][c];
                const srcR = Math.floor(tileIdx / gridSize);
                const srcC = tileIdx % gridSize;

                const dx = ox + c * tileSize;
                const dy = oy + r * tileSize;

                // Draw tile from art canvas
                ctx.drawImage(
                    this.artCanvas,
                    srcC * tileSize, srcR * tileSize, tileSize, tileSize,
                    dx, dy, tileSize, tileSize
                );

                // Tile border
                ctx.strokeStyle = '#0f0f1a';
                ctx.lineWidth = 2;
                ctx.strokeRect(dx, dy, tileSize, tileSize);

                // Correct position indicator
                if (tileIdx === r * gridSize + c) {
                    ctx.strokeStyle = '#4caf5080';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(dx + 2, dy + 2, tileSize - 4, tileSize - 4);
                }

                // Tile number (small)
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(dx + 2, dy + 2, 20, 16);
                this.text(tileIdx + 1, dx + 12, dy + 14, 10, '#ddd');

                // Highlight selected
                if (this.selected && this.selected.r === r && this.selected.c === c) {
                    ctx.strokeStyle = '#ffd54f';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(dx + 1, dy + 1, tileSize - 2, tileSize - 2);
                    ctx.shadowColor = '#ffd54f';
                    ctx.shadowBlur = 10;
                    ctx.strokeRect(dx + 1, dy + 1, tileSize - 2, tileSize - 2);
                    ctx.shadowBlur = 0;
                }
            }
        }

        this.text(`Moves: ${this.moves}`, this.canvas.width / 2, oy + gridSize * tileSize + 25, 15);
        this.text('Click two tiles to swap them', this.canvas.width / 2, this.canvas.height - 15, 13, '#555');
    }
}

// 5. NUMBER LINK
class NumberLinkGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.level = 1;
        this.gridSize = 5;
        this.cellSize = 80;
        this.won = false;
        this.totalSolved = 0;

        this.pairColors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#9b59b6', '#1abc9c', '#e91e63'];

        this.generatePuzzle();
        this.drawing = false;
        this.currentPair = -1;
        this.hoverR = -1;
        this.hoverC = -1;

        this.listenClick(e => this.handleClick(e));
        this.listenMouse('mousemove', e => this.handleMove(e));
        this.ui.innerHTML = '';
        this.loop();
    }

    getGridOrigin() {
        const total = this.gridSize * this.cellSize;
        return {
            ox: (this.canvas.width - total) / 2,
            oy: (this.canvas.height - total) / 2 + 15
        };
    }

    generatePuzzle() {
        this.gridSize = Math.min(7, 5 + Math.floor((this.level - 1) / 3));
        this.cellSize = Math.min(80, Math.floor(420 / this.gridSize));

        const size = this.gridSize;
        this.numPairs = Math.min(this.pairColors.length, 2 + Math.floor(this.level / 2));

        // Generate puzzle by creating paths and then extracting endpoints
        this.grid = Array.from({length: size}, () => Array(size).fill(-1));
        this.paths = {}; // pairIndex -> [{r,c}, ...]
        this.endpoints = {}; // pairIndex -> [{r,c}, {r,c}]
        this.playerPaths = {};

        // Place pairs using random walk approach
        let placed = 0;
        let attempts = 0;
        const maxAttempts = 500;

        while (placed < this.numPairs && attempts < maxAttempts) {
            attempts++;
            // Try to place a path
            const pathLen = randInt(3, Math.min(8, size * 2));
            const startR = randInt(0, size - 1);
            const startC = randInt(0, size - 1);

            if (this.grid[startR][startC] !== -1) continue;

            const path = [{r: startR, c: startC}];
            this.grid[startR][startC] = placed;

            let cr = startR, cc = startC;
            let valid = true;

            for (let step = 1; step < pathLen; step++) {
                const dirs = shuffle([[-1,0],[1,0],[0,-1],[0,1]]);
                let moved = false;
                for (const [dr, dc] of dirs) {
                    const nr = cr + dr, nc = cc + dc;
                    if (nr >= 0 && nr < size && nc >= 0 && nc < size && this.grid[nr][nc] === -1) {
                        this.grid[nr][nc] = placed;
                        path.push({r: nr, c: nc});
                        cr = nr; cc = nc;
                        moved = true;
                        break;
                    }
                }
                if (!moved) break;
            }

            if (path.length >= 3) {
                this.endpoints[placed] = [path[0], path[path.length - 1]];
                this.paths[placed] = path;
                this.playerPaths[placed] = [];
                placed++;
            } else {
                // Undo
                for (const {r, c} of path) this.grid[r][c] = -1;
            }
        }

        // If we couldn't place enough, reduce
        this.numPairs = placed;

        // Clear grid for player (only show endpoints)
        this.playerGrid = Array.from({length: size}, () => Array(size).fill(-1));
        for (let p = 0; p < this.numPairs; p++) {
            for (const ep of this.endpoints[p]) {
                this.playerGrid[ep.r][ep.c] = p;
            }
            this.playerPaths[p] = [];
        }

        this.drawing = false;
        this.currentPair = -1;
    }

    getCell(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const {ox, oy} = this.getGridOrigin();
        const c = Math.floor((x - ox) / this.cellSize);
        const r = Math.floor((y - oy) / this.cellSize);
        if (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) return {r, c};
        return null;
    }

    handleMove(e) {
        const cell = this.getCell(e);
        if (cell) { this.hoverR = cell.r; this.hoverC = cell.c; }
        else { this.hoverR = -1; this.hoverC = -1; }

        if (this.drawing && cell) {
            const path = this.playerPaths[this.currentPair];
            const last = path[path.length - 1];

            // Must be adjacent to last cell in path
            const dr = Math.abs(cell.r - last.r), dc = Math.abs(cell.c - last.c);
            if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                // Check if backtracking
                if (path.length >= 2) {
                    const prev = path[path.length - 2];
                    if (prev.r === cell.r && prev.c === cell.c) {
                        // Undo last
                        const removed = path.pop();
                        this.playerGrid[removed.r][removed.c] = this.isEndpoint(removed.r, removed.c);
                        return;
                    }
                }

                // Check if cell is free or is the endpoint of current pair
                const occupied = this.playerGrid[cell.r][cell.c];
                const isOwnEndpoint = this.endpoints[this.currentPair].some(ep => ep.r === cell.r && ep.c === cell.c);

                if (occupied === -1 || isOwnEndpoint) {
                    path.push({r: cell.r, c: cell.c});
                    this.playerGrid[cell.r][cell.c] = this.currentPair;

                    // Check if we reached the other endpoint
                    const eps = this.endpoints[this.currentPair];
                    const otherEp = (path[0].r === eps[0].r && path[0].c === eps[0].c) ? eps[1] : eps[0];
                    if (cell.r === otherEp.r && cell.c === otherEp.c) {
                        this.drawing = false;
                        this.currentPair = -1;
                        this.checkAllConnected();
                    }
                }
            }
        }
    }

    isEndpoint(r, c) {
        for (let p = 0; p < this.numPairs; p++) {
            if (this.endpoints[p].some(ep => ep.r === r && ep.c === c)) return p;
        }
        return -1;
    }

    handleClick(e) {
        if (this.won) return;
        const cell = this.getCell(e);
        if (!cell) return;

        if (this.drawing) {
            // Cancel current drawing
            this.clearPath(this.currentPair);
            this.drawing = false;
            this.currentPair = -1;
            return;
        }

        // Check if clicked on an endpoint
        const epPair = this.isEndpoint(cell.r, cell.c);
        if (epPair >= 0) {
            // Clear existing path for this pair
            this.clearPath(epPair);
            // Start drawing from this endpoint
            this.currentPair = epPair;
            this.drawing = true;
            this.playerPaths[epPair] = [{r: cell.r, c: cell.c}];
            this.playerGrid[cell.r][cell.c] = epPair;
        }
    }

    clearPath(pair) {
        const path = this.playerPaths[pair];
        for (const {r, c} of path) {
            const isEp = this.endpoints[pair].some(ep => ep.r === r && ep.c === c);
            this.playerGrid[r][c] = isEp ? pair : -1;
        }
        this.playerPaths[pair] = [];
    }

    checkAllConnected() {
        for (let p = 0; p < this.numPairs; p++) {
            const path = this.playerPaths[p];
            if (path.length < 2) return false;
            const eps = this.endpoints[p];
            const first = path[0], last = path[path.length - 1];
            const startsAtEp = eps.some(ep => ep.r === first.r && ep.c === first.c);
            const endsAtEp = eps.some(ep => ep.r === last.r && ep.c === last.c);
            if (!startsAtEp || !endsAtEp) return false;
            // Make sure both endpoints are different
            if (first.r === last.r && first.c === last.c) return false;
        }

        // All pairs connected!
        this.totalSolved++;
        this.score += this.level * 100;
        this.setScore(this.score);
        this.level++;

        if (this.level > 12) {
            this.won = true;
            this.endGame();
            this.showOverlay('All Puzzles Solved!', `Score: ${this.score}`);
        } else {
            // Next puzzle after short delay
            this.addTimeout(() => this.generatePuzzle(), 800);
        }
        return true;
    }

    update() {}

    render() {
        this.clear('#0f0f1a');
        const {ctx, gridSize, cellSize} = this;
        const {ox, oy} = this.getGridOrigin();

        this.text('NUMBER LINK', this.canvas.width / 2, 22, 18, '#3a6a8a');
        this.text(`Level: ${this.level} | Score: ${this.score}`, this.canvas.width / 2, 46, 14, '#888');

        // Draw grid
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const x = ox + c * cellSize, y = oy + r * cellSize;

                // Cell background
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

                // Hover highlight
                if (r === this.hoverR && c === this.hoverC) {
                    ctx.fillStyle = 'rgba(100,100,200,0.15)';
                    ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                }

                // Grid lines
                ctx.strokeStyle = '#2a2a4e';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cellSize, cellSize);
            }
        }

        // Draw paths
        for (let p = 0; p < this.numPairs; p++) {
            const path = this.playerPaths[p];
            if (path.length >= 2) {
                ctx.strokeStyle = this.pairColors[p];
                ctx.lineWidth = cellSize * 0.35;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.moveTo(ox + path[0].c * cellSize + cellSize / 2, oy + path[0].r * cellSize + cellSize / 2);
                for (let i = 1; i < path.length; i++) {
                    ctx.lineTo(ox + path[i].c * cellSize + cellSize / 2, oy + path[i].r * cellSize + cellSize / 2);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }

        // Draw endpoints with numbers
        for (let p = 0; p < this.numPairs; p++) {
            for (const ep of this.endpoints[p]) {
                const cx = ox + ep.c * cellSize + cellSize / 2;
                const cy = oy + ep.r * cellSize + cellSize / 2;

                ctx.fillStyle = this.pairColors[p];
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.32, 0, Math.PI * 2);
                ctx.fill();

                // Glow if currently drawing this pair
                if (this.currentPair === p) {
                    ctx.shadowColor = this.pairColors[p];
                    ctx.shadowBlur = 12;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }

                this.text(p + 1, cx, cy + 6, Math.max(14, cellSize * 0.3), '#fff');
            }
        }

        // Instructions
        if (this.drawing) {
            this.text(`Drawing path for ${this.currentPair + 1} - move mouse along cells. Click to cancel.`,
                this.canvas.width / 2, this.canvas.height - 15, 12, '#aaa');
        } else {
            this.text('Click a number to start drawing a path', this.canvas.width / 2, this.canvas.height - 15, 13, '#555');
        }
    }
}

// Register puzzle2 games
Portal.register({id:'nonogram',name:'Nonogram',category:'puzzle',icon:'\ud83d\udcca',color:'linear-gradient(135deg,#2a1a4a,#5a3a8a)',Game:NonogramGame,canvasWidth:600,canvasHeight:600,tags:['grid','logic','picture']});
Portal.register({id:'hanoi',name:'Tower of Hanoi',category:'puzzle',icon:'\ud83d\uddfc',color:'linear-gradient(135deg,#4a2a1a,#8a5a3a)',Game:HanoiGame,canvasWidth:700,canvasHeight:500,tags:['classic','tower','disks']});
Portal.register({id:'patternmatch',name:'Pattern Match',category:'puzzle',icon:'\ud83c\udfad',color:'linear-gradient(135deg,#1a4a2a,#3a8a5a)',Game:PatternMatchGame,canvasWidth:600,canvasHeight:600,tags:['memory','colors','pattern']});
Portal.register({id:'jigsaw',name:'Jigsaw Lite',category:'puzzle',icon:'\ud83e\udde9',color:'linear-gradient(135deg,#3a1a3a,#6a3a6a)',Game:JigsawGame,canvasWidth:600,canvasHeight:600,tags:['jigsaw','swap','image']});
Portal.register({id:'numlink',name:'Number Link',category:'puzzle',icon:'\ud83d\udd17',color:'linear-gradient(135deg,#1a3a4a,#3a6a8a)',Game:NumberLinkGame,canvasWidth:600,canvasHeight:600,tags:['connect','paths','logic']});
