/* === ARCADE GAMES (8) === */

// 1. SNAKE
class SnakeGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const G = 20; this.G = G; this.cols = this.canvas.width / G; this.rows = this.canvas.height / G;
        this.snake = [{x: 10, y: 10}]; this.dir = {x: 1, y: 0}; this.nextDir = {x: 1, y: 0};
        this.food = this.spawnFood(); this.dead = false; this.speed = 120; this.lastMove = 0;
        this.listenKey(e => {
            const k = e.key;
            if (k === 'ArrowUp' && this.dir.y === 0) this.nextDir = {x:0,y:-1};
            else if (k === 'ArrowDown' && this.dir.y === 0) this.nextDir = {x:0,y:1};
            else if (k === 'ArrowLeft' && this.dir.x === 0) this.nextDir = {x:-1,y:0};
            else if (k === 'ArrowRight' && this.dir.x === 0) this.nextDir = {x:1,y:0};
            e.preventDefault();
        });
        this.ui.innerHTML = ''; this.lastTime = performance.now(); this.loop();
    }
    spawnFood() {
        let p;
        do { p = {x: randInt(0, this.cols-1), y: randInt(0, this.rows-1)}; } while (this.snake.some(s => s.x===p.x && s.y===p.y));
        return p;
    }
    update() {
        if (this.dead) return;
        const now = performance.now();
        if (now - this.lastMove < this.speed) return;
        this.lastMove = now;
        this.dir = {...this.nextDir};
        const head = {x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y};
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows || this.snake.some(s => s.x===head.x && s.y===head.y)) {
            this.dead = true; this.endGame(); this.showOverlay('Game Over', `Score: ${this.score}`); return;
        }
        this.snake.unshift(head);
        if (head.x === this.food.x && head.y === this.food.y) {
            this.setScore(++this.score * 10);
            this.food = this.spawnFood();
            this.speed = Math.max(50, 120 - this.score * 2);
        } else this.snake.pop();
    }
    render() {
        const {ctx, G, cols, rows} = this;
        this.clear('#111122');
        // Grid lines
        ctx.strokeStyle = '#1a1a33'; ctx.lineWidth = 0.5;
        for (let i = 0; i <= cols; i++) { ctx.beginPath(); ctx.moveTo(i*G,0); ctx.lineTo(i*G,rows*G); ctx.stroke(); }
        for (let i = 0; i <= rows; i++) { ctx.beginPath(); ctx.moveTo(0,i*G); ctx.lineTo(cols*G,i*G); ctx.stroke(); }
        // Food
        ctx.fillStyle = '#e94560'; ctx.beginPath(); ctx.arc(this.food.x*G+G/2, this.food.y*G+G/2, G/2-2, 0, Math.PI*2); ctx.fill();
        // Snake
        this.snake.forEach((s, i) => {
            ctx.fillStyle = i === 0 ? '#4fc3f7' : `hsl(${120 + i*3}, 70%, ${55 - i*0.5}%)`;
            ctx.fillRect(s.x*G+1, s.y*G+1, G-2, G-2);
        });
    }
}

