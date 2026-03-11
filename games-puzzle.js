/* === PUZZLE GAMES (8) === */

// 9. 2048
class Game2048 extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.grid = Array.from({length:4}, () => Array(4).fill(0));
        this.addTile(); this.addTile(); this.dead = false; this.won = false;
        this.listenKey(e => {
            if (this.dead) return;
            const dirs = {ArrowUp:0, ArrowRight:1, ArrowDown:2, ArrowLeft:3};
            if (dirs[e.key] !== undefined) { e.preventDefault(); this.move(dirs[e.key]); }
        });
        this.ui.innerHTML = ''; this.loop();
    }
    addTile() {
        const empty = [];
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!this.grid[r][c]) empty.push({r,c});
        if (empty.length) { const p = randChoice(empty); this.grid[p.r][p.c] = Math.random() < 0.9 ? 2 : 4; }
    }
    move(dir) {
        const g = this.grid; let moved = false;
        const rotate = (g, n) => { let r = g; for (let i = 0; i < n; i++) r = r[0].map((_, c) => r.map(row => row[c]).reverse()); return r; };
        let work = rotate(g, dir);
        for (let r = 0; r < 4; r++) {
            let row = work[r].filter(v => v);
            for (let i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i+1]) { row[i] *= 2; this.score += row[i]; row.splice(i+1, 1); }
            }
            const newRow = row.concat(Array(4 - row.length).fill(0));
            if (newRow.join() !== work[r].join()) moved = true;
            work[r] = newRow;
        }
        if (moved) {
            this.grid = rotate(work, (4 - dir) % 4);
            this.addTile(); this.setScore(this.score);
            if (!this.canMove()) { this.dead = true; this.endGame(); this.showOverlay('Game Over', `Score: ${this.score}`); }
        }
    }
    canMove() {
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
            if (!this.grid[r][c]) return true;
            if (c < 3 && this.grid[r][c] === this.grid[r][c+1]) return true;
            if (r < 3 && this.grid[r][c] === this.grid[r+1][c]) return true;
        }
        return false;
    }
    render() {
        const G = 100, pad = 10, ox = (this.canvas.width - 4*(G+pad)) / 2, oy = (this.canvas.height - 4*(G+pad)) / 2;
        this.clear('#0f0f1a');
        const {ctx} = this;
        ctx.fillStyle = '#1a1a2e'; ctx.fillRect(ox - pad, oy - pad, 4*(G+pad) + pad, 4*(G+pad) + pad);
        const colors = {0:'#2a2a3e',2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e'};
        const textColors = {0:'',2:'#776e65',4:'#776e65'};
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
            const v = this.grid[r][c], x = ox + c*(G+pad), y = oy + r*(G+pad);
            ctx.fillStyle = colors[v] || '#3c3a32';
            ctx.beginPath(); ctx.roundRect(x, y, G, G, 6); ctx.fill();
            if (v) {
                const fs = v >= 1000 ? 24 : v >= 100 ? 30 : 36;
                this.text(v, x + G/2, y + G/2 + fs/3, fs, textColors[v] || '#fff');
            }
        }
        this.text('Use arrow keys', this.canvas.width/2, this.canvas.height - 20, 14, '#555');
    }
}

