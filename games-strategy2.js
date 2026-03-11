/* === STRATEGY GAMES 2 (3) === */

// BATTLESHIP
class BattleshipGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.gridSize = 10;
        this.cellSize = Math.floor(Math.min((this.canvas.width - 60) / 22, (this.canvas.height - 120) / 12));
        this.ships = [5, 4, 3, 3, 2];
        this.shipNames = ['Carrier', 'Battleship', 'Cruiser', 'Submarine', 'Destroyer'];
        // 0=empty, 1=ship, 2=miss, 3=hit
        this.playerBoard = Array.from({length: 10}, () => Array(10).fill(0));
        this.enemyBoard = Array.from({length: 10}, () => Array(10).fill(0));
        this.playerShots = Array.from({length: 10}, () => Array(10).fill(0)); // shots at enemy
        this.enemyShots = Array.from({length: 10}, () => Array(10).fill(0)); // shots at player
        this.playerShips = []; // [{cells:[{r,c}], size, sunk}]
        this.enemyShips = [];
        this.phase = 'place'; // 'place', 'play', 'over'
        this.placingIndex = 0;
        this.placingHorizontal = true;
        this.hoverCell = null;
        this.turn = 'player'; // 'player', 'enemy'
        this.message = 'Place your Carrier (5) - Click to place, R to rotate';
        this.shotsFired = 0;
        this.enemyShotsCount = 0;
        // AI hunt mode
        this.aiHits = []; // unresolved hits
        this.aiMode = 'hunt'; // 'hunt' or 'target'
        this.aiTargetQueue = [];
        // Place enemy ships randomly
        this.placeAIShips();
        this.leftOx = 15;
        this.leftOy = 60;
        this.rightOx = this.leftOx + this.gridSize * this.cellSize + 30;
        this.rightOy = 60;

        this.listenKey(e => {
            if (e.key === 'r' || e.key === 'R') {
                if (this.phase === 'place') this.placingHorizontal = !this.placingHorizontal;
            }
        });

        this.listenMouse('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            this.hoverCell = this.getCellAt(mx, my);
        });

        this.listenClick(e => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);

            if (this.phase === 'place') {
                this.handlePlacement(mx, my);
            } else if (this.phase === 'play' && this.turn === 'player') {
                this.handlePlayerShot(mx, my);
            }
        });

        this.ui.innerHTML = ''; this.loop();
    }

    getCellAt(mx, my) {
        // Check left grid (player board during placement)
        const lr = Math.floor((my - this.leftOy) / this.cellSize);
        const lc = Math.floor((mx - this.leftOx) / this.cellSize);
        if (lr >= 0 && lr < 10 && lc >= 0 && lc < 10) return { grid: 'left', r: lr, c: lc };
        // Check right grid (enemy board)
        const rr = Math.floor((my - this.rightOy) / this.cellSize);
        const rc = Math.floor((mx - this.rightOx) / this.cellSize);
        if (rr >= 0 && rr < 10 && rc >= 0 && rc < 10) return { grid: 'right', r: rr, c: rc };
        return null;
    }

    placeAIShips() {
        for (const size of this.ships) {
            let placed = false;
            while (!placed) {
                const horiz = Math.random() < 0.5;
                const r = randInt(0, horiz ? 9 : 10 - size);
                const c = randInt(0, horiz ? 10 - size : 9);
                const cells = [];
                let valid = true;
                for (let i = 0; i < size; i++) {
                    const cr = horiz ? r : r + i;
                    const cc = horiz ? c + i : c;
                    if (this.enemyBoard[cr][cc] !== 0) { valid = false; break; }
                    cells.push({ r: cr, c: cc });
                }
                if (valid) {
                    cells.forEach(cell => this.enemyBoard[cell.r][cell.c] = 1);
                    this.enemyShips.push({ cells, size, sunk: false });
                    placed = true;
                }
            }
        }
    }

    canPlaceShip(board, r, c, size, horizontal) {
        const cells = [];
        for (let i = 0; i < size; i++) {
            const cr = horizontal ? r : r + i;
            const cc = horizontal ? c + i : c;
            if (cr < 0 || cr >= 10 || cc < 0 || cc >= 10) return null;
            if (board[cr][cc] !== 0) return null;
            cells.push({ r: cr, c: cc });
        }
        return cells;
    }

    handlePlacement(mx, my) {
        const cell = this.getCellAt(mx, my);
        if (!cell || cell.grid !== 'left') return;
        const size = this.ships[this.placingIndex];
        const cells = this.canPlaceShip(this.playerBoard, cell.r, cell.c, size, this.placingHorizontal);
        if (!cells) return;
        cells.forEach(c => this.playerBoard[c.r][c.c] = 1);
        this.playerShips.push({ cells, size, sunk: false });
        this.placingIndex++;
        if (this.placingIndex >= this.ships.length) {
            this.phase = 'play';
            this.message = 'Fire at the enemy grid! Click a cell on the right.';
        } else {
            const name = this.shipNames[this.placingIndex];
            const sz = this.ships[this.placingIndex];
            this.message = `Place your ${name} (${sz}) - Click to place, R to rotate`;
        }
    }

    handlePlayerShot(mx, my) {
        const cell = this.getCellAt(mx, my);
        if (!cell || cell.grid !== 'right') return;
        if (this.playerShots[cell.r][cell.c] !== 0) return;
        this.shotsFired++;
        if (this.enemyBoard[cell.r][cell.c] === 1) {
            this.playerShots[cell.r][cell.c] = 3; // hit
            this.message = 'HIT!';
            // Check if sunk
            for (const ship of this.enemyShips) {
                if (ship.sunk) continue;
                const allHit = ship.cells.every(c => this.playerShots[c.r][c.c] === 3);
                if (allHit) {
                    ship.sunk = true;
                    this.setScore(this.score + ship.size * 100);
                    this.message = `You sunk a ${this.shipNames[this.ships.indexOf(ship.size)]}!`;
                }
            }
            // Check win
            if (this.enemyShips.every(s => s.sunk)) {
                this.phase = 'over';
                const bonus = Math.max(0, 2000 - this.shotsFired * 20);
                this.setScore(this.score + bonus);
                this.endGame();
                this.showOverlay('Victory!', `All enemy ships sunk in ${this.shotsFired} shots! Score: ${this.score}`);
                return;
            }
        } else {
            this.playerShots[cell.r][cell.c] = 2; // miss
            this.message = 'Miss...';
        }
        this.turn = 'enemy';
        this.addTimeout(() => this.aiShoot(), 600);
    }

    aiShoot() {
        if (this.phase === 'over') return;
        let r, c;

        if (this.aiTargetQueue.length > 0) {
            // Target mode: shoot adjacent to known hits
            let found = false;
            while (this.aiTargetQueue.length > 0 && !found) {
                const target = this.aiTargetQueue.shift();
                if (target.r >= 0 && target.r < 10 && target.c >= 0 && target.c < 10 &&
                    this.enemyShots[target.r][target.c] === 0) {
                    r = target.r; c = target.c;
                    found = true;
                }
            }
            if (!found) {
                // Fall back to hunt mode
                [r, c] = this.aiRandomShot();
            }
        } else {
            [r, c] = this.aiRandomShot();
        }

        this.enemyShotsCount++;
        if (this.playerBoard[r][c] === 1) {
            this.enemyShots[r][c] = 3; // hit
            this.aiHits.push({ r, c });
            // Add adjacent cells to target queue
            const adj = [{ r: r - 1, c }, { r: r + 1, c }, { r, c: c - 1 }, { r, c: c + 1 }];
            for (const a of adj) {
                if (a.r >= 0 && a.r < 10 && a.c >= 0 && a.c < 10 && this.enemyShots[a.r][a.c] === 0) {
                    if (!this.aiTargetQueue.some(t => t.r === a.r && t.c === a.c)) {
                        this.aiTargetQueue.push(a);
                    }
                }
            }
            // Check if ship sunk
            for (const ship of this.playerShips) {
                if (ship.sunk) continue;
                const allHit = ship.cells.every(cl => this.enemyShots[cl.r][cl.c] === 3);
                if (allHit) {
                    ship.sunk = true;
                    // Remove resolved hits from aiHits
                    this.aiHits = this.aiHits.filter(h => !ship.cells.some(cl => cl.r === h.r && cl.c === h.c));
                    // Clean target queue if no more unresolved hits
                    if (this.aiHits.length === 0) this.aiTargetQueue = [];
                }
            }
            // Check lose
            if (this.playerShips.every(s => s.sunk)) {
                this.phase = 'over';
                this.endGame();
                this.showOverlay('Defeat!', `The enemy sank all your ships! Score: ${this.score}`);
                return;
            }
        } else {
            this.enemyShots[r][c] = 2; // miss
        }
        this.turn = 'player';
        if (this.message === 'HIT!' || this.message.includes('sunk')) {
            // keep hit message briefly
        } else {
            this.message = 'Your turn - fire at the enemy grid!';
        }
    }

    aiRandomShot() {
        const available = [];
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                if (this.enemyShots[r][c] === 0) {
                    // Checkerboard pattern for efficiency
                    if ((r + c) % 2 === 0) available.push([r, c]);
                }
            }
        }
        if (available.length === 0) {
            // Fill in remaining
            for (let r = 0; r < 10; r++) {
                for (let c = 0; c < 10; c++) {
                    if (this.enemyShots[r][c] === 0) available.push([r, c]);
                }
            }
        }
        return randChoice(available);
    }

    update() {}

    render() {
        this.clear('#0a1525');
        const { ctx, cellSize: cs, leftOx, leftOy, rightOx, rightOy } = this;

        // Title labels
        this.text('YOUR FLEET', leftOx + 5 * cs, 20, 14, '#4fc3f7');
        this.text('ENEMY WATERS', rightOx + 5 * cs, 20, 14, '#e94560');
        this.text(this.message, this.canvas.width / 2, this.canvas.height - 15, 13, '#ffd54f');

        // Draw column/row labels
        const labels = 'ABCDEFGHIJ';
        for (let i = 0; i < 10; i++) {
            this.text(labels[i], leftOx + i * cs + cs / 2, leftOy - 6, 10, '#667');
            this.text(String(i + 1), leftOx - 10, leftOy + i * cs + cs / 2 + 4, 10, '#667');
            this.text(labels[i], rightOx + i * cs + cs / 2, rightOy - 6, 10, '#667');
            this.text(String(i + 1), rightOx - 10, rightOy + i * cs + cs / 2 + 4, 10, '#667');
        }

        // Draw left grid (player)
        this.drawGrid(leftOx, leftOy, cs, true);
        // Draw right grid (enemy)
        this.drawGrid(rightOx, rightOy, cs, false);

        // Ship placement preview
        if (this.phase === 'place' && this.hoverCell && this.hoverCell.grid === 'left') {
            const size = this.ships[this.placingIndex];
            const cells = this.canPlaceShip(this.playerBoard, this.hoverCell.r, this.hoverCell.c, size, this.placingHorizontal);
            if (cells) {
                ctx.fillStyle = 'rgba(76,195,247,0.4)';
                cells.forEach(cell => {
                    ctx.fillRect(leftOx + cell.c * cs + 1, leftOy + cell.r * cs + 1, cs - 2, cs - 2);
                });
            } else {
                // Invalid placement - show red
                for (let i = 0; i < size; i++) {
                    const cr = this.placingHorizontal ? this.hoverCell.r : this.hoverCell.r + i;
                    const cc = this.placingHorizontal ? this.hoverCell.c + i : this.hoverCell.c;
                    if (cr >= 0 && cr < 10 && cc >= 0 && cc < 10) {
                        ctx.fillStyle = 'rgba(233,69,96,0.3)';
                        ctx.fillRect(leftOx + cc * cs + 1, leftOy + cr * cs + 1, cs - 2, cs - 2);
                    }
                }
            }
        }

        // Hover highlight for shooting
        if (this.phase === 'play' && this.turn === 'player' && this.hoverCell && this.hoverCell.grid === 'right') {
            if (this.playerShots[this.hoverCell.r][this.hoverCell.c] === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillRect(rightOx + this.hoverCell.c * cs + 1, rightOy + this.hoverCell.r * cs + 1, cs - 2, cs - 2);
            }
        }

        // Ship status indicators
        const statusY = leftOy + 10 * cs + 14;
        this.text('Your ships:', leftOx + 40, statusY, 10, '#4fc3f7');
        this.text('Enemy ships:', rightOx + 40, statusY, 10, '#e94560');
        for (let i = 0; i < this.playerShips.length; i++) {
            const col = this.playerShips[i].sunk ? '#555' : '#4fc3f7';
            const txt = this.playerShips[i].sunk ? '(SUNK)' : '';
            this.text(`${this.shipNames[i]} ${txt}`, leftOx + 50, statusY + 14 + i * 12, 9, col);
        }
        let sunkCount = this.enemyShips.filter(s => s.sunk).length;
        this.text(`${sunkCount} / ${this.enemyShips.length} sunk`, rightOx + 50, statusY + 14, 10, '#e94560');
    }

    drawGrid(ox, oy, cs, isPlayer) {
        const { ctx } = this;
        // Background
        ctx.fillStyle = '#0a2040';
        ctx.fillRect(ox, oy, 10 * cs, 10 * cs);
        // Grid lines
        ctx.strokeStyle = '#1a3a5a'; ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            ctx.beginPath(); ctx.moveTo(ox + i * cs, oy); ctx.lineTo(ox + i * cs, oy + 10 * cs); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ox, oy + i * cs); ctx.lineTo(ox + 10 * cs, oy + i * cs); ctx.stroke();
        }

        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                const x = ox + c * cs, y = oy + r * cs;
                if (isPlayer) {
                    // Show own ships
                    if (this.playerBoard[r][c] === 1 && this.enemyShots[r][c] !== 3) {
                        ctx.fillStyle = '#2a6a9a';
                        ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);
                    }
                    // Show enemy hits on player board
                    if (this.enemyShots[r][c] === 3) {
                        ctx.fillStyle = '#c0392b';
                        ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);
                        this.drawX(x + cs / 2, y + cs / 2, cs * 0.3, '#fff');
                    } else if (this.enemyShots[r][c] === 2) {
                        ctx.fillStyle = '#555';
                        ctx.beginPath(); ctx.arc(x + cs / 2, y + cs / 2, cs * 0.15, 0, Math.PI * 2); ctx.fill();
                    }
                } else {
                    // Show player shots on enemy board
                    if (this.playerShots[r][c] === 3) {
                        ctx.fillStyle = '#c0392b';
                        ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);
                        this.drawX(x + cs / 2, y + cs / 2, cs * 0.3, '#fff');
                    } else if (this.playerShots[r][c] === 2) {
                        ctx.fillStyle = '#334';
                        ctx.beginPath(); ctx.arc(x + cs / 2, y + cs / 2, cs * 0.15, 0, Math.PI * 2); ctx.fill();
                    }
                    // Show sunk enemy ships
                    for (const ship of this.enemyShips) {
                        if (ship.sunk && ship.cells.some(cl => cl.r === r && cl.c === c)) {
                            ctx.fillStyle = '#8b0000';
                            ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
                            this.drawX(x + cs / 2, y + cs / 2, cs * 0.3, '#ff6666');
                        }
                    }
                }
            }
        }
    }

    drawX(x, y, size, color) {
        const { ctx } = this;
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - size, y - size); ctx.lineTo(x + size, y + size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + size, y - size); ctx.lineTo(x - size, y + size); ctx.stroke();
    }
}