// 2. BLOCK BLITZ (Tetris-like)
class BlockBlitzGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.cols = 10; this.rows = 20; this.G = Math.floor(this.canvas.height / this.rows);
        this.ox = Math.floor((this.canvas.width - this.cols * this.G) / 2);
        this.board = Array.from({length: this.rows}, () => Array(this.cols).fill(0));
        this.pieces = [
            {shape: [[1,1,1,1]], color: '#4fc3f7'},       // I
            {shape: [[1,1],[1,1]], color: '#ffd54f'},      // O
            {shape: [[0,1,0],[1,1,1]], color: '#ce93d8'},  // T
            {shape: [[1,0],[1,0],[1,1]], color: '#ffb74d'}, // L
            {shape: [[0,1],[0,1],[1,1]], color: '#64b5f6'}, // J
            {shape: [[0,1,1],[1,1,0]], color: '#81c784'},  // S
            {shape: [[1,1,0],[0,1,1]], color: '#e57373'}   // Z
        ];
        this.level = 1; this.lines = 0; this.dead = false;
        this.dropInterval = 800; this.lastDrop = performance.now();
        this.spawnPiece();
        this.listenKey(e => {
            if (this.dead) return;
            if (e.key === 'ArrowLeft') this.movePiece(-1, 0);
            else if (e.key === 'ArrowRight') this.movePiece(1, 0);
            else if (e.key === 'ArrowDown') { this.movePiece(0, 1); this.lastDrop = performance.now(); }
            else if (e.key === 'ArrowUp') this.rotatePiece();
            else if (e.key === ' ') { while (this.movePiece(0, 1)); this.lockPiece(); }
            e.preventDefault();
        });
        this.ui.innerHTML = ''; this.loop();
    }
    spawnPiece() {
        const p = randChoice(this.pieces);
        this.current = { shape: p.shape.map(r => [...r]), color: p.color, x: Math.floor((this.cols - p.shape[0].length) / 2), y: 0 };
        if (!this.fits(this.current.shape, this.current.x, this.current.y)) {
            this.dead = true; this.endGame(); this.showOverlay('Game Over', `Score: ${this.score} | Lines: ${this.lines}`);
        }
    }
    fits(shape, px, py) {
        for (let r = 0; r < shape.length; r++)
            for (let c = 0; c < shape[r].length; c++)
                if (shape[r][c]) {
                    const nx = px + c, ny = py + r;
                    if (nx < 0 || nx >= this.cols || ny >= this.rows || (ny >= 0 && this.board[ny][nx])) return false;
                }
        return true;
    }
    movePiece(dx, dy) {
        if (this.fits(this.current.shape, this.current.x + dx, this.current.y + dy)) {
            this.current.x += dx; this.current.y += dy; return true;
        }
        return false;
    }
    rotatePiece() {
        const s = this.current.shape;
        const rotated = s[0].map((_, i) => s.map(r => r[i]).reverse());
        if (this.fits(rotated, this.current.x, this.current.y)) this.current.shape = rotated;
        else if (this.fits(rotated, this.current.x - 1, this.current.y)) { this.current.shape = rotated; this.current.x--; }
        else if (this.fits(rotated, this.current.x + 1, this.current.y)) { this.current.shape = rotated; this.current.x++; }
    }
    lockPiece() {
        const {shape, x, y, color} = this.current;
        for (let r = 0; r < shape.length; r++)
            for (let c = 0; c < shape[r].length; c++)
                if (shape[r][c] && y + r >= 0) this.board[y + r][x + c] = color;
        this.clearLines();
        this.spawnPiece();
    }
    clearLines() {
        let cleared = 0;
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.board[r].every(c => c)) { this.board.splice(r, 1); this.board.unshift(Array(this.cols).fill(0)); cleared++; r++; }
        }
        if (cleared) {
            const pts = [0, 100, 300, 500, 800][cleared] * this.level;
            this.lines += cleared;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 800 - (this.level - 1) * 70);
            this.setScore(this.score + pts);
        }
    }
    update() {
        if (this.dead) return;
        if (performance.now() - this.lastDrop > this.dropInterval) {
            if (!this.movePiece(0, 1)) this.lockPiece();
            this.lastDrop = performance.now();
        }
    }
    render() {
        const {ctx, G, ox, cols, rows} = this;
        this.clear('#0a0a18');
        // Board border
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.strokeRect(ox - 1, 0, cols * G + 2, rows * G);
        // Board cells
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++) {
                if (this.board[r][c]) { ctx.fillStyle = this.board[r][c]; ctx.fillRect(ox + c*G+1, r*G+1, G-2, G-2); }
                else { ctx.fillStyle = '#12122a'; ctx.fillRect(ox + c*G, r*G, G, G); ctx.strokeStyle = '#1a1a33'; ctx.strokeRect(ox + c*G, r*G, G, G); }
            }
        // Current piece
        if (!this.dead) {
            const {shape, x, y, color} = this.current;
            ctx.fillStyle = color;
            for (let r = 0; r < shape.length; r++)
                for (let c = 0; c < shape[r].length; c++)
                    if (shape[r][c] && y+r >= 0) ctx.fillRect(ox + (x+c)*G+1, (y+r)*G+1, G-2, G-2);
        }
        // Info
        this.text(`Level: ${this.level}`, ox + cols*G + 60, 30, 16);
        this.text(`Lines: ${this.lines}`, ox + cols*G + 60, 55, 16);
    }
}

