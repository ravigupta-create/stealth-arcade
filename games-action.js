/* === ACTION GAMES (4) === */

// 27. FLAPPY BOUNCE
class FlappyBounceGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.bird = {x: 120, y: H/2, vy: 0, r: 15};
        this.pipes = []; this.pipeTimer = 0; this.gap = 160; this.pipeW = 60;
        this.dead = false; this.started = false; this.speed = 3;
        this.listenKey(e => {
            if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); this.flap(); }
        });
        this.listenClick(() => this.flap());
        this.ui.innerHTML = ''; this.loop();
    }
    flap() {
        if (this.dead) return;
        if (!this.started) this.started = true;
        this.bird.vy = -7;
    }
    update() {
        if (this.dead || !this.started) return;
        const b = this.bird, H = this.canvas.height, W = this.canvas.width;
        b.vy += 0.35; b.y += b.vy;
        // Pipes
        this.pipeTimer++;
        if (this.pipeTimer % 90 === 0) {
            const gapY = randInt(80, H - 80 - this.gap);
            this.pipes.push({x: W, gapY, scored: false});
        }
        this.pipes = this.pipes.filter(p => {
            p.x -= this.speed;
            // Score
            if (!p.scored && p.x + this.pipeW < b.x) { p.scored = true; this.setScore(++this.score); this.speed = 3 + this.score * 0.05; }
            // Collision
            if (b.x + b.r > p.x && b.x - b.r < p.x + this.pipeW) {
                if (b.y - b.r < p.gapY || b.y + b.r > p.gapY + this.gap) {
                    this.dead = true; this.endGame(); this.showOverlay('Game Over', `Score: ${this.score}`);
                }
            }
            return p.x > -this.pipeW;
        });
        // Floor/ceiling
        if (b.y + b.r > H || b.y - b.r < 0) {
            this.dead = true; this.endGame(); this.showOverlay('Game Over', `Score: ${this.score}`);
        }
    }
    render() {
        const {ctx, bird} = this, W = this.canvas.width, H = this.canvas.height;
        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0a0a2a'); grad.addColorStop(1, '#1a1a4a');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
        // Pipes
        ctx.fillStyle = '#2d8659';
        for (const p of this.pipes) {
            ctx.fillRect(p.x, 0, this.pipeW, p.gapY);
            ctx.fillRect(p.x, p.gapY + this.gap, this.pipeW, H - p.gapY - this.gap);
            // Pipe caps
            ctx.fillStyle = '#3aaf70';
            ctx.fillRect(p.x - 4, p.gapY - 20, this.pipeW + 8, 20);
            ctx.fillRect(p.x - 4, p.gapY + this.gap, this.pipeW + 8, 20);
            ctx.fillStyle = '#2d8659';
        }
        // Bird
        ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bird.x+5, bird.y-4, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(bird.x+7, bird.y-4, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#e94560'; ctx.beginPath();
        ctx.moveTo(bird.x+bird.r, bird.y); ctx.lineTo(bird.x+bird.r+10, bird.y-3); ctx.lineTo(bird.x+bird.r+10, bird.y+3); ctx.closePath(); ctx.fill();
        // Wing
        const wingY = Math.sin(performance.now() / 100) * 3;
        ctx.fillStyle = '#ffb74d'; ctx.beginPath();
        ctx.ellipse(bird.x-5, bird.y+wingY, 10, 6, -0.3, 0, Math.PI*2); ctx.fill();
        if (!this.started) this.text('Click or Space to start', W/2, H/2 + 60, 18);
        // Score display
        this.text(this.score, W/2, 50, 40, '#fff');
    }
}

