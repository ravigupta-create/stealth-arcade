/* === ARCADE GAMES 2 (5) === */

// 1. MAZE RUNNER
class MazeRunnerGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.cellSize = 40;
        this.cols = Math.floor(W / this.cellSize);
        this.rows = Math.floor(H / this.cellSize);
        // Ensure odd dimensions for maze generation
        if (this.cols % 2 === 0) this.cols--;
        if (this.rows % 2 === 0) this.rows--;
        this.ox = Math.floor((W - this.cols * this.cellSize) / 2);
        this.oy = Math.floor((H - this.rows * this.cellSize) / 2);
        this.generateMaze();
        this.player = { x: 1, y: 1 };
        this.exit = { x: this.cols - 2, y: this.rows - 2 };
        this.maze[this.exit.y][this.exit.x] = 0;
        this.maze[this.player.y][this.player.x] = 0;
        this.startTime = performance.now();
        this.elapsed = 0;
        this.dead = false;
        this.level = 1;
        this.totalScore = 0;
        this.trail = [{ x: 1, y: 1 }];
        this.keys = {};
        this.moveDelay = 120;
        this.lastMove = 0;
        this.listenKey(e => {
            this.keys[e.key] = true;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
        });
        document.addEventListener('keyup', this._ku = e => this.keys[e.key] = false);
        this.ui.innerHTML = '';
        this.loop();
    }
    stop() { super.stop(); document.removeEventListener('keyup', this._ku); }
    generateMaze() {
        // Initialize all walls
        this.maze = Array.from({ length: this.rows }, () => Array(this.cols).fill(1));
        // Recursive backtracker
        const stack = [];
        const startX = 1, startY = 1;
        this.maze[startY][startX] = 0;
        stack.push({ x: startX, y: startY });
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = [];
            const dirs = [
                { dx: 0, dy: -2 }, { dx: 0, dy: 2 },
                { dx: -2, dy: 0 }, { dx: 2, dy: 0 }
            ];
            for (const d of dirs) {
                const nx = current.x + d.dx;
                const ny = current.y + d.dy;
                if (nx > 0 && nx < this.cols - 1 && ny > 0 && ny < this.rows - 1 && this.maze[ny][nx] === 1) {
                    neighbors.push({ x: nx, y: ny, wx: current.x + d.dx / 2, wy: current.y + d.dy / 2 });
                }
            }
            if (neighbors.length > 0) {
                const next = randChoice(neighbors);
                this.maze[next.wy][next.wx] = 0;
                this.maze[next.y][next.x] = 0;
                stack.push({ x: next.x, y: next.y });
            } else {
                stack.pop();
            }
        }
    }
    update() {
        if (this.dead) return;
        const now = performance.now();
        this.elapsed = (now - this.startTime) / 1000;
        if (now - this.lastMove < this.moveDelay) return;
        let dx = 0, dy = 0;
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) dy = -1;
        else if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) dy = 1;
        else if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) dx = -1;
        else if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) dx = 1;
        if (dx === 0 && dy === 0) return;
        const nx = this.player.x + dx;
        const ny = this.player.y + dy;
        if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows && this.maze[ny][nx] === 0) {
            this.player.x = nx;
            this.player.y = ny;
            this.lastMove = now;
            this.trail.push({ x: nx, y: ny });
            if (this.trail.length > 200) this.trail.shift();
            // Check win
            if (nx === this.exit.x && ny === this.exit.y) {
                const timeBonus = Math.max(10, Math.round(500 - this.elapsed * 5));
                const levelBonus = this.level * 100;
                this.totalScore += timeBonus + levelBonus;
                this.setScore(this.totalScore);
                this.level++;
                if (this.level > 5) {
                    this.dead = true;
                    this.endGame();
                    this.showOverlay('You Win!', `All 5 mazes cleared! Score: ${this.totalScore}`);
                } else {
                    // Next level with smaller cells
                    this.cellSize = Math.max(20, 40 - (this.level - 1) * 4);
                    this.cols = Math.floor(this.canvas.width / this.cellSize);
                    this.rows = Math.floor(this.canvas.height / this.cellSize);
                    if (this.cols % 2 === 0) this.cols--;
                    if (this.rows % 2 === 0) this.rows--;
                    this.ox = Math.floor((this.canvas.width - this.cols * this.cellSize) / 2);
                    this.oy = Math.floor((this.canvas.height - this.rows * this.cellSize) / 2);
                    this.generateMaze();
                    this.player = { x: 1, y: 1 };
                    this.exit = { x: this.cols - 2, y: this.rows - 2 };
                    this.maze[this.exit.y][this.exit.x] = 0;
                    this.maze[this.player.y][this.player.x] = 0;
                    this.startTime = performance.now();
                    this.trail = [{ x: 1, y: 1 }];
                }
            }
        }
    }
    render() {
        const { ctx, cellSize, cols, rows, ox, oy } = this;
        this.clear('#0a1a10');
        // Draw maze
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const px = ox + c * cellSize;
                const py = oy + r * cellSize;
                if (this.maze[r][c] === 1) {
                    ctx.fillStyle = '#1a4a2a';
                    ctx.fillRect(px, py, cellSize, cellSize);
                    ctx.fillStyle = '#2a6a4a';
                    ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
                } else {
                    ctx.fillStyle = '#0d1f12';
                    ctx.fillRect(px, py, cellSize, cellSize);
                }
            }
        }
        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = 0.1 + (i / this.trail.length) * 0.3;
            ctx.fillStyle = `rgba(100, 255, 150, ${alpha})`;
            const margin = cellSize * 0.3;
            ctx.fillRect(ox + t.x * cellSize + margin, oy + t.y * cellSize + margin, cellSize - margin * 2, cellSize - margin * 2);
        }
        // Draw exit
        const ex = ox + this.exit.x * cellSize;
        const ey = oy + this.exit.y * cellSize;
        const pulse = 0.6 + Math.sin(performance.now() / 300) * 0.4;
        ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.fillRect(ex + 2, ey + 2, cellSize - 4, cellSize - 4);
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.floor(cellSize * 0.6)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('EXIT', ex + cellSize / 2, ey + cellSize * 0.7);
        // Draw player
        const px = ox + this.player.x * cellSize + cellSize / 2;
        const py = oy + this.player.y * cellSize + cellSize / 2;
        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath();
        ctx.arc(px, py, cellSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(px - cellSize * 0.1, py - cellSize * 0.05, cellSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + cellSize * 0.1, py - cellSize * 0.05, cellSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        // HUD
        this.text(`Level ${this.level}/5`, this.canvas.width / 2, 20, 16, '#7bed9f');
        this.text(`Time: ${this.elapsed.toFixed(1)}s`, this.canvas.width - 80, 20, 14, '#aaa');
        this.text(`Score: ${this.totalScore}`, 80, 20, 14, '#aaa');
    }
}