// 10. MINESWEEPER
class MinesweeperGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.cols = 16; this.rows = 16; this.mines = 40;
        this.board = Array.from({length:this.rows}, () => Array.from({length:this.cols}, () => ({mine:false, revealed:false, flagged:false, count:0})));
        this.dead = false; this.won = false; this.firstClick = true; this.flagCount = 0;
        this.renderHTML(); this.ui.innerHTML = ''; // We'll use canvas
        this.G = Math.min(Math.floor(this.canvas.width / this.cols), Math.floor(this.canvas.height / this.rows));
        this.ox = (this.canvas.width - this.cols * this.G) / 2;
        this.oy = (this.canvas.height - this.rows * this.G) / 2;
        this.listenClick(e => { this.handleClick(e, false); });
        this.canvas.addEventListener('contextmenu', this._ctx = e => { e.preventDefault(); this.handleClick(e, true); });
        this.loop();
    }
    stop() { super.stop(); this.canvas.removeEventListener('contextmenu', this._ctx); }
    handleClick(e, rightClick) {
        if (this.dead || this.won) return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        const c = Math.floor((mx - this.ox) / this.G), r = Math.floor((my - this.oy) / this.G);
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return;
        const cell = this.board[r][c];
        if (rightClick) {
            if (!cell.revealed) { cell.flagged = !cell.flagged; this.flagCount += cell.flagged ? 1 : -1; }
            return;
        }
        if (cell.flagged || cell.revealed) return;
        if (this.firstClick) { this.placeMines(r, c); this.firstClick = false; }
        if (cell.mine) { this.revealAll(); this.dead = true; this.endGame(); this.showOverlay('BOOM!', `You hit a mine!`); return; }
        this.reveal(r, c);
        this.checkWin();
    }
    placeMines(safeR, safeC) {
        let placed = 0;
        while (placed < this.mines) {
            const r = randInt(0, this.rows-1), c = randInt(0, this.cols-1);
            if (Math.abs(r-safeR) <= 1 && Math.abs(c-safeC) <= 1) continue;
            if (this.board[r][c].mine) continue;
            this.board[r][c].mine = true; placed++;
        }
        for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
            if (this.board[r][c].mine) continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
                const nr = r+dr, nc = c+dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.board[nr][nc].mine) count++;
            }
            this.board[r][c].count = count;
        }
    }
    reveal(r, c) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;
        const cell = this.board[r][c];
        if (cell.revealed || cell.flagged || cell.mine) return;
        cell.revealed = true;
        if (cell.count === 0) {
            for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) this.reveal(r+dr, c+dc);
        }
    }
    revealAll() { for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) this.board[r][c].revealed = true; }
    checkWin() {
        let unrevealed = 0;
        for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (!this.board[r][c].revealed) unrevealed++;
        if (unrevealed === this.mines) {
            this.won = true; this.dead = true;
            this.setScore(1000);
            this.endGame(); this.showOverlay('You Win!', 'All mines found!');
        }
    }
    renderHTML() {}
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx, G, ox, oy} = this;
        const numColors = ['','#4fc3f7','#81c784','#e57373','#7c3aed','#ff9800','#06b6d4','#fff','#888'];
        for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
            const cell = this.board[r][c], x = ox + c*G, y = oy + r*G;
            if (cell.revealed) {
                ctx.fillStyle = cell.mine ? '#e94560' : '#1a1a2e';
                ctx.fillRect(x+1, y+1, G-2, G-2);
                if (cell.mine) { this.text('💣', x+G/2, y+G/2+5, G*0.5); }
                else if (cell.count) { this.text(cell.count, x+G/2, y+G/2+5, G*0.5, numColors[cell.count]); }
            } else {
                ctx.fillStyle = '#16213e'; ctx.fillRect(x+1, y+1, G-2, G-2);
                ctx.strokeStyle = '#2a3a5e'; ctx.strokeRect(x+1, y+1, G-2, G-2);
                if (cell.flagged) { this.text('🚩', x+G/2, y+G/2+5, G*0.4); }
            }
        }
        this.text(`Mines: ${this.mines - this.flagCount}`, this.canvas.width/2, 20, 16);
        this.text('Left click: reveal | Right click: flag', this.canvas.width/2, this.canvas.height - 10, 12, '#555');
    }
}

