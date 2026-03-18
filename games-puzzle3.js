/* === PUZZLE GAMES 3 (7) === */

// 1. MATCH 3
class Match3Game extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.cols = 8; this.rows = 8;
        this.cellSize = 56;
        this.ox = (this.canvas.width - this.cols * this.cellSize) / 2;
        this.oy = 60;
        this.gemColors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#e91e63','#00bcd4'];
        this.gemNames = ['ruby','sapphire','emerald','topaz','amethyst','rose','diamond'];
        this.grid = [];
        this.selected = null;
        this.swapping = null;
        this.falling = false;
        this.animating = false;
        this.combo = 0;
        this.particles = [];
        this.sparkles = [];
        this.timeLeft = 60;
        this.hoverR = -1; this.hoverC = -1;
        this.shakeTimer = 0;
        this.floatingTexts = [];

        // Initialize grid without matches
        this.initGrid();

        this.listenClick(e => this.handleClick(e));
        this.listenMouse('mousemove', e => this.handleHover(e));
        this.addInterval(() => {
            if (this.timeLeft > 0 && !this.animating) {
                this.timeLeft--;
                if (this.timeLeft <= 0) {
                    this.endGame();
                    this.showOverlay('Time Up!', `Score: ${this.score}`);
                }
            }
        }, 1000);

        // Sparkle effect
        this.addInterval(() => {
            if (this.sparkles.length < 8) {
                const r = randInt(0, this.rows - 1), c = randInt(0, this.cols - 1);
                this.sparkles.push({
                    x: this.ox + c * this.cellSize + randInt(5, this.cellSize - 5),
                    y: this.oy + r * this.cellSize + randInt(5, this.cellSize - 5),
                    life: 1, speed: 0.02 + Math.random() * 0.02
                });
            }
        }, 200);

        this.ui.innerHTML = '';
        this.loop();
    }

    initGrid() {
        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                let type;
                do {
                    type = randInt(0, this.gemColors.length - 1);
                } while (
                    (c >= 2 && this.grid[r][c-1] === type && this.grid[r][c-2] === type) ||
                    (r >= 2 && this.grid[r-1][c] === type && this.grid[r-2][c] === type)
                );
                this.grid[r][c] = type;
            }
        }
    }

    getCell(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        const c = Math.floor((x - this.ox) / this.cellSize);
        const r = Math.floor((y - this.oy) / this.cellSize);
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) return {r, c};
        return null;
    }

    handleHover(e) {
        const cell = this.getCell(e);
        if (cell) { this.hoverR = cell.r; this.hoverC = cell.c; }
        else { this.hoverR = -1; this.hoverC = -1; }
    }

    handleClick(e) {
        if (this.animating || this.timeLeft <= 0) return;
        const cell = this.getCell(e);
        if (!cell) return;

        if (!this.selected) {
            this.selected = cell;
        } else {
            const dr = Math.abs(cell.r - this.selected.r);
            const dc = Math.abs(cell.c - this.selected.c);
            if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                this.trySwap(this.selected, cell);
            } else {
                this.selected = cell;
            }
        }
    }

    trySwap(a, b) {
        // Swap
        const tmp = this.grid[a.r][a.c];
        this.grid[a.r][a.c] = this.grid[b.r][b.c];
        this.grid[b.r][b.c] = tmp;

        const matches = this.findMatches();
        if (matches.length > 0) {
            this.selected = null;
            this.combo = 0;
            this.resolveMatches(matches);
        } else {
            // Swap back
            this.grid[b.r][b.c] = this.grid[a.r][a.c];
            this.grid[a.r][a.c] = tmp;
            this.selected = null;
            this.shakeTimer = 10;
        }
    }

    findMatches() {
        const matched = new Set();
        // Check rows
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols - 2; c++) {
                if (this.grid[r][c] !== -1 &&
                    this.grid[r][c] === this.grid[r][c+1] &&
                    this.grid[r][c] === this.grid[r][c+2]) {
                    let end = c + 2;
                    while (end + 1 < this.cols && this.grid[r][end+1] === this.grid[r][c]) end++;
                    for (let i = c; i <= end; i++) matched.add(`${r},${i}`);
                }
            }
        }
        // Check cols
        for (let c = 0; c < this.cols; c++) {
            for (let r = 0; r < this.rows - 2; r++) {
                if (this.grid[r][c] !== -1 &&
                    this.grid[r][c] === this.grid[r+1][c] &&
                    this.grid[r][c] === this.grid[r+2][c]) {
                    let end = r + 2;
                    while (end + 1 < this.rows && this.grid[end+1][c] === this.grid[r][c]) end++;
                    for (let i = r; i <= end; i++) matched.add(`${i},${c}`);
                }
            }
        }
        return [...matched].map(s => { const [r,c] = s.split(',').map(Number); return {r,c}; });
    }

    resolveMatches(matches) {
        this.animating = true;
        this.combo++;

        // Create particles for each matched gem
        for (const m of matches) {
            const color = this.gemColors[this.grid[m.r][m.c]];
            const cx = this.ox + m.c * this.cellSize + this.cellSize / 2;
            const cy = this.oy + m.r * this.cellSize + this.cellSize / 2;
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.5;
                this.particles.push({
                    x: cx, y: cy,
                    vx: Math.cos(angle) * (2 + Math.random() * 3),
                    vy: Math.sin(angle) * (2 + Math.random() * 3),
                    color, life: 1, decay: 0.02 + Math.random() * 0.02,
                    size: 3 + Math.random() * 4
                });
            }
            this.grid[m.r][m.c] = -1;
        }

        const points = matches.length * 10 * this.combo;
        this.setScore(this.score + points);

        // Floating text
        if (matches.length > 0) {
            const avgX = matches.reduce((s, m) => s + this.ox + m.c * this.cellSize + this.cellSize/2, 0) / matches.length;
            const avgY = matches.reduce((s, m) => s + this.oy + m.r * this.cellSize + this.cellSize/2, 0) / matches.length;
            let txt = `+${points}`;
            if (this.combo > 1) txt += ` x${this.combo}`;
            this.floatingTexts.push({ x: avgX, y: avgY, text: txt, life: 1, color: this.combo > 2 ? '#ffeb3b' : '#fff' });
        }

        // Gravity + refill after short delay
        this.addTimeout(() => {
            this.applyGravity();
            this.addTimeout(() => {
                const newMatches = this.findMatches();
                if (newMatches.length > 0) {
                    this.resolveMatches(newMatches);
                } else {
                    this.animating = false;
                    // Check if any moves possible
                    if (!this.hasValidMoves()) {
                        this.shuffleBoard();
                    }
                }
            }, 200);
        }, 250);
    }

    applyGravity() {
        for (let c = 0; c < this.cols; c++) {
            let emptySlots = 0;
            for (let r = this.rows - 1; r >= 0; r--) {
                if (this.grid[r][c] === -1) {
                    emptySlots++;
                } else if (emptySlots > 0) {
                    this.grid[r + emptySlots][c] = this.grid[r][c];
                    this.grid[r][c] = -1;
                }
            }
            // Fill from top
            for (let r = 0; r < emptySlots; r++) {
                this.grid[r][c] = randInt(0, this.gemColors.length - 1);
            }
        }
    }

    hasValidMoves() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                // Try swap right
                if (c < this.cols - 1) {
                    [this.grid[r][c], this.grid[r][c+1]] = [this.grid[r][c+1], this.grid[r][c]];
                    if (this.findMatches().length > 0) {
                        [this.grid[r][c], this.grid[r][c+1]] = [this.grid[r][c+1], this.grid[r][c]];
                        return true;
                    }
                    [this.grid[r][c], this.grid[r][c+1]] = [this.grid[r][c+1], this.grid[r][c]];
                }
                // Try swap down
                if (r < this.rows - 1) {
                    [this.grid[r][c], this.grid[r+1][c]] = [this.grid[r+1][c], this.grid[r][c]];
                    if (this.findMatches().length > 0) {
                        [this.grid[r][c], this.grid[r+1][c]] = [this.grid[r+1][c], this.grid[r][c]];
                        return true;
                    }
                    [this.grid[r][c], this.grid[r+1][c]] = [this.grid[r+1][c], this.grid[r][c]];
                }
            }
        }
        return false;
    }

    shuffleBoard() {
        const vals = [];
        for (let r = 0; r < this.rows; r++)
            for (let c = 0; c < this.cols; c++)
                vals.push(this.grid[r][c]);
        shuffle(vals);
        let i = 0;
        for (let r = 0; r < this.rows; r++)
            for (let c = 0; c < this.cols; c++)
                this.grid[r][c] = vals[i++];
        // Remove any immediate matches
        const m = this.findMatches();
        if (m.length > 0) this.resolveMatches(m);
        if (!this.hasValidMoves()) this.shuffleBoard();
    }

    update() {
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= p.decay;
            return p.life > 0;
        });
        // Sparkles
        this.sparkles = this.sparkles.filter(s => {
            s.life -= s.speed;
            return s.life > 0;
        });
        // Floating texts
        this.floatingTexts = this.floatingTexts.filter(t => {
            t.y -= 1.2; t.life -= 0.025;
            return t.life > 0;
        });
        if (this.shakeTimer > 0) this.shakeTimer--;
    }

    render() {
        this.clear('#0a0a1e');
        const {ctx} = this;
        const shake = this.shakeTimer > 0 ? (Math.random() - 0.5) * 4 : 0;

        // Timer bar
        const barW = this.cols * this.cellSize;
        const barH = 8;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(this.ox, 20, barW, barH);
        const pct = this.timeLeft / 60;
        const timerColor = pct > 0.3 ? '#2ecc71' : pct > 0.15 ? '#f39c12' : '#e74c3c';
        ctx.fillStyle = timerColor;
        ctx.fillRect(this.ox, 20, barW * pct, barH);

        this.text(`Score: ${this.score}`, this.canvas.width / 2, 48, 18, '#ccc');
        this.text(`${this.timeLeft}s`, this.canvas.width - 40, 48, 16, timerColor);

        // Draw grid background
        ctx.fillStyle = '#151528';
        ctx.fillRect(this.ox - 4, this.oy - 4, this.cols * this.cellSize + 8, this.rows * this.cellSize + 8);

        // Draw gems
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = this.ox + c * this.cellSize + shake;
                const y = this.oy + r * this.cellSize;
                const gem = this.grid[r][c];

                // Cell background
                ctx.fillStyle = (r + c) % 2 === 0 ? '#1a1a30' : '#1e1e38';
                ctx.fillRect(x, y, this.cellSize, this.cellSize);

                if (gem === -1) continue;

                // Hover highlight
                if (r === this.hoverR && c === this.hoverC && !this.animating) {
                    ctx.fillStyle = 'rgba(255,255,255,0.08)';
                    ctx.fillRect(x, y, this.cellSize, this.cellSize);
                }

                // Selected highlight
                if (this.selected && this.selected.r === r && this.selected.c === c) {
                    ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    ctx.fillRect(x, y, this.cellSize, this.cellSize);
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
                }

                // Draw gem
                const cx = x + this.cellSize / 2;
                const cy = y + this.cellSize / 2;
                const gemR = this.cellSize * 0.38;
                const color = this.gemColors[gem];

                // Outer glow
                ctx.shadowColor = color;
                ctx.shadowBlur = 8;

                // Diamond shape
                ctx.beginPath();
                ctx.moveTo(cx, cy - gemR);
                ctx.lineTo(cx + gemR * 0.8, cy);
                ctx.lineTo(cx, cy + gemR);
                ctx.lineTo(cx - gemR * 0.8, cy);
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Inner highlight
                ctx.beginPath();
                ctx.moveTo(cx, cy - gemR * 0.5);
                ctx.lineTo(cx + gemR * 0.35, cy);
                ctx.lineTo(cx, cy + gemR * 0.3);
                ctx.lineTo(cx - gemR * 0.35, cy);
                ctx.closePath();
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fill();

                // Top shine
                ctx.beginPath();
                ctx.moveTo(cx - gemR * 0.3, cy - gemR * 0.5);
                ctx.lineTo(cx + gemR * 0.1, cy - gemR * 0.5);
                ctx.lineTo(cx, cy - gemR * 0.2);
                ctx.lineTo(cx - gemR * 0.2, cy - gemR * 0.2);
                ctx.closePath();
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fill();
            }
        }

        // Sparkles
        for (const s of this.sparkles) {
            ctx.globalAlpha = s.life;
            const sz = 3 * s.life;
            ctx.fillStyle = '#fff';
            // Cross shape sparkle
            ctx.fillRect(s.x - sz, s.y - 0.5, sz * 2, 1);
            ctx.fillRect(s.x - 0.5, s.y - sz, 1, sz * 2);
            ctx.globalAlpha = 1;
        }

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Floating texts
        for (const t of this.floatingTexts) {
            ctx.globalAlpha = t.life;
            this.text(t.text, t.x, t.y, 20 + (1 - t.life) * 8, t.color);
            ctx.globalAlpha = 1;
        }

        if (this.combo > 1 && this.animating) {
            ctx.globalAlpha = 0.8;
            this.text(`COMBO x${this.combo}!`, this.canvas.width / 2, this.canvas.height - 20, 22, '#ffeb3b');
            ctx.globalAlpha = 1;
        }
    }
}

