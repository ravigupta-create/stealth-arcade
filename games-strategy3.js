/* === STRATEGY GAMES 3 (3) === */

// ============================================================
// CHESS
// ============================================================
class ChessGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.cellSize = Math.floor(Math.min(W, H - 60) / 8);
        this.boardOx = Math.floor((W - this.cellSize * 8) / 2);
        this.boardOy = 40;

        // Piece constants
        this.EMPTY = 0;
        this.PAWN = 1; this.KNIGHT = 2; this.BISHOP = 3;
        this.ROOK = 4; this.QUEEN = 5; this.KING = 6;
        this.WHITE = 1; this.BLACK = -1;

        // Unicode chess pieces
        this.pieceChars = {};
        this.pieceChars[this.WHITE] = {};
        this.pieceChars[this.BLACK] = {};
        this.pieceChars[this.WHITE][this.KING] = '\u2654';
        this.pieceChars[this.WHITE][this.QUEEN] = '\u2655';
        this.pieceChars[this.WHITE][this.ROOK] = '\u2656';
        this.pieceChars[this.WHITE][this.BISHOP] = '\u2657';
        this.pieceChars[this.WHITE][this.KNIGHT] = '\u2658';
        this.pieceChars[this.WHITE][this.PAWN] = '\u2659';
        this.pieceChars[this.BLACK][this.KING] = '\u265A';
        this.pieceChars[this.BLACK][this.QUEEN] = '\u265B';
        this.pieceChars[this.BLACK][this.ROOK] = '\u265C';
        this.pieceChars[this.BLACK][this.BISHOP] = '\u265D';
        this.pieceChars[this.BLACK][this.KNIGHT] = '\u265E';
        this.pieceChars[this.BLACK][this.PAWN] = '\u265F';

        this.pieceValues = { 1: 100, 2: 320, 3: 330, 4: 500, 5: 900, 6: 20000 };

        // Position tables for evaluation
        this.pawnTable = [
            0,  0,  0,  0,  0,  0,  0,  0,
            50, 50, 50, 50, 50, 50, 50, 50,
            10, 10, 20, 30, 30, 20, 10, 10,
            5,  5, 10, 25, 25, 10,  5,  5,
            0,  0,  0, 20, 20,  0,  0,  0,
            5, -5,-10,  0,  0,-10, -5,  5,
            5, 10, 10,-20,-20, 10, 10,  5,
            0,  0,  0,  0,  0,  0,  0,  0
        ];
        this.knightTable = [
            -50,-40,-30,-30,-30,-30,-40,-50,
            -40,-20,  0,  0,  0,  0,-20,-40,
            -30,  0, 10, 15, 15, 10,  0,-30,
            -30,  5, 15, 20, 20, 15,  5,-30,
            -30,  0, 15, 20, 20, 15,  0,-30,
            -30,  5, 10, 15, 15, 10,  5,-30,
            -40,-20,  0,  5,  5,  0,-20,-40,
            -50,-40,-30,-30,-30,-30,-40,-50
        ];
        this.bishopTable = [
            -20,-10,-10,-10,-10,-10,-10,-20,
            -10,  0,  0,  0,  0,  0,  0,-10,
            -10,  0, 10, 10, 10, 10,  0,-10,
            -10,  5,  5, 10, 10,  5,  5,-10,
            -10,  0, 10, 10, 10, 10,  0,-10,
            -10, 10, 10, 10, 10, 10, 10,-10,
            -10,  5,  0,  0,  0,  0,  5,-10,
            -20,-10,-10,-10,-10,-10,-10,-20
        ];

        this.initBoard();
        this.selected = null;
        this.legalMoves = [];
        this.turn = this.WHITE; // white goes first (player)
        this.playerColor = this.WHITE;
        this.message = 'Your turn (White)';
        this.gameOver_ = false;
        this.captureAnims = [];
        this.lastMove = null;
        this.moveHistory = [];
        this.aiThinking = false;

        this.listenClick(e => {
            if (this.gameOver_ || this.aiThinking) return;
            if (this.turn !== this.playerColor) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const col = Math.floor((mx - this.boardOx) / this.cellSize);
            const row = Math.floor((my - this.boardOy) / this.cellSize);
            if (row < 0 || row > 7 || col < 0 || col > 7) return;
            this.handleClick(row, col);
        });

        this.listenMouse('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const col = Math.floor((mx - this.boardOx) / this.cellSize);
            const row = Math.floor((my - this.boardOy) / this.cellSize);
            this.hoverCell = (row >= 0 && row <= 7 && col >= 0 && col <= 7) ? { r: row, c: col } : null;
        });

        this.loop();
    }

    initBoard() {
        // board[r][c] = { type, color } or null
        this.board = Array.from({length: 8}, () => Array(8).fill(null));
        const back = [this.ROOK, this.KNIGHT, this.BISHOP, this.QUEEN, this.KING, this.BISHOP, this.KNIGHT, this.ROOK];
        for (let c = 0; c < 8; c++) {
            this.board[0][c] = { type: back[c], color: this.BLACK };
            this.board[1][c] = { type: this.PAWN, color: this.BLACK };
            this.board[6][c] = { type: this.PAWN, color: this.WHITE };
            this.board[7][c] = { type: back[c], color: this.WHITE };
        }
        // Castling rights
        this.castling = { wK: true, wQ: true, bK: true, bQ: true };
        // En passant target: { r, c } or null
        this.enPassant = null;
    }

    cloneBoard(board) {
        return board.map(row => row.map(p => p ? { type: p.type, color: p.color } : null));
    }

    handleClick(row, col) {
        const piece = this.board[row][col];
        if (this.selected) {
            // Try to move
            const move = this.legalMoves.find(m => m.toR === row && m.toC === col);
            if (move) {
                this.makeMove(move);
                this.selected = null;
                this.legalMoves = [];

                // Check game state
                if (this.isCheckmate(this.BLACK)) {
                    this.message = 'Checkmate! You win!';
                    this.gameOver_ = true;
                    this.setScore(this.score + 100);
                    this.addTimeout(() => {
                        this.endGame();
                        this.showOverlay('Checkmate!', 'You win! Score: ' + this.score);
                    }, 1500);
                    return;
                }
                if (this.isStalemate(this.BLACK)) {
                    this.message = 'Stalemate! Draw.';
                    this.gameOver_ = true;
                    this.addTimeout(() => {
                        this.endGame();
                        this.showOverlay('Stalemate', 'Draw! Score: ' + this.score);
                    }, 1500);
                    return;
                }

                this.turn = this.BLACK;
                this.message = 'AI thinking...';
                this.aiThinking = true;
                this.addTimeout(() => this.aiMove(), 300);
            } else if (piece && piece.color === this.playerColor) {
                // Select different piece
                this.selected = { r: row, c: col };
                this.legalMoves = this.getLegalMoves(row, col);
            } else {
                this.selected = null;
                this.legalMoves = [];
            }
        } else {
            if (piece && piece.color === this.playerColor) {
                this.selected = { r: row, c: col };
                this.legalMoves = this.getLegalMoves(row, col);
            }
        }
    }

    makeMove(move) {
        const board = this.board;
        const piece = board[move.fromR][move.fromC];
        const captured = board[move.toR][move.toC];

        // Track for scoring
        if (captured) {
            this.score += this.pieceValues[captured.type] || 10;
            if (piece.color === this.playerColor) this.setScore(this.score);
            // Capture animation
            this.captureAnims.push({
                x: this.boardOx + move.toC * this.cellSize + this.cellSize / 2,
                y: this.boardOy + move.toR * this.cellSize + this.cellSize / 2,
                char: this.pieceChars[captured.color][captured.type],
                t: 0, dur: 30
            });
        }

        // En passant capture
        if (move.enPassant) {
            const epR = move.fromR;
            const epC = move.toC;
            const epPiece = board[epR][epC];
            if (epPiece) {
                if (piece.color === this.playerColor) {
                    this.score += this.pieceValues[this.PAWN];
                    this.setScore(this.score);
                }
                this.captureAnims.push({
                    x: this.boardOx + epC * this.cellSize + this.cellSize / 2,
                    y: this.boardOy + epR * this.cellSize + this.cellSize / 2,
                    char: this.pieceChars[epPiece.color][epPiece.type],
                    t: 0, dur: 30
                });
            }
            board[epR][epC] = null;
        }

        // Update en passant
        this.enPassant = null;
        if (piece.type === this.PAWN && Math.abs(move.toR - move.fromR) === 2) {
            this.enPassant = { r: (move.fromR + move.toR) / 2, c: move.fromC };
        }

        // Castling move
        if (move.castle) {
            if (move.castle === 'K') {
                board[move.fromR][5] = board[move.fromR][7];
                board[move.fromR][7] = null;
            } else {
                board[move.fromR][3] = board[move.fromR][0];
                board[move.fromR][0] = null;
            }
        }

        // Update castling rights
        if (piece.type === this.KING) {
            if (piece.color === this.WHITE) { this.castling.wK = false; this.castling.wQ = false; }
            else { this.castling.bK = false; this.castling.bQ = false; }
        }
        if (piece.type === this.ROOK) {
            if (piece.color === this.WHITE) {
                if (move.fromC === 0 && move.fromR === 7) this.castling.wQ = false;
                if (move.fromC === 7 && move.fromR === 7) this.castling.wK = false;
            } else {
                if (move.fromC === 0 && move.fromR === 0) this.castling.bQ = false;
                if (move.fromC === 7 && move.fromR === 0) this.castling.bK = false;
            }
        }

        // Move piece
        board[move.toR][move.toC] = piece;
        board[move.fromR][move.fromC] = null;

        // Pawn promotion
        if (piece.type === this.PAWN) {
            if ((piece.color === this.WHITE && move.toR === 0) || (piece.color === this.BLACK && move.toR === 7)) {
                board[move.toR][move.toC] = { type: this.QUEEN, color: piece.color };
            }
        }

        this.lastMove = move;
        this.moveHistory.push(move);
    }

    // Generate pseudo-legal moves for a piece (before king-safety filtering)
    getPseudoMoves(r, c, board) {
        const piece = board[r][c];
        if (!piece) return [];
        const moves = [];
        const color = piece.color;
        const enemy = -color;
        const add = (toR, toC, extra) => {
            if (toR < 0 || toR > 7 || toC < 0 || toC > 7) return false;
            const target = board[toR][toC];
            if (target && target.color === color) return false;
            moves.push({ fromR: r, fromC: c, toR, toC, ...extra });
            return !target; // continue sliding if empty
        };

        switch (piece.type) {
            case this.PAWN: {
                const dir = color === this.WHITE ? -1 : 1;
                const startRow = color === this.WHITE ? 6 : 1;
                // Forward
                if (!board[r + dir]?.[c]) {
                    moves.push({ fromR: r, fromC: c, toR: r + dir, toC: c });
                    // Double push
                    if (r === startRow && !board[r + dir * 2][c]) {
                        moves.push({ fromR: r, fromC: c, toR: r + dir * 2, toC: c });
                    }
                }
                // Captures
                for (const dc of [-1, 1]) {
                    const nr = r + dir, nc = c + dc;
                    if (nc < 0 || nc > 7 || nr < 0 || nr > 7) continue;
                    if (board[nr][nc] && board[nr][nc].color === enemy) {
                        moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
                    }
                    // En passant
                    if (this.enPassant && this.enPassant.r === nr && this.enPassant.c === nc) {
                        moves.push({ fromR: r, fromC: c, toR: nr, toC: nc, enPassant: true });
                    }
                }
                break;
            }
            case this.KNIGHT: {
                for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
                    add(r + dr, c + dc);
                }
                break;
            }
            case this.BISHOP: {
                for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
                    for (let i = 1; i < 8; i++) { if (!add(r + dr * i, c + dc * i)) break; }
                }
                break;
            }
            case this.ROOK: {
                for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    for (let i = 1; i < 8; i++) { if (!add(r + dr * i, c + dc * i)) break; }
                }
                break;
            }
            case this.QUEEN: {
                for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
                    for (let i = 1; i < 8; i++) { if (!add(r + dr * i, c + dc * i)) break; }
                }
                break;
            }
            case this.KING: {
                for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
                    add(r + dr, c + dc);
                }
                // Castling
                if (color === this.WHITE && r === 7 && c === 4) {
                    if (this.castling.wK && !board[7][5] && !board[7][6] && board[7][7]?.type === this.ROOK && board[7][7]?.color === this.WHITE) {
                        if (!this.isSquareAttacked(7, 4, enemy, board) && !this.isSquareAttacked(7, 5, enemy, board) && !this.isSquareAttacked(7, 6, enemy, board)) {
                            moves.push({ fromR: 7, fromC: 4, toR: 7, toC: 6, castle: 'K' });
                        }
                    }
                    if (this.castling.wQ && !board[7][3] && !board[7][2] && !board[7][1] && board[7][0]?.type === this.ROOK && board[7][0]?.color === this.WHITE) {
                        if (!this.isSquareAttacked(7, 4, enemy, board) && !this.isSquareAttacked(7, 3, enemy, board) && !this.isSquareAttacked(7, 2, enemy, board)) {
                            moves.push({ fromR: 7, fromC: 4, toR: 7, toC: 2, castle: 'Q' });
                        }
                    }
                }
                if (color === this.BLACK && r === 0 && c === 4) {
                    if (this.castling.bK && !board[0][5] && !board[0][6] && board[0][7]?.type === this.ROOK && board[0][7]?.color === this.BLACK) {
                        if (!this.isSquareAttacked(0, 4, enemy, board) && !this.isSquareAttacked(0, 5, enemy, board) && !this.isSquareAttacked(0, 6, enemy, board)) {
                            moves.push({ fromR: 0, fromC: 4, toR: 0, toC: 6, castle: 'K' });
                        }
                    }
                    if (this.castling.bQ && !board[0][3] && !board[0][2] && !board[0][1] && board[0][0]?.type === this.ROOK && board[0][0]?.color === this.BLACK) {
                        if (!this.isSquareAttacked(0, 4, enemy, board) && !this.isSquareAttacked(0, 3, enemy, board) && !this.isSquareAttacked(0, 2, enemy, board)) {
                            moves.push({ fromR: 0, fromC: 4, toR: 0, toC: 2, castle: 'Q' });
                        }
                    }
                }
                break;
            }
        }
        return moves;
    }

    isSquareAttacked(r, c, byColor, board) {
        // Check if square (r,c) is attacked by any piece of byColor
        for (let rr = 0; rr < 8; rr++) {
            for (let cc = 0; cc < 8; cc++) {
                const p = board[rr][cc];
                if (!p || p.color !== byColor) continue;
                // Quick attack check based on piece type
                switch (p.type) {
                    case this.PAWN: {
                        const dir = p.color === this.WHITE ? -1 : 1;
                        if (rr + dir === r && (cc - 1 === c || cc + 1 === c)) return true;
                        break;
                    }
                    case this.KNIGHT: {
                        const dr = Math.abs(rr - r), dc = Math.abs(cc - c);
                        if ((dr === 2 && dc === 1) || (dr === 1 && dc === 2)) return true;
                        break;
                    }
                    case this.BISHOP: {
                        if (Math.abs(rr - r) === Math.abs(cc - c) && rr !== r) {
                            const ddr = r > rr ? 1 : -1, ddc = c > cc ? 1 : -1;
                            let clear = true;
                            for (let i = 1; i < Math.abs(rr - r); i++) {
                                if (board[rr + ddr * i][cc + ddc * i]) { clear = false; break; }
                            }
                            if (clear) return true;
                        }
                        break;
                    }
                    case this.ROOK: {
                        if (rr === r || cc === c) {
                            if (rr === r) {
                                const ddc = c > cc ? 1 : -1;
                                let clear = true;
                                for (let i = cc + ddc; i !== c; i += ddc) {
                                    if (board[rr][i]) { clear = false; break; }
                                }
                                if (clear) return true;
                            } else {
                                const ddr = r > rr ? 1 : -1;
                                let clear = true;
                                for (let i = rr + ddr; i !== r; i += ddr) {
                                    if (board[i][cc]) { clear = false; break; }
                                }
                                if (clear) return true;
                            }
                        }
                        break;
                    }
                    case this.QUEEN: {
                        // Rook-like
                        if (rr === r || cc === c) {
                            if (rr === r) {
                                const ddc = c > cc ? 1 : -1;
                                let clear = true;
                                for (let i = cc + ddc; i !== c; i += ddc) {
                                    if (board[rr][i]) { clear = false; break; }
                                }
                                if (clear) return true;
                            } else {
                                const ddr = r > rr ? 1 : -1;
                                let clear = true;
                                for (let i = rr + ddr; i !== r; i += ddr) {
                                    if (board[i][cc]) { clear = false; break; }
                                }
                                if (clear) return true;
                            }
                        }
                        // Bishop-like
                        if (Math.abs(rr - r) === Math.abs(cc - c) && rr !== r) {
                            const ddr = r > rr ? 1 : -1, ddc = c > cc ? 1 : -1;
                            let clear = true;
                            for (let i = 1; i < Math.abs(rr - r); i++) {
                                if (board[rr + ddr * i][cc + ddc * i]) { clear = false; break; }
                            }
                            if (clear) return true;
                        }
                        break;
                    }
                    case this.KING: {
                        if (Math.abs(rr - r) <= 1 && Math.abs(cc - c) <= 1) return true;
                        break;
                    }
                }
            }
        }
        return false;
    }

    findKing(color, board) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.type === this.KING && board[r][c]?.color === color) return { r, c };
            }
        }
        return null;
    }

    isInCheck(color, board) {
        const king = this.findKing(color, board);
        if (!king) return false;
        return this.isSquareAttacked(king.r, king.c, -color, board);
    }

    getLegalMoves(r, c) {
        return this.getAllLegalMoves(this.board[r][c]?.color || this.WHITE, this.board).filter(m => m.fromR === r && m.fromC === c);
    }

    getAllLegalMoves(color, board) {
        const legal = [];
        const saveCastling = { ...this.castling };
        const saveEP = this.enPassant;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (!board[r][c] || board[r][c].color !== color) continue;
                const pseudo = this.getPseudoMoves(r, c, board);
                for (const move of pseudo) {
                    // Try move on clone
                    const clone = this.cloneBoard(board);
                    clone[move.toR][move.toC] = clone[move.fromR][move.fromC];
                    clone[move.fromR][move.fromC] = null;
                    // En passant capture on clone
                    if (move.enPassant) {
                        clone[move.fromR][move.toC] = null;
                    }
                    // Castling rook on clone
                    if (move.castle === 'K') {
                        clone[move.fromR][5] = clone[move.fromR][7];
                        clone[move.fromR][7] = null;
                    } else if (move.castle === 'Q') {
                        clone[move.fromR][3] = clone[move.fromR][0];
                        clone[move.fromR][0] = null;
                    }
                    if (!this.isInCheck(color, clone)) {
                        legal.push(move);
                    }
                }
            }
        }
        this.castling = saveCastling;
        this.enPassant = saveEP;
        return legal;
    }

    isCheckmate(color) {
        if (!this.isInCheck(color, this.board)) return false;
        return this.getAllLegalMoves(color, this.board).length === 0;
    }

    isStalemate(color) {
        if (this.isInCheck(color, this.board)) return false;
        return this.getAllLegalMoves(color, this.board).length === 0;
    }

    // AI: Minimax with alpha-beta pruning
    evaluateBoard(board) {
        let score = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (!p) continue;
                let val = this.pieceValues[p.type] || 0;
                // Position bonus
                const idx = p.color === this.WHITE ? r * 8 + c : (7 - r) * 8 + c;
                if (p.type === this.PAWN) val += this.pawnTable[idx];
                else if (p.type === this.KNIGHT) val += this.knightTable[idx];
                else if (p.type === this.BISHOP) val += this.bishopTable[idx];
                score += val * p.color; // WHITE = 1, BLACK = -1
            }
        }
        return score;
    }

    minimax(board, depth, alpha, beta, maximizing, color) {
        if (depth === 0) return this.evaluateBoard(board);

        const moves = this.getAllLegalMoves(color, board);
        if (moves.length === 0) {
            if (this.isInCheck(color, board)) {
                return maximizing ? -99999 + (3 - depth) : 99999 - (3 - depth);
            }
            return 0; // stalemate
        }

        // Order moves: captures first for better pruning
        moves.sort((a, b) => {
            const capA = board[a.toR][a.toC] ? this.pieceValues[board[a.toR][a.toC].type] : 0;
            const capB = board[b.toR][b.toC] ? this.pieceValues[board[b.toR][b.toC].type] : 0;
            return capB - capA;
        });

        if (maximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const clone = this.cloneBoard(board);
                clone[move.toR][move.toC] = clone[move.fromR][move.fromC];
                clone[move.fromR][move.fromC] = null;
                if (move.enPassant) clone[move.fromR][move.toC] = null;
                if (move.castle === 'K') { clone[move.fromR][5] = clone[move.fromR][7]; clone[move.fromR][7] = null; }
                if (move.castle === 'Q') { clone[move.fromR][3] = clone[move.fromR][0]; clone[move.fromR][0] = null; }
                // Promotion
                if (clone[move.toR][move.toC]?.type === this.PAWN) {
                    if ((clone[move.toR][move.toC].color === this.WHITE && move.toR === 0) ||
                        (clone[move.toR][move.toC].color === this.BLACK && move.toR === 7)) {
                        clone[move.toR][move.toC] = { type: this.QUEEN, color: clone[move.toR][move.toC].color };
                    }
                }
                const eval_ = this.minimax(clone, depth - 1, alpha, beta, false, -color);
                maxEval = Math.max(maxEval, eval_);
                alpha = Math.max(alpha, eval_);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const clone = this.cloneBoard(board);
                clone[move.toR][move.toC] = clone[move.fromR][move.fromC];
                clone[move.fromR][move.fromC] = null;
                if (move.enPassant) clone[move.fromR][move.toC] = null;
                if (move.castle === 'K') { clone[move.fromR][5] = clone[move.fromR][7]; clone[move.fromR][7] = null; }
                if (move.castle === 'Q') { clone[move.fromR][3] = clone[move.fromR][0]; clone[move.fromR][0] = null; }
                if (clone[move.toR][move.toC]?.type === this.PAWN) {
                    if ((clone[move.toR][move.toC].color === this.WHITE && move.toR === 0) ||
                        (clone[move.toR][move.toC].color === this.BLACK && move.toR === 7)) {
                        clone[move.toR][move.toC] = { type: this.QUEEN, color: clone[move.toR][move.toC].color };
                    }
                }
                const eval_ = this.minimax(clone, depth - 1, alpha, beta, true, -color);
                minEval = Math.min(minEval, eval_);
                beta = Math.min(beta, eval_);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    aiMove() {
        const moves = this.getAllLegalMoves(this.BLACK, this.board);
        if (moves.length === 0) return;

        // Use depth 2 normally, depth 3 for captures
        let bestMove = null;
        let bestEval = Infinity; // AI is BLACK (minimizing)

        const saveCastling = { ...this.castling };
        const saveEP = this.enPassant;

        for (const move of moves) {
            const boardClone = this.cloneBoard(this.board);
            const oldCastling = { ...this.castling };
            const oldEP = this.enPassant;

            boardClone[move.toR][move.toC] = boardClone[move.fromR][move.fromC];
            boardClone[move.fromR][move.fromC] = null;
            if (move.enPassant) boardClone[move.fromR][move.toC] = null;
            if (move.castle === 'K') { boardClone[move.fromR][5] = boardClone[move.fromR][7]; boardClone[move.fromR][7] = null; }
            if (move.castle === 'Q') { boardClone[move.fromR][3] = boardClone[move.fromR][0]; boardClone[move.fromR][0] = null; }
            if (boardClone[move.toR][move.toC]?.type === this.PAWN) {
                if (move.toR === 7) {
                    boardClone[move.toR][move.toC] = { type: this.QUEEN, color: this.BLACK };
                }
            }

            const depth = this.board[move.toR][move.toC] ? 3 : 2;
            const eval_ = this.minimax(boardClone, depth, -Infinity, Infinity, true, this.WHITE);

            if (eval_ < bestEval) {
                bestEval = eval_;
                bestMove = move;
            }

            this.castling = oldCastling;
            this.enPassant = oldEP;
        }

        this.castling = saveCastling;
        this.enPassant = saveEP;

        if (bestMove) {
            this.makeMove(bestMove);
        }

        this.aiThinking = false;

        // Check game state after AI move
        if (this.isCheckmate(this.WHITE)) {
            this.message = 'Checkmate! AI wins.';
            this.gameOver_ = true;
            this.addTimeout(() => {
                this.endGame();
                this.showOverlay('Checkmate!', 'AI wins. Score: ' + this.score);
            }, 1500);
            return;
        }
        if (this.isStalemate(this.WHITE)) {
            this.message = 'Stalemate! Draw.';
            this.gameOver_ = true;
            this.addTimeout(() => {
                this.endGame();
                this.showOverlay('Stalemate', 'Draw! Score: ' + this.score);
            }, 1500);
            return;
        }

        this.turn = this.WHITE;
        this.message = this.isInCheck(this.WHITE, this.board) ? 'Check! Your turn' : 'Your turn (White)';
    }

    update() {
        // Update capture animations
        this.captureAnims = this.captureAnims.filter(a => {
            a.t++;
            return a.t < a.dur;
        });
    }

    render() {
        const ctx = this.ctx;
        const W = this.canvas.width, H = this.canvas.height;
        const cs = this.cellSize;
        const ox = this.boardOx, oy = this.boardOy;

        this.clear('#1a1a2e');

        // Title and message
        this.text('Chess', W / 2, 22, 18, '#e0e0e0');
        this.text(this.message, W / 2, H - 12, 14, this.gameOver_ ? '#e94560' : '#aaa');

        // Draw board
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const x = ox + c * cs, y = oy + r * cs;
                const light = (r + c) % 2 === 0;
                ctx.fillStyle = light ? '#e8d5b5' : '#b58863';

                // Highlight last move
                if (this.lastMove && ((this.lastMove.fromR === r && this.lastMove.fromC === c) || (this.lastMove.toR === r && this.lastMove.toC === c))) {
                    ctx.fillStyle = light ? '#f6f680' : '#baca44';
                }

                // Highlight selected
                if (this.selected && this.selected.r === r && this.selected.c === c) {
                    ctx.fillStyle = '#7fb3d8';
                }

                ctx.fillRect(x, y, cs, cs);

                // Hover highlight
                if (this.hoverCell && this.hoverCell.r === r && this.hoverCell.c === c && !this.gameOver_) {
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(x, y, cs, cs);
                }

                // Legal move indicators
                if (this.legalMoves.some(m => m.toR === r && m.toC === c)) {
                    const piece = this.board[r][c];
                    if (piece) {
                        // Capture: red border
                        ctx.strokeStyle = 'rgba(233,69,96,0.8)';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(x + 2, y + 2, cs - 4, cs - 4);
                    } else {
                        // Move: dot
                        ctx.fillStyle = 'rgba(0,0,0,0.25)';
                        ctx.beginPath();
                        ctx.arc(x + cs / 2, y + cs / 2, cs * 0.15, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                // Draw piece
                const p = this.board[r][c];
                if (p) {
                    const char = this.pieceChars[p.color][p.type];
                    ctx.font = `${cs * 0.75}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    // Shadow for depth
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fillText(char, x + cs / 2 + 2, y + cs / 2 + 2);
                    ctx.fillStyle = p.color === this.WHITE ? '#fff' : '#222';
                    ctx.fillText(char, x + cs / 2, y + cs / 2);
                }
            }
        }

        // Board border
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.strokeRect(ox - 1, oy - 1, cs * 8 + 2, cs * 8 + 2);

        // Rank/file labels
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#888';
        for (let i = 0; i < 8; i++) {
            ctx.fillText(String.fromCharCode(97 + i), ox + i * cs + cs / 2, oy + cs * 8 + 12);
            ctx.fillText(8 - i, ox - 12, oy + i * cs + cs / 2);
        }

        // Check indicator
        if (!this.gameOver_ && this.isInCheck(this.turn, this.board)) {
            const king = this.findKing(this.turn, this.board);
            if (king) {
                const kx = ox + king.c * cs + cs / 2;
                const ky = oy + king.r * cs + cs / 2;
                ctx.strokeStyle = '#e94560';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(kx, ky, cs * 0.4, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Capture animations
        for (const a of this.captureAnims) {
            const progress = a.t / a.dur;
            ctx.globalAlpha = 1 - progress;
            ctx.font = `${cs * (0.75 + progress * 0.5)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#e94560';
            ctx.fillText(a.char, a.x, a.y - progress * 40);
            ctx.globalAlpha = 1;
        }

        // AI thinking indicator
        if (this.aiThinking) {
            const dots = '.'.repeat(Math.floor(Date.now() / 300) % 4);
            this.text('Thinking' + dots, W / 2, H - 30, 12, '#ffd54f');
        }

        ctx.textBaseline = 'alphabetic';
    }
}


// ============================================================
// GO (9x9)
// ============================================================
class Go9Game extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.size = 9;
        this.cellSize = Math.floor(Math.min(W - 60, H - 110) / (this.size - 1));
        this.boardOx = Math.floor((W - this.cellSize * (this.size - 1)) / 2);
        this.boardOy = 55;
        this.stoneRadius = Math.floor(this.cellSize * 0.43);

        this.BLACK_STONE = 1;
        this.WHITE_STONE = 2;
        this.EMPTY = 0;

        this.board = Array.from({length: this.size}, () => Array(this.size).fill(this.EMPTY));
        this.currentPlayer = this.BLACK_STONE; // Black goes first
        this.playerColor = this.BLACK_STONE;
        this.aiColor = this.WHITE_STONE;
        this.blackCaptures = 0;
        this.whiteCaptures = 0;
        this.consecutivePasses = 0;
        this.gameOver_ = false;
        this.lastMove = null;
        this.hoverCell = null;
        this.message = 'Your turn (Black) - Click to place';
        this.prevBoardState = null; // For ko rule
        this.moveCount = 0;
        this.captureAnims = [];

        this.listenClick(e => {
            if (this.gameOver_ || this.currentPlayer !== this.playerColor) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);

            // Check pass button
            const passX = this.canvas.width / 2 - 40;
            const passY = this.canvas.height - 40;
            if (mx >= passX && mx <= passX + 80 && my >= passY && my <= passY + 30) {
                this.pass();
                return;
            }

            const col = Math.round((mx - this.boardOx) / this.cellSize);
            const row = Math.round((my - this.boardOy) / this.cellSize);
            if (row < 0 || row >= this.size || col < 0 || col >= this.size) return;
            this.placeStone(row, col);
        });

        this.listenMouse('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const col = Math.round((mx - this.boardOx) / this.cellSize);
            const row = Math.round((my - this.boardOy) / this.cellSize);
            this.hoverCell = (row >= 0 && row < this.size && col >= 0 && col < this.size) ? { r: row, c: col } : null;
        });

        this.loop();
    }

    boardToString(board) {
        return board.map(r => r.join(',')).join(';');
    }

    placeStone(row, col) {
        if (this.board[row][col] !== this.EMPTY) {
            this.message = 'Occupied!';
            return;
        }

        const color = this.currentPlayer;
        const enemy = color === this.BLACK_STONE ? this.WHITE_STONE : this.BLACK_STONE;

        // Try placement
        const oldBoard = this.board.map(r => [...r]);
        this.board[row][col] = color;

        // Capture enemy groups with no liberties first
        let captured = 0;
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nr = row + dr, nc = col + dc;
            if (nr < 0 || nr >= this.size || nc < 0 || nc >= this.size) continue;
            if (this.board[nr][nc] === enemy) {
                const group = this.getGroup(nr, nc);
                if (this.getLiberties(group) === 0) {
                    captured += group.length;
                    for (const [gr, gc] of group) {
                        this.captureAnims.push({
                            x: this.boardOx + gc * this.cellSize,
                            y: this.boardOy + gr * this.cellSize,
                            color: enemy, t: 0, dur: 20
                        });
                        this.board[gr][gc] = this.EMPTY;
                    }
                }
            }
        }

        // Check self-capture (suicide rule)
        const ownGroup = this.getGroup(row, col);
        if (this.getLiberties(ownGroup) === 0) {
            // Illegal move - suicide
            this.board = oldBoard;
            this.message = 'Suicide not allowed!';
            return;
        }

        // Ko rule: check if board returns to previous state
        const newState = this.boardToString(this.board);
        if (this.prevBoardState && newState === this.prevBoardState) {
            this.board = oldBoard;
            this.message = 'Ko rule violation!';
            return;
        }

        this.prevBoardState = this.boardToString(oldBoard);

        if (color === this.playerColor) this.blackCaptures += captured;
        else this.whiteCaptures += captured;

        this.lastMove = { r: row, c: col };
        this.consecutivePasses = 0;
        this.moveCount++;

        // Update score
        this.score = this.blackCaptures * 10;
        this.setScore(this.score);

        // Switch turn
        this.currentPlayer = enemy;
        if (this.currentPlayer === this.aiColor) {
            this.message = 'AI thinking...';
            this.addTimeout(() => this.aiMove(), 400);
        } else {
            this.message = 'Your turn (Black)';
        }
    }

    pass() {
        this.consecutivePasses++;
        this.lastMove = null;
        if (this.consecutivePasses >= 2) {
            this.endGameScoring();
            return;
        }
        this.currentPlayer = this.currentPlayer === this.BLACK_STONE ? this.WHITE_STONE : this.BLACK_STONE;
        if (this.currentPlayer === this.aiColor) {
            this.message = 'You passed. AI thinking...';
            this.addTimeout(() => this.aiMove(), 400);
        } else {
            this.message = 'AI passed. Your turn.';
        }
    }

    getGroup(r, c) {
        const color = this.board[r][c];
        if (color === this.EMPTY) return [];
        const visited = new Set();
        const group = [];
        const stack = [[r, c]];
        while (stack.length) {
            const [cr, cc] = stack.pop();
            const key = cr * this.size + cc;
            if (visited.has(key)) continue;
            visited.add(key);
            group.push([cr, cc]);
            for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nr = cr + dr, nc = cc + dc;
                if (nr < 0 || nr >= this.size || nc < 0 || nc >= this.size) continue;
                if (this.board[nr][nc] === color && !visited.has(nr * this.size + nc)) {
                    stack.push([nr, nc]);
                }
            }
        }
        return group;
    }

    getLiberties(group) {
        const libertySet = new Set();
        for (const [r, c] of group) {
            for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nr = r + dr, nc = c + dc;
                if (nr < 0 || nr >= this.size || nc < 0 || nc >= this.size) continue;
                if (this.board[nr][nc] === this.EMPTY) libertySet.add(nr * this.size + nc);
            }
        }
        return libertySet.size;
    }

    aiMove() {
        if (this.gameOver_) return;

        // AI: prioritize captures, then play near existing stones, else random
        const legalMoves = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] !== this.EMPTY) continue;
                // Check if legal
                const oldBoard = this.board.map(row => [...row]);
                this.board[r][c] = this.aiColor;
                // Check captures
                let captures = 0;
                for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    const nr = r + dr, nc = c + dc;
                    if (nr < 0 || nr >= this.size || nc < 0 || nc >= this.size) continue;
                    if (this.board[nr][nc] === this.playerColor) {
                        const g = this.getGroup(nr, nc);
                        if (this.getLiberties(g) === 0) captures += g.length;
                    }
                }
                // Check self-capture after enemy removal
                const testBoard = this.board.map(row => [...row]);
                // Simulate captures
                for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    const nr = r + dr, nc = c + dc;
                    if (nr < 0 || nr >= this.size || nc < 0 || nc >= this.size) continue;
                    if (testBoard[nr][nc] === this.playerColor) {
                        const g = this.getGroupOnBoard(nr, nc, testBoard);
                        if (this.getLibertiesOnBoard(g, testBoard) === 0) {
                            for (const [gr, gc] of g) testBoard[gr][gc] = this.EMPTY;
                        }
                    }
                }
                const selfGroup = this.getGroupOnBoard(r, c, testBoard);
                const selfLib = this.getLibertiesOnBoard(selfGroup, testBoard);

                this.board = oldBoard;

                if (selfLib > 0) {
                    // Check ko
                    const simBoard = oldBoard.map(row => [...row]);
                    simBoard[r][c] = this.aiColor;
                    // Apply captures
                    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                        const nr = r + dr, nc = c + dc;
                        if (nr < 0 || nr >= this.size || nc < 0 || nc >= this.size) continue;
                        if (simBoard[nr][nc] === this.playerColor) {
                            const g = this.getGroupOnBoard(nr, nc, simBoard);
                            if (this.getLibertiesOnBoard(g, simBoard) === 0) {
                                for (const [gr, gc] of g) simBoard[gr][gc] = this.EMPTY;
                            }
                        }
                    }
                    const simState = this.boardToString(simBoard);
                    if (!this.prevBoardState || simState !== this.prevBoardState) {
                        // Score: prioritize captures, then adjacency to own stones, then center
                        let score = captures * 50;
                        // Adjacency to own stones
                        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                            const nr = r + dr, nc = c + dc;
                            if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
                                if (oldBoard[nr][nc] === this.aiColor) score += 10;
                                if (oldBoard[nr][nc] === this.playerColor) score += 5;
                            }
                        }
                        // Center preference
                        const distCenter = Math.abs(r - 4) + Math.abs(c - 4);
                        score += (8 - distCenter) * 2;
                        // Randomness
                        score += Math.random() * 8;
                        legalMoves.push({ r, c, score });
                    }
                }
            }
        }

        if (legalMoves.length === 0 || (this.moveCount > 60 && legalMoves.every(m => m.score < 5))) {
            // Pass
            this.consecutivePasses++;
            if (this.consecutivePasses >= 2) {
                this.endGameScoring();
                return;
            }
            this.currentPlayer = this.playerColor;
            this.message = 'AI passed. Your turn.';
            return;
        }

        legalMoves.sort((a, b) => b.score - a.score);
        const best = legalMoves[0];
        this.currentPlayer = this.aiColor;
        this.placeStone(best.r, best.c);
    }

    getGroupOnBoard(r, c, board) {
        const color = board[r][c];
        if (color === this.EMPTY) return [];
        const visited = new Set();
        const group = [];
        const stack = [[r, c]];
        while (stack.length) {
            const [cr, cc] = stack.pop();
            const key = cr * this.size + cc;
            if (visited.has(key)) continue;
            visited.add(key);
            group.push([cr, cc]);
            for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nr = cr + dr, nc = cc + dc;
                if (nr < 0 || nr >= this.size || nc < 0 || nc >= this.size) continue;
                if (board[nr][nc] === color && !visited.has(nr * this.size + nc)) {
                    stack.push([nr, nc]);
                }
            }
        }
        return group;
    }

    getLibertiesOnBoard(group, board) {
        const libertySet = new Set();
        for (const [r, c] of group) {
            for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nr = r + dr, nc = c + dc;
                if (nr < 0 || nr >= this.size || nc < 0 || nc >= this.size) continue;
                if (board[nr][nc] === this.EMPTY) libertySet.add(nr * this.size + nc);
            }
        }
        return libertySet.size;
    }

    countTerritory(color) {
        // Flood fill empty regions, assign to color if bordered by only that color
        const visited = Array.from({length: this.size}, () => Array(this.size).fill(false));
        let territory = 0;

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] !== this.EMPTY || visited[r][c]) continue;
                // Flood fill empty region
                const region = [];
                const stack = [[r, c]];
                let borderColors = new Set();
                while (stack.length) {
                    const [cr, cc] = stack.pop();
                    if (cr < 0 || cr >= this.size || cc < 0 || cc >= this.size) continue;
                    if (visited[cr][cc]) continue;
                    if (this.board[cr][cc] !== this.EMPTY) {
                        borderColors.add(this.board[cr][cc]);
                        continue;
                    }
                    visited[cr][cc] = true;
                    region.push([cr, cc]);
                    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                        stack.push([cr + dr, cc + dc]);
                    }
                }
                if (borderColors.size === 1 && borderColors.has(color)) {
                    territory += region.length;
                }
            }
        }
        return territory;
    }

    endGameScoring() {
        this.gameOver_ = true;
        const blackTerritory = this.countTerritory(this.BLACK_STONE);
        const whiteTerritory = this.countTerritory(this.WHITE_STONE);
        const komi = 6.5; // White gets 6.5 komi for going second

        const blackScore = blackTerritory + this.blackCaptures;
        const whiteScore = whiteTerritory + this.whiteCaptures + komi;

        this.score = Math.round(blackScore * 10);
        this.setScore(this.score);

        const winner = blackScore > whiteScore ? 'Black wins!' : 'White wins!';
        this.message = `Game Over! B: ${blackScore.toFixed(1)} vs W: ${whiteScore.toFixed(1)} - ${winner}`;

        this.addTimeout(() => {
            this.endGame();
            this.showOverlay('Game Over!', `Black: ${blackScore.toFixed(1)} (${blackTerritory} territory + ${this.blackCaptures} captures)\nWhite: ${whiteScore.toFixed(1)} (${whiteTerritory} territory + ${this.whiteCaptures} captures + ${komi} komi)\n${winner}`);
        }, 2000);
    }

    update() {
        this.captureAnims = this.captureAnims.filter(a => { a.t++; return a.t < a.dur; });
    }

    render() {
        const ctx = this.ctx;
        const W = this.canvas.width, H = this.canvas.height;
        const cs = this.cellSize;
        const ox = this.boardOx, oy = this.boardOy;
        const sz = this.size;

        this.clear('#1a1a2e');

        // Title
        this.text('Go (9x9)', W / 2, 20, 18, '#e0e0e0');

        // Scores
        const scoreStr = `Black: ${this.blackCaptures} caps | White: ${this.whiteCaptures} caps`;
        this.text(scoreStr, W / 2, 40, 12, '#aaa');

        // Board background (wood color)
        const boardW = cs * (sz - 1) + 40;
        const boardH = cs * (sz - 1) + 40;
        ctx.fillStyle = '#d4a843';
        ctx.beginPath();
        ctx.roundRect(ox - 20, oy - 20, boardW, boardH, 6);
        ctx.fill();
        ctx.strokeStyle = '#8a6b2a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Grid lines
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i < sz; i++) {
            // Horizontal
            ctx.beginPath();
            ctx.moveTo(ox, oy + i * cs);
            ctx.lineTo(ox + (sz - 1) * cs, oy + i * cs);
            ctx.stroke();
            // Vertical
            ctx.beginPath();
            ctx.moveTo(ox + i * cs, oy);
            ctx.lineTo(ox + i * cs, oy + (sz - 1) * cs);
            ctx.stroke();
        }

        // Star points (hoshi)
        const stars = [[2, 2], [2, 6], [4, 4], [6, 2], [6, 6]];
        for (const [sr, sc] of stars) {
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(ox + sc * cs, oy + sr * cs, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Hover indicator
        if (this.hoverCell && !this.gameOver_ && this.currentPlayer === this.playerColor) {
            const { r, c } = this.hoverCell;
            if (this.board[r][c] === this.EMPTY) {
                ctx.fillStyle = 'rgba(0,0,0,0.25)';
                ctx.beginPath();
                ctx.arc(ox + c * cs, oy + r * cs, this.stoneRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Stones
        for (let r = 0; r < sz; r++) {
            for (let c = 0; c < sz; c++) {
                if (this.board[r][c] === this.EMPTY) continue;
                const sx = ox + c * cs, sy = oy + r * cs;
                const isBlack = this.board[r][c] === this.BLACK_STONE;

                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.arc(sx + 2, sy + 2, this.stoneRadius, 0, Math.PI * 2);
                ctx.fill();

                // Stone
                const grad = ctx.createRadialGradient(sx - 4, sy - 4, 2, sx, sy, this.stoneRadius);
                if (isBlack) {
                    grad.addColorStop(0, '#555');
                    grad.addColorStop(1, '#111');
                } else {
                    grad.addColorStop(0, '#fff');
                    grad.addColorStop(1, '#ccc');
                }
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(sx, sy, this.stoneRadius, 0, Math.PI * 2);
                ctx.fill();

                // Highlight for last move
                if (this.lastMove && this.lastMove.r === r && this.lastMove.c === c) {
                    ctx.strokeStyle = isBlack ? '#4fc3f7' : '#e94560';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(sx, sy, this.stoneRadius * 0.5, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }

        // Capture animations
        for (const a of this.captureAnims) {
            const progress = a.t / a.dur;
            ctx.globalAlpha = 1 - progress;
            const isBlack = a.color === this.BLACK_STONE;
            ctx.fillStyle = isBlack ? '#333' : '#ddd';
            ctx.beginPath();
            ctx.arc(a.x, a.y, this.stoneRadius * (1 + progress * 0.5), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Pass button
        if (!this.gameOver_ && this.currentPlayer === this.playerColor) {
            const btnX = W / 2 - 40, btnY = H - 40;
            ctx.fillStyle = '#2a2a4a';
            ctx.strokeStyle = '#4fc3f7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(btnX, btnY, 80, 30, 6);
            ctx.fill(); ctx.stroke();
            this.text('Pass', W / 2, btnY + 19, 14, '#4fc3f7');
        }

        // Message
        this.text(this.message, W / 2, H - 8, 12, this.gameOver_ ? '#e94560' : '#aaa');

        // Coordinate labels
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#666';
        const cols = 'ABCDEFGHJ'; // Go skips I
        for (let i = 0; i < sz; i++) {
            ctx.fillText(cols[i], ox + i * cs, oy - 10);
            ctx.fillText(sz - i, ox - 14, oy + i * cs + 4);
        }
    }
}


// ============================================================
// HEX
// ============================================================
class HexGame extends CanvasGame {
    start() {
        this.running = true; this.score = 0; this.api.setScore(0);
        const W = this.canvas.width, H = this.canvas.height;
        this.size = 11;
        this.hexRadius = Math.floor(Math.min((W - 80) / (this.size * 1.75 + 0.5), (H - 100) / (this.size * 1.55)) * 0.55);
        this.hexW = this.hexRadius * Math.sqrt(3);
        this.hexH = this.hexRadius * 2;

        // Calculate board offset to center it
        const totalW = this.hexW * this.size + this.hexW * 0.5 * (this.size - 1);
        const totalH = this.hexH * 0.75 * (this.size - 1) + this.hexH;
        this.boardOx = Math.floor((W - totalW) / 2) + 20;
        this.boardOy = Math.floor((H - totalH) / 2) + 15;

        this.RED = 1;   // Player: connects top-bottom
        this.BLUE = 2;  // AI: connects left-right
        this.EMPTY = 0;

        this.board = Array.from({length: this.size}, () => Array(this.size).fill(this.EMPTY));
        this.playerColor = this.RED;
        this.aiColor = this.BLUE;
        this.currentPlayer = this.RED;
        this.gameOver_ = false;
        this.hoverCell = null;
        this.lastMove = null;
        this.message = 'Your turn (Red) - Connect top to bottom';
        this.moveCount = 0;
        this.winPath = [];
        this.placeAnims = [];

        this.listenClick(e => {
            if (this.gameOver_ || this.currentPlayer !== this.playerColor) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const cell = this.pixelToHex(mx, my);
            if (!cell) return;
            this.placeHex(cell.r, cell.c);
        });

        this.listenMouse('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            this.hoverCell = this.pixelToHex(mx, my);
        });

        this.loop();
    }

    hexToPixel(r, c) {
        const x = this.boardOx + c * this.hexW + r * this.hexW * 0.5;
        const y = this.boardOy + r * this.hexH * 0.75;
        return { x, y };
    }

    pixelToHex(mx, my) {
        let closest = null;
        let minDist = Infinity;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const { x, y } = this.hexToPixel(r, c);
                const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
                if (dist < this.hexRadius && dist < minDist) {
                    minDist = dist;
                    closest = { r, c };
                }
            }
        }
        return closest;
    }

    placeHex(r, c) {
        if (this.board[r][c] !== this.EMPTY) return;

        this.board[r][c] = this.currentPlayer;
        this.lastMove = { r, c };
        this.moveCount++;

        // Place animation
        this.placeAnims.push({ r, c, t: 0, dur: 15 });

        // Check win
        if (this.checkWin(this.currentPlayer)) {
            this.gameOver_ = true;
            const winner = this.currentPlayer === this.playerColor ? 'You win!' : 'AI wins!';
            this.message = winner;
            if (this.currentPlayer === this.playerColor) {
                this.score = Math.max(10, 100 - this.moveCount);
                this.setScore(this.score);
            }
            this.addTimeout(() => {
                this.endGame();
                this.showOverlay(winner, this.currentPlayer === this.playerColor ?
                    'Connected top to bottom! Score: ' + this.score :
                    'AI connected left to right.');
            }, 2000);
            return;
        }

        // Switch turn
        this.currentPlayer = this.currentPlayer === this.RED ? this.BLUE : this.RED;
        if (this.currentPlayer === this.aiColor) {
            this.message = 'AI thinking...';
            this.addTimeout(() => this.aiMove(), 300);
        } else {
            this.message = 'Your turn (Red)';
        }
    }

    getNeighbors(r, c) {
        const dirs = [[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0]];
        const neighbors = [];
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
                neighbors.push({ r: nr, c: nc });
            }
        }
        return neighbors;
    }

    checkWin(color) {
        // RED connects top (r=0) to bottom (r=size-1)
        // BLUE connects left (c=0) to right (c=size-1)
        const visited = new Set();
        const startCells = [];

        if (color === this.RED) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[0][c] === color) startCells.push({ r: 0, c });
            }
        } else {
            for (let r = 0; r < this.size; r++) {
                if (this.board[r][0] === color) startCells.push({ r, c: 0 });
            }
        }

        // BFS with path tracking
        const parentMap = new Map();
        const queue = [...startCells];
        for (const cell of startCells) {
            visited.add(cell.r * this.size + cell.c);
            parentMap.set(cell.r * this.size + cell.c, null);
        }

        while (queue.length) {
            const { r, c } = queue.shift();
            // Check if reached other side
            if ((color === this.RED && r === this.size - 1) || (color === this.BLUE && c === this.size - 1)) {
                // Trace back path for highlight
                this.winPath = [];
                let key = r * this.size + c;
                while (key !== null) {
                    this.winPath.push({ r: Math.floor(key / this.size), c: key % this.size });
                    key = parentMap.get(key);
                }
                return true;
            }

            for (const nb of this.getNeighbors(r, c)) {
                const key = nb.r * this.size + nb.c;
                if (visited.has(key) || this.board[nb.r][nb.c] !== color) continue;
                visited.add(key);
                parentMap.set(key, r * this.size + c);
                queue.push(nb);
            }
        }
        return false;
    }

    aiMove() {
        if (this.gameOver_) return;

        // Strategy: try to connect left-right using a shortest-path heuristic
        // Score each empty cell by how much it improves connectivity
        const legalMoves = [];

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] !== this.EMPTY) continue;
                let score = 0;

                // Adjacency to own stones
                for (const nb of this.getNeighbors(r, c)) {
                    if (this.board[nb.r][nb.c] === this.aiColor) score += 15;
                    if (this.board[nb.r][nb.c] === this.playerColor) score += 3; // Block
                }

                // Being on the path between left and right (center columns preferred)
                const centerDist = Math.abs(c - (this.size - 1) / 2);
                score += (this.size - centerDist) * 2;

                // Bonus for connecting to edges
                if (c === 0 || c === this.size - 1) score += 10;

                // Bridge patterns - check if placing here creates a virtual connection
                for (const nb of this.getNeighbors(r, c)) {
                    if (this.board[nb.r][nb.c] !== this.aiColor) continue;
                    for (const nb2 of this.getNeighbors(r, c)) {
                        if (nb2.r === nb.r && nb2.c === nb.c) continue;
                        if (this.board[nb2.r][nb2.c] === this.aiColor) score += 8;
                    }
                }

                // Block player connections: check if player would win here
                this.board[r][c] = this.playerColor;
                if (this.checkWin(this.playerColor)) score += 100;
                this.board[r][c] = this.EMPTY;
                this.winPath = [];

                // Check if AI would win here
                this.board[r][c] = this.aiColor;
                if (this.checkWin(this.aiColor)) score += 200;
                this.board[r][c] = this.EMPTY;
                this.winPath = [];

                score += Math.random() * 5;
                legalMoves.push({ r, c, score });
            }
        }

        if (legalMoves.length === 0) return;

        legalMoves.sort((a, b) => b.score - a.score);
        const best = legalMoves[0];
        this.currentPlayer = this.aiColor;
        this.placeHex(best.r, best.c);
    }

    drawHexagon(ctx, x, y, radius, fillColor, strokeColor, strokeWidth) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 6 + i * Math.PI / 3;
            const hx = x + radius * Math.cos(angle);
            const hy = y + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        if (fillColor) { ctx.fillStyle = fillColor; ctx.fill(); }
        if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = strokeWidth || 1; ctx.stroke(); }
    }

    update() {
        this.placeAnims = this.placeAnims.filter(a => { a.t++; return a.t < a.dur; });
    }

    render() {
        const ctx = this.ctx;
        const W = this.canvas.width, H = this.canvas.height;

        this.clear('#0f1a2e');

        // Title
        this.text('Hex (11x11)', W / 2, 18, 18, '#e0e0e0');
        this.text(this.message, W / 2, H - 10, 13, this.gameOver_ ? '#ffd54f' : '#aaa');

        // Edge indicators: Red top/bottom, Blue left/right
        // Top edge - red
        for (let c = 0; c < this.size; c++) {
            const { x, y } = this.hexToPixel(0, c);
            this.drawHexagon(ctx, x, y - this.hexH * 0.38, this.hexRadius * 0.3, 'rgba(233,69,96,0.3)', null, 0);
        }
        // Bottom edge - red
        for (let c = 0; c < this.size; c++) {
            const { x, y } = this.hexToPixel(this.size - 1, c);
            this.drawHexagon(ctx, x, y + this.hexH * 0.38, this.hexRadius * 0.3, 'rgba(233,69,96,0.3)', null, 0);
        }
        // Left edge - blue
        for (let r = 0; r < this.size; r++) {
            const { x, y } = this.hexToPixel(r, 0);
            this.drawHexagon(ctx, x - this.hexW * 0.55, y, this.hexRadius * 0.3, 'rgba(79,195,247,0.3)', null, 0);
        }
        // Right edge - blue
        for (let r = 0; r < this.size; r++) {
            const { x, y } = this.hexToPixel(r, this.size - 1);
            this.drawHexagon(ctx, x + this.hexW * 0.55, y, this.hexRadius * 0.3, 'rgba(79,195,247,0.3)', null, 0);
        }

        // Draw hexagons
        const isOnWinPath = (r, c) => this.winPath.some(p => p.r === r && p.c === c);

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const { x, y } = this.hexToPixel(r, c);
                let fill, stroke, sw;

                if (this.board[r][c] === this.RED) {
                    fill = isOnWinPath(r, c) ? '#ff6b8a' : '#e94560';
                    stroke = isOnWinPath(r, c) ? '#ffd54f' : '#c33';
                    sw = isOnWinPath(r, c) ? 3 : 1.5;
                } else if (this.board[r][c] === this.BLUE) {
                    fill = isOnWinPath(r, c) ? '#7fd8ff' : '#4fc3f7';
                    stroke = isOnWinPath(r, c) ? '#ffd54f' : '#2980b9';
                    sw = isOnWinPath(r, c) ? 3 : 1.5;
                } else {
                    fill = '#1e2d4a';
                    stroke = '#3a5070';
                    sw = 1;
                }

                // Hover highlight
                if (this.hoverCell && this.hoverCell.r === r && this.hoverCell.c === c && this.board[r][c] === this.EMPTY && !this.gameOver_) {
                    fill = this.currentPlayer === this.RED ? 'rgba(233,69,96,0.4)' : 'rgba(79,195,247,0.4)';
                    stroke = '#fff';
                    sw = 2;
                }

                this.drawHexagon(ctx, x, y, this.hexRadius - 1, fill, stroke, sw);

                // Place animation (pulse)
                const anim = this.placeAnims.find(a => a.r === r && a.c === c);
                if (anim) {
                    const progress = anim.t / anim.dur;
                    ctx.globalAlpha = 0.5 * (1 - progress);
                    this.drawHexagon(ctx, x, y, this.hexRadius * (1 + progress * 0.3), null, '#fff', 2);
                    ctx.globalAlpha = 1;
                }

                // Last move marker
                if (this.lastMove && this.lastMove.r === r && this.lastMove.c === c && !this.gameOver_) {
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Legend
        ctx.fillStyle = '#e94560';
        ctx.beginPath(); ctx.arc(30, H - 12, 6, 0, Math.PI * 2); ctx.fill();
        this.text('Red (You: Top-Bottom)', 110, H - 8, 10, '#e94560', 'center');
        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath(); ctx.arc(W - 160, H - 12, 6, 0, Math.PI * 2); ctx.fill();
        this.text('Blue (AI: Left-Right)', W - 85, H - 8, 10, '#4fc3f7', 'center');
    }
}


// Register strategy games 3
Portal.register({ id: 'chess', name: 'Chess', category: 'strategy', icon: '\u265F', color: 'linear-gradient(135deg,#1a1a1a,#3a3a3a)', Game: ChessGame, canvasWidth: 600, canvasHeight: 600, tags: ['board', 'classic', 'ai'] });
Portal.register({ id: 'go9', name: 'Go (9x9)', category: 'strategy', icon: '\u26AB', color: 'linear-gradient(135deg,#2a1a0a,#5a3a1a)', Game: Go9Game, canvasWidth: 600, canvasHeight: 650, tags: ['board', 'territory', 'classic'] });
Portal.register({ id: 'hex', name: 'Hex', category: 'strategy', icon: '\u2B21', color: 'linear-gradient(135deg,#1a2a3a,#3a5a7a)', Game: HexGame, canvasWidth: 700, canvasHeight: 600, tags: ['board', 'connection', 'hex'] });