// 11. SUDOKU
class SudokuGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.selected = null; this.dead = false; this.startTime = Date.now();
        this.generate();
        this.G = Math.min(Math.floor(this.canvas.width / 9.5), Math.floor((this.canvas.height - 60) / 9.5));
        this.ox = (this.canvas.width - 9 * this.G) / 2;
        this.oy = 30;
        this.listenClick(e => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const c = Math.floor((mx - this.ox) / this.G), r = Math.floor((my - this.oy) / this.G);
            if (c >= 0 && c < 9 && r >= 0 && r < 9 && !this.given[r][c]) this.selected = {r, c};
            // Number buttons at bottom
            const by = this.oy + 9 * this.G + 15;
            if (my >= by && my <= by + 40) {
                const num = Math.floor((mx - this.ox) / (9 * this.G / 10)) + 1;
                if (num >= 1 && num <= 9 && this.selected) this.board[this.selected.r][this.selected.c] = num;
                if (num === 10 && this.selected) this.board[this.selected.r][this.selected.c] = 0; // Clear
                this.checkComplete();
            }
        });
        this.listenKey(e => {
            if (!this.selected) return;
            const n = parseInt(e.key);
            if (n >= 1 && n <= 9) { this.board[this.selected.r][this.selected.c] = n; this.checkComplete(); }
            if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') this.board[this.selected.r][this.selected.c] = 0;
            if (e.key === 'ArrowUp' && this.selected.r > 0) this.selected.r--;
            if (e.key === 'ArrowDown' && this.selected.r < 8) this.selected.r++;
            if (e.key === 'ArrowLeft' && this.selected.c > 0) this.selected.c--;
            if (e.key === 'ArrowRight' && this.selected.c < 8) this.selected.c++;
            e.preventDefault();
        });
        this.ui.innerHTML = ''; this.loop();
    }
    generate() {
        // Generate a solved board then remove numbers
        this.solution = Array.from({length:9}, () => Array(9).fill(0));
        this.solveSudoku(this.solution);
        this.board = this.solution.map(r => [...r]);
        this.given = Array.from({length:9}, () => Array(9).fill(false));
        // Remove numbers to create puzzle (easy: remove 40)
        let toRemove = 45;
        while (toRemove > 0) {
            const r = randInt(0,8), c = randInt(0,8);
            if (this.board[r][c]) { this.board[r][c] = 0; toRemove--; }
        }
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) this.given[r][c] = this.board[r][c] !== 0;
    }
    solveSudoku(board) {
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) {
                const nums = shuffle([1,2,3,4,5,6,7,8,9]);
                for (const n of nums) {
                    if (this.isValid(board, r, c, n)) {
                        board[r][c] = n;
                        if (this.solveSudoku(board)) return true;
                        board[r][c] = 0;
                    }
                }
                return false;
            }
        }
        return true;
    }
    isValid(board, r, c, n) {
        for (let i = 0; i < 9; i++) { if (board[r][i] === n || board[i][c] === n) return false; }
        const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
        for (let i = br; i < br+3; i++) for (let j = bc; j < bc+3; j++) if (board[i][j] === n) return false;
        return true;
    }
    checkComplete() {
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
            if (this.board[r][c] === 0 || this.board[r][c] !== this.solution[r][c]) return;
        }
        const time = Math.floor((Date.now() - this.startTime) / 1000);
        this.setScore(Math.max(100, 1000 - time));
        this.dead = true; this.endGame(); this.showOverlay('Solved!', `Time: ${Math.floor(time/60)}m ${time%60}s`);
    }
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx, G, ox, oy} = this;
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
            const x = ox + c*G, y = oy + r*G;
            const isSel = this.selected && this.selected.r === r && this.selected.c === c;
            ctx.fillStyle = isSel ? '#e94560' : '#16213e';
            ctx.fillRect(x+1, y+1, G-2, G-2);
            if (this.board[r][c]) {
                const wrong = !this.given[r][c] && this.board[r][c] !== this.solution[r][c];
                this.text(this.board[r][c], x+G/2, y+G/2+G*0.15, G*0.5,
                    this.given[r][c] ? '#4fc3f7' : wrong ? '#ff4444' : '#e0e0e0');
            }
        }
        // Grid lines
        ctx.strokeStyle = '#2a3a5e'; ctx.lineWidth = 1;
        for (let i = 0; i <= 9; i++) {
            ctx.lineWidth = i % 3 === 0 ? 3 : 1;
            ctx.strokeStyle = i % 3 === 0 ? '#e0e0e0' : '#2a3a5e';
            ctx.beginPath(); ctx.moveTo(ox, oy+i*G); ctx.lineTo(ox+9*G, oy+i*G); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ox+i*G, oy); ctx.lineTo(ox+i*G, oy+9*G); ctx.stroke();
        }
        // Number buttons
        const by = oy + 9*G + 15, bw = (9*G) / 10;
        for (let i = 1; i <= 9; i++) {
            const bx = ox + (i-1)*bw;
            ctx.fillStyle = '#16213e'; ctx.fillRect(bx+2, by, bw-4, 36);
            this.text(i, bx+bw/2, by+24, 20, '#4fc3f7');
        }
        // Timer
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.text(`${Math.floor(elapsed/60)}:${(elapsed%60).toString().padStart(2,'0')}`, this.canvas.width/2, this.canvas.height - 10, 14, '#666');
    }
}

