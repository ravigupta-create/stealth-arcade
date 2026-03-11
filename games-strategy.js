/* === STRATEGY GAMES (5) === */

// 22. CONNECT FOUR
class ConnectFourGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.cols = 7; this.rows = 6;
        this.board = Array.from({length:this.rows}, () => Array(this.cols).fill(0));
        this.turn = 1; this.dead = false; this.winner = 0; this.aiThinking = false;
        this.G = Math.min(Math.floor((this.canvas.width - 40) / this.cols), Math.floor((this.canvas.height - 80) / this.rows));
        this.ox = (this.canvas.width - this.cols * this.G) / 2;
        this.oy = (this.canvas.height - this.rows * this.G) / 2 + 20;
        this.hoverCol = -1;
        this.listenMouse('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            this.hoverCol = Math.floor((mx - this.ox) / this.G);
        });
        this.listenClick(e => {
            if (this.dead || this.turn !== 1 || this.aiThinking) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const col = Math.floor((mx - this.ox) / this.G);
            if (this.drop(col, 1)) {
                if (this.checkWin(1)) { this.winner = 1; this.dead = true; this.setScore(500); this.endGame(); this.showOverlay('You Win!', 'Connect Four!'); return; }
                if (this.isFull()) { this.dead = true; this.endGame(); this.showOverlay('Draw!', 'Board is full'); return; }
                this.turn = 2; this.aiThinking = true;
                this.addTimeout(() => this.aiMove(), 400);
            }
        });
        this.ui.innerHTML = ''; this.loop();
    }
    drop(col, player) {
        if (col < 0 || col >= this.cols || this.board[0][col]) return false;
        for (let r = this.rows - 1; r >= 0; r--) { if (!this.board[r][col]) { this.board[r][col] = player; return true; } }
        return false;
    }
    isFull() { return this.board[0].every(c => c); }
    checkWin(p) {
        for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
            if (this.board[r][c] !== p) continue;
            const dirs = [[0,1],[1,0],[1,1],[1,-1]];
            for (const [dr,dc] of dirs) {
                let count = 0;
                for (let i = 0; i < 4; i++) {
                    const nr = r+dr*i, nc = c+dc*i;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.board[nr][nc] === p) count++;
                    else break;
                }
                if (count === 4) return true;
            }
        }
        return false;
    }
    aiMove() {
        // Simple AI: check for win, block, then best position
        let bestCol = -1;
        // Try to win
        for (let c = 0; c < this.cols; c++) {
            if (this.board[0][c]) continue;
            const copy = this.board.map(r => [...r]);
            this.drop(c, 2);
            if (this.checkWin(2)) { this.board = copy; bestCol = c; break; }
            this.board = copy;
        }
        // Block player win
        if (bestCol === -1) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[0][c]) continue;
                const copy = this.board.map(r => [...r]);
                this.drop(c, 1);
                if (this.checkWin(1)) { this.board = copy; bestCol = c; break; }
                this.board = copy;
            }
        }
        // Prefer center
        if (bestCol === -1) {
            const order = [3,2,4,1,5,0,6];
            bestCol = order.find(c => !this.board[0][c]) ?? 0;
        }
        this.drop(bestCol, 2);
        this.aiThinking = false;
        if (this.checkWin(2)) { this.winner = 2; this.dead = true; this.endGame(); this.showOverlay('AI Wins!', 'Try again'); return; }
        if (this.isFull()) { this.dead = true; this.endGame(); this.showOverlay('Draw!', 'Board is full'); return; }
        this.turn = 1;
    }
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx, G, ox, oy, cols, rows} = this;
        // Board background
        ctx.fillStyle = '#0a2463'; ctx.beginPath(); ctx.roundRect(ox-8, oy-8, cols*G+16, rows*G+16, 12); ctx.fill();
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            const x = ox + c*G + G/2, y = oy + r*G + G/2;
            ctx.fillStyle = '#0f0f1a'; ctx.beginPath(); ctx.arc(x, y, G/2-6, 0, Math.PI*2); ctx.fill();
            if (this.board[r][c] === 1) { ctx.fillStyle = '#e94560'; ctx.beginPath(); ctx.arc(x, y, G/2-8, 0, Math.PI*2); ctx.fill(); }
            if (this.board[r][c] === 2) { ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(x, y, G/2-8, 0, Math.PI*2); ctx.fill(); }
        }
        // Hover indicator
        if (this.hoverCol >= 0 && this.hoverCol < cols && this.turn === 1 && !this.dead) {
            ctx.fillStyle = 'rgba(233,69,96,0.4)';
            ctx.beginPath(); ctx.arc(ox + this.hoverCol*G + G/2, oy - 20, G/3, 0, Math.PI*2); ctx.fill();
        }
        this.text(this.turn === 1 ? 'Your turn (Red)' : 'AI thinking...', this.canvas.width/2, 25, 16);
    }
}