// 2. COLOR SWITCH
class ColorSwitchGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.colors = ['#e94560', '#4fc3f7', '#7bed9f', '#ffd54f'];
        this.ball = {
            x: W / 2,
            y: H * 0.7,
            vy: 0,
            r: 12,
            color: this.colors[0]
        };
        this.gravity = 0.3;
        this.jumpForce = -8;
        this.camera = 0;
        this.dead = false;
        this.obstacles = [];
        this.stars = [];
        this.switchers = [];
        this.spawnHeight = H * 0.5;
        // Generate initial obstacles
        for (let i = 0; i < 6; i++) {
            this.addObstacle(this.spawnHeight - i * 180);
        }
        this.listenKey(e => {
            if (this.dead) return;
            if (e.key === ' ' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.ball.vy = this.jumpForce;
            }
        });
        this.listenClick(e => {
            if (this.dead) return;
            this.ball.vy = this.jumpForce;
        });
        this.ui.innerHTML = '';
        this.loop();
    }
    addObstacle(y) {
        const W = this.canvas.width;
        const type = randChoice(['ring', 'bars', 'cross']);
        this.obstacles.push({
            x: W / 2,
            y: y,
            type: type,
            angle: Math.random() * Math.PI * 2,
            speed: 0.02 + Math.random() * 0.015,
            radius: type === 'ring' ? 70 : 60,
            gap: Math.PI * 0.5
        });
        // Star collectible at center
        this.stars.push({ x: W / 2, y: y, collected: false, r: 10 });
        // Color switcher below obstacle
        this.switchers.push({
            x: W / 2,
            y: y + 90,
            r: 14,
            active: true
        });
    }
    update() {
        if (this.dead) return;
        const W = this.canvas.width, H = this.canvas.height;
        // Physics
        this.ball.vy += this.gravity;
        this.ball.y += this.ball.vy;
        // Camera follow
        const targetCam = Math.min(0, -(this.ball.y - H * 0.6));
        if (targetCam < this.camera) {
            this.camera += (targetCam - this.camera) * 0.1;
        }
        // Fall death
        if (this.ball.y + this.camera > H + 50) {
            this.dead = true;
            this.endGame();
            this.showOverlay('Game Over', `Score: ${this.score}`);
            return;
        }
        // Ceiling death
        if (this.ball.y + this.camera < -50) {
            this.dead = true;
            this.endGame();
            this.showOverlay('Game Over', `Score: ${this.score}`);
            return;
        }
        // Color switcher collision
        for (const sw of this.switchers) {
            if (!sw.active) continue;
            const dy = this.ball.y - sw.y;
            const dx = this.ball.x - sw.x;
            if (Math.hypot(dx, dy) < this.ball.r + sw.r) {
                sw.active = false;
                // Change ball color to a different one
                let newColor;
                do { newColor = randChoice(this.colors); } while (newColor === this.ball.color);
                this.ball.color = newColor;
            }
        }
        // Star collection
        for (const star of this.stars) {
            if (star.collected) continue;
            if (Math.hypot(this.ball.x - star.x, this.ball.y - star.y) < this.ball.r + star.r) {
                star.collected = true;
                this.setScore(this.score + 1);
            }
        }
        // Obstacle collision
        for (const obs of this.obstacles) {
            obs.angle += obs.speed;
            const dx = this.ball.x - obs.x;
            const dy = this.ball.y - obs.y;
            const dist = Math.hypot(dx, dy);
            if (obs.type === 'ring') {
                const ringInner = obs.radius - 12;
                const ringOuter = obs.radius + 12;
                if (dist > ringInner && dist < ringOuter) {
                    // Check which segment the ball is in
                    const angle = Math.atan2(dy, dx);
                    const normAngle = ((angle - obs.angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
                    const segIndex = Math.floor(normAngle / (Math.PI * 0.5));
                    const segColor = this.colors[segIndex % 4];
                    if (segColor !== this.ball.color) {
                        this.dead = true;
                        this.endGame();
                        this.showOverlay('Game Over', `Score: ${this.score}`);
                        return;
                    }
                }
            } else if (obs.type === 'bars') {
                // Two horizontal bars rotating
                if (Math.abs(dy) < 14) {
                    const barAngle = obs.angle % Math.PI;
                    const barDx = Math.cos(barAngle) * obs.radius;
                    // Check if ball overlaps with bar
                    const barY1 = obs.y + Math.sin(barAngle) * 3;
                    const barY2 = obs.y - Math.sin(barAngle) * 3;
                    if (Math.abs(this.ball.y - barY1) < this.ball.r + 6 && Math.abs(this.ball.x - obs.x) < obs.radius) {
                        const normAngle = ((obs.angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
                        const segIndex = Math.floor(normAngle / (Math.PI * 0.5));
                        if (this.colors[segIndex % 4] !== this.ball.color) {
                            this.dead = true;
                            this.endGame();
                            this.showOverlay('Game Over', `Score: ${this.score}`);
                            return;
                        }
                    }
                }
            } else if (obs.type === 'cross') {
                // Cross shape - two perpendicular bars
                const cos = Math.cos(obs.angle);
                const sin = Math.sin(obs.angle);
                // Project ball onto each bar axis
                const proj1 = dx * cos + dy * sin;
                const perp1 = -dx * sin + dy * cos;
                if (Math.abs(perp1) < this.ball.r + 6 && Math.abs(proj1) < obs.radius) {
                    const segIndex = proj1 > 0 ? 0 : 1;
                    if (this.colors[segIndex % 4] !== this.ball.color) {
                        this.dead = true;
                        this.endGame();
                        this.showOverlay('Game Over', `Score: ${this.score}`);
                        return;
                    }
                }
                const proj2 = dx * (-sin) + dy * cos;
                const perp2 = dx * cos + dy * sin;
                // Perpendicular bar - simplified
            }
        }
        // Generate more obstacles
        const topObsY = this.obstacles.length > 0 ? Math.min(...this.obstacles.map(o => o.y)) : this.spawnHeight;
        if (this.ball.y < topObsY + 400) {
            this.addObstacle(topObsY - 180);
        }
        // Remove obstacles far below
        this.obstacles = this.obstacles.filter(o => o.y + this.camera < H + 200);
        this.stars = this.stars.filter(s => s.y + this.camera < H + 200);
        this.switchers = this.switchers.filter(s => s.y + this.camera < H + 200);
    }
    render() {
        const { ctx } = this;
        const W = this.canvas.width, H = this.canvas.height;
        this.clear('#1a0a20');
        ctx.save();
        ctx.translate(0, this.camera);
        // Draw obstacles
        for (const obs of this.obstacles) {
            if (obs.type === 'ring') {
                this.drawRing(obs);
            } else if (obs.type === 'bars') {
                this.drawBars(obs);
            } else {
                this.drawCross(obs);
            }
        }
        // Draw color switchers
        for (const sw of this.switchers) {
            if (!sw.active) continue;
            ctx.save();
            ctx.translate(sw.x, sw.y);
            const segAngle = Math.PI * 0.5;
            for (let i = 0; i < 4; i++) {
                ctx.fillStyle = this.colors[i];
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, sw.r, i * segAngle, (i + 1) * segAngle);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }
        // Draw stars
        for (const star of this.stars) {
            if (star.collected) continue;
            ctx.fillStyle = '#ffd54f';
            ctx.beginPath();
            this.drawStar(ctx, star.x, star.y, 5, star.r, star.r * 0.5);
            ctx.fill();
        }
        // Draw ball
        ctx.fillStyle = this.ball.color;
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        // HUD
        this.text(`${this.score}`, W / 2, 40, 32, '#fff');
        this.text('Tap/Space to jump', W / 2, H - 15, 12, '#555');
    }
    drawRing(obs) {
        const { ctx } = this;
        const segAngle = Math.PI * 0.5;
        for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = this.colors[i];
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, obs.radius, obs.angle + i * segAngle + 0.05, obs.angle + (i + 1) * segAngle - 0.05);
            ctx.stroke();
        }
    }
    drawBars(obs) {
        const { ctx } = this;
        for (let i = 0; i < 2; i++) {
            const angle = obs.angle + i * Math.PI;
            ctx.strokeStyle = this.colors[i];
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.moveTo(obs.x - Math.cos(angle) * obs.radius, obs.y - Math.sin(angle) * obs.radius);
            ctx.lineTo(obs.x + Math.cos(angle) * obs.radius, obs.y + Math.sin(angle) * obs.radius);
            ctx.stroke();
            ctx.strokeStyle = this.colors[i + 2];
            ctx.beginPath();
            ctx.moveTo(obs.x - Math.cos(angle + Math.PI / 2) * obs.radius, obs.y - Math.sin(angle + Math.PI / 2) * obs.radius);
            ctx.lineTo(obs.x + Math.cos(angle + Math.PI / 2) * obs.radius, obs.y + Math.sin(angle + Math.PI / 2) * obs.radius);
            ctx.stroke();
            break;
        }
    }
    drawCross(obs) {
        const { ctx } = this;
        const len = obs.radius;
        for (let i = 0; i < 4; i++) {
            const angle = obs.angle + i * Math.PI * 0.5;
            ctx.strokeStyle = this.colors[i];
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.y);
            ctx.lineTo(obs.x + Math.cos(angle) * len, obs.y + Math.sin(angle) * len);
            ctx.stroke();
        }
    }
    drawStar(ctx, cx, cy, spikes, outerR, innerR) {
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        ctx.moveTo(cx, cy - outerR);
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerR);
        ctx.closePath();
    }
}