// 12. MEMORY MATCH
class MemoryMatchGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.size = 4; this.pairs = (this.size * this.size) / 2;
        const icons = shuffle([...EMOJIS_MEMORY.slice(0, this.pairs), ...EMOJIS_MEMORY.slice(0, this.pairs)]);
        this.cards = icons.map((icon, i) => ({icon, flipped: false, matched: false, idx: i}));
        this.flippedCards = []; this.moves = 0; this.locked = false; this.matchedCount = 0;
        this.G = Math.min(Math.floor((this.canvas.width - 40) / this.size), Math.floor((this.canvas.height - 80) / this.size));
        this.ox = (this.canvas.width - this.size * this.G) / 2;
        this.oy = (this.canvas.height - this.size * this.G) / 2;
        this.listenClick(e => {
            if (this.locked) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const c = Math.floor((mx - this.ox) / this.G), r = Math.floor((my - this.oy) / this.G);
            if (c < 0 || c >= this.size || r < 0 || r >= this.size) return;
            const idx = r * this.size + c;
            const card = this.cards[idx];
            if (card.flipped || card.matched) return;
            card.flipped = true; this.flippedCards.push(card);
            if (this.flippedCards.length === 2) {
                this.moves++;
                if (this.flippedCards[0].icon === this.flippedCards[1].icon) {
                    this.flippedCards.forEach(c => c.matched = true);
                    this.matchedCount += 2;
                    this.flippedCards = [];
                    if (this.matchedCount === this.cards.length) {
                        this.setScore(Math.max(100, 1000 - this.moves * 20));
                        this.endGame(); this.showOverlay('You Win!', `${this.moves} moves`);
                    }
                } else {
                    this.locked = true;
                    this.addTimeout(() => { this.flippedCards.forEach(c => c.flipped = false); this.flippedCards = []; this.locked = false; }, 800);
                }
            }
        });
        this.ui.innerHTML = ''; this.loop();
    }
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx, G, ox, oy, size} = this;
        for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
            const card = this.cards[r * size + c];
            const x = ox + c*G + 4, y = oy + r*G + 4, w = G - 8, h = G - 8;
            if (card.matched) { ctx.fillStyle = '#1a2a1a'; ctx.globalAlpha = 0.4; }
            else if (card.flipped) { ctx.fillStyle = '#16213e'; ctx.globalAlpha = 1; }
            else { ctx.fillStyle = '#e94560'; ctx.globalAlpha = 1; }
            ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill();
            ctx.globalAlpha = 1;
            if (card.flipped || card.matched) { this.text(card.icon, x+w/2, y+h/2+G*0.12, G*0.4); }
            else { this.text('?', x+w/2, y+h/2+G*0.12, G*0.35, '#fff'); }
        }
        this.text(`Moves: ${this.moves}`, this.canvas.width/2, 25, 16);
    }
}

// 13. SLIDING PUZZLE (15 puzzle)
class SlidingPuzzleGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.size = 4; this.moves = 0;
        this.tiles = [...Array(15).keys()].map(i => i + 1).concat([0]);
        // Shuffle with valid solvable config
        do { shuffle(this.tiles); } while (!this.isSolvable());
        this.G = Math.min(Math.floor((this.canvas.width - 40) / this.size), Math.floor((this.canvas.height - 80) / this.size));
        this.ox = (this.canvas.width - this.size * this.G) / 2;
        this.oy = (this.canvas.height - this.size * this.G) / 2;
        this.listenClick(e => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const c = Math.floor((mx - this.ox) / this.G), r = Math.floor((my - this.oy) / this.G);
            if (c < 0 || c >= this.size || r < 0 || r >= this.size) return;
            const idx = r * this.size + c;
            const emptyIdx = this.tiles.indexOf(0);
            const er = Math.floor(emptyIdx / this.size), ec = emptyIdx % this.size;
            if ((Math.abs(r-er) === 1 && c === ec) || (Math.abs(c-ec) === 1 && r === er)) {
                [this.tiles[idx], this.tiles[emptyIdx]] = [this.tiles[emptyIdx], this.tiles[idx]];
                this.moves++;
                if (this.isSolved()) { this.setScore(Math.max(100, 2000 - this.moves * 10)); this.endGame(); this.showOverlay('Solved!', `${this.moves} moves`); }
            }
        });
        this.ui.innerHTML = ''; this.loop();
    }
    isSolvable() {
        let inv = 0;
        const arr = this.tiles.filter(t => t);
        for (let i = 0; i < arr.length; i++) for (let j = i+1; j < arr.length; j++) if (arr[i] > arr[j]) inv++;
        const emptyRow = Math.floor(this.tiles.indexOf(0) / this.size);
        return (this.size % 2 === 1) ? (inv % 2 === 0) : ((inv + emptyRow) % 2 === 1);
    }
    isSolved() { return this.tiles.every((t, i) => t === (i === 15 ? 0 : i + 1)); }
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx, G, ox, oy, size} = this;
        const colors = ['#e94560','#ff6b81','#ffa502','#ffd54f','#7bed9f','#70a1ff','#a29bfe','#fd79a8','#00cec9','#6c5ce7','#fdcb6e','#e17055','#00b894','#0984e3','#d63031'];
        for (let i = 0; i < this.tiles.length; i++) {
            const t = this.tiles[i]; if (!t) continue;
            const r = Math.floor(i / size), c = i % size;
            const x = ox + c*G + 3, y = oy + r*G + 3, w = G - 6, h = G - 6;
            ctx.fillStyle = colors[(t-1) % colors.length];
            ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.fill();
            this.text(t, x+w/2, y+h/2+G*0.12, G*0.35, '#fff');
        }
        this.text(`Moves: ${this.moves}`, this.canvas.width/2, 25, 16);
    }
}

