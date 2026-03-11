/* === WORD GAMES 2 (3) === */

// ============================================================
// SPELLING BEE
// ============================================================
class SpellingBeeGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.canvas.style.display = 'none';
        this.found = []; this.current = ''; this.message = ''; this.messageColor = '#ffd54f';

        this.generatePuzzle();

        this.listenKey(e => {
            if (e.key === 'Enter') { this.submit(); e.preventDefault(); }
            else if (e.key === 'Backspace') { this.current = this.current.slice(0, -1); this.renderUI(); e.preventDefault(); }
            else if (/^[a-zA-Z]$/.test(e.key)) {
                this.current += e.key.toUpperCase();
                this.renderUI();
            }
        });

        this.renderUI();
    }

    generatePuzzle() {
        // Curated letter sets with center letter, each guaranteed to produce many words from WORDS5.
        // Each set has 7 unique letters and a required center letter.
        const puzzleSets = [
            { letters: 'AESTRLN', center: 'A' },
            { letters: 'OINGRST', center: 'I' },
            { letters: 'EAPLRST', center: 'E' },
            { letters: 'OCRANHE', center: 'O' },
            { letters: 'AIDLNET', center: 'A' },
            { letters: 'UBROATL', center: 'A' },
            { letters: 'ESMGHTA', center: 'A' },
            { letters: 'POUNRDE', center: 'O' },
        ];

        const chosen = randChoice(puzzleSets);
        this.allLetters = chosen.letters.split('');
        this.centerLetter = chosen.center;
        this.outerLetters = this.allLetters.filter(l => l !== this.centerLetter);
        shuffle(this.outerLetters);

        // Find all valid words from WORDS5 that use only these letters and include center
        const letterSet = new Set(this.allLetters);
        this.validWords = [];

        for (const w of WORDS5) {
            const upper = w.toUpperCase();
            if (!upper.includes(this.centerLetter)) continue;
            if (upper.split('').every(c => letterSet.has(c))) {
                this.validWords.push(upper);
            }
        }

        // Also check 4-letter words from a built-in list
        const fourLetters = this.getCommon4LetterWords();
        for (const w of fourLetters) {
            if (this.validWords.includes(w)) continue;
            if (!w.includes(this.centerLetter)) continue;
            if (w.split('').every(c => letterSet.has(c))) {
                this.validWords.push(w);
            }
        }

        // Calculate max possible score
        this.maxScore = 0;
        for (const w of this.validWords) this.maxScore += this.wordScore(w);
    }

    getCommon4LetterWords() {
        return [
            'ABLE','ARTS','AREA','BALE','BANE','BARE','BARN','BASE','BEAN','BEAR','BEAT','BELT',
            'BEND','BEST','BIRD','BITE','BLED','BOAT','BOLD','BOLT','BOND','BONE','BORE','BORN',
            'CAGE','CAKE','CANE','CAPE','CARD','CARE','CART','CASE','CAST','CLAN','CLAP','COAL',
            'COAT','CODE','COIL','COIN','COLD','CONE','COPE','CORD','CORE','COST','DALE','DANE',
            'DARE','DART','DATA','DATE','DEAL','DEAN','DEAR','DINE','DONE','DOSE','DRAG','DROP',
            'DUAL','DUNE','EACH','EARL','EARN','EASE','EAST','EDGE','ELSE','ERNE','FACE','FADE',
            'FAIL','GAIN','GALE','GAME','GATE','GEAR','GENE','GIRL','GLAD','GLEN','GLOW','GOAT',
            'GOLD','GONE','GORE','GRAB','GRIN','GRIP','GRIT','HAIL','HAIR','HALE','HALT','HAND',
            'HANG','HARD','HARE','HATE','HEAL','HEAR','HEAT','HELD','HINT','HIRE','HOLE','ISLE',
            'LACE','LAID','LAIN','LAKE','LAME','LAND','LANE','LARD','LAST','LATE','LEAD','LEAN',
            'LEAP','LINE','LINK','LIST','LITE','LOAD','LOAN','LONE','LONG','LORD','LORE','LOSE',
            'MAGE','MAIN','MALE','MANE','MARE','MASK','MAST','MATE','MEAL','MEAT','MELT','MILD',
            'MINE','MIST','MODE','MOLE','MOOD','MORE','NAIL','NAME','NEAR','NEAT','NEST','NODE',
            'NONE','NOSE','NOTE','OMEN','ONCE','ORAL','PACE','PAID','PANE','PART','PAST','PEAL',
            'PILE','PINE','PLAN','PLEA','PLOT','POLE','POND','PORE','POSE','POUR','PURE','RACE',
            'RAGE','RAID','RAIL','RAIN','RANG','RANK','RARE','RASH','RATE','READ','REAL','REAR',
            'REIN','REND','RENT','REST','RIDE','RILE','RING','RIPE','RISE','ROAD','RODE','ROLE',
            'ROPE','ROTE','RUIN','RULE','SAGE','SAID','SAIL','SAKE','SALE','SALT','SAME','SAND',
            'SANE','SANG','SEAL','SEAT','SEND','SENT','SHIN','SIGN','SING','SITE','SLAP','SLED',
            'SLIP','SLOT','SNAP','SOIL','SOLD','SOLE','SONG','SORE','SORT','SOUL','SPAN','STAR',
            'STEP','STIR','TALE','TANG','TAPE','TARN','TART','TEAR','TEND','TENT','TERN','THIN',
            'TIDE','TIER','TILE','TINE','TIRE','TOIL','TOLD','TOLL','TONE','TORE','TORN','TRAP',
            'TREE','TRIM','TRIO','TRUE','TUNE','TURN','VEIN','VINE','WADE','WAGE','WAIL','WAIT',
            'WAND','WARD','WARE','WARN','WART','WEAR','WELD','WILD','WILT','WIND','WINE','WING',
            'WIRE','WISE','WORN','ZONE'
        ];
    }

    wordScore(word) {
        if (word.length === 4) return 1;
        let pts = word.length;
        // Pangram bonus: uses all 7 letters
        if (this.allLetters.every(l => word.includes(l))) pts += 7;
        return pts;
    }

    submit() {
        const word = this.current.trim().toUpperCase();
        this.current = '';

        if (word.length < 4) {
            this.flashMessage('Too short (4+ letters)', '#e94560');
        } else if (!word.includes(this.centerLetter)) {
            this.flashMessage('Must contain center letter (' + this.centerLetter + ')', '#e94560');
        } else if (!word.split('').every(c => this.allLetters.includes(c))) {
            this.flashMessage('Uses letters not in the hive', '#e94560');
        } else if (this.found.includes(word)) {
            this.flashMessage('Already found!', '#e94560');
        } else if (this.validWords.includes(word)) {
            const pts = this.wordScore(word);
            this.found.push(word);
            this.score += pts;
            this.setScore(this.score);
            const isPangram = this.allLetters.every(l => word.includes(l));
            this.flashMessage(isPangram ? 'PANGRAM! +' + pts : '+' + pts + '!', isPangram ? '#ffd54f' : '#7bed9f');

            if (this.found.length === this.validWords.length) {
                this.addTimeout(() => {
                    this.endGame();
                    this.showOverlay('Genius!', 'Found all ' + this.validWords.length + ' words! Score: ' + this.score);
                }, 500);
            }
        } else {
            this.flashMessage('Not in word list', '#e94560');
        }
        this.renderUI();
    }

    flashMessage(msg, color) {
        this.message = msg;
        this.messageColor = color;
        this.addTimeout(() => { this.message = ''; this.renderUI(); }, 1500);
    }

    shuffleOuter() {
        shuffle(this.outerLetters);
        this.renderUI();
    }

    typeLetter(letter) {
        this.current += letter;
        this.renderUI();
    }

    deleteLetter() {
        this.current = this.current.slice(0, -1);
        this.renderUI();
    }

    renderUI() {
        const totalWords = this.validWords.length;
        const pct = totalWords > 0 ? Math.round((this.found.length / totalWords) * 100) : 0;

        let rank = 'Beginner';
        if (pct >= 100) rank = 'Genius';
        else if (pct >= 70) rank = 'Amazing';
        else if (pct >= 50) rank = 'Great';
        else if (pct >= 40) rank = 'Nice';
        else if (pct >= 25) rank = 'Good';
        else if (pct >= 10) rank = 'Moving Up';

        // Hex grid
        const hexHTML = this.buildHexHTML();

        // Found words
        const foundHTML = this.found.slice().sort().map(w => {
            const isPangram = this.allLetters.every(l => w.includes(l));
            return '<span style="display:inline-block;margin:2px 4px;padding:2px 8px;border-radius:4px;font-size:13px;background:' + (isPangram ? '#4a4a0a' : '#1a1a2e') + ';color:' + (isPangram ? '#ffd54f' : '#7bed9f') + ';' + (isPangram ? 'font-weight:bold;' : '') + '">' + w + '</span>';
        }).join('');

        // Input letters colored
        const inputHTML = this.current.split('').map(c => {
            const color = c === this.centerLetter ? '#ffd54f' : (this.allLetters.includes(c) ? '#e0e0e0' : '#e94560');
            return '<span style="color:' + color + ';">' + c + '</span>';
        }).join('') || '<span style="color:#555;">_</span>';

        this.ui.innerHTML =
            '<div style="display:flex;flex-direction:column;align-items:center;width:100%;max-width:700px;height:100%;padding:10px 20px;color:#e0e0e0;font-family:sans-serif;overflow-y:auto;">' +
                '<div style="width:100%;display:flex;align-items:center;gap:12px;margin-bottom:8px;">' +
                    '<span style="font-size:14px;font-weight:600;color:#ffd54f;">' + rank + '</span>' +
                    '<div style="flex:1;height:6px;background:#1a1a2e;border-radius:3px;overflow:hidden;">' +
                        '<div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#e94560,#ffd54f);border-radius:3px;transition:width 0.3s;"></div>' +
                    '</div>' +
                    '<span style="font-size:12px;color:#888;">' + this.found.length + '/' + totalWords + '</span>' +
                '</div>' +
                '<div style="width:100%;min-height:36px;max-height:80px;overflow-y:auto;margin-bottom:6px;display:flex;flex-wrap:wrap;align-content:flex-start;">' +
                    (foundHTML || '<span style="color:#555;font-size:13px;">No words found yet</span>') +
                '</div>' +
                '<div style="height:28px;display:flex;align-items:center;">' +
                    (this.message ? '<span style="font-size:16px;font-weight:600;color:' + this.messageColor + ';">' + this.message + '</span>' : '') +
                '</div>' +
                '<div style="font-size:28px;font-weight:bold;letter-spacing:4px;min-height:44px;display:flex;align-items:center;margin-bottom:8px;">' +
                    inputHTML +
                '</div>' +
                hexHTML +
                '<div style="display:flex;gap:12px;margin-top:12px;">' +
                    '<button id="sb-delete" style="background:#1a1a2e;color:#e0e0e0;border:1px solid #2a2a4a;padding:8px 20px;border-radius:8px;font-size:14px;cursor:pointer;">Delete</button>' +
                    '<button id="sb-shuffle" style="background:#1a1a2e;color:#e0e0e0;border:1px solid #2a2a4a;padding:8px 20px;border-radius:8px;font-size:14px;cursor:pointer;">Shuffle</button>' +
                    '<button id="sb-enter" style="background:#e94560;color:#fff;border:none;padding:8px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Enter</button>' +
                '</div>' +
                '<div style="margin-top:10px;font-size:12px;color:#555;">Type letters or click hexagons. Center letter required in every word.</div>' +
            '</div>';

        // Attach event listeners via DOM (avoids inline onclick issues)
        const self = this;
        const delBtn = this.ui.querySelector('#sb-delete');
        const shufBtn = this.ui.querySelector('#sb-shuffle');
        const enterBtn = this.ui.querySelector('#sb-enter');
        if (delBtn) delBtn.addEventListener('click', () => self.deleteLetter());
        if (shufBtn) shufBtn.addEventListener('click', () => self.shuffleOuter());
        if (enterBtn) enterBtn.addEventListener('click', () => self.submit());

        // Attach hex click listeners
        this.ui.querySelectorAll('.sb-hex').forEach(hex => {
            hex.addEventListener('click', () => self.typeLetter(hex.dataset.letter));
        });
    }

    buildHexHTML() {
        const hexSize = 52;
        const gap = 4;
        const rowH = hexSize * 0.87 + gap;
        const colW = hexSize + gap;

        // Layout: 3 rows. Row 0: 2 hexes, Row 1: 3 hexes (center in middle), Row 2: 2 hexes
        const positions = [
            { letter: this.outerLetters[0], row: 0, col: 0, isCenter: false },
            { letter: this.outerLetters[1], row: 0, col: 1, isCenter: false },
            { letter: this.outerLetters[2], row: 1, col: -0.5, isCenter: false },
            { letter: this.centerLetter,    row: 1, col: 0.5, isCenter: true },
            { letter: this.outerLetters[3], row: 1, col: 1.5, isCenter: false },
            { letter: this.outerLetters[4], row: 2, col: 0, isCenter: false },
            { letter: this.outerLetters[5], row: 2, col: 1, isCenter: false },
        ];

        const containerW = 3 * colW + hexSize;
        const containerH = 3 * rowH + hexSize;
        const offsetX = containerW / 2 - colW * 0.5;
        const offsetY = 4;

        var hexes = '';
        for (var i = 0; i < positions.length; i++) {
            var p = positions[i];
            var x = offsetX + p.col * colW;
            var y = offsetY + p.row * rowH;
            var bg = p.isCenter ? '#8a7a1a' : '#16213e';
            var textColor = p.isCenter ? '#ffd54f' : '#e0e0e0';
            var border = p.isCenter ? '2px solid #ffd54f' : '2px solid #2a2a4a';
            hexes += '<div class="sb-hex" data-letter="' + p.letter + '" style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + hexSize + 'px;height:' + hexSize + 'px;background:' + bg + ';border:' + border + ';border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:bold;color:' + textColor + ';cursor:pointer;user-select:none;">' + p.letter + '</div>';
        }

        return '<div style="position:relative;width:' + containerW + 'px;height:' + containerH + 'px;margin:4px 0;">' + hexes + '</div>';
    }

    update() {}
    render() {}
}


