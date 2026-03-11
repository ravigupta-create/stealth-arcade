/* === WORD GAMES (5) === */

// 17. WORD GUESS (Wordle-like)
class WordGuessGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.target = randChoice(WORDS5).toUpperCase();
        this.guesses = []; this.currentGuess = ''; this.maxGuesses = 6;
        this.keyStates = {}; this.dead = false; this.won = false; this.message = '';
        this.listenKey(e => {
            if (this.dead) return;
            if (e.key === 'Enter') this.submitGuess();
            else if (e.key === 'Backspace') this.currentGuess = this.currentGuess.slice(0, -1);
            else if (/^[a-zA-Z]$/.test(e.key) && this.currentGuess.length < 5) this.currentGuess += e.key.toUpperCase();
        });
        this.ui.innerHTML = ''; this.loop();
    }
    submitGuess() {
        if (this.currentGuess.length !== 5) { this.message = 'Need 5 letters'; this.addTimeout(() => this.message = '', 1500); return; }
        const guess = this.currentGuess;
        const result = this.evaluate(guess);
        this.guesses.push({word: guess, result});
        // Update key states
        for (let i = 0; i < 5; i++) {
            const letter = guess[i], state = result[i];
            if (state === 'correct') this.keyStates[letter] = 'correct';
            else if (state === 'present' && this.keyStates[letter] !== 'correct') this.keyStates[letter] = 'present';
            else if (!this.keyStates[letter]) this.keyStates[letter] = 'absent';
        }
        if (guess === this.target) {
            this.won = true; this.dead = true;
            this.setScore((this.maxGuesses - this.guesses.length + 1) * 100);
            this.addTimeout(() => { this.endGame(); this.showOverlay('Correct!', `"${this.target}" in ${this.guesses.length} tries`); }, 500);
        } else if (this.guesses.length >= this.maxGuesses) {
            this.dead = true;
            this.addTimeout(() => { this.endGame(); this.showOverlay('Game Over', `The word was "${this.target}"`); }, 500);
        }
        this.currentGuess = '';
    }
    evaluate(guess) {
        const result = Array(5).fill('absent');
        const targetArr = this.target.split('');
        const used = Array(5).fill(false);
        // First pass: correct
        for (let i = 0; i < 5; i++) if (guess[i] === targetArr[i]) { result[i] = 'correct'; used[i] = true; }
        // Second pass: present
        for (let i = 0; i < 5; i++) {
            if (result[i] === 'correct') continue;
            for (let j = 0; j < 5; j++) {
                if (!used[j] && guess[i] === targetArr[j]) { result[i] = 'present'; used[j] = true; break; }
            }
        }
        return result;
    }
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx} = this;
        const cellW = 56, cellH = 56, gap = 6;
        const startX = (this.canvas.width - 5 * (cellW + gap)) / 2;
        const startY = 40;
        const stateColors = {correct: '#538d4e', present: '#b59f3b', absent: '#3a3a3c'};
        // Grid
        for (let r = 0; r < this.maxGuesses; r++) {
            for (let c = 0; c < 5; c++) {
                const x = startX + c * (cellW + gap), y = startY + r * (cellH + gap);
                if (r < this.guesses.length) {
                    ctx.fillStyle = stateColors[this.guesses[r].result[c]];
                    ctx.beginPath(); ctx.roundRect(x, y, cellW, cellH, 4); ctx.fill();
                    this.text(this.guesses[r].word[c], x + cellW/2, y + cellH/2 + 8, 26, '#fff');
                } else if (r === this.guesses.length) {
                    ctx.strokeStyle = this.currentGuess[c] ? '#888' : '#3a3a3c'; ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, cellW, cellH);
                    if (this.currentGuess[c]) this.text(this.currentGuess[c], x + cellW/2, y + cellH/2 + 8, 26);
                } else {
                    ctx.strokeStyle = '#3a3a3c'; ctx.lineWidth = 2; ctx.strokeRect(x, y, cellW, cellH);
                }
            }
        }
        // Keyboard
        const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
        const keyW = 36, keyH = 44, keyGap = 4;
        const ky0 = startY + this.maxGuesses * (cellH + gap) + 30;
        rows.forEach((row, ri) => {
            const kx0 = (this.canvas.width - row.length * (keyW + keyGap)) / 2;
            for (let i = 0; i < row.length; i++) {
                const letter = row[i], x = kx0 + i * (keyW + keyGap), y = ky0 + ri * (keyH + keyGap);
                const state = this.keyStates[letter];
                ctx.fillStyle = state ? stateColors[state] : '#1a1a2e';
                ctx.beginPath(); ctx.roundRect(x, y, keyW, keyH, 4); ctx.fill();
                this.text(letter, x + keyW/2, y + keyH/2 + 5, 14, '#e0e0e0');
            }
        });
        // Message
        if (this.message) this.text(this.message, this.canvas.width/2, 25, 16, '#ffd54f');
    }
}