// 14. COLOR FLOOD
class ColorFloodGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.size = 14; this.maxMoves = 25; this.moves = 0;
        this.colors = ['#e94560','#4fc3f7','#7bed9f','#ffd54f','#a29bfe','#ff9f43'];
        this.grid = Array.from({length:this.size}, () => Array.from({length:this.size}, () => randInt(0, 5)));
        this.G = Math.min(Math.floor((this.canvas.width - 40) / this.size), Math.floor((this.canvas.height - 120) / this.size));
        this.ox = (this.canvas.width - this.size * this.G) / 2;
        this.oy = 40;
        this.listenClick(e => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            // Check color buttons
            const by = this.oy + this.size * this.G + 20;
            const bw = 50;
            const bx0 = (this.canvas.width - 6 * bw) / 2;
            if (my >= by && my <= by + 40) {
                const ci = Math.floor((mx - bx0) / bw);
                if (ci >= 0 && ci < 6) this.flood(ci);
            }
        });
        this.ui.innerHTML = ''; this.loop();
    }
    flood(newColor) {
        const oldColor = this.grid[0][0];
        if (oldColor === newColor) return;
        this.moves++;
        const fill = (r, c) => {
            if (r < 0 || r >= this.size || c < 0 || c >= this.size) return;
            if (this.grid[r][c] !== oldColor) return;
            this.grid[r][c] = newColor;
            fill(r-1,c); fill(r+1,c); fill(r,c-1); fill(r,c+1);
        };
        fill(0, 0);
        // Check win
        if (this.grid.every(row => row.every(c => c === newColor))) {
            this.setScore(Math.max(100, (this.maxMoves - this.moves) * 50));
            this.endGame(); this.showOverlay('You Win!', `${this.moves} moves`);
        } else if (this.moves >= this.maxMoves) {
            this.endGame(); this.showOverlay('Out of Moves!', 'Try again');
        }
    }
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx, G, ox, oy, size} = this;
        for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
            ctx.fillStyle = this.colors[this.grid[r][c]];
            ctx.fillRect(ox + c*G, oy + r*G, G, G);
        }
        // Color buttons
        const by = oy + size * G + 20, bw = 50, bx0 = (this.canvas.width - 6*bw) / 2;
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = this.colors[i];
            ctx.beginPath(); ctx.roundRect(bx0 + i*bw + 4, by, bw-8, 36, 6); ctx.fill();
        }
        this.text(`Moves: ${this.moves}/${this.maxMoves}`, this.canvas.width/2, 25, 16);
    }
}

