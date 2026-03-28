/* ─────────────────────────────────────────────
   checkers.js – Neon Checkers
   ─────────────────────────────────────────────── */
'use strict';

class CheckersGame {
  constructor() {
    this._container = null;
    this.running = false;
    this.board = [];
    this.turn = 1; // 1: CyberBlue, 2: CyberPink
    this.selected = null;
  }

  mount(container) {
    this._container = container;
    this._init();
    this._buildUI();
  }

  _init() {
    this.board = Array.from({ length: 8 }, () => new Array(8).fill(0));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) if ((r + c) % 2) this.board[r][c] = 2;
    }
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < 8; c++) if ((r + c) % 2) this.board[r][c] = 1;
    }
    this.running = true;
  }

  _buildUI() {
    this._container.innerHTML = `
      <div id="checkers-root">
        <div class="checkers-board">
          ${this.board.flatMap((row, r) => row.map((cell, c) => `
            <div class="ch-cell ${(r+c)%2 ? 'dark' : 'light'}" data-r="${r}" data-c="${c}">
              ${cell ? `<div class="ch-piece p${cell}"></div>` : ''}
            </div>`)).join('')}
        </div>
      </div>`;
    this._container.querySelectorAll('.ch-cell').forEach(cell => {
      cell.onclick = () => this._onCellClick(+cell.dataset.r, +cell.dataset.c);
    });
  }

  _onCellClick(r, c) {
    if (!this.running) return;
    const piece = this.board[r][c];
    if (piece === this.turn) {
      this.selected = { r, c };
      this._updateSelection();
    } else if (this.selected) {
      this._move(r, c);
    }
  }

  _updateSelection() {
    this._container.querySelectorAll('.ch-cell').forEach(cell => {
        const r = +cell.dataset.r, c = +cell.dataset.c;
        cell.classList.toggle('selected', this.selected && this.selected.r === r && this.selected.c === c);
    });
  }

  _move(r, c) {
    const from = this.selected;
    if ((r+c)%2 && Math.abs(r - from.r) === 1 && Math.abs(c - from.c) === 1) {
        this.board[r][c] = this.turn;
        this.board[from.r][from.c] = 0;
        this.turn = this.turn === 1 ? 2 : 1;
        this.selected = null;
        this._buildUI();
        if (typeof Audio !== 'undefined') Audio.click();
    }
  }

  stop() { this.running = false; }
  pause() { this.running = !this.running; }
  restart() { this._init(); this._buildUI(); }
}