// 18. HANGMAN
class HangmanGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.word = randChoice(WORDS_HANGMAN).toUpperCase();
        this.guessed = new Set(); this.wrong = 0; this.maxWrong = 6;
        this.dead = false; this.won = false;
        this.listenKey(e => {
            if (this.dead) return;
            const letter = e.key.toUpperCase();
            if (/^[A-Z]$/.test(letter) && !this.guessed.has(letter)) {
                this.guessed.add(letter);
                if (!this.word.includes(letter)) this.wrong++;
                if (this.wrong >= this.maxWrong) {
                    this.dead = true; this.endGame(); this.showOverlay('Game Over', `The word was "${this.word}"`);
                } else if (this.word.split('').every(l => this.guessed.has(l))) {
                    this.won = true; this.dead = true;
                    this.setScore((this.maxWrong - this.wrong) * 100 + this.word.length * 20);
                    this.endGame(); this.showOverlay('You Win!', `"${this.word}"`);
                }
            }
        });
        this.ui.innerHTML = ''; this.loop();
    }
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx} = this, W = this.canvas.width, H = this.canvas.height;
        // Gallows
        const gx = 150, gy = 100;
        ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(gx-50, gy+200); ctx.lineTo(gx+50, gy+200); ctx.stroke(); // base
        ctx.beginPath(); ctx.moveTo(gx, gy+200); ctx.lineTo(gx, gy); ctx.stroke(); // pole
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx+80, gy); ctx.stroke(); // top
        ctx.beginPath(); ctx.moveTo(gx+80, gy); ctx.lineTo(gx+80, gy+30); ctx.stroke(); // rope
        // Body parts
        ctx.strokeStyle = '#e94560'; ctx.lineWidth = 3;
        if (this.wrong >= 1) { ctx.beginPath(); ctx.arc(gx+80, gy+50, 20, 0, Math.PI*2); ctx.stroke(); } // head
        if (this.wrong >= 2) { ctx.beginPath(); ctx.moveTo(gx+80, gy+70); ctx.lineTo(gx+80, gy+130); ctx.stroke(); } // body
        if (this.wrong >= 3) { ctx.beginPath(); ctx.moveTo(gx+80, gy+85); ctx.lineTo(gx+50, gy+110); ctx.stroke(); } // left arm
        if (this.wrong >= 4) { ctx.beginPath(); ctx.moveTo(gx+80, gy+85); ctx.lineTo(gx+110, gy+110); ctx.stroke(); } // right arm
        if (this.wrong >= 5) { ctx.beginPath(); ctx.moveTo(gx+80, gy+130); ctx.lineTo(gx+55, gy+170); ctx.stroke(); } // left leg
        if (this.wrong >= 6) { ctx.beginPath(); ctx.moveTo(gx+80, gy+130); ctx.lineTo(gx+105, gy+170); ctx.stroke(); } // right leg
        // Word display
        const wordY = H - 150;
        const letterW = Math.min(40, (W - 100) / this.word.length);
        const wx = (W - this.word.length * letterW) / 2;
        for (let i = 0; i < this.word.length; i++) {
            const x = wx + i * letterW;
            ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x + 5, wordY + 35); ctx.lineTo(x + letterW - 10, wordY + 35); ctx.stroke();
            if (this.guessed.has(this.word[i])) this.text(this.word[i], x + letterW/2, wordY + 28, 24);
        }
        // Letter keyboard
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const kw = 32, kh = 36, ky = H - 80;
        for (let i = 0; i < 26; i++) {
            const row = i < 13 ? 0 : 1;
            const col = i < 13 ? i : i - 13;
            const kx = (W - 13 * kw) / 2 + col * kw;
            const letter = alphabet[i];
            ctx.fillStyle = this.guessed.has(letter) ? (this.word.includes(letter) ? '#538d4e' : '#3a3a3c') : '#1a1a2e';
            ctx.fillRect(kx + 2, ky + row * kh + 2, kw - 4, kh - 4);
            this.text(letter, kx + kw/2, ky + row * kh + kh/2 + 5, 13, this.guessed.has(letter) ? '#888' : '#e0e0e0');
        }
        this.text(`Wrong: ${this.wrong}/${this.maxWrong}`, W - 80, 30, 14);
    }
}

