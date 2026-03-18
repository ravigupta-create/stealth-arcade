/* === WORD GAMES 3 (2) === */

// Shared word list for Word Bomb and Letter Drop validation (~500 common words)
const WORD_BOMB_LIST = [
    "the","and","that","have","with","this","will","your","from","they","been","call","come","could",
    "about","above","abuse","after","again","agree","ahead","allow","alone","along","among","angry",
    "apple","arena","avoid","award","awake","bacon","badge","basic","batch","beach","begin","below",
    "bench","birth","black","blade","blame","blank","blast","blaze","bleed","blend","blind","block",
    "blood","bloom","board","bonus","boost","bound","brain","brand","brave","bread","break","breed",
    "brick","brief","bring","broad","broke","brown","brush","build","bunch","burst","cabin","cable",
    "candy","carry","catch","cause","chain","chair","chalk","chaos","charm","chart","chase","cheap",
    "check","cheek","chess","chest","chief","child","chill","china","chunk","claim","clash","class",
    "clean","clear","climb","cling","clock","clone","close","cloud","coach","coast","color","comic",
    "coral","couch","could","count","court","cover","crack","craft","crane","crash","crazy","cream",
    "creek","crime","cross","crowd","crown","crude","crush","curve","cycle","daily","dance","death",
    "delay","dense","depth","dirty","dodge","doing","donor","doubt","dough","draft","drain","drama",
    "drawn","dream","dress","dried","drift","drink","drive","drone","drove","dusty","dying","eager",
    "eagle","early","earth","eight","elect","elite","email","ember","empty","ended","enemy","enjoy",
    "enter","equal","error","essay","event","every","exact","exist","extra","fable","faint","faith",
    "false","fancy","fatal","fault","feast","fence","fetch","fever","field","fifth","fifty","fight",
    "final","first","fixed","flame","flash","flesh","flick","fling","float","flock","flood","floor",
    "fluid","flush","focus","force","forge","forth","forty","found","frame","frank","fraud","fresh",
    "front","frost","fruit","fully","funny","gauge","ghost","giant","given","glare","glass","gleam",
    "globe","gloom","glory","glove","going","grace","grade","grain","grand","grant","grape","graph",
    "grasp","grass","grave","great","greed","green","grief","grill","grind","groan","group","grove",
    "grown","guard","guess","guide","guilt","habit","happy","harsh","haven","heart","heavy","hence",
    "honey","honor","horse","hotel","house","human","humor","hurry","ideal","image","imply","index",
    "inner","input","irony","issue","ivory","jewel","joker","judge","juice","jumbo","karma","knife",
    "knock","known","label","lance","large","laser","later","laugh","layer","learn","lease","least",
    "leave","legal","lemon","level","light","limit","linen","local","lodge","logic","login","loose",
    "lover","lower","loyal","lucky","lunch","lying","lyric","magic","major","maker","mango","manor",
    "maple","march","marsh","match","mayor","media","mercy","merge","merit","merry","messy","metal",
    "meter","might","minor","minus","model","money","month","moral","motor","mount","mouse","mouth",
    "movie","muddy","mural","music","naive","nasty","naval","nerve","never","newly","night","noble",
    "noise","north","noted","novel","nurse","occur","ocean","olive","onset","opera","orbit","order",
    "organ","other","ought","outer","owner","oxide","paint","panel","panic","party","pasta","patch",
    "pause","peace","peach","pearl","penny","phase","phone","photo","piano","piece","pilot","pinch",
    "pitch","pixel","pizza","place","plain","plane","plant","plate","plaza","plead","pluck","plumb",
    "point","polar","porch","pound","power","press","price","pride","prime","print","prior","prize",
    "probe","proof","proud","prove","punch","pupil","purse","queen","query","quest","queue","quick",
    "quiet","quota","quote","radar","radio","rainy","raise","rally","ranch","range","rapid","reach",
    "react","ready","realm","rebel","refer","reign","relax","renew","reply","rider","ridge","rifle",
    "right","rigid","rival","river","robot","rocky","rough","round","route","royal","rugby","ruler",
    "rural","sadly","saint","salad","salon","sandy","sauce","scale","scare","scene","scent","scope",
    "scout","serve","setup","seven","shade","shaft","shake","shall","shame","shape","share","shark",
    "sharp","shave","sheer","sheet","shelf","shell","shift","shine","shirt","shock","shoot","shore",
    "shout","shove","sight","since","sixth","sixty","skill","skull","slate","sleep","slice","slide",
    "slope","smart","smell","smile","smoke","snake","solar","solid","solve","sorry","sound","south",
    "space","spare","spark","speak","spear","speed","spend","spice","spike","spine","spite","split",
    "spoke","spray","squad","stack","staff","stage","stain","stake","stale","stall","stamp","stand",
    "stare","start","state","steak","steal","steam","steel","steep","steer","stern","stick","stiff",
    "still","sting","stock","stone","stood","store","storm","story","stout","stove","strap","straw",
    "strip","stuck","study","stuff","style","sugar","suite","sunny","super","surge","swamp","swear",
    "sweat","sweep","sweet","swept","swift","swing","sword","table","taste","teach","teeth","tempo",
    "tense","terms","theft","their","theme","there","these","thick","thing","think","third","thorn",
    "those","three","threw","throw","thumb","tiger","tight","timer","tired","title","today","token",
    "total","touch","tough","tower","toxic","trace","track","trade","trail","train","trait","trash",
    "treat","trend","trial","tribe","trick","tried","troop","truck","truly","trunk","trust","truth",
    "tumor","twice","twist","ultra","uncle","under","union","unite","unity","until","upper","upset",
    "urban","usage","usual","utter","vague","valid","value","valve","vault","verse","vigor","vinyl",
    "viral","virus","visit","vital","vivid","vocal","voice","voter","vowel","wages","wagon","waist",
    "waste","watch","water","weary","weave","wedge","weird","wheat","wheel","where","which","while",
    "white","whole","whose","wider","width","witch","woman","women","woods","world","worry","worse",
    "worst","worth","would","wound","wrist","write","wrong","wrote","yacht","yield","young","youth",
    "other","think","about","right","there","their","which","would","these","after","could","those",
    "being","first","thing","where","still","every","since","under","might","along","found","place",
    "three","never","shall","world","small","great","should","through","another","between","without",
    "father","mother","brother","sister","teacher","student","kitchen","morning","evening",
    "nothing","another","because","however","already","whether","himself","herself","against",
    "country","problem","program","company","thought","million","special","working","certain",
    "million","history","several","current","society","meeting","perhaps","picture","produce",
    "pattern","weather","whether","neither","either","gather","rather","lather","father","bother",
    "health","wealth","stealth","breath","thread","threat","thresh","sheath","wreath","beneath"
];

