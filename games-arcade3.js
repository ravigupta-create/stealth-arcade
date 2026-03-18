/* === ARCADE GAMES 3 (8) === */

// 1. DOODLE JUMP
class DoodleJumpGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.W = W; this.H = H;
        this.player = { x: W / 2, y: H - 150, w: 36, h: 36, vy: -10, vx: 0 };
        this.platforms = [];
        this.particles = [];
        this.shakeTimer = 0; this.shakeIntensity = 0;
        this.cameraY = 0; this.maxHeight = 0;
        this.dead = false; this.deadTimer = 0;
        this.stars = Array.from({ length: 60 }, () => ({
            x: Math.random() * W, y: Math.random() * H * 3, r: Math.random() * 1.5 + 0.5, twinkle: Math.random() * Math.PI * 2
        }));
        // Generate initial platforms
        for (let i = 0; i < 12; i++) {
            this.platforms.push(this.makePlatform(W / 2 - 30, H - 50 - i * 70));
        }
        // Solid starting platform
        this.platforms[0].w = 120; this.platforms[0].type = 'normal';
        this.platforms[0].x = W / 2 - 60;
        this.keys = {};
        this.listenKey(e => { this.keys[e.key] = true; e.preventDefault(); });
        document.addEventListener('keyup', this._ku = e => this.keys[e.key] = false);
        this.ui.innerHTML = ''; this.loop();
    }
    stop() { super.stop(); document.removeEventListener('keyup', this._ku); }
    makePlatform(hintX, y) {
        const W = this.W;
        const difficulty = Math.max(0, -y / 2000);
        const r = Math.random();
        let type = 'normal';
        if (difficulty > 0.3 && r < 0.15) type = 'moving';
        else if (difficulty > 0.5 && r < 0.25) type = 'breaking';
        else if (difficulty > 0.8 && r < 0.1) type = 'vanish';
        const w = Math.max(45, 70 - difficulty * 15);
        return {
            x: Math.max(10, Math.min(W - w - 10, hintX + (Math.random() - 0.5) * 200)),
            y, w, h: 12, type,
            moveDir: Math.random() > 0.5 ? 1 : -1,
            moveSpeed: 1 + difficulty * 1.5,
            broken: false, vanishTimer: -1,
            glow: 0
        };
    }
    update() {
        if (this.dead) { this.deadTimer++; if (this.deadTimer > 60) return; }
        const { player: p, W, H } = this;
        // Input
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) p.vx = -6;
        else if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) p.vx = 6;
        else p.vx *= 0.85;
        p.x += p.vx;
        // Wrap around screen
        if (p.x + p.w < 0) p.x = W;
        if (p.x > W) p.x = -p.w;
        // Gravity
        p.vy += 0.35;
        p.y += p.vy;
        // Platform collision (only when falling)
        if (p.vy > 0 && !this.dead) {
            for (const plat of this.platforms) {
                if (plat.broken) continue;
                if (p.x + p.w > plat.x && p.x < plat.x + plat.w &&
                    p.y + p.h >= plat.y && p.y + p.h <= plat.y + plat.h + p.vy + 2) {
                    if (plat.type === 'breaking') {
                        plat.broken = true;
                        this.spawnBreakParticles(plat);
                        this.shakeTimer = 4; this.shakeIntensity = 3;
                        continue;
                    }
                    if (plat.type === 'vanish') {
                        if (plat.vanishTimer < 0) plat.vanishTimer = 30;
                    }
                    p.vy = -11 - Math.min(3, Math.max(0, -this.cameraY / 5000));
                    p.y = plat.y - p.h;
                    plat.glow = 10;
                    // Bounce particles
                    for (let i = 0; i < 5; i++) {
                        this.particles.push({
                            x: p.x + p.w / 2, y: p.y + p.h,
                            vx: (Math.random() - 0.5) * 4, vy: Math.random() * 2 + 1,
                            life: 15, color: plat.type === 'moving' ? '#ff6b6b' : '#6bffb8', size: 3
                        });
                    }
                }
            }
        }
        // Move moving platforms
        for (const plat of this.platforms) {
            if (plat.type === 'moving') {
                plat.x += plat.moveSpeed * plat.moveDir;
                if (plat.x <= 0 || plat.x + plat.w >= W) plat.moveDir *= -1;
            }
            if (plat.vanishTimer > 0) { plat.vanishTimer--; if (plat.vanishTimer <= 0) plat.broken = true; }
            if (plat.glow > 0) plat.glow--;
        }
        // Camera scrolling - scroll when player goes above mid
        if (!this.dead) {
            const scrollLine = H * 0.4;
            if (p.y < this.cameraY + scrollLine) {
                this.cameraY = p.y - scrollLine;
            }
            // Score based on max height
            const height = Math.floor(-this.cameraY / 10);
            if (height > this.score) { this.setScore(height); }
        }
        // Generate new platforms above
        const topY = this.cameraY - 100;
        while (this.platforms.length === 0 || this.platforms[this.platforms.length - 1].y > topY) {
            const lastY = this.platforms.length > 0 ? this.platforms[this.platforms.length - 1].y : H;
            const gap = 55 + Math.random() * 35 + Math.min(25, Math.max(0, -this.cameraY / 3000) * 10);
            this.platforms.push(this.makePlatform(this.platforms.length > 0 ? this.platforms[this.platforms.length - 1].x : W / 2, lastY - gap));
        }
        // Remove platforms below screen
        this.platforms = this.platforms.filter(pl => pl.y < this.cameraY + H + 50);
        // Death check - fell below screen
        if (!this.dead && p.y > this.cameraY + H + 50) {
            this.dead = true;
            this.shakeTimer = 10; this.shakeIntensity = 6;
            for (let i = 0; i < 20; i++) {
                this.particles.push({
                    x: p.x + p.w / 2, y: p.y,
                    vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
                    life: 30, color: randChoice(['#4fc3f7', '#81c784', '#fff']), size: randInt(2, 5)
                });
            }
            this.endGame();
            this.showOverlay('Game Over', `Height: ${this.score}`);
        }
        // Particles
        this.particles = this.particles.filter(pt => {
            pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.1;
            return --pt.life > 0;
        });
        if (this.shakeTimer > 0) this.shakeTimer--;
    }
    spawnBreakParticles(plat) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: plat.x + Math.random() * plat.w, y: plat.y + plat.h / 2,
                vx: (Math.random() - 0.5) * 5, vy: Math.random() * 3 + 1,
                life: 25, color: '#ff9f43', size: randInt(3, 6)
            });
        }
    }
    render() {
        const { ctx, W, H } = this;
        // Background gradient based on height
        const heightFactor = Math.min(1, Math.max(0, -this.cameraY / 10000));
        const r = Math.floor(15 - heightFactor * 10);
        const g = Math.floor(30 - heightFactor * 20);
        const b = Math.floor(42 + heightFactor * 30);
        this.clear(`rgb(${r},${g},${b})`);
        ctx.save();
        // Screen shake
        if (this.shakeTimer > 0) {
            ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
        }
        // Camera
        ctx.translate(0, -this.cameraY);
        // Stars
        for (const s of this.stars) {
            const sy = ((s.y - this.cameraY * 0.3) % (H * 3));
            s.twinkle += 0.03;
            ctx.globalAlpha = 0.3 + Math.sin(s.twinkle) * 0.3;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(s.x, this.cameraY + sy, s.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Platforms
        for (const plat of this.platforms) {
            if (plat.broken) continue;
            let color, glowColor;
            if (plat.type === 'normal') { color = '#4ade80'; glowColor = '#22c55e'; }
            else if (plat.type === 'moving') { color = '#f87171'; glowColor = '#ef4444'; }
            else if (plat.type === 'breaking') { color = '#fbbf24'; glowColor = '#f59e0b'; }
            else if (plat.type === 'vanish') {
                const alpha = plat.vanishTimer > 0 ? plat.vanishTimer / 30 : 1;
                ctx.globalAlpha = alpha;
                color = '#a78bfa'; glowColor = '#8b5cf6';
            }
            if (plat.glow > 0) {
                ctx.shadowColor = glowColor; ctx.shadowBlur = plat.glow * 3;
            }
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(plat.x, plat.y, plat.w, plat.h, 6);
            ctx.fill();
            // Top highlight
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(plat.x + 3, plat.y + 1, plat.w - 6, 3);
            ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        }
        // Player
        if (!this.dead) {
            const p = this.player;
            // Trail
            ctx.fillStyle = 'rgba(79,195,247,0.15)';
            ctx.beginPath();
            ctx.ellipse(p.x + p.w / 2, p.y + p.h + 5, p.w / 2 + 3, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            // Body
            ctx.fillStyle = '#4fc3f7';
            ctx.shadowColor = '#4fc3f7'; ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.w, p.h, 8);
            ctx.fill();
            ctx.shadowBlur = 0;
            // Face
            const faceDir = p.vx > 0.5 ? 3 : p.vx < -0.5 ? -3 : 0;
            // Eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(p.x + 12 + faceDir, p.y + 14, 6, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x + 24 + faceDir, p.y + 14, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.arc(p.x + 13 + faceDir, p.y + 14, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x + 25 + faceDir, p.y + 14, 3, 0, Math.PI * 2); ctx.fill();
            // Mouth
            if (p.vy < -3) {
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(p.x + p.w / 2 + faceDir, p.y + 26, 6, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
            }
        }
        // Particles
        for (const pt of this.particles) {
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = pt.life / 30;
            ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
        // HUD
        this.text(`${this.score}`, W / 2, 40, 32, '#fff');
        this.text('Arrow keys to move', W / 2, H - 12, 12, '#555');
    }
}

// 2. BALL BOUNCE
class BallBounceGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.W = W; this.H = H;
        this.ball = { x: W / 2, y: H / 2, vx: 2, vy: 0, r: 12 };
        this.platforms = [{ x: W / 2 - 50, y: H - 80, w: 100, h: 10, timer: -1, born: 0 }];
        this.particles = [];
        this.bounceCount = 0;
        this.dead = false;
        this.shakeTimer = 0; this.shakeIntensity = 0;
        this.gravity = 0.25;
        this.trailPoints = [];
        this.comboTimer = 0; this.combo = 0;
        this.mouseX = W / 2; this.mouseY = H / 2;
        this.lastPlatTime = 0;
        this.listenMouse('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) * (W / rect.width);
            this.mouseY = (e.clientY - rect.top) * (H / rect.height);
        });
        this.listenClick(e => {
            if (this.dead) return;
            const now = performance.now();
            if (now - this.lastPlatTime < 200) return; // cooldown
            this.lastPlatTime = now;
            const pw = 60 + Math.random() * 30;
            this.platforms.push({
                x: this.mouseX - pw / 2, y: this.mouseY,
                w: pw, h: 8, timer: 180, born: now // 3 seconds
            });
        });
        this.ui.innerHTML = ''; this.loop();
    }
    update() {
        if (this.dead) return;
        const { ball: b, W, H } = this;
        // Physics
        b.vy += this.gravity;
        b.x += b.vx;
        b.y += b.vy;
        // Trail
        this.trailPoints.push({ x: b.x, y: b.y, life: 15 });
        this.trailPoints = this.trailPoints.filter(t => --t.life > 0);
        // Wall bouncing
        if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.95; }
        if (b.x + b.r > W) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.95; }
        if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); }
        // Platform collisions
        for (const p of this.platforms) {
            if (b.vy > 0 && b.y + b.r >= p.y && b.y + b.r <= p.y + p.h + b.vy + 2 &&
                b.x + b.r > p.x && b.x - b.r < p.x + p.w) {
                b.vy = -9 - Math.min(3, this.bounceCount * 0.05);
                b.vx += (Math.random() - 0.5) * 2;
                b.y = p.y - b.r;
                this.bounceCount++;
                this.combo++;
                this.comboTimer = 60;
                const pts = this.combo >= 5 ? this.combo * 3 : this.combo;
                this.setScore(this.score + pts);
                this.shakeTimer = 3; this.shakeIntensity = 2 + Math.min(3, this.combo * 0.3);
                // Bounce particles
                const hue = (this.bounceCount * 25) % 360;
                for (let i = 0; i < 8; i++) {
                    this.particles.push({
                        x: b.x, y: b.y + b.r,
                        vx: (Math.random() - 0.5) * 6, vy: Math.random() * 3 + 1,
                        life: 20, color: `hsl(${hue}, 80%, 65%)`, size: randInt(2, 5)
                    });
                }
            }
        }
        // Platform timers
        this.platforms = this.platforms.filter(p => {
            if (p.timer > 0) { p.timer--; return p.timer > 0; }
            return p.timer < 0; // permanent platforms (initial)
        });
        // Combo timer
        if (this.comboTimer > 0) this.comboTimer--;
        else this.combo = 0;
        // Death
        if (b.y - b.r > H + 20) {
            this.dead = true;
            for (let i = 0; i < 25; i++) {
                this.particles.push({
                    x: b.x, y: H,
                    vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 8,
                    life: 35, color: randChoice(['#a78bfa', '#818cf8', '#c4b5fd', '#fff']), size: randInt(3, 7)
                });
            }
            this.shakeTimer = 10; this.shakeIntensity = 6;
            this.endGame();
            this.showOverlay('Game Over', `Bounces: ${this.bounceCount} | Score: ${this.score}`);
        }
        // Particles
        this.particles = this.particles.filter(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.1; return --pt.life > 0; });
        if (this.shakeTimer > 0) this.shakeTimer--;
    }
    render() {
        const { ctx, W, H, ball: b } = this;
        this.clear('#0f0a1e');
        ctx.save();
        if (this.shakeTimer > 0) {
            ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
        }
        // Background grid
        ctx.strokeStyle = 'rgba(100,60,180,0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        // Platforms
        for (const p of this.platforms) {
            const fade = p.timer > 0 ? Math.min(1, p.timer / 30) : 1;
            ctx.globalAlpha = fade;
            const hue = p.timer > 0 ? (p.timer > 90 ? 260 : p.timer > 45 ? 30 : 0) : 260;
            ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${fade})`;
            ctx.shadowColor = `hsl(${hue}, 70%, 55%)`; ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, 4); ctx.fill();
            ctx.shadowBlur = 0;
            // Timer bar
            if (p.timer > 0) {
                const pct = p.timer / 180;
                ctx.fillStyle = `hsla(${hue}, 80%, 70%, 0.5)`;
                ctx.fillRect(p.x, p.y + p.h, p.w * pct, 2);
            }
        }
        ctx.globalAlpha = 1;
        // Ball trail
        for (const t of this.trailPoints) {
            ctx.fillStyle = `rgba(167,139,250,${t.life / 20})`;
            ctx.beginPath(); ctx.arc(t.x, t.y, b.r * (t.life / 15) * 0.6, 0, Math.PI * 2); ctx.fill();
        }
        // Ball
        if (!this.dead) {
            const hue = (this.bounceCount * 15) % 360;
            ctx.fillStyle = `hsl(${hue}, 80%, 65%)`;
            ctx.shadowColor = `hsl(${hue}, 80%, 65%)`; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath(); ctx.arc(b.x - 3, b.y - 3, b.r * 0.4, 0, Math.PI * 2); ctx.fill();
        }
        // Particles
        for (const pt of this.particles) {
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = pt.life / 35;
            ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
        }
        ctx.globalAlpha = 1;
        // Mouse hint platform preview
        if (!this.dead) {
            ctx.strokeStyle = 'rgba(167,139,250,0.3)'; ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(this.mouseX - 40, this.mouseY - 4, 80, 8);
            ctx.setLineDash([]);
        }
        ctx.restore();
        // HUD
        this.text(`${this.score}`, W / 2, 40, 32, '#fff');
        if (this.combo > 2) this.text(`${this.combo}x Combo!`, W / 2, 68, 16, '#fbbf24');
        this.text(`Bounces: ${this.bounceCount}`, W / 2, H - 30, 14, '#888');
        this.text('Click to place platforms', W / 2, H - 12, 12, '#555');
    }
}

// 3. GRAVITY FLIP
class GravityFlipGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.W = W; this.H = H;
        this.player = { x: 100, y: H / 2, w: 24, h: 24 };
        this.gravDir = 1; // 1=down, -1=up
        this.vy = 0;
        this.speed = 3;
        this.obstacles = [];
        this.particles = [];
        this.trailParticles = [];
        this.dead = false;
        this.distance = 0;
        this.shakeTimer = 0; this.shakeIntensity = 0;
        this.spawnTimer = 0;
        this.floorY = H - 30;
        this.ceilY = 30;
        this.flipping = false; this.flipAnim = 0;
        this.lastTime = performance.now();
        this.listenKey(e => {
            if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') && !this.dead) {
                this.flip(); e.preventDefault();
            }
        });
        this.listenClick(() => { if (!this.dead) this.flip(); });
        this.ui.innerHTML = ''; this.loop();
    }
    flip() {
        this.gravDir *= -1;
        this.vy = 0;
        this.flipping = true; this.flipAnim = 0;
        // Flip particles
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: this.player.x, y: this.player.y + this.player.h / 2,
                vx: -Math.random() * 3 - 1, vy: (Math.random() - 0.5) * 4,
                life: 18, color: this.gravDir > 0 ? '#06b6d4' : '#f472b6', size: 3
            });
        }
    }
    update() {
        if (this.dead) return;
        const { player: p, W, H } = this;
        const dt = 1;
        // Gravity + movement
        this.vy += 0.55 * this.gravDir;
        this.vy = Math.max(-12, Math.min(12, this.vy));
        p.y += this.vy;
        // Speed increases over time
        this.speed = 3 + this.distance * 0.0008;
        this.distance += this.speed;
        this.setScore(Math.floor(this.distance / 10));
        // Flip animation
        if (this.flipping) { this.flipAnim += 0.2; if (this.flipAnim >= Math.PI) this.flipping = false; }
        // Trail particles
        if (Math.random() < 0.5) {
            this.trailParticles.push({
                x: p.x - 2, y: p.y + p.h / 2 + (Math.random() - 0.5) * p.h * 0.6,
                life: 12, size: Math.random() * 3 + 1,
                color: this.gravDir > 0 ? 'rgba(6,182,212,0.5)' : 'rgba(244,114,182,0.5)'
            });
        }
        // Floor/ceiling collision
        if (p.y + p.h > this.floorY) { p.y = this.floorY - p.h; this.vy = 0; }
        if (p.y < this.ceilY) { p.y = this.ceilY; this.vy = 0; }
        // Spawn obstacles
        this.spawnTimer -= this.speed;
        if (this.spawnTimer <= 0) {
            this.spawnObstacle();
            this.spawnTimer = 180 + Math.random() * 100 - Math.min(80, this.distance * 0.01);
        }
        // Move obstacles
        for (const obs of this.obstacles) {
            obs.x -= this.speed;
        }
        this.obstacles = this.obstacles.filter(o => o.x + o.w > -20);
        // Collision with obstacles
        for (const obs of this.obstacles) {
            if (p.x + p.w > obs.x + 4 && p.x < obs.x + obs.w - 4 &&
                p.y + p.h > obs.y + 4 && p.y < obs.y + obs.h - 4) {
                this.die();
                return;
            }
        }
        // Particles
        this.particles = this.particles.filter(pt => { pt.x += pt.vx; pt.y += pt.vy; return --pt.life > 0; });
        this.trailParticles = this.trailParticles.filter(pt => { pt.x -= this.speed * 0.5; return --pt.life > 0; });
        if (this.shakeTimer > 0) this.shakeTimer--;
    }
    spawnObstacle() {
        const H = this.H;
        const gapSize = Math.max(100, 180 - this.distance * 0.005);
        const gapY = this.ceilY + 30 + Math.random() * (this.floorY - this.ceilY - gapSize - 60);
        const w = 25 + Math.random() * 15;
        // Top obstacle
        this.obstacles.push({ x: this.W + 10, y: this.ceilY, w, h: gapY - this.ceilY, color: '#e94560' });
        // Bottom obstacle
        this.obstacles.push({ x: this.W + 10, y: gapY + gapSize, w, h: this.floorY - gapY - gapSize, color: '#e94560' });
    }
    die() {
        this.dead = true;
        this.shakeTimer = 12; this.shakeIntensity = 8;
        const p = this.player;
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: p.x + p.w / 2, y: p.y + p.h / 2,
                vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                life: 35, color: randChoice(['#06b6d4', '#f472b6', '#fff', '#fbbf24']), size: randInt(2, 6)
            });
        }
        this.endGame();
        this.showOverlay('Game Over', `Distance: ${this.score}`);
    }
    render() {
        const { ctx, W, H, player: p } = this;
        this.clear('#0a1520');
        ctx.save();
        if (this.shakeTimer > 0) ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
        // Neon grid background (scrolling)
        const offset = this.distance % 50;
        ctx.strokeStyle = 'rgba(6,182,212,0.06)'; ctx.lineWidth = 1;
        for (let x = -offset; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        // Floor and ceiling
        const floorGrad = ctx.createLinearGradient(0, this.floorY, 0, H);
        floorGrad.addColorStop(0, '#06b6d4'); floorGrad.addColorStop(1, '#0a1520');
        ctx.fillStyle = floorGrad; ctx.fillRect(0, this.floorY, W, H - this.floorY);
        const ceilGrad = ctx.createLinearGradient(0, 0, 0, this.ceilY);
        ceilGrad.addColorStop(0, '#0a1520'); ceilGrad.addColorStop(1, '#f472b6');
        ctx.fillStyle = ceilGrad; ctx.fillRect(0, 0, W, this.ceilY);
        // Neon lines
        ctx.fillStyle = '#06b6d4'; ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 10;
        ctx.fillRect(0, this.floorY, W, 2);
        ctx.fillStyle = '#f472b6'; ctx.shadowColor = '#f472b6';
        ctx.fillRect(0, this.ceilY - 2, W, 2);
        ctx.shadowBlur = 0;
        // Trail particles
        for (const t of this.trailParticles) {
            ctx.fillStyle = t.color; ctx.globalAlpha = t.life / 12;
            ctx.fillRect(t.x, t.y - t.size / 2, t.size, t.size);
        }
        ctx.globalAlpha = 1;
        // Obstacles
        for (const obs of this.obstacles) {
            ctx.fillStyle = obs.color;
            ctx.shadowColor = obs.color; ctx.shadowBlur = 8;
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            // Neon edge
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(obs.x, obs.y, obs.w, 2);
            ctx.fillRect(obs.x, obs.y + obs.h - 2, obs.w, 2);
        }
        ctx.shadowBlur = 0;
        // Player
        if (!this.dead) {
            ctx.save();
            ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
            if (this.flipping) ctx.rotate(this.flipAnim * this.gravDir);
            const pColor = this.gravDir > 0 ? '#06b6d4' : '#f472b6';
            ctx.fillStyle = pColor; ctx.shadowColor = pColor; ctx.shadowBlur = 12;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.shadowBlur = 0;
            // Eye
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(4, -2 * this.gravDir, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.arc(5, -2 * this.gravDir, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
        // Particles
        for (const pt of this.particles) {
            ctx.fillStyle = pt.color; ctx.globalAlpha = pt.life / 35;
            ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
        // HUD
        this.text(`${this.score}`, W / 2, 60, 32, '#fff');
        this.text('Click/Space to flip gravity', W / 2, H - 8, 12, '#555');
    }
}

// 4. CATCH THE FALLING
class CatcherGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.W = W; this.H = H;
        this.basket = { x: W / 2, y: H - 60, w: 70, h: 40 };
        this.items = [];
        this.particles = [];
        this.lives = 3;
        this.combo = 0; this.maxCombo = 0;
        this.comboTimer = 0;
        this.dead = false;
        this.shakeTimer = 0; this.shakeIntensity = 0;
        this.spawnTimer = 0;
        this.difficulty = 1;
        this.itemTypes = [
            { emoji: '🍎', points: 10, color: '#ef4444', type: 'fruit' },
            { emoji: '🍊', points: 15, color: '#f97316', type: 'fruit' },
            { emoji: '🍇', points: 20, color: '#8b5cf6', type: 'fruit' },
            { emoji: '🍓', points: 25, color: '#ec4899', type: 'fruit' },
            { emoji: '⭐', points: 50, color: '#fbbf24', type: 'star' },
            { emoji: '💣', points: 0, color: '#444', type: 'bomb' }
        ];
        this.floatingTexts = [];
        this.keys = {};
        this.listenKey(e => { this.keys[e.key] = true; e.preventDefault(); });
        document.addEventListener('keyup', this._ku = e => this.keys[e.key] = false);
        this.listenMouse('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.basket.x = Math.max(this.basket.w / 2,
                Math.min(W - this.basket.w / 2, (e.clientX - rect.left) * (W / rect.width)));
        });
        this.ui.innerHTML = ''; this.loop();
    }
    stop() { super.stop(); document.removeEventListener('keyup', this._ku); }
    update() {
        if (this.dead) return;
        const { basket, W, H } = this;
        // Keyboard movement
        const moveSpeed = 8;
        if (this.keys['ArrowLeft'] || this.keys['a']) basket.x = Math.max(basket.w / 2, basket.x - moveSpeed);
        if (this.keys['ArrowRight'] || this.keys['d']) basket.x = Math.min(W - basket.w / 2, basket.x + moveSpeed);
        // Difficulty ramp
        this.difficulty = 1 + this.score * 0.003;
        // Spawn items
        this.spawnTimer--;
        if (this.spawnTimer <= 0) {
            const isBomb = Math.random() < Math.min(0.3, 0.1 + this.difficulty * 0.02);
            const isStar = !isBomb && Math.random() < 0.08;
            let item;
            if (isBomb) item = this.itemTypes[5];
            else if (isStar) item = this.itemTypes[4];
            else item = randChoice(this.itemTypes.slice(0, 4));
            this.items.push({
                x: 30 + Math.random() * (W - 60), y: -20,
                vy: 1.5 + this.difficulty * 0.5 + Math.random(),
                vx: (Math.random() - 0.5) * 1.5,
                ...item, rot: 0, rotSpeed: (Math.random() - 0.5) * 0.1
            });
            this.spawnTimer = Math.max(12, 40 - this.difficulty * 3);
        }
        // Update items
        for (const item of this.items) {
            item.y += item.vy;
            item.x += item.vx;
            item.rot += item.rotSpeed;
            // Wall bounce
            if (item.x < 15 || item.x > W - 15) item.vx *= -1;
        }
        // Catch check
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            const bx = basket.x, by = basket.y;
            if (item.y + 15 >= by && item.y <= by + basket.h &&
                item.x >= bx - basket.w / 2 - 5 && item.x <= bx + basket.w / 2 + 5) {
                if (item.type === 'bomb') {
                    this.lives--;
                    this.combo = 0;
                    this.shakeTimer = 8; this.shakeIntensity = 6;
                    for (let j = 0; j < 15; j++) {
                        this.particles.push({
                            x: item.x, y: item.y,
                            vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                            life: 25, color: randChoice(['#f00', '#ff6600', '#ff0', '#444']), size: randInt(3, 7)
                        });
                    }
                    this.floatingTexts.push({ x: item.x, y: item.y, text: '-1 Life!', color: '#ef4444', life: 40 });
                    if (this.lives <= 0) {
                        this.dead = true;
                        this.endGame();
                        this.showOverlay('Game Over', `Score: ${this.score} | Max Combo: ${this.maxCombo}x`);
                    }
                } else {
                    this.combo++;
                    this.comboTimer = 90;
                    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
                    const multiplier = Math.min(5, 1 + Math.floor(this.combo / 5));
                    const pts = item.points * multiplier;
                    this.setScore(this.score + pts);
                    const hue = item.type === 'star' ? 50 : (this.combo * 20) % 360;
                    for (let j = 0; j < 6; j++) {
                        this.particles.push({
                            x: item.x, y: item.y,
                            vx: (Math.random() - 0.5) * 5, vy: -Math.random() * 4 - 2,
                            life: 20, color: item.color, size: randInt(2, 4)
                        });
                    }
                    this.floatingTexts.push({ x: item.x, y: item.y, text: `+${pts}`, color: item.color, life: 30 });
                    if (item.type === 'star') {
                        this.shakeTimer = 3; this.shakeIntensity = 2;
                    }
                }
                this.items.splice(i, 1);
                continue;
            }
            // Missed fruit (off bottom)
            if (item.y > H + 20) {
                if (item.type === 'fruit') {
                    this.combo = 0;
                }
                this.items.splice(i, 1);
            }
        }
        // Combo timer
        if (this.comboTimer > 0) this.comboTimer--;
        else this.combo = 0;
        // Particles
        this.particles = this.particles.filter(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.15; return --pt.life > 0; });
        this.floatingTexts = this.floatingTexts.filter(ft => { ft.y -= 1.5; return --ft.life > 0; });
        if (this.shakeTimer > 0) this.shakeTimer--;
    }
    render() {
        const { ctx, W, H, basket } = this;
        this.clear('#1a0f05');
        ctx.save();
        if (this.shakeTimer > 0) ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
        // Warm gradient floor
        const floorGrad = ctx.createLinearGradient(0, H - 100, 0, H);
        floorGrad.addColorStop(0, 'rgba(139,92,42,0)'); floorGrad.addColorStop(1, 'rgba(139,92,42,0.15)');
        ctx.fillStyle = floorGrad; ctx.fillRect(0, H - 100, W, 100);
        // Items
        ctx.font = '28px sans-serif'; ctx.textAlign = 'center';
        for (const item of this.items) {
            ctx.save();
            ctx.translate(item.x, item.y);
            ctx.rotate(item.rot);
            // Glow
            if (item.type === 'star') {
                ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 15;
            } else if (item.type === 'bomb') {
                ctx.shadowColor = '#f00'; ctx.shadowBlur = 8;
            }
            ctx.fillText(item.emoji, 0, 8);
            ctx.shadowBlur = 0;
            ctx.restore();
        }
        // Basket
        ctx.fillStyle = '#8B6914';
        ctx.shadowColor = '#a07818'; ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(basket.x - basket.w / 2 - 5, basket.y);
        ctx.lineTo(basket.x - basket.w / 2 + 5, basket.y + basket.h);
        ctx.lineTo(basket.x + basket.w / 2 - 5, basket.y + basket.h);
        ctx.lineTo(basket.x + basket.w / 2 + 5, basket.y);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Basket weave lines
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const gy = basket.y + 8 + i * 8;
            ctx.beginPath(); ctx.moveTo(basket.x - basket.w / 2, gy); ctx.lineTo(basket.x + basket.w / 2, gy); ctx.stroke();
        }
        // Basket rim
        ctx.strokeStyle = '#a07818'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(basket.x - basket.w / 2 - 5, basket.y);
        ctx.lineTo(basket.x + basket.w / 2 + 5, basket.y);
        ctx.stroke();
        // Particles
        for (const pt of this.particles) {
            ctx.fillStyle = pt.color; ctx.globalAlpha = pt.life / 25;
            ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Floating texts
        for (const ft of this.floatingTexts) {
            ctx.fillStyle = ft.color; ctx.globalAlpha = ft.life / 40;
            ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
        // HUD
        this.text(`${this.score}`, W / 2, 40, 32, '#fff');
        const hearts = '\u2764'.repeat(this.lives);
        this.text(hearts, 60, 30, 20, '#ef4444');
        if (this.combo >= 3) {
            this.text(`${this.combo}x Combo!`, W / 2, 68, 16, `hsl(${(this.combo * 20) % 360}, 80%, 65%)`);
        }
        this.text('Arrow keys or mouse', W / 2, H - 10, 12, '#555');
    }
}

// 5. BOUNCE BALL (Physics bouncer with targets)
class BounceBallGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.W = W; this.H = H;
        this.ball = { x: W / 2, y: 60, vx: 3, vy: 0, r: 10 };
        this.bumpers = [];
        this.targets = [];
        this.particles = [];
        this.shakeTimer = 0; this.shakeIntensity = 0;
        this.dead = false;
        this.level = 1;
        this.timeLeft = 30; this.timerCounter = 0;
        this.trailPoints = [];
        this.mouseX = W / 2; this.mouseY = H / 2;
        this.generateLevel();
        this.listenMouse('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) * (W / rect.width);
            this.mouseY = (e.clientY - rect.top) * (H / rect.height);
        });
        this.listenClick(e => {
            if (this.dead) return;
            // Place bumper at mouse position
            if (this.bumpers.length < 8 + this.level * 2) {
                this.bumpers.push({
                    x: this.mouseX, y: this.mouseY, r: 18 + Math.random() * 8,
                    color: `hsl(${Math.random() * 360}, 70%, 55%)`, pulse: 0
                });
            }
        });
        this.ui.innerHTML = ''; this.loop();
    }
    generateLevel() {
        this.targets = [];
        this.bumpers = [];
        const W = this.W, H = this.H;
        const count = Math.min(12, 4 + this.level);
        for (let i = 0; i < count; i++) {
            let x, y, attempts = 0;
            do {
                x = 40 + Math.random() * (W - 80);
                y = 100 + Math.random() * (H - 180);
                attempts++;
            } while (attempts < 30 && this.targets.some(t => Math.hypot(t.x - x, t.y - y) < 50));
            this.targets.push({ x, y, r: 14, hit: false, hue: (i * 40) % 360 });
        }
        this.ball = { x: W / 2, y: 40, vx: 2 + Math.random() * 2, vy: 2, r: 10 };
        this.timeLeft = 25 + this.level * 5;
    }
    update() {
        if (this.dead) return;
        const { ball: b, W, H } = this;
        // Timer
        this.timerCounter++;
        if (this.timerCounter >= 60) {
            this.timerCounter = 0;
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.dead = true;
                this.endGame();
                this.showOverlay('Time Up!', `Score: ${this.score} | Level ${this.level}`);
                return;
            }
        }
        // Physics
        b.vy += 0.12; // light gravity
        b.x += b.vx;
        b.y += b.vy;
        // Slight damping
        b.vx *= 0.999;
        b.vy *= 0.999;
        // Trail
        this.trailPoints.push({ x: b.x, y: b.y, life: 10 });
        this.trailPoints = this.trailPoints.filter(t => --t.life > 0);
        // Wall bouncing
        if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx); }
        if (b.x + b.r > W) { b.x = W - b.r; b.vx = -Math.abs(b.vx); }
        if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); }
        if (b.y + b.r > H) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * 0.9; }
        // Bumper collisions
        for (const bmp of this.bumpers) {
            const dx = b.x - bmp.x, dy = b.y - bmp.y;
            const dist = Math.hypot(dx, dy);
            if (dist < b.r + bmp.r) {
                const angle = Math.atan2(dy, dx);
                const speed = Math.hypot(b.vx, b.vy) * 1.05 + 0.5;
                b.vx = Math.cos(angle) * speed;
                b.vy = Math.sin(angle) * speed;
                b.x = bmp.x + Math.cos(angle) * (b.r + bmp.r + 1);
                b.y = bmp.y + Math.sin(angle) * (b.r + bmp.r + 1);
                bmp.pulse = 8;
                // Cap speed
                const maxSpeed = 10;
                const curSpeed = Math.hypot(b.vx, b.vy);
                if (curSpeed > maxSpeed) {
                    b.vx = (b.vx / curSpeed) * maxSpeed;
                    b.vy = (b.vy / curSpeed) * maxSpeed;
                }
            }
            if (bmp.pulse > 0) bmp.pulse--;
        }
        // Target collisions
        for (const tgt of this.targets) {
            if (tgt.hit) continue;
            const dx = b.x - tgt.x, dy = b.y - tgt.y;
            if (Math.hypot(dx, dy) < b.r + tgt.r) {
                tgt.hit = true;
                this.setScore(this.score + 50 + this.level * 10);
                this.shakeTimer = 4; this.shakeIntensity = 3;
                for (let i = 0; i < 12; i++) {
                    this.particles.push({
                        x: tgt.x, y: tgt.y,
                        vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
                        life: 25, color: `hsl(${tgt.hue}, 80%, 65%)`, size: randInt(3, 6)
                    });
                }
                // Reflect ball
                const angle = Math.atan2(dy, dx);
                b.vx = Math.cos(angle) * 5;
                b.vy = Math.sin(angle) * 5;
            }
        }
        // All targets hit -> next level
        if (this.targets.every(t => t.hit)) {
            this.level++;
            this.generateLevel();
            this.shakeTimer = 6; this.shakeIntensity = 4;
        }
        // Particles
        this.particles = this.particles.filter(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.1; return --pt.life > 0; });
        if (this.shakeTimer > 0) this.shakeTimer--;
    }
    render() {
        const { ctx, W, H, ball: b } = this;
        this.clear('#0a0a2a');
        ctx.save();
        if (this.shakeTimer > 0) ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
        // Grid
        ctx.strokeStyle = 'rgba(60,60,140,0.08)'; ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        // Targets
        for (const tgt of this.targets) {
            if (tgt.hit) continue;
            ctx.fillStyle = `hsl(${tgt.hue}, 80%, 55%)`;
            ctx.shadowColor = `hsl(${tgt.hue}, 80%, 55%)`; ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.arc(tgt.x, tgt.y, tgt.r, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            // Inner ring
            ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(tgt.x, tgt.y, tgt.r * 0.5, 0, Math.PI * 2); ctx.stroke();
        }
        // Bumpers
        for (const bmp of this.bumpers) {
            const pr = bmp.pulse > 0 ? bmp.r + bmp.pulse : bmp.r;
            ctx.fillStyle = bmp.color;
            ctx.shadowColor = bmp.color; ctx.shadowBlur = bmp.pulse > 0 ? 15 : 6;
            ctx.beginPath(); ctx.arc(bmp.x, bmp.y, pr, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(bmp.x, bmp.y, pr, 0, Math.PI * 2); ctx.stroke();
        }
        // Ball trail
        for (const t of this.trailPoints) {
            ctx.fillStyle = `rgba(129,140,248,${t.life / 12})`;
            ctx.beginPath(); ctx.arc(t.x, t.y, b.r * (t.life / 10) * 0.5, 0, Math.PI * 2); ctx.fill();
        }
        // Ball
        ctx.fillStyle = '#818cf8';
        ctx.shadowColor = '#818cf8'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath(); ctx.arc(b.x - 2, b.y - 2, b.r * 0.35, 0, Math.PI * 2); ctx.fill();
        // Mouse preview bumper
        if (!this.dead) {
            ctx.strokeStyle = 'rgba(129,140,248,0.3)'; ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath(); ctx.arc(this.mouseX, this.mouseY, 22, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]);
        }
        // Particles
        for (const pt of this.particles) {
            ctx.fillStyle = pt.color; ctx.globalAlpha = pt.life / 25;
            ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
        // HUD
        const remaining = this.targets.filter(t => !t.hit).length;
        this.text(`${this.score}`, W / 2, 35, 28, '#fff');
        this.text(`Level ${this.level}`, 60, 25, 14, '#aaa');
        this.text(`Targets: ${remaining}`, W - 70, 25, 14, '#818cf8');
        this.text(`Time: ${this.timeLeft}s`, W / 2, 60, 14, this.timeLeft <= 5 ? '#ef4444' : '#aaa');
        this.text('Click to place bumpers', W / 2, H - 10, 12, '#555');
    }
}

// 6. COLOR MATCH
class ColorMatchGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.W = W; this.H = H;
        this.colors = [
            { name: 'Red', hex: '#ef4444', key: 'a' },
            { name: 'Blue', hex: '#3b82f6', key: 's' },
            { name: 'Green', hex: '#22c55e', key: 'd' },
            { name: 'Yellow', hex: '#eab308', key: 'f' }
        ];
        this.blocks = [];
        this.particles = [];
        this.lives = 3;
        this.dead = false;
        this.shakeTimer = 0; this.shakeIntensity = 0;
        this.speed = 1.5;
        this.spawnTimer = 0;
        this.combo = 0; this.maxCombo = 0;
        this.floatingTexts = [];
        this.buttonPulse = [0, 0, 0, 0];
        this.btnY = H - 60;
        this.btnW = (W - 50) / 4;
        this.listenKey(e => {
            if (this.dead) return;
            const idx = this.colors.findIndex(c => c.key === e.key.toLowerCase());
            if (idx >= 0) this.pressButton(idx);
            // Also support 1-4
            const num = parseInt(e.key);
            if (num >= 1 && num <= 4) this.pressButton(num - 1);
        });
        this.listenClick(e => {
            if (this.dead) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (W / rect.width);
            const my = (e.clientY - rect.top) * (H / rect.height);
            if (my >= this.btnY - 5) {
                for (let i = 0; i < 4; i++) {
                    const bx = 10 + i * (this.btnW + 10);
                    if (mx >= bx && mx <= bx + this.btnW) { this.pressButton(i); break; }
                }
            }
        });
        this.ui.innerHTML = ''; this.loop();
    }
    pressButton(idx) {
        this.buttonPulse[idx] = 8;
        // Find lowest block
        let lowest = null, lowestY = -1;
        for (const b of this.blocks) {
            if (b.y > lowestY) { lowest = b; lowestY = b.y; }
        }
        if (!lowest) return;
        if (lowest.colorIdx === idx) {
            // Correct!
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
            const pts = 10 * Math.min(5, 1 + Math.floor(this.combo / 3));
            this.setScore(this.score + pts);
            // Explosion particles
            for (let i = 0; i < 10; i++) {
                this.particles.push({
                    x: lowest.x + lowest.w / 2, y: lowest.y + lowest.h / 2,
                    vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 6,
                    life: 22, color: this.colors[idx].hex, size: randInt(3, 6)
                });
            }
            this.floatingTexts.push({
                x: lowest.x + lowest.w / 2, y: lowest.y,
                text: `+${pts}`, color: this.colors[idx].hex, life: 25
            });
            this.blocks = this.blocks.filter(b => b !== lowest);
            // Speed up
            this.speed = Math.min(5, 1.5 + this.score * 0.005);
        } else {
            // Wrong!
            this.combo = 0;
            this.lives--;
            this.shakeTimer = 8; this.shakeIntensity = 5;
            this.floatingTexts.push({
                x: this.W / 2, y: this.H / 2, text: 'WRONG!', color: '#ef4444', life: 30
            });
            if (this.lives <= 0) {
                this.dead = true;
                for (let i = 0; i < 25; i++) {
                    this.particles.push({
                        x: this.W / 2, y: this.H / 2,
                        vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
                        life: 30, color: randChoice(['#ef4444', '#fff', '#fbbf24']), size: randInt(3, 7)
                    });
                }
                this.endGame();
                this.showOverlay('Game Over', `Score: ${this.score} | Max Combo: ${this.maxCombo}x`);
            }
        }
    }
    update() {
        if (this.dead) return;
        const { W, H } = this;
        // Spawn blocks
        this.spawnTimer--;
        if (this.spawnTimer <= 0) {
            const idx = randInt(0, 3);
            const laneW = (W - 20) / 3;
            const lane = randInt(0, 2);
            const bw = 40;
            this.blocks.push({
                x: 10 + lane * laneW + (laneW - bw) / 2,
                y: -50, w: bw, h: 40,
                colorIdx: idx, vy: this.speed
            });
            this.spawnTimer = Math.max(25, 55 - this.score * 0.04);
        }
        // Move blocks
        for (const b of this.blocks) {
            b.y += b.vy;
        }
        // Check if block passed bottom (before buttons)
        for (let i = this.blocks.length - 1; i >= 0; i--) {
            if (this.blocks[i].y > this.btnY - 20) {
                this.combo = 0;
                this.lives--;
                this.shakeTimer = 5; this.shakeIntensity = 4;
                // Miss particles
                const b = this.blocks[i];
                for (let j = 0; j < 6; j++) {
                    this.particles.push({
                        x: b.x + b.w / 2, y: b.y,
                        vx: (Math.random() - 0.5) * 4, vy: Math.random() * 2,
                        life: 15, color: '#666', size: 3
                    });
                }
                this.blocks.splice(i, 1);
                if (this.lives <= 0) {
                    this.dead = true;
                    this.endGame();
                    this.showOverlay('Game Over', `Score: ${this.score} | Max Combo: ${this.maxCombo}x`);
                    return;
                }
            }
        }
        // Particles
        this.particles = this.particles.filter(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.1; return --pt.life > 0; });
        this.floatingTexts = this.floatingTexts.filter(ft => { ft.y -= 2; return --ft.life > 0; });
        for (let i = 0; i < 4; i++) if (this.buttonPulse[i] > 0) this.buttonPulse[i]--;
        if (this.shakeTimer > 0) this.shakeTimer--;
    }
    render() {
        const { ctx, W, H } = this;
        this.clear('#1a0f20');
        ctx.save();
        if (this.shakeTimer > 0) ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
        // Lane lines
        const laneW = (W - 20) / 3;
        ctx.strokeStyle = 'rgba(100,50,130,0.15)'; ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            ctx.beginPath(); ctx.moveTo(10 + i * laneW, 0); ctx.lineTo(10 + i * laneW, this.btnY - 10); ctx.stroke();
        }
        // Blocks
        for (const b of this.blocks) {
            const c = this.colors[b.colorIdx];
            ctx.fillStyle = c.hex;
            ctx.shadowColor = c.hex; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 8); ctx.fill();
            ctx.shadowBlur = 0;
            // Inner accent
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath(); ctx.roundRect(b.x + 4, b.y + 4, b.w - 8, b.h / 2 - 4, 4); ctx.fill();
        }
        // Buttons zone line
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(0, this.btnY - 15, W, 2);
        // Buttons
        for (let i = 0; i < 4; i++) {
            const bx = 10 + i * (this.btnW + 10);
            const c = this.colors[i];
            const pulse = this.buttonPulse[i];
            ctx.fillStyle = pulse > 0 ? c.hex : `${c.hex}88`;
            ctx.shadowColor = c.hex; ctx.shadowBlur = pulse > 0 ? 15 : 4;
            ctx.beginPath(); ctx.roundRect(bx, this.btnY, this.btnW, 45, 10); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(c.name, bx + this.btnW / 2, this.btnY + 24);
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px sans-serif';
            ctx.fillText(c.key.toUpperCase(), bx + this.btnW / 2, this.btnY + 40);
        }
        // Particles
        for (const pt of this.particles) {
            ctx.fillStyle = pt.color; ctx.globalAlpha = pt.life / 25;
            ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Floating texts
        for (const ft of this.floatingTexts) {
            ctx.fillStyle = ft.color; ctx.globalAlpha = ft.life / 30;
            ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
        // HUD
        this.text(`${this.score}`, W / 2, 35, 28, '#fff');
        this.text('\u2764'.repeat(this.lives), 50, 25, 16, '#ef4444');
        if (this.combo >= 3) {
            this.text(`${this.combo}x!`, W - 50, 30, 18, '#fbbf24');
        }
    }
}

// 7. TAP TAP (Rhythm game)
class TapTapGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.W = W; this.H = H;
        this.targets = [];
        this.particles = [];
        this.dead = false;
        this.shakeTimer = 0; this.shakeIntensity = 0;
        this.combo = 0; this.maxCombo = 0;
        this.missCount = 0;
        this.maxMiss = 10;
        this.floatingTexts = [];
        this.spawnTimer = 0;
        this.spawnInterval = 60;
        this.totalNotes = 0;
        this.perfectCount = 0;
        this.goodCount = 0;
        this.difficulty = 1;
        this.ringRadius = 40;
        this.pulseEffects = [];
        // Pre-generate a rhythm pattern
        this.beatTimer = 0;
        this.listenClick(e => {
            if (this.dead) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (W / rect.width);
            const my = (e.clientY - rect.top) * (H / rect.height);
            this.tapAt(mx, my);
        });
        this.listenKey(e => {
            if (this.dead || e.key !== ' ') return;
            e.preventDefault();
            // Space taps the closest target
            let closest = null, closestDist = Infinity;
            for (const t of this.targets) {
                if (t.tapped) continue;
                const diff = Math.abs(t.currentR - this.ringRadius);
                if (diff < closestDist) { closestDist = diff; closest = t; }
            }
            if (closest) this.judgeTarget(closest);
        });
        this.ui.innerHTML = ''; this.loop();
    }
    tapAt(mx, my) {
        let best = null, bestDist = Infinity;
        for (const t of this.targets) {
            if (t.tapped) continue;
            const d = Math.hypot(mx - t.x, my - t.y);
            if (d < 60 && d < bestDist) { bestDist = d; best = t; }
        }
        if (best) this.judgeTarget(best);
    }
    judgeTarget(t) {
        const diff = Math.abs(t.currentR - this.ringRadius);
        let judgment, pts, color;
        if (diff < 6) { judgment = 'PERFECT!'; pts = 100; color = '#fbbf24'; this.perfectCount++; }
        else if (diff < 18) { judgment = 'Great!'; pts = 50; color = '#22c55e'; this.goodCount++; }
        else if (diff < 35) { judgment = 'OK'; pts = 20; color = '#3b82f6'; }
        else { judgment = 'Miss'; pts = 0; color = '#ef4444'; }
        if (pts > 0) {
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
            const multiplier = Math.min(4, 1 + Math.floor(this.combo / 10));
            pts *= multiplier;
            this.setScore(this.score + pts);
            // Particles
            for (let i = 0; i < (judgment === 'PERFECT!' ? 15 : 8); i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 5 + 2;
                this.particles.push({
                    x: t.x, y: t.y,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    life: 22, color: t.color, size: randInt(2, 5)
                });
            }
            this.pulseEffects.push({ x: t.x, y: t.y, r: this.ringRadius, maxR: 80, life: 15, color: t.color });
            if (judgment === 'PERFECT!') { this.shakeTimer = 2; this.shakeIntensity = 2; }
        } else {
            this.combo = 0;
            this.missCount++;
        }
        t.tapped = true;
        this.floatingTexts.push({ x: t.x, y: t.y - 30, text: judgment, color, life: 25 });
        if (pts > 0) this.floatingTexts.push({ x: t.x, y: t.y - 10, text: `+${pts}`, color: '#fff', life: 20 });
    }
    update() {
        if (this.dead) return;
        const { W, H } = this;
        // Difficulty ramp
        this.difficulty = 1 + this.totalNotes * 0.02;
        // Spawn targets
        this.spawnTimer--;
        if (this.spawnTimer <= 0) {
            const shrinkSpeed = 0.8 + Math.min(1, this.difficulty * 0.15);
            const padding = 70;
            const x = padding + Math.random() * (W - padding * 2);
            const y = padding + Math.random() * (H - padding * 2 - 60);
            const hue = Math.random() * 360;
            this.targets.push({
                x, y, startR: this.ringRadius + 60 + Math.random() * 30,
                currentR: this.ringRadius + 60 + Math.random() * 30,
                shrinkSpeed, tapped: false,
                color: `hsl(${hue}, 75%, 60%)`, hue
            });
            this.totalNotes++;
            this.spawnInterval = Math.max(20, 60 - this.difficulty * 4);
            this.spawnTimer = this.spawnInterval + randInt(-10, 10);
        }
        // Update targets
        for (const t of this.targets) {
            if (t.tapped) continue;
            t.currentR -= t.shrinkSpeed;
            // Missed (ring shrank past target)
            if (t.currentR < this.ringRadius - 35) {
                t.tapped = true;
                this.combo = 0;
                this.missCount++;
                this.floatingTexts.push({ x: t.x, y: t.y - 20, text: 'Miss', color: '#666', life: 20 });
            }
        }
        // Remove old tapped targets
        this.targets = this.targets.filter(t => !t.tapped || t.currentR > 0);
        // Check death
        if (this.missCount >= this.maxMiss) {
            this.dead = true;
            this.shakeTimer = 10; this.shakeIntensity = 6;
            for (let i = 0; i < 30; i++) {
                this.particles.push({
                    x: W / 2, y: H / 2,
                    vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
                    life: 30, color: randChoice(['#ef4444', '#fbbf24', '#fff']), size: randInt(3, 7)
                });
            }
            this.endGame();
            this.showOverlay('Game Over', `Score: ${this.score} | ${this.perfectCount} Perfects | Max Combo: ${this.maxCombo}x`);
        }
        // Particles
        this.particles = this.particles.filter(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.05; return --pt.life > 0; });
        this.floatingTexts = this.floatingTexts.filter(ft => { ft.y -= 1.5; return --ft.life > 0; });
        this.pulseEffects = this.pulseEffects.filter(pe => { pe.r += 3; return --pe.life > 0; });
        if (this.shakeTimer > 0) this.shakeTimer--;
    }
    render() {
        const { ctx, W, H } = this;
        this.clear('#140a24');
        ctx.save();
        if (this.shakeTimer > 0) ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
        // Ambient circles
        ctx.strokeStyle = 'rgba(80,30,120,0.06)'; ctx.lineWidth = 1;
        for (let r = 50; r < Math.max(W, H); r += 60) {
            ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2); ctx.stroke();
        }
        // Pulse effects
        for (const pe of this.pulseEffects) {
            ctx.strokeStyle = pe.color; ctx.lineWidth = 2;
            ctx.globalAlpha = pe.life / 15;
            ctx.beginPath(); ctx.arc(pe.x, pe.y, pe.r, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // Targets
        for (const t of this.targets) {
            if (t.tapped) continue;
            // Shrinking ring
            ctx.strokeStyle = t.color; ctx.lineWidth = 3;
            ctx.globalAlpha = 0.7;
            ctx.beginPath(); ctx.arc(t.x, t.y, t.currentR, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 1;
            // Target circle
            ctx.fillStyle = t.color;
            ctx.shadowColor = t.color; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(t.x, t.y, this.ringRadius, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            // Inner ring (perfect zone)
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(t.x, t.y, this.ringRadius - 6, 0, Math.PI * 2); ctx.stroke();
            // Center dot
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath(); ctx.arc(t.x, t.y, 5, 0, Math.PI * 2); ctx.fill();
        }
        // Particles
        for (const pt of this.particles) {
            ctx.fillStyle = pt.color; ctx.globalAlpha = pt.life / 22;
            ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Floating texts
        for (const ft of this.floatingTexts) {
            ctx.fillStyle = ft.color; ctx.globalAlpha = ft.life / 25;
            ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
        // HUD
        this.text(`${this.score}`, W / 2, 35, 28, '#fff');
        if (this.combo >= 3) this.text(`${this.combo}x Combo`, W / 2, 60, 16, '#fbbf24');
        // Miss meter
        const missBarW = 120, missBarH = 8;
        const mbx = W - missBarW - 15, mby = 15;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(mbx, mby, missBarW, missBarH);
        ctx.fillStyle = this.missCount > 7 ? '#ef4444' : '#f97316';
        ctx.fillRect(mbx, mby, missBarW * (this.missCount / this.maxMiss), missBarH);
        this.text(`Misses: ${this.missCount}/${this.maxMiss}`, mbx + missBarW / 2, mby + missBarH + 14, 11, '#888');
        this.text('Click circles or press Space', W / 2, H - 10, 12, '#555');
    }
}

// 8. GAP RUNNER
class GapRunnerGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.W = W; this.H = H;
        this.player = { x: 80, y: H / 2, targetY: H / 2, w: 20, h: 20 };
        this.walls = [];
        this.particles = [];
        this.trailPoints = [];
        this.dead = false;
        this.shakeTimer = 0; this.shakeIntensity = 0;
        this.speed = 3;
        this.distance = 0;
        this.wallTimer = 0;
        this.passed = 0;
        this.neonHue = 0;
        this.listenClick(e => {
            if (this.dead) return;
            const rect = this.canvas.getBoundingClientRect();
            this.player.targetY = (e.clientY - rect.top) * (H / rect.height);
        });
        this.listenMouse('mousemove', e => {
            if (this.dead) return;
            const rect = this.canvas.getBoundingClientRect();
            this.player.targetY = (e.clientY - rect.top) * (H / rect.height);
        });
        this.listenKey(e => {
            if (this.dead) return;
            if (e.key === 'ArrowUp') this.player.targetY = Math.max(20, this.player.targetY - 40);
            if (e.key === 'ArrowDown') this.player.targetY = Math.min(H - 20, this.player.targetY + 40);
            e.preventDefault();
        });
        // Spawn initial walls
        for (let i = 1; i <= 3; i++) {
            this.spawnWall(W * 0.3 + i * 200);
        }
        this.ui.innerHTML = ''; this.loop();
    }
    spawnWall(atX) {
        const H = this.H;
        const gapSize = Math.max(65, 130 - this.passed * 2);
        const gapY = 50 + Math.random() * (H - gapSize - 100);
        const hue = (this.passed * 30) % 360;
        this.walls.push({
            x: atX || this.W + 20,
            gapY, gapSize, w: 22 + Math.random() * 10,
            hue, passed: false
        });
    }
    update() {
        if (this.dead) return;
        const { player: p, W, H } = this;
        // Speed increases
        this.speed = 3 + this.passed * 0.08;
        this.distance += this.speed;
        this.neonHue = (this.neonHue + 0.5) % 360;
        // Smooth player movement toward target
        const dy = p.targetY - p.y;
        p.y += dy * 0.12;
        p.y = Math.max(p.h / 2 + 5, Math.min(H - p.h / 2 - 5, p.y));
        // Trail
        this.trailPoints.push({ x: p.x, y: p.y, life: 18, hue: this.neonHue });
        this.trailPoints = this.trailPoints.filter(t => --t.life > 0);
        // Move walls
        for (const wall of this.walls) {
            wall.x -= this.speed;
        }
        // Spawn new walls
        const lastWall = this.walls[this.walls.length - 1];
        if (!lastWall || lastWall.x < W - 150) {
            const spacing = Math.max(120, 220 - this.passed * 2);
            this.spawnWall(lastWall ? lastWall.x + spacing : W + 20);
        }
        // Check wall passing and collision
        for (const wall of this.walls) {
            // Pass check
            if (!wall.passed && wall.x + wall.w < p.x) {
                wall.passed = true;
                this.passed++;
                this.setScore(this.passed);
                // Score particles
                for (let i = 0; i < 5; i++) {
                    this.particles.push({
                        x: p.x, y: p.y,
                        vx: Math.random() * 3 + 1, vy: (Math.random() - 0.5) * 4,
                        life: 15, color: `hsl(${wall.hue}, 80%, 65%)`, size: 3
                    });
                }
            }
            // Collision check
            if (p.x + p.w / 2 > wall.x && p.x - p.w / 2 < wall.x + wall.w) {
                // Is player in the gap?
                if (p.y - p.h / 2 < wall.gapY || p.y + p.h / 2 > wall.gapY + wall.gapSize) {
                    this.die();
                    return;
                }
            }
        }
        // Remove off-screen walls
        this.walls = this.walls.filter(w => w.x + w.w > -10);
        // Particles
        this.particles = this.particles.filter(pt => { pt.x += pt.vx; pt.y += pt.vy; return --pt.life > 0; });
        if (this.shakeTimer > 0) this.shakeTimer--;
    }
    die() {
        this.dead = true;
        const p = this.player;
        this.shakeTimer = 12; this.shakeIntensity = 8;
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: p.x, y: p.y,
                vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
                life: 35, color: randChoice([`hsl(${this.neonHue}, 80%, 65%)`, '#fff', '#ef4444']), size: randInt(3, 7)
            });
        }
        this.endGame();
        this.showOverlay('Game Over', `Walls Passed: ${this.passed}`);
    }
    render() {
        const { ctx, W, H, player: p } = this;
        this.clear('#050f0a');
        ctx.save();
        if (this.shakeTimer > 0) ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
        // Moving grid background
        const offset = this.distance % 40;
        ctx.strokeStyle = 'rgba(26,100,58,0.08)'; ctx.lineWidth = 1;
        for (let x = -offset; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        // Walls
        for (const wall of this.walls) {
            const color = `hsl(${wall.hue}, 70%, 45%)`;
            const glowColor = `hsl(${wall.hue}, 80%, 55%)`;
            // Top section
            ctx.fillStyle = color;
            ctx.fillRect(wall.x, 0, wall.w, wall.gapY);
            // Bottom section
            ctx.fillRect(wall.x, wall.gapY + wall.gapSize, wall.w, H - wall.gapY - wall.gapSize);
            // Neon edges around gap
            ctx.shadowColor = glowColor; ctx.shadowBlur = 10;
            ctx.fillStyle = glowColor;
            ctx.fillRect(wall.x, wall.gapY - 2, wall.w, 3);
            ctx.fillRect(wall.x, wall.gapY + wall.gapSize - 1, wall.w, 3);
            ctx.shadowBlur = 0;
            // Wall surface highlights
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(wall.x, 0, 2, wall.gapY);
            ctx.fillRect(wall.x, wall.gapY + wall.gapSize, 2, H - wall.gapY - wall.gapSize);
        }
        // Player trail
        for (const t of this.trailPoints) {
            ctx.fillStyle = `hsla(${t.hue}, 80%, 60%, ${t.life / 20})`;
            const s = (t.life / 18) * p.w * 0.5;
            ctx.fillRect(t.x - s / 2, t.y - s / 2, s, s);
        }
        // Player
        if (!this.dead) {
            const playerColor = `hsl(${this.neonHue}, 80%, 60%)`;
            ctx.fillStyle = playerColor;
            ctx.shadowColor = playerColor; ctx.shadowBlur = 15;
            ctx.beginPath();
            // Diamond shape
            ctx.moveTo(p.x + p.w / 2, p.y);
            ctx.lineTo(p.x, p.y + p.h / 2);
            ctx.lineTo(p.x - p.w / 2, p.y);
            ctx.lineTo(p.x, p.y - p.h / 2);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            // Inner
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.moveTo(p.x + p.w * 0.25, p.y);
            ctx.lineTo(p.x, p.y + p.h * 0.25);
            ctx.lineTo(p.x - p.w * 0.25, p.y);
            ctx.lineTo(p.x, p.y - p.h * 0.25);
            ctx.closePath();
            ctx.fill();
            // Target line
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.targetY); ctx.stroke();
            ctx.setLineDash([]);
        }
        // Particles
        for (const pt of this.particles) {
            ctx.fillStyle = pt.color; ctx.globalAlpha = pt.life / 35;
            ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
        // HUD
        this.text(`${this.passed}`, W / 2, 40, 32, '#fff');
        const speedPct = Math.floor(this.speed * 20);
        this.text(`Speed: ${speedPct}%`, W - 70, 25, 12, '#888');
        this.text('Move mouse or arrow keys', W / 2, H - 10, 12, '#555');
    }
}

// Register arcade 3 games
Portal.register({id:'doodlejump',name:'Doodle Jump',category:'arcade',icon:'\uD83E\uDD98',color:'linear-gradient(135deg,#1a4a2a,#3a8a5a)',Game:DoodleJumpGame,canvasWidth:600,canvasHeight:800,tags:['platformer','jump']});
Portal.register({id:'ballbounce',name:'Ball Bounce',category:'arcade',icon:'\u26BD',color:'linear-gradient(135deg,#2a1a4a,#5a3a8a)',Game:BallBounceGame,tags:['physics','click']});
Portal.register({id:'gravflip',name:'Gravity Flip',category:'arcade',icon:'\uD83D\uDD04',color:'linear-gradient(135deg,#0a2a3a,#1a5a6a)',Game:GravityFlipGame,tags:['runner','gravity']});
Portal.register({id:'catcher',name:'Catch the Falling',category:'arcade',icon:'\uD83E\uDDFA',color:'linear-gradient(135deg,#4a2a0a,#8a5a2a)',Game:CatcherGame,tags:['catch','reflex']});
Portal.register({id:'bounceball',name:'Bounce Ball',category:'arcade',icon:'\uD83C\uDFD0',color:'linear-gradient(135deg,#1a1a4a,#3a3a8a)',Game:BounceBallGame,tags:['physics','targets']});
Portal.register({id:'colormatch',name:'Color Match',category:'arcade',icon:'\uD83C\uDFAF',color:'linear-gradient(135deg,#3a1a2a,#6a3a5a)',Game:ColorMatchGame,tags:['color','speed']});
Portal.register({id:'taptap',name:'Tap Tap',category:'arcade',icon:'\uD83D\uDC46',color:'linear-gradient(135deg,#2a0a3a,#5a1a6a)',Game:TapTapGame,tags:['rhythm','click']});
Portal.register({id:'gaprunner',name:'Gap Runner',category:'arcade',icon:'\uD83C\uDFC3\u200D\u2640\uFE0F',color:'linear-gradient(135deg,#0a3a1a,#1a6a3a)',Game:GapRunnerGame,tags:['runner','precision']});
