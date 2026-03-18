/* === SPORTS GAMES (4) === */

// 1. BASKETBALL HOOPS
class BasketballHoopsGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.W = W; this.H = H;
        // Hoop position
        this.hoopX = W - 130; this.hoopY = 160;
        this.rimRadius = 30; this.backboardX = W - 80;
        // Ball state
        this.ballRadius = 15;
        this.resetBall();
        // Drag
        this.dragging = false; this.dragStart = null; this.dragEnd = null;
        // Streak
        this.streak = 0; this.bestStreak = 0;
        // Wind
        this.wind = 0; this.newWind();
        // Particles
        this.particles = [];
        // Net animation
        this.netSway = 0; this.netSwayVel = 0;
        // Shot trail
        this.trail = [];
        // Messages
        this.message = ''; this.messageTimer = 0;
        // State: 'aiming', 'flying', 'scored', 'missed'
        this.state = 'aiming';
        this.shotCount = 0;

        this.listenMouse('mousedown', e => {
            if (this.state !== 'aiming') return;
            const r = this.canvas.getBoundingClientRect();
            const mx = e.clientX - r.left, my = e.clientY - r.top;
            const dx = mx - this.ballX, dy = my - this.ballY;
            if (Math.sqrt(dx*dx+dy*dy) < 60) {
                this.dragging = true;
                this.dragStart = {x: mx, y: my};
                this.dragEnd = {x: mx, y: my};
            }
        });
        this.listenMouse('mousemove', e => {
            if (!this.dragging) return;
            const r = this.canvas.getBoundingClientRect();
            this.dragEnd = {x: e.clientX - r.left, y: e.clientY - r.top};
        });
        this.listenMouse('mouseup', e => {
            if (!this.dragging) return;
            this.dragging = false;
            const dx = this.dragStart.x - this.dragEnd.x;
            const dy = this.dragStart.y - this.dragEnd.y;
            const power = Math.min(Math.sqrt(dx*dx+dy*dy), 200);
            if (power < 15) return;
            const angle = Math.atan2(dy, dx);
            this.ballVX = Math.cos(angle) * power * 0.08;
            this.ballVY = Math.sin(angle) * power * 0.08;
            this.state = 'flying';
            this.trail = [];
            this.shotCount++;
            this.dragStart = null; this.dragEnd = null;
        });

        this.lastTime = performance.now();
        this.ui.innerHTML = '';
        this.loop();
    }

    resetBall() {
        this.ballX = 100; this.ballY = this.H - 80;
        this.ballVX = 0; this.ballVY = 0;
        this.ballSpin = 0;
        this.ballAngle = 0;
    }

    newWind() {
        this.wind = (Math.random() - 0.5) * 0.08;
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1,
                decay: 0.015 + Math.random() * 0.025,
                color,
                size: 2 + Math.random() * 4
            });
        }
    }

    update() {
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 16.67, 3);
        this.lastTime = now;

        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.vy += 0.1 * dt;
            p.life -= p.decay * dt;
            return p.life > 0;
        });

        // Net sway physics
        this.netSway += this.netSwayVel * dt;
        this.netSwayVel -= this.netSway * 0.15 * dt;
        this.netSwayVel *= 0.92;

        // Message timer
        if (this.messageTimer > 0) this.messageTimer -= dt;

        if (this.state === 'flying') {
            // Trail
            this.trail.push({x: this.ballX, y: this.ballY, life: 1});
            this.trail = this.trail.filter(t => { t.life -= 0.03 * dt; return t.life > 0; });

            // Physics
            this.ballVY += 0.25 * dt; // gravity
            this.ballVX += this.wind * dt; // wind
            this.ballX += this.ballVX * dt;
            this.ballY += this.ballVY * dt;
            this.ballSpin += this.ballVX * 0.02 * dt;
            this.ballAngle += this.ballSpin * dt;

            // Backboard collision
            if (this.ballX + this.ballRadius > this.backboardX && this.ballY > this.hoopY - 60 && this.ballY < this.hoopY + 40) {
                this.ballX = this.backboardX - this.ballRadius;
                this.ballVX = -this.ballVX * 0.6;
                this.ballSpin = -this.ballSpin * 0.5;
            }

            // Rim collision (left and right side of rim)
            const rimLeftX = this.hoopX - this.rimRadius;
            const rimRightX = this.hoopX + this.rimRadius;
            const rimY = this.hoopY;
            const rimSize = 6;

            // Left rim
            const dlx = this.ballX - rimLeftX, dly = this.ballY - rimY;
            const distL = Math.sqrt(dlx*dlx + dly*dly);
            if (distL < this.ballRadius + rimSize) {
                const nx = dlx / distL, ny = dly / distL;
                const dot = this.ballVX * nx + this.ballVY * ny;
                this.ballVX -= 1.5 * dot * nx;
                this.ballVY -= 1.5 * dot * ny;
                this.ballX = rimLeftX + nx * (this.ballRadius + rimSize + 1);
                this.ballY = rimY + ny * (this.ballRadius + rimSize + 1);
                this.ballVX *= 0.7; this.ballVY *= 0.7;
            }

            // Right rim
            const drx = this.ballX - rimRightX, dry = this.ballY - rimY;
            const distR = Math.sqrt(drx*drx + dry*dry);
            if (distR < this.ballRadius + rimSize) {
                const nx = drx / distR, ny = dry / distR;
                const dot = this.ballVX * nx + this.ballVY * ny;
                this.ballVX -= 1.5 * dot * nx;
                this.ballVY -= 1.5 * dot * ny;
                this.ballX = rimRightX + nx * (this.ballRadius + rimSize + 1);
                this.ballY = rimRightX + ny * (this.ballRadius + rimSize + 1);
                this.ballVX *= 0.7; this.ballVY *= 0.7;
            }

            // Check if ball goes through hoop
            if (this.ballVY > 0 && Math.abs(this.ballX - this.hoopX) < this.rimRadius - 5 &&
                this.ballY > this.hoopY - 5 && this.ballY < this.hoopY + 15) {
                // Score!
                this.streak++;
                if (this.streak > this.bestStreak) this.bestStreak = this.streak;
                const bonus = this.streak > 1 ? this.streak : 1;
                const points = 100 * bonus;
                this.setScore(this.score + points);
                this.state = 'scored';
                this.netSwayVel = 5;
                this.spawnParticles(this.hoopX, this.hoopY + 20, '#ffd700', 25);
                this.spawnParticles(this.hoopX, this.hoopY + 20, '#ff6600', 15);
                if (this.streak >= 3) {
                    this.message = this.streak >= 5 ? 'ON FIRE!! x' + bonus : 'STREAK! x' + bonus;
                    this.spawnParticles(this.hoopX, this.hoopY, '#ff0000', 30);
                } else if (bonus > 1) {
                    this.message = 'NICE! x' + bonus;
                } else {
                    this.message = 'SWISH!';
                }
                this.messageTimer = 60;
                this.addTimeout(() => {
                    this.resetBall();
                    this.newWind();
                    this.state = 'aiming';
                    this.trail = [];
                }, 800);
            }

            // Floor bounce
            if (this.ballY + this.ballRadius > this.H - 30) {
                this.ballY = this.H - 30 - this.ballRadius;
                this.ballVY = -this.ballVY * 0.5;
                this.ballVX *= 0.8;
                if (Math.abs(this.ballVY) < 1) this.ballVY = 0;
            }

            // Wall bounce
            if (this.ballX - this.ballRadius < 0) {
                this.ballX = this.ballRadius;
                this.ballVX = -this.ballVX * 0.5;
            }
            if (this.ballX + this.ballRadius > this.W) {
                this.ballX = this.W - this.ballRadius;
                this.ballVX = -this.ballVX * 0.5;
            }

            // Miss detection - ball settled or off screen
            if (this.state === 'flying') {
                const settled = this.ballY > this.H - 40 && Math.abs(this.ballVY) < 0.5 && Math.abs(this.ballVX) < 0.5;
                if (settled || this.ballY > this.H + 50) {
                    this.streak = 0;
                    this.message = 'MISS!';
                    this.messageTimer = 40;
                    this.state = 'missed';
                    this.addTimeout(() => {
                        this.resetBall();
                        this.newWind();
                        this.state = 'aiming';
                        this.trail = [];
                    }, 600);
                }
            }
        }
    }

    render() {
        const {ctx, W, H} = this;
        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
        skyGrad.addColorStop(0, '#1a1a3e');
        skyGrad.addColorStop(1, '#0a0a20');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H);

        // Court floor
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(0, H - 30, W, 30);
        ctx.fillStyle = '#7a5a2a';
        for (let x = 0; x < W; x += 50) {
            ctx.fillRect(x, H - 30, 48, 2);
        }

        // Court line markings
        ctx.strokeStyle = '#fff3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.hoopX, H - 30, 80, Math.PI, 0);
        ctx.stroke();

        // Trail
        this.trail.forEach(t => {
            ctx.fillStyle = `rgba(255, 165, 0, ${t.life * 0.4})`;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.ballRadius * t.life * 0.6, 0, Math.PI * 2);
            ctx.fill();
        });

        // Backboard
        ctx.fillStyle = '#eee';
        ctx.fillRect(this.backboardX, this.hoopY - 60, 8, 100);
        // Backboard square
        ctx.strokeStyle = '#e33';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.backboardX - 30, this.hoopY - 25, 30, 30);

        // Pole
        ctx.fillStyle = '#888';
        ctx.fillRect(this.backboardX + 2, this.hoopY + 40, 4, H - this.hoopY - 70);

        // Rim
        ctx.strokeStyle = '#e63900';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(this.hoopX - this.rimRadius, this.hoopY);
        ctx.lineTo(this.hoopX + this.rimRadius, this.hoopY);
        ctx.stroke();

        // Rim circles (ends)
        ctx.fillStyle = '#e63900';
        ctx.beginPath();
        ctx.arc(this.hoopX - this.rimRadius, this.hoopY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.hoopX + this.rimRadius, this.hoopY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Net
        const netDepth = 40;
        const netSegments = 6;
        ctx.strokeStyle = '#fff8';
        ctx.lineWidth = 1.5;
        for (let i = 0; i <= netSegments; i++) {
            const t = i / netSegments;
            const topX = this.hoopX - this.rimRadius + t * this.rimRadius * 2;
            const sway = this.netSway * Math.sin(t * Math.PI) * (1 - t * 0.3);
            const bottomX = this.hoopX - this.rimRadius * 0.4 + t * this.rimRadius * 0.8 + sway;
            ctx.beginPath();
            ctx.moveTo(topX, this.hoopY + 2);
            ctx.quadraticCurveTo(topX + sway * 0.5, this.hoopY + netDepth * 0.5, bottomX, this.hoopY + netDepth);
            ctx.stroke();
        }
        // Horizontal net lines
        for (let j = 1; j < 4; j++) {
            const ny = this.hoopY + j * netDepth / 4;
            const narrowFactor = j / 4;
            const lx = this.hoopX - this.rimRadius * (1 - narrowFactor * 0.6) + this.netSway * narrowFactor * 0.3;
            const rx = this.hoopX + this.rimRadius * (1 - narrowFactor * 0.6) + this.netSway * narrowFactor * 0.3;
            ctx.beginPath();
            ctx.moveTo(lx, ny);
            ctx.lineTo(rx, ny);
            ctx.stroke();
        }

        // Ball
        ctx.save();
        ctx.translate(this.ballX, this.ballY);
        ctx.rotate(this.ballAngle);
        // Ball gradient
        const ballGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, this.ballRadius);
        ballGrad.addColorStop(0, '#ff8800');
        ballGrad.addColorStop(0.7, '#dd5500');
        ballGrad.addColorStop(1, '#993300');
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.ballRadius, 0, Math.PI * 2);
        ctx.fill();
        // Ball lines
        ctx.strokeStyle = '#4a2500';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-this.ballRadius, 0);
        ctx.lineTo(this.ballRadius, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.ballRadius * 0.7, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.ballRadius * 0.7, Math.PI - Math.PI * 0.4, Math.PI + Math.PI * 0.4);
        ctx.stroke();
        ctx.restore();

        // Aiming arrow
        if (this.dragging && this.dragStart && this.dragEnd) {
            const dx = this.dragStart.x - this.dragEnd.x;
            const dy = this.dragStart.y - this.dragEnd.y;
            const power = Math.min(Math.sqrt(dx*dx+dy*dy), 200);
            const angle = Math.atan2(dy, dx);
            const len = power * 0.5;

            ctx.save();
            ctx.translate(this.ballX, this.ballY);
            ctx.rotate(angle);

            // Power gradient arrow
            const arrowGrad = ctx.createLinearGradient(0, 0, len, 0);
            arrowGrad.addColorStop(0, '#4fc3f7');
            arrowGrad.addColorStop(1, power > 150 ? '#ff4444' : '#ffd700');
            ctx.strokeStyle = arrowGrad;
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len, 0);
            ctx.stroke();
            ctx.setLineDash([]);

            // Arrow head
            ctx.fillStyle = power > 150 ? '#ff4444' : '#ffd700';
            ctx.beginPath();
            ctx.moveTo(len + 10, 0);
            ctx.lineTo(len - 5, -6);
            ctx.lineTo(len - 5, 6);
            ctx.closePath();
            ctx.fill();

            ctx.restore();

            // Power bar
            ctx.fillStyle = '#333';
            ctx.fillRect(20, H - 20, 100, 8);
            const pct = power / 200;
            const barColor = pct > 0.75 ? '#ff4444' : pct > 0.5 ? '#ffd700' : '#4fc3f7';
            ctx.fillStyle = barColor;
            ctx.fillRect(20, H - 20, 100 * pct, 8);
        }

        // Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Wind indicator
        ctx.fillStyle = '#aaa';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        const windStr = this.wind > 0.02 ? 'Wind >>>' : this.wind < -0.02 ? '<<< Wind' : 'No Wind';
        ctx.fillText(windStr, W / 2, 25);

        // HUD
        this.text(`Score: ${this.score}`, 80, 50, 22, '#fff', 'center');
        this.text(`Streak: ${this.streak}`, 80, 75, 16, this.streak >= 3 ? '#ffd700' : '#aaa', 'center');
        this.text(`Shot #${this.shotCount + 1}`, W / 2, 50, 16, '#888', 'center');

        // Streak fire effect
        if (this.streak >= 3) {
            const fireColors = ['#ff0', '#f80', '#f00'];
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = fireColors[i];
                ctx.globalAlpha = 0.3 + Math.sin(performance.now() / 100 + i) * 0.2;
                ctx.beginPath();
                ctx.arc(this.ballX + (Math.random()-0.5)*10, this.ballY - this.ballRadius - 5 - i*5,
                    4 + Math.random()*3, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Message
        if (this.messageTimer > 0 && this.message) {
            const alpha = Math.min(1, this.messageTimer / 20);
            ctx.globalAlpha = alpha;
            const msgSize = this.message.includes('FIRE') ? 36 : 28;
            const msgColor = this.message === 'MISS!' ? '#ff4444' :
                             this.message.includes('FIRE') ? '#ff4400' : '#ffd700';
            ctx.fillStyle = msgColor;
            ctx.font = `bold ${msgSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(this.message, W / 2, H / 2 - 40);
            ctx.globalAlpha = 1;
        }

        // Instructions
        if (this.state === 'aiming' && this.shotCount === 0) {
            this.text('Click & drag ball to shoot!', W / 2, H - 50, 16, '#888');
        }
    }
}

// 2. SOCCER KICK
class SoccerKickGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.W = W; this.H = H;
        // Goal dimensions
        this.goalTop = 120; this.goalBottom = 340;
        this.goalLeft = 100; this.goalRight = 600;
        this.goalWidth = this.goalRight - this.goalLeft;
        this.goalHeight = this.goalBottom - this.goalTop;
        // Ball
        this.ballStartX = W / 2; this.ballStartY = H - 60;
        this.ballRadius = 14;
        this.resetShot();
        // Goalie
        this.goalieX = W / 2; this.goalieY = (this.goalTop + this.goalBottom) / 2;
        this.goalieW = 50; this.goalieH = 70;
        this.goalieDiveDir = 0; this.goalieDiveProgress = 0;
        this.goalieDiveTarget = {x: 0, y: 0};
        // Game state
        this.shots = 0; this.maxShots = 10; this.goals = 0;
        this.state = 'aiming'; // 'aiming', 'flying', 'result'
        // Drag
        this.dragging = false; this.dragStart = null; this.dragEnd = null;
        // Particles
        this.particles = [];
        // Message
        this.message = ''; this.messageTimer = 0;
        // Crowd noise simulation (visual)
        this.crowdExcitement = 0;

        this.listenMouse('mousedown', e => {
            if (this.state !== 'aiming') return;
            const r = this.canvas.getBoundingClientRect();
            const mx = e.clientX - r.left, my = e.clientY - r.top;
            const dx = mx - this.ballX, dy = my - this.ballY;
            if (Math.sqrt(dx*dx+dy*dy) < 50) {
                this.dragging = true;
                this.dragStart = {x: mx, y: my};
                this.dragEnd = {x: mx, y: my};
            }
        });
        this.listenMouse('mousemove', e => {
            if (!this.dragging) return;
            const r = this.canvas.getBoundingClientRect();
            this.dragEnd = {x: e.clientX - r.left, y: e.clientY - r.top};
        });
        this.listenMouse('mouseup', e => {
            if (!this.dragging) return;
            this.dragging = false;
            const dx = this.dragStart.x - this.dragEnd.x;
            const dy = this.dragStart.y - this.dragEnd.y;
            const power = Math.min(Math.sqrt(dx*dx+dy*dy), 200);
            if (power < 20) { this.dragStart = null; this.dragEnd = null; return; }
            const angle = Math.atan2(dy, dx);
            // Curve based on horizontal component of swipe
            const swipeHoriz = (this.dragEnd.x - this.dragStart.x);
            this.ballCurve = swipeHoriz * 0.003;
            this.ballVX = Math.cos(angle) * power * 0.06;
            this.ballVY = Math.sin(angle) * power * 0.06;
            this.ballSpeed = power;
            // Goalie AI decides where to dive
            this.decideGoalieDive();
            this.state = 'flying';
            this.ballScale = 1;
            this.ballFlying = true;
            this.dragStart = null; this.dragEnd = null;
        });

        this.lastTime = performance.now();
        this.ui.innerHTML = '';
        this.loop();
    }

    resetShot() {
        this.ballX = this.ballStartX; this.ballY = this.ballStartY;
        this.ballVX = 0; this.ballVY = 0; this.ballCurve = 0;
        this.ballScale = 1; this.ballFlying = false;
        this.ballSpeed = 0;
        this.ballTrail = [];
    }

    decideGoalieDive() {
        // AI: predict where ball will go, but not perfectly
        const targetX = this.ballX + this.ballVX * 25 + (Math.random() - 0.5) * 120;
        const targetY = this.goalieY + (Math.random() - 0.5) * 60;
        this.goalieDiveTarget = {
            x: Math.max(this.goalLeft + 30, Math.min(this.goalRight - 30, targetX)),
            y: Math.max(this.goalTop + 30, Math.min(this.goalBottom - 30, targetY))
        };
        this.goalieDiveProgress = 0;
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, decay: 0.02 + Math.random() * 0.02,
                color, size: 2 + Math.random() * 4
            });
        }
    }

    update() {
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 16.67, 3);
        this.lastTime = now;

        // Particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.life -= p.decay * dt;
            return p.life > 0;
        });

        // Message
        if (this.messageTimer > 0) this.messageTimer -= dt;
        if (this.crowdExcitement > 0) this.crowdExcitement -= 0.01 * dt;

        if (this.state === 'flying') {
            // Trail
            this.ballTrail.push({x: this.ballX, y: this.ballY, s: this.ballScale, life: 1});
            this.ballTrail = this.ballTrail.filter(t => { t.life -= 0.04 * dt; return t.life > 0; });

            // Ball physics
            this.ballX += this.ballVX * dt;
            this.ballY += this.ballVY * dt;
            this.ballVX += this.ballCurve * dt;
            // Ball shrinks as it "flies toward goal" (perspective)
            this.ballScale = Math.max(0.4, 1 - (this.ballStartY - this.ballY) / (this.ballStartY - this.goalTop) * 0.5);

            // Goalie dives
            this.goalieDiveProgress = Math.min(1, this.goalieDiveProgress + 0.04 * dt);
            const ease = 1 - Math.pow(1 - this.goalieDiveProgress, 3);
            const startGX = this.W / 2, startGY = (this.goalTop + this.goalBottom) / 2;
            this.goalieX = startGX + (this.goalieDiveTarget.x - startGX) * ease;
            this.goalieY = startGY + (this.goalieDiveTarget.y - startGY) * ease;

            // Check if ball reaches goal line
            if (this.ballY <= this.goalTop + 30) {
                this.shots++;
                const inGoalX = this.ballX > this.goalLeft + 15 && this.ballX < this.goalRight - 15;
                const inGoalY = this.ballY <= this.goalBottom && this.ballY >= this.goalTop - 10;

                if (inGoalX && inGoalY) {
                    // Check if goalie saves
                    const gDist = Math.sqrt(
                        Math.pow(this.ballX - this.goalieX, 2) +
                        Math.pow(this.ballY - this.goalieY, 2)
                    );
                    const saveRadius = 40;
                    if (gDist < saveRadius) {
                        // Saved!
                        this.message = 'SAVED!';
                        this.messageTimer = 60;
                        this.spawnParticles(this.goalieX, this.goalieY, '#ff4444', 15);
                    } else {
                        // GOAL!
                        this.goals++;
                        const points = Math.round(this.ballSpeed * 0.5 + 50);
                        this.setScore(this.score + points);
                        this.message = 'GOAL!! +' + points;
                        this.messageTimer = 60;
                        this.crowdExcitement = 1;
                        this.spawnParticles(this.ballX, this.ballY, '#ffd700', 30);
                        this.spawnParticles(this.ballX, this.ballY, '#00ff00', 20);
                    }
                } else {
                    // Off target
                    this.message = 'WIDE!';
                    this.messageTimer = 60;
                    this.spawnParticles(this.ballX, this.ballY, '#666', 10);
                }

                this.state = 'result';
                this.addTimeout(() => {
                    if (this.shots >= this.maxShots) {
                        this.endGame();
                        this.showOverlay('Full Time!', `Goals: ${this.goals}/${this.maxShots} | Score: ${this.score}`);
                    } else {
                        this.resetShot();
                        this.goalieX = this.W / 2;
                        this.goalieY = (this.goalTop + this.goalBottom) / 2;
                        this.state = 'aiming';
                    }
                }, 1200);
            }
        }
    }

    render() {
        const {ctx, W, H} = this;
        // Field
        const fieldGrad = ctx.createLinearGradient(0, 0, 0, H);
        fieldGrad.addColorStop(0, '#1a5a1a');
        fieldGrad.addColorStop(1, '#0d3d0d');
        ctx.fillStyle = fieldGrad;
        ctx.fillRect(0, 0, W, H);

        // Field stripes
        ctx.fillStyle = '#1d5d1d';
        for (let y = 0; y < H; y += 40) {
            if ((y / 40) % 2 === 0) ctx.fillRect(0, y, W, 20);
        }

        // Perspective lines for penalty area
        ctx.strokeStyle = '#fff5';
        ctx.lineWidth = 2;
        // Goal box - trapezoid perspective
        ctx.beginPath();
        ctx.moveTo(this.goalLeft - 30, H - 10);
        ctx.lineTo(this.goalLeft, this.goalTop);
        ctx.lineTo(this.goalRight, this.goalTop);
        ctx.lineTo(this.goalRight + 30, H - 10);
        ctx.stroke();

        // Penalty spot
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(W / 2, H - 65, 3, 0, Math.PI * 2);
        ctx.fill();

        // Goal frame
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 6;
        ctx.strokeRect(this.goalLeft, this.goalTop, this.goalWidth, this.goalHeight);

        // Goal net
        ctx.strokeStyle = '#fff3';
        ctx.lineWidth = 1;
        const netSpacing = 20;
        for (let x = this.goalLeft; x <= this.goalRight; x += netSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, this.goalTop);
            ctx.lineTo(x, this.goalBottom);
            ctx.stroke();
        }
        for (let y = this.goalTop; y <= this.goalBottom; y += netSpacing) {
            ctx.beginPath();
            ctx.moveTo(this.goalLeft, y);
            ctx.lineTo(this.goalRight, y);
            ctx.stroke();
        }

        // Goal shadow inside
        ctx.fillStyle = '#0005';
        ctx.fillRect(this.goalLeft + 3, this.goalTop + 3, this.goalWidth - 6, this.goalHeight - 6);

        // Goalie
        ctx.save();
        const diveAngle = (this.goalieX - W/2) * 0.005;
        ctx.translate(this.goalieX, this.goalieY);
        ctx.rotate(diveAngle);
        // Body
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(-this.goalieW/2, -this.goalieH/2, this.goalieW, this.goalieH);
        // Jersey
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(-this.goalieW/2 + 3, -this.goalieH/2 + 3, this.goalieW - 6, this.goalieH/2 - 3);
        // Shorts
        ctx.fillStyle = '#333';
        ctx.fillRect(-this.goalieW/2 + 5, 0, this.goalieW - 10, this.goalieH/2 - 8);
        // Gloves
        ctx.fillStyle = '#4fc3f7';
        const armExtend = this.goalieDiveProgress * 20;
        ctx.fillRect(-this.goalieW/2 - armExtend, -this.goalieH/2, 12, 14);
        ctx.fillRect(this.goalieW/2 + armExtend - 12, -this.goalieH/2, 12, 14);
        // Head
        ctx.fillStyle = '#ffcc88';
        ctx.beginPath();
        ctx.arc(0, -this.goalieH/2 - 8, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Ball trail
        this.ballTrail.forEach(t => {
            ctx.globalAlpha = t.life * 0.3;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.ballRadius * t.s * t.life, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Ball
        if (this.state !== 'result' || this.messageTimer > 40) {
            ctx.save();
            ctx.translate(this.ballX, this.ballY);
            ctx.scale(this.ballScale, this.ballScale);
            // Soccer ball
            const bGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, this.ballRadius);
            bGrad.addColorStop(0, '#ffffff');
            bGrad.addColorStop(0.8, '#dddddd');
            bGrad.addColorStop(1, '#aaaaaa');
            ctx.fillStyle = bGrad;
            ctx.beginPath();
            ctx.arc(0, 0, this.ballRadius, 0, Math.PI * 2);
            ctx.fill();
            // Pentagon pattern
            ctx.fillStyle = '#333';
            const pentRadius = this.ballRadius * 0.45;
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
                ctx.beginPath();
                for (let j = 0; j < 5; j++) {
                    const pa = a + (j / 5) * Math.PI * 2 / 2.5;
                    const px = Math.cos(pa) * pentRadius * 0.4;
                    const py = Math.sin(pa) * pentRadius * 0.4;
                    const cx = Math.cos(a) * pentRadius * 1.2;
                    const cy = Math.sin(a) * pentRadius * 1.2;
                    if (j === 0) ctx.moveTo(cx + px, cy + py);
                    else ctx.lineTo(cx + px, cy + py);
                }
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }

        // Aim arrow
        if (this.dragging && this.dragStart && this.dragEnd) {
            const dx = this.dragStart.x - this.dragEnd.x;
            const dy = this.dragStart.y - this.dragEnd.y;
            const power = Math.min(Math.sqrt(dx*dx+dy*dy), 200);
            const angle = Math.atan2(dy, dx);

            ctx.save();
            ctx.translate(this.ballX, this.ballY);
            ctx.rotate(angle);
            const arrowGrad = ctx.createLinearGradient(0, 0, power * 0.4, 0);
            arrowGrad.addColorStop(0, '#4fc3f7');
            arrowGrad.addColorStop(1, power > 150 ? '#ff4444' : '#ffd700');
            ctx.strokeStyle = arrowGrad;
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(power * 0.4, 0);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = power > 150 ? '#ff4444' : '#ffd700';
            ctx.beginPath();
            ctx.moveTo(power * 0.4 + 8, 0);
            ctx.lineTo(power * 0.4 - 4, -5);
            ctx.lineTo(power * 0.4 - 4, 5);
            ctx.closePath(); ctx.fill();
            ctx.restore();

            // Power bar
            ctx.fillStyle = '#333';
            ctx.fillRect(20, H - 20, 100, 8);
            const pct = power / 200;
            ctx.fillStyle = pct > 0.75 ? '#ff4444' : pct > 0.5 ? '#ffd700' : '#4fc3f7';
            ctx.fillRect(20, H - 20, 100 * pct, 8);
        }

        // Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Crowd excitement
        if (this.crowdExcitement > 0) {
            ctx.globalAlpha = this.crowdExcitement * 0.15;
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = 1;
        }

        // HUD
        this.text(`Goals: ${this.goals}`, 80, 30, 22, '#fff');
        this.text(`Shots: ${this.shots}/${this.maxShots}`, W - 100, 30, 18, '#ccc');
        this.text(`Score: ${this.score}`, W / 2, 30, 20, '#ffd700');

        // Shot indicators
        for (let i = 0; i < this.maxShots; i++) {
            const sx = W / 2 - (this.maxShots * 12) + i * 24;
            ctx.fillStyle = i < this.shots ? (i < this.goals ? '#4caf50' : '#f44336') : '#555';
            ctx.beginPath();
            ctx.arc(sx, 55, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Message
        if (this.messageTimer > 0 && this.message) {
            const alpha = Math.min(1, this.messageTimer / 15);
            ctx.globalAlpha = alpha;
            const isGoal = this.message.includes('GOAL');
            ctx.fillStyle = isGoal ? '#ffd700' : this.message.includes('SAVED') ? '#ff4444' : '#fff';
            ctx.font = `bold ${isGoal ? 40 : 28}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(this.message, W / 2, H / 2 - 20);
            ctx.globalAlpha = 1;
        }

        // Instructions
        if (this.state === 'aiming' && this.shots === 0) {
            this.text('Click & drag ball to shoot!', W / 2, H - 20, 14, '#aaa');
        }
    }
}