// 3. GEOMETRY RUSH
class GeometryRushGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.groundY = H - 80;
        this.player = {
            x: 120,
            y: this.groundY,
            w: 30,
            h: 30,
            vy: 0,
            onGround: true,
            rotation: 0
        };
        this.gravity = 0.6;
        this.jumpForce = -12;
        this.holdJumpForce = -0.3;
        this.speed = 5;
        this.maxSpeed = 12;
        this.distance = 0;
        this.dead = false;
        this.obstacles = [];
        this.particles = [];
        this.bgElements = [];
        this.groundTiles = [];
        this.lastObstacle = 0;
        this.holding = false;
        this.keys = {};
        this.attempts = 1;
        // Generate initial background
        for (let i = 0; i < 30; i++) {
            this.bgElements.push({
                x: Math.random() * W * 2,
                y: randInt(50, this.groundY - 60),
                size: randInt(2, 6),
                speed: 0.2 + Math.random() * 0.5,
                color: `hsl(${randInt(200, 260)}, 50%, ${randInt(15, 30)}%)`
            });
        }
        // Generate ground tiles
        for (let i = 0; i < Math.ceil(W / 40) + 5; i++) {
            this.groundTiles.push(i * 40);
        }
        // Spawn initial obstacles
        for (let i = 0; i < 5; i++) {
            this.spawnObstacle(W + i * 300 + randInt(100, 200));
        }
        this.listenKey(e => {
            if (e.key === ' ' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.keys[e.key] = true;
                if (this.player.onGround) {
                    this.player.vy = this.jumpForce;
                    this.player.onGround = false;
                    this.holding = true;
                }
            }
        });
        document.addEventListener('keyup', this._ku = e => {
            this.keys[e.key] = false;
            if (e.key === ' ' || e.key === 'ArrowUp') this.holding = false;
        });
        this.ui.innerHTML = '';
        this.loop();
    }
    stop() { super.stop(); document.removeEventListener('keyup', this._ku); }
    spawnObstacle(x) {
        const type = randChoice(['spike', 'spike', 'spike', 'tall_spike', 'block', 'double_spike']);
        const obs = { x: x, type: type };
        if (type === 'spike') {
            obs.w = 30; obs.h = 35;
        } else if (type === 'tall_spike') {
            obs.w = 25; obs.h = 55;
        } else if (type === 'block') {
            obs.w = 40; obs.h = 40;
        } else if (type === 'double_spike') {
            obs.w = 55; obs.h = 35;
        }
        this.obstacles.push(obs);
    }
    update() {
        if (this.dead) return;
        const W = this.canvas.width, H = this.canvas.height;
        // Speed increases over time
        this.speed = Math.min(this.maxSpeed, 5 + this.distance / 2000);
        this.distance += this.speed;
        this.setScore(Math.floor(this.distance / 10));
        // Hold jump for higher jump
        if (this.holding && (this.keys[' '] || this.keys['ArrowUp']) && this.player.vy < 0) {
            this.player.vy += this.holdJumpForce;
        }
        // Gravity
        this.player.vy += this.gravity;
        this.player.y += this.player.vy;
        // Ground collision
        if (this.player.y >= this.groundY) {
            this.player.y = this.groundY;
            this.player.vy = 0;
            this.player.onGround = true;
        }
        // Rotation
        if (!this.player.onGround) {
            this.player.rotation += 0.08;
        } else {
            // Snap rotation to nearest 90 degrees
            const target = Math.round(this.player.rotation / (Math.PI / 2)) * (Math.PI / 2);
            this.player.rotation += (target - this.player.rotation) * 0.3;
        }
        // Move obstacles
        for (const obs of this.obstacles) {
            obs.x -= this.speed;
        }
        // Collision detection
        const p = this.player;
        const px = p.x;
        const py = p.y - p.h;
        for (const obs of this.obstacles) {
            const oy = this.groundY - obs.h;
            if (obs.type === 'spike' || obs.type === 'tall_spike') {
                // Triangle collision - simplified to center point checks
                const cx = obs.x + obs.w / 2;
                const tipY = oy;
                const baseY = this.groundY;
                // Simple rectangular bounding check with some forgiveness
                if (px + p.w * 0.7 > obs.x + 5 && px + p.w * 0.3 < obs.x + obs.w - 5 &&
                    py + p.h > tipY + obs.h * 0.3 && py < baseY) {
                    this.die();
                    return;
                }
            } else if (obs.type === 'block') {
                if (px + p.w * 0.7 > obs.x && px + p.w * 0.3 < obs.x + obs.w &&
                    py + p.h > oy && py < oy + obs.h) {
                    this.die();
                    return;
                }
            } else if (obs.type === 'double_spike') {
                // Two spikes side by side
                if (px + p.w * 0.7 > obs.x + 5 && px + p.w * 0.3 < obs.x + obs.w - 5 &&
                    py + p.h > oy + obs.h * 0.3 && py < this.groundY) {
                    this.die();
                    return;
                }
            }
        }
        // Remove off-screen obstacles and spawn new ones
        this.obstacles = this.obstacles.filter(o => o.x > -100);
        const rightmostX = this.obstacles.length > 0 ? Math.max(...this.obstacles.map(o => o.x)) : 0;
        if (rightmostX < W + 200) {
            this.spawnObstacle(rightmostX + randInt(200, 400));
        }
        // Background parallax
        for (const bg of this.bgElements) {
            bg.x -= this.speed * bg.speed;
            if (bg.x < -20) bg.x += W * 2;
        }
        // Ground tiles
        for (let i = 0; i < this.groundTiles.length; i++) {
            this.groundTiles[i] -= this.speed;
            if (this.groundTiles[i] < -40) {
                this.groundTiles[i] = Math.max(...this.groundTiles) + 40;
            }
        }
        // Trail particles
        if (!this.player.onGround) {
            this.particles.push({
                x: px, y: p.y, life: 15,
                dx: (Math.random() - 0.5) * 2 - 1,
                dy: (Math.random() - 0.5) * 2,
                color: `hsl(${210 + Math.random() * 40}, 80%, 60%)`
            });
        }
        this.particles = this.particles.filter(p => {
            p.x += p.dx; p.y += p.dy; return --p.life > 0;
        });
    }
    die() {
        this.dead = true;
        // Explosion particles
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.player.x + this.player.w / 2,
                y: this.player.y - this.player.h / 2,
                life: 30,
                dx: (Math.random() - 0.5) * 8,
                dy: (Math.random() - 0.5) * 8,
                color: `hsl(${210 + Math.random() * 40}, 80%, 60%)`
            });
        }
        this.endGame();
        this.showOverlay('Game Over', `Distance: ${this.score} | Attempt #${this.attempts}`);
    }
    render() {
        const { ctx } = this;
        const W = this.canvas.width, H = this.canvas.height;
        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0a0f2e');
        grad.addColorStop(1, '#1a2a5a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        // Background elements (stars/dots)
        for (const bg of this.bgElements) {
            ctx.fillStyle = bg.color;
            ctx.fillRect(bg.x, bg.y, bg.size, bg.size);
        }
        // Ground
        ctx.fillStyle = '#1a2a5a';
        ctx.fillRect(0, this.groundY, W, H - this.groundY);
        // Ground tiles with grid
        ctx.strokeStyle = '#2a3a6a';
        ctx.lineWidth = 1;
        for (const tx of this.groundTiles) {
            ctx.strokeRect(tx, this.groundY, 40, 40);
        }
        // Ground line
        ctx.fillStyle = '#4a6aaa';
        ctx.fillRect(0, this.groundY, W, 2);
        // Obstacles
        for (const obs of this.obstacles) {
            const oy = this.groundY - obs.h;
            if (obs.type === 'spike') {
                ctx.fillStyle = '#e94560';
                ctx.beginPath();
                ctx.moveTo(obs.x + obs.w / 2, oy);
                ctx.lineTo(obs.x, this.groundY);
                ctx.lineTo(obs.x + obs.w, this.groundY);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ff6b81';
                ctx.lineWidth = 1;
                ctx.stroke();
            } else if (obs.type === 'tall_spike') {
                ctx.fillStyle = '#ff6b81';
                ctx.beginPath();
                ctx.moveTo(obs.x + obs.w / 2, oy);
                ctx.lineTo(obs.x, this.groundY);
                ctx.lineTo(obs.x + obs.w, this.groundY);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#e94560';
                ctx.lineWidth = 1;
                ctx.stroke();
            } else if (obs.type === 'block') {
                ctx.fillStyle = '#e94560';
                ctx.fillRect(obs.x, oy, obs.w, obs.h);
                ctx.strokeStyle = '#ff6b81';
                ctx.lineWidth = 1;
                ctx.strokeRect(obs.x, oy, obs.w, obs.h);
            } else if (obs.type === 'double_spike') {
                ctx.fillStyle = '#e94560';
                const halfW = obs.w / 2;
                // First spike
                ctx.beginPath();
                ctx.moveTo(obs.x + halfW / 2, oy);
                ctx.lineTo(obs.x, this.groundY);
                ctx.lineTo(obs.x + halfW, this.groundY);
                ctx.closePath();
                ctx.fill();
                // Second spike
                ctx.beginPath();
                ctx.moveTo(obs.x + halfW + halfW / 2, oy);
                ctx.lineTo(obs.x + halfW, this.groundY);
                ctx.lineTo(obs.x + obs.w, this.groundY);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ff6b81';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        // Particles
        for (const p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 30;
            ctx.fillRect(p.x, p.y, 4, 4);
        }
        ctx.globalAlpha = 1;
        // Player
        if (!this.dead) {
            const p = this.player;
            ctx.save();
            ctx.translate(p.x + p.w / 2, p.y - p.h / 2);
            ctx.rotate(p.rotation);
            ctx.fillStyle = '#4fc3f7';
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.strokeStyle = '#80d4f7';
            ctx.lineWidth = 2;
            ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
            // Eye
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(4, -2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(5, -2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        // HUD
        this.text(`${this.score}`, W / 2, 35, 28, '#fff');
        this.text('Space/Up to jump (hold for higher)', W / 2, H - 10, 12, '#555');
    }
}

// 4. BREAKOUT BLITZ
class BreakoutBlitzGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.paddle = { x: W / 2, w: 100, h: 14, y: H - 35 };
        this.balls = [];
        this.spawnBall();
        this.bricks = [];
        this.powerups = [];
        this.particles = [];
        this.lives = 3;
        this.level = 1;
        this.dead = false;
        this.fireball = false;
        this.fireballTimer = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.generateLevel();
        this.listenKey(e => {
            if (e.key === 'ArrowLeft') this.paddle.x = Math.max(this.paddle.w / 2, this.paddle.x - 30);
            else if (e.key === 'ArrowRight') this.paddle.x = Math.min(W - this.paddle.w / 2, this.paddle.x + 30);
        });
        this.listenMouse('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.paddle.x = Math.max(this.paddle.w / 2, Math.min(W - this.paddle.w / 2,
                (e.clientX - rect.left) * (W / rect.width)));
        });
        this.ui.innerHTML = '';
        this.loop();
    }
    spawnBall() {
        const W = this.canvas.width, H = this.canvas.height;
        this.balls.push({
            x: W / 2,
            y: H - 55,
            r: 7,
            dx: 3 * (Math.random() > 0.5 ? 1 : -1),
            dy: -4.5
        });
    }
    generateLevel() {
        this.bricks = [];
        const W = this.canvas.width;
        const cols = 10;
        const bw = (W - 40) / cols;
        const bh = 22;
        const patterns = [
            // Pattern 1: Standard rows
            () => {
                const colors = ['#e94560', '#ff6b81', '#ffa502', '#ffd54f', '#7bed9f', '#70a1ff', '#a29bfe'];
                for (let r = 0; r < 7; r++)
                    for (let c = 0; c < cols; c++)
                        this.bricks.push({ x: 20 + c * bw, y: 50 + r * (bh + 4), w: bw - 4, h: bh, color: colors[r], hp: r < 2 ? 2 : 1, alive: true });
            },
            // Pattern 2: Checkerboard
            () => {
                const colors = ['#e94560', '#4fc3f7', '#7bed9f', '#ffd54f'];
                for (let r = 0; r < 8; r++)
                    for (let c = 0; c < cols; c++)
                        if ((r + c) % 2 === 0)
                            this.bricks.push({ x: 20 + c * bw, y: 50 + r * (bh + 4), w: bw - 4, h: bh, color: colors[(r + c) % 4], hp: 1, alive: true });
            },
            // Pattern 3: Diamond
            () => {
                const mid = Math.floor(cols / 2);
                for (let r = 0; r < 8; r++) {
                    const width = r < 4 ? r + 2 : 9 - r;
                    const startC = mid - Math.floor(width / 2);
                    for (let c = startC; c < startC + width; c++) {
                        if (c >= 0 && c < cols)
                            this.bricks.push({ x: 20 + c * bw, y: 50 + r * (bh + 4), w: bw - 4, h: bh, color: `hsl(${r * 30 + c * 20}, 70%, 55%)`, hp: r < 3 || r > 5 ? 1 : 2, alive: true });
                    }
                }
            },
            // Pattern 4: Fortress
            () => {
                for (let r = 0; r < 6; r++)
                    for (let c = 0; c < cols; c++) {
                        const isWall = c === 0 || c === cols - 1 || r === 0;
                        const isInner = r > 2 && c > 2 && c < cols - 3;
                        if (isWall || isInner)
                            this.bricks.push({ x: 20 + c * bw, y: 50 + r * (bh + 4), w: bw - 4, h: bh, color: isWall ? '#888' : '#ffa502', hp: isWall ? 3 : 1, alive: true });
                    }
            },
            // Pattern 5: Stripes
            () => {
                const colors = ['#e94560', '#4fc3f7', '#7bed9f'];
                for (let r = 0; r < 8; r++)
                    for (let c = 0; c < cols; c++)
                        if (c % 3 !== 2)
                            this.bricks.push({ x: 20 + c * bw, y: 50 + r * (bh + 4), w: bw - 4, h: bh, color: colors[c % 3], hp: 1 + Math.floor(r / 4), alive: true });
            }
        ];
        const patternIndex = (this.level - 1) % patterns.length;
        patterns[patternIndex]();
    }
    update() {
        if (this.dead) return;
        const W = this.canvas.width, H = this.canvas.height;
        // Fireball timer
        if (this.fireball) {
            this.fireballTimer--;
            if (this.fireballTimer <= 0) this.fireball = false;
        }
        // Combo timer
        if (this.comboTimer > 0) this.comboTimer--;
        else this.combo = 0;
        // Update balls
        for (const b of this.balls) {
            b.x += b.dx;
            b.y += b.dy;
            // Wall bounce
            if (b.x - b.r < 0) { b.x = b.r; b.dx = Math.abs(b.dx); }
            if (b.x + b.r > W) { b.x = W - b.r; b.dx = -Math.abs(b.dx); }
            if (b.y - b.r < 0) { b.y = b.r; b.dy = Math.abs(b.dy); }
            // Paddle collision
            const p = this.paddle;
            if (b.dy > 0 && b.y + b.r >= p.y && b.y + b.r <= p.y + p.h + 5 && b.x >= p.x - p.w / 2 && b.x <= p.x + p.w / 2) {
                b.dy = -Math.abs(b.dy);
                b.dx = ((b.x - p.x) / (p.w / 2)) * 5;
                // Ensure minimum dy
                if (Math.abs(b.dy) < 2) b.dy = b.dy > 0 ? 2 : -2;
            }
            // Brick collision
            for (const br of this.bricks) {
                if (!br.alive) continue;
                if (b.x + b.r > br.x && b.x - b.r < br.x + br.w && b.y + b.r > br.y && b.y - b.r < br.y + br.h) {
                    if (!this.fireball) {
                        // Determine bounce direction
                        const overlapLeft = (b.x + b.r) - br.x;
                        const overlapRight = (br.x + br.w) - (b.x - b.r);
                        const overlapTop = (b.y + b.r) - br.y;
                        const overlapBottom = (br.y + br.h) - (b.y - b.r);
                        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                        if (minOverlap === overlapLeft || minOverlap === overlapRight) b.dx *= -1;
                        else b.dy *= -1;
                    }
                    br.hp--;
                    if (br.hp <= 0) {
                        br.alive = false;
                        this.combo++;
                        this.comboTimer = 60;
                        const points = 10 * this.combo;
                        this.setScore(this.score + points);
                        // Particles
                        for (let i = 0; i < 4; i++) {
                            this.particles.push({
                                x: br.x + br.w / 2,
                                y: br.y + br.h / 2,
                                dx: (Math.random() - 0.5) * 6,
                                dy: (Math.random() - 0.5) * 6,
                                life: 20,
                                color: br.color
                            });
                        }
                        // Chance to drop powerup
                        if (Math.random() < 0.15) {
                            const types = ['wide', 'multi', 'fire', 'life'];
                            this.powerups.push({
                                x: br.x + br.w / 2,
                                y: br.y + br.h / 2,
                                type: randChoice(types),
                                dy: 2,
                                r: 10
                            });
                        }
                    } else {
                        // Darken brick when hit
                        br.color = this.darkenColor(br.color);
                    }
                    if (!this.fireball) break;
                }
            }
        }
        // Remove balls that fall below
        this.balls = this.balls.filter(b => b.y < H + 20);
        if (this.balls.length === 0) {
            this.lives--;
            this.fireball = false;
            this.paddle.w = 100;
            if (this.lives <= 0) {
                this.dead = true;
                this.endGame();
                this.showOverlay('Game Over', `Level ${this.level} | Score: ${this.score}`);
                return;
            }
            this.spawnBall();
        }
        // Update powerups
        for (const pw of this.powerups) {
            pw.y += pw.dy;
            // Catch powerup with paddle
            if (pw.y + pw.r >= this.paddle.y && pw.x >= this.paddle.x - this.paddle.w / 2 && pw.x <= this.paddle.x + this.paddle.w / 2) {
                pw.y = H + 50; // Remove
                if (pw.type === 'wide') {
                    this.paddle.w = Math.min(200, this.paddle.w + 30);
                } else if (pw.type === 'multi') {
                    const newBalls = [];
                    for (const b of this.balls) {
                        newBalls.push({ x: b.x, y: b.y, r: b.r, dx: b.dx + 2, dy: b.dy, });
                        newBalls.push({ x: b.x, y: b.y, r: b.r, dx: b.dx - 2, dy: b.dy });
                    }
                    this.balls.push(...newBalls);
                } else if (pw.type === 'fire') {
                    this.fireball = true;
                    this.fireballTimer = 300;
                } else if (pw.type === 'life') {
                    this.lives = Math.min(5, this.lives + 1);
                }
            }
        }
        this.powerups = this.powerups.filter(p => p.y < H + 20);
        // Particles
        this.particles = this.particles.filter(p => { p.x += p.dx; p.y += p.dy; return --p.life > 0; });
        // Win check
        if (this.bricks.every(br => !br.alive)) {
            this.level++;
            // Speed up balls slightly
            for (const b of this.balls) {
                b.dx *= 1.05;
                b.dy *= 1.05;
            }
            this.generateLevel();
        }
    }
    darkenColor(hex) {
        // Simple darken - shift towards gray
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;
    }
    render() {
        const { ctx } = this;
        const W = this.canvas.width, H = this.canvas.height;
        this.clear('#0a0a18');
        // Bricks
        for (const br of this.bricks) {
            if (!br.alive) continue;
            ctx.fillStyle = br.color;
            ctx.fillRect(br.x, br.y, br.w, br.h);
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.strokeRect(br.x, br.y, br.w, br.h);
            // HP indicator
            if (br.hp > 1) {
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(br.hp, br.x + br.w / 2, br.y + br.h / 2 + 3);
            }
        }
        // Powerups
        const pwColors = { wide: '#4fc3f7', multi: '#7bed9f', fire: '#e94560', life: '#ff6b81' };
        const pwLabels = { wide: 'W', multi: 'M', fire: 'F', life: '+' };
        for (const pw of this.powerups) {
            ctx.fillStyle = pwColors[pw.type] || '#fff';
            ctx.beginPath();
            ctx.arc(pw.x, pw.y, pw.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(pwLabels[pw.type], pw.x, pw.y + 4);
        }
        // Paddle
        if (this.fireball) {
            ctx.fillStyle = '#e94560';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
        } else {
            ctx.fillStyle = '#4fc3f7';
        }
        ctx.beginPath();
        ctx.roundRect(this.paddle.x - this.paddle.w / 2, this.paddle.y, this.paddle.w, this.paddle.h, 7);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Balls
        for (const b of this.balls) {
            if (this.fireball) {
                ctx.fillStyle = '#ff4444';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 15;
            } else {
                ctx.fillStyle = '#fff';
            }
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        // Particles
        for (const p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 20;
            ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        }
        ctx.globalAlpha = 1;
        // HUD
        this.text(`Lives: ${'❤'.repeat(this.lives)}`, 70, 25, 16);
        this.text(`Level ${this.level}`, W / 2, 25, 16, '#aaa');
        if (this.combo > 1 && this.comboTimer > 0) {
            this.text(`${this.combo}x Combo!`, W / 2, 45, 14, '#ffd54f');
        }
        if (this.fireball) {
            this.text('FIREBALL!', W - 70, 25, 14, '#e94560');
        }
        this.text(`Balls: ${this.balls.length}`, W - 70, H - 10, 12, '#555');
    }
}

// 5. TOWER STACK
class TowerStackGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.blocks = [];
        this.baseY = H - 40;
        this.blockHeight = 25;
        this.dead = false;
        this.camera = 0;
        this.perfectCount = 0;
        this.particles = [];
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        // First block (foundation)
        const firstWidth = 200;
        this.blocks.push({
            x: W / 2 - firstWidth / 2,
            w: firstWidth,
            y: this.baseY - this.blockHeight,
            h: this.blockHeight,
            color: this.getBlockColor(0),
            placed: true
        });
        // Spawn moving block
        this.spawnMovingBlock();
        this.listenKey(e => {
            if (e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                if (!this.dead) this.placeBlock();
            }
        });
        this.listenClick(e => {
            if (!this.dead) this.placeBlock();
        });
        this.ui.innerHTML = '';
        this.loop();
    }
    getBlockColor(index) {
        const hue = (index * 25 + 10) % 360;
        return `hsl(${hue}, 65%, 50%)`;
    }
    spawnMovingBlock() {
        const lastBlock = this.blocks[this.blocks.length - 1];
        const W = this.canvas.width;
        const newY = lastBlock.y - this.blockHeight;
        const direction = this.blocks.length % 2 === 0 ? 1 : -1;
        const speed = Math.min(8, 2 + this.blocks.length * 0.15);
        this.movingBlock = {
            x: direction > 0 ? -lastBlock.w : W,
            w: lastBlock.w,
            y: newY,
            h: this.blockHeight,
            color: this.getBlockColor(this.blocks.length),
            dx: speed * direction,
            placed: false
        };
    }
    placeBlock() {
        if (!this.movingBlock || this.dead) return;
        const mb = this.movingBlock;
        const lastBlock = this.blocks[this.blocks.length - 1];
        // Calculate overlap
        const overlapStart = Math.max(mb.x, lastBlock.x);
        const overlapEnd = Math.min(mb.x + mb.w, lastBlock.x + lastBlock.w);
        const overlapWidth = overlapEnd - overlapStart;
        if (overlapWidth <= 0) {
            // Missed completely
            this.dead = true;
            // Falling animation block
            this.fallingBlock = { ...mb, dy: 0 };
            this.endGame();
            this.showOverlay('Game Over', `Blocks: ${this.score} | ${this.perfectCount} perfects`);
            return;
        }
        // Check for perfect placement (within 5px tolerance)
        const isPerfect = Math.abs(mb.x - lastBlock.x) < 5;
        if (isPerfect) {
            this.perfectCount++;
            // Perfect placement - keep full width
            this.blocks.push({
                x: lastBlock.x,
                w: lastBlock.w,
                y: mb.y,
                h: this.blockHeight,
                color: mb.color,
                placed: true
            });
            // Perfect particles
            for (let i = 0; i < 15; i++) {
                this.particles.push({
                    x: lastBlock.x + lastBlock.w / 2,
                    y: mb.y,
                    dx: (Math.random() - 0.5) * 8,
                    dy: -Math.random() * 5 - 2,
                    life: 40,
                    color: '#ffd54f',
                    size: randInt(3, 6)
                });
            }
            this.shakeTimer = 5;
            this.shakeIntensity = 3;
        } else {
            // Cut off overhanging parts
            // Falling piece particles
            if (mb.x < lastBlock.x) {
                // Left side falls off
                const fallW = lastBlock.x - mb.x;
                for (let i = 0; i < 6; i++) {
                    this.particles.push({
                        x: mb.x + fallW / 2,
                        y: mb.y + this.blockHeight / 2,
                        dx: -Math.random() * 3 - 1,
                        dy: Math.random() * 2,
                        life: 30,
                        color: mb.color,
                        size: randInt(4, 8),
                        gravity: true
                    });
                }
            }
            if (mb.x + mb.w > lastBlock.x + lastBlock.w) {
                // Right side falls off
                const fallX = lastBlock.x + lastBlock.w;
                const fallW = (mb.x + mb.w) - fallX;
                for (let i = 0; i < 6; i++) {
                    this.particles.push({
                        x: fallX + fallW / 2,
                        y: mb.y + this.blockHeight / 2,
                        dx: Math.random() * 3 + 1,
                        dy: Math.random() * 2,
                        life: 30,
                        color: mb.color,
                        size: randInt(4, 8),
                        gravity: true
                    });
                }
            }
            this.blocks.push({
                x: overlapStart,
                w: overlapWidth,
                y: mb.y,
                h: this.blockHeight,
                color: mb.color,
                placed: true
            });
            this.perfectCount = 0;
            this.shakeTimer = 3;
            this.shakeIntensity = 2;
        }
        this.setScore(this.blocks.length - 1);
        this.movingBlock = null;
        // Camera adjustment
        const topBlock = this.blocks[this.blocks.length - 1];
        const targetCamera = Math.max(0, (this.baseY - topBlock.y) - this.canvas.height * 0.5);
        this.targetCamera = targetCamera;
        // Spawn next moving block
        this.spawnMovingBlock();
    }
    update() {
        if (this.dead) {
            // Update falling block
            if (this.fallingBlock) {
                this.fallingBlock.dy += 0.5;
                this.fallingBlock.y += this.fallingBlock.dy;
                this.fallingBlock.x += this.fallingBlock.dx * 0.5;
            }
        }
        // Move current block
        if (this.movingBlock && !this.dead) {
            const mb = this.movingBlock;
            mb.x += mb.dx;
            const W = this.canvas.width;
            if (mb.x + mb.w > W + 50) mb.dx = -Math.abs(mb.dx);
            if (mb.x < -50) mb.dx = Math.abs(mb.dx);
        }
        // Smooth camera
        if (this.targetCamera !== undefined) {
            this.camera += (this.targetCamera - this.camera) * 0.08;
        }
        // Screen shake
        if (this.shakeTimer > 0) this.shakeTimer--;
        // Particles
        this.particles = this.particles.filter(p => {
            p.x += p.dx;
            p.y += p.dy;
            if (p.gravity) p.dy += 0.3;
            p.dx *= 0.98;
            return --p.life > 0;
        });
    }
    render() {
        const { ctx } = this;
        const W = this.canvas.width, H = this.canvas.height;
        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#1a1a2e');
        bgGrad.addColorStop(1, '#2a2a1a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        // Screen shake
        if (this.shakeTimer > 0) {
            const sx = (Math.random() - 0.5) * this.shakeIntensity;
            const sy = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.translate(sx, sy);
        }
        // Camera
        ctx.translate(0, this.camera);
        // Draw base/ground
        ctx.fillStyle = '#3a3a2a';
        ctx.fillRect(0, this.baseY, W, H);
        ctx.fillStyle = '#5a5a3a';
        ctx.fillRect(0, this.baseY, W, 3);
        // Draw placed blocks
        for (let i = 0; i < this.blocks.length; i++) {
            const b = this.blocks[i];
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);
            // Light edge
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(b.x, b.y, b.w, 3);
            // Dark edge
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(b.x, b.y + b.h - 2, b.w, 2);
            // Left/right edges
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(b.x, b.y, 2, b.h);
            ctx.fillRect(b.x + b.w - 2, b.y, 2, b.h);
        }
        // Draw moving block
        if (this.movingBlock && !this.dead) {
            const mb = this.movingBlock;
            ctx.fillStyle = mb.color;
            ctx.fillRect(mb.x, mb.y, mb.w, mb.h);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(mb.x, mb.y, mb.w, 3);
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(mb.x, mb.y + mb.h - 2, mb.w, 2);
            // Guide lines
            const lastBlock = this.blocks[this.blocks.length - 1];
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(lastBlock.x, mb.y);
            ctx.lineTo(lastBlock.x, mb.y + mb.h);
            ctx.moveTo(lastBlock.x + lastBlock.w, mb.y);
            ctx.lineTo(lastBlock.x + lastBlock.w, mb.y + mb.h);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        // Draw falling block (on death)
        if (this.dead && this.fallingBlock) {
            const fb = this.fallingBlock;
            ctx.fillStyle = fb.color;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(fb.x, fb.y, fb.w, fb.h);
            ctx.globalAlpha = 1;
        }
        // Particles
        for (const p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 40;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
        // HUD (not affected by camera)
        this.text(`${this.blocks.length - 1}`, W / 2, 45, 36, '#fff');
        if (this.perfectCount >= 2) {
            this.text(`${this.perfectCount}x Perfect!`, W / 2, 75, 18, '#ffd54f');
        }
        this.text('Click/Space to place', W / 2, H - 12, 12, '#555');
    }
}

// Register arcade 2 games
Portal.register({id:'maze',name:'Maze Runner',category:'arcade',icon:'🏃',color:'linear-gradient(135deg,#1a3a2a,#2a6a4a)',Game:MazeRunnerGame,tags:['maze','explore']});
Portal.register({id:'colorswitch',name:'Color Switch',category:'arcade',icon:'🎨',color:'linear-gradient(135deg,#4a1a3a,#8a3a6a)',Game:ColorSwitchGame,tags:['color','reflex']});
Portal.register({id:'georush',name:'Geometry Rush',category:'arcade',icon:'🔷',color:'linear-gradient(135deg,#1a2a5a,#3a5aaa)',Game:GeometryRushGame,tags:['runner','jump']});
Portal.register({id:'breakout2',name:'Breakout Blitz',category:'arcade',icon:'💥',color:'linear-gradient(135deg,#5a1a1a,#aa3a3a)',Game:BreakoutBlitzGame,tags:['breakout','powerups']});
Portal.register({id:'towerstack',name:'Tower Stack',category:'arcade',icon:'🏗️',color:'linear-gradient(135deg,#3a3a1a,#6a6a3a)',Game:TowerStackGame,tags:['stack','precision']});
