/* === MATH / QUIZ GAMES (3) === */

// 31. MATH BLITZ - Rapid-fire math problems with 60s timer
class MathBlitzGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.canvas.style.display = 'none';
        this.timeLeft = 60; this.streak = 0; this.bestStreak = 0;
        this.correct = 0; this.wrong = 0; this.level = 1;
        this.answer = ''; this.feedback = ''; this.feedbackTimer = null;
        this.history = [];
        this.generateProblem();
        this.listenKey(e => {
            if (e.key === 'Enter') { this.submitAnswer(); e.preventDefault(); return; }
            if (e.key === 'Backspace') { this.answer = this.answer.slice(0, -1); this.renderUI(); e.preventDefault(); return; }
            if (e.key === '-' && this.answer.length === 0) { this.answer = '-'; this.renderUI(); e.preventDefault(); return; }
            if (/^[0-9]$/.test(e.key)) { this.answer += e.key; this.renderUI(); e.preventDefault(); }
            if (e.key === '.' && !this.answer.includes('.')) { this.answer += '.'; this.renderUI(); e.preventDefault(); }
        });
        this.addInterval(() => {
            if (--this.timeLeft <= 0) {
                this.endGame();
                this.showOverlay('Time\'s Up!', `Score: ${this.score} | ${this.correct} correct, ${this.wrong} wrong | Best streak: ${this.bestStreak}`);
            }
            this.renderUI();
        }, 1000);
        this.renderUI();
        this.loop();
    }
    generateProblem() {
        // Difficulty scales with level
        const ops = this.level < 3 ? ['+', '-'] : this.level < 5 ? ['+', '-', '*'] : ['+', '-', '*', '/'];
        const op = randChoice(ops);
        let a, b, answer;
        const maxNum = Math.min(10 + this.level * 5, 100);
        switch (op) {
            case '+':
                a = randInt(1, maxNum); b = randInt(1, maxNum);
                answer = a + b; break;
            case '-':
                a = randInt(1, maxNum); b = randInt(1, a); // keep answer non-negative for early levels
                if (this.level >= 4) b = randInt(1, maxNum);
                answer = a - b; break;
            case '*':
                a = randInt(2, Math.min(12, 2 + this.level));
                b = randInt(2, Math.min(12, 2 + this.level));
                answer = a * b; break;
            case '/':
                b = randInt(2, Math.min(12, 2 + this.level));
                answer = randInt(1, Math.min(12, 2 + this.level));
                a = b * answer; // ensure clean division
                break;
        }
        this.problem = { a, b, op, answer };
        this.answer = '';
    }
    submitAnswer() {
        const userAns = parseFloat(this.answer);
        if (isNaN(userAns) && this.answer !== '-') return;
        if (isNaN(userAns)) return;
        const isCorrect = Math.abs(userAns - this.problem.answer) < 0.001;
        if (isCorrect) {
            this.correct++;
            this.streak++;
            if (this.streak > this.bestStreak) this.bestStreak = this.streak;
            // Streak bonus: 1x for 0-2, 2x for 3-5, 3x for 6-9, 4x for 10+
            const multiplier = this.streak >= 10 ? 4 : this.streak >= 6 ? 3 : this.streak >= 3 ? 2 : 1;
            const pts = 10 * multiplier;
            this.setScore(this.score + pts);
            this.feedback = `+${pts}${multiplier > 1 ? ' (x' + multiplier + ' streak!)' : ''}`;
            this.history.push({ problem: `${this.problem.a} ${this.problem.op} ${this.problem.b} = ${this.problem.answer}`, correct: true });
            // Level up every 5 correct
            if (this.correct % 5 === 0) this.level++;
        } else {
            this.wrong++;
            this.streak = 0;
            this.feedback = `Wrong! ${this.problem.a} ${this.problem.op} ${this.problem.b} = ${this.problem.answer}`;
            this.history.push({ problem: `${this.problem.a} ${this.problem.op} ${this.problem.b} = ${this.problem.answer}`, correct: false });
        }
        this.generateProblem();
        if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
        this.feedbackTimer = setTimeout(() => { this.feedback = ''; this.renderUI(); }, 1500);
        this.renderUI();
    }
    renderUI() {
        const opSymbol = { '+': '+', '-': '\u2212', '*': '\u00d7', '/': '\u00f7' };
        const streakColor = this.streak >= 10 ? '#ffd700' : this.streak >= 6 ? '#ff6b81' : this.streak >= 3 ? '#4fc3f7' : '#e0e0e0';
        const timerColor = this.timeLeft <= 10 ? '#e94560' : this.timeLeft <= 20 ? '#ffa502' : '#7bed9f';
        const levelNames = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert', 'Master', 'Legend', 'Insane'];
        const levelName = levelNames[Math.min(this.level - 1, levelNames.length - 1)];

        this.ui.innerHTML = `
            <div style="width:100%;max-width:600px;padding:20px;text-align:center;font-family:sans-serif;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <div style="text-align:left;">
                        <div style="font-size:14px;color:#8888aa;">Level ${this.level} - ${levelName}</div>
                        <div style="font-size:13px;color:#666;">Correct: <span style="color:#7bed9f;">${this.correct}</span> | Wrong: <span style="color:#e94560;">${this.wrong}</span></div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:36px;font-weight:700;color:${timerColor};">${this.timeLeft}s</div>
                    </div>
                </div>
                ${this.streak >= 3 ? `<div style="font-size:16px;color:${streakColor};margin-bottom:10px;font-weight:600;">Streak: ${this.streak} 🔥</div>` : ''}
                <div style="background:#16213e;border-radius:16px;padding:30px;margin-bottom:20px;">
                    <div style="font-size:48px;font-weight:700;color:#e0e0e0;margin-bottom:10px;">
                        ${this.problem.a} ${opSymbol[this.problem.op] || this.problem.op} ${this.problem.b}
                    </div>
                    <div style="font-size:16px;color:#8888aa;">= ?</div>
                </div>
                <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:16px;">
                    <div style="background:#1a1a2e;border:2px solid ${this.answer ? '#4fc3f7' : '#2a2a4a'};border-radius:12px;padding:14px 24px;font-size:28px;font-weight:600;color:#e0e0e0;min-width:200px;text-align:center;">
                        ${this.answer || '<span style="color:#555;">Type answer...</span>'}
                    </div>
                </div>
                <div style="font-size:13px;color:#666;margin-bottom:10px;">Press <span style="color:#4fc3f7;">Enter</span> to submit</div>
                <div style="min-height:24px;font-size:16px;font-weight:600;color:${this.feedback.startsWith('+') ? '#7bed9f' : '#e94560'};">
                    ${this.feedback}
                </div>
                ${this.history.length > 0 ? `
                <div style="margin-top:16px;max-height:100px;overflow-y:auto;text-align:left;padding:8px 12px;background:#0f0f1a;border-radius:8px;">
                    ${this.history.slice(-5).reverse().map(h => `<div style="font-size:12px;color:${h.correct ? '#538d4e' : '#e94560'};margin:2px 0;">${h.correct ? '\u2713' : '\u2717'} ${h.problem}</div>`).join('')}
                </div>` : ''}
            </div>`;
    }
    update() {}
    render() {}
}