// 3. BRICK BREAKER
class BrickBreakerGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.paddle = {x: W/2, w: 100, h: 14, y: H - 30};
        this.ball = {x: W/2, y: H - 50, r: 7, dx: 4, dy: -4};
        this.bricks = [];
        const cols = 10, bw = (W - 40) / cols, bh = 22;
        const colors = ['#e94560','#ff6b81','#ffa502','#ffd54f','#7bed9f','#70a1ff','#a29bfe'];
        for (let r = 0; r < 6; r++)
            for (let c = 0; c < cols; c++)
                this.bricks.push({x: 20 + c*bw, y: 50 + r*(bh+4), w: bw-4, h: bh, color: colors[r], alive: true});
        this.lives = 3; this.dead = false;
        this.listenKey(e => {
            if (e.key === 'ArrowLeft') this.paddle.x = Math.max(this.paddle.w/2, this.paddle.x - 30);
            else if (e.key === 'ArrowRight') this.paddle.x = Math.min(this.canvas.width - this.paddle.w/2, this.paddle.x + 30);
        });
        this.listenMouse('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.paddle.x = Math.max(this.paddle.w/2, Math.min(this.canvas.width - this.paddle.w/2,
                (e.clientX - rect.left) * (this.canvas.width / rect.width)));
        });
        this.ui.innerHTML = ''; this.loop();
    }
    update() {
        if (this.dead) return;
        const b = this.ball, W = this.canvas.width, H = this.canvas.height, p = this.paddle;
        b.x += b.dx; b.y += b.dy;
        if (b.x - b.r < 0 || b.x + b.r > W) b.dx *= -1;
        if (b.y - b.r < 0) b.dy *= -1;
        // Paddle collision
        if (b.dy > 0 && b.y + b.r >= p.y && b.y + b.r <= p.y + p.h && b.x >= p.x - p.w/2 && b.x <= p.x + p.w/2) {
            b.dy = -Math.abs(b.dy);
            b.dx = ((b.x - p.x) / (p.w/2)) * 5;
        }
        // Brick collision
        for (const br of this.bricks) {
            if (!br.alive) continue;
            if (b.x + b.r > br.x && b.x - b.r < br.x + br.w && b.y + b.r > br.y && b.y - b.r < br.y + br.h) {
                br.alive = false; b.dy *= -1;
                this.setScore(this.score + 10);
            }
        }
        // Fall off bottom
        if (b.y > H) {
            this.lives--;
            if (this.lives <= 0) { this.dead = true; this.endGame(); this.showOverlay('Game Over', `Score: ${this.score}`); return; }
            b.x = W/2; b.y = H - 50; b.dx = 4 * (Math.random() > 0.5 ? 1 : -1); b.dy = -4;
        }
        // Win check
        if (this.bricks.every(br => !br.alive)) {
            this.dead = true; this.endGame(); this.showOverlay('You Win!', `Score: ${this.score}`);
        }
    }
    render() {
        this.clear('#0a0a18');
        const {ctx} = this;
        // Bricks
        for (const br of this.bricks) {
            if (!br.alive) continue;
            ctx.fillStyle = br.color; ctx.fillRect(br.x, br.y, br.w, br.h);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(br.x, br.y, br.w, br.h);
        }
        // Paddle
        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath(); ctx.roundRect(this.paddle.x - this.paddle.w/2, this.paddle.y, this.paddle.w, this.paddle.h, 7); ctx.fill();
        // Ball
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI*2); ctx.fill();
        // Lives
        this.text(`Lives: ${'❤'.repeat(this.lives)}`, 60, 25, 16);
    }
}