// 23. CHECKERS
class CheckersGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.size = 8; this.selected = null; this.validMoves = []; this.dead = false;
        this.board = Array.from({length:8}, () => Array(8).fill(0));
        // Setup: 1=red(player), 2=black(AI), 3=red king, 4=black king
        for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) { if ((r+c) % 2 === 1) this.board[r][c] = 2; }
        for (let r = 5; r < 8; r++) for (let c = 0; c < 8; c++) { if ((r+c) % 2 === 1) this.board[r][c] = 1; }
        this.turn = 1; this.mustJump = false;
        this.G = Math.min(Math.floor((this.canvas.width - 40) / 8), Math.floor((this.canvas.height - 60) / 8));
        this.ox = (this.canvas.width - 8 * this.G) / 2; this.oy = 30;
        this.listenClick(e => {
            if (this.dead || this.turn !== 1) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const c = Math.floor((mx - this.ox) / this.G), r = Math.floor((my - this.oy) / this.G);
            if (c < 0 || c >= 8 || r < 0 || r >= 8) return;
            // If clicking a valid move
            const moveTarget = this.validMoves.find(m => m.r === r && m.c === c);
            if (moveTarget) {
                this.makeMove(this.selected, moveTarget);
                return;
            }
            // Select piece
            if (this.board[r][c] === 1 || this.board[r][c] === 3) {
                this.selected = {r, c};
                this.validMoves = this.getMoves(r, c);
            }
        });
        this.ui.innerHTML = ''; this.loop();
    }
    getMoves(r, c) {
        const piece = this.board[r][c]; if (!piece) return [];
        const isKing = piece >= 3;
        const player = piece <= 2 ? piece : piece - 2;
        const dirs = isKing ? [[-1,-1],[-1,1],[1,-1],[1,1]] : (player === 1 ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]);
        const moves = [], jumps = [];
        for (const [dr,dc] of dirs) {
            const nr = r+dr, nc = c+dc;
            if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) continue;
            if (!this.board[nr][nc]) moves.push({r:nr, c:nc, jump:false});
            else {
                const target = this.board[nr][nc]; const tp = target <= 2 ? target : target - 2;
                if (tp !== player) {
                    const jr = nr+dr, jc = nc+dc;
                    if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && !this.board[jr][jc]) {
                        jumps.push({r:jr, c:jc, jump:true, captR:nr, captC:nc});
                    }
                }
            }
        }
        // Must jump if available
        const allJumps = this.getAllJumps(player);
        if (allJumps.length > 0) return jumps;
        return jumps.length > 0 ? jumps : moves;
    }
    getAllJumps(player) {
        const jumps = [];
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            const p = this.board[r][c]; if (!p) continue;
            const pp = p <= 2 ? p : p - 2;
            if (pp !== player) continue;
            const pJumps = this.getMoves(r, c).filter(m => m.jump);
            jumps.push(...pJumps.map(m => ({from:{r,c}, to:m})));
        }
        return jumps;
    }
    makeMove(from, to) {
        this.board[to.r][to.c] = this.board[from.r][from.c];
        this.board[from.r][from.c] = 0;
        if (to.jump) this.board[to.captR][to.captC] = 0;
        // King promotion
        if (to.r === 0 && this.board[to.r][to.c] === 1) this.board[to.r][to.c] = 3;
        if (to.r === 7 && this.board[to.r][to.c] === 2) this.board[to.r][to.c] = 4;
        // Multi-jump
        if (to.jump) {
            const moreMoves = this.getMoves(to.r, to.c).filter(m => m.jump);
            if (moreMoves.length) { this.selected = {r:to.r, c:to.c}; this.validMoves = moreMoves; return; }
        }
        this.selected = null; this.validMoves = [];
        if (this.checkGameOver()) return;
        this.turn = this.turn === 1 ? 2 : 1;
        if (this.turn === 2) this.addTimeout(() => this.aiMove(), 500);
    }
    aiMove() {
        if (this.dead) return;
        const jumps = this.getAllJumps(2);
        let move;
        if (jumps.length) {
            move = randChoice(jumps);
        } else {
            const allMoves = [];
            for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
                const p = this.board[r][c]; if (!p) continue;
                const pp = p <= 2 ? p : p - 2;
                if (pp !== 2) continue;
                const moves = this.getMoves(r, c);
                moves.forEach(m => allMoves.push({from:{r,c}, to:m}));
            }
            if (!allMoves.length) { this.dead = true; this.setScore(1000); this.endGame(); this.showOverlay('You Win!', 'AI has no moves'); return; }
            move = randChoice(allMoves);
        }
        this.makeMove(move.from, move.to);
    }
    checkGameOver() {
        let red = 0, black = 0;
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            const p = this.board[r][c];
            if (p === 1 || p === 3) red++;
            if (p === 2 || p === 4) black++;
        }
        if (red === 0) { this.dead = true; this.endGame(); this.showOverlay('AI Wins!', 'No red pieces left'); return true; }
        if (black === 0) { this.dead = true; this.setScore(1000); this.endGame(); this.showOverlay('You Win!', 'All black pieces captured'); return true; }
        return false;
    }
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx, G, ox, oy} = this;
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            const x = ox+c*G, y = oy+r*G;
            ctx.fillStyle = (r+c)%2===0 ? '#f0d9b5' : '#b58863';
            ctx.fillRect(x, y, G, G);
            // Highlight
            if (this.selected && this.selected.r === r && this.selected.c === c) {
                ctx.fillStyle = 'rgba(233,69,96,0.4)'; ctx.fillRect(x, y, G, G);
            }
            if (this.validMoves.some(m => m.r === r && m.c === c)) {
                ctx.fillStyle = 'rgba(76,175,80,0.4)'; ctx.fillRect(x, y, G, G);
            }
            // Pieces
            const p = this.board[r][c];
            if (p) {
                ctx.fillStyle = (p===1||p===3) ? '#e94560' : '#333';
                ctx.beginPath(); ctx.arc(x+G/2, y+G/2, G/2-6, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = (p===1||p===3) ? '#ff8a9e' : '#666'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(x+G/2, y+G/2, G/2-6, 0, Math.PI*2); ctx.stroke();
                if (p >= 3) { this.text('K', x+G/2, y+G/2+6, G*0.3, '#ffd54f'); } // King
            }
        }
        this.text(this.turn === 1 ? 'Your turn (Red)' : 'AI thinking...', this.canvas.width/2, 20, 14);
    }
}

