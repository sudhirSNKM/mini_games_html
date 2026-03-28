/* ─────────────────────────────────────────────
   sudoku.js – Neon Sudoku (Puzzle)
   ─────────────────────────────────────────────── */
'use strict';

class SudokuGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this._container = null;
    this.running = false;
    this.grid = []; // Original full solved grid
    this.playerGrid = []; // User grid
    this.locked = []; // Pre-filled cells
    this.selected = { r: -1, c: -1 };
    this.difficulties = { easy: 30, medium: 45, hard: 55 };
    this.hintCount = 3;
    this.mistakes = 0;
    this.maxMistakes = 3;
    this.timer = 0;
    this.timerInterval = null;
  }

  mount(container) {
    this._container = container;
    this._buildUI();
    this._init('easy');
  }

  _buildUI() {
    this._container.innerHTML = `
      <div id="sudoku-root">
        <div class="sudoku-header">
          <div id="sudoku-timer" class="sudoku-stat">Time: 00:00</div>
          <div id="sudoku-mistakes" class="sudoku-stat">Mistakes: 0/3</div>
        </div>
        <div id="sudoku-board-wrap">
          <canvas id="sudoku-canvas" width="450" height="450"></canvas>
        </div>
        <div id="sudoku-numpad" class="sudoku-numpad">
          ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="numpad-btn" data-val="${n}">${n}</button>`).join('')}
          <button class="numpad-btn erase-btn" data-val="0">⌫</button>
        </div>
        <div class="sudoku-footer">
          <button id="sudoku-hint" class="btn-secondary sud-ctrl">💡 Hint (<span id="sudoku-hints-left">3</span>)</button>
          <button id="sudoku-new-game" class="btn-primary sud-ctrl">New Puzzle</button>
        </div>
      </div>`;
    
    this.canvas = this._container.querySelector('#sudoku-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.canvas.addEventListener('click', (e) => this._onCanvasClick(e));
    this._container.querySelectorAll('.numpad-btn').forEach(btn => {
      btn.addEventListener('click', () => this._handleInput(+btn.dataset.val));
    });

    this._container.querySelector('#sudoku-hint').addEventListener('click', () => this._giveHint());
    this._container.querySelector('#sudoku-new-game').addEventListener('click', () => this._init('easy'));

    window.addEventListener('keydown', (e) => {
      if (!this.running) return;
      if (e.key >= '1' && e.key <= '9') this._handleInput(+e.key);
      if (e.key === 'Backspace' || e.key === '0') this._handleInput(0);
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        this._handleArrowKeys(e.key);
      }
    });
  }

  _init(diff) {
    this.grid = this._generateFullGrid();
    this.playerGrid = this.grid.map(row => [...row]);
    this.locked = Array.from({ length: 9 }, () => new Array(9).fill(false));
    
    // Remove cells based on difficulty
    const cellsToRemove = this.difficulties[diff];
    let removed = 0;
    while (removed < cellsToRemove) {
      const r = Math.floor(Math.random() * 9);
      const c = Math.floor(Math.random() * 9);
      if (this.playerGrid[r][c] !== 0) {
        this.playerGrid[r][c] = 0;
        removed++;
      }
    }

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.playerGrid[r][c] !== 0) this.locked[r][c] = true;
      }
    }

    this.mistakes = 0;
    this.hintCount = 3;
    this.timer = 0;
    this.running = true;
    this.selected = { r: 4, c: 4 };

    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timer++;
      this._updateTimerDisplay();
    }, 1000);

    this._updateMistakesDisplay();
    this._updateHintsDisplay();
    this._draw();
  }

  _generateFullGrid() {
    const grid = Array.from({ length: 9 }, () => new Array(9).fill(0));
    const fill = (g) => {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (g[r][c] === 0) {
            const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
            for (let n of nums) {
              if (this._isValid(g, r, c, n)) {
                g[r][c] = n;
                if (fill(g)) return true;
                g[r][c] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    };
    fill(grid);
    return grid;
  }

  _isValid(g, r, c, n) {
    for (let i = 0; i < 9; i++) {
      if (g[r][i] === n || g[i][c] === n) return false;
    }
    const boxR = Math.floor(r / 3) * 3;
    const boxC = Math.floor(c / 3) * 3;
    for (let i = boxR; i < boxR + 3; i++) {
      for (let j = boxC; j < boxC + 3; j++) {
        if (g[i][j] === n) return false;
      }
    }
    return true;
  }

  _onCanvasClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = this.canvas.width / 9;
    this.selected.c = Math.floor(x / size);
    this.selected.r = Math.floor(y / size);
    this._draw();
  }

  _handleArrowKeys(key) {
    if (key === 'ArrowUp' && this.selected.r > 0) this.selected.r--;
    if (key === 'ArrowDown' && this.selected.r < 8) this.selected.r++;
    if (key === 'ArrowLeft' && this.selected.c > 0) this.selected.c--;
    if (key === 'ArrowRight' && this.selected.c < 8) this.selected.c++;
    this._draw();
  }

  _handleInput(val) {
    const { r, c } = this.selected;
    if (r === -1 || this.locked[r][c]) return;

    if (val === 0) {
      this.playerGrid[r][c] = 0;
      this._draw();
      return;
    }

    if (val === this.grid[r][c]) {
      this.playerGrid[r][c] = val;
      this._checkWin();
      if (typeof Audio !== 'undefined') Audio.click();
    } else {
      this.mistakes++;
      this._updateMistakesDisplay();
      if (this.mistakes >= this.maxMistakes) this._die();
    }
    this._draw();
  }

  _giveHint() {
    if (this.hintCount <= 0) return;
    const emptyCells = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.playerGrid[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0) {
      const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.playerGrid[cell.r][cell.c] = this.grid[cell.r][cell.c];
      this.locked[cell.r][cell.c] = true;
      this.hintCount--;
      this._updateHintsDisplay();
      this._draw();
      this._checkWin();
    }
  }

  _updateTimerDisplay() {
    const m = Math.floor(this.timer / 60).toString().padStart(2, '0');
    const s = (this.timer % 60).toString().padStart(2, '0');
    this._container.querySelector('#sudoku-timer').textContent = `Time: ${m}:${s}`;
  }

  _updateMistakesDisplay() {
    this._container.querySelector('#sudoku-mistakes').textContent = `Mistakes: ${this.mistakes}/3`;
  }

  _updateHintsDisplay() {
    this._container.querySelector('#sudoku-hints-left').textContent = this.hintCount;
  }

  _checkWin() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.playerGrid[r][c] !== this.grid[r][c]) return;
      }
    }
    this.running = false;
    clearInterval(this.timerInterval);
    if (typeof MainApp !== 'undefined') {
      const score = Math.max(10, 1000 - this.timer);
      MainApp.gameOver('sudoku', score, `Puzzle Solved in ${this.timer}s!`, true);
    }
  }

  _die() {
    this.running = false;
    clearInterval(this.timerInterval);
    if (typeof MainApp !== 'undefined') {
      MainApp.gameOver('sudoku', 0, "Too many mistakes!", false);
    }
  }

  _draw() {
    const ctx = this.ctx;
    const S = this.canvas.width;
    const gap = S / 9;
    
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, S, S);

    // Highlight selected cell row/column
    if (this.selected.r !== -1) {
      ctx.fillStyle = 'rgba(0, 245, 255, 0.05)';
      ctx.fillRect(0, this.selected.r * gap, S, gap);
      ctx.fillRect(this.selected.c * gap, 0, gap, S);
    }

    // Highlight selected cell
    if (this.selected.r !== -1) {
      ctx.fillStyle = 'rgba(0, 245, 255, 0.15)';
      ctx.fillRect(this.selected.c * gap, this.selected.r * gap, gap, gap);
    }

    // Lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i <= 9; i++) {
      if (i % 3 === 0) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0, 245, 255, 0.4)';
      } else {
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      }
      ctx.beginPath(); ctx.moveTo(i * gap, 0); ctx.lineTo(i * gap, S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * gap); ctx.lineTo(S, i * gap); ctx.stroke();
    }

    // Numbers
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `italic ${gap * 0.5}px Orbitron`;
    
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const n = this.playerGrid[r][c];
        if (n !== 0) {
          ctx.fillStyle = this.locked[r][c] ? '#fff' : '#00f5ff';
          if (this.locked[r][c]) {
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#fff';
          } else {
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00f5ff';
          }
          ctx.fillText(n, c * gap + gap / 2, r * gap + gap / 2);
          ctx.shadowBlur = 0;
        }
      }
    }
  }

  stop() { this.running = false; clearInterval(this.timerInterval); }
  pause() { 
    this.running = !this.running; 
    if (this.running) {
      this.timerInterval = setInterval(() => { this.timer++; this._updateTimerDisplay(); }, 1000);
    } else {
      clearInterval(this.timerInterval);
    }
  }
  restart() { this._init('easy'); }
}