// ============================================================
// WORD LADDER
// ============================================================
class WordLadderGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.canvas.style.display = 'none';
        this.current = '';
        this.message = '';
        this.messageColor = '#ffd54f';
        this.startTime = Date.now();

        // Build word set for validation
        this.wordSet = new Set(WORDS5.map(w => w.toUpperCase()));
        this.generatePuzzle();

        this.listenKey(e => {
            if (this.won) return;
            if (e.key === 'Enter') { this.submitWord(); e.preventDefault(); }
            else if (e.key === 'Backspace') { this.current = this.current.slice(0, -1); this.renderUI(); e.preventDefault(); }
            else if (/^[a-zA-Z]$/.test(e.key) && this.current.length < 5) {
                this.current += e.key.toUpperCase();
                this.renderUI();
            }
        });

        this.renderUI();
    }

    generatePuzzle() {
        // Pre-verified puzzles: start -> end with a known BFS-optimal path
        // Each pair is guaranteed reachable through single-letter changes in WORDS5
        const puzzles = [
            { start: 'BRAIN', end: 'GRIND', path: ['BRAIN','GRAIN','GRIND'] },
            { start: 'FLAME', end: 'BLAME', path: ['FLAME','BLAME'] },
            { start: 'STONE', end: 'STARE', path: ['STONE','STORE','STARE'] },
            { start: 'CRANE', end: 'CRATE', path: ['CRANE','CRATE'] },
            { start: 'LIGHT', end: 'SIGHT', path: ['LIGHT','SIGHT'] },
            { start: 'PLACE', end: 'PLANE', path: ['PLACE','PLANE'] },
            { start: 'HEART', end: 'HEARD', path: ['HEART','HEARD'] },
            { start: 'BLACK', end: 'BLANK', path: ['BLACK','BLANK'] },
            { start: 'THINK', end: 'THICK', path: ['THINK','THICK'] },
            { start: 'GRACE', end: 'GRADE', path: ['GRACE','GRADE'] },
            { start: 'HOUSE', end: 'MOUSE', path: ['HOUSE','MOUSE'] },
            { start: 'STEAL', end: 'STEAM', path: ['STEAL','STEAM'] },
            { start: 'BRIDE', end: 'PRIDE', path: ['BRIDE','PRIDE'] },
            { start: 'SHARE', end: 'SHARK', path: ['SHARE','SHARK'] },
            { start: 'MOUNT', end: 'MOUTH', path: ['MOUNT','MOUTH'] },
            { start: 'SWEEP', end: 'SWEET', path: ['SWEEP','SWEET'] },
            { start: 'DREAM', end: 'DREAD', path: ['DREAM','DREAD'] },
            { start: 'CLEAR', end: 'CLEAN', path: ['CLEAR','CLEAN'] },
            { start: 'TRACK', end: 'TRICK', path: ['TRACK','TRICK'] },
            { start: 'WORLD', end: 'WOULD', path: ['WORLD','WOULD'] },
            { start: 'FROST', end: 'FRONT', path: ['FROST','FRONT'] },
            { start: 'PAINT', end: 'FAINT', path: ['PAINT','FAINT'] },
            { start: 'STARE', end: 'SPARE', path: ['STARE','SPARE'] },
            { start: 'NIGHT', end: 'SIGHT', path: ['NIGHT','SIGHT'] },
            { start: 'CLASH', end: 'CRASH', path: ['CLASH','CRASH'] },
            { start: 'STORM', end: 'STORE', path: ['STORM','STORE'] },
            { start: 'BLADE', end: 'BLAZE', path: ['BLADE','BLAZE'] },
        ];

        // Pick a pair and do BFS to find actual optimal path
        const puzzle = randChoice(puzzles);
        this.startWord = puzzle.start;
        this.endWord = puzzle.end;
        this.optimalPath = this.bfs(this.startWord, this.endWord);
        this.optimalSteps = this.optimalPath ? this.optimalPath.length - 1 : puzzle.path.length - 1;

        this.chain = [this.startWord];
        this.won = false;
    }

    getNeighbors(word) {
        var neighbors = [];
        for (var i = 0; i < 5; i++) {
            for (var c = 65; c <= 90; c++) {
                var ch = String.fromCharCode(c);
                if (ch === word[i]) continue;
                var candidate = word.slice(0, i) + ch + word.slice(i + 1);
                if (this.wordSet.has(candidate)) neighbors.push(candidate);
            }
        }
        return neighbors;
    }

    bfs(start, end) {
        if (start === end) return [start];
        var visited = new Set([start]);
        var queue = [[start, [start]]];
        var iterations = 0;
        while (queue.length > 0 && iterations < 40000) {
            iterations++;
            var item = queue.shift();
            var current = item[0];
            var path = item[1];
            if (path.length > 15) continue;
            var neighbors = this.getNeighbors(current);
            for (var i = 0; i < neighbors.length; i++) {
                var n = neighbors[i];
                if (n === end) return path.concat([n]);
                if (!visited.has(n)) {
                    visited.add(n);
                    queue.push([n, path.concat([n])]);
                }
            }
        }
        return null;
    }

    diffCount(a, b) {
        var d = 0;
        for (var i = 0; i < 5; i++) if (a[i] !== b[i]) d++;
        return d;
    }

    submitWord() {
        var word = this.current.trim().toUpperCase();
        this.current = '';

        if (this.won) { this.renderUI(); return; }

        if (word.length !== 5) {
            this.flashMessage('Enter a 5-letter word', '#e94560');
        } else if (!this.wordSet.has(word)) {
            this.flashMessage('Not a valid word', '#e94560');
        } else if (this.chain.indexOf(word) >= 0) {
            this.flashMessage('Already used!', '#e94560');
        } else {
            var lastWord = this.chain[this.chain.length - 1];
            var diff = this.diffCount(lastWord, word);
            if (diff !== 1) {
                this.flashMessage('Change exactly 1 letter (you changed ' + diff + ')', '#e94560');
            } else {
                this.chain.push(word);

                if (word === this.endWord) {
                    this.won = true;
                    var steps = this.chain.length - 1;
                    var timeBonus = Math.max(0, 300 - Math.floor((Date.now() - this.startTime) / 1000));
                    var stepBonus = Math.max(0, (20 - steps) * 50);
                    var totalScore = 100 + stepBonus + timeBonus;
                    this.setScore(totalScore);

                    var self = this;
                    var optStr = this.optimalPath ? ' (Optimal: ' + this.optimalSteps + ')' : '';
                    this.addTimeout(function() {
                        self.endGame();
                        self.showOverlay('Ladder Complete!', steps + ' steps' + optStr + ' | Score: ' + totalScore);
                    }, 800);
                }
            }
        }
        this.renderUI();
    }

    useHint() {
        if (this.won) return;
        var lastWord = this.chain[this.chain.length - 1];
        var pathFromHere = this.bfs(lastWord, this.endWord);
        if (pathFromHere && pathFromHere.length > 1) {
            this.flashMessage('Hint: Try "' + pathFromHere[1] + '"', '#4fc3f7');
        } else {
            this.flashMessage('No path found! Try undoing.', '#e94560');
        }
        this.renderUI();
    }

    undoLast() {
        if (this.chain.length > 1 && !this.won) {
            this.chain.pop();
            this.renderUI();
        }
    }

    flashMessage(msg, color) {
        this.message = msg;
        this.messageColor = color;
        var self = this;
        this.addTimeout(function() { self.message = ''; self.renderUI(); }, 2000);
    }

    renderUI() {
        var steps = this.chain.length - 1;
        var elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        var mins = Math.floor(elapsed / 60);
        var secs = elapsed % 60;

        // Build chain display
        var chainHTML = '';
        for (var i = 0; i < this.chain.length; i++) {
            var word = this.chain[i];
            var isStart = (i === 0);
            var isEnd = (word === this.endWord);
            var prevWord = i > 0 ? this.chain[i - 1] : null;

            var letters = '';
            for (var j = 0; j < 5; j++) {
                var bg = '#16213e';
                var color = '#e0e0e0';
                if (isStart) { bg = '#1a3a1a'; color = '#7bed9f'; }
                else if (isEnd) { bg = '#1a3a1a'; color = '#7bed9f'; }
                else if (prevWord && word[j] !== prevWord[j]) { bg = '#3a3a0a'; color = '#ffd54f'; }
                letters += '<div style="width:40px;height:44px;display:flex;align-items:center;justify-content:center;background:' + bg + ';border-radius:6px;font-size:20px;font-weight:bold;color:' + color + ';border:1px solid #2a2a4a;">' + word[j] + '</div>';
            }

            if (i > 0) {
                chainHTML += '<div style="display:flex;justify-content:center;margin:2px 0;"><span style="color:#555;font-size:16px;">|</span></div>';
            }
            chainHTML += '<div style="display:flex;gap:4px;justify-content:center;">' + letters + '</div>';
        }

        // Target word display
        var targetLetters = '';
        var lastWord = this.chain[this.chain.length - 1];
        for (var j = 0; j < 5; j++) {
            var matched = lastWord[j] === this.endWord[j];
            targetLetters += '<div style="width:40px;height:44px;display:flex;align-items:center;justify-content:center;background:' + (matched ? '#1a3a1a' : '#2a1a1a') + ';border-radius:6px;font-size:20px;font-weight:bold;color:' + (matched ? '#7bed9f' : '#e94560') + ';border:1px solid ' + (matched ? '#3a5a3a' : '#4a2a2a') + ';">' + this.endWord[j] + '</div>';
        }

        // Input display
        var inputLetters = '';
        for (var j = 0; j < 5; j++) {
            var ch = this.current[j] || '';
            var hasCh = ch.length > 0;
            inputLetters += '<div style="width:40px;height:44px;display:flex;align-items:center;justify-content:center;background:#1a1a2e;border-radius:6px;font-size:20px;font-weight:bold;color:#e0e0e0;border:1px solid ' + (hasCh ? '#888' : '#2a2a4a') + ';">' + ch + '</div>';
        }

        this.ui.innerHTML =
            '<div style="display:flex;flex-direction:column;align-items:center;width:100%;max-width:500px;height:100%;padding:10px 20px;color:#e0e0e0;font-family:sans-serif;overflow-y:auto;">' +
                '<div style="display:flex;justify-content:space-between;width:100%;margin-bottom:6px;">' +
                    '<span style="font-size:13px;color:#888;">Steps: ' + steps + '</span>' +
                    '<span style="font-size:13px;color:#888;">' + mins + ':' + (secs < 10 ? '0' : '') + secs + '</span>' +
                '</div>' +
                '<div style="font-size:11px;color:#7bed9f;text-transform:uppercase;letter-spacing:2px;margin-bottom:2px;">Start</div>' +
                '<div style="width:100%;max-height:260px;overflow-y:auto;display:flex;flex-direction:column;margin-bottom:6px;padding:4px 0;">' +
                    chainHTML +
                '</div>' +
                '<div style="color:#555;font-size:18px;margin:2px 0;">&#8595;</div>' +
                '<div style="display:flex;gap:4px;margin-bottom:4px;">' + inputLetters + '</div>' +
                '<div style="color:#555;font-size:14px;margin:4px 0;">&#8595; &#8595; &#8595;</div>' +
                '<div style="font-size:11px;color:#e94560;text-transform:uppercase;letter-spacing:2px;margin-bottom:2px;">Goal</div>' +
                '<div style="display:flex;gap:4px;margin-bottom:10px;">' + targetLetters + '</div>' +
                '<div style="height:24px;display:flex;align-items:center;">' +
                    (this.message ? '<span style="font-size:14px;font-weight:600;color:' + this.messageColor + ';">' + this.message + '</span>' : '') +
                '</div>' +
                '<div style="display:flex;gap:10px;margin-top:8px;">' +
                    '<button id="wl-undo" style="background:#1a1a2e;color:#e0e0e0;border:1px solid #2a2a4a;padding:8px 16px;border-radius:8px;font-size:13px;cursor:pointer;">Undo</button>' +
                    '<button id="wl-submit" style="background:#7c3aed;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">Submit</button>' +
                    '<button id="wl-hint" style="background:#1a1a2e;color:#4fc3f7;border:1px solid #2a2a4a;padding:8px 16px;border-radius:8px;font-size:13px;cursor:pointer;">Hint</button>' +
                '</div>' +
                '<div style="margin-top:10px;font-size:11px;color:#555;text-align:center;">Change one letter at a time. Each step must be a real word.</div>' +
            '</div>';

        var self = this;
        var undoBtn = this.ui.querySelector('#wl-undo');
        var submitBtn = this.ui.querySelector('#wl-submit');
        var hintBtn = this.ui.querySelector('#wl-hint');
        if (undoBtn) undoBtn.addEventListener('click', function() { self.undoLast(); });
        if (submitBtn) submitBtn.addEventListener('click', function() { self.submitWord(); });
        if (hintBtn) hintBtn.addEventListener('click', function() { self.useHint(); });
    }

    update() {}
    render() {}
}