// 28. ENDLESS RUNNER
class EndlessRunnerGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const H = this.canvas.height;
        this.ground = H - 60;
        this.player = {x: 100, y: this.ground, vy: 0, w: 30, h: 40, ducking: false};
        this.obstacles = []; this.spawnTimer = 0; this.speed = 5;
        this.dead = false; this.started = false; this.distance = 0;
        this.particles = []; this.keys = {};
        this.listenKey(e => {
            this.keys[e.key] = true;
            if ((e.key === ' ' || e.key === 'ArrowUp') && !this.dead) {
                e.preventDefault();
                if (!this.started) this.started = true;
                if (this.player.y >= this.ground) this.player.vy = -12;
            }
            if (e.key === 'ArrowDown') this.player.ducking = true;
        });
        document.addEventListener('keyup', this._ku4 = e => { this.keys[e.key] = false; if (e.key === 'ArrowDown') this.player.ducking = false; });
        this.listenClick(() => {
            if (!this.started) this.started = true;
            if (!this.dead && this.player.y >= this.ground) this.player.vy = -12;
        });
        this.ui.innerHTML = ''; this.loop();
    }
    stop() { super.stop(); document.removeEventListener('keyup', this._ku4); }
    update() {
        if (this.dead || !this.started) return;
        const p = this.player;
        // Gravity
        p.vy += 0.6; p.y += p.vy;
        if (p.y > this.ground) { p.y = this.ground; p.vy = 0; }
        p.h = p.ducking && p.y >= this.ground ? 20 : 40;
        // Distance/score
        this.distance += this.speed;
        this.setScore(Math.floor(this.distance / 10));
        this.speed = 5 + this.score / 100;
        // Spawn obstacles
        this.spawnTimer++;
        if (this.spawnTimer > Math.max(30, 80 - this.score/5)) {
            this.spawnTimer = 0;
            const type = Math.random() < 0.3 ? 'bird' : 'cactus';
            if (type === 'cactus') {
                const h = randInt(25, 50);
                this.obstacles.push({x: this.canvas.width + 20, y: this.ground - h + p.h, w: randInt(15, 30), h, type});
            } else {
                this.obstacles.push({x: this.canvas.width + 20, y: this.ground - randInt(20, 60), w: 30, h: 20, type});
            }
        }
        // Update obstacles
        this.obstacles = this.obstacles.filter(o => {
            o.x -= this.speed;
            // Collision
            const px = p.x, py = p.y - p.h + p.h, pw = p.w, ph = p.h;
            const playerTop = p.y - p.h;
            if (px + pw > o.x && px < o.x + o.w && p.y > o.y - o.h && playerTop < o.y) {
                this.dead = true; this.endGame(); this.showOverlay('Game Over', `Distance: ${this.score}`);
                for (let i = 0; i < 10; i++) this.particles.push({x:p.x+p.w/2, y:p.y-p.h/2, dx:(Math.random()-0.5)*6, dy:(Math.random()-0.5)*6, life:30});
            }
            return o.x > -50;
        });
        // Ground particles
        if (p.y >= this.ground && Math.random() < 0.3) {
            this.particles.push({x: p.x, y: this.ground, dx: -this.speed*0.5 + (Math.random()-0.5)*2, dy: -Math.random()*2, life: 15});
        }
        this.particles = this.particles.filter(pt => { pt.x += pt.dx; pt.y += pt.dy; return --pt.life > 0; });
    }
    render() {
        const {ctx, player: p} = this, W = this.canvas.width, H = this.canvas.height;
        this.clear('#0f0f1a');
        // Ground
        ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, this.ground + p.h, W, H - this.ground);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, this.ground + p.h); ctx.lineTo(W, this.ground + p.h); ctx.stroke();
        // Moving ground dots
        ctx.fillStyle = '#333';
        for (let i = 0; i < 20; i++) {
            const x = ((i * 50 - this.distance * 0.5) % W + W) % W;
            ctx.fillRect(x, this.ground + p.h + 10, 20, 1);
        }
        // Obstacles
        for (const o of this.obstacles) {
            if (o.type === 'cactus') {
                ctx.fillStyle = '#2d8659';
                ctx.fillRect(o.x, o.y - o.h, o.w, o.h);
                ctx.fillRect(o.x - 5, o.y - o.h + 5, o.w + 10, 5);
            } else {
                ctx.fillStyle = '#e94560';
                ctx.beginPath();
                ctx.moveTo(o.x, o.y - o.h/2);
                ctx.lineTo(o.x + o.w, o.y - o.h);
                ctx.lineTo(o.x + o.w, o.y);
                ctx.closePath(); ctx.fill();
            }
        }
        // Player
        ctx.fillStyle = '#4fc3f7';
        ctx.fillRect(p.x, p.y - p.h, p.w, p.h);
        // Eyes
        ctx.fillStyle = '#fff'; ctx.fillRect(p.x + p.w - 12, p.y - p.h + 8, 5, 5); ctx.fillRect(p.x + p.w - 5, p.y - p.h + 8, 5, 5);
        ctx.fillStyle = '#000'; ctx.fillRect(p.x + p.w - 10, p.y - p.h + 10, 2, 2); ctx.fillRect(p.x + p.w - 3, p.y - p.h + 10, 2, 2);
        // Running legs animation
        if (p.y >= this.ground && this.started && !this.dead) {
            const legPhase = Math.sin(performance.now() / 80);
            ctx.fillStyle = '#3a9fd4';
            ctx.fillRect(p.x + 5 + legPhase * 5, p.y, 8, 6);
            ctx.fillRect(p.x + 15 - legPhase * 5, p.y, 8, 6);
        }
        // Particles
        for (const pt of this.particles) {
            ctx.fillStyle = `rgba(79,195,247,${pt.life/30})`; ctx.fillRect(pt.x, pt.y, 3, 3);
        }
        if (!this.started) this.text('Space/Click to Jump | Down to Duck', W/2, H/2, 16);
        this.text(this.score, W/2, 40, 28, '#fff');
    }
}