// 19. TYPING SPEED
class TypingSpeedGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.targetText = randChoice(TYPING_TEXTS);
        this.typed = ''; this.startTime = null; this.done = false;
        this.correct = 0; this.wrong = 0;
        this.listenKey(e => {
            if (this.done) return;
            if (!this.startTime) this.startTime = Date.now();
            if (e.key === 'Backspace') { this.typed = this.typed.slice(0, -1); return; }
            if (e.key.length !== 1) return;
            this.typed += e.key;
            if (this.typed.length >= this.targetText.length) this.finish();
        });
        this.ui.innerHTML = ''; this.loop();
    }
    finish() {
        this.done = true;
        const elapsed = (Date.now() - this.startTime) / 1000;
        const words = this.targetText.split(' ').length;
        this.wpm = Math.round(words / (elapsed / 60));
        let correct = 0;
        for (let i = 0; i < this.targetText.length; i++) if (this.typed[i] === this.targetText[i]) correct++;
        this.accuracy = Math.round(correct / this.targetText.length * 100);
        this.setScore(this.wpm * this.accuracy / 100);
        this.endGame();
        this.showOverlay('Done!', `${this.wpm} WPM | ${this.accuracy}% accuracy`);
    }
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx} = this, W = this.canvas.width, H = this.canvas.height;
        // Title
        this.text('Type the text below:', W/2, 50, 18);
        // Text display
        const fontSize = 22, lineH = 36, maxW = W - 80, startY = 100;
        ctx.font = `${fontSize}px monospace`;
        let x = 40, y = startY;
        for (let i = 0; i < this.targetText.length; i++) {
            const char = this.targetText[i];
            const w = ctx.measureText(char).width;
            if (x + w > W - 40) { x = 40; y += lineH; }
            if (i < this.typed.length) {
                ctx.fillStyle = this.typed[i] === char ? '#538d4e' : '#e94560';
            } else if (i === this.typed.length) {
                ctx.fillStyle = '#0f0f1a';
                ctx.fillRect(x - 1, y - fontSize + 4, w + 2, fontSize + 4);
                ctx.fillStyle = '#e94560';
                ctx.fillRect(x, y + 4, w, 3); // cursor
                ctx.fillStyle = '#fff';
            } else {
                ctx.fillStyle = '#666';
            }
            ctx.textAlign = 'left'; ctx.fillText(char, x, y);
            x += w;
        }
        // Stats
        if (this.startTime && !this.done) {
            const elapsed = (Date.now() - this.startTime) / 1000;
            const words = this.typed.split(' ').filter(w => w).length;
            const wpm = elapsed > 0 ? Math.round(words / (elapsed / 60)) : 0;
            this.text(`${wpm} WPM | ${Math.round(elapsed)}s`, W/2, H - 30, 16, '#4fc3f7');
        }
        if (!this.startTime) this.text('Start typing to begin...', W/2, H - 30, 14, '#555');
    }
}

