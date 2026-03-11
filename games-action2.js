/* === ACTION GAMES 2 (3) === */

// 31. HELICOPTER
class HelicopterGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.heli = { x: 120, y: H / 2, vy: 0, w: 40, h: 20 };
        this.thrust = false;
        this.dead = false;
        this.started = false;
        this.speed = 3;
        this.distance = 0;
        this.bladeAngle = 0;

        // Cave generation
        this.caveTop = [];
        this.caveBot = [];
        this.gapSize = 220;
        this.topY = 40;
        this.botY = H - 40;
        // Pre-fill the cave columns
        for (let i = 0; i < W + 10; i++) {
            this.caveTop.push(this.topY);
            this.caveBot.push(this.botY);
        }

        // Obstacles inside the cave
        this.obstacles = [];
        this.obstacleTimer = 0;

        // Particles for exhaust
        this.particles = [];

        // Mouse/touch controls
        this.listenMouse('mousedown', () => { this.thrust = true; if (!this.started) this.started = true; });
        this.listenMouse('mouseup', () => { this.thrust = false; });
        this.listenKey(e => {
            if (e.key === ' ') {
                e.preventDefault();
                this.thrust = true;
                if (!this.started) this.started = true;
            }
        });
        document.addEventListener('keyup', this._kuHeli = e => {
            if (e.key === ' ') this.thrust = false;
        });

        this.ui.innerHTML = ''; this.loop();
    }

    stop() {
        super.stop();
        document.removeEventListener('keyup', this._kuHeli);
    }

    update() {
        if (this.dead || !this.started) return;
        const H = this.canvas.height, W = this.canvas.width;
        const h = this.heli;

        // Physics
        if (this.thrust) {
            h.vy -= 0.5;
        } else {
            h.vy += 0.3;
        }
        h.vy = Math.max(-6, Math.min(6, h.vy));
        h.y += h.vy;

        // Distance and speed
        this.distance += this.speed;
        this.setScore(Math.floor(this.distance / 10));
        this.speed = 3 + this.score / 200;

        // Scroll cave
        this.caveTop.shift();
        this.caveBot.shift();

        // Random walk for cave walls with narrowing gap
        const minGap = 100;
        this.gapSize = Math.max(minGap, 220 - this.score * 0.15);

        const lastTop = this.caveTop[this.caveTop.length - 1];
        const lastBot = this.caveBot[this.caveBot.length - 1];

        let newTop = lastTop + (Math.random() - 0.48) * 3;
        newTop = Math.max(10, Math.min(H - this.gapSize - 10, newTop));
        let newBot = newTop + this.gapSize;
        newBot = Math.max(newTop + this.gapSize, Math.min(H - 10, newBot));

        this.caveTop.push(newTop);
        this.caveBot.push(newBot);

        // Obstacles
        this.obstacleTimer++;
        if (this.obstacleTimer > 120 + Math.random() * 80) {
            this.obstacleTimer = 0;
            const cTop = this.caveTop[this.caveTop.length - 1];
            const cBot = this.caveBot[this.caveBot.length - 1];
            const midY = (cTop + cBot) / 2;
            const obstH = randInt(20, Math.floor((cBot - cTop) * 0.35));
            const fromTop = Math.random() < 0.5;
            this.obstacles.push({
                x: W + 10,
                y: fromTop ? cTop : cBot - obstH,
                w: randInt(15, 30),
                h: obstH
            });
        }

        this.obstacles = this.obstacles.filter(o => {
            o.x -= this.speed;
            return o.x > -40;
        });

        // Collision with cave walls
        const heliCol = Math.floor(h.x);
        for (let dx = -Math.floor(h.w / 2); dx <= Math.floor(h.w / 2); dx++) {
            const col = heliCol + dx;
            if (col >= 0 && col < this.caveTop.length) {
                if (h.y - h.h / 2 < this.caveTop[col] || h.y + h.h / 2 > this.caveBot[col]) {
                    this.die();
                    return;
                }
            }
        }

        // Collision with obstacles
        for (const o of this.obstacles) {
            if (h.x + h.w / 2 > o.x && h.x - h.w / 2 < o.x + o.w &&
                h.y + h.h / 2 > o.y && h.y - h.h / 2 < o.y + o.h) {
                this.die();
                return;
            }
        }

        // Off screen
        if (h.y < 0 || h.y > H) {
            this.die();
            return;
        }

        // Blade rotation
        this.bladeAngle += 0.4;

        // Exhaust particles
        if (this.thrust && Math.random() < 0.6) {
            this.particles.push({
                x: h.x - h.w / 2,
                y: h.y + (Math.random() - 0.5) * 6,
                dx: -2 - Math.random() * 2,
                dy: (Math.random() - 0.5) * 1.5,
                life: 15 + Math.random() * 10
            });
        }

        this.particles = this.particles.filter(p => {
            p.x += p.dx; p.y += p.dy;
            return --p.life > 0;
        });
    }

    die() {
        this.dead = true;
        this.endGame();
        this.showOverlay('Crashed!', `Distance: ${this.score}`);
    }

    render() {
        const { ctx } = this, W = this.canvas.width, H = this.canvas.height;

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0a1520');
        grad.addColorStop(1, '#1a3040');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Draw cave ceiling
        ctx.fillStyle = '#2a4050';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let i = 0; i < this.caveTop.length && i < W; i++) {
            ctx.lineTo(i, this.caveTop[i]);
        }
        ctx.lineTo(W, 0);
        ctx.closePath();
        ctx.fill();

        // Cave ceiling edge glow
        ctx.strokeStyle = '#3a6a80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < this.caveTop.length && i < W; i++) {
            if (i === 0) ctx.moveTo(i, this.caveTop[i]);
            else ctx.lineTo(i, this.caveTop[i]);
        }
        ctx.stroke();

        // Draw cave floor
        ctx.fillStyle = '#2a4050';
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let i = 0; i < this.caveBot.length && i < W; i++) {
            ctx.lineTo(i, this.caveBot[i]);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();

        // Cave floor edge glow
        ctx.strokeStyle = '#3a6a80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < this.caveBot.length && i < W; i++) {
            if (i === 0) ctx.moveTo(i, this.caveBot[i]);
            else ctx.lineTo(i, this.caveBot[i]);
        }
        ctx.stroke();

        // Obstacles
        ctx.fillStyle = '#4a2020';
        ctx.strokeStyle = '#8a3030';
        ctx.lineWidth = 1;
        for (const o of this.obstacles) {
            ctx.fillRect(o.x, o.y, o.w, o.h);
            ctx.strokeRect(o.x, o.y, o.w, o.h);
        }

        // Exhaust particles
        for (const p of this.particles) {
            const alpha = p.life / 25;
            ctx.fillStyle = `rgba(255,160,60,${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2 + Math.random(), 0, Math.PI * 2);
            ctx.fill();
        }

        // Helicopter body
        const h = this.heli;
        ctx.save();
        ctx.translate(h.x, h.y);

        // Tilt based on velocity
        const tilt = h.vy * 0.04;
        ctx.rotate(tilt);

        // Body
        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath();
        ctx.ellipse(0, 0, h.w / 2, h.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2196f3';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cockpit window
        ctx.fillStyle = '#b3e5fc';
        ctx.beginPath();
        ctx.ellipse(8, -3, 8, 6, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath();
        ctx.moveTo(-h.w / 2, -3);
        ctx.lineTo(-h.w / 2 - 18, -8);
        ctx.lineTo(-h.w / 2 - 18, 2);
        ctx.lineTo(-h.w / 2, 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Tail rotor
        ctx.fillStyle = '#90caf9';
        const tailRotorLen = 8;
        const trAngle = this.bladeAngle * 2;
        ctx.fillRect(-h.w / 2 - 18, -8 + Math.sin(trAngle) * tailRotorLen / 2, 3, Math.cos(trAngle) * tailRotorLen);

        // Main rotor blades
        ctx.strokeStyle = '#90caf9';
        ctx.lineWidth = 2;
        const bladeLen = h.w * 0.9;
        ctx.beginPath();
        ctx.moveTo(-Math.cos(this.bladeAngle) * bladeLen, -h.h / 2 - 4);
        ctx.lineTo(Math.cos(this.bladeAngle) * bladeLen, -h.h / 2 - 4);
        ctx.stroke();
        // Rotor hub
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(0, -h.h / 2 - 4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Skids
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, h.h / 2);
        ctx.lineTo(-14, h.h / 2 + 5);
        ctx.lineTo(14, h.h / 2 + 5);
        ctx.lineTo(10, h.h / 2);
        ctx.stroke();

        ctx.restore();

        // HUD
        if (!this.started) {
            this.text('Hold Space or Mouse to fly up', W / 2, H / 2 + 60, 18);
            this.text('Release to fall', W / 2, H / 2 + 85, 14, '#888');
        }
        this.text(this.score, W / 2, 35, 32, '#fff');
    }
}


// 32. FRUIT SLICE
class FruitSliceGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.dead = false;
        this.fruits = [];
        this.sliceTrail = [];
        this.splashes = [];
        this.combo = 0;
        this.comboTimer = 0;
        this.comboDisplay = null;
        this.lives = 3;
        this.missedFruits = 0;
        this.spawnTimer = 0;
        this.spawnRate = 60;
        this.mouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.prevMouseX = 0;
        this.prevMouseY = 0;

        this.fruitTypes = [
            { name: 'Watermelon', color: '#2ecc71', innerColor: '#e74c3c', r: 28 },
            { name: 'Orange', color: '#e67e22', innerColor: '#f39c12', r: 24 },
            { name: 'Apple', color: '#e74c3c', innerColor: '#f5f5dc', r: 22 },
            { name: 'Banana', color: '#f1c40f', innerColor: '#ffeaa7', r: 20 },
            { name: 'Grape', color: '#8e44ad', innerColor: '#a569bd', r: 18 },
            { name: 'Kiwi', color: '#6b4226', innerColor: '#7dcea0', r: 20 }
        ];

        // Mouse tracking
        this.listenMouse('mousedown', e => {
            if (this.dead) return;
            this.mouseDown = true;
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) * (W / rect.width);
            this.mouseY = (e.clientY - rect.top) * (H / rect.height);
            this.prevMouseX = this.mouseX;
            this.prevMouseY = this.mouseY;
        });
        this.listenMouse('mouseup', () => {
            this.mouseDown = false;
            this.sliceTrail = [];
        });
        this.listenMouse('mousemove', e => {
            if (this.dead || !this.mouseDown) return;
            const rect = this.canvas.getBoundingClientRect();
            this.prevMouseX = this.mouseX;
            this.prevMouseY = this.mouseY;
            this.mouseX = (e.clientX - rect.left) * (W / rect.width);
            this.mouseY = (e.clientY - rect.top) * (H / rect.height);
            this.sliceTrail.push({ x: this.mouseX, y: this.mouseY, life: 12 });
            if (this.sliceTrail.length > 20) this.sliceTrail.shift();
            this.checkSlice();
        });

        this.ui.innerHTML = ''; this.loop();
    }

    checkSlice() {
        const mx = this.mouseX, my = this.mouseY;
        const pmx = this.prevMouseX, pmy = this.prevMouseY;
        let slicedThisFrame = 0;

        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const f = this.fruits[i];
            if (f.sliced) continue;

            // Check if slice line intersects fruit
            const dist = this.pointToSegmentDist(f.x, f.y, pmx, pmy, mx, my);
            if (dist < f.r + 5) {
                if (f.bomb) {
                    // Hit a bomb
                    this.dead = true;
                    this.addBombExplosion(f.x, f.y);
                    this.endGame();
                    this.showOverlay('BOOM!', `Score: ${this.score}`);
                    return;
                }
                f.sliced = true;
                slicedThisFrame++;
                this.addSplash(f.x, f.y, f.color, f.innerColor);

                // Create two halves that fall away
                const angle = Math.atan2(my - pmy, mx - pmx) + Math.PI / 2;
                f.halves = [
                    { x: f.x, y: f.y, vx: Math.cos(angle) * 3, vy: -2, rot: 0, dr: 0.1 },
                    { x: f.x, y: f.y, vx: -Math.cos(angle) * 3, vy: -2, rot: 0, dr: -0.1 }
                ];
            }
        }

        if (slicedThisFrame > 0) {
            this.combo += slicedThisFrame;
            this.comboTimer = 30;
            let points = 10 * slicedThisFrame;
            if (this.combo >= 3) {
                points += this.combo * 5;
                this.comboDisplay = { text: `${this.combo}x COMBO! +${this.combo * 5}`, x: this.mouseX, y: this.mouseY - 20, life: 40 };
            }
            this.setScore(this.score + points);
        }
    }

    pointToSegmentDist(px, py, ax, ay, bx, by) {
        const dx = bx - ax, dy = by - ay;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.hypot(px - ax, py - ay);
        let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    }

    addSplash(x, y, color, innerColor) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.splashes.push({
                x, y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed - 2,
                r: 2 + Math.random() * 3,
                color: Math.random() < 0.5 ? color : innerColor,
                life: 25 + Math.random() * 15
            });
        }
    }

    addBombExplosion(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 6;
            this.splashes.push({
                x, y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                r: 3 + Math.random() * 4,
                color: Math.random() < 0.5 ? '#ff4444' : '#ffaa00',
                life: 30 + Math.random() * 20
            });
        }
    }

    spawnFruit() {
        const W = this.canvas.width, H = this.canvas.height;
        const isBomb = Math.random() < 0.12 + this.score / 3000;
        const x = randInt(80, W - 80);
        const vy = -(9 + Math.random() * 4);
        const vx = (Math.random() - 0.5) * 4;

        if (isBomb) {
            this.fruits.push({
                x, y: H + 30,
                vx, vy,
                r: 22,
                bomb: true,
                sliced: false,
                halves: null,
                rotation: 0,
                rotSpeed: (Math.random() - 0.5) * 0.1,
                color: '#333',
                innerColor: '#ff0000'
            });
        } else {
            const type = randChoice(this.fruitTypes);
            this.fruits.push({
                x, y: H + 30,
                vx, vy,
                r: type.r,
                bomb: false,
                sliced: false,
                halves: null,
                rotation: 0,
                rotSpeed: (Math.random() - 0.5) * 0.1,
                color: type.color,
                innerColor: type.innerColor,
                name: type.name
            });
        }
    }

    update() {
        if (this.dead) return;
        const H = this.canvas.height;

        // Spawn fruits
        this.spawnTimer++;
        this.spawnRate = Math.max(20, 60 - this.score / 30);
        if (this.spawnTimer >= this.spawnRate) {
            this.spawnTimer = 0;
            const count = 1 + (this.score > 100 ? 1 : 0) + (this.score > 300 ? 1 : 0);
            for (let i = 0; i < count; i++) {
                this.addTimeout(() => this.spawnFruit(), i * 8);
            }
        }

        // Update fruits
        this.fruits = this.fruits.filter(f => {
            if (f.sliced && f.halves) {
                // Animate halves falling
                let anyVisible = false;
                for (const half of f.halves) {
                    half.vy += 0.3;
                    half.x += half.vx;
                    half.y += half.vy;
                    half.rot += half.dr;
                    if (half.y < H + 50) anyVisible = true;
                }
                return anyVisible;
            }

            f.vy += 0.25;
            f.x += f.vx;
            f.y += f.vy;
            f.rotation += f.rotSpeed;

            // Fruit fell off screen without being sliced
            if (f.y > H + 50 && !f.sliced) {
                if (!f.bomb) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.dead = true;
                        this.endGame();
                        this.showOverlay('Game Over', `Score: ${this.score}`);
                    }
                }
                return false;
            }
            return f.y < H + 80;
        });

        // Update splashes
        this.splashes = this.splashes.filter(s => {
            s.x += s.dx;
            s.y += s.dy;
            s.dy += 0.15;
            s.dx *= 0.98;
            return --s.life > 0;
        });

        // Update slice trail
        this.sliceTrail = this.sliceTrail.filter(t => --t.life > 0);

        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) this.combo = 0;
        }

        // Combo display
        if (this.comboDisplay) {
            this.comboDisplay.y -= 1;
            if (--this.comboDisplay.life <= 0) this.comboDisplay = null;
        }
    }

    render() {
        const { ctx } = this, W = this.canvas.width, H = this.canvas.height;

        // Dark background
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0a1a0a');
        grad.addColorStop(1, '#1a2a1a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Slice trail
        if (this.sliceTrail.length > 1) {
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(this.sliceTrail[0].x, this.sliceTrail[0].y);
            for (let i = 1; i < this.sliceTrail.length; i++) {
                const alpha = this.sliceTrail[i].life / 12;
                ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
                ctx.lineTo(this.sliceTrail[i].x, this.sliceTrail[i].y);
            }
            ctx.stroke();
            // Glow effect
            ctx.strokeStyle = 'rgba(150,220,255,0.3)';
            ctx.lineWidth = 8;
            ctx.stroke();
        }

        // Splashes
        for (const s of this.splashes) {
            ctx.globalAlpha = s.life / 40;
            ctx.fillStyle = s.color;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Fruits
        for (const f of this.fruits) {
            if (f.sliced && f.halves) {
                // Draw two halves
                for (let hi = 0; hi < 2; hi++) {
                    const half = f.halves[hi];
                    ctx.save();
                    ctx.translate(half.x, half.y);
                    ctx.rotate(half.rot);
                    // Outer half
                    ctx.fillStyle = f.color;
                    ctx.beginPath();
                    ctx.arc(0, 0, f.r, hi === 0 ? -Math.PI / 2 : Math.PI / 2, hi === 0 ? Math.PI / 2 : Math.PI * 1.5);
                    ctx.closePath();
                    ctx.fill();
                    // Inner face
                    ctx.fillStyle = f.innerColor;
                    ctx.beginPath();
                    ctx.arc(0, 0, f.r - 3, hi === 0 ? -Math.PI / 2 : Math.PI / 2, hi === 0 ? Math.PI / 2 : Math.PI * 1.5);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                continue;
            }

            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.rotate(f.rotation);

            if (f.bomb) {
                // Draw bomb
                ctx.fillStyle = '#222';
                ctx.beginPath();
                ctx.arc(0, 0, f.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 2;
                ctx.stroke();
                // Fuse
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -f.r);
                ctx.quadraticCurveTo(8, -f.r - 12, 4, -f.r - 18);
                ctx.stroke();
                // Spark
                const sparkPhase = Math.sin(performance.now() / 100) * 3;
                ctx.fillStyle = '#ff6600';
                ctx.beginPath();
                ctx.arc(4 + sparkPhase, -f.r - 18, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(4 + sparkPhase, -f.r - 18, 1.5, 0, Math.PI * 2);
                ctx.fill();
                // X mark
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-6, -6); ctx.lineTo(6, 6);
                ctx.moveTo(6, -6); ctx.lineTo(-6, 6);
                ctx.stroke();
            } else {
                // Draw fruit
                ctx.fillStyle = f.color;
                ctx.beginPath();
                ctx.arc(0, 0, f.r, 0, Math.PI * 2);
                ctx.fill();
                // Highlight
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.beginPath();
                ctx.arc(-f.r * 0.25, -f.r * 0.25, f.r * 0.45, 0, Math.PI * 2);
                ctx.fill();
                // Stem for apple
                if (f.name === 'Apple' || f.name === 'Orange') {
                    ctx.fillStyle = '#5d4037';
                    ctx.fillRect(-1.5, -f.r - 5, 3, 7);
                }
                // Leaf
                if (f.name === 'Apple') {
                    ctx.fillStyle = '#4caf50';
                    ctx.beginPath();
                    ctx.ellipse(5, -f.r - 3, 6, 3, 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }

        // Combo display
        if (this.comboDisplay) {
            const cd = this.comboDisplay;
            ctx.globalAlpha = cd.life / 40;
            this.text(cd.text, cd.x, cd.y, 22, '#ffd700');
            ctx.globalAlpha = 1;
        }

        // HUD
        this.text(`Score: ${this.score}`, W / 2, 30, 24, '#fff');

        // Lives as hearts
        const heartStr = '\u2764'.repeat(this.lives) + '\u2661'.repeat(Math.max(0, 3 - this.lives));
        this.text(heartStr, W - 60, 30, 20, '#e74c3c');

        // Combo meter
        if (this.combo >= 2) {
            this.text(`Combo: ${this.combo}x`, 70, 30, 16, '#ffd700');
        }
    }
}


// 33. PLATFORMER
class PlatformerGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.dead = false;
        this.keys = {};

        // Player
        this.player = {
            x: W / 2, y: H - 80,
            vx: 0, vy: 0,
            w: 24, h: 30,
            grounded: false,
            jumpHeld: false,
            facing: 1, // 1 = right, -1 = left
            frameTimer: 0
        };

        // Camera offset (vertical scrolling)
        this.cameraY = 0;
        this.maxHeight = 0;
        this.targetCameraY = 0;

        // Platforms
        this.platforms = [];
        this.coins = [];
        this.coinsCollected = 0;
        this.particles = [];

        // Generate initial platforms
        // Ground platform
        this.platforms.push({ x: 0, y: H - 30, w: W, h: 30, type: 'ground' });

        // Starting platforms
        let py = H - 100;
        for (let i = 0; i < 30; i++) {
            const pw = randInt(60, 130);
            const px = randInt(10, W - pw - 10);
            this.platforms.push({ x: px, y: py, w: pw, h: 12, type: this.getPlatformType(py) });

            // Coin on some platforms
            if (Math.random() < 0.5) {
                this.coins.push({ x: px + pw / 2, y: py - 20, collected: false, bobPhase: Math.random() * Math.PI * 2 });
            }
            py -= randInt(50, 80);
        }
        this.highestPlatformY = py;

        // Controls
        this.listenKey(e => {
            this.keys[e.key] = true;
            if (e.key === ' ' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.player.grounded && !this.dead) {
                    this.player.vy = -10;
                    this.player.grounded = false;
                    this.player.jumpHeld = true;
                    // Jump particles
                    for (let i = 0; i < 5; i++) {
                        this.particles.push({
                            x: this.player.x + this.player.w / 2,
                            y: this.player.y + this.player.h,
                            dx: (Math.random() - 0.5) * 3,
                            dy: Math.random() * 2,
                            life: 15,
                            color: '#aaa'
                        });
                    }
                }
            }
        });
        document.addEventListener('keyup', this._kuPlat = e => {
            this.keys[e.key] = false;
            if (e.key === ' ' || e.key === 'ArrowUp') {
                this.player.jumpHeld = false;
            }
        });

        this.ui.innerHTML = ''; this.loop();
    }

    stop() {
        super.stop();
        document.removeEventListener('keyup', this._kuPlat);
    }

    getPlatformType(y) {
        // Higher platforms can be moving or breakable
        if (y < -500 && Math.random() < 0.25) return 'moving';
        if (y < -300 && Math.random() < 0.15) return 'breakable';
        return 'normal';
    }

    update() {
        if (this.dead) return;
        const W = this.canvas.width, H = this.canvas.height;
        const p = this.player;

        // Horizontal movement
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            p.vx = -5;
            p.facing = -1;
        } else if (this.keys['ArrowRight'] || this.keys['d']) {
            p.vx = 5;
            p.facing = 1;
        } else {
            p.vx *= 0.85;
            if (Math.abs(p.vx) < 0.5) p.vx = 0;
        }

        // Variable jump height
        if (!p.jumpHeld && p.vy < -3) {
            p.vy = -3;
        }

        // Gravity
        p.vy += 0.4;
        if (p.vy > 12) p.vy = 12;

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap horizontally
        if (p.x + p.w < 0) p.x = W;
        if (p.x > W) p.x = -p.w;

        // Platform collision (only when falling)
        p.grounded = false;
        if (p.vy >= 0) {
            for (const plat of this.platforms) {
                const platScreenY = plat.y - this.cameraY;
                const playerBot = p.y + p.h;
                const prevBot = playerBot - p.vy;

                if (p.x + p.w > plat.x && p.x < plat.x + plat.w) {
                    const platTop = plat.y - this.cameraY;
                    const realPlatTop = plat.y;

                    if (p.y + p.h >= realPlatTop - this.cameraY &&
                        p.y + p.h - p.vy <= realPlatTop - this.cameraY + 5) {
                        // Actually compare in world coords
                    }

                    // World coordinate collision
                    const worldPlayerBot = p.y + this.cameraY + p.h;
                    const worldPrevBot = worldPlayerBot - p.vy;

                    if (worldPlayerBot >= plat.y && worldPrevBot <= plat.y + 5) {
                        p.y = plat.y - this.cameraY - p.h;
                        p.vy = 0;
                        p.grounded = true;

                        if (plat.type === 'breakable' && !plat.breaking) {
                            plat.breaking = true;
                            plat.breakTimer = 20;
                        }
                        break;
                    }
                }
            }
        }

        // Update breaking platforms
        this.platforms = this.platforms.filter(plat => {
            if (plat.breaking) {
                plat.breakTimer--;
                if (plat.breakTimer <= 0) {
                    // Spawn break particles
                    for (let i = 0; i < 6; i++) {
                        this.particles.push({
                            x: plat.x + Math.random() * plat.w,
                            y: plat.y - this.cameraY,
                            dx: (Math.random() - 0.5) * 4,
                            dy: -Math.random() * 2,
                            life: 20,
                            color: '#8d6e63'
                        });
                    }
                    return false;
                }
            }
            // Moving platforms
            if (plat.type === 'moving') {
                if (!plat.moveDir) { plat.moveDir = 1; plat.origX = plat.x; plat.moveRange = randInt(40, 100); }
                plat.x += plat.moveDir * 1.5;
                if (plat.x > plat.origX + plat.moveRange || plat.x < plat.origX - plat.moveRange) {
                    plat.moveDir *= -1;
                }
                // Move player if standing on it
                if (p.grounded) {
                    const worldPlayerBot = p.y + this.cameraY + p.h;
                    if (Math.abs(worldPlayerBot - plat.y) < 3 &&
                        p.x + p.w > plat.x && p.x < plat.x + plat.w) {
                        p.x += plat.moveDir * 1.5;
                    }
                }
            }
            return true;
        });

        // Camera follows player upward
        const worldPlayerY = p.y + this.cameraY;
        if (worldPlayerY < this.maxHeight) {
            this.maxHeight = worldPlayerY;
        }

        // Scroll camera when player goes above middle
        const screenThreshold = H * 0.4;
        if (p.y < screenThreshold) {
            const diff = screenThreshold - p.y;
            this.cameraY += diff;
            p.y = screenThreshold;
        }

        // Score based on height
        const height = Math.floor(this.cameraY / 10);
        if (height + this.coinsCollected * 10 > this.score) {
            this.setScore(height + this.coinsCollected * 10);
        }

        // Generate new platforms as we go up
        while (this.highestPlatformY - this.cameraY > -100) {
            this.highestPlatformY -= randInt(50, 80);
            const pw = randInt(50, 120);
            const px = randInt(10, W - pw - 10);
            this.platforms.push({ x: px, y: this.highestPlatformY, w: pw, h: 12, type: this.getPlatformType(this.highestPlatformY) });
            if (Math.random() < 0.45) {
                this.coins.push({ x: px + pw / 2, y: this.highestPlatformY - 20, collected: false, bobPhase: Math.random() * Math.PI * 2 });
            }
        }

        // Remove platforms far below
        this.platforms = this.platforms.filter(pl => pl.y - this.cameraY < H + 100);
        this.coins = this.coins.filter(c => c.y - this.cameraY < H + 100);

        // Coin collection
        for (const c of this.coins) {
            if (c.collected) continue;
            const cy = c.y - this.cameraY + Math.sin(c.bobPhase + performance.now() / 300) * 4;
            const cx = c.x;
            if (p.x + p.w > cx - 10 && p.x < cx + 10 &&
                p.y + p.h > cy - 10 && p.y < cy + 10) {
                c.collected = true;
                this.coinsCollected++;
                this.setScore(Math.floor(this.cameraY / 10) + this.coinsCollected * 10);
                // Coin particles
                for (let i = 0; i < 8; i++) {
                    this.particles.push({
                        x: cx, y: cy,
                        dx: (Math.random() - 0.5) * 4,
                        dy: (Math.random() - 0.5) * 4,
                        life: 20,
                        color: '#ffd700'
                    });
                }
            }
        }

        // Death: fell off screen
        if (p.y > H + 50) {
            this.dead = true;
            this.endGame();
            this.showOverlay('You Fell!', `Height: ${Math.floor(this.cameraY / 10)} | Coins: ${this.coinsCollected} | Score: ${this.score}`);
        }

        // Particles
        this.particles = this.particles.filter(pt => {
            pt.x += pt.dx;
            pt.y += pt.dy;
            pt.dy += 0.1;
            return --pt.life > 0;
        });

        // Running animation frame
        if (p.grounded && Math.abs(p.vx) > 0.5) {
            p.frameTimer += Math.abs(p.vx);
        }
    }

    render() {
        const { ctx } = this, W = this.canvas.width, H = this.canvas.height;
        const p = this.player;

        // Background gradient that shifts with height
        const heightFactor = Math.min(1, this.cameraY / 5000);
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        const r1 = Math.floor(10 + heightFactor * 10);
        const g1 = Math.floor(10 + heightFactor * 5);
        const b1 = Math.floor(40 + heightFactor * 30);
        grad.addColorStop(0, `rgb(${r1},${g1},${b1})`);
        grad.addColorStop(1, '#0a0a2a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Stars in background
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (let i = 0; i < 40; i++) {
            const sx = (i * 137 + 50) % W;
            const sy = ((i * 211 + 80 - this.cameraY * 0.1) % (H + 100) + H + 100) % (H + 100);
            ctx.fillRect(sx, sy, 1.5, 1.5);
        }

        // Platforms
        for (const plat of this.platforms) {
            const py = plat.y - this.cameraY;
            if (py > H + 20 || py < -20) continue;

            if (plat.type === 'ground') {
                ctx.fillStyle = '#2a2a4a';
                ctx.fillRect(plat.x, py, plat.w, plat.h);
                // Ground pattern
                ctx.fillStyle = '#333360';
                for (let gx = 0; gx < W; gx += 30) {
                    ctx.fillRect(gx, py, 1, plat.h);
                }
            } else if (plat.type === 'breakable') {
                const shake = plat.breaking ? (Math.random() - 0.5) * 4 : 0;
                const alpha = plat.breaking ? plat.breakTimer / 20 : 1;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(plat.x + shake, py, plat.w, plat.h);
                // Crack lines
                ctx.strokeStyle = '#5d4037';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(plat.x + plat.w * 0.3, py);
                ctx.lineTo(plat.x + plat.w * 0.4, py + plat.h);
                ctx.moveTo(plat.x + plat.w * 0.7, py);
                ctx.lineTo(plat.x + plat.w * 0.6, py + plat.h);
                ctx.stroke();
                ctx.globalAlpha = 1;
            } else if (plat.type === 'moving') {
                ctx.fillStyle = '#42a5f5';
                ctx.fillRect(plat.x, py, plat.w, plat.h);
                // Arrows indicating movement
                ctx.fillStyle = '#90caf9';
                ctx.fillRect(plat.x + 5, py + 3, 8, 5);
                ctx.fillRect(plat.x + plat.w - 13, py + 3, 8, 5);
            } else {
                // Normal platform
                ctx.fillStyle = '#4a4a7a';
                ctx.fillRect(plat.x, py, plat.w, plat.h);
                // Top highlight
                ctx.fillStyle = '#6a6a9a';
                ctx.fillRect(plat.x, py, plat.w, 3);
                // Edge details
                ctx.fillStyle = '#3a3a6a';
                ctx.fillRect(plat.x, py + plat.h - 2, plat.w, 2);
            }
        }

        // Coins
        for (const c of this.coins) {
            if (c.collected) continue;
            const cy = c.y - this.cameraY + Math.sin(c.bobPhase + performance.now() / 300) * 4;
            if (cy > H + 20 || cy < -20) continue;
            // Coin glow
            ctx.fillStyle = 'rgba(255,215,0,0.15)';
            ctx.beginPath();
            ctx.arc(c.x, cy, 14, 0, Math.PI * 2);
            ctx.fill();
            // Coin body
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(c.x, cy, 8, 0, Math.PI * 2);
            ctx.fill();
            // Coin shine
            ctx.fillStyle = '#fff8c4';
            ctx.beginPath();
            ctx.arc(c.x - 2, cy - 2, 3, 0, Math.PI * 2);
            ctx.fill();
            // $ symbol
            ctx.fillStyle = '#b8860b';
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('$', c.x, cy + 3);
        }

        // Particles
        for (const pt of this.particles) {
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = pt.life / 20;
            ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
        }
        ctx.globalAlpha = 1;

        // Player
        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.scale(p.facing, 1);

        // Body
        ctx.fillStyle = '#e94560';
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);

        // Head
        ctx.fillStyle = '#ffccbc';
        ctx.fillRect(-p.w / 2 + 3, -p.h / 2 - 2, p.w - 6, 12);

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(2, -p.h / 2, 5, 5);
        ctx.fillStyle = '#000';
        ctx.fillRect(4, -p.h / 2 + 1, 2, 3);

        // Legs animation
        if (p.grounded && Math.abs(p.vx) > 0.5) {
            const legPhase = Math.sin(p.frameTimer * 0.3);
            ctx.fillStyle = '#1565c0';
            ctx.fillRect(-p.w / 2 + 2 + legPhase * 4, p.h / 2 - 2, 8, 6);
            ctx.fillRect(-p.w / 2 + 12 - legPhase * 4, p.h / 2 - 2, 8, 6);
        } else {
            ctx.fillStyle = '#1565c0';
            ctx.fillRect(-p.w / 2 + 3, p.h / 2 - 2, 8, 4);
            ctx.fillRect(-p.w / 2 + 13, p.h / 2 - 2, 8, 4);
        }

        // Cape / scarf fluttering when in air
        if (!p.grounded) {
            ctx.fillStyle = '#ff7043';
            const capeWave = Math.sin(performance.now() / 100) * 3;
            ctx.beginPath();
            ctx.moveTo(-p.w / 2, -p.h / 2 + 5);
            ctx.lineTo(-p.w / 2 - 8, -p.h / 2 + 12 + capeWave);
            ctx.lineTo(-p.w / 2, p.h / 2 - 5);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();

        // HUD
        this.text(`Score: ${this.score}`, W / 2, 30, 22, '#fff');
        this.text(`Coins: ${this.coinsCollected}`, W - 70, 30, 16, '#ffd700');
        this.text(`Height: ${Math.floor(this.cameraY / 10)}`, 70, 30, 16, '#aaa');

        // Height marker lines every 100 units
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let h = 0; h < this.cameraY + H; h += 100) {
            const sy = h * 10 - this.cameraY;
            if (sy > 0 && sy < H) {
                // These are very subtle reference lines
            }
        }

        // Arrow keys hint at start
        if (this.cameraY < 10) {
            this.text('Arrow Keys / WASD to move, Space to jump', W / 2, H - 50, 14, '#666');
        }
    }
}


// Register action games 2
Portal.register({ id: 'helicopter', name: 'Helicopter', category: 'action', icon: '\u{1F681}', color: 'linear-gradient(135deg,#1a2a3a,#3a5a6a)', Game: HelicopterGame, tags: ['helicopter', 'fly', 'cave'] });
Portal.register({ id: 'fruitslice', name: 'Fruit Slice', category: 'action', icon: '\u{1F349}', color: 'linear-gradient(135deg,#2a4a1a,#4a8a3a)', Game: FruitSliceGame, tags: ['fruit', 'slice', 'ninja'] });
Portal.register({ id: 'platformer', name: 'Platformer', category: 'action', icon: '\u{1F3C3}\u200D\u2642\uFE0F', color: 'linear-gradient(135deg,#1a1a4a,#3a3a8a)', Game: PlatformerGame, tags: ['platform', 'jump', 'climb'] });