// 32. NUMBER SEQUENCE - Figure out the pattern
class NumberSequenceGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.canvas.style.display = 'none';
        this.round = 0; this.totalRounds = 10;
        this.answer = ''; this.feedback = ''; this.feedbackTimer = null;
        this.correct = 0; this.hintsUsed = 0; this.showHint = false;
        this.generateSequence();
        this.listenKey(e => {
            if (e.key === 'Enter') { this.submitAnswer(); e.preventDefault(); return; }
            if (e.key === 'Backspace') { this.answer = this.answer.slice(0, -1); this.renderUI(); e.preventDefault(); return; }
            if (e.key === '-' && this.answer.length === 0) { this.answer = '-'; this.renderUI(); e.preventDefault(); return; }
            if (/^[0-9]$/.test(e.key)) { this.answer += e.key; this.renderUI(); e.preventDefault(); }
            if (e.key === '.' && !this.answer.includes('.')) { this.answer += '.'; this.renderUI(); e.preventDefault(); }
            if (e.key === 'h' || e.key === 'H') { this.showHint = true; this.hintsUsed++; this.renderUI(); }
        });
        this.renderUI();
        this.loop();
    }
    generateSequence() {
        this.round++;
        this.answer = '';
        this.showHint = false;
        if (this.round > this.totalRounds) {
            this.endGame();
            this.showOverlay('Game Complete!', `Score: ${this.score} | ${this.correct}/${this.totalRounds} correct`);
            return;
        }
        // Difficulty 1-3 = easy, 4-6 = medium, 7-10 = hard
        const diff = this.round <= 3 ? 'easy' : this.round <= 6 ? 'medium' : 'hard';
        const pattern = this.pickPattern(diff);
        this.currentSequence = pattern.sequence;
        this.correctAnswer = pattern.answer;
        this.missingIndex = pattern.missingIndex;
        this.hintText = pattern.hint;
    }
    pickPattern(diff) {
        const patterns = [];

        if (diff === 'easy') {
            // Arithmetic: +n
            const step = randChoice([2, 3, 4, 5, 6, 7, 8, 10]);
            const start = randInt(1, 20);
            const seq = Array.from({length: 6}, (_, i) => start + step * i);
            const mi = randInt(2, 4);
            patterns.push({ sequence: seq, answer: seq[mi], missingIndex: mi, hint: `Each number increases by ${step}` });

            // Arithmetic: -n
            const step2 = randChoice([2, 3, 4, 5]);
            const start2 = randInt(50, 80);
            const seq2 = Array.from({length: 6}, (_, i) => start2 - step2 * i);
            const mi2 = randInt(2, 4);
            patterns.push({ sequence: seq2, answer: seq2[mi2], missingIndex: mi2, hint: `Each number decreases by ${step2}` });

            // Simple doubles
            const start3 = randChoice([1, 2, 3]);
            const seq3 = Array.from({length: 6}, (_, i) => start3 * Math.pow(2, i));
            const mi3 = randInt(2, 4);
            patterns.push({ sequence: seq3, answer: seq3[mi3], missingIndex: mi3, hint: `Each number is doubled` });
        }

        if (diff === 'medium') {
            // Squares: n^2
            const offset = randInt(1, 5);
            const seq = Array.from({length: 6}, (_, i) => (i + offset) * (i + offset));
            const mi = randInt(2, 4);
            patterns.push({ sequence: seq, answer: seq[mi], missingIndex: mi, hint: `These are perfect squares` });

            // Geometric: *n
            const base = randChoice([2, 3]);
            const mult = randChoice([2, 3]);
            const seq2 = Array.from({length: 6}, (_, i) => base * Math.pow(mult, i));
            const mi2 = randInt(2, 4);
            patterns.push({ sequence: seq2, answer: seq2[mi2], missingIndex: mi2, hint: `Each number is multiplied by ${mult}` });

            // Cubes
            const off2 = randInt(1, 3);
            const seq3 = Array.from({length: 6}, (_, i) => Math.pow(i + off2, 3));
            const mi3 = randInt(2, 4);
            patterns.push({ sequence: seq3, answer: seq3[mi3], missingIndex: mi3, hint: `These are perfect cubes` });

            // Triangular numbers
            const seq4 = Array.from({length: 6}, (_, i) => (i + 1) * (i + 2) / 2);
            const mi4 = randInt(2, 4);
            patterns.push({ sequence: seq4, answer: seq4[mi4], missingIndex: mi4, hint: `These are triangular numbers` });

            // Alternating +a, +b
            const a = randInt(2, 5), b = randInt(2, 5);
            const seq5 = [randInt(1, 10)];
            for (let i = 1; i < 6; i++) seq5.push(seq5[i-1] + (i % 2 === 1 ? a : b));
            const mi5 = randInt(2, 4);
            patterns.push({ sequence: seq5, answer: seq5[mi5], missingIndex: mi5, hint: `Alternates adding ${a} and ${b}` });
        }

        if (diff === 'hard') {
            // Fibonacci-like
            const f1 = randInt(1, 5), f2 = randInt(1, 5);
            const seq = [f1, f2];
            for (let i = 2; i < 7; i++) seq.push(seq[i-1] + seq[i-2]);
            const mi = randInt(3, 5);
            patterns.push({ sequence: seq, answer: seq[mi], missingIndex: mi, hint: `Each number = sum of previous two` });

            // n^2 + n
            const off = randInt(1, 3);
            const seq2 = Array.from({length: 6}, (_, i) => { const n = i + off; return n * n + n; });
            const mi2 = randInt(2, 4);
            patterns.push({ sequence: seq2, answer: seq2[mi2], missingIndex: mi2, hint: `Formula: n\u00b2 + n` });

            // Primes
            const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43];
            const ps = randInt(0, 5);
            const seq3 = primes.slice(ps, ps + 6);
            const mi3 = randInt(2, 4);
            patterns.push({ sequence: seq3, answer: seq3[mi3], missingIndex: mi3, hint: `These are prime numbers` });

            // Powers of n
            const base = randChoice([2, 3]);
            const seq4 = Array.from({length: 6}, (_, i) => Math.pow(base, i + 1));
            const mi4 = randInt(2, 4);
            patterns.push({ sequence: seq4, answer: seq4[mi4], missingIndex: mi4, hint: `Powers of ${base}` });

            // Differences increase by 1 each time
            const s = randInt(1, 5);
            const seq5 = [s];
            for (let i = 1; i < 6; i++) seq5.push(seq5[i-1] + i + 1);
            const mi5 = randInt(2, 4);
            patterns.push({ sequence: seq5, answer: seq5[mi5], missingIndex: mi5, hint: `Differences increase by 1 each time` });

            // Alternating multiply and add
            const m = randChoice([2, 3]), ad = randChoice([1, 2, 3]);
            const seq6 = [randInt(1, 4)];
            for (let i = 1; i < 6; i++) seq6.push(i % 2 === 1 ? seq6[i-1] * m : seq6[i-1] + ad);
            const mi6 = randInt(2, 4);
            patterns.push({ sequence: seq6, answer: seq6[mi6], missingIndex: mi6, hint: `Alternates: \u00d7${m} then +${ad}` });
        }

        return randChoice(patterns);
    }
    submitAnswer() {
        const userAns = parseFloat(this.answer);
        if (isNaN(userAns)) return;
        const isCorrect = Math.abs(userAns - this.correctAnswer) < 0.01;
        if (isCorrect) {
            this.correct++;
            const basePts = this.round <= 3 ? 50 : this.round <= 6 ? 100 : 150;
            const hintPenalty = this.showHint ? Math.floor(basePts * 0.4) : 0;
            const pts = basePts - hintPenalty;
            this.setScore(this.score + pts);
            this.feedback = `Correct! +${pts} points${hintPenalty ? ' (hint penalty)' : ''}`;
        } else {
            this.feedback = `Wrong! The answer was ${this.correctAnswer}`;
        }
        if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
        this.renderUI();
        this.feedbackTimer = setTimeout(() => {
            this.feedback = '';
            this.generateSequence();
            this.renderUI();
        }, 2000);
    }
    renderUI() {
        if (this.round > this.totalRounds) return;
        const seq = this.currentSequence;
        const diffLabel = this.round <= 3 ? 'Easy' : this.round <= 6 ? 'Medium' : 'Hard';
        const diffColor = this.round <= 3 ? '#7bed9f' : this.round <= 6 ? '#ffd54f' : '#e94560';

        // Progress bar
        const progress = ((this.round - 1) / this.totalRounds) * 100;

        this.ui.innerHTML = `
            <div style="width:100%;max-width:650px;padding:20px;text-align:center;font-family:sans-serif;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <div style="font-size:14px;color:#8888aa;">Round ${this.round} / ${this.totalRounds}</div>
                    <div style="font-size:14px;color:${diffColor};font-weight:600;">${diffLabel}</div>
                    <div style="font-size:14px;color:#8888aa;">Score: <span style="color:#4fc3f7;">${this.score}</span></div>
                </div>
                <div style="background:#1a1a2e;border-radius:8px;height:6px;margin-bottom:20px;overflow:hidden;">
                    <div style="background:linear-gradient(90deg,#7c3aed,#e94560);height:100%;width:${progress}%;transition:width 0.3s;border-radius:8px;"></div>
                </div>
                <div style="font-size:16px;color:#8888aa;margin-bottom:16px;">Find the missing number in the sequence:</div>
                <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:24px;">
                    ${seq.map((n, i) => {
                        if (i === this.missingIndex) {
                            return `<div style="width:70px;height:70px;background:#e94560;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;border:2px solid #ff6b81;">?</div>`;
                        }
                        return `<div style="width:70px;height:70px;background:#16213e;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:600;color:#e0e0e0;border:1px solid #2a2a4a;">${n}</div>`;
                    }).join('<div style="color:#555;font-size:20px;">\u2192</div>')}
                </div>
                ${this.showHint ? `<div style="background:#1a2a3a;border:1px solid #2a4a6a;border-radius:8px;padding:10px 16px;margin-bottom:16px;font-size:14px;color:#4fc3f7;">Hint: ${this.hintText}</div>` : `<button onclick="this.blur()" style="background:none;border:1px solid #2a2a4a;color:#8888aa;padding:6px 16px;border-radius:8px;cursor:pointer;font-size:12px;margin-bottom:16px;">Press H for hint (-40% points)</button>`}
                <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:12px;">
                    <div style="background:#1a1a2e;border:2px solid ${this.answer ? '#a29bfe' : '#2a2a4a'};border-radius:12px;padding:14px 24px;font-size:28px;font-weight:600;color:#e0e0e0;min-width:180px;text-align:center;">
                        ${this.answer || '<span style="color:#555;">?</span>'}
                    </div>
                </div>
                <div style="font-size:13px;color:#666;margin-bottom:10px;">Type your answer and press <span style="color:#a29bfe;">Enter</span></div>
                <div style="min-height:24px;font-size:16px;font-weight:600;color:${this.feedback.startsWith('Correct') ? '#7bed9f' : '#e94560'};">
                    ${this.feedback}
                </div>
            </div>`;
    }
    update() {}
    render() {}
}