// 4. SPACE BLASTER
class SpaceBlasterGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width;
        this.ship = {x: W/2, y: this.canvas.height - 50, w: 30};
        this.bullets = []; this.aliens = []; this.alienBullets = []; this.particles = [];
        this.wave = 0; this.dead = false; this.keys = {};
        this.spawnWave();
        this.listenKey(e => { this.keys[e.key] = true; if (e.key === ' ') { e.preventDefault(); this.shoot(); } });
        document.addEventListener('keyup', this._keyUp = e => this.keys[e.key] = false);
        this.ui.innerHTML = ''; this.loop();
    }
    stop() { super.stop(); document.removeEventListener('keyup', this._keyUp); }
    spawnWave() {
        this.wave++;
        const cols = Math.min(8, 4 + this.wave), rows = Math.min(4, 2 + Math.floor(this.wave/2));
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
                this.aliens.push({x: 100 + c * 60, y: 40 + r * 45, w: 30, h: 20, alive: true,
                    color: ['#e94560','#ff6b81','#7bed9f','#ffa502'][r % 4]});
        this.alienDir = 1; this.alienSpeed = 0.5 + this.wave * 0.2;
    }
    shoot() {
        if (this.dead) return;
        if (this.bullets.length < 5) this.bullets.push({x: this.ship.x, y: this.ship.y - 15, dy: -8});
    }
    update() {
        if (this.dead) return;
        // Ship movement
        if (this.keys['ArrowLeft']) this.ship.x = Math.max(15, this.ship.x - 5);
        if (this.keys['ArrowRight']) this.ship.x = Math.min(this.canvas.width - 15, this.ship.x + 5);
        // Bullets
        this.bullets = this.bullets.filter(b => { b.y += b.dy; return b.y > 0; });
        // Alien movement
        let edge = false;
        const living = this.aliens.filter(a => a.alive);
        living.forEach(a => { a.x += this.alienDir * this.alienSpeed; if (a.x < 10 || a.x + a.w > this.canvas.width - 10) edge = true; });
        if (edge) { this.alienDir *= -1; living.forEach(a => a.y += 20); }
        // Alien shooting
        if (living.length && Math.random() < 0.02 * this.wave) {
            const a = randChoice(living);
            this.alienBullets.push({x: a.x + a.w/2, y: a.y + a.h, dy: 3 + this.wave * 0.3});
        }
        this.alienBullets = this.alienBullets.filter(b => { b.y += b.dy; return b.y < this.canvas.height; });
        // Bullet-alien collision
        for (const b of this.bullets) {
            for (const a of this.aliens) {
                if (a.alive && b.x > a.x && b.x < a.x+a.w && b.y > a.y && b.y < a.y+a.h) {
                    a.alive = false; b.y = -99; this.setScore(this.score + 25);
                    for (let i = 0; i < 6; i++) this.particles.push({x:a.x+a.w/2, y:a.y+a.h/2, dx:(Math.random()-0.5)*4, dy:(Math.random()-0.5)*4, life:20, color:a.color});
                }
            }
        }
        // Alien bullet hits ship
        for (const b of this.alienBullets) {
            if (Math.abs(b.x - this.ship.x) < 15 && Math.abs(b.y - this.ship.y) < 15) {
                this.dead = true; this.endGame(); this.showOverlay('Game Over', `Wave ${this.wave} | Score: ${this.score}`); return;
            }
        }
        // Alien reaches bottom
        if (living.some(a => a.y + a.h > this.ship.y - 20)) {
            this.dead = true; this.endGame(); this.showOverlay('Game Over', `Score: ${this.score}`); return;
        }
        // Particles
        this.particles = this.particles.filter(p => { p.x += p.dx; p.y += p.dy; return --p.life > 0; });
        // Next wave
        if (!living.length) this.spawnWave();
    }
    render() {
        this.clear('#050510');
        const {ctx} = this;
        // Stars background
        ctx.fillStyle = '#333';
        for (let i = 0; i < 50; i++) ctx.fillRect((i*137+this.score)%this.canvas.width, (i*97)%this.canvas.height, 1, 1);
        // Aliens
        for (const a of this.aliens) {
            if (!a.alive) continue;
            ctx.fillStyle = a.color; ctx.fillRect(a.x, a.y, a.w, a.h);
            ctx.fillStyle = '#000'; ctx.fillRect(a.x+5, a.y+5, 6, 6); ctx.fillRect(a.x+a.w-11, a.y+5, 6, 6);
        }
        // Bullets
        ctx.fillStyle = '#4fc3f7'; this.bullets.forEach(b => ctx.fillRect(b.x-2, b.y, 4, 12));
        ctx.fillStyle = '#e94560'; this.alienBullets.forEach(b => ctx.fillRect(b.x-2, b.y, 4, 8));
        // Ship
        ctx.fillStyle = '#4fc3f7'; ctx.beginPath();
        ctx.moveTo(this.ship.x, this.ship.y - 15); ctx.lineTo(this.ship.x - 15, this.ship.y + 10); ctx.lineTo(this.ship.x + 15, this.ship.y + 10);
        ctx.closePath(); ctx.fill();
        // Particles
        for (const p of this.particles) { ctx.fillStyle = p.color; ctx.globalAlpha = p.life/20; ctx.fillRect(p.x, p.y, 3, 3); }
        ctx.globalAlpha = 1;
        this.text(`Wave ${this.wave}`, this.canvas.width - 60, 25, 14);
    }
}

