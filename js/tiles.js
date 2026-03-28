/* ─────────────────────────────────────────────
   tiles.js – Neon Tiles (Piano Tiles Style)
   ─────────────────────────────────────────────── */
'use strict';

class TilesGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this._container = null;
    this.running = false;
    this.tiles = [];
    this.score = 0;
    this.speed = 5;
  }

  mount(container) {
    this._container = container;
    this._buildUI();
    this._init();
  }

  _buildUI() {
    this._container.innerHTML = `<canvas id="tiles-canvas" width="400" height="600"></canvas>`;
    this.canvas = this._container.querySelector('#tiles-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.addEventListener('mousedown', (e) => this._onClick(e));
  }

  _init() {
    this.tiles = []; this.score = 0; this.speed = 5;
    this.running = true;
    this._animate();
  }

  _onClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / 100);
    
    const hitIdx = this.tiles.findIndex(t => t.col === col && y > t.y && y < t.y + 150 && !t.hit);
    if (hitIdx !== -1) {
      this.tiles[hitIdx].hit = true;
      this.score++;
      MainApp.updateScore(this.score);
      this.speed += 0.05;
      if (typeof Audio !== 'undefined') Audio.click();
    } else {
      this._gameOver();
    }
  }

  _animate() {
    if (!this.running) return;
    this.ctx.fillStyle = '#08101a'; this.ctx.fillRect(0, 0, 400, 600);

    if (this.tiles.length === 0 || this.tiles[this.tiles.length-1].y > 0) {
      this.tiles.push({ col: Math.floor(Math.random()*4), y: -150, hit: false });
    }

    for (let i = this.tiles.length-1; i >= 0; i--) {
        const t = this.tiles[i];
        t.y += this.speed;
        this.ctx.fillStyle = t.hit ? 'rgba(0, 245, 255, 0.1)' : '#00f5ff';
        this.ctx.shadowBlur = t.hit ? 0 : 15; this.ctx.shadowColor = '#00f5ff';
        this.ctx.fillRect(t.col * 100, t.y, 100, 150);
        
        if (t.y > 600) {
            if (!t.hit) this._gameOver();
            else this.tiles.splice(i, 1);
        }
    }
    this.ctx.shadowBlur = 0;
    requestAnimationFrame(() => this._animate());
  }

  _gameOver() {
    this.running = false;
    if (typeof MainApp !== 'undefined') MainApp.gameOver('tiles', this.score, "You missed a tile!", false);
  }

  stop() { this.running = false; }
  pause() { this.running = !this.running; if(this.running) this._animate(); }
  restart() { this._init(); }
}