// 2. BUBBLE SHOOTER
class BubbleShootGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.W = this.canvas.width;
        this.H = this.canvas.height;
        this.bubbleR = 18;
        this.colors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#e91e63'];
        this.rows = 8;
        this.cols = Math.floor(this.W / (this.bubbleR * 2));
        this.gridOx = (this.W - this.cols * this.bubbleR * 2) / 2 + this.bubbleR;
        this.gridOy = 60;
        this.grid = []; // grid[r][c] = colorIndex or -1
        this.aimAngle = -Math.PI / 2;
        this.shooterX = this.W / 2;
        this.shooterY = this.H - 50;
        this.currentBubble = randInt(0, this.colors.length - 1);
        this.nextBubble = randInt(0, this.colors.length - 1);
        this.flyingBubble = null;
        this.particles = [];
        this.fallingBubbles = [];
        this.ceilingOffset = 0;
        this.shotsUntilDrop = 8;
        this.shotCount = 0;
        this.gameOver = false;
        this.popAnimations = [];

        // Initialize grid
        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c] = randInt(0, this.colors.length - 1);
            }
        }
        // Leave bottom rows empty
        for (let r = this.rows - 2; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c] = -1;
            }
        }

        this.listenMouse('mousemove', e => {
            if (this.gameOver || this.flyingBubble) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.W / rect.width);
            const my = (e.clientY - rect.top) * (this.H / rect.height);
            this.aimAngle = Math.atan2(my - this.shooterY, mx - this.shooterX);
            // Clamp angle
            if (this.aimAngle > -0.15) this.aimAngle = -0.15;
            if (this.aimAngle < -Math.PI + 0.15) this.aimAngle = -Math.PI + 0.15;
        });

        this.listenClick(e => {
            if (this.gameOver || this.flyingBubble) return;
            this.shoot();
        });

        this.ui.innerHTML = '';
        this.loop();
    }

    getBubblePos(r, c) {
        const d = this.bubbleR * 2;
        const offset = (r % 2 === 1) ? this.bubbleR : 0;
        return {
            x: this.gridOx + c * d + offset,
            y: this.gridOy + r * d * 0.86 + this.ceilingOffset
        };
    }

    shoot() {
        const speed = 12;
        this.flyingBubble = {
            x: this.shooterX,
            y: this.shooterY,
            vx: Math.cos(this.aimAngle) * speed,
            vy: Math.sin(this.aimAngle) * speed,
            color: this.currentBubble
        };
        this.currentBubble = this.nextBubble;
        this.nextBubble = randInt(0, this.colors.length - 1);
        this.shotCount++;
    }

    snapToGrid(bx, by) {
        let bestR = 0, bestC = 0, bestDist = Infinity;
        const maxR = this.grid.length + 1;
        for (let r = 0; r < maxR; r++) {
            const colCount = (r % 2 === 1) ? this.cols - 1 : this.cols;
            for (let c = 0; c < colCount; c++) {
                if (r < this.grid.length && this.grid[r] && this.grid[r][c] !== undefined && this.grid[r][c] !== -1) continue;
                const pos = this.getBubblePos(r, c);
                const dist = Math.hypot(bx - pos.x, by - pos.y);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestR = r; bestC = c;
                }
            }
        }
        return { r: bestR, c: bestC };
    }

    findConnected(r, c, color) {
        const visited = new Set();
        const queue = [{r, c}];
        visited.add(`${r},${c}`);
        while (queue.length > 0) {
            const {r: cr, c: cc} = queue.shift();
            const neighbors = this.getNeighbors(cr, cc);
            for (const n of neighbors) {
                const key = `${n.r},${n.c}`;
                if (visited.has(key)) continue;
                if (n.r < 0 || n.r >= this.grid.length) continue;
                if (n.c < 0 || n.c >= ((n.r % 2 === 1) ? this.cols - 1 : this.cols)) continue;
                if (this.grid[n.r][n.c] !== color) continue;
                visited.add(key);
                queue.push(n);
            }
        }
        return visited;
    }

    getNeighbors(r, c) {
        const even = r % 2 === 0;
        if (even) {
            return [
                {r:r-1,c:c-1},{r:r-1,c:c},
                {r:r,c:c-1},{r:r,c:c+1},
                {r:r+1,c:c-1},{r:r+1,c:c}
            ];
        } else {
            return [
                {r:r-1,c:c},{r:r-1,c:c+1},
                {r:r,c:c-1},{r:r,c:c+1},
                {r:r+1,c:c},{r:r+1,c:c+1}
            ];
        }
    }

    findFloating() {
        // Find all bubbles connected to the ceiling (row 0)
        const attached = new Set();
        const queue = [];
        for (let c = 0; c < this.cols; c++) {
            if (this.grid[0] && this.grid[0][c] !== -1) {
                attached.add(`0,${c}`);
                queue.push({r: 0, c});
            }
        }
        while (queue.length > 0) {
            const {r, c} = queue.shift();
            const neighbors = this.getNeighbors(r, c);
            for (const n of neighbors) {
                const key = `${n.r},${n.c}`;
                if (attached.has(key)) continue;
                if (n.r < 0 || n.r >= this.grid.length) continue;
                if (n.c < 0 || n.c >= ((n.r % 2 === 1) ? this.cols - 1 : this.cols)) continue;
                if (this.grid[n.r][n.c] === -1) continue;
                attached.add(key);
                queue.push(n);
            }
        }
        // Find all non-attached bubbles
        const floating = [];
        for (let r = 0; r < this.grid.length; r++) {
            const colCount = (r % 2 === 1) ? this.cols - 1 : this.cols;
            for (let c = 0; c < colCount; c++) {
                if (this.grid[r][c] !== -1 && !attached.has(`${r},${c}`)) {
                    floating.push({r, c, color: this.grid[r][c]});
                }
            }
        }
        return floating;
    }

    popBubbles(cells) {
        for (const key of cells) {
            const [r, c] = key.split(',').map(Number);
            const pos = this.getBubblePos(r, c);
            const color = this.colors[this.grid[r][c]];
            // Particles
            for (let i = 0; i < 6; i++) {
                const angle = Math.random() * Math.PI * 2;
                this.particles.push({
                    x: pos.x, y: pos.y,
                    vx: Math.cos(angle) * (2 + Math.random() * 3),
                    vy: Math.sin(angle) * (2 + Math.random() * 3),
                    color, life: 1, size: 3 + Math.random() * 3
                });
            }
            this.popAnimations.push({ x: pos.x, y: pos.y, life: 1, color });
            this.grid[r][c] = -1;
        }
    }

    dropCeiling() {
        this.ceilingOffset += this.bubbleR * 2 * 0.86;
        // Check game over - if any bubble is too low
        for (let r = 0; r < this.grid.length; r++) {
            const colCount = (r % 2 === 1) ? this.cols - 1 : this.cols;
            for (let c = 0; c < colCount; c++) {
                if (this.grid[r][c] !== -1) {
                    const pos = this.getBubblePos(r, c);
                    if (pos.y + this.bubbleR >= this.shooterY - 30) {
                        this.gameOver = true;
                        this.endGame();
                        this.showOverlay('Game Over!', `Score: ${this.score}`);
                        return;
                    }
                }
            }
        }
    }

    update() {
        // Update flying bubble
        if (this.flyingBubble) {
            const fb = this.flyingBubble;
            fb.x += fb.vx;
            fb.y += fb.vy;

            // Wall bounce
            if (fb.x - this.bubbleR <= 0 || fb.x + this.bubbleR >= this.W) {
                fb.vx *= -1;
                fb.x = Math.max(this.bubbleR, Math.min(this.W - this.bubbleR, fb.x));
            }

            // Check ceiling
            if (fb.y - this.bubbleR <= this.gridOy + this.ceilingOffset) {
                this.landBubble(fb);
                return;
            }

            // Check collision with grid bubbles
            for (let r = 0; r < this.grid.length; r++) {
                const colCount = (r % 2 === 1) ? this.cols - 1 : this.cols;
                for (let c = 0; c < colCount; c++) {
                    if (this.grid[r][c] === -1) continue;
                    const pos = this.getBubblePos(r, c);
                    const dist = Math.hypot(fb.x - pos.x, fb.y - pos.y);
                    if (dist < this.bubbleR * 1.9) {
                        this.landBubble(fb);
                        return;
                    }
                }
            }

            // Off top
            if (fb.y < -50) {
                this.flyingBubble = null;
            }
        }

        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.025;
            return p.life > 0;
        });

        // Falling bubbles
        this.fallingBubbles = this.fallingBubbles.filter(b => {
            b.x += b.vx; b.y += b.vy; b.vy += 0.3; b.life -= 0.02;
            return b.life > 0 && b.y < this.H + 50;
        });

        // Pop animations
        this.popAnimations = this.popAnimations.filter(p => {
            p.life -= 0.05;
            return p.life > 0;
        });
    }

    landBubble(fb) {
        const snap = this.snapToGrid(fb.x, fb.y);
        // Ensure grid row exists
        while (this.grid.length <= snap.r) {
            const colCount = (this.grid.length % 2 === 1) ? this.cols - 1 : this.cols;
            this.grid.push(Array(colCount).fill(-1));
        }
        this.grid[snap.r][snap.c] = fb.color;
        this.flyingBubble = null;

        // Check matches
        const connected = this.findConnected(snap.r, snap.c, fb.color);
        if (connected.size >= 3) {
            const points = connected.size * 10;
            this.setScore(this.score + points);
            this.popBubbles(connected);

            // Check floating
            const floating = this.findFloating();
            for (const f of floating) {
                const pos = this.getBubblePos(f.r, f.c);
                this.fallingBubbles.push({
                    x: pos.x, y: pos.y,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -2 + Math.random() * 2,
                    color: this.colors[f.color], life: 1
                });
                this.grid[f.r][f.c] = -1;
                this.setScore(this.score + 5);
            }
        }

        // Check for ceiling drop
        if (this.shotCount % this.shotsUntilDrop === 0) {
            this.dropCeiling();
        }

        // Check if all bubbles cleared
        let anyLeft = false;
        for (let r = 0; r < this.grid.length; r++) {
            const colCount = (r % 2 === 1) ? this.cols - 1 : this.cols;
            for (let c = 0; c < colCount; c++) {
                if (this.grid[r][c] !== -1) { anyLeft = true; break; }
            }
            if (anyLeft) break;
        }
        if (!anyLeft) {
            this.setScore(this.score + 500);
            this.gameOver = true;
            this.endGame();
            this.showOverlay('You Win!', `Score: ${this.score}`);
        }

        // Check game over
        const pos = this.getBubblePos(snap.r, snap.c);
        if (pos.y + this.bubbleR >= this.shooterY - 30) {
            this.gameOver = true;
            this.endGame();
            this.showOverlay('Game Over!', `Score: ${this.score}`);
        }
    }

    render() {
        this.clear('#0a0e1a');
        const {ctx} = this;

        // Score
        this.text(`Score: ${this.score}`, this.W / 2, 25, 18, '#ccc');
        this.text(`Shots until drop: ${this.shotsUntilDrop - (this.shotCount % this.shotsUntilDrop)}`, this.W / 2, 45, 12, '#888');

        // Grid bubbles
        for (let r = 0; r < this.grid.length; r++) {
            const colCount = (r % 2 === 1) ? this.cols - 1 : this.cols;
            for (let c = 0; c < colCount; c++) {
                if (this.grid[r][c] === -1) continue;
                const pos = this.getBubblePos(r, c);
                this.drawBubble(pos.x, pos.y, this.bubbleR, this.colors[this.grid[r][c]]);
            }
        }

        // Pop animations
        for (const p of this.popAnimations) {
            ctx.globalAlpha = p.life;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, this.bubbleR * (2 - p.life), 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Falling bubbles
        for (const b of this.fallingBubbles) {
            ctx.globalAlpha = b.life;
            this.drawBubble(b.x, b.y, this.bubbleR * 0.8, b.color);
            ctx.globalAlpha = 1;
        }

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Flying bubble
        if (this.flyingBubble) {
            this.drawBubble(this.flyingBubble.x, this.flyingBubble.y, this.bubbleR, this.colors[this.flyingBubble.color]);
        }

        // Aiming line
        if (!this.flyingBubble && !this.gameOver) {
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(this.shooterX, this.shooterY);
            ctx.lineTo(
                this.shooterX + Math.cos(this.aimAngle) * 200,
                this.shooterY + Math.sin(this.aimAngle) * 200
            );
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Shooter
        this.drawBubble(this.shooterX, this.shooterY, this.bubbleR, this.colors[this.currentBubble]);

        // Next bubble
        this.drawBubble(this.shooterX + 50, this.shooterY + 10, this.bubbleR * 0.7, this.colors[this.nextBubble]);
        this.text('next', this.shooterX + 50, this.shooterY + 30, 10, '#666');

        // Shooter base
        ctx.fillStyle = '#2a2a4a';
        ctx.beginPath();
        ctx.arc(this.shooterX, this.shooterY + this.bubbleR + 8, 30, 0, Math.PI);
        ctx.fill();
    }

    drawBubble(x, y, r, color) {
        const {ctx} = this;
        // Shadow / glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Highlight
        const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
        grad.addColorStop(0, 'rgba(255,255,255,0.4)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
    }
}

// 3. SOKOBAN
class SokobanGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.levels = [
            // Level 1 - Simple intro
            { w:7, h:5, map: [
                '  ###  ',
                '  #.#  ',
                '###$###',
                '#@ $ .#',
                '#######'
            ]},
            // Level 2
            { w:7, h:6, map: [
                '#######',
                '#  .  #',
                '# $#$ #',
                '#. @ .#',
                '#  $  #',
                '#######'
            ]},
            // Level 3
            { w:8, h:6, map: [
                '  ######',
                '###    #',
                '#. $@$ #',
                '#  .#. #',
                '# $   #',
                '########'
            ]},
            // Level 4
            { w:8, h:7, map: [
                '########',
                '#   #  #',
                '# $$#  #',
                '#.  . @#',
                '# $$#  #',
                '#.  .  #',
                '########'
            ]},
            // Level 5
            { w:9, h:7, map: [
                ' ########',
                ' #  #   #',
                '##$ . $ #',
                '#  .@.  #',
                '# $ . $##',
                '#   #  # ',
                '########zzz'
            ]},
            // Level 6
            { w:8, h:7, map: [
                '########',
                '#  ..  #',
                '# $  $ #',
                '##$ @$##',
                '# $  $ #',
                '#  ..  #',
                '########'
            ]},
            // Level 7
            { w:9, h:7, map: [
                '#########',
                '#  .#.  #',
                '# $ # $ #',
                '#  $@$  #',
                '## $ $ ##',
                ' # ... # ',
                ' ####### '
            ]},
            // Level 8
            { w:8, h:8, map: [
                '  ####  ',
                '###  ###',
                '#   $  #',
                '# .$.  #',
                '# .$. @#',
                '#  $   #',
                '###  ###',
                '  ####  '
            ]},
            // Level 9
            { w:9, h:8, map: [
                '#########',
                '#   #   #',
                '# $ . $ #',
                '# .$ $. #',
                '#  .@.  #',
                '# .$ $. #',
                '# $ . $ #',
                '#########'
            ]},
            // Level 10
            { w:10, h:8, map: [
                '##########',
                '#  .  .  #',
                '# $$ $$  #',
                '#  .@.  ##',
                '## .#. $ #',
                '# $  $   #',
                '#  ....  #',
                '##########'
            ]}
        ];
        this.currentLevel = 0;
        this.history = [];
        this.moves = 0;
        this.totalMoves = 0;
        this.particles = [];
        this.loadLevel();

        this.listenKey(e => {
            const dirs = {ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0],
                          w:[0,-1], s:[0,1], a:[-1,0], d:[1,0]};
            if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); this.undo(); return; }
            if (e.key === 'r' || e.key === 'R') { e.preventDefault(); this.loadLevel(); return; }
            const dir = dirs[e.key];
            if (dir) { e.preventDefault(); this.movePlayer(dir[0], dir[1]); }
        });

        this.ui.innerHTML = '<div style="color:#888;font-size:11px;text-align:center;padding:2px">Arrows/WASD: move | Z: undo | R: restart level</div>';
        this.loop();
    }

    loadLevel() {
        const lvl = this.levels[this.currentLevel];
        this.mapW = lvl.w;
        this.mapH = lvl.h;
        this.map = [];
        this.boxes = [];
        this.targets = [];
        this.playerX = 0;
        this.playerY = 0;
        this.moves = 0;
        this.history = [];

        for (let y = 0; y < this.mapH; y++) {
            this.map[y] = [];
            const row = lvl.map[y] || '';
            for (let x = 0; x < this.mapW; x++) {
                const ch = row[x] || ' ';
                if (ch === '#') {
                    this.map[y][x] = 1; // wall
                } else {
                    this.map[y][x] = 0; // floor
                }
                if (ch === '@') { this.playerX = x; this.playerY = y; }
                if (ch === '$') { this.boxes.push({x, y}); }
                if (ch === '.') { this.targets.push({x, y}); }
                if (ch === '*') { this.boxes.push({x, y}); this.targets.push({x, y}); } // box on target
                if (ch === '+') { this.playerX = x; this.playerY = y; this.targets.push({x, y}); } // player on target
            }
        }

        // Calculate cell size
        const maxCellW = (this.canvas.width - 40) / this.mapW;
        const maxCellH = (this.canvas.height - 100) / this.mapH;
        this.cellSize = Math.min(maxCellW, maxCellH, 60);
        this.ox = (this.canvas.width - this.mapW * this.cellSize) / 2;
        this.oy = (this.canvas.height - this.mapH * this.cellSize) / 2 + 20;
    }

    movePlayer(dx, dy) {
        const nx = this.playerX + dx;
        const ny = this.playerY + dy;

        // Check bounds
        if (nx < 0 || nx >= this.mapW || ny < 0 || ny >= this.mapH) return;
        if (this.map[ny][nx] === 1) return;

        // Check for box
        const boxIdx = this.boxes.findIndex(b => b.x === nx && b.y === ny);
        if (boxIdx >= 0) {
            const bx = nx + dx, by = ny + dy;
            if (bx < 0 || bx >= this.mapW || by < 0 || by >= this.mapH) return;
            if (this.map[by][bx] === 1) return;
            if (this.boxes.some(b => b.x === bx && b.y === by)) return;

            // Push box
            this.history.push({
                px: this.playerX, py: this.playerY,
                boxIdx, bx: this.boxes[boxIdx].x, by: this.boxes[boxIdx].y
            });
            this.boxes[boxIdx].x = bx;
            this.boxes[boxIdx].y = by;
        } else {
            this.history.push({
                px: this.playerX, py: this.playerY,
                boxIdx: -1
            });
        }

        this.playerX = nx;
        this.playerY = ny;
        this.moves++;
        this.totalMoves++;
        this.setScore(this.totalMoves);

        // Check win
        if (this.checkWin()) {
            // Celebration particles
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                this.particles.push({
                    x: this.canvas.width / 2, y: this.canvas.height / 2,
                    vx: Math.cos(angle) * (3 + Math.random() * 5),
                    vy: Math.sin(angle) * (3 + Math.random() * 5),
                    color: randChoice(['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6']),
                    life: 1, size: 3 + Math.random() * 4
                });
            }

            this.addTimeout(() => {
                if (this.currentLevel < this.levels.length - 1) {
                    this.currentLevel++;
                    this.loadLevel();
                } else {
                    this.endGame();
                    this.showOverlay('All Levels Complete!', `Total moves: ${this.totalMoves}`);
                }
            }, 1000);
        }
    }

    undo() {
        if (this.history.length === 0) return;
        const state = this.history.pop();
        this.playerX = state.px;
        this.playerY = state.py;
        if (state.boxIdx >= 0) {
            this.boxes[state.boxIdx].x = state.bx;
            this.boxes[state.boxIdx].y = state.by;
        }
        this.moves--;
        this.totalMoves--;
        this.setScore(this.totalMoves);
    }

    checkWin() {
        return this.targets.every(t => this.boxes.some(b => b.x === t.x && b.y === t.y));
    }

    isTarget(x, y) {
        return this.targets.some(t => t.x === x && t.y === y);
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.015;
            return p.life > 0;
        });
    }

    render() {
        this.clear('#0f0f1a');
        const {ctx} = this;
        const cs = this.cellSize;

        // Header
        this.text(`Level ${this.currentLevel + 1} / ${this.levels.length}`, this.canvas.width / 2, 25, 20, '#e0e0e0');
        this.text(`Moves: ${this.moves}`, this.canvas.width / 2, 48, 14, '#888');

        // Draw map
        for (let y = 0; y < this.mapH; y++) {
            for (let x = 0; x < this.mapW; x++) {
                const px = this.ox + x * cs;
                const py = this.oy + y * cs;

                if (this.map[y][x] === 1) {
                    // Wall
                    ctx.fillStyle = '#3a3a5a';
                    ctx.fillRect(px, py, cs, cs);
                    ctx.fillStyle = '#4a4a6a';
                    ctx.fillRect(px + 2, py + 2, cs - 4, cs - 6);
                    ctx.fillStyle = '#2a2a4a';
                    ctx.fillRect(px + 2, py + cs - 4, cs - 4, 2);
                } else if (this.map[y][x] === 0) {
                    // Floor
                    ctx.fillStyle = '#1a1a2e';
                    ctx.fillRect(px, py, cs, cs);
                    ctx.strokeStyle = '#222244';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(px, py, cs, cs);
                }

                // Target marker
                if (this.isTarget(x, y)) {
                    ctx.fillStyle = 'rgba(231,76,60,0.3)';
                    ctx.beginPath();
                    ctx.arc(px + cs/2, py + cs/2, cs * 0.25, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#e74c3c';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(px + cs/2, py + cs/2, cs * 0.25, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }

        // Draw boxes
        for (const box of this.boxes) {
            const px = this.ox + box.x * cs;
            const py = this.oy + box.y * cs;
            const onTarget = this.isTarget(box.x, box.y);

            ctx.fillStyle = onTarget ? '#2ecc71' : '#f39c12';
            ctx.fillRect(px + 4, py + 4, cs - 8, cs - 8);

            // Box face
            ctx.fillStyle = onTarget ? '#27ae60' : '#e67e22';
            ctx.fillRect(px + 8, py + 8, cs - 16, cs - 16);

            // Cross pattern
            ctx.strokeStyle = onTarget ? '#1e8449' : '#d35400';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px + 4, py + 4);
            ctx.lineTo(px + cs - 4, py + cs - 4);
            ctx.moveTo(px + cs - 4, py + 4);
            ctx.lineTo(px + 4, py + cs - 4);
            ctx.stroke();

            if (onTarget) {
                ctx.shadowColor = '#2ecc71';
                ctx.shadowBlur = 10;
                ctx.strokeStyle = '#2ecc71';
                ctx.lineWidth = 1;
                ctx.strokeRect(px + 3, py + 3, cs - 6, cs - 6);
                ctx.shadowBlur = 0;
            }
        }

        // Draw player
        const ppx = this.ox + this.playerX * cs + cs / 2;
        const ppy = this.oy + this.playerY * cs + cs / 2;
        const pr = cs * 0.35;

        ctx.fillStyle = '#3498db';
        ctx.shadowColor = '#3498db';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(ppx, ppy, pr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Player face
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.arc(ppx, ppy, pr * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ppx - pr * 0.25, ppy - pr * 0.15, 3, 0, Math.PI * 2);
        ctx.arc(ppx + pr * 0.25, ppy - pr * 0.15, 3, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ppx, ppy + pr * 0.05, pr * 0.25, 0.1, Math.PI - 0.1);
        ctx.stroke();

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

// 4. PATH FINDER
class PathFinderGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.levels = [
            // {gridW, gridH, start, end, stars, walls}
            { gridW:5, gridH:5, start:{r:0,c:0}, end:{r:4,c:4}, stars:[{r:1,c:2},{r:2,c:4},{r:3,c:1}], walls:[] },
            { gridW:5, gridH:5, start:{r:0,c:0}, end:{r:4,c:4}, stars:[{r:0,c:3},{r:2,c:2},{r:4,c:1}], walls:[{r:1,c:1},{r:3,c:3}] },
            { gridW:6, gridH:6, start:{r:0,c:0}, end:{r:5,c:5}, stars:[{r:1,c:3},{r:2,c:1},{r:3,c:4},{r:4,c:2}], walls:[{r:1,c:1},{r:2,c:4},{r:4,c:1}] },
            { gridW:6, gridH:6, start:{r:5,c:0}, end:{r:0,c:5}, stars:[{r:0,c:2},{r:2,c:0},{r:3,c:5},{r:4,c:3}], walls:[{r:1,c:3},{r:3,c:2},{r:4,c:4}] },
            { gridW:7, gridH:7, start:{r:0,c:0}, end:{r:6,c:6}, stars:[{r:1,c:3},{r:2,c:5},{r:3,c:1},{r:4,c:4},{r:5,c:2}], walls:[{r:1,c:1},{r:2,c:3},{r:4,c:2},{r:5,c:5}] },
            { gridW:7, gridH:7, start:{r:6,c:0}, end:{r:0,c:6}, stars:[{r:0,c:3},{r:1,c:5},{r:3,c:1},{r:4,c:4},{r:5,c:6},{r:6,c:2}], walls:[{r:2,c:2},{r:3,c:4},{r:5,c:1},{r:1,c:1}] },
            { gridW:8, gridH:8, start:{r:0,c:0}, end:{r:7,c:7}, stars:[{r:0,c:4},{r:1,c:6},{r:2,c:2},{r:3,c:5},{r:5,c:1},{r:6,c:4},{r:4,c:7}], walls:[{r:1,c:2},{r:2,c:5},{r:4,c:3},{r:5,c:6},{r:6,c:1},{r:3,c:1}] },
            { gridW:8, gridH:8, start:{r:7,c:0}, end:{r:0,c:7}, stars:[{r:1,c:1},{r:1,c:5},{r:3,c:3},{r:3,c:7},{r:5,c:1},{r:5,c:5},{r:7,c:4}], walls:[{r:0,c:3},{r:2,c:6},{r:4,c:2},{r:4,c:5},{r:6,c:3},{r:6,c:6}] },
        ];
        this.currentLevel = 0;
        this.path = [];
        this.drawing = false;
        this.particles = [];
        this.completedStars = 0;
        this.loadLevel();

        this.listenClick(e => this.handleClick(e));
        this.listenMouse('mousemove', e => this.handleMove(e));
        this.hoverR = -1; this.hoverC = -1;

        this.ui.innerHTML = '<div style="color:#888;font-size:11px;text-align:center;padding:2px">Click start (green), draw path through all stars to end (red). Click to cancel.</div>';
        this.loop();
    }

    loadLevel() {
        const lvl = this.levels[this.currentLevel];
        this.gridW = lvl.gridW;
        this.gridH = lvl.gridH;
        this.startCell = lvl.start;
        this.endCell = lvl.end;
        this.stars = lvl.stars.map(s => ({...s, collected: false}));
        this.walls = lvl.walls;
        this.path = [];
        this.drawing = false;

        this.cellSize = Math.min(
            (this.canvas.width - 60) / this.gridW,
            (this.canvas.height - 120) / this.gridH,
            65
        );
        this.ox = (this.canvas.width - this.gridW * this.cellSize) / 2;
        this.oy = (this.canvas.height - this.gridH * this.cellSize) / 2 + 20;
    }

    getCell(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        const c = Math.floor((x - this.ox) / this.cellSize);
        const r = Math.floor((y - this.oy) / this.cellSize);
        if (r >= 0 && r < this.gridH && c >= 0 && c < this.gridW) return {r, c};
        return null;
    }

    handleClick(e) {
        const cell = this.getCell(e);
        if (!cell) return;

        if (this.drawing) {
            // Cancel drawing
            this.path = [];
            this.drawing = false;
            this.stars.forEach(s => s.collected = false);
            return;
        }

        // Start drawing from start cell
        if (cell.r === this.startCell.r && cell.c === this.startCell.c) {
            this.drawing = true;
            this.path = [cell];
            this.stars.forEach(s => s.collected = false);
        }
    }

    handleMove(e) {
        const cell = this.getCell(e);
        if (cell) { this.hoverR = cell.r; this.hoverC = cell.c; } else { this.hoverR = -1; this.hoverC = -1; }

        if (!this.drawing || !cell) return;

        const last = this.path[this.path.length - 1];
        const dr = Math.abs(cell.r - last.r);
        const dc = Math.abs(cell.c - last.c);

        // Must be adjacent (not diagonal)
        if (!((dr === 1 && dc === 0) || (dr === 0 && dc === 1))) return;

        // Can't be a wall
        if (this.walls.some(w => w.r === cell.r && w.c === cell.c)) return;

        // Check if going back one step
        if (this.path.length >= 2) {
            const prev = this.path[this.path.length - 2];
            if (prev.r === cell.r && prev.c === cell.c) {
                // Uncollect star if we step off it
                const popped = this.path.pop();
                const starIdx = this.stars.findIndex(s => s.r === popped.r && s.c === popped.c);
                if (starIdx >= 0) this.stars[starIdx].collected = false;
                return;
            }
        }

        // Can't cross existing path
        if (this.path.some(p => p.r === cell.r && p.c === cell.c)) return;

        this.path.push(cell);

        // Check if star collected
        const star = this.stars.find(s => s.r === cell.r && s.c === cell.c);
        if (star) {
            star.collected = true;
            // Sparkle
            const cx = this.ox + cell.c * this.cellSize + this.cellSize / 2;
            const cy = this.oy + cell.r * this.cellSize + this.cellSize / 2;
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                this.particles.push({
                    x: cx, y: cy,
                    vx: Math.cos(angle) * 3,
                    vy: Math.sin(angle) * 3,
                    color: '#f1c40f', life: 1, size: 3
                });
            }
        }

        // Check if reached end with all stars
        if (cell.r === this.endCell.r && cell.c === this.endCell.c) {
            if (this.stars.every(s => s.collected)) {
                // Level complete!
                const points = 100 + Math.max(0, (this.gridW * this.gridH - this.path.length) * 5);
                this.setScore(this.score + points);
                this.drawing = false;

                // Celebration
                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    this.particles.push({
                        x: this.canvas.width / 2, y: this.canvas.height / 2,
                        vx: Math.cos(angle) * (2 + Math.random() * 5),
                        vy: Math.sin(angle) * (2 + Math.random() * 5),
                        color: randChoice(['#e74c3c','#3498db','#2ecc71','#f1c40f','#9b59b6']),
                        life: 1, size: 4
                    });
                }

                this.addTimeout(() => {
                    if (this.currentLevel < this.levels.length - 1) {
                        this.currentLevel++;
                        this.loadLevel();
                    } else {
                        this.endGame();
                        this.showOverlay('All Levels Complete!', `Score: ${this.score}`);
                    }
                }, 1200);
            }
        }
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= 0.02;
            return p.life > 0;
        });
    }

    render() {
        this.clear('#0a0a1e');
        const {ctx} = this;
        const cs = this.cellSize;

        this.text(`Level ${this.currentLevel + 1} / ${this.levels.length}`, this.canvas.width / 2, 25, 20, '#e0e0e0');
        this.text(`Score: ${this.score}`, this.canvas.width / 2, 48, 14, '#888');

        // Draw grid
        for (let r = 0; r < this.gridH; r++) {
            for (let c = 0; c < this.gridW; c++) {
                const px = this.ox + c * cs;
                const py = this.oy + r * cs;

                const isWall = this.walls.some(w => w.r === r && w.c === c);
                if (isWall) {
                    ctx.fillStyle = '#2a2a3e';
                    ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
                    // X pattern
                    ctx.strokeStyle = '#444';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(px + 8, py + 8); ctx.lineTo(px + cs - 8, py + cs - 8);
                    ctx.moveTo(px + cs - 8, py + 8); ctx.lineTo(px + 8, py + cs - 8);
                    ctx.stroke();
                } else {
                    ctx.fillStyle = '#151530';
                    ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
                }

                // Hover
                if (r === this.hoverR && c === this.hoverC && !isWall) {
                    ctx.fillStyle = 'rgba(255,255,255,0.05)';
                    ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
                }
            }
        }

        // Draw path
        if (this.path.length > 0) {
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = cs * 0.3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            const first = this.path[0];
            ctx.moveTo(this.ox + first.c * cs + cs/2, this.oy + first.r * cs + cs/2);
            for (let i = 1; i < this.path.length; i++) {
                ctx.lineTo(this.ox + this.path[i].c * cs + cs/2, this.oy + this.path[i].r * cs + cs/2);
            }
            ctx.stroke();

            // Glow
            ctx.shadowColor = '#3498db';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = 'rgba(52,152,219,0.3)';
            ctx.lineWidth = cs * 0.5;
            ctx.beginPath();
            ctx.moveTo(this.ox + first.c * cs + cs/2, this.oy + first.r * cs + cs/2);
            for (let i = 1; i < this.path.length; i++) {
                ctx.lineTo(this.ox + this.path[i].c * cs + cs/2, this.oy + this.path[i].r * cs + cs/2);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Draw stars
        for (const star of this.stars) {
            if (star.collected) continue;
            const cx = this.ox + star.c * cs + cs / 2;
            const cy = this.oy + star.r * cs + cs / 2;
            const sr = cs * 0.25;
            const t = Date.now() / 500;

            ctx.shadowColor = '#f1c40f';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = -Math.PI / 2 + (i * 2 * Math.PI / 5) + Math.sin(t) * 0.1;
                const innerAngle = angle + Math.PI / 5;
                ctx.lineTo(cx + Math.cos(angle) * sr, cy + Math.sin(angle) * sr);
                ctx.lineTo(cx + Math.cos(innerAngle) * sr * 0.45, cy + Math.sin(innerAngle) * sr * 0.45);
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Start cell
        {
            const cx = this.ox + this.startCell.c * cs + cs / 2;
            const cy = this.oy + this.startCell.r * cs + cs / 2;
            ctx.fillStyle = '#2ecc71';
            ctx.shadowColor = '#2ecc71';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(cx, cy, cs * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            this.text('S', cx, cy + 5, 14, '#fff');
        }

        // End cell
        {
            const cx = this.ox + this.endCell.c * cs + cs / 2;
            const cy = this.oy + this.endCell.r * cs + cs / 2;
            ctx.fillStyle = '#e74c3c';
            ctx.shadowColor = '#e74c3c';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(cx, cy, cs * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            this.text('E', cx, cy + 5, 14, '#fff');
        }

        // Stars collected indicator
        const collected = this.stars.filter(s => s.collected).length;
        this.text(`Stars: ${collected} / ${this.stars.length}`, this.canvas.width / 2, this.canvas.height - 20, 14, '#f1c40f');

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

// 5. BLOCK PUZZLE
class BlockPuzzleGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.gridSize = 10;
        this.cellSize = 42;
        this.ox = (this.canvas.width - this.gridSize * this.cellSize) / 2;
        this.oy = 30;
        this.grid = Array.from({length: this.gridSize}, () => Array(this.gridSize).fill(0)); // 0 = empty, >0 = color index
        this.pieces = [];
        this.dragging = null;
        this.dragX = 0; this.dragY = 0;
        this.particles = [];
        this.floatingTexts = [];
        this.clearFlash = [];
        this.linesCleared = 0;
        this.colorIdx = 1;

        // Piece shapes [relative cells]
        this.shapes = [
            [[0,0],[1,0],[2,0]], // I3
            [[0,0],[1,0],[2,0],[3,0]], // I4
            [[0,0],[1,0],[2,0],[3,0],[4,0]], // I5
            [[0,0],[0,1],[1,0],[1,1]], // O
            [[0,0],[1,0],[1,1]], // L
            [[0,0],[0,1],[1,1]], // S
            [[0,0],[1,0],[0,1]], // J
            [[0,0],[1,0],[1,1],[2,1]], // Z
            [[0,0],[1,0],[2,0],[0,1]], // L big
            [[0,0],[1,0],[2,0],[2,1]], // J big
            [[0,0],[1,0],[2,0],[0,1],[0,2]], // big L
            [[0,0],[0,1],[0,2],[1,0],[2,0]], // big J
            [[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2]], // square 3x3 hollow
            [[0,0]], // dot
            [[0,0],[0,1]], // 2 vert
            [[0,0],[1,0],[2,0],[1,1]], // T
            [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]], // 3x3 block
        ];

        this.generatePieces();

        this.listenMouse('mousedown', e => this.startDrag(e));
        this.listenMouse('mousemove', e => this.moveDrag(e));
        this.listenMouse('mouseup', e => this.endDrag(e));
        // Touch
        this.listenMouse('touchstart', e => { e.preventDefault(); this.startDrag(e.touches[0]); });
        this.listenMouse('touchmove', e => { e.preventDefault(); this.moveDrag(e.touches[0]); });
        this.listenMouse('touchend', e => { e.preventDefault(); this.endDrag(e); });

        this.ui.innerHTML = '';
        this.loop();
    }

    generatePieces() {
        this.pieces = [];
        const pieceAreaY = this.oy + this.gridSize * this.cellSize + 30;
        for (let i = 0; i < 3; i++) {
            const shape = randChoice(this.shapes);
            this.colorIdx = (this.colorIdx % 7) + 1;
            this.pieces.push({
                shape,
                color: this.colorIdx,
                placed: false,
                homeX: 30 + i * (this.canvas.width / 3),
                homeY: pieceAreaY
            });
        }
    }

    getColors(idx) {
        const colors = ['','#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#e91e63','#00bcd4'];
        return colors[idx] || '#888';
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    startDrag(e) {
        const pos = this.getMousePos(e);
        const previewSize = 22;
        for (let i = this.pieces.length - 1; i >= 0; i--) {
            const p = this.pieces[i];
            if (p.placed) continue;
            // Check if click is near piece
            for (const cell of p.shape) {
                const cx = p.homeX + cell[0] * previewSize;
                const cy = p.homeY + cell[1] * previewSize;
                if (pos.x >= cx && pos.x <= cx + previewSize && pos.y >= cy && pos.y <= cy + previewSize) {
                    this.dragging = i;
                    this.dragX = pos.x;
                    this.dragY = pos.y - 60; // Offset up for visibility
                    return;
                }
            }
        }
    }

    moveDrag(e) {
        if (this.dragging === null) return;
        const pos = this.getMousePos(e);
        this.dragX = pos.x;
        this.dragY = pos.y - 60;
    }

    endDrag(e) {
        if (this.dragging === null) return;
        const piece = this.pieces[this.dragging];

        // Try to snap to grid
        const gridC = Math.round((this.dragX - this.ox - this.cellSize / 2) / this.cellSize);
        const gridR = Math.round((this.dragY - this.oy - this.cellSize / 2) / this.cellSize);

        if (this.canPlace(piece.shape, gridR, gridC)) {
            this.placePiece(piece, gridR, gridC);
        }

        this.dragging = null;
    }

    canPlace(shape, r, c) {
        for (const cell of shape) {
            const gr = r + cell[1];
            const gc = c + cell[0];
            if (gr < 0 || gr >= this.gridSize || gc < 0 || gc >= this.gridSize) return false;
            if (this.grid[gr][gc] !== 0) return false;
        }
        return true;
    }

    placePiece(piece, r, c) {
        for (const cell of piece.shape) {
            this.grid[r + cell[1]][c + cell[0]] = piece.color;
        }
        piece.placed = true;
        this.setScore(this.score + piece.shape.length);

        // Check for completed rows and columns
        this.checkClears();

        // Check if all pieces placed
        if (this.pieces.every(p => p.placed)) {
            this.generatePieces();
        }

        // Check game over
        if (!this.hasValidPlacement()) {
            this.addTimeout(() => {
                this.endGame();
                this.showOverlay('Game Over!', `Score: ${this.score} | Lines: ${this.linesCleared}`);
            }, 300);
        }
    }

    checkClears() {
        const rowsToClear = [];
        const colsToClear = [];

        for (let r = 0; r < this.gridSize; r++) {
            if (this.grid[r].every(c => c !== 0)) rowsToClear.push(r);
        }
        for (let c = 0; c < this.gridSize; c++) {
            let full = true;
            for (let r = 0; r < this.gridSize; r++) {
                if (this.grid[r][c] === 0) { full = false; break; }
            }
            if (full) colsToClear.push(c);
        }

        if (rowsToClear.length === 0 && colsToClear.length === 0) return;

        const totalLines = rowsToClear.length + colsToClear.length;
        this.linesCleared += totalLines;
        const bonus = totalLines * totalLines * 10; // Combo bonus
        this.setScore(this.score + bonus);

        // Floating text
        this.floatingTexts.push({
            x: this.canvas.width / 2, y: this.oy + this.gridSize * this.cellSize / 2,
            text: `+${bonus}${totalLines > 1 ? ' COMBO!' : ''}`,
            life: 1, color: totalLines > 1 ? '#ffeb3b' : '#fff'
        });

        // Clear flash and particles
        for (const r of rowsToClear) {
            for (let c = 0; c < this.gridSize; c++) {
                this.addClearEffect(r, c);
                this.grid[r][c] = 0;
            }
        }
        for (const c of colsToClear) {
            for (let r = 0; r < this.gridSize; r++) {
                if (!rowsToClear.includes(r)) { // Don't double-clear
                    this.addClearEffect(r, c);
                    this.grid[r][c] = 0;
                }
            }
        }
    }

    addClearEffect(r, c) {
        const cx = this.ox + c * this.cellSize + this.cellSize / 2;
        const cy = this.oy + r * this.cellSize + this.cellSize / 2;
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * (1 + Math.random() * 3),
                vy: Math.sin(angle) * (1 + Math.random() * 3),
                color: this.getColors(this.grid[r][c]),
                life: 1, size: 3 + Math.random() * 3
            });
        }
        this.clearFlash.push({ r, c, life: 1 });
    }

    hasValidPlacement() {
        for (const piece of this.pieces) {
            if (piece.placed) continue;
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    if (this.canPlace(piece.shape, r, c)) return true;
                }
            }
        }
        return false;
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= 0.02;
            return p.life > 0;
        });
        this.floatingTexts = this.floatingTexts.filter(t => {
            t.y -= 1; t.life -= 0.02;
            return t.life > 0;
        });
        this.clearFlash = this.clearFlash.filter(f => {
            f.life -= 0.05;
            return f.life > 0;
        });
    }

    render() {
        this.clear('#0a0a1e');
        const {ctx} = this;
        const cs = this.cellSize;

        // Score
        this.text(`Score: ${this.score}`, this.canvas.width / 4, 20, 16, '#ccc');
        this.text(`Lines: ${this.linesCleared}`, this.canvas.width * 3 / 4, 20, 16, '#ccc');

        // Grid
        ctx.fillStyle = '#111126';
        ctx.fillRect(this.ox - 2, this.oy - 2, this.gridSize * cs + 4, this.gridSize * cs + 4);

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const px = this.ox + c * cs;
                const py = this.oy + r * cs;

                if (this.grid[r][c] === 0) {
                    ctx.fillStyle = (r + c) % 2 === 0 ? '#161630' : '#1a1a38';
                    ctx.fillRect(px, py, cs, cs);
                } else {
                    const color = this.getColors(this.grid[r][c]);
                    ctx.fillStyle = color;
                    ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
                    // Inner highlight
                    ctx.fillStyle = 'rgba(255,255,255,0.15)';
                    ctx.fillRect(px + 3, py + 3, cs - 6, (cs - 6) / 3);
                }
            }
        }

        // Clear flash
        for (const f of this.clearFlash) {
            ctx.globalAlpha = f.life * 0.5;
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.ox + f.c * cs, this.oy + f.r * cs, cs, cs);
            ctx.globalAlpha = 1;
        }

        // Ghost placement
        if (this.dragging !== null) {
            const piece = this.pieces[this.dragging];
            const gridC = Math.round((this.dragX - this.ox - cs / 2) / cs);
            const gridR = Math.round((this.dragY - this.oy - cs / 2) / cs);
            const canPlace = this.canPlace(piece.shape, gridR, gridC);

            for (const cell of piece.shape) {
                const gr = gridR + cell[1];
                const gc = gridC + cell[0];
                if (gr >= 0 && gr < this.gridSize && gc >= 0 && gc < this.gridSize) {
                    ctx.globalAlpha = 0.4;
                    ctx.fillStyle = canPlace ? this.getColors(piece.color) : '#ff4444';
                    ctx.fillRect(this.ox + gc * cs + 1, this.oy + gr * cs + 1, cs - 2, cs - 2);
                    ctx.globalAlpha = 1;
                }
            }

            // Draw dragging piece
            ctx.globalAlpha = 0.8;
            for (const cell of piece.shape) {
                ctx.fillStyle = this.getColors(piece.color);
                ctx.fillRect(this.dragX + cell[0] * cs - cs/2, this.dragY + cell[1] * cs - cs/2, cs - 2, cs - 2);
            }
            ctx.globalAlpha = 1;
        }

        // Draw pieces tray
        const previewSize = 22;
        const trayY = this.oy + this.gridSize * cs + 20;
        ctx.fillStyle = '#111126';
        ctx.fillRect(5, trayY - 10, this.canvas.width - 10, this.canvas.height - trayY + 5);

        for (let i = 0; i < this.pieces.length; i++) {
            const p = this.pieces[i];
            if (p.placed) continue;
            if (this.dragging === i) continue;

            for (const cell of p.shape) {
                ctx.fillStyle = this.getColors(p.color);
                ctx.fillRect(p.homeX + cell[0] * previewSize, p.homeY + cell[1] * previewSize, previewSize - 2, previewSize - 2);
            }
        }

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Floating texts
        for (const t of this.floatingTexts) {
            ctx.globalAlpha = t.life;
            this.text(t.text, t.x, t.y, 22, t.color);
            ctx.globalAlpha = 1;
        }
    }
}