// ============================================================
// CROSSWORD MINI
// ============================================================
class CrosswordMiniGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.canvas.style.display = 'none';
        this.size = 7;
        this.startTime = Date.now();
        this.selectedCell = null;
        this.direction = 'across'; // 'across' or 'down'
        this.won = false;
        this._timerInterval = null;

        this.generateCrossword();

        this.listenKey(e => {
            if (this.won) return;
            if (!this.selectedCell) return;
            var r = this.selectedCell.r;
            var c = this.selectedCell.c;

            if (e.key === 'Backspace') {
                this.playerGrid[r][c] = '';
                if (this.direction === 'across' && c > 0 && this.grid[r][c - 1] !== '#') {
                    this.selectedCell = { r: r, c: c - 1 };
                } else if (this.direction === 'down' && r > 0 && this.grid[r - 1][c] !== '#') {
                    this.selectedCell = { r: r - 1, c: c };
                }
                this.renderUI();
                e.preventDefault();
            } else if (e.key === 'Tab' || e.key === ' ') {
                this.direction = this.direction === 'across' ? 'down' : 'across';
                this.renderUI();
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                if (r > 0 && this.grid[r - 1][c] !== '#') { this.selectedCell = { r: r - 1, c: c }; this.direction = 'down'; }
                this.renderUI(); e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                if (r < this.size - 1 && this.grid[r + 1][c] !== '#') { this.selectedCell = { r: r + 1, c: c }; this.direction = 'down'; }
                this.renderUI(); e.preventDefault();
            } else if (e.key === 'ArrowLeft') {
                if (c > 0 && this.grid[r][c - 1] !== '#') { this.selectedCell = { r: r, c: c - 1 }; this.direction = 'across'; }
                this.renderUI(); e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                if (c < this.size - 1 && this.grid[r][c + 1] !== '#') { this.selectedCell = { r: r, c: c + 1 }; this.direction = 'across'; }
                this.renderUI(); e.preventDefault();
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                this.playerGrid[r][c] = e.key.toUpperCase();
                // Advance cursor
                if (this.direction === 'across') {
                    for (var nc = c + 1; nc < this.size; nc++) {
                        if (this.grid[r][nc] !== '#') { this.selectedCell = { r: r, c: nc }; break; }
                    }
                } else {
                    for (var nr = r + 1; nr < this.size; nr++) {
                        if (this.grid[nr][c] !== '#') { this.selectedCell = { r: nr, c: c }; break; }
                    }
                }
                this.checkWin();
                this.renderUI();
                e.preventDefault();
            }
        });

        this.renderUI();
    }

    generateCrossword() {
        // Hand-crafted 7x7 crossword puzzles. '#' = black cell.
        // Each puzzle verified: across words read left-to-right, down words top-to-bottom.

        var puzzles = [
            // PUZZLE 1
            // Across: PLANE(r0,c1), IDEAL(r2,c1), EAGLE(r4,c1)
            // Down: PRIDE(col1: P,R,I,D,E)
            {
                grid: [
                    ['#','P','L','A','N','E','#'],
                    ['#','R','#','#','#','#','#'],
                    ['#','I','D','E','A','L','#'],
                    ['#','D','#','#','#','#','#'],
                    ['#','E','A','G','L','E','#'],
                    ['#','#','#','#','#','#','#'],
                    ['#','#','#','#','#','#','#'],
                ],
                clues: {
                    across: [
                        { num: 1, r: 0, c: 1, text: 'Aircraft; flat surface' },
                        { num: 3, r: 2, c: 1, text: 'Perfect; meeting a standard' },
                        { num: 5, r: 4, c: 1, text: 'Large bird of prey (national symbol)' },
                    ],
                    down: [
                        { num: 2, r: 0, c: 1, text: 'Self-respect; satisfaction in achievement' },
                    ]
                }
            },

            // PUZZLE 2
            // Across: STORM(r0,c1), EARTH(r2,c1), LATER(r4,c1)
            // Down: STEEL(col1: S,T,E,E,L)
            {
                grid: [
                    ['#','S','T','O','R','M','#'],
                    ['#','T','#','#','#','#','#'],
                    ['#','E','A','R','T','H','#'],
                    ['#','E','#','#','#','#','#'],
                    ['#','L','A','T','E','R','#'],
                    ['#','#','#','#','#','#','#'],
                    ['#','#','#','#','#','#','#'],
                ],
                clues: {
                    across: [
                        { num: 1, r: 0, c: 1, text: 'Severe weather with wind and rain' },
                        { num: 3, r: 2, c: 1, text: 'Our planet; the ground' },
                        { num: 5, r: 4, c: 1, text: 'After; subsequently' },
                    ],
                    down: [
                        { num: 2, r: 0, c: 1, text: 'Strong metal alloy used in buildings' },
                    ]
                }
            },

            // PUZZLE 3
            // Across: CRANE(r0,c1), ANGER(r2,c1), EARTH(r4,c1)
            // Down: CHASE(col1: C,H,A,S,E)
            {
                grid: [
                    ['#','C','R','A','N','E','#'],
                    ['#','H','#','#','#','#','#'],
                    ['#','A','N','G','E','R','#'],
                    ['#','S','#','#','#','#','#'],
                    ['#','E','A','R','T','H','#'],
                    ['#','#','#','#','#','#','#'],
                    ['#','#','#','#','#','#','#'],
                ],
                clues: {
                    across: [
                        { num: 1, r: 0, c: 1, text: 'Large bird; construction machine' },
                        { num: 3, r: 2, c: 1, text: 'Fury; strong emotion' },
                        { num: 5, r: 4, c: 1, text: 'Our planet; the ground' },
                    ],
                    down: [
                        { num: 2, r: 0, c: 1, text: 'Pursue; run after' },
                    ]
                }
            },

            // PUZZLE 4
            // Across: SCALE(r0,c1), ABOVE(r2,c1), EAGLE(r4,c1)
            // Down: SPACE(col1: S,P,A,C,E)
            {
                grid: [
                    ['#','S','C','A','L','E','#'],
                    ['#','P','#','#','#','#','#'],
                    ['#','A','B','O','V','E','#'],
                    ['#','C','#','#','#','#','#'],
                    ['#','E','A','G','L','E','#'],
                    ['#','#','#','#','#','#','#'],
                    ['#','#','#','#','#','#','#'],
                ],
                clues: {
                    across: [
                        { num: 1, r: 0, c: 1, text: 'Measure; climb (a wall)' },
                        { num: 3, r: 2, c: 1, text: 'Higher than; over' },
                        { num: 5, r: 4, c: 1, text: 'Large bird of prey' },
                    ],
                    down: [
                        { num: 2, r: 0, c: 1, text: 'Outer area beyond the atmosphere' },
                    ]
                }
            },

            // PUZZLE 5
            // Across: GRAIN(r0,c1), OLIVE(r2,c1), VERSE(r4,c1)
            // Down: GOVER -> no. Let me pick: col1 = G,_,O,_,V => not clean.
            // Try: BRAVE(r0,c1), RIDER(r2,c1), EMPTY(r4,c1) => col1: B,_,R,_,E = not a word.
            // Try: BLAZE(r0,c1), LIVER(r2,c1), EVENT(r4,c1) => col1: B,_,L,_,E = BILE? No.
            // Try: THREE words sharing col 1:
            // GHOST(r0,c1), RIVER(r2,c1), EATER(r4,c1) => col1: G,_,R,_,E = not a word.
            // WORTH(r0,c1), ORGAN(r2,c1), RIDGE(r4,c1) => col1: W,_,O,_,R = DONOR? No.
            // SHADE(r0,c1), HOUSE(r2,c1), ALONE(r4,c1) => col1: S,_,H,_,A = SHA? No.
            // SHINE(r0,c1), TREAT(r2,c1), ARENA(r4,c1) => col1: S,_,T,_,A = STAIR? No, just S,T,A.
            // col1 must be 5 letters: rows 0,1,2,3,4.
            // FLAME(r0,c1), LEMON(r2,c1), ANGER(r4,c1) => col1: F,_,L,_,A = not a word.
            // How about: TOWER(col1) = T,O,W,E,R
            // r0 c1=T: TRAIL(r0,c1)
            // r1 c1=O
            // r2 c1=W: WASTE(r2,c1)
            // r3 c1=E
            // r4 c1=R: RIDER(r4,c1)
            // Across: TRAIL, WASTE, RIDER. Down: TOWER. All real words!
            {
                grid: [
                    ['#','T','R','A','I','L','#'],
                    ['#','O','#','#','#','#','#'],
                    ['#','W','A','S','T','E','#'],
                    ['#','E','#','#','#','#','#'],
                    ['#','R','I','D','E','R','#'],
                    ['#','#','#','#','#','#','#'],
                    ['#','#','#','#','#','#','#'],
                ],
                clues: {
                    across: [
                        { num: 1, r: 0, c: 1, text: 'Path through woods or wilderness' },
                        { num: 3, r: 2, c: 1, text: 'Garbage; to squander' },
                        { num: 5, r: 4, c: 1, text: 'Person on a horse or bike' },
                    ],
                    down: [
                        { num: 2, r: 0, c: 1, text: 'Tall structure; castle feature' },
                    ]
                }
            },

            // PUZZLE 6
            // Down: FLAME(col1) = F,L,A,M,E
            // r0: FROST(r0,c1)? No, c1=F. FROST starts with F at c1. F,R,O,S,T.
            // r2: ADMIT? No c1=A. A,D,M,I,T. ADMIT at c1. Good.
            // r4: ELITE? No c1=E. E,L,I,T,E. ELITE at c1. Good.
            // r1: c1=L. Just L alone.
            // r3: c1=M. Just M alone.
            // Across: FROST, ADMIT, ELITE. Down: FLAME.
            {
                grid: [
                    ['#','F','R','O','S','T','#'],
                    ['#','L','#','#','#','#','#'],
                    ['#','A','D','M','I','T','#'],
                    ['#','M','#','#','#','#','#'],
                    ['#','E','L','I','T','E','#'],
                    ['#','#','#','#','#','#','#'],
                    ['#','#','#','#','#','#','#'],
                ],
                clues: {
                    across: [
                        { num: 1, r: 0, c: 1, text: 'Ice crystals; winter coating' },
                        { num: 3, r: 2, c: 1, text: 'Confess; allow entry' },
                        { num: 5, r: 4, c: 1, text: 'Top-tier; the best group' },
                    ],
                    down: [
                        { num: 2, r: 0, c: 1, text: 'Fire; burning blaze' },
                    ]
                }
            },
        ];

        var puzzle = randChoice(puzzles);
        this.grid = puzzle.grid.map(function(row) { return row.slice(); });
        this.clues = puzzle.clues;

        // Create empty player grid
        this.playerGrid = [];
        for (var r = 0; r < this.size; r++) {
            this.playerGrid[r] = [];
            for (var c = 0; c < this.size; c++) {
                this.playerGrid[r][c] = this.grid[r][c] === '#' ? '#' : '';
            }
        }

        // Build cell number map
        this.cellNumbers = [];
        for (var r = 0; r < this.size; r++) {
            this.cellNumbers[r] = [];
            for (var c = 0; c < this.size; c++) {
                this.cellNumbers[r][c] = 0;
            }
        }
        var allClues = (this.clues.across || []).concat(this.clues.down || []);
        for (var i = 0; i < allClues.length; i++) {
            var cl = allClues[i];
            this.cellNumbers[cl.r][cl.c] = cl.num;
        }
    }

    selectCell(r, c) {
        if (this.grid[r][c] === '#') return;
        if (this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c) {
            this.direction = this.direction === 'across' ? 'down' : 'across';
        } else {
            this.selectedCell = { r: r, c: c };
        }
        this.renderUI();
    }

    getHighlightedCells() {
        if (!this.selectedCell) return [];
        var r = this.selectedCell.r;
        var c = this.selectedCell.c;
        var result = [];

        if (this.direction === 'across') {
            var sc = c;
            while (sc > 0 && this.grid[r][sc - 1] !== '#') sc--;
            for (var cc = sc; cc < this.size && this.grid[r][cc] !== '#'; cc++) {
                result.push({ r: r, c: cc });
            }
        } else {
            var sr = r;
            while (sr > 0 && this.grid[sr - 1][c] !== '#') sr--;
            for (var rr = sr; rr < this.size && this.grid[rr][c] !== '#'; rr++) {
                result.push({ r: rr, c: c });
            }
        }
        return result;
    }

    checkWin() {
        for (var r = 0; r < this.size; r++) {
            for (var c = 0; c < this.size; c++) {
                if (this.grid[r][c] !== '#' && this.playerGrid[r][c] !== this.grid[r][c]) return;
            }
        }
        this.won = true;
        var elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        var timeScore = Math.max(100, 1000 - elapsed * 2);
        this.setScore(timeScore);
        var self = this;
        var mins = Math.floor(elapsed / 60);
        var secs = elapsed % 60;
        this.addTimeout(function() {
            self.endGame();
            self.showOverlay('Crossword Complete!', 'Time: ' + mins + ':' + (secs < 10 ? '0' : '') + secs + ' | Score: ' + timeScore);
        }, 500);
    }

    renderUI() {
        var cellSize = 48;
        var highlighted = this.getHighlightedCells();
        var self = this;

        var isHighlighted = function(r, c) {
            for (var i = 0; i < highlighted.length; i++) {
                if (highlighted[i].r === r && highlighted[i].c === c) return true;
            }
            return false;
        };
        var isSelected = function(r, c) {
            return self.selectedCell && self.selectedCell.r === r && self.selectedCell.c === c;
        };

        var elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        var mins = Math.floor(elapsed / 60);
        var secs = elapsed % 60;

        // Build grid HTML
        var gridHTML = '';
        for (var r = 0; r < this.size; r++) {
            var row = '';
            for (var c = 0; c < this.size; c++) {
                if (this.grid[r][c] === '#') {
                    row += '<div style="width:' + cellSize + 'px;height:' + cellSize + 'px;background:#0a0a14;border:1px solid #0a0a14;"></div>';
                } else {
                    var sel = isSelected(r, c);
                    var hl = isHighlighted(r, c);
                    var bg = sel ? '#4a3a0a' : hl ? '#1a2a3a' : '#16213e';
                    var border = sel ? '#ffd54f' : hl ? '#3a5a7a' : '#2a2a4a';
                    var num = this.cellNumbers[r][c];
                    var letter = this.playerGrid[r][c];

                    row += '<div class="cw-cell" data-r="' + r + '" data-c="' + c + '" style="width:' + cellSize + 'px;height:' + cellSize + 'px;background:' + bg + ';border:2px solid ' + border + ';position:relative;cursor:pointer;display:flex;align-items:center;justify-content:center;">';
                    if (num) row += '<span style="position:absolute;top:1px;left:3px;font-size:10px;color:#888;">' + num + '</span>';
                    row += '<span style="font-size:22px;font-weight:bold;color:' + (this.won ? '#7bed9f' : (letter ? '#e0e0e0' : '#555')) + ';">' + (letter || '') + '</span>';
                    row += '</div>';
                }
            }
            gridHTML += '<div style="display:flex;">' + row + '</div>';
        }

        var dirText = this.direction === 'across' ? 'ACROSS \u2192' : 'DOWN \u2193';

        // Build clues HTML
        var acrossCluesHTML = '';
        var acrossClues = this.clues.across || [];
        for (var i = 0; i < acrossClues.length; i++) {
            var cl = acrossClues[i];
            acrossCluesHTML += '<div style="font-size:12px;color:#ccc;margin:2px 0;"><span style="color:#ffd54f;font-weight:bold;">' + cl.num + '.</span> ' + cl.text + '</div>';
        }

        var downCluesHTML = '';
        var downClues = this.clues.down || [];
        for (var i = 0; i < downClues.length; i++) {
            var cl = downClues[i];
            downCluesHTML += '<div style="font-size:12px;color:#ccc;margin:2px 0;"><span style="color:#4fc3f7;font-weight:bold;">' + cl.num + '.</span> ' + cl.text + '</div>';
        }

        this.ui.innerHTML =
            '<div style="display:flex;flex-direction:column;align-items:center;width:100%;max-width:700px;height:100%;padding:8px 15px;color:#e0e0e0;font-family:sans-serif;overflow-y:auto;">' +
                '<div style="display:flex;justify-content:space-between;width:100%;max-width:400px;margin-bottom:6px;">' +
                    '<span style="font-size:13px;color:#888;">' + dirText + '</span>' +
                    '<span style="font-size:13px;color:#888;">' + mins + ':' + (secs < 10 ? '0' : '') + secs + '</span>' +
                '</div>' +
                '<div style="display:flex;flex-direction:column;margin-bottom:12px;border:2px solid #2a2a4a;">' +
                    gridHTML +
                '</div>' +
                '<div style="display:flex;gap:24px;width:100%;max-width:500px;">' +
                    '<div style="flex:1;">' +
                        '<div style="font-size:13px;font-weight:bold;color:#ffd54f;margin-bottom:4px;">ACROSS</div>' +
                        acrossCluesHTML +
                    '</div>' +
                    '<div style="flex:1;">' +
                        '<div style="font-size:13px;font-weight:bold;color:#4fc3f7;margin-bottom:4px;">DOWN</div>' +
                        downCluesHTML +
                    '</div>' +
                '</div>' +
                '<div style="margin-top:8px;font-size:11px;color:#555;text-align:center;">Click cell to select. Type to fill. Tab/Space to switch direction. Arrow keys to navigate.</div>' +
            '</div>';

        // Attach cell click listeners
        this.ui.querySelectorAll('.cw-cell').forEach(function(cell) {
            cell.addEventListener('click', function() {
                var r = parseInt(cell.dataset.r);
                var c = parseInt(cell.dataset.c);
                self.selectCell(r, c);
            });
        });

        // Timer update
        if (!this.won && this.running && !this._timerInterval) {
            this._timerInterval = this.addInterval(function() {
                if (!self.won && self.running) self.renderUI();
            }, 1000);
        }
    }

    update() {}
    render() {}
}


// Register word games 2
Portal.register({ id: 'spellingbee', name: 'Spelling Bee', category: 'word', icon: '\uD83D\uDC1D', color: 'linear-gradient(135deg,#4a4a0a,#8a8a2a)', Game: SpellingBeeGame, useHTML: true, canvasWidth: 700, canvasHeight: 600, tags: ['spelling', 'letters', 'bee'] });
Portal.register({ id: 'wordladder', name: 'Word Ladder', category: 'word', icon: '\uD83E\uDE9C', color: 'linear-gradient(135deg,#2a1a3a,#5a3a6a)', Game: WordLadderGame, useHTML: true, tags: ['transform', 'chain'] });
Portal.register({ id: 'crossmini', name: 'Crossword Mini', category: 'word', icon: '\u270F\uFE0F', color: 'linear-gradient(135deg,#1a2a1a,#3a5a3a)', Game: CrosswordMiniGame, useHTML: true, canvasWidth: 700, canvasHeight: 700, tags: ['crossword', 'clues'] });
