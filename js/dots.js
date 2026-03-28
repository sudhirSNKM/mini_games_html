/* ─────────────────────────────────────────────
   dots.js – Neon Dots (Dots & Boxes)
   ─────────────────────────────────────────────── */
'use strict';

class DotsGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this._container = null;
    this.running = false;
    this.gridSize = 5;
    this.lines = []; // { r, c, type: 'h'|'v', p: 1|2 }
    this.boxes = []; // { r, c, p: 1|2 }
    this.turn = 1;
    this.scores = [0, 0];
  }

  mount(container) {
    this._container = container;
    this._buildUI();
    this._init();
  }

  _buildUI() {
    this._container.innerHTML = `<canvas id="dots-canvas" width="400" height="400"></canvas>`;
    this.canvas = this._container.querySelector('#dots-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.onclick = (e) => this._onClick(e);
  }

  _init() {
    this.lines = []; this.boxes = []; this.turn = 1; this.scores = [0, 0];
    this.running = true;
    this._draw();
  }

  _onClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gap = 400 / this.gridSize;
    
    // Find closest edge
    let bestLine = null;
    let minDist = 15;
    
    for (let r = 0; r <= this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        // Horiz
        const d = Math.abs(y - r * gap) + Math.abs(x - (c * gap + gap/2));
        if (d < minDist) {
          const exists = this.lines.find(l => l.r === r && l.c === c && l.type === 'h');
          if (!exists) bestLine = { r, c, type: 'h' };
        }
        // Vert
        const dv = Math.abs(x - r * gap) + Math.abs(y - (c * gap + gap/2));
        if (dv < minDist) {
          const exists = this.lines.find(l => l.r === c && l.c === r && l.type === 'v');
          if (!exists) bestLine = { r: c, c: r, type: 'v' };
        }
      }
    }

    if (bestLine) {
      bestLine.p = this.turn;
      this.lines.push(bestLine);
      const scored = this._checkBoxes();
      if (!scored) this.turn = this.turn === 1 ? 2 : 1;
      this._draw();
      if (typeof Audio !== 'undefined') Audio.click();
    }
  }

  _checkBoxes() {
    let gained = false;
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const top = this.lines.find(l => l.r === r && l.c === c && l.type === 'h');
        const bot = this.lines.find(l => l.r === r + 1 && l.c === c && l.type === 'h');
        const left = this.lines.find(l => l.r === r && l.c === c && l.type === 'v');
        const right = this.lines.find(l => l.r === r && l.c === c + 1 && l.type === 'v');
        
        if (top && bot && left && right) {
          const exists = this.boxes.find(b => b.r === r && b.c === c);
          if (!exists) {
            this.boxes.push({ r, c, p: this.turn });
            this.scores[this.turn - 1]++;
            gained = true;
          }
        }
      }
    }
    return gained;
  }

  _draw() {
    const gap = 400 / this.gridSize;
    this.ctx.fillStyle = '#080b14'; this.ctx.fillRect(0, 0, 400, 400);

    this.boxes.forEach(b => {
      this.ctx.fillStyle = b.p === 1 ? 'rgba(0, 245, 255, 0.2)' : 'rgba(255, 45, 107, 0.2)';
      this.ctx.fillRect(b.c * gap + 5, b.r * gap + 5, gap - 10, gap - 10);
    });

    this.lines.forEach(l => {
      this.ctx.strokeStyle = l.p === 1 ? '#00f5ff' : '#ff2d6b';
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      if (l.type === 'h') { this.ctx.moveTo(l.c * gap, l.r * gap); this.ctx.lineTo((l.c+1) * gap, l.r * gap); }
      else { this.ctx.moveTo(l.c * gap, l.r * gap); this.ctx.lineTo(l.c * gap, (l.r+1) * gap); }
      this.ctx.stroke();
    });

    this.ctx.fillStyle = '#fff';
    for (let r = 0; r <= this.gridSize; r++) {
      for (let c = 0; c <= this.gridSize; c++) {
        this.ctx.beginPath(); this.ctx.arc(c * gap, r * gap, 3, 0, Math.PI*2); this.ctx.fill();
      }
    }
  }

  stop() { this.running = false; }
  pause() { this.running = !this.running; }
  restart() { this._init(); }
}
