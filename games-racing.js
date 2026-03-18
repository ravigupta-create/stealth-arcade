/* === RACING GAMES (3) === */

// 1. SPEED RACER
class SpeedRacerGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.W = W; this.H = H;

        // Road config
        this.roadLeft = 120; this.roadRight = W - 120;
        this.roadWidth = this.roadRight - this.roadLeft;
        this.laneCount = 4;
        this.laneWidth = this.roadWidth / this.laneCount;

        // Player car
        this.carW = 40; this.carH = 70;
        this.carX = W / 2; this.carY = H - 120;
        this.carTargetX = this.carX;
        this.carTilt = 0;

        // Game state
        this.speed = 3; this.maxSpeed = 12;
        this.distance = 0; this.fuel = 100;
        this.alive = true;

        // Traffic cars
        this.traffic = [];
        this.trafficTimer = 0;
        this.trafficInterval = 60;

        // Fuel pickups
        this.fuels = [];
        this.fuelTimer = 0;

        // Road lines scroll
        this.lineOffset = 0;

        // Particles
        this.particles = [];

        // Scenery
        this.trees = [];
        for (let i = 0; i < 20; i++) {
            this.trees.push({
                x: Math.random() < 0.5 ? randInt(10, this.roadLeft - 30) : randInt(this.roadRight + 10, W - 20),
                y: randInt(0, H),
                size: randInt(15, 30)
            });
        }

        // Stars/sparkle on road
        this.roadSparkles = [];

        // Screen shake
        this.shakeX = 0; this.shakeY = 0;

        // Keys
        this.keys = {};
        this.listenKey(e => {
            this.keys[e.key] = true;
            e.preventDefault();
        });
        // Key up listener
        const keyUpHandler = (e) => { this.keys[e.key] = false; };
        document.addEventListener('keyup', keyUpHandler);
        this._boundClicks.push(['keyup', keyUpHandler]);
        // Bind keyup to document, but track for cleanup
        const origStop = this.stop.bind(this);
        this.stop = () => {
            document.removeEventListener('keyup', keyUpHandler);
            origStop();
        };

        this.lastTime = performance.now();
        this.ui.innerHTML = '';
        this.loop();
    }

    spawnTraffic() {
        const lane = randInt(0, this.laneCount - 1);
        const x = this.roadLeft + lane * this.laneWidth + this.laneWidth / 2;
        const colors = ['#e74c3c', '#3498db', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];
        this.traffic.push({
            x, y: -80,
            w: 36, h: 65,
            speed: 1 + Math.random() * 2,
            color: randChoice(colors),
            lane
        });
    }

    spawnFuel() {
        const x = randInt(this.roadLeft + 30, this.roadRight - 30);
        this.fuels.push({x, y: -30, size: 18, glow: 0});
    }

    spawnParticles(x, y, color, count, spread) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = (spread || 1) + Math.random() * 3;
            this.particles.push({
                x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
                life: 1, decay: 0.02 + Math.random() * 0.03, color, size: 2 + Math.random() * 4
            });
        }
    }

    update() {
        if (!this.alive) return;
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 16.67, 3);
        this.lastTime = now;

        // Speed increases over time
        this.speed = Math.min(this.maxSpeed, this.speed + 0.002 * dt);
        this.distance += this.speed * dt;
        this.setScore(Math.floor(this.distance));

        // Fuel decreases
        this.fuel -= 0.03 * dt * (this.speed / 5);
        if (this.fuel <= 0) {
            this.fuel = 0;
            this.alive = false;
            this.spawnParticles(this.carX, this.carY, '#888', 20, 2);
            this.endGame();
            this.showOverlay('Out of Fuel!', `Distance: ${Math.floor(this.distance)}`);
            return;
        }

        // Controls
        const moveSpeed = 5;
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.carTargetX -= moveSpeed * dt;
            this.carTilt = Math.max(-0.15, this.carTilt - 0.02 * dt);
        } else if (this.keys['ArrowRight'] || this.keys['d']) {
            this.carTargetX += moveSpeed * dt;
            this.carTilt = Math.min(0.15, this.carTilt + 0.02 * dt);
        } else {
            this.carTilt *= 0.9;
        }
        if (this.keys['ArrowUp'] || this.keys['w']) {
            this.speed = Math.min(this.maxSpeed, this.speed + 0.05 * dt);
        }
        if (this.keys['ArrowDown'] || this.keys['s']) {
            this.speed = Math.max(2, this.speed - 0.08 * dt);
        }

        // Clamp car position
        this.carTargetX = Math.max(this.roadLeft + this.carW / 2 + 5, Math.min(this.roadRight - this.carW / 2 - 5, this.carTargetX));
        this.carX += (this.carTargetX - this.carX) * 0.15 * dt;

        // Road lines scroll
        this.lineOffset = (this.lineOffset + this.speed * dt * 2) % 40;

        // Spawn traffic
        this.trafficTimer += dt;
        if (this.trafficTimer >= this.trafficInterval / this.speed) {
            this.spawnTraffic();
            this.trafficTimer = 0;
        }

        // Spawn fuel
        this.fuelTimer += dt;
        if (this.fuelTimer >= 120) {
            this.spawnFuel();
            this.fuelTimer = 0;
        }

        // Update traffic
        this.traffic = this.traffic.filter(t => {
            t.y += (this.speed - t.speed) * dt * 2;
            // Collision check
            if (t.y + t.h/2 > this.carY - this.carH/2 && t.y - t.h/2 < this.carY + this.carH/2 &&
                t.x + t.w/2 > this.carX - this.carW/2 && t.x - t.w/2 < this.carX + this.carW/2) {
                // Crash!
                this.alive = false;
                this.shakeX = 10; this.shakeY = 10;
                this.spawnParticles(this.carX, this.carY, '#ff4444', 30, 3);
                this.spawnParticles(this.carX, this.carY, '#ffd700', 20, 2);
                this.spawnParticles(t.x, t.y, '#ff8800', 20, 3);
                this.endGame();
                this.showOverlay('CRASH!', `Distance: ${Math.floor(this.distance)}`);
                return false;
            }
            return t.y < H + 100;
        });

        // Update fuel pickups
        this.fuels = this.fuels.filter(f => {
            f.y += this.speed * dt * 2;
            f.glow = (f.glow + 0.05 * dt) % (Math.PI * 2);
            // Pickup check
            const dx = f.x - this.carX, dy = f.y - this.carY;
            if (Math.sqrt(dx*dx+dy*dy) < 35) {
                this.fuel = Math.min(100, this.fuel + 25);
                this.spawnParticles(f.x, f.y, '#4caf50', 12, 2);
                return false;
            }
            return f.y < H + 50;
        });

        // Update trees (scroll)
        this.trees.forEach(t => {
            t.y += this.speed * dt * 1.5;
            if (t.y > H + 40) {
                t.y = -40;
                t.x = Math.random() < 0.5 ? randInt(10, this.roadLeft - 30) : randInt(this.roadRight + 10, this.W - 20);
            }
        });

        // Particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.life -= p.decay * dt;
            return p.life > 0;
        });

        // Exhaust particles
        if (Math.random() < 0.3 * this.speed / 5) {
            this.particles.push({
                x: this.carX + (Math.random()-0.5) * 10,
                y: this.carY + this.carH/2,
                vx: (Math.random()-0.5) * 0.5,
                vy: 1 + Math.random(),
                life: 0.5, decay: 0.02, color: '#666', size: 3 + Math.random() * 3
            });
        }

        // Screen shake decay
        this.shakeX *= 0.9;
        this.shakeY *= 0.9;

        // Road sparkles
        if (Math.random() < 0.1 * this.speed / 5) {
            this.roadSparkles.push({
                x: randInt(this.roadLeft, this.roadRight),
                y: -5, life: 1
            });
        }
        this.roadSparkles = this.roadSparkles.filter(s => {
            s.y += this.speed * dt * 2;
            s.life -= 0.02 * dt;
            return s.life > 0 && s.y < H;
        });
    }

    render() {
        const {ctx, W, H} = this;

        ctx.save();
        ctx.translate(this.shakeX * (Math.random()-0.5), this.shakeY * (Math.random()-0.5));

        // Sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
        skyGrad.addColorStop(0, '#0a0a2a');
        skyGrad.addColorStop(1, '#1a1a3a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H);

        // Grass
        ctx.fillStyle = '#1a4a1a';
        ctx.fillRect(0, 0, this.roadLeft, H);
        ctx.fillRect(this.roadRight, 0, W - this.roadRight, H);

        // Grass stripes
        ctx.fillStyle = '#1d4d1d';
        for (let y = -40 + (this.lineOffset * 1.5) % 30; y < H; y += 30) {
            ctx.fillRect(0, y, this.roadLeft, 15);
            ctx.fillRect(this.roadRight, y, W - this.roadRight, 15);
        }

        // Road
        const roadGrad = ctx.createLinearGradient(this.roadLeft, 0, this.roadRight, 0);
        roadGrad.addColorStop(0, '#333');
        roadGrad.addColorStop(0.1, '#444');
        roadGrad.addColorStop(0.5, '#555');
        roadGrad.addColorStop(0.9, '#444');
        roadGrad.addColorStop(1, '#333');
        ctx.fillStyle = roadGrad;
        ctx.fillRect(this.roadLeft, 0, this.roadWidth, H);

        // Road edges (white lines)
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.roadLeft, 0, 3, H);
        ctx.fillRect(this.roadRight - 3, 0, 3, H);

        // Lane markings (dashed)
        ctx.strokeStyle = '#fff8';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 20]);
        for (let i = 1; i < this.laneCount; i++) {
            const lx = this.roadLeft + i * this.laneWidth;
            ctx.beginPath();
            ctx.moveTo(lx, -40 + this.lineOffset);
            for (let y = -40 + this.lineOffset; y < H; y += 40) {
                ctx.moveTo(lx, y);
                ctx.lineTo(lx, y + 20);
            }
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Road sparkles
        this.roadSparkles.forEach(s => {
            ctx.globalAlpha = s.life * 0.3;
            ctx.fillStyle = '#fff';
            ctx.fillRect(s.x, s.y, 2, 2);
        });
        ctx.globalAlpha = 1;

        // Trees
        this.trees.forEach(t => {
            // Trunk
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(t.x - 3, t.y, 6, t.size * 0.6);
            // Canopy
            ctx.fillStyle = '#2d6a2d';
            ctx.beginPath();
            ctx.arc(t.x, t.y - t.size * 0.1, t.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1d5a1d';
            ctx.beginPath();
            ctx.arc(t.x - 3, t.y - t.size * 0.05, t.size * 0.35, 0, Math.PI * 2);
            ctx.fill();
        });

        // Fuel pickups
        this.fuels.forEach(f => {
            const glow = Math.sin(f.glow) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(76, 175, 80, ${glow})`;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size + Math.sin(f.glow) * 3, 0, Math.PI * 2);
            ctx.fill();
            // Fuel icon
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('F', f.x, f.y + 5);
            // Glow
            ctx.globalAlpha = glow * 0.2;
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size + 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        // Traffic cars
        this.traffic.forEach(t => {
            ctx.save();
            ctx.translate(t.x, t.y);
            // Car body
            ctx.fillStyle = t.color;
            this.drawCar(ctx, 0, 0, t.w, t.h, t.color, false);
            ctx.restore();
        });

        // Player car
        ctx.save();
        ctx.translate(this.carX, this.carY);
        ctx.rotate(this.carTilt);
        this.drawCar(ctx, 0, 0, this.carW, this.carH, '#4fc3f7', true);
        ctx.restore();

        // Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        ctx.restore(); // End shake

        // HUD background
        ctx.fillStyle = '#0008';
        ctx.fillRect(0, 0, W, 50);

        // Speed display
        const speedPct = this.speed / this.maxSpeed;
        this.text(`${Math.floor(this.speed * 20)} km/h`, 80, 22, 16, speedPct > 0.8 ? '#ff4444' : '#fff');

        // Distance
        this.text(`${Math.floor(this.distance)}m`, W / 2, 22, 18, '#ffd700');

        // Fuel bar
        ctx.fillStyle = '#333';
        ctx.fillRect(W - 150, 10, 120, 14);
        const fuelColor = this.fuel > 50 ? '#4caf50' : this.fuel > 25 ? '#ffd700' : '#ff4444';
        ctx.fillStyle = fuelColor;
        ctx.fillRect(W - 150, 10, 120 * (this.fuel / 100), 14);
        ctx.strokeStyle = '#fff6';
        ctx.lineWidth = 1;
        ctx.strokeRect(W - 150, 10, 120, 14);
        this.text('FUEL', W - 90, 40, 11, '#aaa');

        // Score
        this.text(`Score: ${this.score}`, W / 2, 42, 14, '#ccc');

        // Speed lines effect at high speed
        if (this.speed > 8) {
            ctx.globalAlpha = (this.speed - 8) / (this.maxSpeed - 8) * 0.2;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                const lx = randInt(this.roadLeft, this.roadRight);
                const ly = randInt(0, H);
                ctx.beginPath();
                ctx.moveTo(lx, ly);
                ctx.lineTo(lx, ly + 30 + this.speed * 3);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }

        // Instructions
        if (this.distance < 100) {
            this.text('Arrow keys to steer & speed up', W / 2, H - 20, 14, '#888');
        }
    }

    drawCar(ctx, x, y, w, h, color, isPlayer) {
        // Shadow
        ctx.fillStyle = '#0004';
        ctx.fillRect(x - w/2 + 3, y - h/2 + 3, w, h);

        // Main body
        ctx.fillStyle = color;
        ctx.fillRect(x - w/2, y - h/2, w, h);

        // Windshield
        ctx.fillStyle = isPlayer ? '#1a3a5c' : '#2a2a4a';
        ctx.fillRect(x - w/2 + 5, y - h/2 + (isPlayer ? 8 : h - 25), w - 10, 18);

        // Roof
        const roofColor = isPlayer ? '#3aa3e7' : color;
        ctx.fillStyle = roofColor;
        ctx.fillRect(x - w/2 + 6, y - h/4, w - 12, h * 0.35);

        // Headlights/taillights
        if (isPlayer) {
            // Taillights
            ctx.fillStyle = '#ff3333';
            ctx.fillRect(x - w/2 + 2, y + h/2 - 6, 8, 4);
            ctx.fillRect(x + w/2 - 10, y + h/2 - 6, 8, 4);
        } else {
            // Headlights (facing player)
            ctx.fillStyle = '#ffff88';
            ctx.fillRect(x - w/2 + 2, y + h/2 - 6, 8, 4);
            ctx.fillRect(x + w/2 - 10, y + h/2 - 6, 8, 4);
        }

        // Wheels
        ctx.fillStyle = '#222';
        ctx.fillRect(x - w/2 - 3, y - h/2 + 8, 5, 12);
        ctx.fillRect(x + w/2 - 2, y - h/2 + 8, 5, 12);
        ctx.fillRect(x - w/2 - 3, y + h/2 - 20, 5, 12);
        ctx.fillRect(x + w/2 - 2, y + h/2 - 20, 5, 12);

        // Highlight stripe
        ctx.fillStyle = '#fff2';
        ctx.fillRect(x - 2, y - h/2, 4, h);
    }
}

// 2. BIKE TRAIL
class BikeTrailGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.W = W; this.H = H;

        // Terrain generation
        this.segments = [];
        this.segWidth = 5;
        this.generateTerrain(800);
        this.cameraX = 0;

        // Bike physics
        this.bikeX = 150;
        this.bikeY = 0;
        this.bikeVX = 0;
        this.bikeVY = 0;
        this.bikeAngle = 0;
        this.bikeAngularVel = 0;
        this.wheelBase = 35;
        this.onGround = false;
        this.dead = false;
        this.grounded = true;

        // Initial positioning
        this.bikeY = this.getTerrainY(this.bikeX) - 20;

        // Stars (collectibles)
        this.stars = [];
        this.spawnStars();

        // Particles
        this.particles = [];

        // Air time
        this.airTime = 0;
        this.bestAir = 0;
        this.airMessage = '';
        this.airMessageTimer = 0;

        // Flip tracking
        this.totalRotation = 0;
        this.lastAngle = this.bikeAngle;
        this.flips = 0;

        // Distance
        this.distanceTraveled = 0;

        // Keys
        this.keys = {};
        this.listenKey(e => { this.keys[e.key] = true; e.preventDefault(); });
        const keyUpHandler = (e) => { this.keys[e.key] = false; };
        document.addEventListener('keyup', keyUpHandler);
        const origStop = this.stop.bind(this);
        this.stop = () => { document.removeEventListener('keyup', keyUpHandler); origStop(); };

        this.lastTime = performance.now();
        this.ui.innerHTML = '';
        this.loop();
    }

    generateTerrain(count) {
        let y = 300;
        let startIdx = this.segments.length;
        for (let i = 0; i < count; i++) {
            const idx = startIdx + i;
            // Create varied terrain: flat, hills, bumps, ramps
            const section = Math.floor(idx / 80) % 6;
            switch (section) {
                case 0: // Gentle hills
                    y += Math.sin(idx * 0.03) * 1.5;
                    break;
                case 1: // Steep up
                    y -= 0.8 + Math.sin(idx * 0.05) * 0.5;
                    break;
                case 2: // Bumpy
                    y += Math.sin(idx * 0.15) * 3;
                    break;
                case 3: // Steep down
                    y += 1.2 + Math.sin(idx * 0.04) * 0.5;
                    break;
                case 4: // Jumps (ramps)
                    y += Math.sin(idx * 0.08) * 4;
                    break;
                case 5: // Flat recovery
                    y += Math.sin(idx * 0.02) * 0.3;
                    break;
            }
            y = Math.max(100, Math.min(this.H - 50, y));
            this.segments.push(y);
        }
    }

    getTerrainY(x) {
        const idx = Math.floor(x / this.segWidth);
        const frac = (x / this.segWidth) - idx;
        if (idx < 0 || idx >= this.segments.length - 1) return 400;
        return this.segments[idx] * (1 - frac) + this.segments[idx + 1] * frac;
    }

    getTerrainAngle(x) {
        const dx = this.segWidth;
        const dy = this.getTerrainY(x + dx) - this.getTerrainY(x);
        return Math.atan2(dy, dx);
    }

    spawnStars() {
        for (let i = 200; i < this.segments.length * this.segWidth; i += randInt(80, 200)) {
            const ty = this.getTerrainY(i);
            this.stars.push({
                x: i,
                y: ty - randInt(40, 100),
                collected: false,
                glow: Math.random() * Math.PI * 2
            });
        }
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1,
                life: 1, decay: 0.02 + Math.random() * 0.03, color, size: 2 + Math.random() * 3
            });
        }
    }

    update() {
        if (this.dead) return;
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 16.67, 3);
        this.lastTime = now;

        // Particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.vy += 0.05 * dt;
            p.life -= p.decay * dt;
            return p.life > 0;
        });

        if (this.airMessageTimer > 0) this.airMessageTimer -= dt;

        // Controls
        if (this.keys['ArrowUp'] || this.keys['w']) {
            this.bikeVX += 0.15 * dt;
        }
        if (this.keys['ArrowDown'] || this.keys['s']) {
            this.bikeVX -= 0.08 * dt;
        }
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.bikeAngularVel -= 0.004 * dt;
        }
        if (this.keys['ArrowRight'] || this.keys['d']) {
            this.bikeAngularVel += 0.004 * dt;
        }

        // Gravity
        this.bikeVY += 0.35 * dt;

        // Apply velocity
        this.bikeX += this.bikeVX * dt;
        this.bikeY += this.bikeVY * dt;

        // Speed limit
        this.bikeVX = Math.max(-2, Math.min(8, this.bikeVX));

        // Ground collision
        const groundY = this.getTerrainY(this.bikeX);
        const groundAngle = this.getTerrainAngle(this.bikeX);

        if (this.bikeY >= groundY - 18) {
            this.bikeY = groundY - 18;
            if (!this.onGround) {
                // Landing
                const impact = Math.abs(this.bikeVY);
                // Check if landing angle is too steep (crash)
                const angleDiff = Math.abs(this.bikeAngle - groundAngle);
                if (angleDiff > Math.PI * 0.45 && impact > 3) {
                    this.crash();
                    return;
                }

                // Air time bonus
                if (this.airTime > 15) {
                    const airBonus = Math.floor(this.airTime * 2);
                    this.setScore(this.score + airBonus);
                    this.airMessage = `Air time! +${airBonus}`;
                    this.airMessageTimer = 40;
                }

                // Flip bonus
                if (this.flips > 0) {
                    const flipBonus = this.flips * 100;
                    this.setScore(this.score + flipBonus);
                    this.airMessage = `${this.flips}x Flip! +${flipBonus}`;
                    this.airMessageTimer = 50;
                    this.spawnParticles(this.bikeX, this.bikeY, '#ffd700', 15);
                }

                this.airTime = 0;
                this.flips = 0;
                this.totalRotation = 0;

                // Dust on landing
                if (impact > 2) {
                    this.spawnParticles(this.bikeX, groundY, '#aa8844', Math.floor(impact * 2));
                }
            }
            this.onGround = true;
            this.bikeVY = Math.min(0, this.bikeVY);

            // Align to terrain
            this.bikeAngle += (groundAngle - this.bikeAngle) * 0.2 * dt;
            this.bikeAngularVel *= 0.8;

            // Ground friction
            this.bikeVX *= Math.pow(0.995, dt);
        } else {
            this.onGround = false;
            this.airTime += dt;
            // Track flips
            const angleDelta = this.bikeAngle - this.lastAngle;
            this.totalRotation += angleDelta;
            this.flips = Math.floor(Math.abs(this.totalRotation) / (Math.PI * 2));
        }
        this.lastAngle = this.bikeAngle;

        // Angular physics
        this.bikeAngle += this.bikeAngularVel * dt;
        this.bikeAngularVel *= 0.98;

        // Head collision check (crash if head touches ground)
        const headX = this.bikeX + Math.sin(this.bikeAngle) * 25;
        const headY = this.bikeY - Math.cos(this.bikeAngle) * 25;
        const headGroundY = this.getTerrainY(headX);
        if (headY >= headGroundY - 2) {
            this.crash();
            return;
        }

        // Camera
        this.cameraX += (this.bikeX - this.W * 0.3 - this.cameraX) * 0.08 * dt;

        // Distance scoring
        this.distanceTraveled = Math.max(this.distanceTraveled, this.bikeX);
        this.setScore(Math.floor(this.distanceTraveled / 5) + this.score - Math.floor(this.distanceTraveled / 5));

        // Collect stars
        this.stars.forEach(s => {
            if (s.collected) return;
            s.glow += 0.05 * dt;
            const dx = s.x - this.bikeX, dy = s.y - this.bikeY;
            if (Math.sqrt(dx*dx+dy*dy) < 30) {
                s.collected = true;
                this.setScore(this.score + 50);
                this.spawnParticles(s.x, s.y, '#ffd700', 12);
            }
        });

        // Generate more terrain if needed
        if (this.bikeX > (this.segments.length - 200) * this.segWidth) {
            this.generateTerrain(400);
            // Add more stars
            const startX = (this.segments.length - 400) * this.segWidth;
            for (let i = startX; i < this.segments.length * this.segWidth; i += randInt(80, 200)) {
                const ty = this.getTerrainY(i);
                this.stars.push({x: i, y: ty - randInt(40, 100), collected: false, glow: Math.random() * Math.PI * 2});
            }
        }

        // Tire particles when on ground
        if (this.onGround && Math.abs(this.bikeVX) > 2 && Math.random() < 0.3) {
            this.particles.push({
                x: this.bikeX - Math.cos(this.bikeAngle) * 15,
                y: groundY - 2,
                vx: (Math.random()-0.5) * 0.5,
                vy: -Math.random() * 0.5,
                life: 0.5, decay: 0.03, color: '#8a7a5a', size: 2 + Math.random() * 2
            });
        }
    }

    crash() {
        this.dead = true;
        this.spawnParticles(this.bikeX, this.bikeY, '#ff4444', 25);
        this.spawnParticles(this.bikeX, this.bikeY, '#ffa500', 15);
        // Final score includes distance
        this.setScore(this.score + Math.floor(this.distanceTraveled / 10));
        this.endGame();
        this.showOverlay('WIPEOUT!', `Distance: ${Math.floor(this.distanceTraveled / 10)}m | Score: ${this.score}`);
    }

    render() {
        const {ctx, W, H} = this;
        const camX = this.cameraX;

        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
        skyGrad.addColorStop(0, '#1a0a2e');
        skyGrad.addColorStop(0.5, '#2a1a4e');
        skyGrad.addColorStop(1, '#3a2a1a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H);

        // Background mountains (parallax)
        ctx.fillStyle = '#1a2a3a';
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 30) {
            const worldX = x + camX * 0.2;
            const my = 150 + Math.sin(worldX * 0.003) * 80 + Math.sin(worldX * 0.007) * 40;
            ctx.lineTo(x, my);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();

        // Mid-ground hills (parallax)
        ctx.fillStyle = '#2a3a2a';
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 20) {
            const worldX = x + camX * 0.5;
            const my = 220 + Math.sin(worldX * 0.005) * 60 + Math.sin(worldX * 0.012) * 30;
            ctx.lineTo(x, my);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();

        // Terrain
        const startSeg = Math.max(0, Math.floor(camX / this.segWidth) - 2);
        const endSeg = Math.min(this.segments.length - 1, Math.floor((camX + W) / this.segWidth) + 2);

        // Terrain fill
        ctx.fillStyle = '#4a3a2a';
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let i = startSeg; i <= endSeg; i++) {
            const screenX = i * this.segWidth - camX;
            ctx.lineTo(screenX, this.segments[i]);
        }
        ctx.lineTo((endSeg) * this.segWidth - camX, H);
        ctx.closePath();
        ctx.fill();

        // Terrain surface line
        ctx.strokeStyle = '#6a5a3a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = startSeg; i <= endSeg; i++) {
            const screenX = i * this.segWidth - camX;
            if (i === startSeg) ctx.moveTo(screenX, this.segments[i]);
            else ctx.lineTo(screenX, this.segments[i]);
        }
        ctx.stroke();

        // Grass on top
        ctx.strokeStyle = '#3a7a2a';
        ctx.lineWidth = 2;
        for (let i = startSeg; i <= endSeg; i += 3) {
            const screenX = i * this.segWidth - camX;
            const ty = this.segments[i];
            ctx.beginPath();
            ctx.moveTo(screenX, ty);
            ctx.lineTo(screenX - 3, ty - 6);
            ctx.moveTo(screenX, ty);
            ctx.lineTo(screenX + 3, ty - 5);
            ctx.stroke();
        }

        // Stars
        this.stars.forEach(s => {
            if (s.collected) return;
            const sx = s.x - camX, sy = s.y;
            if (sx < -30 || sx > W + 30) return;
            const glow = Math.sin(s.glow) * 0.3 + 0.7;
            ctx.globalAlpha = glow;
            ctx.fillStyle = '#ffd700';
            // Star shape
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(s.glow * 0.5);
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
                const r = i % 2 === 0 ? 10 : 4;
                if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            // Glow
            ctx.globalAlpha = glow * 0.2;
            ctx.beginPath();
            ctx.arc(sx, sy, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        // Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x - camX, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Bike
        if (!this.dead) {
            const bx = this.bikeX - camX;
            const by = this.bikeY;

            ctx.save();
            ctx.translate(bx, by);
            ctx.rotate(this.bikeAngle);

            // Wheels
            ctx.fillStyle = '#333';
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 3;
            // Rear wheel
            ctx.beginPath();
            ctx.arc(-this.wheelBase/2, 12, 10, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            // Front wheel
            ctx.beginPath();
            ctx.arc(this.wheelBase/2, 12, 10, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            // Wheel spokes
            ctx.strokeStyle = '#777';
            ctx.lineWidth = 1;
            const spokeAngle = performance.now() / 100;
            for (let w = -1; w <= 1; w += 2) {
                for (let i = 0; i < 4; i++) {
                    const a = spokeAngle + i * Math.PI / 2;
                    ctx.beginPath();
                    ctx.moveTo(w * this.wheelBase/2, 12);
                    ctx.lineTo(w * this.wheelBase/2 + Math.cos(a) * 8, 12 + Math.sin(a) * 8);
                    ctx.stroke();
                }
            }

            // Frame
            ctx.strokeStyle = '#e63900';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-this.wheelBase/2, 12);
            ctx.lineTo(0, -5);
            ctx.lineTo(this.wheelBase/2, 12);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(-5, -8);
            ctx.stroke();

            // Seat
            ctx.fillStyle = '#333';
            ctx.fillRect(-8, -10, 10, 4);

            // Handlebars
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.wheelBase/2 - 5, 5);
            ctx.lineTo(this.wheelBase/2 + 2, -8);
            ctx.stroke();
            ctx.fillRect(this.wheelBase/2 - 2, -12, 8, 4);

            // Rider
            // Legs
            ctx.strokeStyle = '#4a4a8a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-5, -8);
            ctx.lineTo(-this.wheelBase/2 + 3, 8);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-5, -8);
            ctx.lineTo(this.wheelBase/2 - 5, 8);
            ctx.stroke();

            // Body
            ctx.strokeStyle = '#e63900';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(-3, -8);
            ctx.lineTo(0, -22);
            ctx.stroke();

            // Arms
            ctx.strokeStyle = '#ffaa88';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -18);
            ctx.lineTo(this.wheelBase/2 + 1, -10);
            ctx.stroke();

            // Helmet
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.arc(0, -26, 7, 0, Math.PI * 2);
            ctx.fill();
            // Visor
            ctx.fillStyle = '#333';
            ctx.fillRect(2, -28, 6, 4);

            ctx.restore();
        }

        // HUD
        ctx.fillStyle = '#0008';
        ctx.fillRect(0, 0, W, 50);
        this.text(`Score: ${this.score}`, 80, 22, 18, '#ffd700');
        this.text(`${Math.floor(this.distanceTraveled / 10)}m`, W / 2, 22, 18, '#fff');

        // Speed indicator
        const speed = Math.abs(this.bikeVX);
        const speedBar = speed / 8;
        ctx.fillStyle = '#333';
        ctx.fillRect(W - 140, 10, 110, 12);
        ctx.fillStyle = speedBar > 0.7 ? '#ff4444' : speedBar > 0.4 ? '#ffd700' : '#4caf50';
        ctx.fillRect(W - 140, 10, 110 * speedBar, 12);
        this.text('SPEED', W - 85, 40, 11, '#aaa');

        // Air time
        if (!this.onGround && this.airTime > 10) {
            const pulse = 1 + Math.sin(performance.now() / 150) * 0.1;
            ctx.save();
            ctx.translate(W / 2, 70);
            ctx.scale(pulse, pulse);
            this.text(`AIR: ${(this.airTime / 60).toFixed(1)}s`, 0, 0, 20, '#ffd700');
            if (this.flips > 0) {
                this.text(`${this.flips}x FLIP!`, 0, 25, 18, '#ff4400');
            }
            ctx.restore();
        }

        // Air message
        if (this.airMessageTimer > 0 && this.airMessage) {
            ctx.globalAlpha = Math.min(1, this.airMessageTimer / 15);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.airMessage, W / 2, 100);
            ctx.globalAlpha = 1;
        }

        // Instructions
        if (this.distanceTraveled < 50) {
            this.text('Up=Gas  Down=Brake  L/R=Lean', W / 2, H - 20, 14, '#888');
        }
    }
}

// 3. DRIFT KING
class DriftKingGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.W = W; this.H = H;

        // Car
        this.carX = W / 2; this.carY = H / 2;
        this.carAngle = -Math.PI / 2; // facing up
        this.carSpeed = 0;
        this.carW = 20; this.carH = 35;
        this.steerAngle = 0;
        this.drifting = false;
        this.driftAngle = 0; // difference between car heading and velocity direction
        this.velAngle = -Math.PI / 2;

        // Drift scoring
        this.driftScore = 0;
        this.driftCombo = 0;
        this.driftTimer = 0;
        this.comboTimer = 0;
        this.bestCombo = 0;

        // Track generation
        this.currentTrack = 0;
        this.trackPoints = [];
        this.trackWidth = 80;
        this.generateTrack();

        // Camera
        this.camX = this.carX; this.camY = this.carY;

        // Tire marks
        this.tireMarks = [];

        // Particles
        this.particles = [];

        // Smoke effect during drift
        this.smokeParticles = [];

        // Lap
        this.lap = 0;
        this.checkpointIdx = 0;
        this.lapMessage = '';
        this.lapMessageTimer = 0;

        // Keys
        this.keys = {};
        this.listenKey(e => { this.keys[e.key] = true; e.preventDefault(); });
        const keyUpHandler = (e) => {
            this.keys[e.key] = false;
            // End drift on space release
            if (e.key === ' ' && this.drifting) {
                this.endDrift();
            }
        };
        document.addEventListener('keyup', keyUpHandler);
        const origStop = this.stop.bind(this);
        this.stop = () => { document.removeEventListener('keyup', keyUpHandler); origStop(); };

        this.lastTime = performance.now();
        this.gameTime = 60 * 60; // 60 seconds at 60fps
        this.ui.innerHTML = '';
        this.loop();
    }

    generateTrack() {
        this.trackPoints = [];
        const cx = this.W / 2, cy = this.H / 2;
        const numPoints = 12 + this.currentTrack * 2;
        const baseRadius = 180 + this.currentTrack * 10;

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const radiusVar = baseRadius + Math.sin(angle * 3 + this.currentTrack) * 60 + Math.cos(angle * 5) * 30;
            this.trackPoints.push({
                x: cx + Math.cos(angle) * radiusVar,
                y: cy + Math.sin(angle) * radiusVar
            });
        }

        // Position car at start
        if (this.trackPoints.length > 0) {
            this.carX = this.trackPoints[0].x;
            this.carY = this.trackPoints[0].y;
            const next = this.trackPoints[1];
            this.carAngle = Math.atan2(next.y - this.carY, next.x - this.carX);
            this.velAngle = this.carAngle;
        }
        this.checkpointIdx = 0;
        this.tireMarks = [];
    }

    getClosestTrackPoint(x, y) {
        let minDist = Infinity, closest = 0;
        for (let i = 0; i < this.trackPoints.length; i++) {
            const dx = this.trackPoints[i].x - x, dy = this.trackPoints[i].y - y;
            const d = dx*dx + dy*dy;
            if (d < minDist) { minDist = d; closest = i; }
        }
        return {idx: closest, dist: Math.sqrt(minDist)};
    }

    isOnTrack(x, y) {
        // Check distance to track center line (simplified)
        const {dist} = this.getClosestTrackPoint(x, y);
        return dist < this.trackWidth * 1.2;
    }

    endDrift() {
        if (this.driftScore > 0) {
            const bonus = Math.floor(this.driftScore * (1 + this.driftCombo * 0.5));
            this.setScore(this.score + bonus);
            this.spawnParticles(this.carX, this.carY, '#ffd700', 12);
            this.lapMessage = `DRIFT +${bonus}`;
            if (this.driftCombo > 1) this.lapMessage += ` (${this.driftCombo}x combo!)`;
            this.lapMessageTimer = 50;
            if (this.driftCombo > this.bestCombo) this.bestCombo = this.driftCombo;
        }
        this.drifting = false;
        this.driftScore = 0;
        this.driftTimer = 0;
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 1, decay: 0.02 + Math.random() * 0.02, color, size: 2 + Math.random() * 3
            });
        }
    }

    update() {
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 16.67, 3);
        this.lastTime = now;

        // Timer countdown
        this.gameTime -= dt;
        if (this.gameTime <= 0) {
            this.endGame();
            this.showOverlay('Time Up!', `Score: ${this.score} | Best Combo: ${this.bestCombo}x | Laps: ${this.lap}`);
            return;
        }

        // Particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.life -= p.decay * dt;
            return p.life > 0;
        });
        this.smokeParticles = this.smokeParticles.filter(p => {
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.size += 0.1 * dt;
            p.life -= p.decay * dt;
            return p.life > 0;
        });

        if (this.lapMessageTimer > 0) this.lapMessageTimer -= dt;
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) this.driftCombo = 0;
        }

        // Steering
        const steerRate = 0.04 * dt;
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.steerAngle -= steerRate;
        } else if (this.keys['ArrowRight'] || this.keys['d']) {
            this.steerAngle += steerRate;
        } else {
            this.steerAngle *= 0.85;
        }
        this.steerAngle = Math.max(-0.6, Math.min(0.6, this.steerAngle));

        // Acceleration
        if (this.keys['ArrowUp'] || this.keys['w']) {
            this.carSpeed = Math.min(6, this.carSpeed + 0.08 * dt);
        } else if (this.keys['ArrowDown'] || this.keys['s']) {
            this.carSpeed = Math.max(-2, this.carSpeed - 0.1 * dt);
        } else {
            this.carSpeed *= Math.pow(0.98, dt);
        }

        // Drift mechanic
        if (this.keys[' '] && Math.abs(this.carSpeed) > 2) {
            if (!this.drifting) {
                this.drifting = true;
                this.driftScore = 0;
                this.driftTimer = 0;
            }
        }

        // Physics
        const grip = this.drifting ? 0.85 : 0.95;
        const turnRate = this.steerAngle * (this.carSpeed / 4) * dt;

        if (this.drifting) {
            // In drift: car heading turns faster, velocity follows more slowly
            this.carAngle += turnRate * 1.5;
            this.velAngle += (this.carAngle - this.velAngle) * 0.03 * dt;

            // Calculate drift angle
            this.driftAngle = Math.abs(this.carAngle - this.velAngle);
            while (this.driftAngle > Math.PI) this.driftAngle -= Math.PI * 2;
            this.driftAngle = Math.abs(this.driftAngle);

            // Score drifts
            if (this.driftAngle > 0.15 && Math.abs(this.carSpeed) > 2) {
                this.driftScore += this.driftAngle * Math.abs(this.carSpeed) * 0.3 * dt;
                this.driftTimer += dt;

                // Tire marks
                if (this.tireMarks.length < 3000) {
                    const backX = this.carX - Math.cos(this.carAngle) * this.carH * 0.4;
                    const backY = this.carY - Math.sin(this.carAngle) * this.carH * 0.4;
                    this.tireMarks.push({
                        x: backX + Math.cos(this.carAngle + Math.PI/2) * 8,
                        y: backY + Math.sin(this.carAngle + Math.PI/2) * 8,
                        life: 1
                    });
                    this.tireMarks.push({
                        x: backX - Math.cos(this.carAngle + Math.PI/2) * 8,
                        y: backY - Math.sin(this.carAngle + Math.PI/2) * 8,
                        life: 1
                    });
                }

                // Smoke
                if (Math.random() < 0.4) {
                    const backX = this.carX - Math.cos(this.carAngle) * this.carH * 0.4;
                    const backY = this.carY - Math.sin(this.carAngle) * this.carH * 0.4;
                    this.smokeParticles.push({
                        x: backX + (Math.random()-0.5) * 15,
                        y: backY + (Math.random()-0.5) * 15,
                        vx: (Math.random()-0.5) * 0.5,
                        vy: (Math.random()-0.5) * 0.5,
                        size: 5, life: 0.8, decay: 0.015
                    });
                }
            }

            // Speed loss during drift
            this.carSpeed *= Math.pow(0.995, dt);
        } else {
            this.carAngle += turnRate;
            this.velAngle += (this.carAngle - this.velAngle) * grip * dt;
        }

        // Move car
        this.carX += Math.cos(this.velAngle) * this.carSpeed * dt;
        this.carY += Math.sin(this.velAngle) * this.carSpeed * dt;

        // Off-track penalty
        if (!this.isOnTrack(this.carX, this.carY)) {
            this.carSpeed *= Math.pow(0.95, dt);
            if (this.drifting) this.endDrift();
        }

        // Checkpoint / lap tracking
        const {idx} = this.getClosestTrackPoint(this.carX, this.carY);
        const expectedNext = (this.checkpointIdx + 1) % this.trackPoints.length;
        if (idx === expectedNext || idx === (expectedNext + 1) % this.trackPoints.length) {
            this.checkpointIdx = idx;
        }
        // Lap completion
        if (this.checkpointIdx >= this.trackPoints.length - 2 && idx <= 1 &&
            this.getClosestTrackPoint(this.carX, this.carY).dist < this.trackWidth) {
            this.lap++;
            this.checkpointIdx = 0;
            const lapBonus = 200 + this.lap * 50;
            this.setScore(this.score + lapBonus);
            this.lapMessage = `LAP ${this.lap}! +${lapBonus}`;
            this.lapMessageTimer = 60;
            this.spawnParticles(this.carX, this.carY, '#4caf50', 20);
            // New track every 3 laps
            if (this.lap % 3 === 0) {
                this.currentTrack++;
                this.generateTrack();
                this.lapMessage = `NEW TRACK! Lap ${this.lap}`;
            }
        }

        // Combo tracking: if drifting ends and starts again within combo window
        if (this.drifting && this.driftScore > 0) {
            this.comboTimer = 90; // frames to chain next drift
        }
        if (!this.drifting && this.comboTimer > 0 && this.keys[' '] && Math.abs(this.carSpeed) > 2) {
            this.driftCombo++;
        }

        // Camera
        this.camX += (this.carX - this.camX) * 0.1 * dt;
        this.camY += (this.carY - this.camY) * 0.1 * dt;

        // Fade tire marks
        this.tireMarks = this.tireMarks.filter(t => {
            t.life -= 0.001 * dt;
            return t.life > 0;
        });
    }

    render() {
        const {ctx, W, H} = this;
        const offX = W / 2 - this.camX;
        const offY = H / 2 - this.camY;

        // Background
        ctx.fillStyle = '#1a3a1a';
        ctx.fillRect(0, 0, W, H);

        // Grid pattern for ground
        ctx.strokeStyle = '#2a4a2a';
        ctx.lineWidth = 1;
        const gridSize = 40;
        const startGX = Math.floor((this.camX - W/2) / gridSize) * gridSize;
        const startGY = Math.floor((this.camY - H/2) / gridSize) * gridSize;
        for (let x = startGX; x < this.camX + W/2; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x + offX, 0);
            ctx.lineTo(x + offX, H);
            ctx.stroke();
        }
        for (let y = startGY; y < this.camY + H/2; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y + offY);
            ctx.lineTo(W, y + offY);
            ctx.stroke();
        }

        // Track
        const pts = this.trackPoints;
        if (pts.length > 2) {
            // Track fill (asphalt)
            ctx.fillStyle = '#444';
            ctx.strokeStyle = '#666';
            ctx.lineWidth = this.trackWidth * 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(pts[0].x + offX, pts[0].y + offY);
            for (let i = 1; i < pts.length; i++) {
                ctx.lineTo(pts[i].x + offX, pts[i].y + offY);
            }
            ctx.closePath();
            ctx.stroke();

            // Track center line
            ctx.strokeStyle = '#fff3';
            ctx.lineWidth = 2;
            ctx.setLineDash([15, 15]);
            ctx.beginPath();
            ctx.moveTo(pts[0].x + offX, pts[0].y + offY);
            for (let i = 1; i < pts.length; i++) {
                ctx.lineTo(pts[i].x + offX, pts[i].y + offY);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.setLineDash([]);

            // Track edge markings (red-white curbs)
            ctx.lineWidth = this.trackWidth * 2 + 8;
            ctx.strokeStyle = '#fff3';
            ctx.beginPath();
            ctx.moveTo(pts[0].x + offX, pts[0].y + offY);
            for (let i = 1; i < pts.length; i++) {
                ctx.lineTo(pts[i].x + offX, pts[i].y + offY);
            }
            ctx.closePath();
            ctx.stroke();

            // Start/finish line
            const sx = pts[0].x + offX, sy = pts[0].y + offY;
            ctx.fillStyle = '#fff';
            ctx.fillRect(sx - 30, sy - 3, 60, 6);
            ctx.fillStyle = '#000';
            for (let i = 0; i < 6; i++) {
                if (i % 2 === 0) ctx.fillRect(sx - 30 + i * 10, sy - 3, 10, 3);
                else ctx.fillRect(sx - 30 + i * 10, sy, 10, 3);
            }
        }

        // Tire marks
        ctx.fillStyle = '#222';
        this.tireMarks.forEach(t => {
            ctx.globalAlpha = t.life * 0.6;
            ctx.fillRect(t.x + offX - 1.5, t.y + offY - 1.5, 3, 3);
        });
        ctx.globalAlpha = 1;

        // Smoke particles
        this.smokeParticles.forEach(p => {
            ctx.globalAlpha = p.life * 0.4;
            ctx.fillStyle = '#aaa';
            ctx.beginPath();
            ctx.arc(p.x + offX, p.y + offY, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x + offX, p.y + offY, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Car
        ctx.save();
        ctx.translate(this.carX + offX, this.carY + offY);
        ctx.rotate(this.carAngle);

        // Car shadow
        ctx.fillStyle = '#0004';
        ctx.fillRect(-this.carW/2 + 3, -this.carH/2 + 3, this.carW, this.carH);

        // Car body
        const bodyGrad = ctx.createLinearGradient(-this.carW/2, 0, this.carW/2, 0);
        bodyGrad.addColorStop(0, '#cc2200');
        bodyGrad.addColorStop(0.5, '#ff4400');
        bodyGrad.addColorStop(1, '#cc2200');
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(-this.carW/2, -this.carH/2, this.carW, this.carH);

        // Windshield
        ctx.fillStyle = '#226';
        ctx.fillRect(-this.carW/2 + 3, -this.carH/2 + 5, this.carW - 6, 10);

        // Roof
        ctx.fillStyle = '#dd3300';
        ctx.fillRect(-this.carW/2 + 4, -this.carH/4, this.carW - 8, this.carH * 0.3);

        // Headlights
        ctx.fillStyle = '#ffff88';
        ctx.fillRect(-this.carW/2 + 2, -this.carH/2, 5, 3);
        ctx.fillRect(this.carW/2 - 7, -this.carH/2, 5, 3);

        // Taillights
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-this.carW/2 + 2, this.carH/2 - 3, 5, 3);
        ctx.fillRect(this.carW/2 - 7, this.carH/2 - 3, 5, 3);

        // Number
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('1', 0, 5);

        // Drift indicator glow
        if (this.drifting && this.driftAngle > 0.15) {
            ctx.globalAlpha = Math.min(0.5, this.driftAngle * 0.5);
            ctx.fillStyle = '#ff8800';
            ctx.fillRect(-this.carW/2 - 3, -this.carH/2 - 3, this.carW + 6, this.carH + 6);
            ctx.globalAlpha = 1;
        }

        ctx.restore();

        // Velocity indicator arrow (subtle)
        if (this.drifting) {
            const arrowLen = this.carSpeed * 8;
            ctx.strokeStyle = '#ff880066';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.carX + offX, this.carY + offY);
            ctx.lineTo(
                this.carX + offX + Math.cos(this.velAngle) * arrowLen,
                this.carY + offY + Math.sin(this.velAngle) * arrowLen
            );
            ctx.stroke();
        }

        // HUD
        ctx.fillStyle = '#0009';
        ctx.fillRect(0, 0, W, 55);

        // Timer
        const timeLeft = Math.max(0, Math.ceil(this.gameTime / 60));
        const timeColor = timeLeft <= 10 ? '#ff4444' : timeLeft <= 20 ? '#ffd700' : '#fff';
        this.text(`${timeLeft}s`, W / 2, 22, 22, timeColor);

        // Score
        this.text(`Score: ${this.score}`, 80, 22, 16, '#ffd700');
        this.text(`Lap: ${this.lap}`, 80, 42, 14, '#aaa');

        // Speed
        this.text(`${Math.floor(Math.abs(this.carSpeed) * 30)} km/h`, W - 80, 22, 14, '#fff');

        // Current drift info
        if (this.drifting && this.driftScore > 0) {
            const driftDeg = Math.floor(this.driftAngle * 180 / Math.PI);
            const pulse = 1 + Math.sin(performance.now() / 100) * 0.1;
            ctx.save();
            ctx.translate(W / 2, 70);
            ctx.scale(pulse, pulse);
            ctx.fillStyle = '#ff8800';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`DRIFT! ${driftDeg}\u00B0`, 0, 0);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 18px sans-serif';
            ctx.fillText(`+${Math.floor(this.driftScore)}`, 0, 25);
            if (this.driftCombo > 0) {
                ctx.fillStyle = '#ff4444';
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText(`${this.driftCombo + 1}x COMBO`, 0, 45);
            }
            ctx.restore();
        }

        // Combo timer bar
        if (this.comboTimer > 0 && !this.drifting) {
            const comboPct = this.comboTimer / 90;
            ctx.fillStyle = '#333';
            ctx.fillRect(W / 2 - 50, 60, 100, 6);
            ctx.fillStyle = '#ff8800';
            ctx.fillRect(W / 2 - 50, 60, 100 * comboPct, 6);
            this.text('COMBO WINDOW', W / 2, 78, 10, '#ff8800');
        }

        // Lap message
        if (this.lapMessageTimer > 0 && this.lapMessage) {
            ctx.globalAlpha = Math.min(1, this.lapMessageTimer / 15);
            ctx.fillStyle = this.lapMessage.includes('TRACK') ? '#4caf50' : '#ffd700';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.lapMessage, W / 2, H / 2);
            ctx.globalAlpha = 1;
        }

        // Instructions
        if (this.score === 0 && this.lap === 0) {
            this.text('Arrows=Drive  Space=Drift  Chain drifts for combos!', W / 2, H - 15, 13, '#888');
        }
    }
}

// Register racing games
Portal.register({id:'speedracer',name:'Speed Racer',category:'racing',icon:'\u{1F3CE}\uFE0F',color:'linear-gradient(135deg,#1a1a3a,#3a3a6a)',Game:SpeedRacerGame,canvasWidth:600,canvasHeight:800,tags:['car','dodge','traffic']});
Portal.register({id:'biketrail',name:'Bike Trail',category:'racing',icon:'\u{1F3CD}\uFE0F',color:'linear-gradient(135deg,#2a1a0a,#5a3a1a)',Game:BikeTrailGame,canvasWidth:800,canvasHeight:500,tags:['bike','motocross','physics']});
Portal.register({id:'driftking',name:'Drift King',category:'racing',icon:'\u{1F697}',color:'linear-gradient(135deg,#3a0a1a,#6a1a3a)',Game:DriftKingGame,canvasWidth:700,canvasHeight:700,tags:['drift','car','racing']});