// TOWER DEFENSE
class TowerDefenseGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.cols = 20; this.rows = 15;
        this.cellSize = Math.floor(Math.min((this.canvas.width - 160) / this.cols, (this.canvas.height - 40) / this.rows));
        this.gridOx = 10;
        this.gridOy = 10;
        this.gold = 100;
        this.lives = 20;
        this.wave = 0;
        this.waveActive = false;
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.particles = [];
        this.waveTimer = 0;
        this.spawnQueue = [];
        this.selectedTower = null;
        this.gameOver = false;
        this.waveDelay = 0;
        this.lastTime = Date.now();

        // Define path as waypoints (grid coords)
        this.path = [
            {c: 0, r: 7},
            {c: 4, r: 7},
            {c: 4, r: 2},
            {c: 8, r: 2},
            {c: 8, r: 12},
            {c: 12, r: 12},
            {c: 12, r: 4},
            {c: 16, r: 4},
            {c: 16, r: 10},
            {c: 19, r: 10}
        ];

        // Mark path cells
        this.pathCells = new Set();
        this.buildPathCells();

        // Tower types
        this.towerTypes = [
            { name: 'Arrow', cost: 25, range: 3.0, damage: 10, speed: 1.0, color: '#4fc3f7', key: '1' },
            { name: 'Cannon', cost: 50, range: 2.5, damage: 30, speed: 0.5, color: '#ff9800', key: '2' },
            { name: 'Sniper', cost: 75, range: 5.0, damage: 50, speed: 0.3, color: '#e94560', key: '3' }
        ];
        this.selectedType = 0;

        // Panel position
        this.panelX = this.gridOx + this.cols * this.cellSize + 10;

        this.listenClick(e => {
            if (this.gameOver) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);

            // Check tower type selection buttons
            for (let i = 0; i < this.towerTypes.length; i++) {
                const btnY = 120 + i * 50;
                if (mx >= this.panelX && mx <= this.panelX + 130 && my >= btnY && my <= btnY + 40) {
                    this.selectedType = i;
                    return;
                }
            }

            // Check start wave button
            if (!this.waveActive && mx >= this.panelX && mx <= this.panelX + 130 && my >= 300 && my <= 340) {
                this.startWave();
                return;
            }

            // Place tower on grid
            const gc = Math.floor((mx - this.gridOx) / this.cellSize);
            const gr = Math.floor((my - this.gridOy) / this.cellSize);
            if (gc >= 0 && gc < this.cols && gr >= 0 && gr < this.rows) {
                this.placeTower(gr, gc);
            }
        });

        this.listenKey(e => {
            if (e.key === '1') this.selectedType = 0;
            else if (e.key === '2') this.selectedType = 1;
            else if (e.key === '3') this.selectedType = 2;
            else if (e.key === ' ' && !this.waveActive && !this.gameOver) {
                e.preventDefault();
                this.startWave();
            }
        });

        this.listenMouse('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            this.mouseX = mx; this.mouseY = my;
        });
        this.mouseX = 0; this.mouseY = 0;

        this.ui.innerHTML = ''; this.loop();
    }

    buildPathCells() {
        for (let i = 0; i < this.path.length - 1; i++) {
            const a = this.path[i], b = this.path[i + 1];
            const dr = Math.sign(b.r - a.r), dc = Math.sign(b.c - a.c);
            let cr = a.r, cc = a.c;
            while (cr !== b.r || cc !== b.c) {
                this.pathCells.add(`${cr},${cc}`);
                cr += dr; cc += dc;
            }
            this.pathCells.add(`${b.r},${b.c}`);
        }
    }

    getPathPixels() {
        // Convert path waypoints to pixel coords (center of cells)
        const pts = [];
        for (let i = 0; i < this.path.length - 1; i++) {
            const a = this.path[i], b = this.path[i + 1];
            const dr = Math.sign(b.r - a.r), dc = Math.sign(b.c - a.c);
            let cr = a.r, cc = a.c;
            while (cr !== b.r || cc !== b.c) {
                pts.push({
                    x: this.gridOx + cc * this.cellSize + this.cellSize / 2,
                    y: this.gridOy + cr * this.cellSize + this.cellSize / 2
                });
                cr += dr; cc += dc;
            }
        }
        pts.push({
            x: this.gridOx + this.path[this.path.length - 1].c * this.cellSize + this.cellSize / 2,
            y: this.gridOy + this.path[this.path.length - 1].r * this.cellSize + this.cellSize / 2
        });
        return pts;
    }

    placeTower(r, c) {
        const type = this.towerTypes[this.selectedType];
        if (this.gold < type.cost) return;
        if (this.pathCells.has(`${r},${c}`)) return;
        if (this.towers.some(t => t.r === r && t.c === c)) return;

        this.gold -= type.cost;
        this.towers.push({
            r, c,
            x: this.gridOx + c * this.cellSize + this.cellSize / 2,
            y: this.gridOy + r * this.cellSize + this.cellSize / 2,
            type: this.selectedType,
            range: type.range * this.cellSize,
            damage: type.damage,
            fireRate: type.speed,
            cooldown: 0,
            color: type.color,
            name: type.name,
            angle: 0
        });
    }

    startWave() {
        this.wave++;
        this.waveActive = true;
        const count = 5 + this.wave * 3;
        const hp = 30 + this.wave * 20;
        const speed = 1.0 + this.wave * 0.1;
        this.spawnQueue = [];
        for (let i = 0; i < count; i++) {
            let type = 'normal';
            let hpMult = 1, spdMult = 1, sizeMult = 1, color = '#e74c3c';
            if (this.wave >= 3 && Math.random() < 0.2) {
                type = 'fast'; spdMult = 1.8; hpMult = 0.5; sizeMult = 0.7; color = '#f1c40f';
            }
            if (this.wave >= 5 && Math.random() < 0.15) {
                type = 'tank'; spdMult = 0.5; hpMult = 3; sizeMult = 1.3; color = '#8e44ad';
            }
            this.spawnQueue.push({
                hp: hp * hpMult,
                maxHp: hp * hpMult,
                speed: speed * spdMult,
                size: this.cellSize * 0.35 * sizeMult,
                color,
                type,
                delay: i * 0.5
            });
        }
        this.waveTimer = 0;
    }

    update() {
        const now = Date.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;
        if (this.gameOver) return;

        const pathPts = this.getPathPixels();

        // Spawn enemies
        if (this.waveActive && this.spawnQueue.length > 0) {
            this.waveTimer += dt;
            while (this.spawnQueue.length > 0 && this.waveTimer >= this.spawnQueue[0].delay) {
                const def = this.spawnQueue.shift();
                this.enemies.push({
                    x: pathPts[0].x, y: pathPts[0].y,
                    pathIndex: 0,
                    hp: def.hp, maxHp: def.maxHp,
                    speed: def.speed * this.cellSize * 2,
                    size: def.size,
                    color: def.color,
                    type: def.type
                });
            }
        }

        // Move enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const en = this.enemies[i];
            if (en.pathIndex >= pathPts.length - 1) {
                // Reached end
                this.lives--;
                this.enemies.splice(i, 1);
                if (this.lives <= 0) {
                    this.gameOver = true;
                    this.endGame();
                    this.showOverlay('Game Over!', `Survived ${this.wave} waves | Score: ${this.score}`);
                    return;
                }
                continue;
            }
            const target = pathPts[en.pathIndex + 1];
            const dx = target.x - en.x, dy = target.y - en.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const move = en.speed * dt;
            if (dist <= move) {
                en.x = target.x; en.y = target.y;
                en.pathIndex++;
            } else {
                en.x += (dx / dist) * move;
                en.y += (dy / dist) * move;
            }
        }

        // Tower shooting
        for (const tower of this.towers) {
            tower.cooldown -= dt;
            if (tower.cooldown > 0) continue;

            // Find closest enemy in range
            let closest = null, closestDist = Infinity;
            for (const en of this.enemies) {
                const d = Math.sqrt((en.x - tower.x) ** 2 + (en.y - tower.y) ** 2);
                if (d <= tower.range && d < closestDist) {
                    closest = en; closestDist = d;
                }
            }
            if (closest) {
                tower.cooldown = 1 / tower.fireRate;
                tower.angle = Math.atan2(closest.y - tower.y, closest.x - tower.x);
                this.projectiles.push({
                    x: tower.x, y: tower.y,
                    tx: closest.x, ty: closest.y,
                    target: closest,
                    speed: this.cellSize * 12,
                    damage: tower.damage,
                    color: tower.color
                });
            }
        }

        // Move projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            const dx = p.tx - p.x, dy = p.ty - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const move = p.speed * dt;
            if (dist <= move) {
                // Hit
                if (p.target && p.target.hp > 0) {
                    p.target.hp -= p.damage;
                    // Spawn particles
                    for (let j = 0; j < 4; j++) {
                        this.particles.push({
                            x: p.tx, y: p.ty,
                            vx: (Math.random() - 0.5) * 80,
                            vy: (Math.random() - 0.5) * 80,
                            life: 0.3 + Math.random() * 0.2,
                            color: p.color, size: 2
                        });
                    }
                    if (p.target.hp <= 0) {
                        const reward = p.target.type === 'tank' ? 15 : p.target.type === 'fast' ? 8 : 10;
                        this.gold += reward;
                        this.setScore(this.score + reward * 5);
                        const idx = this.enemies.indexOf(p.target);
                        if (idx >= 0) {
                            // Death particles
                            for (let j = 0; j < 8; j++) {
                                this.particles.push({
                                    x: p.target.x, y: p.target.y,
                                    vx: (Math.random() - 0.5) * 120,
                                    vy: (Math.random() - 0.5) * 120,
                                    life: 0.4 + Math.random() * 0.3,
                                    color: p.target.color, size: 3
                                });
                            }
                            this.enemies.splice(idx, 1);
                        }
                    }
                }
                this.projectiles.splice(i, 1);
            } else {
                p.x += (dx / dist) * move;
                p.y += (dy / dist) * move;
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Check wave end
        if (this.waveActive && this.spawnQueue.length === 0 && this.enemies.length === 0) {
            this.waveActive = false;
            this.gold += 20 + this.wave * 5;
            this.setScore(this.score + this.wave * 50);
        }
    }

    render() {
        this.clear('#1a1008');
        const { ctx, cellSize: cs, gridOx: ox, gridOy: oy, cols, rows } = this;

        // Draw ground
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = ox + c * cs, y = oy + r * cs;
                if (this.pathCells.has(`${r},${c}`)) {
                    ctx.fillStyle = '#3d2b1a';
                } else {
                    ctx.fillStyle = (r + c) % 2 === 0 ? '#1a3a15' : '#1d3d18';
                }
                ctx.fillRect(x, y, cs, cs);
            }
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 0.5;
        for (let i = 0; i <= cols; i++) {
            ctx.beginPath(); ctx.moveTo(ox + i * cs, oy); ctx.lineTo(ox + i * cs, oy + rows * cs); ctx.stroke();
        }
        for (let i = 0; i <= rows; i++) {
            ctx.beginPath(); ctx.moveTo(ox, oy + i * cs); ctx.lineTo(ox + cols * cs, oy + i * cs); ctx.stroke();
        }

        // Path direction arrows
        const pathPts = this.getPathPixels();
        ctx.fillStyle = 'rgba(255,255,200,0.1)';
        for (let i = 0; i < pathPts.length - 1; i += 3) {
            const a = pathPts[i], b = pathPts[Math.min(i + 1, pathPts.length - 1)];
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(angle);
            ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-3, -3); ctx.lineTo(-3, 3); ctx.closePath(); ctx.fill();
            ctx.restore();
        }

        // Draw towers
        for (const tower of this.towers) {
            // Range circle on hover
            const gc = Math.floor((this.mouseX - ox) / cs);
            const gr = Math.floor((this.mouseY - oy) / cs);
            if (gc === tower.c && gr === tower.r) {
                ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2); ctx.stroke();
            }
            // Tower base
            ctx.fillStyle = '#444';
            ctx.fillRect(tower.x - cs * 0.35, tower.y - cs * 0.35, cs * 0.7, cs * 0.7);
            ctx.fillStyle = tower.color;
            ctx.fillRect(tower.x - cs * 0.25, tower.y - cs * 0.25, cs * 0.5, cs * 0.5);
            // Barrel
            ctx.strokeStyle = tower.color; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(tower.x, tower.y);
            ctx.lineTo(tower.x + Math.cos(tower.angle) * cs * 0.4, tower.y + Math.sin(tower.angle) * cs * 0.4);
            ctx.stroke();
        }

        // Tower placement preview
        if (!this.gameOver) {
            const gc = Math.floor((this.mouseX - ox) / cs);
            const gr = Math.floor((this.mouseY - oy) / cs);
            if (gc >= 0 && gc < cols && gr >= 0 && gr < rows) {
                const blocked = this.pathCells.has(`${gr},${gc}`) || this.towers.some(t => t.r === gr && t.c === gc);
                const canAfford = this.gold >= this.towerTypes[this.selectedType].cost;
                if (!blocked && canAfford) {
                    ctx.fillStyle = 'rgba(76,195,247,0.2)';
                    ctx.fillRect(ox + gc * cs, oy + gr * cs, cs, cs);
                    // Range preview
                    ctx.strokeStyle = 'rgba(76,195,247,0.2)'; ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(ox + gc * cs + cs / 2, oy + gr * cs + cs / 2,
                        this.towerTypes[this.selectedType].range * cs, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }

        // Draw enemies
        for (const en of this.enemies) {
            // HP bar
            const barW = en.size * 2, barH = 3;
            ctx.fillStyle = '#333';
            ctx.fillRect(en.x - barW / 2, en.y - en.size - 6, barW, barH);
            ctx.fillStyle = en.hp > en.maxHp * 0.5 ? '#2ecc71' : en.hp > en.maxHp * 0.25 ? '#f39c12' : '#e74c3c';
            ctx.fillRect(en.x - barW / 2, en.y - en.size - 6, barW * (en.hp / en.maxHp), barH);
            // Body
            ctx.fillStyle = en.color;
            ctx.beginPath(); ctx.arc(en.x, en.y, en.size, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(en.x, en.y, en.size, 0, Math.PI * 2); ctx.stroke();
        }

        // Draw projectiles
        for (const p of this.projectiles) {
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
        }

        // Draw particles
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.life / 0.5);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;

        // UI Panel
        const px = this.panelX;
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(px - 5, 5, 145, this.canvas.height - 10);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        ctx.strokeRect(px - 5, 5, 145, this.canvas.height - 10);

        this.text('TOWER DEFENSE', px + 65, 28, 12, '#ffd54f');

        this.text(`Wave: ${this.wave}`, px + 65, 52, 13, '#e0e0e0');
        this.text(`Gold: ${this.gold}`, px + 65, 70, 13, '#ffd54f');
        this.text(`Lives: ${this.lives}`, px + 65, 88, 13, this.lives > 5 ? '#2ecc71' : '#e74c3c');
        this.text(`Score: ${this.score}`, px + 65, 106, 11, '#aaa');

        // Tower buttons
        for (let i = 0; i < this.towerTypes.length; i++) {
            const t = this.towerTypes[i];
            const by = 120 + i * 50;
            ctx.fillStyle = i === this.selectedType ? '#2a2a4a' : '#1a1a2a';
            ctx.strokeStyle = i === this.selectedType ? t.color : '#333';
            ctx.lineWidth = i === this.selectedType ? 2 : 1;
            ctx.beginPath(); ctx.roundRect(px, by, 130, 40, 4); ctx.fill(); ctx.stroke();
            ctx.fillStyle = t.color;
            ctx.fillRect(px + 8, by + 12, 16, 16);
            this.text(t.name, px + 60, by + 16, 11, '#e0e0e0');
            this.text(`$${t.cost}`, px + 60, by + 30, 10, this.gold >= t.cost ? '#ffd54f' : '#666');
            this.text(`[${t.key}]`, px + 115, by + 16, 9, '#555');
        }

        // Stats
        this.text('DMG / RATE / RNG', px + 65, 282, 8, '#666');
        const st = this.towerTypes[this.selectedType];
        this.text(`${st.damage} / ${st.speed.toFixed(1)}/s / ${st.range.toFixed(1)}`, px + 65, 294, 9, '#999');

        // Start wave button
        if (!this.waveActive) {
            ctx.fillStyle = '#1a4a2a'; ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(px, 300, 130, 40, 6); ctx.fill(); ctx.stroke();
            this.text(`Start Wave ${this.wave + 1}`, px + 65, 324, 13, '#2ecc71');
            this.text('[SPACE]', px + 65, 336, 8, '#555');
        } else {
            this.text(`Wave ${this.wave}`, px + 65, 320, 13, '#e94560');
            this.text(`${this.enemies.length + this.spawnQueue.length} left`, px + 65, 336, 10, '#999');
        }

        // Enemy types legend
        this.text('Enemy Types:', px + 65, 370, 9, '#888');
        ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(px + 12, 383, 5, 0, Math.PI * 2); ctx.fill();
        this.text('Normal', px + 75, 386, 9, '#aaa');
        if (this.wave >= 3) {
            ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.arc(px + 12, 398, 4, 0, Math.PI * 2); ctx.fill();
            this.text('Fast (low HP)', px + 75, 401, 9, '#aaa');
        }
        if (this.wave >= 5) {
            ctx.fillStyle = '#8e44ad'; ctx.beginPath(); ctx.arc(px + 12, 413, 6, 0, Math.PI * 2); ctx.fill();
            this.text('Tank (slow)', px + 75, 416, 9, '#aaa');
        }
    }
}


// NIM
class NimGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.rows = [1, 3, 5, 7];
        this.maxPerRow = [...this.rows];
        this.selectedRow = -1;
        this.selectedCount = 0;
        this.hoverRow = -1;
        this.hoverCount = 0;
        this.turn = 'player'; // 'player' or 'ai'
        this.dead = false;
        this.message = 'Click stones to select, then click "Take" to remove them';
        this.gamesWon = 0;
        this.totalGames = 0;
        this.aiThinking = false;
        this.animating = false;
        this.removeAnim = []; // [{row, idx, progress}]

        // Layout
        this.stoneSize = 22;
        this.rowSpacing = 80;
        this.startY = 100;

        this.listenClick(e => {
            if (this.dead || this.turn !== 'player' || this.aiThinking || this.animating) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);

            // Check "Take" button
            if (this.selectedRow >= 0 && this.selectedCount > 0) {
                const btnX = this.canvas.width / 2 - 50;
                const btnY = this.startY + this.rows.length * this.rowSpacing + 10;
                if (mx >= btnX && mx <= btnX + 100 && my >= btnY && my <= btnY + 36) {
                    this.playerTake();
                    return;
                }
            }

            // Check stone clicks
            for (let row = 0; row < this.rows.length; row++) {
                if (this.rows[row] === 0) continue;
                const count = this.rows[row];
                const totalW = count * (this.stoneSize * 2 + 8) - 8;
                const startX = (this.canvas.width - totalW) / 2;
                const y = this.startY + row * this.rowSpacing;

                for (let i = 0; i < count; i++) {
                    const sx = startX + i * (this.stoneSize * 2 + 8) + this.stoneSize;
                    const sy = y + this.stoneSize;
                    const dist = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
                    if (dist <= this.stoneSize + 4) {
                        // If clicking a different row, reset
                        if (this.selectedRow >= 0 && this.selectedRow !== row) {
                            this.selectedCount = 0;
                        }
                        this.selectedRow = row;
                        // Toggle selection: select from rightmost. Clicking selects 1..n from right
                        const fromRight = count - 1 - i; // 0 = rightmost
                        this.selectedCount = fromRight + 1;
                        return;
                    }
                }
            }

            // Clicking elsewhere deselects
            this.selectedRow = -1;
            this.selectedCount = 0;
        });

        this.listenMouse('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            this.hoverRow = -1; this.hoverCount = 0;

            for (let row = 0; row < this.rows.length; row++) {
                if (this.rows[row] === 0) continue;
                const count = this.rows[row];
                const totalW = count * (this.stoneSize * 2 + 8) - 8;
                const startX = (this.canvas.width - totalW) / 2;
                const y = this.startY + row * this.rowSpacing;
                for (let i = 0; i < count; i++) {
                    const sx = startX + i * (this.stoneSize * 2 + 8) + this.stoneSize;
                    const sy = y + this.stoneSize;
                    const dist = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
                    if (dist <= this.stoneSize + 4) {
                        this.hoverRow = row;
                        this.hoverCount = count - i; // hover shows how many from right
                        break;
                    }
                }
                if (this.hoverRow >= 0) break;
            }
        });

        this.listenKey(e => {
            if (this.dead && (e.key === 'Enter' || e.key === ' ')) {
                // Already handled by overlay button
            }
        });

        this.ui.innerHTML = ''; this.loop();
    }

    playerTake() {
        if (this.selectedRow < 0 || this.selectedCount <= 0) return;
        if (this.selectedCount > this.rows[this.selectedRow]) return;

        this.takeStones(this.selectedRow, this.selectedCount);
        this.selectedRow = -1; this.selectedCount = 0;

        if (this.checkEnd('player')) return;
        this.turn = 'ai';
        this.message = 'AI is thinking...';
        this.aiThinking = true;
        this.addTimeout(() => this.aiTake(), 800);
    }

    takeStones(row, count) {
        this.rows[row] -= count;
    }

    aiTake() {
        this.aiThinking = false;
        if (this.dead) return;

        // Optimal Nim strategy: compute XOR (nim-sum)
        let nimSum = 0;
        for (const r of this.rows) nimSum ^= r;

        let moveRow = -1, moveCount = 0;

        if (nimSum !== 0) {
            // Winning position: find a row where we can make nim-sum = 0
            for (let i = 0; i < this.rows.length; i++) {
                const target = this.rows[i] ^ nimSum;
                if (target < this.rows[i]) {
                    moveRow = i;
                    moveCount = this.rows[i] - target;

                    // Special case: if this would leave all remaining rows at 0 or 1,
                    // we need to think about misere (last-to-take loses)
                    const afterRows = [...this.rows];
                    afterRows[i] -= moveCount;
                    const nonZero = afterRows.filter(r => r > 0);
                    const allOnesOrZero = afterRows.every(r => r <= 1);
                    if (allOnesOrZero) {
                        // In misere Nim, we want odd number of rows with 1
                        const onesCount = afterRows.filter(r => r === 1).length;
                        if (onesCount % 2 === 0) {
                            // Bad - we want odd. Try taking one more or one less
                            if (moveCount < this.rows[i]) {
                                moveCount++; // take one more to flip parity
                            } else if (moveCount > 1) {
                                moveCount--; // take one less
                            }
                        }
                    }
                    break;
                }
            }
        }

        if (moveRow === -1) {
            // Losing position: make a random move
            const available = [];
            for (let i = 0; i < this.rows.length; i++) {
                if (this.rows[i] > 0) available.push(i);
            }
            moveRow = randChoice(available);
            moveCount = randInt(1, Math.min(this.rows[moveRow], 2));
        }

        this.takeStones(moveRow, moveCount);
        this.message = `AI took ${moveCount} from row ${moveRow + 1}`;

        if (this.checkEnd('ai')) return;
        this.turn = 'player';
        this.addTimeout(() => {
            this.message = 'Your turn - click stones to select, then click Take';
        }, 1500);
    }

    checkEnd(lastPlayer) {
        const total = this.rows.reduce((a, b) => a + b, 0);
        if (total === 0) {
            // Last to take loses (misere rules)
            this.dead = true;
            this.totalGames++;
            if (lastPlayer === 'player') {
                // Player took last stone -> player loses
                this.message = 'You took the last stone - you lose!';
                this.endGame();
                this.showOverlay('You Lose!', `You took the last stone. Score: ${this.score}`);
            } else {
                // AI took last stone -> AI loses
                this.gamesWon++;
                const bonus = 200 + this.gamesWon * 100;
                this.setScore(this.score + bonus);
                this.message = 'AI took the last stone - you win!';
                // Start new round with harder configuration
                this.addTimeout(() => {
                    this.dead = false;
                    this.turn = 'player';
                    // Increase difficulty
                    const configs = [
                        [1, 3, 5, 7],
                        [2, 3, 4, 5],
                        [1, 4, 5, 6],
                        [3, 4, 5, 7],
                        [2, 5, 6, 7],
                        [1, 3, 5, 7, 9]
                    ];
                    const cfg = configs[Math.min(this.gamesWon, configs.length - 1)];
                    this.rows = [...cfg];
                    this.maxPerRow = [...cfg];
                    this.message = `Round ${this.gamesWon + 1}! Your turn.`;
                }, 2000);
            }
            return true;
        }
        return false;
    }

    update() {}

    render() {
        this.clear('#12122a');
        const { ctx } = this;
        const W = this.canvas.width, H = this.canvas.height;

        // Title
        this.text('N I M', W / 2, 30, 24, '#b0b0ff');
        this.text(`Round ${this.gamesWon + 1}  |  Score: ${this.score}`, W / 2, 55, 13, '#888');

        // Rules reminder
        this.text('Remove any number from one row. Last to take LOSES.', W / 2, 75, 11, '#666');

        // Draw rows of stones
        for (let row = 0; row < this.rows.length; row++) {
            const count = this.rows[row];
            const maxCount = this.maxPerRow[row];
            const totalW = maxCount * (this.stoneSize * 2 + 8) - 8;
            const startX = (W - totalW) / 2;
            const y = this.startY + row * this.rowSpacing;

            // Row label
            this.text(`Row ${row + 1}`, startX - 35, y + this.stoneSize + 5, 12, '#667');

            // Draw stones
            for (let i = 0; i < maxCount; i++) {
                const sx = startX + i * (this.stoneSize * 2 + 8) + this.stoneSize;
                const sy = y + this.stoneSize;

                if (i >= count) {
                    // Empty slot - ghost stone
                    ctx.strokeStyle = '#2a2a4a'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.arc(sx, sy, this.stoneSize, 0, Math.PI * 2); ctx.stroke();
                    continue;
                }

                const fromRight = count - 1 - i;
                const isSelected = this.selectedRow === row && fromRight < this.selectedCount;
                const isHovered = this.hoverRow === row && fromRight < this.hoverCount && this.selectedRow < 0;

                // Stone shadow
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath(); ctx.arc(sx + 2, sy + 2, this.stoneSize, 0, Math.PI * 2); ctx.fill();

                // Stone body
                if (isSelected) {
                    ctx.fillStyle = '#e94560';
                } else if (isHovered) {
                    ctx.fillStyle = '#6a6aaa';
                } else {
                    ctx.fillStyle = '#4a4a8a';
                }
                ctx.beginPath(); ctx.arc(sx, sy, this.stoneSize, 0, Math.PI * 2); ctx.fill();

                // Stone highlight
                ctx.fillStyle = isSelected ? 'rgba(255,150,150,0.3)' : 'rgba(255,255,255,0.15)';
                ctx.beginPath(); ctx.arc(sx - 5, sy - 5, this.stoneSize * 0.5, 0, Math.PI * 2); ctx.fill();

                // Stone border
                ctx.strokeStyle = isSelected ? '#ff8a9e' : '#6a6aaa';
                ctx.lineWidth = isSelected ? 2 : 1;
                ctx.beginPath(); ctx.arc(sx, sy, this.stoneSize, 0, Math.PI * 2); ctx.stroke();
            }
        }

        // Take button
        if (this.selectedRow >= 0 && this.selectedCount > 0 && this.turn === 'player' && !this.dead) {
            const btnX = W / 2 - 50;
            const btnY = this.startY + this.rows.length * this.rowSpacing + 10;
            ctx.fillStyle = '#2a4a2a'; ctx.strokeStyle = '#4fc34f'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(btnX, btnY, 100, 36, 6); ctx.fill(); ctx.stroke();
            this.text(`Take ${this.selectedCount}`, W / 2, btnY + 22, 14, '#4fc34f');
        }

        // Turn indicator / message
        const msgY = H - 30;
        const msgColor = this.turn === 'player' ? '#4fc3f7' : '#ffd54f';
        this.text(this.message, W / 2, msgY, 13, this.dead ? '#e94560' : msgColor);

        // Turn indicator at top
        if (!this.dead) {
            const turnText = this.turn === 'player' ? 'YOUR TURN' : 'AI TURN';
            const turnColor = this.turn === 'player' ? '#4fc3f7' : '#ffd54f';
            ctx.fillStyle = turnColor; ctx.globalAlpha = 0.15;
            ctx.beginPath(); ctx.roundRect(W / 2 - 50, 3, 100, 18, 4); ctx.fill();
            ctx.globalAlpha = 1;
            this.text(turnText, W / 2, 16, 10, turnColor);
        }
    }
}


// Register strategy games 2
Portal.register({ id: 'battleship', name: 'Battleship', category: 'strategy', icon: '\u{1F6A2}', color: 'linear-gradient(135deg,#0a2a4a,#1a4a7a)', Game: BattleshipGame, canvasWidth: 800, canvasHeight: 500, tags: ['board', 'naval', 'classic'] });
Portal.register({ id: 'towerdef', name: 'Tower Defense', category: 'strategy', icon: '\u{1F3F0}', color: 'linear-gradient(135deg,#2a1a0a,#5a3a1a)', Game: TowerDefenseGame, canvasWidth: 800, canvasHeight: 600, tags: ['tower', 'defense', 'waves'] });
Portal.register({ id: 'nim', name: 'Nim', category: 'strategy', icon: '\u{1F3B2}', color: 'linear-gradient(135deg,#1a1a3a,#3a3a6a)', Game: NimGame, canvasWidth: 600, canvasHeight: 500, tags: ['math', 'classic', 'logic'] });