// 5. PONG
class PongGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.pw = 12; this.ph = 80;
        this.p1 = H/2; this.p2 = H/2; // paddle center Y
        this.ball = {x: W/2, y: H/2, dx: 4, dy: 3, r: 8};
        this.s1 = 0; this.s2 = 0; this.keys = {}; this.dead = false;
        this.listenKey(e => this.keys[e.key] = true);
        document.addEventListener('keyup', this._ku = e => this.keys[e.key] = false);
        this.ui.innerHTML = ''; this.loop();
    }
    stop() { super.stop(); document.removeEventListener('keyup', this._ku); }
    update() {
        if (this.dead) return;
        const H = this.canvas.height, W = this.canvas.width, b = this.ball;
        if (this.keys['w'] || this.keys['W'] || this.keys['ArrowUp']) this.p1 = Math.max(this.ph/2, this.p1 - 6);
        if (this.keys['s'] || this.keys['S'] || this.keys['ArrowDown']) this.p1 = Math.min(H - this.ph/2, this.p1 + 6);
        // AI
        const target = b.y + (b.dy > 0 ? 1 : -1) * 20;
        if (this.p2 < target - 10) this.p2 += 3.5;
        else if (this.p2 > target + 10) this.p2 -= 3.5;
        this.p2 = Math.max(this.ph/2, Math.min(H - this.ph/2, this.p2));
        // Ball
        b.x += b.dx; b.y += b.dy;
        if (b.y - b.r < 0 || b.y + b.r > H) b.dy *= -1;
        // Paddle collision
        if (b.x - b.r < 30 && Math.abs(b.y - this.p1) < this.ph/2) { b.dx = Math.abs(b.dx) * 1.05; b.dy += (b.y - this.p1) * 0.1; }
        if (b.x + b.r > W - 30 && Math.abs(b.y - this.p2) < this.ph/2) { b.dx = -Math.abs(b.dx) * 1.05; b.dy += (b.y - this.p2) * 0.1; }
        // Score
        if (b.x < 0) { this.s2++; this.resetBall(); }
        if (b.x > W) { this.s1++; this.setScore(this.s1 * 100); this.resetBall(); }
        if (this.s1 >= 5 || this.s2 >= 5) {
            this.dead = true; this.endGame();
            this.showOverlay(this.s1 >= 5 ? 'You Win!' : 'You Lose', `${this.s1} - ${this.s2}`);
        }
    }
    resetBall() { this.ball = {x: this.canvas.width/2, y: this.canvas.height/2, dx: 4*(Math.random()>0.5?1:-1), dy: 3*(Math.random()>0.5?1:-1), r: 8}; }
    render() {
        const {ctx} = this, W = this.canvas.width, H = this.canvas.height;
        this.clear('#0a0a18');
        ctx.setLineDash([8, 8]); ctx.strokeStyle = '#333'; ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#4fc3f7'; ctx.fillRect(16, this.p1 - this.ph/2, this.pw, this.ph);
        ctx.fillStyle = '#e94560'; ctx.fillRect(W - 28, this.p2 - this.ph/2, this.pw, this.ph);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI*2); ctx.fill();
        this.text(this.s1, W/2 - 40, 40, 32); this.text(this.s2, W/2 + 40, 40, 32);
        this.text('W/S or ↑↓', 80, H - 15, 12, '#555');
    }
}