// 24. TIC TAC TOE
class TicTacToeGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.board = Array(9).fill(0); this.turn = 1; this.dead = false; this.winner = 0;
        this.G = Math.min(Math.floor((this.canvas.width - 80) / 3), Math.floor((this.canvas.height - 120) / 3));
        this.ox = (this.canvas.width - 3 * this.G) / 2;
        this.oy = (this.canvas.height - 3 * this.G) / 2;
        this.listenClick(e => {
            if (this.dead || this.turn !== 1) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const c = Math.floor((mx - this.ox) / this.G), r = Math.floor((my - this.oy) / this.G);
            if (c < 0 || c >= 3 || r < 0 || r >= 3) return;
            const idx = r * 3 + c;
            if (this.board[idx]) return;
            this.board[idx] = 1;
            if (this.check(1)) { this.dead = true; this.winner = 1; this.setScore(300); this.endGame(); this.showOverlay('You Win!', 'X wins!'); return; }
            if (this.board.every(c => c)) { this.dead = true; this.endGame(); this.showOverlay('Draw!', 'Good game'); return; }
            this.turn = 2;
            this.addTimeout(() => this.aiMove(), 300);
        });
        this.ui.innerHTML = ''; this.loop();
    }
    check(p) {
        const w = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        return w.some(line => line.every(i => this.board[i] === p));
    }
    aiMove() {
        // Minimax
        const minimax = (board, isMax, depth) => {
            if (this.checkBoard(board, 2)) return 10 - depth;
            if (this.checkBoard(board, 1)) return depth - 10;
            if (board.every(c => c)) return 0;
            let best = isMax ? -Infinity : Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i]) continue;
                board[i] = isMax ? 2 : 1;
                const score = minimax(board, !isMax, depth + 1);
                board[i] = 0;
                best = isMax ? Math.max(best, score) : Math.min(best, score);
            }
            return best;
        };
        let bestScore = -Infinity, bestMove = -1;
        for (let i = 0; i < 9; i++) {
            if (this.board[i]) continue;
            this.board[i] = 2;
            const score = minimax(this.board, false, 0);
            this.board[i] = 0;
            if (score > bestScore) { bestScore = score; bestMove = i; }
        }
        this.board[bestMove] = 2;
        if (this.check(2)) { this.dead = true; this.winner = 2; this.endGame(); this.showOverlay('AI Wins!', 'O wins'); return; }
        if (this.board.every(c => c)) { this.dead = true; this.endGame(); this.showOverlay('Draw!', 'Good game'); return; }
        this.turn = 1;
    }
    checkBoard(board, p) {
        const w = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        return w.some(line => line.every(i => board[i] === p));
    }
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx, G, ox, oy} = this;
        // Grid lines
        ctx.strokeStyle = '#333'; ctx.lineWidth = 3;
        for (let i = 1; i < 3; i++) {
            ctx.beginPath(); ctx.moveTo(ox + i*G, oy); ctx.lineTo(ox + i*G, oy + 3*G); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ox, oy + i*G); ctx.lineTo(ox + 3*G, oy + i*G); ctx.stroke();
        }
        // Pieces
        for (let i = 0; i < 9; i++) {
            const r = Math.floor(i/3), c = i%3;
            const cx = ox + c*G + G/2, cy = oy + r*G + G/2;
            if (this.board[i] === 1) { // X
                ctx.strokeStyle = '#e94560'; ctx.lineWidth = 4;
                const off = G/3;
                ctx.beginPath(); ctx.moveTo(cx-off,cy-off); ctx.lineTo(cx+off,cy+off); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx+off,cy-off); ctx.lineTo(cx-off,cy+off); ctx.stroke();
            } else if (this.board[i] === 2) { // O
                ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.arc(cx, cy, G/3, 0, Math.PI*2); ctx.stroke();
            }
        }
        this.text(this.dead ? '' : (this.turn===1 ? 'Your turn (X)' : 'AI thinking...'), this.canvas.width/2, 30, 16);
    }
}

