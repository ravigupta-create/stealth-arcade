/* === GameVault Portal === */
const Portal = {
    games: [],
    favorites: JSON.parse(localStorage.getItem('gv-favs') || '[]'),
    recent: JSON.parse(localStorage.getItem('gv-recent') || '[]'),
    highScores: JSON.parse(localStorage.getItem('gv-scores') || '{}'),
    currentGame: null,
    currentCategory: 'all',
    panicMode: false,

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

        this.bindEvents();
        this.renderGrid();
    },

    register(game) {
        this.games.push(game);
    },

    bindEvents() {
        // Search
        this.searchInput.addEventListener('input', () => this.renderGrid());

        // Categories
        document.querySelectorAll('.cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.cat-btn.active').classList.remove('active');
                btn.classList.add('active');
                this.currentCategory = btn.dataset.cat;
                this.renderGrid();
            });
        });

        // Back button
        document.getElementById('back-btn').addEventListener('click', () => this.closeGame());

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
    },

    togglePanic() {
        this.panicMode = !this.panicMode;
        if (this.panicMode) {
            this.panicScreen.classList.remove('hidden');
            this.portalEl.classList.add('hidden');
            this.playerEl.classList.add('hidden');
            document.title = 'Inbox (3) - user@gmail.com - Gmail';
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
            document.title = 'Inbox (3) - user@gmail.com - Gmail';
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
                this.launchGame(card.dataset.id);
            });
        });

        // Favorite toggle
        this.grid.querySelectorAll('.card-fav').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
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
            setScore: (s) => this.updateScoreDisplay(id, s),
            gameOver: (score) => this.onGameOver(id, score),
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
    },

    closeGame() {
        if (this.currentGame && this.currentGame.instance) {
            this.currentGame.instance.stop();
        }
        this.currentGame = null;
        this.playerEl.classList.add('hidden');
        this.portalEl.classList.remove('hidden');
        this.gameUI.innerHTML = '';
        this.renderGrid();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Wait for games.js to register all games, then init portal
    setTimeout(() => Portal.init(), 0);
});