// 33. QUIZ MASTER - Multiple choice trivia
class QuizMasterGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        this.canvas.style.display = 'none';
        this.questionIndex = 0; this.totalQuestions = 15;
        this.correct = 0; this.answered = false;
        this.selectedChoice = -1; this.timePerQuestion = 15;
        this.timeLeft = this.timePerQuestion;
        this.questions = this.buildQuestionPool();
        shuffle(this.questions);
        this.questions = this.questions.slice(0, this.totalQuestions);

        this.timerInterval = this.addInterval(() => {
            if (this.answered) return;
            if (--this.timeLeft <= 0) {
                this.answered = true;
                this.selectedChoice = -1;
                this.feedback = 'Time\'s up!';
                this.renderUI();
                this.addTimeout(() => this.nextQuestion(), 2000);
            }
            this.renderUI();
        }, 1000);

        this.renderUI();
        this.loop();
    }
    buildQuestionPool() {
        return [
            // Science (10)
            { q: 'What planet is known as the Red Planet?', choices: ['Mars', 'Venus', 'Jupiter', 'Saturn'], correct: 0, cat: 'Science' },
            { q: 'What is the chemical symbol for gold?', choices: ['Go', 'Gd', 'Au', 'Ag'], correct: 2, cat: 'Science' },
            { q: 'How many bones are in the adult human body?', choices: ['186', '206', '226', '246'], correct: 1, cat: 'Science' },
            { q: 'What gas do plants absorb from the atmosphere?', choices: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correct: 2, cat: 'Science' },
            { q: 'What is the largest organ in the human body?', choices: ['Liver', 'Brain', 'Lungs', 'Skin'], correct: 3, cat: 'Science' },
            { q: 'What is the speed of light approximately?', choices: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '100,000 km/s'], correct: 0, cat: 'Science' },
            { q: 'Which element has atomic number 1?', choices: ['Helium', 'Hydrogen', 'Lithium', 'Carbon'], correct: 1, cat: 'Science' },
            { q: 'What is the hardest natural substance on Earth?', choices: ['Steel', 'Titanium', 'Diamond', 'Quartz'], correct: 2, cat: 'Science' },
            { q: 'How many chromosomes do humans have?', choices: ['23', '44', '46', '48'], correct: 2, cat: 'Science' },
            { q: 'What type of celestial object is the Sun?', choices: ['Planet', 'Star', 'Asteroid', 'Comet'], correct: 1, cat: 'Science' },

            // History (8)
            { q: 'In what year did World War II end?', choices: ['1943', '1944', '1945', '1946'], correct: 2, cat: 'History' },
            { q: 'Who was the first President of the United States?', choices: ['Thomas Jefferson', 'John Adams', 'Benjamin Franklin', 'George Washington'], correct: 3, cat: 'History' },
            { q: 'Which ancient civilization built the pyramids at Giza?', choices: ['Romans', 'Greeks', 'Egyptians', 'Persians'], correct: 2, cat: 'History' },
            { q: 'What year did the Berlin Wall fall?', choices: ['1987', '1988', '1989', '1990'], correct: 2, cat: 'History' },
            { q: 'Who wrote the Declaration of Independence?', choices: ['George Washington', 'Thomas Jefferson', 'Ben Franklin', 'John Adams'], correct: 1, cat: 'History' },
            { q: 'What empire was ruled by Julius Caesar?', choices: ['Greek', 'Roman', 'Ottoman', 'Persian'], correct: 1, cat: 'History' },
            { q: 'In what year did the Titanic sink?', choices: ['1910', '1911', '1912', '1913'], correct: 2, cat: 'History' },
            { q: 'Which country gifted the Statue of Liberty to the USA?', choices: ['England', 'Spain', 'Germany', 'France'], correct: 3, cat: 'History' },

            // Geography (8)
            { q: 'What is the largest continent by area?', choices: ['Africa', 'North America', 'Asia', 'Europe'], correct: 2, cat: 'Geography' },
            { q: 'What is the longest river in the world?', choices: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'], correct: 1, cat: 'Geography' },
            { q: 'What is the smallest country in the world?', choices: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correct: 1, cat: 'Geography' },
            { q: 'Mount Everest is located in which mountain range?', choices: ['Andes', 'Alps', 'Rockies', 'Himalayas'], correct: 3, cat: 'Geography' },
            { q: 'Which ocean is the largest?', choices: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correct: 2, cat: 'Geography' },
            { q: 'What is the capital of Australia?', choices: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], correct: 2, cat: 'Geography' },
            { q: 'The Sahara Desert is located on which continent?', choices: ['Asia', 'Africa', 'South America', 'Australia'], correct: 1, cat: 'Geography' },
            { q: 'How many continents are there?', choices: ['5', '6', '7', '8'], correct: 2, cat: 'Geography' },

            // Pop Culture (7)
            { q: 'What film franchise features a character named Darth Vader?', choices: ['Star Trek', 'Star Wars', 'Guardians of the Galaxy', 'The Matrix'], correct: 1, cat: 'Pop Culture' },
            { q: 'What band performed "Bohemian Rhapsody"?', choices: ['The Beatles', 'Led Zeppelin', 'Queen', 'Pink Floyd'], correct: 2, cat: 'Pop Culture' },
            { q: 'In Minecraft, what material is needed to mine diamonds?', choices: ['Gold', 'Stone', 'Iron', 'Wood'], correct: 2, cat: 'Pop Culture' },
            { q: 'What is the name of the fictional country in Black Panther?', choices: ['Wakanda', 'Genovia', 'Sokovia', 'Zamunda'], correct: 0, cat: 'Pop Culture' },
            { q: 'Who created the character Mickey Mouse?', choices: ['Pixar', 'Walt Disney', 'Warner Bros', 'DreamWorks'], correct: 1, cat: 'Pop Culture' },
            { q: 'What social media platform has a ghost as its logo?', choices: ['TikTok', 'Instagram', 'Snapchat', 'X'], correct: 2, cat: 'Pop Culture' },
            { q: 'In the Mario franchise, what is Mario\'s brother\'s name?', choices: ['Wario', 'Luigi', 'Toad', 'Waluigi'], correct: 1, cat: 'Pop Culture' },

            // Math (7)
            { q: 'What is the value of Pi rounded to two decimal places?', choices: ['3.12', '3.14', '3.16', '3.18'], correct: 1, cat: 'Math' },
            { q: 'What is the square root of 144?', choices: ['10', '11', '12', '14'], correct: 2, cat: 'Math' },
            { q: 'How many sides does a hexagon have?', choices: ['5', '6', '7', '8'], correct: 1, cat: 'Math' },
            { q: 'What is 15% of 200?', choices: ['25', '30', '35', '40'], correct: 1, cat: 'Math' },
            { q: 'What is the next prime number after 7?', choices: ['8', '9', '10', '11'], correct: 3, cat: 'Math' },
            { q: 'What is 2 to the power of 10?', choices: ['512', '1024', '2048', '256'], correct: 1, cat: 'Math' },
            { q: 'In a right triangle, what is the longest side called?', choices: ['Base', 'Height', 'Hypotenuse', 'Adjacent'], correct: 2, cat: 'Math' },
        ];
    }
    selectChoice(idx) {
        if (this.answered) return;
        this.answered = true;
        this.selectedChoice = idx;
        const q = this.questions[this.questionIndex];
        if (idx === q.correct) {
            this.correct++;
            // Speed bonus: max 100 pts for instant, min 10 pts at last second
            const speedBonus = Math.max(10, Math.round((this.timeLeft / this.timePerQuestion) * 100));
            this.setScore(this.score + speedBonus);
            this.feedback = `Correct! +${speedBonus} pts`;
        } else {
            this.feedback = `Wrong! Correct answer: ${q.choices[q.correct]}`;
        }
        this.renderUI();
        this.addTimeout(() => this.nextQuestion(), 2000);
    }
    nextQuestion() {
        this.questionIndex++;
        if (this.questionIndex >= this.totalQuestions) {
            this.endGame();
            const pct = Math.round((this.correct / this.totalQuestions) * 100);
            const rating = pct >= 90 ? 'Genius!' : pct >= 70 ? 'Great Job!' : pct >= 50 ? 'Not Bad!' : 'Keep Trying!';
            this.showOverlay(rating, `${this.correct}/${this.totalQuestions} correct (${pct}%) | Score: ${this.score}`);
            return;
        }
        this.answered = false;
        this.selectedChoice = -1;
        this.feedback = '';
        this.timeLeft = this.timePerQuestion;
        this.renderUI();
    }
    renderUI() {
        if (this.questionIndex >= this.totalQuestions) return;
        const q = this.questions[this.questionIndex];
        const progress = (this.questionIndex / this.totalQuestions) * 100;
        const timerPct = (this.timeLeft / this.timePerQuestion) * 100;
        const timerColor = this.timeLeft <= 5 ? '#e94560' : this.timeLeft <= 10 ? '#ffa502' : '#06b6d4';
        const catColors = { Science: '#4fc3f7', History: '#ffa502', Geography: '#7bed9f', 'Pop Culture': '#ff6b81', Math: '#a29bfe' };

        this.ui.innerHTML = `
            <div style="width:100%;max-width:650px;padding:20px;font-family:sans-serif;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <div style="font-size:14px;color:#8888aa;">Question ${this.questionIndex + 1} / ${this.totalQuestions}</div>
                    <div style="font-size:12px;color:${catColors[q.cat] || '#888'};background:#1a1a2e;padding:3px 10px;border-radius:10px;border:1px solid ${catColors[q.cat] || '#333'};">${q.cat}</div>
                    <div style="font-size:14px;color:#8888aa;">Score: <span style="color:#e94560;">${this.score}</span></div>
                </div>
                <div style="background:#1a1a2e;border-radius:8px;height:5px;margin-bottom:6px;overflow:hidden;">
                    <div style="background:linear-gradient(90deg,#06b6d4,#7c3aed);height:100%;width:${progress}%;transition:width 0.3s;border-radius:8px;"></div>
                </div>
                <div style="background:#1a1a2e;border-radius:8px;height:5px;margin-bottom:20px;overflow:hidden;">
                    <div style="background:${timerColor};height:100%;width:${timerPct}%;transition:width 1s linear;border-radius:8px;"></div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                    <div style="font-size:38px;font-weight:700;color:${timerColor};">${this.timeLeft}</div>
                </div>
                <div style="background:#16213e;border-radius:12px;padding:24px;margin-bottom:20px;text-align:center;">
                    <div style="font-size:20px;font-weight:600;color:#e0e0e0;line-height:1.4;">${q.q}</div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
                    ${q.choices.map((c, i) => {
                        let bg = '#1a1a2e';
                        let border = '#2a2a4a';
                        let textColor = '#e0e0e0';
                        if (this.answered) {
                            if (i === q.correct) { bg = '#1a3a1a'; border = '#538d4e'; textColor = '#7bed9f'; }
                            else if (i === this.selectedChoice && i !== q.correct) { bg = '#3a1a1a'; border = '#e94560'; textColor = '#e94560'; }
                            else { bg = '#111'; border = '#222'; textColor = '#555'; }
                        }
                        const labels = ['A', 'B', 'C', 'D'];
                        return `<div onclick="if(!this.dataset.done){this.dataset.done='1';document.querySelector('#game-ui').__quizGame.selectChoice(${i});}" style="background:${bg};border:2px solid ${border};border-radius:10px;padding:14px 16px;cursor:${this.answered ? 'default' : 'pointer'};transition:all 0.2s;display:flex;align-items:center;gap:10px;${!this.answered ? 'cursor:pointer;' : ''}">
                            <span style="background:${this.answered && i === q.correct ? '#538d4e' : '#0f0f1a'};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:${textColor};flex-shrink:0;">${labels[i]}</span>
                            <span style="font-size:15px;color:${textColor};font-weight:500;">${c}</span>
                        </div>`;
                    }).join('')}
                </div>
                <div style="min-height:24px;text-align:center;font-size:16px;font-weight:600;color:${this.feedback && this.feedback.startsWith('Correct') ? '#7bed9f' : '#e94560'};">
                    ${this.feedback || ''}
                </div>
                <div style="text-align:center;margin-top:8px;font-size:12px;color:#555;">
                    ${this.correct} correct so far
                </div>
            </div>`;

        // Store reference for click handler
        this.ui.__quizGame = this;
    }
    update() {}
    render() {}
}

// Register math/quiz games
Portal.register({ id: 'mathblitz', name: 'Math Blitz', category: 'math', icon: '\uD83D\uDD22', color: 'linear-gradient(135deg,#1a3a1a,#3a6a3a)', Game: MathBlitzGame, useHTML: true, tags: ['math', 'arithmetic', 'speed'] });
Portal.register({ id: 'numseq', name: 'Number Sequence', category: 'math', icon: '\uD83D\uDD2E', color: 'linear-gradient(135deg,#3a1a4a,#6a3a8a)', Game: NumberSequenceGame, useHTML: true, tags: ['numbers', 'pattern', 'sequence'] });
Portal.register({ id: 'quizmaster', name: 'Quiz Master', category: 'math', icon: '\uD83E\uDDE0', color: 'linear-gradient(135deg,#0a3a3a,#1a6a6a)', Game: QuizMasterGame, useHTML: true, tags: ['trivia', 'quiz', 'knowledge'] });
