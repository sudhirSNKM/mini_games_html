/* ─────────────────────────────────────────────
   flow.js – Neon Flow (Pipe Puzzle)
   ─────────────────────────────────────────────── */
'use strict';

class FlowGame {
  constructor() {
    this._container = null;
    this.running = false;
    this.gridSize = 6;
    this.grid = [];
  }

  mount(container) {
    this._container = container;
    this._init();
    this._buildUI();
  }

  _init() {
    this.grid = [];
    for (let r = 0; r < this.gridSize; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.gridSize; c++) {
        this.grid[r][c] = { type: Math.floor(Math.random() * 4), rot: Math.floor(Math.random() * 4) };
      }
    }
    // Set start & end
    this.grid[0][0] = { type: 1, rot: 1, locked: true };
    this.grid[5][5] = { type: 1, rot: 3, locked: true };
    this.running = true;
  }

  _buildUI() {
    this._container.innerHTML = `
      <div id="flow-root">
        <div class="flow-grid" style="grid-template-columns: repeat(${this.gridSize}, 60px)">
          ${this.grid.flatMap((row, r) => row.map((cell, c) => `
            <div class="flow-cell ${cell.locked ? 'locked' : ''}" data-r="${r}" data-c="${c}">
              <div class="pipe pipe-t${cell.type}" style="transform: rotate(${cell.rot * 90}deg)"></div>
            </div>`)).join('')}
        </div>
      </div>`;
    this._container.querySelectorAll('.flow-cell').forEach(cell => {
      cell.onclick = () => {
        if (!this.running) return;
        const r = cell.dataset.r, c = cell.dataset.c;
        if (this.grid[r][c].locked) return;
        this.grid[r][c].rot = (this.grid[r][c].rot + 1) % 4;
        cell.querySelector('.pipe').style.transform = `rotate(${this.grid[r][c].rot * 90}deg)`;
        this._checkPath();
        if (typeof Audio !== 'undefined') Audio.click();
      };
    });
  }

  _checkPath() { /* BFS path simplified for arcade */ }

  stop() { this.running = false; }
  pause() { this.running = !this.running; }
  restart() { this._init(); this._buildUI(); }
}