// 6. MAHJONG SOLITAIRE
class MahjongGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.tileW = 44;
        this.tileH = 56;
        this.layerOffset = 4;
        this.selected = null;
        this.particles = [];
        this.hintTimer = 0;
        this.startTime = Date.now();
        this.matchAnim = [];
        this.totalTiles = 0;
        this.removedCount = 0;

        // Tile types: symbols rendered with simple patterns
        this.tileTypes = [];
        const symbols = [
            '1','2','3','4','5','6','7','8','9',
            'A','B','C','D','E','F','G','H','I',
            'J','K','L','M','N','O','P','Q','R',
            'S','T','U','V','W','X','Y','Z'
        ];
        const tileColors = [
            '#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#e91e63',
            '#00bcd4','#ff5722','#8bc34a','#ff9800','#673ab7','#009688',
            '#c62828','#1565c0','#2e7d32','#ef6c00','#6a1b9a','#00838f',
            '#ad1457','#0277bd','#558b2f','#e65100','#4527a0','#00695c',
            '#b71c1c','#0d47a1','#1b5e20','#bf360c','#311b92','#004d40',
            '#880e4f','#01579b','#33691e','#ff6f00','#4a148c','#006064'
        ];
        for (let i = 0; i < 36; i++) {
            this.tileTypes.push({ symbol: symbols[i], color: tileColors[i] });
        }

        this.generateLayout();

        this.listenClick(e => this.handleClick(e));
        this.listenMouse('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            this.mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        });
        this.mouseX = 0; this.mouseY = 0;

        this.ui.innerHTML = '';
        this.loop();
    }

    generateLayout() {
        // Classic turtle layout: 3 layers
        // Layer 0: 12x6, Layer 1: 10x4 centered, Layer 2: 8x2 centered
        this.tiles = [];
        const layouts = [
            { w: 12, h: 6, offX: 0, offY: 0 },
            { w: 10, h: 4, offX: 1, offY: 1 },
            { w: 6, h: 2, offX: 3, offY: 2 },
        ];

        // Count positions
        let posCount = 0;
        for (const l of layouts) {
            posCount += l.w * l.h;
        }

        // We need pairs: round down to even and create type pairs
        posCount = Math.floor(posCount / 2) * 2;
        this.totalTiles = posCount;
        this.removedCount = 0;

        const types = [];
        const pairCount = posCount / 2;
        for (let i = 0; i < pairCount; i++) {
            const t = i % this.tileTypes.length;
            types.push(t, t);
        }
        shuffle(types);

        let tIdx = 0;
        const ox = (this.canvas.width - layouts[0].w * (this.tileW + 2)) / 2 + 20;
        const oy = (this.canvas.height - layouts[0].h * (this.tileH + 2)) / 2 + 10;

        for (let layer = 0; layer < layouts.length; layer++) {
            const l = layouts[layer];
            for (let r = 0; r < l.h; r++) {
                for (let c = 0; c < l.w; c++) {
                    if (tIdx >= types.length) break;
                    this.tiles.push({
                        type: types[tIdx++],
                        layer,
                        gridR: r + l.offY,
                        gridC: c + l.offX,
                        x: ox + (c + l.offX) * (this.tileW + 2) - layer * this.layerOffset,
                        y: oy + (r + l.offY) * (this.tileH + 2) - layer * this.layerOffset,
                        removed: false,
                        removeAnim: 0
                    });
                }
            }
        }
    }

    isFree(tile) {
        if (tile.removed) return false;

        // Check if blocked on top (higher layer at same position)
        for (const t of this.tiles) {
            if (t.removed || t === tile) continue;
            if (t.layer > tile.layer) {
                // Overlapping check
                if (Math.abs(t.gridR - tile.gridR) <= 0 && Math.abs(t.gridC - tile.gridC) <= 0) {
                    return false;
                }
            }
        }

        // Check if blocked on left AND right by same-layer tiles
        let blockedLeft = false, blockedRight = false;
        for (const t of this.tiles) {
            if (t.removed || t === tile || t.layer !== tile.layer) continue;
            if (t.gridR === tile.gridR) {
                if (t.gridC === tile.gridC - 1) blockedLeft = true;
                if (t.gridC === tile.gridC + 1) blockedRight = true;
            }
        }
        return !(blockedLeft && blockedRight);
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);

        // Click tiles top layer first
        let clicked = null;
        for (let i = this.tiles.length - 1; i >= 0; i--) {
            const t = this.tiles[i];
            if (t.removed) continue;
            if (mx >= t.x && mx <= t.x + this.tileW && my >= t.y && my <= t.y + this.tileH) {
                if (this.isFree(t)) {
                    clicked = t;
                    break;
                }
            }
        }

        if (!clicked) { this.selected = null; return; }

        if (!this.selected) {
            this.selected = clicked;
        } else if (this.selected === clicked) {
            this.selected = null;
        } else if (this.selected.type === clicked.type) {
            // Match!
            this.selected.removed = true;
            clicked.removed = true;
            this.removedCount += 2;

            // Particles
            for (const t of [this.selected, clicked]) {
                const cx = t.x + this.tileW / 2;
                const cy = t.y + this.tileH / 2;
                for (let i = 0; i < 8; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    this.particles.push({
                        x: cx, y: cy,
                        vx: Math.cos(angle) * (2 + Math.random() * 3),
                        vy: Math.sin(angle) * (2 + Math.random() * 3),
                        color: this.tileTypes[t.type].color,
                        life: 1, size: 3 + Math.random() * 3
                    });
                }
                this.matchAnim.push({ x: cx, y: cy, life: 1, color: this.tileTypes[t.type].color });
            }

            const timeBonus = Math.max(1, 20 - Math.floor((Date.now() - this.startTime) / 5000));
            this.setScore(this.score + 10 + timeBonus);
            this.selected = null;

            // Check win
            if (this.removedCount >= this.totalTiles) {
                const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);
                this.addTimeout(() => {
                    this.endGame();
                    this.showOverlay('You Win!', `Score: ${this.score} | Time: ${timeTaken}s`);
                }, 500);
            }

            // Check if any moves left
            if (!this.hasMatches() && this.removedCount < this.totalTiles) {
                this.addTimeout(() => {
                    this.endGame();
                    this.showOverlay('No More Moves', `Score: ${this.score}`);
                }, 500);
            }
        } else {
            this.selected = clicked;
        }
    }

    hasMatches() {
        const freeTiles = this.tiles.filter(t => !t.removed && this.isFree(t));
        for (let i = 0; i < freeTiles.length; i++) {
            for (let j = i + 1; j < freeTiles.length; j++) {
                if (freeTiles[i].type === freeTiles[j].type) return true;
            }
        }
        return false;
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.02;
            return p.life > 0;
        });
        this.matchAnim = this.matchAnim.filter(m => {
            m.life -= 0.04;
            return m.life > 0;
        });
    }

    render() {
        this.clear('#0e0a16');
        const {ctx} = this;

        // Timer
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        this.text(`${mins}:${secs.toString().padStart(2,'0')}`, 60, 22, 16, '#888');
        this.text(`Score: ${this.score}`, this.canvas.width / 2, 22, 16, '#ccc');
        this.text(`${this.totalTiles - this.removedCount} tiles`, this.canvas.width - 60, 22, 14, '#888');

        // Draw tiles (bottom layer first)
        for (let layer = 0; layer <= 2; layer++) {
            for (const t of this.tiles) {
                if (t.removed || t.layer !== layer) continue;

                const free = this.isFree(t);
                const hovered = free && this.mouseX >= t.x && this.mouseX <= t.x + this.tileW &&
                    this.mouseY >= t.y && this.mouseY <= t.y + this.tileH;
                const selected = this.selected === t;

                // Tile shadow
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(t.x + 3, t.y + 3, this.tileW, this.tileH);

                // Tile body
                const baseColor = free ? '#2a2840' : '#1e1c30';
                ctx.fillStyle = baseColor;
                ctx.fillRect(t.x, t.y, this.tileW, this.tileH);

                // Border
                if (selected) {
                    ctx.strokeStyle = '#f1c40f';
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#f1c40f';
                    ctx.shadowBlur = 10;
                    ctx.strokeRect(t.x, t.y, this.tileW, this.tileH);
                    ctx.shadowBlur = 0;
                } else if (hovered) {
                    ctx.strokeStyle = '#555';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(t.x, t.y, this.tileW, this.tileH);
                } else {
                    ctx.strokeStyle = '#3a3858';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(t.x, t.y, this.tileW, this.tileH);
                }

                // Top highlight
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.fillRect(t.x + 1, t.y + 1, this.tileW - 2, this.tileH / 3);

                // Symbol
                const tt = this.tileTypes[t.type];
                const cx = t.x + this.tileW / 2;
                const cy = t.y + this.tileH / 2;

                ctx.fillStyle = tt.color;
                ctx.font = 'bold 20px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(tt.symbol, cx, cy);
                ctx.textBaseline = 'alphabetic';

                // Dim unplayable
                if (!free) {
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fillRect(t.x, t.y, this.tileW, this.tileH);
                }
            }
        }

        // Match animations
        for (const m of this.matchAnim) {
            ctx.globalAlpha = m.life;
            ctx.strokeStyle = m.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(m.x, m.y, 25 * (2 - m.life), 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

// 7. SIMON SAYS
class SimonGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.colors = ['#e74c3c','#2ecc71','#3498db','#f1c40f'];
        this.brightColors = ['#ff6b6b','#55efc4','#74b9ff','#ffeaa7'];
        this.darkColors = ['#a93226','#1e8449','#2471a3','#b7950b'];
        this.sequence = [];
        this.playerSeq = [];
        this.phase = 'watch'; // watch, play, gameover
        this.showIdx = 0;
        this.showTimer = 0;
        this.flashIdx = -1;
        this.flashTimer = 0;
        this.round = 0;
        this.bestRound = 0;
        this.particles = [];
        this.cx = this.canvas.width / 2;
        this.cy = this.canvas.height / 2;
        this.radius = 180;
        this.gap = 8;
        this.pulseTimer = 0;

        // Audio context for tones
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) { this.audioCtx = null; }

        this.listenClick(e => this.handleClick(e));
        this.ui.innerHTML = '';

        // Start first round
        this.addTimeout(() => this.nextRound(), 800);
        this.loop();
    }

    playTone(idx, duration = 300) {
        if (!this.audioCtx) return;
        const freqs = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.value = freqs[idx];
        gain.gain.value = 0.15;
        const t = this.audioCtx.currentTime;
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration / 1000);
        osc.start(t);
        osc.stop(t + duration / 1000);
    }

    playErrorTone() {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.value = 100;
        gain.gain.value = 0.1;
        const t = this.audioCtx.currentTime;
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.start(t);
        osc.stop(t + 0.5);
    }

    nextRound() {
        this.round++;
        this.sequence.push(randInt(0, 3));
        this.phase = 'watch';
        this.showIdx = 0;
        this.playerSeq = [];

        // Show sequence
        this.showNext();
    }

    showNext() {
        if (this.showIdx >= this.sequence.length) {
            this.phase = 'play';
            return;
        }
        const idx = this.sequence[this.showIdx];
        this.flashIdx = idx;
        this.flashTimer = 15;
        this.playTone(idx, 300);
        this.showIdx++;

        const delay = Math.max(300, 600 - this.round * 15);
        this.addTimeout(() => {
            this.flashIdx = -1;
            this.addTimeout(() => this.showNext(), 150);
        }, delay);
    }

    getQuadrant(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width) - this.cx;
        const my = (e.clientY - rect.top) * (this.canvas.height / rect.height) - this.cy;
        const dist = Math.hypot(mx, my);
        if (dist > this.radius + 20 || dist < 30) return -1;

        // Quadrant: 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right
        if (mx < 0 && my < 0) return 0;
        if (mx >= 0 && my < 0) return 1;
        if (mx < 0 && my >= 0) return 2;
        if (mx >= 0 && my >= 0) return 3;
        return -1;
    }

    handleClick(e) {
        if (this.phase !== 'play') return;

        const q = this.getQuadrant(e);
        if (q < 0) return;

        this.flashIdx = q;
        this.flashTimer = 8;
        this.playTone(q, 200);

        // Create particles
        const angle = [Math.PI * 1.25, Math.PI * 1.75, Math.PI * 0.75, Math.PI * 0.25][q];
        const px = this.cx + Math.cos(angle) * this.radius * 0.6;
        const py = this.cy + Math.sin(angle) * this.radius * 0.6;
        for (let i = 0; i < 5; i++) {
            const a = Math.random() * Math.PI * 2;
            this.particles.push({
                x: px, y: py,
                vx: Math.cos(a) * (1 + Math.random() * 2),
                vy: Math.sin(a) * (1 + Math.random() * 2),
                color: this.brightColors[q],
                life: 1, size: 3 + Math.random() * 3
            });
        }

        this.playerSeq.push(q);
        const idx = this.playerSeq.length - 1;

        if (this.playerSeq[idx] !== this.sequence[idx]) {
            // Wrong!
            this.phase = 'gameover';
            this.playErrorTone();
            this.bestRound = Math.max(this.bestRound, this.round - 1);
            this.setScore(this.round - 1);

            this.addTimeout(() => {
                this.endGame();
                this.showOverlay('Game Over!', `You remembered ${this.round - 1} rounds`);
            }, 1000);
            return;
        }

        if (this.playerSeq.length === this.sequence.length) {
            // Round complete!
            this.setScore(this.round);
            this.pulseTimer = 20;

            // Success particles
            for (let i = 0; i < 20; i++) {
                const a = Math.random() * Math.PI * 2;
                this.particles.push({
                    x: this.cx, y: this.cy,
                    vx: Math.cos(a) * (2 + Math.random() * 4),
                    vy: Math.sin(a) * (2 + Math.random() * 4),
                    color: randChoice(this.brightColors),
                    life: 1, size: 3 + Math.random() * 3
                });
            }

            this.addTimeout(() => this.nextRound(), 800);
        }
    }

    update() {
        if (this.flashTimer > 0) this.flashTimer--;
        else this.flashIdx = -1;

        if (this.pulseTimer > 0) this.pulseTimer--;

        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.life -= 0.02;
            return p.life > 0;
        });
    }

    render() {
        this.clear('#0a0a16');
        const {ctx} = this;

        // Title/score
        this.text(`Round: ${this.round}`, this.cx, 35, 24, '#e0e0e0');
        this.text(`Score: ${this.score}`, this.cx, 60, 16, '#888');

        const phaseText = this.phase === 'watch' ? 'Watch...' : this.phase === 'play' ? 'Your turn!' : 'Game Over';
        this.text(phaseText, this.cx, this.canvas.height - 30, 18, this.phase === 'play' ? '#2ecc71' : '#888');

        // Draw four quadrants
        const drawQuad = (idx, startAngle, endAngle) => {
            const isFlash = this.flashIdx === idx;
            const color = isFlash ? this.brightColors[idx] : this.colors[idx];
            const darkColor = this.darkColors[idx];

            ctx.beginPath();
            ctx.moveTo(this.cx, this.cy);
            ctx.arc(this.cx, this.cy, this.radius, startAngle, endAngle);
            ctx.closePath();

            if (isFlash) {
                ctx.shadowColor = this.brightColors[idx];
                ctx.shadowBlur = 25;
            }

            ctx.fillStyle = color;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Inner darker ring
            ctx.beginPath();
            ctx.moveTo(this.cx, this.cy);
            ctx.arc(this.cx, this.cy, 50, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = '#0a0a16';
            ctx.fill();

            // Subtle border
            ctx.beginPath();
            ctx.moveTo(this.cx, this.cy);
            ctx.arc(this.cx, this.cy, this.radius, startAngle, endAngle);
            ctx.closePath();
            ctx.strokeStyle = isFlash ? '#fff' : darkColor;
            ctx.lineWidth = 2;
            ctx.stroke();
        };

        // 0: top-left (red), 1: top-right (green), 2: bottom-left (blue), 3: bottom-right (yellow)
        const g = 0.04; // gap in radians
        drawQuad(0, Math.PI + g, Math.PI * 1.5 - g);
        drawQuad(1, Math.PI * 1.5 + g, Math.PI * 2 - g);
        drawQuad(2, Math.PI * 0.5 + g, Math.PI - g);
        drawQuad(3, 0 + g, Math.PI * 0.5 - g);

        // Center circle
        const pulse = this.pulseTimer > 0 ? 1 + Math.sin(this.pulseTimer * 0.5) * 0.1 : 1;
        ctx.beginPath();
        ctx.arc(this.cx, this.cy, 45 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#15152a';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center text
        this.text(this.round.toString(), this.cx, this.cy + 8, 28, '#e0e0e0');

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

// Register puzzle3 games
Portal.register({id:'match3',name:'Match 3',category:'puzzle',icon:'\uD83D\uDC8E',color:'linear-gradient(135deg,#2a1a4a,#5a3a8a)',Game:Match3Game,canvasWidth:500,canvasHeight:560,tags:['gems','match','cascade']});
Portal.register({id:'bubbleshoot',name:'Bubble Shooter',category:'puzzle',icon:'\uD83E\uDEE7',color:'linear-gradient(135deg,#1a2a4a,#3a5a8a)',Game:BubbleShootGame,canvasWidth:500,canvasHeight:650,tags:['bubbles','shoot','pop']});
Portal.register({id:'sokoban',name:'Sokoban',category:'puzzle',icon:'\uD83D\uDCE6',color:'linear-gradient(135deg,#3a2a1a,#6a5a3a)',Game:SokobanGame,canvasWidth:600,canvasHeight:600,tags:['boxes','push','classic']});
Portal.register({id:'pathfinder',name:'Path Finder',category:'puzzle',icon:'\u2B50',color:'linear-gradient(135deg,#4a4a0a,#8a8a2a)',Game:PathFinderGame,canvasWidth:600,canvasHeight:600,tags:['path','stars','draw']});
Portal.register({id:'blockpuzzle',name:'Block Puzzle',category:'puzzle',icon:'\uD83D\uDFE6',color:'linear-gradient(135deg,#0a2a5a,#1a4a8a)',Game:BlockPuzzleGame,canvasWidth:600,canvasHeight:700,tags:['blocks','tetris','grid']});
Portal.register({id:'mahjong',name:'Mahjong Solitaire',category:'puzzle',icon:'\uD83C\uDC04',color:'linear-gradient(135deg,#4a1a1a,#8a3a3a)',Game:MahjongGame,canvasWidth:700,canvasHeight:600,tags:['tiles','matching','classic']});
Portal.register({id:'simon',name:'Simon Says',category:'puzzle',icon:'\uD83D\uDFE2',color:'linear-gradient(135deg,#1a3a1a,#3a6a3a)',Game:SimonGame,canvasWidth:500,canvasHeight:500,tags:['memory','colors','sequence']});