// 29. AIM TRAINER
class AimTrainerGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.targets = []; this.hits = 0; this.misses = 0; this.timeLeft = 30;
        this.dead = false; this.totalClicks = 0;
        this.spawnTarget();
        this.addInterval(() => {
            if (!this.dead && --this.timeLeft <= 0) {
                this.dead = true; this.endGame();
                const acc = this.totalClicks ? Math.round(this.hits / this.totalClicks * 100) : 0;
                this.showOverlay('Time Up!', `Hits: ${this.hits} | Accuracy: ${acc}%`);
            }
        }, 1000);
        this.addInterval(() => { if (!this.dead && this.targets.length < 3) this.spawnTarget(); }, 800);
        this.listenClick(e => {
            if (this.dead) return;
            this.totalClicks++;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            let hit = false;
            for (let i = this.targets.length - 1; i >= 0; i--) {
                const t = this.targets[i];
                if (Math.hypot(mx - t.x, my - t.y) < t.r) {
                    this.targets.splice(i, 1); this.hits++;
                    this.setScore(this.hits * 50);
                    hit = true;
                    // Hit particles
                    for (let j = 0; j < 8; j++) this.particles.push({x:t.x, y:t.y, dx:(Math.random()-0.5)*8, dy:(Math.random()-0.5)*8, life:20, color:t.color});
                    this.spawnTarget();
                    break;
                }
            }
            if (!hit) this.misses++;
        });
        this.particles = [];
        this.ui.innerHTML = ''; this.loop();
    }
    spawnTarget() {
        const r = randInt(20, 40);
        const colors = ['#e94560','#ff6b81','#ffa502','#7bed9f','#70a1ff','#a29bfe'];
        this.targets.push({
            x: randInt(r + 20, this.canvas.width - r - 20),
            y: randInt(r + 40, this.canvas.height - r - 20),
            r, color: randChoice(colors), born: performance.now()
        });
    }
    update() {
        // Remove old targets
        this.targets = this.targets.filter(t => performance.now() - t.born < 3000);
        this.particles = this.particles.filter(p => { p.x += p.dx; p.y += p.dy; return --p.life > 0; });
    }
    render() {
        this.clear('#0a0a18');
        const {ctx} = this;
        // Crosshair grid
        ctx.strokeStyle = '#111'; ctx.lineWidth = 0.5;
        for (let x = 0; x < this.canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,this.canvas.height); ctx.stroke(); }
        for (let y = 0; y < this.canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(this.canvas.width,y); ctx.stroke(); }
        // Targets
        for (const t of this.targets) {
            const age = (performance.now() - t.born) / 3000;
            const alpha = age > 0.7 ? 1 - (age - 0.7) / 0.3 : 1;
            ctx.globalAlpha = alpha;
            // Outer ring
            ctx.strokeStyle = t.color; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI*2); ctx.stroke();
            // Inner ring
            ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.6, 0, Math.PI*2); ctx.stroke();
            // Bullseye
            ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.25, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = 1;
        }
        // Particles
        for (const p of this.particles) { ctx.fillStyle = p.color; ctx.globalAlpha = p.life/20; ctx.fillRect(p.x-2, p.y-2, 4, 4); }
        ctx.globalAlpha = 1;
        // HUD
        const acc = this.totalClicks ? Math.round(this.hits / this.totalClicks * 100) : 0;
        this.text(`Time: ${this.timeLeft}s`, 70, 25, 16, this.timeLeft <= 5 ? '#e94560' : '#e0e0e0');
        this.text(`Hits: ${this.hits}`, this.canvas.width/2, 25, 16, '#7bed9f');
        this.text(`Accuracy: ${acc}%`, this.canvas.width - 80, 25, 16, '#4fc3f7');
    }
}