// Build a Set for fast lookup (normalize to lowercase)
const WORD_BOMB_SET = new Set(WORD_BOMB_LIST.map(w => w.toLowerCase()));


// ============================================================
// WORD BOMB
// ============================================================
class WordBombGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.canvas.style.display = 'none';

        this.combos = [
            'TH','CH','SH','ST','TR','BR','CR','GR','PL','PR','BL','CL','FL','FR',
            'AN','EN','IN','ON','ER','AR','OR','AL','EL','AT','IT','OT','UT',
            'EA','OU','AI','OA','EI','OO','ND','NK','NT','NG','CK','GH','PH',
            'WH','SC','SK','SL','SM','SN','SP','SW','TW','WR','QU','IG','AG',
            'OW','AW','EW','UB','AB','OB','IM','AM','UM','IF','OF','IS','AS',
            'US','IC','AC','ID','AD','ED','AK','EK','OK','AP','EP','IP','OP','UP'
        ];

        this.currentCombo = '';
        this.currentInput = '';
        this.timeLeft = 8.0;
        this.maxTime = 8.0;
        this.wordsFound = [];
        this.message = '';
        this.messageColor = '#7bed9f';
        this.shaking = false;
        this.bombPulse = 0;
        this.usedWords = new Set();
        this.streak = 0;

        this.pickNewCombo();

        this.listenKey(e => {
            if (!this.running) return;
            if (e.key === 'Enter') {
                this.submitWord();
                e.preventDefault();
            } else if (e.key === 'Backspace') {
                this.currentInput = this.currentInput.slice(0, -1);
                this.renderUI();
                e.preventDefault();
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                this.currentInput += e.key.toUpperCase();
                this.renderUI();
            }
        });

        this._timerInterval = this.addInterval(() => {
            if (!this.running) return;
            this.timeLeft -= 0.05;
            this.bombPulse += 0.1;
            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.running = false;
                this.renderUI();
                this.addTimeout(() => {
                    this.endGame();
                    this.showOverlay('BOOM!', 'Words found: ' + this.wordsFound.length + ' | Score: ' + this.score);
                }, 800);
            }
            this.renderUI();
        }, 50);

        this.renderUI();
    }

    pickNewCombo() {
        this.currentCombo = randChoice(this.combos);
        this.currentInput = '';
    }

    submitWord() {
        const word = this.currentInput.trim().toLowerCase();
        this.currentInput = '';

        if (word.length < 3) {
            this.flashMessage('Too short! (3+ letters)', '#e94560');
            return;
        }

        if (!word.toUpperCase().includes(this.currentCombo)) {
            this.flashMessage('Must contain "' + this.currentCombo + '"!', '#e94560');
            this.shaking = true;
            this.addTimeout(() => { this.shaking = false; this.renderUI(); }, 300);
            return;
        }

        if (this.usedWords.has(word)) {
            this.flashMessage('Already used!', '#e94560');
            return;
        }

        // Validate against word list
        if (!WORD_BOMB_SET.has(word)) {
            this.flashMessage('Not a valid word!', '#e94560');
            this.shaking = true;
            this.addTimeout(() => { this.shaking = false; this.renderUI(); }, 300);
            return;
        }

        // Valid word!
        this.usedWords.add(word);
        this.wordsFound.push(word.toUpperCase());
        this.streak++;
        const points = word.length * 10 + (this.streak > 1 ? this.streak * 5 : 0);
        this.score += points;
        this.setScore(this.score);

        // Reset timer (gets shorter over time)
        this.maxTime = Math.max(3.0, 8.0 - this.wordsFound.length * 0.25);
        this.timeLeft = this.maxTime;

        this.flashMessage('+' + points + (this.streak > 1 ? ' (x' + this.streak + ' streak!)' : '!'), '#7bed9f');
        this.pickNewCombo();
    }

    flashMessage(msg, color) {
        this.message = msg;
        this.messageColor = color;
        this.addTimeout(() => { this.message = ''; this.renderUI(); }, 1200);
    }

    renderUI() {
        if (!this.running && this.timeLeft <= 0) {
            // Explosion state
            this.ui.innerHTML =
                '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#e0e0e0;font-family:sans-serif;">' +
                    '<div style="font-size:80px;animation:explode 0.5s ease-out;">💥</div>' +
                    '<div style="font-size:28px;color:#e94560;font-weight:bold;margin-top:10px;">BOOM!</div>' +
                    '<div style="font-size:16px;color:#aaa;margin-top:8px;">Words: ' + this.wordsFound.length + ' | Score: ' + this.score + '</div>' +
                '</div>';
            return;
        }

        const timePercent = (this.timeLeft / this.maxTime) * 100;
        const timeColor = this.timeLeft > 4 ? '#7bed9f' : this.timeLeft > 2 ? '#ffd54f' : '#e94560';
        const bombScale = this.timeLeft < 2 ? 1 + Math.sin(this.bombPulse * 8) * 0.1 : 1;
        const shakeStyle = this.shaking ? 'animation:shake 0.2s ease-in-out;' : '';

        // Highlight combo in input
        const inputUpper = this.currentInput.toUpperCase();
        const comboIdx = inputUpper.indexOf(this.currentCombo);
        let displayInput;
        if (comboIdx >= 0) {
            const before = this.currentInput.substring(0, comboIdx);
            const match = this.currentInput.substring(comboIdx, comboIdx + this.currentCombo.length);
            const after = this.currentInput.substring(comboIdx + this.currentCombo.length);
            displayInput = this.escHtml(before) + '<span style="color:#7bed9f;font-weight:bold;text-decoration:underline;">' + this.escHtml(match) + '</span>' + this.escHtml(after);
        } else {
            displayInput = this.escHtml(this.currentInput);
        }

        // Recent words
        const recentWords = this.wordsFound.slice(-5).reverse().map(w =>
            '<span style="display:inline-block;background:#1a2a3a;padding:2px 8px;border-radius:4px;margin:2px;font-size:12px;color:#4fc3f7;">' + w + '</span>'
        ).join('');

        this.ui.innerHTML =
            '<style>' +
                '@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}50%{transform:translateX(5px)}75%{transform:translateX(-5px)}}' +
                '@keyframes explode{0%{transform:scale(0.3);opacity:0}50%{transform:scale(1.5);opacity:1}100%{transform:scale(1);opacity:1}}' +
                '@keyframes pulseGlow{0%,100%{text-shadow:0 0 10px rgba(233,69,96,0.5)}50%{text-shadow:0 0 30px rgba(233,69,96,1)}}' +
            '</style>' +
            '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#e0e0e0;font-family:sans-serif;padding:20px;' + shakeStyle + '">' +
                // Score and stats
                '<div style="display:flex;gap:30px;margin-bottom:15px;font-size:13px;color:#888;">' +
                    '<span>Score: <b style="color:#ffd54f;">' + this.score + '</b></span>' +
                    '<span>Words: <b style="color:#4fc3f7;">' + this.wordsFound.length + '</b></span>' +
                    (this.streak > 1 ? '<span>Streak: <b style="color:#7bed9f;">x' + this.streak + '</b></span>' : '') +
                '</div>' +
                // Bomb and timer
                '<div style="font-size:' + Math.floor(60 * bombScale) + 'px;margin-bottom:10px;' +
                    (this.timeLeft < 2 ? 'animation:pulseGlow 0.3s infinite;' : '') + '">💣</div>' +
                // Timer bar
                '<div style="width:300px;height:12px;background:#1a1a2e;border-radius:6px;overflow:hidden;margin-bottom:15px;border:1px solid #333;">' +
                    '<div style="width:' + timePercent + '%;height:100%;background:' + timeColor + ';border-radius:6px;transition:width 0.05s linear;"></div>' +
                '</div>' +
                '<div style="font-size:14px;color:' + timeColor + ';margin-bottom:15px;">' + this.timeLeft.toFixed(1) + 's</div>' +
                // Combo prompt
                '<div style="font-size:16px;color:#aaa;margin-bottom:8px;">Type a word containing:</div>' +
                '<div style="font-size:42px;font-weight:bold;color:#ffd54f;letter-spacing:8px;margin-bottom:20px;text-shadow:0 0 20px rgba(255,213,79,0.5);">' + this.currentCombo + '</div>' +
                // Input display
                '<div style="min-width:280px;min-height:50px;background:#0a0a1a;border:2px solid ' + (comboIdx >= 0 ? '#7bed9f' : '#333') + ';border-radius:8px;padding:10px 20px;font-size:28px;letter-spacing:3px;text-align:center;color:#fff;transition:border-color 0.2s;">' +
                    (displayInput || '<span style="color:#444;">type here...</span>') +
                    '<span style="animation:blink 1s infinite;color:#4fc3f7;">|</span>' +
                '</div>' +
                '<style>@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}</style>' +
                // Message
                '<div style="height:30px;margin-top:10px;font-size:16px;font-weight:bold;color:' + this.messageColor + ';">' + (this.message || '') + '</div>' +
                // Recent words
                (recentWords ? '<div style="margin-top:10px;display:flex;flex-wrap:wrap;justify-content:center;gap:2px;">' + recentWords + '</div>' : '') +
                '<div style="margin-top:auto;font-size:11px;color:#444;padding-top:10px;">Press Enter to submit</div>' +
            '</div>';
    }

    escHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    update() {}
    render() {}
}


