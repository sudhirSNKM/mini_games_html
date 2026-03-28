/* ─────────────────────────────────────────────
   connect4.js – NeonArcade Connect Four (2 Player Pass & Play)
   ─────────────────────────────────────────────── */
'use strict';

class Connect4Game {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.running = false;
    this._container = null;
    this.rows = 6;
    this.cols = 7;
    this.board = []; // 0: empty, 1: P1, 2: P2
    this.currentPlayer = 1;
    this.winner = null;
    this.winCells = [];
    this.isAnimating = false;
    this.dropY = -1;
    this.dropCol = -1;
  }

  mount(container) {
    this._container = container;
    this._buildUI(container);
    this._initBoard();
  }

  _buildUI(container) {
    container.innerHTML = `
      <div id="c4-root">
        <div class="c4-top">
          <div id="c4-status" class="c4-status"></div>
        </div>
        <div id="c4-board-wrap" class="c4-board-wrap">
          <canvas id="c4-canvas" width="490" height="420"></canvas>
        </div>
        <div class="c4-controls">
          <div id="c4-msg" class="c4-msg">Drop a token to start!</div>
        </div>
      </div>`;
    
    this.canvas = container.querySelector('#c4-canvas');
    this.ctx = this.canvas.getContext('2d');
    this._resizeCanvas();
    this.canvas.addEventListener('mousedown', (e) => this._onClick(e));
    this.canvas.addEventListener('mousemove', (e) => this._onMove(e));
    
    this._updateStatus();
    this._draw();
  }

  _initBoard() {
    this.board = Array.from({ length: this.rows }, () => new Array(this.cols).fill(0));
    this.currentPlayer = 1;
    this.winner = null;
    this.winCells = [];
    this.running = true;
  }

  _resizeCanvas() {
    if (!this.canvas) return;
    const wrap = this._container.querySelector('#c4-board-wrap');
    const size = Math.min(wrap.clientWidth || 490, 490);
    this.canvas.width = size;
    this.canvas.height = size * (6/7);
    this._draw();
  }

  _updateStatus() {
    const statusEl = this._container.querySelector('#c4-status');
    const user = typeof UserSystem !== 'undefined' ? UserSystem.getCurrentUser() : {name:'Player 1'};
    const p1Name = user.name || 'Player 1';
    const p2Name = 'Opponent';

    if (this.winner) {
      const winnerName = this.winner === 1 ? p1Name : p2Name;
      statusEl.innerHTML = `<span class="c4-win-text" style="color:${this.winner === 1 ? '#00f5ff' : '#ff2d6b'}">${winnerName} Wins! 🏆</span>`;
    } else {
      statusEl.innerHTML = `
        <div class="c4-turn-pill" style="border-color:${this.currentPlayer === 1 ? '#00f5ff' : '#ff2d6b'}">
          <span class="c4-dot" style="background:${this.currentPlayer === 1 ? '#00f5ff' : '#ff2d6b'}"></span>
          <span>${this.currentPlayer === 1 ? p1Name : p2Name}'s Turn</span>
        </div>`;
    }
  }

  _onMove(e) {
    if (!this.running || this.winner || this.isAnimating) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const colWidth = this.canvas.width / this.cols;
    this.hoverCol = Math.floor(x / colWidth);
    this._draw();
  }

  _onClick(e) {
    if (!this.running || this.winner || this.isAnimating) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const colWidth = this.canvas.width / this.cols;
    const col = Math.floor(x / colWidth);
    
    this._dropToken(col);
  }

  _dropToken(col) {
    if (col < 0 || col >= this.cols) return;
    
    // Find bottom-most empty row
    let row = -1;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.board[r][col] === 0) {
        row = r;
        break;
      }
    }

    if (row === -1) return; // Column full

    this.isAnimating = true;
    this.dropCol = col;
    this.dropTargetRow = row;
    this.dropY = -1; // Start above

    const speed = 0.4;
    const animate = () => {
      this.dropY += speed;
      if (this.dropY >= row) {
        this.dropY = -1;
        this.board[row][col] = this.currentPlayer;
        this.isAnimating = false;
        this._checkWin(row, col);
        if (!this.winner) {
          this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
          this._updateStatus();
        }
        this._draw();
      } else {
        this._draw();
        requestAnimationFrame(animate);
      }
    };
    animate();
    if (typeof Audio !== 'undefined') Audio.click();
  }

  _checkWin(r, c) {
    const directions = [
      [ [0, 1], [0, -1] ], // horizontal
      [ [1, 0], [-1, 0] ], // vertical
      [ [1, 1], [-1, -1] ], // diagonal 1
      [ [1, -1], [-1, 1] ]  // diagonal 2
    ];

    const player = this.board[r][c];

    for (let d = 0; d < directions.length; d++) {
      let count = 1;
      let cells = [[r, c]];
      
      for (let i = 0; i < 2; i++) {
        const [dr, dc] = directions[d][i];
        let currR = r + dr;
        let currC = c + dc;
        
        while (currR >= 0 && currR < this.rows && currC >= 0 && currC < this.cols && this.board[currR][currC] === player) {
          count++;
          cells.push([currR, currC]);
          currR += dr;
          currC += dc;
        }
      }

      if (count >= 4) {
        this.winner = player;
        this.winCells = cells;
        this._updateStatus();
        if (typeof MainApp !== 'undefined') {
          MainApp.gameOver('connect4', 1000, `${player === 1 ? 'Player 1' : 'Player 2'} Wins!`, true);
        }
        return;
      }
    }

    // Check draw
    if (this.board.every(row => row.every(cell => cell !== 0))) {
      this.winner = -1; // Draw
      if (typeof MainApp !== 'undefined') {
        MainApp.gameOver('connect4', 500, "It's a Draw!", false);
      }
    }
  }

  _draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const S = this.canvas.width;
    const H = this.canvas.height;
    const colW = S / this.cols;
    const rowH = H / this.rows;
    const r = Math.min(colW, rowH) * 0.4;

    ctx.clearRect(0, 0, S, H);

    // Draw board back
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, S, H);

    // Draw background holes (for depth)
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = col * colW + colW / 2;
        const y = row * rowH + rowH / 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#05070c';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.stroke();
      }
    }

    // Draw animating token
    if (this.isAnimating) {
      const x = this.dropCol * colW + colW / 2;
      const y = this.dropY * rowH + rowH / 2;
      this._drawToken(ctx, x, y, r, this.currentPlayer);
    }

    // Draw tokens on board
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const p = this.board[row][col];
        if (p > 0) {
          const x = col * colW + colW / 2;
          const y = row * rowH + rowH / 2;
          const isWin = this.winCells.some(c => c[0] === row && c[1] === col);
          this._drawToken(ctx, x, y, r, p, isWin);
        }
      }
    }

    // Draw grid overlay (neon bars)
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.1)';
    ctx.lineWidth = 4;
    for (let c = 0; c <= this.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * colW, 0);
      ctx.lineTo(c * colW, H);
      ctx.stroke();
    }
    for (let r = 0; r <= this.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * rowH);
      ctx.lineTo(S, r * rowH);
      ctx.stroke();
    }
  }

  _drawToken(ctx, x, y, r, p, isWin = false) {
    const color = p === 1 ? '#00f5ff' : '#ff2d6b';
    const glow = p === 1 ? 'rgba(0,245,255,0.5)' : 'rgba(255,45,107,0.5)';

    if (isWin) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.1, 0, Math.PI * 2);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.1, x, y, r);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.2, color);
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle neon ring
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  stop() { this.running = false; }
  pause() { if (!this.winner) this.running = !this.running; }
  restart() { this._initBoard(); this._updateStatus(); this._draw(); }
}