// 30. REACTION TIME
class ReactionTimeGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.state = 'waiting'; // waiting, ready, go, result
        this.round = 0; this.maxRounds = 5; this.times = [];
        this.waitStart = 0; this.goTime = 0;
        this.message = 'Click to start'; this.dead = false;
        this.listenClick(() => this.handleClick());
        this.ui.innerHTML = ''; this.loop();
    }
    handleClick() {
        if (this.dead) return;
        switch (this.state) {
            case 'waiting':
                this.state = 'ready';
                this.message = 'Wait for green...';
                this.waitStart = performance.now();
                this.goDelay = randInt(1500, 4000);
                break;
            case 'ready':
                // Clicked too early
                this.message = 'Too early! Click to try again';
                this.state = 'waiting';
                break;
            case 'go':
                const reaction = Math.round(performance.now() - this.goTime);
                this.times.push(reaction);
                this.round++;
                this.message = `${reaction}ms! Round ${this.round}/${this.maxRounds}`;
                this.state = this.round >= this.maxRounds ? 'done' : 'waiting';
                if (this.state === 'done') {
                    const avg = Math.round(this.times.reduce((a,b) => a+b, 0) / this.times.length);
                    const best = Math.min(...this.times);
                    this.setScore(Math.max(0, 500 - avg));
                    this.dead = true; this.endGame();
                    this.showOverlay('Results', `Average: ${avg}ms | Best: ${best}ms`);
                }
                break;
        }
    }
    update() {
        if (this.state === 'ready' && performance.now() - this.waitStart >= this.goDelay) {
            this.state = 'go'; this.goTime = performance.now();
            this.message = 'CLICK NOW!';
        }
    }
    render() {
        const {ctx} = this, W = this.canvas.width, H = this.canvas.height;
        const colors = {waiting: '#1a1a2e', ready: '#8b1a1a', go: '#1a6b2a', done: '#1a1a2e'};
        ctx.fillStyle = colors[this.state] || '#1a1a2e'; ctx.fillRect(0, 0, W, H);
        this.text(this.message, W/2, H/2, this.state === 'go' ? 40 : 24, '#fff');
        if (this.state === 'waiting' && this.round > 0) {
            this.text(`Round ${this.round + 1}/${this.maxRounds} - Click to continue`, W/2, H/2 + 50, 16, '#888');
        }
        // Show previous times
        if (this.times.length) {
            this.text('Previous:', W/2, H - 80, 14, '#666');
            this.text(this.times.map(t => t + 'ms').join('  |  '), W/2, H - 55, 14, '#4fc3f7');
        }
        // Instructions
        if (this.state === 'waiting' && this.round === 0) {
            this.text('Test your reaction time! 5 rounds.', W/2, H/2 + 50, 16, '#888');
        }
    }
}

// Register action games
Portal.register({id:'flappy',name:'Flappy Bounce',category:'action',icon:'🐤',color:'linear-gradient(135deg,#0a3a2a,#1a6a4a)',Game:FlappyBounceGame,tags:['flappy','bird']});
Portal.register({id:'runner',name:'Endless Runner',category:'action',icon:'🏃',color:'linear-gradient(135deg,#2a1a0a,#5a3a1a)',Game:EndlessRunnerGame,tags:['run','jump']});
Portal.register({id:'aim',name:'Aim Trainer',category:'action',icon:'🎯',color:'linear-gradient(135deg,#3a0a0a,#6a1a1a)',Game:AimTrainerGame,tags:['click','accuracy']});
Portal.register({id:'reaction',name:'Reaction Time',category:'action',icon:'⚡',color:'linear-gradient(135deg,#0a2a0a,#1a5a1a)',Game:ReactionTimeGame,canvasWidth:700,canvasHeight:500,tags:['reflex','speed']});