// ============================================================
// LETTER DROP
// ============================================================
class LetterDropGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;

        this.cols = 8;
        this.rows = 10;
        this.cellSize = Math.floor(Math.min((W - 40) / this.cols, (H - 120) / this.rows));
        this.gridOx = Math.floor((W - this.cols * this.cellSize) / 2);
        this.gridOy = 50;

        // Letter frequencies weighted by commonness
        this.letterPool = 'AAABBBCDDDEEEEEEFFGGHHHIIIIJKLLLLMMNNNNOOOOPPQRRRRSSSSTTTTTUUUVVWWXYYZ';

        // Grid of letters
        this.grid = [];
        for (let r = 0; r < this.rows; r++) {
            this.grid.push([]);
            for (let c = 0; c < this.cols; c++) {
                this.grid[r].push(this.randomLetter());
            }
        }

        this.selected = []; // [{r,c}] in order
        this.hoverCell = null;
        this.timeLeft = 90;
        this.message = '';
        this.messageColor = '#7bed9f';
        this.wordsFound = 0;
        this.dropAnims = []; // {c, fromR, toR, letter, t, dur}
        this.scoreAnims = []; // {x, y, text, color, t, dur}
        this.sparkles = [];

        // Word validation set (use WORD_BOMB_LIST + WORDS5)
        this.validWords = new Set();
        for (const w of WORD_BOMB_LIST) this.validWords.add(w.toLowerCase());
        for (const w of WORDS5) this.validWords.add(w.toLowerCase());

        this.listenClick(e => {
            if (!this.running) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const col = Math.floor((mx - this.gridOx) / this.cellSize);
            const row = Math.floor((my - this.gridOy) / this.cellSize);
            if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
            this.toggleCell(row, col);
        });

        this.listenMouse('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const col = Math.floor((mx - this.gridOx) / this.cellSize);
            const row = Math.floor((my - this.gridOy) / this.cellSize);
            this.hoverCell = (row >= 0 && row < this.rows && col >= 0 && col < this.cols) ? { r: row, c: col } : null;
        });

        this.listenKey(e => {
            if (!this.running) return;
            if (e.key === 'Enter') {
                this.submitWord();
                e.preventDefault();
            } else if (e.key === 'Escape' || e.key === 'Backspace') {
                if (this.selected.length > 0) {
                    if (e.key === 'Backspace') {
                        this.selected.pop();
                    } else {
                        this.selected = [];
                    }
                }
                e.preventDefault();
            }
        });

        this._timerInterval = this.addInterval(() => {
            this.timeLeft -= 0.1;
            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.running = false;
                this.addTimeout(() => {
                    this.endGame();
                    this.showOverlay('Time Up!', 'Words: ' + this.wordsFound + ' | Score: ' + this.score);
                }, 500);
            }
        }, 100);

        this.loop();
    }

    randomLetter() {
        return this.letterPool[Math.floor(Math.random() * this.letterPool.length)];
    }

    toggleCell(row, col) {
        const idx = this.selected.findIndex(s => s.r === row && s.c === col);
        if (idx >= 0) {
            // Deselect this and everything after it
            this.selected = this.selected.slice(0, idx);
        } else {
            // Must be adjacent to last selected (or first selection)
            if (this.selected.length > 0) {
                const last = this.selected[this.selected.length - 1];
                const dr = Math.abs(last.r - row);
                const dc = Math.abs(last.c - col);
                if (dr > 1 || dc > 1) {
                    // Not adjacent - start new selection
                    this.selected = [{ r: row, c: col }];
                    return;
                }
            }
            this.selected.push({ r: row, c: col });
        }
    }

    getSelectedWord() {
        return this.selected.map(s => this.grid[s.r][s.c]).join('');
    }

    submitWord() {
        if (this.selected.length < 3) {
            this.flashMessage('Select 3+ letters!', '#e94560');
            return;
        }

        const word = this.getSelectedWord().toLowerCase();

        if (!this.validWords.has(word)) {
            this.flashMessage('Not a valid word!', '#e94560');
            this.selected = [];
            return;
        }

        // Valid word! Calculate score
        const len = word.length;
        const points = len <= 3 ? 10 : len === 4 ? 25 : len === 5 ? 50 : len === 6 ? 100 : 150 + (len - 6) * 50;
        this.score += points;
        this.setScore(this.score);
        this.wordsFound++;

        // Score animation at center of selection
        const avgX = this.selected.reduce((s, c) => s + this.gridOx + c.c * this.cellSize + this.cellSize / 2, 0) / this.selected.length;
        const avgY = this.selected.reduce((s, c) => s + this.gridOy + c.r * this.cellSize + this.cellSize / 2, 0) / this.selected.length;
        this.scoreAnims.push({ x: avgX, y: avgY, text: '+' + points, color: '#ffd54f', t: 0, dur: 40 });

        // Sparkles
        for (const cell of this.selected) {
            const cx = this.gridOx + cell.c * this.cellSize + this.cellSize / 2;
            const cy = this.gridOy + cell.r * this.cellSize + this.cellSize / 2;
            for (let i = 0; i < 4; i++) {
                this.sparkles.push({
                    x: cx, y: cy,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6 - 2,
                    t: 0, dur: 25,
                    color: randChoice(['#ffd54f', '#7bed9f', '#4fc3f7', '#e94560'])
                });
            }
        }

        this.flashMessage(word.toUpperCase() + ' +' + points + '!', '#7bed9f');

        // Remove selected letters and drop
        // Mark cells for removal, grouped by column
        const removed = new Set(this.selected.map(s => s.r + ',' + s.c));
        this.selected = [];

        // Process each column
        for (let c = 0; c < this.cols; c++) {
            const colCells = [];
            for (let r = 0; r < this.rows; r++) {
                if (!removed.has(r + ',' + c)) {
                    colCells.push(this.grid[r][c]);
                }
            }
            // Fill from top with new letters
            const newCount = this.rows - colCells.length;
            const newLetters = [];
            for (let i = 0; i < newCount; i++) {
                newLetters.push(this.randomLetter());
            }
            const fullCol = [...newLetters, ...colCells];
            for (let r = 0; r < this.rows; r++) {
                this.grid[r][c] = fullCol[r];
            }
        }
    }

    flashMessage(msg, color) {
        this.message = msg;
        this.messageColor = color;
        this.addTimeout(() => { this.message = ''; }, 1200);
    }

    update() {
        this.scoreAnims = this.scoreAnims.filter(a => { a.t++; return a.t < a.dur; });
        this.sparkles = this.sparkles.filter(s => {
            s.x += s.vx; s.y += s.vy; s.vy += 0.15; s.t++;
            return s.t < s.dur;
        });
    }

    render() {
        const ctx = this.ctx;
        const W = this.canvas.width, H = this.canvas.height;
        const cs = this.cellSize;
        const ox = this.gridOx, oy = this.gridOy;

        this.clear('#0a0f1e');

        // Title and score
        this.text('Letter Drop', W / 2, 18, 18, '#e0e0e0');

        // Timer bar
        const timerW = W - 40;
        const timePercent = Math.max(0, this.timeLeft / 90);
        const timeColor = this.timeLeft > 30 ? '#7bed9f' : this.timeLeft > 10 ? '#ffd54f' : '#e94560';
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath(); ctx.roundRect(20, 30, timerW, 10, 3); ctx.fill();
        ctx.fillStyle = timeColor;
        ctx.beginPath(); ctx.roundRect(20, 30, timerW * timePercent, 10, 3); ctx.fill();

        // Stats line
        const mins = Math.floor(this.timeLeft / 60);
        const secs = Math.floor(this.timeLeft % 60);
        this.text(mins + ':' + (secs < 10 ? '0' : '') + secs, W - 35, 26, 12, timeColor);
        this.text('Words: ' + this.wordsFound, 50, 26, 12, '#4fc3f7', 'left');
        this.text('Score: ' + this.score, W / 2, 26, 12, '#ffd54f');

        // Build set of selected positions for quick lookup
        const selSet = new Set(this.selected.map(s => s.r + ',' + s.c));

        // Draw grid
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = ox + c * cs, y = oy + r * cs;
                const isSelected = selSet.has(r + ',' + c);
                const isHovered = this.hoverCell && this.hoverCell.r === r && this.hoverCell.c === c;
                const selIdx = this.selected.findIndex(s => s.r === r && s.c === c);

                // Cell background
                if (isSelected) {
                    ctx.fillStyle = '#1a3a2a';
                    ctx.strokeStyle = '#7bed9f';
                    ctx.lineWidth = 2;
                } else if (isHovered) {
                    ctx.fillStyle = '#1a2a3a';
                    ctx.strokeStyle = '#4fc3f7';
                    ctx.lineWidth = 1.5;
                } else {
                    ctx.fillStyle = '#121830';
                    ctx.strokeStyle = '#2a2a4a';
                    ctx.lineWidth = 1;
                }
                ctx.beginPath();
                ctx.roundRect(x + 2, y + 2, cs - 4, cs - 4, 4);
                ctx.fill();
                ctx.stroke();

                // Letter
                const letter = this.grid[r][c];
                ctx.font = `bold ${cs * 0.55}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.fillText(letter, x + cs / 2 + 1, y + cs / 2 + 1);
                ctx.fillStyle = isSelected ? '#7bed9f' : '#d0d0e0';
                ctx.fillText(letter, x + cs / 2, y + cs / 2);

                // Selection order number
                if (isSelected && selIdx >= 0) {
                    ctx.font = '10px sans-serif';
                    ctx.fillStyle = '#ffd54f';
                    ctx.fillText(selIdx + 1, x + cs - 10, y + 12);
                }
            }
        }

        // Draw connection lines between selected cells
        if (this.selected.length > 1) {
            ctx.strokeStyle = 'rgba(123,237,159,0.4)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < this.selected.length; i++) {
                const s = this.selected[i];
                const px = ox + s.c * cs + cs / 2;
                const py = oy + s.r * cs + cs / 2;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }

        ctx.textBaseline = 'alphabetic';

        // Current word preview
        if (this.selected.length > 0) {
            const word = this.getSelectedWord();
            const isValid = word.length >= 3 && this.validWords.has(word.toLowerCase());
            const previewY = oy + this.rows * cs + 20;
            ctx.fillStyle = isValid ? '#1a3a2a' : '#2a1a1a';
            ctx.strokeStyle = isValid ? '#7bed9f' : '#e94560';
            ctx.lineWidth = 2;
            const pw = Math.max(200, word.length * 25 + 40);
            ctx.beginPath();
            ctx.roundRect(W / 2 - pw / 2, previewY - 18, pw, 36, 8);
            ctx.fill(); ctx.stroke();
            this.text(word, W / 2, previewY + 2, 20, isValid ? '#7bed9f' : '#e94560');
            if (isValid) {
                this.text('[Enter] to submit', W / 2, previewY + 22, 10, '#7bed9f');
            }
        }

        // Score animations
        for (const a of this.scoreAnims) {
            const progress = a.t / a.dur;
            ctx.globalAlpha = 1 - progress;
            this.text(a.text, a.x, a.y - progress * 30, 22, a.color);
            ctx.globalAlpha = 1;
        }

        // Sparkles
        for (const s of this.sparkles) {
            const progress = s.t / s.dur;
            ctx.globalAlpha = 1 - progress;
            ctx.fillStyle = s.color;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 3 * (1 - progress), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Message
        if (this.message) {
            this.text(this.message, W / 2, H - 12, 14, this.messageColor);
        }

        // Instructions
        if (!this.message) {
            this.text('Click letters to form words (3+). Enter to submit. Esc to clear.', W / 2, H - 12, 11, '#555');
        }
    }
}


// Register word games 3
Portal.register({ id: 'wordbomb', name: 'Word Bomb', category: 'word', icon: '\uD83D\uDCA3', color: 'linear-gradient(135deg,#3a0a0a,#6a2a2a)', Game: WordBombGame, useHTML: true, tags: ['typing', 'speed', 'bomb'] });
Portal.register({ id: 'letterdrop', name: 'Letter Drop', category: 'word', icon: '\uD83C\uDD70\uFE0F', color: 'linear-gradient(135deg,#0a2a3a,#1a5a6a)', Game: LetterDropGame, canvasWidth: 500, canvasHeight: 600, tags: ['puzzle', 'letters', 'drop'] });
