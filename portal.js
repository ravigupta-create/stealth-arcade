/* === GameVault Portal === */
const SFX = {
    ctx: null, muted: true,
    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    play(type) {
        if (this.muted || !this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        g.gain.value = 0.1;
        const t = this.ctx.currentTime;
        switch(type) {
            case 'click':
                o.frequency.value = 600; o.type = 'sine';
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                o.start(t); o.stop(t + 0.1); break;
            case 'launch':
                o.frequency.value = 400; o.type = 'square';
                o.frequency.exponentialRampToValueAtTime(800, t + 0.15);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                o.start(t); o.stop(t + 0.2); break;
            case 'back':
                o.frequency.value = 500; o.type = 'sine';
                o.frequency.exponentialRampToValueAtTime(300, t + 0.1);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                o.start(t); o.stop(t + 0.15); break;
            case 'fav':
                o.frequency.value = 523; o.type = 'triangle';
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                o.start(t); o.stop(t + 0.15);
                const o2 = this.ctx.createOscillator();
                const g2 = this.ctx.createGain();
                o2.connect(g2); g2.connect(this.ctx.destination);
                o2.frequency.value = 659; o2.type = 'triangle'; g2.gain.value = 0.1;
                g2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                o2.start(t + 0.1); o2.stop(t + 0.25); break;
            case 'score':
                o.frequency.value = 800; o.type = 'sine';
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
                o.start(t); o.stop(t + 0.08); break;
            case 'gameover':
                o.frequency.value = 400; o.type = 'sawtooth'; g.gain.value = 0.08;
                o.frequency.exponentialRampToValueAtTime(100, t + 0.5);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
                o.start(t); o.stop(t + 0.6); break;
        }
    }
};

const Portal = {
    games: [],
    favorites: JSON.parse(localStorage.getItem('gv-favs') || '[]'),
    recent: JSON.parse(localStorage.getItem('gv-recent') || '[]'),
    highScores: JSON.parse(localStorage.getItem('gv-scores') || '{}'),
    stats: JSON.parse(localStorage.getItem('gv-stats') || '{"gamesPlayed":0,"totalTime":0,"streak":0,"lastDate":"","bestStreak":0}'),
    currentGame: null,
    currentCategory: 'all',
    panicMode: false,
    carouselIdx: 0,
    gameStartTime: 0,

    checkAuth() {
        if (sessionStorage.getItem('gv-auth') === '1') return true;
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('portal').classList.add('hidden');
        return false;
    },

    initLogin() {
        const loginBtn = document.getElementById('login-btn');
        const passInput = document.getElementById('login-pass');
        const errorEl = document.getElementById('login-error');

        const doLogin = () => {
            if (passInput.value === 'srg213') {
                sessionStorage.setItem('gv-auth', '1');
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('portal').classList.remove('hidden');
                this.init();
            } else {
                errorEl.textContent = 'Wrong password. Try again.';
                errorEl.style.display = 'block';
                passInput.value = '';
                passInput.focus();
            }
        };

        loginBtn.addEventListener('click', doLogin);
        passInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
        passInput.focus();
    },

    init() {
        this.grid = document.getElementById('game-grid');
        this.searchInput = document.getElementById('search-input');
        this.panicScreen = document.getElementById('panic-screen');
        this.portalEl = document.getElementById('portal');
        this.playerEl = document.getElementById('game-player');
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameUI = document.getElementById('game-ui');
        this.gameTitleEl = document.getElementById('game-title');
        this.scoreDisplay = document.getElementById('game-score-display');
        this.highScoreDisplay = document.getElementById('game-high-score-display');

        SFX.init();

        this.bindEvents();
        this.updateFooter();
        this.updateStreak();
        this.renderCarousel();
        this.renderStats();
        this.renderGrid();
        this.startCarouselAuto();
    },

    register(game) {
        this.games.push(game);
    },

    updateFooter() {
        const footer = document.getElementById('portal-footer');
        if (footer) footer.innerHTML = `<span>GameVault &mdash; ${this.games.length} Games, Zero Ads, 100% Free</span>`;
    },

    updateStreak() {
        const today = new Date().toISOString().slice(0, 10);
        if (this.stats.lastDate === today) return;
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (this.stats.lastDate === yesterday) {
            // streak continues on next play
        } else if (this.stats.lastDate && this.stats.lastDate !== today) {
            this.stats.streak = 0;
        }
    },

    recordPlay(duration) {
        const today = new Date().toISOString().slice(0, 10);
        this.stats.gamesPlayed++;
        this.stats.totalTime += duration;
        if (this.stats.lastDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            if (this.stats.lastDate === yesterday || !this.stats.lastDate) {
                this.stats.streak++;
            } else {
                this.stats.streak = 1;
            }
            this.stats.lastDate = today;
        }
        if (this.stats.streak > this.stats.bestStreak) this.stats.bestStreak = this.stats.streak;
        localStorage.setItem('gv-stats', JSON.stringify(this.stats));
    },

    renderStats() {
        const el = document.getElementById('stats-dashboard');
        if (!el) return;
        const totalMin = Math.floor(this.stats.totalTime / 60);
        const hsCount = Object.keys(this.highScores).length;
        el.innerHTML = `
            <div class="stat-card"><span class="stat-num">${this.stats.gamesPlayed}</span><span class="stat-label">Games Played</span></div>
            <div class="stat-card"><span class="stat-num">${totalMin}m</span><span class="stat-label">Time Played</span></div>
            <div class="stat-card"><span class="stat-num">${hsCount}</span><span class="stat-label">High Scores</span></div>
            <div class="stat-card"><span class="stat-num">${this.stats.streak}🔥</span><span class="stat-label">Day Streak</span></div>
        `;
    },

    renderCarousel() {
        const el = document.getElementById('featured-carousel');
        if (!el || this.games.length === 0) return;
        const featured = this.games.slice(0, 8);
        el.innerHTML = `
            <button class="carousel-arrow left" id="carousel-left">&#8249;</button>
            <div class="carousel-track" id="carousel-track">
                ${featured.map(g => `
                    <div class="carousel-card" data-id="${g.id}" style="background:${g.color}">
                        <div class="carousel-icon">${g.icon}</div>
                        <div class="carousel-name">${g.name}</div>
                        <div class="carousel-cat">${g.category}</div>
                    </div>
                `).join('')}
            </div>
            <button class="carousel-arrow right" id="carousel-right">&#8250;</button>
        `;

        document.getElementById('carousel-left').addEventListener('click', () => this.moveCarousel(-1));
        document.getElementById('carousel-right').addEventListener('click', () => this.moveCarousel(1));
        el.querySelectorAll('.carousel-card').forEach(c => {
            c.addEventListener('click', () => { SFX.play('launch'); this.launchGame(c.dataset.id); });
        });
    },

    moveCarousel(dir) {
        const track = document.getElementById('carousel-track');
        if (!track) return;
        const cardW = 220;
        this.carouselIdx = Math.max(0, Math.min(this.carouselIdx + dir, Math.max(0, 8 - 3)));
        track.style.transform = `translateX(-${this.carouselIdx * cardW}px)`;
    },

    startCarouselAuto() {
        setInterval(() => {
            if (!this.currentGame && !this.panicMode) {
                const track = document.getElementById('carousel-track');
                if (!track) return;
                this.carouselIdx = (this.carouselIdx + 1) % Math.max(1, 8 - 2);
                track.style.transform = `translateX(-${this.carouselIdx * 220}px)`;
            }
        }, 4000);
    },

    bindEvents() {
        // Search
        this.searchInput.addEventListener('input', () => this.renderGrid());

        // Categories
        document.querySelectorAll('.cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                SFX.play('click');
                document.querySelector('.cat-btn.active').classList.remove('active');
                btn.classList.add('active');
                this.currentCategory = btn.dataset.cat;
                this.renderGrid();
            });
        });

        // Back button
        document.getElementById('back-btn').addEventListener('click', () => { SFX.play('back'); this.closeGame(); });

        // Restart button
        document.getElementById('restart-btn').addEventListener('click', () => {
            if (this.currentGame) {
                this.currentGame.instance.stop();
                this.launchGame(this.currentGame.id);
            }
        });

        // Fullscreen
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                this.playerEl.requestFullscreen().catch(() => {});
            }
        });

        // Panic mode (backtick or Escape)
        document.addEventListener('keydown', (e) => {
            if (e.key === '`' || (e.key === 'Escape' && !this.currentGame)) {
                e.preventDefault();
                this.togglePanic();
            } else if (e.key === 'Escape' && this.currentGame && !this.panicMode) {
                this.closeGame();
            }
        });

        // Stealth hint click
        document.querySelector('.stealth-hint').addEventListener('click', () => this.togglePanic());

        // Sound toggle
        const soundBtn = document.getElementById('sound-toggle');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                SFX.muted = !SFX.muted;
                soundBtn.textContent = SFX.muted ? '🔇' : '🔊';
                soundBtn.title = SFX.muted ? 'Unmute sounds' : 'Mute sounds';
                if (!SFX.muted) SFX.play('click');
            });
        }
    },

    togglePanic() {
        this.panicMode = !this.panicMode;
        if (this.panicMode) {
            this.panicScreen.classList.remove('hidden');
            this.portalEl.classList.add('hidden');
            this.playerEl.classList.add('hidden');

            document.title = 'Inbox (3) - MailBox';
            if (this.currentGame && this.currentGame.instance) {
                this.currentGame.instance.stop();
            }
        } else {
            this.panicScreen.classList.add('hidden');

            if (this.currentGame) {
                this.playerEl.classList.remove('hidden');
                this.currentGame.instance.start();
            } else {
                this.portalEl.classList.remove('hidden');
            }
            document.title = 'Inbox (3) - MailBox';
        }
    },

    getFilteredGames() {
        let list = this.games;
        const query = this.searchInput.value.toLowerCase().trim();
        const cat = this.currentCategory;

        if (cat === 'favorites') {
            list = list.filter(g => this.favorites.includes(g.id));
        } else if (cat === 'recent') {
            const recentIds = this.recent;
            list = list.filter(g => recentIds.includes(g.id));
            list.sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));
        } else if (cat !== 'all') {
            list = list.filter(g => g.category === cat);
        }

        if (query) {
            list = list.filter(g =>
                g.name.toLowerCase().includes(query) ||
                g.category.toLowerCase().includes(query) ||
                (g.tags && g.tags.some(t => t.includes(query)))
            );
        }

        return list;
    },

    renderGrid() {
        const games = this.getFilteredGames();
        if (games.length === 0) {
            this.grid.innerHTML = '<div class="no-results">No games found. Try a different search or category.</div>';
            return;
        }

        this.grid.innerHTML = games.map(g => `
            <div class="game-card" data-id="${g.id}">
                <button class="card-fav ${this.favorites.includes(g.id) ? 'active' : ''}" data-fav="${g.id}" title="Favorite">
                    ${this.favorites.includes(g.id) ? '&#9733;' : '&#9734;'}
                </button>
                <div class="card-thumb" style="background: ${g.color}">${g.icon}</div>
                <div class="card-info">
                    <span class="card-name">${g.name}</span>
                    <span class="card-cat">${g.category}</span>
                </div>
            </div>
        `).join('');

        // Card click to launch
        this.grid.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.card-fav')) return;
                SFX.play('launch');
                this.launchGame(card.dataset.id);
            });
        });

        // Favorite toggle
        this.grid.querySelectorAll('.card-fav').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                SFX.play('fav');
                const id = btn.dataset.fav;
                if (this.favorites.includes(id)) {
                    this.favorites = this.favorites.filter(f => f !== id);
                } else {
                    this.favorites.push(id);
                }
                localStorage.setItem('gv-favs', JSON.stringify(this.favorites));
                this.renderGrid();
            });
        });
    },

    launchGame(id) {
        const gameDef = this.games.find(g => g.id === id);
        if (!gameDef) return;

        // Add to recent
        this.recent = this.recent.filter(r => r !== id);
        this.recent.unshift(id);
        if (this.recent.length > 20) this.recent.pop();
        localStorage.setItem('gv-recent', JSON.stringify(this.recent));

        // Track time
        this.gameStartTime = Date.now();

        // Setup UI
        this.portalEl.classList.add('hidden');
        this.playerEl.classList.remove('hidden');
        this.gameTitleEl.textContent = gameDef.name;
        this.gameUI.innerHTML = '';

        // Set canvas size
        const cw = gameDef.canvasWidth || 800;
        const ch = gameDef.canvasHeight || 600;
        this.canvas.width = cw;
        this.canvas.height = ch;
        this.canvas.style.display = gameDef.useHTML ? 'none' : 'block';

        // Update scores display
        this.updateScoreDisplay(id, 0);

        // Instantiate and start game
        const instance = new gameDef.Game(this.canvas, this.ctx, this.gameUI, {
            setScore: (s) => { this.updateScoreDisplay(id, s); SFX.play('score'); },
            gameOver: (score) => { SFX.play('gameover'); this.onGameOver(id, score); },
            setTitle: (t) => this.gameTitleEl.textContent = t
        });
        this.currentGame = { id, instance, def: gameDef };
        instance.start();
    },

    updateScoreDisplay(id, score) {
        const hs = this.highScores[id] || 0;
        this.scoreDisplay.innerHTML = `Score: <span>${score}</span>`;
        this.highScoreDisplay.innerHTML = `Best: <span>${hs}</span>`;
    },

    onGameOver(id, score) {
        const hs = this.highScores[id] || 0;
        if (score > hs) {
            this.highScores[id] = score;
            localStorage.setItem('gv-scores', JSON.stringify(this.highScores));
        }
        this.updateScoreDisplay(id, score);
        // Record play duration
        const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
        this.recordPlay(duration);
        this.renderStats();
    },

    closeGame() {
        if (this.currentGame && this.currentGame.instance) {
            this.currentGame.instance.stop();
            // Record play if closing before game over
            const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
            if (duration > 2) this.recordPlay(duration);
        }
        this.currentGame = null;
        this.playerEl.classList.add('hidden');
        this.portalEl.classList.remove('hidden');
        this.gameUI.innerHTML = '';
        this.renderStats();
        this.renderGrid();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (Portal.checkAuth()) {
            Portal.init();
        } else {
            Portal.initLogin();
        }
    }, 0);
});