// 25. REVERSI
class ReversiGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.board = Array.from({length:8}, () => Array(8).fill(0));
        this.board[3][3] = this.board[4][4] = 2; // White/AI
        this.board[3][4] = this.board[4][3] = 1; // Black/Player
        this.turn = 1; this.dead = false;
        this.G = Math.min(Math.floor((this.canvas.width - 40) / 8), Math.floor((this.canvas.height - 80) / 8));
        this.ox = (this.canvas.width - 8*this.G) / 2; this.oy = 40;
        this.listenClick(e => {
            if (this.dead || this.turn !== 1) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const c = Math.floor((mx - this.ox) / this.G), r = Math.floor((my - this.oy) / this.G);
            if (c < 0 || c >= 8 || r < 0 || r >= 8) return;
            if (this.makeMove(r, c, 1)) {
                this.turn = 2;
                if (!this.hasValidMoves(2)) {
                    if (!this.hasValidMoves(1)) { this.gameEnd(); return; }
                    this.turn = 1; return;
                }
                this.addTimeout(() => this.aiMove(), 400);
            }
        });
        this.ui.innerHTML = ''; this.loop();
    }
    getFlips(r, c, player) {
        if (this.board[r][c]) return [];
        const opp = player === 1 ? 2 : 1;
        const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        const allFlips = [];
        for (const [dr,dc] of dirs) {
            const flips = [];
            let nr = r+dr, nc = c+dc;
            while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && this.board[nr][nc] === opp) {
                flips.push({r:nr,c:nc}); nr += dr; nc += dc;
            }
            if (flips.length && nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && this.board[nr][nc] === player) {
                allFlips.push(...flips);
            }
        }
        return allFlips;
    }
    makeMove(r, c, player) {
        const flips = this.getFlips(r, c, player);
        if (!flips.length) return false;
        this.board[r][c] = player;
        flips.forEach(f => this.board[f.r][f.c] = player);
        return true;
    }
    hasValidMoves(player) {
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (this.getFlips(r, c, player).length) return true;
        return false;
    }
    aiMove() {
        if (this.dead) return;
        // Simple AI: maximize flips, prefer corners/edges
        const corners = [[0,0],[0,7],[7,0],[7,7]];
        const weights = Array.from({length:8}, (_,r) => Array.from({length:8}, (_,c) => {
            if (corners.some(([cr,cc]) => cr===r && cc===c)) return 100;
            if (r===0||r===7||c===0||c===7) return 10;
            return 1;
        }));
        let bestScore = -1, bestMove = null;
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            const flips = this.getFlips(r, c, 2);
            if (flips.length) {
                const score = flips.length * 2 + weights[r][c];
                if (score > bestScore) { bestScore = score; bestMove = {r, c}; }
            }
        }
        if (bestMove) this.makeMove(bestMove.r, bestMove.c, 2);
        this.turn = 1;
        if (!this.hasValidMoves(1)) {
            if (!this.hasValidMoves(2)) { this.gameEnd(); return; }
            this.turn = 2; this.addTimeout(() => this.aiMove(), 400);
        }
    }
    gameEnd() {
        this.dead = true;
        let p1 = 0, p2 = 0;
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { if (this.board[r][c]===1) p1++; if (this.board[r][c]===2) p2++; }
        this.setScore(p1 * 15);
        this.endGame();
        this.showOverlay(p1 > p2 ? 'You Win!' : p1 < p2 ? 'AI Wins!' : 'Draw!', `You: ${p1} | AI: ${p2}`);
    }
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx, G, ox, oy} = this;
        // Board
        ctx.fillStyle = '#1a5a2a'; ctx.fillRect(ox, oy, 8*G, 8*G);
        ctx.strokeStyle = '#0a3a1a'; ctx.lineWidth = 1;
        for (let i = 0; i <= 8; i++) {
            ctx.beginPath(); ctx.moveTo(ox+i*G, oy); ctx.lineTo(ox+i*G, oy+8*G); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ox, oy+i*G); ctx.lineTo(ox+8*G, oy+i*G); ctx.stroke();
        }
        // Valid moves
        if (this.turn === 1 && !this.dead) {
            for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
                if (this.getFlips(r, c, 1).length) {
                    ctx.fillStyle = 'rgba(255,255,255,0.15)';
                    ctx.beginPath(); ctx.arc(ox+c*G+G/2, oy+r*G+G/2, G/6, 0, Math.PI*2); ctx.fill();
                }
            }
        }
        // Pieces
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            if (!this.board[r][c]) continue;
            ctx.fillStyle = this.board[r][c] === 1 ? '#111' : '#eee';
            ctx.beginPath(); ctx.arc(ox+c*G+G/2, oy+r*G+G/2, G/2-5, 0, Math.PI*2); ctx.fill();
        }
        // Score
        let p1=0, p2=0;
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { if (this.board[r][c]===1) p1++; if (this.board[r][c]===2) p2++; }
        this.text(`Black: ${p1}`, ox + 60, 25, 16, '#e0e0e0');
        this.text(`White: ${p2}`, ox + 8*G - 60, 25, 16, '#e0e0e0');
    }
}