// 15. PIPE CONNECT
class PipeConnectGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.size = 7; this.dead = false;
        // Pipe types: 0=straight(|), 1=corner(L), 2=T, 3=cross(+)
        // Each has connections: top, right, bottom, left (booleans depending on rotation)
        this.pipeTypes = [
            {conns: [true,false,true,false]},   // straight |
            {conns: [true,true,false,false]},    // corner L
            {conns: [true,true,true,false]},     // T
            {conns: [true,true,true,true]},      // cross +
        ];
        this.grid = Array.from({length:this.size}, () => Array.from({length:this.size}, () => ({type: randInt(0,2), rot: randInt(0,3)})));
        // Set source and drain
        this.grid[0][0].type = 3; // cross at source
        this.grid[this.size-1][this.size-1].type = 3; // cross at drain
        this.G = Math.min(Math.floor((this.canvas.width - 40) / this.size), Math.floor((this.canvas.height - 80) / this.size));
        this.ox = (this.canvas.width - this.size * this.G) / 2;
        this.oy = (this.canvas.height - this.size * this.G) / 2;
        this.listenClick(e => {
            if (this.dead) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const c = Math.floor((mx - this.ox) / this.G), r = Math.floor((my - this.oy) / this.G);
            if (c >= 0 && c < this.size && r >= 0 && r < this.size) {
                this.grid[r][c].rot = (this.grid[r][c].rot + 1) % 4;
                if (this.checkConnected()) {
                    this.dead = true; this.setScore(500); this.endGame(); this.showOverlay('Connected!', 'Pipes are flowing!');
                }
            }
        });
        this.ui.innerHTML = ''; this.loop();
    }
    getConns(r, c) {
        const pipe = this.grid[r][c];
        const base = [...this.pipeTypes[pipe.type].conns];
        // Rotate connections
        for (let i = 0; i < pipe.rot; i++) base.unshift(base.pop());
        return base; // [top, right, bottom, left]
    }
    checkConnected() {
        // BFS from (0,0) to (size-1,size-1)
        const visited = Array.from({length:this.size}, () => Array(this.size).fill(false));
        const queue = [[0, 0]]; visited[0][0] = true;
        const dirs = [[-1,0,0,2],[0,1,1,3],[1,0,2,0],[0,-1,3,1]]; // [dr,dc,fromSide,toSide]
        while (queue.length) {
            const [r, c] = queue.shift();
            if (r === this.size-1 && c === this.size-1) return true;
            const conns = this.getConns(r, c);
            for (const [dr, dc, fromSide, toSide] of dirs) {
                const nr = r+dr, nc = c+dc;
                if (nr < 0 || nr >= this.size || nc < 0 || nc >= this.size || visited[nr][nc]) continue;
                if (conns[fromSide] && this.getConns(nr, nc)[toSide]) {
                    visited[nr][nc] = true; queue.push([nr, nc]);
                }
            }
        }
        return false;
    }
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx, G, ox, oy, size} = this;
        // Check which cells are connected from source for highlighting
        const connected = Array.from({length:size}, () => Array(size).fill(false));
        const queue = [[0,0]]; connected[0][0] = true;
        const dirs = [[-1,0,0,2],[0,1,1,3],[1,0,2,0],[0,-1,3,1]];
        while (queue.length) {
            const [r,c] = queue.shift();
            const conns = this.getConns(r,c);
            for (const [dr,dc,fs,ts] of dirs) {
                const nr=r+dr, nc=c+dc;
                if (nr<0||nr>=size||nc<0||nc>=size||connected[nr][nc]) continue;
                if (conns[fs] && this.getConns(nr,nc)[ts]) { connected[nr][nc]=true; queue.push([nr,nc]); }
            }
        }
        for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
            const x = ox + c*G, y = oy + r*G;
            ctx.fillStyle = '#16213e'; ctx.fillRect(x+2, y+2, G-4, G-4);
            const conns = this.getConns(r, c);
            const color = connected[r][c] ? '#4fc3f7' : '#555';
            ctx.strokeStyle = color; ctx.lineWidth = 4;
            const cx = x + G/2, cy = y + G/2;
            if (conns[0]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, y+2); ctx.stroke(); }
            if (conns[1]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x+G-2, cy); ctx.stroke(); }
            if (conns[2]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, y+G-2); ctx.stroke(); }
            if (conns[3]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x+2, cy); ctx.stroke(); }
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill();
        }
        // Source/drain labels
        this.text('S', ox + G/2, oy + G/2 + 4, 14, '#7bed9f');
        this.text('D', ox + (size-0.5)*G, oy + (size-0.5)*G + 4, 14, '#e94560');
        this.text('Click pipes to rotate | Connect S to D', this.canvas.width/2, this.canvas.height - 15, 13, '#555');
    }
}