// 3. GOLF
class GolfGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.W = W; this.H = H;
        this.ballRadius = 5;
        this.holeRadius = 10;
        this.friction = 0.985;
        this.currentHole = 0;
        this.totalHoles = 9;
        this.strokes = 0;
        this.totalStrokes = 0;
        this.par = [3, 2, 3, 4, 2, 3, 3, 4, 3]; // par for each hole
        this.holeScores = [];
        this.particles = [];
        this.message = ''; this.messageTimer = 0;
        this.state = 'aiming'; // 'aiming', 'rolling', 'sinking', 'transition'
        this.dragging = false; this.dragStart = null; this.dragEnd = null;
        this.sinkAnim = 0;
        // Generate all holes
        this.holes = [];
        for (let i = 0; i < this.totalHoles; i++) {
            this.holes.push(this.generateHole(i));
        }
        this.loadHole(0);

        this.listenMouse('mousedown', e => {
            if (this.state !== 'aiming') return;
            const r = this.canvas.getBoundingClientRect();
            const mx = e.clientX - r.left, my = e.clientY - r.top;
            const dx = mx - this.ballX, dy = my - this.ballY;
            if (Math.sqrt(dx*dx+dy*dy) < 40) {
                this.dragging = true;
                this.dragStart = {x: mx, y: my};
                this.dragEnd = {x: mx, y: my};
            }
        });
        this.listenMouse('mousemove', e => {
            if (!this.dragging) return;
            const r = this.canvas.getBoundingClientRect();
            this.dragEnd = {x: e.clientX - r.left, y: e.clientY - r.top};
        });
        this.listenMouse('mouseup', e => {
            if (!this.dragging) return;
            this.dragging = false;
            const dx = this.dragStart.x - this.dragEnd.x;
            const dy = this.dragStart.y - this.dragEnd.y;
            const power = Math.min(Math.sqrt(dx*dx+dy*dy), 180);
            if (power < 8) { this.dragStart = null; this.dragEnd = null; return; }
            const angle = Math.atan2(dy, dx);
            this.ballVX = Math.cos(angle) * power * 0.06;
            this.ballVY = Math.sin(angle) * power * 0.06;
            this.strokes++;
            this.state = 'rolling';
            this.dragStart = null; this.dragEnd = null;
        });

        this.lastTime = performance.now();
        this.ui.innerHTML = '';
        this.loop();
    }

    generateHole(idx) {
        const W = this.W, H = this.H;
        const margin = 80;
        // Different layouts per hole
        const layouts = [
            // 0: Simple straight
            {start:{x:100,y:H-80}, hole:{x:W-100,y:100}, walls:[], water:[], sand:[]},
            // 1: L-shape
            {start:{x:80,y:H-80}, hole:{x:W-80,y:80}, walls:[{x:200,y:0,w:30,h:H-200},{x:200,y:H-200,w:W-400,h:30}], water:[], sand:[{x:400,y:150,r:40}]},
            // 2: Narrow corridor
            {start:{x:100,y:H-80}, hole:{x:W-100,y:80},
             walls:[{x:0,y:200,w:W-180,h:20},{x:180,y:350,w:W-180,h:20}],
             water:[{x:350,y:250,r:35}], sand:[]},
            // 3: Island green
            {start:{x:100,y:H/2}, hole:{x:W-120,y:H/2},
             walls:[{x:300,y:100,w:20,h:150},{x:300,y:350,w:20,h:150}],
             water:[{x:W-120,y:H/2-80,r:30},{x:W-120,y:H/2+80,r:30}], sand:[{x:450,y:H/2,r:45}]},
            // 4: Short with obstacles
            {start:{x:W/2,y:H-80}, hole:{x:W/2,y:100},
             walls:[{x:W/2-80,y:250,w:60,h:20},{x:W/2+20,y:250,w:60,h:20}],
             water:[], sand:[{x:W/2-60,y:170,r:30},{x:W/2+60,y:170,r:30}]},
            // 5: Zigzag
            {start:{x:80,y:H-80}, hole:{x:W-80,y:H-80},
             walls:[{x:200,y:100,w:20,h:H-200},{x:400,y:100,w:20,h:H-200},{x:200,y:100,w:220,h:20}],
             water:[{x:300,y:H-150,r:35}], sand:[]},
            // 6: Open with water
            {start:{x:100,y:H-80}, hole:{x:W-100,y:100},
             walls:[], water:[{x:W/2,y:H/2,r:60},{x:W/2-80,y:H/2+60,r:30}],
             sand:[{x:W-200,y:200,r:40}]},
            // 7: Maze
            {start:{x:80,y:H-80}, hole:{x:W-80,y:80},
             walls:[{x:150,y:0,w:15,h:H-150},{x:300,y:150,w:15,h:H-150},{x:450,y:0,w:15,h:H-150}],
             water:[], sand:[{x:225,y:200,r:25},{x:375,y:350,r:25}]},
            // 8: Final challenge
            {start:{x:100,y:H-80}, hole:{x:W-100,y:80},
             walls:[{x:250,y:150,w:200,h:15},{x:250,y:350,w:200,h:15},{x:250,y:150,w:15,h:215}],
             water:[{x:180,y:250,r:35},{x:520,y:250,r:35}], sand:[{x:350,y:250,r:50}]},
        ];
        return layouts[idx % layouts.length];
    }

    loadHole(idx) {
        const layout = this.holes[idx];
        this.ballX = layout.start.x;
        this.ballY = layout.start.y;
        this.ballVX = 0; this.ballVY = 0;
        this.holeX = layout.hole.x;
        this.holeY = layout.hole.y;
        this.walls = layout.walls;
        this.waterHazards = layout.water;
        this.sandTraps = layout.sand;
        this.strokes = 0;
        this.state = 'aiming';
        this.sinkAnim = 0;
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

        // Particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.life -= p.decay * dt;
            return p.life > 0;
        });

        if (this.messageTimer > 0) this.messageTimer -= dt;

        if (this.state === 'sinking') {
            this.sinkAnim += 0.05 * dt;
            if (this.sinkAnim >= 1) {
                // Calculate score for hole
                const holePar = this.par[this.currentHole];
                const diff = this.strokes - holePar;
                this.holeScores.push(this.strokes);
                this.totalStrokes += this.strokes;
                let scoreName = '';
                let points = 0;
                if (this.strokes === 1) { scoreName = 'HOLE IN ONE!!!'; points = 500; }
                else if (diff <= -3) { scoreName = 'ALBATROSS!'; points = 400; }
                else if (diff === -2) { scoreName = 'EAGLE!'; points = 300; }
                else if (diff === -1) { scoreName = 'BIRDIE!'; points = 200; }
                else if (diff === 0) { scoreName = 'PAR'; points = 100; }
                else if (diff === 1) { scoreName = 'BOGEY'; points = 50; }
                else if (diff === 2) { scoreName = 'DOUBLE BOGEY'; points = 25; }
                else { scoreName = '+' + diff; points = 10; }
                this.setScore(this.score + points);
                this.message = `${scoreName} (${this.strokes} strokes)`;
                this.messageTimer = 80;
                this.state = 'transition';
                this.addTimeout(() => {
                    this.currentHole++;
                    if (this.currentHole >= this.totalHoles) {
                        this.endGame();
                        const totalPar = this.par.reduce((a,b)=>a+b,0);
                        const diff = this.totalStrokes - totalPar;
                        const diffStr = diff > 0 ? '+'+diff : diff === 0 ? 'E' : diff;
                        this.showOverlay('Round Complete!', `Total: ${this.totalStrokes} (${diffStr}) | Score: ${this.score}`);
                    } else {
                        this.loadHole(this.currentHole);
                    }
                }, 1500);
            }
            return;
        }

        if (this.state === 'rolling') {
            // Move ball
            this.ballX += this.ballVX * dt;
            this.ballY += this.ballVY * dt;

            // Check sand traps (slow down)
            let inSand = false;
            for (const s of this.sandTraps) {
                const dx = this.ballX - s.x, dy = this.ballY - s.y;
                if (Math.sqrt(dx*dx+dy*dy) < s.r) {
                    inSand = true;
                    this.ballVX *= Math.pow(0.96, dt);
                    this.ballVY *= Math.pow(0.96, dt);
                }
            }

            // Check water hazards (reset)
            for (const w of this.waterHazards) {
                const dx = this.ballX - w.x, dy = this.ballY - w.y;
                if (Math.sqrt(dx*dx+dy*dy) < w.r) {
                    this.spawnParticles(this.ballX, this.ballY, '#4fc3f7', 15);
                    this.strokes++; // penalty stroke
                    this.ballX = this.holes[this.currentHole].start.x;
                    this.ballY = this.holes[this.currentHole].start.y;
                    this.ballVX = 0; this.ballVY = 0;
                    this.message = 'WATER! +1 stroke';
                    this.messageTimer = 50;
                    this.state = 'aiming';
                    return;
                }
            }

            // Wall collisions
            for (const wall of this.walls) {
                if (this.ballX + this.ballRadius > wall.x && this.ballX - this.ballRadius < wall.x + wall.w &&
                    this.ballY + this.ballRadius > wall.y && this.ballY - this.ballRadius < wall.y + wall.h) {
                    // Determine which side
                    const overlapLeft = (this.ballX + this.ballRadius) - wall.x;
                    const overlapRight = (wall.x + wall.w) - (this.ballX - this.ballRadius);
                    const overlapTop = (this.ballY + this.ballRadius) - wall.y;
                    const overlapBottom = (wall.y + wall.h) - (this.ballY - this.ballRadius);
                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                    if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                        this.ballVX = -this.ballVX * 0.7;
                        this.ballX += (minOverlap === overlapLeft ? -1 : 1) * 2;
                    } else {
                        this.ballVY = -this.ballVY * 0.7;
                        this.ballY += (minOverlap === overlapTop ? -1 : 1) * 2;
                    }
                }
            }

            // Canvas edge bounce
            if (this.ballX - this.ballRadius < 0) { this.ballX = this.ballRadius; this.ballVX = -this.ballVX * 0.7; }
            if (this.ballX + this.ballRadius > this.W) { this.ballX = this.W - this.ballRadius; this.ballVX = -this.ballVX * 0.7; }
            if (this.ballY - this.ballRadius < 0) { this.ballY = this.ballRadius; this.ballVY = -this.ballVY * 0.7; }
            if (this.ballY + this.ballRadius > this.H) { this.ballY = this.H - this.ballRadius; this.ballVY = -this.ballVY * 0.7; }

            // Friction
            const fric = inSand ? 0.96 : this.friction;
            this.ballVX *= Math.pow(fric, dt);
            this.ballVY *= Math.pow(fric, dt);

            // Check hole
            const hDist = Math.sqrt(Math.pow(this.ballX - this.holeX, 2) + Math.pow(this.ballY - this.holeY, 2));
            const ballSpeed = Math.sqrt(this.ballVX * this.ballVX + this.ballVY * this.ballVY);
            if (hDist < this.holeRadius && ballSpeed < 6) {
                // Ball sinks!
                this.state = 'sinking';
                this.sinkAnim = 0;
                this.ballVX = 0; this.ballVY = 0;
                this.spawnParticles(this.holeX, this.holeY, '#ffd700', 25);
            } else if (hDist < this.holeRadius + 5 && ballSpeed < 3) {
                // Gravity pull toward hole
                const pullForce = 0.15;
                this.ballVX += (this.holeX - this.ballX) * pullForce * dt / Math.max(hDist, 1);
                this.ballVY += (this.holeY - this.ballY) * pullForce * dt / Math.max(hDist, 1);
            }

            // Ball stopped
            if (ballSpeed < 0.08) {
                this.ballVX = 0; this.ballVY = 0;
                this.state = 'aiming';
            }
        }
    }

    render() {
        const {ctx, W, H} = this;

        // Green background
        ctx.fillStyle = '#2d8a2d';
        ctx.fillRect(0, 0, W, H);

        // Subtle grass texture
        ctx.fillStyle = '#338833';
        for (let x = 0; x < W; x += 10) {
            for (let y = 0; y < H; y += 10) {
                if ((x + y) % 20 === 0) ctx.fillRect(x, y, 10, 10);
            }
        }

        // Sand traps
        for (const s of this.sandTraps) {
            const sandGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
            sandGrad.addColorStop(0, '#f0d890');
            sandGrad.addColorStop(0.7, '#dcc070');
            sandGrad.addColorStop(1, '#c0a850');
            ctx.fillStyle = sandGrad;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
            // Sand dots
            ctx.fillStyle = '#c8b060';
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(s.x + Math.cos(a) * s.r * 0.5, s.y + Math.sin(a) * s.r * 0.5, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Water hazards
        for (const w of this.waterHazards) {
            const waterGrad = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r);
            waterGrad.addColorStop(0, '#2080cc');
            waterGrad.addColorStop(0.7, '#1868a8');
            waterGrad.addColorStop(1, '#105088');
            ctx.fillStyle = waterGrad;
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
            ctx.fill();
            // Shimmer
            ctx.fillStyle = '#ffffff22';
            const shimT = performance.now() / 1000;
            ctx.beginPath();
            ctx.ellipse(w.x + Math.sin(shimT) * 5, w.y - 5, w.r * 0.3, w.r * 0.15, 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Walls
        for (const wall of this.walls) {
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
            ctx.fillStyle = '#7a5a2a';
            ctx.fillRect(wall.x + 2, wall.y + 2, wall.w - 4, wall.h - 4);
        }

        // Hole
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(this.holeX, this.holeY, this.holeRadius, 0, Math.PI * 2);
        ctx.fill();
        // Hole rim
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.holeX, this.holeY, this.holeRadius, 0, Math.PI * 2);
        ctx.stroke();
        // Flag
        ctx.fillStyle = '#888';
        ctx.fillRect(this.holeX + this.holeRadius, this.holeY - 50, 2, 50);
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.moveTo(this.holeX + this.holeRadius + 2, this.holeY - 50);
        ctx.lineTo(this.holeX + this.holeRadius + 25, this.holeY - 42);
        ctx.lineTo(this.holeX + this.holeRadius + 2, this.holeY - 34);
        ctx.closePath();
        ctx.fill();

        // Ball (with sink animation)
        if (this.state === 'sinking') {
            const scale = 1 - this.sinkAnim;
            if (scale > 0) {
                ctx.save();
                ctx.translate(this.holeX, this.holeY);
                ctx.scale(scale, scale);
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(0, 0, this.ballRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        } else {
            // Ball shadow
            ctx.fillStyle = '#0003';
            ctx.beginPath();
            ctx.ellipse(this.ballX + 2, this.ballY + 2, this.ballRadius, this.ballRadius * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            // Ball
            const ballGrad = ctx.createRadialGradient(this.ballX - 2, this.ballY - 2, 1, this.ballX, this.ballY, this.ballRadius);
            ballGrad.addColorStop(0, '#ffffff');
            ballGrad.addColorStop(1, '#cccccc');
            ctx.fillStyle = ballGrad;
            ctx.beginPath();
            ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Aim indicator
        if (this.dragging && this.dragStart && this.dragEnd) {
            const dx = this.dragStart.x - this.dragEnd.x;
            const dy = this.dragStart.y - this.dragEnd.y;
            const power = Math.min(Math.sqrt(dx*dx+dy*dy), 180);
            const angle = Math.atan2(dy, dx);

            // Dotted trajectory preview
            ctx.fillStyle = '#fff8';
            for (let i = 0; i < 8; i++) {
                const t = (i + 1) * 12;
                const px = this.ballX + Math.cos(angle) * t;
                const py = this.ballY + Math.sin(angle) * t;
                ctx.globalAlpha = (1 - i / 8) * 0.6;
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // Power indicator circle
            ctx.strokeStyle = power > 130 ? '#ff4444' : power > 80 ? '#ffd700' : '#4fc3f7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.ballX, this.ballY, power * 0.15 + 10, 0, Math.PI * 2);
            ctx.stroke();

            // Power text
            this.text(Math.round(power / 180 * 100) + '%', this.ballX, this.ballY + 25, 12, '#fff');
        }

        // Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // HUD
        ctx.fillStyle = '#0008';
        ctx.fillRect(0, 0, W, 55);
        this.text(`Hole ${this.currentHole + 1}/${this.totalHoles}`, W / 2, 22, 18, '#fff');
        this.text(`Par ${this.par[this.currentHole]} | Strokes: ${this.strokes}`, W / 2, 44, 14, '#ccc');
        this.text(`Score: ${this.score}`, 80, 22, 16, '#ffd700');
        this.text(`Total: ${this.totalStrokes}`, 80, 44, 14, '#aaa');

        // Scorecard mini
        if (this.holeScores.length > 0) {
            const startX = W - 30 * Math.min(this.holeScores.length, 9) - 10;
            for (let i = 0; i < this.holeScores.length; i++) {
                const x = startX + i * 30;
                const diff = this.holeScores[i] - this.par[i];
                const color = diff < 0 ? '#4caf50' : diff === 0 ? '#fff' : '#f44336';
                ctx.fillStyle = '#0006';
                ctx.fillRect(x, 5, 26, 45);
                this.text(String(i+1), x + 13, 20, 10, '#888');
                this.text(String(this.holeScores[i]), x + 13, 40, 14, color);
            }
        }

        // Message
        if (this.messageTimer > 0 && this.message) {
            ctx.globalAlpha = Math.min(1, this.messageTimer / 20);
            const isGood = this.message.includes('EAGLE') || this.message.includes('BIRDIE') || this.message.includes('HOLE IN ONE') || this.message.includes('ALBATROSS');
            ctx.fillStyle = isGood ? '#ffd700' : this.message.includes('WATER') ? '#4fc3f7' : '#fff';
            ctx.font = `bold 26px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(this.message, W / 2, H / 2);
            ctx.globalAlpha = 1;
        }

        // Instructions
        if (this.state === 'aiming' && this.totalStrokes === 0 && this.strokes === 0) {
            this.text('Click & drag ball to putt!', W / 2, H - 20, 14, '#aaa');
        }
    }
}

// 4. TABLE TENNIS
class TableTennisGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.W = W; this.H = H;

        // Table dimensions
        this.tableMargin = 30;
        this.netY = H / 2;

        // Paddles
        this.paddleW = 60; this.paddleH = 12;
        this.playerX = W / 2; this.playerY = H - 60;
        this.aiX = W / 2; this.aiY = 60;
        this.aiSpeed = 3;

        // Ball
        this.ballRadius = 6;
        this.resetBall(1);

        // Scores
        this.playerScore = 0; this.aiScore = 0;
        this.winScore = 11;
        this.serving = 'player'; this.serveCount = 0;

        // Mouse tracking
        this.mouseX = W / 2; this.mouseY = H - 60;

        // Particles
        this.particles = [];
        this.message = ''; this.messageTimer = 0;

        // Spin visual
        this.lastHitSpin = 0;

        // Trail
        this.trail = [];

        this.listenMouse('mousemove', e => {
            const r = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - r.left;
            this.mouseY = e.clientY - r.top;
        });

        this.lastTime = performance.now();
        this.ui.innerHTML = '';
        this.loop();
    }

    resetBall(dir) {
        this.ballX = this.W / 2;
        this.ballY = this.H / 2;
        this.ballVX = (Math.random() - 0.5) * 3;
        this.ballVY = 4 * dir;
        this.ballSpin = 0;
        this.ballSpeedMult = 1;
        this.trail = [];
        this.rallyCount = 0;
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 1, decay: 0.03 + Math.random() * 0.02, color, size: 2 + Math.random() * 3
            });
        }
    }

    update() {
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 16.67, 3);
        this.lastTime = now;

        // Particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.life -= p.decay * dt;
            return p.life > 0;
        });

        if (this.messageTimer > 0) this.messageTimer -= dt;

        // Trail
        this.trail.push({x: this.ballX, y: this.ballY, life: 1});
        this.trail = this.trail.filter(t => { t.life -= 0.06 * dt; return t.life > 0; });

        // Player paddle follows mouse (constrained to bottom half)
        const targetPX = Math.max(this.tableMargin + this.paddleW/2, Math.min(this.W - this.tableMargin - this.paddleW/2, this.mouseX));
        const targetPY = Math.max(this.H / 2 + 40, Math.min(this.H - 30, this.mouseY));
        this.playerX += (targetPX - this.playerX) * 0.3 * dt;
        this.playerY += (targetPY - this.playerY) * 0.3 * dt;

        // AI paddle
        const aiTargetX = this.ballX + this.ballVX * 5 + (Math.random() - 0.5) * 15;
        const aiClamp = Math.max(this.tableMargin + this.paddleW/2, Math.min(this.W - this.tableMargin - this.paddleW/2, aiTargetX));
        const aiDiff = aiClamp - this.aiX;
        this.aiX += Math.sign(aiDiff) * Math.min(Math.abs(aiDiff), this.aiSpeed * dt);

        // Ball movement
        this.ballX += (this.ballVX + this.ballSpin * 0.3) * dt;
        this.ballY += this.ballVY * dt;

        // Side wall bounce
        if (this.ballX - this.ballRadius < this.tableMargin) {
            this.ballX = this.tableMargin + this.ballRadius;
            this.ballVX = -this.ballVX * 0.9;
            this.ballSpin *= -0.5;
            this.spawnParticles(this.ballX, this.ballY, '#ffd700', 5);
        }
        if (this.ballX + this.ballRadius > this.W - this.tableMargin) {
            this.ballX = this.W - this.tableMargin - this.ballRadius;
            this.ballVX = -this.ballVX * 0.9;
            this.ballSpin *= -0.5;
            this.spawnParticles(this.ballX, this.ballY, '#ffd700', 5);
        }

        // Player paddle collision
        if (this.ballVY > 0 &&
            this.ballY + this.ballRadius >= this.playerY - this.paddleH/2 &&
            this.ballY - this.ballRadius <= this.playerY + this.paddleH/2 &&
            this.ballX >= this.playerX - this.paddleW/2 - 5 &&
            this.ballX <= this.playerX + this.paddleW/2 + 5) {
            // Hit!
            this.rallyCount++;
            const hitOffset = (this.ballX - this.playerX) / (this.paddleW / 2);
            this.ballSpin = hitOffset * 3;
            this.ballVX = hitOffset * 4 + (this.playerX - this.lastPlayerX || 0) * 0.3;
            this.ballVY = -(Math.abs(this.ballVY) + 0.2) * this.ballSpeedMult;
            this.ballSpeedMult = Math.min(1.8, this.ballSpeedMult + 0.02);
            this.ballY = this.playerY - this.paddleH/2 - this.ballRadius;
            this.lastHitSpin = this.ballSpin;
            this.spawnParticles(this.ballX, this.ballY, '#4fc3f7', 8);
        }

        // AI paddle collision
        if (this.ballVY < 0 &&
            this.ballY - this.ballRadius <= this.aiY + this.paddleH/2 &&
            this.ballY + this.ballRadius >= this.aiY - this.paddleH/2 &&
            this.ballX >= this.aiX - this.paddleW/2 - 5 &&
            this.ballX <= this.aiX + this.paddleW/2 + 5) {
            this.rallyCount++;
            const hitOffset = (this.ballX - this.aiX) / (this.paddleW / 2);
            this.ballSpin = hitOffset * 2.5;
            this.ballVX = hitOffset * 3.5;
            this.ballVY = (Math.abs(this.ballVY) + 0.2) * this.ballSpeedMult;
            this.ballSpeedMult = Math.min(1.8, this.ballSpeedMult + 0.02);
            this.ballY = this.aiY + this.paddleH/2 + this.ballRadius;
            this.spawnParticles(this.ballX, this.ballY, '#ff6644', 8);
        }

        this.lastPlayerX = this.playerX;

        // Scoring
        if (this.ballY > this.H + 20) {
            // AI scores
            this.aiScore++;
            this.spawnParticles(this.ballX, this.H, '#ff4444', 15);
            this.message = this.rallyCount > 5 ? `Rally of ${this.rallyCount}!` : '';
            if (this.message) this.messageTimer = 40;
            this.checkWin(-1);
        }
        if (this.ballY < -20) {
            // Player scores
            this.playerScore++;
            const points = 10 + this.rallyCount * 5;
            this.setScore(this.score + points);
            this.spawnParticles(this.ballX, 0, '#4caf50', 15);
            if (this.rallyCount > 5) {
                this.message = `Rally of ${this.rallyCount}! +${points}`;
                this.messageTimer = 40;
            }
            this.checkWin(1);
        }
    }

    checkWin(lastScoreDir) {
        if (this.playerScore >= this.winScore && this.playerScore - this.aiScore >= 2) {
            this.endGame();
            this.showOverlay('You Win!', `${this.playerScore}-${this.aiScore} | Score: ${this.score}`);
            return;
        }
        if (this.aiScore >= this.winScore && this.aiScore - this.playerScore >= 2) {
            this.endGame();
            this.showOverlay('You Lose!', `${this.playerScore}-${this.aiScore} | Score: ${this.score}`);
            return;
        }
        // Increase AI difficulty as game progresses
        this.aiSpeed = 3 + Math.min(this.playerScore + this.aiScore, 15) * 0.2;
        this.resetBall(lastScoreDir);
    }

    render() {
        const {ctx, W, H} = this;

        // Table
        ctx.fillStyle = '#1a4a6a';
        ctx.fillRect(0, 0, W, H);

        // Table surface
        ctx.fillStyle = '#0d6a3a';
        ctx.fillRect(this.tableMargin, this.tableMargin, W - this.tableMargin * 2, H - this.tableMargin * 2);

        // Table border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.tableMargin, this.tableMargin, W - this.tableMargin * 2, H - this.tableMargin * 2);

        // Center line
        ctx.strokeStyle = '#fff8';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(this.tableMargin, H / 2);
        ctx.lineTo(W - this.tableMargin, H / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Net
        ctx.fillStyle = '#fff4';
        ctx.fillRect(this.tableMargin - 5, H / 2 - 3, W - this.tableMargin * 2 + 10, 6);
        ctx.strokeStyle = '#fff6';
        ctx.lineWidth = 1;
        for (let x = this.tableMargin; x < W - this.tableMargin; x += 12) {
            ctx.beginPath();
            ctx.moveTo(x, H / 2 - 3);
            ctx.lineTo(x, H / 2 + 3);
            ctx.stroke();
        }
        // Net posts
        ctx.fillStyle = '#ccc';
        ctx.fillRect(this.tableMargin - 8, H / 2 - 5, 8, 10);
        ctx.fillRect(W - this.tableMargin, H / 2 - 5, 8, 10);

        // Center line (vertical)
        ctx.strokeStyle = '#fff4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W / 2, this.tableMargin);
        ctx.lineTo(W / 2, H - this.tableMargin);
        ctx.stroke();

        // Trail
        this.trail.forEach(t => {
            ctx.globalAlpha = t.life * 0.3;
            ctx.fillStyle = '#ffa500';
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.ballRadius * t.life, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // AI Paddle
        ctx.save();
        ctx.translate(this.aiX, this.aiY);
        const aiGrad = ctx.createLinearGradient(-this.paddleW/2, 0, this.paddleW/2, 0);
        aiGrad.addColorStop(0, '#cc2222');
        aiGrad.addColorStop(0.5, '#ff4444');
        aiGrad.addColorStop(1, '#cc2222');
        ctx.fillStyle = aiGrad;
        this.roundRect(ctx, -this.paddleW/2, -this.paddleH/2, this.paddleW, this.paddleH, 4);
        ctx.fill();
        // Handle
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-3, this.paddleH/2, 6, 8);
        ctx.restore();

        // Player Paddle
        ctx.save();
        ctx.translate(this.playerX, this.playerY);
        const pGrad = ctx.createLinearGradient(-this.paddleW/2, 0, this.paddleW/2, 0);
        pGrad.addColorStop(0, '#2255cc');
        pGrad.addColorStop(0.5, '#4488ff');
        pGrad.addColorStop(1, '#2255cc');
        ctx.fillStyle = pGrad;
        this.roundRect(ctx, -this.paddleW/2, -this.paddleH/2, this.paddleW, this.paddleH, 4);
        ctx.fill();
        // Handle
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-3, -this.paddleH/2 - 8, 6, 8);
        ctx.restore();

        // Ball shadow
        ctx.fillStyle = '#0003';
        ctx.beginPath();
        ctx.ellipse(this.ballX + 2, this.ballY + 2, this.ballRadius, this.ballRadius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ball
        const ballGrad = ctx.createRadialGradient(this.ballX - 2, this.ballY - 2, 1, this.ballX, this.ballY, this.ballRadius);
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.5, '#ff8800');
        ballGrad.addColorStop(1, '#cc5500');
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
        ctx.fill();

        // Spin indicator on ball
        if (Math.abs(this.ballSpin) > 0.5) {
            ctx.strokeStyle = '#fff8';
            ctx.lineWidth = 1;
            const spinAngle = this.ballSpin > 0 ? 0.3 : -0.3;
            ctx.beginPath();
            ctx.arc(this.ballX, this.ballY, this.ballRadius + 3, -spinAngle, spinAngle);
            ctx.stroke();
        }

        // Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Rally counter
        if (this.rallyCount > 3) {
            const pulse = 1 + Math.sin(performance.now() / 200) * 0.1;
            ctx.save();
            ctx.translate(W / 2, H / 2);
            ctx.scale(pulse, pulse);
            ctx.fillStyle = '#ffd70088';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Rally: ${this.rallyCount}`, 0, 0);
            ctx.restore();
        }

        // Score display
        ctx.fillStyle = '#0006';
        ctx.fillRect(W / 2 - 60, H / 2 - 35, 120, 26);
        this.text(`${this.aiScore}`, W / 2 - 25, H / 2 - 16, 18, '#ff6644');
        this.text(`-`, W / 2, H / 2 - 16, 18, '#fff');
        this.text(`${this.playerScore}`, W / 2 + 25, H / 2 - 16, 18, '#4488ff');

        // HUD
        this.text(`Score: ${this.score}`, W / 2, 18, 16, '#ffd700');
        this.text('AI', W / 2, 45, 12, '#ff6644');
        this.text('YOU', W / 2, H - 18, 12, '#4488ff');

        // Speed indicator
        const speed = Math.sqrt(this.ballVX * this.ballVX + this.ballVY * this.ballVY);
        if (speed > 6) {
            this.text('FAST!', W - 50, H / 2, 14, `rgba(255,100,0,${Math.min(1, (speed-6)/4)})`);
        }

        // Message
        if (this.messageTimer > 0 && this.message) {
            ctx.globalAlpha = Math.min(1, this.messageTimer / 15);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.message, W / 2, H / 2 + 40);
            ctx.globalAlpha = 1;
        }

        // First-time instructions
        if (this.playerScore === 0 && this.aiScore === 0 && this.rallyCount === 0) {
            this.text('Move mouse to control paddle', W / 2, H - 35, 13, '#aaa');
        }
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}

// Register sports games
Portal.register({id:'basketball',name:'Basketball Hoops',category:'sports',icon:'\u{1F3C0}',color:'linear-gradient(135deg,#4a2a0a,#8a5a1a)',Game:BasketballHoopsGame,canvasWidth:700,canvasHeight:500,tags:['basketball','hoops','shooting']});
Portal.register({id:'soccer',name:'Soccer Kick',category:'sports',icon:'\u26BD',color:'linear-gradient(135deg,#0a3a0a,#1a6a1a)',Game:SoccerKickGame,canvasWidth:700,canvasHeight:500,tags:['soccer','penalty','football']});
Portal.register({id:'golf',name:'Golf',category:'sports',icon:'\u26F3',color:'linear-gradient(135deg,#1a4a1a,#3a8a3a)',Game:GolfGame,canvasWidth:700,canvasHeight:600,tags:['golf','minigolf','putt']});
Portal.register({id:'tabletennis',name:'Table Tennis',category:'sports',icon:'\u{1F3D3}',color:'linear-gradient(135deg,#0a2a3a,#1a5a6a)',Game:TableTennisGame,canvasWidth:600,canvasHeight:700,tags:['pingpong','tennis','paddle']});