// 6. ASTEROID DODGE
class AsteroidGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.ship = {x: W/2, y: H/2, angle: 0, r: 12};
        this.asteroids = []; this.bullets = []; this.particles = [];
        this.keys = {}; this.dead = false; this.spawnTimer = 0;
        this.listenKey(e => { this.keys[e.key] = true; if (e.key === ' ') { e.preventDefault(); this.shoot(); } });
        document.addEventListener('keyup', this._ku2 = e => this.keys[e.key] = false);
        this.ui.innerHTML = ''; this.loop();
    }
    stop() { super.stop(); document.removeEventListener('keyup', this._ku2); }
    shoot() {
        if (this.bullets.length < 8) {
            const a = this.ship.angle;
            this.bullets.push({x: this.ship.x + Math.cos(a)*15, y: this.ship.y + Math.sin(a)*15, dx: Math.cos(a)*7, dy: Math.sin(a)*7, life: 60});
        }
    }
    update() {
        if (this.dead) return;
        const s = this.ship, W = this.canvas.width, H = this.canvas.height;
        if (this.keys['ArrowLeft'] || this.keys['a']) s.angle -= 0.07;
        if (this.keys['ArrowRight'] || this.keys['d']) s.angle += 0.07;
        if (this.keys['ArrowUp'] || this.keys['w']) { s.x += Math.cos(s.angle)*3.5; s.y += Math.sin(s.angle)*3.5; }
        s.x = (s.x + W) % W; s.y = (s.y + H) % H;
        // Spawn asteroids
        if (++this.spawnTimer % Math.max(20, 60 - this.score/5) === 0) {
            const edge = randInt(0, 3), size = randInt(15, 35);
            let ax, ay;
            if (edge === 0) { ax = -size; ay = Math.random()*H; }
            else if (edge === 1) { ax = W+size; ay = Math.random()*H; }
            else if (edge === 2) { ax = Math.random()*W; ay = -size; }
            else { ax = Math.random()*W; ay = H+size; }
            const ang = Math.atan2(H/2 - ay + (Math.random()-0.5)*200, W/2 - ax + (Math.random()-0.5)*200);
            this.asteroids.push({x:ax, y:ay, dx:Math.cos(ang)*(1+Math.random()*2), dy:Math.sin(ang)*(1+Math.random()*2), r:size});
        }
        // Update asteroids
        this.asteroids = this.asteroids.filter(a => { a.x += a.dx; a.y += a.dy; return a.x > -50 && a.x < W+50 && a.y > -50 && a.y < H+50; });
        // Update bullets
        this.bullets = this.bullets.filter(b => { b.x += b.dx; b.y += b.dy; return --b.life > 0; });
        // Bullet-asteroid collision
        for (const b of this.bullets) {
            for (let i = this.asteroids.length - 1; i >= 0; i--) {
                const a = this.asteroids[i], dist = Math.hypot(b.x-a.x, b.y-a.y);
                if (dist < a.r) {
                    b.life = 0; this.setScore(this.score + Math.round(50/a.r*10));
                    for (let j = 0; j < 5; j++) this.particles.push({x:a.x, y:a.y, dx:(Math.random()-0.5)*5, dy:(Math.random()-0.5)*5, life:20});
                    if (a.r > 18) { // Split
                        this.asteroids.push({x:a.x, y:a.y, dx:a.dx+2, dy:a.dy+1, r:a.r*0.6});
                        this.asteroids.push({x:a.x, y:a.y, dx:a.dx-2, dy:a.dy-1, r:a.r*0.6});
                    }
                    this.asteroids.splice(i, 1); break;
                }
            }
        }
        // Ship-asteroid collision
        for (const a of this.asteroids) {
            if (Math.hypot(s.x-a.x, s.y-a.y) < s.r + a.r) {
                this.dead = true; this.endGame(); this.showOverlay('Game Over', `Score: ${this.score}`); return;
            }
        }
        this.particles = this.particles.filter(p => { p.x += p.dx; p.y += p.dy; return --p.life > 0; });
    }
    render() {
        const {ctx, ship} = this;
        this.clear('#050510');
        // Ship
        ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(ship.x + Math.cos(ship.angle)*15, ship.y + Math.sin(ship.angle)*15);
        ctx.lineTo(ship.x + Math.cos(ship.angle+2.5)*12, ship.y + Math.sin(ship.angle+2.5)*12);
        ctx.lineTo(ship.x + Math.cos(ship.angle-2.5)*12, ship.y + Math.sin(ship.angle-2.5)*12);
        ctx.closePath(); ctx.stroke();
        // Asteroids
        ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5;
        for (const a of this.asteroids) { ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI*2); ctx.stroke(); }
        // Bullets
        ctx.fillStyle = '#ffd54f'; this.bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI*2); ctx.fill(); });
        // Particles
        for (const p of this.particles) { ctx.fillStyle = `rgba(255,200,100,${p.life/20})`; ctx.fillRect(p.x, p.y, 2, 2); }
    }
}