// 20. ANAGRAM HUNT
class AnagramGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        // Pick a source word and find anagram-able subsets
        this.sourceWords = ['PAINTER','DETAILS','STORAGE','THINKER','MIRACLE','PLASTER','THREADS','PLANETS','DANGERS'];
        this.source = randChoice(this.sourceWords);
        this.letters = shuffle(this.source.split(''));
        this.found = []; this.current = ''; this.timeLeft = 60; this.dead = false;
        this.validWords = this.getValidWords();
        this.message = '';
        this.listenKey(e => {
            if (this.dead) return;
            if (e.key === 'Enter') this.submit();
            else if (e.key === 'Backspace') this.current = this.current.slice(0, -1);
            else if (/^[a-zA-Z]$/.test(e.key)) this.current += e.key.toUpperCase();
            e.preventDefault();
        });
        this.addInterval(() => {
            if (!this.dead && --this.timeLeft <= 0) {
                this.dead = true; this.endGame();
                this.showOverlay('Time Up!', `Found ${this.found.length}/${this.validWords.length} words | Score: ${this.score}`);
            }
        }, 1000);
        this.ui.innerHTML = ''; this.loop();
    }
    getValidWords() {
        // Simple: find 3+ letter words from WORDS5 that can be made from source letters
        const srcMap = {};
        for (const c of this.source) srcMap[c] = (srcMap[c] || 0) + 1;
        const canMake = (word) => {
            const wMap = {};
            for (const c of word) wMap[c] = (wMap[c] || 0) + 1;
            return Object.entries(wMap).every(([c, n]) => (srcMap[c] || 0) >= n);
        };
        // Use 3-5 letter subset of our word list
        return WORDS5.map(w => w.toUpperCase()).filter(w => w.length >= 3 && w.length <= this.source.length && canMake(w));
    }
    submit() {
        const word = this.current.trim();
        if (word.length < 3) { this.message = 'Min 3 letters'; }
        else if (this.found.includes(word)) { this.message = 'Already found!'; }
        else if (this.validWords.includes(word)) {
            this.found.push(word);
            const pts = word.length * 20;
            this.setScore(this.score + pts);
            this.message = `+${pts}!`;
        } else { this.message = 'Not valid'; }
        this.current = '';
        this.addTimeout(() => this.message = '', 1200);
    }
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx} = this, W = this.canvas.width, H = this.canvas.height;
        // Letters
        const lw = 50, lh = 56, gap = 8;
        const lx0 = (W - this.letters.length * (lw + gap)) / 2;
        for (let i = 0; i < this.letters.length; i++) {
            const x = lx0 + i * (lw + gap);
            ctx.fillStyle = '#16213e'; ctx.beginPath(); ctx.roundRect(x, 50, lw, lh, 8); ctx.fill();
            this.text(this.letters[i], x + lw/2, 50 + lh/2 + 8, 28, '#ffd54f');
        }
        // Current input
        ctx.fillStyle = '#1a1a2e'; ctx.beginPath(); ctx.roundRect(W/2-150, 130, 300, 44, 8); ctx.fill();
        this.text(this.current || 'Type a word...', W/2, 158, 20, this.current ? '#e0e0e0' : '#555');
        // Message
        if (this.message) this.text(this.message, W/2, 200, 18, '#ffd54f');
        // Found words
        this.text(`Found: ${this.found.length}/${this.validWords.length}`, W/2, 240, 14, '#4fc3f7');
        const cols = 4, cw = 150;
        const fx0 = (W - cols * cw) / 2;
        this.found.forEach((w, i) => {
            const col = i % cols, row = Math.floor(i / cols);
            this.text(w, fx0 + col * cw + cw/2, 270 + row * 24, 13, '#7bed9f');
        });
        // Timer
        this.text(`${this.timeLeft}s`, W - 50, 30, 20, this.timeLeft <= 10 ? '#e94560' : '#e0e0e0');
    }
}