// 16. LIGHTS OUT
class LightsOutGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.size = 5; this.moves = 0;
        this.grid = Array.from({length:this.size}, () => Array(this.size).fill(false));
        // Generate solvable puzzle by random clicks
        for (let i = 0; i < 10; i++) this.toggle(randInt(0,4), randInt(0,4), true);
        this.G = Math.min(Math.floor((this.canvas.width - 40) / this.size), Math.floor((this.canvas.height - 80) / this.size));
        this.ox = (this.canvas.width - this.size * this.G) / 2;
        this.oy = (this.canvas.height - this.size * this.G) / 2;
        this.listenClick(e => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const c = Math.floor((mx - this.ox) / this.G), r = Math.floor((my - this.oy) / this.G);
            if (c >= 0 && c < this.size && r >= 0 && r < this.size) {
                this.toggle(r, c, false); this.moves++;
                if (this.grid.every(row => row.every(c => !c))) {
                    this.setScore(Math.max(100, 500 - this.moves * 15));
                    this.endGame(); this.showOverlay('Lights Out!', `${this.moves} moves`);
                }
            }
        });
        this.ui.innerHTML = ''; this.loop();
    }
    toggle(r, c, silent) {
        const flip = (r, c) => { if (r >= 0 && r < this.size && c >= 0 && c < this.size) this.grid[r][c] = !this.grid[r][c]; };
        flip(r,c); flip(r-1,c); flip(r+1,c); flip(r,c-1); flip(r,c+1);
    }
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx, G, ox, oy, size} = this;
        for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
            const x = ox + c*G + 4, y = oy + r*G + 4, w = G - 8;
            ctx.fillStyle = this.grid[r][c] ? '#ffd54f' : '#1a1a2e';
            ctx.beginPath(); ctx.roundRect(x, y, w, w, 8); ctx.fill();
            if (this.grid[r][c]) { ctx.shadowColor = '#ffd54f'; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0; }
        }
        this.text(`Moves: ${this.moves}`, this.canvas.width/2, 25, 16);
        this.text('Turn all lights off!', this.canvas.width/2, this.canvas.height - 15, 13, '#555');
    }
}

// Register puzzle games
Portal.register({id:'2048',name:'2048',category:'puzzle',icon:'🔢',color:'linear-gradient(135deg,#8b6914,#ffd54f)',Game:Game2048,tags:['numbers','slide']});
Portal.register({id:'mines',name:'Minesweeper',category:'puzzle',icon:'💣',color:'linear-gradient(135deg,#1a3a1a,#4a6a4a)',Game:MinesweeperGame,tags:['classic','mine']});
Portal.register({id:'sudoku',name:'Sudoku',category:'puzzle',icon:'🔲',color:'linear-gradient(135deg,#1a1a4a,#3a3a8a)',Game:SudokuGame,canvasWidth:550,canvasHeight:700,tags:['numbers','logic']});
Portal.register({id:'memory',name:'Memory Match',category:'puzzle',icon:'🃏',color:'linear-gradient(135deg,#4a1a4a,#8a3a8a)',Game:MemoryMatchGame,tags:['cards','matching']});
Portal.register({id:'sliding',name:'Sliding Puzzle',category:'puzzle',icon:'🧩',color:'linear-gradient(135deg,#1a4a4a,#3a8a8a)',Game:SlidingPuzzleGame,tags:['15puzzle','slide']});
Portal.register({id:'flood',name:'Color Flood',category:'puzzle',icon:'🌊',color:'linear-gradient(135deg,#1a2a5a,#3a5aaa)',Game:ColorFloodGame,tags:['colors','flood']});
Portal.register({id:'pipes',name:'Pipe Connect',category:'puzzle',icon:'🔧',color:'linear-gradient(135deg,#2a3a1a,#5a7a3a)',Game:PipeConnectGame,tags:['connect','rotate']});
Portal.register({id:'lights',name:'Lights Out',category:'puzzle',icon:'💡',color:'linear-gradient(135deg,#4a4a0a,#8a8a2a)',Game:LightsOutGame,canvasWidth:500,canvasHeight:500,tags:['toggle','logic']});