// 7. PIXEL JUMP (Doodle Jump style)
class PixelJumpGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.player = {x: W/2, y: H - 100, vy: -10, w: 24, h: 24};
        this.platforms = []; this.camera = 0; this.dead = false; this.keys = {};
        // Generate initial platforms
        for (let i = 0; i < 15; i++) this.platforms.push({x: randInt(20, W-80), y: H - 60 - i*45, w: 60, type: i === 0 ? 'normal' : randChoice(['normal','normal','normal','moving'])});
        this.listenKey(e => this.keys[e.key] = true);
        document.addEventListener('keyup', this._ku3 = e => this.keys[e.key] = false);
        this.ui.innerHTML = ''; this.loop();
    }
    stop() { super.stop(); document.removeEventListener('keyup', this._ku3); }
    update() {
        if (this.dead) return;
        const p = this.player, W = this.canvas.width, H = this.canvas.height;
        if (this.keys['ArrowLeft'] || this.keys['a']) p.x -= 5;
        if (this.keys['ArrowRight'] || this.keys['d']) p.x += 5;
        p.x = (p.x + W) % W;
        p.vy += 0.4; // gravity
        p.y += p.vy;
        // Platform collision (only when falling)
        if (p.vy > 0) {
            for (const pl of this.platforms) {
                if (pl.type === 'moving') pl.x += Math.sin(performance.now()/500 + pl.y) * 2;
                if (p.x + p.w > pl.x && p.x < pl.x + pl.w && p.y + p.h >= pl.y && p.y + p.h <= pl.y + 12) {
                    p.vy = -11; p.y = pl.y - p.h;
                }
            }
        }
        // Camera follow
        if (p.y < H / 3) {
            const shift = H/3 - p.y;
            p.y = H/3; this.camera += shift;
            this.platforms.forEach(pl => pl.y += shift);
            this.setScore(Math.floor(this.camera / 10));
            // Remove fallen platforms, add new ones
            this.platforms = this.platforms.filter(pl => pl.y < H + 20);
            while (this.platforms.length < 12) {
                const topY = Math.min(...this.platforms.map(pl => pl.y));
                this.platforms.push({x: randInt(20, W-80), y: topY - randInt(40, 70), w: randInt(40, 70), type: Math.random() < 0.3 ? 'moving' : 'normal'});
            }
        }
        // Fall off screen
        if (p.y > H + 50) { this.dead = true; this.endGame(); this.showOverlay('Game Over', `Height: ${this.score}`); }
    }
    render() {
        this.clear('#0f0f2a');
        const {ctx, player} = this;
        // Platforms
        for (const pl of this.platforms) {
            ctx.fillStyle = pl.type === 'moving' ? '#ffa502' : '#7bed9f';
            ctx.fillRect(pl.x, pl.y, pl.w, 10);
        }
        // Player
        ctx.fillStyle = '#4fc3f7'; ctx.fillRect(player.x, player.y, player.w, player.h);
        ctx.fillStyle = '#fff';
        ctx.fillRect(player.x + 5, player.y + 6, 5, 5);
        ctx.fillRect(player.x + 14, player.y + 6, 5, 5);
    }
}