// 21. WORD SEARCH
class WordSearchGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.size = 12; this.dead = false;
        this.wordPool = ['SNAKE','BRICK','SPACE','PIXEL','FLOOD','LIGHT','CHESS','DODGE','QUEST','MATCH','BLOCK','TOWER'];
        this.words = shuffle([...this.wordPool]).slice(0, 6);
        this.found = [];
        this.grid = Array.from({length:this.size}, () => Array(this.size).fill(''));
        this.highlights = [];
        this.placeWords();
        // Fill empty with random letters
        for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
            if (!this.grid[r][c]) this.grid[r][c] = String.fromCharCode(65 + randInt(0, 25));
        }
        this.selecting = false; this.selStart = null; this.selEnd = null;
        this.G = Math.min(Math.floor((this.canvas.width - 200) / this.size), Math.floor((this.canvas.height - 40) / this.size));
        this.ox = 20; this.oy = 20;
        this.listenMouse('mousedown', e => {
            const p = this.getCell(e);
            if (p) { this.selecting = true; this.selStart = p; this.selEnd = p; }
        });
        this.listenMouse('mousemove', e => {
            if (this.selecting) { const p = this.getCell(e); if (p) this.selEnd = p; }
        });
        this.listenMouse('mouseup', e => {
            if (this.selecting) { this.checkSelection(); this.selecting = false; this.selStart = this.selEnd = null; }
        });
        this.ui.innerHTML = ''; this.loop();
    }
    getCell(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        const c = Math.floor((mx - this.ox) / this.G), r = Math.floor((my - this.oy) / this.G);
        if (c >= 0 && c < this.size && r >= 0 && r < this.size) return {r, c};
        return null;
    }
    placeWords() {
        const dirs = [[0,1],[1,0],[1,1],[0,-1],[-1,0]];
        for (const word of this.words) {
            let placed = false;
            for (let attempt = 0; attempt < 100 && !placed; attempt++) {
                const dir = randChoice(dirs);
                const r = randInt(0, this.size-1), c = randInt(0, this.size-1);
                const endR = r + dir[0] * (word.length - 1), endC = c + dir[1] * (word.length - 1);
                if (endR < 0 || endR >= this.size || endC < 0 || endC >= this.size) continue;
                let fits = true;
                for (let i = 0; i < word.length; i++) {
                    const cell = this.grid[r + dir[0]*i][c + dir[1]*i];
                    if (cell && cell !== word[i]) { fits = false; break; }
                }
                if (fits) {
                    for (let i = 0; i < word.length; i++) this.grid[r + dir[0]*i][c + dir[1]*i] = word[i];
                    placed = true;
                }
            }
        }
    }
    checkSelection() {
        if (!this.selStart || !this.selEnd) return;
        const {r: r1, c: c1} = this.selStart, {r: r2, c: c2} = this.selEnd;
        const dr = Math.sign(r2-r1), dc = Math.sign(c2-c1);
        const len = Math.max(Math.abs(r2-r1), Math.abs(c2-c1)) + 1;
        let word = '';
        const cells = [];
        for (let i = 0; i < len; i++) { word += this.grid[r1+dr*i][c1+dc*i]; cells.push({r:r1+dr*i, c:c1+dc*i}); }
        const rev = word.split('').reverse().join('');
        const match = this.words.find(w => (w === word || w === rev) && !this.found.includes(w));
        if (match) {
            this.found.push(match);
            this.highlights.push({cells, color: `hsl(${this.found.length * 50}, 70%, 50%)`});
            this.setScore(this.score + match.length * 20);
            if (this.found.length === this.words.length) {
                this.endGame(); this.showOverlay('All Found!', `Score: ${this.score}`);
            }
        }
    }
    update() {}
    render() {
        this.clear('#0f0f1a');
        const {ctx, G, ox, oy, size} = this;
        // Highlights
        for (const h of this.highlights) {
            ctx.fillStyle = h.color; ctx.globalAlpha = 0.3;
            for (const {r,c} of h.cells) ctx.fillRect(ox+c*G, oy+r*G, G, G);
            ctx.globalAlpha = 1;
        }
        // Grid
        for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
            ctx.strokeStyle = '#1a1a2e'; ctx.strokeRect(ox+c*G, oy+r*G, G, G);
            this.text(this.grid[r][c], ox+c*G+G/2, oy+r*G+G/2+6, G*0.45, '#e0e0e0');
        }
        // Selection highlight
        if (this.selecting && this.selStart && this.selEnd) {
            const {r:r1,c:c1} = this.selStart, {r:r2,c:c2} = this.selEnd;
            const dr=Math.sign(r2-r1), dc=Math.sign(c2-c1);
            const len = Math.max(Math.abs(r2-r1),Math.abs(c2-c1))+1;
            ctx.fillStyle = 'rgba(233,69,96,0.3)';
            for (let i=0;i<len;i++) ctx.fillRect(ox+(c1+dc*i)*G, oy+(r1+dr*i)*G, G, G);
        }
        // Word list
        const lx = ox + size*G + 20;
        this.text('Find:', lx+40, 30, 16, '#4fc3f7', 'left');
        this.words.forEach((w, i) => {
            const found = this.found.includes(w);
            ctx.fillStyle = found ? '#538d4e' : '#e0e0e0';
            ctx.textAlign = 'left'; ctx.font = `${found ? 'line-through ' : ''}14px sans-serif`;
            ctx.fillText(w, lx, 60 + i * 28);
        });
        this.text(`${this.found.length}/${this.words.length}`, lx+40, this.canvas.height-20, 14, '#666', 'left');
    }
}

// Register word games
Portal.register({id:'wordguess',name:'Word Guess',category:'word',icon:'🔤',color:'linear-gradient(135deg,#1a4a1a,#3a8a3a)',Game:WordGuessGame,tags:['wordle','guess']});
Portal.register({id:'hangman',name:'Hangman',category:'word',icon:'👻',color:'linear-gradient(135deg,#3a1a1a,#6a3a3a)',Game:HangmanGame,tags:['guess','letters']});
Portal.register({id:'typing',name:'Typing Speed',category:'word',icon:'⌨️',color:'linear-gradient(135deg,#1a3a4a,#3a6a8a)',Game:TypingSpeedGame,tags:['typing','wpm']});
Portal.register({id:'anagram',name:'Anagram Hunt',category:'word',icon:'🔀',color:'linear-gradient(135deg,#4a3a1a,#8a6a3a)',Game:AnagramGame,tags:['words','scramble']});
Portal.register({id:'wordsearch',name:'Word Search',category:'word',icon:'🔍',color:'linear-gradient(135deg,#1a1a3a,#3a3a6a)',Game:WordSearchGame,tags:['find','hidden']});