// 26. DOTS & BOXES
class DotsBoxesGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.size = 5; // 5x5 dots = 4x4 boxes
        this.boxes = this.size - 1;
        // Lines: horizontal[row][col], vertical[row][col]
        this.hLines = Array.from({length:this.size}, () => Array(this.boxes).fill(0));
        this.vLines = Array.from({length:this.boxes}, () => Array(this.size).fill(0));
        this.owners = Array.from({length:this.boxes}, () => Array(this.boxes).fill(0));
        this.turn = 1; this.dead = false; this.p1Score = 0; this.p2Score = 0;
        this.G = Math.min(Math.floor((this.canvas.width - 60) / this.boxes), Math.floor((this.canvas.height - 80) / this.boxes));
        this.ox = (this.canvas.width - this.boxes * this.G) / 2;
        this.oy = (this.canvas.height - this.boxes * this.G) / 2;
        this.listenClick(e => {
            if (this.dead || this.turn !== 1) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const line = this.getClosestLine(mx, my);
            if (line) this.placeLine(line, 1);
        });
        this.ui.innerHTML = ''; this.loop();
    }
    getClosestLine(mx, my) {
        let best = null, bestDist = 20;
        // Check horizontal lines
        for (let r = 0; r < this.size; r++) for (let c = 0; c < this.boxes; c++) {
            if (this.hLines[r][c]) continue;
            const x = this.ox + c*this.G + this.G/2, y = this.oy + r*this.G;
            const dist = Math.hypot(mx-x, my-y);
            if (dist < bestDist) { bestDist = dist; best = {type:'h', r, c}; }
        }
        // Check vertical lines
        for (let r = 0; r < this.boxes; r++) for (let c = 0; c < this.size; c++) {
            if (this.vLines[r][c]) continue;
            const x = this.ox + c*this.G, y = this.oy + r*this.G + this.G/2;
            const dist = Math.hypot(mx-x, my-y);
            if (dist < bestDist) { bestDist = dist; best = {type:'v', r, c}; }
        }
        return best;
    }
    placeLine(line, player) {
        if (line.type === 'h') this.hLines[line.r][line.c] = player;
        else this.vLines[line.r][line.c] = player;
        const completed = this.checkBoxes(player);
        if (this.isComplete()) {
            this.dead = true;
            this.setScore(this.p1Score * 100);
            this.endGame();
            this.showOverlay(this.p1Score > this.p2Score ? 'You Win!' : this.p1Score < this.p2Score ? 'AI Wins!' : 'Draw!',
                `You: ${this.p1Score} | AI: ${this.p2Score}`);
            return;
        }
        if (!completed) {
            this.turn = this.turn === 1 ? 2 : 1;
            if (this.turn === 2) this.addTimeout(() => this.aiMove(), 300);
        } else if (this.turn === 2) {
            this.addTimeout(() => this.aiMove(), 300);
        }
    }
    checkBoxes(player) {
        let completed = false;
        for (let r = 0; r < this.boxes; r++) for (let c = 0; c < this.boxes; c++) {
            if (this.owners[r][c]) continue;
            if (this.hLines[r][c] && this.hLines[r+1][c] && this.vLines[r][c] && this.vLines[r][c+1]) {
                this.owners[r][c] = player;
                if (player === 1) this.p1Score++; else this.p2Score++;
                completed = true;
            }
        }
        return completed;
    }
    isComplete() { return this.owners.every(row => row.every(c => c)); }
    aiMove() {
        if (this.dead) return;
        // Look for box-completing moves first
        const allLines = [];
        for (let r = 0; r < this.size; r++) for (let c = 0; c < this.boxes; c++) {
            if (!this.hLines[r][c]) allLines.push({type:'h', r, c});
        }
        for (let r = 0; r < this.boxes; r++) for (let c = 0; c < this.size; c++) {
            if (!this.vLines[r][c]) allLines.push({type:'v', r, c});
        }
        // Try completing a box
        for (const line of allLines) {
            const saved = line.type === 'h' ? this.hLines[line.r][line.c] : this.vLines[line.r][line.c];
            if (line.type === 'h') this.hLines[line.r][line.c] = 2; else this.vLines[line.r][line.c] = 2;
            let completes = false;
            for (let r = 0; r < this.boxes; r++) for (let c = 0; c < this.boxes; c++) {
                if (!this.owners[r][c] && this.hLines[r][c] && this.hLines[r+1][c] && this.vLines[r][c] && this.vLines[r][c+1]) completes = true;
            }
            if (line.type === 'h') this.hLines[line.r][line.c] = saved; else this.vLines[line.r][line.c] = saved;
            if (completes) { this.placeLine(line, 2); return; }
        }
        // Avoid giving boxes: pick line that doesn't give opponent a box
        const safe = allLines.filter(line => {
            if (line.type === 'h') this.hLines[line.r][line.c] = 2; else this.vLines[line.r][line.c] = 2;
            let gives = false;
            // Check if this creates 3 sides on any box
            for (let r = 0; r < this.boxes; r++) for (let c = 0; c < this.boxes; c++) {
                if (this.owners[r][c]) continue;
                const sides = (this.hLines[r][c]?1:0) + (this.hLines[r+1][c]?1:0) + (this.vLines[r][c]?1:0) + (this.vLines[r][c+1]?1:0);
                if (sides === 3) gives = true;
            }
            if (line.type === 'h') this.hLines[line.r][line.c] = 0; else this.vLines[line.r][line.c] = 0;
            return !gives;
        });
        const choice = safe.length ? randChoice(safe) : randChoice(allLines);
        if (choice) this.placeLine(choice, 2);
    }
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx, G, ox, oy, size, boxes} = this;
        // Boxes
        for (let r = 0; r < boxes; r++) for (let c = 0; c < boxes; c++) {
            if (this.owners[r][c]) {
                ctx.fillStyle = this.owners[r][c] === 1 ? 'rgba(233,69,96,0.3)' : 'rgba(79,195,247,0.3)';
                ctx.fillRect(ox+c*G+3, oy+r*G+3, G-6, G-6);
            }
        }
        // Lines
        ctx.lineWidth = 3;
        for (let r = 0; r < size; r++) for (let c = 0; c < boxes; c++) {
            ctx.strokeStyle = this.hLines[r][c] ? (this.hLines[r][c]===1 ? '#e94560' : '#4fc3f7') : '#2a2a4a';
            ctx.beginPath(); ctx.moveTo(ox+c*G, oy+r*G); ctx.lineTo(ox+(c+1)*G, oy+r*G); ctx.stroke();
        }
        for (let r = 0; r < boxes; r++) for (let c = 0; c < size; c++) {
            ctx.strokeStyle = this.vLines[r][c] ? (this.vLines[r][c]===1 ? '#e94560' : '#4fc3f7') : '#2a2a4a';
            ctx.beginPath(); ctx.moveTo(ox+c*G, oy+r*G); ctx.lineTo(ox+c*G, oy+(r+1)*G); ctx.stroke();
        }
        // Dots
        for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
            ctx.fillStyle = '#e0e0e0'; ctx.beginPath(); ctx.arc(ox+c*G, oy+r*G, 4, 0, Math.PI*2); ctx.fill();
        }
        this.text(`You: ${this.p1Score}`, 60, 25, 16, '#e94560');
        this.text(`AI: ${this.p2Score}`, this.canvas.width - 60, 25, 16, '#4fc3f7');
    }
}

// Register strategy games
Portal.register({id:'connect4',name:'Connect Four',category:'strategy',icon:'🔴',color:'linear-gradient(135deg,#0a1a5a,#1a3a8a)',Game:ConnectFourGame,tags:['board','classic']});
Portal.register({id:'checkers',name:'Checkers',category:'strategy',icon:'🏁',color:'linear-gradient(135deg,#3a2a1a,#6a4a2a)',Game:CheckersGame,tags:['board','classic']});
Portal.register({id:'tictactoe',name:'Tic Tac Toe',category:'strategy',icon:'❌',color:'linear-gradient(135deg,#2a1a3a,#5a3a6a)',Game:TicTacToeGame,canvasWidth:500,canvasHeight:500,tags:['classic','simple']});
Portal.register({id:'reversi',name:'Reversi',category:'strategy',icon:'⚫',color:'linear-gradient(135deg,#0a3a1a,#1a6a3a)',Game:ReversiGame,tags:['board','othello']});
Portal.register({id:'dotsboxes',name:'Dots & Boxes',category:'strategy',icon:'🔲',color:'linear-gradient(135deg,#1a2a3a,#3a5a6a)',Game:DotsBoxesGame,canvasWidth:600,canvasHeight:600,tags:['pen','paper']});