// 8. WHACK-A-MOLE
class WhackAMoleGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.grid = Array(9).fill(false); this.timeLeft = 30; this.dead = false;
        this.moleTimer = 0; this.speed = 1000;
        this.listenClick(e => {
            if (this.dead) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            for (let i = 0; i < 9; i++) {
                const col = i % 3, row = Math.floor(i / 3);
                const cx = 150 + col * 200, cy = 140 + row * 160;
                if (this.grid[i] && Math.hypot(mx - cx, my - cy) < 50) {
                    this.grid[i] = false; this.setScore(this.score + 10);
                }
            }
        });
        this.addInterval(() => { if (!this.dead && --this.timeLeft <= 0) { this.dead = true; this.endGame(); this.showOverlay('Time Up!', `Score: ${this.score}`); } }, 1000);
        this.addInterval(() => {
            if (this.dead) return;
            this.grid = this.grid.map(() => false);
            const count = Math.min(3, 1 + Math.floor((30 - this.timeLeft) / 10));
            for (let i = 0; i < count; i++) this.grid[randInt(0, 8)] = true;
        }, 800);
        this.ui.innerHTML = ''; this.loop();
    }
    update() {}
    render() {
        this.clear('#2d1f0e');
        const {ctx} = this;
        for (let i = 0; i < 9; i++) {
            const col = i % 3, row = Math.floor(i / 3);
            const cx = 150 + col * 200, cy = 140 + row * 160;
            // Hole
            ctx.fillStyle = '#1a1000'; ctx.beginPath(); ctx.ellipse(cx, cy + 30, 50, 20, 0, 0, Math.PI*2); ctx.fill();
            if (this.grid[i]) {
                // Mole
                ctx.fillStyle = '#8B4513'; ctx.beginPath(); ctx.arc(cx, cy, 35, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx-10, cy-5, 5, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx+10, cy-5, 5, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#D2691E'; ctx.beginPath(); ctx.ellipse(cx, cy+8, 10, 6, 0, 0, Math.PI*2); ctx.fill();
            }
        }
        this.text(`Time: ${this.timeLeft}s`, this.canvas.width - 80, 30, 20);
        this.text(`Score: ${this.score}`, 80, 30, 20);
        this.text('Click the moles!', this.canvas.width/2, this.canvas.height - 20, 14, '#666');
    }
}

// Register arcade games
Portal.register({id:'snake',name:'Snake',category:'arcade',icon:'🐍',color:'linear-gradient(135deg,#1a472a,#2d8659)',Game:SnakeGame,canvasWidth:600,canvasHeight:600,tags:['classic']});
Portal.register({id:'blocks',name:'Block Blitz',category:'arcade',icon:'🧱',color:'linear-gradient(135deg,#4a1a6b,#7c3aed)',Game:BlockBlitzGame,tags:['tetris','blocks']});
Portal.register({id:'breaker',name:'Brick Breaker',category:'arcade',icon:'🧨',color:'linear-gradient(135deg,#8b1a1a,#e94560)',Game:BrickBreakerGame,tags:['breakout','bricks']});
Portal.register({id:'space',name:'Space Blaster',category:'arcade',icon:'🚀',color:'linear-gradient(135deg,#0a1628,#1a3a5c)',Game:SpaceBlasterGame,tags:['shooter','invaders']});
Portal.register({id:'pong',name:'Pong',category:'arcade',icon:'🏓',color:'linear-gradient(135deg,#1a3a1a,#2d8c2d)',Game:PongGame,tags:['classic','2player']});
Portal.register({id:'asteroids',name:'Asteroid Dodge',category:'arcade',icon:'☄️',color:'linear-gradient(135deg,#1a1a2e,#3a3a5e)',Game:AsteroidGame,tags:['shooter','space']});
Portal.register({id:'pixeljump',name:'Pixel Jump',category:'arcade',icon:'⬆️',color:'linear-gradient(135deg,#0a2a4a,#1a5a8a)',Game:PixelJumpGame,tags:['platformer','jump']});
Portal.register({id:'whack',name:'Whack-a-Mole',category:'arcade',icon:'🔨',color:'linear-gradient(135deg,#4a3a1a,#8b6914)',Game:WhackAMoleGame,tags:['click','reaction']});
